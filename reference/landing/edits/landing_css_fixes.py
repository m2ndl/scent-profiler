# One-off edit (29 Sep 2026): landing.css follows the verifier's findings: the strip is a div with a button and a
# reading below it; the invitation sits in the notes' own box; stage cards are not dimmed as a whole; the spoiled vial
# only loses its colour; the articles link has a finger-sized target.
import pathlib, sys
p = pathlib.Path("C:/Users/malha/Desktop/Webapps/perfume-profiler/site/landing.css")
s = p.read_text(encoding="utf-8")
EDITS = [
    # the articles link under the call to action
    (""".lp-under a { font-weight: 500; }""",
     """.lp-under a { display: inline-flex; align-items: center; min-height: 40px; font-weight: 500; }"""),
    # the invitation: in the same box as the notes, centred, so it can never reach the pump or the nozzle
    (""".lp-invite { position: absolute; top: 34%; inset-inline: 12%; margin: 0; text-align: center; font-family: var(--font-display); font-size: 21px; line-height: 1.45; color: var(--ink-2); z-index: 3; transition: opacity .5s ease; pointer-events: none; }
[dir="rtl"] .lp-invite { font-weight: 600; font-size: 20px; line-height: 1.8; }
@media (min-width: 641px) { .lp-invite { font-size: 24px; top: 30%; } }""",
     """.lp-invite { position: absolute; top: 64px; inset-inline: 12%; height: calc(100% - 64px - 312px); display: flex; align-items: center; justify-content: center; z-index: 3; transition: opacity .5s ease; pointer-events: none; }
.lp-invite p { margin: 0; text-align: center; font-family: var(--font-display); font-size: 20px; line-height: 1.45; color: var(--ink-2); }
[dir="rtl"] .lp-invite p { font-weight: 600; font-size: 19px; line-height: 1.8; }
@media (min-width: 641px) { .lp-invite { top: 88px; height: calc(100% - 88px - 372px); } .lp-invite p { font-size: 23px; } }"""),
    # the strip: the div is the paper, the button its first row
    (""".lp-strip { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px 16px; width: var(--w, 100%); min-height: 58px; padding: 12px 64px 12px 18px; text-align: start; cursor: pointer;""",
     """.lp-strip { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); align-items: center; gap: 6px; width: var(--w, 100%); min-height: 58px; padding: 12px 64px 12px 18px; text-align: start;"""),
    (""".lp-strip:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--gold-soft), 0 0 0 4px var(--gold); }""",
     """.lp-strip-btn { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px 16px; width: 100%; min-height: 34px; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; }
.lp-strip-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 6px; border-radius: 3px; }
.lp-strip-more { display: grid; gap: 6px; }
.lp-strip-more[hidden] { display: none; }"""),
    # stage cards: only the bars and the border step back
    (""".lp-stagecard { padding: 18px 18px 14px; border-radius: 20px; background: var(--glass-2); border: 1px solid var(--rim); transition: opacity .45s ease, transform .45s cubic-bezier(.34, 1.4, .64, 1), box-shadow .45s ease; opacity: .5; }""",
     """.lp-stagecard { padding: 18px 18px 14px; border-radius: 20px; background: var(--glass-2); border: 1px solid var(--rim); transition: transform .45s cubic-bezier(.34, 1.4, .64, 1), box-shadow .45s ease, border-color .45s ease; }"""),
    (""".lp-stagecard:not(.on) .lp-bars i::before { width: calc(var(--w) * .6); filter: saturate(.6); }""",
     """.lp-stagecard:not(.on) .lp-bars i::before { opacity: .45; }"""),
    # the spoiled vial: the colour drains, nothing is smeared over it
    (""".lp-vial-cloud { position: absolute; inset: 22% -10% -10%; background: radial-gradient(60% 40% at 50% 30%, rgba(62, 30, 44, .75), transparent 70%), radial-gradient(40% 30% at 35% 65%, rgba(62, 30, 44, .5), transparent 70%); opacity: 0; transform: translateY(-18%); transition: opacity .9s ease .25s, transform 1.2s ease .25s; }
.lp-spoiled .lp-vial-juice, .spoiled .lp-vial-juice { filter: saturate(.3) brightness(.78); }
.spoiled .lp-vial-cloud { opacity: 1; transform: none; }""",
     """.spoiled .lp-vial-juice { filter: grayscale(.85) brightness(.72); }"""),
]
for old, new in EDITS:
    n = s.count(old)
    if n != 1:
        sys.exit(f"landing.css: expected one match, found {n}: {old[:80]}")
    s = s.replace(old, new)
p.write_bytes(s.encode("utf-8"))
print("landing.css updated")
