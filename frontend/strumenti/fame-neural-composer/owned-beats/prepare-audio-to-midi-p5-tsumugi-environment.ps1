param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$specPath = Join-Path $here "audio-to-midi-p5-tsumugi-environment-v1.json"
$doctorPath = Join-Path $here "audio-to-midi-p5-tsumugi-environment-doctor.py"

foreach ($file in @($specPath,$doctorPath)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Tsumugi preflight file missing: $file"
  }
}
if (-not (Test-Path -LiteralPath $Workspace -PathType Container)) {
  throw "Workspace missing: $Workspace"
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git non trovato nel PATH"
}
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
  throw "uv non trovato nel PATH. Installalo separatamente e rilancia: https://docs.astral.sh/uv/getting-started/installation/"
}

$spec = Get-Content -LiteralPath $specPath -Raw | ConvertFrom-Json
$externalRoot = Join-Path $Workspace ([string]$spec.workspace.externalRelativePath)
$sourceRoot = Join-Path $Workspace ([string]$spec.workspace.sourceRelativePath)
$checkpoint = Join-Path $Workspace ([string]$spec.workspace.checkpointRelativePath)
$checkpointDir = Split-Path -Parent $checkpoint

New-Item -ItemType Directory -Force -Path $externalRoot | Out-Null
New-Item -ItemType Directory -Force -Path $checkpointDir | Out-Null

if (-not (Test-Path -LiteralPath $sourceRoot -PathType Container)) {
  New-Item -ItemType Directory -Path $sourceRoot | Out-Null
  & git -C $sourceRoot init
  if ($LASTEXITCODE -ne 0) { throw "git init Tsumugi failed" }
  & git -C $sourceRoot remote add origin ([string]$spec.source.repositoryUrl)
  if ($LASTEXITCODE -ne 0) { throw "git remote add Tsumugi failed" }
  & git -C $sourceRoot fetch --depth 1 origin ([string]$spec.source.commit)
  if ($LASTEXITCODE -ne 0) { throw "git fetch frozen Tsumugi commit failed" }
  & git -C $sourceRoot checkout --detach FETCH_HEAD
  if ($LASTEXITCODE -ne 0) { throw "git checkout frozen Tsumugi commit failed" }
}

$head = (& git -C $sourceRoot rev-parse HEAD).Trim()
if ($head -ne [string]$spec.source.commit) {
  throw "Tsumugi source exists but HEAD is not frozen commit: $head"
}
$statusLines = @(& git -C $sourceRoot status --porcelain)
$status = [string]::Join([Environment]::NewLine, $statusLines)
if (-not [string]::IsNullOrWhiteSpace($status)) {
  throw "Tsumugi source checkout is not clean; refusing to modify it"
}

$licenseBlob = (& git -C $sourceRoot hash-object LICENSE).Trim()
$pyprojectBlob = (& git -C $sourceRoot hash-object pyproject.toml).Trim()
$uvLockBlob = (& git -C $sourceRoot hash-object uv.lock).Trim()
if ($licenseBlob -ne [string]$spec.source.licenseGitBlobSha1) { throw "Tsumugi LICENSE blob mismatch" }
if ($pyprojectBlob -ne [string]$spec.source.pyprojectGitBlobSha1) { throw "Tsumugi pyproject blob mismatch" }
if ($uvLockBlob -ne [string]$spec.source.uvLockGitBlobSha1) { throw "Tsumugi uv.lock blob mismatch" }

Write-Host "1/4 Tsumugi source freeze verified..." -ForegroundColor Cyan

Push-Location $sourceRoot
try {
  Write-Host "2/4 Building exact uv-locked Tsumugi environment..." -ForegroundColor Cyan
  & uv sync --locked --no-dev
  if ($LASTEXITCODE -ne 0) { throw "uv sync --locked Tsumugi failed" }
}
finally {
  Pop-Location
}

$venvPython = Join-Path $sourceRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython -PathType Leaf)) {
  throw "Tsumugi uv environment Python missing: $venvPython"
}

if (Test-Path -LiteralPath $checkpoint -PathType Leaf) {
  $existingSha = (Get-FileHash -LiteralPath $checkpoint -Algorithm SHA256).Hash.ToLowerInvariant()
  $existingBytes = (Get-Item -LiteralPath $checkpoint).Length
  if ($existingSha -ne [string]$spec.checkpoint.sha256 -or $existingBytes -ne [int64]$spec.checkpoint.bytes) {
    throw "Existing Tsumugi checkpoint differs from frozen SHA/size; refusing overwrite"
  }
}
else {
  Write-Host "3/4 Downloading frozen Tsumugi drums_v1_5 checkpoint..." -ForegroundColor Cyan
  $temp = "$checkpoint.tmp-$([guid]::NewGuid().ToString('N'))"
  try {
    Invoke-WebRequest -Uri ([string]$spec.checkpoint.downloadUrl) -OutFile $temp
    $sha = (Get-FileHash -LiteralPath $temp -Algorithm SHA256).Hash.ToLowerInvariant()
    $bytes = (Get-Item -LiteralPath $temp).Length
    if ($sha -ne [string]$spec.checkpoint.sha256) {
      throw "Downloaded Tsumugi checkpoint SHA mismatch: $sha"
    }
    if ($bytes -ne [int64]$spec.checkpoint.bytes) {
      throw "Downloaded Tsumugi checkpoint size mismatch: $bytes"
    }
    Move-Item -LiteralPath $temp -Destination $checkpoint
  }
  finally {
    if (Test-Path -LiteralPath $temp) {
      Remove-Item -LiteralPath $temp -Force
    }
  }
}

