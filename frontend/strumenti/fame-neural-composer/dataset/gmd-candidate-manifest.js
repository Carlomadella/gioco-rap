"use strict";

const crypto = require("node:crypto");
const { buildGmdMetadataIndex } = require("./gmd-metadata");

const TASK_SPLITS = Object.freeze(["train", "validation", "test"]);
const TARGET_RATIOS = Object.freeze({ train: 0.8, validation: 0.1, test: 0.1 });

function increment(target, key, amount = 1) {
  const normalized = key == null || key === "" ? "(missing)" : String(key);
  target[normalized] = (target[normalized] || 0) + amount;
}

function sortedCounter(counter) {
  return Object.fromEntries(
    Object.entries(counter).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  );
}

function isEvalSession(record) {
  return /(?:^|\/)eval[_-]session$/i.test(String(record && record.session || ""));
}

function sourcePool(record) {
  if (record.timeSignature.raw !== "4-4") return "non-4/4";
  return record.beatType === "beat" ? "general-beat-4/4" : "fill-4/4";
}

function targetCounts(total) {
  return {
    train: total * TARGET_RATIOS.train,
    validation: total * TARGET_RATIOS.validation,
    test: total * TARGET_RATIOS.test
  };
}

function groupRecords(records, keyFn) {
  const groups = new Map();
  for (const record of records) {
    const key = String(keyFn(record) || "");
    if (!key) throw new Error(`group key mancante per ${record.recordId}`);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return groups;
}

function deterministicTie(seed, value) {
  return crypto.createHash("sha256").update(`${seed}:${value}`).digest("hex");
}

function assignSessionGrouped(records, seed = "fame-neural-7d-block2-session-v1") {
  const groups = groupRecords(records, record => record.session);
  const target = targetCounts(records.length);
  const counts = { train: 0, validation: 0, test: 0 };
  const assignments = new Map();

  const ordered = [...groups.entries()]
    .map(([key, rows]) => ({ key, rows, tie: deterministicTie(seed, key) }))
    .sort((a, b) => b.rows.length - a.rows.length || a.tie.localeCompare(b.tie));

  for (const group of ordered) {
    let best = null;
    for (const split of TASK_SPLITS) {
      let delta = 0;
      for (const candidateSplit of TASK_SPLITS) {
        const before = counts[candidateSplit] - target[candidateSplit];
        const afterCount = counts[candidateSplit] + (candidateSplit === split ? group.rows.length : 0);
        const after = afterCount - target[candidateSplit];
        delta += (after * after) - (before * before);
      }
      const candidate = {
        split,
        delta,
        underTarget: counts[split] < target[split],
        tie: deterministicTie(seed, `${group.key}:${split}`)
      };
      if (!best ||
          candidate.delta < best.delta ||
          (candidate.delta === best.delta && candidate.underTarget && !best.underTarget) ||
          (candidate.delta === best.delta && candidate.underTarget === best.underTarget &&
            candidate.tie.localeCompare(best.tie) < 0)) {
        best = candidate;
      }
    }
    assignments.set(group.key, best.split);
    counts[best.split] += group.rows.length;
  }

  return { groupKey: "session", assignments, groupCount: groups.size, counts };
}

function distribution(records) {
  const out = {
    records: records.length,
    beatType: {},
    stylePrimary: {},
    sourceSplit: {},
    drummer: {},
    session: {}
  };
  for (const record of records) {
    increment(out.beatType, record.beatType);
    increment(out.stylePrimary, record.style.primary);
    increment(out.sourceSplit, record.sourceSplit);
    increment(out.drummer, record.drummer);
    increment(out.session, record.session);
  }
  for (const key of ["beatType", "stylePrimary", "sourceSplit", "drummer", "session"]) {
    out[key] = sortedCounter(out[key]);
  }
  return out;
}

function splitDistribution(records, recordToSplit) {
  return Object.fromEntries(TASK_SPLITS.map(split => [
    split,
    distribution(records.filter(record => recordToSplit(record) === split))
  ]));
}

function beatShare(rows) {
  return rows.length ? rows.filter(record => record.beatType === "beat").length / rows.length : 0;
}

function drummerCandidateScore(records, validationDrummer, testDrummer) {
  const assignments = new Map();
  const drummers = [...new Set(records.map(record => record.drummer))].sort();
  for (const drummer of drummers) {
    assignments.set(
      drummer,
      drummer === validationDrummer ? "validation" : drummer === testDrummer ? "test" : "train"
    );
  }

  const target = targetCounts(records.length);
  const globalBeatShare = beatShare(records);
  const splitRows = Object.fromEntries(TASK_SPLITS.map(split => [
    split,
    records.filter(record => assignments.get(record.drummer) === split)
  ]));

  const deviations = TASK_SPLITS.map(split => Math.abs(splitRows[split].length - target[split]));
  const beatDeviations = TASK_SPLITS.map(split => Math.abs(beatShare(splitRows[split]) - globalBeatShare));
  const allStyles = new Set(records.map(record => record.style.primary));
  const missingStyles = TASK_SPLITS.reduce((sum, split) => {
    const present = new Set(splitRows[split].map(record => record.style.primary));
    return sum + [...allStyles].filter(style => !present.has(style)).length;
  }, 0);

  return {
    validationDrummer,
    testDrummer,
    scoreTuple: [
      Math.max(...deviations),
      deviations.reduce((sum, value) => sum + value, 0),
      Math.max(...beatDeviations),
      missingStyles,
      `${validationDrummer}|${testDrummer}`
    ],
    assignments,
    counts: Object.fromEntries(TASK_SPLITS.map(split => [split, splitRows[split].length]))
  };
}

function compareScoreTuple(a, b) {
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (typeof a[index] === "number" && typeof b[index] === "number") {
      if (a[index] !== b[index]) return a[index] - b[index];
    } else {
      const cmp = String(a[index]).localeCompare(String(b[index]));
      if (cmp) return cmp;
    }
  }
  return a.length - b.length;
}

