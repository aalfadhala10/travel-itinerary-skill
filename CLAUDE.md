# Working notes

## Arabic PDFs — always use the `arabic-pdf-designer` skill

Whenever an Arabic PDF is being produced, invoke the **`arabic-pdf-designer`**
skill. Do not hand-roll one.

The skill's core technical rule: **never use ReportLab or WeasyPrint for
Arabic.** Build HTML with the Tajawal webfont and render through Chrome. Those
Python libraries either lack a shaping engine entirely (ReportLab needs
`arabic_reshaper` pre-processing, which bakes presentation forms and visual
order into the file) or shape correctly but still produce a file that extracts
badly.

### What the skill does and does not solve

These are two separate problems and only the first is fixed by choosing the
right producer:

| | |
|---|---|
| **Rendering** — the page looks right to a human | The skill solves this |
| **Extraction** — text read back out is correct | **Nobody solves this** |

Measured across three independent producers (`tests/fixtures/arabic_shaped/`):

| Producer | Presentation forms | Word order | Digits |
|---|:---:|---|---|
| ReportLab + arabic_reshaper | yes | visual | **reversed** |
| WeasyPrint | none | correct | **reversed** |
| Chromium | none | **scrambled** | **reversed** |

`١٢٠` extracts as `٠٢١` from all three. A reversed number raises no error and
carries no low confidence — it is a correctly-shaped wrong value going straight
into a comparison.

So an Arabic PDF built through the skill still needs the geometric read on the
way back in: digits are always left-to-right under UAX #9, so a digit run is
read by sorting glyphs on ascending x. Implemented in
`tools/construction-review/cr/extract.py::_rebuild_digit_runs`, specified in
`docs/01-DOCUMENT-PROCESSING.md` §10.2.

Chromium also scrambles segment order, so a number's **context** must be bound
by bbox position, never by the sequence the extractor returned — otherwise
"120 in the spec, 80 in the schedule" binds the wrong value to the wrong source.

### Test fixtures are the exception

`tests/fixtures/make_testpack.py` and `arabic_shaped/make_shaped_arabic.py`
deliberately use ReportLab and WeasyPrint. They exist to *reproduce* these
extraction defects for regression testing, so they must stay on producers with
known, stable behaviour. Do not migrate them to the skill — that would delete
the test subjects.

Anything meant for a human to read goes through the skill.

---

## Project

Two unrelated things live in this repository:

- `main` — the travel itinerary generator skill (`SKILL.md`, `index.html`)
- `claude/construction-intelligence-platform-*` — the AI Construction
  Intelligence Platform: `docs/` (specification), `tools/construction-review/`
  (a local offline reviewer), `tests/fixtures/` (test packages with answer keys)

### Ground rules for the construction work

Set out in `docs/README.md`. The two that get violated most easily:

1. **No claim without evidence.** A finding with no file, page and quoted line
   is dropped in `checks.run`, not trusted to the report layer.
2. **Deterministic where possible, LLM where necessary.** Comparison, counting
   and unit conversion are code. After the digit-reversal finding, *reading* a
   number is code too.

### Before changing the reviewer

```bash
python tests/fixtures/make_testpack.py
python tools/construction-review/test_tp001.py     # 7/7 findings, 5/5 decoys avoided
python tests/fixtures/arabic_shaped/make_shaped_arabic.py
```

Every fixture asserts against a recorded answer key and fails on drift,
including if a producer *stops* misbehaving — the spec should not be relaxed on
an assumption.

### A caution about the fixtures

Every test package here was written by someone who knew its answers. They catch
regressions well and prove nothing about finding problems nobody planted. Real
documents — redacted — are the only thing that breaks that loop.
