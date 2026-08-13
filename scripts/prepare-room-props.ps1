$ErrorActionPreference = 'Stop'

$python = 'C:\Users\masam\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$removeKey = 'C:\Users\masam\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
$generated = 'C:\Users\masam\.codex\generated_images\019ff176-a081-79c2-bdda-be0a27ee17f8'
$output = Join-Path $PSScriptRoot '..\public\assets\terrain\objects\room-props'
New-Item -ItemType Directory -Force -Path $output | Out-Null

$assets = @{
  'barrel' = 'exec-f6040937-49be-4bed-a183-2b5e6e5f32a4.png'
  'jar' = 'exec-af8d8a91-d677-4abc-9266-2ed040bac3cf.png'
  'crates' = 'exec-4d999f95-f495-438c-b011-0801277151f6.png'
  'weapon-rack' = 'exec-87767d30-029a-4d32-8213-d5c8f5d98488.png'
  'map-table' = 'exec-222ad11e-fbb2-4215-8596-666991355e0b.png'
  'cooking-pot' = 'exec-34152887-b198-4e6f-afa5-a4cc0486308b.png'
  'minecart' = 'exec-651533b8-ab6b-4eef-8249-ffbb73f63885.png'
  'bone-pile' = 'exec-0dd7118d-33a8-47b3-b223-68dfdac1cb98.png'
}

foreach ($name in $assets.Keys) {
  $source = Join-Path $generated $assets[$name]
  $target = Join-Path $output "$name.png"
  & $python $removeKey --input $source --out $target --auto-key border --soft-matte --transparent-threshold 18 --opaque-threshold 150 --despill --edge-contract 1 --force
  if ($LASTEXITCODE -ne 0) { throw "Failed to prepare $name" }
}

& $python (Join-Path $PSScriptRoot 'crop-transparent-assets.py') $output 256
if ($LASTEXITCODE -ne 0) { throw 'Failed to crop prepared room props' }
