# 01 — Document Processing

| Field | Value |
|-------|-------|
| Version | 0.1 (Draft) |
| Owner | Backend / ML Engineering |
| Depends on | [Master PRD](./00-MASTER-PRD.md) |
| Consumed by | [AI Engine](./02-AI-ENGINE.md) |

> **مسؤولية هذه الطبقة:** تحويل ملف خام إلى **محتوى منظم مع Provenance كامل**.
> لا تفهم، لا تستنتج، لا تحكم. فقط تقرأ بدقة وتقول بصدق ما لم تستطع قراءته.

---

## 1. Pipeline Overview

```mermaid
flowchart TD
    A[Upload] --> B[Validate & Virus Scan]
    B --> C[Deduplicate by Hash]
    C --> D[Detect File Type]
    D --> E{PDF?}
    E -->|Yes| F[Detect Text Layer]
    E -->|No| G[Native Extractor<br/>docx / xlsx]
    F -->|Has text| H[Native PDF Extraction]
    F -->|Scanned| I[Image Preprocessing]
    I --> J[OCR ar+en]
    H --> K[Layout Analysis]
    J --> K
    G --> K
    K --> L[Table Extraction]
    K --> M[Block Segmentation]
    L --> N[Normalization<br/>units, numbers, tags]
    M --> N
    N --> O[Document Classification]
    O --> P[Chunking & Indexing]
    P --> Q[Document Health Check]
    Q --> R[(Ready for AI Engine)]
```

كل مرحلة تُنفَّذ كـ **job مستقل** قابل لإعادة التشغيل بمفرده، وتكتب مخرجاتها إلى قاعدة البيانات قبل تسليم المرحلة التالية. فشل مرحلة على ملف واحد لا يُسقط المشروع كله.

---

## 2. Ingestion & Validation

### 2.1 قيود الرفع

| Constraint | V1 Value | ملاحظة |
|------------|----------|--------|
| Max file size | 500 MB | رسومات معمارية كبيرة |
| Max files per upload | 200 | رفع مجلد كامل |
| Max pages per project | 20,000 | حد ناعم مع تنبيه |
| Allowed extensions | `.pdf .docx .doc .xlsx .xls .csv` | ما عداها يُرفض بوضوح |

### 2.2 خطوات التحقق

1. **Extension + MIME sniffing** — لا يُوثَق بالامتداد وحده.
2. **Virus scan** (ClamAV أو ما يعادله) — قبل أي فتح للملف.
3. **PDF sanity** — عدد الصفحات، هل الملف مشفّر/محمي بكلمة مرور؟ (إن كان محميًا: طلب صريح من المستخدم، لا محاولة كسر).
4. **SHA-256 hash** — منع تكرار نفس الملف داخل المشروع، وربط الملف المكرر بالنسخة المعالَجة بدلًا من إعادة المعالجة.

### 2.3 Revision Handling

المستندات تصدر بإصدارات (Rev A, Rev B, IFC Rev 2…). النظام:

- يستخرج **Document Number** و **Revision** من Title Block أو اسم الملف أو الترويسة.
- يجمع الإصدارات تحت `document_family`.
- يُعلّم الإصدار الأحدث بـ `is_current = true` والباقي `superseded`.
- **المراجعة تعمل على الإصدار الحالي فقط**، لكن التقارير تُظهر متى تغيّر البند بين إصدارين (Change Awareness).

> **قاعدة:** إذا تعذّر تحديد الإصدار الأحدث بثقة، يسأل النظام المستخدم صراحةً بدل أن يخمّن. مراجعة مبنية على رسمة ملغاة أسوأ من عدم المراجعة.

---

## 3. Text Layer Detection

قرار جوهري يحدد مسار الملف كله:

```python
def classify_pdf_page(page) -> Literal["digital", "scanned", "hybrid"]:
    chars = len(page.extract_text() or "")
    images = page.image_area_ratio()          # نسبة مساحة الصور من الصفحة

    if chars > 200 and images < 0.5:
        return "digital"
    if chars < 50 and images > 0.5:
        return "scanned"
    return "hybrid"       # نص + صور ممسوحة → مسار مزدوج
```

