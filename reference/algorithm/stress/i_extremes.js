/* Angle 9: extreme but valid answers, through the engine and the real quiz page (tests/lib/dom.js): every note card
   avoided or loved, every quiz bottle kept or turned, a single bottle, a visitor who only says what they avoid, and a
   profiler with hundreds of ratings. For each: whether anything throws, how many picks the page shows, whether a pick
   breaks the engine's own promises (a likely deal-breaker at the strength that excludes it, an avoided note leading
   its heart or base without a kept bottle behind it), the "ruled out" count, and the time the engine takes.
   Usage: node i_extremes.js [seed]. Writes out/i.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const SEED = +(process.argv[2] || 131);
const ROOT = L.ROOT, SITE = path.join(ROOT, "site");
const { createPage } = require(path.join(ROOT, "tests", "lib", "dom"));
const scripts = [...fs.readFileSync(path.join(SITE, "index.html"), "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
const ctx = L.site(), { E, D } = ctx;
const QUIZ60 = D.QUIZ.grid.concat(D.QUIZ.more).filter(id => E.byId[id]);

/* the quiz page's result for stored ratings and answers (as f_page.js drives it); null and the error when it throws */
function page(ratings, quiz) {
  const answers = Object.assign({ taste: "unsure", told: [], anosmia: "no" }, quiz);
  try {
    const p = createPage({ localStorage: { pp_device: JSON.stringify("d"), pp_lang: JSON.stringify("en"), pp_ratings_v1: JSON.stringify(ratings), pp_quiz_v1: JSON.stringify(answers) } });
    p.load(scripts);
    const html = () => p.snapshot().els.quiz.innerHTML;
    p.click({ dataset: { start: "1" } }); p.click({ dataset: { none: "1" } });
    for (let i = 0; i < 8 && /data-pn=/.test(html()); i++) p.click({ dataset: { continue: "1" } });
    p.click({ dataset: { taste: answers.taste } }); p.click({ dataset: { continue: "1" } }); p.click({ dataset: { anosmia: answers.anosmia } });
    const h = html();
    return { picks: [...h.matchAll(/data-event="sample:([^"]+)"/g)].map(m => m[1]).filter((x, i, a) => a.indexOf(x) === i), result: /id="qe-|qtaste/.test(h), text: h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") };
  } catch (e) { return { error: String(e && e.stack || e).split("\n").slice(0, 3).join(" | ") }; }
}
const still = () => ({ opening: null, heart: null, drydown: 1, again: 1, chips: {}, src: "quiz" });
const turned = (stage, chips) => ({ opening: null, heart: null, drydown: null, [stage]: -2, again: 0, chips: chips ? { [stage]: chips } : {}, src: "quiz" });
const allCards = v => Object.fromEntries(ctx.CARDS.map(c => [c.id, v]));

/* the engine's promises on a pick: no likely deal-breaker at the excluding strength; no avoided family leading its
   heart or base unless a kept bottle holds that family with a liking */
function broken(res) {
  const likely = Object.entries(res.prof).filter(([, v]) => v.cls === "badLikely").map(([f]) => f);
  const out = [];
  for (const id of res.picks) {
    const P = E.byId[id];
    for (const f of likely) if ((P.stages.drydown[f] || 0) >= 0.5 || (P.stages.heart[f] || 0) >= 0.7) out.push(`${P.name}: likely deal-breaker ${f}`);
    for (const a of res.avoid) for (const [f, w] of Object.entries(a.fams || {})) {
      if (w < 0.5) continue;
      const keptBehind = ((res.prof[f] || {}).evidence || []).some(e => e.value > 0 && e.kept);
      const leadsIn = s => { const st = P.stages[s] || {}; return (st[f] || 0) >= 0.7 && st[f] >= Math.max(...Object.values(st)); };
      if (!keptBehind && (leadsIn("heart") || leadsIn("drydown"))) out.push(`${P.name}: avoided ${a.id} (${f}) leads`);
    }
  }
  return out;
}
function caseRun(label, ratings, quiz) {
  const t0 = process.hrtime.bigint();
  const res = L.run(ctx, { ratings, quiz: quiz || { notes: {} } });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const pg = page(ratings, quiz || {});
  return { label, rated: Object.keys(ratings).length, gate: res.gate, enginePicks: res.picks.map(id => E.byId[id].name), pagePicks: pg.picks ? pg.picks.map(id => (E.byId[id] || {}).name || id) : null,
    pageError: pg.error || null, samePicks: pg.picks ? pg.picks.join() === (res.gate ? res.picks.join() : "") : null, ruledOut: E.ruledOut(res.prof, res.avoid).length, broken: broken(res), ms: +ms.toFixed(1) };
}

const r = L.rng(SEED), cases = [];
cases.push(caseRun("every note card avoided, no bottle", {}, { notes: allCards(-1), taste: "unsure", told: [], toldNone: true }));
cases.push(caseRun("every note card avoided, three kept bottles", Object.fromEntries(L.sample(r, QUIZ60, 3).map(id => [id, still()])), { notes: allCards(-1) }));
cases.push(caseRun("every note card loved, no bottle", {}, { notes: allCards(1) }));
cases.push(caseRun("the 60 quiz bottles all kept", Object.fromEntries(QUIZ60.map(id => [id, still()])), { notes: {} }));
cases.push(caseRun("the 60 quiz bottles all turned in the base", Object.fromEntries(QUIZ60.map(id => [id, turned("drydown")])), { notes: {} }));
cases.push(caseRun("the 60 quiz bottles all turned in the base, every complaint", Object.fromEntries(QUIZ60.map(id => [id, turned("drydown", D.CHIPS.map(c => c.id))])), { notes: {} }));
cases.push(caseRun("one bottle kept, nothing else", { [QUIZ60[0]]: still() }, { notes: {} }));
cases.push(caseRun("one bottle turned, nothing else", { [QUIZ60[0]]: turned("drydown") }, { notes: {} }));
cases.push(caseRun("two bottles turned, every complaint told", { [QUIZ60[0]]: turned("drydown"), [QUIZ60[1]]: turned("heart") }, { notes: {}, told: D.CHIPS.filter(c => Object.keys(c.fams).length).map(c => c.id) }));
cases.push(caseRun("only avoided notes, no bottle", {}, { notes: Object.fromEntries(ctx.CARDS.slice(0, 5).map(c => [c.id, -1])) }));
cases.push(caseRun("one note loved, no bottle", {}, { notes: { [ctx.CARDS[0].id]: 1 } }));
/* profiler-shaped: hundreds of ratings with any values */
for (const n of [100, 400, 1000]) {
  const ids = L.sample(r, ctx.ALL, n), ratings = {};
  for (const id of ids) { const v = () => (r() < 0.3 ? null : Math.floor(r() * 5) - 2); ratings[id] = { opening: v(), heart: v(), drydown: v(), again: r() < 0.5 ? 1 : 0, chips: {} }; }
  cases.push(caseRun(`profiler, ${n} perfumes rated at random`, ratings, { notes: {} }));
}
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "i.json"), JSON.stringify(cases, null, 1));
for (const c of cases) {
  console.log(`${c.label}: rated ${c.rated}; picks shown ${c.gate ? c.enginePicks.length : 0} (${c.gate ? c.enginePicks.join(", ") : "gate closed"}); page ${c.pageError ? "THREW " + c.pageError : `showed ${c.pagePicks.length}, same as the engine: ${c.samePicks}`}; ruled out ${c.ruledOut}; promises broken ${c.broken.length ? c.broken.join("; ") : "none"}; engine ${c.ms} ms`);
}
