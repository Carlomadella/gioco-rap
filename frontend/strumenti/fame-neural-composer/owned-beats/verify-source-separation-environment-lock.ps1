param(
  [string]$Workspace = "D:\FAME_NEURAL"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$specPath = Join-Path $here "source-separation-environment-v1.json"

if (-not (Test-Path -LiteralPath $specPath -PathType Leaf)) {
  throw "Environment spec mancante: $specPath"
}

$spec = Get-Content -LiteralPath $specPath -Raw | ConvertFrom-Json
$lockPath = Join-Path $here ([string]$spec.lock.path)
$runDir = Join-Path $Workspace ("runs\source-separation-environment\" + [string]$spec.lock.sourceRunId)
$freezePath = Join-Path $runDir "pip-freeze-all.txt"
$receiptPath = Join-Path $runDir "environment-receipt.json"

foreach ($file in @($lockPath, $freezePath, $receiptPath)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "File richiesto mancante: $file"
  }
}

$receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
$freezeSha = (Get-FileHash -LiteralPath $freezePath -Algorithm SHA256).Hash.ToLowerInvariant()
$lockSha = (Get-FileHash -LiteralPath $lockPath -Algorithm SHA256).Hash.ToLowerInvariant()

if ($freezeSha -ne [string]$spec.lock.sourcePipFreezeAllSha256) {
  throw "SHA freeze locale diverso dallo snapshot revisionato: $freezeSha"
}
if ($freezeSha -ne [string]$receipt.pipFreezeAllSha256) {
  throw "SHA freeze locale diverso dal receipt: $freezeSha"
}
if ($lockSha -ne [string]$spec.lock.repositoryCanonicalSha256) {
  throw "SHA lock repository diverso dal canonico: $lockSha"
}

$freezePackages = @(
  Get-Content -LiteralPath $freezePath |
    Where-Object { $_.Trim().Length -gt 0 } |
    ForEach-Object { $_.Trim() }
)
$lockPackages = @(
  Get-Content -LiteralPath $lockPath |
    Where-Object { $_.Trim().Length -gt 0 -and -not $_.Trim().StartsWith("#") } |
    ForEach-Object { $_.Trim() }
)

if (($freezePackages -join "`n") -ne ($lockPackages -join "`n")) {
  throw "Il contenuto package del lock non coincide con pip freeze --all"
}
if ($lockPackages.Count -ne [int]$spec.lock.packageCount) {
  throw "Numero package lock inatteso: $($lockPackages.Count)"
}

[ordered]@{
  mode = "SOURCE_SEPARATION_ENVIRONMENT_LOCK_VERIFY_PASS"
  sourceRunId = [string]$spec.lock.sourceRunId
  sourceFreezeSha256 = $freezeSha
  repositoryLockSha256 = $lockSha
  packageCount = $lockPackages.Count
  packageSetMatchesFreeze = $true
  sourceAudioOpenedByThisCommand = $false
  sourceSeparationExecutedByThisCommand = $false
  finalHoldoutAccessedByThisCommand = $false
  nextAction = "IMPLEMENT_CLEAN_STANDALONE_HTDEMUCS_ADAPTER"
} | ConvertTo-Json -Depth 8
