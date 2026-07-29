# 00 — Master PRD
## AI Construction Intelligence Platform

| Field | Value |
|-------|-------|
| Document | Master Product Requirements Document |
| Version | 0.1 (Draft) |
| Status | Discovery & Specification |
| Owner | Product |
| Related | [01](./01-DOCUMENT-PROCESSING.md) · [02](./02-AI-ENGINE.md) · [03](./03-QATAR-COMPLIANCE-ENGINE.md) · [04](./04-DASHBOARD-UX.md) · [05](./05-DATABASE-DESIGN.md) · [06](./06-SYSTEM-ARCHITECTURE.md) · [07](./07-TEST-CASE-LIBRARY.md) |

---

## 1. Vision

بناء منصة ذكاء اصطناعي متخصصة في قطاع البناء، تبدأ بالسوق القطري، وتعمل كـ **مراجع ذكي** يفهم جميع مستندات المشروع ويربطها معًا لاكتشاف الأخطاء والتعارضات والنواقص **قبل** أن تتحول إلى تأخير أو Variation Orders أو Claims.

> المنصة ليست ChatGPT يقرأ ملفات. بل محرك ذكاء يبني نموذجًا كاملًا للمشروع.

الهدف النهائي أن تصبح المنصة **"العقل الرقمي للمشروع"** الذي يساعد المالك والاستشاري والمقاول على اتخاذ قرارات أسرع وأدق، وتقليل الأخطاء قبل تنفيذها على أرض الواقع.

---

## 2. The Problem

في كل مشروع بناء توجد عشرات المستندات:

| Category | Documents |
|----------|-----------|
| Commercial | Contract, BOQ, Scope of Work |
| Requirements | Employer Requirements (ER), Specifications |
| Design | IFC Drawings, Shop Drawings, Schedules |
| Execution | Material Submittals, RFIs, MOMs, Inspection Reports |

**كل مستند يُراجَع بشكل منفصل، وبواسطة شخص مختلف، وفي وقت مختلف.**

ولا توجد اليوم منصة تفهم العلاقة بين جميع هذه المستندات وتكتشف التعارضات تلقائيًا.

### النتيجة

```
Design Conflicts  →  Rework
Missing Scope     →  Variation Orders
Missing Specs     →  Claims
                  →  Delays
                  →  زيادة التكلفة
```

### لماذا المشكلة مكلفة تحديدًا

- التعارض يُكتشف عادة **أثناء التنفيذ** لا أثناء المراجعة — وتكلفة إصلاحه في هذه المرحلة أضعاف تكلفة اكتشافه مبكرًا.
- المراجعة اليدوية الشاملة (Spec ضد Drawings ضد BOQ) تستغرق أسابيع من وقت مهندسين أقدمين، ولا تُنجَز غالبًا بشكل كامل.
- العنصر الناقص في الـ BOQ لا يظهر إلا عند المطالبة به — أي بعد فوات وقت التفاوض المريح.

---

## 3. The Solution

يرفع المستخدم ملفات المشروع، ويقوم النظام تلقائيًا بـ:

```mermaid
flowchart LR
    A[Upload Files] --> B[Read & Extract<br/>Text + Tables]
    B --> C[Classify<br/>Documents]
    C --> D[Build Unified<br/>Project Model]
    D --> E[Link Elements<br/>Across Documents]
    E --> F[Full Project<br/>Review]
    F --> G[Professional<br/>Reports]
```

1. قراءة جميع الملفات (نص + جداول + OCR للممسوح ضوئيًا).
2. استخراج المحتوى مع ربط كل معلومة برقم صفحتها وموقعها.
3. تصنيف الملفات تلقائيًا (Contract / Spec / BOQ / Drawing / …).
4. بناء **نموذج موحد للمشروع** (Project Model).
5. ربط العناصر بين جميع المستندات (Entity Resolution).
6. مراجعة المشروع بالكامل عبر محركات فحص متعددة.
7. إصدار تقارير احترافية مع الأدلة.

---

## 4. Users & Personas