- **digital** → استخراج مباشر (أدق وأسرع وأرخص).
- **scanned** → preprocessing ثم OCR.
- **hybrid** → استخراج النص الرقمي **و** OCR للمناطق الصورية، ثم دمج مع إزالة التكرار.

القرار يُتخذ **لكل صفحة** لا لكل ملف — كثير من المستندات تخلط صفحات رقمية مع مرفقات ممسوحة.

---

## 4. Image Preprocessing (قبل OCR)

| Step | الغرض | ملاحظات |
|------|-------|---------|
| Rasterize @ 300 DPI | دقة كافية للنص الصغير | 400 DPI للرسومات كثيفة النص |
| Deskew | تصحيح ميلان السكانر | حرج للجداول |
| Denoise | إزالة تشويش الصور الرمادية | لا يُطبَّق على الرسومات الخطية بقوة |
| Binarization (Adaptive/Sauvola) | فصل النص عن الخلفية | يُتخطى إذا كانت الصورة نظيفة |
| Contrast normalization | نسخ باهتة | — |
| Auto-rotate | صفحات مقلوبة أو landscape | كشف الاتجاه قبل OCR |

**قياس جودة الصفحة قبل OCR** — يُخزَّن كـ `page.scan_quality ∈ [0,1]` ويُستخدم في Health Check:

```
scan_quality = f(resolution, contrast, skew_angle, noise_level, blur_variance)
```

---

## 5. OCR Strategy

### 5.1 المتطلبات

- **عربي + إنجليزي في نفس الصفحة** — شائع جدًا في مستندات قطر.
- إخراج **إحداثيات (bounding box)** لكل كلمة — بدونها لا يوجد Evidence Viewer.
- **درجة ثقة لكل كلمة** — تُجمَّع إلى ثقة السطر والكتلة والصفحة.

### 5.2 خيارات المحرك

| Engine | متى يُستخدم | ملاحظات |
|--------|-------------|---------|
| **Tesseract** (`ara+eng`) | الافتراضي، on-prem، مجاني | جيد على النص النظيف، ضعيف على الجداول المعقدة |
| **PaddleOCR** | نص عربي صعب، layout معقد | أداء أفضل على الأعمدة المتعددة |
| **Cloud Document AI** (Azure/Google) | الجودة القصوى، SaaS فقط | **ممنوع** في وضع On-Premises أو للمشاريع المصنّفة |
| **Vision LLM** | صفحات فشل فيها OCR التقليدي | مكلف — يُستخدم كـ fallback مُقيَّد بعدد صفحات |

> **قرار معماري:** الـ OCR خلف واجهة `OCRProvider` واحدة. تبديل المحرك = تغيير config، لا تغيير كود. لأن وضع On-Premises سيفرض محركًا مختلفًا عن وضع SaaS.

### 5.3 معالجة اللغة المختلطة

- كشف اتجاه النص لكل سطر (RTL/LTR) وتخزينه.
- عدم خلط الترتيب المنطقي بالترتيب البصري — يُخزَّن النص بالترتيب **المنطقي** (Unicode logical order).
- الأرقام العربية-الهندية (٠١٢٣) تُطبَّع إلى أرقام لاتينية في طبقة الـ normalization مع الاحتفاظ بالنص الأصلي.

---

## 6. Layout Analysis & Block Segmentation

تقسيم الصفحة إلى كتل مصنّفة:

| Block Type | مثال |
|------------|------|
| `heading` | "SECTION 08 14 00 — WOOD DOORS" |
| `paragraph` | نص المواصفة |
| `list_item` | بنود مرقّمة |
| `table` | جدول BOQ أو Door Schedule |
| `figure` | رسم أو صورة |
| `title_block` | بلوك العنوان في الرسومات |
| `revision_table` | جدول المراجعات في الرسومة |
| `stamp` | ختم اعتماد |
| `header_footer` | ترويسة/تذييل متكرر — يُستبعد من الفهرسة |

**استخراج التسلسل الهرمي للأقسام** مهم بشكل خاص للمواصفات (CSI MasterFormat):

```
Division 08 — Openings
  Section 08 14 00 — Wood Doors
    Part 2 — Products
      2.3 — Fire Rated Doors
        A. Fire rating shall be not less than 60 minutes...
```

