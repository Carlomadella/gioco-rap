param(
  [int]$SampleCount = 6,
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

function Normalize-ZipPath {
  param([Parameter(Mandatory=$true)][string]$Path)
  return (($Path -replace '\\', '/').TrimStart('/'))
}

function Find-ArchiveEntry {
  param(
    [Parameter(Mandatory=$true)][object[]]$Entries,
    [Parameter(Mandatory=$true)][string]$RelativePath
  )

  $normalized = Normalize-ZipPath $RelativePath
  $candidates = @($normalized, "groove/$normalized") | Select-Object -Unique

  foreach ($candidate in $candidates) {
    foreach ($entry in $Entries) {
      $entryPath = Normalize-ZipPath ([string]$entry)
      if ($entryPath.Equals($candidate, [System.StringComparison]::OrdinalIgnoreCase)) {
        return [string]$entry
      }
    }
  }

  $suffix = "/$normalized"
  foreach ($entry in $Entries) {
    $entryPath = Normalize-ZipPath ([string]$entry)
    if ($entryPath.EndsWith($suffix, [System.StringComparison]::OrdinalIgnoreCase)) {
      return [string]$entry
    }
  }

  return $null
}

function Invoke-TarExtractOne {
  param(
    [Parameter(Mandatory=$true)][string]$TarExe,
    [Parameter(Mandatory=$true)][string]$ZipPath,
    [Parameter(Mandatory=$true)][string]$Destination,
    [Parameter(Mandatory=$true)][string]$EntryPath
  )

  & $TarExe -xf $ZipPath -C $Destination -- $EntryPath
  if ($LASTEXITCODE -ne 0) {
    throw "tar.exe non riesce a estrarre l'entry selezionata: $EntryPath (exit $LASTEXITCODE)"
  }
}

if ($SampleCount -lt 3) {
  throw "SampleCount deve essere almeno 3 per il gate FASE 2."
}

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$repoRoot)) {
  throw "Esegui questo script dalla repository gioco-rap."
}
$repoRoot = ([string]$repoRoot).Trim()

$midiToolDir = Join-Path $repoRoot "frontend\strumenti\fame-neural-composer\midi"
$batchImporter = Join-Path $midiToolDir "batch-import-midi.js"
$corpusGate = Join-Path $midiToolDir "corpus-gate.js"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js non trovato nel PATH."
}
$tarCommand = Get-Command tar.exe -ErrorAction SilentlyContinue
if (-not $tarCommand) {
  throw "tar.exe non trovato. Su Windows 10/11 e' normalmente incluso nel sistema."
}
$tarExe = $tarCommand.Source

if (-not (Test-Path $batchImporter)) {
  throw "batch-import-midi.js non trovato: $batchImporter"
}
if (-not (Test-Path $corpusGate)) {
  throw "corpus-gate.js non trovato: $corpusGate"
}

if ([string]::IsNullOrWhiteSpace($Workspace)) {
  $Workspace = Join-Path $env:TEMP "fame-neural-gmd-phase2"
}

$datasetUrl = "https://storage.googleapis.com/magentadata/datasets/groove/groove-v1.0.0-midionly.zip"
$datasetPage = "https://magenta.tensorflow.org/datasets/groove"
$expectedSha256 = "651cbc524ffb891be1a3e46d89dc82a1cecb09a57c748c7b45b844c4841dcc1e"

$zipPath = Join-Path $Workspace "groove-v1.0.0-midionly.zip"
$selectiveDir = Join-Path $Workspace "tar-selective"
$sampleDir = Join-Path $Workspace "sample-input"
$datasetItemsDir = Join-Path $Workspace "dataset-items"
$batchReportPath = Join-Path $Workspace "batch-report.json"
$gateOptionsPath = Join-Path $Workspace "gate-options.json"
$gateReportPath = Join-Path $Workspace "phase2-real-gate-report.json"
$attributionPath = Join-Path $Workspace "ATTRIBUTION_GMD.txt"

New-Item -ItemType Directory -Path $Workspace -Force | Out-Null

Write-Host "=== FAME NEURAL / FASE 2 REAL DATA GATE ===" -ForegroundColor Cyan
Write-Host "Repo: $repoRoot"
Write-Host "Workspace: $Workspace"
Write-Host "Fonte: Groove MIDI Dataset v1.0.0 (Google LLC), CC BY 4.0"

if (-not (Test-Path $zipPath)) {
  Write-Host "[1/7] Download GMD MIDI-only (3.11 MB)..." -ForegroundColor Yellow
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $datasetUrl -OutFile $zipPath -UseBasicParsing
} else {
  Write-Host "[1/7] ZIP gia' presente: riuso cache locale."
}