| Persona | الدور | ماذا يريد من المنتج | مقياس النجاح عنده |
|---------|------|---------------------|-------------------|
| **Consultant / Design Reviewer** | مراجعة تصميم المقاول أو الاستشاري | اكتشاف التعارضات قبل الاعتماد | عدد التعارضات المكتشفة مبكرًا |
| **Contractor QA/QS** | تسليم مطابق ومطالبات مشروعة | معرفة ما هو ناقص في الـ BOQ وما يستحق Variation | قيمة الـ Variations المثبتة |
| **Project Manager (Owner/PMC)** | حماية الجدول والميزانية | صورة صحة المشروع + المخاطر | تقليل التأخير والمطالبات |
| **Document Controller** | تنظيم المستندات والإصدارات | معرفة أي إصدار ساري وما الناقص | سرعة الوصول للمعلومة |
| **Domain Expert (داخلي)** | بناء مكتبة الاشتراطات وحالات الاختبار | أدوات لإضافة قاعدة ومراجعة نتيجة | نمو المكتبة ودقتها |

**المستخدم الأول (Design Partner) المستهدف في V1:** الاستشاري أو الـ PMC — لأنه الطرف الذي يملك جميع المستندات ولديه الحافز الأقوى لاكتشاف التعارض مبكرًا.

---

## 5. Project Types & Scope

### V1 — In Scope

- **Building Construction Projects** (مباني — سكني، تجاري، إداري، منشآت عامة).

### لاحقًا

- Design & Build
- Infrastructure
- Upgrade / Refurbishment Projects
- Maintenance Contracts

### V1 — Out of Scope (صراحةً)

| خارج النطاق | السبب |
|-------------|-------|
| قراءة موديلات BIM / IFC / Revit / DWG | يحتاج stack مختلف تمامًا — مؤجل إلى V2 |
| Scheduling / Primavera / MS Project analysis | مجال منفصل — V4 |
| Quantity take-off من الرسومات | يحتاج vector geometry، ليس OCR |
| توليد المستندات (Spec writing) | المنتج مراجع، لا مؤلف |
| التوقيع الإلكتروني وسير اعتماد المستندات | يوجد سوق مشبع (Aconex, ACC) |
| إصدار شهادة مطابقة رسمية | المنصة استشارية فقط — انظر §14 |

---

## 6. Document-Driven Mode Detection

النظام **لا يسأل** المستخدم: "هل المشروع Construction أو Design & Build؟"

بل ينظر إلى الملفات المرفوعة ويستنتج وضع المراجعة:

| المستندات المكتشفة | Mode المُفعّل | طبيعة المراجعة |
|---------------------|---------------|-----------------|
| BOQ + Specifications + IFC | **Construction Review** | مطابقة التنفيذ للتصميم المُصدَّق، اكتمال البنود |
| Employer Requirements + Performance Specifications + IFC | **Design & Build Review** | هل التصميم يحقق متطلبات المالك الأدائية |
| Shop Drawings + IFC + Specifications | **Shop Drawing Review** | مطابقة رسومات التنفيذ للتصميم والمواصفة |
| Material Submittals + Specifications | **Submittal Review** | مطابقة المادة المقترحة للمواصفة |

> **القاعدة:** طريقة العمل تعتمد على **نوع المستندات** لا على **اسم العقد**.

الـ Mode ليس حصريًا — مشروع واحد قد يُفعّل عدة أوضاع في آن. تفاصيل خوارزمية الاستنتاج في [AI Engine §3](./02-AI-ENGINE.md).

**الاستثناء الوحيد:** إذا كانت الملفات غير كافية لتفعيل أي وضع، يعرض النظام رسالة صريحة تشرح **ما هو الملف الناقص** ولماذا — بدل أن يُصدر مراجعة ضعيفة بصمت.

---

## 7. Supported File Formats

### V1

| Format | Content Types |
|--------|---------------|
| **PDF** (نصي) | Contracts, Specifications, BOQ, Scope, ER, RFIs, MOM, Reports |
| **PDF** (ممسوح/Scanned) | نفس ما سبق — عبر OCR |
| **PDF** (رسومات) | IFC Drawings, Shop Drawings — استخراج النصوص و Title Block و Schedules |
| **Word** (.docx) | Specifications, ER, Correspondence |
| **Excel** (.xlsx/.xls) | BOQ, Schedules, Trackers, Submittal Logs |

