/* Which perfumes the quiz recommends most often, across many simulated visitors, and whether their weights for the
   families the new rules act on agree with their own note lists. */
const ROOT = "C:/Users/malha/Desktop/Webapps/perfume-profiler";
const { loadSite } = require(ROOT + "/tools/lib/site");
const W = loadSite("data", "mapper", "materials", "evidence", "engine", "notes");
const D = W.PP_DATA, M = W.PP_MAP, E = W.PP_ENGINE.create(D, M, W.PP_EVIDENCE), N = W.PP_NOTES.create(D, M, E);
const blank = { opening: null, heart: null, drydown: null, again: null, chips: {} };
const g = D.QUIZ.grid, cards = D.QUIZ.notePicker.flatMap(s => s.notes).map(n => n.id);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const count = {};
for (let run = 0; run < 6000; run++) {
  const r = {}, shuffled = g.slice().sort(() => rnd() - .5), k = 1 + Math.floor(rnd() * 4);
  for (const id of shuffled.slice(0, k)) r[id] = Object.assign({}, blank, rnd() < .65 ? { drydown: 1, again: 1 } : { drydown: -2, again: 0 });
  const notes = {}; for (let i = 0; i < 4; i++) notes[cards[Math.floor(rnd() * cards.length)]] = rnd() < .5 ? 1 : -1;
  const quiz = { notes, taste: ["sweet", "bitter", "unsure"][Math.floor(rnd() * 3)] };
  const prof = E.computeProfile({ ratings: r, auto: {}, images: {}, told: N.toldItems(quiz) });
  for (const p of E.recommend(prof, r).picks) count[p.P.id] = (count[p.P.id] || 0) + 1;
}
const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 30);
const FAMS = ["white_musk", "vanilla_gourmand", "woody_amber", "oud_smoky", "rose"];
const STAGES = ["opening", "heart", "drydown"];
const flags = [];
console.log("rank  shown  id                  weights (o/h/d) for musk, vanilla, ambroxan, oud, rose");
top.forEach(([id, c], i) => {
  const P = E.byId[id];
  const lists = (P.notes.en || "").split("/").map(s => s.split(",").map(x => x.trim()).filter(Boolean));
  const fromNotes = STAGES.map((s, k) => { const acc = {}; for (const n of lists[k] || []) for (const [f, w] of Object.entries(M.famsForNote(n) || {})) acc[f] = Math.max(acc[f] || 0, w); return acc; });
  const cells = FAMS.map(f => STAGES.map(s => (P.stages[s][f] || 0).toFixed(1).replace("0.0", "-")).join("/"));
  console.log(String(i + 1).padStart(4), String(c).padStart(6), " ", id.padEnd(18), cells.join("  "));
  for (const f of FAMS) STAGES.forEach((s, k) => {
    const w = P.stages[s][f] || 0, nw = fromNotes[k][f] || 0;
    if (w >= .5 && nw === 0 && !STAGES.some((s2, k2) => (fromNotes[k2][f] || 0) >= .5)) flags.push(`${id}: ${f} ${w} in the ${s}, but no listed note maps to it anywhere (${P.notes.en})`);
    if (nw >= .8 && w < .3) flags.push(`${id}: a ${s} note maps to ${f} at ${nw}, but the ${s} weight is ${w} (${P.notes.en})`);
  });
});
console.log("\nflags:", flags.length); for (const f of flags) console.log(" - " + f);
