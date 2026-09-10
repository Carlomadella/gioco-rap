"use strict";

const {
  parseCsv,
  normalizeGmdRow,
  validateGmdMetadata
} = require("./gmd-metadata");

const GMD_REFERENCE = Object.freeze({
  records: 1150,
  drummerCount: 10,
  primaryStyleCount: 18,
  beatType: Object.freeze({ beat: 503, fill: 647 }),
  sourceSplit: Object.freeze({ train: 897, validation: 124, test: 129 })
});

function increment(target, key, amount = 1) {
  const normalized = key === null || key === undefined || key === "" ? "(missing)" : String(key);
  target[normalized] = (target[normalized] || 0) + amount;
}

function sortedObject(counter) {
  return Object.fromEntries(
    Object.entries(counter).sort((a, b) =>
      b[1] - a[1] || a[0].localeCompare(b[0])
    )
  );
}

function nestedIncrement(target, outer, inner) {
  const key = outer === null || outer === undefined || outer === "" ? "(missing)" : String(outer);
  if (!target[key]) target[key] = {};
  increment(target[key], inner);
}

function sortNested(target) {
  return Object.fromEntries(
    Object.entries(target)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, counter]) => [key, sortedObject(counter)])
  );
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function quantile(sortedValues, q) {
  if (!sortedValues.length) return null;
  if (sortedValues.length === 1) return sortedValues[0];
  const position = (sortedValues.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];
  const weight = position - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function numericSummary(values) {
  const valid = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!valid.length) {
    return { count: 0, min: null, p10: null, p25: null, median: null, p75: null, p90: null, max: null, mean: null };
  }
  return {
    count: valid.length,
    min: valid[0],
    p10: quantile(valid, 0.10),
    p25: quantile(valid, 0.25),
    median: quantile(valid, 0.50),
    p75: quantile(valid, 0.75),
    p90: quantile(valid, 0.90),
    max: valid[valid.length - 1],
    mean: mean(valid)
  };
}

function splitSetAudit(records, keyFn, options = {}) {
  const groups = new Map();
  for (const record of records) {
    const key = keyFn(record);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, { key, rows: 0, splits: new Set(), recordIds: [] });
    const group = groups.get(key);
    group.rows += 1;
    group.splits.add(record.sourceSplit);
    if (group.recordIds.length < 8) group.recordIds.push(record.recordId);
  }

  const crossSplit = [...groups.values()]
    .filter(group => group.splits.size > 1)
    .map(group => ({
      key: group.key,
      rows: group.rows,
      splits: [...group.splits].sort(),
      recordIds: group.recordIds
    }))
    .sort((a, b) => b.rows - a.rows || a.key.localeCompare(b.key));

  return {
    groupCount: groups.size,
    crossSplitGroupCount: crossSplit.length,
    rowsInCrossSplitGroups: [...groups.values()]
      .filter(group => group.splits.size > 1)
      .reduce((sum, group) => sum + group.rows, 0),
    examples: crossSplit.slice(0, options.exampleLimit || 12)
  };
}

function evalTemplateKey(record) {
  const sessionTail = String(record.session || "").split("/").pop();
  if (!/^eval[_-]session$/i.test(sessionTail)) return null;
  const recordTail = String(record.recordId || "").split("/").pop();
  return recordTail ? `eval-template:${recordTail}` : null;
}

