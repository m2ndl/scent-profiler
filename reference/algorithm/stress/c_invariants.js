/* Angle 4: the engine's own promises, checked on tens of thousands of inputs. Two populations: quiz-shaped records from
   synthetic wearers (lib.js), and profiler-shaped records with any stage values, chips, note answers and "didn't
   notice", plus random note-picker, taste and complaint answers. Each input is also re-run with its ratings in another
   key order, and worsened or improved by one step, to check that the result does not depend on order and moves the right
   way. Usage: node c_invariants.js [inputs per population] [seed]. Writes out/c.json with counts and examples. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_IN = +(process.argv[2] || 20000), SEED = +(process.argv[3] || 31);
const ctx = L.site(), { E, N, D } = ctx;
const S = L.STAGES;
const RANK = { badLikely: 0, badPossible: 1, mixed: 2, neutral: 2, goodPossible: 3, goodLikely: 4 };
const atStrength = (s, w) => (s === "drydown" && w >= 0.5) || (s === "heart" && w >= 0.7);
const leads = (P, f, s) => { const st = P.stages[s] || {}, w = st[f] || 0; return w >= 0.7 && w >= Math.max(...Object.values(st)); };

const tally = {}, examples = {};
const hit = (k, ex) => { tally[k] = (tally[k] || 0) + 1; (examples[k] = examples[k] || []).length < 3 && examples[k].push(ex); };
const seen = {}; const count = k => { seen[k] = (seen[k] || 0) + 1; };

function randomInput(r) {
  const v = () => [null, null, -2, -1, 0, 1, 2][Math.floor(r() * 7)];
  const ratings = {};
  for (const id of L.sample(r, ctx.ALL, 1 + Math.floor(r() * 10))) {
    const P = E.byId[id], fams = [...new Set(S.flatMap(s => Object.keys(P.stages[s] || {})))];
    const rec = { opening: v(), heart: v(), drydown: v(), again: [1, 0, null][Math.floor(r() * 3)], chips: {} };
    for (const s of S) if (r() < 0.2) rec.chips[s] = L.sample(r, D.CHIPS.map(c => c.id), 1 + Math.floor(r() * 2));
    if (r() < 0.5) { rec.noteAnswers = {}; for (const f of L.sample(r, fams, 1 + Math.floor(r() * 3))) rec.noteAnswers[f] = [-2, -1, 0, 1, 2][Math.floor(r() * 5)]; }
    if (r() < 0.2) rec.unnoticed = L.sample(r, fams, 1);
    ratings[id] = rec;
  }
  const quiz = { notes: {}, taste: ["bitter", "sweet", "both", "unsure"][Math.floor(r() * 4)], told: L.sample(r, D.CHIPS.map(c => c.id), Math.floor(r() * 3)) };
  for (const c of L.sample(r, ctx.CARDS, Math.floor(r() * 6))) quiz.notes[c.id] = r() < 0.5 ? 1 : -1;
  return { ratings, quiz };
}
function quizInput(r) {
  const per = L.persona(r, ctx);
  const ses = L.answer(ctx, per, L.bottles(ctx, per, r, 1 + Math.floor(r() * 7)), r, { notes: 0.8, told: r() < 0.7 });
  return { ratings: ses.ratings, quiz: ses.quiz };
}
const engine = inp => {
  const told = N.toldItems(inp.quiz), avoid = N.avoidedNotes(inp.quiz);
  const prof = E.computeProfile({ ratings: inp.ratings, auto: {}, images: {}, told });
  return { prof, rec: E.recommend(prof, inp.ratings, avoid), avoid };
};
const brief = inp => JSON.stringify(Object.fromEntries(Object.entries(inp.ratings).map(([id, r]) => [id, Object.fromEntries(Object.entries(r).filter(([k, v]) => v != null && k !== "src" && !(k === "chips" && !Object.keys(v).length)))])));
/* the classes by family (sorted, since the profile's key order follows the evidence) and the picks in their order */
const sig = out => JSON.stringify({ c: Object.keys(out.prof).sort().map(f => f + ":" + out.prof[f].cls), p: out.rec.picks.map(p => p.P.id) });

