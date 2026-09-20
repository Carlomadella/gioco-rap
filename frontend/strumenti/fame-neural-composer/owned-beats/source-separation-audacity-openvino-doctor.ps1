param(
    [string]$AudacityPath = "",
    [string]$ExpectedModelBinSha256 = "7aa84fa1f2b534bd6865a5609b8b5b028802fe761d6a09b1d30a1564f8fac6f8",
    [string]$ExpectedModelXmlSha256 = "304e24325756089d6bb6583171dd1bea2327505e87c6cb6e010afea7463d9f0a"
)

$ErrorActionPreference = "Stop"

function Resolve-AudacityExe {
    param([string]$ExplicitPath)

    if ($ExplicitPath) {
        $candidate = [IO.Path]::GetFullPath($ExplicitPath)
        if ((Test-Path -LiteralPath $candidate -PathType Leaf) -and ([IO.Path]::GetFileName($candidate) -ieq "audacity.exe")) {
            return $candidate
        }
        if (Test-Path -LiteralPath $candidate -PathType Container) {
            $inside = Join-Path $candidate "audacity.exe"
            if (Test-Path -LiteralPath $inside -PathType Leaf) { return $inside }
        }
        throw "Audacity non trovato nel percorso esplicito: $ExplicitPath"
    }

    $registryKeys = @(
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\audacity.exe",
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\audacity.exe"
    )
    foreach ($key in $registryKeys) {
        try {
            $item = Get-Item -Path $key -ErrorAction Stop
            $value = $item.GetValue("")
            if ($value -and (Test-Path -LiteralPath $value -PathType Leaf)) {
                return [IO.Path]::GetFullPath($value)
            }
        } catch {}
    }

    $candidates = @()
    if ($env:ProgramFiles) {
        $candidates += (Join-Path $env:ProgramFiles "Audacity\audacity.exe")
        $candidates += (Join-Path $env:ProgramFiles "Audacity 3.7.1\audacity.exe")
        $candidates += (Join-Path $env:ProgramFiles "Audacity 3.7.3\audacity.exe")
    }
    if ($env:LOCALAPPDATA) {
        $candidates += (Join-Path $env:LOCALAPPDATA "Programs\Audacity\audacity.exe")
    }

    foreach ($candidate in $candidates | Select-Object -Unique) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return [IO.Path]::GetFullPath($candidate)
        }
    }
    return $null
}

function File-Sha256 {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Pipe-Exists {
    param([string]$Name)
    try {
        $names = @(Get-ChildItem -Path "\\.\pipe\" -ErrorAction Stop | ForEach-Object { $_.Name })
        return $names -contains $Name
    } catch {
        return $false
    }
}

$audacityExe = Resolve-AudacityExe -ExplicitPath $AudacityPath

if (-not $audacityExe) {
    [ordered]@{
        mode = "SOURCE_SEPARATION_AUDACITY_OPENVINO_DOCTOR"
        pass = $false
        audacityFound = $false
        sourceSeparationExecutedByThisCommand = $false
        audioOpenedByThisCommand = $false
        configurationModifiedByThisCommand = $false
        nextAction = "INSTALL_OR_LOCATE_AUDACITY_OPENVINO"
    } | ConvertTo-Json -Depth 8
    exit 2
}

$base = Split-Path -Parent $audacityExe
$openVinoModule = Join-Path $base "modules\mod-openvino.dll"
$scriptPipeModule = Join-Path $base "modules\mod-script-pipe.dll"
$modelBin = Join-Path $base "openvino-models\htdemucs_v4.bin"
$modelXml = Join-Path $base "openvino-models\htdemucs_v4.xml"

$binSha = File-Sha256 $modelBin
$xmlSha = File-Sha256 $modelXml
$modelBinMatch = $binSha -eq $ExpectedModelBinSha256.ToLowerInvariant()
$modelXmlMatch = $xmlSha -eq $ExpectedModelXmlSha256.ToLowerInvariant()
$modelMatch = $modelBinMatch -and $modelXmlMatch

$audacityVersion = $null
try { $audacityVersion = (Get-Item -LiteralPath $audacityExe).VersionInfo.FileVersion } catch {}

$processRunning = @(Get-Process audacity -ErrorAction SilentlyContinue).Count -gt 0
$toPipe = Pipe-Exists "ToSrvPipe"
$fromPipe = Pipe-Exists "FromSrvPipe"
$pipeReady = $processRunning -and $toPipe -and $fromPipe

$openVinoFound = Test-Path -LiteralPath $openVinoModule -PathType Leaf
$scriptPipeFound = Test-Path -LiteralPath $scriptPipeModule -PathType Leaf

$next = if (-not $openVinoFound) {
    "INSTALL_COMPATIBLE_OPENVINO_AUDACITY_PLUGIN"
} elseif (-not $modelMatch) {
    "RESTORE_FROZEN_HTDEMUCS_OPENVINO_MODEL"
} elseif (-not $scriptPipeFound) {
    "INSTALL_AUDACITY_MOD_SCRIPT_PIPE"
} elseif (-not $pipeReady) {
    "ENABLE_MOD_SCRIPT_PIPE_AND_RESTART_AUDACITY"
} else {
    "DISCOVER_OPENVINO_EFFECT_SCRIPTING_COMMAND"
}

$pass = $openVinoFound -and $scriptPipeFound -and $modelMatch

[ordered]@{
    mode = "SOURCE_SEPARATION_AUDACITY_OPENVINO_DOCTOR"
    pass = $pass
    audacityFound = $true
    audacityExe = $audacityExe
    audacityVersion = $audacityVersion
    openVinoModule = [ordered]@{
        found = $openVinoFound
        path = $openVinoModule
    }
    frozenModel = [ordered]@{
        bin = [ordered]@{
            found = (Test-Path -LiteralPath $modelBin -PathType Leaf)
            path = $modelBin
            sha256 = $binSha
            expectedSha256 = $ExpectedModelBinSha256.ToLowerInvariant()
            matches = $modelBinMatch
        }
        xml = [ordered]@{
            found = (Test-Path -LiteralPath $modelXml -PathType Leaf)
            path = $modelXml
            sha256 = $xmlSha
            expectedSha256 = $ExpectedModelXmlSha256.ToLowerInvariant()
            matches = $modelXmlMatch
        }
        exactFrozenArtifact = $modelMatch
    }
    scripting = [ordered]@{
        moduleFound = $scriptPipeFound
        modulePath = $scriptPipeModule
        audacityProcessRunning = $processRunning
        toServerPipeFound = $toPipe
        fromServerPipeFound = $fromPipe
        pipeReady = $pipeReady
    }
    sourceSeparationExecutedByThisCommand = $false
    audioOpenedByThisCommand = $false
    configurationModifiedByThisCommand = $false
    nextAction = $next
} | ConvertTo-Json -Depth 10

if (-not $pass) { exit 3 }
