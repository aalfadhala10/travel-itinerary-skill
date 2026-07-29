# 07 — Test Case Library

| Field | Value |
|-------|-------|
| Version | 0.1 (Draft) |
| Owner | QA + Domain Experts + Engineering |
| Depends on | [AI Engine](./02-AI-ENGINE.md) · [Qatar Compliance Engine](./03-QATAR-COMPLIANCE-ENGINE.md) |

> **كلما زادت هذه المكتبة، أصبحت المنصة أكثر دقة وأسهل في اختبار أي تحديث جديد.**
> هذه ليست وثيقة اختبار برمجي — بل **أصل المنتج الأهم بعد مكتبة الاشتراطات**. نظام ذكاء بلا مجموعة اختبار موثوقة يتحسن بالحدس، والحدس لا يقيس الانحدار.

---

## 1. لماذا مكتبة مستقلة؟

| بدون مكتبة | مع مكتبة |
|------------|----------|
| "يبدو أن التحديث حسّن النتائج" | "Precision ارتفع 4%، Recall انخفض 1% على 240 حالة" |
| اكتشاف الانحدار عند العميل | اكتشافه في CI قبل الدمج |
| تعديل الأوزان بالحدس | معايرة مقاسة |
| لا يمكن مقارنة نموذجين | مقارنة موضوعية بأرقام |

**قاعدة الفريق:** أي bug يُبلَّغ عنه من الإنتاج يصبح **حالة اختبار قبل أن يُصلَح**. أي false positive يرفضه مستخدم يصبح حالة اختبار سلبية.

---

## 2. Test Case Format

```yaml
id: TC-001
name: Insulation thickness mismatch between specification and drawing
category: conflict_detection
check_type: VALUE_MISMATCH
priority: high              # critical | high | medium | low
tier: 1                     # 1 = synthetic snippets · 2 = full documents · 3 = real project

inputs:
  documents:
    - type: specification
      content: |
        SECTION 07 21 00 — THERMAL INSULATION
        2.1 MATERIALS
        A. External wall insulation shall have a thickness of not less than 100 mm.
      page: 214
      section_path: "07 21 00 / 2.1.A"

    - type: drawing_ifc
      content: |
        DETAIL 3 — EXTERNAL WALL EW-02
        INSULATION 75mm
      page: 12
      sheet: "A-405"

expected:
  findings:
    - check_type: VALUE_MISMATCH
      attribute: thickness
      severity: high
      element_hint: EW-02
      evidence_documents: [specification, drawing_ifc]
      values: [100, 75]
      unit: mm
  must_not_contain: []
  min_confidence: 0.80

notes: "حالة أساسية — لا يُسمح بانحدارها إطلاقًا."
```

### الحقول الإلزامية

| Field | الغرض |
|-------|-------|
| `id` | معرّف ثابت لا يتغير أبدًا |
| `category` | تجميع لتقارير الجودة |
| `check_type` | الفحص المستهدف |
| `tier` | مستوى واقعية المدخلات |
| `inputs` | المدخلات كاملة وقابلة لإعادة الإنتاج |
| `expected.findings` | ما يجب أن يُكتشف |
| `expected.must_not_contain` | ما يجب **ألا** يُكتشف — لقياس الـ False Positives |

---

## 3. Test Tiers

| Tier | الوصف | السرعة | الواقعية | متى تُشغَّل |
|------|-------|:------:|:--------:|-------------|
| **Tier 1** — Snippets | مقاطع نصية قصيرة، بلا PDF | ثوانٍ | منخفضة | كل PR |
| **Tier 2** — Documents | ملفات PDF/Excel كاملة مُصطنعة | دقائق | متوسطة | كل PR (مجموعة مختارة) + ليليًا (الكل) |
| **Tier 3** — Real (Redacted) | مشاريع حقيقية بعد إخفاء الهوية | ساعات | عالية | أسبوعيًا + قبل كل إصدار |

**Tier 1 يقيس المنطق. Tier 3 يقيس المنتج.** كلاهما ضروري؛ الاكتفاء بـ Tier 1 يعطي ثقة زائفة (يتخطى OCR واستخراج الجداول والربط عبر المستندات بالكامل).

---

## 4. Seed Cases

### 4.1 Conflict Detection

