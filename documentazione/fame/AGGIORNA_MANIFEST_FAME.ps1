param(
    [Parameter(Mandatory=$false)]
    [string]$MemoryPath = $PSScriptRoot
)

$ErrorActionPreference = "Stop"
$manifestPath = Join-Path $MemoryPath "MEMORY_MANIFEST.json"

$old = $null
if (Test-Path $manifestPath) {
    $old = Get-Content $manifestPath -Raw | ConvertFrom-Json
}

$files = [ordered]@{}
Get-ChildItem $MemoryPath -Recurse -File |
    Where-Object { $_.Name -ne "MEMORY_MANIFEST.json" } |
    Sort-Object FullName |
    ForEach-Object {
        $rel = $_.FullName.Substring($MemoryPath.Length).TrimStart("\") -replace "\\","/"
        $files[$rel] = [ordered]@{
            sha256 = (Get-FileHash -Algorithm SHA256 $_.FullName).Hash.ToLower()
            bytes  = $_.Length
        }
    }

$manifest = [ordered]@{
    memory_version = if ($old) { $old.memory_version } else { "1.1" }
    reference_build = if ($old) { $old.reference_build } else { "FAME V0.8 Rhythm & Arrangement Pass" }
    hash_algorithm = "SHA-256"
    files = $files
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content $manifestPath -Encoding UTF8
Write-Host "Manifest rigenerato: $manifestPath" -ForegroundColor Green
Write-Host "ATTENZIONE: farlo solo dopo una modifica approvata della memoria." -ForegroundColor Yellow
