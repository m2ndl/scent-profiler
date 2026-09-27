/* Angle 1: accuracy against a known taste. Synthetic wearers with a hidden taste (lib.js) answer the quiz; the real
   engine builds their profile and picks; the hidden taste then says whether the deal-breakers found are the true ones and
   whether the picks would be kept or turn on them. Baselines: three random perfumes, the three best-selling perfumes of
   their gender they have not rated, and the best three the catalogue holds for them (an upper bound).
   Usage: node a1_accuracy.js [personas per cell] [seed]. Writes out/a1.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 1500), SEED = +(process.argv[3] || 11), K = 30;
const SEED_NOW = { v: SEED };
const ctx = L.site();

function cell(nb, depth, o) {
  const r = L.rng(SEED_NOW.v * 1000 + nb * 17 + depth.length * 3 + (o.unsureWhen != null ? Math.round(o.unsureWhen * 100) : 7));
  const acc = { label: { badLikely: { n: 0, hit: 0, neg: 0 }, badPossible: { n: 0, hit: 0, neg: 0 }, goodLikely: { n: 0, hit: 0, neg: 0 }, goodPossible: { n: 0, hit: 0, neg: 0 } },
    recallAll: [], recallExp: [], precision: [], precisionSoft: [], innocent: [], top: [], likePrec: [], likeSoft: [], likeRecall: [], hatedAsLike: [], ruinTurns: [],
    gate: [], rated: [], keep: [], turn: [], keepG: [], turnG: [], roN: [], roPrec: [], roRecall: [],
    base: { random: { keep: [], turn: [] }, popular: { keep: [], turn: [] }, oracle: { keep: [], turn: [] } } };
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(r, ctx);
    const list = nb ? L.bottles(ctx, per, r, nb, { taste: o.bottleTaste || 0 }) : [];
    const ses = L.answer(ctx, per, list, r, o);
    const res = L.run(ctx, ses);
    const bad = new Set(per.bad), like = new Set(per.like);
    const fb = L.classOf(res.prof, ["badLikely", "badPossible"]), fg = L.classOf(res.prof, ["goodLikely", "goodPossible"]);
    /* a deal-breaker is exposed when a rated bottle holds it at 0.4 or more in some stage */
    const exposed = per.bad.filter(f => Object.keys(ses.ratings).some(id => L.STAGES.some(s => ((ctx.E.byId[id].stages[s] || {})[f] || 0) >= 0.4)));
    if (per.bad.length) acc.recallAll.push(fb.filter(f => bad.has(f)).length / per.bad.length);
    if (exposed.length) acc.recallExp.push(fb.filter(f => exposed.includes(f)).length / exposed.length);
    if (fb.length) { acc.precision.push(fb.filter(f => bad.has(f)).length / fb.length); acc.precisionSoft.push(fb.filter(f => per.u[f] < 0).length / fb.length); acc.innocent.push(fb.filter(f => !bad.has(f)).length); acc.top.push(bad.has(L.byStrength(res.prof, ["badLikely", "badPossible"])[0]) ? 1 : 0); }
    if (fg.length) { acc.likePrec.push(fg.filter(f => like.has(f)).length / fg.length); acc.likeSoft.push(fg.filter(f => per.u[f] >= 0.5).length / fg.length); acc.hatedAsLike.push(fg.some(f => bad.has(f)) ? 1 : 0); }
    for (const st of ses.story) if (st.verdict === "turned" || st.verdict === "shop") acc.ruinTurns.push(st.ruin ? 1 : 0);
    /* by label, pooled over visitors: how often a family shown with that label is true (and, for deal-breakers, disliked at all) */
    for (const [f, v] of Object.entries(res.prof)) {
      const b = acc.label[v.cls]; if (!b) continue;
      b.n++; if (v.cls.startsWith("bad") ? bad.has(f) : like.has(f)) b.hit++; if (per.u[f] < 0) b.neg++;
    }
    acc.likeRecall.push(fg.filter(f => like.has(f)).length / per.like.length);
    acc.gate.push(res.gate ? 1 : 0); acc.rated.push(res.rated);
    if (res.picks.length) {
      const oc = res.picks.map(id => L.outcome(ctx.TRUTH[id], per, r, K));
      const k = L.mean(oc.map(x => x.keep)), t = L.mean(oc.map(x => x.turn));
      acc.keep.push(k); acc.turn.push(t);
      if (res.gate) { acc.keepG.push(k); acc.turnG.push(t); }
    }
    for (const [name, fn] of Object.entries(L.baselines)) {
      const ids = fn(ctx, per, ses.ratings, r);
      const oc = ids.map(id => L.outcome(ctx.TRUTH[id], per, r, K));
      acc.base[name].keep.push(L.mean(oc.map(x => x.keep))); acc.base[name].turn.push(L.mean(oc.map(x => x.turn)));
    }
    /* the result's "ruled out for you": how many, and how many of them the wearer would in truth find ruined */
    const ro = new Set(ctx.E.ruledOut(res.prof, res.avoid));
    const tb = ctx.ALL.filter(id => !ses.ratings[id] && L.pRuinLater(ctx.TRUTH[id], per) >= 0.5);
    acc.roN.push(ro.size);
    if (ro.size) acc.roPrec.push([...ro].filter(id => tb.includes(id)).length / ro.size);
    if (tb.length) acc.roRecall.push(tb.filter(id => ro.has(id)).length / tb.length);
  }
  const m = L.mean;
  return {
    bottles: nb, depth, unsureWhen: o.unsureWhen, rated: m(acc.rated), gate: m(acc.gate),
    dbRecallAll: m(acc.recallAll), dbRecallExposed: m(acc.recallExp), dbPrecision: m(acc.precision), dbPrecisionSoft: m(acc.precisionSoft), dbInnocent: m(acc.innocent), dbTopRight: m(acc.top),
    likePrecision: m(acc.likePrec), likeSoft: m(acc.likeSoft), likeRecall: m(acc.likeRecall), hatedShownAsLike: m(acc.hatedAsLike), turnsByRuin: m(acc.ruinTurns),
    pickKeep: m(acc.keep), pickTurn: m(acc.turn), pickKeepShown: m(acc.keepG), pickTurnShown: m(acc.turnG),
    randomKeep: m(acc.base.random.keep), randomTurn: m(acc.base.random.turn), popularKeep: m(acc.base.popular.keep), popularTurn: m(acc.base.popular.turn),
    oracleKeep: m(acc.base.oracle.keep), oracleTurn: m(acc.base.oracle.turn),
    ruledOut: m(acc.roN), ruledOutPrecision: m(acc.roPrec), ruledOutRecall: m(acc.roRecall),
    byLabel: Object.fromEntries(Object.entries(acc.label).map(([k, b]) => [k, { shown: b.n, true: b.n ? b.hit / b.n : NaN, dislikedAtAll: b.n ? b.neg / b.n : NaN }]))
  };
}

