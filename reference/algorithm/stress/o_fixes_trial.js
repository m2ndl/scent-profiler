/* Trial of the fixes proposed after the full-order probe (FULLORDER.md): questions that point to the family the visitor
   likes or dislikes, a deal-breaker named only when something singles it out, and one reading change COVERAGE.md
   section 8 proposed. Each fix is a switch on the same visitors, the same answers and the same simulated wears, so a
   difference between two rows comes from the switch alone. Nothing in site/ changes: the engine is the site's, loaded
   with recommend() also returning its whole ranked list (checked below to pick what the site picks), and the reading
   change is a patch of that source in memory.

   The visitors (lib.js persona and bottles) have tried six bottles and name three on the first screen, at random; the
   other three come back to them only when shown, which is what the narrowing round relies on (the stress test's
   visitors named every bottle they had tried, so it could reach none). Each bottle is answered as lib.js answer() writes
   one (checked below in distribution), from random streams of its own: a verdict's details, whether the note screen is
   answered and each row's answer are drawn the same under every switch, and a switch that asks a screen outright only
   answers the ones that were skipped. The word answers come from lib.js answer() unchanged. Picks are shown, as on the
   page, from two rated bottles or a liked word; that is taken on round one.

   Switches:
   rows kept     the note screen of a bottle the visitor still wears is asked outright (each row is still skipped one in
                 four and "didn't notice it" one in twelve, as now);
   rows all      the same for every bottle with a verdict;
   rows weak     rows kept, the rows it adds answered with twice the noise (a visitor who cannot tell a note in a bottle);
   narrow        the narrowing round draws on the 60 grid and More bottles, or on the whole catalogue (those 60 first),
                 instead of the 20 grid bottles; "no narrowing" shows what the current round adds. The quiz's rule fills
                 its four tiles one accused family after another, so with the whole catalogue the first family takes all
                 four most of the time;
   lift          a liking from a stage rating ("I still wear it" in the quiz) counts a family only for what the stage
                 holds beyond the catalogue's average presence of that family there;
   named         display only, measured on every row: a deal-breaker is named when a note row or a second bottle points
                 to it (REPORT.md section 3), and otherwise the accused families are shown together; the figure with a
                 complaint chip counted as pointing too is given beside it.

   Populations: the stress test's visitors (a bottle's note screen answered six times in ten), visitors who seldom answer
   it (two in ten), and visitors who have tried twelve bottles and name three (more for the narrowing round to reach).
   Modelling choices that favour the fixes: a row's answer is the visitor's true opinion plus noise, and a visitor made
   to answer rows answers them as well as one who chose to; nobody leaves the quiz over the extra answers; a complaint
   chip is ticked only when one family ruined the bottle, and only chips that hold that family.
   Usage: node o_fixes_trial.js [visitors per seed]. Seeds 11 to 15. Writes out/o.json and out/o.txt. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 400), SEEDS = [11, 12, 13, 14, 15], K = 30;
const VNT = { notes: 0.6, told: true, unsureWhen: 0.25 };
const POPS = {
  "the stress test's visitors": { tried: 6, notes: 0.6, variants: null },
  "visitors who seldom answer note rows": { tried: 6, notes: 0.2, variants: ["now (grid narrowing round)", "rows on kept bottles", "rows on every bottle", "rows on kept bottles, judged poorly"] },
  "visitors who have tried twelve bottles": { tried: 12, notes: 0.6, variants: ["no narrowing round", "now (grid narrowing round)", "narrowing from the 60 popular", "narrowing from the whole catalogue"] }
};
const out = [], log = s => { out.push(s); console.log(s); };

const SRC = fs.readFileSync(path.join(L.ROOT, "site", "js", "engine.js"), "utf8");
const swap = (src, a, b) => { if (src.split(a).length !== 2) throw new Error("patch anchor not found exactly once: " + a.slice(0, 80)); return src.replace(a, b); };
const expose = s => swap(s, "return { picks, badAny, likely, contradicted: veto.contradicted };", "return { picks, badAny, likely, contradicted: veto.contradicted, scored };");
const lift = s => {
  s = swap(s, "const PERFUMES = D.PERFUMES.map(p => applyEvidence(p));",
    "const PERFUMES = D.PERFUMES.map(p => applyEvidence(p));\n    const AVG = {}; for (const st of STAGES) { AVG[st] = {}; for (const P of PERFUMES) for (const [f, w] of Object.entries(P.stages[st] || {})) AVG[st][f] = (AVG[st][f] || 0) + w / PERFUMES.length; }");
  return swap(s, "add(f, fv, w * sw * (PROV_W[prov] || 0.75), { perfume: P, stage: s, value: fv, strong: w >= STRONG, prov, kept: keptIt });",
    "const lv = fv > 0 ? fv * Math.max(0, w - (AVG[s][f] || 0)) / w : fv;\n            add(f, lv, w * sw * (PROV_W[prov] || 0.75), { perfume: P, stage: s, value: lv, strong: w >= STRONG, prov, kept: keptIt });");
};
const CTX = { base: L.site({ engineSource: expose(SRC) }), lift: L.site({ engineSource: lift(expose(SRC)) }) };
const ctx = CTX.base, { E } = ctx;
function hashSeed(...xs) { let h = 2166136261; for (const c of xs.join("|")) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const r9 = x => Math.round(x * 1e9) / 1e9;
function ranks(v) { const idx = v.map((_, i) => i).sort((a, b) => v[b] - v[a]), rk = new Array(v.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && v[idx[j + 1]] === v[idx[i]]) j++; for (let k = i; k <= j; k++) rk[idx[k]] = (i + j) / 2 + 1; i = j + 1; } return rk; }
function pearson(x, y) { const mx = L.mean(x), my = L.mean(y); let a = 0, b = 0, c = 0; for (let i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return a / Math.sqrt(b * c); }
const spearman = (x, y) => pearson(ranks(x), ranks(y));
const sig = x => 1 / (1 + Math.exp(-x));
const truth = (id, per) => { const T = ctx.TRUTH[id]; return (1 - L.pRuinLater(T, per)) * sig(2 * (0.8 * L.hedonic(T.stages.heart, per.u) + L.hedonic(T.stages.drydown, per.u))); };

/* ---------- checks before the trial ---------- */
{
  const site = L.site(), r = L.rng(5); let same = 0, liftSame = 0, noKept = 0;
  for (let i = 0; i < 300; i++) {
    const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 3), r, VNT);
    if (L.run(ctx, ses).picks.join() === L.run(site, ses).picks.join()) same++;
    /* the lift patch touches only likings from stage ratings: with no rating above 0 the profile is the same */
    const neg = Object.fromEntries(Object.entries(ses.ratings).filter(([, rec]) => !["opening", "heart", "drydown"].some(s => rec[s] > 0)));
    if (Object.keys(neg).length === Object.keys(ses.ratings).length) { noKept++; if (JSON.stringify(L.run(CTX.lift, ses).prof, (k, v) => (k === "perfume" ? v.id : v)) === JSON.stringify(L.run(ctx, ses).prof, (k, v) => (k === "perfume" ? v.id : v))) liftSame++; }
  }
  log(`checks: the exposed engine picks what the site picks for ${same} of 300 visitors; with no liking from a stage rating the lift engine gives the same profile for ${liftSame} of ${noKept}`);
}

