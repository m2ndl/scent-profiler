# One-off edit (29 Sep 2026): the front page gains the section on how noses differ (a grid of 100 people per smell,
# from the survey figures in the books), the book lines under the strips, the spoiled note and the day of wear, and the
# Guide's star count after the strips.
import pathlib, sys

ROOT = pathlib.Path("C:/Users/malha/Desktop/Webapps/perfume-profiler")
p = ROOT / "site/js/landing.js"
s = p.read_text(encoding="utf-8")

EDITS = [
    # state
    ("""  let spoilId = null, spoilPick = null, timeId = null, timeMin = 8;""",
     """  let spoilId = null, spoilPick = null, timeId = null, timeMin = 8, noseId = "andro";"""),
    # the strips: a book line for the two families most perfumes carry, and the Guide's stars after them
    ("""          ${on ? `<span class="lp-strip-hint">${esc(lang === "ar" ? F.hint_ar : F.hint_en)}</span><span class="lp-strip-count">${esc(t().matCount(num(F.count), num(LD.total)))}</span>` : `<span class="lp-strip-tap">${esc(t().matTap)}</span>`}
        </button></div>`;
      }).join("")}</div>
    </section>`;""",
     """          ${on ? `<span class="lp-strip-hint">${esc(lang === "ar" ? F.hint_ar : F.hint_en)}</span><span class="lp-strip-count">${esc(t().matCount(num(F.count), num(LD.total)))}</span>${t().matBook[f] ? `<span class="lp-strip-book">${esc(t().matBook[f])}</span>` : ""}` : `<span class="lp-strip-tap">${esc(t().matTap)}</span>`}
        </button></div>`;
      }).join("")}</div>
      <p class="lp-stat"><b>${esc(t().statBig)}</b><span>${esc(t().statText)}</span></p>
    </section>`;"""),
    # the new section, drawn before the spoiled note
    ("""  const tabs = (ids, cur, attr) =>""",
     """  /* 100 people and one smell: the same dots stay dark from smell to smell, in an order fixed once */
  const PEOPLE = (() => { let a = 7; const r = () => (a = (a * 16807) % 2147483647) / 2147483647; return Array.from({ length: 100 }, (_, i) => i).sort(() => r() - .5); })();
  const RANK = Object.fromEntries(PEOPLE.map((d, k) => [d, k]));
  function noseHtml() {
    const cases = t().noseCases, c = cases.find(x => x.id === noseId) || cases[cases.length - 1], cannot = 100 - c.can;
    const about = c.about ? t().noseAbout + " " : "";
    return `<section class="lp-sec lp-nose" id="lp-nose">
      <div class="lp-head"><h2>${esc(t().noseH)}</h2><p>${esc(t().noseLede)}</p></div>
      <div class="lp-pills" role="group">${cases.map(x => `<button type="button" aria-pressed="${x.id === c.id}" data-nose="${x.id}" style="--c:${color(x.g)}"><i></i>${esc(x.name)}</button>`).join("")}</div>
      <div class="lp-nose-body">
        <div class="lp-people" role="img" aria-label="${esc((about + t().noseCan(c.can)) + ", " + (about + t().noseCannot(cannot)))}" style="--c:${color(c.g)}">${Array.from({ length: 100 }, (_, d) => `<i class="${RANK[d] < cannot ? "off" : "on"}" style="--k:${RANK[d]}"></i>`).join("")}</div>
        <div class="lp-nose-text">
          <p class="lp-legend"><span class="on" style="--c:${color(c.g)}">${esc(about + t().noseCan(c.can))}</span>${cannot ? `<span class="off">${esc(about + t().noseCannot(cannot))}</span>` : ""}</p>
          <p class="lp-nose-note">${esc(c.note)}</p>
          <p class="lp-nose-critics">${esc(t().noseCritics)}</p>
          <p class="lp-src">${esc(t().noseSrc)}</p>
        </div>
      </div>
    </section>`;
  }
  const tabs = (ids, cur, attr) =>"""),
    # spoil and time: their book lines
    ("""          <div class="lp-result" aria-live="polite">${result}</div>
        </div>
      </div>
    </section>`;""",
     """          <div class="lp-result" aria-live="polite">${result}</div>
        </div>
      </div>
      <p class="lp-src lp-book">${esc(t().spoilBook)}</p>
    </section>`;"""),
    ("""      <div class="lp-head"><h2>${esc(t().timeH)}</h2><p>${esc(t().timeLede)}</p></div>
      ${tabs(t().timeIds, s.id, "time")}""",
     """      <div class="lp-head"><h2>${esc(t().timeH)}</h2><p>${esc(t().timeLede)}</p><p class="lp-src lp-book">${esc(t().timeBook)}</p></div>
      ${tabs(t().timeIds, s.id, "time")}"""),
    # order of the page
    ("""    host.innerHTML = heroHtml() + stripsHtml() + spoilHtml() + timeHtml() + quizHtml() + artsHtml() + footHtml();""",
     """    host.innerHTML = heroHtml() + stripsHtml() + noseHtml() + spoilHtml() + timeHtml() + quizHtml() + artsHtml() + footHtml();"""),
    # clicks
    ("""    if (d.time) { timeId = d.time; swap("lp-time", timeHtml); return; }""",
     """    if (d.time) { timeId = d.time; swap("lp-time", timeHtml); return; }
    if (d.nose) { noseId = d.nose; swap("lp-nose", noseHtml, `[data-nose="${d.nose}"]`); return; }"""),
]
for old, new in EDITS:
    n = s.count(old)
    if n != 1:
        sys.exit(f"landing.js: expected one match, found {n}: {old[:70]}")
    s = s.replace(old, new)
