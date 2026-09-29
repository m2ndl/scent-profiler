# One-off edit (29 Sep 2026): the quiz moves from site/index.html to site/quiz.html, so that index.html can be the
# landing page; every link, test and research script that loads the quiz follows it. Exact-match replacements, each
# must match once, so a second run fails loudly.
import sys, shutil, pathlib

ROOT = pathlib.Path("C:/Users/malha/Desktop/Webapps/perfume-profiler")
SITE = ROOT / "site"

# 1. the quiz page: quiz.html (today a redirect to index.html) becomes the quiz page itself
redirect = (SITE / "quiz.html").read_text(encoding="utf-8")
if "location.replace(\"index.html\"" not in redirect:
    sys.exit("site/quiz.html is not the redirect; already moved?")
shutil.copyfile(SITE / "index.html", SITE / "quiz.html")

EDITS = {
    "site/profile.html": [
        ('<a href="index.html" id="nav-quiz"></a>', '<a href="quiz.html" id="nav-quiz"></a>'),
        ('<a class="hero-link" href="index.html" id="hero-quiz"></a>', '<a class="hero-link" href="quiz.html?go=1" id="hero-quiz"></a>'),
    ],
    "site/articles.html": [
        ('<a class="back" href="index.html" id="nav-quiz"></a>', '<a class="back" href="quiz.html" id="nav-quiz"></a>'),
    ],
    "site/js/app.js": [
        ('$("foot").innerHTML = `<nav class="footnav"><a href="index.html">${esc(t().navQuiz)}</a>', '$("foot").innerHTML = `<nav class="footnav"><a href="quiz.html">${esc(t().navQuiz)}</a>'),
        ('const uses = toldAnswers ? `<p class="hint"><a href="index.html">', 'const uses = toldAnswers ? `<p class="hint"><a href="quiz.html">'),
    ],
    "site/js/quiz.js": [
        ("/* The quiz, the site's front page (index.html): which well-known bottles",
         "/* The quiz (quiz.html), which the front page (index.html) leads to: which well-known bottles"),
        ("""  render();
  page.loadCatalogue(() => { if (step === "grid") renderGridParts(); else render(); });
})();""",
         """  /* The front page's calls to action link here with ?go: the promise and the four parts were on that page, so the quiz
     opens on its first question, and Back leads to the start screen. The front page sent reach:start. */
  if (new URLSearchParams(location.search).has("go")) { hist.push(snap()); step = "grid"; }
  render();
  page.loadCatalogue(() => { if (step === "grid") renderGridParts(); else render(); });
})();"""),
    ],
    "site/js/data.js": [
        ("/* The quiz (the front page, index.html):", "/* The quiz (quiz.html):"),
    ],
    "tests/page.test.js": [
        ('quizScripts = scriptsOf(fs.readFileSync(path.join(SITE, "index.html"), "utf8"));', 'quizScripts = scriptsOf(fs.readFileSync(path.join(SITE, "quiz.html"), "utf8"));'),
    ],
    "tests/quiz.test.js": [
        ("/* The quiz, the front page (site/index.html), under the stub browser", "/* The quiz (site/quiz.html), under the stub browser"),
        ('const quizScripts = scriptsOf("index.html"), appScripts = scriptsOf("profile.html");', 'const quizScripts = scriptsOf("quiz.html"), appScripts = scriptsOf("profile.html");'),
        ('const qs = (fs.readFileSync(path.join(SITE, "index.html"), "utf8") + html(page)).match(/id="q"/g) || [];', 'const qs = (fs.readFileSync(path.join(SITE, "quiz.html"), "utf8") + html(page)).match(/id="q"/g) || [];'),
        ("""  /* a returning visitor goes to their profile to rate the samples; the old quiz address lands on the front page */""",
         """  /* a returning visitor goes to their profile to rate the samples; the quiz is its own page, which the front page leads to */"""),
        ("""  assert.match(fs.readFileSync(path.join(SITE, "quiz.html"), "utf8"), /location\\.replace\\("index\\.html" \\+ location\\.search \\+ location\\.hash\\)/);""",
         """  assert.match(fs.readFileSync(path.join(SITE, "quiz.html"), "utf8"), /<script src="js\\/quiz\\.js"><\\/script>/);"""),
    ],
    "reference/algorithm/audit.js": [('path.join(SITE, "index.html")', 'path.join(SITE, "quiz.html")')],
    "reference/algorithm/harness.js": [('scriptsOf("index.html")', 'scriptsOf("quiz.html")')],
    "reference/algorithm/stress/f2_palate_cases.js": [('path.join(SITE, "index.html")', 'path.join(SITE, "quiz.html")')],
    "reference/algorithm/stress/f_page.js": [('path.join(SITE, "index.html")', 'path.join(SITE, "quiz.html")')],
    "reference/algorithm/stress/g_palate_whatif.js": [('path.join(SITE, "index.html")', 'path.join(SITE, "quiz.html")')],
    "reference/algorithm/stress/i_extremes.js": [('path.join(SITE, "index.html")', 'path.join(SITE, "quiz.html")')],
    "reference/algorithm/stress/o_fixes_trial.js": [('path.join(SITE, "index.html")', 'path.join(SITE, "quiz.html")')],
}

for rel, pairs in EDITS.items():
    path = ROOT / rel
    s = path.read_text(encoding="utf-8")
    for old, new in pairs:
        n = s.count(old)
        if n != 1:
            sys.exit(f"{rel}: expected one match, found {n}: {old[:80]}")
        s = s.replace(old, new)
    path.write_bytes(s.encode("utf-8"))
    print(f"{rel}: {len(pairs)} replacements")
print("site/quiz.html: now the quiz page (copied from site/index.html)")
