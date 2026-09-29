"""One-off: replaces the brass atomizer's styles in site/landing.css with the perfume bottle's (29 Sep 2026).
Exact-match edits; fails on a second run."""
p = r"C:\Users\malha\Desktop\Webapps\perfume-profiler\site\landing.css"
s = open(p, encoding="utf-8").read()


def cut_between(start, end_marker):
    """the text from `start` up to (not including) `end_marker`"""
    global s
    i = s.index(start)
    j = s.index(end_marker, i)
    return s[i:j]


pairs = [
    ('''/* The front page (index.html), on top of site.css. A still life at a dressing table: the atomizer stands in a pool of
   warm light on a pane of cream glass, its mist and notes held inside that pane so nothing drifts over the text. The
   palette widens here with the colours of the nine palate groups (js/landing-data.js), a plum for the rubber bulb and
   the band in the middle of the page, and deeper rose and amber for the light around it.''',
     '''/* The front page (index.html), on top of site.css. A still life at a dressing table: a perfume's own bottle stands in a
   pool of warm light on a pane of cream glass, its mist and notes held inside that pane so nothing drifts over the text.
   The palette widens here with the colours of the nine palate groups (js/landing-data.js), a plum for the band in the
   middle of the page, and deeper rose and amber for the light around the bottle.'''),
    ('''/* ---------- hero: on a phone the promise, the button and the atomizer share the first screen ---------- */''',
     '''/* ---------- hero: on a phone the promise, the button and the bottle share the first screen ---------- */'''),
    ('''  background:
    radial-gradient(60% 46% at 58% 70%, var(--glow-rose), transparent 72%),
    radial-gradient(52% 42% at 60% 36%, var(--glow-amber), transparent 72%),
    linear-gradient(180deg, rgba(252, 248, 240, .5), rgba(252, 248, 240, .28));
  border: 1px solid var(--rim); box-shadow: inset 0 1px 0 var(--gleam), var(--shadow-lift);
  -webkit-backdrop-filter: blur(14px) saturate(1.1); backdrop-filter: blur(14px) saturate(1.1); }
[dir="rtl"] .lp-stage { background:
    radial-gradient(60% 46% at 42% 70%, var(--glow-rose), transparent 72%),
    radial-gradient(52% 42% at 40% 36%, var(--glow-amber), transparent 72%),
    linear-gradient(180deg, rgba(252, 248, 240, .5), rgba(252, 248, 240, .28)); }''',
     '''  background:
    radial-gradient(46% 34% at 50% 74%, var(--glow-rose), transparent 72%),
    radial-gradient(56% 44% at 50% 40%, var(--glow-amber), transparent 72%),
    linear-gradient(180deg, rgba(252, 248, 240, .5), rgba(252, 248, 240, .28));
  border: 1px solid var(--rim); box-shadow: inset 0 1px 0 var(--gleam), var(--shadow-lift);
  -webkit-backdrop-filter: blur(14px) saturate(1.1); backdrop-filter: blur(14px) saturate(1.1); }'''),
    ('''/* a table edge under the bottle */''', '''/* the table the bottle stands on */'''),
    ('''.lp-frow-k { font-size: 11.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }''',
     '''/* a row's name sits on a light backing, so the mist that rises through the rows never lies behind bare text */
.lp-frow-k { padding: 1px 9px; border-radius: 999px; background: rgba(252, 248, 240, .84); font-size: 11.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }'''),
]
for a, b in pairs:
    assert s.count(a) == 1, a[:90]
    s = s.replace(a, b)

