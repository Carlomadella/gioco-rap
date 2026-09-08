"use strict";

const PHASE4_FEATURE_NAMES = Object.freeze([
  "energy",
  "vocalSpace",
  "tension",
  "density",
  "motifFamilies",
  "kick808Relation",
  "hatRolls",
  "transitionStrength"
]);

function round(value, digits = 6) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function mean(values) {
  const nums = (values || []).map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0;
}

function quantile(values, q) {
  const nums = (values || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!nums.length) return 0;
  const position = (nums.length - 1) * Math.max(0, Math.min(1, Number(q) || 0));
  const low = Math.floor(position);
  const high = Math.ceil(position);
  if (low === high) return nums[low];
  const weight = position - low;
  return nums[low] * (1 - weight) + nums[high] * weight;
}

function rate(ok, total) {
  return total > 0 ? ok / total : 1;
}

function absDiff(a, b) {
  return Math.abs(Number(a) - Number(b));
}

function finitePair(a, b) {
  return Number.isFinite(Number(a)) && Number.isFinite(Number(b));
}

function compareSequences(source, decoded) {
  const srcEvents = Array.isArray(source.events) ? source.events : [];
  const dstEvents = Array.isArray(decoded.events) ? decoded.events : [];
  const srcHarmony = Array.isArray(source.harmony) ? source.harmony : [];
  const dstHarmony = Array.isArray(decoded.harmony) ? decoded.harmony : [];
  const srcBars = Array.isArray(source.bars) ? source.bars : [];
  const dstBars = Array.isArray(decoded.bars) ? decoded.bars : [];

  const eventPairs = Math.min(srcEvents.length, dstEvents.length);
  let typeTotal = eventPairs;
  let typeMatch = 0;
  let pitchTotal = 0;
  let pitchMatch = 0;
  let roleTotal = 0;
  let roleMatch = 0;
  let motifTotal = 0;
  let motifMatch = 0;
  const tickErrors = [];
  const durationErrors = [];
  const velocityErrors = [];

  for (let i = 0; i < eventPairs; i += 1) {
    const a = srcEvents[i];
    const b = dstEvents[i];
    if (a.type === b.type) typeMatch += 1;
    if (Number.isFinite(Number(a.note))) {
      pitchTotal += 1;
      if (Number(a.note) === Number(b.note)) pitchMatch += 1;
    }
    if (a.role != null || b.role != null) {
      roleTotal += 1;
      if (String(a.role || "") === String(b.role || "")) roleMatch += 1;
    }
    if (a.motif != null || b.motif != null) {
      motifTotal += 1;
      if (String(a.motif || "") === String(b.motif || "")) motifMatch += 1;
    }
    if (finitePair(a.tick, b.tick)) tickErrors.push(absDiff(a.tick, b.tick));
    if (finitePair(a.durationTicks, b.durationTicks)) durationErrors.push(absDiff(a.durationTicks, b.durationTicks));
    if (finitePair(a.velocity, b.velocity)) velocityErrors.push(absDiff(a.velocity, b.velocity));
  }

  const harmonyPairs = Math.min(srcHarmony.length, dstHarmony.length);
  let harmonyIdentityTotal = harmonyPairs;
  let harmonyIdentityMatch = 0;
  const harmonyTickErrors = [];
  const harmonyDurationErrors = [];
  for (let i = 0; i < harmonyPairs; i += 1) {
    const a = srcHarmony[i];
    const b = dstHarmony[i];
    if (Number(a.rootPitchClass) === Number(b.rootPitchClass)
      && String(a.quality) === String(b.quality)
      && Number(a.bassPitchClass) === Number(b.bassPitchClass)) harmonyIdentityMatch += 1;
    if (finitePair(a.startTick, b.startTick)) harmonyTickErrors.push(absDiff(a.startTick, b.startTick));
    if (finitePair(a.durationTicks, b.durationTicks)) harmonyDurationErrors.push(absDiff(a.durationTicks, b.durationTicks));
  }

  const barPairs = Math.min(srcBars.length, dstBars.length);
  const barFeatureErrors = [];
  for (let i = 0; i < barPairs; i += 1) {
    for (const key of ["energy", "vocalSpace", "tension", "lowEndDensity", "drumDensity", "melodicDensity"]) {
      if (finitePair(srcBars[i][key], dstBars[i][key])) barFeatureErrors.push(absDiff(srcBars[i][key], dstBars[i][key]));
    }
  }

  return {
    structureExact: source.timing && decoded.timing
      && Number(source.timing.bars) === Number(decoded.timing.bars)
      && srcEvents.length === dstEvents.length
      && srcHarmony.length === dstHarmony.length
      && srcBars.length === dstBars.length,
    eventCountSource: srcEvents.length,
    eventCountDecoded: dstEvents.length,
    harmonyCountSource: srcHarmony.length,
    harmonyCountDecoded: dstHarmony.length,
    typeTotal,
    typeMatch,
    pitchTotal,
    pitchMatch,
    roleTotal,
    roleMatch,
    motifTotal,
    motifMatch,
    harmonyIdentityTotal,
    harmonyIdentityMatch,
    tickErrors,
    durationErrors,
    velocityErrors,
    harmonyTickErrors,
    harmonyDurationErrors,
    barFeatureErrors
  };
}