function assignDrummerHeldOut(records) {
  const drummers = [...new Set(records.map(record => record.drummer))].sort();
  if (drummers.length < 3) throw new Error("drummer-held-out richiede almeno 3 drummer");

  const candidates = [];
  for (const validationDrummer of drummers) {
    for (const testDrummer of drummers) {
      if (validationDrummer === testDrummer) continue;
      candidates.push(drummerCandidateScore(records, validationDrummer, testDrummer));
    }
  }
  candidates.sort((a, b) => compareScoreTuple(a.scoreTuple, b.scoreTuple));
  const representative = candidates[0];

  return {
    groupKey: "drummer",
    groupCount: drummers.length,
    assignments: representative.assignments,
    counts: representative.counts,
    representative: {
      validationDrummer: representative.validationDrummer,
      testDrummer: representative.testDrummer,
      scoreTuple: representative.scoreTuple
    },
    ranking: candidates.map((candidate, index) => ({
      rank: index + 1,
      validationDrummer: candidate.validationDrummer,
      testDrummer: candidate.testDrummer,
      counts: candidate.counts,
      scoreTuple: candidate.scoreTuple
    }))
  };
}

function auditGroupIsolation(records, recordToSplit, keyFn) {
  const groups = new Map();
  for (const record of records) {
    const key = keyFn(record);
    const split = recordToSplit(record);
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(split);
  }
  const leaking = [...groups.entries()]
    .filter(([, splits]) => splits.size > 1)
    .map(([key, splits]) => ({ key, splits: [...splits].sort() }))
    .sort((a, b) => String(a.key).localeCompare(String(b.key)));
  return {
    groupCount: groups.size,
    crossTaskSplitGroupCount: leaking.length,
    examples: leaking.slice(0, 12),
    ok: leaking.length === 0
  };
}

function strategyReport(name, records, groupAssignment, keyFn) {
  const recordToSplit = record => groupAssignment.assignments.get(keyFn(record));
  const bySplit = splitDistribution(records, recordToSplit);
  return {
    name,
    groupKey: groupAssignment.groupKey,
    groupCount: groupAssignment.groupCount,
    targetRatios: TARGET_RATIOS,
    recordCounts: Object.fromEntries(TASK_SPLITS.map(split => [split, bySplit[split].records])),
    distributionByTaskSplit: bySplit,
    isolation: auditGroupIsolation(records, recordToSplit, keyFn)
  };
}

