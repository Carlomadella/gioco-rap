param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "verify-audio-to-midi-selected-integration.js"

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Selected Audio->MIDI verifier missing: $tool"
}

Write-Host "1/2 Selected integration verifier self-test..." -ForegroundColor Cyan
& node $tool self-test
if ($LASTEXITCODE -ne 0) {
  throw "Selected Audio->MIDI verifier self-test failed"
}

Write-Host "2/2 Verify selected integration outputs read-only..." -ForegroundColor Cyan
& node $tool verify $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Selected Audio->MIDI integration verification failed"
}
