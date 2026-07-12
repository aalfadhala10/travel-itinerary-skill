---
name: travel-itinerary-generator
description: "Generate complete custom travel itineraries with interactive maps, daily plans, hotels, and halal restaurants, in English or Arabic, for ANY country and ANY dates. Use this whenever someone asks about travel planning, trip ideas, vacation itineraries, destination guides, or needs help planning a multi-city trip — including Arabic requests like أبي أسافر إلى، ساعدني أخطط رحلة، or اعمل لي برنامج سفر. Creates three shareable files: a full HTML itinerary with a quick-reference summary and a built-in budget section, an interactive duration-color-coded map, and a halal restaurant & attractions guide. Fast and simple: 4 core questions and you're done."
---

# 🌍 سكيل منشئ برامج السفر | Travel Itinerary Generator

هدف هذا السكيل: يكون **بديل حقيقي لمكتب سياحة** — أي شخص يقدر يستخدمه ويطلع ببرنامج سفر كامل وجاهز خلال دقائق، بدون تعقيد وبدون ما يضيع وقته. يشتغل لأي دولة في العالم (مو بس تايلاند أو أي مثال معين) ولأي مدة ولأي ميزانية.

*(This skill's goal: a genuine one-stop replacement for a travel agent — anyone should be able to use it and get a complete, ready itinerary in minutes, with no complexity and no wasted time. It works for any country, any trip length, any budget — never assume a specific destination.)*

## المبدأ الأساسي | Core principle

**البساطة أولاً.** لا تتردد كثير بالأسئلة، لا تطول الشرح، ولا تفترض دولة أو عملة أو لغة معينة. اسأل فقط الأسئلة الضرورية بالأسفل، ثم اطلع بالنتيجة كاملة دفعة وحدة.

*(Simplicity first. Don't over-ask, don't over-explain, and never assume a specific country, currency, or language. Ask only the questions below, then deliver the complete result in one pass.)*

**قاعدة مهمة لطريقة طرح كل الأسئلة:** كل سؤال بالقائمة بالأسفل لازم يُطرح كـ **ويدجت تفاعلي بأزرار قابلة للضغط** (استخدم أداة الأسئلة التفاعلية إذا متوفرة)، مو كنص عادي بالمحادثة — هذا أسهل وأسرع للمستخدم. لكن لأي سؤال جوابه رقم دقيق (الميزانية، عدد الأيام لو غير معروف، إلخ):
- ضِف بالويدجت خيارات تقريبية سريعة (مثال: أرقام شائعة) **بالإضافة إلى** خيار الكتابة الحرة المدمج بنفس الويدجت (خيار "غير ذلك / Other" اللي يقدر المستخدم يكتب فيه رقمه بالضبط).
- **المهم:** لا تسوي ويدجت بخيارات تقريبية فقط ثم ترجع تسأل ويدجت أو سؤال ثاني لتوضيح الرقم الدقيق. اعتبر الويدجت الواحد (بخياراته + إمكانية الكتابة الحرة بداخله) كافي تمامًا — سؤال وحد، تفاعل وحد، خلاص. إذا المستخدم ضغط رقم تقريبي بدل ما يكتب الدقيق، اقبل إجابته وكمل، ولا ترجع تسأله مرة ثانية.

*(Important rule for how every question is asked: every question in the list below should be presented as an interactive widget with clickable buttons (use the interactive question tool if available), not as plain chat text — it's faster and easier for the user. But for any question whose answer is a precise number (budget, day count if unknown, etc.): include a few quick approximate options in the widget PLUS the widget's built-in free-text/"Other" option so the user can type their exact figure in that same interaction. The key rule: never build a widget with only approximate buckets and then ask a second widget or follow-up question to clarify the exact number — treat the one widget (options + built-in free-text entry) as sufficient. One question, one interaction, done. If the user clicks an approximate option instead of typing exact, accept it and move on — don't re-ask.)*

## 1️⃣ الأسئلة الأساسية | Core Questions (بالترتيب | in order)

**الهدف: أقل عدد أسئلة، أسرع نتيجة.** ٤ أسئلة أساسية فقط + سؤال اختياري واحد. اسألها تفاعليًا (ويدجت أزرار) وحدة تلو الثانية:

1. **🗣️ اللغة | Language** — "تبي البرنامج بالعربي ولا بالإنجليزي؟" / "Arabic or English?"
   هذا يحدد لغة **كل** الملفات الناتجة — لا تخلط اللغتين.

2. **🌍 الدولة | Destination country** — "إيش الدولة اللي تبي تسافر لها؟" (تشتغل مع أي دولة بالعالم)

3. **📅 التواريخ | Travel dates** — استخدم هذا الفرع بالضبط:
   - اسأل: "عندك تواريخ محددة، ولا بس فكرة عن المدة؟" / "Exact dates, or just a rough duration?"
   - **تواريخ محددة** → اطلب التواريخ الفعلية (مثال: 12–22 ديسمبر 2026). استنتج منها عدد الأيام، الموسم/الطقس، وأي مهرجانات محلية.
   - **ما عنده تواريخ** → اسأل "كم يوم؟" + خيار خفيف "أي شهر تقريبًا؟ (اختياري)". إذا ما يعرف الشهر، كمّل بدون تفاصيل موسمية ونبّه إنه يقدر يرجع يضيفها لاحقًا.

4. **💰 الميزانية + العملة | Budget + currency (سؤال واحد مدمج)** — اسأل الاثنين بنفس الويدجت: "كم ميزانيتك التقريبية، وبأي عملة؟ (بدون الطيران الدولي)". اعرض خيارات تقريبية سريعة بعملات شائعة (مثال: €3,000 · $3,500 · 15,000 ريال) + خيار كتابة حرة للرقم والعملة معًا. **لا تفصل العملة كسؤال مستقل.** اقبل أي إجابة وكمّل — **لا ترجع تسأل توضيح عن الميزانية أو العملة أبدًا.**
   *(Ask budget AND currency in ONE widget — quick approximate options in common currencies plus free-text for an exact figure+currency together. Never split currency into its own question. Accept whatever they pick and move on.)*

**سؤال اختياري واحد فقط (لا تسأله إلا إذا لزم):**

5. **🏨 تفضيل الفنادق | Hotel preference (اختياري)** — إذا الميزانية **واضحة** إنها تدل على مستوى معيّن (مثال: ميزانية عالية جدًا = فاخر تلقائيًا)، **لا تسأل هذا السؤال أبدًا** واستنتج المستوى بنفسك. اسأله فقط إذا الميزانية بالمنتصف وغامضة، وخلّه سهل التخطي: كويدجت (اقتصادي · متوسط · فاخر · "اختر لي أنت"). خيار "اختر لي أنت" يخليك تقرر بدون ما تعطّل المستخدم.

**لا تسأل أكثر من ذلك.** أي توضيح إضافي يُعرض كخيار تعديل **بعد** التسليم، مو كسؤال بالبداية. الأولوية دايمًا: سرعة الوصول للنتيجة.

## 1.5️⃣ مرحلتين إلزاميتين: بطاقات مفاهيم خفيفة ثم البناء الكامل | Mandatory two-phase flow: lightweight concept cards, then full build

**لا تبني البرنامج الكامل (٣ ملفات) مباشرة بعد الأسئلة الأساسية.** بعد جمع الأجوبة الأربعة (اللغة، الدولة، التواريخ، الميزانية+العملة)، اتبع هذا الترتيب بالضبط:

**المرحلة ١ — بطاقات مفاهيم (رخيصة وسريعة، بدون ملفات):**
- ابنِ **2-3 مفاهيم رحلة مختلفة** لنفس الدولة/المدة/الميزانية — كل مفهوم يختلف عن غيره فعليًا (تركيبة مدن مختلفة، أو "طابع" مختلف: مثال "ثقافة كلاسيكية" مقابل "طبيعة ومغامرة" مقابل "مدينة وتسوق وطعام").
- كل بطاقة مفهوم = **فقرة قصيرة فقط** (3-5 أسطر): اسم المفهوم، المدن المشمولة وعدد الأيام بكل مدينة، جملة توضح طابعه، وسبب واحد يميزه. **بدون** خريطة، بدون ملف HTML، بدون سحب بيانات سلمانينيو، بدون حساب ميزانية تفصيلي — فقط نص.
- اعرضها **كويدجت أزرار تفاعلي** (اسم كل مفهوم كخيار) + خيار "وضح لي أكثر" إذا متاح، عشان المستخدم يختار بضغطة وحدة.
- **لا تبني أي ملف قبل ما يختار المستخدم مفهوم واحد.** هذا يمنع هدر وقت/تكلفة بناء برنامج كامل قد يُرفض.

**المرحلة ٢ — البناء الكامل (فقط بعد الاختيار):**
- بمجرد ما يختار المستخدم مفهوم، ابنِ **البرنامج الكامل بالمفهوم المختار فقط** (الملفات الثلاثة، خطوة "أثناء التخطيط" بالأسفل، مواقع سلمانينيو، كل شي بالتفصيل).
- إذا رفض المستخدم كل المفاهيم المعروضة أو طلب مفاهيم أخرى، ارجع للمرحلة ١ وقدّم مفاهيم جديدة (بدون إعادة سؤاله الأسئلة الأساسية مرة ثانية) — **لا تبني ملفات كاملة لمفاهيم إضافية أبدًا قبل الاختيار.**
- بعد التسليم الكامل، إذا طلب المستخدم "خيار ثالث" أو تعديل جوهري (تغيير المدن كليًا)، عامله كرجوع للمرحلة ١ (بطاقات مفاهيم بديلة) مو كتعديل صغير بالخيارات الموجودة بقسم ٤ بالأسفل.

*(Mandatory two-phase flow: do NOT build the full 3-file itinerary immediately after the core questions. Phase 1 — generate 2-3 genuinely distinct lightweight trip concepts (different city combos or different "vibes"), each as a short 3-5 line text card only: concept name, cities + day split, one line on its character, one differentiator. No map, no HTML file, no Salmaninho data pull, no detailed budget — text only. Present as an interactive button widget so the user picks with one tap. Do not build any file until the user picks one concept — this avoids wasting time/cost building a full itinerary that might get rejected. Phase 2 — only after a pick, build the full itinerary (all 3 files, full "while planning" detail, Salmaninho locations, everything) for that concept only. If the user rejects all shown concepts or asks for others, return to Phase 1 with new concepts — never build full files for extra concepts before a pick. After full delivery, if the user asks for "a third option" or a fundamental change (entirely different cities), treat it as returning to Phase 1 with alternate concept cards, not as a minor edit from section 4 below.)*

## 2️⃣ أثناء التخطيط | While planning

- **احسب الميزانية بالعملة اللي اختارها المستخدم** (لا تحول تلقائيًا لأي عملة ثانية).
- **إذا كانت التواريخ معروفة (أو الشهر التقريبي معروف):**
  - اذكر الطقس المتوقع بذلك الموسم بالتحديد لكل مدينة يزورها (مو نصيحة عامة عن كل السنة).
  - تحقق هل تتقاطع الرحلة مع أعياد أو مهرجانات وطنية كبيرة (مثال: أعياد دينية، رأس السنة المحلي، مهرجانات موسمية معروفة) ونبّه المستخدم لأن هذا يأثر على الزحمة والأسعار وإغلاق بعض الأماكن.
- **ذكّر المستخدم بمتطلبات الدخول/الفيزا** بسطر واحد بسيط: "تأكد من متطلبات الفيزا/الدخول لجواز سفرك قبل الحجز" مع رابط بحث عام (مثال: رابط بحث جوجل "visa requirements for [country]") — بدون تعمق، فقط تذكير.
- اختر 2-3 مدن رئيسية حسب حجم الدولة ووزّع الأيام بينها.
- اختر الفنادق والمطاعم والأنشطة حسب الميزانية والعملة المختارة.
- **🚄 الانتقالات بين المدن (إلزامي لأي رحلة متعددة المدن):** لا تكتفي بذكر المدن — وضّح **كيف** ينتقل بينها بالضبط:
  - وسيلة الانتقال (قطار سريع، طيران داخلي، سيارة)، المدة التقريبية، والتكلفة التقديرية بعملة المستخدم، وتنبيه بالحجز المسبق إذا لزم.
  - اعرضها **كبطاقة انتقال مميزة** داخل اليوم اللي يصير فيه الانتقال بملف HTML (لون/حدود مختلفة عن بقية الفقرات حتى تبين بوضوح).
  - أضِف تكلفة الانتقالات الداخلية **كبند مستقل** بقسم الميزانية.
  - على الخريطة: ارسم خط بين المدن بلون الانتقال الطويل (كحلي/بنفسجي — **ليس أحمر**) مع تسمية توضّح الوسيلة والمدة (مثال: `🚄 بكين → شيان · ~5 ساعات`).
  *(Mandatory for any multi-city trip: don't just list cities — spell out HOW to get between them: mode (high-speed rail, domestic flight, car), approximate duration, estimated cost in the user's currency, and a booking-ahead warning if needed. Render it as a distinct "transfer" card inside the day it happens, add intercity transport as its own budget line item, and draw a long-duration-colored line (navy/purple, never red) on the map with a label naming the mode and duration.)*
- **📱 قسم "تحضيرات عملية خاصة بالدولة" (إلزامي):** كل دولة لها عوائق عملية تختلف عن غيرها — ابحث وأضِف قسم واضح بملف HTML يغطي ما ينطبق منها:
  - **الدفع:** هل البطاقات الأجنبية مقبولة؟ هل يحتاج تطبيق دفع محلي؟ (مثال: الصين تحتاج Alipay/WeChat Pay وشبه بلا كاش) هل الكاش ضروري؟
  - **الاتصال والإنترنت:** eSIM/شريحة محلية، وهل فيه حجب لتطبيقات شائعة يتطلب VPN **يُحمّل قبل الوصول** (مثال: الصين).
  - **التطبيقات الأساسية:** خرائط تشتغل فعليًا بالدولة، تطبيق نقل/تاكسي، تطبيق ترجمة (خصوصًا لو اللغة غير لاتينية).
  - **الكهرباء:** نوع القابس والفولت.
  - **تسجيل/إجراءات وصول:** أي إجراء إلزامي بعد الوصول (مثال: تسجيل العنوان بالصين خلال ٢٤ ساعة).
  اذكر فقط اللي ينطبق فعلًا على الدولة — لا تحط نصائح عامة فاضية.
  *(Mandatory country-specific prep section: research and include what actually applies — payments (are foreign cards accepted? is a local payment app required? is it cashless?), connectivity (eSIM, and whether common apps are blocked requiring a VPN downloaded BEFORE arrival), essential apps (a maps app that actually works there, ride-hailing, translation for non-Latin scripts), plug type/voltage, and any mandatory arrival procedure. Only include what genuinely applies — no filler.)*
- **لا تكتفي بالمطاعم فقط** — كل مدينة لازم تحتوي عدد جيد من المعالم والأنشطة الفعلية (4-6 معالم/أنشطة على الأقل لكل مدينة): معالم تاريخية، طبيعة، متاحف، أسواق، تجارب ثقافية — المطاعم الحلال إضافة مهمة لكن مو البرنامج كله مطاعم.
- لكل مطعم حلال: 🕌 اسم، موقع دقيق، تقييم، رابط Google Maps منفصل، نوع الطعام، وقت من الفندق. إذا الخيارات محدودة، اذكر بدائل نباتية أو متوسطية بصدق.
- **تحقق دايمًا من ملف `references/salmaninho-locations.md`** — هذا الملف فيه جدول رئيسي بـ٣٣ دولة عندها قائمة سلمانينيو. إذا دولة المستخدم موجودة بهالجدول:
  1. شوف هل فيه نسخة محفوظة جاهزة بمسار `references/salmaninho/<country-slug>.md` (مثال: `turkey.md`). إذا موجودة، استخدمها مباشرة — فيها كل الأماكن (تقدر تكون عشرات لمئة+ مكان لكل دولة).
  2. إذا ما فيه نسخة محفوظة وعندك أداة تصفح (Chrome) شغالة، اتبع خطوات الاستخراج المذكورة بالملف (سكرول تدريجي لقائمة خرائط جوجل المرتبطة بالجدول) واحفظ النتيجة كملف جديد بنفس المسار عشان تصير جاهزة للمرات الجاية.
  3. إذا الدولة موجودة بالجدول لكن **ما فيه نسخة محفوظة ولا أداة تصفح متاحة**: كمّل الخطة عادي بدون توقف، وأضِف **سطر واحد فقط** بآخر ملف HTML يوضّح إن سلمانينيو عنده قائمة لهذي الدولة وإن المستخدم يقدر يفعّل أداة التصفح عشان تُجلب له المرة الجاية (مع رابط صفحته). لا تعتذر، ولا تكرر الملاحظة بأكثر من مكان، ولا توقف الخطة.
  ضيف **كل المواقع** الموجودة (من النسخة المحفوظة أو المستخرجة حديثًا) كقسم منفصل ومميز بالبرنامج، مو مدمجة داخل الجدول الزمني للأيام. اكتب بوضوح إنها من قائمة **سلمانينيو (Salmaninho)** مع شكر له على مجهوده، ورابط صفحته [linktr.ee/Salmaninho](https://linktr.ee/Salmaninho). إذا الدولة مو موجودة بالجدول أصلًا، تجاهل هذا تمامًا بدون أي ذكر.
  *(Always check `references/salmaninho-locations.md` — it has a master table of 33 countries with a Salmaninho list. If the destination country is listed: 1) check whether a cached file already exists at `references/salmaninho/<country-slug>.md` — if so, use it directly, it contains every place (potentially dozens to 100+ per country). 2) If no cached file exists and a browser tool is available, follow the extraction steps in that file (incremental scroll through the linked Google Maps list) and save the result to that same path for reuse next time. 3) If no browser tool is available, quietly skip the Salmaninho section and continue the plan as normal. Add ALL locations found (cached or freshly extracted) as a distinct, separate section in the plan — not folded into the timed daily schedule. Clearly credit it as being from **Salmaninho's** list with thanks for his effort, linking [linktr.ee/Salmaninho](https://linktr.ee/Salmaninho). If the country isn't listed at all, skip this entirely — no mention at all.)*
