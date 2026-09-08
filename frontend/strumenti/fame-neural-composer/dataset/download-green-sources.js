"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { pipeline } = require("node:stream/promises");
const { Readable } = require("node:stream");
const {
  loadRegistry,
  findSource,
  commercialGreenSources,
  defaultCacheRoot
} = require("./source-registry");

function fileHash(file, algorithm) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const input = fs.createReadStream(file);
    input.on("error", reject);
    input.on("data", chunk => hash.update(chunk));
    input.on("end", () => resolve(hash.digest("hex")));
  });
}

async function verifyAsset(file, asset) {
  if (!fs.existsSync(file)) return false;
  const algorithm = String(asset.hash.algorithm).toLowerCase();
  const actual = await fileHash(file, algorithm);
  return actual.toLowerCase() === String(asset.hash.value).toLowerCase();
}

async function downloadFile(url, target) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status} per ${url}`);
  if (!response.body) throw new Error(`Response body mancante: ${url}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.part`;
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  try {
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tmp));
    fs.renameSync(tmp, target);
  } catch (error) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw error;
  }
}

function parseArgs(argv) {
  const options = {
    registryPath: path.join(__dirname, "source-registry.json"),
    cacheRoot: null,
    sourceIds: [],
    allGreen: false,
    list: false,
    dryRun: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--registry") options.registryPath = argv[++i];
    else if (arg === "--cache") options.cacheRoot = argv[++i];
    else if (arg === "--source") options.sourceIds.push(argv[++i]);
    else if (arg === "--all-green") options.allGreen = true;
    else if (arg === "--list") options.list = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else throw new Error(`Argomento sconosciuto: ${arg}`);
  }
  return options;
}

function selectSources(registry, options) {
  if (options.sourceIds.length) {
    return [...new Set(options.sourceIds)].map(id => {
      const source = findSource(registry, id);
      if (source.status !== "green") throw new Error(`${id}: downloader rifiuta source ${source.status.toUpperCase()}`);
      if (!source.rights.commercialTrainingAllowed || !source.rights.commercialOutputAllowed) {
        throw new Error(`${id}: rights non commercial-cleared`);
      }
      return source;
    });
  }
  if (options.allGreen) {
    return commercialGreenSources(registry).filter(source => source.download && source.download.autoDownload === true);
  }
  return [];
}

async function downloadSource(source, cacheRoot, dryRun = false) {
  const sourceDir = path.join(cacheRoot, source.id);
  const results = [];
  const assets = source.download && source.download.assets || [];
  if (!assets.length) {
    return { sourceId: source.id, status: "no-assets", results };
  }

  for (const asset of assets) {
    const target = path.join(sourceDir, asset.name);
    if (dryRun) {
      results.push({ assetId: asset.id, target, status: "dry-run" });
      continue;
    }

    if (await verifyAsset(target, asset)) {
      results.push({ assetId: asset.id, target, status: "cached-valid" });
      continue;
    }

    if (fs.existsSync(target)) fs.unlinkSync(target);
    console.log(`[DOWNLOAD] ${source.id}/${asset.name}`);
    await downloadFile(asset.url, target);
    if (!(await verifyAsset(target, asset))) {
      fs.unlinkSync(target);
      throw new Error(`${source.id}/${asset.name}: hash non valido dopo download`);
    }
    results.push({ assetId: asset.id, target, status: "downloaded-valid" });
  }

  if (!dryRun) {
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.writeFileSync(
      path.join(sourceDir, "_source-manifest.json"),
      `${JSON.stringify({
        schema: "fame-neural-source-cache-manifest-v1",
        sourceId: source.id,
        downloadedAt: new Date().toISOString(),
        assets: results
      }, null, 2)}\n`,
      "utf8"
    );
  }

  return { sourceId: source.id, status: "ok", results };
}

async function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv);
    const { registry, validation } = loadRegistry(options.registryPath);
    const cacheRoot = path.resolve(options.cacheRoot || defaultCacheRoot());

    if (options.list) {
      console.log(`Registry: ${path.resolve(options.registryPath)}`);
      console.log(`Cache: ${cacheRoot}`);
      console.log(`GREEN download-ready:`);
      for (const source of commercialGreenSources(registry)) {
        const auto = source.download && source.download.autoDownload ? "AUTO" : "EXPLICIT/MANUAL";
        const assets = source.download && source.download.assets && source.download.assets.length || 0;
        console.log(` - ${source.id}: ${auto}; assets=${assets}; symbolicNow=${!!(source.pipeline && source.pipeline.currentSymbolic)}`);
      }
      console.log(`Validation warnings: ${validation.warnings.length}`);
      return;
    }

    const selected = selectSources(registry, options);
    if (!selected.length) {
      throw new Error("Nessuna source selezionata. Usa --list, --source <id> o --all-green.");
    }

    console.log(`Cache esterna repo: ${cacheRoot}`);
    console.log(`Source selezionate: ${selected.map(x => x.id).join(", ")}`);
    if (options.dryRun) console.log("DRY RUN: nessun download.");

    const report = [];
    for (const source of selected) report.push(await downloadSource(source, cacheRoot, options.dryRun));

    console.log(`Completato: ${report.length} source.`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  fileHash,
  verifyAsset,
  downloadFile,
  parseArgs,
  selectSources,
  downloadSource,
  main
};
