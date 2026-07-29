# 03 — Qatar Compliance Engine

| Field | Value |
|-------|-------|
| Version | 0.1 (Draft) |
| Owner | Domain Expertise + Engineering |
| Depends on | [AI Engine](./02-AI-ENGINE.md) |

> **الميزة التنافسية الحقيقية للمنتج.** أي فريق يستطيع بناء RAG على PDF. لا أحد يستطيع بناء مكتبة اشتراطات قطر بدون خبرة ميدانية ووقت.
> هذه الوثيقة تصف **كيف تُمثَّل الاشتراطات كبيانات**، لا الاشتراطات نفسها.

---

## ⚠️ 0. Disclaimer — يجب أن يظهر في المنتج والتقارير

> **المنصة أداة مساعدة استشارية. لا تُصدر شهادة مطابقة، ولا تحل محل الجهات الرسمية، ولا تُعفي المهندس المسؤول من مسؤوليته.**
> نتائج المطابقة **مؤشرات للمراجعة** يعتمدها مهندس مرخّص. الاعتماد الرسمي يصدر من الجهة المختصة وحدها.

هذا ليس نصًا قانونيًا احتياطيًا فقط — بل قيد تصميمي: كل finding مطابقة يُصاغ كـ **"يحتاج تحقق"** لا كـ **"مخالف"**، ويُرفق بمرجع البند ليراجعه المهندس بنفسه.

---

## 1. Authorities in Scope

| Authority | المجال | أنواع الفحوصات |
|-----------|--------|-----------------|
| **QCS** — Qatar Construction Specifications | المواصفات العامة للبناء | مواد، خرسانة، تشطيبات، اختبارات، أعمال مدنية |
| **QCDD** — Qatar Civil Defence Department | السلامة من الحريق | مخارج الطوارئ، مقاومة الحريق، إنذار، إطفاء، دخان |
| **MOI SSD** — Security Systems Department | الأنظمة الأمنية | CCTV، Access Control، تخزين التسجيلات، تغطية الكاميرات |
| **KAHRAMAA** | الكهرباء والمياه | محطات تحويل، خزانات، عدادات، أحمال، خلوص |
| **Ashghal** — Public Works Authority | الأشغال العامة | البنية التحتية، الطرق، الصرف، معايير التسليم |
| **Ministry of Municipality** | التخطيط والبناء | ارتدادات، ارتفاعات، مواقف، استخدامات |
| **GSAS / GORD** | الاستدامة | تصنيف المباني الخضراء (V2) |

**أولوية V1:** QCDD ثم MOI SSD ثم KAHRAMAA — لأنها **الأكثر تسببًا في رفض الاعتماد وإعادة العمل**، والأكثر قابلية للتحقق من المستندات النصية.

---

## 2. Rule Model

كل اشتراط يُمثَّل كـ **بيانات** لا ككود. هذا يسمح لمهندس مجال (غير مبرمج) بإضافة قاعدة ومراجعتها.

```yaml
id: QCDD-FD-001
version: 1
authority: QCDD
reference:
  document: "Qatar Civil Defence Requirements"
  edition: "<<TO BE VERIFIED>>"
  clause: "<<TO BE VERIFIED>>"
  url: null

title:
  en: "Fire doors in protected escape routes require a documented fire rating"
  ar: "أبواب الحريق في مسارات الهروب المحمية تتطلب تصنيف مقاومة موثقًا"

applicability:
  building_types: [residential, commercial, office, mixed_use]
  conditions:
    - field: element.type
      op: equals
      value: door
    - field: element.qualifier
      op: contains
      value: fire_rated

check:
  type: ATTRIBUTE_REQUIRED
  attribute: fire_rating
  unit: minutes

severity: critical
evidence_required:
  - specification_clause
  - door_schedule_entry

remediation:
  en: "Specify the fire resistance rating for each fire door in the door schedule and specification."
  ar: "حدّد تصنيف مقاومة الحريق لكل باب حريق في جدول الأبواب والمواصفة."

status: draft            # draft | under_review | approved | superseded
reviewed_by: null        # يجب أن يكون مهندسًا مرخصًا قبل approved
effective_from: null
effective_to: null
```

