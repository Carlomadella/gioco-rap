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

$runDir = Join-Path $Workspace ("runs\basic-pitch-environment\" + [string]$spec.lock.sourceRunId)
$receiptPath = Join-Path $runDir "environment-receipt.json"
$freezePath = Join-Path $runDir "pip-freeze-all.txt"
$venvPython = Join-Path $Workspace "venv-basic-pitch\Scripts\python.exe"

foreach ($file in @($receiptPath, $freezePath, $venvPython)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "File Basic Pitch locale richiesto mancante: $file"
  }
}

$receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
$freezeSha = (Get-FileHash -LiteralPath $freezePath -Algorithm SHA256).Hash.ToLowerInvariant()

if ($freezeSha -ne [string]$receipt.pipFreezeAllSha256) {
  throw "SHA pip freeze locale diverso dal receipt: $freezeSha"
}
if ($freezeSha -ne [string]$spec.lock.sourcePipFreezeAllSha256) {
  throw "SHA pip freeze locale diverso dalla spec congelata: $freezeSha"
}
if ($freezeSha -ne [string]$protocol.environment.sourcePipFreezeAllSha256) {
  throw "SHA pip freeze locale diverso dal protocollo candidato: $freezeSha"
}

if ([string]$receipt.python.majorMinor -ne [string]$spec.python.requiredMajorMinor) {
  throw "Python receipt inatteso: $($receipt.python.majorMinor)"
}
if (-not ([string]$receipt.python.version).StartsWith("$($spec.python.observedVersion) ")) {
  throw "Versione Python receipt diversa dalla versione osservata congelata: $($receipt.python.version)"
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
if ([string]$receipt.packagedModel.filename -ne [string]$spec.runtime.packagedModel.filename) {
  throw "Nome modello receipt inatteso: $($receipt.packagedModel.filename)"
}
if ([int64]$receipt.packagedModel.bytes -ne [int64]$spec.runtime.packagedModel.bytes) {
  throw "Dimensione modello receipt inattesa: $($receipt.packagedModel.bytes)"
}
if ([string]$receipt.packagedModel.sha256 -ne [string]$spec.runtime.packagedModel.sha256) {
  throw "SHA modello receipt diverso dalla spec congelata"
}
if ([string]$receipt.packagedModel.sha256 -ne [string]$protocol.environment.packagedModel.sha256) {
  throw "SHA modello receipt diverso dal protocollo candidato"
}

$doctorJson = & $venvPython $doctorPath
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch doctor fallito durante verifica bootstrap"
}
$doctor = ($doctorJson -join [Environment]::NewLine) | ConvertFrom-Json

if ([string]$doctor.basicPitch.version -ne [string]$spec.package.version) {
  throw "Basic Pitch attuale diverso dal freeze: $($doctor.basicPitch.version)"
}
if ([string]$doctor.runtime.selectedBackend -ne [string]$spec.runtime.expectedBackend) {
  throw "Backend Basic Pitch attuale diverso dal freeze: $($doctor.runtime.selectedBackend)"
}
if ([string]$doctor.runtime.onnxRuntimeVersion -ne [string]$spec.runtime.observedOnnxRuntimeVersion) {
  throw "ONNX Runtime attuale diverso dal freeze: $($doctor.runtime.onnxRuntimeVersion)"
}
if ([string]$doctor.model.sha256 -ne [string]$spec.runtime.packagedModel.sha256) {
  throw "SHA modello attuale diverso dal freeze"
}
if ([int64]$doctor.model.bytes -ne [int64]$spec.runtime.packagedModel.bytes) {
  throw "Dimensione modello attuale diversa dal freeze"
}

$packages = @(
  Get-Content -LiteralPath $freezePath |
    Where-Object { $_.Trim().Length -gt 0 } |
    ForEach-Object { $_.Trim() }
)

$requiredLines = @(
  "basic-pitch==0.4.0",
  "onnxruntime==1.23.2",
  "pip==25.2",
  "setuptools==80.9.0",
  "wheel==0.45.1"
)

foreach ($line in $requiredLines) {
  if ($packages -notcontains $line) {
    throw "Package richiesto assente dal freeze: $line"
  }
}

if ($receipt.sourceAudioOpenedByThisCommand -ne $false -or
    $receipt.transcriptionExecutedByThisCommand -ne $false -or
    $receipt.finalHoldoutAccessedByThisCommand -ne $false -or
    $receipt.batch131AccessedByThisCommand -ne $false -or
    $receipt.trainingAuthorized -ne $false) {
  throw "Safety receipt Basic Pitch non valida"
}

[ordered]@{
  mode = "BASIC_PITCH_ENVIRONMENT_BOOTSTRAP_VERIFY_PASS"
  sourceRunId = [string]$spec.lock.sourceRunId
  packageCount = $packages.Count
  pipFreezeAllSha256 = $freezeSha
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
  lockCommitted = $false
  modelShaCommitted = $true
  nextAction = "COMMIT_EXACT_TRANSITIVE_LOCK"
} | ConvertTo-Json -Depth 10
