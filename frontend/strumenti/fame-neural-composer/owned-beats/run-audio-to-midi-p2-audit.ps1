param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "audio-to-midi-independent-evaluation-v1-001"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-p2-audit.js"

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Audio->MIDI P2 audit tool mancante: $tool"
}

Write-Host "Run Audio->MIDI P2 diagnostic audit (READ-ONLY)..." -ForegroundColor Cyan
& node $tool audit $Workspace $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Audio->MIDI P2 diagnostic audit failed"
}
