param(
  [int]$PdmxCount = 48,
  [int]$CandidatePool = 512,
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

function Assert-Md5 {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Expected
  )
  if (-not (Test-Path $Path)) { return $false }
  $actual = (Get-FileHash $Path -Algorithm MD5).Hash.ToLowerInvariant()
  return $actual -eq $Expected.ToLowerInvariant()
}

function Download-Verified {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Md5
  )
  if (Assert-Md5 -Path $Path -Expected $Md5) {
    Write-Host "Cache valida: $(Split-Path $Path -Leaf)"
    return
  }
  if (Test-Path $Path) { Remove-Item $Path -Force }
  Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $Path
  if (-not (Assert-Md5 -Path $Path -Expected $Md5)) {
    throw "Checksum MD5 non valido per $(Split-Path $Path -Leaf)"
  }
}

if ($PdmxCount -lt 8) { throw "PdmxCount deve essere almeno 8." }
if ($SeedCount -lt 1 -or $SeedCount -gt 128) { throw "SeedCount deve essere tra 1 e 128." }
if ($CandidatePool -lt $PdmxCount) { throw "CandidatePool deve essere >= PdmxCount." }

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$repoRoot)) {
  throw "Esegui questo script dalla repository gioco-rap."
}
$repoRoot = ([string]$repoRoot).Trim()

if ([string]::IsNullOrWhiteSpace($Workspace)) {
  $Workspace = Join-Path $env:TEMP "fame-neural-corpus-expansion-v3-pdmx"
}

$datasetRoot = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\dataset"
$baseRunner = Join-Path $datasetRoot "run-corpus-expansion-v2.ps1"
$sourceExpansion = Join-Path $datasetRoot "run-source-expansion.ps1"
$selector = Join-Path $datasetRoot "select-pdmx.js"
$pdmxReviewer = Join-Path $datasetRoot "review-pdmx.js"
$compatFilter = Join-Path $datasetRoot "filter-pdmx-compatible.js"
$pdmxConfig = Join-Path $datasetRoot "pdmx-source.json"
$merger = Join-Path $datasetRoot "merge-phrase-corpora.js"
$phraseCorpus = Join-Path $datasetRoot "phrase-corpus.js"
$phraseReview = Join-Path $datasetRoot "phrase-review.js"
$gate = Join-Path $datasetRoot "data-ready-gate.js"
$gatePolicy = Join-Path $datasetRoot "data-ready-policy.example.json"
$auditorOptions = Join-Path $datasetRoot "auditor-options.example.json"

foreach ($required in @(
  $baseRunner,
  $sourceExpansion,
  $selector,
  $pdmxReviewer,
  $compatFilter,
  $pdmxConfig,
  $merger,
  $phraseCorpus,
  $phraseReview,
  $gate,
  $gatePolicy,
  $auditorOptions
)) {
  if (-not (Test-Path $required)) { throw "File richiesto non trovato: $required" }
}

$tar = Get-Command tar.exe -ErrorAction SilentlyContinue
if (-not $tar) { throw "tar.exe non trovato." }

New-Item -ItemType Directory -Path $Workspace -Force | Out-Null

$baseWorkspace = Join-Path $env:TEMP "fame-neural-corpus-expansion-v2"
$downloadDir = Join-Path $Workspace "download"
$subsetExtract = Join-Path $Workspace "subset-extracted"
$midExtract = Join-Path $Workspace "mid-selected-extracted"
$pdmxCandidateSource = Join-Path $Workspace "pdmx-candidate-source"
$pdmxSource = Join-Path $Workspace "pdmx-compatible-source"
$pdmxPipeline = Join-Path $Workspace "pdmx-pipeline"
$globalRaw = Join-Path $Workspace "global-raw-phrase-items"
$globalReviewed = Join-Path $Workspace "global-reviewed-phrase-items"