p.write_bytes(s.encode("utf-8"))

c = ROOT / "site/landing.css"
t = c.read_text(encoding="utf-8")
anchor = """/* perfume tabs, shared by two sections */"""
if t.count(anchor) != 1:
    sys.exit("landing.css: anchor missing")
ADD = """/* book lines, small and quiet under what they support */
.lp-src { margin: 12px 0 0; font-size: 13px; line-height: 1.6; color: var(--ink-3); max-width: 70ch; }
.lp-book { padding-inline-start: 12px; border-inline-start: 2px solid var(--rim-2); }
.lp-head .lp-src { margin-top: 12px; font-size: 13.5px; }
.lp-strip-book { grid-column: 1 / -1; font-size: 13px; line-height: 1.55; color: var(--ink-3); padding-inline-start: 10px; border-inline-start: 2px solid color-mix(in oklab, var(--c) 55%, transparent); }
/* the Guide's star count, after the strips */
.lp-stat { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; max-width: 820px; margin: 30px 0 0; padding: 20px 22px; border-radius: 20px;
  background: var(--glass); border: 1px solid var(--rim); box-shadow: inset 0 1px 0 var(--gleam), var(--shadow); }
@media (min-width: 641px) { .lp-stat { grid-template-columns: auto minmax(0, 1fr); gap: 20px; align-items: center; } }
.lp-stat b { font-family: var(--font-display); font-size: clamp(34px, 5vw, 46px); font-weight: 500; line-height: 1.05; color: var(--bad); white-space: nowrap; }
[dir="rtl"] .lp-stat b { font-weight: 700; line-height: 1.4; }
.lp-stat span { font-size: 16px; line-height: 1.6; color: var(--ink-2); }

/* how noses differ: a hundred people, dark where a smell does not reach them */
.lp-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.lp-pills button { display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 7px 15px 7px 12px; border-radius: 999px; cursor: pointer; font-size: 14.5px; color: var(--ink-2);
  background: var(--glass-2); border: 1px solid var(--rim); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
[dir="rtl"] .lp-pills button { padding: 7px 12px 7px 15px; }
.lp-pills i { width: 10px; height: 10px; border-radius: 50%; background: var(--c); flex: none; }
.lp-pills button:hover { border-color: var(--rim-2); color: var(--ink); }
.lp-pills button[aria-pressed="true"] { background: color-mix(in oklab, var(--gold-soft) 85%, transparent); border-color: var(--gold); color: var(--ink); box-shadow: inset 0 0 0 1px var(--gold); }
.lp-nose-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; align-items: start; padding: 22px; border-radius: 22px;
  background: var(--glass); border: 1px solid var(--rim); box-shadow: inset 0 1px 0 var(--gleam), var(--shadow); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }
@media (min-width: 761px) { .lp-nose-body { grid-template-columns: minmax(0, 360px) minmax(0, 1fr); gap: 34px; padding: 28px; } }
.lp-people { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 7px; max-width: 360px; }
.lp-people i { aspect-ratio: 1; border-radius: 50%; background: var(--c); box-shadow: inset 0 -2px 3px rgba(42, 27, 17, .18), 0 0 0 1px color-mix(in oklab, var(--c) 60%, transparent);
  transition: background-color .5s ease calc(var(--k) * 6ms), box-shadow .5s ease calc(var(--k) * 6ms), transform .5s ease calc(var(--k) * 6ms); }
.lp-people i.off { background: rgba(42, 27, 17, .06); box-shadow: inset 0 0 0 1.5px rgba(102, 83, 68, .45); transform: scale(.86); }
.lp-legend { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 0 0 12px; font-weight: 600; font-size: 16px; }
.lp-legend span { display: inline-flex; align-items: center; gap: 8px; }
.lp-legend span::before { content: ""; width: 13px; height: 13px; border-radius: 50%; }
.lp-legend .on::before { background: var(--c); }
.lp-legend .off::before { box-shadow: inset 0 0 0 1.5px rgba(102, 83, 68, .55); }
.lp-nose-note { margin: 0; font-size: 16px; line-height: 1.65; color: var(--ink); max-width: 60ch; }
.lp-nose-critics { margin: 14px 0 0; font-size: 15px; line-height: 1.65; color: var(--ink-2); max-width: 60ch; }

/* perfume tabs, shared by two sections */"""
t = t.replace(anchor, ADD)
c.write_bytes(t.encode("utf-8"))
print("nose section added")
