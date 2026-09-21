param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "basic-pitch-development-inference-v1-001"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$lockVerifier = Join-Path $here "verify-basic-pitch-environment-lock.ps1"
$receiptRunner = Join-Path $here "basic-pitch-development-inference.js"
$executor = Join-Path $here "basic-pitch-development-execute.py"
$python = Join-Path $Workspace "venv-basic-pitch\Scripts\python.exe"

foreach ($file in @($lockVerifier, $receiptRunner, $executor, $python)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Basic Pitch execution prerequisite mancante: $file"
  }
}

Write-Host "1/4 Verify exact Basic Pitch environment/model lock..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $lockVerifier -Workspace $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch environment/model lock verification failed"
}

Write-Host "2/4 Verify frozen AUTHORIZED_NO_INFERENCE receipt and 8 bass stems..." -ForegroundColor Cyan
& node $receiptRunner check $Workspace $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch development inference receipt check failed"
}

Write-Host "3/4 Run Basic Pitch executor self-test (NO audio / NO inference)..." -ForegroundColor Cyan
& $python $executor self-test
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch executor self-test failed"
}

Write-Host "4/4 Execute append-only Basic Pitch on locked 8-family development bass cohort..." -ForegroundColor Cyan
& $python $executor execute $Workspace --run-id $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch development inference failed"
}