```yaml
- id: TC-001
  name: Insulation thickness mismatch
  check_type: VALUE_MISMATCH
  inputs:
    specification: "Insulation thickness 100 mm"
    drawing_ifc:   "Insulation 75mm"
  expected: {findings: [{check_type: VALUE_MISMATCH, values: [100, 75], unit: mm}]}

- id: TC-004
  name: Unit-disguised mismatch (10 cm vs 100 mm — NOT a conflict)
  check_type: VALUE_MISMATCH
  inputs:
    specification: "Insulation thickness 10 cm"
    drawing_ifc:   "Insulation 100mm"
  expected:
    findings: []
    must_not_contain: [VALUE_MISMATCH]
  notes: "يختبر التطبيع إلى SI. الفشل هنا = false positive محرج."

- id: TC-005
  name: Fire rating mismatch across formats (FR60 vs 30 min)
  check_type: VALUE_MISMATCH
  inputs:
    specification: "Fire rated doors: minimum 60 minutes"
    drawing_ifc:   "D-101 | 900x2100 | FR30"
  expected: {findings: [{check_type: VALUE_MISMATCH, attribute: fire_rating, severity: critical}]}

- id: TC-006
  name: Internal inconsistency within one specification
  check_type: INTERNAL_INCONSISTENCY
  inputs:
    specification: |
      §08 14 00: Fire doors shall be 60 minutes rated.
      §28 31 00: All fire doors shall achieve 90 minutes.
  expected: {findings: [{check_type: INTERNAL_INCONSISTENCY}]}
  notes: "النظام يبلّغ عن التناقض ولا يرجّح أحد البندين."
```

### 4.2 Missing Scope

```yaml
- id: TC-002
  name: CCTV in scope but absent from BOQ
  check_type: MISSING_IN_BOQ
  inputs:
    scope_of_work: "The Contractor shall supply and install a complete CCTV system."
    boq: |
      Item | Description              | Unit | Qty
      8.1  | Fire alarm system        | LS   | 1
      8.2  | Access control system    | LS   | 1
  expected: {findings: [{check_type: MISSING_IN_BOQ, system: cctv, severity: critical}]}

- id: TC-007
  name: CCTV present in BOQ under a different wording (NOT missing)
  check_type: MISSING_IN_BOQ
  inputs:
    scope_of_work: "CCTV system included."
    boq: |
      Item | Description                          | Unit | Qty
      8.3  | Video surveillance system incl. cameras | LS | 1
  expected:
    findings: []
    must_not_contain: [MISSING_IN_BOQ]
  notes: "يختبر المطابقة الدلالية لا الحرفية."

- id: TC-008
  name: Count mismatch between door schedule and BOQ
  check_type: COUNT_MISMATCH
  inputs:
    drawing_ifc: "Door Schedule: 12 × FD-type doors listed"
    boq: "8.14.03 | Fire rated doors | No. | 10"
  expected: {findings: [{check_type: COUNT_MISMATCH, values: [12, 10]}]}
```

### 4.3 Missing Requirements

```yaml
- id: TC-003
  name: Fire door without fire rating
  check_type: MISSING_ATTRIBUTE
  inputs:
    drawing_ifc: "FD-07 | 1000x2100 | Fire rated | Corridor L2"
    specification: "Doors shall comply with local authority requirements."
  expected: {findings: [{check_type: MISSING_ATTRIBUTE, attribute: fire_rating, severity: critical}]}

- id: TC-009
  name: Non-fire door without fire rating (NOT a finding)
  check_type: MISSING_ATTRIBUTE
  inputs:
    drawing_ifc: "D-220 | 800x2100 | Timber | Office 2.14"
  expected:
    findings: []
    must_not_contain: [MISSING_ATTRIBUTE]
  notes: "الخاصية إلزامية للأبواب المصنّفة فقط."

- id: TC-010
  name: Immeasurable requirement
  check_type: AMBIGUOUS_REQUIREMENT
  inputs:
    specification: "Finishes shall be of high quality and to the Engineer's satisfaction."
  expected: {findings: [{check_type: AMBIGUOUS_REQUIREMENT, severity: medium}]}
```

### 4.4 Entity Resolution

