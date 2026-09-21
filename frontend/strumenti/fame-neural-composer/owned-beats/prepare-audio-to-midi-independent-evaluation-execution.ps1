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

Write-Host "1/4 Frozen evaluation executor self-test (NO evaluation audio)..." -ForegroundColor Cyan
& $python $tool self-test
if ($LASTEXITCODE -ne 0) { throw "Evaluation executor self-test failed" }

Write-Host "2/4 Environment/model/reservation preflight (NO evaluation audio)..." -ForegroundColor Cyan
& $python $tool preflight $Workspace --model $Model
if ($LASTEXITCODE -ne 0) { throw "Evaluation execution preflight failed" }

Write-Host "3/4 Freeze append-only execution receipt (NO evaluation audio)..." -ForegroundColor Cyan
& $python $tool prepare $Workspace --model $Model
if ($LASTEXITCODE -ne 0) { throw "Evaluation execution receipt preparation failed" }

Write-Host "4/4 Verify frozen execution receipt read-only..." -ForegroundColor Cyan
& $python $tool check $Workspace --model $Model
if ($LASTEXITCODE -ne 0) { throw "Evaluation execution receipt verification failed" }
