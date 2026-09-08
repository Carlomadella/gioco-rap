param(
  [Parameter(Mandatory=$true)][string]$SourceDir,
  [string]$Workspace = "",
  [string]$AutoReviewScript = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Text
  )
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Text, $utf8)
}

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$repoRoot)) {
  throw "Esegui questo script dalla repository gioco-rap."
}
$repoRoot = ([string]$repoRoot).Trim()

if (-not (Test-Path $SourceDir)) {
  throw "SourceDir non trovato: $SourceDir"
}
$SourceDir = (Resolve-Path $SourceDir).Path

if (-not [string]::IsNullOrWhiteSpace($AutoReviewScript)) {
  if (-not (Test-Path $AutoReviewScript)) {
    throw "AutoReviewScript non trovato: $AutoReviewScript"
  }
  $AutoReviewScript = (Resolve-Path $AutoReviewScript).Path
}

if ([string]::IsNullOrWhiteSpace($Workspace)) {
  $Workspace = Join-Path $env:TEMP "fame-neural-source-expansion"
}

$datasetRoot = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset"
$midiRoot = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\midi"

$intake = Join-Path $datasetRoot "source-intake.js"
$batchImport = Join-Path $midiRoot "batch-import-midi.js"
$curation = Join-Path $datasetRoot "curation.js"
$phraseBuilder = Join-Path $datasetRoot "phrase-builder.js"
$phraseCorpus = Join-Path $datasetRoot "phrase-corpus.js"
$gate = Join-Path $datasetRoot "data-ready-gate.js"
$gatePolicy = Join-Path $datasetRoot "data-ready-policy.example.json"
$auditorOptions = Join-Path $datasetRoot "auditor-options.example.json"

foreach ($required in @($intake, $batchImport, $curation, $phraseBuilder, $phraseCorpus, $gate, $gatePolicy, $auditorOptions)) {
  if (-not (Test-Path $required)) { throw "File richiesto non trovato: $required" }
}

New-Item -ItemType Directory -Path $Workspace -Force | Out-Null

$staging = Join-Path $Workspace "commercial-staging"
$datasetItems = Join-Path $Workspace "dataset-items"
$phraseItems = Join-Path $Workspace "phrase-items"

$intakeReport = Join-Path $Workspace "source-intake-report.json"
$batchReport = Join-Path $Workspace "batch-import-report.json"
$curationReport = Join-Path $Workspace "source-curation-report.json"
$manifest = Join-Path $Workspace "accepted-source-manifest.json"
$reviewQueue = Join-Path $Workspace "source-review-queue.json"
$emptyDecisions = Join-Path $Workspace "empty-decisions.json"
$autoDecisions = Join-Path $Workspace "auto-review-decisions.json"
$autoReviewReport = Join-Path $Workspace "auto-review-policy-report.json"
$curationOptions = Join-Path $Workspace "curation-options.json"
$builderOptions = Join-Path $Workspace "phrase-builder-options.json"
$phraseBuildReport = Join-Path $Workspace "phrase-build-report.json"
$phraseAuditOptions = Join-Path $Workspace "phrase-audit-options.json"
$phraseAudit = Join-Path $Workspace "phrase-corpus-audit.json"
$phraseSplit = Join-Path $Workspace "phrase-split.json"
$gateReport = Join-Path $Workspace "gate1-report.json"
$inventoryReport = Join-Path $Workspace "gate1-inventory.json"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
if (Test-Path $datasetItems) { Remove-Item $datasetItems -Recurse -Force }
if (Test-Path $phraseItems) { Remove-Item $phraseItems -Recurse -Force }
New-Item -ItemType Directory -Path $staging -Force | Out-Null
New-Item -ItemType Directory -Path $datasetItems -Force | Out-Null
New-Item -ItemType Directory -Path $phraseItems -Force | Out-Null

Write-Host "=== FAME NEURAL / SOURCE EXPANSION ===" -ForegroundColor Cyan
Write-Host "SourceDir: $SourceDir"
Write-Host "Workspace: $Workspace"
if (-not [string]::IsNullOrWhiteSpace($AutoReviewScript)) {
  Write-Host "Auto review policy: $AutoReviewScript"
}

Write-Host "[1/7] Intake ricorsivo + rights filter..." -ForegroundColor Yellow
& node $intake $SourceDir $staging $intakeReport
if ($LASTEXITCODE -eq 4) {
  throw "Nessun MIDI trovato nel SourceDir."
}
if ($LASTEXITCODE -ne 0) {
  throw "Source intake fallito."
}

$intakeData = Get-Content $intakeReport -Raw | ConvertFrom-Json
if ($intakeData.totals.commercialCleared -lt 1) {
  Write-Host ""
  Write-Host "Nessuna sorgente commercial-training-cleared." -ForegroundColor Yellow
  Write-Host "I file analysis-only/missing/invalid NON vengono importati per training."
  Write-Host "Report: $intakeReport"
  exit 0
}

Write-Host "[2/7] Import MIDI cleared..." -ForegroundColor Yellow
& node $batchImport $staging $datasetItems $batchReport
if ($LASTEXITCODE -ne 0) {
  throw "Batch import cleared source fallito. Controlla $batchReport"
}