هذا التسلسل يُخزَّن في `block.section_path` ويُستخدم لاحقًا كـ citation دقيق (`Spec §08 14 00 / 2.3.A`) بدل "صفحة 214" فقط.

---

## 7. Table Extraction

أصعب جزء تقنيًا وأعلاه قيمة — لأن **الـ BOQ جدول**، و **Door Schedule جدول**، و **Load Schedule جدول**.

### 7.1 الاستراتيجية حسب المصدر

| المصدر | الطريقة |
|--------|---------|
| Excel | قراءة مباشرة (openpyxl) — الأدق، مع الحفاظ على الصيغ والدمج |
| PDF رقمي بخطوط جدول | Line detection (Camelot lattice / pdfplumber) |
| PDF رقمي بدون خطوط | Whitespace clustering (Camelot stream) + محاذاة الأعمدة |
| PDF ممسوح | كشف الخطوط بعد OCR + تجميع الكلمات حسب الإحداثيات |
| فشل الكل | Vision LLM على صورة الجدول → JSON، مع confidence منخفض إلزاميًا |

### 7.2 معالجة ما بعد الاستخراج

- **Header detection** — الصف الأول ليس دائمًا الترويسة؛ الجداول الممتدة عبر صفحات تكرر الترويسة.
- **Multi-page tables** — دمج الجداول المتصلة عبر الصفحات (نفس عدد الأعمدة + نفس الترويسة + تسلسل الصفحات).
- **Merged cells** — تعبئة القيم المدمجة نزولًا (forward fill) مع تعليمها.
- **Hierarchical BOQ** — بنود رئيسية وفرعية (`8`, `8.14`, `8.14.03`) تُحوَّل إلى شجرة عبر تحليل رقم البند والإزاحة.

### 7.3 BOQ Canonical Mapping

ترويسات الـ BOQ تختلف بين المشاريع. يُبنى mapping من الترويسة الفعلية إلى schema موحّد:

```yaml
canonical_boq_columns:
  item_no:     ["Item", "Item No", "Ref", "Code", "البند", "رقم البند"]
  description: ["Description", "Item Description", "الوصف", "البيان"]
  unit:        ["Unit", "UOM", "الوحدة"]
  quantity:    ["Qty", "Quantity", "الكمية"]
  rate:        ["Rate", "Unit Price", "السعر", "سعر الوحدة"]
  amount:      ["Amount", "Total", "الإجمالي", "القيمة"]
```

المطابقة: تطبيع نصي → مطابقة تامة → مطابقة ضبابية (fuzzy ≥ 0.85) → إن فشلت: **سؤال المستخدم** عبر واجهة column mapping بسيطة. لا تخمين صامت على عمود مالي.

### 7.4 Table Sanity Checks

فحوصات حسابية تكشف أخطاء الاستخراج فورًا:

```
quantity × rate ≈ amount        (tolerance 0.5%)
Σ(subtotals) ≈ section total
كل الوحدات ضمن قائمة الوحدات المعروفة (m, m², m³, No., LS, kg, ton, ...)
```

فشل هذه الفحوصات ⇒ خفض ثقة الجدول ⇒ Review Queue. **لا يُبنى finding مالي على جدول فشل حسابه.**

---

## 8. Drawing PDF Extraction

الرسومات (IFC / Shop Drawings) لها معالجة خاصة في V1 — نصية لا هندسية:

| ما يُستخرج | كيف | القيمة |
|-----------|-----|--------|
| **Title Block** | كشف المنطقة (عادة يمين/أسفل) + OCR مُوجَّه | Sheet No, Title, Rev, Date, Discipline, Scale |
| **Revision Table** | جدول داخل الرسمة | تاريخ ووصف كل مراجعة |
| **Drawing Schedules** | جداول داخل الرسمة (Door/Window/Room Schedule) | مصدر ذهبي للعناصر وخصائصها |
| **Annotations & Tags** | نصوص متفرقة (`D-101`, `FD-07`, `100mm`) | ربط العناصر بالرسومة |
| **Legend & Notes** | كتل نصية معيارية | رموز ومعانيها، General Notes |
| **Grid references** | محاور الشبكة (A-H, 1-12) | تحديد الموقع التقريبي للعنصر |