/* ---------- the quiz's palate rule (quiz.js palateGroups and archetypeOf), as g_palate_whatif.js checks it against the page ---------- */
const GROUPS = L.palateGroups(), groupOf = f => Object.keys(GROUPS).find(g => GROUPS[g].includes(f));
function palate(E, prof, ratings) {
  const liked = L.byStrength(prof, ["goodLikely", "goodPossible"]), vote = {};
  for (const f of liked) for (const e of prof[f].evidence || []) {
    if (!e.perfume || !(e.value > 0) || e.stage === "opening" || !E.kept(ratings[e.perfume.id])) continue;
    const x = ((e.perfume.stages || {})[e.stage] || {})[f] || 0, cur = vote[e.perfume.id];
    if (x > 0 && (!cur || x > cur.x)) vote[e.perfume.id] = { x, g: groupOf(f) };
  }
  const G = [];
  for (const v of Object.values(vote)) { if (!v.g) continue; const g = G.find(o => o.g === v.g); if (g) g.sum += v.x; else G.push({ g: v.g, sum: v.x, first: liked.findIndex(f => GROUPS[v.g].includes(f)) }); }
  G.sort((p, q) => q.sum - p.sum || p.first - q.first);
  if (!G.length) return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? "selective" : null;
  if (G.length === 1 || G[0].sum > 2 * G[1].sum) return G[0].g;
  if (G.length >= 3 && Object.keys(vote).length >= 4 && G[0].sum <= 2 * G[2].sum) return "wide";
  return G[0].g + "-" + G[1].g;
}
/* the copy against the real quiz page, as g_palate_whatif.js does */
{
  const { createPage } = require(path.join(L.ROOT, "tests", "lib", "dom"));
  const SITE = path.join(L.ROOT, "site");
  const scripts = [...fs.readFileSync(path.join(SITE, "quiz.html"), "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
  const pagePalate = (ratings, quiz) => {
    const answers = Object.assign({ taste: "unsure", told: [], anosmia: "no" }, quiz);
    const p = createPage({ localStorage: { pp_device: JSON.stringify("d"), pp_lang: JSON.stringify("en"), pp_ratings_v1: JSON.stringify(ratings), pp_quiz_v1: JSON.stringify(answers) } });
    p.load(scripts);
    const html = () => p.snapshot().els.quiz.innerHTML;
    p.click({ dataset: { start: "1" } }); p.click({ dataset: { none: "1" } });
    for (let i = 0; i < 6 && /data-pn=/.test(html()); i++) p.click({ dataset: { continue: "1" } });
    p.click({ dataset: { taste: answers.taste } }); p.click({ dataset: { continue: "1" } }); p.click({ dataset: { anosmia: answers.anosmia } });
    return (/id="qe-([\w-]+)"/.exec(html()) || [])[1] || null;
  };
  const r = L.rng(9); let agree = 0;
  for (let i = 0; i < 200; i++) {
    const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 3), r, VNT);
    if (palate(E, L.run(ctx, ses).prof, ses.ratings) === pagePalate(ses.ratings, ses.quiz)) agree++;
  }
  log(`checks: the copy of the palate rule gives the page's palate for ${agree} of 200 visitors`);
}

