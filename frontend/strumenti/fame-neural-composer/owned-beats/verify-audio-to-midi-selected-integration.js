"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const integration=require("./audio-to-midi-selected-integration.js");

const HERE=__dirname;
const PROTOCOL_FILE=path.join(HERE,"audio-to-midi-selected-integration-v1.json");
const RUN_ID="audio-to-midi-selected-integration-v1-001";
const BASELINE_RUN_ID="audio-to-midi-development-baseline-v1-001";
const EXPECTED_KNOWN_ISSUE_ID="FAME000040";

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8").replace(/^\uFEFF/,""))}
function sha256File(file){
  const h=crypto.createHash("sha256"),fd=fs.openSync(file,"r");
  try{
    const b=Buffer.allocUnsafe(1024*1024);
    while(true){const n=fs.readSync(fd,b,0,b.length,null);if(!n)break;h.update(b.subarray(0,n))}
  }finally{fs.closeSync(fd)}
  return h.digest("hex");
}
function assertSafety(safety,label){
  if(
    safety?.split!=="development"||
    safety?.finalHoldoutAccessed!==false||
    safety?.batch131Accessed!==false||
    safety?.trainingAuthorized!==false||
    safety?.taskDataReadyMayBeDeclared!==false
  ) throw new Error(label+" safety mismatch");
}
function requireMidi(file,label){
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()||fs.statSync(file).size<14)throw new Error(label+" missing/too small");
  const fd=fs.openSync(file,"r");
  try{
    const head=Buffer.alloc(4);
    if(fs.readSync(fd,head,0,4,0)!==4||head.toString("ascii")!=="MThd")throw new Error(label+" invalid MIDI header");
  }finally{fs.closeSync(fd)}
}
function sameBytes(a,b,label){
  if(fs.statSync(a).size!==fs.statSync(b).size)throw new Error(label+" byte size mismatch");
  if(sha256File(a)!==sha256File(b))throw new Error(label+" SHA256 mismatch");
  const ab=fs.readFileSync(a),bb=fs.readFileSync(b);
  if(!ab.equals(bb))throw new Error(label+" byte comparison mismatch");
}

