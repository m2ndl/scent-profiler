"use strict";
const { make, NEW } = require("./harness");
const { D, E, N } = make(NEW);
const blank = { opening: null, heart: null, drydown: null, again: null, chips: {} };
const still = na => Object.assign({}, blank, { drydown: 1, again: 1, src: "quiz" }, na ? { noteAnswers: na } : {});
const POOL = D.QUIZ.grid;
const out = { leanKept: [], leanOpening: [] };
for (const a of POOL) for (const b of POOL) {
  if (a === b) continue;
  const PA = E.byId[a]; if (!PA) continue;
  for (const row of N.questions(PA, "worn")) {
    const f = row.f, st = E.strongestStage(PA, f);
    for (const val of st === "opening" ? [2] : [-2]) {
      const ratings = { [a]: still({ [f]: val }), [b]: still() };
      const prof = E.computeProfile({ ratings, auto: {}, images: {}, told: [] });
      const rec = E.recommend(prof, ratings, []);
      for (const p of rec.picks) if (p.reason.watch && (p.reason.watch.kind === "leanKept" || p.reason.watch.kind === "leanOpening"))
        out[p.reason.watch.kind].push(`${a}+${b} ${f}=${val} -> ${p.P.id} (${p.reason.watch.s}) likes:${p.reason.likes.join(",")}`);
    }
  }
}
for (const [k, v] of Object.entries(out)) console.log(k, v.length, "\n  " + v.slice(0, 12).join("\n  "));
