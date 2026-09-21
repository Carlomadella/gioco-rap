param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$lockVerifier = Join-Path $here "verify-basic-pitch-environment-lock.ps1"
$dataGate = Join-Path $here "basic-pitch-preinference.js"

foreach ($file in @($lockVerifier, $dataGate)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Basic Pitch pre-inference prerequisite mancante: $file"
  }
}

Write-Host "1/2 Verify exact Basic Pitch environment/model lock..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $lockVerifier -Workspace $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch environment/model lock verification failed"
}

Write-Host "2/2 Verify frozen 8-family development inputs and Human QA prerequisite..." -ForegroundColor Cyan
& node $dataGate preflight $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch development data gate failed"
}

[ordered]@{
  mode = "BASIC_PITCH_PREINFERENCE_GATE_PASS"
  workspace = $Workspace
  environmentLockVerified = $true
  developmentFamiliesVerified = 8
  bassStemIntegrityBytesReadByThisCommand = $true
  audioDecodedByThisCommand = $false
  basicPitchInferenceExecutedByThisCommand = $false
  midiWrittenByThisCommand = $false
  originalSourceAudioOpenedByThisCommand = $false
  finalHoldoutAccessedByThisCommand = $false
  batch131AccessedByThisCommand = $false
  trainingAuthorized = $false
  taskDataReadyMayBeDeclared = $false
  nextAction = "PREPARE_BASIC_PITCH_APPEND_ONLY_INFERENCE_RECEIPT"
} | ConvertTo-Json -Depth 8
