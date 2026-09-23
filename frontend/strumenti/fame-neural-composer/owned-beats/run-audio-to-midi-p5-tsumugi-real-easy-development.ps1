param([string]$Workspace = "D:\FAME_NEURAL")
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$composer = Split-Path -Parent $here
$envSpecPath = Join-Path $here "audio-to-midi-p5-tsumugi-environment-v1.json"
$protocolPath = Join-Path $here "audio-to-midi-p5-tsumugi-real-easy-development-v1.json"
$runner = Join-Path $here "audio-to-midi-p5-tsumugi-real-easy-development.py"
$staticTest = Join-Path $composer "owned-beats-audio-to-midi-p5-tsumugi-real-easy-development-test.py"

foreach ($file in @($envSpecPath,$protocolPath,$runner,$staticTest)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Tsumugi real-easy dependency missing: $file" }
}
$envSpec = Get-Content -LiteralPath $envSpecPath -Raw | ConvertFrom-Json
$sourceRoot = Join-Path $Workspace ([string]$envSpec.workspace.sourceRelativePath)
$venvPython = Join-Path $sourceRoot ".venv\Scripts\python.exe"
$audioAnalysisPython = Join-Path $Workspace "venv-audio-analysis\Scripts\python.exe"
foreach ($python in @($venvPython,$audioAnalysisPython)) {
  if (-not (Test-Path -LiteralPath $python -PathType Leaf)) { throw "Required Python missing: $python" }
}

Write-Host "1/2 Tsumugi real-easy development static/self-test..." -ForegroundColor Cyan
& $audioAnalysisPython $staticTest
if ($LASTEXITCODE -ne 0) { throw "Tsumugi real-easy static test failed" }
& $venvPython $runner self-test
if ($LASTEXITCODE -ne 0) { throw "Tsumugi real-easy self-test failed" }

Write-Host "2/2 Tsumugi on 3 frozen already-consumed development drums stems..." -ForegroundColor Cyan
& $venvPython $runner execute $Workspace
if ($LASTEXITCODE -ne 0) { throw "Tsumugi real-easy development diagnostic failed" }
