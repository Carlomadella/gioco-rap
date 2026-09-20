param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "source-separation-development-inference-v1-001"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $here "source-separation-development-inference.js"

if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) {
  throw "Development inference runner mancante: $runner"
}

Write-Host "Verify frozen append-only inference receipt..." -ForegroundColor Cyan
& node $runner check $Workspace $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Development inference receipt check failed"
}

Write-Host "Execute Source Separation on locked 8-family development pilot..." -ForegroundColor Cyan
& node $runner execute $Workspace $RunId
if ($LASTEXITCODE -ne 0) {
  throw "Development inference execution failed"
}
