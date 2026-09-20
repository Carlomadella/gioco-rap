param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$PythonExe = "",
  [string[]]$PythonArgs = @(),
  [switch]$Recreate
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$specPath = Join-Path $here "basic-pitch-environment-v1.json"
$doctorPath = Join-Path $here "basic-pitch-environment-doctor.py"

foreach ($file in @($specPath, $doctorPath)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "File Basic Pitch richiesto mancante: $file"
  }
}
if (-not (Test-Path -LiteralPath $Workspace -PathType Container)) {
  throw "Workspace mancante: $Workspace"
}

$spec = Get-Content -LiteralPath $specPath -Raw | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($PythonExe)) {
  $sourceSepPython = Join-Path $Workspace "venv-source-separation\Scripts\python.exe"
  if (Test-Path -LiteralPath $sourceSepPython -PathType Leaf) {
    $PythonExe = $sourceSepPython
    $PythonArgs = @()
  }
  elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $PythonExe = "py"
    $PythonArgs = @("-3.10")
  }
  else {
    throw "Python 3.10 non trovato. Passa -PythonExe oppure installa Python 3.10."
  }
}

$basePythonVersion = (& $PythonExe @PythonArgs -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')").Trim()
if ($LASTEXITCODE -ne 0) {
  throw "Python base non eseguibile: $PythonExe $($PythonArgs -join ' ')"
}
if (-not $basePythonVersion.StartsWith("$($spec.python.requiredMajorMinor).")) {
  throw "Serve Python $($spec.python.requiredMajorMinor).x; trovato $basePythonVersion"
}

$venv = Join-Path $Workspace ([string]$spec.workspace.venvRelativePath)
if (Test-Path -LiteralPath $venv) {
  if (-not $Recreate) {
    throw "Venv Basic Pitch già esistente: $venv. Non viene sovrascritto. Usa -Recreate solo per ricreare questo venv dedicato."
  }
  Write-Host "ATTENZIONE: ricreo soltanto il venv dedicato Basic Pitch: $venv" -ForegroundColor Yellow
  Remove-Item -LiteralPath $venv -Recurse -Force
}

Write-Host "Creo venv Basic Pitch con Python $basePythonVersion..." -ForegroundColor Cyan
& $PythonExe @PythonArgs -m venv $venv
if ($LASTEXITCODE -ne 0) {
  throw "Creazione venv Basic Pitch fallita"
}

$venvPython = Join-Path $venv "Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython -PathType Leaf)) {
  throw "Python del venv Basic Pitch non trovato: $venvPython"
}

$index = [string]$spec.bootstrapTools.indexUrl
$pipVersion = [string]$spec.bootstrapTools.pip
$setuptoolsVersion = [string]$spec.bootstrapTools.setuptools
$wheelVersion = [string]$spec.bootstrapTools.wheel
$basicPitchVersion = [string]$spec.package.version

Write-Host "Bootstrap tooling del venv Basic Pitch..." -ForegroundColor Cyan
& $venvPython -m pip install --disable-pip-version-check --index-url $index "pip==$pipVersion" "setuptools==$setuptoolsVersion" "wheel==$wheelVersion"
if ($LASTEXITCODE -ne 0) {
  throw "Bootstrap pip/setuptools/wheel Basic Pitch fallito"
}

Write-Host "Installo basic-pitch==$basicPitchVersion nel venv dedicato..." -ForegroundColor Cyan
& $venvPython -m pip install --disable-pip-version-check --index-url $index "basic-pitch==$basicPitchVersion"
if ($LASTEXITCODE -ne 0) {
  throw "Installazione Basic Pitch fallita"
}

$doctorJson = & $venvPython $doctorPath
if ($LASTEXITCODE -ne 0) {
  throw "Basic Pitch environment doctor fallito"
}
$doctor = ($doctorJson -join [Environment]::NewLine) | ConvertFrom-Json

