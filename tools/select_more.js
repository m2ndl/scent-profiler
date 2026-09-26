#!/usr/bin/env node
/* Chooses QUIZ.more in site/js/data.js: the bottles the quiz's "More perfumes" button adds after the twenty grid
   bottles, twenty at a time. Reasoning and the result: reference/quiz/MORE.md.

     node tools/select_more.js

   Popularity is the score reference/expansion/choose.py gave the 667 additions, here for the whole catalogue: each Saudi
   store that lists a perfume as a best seller or popular adds 0.5, plus up to 0.5 for its place in that list (Golden
   Scent's best sellers, Nice One's most popular, Amazon.sa's best sellers, Sephora's best sellers, Faces' bestsellers
   page or 0.1 for its badge, Noon by rating count and its "best in category" badge). Store rows reach a catalogue
   perfume through its Fragrantica page (reference/expansion/resolved.json and record.json), through the catalogue's
   name matcher for the rows the Fragrantica resolver left (reference/quiz/popularity/unresolved_sales.json, made by
   match_unresolved.py there) and, for Amazon.sa and Nice One, through reference/quiz/popularity/sa_popularity.json;
   the better place counts.

   Each set of twenty takes, in score order, the most popular perfumes that pass these rules:
   - six from the Arab houses and fourteen from the others: Arab-house bottles sell mostly on Noon and Amazon.sa, and
     the other stores' lists leave them out, so one ranking would crowd them out;
   - never more men's than women's, and at most two more women's than men's, while the set fills: the grid leans to
     men's (nine to six), so across the grid and both sets the two come out even;
   - at most two from any house across the forty;
   - one bottle per perfume line: no flanker of a bottle already shown, grid included (Sauvage Eau de Toilette after
     Sauvage Eau de Parfum); a line's men's and women's bottles are different lines (Eros Pour Femme after Eros);
   - never a clone with its original;
   - a bottle photo, and a deciding family at strength (the grid's rule in tools/select_grid.js);
   - none of the entries still open in the catalogue checks (DOUBT).
   The script prints; it writes nothing. */
"use strict";
const fs = require("fs");
const path = require("path");
const { ROOT, loadSite } = require("./lib/site");

const W = loadSite("data", "mapper", "materials", "evidence", "engine", "bottles");
const D = W.PP_DATA, E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE);
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, "reference", f), "utf8"));
const RES = read("expansion/resolved.json"), REC = read("expansion/record.json"), SA = read("quiz/popularity/sa_popularity.json").perfumes;
const UNRES = read("quiz/popularity/unresolved_sales.json").perfumes;

const SETS = 2, SIZE = 20, ARAB_PER_SET = 6, PER_HOUSE = 2, WOMEN_AHEAD = 2;
/* The ten families that decide recommendations (tools/select_grid.js). */
const DECIDING = ["vanilla_gourmand", "woody_amber", "white_musk", "amber_resin", "tonka_coumarin", "sandalwood_creamy",
  "patchouli", "oud_smoky", "white_floral", "cedar_dry"];
/* Entries still open in the catalogue checks: the five whose notes may describe another perfume (PROJECT_LOG,
   25 Sep 2026) and those reference/expansion/verify_report.md leaves to the owner for identity, sex or pyramid
   (N1, N2, N3, N5, N6, N7, N14, N15). */
const DOUBT = ["safariextreme", "cdnimwoman", "barakkatrouge", "mostwantedparfum", "layali", "hugowomanedp", "creation",
  "cerr1881", "caroherrch", "perrelli360", "jaguarfm", "pinkdiamondsakura", "leparfumroyal", "noora", "reef11", "officer",
  "velvettouch", "primemax", "lancy", "theone", "blackincense", "rosenoir", "oudcouture", "amberoud", "felino",
  "pashadecartiereditionnoireed"];

/* ---------- popularity (reference/expansion/choose.py place()) ---------- */
const LIST = { goldenscent: 1079, amazon: 100, niceone: 360, sephora: 34, faces: 96 };
function place(r) {
  if (r.source === "noon") {
    const s = Math.min(0.5, Math.log10((r.count || 0) + 1) / 8), b = (r.signal || {}).best_in_category;
    return s + (b ? 0.5 * (1 - (b - 1) / 50) : 0);
  }
  if (r.source === "faces" && r.list === "badge") return 0.1;
  if (r.source === "faces" && r.list !== "best") return null;
  return Math.max(0, 0.5 * (1 - (r.rank - 1) / LIST[r.source]));
}
const fids = {};
for (const [id, fid] of Object.entries(RES.catalogue)) fids[id] = [fid];
for (const [id, e] of Object.entries(REC)) if (e && e.fid) fids[id] = [e.fid].concat(e.repointed_from ? [].concat(e.repointed_from).map(x => (x && typeof x === "object" ? x.fid : x)) : []);
const rowsByFid = {};
for (const r of RES.rows) (rowsByFid[r.fid] = rowsByFid[r.fid] || []).push(r);
function stores(id) {
  const s = {};
  const add = (source, p) => { if (p != null) s[source] = Math.max(s[source] || 0, 0.5 + p); };
  for (const fid of fids[id] || []) for (const r of rowsByFid[fid] || []) add(r.source, place(r));
  for (const r of UNRES[id] || []) add(r.source, place(r));
  const sa = SA[id];
  if (sa) {
    for (const r of sa.amazon || []) add("amazon", place({ source: "amazon", rank: r.rank }));
    for (const r of sa.niceone || []) add("niceone", place({ source: "niceone", rank: r.rank }));
  }
  return s;
}
const STORES = {}, SCORE = {};
for (const P of E.PERFUMES) { STORES[P.id] = stores(P.id); SCORE[P.id] = Object.values(STORES[P.id]).reduce((a, b) => a + b, 0); }

