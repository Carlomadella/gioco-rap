param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$PythonExe = "python",
  [switch]$Recreate
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$specPath = Join-Path $here "source-separation-environment-v1.json"
$doctorPath = Join-Path $here "source-separation-standalone-doctor.py"

if (-not (Test-Path -LiteralPath $specPath -PathType Leaf)) {
  throw "Environment spec mancante: $specPath"
}
if (-not (Test-Path -LiteralPath $doctorPath -PathType Leaf)) {
  throw "Standalone doctor mancante: $doctorPath"
}
if (-not (Test-Path -LiteralPath $Workspace -PathType Container)) {
  throw "Workspace mancante: $Workspace"
}

$spec = Get-Content -LiteralPath $specPath -Raw | ConvertFrom-Json

$basePythonVersion = & $PythonExe -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"
if ($LASTEXITCODE -ne 0) { throw "Python base non eseguibile: $PythonExe" }
$basePythonVersion = $basePythonVersion.Trim()
if (-not $basePythonVersion.StartsWith("$($spec.python.requiredMajorMinor).")) {
  throw "Serve Python $($spec.python.requiredMajorMinor).x; trovato $basePythonVersion"
}

$venv = Join-Path $Workspace $spec.workspace.venvRelativePath
if (Test-Path -LiteralPath $venv) {
  if (-not $Recreate) {
    throw "Venv già esistente: $venv. Non viene sovrascritto. Usa -Recreate solo se vuoi ricrearlo."
  }
  Write-Host "ATTENZIONE: ricreo soltanto il venv dedicato Source Separation: $venv" -ForegroundColor Yellow
  Remove-Item -LiteralPath $venv -Recurse -Force
}

& $PythonExe -m venv $venv
if ($LASTEXITCODE -ne 0) { throw "Creazione venv Source Separation fallita" }

$venvPython = Join-Path $venv "Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython -PathType Leaf)) {
  throw "Python del nuovo venv non trovato: $venvPython"
}

$torchVersion = [string]$spec.packages.torch.version
$torchIndex = [string]$spec.packages.torch.indexUrl
$openvinoVersion = [string]$spec.packages.openvino.version
$openvinoIndex = [string]$spec.packages.openvino.indexUrl
$bootstrapIndex = [string]$spec.bootstrapTools.indexUrl
$pipBootstrapVersion = [string]$spec.bootstrapTools.pip
$setuptoolsBootstrapVersion = [string]$spec.bootstrapTools.setuptools
$wheelBootstrapVersion = [string]$spec.bootstrapTools.wheel

Write-Host "Aggiornamento tooling pip del venv dedicato..." -ForegroundColor Cyan
& $venvPython -m pip install --disable-pip-version-check --index-url $bootstrapIndex "pip==$pipBootstrapVersion" "setuptools==$setuptoolsBootstrapVersion" "wheel==$wheelBootstrapVersion"
if ($LASTEXITCODE -ne 0) { throw "Bootstrap pip/setuptools/wheel fallito" }

Write-Host "Installazione Torch CPU $torchVersion nel venv dedicato..." -ForegroundColor Cyan
& $venvPython -m pip install --disable-pip-version-check --index-url $bootstrapIndex --extra-index-url $torchIndex "torch==$torchVersion"
if ($LASTEXITCODE -ne 0) { throw "Installazione Torch fallita" }

Write-Host "Installazione OpenVINO $openvinoVersion nel venv dedicato..." -ForegroundColor Cyan
& $venvPython -m pip install --disable-pip-version-check --index-url $openvinoIndex "openvino==$openvinoVersion"
if ($LASTEXITCODE -ne 0) { throw "Installazione OpenVINO fallita" }

$torchActual = (& $venvPython -c "import torch; print(torch.__version__)").Trim()
if ($LASTEXITCODE -ne 0) { throw "Import Torch fallito nel nuovo venv" }
$openvinoActual = (& $venvPython -c "import importlib.metadata as m; print(m.version('openvino'))").Trim()
if ($LASTEXITCODE -ne 0) { throw "Import OpenVINO fallito nel nuovo venv" }

if ($torchActual -ne $torchVersion) {
  throw "Torch installato diverso dal pin: atteso=$torchVersion trovato=$torchActual"
}
if ($openvinoActual -ne $openvinoVersion) {
  throw "OpenVINO installato diverso dal pin: atteso=$openvinoVersion trovato=$openvinoActual"
}

$doctorJson = & $venvPython $doctorPath
if ($LASTEXITCODE -ne 0) {
  throw "Standalone doctor fallito dentro il nuovo venv"
}
$doctor = ($doctorJson -join [Environment]::NewLine) | ConvertFrom-Json