- **معالجة مواقع سلمانينيو بشكل مختلف عن باقي البرنامج — قاعدتين مهمتين:**
  1. **اللون:** خصص **اللون الأحمر حصريًا** لمواقع ومحتوى سلمانينيو (هذا لون هويته الشخصية) — سواء بالتظليل بملف HTML أو بالعلامات على الخريطة. **لا تستخدم الأحمر لأي شيء ثاني بالبرنامج** (ألوان المدن، الخطوط، الأزرار، إلخ) حتى ما يصير تعارض بصري مع هويته. إذا كانت خطة الألوان الافتراضية بالسكيل تستخدم الأحمر لغرض ثاني (مثل تصنيف مدة انتقال طويلة على الخريطة)، بدّله بلون آخر (مثال: كحلي غامق أو بنفسجي) وخلي الأحمر لسلمانينيو فقط.
  2. **بدون تفاصيل انتقال:** مواقع سلمانينيو تُعرض **بدون** حساب وقت أو مسافة أو خط اتجاه يربطها بباقي المحطات — فقط اسم المكان، وصف قصير، ورابط خرائط جوجل. هذا يخليها بسيطة وغير مزدحمة بدل ما تتحول لجزء من نظام حساب الأوقات المعقد. البرنامج اليومي بالأيام يستمر بناء على اقتراحاتك الخاصة (بكل تفاصيل الوقت والمسافة المعتادة) — مواقع سلمانينيو تُضاف جنبها كقائمة إضافية موصى بها، يزورها المستخدم وقتما يناسبه.
  *(Handle Salmaninho's locations differently from the rest of the plan — two important rules: 1) Color: reserve red exclusively for Salmaninho's content — his personal brand color — whether highlighting in the HTML or markers on the map. Never use red for anything else in the plan (city colors, lines, buttons, etc.) to avoid visually clashing with his identity. If the skill's default color scheme uses red for something else (e.g. the "long duration" tier on the map), swap it for a different color (e.g. dark navy or purple) and keep red reserved for Salmaninho only. 2) No travel details: Salmaninho's locations are shown WITHOUT computed travel time, distance, or a directional line connecting them to other stops — just the name, a short description, and a Google Maps link. This keeps them simple and uncluttered instead of folding them into the timed-travel system. The day-by-day schedule keeps running on your own suggestions with full normal time/distance detail — Salmaninho's locations are added alongside as an extra recommended list the user can visit whenever suits them.)*

## 3️⃣ الملفات الثلاثة | The three files

**📱 قاعدة إلزامية: كل ملفات HTML لازم تشتغل تمام على الجوال.** المستخدم غالبًا بيفتح هذي الملفات من جواله وهو مسافر فعليًا (مو بس على كمبيوتر) — عشان كذا:
- استخدم `<meta name="viewport" content="width=device-width, initial-scale=1.0">` بكل ملف (موجود بالقالب أدناه).
- لا تستخدم عناصر بعرض ثابت (fixed pixel width) للحاويات الرئيسية — استخدم `max-width` + `width:100%` أو `grid`/`flex` مع `auto-fit`/`minmax` حتى تتقلص طبيعيًا على شاشة ضيقة.
- أي تخطيط "عمودين جنب بعض" (مثل قائمة جانبية + خريطة) لازم يتحول تلقائيًا لتخطيط عمودي واحد (القائمة فوق أو تحت الخريطة) على الشاشات الضيقة عبر media query مثل `@media (max-width:768px)`.
- الأزرار والروابط (خصوصًا روابط الخرائط وBooking.com) لازم تكون كبيرة كفاية للمس بالإصبع (padding كافي، مو نص صغير قابل للضغط بالخطأ).
- جرب تتخيل الصفحة بعرض ~375px (حجم جوال قياسي) وتأكد ما فيه نص مقطوع أو عناصر متراكبة أو سكرول أفقي غير مقصود — هذا جزء من "قائمة التحقق النهائية".
*(Mandatory rule: every HTML file must work well on mobile, since users often open these while actually traveling, on their phone. Always include the viewport meta tag, avoid fixed-pixel-width containers for main layout (use max-width/grid/flex with auto-fit/minmax instead), collapse any side-by-side layout (like a sidebar next to a map) into a single stacked column below ~768px via a media query, keep links/buttons touch-friendly, and mentally check the page at ~375px width for cut-off text, overlapping elements, or unwanted horizontal scroll — this belongs in the final quality checklist.)*

### 📋 1) ملف HTML — البرنامج الرئيسي
- **بطاقة ملخص سريع بالأعلى** (Quick-reference summary): التواريخ، المدن، الفنادق المختارة، الميزانية الإجمالية، رحلات التنقل بين المدن — كل شي بنظرة وحدة بدون ما يضطر يمرر كل الصفحة.
- خطة يومية كاملة (صباح/غداء/بعد الظهر/عشاء/مساء) منظمة حسب المدينة بألوان مختلفة لكل مدينة.
- **معالم وأنشطة كافية بكل مدينة** — مو بس مطاعم.
- **لا تضف صور للمعالم.** (سابقًا كان السكيل يطلب سحب صور من Wikimedia Commons — أُزيل هذا نهائيًا.) روابط صور الويب كثير تنكسر داخل عارض التطبيق أو تُحجب، وتضيع وقت بدون فائدة. اكتفِ بوصف واضح لكل معلم + رابط خرائط جوجل. بدون أي `<img>` من مصادر خارجية بكل الملفات.
  *(Do NOT add landmark images. This skill previously pulled images from Wikimedia Commons — that requirement is removed entirely. External image URLs frequently break inside in-app viewers or get blocked, wasting time for no benefit. Use a clear text description per landmark plus a Google Maps link. No external `<img>` tags in any file.)*
- **كل فندق: رابط Booking.com + رابط Google Maps** — الاثنين مع بعض، بدون استثناء.
- تذكير الفيزا/الدخول، وتنبيه المهرجانات/الأعياد (إذا التواريخ معروفة).
- **قسم ميزانية بسيط مدمج داخل الـHTML** (بدل ملف Excel منفصل): جدول أو بطاقات نظيفة تعرض تفصيل التكلفة التقديرية (فندق، أكل، أنشطة، تنقل، متفرقات) والإجمالي، بعملة المستخدم. أرقام واضحة ومقروءة — **لا تنشئ ملف Excel/xlsx إطلاقًا.** المستخدم العادي ما يحتاج جدول بيانات؛ يحتاج يشوف الميزانية بنظرة وحدة داخل نفس الصفحة.
  *(Include a simple budget section INSIDE the HTML — a clean table or cards showing the estimated cost breakdown and total in the user's currency. Do NOT generate an Excel/xlsx file. Casual users don't need a spreadsheet; they need the budget visible at a glance in the same page.)*
- ⚠️ كل سعر مكتوب بجانبه: "أسعار تقديرية - يرجى التأكد عند الحجز الفعلي" بعملة المستخدم المختارة.
- نصائح سفر عملية: ماذا تحضر، أفضل وقت زيارة (مخصص حسب تواريخ الرحلة الفعلية إذا معروفة)، اللغة والثقافة، الأمان.
- **📱 ملاحظة "افتح بالمتصفح" بأعلى كل ملف HTML:** ضِف شريط صغير واضح بأعلى الصفحة (فوق العنوان أو تحته مباشرة) بنص مثل: "💡 للحصول على أفضل تجربة (خصوصًا الخريطة)، افتح هذا الملف في متصفحك (Safari / Chrome) بدل العارض داخل التطبيق." كثير من المستخدمين يفتحون الملف داخل عارض التطبيق حيث الخرائط أحيانًا تُحجب — هالملاحظة تمنع إحباطهم وتوهمهم إن الملف معطّل. خلّها مختصرة وبلون هادئ (مثال خلفية صفراء فاتحة).
  *(Add a small, clear "open in browser" banner at the top of every HTML file: "For the best experience — especially the map — open this file in your browser (Safari/Chrome) rather than the in-app viewer." Many users open files inside an in-app webview where maps can be blocked; this note prevents them thinking the file is broken. Keep it short, subtle background.)*

### 🗺️ 2) خريطة تفاعلية (Leaflet.js + OpenStreetMap) ⭐ مهم جداً
**هذه الخريطة يجب أن تكون في كل برنامج بدون استثناء.**

**الخصائص الأساسية:**
- جميع المعالم محددة برموز تعبيرية واضحة (فندق🏨 مطعم🍽️ معلم🏛️ نشاط 🎯)
- روابط Google Maps مباشرة لكل موقع (تفتح بنافذة جديدة)
- قائمة جانبية تفاعلية بكل المواقع — الضغط على أي عنصر يقرّب الخريطة عليه ويفتح المعلومات. **مهم على الجوال:** لأن الخريطة تكون فوق القائمة، الضغط على أي عنصر لازم **يسكرول الصفحة تلقائيًا للخريطة** (`document.getElementById('map').scrollIntoView({behavior:'smooth',block:'start'})`) ثم بعد تأخير بسيط (~350ms) ينفّذ `map.invalidateSize()` و`map.setView()` ويفتح الـPopup — عشان المستخدم يشوف الموقع فورًا بدون ما يسكرول لفوق يدويًا. (استخدم دالة مشتركة `focusStop(s, m)` لكل العناصر.)
  *(On mobile the map sits above the list, so a list-item click must auto-scroll the page up to the map via `scrollIntoView`, then after ~350ms call `invalidateSize()`, `setView()`, and open the popup — so the user sees the chosen location immediately without manual scrolling. Use one shared `focusStop(s, m)` handler.)*
- Popup معلومات عند الضغط على أي علامة
- خريطة OpenStreetMap إنجليزية واضحة

**خطوط الاتصال بين المواقع — قاعدة مهمة جداً:**
لون وسماكة كل خط بين موقعين يعكسان **مدة الانتقال الفعلية** بينهم، وكلها خطوط **سميكة وصلبة (solid) بدون تقطيع (لا dashed أبداً)**. **ملاحظة: الأحمر محجوز حصريًا لسلمانينيو (انظر قسم "أثناء التخطيط") — لا تستخدمه هنا أبداً:**
- 🟢 **أقل من 20 دقيقة** (مشي أو سيارة قريبة): أخضر، سماكة 4px
- 🟠 **من 20 إلى 60 دقيقة**: برتقالي، سماكة 5px
- 🟣 **أكثر من 60 دقيقة** (يشمل الانتقال بين المدن بالطيران أو القطار الطويل): كحلي غامق أو بنفسجي (مثال: `#4a235a` أو `#1b2a4a`)، سماكة 6-7px
كل خط يعرض تسمية المدة والمسافة (كم دقيقة/ساعة، كم كيلومتر) بخط واضح وخلفية بيضاء حتى ما يختلط بالخريطة. لا تستخدم خطوط متقطعة لأي نوع انتقال، حتى رحلات الطيران — استخدم نفس أسلوب اللون الصلب مع تسمية ✈️ إذا كان طيران.

**مواقع سلمانينيو على نفس الخريطة:** تظهر كعلامات حمراء مميزة (بدون خط يربطها بأي محطة ثانية، وبدون تسمية وقت/مسافة) — فقط Popup يوضح اسم المكان والوصف ورابط خرائط جوجل والشكر لسلمانينيو.

**📱 تخطيط الخريطة على الجوال — قواعد إلزامية (أخطاء متكررة تسبب "خريطة سوداء/فاضية"، لازم تُتّبع كلها):**

1. **رتّب الخريطة قبل القائمة في كود HTML نفسه (DOM order)، مو بـ CSS `order`.** ضع `<div id="map">` **فعليًا قبل** `<div id="sidebar">` داخل الـ HTML. خدعة `order:-1` بالـ flex **ما تشتغل بعارض التطبيق (in-app webview)** — القائمة تطلع فوق والخريطة تنزل تحت والمستخدم ما يوصلها. الترتيب الفعلي بالـDOM هو الحل المضمون بأي عارض.

2. **ارتفاع الخريطة بالبكسل الثابت، مو `vh` ولا `%`.** على الجوال استخدم `#map { height:400px; min-height:400px; width:100%; }`. وحدات `vh`/`%` أحيانًا تُحسب صفر داخل عارض التطبيق فتطلع الخريطة فاضية/سوداء. القائمة تحتها بارتفاع تلقائي (`height:auto`) وسكرول طبيعي للصفحة.

3. **نادِ `map.invalidateSize()` بعد التحميل وعند تغيّر الحجم/الدوران.** أضف: `window.addEventListener('load', ()=>setTimeout(()=>{map.invalidateSize(); map.fitBounds(allPts,{padding:[30,30]});},300));` بالإضافة لـ`resize` و`orientationchange`، مع تمريرة أمان إضافية بعد ~800ms. بدونها الخريطة أحيانًا تطلع رمادية لأن Leaflet حسب حجم الحاوية قبل ما تجهز.

3ب. **مركز الموقع المختار بالنص، مو بالزاوية.** لما المستخدم يضغط عنصر بالقائمة، لا تكتفِ بـ`setView([lat,lng])` — الـPopup يفتح فوق العلامة ويدفعها لأعلى الخريطة فتطلع بالزاوية. بدلها احسب مركز مُزاح لتحت عشان العلامة + الـPopup يطلعون بالوسط: استخدم `project`/`unproject` لإزاحة المركز لأسفل بمقدار ~22% من ارتفاع الخريطة:
```js
const pt = map.project([s.lat, s.lng], zoom);
const shift = map.getSize().y * 0.22;            // يدفع العلامة تحت المنتصف
const target = map.unproject(pt.subtract([0, shift]), zoom);
map.setView(target, zoom, { animate:false });
m.openPopup();
```

4. **مصدر احتياطي لمكتبة Leaflet + حارس فشل التحميل.** بعد وسم `<script>` الأساسي لـLeaflet، أضف فحص: إذا `typeof L === 'undefined'` حمّل من مصدر احتياطي (`unpkg.com/leaflet@1.9.4`) عبر `document.write`. وقبل بناء الخريطة، إذا لسا `L` غير معرّف، اعرض رسالة واضحة داخل `#map` ("تعذّر تحميل الخريطة — تأكد من الإنترنت") بدل مربع أسود صامت، وأوقف السكربت. هذا يمنع الشاشة السوداء الغامضة إذا كان الإنترنت ضعيف أو العارض يحجب المصدر.

5. الخريطة على الشاشات الكبيرة تبقى جنب القائمة (flex row، الخريطة `flex:1` والقائمة بعرض ثابت مثل `300px`)؛ يتحول التخطيط لعمودي فقط تحت `@media (max-width:768px)`.

*(Mandatory mobile-map rules — recurring "black/blank map" bugs, follow all: 1) Put `#map` physically BEFORE `#sidebar` in the HTML DOM — do NOT rely on CSS `order:-1`, which fails in in-app webviews, leaving the list on top and the map unreachable below. 2) Use a fixed pixel height on mobile (`height:400px;min-height:400px`), never `vh`/`%`, which can compute to 0 in in-app viewers and blank the map. 3) Call `map.invalidateSize()` on load (setTimeout ~300ms) and on resize/orientationchange, plus a safety pass ~800ms, else Leaflet sizes the container before it's ready and renders grey. 3b) When a list item is clicked, don't just `setView` on the raw lat/lng — the popup opens above the pin and shoves it to the top corner. Compute a downward-shifted center via `project`/`unproject` (shift ~22% of map height) so pin + popup land centered. 4) Add a fallback CDN (unpkg) via document.write if `L` is undefined, and a guard that shows a clear message inside `#map` instead of a silent black box if Leaflet still fails to load. 5) On desktop keep map beside the list (flex row); collapse to vertical only under the 768px media query.)*

