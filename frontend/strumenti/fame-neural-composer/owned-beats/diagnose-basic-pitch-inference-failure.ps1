param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "basic-pitch-development-inference-v1-001"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$lockVerifier = Join-Path $here "verify-basic-pitch-environment-lock.ps1"
$receiptRunner = Join-Path $here "basic-pitch-development-inference.js"
$doctor = Join-Path $here "basic-pitch-environment-doctor.py"
$executor = Join-Path $here "basic-pitch-development-execute.py"
$python = Join-Path $Workspace "venv-basic-pitch\Scripts\python.exe"
$runDir = Join-Path $Workspace ("runs\basic-pitch-development-inference\" + $RunId)

foreach ($file in @($lockVerifier, $receiptRunner, $doctor, $executor, $python)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Basic Pitch diagnostic prerequisite mancante: $file"
  }
}

Write-Host "=== 1/5 LOCK VERIFY ===" -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $lockVerifier -Workspace $Workspace
if ($LASTEXITCODE -ne 0) { throw "LOCK_VERIFY_FAILED" }

Write-Host "=== 2/5 RECEIPT CHECK ===" -ForegroundColor Cyan
& node $receiptRunner check $Workspace $RunId
if ($LASTEXITCODE -ne 0) { throw "RECEIPT_CHECK_FAILED" }

Write-Host "=== 3/5 EXECUTOR SELF-TEST (NO AUDIO) ===" -ForegroundColor Cyan
& $python $executor self-test
if ($LASTEXITCODE -ne 0) { throw "EXECUTOR_SELF_TEST_FAILED" }

Write-Host "=== 4/5 REAL MODEL LOAD SMOKE (NO AUDIO / NO INFERENCE) ===" -ForegroundColor Cyan
& $python $doctor --load-model-smoke
if ($LASTEXITCODE -ne 0) { throw "MODEL_LOAD_SMOKE_FAILED" }

Write-Host "=== 5/5 EXISTING OUTPUT STATE ===" -ForegroundColor Cyan

$outputRoot = Join-Path $runDir "outputs"
$summary = Join-Path $runDir "inference-summary.json"
$rows = @()

if (Test-Path -LiteralPath $outputRoot -PathType Container) {
  Get-ChildItem -LiteralPath $outputRoot -Directory | Sort-Object Name | ForEach-Object {
    $result = Join-Path $_.FullName "result.json"
    $midi = Join-Path $_.FullName "basic-pitch.mid"
    $rows += [ordered]@{
      sourceRecordId = $_.Name
      resultExists = (Test-Path -LiteralPath $result -PathType Leaf)
      midiExists = (Test-Path -LiteralPath $midi -PathType Leaf)
      resultBytes = if (Test-Path -LiteralPath $result -PathType Leaf) { (Get-Item -LiteralPath $result).Length } else { 0 }
      midiBytes = if (Test-Path -LiteralPath $midi -PathType Leaf) { (Get-Item -LiteralPath $midi).Length } else { 0 }
    }
  }
}

$tempDirs = @()
if (Test-Path -LiteralPath $runDir -PathType Container) {
  $tempDirs = @(
    Get-ChildItem -LiteralPath $runDir -Directory -Force |
      Where-Object { $_.Name -like ".*.tmp" } |
      Select-Object -ExpandProperty Name
  )
}

[ordered]@{
  mode = "BASIC_PITCH_INFERENCE_FAILURE_DIAGNOSTIC_COMPLETE"
  runId = $RunId
  modelLoadSmokePassed = $true
  existingCompletedFamilyDirectories = $rows.Count
  outputs = $rows
  inferenceSummaryExists = (Test-Path -LiteralPath $summary -PathType Leaf)
  leftoverTempDirectories = $tempDirs
  audioDecodedByThisDiagnostic = $false
  basicPitchInferenceExecutedByThisDiagnostic = $false
  midiWrittenByThisDiagnostic = $false
  finalHoldoutAccessedByThisDiagnostic = $false
  batch131AccessedByThisDiagnostic = $false
  trainingAuthorized = $false
  nextAction = "USE_FIRST_FAILING_STAGE_AND_OUTPUT_STATE_TO_PATCH_ROOT_CAUSE"
} | ConvertTo-Json -Depth 12
