/* Trial of the ranking changes suggested by h_coverage.js, on the same synthetic visitors, before any goes into the site
   (rank_trial.js holds the switches). For each variant: coverage (distinct perfumes, the ten most picked's share, the
   effective number, the share of visitors given the most picked perfume, how often two visitors with no liking in
   common get the same perfume), the picks kept and turning under the hidden taste (the same pick for the same visitor
   always gets the same simulated wears), the other gender's share and the niche share. The headline population (three
   bottles, every answer) runs under five seeds. Then two robustness checks on the engine and the variants: the
   catalogue in another order (only exact ties can move a pick), and every candidate's tags shaken by 15% (whether the
   most picked perfumes owe their place to exact tag values). Last, over every population: the perfumes picked at least
   once, and reachability: the share of the catalogue among the picks of a visitor whose liked families are exactly a
   perfume's own (each family it holds at 0.4 or more in the heart or base, liked at 1 in two bottles).
   Usage: node j_trial.js [visitors per population] [seed]. Writes out/j.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const { ranker } = require("./rank_trial");
const N_PER = +(process.argv[2] || 2000), SEED = +(process.argv[3] || 211), K = 30;
const ctx = L.site(), { E, D } = ctx;
const VARIANTS = {
  engine: {},
  "likes once": { agg: "likes once" },
  "traces unmet": { traces: "unmet" },
  "the side of kept bottles": { side: "kept" },
  "the side of kept, else tried bottles": { side: "kept, else tried" },
  "likes once, traces unmet": { agg: "likes once", traces: "unmet" },
  "likes once, traces unmet, side of kept bottles": { agg: "likes once", traces: "unmet", side: "kept" },
  "likes once, traces unmet, side of kept, else tried": { agg: "likes once", traces: "unmet", side: "kept, else tried", r9: true },
  "all once, traces unmet, side of kept, else tried": { agg: "once", traces: "unmet", side: "kept, else tried" },
  "likes once, traces unmet, side of kept, else tried, else unisex": { agg: "likes once", traces: "unmet", side: "kept, else tried, else unisex" },
  "likes once, traces as words, side of kept, else tried": { agg: "likes once", traces: "words", side: "kept, else tried", r9: true }
};
const RANK = Object.fromEntries(Object.entries(VARIANTS).map(([k, o]) => [k, ranker(E, D.STAGE_W, o)]));
/* the variant adopted in site/js/engine.js after commit 0164d00. The site's recommend() is checked against it and
   against the engine of 0164d00, so one of the two counts is complete. --check runs only this check. */
