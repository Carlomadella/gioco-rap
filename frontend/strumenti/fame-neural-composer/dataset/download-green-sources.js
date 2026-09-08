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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

function assetUrls(asset) {
  return [...new Set([
    asset && asset.url,
    ...(Array.isArray(asset && asset.mirrors) ? asset.mirrors : [])
  ].filter(value => typeof value === "string" && value.trim()))];
}

function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function fetchToFile(url, target, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 180000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const tmp = `${target}.part`;

  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  fs.mkdirSync(path.dirname(target), { recursive: true });

  try {
    const response = await fetchImpl(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "FAME-Neural/2.0" }
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status} per ${url}`);
      error.httpStatus = response.status;
      throw error;
    }
    if (!response.body) throw new Error(`Response body mancante: ${url}`);

    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tmp));
    fs.renameSync(tmp, target);
  } catch (error) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function downloadVerifiedAsset(asset, target, options = {}) {
  const urls = assetUrls(asset);
  if (!urls.length) throw new Error(`Asset ${asset && asset.id || "unknown"} senza URL`);

  const rounds = Number.isInteger(options.rounds) && options.rounds > 0 ? options.rounds : 4;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 180000;
  const fetchImpl = options.fetchImpl || fetch;
  const sleepImpl = options.sleepImpl || sleep;
  const attempts = [];

  if (await verifyAsset(target, asset)) {
    return { status: "cached-valid", target, usedUrl: null, attempts };
  }

  if (fs.existsSync(target)) fs.unlinkSync(target);

  for (let round = 1; round <= rounds; round += 1) {
    for (const url of urls) {
      try {
        console.log(`[DOWNLOAD] round ${round}/${rounds}: ${url}`);
        await fetchToFile(url, target, { fetchImpl, timeoutMs });

        if (await verifyAsset(target, asset)) {
          attempts.push({ round, url, ok: true, reason: "hash-valid" });
          return { status: "downloaded-valid", target, usedUrl: url, attempts };
        }

        attempts.push({ round, url, ok: false, reason: "hash-invalid" });
        if (fs.existsSync(target)) fs.unlinkSync(target);
      } catch (error) {
        const status = Number(error && error.httpStatus || 0);
        attempts.push({
          round,
          url,
          ok: false,
          reason: status ? `http-${status}` : `${error.name || "Error"}:${error.message}`
        });
        if (fs.existsSync(target)) fs.unlinkSync(target);

        if (status && !isRetryableStatus(status)) {
          console.log(`[DOWNLOAD] endpoint non retryable (${status}), provo eventuale mirror.`);
        } else {
          console.log(`[DOWNLOAD] temporaneamente fallito: ${error.message}`);
        }
      }
    }

    if (round < rounds) {
      const waitMs = Math.min(60000, round * 10000);
      console.log(`[DOWNLOAD] tutti gli endpoint falliti. Retry tra ${Math.round(waitMs / 1000)}s...`);
      await sleepImpl(waitMs);
    }
  }

  const details = attempts.map(x => `${x.round}:${x.url}:${x.reason}`).join(" | ");
  throw new Error(`Download asset fallito dopo ${rounds} round. ${details}`);
}

function parseArgs(argv) {
  const options = {
    registryPath: path.join(__dirname, "source-registry.json"),
    cacheRoot: null,
    sourceIds: [],
    allGreen: false,
    list: false,
    dryRun: false,
    rounds: 4,
    timeoutMs: 180000
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--registry") options.registryPath = argv[++i];
    else if (arg === "--cache") options.cacheRoot = argv[++i];
    else if (arg === "--source") options.sourceIds.push(argv[++i]);
    else if (arg === "--all-green") options.allGreen = true;
    else if (arg === "--list") options.list = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--rounds") options.rounds = Math.max(1, Number(argv[++i]) || 4);
    else if (arg === "--timeout-ms") options.timeoutMs = Math.max(1000, Number(argv[++i]) || 180000);
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

async function downloadSource(source, cacheRoot, dryRun = false, options = {}) {
  const sourceDir = path.join(cacheRoot, source.id);
  const results = [];
  const assets = source.download && source.download.assets || [];

  if (!assets.length) return { sourceId: source.id, status: "no-assets", results };

  for (const asset of assets) {
    const target = path.join(sourceDir, asset.name);

    if (dryRun) {
      results.push({ assetId: asset.id, target, status: "dry-run", urls: assetUrls(asset) });
      continue;
    }

    const result = await downloadVerifiedAsset(asset, target, options);
    results.push({ assetId: asset.id, ...result });
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
      console.log("GREEN download-ready:");
      for (const source of commercialGreenSources(registry)) {
        const auto = source.download && source.download.autoDownload ? "AUTO" : "EXPLICIT/MANUAL";
        const assets = source.download && source.download.assets && source.download.assets.length || 0;
        console.log(` - ${source.id}: ${auto}; assets=${assets}; symbolicNow=${!!(source.pipeline && source.pipeline.currentSymbolic)}`);
      }
      console.log(`Validation warnings: ${validation.warnings.length}`);
      return;
    }

    const selected = selectSources(registry, options);
    if (!selected.length) throw new Error("Nessuna source selezionata. Usa --list, --source <id> o --all-green.");

    console.log(`Cache esterna repo: ${cacheRoot}`);
    console.log(`Source selezionate: ${selected.map(x => x.id).join(", ")}`);
    if (options.dryRun) console.log("DRY RUN: nessun download.");

    const report = [];
    for (const source of selected) {
      report.push(await downloadSource(source, cacheRoot, options.dryRun, {
        rounds: options.rounds,
        timeoutMs: options.timeoutMs
      }));
    }

    console.log(`Completato: ${report.length} source.`);
  } catch (error) {
    console.error(`${error.name || "Error"}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  sleep,
  fileHash,
  verifyAsset,
  assetUrls,
  isRetryableStatus,
  fetchToFile,
  downloadVerifiedAsset,
  parseArgs,
  selectSources,
  downloadSource,
  main
};
