"""Checks — the project model turned into findings.

Every check is deterministic: no model, no sampling, no temperature. The same
documents produce the same findings every run, which is what lets a finding
survive an argument with a contractor.

A finding with no evidence is never emitted. That is enforced here, not left
to the report layer.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from .model import ProjectModel, Source
from .normalize import SYNONYMS

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


@dataclass
class Finding:
    check_type: str
    severity: str
    title_en: str
    title_ar: str
    detail: str
    evidence: list[Source] = field(default_factory=list)
    elements: list[str] = field(default_factory=list)
    confidence: float = 1.0
    needs_confirmation: bool = False


def _label(system: str) -> str:
    return SYNONYMS[system][0].title() if system in SYNONYMS else system


# ── 1. specification disagreeing with itself ─────────────────────────────
def check_internal_inconsistency(pm: ProjectModel) -> list[Finding]:
    out, groups = [], {}
    for req in pm.requirements:
        if req.subject in ("fire_door", "escape_door") and req.attribute == "fire_rating":
            groups.setdefault(("fire_door_family", "fire_rating"), []).append(req)

    for (_, attr), reqs in groups.items():
        values = {r.si for r in reqs}
        if len(values) <= 1:
            continue
        docs = {r.source.document for r in reqs}
        if len(docs) != 1:
            continue                       # across documents -> a different check
        out.append(Finding(
            check_type="INTERNAL_INCONSISTENCY",
            severity="critical",
            title_en="Specification states two different fire ratings for the same doors",
            title_ar="المواصفة تعطي تصنيفَي مقاومة مختلفين لنفس الأبواب",
            detail=("The specification requires "
                    + " and ".join(f"{int(r.si)} minutes ({r.source.cite()})"
                                   for r in sorted(reqs, key=lambda r: -r.si))
                    + ". The system does not decide which governs — it must be resolved."),
            evidence=[r.source for r in reqs]))
    return out


# ── 2. an element below what the specification requires ──────────────────
def check_requirement_not_met(pm: ProjectModel) -> list[Finding]:
    reqs = [r for r in pm.requirements
            if r.attribute == "fire_rating" and r.operator == ">="]
    if not reqs:
        return []
    governing = min(reqs, key=lambda r: r.si)      # the least demanding bound

    out = []
    for el in pm.elements:
        if "fire_rated" not in el.qualifiers:
            continue
        attr = el.attr("fire_rating")
        if attr is None or attr.si is None:
            continue                                # absence -> check 3
        if attr.si >= governing.si:
            continue
        stricter = max(reqs, key=lambda r: r.si)
        detail = (f"{el.tag} is scheduled at {int(attr.si)} minutes. "
                  f"The specification requires at least {int(governing.si)} minutes "
                  f"({governing.source.cite()})")
        if stricter.si != governing.si:
            detail += (f", and {int(stricter.si)} minutes for escape routes "
                       f"({stricter.source.cite()})")
        out.append(Finding(
            check_type="VALUE_MISMATCH", severity="critical",
            title_en=f"{el.tag} fire rating is below the specified minimum",
            title_ar=f"تصنيف مقاومة الحريق للباب {el.tag} أقل من الحد الأدنى",
            detail=detail + ".",
            elements=[el.tag],
            evidence=[el.source, governing.source]))
    return out


# ── 3. a required attribute left blank ───────────────────────────────────
def check_missing_attribute(pm: ProjectModel) -> list[Finding]:
    missing = [el for el in pm.elements
               if "fire_rated" in el.qualifiers
               and (a := el.attr("fire_rating")) is not None and a.si is None]
    if not missing:
        return []
    tags = [el.tag for el in missing]
    return [Finding(
        check_type="MISSING_ATTRIBUTE", severity="critical",
        title_en="Fire doors scheduled without a fire rating",
        title_ar="أبواب حريق مجدولة بدون تصنيف مقاومة",
        detail=(f"{len(tags)} door(s) are marked as fire rated but the rating "
                f"column is empty: {', '.join(tags)}. A fire door without a "
                f"stated rating cannot be procured or approved."),
        elements=tags,
        evidence=[el.source for el in missing])]


# ── 4. schedule count against BOQ quantity ───────────────────────────────
def check_count_mismatch(pm: ProjectModel) -> list[Finding]:
    scheduled = [el for el in pm.elements if "fire_rated" in el.qualifiers]
    if not scheduled:
        return []
    priced = [i for i in pm.boq_items
              if "fire" in i.description.lower() and "door" in i.description.lower()
              and i.qty]
    if not priced:
        return []
    total = sum(i.qty for i in priced)
    if abs(total - len(scheduled)) < 0.5:
        return []
    return [Finding(
        check_type="COUNT_MISMATCH", severity="high",
        title_en="Fire door count differs between the schedule and the BOQ",
        title_ar="عدد أبواب الحريق مختلف بين الجدول وجدول الكميات",
        detail=(f"The door schedule lists {len(scheduled)} fire rated doors, "
                f"the BOQ prices {int(total)}. Difference: "
                f"{abs(int(total) - len(scheduled))}."),
        evidence=[scheduled[0].source] + [i.source for i in priced])]


# ── 5. required scope absent from the BOQ ────────────────────────────────
def check_missing_in_boq(pm: ProjectModel) -> list[Finding]:
    if not pm.boq_items:
        return []
    required: dict[str, list[Source]] = {}
    for item in pm.scope_items:
        for system in item.systems:
            required.setdefault(system, []).append(item.source)

    priced = set().union(*(i.systems for i in pm.boq_items)) if pm.boq_items else set()

    out = []
    for system, sources in sorted(required.items()):
        if system in priced or system == "thermal_insulation":
            continue
        out.append(Finding(
            check_type="MISSING_IN_BOQ", severity="critical",
            title_en=f"{_label(system)} is required but not priced in the BOQ",
            title_ar=f"{_label(system)} مطلوب ولا يوجد له بند في جدول الكميات",
            detail=(f"{_label(system)} is called for in the project documents "
                    f"but no corresponding BOQ item was found. Matching is by "
                    f"meaning, not wording, so alternative descriptions were "
                    f"also searched."),
            evidence=sources[:3]))
    return out


# ── 6. the same measurement stated differently in two documents ──────────
def check_value_mismatch(pm: ProjectModel) -> list[Finding]:
    groups: dict[str, list] = {}
    for attr in pm.measured:
        groups.setdefault(attr.name, []).append(attr)

    out = []
    for name, attrs in sorted(groups.items()):
        by_value: dict[float, list] = {}
        for a in attrs:
            by_value.setdefault(round(a.si, 3), []).append(a)
        if len(by_value) <= 1:
            continue          # 10 cm and 100 mm land in the same bucket

        # A number read from RTL text that did not come through the geometric
        # path may be reversed, and a conflict on it would be fabricated.
        if any(a.rtl_context and not a.geometric_read for a in attrs):
            continue

        pretty = name.replace("_", " ")
        parts = [f"{int(v)} mm ({vs[0].source.cite()})"
                 for v, vs in sorted(by_value.items(), reverse=True)]
        out.append(Finding(
            check_type="VALUE_MISMATCH", severity="high",
            title_en=f"Conflicting {pretty} values",
            title_ar=f"تعارض في قيمة {pretty}",
            detail="The documents state " + " against ".join(parts) + ".",
            evidence=[vs[0].source for vs in by_value.values()]))
    return out


ALL_CHECKS = (check_internal_inconsistency, check_requirement_not_met,
              check_missing_attribute, check_count_mismatch,
              check_missing_in_boq, check_value_mismatch)


def run(pm: ProjectModel) -> list[Finding]:
    findings = [f for check in ALL_CHECKS for f in check(pm)]
    # Principle #1: no evidence, no claim. Enforced, not trusted.
    findings = [f for f in findings if f.evidence]
    findings.sort(key=lambda f: (SEVERITY_ORDER.get(f.severity, 9), f.check_type))
    return findings
