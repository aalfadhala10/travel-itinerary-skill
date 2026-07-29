# AI Construction Intelligence Platform — Documentation

> منصة ذكاء اصطناعي متخصصة في قطاع البناء، تبدأ بالسوق القطري، تعمل كمراجع ذكي يفهم جميع مستندات المشروع ويربطها معًا لاكتشاف الأخطاء والتعارضات والنواقص قبل أن تتحول إلى تأخير أو Variation Orders أو Claims.

هذه المجموعة من الوثائق هي خارطة الطريق الكاملة لبناء المنتج. تبدأ من الـ Master PRD ثم تتفرع إلى وثيقة مستقلة لكل جزء من النظام.

---

## Document Map

| # | Document | الوصف | الجمهور |
|---|----------|-------|---------|
| 00 | [Master PRD](./00-MASTER-PRD.md) | الرؤية، المشكلة، الحل، النطاق، معايير النجاح، الـ Roadmap | الجميع — مطور، شريك، مستثمر |
| 01 | [Document Processing](./01-DOCUMENT-PROCESSING.md) | من رفع الملف إلى نص وجداول منظمة مع Provenance كامل | Backend / ML Engineers |
| 02 | [AI Engine](./02-AI-ENGINE.md) | Project Model، Entity Resolution، Conflict Detection، RAG، Evaluation | ML / AI Engineers |
| 03 | [Qatar Compliance Engine](./03-QATAR-COMPLIANCE-ENGINE.md) | مكتبة اشتراطات قطر، نموذج القواعد، آلية التحقق | Domain Experts + Engineers |
| 04 | [Dashboard UX](./04-DASHBOARD-UX.md) | الشاشات، رحلة المستخدم، Evidence Viewer، دعم العربية و RTL | Product / Design / Frontend |
| 05 | [Database Design](./05-DATABASE-DESIGN.md) | الـ Schema الكامل، Multi-tenancy، Retention، Encryption | Backend Engineers |
| 06 | [System Architecture](./06-SYSTEM-ARCHITECTURE.md) | المكونات، الـ Stack، Deployment، Security، On-Premises | Architects / DevOps |
| 07 | [Test Case Library](./07-TEST-CASE-LIBRARY.md) | قاعدة بيانات حالات الاختبار وصيغتها وطريقة تنميتها | QA + كل الفريق |

---

## كيف تُقرأ هذه الوثائق

- **مستثمر أو شريك:** اقرأ [Master PRD](./00-MASTER-PRD.md) فقط. يكفي.
- **مطور جديد على الفريق:** Master PRD → System Architecture → Database Design → ثم الوثيقة الخاصة بجزئه.
- **مهندس مجال (Domain Expert) من قطاع البناء:** Master PRD → Qatar Compliance Engine → Test Case Library. مساهمتك في هاتين الوثيقتين هي أهم أصل في المنتج.

---

## Status & Versioning

| Field | Value |
|-------|-------|
| Version | 0.1 (Draft) |
| Status | Pre-development — Discovery & Specification |
| Target Market | Qatar (V1) |
| Last Updated | 2026-07 |

كل وثيقة تحمل جدول حالة خاص بها في أعلاها. أي تغيير جوهري في الـ Master PRD يجب أن ينعكس على الوثائق الفرعية المتأثرة في نفس الـ Pull Request.

---

## Principles — المبادئ الحاكمة

هذه المبادئ تحكم كل قرار تقني في المشروع. أي feature يخالف واحدًا منها يُرفض:

1. **No claim without evidence.**
   أي استنتاج يصدره النظام يجب أن يكون مربوطًا بمصدر: اسم الملف، رقم الصفحة، والموقع داخل الصفحة. بدون دليل = لا يُعرض.

2. **Deterministic where possible, LLM where necessary.**
   المقارنات الرقمية والوحدات والعدّ تتم بكود صريح (deterministic) وليس بالـ LLM. الـ LLM يُستخدم للفهم والاستخراج والشرح، لا للحساب.

3. **Documents decide the mode, not the user.**
   النظام يستنتج نوع المراجعة من نوع المستندات المرفوعة، ولا يسأل المستخدم عن نوع العقد.

4. **Confidence is a first-class citizen.**
   كل استخراج وكل finding يحمل درجة ثقة. الثقة المنخفضة تذهب إلى Review Queue، لا إلى التقرير النهائي.

5. **Confidentiality by design.**
   مشاريع حكومية وحساسة. الخصوصية ليست feature لاحقة، بل قيد معماري من اليوم الأول.

6. **Advisory, not certification.**
   المنصة أداة مساعدة لمهندس مسؤول. لا تصدر شهادات مطابقة ولا تحل محل الجهات الرسمية.
