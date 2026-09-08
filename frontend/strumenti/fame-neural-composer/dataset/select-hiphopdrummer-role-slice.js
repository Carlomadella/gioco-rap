"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const REPORT_SCHEMA = "fame-neural-hiphopdrummer-role-slice-v1";

function isPhraseFile(name) {
  return /\.phrase-item\.json$/i.test(name);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readEntries(dir) {
  return fs.readdirSync(dir).filter(isPhraseFile).sort().map(fileName => {
    const filePath = path.join(dir, fileName);
    const item = readJson(filePath);
    const sourceId = String(item && item.provenance && item.provenance.sourceId || "");
    const parts = sourceId.split(":");
    const kind = parts[0] === "hiphopdrummer" ? parts[1] : "unknown";
    const family = String(item && item.provenance && item.provenance.compositionFamily || "unknown");
    const rank = crypto.createHash("sha256")
      .update(`hhd-role-slice-v1|${kind}|${family}|${String(item && item.phraseId || "")}`)
      .digest("hex");
    const events = item && item.canonical && Array.isArray(item.canonical.events) ? item.canonical.events : [];
    const has808 = events.some(event => event && event.type === "808");
    const hasLead = events.some(event => event && event.type === "lead");
    const hasDrums = events.some(event => ["kick","snare","clap","hat_closed","hat_open","perc"].includes(String(event && event.type || "")));
    return { fileName, filePath, item, sourceId, kind, family, rank, has808, hasLead, hasDrums };
  });
}

function familyFirst(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.family)) groups.set(entry.family, []);
    groups.get(entry.family).push(entry);
  }
  for (const list of groups.values()) list.sort((a, b) => a.rank.localeCompare(b.rank));

  const families = [...groups.keys()].sort((a, b) => {
    const ar = groups.get(a)[0].rank;
    const br = groups.get(b)[0].rank;
    return ar.localeCompare(br) || a.localeCompare(b);
  });

  const ordered = [];
  let depth = 0;
  while (true) {
    let added = 0;
    for (const family of families) {
      const entry = groups.get(family)[depth];
      if (!entry) continue;
      ordered.push(entry);
      added += 1;
    }
    if (!added) break;
    depth += 1;
  }
  return ordered;
}

function computeMaxSourcePhrases(baseCount, maxShare) {
  if (!(baseCount > 0)) throw new Error("baseCount deve essere > 0");
  if (!(maxShare > 0 && maxShare < 1)) throw new Error("maxShare deve essere tra 0 e 1");
  return Math.floor((maxShare * baseCount) / (1 - maxShare));
}

function targetsFromInventory(inventory, config, attemptIndex) {
  const attempt = config.slice.attempts[attemptIndex];
  if (!attempt) throw new Error(`slice attempt ${attemptIndex} non configurato`);
  const role = inventory.roleCoverage || {};
  const gate = config.gateTargets;

  return {
    need808: Math.max(0, Number(gate["808"]) - Number(role["808"] || 0)),
    needLead: Math.max(0, Number(gate.lead) - Number(role.lead || 0)),
    needDrums: Math.max(0, Number(gate.drums) - Number(role.drums || 0)),
    desired808: Math.max(0, Number(gate["808"]) - Number(role["808"] || 0)) + Number(attempt.buffer808 || 0),
    desiredLead: Math.max(0, Number(gate.lead) - Number(role.lead || 0)) + Number(attempt.bufferLead || 0),
    desiredDrums: Math.max(0, Number(gate.drums) - Number(role.drums || 0)) + Number(attempt.bufferDrums || 0)
  };
}