### ما لا يُستخرج في V1 (بصراحة)

- الهندسة (geometry) — الأبعاد المرسومة، المساحات، المسارات.
- العلاقات المكانية الحقيقية (هل الباب داخل هذه الغرفة فعلًا؟).
- الرموز الرسومية غير المصحوبة بنص.

> هذا القيد يجب أن يكون **واضحًا في الواجهة**: النظام في V1 يقرأ ما هو **مكتوب** على الرسمة، لا ما هو **مرسوم**. القدرة الهندسية تأتي مع IFC Model في V2.

---

## 9. Document Classification

تصنيف كل مستند تلقائيًا إلى نوع، بمنهج هجين (لا ML وحده):

```
1. Filename signals      — "BOQ", "Spec", "ER", "SD-", "A-201", "MOM"
2. Structural signals    — وجود title block ⇒ رسمة؛ جدول بأعمدة Qty/Rate ⇒ BOQ
3. Keyword density       — تكرار مصطلحات مميزة في أول/آخر صفحات
4. LLM classification    — على عينة نصية عند تعارض الإشارات
5. User override         — المستخدم يصحح، والنظام يتعلم القاعدة على مستوى الـ organization
```

### أنواع المستندات (V1)

`contract` · `employer_requirements` · `scope_of_work` · `specification` · `boq` · `drawing_ifc` · `drawing_shop` · `material_submittal` · `rfi` · `mom` · `inspection_report` · `schedule` · `correspondence` · `other`

**الإخراج:** `{type, confidence, signals[]}`. إذا كانت الثقة < 0.7 → يُعرض على المستخدم للتأكيد في شاشة الرفع، لأن التصنيف الخاطئ يُفسد كل ما بعده.

---

## 10. Normalization

طبقة حاسمة — **بدونها لا يمكن مقارنة أي شيء بأي شيء**:

| النوع | المدخل | المخرَج |
|-------|--------|---------|
| Units | `100mm`, `100 mm`, `10cm`, `0.1m` | `{value: 100, unit: "mm", si: 0.1}` |
| Numbers | `1,250.50`, `١٢٥٠٫٥` | `1250.50` |
| Dimensions | `900x2100`, `900 × 2100 mm` | `{w: 900, h: 2100, unit: "mm"}` |
| Fire rating | `FR60`, `60 min`, `1 hour`, `60/60/60` | `{minutes: 60}` |
| Element tags | `D101`, `D-101`, `D 101`, `d-101` | `D-101` (canonical) |
| Dates | `12/03/2025`, `12 Mar 2025` | `2025-03-12` |
| Currency | `QAR 1,000`, `1000 QR` | `{amount: 1000, currency: "QAR"}` |

**قاعدة إلزامية:** النص الأصلي (`raw_text`) يُحفظ دائمًا بجانب القيمة المطبَّعة. عرض الدليل للمستخدم يستخدم النص الأصلي؛ المقارنة تستخدم القيمة المطبَّعة.

**تحذير على تطبيع الوسوم (tags):** التطبيع العدواني يدمج عناصر مختلفة (`D-101` و `D101A`). القاعدة: التطبيع يوحّد **الفواصل وحالة الأحرف فقط**، ولا يحذف لواحق. أي دمج أعمق يتم في طبقة Entity Resolution بدرجة ثقة، لا هنا.

---

## 11. Chunking & Indexing

للبحث الدلالي وللـ RAG:

| Parameter | Value | السبب |
|-----------|-------|-------|
| Chunk size | ~800 tokens | يوازن السياق والدقة |
| Overlap | 15% | لا تُقطع الجملة الحاكمة |
| Boundary | حدود الأقسام أولًا | لا يُقسَّم بند مواصفة عبر chunks |
| Table handling | الجدول = chunk واحد (أو صف واحد للجداول الضخمة) + الترويسة مكررة | الصف بلا ترويسة بلا معنى |

**كل chunk يحمل metadata إلزاميًا:**

