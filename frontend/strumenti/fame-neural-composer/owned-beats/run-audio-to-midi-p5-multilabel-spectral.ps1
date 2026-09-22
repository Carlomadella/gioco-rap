param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$composer = Split-Path -Parent $here
$python = Join-Path $Workspace "venv-audio-analysis\Scripts\python.exe"
$test = Join-Path $composer "owned-beats-audio-to-midi-p5-multilabel-spectral-test.py"
$runner = Join-Path $here "audio-to-midi-p5-multilabel-spectral.py"

foreach ($file in @($python, $test, $runner)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "P5 multilabel dependency missing: $file"
  }
}

Write-Host "1/2 P5 multilabel spectral self-test..." -ForegroundColor Cyan
& $python $test
if ($LASTEXITCODE -ne 0) {
  throw "P5 multilabel spectral self-test failed"
}

Write-Host "2/2 P5 controlled paired comparison (append-only, 0 fresh owned beats)..." -ForegroundColor Cyan
& $python $runner execute $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "P5 multilabel spectral controlled comparison failed"
}
