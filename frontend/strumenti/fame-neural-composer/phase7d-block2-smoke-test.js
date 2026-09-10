"use strict";

const assert = require("node:assert/strict");
const {
  buildGmdCandidateManifest,
  buildCandidateReport
} = require("./dataset/gmd-candidate-manifest");

const header = "drummer,session,id,style,bpm,beat_type,time_signature,midi_filename,audio_filename,duration,split";
const rows = [
  "drummer1,drummer1/session1,drummer1/session1/1,rock/groove1,90,beat,4-4,d1s1a.mid,,10,train",
  "drummer1,drummer1/session1,drummer1/session1/2,rock/groove1,92,fill,4-4,d1s1b.mid,,4,validation",
  "drummer1,drummer1/session2,drummer1/session2/3,funk/groove2,100,beat,4-4,d1s2.mid,,12,test",
  "drummer2,drummer2/session1,drummer2/session1/1,hiphop/groove8,85,beat,4-4,d2s1.mid,,16,train",
  "drummer2,drummer2/session2,drummer2/session2/2,hiphop/groove8,88,fill,4-4,d2s2.mid,,5,validation",
  "drummer3,drummer3/session1,drummer3/session1/1,jazz/swing,120,beat,4-4,d3s1.mid,,20,test",
  "drummer3,drummer3/session2,drummer3/session2/2,jazz/swing,118,fill,4-4,d3s2.mid,,6,train",
  "drummer4,drummer4/session1,drummer4/session1/1,latin/groove3,105,beat,4-4,d4s1.mid,,18,validation",
  "drummer4,drummer4/session2,drummer4/session2/2,latin/groove3,106,fill,4-4,d4s2.mid,,7,test",
  "drummer5,drummer5/session1,drummer5/session1/1,soul/groove4,95,beat,4-4,d5s1.mid,,15,train",
  "drummer5,drummer5/session2,drummer5/session2/2,soul/groove4,96,fill,4-4,d5s2.mid,,5,validation",
  "drummer5,drummer5/session3,drummer5/session3/3,soul/groove4,97,beat,6-8,d5s3.mid,,8,test",
  "drummer1,drummer1/eval_session,drummer1/eval_session/1,funk/groove1,100,beat,4-4,eval1.mid,,10,test",
  "drummer2,drummer2/eval_session,drummer2/eval_session/1,funk/groove1,101,beat,4-4,eval2.mid,,10,test"
];
const csv = [header, ...rows].join("\n");

const a = buildGmdCandidateManifest(csv);
const b = buildGmdCandidateManifest(csv);
const report = buildCandidateReport(a);

assert.equal(a.schema, "fame-neural-gmd-candidate-manifest-v1");
assert.equal(a.status, "candidate-only-no-training-authority");
assert.equal(a.role, "GENERAL_HUMAN_GROOVE_PRETRAIN");
assert.equal(a.sourceSplitRole, "source-reference-only");
assert.equal(a.taskSplitRole, "candidate-evaluation-only");
assert.equal(a.totals.records, rows.length);

assert.equal(a.pools.evalSessionHoldout, 2);
assert.equal(a.pools.non44, 1);
assert.equal(a.pools.generalBeat44, 6);
assert.equal(a.pools.fill44, 5);
assert.equal(a.pools.eligible44NonEval, 11);
assert.equal(a.checks.poolAccounting, true);

const evalRows = a.records.filter(record => record.holdoutStatus === "benchmark-holdout-candidate");
assert.equal(evalRows.length, 2);
assert.ok(evalRows.every(record => record.taskSplitCandidates.sessionGrouped === "holdout"));
assert.ok(evalRows.every(record => record.taskSplitCandidates.drummerHeldOut === "holdout"));

const non44 = a.records.find(record => record.timeSignature.raw === "6-8");
assert.equal(non44.eligibleForCandidateSplit, false);
assert.equal(non44.taskSplitCandidates.sessionGrouped, "not-assigned");
assert.equal(non44.taskSplitCandidates.drummerHeldOut, "not-assigned");

const sameSession = a.records.filter(record => record.session === "drummer1/session1");
assert.equal(new Set(sameSession.map(record => record.taskSplitCandidates.sessionGrouped)).size, 1);

for (const record of a.records) {
  assert.ok(["train", "validation", "test"].includes(record.sourceSplit));
  assert.equal(record.sourceSplitRole, "source-reference-only");
  assert.equal("semantics" in record, false);
}

assert.equal(a.strategies.sessionGrouped.isolation.crossTaskSplitGroupCount, 0);
assert.equal(a.strategies.drummerHeldOut.isolation.crossTaskSplitGroupCount, 0);
assert.ok(Object.values(a.strategies.sessionGrouped.recordCounts).every(value => value > 0));
assert.ok(Object.values(a.strategies.drummerHeldOut.recordCounts).every(value => value > 0));

assert.notEqual(
  a.strategies.drummerHeldOut.representative.validationDrummer,
  a.strategies.drummerHeldOut.representative.testDrummer
);
assert.ok(a.strategies.drummerHeldOut.ranking.length > 1);
assert.equal(a.digest.value, b.digest.value);
assert.deepEqual(a.records, b.records);
assert.equal(a.readyForPolicyComparison, true);
assert.equal(report.decision, "none-selected-by-block2-builder");

console.log("FASE 7D / BLOCCO 2 / CANDIDATE MANIFEST SMOKE TEST");
console.log("sourceSplit/taskSplit separation: OK");
console.log("beat/fill 4/4 pools separate: OK");
console.log("eval_session holdout candidate: OK");
console.log("non-4/4 preserved but not assigned: OK");
console.log("session-grouped isolation: OK");
console.log("drummer-held-out isolation: OK");
console.log("deterministic manifest digest: OK");
console.log("no automatic core/fill semantics: OK");
console.log("no split selected by builder: OK");
console.log("FASE 7D BLOCCO 2 CANDIDATE MANIFEST SMOKE TEST: OK");
