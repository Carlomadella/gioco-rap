param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$composer = Split-Path -Parent $here
$python = Join-Path $Workspace "venv-audio-analysis\Scripts\python.exe"
$test = Join-Path $composer "owned-beats-audio-to-midi-p3-controlled-test.py"
$prepare = Join-Path $here "audio-to-midi-p3-fixtures.py"
$baseline = Join-Path $here "audio-to-midi-p3-controlled-baseline.py"

foreach ($file in @($python, $test, $prepare, $baseline)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "P3 controlled-stage dependency missing: $file"
  }
}

Write-Host "1/3 P3 controlled self-test..." -ForegroundColor Cyan
& $python $test
if ($LASTEXITCODE -ne 0) { throw "P3 controlled self-test failed" }

Write-Host "2/3 Prepare + hash-freeze 12 controlled fixtures (0 owned-beat families)..." -ForegroundColor Cyan
& $python $prepare prepare $Workspace
if ($LASTEXITCODE -ne 0) { throw "P3 controlled fixture preparation failed" }

Write-Host "3/3 Run frozen Audio->MIDI baseline on controlled clean stems..." -ForegroundColor Cyan
& $python $baseline execute $Workspace
if ($LASTEXITCODE -ne 0) { throw "P3 controlled baseline execution failed" }
