param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$ReviewId = "basic-pitch-lowend-blind-comparison-v1-001",
  [int]$Port = 0
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$qa = Join-Path $here "run-basic-pitch-development-qa.ps1"
$tool = Join-Path $here "basic-pitch-lowend-comparison.js"
$package = Join-Path $Workspace ("reviews\basic-pitch-lowend-comparison\" + $ReviewId + "\review-package.json")

foreach ($file in @($qa, $tool)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Basic Pitch low-end comparison prerequisite mancante: $file"
  }
}

Write-Host "Verify Basic Pitch v1-003 technical QA before blind review..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $qa -Workspace $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch technical QA failed; blind comparison not opened"
}

if (-not (Test-Path -LiteralPath $package -PathType Leaf)) {
  Write-Host "Prepare frozen blind pYIN vs Basic Pitch comparison..." -ForegroundColor Cyan
  & node $tool prepare $Workspace $ReviewId
  if ($LASTEXITCODE -ne 0) {
    throw "Basic Pitch low-end comparison preparation failed"
  }
}
else {
  Write-Host "Reuse existing frozen low-end comparison package: $package" -ForegroundColor DarkGray
}

Write-Host "Open blind pYIN vs Basic Pitch comparison..." -ForegroundColor Cyan
& node $tool serve $Workspace $ReviewId $Port
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch low-end comparison server failed"
}
