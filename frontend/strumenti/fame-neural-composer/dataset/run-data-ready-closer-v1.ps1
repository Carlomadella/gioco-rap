param(
  [int]$SeedCount = 120,
  [int]$PdmxCount = 200,
  [int]$CandidatePool = 2048,
  [string]$Workspace = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

if ($SeedCount -lt 24 -or $SeedCount -gt 128) {
  throw "SeedCount closer deve essere tra 24 e 128."
}
if ($PdmxCount -lt 48) {
  throw "PdmxCount closer deve essere almeno 48."
}
if ($CandidatePool -lt $PdmxCount) {
  throw "CandidatePool deve essere >= PdmxCount."
}

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$repoRoot)) {
  throw "Esegui questo script dalla repository gioco-rap."
}
$repoRoot = ([string]$repoRoot).Trim()

$datasetRoot = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset"
$pdmxRunner = Join-Path $datasetRoot "run-corpus-expansion-v3-pdmx.ps1"
if (-not (Test-Path $pdmxRunner)) {
  throw "Runner PDMX non trovato: $pdmxRunner"
}

if ([string]::IsNullOrWhiteSpace($Workspace)) {
  # Reuse the PDMX cache already built by V4.
  $Workspace = Join-Path $env:TEMP "fame-neural-corpus-expansion-v3-pdmx"
}

Write-Host "=== FAME NEURAL / DATA READY CLOSER V1 ===" -ForegroundColor Cyan
Write-Host "Baseline verificata: 192 phrase"
Write-Host "Seed originali: $SeedCount"
Write-Host "PDMX compatibili target: $PdmxCount"
Write-Host "PDMX candidate pool: $CandidatePool"
Write-Host "Workspace/cache: $Workspace"
Write-Host ""

& powershell -NoProfile -ExecutionPolicy Bypass -File $pdmxRunner `
  -PdmxCount $PdmxCount `
  -CandidatePool $CandidatePool `
  -SeedCount $SeedCount `
  -Workspace $Workspace

if ($LASTEXITCODE -ne 0) {
  throw "DATA READY CLOSER: pipeline PDMX/seed fallita."
}

$gatePath = Join-Path $Workspace "global-gate1-report.json"
$inventoryPath = Join-Path $Workspace "global-inventory.json"
$auditPath = Join-Path $Workspace "global-audit.json"
$compatPath = Join-Path $Workspace "pdmx-compatibility-report.json"

foreach ($required in @($gatePath, $inventoryPath, $auditPath, $compatPath)) {
  if (-not (Test-Path $required)) {
    throw "Report closer mancante: $required"
  }
}

$gate = Get-Content $gatePath -Raw | ConvertFrom-Json
$inventory = Get-Content $inventoryPath -Raw | ConvertFrom-Json
$audit = Get-Content $auditPath -Raw | ConvertFrom-Json
$compat = Get-Content $compatPath -Raw | ConvertFrom-Json

if (-not $audit.block5Ready) { throw "Closer regression: BLOCCO 5 non READY." }
if (-not $audit.corpusClean) { throw "Closer regression: corpus non clean." }
if (-not $audit.reviewComplete) { throw "Closer regression: review incompleta." }

$phrases = [int]$inventory.totals.phrases
$families = [int]$inventory.totals.compositionFamilies
$sources = [int]$inventory.totals.sourceCollections
$drums = [int]$inventory.roleCoverage.drums
$eight08 = [int]$inventory.roleCoverage.'808'
$harmony = [int]$inventory.roleCoverage.harmony
$lead = [int]$inventory.roleCoverage.lead
$pitched = [int]$inventory.roleCoverage.pitchedAny

# Verified baseline after PDMX V4 commit c9fa547:
# phrases 192, families 54, sources 4, drums 114, 808 61, harmony 134, lead 48, pitchedAny 134.
if ($phrases -le 192) { throw "Closer non ha aumentato le phrase: $phrases <= 192." }
if ($families -lt 50) { throw "Closer ha riaperto il Gate composition family: $families < 50." }
if ($sources -lt 4) { throw "Regression source collection: $sources < 4." }
if ($harmony -lt 75) { throw "Closer ha riaperto harmony coverage: $harmony < 75." }

# Baseline c9fa547 sui soli ruoli ancora sotto Gate:
# drums 114/150 -> deficit 36
# 808 61/75     -> deficit 14
# lead 48/75    -> deficit 27
# pitched 134/150 -> deficit 16
# Totale deficit residuo = 93.
# Una singola role coverage puo' oscillare di 1 dopo dedup/review quando il
# corpus cambia. Il guard corretto e' che il deficit complessivo verso Gate
# diminuisca, non che ogni contatore sia monotono individualmente.
$roleDeficit =
  [math]::Max(0, 150 - $drums) +
  [math]::Max(0, 75 - $eight08) +
  [math]::Max(0, 75 - $lead) +
  [math]::Max(0, 150 - $pitched)

if (-not $gate.ready -and $roleDeficit -ge 93) {
  throw "Closer senza miglioramento netto role coverage: deficit residuo $roleDeficit >= baseline 93."
}

foreach ($blocker in @($gate.blockers)) {
  if ([string]$blocker -match '^source collection dominante') {
    throw "Closer ha introdotto source dominance: $blocker"
  }
  if ([string]$blocker -match '^review phrase non completata') {
    throw "Closer ha riaperto la phrase review: $blocker"
  }
  if ([string]$blocker -match '^composition family insufficienti') {
    throw "Closer ha riaperto composition families: $blocker"
  }
  if ([string]$blocker -match '^coverage harmony insufficiente') {
    throw "Closer ha riaperto harmony coverage: $blocker"
  }
}

Write-Host ""
Write-Host "DATA READY CLOSER V1: RUN COMPLETATO" -ForegroundColor Green
Write-Host "PDMX compatibili trovate: $($compat.totals.compatible)"
Write-Host "PDMX selezionate: $($compat.totals.selected)"
Write-Host "Phrase globali: $phrases"
Write-Host "Composition family: $families"
Write-Host "Source collections: $sources"
Write-Host "Coverage drums/808/harmony/lead: $drums/$eight08/$harmony/$lead"
Write-Host "Coverage pitchedAny: $pitched"
Write-Host "Role deficit residuo verso Gate: $roleDeficit (baseline 93)"
Write-Host "GATE 1 DATA READY: $(if ($gate.ready) { 'READY' } else { 'ANCORA APERTO' })"

if (-not $gate.ready) {
  Write-Host "Blocker residui:"
  foreach ($blocker in @($gate.blockers)) {
    Write-Host " - $blocker"
  }
}

Write-Host "Gate report: $gatePath"
Write-Host "Inventory: $inventoryPath"
