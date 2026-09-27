/* Angle 10: what the pick cards claim, on the engine of commit 0164d00, on ce09d2b (the first version of the coverage
   change, which let a family's traces back in at full weight once the visitor gave a word on it) and on the site's
   engine. A family is known only from traces when no rated stage holds it at 0.4 or more and the visitor never spoke
   of it. Counted over synthetic visitors (three bottles, note rows and told answers): pick cards whose "Has X, which
   you like" names such a family, cards whose thing to watch says the visitor's answers lean against one, and cards
   that say the opposite of the visitor's own words (a like when every word on the family is against it, or "your
   answers lean against" when every word is for it). Also: groups of catalogue perfumes whose tags are identical,
   where a tie in the picks goes to the one listed first. Usage: node k_cards.js [visitors] [seed]. Writes out/k.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 1500), SEED = +(process.argv[3] || 5);
const src = c => require("child_process").execSync(`git show ${c}:site/js/engine.js`, { cwd: L.ROOT, encoding: "utf8" });
const traceOnly = v => !!v && v.n === 0 && !(v.toldEvidence && v.toldEvidence.length);
const words = v => ((v && v.toldEvidence) || []);

function count(ctx) {
  const r = L.rng(SEED), out = { visitors: 0, cards: 0, likeFromTrace: 0, leanFromTrace: 0, againstWords: 0, examples: [] };
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
      const likeAgainst = p.reason.likes.some(f => { const v = res.prof[f]; return v.n === 0 && words(v).length && words(v).every(e => e.value < 0); });
      const leanAgainst = w && w.kind === "lean" && words(res.prof[w.f]).length && words(res.prof[w.f]).every(e => e.value > 0);
      if (likeAgainst || leanAgainst) out.againstWords++;
    }
  }
  return out;
}
const runs = { "engine of 0164d00": count(L.site({ engineSource: src("0164d00") })), "ce09d2b": count(L.site({ engineSource: src("ce09d2b") })), "site engine": count(L.site()) };
const ctx = L.site(), groups = {};
for (const P of ctx.E.PERFUMES) (groups[JSON.stringify(P.stages)] = groups[JSON.stringify(P.stages)] || []).push(`${P.house} ${P.name}`);
const identical = Object.values(groups).filter(g => g.length > 1);
const out = { visitors: N_PER, seed: SEED, runs, identical };
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "k.json"), JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(runs)) {
  console.log(`${k}: ${v.visitors} visitors shown picks, ${v.cards} pick cards; "which you like" naming a family known only from traces: ${v.likeFromTrace} (${L.pct(v.likeFromTrace / v.cards)}); "your answers lean against" one: ${v.leanFromTrace}; cards saying the opposite of the visitor's words: ${v.againstWords}`);
  for (const e of v.examples) console.log("    " + e);
}
console.log(`groups of perfumes with identical tags: ${identical.length}`);
for (const g of identical) console.log("    " + g.join(" = "));
