$ErrorActionPreference = 'Stop'

$python = 'C:\Users\masam\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$removeKey = 'C:\Users\masam\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
$generated = 'C:\Users\masam\.codex\generated_images\019ff176-a081-79c2-bdda-be0a27ee17f8'
$output = Join-Path $PSScriptRoot '..\public\assets\items\chests-centered'
New-Item -ItemType Directory -Force -Path $output | Out-Null

$assets = @{
  'treasure-chest-common' = 'exec-a68a713c-f8c7-4b5f-b090-42bcc8becaa9.png'
  'treasure-chest-common-open' = 'exec-8b7f3db1-6baf-480c-9fd4-096ecf965e60.png'
  'treasure-chest-rare' = 'exec-f7a945ac-bc7e-4458-b56c-44f3e86b983a.png'
  'treasure-chest-rare-open' = 'exec-14d2941c-ae80-42f7-8c23-b0a6cb6fdefd.png'
}

foreach ($name in $assets.Keys) {
  $source = Join-Path $generated $assets[$name]
  $target = Join-Path $output "$name.png"
  & $python $removeKey --input $source --out $target --auto-key border --soft-matte --transparent-threshold 18 --opaque-threshold 150 --despill --edge-contract 1 --force
  if ($LASTEXITCODE -ne 0) { throw "Failed to prepare $name" }
}

& $python (Join-Path $PSScriptRoot 'crop-transparent-assets.py') $output 96 square
if ($LASTEXITCODE -ne 0) { throw 'Failed to crop centered chest assets' }