const ADOPTED = "likes once, traces as words, side of kept, else tried";
const CHECK_ONLY = process.argv.includes("--check");
const POPS = [
  { key: "3VNT", label: "Three bottles, every answer", nb: 3, o: { notes: 0.6, told: true }, seeds: 5 },
  { key: "3V", label: "Three bottles, verdicts only", nb: 3, o: { notes: 0, told: false }, seeds: 1 },
  { key: "8VNT", label: "Eight bottles, every answer", nb: 8, o: { notes: 0.6, told: true }, seeds: 1 },
  { key: "T", label: "Word answers only, no bottle", nb: 0, o: { notes: 0, told: true }, seeds: 1 }
];
function hashSeed(...xs) { let h = 2166136261; for (const c of xs.join("|")) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const opposite = (g, pg) => (g === "m" && pg === "f") || (g === "f" && pg === "m");

function population(pop, seed) {
  const r = L.rng(seed), rows = [];
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(r, ctx), list = pop.nb ? L.bottles(ctx, per, r, pop.nb) : [];
    const ses = L.answer(ctx, per, list, r, pop.o), res = L.run(ctx, ses);
    if (!res.gate) continue;
    rows.push({ i, seed, per, ratings: ses.ratings, prof: res.prof, avoid: res.avoid, site: res.picks });
  }
  return rows;
}
function measure(rows, key) {
  const picks = rows.flatMap(x => x[key]), freq = {};
  for (const id of picks) freq[id] = (freq[id] || 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const simpson = sorted.reduce((a, [, c]) => a + (c / picks.length) ** 2, 0);
  const r = L.rng(7), apart = [];
  for (let t = 0; t < 20000; t++) {
    const a = rows[Math.floor(r() * rows.length)], b = rows[Math.floor(r() * rows.length)];
    if (a === b || a.per.like.some(f => b.per.like.includes(f))) continue;
    apart.push(a[key].some(id => b[key].includes(id)) ? 1 : 0);
  }
  const keep = [], turn = [];
  for (const x of rows) {
    const oc = x[key].map(id => L.outcome(ctx.TRUTH[id], x.per, L.rng(hashSeed(x.seed, x.i, id)), K));
    if (oc.length) { keep.push(L.mean(oc.map(o => o.keep))); turn.push(L.mean(oc.map(o => o.turn))); }
  }
  return { distinct: sorted.length, top10: sorted.slice(0, 10).reduce((a, [, c]) => a + c, 0) / picks.length, effective: 1 / simpson,
    top1: sorted.length ? sorted[0][1] / rows.length : 0, apart: L.mean(apart), keep: L.mean(keep), turn: L.mean(turn),
    otherGender: rows.reduce((n, x) => n + x[key].filter(id => opposite(x.per.g, E.byId[id].gender)).length, 0) / picks.length,
    niche: picks.filter(id => E.byId[id].tier === "niche").length / picks.length,
    most: sorted.slice(0, 5).map(([id, c]) => `${E.byId[id].name} ${(100 * c / rows.length).toFixed(0)}%`), ids: Object.keys(freq) };
}

const t0 = Date.now(), out = { visitorsPerPopulation: N_PER, seed: SEED, populations: {} };
let checked = 0, mismatch = 0, mismatchAdopted = 0;
const pooled = Object.fromEntries(Object.keys(VARIANTS).map(k => [k, new Set()]));
for (const [pi, pop] of POPS.entries()) {
  const runs = [];
  for (let k = 0; k < pop.seeds; k++) {
    const rows = population(pop, SEED * 100 + pi * 10 + k);
    for (const x of rows) {
      checked++; x.engine = RANK.engine(x.prof, x.ratings, x.avoid); if (x.engine.join() !== x.site.join()) mismatch++;
      if (RANK[ADOPTED](x.prof, x.ratings, x.avoid).join() !== x.site.join()) mismatchAdopted++;
    }
    if (CHECK_ONLY) { process.stderr.write(`${pop.key} seed ${k + 1} checked\n`); continue; }
    for (const k2 of Object.keys(VARIANTS)) if (k2 !== "engine") for (const x of rows) x[k2] = RANK[k2](x.prof, x.ratings, x.avoid);
    runs.push(Object.fromEntries(Object.keys(VARIANTS).map(k2 => [k2, measure(rows, k2)])));
    for (const k2 of Object.keys(VARIANTS)) for (const id of runs[runs.length - 1][k2].ids) pooled[k2].add(id);
    process.stderr.write(`${pop.key} seed ${k + 1}: ${((Date.now() - t0) / 1000).toFixed(0)} s\n`);
  }
  if (CHECK_ONLY) continue;
  /* mean over seeds, with the range for the headline figures */
  out.populations[pop.key] = { label: pop.label, seeds: pop.seeds, variants: Object.fromEntries(Object.keys(VARIANTS).map(k2 => {
    const ms = runs.map(x => x[k2]), num = ["distinct", "top10", "effective", "top1", "apart", "keep", "turn", "otherGender", "niche"];
    return [k2, Object.assign(Object.fromEntries(num.map(n => [n, { mean: L.mean(ms.map(m => m[n])), min: Math.min(...ms.map(m => m[n])), max: Math.max(...ms.map(m => m[n])) }])), { most: ms[0].most })];
  })) };
}
out.replicaCheck = { checked, matchedEngine0164d00: checked - mismatch, matchedAdopted: checked - mismatchAdopted, adopted: ADOPTED };
const checkLine = `the site's recommend() picked what the engine of 0164d00 picks for ${checked - mismatch} of ${checked} visitors, and what "${ADOPTED}" picks for ${checked - mismatchAdopted}`;
if (CHECK_ONLY) { console.log(checkLine); process.exit(0); }

/* robustness: the catalogue in another order, and every candidate's tags shaken, for the headline population */
const rowsR = population(POPS[0], SEED * 100 + 99);
const shuffled = L.shuffle(L.rng(3), E.PERFUMES);
const r15 = L.rng(17);
const shaken = E.PERFUMES.map(P => Object.assign({}, P, { stages: Object.fromEntries(L.STAGES.map(s => [s, Object.fromEntries(Object.entries(P.stages[s] || {}).map(([f, w]) => [f, L.clamp(w * (1 + 0.15 * L.normal(r15)), 0.05, 1)]))])) }));
out.robust = {};
for (const k of Object.keys(VARIANTS)) {
  const inOrder = RANK[k], reordered = ranker(E, D.STAGE_W, VARIANTS[k], shuffled), noisy = ranker(E, D.STAGE_W, VARIANTS[k], shaken);
  let same = 0, sameNoisy = 0; const f0 = {}, f1 = {};
  for (const x of rowsR) {
    const a = inOrder(x.prof, x.ratings, x.avoid), b = reordered(x.prof, x.ratings, x.avoid), c = noisy(x.prof, x.ratings, x.avoid);
    if (a.join() === b.join()) same++;
    if ([...a].sort().join() === [...c].sort().join()) sameNoisy++;
    for (const id of a) f0[id] = (f0[id] || 0) + 1;
    for (const id of c) f1[id] = (f1[id] || 0) + 1;
  }
  const top = f => Object.entries(f).sort((p, q) => q[1] - p[1]).slice(0, 10).map(([id]) => id);
  const before = top(f0), after = top(f1);
  out.robust[k] = { visitors: rowsR.length, sameInAnotherOrder: same / rowsR.length, samePicksShaken: sameNoisy / rowsR.length, top10KeptShaken: before.filter(id => after.includes(id)).length };
}
/* pooled coverage, and reachability */
const selfProfile = P => { const prof = {}; for (const s of ["heart", "drydown"]) for (const [f, w] of Object.entries(P.stages[s] || {})) if (w >= 0.4) prof[f] = { score: 1, n: 2, cls: "goodLikely", evidence: [], pos: 2, neg: 0 }; return prof; };
out.pooled = Object.fromEntries(Object.entries(pooled).map(([k, v]) => [k, v.size]));
out.reach = {};
for (const k of Object.keys(VARIANTS)) {
  const miss = E.PERFUMES.filter(P => !RANK[k](selfProfile(P), {}, [], 3).includes(P.id));
  out.reach[k] = { share: 1 - miss.length / E.PERFUMES.length, examples: miss.slice(0, 6).map(P => `${P.house} ${P.name}`) };
}
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "j.json"), JSON.stringify(out, null, 1));