function manifestDigest(records) {
  const payload = records.map(record => [
    record.recordId,
    record.sourceSplit,
    record.pool,
    record.holdoutStatus,
    record.taskSplitCandidates.sessionGrouped,
    record.taskSplitCandidates.drummerHeldOut
  ]);
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function buildGmdCandidateManifest(csvText) {
  const parsed = buildGmdMetadataIndex(csvText);
  if (parsed.errors.length) {
    throw new Error(`info.csv non valido: ${JSON.stringify(parsed.errors.slice(0, 5))}`);
  }
  const records = [...parsed.index.values()].sort((a, b) => a.recordId.localeCompare(b.recordId));
  if (records.length !== parsed.rows) {
    throw new Error(`record coverage mismatch: rows=${parsed.rows}, valid=${records.length}`);
  }

  const evalRecords = records.filter(isEvalSession);
  const eligible = records.filter(record => !isEvalSession(record) && record.timeSignature.raw === "4-4");
  const sessionGrouped = assignSessionGrouped(eligible);
  const drummerHeldOut = assignDrummerHeldOut(eligible);

  const manifestRecords = records.map(record => {
    const evalHoldout = isEvalSession(record);
    const eligibleForCandidateSplit = !evalHoldout && record.timeSignature.raw === "4-4";
    return {
      recordId: record.recordId,
      midiFilename: record.midiFilename,
      drummer: record.drummer,
      session: record.session,
      style: record.style,
      bpm: record.bpm,
      beatType: record.beatType,
      timeSignature: record.timeSignature,
      sourceSplit: record.sourceSplit,
      sourceSplitRole: "source-reference-only",
      pool: sourcePool(record),
      holdoutStatus: evalHoldout ? "benchmark-holdout-candidate" : "none",
      eligibleForCandidateSplit,
      taskSplitCandidates: {
        sessionGrouped: evalHoldout ? "holdout" :
          eligibleForCandidateSplit ? sessionGrouped.assignments.get(record.session) : "not-assigned",
        drummerHeldOut: evalHoldout ? "holdout" :
          eligibleForCandidateSplit ? drummerHeldOut.assignments.get(record.drummer) : "not-assigned"
      }
    };
  });

  const pools = {
    generalBeat44: manifestRecords.filter(record =>
      record.pool === "general-beat-4/4" && record.holdoutStatus === "none").length,
    fill44: manifestRecords.filter(record =>
      record.pool === "fill-4/4" && record.holdoutStatus === "none").length,
    non44: manifestRecords.filter(record =>
      record.pool === "non-4/4" && record.holdoutStatus === "none").length,
    evalSessionHoldout: evalRecords.length,
    eligible44NonEval: eligible.length
  };

  const sessionReport = strategyReport("session-grouped", eligible, sessionGrouped, record => record.session);
  const drummerReport = strategyReport("drummer-held-out", eligible, drummerHeldOut, record => record.drummer);
  drummerReport.representative = drummerHeldOut.representative;
  drummerReport.ranking = drummerHeldOut.ranking;

  const manifest = {
    schema: "fame-neural-gmd-candidate-manifest-v1",
    version: 1,
    datasetId: "gmd-v1.0.0",
    role: "GENERAL_HUMAN_GROOVE_PRETRAIN",
    status: "candidate-only-no-training-authority",
    sourceSplitRole: "source-reference-only",
    taskSplitRole: "candidate-evaluation-only",
    policy: {
      baselineMeter: "4-4",
      evalSession: "benchmark-holdout-candidate",
      beatTypeSemantics: "source-label-only-not-core-fill-ground-truth",
      targetRatios: TARGET_RATIOS
    },
    totals: { csvRows: parsed.rows, records: manifestRecords.length },
    pools,
    strategies: {
      sessionGrouped: sessionReport,
      drummerHeldOut: drummerReport
    },
    records: manifestRecords
  };

  manifest.checks = {
    fullRecordCoverage: manifestRecords.length === parsed.rows,
    poolAccounting: pools.generalBeat44 + pools.fill44 === pools.eligible44NonEval,
    evalHoldoutPreserved:
      manifestRecords.filter(record => record.holdoutStatus === "benchmark-holdout-candidate").length === evalRecords.length &&
      manifestRecords.filter(record => record.holdoutStatus === "benchmark-holdout-candidate")
        .every(record => Object.values(record.taskSplitCandidates).every(value => value === "holdout")),
    sourceTaskSplitSeparated:
      manifestRecords.every(record => record.sourceSplitRole === "source-reference-only" && !!record.sourceSplit),
    sessionIsolation: sessionReport.isolation.ok,
    drummerIsolation: drummerReport.isolation.ok,
    sessionSplitsNonEmpty: TASK_SPLITS.every(split => sessionReport.recordCounts[split] > 0),
    drummerSplitsNonEmpty: TASK_SPLITS.every(split => drummerReport.recordCounts[split] > 0)
  };

  manifest.digest = { algorithm: "sha256", value: manifestDigest(manifestRecords) };
  manifest.readyForPolicyComparison = Object.values(manifest.checks).every(Boolean);
  return manifest;
}

function buildCandidateReport(manifest) {
  return {
    schema: "fame-neural-gmd-phase7d-block2-report-v1",
    version: 1,
    datasetId: manifest.datasetId,
    role: manifest.role,
    status: manifest.status,
    totals: manifest.totals,
    pools: manifest.pools,
    strategies: manifest.strategies,
    checks: manifest.checks,
    digest: manifest.digest,
    readyForPolicyComparison: manifest.readyForPolicyComparison,
    decision: "none-selected-by-block2-builder"
  };
}

module.exports = {
  TASK_SPLITS,
  TARGET_RATIOS,
  isEvalSession,
  sourcePool,
  assignSessionGrouped,
  assignDrummerHeldOut,
  auditGroupIsolation,
  buildGmdCandidateManifest,
  buildCandidateReport
};