if ([string]$doctor.python.majorMinor -ne [string]$spec.python.requiredMajorMinor) {
  throw "Python Basic Pitch inatteso: $($doctor.python.version)"
}
if ([string]$doctor.basicPitch.version -ne $basicPitchVersion) {
  throw "Basic Pitch installato diverso dal pin: atteso=$basicPitchVersion trovato=$($doctor.basicPitch.version)"
}
if ($doctor.basicPitch.onnxPresent -ne $true) {
  throw "ONNX Runtime non disponibile nel venv Basic Pitch"
}
if ([string]$doctor.runtime.selectedBackend -ne [string]$spec.runtime.expectedBackend) {
  throw "Backend Basic Pitch inatteso: $($doctor.runtime.selectedBackend)"
}
if (-not ([string]$doctor.model.filename).EndsWith([string]$spec.runtime.modelPathMustEndWith)) {
  throw "Modello Basic Pitch inatteso: $($doctor.model.filename)"
}
if ([string]::IsNullOrWhiteSpace([string]$doctor.model.sha256)) {
  throw "SHA256 modello Basic Pitch mancante"
}

$runsRoot = Join-Path $Workspace ([string]$spec.workspace.environmentRunsRelativePath)
New-Item -ItemType Directory -Force -Path $runsRoot | Out-Null
$runId = [string]$spec.lock.sourceRunId
$runDir = Join-Path $runsRoot $runId
if (Test-Path -LiteralPath $runDir) {
  throw "Receipt environment Basic Pitch già esistente: $runDir. Setup append-only: non sovrascrivo."
}

$tempDir = Join-Path $runsRoot (".$runId." + [guid]::NewGuid().ToString("N") + ".tmp")
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
  $freezePath = Join-Path $tempDir "pip-freeze-all.txt"
  & $venvPython -m pip freeze --all | Set-Content -LiteralPath $freezePath -Encoding utf8
  if ($LASTEXITCODE -ne 0) {
    throw "pip freeze --all Basic Pitch fallito"
  }

  $freezeSha = (Get-FileHash -LiteralPath $freezePath -Algorithm SHA256).Hash.ToLowerInvariant()
  $pythonVersion = (& $venvPython -c "import sys; print(sys.version)").Trim()
  $pipActual = (& $venvPython -m pip --version).Trim()

  $receipt = [ordered]@{
    schema = "fame-owned-beats-basic-pitch-environment-receipt-v1"
    version = 1
    status = "BOOTSTRAP_ENVIRONMENT_READY_AWAITING_LOCK_AND_MODEL_FREEZE"
    runId = $runId
    createdAt = [DateTime]::UtcNow.ToString("o")
    workspace = $Workspace
    venv = $venv
    python = [ordered]@{
      executable = $venvPython
      version = $pythonVersion
      majorMinor = [string]$doctor.python.majorMinor
    }
    pip = $pipActual
    basicPitch = $doctor.basicPitch
    runtime = $doctor.runtime
    packagedModel = $doctor.model
    pipFreezeAllSha256 = $freezeSha
    sourceAudioOpenedByThisCommand = $false
    transcriptionExecutedByThisCommand = $false
    finalHoldoutAccessedByThisCommand = $false
    batch131AccessedByThisCommand = $false
    trainingAuthorized = $false
    lockCommitted = $false
    modelShaCommitted = $false
    nextAction = "REVIEW_AND_COMMIT_EXACT_PIP_FREEZE_AND_MODEL_SHA"
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
  mode = "BASIC_PITCH_ENVIRONMENT_BOOTSTRAP_PASS"
  runId = $runId
  venv = $venv
  pythonVersion = $finalReceipt.python.version
  basicPitchVersion = $finalReceipt.basicPitch.version
  selectedBackend = $finalReceipt.runtime.selectedBackend
  onnxRuntimeVersion = $finalReceipt.runtime.onnxRuntimeVersion
  modelFilename = $finalReceipt.packagedModel.filename
  modelBytes = $finalReceipt.packagedModel.bytes
  modelSha256 = $finalReceipt.packagedModel.sha256
  pipFreezeAllSha256 = $finalReceipt.pipFreezeAllSha256
  sourceAudioOpenedByThisCommand = $false
  transcriptionExecutedByThisCommand = $false
  finalHoldoutAccessedByThisCommand = $false
  batch131AccessedByThisCommand = $false
  trainingAuthorized = $false
  lockCommitted = $false
  modelShaCommitted = $false
  nextAction = "REVIEW_AND_COMMIT_EXACT_PIP_FREEZE_AND_MODEL_SHA"
} | ConvertTo-Json -Depth 10