function verify(workspaceRoot){
  const workspace=path.resolve(workspaceRoot);
  if(!fs.existsSync(workspace)||!fs.statSync(workspace).isDirectory())throw new Error("Workspace missing: "+workspace);

  const p=integration.validateProtocol();
  const baseline=integration.validateBaseline(workspace,p);
  const drumsReview=integration.validateDrumsReview(workspace,p);
  const lowReview=integration.validateLowEndReview(workspace,p);

  if(lowReview.knownIssueSourceRecordId!==EXPECTED_KNOWN_ISSUE_ID){
    throw new Error("Expected known issue family differs from completed integration evidence");
  }

  const root=path.join(workspace,"runs","audio-to-midi-selected-integration",RUN_ID);
  const summaryFile=path.join(root,p.output.summary);
  if(!fs.existsSync(summaryFile))throw new Error("Selected integration summary missing");
  const summary=readJson(summaryFile);

  if(
    summary.schema!=="fame-owned-beats-audio-to-midi-selected-integration-summary-v1"||
    summary.version!==1||
    summary.status!=="SELECTED_DEVELOPMENT_INTEGRATION_COMPLETE"||
    summary.runId!==RUN_ID||
    summary.records!==8||
    summary.protocolSha256!==sha256File(PROTOCOL_FILE)||
    summary.selections?.drumsArmId!==p.selection.drums.armId||
    summary.selections?.lowEndArmId!==p.selection.lowEnd.armId||
    summary.integration?.retranscriptionExecuted!==false||
    summary.integration?.midiReencoded!==false||
    summary.integration?.selectedMidiCopiedByteIdentical!==true||
    summary.nextAction!=="VERIFY_SELECTED_INTEGRATION_AND_CLOSE_AUDIO_TO_MIDI_DEVELOPMENT_BLOCK"||
    !Array.isArray(summary.results)||
    summary.results.length!==8
  ) throw new Error("Selected integration summary contract mismatch");
  assertSafety(summary.safety,"Selected integration summary");

  const expectedEvidence={
    baselineSummarySha256:sha256File(baseline.summaryFile),
    drumsReviewReportSha256:sha256File(drumsReview.reportFile),
    drumsReviewSubmissionSha256:sha256File(drumsReview.submissionFile),
    lowEndReviewPackageSha256:sha256File(lowReview.packageFile),
    lowEndReviewReportSha256:sha256File(lowReview.reportFile),
    lowEndReviewSubmissionSha256:sha256File(lowReview.submissionFile)
  };
  if(JSON.stringify(summary.evidence)!==JSON.stringify(expectedEvidence))throw new Error("Selected integration evidence digests mismatch");

  if(JSON.stringify(summary.humanGate?.lowEnd)!==JSON.stringify(p.selection.lowEnd.requiredStats)){
    throw new Error("Selected integration low-end Human Gate mismatch");
  }
  const summaryIssue=summary.humanGate?.knownBelowThresholdFamily;
  if(
    summaryIssue?.sourceRecordId!==EXPECTED_KNOWN_ISSUE_ID||
    summaryIssue?.score!==1||
    summaryIssue?.classification!=="UPSTREAM_SOURCE_SEPARATION_CONTAMINATION"||
    summaryIssue?.rootCauseLayer!=="source-separation"||
    summaryIssue?.transcriptionRootCause!==false||
    summaryIssue?.reviewerConfirmedCause!==p.knownIssuePolicy.reviewerConfirmedCause||
    summaryIssue?.retainAsDevelopmentRegressionCase!==true
  ) throw new Error("Selected integration summary known issue mismatch");

  const byId=new Map(summary.results.map(x=>[x.sourceRecordId,x]));
  if(byId.size!==8||JSON.stringify(summary.results.map(x=>x.sourceRecordId))!==JSON.stringify(p.expectedSourceRecordIds)){
    throw new Error("Selected integration family coverage/order mismatch");
  }

  let byteIdenticalMidiFiles=0,knownIssueFamilies=0;
  const diagnostics=[];

  for(const rid of p.expectedSourceRecordIds){
    const row=byId.get(rid);
    const familyDir=path.join(root,rid);
    const selectionFile=path.join(familyDir,"selection.json");
    const drumsOut=path.join(familyDir,p.selection.drums.destinationMidiFile);
    const lowOut=path.join(familyDir,p.selection.lowEnd.destinationMidiFile);
    const baselineDir=path.join(baseline.root,rid);
    const drumsSource=path.join(baselineDir,p.selection.drums.sourceMidiFile);
    const lowSource=path.join(baselineDir,p.selection.lowEnd.sourceMidiFile);

    if(!fs.existsSync(selectionFile)||sha256File(selectionFile)!==row.selectionSha256)throw new Error("selection.json integrity mismatch: "+rid);
    requireMidi(drumsOut,rid+"/drums.mid");
    requireMidi(lowOut,rid+"/low-end.mid");
    requireMidi(drumsSource,rid+"/baseline drums MIDI");
    requireMidi(lowSource,rid+"/baseline low-end MIDI");

    sameBytes(drumsSource,drumsOut,rid+" drums");
    sameBytes(lowSource,lowOut,rid+" low-end");
    byteIdenticalMidiFiles+=2;

    const sel=readJson(selectionFile);
    if(
      sel.schema!=="fame-owned-beats-audio-to-midi-selected-family-v1"||
      sel.version!==1||
      sel.runId!==RUN_ID||
      sel.sourceRecordId!==rid||
      sel.baseline?.runId!==BASELINE_RUN_ID||
      sel.drums?.armId!==p.selection.drums.armId||
      sel.lowEnd?.armId!==p.selection.lowEnd.armId||
      sel.drums?.humanReviewId!=="audio-to-midi-human-review-v1-001"||
      sel.lowEnd?.humanReviewId!=="basic-pitch-lowend-blind-comparison-v1-002"||
      sel.drums?.humanScore!==drumsReview.scores.get(rid)||
      sel.lowEnd?.humanScore!==lowReview.scores.get(rid)||
      sel.drums?.sha256!==sha256File(drumsSource)||
      sel.lowEnd?.sha256!==sha256File(lowSource)||
      row.drumsMidiSha256!==sel.drums.sha256||
      row.lowEndMidiSha256!==sel.lowEnd.sha256||
      row.drumsHumanScore!==sel.drums.humanScore||
      row.lowEndHumanScore!==sel.lowEnd.humanScore
    ) throw new Error("Selected family provenance/score mismatch: "+rid);
    assertSafety(sel.safety,"Selected family "+rid);

    if(!Array.isArray(sel.knownIssues))throw new Error("Selected family knownIssues invalid: "+rid);
    if(rid===EXPECTED_KNOWN_ISSUE_ID){
      if(sel.knownIssues.length!==1||row.knownIssue!==true)throw new Error("Known issue marker missing: "+rid);
      const issue=sel.knownIssues[0];
      if(
        issue.classification!=="UPSTREAM_SOURCE_SEPARATION_CONTAMINATION"||
        issue.rootCauseLayer!=="source-separation"||
        issue.transcriptionRootCause!==false||
        issue.retainAsDevelopmentRegressionCase!==true||
        issue.lowEndHumanScore!==1||
        issue.reviewerConfirmedCause!==p.knownIssuePolicy.reviewerConfirmedCause
      ) throw new Error("Known issue classification mismatch: "+rid);
      knownIssueFamilies+=1;
    }else if(sel.knownIssues.length!==0||row.knownIssue!==false){
      throw new Error("Unexpected known issue marker: "+rid);
    }

    diagnostics.push({
      sourceRecordId:rid,
      drumsHumanScore:sel.drums.humanScore,
      lowEndHumanScore:sel.lowEnd.humanScore,
      drumsMidiBytes:fs.statSync(drumsOut).size,
      lowEndMidiBytes:fs.statSync(lowOut).size,
      knownIssue:rid===EXPECTED_KNOWN_ISSUE_ID
    });
  }

  if(byteIdenticalMidiFiles!==16||knownIssueFamilies!==1)throw new Error("Selected integration aggregate verification mismatch");

  return{
    mode:"AUDIO_TO_MIDI_SELECTED_INTEGRATION_VERIFY_PASS",
    runId:RUN_ID,
    status:"SELECTED_DEVELOPMENT_INTEGRATION_VERIFIED",
    recordsVerified:8,
    byteIdenticalMidiFilesVerified:16,
    selectedDrumsArm:p.selection.drums.armId,
    selectedLowEndArm:p.selection.lowEnd.armId,
    knownIssueSourceRecordId:EXPECTED_KNOWN_ISSUE_ID,
    knownIssueClassification:"UPSTREAM_SOURCE_SEPARATION_CONTAMINATION",
    knownIssueRootCauseLayer:"source-separation",
    transcriptionRootCause:false,
    diagnostics,
    sourceAudioOpenedByThisCommand:false,
    retranscriptionExecutedByThisCommand:false,
    midiReencodedByThisCommand:false,
    finalHoldoutAccessedByThisCommand:false,
    batch131AccessedByThisCommand:false,
    trainingAuthorized:false,
    taskDataReadyMayBeDeclared:false,
    nextAction:"RUN_AUDIO_TO_MIDI_CLOSING_RESEARCH_AND_CLOSE_DEVELOPMENT_BLOCK"
  };
}

