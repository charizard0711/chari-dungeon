param([string]$Manifest = (Join-Path $PSScriptRoot '../art/adventure-v1/generation.json'))
Add-Type -AssemblyName System.Drawing
$artManifest = Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
foreach ($asset in $artManifest.assets) {
  $target = Join-Path (Join-Path $PSScriptRoot '..') $asset.target
  New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
  $source = [System.Drawing.Image]::FromFile($asset.source)
  $limit = if ($asset.key -eq 'ending_dawn') { 1600 } elseif ($asset.key -like 'fx_*') { 768 } else { 384 }
  $ratio = $limit / [Math]::Max($source.Width,$source.Height)
  $width = [int][Math]::Round($source.Width * $ratio)
  $height = [int][Math]::Round($source.Height * $ratio)
  $bitmap = New-Object System.Drawing.Bitmap($width,$height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($source,0,0,$width,$height)
    $bitmap.Save($target,[System.Drawing.Imaging.ImageFormat]::Png)
    if ($asset.transparent -and $bitmap.GetPixel(0,0).A -gt 2) { throw "Expected transparent corner: $target" }
  } finally { $graphics.Dispose(); $bitmap.Dispose(); $source.Dispose() }
}
Write-Output "Prepared $($artManifest.assets.Count) painted adventure assets."
