#!/usr/bin/env python3
"""Generate a CORRECTLY shaped Arabic PDF — real text shaping, no pre-processing.

Companion to make_testpack.py, which pre-shapes with arabic_reshaper because
reportlab has no shaping engine. That pre-shaping bakes presentation forms and
visual order into the file, so it cannot answer the question that matters:
does a *well-formed* Arabic PDF extract correctly?

It does not. This file proves it — zero presentation forms, renders perfectly,
and still yields reversed digits (120 -> 021). See docs/01 §10.2.
"""
import html, pathlib, weasyprint

OUT = pathlib.Path(__file__).parent
SOURCE = [
    "محضر اجتماع رقم ١٤ — اجتماع التنسيق الفني",
    "طلب الاستشاري توضيح موقف نظام التحكم في الدخول (Access Control)",
    "سماكة عزل السطح ١٢٠ مم في المواصفة بينما ٨٠ مم في جدول الأبواب",
]
EXPECTED_NUMBERS = ["١٤", "١٢٠", "٨٠"]

body = "".join(f"<p>{html.escape(l)}</p>" for l in SOURCE)
weasyprint.HTML(string=(
    '<html><head><meta charset="utf-8"><style>'
    '@page{size:A4;margin:20mm}'
    'body{font-family:"DejaVu Sans";font-size:12pt;direction:rtl;'
    'text-align:right;line-height:1.9}</style></head>'
    f'<body>{body}</body></html>')).write_pdf(OUT / "proper_arabic.pdf")
print(f"wrote {OUT/'proper_arabic.pdf'}")

try:
    import fitz
except ImportError:
    raise SystemExit("pymupdf not installed — cannot verify")

DIGITS = "٠١٢٣٤٥٦٧٨٩"
page = fitz.open(OUT / "proper_arabic.pdf")[0]
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

naive = ["".join(c["c"] for c in r) for r in runs]
geom = ["".join(c["c"] for c in sorted(r, key=lambda c: c["bbox"][0])) for r in runs]

print(f"\npresentation forms: {pf}  (a well-formed file has none)")
print(f"naive string read : {naive}   <- what text extraction gives")
print(f"geometric read    : {geom}   <- read by ascending x")
print(f"expected          : {EXPECTED_NUMBERS}")

assert pf == 0, "expected zero presentation forms"
assert geom == EXPECTED_NUMBERS, f"geometric read failed: {geom}"
assert naive != EXPECTED_NUMBERS, (
    "naive read now matches — the extractor changed behaviour.\n"
    "Re-check whether docs/01 §10.2 still describes reality before relaxing it.")
print("\nOK — geometric read recovers every number; naive read does not.")
