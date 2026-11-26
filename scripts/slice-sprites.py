#!/usr/bin/env python3
"""
Slice ChatGPT 3x2 sprite sheets (1536x1024, transparent PNG) into individual
cutouts for /public/images/*.webp, trimmed to content and padded to a square.

  python3 scripts/slice-sprites.py <folder-with-sheet-pngs>

Sheets are matched to SHEETS below by file order (sorted by name), or by
renaming them sheet1.png … sheet7.png. The hero banner is any file whose
name contains "hero".
"""
import re
import sys
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

SHEETS = [
    ["cat-kirana", "cat-saree", "cat-footwear", "cat-mobile", "cat-mithai", "cat-medical"],
    ["cat-hardware", "cat-salon", "cat-jewel", "cat-stationery", "promo-hot-deals", "promo-new-shops"],
    ["p-paithani", "p-cotton-saree", "p-kurti-set", "p-kids-lehenga", "p-mens-kurta", "p-nauvari"],
    ["p-kaju-katli", "p-ladoo-box", "p-jalebi", "p-mithai-box", "p-kirana-combo", "p-whole-spices"],
    ["p-kolhapuri", "p-handbag", "p-phone-covers", "p-tempered-glass", "p-led-pack", "p-power-bank"],
    ["p-kundan-set", "p-bangles", "p-school-kit", "p-notebooks", "p-medicine-strips", "p-facial-kit"],
    ["p-tool-kit", "p-bridal-saree", "p-black-sandals", "p-bread", "p-masala-pack", "p-dal-rice"],
]
OUT = Path(__file__).resolve().parent.parent / "public" / "images"
CELL_OUT = 640  # final square size
PAD = 0.06      # breathing room around trimmed content


def cutout(cell: Image.Image) -> Image.Image:
    cell = cell.convert("RGBA")
    arr = np.array(cell)
    if arr[..., 3].min() == 255:
        # Opaque sheet: remove only background that is CONNECTED to the cell edge
        # (flood fill), so white objects inside (bottles, cream jars) survive.
        rgb = arr[..., :3].astype(int)
        border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
        bg = np.median(border, axis=0)
        near = np.abs(rgb - bg).sum(axis=2) < 22
        labels, _ = ndimage.label(near)
        edge_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
        bgmask = np.isin(labels, edge_labels[edge_labels > 0])
        bgmask = ndimage.binary_dilation(bgmask, iterations=1)
        arr[..., 3] = np.where(bgmask, 0, 255).astype(np.uint8)
        cell = Image.fromarray(arr, "RGBA")
    # Drop stray fragments bleeding in from neighbouring cells: keep components ≥ 4% of the largest.
    arr = np.array(cell)
    solid = arr[..., 3] > 18
    lab, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz >= sizes.max() * 0.04])
        arr[..., 3] = np.where(keep, arr[..., 3], 0)
        cell = Image.fromarray(arr, "RGBA")
    alpha = cell.getchannel("A")
    box = alpha.point(lambda v: 255 if v > 18 else 0).getbbox()
    if not box:
        raise ValueError("empty cell")
    obj = cell.crop(box)
    side = int(max(obj.size) * (1 + PAD * 2))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(obj, ((side - obj.width) // 2, side - obj.height - int(side * PAD)), obj)  # bottom-weighted
    return canvas.resize((CELL_OUT, CELL_OUT), Image.LANCZOS)


def main(folder: str) -> None:
    src = Path(folder)
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in src.iterdir() if p.suffix.lower() in {".png", ".webp", ".jpg", ".jpeg"})
    hero = [p for p in files if "hero" in p.name.lower()]
    sheets = [p for p in files if p not in hero]
    written = []
    def slot(path: Path, fallback: int) -> int:
        m = re.search(r"sheet[_\s-]?(\d)", path.stem.lower())
        return int(m.group(1)) - 1 if m else fallback
    for order, path in enumerate(sheets):
        i = slot(path, order)
        if not 0 <= i < len(SHEETS):
            continue
        img = Image.open(path)
        w, h = img.size
        cw, ch = w // 3, h // 2
        for idx, name in enumerate(SHEETS[i]):
            col, row = idx % 3, idx // 3
            cell = img.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
            out = OUT / f"{name}.webp"
            cutout(cell).save(out, "WEBP", quality=88, method=6)
            written.append(out)
    for path in hero:
        img = Image.open(path).convert("RGBA")
        out = OUT / "hero-lagna.webp"
        img.save(out, "WEBP", quality=86, method=6)
        written.append(out)
    for p in written:
        kb = p.stat().st_size / 1024
        flag = "" if kb > 15 else "  ⚠ small"
        print(f"✓ {p.name:28s} {kb:6.0f} KB{flag}")
    print(f"\n{len(written)} images → {OUT}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
