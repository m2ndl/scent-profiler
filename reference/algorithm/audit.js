/* Audit: synthetic quiz visitors run through the real page (tests/lib/dom.js stub), each result checked against
   what the visitor answered. Usage: node audit.js [n] [seed] [repoDir]. Prints counts per pattern and examples. */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = process.argv[4] || "C:/Users/malha/Desktop/Webapps/perfume-profiler";
const SITE = path.join(ROOT, "site");
const { createPage } = require(path.join(ROOT, "tests/lib/dom"));
const { loadSite } = require(path.join(ROOT, "tools/lib/site"));
const scripts = [...fs.readFileSync(path.join(SITE, "quiz.html"), "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
const W = loadSite("data", "mapper", "materials", "evidence", "engine", "notes");
const D = W.PP_DATA, E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE), N = W.PP_NOTES.create(D, W.PP_MAP, E);
const N_VISITORS = +(process.argv[2] || 400);
let seed = +(process.argv[3] || 7);
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const GROUPS = { amber: ["amber_resin", "tonka_coumarin", "tobacco_honey"], sweet: ["vanilla_gourmand", "coffee_gourmand", "fruity_sweet"],
  oud: ["oud_smoky", "oud_animalic", "incense_resin", "leather_smoky", "animalic"], musk: ["white_musk", "skin_musk", "aldehydes"],
  woody: ["woody_amber", "sandalwood_creamy", "cedar_dry", "vetiver", "patchouli", "oakmoss_chypre"], rose: ["rose", "damascone_fruit"],
  floral: ["white_floral", "iris_powdery", "muguet_floral"], fresh: ["citrus_fresh", "aquatic_marine", "green_herbal", "lavender_aromatic", "spice_fresh"],
  spiced: ["spicy_warm", "saffron_leathery"] };
const groupOf = f => Object.keys(GROUPS).find(k => GROUPS[k].includes(f));
const famByName = {}; for (const [f, v] of Object.entries(D.FAMILIES)) famByName[v.en.replace(/\s*\([^)]*\)\s*/g, " ").trim()] = f;
const POOL = D.QUIZ.grid.concat(D.QUIZ.more);
const cards = D.QUIZ.notePicker.flatMap(s => s.notes);
const SWEET = D.QUIZ.taste.sweet, BITTER = D.QUIZ.taste.bitter;

function visitor() {
  const n = 1 + Math.floor(rnd() * 4), ids = new Set();
  while (ids.size < n) ids.add(rnd() < 0.85 ? pick(POOL) : pick(E.PERFUMES).id);
  const ratings = {}, story = [];
  for (const id of ids) {
    const P = E.byId[id], r = rnd();
    const verdict = r < 0.55 ? "still" : r < 0.8 ? "turned" : r < 0.9 ? "shop" : "other";
    if (verdict === "other") { story.push(id + ":other"); continue; }
    const stage = verdict === "turned" ? pick(["opening", "heart", "drydown", "drydown"]) : verdict === "shop" ? "opening" : "drydown";
    const rec = { opening: null, heart: null, drydown: null, again: null, chips: {}, src: "quiz" };
    if (verdict === "still") { rec.drydown = 1; rec.again = 1; }
    if (verdict === "turned") { rec[stage] = -2; rec.again = 0; if (rnd() < 0.5) rec.chips[stage] = [pick(D.CHIPS).id]; }
    if (verdict === "shop") { rec.opening = -1; }
    const rows = N.questions(P, verdict === "shop" ? "shop" : "worn"), na = {}, un = [];
    for (const row of rows) {
      if (rnd() < 0.45) continue;
      if (rnd() < 0.08) { un.push(row.f); continue; }
      const lean = verdict === "still" ? [2, 1, 1, 0, -1] : [-2, -1, -1, 0, 1, 2];
      na[row.f] = pick(lean);
    }
    if (Object.keys(na).length) rec.noteAnswers = na;
    if (un.length) rec.unnoticed = un;
    ratings[id] = rec;
    story.push(`${id}:${verdict}${verdict === "turned" ? "@" + stage : ""}${Object.keys(na).length ? " " + JSON.stringify(na) : ""}`);
  }
  const quiz = { notes: {} };
  for (let i = 0, k = Math.floor(rnd() * 5); i < k; i++) quiz.notes[pick(cards).id] = rnd() < 0.5 ? 1 : -1;
  quiz.taste = pick(["bitter", "sweet", "both", "unsure", "bitter", "sweet"]);
  const tr = rnd(); quiz.told = tr < 0.4 ? [] : [pick(["sweet", "chemical", "soapy", "heavy", "powdery", "smoky"])]; if (!quiz.told.length && tr < 0.2) quiz.toldNone = true;
  quiz.anosmia = pick(["yes", "no", "unsure", "no"]);
  return { ratings, quiz, story };
}