**⚠️ قاعدة تقنية مهمة جداً لوضوح تسميات المدة/المسافة (خطأ متكرر لازم يتجنب):**
لا تستخدم `L.divIcon` بـ `iconSize: [0,0]` لعرض نص تسمية المدة على الخريطة — هذا يخلي Leaflet يحسب موضع التسمية بشكل غير دقيق، فتطلع متراكبة فوق علامة (marker) ثانية أو غير مقروءة. بدلها:
- حدد `iconSize` بعرض وارتفاع معقولين يتناسبان مع طول النص (مثال: `[90, 24]`) و`iconAnchor` يساوي نص العرض والارتفاع (`[45, 12]`) حتى تتمركز التسمية صح على منتصف الخط.
- خلي خلفية التسمية بيضاء **معتمة تمامًا** (`background:#fff` مو شفافة)، مع حدود واضحة بلون الخط، `padding` كافي (مثال `4px 10px`)، `border-radius`، و`box-shadow` خفيف حتى تبرز فوق أي لون بالخريطة.
- خط التسمية لازم يكون واضح ومقروء (`font-size` لا يقل عن 12px، `font-weight: 700`)، ولا تخليه يعتمد على إيموجي فقط للوضوح.
- إذا نقطة منتصف الخط (midpoint) طلعت قريبة جدًا أو متراكبة مع أي علامة (marker) ثانية، ازحزح موضع التسمية شوي (مثال: 40% أو 60% من طول الخط بدل 50% بالضبط) حتى ما تتغطى.
- بعد ما تبني الخريطة، تخيل شكلها على الأقل بمستوى تكبير متوسط وتأكد كل التسميات تبين بوضوح وما فيه أي تراكب — هذا جزء من "قائمة التحقق النهائية".