function check(inp, pop) {
  let out;
  try { out = engine(inp); } catch (e) { hit(pop + ": engine throws", String(e.stack).split("\n").slice(0, 2).join(" ") + " " + brief(inp)); return; }
  const { prof, rec, avoid } = out;
  count(pop);
  for (const [f, v] of Object.entries(prof)) if (!Number.isFinite(v.score) || Math.abs(v.score) > 2.5) hit(pop + ": score out of range", `${f} ${v.score} ${brief(inp)}`);
  const likely = Object.entries(prof).filter(([, v]) => v.cls === "badLikely").map(([f]) => f);
  const badAny = Object.entries(prof).filter(([, v]) => v.cls === "badLikely" || v.cls === "badPossible").map(([f]) => f);
  const houses = new Set(), lines = new Set();
  const ruled = new Set(E.ruledOut(prof, avoid));
  for (const p of rec.picks) {
    const P = p.P;
    if (inp.ratings[P.id]) hit(pop + ": pick already rated", P.id);
    if (houses.has(P.house)) hit(pop + ": two picks from one house", P.id); houses.add(P.house);
    const key = P.cloneOf || P.id; if (lines.has(key)) hit(pop + ": a clone beside its original", P.id); lines.add(key);
    for (const f of likely) for (const s of S) if (atStrength(s, P.stages[s][f] || 0)) hit(pop + ": pick holds a likely deal-breaker", `${P.id} ${f}`);
    if (ruled.has(P.id)) { count(pop + ": picks counted in 'ruled out'"); }
    count(pop + ": picks");
    const rs = p.reason;
    /* "Free of X": X is a deal-breaker under 0.2 in the pick's base; say how often X is in the heart or opening */
    for (const f of rs.clear) {
      count(pop + ": 'free of' lines");
      const hw = P.stages.heart[f] || 0, ow = P.stages.opening[f] || 0;
      if (hw >= 0.3 || ow >= 0.3) hit(pop + ": 'free of X' while X is 0.3+ in the heart or opening", `${P.id} free of ${f}: heart ${hw}, opening ${ow}, base ${P.stages.drydown[f] || 0}`);
      if (rs.watch && rs.watch.f === f) hit(pop + ": 'free of X' and 'watch for X' on one pick", `${P.id} ${f} watch ${rs.watch.kind}`);
    }
    for (const f of rs.likes) { if (badAny.includes(f)) hit(pop + ": a deal-breaker given as a reason to like", `${P.id} ${f}`); if (Math.max(P.stages.heart[f] || 0, P.stages.drydown[f] || 0) < 0.4) hit(pop + ": a like named but weak in the pick", `${P.id} ${f}`); }
    if (rs.watch && (P.stages[rs.watch.s] || {})[rs.watch.f] == null) hit(pop + ": watch names a stage that lacks the family", `${P.id} ${rs.watch.f} ${rs.watch.s} ${rs.watch.kind}`);
  }
  /* the same bottle's word on a family is never outvoted by its own stage ratings */
  for (const [f, v] of Object.entries(prof)) {
    const bad = v.cls === "badLikely" || v.cls === "badPossible", good = v.cls === "goodLikely" || v.cls === "goodPossible";
    if (!bad && !good) continue;
    for (const [id, r] of Object.entries(inp.ratings)) {
      const a = (r.noteAnswers || {})[f]; if (!Number.isFinite(a) || !a || (r.unnoticed || []).includes(f)) continue;
      const ev = v.evidence.filter(e => e.perfume && e.perfume.id === id);
      if (bad && a > 0 && ev.some(e => e.value < 0)) {
        /* would the class survive without this bottle's disagreeing ratings? */
        const drop = Object.assign({}, inp.ratings); drop[id] = Object.assign({}, r); for (const s of S) if (s !== E.strongestStage(E.byId[id], f) && (drop[id][s] || 0) < 0) drop[id][s] = null;
        const cls2 = (engine({ ratings: drop, quiz: inp.quiz }).prof[f] || {}).cls;
        hit(pop + ": a note the wearer loved in a bottle counts against it through that bottle's other stage", `${f} ${v.cls}${cls2 !== v.cls ? " (" + (cls2 || "none") + " without it)" : ""}: ${id} ${brief({ ratings: { [id]: r } })}`);
        if (cls2 !== v.cls) count(pop + ": ... and it decides the class");
      }
      if (good && a < 0 && ev.some(e => e.value > 0)) hit(pop + ": a note the wearer disliked in a bottle counts for it through that bottle's other stage", `${f} ${v.cls}: ${id} ${brief({ ratings: { [id]: r } })}`);
    }
  }
  /* order: the same ratings in another key order */
  const keys = Object.keys(inp.ratings);
  if (keys.length > 1) {
    const r2 = {}; for (const k of keys.slice().reverse()) r2[k] = inp.ratings[k];
    const o2 = engine({ ratings: r2, quiz: inp.quiz });
    if (sig(o2) !== sig(out)) hit(pop + ": result depends on rating order", brief(inp));
  }
  /* one step worse or better on one stage of one bottle: no family's class moves the other way */
  if (!keys.length) return;
  const id = keys[0], rr = inp.ratings[id], st = S.find(s => rr[s] != null);
  if (st) for (const dir of [-1, 1]) {
    const nv = rr[st] + dir; if (nv < -2 || nv > 2) continue;
    const r2 = Object.assign({}, inp.ratings, { [id]: Object.assign({}, rr, { [st]: nv }) });
    const o2 = engine({ ratings: r2, quiz: inp.quiz });
    const P = E.byId[id];
    for (const f of Object.keys(P.stages[st] || {})) {
      const a = RANK[(out.prof[f] || {}).cls || "neutral"], b = RANK[(o2.prof[f] || {}).cls || "neutral"];
      if ((dir < 0 && b > a) || (dir > 0 && b < a)) hit(pop + `: rating ${dir < 0 ? "lowered" : "raised"} moves a family of that stage the other way`, `${id} ${st} ${rr[st]}->${nv}: ${f} ${(out.prof[f] || {}).cls}->${(o2.prof[f] || {}).cls} ${brief({ ratings: { [id]: rr } })}`);
    }
  }
}