function run(v) {
  const p = createPage({ localStorage: { pp_device: JSON.stringify("d"), pp_lang: JSON.stringify("en"), pp_ratings_v1: JSON.stringify(v.ratings), pp_quiz_v1: JSON.stringify(v.quiz) } });
  p.load(scripts);
  const html = () => p.snapshot().els.quiz.innerHTML;
  p.click({ dataset: { start: "1" } });
  p.click({ dataset: { none: "1" } });
  for (let i = 0; i < 6 && /data-pn=/.test(html()); i++) p.click({ dataset: { continue: "1" } });
  p.click({ dataset: { taste: v.quiz.taste } });
  p.click({ dataset: { continue: "1" } });
  p.click({ dataset: { anosmia: v.quiz.anosmia } });
  return html();
}

const tally = {}, examples = {};
const hit = (k, msg) => { tally[k] = (tally[k] || 0) + 1; (examples[k] = examples[k] || []).length < 4 && examples[k].push(msg); };
let withResult = 0;
for (let i = 0; i < N_VISITORS; i++) {
  const v = visitor();
  const h = run(v);
  const told = N.toldItems(v.quiz), prof = E.computeProfile({ ratings: v.ratings, auto: {}, images: {}, told });
  const kept = new Set(Object.entries(v.ratings).filter(([, r]) => ["opening", "heart", "drydown"].every(s => r[s] == null || r[s] >= 0) && ["opening", "heart", "drydown"].some(s => r[s] > 0)).map(([id]) => id));
  const palate = (/<p class="eyebrow">Your palate<\/p><h1>([^<]*)<\/h1>/.exec(h) || [])[1] || null;
  if (!palate) continue;
  withResult++;
  const good = [...(/<div class="qtaste-row good">([^]*?)<\/div><\/div>/.exec(h) || ["", ""])[1].matchAll(/<span class="qchip good">([^<]*)<\/span>/g)].map(m => famByName[m[1].trim()]).filter(Boolean);
  const picks = [...h.matchAll(/data-event="sample:([^"]+)"/g)].map(m => m[1]).filter((x, j, a) => a.indexOf(x) === j);
  const tag = `[${v.story.join(" | ")}] taste=${v.quiz.taste} cards=${JSON.stringify(v.quiz.notes)} -> ${palate}`;
  /* the positive bottle evidence behind a family, by stage and by whether the bottle was kept */
  const pos = f => ((prof[f] || {}).evidence || []).filter(e => e.value > 0 && e.perfume);
  const onlyOpening = f => { const e = pos(f); return e.length > 0 && e.every(x => x.stage === "opening"); };
  const fromUnkept = f => { const e = pos(f); return e.length > 0 && e.every(x => !kept.has(x.perfume.id)); };
  /* 1. a family shown as "drawn to" whose only like is a note in the first minutes */
  for (const f of good) if (onlyOpening(f)) hit("drawn_from_opening_only", `${f}: ${tag}`);
  /* 2. a family shown as "drawn to" whose only like comes from a bottle the visitor did not keep */
  for (const f of good) if (fromUnkept(f)) hit("drawn_from_unkept_bottle", `${f}: ${tag}`);
  /* 3. the palate named from a group whose only votes come from bottles the visitor did not keep */
  const lead = palate.replace(/^The /, "").replace(/ Palate$/, "").split(" and ")[0].toLowerCase();
  if (GROUPS[lead]) { const fams = GROUPS[lead].filter(f => pos(f).some(e => e.stage !== "opening")); if (fams.length && fams.every(fromUnkept)) hit("palate_from_unkept_bottle", tag); }
  /* 3b. the palate named from a group the visitor liked only in first minutes (a top note) */
  if (GROUPS[lead]) { const fams = GROUPS[lead].filter(f => pos(f).length); if (fams.length && fams.every(onlyOpening)) hit("palate_from_opening_only", tag); }
  /* 4. the taste answer against the palate or the chips, said nowhere on the page */
  const side = v.quiz.taste === "bitter" ? SWEET : v.quiz.taste === "sweet" ? BITTER : null;
  if (side) {
    const against = good.filter(f => (side[f] || 0) >= 0.5);
    const says = /You said you prefer/.test(h);
    if (against.length && !says) hit("taste_answer_overridden_silently", `${against.join(",")}: ${tag}`);
    if (against.length && against.every(onlyOpening)) hit("taste_answer_beaten_by_opening_only", `${against.join(",")}: ${tag}`);
  }
  /* 5. an avoided card's family shown as "drawn to" with no line saying why */
  for (const a of N.avoidedNotes(v.quiz)) for (const [f, w] of Object.entries(a.fams || {})) if (w >= 0.5 && good.includes(f) && !/class="qcontra"/.test(h)) hit("avoided_but_drawn_unexplained", `${a.id}->${f}: ${tag}`);
  /* 6. picks: one led (heart or base) by an avoided card's family, or holding a likely deal-breaker at strength */
  const likely = Object.entries(prof).filter(([, x]) => x.cls === "badLikely").map(([f]) => f);
  for (const id of picks) {
    const P = E.byId[id]; if (!P) continue;
    for (const f of likely) if ((P.stages.drydown[f] || 0) >= 0.5 || (P.stages.heart[f] || 0) >= 0.7) hit("pick_holds_likely_breaker", `${id} ${f}: ${tag}`);
    /* 7. a pick whose stated reason ("Has X, which you like") rests on a like from the first minutes only */
    const P2 = P, likesShown = [...h.matchAll(new RegExp(`data-event="sample:${id}"`, "g"))].length;
    void P2; void likesShown;
  }
  /* 8. picks: led in the heart or base by a family the visitor avoided on a card that no kept bottle carries; rated
     already; two from one house */
  const avoidF = [];
  for (const a of N.avoidedNotes(v.quiz)) for (const [f, w] of Object.entries(a.fams || {})) if (w >= 0.5 && !((prof[f] || {}).pos > 0)) avoidF.push(f);
  const leadsF = (P, f, st) => { const x = P.stages[st] || {}, w = x[f] || 0; return w >= 0.7 && w >= Math.max(...Object.values(x)); };
  const houses = new Set();
  for (const id of picks) {
    const P = E.byId[id]; if (!P) continue;
    for (const f of avoidF) if (leadsF(P, f, "heart") || leadsF(P, f, "drydown")) hit("pick_led_by_avoided", `${id} ${f}: ${tag}`);
    if (v.ratings[id]) hit("pick_already_rated", `${id}: ${tag}`);
    if (houses.has(P.house)) hit("picks_same_house", `${id}: ${tag}`); houses.add(P.house);
  }
  /* 9. a deal-breaker whose only evidence is a note hated in a bottle the visitor still wears */
  const badShown = [...(/<div class="qtaste-row bad">([^]*?)<\/div><\/div>/.exec(h) || ["", ""])[1].matchAll(/<span class="qchip bad">([^<]*)<\/span>/g)].map(m => famByName[m[1].trim()]).filter(Boolean);
  for (const f of badShown) { const neg = ((prof[f] || {}).evidence || []).filter(e => e.value < 0 && e.perfume); if (neg.length && neg.every(e => kept.has(e.perfume.id))) hit("breaker_from_kept_bottle_only", `${f}: ${tag}`); }
  /* 10. the palate names a group while the taste card shows no liked family from it */
  if (GROUPS[lead] && !good.some(f => GROUPS[lead].includes(f))) hit("palate_group_not_on_card", tag);
  const reasons = [...h.matchAll(/<div class="rec qpick">[^]*?<b>([^<]*)<\/b>[^]*?<div class="why">Has ([^<]*), which you like\.<\/div>/g)];
  for (const m of reasons) for (const nm of m[2].split(/, | and /)) { const f = Object.keys(D.FAMILIES).find(k => D.FAMILIES[k].en.replace(/\s*\([^)]*\)\s*/g, " ").trim().toLowerCase() === nm.trim().toLowerCase()); if (f && onlyOpening(f)) hit("pick_reason_from_opening_only", `${m[1]} has ${f}: ${tag}`); }
}
console.log(`visitors ${N_VISITORS}, with a palate ${withResult}`);
for (const [k, c] of Object.entries(tally).sort((a, b) => b[1] - a[1])) { console.log(`\n${k}: ${c}`); for (const e of examples[k]) console.log("   " + e.slice(0, 400)); }
