#!/usr/bin/env python3
"""Score the reviewer against the TP-001 answer key.

    python test_tp001.py

Recall is the easy half. The decoys are the real measure: five traps that look
like conflicts and are not. Reporting one is a false positive, and a false
positive costs the user's trust in every other finding — so a decoy failure
is treated as worse than a miss.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from cr import checks, model                                    # noqa: E402
from cr.extract import extract                                  # noqa: E402

FIXTURES = Path(__file__).resolve().parents[2] / "tests" / "fixtures"
TESTPACK = FIXTURES / "testpack"

# (id, predicate over the finding list) — from TP-001_answer_key.yaml
EXPECTED = [
    ("T1 spec contradicts itself (90 vs 60)",
     lambda F: any(f.check_type == "INTERNAL_INCONSISTENCY" for f in F)),
    ("T2 FD-03 below the specified minimum",
     lambda F: any(f.check_type == "VALUE_MISMATCH" and "FD-03" in f.elements for f in F)),
    ("T3 FD-07 fire rated with no rating",
     lambda F: any(f.check_type == "MISSING_ATTRIBUTE" and "FD-07" in f.elements for f in F)),
    ("T4 14 doors scheduled vs 12 priced",
     lambda F: any(f.check_type == "COUNT_MISMATCH" for f in F)),
    ("T5 access control not in the BOQ",
     lambda F: any(f.check_type == "MISSING_IN_BOQ" and "Access Control" in f.title_en for f in F)),
    ("T6 emergency lighting not in the BOQ",
     lambda F: any(f.check_type == "MISSING_IN_BOQ" and "Emergency Lighting" in f.title_en for f in F)),
    ("T7 roof insulation 120 vs 80",
     lambda F: any(f.check_type == "VALUE_MISMATCH" and "roof insulation" in f.title_en for f in F)),
]

DECOYS = [
    ("D1 10 cm and 100 mm are the same wall thickness",
     lambda F: not any("wall insulation" in f.title_en for f in F)),
    ("D2 CCTV is priced as 'video surveillance'",
     lambda F: not any("Cctv" in f.title_en or "CCTV" in f.title_en for f in F)),
    ("D3 D-101 and D-101A are different doors",
     lambda F, M: len({e.tag for e in M.elements} & {"D-101", "D-101A"}) == 2),
    ("D4 a non-rated timber door needs no fire rating",
     lambda F: not any("D-220" in f.elements for f in F)),
    ("D5 ٢٤ cameras and 24 cameras agree",
     lambda F: not any("camera" in f.title_en.lower() for f in F)),
]


def main() -> int:
    if not TESTPACK.exists():
        print(f"fixtures missing — run:\n  python {FIXTURES/'make_testpack.py'}")
        return 2

    docs = [extract(p) for p in sorted(TESTPACK.iterdir())
            if p.suffix.lower() in (".pdf", ".xlsx")]
    pm = model.build(docs)
    findings = checks.run(pm)

    print(f"TP-001 — {len(findings)} finding(s) from {len(docs)} documents\n")

    print("Planted problems (recall)")
    found = 0
    for name, pred in EXPECTED:
        ok = pred(findings)
        found += ok
        print(f"  {'PASS' if ok else 'MISS'}  {name}")

    print("\nDecoys — reporting one of these is a false positive")
    clean = 0
    for name, pred in DECOYS:
        ok = pred(findings, pm) if pred.__code__.co_argcount == 2 else pred(findings)
        clean += ok
        print(f"  {'PASS' if ok else 'FAIL'}  {name}")

    extra = len(findings) - len(EXPECTED)
    print(f"\nrecall     {found}/{len(EXPECTED)}")
    print(f"decoys     {clean}/{len(DECOYS)} avoided")
    print(f"unexpected {max(0, extra)} finding(s) beyond the answer key")

    # Every finding must be able to point at where it came from (principle #1).
    unevidenced = [f for f in findings if not f.evidence]
    if unevidenced:
        print(f"\nFAIL {len(unevidenced)} finding(s) carry no evidence")

    ok = (found == len(EXPECTED) and clean == len(DECOYS)
          and extra <= 0 and not unevidenced)
    print("\n" + ("PASS — matches the answer key exactly"
                  if ok else "FAIL — see above"))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
