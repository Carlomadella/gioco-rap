"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");

const HERE=__dirname;
const PROTOCOL_FILE=path.join(HERE,"audio-to-midi-selected-integration-v1.json");
const DEFAULT_RUN_ID="audio-to-midi-selected-integration-v1-001";
const BASELINE_RUN_ID="audio-to-midi-development-baseline-v1-001";
const DRUMS_REVIEW_ID="audio-to-midi-human-review-v1-001";
const LOWEND_REVIEW_ID="basic-pitch-lowend-blind-comparison-v1-002";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}
function stableJson(value){return JSON.stringify(value,null,2)+"\n"}
function sha256File(file){
  const h=crypto.createHash("sha256"),fd=fs.openSync(file,"r");
  try{
    const b=Buffer.allocUnsafe(1024*1024);
    while(true){const n=fs.readSync(fd,b,0,b.length,null);if(!n)break;h.update(b.subarray(0,n))}
  }finally{fs.closeSync(fd)}
  return h.digest("hex");
}
function gitBlobSha(file){
  const text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
  const bytes=Buffer.from(text,"utf8");
  return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0","utf8")).update(bytes).digest("hex");
}
function safeId(v,label){
  if(typeof v!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{2,99}$/.test(v))throw new Error(label+" invalid");
  return v;
}
function median(values){
  const s=values.slice().sort((a,b)=>a-b),m=s.length/2;
  return s.length%2?s[Math.floor(m)]:(s[m-1]+s[m])/2;
}
function armStats(scores){
  return{
    medianUsefulness:median(scores),
    familiesAtOrAbove2:scores.filter(x=>x>=2).length,
    totalUsefulness:scores.reduce((a,b)=>a+b,0),
    pass:median(scores)>=2&&scores.filter(x=>x>=2).length>=6
  };
}
function runRoot(workspace,runId=DEFAULT_RUN_ID){
  return path.join(workspace,"runs","audio-to-midi-selected-integration",safeId(runId,"run-id"));
}
function baselineRoot(workspace){
  return path.join(workspace,"runs","audio-to-midi-development-baseline",BASELINE_RUN_ID);
}
function validateProtocol(){
  const p=readJson(PROTOCOL_FILE);
  if(
    p.schema!=="fame-owned-beats-audio-to-midi-selected-integration-v1"||
    p.version!==1||
    p.status!=="FROZEN_BEFORE_FIRST_SELECTED_INTEGRATION_OUTPUT"||
    p.runId!==DEFAULT_RUN_ID||
    p.split!=="development"||
    p.expectedFamilies!==8||
    !Array.isArray(p.expectedSourceRecordIds)||
    p.expectedSourceRecordIds.length!==8||
    new Set(p.expectedSourceRecordIds).size!==8||
    p.selection?.drums?.armId!=="drums-bass-kick-fusion-v1"||
    p.selection?.lowEnd?.armId!=="librosa-pyin-lowend-v1"||
    p.selection?.lowEnd?.requiredOutcome!=="KEEP_PYIN_LOW_END"||
    p.knownIssuePolicy?.classification!=="UPSTREAM_SOURCE_SEPARATION_CONTAMINATION"||
    p.knownIssuePolicy?.rootCauseLayer!=="source-separation"||
    p.knownIssuePolicy?.transcriptionRootCause!==false||
    p.integration?.noRetranscription!==true||
    p.integration?.noMidiReencoding!==true||
    p.integration?.copySelectedMidiByteIdentical!==true||
    p.integration?.appendOnly!==true||
    p.safety?.finalHoldoutAllowed!==false||
    p.safety?.batch131Allowed!==false||
    p.safety?.trainingAuthorized!==false||
    p.safety?.taskDataReadyMayBeDeclared!==false||
    p.implementation?.runnerPath!==path.basename(__filename)||
    p.implementation?.runnerGitBlobSha!==gitBlobSha(__filename)
  ) throw new Error("Selected Audio→MIDI integration protocol invalid");
  return p;
}
function assertSafety(safety,label){
  if(
    safety?.finalHoldoutAccessed!==false||
    safety?.batch131Accessed!==false||
    safety?.trainingAuthorized!==false||
    safety?.taskDataReadyMayBeDeclared!==false
  ) throw new Error(label+" safety mismatch");
}
function validateDrumsReview(workspace,p){
  const root=path.join(workspace,"reviews","audio-to-midi-development",DRUMS_REVIEW_ID);
  const reportFile=path.join(root,"report.json"),submissionFile=path.join(root,"submission.json");
  if(!fs.existsSync(reportFile)||!fs.existsSync(submissionFile))throw new Error("Selected drums Human Review artifacts missing");
  const report=readJson(reportFile),submission=readJson(submissionFile),sel=p.selection.drums;
  if(
    report.schema!=="fame-owned-beats-audio-to-midi-human-review-report-v1"||
    report.version!==1||
    report.reviewId!==DRUMS_REVIEW_ID||
    report.records!==8||
    report.submissionDigestSha256!==sel.requiredSubmissionDigestSha256||
    sha256File(submissionFile)!==sel.requiredSubmissionDigestSha256||
    report.gate?.technical!=="ALL_8_FAMILIES_PASS"||
    report.gate?.drums?.selectedArm!==sel.armId||
    report.gate?.drums?.pass!==true||
    report.gate?.pass!==true
  ) throw new Error("Selected drums Human Review report mismatch");
  assertSafety(report.safety,"Selected drums Human Review");
  if(
    submission.schema!=="fame-owned-beats-audio-to-midi-human-review-submission-v1"||
    submission.version!==1||
    submission.reviewId!==DRUMS_REVIEW_ID||
    !Array.isArray(submission.unblinded)||
    submission.unblinded.length!==8
  ) throw new Error("Selected drums Human Review submission mismatch");
  const scores=new Map();
  for(const family of submission.unblinded){
    const candidates=Object.values(family.drums||{}).filter(x=>x?.armId===sel.armId);
    if(candidates.length!==1)throw new Error("Selected drums score missing/ambiguous: "+family.sourceRecordId);
    const score=candidates[0].score;
    if(!Number.isInteger(score)||score<0||score>3)throw new Error("Selected drums score invalid: "+family.sourceRecordId);
    scores.set(family.sourceRecordId,score);
  }
  return{reportFile,submissionFile,report,submission,scores};
}
function validateLowEndReview(workspace,p){
  const root=path.join(workspace,"reviews","basic-pitch-lowend-comparison",LOWEND_REVIEW_ID);
  const reportFile=path.join(root,"report.json"),submissionFile=path.join(root,"submission.json"),packageFile=path.join(root,"review-package.json");
  if(!fs.existsSync(reportFile)||!fs.existsSync(submissionFile)||!fs.existsSync(packageFile))throw new Error("Selected low-end comparison artifacts missing");
  const report=readJson(reportFile),submission=readJson(submissionFile),pkg=readJson(packageFile),sel=p.selection.lowEnd;
  if(
    report.schema!=="fame-owned-beats-basic-pitch-lowend-comparison-report-v2"||
    report.version!==2||
    report.reviewId!==LOWEND_REVIEW_ID||
    report.records!==8||
    report.packageDigestSha256!==sel.requiredPackageDigestSha256||
    report.submissionDigestSha256!==sel.requiredSubmissionDigestSha256||
    sha256File(packageFile)!==sel.requiredPackageDigestSha256||
    sha256File(submissionFile)!==sel.requiredSubmissionDigestSha256||
    pkg.schema!=="fame-owned-beats-basic-pitch-lowend-comparison-package-v2"||
    pkg.version!==2||
    pkg.reviewId!==LOWEND_REVIEW_ID||
    pkg.renderer?.outputDurationSource!=="reference-bass-stem"||
    pkg.renderer?.outputDurationMustMatchReference!==true||
    pkg.renderer?.silenceAfterLastDetectedEventPreserved!==true||
    report.gate?.technical!=="ALL_8_FAMILIES_PASS"||
    report.gate?.lowEndComparison?.selectedArm!==sel.armId||
    report.gate?.lowEndComparison?.pass!==true||
    report.gate?.pass!==true||
    report.gate?.outcome!==sel.requiredOutcome
  ) throw new Error("Selected low-end comparison report mismatch");
  assertSafety(report.safety,"Selected low-end comparison");
  const stats=report.gate.lowEndComparison.arms?.[sel.armId];
  if(JSON.stringify(stats)!==JSON.stringify(sel.requiredStats))throw new Error("Selected low-end aggregate stats changed");
  const basic=report.gate.lowEndComparison.arms?.["basic-pitch-0.4.0-lowend-v1"];
  if(!basic||basic.pass!==false)throw new Error("Basic Pitch negative result missing from final comparison");
  if(
    submission.schema!=="fame-owned-beats-basic-pitch-lowend-comparison-submission-v2"||
    submission.version!==2||
    submission.reviewId!==LOWEND_REVIEW_ID||
    !Array.isArray(submission.unblinded)||
    submission.unblinded.length!==8
  ) throw new Error("Selected low-end comparison submission mismatch");
  const scores=new Map();
  for(const family of submission.unblinded){
    const candidates=Object.values(family.candidates||{}).filter(x=>x?.armId===sel.armId);
    if(candidates.length!==1)throw new Error("Selected low-end score missing/ambiguous: "+family.sourceRecordId);
    const score=candidates[0].score;
    if(!Number.isInteger(score)||score<0||score>3)throw new Error("Selected low-end score invalid: "+family.sourceRecordId);
    scores.set(family.sourceRecordId,score);
  }
  const recomputed=armStats([...scores.values()]);
  if(JSON.stringify(recomputed)!==JSON.stringify(sel.requiredStats))throw new Error("Selected low-end per-family scores do not reproduce frozen aggregate");
  const below=[...scores.entries()].filter(([,score])=>score<2);
  if(
    below.length!==p.knownIssuePolicy.expectedBelowThresholdLowEndFamilies||
    below[0]?.[1]!==p.knownIssuePolicy.expectedScore
  ) throw new Error("Known low-end development issue count/score mismatch");
  return{reportFile,submissionFile,packageFile,report,submission,pkg,scores,knownIssueSourceRecordId:below[0][0]};
}
function validateBaseline(workspace,p){
  const root=baselineRoot(workspace),summaryFile=path.join(root,"summary.json");
  if(!fs.existsSync(summaryFile))throw new Error("Audio→MIDI baseline summary missing");
  const summary=readJson(summaryFile);
  if(
    summary.schema!=="fame-owned-beats-audio-to-midi-development-baseline-summary-v1"||
    summary.version!==1||
    summary.runId!==BASELINE_RUN_ID||
    summary.records!==8||
    summary.status!=="BASELINE_COMPLETE_AWAITING_TECHNICAL_AND_HUMAN_QA"||
    !Array.isArray(summary.results)||
    summary.results.length!==8
  ) throw new Error("Audio→MIDI baseline summary mismatch");
  assertSafety(summary.safety,"Audio→MIDI baseline");
  const ids=summary.results.map(x=>x.sourceRecordId);
  if(JSON.stringify(ids)!==JSON.stringify(p.expectedSourceRecordIds))throw new Error("Audio→MIDI baseline cohort/order mismatch");
  return{root,summaryFile,summary};
}
function preflight(workspaceRoot,runId=DEFAULT_RUN_ID){
  const workspace=path.resolve(workspaceRoot);
  if(!fs.existsSync(workspace)||!fs.statSync(workspace).isDirectory())throw new Error("Workspace missing: "+workspace);
  if(runId!==DEFAULT_RUN_ID)throw new Error("Only frozen selected integration run-id is allowed");
  const p=validateProtocol(),baseline=validateBaseline(workspace,p),drums=validateDrumsReview(workspace,p),low=validateLowEndReview(workspace,p);
  const expected=new Set(p.expectedSourceRecordIds);
  for(const scores of [drums.scores,low.scores]){
    if(scores.size!==8||[...scores.keys()].some(id=>!expected.has(id)))throw new Error("Human Review cohort differs from frozen development cohort");
  }
  for(const row of baseline.summary.results){
    const rid=row.sourceRecordId,familyDir=path.join(baseline.root,rid),resultFile=path.join(familyDir,"result.json");
    if(!fs.existsSync(resultFile)||sha256File(resultFile)!==row.resultSha256)throw new Error("Baseline result integrity mismatch: "+rid);
    const result=readJson(resultFile);
    if(
      result.schema!=="fame-owned-beats-audio-to-midi-development-baseline-result-v1"||
      result.version!==1||
      result.runId!==BASELINE_RUN_ID||
      result.sourceRecordId!==rid||
      result.drumsBassKickFusion?.armId!==p.selection.drums.armId||
      result.lowEndPyin?.armId!==p.selection.lowEnd.armId
    ) throw new Error("Baseline selected arm mismatch: "+rid);
    assertSafety(result.safety,"Baseline result "+rid);
    for(const file of [p.selection.drums.sourceMidiFile,p.selection.lowEnd.sourceMidiFile]){
      const midi=path.join(familyDir,file);
      if(!fs.existsSync(midi)||fs.statSync(midi).size<14||fs.readFileSync(midi,{encoding:null}).subarray(0,4).toString("ascii")!=="MThd")throw new Error("Selected MIDI invalid: "+rid+"/"+file);
    }
  }
  return{
    mode:"AUDIO_TO_MIDI_SELECTED_INTEGRATION_PREFLIGHT_PASS",
    runId,
    records:8,
    selectedDrumsArm:p.selection.drums.armId,
    selectedLowEndArm:p.selection.lowEnd.armId,
    knownIssueSourceRecordId:low.knownIssueSourceRecordId,
    knownIssueClassification:p.knownIssuePolicy.classification,
    transcriptionRootCause:p.knownIssuePolicy.transcriptionRootCause,
    sourceAudioOpenedByThisCommand:false,
    retranscriptionExecutedByThisCommand:false,
    midiReencodedByThisCommand:false,
    finalHoldoutAccessedByThisCommand:false,
    batch131AccessedByThisCommand:false,
    trainingAuthorized:false,
    taskDataReadyMayBeDeclared:false
  };
}
function execute(workspaceRoot,runId=DEFAULT_RUN_ID){
  const workspace=path.resolve(workspaceRoot),p=validateProtocol();
  const pre=preflight(workspace,runId);
  const baseline=validateBaseline(workspace,p),drums=validateDrumsReview(workspace,p),low=validateLowEndReview(workspace,p);
  const finalRoot=runRoot(workspace,runId);
  if(fs.existsSync(finalRoot))throw new Error("Append-only selected integration already exists: "+finalRoot);
  const parent=path.dirname(finalRoot);fs.mkdirSync(parent,{recursive:true});
  const temp=path.join(parent,"."+runId+"."+crypto.randomUUID()+".tmp");
  fs.mkdirSync(temp,{recursive:false});
  const results=[];
  try{
    for(const rid of p.expectedSourceRecordIds){
      const srcDir=path.join(baseline.root,rid),dstDir=path.join(temp,rid);
      fs.mkdirSync(dstDir,{recursive:false});
      const resultFile=path.join(srcDir,"result.json"),result=readJson(resultFile);
      const srcDrums=path.join(srcDir,p.selection.drums.sourceMidiFile);
      const srcLow=path.join(srcDir,p.selection.lowEnd.sourceMidiFile);
      const dstDrums=path.join(dstDir,p.selection.drums.destinationMidiFile);
      const dstLow=path.join(dstDir,p.selection.lowEnd.destinationMidiFile);
      fs.copyFileSync(srcDrums,dstDrums,fs.constants.COPYFILE_EXCL);
      fs.copyFileSync(srcLow,dstLow,fs.constants.COPYFILE_EXCL);
      const drumsSha=sha256File(srcDrums),lowSha=sha256File(srcLow);
      if(sha256File(dstDrums)!==drumsSha||sha256File(dstLow)!==lowSha)throw new Error("Byte-identical selected MIDI copy failed: "+rid);
      const lowScore=low.scores.get(rid),knownIssues=[];
      if(rid===low.knownIssueSourceRecordId){
        knownIssues.push({
          classification:p.knownIssuePolicy.classification,
          rootCauseLayer:p.knownIssuePolicy.rootCauseLayer,
          reviewerConfirmedCause:p.knownIssuePolicy.reviewerConfirmedCause,
          transcriptionRootCause:false,
          retainAsDevelopmentRegressionCase:true,
          lowEndHumanScore:lowScore
        });
      }
      const selection={
        schema:"fame-owned-beats-audio-to-midi-selected-family-v1",
        version:1,
        runId,
        sourceRecordId:rid,
        compositionFamilyId:result.compositionFamilyId,
        baseline:{
          runId:BASELINE_RUN_ID,
          resultSha256:sha256File(resultFile)
        },
        timing:result.timing,
        drums:{
          armId:p.selection.drums.armId,
          humanReviewId:DRUMS_REVIEW_ID,
          humanScore:drums.scores.get(rid),
          sourceMidiFile:p.selection.drums.sourceMidiFile,
          outputMidiFile:p.selection.drums.destinationMidiFile,
          sha256:drumsSha,
          eventCount:result.drumsBassKickFusion.eventCount,
          roleCounts:result.drumsBassKickFusion.roleCounts
        },
        lowEnd:{
          armId:p.selection.lowEnd.armId,
          humanReviewId:LOWEND_REVIEW_ID,
          humanScore:lowScore,
          sourceMidiFile:p.selection.lowEnd.sourceMidiFile,
          outputMidiFile:p.selection.lowEnd.destinationMidiFile,
          sha256:lowSha,
          noteCount:result.lowEndPyin.noteCount,
          voicedFrameCount:result.lowEndPyin.voicedFrameCount,
          frameCount:result.lowEndPyin.frameCount
        },
        knownIssues,
        safety:{
          split:"development",
          finalHoldoutAccessed:false,
          batch131Accessed:false,
          trainingAuthorized:false,
          taskDataReadyMayBeDeclared:false
        }
      };
      const selectionFile=path.join(dstDir,"selection.json");
      fs.writeFileSync(selectionFile,stableJson(selection),{flag:"wx"});
      results.push({
        sourceRecordId:rid,
        selectionSha256:sha256File(selectionFile),
        drumsMidiSha256:drumsSha,
        lowEndMidiSha256:lowSha,
        drumsHumanScore:drums.scores.get(rid),
        lowEndHumanScore:lowScore,
        knownIssue:knownIssues.length===1
      });
    }
    const summary={
      schema:"fame-owned-beats-audio-to-midi-selected-integration-summary-v1",
      version:1,
      status:"SELECTED_DEVELOPMENT_INTEGRATION_COMPLETE",
      runId,
      records:8,
      protocolSha256:sha256File(PROTOCOL_FILE),
      selections:{
        drumsArmId:p.selection.drums.armId,
        lowEndArmId:p.selection.lowEnd.armId
      },
      evidence:{
        baselineSummarySha256:sha256File(baseline.summaryFile),
        drumsReviewReportSha256:sha256File(drums.reportFile),
        drumsReviewSubmissionSha256:sha256File(drums.submissionFile),
        lowEndReviewPackageSha256:sha256File(low.packageFile),
        lowEndReviewReportSha256:sha256File(low.reportFile),
        lowEndReviewSubmissionSha256:sha256File(low.submissionFile)
      },
      humanGate:{
        lowEnd:p.selection.lowEnd.requiredStats,
        knownBelowThresholdFamily:{
          sourceRecordId:low.knownIssueSourceRecordId,
          score:p.knownIssuePolicy.expectedScore,
          classification:p.knownIssuePolicy.classification,
          rootCauseLayer:p.knownIssuePolicy.rootCauseLayer,
          transcriptionRootCause:false,
          reviewerConfirmedCause:p.knownIssuePolicy.reviewerConfirmedCause,
          retainAsDevelopmentRegressionCase:true
        }
      },
      results,
      integration:{
        retranscriptionExecuted:false,
        midiReencoded:false,
        selectedMidiCopiedByteIdentical:true
      },
      safety:{
        split:"development",
        finalHoldoutAccessed:false,
        batch131Accessed:false,
        trainingAuthorized:false,
        taskDataReadyMayBeDeclared:false
      },
      nextAction:p.nextAfterIntegration
    };
    fs.writeFileSync(path.join(temp,p.output.summary),stableJson(summary),{flag:"wx"});
    if(fs.existsSync(finalRoot))throw new Error("Selected integration appeared concurrently: "+finalRoot);
    fs.renameSync(temp,finalRoot);
    return{
      mode:"AUDIO_TO_MIDI_SELECTED_INTEGRATION_COMPLETE",
      runId,
      records:8,
      status:"SELECTED_DEVELOPMENT_INTEGRATION_COMPLETE",
      selectedDrumsArm:p.selection.drums.armId,
      selectedLowEndArm:p.selection.lowEnd.armId,
      knownIssueSourceRecordId:low.knownIssueSourceRecordId,
      knownIssueClassification:p.knownIssuePolicy.classification,
      retranscriptionExecutedByThisCommand:false,
      midiReencodedByThisCommand:false,
      finalHoldoutAccessedByThisCommand:false,
      batch131AccessedByThisCommand:false,
      trainingAuthorized:false,
      taskDataReadyMayBeDeclared:false,
      nextAction:p.nextAfterIntegration
    };
  }catch(error){
    fs.rmSync(temp,{recursive:true,force:true});
    throw error;
  }
}
function selfTest(){
  const stats=armStats([1,2,2,2,2,2,3,3]);
  if(JSON.stringify(stats)!==JSON.stringify({medianUsefulness:2,familiesAtOrAbove2:7,totalUsefulness:17,pass:true}))throw new Error("Low-end aggregate fixture failed");
  return{
    mode:"AUDIO_TO_MIDI_SELECTED_INTEGRATION_SELF_TEST_PASS",
    sourceAudioOpenedByThisCommand:false,
    retranscriptionExecutedByThisCommand:false,
    midiReencodedByThisCommand:false,
    finalHoldoutAccessedByThisCommand:false
  };
}
function main(args=process.argv.slice(2)){
  const[command,workspace,runId]=args;
  let out;
  if(command==="self-test")out=selfTest();
  else{
    if(!workspace)throw new Error("Usage: node audio-to-midi-selected-integration.js <preflight|execute> <workspace> [run-id]");
    out=command==="preflight"?preflight(workspace,runId||DEFAULT_RUN_ID):command==="execute"?execute(workspace,runId||DEFAULT_RUN_ID):(()=>{throw new Error("Unknown command")})();
  }
  process.stdout.write(stableJson(out));
}
if(require.main===module){try{main()}catch(error){console.error("AUDIO TO MIDI SELECTED INTEGRATION FAILED: "+error.message);process.exitCode=1}}
module.exports={armStats,validateProtocol,validateDrumsReview,validateLowEndReview,validateBaseline,preflight,execute,selfTest};