$config = Get-Content $pdmxConfig -Raw | ConvertFrom-Json
$midArchive = Join-Path $downloadDir $config.midArchive.name
$subsetArchive = Join-Path $downloadDir $config.subsetArchive.name
$midListing = Join-Path $Workspace "mid-archive-list.txt"
$selectionPlan = Join-Path $Workspace "pdmx-selection-plan.json"
$tarList = Join-Path $Workspace "pdmx-tar-list.txt"
$selectionReport = Join-Path $Workspace "pdmx-selection-report.json"
$compatibilityReport = Join-Path $Workspace "pdmx-compatibility-report.json"

$mergeReport = Join-Path $Workspace "global-merge-report.json"
$auditOptionsPath = Join-Path $Workspace "global-audit-options.json"
$initialAudit = Join-Path $Workspace "global-audit-initial.json"
$initialSplit = Join-Path $Workspace "global-split-initial.json"
$reviewDecisions = Join-Path $Workspace "global-review-decisions.json"
$reviewReport = Join-Path $Workspace "global-review-report.json"
$finalAudit = Join-Path $Workspace "global-audit.json"
$finalSplit = Join-Path $Workspace "global-split.json"
$gateReport = Join-Path $Workspace "global-gate1-report.json"
$inventoryReport = Join-Path $Workspace "global-inventory.json"

New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null

Write-Host "=== FAME NEURAL / CORPUS EXPANSION V3 / PDMX ===" -ForegroundColor Cyan
Write-Host "PDMX source target: $PdmxCount"
Write-Host "PDMX candidate pool: $CandidatePool"
Write-Host "FAME Original seed count: $SeedCount"
Write-Host ""

Write-Host "[1/10] Ricostruisco corpus GMD globale corrente..." -ForegroundColor Yellow
& powershell -NoProfile -ExecutionPolicy Bypass -File $baseRunner -GmdCount 34 -SeedCount $SeedCount -Workspace $baseWorkspace
if ($LASTEXITCODE -ne 0) { throw "Corpus base GMD fallito." }

$baseReviewed = Join-Path $baseWorkspace "global-reviewed-phrase-items"
$baseInventoryPath = Join-Path $baseWorkspace "global-inventory.json"
if (-not (Test-Path $baseReviewed)) { throw "Corpus base reviewed mancante." }
if (-not (Test-Path $baseInventoryPath)) { throw "Inventory base mancante." }
$baseInventory = Get-Content $baseInventoryPath -Raw | ConvertFrom-Json

Write-Host "[2/10] Download PDMX MID + subset paths..." -ForegroundColor Yellow
Download-Verified -Url $config.midArchive.url -Path $midArchive -Md5 $config.midArchive.md5
Download-Verified -Url $config.subsetArchive.url -Path $subsetArchive -Md5 $config.subsetArchive.md5

Write-Host "[3/10] Estraggo subset e indicizzo archivio MIDI..." -ForegroundColor Yellow
if (Test-Path $subsetExtract) { Remove-Item $subsetExtract -Recurse -Force }
New-Item -ItemType Directory -Path $subsetExtract -Force | Out-Null
& $tar.Source -xf $subsetArchive -C $subsetExtract
if ($LASTEXITCODE -ne 0) { throw "Estrazione subset_paths PDMX fallita." }

& $tar.Source -tf $midArchive | Set-Content -Encoding UTF8 $midListing
if ($LASTEXITCODE -ne 0) { throw "Listing mid.tar.gz PDMX fallito." }

Write-Host "[4/10] Selezione deterministic safe subset..." -ForegroundColor Yellow
& node $selector plan $subsetExtract $midListing $pdmxConfig $selectionPlan $tarList $CandidatePool
if ($LASTEXITCODE -ne 0) { throw "Planning PDMX fallito." }

$plan = Get-Content $selectionPlan -Raw | ConvertFrom-Json
if ($plan.totals.selected -lt $PdmxCount) { throw "PDMX safe candidate pool insufficiente: $($plan.totals.selected)" }

