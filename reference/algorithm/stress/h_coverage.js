/* Angle 8: coverage. Does the engine spread its picks over the catalogue as widely as the visitors' tastes justify, or
   send the same few perfumes to everyone? For populations of synthetic visitors (lib.js) at several depths of answer,
   and one whose likings follow what the catalogue's bases hold (tastes that cluster on what the market sells), it
   counts where the three picks go for the engine, for the best three the catalogue holds for each visitor (the hidden
   taste's own ranking, lib.js baselines.oracle) and for three random perfumes: distinct perfumes picked, the share of
   picks the ten most picked take, the effective number of perfumes (1 / the sum of squared shares), the share of
   visitors given the most picked perfume, and how often two visitors with no liking in common get the same perfume.
   Then the cause: the tag shape of the most picked perfumes, which families the engine counts as liked against the
   hidden likings, and variants of the ranking that each change one suspected cause, scored on the same visitors for
   coverage and for kept and turn (the same pick for the same visitor always gets the same simulated wears). Last,
   reachability: whether each perfume is among the picks of a visitor whose liked families are exactly its own.
   It measures the engine of commit 0164d00: "engine" below is the site's picks, and the script's copy of that ranking
   must match them, which holds only while the site runs that engine (out/h.txt). The change it led to was trialled with
   j_trial.js. Usage: node h_coverage.js [visitors per population] [seed]. Writes out/h.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 3000), SEED = +(process.argv[3] || 101), K = 30;
const ctx = L.site(), { E, D } = ctx;
const STAGES = L.STAGES, SW = D.STAGE_W;
const COMMON = ["woody_amber", "white_musk", "vanilla_gourmand", "amber_resin"];

/* ---------- the ranking of engine.js recommend(), with switches ----------
   agg "sum" adds every stage's presence of a family (the engine); "once" counts a family once, at its strongest
   stage-weighted presence. stages: the stages scored. unknownW: the cost of a strong family the profile has not met.
   norm: divide the score by the perfume's stage-weighted tag mass (a mean instead of a sum). With the defaults it must
   pick exactly what the site's recommend() picks (checked on every visitor below). */
const r9 = x => Math.round(x * 1e9) / 1e9;
const atStrength = (s, w) => (s === "drydown" && w >= 0.5) || (s === "heart" && w >= 0.7);
const leads = (P, f, s) => { const st = P.stages[s] || {}, w = st[f] || 0; return w >= 0.7 && w >= Math.max(...Object.values(st)); };
const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const named = (P, words) => words.some(w => w && new RegExp("\\b" + reEsc(w) + "s?\\b", "i").test(P.name));
function vetoOf(prof, avoid) {
  const bind = [];
  for (const a of avoid || []) for (const [f, w] of Object.entries(a.fams || {})) {
    if (w < 0.5) continue;
    const kept = ((prof[f] || {}).evidence || []).filter(e => e.value > 0 && e.perfume && e.kept);
    if (!kept.length) bind.push({ f, words: a.words || [] });
  }
  return bind;
}
const vetoed = (P, bind) => bind.some(b => leads(P, b.f, "heart") || leads(P, b.f, "drydown") || named(P, b.words));
function ranker(opt, perfumes) {
  opt = Object.assign({ agg: "sum", stages: STAGES, unknownW: 0.3, norm: false }, opt || {});
  const LIST = perfumes || E.PERFUMES;
  return function rank(prof, ratings, avoid, n) {
    const likely = Object.entries(prof).filter(([, v]) => v.cls === "badLikely").map(([f]) => f);
    const bind = vetoOf(prof, avoid), scored = [];
    for (const P of LIST) {
      if (ratings[P.id] || vetoed(P, bind)) continue;
      let excluded = false;
      for (const s of STAGES) for (const [f, w] of Object.entries(P.stages[s])) if (likely.includes(f) && atStrength(s, w)) excluded = true;
      if (excluded) continue;
      let reward = 0, penalty = 0, unknown = 0, mass = 0;
      if (opt.agg === "sum") {
        /* the engine's loop, in its order, so the sums are the same to the last digit */
        for (const s of opt.stages) for (const [f, w] of Object.entries(P.stages[s])) {
          const sw = SW[s]; mass += w * sw;
          const v = prof[f];
          if (!v) { if (w >= 0.5) unknown += w * sw; continue; }
          if (v.cls === "mixed") { if (Math.abs(r9(v.score)) < 0.7) penalty += w * sw * 0.3; else if (v.score < 0) penalty += w * sw * (-v.score); else reward += w * sw * v.score; continue; }
          if (v.score < 0) penalty += w * sw * (-v.score) * (v.cls === "badLikely" ? 1.5 : 1);
          else reward += w * sw * v.score;
        }
      } else {
        /* per family: its presence summed over the stages scored, and at its strongest stage. "once" counts every family
           once; "likes once" counts a liked family once and a disliked, doubtful or unmet one in every stage it is in
           (each stage is another chance for it to spoil the wear) */
        const fam = {};
        for (const s of opt.stages) for (const [f, w] of Object.entries(P.stages[s])) {
          const o = fam[f] || (fam[f] = { sum: 0, max: 0, unk: 0, unkMax: 0 });
          o.sum += w * SW[s]; o.max = Math.max(o.max, w * SW[s]);
          if (w >= 0.5) { o.unk += w * SW[s]; o.unkMax = Math.max(o.unkMax, w * SW[s]); }
        }
        const likeOnce = opt.agg === "once" || opt.agg === "likes once", dislikeOnce = opt.agg === "once";
        for (const [f, o] of Object.entries(fam)) {
          const v = prof[f], x = dislikeOnce ? o.max : o.sum;
          mass += likeOnce ? o.max : o.sum;
          if (!v) { unknown += dislikeOnce ? o.unkMax : o.unk; continue; }
          if (v.cls === "mixed") { if (Math.abs(r9(v.score)) < 0.7) penalty += x * 0.3; else if (v.score < 0) penalty += x * (-v.score); else reward += (likeOnce ? o.max : o.sum) * v.score; continue; }
          if (v.score < 0) penalty += x * (-v.score) * (v.cls === "badLikely" ? 1.5 : 1);
          else reward += (likeOnce ? o.max : o.sum) * v.score;
        }
      }
      let final = reward - 2 * penalty - opt.unknownW * unknown;
      if (opt.norm) final = final / Math.max(1e-9, mass);
      scored.push({ P, final });
    }
    scored.sort((a, b) => b.final - a.final);
    const picks = [], houses = new Set(), lineage = new Set();
    for (const s of scored) {
      const key = s.P.cloneOf || s.P.id;
      if (houses.has(s.P.house) || lineage.has(key)) continue;
      picks.push(s.P.id); houses.add(s.P.house); lineage.add(key);
      if (picks.length === (n || 3)) break;
    }
    return picks;
  };
}