```json
{
  "document_id": "…",
  "document_type": "specification",
  "page_from": 214,
  "page_to": 215,
  "section_path": "Division 08 / 08 14 00 / Part 2 / 2.3",
  "language": "en",
  "confidence": 0.94,
  "bbox": [72, 340, 523, 610]
}
```

بدون هذه الـ metadata لا يمكن إنتاج citation — وبدون citation لا يُعرض أي finding (المبدأ #1).

---

## 12. Provenance Model

**العمود الفقري للثقة في المنتج.** كل معلومة في النظام قابلة للتتبع حتى البكسل:

```
Finding
  └─ Evidence[]
       ├─ document_id      →  "Specification Rev C.pdf"
       ├─ page_number      →  214
       ├─ bbox             →  [x0, y0, x1, y1]
       ├─ section_path     →  "08 14 00 / 2.3.A"
       ├─ raw_text         →  "…shall be not less than 60 minutes…"
       ├─ extraction_method→  "native_pdf" | "ocr_tesseract" | "vision_llm"
       └─ confidence       →  0.94
```

هذا يسمح بـ:
- عرض الصفحة مع تمييز (highlight) الموقع بالضبط في الـ Evidence Viewer.
- تدقيق المستخدم لأي نتيجة في ثوانٍ.
- تتبّع أي خطأ حتى مصدره (خطأ OCR؟ خطأ استخراج جدول؟ خطأ استنتاج؟).

---

## 13. Document Health Check — Specification

يُنتَج فور انتهاء المعالجة وقبل عرض أي finding:

```json
{
  "project_id": "…",
  "summary": {
    "files_total": 27,
    "files_processed": 27,
    "files_failed": 0,
    "pages_total": 520,
    "pages_read_ok": 499,
    "pages_low_quality": 18,
    "pages_unreadable": 3,
    "tables_detected": 47,
    "tables_low_confidence": 4,
    "languages": ["ar", "en"],
    "pages_needing_review": 12
  },
  "by_document": [
    {
      "document_id": "…",
      "name": "Specification Rev C.pdf",
      "type": "specification",
      "type_confidence": 0.96,
      "pages": 214,
      "extraction_method": "native_pdf",
      "avg_confidence": 0.98,
      "issues": []
    },
    {
      "document_id": "…",
      "name": "Architectural Drawings.pdf",
      "type": "drawing_ifc",
      "type_confidence": 0.88,
      "pages": 96,
      "extraction_method": "ocr_tesseract",
      "avg_confidence": 0.71,
      "issues": [
        {"page": 44, "code": "LOW_SCAN_QUALITY", "detail": "scan_quality 0.31"},
        {"page": 57, "code": "NO_TEXT_EXTRACTED", "detail": "0 characters"}
      ]
    }
  ],
  "coverage_warning": "3 صفحات لم تُقرأ — نتائج المراجعة قد لا تشملها"
}
```

### قواعد العرض

- الصفحات غير المقروءة تُعرض **بأسمائها وأرقامها**، لا كرقم مجمّع.
- زر مباشر: "عرض الصفحة" و "رفع نسخة أوضح".
- **تحذير دائم في التقرير النهائي** إذا تجاوزت الصفحات غير المقروءة 2% — ولا يُخفى.

---

## 14. Confidence Model

```
page_confidence   = weighted_avg(word_confidences) × scan_quality_factor
block_confidence  = page_confidence × structure_certainty
table_confidence  = block_confidence × sanity_check_pass_rate
value_confidence  = table_confidence × normalization_certainty
```

| Range | التصنيف | السلوك |
|-------|---------|--------|
| ≥ 0.90 | High | يُستخدم في الـ Findings مباشرة |
| 0.70 – 0.89 | Medium | يُستخدم، ويُعلَّم في التقرير بـ "تحقق مطلوب" |
| 0.50 – 0.69 | Low | **لا يُنتِج finding**؛ يذهب إلى Review Queue |
| < 0.50 | Unusable | يُبلَّغ عنه في Health Check فقط |

> **قاعدة صارمة:** لا يُبنى finding عالي الشدة على دليل منخفض الثقة. الشدة النهائية للـ finding مُقيَّدة بسقف ثقة دليلها.

---

## 15. Manual Review Queue

كل ما لم يُقرأ بثقة كافية يذهب إلى طابور مراجعة بشرية:

| نوع المهمة | ما يفعله المستخدم |
|------------|-------------------|
| `CONFIRM_DOCUMENT_TYPE` | تأكيد أو تصحيح تصنيف مستند |
| `MAP_TABLE_COLUMNS` | ربط أعمدة BOQ غير المتعرّف عليها |
| `VERIFY_EXTRACTED_VALUE` | تأكيد قيمة مستخرجة بثقة منخفضة |
| `RE_UPLOAD_PAGE` | رفع نسخة أوضح لصفحة |
| `CONFIRM_CURRENT_REVISION` | تحديد الإصدار الساري |

كل تصحيح بشري يُخزَّن كـ **ground truth**، ويُستخدم لاحقًا في تحسين قواعد الاستخراج ولإثراء [Test Case Library](./07-TEST-CASE-LIBRARY.md).

---

## 16. Performance Targets

| Metric | Target |
|--------|--------|
| PDF رقمي — استخراج | ≥ 20 صفحة/ثانية/worker |
| PDF ممسوح — OCR | ≥ 1 صفحة/ثانية/worker (300 DPI) |
| مشروع 500 صفحة (مختلط) | ≤ 30 دقيقة end-to-end |
| زمن ظهور Health Check | ≤ 5 دقائق من بدء المعالجة |
| Retry على فشل مرحلة | 3 محاولات مع backoff أُسّي |

**المعالجة تدريجية (streaming):** المستخدم يرى تقدّم كل ملف على حدة، ويستطيع بدء طرح الأسئلة على الملفات المكتملة قبل انتهاء الباقي.

---

## 17. Failure Modes

| Failure | السلوك المطلوب |
|---------|----------------|
| PDF محمي بكلمة مرور | طلب كلمة المرور صراحةً من المستخدم — لا محاولة كسر |
| PDF تالف | إبلاغ واضح + طلب إعادة الرفع، والمشروع يكمل بباقي الملفات |
| ملف ضخم جدًا (> 500MB) | تقسيم تلقائي إن أمكن، وإلا رفض مع تفسير |
| OCR يفشل كليًا على صفحة | تسجيل `NO_TEXT_EXTRACTED` + fallback إلى Vision LLM (ضمن حد مسموح) |
| ملف بلغة غير مدعومة | إبلاغ ومعالجة أفضل-جهد مع تعليم واضح |
| نفاد مهلة المعالجة | حفظ ما اكتمل + استئناف من آخر مرحلة ناجحة (idempotent jobs) |

**المبدأ الحاكم للأعطال:** الفشل الصامت ممنوع. أي محتوى لم يُقرأ يجب أن يظهر في Health Check وفي تحذير التقرير النهائي.

---

## 18. Interface to AI Engine

المخرَج النهائي لهذه الطبقة — العقد بين Document Processing و [AI Engine](./02-AI-ENGINE.md):

```typescript
interface ProcessedDocument {
  id: string;
  project_id: string;
  name: string;
  type: DocumentType;
  type_confidence: number;
  revision: string | null;
  is_current: boolean;
  page_count: number;
  language: ("ar" | "en")[];
  blocks: Block[];
  tables: Table[];
  chunks: Chunk[];
  health: DocumentHealth;
}

interface Block {
  id: string;
  page: number;
  bbox: [number, number, number, number];
  type: BlockType;
  text: string;              // raw
  normalized_text: string;
  section_path: string | null;
  language: "ar" | "en" | "mixed";
  confidence: number;
  extraction_method: ExtractionMethod;
}

interface Table {
  id: string;
  pages: number[];
  headers: string[];
  canonical_mapping: Record<string, string>;  // header → canonical field
  rows: Cell[][];
  confidence: number;
  sanity_checks: { name: string; passed: boolean; detail?: string }[];
}

interface Cell {
  raw: string;
  value: number | string | null;
  unit: string | null;
  bbox: [number, number, number, number];
  confidence: number;
}
```

هذا العقد مستقر. أي تغيير عليه يتطلب تحديث [AI Engine](./02-AI-ENGINE.md) و [Database Design](./05-DATABASE-DESIGN.md) في نفس الـ PR.