Write-Utf8NoBom -Path $emptyDecisions -Text "{}"
Write-Utf8NoBom -Path $curationOptions -Text (@{
  minAcceptedForTrainingSubset = 3
  targetMinPhrases = 500
} | ConvertTo-Json -Depth 5)

Write-Host "[3/7] Curation sorgenti..." -ForegroundColor Yellow
& node $curation $datasetItems $curationReport $manifest $reviewQueue $emptyDecisions $curationOptions $auditorOptions
$curationExit = $LASTEXITCODE
if ($curationExit -ne 0 -and $curationExit -ne 2) {
  throw "Curation sorgenti fallita."
}

$curationData = Get-Content $curationReport -Raw | ConvertFrom-Json

if (-not [string]::IsNullOrWhiteSpace($AutoReviewScript) -and $curationData.totals.hold -gt 0) {
  Write-Host "[3b/7] Auto review source-specifica sui soli HOLD..." -ForegroundColor Yellow
  & node $AutoReviewScript $curationReport $reviewQueue $autoDecisions $autoReviewReport
  if ($LASTEXITCODE -ne 0) {
    throw "Auto review policy ha trovato segnali non autorizzati. Controlla $autoReviewReport"
  }

  & node $curation $datasetItems $curationReport $manifest $reviewQueue $autoDecisions $curationOptions $auditorOptions
  $curationExit = $LASTEXITCODE
  if ($curationExit -ne 0 -and $curationExit -ne 2) {
    throw "Curation sorgenti dopo auto review fallita."
  }
  $curationData = Get-Content $curationReport -Raw | ConvertFrom-Json

  Write-Host "Accepted dopo auto review: $($curationData.totals.accepted)"
  Write-Host "Hold residui: $($curationData.totals.hold)"
}

if ($curationData.totals.accepted -lt 1) {
  Write-Host ""
  Write-Host "Nessuna sorgente accepted; serve review prima di creare phrase." -ForegroundColor Yellow
  Write-Host "Review queue: $reviewQueue"
  exit 0
}

if ($curationData.totals.hold -gt 0) {
  Write-Host ""
  Write-Host "ATTENZIONE: restano $($curationData.totals.hold) sorgenti in HOLD. Verranno escluse dal manifest accepted." -ForegroundColor Yellow
  Write-Host "Review queue: $reviewQueue"
}

Write-Utf8NoBom -Path $builderOptions -Text (@{
  phraseBars = @(4)
  strategy = "fixed-shortest"
  minEvents = 4
} | ConvertTo-Json -Depth 5)

Write-Host "[4/7] Phrase builder..." -ForegroundColor Yellow
& node $phraseBuilder $datasetItems $phraseItems $phraseBuildReport $manifest $builderOptions
if ($LASTEXITCODE -ne 0) { throw "Phrase builder fallito." }

$auditorCfg = Get-Content $auditorOptions -Raw | ConvertFrom-Json
$phraseAuditCfg = [ordered]@{
  targetMinPhrases = 500
  similarity = $auditorCfg.similarity
  quality = $auditorCfg.quality
}
Write-Utf8NoBom -Path $phraseAuditOptions -Text ($phraseAuditCfg | ConvertTo-Json -Depth 10)

Write-Host "[5/7] Phrase audit..." -ForegroundColor Yellow
& node $phraseCorpus $phraseItems $phraseAudit $phraseSplit $phraseAuditOptions
if ($LASTEXITCODE -ne 0) {
  throw "Phrase corpus tooling non READY. Controlla $phraseAudit"
}

Write-Host "[6/7] GATE 1 sul corpus di questa source expansion..." -ForegroundColor Yellow
& node $gate $phraseItems $phraseAudit $gateReport $gatePolicy $inventoryReport
if ($LASTEXITCODE -ne 0) { throw "Data Ready Gate tooling fallito." }

Write-Host "[7/7] RISULTATO" -ForegroundColor Green
$gateData = Get-Content $gateReport -Raw | ConvertFrom-Json
$phraseBuild = Get-Content $phraseBuildReport -Raw | ConvertFrom-Json

Write-Host ""
Write-Host "SOURCE EXPANSION: PIPELINE COMPLETATA" -ForegroundColor Green
Write-Host "MIDI discovered: $($intakeData.totals.discovered)"
Write-Host "Commercial cleared: $($intakeData.totals.commercialCleared)"
Write-Host "Analysis-only: $($intakeData.totals.analysisOnly)"
Write-Host "Missing provenance: $($intakeData.totals.missingProvenance)"
Write-Host "Accepted source: $($curationData.totals.accepted)"
Write-Host "Hold source: $($curationData.totals.hold)"
Write-Host "Phrase prodotte: $($phraseBuild.totals.phrasesProduced)"
Write-Host "GATE 1 DATA READY: $(if ($gateData.ready) { 'READY' } else { 'NOT READY' })"
Write-Host "Gate report: $gateReport"
Write-Host "Inventory: $inventoryReport"
