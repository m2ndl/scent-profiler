# One-off edit (29 Sep 2026): the front page's copy rebuilt as seven steps, each with an example and its evidence.
# Splices copy_words.js (the words) and copy_render.js (the sections) into site/js/landing.js between fixed markers,
# and points the strip clicks at the section a strip belongs to. The atomizer, mist and events are left as they were.
import pathlib, sys
HERE = pathlib.Path(__file__).parent
p = pathlib.Path("C:/Users/malha/Desktop/Webapps/perfume-profiler/site/js/landing.js")
s = p.read_text(encoding="utf-8")

def between(s, start, end, new):
    i, j = s.find(start), s.find(end)
    if s.count(start) != 1 or s.count(end) != 1 or not (0 <= i < j):
        sys.exit(f"markers not found once and in order: {start[:50]!r} / {end[:50]!r}")
    return s[:i] + new + s[j:]

def once(s, old, new):
    if s.count(old) != 1:
        sys.exit(f"expected one match, found {s.count(old)}: {old[:80]!r}")
    return s.replace(old, new)

s = once(s, """/* The front page (index.html): the idea behind the quiz, shown with the catalogue's own data and a few facts from the
   books in reference/books/, leading to the quiz (quiz.html) and the articles. Perfumes are sold as beautiful smells,
   yet few suit any one person: one material a visitor cannot stand can spoil a perfume, so the quiz looks first for
   what spoils perfumes for them, then for the scents they especially love.
""", """/* The front page (index.html): why so few perfumes suit any one person, in seven steps (see the words below), each
   with an example from the catalogue or a label and its evidence from the books in reference/books/, leading to the
   quiz (quiz.html) and the articles.
""")
s = between(s, "  /* Arabic counted nouns:", "  const t = () => T[lang];", (HERE / "copy_words.js").read_text(encoding="utf-8"))
s = once(s, """  const num = n => (lang === "en" ? Number(n).toLocaleString("en-US") : String(n));
""", "")
s = between(s, "  /* ---------- rendering ---------- */", "  /* ---------- spraying ---------- */", (HERE / "copy_render.js").read_text(encoding="utf-8"))
s = once(s, """    if (d.strip) { if (openStrips.has(d.strip)) openStrips.delete(d.strip); else openStrips.add(d.strip); swap("lp-mat", stripsHtml, `[data-strip="${d.strip}"]`); return; }""",
         """    if (d.strip) { if (openStrips.has(d.strip)) openStrips.delete(d.strip); else openStrips.add(d.strip); const own = LD.facts.liked.fams.includes(d.strip); swap(own ? "lp-mat" : "lp-list", own ? likedHtml : listHtml, `[data-strip="${d.strip}"]`); return; }""")
p.write_bytes(s.encode("utf-8"))
print("landing.js: words and sections replaced")