function selectRoleSlice(baseDir, hhdDir, baseInventoryPath, config, outputDir, reportPath, attemptIndex = 0) {
  const baseEntries = readEntries(baseDir);
  const hhdEntries = readEntries(hhdDir);
  const inventory = readJson(baseInventoryPath);
  const targets = targetsFromInventory(inventory, config, attemptIndex);
  const maxHhd = computeMaxSourcePhrases(baseEntries.length, Number(config.slice.maxPhraseShare));

  const h808 = familyFirst(hhdEntries.filter(x => x.kind === "808" && x.has808 && x.hasDrums));
  const lead = familyFirst(hhdEntries.filter(x => x.kind === "lead" && x.hasLead && x.hasDrums));

  const selected = [];
  const selectedIds = new Set();

  function take(list, count) {
    for (const entry of list) {
      if (selected.length >= maxHhd || count <= 0) break;
      const id = entry.item && entry.item.phraseId;
      if (selectedIds.has(id)) continue;
      selected.push(entry);
      selectedIds.add(id);
      count -= 1;
    }
  }

  take(h808, targets.desired808);
  take(lead, targets.desiredLead);

  // If role-specific buffers still do not cover the drum deficit, fill from the
  // remaining role-bearing material, alternating deterministic ranks.
  let projectedDrums = selected.filter(x => x.hasDrums).length;
  if (projectedDrums < targets.desiredDrums) {
    const leftovers = familyFirst(
      [...h808, ...lead].filter(entry => !selectedIds.has(entry.item && entry.item.phraseId))
    );
    take(leftovers, targets.desiredDrums - projectedDrums);
  }

  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  for (const entry of selected) fs.copyFileSync(entry.filePath, path.join(outputDir, entry.fileName));

  const selected808 = selected.filter(x => x.has808).length;
  const selectedLead = selected.filter(x => x.hasLead).length;
  const selectedDrums = selected.filter(x => x.hasDrums).length;
  const projectedTotal = baseEntries.length + selected.length;
  const share = projectedTotal ? selected.length / projectedTotal : 0;

  const report = {
    schema: REPORT_SCHEMA,
    version: 1,
    attemptIndex,
    policy: {
      maxPhraseShare: config.slice.maxPhraseShare,
      strategy: "role-deficit + buffer; family-first deterministic; no phrase-target inflation"
    },
    targets,
    totals: {
      basePhrases: baseEntries.length,
      hhdAvailable: hhdEntries.length,
      hhd808Available: h808.length,
      hhdLeadAvailable: lead.length,
      maxHhdByShare: maxHhd,
      selected: selected.length,
      selected808,
      selectedLead,
      selectedDrums,
      projectedGlobalPhrases: projectedTotal,
      projectedHhdShare: share,
      compositionFamiliesSelected: new Set(selected.map(x => x.family)).size
    }
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (selected808 < targets.need808) throw new Error(`HHD slice non copre deficit 808: ${selected808}/${targets.need808}`);
  if (selectedLead < targets.needLead) throw new Error(`HHD slice non copre deficit lead: ${selectedLead}/${targets.needLead}`);
  if (selectedDrums < targets.needDrums) throw new Error(`HHD slice non copre deficit drums: ${selectedDrums}/${targets.needDrums}`);
  if (share > Number(config.slice.maxPhraseShare) + 1e-12) throw new Error(`HHD share ${share} supera cap ${config.slice.maxPhraseShare}`);

  return report;
}

function main(argv = process.argv.slice(2)) {
  const [baseDir, hhdDir, baseInventoryPath, configPath, outputDir, reportPath, attemptRaw] = argv;
  if (!baseDir || !hhdDir || !baseInventoryPath || !configPath || !outputDir || !reportPath) {
    console.error("Uso: node select-hiphopdrummer-role-slice.js <base-dir> <hhd-dir> <base-inventory.json> <config.json> <output-dir> <report.json> [attempt=0]");
    process.exitCode = 64;
    return;
  }
  try {
    const config = readJson(configPath);
    const report = selectRoleSlice(baseDir, hhdDir, baseInventoryPath, config, outputDir, reportPath, Number(attemptRaw) || 0);
    console.log(`HHD slice attempt: ${report.attemptIndex + 1}`);
    console.log(`HHD selected total/808/lead/drums: ${report.totals.selected}/${report.totals.selected808}/${report.totals.selectedLead}/${report.totals.selectedDrums}`);
    console.log(`HHD projected share: ${(report.totals.projectedHhdShare * 100).toFixed(2)}%`);
    console.log(`Report: ${reportPath}`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  REPORT_SCHEMA,
  isPhraseFile,
  readEntries,
  familyFirst,
  computeMaxSourcePhrases,
  targetsFromInventory,
  selectRoleSlice,
  main
};
