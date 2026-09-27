/* Trial of the fixes for REPORT.md section 8 before they go into site/js/engine.js: each fix is applied to a copy of the
   engine's source in memory, and the same synthetic visitors are scored under each version. It decides between two
   ways of fixing defect 1's second route (a family liked in one bottle and disliked in another):
     B1  "mixed" whenever one bottle counts for a family and another against it (the README's rule);
     B2  "mixed" as now, or whenever a note the visitor liked is among the family's evidence.
   Usage: node fix_trial.js [visitors] [seed]. Writes out/fix_trial.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 3000), SEED = +(process.argv[3] || 97), K = 30;
/* the engine as it was when the stress test ran (commit 23cab69), which the fixes are applied to */
const SRC = require("child_process").execSync("git show 23cab69:site/js/engine.js", { cwd: L.ROOT, encoding: "utf8" });
const swap = (src, a, b) => { if (!src.includes(a)) throw new Error("patch anchor missing: " + a.slice(0, 80)); return src.replace(a, b); };

const patch = {
  /* 1a: the answer is the wearer's word on that family in this bottle, for every answer, not only leans: another stage's
     rating that contradicts it counts as neutral for the family (a lean lets it drop out, as before); a contradicting chip drops out */
  A: s => swap(swap(swap(swap(s,
    `const yields = (f, s, v) => { const a = answers[f]; return !!a && (a.lean ? Math.sign(v) !== Math.sign(a.val) : a.s === s); };`,
    `const disagrees = (f, v) => { const a = answers[f]; return !!a && Math.sign(v) !== Math.sign(a.val); };
        const ratingFor = (f, s, v) => { const a = answers[f]; return !a ? v : !a.lean && a.s === s ? null : !disagrees(f, v) ? v : a.lean ? null : 0; };`),
    `            if (unnoticed.has(f) || yields(f, s, v)) continue;`,
    `            const fv = unnoticed.has(f) ? null : ratingFor(f, s, v); if (fv == null) continue;`),
    `            add(f, v, w * sw * (PROV_W[prov] || 0.75), { perfume: P, stage: s, value: v, strong: w >= STRONG, prov });`,
    `            add(f, fv, w * sw * (PROV_W[prov] || 0.75), { perfume: P, stage: s, value: fv, strong: w >= STRONG, prov });`),
    `              if (unnoticed.has(f)) continue;
              const present`,
    `              if (unnoticed.has(f) || disagrees(f, cv)) continue;
              const present`),
  B1: s => swap(s, `if (n >= 2 && pos >= 1 && neg >= 1 && Math.abs(score) < 0.7) cls = "mixed";`, `if (n >= 2 && pos >= 1 && neg >= 1) cls = "mixed";`),
  B2: s => swap(s, `if (n >= 2 && pos >= 1 && neg >= 1 && Math.abs(score) < 0.7) cls = "mixed";`,
    `if (n >= 2 && pos >= 1 && neg >= 1 && (Math.abs(score) < 0.7 || o.evidence.some(e => e.note && e.value > 0))) cls = "mixed";`),
  /* 2: "Free of X" only when X is under 0.2 in every stage */
  C: s => swap(s, `const clear = badAny.filter(f => (P.stages.drydown[f] || 0) < 0.2).slice(0, 2);`, `const clear = badAny.filter(f => STAGES.every(s => (P.stages[s][f] || 0) < 0.2)).slice(0, 2);`),
  /* 3: the classes read the score to nine places */
  D: s => {
    s = swap(s, `const score = o.wsum ? o.sum / o.wsum : 0;`, `const score = o.wsum ? o.sum / o.wsum : 0, s9 = Math.round(score * 1e9) / 1e9;`);
    const a = s.indexOf(`let cls = "neutral";`), b = s.indexOf(`out[f] = { score, n, cls`);
    return s.slice(0, a) + s.slice(a, b).replace(/\bscore\b/g, "s9") + s.slice(b);
  },
  /* 4: stored values held to the scale */
  E: s => {
    s = swap(s, `  function kept(r) {`, `  const onScale = v => (v == null || v === "" || !Number.isFinite(+v) ? null : Math.max(-2, Math.min(2, +v)));
  function kept(r) {`);
    s = swap(s, `const later = ["heart", "drydown"].map(s => r[s]).filter(v => v != null);`, `const later = ["heart", "drydown"].map(s => onScale(r[s])).filter(v => v != null);`);
    s = swap(s, `for (const [f, val] of Object.entries(r.noteAnswers || {})) {
          if (!Number.isFinite(val) || unnoticed.has(f)) continue;`, `for (const [f, raw] of Object.entries(r.noteAnswers || {})) {
          const val = onScale(raw);
          if (val == null || unnoticed.has(f)) continue;`);
    return swap(s, `const v = r[s]; if (v == null) continue;`, `const v = onScale(r[s]); if (v == null) continue;`);
  },
  /* after the verifier (27-28 Sep 2026): S reads only numbers or numeric text, rounded (the adopted parser, taken from
     site/js/engine.js); V lets only a kept bottle lift an avoided note; R weighs a mixed family by its mean once it leans
     clearly, so relabelling lopsided families "mixed" leaves the picks as they were */
  S: s => {
    const live = fs.readFileSync(path.join(L.ROOT, "site", "js", "engine.js"), "utf8");
    const a = live.indexOf("  const onScale = v => {"), b = live.indexOf("\n  };\n", a) + 6;
    return swap(s, `  const onScale = v => (v == null || v === "" || !Number.isFinite(+v) ? null : Math.max(-2, Math.min(2, +v)));\n`, live.slice(a, b));
  },
  V: s => {
    s = swap(s, `value: fv, strong: w >= STRONG, prov });`, `value: fv, strong: w >= STRONG, prov, kept: keptIt });`);
    s = swap(s, `value: cv, strong: present >= STRONG });`, `value: cv, strong: present >= STRONG, kept: keptIt });`);
    s = swap(s, `value: val, strong: w >= STRONG, prov, note: true });`, `value: val, strong: w >= STRONG, prov, note: true, kept: keptIt });`);
    return swap(s, `          const v = prof[f];
          if (v && v.pos > 0) {
            const kept = [...new Set((v.evidence || []).filter(e => e.value > 0 && e.perfume).map(e => e.perfume.id))];
            contradicted.push({ note: a.id, f, perfumes: kept });
          } else bind.push({ note: a.id, f, words: a.words || [] });`, `          const kept = [...new Set(((prof[f] || {}).evidence || []).filter(e => e.value > 0 && e.perfume && e.kept).map(e => e.perfume.id))];
          if (kept.length) contradicted.push({ note: a.id, f, perfumes: kept });
          else bind.push({ note: a.id, f, words: a.words || [] });`);
  },
  R: s => swap(s, `if (v.cls === "mixed") { risks.push({ f, s, w, kind: "mixed", sev: w * sw * 0.8 }); penalty += w * sw * 0.3; continue; }`,
    `if (v.cls === "mixed") { risks.push({ f, s, w, kind: "mixed", sev: w * sw * 0.8 }); if (Math.abs(Math.round(v.score * 1e9) / 1e9) < 0.7) penalty += w * sw * 0.3; else if (v.score < 0) penalty += w * sw * (-v.score); else reward += w * sw * v.score; continue; }`)
};
const build = keys => keys.reduce((s, k) => patch[k](s), SRC);
const VARIANTS = { head: [], "A C D E": ["A", "C", "D", "E"], "A B1 C D E": ["A", "B1", "C", "D", "E"], "A B2 C D E": ["A", "B2", "C", "D", "E"],
  "adopted: A B1 C D E S V R": ["A", "B1", "C", "D", "E", "S", "V", "R"] };


