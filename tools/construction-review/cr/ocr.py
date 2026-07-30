"""OCR for scanned pages — Tesseract, offline.

Behind a provider interface so the engine can be swapped without touching
callers. Nothing here reaches the network.

A measured limit shapes the whole module. On the same scanned page:

    Latin digits         100, 120, 300      conf 93-97   every value correct
    Arabic-Indic digits  ١٤ ١٢٠ ٨٠ ٢٤       conf 60-82   not one value correct

Four Tesseract configurations were tried (ara, ara+eng, psm 4, psm 6, digit
blacklist). None read a single Arabic numeral correctly: ١٢٠ came back as
١7٠١, ٨٠ as 8٠١. Arabic *words* score 90-93% on the same page, so the text is
usable and the numbers are not.

The confidence signal is the saving grace, and the difference from the digital
PDF path is worth naming: there, a reversed digit arrives at full confidence
with nothing to flag it. Here the engine tells us it is unsure. So Arabic
numerals from OCR are quarantined rather than guessed at — they never reach a
comparison, they go to a human with the page image.
"""
from __future__ import annotations

import csv
import io
import shutil
import subprocess
from dataclasses import dataclass, field
from typing import Protocol

ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩"
ARABIC_RANGE = (0x0600, 0x06FF)

# Below this, a word is not used to build anything (docs/01 §14).
WORD_CONFIDENCE_FLOOR = 0.55
# Arabic numerals never clear any bar — see the module docstring.
ARABIC_NUMERAL_POLICY = "quarantine"


@dataclass
class OCRWord:
    text: str
    bbox: tuple[float, float, float, float]
    confidence: float                       # 0..1
    line_id: tuple[int, int, int] = (0, 0, 0)

    @property
    def is_arabic(self) -> bool:
        return any(ARABIC_RANGE[0] <= ord(c) <= ARABIC_RANGE[1] for c in self.text)

    @property
    def has_arabic_numeral(self) -> bool:
        return any(c in ARABIC_INDIC for c in self.text)


@dataclass
class OCRLine:
    text: str
    bbox: tuple[float, float, float, float]
    confidence: float
    numeric_reliable: bool = True           # False -> values here are not usable


@dataclass
class OCRResult:
    lines: list[OCRLine] = field(default_factory=list)
    words: list[OCRWord] = field(default_factory=list)
    mean_confidence: float = 0.0
    languages: list[str] = field(default_factory=list)
    quarantined_numerals: int = 0
    engine: str = ""

    @property
    def text(self) -> str:
        return "\n".join(l.text for l in self.lines)


class OCRProvider(Protocol):
    name: str

    def available(self) -> bool: ...
    def recognize(self, png: bytes, langs: list[str]) -> OCRResult: ...


class TesseractProvider:
    """Offline. Requires: apt-get install tesseract-ocr tesseract-ocr-ara."""

    name = "tesseract"

    def __init__(self, psm: int = 6):
        self.psm = psm
        self._exe = shutil.which("tesseract")

    def available(self) -> bool:
        return self._exe is not None

    def installed_languages(self) -> set[str]:
        if not self._exe:
            return set()
        out = subprocess.run([self._exe, "--list-langs"],
                             capture_output=True, text=True).stdout
        return {l.strip() for l in out.splitlines()[1:] if l.strip()}

    def recognize(self, png: bytes, langs: list[str]) -> OCRResult:
        if not self._exe:
            raise RuntimeError("tesseract not installed")
        have = self.installed_languages()
        use = [l for l in langs if l in have] or ["eng"]

        proc = subprocess.run(
            [self._exe, "stdin", "stdout", "-l", "+".join(use),
             "--psm", str(self.psm), "tsv"],
            input=png, capture_output=True, timeout=300)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.decode(errors="replace")[:400])

        rows = csv.DictReader(io.StringIO(proc.stdout.decode("utf-8", "replace")),
                              delimiter="\t", quoting=csv.QUOTE_NONE)
        words: list[OCRWord] = []
        for r in rows:
            text = (r.get("text") or "").strip()
            conf = float(r.get("conf") or -1)
            if not text or conf < 0:
                continue
            words.append(OCRWord(
                text=text,
                bbox=(float(r["left"]), float(r["top"]),
                      float(r["left"]) + float(r["width"]),
                      float(r["top"]) + float(r["height"])),
                confidence=conf / 100.0,
                line_id=(int(r["block_num"]), int(r["par_num"]), int(r["line_num"]))))

        return self._assemble(words, use)

    def _assemble(self, words: list[OCRWord], langs: list[str]) -> OCRResult:
        # languages here are the ones DETECTED, not the ones requested —
        # asking for ara+eng must not make every page bilingual.
        res = OCRResult(engine=self.name)
        kept = [w for w in words if w.confidence >= WORD_CONFIDENCE_FLOOR]
        if not kept:
            return res

        grouped: dict[tuple, list[OCRWord]] = {}
        for w in kept:
            grouped.setdefault(w.line_id, []).append(w)

        for _, ws in grouped.items():
            # Tesseract returns Arabic words already in reading order, so the
            # TSV sequence is the logical one — do not re-sort by x here.
            quarantined = [w for w in ws if w.has_arabic_numeral]
            res.quarantined_numerals += len(quarantined)
            res.lines.append(OCRLine(
                text=" ".join(w.text for w in ws),
                bbox=(min(w.bbox[0] for w in ws), min(w.bbox[1] for w in ws),
                      max(w.bbox[2] for w in ws), max(w.bbox[3] for w in ws)),
                confidence=sum(w.confidence for w in ws) / len(ws),
                numeric_reliable=not quarantined))

        res.words = kept
        res.mean_confidence = sum(w.confidence for w in kept) / len(kept)
        detected = set()
        if any(w.is_arabic for w in kept):
            detected.add("ara")
        if any(any(c.isascii() and c.isalpha() for c in w.text) for w in kept):
            detected.add("eng")
        res.languages = sorted(detected)
        return res


