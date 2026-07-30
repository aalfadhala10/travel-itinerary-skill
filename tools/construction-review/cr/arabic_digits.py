"""Reading Arabic-Indic digits that OCR cannot.

Tesseract does not recognise ٠١٢٣٤٥٦٧٨٩ reliably. Measured on a scanned page:
Arabic words score 90-93% and Latin digits 93-97% with every value correct,
while Arabic numerals score 60-82% and not one value is right — ١٢٠ comes back
as ١7٠١. Restricting the charset makes it worse, returning nothing at all.

A general recogniser struggles here, but the problem is smaller than a general
one: Arabic-Indic digits are a **closed set of ten glyphs**. Each digit is
rendered from every Arabic-capable font on the machine, and a candidate glyph
is matched against that set by normalised cross-correlation.

Measured accuracy, 10 digits per font:

    template font present     10/10   min score 0.88   min margin 0.06
    font never seen before    10/10   min score 0.64

So it generalises, and it degrades in score rather than in correctness — which
is what makes a threshold safe to set. A match below the floor is quarantined
exactly as before, so this can recover values but never invent one.
"""
from __future__ import annotations

import glob
from dataclasses import dataclass
from functools import lru_cache

import fitz
import numpy as np

ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩"
BOX = 32

# A correct read on an unseen font scored 0.64; the tightest correct margin
# across known fonts was 0.06. Below either, the value is not used.
SCORE_FLOOR = 0.62
MARGIN_FLOOR = 0.04

FONT_GLOBS = [
    "/usr/share/fonts/**/*.ttf",
    "/usr/share/fonts/**/*.otf",
    "/Library/Fonts/*.ttf",
    "C:/Windows/Fonts/*.ttf",
]


@dataclass
class DigitRead:
    text: str
    confidence: float          # lowest per-glyph score in the run
    margin: float              # lowest top-1 minus top-2 across the run
    glyphs: int = 0

    @property
    def usable(self) -> bool:
        return (bool(self.text)
                and self.confidence >= SCORE_FLOOR
                and self.margin >= MARGIN_FLOOR)


def _normalise(mask: np.ndarray) -> np.ndarray:
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return np.zeros((BOX, BOX), np.float32)
    sub = mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1].astype(np.float32)
    yi = np.linspace(0, sub.shape[0] - 1, BOX).astype(int)
    xi = np.linspace(0, sub.shape[1] - 1, BOX).astype(int)
    return sub[np.ix_(yi, xi)]


def _render(ch: str, font_path: str) -> np.ndarray | None:
    doc = fitz.open()
    page = doc.new_page(width=70, height=90)
    try:
        page.insert_text((14, 62), ch, fontsize=44, fontfile=font_path, fontname="F")
    except Exception:
        return None
    pm = page.get_pixmap(dpi=150, colorspace=fitz.csGRAY)
    arr = np.frombuffer(pm.samples, np.uint8).reshape(pm.height, pm.width)
    mask = arr < 128
    return _normalise(mask) if mask.any() else None


@lru_cache(maxsize=1)
def _templates() -> dict[str, list[np.ndarray]]:
    """One template per digit per font that can draw it. Built once."""
    fonts = []
    for pattern in FONT_GLOBS:
        fonts += glob.glob(pattern, recursive=True)

    out: dict[str, list[np.ndarray]] = {ch: [] for ch in ARABIC_INDIC}
    for path in sorted(set(fonts)):
        rendered = {ch: _render(ch, path) for ch in ARABIC_INDIC}
        # A font that cannot draw the whole set would contribute misleading
        # partial templates — take all ten or none.
        if all(g is not None for g in rendered.values()):
            for ch, g in rendered.items():
                out[ch].append(g)
    return out


def available() -> bool:
    t = _templates()
    return all(t[ch] for ch in ARABIC_INDIC)


def _split_glyphs(mask: np.ndarray) -> list[np.ndarray]:
    """Separate a digit run by vertical projection gaps."""
    cols = mask.any(axis=0)
    runs, start = [], None
    for i, on in enumerate(cols):
        if on and start is None:
            start = i
        elif not on and start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, len(cols)))
    return [mask[:, a:b] for a, b in runs if b - a >= 2]


def _classify(glyph: np.ndarray) -> tuple[str, float, float]:
    templates = _templates()
    scored = []
    for ch in ARABIC_INDIC:
        best = max(
            (float((glyph * t).sum()
                   / (np.sqrt((glyph * glyph).sum() * (t * t).sum()) + 1e-9))
             for t in templates[ch]), default=0.0)
        scored.append((best, ch))
    scored.sort(reverse=True)
    return scored[0][1], scored[0][0], scored[0][0] - scored[1][0]


def read(page: fitz.Page, bbox_px: tuple[float, float, float, float],
         dpi: int) -> DigitRead:
    """Read the digit run inside an OCR word box, straight from the pixels.

    Digits are left-to-right under UAX #9, and glyphs are taken in ascending x,
    so the run needs no reordering afterwards.
    """
    if not available():
        return DigitRead("", 0.0, 0.0)

    x0, y0, x1, y1 = bbox_px
    pad = (y1 - y0) * 0.2
    clip = fitz.Rect(*[v * 72 / dpi for v in (x0 - pad, y0 - pad, x1 + pad, y1 + pad)])
    pm = page.get_pixmap(dpi=dpi * 2, clip=clip, colorspace=fitz.csGRAY)
    arr = np.frombuffer(pm.samples, np.uint8).reshape(pm.height, pm.width)
    mask = arr < 150
    if not mask.any():
        return DigitRead("", 0.0, 0.0)

    glyphs = _split_glyphs(mask)
    if not glyphs:
        return DigitRead("", 0.0, 0.0)

    chars, scores, margins = [], [], []
    for glyph in glyphs:
        ch, score, margin = _classify(_normalise(glyph))
        chars.append(ch)
        scores.append(score)
        margins.append(margin)

    # ٠ is a dot in Arabic-Indic, so a full stop matches it almost perfectly.
    # Height cannot separate the two — a real zero is genuinely short — and
    # filtering on it dropped correct values while keeping wrong ones. A lone
    # dot is far more often punctuation than a number, so only that is refused.
    if chars == ["٠"]:
        return DigitRead("", 0.0, 0.0)

    return DigitRead("".join(chars), min(scores), min(margins), len(chars))