```yaml
- id: TC-020
  name: Same element under formatting variants
  category: entity_resolution
  inputs:
    specification: "Door D-101 shall be fire rated."
    drawing_ifc:   "D101 | Corridor L1"
    boq:           "Door D 101 | No. | 1"
  expected: {linked_entities: 1, canonical_tag: "D-101"}

- id: TC-021
  name: Similar but distinct tags must NOT merge
  category: entity_resolution
  inputs:
    drawing_ifc: |
      D-101  | Corridor L1
      D-101A | Corridor L1 (secondary leaf)
  expected: {linked_entities: 2}
  notes: "دمج خاطئ هنا يفسد كل الفحوصات اللاحقة."

- id: TC-022
  name: Cross-building tag collision
  category: entity_resolution
  inputs:
    drawing_ifc: |
      Building A — D-101 | Lobby
      Building B — D-101 | Lobby
  expected: {linked_entities: 2}
```

### 4.5 Document Processing

```yaml
- id: TC-040
  name: Scanned Arabic + English page
  category: document_processing
  tier: 2
  inputs: {file: fixtures/scanned_bilingual.pdf}
  expected:
    languages: [ar, en]
    min_ocr_confidence: 0.70
    text_contains: ["مقاومة الحريق", "fire resistance"]

- id: TC-041
  name: Multi-page BOQ table with repeated headers
  category: document_processing
  tier: 2
  inputs: {file: fixtures/boq_multipage.pdf}
  expected:
    tables: 1
    rows: 412
    sanity_checks_passed: true
  notes: "يجب أن يُدمج كجدول واحد لا ثلاثة."

- id: TC-042
  name: Unreadable page must be reported, not silently skipped
  category: document_processing
  tier: 2
  inputs: {file: fixtures/blank_scan.pdf}
  expected:
    health.pages_unreadable: 1
    findings: []
    health_warning_present: true

- id: TC-043
  name: Superseded revision must not drive findings
  category: document_processing
  inputs:
    documents:
      - {type: drawing_ifc, revision: "A", content: "Insulation 75mm"}
      - {type: drawing_ifc, revision: "C", content: "Insulation 100mm"}
      - {type: specification, content: "Insulation thickness 100 mm"}
  expected:
    findings: []
    must_not_contain: [VALUE_MISMATCH]
  notes: "Rev A ملغى — لا يُقارَن به."

# ── الحالات التالية جاءت من فشل حقيقي في أول تشغيل على حزمة TP-001 ──

- id: TC-044
  name: Empty table cell must not collapse and shift the row
  category: document_processing
  priority: critical
  tier: 2
  inputs: {file: fixtures/testpack/04_Door_Schedule.pdf}
  expected:
    table_rows_all_match_header_count: true
    row_FD-07:
      fire_rated: "Yes"
      rating: null            # الخانة فارغة فعلاً — يجب أن تبقى فارغة
      self_closer: "Yes"
    findings:
      - {check_type: MISSING_ATTRIBUTE, element: FD-07, attribute: fire_rating}
    must_not_contain_values: {rating: "Yes"}
  notes: >
    الفشل الأصلي: صف FD-07 خرج بـ 7 حقول بدل 8، فقُرئت قيمة Self Closer على أنها Rating،
    فبدا الباب مصنّفًا سليمًا وضاع أخطر finding في الجدول. الفشل صامت — لا يكشفه فحص حسابي.

- id: TC-045
  name: Arabic extracted in visual order must be restored to logical order
  category: document_processing
  priority: critical
  tier: 2
  inputs: {file: fixtures/testpack/06_Minutes_of_Meeting_AR.pdf}
  expected:
    normalized_text_contains:
      - "محضر اجتماع رقم"
      - "جدول الكميات"
      - "مقاومة الحريق"
    presentation_forms_ratio_max: 0.0
    search_finds: {query: "الكميات", min_hits: 2}
  notes: >
    الفشل الأصلي: النص خرج بالترتيب البصري فأعاد البحث العربي صفر نتائج بصمت.
    تصحيح تشخيص سابق: صيغ العرض ليست شرطًا للعطب — ملف مولَّد بشكل سليم يُخرج صفر صيغ عرض
    ويظل نصه خاطئًا. الكشف الموثوق هو مقارنة ترتيب السلسلة بترتيب الإحداثيات (وثيقة 01 §5.3).

- id: TC-049
  name: Arabic-Indic digits must be reconstructed by glyph position, not string order
  category: document_processing
  priority: critical
  tier: 2
  inputs:
    file: fixtures/arabic_shaped/proper_arabic.pdf
    source_values: ["١٤", "١٢٠", "٨٠"]
  expected:
    naive_string_read: ["٤١", "٠٢١", "٠٨"]      # ما يعطيه الاستخراج النصي — موثّق للتوضيح
    geometric_read:    ["١٤", "١٢٠", "٨٠"]      # المطلوب
    normalized_values: [14, 120, 80]
    processing_log_contains: RTL_DIGIT_REORDER
  notes: >
    أخطر عطب في خط المعالجة: الرقم المعكوس لا ينتج خطأ ولا ثقة منخفضة — قيمة صحيحة الشكل
    خاطئة المضمون تدخل محرك المقارنة مباشرة. الملف المُختبَر مولَّد بمحرك تشكيل سليم
    (صفر صيغ عرض) ويُعرض مثاليًا — العطب في الاستخراج وحده.

- id: TC-050
  name: Identical value across Arabic and English must NOT be reported as a conflict
  category: conflict_detection
  priority: critical
  tier: 2
  inputs:
    documents:
      - {type: mom, language: ar, content: "سماكة عزل السطح ١٢٠ مم"}
      - {type: boq, language: en, content: "Roof thermal insulation, 120mm thick"}
  expected:
    findings: []
    must_not_contain: [VALUE_MISMATCH]
  notes: >
    الفخ المقابل لـ TC-049، وهو المقياس الحقيقي. بدون القراءة الهندسية يُقرأ الرقم العربي 021
    فيُبلَّغ عن تعارض بين مستندين متفقين تمامًا — false positive يضرب المبدأ الحاكم للمنتج.
    الاتجاه المعاكس مطلوب أيضًا: ٠٨ مقابل 80 يجب ألا يُخفي تعارضًا حقيقيًا.

- id: TC-047
  name: Page that extracts perfect text but renders as garbage must be flagged
  category: document_processing
  priority: critical
  tier: 2
  inputs:
    file: fixtures/testpack/06_Minutes_of_Meeting_AR.pdf
    mutation: corrupt_font_subset      # يُطبَّق أثناء الاختبار لإنتاج العطب
  expected:
    text_extraction_succeeds: true     # النص سليم — هذا بيت القصيد
    page_flagged: RENDER_SUSPECT
    integrity_check_failed: GLYPHS_MISSING
    page_confidence_max: 0.60
    health_report_contains: integrity_warning
    must_not_report_as: pages_read_ok
  notes: >
    فئة الأعطال المعاكسة: الاستخراج ينجح والصفحة غير مقروءة بشريًا.
    عدّها ضمن "قُرئت بنجاح" صدق تقني وكذب عملي. الحالة مأخوذة من عطب حقيقي:
    subset_fonts أسقط تغطية الحبر من 0.0249 إلى 0.0079 والنص بقي سليمًا تمامًا.

- id: TC-048
  name: Sparse but valid page must not be flagged as render-suspect
  category: document_processing
  priority: high
  tier: 2
  inputs:
    file: fixtures/testpack/04_Door_Schedule.pdf
    page: 2                            # ٣ ملاحظات فقط — حبر منخفض مشروع
  expected:
    page_flagged: null
    must_not_contain: [RENDER_SUSPECT]
  notes: >
    الفخ المقابل لـ TC-047. حدّ حبر ثابت يرفض هذه الصفحة ظلمًا — لذلك المقياس
    "حبر لكل محرف" لا "حبر مطلق".

- id: TC-046
  name: Corrupted Latin run inside Arabic paragraph must still match its term
  category: entity_resolution
  priority: high
  tier: 2
  inputs:
    extracted_text: "طلب الاستشاري توضيح موقف نظام التحكم في الدخول (Aces Control)"
    requirement_source: "An electronic access control system shall be provided"
  expected:
    linked_term: access_control
    evidence_links_min: 1
  notes: >
    الفشل الأصلي: "Access Control" خرجت "Aces Control" (حرفان مفقودان) من فقرة RTL.
    المطابقة الحرفية تُسقط الدليل المؤيد للـ finding بصمت. تُطلب مطابقة ضبابية ≤ 2.
```