if ($doctor.frozenModel.exactFrozenArtifact -ne $true) {
  throw "Il modello congelato non corrisponde agli SHA attesi"
}
if ($doctor.torch.available -ne $true -or $doctor.openvino.available -ne $true) {
  throw "Torch/OpenVINO non disponibili nel nuovo venv"
}
if ($doctor.openvinoModel.readable -ne $true) {
  throw "OpenVINO non riesce a leggere il modello congelato"
}
if ($doctor.ffmpeg.available -ne $true) {
  throw "FFmpeg non disponibile"
}

$runsRoot = Join-Path $Workspace $spec.workspace.environmentRunsRelativePath
New-Item -ItemType Directory -Force -Path $runsRoot | Out-Null
$runId = "source-separation-env-v1-001"
$runDir = Join-Path $runsRoot $runId
if (Test-Path -LiteralPath $runDir) {
  throw "Receipt environment già esistente: $runDir. Setup append-only: non sovrascrivo."
}

$tempDir = Join-Path $runsRoot (".$runId." + [guid]::NewGuid().ToString("N") + ".tmp")
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
  $freezePath = Join-Path $tempDir "pip-freeze-all.txt"
  & $venvPython -m pip freeze --all | Set-Content -LiteralPath $freezePath -Encoding utf8
  if ($LASTEXITCODE -ne 0) { throw "pip freeze --all fallito" }

  $freezeSha = (Get-FileHash -LiteralPath $freezePath -Algorithm SHA256).Hash.ToLowerInvariant()
  $pipVersion = (& $venvPython -m pip --version).Trim()
  $pythonVersion = (& $venvPython -c "import sys; print(sys.version)").Trim()

  $receipt = [ordered]@{
    schema = "fame-owned-beats-source-separation-environment-receipt-v1"
    version = 1
    status = "BOOTSTRAP_ENVIRONMENT_READY_AWAITING_LOCK_COMMIT"
    runId = $runId
    createdAt = [DateTime]::UtcNow.ToString("o")
    workspace = $Workspace
    venv = $venv
    python = [ordered]@{
      executable = $venvPython
      version = $pythonVersion
    }
    pip = $pipVersion
    packages = [ordered]@{
      torch = $torchActual
      openvino = $openvinoActual
    }
    frozenModel = [ordered]@{
      exactFrozenArtifact = $doctor.frozenModel.exactFrozenArtifact
      binSha256 = $doctor.frozenModel.binSha256
      xmlSha256 = $doctor.frozenModel.xmlSha256
    }
    openvinoModel = [ordered]@{
      readable = $doctor.openvinoModel.readable
      availableDevices = $doctor.openvinoModel.availableDevices
      inputs = $doctor.openvinoModel.inputs
      outputs = $doctor.openvinoModel.outputs
    }
    ffmpeg = $doctor.ffmpeg
    pipFreezeAllSha256 = $freezeSha
    sourceAudioOpenedByThisCommand = $false
    sourceSeparationExecutedByThisCommand = $false
    finalHoldoutAccessedByThisCommand = $false
    nextAction = "REVIEW_AND_COMMIT_EXACT_PIP_FREEZE"
  }

  $receiptPath = Join-Path $tempDir "environment-receipt.json"
  $receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding utf8

  Move-Item -LiteralPath $tempDir -Destination $runDir
}
catch {
  if (Test-Path -LiteralPath $tempDir) {
    Remove-Item -LiteralPath $tempDir -Recurse -Force
  }
  throw
}

$finalReceipt = Get-Content -LiteralPath (Join-Path $runDir "environment-receipt.json") -Raw | ConvertFrom-Json
[ordered]@{
  mode = "SOURCE_SEPARATION_ENVIRONMENT_BOOTSTRAP_PASS"
  runId = $runId
  venv = $venv
  pythonVersion = $finalReceipt.python.version
  torchVersion = $finalReceipt.packages.torch
  openvinoVersion = $finalReceipt.packages.openvino
  modelExact = $finalReceipt.frozenModel.exactFrozenArtifact
  modelReadable = $finalReceipt.openvinoModel.readable
  availableDevices = $finalReceipt.openvinoModel.availableDevices
  ffmpegAvailable = $finalReceipt.ffmpeg.available
  pipFreezeAllSha256 = $finalReceipt.pipFreezeAllSha256
  sourceAudioOpenedByThisCommand = $false
  sourceSeparationExecutedByThisCommand = $false
  finalHoldoutAccessedByThisCommand = $false
  lockCommitted = $false
  nextAction = "REVIEW_AND_COMMIT_EXACT_PIP_FREEZE"
} | ConvertTo-Json -Depth 10
