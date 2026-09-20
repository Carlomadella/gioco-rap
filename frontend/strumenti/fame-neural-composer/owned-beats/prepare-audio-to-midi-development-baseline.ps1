param(
  [string]$Workspace = "D:\FAME_NEURAL"
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

Write-Host "Run Audio to MIDI development preflight (NO transcription)..." -ForegroundColor Cyan
& $python $tool preflight $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Audio to MIDI development baseline preflight failed"
}
