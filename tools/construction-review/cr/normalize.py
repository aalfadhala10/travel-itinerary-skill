"""Normalisation — units, numbers, tags, Arabic text, and term synonyms.

Nothing here talks to a network. Everything is deterministic: the same input
always produces the same output, which is what lets a finding be reproduced.
"""
from __future__ import annotations

import re
import unicodedata

# ── units ────────────────────────────────────────────────────────────────
# Everything reduces to a base so 10 cm and 100 mm compare equal.
LENGTH_MM = {"mm": 1.0, "millimetre": 1.0, "millimeter": 1.0,
             "cm": 10.0, "centimetre": 10.0, "centimeter": 10.0,
             "m": 1000.0, "metre": 1000.0, "meter": 1000.0}
TIME_MIN = {"minute": 1.0, "minutes": 1.0, "min": 1.0, "mins": 1.0,
            "hour": 60.0, "hours": 60.0, "hr": 60.0}

ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩"
ARABIC_UNITS = {"مم": ("mm", "length"), "سم": ("cm", "length"),
                "متر": ("m", "length"), "دقيقة": ("minutes", "time"),
                "دقائق": ("minutes", "time"), "ساعة": ("hours", "time")}


def to_si(value: float, unit: str) -> tuple[float | None, str | None]:
    """Reduce a measurement to (base value, dimension). Unknown unit -> (None, None)."""
    u = (unit or "").lower().strip().rstrip(".")
    if u in LENGTH_MM:
        return value * LENGTH_MM[u], "length"
    if u in TIME_MIN:
        return value * TIME_MIN[u], "time"
    return None, None


# ── numbers ──────────────────────────────────────────────────────────────
def arabic_digits_to_latin(text: str) -> str:
    return text.translate(str.maketrans(ARABIC_INDIC, "0123456789"))


def parse_number(raw: str) -> float | None:
    s = arabic_digits_to_latin(raw).replace(",", "").replace("٫", ".").strip()
    try:
        return float(s)
    except ValueError:
        return None


MEASURE_RE = re.compile(
    r"(?P<num>[\d٠-٩][\d٠-٩,٫.]*)\s*"
    r"(?P<unit>mm|cm|m(?![a-z])|minutes?|mins?|hours?|hr|مم|سم|متر|دقيقة|دقائق|ساعة)",
    re.IGNORECASE)


def find_measures(text: str) -> list[dict]:
    """Every measurement in a string, with its base value for comparison."""
    out = []
    for m in MEASURE_RE.finditer(text):
        val = parse_number(m.group("num"))
        if val is None:
            continue
        unit = m.group("unit")
        if unit in ARABIC_UNITS:
            unit = ARABIC_UNITS[unit][0]
        si, dim = to_si(val, unit)
        if si is None:
            continue
        out.append({"raw": m.group(0), "value": val, "unit": unit.lower(),
                    "si": si, "dimension": dim, "span": m.span()})
    return out


FIRE_RATING_RE = re.compile(r"\bFR\s*[-/]?\s*(\d{2,3})\b", re.IGNORECASE)


def find_fire_rating(text: str) -> float | None:
    """FR60 / FR-60 / 60 minutes -> minutes. Returns None if absent."""
    m = FIRE_RATING_RE.search(text)
    if m:
        return float(m.group(1))
    for meas in find_measures(text):
        if meas["dimension"] == "time":
            return meas["si"]
    return None


# ── element tags ─────────────────────────────────────────────────────────
TAG_RE = re.compile(r"\b([A-Z]{1,4})[\s\-_]?(\d{1,4}[A-Z]?)\b")


def normalize_tag(raw: str) -> str | None:
    """D101 / D 101 / d-101 -> D-101.

    Only separators and case are unified. Suffixes are preserved, so D-101A
    stays distinct from D-101 — merging those two silently corrupts every
    check downstream.
    """
    m = TAG_RE.search((raw or "").strip().upper())
    return f"{m.group(1)}-{m.group(2)}" if m else None


# ── Arabic ───────────────────────────────────────────────────────────────
PRESENTATION_FORMS = ((0xFB50, 0xFDFF), (0xFE70, 0xFEFF))
TATWEEL = "ـ"
DIACRITICS = re.compile(r"[ً-ٰٟ]")


def presentation_form_ratio(text: str) -> float:
    if not text:
        return 0.0
    n = sum(1 for c in text
            if any(lo <= ord(c) <= hi for lo, hi in PRESENTATION_FORMS))
    return n / len(text)


def arabic_search_form(text: str) -> str:
    """A matching-only form. Never displayed — quoting must stay verbatim."""
    t = unicodedata.normalize("NFKC", text or "")
    t = t.replace(TATWEEL, "")
    t = DIACRITICS.sub("", t)
    t = re.sub(r"[أإآٱ]", "ا", t)
    t = t.replace("ة", "ه").replace("ى", "ي")
    t = arabic_digits_to_latin(t)
    return re.sub(r"\s+", " ", t).strip().lower()


def search_form(text: str) -> str:
    return arabic_search_form(text)


# ── systems & terms ──────────────────────────────────────────────────────
# Wording differs between documents far more often than meaning does. Without
# this, "CCTV" in the scope and "Video surveillance" in the BOQ read as a
# missing item — a false positive on a system that is present and priced.
SYNONYMS: dict[str, list[str]] = {
    "cctv": ["cctv", "closed circuit television", "video surveillance",
             "surveillance system", "camera system", "كاميرات المراقبة",
             "المراقبه التلفزيونيه", "كاميرا"],
    "access_control": ["access control", "acs", "card reader", "biometric",
                       "التحكم في الدخول", "التحكم بالدخول", "نظام الدخول"],
    "fire_alarm": ["fire alarm", "fire detection", "addressable fire",
                   "انذار حريق", "كشف الحريق"],
    "emergency_lighting": ["emergency lighting", "escape lighting",
                           "emergency and escape lighting", "اناره الطوارئ",
                           "انارة الطوارئ", "اضاءه الطوارئ"],
    "thermal_insulation": ["thermal insulation", "insulation", "عزل حراري", "عزل"],
    "fire_door": ["fire rated door", "fire door", "باب حريق", "ابواب حريق"],
}

_SYNONYM_INDEX = [(sys, search_form(term))
                  for sys, terms in SYNONYMS.items() for term in terms]


def systems_mentioned(text: str) -> set[str]:
    hay = search_form(text)
    return {sys for sys, term in _SYNONYM_INDEX if term and term in hay}


def levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if len(a) < len(b):
        a, b = b, a
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def fuzzy_contains(haystack: str, needle: str, max_distance: int = 2) -> bool:
    """Latin runs inside RTL paragraphs lose characters during extraction
    ("Access Control" -> "Aces Control"), so exact matching drops evidence."""
    hay, ned = search_form(haystack), search_form(needle)
    if ned in hay:
        return True
    words, n = hay.split(), len(ned.split())
    return any(levenshtein(" ".join(words[i:i + n]), ned) <= max_distance
               for i in range(max(0, len(words) - n + 1)))
