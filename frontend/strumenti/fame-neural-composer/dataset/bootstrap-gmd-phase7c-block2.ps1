param(
  [int]$SourceCount = 24,
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

if ($SourceCount -le 6) {
  throw "SourceCount deve essere > 6: il Block2 deve verificare un'espansione reale rispetto al gate storico da 6 file."
}

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$repoRoot)) {
  throw "Esegui questo script dalla repository gioco-rap."
}
$repoRoot = ([string]$repoRoot).Trim()

if ([string]::IsNullOrWhiteSpace($Workspace)) {
  $Workspace = Join-Path $env:TEMP "fame-neural-gmd-phase7c-block2"
}

$phase2Bootstrap = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\midi\bootstrap-gmd-phase2.ps1"
$enricher = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\enrich-gmd-dataset-items.js"
$exporter = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\export-drum-view-v2-enriched.js"

foreach ($required in @($phase2Bootstrap, $enricher, $exporter)) {
  if (-not (Test-Path $required)) { throw "File richiesto non trovato: $required" }
}

New-Item -ItemType Directory -Path $Workspace -Force | Out-Null
$sourceWorkspace = Join-Path $Workspace "source-gmd"
$rawItems = Join-Path $sourceWorkspace "dataset-items"
$enrichedItems = Join-Path $Workspace "dataset-items-enriched"
$metadataReport = Join-Path $Workspace "gmd-metadata-report.json"
$drumViews = Join-Path $Workspace "drum-view-v2-enriched"
$drumReport = Join-Path $Workspace "drum-view-v2-enriched-report.json"
$exportOptions = Join-Path $Workspace "drum-view-options.json"

Write-Host "=== FAME NEURAL / FASE 7C BLOCCO 2 / GMD METADATA + EXPANSION ===" -ForegroundColor Cyan
Write-Host "Workspace: $Workspace"
Write-Host "SourceCount: $SourceCount"
Write-Host "Nota: usa ancora il selector storico hiphop/beat/4-4; NON chiude la 7D general-GMD." -ForegroundColor DarkYellow

Write-Host "[1/4] Bootstrap GMD reale espanso..." -ForegroundColor Yellow
& powershell -NoProfile -ExecutionPolicy Bypass -File $phase2Bootstrap -SampleCount $SourceCount -Workspace $sourceWorkspace
if ($LASTEXITCODE -ne 0) { throw "Bootstrap GMD espanso fallito." }

$infoFile = Get-ChildItem -Path $sourceWorkspace -Filter "info.csv" -File -Recurse | Select-Object -First 1
if (-not $infoFile) { throw "info.csv GMD non trovato nel workspace: $sourceWorkspace" }

if (Test-Path $enrichedItems) { Remove-Item $enrichedItems -Recurse -Force }
New-Item -ItemType Directory -Path $enrichedItems -Force | Out-Null
Write-Host "[2/4] Enrichment strutturato da info.csv..." -ForegroundColor Yellow
& node $enricher $rawItems $infoFile.FullName $enrichedItems $metadataReport
if ($LASTEXITCODE -ne 0) { throw "Metadata enrichment GMD fallito. Controlla $metadataReport" }

Write-Utf8NoBom -Path $exportOptions -Text (@{
  mappingProfileId = "gmd-9-v1"
  bars = 2
  gridDivisionPerQuarter = 4
} | ConvertTo-Json -Depth 5)

if (Test-Path $drumViews) { Remove-Item $drumViews -Recurse -Force }
New-Item -ItemType Directory -Path $drumViews -Force | Out-Null
Write-Host "[3/4] Export Drum View V2 con metadata ufficiali..." -ForegroundColor Yellow
& node $exporter $enrichedItems $drumViews $drumReport $exportOptions
if ($LASTEXITCODE -ne 0) { throw "Export Drum View V2 enriched fallito. Controlla $drumReport" }

$metadataData = Get-Content $metadataReport -Raw | ConvertFrom-Json
$drumData = Get-Content $drumReport -Raw | ConvertFrom-Json

if ($metadataData.totals.enriched -ne $SourceCount) {
  throw "Coverage metadata incompleta: enriched=$($metadataData.totals.enriched), atteso=$SourceCount"
}
if ($drumData.totals.exported -ne $SourceCount) {
  throw "Coverage Drum View incompleta: exported=$($drumData.totals.exported), atteso=$SourceCount"
}
if ($drumData.losslessSourceHitAccounting -ne $true) {
  throw "Source-hit accounting non lossless nel corpus espanso."
}
if ($drumData.completeMetadataCoverage -ne $true) {
  throw "Metadata coverage Drum View incompleta."
}

Write-Host "[4/4] BLOCK2 CANDIDATE READY" -ForegroundColor Green
Write-Host ""
Write-Host "MIDI reali importati: $SourceCount"
Write-Host "Dataset item enriched: $($metadataData.totals.enriched)"
Write-Host "Drum View enriched: $($drumData.totals.exported)"
Write-Host "Source/View hits: $($drumData.totals.sourceHits)/$($drumData.totals.viewHits)"
Write-Host "Raw fallback hits: $($drumData.totals.rawFallbackHits)"
Write-Host "Style primary: $($metadataData.distribution.stylePrimary | ConvertTo-Json -Compress)"
Write-Host "Beat type: $($metadataData.distribution.beatType | ConvertTo-Json -Compress)"
Write-Host "Source split: $($metadataData.distribution.sourceSplit | ConvertTo-Json -Compress)"
Write-Host "Metadata report: $metadataReport"
Write-Host "Drum report: $drumReport"
Write-Host ""
Write-Host "IMPORTANTE: questo supera il test tecnico Block2 solo se i numeri sopra sono reali; NON dichiara DRUM DATA READY V2 e NON chiude la 7D." -ForegroundColor DarkYellow