const t0 = Date.now();
const r = L.rng(SEED);
for (let i = 0; i < N_IN; i++) { check(quizInput(r), "quiz"); check(randomInput(r), "profiler"); }
/* hostile storage: values the pages never write but a hand-edited or corrupted store could hold */
const hostile = [
  { name: "rating 99", ratings: { sauvageedp: { opening: null, heart: null, drydown: 99, chips: {} }, yara: { drydown: -2, chips: {} } } },
  { name: "rating as a string", ratings: { sauvageedp: { drydown: "2", chips: {} }, yara: { drydown: "-2", chips: {} } } },
  { name: "note answer 1e6", ratings: { sauvageedp: { drydown: 1, again: 1, chips: {}, noteAnswers: { woody_amber: 1e6 } }, yara: { drydown: 1, chips: {} } } },
  { name: "chips not a list", ratings: { sauvageedp: { drydown: -2, chips: { drydown: "sweet" } }, yara: { drydown: 1, chips: {} } } },
  { name: "unknown perfume id", ratings: { nosuchperfume: { drydown: -2, chips: {} }, yara: { drydown: 1, chips: {} } } },
  { name: "record without chips", ratings: { sauvageedp: { drydown: -2 }, yara: { drydown: 1 } } },
  { name: "unnoticed as a string", ratings: { sauvageedp: { drydown: -2, unnoticed: "woody_amber", chips: {} }, yara: { drydown: 1, chips: {} } } }
];
const hostileOut = hostile.map(h => {
  try { const o = engine({ ratings: h.ratings, quiz: {} }); return { name: h.name, ok: true, picks: o.rec.picks.map(p => p.P.id), top: Object.entries(o.prof).sort((a, b) => a[1].score - b[1].score).slice(0, 2).map(([f, v]) => `${f} ${v.cls} ${v.score.toFixed(2)}`) }; }
  catch (e) { return { name: h.name, ok: false, error: String(e.message) }; }
});
const secs = ((Date.now() - t0) / 1000).toFixed(0);
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "c.json"), JSON.stringify({ inputs: N_IN, seed: SEED, seen, tally, examples, hostile: hostileOut }, null, 1));
console.log(`inputs per population: ${N_IN} (${secs} s); checked: ${JSON.stringify(seen)}\n`);
for (const [k, c] of Object.entries(tally).sort()) { console.log(`${k}: ${c}`); for (const e of examples[k]) console.log("    " + e.slice(0, 300)); }
console.log("\nhostile storage:"); for (const h of hostileOut) console.log("  " + JSON.stringify(h));