/* ---------- answering a bottle, from random streams of its own ----------
   As lib.js answer() writes one bottle: "I don't remember" when it turned one time in four (the base is written),
   complaint chips one in two when one family ruined it (only chips that hold that family), the note screen answered
   with chance scr.p, each row skipped one in four and "didn't notice it" one in twelve, a row's answer the visitor's
   opinion plus noise. u, the draw that decides the screen, also tells whether a row was added by a switch (u at or
   above the population's rate), for the "weak" switch. */
function rowsOf(P, kind, per, key, noise) {
  const na = {}, un = [];
  for (const row of ctx.N.questions(P, kind)) {
    const rr = L.rng(hashSeed(key, row.f));
    if (rr() < 0.25) continue;
    if (rr() < 0.08) { un.push(row.f); continue; }
    na[row.f] = L.clamp(Math.round(per.u[row.f] + noise * L.normal(rr)), -2, 2);
  }
  return { na, un };
}
function answerBottle(per, b, key, scr) {
  const P = E.byId[b.id], o = b.fixed, rv = L.rng(hashSeed(key, "verdict"));
  if (o.verdict === "other" || o.verdict === "unsure") return null;
  const rec = { opening: null, heart: null, drydown: null, again: null, chips: {} };
  let stage = o.stage;
  if (o.verdict === "still") { rec.drydown = 1; rec.again = 1; }
  if (o.verdict === "turned") { if (rv() < VNT.unsureWhen) stage = "drydown"; rec[stage] = -2; rec.again = 0; }
  if (o.verdict === "shop") rec.opening = -1;
  if (o.ruin && o.verdict !== "still") { const chips = ctx.D.CHIPS.filter(c => (c.fams[o.ruin] || 0) >= 0.5 && rv() < 0.5).map(c => c.id); if (chips.length) rec.chips[stage] = chips; }
  const u = rv();
  if (u < scr.p(rec)) { const { na, un } = rowsOf(P, o.verdict === "shop" ? "shop" : "worn", per, key + "|rows", scr.noise(u)); if (Object.keys(na).length) rec.noteAnswers = na; if (un.length) rec.unnoticed = un; }
  rec.src = "quiz";
  return rec;
}
const answers = rec => (rec ? 1 + Object.keys(rec.noteAnswers || {}).length + (rec.unnoticed || []).length : 1);
const screenOf = (sw, notes) => ({ p: rec => (sw.rows === "all" || (sw.rows && E.kept(rec)) ? 1 : notes), noise: u => (sw.rows === "weak" && u >= notes ? 1.0 : 0.5) });

