"use strict";

const GMD_SOURCE_PREFIX = "gmd-v1.0.0:";
const GMD_METADATA_SCHEMA = "fame-neural-gmd-source-metadata-v1";
const GMD_METADATA_VERSION = 1;
const GMD_SPLITS = new Set(["train", "validation", "test"]);
const GMD_BEAT_TYPES = new Set(["beat", "fill"]);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (quoted) throw new Error("CSV GMD non valido: campo quoted non chiuso.");
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  if (!rows.length) return [];

  const header = rows.shift().map((value, index) =>
    (index === 0 ? value.replace(/^\uFEFF/, "") : value).trim()
  );
  return rows
    .filter(values => values.some(value => String(value).trim().length > 0))
    .map(values => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

function parseStyle(rawValue) {
  const raw = String(rawValue || "").trim();
  const slash = raw.indexOf("/");
  return {
    raw,
    primary: (slash >= 0 ? raw.slice(0, slash) : raw).trim(),
    secondary: (slash >= 0 ? raw.slice(slash + 1) : "").trim() || null
  };
}

function parseTimeSignature(rawValue) {
  const raw = String(rawValue || "").trim();
  const match = /^(\d+)-(\d+)$/.exec(raw);
  return {
    raw,
    numerator: match ? Number(match[1]) : null,
    denominator: match ? Number(match[2]) : null
  };
}

function normalizeGmdRow(row) {
  const bpm = Number(row && row.bpm);
  const durationSeconds = Number(row && row.duration);
  return {
    schema: GMD_METADATA_SCHEMA,
    version: GMD_METADATA_VERSION,
    datasetId: "gmd-v1.0.0",
    metadataSource: "info.csv",
    recordId: String(row && row.id || "").trim(),
    drummer: String(row && row.drummer || "").trim(),
    session: String(row && row.session || "").trim(),
    style: parseStyle(row && row.style),
    bpm: Number.isFinite(bpm) ? bpm : null,
    beatType: String(row && row.beat_type || "").trim(),
    timeSignature: parseTimeSignature(row && row.time_signature),
    midiFilename: String(row && row.midi_filename || "").trim(),
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    sourceSplit: String(row && row.split || "").trim()
  };
}

function validateGmdMetadata(metadata) {
  const errors = [];
  if (!metadata || metadata.schema !== GMD_METADATA_SCHEMA) errors.push("schema GMD metadata non valido");
  if (!metadata || metadata.version !== GMD_METADATA_VERSION) errors.push("version GMD metadata non valida");
  if (!metadata || metadata.datasetId !== "gmd-v1.0.0") errors.push("datasetId GMD non valido");
  if (!metadata || !metadata.recordId) errors.push("recordId GMD mancante");
  if (!metadata || !metadata.drummer) errors.push("drummer GMD mancante");
  if (!metadata || !metadata.session) errors.push("session GMD mancante");
  if (!metadata || !metadata.style || !metadata.style.primary) errors.push("style.primary GMD mancante");
  if (!metadata || !(Number(metadata.bpm) > 0)) errors.push("bpm GMD non valido");
  if (!metadata || !GMD_BEAT_TYPES.has(metadata.beatType)) errors.push(`beatType GMD non valido: ${String(metadata && metadata.beatType)}`);
  if (!metadata || !metadata.timeSignature || !(metadata.timeSignature.numerator > 0) || !(metadata.timeSignature.denominator > 0)) {
    errors.push("timeSignature GMD non valida");
  }
  if (!metadata || !GMD_SPLITS.has(metadata.sourceSplit)) errors.push(`sourceSplit GMD non valido: ${String(metadata && metadata.sourceSplit)}`);
  if (!metadata || !metadata.midiFilename) errors.push("midiFilename GMD mancante");
  return { ok: errors.length === 0, errors };
}

function buildGmdMetadataIndex(csvText) {
  const rows = parseCsv(csvText);
  const index = new Map();
  const errors = [];
  for (const row of rows) {
    const metadata = normalizeGmdRow(row);
    const validation = validateGmdMetadata(metadata);
    if (!validation.ok) {
      errors.push({ recordId: metadata.recordId || null, errors: validation.errors });
      continue;
    }
    if (index.has(metadata.recordId)) {
      errors.push({ recordId: metadata.recordId, errors: ["recordId GMD duplicato in info.csv"] });
      continue;
    }
    index.set(metadata.recordId, metadata);
  }
  return { rows: rows.length, index, errors };
}

function gmdRecordIdFromDatasetItem(item) {
  const sourceId = String(item && item.provenance && item.provenance.sourceId || "");
  return sourceId.startsWith(GMD_SOURCE_PREFIX) ? sourceId.slice(GMD_SOURCE_PREFIX.length) : null;
}

function enrichDatasetItemWithGmdMetadata(item, metadataIndex) {
  const recordId = gmdRecordIdFromDatasetItem(item);
  if (!recordId) return { status: "non-gmd", item: deepClone(item), recordId: null };
  const metadata = metadataIndex.get(recordId);
  if (!metadata) return { status: "missing-metadata", item: deepClone(item), recordId };
  return {
    status: "enriched",
    recordId,
    item: {
      ...deepClone(item),
      sourceMetadata: deepClone(metadata)
    }
  };
}

function incrementCounter(target, key) {
  const normalized = key === null || key === undefined || key === "" ? "(missing)" : String(key);
  target[normalized] = (target[normalized] || 0) + 1;
}

function addMetadataToDistribution(distribution, metadata) {
  incrementCounter(distribution.stylePrimary, metadata.style && metadata.style.primary);
  incrementCounter(distribution.styleSecondary, metadata.style && metadata.style.secondary);
  incrementCounter(distribution.beatType, metadata.beatType);
  incrementCounter(distribution.sourceSplit, metadata.sourceSplit);
  incrementCounter(distribution.timeSignature, metadata.timeSignature && metadata.timeSignature.raw);
}

function emptyDistribution() {
  return { stylePrimary: {}, styleSecondary: {}, beatType: {}, sourceSplit: {}, timeSignature: {} };
}

module.exports = {
  GMD_SOURCE_PREFIX,
  GMD_METADATA_SCHEMA,
  GMD_METADATA_VERSION,
  GMD_SPLITS,
  GMD_BEAT_TYPES,
  parseCsv,
  parseStyle,
  parseTimeSignature,
  normalizeGmdRow,
  validateGmdMetadata,
  buildGmdMetadataIndex,
  gmdRecordIdFromDatasetItem,
  enrichDatasetItemWithGmdMetadata,
  addMetadataToDistribution,
  emptyDistribution
};
