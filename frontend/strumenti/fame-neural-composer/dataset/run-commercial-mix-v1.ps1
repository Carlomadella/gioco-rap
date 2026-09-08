param(
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

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$repoRoot)) {
  throw "Esegui questo script dalla repository gioco-rap."
}
$repoRoot = ([string]$repoRoot).Trim()

if ([string]::IsNullOrWhiteSpace($Workspace)) {
  $Workspace = Join-Path $env:TEMP "fame-neural-commercial-mix-v1"
}

$datasetRoot = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset"
$sourceExpansion = Join-Path $datasetRoot "run-source-expansion.ps1"
$generator = Join-Path $datasetRoot "generate-fame-original-seed.js"
$selector = Join-Path $datasetRoot "select-free-midi-chords.js"
$merger = Join-Path $datasetRoot "merge-phrase-corpora.js"
$sourceConfig = Join-Path $datasetRoot "free-midi-chords-source.json"
$phraseCorpus = Join-Path $datasetRoot "phrase-corpus.js"
$phraseReview = Join-Path $datasetRoot "phrase-review.js"
$gate = Join-Path $datasetRoot "data-ready-gate.js"
$gatePolicy = Join-Path $datasetRoot "data-ready-policy.example.json"
$auditorOptions = Join-Path $datasetRoot "auditor-options.example.json"
$freeMidiReviewer = Join-Path $datasetRoot "review-free-midi-chords.js"

foreach ($required in @($sourceExpansion, $generator, $selector, $merger, $sourceConfig, $phraseCorpus, $phraseReview, $gate, $gatePolicy, $auditorOptions, $freeMidiReviewer)) {
  if (-not (Test-Path $required)) { throw "File richiesto non trovato: $required" }
}

$config = Get-Content $sourceConfig -Raw | ConvertFrom-Json
$downloadDir = Join-Path $Workspace "download"
$extractDir = Join-Path $Workspace "free-midi-chords-extracted"
$chordsSource = Join-Path $Workspace "free-midi-chords-selected"
$seedSource = Join-Path $Workspace "fame-original-seed"
$chordsPipeline = Join-Path $Workspace "pipeline-free-midi-chords"
$seedPipeline = Join-Path $Workspace "pipeline-original-seed"
$combinedDir = Join-Path $Workspace "combined-phrase-items"
$reviewedDir = Join-Path $Workspace "combined-reviewed-phrase-items"

$zipPath = Join-Path $downloadDir $config.assetName
$selectionReport = Join-Path $Workspace "free-midi-chords-selection.json"
$mergeReport = Join-Path $Workspace "combined-merge-report.json"
$phraseAuditOptions = Join-Path $Workspace "combined-phrase-audit-options.json"
$initialAudit = Join-Path $Workspace "combined-phrase-audit-initial.json"
$initialSplit = Join-Path $Workspace "combined-phrase-split-initial.json"
$phraseReviewDecisions = Join-Path $Workspace "combined-phrase-review-decisions.json"
$phraseReviewReport = Join-Path $Workspace "combined-phrase-review-report.json"
$combinedAudit = Join-Path $Workspace "combined-phrase-audit.json"
$combinedSplit = Join-Path $Workspace "combined-phrase-split.json"
$gateReport = Join-Path $Workspace "combined-gate1-report.json"
$inventoryReport = Join-Path $Workspace "combined-inventory.json"

New-Item -ItemType Directory -Path $Workspace -Force | Out-Null
New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null

Write-Host "=== FAME NEURAL / COMMERCIAL MIX V1 ===" -ForegroundColor Cyan
Write-Host "Workspace: $Workspace"

