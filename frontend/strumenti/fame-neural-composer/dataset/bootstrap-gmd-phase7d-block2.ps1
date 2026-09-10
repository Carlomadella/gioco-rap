param(
  [string]$InfoCsv = "",
  [string]$Workspace = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$repoRoot)) {
  throw "Esegui questo script dalla repository gioco-rap."
}
$repoRoot = ([string]$repoRoot).Trim()

if ([string]::IsNullOrWhiteSpace($Workspace)) {
  $Workspace = Join-Path $env:TEMP "fame-neural-gmd-phase7d-block2"
}
New-Item -ItemType Directory -Path $Workspace -Force | Out-Null

$smoke = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\phase7d-block2-smoke-test.js"
$builder = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\build-gmd-phase7d-block2-candidates.js"
$block1Bootstrap = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset\bootstrap-gmd-phase7d-block1.ps1"
$manifestPath = Join-Path $Workspace "gmd-phase7d-block2-candidate-manifest.json"
$reportPath = Join-Path $Workspace "gmd-phase7d-block2-report.json"

foreach ($required in @($smoke, $builder, $block1Bootstrap)) {
  if (-not (Test-Path -LiteralPath $required)) {
    throw "File richiesto non trovato: $required"
  }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js non trovato nel PATH."
}

Write-Host "=== FAME NEURAL / FASE 7D BLOCCO 2 / GROUPING + CANDIDATE MANIFEST ===" -ForegroundColor Cyan
Write-Host "Workspace: $Workspace"

Write-Host "[1/4] Smoke test..." -ForegroundColor Yellow
& node $smoke
if ($LASTEXITCODE -ne 0) { throw "Smoke test 7D Block2 fallito." }

if ([string]::IsNullOrWhiteSpace($InfoCsv)) {
  $knownRoots = @(
    (Join-Path $env:TEMP "fame-neural-gmd-phase7d-block1"),
    (Join-Path $env:TEMP "fame-neural-gmd-phase7c-block2\source-gmd"),
    (Join-Path $env:TEMP "fame-neural-gmd-phase2")
  )
  foreach ($knownRoot in $knownRoots) {
    if (-not (Test-Path -LiteralPath $knownRoot)) { continue }
    $candidate = Get-ChildItem -LiteralPath $knownRoot -Filter "info.csv" -File -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($candidate) {
      $InfoCsv = $candidate.FullName
      break
    }
  }
}

if ([string]::IsNullOrWhiteSpace($InfoCsv)) {
  Write-Host "[2/4] info.csv non trovato in cache: riuso il bootstrap 7D Block1..." -ForegroundColor Yellow
  $sourceWorkspace = Join-Path $Workspace "block1-source"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $block1Bootstrap -Workspace $sourceWorkspace
  if ($LASTEXITCODE -ne 0) { throw "Bootstrap 7D Block1 fallito." }

  $candidate = Get-ChildItem -LiteralPath $sourceWorkspace -Filter "info.csv" -File -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if (-not $candidate) { throw "info.csv non trovato dopo bootstrap 7D Block1." }
  $InfoCsv = $candidate.FullName
} else {
  Write-Host "[2/4] Riuso info.csv locale: $InfoCsv" -ForegroundColor DarkGray
}

Write-Host "[3/4] Costruzione candidate manifest..." -ForegroundColor Yellow
& node $builder $InfoCsv $manifestPath $reportPath
if ($LASTEXITCODE -ne 0) {
  throw "Candidate manifest 7D Block2 non supera i check. Controlla $reportPath"
}

$report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
if ($report.readyForPolicyComparison -ne $true) {
  throw "Il report non risulta readyForPolicyComparison."
}
if ($report.totals.records -ne 1150) {
  throw "Il run reale Block2 richiede l'intero info.csv GMD: attesi 1150 record, trovati $($report.totals.records)."
}
if ($report.pools.evalSessionHoldout -ne 40) {
  throw "Eval-session holdout incompleto: attesi 40 record, trovati $($report.pools.evalSessionHoldout)."
}

Write-Host "[4/4] BLOCK2 CANDIDATE REPORT READY" -ForegroundColor Green
Write-Host ""
Write-Host "Record manifest: $($report.totals.records)"
Write-Host "Pool: $($report.pools | ConvertTo-Json -Compress)"
Write-Host "Session grouped: $($report.strategies.sessionGrouped.recordCounts | ConvertTo-Json -Compress)"
Write-Host "Session groups/cross-split: $($report.strategies.sessionGrouped.groupCount)/$($report.strategies.sessionGrouped.isolation.crossTaskSplitGroupCount)"
Write-Host "Drummer held-out: $($report.strategies.drummerHeldOut.recordCounts | ConvertTo-Json -Compress)"
Write-Host "Drummer groups/cross-split: $($report.strategies.drummerHeldOut.groupCount)/$($report.strategies.drummerHeldOut.isolation.crossTaskSplitGroupCount)"
Write-Host "Representative drummer holdout: validation=$($report.strategies.drummerHeldOut.representative.validationDrummer), test=$($report.strategies.drummerHeldOut.representative.testDrummer)"
Write-Host "Digest: $($report.digest.value)"
Write-Host "Manifest: $manifestPath"
Write-Host "Report: $reportPath"
Write-Host ""
Write-Host "IMPORTANTE: report pronto per il confronto; nessuno split finale selezionato, nessun training aperto, roadmap non modificata." -ForegroundColor DarkYellow
