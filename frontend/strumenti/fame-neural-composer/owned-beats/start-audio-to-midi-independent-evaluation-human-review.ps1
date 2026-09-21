param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$ReviewId = "audio-to-midi-independent-evaluation-human-review-v1-001",
  [int]$Port = 0
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-independent-evaluation-human-review.js"
$package = Join-Path $Workspace ("reviews\audio-to-midi-independent-evaluation\" + $ReviewId + "\review-package.json")

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Independent evaluation Human Review tool mancante: $tool"
}

if (-not (Test-Path -LiteralPath $package -PathType Leaf)) {
  Write-Host "Prepare frozen blind independent evaluation Human Review..." -ForegroundColor Cyan
  & node $tool prepare $Workspace $ReviewId
  if ($LASTEXITCODE -ne 0) {
    throw "Independent evaluation Human Review preparation failed"
  }
}
else {
  Write-Host "Reuse existing frozen blind Human Review package: $package" -ForegroundColor DarkGray
}

Write-Host "Open blind independent evaluation Human Review..." -ForegroundColor Cyan
& node $tool serve $Workspace $ReviewId $Port
if ($LASTEXITCODE -ne 0) {
  throw "Independent evaluation Human Review server failed"
}