/* ---------- the best three for the hidden taste (lib.js baselines.oracle, with each perfume scored once) ---------- */
function oracle(per, rated) {
  const sc = {};
  for (const P of E.PERFUMES) { const T = ctx.TRUTH[P.id]; sc[P.id] = (1 - L.pRuinLater(T, per)) / (1 + Math.exp(-2 * (0.8 * L.hedonic(T.stages.heart, per.u) + L.hedonic(T.stages.drydown, per.u)))); }
  return L.three(ctx, ctx.ALL.slice().sort((a, b) => sc[b] - sc[a]), rated);
}

/* ---------- visitors whose likings follow the market: liked and disliked families drawn in proportion to how many of
   the catalogue's bases hold them at 0.4 or more, instead of evenly ---------- */
const baseCount = {}; for (const P of E.PERFUMES) for (const [f, w] of Object.entries(P.stages.drydown || {})) if (w >= 0.4) baseCount[f] = (baseCount[f] || 0) + 1;
function weightedSample(r, items, weight, k) { const a = items.slice(), out = []; while (out.length < k && a.length) { const tot = a.reduce((s, x) => s + weight(x), 0); let x = r() * tot, i = 0; for (; i < a.length - 1; i++) { x -= weight(a[i]); if (x <= 0) break; } out.push(a.splice(i, 1)[0]); } return out; }
function marketPersona(r) {
  const per = L.persona(r, ctx);
  for (const f of per.bad.concat(per.like)) per.u[f] = L.clamp(0.15 + L.normal(r) * 0.35, -0.9, 0.9);
  const bad = weightedSample(r, ctx.EXPOSABLE, f => baseCount[f] || 1, per.bad.length);
  for (const f of bad) per.u[f] = -2;
  const like = weightedSample(r, ctx.EXPOSABLE.filter(f => !bad.includes(f)), f => baseCount[f] || 1, per.like.length);
  for (const f of like) per.u[f] = 1 + r();
  return Object.assign(per, { bad, like });
}

