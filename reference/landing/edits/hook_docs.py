# One-off edit (29 Sep 2026): README and CLAUDE.md describe the rebuilt front page, its 3D atomizer and the tool that
# draws the atomizer's still pictures.
import pathlib, sys
ROOT = pathlib.Path("C:/Users/malha/Desktop/Webapps/perfume-profiler")

def edit(rel, pairs):
    p = ROOT / rel; s = p.read_text(encoding="utf-8")
    for old, new in pairs:
        if s.count(old) != 1:
            sys.exit(f"{rel}: expected one match, found {s.count(old)}: {old[:80]!r}")
        s = s.replace(old, new)
    p.write_bytes(s.encode("utf-8"))
    print(f"{rel}: {len(pairs)} change(s)")

edit("README.md", [
    ("| `site/index.html` | The front page: why few perfumes suit any one person, shown with the catalogue's own data, leading to the quiz and the articles. An atomizer whose bulb sprays one of the quiz's twenty perfumes into its listed notes by stage; paper test strips for ten families with how many perfumes clearly carry each, and the critics' star count; a 100-person grid per smell from a large smell survey; a perfume's notes, one of which the visitor marks as the one they would mind; a day of wear across the three stages. Its facts from the books carry their sources on the page. Markup only; its scripts are `js/landing.js` and the generated `js/landing-data.js`, its styles `landing.css` on top of `site.css`. |",
     "| `site/index.html` | The front page: why few perfumes suit any one person, leading to the quiz and the articles. An antique brass atomizer in 3D whose bulb sprays one of the quiz's twenty perfumes into its listed notes by stage; then sections that each end on the question the next one answers: the 1,000-perfume test (tap the smells you like, then one you cannot stand, and watch the count), a perfume box turned round to its ingredient label, a 100-person grid per smell from a large smell survey, a perfume's notes with the one the visitor would mind, the critics' stars, and a day of wear. Each section's sources are folded under it. Markup, the import map that pins three.js on jsDelivr, and the scripts `js/landing.js`, the generated `js/landing-data.js` and the module `js/bottle3d.js`; styles `landing.css` on top of `site.css`. |"),
    ("| `site/js/landing.js` | The front page: its words in both languages, the atomizer (an SVG bottle, a canvas mist, the notes rising in three rows), the strips, the spoiled note, the day of wear; the funnel's `reach:start`. Everything that moves sits under reduced-motion: no-preference. |",
     "| `site/js/landing.js` | The front page: its words in both languages, the atomizer (a still picture until `js/bottle3d.js` takes over, a canvas mist, the notes rising in three rows), the 1,000-perfume test, the box and its label, the grid of noses, the spoiled note, the stars, the day of wear; the funnel's `reach:start`. Everything that moves sits under reduced-motion: no-preference. |\n| `site/js/bottle3d.js` | The front page's atomizer drawn live with three.js: an engraved flacon of antique brass with a jewel that takes each perfume's colour, a braided cord, a netted bulb that squeezes, a tassel. Draws on demand, never in a loop; without WebGL the still picture stays. |\n| `site/img/atomizer-ltr.webp`, `atomizer-rtl.webp` | The atomizer's still pictures, drawn from `js/bottle3d.js` by `tools/render_atomizer.py`: the first paint, and the fallback without WebGL. |"),
    ("| `tools/build_landing.js` | Writes `site/js/landing-data.js` from `data.js`, `mapper.js`, `bottles.js` and the palate groups in `quiz.js`; `tests/landing.test.js` fails while it is out of date. |",
     "| `tools/build_landing.js` | Writes `site/js/landing-data.js` from `data.js`, `mapper.js`, `bottles.js`, `materials.js`, the palate groups in `quiz.js` and the labels in `evidence/labels/`; `tests/landing.test.js` fails while it is out of date. |\n| `tools/render_atomizer.py` | Draws the atomizer's two still pictures from `site/js/bottle3d.js` in headless Chromium and checks that the nozzle and bulb fall where `landing.js` expects them. Run after any change to the 3D atomizer. |"),
])
edit("CLAUDE.md", [
    ("`js/quiz.js` the quiz (`quiz.html`), with `js/motion.js` its motion and touch (screen transitions, in-place\n  updates, the dock), and `js/landing.js` the front page (`index.html`);",
     "`js/quiz.js` the quiz (`quiz.html`), with `js/motion.js` its motion and touch (screen transitions, in-place\n  updates, the dock), and `js/landing.js` the front page (`index.html`), with `js/bottle3d.js` its 3D atomizer (three.js\n  from jsDelivr, pinned by the import map in `index.html`; `python tools/render_atomizer.py` redraws its still pictures);"),
])