### V2+

IFC Model (buildingSMART) · Revit (.rvt) · DWG · DXF

> **ملاحظة مهمة على التسمية:** كلمة **IFC** في هذه الوثيقة تعني **Issued For Construction** (حالة إصدار الرسومات)، وليست صيغة ملف buildingSMART IFC. حين يُقصد الصيغة، تُكتب صراحةً **IFC Model**.

---

## 8. Document Health Check

بعد رفع الملفات مباشرة — وقبل أي تحليل ذكي — يظهر تقرير شفاف عن جودة القراءة:

```
✔  520 صفحة تمت قراءتها بنجاح
⚠  18  صفحة جودة السكانر منخفضة
✖  3   صفحات لم يمكن استخراج النص منها
🌐 لغة المستندات: Arabic + English
▦  تم اكتشاف 47 جدولًا
👁  12 صفحة تحتاج مراجعة يدوية
```

**لماذا هذا أول ما يراه المستخدم؟**
لأن ثقة المستخدم في النتائج تبدأ من معرفته بما قرأه النظام وما لم يقرأه. إخفاء ضعف القراءة هو أسرع طريق لفقدان الثقة عند أول نتيجة خاطئة.

المواصفة الكاملة في [Document Processing §8](./01-DOCUMENT-PROCESSING.md).

---

## 9. Core Engine — Unified Project Model

النظام يربط جميع المعلومات في نموذج واحد. المثال الحاكم:

**`Door D-101`**

النظام يعرف أنه **نفس الباب** الموجود في:

```
Specification  →  Section 08 14 00, Fire rated 60 min
Door Schedule  →  D-101, 900×2100, FR60, Location: Corridor L1
IFC Drawing    →  Sheet A-201, Grid C/4
Shop Drawing   →  SD-A-018 Rev.B
BOQ            →  Item 8.14.03, Qty 12 No.
Submittal      →  MS-042, Manufacturer X, Cert attached
```

ولا يعامل كل مستند على أنه جزيرة منفصلة.

هذه هي الميزة الجوهرية للمنتج، وهي محور [AI Engine](./02-AI-ENGINE.md).

---

## 10. Core Features

### 10.1 AI Assistant

الإجابة عن أسئلة المشروع بلغة طبيعية (عربي/إنجليزي)، مع **استشهاد إلزامي** بالمصدر.

أمثلة:
- كم عدد Fire Doors؟
- أين سماكة العزل؟
- ما هي متطلبات CCTV؟

> **قاعدة تصميم:** الأسئلة العددية (كم عدد…) تُجاب من **Project Model** لا من الـ LLM. الـ LLM لا يَعُدّ.

### 10.2 Cross Document Comparison

مقارنة منهجية بين: Specification ↔ IFC ↔ Shop Drawing ↔ BOQ ↔ Scope ↔ Employer Requirements.

### 10.3 Conflict Detection

```
Specification:  Insulation thickness = 100 mm
IFC Drawing:    Insulation thickness =  75 mm
                        ↓
                    ⚠ CONFLICT
     Evidence: Spec p.214 §07 21 00 | Drawing A-405 detail 3
```

### 10.4 Missing Scope Detection

```
Scope of Work:  CCTV System — included
BOQ:            (no CCTV items found)
                        ↓
                  ⚠ MISSING SCOPE
```

### 10.5 Missing Requirement Detection

```
Element:  Fire Door FD-07
Required: Fire Rating (per element profile)
Found:    —
                        ↓
              ⚠ MISSING REQUIREMENT
```

### 10.6 Qatar Compliance

مقارنة المشروع مع اشتراطات:

- **QCS** — Qatar Construction Specifications
- **QCDD** — Qatar Civil Defence Department
- **MOI SSD** — Security Systems Department
- **KAHRAMAA** — Qatar General Electricity & Water Corporation
- **Ashghal** — Public Works Authority Standards

التفصيل في [Qatar Compliance Engine](./03-QATAR-COMPLIANCE-ENGINE.md).

### 10.7 Risk Analysis (إصدارات متقدمة)