const DEPTH = { V: { notes: 0, told: false }, VN: { notes: 0.6, told: false }, VNT: { notes: 0.6, told: true } };
/* --seeds: the headline cell (three bottles, every answer) under five seeds, for the size of the sampling noise */
if (process.argv.includes("--seeds")) {
  const rows = [];
  for (const sd of [11, 12, 13, 14, 15]) { SEED_NOW.v = sd; rows.push(cell(3, "VNT", Object.assign({ unsureWhen: 0.25 }, DEPTH.VNT))); }
  const keys = ["dbPrecision", "dbPrecisionSoft", "dbInnocent", "dbTopRight", "likePrecision", "pickKeep", "pickTurn", "ruledOutPrecision"];
  const summary = Object.fromEntries(keys.map(k => { const v = rows.map(r => r[k]); return [k, { mean: L.mean(v), min: Math.min(...v), max: Math.max(...v) }]; }));
  summary.byLabel = Object.fromEntries(["badLikely", "badPossible", "goodLikely", "goodPossible"].map(c => { const v = rows.map(r => r.byLabel[c].true), w = rows.map(r => r.byLabel[c].dislikedAtAll); return [c, { true: { mean: L.mean(v), min: Math.min(...v), max: Math.max(...v) }, dislikedAtAll: { mean: L.mean(w), min: Math.min(...w), max: Math.max(...w) } }]; }));
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "out", "a1_seeds.json"), JSON.stringify({ personasPerCell: N_PER, seeds: [11, 12, 13, 14, 15], summary }, null, 1));
  const r3 = x => `${L.f2(x.mean)} (${L.f2(x.min)} to ${L.f2(x.max)})`;
  for (const k of keys) console.log(`${k}: ${r3(summary[k])}`);
  for (const [c, v] of Object.entries(summary.byLabel)) console.log(`${c}: true ${r3(v.true)}; disliked at all ${r3(v.dislikedAtAll)}`);
  process.exit(0);
}
const out = [];
const t0 = Date.now();
/* depth V: verdicts only; VN: with note rows on 60% of bottles; VNT: with the told answers too; T: told answers only */
for (const nb of [1, 2, 3, 5, 8]) for (const d of ["V", "VN", "VNT"]) { out.push(cell(nb, d, Object.assign({ unsureWhen: 0.25 }, DEPTH[d]))); process.stderr.write("."); }
out.push(cell(0, "T", { notes: 0, told: true, unsureWhen: 0.25 }));
/* sensitivity: how often "I don't remember" is answered to "When did it bother you?", and every note screen answered */
for (const uw of [0, 0.5]) out.push(cell(3, "VNT", Object.assign({}, DEPTH.VNT, { unsureWhen: uw })));
out.push(cell(3, "VN1T", { notes: 1, told: true, unsureWhen: 0.25 }));
/* realism of the told answers: fewer note names known, and deal-breakers blamed on their usual companion */
out.push(cell(3, "VNT-weak", Object.assign({}, DEPTH.VNT, { unsureWhen: 0.25, toldKnow: 0.2, misattr: 0.3 })));
out.push(cell(0, "T-weak", { notes: 0, told: true, unsureWhen: 0.25, toldKnow: 0.2, misattr: 0.3 }));
/* bottles owned for what the wearer likes in them (lib.js bottles, o.taste 4) */
out.push(cell(3, "VNT-liked", Object.assign({}, DEPTH.VNT, { unsureWhen: 0.25, bottleTaste: 4 })));
out.push(cell(8, "VNT-liked", Object.assign({}, DEPTH.VNT, { unsureWhen: 0.25, bottleTaste: 4 })));
process.stderr.write(` ${((Date.now() - t0) / 1000).toFixed(0)} s\n`);

fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "a1.json"), JSON.stringify({ personasPerCell: N_PER, seed: SEED, cells: out }, null, 1));
const P = L.pct;
console.log(`personas per cell: ${N_PER}, seed ${SEED}\n`);
console.log("Deal-breakers and likes found (V verdicts only, VN with note rows, VNT with the told answers too)\n");
console.log(L.table(out.map(c => ({ bottles: c.bottles, depth: c.depth, when: c.unsureWhen, rated: L.f2(c.rated), "found (all)": P(c.dbRecallAll), "found (exposed)": P(c.dbRecallExposed),
  "flagged that are true": P(c.dbPrecision), "flagged the wearer dislikes at all": P(c.dbPrecisionSoft), "innocent flagged": L.f2(c.dbInnocent), "first named is true": P(c.dbTopRight),
  "likes that are true": P(c.likePrecision), "likes at least mild": P(c.likeSoft), "likes found": P(c.likeRecall), "a hated family shown as liked": P(c.hatedShownAsLike), "turns from a deal-breaker": P(c.turnsByRuin) })),
  ["bottles", "depth", "when", "rated", "found (all)", "found (exposed)", "flagged that are true", "flagged the wearer dislikes at all", "innocent flagged", "first named is true", "likes that are true", "likes at least mild", "likes found", "a hated family shown as liked", "turns from a deal-breaker"]));
console.log("\nPicks: share of picks the wearer would keep / that would turn on them (MC, 30 wears each)\n");
console.log(L.table(out.map(c => ({ bottles: c.bottles, depth: c.depth, when: c.unsureWhen, "picks shown": P(c.gate), "engine keep": P(c.pickKeep), "engine turn": P(c.pickTurn),
  "shown keep": P(c.pickKeepShown), "shown turn": P(c.pickTurnShown), "random keep": P(c.randomKeep), "random turn": P(c.randomTurn),
  "bestsellers keep": P(c.popularKeep), "bestsellers turn": P(c.popularTurn), "best possible keep": P(c.oracleKeep), "best possible turn": P(c.oracleTurn) })),
  ["bottles", "depth", "when", "picks shown", "engine keep", "engine turn", "shown keep", "shown turn", "random keep", "random turn", "bestsellers keep", "bestsellers turn", "best possible keep", "best possible turn"]));
console.log("\n\"Ruled out for you\": the count, the share of it the wearer would find ruined, the share of ruined perfumes it catches\n");
console.log(L.table(out.map(c => ({ bottles: c.bottles, depth: c.depth, when: c.unsureWhen, "ruled out": c.ruledOut.toFixed(0), "truly ruined": P(c.ruledOutPrecision), "ruined caught": P(c.ruledOutRecall) })),
  ["bottles", "depth", "when", "ruled out", "truly ruined", "ruined caught"]));
console.log("\nBy label, pooled over visitors: the share of families shown with each label that are true (deal-breakers: also disliked at all)\n");
console.log(L.table(out.map(c => ({ bottles: c.bottles, depth: c.depth, when: c.unsureWhen,
  "Likely deal-breaker": `${P(c.byLabel.badLikely.true)} (${P(c.byLabel.badLikely.dislikedAtAll)})`, "Possible deal-breaker": `${P(c.byLabel.badPossible.true)} (${P(c.byLabel.badPossible.dislikedAtAll)})`,
  "Reliably liked": P(c.byLabel.goodLikely.true), "Probably liked": P(c.byLabel.goodPossible.true) })),
  ["bottles", "depth", "when", "Likely deal-breaker", "Possible deal-breaker", "Reliably liked", "Probably liked"]));
