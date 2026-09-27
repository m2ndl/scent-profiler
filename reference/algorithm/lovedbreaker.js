"use strict";
const { make, NEW, OLD } = require("./harness");
for (const [lab, root] of [["OLD", OLD], ["NEW", NEW]]) {
  const M = make(root); const { D, E, N } = M;
  let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const POOL = D.QUIZ.grid.concat(D.QUIZ.more);
  let n = 0, hits = 0, ex = [];
  for (let i = 0; i < 4000; i++) {
    const ratings = {}; const k = 1 + Math.floor(rnd() * 3);
    for (let j = 0; j < k; j++) {
      const id = pick(POOL), P = E.byId[id], r = rnd();
      const rec = { opening: null, heart: null, drydown: null, again: null, chips: {}, src: "quiz" };
      if (r < 0.5) { rec.drydown = 1; rec.again = 1; } else if (r < 0.85) { rec[pick(["opening", "heart", "drydown", "drydown"])] = -2; rec.again = 0; } else rec.opening = -1;
      const na = {}; for (const row of N.questions(P, rec.opening === -1 && rec.heart == null && rec.drydown == null ? "shop" : "worn")) if (rnd() < 0.5) na[row.f] = pick([-2, -1, 0, 1, 2]);
      if (Object.keys(na).length) rec.noteAnswers = na; ratings[id] = rec;
    }
    const prof = E.computeProfile({ ratings, auto: {}, images: {}, told: [] }); n++;
    for (const [f, v] of Object.entries(prof)) if (v.cls === "badPossible" || v.cls === "badLikely") {
      const loved = Object.entries(ratings).filter(([id, r]) => (r.noteAnswers || {})[f] > 0);
      if (loved.length && v.evidence.every(e => loved.some(([id]) => id === e.perfume.id))) { hits++; if (ex.length < 2) ex.push(`${f}: ${JSON.stringify(ratings)}`); }
    }
  }
  console.log(lab, "profiles", n, "deal-breakers resting only on bottles where that note was liked/loved:", hits); console.log(ex.join("\n"));
}