/* the bottle answering against lib.js answer(), in distribution */
{
  const r = L.rng(77), a = { rated: [0, 0], base: [0, 0], chips: [0, 0], rows: [0, 0], dev: [[], []] };
  for (let i = 0; i < 3000; i++) {
    const per = L.persona(r, ctx);
    const list = L.bottles(ctx, per, r, 3).map(b => Object.assign(b, { fixed: b.kind === "shop" ? L.shopTrial(ctx.TRUTH[b.id], per, r) : L.wear(ctx.TRUTH[b.id], per, r) }));
    const lib = L.answer(ctx, per, list, r, Object.assign({}, VNT, { told: false })).ratings;
    list.forEach((b, j) => {
      const recs = [lib[b.id] || null, answerBottle(per, b, `check|${i}|${j}`, screenOf({}, VNT.notes))];
      recs.forEach((rec, k) => {
        if (!rec) return;
        a.rated[k]++; if (rec.drydown === -2) a.base[k]++; if (Object.keys(rec.chips).length) a.chips[k]++; if (rec.noteAnswers || rec.unnoticed) a.rows[k]++;
        for (const [f, x] of Object.entries(rec.noteAnswers || {})) a.dev[k].push(x - per.u[f]);
      });
    });
  }
  const sh = (x, k) => L.pct(x[k] / 9000), sd = d => Math.sqrt(L.mean(d.map(x => x * x)) - L.mean(d) ** 2).toFixed(2);
  log(`checks: 9,000 bottles, lib.js answer() against this script: rated ${sh(a.rated, 0)} / ${sh(a.rated, 1)}; base -2 ${sh(a.base, 0)} / ${sh(a.base, 1)}; chips ${sh(a.chips, 0)} / ${sh(a.chips, 1)}; note screen answered ${sh(a.rows, 0)} / ${sh(a.rows, 1)}; row answer minus opinion, sd ${sd(a.dev[0])} / ${sd(a.dev[1])}`);
}

