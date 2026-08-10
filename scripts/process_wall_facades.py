from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


FRAME_SIZE = 64
VARIANT_CENTERS = (0.20, 0.50, 0.80)


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bbox is None:
        raise ValueError("No opaque wall pixels found")
    return bbox


def crop_variant(
    image: Image.Image,
    bbox: tuple[int, int, int, int],
    center_fraction: float,
) -> Image.Image:
    left, top, right, bottom = bbox
    wall_width = right - left
    wall_height = bottom - top
    crop_width = min(wall_width, wall_height)
    center_x = left + int(wall_width * center_fraction)
    crop_left = max(left, min(right - crop_width, center_x - crop_width // 2))
    crop = image.crop((crop_left, top, crop_left + crop_width, bottom))
    return crop.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS)


def build_sheet(source: Path, output: Path) -> None:
    image = Image.open(source).convert("RGBA")
    bbox = alpha_bbox(image)
    sheet = Image.new("RGBA", (FRAME_SIZE * len(VARIANT_CENTERS), FRAME_SIZE))
    for index, center in enumerate(VARIANT_CENTERS):
        sheet.alpha_composite(crop_variant(image, bbox, center), (index * FRAME_SIZE, 0))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, optimize=True)
    print(f"{source.name}: bbox={bbox} -> {output}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create 3-frame wall-facade sheets from transparent ImageGen sources.")
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    for era in range(1, 5):
        build_sheet(
            args.source_dir / f"era{era}-alpha.png",
            args.output_dir / f"wall-facade-era{era}.png",
        )


if __name__ == "__main__":
    main()