### 2.1 أنواع الفحص (Check Types)

| Type | المعنى | مثال |
|------|--------|------|
| `ATTRIBUTE_REQUIRED` | خاصية يجب أن تكون موجودة وموثقة | باب حريق يجب أن يحمل تصنيف مقاومة |
| `ATTRIBUTE_THRESHOLD` | قيمة يجب أن تحقق شرطًا | التصنيف ≥ قيمة معيارية |
| `ELEMENT_REQUIRED` | عنصر يجب وجوده في نوع فراغ معيّن | إنارة طوارئ في مسارات الهروب |
| `SYSTEM_REQUIRED` | نظام يجب وجوده حسب نوع/حجم المبنى | نظام إنذار حريق |
| `DOCUMENT_REQUIRED` | مستند يجب تقديمه للاعتماد | شهادة اختبار معتمدة للمادة |
| `RATIO_LIMIT` | نسبة أو عدد نسبةً لمساحة/سعة | عدد وحدات نسبةً للمساحة |
| `COVERAGE` | تغطية فراغات محددة | تغطية الكاميرات للمداخل |
| `CROSS_REFERENCE` | إحالة صحيحة لمعيار | البند يشير إلى معيار سارٍ |

> **ملاحظة على القيم:** الحقول المعلَّمة `<<TO BE VERIFIED>>` **ليست نقصًا في الوثيقة، بل قاعدة عمل**: لا تُكتب قيمة عددية لاشتراط في المكتبة إلا منقولة من نص المرجع الرسمي وموثّقة برقم بند، ومعتمدة من مهندس مرخص. القيم المخمَّنة أخطر من غياب القاعدة.

---

## 3. Applicability Engine

القاعدة لا تُطبَّق على كل مشروع. يُحدَّد ملف تعريف المشروع أولًا:

```json
{
  "building_type": "commercial",
  "occupancy": "office",
  "floors_above_ground": 12,
  "floors_below_ground": 2,
  "gross_floor_area_m2": 18500,
  "height_m": 48,
  "has_basement_parking": true,
  "has_public_assembly": false
}
```

هذه الخصائص تُستخرج من العقد / ER / الرسومات، وما لا يُستخرج بثقة **يُسأل عنه المستخدم صراحةً** في شاشة إعداد المشروع (5–8 أسئلة، مرة واحدة).

```python
def applicable_rules(project: ProjectProfile, rules: list[Rule]) -> list[Rule]:
    return [
        r for r in rules
        if r.status == "approved"
        and r.is_effective_on(project.reference_date)
        and (not r.applicability.building_types
             or project.building_type in r.applicability.building_types)
        and all(cond.evaluate(project) for cond in r.applicability.project_conditions)
    ]
```

**تطبيق قاعدة غير منطبقة أسوأ من عدم تطبيقها** — لأنه يُنتج ضجيجًا يُفقد المستخدم ثقته في كل التقرير.

---

## 4. Rule Authoring Workflow

```mermaid
flowchart LR
    A[Domain Expert<br/>يكتب المسودة] --> B[Rule Editor UI]
    B --> C[Validation<br/>schema + مرجع إلزامي]
    C --> D[Test against<br/>Test Case Library]
    D --> E[Licensed Engineer<br/>Review]
    E -->|approved| F[Published<br/>مع effective_from]
    E -->|rejected| A
    F --> G[Runs in Production]
```

### قواعد الحوكمة

1. **لا قاعدة تُنشر بدون `reference.clause`** — أي بند مصدر محدد.
2. **لا قاعدة تُنشر بدون اعتماد مهندس مرخص** (`reviewed_by`).
3. **كل قاعدة تُختبر** على حالة اختبار إيجابية وأخرى سلبية قبل النشر.
4. **التعديل ينشئ نسخة جديدة** (`version + 1`)، ولا يُعدَّل السجل القديم — لأن تقارير قديمة صدرت بناءً عليه.
5. **`effective_from` / `effective_to`** — الاشتراطات تتغير، والمشروع يُقاس باشتراطات تاريخ إصداره.

---

## 5. Copyright & Legal Constraint