- Variation Risks — بنود مرشحة لأوامر تغيير
- Claim Risks — بنود مرشحة لمطالبات
- Delay Risks — بنود مرشحة لتأخير

---

## 11. Reports

| Report | المحتوى | الجمهور |
|--------|---------|---------|
| **Conflict Report** | كل تعارض + الدليل من الطرفين + الشدة | Technical |
| **Missing Items Report** | عناصر ناقصة في BOQ / Drawings / Submittals | QS + Technical |
| **Design Review Report** | مراجعة تصميم شاملة مُنظّمة بالتخصص | Consultant |
| **Qatar Compliance Report** | مطابقة لكل جهة (QCS/QCDD/SSD/KAHRAMAA/Ashghal) | Approvals |
| **Variation Risk Report** | بنود مرشحة لأوامر تغيير + التقدير | Commercial |
| **Claim Risk Report** | بنود مرشحة لمطالبات + الأساس التعاقدي | Commercial / Legal |
| **Executive Summary** | صفحة واحدة: الأهم فقط | Owner / Management |
| **Project Health Report** | مؤشرات صحة المشروع عبر الزمن | PMC / Owner |

**متطلب مشترك لكل التقارير:** كل بند يحمل مرجعه (ملف، صفحة، بند) وقابل للتصدير PDF و Excel.

---

## 12. Dashboard

يعرض:

- عدد الملفات وحالة معالجتها
- عدد التعارضات (حسب الشدة)
- العناصر الناقصة
- Compliance Issues (حسب الجهة)
- Potential Risks
- **Project Health Score**

التفصيل في [Dashboard UX](./04-DASHBOARD-UX.md).

---

## 13. Reference Questions

الأسئلة التي يجب أن يستطيع النظام الإجابة عليها. هذه ليست أمثلة تسويقية — بل **قائمة قبول** تُختبر قبل كل إصدار:

| # | السؤال | المحرك المسؤول |
|---|--------|-----------------|
| 1 | هل يوجد تعارض بين Specification و IFC؟ | Conflict Detection |
| 2 | هل الـ BOQ يغطي جميع عناصر المشروع؟ | Missing Scope |
| 3 | هل المشروع مطابق للدفاع المدني؟ | Compliance (QCDD) |
| 4 | هل المشروع مطابق لـ SSD؟ | Compliance (MOI SSD) |
| 5 | هل يوجد شيء في Employer Requirements غير موجود في التصميم؟ | Coverage Matrix |
| 6 | كم عدد Fire Doors؟ | Project Model Query |
| 7 | كم عدد Cameras؟ | Project Model Query |
| 8 | هل يوجد Access Control؟ | Project Model Query |
| 9 | كم سماكة العزل؟ | Attribute Lookup |
| 10 | هل يوجد شيء ناقص في Shop Drawings؟ | Coverage Matrix |
| 11 | هل يوجد شيء ناقص في Material Submittals؟ | Coverage Matrix |
| 12 | ما أكثر العناصر التي قد تسبب Variation؟ | Risk Analysis |
| 13 | ما أكثر العناصر التي قد تسبب Claims؟ | Risk Analysis |

---

## 14. What Makes This Different

معظم أدوات الذكاء الاصطناعي تقرأ **مستندًا واحدًا** وتجيب عن أسئلة داخله.

هذه المنصة:

| البُعد | أدوات الـ Document Q&A العامة | هذه المنصة |
|--------|-------------------------------|-------------|
| نطاق الفهم | مستند واحد | المشروع بالكامل |
| البنية | نص + Embeddings | Project Model + Knowledge Graph |
| نوع المخرَج | إجابة نصية | Findings مُصنّفة بأدلة وشدة |
| المقارنة | لا يقارن | يقارن كل مستند بكل مستند |
| المجال | عام | Construction + اشتراطات قطر |
| الدليل | أحيانًا | إلزامي — صفحة وبند ورسمة |
| الحساب | LLM يعدّ (ويخطئ) | كود deterministic يعدّ |

---

## 15. Success Criteria

