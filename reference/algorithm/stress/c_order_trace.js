/* The rating-order cases found by c_invariants.js (out/c.json), traced: which family changes class, with its two scores,
   and whether the picks change as a set or only in order. Usage: node c_order_trace.js. Writes out/c_order.txt. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const ctx = L.site(), { E } = ctx;
const c = JSON.parse(fs.readFileSync(path.join(__dirname, "out", "c.json"), "utf8"));
const lines = [];
for (const k of Object.keys(c.examples).filter(k => k.endsWith("result depends on rating order"))) for (const ex of c.examples[k]) {
  const ratings = JSON.parse(ex);
  const run = r => { const prof = E.computeProfile({ ratings: r, auto: {}, images: {}, told: [] }); return { prof, picks: E.recommend(prof, r, []).picks.map(p => p.P.id) }; };
  const a = run(ratings), rev = {}; for (const id of Object.keys(ratings).reverse()) rev[id] = ratings[id];
  const b = run(rev);
  const diff = Object.keys(a.prof).filter(f => a.prof[f].cls !== (b.prof[f] || {}).cls).map(f => `${f} ${a.prof[f].cls} at ${a.prof[f].score} against ${(b.prof[f] || {}).cls} at ${(b.prof[f] || {}).score}`);
  const same = a.picks.join() === b.picks.join(), sameSet = a.picks.slice().sort().join() === b.picks.slice().sort().join();
  lines.push(`${k.split(":")[0]}: ${diff.join("; ") || "no class change without the told answers"}; picks ${same ? "identical" : sameSet ? "the same three in another order" : "differ"}`);
}
fs.writeFileSync(path.join(__dirname, "out", "c_order.txt"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
