param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "basic-pitch-development-inference-v1-001"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$preInference = Join-Path $here "verify-basic-pitch-pre-inference.ps1"
$runner = Join-Path $here "basic-pitch-development-inference.js"

foreach ($file in @($preInference, $runner)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Basic Pitch inference receipt prerequisite mancante: $file"
  }
}

Write-Host "Re-check Basic Pitch pre-inference gate before freezing append-only receipt..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $preInference -Workspace $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch pre-inference gate failed; receipt not created"
}

$previous = $env:FAME_BASIC_PITCH_PREINFERENCE_GATE
try {
  $env:FAME_BASIC_PITCH_PREINFERENCE_GATE = "PASS"
  Write-Host "Freeze append-only Basic Pitch development inference receipt..." -ForegroundColor Cyan
  & node $runner prepare $Workspace $RunId
  if ($LASTEXITCODE -ne 0) {
    throw "Basic Pitch development inference receipt preparation failed"
  }
}
finally {
  if ($null -eq $previous) {
    Remove-Item Env:FAME_BASIC_PITCH_PREINFERENCE_GATE -ErrorAction SilentlyContinue
  }
  else {
    $env:FAME_BASIC_PITCH_PREINFERENCE_GATE = $previous
  }
}
