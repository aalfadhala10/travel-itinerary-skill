#!/usr/bin/env python3
"""TP-002 — the TP-001 documents as scans, to exercise the OCR path.

Every page is rasterised into an image-only PDF: no text layer at all, which
is what a real scanned tender package looks like.

Run make_testpack.py first.

    python tests/fixtures/make_scanned.py

The English documents should survive OCR well enough to produce the same
findings. The Arabic minutes should not — Tesseract cannot read Arabic-Indic
numerals, and the point of keeping this fixture is to prove the tool refuses
those values rather than guessing at them.
"""
from __future__ import annotations

import pathlib

import fitz

SRC = pathlib.Path(__file__).parent / "testpack"
OUT = pathlib.Path(__file__).parent / "scanned"
DPI = 200                      # a mid-range office scanner


def rasterise(src: pathlib.Path, dst: pathlib.Path) -> tuple[int, int]:
    doc = fitz.open(src)
    out = fitz.open()
    for page in doc:
        pm = page.get_pixmap(dpi=DPI)
        new = out.new_page(width=page.rect.width, height=page.rect.height)
        new.insert_image(new.rect, pixmap=pm)
    out.save(dst, deflate=True, garbage=4)
    n = len(out)
    out.close(); doc.close()

    check = fitz.open(dst)
    residual = sum(len(p.get_text().strip()) for p in check)
    check.close()
    return n, residual


def main() -> int:
    if not SRC.exists():
        print(f"missing {SRC} — run make_testpack.py first")
        return 2
    OUT.mkdir(exist_ok=True)

    total_pages = 0
    for src in sorted(SRC.glob("*.pdf")):
        dst = OUT / src.name
        pages, residual = rasterise(src, dst)
        total_pages += pages
        status = "OK" if residual == 0 else f"FAIL residual text {residual}"
        print(f"  {src.name:38s} {pages}p  {dst.stat().st_size/1024:7.0f} KB  {status}")
        if residual:
            return 1

    # The BOQ stays a spreadsheet — scanning it would test nothing new and a
    # real package delivers it as a file anyway.
    xlsx = SRC / "05_BOQ.xlsx"
    if xlsx.exists():
        (OUT / xlsx.name).write_bytes(xlsx.read_bytes())
        print(f"  {xlsx.name:38s} copied unchanged (native spreadsheet)")

    print(f"\n{total_pages} page(s) rasterised at {DPI} dpi, no text layer left.")
    print(f"Review with:  python tools/construction-review/review.py {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
