param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "source-separation-development-inference-v1-001",
  [string]$Model = "C:\Program Files\Audacity\openvino-models\htdemucs_v4.xml"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$preInference = Join-Path $here "verify-source-separation-pre-inference.ps1"
$runner = Join-Path $here "source-separation-development-inference.js"

foreach ($file in @($preInference, $runner, $Model)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Development inference prerequisite mancante: $file"
  }
}

Write-Host "Re-check pre-inference gate before freezing append-only receipt..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $preInference -Workspace $Workspace -Model $Model
if ($LASTEXITCODE -ne 0) {
  throw "Pre-inference gate failed; receipt not created"
}

$previous = $env:FAME_SOURCE_SEP_PREINFERENCE_GATE
try {
  $env:FAME_SOURCE_SEP_PREINFERENCE_GATE = "PASS"
  Write-Host "Freeze append-only development inference receipt..." -ForegroundColor Cyan
  & node $runner prepare $Workspace $RunId $Model
  if ($LASTEXITCODE -ne 0) {
    throw "Development inference receipt preparation failed"
  }
}
finally {
  if ($null -eq $previous) {
    Remove-Item Env:FAME_SOURCE_SEP_PREINFERENCE_GATE -ErrorAction SilentlyContinue
  }
  else {
    $env:FAME_SOURCE_SEP_PREINFERENCE_GATE = $previous
  }
}