المعايير الرسمية (QCS وغيرها) **مواد محمية بحقوق نشر**. لذلك:

| ✅ مسموح | ❌ ممنوع |
|---------|---------|
| تخزين **مرجع البند** (رقم ومسمّى) | نسخ نص المعيار حرفيًا في قاعدة البيانات |
| صياغة **الشرط المنطقي** كبيانات (attribute + operator + value) | إعادة نشر المعيار للمستخدمين |
| اقتباس قصير جدًا عند الضرورة مع النسبة | جعل المنصة بديلًا عن شراء المعيار |
| توجيه المستخدم للمصدر الرسمي | إخفاء مصدر الاشتراط |

**التقرير يُظهر:** "قد يخالف اشتراط QCDD — البند X.Y. يُرجى مراجعة النص الرسمي." ولا يُظهر نص المعيار.

هذا قرار يحتاج **مراجعة قانونية قطرية قبل الإطلاق التجاري** (مذكور كسؤال مفتوح في [Master PRD §19](./00-MASTER-PRD.md)).

---

## 6. Example Rule Set (Structure Only)

أمثلة **توضيحية للبنية** — القيم العددية والمراجع تُملأ من المصدر الرسمي بواسطة مهندس مرخص:

```yaml
# --- QCDD (Fire Safety) ---
- id: QCDD-FD-001
  check: {type: ATTRIBUTE_REQUIRED, attribute: fire_rating}
  applies_to: {element_type: door, qualifier: fire_rated}
  severity: critical

- id: QCDD-FD-002
  check: {type: ATTRIBUTE_REQUIRED, attribute: self_closing_device}
  applies_to: {element_type: door, qualifier: fire_rated}
  severity: high

- id: QCDD-SIG-001
  check: {type: ELEMENT_REQUIRED, element_type: exit_signage}
  applies_to: {space_type: escape_route}
  severity: critical

- id: QCDD-EL-001
  check: {type: ELEMENT_REQUIRED, element_type: emergency_lighting}
  applies_to: {space_type: escape_route}
  severity: critical

- id: QCDD-SYS-001
  check: {type: SYSTEM_REQUIRED, system: fire_alarm}
  applies_to: {building_type: [commercial, office, residential]}
  severity: critical

# --- MOI SSD (Security) ---
- id: SSD-CCTV-001
  check: {type: COVERAGE, system: cctv, target_spaces: [main_entrance, exit, lobby]}
  severity: high

- id: SSD-CCTV-002
  check: {type: ATTRIBUTE_REQUIRED, attribute: recording_retention_days}
  applies_to: {system: cctv}
  severity: high

- id: SSD-AC-001
  check: {type: SYSTEM_REQUIRED, system: access_control}
  applies_to: {space_type: [server_room, electrical_room, control_room]}
  severity: medium

# --- KAHRAMAA (Power & Water) ---
- id: KM-SUB-001
  check: {type: ATTRIBUTE_REQUIRED, attribute: substation_clearance}
  applies_to: {element_type: substation}
  severity: high

- id: KM-TANK-001
  check: {type: ATTRIBUTE_REQUIRED, attribute: water_tank_capacity}
  applies_to: {element_type: water_tank}
  severity: high

# --- QCS (General Specifications) ---
- id: QCS-CONC-001
  check: {type: DOCUMENT_REQUIRED, document_type: material_submittal}
  applies_to: {material: concrete}
  severity: medium

- id: QCS-REF-001
  check: {type: CROSS_REFERENCE, target: qcs_section}
  applies_to: {document_type: specification}
  severity: low
```

---

## 7. Compliance Finding Format

