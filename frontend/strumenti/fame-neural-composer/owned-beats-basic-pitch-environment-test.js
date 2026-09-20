"use strict";

const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");

const root=__dirname;
const owned=path.join(root,"owned-beats");
const spec=JSON.parse(fs.readFileSync(path.join(owned,"basic-pitch-environment-v1.json"),"utf8"));
const protocol=JSON.parse(fs.readFileSync(path.join(owned,"basic-pitch-lowend-candidate-protocol-v1.json"),"utf8"));
const prepare=fs.readFileSync(path.join(owned,"prepare-basic-pitch-environment.ps1"),"utf8");
const doctor=fs.readFileSync(path.join(owned,"basic-pitch-environment-doctor.py"),"utf8");

assert.equal(spec.schema,"fame-owned-beats-basic-pitch-environment-v1");
assert.equal(spec.status,"BOOTSTRAP_PENDING_EXACT_TRANSITIVE_LOCK");
assert.equal(spec.python.requiredMajorMinor,"3.10");
assert.equal(spec.package.version,"0.4.0");
assert.equal(spec.package.repositoryTag,"v0.4.0");
assert.equal(spec.package.repositoryCommit,"9991303bba609a3b93089d13ec80d1d495083596");
assert.equal(spec.runtime.expectedBackend,"ONNX");
assert.equal(spec.runtime.modelPathMustEndWith,"nmp.onnx");
assert.equal(spec.workspace.venvRelativePath,"venv-basic-pitch");
assert.equal(spec.safety.reuseAudioAnalysisVenv,false);
assert.equal(spec.safety.reuseSourceSeparationVenv,false);
assert.equal(spec.safety.sourceAudioAccessAllowedDuringSetup,false);
assert.equal(spec.safety.transcriptionAllowedDuringSetup,false);
assert.equal(spec.safety.finalHoldoutAccessAllowedDuringSetup,false);
assert.equal(spec.freezePolicy.bootstrapPinsAreNotTheFinalLock,true);
assert.equal(spec.freezePolicy.capturePipFreezeAll,true);
assert.equal(spec.freezePolicy.capturePackagedModelSha256,true);

assert.equal(protocol.schema,"fame-owned-beats-basic-pitch-lowend-candidate-protocol-v1");
assert.equal(protocol.status,"ENVIRONMENT_BOOTSTRAP_PENDING_BEFORE_FIRST_INFERENCE");
assert.equal(protocol.candidateId,"basic-pitch-0.4.0-lowend-v1");
assert.equal(protocol.package.repositoryTagCommit,"9991303bba609a3b93089d13ec80d1d495083596");
assert.equal(protocol.prerequisite.selectedDrumsArm,"drums-bass-kick-fusion-v1");
assert.equal(protocol.prerequisite.pyinGatePass,true);
assert.equal(protocol.environment.exactTransitiveLockRequiredBeforeInference,true);
assert.equal(protocol.environment.exactPackagedModelSha256RequiredBeforeInference,true);
assert.equal(protocol.safety.noBasicPitchInferenceUntilLockAndModelFreeze,true);

assert(prepare.includes('"basic-pitch==$basicPitchVersion"'));
assert(prepare.includes("pip freeze --all"));
assert(prepare.includes("BASIC_PITCH_ENVIRONMENT_BOOTSTRAP_PASS"));
assert(prepare.includes("sourceAudioOpenedByThisCommand = $false"));
assert(prepare.includes("transcriptionExecutedByThisCommand = $false"));
assert(prepare.includes("lockCommitted = $false"));
assert(prepare.includes("modelShaCommitted = $false"));
assert(!prepare.includes("predict("));
assert(!prepare.includes("predict_and_save"));
assert(!prepare.includes("source-separation-development-inference"));
assert(!prepare.includes("bass.wav"));

assert(doctor.includes("ICASSP_2022_MODEL_PATH"));
assert(doctor.includes("ONNX_PRESENT"));
assert(doctor.includes("sha256_file(model)"));
assert(!doctor.includes("predict("));
assert(!doctor.includes("librosa.load"));
assert(!doctor.includes("soundfile"));

console.log("owned-beats-basic-pitch-environment-test: PASS");