/* ---------- the narrowing round (quiz.js narrowCandidates) with its pool as a switch ---------- */
const POOLS = { grid: ctx.D.QUIZ.grid, popular: ctx.POP, catalogue: ctx.POP.concat(ctx.ALL.filter(id => !ctx.POP.includes(id))) };
const POPSET = new Set(ctx.POP);
function narrowCandidates(prof, ratings, answered, pool) {
  const fams = Object.entries(prof).filter(([, v]) => v.cls === "badPossible" && v.n === 1).sort((a, b) => a[1].score - b[1].score);
  const hasStage = id => { const r = ratings[id]; return !!r && L.STAGES.some(s => r[s] != null); };
  const res = [], seen = new Set(), list = POOLS[pool];
  for (const [f, v] of fams) {
    const ev = v.evidence.find(e => e.stage === "drydown") || v.evidence[0]; if (!ev) continue;
    const st = ev.perfume.stages[ev.stage] || {};
    const others = Object.keys(st).filter(o => o !== f && st[o] >= 0.4);
    const cands = list.filter(id => !seen.has(id) && !hasStage(id) && !answered.has(id) && E.byId[id] && (E.byId[id].stages.drydown[f] || 0) >= 0.6 && others.every(o => (E.byId[id].stages.drydown[o] || 0) < 0.2))
      /* the grid's own order is the quiz's: strongest first; the whole catalogue puts the 60 popular bottles first */
      .sort((a, b) => (pool === "catalogue" ? POPSET.has(b) - POPSET.has(a) : 0) || E.byId[b].stages.drydown[f] - E.byId[a].stages.drydown[f]);
    for (const id of cands) { if (res.length >= 4) break; res.push({ id, f }); seen.add(id); }
    if (res.length >= 4) break;
  }
  return res;
}

/* ---------- one visitor under one set of switches ---------- */
function session(v, sw) {
  const { per, named, unnamed, quiz, key, notes } = v, scr = screenOf(sw, notes), C = sw.lift ? CTX.lift : CTX.base;
  const ratings = {};
  let total = 0;
  for (const b of named) { const rec = answerBottle(per, b, `${key}|${b.id}|r1`, scr); total += answers(rec); if (rec) ratings[b.id] = rec; }
  /* the narrowing round, before the word screens: the profile from the bottles alone */
  let shown = 0, ticked = 0;
  if (sw.narrow) {
    const prof = C.E.computeProfile({ ratings, auto: {}, images: {}, told: [] });
    const cands = narrowCandidates(prof, ratings, new Set(named.map(b => b.id)), sw.narrow);
    shown = cands.length ? 1 : 0;
    for (const c of cands) {
      const b = unnamed.find(x => x.id === c.id); if (!b) continue;
      ticked++;
      const rec = answerBottle(per, b, `${key}|${b.id}|r2`, scr);
      total += answers(rec);
      if (rec) ratings[b.id] = rec;
    }
  }
  return { res: L.run(C, { ratings, quiz }), ratings, total, shown, ticked: ticked ? 1 : 0, C };
}

/* the most a reader of these answers could know, an upper bound: the true likes and deal-breakers the answers expose (a
   rated bottle holds the family at 0.4 or more in its heart or base, or a word answer touches it), known to be the ones,
   and the population mean elsewhere */
function readerRho(v, s, list, tr) {
  const told = new Set(s.res.told.map(t => t.f));
  const exposed = f => told.has(f) || Object.keys(s.ratings).some(id => ["heart", "drydown"].some(st => ((E.byId[id].stages[st] || {})[f] || 0) >= 0.4));
  const prof = {};
  for (const f of ctx.FAMS) { const bad = v.per.bad.includes(f) && exposed(f), like = v.per.like.includes(f) && exposed(f); prof[f] = { score: bad || like ? v.per.u[f] : 0.15, n: 1, cls: bad ? "badLikely" : like ? "goodLikely" : "neutral", evidence: [], pos: 0, neg: 0 }; }
  const m = {}; for (const x of E.recommend(prof, s.ratings, []).scored) m[x.P.id] = r9(x.final);
  return spearman(list.map(id => (id in m ? m[id] : -1e9)), tr);
}

