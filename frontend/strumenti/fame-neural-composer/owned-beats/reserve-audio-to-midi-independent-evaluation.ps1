param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-independent-evaluation-gate.js"

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Audio->MIDI independent evaluation gate missing: $tool"
}

Write-Host "1/4 Frozen evaluation gate self-test..." -ForegroundColor Cyan
& node $tool self-test
if ($LASTEXITCODE -ne 0) { throw "Evaluation gate self-test failed" }

Write-Host "2/4 Metadata-only preflight against local manifest..." -ForegroundColor Cyan
& node $tool preflight $Workspace
if ($LASTEXITCODE -ne 0) { throw "Evaluation preflight failed" }

Write-Host "3/4 Reserve frozen cohort and assign planned split (NO audio access)..." -ForegroundColor Cyan
& node $tool reserve $Workspace
if ($LASTEXITCODE -ne 0) { throw "Evaluation reservation failed" }

Write-Host "4/4 Verify reservation read-only..." -ForegroundColor Cyan
& node $tool check $Workspace
if ($LASTEXITCODE -ne 0) { throw "Evaluation reservation verification failed" }
