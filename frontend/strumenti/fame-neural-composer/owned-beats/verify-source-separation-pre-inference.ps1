param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$RunId = "source-separation-pilot-v1-001",
  [string]$Device = "CPU",
  [string]$Model = "C:\Program Files\Audacity\openvino-models\htdemucs_v4.xml"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$composerRoot = Split-Path -Parent $here
$lockVerifier = Join-Path $here "verify-source-separation-environment-lock.ps1"
$pilotScript = Join-Path $here "source-separation-pilot.js"
$adapter = Join-Path $here "source-separation-standalone-adapter.py"
$venvPython = Join-Path $Workspace "venv-source-separation\Scripts\python.exe"

foreach ($file in @($lockVerifier, $pilotScript, $adapter, $venvPython, $Model)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Pre-inference prerequisite mancante: $file"
  }
}

Write-Host "1/4 Verify exact Source Separation environment lock..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File $lockVerifier -Workspace $Workspace
if ($LASTEXITCODE -ne 0) { throw "Environment lock verification failed" }

Write-Host "2/4 Verify prepared development-only pilot run..." -ForegroundColor Cyan
& node $pilotScript check $Workspace $RunId
if ($LASTEXITCODE -ne 0) { throw "Prepared pilot run check failed" }

Write-Host "3/4 Run adapter self-test (no audio / no inference)..." -ForegroundColor Cyan
& $venvPython $adapter self-test
if ($LASTEXITCODE -ne 0) { throw "Standalone adapter self-test failed" }

Write-Host "4/4 Compile/check frozen OpenVINO model signature (no audio / no inference)..." -ForegroundColor Cyan
& $venvPython $adapter inspect-model --model $Model --device $Device
if ($LASTEXITCODE -ne 0) { throw "Standalone adapter model signature check failed" }

[ordered]@{
  mode = "SOURCE_SEPARATION_PRE_INFERENCE_GATE_PASS"
  workspace = $Workspace
  runId = $RunId
  device = $Device
  sourceAudioOpenedByThisCommand = $false
  sourceSeparationExecutedByThisCommand = $false
  packagesInstalledByThisCommand = $false
  finalHoldoutAudioAccessedByThisCommand = $false
  nextAction = "PREPARE_APPEND_ONLY_DEVELOPMENT_INFERENCE_RECEIPT"
} | ConvertTo-Json -Depth 8