const VARIANTS = {
  "no narrowing round": { narrow: null },
  "now (grid narrowing round)": { narrow: "grid" },
  "rows on kept bottles": { narrow: "grid", rows: "kept" },
  "rows on every bottle": { narrow: "grid", rows: "all" },
  "rows on kept bottles, judged poorly": { narrow: "grid", rows: "weak" },
  "narrowing from the 60 popular": { narrow: "popular" },
  "narrowing from the whole catalogue": { narrow: "catalogue" },
  "lift": { narrow: "grid", lift: true },
  "rows on kept + whole-catalogue narrowing": { narrow: "catalogue", rows: "kept" },
  "rows on kept + whole-catalogue narrowing + lift": { narrow: "catalogue", rows: "kept", lift: true }
};
const NOW = "now (grid narrowing round)";
const READER = new Set([NOW, "rows on every bottle", "rows on kept + whole-catalogue narrowing"]);
const KEYS = ["rho", "keep", "turn", "keep10", "extra", "shown", "ticked", "likesShown", "anyLike", "likeP", "likeRecall", "badP", "badTop", "innocent", "flagged",
  "namedP", "namedTop", "namedAny", "namedTrue", "flagTopSame", "namedAnyC", "namedTopC", "palNamed", "palNone", "palLead", "palAny", "reader"];
