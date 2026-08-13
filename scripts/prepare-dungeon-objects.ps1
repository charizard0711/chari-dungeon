$ErrorActionPreference = 'Stop'

$python = 'C:\Users\masam\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$removeKey = 'C:\Users\masam\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
$generated = 'C:\Users\masam\.codex\generated_images\019ff176-a081-79c2-bdda-be0a27ee17f8'
$output = Join-Path $PSScriptRoot '..\public\assets\terrain\objects'
New-Item -ItemType Directory -Force -Path $output | Out-Null

$assets = @{
  'healing-fountain' = 'exec-bc8b4578-5674-4cf0-98da-04c9fb7e04ca.png'
  'healing-lake' = 'exec-60620834-f40c-436b-9759-cac34d2ed667.png'
  'boss-chain-gate' = 'exec-b7533cfc-a8d4-4a68-95dc-983b74b0dcf2.png'
}

Copy-Item -LiteralPath (Join-Path $generated 'exec-64db813c-a4bd-4171-8579-33c746c0c9ec.png') `
  -Destination (Join-Path $output 'midboss-floor-7x7.png') -Force

foreach ($name in $assets.Keys) {
  $source = Join-Path $generated $assets[$name]
  $target = Join-Path $output "$name.png"
  & $python $removeKey --input $source --out $target --auto-key border --soft-matte --transparent-threshold 18 --opaque-threshold 150 --despill --edge-contract 1 --force
  if ($LASTEXITCODE -ne 0) { throw "Failed to prepare $name" }
}

& $python (Join-Path $PSScriptRoot 'crop-transparent-assets.py') $output
if ($LASTEXITCODE -ne 0) { throw 'Failed to crop prepared assets' }
