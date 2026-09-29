/* The front page (index.html): why so few perfumes suit any one person, in seven steps (see the words below), each
   with an example from the catalogue or a label and its evidence from the books in reference/books/, leading to the
   quiz (quiz.html) and the articles.
   The centrepiece is a classic atomizer: a completed press on it squeezes the rubber bulb and sprays one of the quiz's
   twenty perfumes, whose listed notes rise from the mist in three rows, first minutes, first hours and hours later
   (js/landing-data.js, built by tools/build_landing.js). The mist and every other movement sit under
   prefers-reduced-motion: no-preference; without motion the notes simply appear. Shared words and the device store
   come from page.js. */
(function () {
  "use strict";
  const host = document.getElementById("lp");
  const PAGE = window.PP_PAGE, LD = window.PP_LANDING_DATA, CONFIG = window.PP_CONFIG || { endpoint: "" };
  if (!host) return;
  if (!PAGE || !LD) { host.textContent = "A script in js/ did not load (page or landing data). Serve the site folder as it is."; return; }
  const STAGES = ["opening", "heart", "drydown"];
  const store = PAGE.store;
  let lang = store.get("pp_lang", "ar");   /* Arabic first, whatever the device language; a chosen language is kept */

  /* Local testing only, as page.js does: http://localhost:8765/?endpoint=http://localhost:8765/api */
  let endpointParam = "";
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { try { const e = new URLSearchParams(location.search).get("endpoint"); if (e) { CONFIG.endpoint = e; endpointParam = e; } } catch (err) { /* ignore */ } }
  const withEndpoint = href => (endpointParam ? href + (href.includes("?") ? "&" : "?") + "endpoint=" + encodeURIComponent(endpointParam) : href);
  const QUIZ_HREF = () => withEndpoint("quiz.html?go=1");
  /* This page is the quiz's start screen now: one "reach:start" per visit, from the device id the quiz and the
     profiler use (the same format page.js makes), so the backend's funnel still begins here. */
  (function reachStart() {
    if (!CONFIG.endpoint) return;
    let device = store.get("pp_device", null);
    if (!device) { device = "d_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set("pp_device", device); }
    try { fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ type: "event", name: "reach:start", n: 0, device, lang, ts: new Date().toISOString() }) }).catch(() => {}); } catch (e) { /* offline or blocked */ }
  })();

  /* Arabic counted nouns: 1 and 2 have their own forms, 3 to 10 take the plural, 11 and more the singular */
  const arCount = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`);
  /* "n perfumes" in Arabic, where the last two digits decide: 1000 عطر, 1207 عطور, 427 عطراً */
  const arPerfumes = n => { const r = n % 100; return n === 1 ? "عطر واحد" : n === 2 ? "عطران" : r === 0 || (n > 100 && r <= 2) ? `${n} عطر` : r <= 10 ? `${n} عطور` : `${n} عطراً`; };
  const fmtEn = n => Number(n).toLocaleString("en-US");

  /* ---------- words ----------
     The page makes its case in seven steps, each with an example and its evidence: perfumes are built on smells most
     people like (1), yet critics rate few highly (2); the note list leaves materials out (3), and people smell the same
     perfume differently (4); so one note you cannot stand can outweigh the rest (5), the scents worth finding are the
     ones you love (6), and a perfume changes over the hours (7). Figures from the catalogue and the labels come from
     js/landing-data.js; figures from the books are written here with their sources. */
  const T = PAGE.words({
    en: {
      navQuiz: "The quiz", navProfiler: "Your profile",
      eyebrow: "A scent quiz in Arabic and English",
      h1: "Rose, vanilla and sandalwood all smell lovely. So why do so few perfumes suit you?",
      lede: "Nearly every perfume has notes you like, so those notes cannot be the reason so few suit you. The reason is often one material you cannot stand. The seven short steps below show why, each with an example and its source.",
      start: "Start the quiz", read: "Read the articles", startNote: "Four short parts. No sign-up.",
      press: "Press the bulb", pressAgain: "Press again for another perfume",
      invite: "Press the rubber bulb to spray one of the quiz's perfumes and watch its notes rise.",
      bottleLabel: "Perfume atomizer. Press to spray one of the quiz's twenty perfumes and see its notes.",
      sprayed: (house, name) => `${house} · ${name}`,
      sprayedNote: "One of the twenty perfumes in the quiz, with its listed notes.",
      sprayedLive: (house, name, rows) => `Sprayed ${house} ${name}. ${rows}`,
      step: n => `Step ${n}`, exTag: "Example", evTag: "Evidence", quizTag: "How the quiz uses this",

      likedH: "Perfumes are built on smells most people like",
      likedLede: (any, total) => `Of the ${fmtEn(total)} perfumes in our catalogue, ${fmtEn(any)} clearly carry at least one of the families below, from citrus and rose to vanilla and sandalwood. Tap a strip to read what each one smells like and how many of the ${fmtEn(total)} carry it.`,
      matCount: (n, total) => `Clearly present in ${fmtEn(n)} of our ${fmtEn(total)} perfumes`,
      matTap: "Tap to read",

      critH: "Yet critics rate few perfumes highly",
      critLede: "The critics Luca Turin and Tania Sanchez reviewed 1,207 perfumes for the 2018 edition of their book, Perfumes: The Guide.",
      statBig: "About half",
      statText: "got one or two stars out of five. About twenty got five.",
      starsRow: (k, n) => `${k} star${k > 1 ? "s" : ""}: ${fmtEn(n)} perfumes`,
      critSrc: "Star counts of all 1,207 rated reviews in Turin and Sanchez, Perfumes: The Guide (2018).",

      listH: "The note list leaves materials out",
      listLede: "A note is the name of a smell. The perfumer builds that smell from materials, many of them synthetic, and the list does not say which.",
      labelBox: "On the note list", labelInci: "On the ingredient label, first five",
      inciNames: { "alcohol denat.": "alcohol", parfum: "fragrance", aqua: "water", "tetramethyl acetyloctahydronaphthalenes": "Iso E Super", hexamethylindanopyran: "Galaxolide" },
      labelText: (name, checked, iso, listed) => `${name}'s label names Iso E Super, a synthetic woody material, and Galaxolide, a synthetic musk, among its first five ingredients, under their chemical names. Its note list mentions neither. Of the ${checked} Parfums de Marly labels we checked, ${iso} name Iso E Super among the first five ingredients, and ${listed ? `only ${listed} of their note lists mention` : "none of their note lists mentions"} it.`,
      jasmine: "A jasmine flower smells lovely, yet up to a tenth of the scent it gives off can be indole. Nearly pure, indole smells of mothballs, and it is often described as fecal.",
      jasmineKey: ["Jasmine's scent", "Up to 10% indole"],
      listFamsLead: "Words such as ambergris, amberwood and musk on a note list often stand for one of two families of synthetic materials.",
      listFams: ["woody_amber", "white_musk"],
      matBook: {
        woody_amber: "The critic Luca Turin writes that perfumers now use these in every type of perfume because they last so long. (Turin and Sanchez, Perfumes: The Guide, 2018)",
        white_musk: "A perfume chemistry textbook states that no perfume on the market lacks musk materials. (Ohloff and others, Scent and Chemistry, 2022)"
      },
      listSrc: "Labels: the ingredient lists on the Parfums de Marly website, September 2026. Jasmine: McGee, Nose Dive (2020). A perfumery textbook describes the laboratory shelves as hundreds of bottles of strange and often unpleasant-smelling materials (Calkin and Jellinek, Perfumery: Practice and Principles, 1994, p. 24).",

      noseH: "People smell the same perfume differently",
      noseLede: "The smell scientist Avery Gilbert compares it to sight: it is as if there were dozens of kinds of colour blindness instead of three, and each affected up to three people in four. We each have about 400 kinds of smell receptor, and the genes behind them vary from person to person. Choose a smell to see how 100 people split in a large survey.",
      noseCases: [
        { id: "banana", name: "Banana (isoamyl acetate)", can: 99, about: true, note: "No smell blindness is known for this one alone. Only people with no sense of smell at all miss it: about 1 in 100 in the survey.", g: "fresh" },
        { id: "clove", name: "Clove (eugenol)", can: 99, about: true, note: "No smell blindness is known for this one alone. Only people with no sense of smell at all miss it: about 1 in 100 in the survey.", g: "spiced" },
        { id: "musk", name: "A clean musk (Galaxolide)", can: 67, about: true, note: "About as many people could not smell it as could not smell androstenone. It is the musk on the Pegasus label in step 3. Accords built on it, beginning with White Linen (1978), gave many perfumes their clean, freshly ironed smell.", g: "musk" },
        { id: "andro", name: "Androstenone", can: 67, about: true, note: "70.5% of women and 62.8% of men could smell it. Of those who can, most describe it as urine-like, and some as sweet or floral.", g: "amber" }
      ],
      noseCan: n => `${n} can smell it`, noseCannot: n => `${n} cannot`, noseAbout: "about",
      noseCritics: "Critics differ in the same way. Luca Turin found Mr. Burberry loud; Tania Sanchez found it quiet and concluded that she could not smell one of its main materials.",
      noseSrc: "Colour blindness comparison: Gilbert, What the Nose Knows (2008). Receptors: McGee, Nose Dive (2020). Survey figures: the National Geographic Smell Survey, as reported in Ohloff and others, Scent and Chemistry (2022). The critics: Turin and Sanchez, Perfumes: The Guide (2018).",

      spoilH: "One note you cannot stand can outweigh all the ones you like",
      spoilLede: "Nearly every perfume has notes you like (step 1), so liking a note does little to narrow your choice. A material you cannot stand narrows it at once.",
      pairText: (n, both) => `Say you love vanilla. In our catalogue, ${fmtEn(n)} perfumes clearly carry the vanilla family, and ${fmtEn(both)} of them also carry a woody amber. If woody ambers spoil a perfume for you, liking vanilla will not keep you away from those ${fmtEn(both)}.`,
      pairKey: (n, both) => [`${fmtEn(n)} perfumes with vanilla`, `${fmtEn(both)} of them with a woody amber too`],
      spoilTry: "Try it with one of the quiz's perfumes: choose one, then tap the note you would least like to smell in it.",
      spoilPick: "Tap the note you would mind most",
      spoilResult: (note, n, name) => `"${note.charAt(0).toUpperCase() + note.slice(1)}" is one of the ${n} listed notes of ${name}. If it is the one you cannot stand, the perfume may not suit you however much you like the rest.`,
      spoilFamily: (fam, n, total) => `It belongs to ${fam}, clearly present in ${fmtEn(n)} of our ${fmtEn(total)} perfumes.`,
      spoilIds: ["khamrah", "yara", "sauvageedp", "br540"],
      spoilQuiz: "It looks for what the perfumes that turned on you have in common, and keeps that out of your picks.",
      spoilBook: "In tests reported by the perfumer Paul Jellinek, a violet scent for lipstick that most testers approved was rejected once a touch of civet was added (The Psychological Basis of Perfumery, 1997, p. 134). Critics describe the same in fine perfume, calling a good perfume \"marred\" by one material, often a woody amber (Turin and Sanchez, 2018). A perfumery textbook notes that people rarely buy an everyday product for its scent, yet may well reject one whose scent they dislike (Calkin and Jellinek, 1994, p. 148).",

      loveH: "Then find the scents you especially love",
      loveLede: "Most perfumes are pleasant enough. The few you love are harder to find, because what one person loves another may dislike.",
      loveCards: [
        ["Chosen so few dislike it", "Makers of shampoos and detergents pick scents that few people dislike, even when they are not very exciting."],
        ["Loved by a few", "Some luxury perfumes appeal strongly to a small group and find little favour with everyone else."]
      ],
      loveQuiz: "Only the perfumes you still use shape your palate. A perfume you liked and then stopped using does not.",
      loveSrc: "The two kinds of scent: Calkin and Jellinek, Perfumery: Practice and Principles (1994), pp. 148-149. The critics Turin and Sanchez write that a perfume they rate highly may strike some people as unbearable and others as the one they had been searching for all their lives (Perfumes: The Guide, 2018).",

      timeH: "A perfume changes as you wear it",
      timeLede: "Its materials evaporate at different speeds, so a perfume smells different in its first minutes, its first hours and hours later. The note that bothers you may be there only at the start, or only later. Move through a day of wear to see what each stage holds.",
      timeQuiz: "It asks when a perfume bothered you: in the first minutes, the first hours or hours later.",
      timeBook: "Top notes fade within minutes to an hour, heart notes last from about an hour to a few hours, and base notes for many hours (McGee, Nose Dive, 2020). Turin and Sanchez describe both cases: modern perfumes made to smell good only for the few minutes it takes to decide at the counter, and older ones that smelled wrong up close at first and were at their best two hours in (Perfumes: The Guide, 2018).",
      timeSlider: "Time since you put it on",
      timeNow: m => (m === 0 ? "At the first spray" : m < 60 ? `${m} minutes in` : `${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " min" : ""} in`),
      timeIn: "Stage", tick: h => `${h} h`,
      timeStage: { opening: "First minutes", heart: "First hours", drydown: "Hours later" },
      timeIds: ["sauvageedp", "libre", "khamrah", "adgedt"],
      timeNotes: "Listed notes",

      quizH: "Four short parts",
      quizLede: "The quiz applies these steps to you. It learns first from the perfumes you have tried, then from what you say about notes.",
      quizSteps: [
        ["Your bottles", "Tap the perfumes you have tried and say how each went: still in use, turned on you, or put you off in the shop."],
        ["Notes you know", "Say which notes you enjoy and which you avoid."],
        ["Sweet or bitter", "Say whether you prefer sweet perfumes or bitter, fresh ones."],
        ["What bothers you", "Pick what has bothered you in perfumes before."]
      ],
      getH: "What you get",
      gets: [
        ["Your palate", "Named from the perfumes you still wear."],
        ["Your deal-breakers", "The families that spoil perfumes for you, and the bottles that show it."],
        ["Three samples", "Chosen to avoid your deal-breakers and match what you love."]
      ],

      artH: "Read more",
      arts: [
        ["woody-ambers", "Woody ambers", "The modern materials some people love and others cannot stand."],
        ["musk-anosmia", "The musk you cannot smell", "Why a musk perfume can be strong on you while you barely notice it."],
        ["notes-not-ingredients", "Notes are not ingredients", "What the list on the box tells you, and what it leaves out."],
        ["three-ouds", "Oud is not one smell", "Three kinds of oud, and how to tell which one you like."]
      ],
      artGo: "Read"
    },
    ar: {
      navQuiz: "الاختبار", navProfiler: "ملفك العطري",
      eyebrow: "اختبار للذائقة العطرية بالعربية والإنجليزية",
      h1: "الورد والفانيلا والصندل كلها روائح جميلة، فلماذا لا يناسبك من العطور إلا القليل؟",
      lede: "كل العطور تقريباً فيها نوتات تعجبك، فليست هذه النوتات سبب قلّة ما يناسبك منها. وكثيراً ما يكون السبب مادة واحدة لا تطيقها. وإليك التفصيل في سبع خطوات قصيرة، مع مثال ومصدر لكل خطوة.",
      start: "ابدأ الاختبار", read: "اقرأ المقالات", startNote: "أربعة أجزاء قصيرة، بلا تسجيل.",
      press: "اضغط على الكرة", pressAgain: "اضغط مرة أخرى لعطر آخر",
      invite: "اضغط على الكرة المطاطية لترشّ أحد عطور الاختبار وتظهر لك نوتاته.",
      bottleLabel: "بخّاخ عطر. اضغط لترشّ أحد العطور العشرين في الاختبار وترى نوتاته.",
      sprayed: (house, name) => `${house} · ${name}`,
      sprayedNote: "أحد العطور العشرين في الاختبار، بنوتاته المعلنة.",
      sprayedLive: (house, name, rows) => `رششت ${name} من ${house}. ${rows}`,
      step: n => "الخطوة " + ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة"][n - 1],
      exTag: "مثال", evTag: "الشواهد", quizTag: "كيف يستفيد الاختبار من ذلك",

      likedH: "العطور مبنية على روائح يحبها أكثر الناس",
      likedLede: (any, total) => `في قائمتنا ${arPerfumes(total)}، وفي ${any} منها تظهر بوضوح عائلة واحدة على الأقل من العائلات أدناه، كالحمضيات والورد والفانيلا والصندل. اضغط على الشريط لتقرأ وصف العائلة، وعدد عطور القائمة التي تظهر فيها.`,
      matCount: (n, total) => `تظهر بوضوح في ${n} من ${arPerfumes(total)} في قائمتنا`,
      matTap: "اضغط لتقرأ",

      critH: "لكن النقاد لا يرضون إلا عن القليل منها",
      critLede: "راجع الناقدان لوكا تورين وتانيا سانشيز 1207 عطور في طبعة 2018 من كتابهما «العطور: الدليل».",
      statBig: "نحو النصف",
      statText: "منها نال نجمة أو نجمتين من خمس، ولم ينل النجوم الخمس إلا نحو عشرين عطراً.",
      starsRow: (k, n) => `${["نجمة واحدة", "نجمتان", "3 نجوم", "4 نجوم", "5 نجوم"][k - 1]}: ${arPerfumes(n)}`,
      critSrc: "توزيع النجوم على مراجعات الكتاب المقيّمة كلها، وعددها 1207: تورين وسانشيز، «العطور: الدليل» (2018).",

      listH: "قائمة النوتات لا تذكر كل ما في الزجاجة",
      listLede: "النوتة اسم لرائحة، وصانع العطر يبني هذه الرائحة من مواد كثير منها صناعي، والقائمة لا تذكر أيّ المواد استعمل.",
      labelBox: "في قائمة النوتات", labelInci: "في ملصق المكونات: أول خمسة",
      inciNames: { "alcohol denat.": "كحول", parfum: "عطر", aqua: "ماء", "tetramethyl acetyloctahydronaphthalenes": "إيزو إي سوبر", hexamethylindanopyran: "غالاكسوليد" },
      labelText: (name, checked, iso, listed) => `يذكر ملصق ${name} بين أول خمسة مكونات مادتين لا تذكرهما قائمة نوتاته: إيزو إي سوبر، وهي مادة خشبية صناعية، وغالاكسوليد، وهو مسك صناعي، وقد كُتبت كلتاهما باسمها الكيميائي. وراجعنا ملصقات ${arPerfumes(checked)} من الدار نفسها، فوجدنا إيزو إي سوبر بين أول خمسة مكونات في ${iso} منها، ${listed ? `ولم تذكره إلا قوائم نوتات ${listed} منها` : "ولم تذكره قائمة نوتات أيّ منها"}.`,
      jasmine: "رائحة زهرة الياسمين جميلة، لكن الإندول قد يبلغ عُشر ما تفوح به. والإندول شبه النقي رائحته كرائحة حبوب النفتالين، ويشبّهها كثيرون برائحة البراز.",
      jasmineKey: ["رائحة الياسمين", "حتى 10٪ إندول"],
      listFamsLead: "وكثيراً ما تعني كلمات مثل «عنبر» و«خشب عنبري» و«مسك» في قوائم النوتات واحدة من عائلتين من المواد الصناعية.",
      listFams: ["woody_amber", "white_musk"],
      matBook: {
        woody_amber: "يكتب الناقد لوكا تورين أن صانعي العطور صاروا يستخدمون هذه المواد في كل أنواع العطور لأنها تدوم طويلاً. (تورين وسانشيز، «العطور: الدليل»، 2018)",
        white_musk: "يقرّر كتاب مرجعي في كيمياء العطور أنه لا يخلو عطر في السوق من مواد المسك. (أولوف وآخرون، «الرائحة والكيمياء»، 2022)"
      },
      listSrc: "الملصقات: قوائم المكونات على موقع Parfums de Marly، سبتمبر 2026. الياسمين: ماكغي، «الغوص بالأنف» (2020). ويصف كتاب مرجعي في صناعة العطور رفوف المختبر بأنها مئات القوارير من مواد غريبة الرائحة، كثير منها كريه (كالكن ويلينك، «صناعة العطور: الممارسة والمبادئ»، 1994، ص 24).",

      noseH: "أنفك ليس كأنف غيرك",
      noseLede: "يشرح عالم الشم أفري غيلبرت اختلاف الناس في الشم بمقارنته بالبصر: كأن لعمى الألوان عشرات الأنواع بدل ثلاثة، وكل نوع منها يصيب ما يصل إلى ثلاثة أرباع الناس. فلكل منا نحو 400 نوع من مستقبلات الشم، وتختلف جيناتها من شخص لآخر. اختر رائحة لترى كيف انقسم 100 شخص في مسح كبير.",
      noseCases: [
        { id: "banana", name: "الموز (أسيتات الأيزوأميل)", can: 99, about: true, note: "لا يُعرف أحد يعجز عن شمّ هذه الرائحة وحدها، فلا تفوت إلا من فقد حاسة الشم كلها، وهم نحو واحد من كل مئة في المسح.", g: "fresh" },
        { id: "clove", name: "القرنفل (الأوجينول)", can: 99, about: true, note: "لا يُعرف أحد يعجز عن شمّ هذه الرائحة وحدها، فلا تفوت إلا من فقد حاسة الشم كلها، وهم نحو واحد من كل مئة في المسح.", g: "spiced" },
        { id: "musk", name: "مسك نظيف (غالاكسوليد)", can: 67, about: true, note: "كان عدد من لم يشمّوه قريباً من عدد من لم يشمّوا الأندروستينون. وهو المسك المذكور في ملصق بيغاسوس في الخطوة الثالثة. والتراكيب المبنية عليه، بدءاً بعطر «وايت لينن» (1978)، أعطت كثيراً من العطور رائحة الثياب النظيفة المكويّة.", g: "musk" },
        { id: "andro", name: "الأندروستينون", can: 67, about: true, note: "شمّه 70.5٪ من النساء و62.8٪ من الرجال. ومن يشمّه يصفه غالباً بأنه يشبه رائحة البول، ويصفه بعضهم بأنه حلو أو زهري.", g: "amber" }
      ],
      noseCan: n => `${n} يشمّونها`, noseCannot: n => (n === 1 ? "واحد لا يشمّها" : `${n} لا يشمّونها`), noseAbout: "نحو",
      noseCritics: "والنقاد أنفسهم يختلفون هكذا: وجد لوكا تورين عطر «مستر بربري» قوياً جداً، ووجدته تانيا سانشيز هادئاً، فاستنتجت أنها لا تشمّ إحدى مواده الرئيسية.",
      noseSrc: "مقارنة عمى الألوان: غيلبرت، «ما يعرفه الأنف» (2008). المستقبلات: ماكغي، «الغوص بالأنف» (2020). أرقام المسح: مسح ناشيونال جيوغرافيك للشم، كما نقله أولوف وآخرون في «الرائحة والكيمياء» (2022). الناقدان: تورين وسانشيز، «العطور: الدليل» (2018).",

      spoilH: "نوتة واحدة لا تطيقها تكفي لتنفّرك من العطر كله",
      spoilLede: "ما دام كل عطر تقريباً فيه نوتات تعجبك (الخطوة الأولى)، فإعجابك بنوتة ما لا يضيّق اختيارك كثيراً. أما المادة التي لا تطيقها فتضيّقه فوراً.",
      pairText: (n, both) => `لنفترض أنك تحب الفانيلا. في قائمتنا ${arPerfumes(n)} تظهر فيها عائلة الفانيلا بوضوح، وفي ${both} منها خشب عنبري أيضاً. فإن كانت الأخشاب العنبرية تفسد العطر عليك، فلن يبعدك حبك للفانيلا عن هذه العطور.`,
      pairKey: (n, both) => [`${arPerfumes(n)} فيها فانيلا`, `${both} منها فيها خشب عنبري أيضاً`],
      spoilTry: "جرّب بنفسك مع أحد عطور الاختبار: اختره، ثم اضغط على النوتة التي لا تحب أن تشمّها فيه.",
      spoilPick: "اضغط على النوتة التي تزعجك أكثر من غيرها",
      spoilResult: (note, n, name) => `«${note}» واحدة من ${arCount(n, "نوتة واحدة", "نوتتين", "نوتات", "نوتة")} معلنة في ${name}. إن كانت هي ما لا تطيقه، فقد لا يناسبك العطر مهما أحببت الباقي.`,
      spoilFamily: (fam, n, total) => `وهي من عائلة ${fam}، وتظهر بوضوح في ${n} من ${arPerfumes(total)} في قائمتنا.`,
      spoilIds: ["khamrah", "yara", "sauvageedp", "br540"],
      spoilQuiz: "يبحث عمّا تشترك فيه العطور التي انقلبت عليك، ويستبعده من ترشيحاتك.",
      spoilBook: "في اختبارات نقلها صانع العطور باول يلينك، استحسن أكثر المختبرين رائحة بنفسج لأحمر الشفاه، ثم رفضوها حين أُضيفت إليها لمسة من الزباد («الأساس النفسي لصناعة العطور»، 1997، ص 134). والنقاد يصفون الأمر نفسه في العطور الفاخرة، فيقولون عن عطر جيد إن مادة واحدة أفسدته، وكثيراً ما تكون خشباً عنبرياً (تورين وسانشيز، 2018). ويذكر كتاب مرجعي في صناعة العطور أن الناس قلّما يشترون منتجاً يومياً من أجل رائحته، لكنهم قد يرفضونه إن كرهوا رائحته (كالكن ويلينك، 1994، ص 148).",

      loveH: "ثم ابحث عن الروائح التي تعشقها",
      loveLede: "أكثر العطور مقبولة الرائحة، أما التي تعشقها فقليلة ويصعب العثور عليها، لأن ما يعشقه شخص قد يكرهه غيره.",
      loveCards: [
        ["روائح قلّ من يكرهها", "يختار صانعو الشامبو ومساحيق الغسيل روائح لا يكرهها إلا القليل من الناس، وإن لم تكن لافتة."],
        ["روائح يعشقها قليلون", "بعض العطور الفاخرة تعجب مجموعة صغيرة إعجاباً شديداً، ولا تلقى قبولاً يُذكر عند أكثر الناس."]
      ],
      loveQuiz: "لا تُبنى ذائقتك إلا على العطور التي ما زلت تستخدمها، أما العطر الذي أعجبك ثم تركته فلا يدخل في حسابها.",
      loveSrc: "النوعان: كالكن ويلينك، «صناعة العطور: الممارسة والمبادئ» (1994)، ص 148-149. ويكتب الناقدان تورين وسانشيز أن العطر الذي يقيّمانه تقييماً عالياً قد يراه بعض الناس لا يُطاق، ويراه آخرون ضالّتهم التي بحثوا عنها طوال حياتهم («العطور: الدليل»، 2018).",

      timeH: "رائحة العطر تتغيّر على جلدك مع الساعات",
      timeLede: "مواد العطر تتبخّر بسرعات مختلفة، فتختلف رائحته في دقائقه الأولى عنها في ساعاته الأولى وبعد ساعات. وقد تظهر النوتة التي تزعجك في البداية فقط، أو بعد مدة. حرّك المؤشر عبر يوم كامل لترى ما في كل مرحلة.",
      timeQuiz: "يسألك متى أزعجك العطر: في الدقائق الأولى، أم في الساعات الأولى، أم بعد ساعات.",
      timeBook: "تتلاشى النوتات العليا خلال دقائق إلى ساعة، وتبقى نوتات القلب من نحو ساعة إلى بضع ساعات، ونوتات القاعدة لساعات طويلة (ماكغي، «الغوص بالأنف»، 2020). ويذكر الناقدان تورين وسانشيز الحالتين: عطوراً حديثة صُنعت لتكون جميلة في الدقائق القليلة التي يستغرقها قرار الشراء فقط، وعطوراً قديمة كانت رائحتها عن قرب غريبة في أولها، ولا تبلغ أجمل حالاتها إلا بعد ساعتين («العطور: الدليل»، 2018).",
      timeSlider: "الوقت منذ وضعته",
      timeNow: m => { const d = n => arCount(n, "دقيقة", "دقيقتين", "دقائق", "دقيقة"), h = n => arCount(n, "ساعة", "ساعتين", "ساعات", "ساعة"); return m === 0 ? "عند الرشّ" : m < 60 ? "بعد " + d(m) : "بعد " + h(Math.floor(m / 60)) + (m % 60 ? " و" + d(m % 60) : ""); },
      timeIn: "المرحلة", tick: h => `${h} س`,
      timeStage: { opening: "الدقائق الأولى", heart: "الساعات الأولى", drydown: "بعد ساعات" },
      timeIds: ["sauvageedp", "libre", "khamrah", "adgedt"],
      timeNotes: "النوتات المعلنة",

      quizH: "أربعة أجزاء قصيرة",
      quizLede: "يطبّق الاختبار هذه الخطوات عليك: يتعلم أولاً من العطور التي جرّبتها، ثم مما تقوله عن النوتات.",
      quizSteps: [
        ["عطورك", "اختر العطور التي جرّبتها، وأخبرنا بما حدث مع كل منها: ما زلت تستخدمه، أو انقلب عليك، أو نفرت منه في المتجر."],
        ["نوتات تعرفها", "أخبرنا بالنوتات التي تحبها والتي تتجنبها."],
        ["حلو أو مرّ", "أخبرنا أيّهما تفضّل: العطور الحلوة أم المرّة المنعشة."],
        ["ما يزعجك", "اختر ما أزعجك في العطور من قبل."]
      ],
      getH: "ما تحصل عليه",
      gets: [
        ["ذائقتك", "نسمّيها من العطور التي ما زلت تستخدمها."],
        ["ما يفسد العطر عليك", "العائلات التي تفسد العطور عليك، والعطور التي كشفتها."],
        ["ثلاث عيّنات", "مختارة لتتجنّب ما يفسد العطر عليك وتوافق ما تحبه."]
      ],

      artH: "اقرأ المزيد",
      arts: [
        ["woody-ambers", "الأخشاب العنبرية", "المواد الحديثة التي يحبها بعض الناس ولا يطيقها آخرون."],
        ["musk-anosmia", "المسك الذي لا تستطيع شمّه", "لماذا قد يكون عطر المسك قوياً عليك وأنت بالكاد تلاحظه."],
        ["notes-not-ingredients", "النوتات ليست مكونات", "ما تخبرك به القائمة على العلبة، وما لا تذكره."],
        ["three-ouds", "العود ليس رائحة واحدة", "ثلاثة أنواع من العود، وكيف تعرف أيّها تحب."]
      ],
      artGo: "اقرأ"
    }
  });
  const t = () => T[lang];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = id => document.getElementById(id);
  const byId = Object.fromEntries(LD.sprays.map(s => [s.id, s]));
  const fam = f => (LD.families[f] ? LD.families[f][lang] : f);
  const color = g => (g && LD.groups[g] ? LD.groups[g].color : "#8C7A66");
  const pname = s => (lang === "ar" && s.ar ? s.ar : s.name);
  const noteWord = n => (lang === "ar" && n.ar ? n.ar : n.en);
  const motion = () => !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  /* a colour mixed into a base (cream unless given): k of the colour, so mist and liquid stay luminous */
  const tint = (hex, k, base) => { const rgb = x => { const h = x.replace("#", ""); return [0, 2, 4].map(j => parseInt(h.slice(j, j + 2), 16)); }, c = rgb(hex), b = rgb(base || "#FFF7E4");
    return "#" + c.map((v, j) => Math.round(v * k + b[j] * (1 - k)).toString(16).padStart(2, "0")).join("").toUpperCase(); };
  /* a Fisher-Yates shuffle with the random source given */
  const shuffle = (arr, rnd) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- the atomizer ----------
     A faceted flacon with amber liquid, a gold collar and pump head with its nozzle, a silk-covered tube to the
     rubber bulb in its net, and a tassel. Gold is a soft two-tone shade, as on the site's buttons, never a metallic
     sheen. Drawn once in LTR; the stage mirrors it in Arabic so the spray always leaves toward the open side of the
     page, away from the text. */
  const ATOMIZER = `<svg class="lp-svg" viewBox="0 0 420 330" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="lpGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset=".45" stop-color="#FFF6E6" stop-opacity=".18"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".4"/></linearGradient>
      <linearGradient id="lpJuice" x1="0" y1="0" x2="0" y2="1"><stop class="lp-jstop" offset="0" stop-color="#F7C66B"/><stop class="lp-jstop" offset=".55" stop-color="#E8903A"/><stop class="lp-jstop" offset="1" stop-color="#C4506F"/></linearGradient>
      <linearGradient id="lpGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E3C170"/><stop offset="1" stop-color="#CC9E47"/></linearGradient>
      <radialGradient id="lpBulb" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#E07AA6"/><stop offset=".45" stop-color="#B8467A"/><stop offset="1" stop-color="#5E1E3D"/></radialGradient>
      <radialGradient id="lpShadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#2A1B11" stop-opacity=".28"/><stop offset="1" stop-color="#2A1B11" stop-opacity="0"/></radialGradient>
      <clipPath id="lpBody"><path d="M187 118 H313 Q333 118 338 138 L350 252 Q353 300 314 314 H186 Q147 300 150 252 L162 138 Q167 118 187 118 Z"/></clipPath>
      <clipPath id="lpBulbClip"><ellipse cx="96" cy="252" rx="37" ry="46"/></clipPath>
      <pattern id="lpNet" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 H10 M0 0 V10" stroke="#F4D891" stroke-width="1.1" opacity=".55"/></pattern>
    </defs>
    <ellipse cx="250" cy="318" rx="130" ry="11" fill="url(#lpShadow)"/>
    <ellipse class="lp-bulb-shadow" cx="96" cy="318" rx="44" ry="6" fill="url(#lpShadow)"/>
    <!-- the silk-covered tube, from the pump head to the bulb -->
    <path class="lp-tube" d="M236 80 C 196 58, 132 70, 110 132 C 100 162, 98 184, 97 202" fill="none" stroke="#8C5F00" stroke-width="8" stroke-linecap="round"/>
    <path class="lp-tube" d="M236 80 C 196 58, 132 70, 110 132 C 100 162, 98 184, 97 202" fill="none" stroke="#E3C170" stroke-width="5.2" stroke-linecap="round" stroke-dasharray="4 3"/>
    <!-- the bulb, its fitting and tassel; the group squeezes when pressed -->
    <g class="lp-bulb">
      <path d="M90 198 H104 L106 212 H88 Z" fill="url(#lpGold)"/>
      <ellipse cx="96" cy="252" rx="37" ry="46" fill="url(#lpBulb)"/>
      <rect x="55" y="202" width="84" height="100" fill="url(#lpNet)" clip-path="url(#lpBulbClip)"/>
      <ellipse cx="84" cy="232" rx="11" ry="17" fill="#FFFFFF" opacity=".22" transform="rotate(-18 84 232)"/>
      <g class="lp-tassel">
        <circle cx="96" cy="302" r="5" fill="url(#lpGold)"/>
        <path d="M96 306 v8" stroke="#A97A26" stroke-width="2"/>
        <path d="M89 314 h14 l3 26 h-20 z" fill="#C4506F"/>
        <path d="M90 318 l-2 22 M94 318 l-1 23 M98 318 l1 23 M102 318 l2 22" stroke="#7E2A4E" stroke-width="1" opacity=".7"/>
        <rect x="88" y="312" width="16" height="4" rx="2" fill="url(#lpGold)"/>
      </g>
    </g>
    <!-- the flacon: cut glass with three faces, the liquid, the shoulders and neck -->
    <g clip-path="url(#lpBody)">
      <rect x="140" y="110" width="220" height="210" fill="#FBEFD9" opacity=".55"/>
      <rect class="lp-juice" x="140" y="168" width="220" height="150" fill="url(#lpJuice)" opacity=".92"/>
      <path d="M140 168 H360" stroke="#FFF1C9" stroke-width="2.5" opacity=".9"/>
      <path d="M150 110 L205 124 L200 312 L150 320 Z" fill="#FFFFFF" opacity=".16"/>
      <path d="M350 110 L295 124 L300 312 L350 320 Z" fill="#2A1B11" opacity=".1"/>
      <path d="M205 124 L295 124 L300 312 L200 312 Z" fill="url(#lpGlass)" opacity=".5"/>
      <rect x="171" y="136" width="9" height="150" rx="4.5" fill="#FFFFFF" opacity=".42"/>
    </g>
    <path d="M187 118 H313 Q333 118 338 138 L350 252 Q353 300 314 314 H186 Q147 300 150 252 L162 138 Q167 118 187 118 Z" fill="none" stroke="#B58A36" stroke-width="2" opacity=".85"/>
    <path d="M205 124 L200 312 M295 124 L300 312" stroke="#FFFFFF" stroke-width="1.2" opacity=".55"/>
    <rect x="232" y="98" width="36" height="22" rx="4" fill="#FBEFD9" stroke="#B58A36" stroke-width="1.5"/>
    <!-- gold collar, pump head and nozzle -->
    <rect x="223" y="84" width="54" height="17" rx="5" fill="url(#lpGold)" stroke="#B58A36" stroke-width="1"/>
    <path d="M236 84 C236 70 244 64 250 64 C256 64 264 70 264 84 Z" fill="url(#lpGold)" stroke="#B58A36" stroke-width="1"/>
    <path class="lp-nozzle-arm" d="M258 72 L292 58" stroke="#CC9E47" stroke-width="7" stroke-linecap="round"/>
    <circle cx="294" cy="57" r="4.5" fill="#6B4400"/>
    <circle id="lp-nozzle" cx="296" cy="56" r="1" fill="none"/>
  </svg>`;

  /* ---------- the mist: soft droplets on a canvas, drawn from pre-rendered sprites ----------
     It runs only while droplets are alive, and holds at most 720 of them however fast the bulb is pressed. */
  const MAX_PARTS = 720;
  const mist = {
    canvas: null, ctx: null, parts: [], raf: 0, w: 0, h: 0, dpr: 1, sprites: {},
    sprite(col) {
      if (this.sprites[col]) return this.sprites[col];
      const c = document.createElement("canvas"); c.width = c.height = 48;
      const x = c.getContext("2d"); if (!x) return null;
      const g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
      g.addColorStop(0, col); g.addColorStop(.35, col + "AA"); g.addColorStop(1, col + "00");
      x.fillStyle = g; x.fillRect(0, 0, 48, 48);
      return (this.sprites[col] = c);
    },
    size() {
      if (!this.canvas || !this.canvas.getBoundingClientRect) return;
      const r = this.canvas.getBoundingClientRect();
      this.dpr = Math.min(2, window.devicePixelRatio || 1); this.w = r.width; this.h = r.height;
      this.canvas.width = Math.round(r.width * this.dpr); this.canvas.height = Math.round(r.height * this.dpr);
    },
    /* one burst from (x, y) toward angle a (radians), in the colours given */
    burst(x, y, a, cols) {
      const k = Math.max(.6, Math.min(1.3, this.w / 460));
      cols = cols.map(c => tint(c, .55));
      for (let i = 0; i < 240; i++) {
        const spread = (Math.random() - .5) * .7, sp = (3 + Math.random() * 7.5) * k, big = Math.random() < .14;
        this.parts.push({ x, y, vx: Math.cos(a + spread) * sp, vy: Math.sin(a + spread) * sp, r: big ? 16 + Math.random() * 26 : 2.2 + Math.random() * 5.5,
          life: 0, max: 70 + Math.random() * 90, col: Math.random() < .3 ? "#FFF7E4" : cols[i % cols.length], a: big ? .18 : .8, delay: Math.floor(Math.random() * 16) });
      }
      if (this.parts.length > MAX_PARTS) this.parts.splice(0, this.parts.length - MAX_PARTS);
      if (!this.raf && this.ctx) this.raf = requestAnimationFrame(() => this.step());
    },
    step() {
      const x = this.ctx; if (!x) { this.raf = 0; return; }
      x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); x.clearRect(0, 0, this.w, this.h);
      this.parts = this.parts.filter(p => p.life < p.max);
      for (const p of this.parts) {
        if (p.delay > 0) { p.delay--; continue; }
        p.life++; p.x += p.vx; p.y += p.vy; p.vx *= .962; p.vy = p.vy * .962 - .02; p.r *= 1.008;
        const s = this.sprite(p.col); if (!s) continue;
        x.globalAlpha = p.a * Math.max(0, 1 - p.life / p.max);
        x.drawImage(s, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      x.globalAlpha = 1;
      this.raf = this.parts.length ? requestAnimationFrame(() => this.step()) : 0;
    }
  };

  /* ---------- rendering ---------- */
  let sprayIdx = -1, sprayOrder = [];
  let spoilId = null, spoilPick = null, timeId = null, timeMin = 10, noseId = "andro";
  const openStrips = new Set();
  /* the critics' stars: how many of the 1,207 rated reviews in Perfumes: The Guide (2018) got one to five stars */
  const STARS = [98, 489, 389, 212, 19];

  /* a step's heading, the labels of its parts, and a bar of a whole with the share of it that holds something else */
  const head = (n, h, p) => `<div class="lp-head"><p class="lp-step">${esc(t().step(n))}</p><h2>${esc(h)}</h2>${p ? `<p>${esc(p)}</p>` : ""}</div>`;
  const tag = k => `<span class="lp-tag">${esc(t()[k])}</span>`;
  const evidence = text => `<p class="lp-src lp-book">${tag("evTag")}${esc(text)}</p>`;
  const inQuiz = text => `<p class="lp-inquiz">${tag("quizTag")}${esc(text)}</p>`;
  const bar = (share, c1, c2, keys) => `<div class="lp-barwrap" aria-hidden="true" style="--c1:${c1};--c2:${c2}"><div class="lp-bar"><i style="--p:${(share * 100).toFixed(1)}%"></i></div>
      <p class="lp-bar-k"><span class="k1">${esc(keys[0])}</span><span class="k2">${esc(keys[1])}</span></p></div>`;

  function heroHtml() {
    return `<section class="lp-hero" id="lp-hero">
      <div class="lp-hero-text">
        <p class="lp-eyebrow">${esc(t().eyebrow)}</p>
        <h1>${esc(t().h1)}</h1>
        <p class="lp-lede">${esc(t().lede)}</p>
        <a class="btn primary lp-go" href="${esc(QUIZ_HREF())}">${esc(t().start)}</a>
        <p class="lp-under"><span>${esc(t().startNote)}</span> <a href="articles.html">${esc(t().read)}</a></p>
      </div>
      <div class="lp-stage" id="lp-stage">
        <canvas class="lp-mist" id="lp-mist" aria-hidden="true"></canvas>
        <div class="lp-field" id="lp-field" aria-hidden="true"></div>
        <div class="lp-invite" aria-hidden="true"><p>${esc(t().invite)}</p></div>
        <button type="button" class="lp-atomizer" id="lp-atomizer" aria-label="${esc(t().bottleLabel)}">${ATOMIZER}<span class="lp-hint" id="lp-hint">${esc(t().press)}</span></button>
        <div class="lp-caption" id="lp-caption"></div>
        <p class="sr" id="lp-live" aria-live="polite"></p>
      </div>
    </section>`;
  }
  /* test strips: each button carries only the family's name, and the reading opens below it */
  function strips(fams) {
    return `<div class="lp-strips" role="list">${fams.map((f, i) => {
      const F = LD.families[f], on = openStrips.has(f), book = t().matBook[f];
      return `<div class="lp-strip-wrap" role="listitem" style="--i:${i}"><div class="lp-strip${on ? " open" : ""}" style="--c:${color(F.group)}">
          <button type="button" class="lp-strip-btn" data-strip="${f}" aria-expanded="${on}" aria-controls="strip-${f}"><span class="lp-strip-name">${esc(fam(f))}</span><span class="lp-strip-tap" aria-hidden="true">${esc(t().matTap)}</span></button>
          <div class="lp-strip-more" id="strip-${f}"${on ? "" : " hidden"}><span class="lp-strip-hint">${esc(lang === "ar" ? F.hint_ar : F.hint_en)}</span><span class="lp-strip-count">${esc(t().matCount(F.count, LD.total))}</span>${book ? `<span class="lp-strip-book">${esc(book)}</span>` : ""}</div>
        </div></div>`;
    }).join("")}</div>`;
  }
  /* step 1: the families of smells most people like, and how many perfumes carry at least one */
  function likedHtml() {
    const L = LD.facts.liked;
    return `<section class="lp-sec lp-mat" id="lp-mat">${head(1, t().likedH, t().likedLede(L.any, LD.total))}${strips(L.fams)}</section>`;
  }
  /* step 2: the critics' stars */
  function critHtml() {
    const max = Math.max(...STARS);
    return `<section class="lp-sec lp-crit" id="lp-crit">${head(2, t().critH, t().critLede)}
      <div class="lp-crit-body">
        <p class="lp-stat"><b>${esc(t().statBig)}</b><span>${esc(t().statText)}</span></p>
        <ul class="lp-stars">${STARS.map((n, i) => `<li class="s${i + 1}"><span class="sr">${esc(t().starsRow(i + 1, n))}</span><span class="lp-stars-k" aria-hidden="true">${"★".repeat(i + 1)}</span><i aria-hidden="true" style="--w:${((n / max) * 100).toFixed(1)}%"></i><span class="lp-stars-n" aria-hidden="true">${esc(lang === "en" ? fmtEn(n) : n)}</span></li>`).join("")}</ul>
      </div>
      ${evidence(t().critSrc)}
    </section>`;
  }
  /* step 3: one perfume's note list beside its ingredient label, a lovely smell with an unlovely part, and the two
     families of synthetic materials behind common list words */
  function listHtml() {
    const X = LD.example, F = LD.facts.labels, wf = LD.families.white_floral;
    const chip = n => `<span class="lp-note" style="--c:${color(n.g)}"><i></i>${esc(noteWord(n))}</span>`;
    const item = x => `<li${x.hidden ? ' class="hit"' : ""}><b>${esc(t().inciNames[x.inci] || x.raw)}</b><span dir="ltr" lang="en">${esc(x.raw)}</span></li>`;
    return `<section class="lp-sec lp-list" id="lp-list">${head(3, t().listH, t().listLede)}
      <div class="lp-ex lp-label">${tag("exTag")}
        <div class="lp-label-top"><img src="${esc(X.photo)}" alt="" loading="lazy"><div><b>${esc(pname(X))}</b><span>${esc(X.house)}</span></div></div>
        <div class="lp-label-cols">
          <div><h3>${esc(t().labelBox)}</h3><div class="lp-notes">${STAGES.flatMap(st => X.notes[st]).map(chip).join("")}</div></div>
          <div><h3>${esc(t().labelInci)}</h3><ol class="lp-inci">${X.label.map(item).join("")}</ol></div>
        </div>
        <p>${esc(t().labelText(pname(X), F.checked, F.iso_top, F.iso_listed))}</p>
      </div>
      <div class="lp-ex">${tag("exTag")}<p>${esc(t().jasmine)}</p>${bar(.1, color(wf.group), "#5A4A3C", t().jasmineKey)}</div>
      <p class="lp-lead">${esc(t().listFamsLead)}</p>
      ${strips(t().listFams)}
      ${evidence(t().listSrc)}
    </section>`;
  }
  /* step 4: 100 people and one smell; the same dots stay hollow from smell to smell, in an order fixed once */
  const PEOPLE = (() => { let a = 7; return shuffle(Array.from({ length: 100 }, (_, i) => i), () => (a = (a * 16807) % 2147483647) / 2147483647); })();
  const RANK = Object.fromEntries(PEOPLE.map((d, k) => [d, k]));
  function noseHtml() {
    const cases = t().noseCases, c = cases.find(x => x.id === noseId) || cases[cases.length - 1], cannot = 100 - c.can;
    const about = c.about ? t().noseAbout + " " : "";
    return `<section class="lp-sec lp-nose" id="lp-nose">${head(4, t().noseH, t().noseLede)}
      <div class="lp-pills" role="group">${cases.map(x => `<button type="button" aria-pressed="${x.id === c.id}" data-nose="${x.id}" style="--c:${color(x.g)}"><i></i>${esc(x.name)}</button>`).join("")}</div>
      <div class="lp-nose-body">
        <div class="lp-people" role="img" aria-label="${esc(about + t().noseCan(c.can) + ", " + about + t().noseCannot(cannot))}" style="--c:${color(c.g)}">${Array.from({ length: 100 }, (_, d) => `<i class="${RANK[d] < cannot ? "off" : "on"}" style="--k:${RANK[d]}"></i>`).join("")}</div>
        <div class="lp-nose-text">
          <p class="lp-legend"><span class="on" style="--c:${color(c.g)}">${esc(about + t().noseCan(c.can))}</span>${cannot ? `<span class="off">${esc(about + t().noseCannot(cannot))}</span>` : ""}</p>
          <p class="lp-nose-note">${esc(c.note)}</p>
          <p class="lp-nose-critics">${esc(t().noseCritics)}</p>
        </div>
      </div>
      ${evidence(t().noseSrc)}
    </section>`;
  }
  /* a row of perfumes to choose from, one pressed */
  const tabs = (ids, cur, attr) => `<div class="lp-tabs" role="group">${ids.map(id => { const s = byId[id]; return s ? `<button type="button" aria-pressed="${id === cur}" data-${attr}="${id}"><img src="${esc(s.photo)}" alt="" loading="lazy"><span>${esc(pname(s))}</span></button>` : ""; }).join("")}</div>`;
  /* the spoiled note: a result in words, which the stable live region below the sections reads out */
  function spoilText() {
    const s = byId[spoilId] || byId[t().spoilIds[0]];
    const all = STAGES.flatMap(st => s.notes[st].map((n, k) => ({ n, key: st + ":" + k })));
    const pick = all.find(x => x.key === spoilPick);
    if (!pick) return [];
    const F = pick.n.f && LD.families[pick.n.f];
    return [t().spoilResult(noteWord(pick.n), all.length, pname(s))].concat(F ? [t().spoilFamily(fam(pick.n.f), F.count, LD.total)] : []);
  }
  /* step 5: how many perfumes carry a liked family and a spoiling one together, then a perfume to try it on */
  function spoilHtml() {
    const s = byId[spoilId] || byId[t().spoilIds[0]];
    const juice = STAGES.flatMap(st => s.notes[st].map(n => color(n.g)));
    const stops = juice.map((c, i) => `${c} ${Math.round((i / Math.max(1, juice.length - 1)) * 100)}%`).join(", ");
    const lines = spoilText();
    const result = lines.length ? lines.map(l => `<p>${esc(l)}</p>`).join("") + `<p class="lp-result-go"><a class="btn primary" href="${esc(QUIZ_HREF())}">${esc(t().start)}</a></p>` : "";
    const P = LD.facts.pair, n = LD.families[P.like].count;
    return `<section class="lp-sec lp-spoil" id="lp-spoil">${head(5, t().spoilH, t().spoilLede)}
      <div class="lp-ex">${tag("exTag")}<p>${esc(t().pairText(n, P.both))}</p>${bar(P.both / n, color(LD.families[P.like].group), color(LD.families[P.dis].group), t().pairKey(n, P.both))}</div>
      <p class="lp-lead">${esc(t().spoilTry)}</p>
      ${tabs(t().spoilIds, s.id, "spoil")}
      <div class="lp-spoil-body${spoilPick ? " spoiled" : ""}">
        <div class="lp-vial" aria-hidden="true" style="--juice: linear-gradient(180deg, ${stops})"><i class="lp-vial-cap"></i><i class="lp-vial-glass"><i class="lp-vial-juice"></i></i></div>
        <div class="lp-spoil-notes">
          <p class="lp-small">${esc(t().spoilPick)}</p>
          ${STAGES.map(st => `<div class="lp-row"><span class="lp-row-k">${esc(t().rowStage[st])}</span><div class="lp-chips">${s.notes[st].map((n, k) => { const key = st + ":" + k; return `<button type="button" class="lp-chip${key === spoilPick ? " bad" : ""}" data-note="${key}" aria-pressed="${key === spoilPick}" style="--c:${color(n.g)}"><i></i>${esc(noteWord(n))}</button>`; }).join("")}</div></div>`).join("")}
          <div class="lp-result">${result}</div>
        </div>
      </div>
      ${inQuiz(t().spoilQuiz)}
      ${evidence(t().spoilBook)}
    </section>`;
  }
  /* step 6: a scent few dislike beside one a few love */
  function loveHtml() {
    return `<section class="lp-sec lp-love" id="lp-love">${head(6, t().loveH, t().loveLede)}
      <div class="lp-pair">${t().loveCards.map(([h, p], i) => `<div class="lp-paircard${i ? " loved" : ""}"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("")}</div>
      ${inQuiz(t().loveQuiz)}
      ${evidence(t().loveSrc)}
    </section>`;
  }
  /* step 7: the stage a time falls in, the first twenty minutes, then to three hours, then later */
  const stageAt = m => (m < 20 ? "opening" : m < 180 ? "heart" : "drydown");
  const nowHtml = m => `${esc(t().timeNow(m))} · ${esc(t().timeIn)}: <b>${esc(t().timeStage[stageAt(m)])}</b>`;
  function timeHtml() {
    const s = byId[timeId] || byId[t().timeIds[0]], cur = stageAt(timeMin);
    return `<section class="lp-sec lp-time" id="lp-time">${head(7, t().timeH, t().timeLede)}
      ${tabs(t().timeIds, s.id, "time")}
      <div class="lp-clock">
        <label class="sr" for="lp-range">${esc(t().timeSlider)}</label>
        <input type="range" id="lp-range" min="0" max="480" step="5" value="${timeMin}" aria-valuetext="${esc(t().timeNow(timeMin))}" style="--p:${(timeMin / 480) * 100}%">
        <div class="lp-ticks" aria-hidden="true">${[0, 2, 4, 6, 8].map(h => `<span>${h ? esc(t().tick(h)) : "0"}</span>`).join("")}</div>
        <p class="lp-now" id="lp-now">${nowHtml(timeMin)}</p>
      </div>
      <div class="lp-stages">${STAGES.map(st => `<div class="lp-stagecard${st === cur ? " on" : ""}" data-st="${st}">
          <h3>${esc(t().timeStage[st])}</h3>
          <ul class="lp-bars">${s.stages[st].map(([f, w]) => `<li><span>${esc(fam(f))}</span><i style="--w:${Math.round(w * 100)}%;--c:${color(LD.families[f] ? LD.families[f].group : null)}"></i></li>`).join("")}</ul>
          <p class="lp-small"><b>${esc(t().timeNotes)}:</b> ${esc(s.notes[st].map(noteWord).join(lang === "ar" ? "، " : ", "))}</p>
        </div>`).join("")}</div>
      ${inQuiz(t().timeQuiz)}
      ${evidence(t().timeBook)}
    </section>`;
  }
  function quizHtml() {
    return `<section class="lp-sec lp-quiz" id="lp-quiz">
      <div class="lp-head"><h2>${esc(t().quizH)}</h2><p>${esc(t().quizLede)}</p></div>
      <ol class="lp-steps">${t().quizSteps.map(([h, p], i) => `<li><b>${i + 1}</b><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></li>`).join("")}</ol>
      <div class="lp-gets"><h3>${esc(t().getH)}</h3><ul>${t().gets.map(([h, p]) => `<li><b>${esc(h)}</b><span>${esc(p)}</span></li>`).join("")}</ul></div>
      <a class="btn primary lp-go" href="${esc(QUIZ_HREF())}">${esc(t().start)}</a>
    </section>`;
  }
  function artsHtml() {
    return `<section class="lp-sec lp-arts" id="lp-arts">
      <div class="lp-head"><h2>${esc(t().artH)}</h2></div>
      <div class="lp-cards">${t().arts.map(([id, h, p]) => `<a class="lp-card" href="articles.html#${id}"><h3>${esc(h)}</h3><p>${esc(p)}</p><span>${esc(t().artGo)}</span></a>`).join("")}</div>
    </section>`;
  }
  function footHtml() {
    const d = CONFIG.disclosure && CONFIG.disclosure[lang];
    return `<footer class="foot"><nav class="footnav"><a href="${esc(QUIZ_HREF())}">${esc(t().navQuiz)}</a><a href="${esc(withEndpoint("profile.html"))}">${esc(t().navProfiler)}</a><a href="articles.html">${esc(t().navArticles)}</a></nav>${t().foot}${d ? `<p>${esc(d)}</p>` : ""}</footer>`;
  }

  function chrome() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    $("lang-en").setAttribute("aria-pressed", lang === "en"); $("lang-ar").setAttribute("aria-pressed", lang === "ar");
    $("brand").innerHTML = esc(t().brand) + "<small>" + esc(t().tagline) + "</small>";
    $("brand").setAttribute("href", withEndpoint("index.html"));
    $("nav-quiz").textContent = t().navQuiz; $("nav-quiz").setAttribute("href", QUIZ_HREF());
    $("nav-profiler").textContent = t().navProfiler; $("nav-profiler").setAttribute("href", withEndpoint("profile.html"));
    $("nav-articles").textContent = t().navArticles;
  }
  function render() {
    chrome();
    host.innerHTML = heroHtml() + likedHtml() + critHtml() + listHtml() + noseHtml() + spoilHtml() + loveHtml() + timeHtml() + quizHtml() + artsHtml() + footHtml() +
      `<p class="sr" id="lp-spoil-live" aria-live="polite"></p>`;
    mist.canvas = $("lp-mist"); mist.ctx = mist.canvas.getContext ? mist.canvas.getContext("2d") : null; mist.parts = []; mist.size();
    if (sprayIdx >= 0) showSpray(false);
    reveal();
    if (booted) autoSpray();
  }

  /* ---------- spraying ---------- */
  function nextSpray() {
    if (!sprayOrder.length) sprayOrder = shuffle(LD.sprays.map((s, i) => i), Math.random);
    sprayIdx = sprayOrder.shift();
    return LD.sprays[sprayIdx];
  }
  /* The notes of the current spray in three rows. fly: they rise from the nozzle (measured after layout, then eased
     into place); without it, or without motion, they simply appear. */
  function showSpray(fly) {
    const s = LD.sprays[sprayIdx], field = $("lp-field"), cap = $("lp-caption"), stage = $("lp-stage");
    if (!s || !field) return;
    field.innerHTML = STAGES.map(st => `<div class="lp-frow"><span class="lp-frow-k">${esc(t().rowStage[st])}</span><div class="lp-fnotes">${s.notes[st].map(n => `<span class="lp-fnote" style="--c:${color(n.g)}"><i></i>${esc(noteWord(n))}</span>`).join("")}</div></div>`).join("");
    fitField(field, stage);
    cap.innerHTML = `<img src="${esc(s.photo)}" alt=""><div><b>${esc(t().sprayed(s.house, pname(s)))}</b><span>${esc(t().sprayedNote)} ${esc(t().pressAgain)}.</span></div>`;
    cap.classList.add("on"); stage.classList.add("sprayed");
    /* the liquid shows the perfume's stages, top to bottom, as a hint of their strongest families on warm amber */
    const jstops = stage.querySelectorAll ? stage.querySelectorAll(".lp-jstop") : [];
    STAGES.forEach((st, i) => { const f = (s.stages[st][0] || [])[0], g = f && LD.families[f] ? LD.families[f].group : null; if (jstops[i]) jstops[i].style.stopColor = tint(color(g), .32, ["#F7C66B", "#E8903A", "#C4506F"][i]); });
    $("lp-live").textContent = t().sprayedLive(s.house, pname(s), STAGES.map(st => t().rowStage[st] + ": " + s.notes[st].map(noteWord).join(", ")).join(". "));
    if (!fly || !motion() || !field.querySelectorAll || !stage.getBoundingClientRect) return;
    const nz = nozzle(), box = stage.getBoundingClientRect();
    let k = 0;
    /* each row's label arrives with its row */
    field.querySelectorAll(".lp-frow-k").forEach((el, ri) => {
      el.style.transition = "none"; el.style.opacity = "0";
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = `opacity .5s ease ${(2 - ri) * 110 + 250}ms`; el.style.opacity = "1"; }));
    });
    field.querySelectorAll(".lp-fnote").forEach(el => {
      const r = el.getBoundingClientRect(), dx = nz.x - (r.left - box.left + r.width / 2), dy = nz.y - (r.top - box.top + r.height / 2);
      el.style.transition = "none"; el.style.opacity = "0"; el.style.transform = `translate(${dx}px, ${dy}px) scale(.3)`;
      const row = el.closest(".lp-frow"), ri = [...field.children].indexOf(row);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = ""; el.style.transitionDelay = `${(2 - ri) * 110 + (k++) * 45}ms`;
        el.style.opacity = "1"; el.style.transform = "";
      }));
    });
  }
  /* The notes must stay inside the arch. A long list can reach its curve on a narrow screen, so the chips shrink one
     step at a time until every chip and row label lies inside it. The arch is measured as the browser draws it: radii
     too large for the box are scaled down together, as CSS requires. */
  function fitField(field, stage) {
    field.classList.remove("dense", "denser");
    if (!stage || !stage.getBoundingClientRect || !field.querySelectorAll || !window.getComputedStyle) return;
    const inside = () => {
      const s = stage.getBoundingClientRect(), cs = window.getComputedStyle(stage);
      const rad = v => { const [a, b] = String(v || "0").split(" ").map(parseFloat); return [a || 0, isNaN(b) ? a || 0 : b]; };
      const [tlx, tly] = rad(cs.borderTopLeftRadius), [trx, tr_y] = rad(cs.borderTopRightRadius), [blx, bly] = rad(cs.borderBottomLeftRadius), [brx, bry] = rad(cs.borderBottomRightRadius);
      const k = Math.min(1, s.width / (tlx + trx || 1), s.width / (blx + brx || 1), s.height / (tly + bly || 1), s.height / (tr_y + bry || 1));
      const rx = tlx * k, ry = tly * k;
      for (const el of field.querySelectorAll(".lp-fnote, .lp-frow-k")) {
        const r = el.getBoundingClientRect(), ly = r.top - s.top - 3;
        if (ly < 0) return false;
        for (const x of [r.left - s.left, r.right - s.left]) {
          if (ly >= ry) continue;
          const cx = Math.min(Math.max(x, rx), s.width - rx), dx = (x - cx) / rx, dy = (ly - ry) / ry;
          if (dx * dx + dy * dy > 1) return false;
        }
      }
      return true;
    };
    for (const c of ["dense", "denser"]) { if (inside()) return; field.classList.add(c); }
  }
  function nozzle() {
    const stage = $("lp-stage"), n = $("lp-nozzle");
    const b = stage.getBoundingClientRect(), r = n.getBoundingClientRect();
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
  }
  function spray() {
    const s = nextSpray(), stage = $("lp-stage");
    if (!stage) return;
    if (motion() && mist.ctx && stage.getBoundingClientRect) {
      const nz = nozzle(), a = lang === "ar" ? Math.PI + .62 : -.62;
      const cols = [...new Set(STAGES.flatMap(st => s.notes[st].map(n => color(n.g))))];
      mist.burst(nz.x, nz.y, a, cols.length ? cols : ["#E8903A"]);
    }
    showSpray(true);
  }
  /* the squeeze as a picture only: it shows while a finger or the mouse is down, and for a moment after a key */
  const squeeze = on => { const st = $("lp-stage"); if (st) st.classList.toggle("pressed", on); };

  /* sections fade up as they come into view; without IntersectionObserver or motion they are simply there */
  let io = null;
  function reveal() {
    const els = host.querySelectorAll ? host.querySelectorAll(".lp-sec") : [];
    if (!motion() || !("IntersectionObserver" in window)) { els.forEach(el => el.classList.add("seen")); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("seen"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
    els.forEach(el => io.observe(el));
  }

  /* ---------- events ----------
     The bottle sprays on a completed press (a click, which a tap, the mouse and Enter or Space all give), so a finger
     that starts a scroll on the bottle does not spray. */
  host.addEventListener("pointerdown", e => {
    if (!e.target.closest || !e.target.closest("#lp-atomizer") || e.button !== 0) return;
    if (e.pointerType === "mouse") e.preventDefault();
    squeeze(true);
  });
  document.addEventListener("pointerup", () => squeeze(false));
  document.addEventListener("pointercancel", () => squeeze(false));
  host.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const d = b.dataset;
    if (b.id === "lp-atomizer") { if (e.detail === 0) { squeeze(true); setTimeout(() => squeeze(false), 160); } spray(); return; }
    if (d.strip) { if (openStrips.has(d.strip)) openStrips.delete(d.strip); else openStrips.add(d.strip); const own = LD.facts.liked.fams.includes(d.strip); swap(own ? "lp-mat" : "lp-list", own ? likedHtml : listHtml, `[data-strip="${d.strip}"]`); return; }
    if (d.spoil) { spoilId = d.spoil; spoilPick = null; swap("lp-spoil", spoilHtml, `[data-spoil="${d.spoil}"]`); announce(); return; }
    if (d.note) { spoilPick = spoilPick === d.note ? null : d.note; swap("lp-spoil", spoilHtml, `[data-note="${d.note}"]`); announce(); return; }
    if (d.time) { timeId = d.time; swap("lp-time", timeHtml, `[data-time="${d.time}"]`); return; }
    if (d.nose) { noseId = d.nose; swap("lp-nose", noseHtml, `[data-nose="${d.nose}"]`); return; }
  });
  /* the spoiled note's result, read out from a live region that is never redrawn */
  function announce() { const live = $("lp-spoil-live"); if (live) live.textContent = spoilText().join(" "); }
  host.addEventListener("input", e => {
    if (e.target.id !== "lp-range") return;
    timeMin = +e.target.value;
    e.target.style.setProperty("--p", (timeMin / 480) * 100 + "%");
    e.target.setAttribute("aria-valuetext", t().timeNow(timeMin));
    const cur = stageAt(timeMin);
    $("lp-now").innerHTML = nowHtml(timeMin);
    host.querySelectorAll(".lp-stagecard").forEach(c => c.classList.toggle("on", c.dataset.st === cur));
  });
  /* redraw one section in place, keeping it revealed, and keep focus on the control that was used */
  function swap(id, html, focusSel) {
    const old = $(id); if (!old) return;
    const tmp = document.createElement("div"); tmp.innerHTML = html();
    const el = tmp.firstElementChild; el.classList.add("seen"); old.replaceWith(el);
    const f = focusSel ? el.querySelector(focusSel) : null; if (f) f.focus({ preventScroll: true });
  }
  $("lang-en").addEventListener("click", () => { lang = "en"; store.set("pp_lang", lang); render(); });
  $("lang-ar").addEventListener("click", () => { lang = "ar"; store.set("pp_lang", lang); render(); });
  if (window.addEventListener) window.addEventListener("resize", () => { mist.size(); if (sprayIdx >= 0) fitField($("lp-field"), $("lp-stage")); });

  /* one spray on its own once the bottle is well in view, so the page shows what it does; a visitor who presses
     first skips it (on a phone the bottle sits below the promise, so this waits for the scroll) */
  let autoIo = null, booted = false;
  function autoSpray() {
    if (autoIo) { autoIo.disconnect(); autoIo = null; }
    if (sprayIdx >= 0) return;
    const go = () => { if (sprayIdx >= 0 || document.visibilityState === "hidden") return; squeeze(true); spray(); setTimeout(() => squeeze(false), 220); };
    const st = $("lp-stage"); if (!st) return;
    if (!("IntersectionObserver" in window)) { setTimeout(go, 1400); return; }
    autoIo = new IntersectionObserver(es => { if (es.some(e => e.intersectionRatio >= .6)) { autoIo.disconnect(); autoIo = null; setTimeout(go, 700); } }, { threshold: [.6] });
    autoIo.observe(st);
  }
  render();
  booted = true;
  autoSpray();
})();
