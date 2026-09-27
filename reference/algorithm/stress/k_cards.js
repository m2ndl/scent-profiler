/* Angle 10: what the pick cards claim from traces, on the engine of commit 0164d00 and on the site's engine. A family is
   known only from traces when no rated bottle holds it at 0.4 or more and the visitor never spoke of it (engine.js
   traceOnly). Counted over synthetic visitors (three bottles, note rows and told answers): pick cards whose "Has X,
   which you like" names such a family, and cards whose thing to watch says the visitor's answers lean against one.
   Also: groups of catalogue perfumes whose tags are identical, where a tie in the picks goes to the one listed first.
   Usage: node k_cards.js [visitors] [seed]. Writes out/k.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 1500), SEED = +(process.argv[3] || 5);
const OLD = require("child_process").execSync("git show 0164d00:site/js/engine.js", { cwd: L.ROOT, encoding: "utf8" });
const traceOnly = v => !!v && v.n === 0 && !(v.toldEvidence && v.toldEvidence.length);

function count(ctx) {
  const r = L.rng(SEED), out = { visitors: 0, cards: 0, likeFromTrace: 0, leanFromTrace: 0, examples: [] };
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 3), r, { notes: 0.6, told: true });
    const res = L.run(ctx, ses); if (!res.gate) continue;
    out.visitors++;
    for (const p of res.rec.picks) {
      out.cards++;
      const likes = p.reason.likes.filter(f => traceOnly(res.prof[f]));
      if (likes.length) { out.likeFromTrace++; if (out.examples.length < 4) out.examples.push(`${p.P.name}: "Has ${likes.join(", ")}, which you like"`); }
      const w = p.reason.watch;
      if (w && w.kind === "lean" && traceOnly(res.prof[w.f])) out.leanFromTrace++;
    }
  }
  return out;
}
const before = count(L.site({ engineSource: OLD })), after = count(L.site());
const ctx = L.site(), groups = {};
for (const P of ctx.E.PERFUMES) (groups[JSON.stringify(P.stages)] = groups[JSON.stringify(P.stages)] || []).push(`${P.house} ${P.name}`);
const identical = Object.values(groups).filter(g => g.length > 1);
const out = { visitors: N_PER, seed: SEED, before, after, identical };
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "k.json"), JSON.stringify(out, null, 1));
for (const [k, v] of [["engine of 0164d00", before], ["site engine", after]]) {
  console.log(`${k}: ${v.visitors} visitors shown picks, ${v.cards} pick cards; "which you like" naming a family known only from traces: ${v.likeFromTrace} (${L.pct(v.likeFromTrace / v.cards)}); "your answers lean against" one: ${v.leanFromTrace}`);
  for (const e of v.examples) console.log("    " + e);
}
console.log(`groups of perfumes with identical tags: ${identical.length}`);
for (const g of identical) console.log("    " + g.join(" = "));
