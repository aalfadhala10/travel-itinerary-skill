#!/usr/bin/env python3
"""Arabic PDFs from two independent producers — both reverse digits.

Companion to make_testpack.py, which pre-shapes with arabic_reshaper because
reportlab has no shaping engine. That pre-shaping bakes presentation forms and
visual order into the file, so it cannot answer the question that matters:
does a *well-formed* Arabic PDF extract correctly?

It does not — and this is not a quirk of one library. Two producers sharing no
code are tested here:

    WeasyPrint  ->  clean word order, digits reversed
    Chromium    ->  scrambled segment order, digits reversed

Both emit zero presentation forms and both render perfectly. The digits come
out backwards regardless: 120 becomes 021, and nothing about it looks wrong.

Chromium is the one that matters — real Arabic project documents come from
Word, Chrome and InDesign, not from Python. See docs/01 §10.2.
"""
from __future__ import annotations

import html
import pathlib
import shutil
import subprocess

OUT = pathlib.Path(__file__).parent
DIGITS = "٠١٢٣٤٥٦٧٨٩"

SOURCE = [
    "محضر اجتماع رقم ١٤ — اجتماع التنسيق الفني",
    "سماكة عزل السطح ١٢٠ مم في المواصفة بينما ٨٠ مم في جدول الأبواب",
    "طلب الاستشاري توضيح موقف نظام التحكم في الدخول (Access Control)",
    "عدد الكاميرات المطلوب هو ٢٤ كاميرا",
]
EXPECTED = ["١٤", "١٢٠", "٨٠", "٢٤"]

CHROME_CANDIDATES = [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    shutil.which("chromium"), shutil.which("chromium-browser"),
    shutil.which("google-chrome"),
]

PAGE = (
    '<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>'
    '@page{size:A4;margin:20mm}'
    'html,body{direction:rtl;font-family:"DejaVu Sans",sans-serif;'
    'font-size:14pt;line-height:2}</style></head><body>'
    + "".join(f"<p>{html.escape(l)}</p>" for l in SOURCE)
    + "</body></html>")


def build_weasyprint(path: pathlib.Path) -> bool:
    try:
        import weasyprint
    except ImportError:
        print("  weasyprint not installed — skipped")
        return False
    weasyprint.HTML(string=PAGE).write_pdf(path)
    return True


def build_chromium(path: pathlib.Path) -> bool:
    exe = next((c for c in CHROME_CANDIDATES if c and pathlib.Path(c).exists()), None)
    if not exe:
        print("  chromium not found — skipped")
        return False
    src = OUT / "_chrome_input.html"
    src.write_text(PAGE, encoding="utf-8")
    try:
        subprocess.run([exe, "--headless", "--disable-gpu", "--no-sandbox",
                        "--no-pdf-header-footer", f"--print-to-pdf={path}",
                        f"file://{src.resolve()}"],
                       check=True, capture_output=True, timeout=120)
    finally:
        src.unlink(missing_ok=True)
    return True


def digit_runs(path: pathlib.Path):
    """(presentation-form count, [(naive read, geometric read)] per digit run)."""
    import fitz
    page = fitz.open(path)[0]
    chars = [c for b in page.get_text("rawdict")["blocks"]
             for ln in b.get("lines", []) for sp in ln["spans"] for c in sp["chars"]]
    pf = sum(1 for c in chars if 0xFB50 <= ord(c["c"]) <= 0xFEFF)

    runs, cur = [], []
    for c in chars:
        if c["c"] in DIGITS:
            cur.append(c)
        elif cur:
            runs.append(cur); cur = []
    if cur:
        runs.append(cur)

    return pf, [("".join(c["c"] for c in r),
                 "".join(c["c"] for c in sorted(r, key=lambda c: c["bbox"][0])))
                for r in runs]


def main() -> int:
    producers = [("weasyprint", "proper_arabic.pdf", build_weasyprint),
                 ("chromium", "chrome_arabic.pdf", build_chromium)]
    built = []
    for name, fname, fn in producers:
        print(f"building {fname} ({name})")
        if fn(OUT / fname):
            built.append((name, OUT / fname))

    if not built:
        print("\nno producer available — cannot verify")
        return 2
    try:
        import fitz  # noqa: F401
    except ImportError:
        print("\npymupdf not installed — generated but unverified")
        return 0

    failures = []
    for name, path in built:
        pf, runs = digit_runs(path)
        got = [g for _, g in runs]
        flipped = sum(1 for n, g in runs if n != g)
        print(f"\n{name}  ({path.name})")
        print(f"  presentation forms : {pf}")
        print(f"  naive read         : {[n for n, _ in runs]}")
        print(f"  geometric read     : {got}")
        print(f"  runs reversed      : {flipped}/{len(runs)}")

        # Values must all be recovered. Their ORDER is a separate matter:
        # Chromium emits a line's segments scrambled, so 120 and 80 arrive
        # swapped. Each value is correct, but "120 in the spec, 80 in the
        # schedule" can bind the wrong number to the wrong source. Context
        # must therefore be resolved geometrically too, never by sequence.
        if sorted(got) != sorted(EXPECTED):
            failures.append(f"{name}: values {got} != {EXPECTED} (as a set)")
        elif got != EXPECTED:
            print(f"  ORDER SCRAMBLED    : values correct, sequence differs "
                  f"— context must be bound by position, not order")
        if flipped == 0:
            failures.append(
                f"{name}: naive read now matches — this producer stopped "
                f"reversing digits. Re-check docs/01 §10.2 against reality "
                f"before relaxing anything.")

    if failures:
        print("\nFAILED")
        for f in failures:
            print(f"  {f}")
        return 1

    print(f"\nOK — {len(built)} independent producer(s), digits reversed in all, "
          f"geometric read recovers every value.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
