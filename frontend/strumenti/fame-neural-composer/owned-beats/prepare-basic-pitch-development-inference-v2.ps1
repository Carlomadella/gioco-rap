param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "basic-pitch-development-inference-v1-002"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$lockVerifier = Join-Path $here "verify-basic-pitch-environment-lock.ps1"
$runner = Join-Path $here "basic-pitch-development-inference-v2.js"

foreach ($file in @($lockVerifier, $runner)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Basic Pitch superseding receipt prerequisite mancante: $file"
  }
}

Write-Host "1/2 Verify exact Basic Pitch environment/model lock..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $lockVerifier -Workspace $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch environment/model lock verification failed"
}

Write-Host "2/2 Mark v1-001 aborted if safe and prepare superseding append-only receipt..." -ForegroundColor Cyan
& node $runner prepare $Workspace $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch superseding receipt preparation failed"
}
