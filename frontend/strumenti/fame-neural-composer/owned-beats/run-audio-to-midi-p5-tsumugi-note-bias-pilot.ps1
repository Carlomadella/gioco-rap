param([string]$Workspace = "D:\FAME_NEURAL")

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$envSpecPath = Join-Path $here "audio-to-midi-p5-tsumugi-environment-v1.json"
$protocolPath = Join-Path $here "audio-to-midi-p5-tsumugi-note-bias-pilot-v1.json"
$runner = Join-Path $here "audio-to-midi-p5-tsumugi-note-bias-pilot.py"

foreach ($file in @($envSpecPath,$protocolPath,$runner)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Tsumugi note-bias pilot dependency missing: $file"
  }
}

$envSpec = Get-Content -LiteralPath $envSpecPath -Raw | ConvertFrom-Json
$sourceRoot = Join-Path $Workspace ([string]$envSpec.workspace.sourceRelativePath)
$venvPython = Join-Path $sourceRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython -PathType Leaf)) {
  throw "Tsumugi Python missing: $venvPython"
}

Write-Host "1/3 Tsumugi V1 note-bias pilot self-test..." -ForegroundColor Cyan
& $venvPython $runner self-test
if ($LASTEXITCODE -ne 0) { throw "Tsumugi note-bias pilot self-test failed" }

Write-Host "2/3 Tsumugi V1 note-bias pilot preflight (NO inference)..." -ForegroundColor Cyan
& $venvPython $runner preflight $Workspace
if ($LASTEXITCODE -ne 0) { throw "Tsumugi note-bias pilot preflight failed" }

Write-Host "3/3 FAME000126 note-bias pilot: 0, -0.25, -0.5, -1, -2 ..." -ForegroundColor Cyan
& $venvPython $runner execute $Workspace
if ($LASTEXITCODE -ne 0) { throw "Tsumugi note-bias pilot failed" }