Write-Host "[5/10] Estraggo solo i MIDI selezionati..." -ForegroundColor Yellow
if (Test-Path $midExtract) { Remove-Item $midExtract -Recurse -Force }
New-Item -ItemType Directory -Path $midExtract -Force | Out-Null
& $tar.Source -xf $midArchive -C $midExtract -T $tarList
if ($LASTEXITCODE -ne 0) { throw "Estrazione selettiva MIDI PDMX fallita." }

if (Test-Path $pdmxCandidateSource) { Remove-Item $pdmxCandidateSource -Recurse -Force }
New-Item -ItemType Directory -Path $pdmxCandidateSource -Force | Out-Null
& node $selector materialize $selectionPlan $midExtract $pdmxCandidateSource $pdmxConfig $selectionReport
if ($LASTEXITCODE -ne 0) { throw "Materializzazione candidate PDMX fallita." }

Write-Host "[5b/10] Filtro compatibilita' FAME: 4/4/tempo/canonico + pitched..." -ForegroundColor Yellow
if (Test-Path $pdmxSource) { Remove-Item $pdmxSource -Recurse -Force }
New-Item -ItemType Directory -Path $pdmxSource -Force | Out-Null
& node $compatFilter $pdmxCandidateSource $pdmxSource $compatibilityReport $PdmxCount 4
if ($LASTEXITCODE -ne 0) {
  $compat = Get-Content $compatibilityReport -Raw | ConvertFrom-Json
  Write-Host "Technical error codes:" -ForegroundColor Red
  $compat.technicalErrorCodes.PSObject.Properties | ForEach-Object { Write-Host " - $($_.Name): $($_.Value)" }
  throw "PDMX non ha prodotto $PdmxCount sorgenti compatibili dal pool di $CandidatePool. Controlla $compatibilityReport"
}

Write-Host "[6/10] Source expansion PDMX compatibile..." -ForegroundColor Yellow
if (Test-Path $pdmxPipeline) { Remove-Item $pdmxPipeline -Recurse -Force }
& powershell -NoProfile -ExecutionPolicy Bypass -File $sourceExpansion -SourceDir $pdmxSource -Workspace $pdmxPipeline -AutoReviewScript $pdmxReviewer
if ($LASTEXITCODE -ne 0) { throw "Source expansion PDMX fallita." }

$pdmxPhraseDir = Join-Path $pdmxPipeline "phrase-items"
$pdmxBuildPath = Join-Path $pdmxPipeline "phrase-build-report.json"
if (-not (Test-Path $pdmxPhraseDir)) { throw "Phrase PDMX mancanti." }
if (-not (Test-Path $pdmxBuildPath)) { throw "Report phrase PDMX mancante." }
$pdmxBuild = Get-Content $pdmxBuildPath -Raw | ConvertFrom-Json
if ($pdmxBuild.totals.phrasesProduced -lt 1) { throw "PDMX non ha prodotto phrase." }

Write-Host "[7/10] Merge globale base + PDMX..." -ForegroundColor Yellow
if (Test-Path $globalRaw) { Remove-Item $globalRaw -Recurse -Force }
New-Item -ItemType Directory -Path $globalRaw -Force | Out-Null
& node $merger $globalRaw $mergeReport $baseReviewed $pdmxPhraseDir
if ($LASTEXITCODE -ne 0) { throw "Merge globale PDMX fallito." }

$auditorCfg = Get-Content $auditorOptions -Raw | ConvertFrom-Json
$globalCfg = [ordered]@{
  targetMinPhrases = 500
  similarity = $auditorCfg.similarity
  quality = $auditorCfg.quality
}
Write-Utf8NoBom -Path $auditOptionsPath -Text ($globalCfg | ConvertTo-Json -Depth 10)

Write-Host "[8/10] Audit + review globale..." -ForegroundColor Yellow
& node $phraseCorpus $globalRaw $initialAudit $initialSplit $auditOptionsPath
if ($LASTEXITCODE -ne 0) { throw "Audit globale iniziale PDMX non READY." }