_DEFAULT: OCRProvider | None = None


def default_provider() -> OCRProvider:
    global _DEFAULT
    if _DEFAULT is None:
        _DEFAULT = TesseractProvider()
    return _DEFAULT


# ── tables from a scan ───────────────────────────────────────────────────
# A scanned page has no PDF table structure, so find_tables() returns nothing
# and a door schedule silently disappears — the most valuable content in the
# package, dropped without a word. Columns are recovered the same way §7.2
# specifies for digital tables: by geometry.

TABLE_HEADER_HINTS = {"mark", "ref", "tag", "item", "description", "qty",
                      "quantity", "unit", "rate", "amount", "type", "size",
                      "location", "rating", "remarks"}


def _rows_by_y(words: list[OCRWord], tolerance: float = 0.6) -> list[list[OCRWord]]:
    """Cluster words into visual rows by vertical overlap."""
    rows: list[list[OCRWord]] = []
    for w in sorted(words, key=lambda w: w.bbox[1]):
        h = w.bbox[3] - w.bbox[1]
        placed = False
        for row in rows:
            ref = row[0]
            if abs(w.bbox[1] - ref.bbox[1]) <= h * tolerance:
                row.append(w)
                placed = True
                break
        if not placed:
            rows.append([w])
    for row in rows:
        row.sort(key=lambda w: w.bbox[0])
    return rows


def reconstruct_table(words: list[OCRWord]) -> tuple[list[str], list[list[str]]] | None:
    """Recover a table from OCR word boxes. None if no header row is found."""
    rows = _rows_by_y(words)

    header_idx = None
    for i, row in enumerate(rows):
        tokens = {w.text.lower().strip(":") for w in row}
        if len(row) >= 4 and len(tokens & TABLE_HEADER_HINTS) >= 3:
            header_idx = i
            break
    if header_idx is None:
        return None

    header_row = rows[header_idx]
    # A header is a phrase, not a word: "Fire Rated" and "Size (mm)" are one
    # column each. Split on gaps wider than a word height — the space inside a
    # phrase is far narrower than the space between columns.
    heights = [w.bbox[3] - w.bbox[1] for w in header_row]
    gap_limit = (sum(heights) / len(heights)) * 0.9

    groups: list[list[OCRWord]] = [[header_row[0]]]
    for prev, w in zip(header_row, header_row[1:]):
        (groups.append([w]) if w.bbox[0] - prev.bbox[2] > gap_limit
         else groups[-1].append(w))

    headers = [" ".join(w.text for w in g) for g in groups]
    edges = [(g[0].bbox[0], g[-1].bbox[2]) for g in groups]
    # Boundaries sit between the groups' facing edges, not their centres —
    # a column's data is often wider than its heading.
    bounds = ([-1e9]
              + [(a[1] + b[0]) / 2 for a, b in zip(edges, edges[1:])]
              + [1e9])

    def to_columns(row: list[OCRWord]) -> list[str]:
        cells = [[] for _ in headers]
        for w in row:
            centre = (w.bbox[0] + w.bbox[2]) / 2
            for c in range(len(headers)):
                if bounds[c] <= centre < bounds[c + 1]:
                    cells[c].append(w.text)
                    break
        # Empty cells stay empty strings — never dropped (docs/01 §7.2).
        return [" ".join(c).strip() for c in cells]

    body: list[list[str]] = []
    for row in rows[header_idx + 1:]:
        cells = to_columns(row)
        filled = sum(1 for c in cells if c)
        if filled == 0:
            continue
        # A wrapped fragment ("x" from "1000 x 2100") lands on its own visual
        # row; fold it back into the row above rather than emitting a stub.
        if filled < 2 and body:
            body[-1] = [f"{a} {b}".strip() if b else a
                        for a, b in zip(body[-1], cells)]
            continue
        body.append(cells)
    return (headers, body) if body else None


def scan_quality(pixmap) -> float:
    """Rough legibility score from ink distribution. Feeds Health Check."""
    samples = pixmap.samples
    if not samples:
        return 0.0
    dark = sum(1 for v in samples if v < 100)
    mid = sum(1 for v in samples if 100 <= v < 200)
    total = len(samples)
    ink = dark / total
    # A clean scan is mostly white with crisp dark text and little grey mush.
    if ink < 0.002:
        return 0.15                                   # nearly blank
    return max(0.0, min(1.0, 1.0 - (mid / total) * 4))
