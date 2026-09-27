/* Shared apparatus for the stress tests: the site's scripts loaded through tools/lib/site.js, a seeded random source,
   and synthetic wearers with a hidden taste who answer the quiz the way the quiz writes its verdicts
   (site/js/quiz.js writeVerdict). Nothing here changes the site; every number comes from the real engine. */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..", "..");
const { loadSite } = require(path.join(ROOT, "tools", "lib", "site"));

const STAGES = ["opening", "heart", "drydown"];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* mulberry32: a small seeded generator, so every run of a script prints the same numbers */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function normal(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
function sample(r, arr, k) { const a = arr.slice(), out = []; while (out.length < k && a.length) out.push(a.splice(Math.floor(r() * a.length), 1)[0]); return out; }
function shuffle(r, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const wmean = (fams, u) => { let num = 0, den = 0; for (const [f, w] of Object.entries(fams || {})) { num += w * (u[f] || 0); den += w; } return den ? num / den : 0; };

/* The site's scripts, optionally with the catalogue replaced: perfumes(D.PERFUMES, W) returns the list the engine
   sees. truth (optional) is a map id -> perfume whose stages the synthetic wearers smell; by default the engine's own. */
function site(opts) {
  opts = opts || {};
  /* opts.engineSource: another engine.js to run in place of the site's (a trial of a change); the rest loads as the page does */
  const W = opts.engineSource ? (() => {
    const w = loadSite("data", "mapper", "materials", "evidence");
    require("vm").runInContext(opts.engineSource, w, { filename: "engine.trial.js" });
    require("vm").runInContext(fs.readFileSync(path.join(ROOT, "site", "js", "notes.js"), "utf8"), w, { filename: "notes.js" });
    return w;
  })() : loadSite("data", "mapper", "materials", "evidence", "engine", "notes");
  const D0 = W.PP_DATA;
  const D = opts.perfumes ? Object.assign({}, D0, { PERFUMES: opts.perfumes(D0.PERFUMES, W) }) : D0;
  const E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE);
  const N = W.PP_NOTES.create(D, W.PP_MAP, E);
  const FAMS = Object.keys(D0.FAMILIES);
  const CARDS = D0.QUIZ.notePicker.flatMap(s => s.notes);
  const TRUTH = opts.truth || E.byId;
  const ALL = E.PERFUMES.map(P => P.id);
  const POP = D0.QUIZ.grid.concat(D0.QUIZ.more).filter(id => E.byId[id]);
  /* families a wearer can meet: 0.5 or more in the heart or base of at least ten perfumes */
  const EXPOSABLE = FAMS.filter(f => ALL.filter(id => ["heart", "drydown"].some(s => ((TRUTH[id].stages[s] || {})[f] || 0) >= 0.5)).length >= 10);
  /* each family's usual companion: the family most often at 0.4 or more in the base of perfumes that hold it at 0.5 or more there */
  const PARTNER = {};
  for (const f of FAMS) {
    const hold = ALL.filter(id => ((TRUTH[id].stages.drydown || {})[f] || 0) >= 0.5), co = {};
    for (const id of hold) for (const [g, w] of Object.entries(TRUTH[id].stages.drydown || {})) if (g !== f && w >= 0.4) co[g] = (co[g] || 0) + 1;
    const best = Object.entries(co).sort((a, b) => b[1] - a[1])[0];
    if (best) PARTNER[f] = best[0];
  }
  return { W, D, M: W.PP_MAP, E, N, FAMS, CARDS, TRUTH, ALL, POP, EXPOSABLE, PARTNER };
}

/* The palate groups as the quiz defines them (ARCH in site/js/quiz.js), read from its source. */
function palateGroups() {
  const src = fs.readFileSync(path.join(ROOT, "site", "js", "quiz.js"), "utf8");
  const out = {};
  for (const m of src.matchAll(/\{ id: "(\w+)", fams: \[([^\]]*)\]/g)) { const fams = [...m[2].matchAll(/"(\w+)"/g)].map(x => x[1]); if (fams.length) out[m[1]] = fams; }
  return out;
}

/* ---------- the hidden taste ----------
   Every family gets a mild opinion, N(0.15, 0.35) held within +-0.9 (people who wear perfume mildly like most of it). Deal-breakers (none for one wearer in ten, one for six
   in ten, two for three in ten) sit at -2; two or three liked families at +1 to +2. Both are drawn uniformly from the
   families a wearer can meet, so no family is favoured. */
function persona(r, ctx, o) {
  o = o || {};
  const u = {};
  for (const f of ctx.FAMS) u[f] = clamp(0.15 + normal(r) * 0.35, -0.9, 0.9);
  const nb = o.nBad != null ? o.nBad : (x => (x < 0.1 ? 0 : x < 0.7 ? 1 : 2))(r());
  const bad = sample(r, ctx.EXPOSABLE, nb);
  for (const f of bad) u[f] = -2;
  const like = sample(r, ctx.EXPOSABLE.filter(f => !bad.includes(f)), r() < 0.5 ? 2 : 3);
  for (const f of like) u[f] = 1 + r();
  return { g: r() < 0.5 ? "m" : "f", u, bad, like };
}

/* ---------- how a wearer reacts ----------
   The site's own premise: a deal-breaker ruins a stage it is strong in. The chance rises with its presence, from none
   at 0.25 to certain at 0.6. A stage it does not ruin is judged on the presence-weighted mean of the wearer's opinions,
   plus noise. */
const pRuin = w => clamp((w - 0.25) / 0.35, 0, 1);
function hedonic(st, u) { let num = 0, den = 0; for (const [f, w] of Object.entries(st || {})) { num += w * (u[f] || 0); den += w; } return den ? num / Math.max(1, den) : 0; }
function react(T, s, per, r) {
  const st = T.stages[s] || {};
  for (const f of per.bad) if (r() < pRuin(st[f] || 0)) return { v: -2, ruin: f };
  return { v: clamp(Math.round(1.5 * hedonic(st, per.u) + 0.4 * normal(r)), -2, 2), ruin: null };
}
/* A bottle worn for days: it turns when the heart or base goes wrong (or, half the time, when the opening is ruined),
   and is still worn when heart and base are fine and one is good. Otherwise it was dropped for another reason. */
function wear(T, per, r) {
  const x = {}; for (const s of STAGES) x[s] = react(T, s, per, r);
  const later = Math.min(x.heart.v, x.drydown.v);
  if (later <= -1 || (x.opening.v === -2 && r() < 0.5)) {
    let stage = x.drydown.v <= x.heart.v ? "drydown" : "heart";
    if (later > -1 || x.opening.v < later) stage = "opening";
    return { verdict: "turned", stage, ruin: x[stage].ruin, x };
  }
  if (x.heart.v >= 0 && x.drydown.v >= 0 && x.heart.v + x.drydown.v >= 1) return { verdict: "still", x };
  return { verdict: r() < 0.7 ? "other" : "unsure", x };
}
/* A bottle tried in a shop: only the opening is smelt; a poor opening puts the wearer off. */
function shopTrial(T, per, r) {
  const o = react(T, "opening", per, r);
  return o.v <= -1 ? { verdict: "shop", stage: "opening", ruin: o.ruin } : { verdict: "unsure" };
}
/* The chance a perfume turns on the wearer in the heart or base, from the deal-breakers alone. */
function pRuinLater(T, per) { let p = 1; for (const s of ["heart", "drydown"]) for (const f of per.bad) p *= 1 - pRuin((T.stages[s] || {})[f] || 0); return 1 - p; }
/* Monte Carlo of wearing a perfume k times: the share kept and the share that turns. */
function outcome(T, per, r, k) {
  let keep = 0, turn = 0;
  for (let i = 0; i < k; i++) { const w = wear(T, per, r); if (w.verdict === "still") keep++; else if (w.verdict === "turned") turn++; }
  return { keep: keep / k, turn: turn / k };
}

/* ---------- the bottles a wearer has tried ----------
   Mostly the quiz's grid and More perfumes (the Saudi bestsellers), some found by search; their own gender or unisex
   nine times in ten; 15% known from a shop trial only. A bottle was bought after a test in the shop: an opening that put
   the wearer off stops the purchase four times in five, and so, when they waited for it (six times in ten), does a poor
   heart; so owned bottles lean towards openings and hearts they liked, and what turns on them turns later (the site's
   premise). */
function bottles(ctx, per, r, n, o) {
  o = o || {};
  const fits = id => { const g = ctx.E.byId[id].gender; return g === "u" || g === per.g; };
  const shop = o.shopShare != null ? o.shopShare : 0.15;
  const out = new Map();
  for (let guard = 0; out.size < n && guard < 5000; guard++) {
    const id = r() < 0.85 ? ctx.POP[Math.floor(r() * ctx.POP.length)] : ctx.ALL[Math.floor(r() * ctx.ALL.length)];
    if (out.has(id) || (!fits(id) && r() < 0.9)) continue;
    const kind = r() < shop ? "shop" : "owned";
    if (kind === "owned") {
      const T = ctx.TRUTH[id], poor = react(T, "opening", per, r).v <= -1 || (r() < 0.6 && react(T, "heart", per, r).v <= -1);
      if (poor && r() < 0.8) continue;
      /* o.taste (0 by default): wearers own bottles for what they like in them. A bottle is kept as a candidate with a
         chance that rises with the pleasure of its heart and base, deal-breakers left out (those show up later):
         sigmoid(o.taste x (pleasure - 0.5)); at 4, a bottle of pleasure 1 is taken nine times in ten, one of 0 one in eight. */
      if (o.taste > 0) {
        const u = Object.assign({}, per.u); for (const f of per.bad) u[f] = 0.15;
        const q = 0.8 * hedonic(T.stages.heart, u) + hedonic(T.stages.drydown, u);
        if (r() >= 1 / (1 + Math.exp(-o.taste * (q - 0.5)))) continue;
      }
    }
    out.set(id, kind);
  }
  return [...out].map(([id, kind]) => ({ id, kind }));
}

/* ---------- answering the quiz ----------
   o.notes: the chance the wearer answers a bottle's note screen (each row then skipped one time in four, "Didn't
   notice it" one in twelve); o.told: whether they answer the note picker, sweet or bitter and the complaints;
   o.unsureWhen: the chance they answer "I don't remember" to "When did it bother you?" (the quiz then writes the base).
   The note picker: a wearer knows a note's name with chance o.toldKnow (default one in two); a known note whose families
   they hate is avoided four times in five, one they like is enjoyed three times in five, and one answer in fifty is
   careless. o.misattr: the chance a deal-breaker is blamed, in words, on the family that most often shares a base with
   it (ctx.PARTNER), as the friend who avoided musk did; the note picker and complaints then follow that belief.
   o.known (a Set of card ids) fixes which note names the wearer knows, for a retest. */
function answer(ctx, per, list, r, o) {
  o = Object.assign({ notes: 0.6, told: true, unsureWhen: 0.25, toldKnow: 0.5, misattr: 0 }, o || {});
  const ratings = {}, story = [];
  for (const b of list) {
    const P = ctx.E.byId[b.id], T = ctx.TRUTH[b.id];
    /* b.fixed: what happened with the bottle, drawn once, so a retest asks about the same history */
    const out = b.fixed || (b.kind === "shop" ? shopTrial(T, per, r) : wear(T, per, r));
    const st = { id: b.id, kind: b.kind, verdict: out.verdict, stage: out.stage || null, ruin: out.ruin || null };
    story.push(st);
    if (out.verdict === "other" || out.verdict === "unsure") continue;
    const rec = { opening: null, heart: null, drydown: null, again: null, chips: {} };
    let stage = out.stage;
    if (out.verdict === "still") { rec.drydown = 1; rec.again = 1; }
    if (out.verdict === "turned") { if (r() < o.unsureWhen) { stage = "drydown"; st.when = "unsure"; } rec[stage] = -2; rec.again = 0; }
    if (out.verdict === "shop") rec.opening = -1;
    if (out.ruin && out.verdict !== "still") {
      const chips = ctx.D.CHIPS.filter(c => (c.fams[out.ruin] || 0) >= 0.5 && r() < 0.5).map(c => c.id);
      if (chips.length) rec.chips[stage] = chips;
    }
    if (r() < o.notes) {
      const na = {}, un = [];
      for (const row of ctx.N.questions(P, out.verdict === "shop" ? "shop" : "worn")) {
        if (r() < 0.25) continue;
        if (r() < 0.08) { un.push(row.f); continue; }
        na[row.f] = clamp(Math.round(per.u[row.f] + 0.5 * normal(r)), -2, 2);
      }
      if (Object.keys(na).length) rec.noteAnswers = na;
      if (un.length) rec.unnoticed = un;
    }
    rec.src = "quiz";
    ratings[b.id] = rec;
  }
  const quiz = { notes: {} };
  if (o.told) {
    /* what the wearer believes they dislike: a deal-breaker may be blamed on its usual companion */
    const belief = Object.assign({}, per.u), blamed = per.bad.map(f => (r() < o.misattr && ctx.PARTNER[f] ? ctx.PARTNER[f] : f));
    for (const f of per.bad) if (!blamed.includes(f)) belief[f] = 0.15;
    for (const f of blamed) belief[f] = -2;
    for (const card of ctx.CARDS) {
      if (o.known ? !o.known.has(card.id) : r() >= o.toldKnow) continue;
      const cu = wmean(card.fams || ctx.M.famsForNote(card.en) || {}, belief);
      if (cu <= -1.2) { if (r() < 0.8) quiz.notes[card.id] = -1; }
      else if (cu >= 1.0) { if (r() < 0.6) quiz.notes[card.id] = 1; }
      else if (r() < 0.02) quiz.notes[card.id] = r() < 0.5 ? 1 : -1;
    }
    const sw = wmean(ctx.D.QUIZ.taste.sweet, per.u), bi = wmean(ctx.D.QUIZ.taste.bitter, per.u);
    quiz.taste = bi - sw > 0.4 ? "bitter" : sw - bi > 0.4 ? "sweet" : sw > 0.3 && bi > 0.3 ? "both" : "unsure";
    quiz.told = ctx.D.CHIPS.filter(c => Object.keys(c.fams).length && (blamed.some(f => (c.fams[f] || 0) >= 0.5) ? r() < 0.6 : r() < 0.03)).map(c => c.id);
    if (!quiz.told.length) quiz.toldNone = true;
    quiz.anosmia = "no";
  }
  return { ratings, quiz, story };
}

/* ---------- the engine, as both pages call it ---------- */
function run(ctx, ses) {
  const told = ctx.N.toldItems(ses.quiz), avoid = ctx.N.avoidedNotes(ses.quiz);
  const prof = ctx.E.computeProfile({ ratings: ses.ratings, auto: {}, images: {}, told });
  const rec = ctx.E.recommend(prof, ses.ratings, avoid);
  const rated = Object.keys(ses.ratings).length;
  /* the pages show picks from two rated bottles, or once a told item is positive */
  const gate = rated >= 2 || told.some(i => i.value > 0);
  return { prof, rec, told, avoid, gate, rated, picks: rec.picks.map(p => p.P.id) };
}
const classOf = (prof, kinds) => Object.entries(prof).filter(([, v]) => kinds.includes(v.cls)).map(([f]) => f);
/* families in the order the page lists them: likely before possible, then by the strength of the score */
function byStrength(prof, kinds) {
  return Object.entries(prof).filter(([, v]) => kinds.includes(v.cls))
    .sort((a, b) => kinds.indexOf(a[1].cls) - kinds.indexOf(b[1].cls) || Math.abs(b[1].score) - Math.abs(a[1].score)).map(([f]) => f);
}

/* ---------- baselines: three unrated perfumes, one per house and per line, as recommend() keeps them ---------- */
function three(ctx, ids, rated) {
  const out = [], houses = new Set(), line = new Set();
  for (const id of ids) {
    const P = ctx.E.byId[id]; if (!P || rated[id]) continue;
    const key = P.cloneOf || id;
    if (houses.has(P.house) || line.has(key)) continue;
    out.push(id); houses.add(P.house); line.add(key);
    if (out.length === 3) break;
  }
  return out;
}
const baselines = {
  random: (ctx, per, rated, r) => three(ctx, shuffle(r, ctx.ALL), rated),
  /* what a shop would push: the bestsellers in order, in the wearer's gender */
  popular: (ctx, per, rated) => three(ctx, ctx.POP.filter(id => ["u", per.g].includes(ctx.E.byId[id].gender)), rated),
  /* the best three the catalogue holds for this wearer, ranked by the chance of no ruin and the pleasure left */
  oracle: (ctx, per, rated) => {
    const score = id => { const T = ctx.TRUTH[id]; return (1 - pRuinLater(T, per)) / (1 + Math.exp(-2 * (0.8 * hedonic(T.stages.heart, per.u) + hedonic(T.stages.drydown, per.u)))); };
    return three(ctx, ctx.ALL.slice().sort((a, b) => score(b) - score(a)), rated);
  }
};

/* ---------- small statistics ---------- */
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const pct = x => (Number.isFinite(x) ? (100 * x).toFixed(0) + "%" : "n/a");
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : "n/a");
function table(rows, cols) {
  const w = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c]).length)));
  const line = cells => "| " + cells.map((c, i) => String(c).padEnd(w[i])).join(" | ") + " |";
  return [line(cols), "|" + w.map(n => "-".repeat(n + 2)).join("|") + "|", ...rows.map(r => line(cols.map(c => r[c])))].join("\n");
}

module.exports = { ROOT, STAGES, clamp, rng, normal, sample, shuffle, wmean, site, palateGroups, persona, pRuin, hedonic, react, wear, shopTrial,
  pRuinLater, outcome, bottles, answer, run, classOf, byStrength, three, baselines, mean, pct, f2, table };