/* ---------- populations ---------- */
const POPS = [
  { key: "3VNT", label: "Three bottles, every answer", nb: 3, o: { notes: 0.6, told: true } },
  { key: "3V", label: "Three bottles, verdicts only", nb: 3, o: { notes: 0, told: false } },
  { key: "1VNT", label: "One bottle, every answer", nb: 1, o: { notes: 0.6, told: true } },
  { key: "8VNT", label: "Eight bottles, every answer", nb: 8, o: { notes: 0.6, told: true } },
  { key: "T", label: "Word answers only, no bottle", nb: 0, o: { notes: 0, told: true } },
  { key: "3VNT-market", label: "Three bottles, every answer, likings as common as the catalogue's bases", nb: 3, o: { notes: 0.6, told: true }, market: true }
];
function hashSeed(...xs) { let h = 2166136261; for (const c of xs.join("|")) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function population(pop, seed) {
  const r = L.rng(seed), rows = [];
  for (let i = 0; i < N_PER; i++) {
    const per = pop.market ? marketPersona(r) : L.persona(r, ctx);
    const list = pop.nb ? L.bottles(ctx, per, r, pop.nb) : [];
    const ses = L.answer(ctx, per, list, r, pop.o);
    const res = L.run(ctx, ses);
    if (!res.gate) continue;
    rows.push({ i, per, ratings: ses.ratings, prof: res.prof, avoid: res.avoid, engine: res.picks, oracle: oracle(per, ses.ratings), random: L.baselines.random(ctx, per, ses.ratings, r) });
  }
  return rows;
}

/* ---------- measures ---------- */
function concentration(rows, key) {
  const picks = rows.flatMap(x => x[key]), freq = {};
  for (const id of picks) freq[id] = (freq[id] || 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const v = E.PERFUMES.map(P => freq[P.id] || 0).sort((a, b) => a - b), n = v.length, s = v.reduce((a, b) => a + b, 0);
  let g = 0; v.forEach((x, i) => { g += (2 * (i + 1) - n - 1) * x; });
  const simpson = sorted.reduce((a, [, c]) => a + (c / picks.length) ** 2, 0);
  /* pairs of visitors: picks in common, over all pairs sampled, and over pairs with no liking in common */
  const r = L.rng(7), all = [], apart = [];
  for (let t = 0; t < 20000; t++) {
    const a = rows[Math.floor(r() * rows.length)], b = rows[Math.floor(r() * rows.length)]; if (a === b) continue;
    const common = a[key].filter(id => b[key].includes(id)).length;
    all.push(common > 0 ? 1 : 0);
    if (!a.per.like.some(f => b.per.like.includes(f))) apart.push(common > 0 ? 1 : 0);
  }
  return { visitors: rows.length, picks: picks.length, distinct: sorted.length, top10Share: sorted.slice(0, 10).reduce((a, [, c]) => a + c, 0) / picks.length,
    top1Visitors: sorted.length ? sorted[0][1] / rows.length : 0, effective: 1 / simpson, gini: g / (n * s),
    pairShare: L.mean(all), pairShareApart: L.mean(apart), freq,
    top: sorted.slice(0, 12).map(([id, c]) => ({ id, name: `${E.byId[id].house} ${E.byId[id].name}`, gender: E.byId[id].gender, tier: E.byId[id].tier, visitors: c / rows.length })) };
}
function accuracy(rows, key) {
  const keep = [], turn = [];
  for (const x of rows) {
    const oc = x[key].map(id => L.outcome(ctx.TRUTH[id], x.per, L.rng(hashSeed(x.i, x.per.g, id, SEED)), K));
    if (oc.length) { keep.push(L.mean(oc.map(o => o.keep))); turn.push(L.mean(oc.map(o => o.turn))); }
  }
  return { keep: L.mean(keep), turn: L.mean(turn) };
}

/* the tag shape of a perfume: the share of its stage-weighted tag mass in its main family, and in the four families
   most bases hold; the stages holding its main family at 0.5 or more; its families at 0.4 or more in the heart or base */
function shape(P) {
  const m = {}; let tot = 0;
  for (const s of STAGES) for (const [f, w] of Object.entries(P.stages[s] || {})) { m[f] = (m[f] || 0) + w * SW[s]; tot += w * SW[s]; }
  const main = Object.entries(m).sort((a, b) => b[1] - a[1])[0] || ["", 0];
  return { mainShare: tot ? main[1] / tot : 0, commonShare: tot ? COMMON.reduce((a, f) => a + (m[f] || 0), 0) / tot : 0,
    mainStages: STAGES.filter(s => ((P.stages[s] || {})[main[0]] || 0) >= 0.5).length, mass: tot,
    deepFams: new Set(["heart", "drydown"].flatMap(s => Object.entries(P.stages[s] || {}).filter(([, w]) => w >= 0.4).map(([f]) => f))).size };
}
const SHAPE = Object.fromEntries(E.PERFUMES.map(P => [P.id, shape(P)]));
function shapeOf(ids) { const keys = ["mainShare", "commonShare", "mainStages", "mass", "deepFams"]; return Object.fromEntries(keys.map(k => [k, L.mean(ids.map(id => SHAPE[id][k]))])); }

/* ---------- reachability: the profile of a visitor whose liked families are exactly a perfume's own (each family it
   holds at 0.4 or more in the heart or base, liked at 1 in two bottles); is the perfume among that visitor's picks? ---------- */
function selfProfile(P) {
  const prof = {};
  for (const s of ["heart", "drydown"]) for (const [f, w] of Object.entries(P.stages[s] || {})) if (w >= 0.4) prof[f] = { score: 1, n: 2, cls: "goodLikely", evidence: [], pos: 2, neg: 0 };
  return prof;
}
function reach(rank) {
  let hit = 0; const miss = [];
  for (const P of E.PERFUMES) { if (rank(selfProfile(P), {}, [], 3).includes(P.id)) hit++; else miss.push(P.id); }
  return { share: hit / E.PERFUMES.length, miss };
}

/* ---------- run ---------- */
const t0 = Date.now();
const VARIANTS = {
  engine: {},
  "once per family": { agg: "once" },
  "likes once, risks every stage": { agg: "likes once" },
  "heart and base only": { stages: ["heart", "drydown"] },
  "likes once, risks every stage, heart and base": { agg: "likes once", stages: ["heart", "drydown"] },
  "no cost for unmet families": { unknownW: 0 },
  "mean, not sum": { norm: true }
};
const RANK = Object.fromEntries(Object.entries(VARIANTS).map(([k, o]) => [k, ranker(o)]));
const out = { visitorsPerPopulation: N_PER, seed: SEED, populations: {} };
let mismatch = 0, checked = 0;
for (const [pi, pop] of POPS.entries()) {
  const rows = population(pop, SEED * 100 + pi);
  /* the replica must equal the site's recommend() */
  for (const x of rows) { checked++; if (RANK.engine(x.prof, x.ratings, x.avoid).join() !== x.engine.join()) mismatch++; }
  const res = { label: pop.label, shown: rows.length, of: N_PER };
  res.engine = Object.assign(concentration(rows, "engine"), accuracy(rows, "engine"));
  res.oracle = Object.assign(concentration(rows, "oracle"), accuracy(rows, "oracle"));
  res.random = Object.assign(concentration(rows, "random"), accuracy(rows, "random"));
  res.shape = { engineTop20: shapeOf(res.engine.top.slice(0, 12).map(t => t.id)), oracleTop20: shapeOf(res.oracle.top.slice(0, 12).map(t => t.id)), catalogue: shapeOf(ctx.ALL) };
  /* families the engine counts as liked (a liked class) against the hidden likings */
  res.liked = Object.fromEntries(ctx.FAMS.map(f => [f, { engine: L.mean(rows.map(x => (x.prof[f] && ["goodLikely", "goodPossible"].includes(x.prof[f].cls)) ? 1 : 0)),
    rewarded: L.mean(rows.map(x => (x.prof[f] && x.prof[f].score > 0 && x.prof[f].cls !== "mixed" ? 1 : 0))), hidden: L.mean(rows.map(x => (x.per.like.includes(f) ? 1 : 0))) }]));
  /* families the ranking rewards at their full mean although no rated bottle holds them at 0.4 or more (n = 0): traces */
  res.traceOnly = L.mean(rows.map(x => { const pos = Object.values(x.prof).filter(v => v.score > 0 && v.cls !== "mixed"); return pos.length ? pos.filter(v => v.n === 0 && !v.toldEvidence).length / pos.length : 0; }));
  res.variants = {};
  for (const [k, rank] of Object.entries(RANK)) {
    if (k === "engine") continue;
    for (const x of rows) x.v = rank(x.prof, x.ratings, x.avoid);
    res.variants[k] = Object.assign(concentration(rows, "v"), accuracy(rows, "v"));
    delete res.variants[k].freq;
    res.variants[k].top = res.variants[k].top.slice(0, 5);
  }
  for (const k of ["engine", "oracle", "random"]) { res[k + "Freq"] = res[k].freq; delete res[k].freq; }
  out.populations[pop.key] = res;
  process.stderr.write(`${pop.key} ${((Date.now() - t0) / 1000).toFixed(0)} s\n`);
}
out.replicaCheck = { checked, mismatch };
out.reach = Object.fromEntries(Object.entries(RANK).map(([k, rank]) => { const x = reach(rank); return [k, { share: x.share, missShape: shapeOf(x.miss), missExamples: x.miss.slice(0, 8).map(id => `${E.byId[id].house} ${E.byId[id].name}`) }]; }));
/* pooled over the populations: perfumes never picked */
const pooled = k => { const s = new Set(); for (const p of Object.values(out.populations)) for (const id of Object.keys(p[k + "Freq"])) s.add(id); return s.size; };
out.pooled = { engine: pooled("engine"), oracle: pooled("oracle"), random: pooled("random") };
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "h.json"), JSON.stringify(out, null, 1));

