param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [int]$Port = 0
)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-p5-tsumugi-real-easy-human-review.js"
$reviewId = "audio-to-midi-p5-tsumugi-real-easy-human-review-v1-001"
$package = Join-Path $Workspace ("reviews\audio-to-midi-p5-tsumugi-real-easy\" + $reviewId + "\review-package.json")
if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) { throw "Tsumugi real-easy Human Review tool mancante: $tool" }
if (-not (Test-Path -LiteralPath $package -PathType Leaf)) {
  Write-Host "Prepare frozen Tsumugi real-easy Human Review..." -ForegroundColor Cyan
  & node $tool prepare $Workspace
  if ($LASTEXITCODE -ne 0) { throw "Tsumugi real-easy Human Review preparation failed" }
} else {
  Write-Host "Reuse existing frozen Tsumugi real-easy Human Review package: $package" -ForegroundColor DarkGray
}
Write-Host "Open Tsumugi real-easy Human Review..." -ForegroundColor Cyan
& node $tool serve $Workspace $Port
if ($LASTEXITCODE -ne 0) { throw "Tsumugi real-easy Human Review server failed" }
