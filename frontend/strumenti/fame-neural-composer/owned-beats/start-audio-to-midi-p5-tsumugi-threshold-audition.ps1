param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$SourceRecordId = "FAME000126",
  [int]$Port = 0
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-p5-tsumugi-threshold-audition.js"

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Tsumugi threshold audition tool mancante: $tool"
}

Write-Host "1/2 Tsumugi threshold audition self-test..." -ForegroundColor Cyan
& node $tool self-test
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi threshold audition self-test failed"
}

Write-Host "2/2 Open threshold audition for $SourceRecordId..." -ForegroundColor Cyan
& node $tool serve $Workspace $SourceRecordId $Port
if ($LASTEXITCODE -ne 0) {
  throw "Tsumugi threshold audition failed"
}
