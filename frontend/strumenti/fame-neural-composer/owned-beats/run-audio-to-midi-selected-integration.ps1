param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "audio-to-midi-selected-integration-v1-001"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-selected-integration.js"

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Selected Audio->MIDI integration tool missing: $tool"
}

Write-Host "1/3 Selected integration self-test (NO audio / NO transcription)..." -ForegroundColor Cyan
& node $tool self-test
if ($LASTEXITCODE -ne 0) {
  throw "Selected Audio->MIDI integration self-test failed"
}

Write-Host "2/3 Validate frozen reviews, 8-family baseline and known issue..." -ForegroundColor Cyan
& node $tool preflight $Workspace $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Selected Audio->MIDI integration preflight failed"
}

Write-Host "3/3 Build append-only selected development integration..." -ForegroundColor Cyan
& node $tool execute $Workspace $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Selected Audio->MIDI integration execution failed"
}