Write-Host "4/4 Running no-audio Tsumugi environment doctor..." -ForegroundColor Cyan
$doctorJson = & $venvPython $doctorPath --source-root $sourceRoot --checkpoint $checkpoint
if ($LASTEXITCODE -ne 0) { throw "Tsumugi environment doctor failed" }
$doctor = ($doctorJson -join [Environment]::NewLine) | ConvertFrom-Json

$runsRoot = Join-Path $Workspace ([string]$spec.workspace.environmentRunsRelativePath)
New-Item -ItemType Directory -Force -Path $runsRoot | Out-Null
$runId = [string]$spec.workspace.environmentRunId
$runDir = Join-Path $runsRoot $runId
if (Test-Path -LiteralPath $runDir) {
  throw "Append-only Tsumugi environment receipt already exists: $runDir"
}

$tempRun = Join-Path $runsRoot (".$runId." + [guid]::NewGuid().ToString("N") + ".tmp")
New-Item -ItemType Directory -Path $tempRun | Out-Null
try {
  $freezePath = Join-Path $tempRun "installed-packages.txt"
  & uv pip freeze --python $venvPython | Set-Content -LiteralPath $freezePath -Encoding utf8
  if ($LASTEXITCODE -ne 0) { throw "Tsumugi installed package capture failed" }

  $freezeSha = (Get-FileHash -LiteralPath $freezePath -Algorithm SHA256).Hash.ToLowerInvariant()
  $uvVersion = (& uv --version).Trim()

  $receipt = [ordered]@{
    schema = "fame-owned-beats-audio-to-midi-p5-tsumugi-environment-receipt-v1"
    version = 1
    status = "PREFLIGHT_ENVIRONMENT_READY_NO_AUDIO_ACCESSED"
    runId = $runId
    createdAt = [DateTime]::UtcNow.ToString("o")
    candidateId = [string]$spec.candidateId
    workspace = $Workspace
    sourceRoot = $sourceRoot
    sourceCommit = [string]$doctor.source.head
    checkpoint = $doctor.checkpoint
    python = $doctor.python
    torch = $doctor.torch
    checkpointMetadata = $doctor.checkpointMetadata
    uvVersion = $uvVersion
    installedPackagesSha256 = $freezeSha
    sourceAudioOpenedByThisCommand = $false
    fixtureAudioOpenedByThisCommand = $false
    transcriptionExecutedByThisCommand = $false
    sourceSeparationExecutedByThisCommand = $false
    trainingAuthorized = $false
    batch131Authorized = $false
    taskDataReadyMayBeDeclared = $false
    nextAction = "REVIEW_PREFLIGHT_RECEIPT_THEN_FREEZE_CONTROLLED_TSUMUGI_INFERENCE_PROTOCOL"
  }

  $receipt | ConvertTo-Json -Depth 16 |
    Set-Content -LiteralPath (Join-Path $tempRun "environment-receipt.json") -Encoding utf8
  Move-Item -LiteralPath $tempRun -Destination $runDir
}
catch {
  if (Test-Path -LiteralPath $tempRun) {
    Remove-Item -LiteralPath $tempRun -Recurse -Force
  }
  throw
}

[ordered]@{
  mode = "FAME_NEURAL_TSUMUGI_ENVIRONMENT_PREFLIGHT_PASS"
  runId = $runId
  candidateId = [string]$spec.candidateId
  sourceCommit = [string]$doctor.source.head
  checkpointSha256 = [string]$doctor.checkpoint.sha256
  checkpointBytes = [int64]$doctor.checkpoint.bytes
  pythonVersion = [string]$doctor.python.version
  torchVersion = [string]$doctor.torch.version
  torchaudioVersion = [string]$doctor.torch.torchaudioVersion
  cudaAvailable = [bool]$doctor.torch.cudaAvailable
  cudaVersion = [string]$doctor.torch.cudaVersion
  deviceName = [string]$doctor.torch.deviceName
  installedPackagesSha256 = $freezeSha
  sourceAudioOpenedByThisCommand = $false
  fixtureAudioOpenedByThisCommand = $false
  transcriptionExecutedByThisCommand = $false
  sourceSeparationExecutedByThisCommand = $false
  trainingAuthorized = $false
  batch131Authorized = $false
  taskDataReadyMayBeDeclared = $false
  nextAction = "REVIEW_PREFLIGHT_RECEIPT_THEN_FREEZE_CONTROLLED_TSUMUGI_INFERENCE_PROTOCOL"
} | ConvertTo-Json -Depth 12
