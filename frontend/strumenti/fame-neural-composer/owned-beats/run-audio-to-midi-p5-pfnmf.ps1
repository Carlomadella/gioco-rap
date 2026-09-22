param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$composer = Split-Path -Parent $here
$python = Join-Path $Workspace "venv-audio-analysis\Scripts\python.exe"
$test = Join-Path $composer "owned-beats-audio-to-midi-p5-pfnmf-test.py"
$runner = Join-Path $here "audio-to-midi-p5-pfnmf-template.py"

foreach ($file in @($python, $test, $runner)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "P5 PF-NMF dependency missing: $file"
  }
}

Write-Host "1/2 P5 PF-NMF controlled self-test..." -ForegroundColor Cyan
& $python $test
if ($LASTEXITCODE -ne 0) {
  throw "P5 PF-NMF self-test failed"
}

Write-Host "2/2 P5 PF-NMF controlled comparison (append-only, mechanics only)..." -ForegroundColor Cyan
& $python $runner execute $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "P5 PF-NMF controlled comparison failed"
}