Write-Host "[2/7] Verifica SHA-256 ufficiale..." -ForegroundColor Yellow
$actualSha256 = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualSha256 -ne $expectedSha256) {
  throw "SHA-256 GMD NON VALIDO. Atteso $expectedSha256, trovato $actualSha256. Archivio non utilizzato."
}
Write-Host "SHA-256: OK" -ForegroundColor Green

Write-Host "[3/7] Lettura archivio con tar.exe (bypass System.IO.Compression)..." -ForegroundColor Yellow
$rawEntries = @(& $tarExe -tf $zipPath)
if ($LASTEXITCODE -ne 0) {
  throw "tar.exe non riesce a leggere lo ZIP GMD (exit $LASTEXITCODE)."
}
$entries = @($rawEntries | ForEach-Object { [string]$_ } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
$midiEntries = @($entries | Where-Object { $_ -match '(?i)\.mid(i)?$' })
$infoEntry = @($entries | Where-Object { $_ -match '(?i)(^|/)info\.csv$' } | Select-Object -First 1)

Write-Host "ZIP: $($entries.Count) entry, MIDI rilevati: $($midiEntries.Count)"
if ($midiEntries.Count -eq 0) {
  $preview = @($entries | Select-Object -First 12) -join " | "
  throw "tar.exe legge lo ZIP ma non trova MIDI. Prime entry: $preview"
}
if ($infoEntry.Count -eq 0) {
  throw "info.csv non trovato da tar.exe. L'archivio ha $($entries.Count) entry e $($midiEntries.Count) MIDI."
}
$infoEntryPath = [string]$infoEntry[0]
Write-Host "Metadata entry: $infoEntryPath"

if (Test-Path $selectiveDir) { Remove-Item $selectiveDir -Recurse -Force }
New-Item -ItemType Directory -Path $selectiveDir -Force | Out-Null
Invoke-TarExtractOne -TarExe $tarExe -ZipPath $zipPath -Destination $selectiveDir -EntryPath $infoEntryPath
$infoFile = Get-ChildItem -Path $selectiveDir -Filter "info.csv" -File -Recurse | Select-Object -First 1
if (-not $infoFile) {
  throw "tar.exe ha estratto l'entry metadata ma info.csv non e' stato trovato nel workspace."
}

$rows = @(Import-Csv -Path $infoFile.FullName)
$candidates = @($rows | Where-Object {
  ($_.style -eq "hiphop" -or $_.style -like "hiphop/*") -and
  $_.time_signature -eq "4-4" -and
  $_.beat_type -eq "beat" -and
  -not [string]::IsNullOrWhiteSpace([string]$_.midi_filename)
})
Write-Host "Metadata: $($rows.Count) righe; candidati hiphop/beat/4-4: $($candidates.Count)"
if ($candidates.Count -lt $SampleCount) {
  throw "GMD: trovati solo $($candidates.Count) beat hiphop 4/4, ne servono $SampleCount."
}

$selected = New-Object System.Collections.ArrayList
$seenFamilies = @{}
foreach ($row in $candidates) {
  $family = "$($row.drummer)|$($row.session)"
  if (-not $seenFamilies.ContainsKey($family)) {
    [void]$selected.Add($row)
    $seenFamilies[$family] = $true
  }
  if ($selected.Count -ge $SampleCount) { break }
}
if ($selected.Count -lt $SampleCount) {
  foreach ($row in $candidates) {
    if ($selected -contains $row) { continue }
    [void]$selected.Add($row)
    if ($selected.Count -ge $SampleCount) { break }
  }
}

$familyCount = @($selected | ForEach-Object { "$($_.drummer)|$($_.session)" } | Select-Object -Unique).Count
if ($familyCount -lt 2) {
  throw "Il campione reale deve contenere almeno 2 compositionFamily; trovata $familyCount."
}

if (Test-Path $sampleDir) { Remove-Item $sampleDir -Recurse -Force }
if (Test-Path $datasetItemsDir) { Remove-Item $datasetItemsDir -Recurse -Force }
New-Item -ItemType Directory -Path $sampleDir -Force | Out-Null
New-Item -ItemType Directory -Path $datasetItemsDir -Force | Out-Null

Write-Host "[4/7] Estraggo solo $SampleCount MIDI reali hiphop/4-4 e creo provenance..." -ForegroundColor Yellow
foreach ($row in $selected) {
  $relativeMidi = Normalize-ZipPath ([string]$row.midi_filename)
  $archiveMidi = Find-ArchiveEntry -Entries $entries -RelativePath $relativeMidi
  if ([string]::IsNullOrWhiteSpace([string]$archiveMidi)) {
    throw "MIDI dichiarato in info.csv non trovato nello ZIP: $relativeMidi"
  }

  Invoke-TarExtractOne -TarExe $tarExe -ZipPath $zipPath -Destination $selectiveDir -EntryPath $archiveMidi
  $sourceMidi = Join-Path $selectiveDir ((Normalize-ZipPath $archiveMidi) -replace '/', '\\')
  if (-not (Test-Path $sourceMidi)) {
    throw "MIDI selettivamente estratto ma non trovato su disco: $archiveMidi"
  }

  $safeId = ([string]$row.id -replace '[^A-Za-z0-9._-]', '_')
  if ([string]::IsNullOrWhiteSpace($safeId)) {
    $safeId = [System.IO.Path]::GetFileNameWithoutExtension($sourceMidi)
  }
  $targetMidi = Join-Path $sampleDir ("{0}.mid" -f $safeId)
  Copy-Item $sourceMidi $targetMidi -Force

  $provenance = [ordered]@{
    sourceId = "gmd-v1.0.0:$($row.id)"
    originType = "licensed_dataset"
    creator = "Groove MIDI Dataset contributors / Google LLC"
    licenseId = "CC-BY-4.0"
    compositionFamily = "gmd:$($row.drummer):$($row.session)"
    sourceUri = $datasetPage
    rightsEvidence = @(
      "Official GMD page states the dataset is made available by Google LLC under CC BY 4.0.",
      "Official MIDI-only archive SHA-256 verified locally: $expectedSha256.",
      "GMD metadata row id=$($row.id), style=$($row.style), split=$($row.split)."
    )
    commercialTrainingAllowed = $true
    commercialOutputAllowed = $true
    notes = "Human-performed drum MIDI. CC BY 4.0 attribution required. Provenance record supports the FAME Neural data gate and is not a substitute for project legal review."
  }

  $sidecar = [System.IO.Path]::ChangeExtension($targetMidi, ".provenance.json")
  Write-Utf8NoBom -Path $sidecar -Text ($provenance | ConvertTo-Json -Depth 8)
}

$attribution = @"
Groove MIDI Dataset (GMD) v1.0.0
Source: $datasetPage
Publisher: Google LLC
License: Creative Commons Attribution 4.0 International (CC BY 4.0)

Dataset paper:
Jon Gillick, Adam Roberts, Jesse Engel, Douglas Eck, and David Bamman.
"Learning to Groove with Inverse Sequence Transformations."
International Conference on Machine Learning (ICML), 2019.

This local test corpus was selected from the official MIDI-only archive.
Archive SHA-256: $expectedSha256
"@
Write-Utf8NoBom -Path $attributionPath -Text $attribution

Write-Host "[5/7] Batch import reale..." -ForegroundColor Yellow
& node $batchImporter $sampleDir $datasetItemsDir $batchReportPath
if ($LASTEXITCODE -ne 0) {
  throw "Batch import GMD fallito con exit code $LASTEXITCODE. Controlla $batchReportPath"
}

$gateOptions = [ordered]@{
  minItems = $SampleCount
  minCompositionFamilies = 2
}
Write-Utf8NoBom -Path $gateOptionsPath -Text ($gateOptions | ConvertTo-Json)

Write-Host "[6/7] Corpus gate FASE 2 su MIDI reali..." -ForegroundColor Yellow
& node $corpusGate $datasetItemsDir $gateReportPath $gateOptionsPath
if ($LASTEXITCODE -ne 0) {
  throw "FASE 2 REAL DATA GATE bloccato. Controlla $gateReportPath"
}

$gateReport = Get-Content $gateReportPath -Raw | ConvertFrom-Json
if ($gateReport.ready -ne $true) {
  throw "Il report non risulta READY nonostante exit code 0: $gateReportPath"
}

Write-Host "[7/7] READY" -ForegroundColor Green
Write-Host ""
Write-Host "FASE 2 REAL DATA GATE: READY" -ForegroundColor Green
Write-Host "MIDI reali: $($gateReport.totals.discovered)"
Write-Host "Validi: $($gateReport.totals.valid)"
Write-Host "Composition family: $($gateReport.totals.compositionFamilies)"
Write-Host "Sequence canoniche: $($gateReport.totals.canonicalSequences)"
Write-Host "Report: $gateReportPath"
Write-Host "Attribution: $attributionPath"