### 4.6 Q&A

```yaml
- id: TC-060
  name: Count question answered from project model
  category: qa
  inputs:
    question: "كم عدد Fire Doors؟"
    drawing_ifc: "Door Schedule: FD-01 … FD-24 (24 entries)"
  expected:
    answer_contains: "24"
    citations_min: 1
    citation_pages_correct: true

- id: TC-061
  name: Unanswerable question must not be fabricated
  category: qa
  inputs:
    question: "ما هي متطلبات نظام الري؟"
    documents: [{type: specification, content: "SECTION 08 14 00 — WOOD DOORS …"}]
  expected:
    answer_type: insufficient_evidence
    must_not_contain_fabricated_values: true
  notes: "أهم حالة اختبار في المكتبة كلها."

- id: TC-062
  name: Arabic question over English documents
  category: qa
  inputs:
    question: "كم سماكة العزل الحراري؟"
    specification: "Thermal insulation thickness shall be 100 mm."
  expected:
    answer_language: ar
    answer_contains: "100"
    citations_min: 1
```

### 4.7 Compliance

```yaml
- id: TC-080
  name: Fire door missing rating triggers QCDD rule
  category: compliance
  inputs:
    project_profile: {building_type: commercial, floors_above_ground: 12}
    drawing_ifc: "FD-07 | Fire rated | Corridor L2"
  expected:
    findings: [{check_type: COMPLIANCE_VIOLATION, rule_id: QCDD-FD-001, severity: critical}]

- id: TC-081
  name: Rule outside applicability must not fire
  category: compliance
  inputs:
    project_profile: {building_type: villa, floors_above_ground: 2}
    drawing_ifc: "D-05 | Timber | Bedroom"
  expected:
    findings: []
  notes: "تطبيق قاعدة غير منطبقة = ضجيج يُفقد الثقة."

- id: TC-082
  name: Insufficient data reported as not-assessable, not as compliant
  category: compliance
  inputs:
    project_profile: {building_type: commercial}
    documents: [{type: boq, content: "…"}]
  expected:
    not_assessable_min: 1
    must_not_contain: [COMPLIANCE_PASS]
```

