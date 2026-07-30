"""Report — findings rendered for a human, with what was not checked stated."""
from __future__ import annotations

from .checks import Finding
from .model import ProjectModel

ICON = {"critical": "!!", "high": " !", "medium": " ·", "low": " ·"}
AR = {"critical": "حرج", "high": "عالٍ", "medium": "متوسط", "low": "منخفض"}


def _ocr_summary(pm: ProjectModel) -> list[str]:
    scanned = [(d, h) for d in pm.documents for h in d.health if h.kind == "scanned"]
    if not scanned:
        return []
    read = [h for _, h in scanned if h.ocr_confidence]
    quarantined = sum(h.quarantined_numerals for _, h in scanned)
    lines = [f"- {len(scanned)} scanned page(s) read by OCR"]
    if read:
        mean = sum(h.ocr_confidence for h in read) / len(read)
        low = [f"{d.name} p.{h.page} ({h.ocr_confidence:.0%})"
               for d, h in scanned if h.ocr_confidence and h.ocr_confidence < 0.80]
        lines.append(f"- Mean OCR confidence: {mean:.0%}")
        if low:
            lines.append(f"- Low-confidence pages: {', '.join(low)}")
    failed = [f"{d.name} p.{h.page} — {h.reason}"
              for d, h in scanned if h.reason]
    lines += [f"- {f}" for f in failed]
    if quarantined:
        lines.append(
            f"- **{quarantined} Arabic-Indic numeral(s) quarantined.** OCR cannot "
            f"read them reliably, so they are excluded from every comparison "
            f"rather than guessed at. Open the page to read those values yourself.")
    return lines


def _health(pm: ProjectModel) -> tuple[int, int, list[str]]:
    pages = suspect = 0
    warnings = []
    for doc in pm.documents:
        pages += len(doc.health)
        for h in doc.health:
            if h.render_suspect:
                suspect += 1
                warnings.append(f"{doc.name} p.{h.page} — {h.reason}")
        for tbl in doc.tables:
            for issue in tbl.issues:
                warnings.append(f"{doc.name} p.{tbl.page} table — {issue}")
        warnings += [f"{doc.name} — {n}" for n in doc.notes]
    return pages, suspect, warnings


def render(pm: ProjectModel, findings: list[Finding]) -> str:
    pages, suspect, warnings = _health(pm)
    L = []
    add = L.append

    add("# Construction Review\n")
    add(f"**Documents:** {len(pm.documents)}  ·  **Pages:** {pages}  ·  "
        f"**Findings:** {len(findings)}\n")

    add("\n## Documents read\n")
    add("| File | Detected as | Confidence | Pages |")
    add("|---|---|---|---|")
    for d in sorted(pm.documents, key=lambda d: d.name):
        add(f"| {d.name} | {d.doc_type} | {d.type_confidence:.0%} | {len(d.health)} |")

    add("\n## Model built\n")
    add(f"- Elements: **{len(pm.elements)}**  "
        f"(fire rated: {sum(1 for e in pm.elements if 'fire_rated' in e.qualifiers)})")
    add(f"- Requirements extracted: **{len(pm.requirements)}**")
    add(f"- BOQ items: **{len(pm.boq_items)}**")
    add(f"- Scope / ER items naming a system: **{len(pm.scope_items)}**")

    if (ocr_lines := _ocr_summary(pm)):
        add("\n## OCR\n")
        for line in ocr_lines:
            add(line)

    if warnings:
        add("\n## Read quality — check these before trusting the results\n")
        for w in warnings:
            add(f"- {w}")
    if suspect:
        add(f"\n> **{suspect} page(s) extracted text but may not display correctly.** "
            f"Open them and compare before relying on anything drawn from them.")

    add("\n## Findings\n")
    if not findings:
        add("No findings. This means the checks that ran found nothing — "
            "see *Scope of this review* below for what was and was not checked.")
    for i, f in enumerate(findings, 1):
        add(f"\n### {ICON[f.severity]} {i}. {f.title_en}")
        add(f"\n*{f.title_ar}*\n")
        add(f"**{f.severity.upper()} / {AR[f.severity]}** · `{f.check_type}`"
            + (f" · elements: {', '.join(f.elements)}" if f.elements else ""))
        add(f"\n{f.detail}\n")
        add("**Evidence**\n")
        for src in f.evidence:
            quote = " ".join(src.quote.split())
            if len(quote) > 190:
                quote = quote[:190] + "…"
            add(f"- `{src.cite()}` — {quote}")

    add("\n---\n")
    add("## Scope of this review\n")
    add("Checked: specification against itself · scheduled elements against "
        "specified minimums · required attributes present · schedule counts "
        "against BOQ quantities · scope and employer requirements against BOQ "
        "coverage · the same measurement stated in more than one document.\n")
    add("**Not checked:** anything drawn rather than written (geometry, "
        "dimensions on drawings, spatial relationships), Arabic-Indic numerals "
        "on scanned pages, drawing revisions and supersession, compliance with "
        "Qatari authority requirements, and any document type not listed "
        "above.\n")
    add("Findings are advisory. Every one carries its source so a responsible "
        "engineer can verify it. The tool does not certify anything.\n")
    return "\n".join(L)