function flattenLeaves(value, prefix = "", output = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenLeaves(item, `${prefix}[${index}]`, output));
    if (!value.length) output.set(`${prefix}[]`, "__EMPTY_ARRAY__");
    return output;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    keys.forEach(key => flattenLeaves(value[key], prefix ? `${prefix}.${key}` : key, output));
    if (!keys.length) output.set(`${prefix}{}`, "__EMPTY_OBJECT__");
    return output;
  }
  output.set(prefix, value);
  return output;
}

function comparePhase4Snapshots(source, decoded) {
  const a = flattenLeaves(source);
  const b = flattenLeaves(decoded);
  const keys = [...new Set([...a.keys(), ...b.keys()])].sort();
  let exactLeaves = 0;
  const numericErrors = [];
  for (const key of keys) {
    const av = a.get(key);
    const bv = b.get(key);
    if (typeof av === "number" && Number.isFinite(av) && typeof bv === "number" && Number.isFinite(bv)) {
      const error = Math.abs(av - bv);
      numericErrors.push(error);
      if (error === 0) exactLeaves += 1;
    } else if (Object.is(av, bv)) {
      exactLeaves += 1;
    }
  }
  return {
    exact: exactLeaves === keys.length,
    totalLeaves: keys.length,
    exactLeaves,
    numericErrors
  };
}

