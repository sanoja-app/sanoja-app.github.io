"""Regenerates the phone/home-screen icons for the flashcards page.

    python3 tools/icons/make_icons.py

Why separate files: the round "Fi" logo (icon128/192/512.png) has transparent corners.
iOS paints transparent areas of apple-touch-icon black, and Android adaptive icons are
cropped by a mask, so both want an opaque, full-bleed square with the mark well inside
the edge. Drawn at 1024px and downscaled so every size is crisp.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BLUE = (41, 98, 255)           # #2962ff, same as the logo
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
OUT = Path(__file__).resolve().parents[2] / "docs" / "assets"
S = 1024

def fit_font(draw, target_w):
    for size in range(100, 900):
        f = ImageFont.truetype(FONT, size)
        b = draw.textbbox((0, 0), "Fi", font=f)
        if b[2] - b[0] >= target_w:
            return f

def square(text_width_ratio):
    img = Image.new("RGB", (S, S), BLUE)          # RGB: no alpha channel at all
    d = ImageDraw.Draw(img)
    f = fit_font(d, S * text_width_ratio)
    b = d.textbbox((0, 0), "Fi", font=f)
    d.text(((S - (b[0] + b[2])) / 2, (S - (b[1] + b[3])) / 2), "Fi", font=f, fill=(255, 255, 255))
    return img

# iOS applies its own rounded mask to the full square; the mark can be fairly large.
square(0.52).resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png", optimize=True)
# Android maskable: keep everything inside the central 80% safe circle.
square(0.46).resize((512, 512), Image.LANCZOS).save(OUT / "icon-maskable-512.png", optimize=True)
print("wrote apple-touch-icon.png (180) and icon-maskable-512.png (512)")
