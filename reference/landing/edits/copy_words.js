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
      h1: "Rose, vanilla, bergamot and sandalwood all smell lovely. So why do so few perfumes suit you?",
      lede: "Nearly every perfume has notes you like, so those notes cannot be the reason so few suit you. The reason is often one material you cannot stand. Here is how that works, in seven short steps, each with an example and its source.",
      start: "Start the quiz", read: "Read the articles", startNote: "Four short parts. No sign-up.",
      press: "Press the bulb", pressAgain: "Press again for another perfume",
      invite: "Press the rubber bulb to spray one of the quiz's perfumes and watch its notes rise.",
      bottleLabel: "Perfume atomizer. Press to spray one of the quiz's twenty perfumes and see its notes.",
      sprayed: (house, name) => `${house} · ${name}`,
      sprayedNote: "One of the twenty perfumes in the quiz, with its listed notes.",
      sprayedLive: (house, name, rows) => `Sprayed ${house} ${name}. ${rows}`,
      step: n => `Step ${n}`, exTag: "Example", evTag: "Evidence", quizTag: "In the quiz",

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
      spoilQuiz: "The quiz looks for what the perfumes that turned on you have in common, and keeps it out of your picks.",
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
      timeQuiz: "The quiz asks when a perfume bothered you: in the first minutes, the first hours or hours later.",
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
      h1: "الورد والفانيلا والبرغموت والصندل كلها روائح جميلة، فلماذا لا يناسبك من العطور إلا القليل؟",
      lede: "كل العطور تقريباً فيها نوتات تعجبك، فليست هذه النوتات سبب قلّة ما يناسبك منها. وكثيراً ما يكون السبب مادة واحدة لا تطيقها. وإليك ذلك في سبع خطوات قصيرة، مع مثال ومصدر لكل خطوة.",
      start: "ابدأ الاختبار", read: "اقرأ المقالات", startNote: "أربعة أجزاء قصيرة، بلا تسجيل.",
      press: "اضغط على الكرة", pressAgain: "اضغط مرة أخرى لعطر آخر",
      invite: "اضغط على الكرة المطاطية لترشّ أحد عطور الاختبار وتظهر لك نوتاته.",
      bottleLabel: "بخّاخ عطر. اضغط لترشّ أحد العطور العشرين في الاختبار وترى نوتاته.",
      sprayed: (house, name) => `${house} · ${name}`,
      sprayedNote: "أحد العطور العشرين في الاختبار، بنوتاته المعلنة.",
      sprayedLive: (house, name, rows) => `رششت ${name} من ${house}. ${rows}`,
      step: n => "الخطوة " + ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة"][n - 1],
      exTag: "مثال", evTag: "الشواهد", quizTag: "في الاختبار",

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
      spoilQuiz: "يبحث الاختبار عمّا تشترك فيه العطور التي انقلبت عليك، ويستبعده من ترشيحاتك.",
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
      timeQuiz: "يسألك الاختبار متى أزعجك العطر: في الدقائق الأولى، أم في الساعات الأولى، أم بعد ساعات.",
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