Write-Host "[1/8] Download release ufficiale free-midi-chords..." -ForegroundColor Yellow
$needDownload = $true
if (Test-Path $zipPath) {
  $existingHash = (Get-FileHash $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($existingHash -eq ([string]$config.sha256).ToLowerInvariant()) {
    $needDownload = $false
    Write-Host "Archive gia' presente e SHA-256 valido."
  }
}
if ($needDownload) {
  Invoke-WebRequest -UseBasicParsing -Uri $config.downloadUrl -OutFile $zipPath
}
$actualHash = (Get-FileHash $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualHash -ne ([string]$config.sha256).ToLowerInvariant()) {
  throw "SHA-256 free-midi-chords non valido. Atteso $($config.sha256), ottenuto $actualHash"
}
Write-Host "SHA-256 release: OK" -ForegroundColor Green

Write-Host "[2/8] Estrazione + selezione progression family..." -ForegroundColor Yellow
if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
if (Test-Path $chordsSource) { Remove-Item $chordsSource -Recurse -Force }
New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
New-Item -ItemType Directory -Path $chordsSource -Force | Out-Null
$tar = Get-Command tar.exe -ErrorAction SilentlyContinue
if (-not $tar) { throw "tar.exe non trovato. Necessario per estrarre il pack MIDI in modo robusto su Windows." }
& $tar.Source -xf $zipPath -C $extractDir
if ($LASTEXITCODE -ne 0) { throw "Estrazione free-midi-chords con tar.exe fallita." }

& node $selector $extractDir $chordsSource $sourceConfig $selectionReport
if ($LASTEXITCODE -ne 0) { throw "Selezione free-midi-chords fallita. Report: $selectionReport" }

$selection = Get-Content $selectionReport -Raw | ConvertFrom-Json
if ($selection.totals.selectedFamilies -lt 24) {
  throw "Selezione free-midi-chords insufficiente: $($selection.totals.selectedFamilies)"
}

$selectedMidis = @(Get-ChildItem $chordsSource -File -Filter *.mid)
if ($selectedMidis.Count -lt 24) {
  throw "Preflight free-midi-chords insufficiente: $($selectedMidis.Count) MIDI selezionati."
}
Write-Host "Preflight free-midi-chords: $($selectedMidis.Count) MIDI selezionati." -ForegroundColor Green

Write-Host "[3/8] Generazione FAME Original Seed..." -ForegroundColor Yellow
if (Test-Path $seedSource) { Remove-Item $seedSource -Recurse -Force }
New-Item -ItemType Directory -Path $seedSource -Force | Out-Null
& node $generator $seedSource $SeedCount
if ($LASTEXITCODE -ne 0) { throw "Generatore FAME Original Seed fallito." }

Write-Host "[4/8] Pipeline source expansion: FAME Original Seed..." -ForegroundColor Yellow
if (Test-Path $seedPipeline) { Remove-Item $seedPipeline -Recurse -Force }
& powershell -NoProfile -ExecutionPolicy Bypass -File $sourceExpansion -SourceDir $seedSource -Workspace $seedPipeline
if ($LASTEXITCODE -ne 0) { throw "Pipeline FAME Original Seed fallita." }

Write-Host "[5/8] Pipeline source expansion: free-midi-chords..." -ForegroundColor Yellow
if (Test-Path $chordsPipeline) { Remove-Item $chordsPipeline -Recurse -Force }
& powershell -NoProfile -ExecutionPolicy Bypass -File $sourceExpansion -SourceDir $chordsSource -Workspace $chordsPipeline -AutoReviewScript $freeMidiReviewer
if ($LASTEXITCODE -ne 0) { throw "Pipeline free-midi-chords fallita." }

$seedPhraseDir = Join-Path $seedPipeline "phrase-items"
$chordsPhraseDir = Join-Path $chordsPipeline "phrase-items"
if (-not (Test-Path $seedPhraseDir)) { throw "Phrase FAME Original Seed mancanti." }
if (-not (Test-Path $chordsPhraseDir)) { throw "Phrase free-midi-chords mancanti." }

Write-Host "[6/8] Merge phrase commerciali..." -ForegroundColor Yellow
if (Test-Path $combinedDir) { Remove-Item $combinedDir -Recurse -Force }
New-Item -ItemType Directory -Path $combinedDir -Force | Out-Null
& node $merger $combinedDir $mergeReport $seedPhraseDir $chordsPhraseDir
if ($LASTEXITCODE -ne 0) { throw "Merge phrase fallito." }

$auditorCfg = Get-Content $auditorOptions -Raw | ConvertFrom-Json
$combinedCfg = [ordered]@{
  targetMinPhrases = 500
  similarity = $auditorCfg.similarity
  quality = $auditorCfg.quality
}
Write-Utf8NoBom -Path $phraseAuditOptions -Text ($combinedCfg | ConvertTo-Json -Depth 10)

Write-Host "[7/10] Audit combined corpus iniziale..." -ForegroundColor Yellow
& node $phraseCorpus $combinedDir $initialAudit $initialSplit $phraseAuditOptions
if ($LASTEXITCODE -ne 0) { throw "Initial combined phrase audit tooling non READY." }

Write-Host "[8/10] Review phrase..." -ForegroundColor Yellow
if (Test-Path $reviewedDir) { Remove-Item $reviewedDir -Recurse -Force }
New-Item -ItemType Directory -Path $reviewedDir -Force | Out-Null
& node $phraseReview $combinedDir $initialAudit $reviewedDir $phraseReviewDecisions $phraseReviewReport
if ($LASTEXITCODE -ne 0) { throw "Phrase review fallita. Controlla $phraseReviewReport" }

Write-Host "[9/10] Re-audit corpus dopo review..." -ForegroundColor Yellow
& node $phraseCorpus $reviewedDir $combinedAudit $combinedSplit $phraseAuditOptions $phraseReviewDecisions
if ($LASTEXITCODE -ne 0) { throw "Final combined phrase audit tooling non READY." }

$finalAuditData = Get-Content $combinedAudit -Raw | ConvertFrom-Json
if (-not $finalAuditData.reviewComplete) {
  throw "Review phrase ancora incompleta dopo la curation. Controlla $combinedAudit"
}

Write-Host "[10/10] GATE 1 sul mix reviewed..." -ForegroundColor Yellow
& node $gate $reviewedDir $combinedAudit $gateReport $gatePolicy $inventoryReport
if ($LASTEXITCODE -ne 0) { throw "GATE 1 tooling fallito." }

$seedCuration = Get-Content (Join-Path $seedPipeline "source-curation-report.json") -Raw | ConvertFrom-Json
$chordsCuration = Get-Content (Join-Path $chordsPipeline "source-curation-report.json") -Raw | ConvertFrom-Json
$seedBuild = Get-Content (Join-Path $seedPipeline "phrase-build-report.json") -Raw | ConvertFrom-Json
$chordsBuildPath = Join-Path $chordsPipeline "phrase-build-report.json"
if (-not (Test-Path $chordsBuildPath)) {
  $reviewPath = Join-Path $chordsPipeline "source-review-queue.json"
  throw "free-midi-chords non ha prodotto phrase-build-report.json. Controlla review queue: $reviewPath"
}
$chordsBuild = Get-Content $chordsBuildPath -Raw | ConvertFrom-Json
$initialCombined = Get-Content $initialAudit -Raw | ConvertFrom-Json
$reviewData = Get-Content $phraseReviewReport -Raw | ConvertFrom-Json
$combined = Get-Content $combinedAudit -Raw | ConvertFrom-Json
$inventory = Get-Content $inventoryReport -Raw | ConvertFrom-Json
$gateData = Get-Content $gateReport -Raw | ConvertFrom-Json

Write-Host ""
Write-Host "COMMERCIAL MIX V1: PIPELINE COMPLETATA" -ForegroundColor Green
Write-Host "free-midi-chords family disponibili: $($selection.totals.progressionFamilies)"
Write-Host "free-midi-chords family selezionate: $($selection.totals.selectedFamilies)"
Write-Host "free-midi-chords sorgenti accepted: $($chordsCuration.totals.accepted)"
Write-Host "FAME Original sorgenti accepted: $($seedCuration.totals.accepted)"
Write-Host "Phrase free-midi-chords: $($chordsBuild.totals.phrasesProduced)"
Write-Host "Phrase FAME Original: $($seedBuild.totals.phrasesProduced)"
Write-Host "Phrase combined raw: $($initialCombined.totals.valid)"
Write-Host "Phrase review rejected: $($reviewData.totals.rejectedTotal)"
Write-Host "Phrase combined reviewed: $($combined.totals.valid)"
Write-Host "Review phrase complete: $($combined.reviewComplete)"
Write-Host "Corpus combined clean: $($combined.corpusClean)"
Write-Host "Source collections: $($inventory.totals.sourceCollections)"
Write-Host "Coverage drums/808/harmony/lead: $($inventory.roleCoverage.drums)/$($inventory.roleCoverage.'808')/$($inventory.roleCoverage.harmony)/$($inventory.roleCoverage.lead)"
Write-Host "GATE 1 DATA READY: $(if ($gateData.ready) { 'READY' } else { 'NOT READY' })"
if ($gateData.blockers.Count -gt 0) {
  Write-Host "Blocker residui:"
  foreach ($blocker in $gateData.blockers) {
    Write-Host " - $blocker"
  }
}
Write-Host "Gate report: $gateReport"