*(Technical rule to prevent unreadable duration labels — a recurring bug to avoid: don't use `L.divIcon` with `iconSize: [0,0]` for the distance/duration text, since Leaflet then anchors it incorrectly, causing it to overlap other markers or become unreadable. Instead, give the icon a real `iconSize` sized to the text (e.g. `[90, 24]`) with a matching `iconAnchor` (e.g. `[45, 12]`) so it centers properly on the line. Make the label background fully opaque white (not translucent), with a border matching the line's color, generous padding, rounded corners, and a subtle shadow so it stands out against any map color. Text must be at least 12px and bold — don't rely on emoji alone for legibility. If the line's midpoint lands too close to another marker, nudge the label along the line (e.g. 40% or 60% instead of exactly 50%) so they don't overlap. After building the map, mentally check it at a normal zoom level to confirm every label is legible and nothing overlaps — this belongs in the final quality checklist.)*

### 🍽️ 3) دليل المطاعم والمعالم
- معلومات كاملة عن كل مطعم حلال ومعلم رئيسي: رابط Google Maps، الساعات التقديرية، الأسعار التقديرية بعملة المستخدم، وصف مختصر
- **بدون أي صور** — روابط خرائط ووصف فقط (لا صور معالم ولا مطاعم ولا فنادق).

## 4️⃣ خيارات التعديل بعد التسليم | Follow-up options

بعد التسليم، اعرض بإيجاز (سؤال أو سؤالين بس، مو قائمة طويلة):
- تعديل بسيط داخل نفس المفهوم (مطاعم/معالم أكثر، تعديل ميزانية بسيط، تركيز على اهتمام معين)
- **"خيار/مفهوم ثاني"** — يرجعك لمرحلة بطاقات المفاهيم (المرحلة ١) بمفاهيم بديلة، **مو** تعديل مباشر على الملفات الحالية
- تغيير الميزانية أو العملة (تعديل بسيط إذا ما أثر على تركيبة المدن، وإلا يرجع لمرحلة ١)

## ⚠️ نقطة حرجة: الأسعار التقديرية

كل سعر بكل الملفات (HTML، الخريطة، دليل المطاعم) لازم يكون واضح إنه **تقديري** وبعملة المستخدم المختارة، مع تنبيه: "الأسعار تتغير باستمرار — تأكد عند الحجز الفعلي."

## قائمة التحقق النهائية | Final quality checklist

قبل التسليم، تأكد:
- ✅ **تم عرض بطاقات المفاهيم (المرحلة ١) واختار المستخدم واحد قبل بناء أي ملف** — ما فيه بناء ملفات كاملة قبل الاختيار
- ✅ سؤال اللغة أول شي، وكل الملفات فعليًا بنفس اللغة المختارة
- ✅ فرع التواريخ اتبع بالضبط (تواريخ محددة أو مدة تقريبية + شهر اختياري)
- ✅ العملة المستخدمة هي اللي اختارها المستخدم فعلاً بكل الملفات
- ✅ بطاقة ملخص سريع بأعلى ملف HTML
- ✅ **قسم ميزانية مدمج داخل الـHTML** (جدول/بطاقات نظيفة) — **بدون أي ملف Excel/xlsx**
- ✅ **شريط "افتح بالمتصفح" بأعلى كل ملف HTML** (خصوصًا الخريطة)
- ✅ تذكير فيزا/دخول موجود
- ✅ تنبيه مهرجانات/أعياد إذا التواريخ أو الشهر معروف
- ✅ كل مدينة فيها معالم وأنشطة كافية (4-6 على الأقل)، مو مطاعم بس
- ✅ **الانتقالات بين المدن موضّحة** (وسيلة + مدة + تكلفة + حجز مسبق)، كبطاقة بارزة بالـHTML، وكبند بالميزانية، وكخط مسمّى على الخريطة
- ✅ **قسم "تحضيرات عملية خاصة بالدولة"** موجود ويغطي ما ينطبق فعلًا (دفع، إنترنت/VPN، تطبيقات، قابس، إجراءات وصول)
- ✅ **بدون أي صور معالم** بكل الملفات (لا `<img>` من مصادر خارجية) — وصف + روابط خرائط فقط
- ✅ **الخريطة على الجوال:** `#map` قبل `#sidebar` بالـDOM فعليًا (مو `order` بالـCSS)، ارتفاع بكسل ثابت (مو `vh`/`%`)، و`invalidateSize()` بعد التحميل — تأكد إن الخريطة تظهر فوق القائمة وما تطلع سوداء/فاضية
- ✅ **الضغط على عنصر بالقائمة يسكرول تلقائيًا للخريطة** (scrollIntoView) ثم يفتح الموقع **في وسط الخريطة** (بإزاحة project/unproject، مو بالزاوية) — على الجوال
- ✅ مصدر Leaflet احتياطي + رسالة واضحة إذا فشل تحميل المكتبة (بدل مربع أسود)
- ✅ كل فندق فيه رابط Booking.com + رابط Google Maps
- ✅ خطوط الخريطة صلبة (solid) وملونة حسب مدة الانتقال (أخضر/برتقالي/كحلي أو بنفسجي — **ليس أحمر**، محجوز لسلمانينيو) — بدون أي خط متقطع
- ✅ تسميات المدة/المسافة على الخريطة واضحة ومقروءة تمامًا، بخلفية بيضاء معتمة و`iconSize` محدد بشكل صحيح (مو `[0,0]`)، وبدون أي تراكب مع العلامات أو الخطوط الثانية
- ✅ 2-3 مطاعم حلال على الأقل بكل مدينة، مع رابط Google Maps منفصل لكل وحدة
- ✅ الملفات الثلاثة كاملة وجاهزة للمشاركة
- ✅ إذا الدولة موجودة بـ `references/salmaninho-locations.md`، كل المواقع المطابقة مضافة (قسم منفصل)، مظللة بالأحمر حصريًا، بدون وقت/مسافة/خط اتجاه، مع شكر واضح لسلمانينيو ورابط صفحته — وإذا مو موجودة، ما فيه أي ذكر له
- ✅ اللون الأحمر مستخدم فقط لمحتوى سلمانينيو بكل الملفات — ما فيه أي عنصر ثاني (مدينة، خط، زر) يستخدم الأحمر
- ✅ كل ملفات HTML تشتغل تمام على عرض جوال (~375px): بدون نص مقطوع، بدون تراكب، بدون سكرول أفقي غير مقصود — وقائمة الخريطة الجانبية تتحول لتخطيط عمودي (مو عرض ثابت يضغط الخريطة)

---

✨ **هذا السكيل يخلي أي شخص، بأي لغة، يخطط رحلة كاملة لأي دولة بالعالم خلال دقائق — بدون ما يحتاج مكتب سياحة وبدون ما يضيع وقته.**
