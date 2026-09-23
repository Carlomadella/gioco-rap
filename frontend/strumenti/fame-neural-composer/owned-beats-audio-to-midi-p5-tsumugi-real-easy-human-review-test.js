"use strict";
const assert=require("node:assert");
const review=require("./owned-beats/audio-to-midi-p5-tsumugi-real-easy-human-review");

function main(){
  const p=review.protocol();
  assert.deepStrictEqual(p.expectedRecords,["FAME000040","FAME000080","FAME000126"]);
  assert.strictEqual(p.interpretation.automaticPromotion,false);
  assert.strictEqual(p.safety.independentEvaluationAllowed,false);
  assert.strictEqual(p.safety.finalHoldoutAllowed,false);
  assert.strictEqual(review.median([0,2,3]),2);
  const pkg={
    reviewId:p.reviewId,
    packageDigestSha256:"abc",
    families:p.expectedRecords.map(sourceRecordId=>({sourceRecordId}))
  };
  const doc={
    schema:"fame-owned-beats-audio-to-midi-p5-tsumugi-real-easy-human-review-submission-v1",
    version:1,reviewId:p.reviewId,packageDigestSha256:"abc",
    families:[
      {sourceRecordId:"FAME000040",score:3,note:"",reviewerAttested:true},
      {sourceRecordId:"FAME000080",score:2,note:"",reviewerAttested:true},
      {sourceRecordId:"FAME000126",score:1,note:"",reviewerAttested:true}
    ]
  };
  review.validateSubmission(doc,pkg);
  const stats=review.finalize(doc);
  assert.strictEqual(stats.medianUsefulness,2);
  assert.strictEqual(stats.familiesAtOrAbove2,2);
  assert.strictEqual(stats.totalUsefulness,6);
  assert.strictEqual(stats.automaticPromotion,false);
  console.log("owned-beats-audio-to-midi-p5-tsumugi-real-easy-human-review-test: PASS");
}
main();