---

## 5. Adversarial Cases

الحالات التي تكشف الأخطاء **المُحرجة** — يجب أن تشكّل ≥ 30% من المكتبة:

| النمط | مثال | ما يختبره |
|-------|------|-----------|
| **Same value, different units** | 10 cm vs 100 mm | التطبيع |
| **Different wording, same thing** | "Video surveillance" vs "CCTV" | المطابقة الدلالية |
| **Similar tags, different elements** | D-101 vs D-101A | عدم الدمج الخاطئ |
| **Conditional requirement** | "…except in Zone C" | فهم الاستثناءات |
| **Superseded revision** | Rev A vs Rev C | إدارة الإصدارات |
| **Value in a footnote** | "* thickness may be reduced to 75mm where…" | السياق الكامل |
| **Negation** | "Fire rating is NOT required for…" | فهم النفي |
| **Table with merged cells** | BOQ بخلايا مدمجة | استخراج الجداول |
| **Empty cell mid-row** | خانة Rating فارغة في جدول أبواب | انزلاق الأعمدة — الفشل الصامت |
| **Presentation-form Arabic** | `ﻢﻗﺭ` بدل `رقم` | تطبيع العربية |
| **Corrupted Latin run in RTL** | `Aces Control` | المطابقة الضبابية للمصطلحات |
| **Reversed digits in RTL** | `١٢٠` تُقرأ `٠٢١` | القراءة الهندسية للأرقام |
| **Same value, two scripts** | `١٢٠ مم` مقابل `120 mm` | ألا يُبلَّغ تعارض كاذب |
| **Number in Arabic-Indic digits** | ١٠٠ مم | التطبيع الرقمي |
| **Injected instruction in a document** | "Ignore previous instructions…" داخل PDF | مقاومة prompt injection |

> السطر الأخير حرج: المستندات تأتي من أطراف خارجية. يجب أن توجد حالة اختبار تثبت أن نصًا داخل مستند **لا يستطيع** تغيير سلوك النظام.