/* ---------- print ---------- */
const P = L.pct, F = L.f2;
console.log(`visitors per population ${N_PER}, seed ${SEED}; the replica of recommend() matched the site on ${checked - mismatch} of ${checked} visitors\n`);
for (const [key, p] of Object.entries(out.populations)) {
  console.log(`${p.label} (${p.shown} of ${p.of} shown picks)`);
  console.log(L.table(["engine", "oracle", "random"].map(k => ({ picks: k === "oracle" ? "best three for the taste" : k, distinct: p[k].distinct, "top 10 share": P(p[k].top10Share), "effective number": p[k].effective.toFixed(0), "most picked, share of visitors": P(p[k].top1Visitors), Gini: F(p[k].gini), "two visitors share a pick": P(p[k].pairShare), "... with no liking in common": P(p[k].pairShareApart), kept: P(p[k].keep), turn: P(p[k].turn) })),
    ["picks", "distinct", "top 10 share", "effective number", "most picked, share of visitors", "Gini", "two visitors share a pick", "... with no liking in common", "kept", "turn"]));
  console.log("  engine's most picked: " + p.engine.top.slice(0, 8).map(t => `${t.name} ${P(t.visitors)}`).join("; "));
  console.log("  best three's most picked: " + p.oracle.top.slice(0, 8).map(t => `${t.name} ${P(t.visitors)}`).join("; "));
  const sh = p.shape; console.log(`  shape (main family share, share in the four common base families, stages holding the main family, families in heart/base): engine's 12 most picked ${F(sh.engineTop20.mainShare)}, ${F(sh.engineTop20.commonShare)}, ${F(sh.engineTop20.mainStages)}, ${F(sh.engineTop20.deepFams)}; best three's ${F(sh.oracleTop20.mainShare)}, ${F(sh.oracleTop20.commonShare)}, ${F(sh.oracleTop20.mainStages)}, ${F(sh.oracleTop20.deepFams)}; catalogue ${F(sh.catalogue.mainShare)}, ${F(sh.catalogue.commonShare)}, ${F(sh.catalogue.mainStages)}, ${F(sh.catalogue.deepFams)}`);
  console.log("  shown as liked / rewarded by the ranking / truly liked: " + COMMON.map(f => `${f} ${P(p.liked[f].engine)} / ${P(p.liked[f].rewarded)} / ${P(p.liked[f].hidden)}`).join("; ") + `; share of rewarded families resting on traces only ${P(p.traceOnly)}`);
  console.log(L.table(Object.entries(p.variants).map(([k, v]) => ({ variant: k, distinct: v.distinct, "top 10 share": P(v.top10Share), "effective number": v.effective.toFixed(0), "most picked": P(v.top1Visitors), "no liking in common, share a pick": P(v.pairShareApart), kept: P(v.keep), turn: P(v.turn) })),
    ["variant", "distinct", "top 10 share", "effective number", "most picked", "no liking in common, share a pick", "kept", "turn"]));
  for (const [k, v] of Object.entries(p.variants)) console.log(`  ${k}: ${v.top.map(t => `${t.name} ${P(t.visitors)}`).join("; ")}`);
  console.log("");
}
console.log(`pooled over the populations, perfumes picked at least once: engine ${out.pooled.engine}, best three ${out.pooled.oracle}, random ${out.pooled.random}`);
console.log("reachability, the share of the catalogue among the picks of a visitor whose liked families are its own:");
for (const [k, v] of Object.entries(out.reach)) console.log(`  ${k}: ${P(v.share)}; the missed: main family share ${F(v.missShape.mainShare)}, families in heart/base ${F(v.missShape.deepFams)}; e.g. ${v.missExamples.slice(0, 4).join(", ")}`);
process.stderr.write(`${((Date.now() - t0) / 1000).toFixed(0)} s\n`);