if (Test-Path $globalReviewed) { Remove-Item $globalReviewed -Recurse -Force }
New-Item -ItemType Directory -Path $globalReviewed -Force | Out-Null
& node $phraseReview $globalRaw $initialAudit $globalReviewed $reviewDecisions $reviewReport
if ($LASTEXITCODE -ne 0) { throw "Phrase review globale PDMX fallita." }

Write-Host "[9/10] Re-audit globale reviewed..." -ForegroundColor Yellow
& node $phraseCorpus $globalReviewed $finalAudit $finalSplit $auditOptionsPath $reviewDecisions
if ($LASTEXITCODE -ne 0) { throw "Re-audit globale PDMX non READY." }

$finalAuditData = Get-Content $finalAudit -Raw | ConvertFrom-Json
if (-not $finalAuditData.block5Ready) { throw "BLOCCO 5 non READY dopo PDMX." }
if (-not $finalAuditData.corpusClean) {
  Write-Host "Corpus issues residui:" -ForegroundColor Red
  foreach ($issue in $finalAuditData.corpusIssues) { Write-Host " - $issue" }
  throw "Corpus PDMX globale non clean."
}
if (-not $finalAuditData.reviewComplete) { throw "Review PDMX globale non completa." }

Write-Host "[10/10] GATE 1 globale..." -ForegroundColor Yellow
& node $gate $globalReviewed $finalAudit $gateReport $gatePolicy $inventoryReport
if ($LASTEXITCODE -ne 0) { throw "GATE 1 globale PDMX fallito." }

$inventory = Get-Content $inventoryReport -Raw | ConvertFrom-Json
$gateData = Get-Content $gateReport -Raw | ConvertFrom-Json
$reviewData = Get-Content $reviewReport -Raw | ConvertFrom-Json

if ($inventory.totals.sourceCollections -lt 4) {
  throw "PDMX non e' entrato come quarta source collection."
}

$basePitched = [int]$baseInventory.roleCoverage.pitchedAny
$finalPitched = [int]$inventory.roleCoverage.pitchedAny
$baseHarmony = [int]$baseInventory.roleCoverage.harmony
$finalHarmony = [int]$inventory.roleCoverage.harmony
$baseLead = [int]$baseInventory.roleCoverage.lead
$finalLead = [int]$inventory.roleCoverage.lead

if ($finalPitched -le $basePitched -and $finalHarmony -le $baseHarmony -and $finalLead -le $baseLead) {
  throw "PDMX non ha migliorato pitchedAny/harmony/lead: non committare."
}

Write-Host ""
Write-Host "CORPUS EXPANSION V3 / PDMX: PIPELINE COMPLETATA" -ForegroundColor Green
$compatSummary = Get-Content $compatibilityReport -Raw | ConvertFrom-Json
Write-Host "PDMX candidate rights-safe: $($plan.totals.selected)"
Write-Host "PDMX candidate tecnicamente compatibili: $($compatSummary.totals.compatible)"
Write-Host "PDMX source finali selezionate: $($compatSummary.totals.selected)"
Write-Host "PDMX phrase prodotte: $($pdmxBuild.totals.phrasesProduced)"
Write-Host "Phrase globali rejected: $($reviewData.totals.rejectedTotal)"
Write-Host "Phrase globali finali: $($finalAuditData.totals.valid)"
Write-Host "Composition family: $($inventory.totals.compositionFamilies)"
Write-Host "Source collections: $($inventory.totals.sourceCollections)"
Write-Host "Coverage drums/808/harmony/lead: $($inventory.roleCoverage.drums)/$($inventory.roleCoverage.'808')/$($inventory.roleCoverage.harmony)/$($inventory.roleCoverage.lead)"
Write-Host "Coverage pitchedAny: $($inventory.roleCoverage.pitchedAny)"
Write-Host "GATE 1 DATA READY: $(if ($gateData.ready) { 'READY' } else { 'NOT READY' })"
if ($gateData.blockers.Count -gt 0) {
  Write-Host "Blocker residui:"
  foreach ($blocker in $gateData.blockers) { Write-Host " - $blocker" }
}
Write-Host "Gate report: $gateReport"
Write-Host "Inventory: $inventoryReport"
