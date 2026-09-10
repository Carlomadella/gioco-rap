"use strict";

const assert = require("node:assert/strict");
const { buildGmdInventory, numericSummary, evalTemplateKey } = require("./dataset/gmd-inventory");

const csv = [
  "drummer,session,id,style,bpm,beat_type,time_signature,midi_filename,audio_filename,duration,split",
  "drummer1,drummer1/eval_session,drummer1/eval_session/1,funk/groove1,100,beat,4-4,a.mid,,10,test",
  "drummer2,drummer2/eval_session,drummer2/eval_session/1,funk/groove1,101,beat,4-4,b.mid,,11,test",
  "drummer1,drummer1/session1,drummer1/session1/2,hiphop/groove8,90,beat,4-4,c.mid,,20,train",
  "drummer1,drummer1/session1,drummer1/session1/3,hiphop/groove8,95,fill,4-4,d.mid,,2,validation",
  "drummer3,drummer3/session2,drummer3/session2/4,jazz/funk,120,beat,6-8,e.mid,,30,train"
].join("\n");

const report = buildGmdInventory(csv);

assert.equal(report.schema, "fame-neural-gmd-inventory-v1");
assert.equal(report.totals.csvRows, 5);
assert.equal(report.totals.validRecords, 5);
assert.equal(report.totals.invalidRecords, 0);
assert.equal(report.totals.duplicateRecordIds, 0);

assert.deepEqual(report.distribution.beatType, { beat: 4, fill: 1 });
assert.deepEqual(report.distribution.sourceSplit, { train: 2, test: 2, validation: 1 });
assert.equal(report.distribution.stylePrimary.hiphop, 2);
assert.equal(report.distribution.timeSignature["4-4"], 4);
assert.equal(report.distribution.timeSignature["6-8"], 1);

assert.equal(report.candidateViews.allValid, 5);
assert.equal(report.candidateViews.beat, 4);
assert.equal(report.candidateViews.fill, 1);
assert.equal(report.candidateViews.meter44, 4);
assert.equal(report.candidateViews.non44, 1);
assert.equal(report.candidateViews.hiphop, 2);
assert.equal(report.candidateViews.hiphopBeat44, 1);

assert.equal(report.sourceSplitRole, "source-reference-only");
assert.match(report.decisionStatus, /inventory-only/);
assert.equal(report.sourceSplitCrossGroupAudit.drummer.crossSplitGroupCount, 1);
assert.equal(report.sourceSplitCrossGroupAudit.session.crossSplitGroupCount, 1);

assert.equal(report.evalSession.templateCount, 1);
assert.equal(report.evalSession.totalRows, 2);
assert.equal(report.evalSession.templates[0].drummerCount, 2);
assert.equal(report.evalSession.allSourceTest, true);

assert.equal(evalTemplateKey({
  session: "drummer1/eval_session",
  recordId: "drummer1/eval_session/7"
}), "eval-template:7");
assert.equal(evalTemplateKey({
  session: "drummer1/session1",
  recordId: "drummer1/session1/7"
}), null);

const summary = numericSummary([1, 2, 3, 4, 5]);
assert.equal(summary.min, 1);
assert.equal(summary.median, 3);
assert.equal(summary.max, 5);
assert.equal(summary.mean, 3);

// La fixture non e' l'intero GMD: il reference gate deve correttamente restare false.
assert.equal(report.referenceChecks.ok, false);
assert.equal(report.readyForSamplingDesign, false);

console.log("FASE 7D / BLOCCO 1 / INVENTORY SMOKE TEST");
console.log("distribution + matrices: OK");
console.log("BPM/duration summary: OK");
console.log("drummer/session cross-split audit: OK");
console.log("eval-session template grouping: OK");
console.log("source split resta reference-only: OK");
console.log("candidate views restano descrittive: OK");
console.log("FASE 7D BLOCCO 1 INVENTORY SMOKE TEST: OK");
