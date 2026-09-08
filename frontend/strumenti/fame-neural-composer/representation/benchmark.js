"use strict";

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

function benchmarkRepresentation(inputs, adapter) {
  const started = process.hrtime.bigint();
  const phraseResults = [];
  const failures = [];
  const units = [];
  const unitsPerBar = [];
  const encodeNanos = [];
  const decodeNanos = [];
  const fidelity = [];
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
      try { adapter.validateVocabulary(encoded); } catch (error) { vocabularyOk = false; vocabularyFailures += 1; }
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
        structureExact: comparison.structureExact
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

  return {
    schema: "fame-neural-representation-benchmark-v1",
    version: 1,
    representation: {
      id: adapter.id,
      family: adapter.family,
      version: adapter.version,
      unitName: adapter.unitName,
      vocabSize: adapter.vocabSize,
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
    failures: failures.slice(0, 100),
    phraseResults
  };
}

module.exports = {
  round,
  mean,
  quantile,
  compareSequences,
  benchmarkRepresentation
};
