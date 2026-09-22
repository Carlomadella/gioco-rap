param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$composer = Split-Path -Parent $here
$envSpecPath = Join-Path $here "audio-to-midi-p5-tsumugi-environment-v1.json"
$protocolPath = Join-Path $here "audio-to-midi-p5-tsumugi-controlled-protocol-v1.json"
$runner = Join-Path $here "audio-to-midi-p5-tsumugi-controlled.py"
$staticTest = Join-Path $composer "owned-beats-audio-to-midi-p5-tsumugi-controlled-test.py"

foreach ($file in @($envSpecPath,$protocolPath,$runner,$staticTest)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Tsumugi controlled dependency missing: $file"
  }
}

$envSpec = Get-Content -LiteralPath $envSpecPath -Raw | ConvertFrom-Json
if ([string]$envSpec.status -ne "PREFLIGHT_PASS_LOCKED_BEFORE_FIRST_TSUMUGI_AUDIO_ACCESS") {
  throw "Tsumugi environment preflight is not locked: $($envSpec.status)"
}

$sourceRoot = Join-Path $Workspace ([string]$envSpec.workspace.sourceRelativePath)
$venvPython = Join-Path $sourceRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython -PathType Leaf)) {
  throw "Frozen Tsumugi venv Python missing: $venvPython"
}

$audioAnalysisPython = Join-Path $Workspace "venv-audio-analysis\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $audioAnalysisPython -PathType Leaf)) {
  throw "Audio Analysis Python missing for static repo test: $audioAnalysisPython"
}

Write-Host "1/3 Tsumugi controlled static freeze test..." -ForegroundColor Cyan
& $audioAnalysisPython $staticTest
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi controlled static freeze test failed"
}

Write-Host "2/3 Tsumugi controlled runner self-test..." -ForegroundColor Cyan
& $venvPython $runner self-test
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi controlled runner self-test failed"
}

Write-Host "3/3 Tsumugi controlled fixture inference (8 frozen synthetic drums fixtures)..." -ForegroundColor Cyan
& $venvPython $runner execute $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi controlled fixture inference failed"
}
