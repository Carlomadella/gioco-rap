param(
  [int]$SourceCount = 12,
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
  $Workspace = Join-Path $env:TEMP "fame-neural-gmd-phase3-gate1"
}

$bootstrap = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset\bootstrap-gmd-phase3.ps1"
$gate = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset\data-ready-gate.js"
$policy = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset\data-ready-policy.example.json"

foreach ($required in @($bootstrap, $gate, $policy)) {
  if (-not (Test-Path $required)) { throw "File richiesto non trovato: $required" }
}

Write-Host "=== FAME NEURAL / GMD SCALE + GATE 1 ===" -ForegroundColor Cyan
Write-Host "SourceCount: $SourceCount"
Write-Host "Workspace: $Workspace"

& powershell -NoProfile -ExecutionPolicy Bypass -File $bootstrap -SourceCount $SourceCount -Workspace $Workspace
if ($LASTEXITCODE -ne 0) {
  throw "Bootstrap GMD scale fallito."
}

$phraseDir = Join-Path $Workspace "phrase-items"
$phraseAudit = Join-Path $Workspace "phrase-corpus-audit.json"
$gateReport = Join-Path $Workspace "gate1-data-ready-report.json"
$inventory = Join-Path $Workspace "gate1-inventory.json"

& node $gate $phraseDir $phraseAudit $gateReport $policy $inventory
if ($LASTEXITCODE -ne 0) {
  throw "Data Ready Gate tooling fallito."
}

$report = Get-Content $gateReport -Raw | ConvertFrom-Json

Write-Host ""
if ($report.ready -eq $true) {
  Write-Host "GATE 1 DATA READY: READY" -ForegroundColor Green
} else {
  Write-Host "GATE 1 DATA READY: NOT READY" -ForegroundColor Yellow
  Write-Host "Questo e' atteso per un corpus GMD-only: GMD copre soprattutto drums e non deve chiudere da solo il gate del composer completo."
}
Write-Host "Report: $gateReport"
Write-Host "Inventory: $inventory"
