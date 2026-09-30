param([string]$Workspace = "D:\FAME_NEURAL")

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$envSpecPath = Join-Path $here "audio-to-midi-p5-tsumugi-environment-v1.json"
$protocolPath = Join-Path $here "audio-to-midi-p5-tsumugi-threshold-sweep-v1.json"
$runner = Join-Path $here "audio-to-midi-p5-tsumugi-threshold-sweep.py"

foreach ($file in @($envSpecPath,$protocolPath,$runner)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Tsumugi threshold-sweep dependency missing: $file"
  }
}

$envSpec = Get-Content -LiteralPath $envSpecPath -Raw | ConvertFrom-Json
$sourceRoot = Join-Path $Workspace ([string]$envSpec.workspace.sourceRelativePath)
$venvPython = Join-Path $sourceRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython -PathType Leaf)) {
  throw "Tsumugi Python missing: $venvPython"
}

Write-Host "1/3 Tsumugi threshold-sweep self-test..." -ForegroundColor Cyan
& $venvPython $runner self-test
if ($LASTEXITCODE -ne 0) { throw "Tsumugi threshold-sweep self-test failed" }

Write-Host "2/3 Tsumugi threshold-sweep preflight (NO inference)..." -ForegroundColor Cyan
& $venvPython $runner preflight $Workspace
if ($LASTEXITCODE -ne 0) { throw "Tsumugi threshold-sweep preflight failed" }

Write-Host "3/3 Development-only threshold sweep: -3, -2, -1, 0 ..." -ForegroundColor Cyan
& $venvPython $runner execute $Workspace
if ($LASTEXITCODE -ne 0) { throw "Tsumugi threshold sweep failed" }
