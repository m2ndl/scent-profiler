# One-off edit (29 Sep 2026): the front page's copy brought in line with the books (scratchpad book_facts.md):
# "sold as beautiful smells" instead of "made of beautiful smells"; the materials section says perfumers also use
# materials that smell strange or harsh alone, adds woody ambers and white musks with book facts and the Guide's star
# counts; a new section on how noses differ (survey figures); book lines under the spoil and time sections.
import pathlib, sys

p = pathlib.Path("C:/Users/malha/Desktop/Webapps/perfume-profiler/site/js/landing.js")
s = p.read_text(encoding="utf-8")

EN_OLD_HERO = '''      h1: "Perfume is made of beautiful smells. So why do so few suit you?",
      lede: "Woods, roses, spices and fruit smell good on their own, yet one note you cannot stand can spoil a perfume made of all of them. The quiz starts with the notes that spoil perfumes for you, then finds the scents you especially love.",'''
EN_NEW_HERO = '''      h1: "Perfumes are sold as beautiful smells. So why do so few suit you?",
      lede: "The notes on the box are roses, woods, spices and fruit. Yet one material you cannot stand, sometimes one the box never names, can spoil a perfume made of all of them. The quiz starts with the notes that spoil perfumes for you, then finds the scents you especially love.",'''

EN_OLD_MAT = '''      matH: "Built from things that smell good",
      matLede: "Every perfume is assembled from materials that smell pleasant on their own. Each strip carries one family of them: tap it to read what it smells like and how many of the 1,000 perfumes in our catalogue use it.",
      matCount: (n, total) => `In ${n} of our ${total} perfumes`,
      matTap: "Tap to smell",
      matFams: ["rose", "white_floral", "citrus_fresh", "spicy_warm", "sandalwood_creamy", "vanilla_gourmand", "oud_smoky", "amber_resin"],'''
EN_NEW_MAT = '''      matH: "What goes into a perfume",
      matLede: "A perfume box lists notes that sound lovely. Perfumers also use materials that smell strange or harsh on their own, and some a note list may not mention. Tap a strip to read what each family smells like and how many of the 1,000 perfumes in our catalogue carry it.",
      matCount: (n, total) => `A main material in ${n} of our ${total} perfumes`,
      matTap: "Tap to smell",
      matFams: ["rose", "white_floral", "citrus_fresh", "spicy_warm", "sandalwood_creamy", "vanilla_gourmand", "oud_smoky", "amber_resin", "woody_amber", "white_musk"],
      matBook: {
        woody_amber: "Perfume critics write that perfumers now use these in every type of perfume because they last so long. (Turin and Sanchez, Perfumes: The Guide, 2018)",
        white_musk: "A perfume chemistry textbook states that no perfume on the market lacks musk. (Ohloff and others, Scent and Chemistry, 2022)"
      },
      statBig: "About half",
      statText: "of the 1,207 perfumes reviewed by the critics Luca Turin and Tania Sanchez in Perfumes: The Guide (2018) got one or two stars out of five. About twenty got five.",

      noseH: "Your nose is not my nose",
      noseLede: "We each carry around 400 kinds of smell receptors, and the genes behind them differ from person to person. The same perfume can smell different to two people, and some people cannot smell certain materials at all. Choose a smell to see how 100 people split in a large survey.",
      noseCases: [
        { id: "banana", name: "Banana (isoamyl acetate)", can: 100, note: "No one in the survey was found unable to smell it.", g: "fresh" },
        { id: "clove", name: "Clove (eugenol)", can: 100, note: "No one in the survey was found unable to smell it.", g: "spiced" },
        { id: "musk", name: "A clean musk (Galaxolide)", can: 67, about: true, note: "About as many people could not smell it as could not smell androstenone. The clean, freshly ironed smell of many white-musk perfumes grew from accords built on it.", g: "musk" },
        { id: "andro", name: "Androstenone", can: 67, note: "70.5% of women and 62.8% of men could smell it. Of those who can, most describe it as urine-like, and some as sweet or floral.", g: "oud" }
      ],
      noseCan: n => `${n} can smell it`, noseCannot: n => `${n} cannot`, noseAbout: "about",
      noseCritics: "Even two professional critics can part ways: Luca Turin found one perfume loud, while Tania Sanchez found it quiet and concluded she could not smell one of its main materials.",
      noseSrc: "Survey figures: the National Geographic Smell Survey, as reported in Ohloff and others, Scent and Chemistry (2022). Receptors: McGee, Nose Dive (2020); Gilbert, What the Nose Knows (2008). The critics: Turin and Sanchez (2018).",'''