```json
{
  "id": "F-2291",
  "type": "COMPLIANCE_VIOLATION",
  "rule_id": "QCDD-FD-001",
  "rule_version": 1,
  "authority": "QCDD",
  "reference": "Qatar Civil Defence Requirements — clause <<ref>>",
  "severity": "critical",
  "confidence": 0.91,
  "status": "needs_verification",
  "title": {
    "en": "Fire doors without a documented fire rating",
    "ar": "أبواب حريق بدون تصنيف مقاومة موثق"
  },
  "affected_elements": ["FD-07", "FD-08", "FD-11"],
  "detail": {
    "en": "3 doors are identified as fire rated in the door schedule but no fire resistance rating is stated in the schedule or the specification.",
    "ar": "٣ أبواب مصنّفة كأبواب حريق في جدول الأبواب دون ذكر تصنيف مقاومة الحريق في الجدول أو المواصفة."
  },
  "evidence": [
    {"document": "Architectural Drawings.pdf", "page": 41, "bbox": [120,340,480,392],
     "raw_text": "FD-07 | 1000x2100 | Fire rated | Corridor L2"},
    {"document": "Specification Rev C.pdf", "page": 214, "section": "08 14 00 / 2.3",
     "raw_text": "…doors shall comply with local authority requirements…"}
  ],
  "remediation": {
    "en": "State the required fire resistance rating for each fire door in the door schedule and the specification.",
    "ar": "حدّد تصنيف مقاومة الحريق المطلوب لكل باب حريق في جدول الأبواب والمواصفة."
  },
  "disclaimer": "advisory_only"
}
```

---

## 8. Compliance Report

مُنظَّم **حسب الجهة** — لأن الاعتماد يتم لدى كل جهة على حدة:

```
QATAR COMPLIANCE REPORT
Project: <name>          Date: <date>          Rule library version: 2026.07

────────────────────────────────────────────
QCDD — Civil Defence
  Rules evaluated:   34
  Needs verification: 6   (2 critical, 3 high, 1 medium)
  Not assessable:     4   (بيانات غير كافية — انظر التفاصيل)
  No issue found:    24

  ⚠ CRITICAL  QCDD-FD-001  Fire doors without documented fire rating   → 3 elements
  ⚠ CRITICAL  QCDD-EL-001  Emergency lighting not shown in 2 escape routes
  …
────────────────────────────────────────────
MOI SSD — Security Systems
  …
────────────────────────────────────────────
KAHRAMAA
  …
────────────────────────────────────────────
NOT ASSESSABLE — بيانات غير كافية
  QCDD-XX-00X  يتطلب مخطط مسارات الهروب — غير مرفوع
  …
```

> **قسم "Not Assessable" إلزامي.** إخفاء ما لم يُفحص يوهم المستخدم بتغطية كاملة — وهذا أخطر من finding خاطئ.

---

## 9. Extensibility to Other Markets

بنية المحرك مستقلة عن السوق. التوسّع = إضافة **rule pack** جديد:

```
rule_packs/
  qatar/
    qcdd.yaml
    moi_ssd.yaml
    kahramaa.yaml
    qcs.yaml
    ashghal.yaml
  ksa/          # V3+
  uae/          # V3+
```

كل rule pack يحمل: `market`, `authority`, `version`, `effective_from`, `reviewed_by`.
**الكود لا يتغير عند دخول سوق جديد** — فقط البيانات والاعتماد الهندسي.

---

## 10. Building the Library — خطة عملية

المكتبة تُبنى بشرًا لا آليًا. الترتيب المقترح:

| Phase | المحتوى | المقياس |
|-------|---------|---------|
| **P1** | أعلى 30 اشتراطًا تسبب رفض الاعتماد (من خبرة ميدانية) | 30 قاعدة معتمدة |
| **P2** | تغطية QCDD الأساسية | 80 قاعدة |
| **P3** | MOI SSD + KAHRAMAA | 150 قاعدة |
| **P4** | QCS بالأقسام الأكثر استخدامًا | 300 قاعدة |

**مصادر البناء:**
1. خبرة الفريق الميدانية (الأسرع والأثمن).
2. ملاحظات الرفض السابقة من الجهات على مشاريع حقيقية — **أثمن مصدر على الإطلاق**، لأنها تُظهر ما يُرفض فعلًا لا ما هو مكتوب فقط.
3. النصوص الرسمية للمعايير.
4. مقابلات المهندسين ([Master PRD §15 — Stage 2](./00-MASTER-PRD.md)).

> **مؤشر النضج:** حين تصبح المكتبة قادرة على التنبؤ بملاحظات الجهة قبل التقديم، يصبح المنتج لا غنى عنه — وهذا هو الهدف الحقيقي، لا عدد القواعد.
