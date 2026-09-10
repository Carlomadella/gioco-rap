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
  $Workspace = Join-Path $env:TEMP "fame-neural-gmd-phase7d-block1"
}
New-Item -ItemType Directory -Path $Workspace -Force | Out-Null

$smoke = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\phase7d-block1-smoke-test.js"
$audit = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\audit-gmd-inventory.js"
$phase2Bootstrap = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\midi\bootstrap-gmd-phase2.ps1"
$reportPath = Join-Path $Workspace "gmd-full-inventory-report.json"

foreach ($required in @($smoke, $audit, $phase2Bootstrap)) {
  if (-not (Test-Path $required)) { throw "File richiesto non trovato: $required" }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js non trovato nel PATH."
}

Write-Host "=== FAME NEURAL / FASE 7D BLOCCO 1 / FULL GMD INVENTORY ===" -ForegroundColor Cyan
Write-Host "Workspace: $Workspace"

Write-Host "[1/4] Smoke test inventory..." -ForegroundColor Yellow
& node $smoke
if ($LASTEXITCODE -ne 0) { throw "Smoke test 7D Block1 fallito." }

if ([string]::IsNullOrWhiteSpace($InfoCsv)) {
  $knownRoots = @(
    (Join-Path $env:TEMP "fame-neural-gmd-phase7c-block2\source-gmd"),
    (Join-Path $env:TEMP "fame-neural-gmd-phase2")
  )
  foreach ($knownRoot in $knownRoots) {
    if (-not (Test-Path $knownRoot)) { continue }
    $candidate = Get-ChildItem -Path $knownRoot -Filter "info.csv" -File -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($candidate) {
      $InfoCsv = $candidate.FullName
      break
    }
  }
}

if ([string]::IsNullOrWhiteSpace($InfoCsv)) {
  Write-Host "[2/4] info.csv non trovato in cache: riuso il bootstrap GMD verificato per acquisire la fonte ufficiale..." -ForegroundColor Yellow
  $sourceWorkspace = Join-Path $Workspace "source-gmd"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $phase2Bootstrap -SampleCount 6 -Workspace $sourceWorkspace
  if ($LASTEXITCODE -ne 0) { throw "Acquisizione GMD ufficiale fallita." }

  $candidate = Get-ChildItem -Path $sourceWorkspace -Filter "info.csv" -File -Recurse |
    Select-Object -First 1
  if (-not $candidate) { throw "info.csv non trovato dopo il bootstrap GMD." }
  $InfoCsv = $candidate.FullName
} else {
  Write-Host "[2/4] Riuso info.csv locale: $InfoCsv" -ForegroundColor DarkGray
}

if (-not (Test-Path $InfoCsv)) {
  throw "info.csv non trovato: $InfoCsv"
}

Write-Host "[3/4] Inventory completo info.csv..." -ForegroundColor Yellow
& node $audit $InfoCsv $reportPath
if ($LASTEXITCODE -ne 0) {
  throw "Inventory GMD non supera il reference gate. Controlla $reportPath"
}

$report = Get-Content $reportPath -Raw | ConvertFrom-Json
if ($report.readyForSamplingDesign -ne $true) {
  throw "Il report non risulta readyForSamplingDesign."
}

Write-Host "[4/4] INVENTORY READY" -ForegroundColor Green
Write-Host ""
Write-Host "Record validi: $($report.totals.validRecords)"
Write-Host "Beat/Fill: $($report.distribution.beatType | ConvertTo-Json -Compress)"
Write-Host "Source split: $($report.distribution.sourceSplit | ConvertTo-Json -Compress)"
Write-Host "Primary style: $($report.distribution.stylePrimary | ConvertTo-Json -Compress)"
Write-Host "Time signature: $($report.distribution.timeSignature | ConvertTo-Json -Compress)"
Write-Host "Candidate views: $($report.candidateViews | ConvertTo-Json -Compress)"
Write-Host "Cross-split drummer groups: $($report.sourceSplitCrossGroupAudit.drummer.crossSplitGroupCount)"
Write-Host "Cross-split session groups: $($report.sourceSplitCrossGroupAudit.session.crossSplitGroupCount)"
Write-Host "Eval templates: $($report.evalSession.templateCount) / rows $($report.evalSession.totalRows)"
Write-Host "Reference checks: $($report.referenceChecks.ok)"
Write-Host "Report: $reportPath"
Write-Host ""
Write-Host "IMPORTANTE: INVENTORY READY abilita il design del sampling/split 7D Block2; NON crea ancora corpus FAME, NON chiude 7D e NON apre training." -ForegroundColor DarkYellow
