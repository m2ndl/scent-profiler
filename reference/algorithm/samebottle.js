const path = require("path"); const { make, NEW } = require("./harness");
for (const [lab, root] of [["NEW", NEW]]) {
  const { D, E, N } = make(root);
  let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = a => a[Math.floor(rnd() * a.length)]; const POOL = D.QUIZ.grid.concat(D.QUIZ.more);
  let same = 0, other = 0;
  for (let i = 0; i < 4000; i++) {
    const ratings = {}; const k = 1 + Math.floor(rnd() * 3);
    for (let j = 0; j < k; j++) { const id = pick(POOL), P = E.byId[id]; const rec = { opening: null, heart: null, drydown: 1, again: 1, chips: {}, src: "quiz" };
      const na = {}; for (const row of N.questions(P, "worn")) if (rnd() < 0.5) na[row.f] = pick([-2, -1, 0, 1, 2]); if (Object.keys(na).length) rec.noteAnswers = na; ratings[id] = rec; }
    const prof = E.computeProfile({ ratings, auto: {}, images: {}, told: [] });
    for (const [f, v] of Object.entries(prof)) if (/^good/.test(v.cls)) for (const e of (v.toldEvidence || []).filter(e => e.lean === "kept")) { if (v.evidence.some(x => x.value > 0 && x.perfume.id === e.perfume.id)) same++; else other++; }
  }
  console.log(lab, "liked families with a kept dislike: like from the same bottle", same, "| from another bottle", other);
}
