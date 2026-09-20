param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$ReviewId = "audio-to-midi-human-review-v1-001",
  [int]$Port = 0
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-human-review.js"
$package = Join-Path $Workspace ("reviews\audio-to-midi-development\" + $ReviewId + "\review-package.json")

if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
  throw "Audio to MIDI Human Review tool mancante: $tool"
}

if (-not (Test-Path -LiteralPath $package -PathType Leaf)) {
  Write-Host "Prepare frozen blind Audio to MIDI Human Review..." -ForegroundColor Cyan
  & node $tool prepare $Workspace $ReviewId
  if ($LASTEXITCODE -ne 0) {
    throw "Audio to MIDI Human Review preparation failed"
  }
}
else {
  Write-Host "Reuse existing frozen Audio to MIDI Human Review package: $package" -ForegroundColor DarkGray
}

Write-Host "Open blind Audio to MIDI Human Review..." -ForegroundColor Cyan
& node $tool serve $Workspace $ReviewId $Port
if ($LASTEXITCODE -ne 0) {
  throw "Audio to MIDI Human Review server failed"
}
