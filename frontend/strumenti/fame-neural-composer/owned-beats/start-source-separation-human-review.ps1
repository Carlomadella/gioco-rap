param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$ReviewId = "source-separation-human-review-v1-001",
  [int]$Port = 0
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "source-separation-human-review.js"
$package = Join-Path $Workspace ("reviews\source-separation-development\" + $ReviewId + "\review-package.json")

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Source Separation human review tool mancante: $tool"
}

if (-not (Test-Path -LiteralPath $package -PathType Leaf)) {
  Write-Host "Prepare frozen Source Separation human review package..." -ForegroundColor Cyan
  & node $tool prepare $Workspace $ReviewId
  if ($LASTEXITCODE -ne 0) {
    throw "Source Separation human review preparation failed"
  }
}
else {
  Write-Host "Reuse existing frozen human review package: $package" -ForegroundColor DarkGray
}

Write-Host "Open Source Separation human review..." -ForegroundColor Cyan
& node $tool serve $Workspace $ReviewId $Port
if ($LASTEXITCODE -ne 0) {
  throw "Source Separation human review server failed"
}