/* the quiz's palate rule (palateGroups and archetypeOf in site/js/quiz.js), as copied and checked against the page in
   g_palate_whatif.js; the lead group, or wide, selective or none */
const GROUPS = L.palateGroups(), ORDER = Object.keys(GROUPS), groupOf = f => ORDER.find(g => GROUPS[g].includes(f));
function palate(E, prof, ratings) {
  const liked = L.byStrength(prof, ["goodLikely", "goodPossible"]), vote = {};
  for (const f of liked) for (const e of prof[f].evidence || []) {
    if (!e.perfume || !(e.value > 0) || e.stage === "opening" || !E.kept(ratings[e.perfume.id])) continue;
    const x = ((e.perfume.stages || {})[e.stage] || {})[f] || 0; if (!(x > 0)) continue;
    const cur = vote[e.perfume.id]; if (!cur || x > cur.x) vote[e.perfume.id] = { x, g: groupOf(f) };
  }
  const G = [];
  for (const v of Object.values(vote)) { const g = G.find(o => o.g === v.g); if (g) g.sum += v.x; else G.push({ g: v.g, sum: v.x, first: liked.findIndex(f => GROUPS[v.g].includes(f)) }); }
  G.sort((p, q) => q.sum - p.sum || p.first - q.first);
  if (!G.length) return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? "selective" : null;
  if (G.length === 1 || G[0].sum > 2 * G[1].sum) return G[0].g;
  if (G.length >= 3 && Object.keys(vote).length >= 4 && G[0].sum <= 2 * G[2].sum) return "wide";
  return G[0].g + "-" + G[1].g;
}
function measure(ctx, nb) {
  const rp = L.rng(SEED + nb), ra = L.rng(SEED + nb + 100), re = L.rng(SEED + nb + 200);
  const m = { palLead: [], palAny: [], palNamed: [], prec: [], top: [], likely: [0, 0], likes: [], keep: [], turn: [], likedBad: 0, keptBad: 0, freeWatch: 0, picks: 0, classes: [] };
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(rp, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, rp, nb), ra, { notes: 0.6, told: true });
    const res = L.run(ctx, ses), prof = res.prof;
    const fb = L.classOf(prof, ["badLikely", "badPossible"]), fg = L.classOf(prof, ["goodLikely", "goodPossible"]);
    if (fb.length) { m.prec.push(fb.filter(f => per.bad.includes(f)).length / fb.length); m.top.push(per.bad.includes(L.byStrength(prof, ["badLikely", "badPossible"])[0]) ? 1 : 0); }
    for (const [f, v] of Object.entries(prof)) if (v.cls === "badLikely") { m.likely[1]++; if (per.bad.includes(f)) m.likely[0]++; }
    if (fg.length) m.likes.push(fg.filter(f => per.like.includes(f)).length / fg.length);
    /* the contradictions: a deal-breaker the visitor said they liked in some bottle, or that a bottle they still wear holds strongly */
    for (const f of fb) {
      if (Object.values(ses.ratings).some(r => ((r.noteAnswers || {})[f] || 0) > 0)) m.likedBad++;
      if (Object.entries(ses.ratings).some(([id, r]) => ctx.E.kept(r) && r.again === 1 && ((ctx.E.byId[id].stages.drydown || {})[f] || 0) >= 0.4)) m.keptBad++;
    }
    for (const p of res.rec.picks) { m.picks++; if (p.reason.clear.some(f => p.reason.watch && p.reason.watch.f === f)) m.freeWatch++; }
    if (res.picks.length) { const oc = res.picks.map(id => L.outcome(ctx.TRUTH[id], per, re, K)); m.keep.push(L.mean(oc.map(x => x.keep))); m.turn.push(L.mean(oc.map(x => x.turn))); }
    const pal = palate(ctx.E, prof, ses.ratings), lead = groupOf(per.like.slice().sort((a, b) => per.u[b] - per.u[a])[0]);
    const named = pal && !["wide", "selective"].includes(pal) ? pal.split("-") : null;
    m.palNamed.push(named ? 1 : 0);
    if (named) { m.palLead.push(named[0] === lead ? 1 : 0); m.palAny.push(named.some(g => per.like.map(groupOf).includes(g)) ? 1 : 0); }
    m.classes.push(Object.keys(prof).sort().map(f => f + ":" + prof[f].cls).join(","));
  }
  return m;
}
const out = {};
let base = null;
for (const [name, keys] of Object.entries(VARIANTS)) {
  const ctx = L.site({ engineSource: build(keys) });
  for (const nb of [3, 8]) {
    const m = measure(ctx, nb);
    const key = `${name} | ${nb} bottles`;
    if (name === "head") (base = base || {})[nb] = m.classes;
    const changed = m.classes.filter((c, i) => c !== base[nb][i]).length;
    out[key] = { dbPrecision: L.mean(m.prec), firstRight: L.mean(m.top), likelyRight: m.likely[0] / m.likely[1], likesTrue: L.mean(m.likes), keep: L.mean(m.keep), turn: L.mean(m.turn),
      palateNamed: L.mean(m.palNamed), palateLead: L.mean(m.palLead), palateAny: L.mean(m.palAny), likedShownAsBreaker: m.likedBad, keptShownAsBreaker: m.keptBad, freeAndWatch: m.freeWatch, picks: m.picks, visitorsWithAClassChange: changed };
  }
  process.stderr.write(".");
}
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "fix_trial.json"), JSON.stringify({ visitors: N_PER, seed: SEED, out }, null, 1));
const P = L.pct;
console.log(`\n${N_PER} visitors per row, seed ${SEED}; the same visitors and answers under every version\n`);
console.log(L.table(Object.entries(out).map(([k, v]) => ({ version: k, "flagged true": P(v.dbPrecision), "first named true": P(v.firstRight), "Likely true": P(v.likelyRight), "likes true": P(v.likesTrue),
  kept: P(v.keep), turn: P(v.turn), "palate named": P(v.palateNamed), "palate lead = strongest like": P(v.palateLead), "palate names a liked group": P(v.palateAny), "deal-breakers the visitor said they liked": v.likedShownAsBreaker, "deal-breakers in a bottle still worn": v.keptShownAsBreaker, "free of X and watch X": v.freeAndWatch,
  "visitors whose classes change": v.visitorsWithAClassChange })),
  ["version", "flagged true", "first named true", "Likely true", "likes true", "kept", "turn", "palate named", "palate lead = strongest like", "palate names a liked group", "deal-breakers the visitor said they liked", "deal-breakers in a bottle still worn", "free of X and watch X", "visitors whose classes change"]));

/* the site's engine after the fixes should behave exactly as the adopted version: the same profile, scores, classes,
   picks and reasons for the same visitors, avoided notes included */
{
  const live = L.site(), trial = L.site({ engineSource: build(VARIANTS["adopted: A B1 C D E S V R"]) });
  const r = L.rng(SEED + 7); let same = 0, n = 0, first = null;
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(r, live), ses = L.answer(live, per, L.bottles(live, per, r, 1 + Math.floor(r() * 7)), r, { notes: 0.8, told: r() < 0.7 });
    const a = L.run(live, ses), b = L.run(trial, ses);
    const sig = x => JSON.stringify([Object.keys(x.prof).sort().map(f => [f, x.prof[f].cls, x.prof[f].score]), x.picks, x.rec.picks.map(p => p.reason)]);
    n++; if (sig(a) === sig(b)) same++; else if (!first) first = JSON.stringify(ses.ratings).slice(0, 300);
  }
  console.log(`\nThe site's engine against the adopted version A B1 C D E S V R: identical for ${same} of ${n} visitors${first ? "; first difference: " + first : ""}.`);
}
