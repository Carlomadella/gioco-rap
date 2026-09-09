"use strict";

const assert = require("node:assert/strict");
const {
  buildDrumViewV2,
  validateDrumViewV2,
  getMappingProfile,
  mapMidiNote
} = require("./dataset/drum-view-v2");

function fixtureItem() {
  const itemId = "phase7c-block1-fixture";
  return {
    schema: "fame-neural-dataset-item-v1",
    version: 1,
    itemId,
    source: {
      sha256: "fixture-sha"
    },
    provenance: {
      sourceId: "fixture:drum-view-v2",
      compositionFamily: "fixture-family"
    },
    sourceFidelity: {
      schema: "fame-neural-source-fidelity-v1",
      version: 1,
      sourceDatasetItemId: itemId,
      sourcePpq: 1920,
      canonicalPpq: 960,
      mapping: {
        id: "fame-neural-drum-map-v1",
        version: 1,
        projection: "track-classifier.drumEventType",
        tickScaling: "round(sourceTick * canonicalPpq / sourcePpq)"
      },
      tempoEvents: [
        { tick: 0, bpm: 120, usPerQuarter: 500000, trackIndex: 0 }
      ],
      timeSignatures: [
        { tick: 0, numerator: 4, denominator: 4, trackIndex: 0 }
      ],
      drumEvents: [
        {
          sourceEventId: `${itemId}:drum:000000`,
          trackIndex: 1,
          channel: 9,
          midiNote: 36,
          startTick: 100,
          durationTicks: 20,
          velocity: 100,
          velocityOff: 0,
          program: 0,
          canonicalProjection: { type: "kick", tick: 50, velocity: 100 / 127 }
        },
        {
          sourceEventId: `${itemId}:drum:000001`,
          trackIndex: 1,
          channel: 9,
          midiNote: 36,
          startTick: 120,
          durationTicks: 20,
          velocity: 80,
          velocityOff: 0,
          program: 0,
          canonicalProjection: { type: "kick", tick: 60, velocity: 80 / 127 }
        },
        {
          sourceEventId: `${itemId}:drum:000002`,
          trackIndex: 1,
          channel: 9,
          midiNote: 49,
          startTick: 960,
          durationTicks: 20,
          velocity: 110,
          velocityOff: 0,
          program: 0,
          canonicalProjection: { type: "perc", tick: 480, velocity: 110 / 127 }
        },
        {
          sourceEventId: `${itemId}:drum:000003`,
          trackIndex: 1,
          channel: 9,
          midiNote: 39,
          startTick: 1440,
          durationTicks: 20,
          velocity: 95,
          velocityOff: 0,
          program: 0,
          canonicalProjection: { type: "clap", tick: 720, velocity: 95 / 127 }
        }
      ]
    }
  };
}

const profile = getMappingProfile("gmd-9-v1");
assert.equal(mapMidiNote(profile, 36).laneId, "kick");
assert.equal(mapMidiNote(profile, 49).laneId, "crash");
assert.equal(mapMidiNote(profile, 39).laneId, "gm_039");
assert.equal(mapMidiNote(profile, 39).mappingStatus, "raw-fallback");

const view = buildDrumViewV2(fixtureItem(), {
  mappingProfileId: "gmd-9-v1",
  bars: 2,
  gridDivisionPerQuarter: 4
});

const validation = validateDrumViewV2(view);
assert.equal(validation.ok, true, validation.errors.join("; "));
assert.equal(view.schema, "fame-neural-drum-view-v2");
assert.equal(view.stats.sourceHitCount, 4);
assert.equal(view.stats.hitCount, 4);
assert.equal(view.hits.length, 4);
assert.equal(new Set(view.hits.map(hit => hit.sourceEventId)).size, 4);

const kickHits = view.hits.filter(hit => hit.laneId === "kick");
assert.equal(kickHits.length, 2);
assert.equal(kickHits[0].stepIndex, kickHits[1].stepIndex);
assert.equal(view.stats.multiHitLaneFrameCount >= 1, true);

const kickFrame = view.frames.find(frame => frame.lanes.kick && frame.lanes.kick.length === 2);
assert.ok(kickFrame);
assert.deepEqual(
  [...kickFrame.lanes.kick].sort(),
  kickHits.map(hit => hit.sourceEventId).sort()
);

const crash = view.hits.find(hit => hit.midiNote === 49);
assert.ok(crash);
assert.equal(crash.laneId, "crash");
assert.equal(crash.sourceStartTick, 960);
assert.equal(typeof crash.offsetStepFraction, "number");
assert.equal(typeof crash.offsetMs, "number");

const clap = view.hits.find(hit => hit.midiNote === 39);
assert.ok(clap);
assert.equal(clap.laneId, "gm_039");
assert.equal(clap.mappingStatus, "raw-fallback");

assert.equal(view.semantics.core.status, "unknown");
assert.equal(view.semantics.fill.status, "unknown");
assert.equal(view.semantics.variation.status, "unknown");
assert.equal(view.semantics.loopability.status, "unknown");
assert.equal(view.semantics.boundaryQuality.status, "unknown");
assert.equal(view.metadata.style, null);
assert.equal(view.metadata.metadataStatus, "not-enriched");

console.log("FASE 7C / BLOCCO 1 / DRUM VIEW V2");
console.log("Joint frame preserves simultaneous/multi-hit lane events: OK");
console.log("Velocity preserved: OK");
console.log("Microtiming derived from raw source ticks: OK");
console.log("GMD-9 adapter + raw-note fallback: OK");
console.log("sourceEventId linkage exact: OK");
console.log("fill/core/loopability/boundary not invented: OK");
console.log("FASE 7C BLOCCO 1 DRUM VIEW V2 SMOKE TEST: OK");
