param(
  [int]$NrgSourceCount = 256,
  [string]$Workspace = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$repoRoot)) {
  throw "Esegui questo script dalla repository gioco-rap."
}
$repoRoot = ([string]$repoRoot).Trim()
$runner = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset\run-nrg-cp-expansion-v2.js"

$args = @($runner, "--nrg-source-count", [string]$NrgSourceCount)
if (-not [string]::IsNullOrWhiteSpace($Workspace)) {
  $args += @("--workspace", $Workspace)
}

& node @args
exit $LASTEXITCODE
