param([string]$Workspace = "D:\FAME_NEURAL")

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$protocolPath = Join-Path $here "audio-to-midi-p5-adtof-pytorch-pilot-v1.json"
$runner = Join-Path $here "audio-to-midi-p5-adtof-pytorch-pilot.py"

foreach ($file in @($protocolPath, $runner)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "ADTOF pilot dependency missing: $file"
  }
}

$protocol = Get-Content -LiteralPath $protocolPath -Raw | ConvertFrom-Json
$externalRoot = Join-Path $Workspace ([string]$protocol.runtime.externalRelativePath)
$sourceRoot = Join-Path $Workspace ([string]$protocol.runtime.sourceRelativePath)
$venvRoot = Join-Path $Workspace ([string]$protocol.runtime.venvRelativePath)
$bootstrapPython = Join-Path $Workspace ([string]$protocol.runtime.pythonBootstrapRelativePath)
$python = Join-Path $venvRoot "Scripts\python.exe"
$repoUrl = [string]$protocol.externalSource.repositoryUrl
$commit = [string]$protocol.externalSource.commit
$torchVersion = [string]$protocol.runtime.torchVersion
$torchIndex = [string]$protocol.runtime.torchIndex

if (-not (Test-Path -LiteralPath $bootstrapPython -PathType Leaf)) {
  throw "Frozen Python bootstrap missing: $bootstrapPython"
}

New-Item -ItemType Directory -Force -Path $externalRoot | Out-Null

if (-not (Test-Path -LiteralPath (Join-Path $sourceRoot ".git") -PathType Container)) {
  if (Test-Path -LiteralPath $sourceRoot) {
    throw "ADTOF source path exists but is not a git clone: $sourceRoot"
  }
  Write-Host "Bootstrap: cloning pinned ADTOF-pytorch source..." -ForegroundColor Cyan
  git clone $repoUrl $sourceRoot
  if ($LASTEXITCODE -ne 0) { throw "ADTOF clone failed" }
}

$dirty = git -C $sourceRoot status --porcelain
if ($LASTEXITCODE -ne 0) { throw "Cannot inspect ADTOF source tree" }
if ($dirty) { throw "ADTOF source tree is dirty; refusing to mutate pinned external source" }

$head = (git -C $sourceRoot rev-parse HEAD).Trim()
if ($head -ne $commit) {
  Write-Host "Bootstrap: checking out pinned ADTOF commit $commit ..." -ForegroundColor Cyan
  git -C $sourceRoot fetch origin main
  if ($LASTEXITCODE -ne 0) { throw "ADTOF fetch failed" }
  git -C $sourceRoot checkout --detach $commit
  if ($LASTEXITCODE -ne 0) { throw "ADTOF pinned checkout failed" }
}

$head = (git -C $sourceRoot rev-parse HEAD).Trim()
if ($head -ne $commit) { throw "ADTOF HEAD mismatch after checkout: $head" }

if (-not (Test-Path -LiteralPath $python -PathType Leaf)) {
  Write-Host "Bootstrap: creating isolated ADTOF Python environment..." -ForegroundColor Cyan
  & $bootstrapPython -m venv $venvRoot
  if ($LASTEXITCODE -ne 0) { throw "ADTOF venv creation failed" }
}

$envCheck = @"
import sys
try:
    import torch, adtof_pytorch, librosa, pretty_midi
    ok = str(torch.__version__).split("+",1)[0] == "$torchVersion"
    ok = ok and torch.cuda.is_available()
    print("READY" if ok else "NOT_READY")
except Exception:
    print("NOT_READY")
"@

$ready = $envCheck | & $python -
if ($LASTEXITCODE -ne 0 -or ($ready | Select-Object -Last 1) -ne "READY") {
  Write-Host "Bootstrap: installing isolated ADTOF runtime (first run only)..." -ForegroundColor Cyan
  & $python -m pip install --upgrade pip setuptools wheel
  if ($LASTEXITCODE -ne 0) { throw "ADTOF pip bootstrap failed" }

  & $python -m pip install "torch==$torchVersion" --index-url $torchIndex
  if ($LASTEXITCODE -ne 0) { throw "ADTOF CUDA PyTorch install failed" }

  & $python -m pip install numpy librosa pretty_midi
  if ($LASTEXITCODE -ne 0) { throw "ADTOF runtime dependencies install failed" }

  & $python -m pip install --no-deps $sourceRoot
  if ($LASTEXITCODE -ne 0) { throw "ADTOF package install failed" }
}

Write-Host "1/3 ADTOF pilot self-test..." -ForegroundColor Cyan
& $python $runner self-test
if ($LASTEXITCODE -ne 0) { throw "ADTOF pilot self-test failed" }

Write-Host "2/3 ADTOF pilot preflight (NO inference)..." -ForegroundColor Cyan
& $python $runner preflight $Workspace
if ($LASTEXITCODE -ne 0) { throw "ADTOF pilot preflight failed" }

Write-Host "3/3 ADTOF five-class inference on consumed development stem FAME000126..." -ForegroundColor Cyan
& $python $runner execute $Workspace
if ($LASTEXITCODE -ne 0) { throw "ADTOF pilot inference failed" }
