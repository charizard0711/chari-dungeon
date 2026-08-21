param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [int]$Size,

  [switch]$PixelArt
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

if (-not ('GeneratedAssetProcessor' -as [type])) {
  $drawingAssembly = [System.Drawing.Bitmap].Assembly.Location
  $assemblyDirectory = Split-Path -Parent $drawingAssembly
  $gdiAssembly = Join-Path $assemblyDirectory 'System.Private.Windows.GdiPlus.dll'
  $windowsCoreAssembly = Join-Path $assemblyDirectory 'System.Private.Windows.Core.dll'
  $drawingPrimitivesAssembly = [System.Drawing.Rectangle].Assembly.Location
  Add-Type -ReferencedAssemblies $drawingAssembly, $gdiAssembly, $windowsCoreAssembly, $drawingPrimitivesAssembly -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class GeneratedAssetProcessor
{
    private static bool IsLightNeutral(byte[] pixels, int offset)
    {
        int b = pixels[offset];
        int g = pixels[offset + 1];
        int r = pixels[offset + 2];
        int min = Math.Min(r, Math.Min(g, b));
        int max = Math.Max(r, Math.Max(g, b));
        return min >= 180 && max - min <= 30;
    }

    private static void EnqueueBackground(
        int x,
        int y,
        int width,
        int height,
        int stride,
        byte[] pixels,
        bool[] background,
        int[] queue,
        ref int tail)
    {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        int index = y * width + x;
        if (background[index]) return;
        int offset = y * stride + x * 4;
        if (!IsLightNeutral(pixels, offset)) return;
        background[index] = true;
        queue[tail++] = index;
    }

    private static void EnqueueNeutral(
        int x,
        int y,
        int width,
        int height,
        int stride,
        byte[] pixels,
        bool[] seen,
        int[] queue,
        ref int tail)
    {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        int index = y * width + x;
        if (seen[index]) return;
        int offset = y * stride + x * 4;
        if (!IsLightNeutral(pixels, offset)) return;
        seen[index] = true;
        queue[tail++] = index;
    }

    public static void Process(string inputPath, string outputPath, int targetSize, bool pixelArt)
    {
        using (var original = new Bitmap(inputPath))
        using (var working = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(working))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.DrawImageUnscaled(original, 0, 0);
            }

            var rect = new Rectangle(0, 0, working.Width, working.Height);
            var data = working.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int stride = Math.Abs(data.Stride);
            byte[] pixels = new byte[stride * working.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);

            bool[] background = new bool[working.Width * working.Height];
            int[] queue = new int[background.Length];
            int head = 0;
            int tail = 0;

            for (int x = 0; x < working.Width; x++)
            {
                EnqueueBackground(x, 0, working.Width, working.Height, stride, pixels, background, queue, ref tail);
                EnqueueBackground(x, working.Height - 1, working.Width, working.Height, stride, pixels, background, queue, ref tail);
            }
            for (int y = 1; y < working.Height - 1; y++)
            {
                EnqueueBackground(0, y, working.Width, working.Height, stride, pixels, background, queue, ref tail);
                EnqueueBackground(working.Width - 1, y, working.Width, working.Height, stride, pixels, background, queue, ref tail);
            }

            while (head < tail)
            {
                int index = queue[head++];
                int x = index % working.Width;
                int y = index / working.Width;
                EnqueueBackground(x - 1, y, working.Width, working.Height, stride, pixels, background, queue, ref tail);
                EnqueueBackground(x + 1, y, working.Width, working.Height, stride, pixels, background, queue, ref tail);
                EnqueueBackground(x, y - 1, working.Width, working.Height, stride, pixels, background, queue, ref tail);
                EnqueueBackground(x, y + 1, working.Width, working.Height, stride, pixels, background, queue, ref tail);
            }

            // Remove large enclosed checkerboard regions, such as the opening
            // inside a trigger guard, without erasing small metal highlights.
            bool[] neutralSeen = (bool[])background.Clone();
            for (int seed = 0; seed < neutralSeen.Length; seed++)
            {
                if (neutralSeen[seed]) continue;
                int seedX = seed % working.Width;
                int seedY = seed / working.Width;
                int seedOffset = seedY * stride + seedX * 4;
                if (!IsLightNeutral(pixels, seedOffset)) continue;

                head = 0;
                tail = 0;
                int componentMinX = working.Width;
                int componentMinY = working.Height;
                int componentMaxX = -1;
                int componentMaxY = -1;
                EnqueueNeutral(seedX, seedY, working.Width, working.Height, stride, pixels, neutralSeen, queue, ref tail);

                while (head < tail)
                {
                    int index = queue[head++];
                    int x = index % working.Width;
                    int y = index / working.Width;
                    componentMinX = Math.Min(componentMinX, x);
                    componentMinY = Math.Min(componentMinY, y);
                    componentMaxX = Math.Max(componentMaxX, x);
                    componentMaxY = Math.Max(componentMaxY, y);
                    EnqueueNeutral(x - 1, y, working.Width, working.Height, stride, pixels, neutralSeen, queue, ref tail);
                    EnqueueNeutral(x + 1, y, working.Width, working.Height, stride, pixels, neutralSeen, queue, ref tail);
                    EnqueueNeutral(x, y - 1, working.Width, working.Height, stride, pixels, neutralSeen, queue, ref tail);
                    EnqueueNeutral(x, y + 1, working.Width, working.Height, stride, pixels, neutralSeen, queue, ref tail);
                }

                int componentWidth = componentMaxX - componentMinX + 1;
                int componentHeight = componentMaxY - componentMinY + 1;
                if (tail >= 600 && componentWidth >= 32 && componentHeight >= 32)
                {
                    for (int i = 0; i < tail; i++) background[queue[i]] = true;
                }
            }

            int minX = working.Width;
            int minY = working.Height;
            int maxX = -1;
            int maxY = -1;
            for (int y = 0; y < working.Height; y++)
            {
                for (int x = 0; x < working.Width; x++)
                {
                    int index = y * working.Width + x;
                    int offset = y * stride + x * 4;
                    if (background[index]) pixels[offset + 3] = 0;
                    if (pixels[offset + 3] > 8)
                    {
                        minX = Math.Min(minX, x);
                        minY = Math.Min(minY, y);
                        maxX = Math.Max(maxX, x);
                        maxY = Math.Max(maxY, y);
                    }
                }
            }

            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
            working.UnlockBits(data);

            if (maxX < minX || maxY < minY)
                throw new InvalidOperationException("No visible foreground remained after background removal.");

            var crop = Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
            int padding = Math.Max(4, (int)Math.Round(targetSize * 0.04));
            int available = targetSize - padding * 2;
            double scale = Math.Min((double)available / crop.Width, (double)available / crop.Height);
            int drawWidth = Math.Max(1, (int)Math.Round(crop.Width * scale));
            int drawHeight = Math.Max(1, (int)Math.Round(crop.Height * scale));
            int drawX = (targetSize - drawWidth) / 2;
            int drawY = (targetSize - drawHeight) / 2;

            using (var output = new Bitmap(targetSize, targetSize, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(output))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.SmoothingMode = pixelArt ? SmoothingMode.None : SmoothingMode.HighQuality;
                graphics.InterpolationMode = pixelArt ? InterpolationMode.NearestNeighbor : InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = pixelArt ? PixelOffsetMode.Half : PixelOffsetMode.HighQuality;
                graphics.DrawImage(
                    working,
                    new Rectangle(drawX, drawY, drawWidth, drawHeight),
                    crop,
                    GraphicsUnit.Pixel);
                output.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
'@
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$temporaryOutput = "$resolvedInput.prepared.tmp.png"

try {
  [GeneratedAssetProcessor]::Process($resolvedInput, $temporaryOutput, $Size, $PixelArt.IsPresent)
  Move-Item -LiteralPath $temporaryOutput -Destination $resolvedInput -Force
}
finally {
  if (Test-Path -LiteralPath $temporaryOutput) {
    Remove-Item -LiteralPath $temporaryOutput -Force
  }
}
