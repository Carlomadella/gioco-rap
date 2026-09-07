param(
  [int]$SourceCount = 12,
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

if ($SourceCount -lt 3) {
  throw "SourceCount deve essere almeno 3."
}

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$repoRoot)) {
  throw "Esegui questo script dalla repository gioco-rap."
}
$repoRoot = ([string]$repoRoot).Trim()

if ([string]::IsNullOrWhiteSpace($Workspace)) {
  $Workspace = Join-Path $env:TEMP "fame-neural-gmd-phase3"
}

$phase2Bootstrap = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\midi\bootstrap-gmd-phase2.ps1"
$curation = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset\curation.js"
$phraseBuilder = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset\phrase-builder.js"
$phraseCorpus = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset\phrase-corpus.js"
$auditorOptions = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset\auditor-options.example.json"

foreach ($required in @($phase2Bootstrap, $curation, $phraseBuilder, $phraseCorpus, $auditorOptions)) {
  if (-not (Test-Path $required)) { throw "File richiesto non trovato: $required" }
}

New-Item -ItemType Directory -Path $Workspace -Force | Out-Null

$sourceWorkspace = Join-Path $Workspace "source-gmd"
$sourceItems = Join-Path $sourceWorkspace "dataset-items"
$emptyDecisions = Join-Path $Workspace "empty-decisions.json"
$curationOptions = Join-Path $Workspace "curation-options.json"
$curationReport = Join-Path $Workspace "source-curation.json"
$sourceManifest = Join-Path $Workspace "accepted-source-manifest.json"
$sourceReviewQueue = Join-Path $Workspace "source-review-queue.json"
$builderOptions = Join-Path $Workspace "phrase-builder-options.json"
$phraseItems = Join-Path $Workspace "phrase-items"
$buildReport = Join-Path $Workspace "phrase-build-report.json"
$phraseCorpusOptions = Join-Path $Workspace "phrase-corpus-options.json"
$phraseAuditReport = Join-Path $Workspace "phrase-corpus-audit.json"
$phraseSplit = Join-Path $Workspace "phrase-split.json"

Write-Host "=== FAME NEURAL / FASE 3 BLOCCO 5 / GMD BOOTSTRAP ===" -ForegroundColor Cyan
Write-Host "Workspace: $Workspace"
Write-Host "SourceCount: $SourceCount"

Write-Host "[1/5] Import sorgenti GMD reali..." -ForegroundColor Yellow
& powershell -NoProfile -ExecutionPolicy Bypass -File $phase2Bootstrap -SampleCount $SourceCount -Workspace $sourceWorkspace
if ($LASTEXITCODE -ne 0) { throw "Bootstrap sorgenti GMD fallito." }

Write-Utf8NoBom -Path $emptyDecisions -Text "{}"
Write-Utf8NoBom -Path $curationOptions -Text (@{
  minAcceptedForTrainingSubset = 3
  targetMinPhrases = 500
} | ConvertTo-Json -Depth 5)

Write-Host "[2/5] Curation automatica delle sorgenti..." -ForegroundColor Yellow
& node $curation $sourceItems $curationReport $sourceManifest $sourceReviewQueue $emptyDecisions $curationOptions $auditorOptions
if ($LASTEXITCODE -ne 0) { throw "Curation sorgenti non eseguibile. Controlla $curationReport" }

Write-Utf8NoBom -Path $builderOptions -Text (@{
  phraseBars = @(4)
  strategy = "fixed-shortest"
  minEvents = 4
} | ConvertTo-Json -Depth 5)

if (Test-Path $phraseItems) { Remove-Item $phraseItems -Recurse -Force }
New-Item -ItemType Directory -Path $phraseItems -Force | Out-Null

Write-Host "[3/5] Costruzione phrase 4-bar dalle sole sorgenti accepted..." -ForegroundColor Yellow
& node $phraseBuilder $sourceItems $phraseItems $buildReport $sourceManifest $builderOptions
if ($LASTEXITCODE -ne 0) { throw "Phrase builder fallito." }

$auditorCfg = Get-Content $auditorOptions -Raw | ConvertFrom-Json
$phraseOptionsObject = [ordered]@{
  targetMinPhrases = 500
  similarity = $auditorCfg.similarity
  quality = $auditorCfg.quality
}
Write-Utf8NoBom -Path $phraseCorpusOptions -Text ($phraseOptionsObject | ConvertTo-Json -Depth 10)

Write-Host "[4/5] Audit phrase-level e split leakage-safe..." -ForegroundColor Yellow
& node $phraseCorpus $phraseItems $phraseAuditReport $phraseSplit $phraseCorpusOptions
if ($LASTEXITCODE -ne 0) { throw "Phrase corpus tooling non READY. Controlla $phraseAuditReport" }

$curationData = Get-Content $curationReport -Raw | ConvertFrom-Json
$buildData = Get-Content $buildReport -Raw | ConvertFrom-Json
$phraseData = Get-Content $phraseAuditReport -Raw | ConvertFrom-Json

Write-Host "[5/5] INVENTORY" -ForegroundColor Green
Write-Host ""
Write-Host "FASE 3 BLOCCO 5 TOOLING: READY" -ForegroundColor Green
Write-Host "Sorgenti reali importate: $SourceCount"
Write-Host "Sorgenti auto-accepted: $($curationData.totals.accepted)"
Write-Host "Sorgenti hold/review: $($curationData.totals.hold)"
Write-Host "Phrase prodotte: $($buildData.totals.phrasesProduced)"
Write-Host "Corpus clean: $($phraseData.corpusClean)"
Write-Host "Review complete: $($phraseData.reviewComplete)"
Write-Host "Target 500 raggiunto: $($phraseData.targetReached)"
Write-Host "GATE 1 candidate: $($phraseData.gate1Candidate)"
Write-Host "Report phrase: $phraseAuditReport"
Write-Host "GATE 1 DATA READY: ANCORA APERTO"
