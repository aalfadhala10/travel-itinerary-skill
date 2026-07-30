"""Project model — one structure built from every document at once.

This is the part that makes cross-document review possible: a door in the
schedule, its clause in the specification and its line in the BOQ stop being
three unrelated strings and become one element with three sources.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from .extract import Document, Table
from .normalize import (find_fire_rating, find_measures, normalize_tag,
                        parse_number, search_form, systems_mentioned)


@dataclass
class Source:
    document: str
    page: int
    section: str | None = None
    quote: str = ""
    bbox: tuple | None = None

    def cite(self) -> str:
        loc = f"{self.document} p.{self.page}"
        return f"{loc} §{self.section}" if self.section else loc


@dataclass
class Attribute:
    name: str
    value: float | str | None
    unit: str | None
    si: float | None
    source: Source
    rtl_context: bool = False
    geometric_read: bool = True


@dataclass
class Element:
    tag: str
    kind: str
    qualifiers: set[str] = field(default_factory=set)
    attributes: list[Attribute] = field(default_factory=list)
    source: Source | None = None

    def attr(self, name):
        return next((a for a in self.attributes if a.name == name), None)


@dataclass
class Requirement:
    subject: str
    attribute: str
    operator: str
    value: float
    unit: str
    si: float
    modality: str
    source: Source


@dataclass
class BoqItem:
    item_no: str
    description: str
    unit: str
    qty: float | None
    systems: set[str]
    source: Source


@dataclass
class ScopeItem:
    text: str
    systems: set[str]
    source: Source


@dataclass
class ProjectModel:
    documents: list[Document] = field(default_factory=list)
    elements: list[Element] = field(default_factory=list)
    requirements: list[Requirement] = field(default_factory=list)
    boq_items: list[BoqItem] = field(default_factory=list)
    scope_items: list[ScopeItem] = field(default_factory=list)
    measured: list[Attribute] = field(default_factory=list)

    def docs_of(self, *types):
        return [d for d in self.documents if d.doc_type in types]


# ── classification ───────────────────────────────────────────────────────
def classify(doc: Document) -> tuple[str, float]:
    name, text = doc.name.lower(), doc.text[:4000].lower()

    for tbl in doc.tables:
        # Match whole column names, never substrings of the joined header row:
        # "Fire Rated" contains "rate", which reads a door schedule as a BOQ.
        cols = {h.lower().strip() for h in tbl.headers}
        has = lambda *names: any(c.split("(")[0].strip() in names for c in cols)
        if has("mark", "tag") and has("fire rated"):
            return "drawing_ifc", 0.95
        if has("qty", "quantity") and has("rate", "unit price", "amount"):
            return "boq", 0.95

    rules = [
        ("employer_requirements", ("employer requirement", "employer_requirements"), 0.9),
        ("scope_of_work", ("scope of work", "scope_of_works"), 0.9),
        ("specification", ("specification", "spec_"), 0.85),
        ("mom", ("minutes of meeting", "mom", "محضر اجتماع"), 0.85),
        ("drawing_shop", ("shop drawing", "shop_drawing"), 0.85),
        ("boq", ("boq", "bill of quantities"), 0.85),
    ]
    for dtype, keys, conf in rules:
        if any(k in name for k in keys):
            return dtype, conf
    for dtype, keys, conf in rules:
        if any(k in text for k in keys):
            return dtype, conf - 0.15
    if re.search(r"SECTION\s+\d{2}\s+\d{2}\s+\d{2}", doc.text):
        return "specification", 0.7
    return "other", 0.3


# ── elements from schedule tables ────────────────────────────────────────
MARK_COLS = ("mark", "ref", "tag", "code", "no.", "door")
KIND_HINTS = {"door": "door", "window": "window", "louvre": "louvre"}


def _col(headers: list[str], *names) -> int | None:
    low = [h.lower().strip() for h in headers]
    for n in names:
        for i, h in enumerate(low):
            if n in h:
                return i
    return None


def elements_from_table(tbl: Table, doc: Document) -> list[Element]:
    i_mark = _col(tbl.headers, *MARK_COLS)
    if i_mark is None:
        return []
    i_rated = _col(tbl.headers, "fire rated")
    i_rating = _col(tbl.headers, "rating")
    i_loc = _col(tbl.headers, "location")
    i_type = _col(tbl.headers, "type")
    i_size = _col(tbl.headers, "size")

    kind = "door" if any(k in " ".join(tbl.headers).lower() for k in KIND_HINTS) \
        else "element"
    if i_rated is None and i_rating is None:
        return []

    out = []
    for row in tbl.rows:
        if len(row) != len(tbl.headers):
            continue                                   # guarded in extract()
        tag = normalize_tag(row[i_mark])
        if not tag:
            continue
        src = Source(doc.name, tbl.page, quote=" | ".join(row))
        el = Element(tag=tag, kind=kind, source=src)

        if i_loc is not None and row[i_loc]:
            el.attributes.append(Attribute("location", row[i_loc], None, None, src))
        if i_type is not None and row[i_type]:
            el.attributes.append(Attribute("material", row[i_type], None, None, src))
        if i_size is not None and (m := re.search(r"(\d+)\s*[x×]\s*(\d+)", row[i_size])):
            el.attributes.append(
                Attribute("width", float(m.group(1)), "mm", float(m.group(1)), src))
            el.attributes.append(
                Attribute("height", float(m.group(2)), "mm", float(m.group(2)), src))

        rated = i_rated is not None and row[i_rated].strip().lower() in ("yes", "y", "true")
        if rated:
            el.qualifiers.add("fire_rated")
        raw_rating = row[i_rating].strip() if i_rating is not None else ""
        # "—" is an explicit "not applicable"; "" is an omission. Different things.
        if raw_rating and raw_rating not in ("—", "-", "n/a", "na"):
            if (mins := find_fire_rating(raw_rating)) is not None:
                el.attributes.append(
                    Attribute("fire_rating", mins, "minutes", mins, src))
        elif rated:
            el.attributes.append(Attribute("fire_rating", None, None, None, src))
        out.append(el)
    return out


# ── requirements from specification prose ────────────────────────────────
SUBJECT_PATTERNS = [
    ("roof_insulation", ("roof",), ("insulation",)),
    ("wall_insulation", ("external wall", "wall"), ("insulation",)),
    ("fire_door", ("fire rated door", "fire door", "fire rated"), ()),
    ("escape_door", ("escape route", "protected escape"), ("door",)),
]
MIN_RE = re.compile(r"(not less than|minimum of|minimum|at least)", re.IGNORECASE)
MODALITY_RE = re.compile(r"\b(shall not|shall|must|should|may)\b", re.IGNORECASE)


def _subject_of(text: str) -> str | None:
    low = search_form(text)
    for name, musts, alsos in SUBJECT_PATTERNS:
        if any(m in low for m in musts) and all(a in low for a in alsos):
            return name
    return None


def requirements_from(doc: Document) -> list[Requirement]:
    out = []
    for blk in doc.blocks:
        subject = _subject_of(blk.text)
        if not subject:
            continue
        mod = MODALITY_RE.search(blk.text)
        modality = mod.group(1).lower() if mod else "shall"
        op = ">=" if MIN_RE.search(blk.text) else "="
        src = Source(doc.name, blk.page, blk.section_path, blk.text, blk.bbox)

        for meas in find_measures(blk.text):
            if meas["dimension"] == "time" and "fire" in search_form(blk.text):
                attr = "fire_rating"
            elif meas["dimension"] == "length" and "thickness" in search_form(blk.text):
                attr = "thickness"
            else:
                continue
            out.append(Requirement(subject, attr, op, meas["value"],
                                   meas["unit"], meas["si"], modality, src))
    return out


# ── measured attributes anywhere (spec prose, BOQ text, drawing notes) ────
MEASURED_SUBJECTS = [("roof_insulation", ("roof",), ("insulation",)),
                     ("wall_insulation", ("wall",), ("insulation",))]


def measured_attributes(doc: Document) -> list[Attribute]:
    out = []
    for blk in doc.blocks:
        low = search_form(blk.text)
        for name, musts, alsos in MEASURED_SUBJECTS:
            if not (any(m in low for m in musts) and all(a in low for a in alsos)):
                continue
            for meas in find_measures(blk.text):
                if meas["dimension"] != "length" or meas["si"] > 1000:
                    continue
                out.append(Attribute(
                    f"{name}_thickness", meas["value"], meas["unit"], meas["si"],
                    Source(doc.name, blk.page, blk.section_path, blk.text, blk.bbox),
                    rtl_context=bool(re.search(r"[؀-ۿ]", blk.text)),
                    # OCR cannot read Arabic-Indic numerals — measured, not
                    # assumed (cr/ocr.py). Such a value must never reach a
                    # comparison; it goes to a human with the page image.
                    geometric_read=blk.numeric_reliable))
            break
    return out


# ── BOQ & scope ──────────────────────────────────────────────────────────
def boq_items(doc: Document) -> list[BoqItem]:
    out = []
    for tbl in doc.tables:
        i_no = _col(tbl.headers, "item")
        i_desc = _col(tbl.headers, "description")
        i_unit = _col(tbl.headers, "unit")
        i_qty = _col(tbl.headers, "qty", "quantity")
        if i_desc is None:
            continue
        for row in tbl.rows:
            if len(row) <= i_desc or not row[i_desc]:
                continue
            desc = row[i_desc]
            out.append(BoqItem(
                item_no=row[i_no] if i_no is not None and len(row) > i_no else "",
                description=desc,
                unit=row[i_unit] if i_unit is not None and len(row) > i_unit else "",
                qty=parse_number(row[i_qty]) if i_qty is not None and len(row) > i_qty else None,
                systems=systems_mentioned(desc),
                source=Source(doc.name, tbl.page, quote=desc)))
    return out


def scope_items(doc: Document) -> list[ScopeItem]:
    out = []
    for blk in doc.blocks:
        systems = systems_mentioned(blk.text)
        if systems:
            out.append(ScopeItem(blk.text, systems,
                                 Source(doc.name, blk.page, blk.section_path,
                                        blk.text, blk.bbox)))
    for tbl in doc.tables:
        for row in tbl.rows:
            text = " ".join(row)
            if (systems := systems_mentioned(text)):
                out.append(ScopeItem(text, systems,
                                     Source(doc.name, tbl.page, quote=text)))
    return out


# ── assembly ─────────────────────────────────────────────────────────────
def build(documents: list[Document]) -> ProjectModel:
    pm = ProjectModel(documents=documents)
    for doc in documents:
        doc.doc_type, doc.type_confidence = classify(doc)

    for doc in documents:
        if doc.doc_type in ("drawing_ifc", "drawing_shop"):
            for tbl in doc.tables:
                pm.elements += elements_from_table(tbl, doc)
        if doc.doc_type == "specification":
            pm.requirements += requirements_from(doc)
        if doc.doc_type == "boq":
            pm.boq_items += boq_items(doc)
        if doc.doc_type in ("scope_of_work", "employer_requirements"):
            pm.scope_items += scope_items(doc)
        pm.measured += measured_attributes(doc)
    return pm
