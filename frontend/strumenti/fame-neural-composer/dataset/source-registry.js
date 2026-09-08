"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const REGISTRY_SCHEMA = "fame-neural-source-registry-v1";
const ADAPTER_SCHEMA = "fame-neural-source-adapter-config-v1";
const STATUS = new Set(["green", "yellow", "red"]);
const VERIFY = new Set(["verified", "pending", "blocked"]);
const TRAINING_BASES = new Set([
  "explicit-license",
  "public-domain",
  "owned-generated-output",
  "internal-original",
  "pending-verification",
  "pending-explicit-permission",
  "pending-operational-review",
  "unknown-provenance",
  "provenance-risk",
  "non-commercial-license"
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sourceMap(registry) {
  return new Map((registry.sources || []).map(source => [source.id, source]));
}

function validateAsset(source, asset, errors) {
  const prefix = `${source.id}/asset:${asset && asset.id || "unknown"}`;
  if (!nonEmpty(asset && asset.id)) errors.push(`${prefix}: id obbligatorio`);
  if (!nonEmpty(asset && asset.name)) errors.push(`${prefix}: name obbligatorio`);
  if (!nonEmpty(asset && asset.url)) errors.push(`${prefix}: url obbligatorio`);
  if (!asset || !asset.hash || !["sha256", "md5"].includes(String(asset.hash.algorithm || "").toLowerCase())) {
    errors.push(`${prefix}: hash algorithm deve essere sha256 o md5`);
  }
  if (!nonEmpty(asset && asset.hash && asset.hash.value)) {
    errors.push(`${prefix}: hash value obbligatorio`);
  }
}

function validateSource(source, ids, errors, warnings) {
  const id = String(source && source.id || "");
  if (!nonEmpty(id)) {
    errors.push("source.id obbligatorio");
    return;
  }
  if (ids.has(id)) errors.push(`${id}: id duplicato`);
  ids.add(id);

  if (!STATUS.has(source.status)) errors.push(`${id}: status non valido`);
  if (!nonEmpty(source.stratum)) errors.push(`${id}: stratum obbligatorio`);
  if (!Array.isArray(source.dataKinds) || !source.dataKinds.length) errors.push(`${id}: dataKinds obbligatorio`);
  if (!Array.isArray(source.roles)) errors.push(`${id}: roles deve essere array`);
  if (!nonEmpty(source.originClass)) errors.push(`${id}: originClass obbligatorio`);
  if (!nonEmpty(source.creator)) errors.push(`${id}: creator obbligatorio`);

  const rights = source.rights || {};
  if (typeof rights.commercialTrainingAllowed !== "boolean") {
    errors.push(`${id}: rights.commercialTrainingAllowed boolean obbligatorio`);
  }
  if (typeof rights.commercialOutputAllowed !== "boolean") {
    errors.push(`${id}: rights.commercialOutputAllowed boolean obbligatorio`);
  }
  if (!TRAINING_BASES.has(rights.trainingBasis)) {
    errors.push(`${id}: rights.trainingBasis non valido`);
  }

  const verification = source.verification || {};
  if (!VERIFY.has(verification.level)) errors.push(`${id}: verification.level non valido`);
  if (!Array.isArray(verification.evidence) || verification.evidence.filter(nonEmpty).length < 1) {
    errors.push(`${id}: almeno una verification evidence obbligatoria`);
  }

  const download = source.download || {};
  if (typeof download.autoDownload !== "boolean") {
    errors.push(`${id}: download.autoDownload boolean obbligatorio`);
  }
  if (!Array.isArray(download.assets)) errors.push(`${id}: download.assets deve essere array`);

  for (const asset of download.assets || []) validateAsset(source, asset, errors);

  if (source.status === "green") {
    if (verification.level !== "verified") errors.push(`${id}: GREEN richiede verification.level=verified`);
    if (rights.commercialTrainingAllowed !== true) errors.push(`${id}: GREEN richiede commercialTrainingAllowed=true`);
    if (rights.commercialOutputAllowed !== true) errors.push(`${id}: GREEN richiede commercialOutputAllowed=true`);
    if (String(rights.trainingBasis || "").startsWith("pending")) {
      errors.push(`${id}: GREEN non puo' avere trainingBasis pending`);
    }
  }

  if (source.status === "yellow" && download.autoDownload === true) {
    errors.push(`${id}: YELLOW non puo' essere autoDownload`);
  }

  if (source.status === "red") {
    if (rights.commercialTrainingAllowed !== false) errors.push(`${id}: RED deve bloccare commercialTraining`);
    if (download.autoDownload === true) errors.push(`${id}: RED non puo' essere autoDownload`);
  }

  if (download.autoDownload && !(download.assets || []).length) {
    errors.push(`${id}: autoDownload richiede almeno un asset pin-hashato`);
  }

  if (source.status === "green" && source.pipeline && source.pipeline.currentSymbolic === true &&
      source.originClass === "external_synthetic") {
    warnings.push(`${id}: synthetic external source; monitorare quota nel training corpus`);
  }
}

function validateRegistry(registry) {
  const errors = [];
  const warnings = [];
  if (!registry || registry.schema !== REGISTRY_SCHEMA) errors.push(`schema atteso ${REGISTRY_SCHEMA}`);
  if (!Number.isInteger(registry && registry.version) || registry.version < 1) errors.push("version intera >=1 obbligatoria");
  if (!registry || !registry.policy || registry.policy.repoStorageAllowed !== false) {
    errors.push("policy.repoStorageAllowed deve essere false");
  }
  if (!Array.isArray(registry && registry.sources) || !registry.sources.length) {
    errors.push("sources non puo' essere vuoto");
  }

  const ids = new Set();
  for (const source of registry && registry.sources || []) validateSource(source, ids, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totals: {
      sources: ids.size,
      green: (registry.sources || []).filter(x => x.status === "green").length,
      yellow: (registry.sources || []).filter(x => x.status === "yellow").length,
      red: (registry.sources || []).filter(x => x.status === "red").length
    }
  };
}

function loadRegistry(file) {
  const registry = readJson(file);
  const validation = validateRegistry(registry);
  if (!validation.valid) {
    throw new Error(`Source Registry non valido:\n - ${validation.errors.join("\n - ")}`);
  }
  return { registry, validation };
}

function findSource(registry, id) {
  const source = sourceMap(registry).get(id);
  if (!source) throw new Error(`Source Registry id non trovato: ${id}`);
  return source;
}

function commercialGreenSources(registry) {
  return (registry.sources || []).filter(source =>
    source.status === "green" &&
    source.verification && source.verification.level === "verified" &&
    source.rights && source.rights.commercialTrainingAllowed === true &&
    source.rights.commercialOutputAllowed === true
  );
}

function defaultCacheRoot(env = process.env, platform = process.platform, home = os.homedir()) {
  if (nonEmpty(env.FAME_NEURAL_SOURCE_CACHE)) return path.resolve(env.FAME_NEURAL_SOURCE_CACHE);
  if (platform === "win32") {
    const local = nonEmpty(env.LOCALAPPDATA) ? env.LOCALAPPDATA : path.join(home, "AppData", "Local");
    return path.join(local, "FAME-Neural", "source-cache");
  }
  const xdg = nonEmpty(env.XDG_CACHE_HOME) ? env.XDG_CACHE_HOME : path.join(home, ".cache");
  return path.join(xdg, "fame-neural", "source-cache");
}

function resolveAdapterConfig(registry, adapter) {
  if (!adapter || adapter.schema !== ADAPTER_SCHEMA) {
    throw new Error(`Adapter schema atteso ${ADAPTER_SCHEMA}`);
  }
  const source = findSource(registry, adapter.registryId);
  if (source.status !== "green") throw new Error(`Adapter ${adapter.registryId}: source non GREEN`);
  const settings = adapter.settings && typeof adapter.settings === "object" ? adapter.settings : {};
  const assetId = adapter.downloadAssetId || null;
  const asset = assetId ? (source.download.assets || []).find(item => item.id === assetId) : null;
  if (assetId && !asset) throw new Error(`${source.id}: downloadAssetId non trovato: ${assetId}`);

  const out = {
    registryId: source.id,
    sourceId: source.id,
    repository: source.links && source.links.repository || null,
    zenodoRecord: source.links && source.links.zenodoRecord || null,
    doi: source.links && source.links.doi || null,
    licenseId: source.license && source.license.dataset || source.license && source.license.code || null,
    creator: source.creator,
    rightsEvidence: [...(source.verification && source.verification.evidence || [])],
    commercialTrainingAllowed: source.rights.commercialTrainingAllowed === true,
    commercialOutputAllowed: source.rights.commercialOutputAllowed === true,
    ...settings
  };

  if (asset) {
    out.assetId = asset.id;
    out.assetName = asset.name;
    out.downloadUrl = asset.url;
    const alg = String(asset.hash.algorithm).toLowerCase();
    out[alg] = asset.hash.value;
  }
  return out;
}

function writeAdapterConfig(registryPath, adapterPath, outputPath) {
  const { registry } = loadRegistry(registryPath);
  const adapter = readJson(adapterPath);
  const resolved = resolveAdapterConfig(registry, adapter);
  fs.writeFileSync(outputPath, `${JSON.stringify(resolved, null, 2)}\n`, "utf8");
  return resolved;
}

function printList(registry) {
  for (const source of [...registry.sources].sort((a, b) => a.id.localeCompare(b.id))) {
    const symbolic = source.pipeline && source.pipeline.currentSymbolic === true ? "symbolic-now" : "not-symbolic-now";
    console.log(`${source.status.toUpperCase().padEnd(6)} ${source.id.padEnd(28)} ${symbolic.padEnd(16)} ${source.name}`);
  }
}

function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  try {
    if (command === "validate") {
      const [registryPath] = rest;
      if (!registryPath) throw new Error("Uso: node source-registry.js validate <source-registry.json>");
      const { validation } = loadRegistry(registryPath);
      console.log(`SOURCE REGISTRY: OK (${validation.totals.sources} sources; green ${validation.totals.green}; yellow ${validation.totals.yellow}; red ${validation.totals.red})`);
      for (const warning of validation.warnings) console.log(`WARN: ${warning}`);
      return;
    }
    if (command === "list") {
      const [registryPath] = rest;
      if (!registryPath) throw new Error("Uso: node source-registry.js list <source-registry.json>");
      const { registry } = loadRegistry(registryPath);
      printList(registry);
      return;
    }
    if (command === "resolve-adapter") {
      const [registryPath, adapterPath, outputPath] = rest;
      if (!registryPath || !adapterPath || !outputPath) {
        throw new Error("Uso: node source-registry.js resolve-adapter <registry.json> <adapter.json> <output.json>");
      }
      const resolved = writeAdapterConfig(registryPath, adapterPath, outputPath);
      console.log(`Adapter risolto: ${resolved.registryId}`);
      console.log(`Output: ${outputPath}`);
      return;
    }
    throw new Error("Comandi: validate | list | resolve-adapter");
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  REGISTRY_SCHEMA,
  ADAPTER_SCHEMA,
  validateRegistry,
  loadRegistry,
  findSource,
  commercialGreenSources,
  defaultCacheRoot,
  resolveAdapterConfig,
  writeAdapterConfig,
  printList,
  main
};
