param([string]$Workspace = "D:\FAME_NEURAL")
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "prepare-audio-to-midi-p6-independent-evaluation.js"
$test = Join-Path (Split-Path -Parent $here) "owned-beats-audio-to-midi-p6-independent-evaluation-test.js"
if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) { throw "P6 selector missing: $tool" }
if (-not (Test-Path -LiteralPath $test -PathType Leaf)) { throw "P6 selector test missing: $test" }
Write-Host "1/2 P6 selector self-test..." -ForegroundColor Cyan
& node $test
if ($LASTEXITCODE -ne 0) { throw "P6 selector self-test failed" }
Write-Host "2/2 P6 metadata-only cohort preview (NO audio access)..." -ForegroundColor Cyan
& node $tool preview $Workspace
if ($LASTEXITCODE -ne 0) { throw "P6 cohort preview failed" }
