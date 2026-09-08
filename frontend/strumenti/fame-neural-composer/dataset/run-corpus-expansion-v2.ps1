param(
  [int]$GmdCount = 34,
  [int]$SeedCount = 24,
  [string]$Workspace = ""
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

if ($GmdCount -lt 24) {
  throw "GmdCount deve essere almeno 24."
}

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$repoRoot)) {
  throw "Esegui questo script dalla repository gioco-rap."
}
$repoRoot = ([string]$repoRoot).Trim()

if ([string]::IsNullOrWhiteSpace($Workspace)) {
  $Workspace = Join-Path $env:TEMP "fame-neural-corpus-expansion-v2"
}

$datasetRoot = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset"
$midiRoot = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\midi"

$commercialRunner = Join-Path $datasetRoot "run-commercial-mix-v1.ps1"
$gmdBootstrap = Join-Path $midiRoot "bootstrap-gmd-phase2.ps1"
$sourceExpansion = Join-Path $datasetRoot "run-source-expansion.ps1"
$gmdReviewer = Join-Path $datasetRoot "review-gmd.js"
$merger = Join-Path $datasetRoot "merge-phrase-corpora.js"
$phraseCorpus = Join-Path $datasetRoot "phrase-corpus.js"
$phraseReview = Join-Path $datasetRoot "phrase-review.js"
$gate = Join-Path $datasetRoot "data-ready-gate.js"
$gatePolicy = Join-Path $datasetRoot "data-ready-policy.example.json"
$auditorOptions = Join-Path $datasetRoot "auditor-options.example.json"

foreach ($required in @(
  $commercialRunner,
  $gmdBootstrap,
  $sourceExpansion,
  $gmdReviewer,
  $merger,
  $phraseCorpus,
  $phraseReview,
  $gate,
  $gatePolicy,
  $auditorOptions
)) {
  if (-not (Test-Path $required)) { throw "File richiesto non trovato: $required" }
}

New-Item -ItemType Directory -Path $Workspace -Force | Out-Null

$commercialWorkspace = Join-Path $Workspace "commercial-mix-v1"
$gmdBootstrapWorkspace = Join-Path $Workspace "gmd-bootstrap"
$gmdPipeline = Join-Path $Workspace "gmd-pipeline"
$globalRaw = Join-Path $Workspace "global-raw-phrase-items"
$globalReviewed = Join-Path $Workspace "global-reviewed-phrase-items"

$globalMergeReport = Join-Path $Workspace "global-merge-report.json"
$globalAuditOptions = Join-Path $Workspace "global-phrase-audit-options.json"
$globalInitialAudit = Join-Path $Workspace "global-phrase-audit-initial.json"
$globalInitialSplit = Join-Path $Workspace "global-phrase-split-initial.json"
$globalReviewDecisions = Join-Path $Workspace "global-phrase-review-decisions.json"
$globalReviewReport = Join-Path $Workspace "global-phrase-review-report.json"
$globalAudit = Join-Path $Workspace "global-phrase-audit.json"
$globalSplit = Join-Path $Workspace "global-phrase-split.json"
$globalGate = Join-Path $Workspace "global-gate1-report.json"
$globalInventory = Join-Path $Workspace "global-inventory.json"

Write-Host "=== FAME NEURAL / CORPUS EXPANSION V2 / GMD ===" -ForegroundColor Cyan
Write-Host "Workspace: $Workspace"
Write-Host "GMD hiphop/beat/4-4 source: $GmdCount (tutte le candidate disponibili)"
Write-Host ""

Write-Host "[1/8] Ricostruisco il COMMERCIAL MIX reviewed corrente..." -ForegroundColor Yellow
& powershell -NoProfile -ExecutionPolicy Bypass -File $commercialRunner -SeedCount $SeedCount -Workspace $commercialWorkspace
if ($LASTEXITCODE -ne 0) { throw "COMMERCIAL MIX corrente fallito." }

$commercialReviewed = Join-Path $commercialWorkspace "combined-reviewed-phrase-items"
if (-not (Test-Path $commercialReviewed)) {
  throw "Corpus reviewed COMMERCIAL MIX mancante: $commercialReviewed"
}

Write-Host "[2/8] Import GMD reale esteso..." -ForegroundColor Yellow
if (Test-Path $gmdBootstrapWorkspace) { Remove-Item $gmdBootstrapWorkspace -Recurse -Force }
& powershell -NoProfile -ExecutionPolicy Bypass -File $gmdBootstrap -SampleCount $GmdCount -Workspace $gmdBootstrapWorkspace
if ($LASTEXITCODE -ne 0) { throw "Bootstrap GMD esteso fallito." }

$gmdSource = Join-Path $gmdBootstrapWorkspace "sample-input"
if (-not (Test-Path $gmdSource)) { throw "Source GMD campionata non trovata: $gmdSource" }

Write-Host "[3/8] Source expansion GMD + curation source-specifica..." -ForegroundColor Yellow
if (Test-Path $gmdPipeline) { Remove-Item $gmdPipeline -Recurse -Force }
& powershell -NoProfile -ExecutionPolicy Bypass -File $sourceExpansion -SourceDir $gmdSource -Workspace $gmdPipeline -AutoReviewScript $gmdReviewer
if ($LASTEXITCODE -ne 0) { throw "Source expansion GMD fallita." }

