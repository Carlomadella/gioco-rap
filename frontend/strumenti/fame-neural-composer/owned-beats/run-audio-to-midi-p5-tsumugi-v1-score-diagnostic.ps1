param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$composer = Split-Path -Parent $here
$envSpecPath = Join-Path $here "audio-to-midi-p5-tsumugi-environment-v1.json"
$protocolPath = Join-Path $here "audio-to-midi-p5-tsumugi-v1-score-diagnostic-v1.json"
$runner = Join-Path $here "audio-to-midi-p5-tsumugi-v1-score-diagnostic.py"
$staticTest = Join-Path $composer "owned-beats-audio-to-midi-p5-tsumugi-v1-score-diagnostic-test.py"

foreach ($file in @($envSpecPath,$protocolPath,$runner,$staticTest)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Tsumugi V1 score diagnostic dependency missing: $file"
  }
}

$envSpec = Get-Content -LiteralPath $envSpecPath -Raw | ConvertFrom-Json
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

Write-Host "2/2 Tsumugi V1 pitch-wise score diagnostic on frozen synthetic fixtures..." -ForegroundColor Cyan
& $venvPython $runner execute $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi V1 score diagnostic failed"
}
