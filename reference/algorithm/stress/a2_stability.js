/* Angle 2: does the same wearer get the same result twice? A result that changes on a retest cannot be accurate.
   Retest 1: the same bottles with the same history (what happened with each bottle is drawn once), answered twice: the
   answering varies as it does in life ("I don't remember" when it turned, which note rows are answered, a row's answer
   by a point, complaint chips); the note names the wearer knows stay the same.
   Retest 2: the wearer owns six bottles with a fixed history and mentions a different three of them each time, as a
   visitor names the bottles that come to mind.
   Usage: node a2_stability.js [wearers] [seed]. Writes out/a2.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 2000), SEED = +(process.argv[3] || 23);
const ctx = L.site();

const jacc = (a, b) => { const A = new Set(a), B = new Set(b); if (!A.size && !B.size) return 1; return [...A].filter(x => B.has(x)).length / new Set([...A, ...B]).size; };
function compare(x, y) {
  const b1 = L.byStrength(x.prof, ["badLikely", "badPossible"]), b2 = L.byStrength(y.prof, ["badLikely", "badPossible"]);
  const g1 = L.classOf(x.prof, ["goodLikely", "goodPossible"]), g2 = L.classOf(y.prof, ["goodLikely", "goodPossible"]);
  const common = x.picks.filter(id => y.picks.includes(id)).length;
  return { topSame: b1.length && b2.length ? (b1[0] === b2[0] ? 1 : 0) : null, anyBreakerBoth: b1.length && b2.length ? 1 : 0, breakerShownOnce: (b1.length > 0) !== (b2.length > 0) ? 1 : 0,
    badJ: b1.length || b2.length ? jacc(b1, b2) : null, goodJ: g1.length || g2.length ? jacc(g1, g2) : null, picksCommon: x.picks.length && y.picks.length ? common : null };
}
function summary(rows) {
  const m = k => L.mean(rows.map(r => r[k]).filter(v => v != null));
  const pc = rows.map(r => r.picksCommon).filter(v => v != null);
  return { n: rows.length, topSame: m("topSame"), breakerShownOnce: m("breakerShownOnce"), badJ: m("badJ"), goodJ: m("goodJ"),
    picksCommon: L.mean(pc), picksNone: pc.filter(v => v === 0).length / pc.length, picksAll: pc.filter(v => v === 3).length / pc.length };
}

const O = { notes: 0.6, told: true, unsureWhen: 0.25 };
const res = {};
/* retest 1 */
for (const nb of [3, 5]) {
  const r = L.rng(SEED + nb), rows = [];
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(r, ctx);
    const list = L.bottles(ctx, per, r, nb).map(b => Object.assign(b, { fixed: b.kind === "shop" ? L.shopTrial(ctx.TRUTH[b.id], per, r) : L.wear(ctx.TRUTH[b.id], per, r) }));
    const known = new Set(ctx.CARDS.filter(() => r() < 0.5).map(c => c.id));
    const s1 = L.answer(ctx, per, list, r, Object.assign({ known }, O)), s2 = L.answer(ctx, per, list, r, Object.assign({ known }, O));
    rows.push(compare(L.run(ctx, s1), L.run(ctx, s2)));
  }
  res["same bottles, " + nb] = summary(rows);
}
/* retest 2 */
{
  const r = L.rng(SEED + 99), rows = [];
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(r, ctx);
    const own = L.bottles(ctx, per, r, 6).map(b => Object.assign(b, { fixed: b.kind === "shop" ? L.shopTrial(ctx.TRUTH[b.id], per, r) : L.wear(ctx.TRUTH[b.id], per, r) }));
    const known = new Set(ctx.CARDS.filter(() => r() < 0.5).map(c => c.id));
    const s1 = L.answer(ctx, per, L.sample(r, own, 3), r, Object.assign({ known }, O)), s2 = L.answer(ctx, per, L.sample(r, own, 3), r, Object.assign({ known }, O));
    rows.push(compare(L.run(ctx, s1), L.run(ctx, s2)));
  }
  res["3 of 6 owned bottles"] = summary(rows);
}
/* which part of the answering moves the result: three bottles, same history, one part answered afresh */
{
  const parts = {
    "verdicts only ('when' and chips vary)": (per, list, known, r) => { const o = { notes: 0, told: false, unsureWhen: 0.25 }; return [L.answer(ctx, per, list, r, o), L.answer(ctx, per, list, r, o)]; },
    "note rows vary, words fixed": (per, list, known, r) => { const o = Object.assign({ known }, O), a = L.answer(ctx, per, list, r, o), b = L.answer(ctx, per, list, r, o); return [a, { ratings: b.ratings, quiz: a.quiz }]; },
    "words vary, bottles fixed": (per, list, known, r) => { const o = Object.assign({ known }, O), a = L.answer(ctx, per, list, r, o), b = L.answer(ctx, per, list, r, o); return [a, { ratings: a.ratings, quiz: b.quiz }]; }
  };
  for (const [name, fn] of Object.entries(parts)) {
    const r = L.rng(SEED + 7), rows = [];
    for (let i = 0; i < N_PER; i++) {
      const per = L.persona(r, ctx);
      const list = L.bottles(ctx, per, r, 3).map(b => Object.assign(b, { fixed: b.kind === "shop" ? L.shopTrial(ctx.TRUTH[b.id], per, r) : L.wear(ctx.TRUTH[b.id], per, r) }));
      const known = new Set(ctx.CARDS.filter(() => r() < 0.5).map(c => c.id));
      const [s1, s2] = fn(per, list, known, r);
      rows.push(compare(L.run(ctx, s1), L.run(ctx, s2)));
    }
    res["3 bottles: " + name] = summary(rows);
  }
}
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "a2.json"), JSON.stringify({ wearers: N_PER, seed: SEED, res }, null, 1));
const P = L.pct;
console.log(`wearers per retest: ${N_PER}, seed ${SEED}\n`);
console.log(L.table(Object.entries(res).map(([k, v]) => ({ retest: k, "first deal-breaker the same": P(v.topSame), "a deal-breaker shown once only": P(v.breakerShownOnce),
  "deal-breaker overlap": P(v.badJ), "liked overlap": P(v.goodJ), "picks in common (of 3)": L.f2(v.picksCommon), "no pick in common": P(v.picksNone), "same three picks": P(v.picksAll) })),
  ["retest", "first deal-breaker the same", "a deal-breaker shown once only", "deal-breaker overlap", "liked overlap", "picks in common (of 3)", "no pick in common", "same three picks"]));
