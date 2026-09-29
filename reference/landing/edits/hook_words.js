  /* Arabic counted nouns: 1 and 2 have their own forms, 3 to 10 take the plural, 11 and more the singular */
  const arCount = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`);
  /* the word "perfume" after a number in Arabic, where the last two digits decide: 1000 عطر, 1207 عطور, 427 عطراً */
  const arNoun = n => { const r = n % 100; return r === 0 || (n > 100 && r <= 2) ? "عطر" : r <= 10 ? "عطور" : "عطراً"; };
  const arPerfumes = n => (n === 1 ? "عطر واحد" : n === 2 ? "عطران" : `${n} ${arNoun(n)}`);
  const fmtEn = n => Number(n).toLocaleString("en-US");

  /* ---------- words ----------
     Each section answers the question the one before it leaves open, and ends on the next question: the 1,000-perfume
     test (what you like barely narrows the choice; one dislike does), the box turned round (the label names what the
     note list leaves out), the nose (a third of people cannot smell a common musk), one note (the note you hate
     outweighs the rest), the rare ones (critics' stars; the quiz learns from what you kept) and the day of wear.
     Figures from the catalogue and the labels come from js/landing-data.js; figures from the books are written here,
     with their sources in each section's folded Sources. */
  const T = PAGE.words({
    en: {
      navQuiz: "The quiz", navProfiler: "Your profile",
      eyebrow: "The perfume quiz that starts with what you can't stand",
      h1: "One note can ruin a perfume for you. Find out which.",
      lede: "Rose, vanilla, sandalwood: you probably like them all, yet few perfumes that list them end up suiting you. In four quick parts, the quiz finds the note behind that, then the scents you'll love.",
      start: "Find your deal-breakers", startNote: "Four quick parts. No sign-up.", down: "See how it works",
      press: "Press the bulb", pressAgain: "Press again for another perfume",
      invite: "Press the rubber bulb to spray one of the quiz's perfumes and watch its notes rise.",
      bottleLabel: "Perfume atomizer. Press to spray one of the quiz's twenty perfumes and see its notes.",
      sprayed: (house, name) => `${house} · ${name}`,
      sprayedNote: "One of the twenty perfumes in the quiz, with its listed notes.",
      sprayedLive: (house, name, rows) => `Sprayed ${house} ${name}. ${rows}`,
      srcTag: "Sources", quizTag: "How the quiz uses this",

      testKick: "Try it",
      testH: "What you like barely narrows down 1,000 perfumes. Watch what one dislike does.",
      testLike: "1. Tap the smells you like",
      testHate: "2. Now tap one smell you can't stand",
      testNames: { rose: "Rose", white_floral: "White flowers", citrus_fresh: "Citrus", spicy_warm: "Warm spices", sandalwood_creamy: "Sandalwood",
        vanilla_gourmand: "Vanilla", amber_resin: "Resin amber", woody_amber: "Woody amber", white_musk: "Clean musk", patchouli: "Patchouli",
        oud_smoky: "Smoky oud", leather_smoky: "Leather", iris_powdery: "Powdery iris", aquatic_marine: "Marine notes", incense_resin: "Incense" },
      testAll: () => "perfumes in our catalogue",
      testLiked: () => "have something you like",
      testLeft: (n, name) => `left without ${name.toLowerCase()}`,
      testVerdict: (a, b) => `${a ? `Your likes ruled out ${fmtEn(a)}.` : "Your likes ruled out none."} One dislike ruled out ${fmtEn(b)}.`,
      testWhy: "That's why the quiz starts with what you can't stand.",
      testGo: "Find yours",
      testNext: "So how does a smell you can't stand get into a perfume whose box lists only lovely ones?",
      testSrc: "Counts from our catalogue of 1,000 perfumes. A perfume counts for a family when that family is clearly present in at least one of its stages.",

      listKick: "Turn the box around",
      listH: "The box says jasmine and vanilla. The label says Iso E Super.",
      listLede: name => `${name} by Parfums de Marly lists nine notes, from bergamot to vanilla. Turn the box around and read its ingredient label.`,
      boxOn: "On the box", labelOn: "On the label, first five ingredients",
      flip: "Turn it around", flipBack: "Back to the box",
      inciNames: { "alcohol denat.": "alcohol", parfum: "fragrance", aqua: "water", "tetramethyl acetyloctahydronaphthalenes": "Iso E Super", hexamethylindanopyran: "Galaxolide" },
      labelHidden: "Two synthetic materials near the top. The note list names neither.",
      labelCount: (checked, iso, listed) => `${iso} of the ${checked} Parfums de Marly labels we checked list Iso E Super among the first five ingredients. ${listed ? `Only ${listed} of their note lists mention it.` : "None of their note lists mentions it."}`,
      jasmine: "Even real jasmine is up to a tenth indole. On its own, indole smells like mothballs.",
      listNext: "The strange part: about 1 in 3 people can't smell the musk on that label at all. Are you one of them?",
      listSrc: "Labels: the ingredient lists on the Parfums de Marly website, September 2026. Iso E Super is a synthetic woody material and Galaxolide a synthetic musk. Jasmine and indole: McGee, Nose Dive (2020).",

      noseKick: "Your nose",
      noseH: "About 1 in 3 people can't smell this musk.",
      noseLede: "It's Galaxolide, the musk on that label, and clean musks like it are in nearly half of our 1,000 perfumes. Tap a smell and watch 100 people split.",
      noseCases: [
        { id: "banana", name: "Banana", can: 99, about: true, note: "Everyone smells this one, except the 1 in 100 who can't smell anything at all.", g: "fresh" },
        { id: "clove", name: "Clove", can: 99, about: true, note: "Everyone smells this one too, except the 1 in 100 who can't smell anything at all.", g: "spiced" },
        { id: "musk", name: "Clean musk", can: 67, about: true, note: "About 1 in 3 miss it completely. To them, a perfume built on it smells much weaker than it is.", g: "musk" },
        { id: "andro", name: "Androstenone", can: 67, about: true, note: "Most people who smell it say urine. Some say sweet flowers. About 1 in 3 smell nothing.", g: "amber" }
      ],
      noseCan: n => `${n} can smell it`, noseCannot: n => `${n} cannot`, noseAbout: "about",
      noseCritics: "Even two top critics split: Luca Turin found Mr. Burberry loud; Tania Sanchez found it quiet, because she couldn't smell one of its main materials.",
      noseNext: "So what happens when the one note you can't stand is in the bottle?",
      noseSrc: "Survey: the National Geographic Smell Survey, as reported in Ohloff and others, Scent and Chemistry (2022). About 400 kinds of smell receptor, with genes that vary between people: McGee, Nose Dive (2020); Gilbert, What the Nose Knows (2008). The critics: Turin and Sanchez, Perfumes: The Guide (2018).",

      spoilKick: "One note",
      spoilH: "Pick the note you'd hate. However good the rest, the perfume is out.",
      spoilLede: "Choose one of the quiz's perfumes, then tap the note you'd least want to smell.",
      spoilPick: "Tap the note you'd mind most",
      spoilResult: (note, n, name) => `"${note.charAt(0).toUpperCase() + note.slice(1)}" is 1 of ${n} notes in ${name}. If it's the one you can't stand, the other ${n - 1} won't make up for it.`,
      spoilFamily: (fam, n, total) => `It belongs to ${fam}, clearly present in ${fmtEn(n)} of our ${fmtEn(total)} perfumes.`,
      spoilIds: ["khamrah", "yara", "sauvageedp", "br540"],
      spoilFact: "In a classic test, a lipstick scent most testers liked was rejected once a touch of civet was added.",
      spoilQuiz: "It looks for what the perfumes that turned on you have in common, and keeps that out of your picks.",
      spoilNext: "Knowing what you hate is half of it. The other half is rarer than you'd think.",
      spoilSrc: "The lipstick test: Jellinek, The Psychological Basis of Perfumery (1997), p. 134. Critics calling good perfumes \"marred\" by one material, often a woody amber: Turin and Sanchez, Perfumes: The Guide (2018). People rarely buy an everyday product for its scent, yet may well reject one whose scent they dislike: Calkin and Jellinek, Perfumery: Practice and Principles (1994), p. 148.",

      critKick: "The rare ones",
      critH: "Two critics smelled 1,207 perfumes. They gave five stars to 19.",
      statBig: "Nearly half", statText: "got one or two stars out of five.",
      starsRow: (k, n) => `${k} star${k > 1 ? "s" : ""}: ${fmtEn(n)} perfumes`,
      critLove: "A perfume you love is rare. So the quiz learns most from the ones you still use, not the ones that only smelled nice.",
      critNext: "One more thing you can't judge in a shop: how it smells hours later.",
      critSrc: "Star counts of all 1,207 rated reviews in Turin and Sanchez, Perfumes: The Guide (2018).",

      timeKick: "Over the day",
      timeH: "What you smell in the shop is gone within the hour.",
      timeLede: "The first notes fade in minutes, the heart lasts a few hours, and the base many more. Slide through a day and watch the perfume change.",
      timeFact: "Some perfumes are built to smell great only for the few minutes you spend deciding at the counter.",
      timeQuiz: "So it asks when a perfume turned on you: in the first minutes, the first hours or hours later.",
      timeNext: "Ready to find what spoils perfumes for you?",
      timeSrc: "Top notes fade within minutes to an hour, heart notes last from about an hour to a few hours, and base notes for many hours: McGee, Nose Dive (2020). Perfumes made to smell good only for the minutes at the counter: Turin and Sanchez, Perfumes: The Guide (2018).",
      timeSlider: "Time since you put it on",
      timeNow: m => (m === 0 ? "At the first spray" : m < 60 ? `${m} minutes in` : `${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " min" : ""} in`),
      timeIn: "Stage", tick: h => `${h} h`,
      timeStage: { opening: "First minutes", heart: "First hours", drydown: "Hours later" },
      timeIds: ["sauvageedp", "libre", "khamrah", "adgedt"],
      timeNotes: "Listed notes",

      quizH: "Four quick parts, and you'll know what to avoid and what to try.",
      quizLede: "It learns first from the perfumes you've tried, then from what you say about notes.",
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
      eyebrow: "الاختبار الذي يبدأ بما لا تطيقه",
      h1: "نوتة واحدة قد تفسد عليك العطر كله. اعرف أيّها.",
      lede: "الورد والفانيلا والصندل تعجبك غالباً، ومع ذلك قليلة هي العطور التي تذكرها ثم تناسبك. في أربعة أجزاء سريعة يكشف لك الاختبار النوتة التي وراء ذلك، ثم الروائح التي ستعشقها.",
      start: "اكتشف ما يفسد العطر عليك", startNote: "أربعة أجزاء سريعة، بلا تسجيل.", down: "شاهد كيف يعمل",
      press: "اضغط على الكرة", pressAgain: "اضغط مرة أخرى لعطر آخر",
      invite: "اضغط على الكرة المطاطية لترشّ أحد عطور الاختبار وتظهر لك نوتاته.",
      bottleLabel: "بخّاخ عطر. اضغط لترشّ أحد العطور العشرين في الاختبار وترى نوتاته.",
      sprayed: (house, name) => `${house} · ${name}`,
      sprayedNote: "أحد العطور العشرين في الاختبار، بنوتاته المعلنة.",
      sprayedLive: (house, name, rows) => `رششت ${name} من ${house}. ${rows}`,
      srcTag: "المصادر", quizTag: "كيف يستفيد الاختبار من ذلك",

      testKick: "جرّبها",
      testH: "ما تحبه لا يكاد يقلّص 1000 عطر. انظر ماذا تفعل رائحة واحدة لا تطيقها.",
      testLike: "1. اختر الروائح التي تحبها",
      testHate: "2. والآن اختر رائحة واحدة لا تطيقها",
      testNames: { rose: "الورد", white_floral: "الزهور البيضاء", citrus_fresh: "الحمضيات", spicy_warm: "التوابل الدافئة", sandalwood_creamy: "الصندل",
        vanilla_gourmand: "الفانيلا", amber_resin: "العنبر الراتنجي", woody_amber: "الخشب العنبري", white_musk: "المسك النظيف", patchouli: "الباتشولي",
        oud_smoky: "العود المدخّن", leather_smoky: "الجلد", iris_powdery: "السوسن البودري", aquatic_marine: "النفحات البحرية", incense_resin: "البخور" },
      testAll: n => `${arNoun(n)} في قائمتنا`,
      testLiked: n => `${arNoun(n)} فيها شيء تحبه`,
      testLeft: (n, name) => `${arNoun(n)} خالية من ${name}`,
      testVerdict: (a, b) => `${a ? `ما تحبه استبعد ${arPerfumes(a)} فقط،` : "ما تحبه لم يستبعد أيّ عطر،"} ورائحة واحدة لا تطيقها استبعدت ${arPerfumes(b)}.`,
      testWhy: "لهذا يبدأ الاختبار بما لا تطيقه.",
      testGo: "اكتشف ما لا تطيقه",
      testNext: "فكيف تدخل رائحة لا تطيقها عطراً لا تذكر علبته إلا الروائح الجميلة؟",
      testSrc: "الأرقام من قائمتنا التي تضم 1000 عطر: يُحسب العطر لعائلة ما حين تظهر فيه بوضوح في مرحلة واحدة على الأقل من مراحله.",

      listKick: "اقلب العلبة",
      listH: "العلبة تقول ياسمين وفانيلا. والملصق يقول إيزو إي سوبر.",
      listLede: name => `عطر ${name} من دار بارفيوم دي مارلي يذكر تسع نوتات، من البرغموت إلى الفانيلا. اقلب العلبة واقرأ ملصق مكوناته.`,
      boxOn: "على العلبة", labelOn: "على الملصق: أول خمسة مكونات",
      flip: "اقلب العلبة", flipBack: "أعدها",
      inciNames: { "alcohol denat.": "كحول", parfum: "عطر", aqua: "ماء", "tetramethyl acetyloctahydronaphthalenes": "إيزو إي سوبر", hexamethylindanopyran: "غالاكسوليد" },
      labelHidden: "مادتان صناعيتان في أول القائمة، ولا تذكر قائمة النوتات أيّاً منهما.",
      labelCount: (checked, iso, listed) => `في ${iso} من ${arCount(checked, "ملصق واحد", "ملصقين", "ملصقات", "ملصقاً")} راجعناها لهذه الدار يأتي إيزو إي سوبر بين أول خمسة مكونات. ${listed ? `ولا تذكره إلا قوائم نوتات ${listed} منها.` : "ولا تذكره قائمة نوتات أيّ منها."}`,
      jasmine: "حتى الياسمين الطبيعي قد يكون عُشر رائحته إندولاً، والإندول وحده رائحته كحبوب النفتالين.",
      listNext: "والأغرب أن نحو ثلث الناس لا يشمّون المسك المذكور في هذا الملصق أصلاً. هل أنت منهم؟",
      listSrc: "الملصقات: قوائم المكونات على موقع Parfums de Marly، سبتمبر 2026. إيزو إي سوبر مادة خشبية صناعية، وغالاكسوليد مسك صناعي. الياسمين والإندول: ماكغي، «الغوص بالأنف» (2020).",

      noseKick: "أنفك",
      noseH: "نحو ثلث الناس لا يشمّون هذا المسك.",
      noseLede: "إنه غالاكسوليد، المسك المذكور في ذلك الملصق، والمسك النظيف مثله موجود في قرابة نصف عطور قائمتنا الألف. اختر رائحة وشاهد كيف ينقسم 100 شخص.",
      noseCases: [
        { id: "banana", name: "الموز", can: 99, about: true, note: "يشمّها الجميع، إلا واحداً من كل مئة فقد حاسة الشم كلها.", g: "fresh" },
        { id: "clove", name: "القرنفل", can: 99, about: true, note: "ويشمّها الجميع أيضاً، إلا واحداً من كل مئة فقد حاسة الشم كلها.", g: "spiced" },
        { id: "musk", name: "المسك النظيف", can: 67, about: true, note: "نحو الثلث لا يشمّونه أبداً، فيبدو لهم العطر المبني عليه أضعف كثيراً مما هو.", g: "musk" },
        { id: "andro", name: "الأندروستينون", can: 67, about: true, note: "أكثر من يشمّه يقول إن رائحته كالبول، وبعضهم يقول زهور حلوة، ونحو الثلث لا يشمّ شيئاً.", g: "amber" }
      ],
      noseCan: n => `${n} يشمّونها`, noseCannot: n => (n === 1 ? "واحد لا يشمّها" : `${n} لا يشمّونها`), noseAbout: "نحو",
      noseCritics: "حتى ناقدان كبيران اختلفا: وجد لوكا تورين عطر «مستر بربري» قوياً جداً، ووجدته تانيا سانشيز هادئاً، لأنها لا تشمّ إحدى مواده الرئيسية.",
      noseNext: "فماذا يحدث حين تكون الرائحة الوحيدة التي لا تطيقها في الزجاجة؟",
      noseSrc: "المسح: مسح ناشيونال جيوغرافيك للشم، كما نقله أولوف وآخرون في «الرائحة والكيمياء» (2022). نحو 400 نوع من مستقبلات الشم تختلف جيناتها بين الناس: ماكغي، «الغوص بالأنف» (2020)؛ غيلبرت، «ما يعرفه الأنف» (2008). الناقدان: تورين وسانشيز، «العطور: الدليل» (2018).",

      spoilKick: "نوتة واحدة",
      spoilH: "اختر النوتة التي تكرهها. مهما كان الباقي جميلاً، يخرج العطر من حسابك.",
      spoilLede: "اختر عطراً من عطور الاختبار، ثم اضغط على النوتة التي لا تريد أن تشمّها.",
      spoilPick: "اضغط على النوتة التي تزعجك أكثر من غيرها",
      spoilResult: (note, n, name) => `«${note}» واحدة من ${arCount(n, "نوتة واحدة", "نوتتين", "نوتات", "نوتة")} في ${name}. فإن كانت هي ما لا تطيقه، فلن يعوّضك عنها الباقي.`,
      spoilFamily: (fam, n, total) => `وهي من عائلة ${fam}، وتظهر بوضوح في ${n} من ${arPerfumes(total)} في قائمتنا.`,
      spoilIds: ["khamrah", "yara", "sauvageedp", "br540"],
      spoilFact: "في اختبار قديم، استحسن أكثر المختبرين رائحة لأحمر الشفاه، ثم رفضوها حين أُضيفت إليها لمسة من الزباد.",
      spoilQuiz: "يبحث عمّا تشترك فيه العطور التي انقلبت عليك، ويستبعده من ترشيحاتك.",
      spoilNext: "هذا نصف ما يبحث عنه الاختبار. والنصف الآخر أندر مما تظن.",
      spoilSrc: "اختبار أحمر الشفاه: يلينك، «الأساس النفسي لصناعة العطور» (1997)، ص 134. نقاد يصفون عطوراً جيدة أفسدتها مادة واحدة، كثيراً ما تكون خشباً عنبرياً: تورين وسانشيز، «العطور: الدليل» (2018). الناس قلّما يشترون منتجاً يومياً من أجل رائحته، لكنهم قد يرفضونه إن كرهوها: كالكن ويلينك، «صناعة العطور: الممارسة والمبادئ» (1994)، ص 148.",

      critKick: "النادر",
      critH: "ناقدان شمّا 1207 عطور، ولم يمنحا النجوم الخمس إلا لـ19 منها.",
      statBig: "قرابة النصف", statText: "نال نجمة أو نجمتين من خمس.",
      starsRow: (k, n) => `${["نجمة واحدة", "نجمتان", "3 نجوم", "4 نجوم", "5 نجوم"][k - 1]}: ${arPerfumes(n)}`,
      critLove: "العطر الذي تعشقه نادر، لذلك يتعلم الاختبار أكثر ما يتعلم من العطور التي ما زلت تستخدمها، لا من التي كانت رائحتها جميلة فحسب.",
      critNext: "وشيء آخر لا تعرفه في المتجر: رائحة العطر بعد ساعات.",
      critSrc: "عدد النجوم في مراجعات الكتاب المقيّمة كلها، وعددها 1207: تورين وسانشيز، «العطور: الدليل» (2018).",

      timeKick: "على مدار اليوم",
      timeH: "ما تشمّه في المتجر يختفي خلال ساعة.",
      timeLede: "النوتات الأولى تتلاشى في دقائق، والقلب يبقى بضع ساعات، والقاعدة ساعات أطول. حرّك المؤشر عبر يوم كامل وشاهد العطر يتغيّر.",
      timeFact: "بعض العطور تُصنع لتكون جميلة في الدقائق القليلة التي تقضيها في المتجر قبل أن تقرّر، لا أكثر.",
      timeQuiz: "لذلك يسألك متى انقلب عليك العطر: في الدقائق الأولى، أم في الساعات الأولى، أم بعد ساعات.",
      timeNext: "جاهز لتعرف ما يفسد العطر عليك؟",
      timeSrc: "تتلاشى النوتات العليا خلال دقائق إلى ساعة، وتبقى نوتات القلب من نحو ساعة إلى بضع ساعات، ونوتات القاعدة لساعات طويلة: ماكغي، «الغوص بالأنف» (2020). عطور تُصنع لتكون جميلة في دقائق المتجر فقط: تورين وسانشيز، «العطور: الدليل» (2018).",
      timeSlider: "الوقت منذ وضعته",
      timeNow: m => { const d = n => arCount(n, "دقيقة", "دقيقتين", "دقائق", "دقيقة"), h = n => arCount(n, "ساعة", "ساعتين", "ساعات", "ساعة"); return m === 0 ? "عند الرشّ" : m < 60 ? "بعد " + d(m) : "بعد " + h(Math.floor(m / 60)) + (m % 60 ? " و" + d(m % 60) : ""); },
      timeIn: "المرحلة", tick: h => `${h} س`,
      timeStage: { opening: "الدقائق الأولى", heart: "الساعات الأولى", drydown: "بعد ساعات" },
      timeIds: ["sauvageedp", "libre", "khamrah", "adgedt"],
      timeNotes: "النوتات المعلنة",

      quizH: "أربعة أجزاء سريعة، وستعرف ما تتجنبه وما تجرّبه.",
      quizLede: "يتعلم أولاً من العطور التي جرّبتها، ثم مما تقوله عن النوتات.",
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