const P = L.pct, rng = (x, fmt) => (x.min === x.max ? fmt(x.mean) : `${fmt(x.mean)} (${fmt(x.min)} to ${fmt(x.max)})`);
console.log(`visitors per population ${N_PER}, seed ${SEED}; ${checkLine}\n`);
for (const p of Object.values(out.populations)) {
  console.log(`${p.label}${p.seeds > 1 ? `, mean over ${p.seeds} seeds (range)` : ""}`);
  console.log(L.table(Object.entries(p.variants).map(([k, v]) => ({ variant: k, distinct: v.distinct.mean.toFixed(0), "top 10 share": P(v.top10.mean), "effective number": v.effective.mean.toFixed(0),
    "most picked": P(v.top1.mean), "no liking in common, share a pick": rng(v.apart, P), kept: rng(v.keep, P), turn: rng(v.turn, P), "other gender": P(v.otherGender.mean), niche: P(v.niche.mean) })),
    ["variant", "distinct", "top 10 share", "effective number", "most picked", "no liking in common, share a pick", "kept", "turn", "other gender", "niche"]));
  for (const [k, v] of Object.entries(p.variants)) console.log(`  ${k}: ${v.most.join("; ")}`);
  console.log("");
}
console.log(`Robustness, ${rowsR.length} visitors (three bottles, every answer)`);
console.log(L.table(Object.entries(out.robust).map(([k, v]) => ({ variant: k, "same picks, catalogue in another order": P(v.sameInAnotherOrder), "same picks, tags shaken 15%": P(v.samePicksShaken), "ten most picked still in the ten, tags shaken": v.top10KeptShaken })),
  ["variant", "same picks, catalogue in another order", "same picks, tags shaken 15%", "ten most picked still in the ten, tags shaken"]));
console.log("\nPerfumes picked at least once over every population, and reachability (the share of the catalogue among the picks of a visitor whose liked families are its own)");
console.log(L.table(Object.keys(VARIANTS).map(k => ({ variant: k, "picked at least once": out.pooled[k], reachable: P(out.reach[k].share), "not reachable, e.g.": out.reach[k].examples.slice(0, 3).join(", ") })),
  ["variant", "picked at least once", "reachable", "not reachable, e.g."]));
process.stderr.write(`${((Date.now() - t0) / 1000).toFixed(0)} s\n`);
