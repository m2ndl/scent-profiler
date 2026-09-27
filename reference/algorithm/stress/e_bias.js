/* Angle 6: where the picks go. Over a population of synthetic wearers (three bottles, note rows and told answers), which
   perfumes the engine recommends: the other gender's perfumes (the engine does not read gender), the tiers against
   the catalogue's mix, how concentrated the picks are, and picks from the same line as a bottle the wearer rated.
   Usage: node e_bias.js [wearers] [seed]. Writes out/e.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 3000), SEED = +(process.argv[3] || 53);
const ctx = L.site(), { E } = ctx;
const opposite = (g, pg) => (g === "m" && pg === "f") || (g === "f" && pg === "m");
const word = P => (P.name.toLowerCase().match(/[a-z0-9À-ɏ']+/g) || []).find(w => !["le", "la", "l", "eau", "de", "the", "for", "men", "man", "women", "pour", "homme", "femme", "by", "no", "un"].includes(w)) || "";
const sameLine = (P, Q) => P.id !== Q.id && ((P.cloneOf && P.cloneOf === (Q.cloneOf || Q.id)) || (Q.cloneOf && Q.cloneOf === P.id) || (P.house === Q.house && word(P) && word(P) === word(Q)));

function population(depth, nb, seed) {
  const r = L.rng(seed), rows = [];
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(r, ctx), list = nb ? L.bottles(ctx, per, r, nb) : [];
    const ses = L.answer(ctx, per, list, r, depth);
    const res = L.run(ctx, ses);
    if (!res.gate) continue;
    rows.push({ per, rated: Object.keys(ses.ratings), picks: res.picks, random: L.baselines.random(ctx, per, ses.ratings, r) });
  }
  return rows;
}
function describe(rows) {
  const picks = rows.flatMap(x => x.picks), rnd = rows.flatMap(x => x.random);
  const mis = (xs, g) => xs.filter(id => opposite(g, E.byId[id].gender)).length;
  const gender = { engine: rows.reduce((n, x) => n + mis(x.picks, x.per.g), 0) / picks.length, random: rows.reduce((n, x) => n + mis(x.random, x.per.g), 0) / rnd.length,
    ownBottles: rows.reduce((n, x) => n + mis(x.rated, x.per.g), 0) / Math.max(1, rows.reduce((n, x) => n + x.rated.length, 0)) };
  const byG = g => { const rs = rows.filter(x => x.per.g === g); const ps = rs.flatMap(x => x.picks); return rs.reduce((n, x) => n + mis(x.picks, g), 0) / ps.length; };
  gender.forWomen = byG("f"); gender.forMen = byG("m");
  gender.anyOpposite = rows.filter(x => x.picks.some(id => opposite(x.per.g, E.byId[id].gender))).length / rows.length;
  const tiers = {}; for (const id of picks) tiers[E.byId[id].tier] = (tiers[E.byId[id].tier] || 0) + 1 / picks.length;
  const catTiers = {}; for (const P of E.PERFUMES) catTiers[P.tier] = (catTiers[P.tier] || 0) + 1 / E.PERFUMES.length;
  const freq = {}; for (const id of picks) freq[id] = (freq[id] || 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const gini = (() => { const v = E.PERFUMES.map(P => freq[P.id] || 0).sort((a, b) => a - b), n = v.length, s = v.reduce((a, b) => a + b, 0); let g = 0; v.forEach((x, i) => { g += (2 * (i + 1) - n - 1) * x; }); return g / (n * s); })();
  const redundant = rows.filter(x => x.picks.some(id => x.rated.some(q => sameLine(E.byId[id], E.byId[q])))).length / rows.length;
  const redEx = rows.filter(x => x.picks.some(id => x.rated.some(q => sameLine(E.byId[id], E.byId[q])))).slice(0, 5).map(x => { const id = x.picks.find(p => x.rated.some(q => sameLine(E.byId[p], E.byId[q]))); return `${E.byId[id].name} recommended to a wearer who rated ${x.rated.filter(q => sameLine(E.byId[id], E.byId[q])).map(q => E.byId[q].name).join(", ")}`; });
  return { wearers: rows.length, gender, tiers, catTiers, distinct: sorted.length, top10Share: sorted.slice(0, 10).reduce((n, [, c]) => n + c, 0) / picks.length, gini,
    top10: sorted.slice(0, 10).map(([id, c]) => `${E.byId[id].house} ${E.byId[id].name} (${E.byId[id].gender}, ${E.byId[id].tier}): ${(100 * c / rows.length).toFixed(1)}% of wearers`), redundant, redEx };
}
const out = { withBottles: describe(population({ notes: 0.6, told: true }, 3, SEED)), wordsOnly: describe(population({ notes: 0, told: true }, 0, SEED + 1)) };
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "e.json"), JSON.stringify(out, null, 1));
const P = L.pct;
for (const [k, d] of Object.entries(out)) {
  console.log(`\n${k === "withBottles" ? "Three bottles, note rows and told answers" : "Told answers only, no bottle"}: ${d.wearers} wearers shown picks`);
  console.log(`  picks of the other gender: ${P(d.gender.engine)} (for women ${P(d.gender.forWomen)}, for men ${P(d.gender.forMen)}); random picks ${P(d.gender.random)}; the wearers' own bottles ${P(d.gender.ownBottles)}; wearers with at least one: ${P(d.gender.anyOpposite)}`);
  console.log(`  tiers of the picks: ${Object.entries(d.tiers).map(([t, s]) => `${t} ${P(s)}`).join(", ")}; catalogue: ${Object.entries(d.catTiers).map(([t, s]) => `${t} ${P(s)}`).join(", ")}`);
  console.log(`  ${d.distinct} distinct perfumes picked; the ten most picked take ${P(d.top10Share)} of all picks; Gini ${d.gini.toFixed(2)}`);
  for (const t of d.top10) console.log("    " + t);
  if (k === "withBottles") { console.log(`  wearers given a pick from the same line as a bottle they rated: ${P(d.redundant)}`); for (const e of d.redEx) console.log("    " + e); }
}
