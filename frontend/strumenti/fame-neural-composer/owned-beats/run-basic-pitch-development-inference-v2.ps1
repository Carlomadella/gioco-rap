param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "basic-pitch-development-inference-v1-002"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$lockVerifier = Join-Path $here "verify-basic-pitch-environment-lock.ps1"
$receiptRunner = Join-Path $here "basic-pitch-development-inference-v2.js"
$executor = Join-Path $here "basic-pitch-development-execute-v2.py"
$python = Join-Path $Workspace "venv-basic-pitch\Scripts\python.exe"
$runDir = Join-Path $Workspace ("runs\basic-pitch-development-inference\" + $RunId)
$failureReport = Join-Path $runDir "failure-report.json"

foreach ($file in @($lockVerifier, $receiptRunner, $executor, $python)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Basic Pitch v2 execution prerequisite mancante: $file"
  }
}

Write-Host "1/4 Verify exact Basic Pitch environment/model lock..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $lockVerifier -Workspace $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch environment/model lock verification failed"
}

Write-Host "2/4 Verify frozen superseding AUTHORIZED_NO_INFERENCE receipt..." -ForegroundColor Cyan
& node $receiptRunner check $Workspace $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch superseding receipt check failed"
}

Write-Host "3/4 Run superseding executor self-test (NO audio / NO inference)..." -ForegroundColor Cyan
& $python $executor self-test
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch superseding executor self-test failed"
}

Write-Host "4/4 Execute superseding Basic Pitch on locked 8-family development bass cohort..." -ForegroundColor Cyan
& $python $executor execute $Workspace --run-id $RunId
if ($LASTEXITCODE -ne 0) {
  if (Test-Path -LiteralPath $failureReport -PathType Leaf) {
    Write-Host ""
    Write-Host "=== BASIC_PITCH_FAILURE_REPORT ===" -ForegroundColor Yellow
    Get-Content -LiteralPath $failureReport -Raw
    Write-Host "=== END_BASIC_PITCH_FAILURE_REPORT ===" -ForegroundColor Yellow
  }
  throw "Basic Pitch superseding development inference failed"
}
