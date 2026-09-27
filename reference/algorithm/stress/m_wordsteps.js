/* One word more, on the reading of the first version of the coverage change (ce09d2b) and on the site's. For quiz-shaped
   inputs (as c_invariants.js makes them), one note card not yet answered is enjoyed, then avoided; a step moves the
   picks against itself when what the picks read of one of the card's families moves the other way (for a family
   absent before, when it appears on the other side of zero). ce09d2b's reading is copied here: the profile as it is,
   less the families known only from traces, so a family's traces came back at full weight once a word was given.
   Usage: node m_wordsteps.js [inputs] [seed]. Writes out/m.txt. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_IN = +(process.argv[2] || 3000), SEED = +(process.argv[3] || 31);
const ctx = L.site(), { E, N } = ctx;
const firstVersion = prof => { const o = {}; for (const [f, v] of Object.entries(prof)) if (!(v.n === 0 && !(v.toldEvidence && v.toldEvidence.length))) o[f] = v; return o; };
const r9 = x => Math.round(x * 1e9) / 1e9;
const profile = inp => E.computeProfile({ ratings: inp.ratings, auto: {}, images: {}, told: N.toldItems(inp.quiz) });
const r = L.rng(SEED), hits = { first: 0, site: 0 }, examples = [];
let steps = 0;
for (let i = 0; i < N_IN; i++) {
  const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 1 + Math.floor(r() * 7)), r, { notes: 0.8, told: r() < 0.7 });
  const quiz = ses.quiz || {}, card = ctx.CARDS[(Object.keys(ses.ratings).length * 31 + JSON.stringify(quiz).length) % ctx.CARDS.length];
  if ((quiz.notes || {})[card.id]) continue;
  const p0 = profile({ ratings: ses.ratings, quiz });
  for (const dir of [1, -1]) {
    const p1 = profile({ ratings: ses.ratings, quiz: Object.assign({}, quiz, { notes: Object.assign({}, quiz.notes, { [card.id]: dir }) }) });
    steps++;
    for (const [key, view] of [["first", firstVersion], ["site", E.picksView]]) {
      const a0 = view(p0), b0 = view(p1);
      for (const f of Object.keys(card.fams || ctx.M.famsForNote(card.en) || {})) {
        const a = a0[f], b = b0[f];
        if (b && (a ? dir * (r9(b.score) - r9(a.score)) < 0 : dir * b.score < 0)) { hits[key]++; if (key === "first" && examples.length < 3) examples.push(`${card.id} ${dir > 0 ? "enjoyed" : "avoided"}: ${f} ${a ? a.score.toFixed(3) : "unmet"} to ${b.score.toFixed(3)}`); }
      }
    }
  }
}
const lines = [`${steps} word steps over ${N_IN} quiz-shaped inputs, seed ${SEED}; steps that move the picks against the word: first version's reading ${hits.first}, site's ${hits.site}`].concat(examples.map(e => "    " + e));
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "m.txt"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
