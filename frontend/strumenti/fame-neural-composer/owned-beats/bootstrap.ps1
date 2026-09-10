param(
    [Parameter(Mandatory=$true)][string]$SourceRoot,
    [Parameter(Mandatory=$true)][string]$WorkspaceRoot,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path $PSScriptRoot 'bootstrap.js'
$nodeArgs = @($scriptPath, $SourceRoot, $WorkspaceRoot)
if ($Apply) { $nodeArgs += '--apply' }
& node @nodeArgs
if ($LASTEXITCODE -ne 0) { throw 'Bootstrap fallito: consulta il messaggio precedente. Originali preservati.' }
