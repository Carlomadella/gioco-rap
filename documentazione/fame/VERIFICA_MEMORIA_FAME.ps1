param(
    [Parameter(Mandatory=$false)]
    [string]$MemoryPath = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

$manifestPath = Join-Path $MemoryPath "MEMORY_MANIFEST.json"
if (-not (Test-Path $manifestPath)) {
    throw "MEMORY_MANIFEST.json non trovato in $MemoryPath"
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$failed = @()

foreach ($prop in $manifest.files.PSObject.Properties) {
    $rel = $prop.Name
    $expected = $prop.Value.sha256.ToLower()
    $full = Join-Path $MemoryPath ($rel -replace "/", "\")
    if (-not (Test-Path $full)) {
        $failed += "MISSING  $rel"
        continue
    }
    $actual = (Get-FileHash -Algorithm SHA256 $full).Hash.ToLower()
    if ($actual -ne $expected) {
        $failed += "CHANGED  $rel"
    }
}

if ($failed.Count -gt 0) {
    Write-Host "`n=== FAME MEMORY: INTEGRITY FAILED ===" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    exit 2
}

Write-Host "`n=== FAME MEMORY: OK ===" -ForegroundColor Green
Write-Host "Versione: $($manifest.memory_version)"
Write-Host "File verificati: $(@($manifest.files.PSObject.Properties).Count)"
exit 0