EN_OLD_SPOIL = '''      spoilAgain: "Try another note",
      spoilIds: ["khamrah", "yara", "sauvageedp", "br540"],

      timeH: "A perfume changes as you wear it",'''
EN_NEW_SPOIL = '''      spoilAgain: "Try another note",
      spoilIds: ["khamrah", "yara", "sauvageedp", "br540"],
      spoilBook: "In tests reported by the perfumer Paul Jellinek, a violet lipstick scent that most testers approved was rejected once a touch of civet was added. Critics describe the same in fine perfume: a good perfume marred by one material, such as a harsh woody amber. (Jellinek, The Psychological Basis of Perfumery, 1997, p. 134; Turin and Sanchez, 2018)",

      timeH: "A perfume changes as you wear it",'''

EN_OLD_TIME = '''      timeFams: "Families",
      timeNotes: "Listed notes",
'''
EN_NEW_TIME = '''      timeFams: "Families",
      timeNotes: "Listed notes",
      timeBook: "Top notes fade within minutes to an hour, heart notes last from about an hour to a few hours, and base notes for many hours. Some perfumes are made to smell good only for the minutes it takes to decide at the counter. (McGee, Nose Dive, 2020; Turin and Sanchez, 2018)",
'''

AR_OLD_HERO = '''      h1: "العطر يُصنع من روائح جميلة، فلماذا لا يناسبك منه إلا القليل؟",
      lede: "الأخشاب والورد والتوابل والفواكه روائحها جميلة بمفردها، لكن نوتة واحدة لا تطيقها قد تفسد عطراً صُنع منها كلها. يبدأ الاختبار بالنوتات التي تفسد العطر عليك، ثم يجد الروائح التي تحبها حقاً.",'''
AR_NEW_HERO = '''      h1: "تُباع العطور على أنها روائح جميلة، فلماذا لا يناسبك منها إلا القليل؟",
      lede: "النوتات على العلبة ورد وأخشاب وتوابل وفواكه. لكن مادة واحدة لا تطيقها، وقد لا تذكرها العلبة أصلاً، قد تفسد عطراً فيه كل ذلك. يبدأ الاختبار بالنوتات التي تفسد العطر عليك، ثم يجد الروائح التي تحبها حقاً.",'''

AR_OLD_MAT = '''      matH: "مصنوع من روائح جميلة",
      matLede: "كل عطر يُركّب من مواد رائحتها طيبة بمفردها. يحمل كل شريط عائلة منها: اضغط عليه لتقرأ كيف تبدو رائحتها، وفي كم عطراً من عطور قائمتنا الألف تدخل.",
      matCount: (n, total) => `تدخل في ${n} من ${total} عطر في قائمتنا`,
      matTap: "اضغط لتشمّ",
      matFams: ["rose", "white_floral", "citrus_fresh", "spicy_warm", "sandalwood_creamy", "vanilla_gourmand", "oud_smoky", "amber_resin"],'''
