/* The quiz, the site's front page (index.html): which well-known bottles the visitor has worn and how each one ended. Each
   verdict is written as an ordinary rating into the device store the profiler reads, so both pages show
   the same profile. Storage, sending, the lazy catalogue and the lookup follow app.js; profile logic lives
   in engine.js, the note rows and told items in notes.js. What the visitor says in words (notes enjoyed or avoided,
   bitter or sweet, complaints) enters the profile as told items, which can reorder picks but never set a class;
   the anosmia answer stays on this page. */
(function () {
  "use strict";
  const D = window.PP_DATA, M = window.PP_MAP;
  if (!D || !M || !window.PP_ENGINE || !window.PP_NOTES || !window.PP_CONFIG) { document.getElementById("quiz").textContent = "A script in js/ did not load (config, data, mapper, engine or notes). Serve the site folder as it is."; return; }
  const { FAMILIES, CHIPS, QUIZ } = D;
  const E = window.PP_ENGINE.create(D, M, window.PP_EVIDENCE);
  const N = window.PP_NOTES.create(D, M, E), normTold = window.PP_NOTES.normTold;
  const { STAGES, PERFUMES, byId } = E;
  /* the drawn bottle, for a perfume with no photo: cream glass, amber juice, a gold cap */
  const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect x="22" y="5" width="12" height="9" rx="2" fill="#C99C43"/><rect x="25" y="14" width="6" height="4" fill="#B8862A"/><rect x="14" y="18" width="28" height="33" rx="7" fill="#FCF8F0" stroke="#C1AA8B" stroke-width="1.5"/><path d="M15.5 33h25v10.5a6 6 0 0 1-6 6h-13a6 6 0 0 1-6-6z" fill="#F0B135" opacity=".55"/><rect x="18" y="21" width="3" height="20" rx="1.5" fill="#fff" opacity=".8"/></svg>');

  /* Deployment settings: config.js. */
  const CONFIG = window.PP_CONFIG;
  /* Local testing only: http://localhost:8765/?endpoint=http://localhost:8765/api (see tools/mock_backend.py).
     Links to the profiler carry the parameter forward. */
  let endpointParam = "";
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { try { const e = new URLSearchParams(location.search).get("endpoint"); if (e) { CONFIG.endpoint = e; endpointParam = e; } } catch (err) { /* ignore */ } }

  /* ---------- i18n ---------- */
  const T = {
    en: {
      brand: "Scent Profiler", tagline: "find what you hate before you buy", navProfiler: "Your profile", navArticles: "Why drydowns fail",
      gridQ: "Which of these have you tried?",
      gridHint: "On skin or clothes, at home or in a shop; a sniff from a paper strip doesn't count. Next, you say how each one ended for you.",
      qLabel: "Search for another perfume", q: "Not here? Type a perfume or a house",
      none: "None of these", cont: n => (n ? `Continue with ${n}` : "Continue"),
      rated: "already rated", ratedToast: "Already rated on your profile.",
      lookingUp: "Looking it up…", notFound: "Not found. You can add it by name on your profile.",
      part: (i, name) => `Part ${i} of 4 · ${name}`, parts: ["Your bottles", "Notes you know", "Sweet or bitter", "What bothers you"], back: "Back",
      count: (i, n) => `Bottle ${i} of ${n}`,
      verdictQ: "How did it end?",
      verdicts: { still: "I still wear it", turned: "I stopped wearing it: it turned on me", other: "I stopped for another reason", shop: "I tried it in a shop and it put me off", unsure: "I don't remember how it ended" },
      whenQ: "When did it bother you?",
      when: { opening: "In the first minutes", heart: "In the first hours", drydown: "Hours later, or on my clothes", unsure: "I don't remember" },
      wrongQ: "What was wrong? (optional)", wrongShop: "What put you off? (optional)", next: "Next",
      notesIntro: (name, n) => `${cap(["", "one", "two", "three", "four", "five"][n] || String(n))} ${n === 1 ? "note" : "notes"} from ${name}. Tap what you remember; skip what you don't.`,
      rowStage: { opening: "First minutes", heart: "First hours", drydown: "Hours later" },
      notListed: "not on its note list", notListedHint: "Some materials are in a perfume without being on its note list.",
      answers: { "-2": "Hated it", "-1": "Disliked it", 0: "Didn't mind", 1: "Liked it", 2: "Loved it", u: "Didn't notice it" },
      change: "Change", skipNotes: "Skip the notes for this bottle", skipAllNotes: "Skip notes for the other bottles",
      narrowQ: "One more would settle it: have you worn any of these?",
      narrowHint: "Each of these has, in its base, a family that may be a deal-breaker for you. Your verdict on it shows whether that family is the problem.",
      noneNarrow: "None of these, or I don't know them",
      tests: f => `Tests: ${f}`,
      pickerH: { fresh: "Citrus and fresh", flowers: "Flowers", fruit: "Fruit and sweet", spices: "Spices and herbs", woods: "Woods, resins, musks and smoke" },
      pickerQ: "Which of these do you enjoy in a perfume, and which do you avoid? Leave the rest at Not sure.",
      pick: { 1: "I enjoy it", "-1": "I avoid it", 0: "Not sure" }, pickCount: (i, n) => `${i} of ${n}`, pickMore: n => `More notes (${n})`,
      tasteQ: "When a perfume leans one way, which do you prefer?",
      taste: { bitter: "Bitter and fresh (tea, grapefruit, vetiver)", sweet: "Sweet (vanilla, caramel, ripe fruit)", both: "Both, it depends", unsure: "I don't know" },
      toldQ: "Which of these have bothered you in a perfume? Pick all that apply.",
      toldNone: "Nothing has bothered me", toldUnsure: "I don't know",
      anosQ: "Do people say a perfume is strong on you when you can barely smell it?",
      anos: { yes: "Yes", no: "No", unsure: "Not sure" },
      resultH: "Your scent profile",
      drawn: { likely: "Drawn to", possible: "Probably drawn to" }, breaker: { likely: "Your deal-breaker", possible: "Possible deal-breaker" },
      fromBottles: "From your bottles:", has: "has", without: f => `No ${f.charAt(0).toLowerCase() + f.slice(1)}`, getSample: "Sample",
      basis: (b, a) => `Built from ${b} ${b === 1 ? "bottle" : "bottles"} and ${a} ${a === 1 ? "answer" : "answers"}.`,
      reading: "Reading your bottles", kept: "You kept", turned: "Turned on you", skip: "Show my result",
      palate: "Your palate", funnel: { checked: "perfumes checked", out: "ruled out for you", picked: "chosen for you" },
      cardPalate: "My palate",
      startH: "Find what ruins a perfume for you",
      startLede: "Tell us how the perfumes you know ended for you. We find the material family behind the ones that turned on you, name your palate and choose three samples to try next.",
      startParts: "Four parts:", startGo: "Start", startBack: "Took the quiz before? Rate the samples you tried",
      palOne: side => `Your bottles show a liking for ${side}.`,
      palTwo: (a, b) => `Your bottles show two likings, each with bottles behind it: ${a}, and ${b}.`, tipH: "A tip for your palate",
      pal: {
        amber: { side: "warm, resinous bases", tip: "These materials carry a perfume's last hours, so judge an amber sample hours after you put it on, not at the counter." },
        sweet: { side: "dessert-like sweetness", tip: "Sweet perfumes differ most in their base: the patchouli, woods or musk under the sugar are what set one vanilla apart from the next." },
        oud: { side: "dark, smoky materials", tip: "Most oud in Western perfumes is a smoky accord, while natural oud smells more animal and leathery. If you have met only one, a sample of the other shows which you like." },
        musk: { side: "musks", tip: "Many people cannot smell one or more musks, so a musk perfume can be strong on you while you barely notice it. Ask someone near you before you add more sprays." },
        woody: { side: "woods", tip: "These woods smell very different, from the dry, radiant Ambroxan-type base to creamy sandalwood, so follow the families listed below rather than the word \"woody\" on a box." },
        rose: { side: "rose", tip: "A lemony green rose and a honeyed, jammy one rarely smell like the same flower. If you have met only one kind, try a sample of the other." },
        floral: { side: "flowers", tip: "Heavy white florals and light, clean ones are far apart, so follow the families listed below rather than the word \"floral\" on a box." },
        fresh: { side: "fresh, bright materials", tip: "Citrus is usually gone within the hour, so what makes a fresh perfume last is something else, often sea notes, musk or woods. Smell a sample again after an hour before you buy." },
        spiced: { side: "spice", tip: "Saffron and warm spices often sit on an oud, amber or woody base, and the base decides whether you keep the perfume. Judge a sample hours in, not only at the first spray." },
        wide: { text: "Your bottles cover several kinds of perfume and none of them leads: you like a wide range.", tip: "For a palate this wide, the useful finding is what you avoid: your deal-breaker rules perfumes out, and everything else is open to you.", tipNone: "No deal-breaker has shown up yet. Rating more bottles on your profile, especially ones that turned on you, is how one shows up." },
        selective: { text: "None of your bottles stands out as a like, but they do show what you avoid.", tip: "That is the useful half: the count above shows how many perfumes your deal-breaker rules out." }
      },
      compare: { breaker: (p, n, f) => `${p} of the ${n} people who finished this quiz share your deal-breaker: ${f}.`, palate: (p, n) => `${p} of the ${n} people who finished this quiz share your palate.` }, under1: "Under 1%",
      share: "Share my profile", shareMade: "Saved as an image", shareFail: "Your browser could not make the image",
      card: { title: "My scent profile", drawn: { likely: "Drawn to", possible: "Probably drawn to" }, breaker: { likely: "My deal-breaker", possible: "Possible deal-breaker" }, picks: "Next to try", tagline: "Find what you hate before you buy" },
      how: "How we worked this out", picksLede: { avoid: "Chosen to steer clear of your deal-breakers.", like: "Chosen from what you like." },
      resultLede: "Material families, not marketing notes. Each line names the bottles it rests on.",
      worn: "from what you wore", shopTrial: "from a shop trial",
      cls: { badLikely: "Likely deal-breaker", badPossible: "Possible deal-breaker", goodLikely: "Reliably liked", goodPossible: "Probably liked", mixed: "Depends on the perfume" },
      noFamilies: "No family stands out yet. More bottles on your profile will show one.",
      recsH: "Three to try next", recsLede: "Ranked by what they avoid first, and what they share with your likes second. Samples, never blind bottles.",
      oneMore: "One more bottle gives you three recommendations. Add it on your profile.",
      full: "See the full profile",
      noneH: "Start with a sample",
      noneLede: "Your profile comes from perfumes you have worn, so it cannot be built yet. Each of these three has one family strong in its base: wear a sample for a day and see whether that family bothers you.",
      carry: n => `If this bothers you, ${n} other perfumes in our catalogue carry the same family in their base.`,
      rateLater: "Rate it when you have worn it",
      noteLine: (perfume, words, v, stage) => `${perfume}: you ${{ 2: "loved", 1: "liked", 0: "didn't mind", "-1": "disliked", "-2": "hated" }[v]} the ${words} (${stage})`,
      youEnjoy: w => `You enjoy: ${w}`, youAvoid: w => `You avoid: ${w}`, bothered: w => `Has bothered you: ${w}`,
      prefer: { bitter: "You prefer bitter to sweet", sweet: "You prefer sweet to bitter" }, fromTold: "from what you told us",
      disagree: w => `Your bottles and your answer (${w}) disagree; your bottles count more.`,
      unnoticed: pairs => `You did not notice ${pairs}.`, unnoticedPair: (f, bottle) => `the ${f} in ${bottle}`,
      toldOnlyH: "Based only on what you told us",
      toldOnlyLede: "No bottle yet, so these picks rest on your answers alone. Answers in words are a weaker guide than a bottle you have worn: try a sample first.",
      confirmH: "Samples that would confirm it",
      confirmLede: "Each has one family strong in its base: wear a sample for a day and see whether that family bothers you.",
      anosmiaNote: name => `Musks and woody ambers may be hard for you to judge: some people barely smell them even when others can. A sample of ${name}, whose base is mostly white musk, shows whether you can.`,
      sampleSA: "Sample (Saudi shops)", sampleUS: "Sample (US)", bottle: "Full bottle",
      foot: `<p>Sample and bottle links may earn a commission; ranking never depends on it. Ratings are stored on this device. If sharing is switched on, they are sent anonymously with a random device id and nothing else.</p>`,
      cats: { m: "men", f: "women", u: "unisex" }
    },
    ar: {
      brand: "محلل الذائقة العطرية", tagline: "اعرف ما تكرهه قبل أن تشتري", navProfiler: "ملفك العطري", navArticles: "لماذا يتغيّر العطر بعد ساعات",
      gridQ: "أيّ هذه العطور جرّبتها؟",
      gridHint: "على البشرة أو على الثياب، في البيت أو في المتجر؛ شمّ الورقة لا يُحسب. بعدها تخبرنا كيف انتهى كل عطر منها معك.",
      qLabel: "ابحث عن عطر آخر", q: "ليس هنا؟ اكتب اسم عطر أو دار",
      none: "لا شيء منها", cont: n => (n ? `تابع (${n})` : "تابع"),
      rated: "قيّمته من قبل", ratedToast: "قيّمته من قبل في ملفك العطري.",
      lookingUp: "جارٍ البحث عنه…", notFound: "لم نجده. يمكنك إضافته باسمه في ملفك العطري.",
      part: (i, name) => `الجزء ${i} من 4 · ${name}`, parts: ["عطورك", "نوتات تعرفها", "حلو أو مرّ", "ما يزعجك"], back: "رجوع",
      count: (i, n) => `العطر ${i} من ${n}`,
      verdictQ: "كيف انتهى معك؟",
      verdicts: { still: "ما زلت أستخدمه", turned: "توقفت عن استخدامه: انقلب عليّ", other: "توقفت عنه لسبب آخر", shop: "جرّبته في متجر فنفرت منه", unsure: "لا أتذكر كيف انتهى معي" },
      whenQ: "متى أزعجك؟",
      when: { opening: "في الدقائق الأولى", heart: "في الساعات الأولى", drydown: "بعد ساعات، أو على ثيابي", unsure: "لا أتذكر" },
      wrongQ: "ما الذي أزعجك؟ (اختياري)", wrongShop: "ما الذي نفّرك منه؟ (اختياري)", next: "التالي",
      notesIntro: (name, n) => `${["", "نوتة واحدة", "نوتتان", "ثلاث نوتات", "أربع نوتات", "خمس نوتات"][n] || n + " نوتات"} من ${name}. اختر ما تتذكره، وتجاوز ما لا تتذكره.`,
      rowStage: { opening: "الدقائق الأولى", heart: "الساعات الأولى", drydown: "بعد ساعات" },
      notListed: "غير مذكور في قائمة نوتاته", notListedHint: "بعض المواد تكون في العطر من دون أن تُذكر في قائمة نوتاته.",
      answers: { "-2": "كرهته", "-1": "لم يعجبني", 0: "لا بأس به", 1: "أعجبني", 2: "أعجبني كثيراً", u: "لم ألاحظه" },
      change: "تغيير", skipNotes: "تجاوز نوتات هذا العطر", skipAllNotes: "تجاوز النوتات لبقية العطور",
      narrowQ: "عطر واحد آخر يحسم الأمر: هل جرّبت أياً من هذه؟",
      narrowHint: "في قاعدة كل واحد منها عائلة قد تكون مُفسدة لك. وجوابك عنه يبيّن إن كانت هذه العائلة هي السبب.",
      noneNarrow: "لا شيء منها، أو لا أعرفها",
      tests: f => `يختبر: ${f}`,
      pickerH: { fresh: "حمضيات ومنعش", flowers: "زهور", fruit: "فواكه وحلويات", spices: "توابل وأعشاب", woods: "أخشاب وراتنجات ومسك ودخان" },
      pickerQ: "أيّ هذه تحبه في العطر، وأيّها تتجنبه؟ اترك الباقي على «لست متأكداً».",
      pick: { 1: "أحبه", "-1": "أتجنبه", 0: "لست متأكداً" }, pickCount: (i, n) => `${i} من ${n}`, pickMore: n => `نوتات أخرى (${n})`,
      tasteQ: "حين يميل العطر إلى جهة، أيّهما تفضّل؟",
      taste: { bitter: "مرّ ومنعش (شاي، جريب فروت، فيتيفر)", sweet: "حلو (فانيلا، كراميل، فاكهة ناضجة)", both: "كلاهما، حسب العطر", unsure: "لا أعرف" },
      toldQ: "أيّ هذه أزعجك في عطرٍ ما؟ اختر كل ما ينطبق.",
      toldNone: "لم يزعجني شيء", toldUnsure: "لا أعرف",
      anosQ: "هل يقول لك الناس إن عطرك قوي بينما لا تكاد تشمّه؟",
      anos: { yes: "نعم", no: "لا", unsure: "لست متأكداً" },
      resultH: "ذائقتك العطرية",
      drawn: { likely: "تنجذب إلى", possible: "على الأرجح تنجذب إلى" }, breaker: { likely: "يفسد العطر عليك", possible: "قد يفسد العطر عليك" },
      fromBottles: "من عطورك:", has: "فيه", without: f => `خالٍ من ${f}`, getSample: "عينة",
      basis: (b, a) => `بُني على ${b} من عطورك و${a} من إجاباتك.`,
      reading: "نقرأ عطورك", kept: "أبقيتها", turned: "انقلبت عليك", skip: "اعرض النتيجة",
      palate: "ذائقتك", funnel: { checked: "عطراً فحصناها", out: "استبعدناها لك", picked: "اخترناها لك" },
      cardPalate: "ذائقتي",
      startH: "اعرف ما يفسد العطر عليك",
      startLede: "أخبرنا كيف انتهت معك العطور التي تعرفها. نجد عائلة المواد وراء العطور التي انقلبت عليك، ونسمّي ذائقتك، ونختار لك ثلاث عيّنات تجرّبها بعد ذلك.",
      startParts: "أربعة أجزاء:", startGo: "ابدأ", startBack: "أنهيت الاختبار من قبل؟ قيّم العيّنات التي جرّبتها",
      palOne: side => `عطورك تكشف ميلك إلى ${side}.`,
      palTwo: (a, b) => `عطورك تكشف ميلين، لكلٍّ منهما عطور تشهد له: إلى ${a}، وإلى ${b}.`, tipH: "نصيحة لذائقتك",
      pal: {
        amber: { side: "القواعد الدافئة الراتنجية", tip: "هذه المواد تحمل الساعات الأخيرة من العطر، فاحكم على عيّنة العنبر بعد ساعات من وضعها، لا في المتجر." },
        sweet: { side: "الحلاوة التي تشبه الحلويات", tip: "تختلف العطور الحلوة في قاعدتها أكثر من أي شيء آخر: الباتشولي أو الأخشاب أو المسك تحت السكر هي ما يميّز فانيلا عن أخرى." },
        oud: { side: "المواد الداكنة المدخّنة", tip: "أغلب العود في العطور الغربية تركيبة مدخّنة، أما العود الطبيعي فرائحته أقرب إلى الحيواني والجلدي. إن لم تجرّب إلا نوعاً واحداً، فعيّنة من الآخر تبيّن لك أيّهما تحب." },
        musk: { side: "المسك", tip: "كثير من الناس لا يشمّون نوعاً أو أكثر من المسك، فقد يكون عطر المسك قوياً عليك وأنت بالكاد تلاحظه. اسأل من حولك قبل أن تزيد الرشّات." },
        woody: { side: "الأخشاب", tip: "هذه الأخشاب مختلفة جداً، من قاعدة الأمبروكسان الجافة النفّاذة إلى الصندل الكريمي، فاتبع العائلات المذكورة أدناه لا كلمة «خشبي» على العلبة." },
        rose: { side: "الورد", tip: "الورد الأخضر الليموني والورد العسلي المربّى نادراً ما يبدوان زهرة واحدة. إن لم تجرّب إلا نوعاً منهما، فجرّب عيّنة من الآخر." },
        floral: { side: "الزهور", tip: "الزهور البيضاء الثقيلة والزهور الخفيفة النظيفة بعيدة عن بعضها، فاتبع العائلات المذكورة أدناه لا كلمة «زهري» على العلبة." },
        fresh: { side: "المواد المنعشة", tip: "الحمضيات تختفي عادة خلال ساعة، فما يُبقي العطر المنعش مادة أخرى، غالباً النفحات البحرية أو المسك أو الأخشاب. اشتمّ العيّنة مرة أخرى بعد ساعة قبل أن تشتري." },
        spiced: { side: "التوابل", tip: "كثيراً ما يأتي الزعفران والتوابل الدافئة على قاعدة من العود أو العنبر أو الأخشاب، والقاعدة هي التي تحدد إن كنت ستبقي على العطر. احكم على العيّنة بعد ساعات، لا عند الرشّة الأولى فقط." },
        wide: { text: "عطورك من أنواع كثيرة ولا يتقدّم أحدها على البقية: ذائقتك تتسع لأنواع كثيرة.", tip: "في ذائقة بهذا الاتساع، النتيجة المفيدة هي ما تتجنّبه: ما يفسد العطر عليك يستبعد عطوراً، وكل ما عداها متاح لك.", tipNone: "لم يظهر بعد ما يفسد العطر عليك. تقييم مزيد من العطور في ملفك العطري، وخاصة التي انقلبت عليك، هو ما يُظهره." },
        selective: { text: "لا يبرز من عطورك ما تحبه بوضوح، لكنها تكشف ما تتجنّبه.", tip: "وهذا هو النصف المفيد: الرقم أعلاه يبيّن كم عطراً يستبعده ما يفسد العطر عليك." }
      },
      compare: { breaker: (p, n, f) => `${p} ممن أنهوا هذا الاختبار (${n}) يشاركونك النفور من ${f}.`, palate: (p, n) => `${p} ممن أنهوا هذا الاختبار (${n}) يشاركونك ذائقتك.` }, under1: "أقل من 1٪",
      share: "شارك ذائقتك", shareMade: "حُفظت صورة", shareFail: "تعذّر على المتصفح صنع الصورة",
      card: { title: "ذائقتي العطرية", drawn: { likely: "أنجذب إلى", possible: "على الأرجح أنجذب إلى" }, breaker: { likely: "يفسد العطر عليّ", possible: "قد يفسد العطر عليّ" }, picks: "أجرّبها بعد ذلك", tagline: "اعرف ما تكرهه قبل أن تشتري" },
      how: "كيف توصّلنا إلى هذا", picksLede: { avoid: "اختيرت لتبتعد عمّا يفسد العطر عليك.", like: "اختيرت مما تحبه." },
      resultLede: "عائلات المواد، لا النوتات التسويقية. كل سطر يذكر العطور التي بُني عليها.",
      worn: "مما استخدمته", shopTrial: "من تجربة في متجر",
      cls: { badLikely: "مُفسد مرجّح", badPossible: "مُفسد محتمل", goodLikely: "تحبه باستمرار", goodPossible: "تحبه على الأرجح", mixed: "يعتمد على العطر" },
      noFamilies: "لا تبرز أي عائلة بعد. قيّم عطوراً أخرى في ملفك العطري لتظهر.",
      recsH: "ثلاثة لتجربتها", recsLede: "مرتّبة بحسب ما تتجنبه أولاً، وما تشترك فيه مع ما أحببته ثانياً. عينات، لا زجاجات على العمياني.",
      oneMore: "عطر واحد آخر يعطيك ثلاثة ترشيحات. أضفه في ملفك العطري.",
      full: "اعرض الملف الكامل",
      noneH: "ابدأ بعينة",
      noneLede: "ملفك يُبنى من عطور جرّبتها، لذلك لا يمكن بناؤه بعد. لكل واحد من هذه الثلاثة عائلة واحدة قوية في قاعدته: جرّب عينة منه يوماً كاملاً لترى إن كانت تلك العائلة تزعجك.",
      carry: n => `إن أزعجك هذا، فعدد العطور الأخرى في قائمتنا التي تحمل العائلة نفسها في قاعدتها: ${n}.`,
      rateLater: "قيّمه بعد أن تجرّبه",
      noteLine: (perfume, words, v, stage) => `${perfume}: «${words}» (${stage}): إجابتك «${{ 2: "أعجبني كثيراً", 1: "أعجبني", 0: "لا بأس به", "-1": "لم يعجبني", "-2": "كرهته" }[v]}»`,
      youEnjoy: w => `تحب: ${w}`, youAvoid: w => `تتجنب: ${w}`, bothered: w => `أزعجك من قبل: ${w}`,
      prefer: { bitter: "تفضّل المرّ على الحلو", sweet: "تفضّل الحلو على المرّ" }, fromTold: "مما أخبرتنا به",
      disagree: w => `عطورك وإجابتك (${w}) لا تتفقان، ولعطورك الوزن الأكبر.`,
      unnoticed: pairs => `لم تلاحظ ${pairs}.`, unnoticedPair: (f, bottle) => `${f} في ${bottle}`,
      toldOnlyH: "بناءً على ما أخبرتنا به فقط",
      toldOnlyLede: "لم تقيّم أي عطر بعد، لذلك تعتمد هذه الترشيحات على إجاباتك وحدها. وإجاباتك دليل أضعف من عطر جرّبته: جرّب عينة أولاً.",
      confirmH: "عينات تؤكد ذلك",
      confirmLede: "لكل واحد منها عائلة واحدة قوية في قاعدته: جرّب عينة منه يوماً كاملاً لترى إن كانت تلك العائلة تزعجك.",
      anosmiaNote: name => `قد يصعب عليك الحكم على المسك والأخشاب العنبرية: بعض الناس لا يكادون يشمّونها وإن شمّها غيرهم. عينة من ${name}، وقاعدته مسك أبيض في معظمها، تبيّن لك إن كنت تشمّه.`,
      sampleSA: "عينة (متاجر سعودية)", sampleUS: "عينة (أمريكا)", bottle: "زجاجة كاملة",
      foot: `<p>روابط العينات والزجاجات قد تكسب عمولة، والترتيب لا يعتمد عليها أبداً. التقييمات محفوظة على هذا الجهاز. إن كانت المشاركة مفعّلة تُرسل بلا اسم مع معرّف جهاز عشوائي ولا شيء غيره.</p>`,
      cats: { m: "رجالي", f: "نسائي", u: "للجنسين" }
    }
  };

  /* ---------- state ---------- */
  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  let lang = store.get("pp_lang", "ar");   /* Arabic first, whatever the device language; a chosen language is kept */
  let ratings = store.get("pp_ratings_v1", {});
  let device = store.get("pp_device", null);
  if (!device) { device = "d_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set("pp_device", device); }
  /* { notes: { noteId: 1 | -1 }, taste: "bitter" | "sweet" | "both" | "unsure", told: [chipId], toldNone: true when
     nothing has bothered the visitor, anosmia: "yes" | "no" | "unsure" }. An old string told is read through normTold. */
  let quiz = store.get("pp_quiz_v1", {});
  if (!quiz || typeof quiz !== "object") quiz = {};
  if ("told" in quiz || "toldNone" in quiz) { const nt = normTold(quiz); quiz.told = nt.told; if (nt.toldNone) quiz.toldNone = true; else delete quiz.toldNone; }
  let AUTO = {};        /* id -> catalogue entry from the backend (lazy catalogue) */
  let images = {};      /* verified id -> image url, from the backend's catalogue */

  /* the step machine: a start screen, then four parts: grid, verdicts, notes and narrow (your bottles); picker
     (notes you know); taste (sweet or bitter); told and anosmia (what bothers you); then the result */
  let step = "start";
  const picked = new Set();     /* grid and search bottles tapped on the first screen */
  const extra = [];             /* bottles added through the search, shown after the twenty */
  let queue = [], at = 0, round = 1;
  const ans = {};               /* id -> { verdict, stage, when, chips, na, un } for bottles answered on this visit (na, un: note answers) */
  const prior = {};             /* id -> the record before this visit's first verdict, restored by "another reason" */
  let narrow = [], narrowPicked = new Set();
  let pk = 0;                   /* the note picker screen shown */
  const pkMore = new Set();     /* picker screens opened with "More notes" */
  let noNotes = false;          /* "Skip notes for the other bottles" was chosen */
  let editing = new Set();      /* answered note rows reopened with "Change" on the screen shown */
  let toldUnsure = false;       /* "I don't know" on the complaints screen; not stored */
  const hist = [];              /* one snapshot per screen shown, for Back */
  const sent = new Set();       /* events already sent on this visit: each goes out once, when its screen is first left */
  let doneSent = false;
  let shown = { testers: [], picks: [] };   /* ids in the order the result shows them, for the link events' n */

  const t = () => T[lang];
  const fam = k => (FAMILIES[k] ? FAMILIES[k][lang] : k);
  const pname = p => (lang === "ar" && p.ar ? p.ar : p.name);
  const chipWord = id => { const c = CHIPS.find(x => x.id === id); return c ? c[lang] : id; };
  const cap = s => (lang === "en" && s ? s[0].toUpperCase() + s.slice(1) : s);
  const low = s => (lang === "en" && s ? s[0].toLowerCase() + s.slice(1) : s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const listJoin = arr => lang === "ar" ? arr.join("، ") : arr.length > 1 ? arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1] : arr[0] || "";
  /* a shipped bottle photo first (js/bottles.js), then the backend's vendor image, then the drawn bottle */
  const bottleSrc = P => (P && window.PP_BOTTLES && window.PP_BOTTLES[P.id]) || (P && P.image) || "";
  const imgTag = (P, cls) => { const src = bottleSrc(P); return `<img class="thumb${src ? " photo" : ""} ${cls || ""}" src="${src ? esc(src) : PLACEHOLDER}" alt="" loading="lazy" onerror="this.onerror=null;this.classList.remove('photo');this.src='${PLACEHOLDER}'">`; };
  /* A rating counts only when a stage is set; an all-null record (for example one left by a tester link) is unrated. */
  const hasStage = id => { const r = ratings[id]; return !!r && STAGES.some(s => r[s] != null); };
  /* A quiz rating whose only set stage is opening at -1 is a shop trial (the shop verdict writes it). */
  const shopTrial = id => { const r = ratings[id]; return !!r && r.src === "quiz" && r.opening === -1 && r.heart == null && r.drydown == null; };
  /* rated before this visit: a bottle answered on this visit can still be picked again after Back */
  const ratedBefore = id => hasStage(id) && !ans[id];
  /* A bottle's note rows (notes.js): shop rows for a shop trial, worn rows otherwise. */
  const kindOf = id => ((ans[id] ? ans[id].verdict === "shop" : shopTrial(id)) ? "shop" : "worn");
  const rowsFor = id => { const P = resolve(id); return P ? N.questions(P, kindOf(id)) : []; };
  const profilerHref = (add, hash) => {
    const p = [];
    if (add) p.push("add=" + encodeURIComponent(add));
    if (endpointParam) p.push("endpoint=" + encodeURIComponent(endpointParam));
    return "profile.html" + (p.length ? "?" + p.join("&") : "") + (hash || "");
  };

  /* ---------- profile engine (engine.js) ---------- */
  const state = () => ({ ratings, auto: AUTO, images });
  const resolve = id => E.resolve(id, state());
  const derived = entry => E.derived(entry);
  /* the visitor's word answers as told items (notes.js), so both pages build the same list */
  const computeProfile = () => E.computeProfile(Object.assign(state(), { told: N.toldItems(quiz) }));
  const recommend = prof => E.recommend(prof, ratings);

  /* ---------- persistence and sharing (as app.js) ---------- */
  /* One pending send per perfume, so answering another bottle never cancels it; pending sends go out at once
     when the page is hidden or closed. */
  const sendTimers = {};
  function sendRating(id, leaving) {
    clearTimeout(sendTimers[id]); delete sendTimers[id];
    if (!ratings[id]) return;
    const P = resolve(id); const { auto, label, ...rest } = ratings[id];
    sendRecord({ type: "rating", device, lang, perfume: id, name: P ? P.name : id, ...rest }, leaving);
  }
  function persist(id) {
    store.set("pp_ratings_v1", ratings);
    if (!CONFIG.endpoint) return;
    clearTimeout(sendTimers[id]);
    sendTimers[id] = setTimeout(() => sendRating(id), 1200);
  }
  function flushSends() { for (const id of Object.keys(sendTimers)) sendRating(id, true); }
  /* leaving: the page is being hidden or closed, so the request must outlive it */
  function sendRecord(rec, leaving) {
    const body = JSON.stringify({ ...rec, ts: new Date().toISOString() });
    try {
      if (leaving && navigator.sendBeacon && navigator.sendBeacon(CONFIG.endpoint, body)) return;
      fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, keepalive: !!leaving }).catch(() => {});
    } catch (e) { /* offline or blocked */ }
  }
  function sendEvent(name, n) { if (CONFIG.endpoint) sendRecord({ type: "event", name, n, device, lang }); }
  function loadCatalogue() {
    if (!CONFIG.endpoint) return;
    try {
      fetch(CONFIG.endpoint + (CONFIG.endpoint.includes("?") ? "&" : "?") + "catalogue=1").then(r => r.json()).then(j => {
        for (const e of (j && j.entries) || []) { if (!e || !e.id) continue; if (byId[e.id]) { if (e.image) images[e.id] = e.image; } else AUTO[e.id] = e; }
        if (step === "grid") renderGridParts(); else render();
      }).catch(() => {});
    } catch (e) { /* ignore */ }
  }

  /* ---------- verdicts written as ratings ---------- */
  /* still: drydown +1, again 1. turned: -2 on the stage from "When did it bother you?" (drydown until answered),
     again 0, chips on that stage; "I don't remember" when keeps the drydown. shop: opening -1, chips on opening.
     other and unsure: nothing written. The note rows' answers go into noteAnswers and unnoticed. */
  function writeVerdict(id) {
    const a = ans[id];
    if (!(id in prior)) prior[id] = ratings[id];
    const before = prior[id];
    if (a.verdict === "other" || a.verdict === "unsure") {
      if (before) ratings[id] = before; else delete ratings[id];
      clearTimeout(sendTimers[id]); delete sendTimers[id];
      store.set("pp_ratings_v1", ratings);
      return;
    }
    const rec = { opening: null, heart: null, drydown: null, again: null, chips: {} };
    if (a.verdict === "still") { rec.drydown = 1; rec.again = 1; }
    if (a.verdict === "turned") { rec[a.stage] = -2; rec.again = 0; if (a.chips.length) rec.chips[a.stage] = a.chips.slice(); }
    if (a.verdict === "shop") { rec.opening = -1; if (a.chips.length) rec.chips.opening = a.chips.slice(); }
    if (before && before.auto) rec.auto = before.auto; else if (!byId[id] && AUTO[id]) rec.auto = AUTO[id];
    if (before && before.label) rec.label = before.label;
    rec.src = "quiz";
    if (a.na && Object.keys(a.na).length) rec.noteAnswers = Object.assign({}, a.na);
    if (a.un && a.un.length) rec.unnoticed = a.un.slice();
    ratings[id] = rec;
    persist(id);
  }
  function giveVerdict(v) {
    const id = queue[at]; if (!id) return;
    if (!ans[id] || ans[id].verdict !== v) ans[id] = { verdict: v, stage: v === "shop" ? "opening" : "drydown", when: null, chips: [], na: {}, un: [] };
    writeVerdict(id);
    if (v === "still") toNotes(); else if (v === "other" || v === "unsure") advance(); else render();
  }
  /* still, turned and shop go on to the bottle's note rows, unless it has none or the visitor skipped them all */
  function toNotes() {
    if (!noNotes && rowsFor(queue[at]).length) go("notes"); else advance();
  }
  /* Leave the bottle: its events go out (the verdict, "I don't remember" when, then the notes event), and the
     next bottle, the narrowing round or the note picker follows. from: the snapshot for Back, when taken earlier. */
  function advance(from, notesEvent) {
    from = from || snap();
    const id = queue[at], a = ans[id];
    if (a) {
      sendOnce("verdict:" + id, "verdict:" + a.verdict, a.chips.length);
      if (a.verdict === "turned" && a.when === "unsure") sendOnce("when:" + id, "when:unsure", 0);
    }
    if (notesEvent) sendOnce("notes:" + id, notesEvent[0], notesEvent[1]);
    at++;
    if (at < queue.length) { go("verdicts", from); return; }
    if (round === 1) { narrow = narrowCandidates(); narrowPicked = new Set(); if (narrow.length) { go("narrow", from); return; } }
    toPicker(from);
  }
  /* The note picker. A card is hidden when its word was on a bottle row the visitor answered (here or on the
     profiler), so no note is asked twice; a screen with no card left is skipped. The word also counts when it is
     a whole word inside a longer word on a row of the card's main family: "musk" in "white musk", but not
     "apple" in "pineapple", "tea" in "teak", or "orange" on an orange blossom row. Case is ignored, and so is
     a label's part in brackets: "ambroxan (modern amberwood)" is asked as "ambroxan". */
  function answeredRows() {
    const out = [];
    for (const id of Object.keys(ratings)) {
      const r = ratings[id] || {};
      const done = new Set(Object.keys(r.noteAnswers || {}).concat(Array.isArray(r.unnoticed) ? r.unnoticed : []));
      if (done.size) for (const row of rowsFor(id)) if (done.has(row.f)) out.push(row);
    }
    return out;
  }
  const mainFam = n => { const fams = n.fams || M.famsForNote(n.en) || {}; return Object.keys(fams).sort((a, b) => fams[b] - fams[a])[0]; };
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function askedOnRow(n, rows) {
    const w = n.en.toLowerCase().replace(/\s*\(.*\)\s*$/, ""), f = mainFam(n), whole = new RegExp("\\b" + reEsc(w) + "\\b", "i");
    return rows.some(row => row.words.en.some(x => x.toLowerCase() === w || (row.f === f && whole.test(x))));
  }
  function pickScreens() {
    const rows = answeredRows();
    return QUIZ.notePicker.map((s, i) => ({ i, cards: s.notes.filter(n => !askedOnRow(n, rows)) })).filter(s => s.cards.length);
  }
  /* the next picker screen after `after` (none: the first), or the taste question */
  function toPicker(from, after) {
    from = from || snap();
    const next = pickScreens().find(s => s.i > (after == null ? -1 : after));
    if (!next) { go("taste", from); return; }
    pk = next.i; go("picker", from);
  }
  /* One narrowing round: for each possible deal-breaker seen in one perfume (most negative first), grid bottles
     that are unrated and not answered on this visit, holding that family at 0.6 or more in the drydown and every
     other family that was at 0.4 or more in the offending perfume's stage at under 0.2. At most four tiles.
     Two differences from settleSuggestion: this runs even when the offending perfume has no other family at 0.4
     or more (settleSuggestion skips those), and it skips bottles answered on this visit, including "another
     reason". */
  function narrowCandidates() {
    const prof = computeProfile();
    const fams = Object.entries(prof).filter(([, v]) => v.cls === "badPossible" && v.n === 1).sort((a, b) => a[1].score - b[1].score);
    const out = [], seen = new Set();
    for (const [f, v] of fams) {
      const ev = v.evidence.find(e => e.stage === "drydown") || v.evidence[0]; if (!ev) continue;
      const st = ev.perfume.stages[ev.stage] || {};
      const others = Object.keys(st).filter(o => o !== f && st[o] >= 0.4);
      const cands = QUIZ.grid.filter(id => !seen.has(id) && !hasStage(id) && !ans[id] && byId[id] && (byId[id].stages.drydown[f] || 0) >= 0.6 && others.every(o => (byId[id].stages.drydown[o] || 0) < 0.2))
        .sort((a, b) => byId[b].stages.drydown[f] - byId[a].stages.drydown[f]);
      for (const id of cands) { if (out.length >= 4) break; out.push({ id, f }); seen.add(id); }
      if (out.length >= 4) break;
    }
    return out;
  }
  /* Back: every screen shown pushes a snapshot of the one it left, so round two, narrowing and "Skip notes for
     the other bottles" go back correctly. Answers already given stay. */
  const snap = () => ({ step, queue: queue.slice(), at, round, narrow: narrow.slice(), pk, noNotes });
  function go(next, from) {
    hist.push(from || snap());
    step = next; editing = new Set();
    if (next === "result") {
      if (!doneSent) { doneSent = true; sendEvent("quiz_done", Object.keys(ratings).filter(hasStage).length); }
      sendResult(); loadQuizStats();
    }
    render();
    try { window.scrollTo(0, 0); } catch (e) { /* not available */ }
  }
  function back() {
    const s = hist.pop(); if (!s) return;
    ({ step, at, round, pk, noNotes } = s); queue = s.queue; narrow = s.narrow; editing = new Set();
    render();
    try { window.scrollTo(0, 0); } catch (e) { /* not available */ }
  }
  function sendOnce(key, name, n) { if (sent.has(key)) return; sent.add(key); sendEvent(name, n); }
  /* The result as one event, "result:<palate>:<deal-breakers joined by +>", with the rated bottles as n: the
     backend keeps each device's last one and counts palates and deal-breakers for the comparison line. A
     changed result after Back goes out again. */
  function sendResult() {
    const prof = computeProfile(), arch = archetypeOf(prof);
    const name = "result:" + (arch ? arch.id : "none") + ":" + byStrength(prof, ["badLikely", "badPossible"]).join("+");
    sendOnce(name, name, Object.keys(ratings).filter(hasStage).length);
  }
  /* the backend's counts of finished quizzes, asked for once, when the result is first reached */
  let quizStats = null, statsAsked = false;
  function loadQuizStats() {
    if (statsAsked || !CONFIG.endpoint) return;
    statsAsked = true;
    try {
      fetch(CONFIG.endpoint + (CONFIG.endpoint.includes("?") ? "&" : "?") + "stats=1").then(r => r.json()).then(j => {
        if (!j || !j.quiz) return;
        quizStats = j.quiz;
        const el = $("qcompare"); if (el && step === "result") el.innerHTML = compareHtml(computeProfile());
      }).catch(() => {});
    } catch (e) { /* offline or blocked */ }
  }

  /* ---------- search and lookup (grid screen) ---------- */
  /* any: also match picked and rated bottles (the Enter key's check before a lookup) */
  function search(q, any) {
    q = q.trim().toLowerCase(); if (!q) return [];
    const hit = P => (P.name.toLowerCase().includes(q) || (P.house || "").toLowerCase().includes(q) || (P.ar && P.ar.includes(q)) || P.id.includes(q));
    const open = id => any || (!ratedBefore(id) && !picked.has(id));
    const verified = PERFUMES.filter(P => open(P.id) && hit(P)).map(P => resolve(P.id));
    const auto = Object.keys(AUTO).filter(id => open(id) && !byId[id]).map(id => resolve(id)).filter(P => P && hit(P));
    return verified.concat(auto).slice(0, 12);
  }
  /* While the list is open the page gets room below it (the search box sits near the end of the grid screen), and on a
     phone the box scrolls to the top of the screen, so the keyboard does not cover the list. */
  function roomForResults(open) {
    const host = $("quiz"); if (host && host.classList) host.classList[open ? "add" : "remove"]("qsearching");
    const q = $("q");
    try { if (open && q && window.innerWidth < 700 && q.getBoundingClientRect().top > window.innerHeight * .25) q.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (err) { /* not available */ }
  }
  function showResults(list) {
    const box = $("results"); if (!box) return;
    roomForResults(list.length > 0);
    if (!list.length) { box.hidden = true; box.innerHTML = ""; return; }
    box.innerHTML = list.map(P => `<button type="button" data-add="${esc(P.id)}"><span class="with-thumb" style="align-items:center">${imgTag(P, "sm")}<span>${esc(pname(P))} <span class="house">${lang === "ar" ? esc(P.name) : (P.ar ? esc(P.ar) : "")}</span></span></span><span class="house">${esc(P.house)} · ${esc(t().cats[P.gender])}</span></button>`).join("");
    box.hidden = false;
  }
  function addPick(id) {
    if (!byId[id] && !AUTO[id]) return;
    const q = $("q"); if (q) q.value = ""; showResults([]);
    if (ratedBefore(id)) { toast(t().ratedToast); return; }
    if (!QUIZ.grid.includes(id) && !extra.includes(id)) extra.push(id);
    picked.add(id);
    renderGridParts();
  }
  /* A name that is in neither catalogue: the backend looks it up; the page keeps only derived weights (as app.js). */
  let lookingUp = false;
  function lookup(name) {
    name = String(name || "").trim().slice(0, 80); if (!name) return;
    if (!CONFIG.endpoint || name.length < 3) { toast(t().notFound); return; }
    if (lookingUp) return;
    lookingUp = true; toast(t().lookingUp); $("q").value = ""; showResults([]);
    const done = (found, entry) => {
      lookingUp = false;
      if (found && entry && entry.id) {
        /* reduce the vendor payload to identity plus derived weights; that is all we keep or send back */
        const d = entry.stages ? entry : derived(entry);
        AUTO[d.id] = d;
        if (!entry.stages) sendRecord({ type: "tagcache", ...d });
        addPick(d.id);
      } else toast(t().notFound);
    };
    try {
      fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ type: "lookup", q: name, lang, device }) })
        .then(r => r.json()).then(j => done(!!(j && j.found), j && j.entry)).catch(() => done(false));
    } catch (e) { done(false); }
  }

  /* ---------- rendering ---------- */
  const $ = id => document.getElementById(id);
  function toast(msg) { const el = $("toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 1600); }
  const foot = () => `<footer class="foot">${t().foot}</footer>`;
  const opt = (attr, v, label, on) => `<button type="button" class="qopt" data-${attr}="${v}" aria-pressed="${!!on}">${esc(label)}</button>`;
  const PART = { grid: 1, verdicts: 1, notes: 1, narrow: 1, picker: 2, taste: 3, told: 4, anosmia: 4 };
  /* Back (on every screen but the first) and "Part i of 4" with the part's name; the picker also counts its screens */
  function topHtml() {
    const p = PART[step];
    let line = p ? t().part(p, t().parts[p - 1]) : "";
    if (step === "picker") { const list = pickScreens().map(s => s.i); line += " · " + t().pickCount(list.indexOf(pk) + 1, list.length); }
    const backBtn = hist.length ? `<button type="button" class="qback" data-back="1">${esc(t().back)}</button>` : "";
    return `<div class="qtop">${backBtn}${line ? `<span class="qpart">${esc(line)}</span>` : ""}</div>`;
  }

  function renderChrome() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    $("lang-en").setAttribute("aria-pressed", lang === "en"); $("lang-ar").setAttribute("aria-pressed", lang === "ar");
    $("brand").innerHTML = esc(t().brand) + "<small>" + esc(t().tagline) + "</small>";
    $("brand").setAttribute("href", "index.html" + (endpointParam ? "?endpoint=" + encodeURIComponent(endpointParam) : ""));
    $("nav-profiler").textContent = t().navProfiler; $("nav-profiler").setAttribute("href", profilerHref());
    $("nav-articles").textContent = t().navArticles;
  }

  function tileHtml(id, on, line) {
    const P = resolve(id); if (!P) return "";
    const rated = ratedBefore(id);
    return `<button type="button" class="qtile" data-tile="${esc(id)}" aria-pressed="${!rated && !!on}"${rated ? " disabled" : ""}>${imgTag(P)}<span class="qtile-name">${esc(pname(P))}</span><span class="qtile-house">${esc(P.house)}</span>${rated ? `<span class="qtile-tag rated">${esc(t().rated)}</span>` : ""}${line ? `<span class="qtile-tag">${esc(line)}</span>` : ""}</button>`;
  }
  /* The start screen: five of the grid's bottles, the promise, Start, then the four parts and a link for a returning visitor. */
  function startHtml() {
    const shelf = QUIZ.grid.slice(0, 5).map(id => imgTag(resolve(id))).join("");
    return `<div class="qstart"><div class="qstart-shelf" aria-hidden="true">${shelf}</div>
      <div class="hero"><h1>${esc(t().startH)}</h1><p>${esc(t().startLede)}</p></div>
      <button type="button" class="btn primary qstart-go" data-start="1">${esc(t().startGo)}</button>
      <p class="qsteps-h">${esc(t().startParts)}</p><ol class="qsteps">${t().parts.map((name, i) => `<li><b>${i + 1}</b><span>${esc(name)}</span></li>`).join("")}</ol>
      <p class="qreturn"><a href="${esc(profilerHref())}">${esc(t().startBack)}</a></p></div>` + foot();
  }
  /* The grid screen keeps its search box across tile taps: only the tiles and the buttons are redrawn. */
  function gridHtml() {
    return topHtml() + `<div class="hero"><h1>${esc(t().gridQ)}</h1><p>${esc(t().gridHint)}</p></div>
      <div class="qgrid" id="tiles"></div>
      <div class="search qsearch"><label class="sr" for="q">${esc(t().qLabel)}</label><input type="search" id="q" autocomplete="off" spellcheck="false" placeholder="${esc(t().q)}"><div class="results" id="results" hidden></div></div>
      <div class="qactions" id="grid-actions"></div>` + foot();
  }
  function renderGridParts() {
    const tiles = $("tiles"), actions = $("grid-actions"); if (!tiles || !actions) return;
    tiles.innerHTML = QUIZ.grid.concat(extra).map(id => tileHtml(id, picked.has(id))).join("");
    actions.innerHTML = `<button type="button" class="btn" data-none="1">${esc(t().none)}</button><button type="button" class="btn primary" data-continue="1">${esc(t().cont(picked.size))}</button>`;
  }
  let boundQ = null;
  function bindSearch() {
    const q = $("q"); if (!q || q === boundQ) return; boundQ = q;
    q.addEventListener("input", e => showResults(search(e.target.value)));
    q.addEventListener("focus", e => showResults(search(e.target.value)));
    q.addEventListener("keydown", e => {
      /* a picked or rated name is in the catalogue: addPick keeps it picked or toasts "already rated"; only an unknown name is looked up */
      if (e.key === "Enter") { const v = e.target.value, open = search(v), list = open.length ? open : search(v, true); if (list.length) addPick(list[0].id); else lookup(v); }
      if (e.key === "Escape") showResults([]);
    });
  }

  function verdictHtml() {
    const id = queue[at], P = resolve(id), a = ans[id] || {};
    let follow = "";
    if (a.verdict === "turned" || a.verdict === "shop") {
      const when = a.verdict === "turned" ? `<p class="ask">${esc(t().whenQ)}</p><div class="qopts qopts-row">${STAGES.concat("unsure").map(s => opt("when", s, t().when[s], a.when === s)).join("")}</div>` : "";
      const chips = `<div class="chips"><span class="eyebrow">${esc(a.verdict === "turned" ? t().wrongQ : t().wrongShop)}</span>` + CHIPS.map(c => `<button type="button" data-chip="${c.id}" data-stage="${a.stage}" aria-pressed="${a.chips.includes(c.id)}">${esc(c[lang])}</button>`).join("") + "</div>";
      follow = `<div class="qfollow">${when}${chips}<div class="qactions"><button type="button" class="btn primary" data-continue="1">${esc(t().next)}</button></div></div>`;
    }
    return topHtml() + `<div class="qcard">${bottleHead(P)}
      <p class="ask">${esc(t().verdictQ)}</p>
      <div class="qopts">${["still", "turned", "other", "shop", "unsure"].map(v => opt("verdict", v, t().verdicts[v], a.verdict === v)).join("")}</div>${follow}</div>` + foot();
  }
  const bottleHead = P => `<p class="eyebrow">${esc(t().count(at + 1, queue.length))}</p>
      <div class="with-thumb">${imgTag(P)}<div class="grow"><h1 class="qname">${esc(pname(P))}</h1><div class="notes">${esc(P.house)}</div></div></div>`;
  /* One note row: the stage in plain words, the note words in the page language and the family in small type.
     A row with no listed word says so; the family takes the words' place when the perfume has no note list on
     this page (a looked-up bottle) or when its Arabic list does not match the English one. An answered row
     collapses to its answer. The profiler's "Rate its notes" block (app.js) draws the same rows. */
  function noteRowHtml(P, row, rec, open) {
    const f = row.f, v = rec.noteAnswers && f in rec.noteAnswers ? rec.noteAnswers[f] : null;
    const un = Array.isArray(rec.unnoticed) && rec.unnoticed.includes(f);
    const words = lang === "ar" ? row.words.ar : row.words.en;
    const listed = !!(P.notes && /[a-z]/i.test(P.notes.en || ""));
    let main = esc(fam(f)), small = "", hint = "";
    if (words.length) { main = esc(words.join(lang === "ar" ? "، " : ", ")); small = esc(fam(f)); }
    else if (!row.words.en.length && listed) { main = esc(t().notListed); small = esc(fam(f)); hint = `<div class="nhint">${esc(t().notListedHint)}</div>`; }
    const head = `<div class="nhead"><span class="nstage">${esc(t().rowStage[row.stage])}</span> · <b>${main}</b>${small ? ` · <span class="nfam">${small}</span>` : ""}</div>`;
    if ((v != null || un) && !open) return `<div class="nrow done">${head}<div class="ndone"><span class="npick">${esc(t().answers[un ? "u" : v])}</span><button type="button" class="qlink" data-nedit="${f}">${esc(t().change)}</button></div></div>`;
    const btn = (x, on, cls) => `<button type="button"${cls ? ` class="${cls}"` : ""} data-na="${f}" data-v="${x}" aria-pressed="${on}">${esc(t().answers[x])}</button>`;
    return `<div class="nrow">${head}${hint}<div class="nopts">${[-2, -1, 0, 1, 2].map(x => btn(x, v === x)).join("")}${btn("u", un, "nun")}</div></div>`;
  }
  function notesHtml() {
    const id = queue[at], P = resolve(id), a = ans[id] || { na: {}, un: [] }, rows = rowsFor(id);
    const skips = `<button type="button" class="qlink" data-nskip="1">${esc(t().skipNotes)}</button>` + (at > 0 || round === 2 ? `<button type="button" class="qlink" data-nskipall="1">${esc(t().skipAllNotes)}</button>` : "");
    return topHtml() + `<div class="qcard">${bottleHead(P)}
      <p class="ask">${esc(t().notesIntro(pname(P), rows.length))}</p><div class="qskips">${skips}</div>
      <div class="nrows">${rows.map(row => noteRowHtml(P, row, { noteAnswers: a.na, unnoticed: a.un }, editing.has(row.f))).join("")}</div>
      <div class="qactions"><button type="button" class="btn primary" data-continue="1">${esc(t().next)}</button></div></div>` + foot();
  }
  function narrowHtml() {
    return topHtml() + `<div class="hero"><h1>${esc(t().narrowQ)}</h1><p>${esc(t().narrowHint)}</p></div>
      <div class="qgrid">${narrow.map(c => tileHtml(c.id, narrowPicked.has(c.id), t().tests(fam(c.f)))).join("")}</div>
      <div class="qactions"><button type="button" class="btn" data-skip="1">${esc(t().noneNarrow)}</button><button type="button" class="btn primary" data-continue="1">${esc(t().cont(narrowPicked.size))}</button></div>` + foot();
  }
  /* five screens of single notes, each card "I enjoy it", "I avoid it" or "Not sure" (the default). A screen
     shows its first ten cards; "More notes" shows the rest in place, and a screen whose folded cards hold an
     answer opens by itself. */
  const FOLD = 10;
  function pickerHtml() {
    const s = pickScreens().find(x => x.i === pk); if (!s) return "";
    const notes = quiz.notes || {};
    const open = pkMore.has(pk) || s.cards.slice(FOLD).some(n => notes[n.id] === 1 || notes[n.id] === -1);
    const cards = open ? s.cards : s.cards.slice(0, FOLD);
    const card = n => {
      const v = notes[n.id] === 1 || notes[n.id] === -1 ? notes[n.id] : 0, hint = n["hint_" + lang];
      return `<div class="pcard"><div class="pcard-name"><b>${esc(lang === "ar" ? n.ar : n.en)}</b>${hint ? `<span class="pcard-hint">${esc(hint)}</span>` : ""}</div><div class="pcard-opts">${[1, -1, 0].map(x => `<button type="button" data-pn="${n.id}" data-pv="${x}" aria-pressed="${v === x}">${esc(t().pick[x])}</button>`).join("")}</div></div>`;
    };
    return topHtml() + `<div class="hero"><h1>${esc(t().pickerH[QUIZ.notePicker[pk].id])}</h1><p>${esc(t().pickerQ)}</p></div>
      <div class="pcards">${cards.map(card).join("")}</div>
      ${cards.length < s.cards.length ? `<div class="qmore"><button type="button" class="btn" data-pmore="1">${esc(t().pickMore(s.cards.length - cards.length))}</button></div>` : ""}
      <div class="qactions"><button type="button" class="btn primary" data-continue="1">${esc(t().next)}</button></div>` + foot();
  }
  function tasteHtml() {
    return topHtml() + `<div class="hero"><h1>${esc(t().tasteQ)}</h1></div><div class="qopts">${["bitter", "sweet", "both", "unsure"].map(v => opt("taste", v, t().taste[v], quiz.taste === v)).join("")}</div>` + foot();
  }
  /* complaints, several at once; "Nothing has bothered me" and "I don't know" each clear the others */
  const TOLD = ["sweet", "chemical", "soapy", "heavy", "powdery", "smoky"];
  function toldHtml() {
    const cur = normTold(quiz);
    return topHtml() + `<div class="hero"><h1>${esc(t().toldQ)}</h1></div><div class="qopts">${TOLD.map(v => opt("told", v, cap(chipWord(v)), cur.told.includes(v))).join("")}</div>
      <div class="qopts qopts-apart">${opt("told", "none", t().toldNone, cur.toldNone)}${opt("told", "unsure", t().toldUnsure, toldUnsure)}</div>
      <div class="qactions"><button type="button" class="btn primary" data-continue="1">${esc(t().next)}</button></div>` + foot();
  }
  function anosmiaHtml() {
    return topHtml() + `<div class="hero"><h1>${esc(t().anosQ)}</h1></div><div class="qopts">${["yes", "no", "unsure"].map(v => opt("anosmia", v, t().anos[v], quiz.anosmia === v)).join("")}</div>` + foot();
  }

  /* The profiler's three shop links for a perfume, each sending an event when opened. */
  function linksHtml(P, event) {
    const q = encodeURIComponent(P.house + " " + P.name);
    const link = (tpl, label, primary) => `<a class="${primary ? "primary" : ""}" href="${tpl.replace("{q}", q)}" target="_blank" rel="noopener sponsored" data-event="${esc(event)}">${esc(label)}</a>`;
    return `<div class="links">${link(CONFIG.links.sampleSA, t().sampleSA, lang === "ar")}${link(CONFIG.links.sampleUS, t().sampleUS, lang !== "ar")}${link(CONFIG.links.bottle, t().bottle, false)}</div>`;
  }
  /* Testers for a visitor with no rated bottle: the told complaints put first the tester whose family weighs
     most in their family maps, summed; otherwise the order in data.js (woody amber, white musk, vanilla). */
  function orderedTesters() {
    const list = QUIZ.testers.slice();
    const chips = normTold(quiz).told.map(id => CHIPS.find(c => c.id === id)).filter(Boolean); if (!chips.length) return list;
    let best = null, bw = 0;
    for (const x of list) { const w = chips.reduce((s, c) => s + (c.fams[x.family] || 0), 0); if (w > bw) { bw = w; best = x; } }
    return best ? [best].concat(list.filter(x => x !== best)) : list;
  }
  /* other catalogue perfumes that would be excluded if the tester's family became a likely deal-breaker */
  const carryCount = x => PERFUMES.filter(P => P.id !== x.id && ((P.stages.drydown[x.family] || 0) >= 0.5 || (P.stages.heart[x.family] || 0) >= 0.7)).length;
  function testerHtml(x) {
    const P = resolve(x.id); if (!P) return "";
    return `<div class="rec tester">
      <div class="with-thumb">${imgTag(P)}<div class="grow">
      <div class="r-head"><b>${esc(pname(P))}</b><span class="pill">${esc(P.house)} · ${esc(t().cats[P.gender])}</span></div>
      <div class="tests">${esc(t().tests(fam(x.family)))}</div></div></div>
      <p class="carry">${esc(t().carry(carryCount(x)))}</p>
      ${linksHtml(P, "tester:" + x.id)}
      <a class="rate-later" href="${esc(profilerHref(x.id))}">${esc(t().rateLater)}</a>
    </div>`;
  }
  /* lead: the sentence naming the musk or wood rows the visitor did not notice */
  function anosmiaNote(lead) {
    const x = QUIZ.testers.find(k => k.family === "white_musk"); const P = x && resolve(x.id); if (!P) return "";
    const q = encodeURIComponent(P.house + " " + P.name);
    const tpl = lang === "ar" ? CONFIG.links.sampleSA : CONFIG.links.sampleUS;
    return `<div class="qnote">${lead ? esc(lead) + " " : ""}${esc(t().anosmiaNote(lang === "ar" && P.ar ? P.ar : P.house + " " + P.name))} <a href="${tpl.replace("{q}", q)}" target="_blank" rel="noopener sponsored" data-note="1" data-event="tester:${esc(P.id)}">${esc(lang === "ar" ? t().sampleSA : t().sampleUS)}</a></div>`;
  }
  /* What the visitor told us, in their own words, each line with its source word. */
  function toldBoxHtml() {
    const notes = quiz.notes || {}, all = QUIZ.notePicker.flatMap(s => s.notes);
    const word = n => (lang === "ar" ? n.ar : n.en), sep = lang === "ar" ? "، " : ", ";
    const enjoy = all.filter(n => notes[n.id] === 1).map(word), avoid = all.filter(n => notes[n.id] === -1).map(word);
    const told = normTold(quiz).told.filter(id => CHIPS.some(c => c.id === id));
    const lines = [];
    if (enjoy.length) lines.push(t().youEnjoy(enjoy.join(sep)));
    if (avoid.length) lines.push(t().youAvoid(avoid.join(sep)));
    if (quiz.taste === "bitter" || quiz.taste === "sweet") lines.push(t().prefer[quiz.taste]);
    if (told.length) lines.push(t().bothered(told.map(chipWord).join(sep)));
    return lines.length ? `<div class="qtold">${lines.map(l => `<div>${esc(l)} <span class="src">(${esc(t().fromTold)})</span></div>`).join("")}</div>` : "";
  }
  /* A white musk, woody amber, creamy sandalwood or dry cedar row the visitor did not notice brings the anosmia
     note, naming the bottle and family, whatever the anosmia answer was. */
  const QUIET = ["white_musk", "woody_amber", "sandalwood_creamy", "cedar_dry"];
  function anosHtml() {
    const pairs = [];
    for (const id of Object.keys(ratings)) {
      const r = ratings[id], P = r && Array.isArray(r.unnoticed) ? resolve(id) : null; if (!P) continue;
      for (const f of r.unnoticed) if (QUIET.includes(f)) pairs.push(t().unnoticedPair(low(fam(f)), pname(P)));
    }
    if (pairs.length) return anosmiaNote(t().unnoticed(listJoin(pairs)));
    return quiz.anosmia === "yes" || quiz.anosmia === "unsure" ? anosmiaNote() : "";
  }
  /* the words a note answer names: its row's note words, or the family when the row has none */
  function noteWords(P, f) {
    const row = rowsFor(P.id).find(r => r.f === f) || N.questions(P, "worn").find(r => r.f === f);
    const w = row ? (lang === "ar" ? row.words.ar : row.words.en) : [];
    return w.length ? listJoin(w) : low(fam(f));
  }
  /* The told answers that point against a classed family: picker cards and complaint chips that give it 0.5 or
     more, named by their card or chip word. A taste answer never counts here. */
  function disagreeWords(f, cls) {
    const sign = /^bad/.test(cls) ? 1 : /^good/.test(cls) ? -1 : 0;
    if (!sign) return [];
    const cards = QUIZ.notePicker.flatMap(s => s.notes);
    const word = src => { const [k, id] = src.split(":"); if (k === "chip") return chipWord(id); const n = cards.find(x => x.id === id); return n ? n[lang] : id; };
    return [...new Set(N.toldItems(quiz).filter(i => i.f === f && i.w >= 0.5 && Math.sign(i.value) === sign && /^(note|chip):/.test(i.src)).map(i => word(i.src)))];
  }
  /* ---------- the result's first screen: a taste card and three bottle tiles ---------- */
  /* a family's name without its bracketed gloss: "Woody ambers (Ambroxan-type)" -> "Woody ambers" */
  const famShort = k => fam(k).replace(/\s*[(（][^)）]*[)）]\s*/g, " ").trim();
  const byStrength = (prof, classes) => Object.entries(prof).filter(([, v]) => classes.includes(v.cls))
    .sort((a, b) => classes.indexOf(a[1].cls) - classes.indexOf(b[1].cls) || Math.abs(b[1].score) - Math.abs(a[1].score)).map(([f]) => f);
  /* every answer the visitor gave: a verdict and its note rows per bottle, the picker cards, taste, complaints, anosmia */
  function answerCount(ids) {
    let n = 0;
    for (const id of ids) { const r = ratings[id] || {}; n += 1 + Object.keys(r.noteAnswers || {}).length + (Array.isArray(r.unnoticed) ? r.unnoticed.length : 0); }
    n += Object.values(quiz.notes || {}).filter(v => v).length;
    if (quiz.taste) n += 1;
    const told = normTold(quiz); n += told.told.length || (told.toldNone ? 1 : 0);
    if (quiz.anosmia) n += 1;
    return n;
  }
  /* one row of the taste card: a label, the families as chips, and the bottles they were seen in */
  function tasteRow(prof, fams, kind) {
    if (!fams.length) return "";
    const likely = fams.some(f => prof[f].cls === (kind === "good" ? "goodLikely" : "badLikely"));
    const label = (kind === "good" ? t().drawn : t().breaker)[likely ? "likely" : "possible"];
    const seen = new Set();
    for (const f of fams) for (const e of prof[f].evidence || []) if (e.perfume && (kind === "good" ? e.value > 0 : e.value < 0)) seen.add(pname(e.perfume));
    const from = seen.size ? `<div class="qtaste-from">${esc(t().fromBottles)} ${esc(listJoin([...seen].slice(0, 3)))}</div>` : "";
    return `<div class="qtaste-row ${kind}"><div class="qtaste-k">${esc(label)}</div><div class="qchips">${fams.map(f => `<span class="qchip ${kind}">${esc(famShort(f))}</span>`).join("")}</div>${from}</div>`;
  }
  function tasteCardHtml(prof, ids) {
    const good = drawnTo(prof), bad = byStrength(prof, ["badLikely", "badPossible"]).slice(0, 2);
    const rows = tasteRow(prof, good, "good") + tasteRow(prof, bad, "bad");
    return `<div class="qreveal"><div class="qtaste">${rows || `<p class="qtaste-none">${esc(t().noFamilies)}</p>`}</div>
      <p class="qbasis">${esc(t().basis(ids.length, answerCount(ids)))}</p></div>`;
  }
  /* a pick as a tile: the bottle, its name, what it has that you like and what it is free of */
  function pickTileHtml(pick, prof) {
    const P = pick.P, PP = resolve(P.id) || P;
    const strong = st => Object.entries(P.stages[st] || {}).filter(([, w]) => w >= 0.5);
    const likes = new Set(byStrength(prof, ["goodLikely", "goodPossible"]));
    const has = strong("drydown").concat(strong("heart")).filter(([f]) => likes.has(f)).sort((a, b) => b[1] - a[1]).map(([f]) => f)[0];
    const carries = f => ["opening", "heart", "drydown"].some(st => (P.stages[st][f] || 0) >= 0.3);
    const free = byStrength(prof, ["badLikely", "badPossible"]).find(f => !carries(f));
    const chips = (has ? `<span class="qchip good sm"><span class="sr">${esc(t().has)} </span>${esc(famShort(has))}</span>` : "")
      + (free ? `<span class="qchip free sm">${esc(t().without(famShort(free)))}</span>` : "");
    const q = encodeURIComponent(P.house + " " + P.name);
    const sample = (lang === "ar" ? CONFIG.links.sampleSA : CONFIG.links.sampleUS).replace("{q}", q);
    return `<div class="rec">${imgTag(PP)}<b>${esc(pname(P))}</b><span class="qtile-house">${esc(P.house)}</span>
      ${chips ? `<div class="qchips">${chips}</div>` : ""}
      <a class="btn primary qsample" href="${sample}" target="_blank" rel="noopener sponsored" data-event="${esc("sample:" + P.id)}">${esc(t().getSample)}</a>
      <a class="qbottle" href="${CONFIG.links.bottle.replace("{q}", q)}" target="_blank" rel="noopener sponsored" data-event="${esc("sample:" + P.id)}">${esc(t().bottle)}</a></div>`;
  }

  /* ---------- the taste name: nine palates cover the 32 families; the strongest liked group names the visitor ---------- */
  const ICON = {
    amber: '<path d="M12 3c3.6 4.6 6 7.9 6 11.2a6 6 0 0 1-12 0C6 10.9 8.4 7.6 12 3z"/><path d="M9.2 14.6a3 3 0 0 0 2.4 2.9" opacity=".7"/>',
    sweet: [0, 72, 144, 216, 288].map(a => `<ellipse cx="12" cy="7.2" rx="2.6" ry="4.4" transform="rotate(${a} 12 12)"/>`).join("") + '<circle cx="12" cy="12" r="1.6"/>',
    oud: '<path d="M8 21c-2.4-3 2.4-5 0-8.5s2.4-5 0-8.5M12 21c-2.4-3 2.4-5 0-8.5s2.4-5 0-8.5M16 21c-2.4-3 2.4-5 0-8.5s2.4-5 0-8.5"/>',
    musk: '<circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="12" r="5.6" opacity=".75"/><circle cx="12" cy="12" r="8.8" opacity=".45"/>',
    woody: '<ellipse cx="12.4" cy="12.2" rx="2" ry="1.7"/><ellipse cx="12" cy="12" rx="5" ry="4.4"/><ellipse cx="11.6" cy="12.3" rx="8.4" ry="7.6"/><path d="M12 12l6.6-4.8"/>',
    rose: '<path d="M12 12.2c.1-1.4 2-1.5 2.1-.1.1 1.8-2.4 2.9-3.9 1.6-1.9-1.6-.8-5 2.2-5.1 3.3-.1 5 3.2 3.6 6-1.6 3.1-6.4 3.6-8.6.5"/><path d="M12 18.6v3M12 20.4c-2.4-.2-3.6-1.6-3.8-3 2 0 3.4.9 3.8 3zM12 20.4c2.4-.2 3.6-1.6 3.8-3-2 0-3.4.9-3.8 3z"/>',
    floral: [0, 72, 144, 216, 288].map(a => `<circle cx="12" cy="6.6" r="3.1" transform="rotate(${a} 12 12)"/>`).join("") + '<circle cx="12" cy="12" r="1.9"/>',
    fresh: '<circle cx="12" cy="12" r="8.8"/><circle cx="12" cy="12" r="6.8" opacity=".7"/>' + [0, 60, 120].map(a => `<path d="M12 5.2v13.6" transform="rotate(${a} 12 12)"/>`).join(""),
    spiced: [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<ellipse cx="12" cy="6.4" rx="1.5" ry="3.4" transform="rotate(${a} 12 12)"/>`).join("") + '<circle cx="12" cy="12" r="1.2"/>',
    selective: '<path d="M12 3.5l7.5 7-7.5 10.5-7.5-10.5z"/><path d="M4.5 10.5h15M9 10.5l3 10.5 3-10.5M9 10.5l3-7 3 7" opacity=".75"/>',
    wide: [-56, -28, 0, 28, 56].map(a => `<path d="M12 19.5V5.5" transform="rotate(${a} 12 19.5)"/>`).join("") + '<path d="M4.6 12.4a9 9 0 0 1 14.8 0" opacity=".75"/><circle cx="12" cy="19.5" r="1.3"/>'
  };
  /* word and adj name the group inside a two-group palate: "The Fresh and Oud Palate", "ذائقة منعشة وعودية" */
  const ARCH = [
    { id: "amber", fams: ["amber_resin", "tonka_coumarin", "tobacco_honey"], color: "#B96A16", en: "The Amber Palate", ar: "ذائقة عنبرية", word: "Amber", adj: "عنبرية" },
    { id: "sweet", fams: ["vanilla_gourmand", "coffee_gourmand", "fruity_sweet"], color: "#A87B3F", en: "The Sweet Palate", ar: "ذائقة حلوة", word: "Sweet", adj: "حلوة" },
    { id: "oud", fams: ["oud_smoky", "oud_animalic", "incense_resin", "leather_smoky", "animalic"], color: "#5B3A24", en: "The Oud Palate", ar: "ذائقة عودية", word: "Oud", adj: "عودية" },
    { id: "musk", fams: ["white_musk", "skin_musk", "aldehydes"], color: "#7F7899", en: "The Musk Palate", ar: "ذائقة مسكية", word: "Musk", adj: "مسكية" },
    { id: "woody", fams: ["woody_amber", "sandalwood_creamy", "cedar_dry", "vetiver", "patchouli", "oakmoss_chypre"], color: "#735236", en: "The Woody Palate", ar: "ذائقة خشبية", word: "Woody", adj: "خشبية" },
    { id: "rose", fams: ["rose", "damascone_fruit"], color: "#B8467A", en: "The Rose Palate", ar: "ذائقة وردية", word: "Rose", adj: "وردية" },
    { id: "floral", fams: ["white_floral", "iris_powdery", "muguet_floral"], color: "#98688F", en: "The Floral Palate", ar: "ذائقة زهرية", word: "Floral", adj: "زهرية" },
    { id: "fresh", fams: ["citrus_fresh", "aquatic_marine", "green_herbal", "lavender_aromatic", "spice_fresh"], color: "#3F7F6C", en: "The Fresh Palate", ar: "ذائقة منعشة", word: "Fresh", adj: "منعشة" },
    { id: "spiced", fams: ["spicy_warm", "saffron_leathery"], color: "#A5412A", en: "The Spiced Palate", ar: "ذائقة متبّلة", word: "Spiced", adj: "متبّلة" }
  ];
  const SELECTIVE = { id: "selective", fams: [], color: "#6B4E3D", en: "The Selective Palate", ar: "ذائقة انتقائية" };
  const WIDE = { id: "wide", fams: [], color: "#4E6B62", en: "The Wide Palate", ar: "ذائقة واسعة" };
  /* The name follows the shape of what the visitor kept. Each kept bottle votes for one group, the group of the
     liked family with the greatest presence in the stage that was rated (Yara: vanilla at 0.9, so sweet; a
     musk or a wood in the same bottle counts for nothing), with the presence as its weight, so the groups
     with most families gain nothing and a bottle is never split. The group with most weight leads. It names
     the palate alone when it holds more than twice the next group's weight; otherwise the next group joins
     it ("The Fresh and Oud Palate": a summer side and a winter side, not a contradiction), and, from four
     bottles or more, a third group the lead does not outweigh makes the wide palate, whose real finding is the
     deal-breaker; three bottles of three kinds are a sample, not a wardrobe, and take the two strongest. With dislikes
     only, the selective palate; with neither, none. Told answers never set a class, so only bottles vote. */
  function palateGroups(prof) {
    const liked = byStrength(prof, ["goodLikely", "goodPossible"]);
    const vote = {};   /* perfume id -> [presence, group], the strongest liked family wins; ties keep the stronger family */
    for (const f of liked) for (const e of prof[f].evidence || []) {
      if (!e.perfume || !(e.value > 0)) continue;
      const x = ((e.perfume.stages || {})[e.stage] || {})[f] || 0, cur = vote[e.perfume.id];
      if (x > 0 && (!cur || x > cur[0])) vote[e.perfume.id] = [x, ARCH.find(g => g.fams.includes(f))];
    }
    const G = [];
    for (const [x, a] of Object.values(vote)) { if (!a) continue; const g = G.find(o => o.a === a); if (g) g.sum += x; else G.push({ a, sum: x, first: liked.findIndex(f => a.fams.includes(f)) }); }
    G.sort((p, q) => q.sum - p.sum || p.first - q.first);
    return { liked, G, bottles: Object.keys(vote).length };
  }
  function archetypeOf(prof) {
    const { liked, G, bottles } = palateGroups(prof);
    if (!liked.length) return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? SELECTIVE : null;
    if (!G.length) return null;
    const lead = G[0];
    if (G.length === 1 || lead.sum > 2 * G[1].sum) return lead.a;
    if (G.length >= 3 && bottles >= 4 && lead.sum <= 2 * G[2].sum) return WIDE;
    const a = lead.a, b = G[1].a;
    return { id: a.id + "-" + b.id, icon: a.id, color: a.color, color2: b.color, en: `The ${a.word} and ${b.word} Palate`, ar: `ذائقة ${a.adj} و${b.adj}` };
  }
  /* the three families the taste card and the share card show as liked: the strongest family of each voting
     group first, in the groups' order, then the rest by strength, so a two-sided or wide palate shows its sides
     rather than three shades of its strongest group */
  function drawnTo(prof) {
    const { liked, G } = palateGroups(prof), out = [];
    for (const g of G) { const f = liked.find(x => g.a.fams.includes(x)); if (f && !out.includes(f)) out.push(f); }
    for (const f of liked) if (!out.includes(f)) out.push(f);
    return out.slice(0, 3);
  }
  /* The line under the palate name says what the bottles show; a group palate's practical tip goes lower, after
     the taste card (a two-group palate takes the lead group's tip). The wide and selective palates keep theirs
     under the name, since there it is what the name means. */
  function palateText(arch, prof) {
    const P = t().pal;
    if (arch.id === "wide") return { about: P.wide.text + " " + (byStrength(prof, ["badLikely", "badPossible"]).length ? P.wide.tip : P.wide.tipNone), tip: "" };
    if (arch.id === "selective") return { about: P.selective.text + " " + P.selective.tip, tip: "" };
    const [a, b] = arch.id.split("-");
    return { about: b ? t().palTwo(P[a].side, P[b].side) : t().palOne(P[a].side), tip: P[a].tip };
  }
  /* The comparison line: how many people who finished the quiz share the visitor's strongest deal-breaker, or,
     without one, their palate (a two-group palate counted in either order). Only from COMPARE_MIN finishers,
     so a handful of early visitors never produce a percentage. */
  const COMPARE_MIN = 100;
  function compareHtml(prof) {
    const q = quizStats; if (!q || !(q.n >= COMPARE_MIN)) return "";
    const pct = c => { const v = Math.round(100 * c / q.n); return v < 1 ? t().under1 : v + (lang === "ar" ? "٪" : "%"); };
    const bad = byStrength(prof, ["badLikely", "badPossible"])[0];
    if (bad) return q.breakers && q.breakers[bad] ? esc(t().compare.breaker(pct(q.breakers[bad]), q.n, low(famShort(bad)))) : "";
    const arch = archetypeOf(prof); if (!arch || !q.palates) return "";
    const [a, b] = arch.id.split("-"), c = (q.palates[arch.id] || 0) + (b ? q.palates[b + "-" + a] || 0 : 0);
    return c ? esc(t().compare.palate(pct(c), q.n)) : "";
  }
  /* a two-group palate shades from the first group's colour into the second's and carries the first group's mark */
  const emblemSvg = (a, size) => `<svg class="qemblem" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="qe-${a.id}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="${a.color}" stop-opacity="1"/><stop offset="1" stop-color="${a.color2 || a.color}"/></radialGradient><linearGradient id="qr-${a.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8862A"/><stop offset=".35" stop-color="#F2D68A"/><stop offset=".55" stop-color="#C99C43"/><stop offset=".75" stop-color="#FBECB8"/><stop offset="1" stop-color="#A8781F"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#qr-${a.id})"/><circle cx="32" cy="32" r="26.5" fill="url(#qe-${a.id})"/><g transform="translate(14 14) scale(1.5)" fill="none" stroke="#FCF8F0" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICON[a.icon || a.id]}</g></svg>`;
  /* the funnel: every catalogue perfume checked, the ones a deal-breaker rules out, the three chosen */
  function funnelHtml(prof, nPicks) {
    const total = E.PERFUMES.length, out = E.ruledOut(prof).length;
    let i = 0; const cell = (n, label, cls) => `<div class="qfun ${cls || ""}"><b id="qc-${i++}" data-count="${n}">${n}</b><span>${esc(label)}</span></div>`;
    return `<div class="qfunnel">${cell(total, t().funnel.checked)}${cell(out, t().funnel.out, "out")}${nPicks ? cell(nPicks, t().funnel.picked, "pick") : ""}</div>`;
  }
  /* numbers count up once the result is on screen; a visitor who prefers less motion sees them at once */
  function countUp() {
    let still = false; try { still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { still = true; }
    if (still || typeof requestAnimationFrame !== "function") return;
    for (let i = 0, el; (el = $("qc-" + i)); i++) {
      const end = +el.dataset.count, t0 = performance.now(), dur = 900 + Math.min(end, 300);
      const tick = now => { const k = Math.min(1, (now - t0) / dur), e2 = 1 - Math.pow(1 - k, 3); el.textContent = String(Math.round(end * e2)); if (k < 1) requestAnimationFrame(tick); };
      el.textContent = "0"; requestAnimationFrame(tick);
    }
  }

  /* ---------- the reveal: the visitor's bottles sort into kept and turned, then the result arrives ---------- */
  let revealed = false, revealTimer = null;
  const stillMotion = () => { try { return !window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return true; } };
  /* a rated bottle is kept when every stage it has is 0 or above and one is above 0, turned when any stage is below 0 */
  function sortedBottles() {
    const kept = [], turned = [];
    for (const id of Object.keys(ratings).filter(hasStage)) {
      const r = ratings[id], vals = STAGES.map(st => r[st]).filter(v => v != null);
      if (vals.some(v => v < 0)) turned.push(id); else if (vals.some(v => v > 0)) kept.push(id);
    }
    return { kept: kept.slice(0, 6), turned: turned.slice(0, 6) };
  }
  function revealHtml(b) {
    let k = 0;
    const col = (ids, label, cls) => `<div class="qsort ${cls}"><div class="qsort-k">${esc(label)}</div><div class="qsort-bottles">${ids.map(id => {
      const P = resolve(id); return P ? `<span class="qsort-b" style="--i:${k++}">${imgTag(P)}</span>` : ""; }).join("")}</div></div>`;
    return `<div class="qreveal-intro" data-skipintro="1" role="status"><p class="qreveal-read">${esc(t().reading)}</p>
      <div class="qsorts">${col(b.kept, t().kept, "kept")}${col(b.turned, t().turned, "turned")}</div>
      <button type="button" class="qlink" data-skipintro="1">${esc(t().skip)}</button></div>`;
  }
  function showResult() { clearTimeout(revealTimer); revealTimer = null; revealed = true; render(); }

  /* ---------- the share card: a 1080 x 1350 image of the taste card and the three picks ---------- */
  function loadImg(src) {
    return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  }
  async function drawCard() {
    const W = 1080, H = 1350, M = 72, rtl = lang === "ar";
    const disp = rtl ? '"Noto Naskh Arabic", serif' : '"Fraunces", Georgia, serif', body = '"IBM Plex Sans Arabic", sans-serif';
    try { await Promise.all([`600 72px ${disp}`, `600 34px ${body}`, `500 30px ${body}`].map(f => document.fonts.load(f))); } catch (e) { /* draw with what is there */ }
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"); if (!x) return null;
    const gold = x.createLinearGradient(0, 0, W, 0);
    [["0", "#B8862A"], [".3", "#F2D68A"], [".5", "#D4A94A"], [".65", "#FBECB8"], ["1", "#A8781F"]].forEach(([o, col]) => gold.addColorStop(+o, col));
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#F6E8D0"); bg.addColorStop(1, "#EFDBBD");
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const glow = x.createRadialGradient(W * .15, 220, 0, W * .15, 220, 520); glow.addColorStop(0, "rgba(240,177,53,.28)"); glow.addColorStop(1, "rgba(240,177,53,0)");
    x.fillStyle = glow; x.fillRect(0, 0, W, H);
    const band = (y, h) => { const g = x.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "#3A2718"); g.addColorStop(1, "#1E130C"); x.fillStyle = g; x.fillRect(0, y, W, h); };
    band(0, 128); x.fillStyle = gold; x.fillRect(0, 128, W, 6);
    band(H - 96, 96); x.fillStyle = gold; x.fillRect(0, H - 96, W, 6);
    x.direction = rtl ? "rtl" : "ltr"; x.textBaseline = "alphabetic";
    const at = (px) => rtl ? W - px : px;
    const text = (str, px, y, font, fill, align) => { x.font = font; x.fillStyle = fill; x.textAlign = align || (rtl ? "right" : "left"); x.fillText(str, at(px), y); };
    /* the header band: the site's name in gold */
    text(t().brand, M, 84, `600 50px ${disp}`, gold);
    /* the name: the emblem, "My palate", then the palate's name; without one, the plain title */
    const prof = computeProfile(), arch = archetypeOf(prof);
    if (arch) {
      const em = await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(emblemSvg(arch, 150).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')));
      if (em) x.drawImage(em, rtl ? W - M - 150 : M, 168, 150, 150);
      const tx = M + 150 + 34;
      text(t().cardPalate, tx, 222, `600 32px ${body}`, "#8C5F00");
      /* a two-group name is long: the size drops until it fits beside the emblem */
      let px = rtl ? 70 : 64;
      for (; px > 40; px -= 2) { x.font = `600 ${px}px ${disp}`; if (x.measureText(arch[lang]).width <= W - M - tx) break; }
      text(arch[lang], tx, 290, `600 ${px}px ${disp}`, "#2A1B11");
    } else {
      text(t().card.title, M, 262, `600 76px ${disp}`, "#2A1B11");
    }
    const ruled = E.ruledOut(prof).length;
    text(`${E.PERFUMES.length} ${t().funnel.checked} · ${ruled} ${t().funnel.out}`, M, 372, `600 30px ${body}`, "#614E3F");
    x.fillStyle = gold; x.fillRect(rtl ? W - M - 120 : M, 398, 120, 6);
    const good = drawnTo(prof), bad = byStrength(prof, ["badLikely", "badPossible"]).slice(0, 2);
    let y = 478;
    const chipRow = (fams, fill, ink) => {
      x.font = `600 36px ${body}`; let cx = M;
      for (const f of fams) {
        const label = famShort(f), w = x.measureText(label).width + 64;
        if (cx + w > W - M && cx > M) { cx = M; y += 84; }
        const left = rtl ? W - cx - w : cx;
        x.fillStyle = fill; x.beginPath(); x.roundRect ? x.roundRect(left, y, w, 66, 33) : x.rect(left, y, w, 66); x.fill();
        x.fillStyle = ink; x.textAlign = "center"; x.fillText(label, left + w / 2, y + 45);
        cx += w + 14;
      }
      y += 66;
    };
    const section = (fams, kind) => {
      if (!fams.length) return;
      const likely = fams.some(f => prof[f].cls === (kind === "good" ? "goodLikely" : "badLikely"));
      text((kind === "good" ? t().card.drawn : t().card.breaker)[likely ? "likely" : "possible"], M, y, `600 30px ${body}`, kind === "good" ? "#8C5F00" : "#A72A68");
      y += 22; chipRow(fams, kind === "good" ? "#D8ECCE" : "#FFDCE9", kind === "good" ? "#446630" : "#A72A68"); y += 70;
    };
    section(good, "good"); section(bad, "bad");
    /* the three picks */
    const { picks } = recommend(prof);
    if (picks.length) {
      y = Math.max(y, 800);
      text(t().card.picks, M, y, `600 30px ${body}`, "#8C5F00"); y += 26;
      const cw = (W - 2 * M - 2 * 24) / 3;
      const imgs = await Promise.all(picks.map(pk => loadImg(bottleSrc(pk.P) || PLACEHOLDER)));
      picks.forEach((pk, i) => {
        const left = rtl ? W - M - (i + 1) * cw - i * 24 : M + i * (cw + 24);
        x.fillStyle = "rgba(252,248,240,.78)"; x.beginPath(); x.roundRect ? x.roundRect(left, y, cw, 324, 26) : x.rect(left, y, cw, 324); x.fill();
        x.strokeStyle = "rgba(140,95,0,.35)"; x.lineWidth = 2; x.stroke();
        const im = imgs[i]; if (im) { const s2 = 186, r = Math.min(s2 / im.width, s2 / im.height); x.drawImage(im, left + (cw - im.width * r) / 2, y + 20 + (s2 - im.height * r), im.width * r, im.height * r); }
        x.font = `600 30px ${body}`; x.fillStyle = "#2A1B11"; x.textAlign = "center";
        const words = pname(pk.P).split(" "), lines = []; let line = "";
        for (const w2 of words) { const tryL = line ? line + " " + w2 : w2; if (x.measureText(tryL).width > cw - 28 && line) { lines.push(line); line = w2; } else line = tryL; }
        lines.push(line);
        const shown2 = lines.slice(0, 2); shown2.forEach((l, k) => x.fillText(l, left + cw / 2, y + 244 + k * 34));
        x.font = `500 24px ${body}`; x.fillStyle = "#816D5D"; x.fillText(pk.P.house, left + cw / 2, y + 244 + shown2.length * 34 + 2);
      });
      y += 324;
    }

    /* the footer band: the tagline */
    x.font = `500 32px ${body}`; x.fillStyle = "#F2D68A"; x.textAlign = "center"; x.fillText(t().card.tagline, W / 2, H - 36);
    return new Promise(res => c.toBlob(b => res(b), "image/png"));
  }
  async function shareCard() {
    let blob = null;
    try { blob = await drawCard(); } catch (e) { blob = null; }
    if (!blob) { toast(t().shareFail); return; }
    const file = new File([blob], lang === "ar" ? "ذائقتي-العطرية.png" : "my-scent-profile.png", { type: "image/png" });
    sendEvent("share_card", 0);
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: t().card.title }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast(t().shareMade);
  }

  function resultHtml() {
    shown = { testers: [], picks: [] };
    const ids = Object.keys(ratings).filter(hasStage);
    const told = toldBoxHtml(), anos = anosHtml();
    const prof = computeProfile();
    /* recommendations from two rated bottles, or from any number once the visitor enjoys something in words */
    const gate = ids.length >= 2 || N.toldItems(quiz).some(i => i.value > 0);
    const picksHtml = () => {
      const { picks } = recommend(prof);
      shown.picks = picks.map(p => p.P.id);
      return picks.length ? `<div class="recs recs-tiles">${picks.map(pk => pickTileHtml(pk, prof)).join("")}</div>` : "";
    };
    if (!ids.length) {
      const testers = orderedTesters();
      shown.testers = testers.map(x => x.id);
      const cards = `<div class="recs">${testers.map(testerHtml).join("")}</div>`;
      if (gate) return topHtml() + `<div class="qresult"><div class="hero"><h1>${esc(t().toldOnlyH)}</h1><p>${esc(t().toldOnlyLede)}</p></div>
        ${told}${picksHtml()}<h2 class="qh2">${esc(t().confirmH)}</h2><p class="notes">${esc(t().confirmLede)}</p>${cards}${anos}</div>` + foot();
      return topHtml() + `<div class="qresult"><div class="hero"><h1>${esc(t().noneH)}</h1><p>${esc(t().noneLede)}</p></div>
        ${cards}${told}${anos}</div>` + foot();
    }
    const order = { badLikely: 0, badPossible: 1, mixed: 2, goodLikely: 3, goodPossible: 4 };
    const pillCls = { badLikely: "bad", badPossible: "warn", goodLikely: "good", goodPossible: "good", mixed: "" };
    const vCls = { badLikely: "bad-likely", badPossible: "bad-possible", goodLikely: "good-likely", goodPossible: "good-possible", mixed: "mixed" };
    const rows = Object.entries(prof).filter(([, v]) => v.cls !== "neutral").sort((a, b) => (order[a[1].cls] - order[b[1].cls]) || (Math.abs(b[1].score) - Math.abs(a[1].score)));
    const famHtml = rows.length ? `<div class="verdicts">` + rows.map(([f, v]) => {
      /* the bottles grouped by source word: worn, or only tried in a shop */
      const groups = {};
      for (const e of v.evidence) { const k = shopTrial(e.perfume.id) ? "shopTrial" : "worn"; (groups[k] = groups[k] || new Set()).add(pname(e.perfume)); }
      const src = Object.entries(groups).map(([k, names]) => `${esc(listJoin([...names]))} <span class="src">(${esc(t()[k])})</span>`).join(lang === "ar" ? "؛ " : "; ");
      /* note answers name the note; a told answer pointing the other way from the bottles says so */
      const noteLines = v.evidence.filter(e => e.note).map(e => `<div class="hint">${esc(t().noteLine(pname(e.perfume), noteWords(e.perfume, f), e.value, low(t().rowStage[e.stage])))}</div>`).join("");
      const dis = disagreeWords(f, v.cls);
      const against = dis.length ? `<div class="hint qdis">${esc(t().disagree(listJoin(dis)))}</div>` : "";
      return `<div class="verdict ${vCls[v.cls]}"><div class="v-head"><b>${esc(fam(f))}</b><span class="pill ${pillCls[v.cls]}">${esc(t().cls[v.cls])}</span></div><div class="hint">${src}</div>${noteLines}${against}</div>`;
    }).join("") + `</div>` : `<div class="empty">${esc(t().noFamilies)}</div>`;
    let recs = "";
    const anyBad = Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible");
    if (gate) { const list = picksHtml(); if (list) recs = `<h2 class="qh2">${esc(t().recsH)}</h2><p class="notes">${esc(t().picksLede[anyBad ? "avoid" : "like"])}</p>${list}`; }
    else recs = `<div class="empty">${esc(t().oneMore)}</div>`;
    const arch = archetypeOf(prof), nPicks = gate ? recommend(prof).picks.length : 0;
    const tip = arch ? palateText(arch, prof).tip : "", tipHtml = tip ? `<p class="qtip"><b>${esc(t().tipH)}</b>${esc(tip)}</p>` : "";
    const hero = arch
      ? `<div class="qname-hero" style="--arch:${arch.color}">${emblemSvg(arch, 96)}<div><p class="eyebrow">${esc(t().palate)}</p><h1>${esc(arch[lang])}</h1></div></div><p class="qpal">${esc(palateText(arch, prof).about)}</p>`
      : `<div class="hero"><h1>${esc(t().resultH)}</h1></div>`;
    return topHtml() + `<div class="qresult">${hero}${funnelHtml(prof, nPicks)}
      ${tasteCardHtml(prof, ids)}<p class="qcompare" id="qcompare">${compareHtml(prof)}</p>${tipHtml}${recs}
      <a class="btn qfull" href="${esc(profilerHref("", "#sec-profile"))}">${esc(t().full)}</a>
      <div class="qshare"><button type="button" class="btn" data-sharecard="1">${esc(t().share)}</button></div>${anos}
      <details class="qhow"><summary>${esc(t().how)}</summary><p class="notes">${esc(t().resultLede)}</p>${famHtml}${told}</details></div>` + foot();
  }

  function render() {
    renderChrome();
    /* each screen reached on this visit goes out once, so the backend's funnel shows where people stop; picker
       screens by their position among the five, the result by quiz_done */
    if (step !== "result") { const k = step === "picker" ? "picker:" + (pk + 1) : step; sendOnce("reach:" + k, "reach:" + k, 0); }
    const host = $("quiz");
    if (step === "grid") {
      const old = $("q"), typed = old ? old.value : "";
      host.innerHTML = gridHtml();
      bindSearch(); if ($("q")) $("q").value = typed;
      renderGridParts();
      return;
    }
    const screens = { start: startHtml, verdicts: verdictHtml, notes: notesHtml, narrow: narrowHtml, picker: pickerHtml, taste: tasteHtml, told: toldHtml, anosmia: anosmiaHtml };
    if (!screens[step] && !revealed) {
      const b = sortedBottles();
      if (!stillMotion() && b.kept.length + b.turned.length >= 2 && typeof setTimeout === "function") {
        host.innerHTML = revealHtml(b);
        revealTimer = setTimeout(showResult, 1500 + 110 * (b.kept.length + b.turned.length));
        return;
      }
      revealed = true;
    }
    host.innerHTML = (screens[step] || resultHtml)();
    if (!screens[step]) countUp();
  }

  /* ---------- events ---------- */
  document.addEventListener("click", ev => {
    const b = ev.target.closest("button, a"); if (!b) return;
    if (b.id === "lang-en" || b.id === "lang-ar") { lang = b.id === "lang-en" ? "en" : "ar"; store.set("pp_lang", lang); render(); return; }
    const d = b.dataset || {};
    /* a shop link opens in a new tab; the event records which one and its position on the page (0: not a card,
       or the anosmia note's link) */
    if (d.skipintro) { showResult(); return; }
    if (d.sharecard) { shareCard(); return; }
    if (d.event) { const [kind, id] = d.event.split(":"); sendEvent(d.event, d.note ? 0 : (kind === "tester" ? shown.testers : shown.picks).indexOf(id) + 1); return; }
    if (d.add) { if (step === "grid") addPick(d.add); return; }
    if (d.tile) {
      if (step === "grid" && !ratedBefore(d.tile)) { if (picked.has(d.tile)) picked.delete(d.tile); else picked.add(d.tile); renderGridParts(); }
      if (step === "narrow" && narrow.some(c => c.id === d.tile)) { if (narrowPicked.has(d.tile)) narrowPicked.delete(d.tile); else narrowPicked.add(d.tile); render(); }
      return;
    }
    if (d.back) { back(); return; }
    if (d.start && step === "start") { go("grid"); return; }
    if (d.none && step === "grid") { const from = snap(); picked.clear(); sendOnce("quiz_grid", "quiz_grid", 0); toPicker(from); return; }
    if (d.skip && step === "narrow") { toPicker(); return; }
    if (d.continue) {
      if (step === "grid") {
        const from = snap();
        queue = QUIZ.grid.concat(extra).filter(id => picked.has(id) && !ratedBefore(id)); at = 0; round = 1;
        sendOnce("quiz_grid", "quiz_grid", queue.length);
        if (queue.length) go("verdicts", from); else toPicker(from);
      } else if (step === "verdicts" && ans[queue[at]]) { const v = ans[queue[at]].verdict; if (v === "turned" || v === "shop") toNotes(); else advance(); }
      else if (step === "notes") {
        const id = queue[at], a = ans[id] || { na: {}, un: [] }, rows = rowsFor(id);
        advance(null, ["notes:" + rows.filter(r => r.f in a.na || a.un.includes(r.f)).length, rows.length]);
      }
      else if (step === "narrow") {
        const from = snap();
        queue = narrow.map(c => c.id).filter(id => narrowPicked.has(id)); at = 0; round = 2;
        if (queue.length) go("verdicts", from); else toPicker(from);
      }
      else if (step === "picker") {
        /* each answered card's event goes out as the visitor leaves the screen */
        const from = snap(), notes = quiz.notes || {}, s = pickScreens().find(x => x.i === pk);
        for (const n of s ? s.cards : []) if (notes[n.id] === 1 || notes[n.id] === -1) sendOnce("note:" + n.id, (notes[n.id] === 1 ? "like:" : "avoid:") + n.id, 0);
        toPicker(from, pk);
      }
      else if (step === "told") {
        const nt = normTold(quiz), names = nt.told.length ? nt.told.map(c => "told:" + c) : nt.toldNone ? ["told:none"] : toldUnsure ? ["told:unsure"] : [];
        if (names.length && !sent.has("told")) { sent.add("told"); names.forEach(name => sendEvent(name, 0)); }
        go("anosmia");
      }
      return;
    }
    if (d.verdict && step === "verdicts") { giveVerdict(d.verdict); return; }
    if (d.when && step === "verdicts") {
      const id = queue[at], a = ans[id]; if (!a || a.verdict !== "turned" || !STAGES.concat("unsure").includes(d.when)) return;
      a.when = d.when; a.stage = d.when === "unsure" ? "drydown" : d.when; writeVerdict(id); render(); return;
    }
    /* a note row's answer: -2 to 2, or u (didn't notice it); the answer already chosen clears it */
    if (d.na && step === "notes") {
      const id = queue[at], a = ans[id], f = d.na; if (!a || !rowsFor(id).some(r => r.f === f)) return;
      if (d.v === "u") { if (a.un.includes(f)) a.un = a.un.filter(x => x !== f); else { a.un = a.un.concat(f); delete a.na[f]; } }
      else { const v = +d.v; if (![-2, -1, 0, 1, 2].includes(v)) return; if (a.na[f] === v) delete a.na[f]; else { a.na[f] = v; a.un = a.un.filter(x => x !== f); } }
      editing.delete(f); writeVerdict(id); render(); return;
    }
    if (d.nedit && step === "notes") { editing.add(d.nedit); render(); return; }
    if (d.nskip && step === "notes") { advance(null, ["notes:skip", rowsFor(queue[at]).length]); return; }
    if (d.nskipall && step === "notes") { const from = snap(), n = rowsFor(queue[at]).length; noNotes = true; advance(from, ["notes:skipall", n]); return; }
    if (d.pmore && step === "picker") { pkMore.add(pk); render(); return; }
    if (d.pn && step === "picker") {
      if (!QUIZ.notePicker.some(s => s.notes.some(n => n.id === d.pn))) return;
      const v = +d.pv; quiz.notes = Object.assign({}, quiz.notes);
      if (v === 1 || v === -1) quiz.notes[d.pn] = v; else delete quiz.notes[d.pn];
      store.set("pp_quiz_v1", quiz); render(); return;
    }
    if (d.taste && step === "taste") { quiz.taste = d.taste; store.set("pp_quiz_v1", quiz); sendOnce("taste", "taste:" + d.taste, 0); go("told"); return; }
    if (d.chip && step === "verdicts") {
      const id = queue[at], a = ans[id]; if (!a || (a.verdict !== "turned" && a.verdict !== "shop")) return;
      a.chips = a.chips.includes(d.chip) ? a.chips.filter(x => x !== d.chip) : a.chips.concat(d.chip);
      writeVerdict(id); render(); return;
    }
    if (d.told && step === "told") {
      const cur = normTold(quiz);
      if (d.told === "none") { quiz.told = []; if (cur.toldNone) delete quiz.toldNone; else quiz.toldNone = true; toldUnsure = false; }
      else if (d.told === "unsure") { quiz.told = []; delete quiz.toldNone; toldUnsure = !toldUnsure; }
      else if (TOLD.includes(d.told)) { quiz.told = cur.told.includes(d.told) ? cur.told.filter(x => x !== d.told) : cur.told.concat(d.told); delete quiz.toldNone; toldUnsure = false; }
      store.set("pp_quiz_v1", quiz); render(); return;
    }
    if (d.anosmia && step === "anosmia") { quiz.anosmia = d.anosmia; store.set("pp_quiz_v1", quiz); sendOnce("anosmia", "anosmia:" + d.anosmia, 0); go("result"); return; }
  });
  document.addEventListener("click", e => { if (!e.target.closest(".search")) showResults([]); });
  /* A hidden page may never come back (a closed tab, or a phone that switches apps and later discards it). */
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushSends(); });
  window.addEventListener("pagehide", flushSends);

  render();
  loadCatalogue();
})();
