param([string]$Workspace = "D:\FAME_NEURAL")
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-p6-independent-evaluation-gate.js"
$test = Join-Path (Split-Path -Parent $here) "owned-beats-audio-to-midi-p6-independent-evaluation-gate-test.js"
foreach ($file in @($tool,$test)) { if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "P6 reservation dependency missing: $file" } }
Write-Host "1/4 P6 reservation gate self-test..." -ForegroundColor Cyan
& node $test
if ($LASTEXITCODE -ne 0) { throw "P6 reservation gate self-test failed" }
Write-Host "2/4 P6 metadata-only reservation preflight..." -ForegroundColor Cyan
& node $tool preflight $Workspace
if ($LASTEXITCODE -ne 0) { throw "P6 reservation preflight failed" }
Write-Host "3/4 Reserve frozen P6 cohort and assign split (NO audio access)..." -ForegroundColor Cyan
& node $tool reserve $Workspace
if ($LASTEXITCODE -ne 0) { throw "P6 reservation failed" }
Write-Host "4/4 Verify P6 reservation read-only..." -ForegroundColor Cyan
& node $tool check $Workspace
if ($LASTEXITCODE -ne 0) { throw "P6 reservation check failed" }
