param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "basic-pitch-development-inference-v1-003"
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$lockVerifier = Join-Path $here "verify-basic-pitch-environment-lock.ps1"
$preInference = Join-Path $here "verify-basic-pitch-pre-inference.ps1"
$runner = Join-Path $here "basic-pitch-development-inference-v3.js"

foreach ($file in @($lockVerifier, $preInference, $runner)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Basic Pitch v1-003 receipt prerequisite mancante: $file"
  }
}

Write-Host "1/3 Verify exact Basic Pitch environment/model lock..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $lockVerifier -Workspace $Workspace
if ($LASTEXITCODE -ne 0) { throw "Basic Pitch environment/model lock verification failed" }

Write-Host "2/3 Re-run fresh Basic Pitch pre-inference gate..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $preInference -Workspace $Workspace
if ($LASTEXITCODE -ne 0) { throw "Basic Pitch fresh pre-inference gate failed" }

Write-Host "3/3 Mark v1-002 aborted if safe and prepare v1-003 append-only receipt..." -ForegroundColor Cyan
& node $runner prepare $Workspace $RunId
if ($LASTEXITCODE -ne 0) { throw "Basic Pitch v1-003 receipt preparation failed" }
