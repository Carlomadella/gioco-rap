param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "audio-to-midi-independent-evaluation-v1-001"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-independent-evaluation-qa.js"

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Independent evaluation technical QA tool mancante: $tool"
}

Write-Host "Run independent Audio to MIDI technical QA..." -ForegroundColor Cyan
& node $tool technical $Workspace $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Independent Audio to MIDI technical QA failed"
}
