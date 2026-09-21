param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$specPath = Join-Path $here "basic-pitch-environment-v1.json"
$protocolPath = Join-Path $here "basic-pitch-lowend-candidate-protocol-v1.json"
$doctorPath = Join-Path $here "basic-pitch-environment-doctor.py"

foreach ($file in @($specPath, $protocolPath, $doctorPath)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "File Basic Pitch richiesto mancante: $file"
  }
}

$spec = Get-Content -LiteralPath $specPath -Raw | ConvertFrom-Json
$protocol = Get-Content -LiteralPath $protocolPath -Raw | ConvertFrom-Json

if ([string]$spec.status -ne "EXACT_TRANSITIVE_LOCK_COMMITTED") {
  throw "Spec Basic Pitch non nello stato exact-lock committed: $($spec.status)"
}
if ([string]$protocol.status -ne "ENVIRONMENT_AND_MODEL_FROZEN_AWAITING_PREINFERENCE_VERIFY") {
  throw "Protocollo Basic Pitch non pronto per la verifica pre-inference: $($protocol.status)"
}

$lockPath = Join-Path $here ([string]$spec.lock.path)
$runDir = Join-Path $Workspace ("runs\basic-pitch-environment\" + [string]$spec.lock.sourceRunId)
$freezePath = Join-Path $runDir "pip-freeze-all.txt"
$receiptPath = Join-Path $runDir "environment-receipt.json"
$venvPython = Join-Path $Workspace "venv-basic-pitch\Scripts\python.exe"

foreach ($file in @($lockPath, $freezePath, $receiptPath, $venvPython)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "File richiesto mancante: $file"
  }
}

$receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
$freezeSha = (Get-FileHash -LiteralPath $freezePath -Algorithm SHA256).Hash.ToLowerInvariant()
$lockSha = (Get-FileHash -LiteralPath $lockPath -Algorithm SHA256).Hash.ToLowerInvariant()

if ($freezeSha -ne [string]$spec.lock.sourcePipFreezeAllSha256) {
  throw "SHA freeze locale diverso dallo snapshot revisionato: $freezeSha"
}
if ($freezeSha -ne [string]$receipt.pipFreezeAllSha256) {
  throw "SHA freeze locale diverso dal receipt: $freezeSha"
}
if ($lockSha -ne [string]$spec.lock.repositoryCanonicalSha256) {
  throw "SHA lock repository diverso dal canonico: $lockSha"
}
if ($lockSha -ne [string]$protocol.environment.repositoryLockSha256) {
  throw "SHA lock repository diverso dal protocollo candidato: $lockSha"
}

$freezePackages = @(
  Get-Content -LiteralPath $freezePath |
    Where-Object { $_.Trim().Length -gt 0 } |
    ForEach-Object { $_.Trim() }
)
$lockPackages = @(
  Get-Content -LiteralPath $lockPath |
    Where-Object { $_.Trim().Length -gt 0 -and -not $_.Trim().StartsWith("#") } |
    ForEach-Object { $_.Trim() }
)

if (($freezePackages -join "`n") -ne ($lockPackages -join "`n")) {
  throw "Il package set del lock Basic Pitch non coincide con pip freeze --all"
}
if ($lockPackages.Count -ne [int]$spec.lock.packageCount) {
  throw "Numero package lock inatteso: $($lockPackages.Count)"
}
if ($lockPackages.Count -ne [int]$protocol.environment.packageCount) {
  throw "Numero package protocollo inatteso: $($lockPackages.Count)"
}

if ([string]$receipt.basicPitch.version -ne [string]$spec.package.version) {
  throw "Basic Pitch receipt inatteso: $($receipt.basicPitch.version)"
}
if ([string]$receipt.runtime.selectedBackend -ne [string]$spec.runtime.expectedBackend) {
  throw "Backend receipt inatteso: $($receipt.runtime.selectedBackend)"
}
if ([string]$receipt.runtime.onnxRuntimeVersion -ne [string]$spec.runtime.observedOnnxRuntimeVersion) {
  throw "ONNX Runtime receipt inatteso: $($receipt.runtime.onnxRuntimeVersion)"
}
if ([string]$receipt.packagedModel.sha256 -ne [string]$spec.runtime.packagedModel.sha256) {
  throw "SHA modello receipt diverso dal freeze"
}
if ([int64]$receipt.packagedModel.bytes -ne [int64]$spec.runtime.packagedModel.bytes) {
  throw "Dimensione modello receipt diversa dal freeze"
}

$doctorJson = & $venvPython $doctorPath
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch doctor fallito durante verifica lock"
}
$doctor = ($doctorJson -join [Environment]::NewLine) | ConvertFrom-Json

if ([string]$doctor.python.majorMinor -ne [string]$spec.python.requiredMajorMinor) {
  throw "Python corrente Basic Pitch inatteso: $($doctor.python.version)"
}
if ([string]$doctor.basicPitch.version -ne [string]$spec.package.version) {
  throw "Basic Pitch corrente diverso dal freeze: $($doctor.basicPitch.version)"
}
if ([string]$doctor.runtime.selectedBackend -ne [string]$spec.runtime.expectedBackend) {
  throw "Backend corrente diverso dal freeze: $($doctor.runtime.selectedBackend)"
}
if ([string]$doctor.runtime.onnxRuntimeVersion -ne [string]$spec.runtime.observedOnnxRuntimeVersion) {
  throw "ONNX Runtime corrente diverso dal freeze: $($doctor.runtime.onnxRuntimeVersion)"
}
if ([string]$doctor.model.sha256 -ne [string]$spec.runtime.packagedModel.sha256) {
  throw "SHA modello corrente diverso dal freeze"
}
if ([int64]$doctor.model.bytes -ne [int64]$spec.runtime.packagedModel.bytes) {
  throw "Dimensione modello corrente diversa dal freeze"
}

if ($receipt.sourceAudioOpenedByThisCommand -ne $false -or
    $receipt.transcriptionExecutedByThisCommand -ne $false -or
    $receipt.finalHoldoutAccessedByThisCommand -ne $false -or
    $receipt.batch131AccessedByThisCommand -ne $false -or
    $receipt.trainingAuthorized -ne $false) {
  throw "Safety receipt Basic Pitch non valida"
}

[ordered]@{
  mode = "BASIC_PITCH_ENVIRONMENT_LOCK_VERIFY_PASS"
  sourceRunId = [string]$spec.lock.sourceRunId
  sourceFreezeSha256 = $freezeSha
  repositoryLockSha256 = $lockSha
  packageCount = $lockPackages.Count
  packageSetMatchesFreeze = $true
  pythonVersion = [string]$doctor.python.version
  basicPitchVersion = [string]$doctor.basicPitch.version
  selectedBackend = [string]$doctor.runtime.selectedBackend
  onnxRuntimeVersion = [string]$doctor.runtime.onnxRuntimeVersion
  modelFilename = [string]$doctor.model.filename
  modelBytes = [int64]$doctor.model.bytes
  modelSha256 = [string]$doctor.model.sha256
  sourceAudioOpenedByThisCommand = $false
  transcriptionExecutedByThisCommand = $false
  finalHoldoutAccessedByThisCommand = $false
  batch131AccessedByThisCommand = $false
  trainingAuthorized = $false
  nextAction = "PREPARE_BASIC_PITCH_PREINFERENCE_GATE"
} | ConvertTo-Json -Depth 10