# the atomizer's block, from its comment to the caption's comment, becomes the bottle's
old = cut_between("/* the atomizer is one button: pressing anywhere on it squeezes the bulb.", "/* under the atomizer: the perfume just sprayed")
s = s.replace(old, '''/* the bottle is one button: the sprayed perfume's own picture standing on the table, under the notes' rows. A press
   dips it; a new perfume's bottle sinks the old one away and rises in (.out); the hint stands beside the glass until
   the visitor's own first press or answer */
.lp-bottle { position: absolute; inset-inline: 0; bottom: 116px; height: 202px; display: flex; align-items: flex-end; justify-content: center; padding: 0; border: 0; background: none; cursor: pointer; z-index: 1; touch-action: manipulation; -webkit-user-select: none; user-select: none; }
@media (min-width: 641px) { .lp-bottle { bottom: 110px; height: 278px; } }
.lp-bottle:focus-visible { outline: none; }
.lp-bottle:focus-visible .lp-glass { outline: 2px solid var(--gold); outline-offset: 8px; border-radius: 14px; }
.lp-glass { position: relative; display: flex; align-items: flex-end; height: 100%; max-width: 66%; transition: opacity .2s ease, transform .2s ease; }
.lp-glass img { display: block; width: auto; height: auto; max-width: 100%; max-height: 100%; -webkit-user-drag: none; pointer-events: none;
  filter: drop-shadow(0 16px 14px rgba(62, 30, 20, .2)) drop-shadow(0 2px 3px rgba(62, 30, 20, .22)); transition: transform .12s ease-out; transform-origin: 50% 100%; }
/* the bottle's shadow on the table */
.lp-glass::before { content: ""; position: absolute; left: 50%; bottom: -8px; width: 118%; height: 20px; transform: translateX(-50%); z-index: -1; background: radial-gradient(closest-side, rgba(62, 30, 20, .32), transparent); }
.lp-stage.pressed .lp-glass img { transform: translateY(2px) scale(.985); }
.lp-glass.out { opacity: 0; transform: translateY(10px); }
.lp-hint { position: absolute; top: 16%; inset-inline-start: calc(100% + 10px); z-index: 2; width: max-content; max-width: 110px; padding: 6px 12px; border-radius: 14px; font-size: 13px; font-weight: 600; line-height: 1.35; color: var(--plum); text-align: start;
  background: rgba(252, 248, 240, .94); border: 1px solid rgba(126, 42, 78, .28); box-shadow: 0 6px 16px -10px rgba(94, 30, 61, .6); pointer-events: none; transition: opacity .3s ease; }
.lp-hint::after { content: ""; position: absolute; top: 14px; inset-inline-start: -6px; width: 10px; height: 10px; background: inherit; border: inherit; border-top: 0; border-inline-end: 0; transform: rotate(45deg); }
[dir="rtl"] .lp-hint::after { transform: rotate(-45deg); }
.lp-stage.touched .lp-hint { opacity: 0; }

''')

pairs = [
    ('''/* under the atomizer: the perfume just sprayed, and the quiz's first question about it */
.lp-caption { position: absolute; inset-inline: 12px; bottom: 12px; display: grid; grid-template-columns: 44px minmax(0, 1fr); align-items: center; gap: 8px 10px;''',
     '''/* under the bottle: the perfume just sprayed, and the quiz's first question about it */
.lp-caption { position: absolute; inset-inline: 12px; bottom: 12px; display: grid; grid-template-columns: minmax(0, 1fr); align-items: center; gap: 8px 10px;'''),
    ('''.lp-caption > img { width: 44px; height: 44px; object-fit: contain; }
''', ''),
    ('''@media (min-width: 641px) { .lp-caption { inset-inline: 16px; bottom: 16px; grid-template-columns: 44px minmax(0, 1fr) auto; } .lp-tried { grid-column: auto; } }''',
     '''@media (min-width: 641px) { .lp-caption { inset-inline: 16px; bottom: 16px; grid-template-columns: minmax(0, 1fr) auto; } .lp-tried { grid-column: auto; } }'''),
    ('''@media (prefers-reduced-motion: no-preference) {
  .lp-atomizer::after { animation: lp-breathe 2.4s ease-in-out infinite; }
  .lp-stage.touched .lp-atomizer::after { animation: none; opacity: 0; }
  .lp-stage { transition: box-shadow .4s ease; }''',
     '''@media (prefers-reduced-motion: reduce) { .lp-glass, .lp-glass img { transition: none; } }
@media (prefers-reduced-motion: no-preference) {
  .lp-stage { transition: box-shadow .4s ease; }'''),
    ('''@keyframes lp-breathe { 0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(.85); } 50% { opacity: .9; transform: translate(-50%, -50%) scale(1.08); } }
[dir="rtl"] .lp-atomizer::after { animation-name: lp-breathe-rtl; }
@keyframes lp-breathe-rtl { 0%, 100% { opacity: 0; transform: translate(50%, -50%) scale(.85); } 50% { opacity: .9; transform: translate(50%, -50%) scale(1.08); } }
''', ''),
]
for a, b in pairs:
    assert s.count(a) == 1, a[:90]
    s = s.replace(a, b)
assert "atomizer" not in s, "a mention of the atomizer is left"
open(p, "w", encoding="utf-8", newline="\n").write(s)
print("applied")
