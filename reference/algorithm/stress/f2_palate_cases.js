/* The palate name on the real quiz page for visitors who keep perfumes of one kind, with the verdict alone ("I still
   wear it") and with "Loved it" on the note rows of that kind's families. No synthetic taste here: it shows what the
   name follows. Usage: node f2_palate_cases.js [trios] [seed]. Writes out/f2.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_TRIOS = +(process.argv[2] || 150), SEED = +(process.argv[3] || 81);
const ROOT = L.ROOT, SITE = path.join(ROOT, "site");
const { createPage } = require(path.join(ROOT, "tests", "lib", "dom"));
const scripts = [...fs.readFileSync(path.join(SITE, "index.html"), "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
const ctx = L.site(), { E, N } = ctx;
const GROUPS = L.palateGroups();

function palate(ratings) {
  const p = createPage({ localStorage: { pp_device: JSON.stringify("d"), pp_lang: JSON.stringify("en"), pp_ratings_v1: JSON.stringify(ratings), pp_quiz_v1: JSON.stringify({ taste: "unsure", told: [], anosmia: "no" }) } });
  p.load(scripts);
  const h = () => p.snapshot().els.quiz.innerHTML;
  p.click({ dataset: { start: "1" } }); p.click({ dataset: { none: "1" } });
  for (let i = 0; i < 6 && /data-pn=/.test(h()); i++) p.click({ dataset: { continue: "1" } });
  p.click({ dataset: { taste: "unsure" } }); p.click({ dataset: { continue: "1" } }); p.click({ dataset: { anosmia: "no" } });
  return (/id="qe-([\w-]+)"/.exec(h()) || [])[1] || "none";
}
/* "I still wear it" on each bottle; with loved, "Loved it" on every note row whose family is in one of the groups */
function kept(ids, groups, loved) {
  const r = {};
  for (const id of ids) {
    const rec = { opening: null, heart: null, drydown: 1, again: 1, chips: {}, src: "quiz" };
    if (loved) { const na = {}; for (const row of N.questions(E.byId[id], "worn")) if (groups.some(g => GROUPS[g].includes(row.f))) na[row.f] = 2; if (Object.keys(na).length) rec.noteAnswers = na; }
    r[id] = rec;
  }
  return r;
}
const out = { cases: [], random: {} };
for (const [ids, groups] of [[["adgedt", "bleuedp", "invictus"], ["fresh"]], [["cocomademoiselle", "libre", "missdiorbloomingbouquet"], ["floral", "rose"]]]) {
  out.cases.push({ bottles: ids.map(id => E.byId[id].name), verdictOnly: palate(kept(ids, groups, false)), lovedRows: palate(kept(ids, groups, true)) });
}
const r = L.rng(SEED);
for (const groups of [["floral", "rose"], ["fresh"]]) {
  const pool = E.PERFUMES.filter(P => groups.some(g => GROUPS[g].some(f => Math.max(P.stages.heart[f] || 0, P.stages.drydown[f] || 0) >= 0.8))).map(P => P.id);
  const hit = pal => pal.split("-").some(g => groups.includes(g)) ? 1 : 0;
  const lead = pal => groups.includes(pal.split("-")[0]) ? 1 : 0;
  const t = { pool: pool.length, trios: N_TRIOS, verdictOnly: { named: 0, lead: 0 }, lovedRows: { named: 0, lead: 0 } };
  for (let i = 0; i < N_TRIOS; i++) {
    const ids = L.sample(r, pool, 3);
    const a = palate(kept(ids, groups, false)), b = palate(kept(ids, groups, true));
    t.verdictOnly.named += hit(a); t.verdictOnly.lead += lead(a); t.lovedRows.named += hit(b); t.lovedRows.lead += lead(b);
  }
  out.random[groups.join("+")] = t;
}
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "f2.json"), JSON.stringify(out, null, 1));
for (const c of out.cases) console.log(`${c.bottles.join(", ")}: verdict only ${c.verdictOnly}; "Loved it" on its rows of that kind ${c.lovedRows}`);
for (const [g, t] of Object.entries(out.random)) console.log(`${N_TRIOS} random trios of perfumes holding ${g} at 0.8+ in the heart or base (${t.pool} such perfumes): the palate names ${g} (lead) for ${t.verdictOnly.named} (${t.verdictOnly.lead}) with the verdict only, ${t.lovedRows.named} (${t.lovedRows.lead}) with "Loved it" on those rows`);
