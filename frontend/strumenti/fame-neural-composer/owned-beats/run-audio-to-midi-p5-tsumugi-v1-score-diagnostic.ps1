param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$composer = Split-Path -Parent $here
$envSpecPath = Join-Path $here "audio-to-midi-p5-tsumugi-environment-v1.json"
$protocolPath = Join-Path $here "audio-to-midi-p5-tsumugi-v1-score-diagnostic-v1.json"
$runner = Join-Path $here "audio-to-midi-p5-tsumugi-v1-score-diagnostic.py"
$report = Join-Path $here "audio-to-midi-p5-tsumugi-v1-score-diagnostic-report.py"
$staticTest = Join-Path $composer "owned-beats-audio-to-midi-p5-tsumugi-v1-score-diagnostic-test.py"
$reportTest = Join-Path $composer "owned-beats-audio-to-midi-p5-tsumugi-v1-score-diagnostic-report-test.py"

foreach ($file in @($envSpecPath,$protocolPath,$runner,$report,$staticTest,$reportTest)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Tsumugi V1 score diagnostic dependency missing: $file"
  }
}

$envSpec = Get-Content -LiteralPath $envSpecPath -Raw | ConvertFrom-Json
$protocol = Get-Content -LiteralPath $protocolPath -Raw | ConvertFrom-Json
if ([string]$envSpec.status -ne "PREFLIGHT_PASS_LOCKED_BEFORE_FIRST_TSUMUGI_AUDIO_ACCESS") {
  throw "Tsumugi environment preflight is not locked: $($envSpec.status)"
}

$sourceRoot = Join-Path $Workspace ([string]$envSpec.workspace.sourceRelativePath)
$venvPython = Join-Path $sourceRoot ".venv\Scripts\python.exe"
$audioAnalysisPython = Join-Path $Workspace "venv-audio-analysis\Scripts\python.exe"

foreach ($python in @($venvPython,$audioAnalysisPython)) {
  if (-not (Test-Path -LiteralPath $python -PathType Leaf)) {
    throw "Required Python missing: $python"
  }
}

Write-Host "1/2 Tsumugi V1 score diagnostic static/self-test..." -ForegroundColor Cyan
& $audioAnalysisPython $staticTest
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi V1 score diagnostic static test failed"
}
& $venvPython $runner self-test
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi V1 score diagnostic self-test failed"
}

$runId = [string]$protocol.runId
$runDir = Join-Path $Workspace ("runs\audio-to-midi-p5-tsumugi-v1-score-diagnostic\" + $runId)
$summaryFile = Join-Path $runDir "summary.json"

if (Test-Path -LiteralPath $runDir -PathType Container) {
  if (-not (Test-Path -LiteralPath $summaryFile -PathType Leaf)) {
    throw "INCOMPLETE_APPEND_ONLY_V1_SCORE_DIAGNOSTIC: run directory exists without summary.json: $runDir. Do not delete or overwrite it; freeze a new runId before another execution."
  }

  $summary = Get-Content -LiteralPath $summaryFile -Raw | ConvertFrom-Json
  if ([string]$summary.runId -ne $runId) {
    throw "Existing V1 score diagnostic summary runId mismatch: $($summary.runId) != $runId"
  }
  if ([string]$summary.status -ne "TSUMUGI_V1_SCORE_DIAGNOSTIC_COMPLETE_NO_RETUNING") {
    throw "Existing V1 score diagnostic has unexpected status: $($summary.status)"
  }

  Write-Host "2/2 Tsumugi V1 score diagnostic already complete; reusing persisted append-only run..." -ForegroundColor Yellow
}
else {
  Write-Host "2/2 Tsumugi V1 pitch-wise score diagnostic on frozen synthetic fixtures..." -ForegroundColor Cyan
  & $venvPython $runner execute $Workspace
  if ($LASTEXITCODE -ne 0) {
    throw "Tsumugi V1 score diagnostic failed"
  }
}

& $audioAnalysisPython $reportTest
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi V1 score diagnostic report test failed"
}

& $audioAnalysisPython $report self-test
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi V1 score diagnostic report self-test failed"
}

& $audioAnalysisPython $report report $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi V1 score diagnostic report failed"
}