function benchmarkRepresentation(inputs, adapter) {
  const started = process.hrtime.bigint();
  const phraseResults = [];
  const failures = [];
  const units = [];
  const unitsPerBar = [];
  const encodeNanos = [];
  const decodeNanos = [];
  const fidelity = [];
  const phase4Fidelity = [];
  let grammarFailures = 0;
  let vocabularyFailures = 0;
  let canonicalRoundTripFailures = 0;

  for (const input of inputs) {
    try {
      const prepared = adapter.prepare(input);
      const encodeStart = process.hrtime.bigint();
      const encoded = adapter.encode(prepared);
      const encodeEnd = process.hrtime.bigint();

      let vocabularyOk = true;
      try { adapter.validateVocabulary(encoded); } catch (_error) { vocabularyOk = false; vocabularyFailures += 1; }
      const grammar = adapter.validateEncoded(encoded);
      const grammarOk = Boolean(grammar && grammar.ok);
      if (!grammarOk) grammarFailures += 1;

      const decodeStart = process.hrtime.bigint();
      const decoded = adapter.decode(encoded);
      const decodeEnd = process.hrtime.bigint();
      const reencoded = adapter.encode(decoded);
      const stable = JSON.stringify(encoded) === JSON.stringify(reencoded);
      if (!stable) canonicalRoundTripFailures += 1;

      const bars = Math.max(1, Number(prepared.timing && prepared.timing.bars) || Number(input.phraseBars) || 1);
      const unitCount = encoded.length;
      const comparison = compareSequences(prepared, decoded);
      let phase4Comparison = null;
      if (typeof adapter.phase4Snapshot === "function"
        && Array.isArray(adapter.phase4Features)
        && adapter.phase4Features.length > 0) {
        phase4Comparison = comparePhase4Snapshots(
          adapter.phase4Snapshot(prepared),
          adapter.phase4Snapshot(decoded)
        );
        phase4Fidelity.push(phase4Comparison);
      }

      units.push(unitCount);
      unitsPerBar.push(unitCount / bars);
      encodeNanos.push(Number(encodeEnd - encodeStart));
      decodeNanos.push(Number(decodeEnd - decodeStart));
      fidelity.push(comparison);
      phraseResults.push({
        phraseId: input.phraseId,
        sourceCollection: input.sourceCollection,
        bars,
        units: unitCount,
        unitsPerBar: round(unitCount / bars),
        grammarOk,
        vocabularyOk,
        canonicalRoundTripStable: stable,
        structureExact: comparison.structureExact,
        phase4RoundTripExact: phase4Comparison ? phase4Comparison.exact : null
      });
    } catch (error) {
      failures.push({
        phraseId: input.phraseId,
        sourceCollection: input.sourceCollection,
        error: `${error.name || "Error"}: ${error.message}`
      });
    }
  }

  const aggregate = (matchKey, totalKey) => {
    const match = fidelity.reduce((sum, item) => sum + item[matchKey], 0);
    const total = fidelity.reduce((sum, item) => sum + item[totalKey], 0);
    return { match, total, accuracy: round(rate(match, total)) };
  };
  const flatten = key => fidelity.flatMap(item => item[key]);
  const structureExact = fidelity.filter(item => item.structureExact).length;
  const totalBars = phraseResults.reduce((sum, item) => sum + item.bars, 0);
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  const supportedPhase4 = Array.isArray(adapter.phase4Features) ? [...adapter.phase4Features] : [];
  const phase4ExactPhrases = phase4Fidelity.filter(item => item.exact).length;
  const phase4Leaves = phase4Fidelity.reduce((sum, item) => sum + item.totalLeaves, 0);
  const phase4ExactLeaves = phase4Fidelity.reduce((sum, item) => sum + item.exactLeaves, 0);
  const phase4NumericErrors = phase4Fidelity.flatMap(item => item.numericErrors);

  return {
    schema: "fame-neural-representation-benchmark-v1",
    version: 2,
    representation: {
      id: adapter.id,
      family: adapter.family,
      version: adapter.version,
      unitName: adapter.unitName,
      vocabSize: adapter.vocabSize,
      metadata: adapter.metadata || null,
      capabilities: adapter.capabilities
    },
    totals: {
      inputs: inputs.length,
      benchmarked: phraseResults.length,
      failures: failures.length,
      bars: totalBars,
      units: units.reduce((sum, value) => sum + value, 0),
      grammarFailures,
      vocabularyFailures,
      canonicalRoundTripFailures,
      structureExactPhrases: structureExact
    },
    context: {
      meanUnitsPerBar: round(mean(unitsPerBar)),
      p50UnitsPerBar: round(quantile(unitsPerBar, 0.50)),
      p95UnitsPerBar: round(quantile(unitsPerBar, 0.95)),
      maxUnitsPerBar: round(unitsPerBar.length ? Math.max(...unitsPerBar) : 0),
      meanUnitsPerPhrase: round(mean(units)),
      p50UnitsPerPhrase: round(quantile(units, 0.50)),
      p95UnitsPerPhrase: round(quantile(units, 0.95)),
      maxUnitsPerPhrase: units.length ? Math.max(...units) : 0
    },
    reconstruction: {
      structureExactRate: round(rate(structureExact, fidelity.length)),
      eventType: aggregate("typeMatch", "typeTotal"),
      pitch: aggregate("pitchMatch", "pitchTotal"),
      role: aggregate("roleMatch", "roleTotal"),
      motif: aggregate("motifMatch", "motifTotal"),
      harmonyIdentity: aggregate("harmonyIdentityMatch", "harmonyIdentityTotal"),
      timingMaeTicks: round(mean(flatten("tickErrors"))),
      timingP95Ticks: round(quantile(flatten("tickErrors"), 0.95)),
      durationMaeTicks: round(mean(flatten("durationErrors"))),
      durationP95Ticks: round(quantile(flatten("durationErrors"), 0.95)),
      harmonyTimingMaeTicks: round(mean(flatten("harmonyTickErrors"))),
      harmonyDurationMaeTicks: round(mean(flatten("harmonyDurationErrors"))),
      velocityMae01: round(mean(flatten("velocityErrors"))),
      barConditioningMae01: round(mean(flatten("barFeatureErrors")))
    },
    phase4: {
      supportedFeatures: supportedPhase4,
      supportedFeatureCount: supportedPhase4.length,
      totalFeatureCount: PHASE4_FEATURE_NAMES.length,
      featureCoverageRate: round(rate(supportedPhase4.length, PHASE4_FEATURE_NAMES.length)),
      exactPhrases: phase4ExactPhrases,
      exactPhraseRate: round(rate(phase4ExactPhrases, phase4Fidelity.length)),
      exactLeaves: phase4ExactLeaves,
      totalLeaves: phase4Leaves,
      leafAccuracy: round(rate(phase4ExactLeaves, phase4Leaves)),
      numericMae: round(mean(phase4NumericErrors))
    },
    cpu: {
      elapsedMs: round(elapsedMs, 3),
      encodeMsTotal: round(encodeNanos.reduce((a, b) => a + b, 0) / 1e6, 3),
      decodeMsTotal: round(decodeNanos.reduce((a, b) => a + b, 0) / 1e6, 3),
      phrasesPerSecond: elapsedMs > 0 ? round(phraseResults.length / (elapsedMs / 1000), 3) : 0
    },
    deferredMetrics: [
      "gpuVramPeakDuringTraining",
      "trainingTokensPerSecond",
      "invalidGenerationRate",
      "validationLossComparableModel"
    ],
    roundTripUnstableExamples: phraseResults.filter(item => !item.canonicalRoundTripStable).slice(0, 20).map(item => item.phraseId),
    failures: failures.slice(0, 100),
    phraseResults
  };
}

module.exports = {
  PHASE4_FEATURE_NAMES,
  round,
  mean,
  quantile,
  compareSequences,
  flattenLeaves,
  comparePhase4Snapshots,
  benchmarkRepresentation
};