> **لا يُعتبر المشروع ناجحًا إذا اشتغل البرنامج فقط. يُعتبر ناجحًا إذا اكتشف مشكلة حقيقية في مشروع حقيقي.**

### Stage 1 — Domain Foundation

- [ ] توثيق أكثر من **100 مشكلة حقيقية** من مشاريع فعلية (مصنّفة بالنوع)
- [ ] بناء **مكتبة اشتراطات قطر** (النسخة الأولى — أعلى 100 قاعدة تكرارًا)
- [ ] كتابة الـ PRD ووثائق النظام ← *(هذه المرحلة)*

### Stage 2 — Market Validation

- [ ] مقابلة **12+ مهندسًا ومدير مشروع** (استشاري، مقاول، مالك)
- [ ] التأكد أن المنتج يحل مشكلة فعلية ويستحق الدفع
- [ ] تحديد أعلى 3 حالات استخدام تدفع مقابلها الشركات

### Stage 3 — Prototype

- [ ] Prototype يكتشف **تعارضًا حقيقيًا واحدًا على الأقل** لم يُكتشف يدويًا
- [ ] Precision ≥ 80% على مكتبة حالات الاختبار
- [ ] كل finding مصحوب بدليل صحيح (page-accurate)

### Stage 4 — First Customer

- [ ] أول عميل يجرب المنتج على مشروع فعلي
- [ ] توفير **ساعات مثبتة** من وقت المراجعة (مقاسة قبل/بعد)
- [ ] العميل يقول: "لن أراجع مشروعًا بدون هذا" — أو يجدد الاشتراك

### Product Metrics (بعد الإطلاق)

| Metric | Target V1 |
|--------|-----------|
| Precision على الـ Findings عالية الثقة | ≥ 85% |
| Recall على مكتبة حالات الاختبار | ≥ 70% |
| نسبة الـ Findings المؤكدة من المستخدم (Confirmed / Total) | ≥ 50% |
| زمن معالجة مشروع 500 صفحة | ≤ 30 دقيقة |
| دقة الاستشهاد (الصفحة الصحيحة) | ≥ 98% |

> **الأولوية للـ Precision على الـ Recall.** finding خاطئ واحد يكلف المستخدم ثقته في المئة الباقية. النظام يُفضّل أن يصمت على أن يخطئ بثقة.

---

## 16. Confidentiality & Data Privacy

المشاريع الحكومية والحساسة تفرض قيدًا معماريًا لا يُؤجَّل. أثناء التطوير والاختبار:

1. **Redaction** — إزالة كل بيانات المشروع الحساسة قبل الاختبار (أسماء، مواقع، جهات، أرقام عقود).
2. **Fragments over Projects** — استخدام أجزاء صغيرة من المستندات بدلاً من المشروع الكامل.
3. **Synthetic Dataset** — بناء Dataset خاص للاختبار مصنوع داخليًا.
4. **Customer-Environment Deployment** — مستقبلًا دعم التشغيل داخل بيئة العميل (On-Premises أو Private Cloud).

### التزامات دائمة (ليست مرحلية)

- بيانات العميل **لا تُستخدم في تدريب أي نموذج**، ويُنص عليها تعاقديًا.
- Encryption at rest و in transit افتراضيًا.
- عزل كامل بين الـ Tenants على مستوى قاعدة البيانات (Row-Level Security).
- Audit log لكل وصول إلى مستند.
- خيار **Data residency داخل قطر** للعملاء الحكوميين.
- حذف كامل ومُثبَت عند إنهاء التعاقد.

التفصيل في [System Architecture §7](./06-SYSTEM-ARCHITECTURE.md).

---

## 17. Test Case Library

مكتبة مستقلة من حالات الاختبار — الأصل الأهم في ضمان الجودة:

```yaml
- id: TC-001
  name: Insulation thickness mismatch
  inputs:
    specification: "Insulation thickness 100 mm"
    ifc_drawing:   "Insulation thickness 75 mm"
  expected: CONFLICT

- id: TC-002
  name: CCTV in scope but absent from BOQ
  inputs:
    scope: "CCTV System included"
    boq:   "(no CCTV items)"
  expected: MISSING_SCOPE

- id: TC-003
  name: Fire door without fire rating
  inputs:
    element: "Fire Door FD-07"
    attributes: {}
  expected: MISSING_REQUIREMENT
```