const t0 = Date.now(), results = {};
for (const [pname, pop] of Object.entries(POPS)) {
  const names = pop.variants || Object.keys(VARIANTS);
  const acc = Object.fromEntries(names.map(k => [k, Object.assign(Object.fromEntries(KEYS.map(x => [x, []])), { bySeed: {}, dRho: {}, dKeep: {} })]));
  let visitors = 0;
  for (const seed of SEEDS) {
    const r = L.rng(seed * 7717 + pop.tried * 31 + Math.round(pop.notes * 10));
    for (let i = 0; i < N_PER; i++) {
      const per = L.persona(r, ctx);
      const tried = L.bottles(ctx, per, r, pop.tried).map(b => Object.assign(b, { fixed: b.kind === "shop" ? L.shopTrial(ctx.TRUTH[b.id], per, r) : L.wear(ctx.TRUTH[b.id], per, r) }));
      const named = L.sample(r, tried, 3), unnamed = tried.filter(b => !named.includes(b));
      const words = L.answer(ctx, per, [], r, Object.assign({}, VNT, { notes: pop.notes }));
      /* picks are shown from two rated bottles, or a liked word (lib.js run) */
      const rated1 = named.filter(b => !["other", "unsure"].includes(b.fixed.verdict)).length;
      if (!(rated1 >= 2 || ctx.N.toldItems(words.quiz).some(t => t.value > 0))) continue;
      visitors++;
      const v = { per, named, unnamed, quiz: words.quiz, key: `${pname}|${seed}|${i}`, notes: pop.notes };
      const side = E.sideOf(session(v, VARIANTS[NOW]).ratings), triedIds = new Set(tried.map(b => b.id));
      const list = ctx.ALL.filter(id => { const g = E.byId[id].gender; return !triedIds.has(id) && (!side || g === "u" || g === side); });
      const tr = list.map(id => truth(id, per));
      const wears = {}, wear = id => wears[id] || (wears[id] = L.outcome(ctx.TRUTH[id], per, L.rng(hashSeed(v.key, id, "wear")), K));
      const bad = new Set(per.bad), like = new Set(per.like);
      const strongest = per.like.slice().sort((a, b) => per.u[b] - per.u[a])[0], lead = groupOf(strongest), likedGroups = new Set(per.like.map(groupOf));
      const row = {};
      for (const name of [NOW].concat(names.filter(n => n !== NOW))) {
        const a = acc[name], s = session(v, VARIANTS[name]), { prof, rec } = s.res;
        const m = {}; for (const x of rec.scored) m[x.P.id] = r9(x.final);
        const rho = spearman(list.map(id => (id in m ? m[id] : -1e9)), tr);
        const picks = rec.picks.map(p => p.P.id);
        const keep = picks.length ? L.mean(picks.map(id => wear(id).keep)) : null;
        row[name] = { rho, keep, total: s.total };
        a.rho.push(rho); (a.bySeed[seed] = a.bySeed[seed] || []).push(rho);
        if (READER.has(name)) a.reader.push(readerRho(v, s, list, tr));
        if (picks.length) { a.keep.push(keep); a.turn.push(L.mean(picks.map(id => wear(id).turn))); }
        a.keep10.push(L.mean(rec.scored.slice(0, 10).map(x => wear(x.P.id).keep)));
        a.extra.push(s.total - row[NOW].total); a.shown.push(s.shown); a.ticked.push(s.ticked);
        const fg = L.classOf(prof, ["goodLikely", "goodPossible"]), fb = L.byStrength(prof, ["badLikely", "badPossible"]);
        a.likesShown.push(fg.length); a.anyLike.push(fg.length ? 1 : 0); a.likeRecall.push(fg.filter(f => like.has(f)).length / per.like.length);
        if (fg.length) a.likeP.push(fg.filter(f => like.has(f)).length / fg.length);
        a.flagged.push(fb.length ? 1 : 0);
        if (fb.length) { a.badP.push(fb.filter(f => bad.has(f)).length / fb.length); a.badTop.push(bad.has(fb[0]) ? 1 : 0); a.innocent.push(fb.filter(f => !bad.has(f)).length); }
        /* named only when a note row or a second bottle points to it; beside it, a complaint chip counted as pointing too */
        const byRow = f => (prof[f].evidence || []).some(e => e.value < 0 && e.note), byChip = f => (prof[f].evidence || []).some(e => e.value < 0 && e.chip);
        const named2 = fb.filter(f => prof[f].neg >= 2 || byRow(f)), namedC = fb.filter(f => prof[f].neg >= 2 || byRow(f) || byChip(f));
        a.namedAny.push(named2.length ? 1 : 0); a.namedAnyC.push(namedC.length ? 1 : 0);
        if (named2.length) { a.namedP.push(named2.filter(f => bad.has(f)).length / named2.length); a.namedTop.push(bad.has(named2[0]) ? 1 : 0); a.flagTopSame.push(bad.has(fb[0]) ? 1 : 0); }
        if (namedC.length) a.namedTopC.push(bad.has(namedC[0]) ? 1 : 0);
        if (per.bad.length) a.namedTrue.push(named2.filter(f => bad.has(f)).length / per.bad.length);
        const pal = palate(s.C.E, prof, s.ratings), group = pal && !["wide", "selective"].includes(pal);
        a.palNamed.push(group ? 1 : 0); a.palNone.push(pal ? 0 : 1);
        if (group) { const g = pal.split("-"); a.palLead.push(g[0] === lead ? 1 : 0); a.palAny.push(g.some(x => likedGroups.has(x)) ? 1 : 0); }
      }
      /* paired differences against the site as it is, per seed */
      for (const name of names) {
        (acc[name].dRho[seed] = acc[name].dRho[seed] || []).push(row[name].rho - row[NOW].rho);
        if (row[name].keep != null && row[NOW].keep != null) (acc[name].dKeep[seed] = acc[name].dKeep[seed] || []).push(row[name].keep - row[NOW].keep);
      }
    }
    process.stderr.write(`${pname}, seed ${seed}: ${((Date.now() - t0) / 1000).toFixed(0)} s\n`);
  }
  results[pname] = { visitors, acc };
}