$gmdPhraseDir = Join-Path $gmdPipeline "phrase-items"
$gmdBuildReport = Join-Path $gmdPipeline "phrase-build-report.json"
if (-not (Test-Path $gmdPhraseDir)) { throw "Phrase GMD mancanti." }
if (-not (Test-Path $gmdBuildReport)) { throw "Report phrase GMD mancante." }

$gmdBuild = Get-Content $gmdBuildReport -Raw | ConvertFrom-Json
if ($gmdBuild.totals.phrasesProduced -lt 1) {
  throw "GMD non ha prodotto phrase utilizzabili."
}

Write-Host "[4/8] Merge globale: COMMERCIAL MIX + GMD..." -ForegroundColor Yellow
if (Test-Path $globalRaw) { Remove-Item $globalRaw -Recurse -Force }
New-Item -ItemType Directory -Path $globalRaw -Force | Out-Null
& node $merger $globalRaw $globalMergeReport $commercialReviewed $gmdPhraseDir
if ($LASTEXITCODE -ne 0) { throw "Merge globale fallito." }

$auditorCfg = Get-Content $auditorOptions -Raw | ConvertFrom-Json
$auditCfg = [ordered]@{
  targetMinPhrases = 500
  similarity = $auditorCfg.similarity
  quality = $auditorCfg.quality
}
Write-Utf8NoBom -Path $globalAuditOptions -Text ($auditCfg | ConvertTo-Json -Depth 10)

Write-Host "[5/8] Audit globale iniziale..." -ForegroundColor Yellow
& node $phraseCorpus $globalRaw $globalInitialAudit $globalInitialSplit $globalAuditOptions
if ($LASTEXITCODE -ne 0) { throw "Audit globale iniziale non READY." }

Write-Host "[6/8] Review phrase globale..." -ForegroundColor Yellow
if (Test-Path $globalReviewed) { Remove-Item $globalReviewed -Recurse -Force }
New-Item -ItemType Directory -Path $globalReviewed -Force | Out-Null
& node $phraseReview $globalRaw $globalInitialAudit $globalReviewed $globalReviewDecisions $globalReviewReport
if ($LASTEXITCODE -ne 0) { throw "Review phrase globale fallita." }

Write-Host "[7/8] Re-audit globale reviewed..." -ForegroundColor Yellow
& node $phraseCorpus $globalReviewed $globalAudit $globalSplit $globalAuditOptions $globalReviewDecisions
if ($LASTEXITCODE -ne 0) { throw "Audit globale finale non READY." }

$finalAudit = Get-Content $globalAudit -Raw | ConvertFrom-Json
if (-not $finalAudit.block5Ready) { throw "BLOCCO 5 non READY sul corpus globale." }
if (-not $finalAudit.corpusClean) {
  Write-Host "Corpus issues residui:" -ForegroundColor Red
  foreach ($issue in $finalAudit.corpusIssues) { Write-Host " - $issue" }
  throw "Corpus globale non clean."
}
if (-not $finalAudit.reviewComplete) { throw "Review globale non completa." }

Write-Host "[8/8] GATE 1 globale..." -ForegroundColor Yellow
& node $gate $globalReviewed $globalAudit $globalGate $gatePolicy $globalInventory
if ($LASTEXITCODE -ne 0) { throw "GATE 1 tooling globale fallito." }

$commercialAudit = Get-Content (Join-Path $commercialWorkspace "combined-phrase-audit.json") -Raw | ConvertFrom-Json
$reviewReport = Get-Content $globalReviewReport -Raw | ConvertFrom-Json
$inventory = Get-Content $globalInventory -Raw | ConvertFrom-Json
$gateData = Get-Content $globalGate -Raw | ConvertFrom-Json

if ($inventory.totals.sourceCollections -lt 3) {
  throw "GMD non e' entrato come terza source collection nel corpus globale."
}

Write-Host ""
Write-Host "CORPUS EXPANSION V2 / GMD: PIPELINE COMPLETATA" -ForegroundColor Green
Write-Host "Phrase COMMERCIAL MIX reviewed: $($commercialAudit.totals.valid)"
Write-Host "Phrase GMD prodotte prima della review globale: $($gmdBuild.totals.phrasesProduced)"
Write-Host "Phrase globali rejected in review: $($reviewReport.totals.rejectedTotal)"
Write-Host "Phrase globali finali: $($finalAudit.totals.valid)"
Write-Host "Composition family: $($inventory.totals.compositionFamilies)"
Write-Host "Source collections: $($inventory.totals.sourceCollections)"
Write-Host "Coverage drums/808/harmony/lead: $($inventory.roleCoverage.drums)/$($inventory.roleCoverage.'808')/$($inventory.roleCoverage.harmony)/$($inventory.roleCoverage.lead)"
Write-Host "Coverage pitchedAny: $($inventory.roleCoverage.pitchedAny)"
Write-Host "GATE 1 DATA READY: $(if ($gateData.ready) { 'READY' } else { 'NOT READY' })"
if ($gateData.blockers.Count -gt 0) {
  Write-Host "Blocker residui:"
  foreach ($blocker in $gateData.blockers) {
    Write-Host " - $blocker"
  }
}
Write-Host "Gate report: $globalGate"
Write-Host "Inventory: $globalInventory"
