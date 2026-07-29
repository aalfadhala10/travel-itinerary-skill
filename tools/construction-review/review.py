#!/usr/bin/env python3
"""Review a folder of construction documents. Nothing leaves this machine.

    python review.py /path/to/project
    python review.py /path/to/project -o report.md
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from cr import checks, model, report
from cr.extract import extract

SUPPORTED = {".pdf", ".xlsx", ".xlsm", ".xls"}


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Cross-document review of construction project documents. "
                    "Runs offline — no network calls, nothing uploaded.")
    ap.add_argument("folder", type=Path, help="folder containing project documents")
    ap.add_argument("-o", "--out", type=Path, help="write the report to a file")
    ap.add_argument("-q", "--quiet", action="store_true", help="suppress progress")
    args = ap.parse_args()

    if not args.folder.is_dir():
        print(f"error: not a folder: {args.folder}", file=sys.stderr)
        return 2

    files = sorted(p for p in args.folder.rglob("*")
                   if p.is_file() and p.suffix.lower() in SUPPORTED)
    if not files:
        print(f"error: no PDF or Excel files found in {args.folder}", file=sys.stderr)
        print(f"       supported: {', '.join(sorted(SUPPORTED))}", file=sys.stderr)
        return 2

    documents = []
    for path in files:
        if not args.quiet:
            print(f"reading  {path.name}", file=sys.stderr)
        try:
            documents.append(extract(path))
        except Exception as exc:                       # one bad file, not a dead run
            print(f"  skipped {path.name}: {exc}", file=sys.stderr)

    if not documents:
        print("error: nothing could be read", file=sys.stderr)
        return 1

    pm = model.build(documents)
    findings = checks.run(pm)
    text = report.render(pm, findings)

    if args.out:
        args.out.write_text(text, encoding="utf-8")
        if not args.quiet:
            print(f"\nwrote {args.out}", file=sys.stderr)
    else:
        print(text)

    if not args.quiet:
        crit = sum(1 for f in findings if f.severity == "critical")
        print(f"\n{len(findings)} finding(s), {crit} critical", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
