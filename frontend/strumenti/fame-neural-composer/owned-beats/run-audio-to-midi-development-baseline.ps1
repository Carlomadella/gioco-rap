param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "audio-to-midi-development-baseline-v1-001"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-development-baseline.py"
$python = Join-Path $Workspace "venv-audio-analysis\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Audio to MIDI baseline tool mancante: $tool"
}
if (-not (Test-Path -LiteralPath $python -PathType Leaf)) {
  throw "Audio Analysis venv Python mancante: $python"
}

Write-Host "Verify Audio to MIDI frozen development preflight..." -ForegroundColor Cyan
& $python $tool preflight $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Audio to MIDI development baseline preflight failed"
}

Write-Host "Execute append-only Audio to MIDI baseline on locked 8-family development cohort..." -ForegroundColor Cyan
& $python $tool execute $Workspace --run-id $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Audio to MIDI development baseline execution failed"
}