---

## 6. Runner & Scoring

```bash
# التشغيل السريع (كل PR)
pytest tests/library --tier 1

# المجموعة الكاملة
pytest tests/library --tier 1,2 --report=json

# مقارنة نسختين من المحرك
python -m evals.compare --baseline v0.4.2 --candidate HEAD
```

### مثال مخرَج

```
TEST CASE LIBRARY — Run 2026-07-29 · engine HEAD · rules 2026.07
──────────────────────────────────────────────────────────────
Category               Cases  Pass  Precision  Recall   Δ vs baseline
conflict_detection        68    62      0.91    0.78    +0.02 / −0.01
missing_scope             41    37      0.88    0.71    +0.00 / +0.03
missing_requirement       35    33      0.94    0.82    +0.01 / +0.00
entity_resolution         44    41      0.93     —      +0.00
document_processing       32    30       —       —      −0.00
qa                        28    26      0.89     —      +0.04
compliance                39    36      0.92    0.74    +0.01 / +0.00
──────────────────────────────────────────────────────────────
TOTAL                    287   265      0.91    0.77

✔ لا انحدار على حالات critical
✖ TC-021 فشل — دمج D-101 مع D-101A   ← BLOCKING
```

### Regression Gate (يمنع الدمج)

```
✖ فشل أي حالة priority = critical
✖ انخفاض Precision > 2%
✖ انخفاض Recall > 3%
✖ انخفاض Citation accuracy عن 98%
```

---

## 7. Building the Library — من أين تأتي الحالات

| المصدر | القيمة | الحجم المتوقع |
|--------|--------|----------------|
| **مشاكل حقيقية موثقة** ([Master PRD §15 — Stage 1](./00-MASTER-PRD.md)) | الأعلى — تعكس الواقع | 100+ |
| **False positives من الإنتاج** (`finding_feedback` = dismiss) | عالية — تحمي الـ Precision | مستمر |
| **ملاحظات رفض الجهات الرسمية** | الأعلى للمطابقة | حسب التوفر |
| **حالات مُصطنعة عدائية** | تختبر الحدود | 30% من المكتبة |
| **Bugs مبلَّغ عنها** | تمنع تكرارها | مستمر |

### الهدف الكمي

| Milestone | عدد الحالات |
|-----------|-------------|
| قبل بدء تطوير الـ AI Engine | 50 |
| قبل أول Prototype (P3) | 150 |
| قبل أول عميل | 300 |
| بعد 6 أشهر من الإطلاق | 800+ |

---

## 8. Privacy in Test Data

مطلب صارم — المكتبة تُخزَّن في مستودع الكود:

| ✅ مسموح | ❌ ممنوع |
|---------|---------|
| نصوص مُصطنعة تحاكي البنية | نص من مشروع حقيقي بلا إخفاء |
| مستندات حقيقية بعد **redaction كامل** | أسماء مشاريع/عملاء/جهات |
| بنية BOQ بأرقام مُبدَّلة | أسعار أو كميات حقيقية |
| مقاطع قصيرة من معايير مع النسبة | نسخ فصول كاملة من QCS |

**Redaction checklist:** اسم المشروع · اسم المالك · الاستشاري · المقاول · الموقع · أرقام العقود · التواريخ الفعلية · الأسعار · أسماء الأفراد · الأختام والتوقيعات.

**Tier 3** (مشاريع حقيقية) تُخزَّن في مستودع خاص منفصل بصلاحيات مقيّدة، **لا في مستودع الكود**، وتُشغَّل في بيئة معزولة.

---

## 9. Ownership

| الدور | المسؤولية |
|-------|-----------|
| **Domain Expert** | كتابة الحالة والنتيجة المتوقعة — **هو المرجع في الصواب** |
| **Engineer** | تحويلها إلى fixture قابل للتشغيل، وإصلاح الفشل |
| **QA** | صحة المكتبة، التغطية، منع التكرار |
| **الجميع** | إضافة حالة مع كل bug وكل false positive |

> **قاعدة غير قابلة للتفاوض:** لا يُدمج إصلاح لـ bug في محرك الذكاء بدون حالة اختبار تُثبت الإصلاح وتمنع عودته.
