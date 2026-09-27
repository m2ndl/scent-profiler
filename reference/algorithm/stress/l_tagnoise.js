/* Angle 11: pick quality when the catalogue's tags are wrong. The tags are machine-made (REPORT.md section 7), so the
   engine may read a perfume differently from how it smells. Here the synthetic visitors smell the catalogue's tags
   (the truth), while the engine, for their note rows, profile and picks, reads the tags with every weight shaken by
   15% or 30% (seeded). The ranking of commit 0164d00 and the site's ranking (rank_trial.js, the adopted switches) are
   scored on the same visitors: picks kept and turning under the truth, and the most picked perfume's share of visitors.
   Usage: node l_tagnoise.js [visitors] [seed]. Writes out/l.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const { ranker } = require("./rank_trial");
const N_PER = +(process.argv[2] || 2000), SEED = +(process.argv[3] || 307), K = 30;
const RULES = { "ranking of 0164d00": {}, "site ranking": { agg: "likes once", traces: "unmet", side: "kept, else tried", r9: true } };
function hashSeed(...xs) { let h = 2166136261; for (const c of xs.join("|")) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const base = L.site(), out = { visitors: N_PER, seed: SEED, levels: {} };
for (const noise of [0, 0.15, 0.3]) {
  const r0 = L.rng(SEED + Math.round(noise * 100));
  /* the engine's view: every weight times (1 + noise x N(0,1)), held within 0.05 and 1; the visitors smell base.E */
  const ctx = noise ? L.site({ truth: base.E.byId, perfumes: list => list.map(P => Object.assign({}, P, { stages: Object.fromEntries(L.STAGES.map(s => [s, Object.fromEntries(Object.entries(P.stages[s] || {}).map(([f, w]) => [f, L.clamp(w * (1 + noise * L.normal(r0)), 0.05, 1)]))])) })) }) : base;
  const rank = Object.fromEntries(Object.entries(RULES).map(([k, o]) => [k, ranker(ctx.E, ctx.D.STAGE_W, o)]));
  const r = L.rng(SEED), acc = Object.fromEntries(Object.keys(RULES).map(k => [k, { keep: [], turn: [], freq: {} }]));
  let shown = 0;
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 3), r, { notes: 0.6, told: true });
    const res = L.run(ctx, ses); if (!res.gate) continue;
    shown++;
    for (const [k, f] of Object.entries(rank)) {
      const picks = f(res.prof, ses.ratings, res.avoid);
      const oc = picks.map(id => L.outcome(base.E.byId[id], per, L.rng(hashSeed(noise, i, id)), K));
      acc[k].keep.push(L.mean(oc.map(o => o.keep))); acc[k].turn.push(L.mean(oc.map(o => o.turn)));
      for (const id of picks) acc[k].freq[id] = (acc[k].freq[id] || 0) + 1;
    }
  }
  out.levels[noise] = { shown, rules: Object.fromEntries(Object.entries(acc).map(([k, a]) => { const top = Object.entries(a.freq).sort((x, y) => y[1] - x[1])[0]; return [k, { keep: L.mean(a.keep), turn: L.mean(a.turn), mostPicked: `${base.E.byId[top[0]].name} ${(100 * top[1] / shown).toFixed(0)}%` }]; })) };
  process.stderr.write(`noise ${noise} done\n`);
}
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "l.json"), JSON.stringify(out, null, 1));
console.log(`${N_PER} visitors (three bottles, every answer), seed ${SEED}; the engine reads shaken tags, the visitors smell the catalogue's\n`);
console.log(L.table(Object.entries(out.levels).flatMap(([n, l]) => Object.entries(l.rules).map(([k, v]) => ({ "tags shaken": `${Math.round(n * 100)}%`, ranking: k, kept: L.pct(v.keep), turn: L.pct(v.turn), "most picked": v.mostPicked }))),
  ["tags shaken", "ranking", "kept", "turn", "most picked"]));
