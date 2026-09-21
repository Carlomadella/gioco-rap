param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "prepare-audio-to-midi-independent-evaluation.js"

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Audio->MIDI independent evaluation selector missing: $tool"
}

Write-Host "1/4 Selector self-test (metadata only)..." -ForegroundColor Cyan
& node $tool self-test
if ($LASTEXITCODE -ne 0) { throw "Evaluation selector self-test failed" }

Write-Host "2/4 Preview fresh independent cohort (NO audio access)..." -ForegroundColor Cyan
& node $tool preview $Workspace
if ($LASTEXITCODE -ne 0) { throw "Evaluation cohort preview failed" }

Write-Host "3/4 Prepare append-only cohort reference (NO audio access)..." -ForegroundColor Cyan
& node $tool prepare $Workspace
if ($LASTEXITCODE -ne 0) { throw "Evaluation cohort preparation failed" }

Write-Host "4/4 Print prepared cohort reference..." -ForegroundColor Cyan
& node $tool report $Workspace
if ($LASTEXITCODE -ne 0) { throw "Evaluation cohort report failed" }
