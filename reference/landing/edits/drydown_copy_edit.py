# One-off edit (29 Sep 2026): take the drydown-first wording out of the landing page and the quiz, in both languages.
# Exact-match replacements; each must match once, so a second run fails loudly.
import sys

ROOT = "C:/Users/malha/Desktop/Webapps/perfume-profiler/"
EDITS = {
    "site/js/quiz.js": [
        # landing page lede
        ('startLede: "Tell us how the perfumes you know ended for you. We find the material family behind the ones that turned on you, name your palate and choose three samples to try next.",',
         'startLede: "Tell us about the perfumes you know: which suited you and which did not. We find the material family behind the ones that turned on you, name your palate and choose three samples to try next.",'),
        ('startLede: "أخبرنا كيف انتهت معك العطور التي تعرفها. نجد عائلة المواد وراء العطور التي انقلبت عليك، ونسمّي ذائقتك، ونختار لك ثلاث عيّنات تجرّبها بعد ذلك.",',
         'startLede: "أخبرنا عن العطور التي تعرفها: أيّها ناسبك وأيّها لم يناسبك. نجد عائلة المواد وراء العطور التي انقلبت عليك، ونسمّي ذائقتك، ونختار لك ثلاث عيّنات تجرّبها بعد ذلك.",'),
        # the grid's hint, the verdict question and its "don't remember" answer
        ("Next, you say how each one ended for you.", "Next, you say how each one went for you."),
        ("بعدها تخبرنا كيف انتهى كل عطر منها معك.", "بعدها تخبرنا كيف كانت تجربتك مع كل عطر منها."),
        ('verdictQ: "How did it end?",', 'verdictQ: "How did it go?",'),
        ('verdictQ: "كيف انتهى معك؟",', 'verdictQ: "كيف كانت تجربتك معه؟",'),
        ('unsure: "I don\'t remember how it ended" }', 'unsure: "I don\'t remember how it went" }'),
        ('unsure: "لا أتذكر كيف انتهى معي" }', 'unsure: "لا أتذكر كيف كانت تجربتي معه" }'),
        # the narrowing round
        ('narrowHint: "Each of these has, in its base, a family that may be a deal-breaker for you. Your verdict on it shows whether that family is the problem.",',
         'narrowHint: "Each of these tests one family that may be a deal-breaker for you. Your verdict on it shows whether that family is the problem.",'),
        ('narrowHint: "في قاعدة كل واحد منها عائلة قد تكون مُفسدة لك. وجوابك عنه يبيّن إن كانت هذه العائلة هي السبب.",',
         'narrowHint: "كل واحد منها يختبر عائلة قد تكون مُفسدة لك. وجوابك عنه يبيّن إن كانت هذه العائلة هي السبب.",'),
        # palate tips that made the base the deciding stage
        ('tip: "Sweet perfumes differ most in their base: the patchouli, woods or musk under the sugar are what set one vanilla apart from the next." },',
         'tip: "Sweet perfumes differ in what comes with the sugar: the fruit or flowers at the start and the patchouli, woods or musk under it are what set one vanilla apart from the next." },'),
        ('tip: "تختلف العطور الحلوة في قاعدتها أكثر من أي شيء آخر: الباتشولي أو الأخشاب أو المسك تحت السكر هي ما يميّز فانيلا عن أخرى." },',
         'tip: "تختلف العطور الحلوة فيما يرافق السكر: الفواكه أو الزهور في البداية، والباتشولي أو الأخشاب أو المسك تحته، هي ما يميّز فانيلا عن أخرى." },'),
        ('tip: "Saffron and warm spices often sit on an oud, amber or woody base, and the base decides whether you keep the perfume. Judge a sample hours in, not only at the first spray." },',
         'tip: "Saffron and warm spices often sit on an oud, amber or woody base, so the same perfume can smell quite different an hour in. Judge a sample over several hours, not only at the first spray." },'),
        ('tip: "كثيراً ما يأتي الزعفران والتوابل الدافئة على قاعدة من العود أو العنبر أو الأخشاب، والقاعدة هي التي تحدد إن كنت ستبقي على العطر. احكم على العيّنة بعد ساعات، لا عند الرشّة الأولى فقط." },',
         'tip: "كثيراً ما يأتي الزعفران والتوابل الدافئة على قاعدة من العود أو العنبر أو الأخشاب، فقد يتغيّر العطر نفسه كثيراً بعد ساعة. احكم على العيّنة على مدى ساعات، لا عند الرشّة الأولى فقط." },'),
        # the starter samples for a visitor with no bottle, and the samples that would confirm a deal-breaker
        ("Each of these three has one family strong in its base: wear a sample for a day and see whether that family bothers you.",
         "Each of these three tests one family: wear a sample for a day and see whether that family bothers you."),
        ("لكل واحد من هذه الثلاثة عائلة واحدة قوية في قاعدته: جرّب عينة منه يوماً كاملاً لترى إن كانت تلك العائلة تزعجك.",
         "كل واحد من هذه الثلاثة يختبر عائلة واحدة: جرّب عينة منه يوماً كاملاً لترى إن كانت تلك العائلة تزعجك."),
        ("carry: n => `If this bothers you, ${n} other perfumes in our catalogue carry the same family in their base.`,",
         "carry: n => `If this bothers you, ${n} other perfumes in our catalogue carry the same family strongly.`,"),
        ("carry: n => `إن أزعجك هذا، فعدد العطور الأخرى في قائمتنا التي تحمل العائلة نفسها في قاعدتها: ${n}.`,",
         "carry: n => `إن أزعجك هذا، فعدد العطور الأخرى في قائمتنا التي تحمل العائلة نفسها بقوة: ${n}.`,"),
        ('confirmLede: "Each has one family strong in its base: wear a sample for a day and see whether that family bothers you.",',
         'confirmLede: "Each tests one family: wear a sample for a day and see whether that family bothers you.",'),
        ('confirmLede: "لكل واحد منها عائلة واحدة قوية في قاعدته: جرّب عينة منه يوماً كاملاً لترى إن كانت تلك العائلة تزعجك.",',
         'confirmLede: "كل واحد منها يختبر عائلة واحدة: جرّب عينة منه يوماً كاملاً لترى إن كانت تلك العائلة تزعجك.",'),
        # the file's own summary line
        ("which well-known bottles the visitor has worn and how each one ended. Each",
         "which well-known bottles the visitor has worn and how each one went. Each"),
    ],
    "site/js/page.js": [
        # the header and footer link to the articles, on every page
        ('navArticles: "Why drydowns fail",', 'navArticles: "Articles",'),
        ('navArticles: "لماذا يتغيّر العطر بعد ساعات",', 'navArticles: "مقالات",'),
    ],
    "site/index.html": [
        ('content="Tap the well-known perfumes you have worn, say how each one ended, and see which material families may be ruining perfumes for you. Arabic and English."',
         'content="Tap the well-known perfumes you have worn, say which ones suited you, and see which material families may be ruining perfumes for you. Arabic and English."'),
    ],
    "tests/quiz.test.js": [
        ("carry the same family in their base\\\\.`));", "carry the same family strongly\\\\.`));"),
        ("I don&#39;t remember how it ended</);", "I don&#39;t remember how it went</);"),
        ("<\\/b>Sweet perfumes differ most in their base/", "<\\/b>Sweet perfumes differ in what comes with the sugar/"),
    ],
}

for rel, pairs in EDITS.items():
    path = ROOT + rel
    s = open(path, encoding="utf-8", newline="").read()
    for old, new in pairs:
        n = s.count(old)
        if n != 1:
            sys.exit(f"{rel}: expected one match, found {n}: {old[:70]}")
        s = s.replace(old, new)
    open(path, "w", encoding="utf-8", newline="").write(s)
    print(f"{rel}: {len(pairs)} replacements")
