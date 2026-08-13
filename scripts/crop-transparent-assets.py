from pathlib import Path
import sys

from PIL import Image


root = Path(sys.argv[1])
max_edge = int(sys.argv[2]) if len(sys.argv) > 2 else None
square = len(sys.argv) > 3 and sys.argv[3].lower() == 'square'
for path in root.glob('*.png'):
    image = Image.open(path).convert('RGBA')
    bbox = image.getchannel('A').getbbox()
    if not bbox:
        raise RuntimeError(f'empty alpha: {path}')
    cropped = image.crop(bbox)
    pad = max(8, int(max(cropped.size) * 0.025))
    canvas = Image.new('RGBA', (cropped.width + pad * 2, cropped.height + pad * 2))
    canvas.alpha_composite(cropped, (pad, pad))
    if square:
        side = max(canvas.size)
        square_canvas = Image.new('RGBA', (side, side))
        square_canvas.alpha_composite(canvas, ((side - canvas.width) // 2, (side - canvas.height) // 2))
        canvas = square_canvas
    if max_edge and max(canvas.size) > max_edge:
        scale = max_edge / max(canvas.size)
        canvas = canvas.resize(
            (max(1, round(canvas.width * scale)), max(1, round(canvas.height * scale))),
            Image.Resampling.LANCZOS
        )
    canvas.save(path)
    corners = [canvas.getpixel(point)[3] for point in [
        (0, 0), (canvas.width - 1, 0), (0, canvas.height - 1), (canvas.width - 1, canvas.height - 1)
    ]]
    print(path.name, canvas.size, 'alpha-corners', corners)
