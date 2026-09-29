/* What-if for the palate name, the weakest result in angle 7. The quiz's rule (palateGroups and archetypeOf in
   site/js/quiz.js) is copied here so that two other voting rules can be compared on the same wearers; the copy is
   first checked against the real page on a sample. Nothing here changes the site.
   current:  each kept bottle votes for the group of its liked family with the greatest presence in the stage rated.
   lift:     ... with the greatest presence above that family's average presence in the catalogue at that stage, so a
             musk or woody amber that nearly every base holds counts only for what it adds.
   words:    ... for the family the wearer said they loved or liked on the bottle's note rows, when there is one
             (highest answer, then presence); otherwise as current.
   Usage: node g_palate_whatif.js [wearers] [seed]. Writes out/g.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 3000), SEED = +(process.argv[3] || 71);
const ROOT = L.ROOT, SITE = path.join(ROOT, "site");
const ctx = L.site(), { E } = ctx;
const GROUPS = L.palateGroups(), ORDER = Object.keys(GROUPS), groupOf = f => ORDER.find(g => GROUPS[g].includes(f));
const avg = {}; for (const s of L.STAGES) { avg[s] = {}; for (const P of E.PERFUMES) for (const [f, w] of Object.entries(P.stages[s] || {})) avg[s][f] = (avg[s][f] || 0) + w / E.PERFUMES.length; }

function palate(prof, ratings, rule) {
  const liked = L.byStrength(prof, ["goodLikely", "goodPossible"]);
  const vote = {};
  for (const f of liked) for (const e of prof[f].evidence || []) {
    if (!e.perfume || !(e.value > 0) || e.stage === "opening" || !E.kept(ratings[e.perfume.id])) continue;
    const x = ((e.perfume.stages || {})[e.stage] || {})[f] || 0; if (!(x > 0)) continue;
    const key = rule === "lift" ? x - (avg[e.stage][f] || 0) : rule === "words" ? (e.note ? 10 * e.value : 0) + x : x;
    const cur = vote[e.perfume.id];
    if (!cur || key > cur.key) vote[e.perfume.id] = { key, x: rule === "lift" ? Math.max(0.05, x - (avg[e.stage][f] || 0)) : x, g: groupOf(f) };
  }
  const G = [];
  for (const v of Object.values(vote)) { const g = G.find(o => o.g === v.g); if (g) g.sum += v.x; else G.push({ g: v.g, sum: v.x, first: liked.findIndex(f => GROUPS[v.g].includes(f)) }); }
  G.sort((p, q) => q.sum - p.sum || p.first - q.first);
  if (!G.length) return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? "selective" : null;
  const bottles = Object.keys(vote).length;
  if (G.length === 1 || G[0].sum > 2 * G[1].sum) return G[0].g;
  if (G.length >= 3 && bottles >= 4 && G[0].sum <= 2 * G[2].sum) return "wide";
  return G[0].g + "-" + G[1].g;
}

/* check the copy against the real page */
const { createPage } = require(path.join(ROOT, "tests", "lib", "dom"));
const scripts = [...fs.readFileSync(path.join(SITE, "quiz.html"), "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
function pagePalate(ratings, quiz) {
  const answers = Object.assign({ taste: "unsure", told: [], anosmia: "no" }, quiz);
  const p = createPage({ localStorage: { pp_device: JSON.stringify("d"), pp_lang: JSON.stringify("en"), pp_ratings_v1: JSON.stringify(ratings), pp_quiz_v1: JSON.stringify(answers) } });
  p.load(scripts);
  const html = () => p.snapshot().els.quiz.innerHTML;
  p.click({ dataset: { start: "1" } }); p.click({ dataset: { none: "1" } });
  for (let i = 0; i < 6 && /data-pn=/.test(html()); i++) p.click({ dataset: { continue: "1" } });
  p.click({ dataset: { taste: answers.taste } }); p.click({ dataset: { continue: "1" } }); p.click({ dataset: { anosmia: answers.anosmia } });
  return (/id="qe-([\w-]+)"/.exec(html()) || [])[1] || null;
}
const rc = L.rng(SEED + 5); let agree = 0, checked = 0;
for (let i = 0; i < 300; i++) {
  const per = L.persona(rc, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, rc, 3), rc, { notes: 0.6, told: true });
  const res = L.run(ctx, ses);
  checked++; if (palate(res.prof, ses.ratings, "current") === pagePalate(ses.ratings, ses.quiz)) agree++;
}

/* two populations: bottles owned regardless of taste (lib.js default), and bottles owned for what the wearer likes in
   them (o.taste 4), the case most favourable to naming a palate from kept bottles */
function population(taste, seed, heartToo) {
  const r = L.rng(seed), rows = { current: [], lift: [], words: [] }, ceiling = { lead: [], any: [] };
  const dist = { current: {}, lift: {}, words: {} };
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 3, { taste }), r, { notes: 0.6, told: true });
    /* heartToo: "I still wear it" also writes +1 on the heart, to see whether crediting only the base is what limits the name */
    if (heartToo) for (const rec of Object.values(ses.ratings)) if (rec.again === 1 && rec.drydown === 1 && rec.heart == null) rec.heart = 1;
    const res = L.run(ctx, ses);
    const strongest = per.like.slice().sort((a, b) => per.u[b] - per.u[a])[0];
    const lead = groupOf(strongest), likedGroups = new Set(per.like.map(groupOf));
    /* the ceiling for any vote over kept bottles: is the strongest like, or any like, in the heart or base (0.4+) of a kept bottle? */
    const keptIds = Object.keys(ses.ratings).filter(id => E.kept(ses.ratings[id]));
    const inKept = f => keptIds.some(id => ["heart", "drydown"].some(st => ((E.byId[id].stages[st] || {})[f] || 0) >= 0.4));
    ceiling.lead.push(inKept(strongest) ? 1 : 0); ceiling.any.push(per.like.some(inKept) ? 1 : 0);
    for (const rule of Object.keys(rows)) {
      const pal = palate(res.prof, ses.ratings, rule);
      const key = !pal ? "none" : ["wide", "selective"].includes(pal) ? pal : pal.split("-")[0];
      dist[rule][key] = (dist[rule][key] || 0) + 1;
      if (!pal || ["wide", "selective"].includes(pal)) continue;
      const g = pal.split("-");
      rows[rule].push({ lead: g[0] === lead ? 1 : 0, any: g.some(x => likedGroups.has(x)) ? 1 : 0 });
    }
  }
  return { ceilingLead: L.mean(ceiling.lead), ceilingAny: L.mean(ceiling.any), rules: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, { named: v.length / N_PER, lead: L.mean(v.map(x => x.lead)), any: L.mean(v.map(x => x.any)), dist: dist[k] }])) };
}
const res = { copyMatchesPage: `${agree} of ${checked}`, anyBottles: population(0, SEED), likedBottles: population(4, SEED + 1), heartToo: population(0, SEED, true) };
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "g.json"), JSON.stringify(res, null, 1));
const P = L.pct;
console.log(`The copy of the quiz's rule gives the page's palate for ${res.copyMatchesPage} wearers.`);
for (const [k, pop] of [["Bottles owned regardless of taste", res.anyBottles], ["Bottles owned for what the wearer likes in them", res.likedBottles], ["As the first, with \"I still wear it\" also writing +1 on the heart", res.heartToo]]) {
  console.log(`\n${k}: the strongest like sits (0.4+, heart or base) in a kept bottle for ${P(pop.ceilingLead)} of wearers; any like for ${P(pop.ceilingAny)}.\n`);
  console.log(L.table(Object.entries(pop.rules).map(([r, v]) => ({ rule: r, "group palate named": P(v.named), "lead = strongest like": P(v.lead), "names a liked group": P(v.any),
    "lead groups named (share of wearers)": Object.entries(v.dist).sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${P(n / N_PER)}`).join(", ") })),
    ["rule", "group palate named", "lead = strongest like", "names a liked group", "lead groups named (share of wearers)"]));
}
