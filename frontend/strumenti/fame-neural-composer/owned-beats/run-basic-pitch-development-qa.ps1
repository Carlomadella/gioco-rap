param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$qa = Join-Path $here "basic-pitch-development-qa.py"
$python = Join-Path $Workspace "venv-basic-pitch\Scripts\python.exe"

foreach ($file in @($qa, $python)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Basic Pitch QA prerequisite mancante: $file"
  }
}

Write-Host "Run Basic Pitch v1-003 technical QA (read-only)..." -ForegroundColor Cyan
& $python $qa technical $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch v1-003 technical QA failed"
}
