/* Angle 5: what the catalogue lets the quiz tell apart. No wearers here, only the catalogue's structure: how many
   families a bottle that turned accuses, whether the narrowing round (quiz grid) or the one-sample suggestion
   (whole catalogue) can separate them, which families almost always travel together, and which palate each of the
   sixty quiz bottles votes for when a visitor keeps it ("I still wear it" writes the base only).
   Usage: node d_identify.js. Writes out/d.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const ctx = L.site(), { E, D } = ctx;
const GROUPS = L.palateGroups(), groupOf = f => Object.keys(GROUPS).find(g => GROUPS[g].includes(f));
const famName = f => D.FAMILIES[f].en.replace(/\s*\([^)]*\)/g, "");
const dry = (P, f) => (P.stages.drydown || {})[f] || 0;
const out = {};

/* 1. how common each family is at 0.4 or more in the base */
out.ubiquity = ctx.FAMS.map(f => ({ f, base: E.PERFUMES.filter(P => dry(P, f) >= 0.4).length / E.PERFUMES.length,
  heartOrBase: E.PERFUMES.filter(P => ["heart", "drydown"].some(s => ((P.stages[s] || {})[f] || 0) >= 0.4)).length / E.PERFUMES.length }))
  .sort((a, b) => b.base - a.base);
/* the four most common base families together, and how many families a turned base accuses across the whole catalogue */
out.fourCommon = out.ubiquity.slice(0, 4).map(u => u.f);
out.holdOneOfFour = E.PERFUMES.filter(P => out.fourCommon.some(f => dry(P, f) >= 0.4)).length / E.PERFUMES.length;
out.meanSuspectsCatalogue = L.mean(E.PERFUMES.map(P => Object.values(P.stages.drydown || {}).filter(w => w >= 0.4).length));

/* 2 and 3. the sixty quiz bottles: families a base that turned accuses, and whether each can be separated */
const GRID = new Set(D.QUIZ.grid);
out.bottles = ctx.POP.map(id => {
  const P = E.byId[id], st = P.stages.drydown || {};
  const suspects = Object.keys(st).filter(f => st[f] >= 0.4);
  const sep = suspects.map(f => {
    const others = suspects.filter(o => o !== f);
    const ok = Q => Q.id !== id && dry(Q, f) >= 0.6 && others.every(o => dry(Q, o) < 0.2);
    return { f, grid: D.QUIZ.grid.filter(g => E.byId[g] && ok(E.byId[g])).length, catalogue: E.PERFUMES.filter(ok).length };
  });
  /* the palate a kept bottle votes for: the group of its strongest base family (liked by the base's +1) */
  const top = Object.entries(st).sort((a, b) => b[1] - a[1])[0];
  return { id, name: P.name, grid: GRID.has(id), suspects: suspects.length, sep, vote: top ? groupOf(top[0]) : null, voteFam: top ? top[0] : null };
});
const pairs = out.bottles.flatMap(b => b.sep);
out.separable = { pairs: pairs.length, byGrid: pairs.filter(p => p.grid > 0).length / pairs.length, byCatalogue: pairs.filter(p => p.catalogue > 0).length / pairs.length,
  singleSuspect: out.bottles.filter(b => b.suspects === 1).length, meanSuspects: L.mean(out.bottles.map(b => b.suspects)) };
out.votes = {}; for (const b of out.bottles) out.votes[b.vote] = (out.votes[b.vote] || 0) + 1;
out.voteFams = {}; for (const b of out.bottles) out.voteFams[b.voteFam] = (out.voteFams[b.voteFam] || 0) + 1;
/* the same vote over the whole catalogue, and each group's share of the catalogue's heart and base weight for comparison */
out.votesAll = {};
for (const P of E.PERFUMES) { const top = Object.entries(P.stages.drydown || {}).sort((a, b) => b[1] - a[1])[0]; const g = top ? groupOf(top[0]) : "none"; out.votesAll[g] = (out.votesAll[g] || 0) + 1; }
out.weightAll = {};
for (const P of E.PERFUMES) for (const s of ["heart", "drydown"]) for (const [f, w] of Object.entries(P.stages[s] || {})) { const g = groupOf(f); out.weightAll[g] = (out.weightAll[g] || 0) + w; }
{ const tw = Object.values(out.weightAll).reduce((a, b) => a + b, 0); for (const g of Object.keys(out.weightAll)) out.weightAll[g] = +(out.weightAll[g] / tw).toFixed(3); }

/* 4. families that travel together: of the perfumes holding f at 0.5 or more in the base, the share also holding g at 0.4 or more there */
out.companions = [];
for (const f of ctx.FAMS) {
  const hold = E.PERFUMES.filter(P => dry(P, f) >= 0.5); if (hold.length < 15) continue;
  for (const g of ctx.FAMS) if (g !== f) { const share = hold.filter(P => dry(P, g) >= 0.4).length / hold.length; if (share >= 0.4) out.companions.push({ f, g, n: hold.length, share }); }
}
out.companions.sort((a, b) => b.share - a.share);

fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "d.json"), JSON.stringify(out, null, 1));
const P = L.pct;
console.log("Families most often in the base (0.4 or more), share of the 1,000 perfumes\n");
console.log(L.table(out.ubiquity.slice(0, 10).map(u => ({ family: famName(u.f), base: P(u.base), "heart or base": P(u.heartOrBase) })), ["family", "base", "heart or base"]));
console.log(`\n${P(out.holdOneOfFour)} of the catalogue holds at least one of the four most common (${out.fourCommon.map(famName).join(", ")}) at 0.4 or more in the base; a base holds ${out.meanSuspectsCatalogue.toFixed(2)} families at 0.4 or more on average across the catalogue.`);
console.log(`\nThe sixty quiz bottles: a base that turned accuses ${out.separable.meanSuspects.toFixed(1)} families on average; ${out.separable.singleSuspect} bottles accuse one only.`);
console.log(`Of the ${out.separable.pairs} (bottle, accused family) pairs, the narrowing round's grid holds a bottle that separates the family for ${P(out.separable.byGrid)}; the whole catalogue for ${P(out.separable.byCatalogue)}.\n`);
console.log("Palate each quiz bottle votes for when kept (its strongest base family's group):", JSON.stringify(out.votes));
console.log("Families behind those votes:", JSON.stringify(out.voteFams));
console.log("The same vote over all 1,000 perfumes:", JSON.stringify(out.votesAll));
console.log("Each group's share of all heart and base weight in the catalogue:", JSON.stringify(out.weightAll), "\n");
console.log("Families that travel together in the base\n");
console.log(L.table(out.companions.slice(0, 14).map(c => ({ "with f at 0.5+": famName(c.f), "perfumes": c.n, "also g at 0.4+": famName(c.g), share: P(c.share) })), ["with f at 0.5+", "perfumes", "also g at 0.4+", "share"]));
console.log("\nQuiz grid bottles (the narrowing round draws on these): accused families and separators in the grid / catalogue\n");
console.log(L.table(out.bottles.filter(b => b.grid).map(b => ({ bottle: b.name, accused: b.sep.map(s => `${famName(s.f)} (${s.grid}/${s.catalogue})`).join("; ") || "none", "votes for": b.vote })), ["bottle", "accused", "votes for"]));