function evalTemplateAudit(records) {
  const groups = new Map();
  for (const record of records) {
    const key = evalTemplateKey(record);
    if (!key) continue;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        rows: 0,
        drummers: new Set(),
        splits: new Set(),
        styles: new Set(),
        recordIds: []
      });
    }
    const group = groups.get(key);
    group.rows += 1;
    group.drummers.add(record.drummer);
    group.splits.add(record.sourceSplit);
    group.styles.add(record.style.raw);
    group.recordIds.push(record.recordId);
  }

  const templates = [...groups.values()]
    .map(group => ({
      key: group.key,
      rows: group.rows,
      drummerCount: group.drummers.size,
      drummers: [...group.drummers].sort(),
      splits: [...group.splits].sort(),
      styles: [...group.styles].sort(),
      recordIds: group.recordIds.sort()
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return {
    templateCount: templates.length,
    totalRows: templates.reduce((sum, template) => sum + template.rows, 0),
    allSourceTest: templates.every(template => template.splits.length === 1 && template.splits[0] === "test"),
    templates
  };
}

function referenceChecks(report) {
  const checks = {
    records: report.totals.validRecords === GMD_REFERENCE.records,
    drummerCount: Object.keys(report.distribution.drummer).length === GMD_REFERENCE.drummerCount,
    primaryStyleCount: Object.keys(report.distribution.stylePrimary).length === GMD_REFERENCE.primaryStyleCount,
    beat: report.distribution.beatType.beat === GMD_REFERENCE.beatType.beat,
    fill: report.distribution.beatType.fill === GMD_REFERENCE.beatType.fill,
    train: report.distribution.sourceSplit.train === GMD_REFERENCE.sourceSplit.train,
    validation: report.distribution.sourceSplit.validation === GMD_REFERENCE.sourceSplit.validation,
    test: report.distribution.sourceSplit.test === GMD_REFERENCE.sourceSplit.test
  };
  return { expected: GMD_REFERENCE, checks, ok: Object.values(checks).every(Boolean) };
}

function buildGmdInventory(csvText) {
  const rows = parseCsv(csvText);
  const validRecords = [];
  const invalidRecords = [];
  const duplicateRecordIds = [];
  const seen = new Set();

  for (const row of rows) {
    const record = normalizeGmdRow(row);
    const validation = validateGmdMetadata(record);
    if (!validation.ok) {
      invalidRecords.push({ recordId: record.recordId || null, errors: validation.errors });
      continue;
    }
    if (seen.has(record.recordId)) {
      duplicateRecordIds.push(record.recordId);
      continue;
    }
    seen.add(record.recordId);
    validRecords.push(record);
  }

  const distribution = {
    stylePrimary: {},
    styleSecondary: {},
    beatType: {},
    timeSignature: {},
    sourceSplit: {},
    drummer: {},
    session: {}
  };
  const matrix = {
    sourceSplitByBeatType: {},
    stylePrimaryByBeatType: {},
    stylePrimaryBySourceSplit: {}
  };

  for (const record of validRecords) {
    increment(distribution.stylePrimary, record.style.primary);
    increment(distribution.styleSecondary, record.style.secondary);
    increment(distribution.beatType, record.beatType);
    increment(distribution.timeSignature, record.timeSignature.raw);
    increment(distribution.sourceSplit, record.sourceSplit);
    increment(distribution.drummer, record.drummer);
    increment(distribution.session, record.session);
    nestedIncrement(matrix.sourceSplitByBeatType, record.sourceSplit, record.beatType);
    nestedIncrement(matrix.stylePrimaryByBeatType, record.style.primary, record.beatType);
    nestedIncrement(matrix.stylePrimaryBySourceSplit, record.style.primary, record.sourceSplit);
  }

  const candidateViews = {
    allValid: validRecords.length,
    beat: validRecords.filter(record => record.beatType === "beat").length,
    fill: validRecords.filter(record => record.beatType === "fill").length,
    meter44: validRecords.filter(record => record.timeSignature.raw === "4-4").length,
    non44: validRecords.filter(record => record.timeSignature.raw !== "4-4").length,
    hiphop: validRecords.filter(record => record.style.primary === "hiphop").length,
    hiphopBeat44: validRecords.filter(record =>
      record.style.primary === "hiphop" &&
      record.beatType === "beat" &&
      record.timeSignature.raw === "4-4"
    ).length
  };

  const report = {
    schema: "fame-neural-gmd-inventory-v1",
    version: 1,
    datasetId: "gmd-v1.0.0",
    sourceSplitRole: "source-reference-only",
    decisionStatus: "inventory-only-no-training-selection",
    totals: {
      csvRows: rows.length,
      validRecords: validRecords.length,
      invalidRecords: invalidRecords.length,
      duplicateRecordIds: duplicateRecordIds.length
    },
    distribution: {
      stylePrimary: sortedObject(distribution.stylePrimary),
      styleSecondary: sortedObject(distribution.styleSecondary),
      beatType: sortedObject(distribution.beatType),
      timeSignature: sortedObject(distribution.timeSignature),
      sourceSplit: sortedObject(distribution.sourceSplit),
      drummer: sortedObject(distribution.drummer),
      session: sortedObject(distribution.session)
    },
    numeric: {
      bpm: numericSummary(validRecords.map(record => record.bpm)),
      durationSeconds: numericSummary(validRecords.map(record => record.durationSeconds)),
      totalDurationSeconds: validRecords.reduce((sum, record) =>
        sum + (Number.isFinite(record.durationSeconds) ? record.durationSeconds : 0), 0)
    },
    matrix: {
      sourceSplitByBeatType: sortNested(matrix.sourceSplitByBeatType),
      stylePrimaryByBeatType: sortNested(matrix.stylePrimaryByBeatType),
      stylePrimaryBySourceSplit: sortNested(matrix.stylePrimaryBySourceSplit)
    },
    candidateViews,
    sourceSplitCrossGroupAudit: {
      interpretation: "diagnostic-only; cross-split group != automatic FAME leakage until task group identity is fixed",
      drummer: splitSetAudit(validRecords, record => record.drummer),
      session: splitSetAudit(validRecords, record => record.session),
      evalTemplate: splitSetAudit(validRecords, evalTemplateKey)
    },
    evalSession: evalTemplateAudit(validRecords),
    errors: {
      invalidRecords,
      duplicateRecordIds: [...new Set(duplicateRecordIds)].sort()
    }
  };

  report.referenceChecks = referenceChecks(report);
  report.readyForSamplingDesign =
    report.totals.invalidRecords === 0 &&
    report.totals.duplicateRecordIds === 0 &&
    report.referenceChecks.ok;

  return report;
}

module.exports = {
  GMD_REFERENCE,
  numericSummary,
  evalTemplateKey,
  buildGmdInventory
};
