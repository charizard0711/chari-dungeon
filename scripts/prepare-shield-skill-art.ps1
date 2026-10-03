param([string]$Manifest = (Join-Path $PSScriptRoot '../art/shield-skill-expansion-v1/generation.json'))
Add-Type -AssemblyName System.Drawing
$artManifest = Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
foreach ($asset in $artManifest.assets) {
  $target = Join-Path (Join-Path $PSScriptRoot '..') $asset.target
  New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
  $source = [System.Drawing.Image]::FromFile($asset.source)
  $bitmap = New-Object System.Drawing.Bitmap(256,256)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($source,0,0,256,256)
    $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    if ($bitmap.GetPixel(0,0).A -ne 0) { throw "Expected transparent corner: $target" }
  } finally { $graphics.Dispose(); $bitmap.Dispose(); $source.Dispose() }
}
Write-Output "Prepared $($artManifest.assets.Count) transparent game assets."