const P = L.pct, f2 = L.f2, m = L.mean;
const range = (bySeed, fmt) => { const s = SEEDS.map(sd => m(bySeed[sd] || [])).filter(Number.isFinite); return s.length ? `${fmt(m(s))} (${fmt(Math.min(...s))} to ${fmt(Math.max(...s))})` : ""; };
const sgn = f => x => (x >= 0 ? "+" : "") + f(x);
const pts = x => (100 * x).toFixed(1);
for (const [pname, { visitors, acc }] of Object.entries(results)) {
  log(`\n## ${pname} (${visitors} visitors shown picks; seeds ${SEEDS.join(", ")}, ${N_PER} drawn per seed)\n`);
  log(L.table(Object.entries(acc).map(([k, a]) => ({ switches: k, "extra answers": m(a.extra).toFixed(1), "narrowing shown": P(m(a.shown)), "a bottle ticked": P(m(a.ticked)),
    "full order": f2(m(a.rho)), "gain over now (seed range)": range(a.dRho, sgn(f2)), "upper bound": a.reader.length ? f2(m(a.reader)) : "",
    "picks kept": P(m(a.keep)), "kept gain, points (seed range)": range(a.dKeep, sgn(pts)), "picks turn": P(m(a.turn)), "top 10 kept": P(m(a.keep10)) })),
    ["switches", "extra answers", "narrowing shown", "a bottle ticked", "full order", "gain over now (seed range)", "upper bound", "picks kept", "kept gain, points (seed range)", "picks turn", "top 10 kept"]));
  log("\nLikes and palate");
  log(L.table(Object.entries(acc).map(([k, a]) => ({ switches: k, "liked shown per visitor": f2(m(a.likesShown)), "any liked": P(m(a.anyLike)), "liked that are true": P(m(a.likeP)), "true likes shown": P(m(a.likeRecall)),
    "group palate": P(m(a.palNamed)), "no palate": P(m(a.palNone)), "palate lead right": P(m(a.palLead)), "palate names a liked group": P(m(a.palAny)) })),
    ["switches", "liked shown per visitor", "any liked", "liked that are true", "true likes shown", "group palate", "no palate", "palate lead right", "palate names a liked group"]));
  log("\nDeal-breakers: flagged as now, and named only when a note row or a second bottle points to it (with chips: a complaint chip counts too)");
  log(L.table(Object.entries(acc).map(([k, a]) => ({ switches: k, "any flagged": P(m(a.flagged)), "flagged that are true": P(m(a.badP)), "first flagged true": P(m(a.badTop)), "innocent flagged": f2(m(a.innocent)),
    "any named": P(m(a.namedAny)), "named that are true": P(m(a.namedP)), "first named true": P(m(a.namedTop)), "first flagged true, same visitors": P(m(a.flagTopSame)), "true deal-breakers named": P(m(a.namedTrue)),
    "any named, with chips": P(m(a.namedAnyC)), "first named true, with chips": P(m(a.namedTopC)) })),
    ["switches", "any flagged", "flagged that are true", "first flagged true", "innocent flagged", "any named", "named that are true", "first named true", "first flagged true, same visitors", "true deal-breakers named", "any named, with chips", "first named true, with chips"]));
}
log(`\n${((Date.now() - t0) / 1000).toFixed(0)} s`);
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "o.txt"), out.join("\n") + "\n");
fs.writeFileSync(path.join(__dirname, "out", "o.json"), JSON.stringify({ perSeed: N_PER, seeds: SEEDS, populations: Object.fromEntries(Object.entries(results).map(([pn, { visitors, acc }]) => [pn, { visitors,
  variants: Object.fromEntries(Object.entries(acc).map(([k, a]) => [k, Object.assign(Object.fromEntries(KEYS.map(x => [x, a[x].length ? m(a[x]) : null])),
    { rhoBySeed: Object.fromEntries(SEEDS.map(sd => [sd, m(a.bySeed[sd] || [])])), rhoGainBySeed: Object.fromEntries(SEEDS.map(sd => [sd, m(a.dRho[sd] || [])])), keepGainBySeed: Object.fromEntries(SEEDS.map(sd => [sd, m(a.dKeep[sd] || [])])) })])) }])) }, null, 1));