/* ---------- lines ---------- */
const fold = s => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’`]/g, "'");
const GENERIC = new Set(["le", "la", "les", "l", "the", "eau", "pour", "for", "my", "miss", "mon", "de", "du", "el", "al"]);
const HOUSE_WORDS = { "giorgio armani": ["giorgio", "armani", "emporio"] };
/* A perfume's line: its house and the first word of its name (two when the first is an article or the like), after
   the house's own words that some names start with ("Gucci Guilty ...", "Emporio Armani Stronger With You ..."). */
function lineOf(P) {
  const house = fold(P.house), own = new Set(HOUSE_WORDS[house] || house.split(/[^a-z0-9]+/));
  let w = fold(P.name).replace(/^l'/, "").replace(/(\d)\s+(?=[a-z])/g, "$1").split(/[^a-z0-9]+/).filter(Boolean);
  while (w.length > 1 && own.has(w[0])) w = w.slice(1);
  if (w.length === 1 && own.has(w[0])) return house + "|" + w[0];
  return house + "|" + w.slice(0, GENERIC.has(w[0]) ? 2 : 1).join(" ");
}
const sameLine = (a, b) => lineOf(a) === lineOf(b) && (a.gender === b.gender || a.gender === "u" || b.gender === "u");

/* ---------- selection ---------- */
const dd = (P, f) => P.stages.drydown[f] || 0, hh = (P, f) => P.stages.heart[f] || 0;
const deciding = P => DECIDING.some(f => dd(P, f) >= 0.5 || hh(P, f) >= 0.7);
const isArab = P => P.tier === "arab";
const grid = D.QUIZ.grid.map(id => E.byId[id]);
const shown = grid.slice(), chosen = [], why = {};
const clash = P => shown.some(Q => Q.id === P.cloneOf || Q.cloneOf === P.id);
const houseCount = P => chosen.filter(Q => Q.house === P.house).length;
const pool = E.PERFUMES.filter(P => !D.QUIZ.grid.includes(P.id)).sort((a, b) => SCORE[b.id] - SCORE[a.id] || a.id.localeCompare(b.id));
for (const P of pool) {
  if (DOUBT.includes(P.id)) why[P.id] = "open check";
  else if (!W.PP_BOTTLES[P.id]) why[P.id] = "no photo";
  else if (!deciding(P)) why[P.id] = "no deciding family at strength";
}
/* Whether P can take the next place in set: the line, clone and house rules hold for good once they fail (what is
   shown only grows), the set's own shares only for now. */
function fits(P, set) {
  if (why[P.id] || chosen.includes(P) || !(SCORE[P.id] > 0)) return false;
  const line = shown.find(Q => sameLine(P, Q));
  if (line) { why[P.id] = "same line as " + line.id; return false; }
  if (clash(P)) { why[P.id] = "clone with its original"; return false; }
  if (houseCount(P) >= PER_HOUSE) { why[P.id] = "house full"; return false; }
  const count = pred => set.filter(pred).length;
  if (isArab(P) ? count(isArab) >= ARAB_PER_SET : count(Q => !isArab(Q)) >= SIZE - ARAB_PER_SET) return false;
  const m = count(Q => Q.gender === "m"), f = count(Q => Q.gender === "f");
  return !((P.gender === "m" && m + 1 > f) || (P.gender === "f" && f + 1 > m + WOMEN_AHEAD));
}
/* each place goes to the most popular bottle that fits; QUIZ.more lists the sets in turn, each by popularity */
const sets = [];
for (let s = 0; s < SETS; s++) {
  const set = [];
  while (set.length < SIZE) {
    const P = pool.find(Q => fits(Q, set));
    if (!P) break;
    set.push(P); chosen.push(P); shown.push(P);
  }
  set.sort((a, b) => SCORE[b.id] - SCORE[a.id]);
  sets.push(set);
  const g = k => set.filter(P => P.gender === k).length;
  console.log(`\nset ${s + 1}: ${set.length} bottles, ${g("m")} men's, ${g("f")} women's, ${g("u")} unisex, ${set.filter(isArab).length} Arab-house`);
  for (const P of set) console.log(`  ${P.id.padEnd(26)} ${SCORE[P.id].toFixed(2)}  ${P.gender}  ${P.house} · ${P.name}  [${Object.keys(STORES[P.id]).sort().join(", ")}]`);
}
const passed = pool.filter(P => SCORE[P.id] > 0 && !chosen.includes(P) && why[P.id]).slice(0, 40);
console.log("\nleft out on the way (the forty best-scoring):");
for (const P of passed) console.log(`  ${P.id.padEnd(26)} ${SCORE[P.id].toFixed(2)}  ${why[P.id]}`);
console.log("\nQUIZ.more:\n" + JSON.stringify(sets.flat().map(P => P.id)));