> كلما زادت هذه المكتبة، أصبحت المنصة أكثر دقة، وأصبح اختبار أي تحديث جديد أسهل وأسرع.

الصيغة الكاملة وآلية التشغيل في [Test Case Library](./07-TEST-CASE-LIBRARY.md).

---

## 18. Roadmap

| Version | Theme | المحتوى |
|---------|-------|---------|
| **V1** | **Document Intelligence** | PDF/Word/Excel، Health Check، Project Model، Conflicts، Missing Scope، Qatar Compliance، Reports، Dashboard |
| **V2** | **BIM Intelligence** | IFC Model، Revit، DWG/DXF — مقارنة الموديل بالمواصفة والـ BOQ |
| **V3** | **Contracts & Claims** | تحليل العقد، Variation، Claims، Extension of Time |
| **V4** | **Construction Progress** | ربط التنفيذ بالتصميم، Inspection، Progress vs Schedule |
| **V5** | **Maintenance & Asset** | تسليم الأصول، O&M، دورة حياة المبنى |

---

## 19. Risks & Open Questions

### Product Risks

| Risk | الأثر | التخفيف |
|------|-------|---------|
| **False positives تقتل الثقة** | عالٍ جدًا | عتبة ثقة عالية للعرض + Review Queue + الأولوية للـ Precision |
| **جودة الرسومات الممسوحة ضعيفة** | عالٍ | Health Check شفاف + رفض المعالجة الصامتة + طلب نسخة أفضل |
| **مقاومة تنظيمية (من يتحمل مسؤولية النتيجة؟)** | متوسط | المنصة استشارية، والمهندس هو المعتمِد — يُنص عليه في الواجهة والتقرير |
| **الاشتراطات تتغير** | متوسط | نموذج قواعد مُصدَّر ومؤرخ (effective dates) + مراجعة دورية |
| **صعوبة الحصول على مستندات حقيقية للاختبار** | عالٍ | Redaction + Synthetic Dataset + NDA مع Design Partner |

### Open Questions — تحتاج قرارًا قبل بدء التطوير

1. **من يدفع؟** المالك، الاستشاري، أم المقاول؟ (يغيّر التسعير والـ onboarding والـ positioning جذريًا)
2. **نموذج التسعير:** لكل مشروع، لكل مقعد، أم لكل صفحة معالَجة؟
3. **هل V1 يحتاج Data residency داخل قطر من اليوم الأول** أم يمكن البدء بـ SaaS مع عملاء خاصين؟
4. **من هو المرجع الهندسي المسؤول** عن اعتماد مكتبة اشتراطات قطر؟ (لا يمكن أن يكون مهندس برمجيات)
5. **حدود المسؤولية القانونية** في اتفاقية الاستخدام — يحتاج مراجعة قانونية قطرية.

---

## 20. Glossary

| المصطلح | المعنى |
|---------|--------|
| **BOQ** | Bill of Quantities — جدول الكميات |
| **ER** | Employer Requirements — متطلبات المالك |
| **IFC** | Issued For Construction — حالة إصدار الرسومات |
| **IFC Model** | صيغة ملف buildingSMART (V2) |
| **Shop Drawing** | رسومات التنفيذ التفصيلية من المقاول |
| **Material Submittal** | اعتماد المواد المقترحة |
| **RFI** | Request For Information |
| **MOM** | Minutes Of Meeting |
| **VO** | Variation Order — أمر تغيير |
| **QCS** | Qatar Construction Specifications |
| **QCDD** | Qatar Civil Defence Department |
| **MOI SSD** | Ministry of Interior — Security Systems Department |
| **KAHRAMAA** | Qatar General Electricity & Water Corporation |
| **Ashghal** | Public Works Authority |
| **Finding** | نتيجة فحص صادرة عن النظام (تعارض/نقص/مخالفة) |
| **Provenance** | سلسلة مصدر المعلومة: ملف → صفحة → موقع |
| **Project Model** | النموذج الموحد للمشروع الذي تُبنى عليه كل المراجعات |