AR_NEW_MAT = '''      matH: "مِمَّ يُصنع العطر",
      matLede: "تذكر علبة العطر نوتات تبدو جميلة. لكن صانعي العطور يستخدمون أيضاً مواد رائحتها غريبة أو حادة بمفردها، وبعضها قد لا تذكره قائمة النوتات. اضغط على أي شريط لتقرأ كيف تبدو رائحة عائلته، وكم عطراً من عطور قائمتنا الألف يحملها.",
      matCount: (n, total) => `مادة أساسية في ${n} من ${total} عطر في قائمتنا`,
      matTap: "اضغط لتشمّ",
      matFams: ["rose", "white_floral", "citrus_fresh", "spicy_warm", "sandalwood_creamy", "vanilla_gourmand", "oud_smoky", "amber_resin", "woody_amber", "white_musk"],
      matBook: {
        woody_amber: "يكتب نقاد العطور أن صانعيها صاروا يستخدمون هذه المواد في كل أنواع العطور لأنها تدوم طويلاً. (تورين وسانشيز، «العطور: الدليل»، 2018)",
        white_musk: "ينص كتاب مرجعي في كيمياء العطور على أنه لا يوجد عطر في السوق يخلو من المسك. (أولوف وآخرون، «الرائحة والكيمياء»، 2022)"
      },
      statBig: "نحو النصف",
      statText: "من العطور التي راجعها الناقدان لوكا تورين وتانيا سانشيز في كتاب «العطور: الدليل» (2018)، وعددها 1207، نال نجمة أو نجمتين من خمس، ونال نحو عشرين منها خمس نجوم.",

      noseH: "أنفك ليس كأنف غيرك",
      noseLede: "لدى كل منا نحو 400 نوع من مستقبلات الشم، وتختلف الجينات التي تحددها من شخص لآخر. لذلك قد يشمّ شخصان العطر نفسه بشكل مختلف، وبعض الناس لا يشمّون مواد معينة على الإطلاق. اختر رائحة لترى كيف ينقسم 100 شخص في دراسة كبيرة.",
      noseCases: [
        { id: "banana", name: "الموز (أسيتات الأيزوأميل)", can: 100, note: "لم يُعثر في الدراسة على من لا يشمّها.", g: "fresh" },
        { id: "clove", name: "القرنفل (الأوجينول)", can: 100, note: "لم يُعثر في الدراسة على من لا يشمّها.", g: "spiced" },
        { id: "musk", name: "مسك نظيف (غالاكسوليد)", can: 67, about: true, note: "كان عدد من لم يشمّوه قريباً من عدد من لم يشمّوا الأندروستينون. ورائحة الثياب النظيفة المكويّة في كثير من عطور المسك الأبيض نشأت من تراكيب بُنيت عليه.", g: "musk" },
        { id: "andro", name: "الأندروستينون", can: 67, note: "شمّه 70.5٪ من النساء و62.8٪ من الرجال. ومن يشمّه يصفه غالباً بأنه يشبه رائحة البول، ويصفه بعضهم بأنه حلو أو زهري.", g: "oud" }
      ],
      noseCan: n => `${n} يشمّونها`, noseCannot: n => `${n} لا يشمّونها`, noseAbout: "نحو",
      noseCritics: "حتى ناقدان محترفان قد يختلفان: وجد لوكا تورين أحد العطور صاخباً، ووجدته تانيا سانشيز هادئاً، واستنتجت أنها لا تشمّ إحدى مواده الأساسية.",
      noseSrc: "أرقام الدراسة: مسح ناشيونال جيوغرافيك للشم، كما نقله أولوف وآخرون في «الرائحة والكيمياء» (2022). المستقبلات: ماكغي، «Nose Dive» (2020)؛ غيلبرت، «What the Nose Knows» (2008). الناقدان: تورين وسانشيز (2018).",'''

AR_OLD_SPOIL = '''      spoilAgain: "جرّب نوتة أخرى",
      spoilIds: ["khamrah", "yara", "sauvageedp", "br540"],'''
AR_NEW_SPOIL = '''      spoilAgain: "جرّب نوتة أخرى",
      spoilIds: ["khamrah", "yara", "sauvageedp", "br540"],
      spoilBook: "في اختبارات نقلها صانع العطور باول يلينك، رُفضت رائحة بنفسج لأحمر شفاه استحسنها معظم المختبِرين بعد أن أُضيفت إليها لمسة من الزباد. ويصف النقاد الأمر نفسه في العطور الفاخرة: عطر جيد أفسدته مادة واحدة، كالخشب العنبري الحاد. (يلينك، «الأساس النفسي لصناعة العطور»، 1997، ص 134؛ تورين وسانشيز، 2018)",'''

AR_OLD_TIME = '''      timeFams: "العائلات",
      timeNotes: "النوتات المعلنة",
'''
AR_NEW_TIME = '''      timeFams: "العائلات",
      timeNotes: "النوتات المعلنة",
      timeBook: "تتلاشى النوتات العليا خلال دقائق إلى ساعة، وتبقى نوتات القلب من نحو ساعة إلى بضع ساعات، ونوتات القاعدة لساعات طويلة. وبعض العطور تُصنع لتكون جميلة فقط في الدقائق التي يستغرقها قرار الشراء في المتجر. (ماكغي، «Nose Dive»، 2020؛ تورين وسانشيز، 2018)",
'''

for old, new in [(EN_OLD_HERO, EN_NEW_HERO), (EN_OLD_MAT, EN_NEW_MAT), (EN_OLD_SPOIL, EN_NEW_SPOIL), (EN_OLD_TIME, EN_NEW_TIME),
                 (AR_OLD_HERO, AR_NEW_HERO), (AR_OLD_MAT, AR_NEW_MAT), (AR_OLD_SPOIL, AR_NEW_SPOIL), (AR_OLD_TIME, AR_NEW_TIME)]:
    n = s.count(old)
    if n != 1:
        sys.exit(f"expected one match, found {n}: {old[:70]}")
    s = s.replace(old, new)
p.write_bytes(s.encode("utf-8"))
print("landing words brought in line with the books")
