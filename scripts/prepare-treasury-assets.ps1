param([Parameter(Mandatory=$true)][string]$SourceDirectory)
Add-Type -AssemblyName System.Drawing
$assetDirectory = Join-Path $PSScriptRoot '../public/assets/treasury'
New-Item -ItemType Directory -Path $assetDirectory -Force | Out-Null
$assets = @{
  'exec-042e5e72-b74c-4550-8284-369c76767ffa.png' = 'diamond-chest.png'
  'exec-ad015923-ed1d-4e7a-96e5-391b4ff461df.png' = 'diamond-chest-open.png'
  'exec-265121ac-5f57-4da6-8087-32693f9596ba.png' = 'golden-door.png'
  'exec-57cacc2b-ee48-4e50-941d-42a15cf4f210.png' = 'marble-floor.png'
  'exec-ddf301a5-0d9c-491c-9275-b15eb4670d35.png' = 'gilded-wall.png'
}
foreach ($asset in $assets.GetEnumerator()) {
  $source = [System.Drawing.Image]::FromFile((Join-Path $SourceDirectory $asset.Key))
  $bitmap = New-Object System.Drawing.Bitmap(256,256)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($source,0,0,256,256)
    $bitmap.Save((Join-Path $assetDirectory $asset.Value), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $graphics.Dispose(); $bitmap.Dispose(); $source.Dispose() }
}
Get-ChildItem -LiteralPath $assetDirectory | Select-Object Name,Length
