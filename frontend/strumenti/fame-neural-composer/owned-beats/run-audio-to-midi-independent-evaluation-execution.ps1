param(
  [string]$Workspace = "D:\FAME_NEURAL",
  [string]$Model = "C:\Program Files\Audacity\openvino-models\htdemucs_v4.xml"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $here "audio-to-midi-independent-evaluation-execution.py"
$python = Join-Path $Workspace "venv-audio-analysis\Scripts\python.exe"

foreach ($file in @($tool, $python, $Model)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Evaluation execution prerequisite missing: $file"
  }
}

Write-Host "1/2 Verify frozen execution receipt..." -ForegroundColor Cyan
& $python $tool check $Workspace --model $Model
if ($LASTEXITCODE -ne 0) {
  throw "Frozen evaluation execution receipt check failed"
}

Write-Host "2/2 Execute frozen pipeline once on 12 reserved families..." -ForegroundColor Cyan
& $python $tool execute $Workspace --model $Model
if ($LASTEXITCODE -ne 0) {
  throw "Frozen Audio->MIDI independent evaluation execution failed"
}