function selfTest(){
  const tmp=fs.mkdtempSync(path.join(require("node:os").tmpdir(),"fame-midi-byte-"));
  try{
    const a=path.join(tmp,"a.mid"),b=path.join(tmp,"b.mid");
    const bytes=Buffer.concat([Buffer.from("MThd"),Buffer.alloc(20,7)]);
    fs.writeFileSync(a,bytes);fs.writeFileSync(b,bytes);
    requireMidi(a,"fixture a");requireMidi(b,"fixture b");sameBytes(a,b,"fixture");
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}
  return{
    mode:"AUDIO_TO_MIDI_SELECTED_INTEGRATION_VERIFY_SELF_TEST_PASS",
    sourceAudioOpenedByThisCommand:false,
    retranscriptionExecutedByThisCommand:false,
    midiReencodedByThisCommand:false
  };
}
function main(args=process.argv.slice(2)){
  const[command,workspace]=args;
  let out;
  if(command==="self-test")out=selfTest();
  else if(command==="verify"){
    if(!workspace)throw new Error("Usage: node verify-audio-to-midi-selected-integration.js verify <workspace>");
    out=verify(workspace);
  }else throw new Error("Unknown command");
  process.stdout.write(JSON.stringify(out,null,2)+"\n");
}
if(require.main===module){try{main()}catch(error){console.error("AUDIO TO MIDI SELECTED INTEGRATION VERIFY FAILED: "+error.message);process.exitCode=1}}
module.exports={verify,selfTest,requireMidi,sameBytes};
