param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$SourceRecordId = "FAME000126",
  [int]$Port = 0
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-audition.js"

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Audio->MIDI audition tool mancante: $tool"
}

Write-Host "1/2 Audio->MIDI audition self-test..." -ForegroundColor Cyan
& node $tool self-test
if ($LASTEXITCODE -ne 0) {
  throw "Audio->MIDI audition self-test failed"
}

Write-Host "2/2 Open read-only audition for $SourceRecordId..." -ForegroundColor Cyan
& node $tool serve $Workspace $SourceRecordId $Port
if ($LASTEXITCODE -ne 0) {
  throw "Audio->MIDI audition server failed"
}
