#!/usr/bin/env node
/* Chooses the quiz's twenty grid bottles (QUIZ.grid in site/js/data.js) on two criteria together: Saudi popularity
   and strong material families. Reasoning and results: reference/quiz/GRID2.md.

     node tools/select_grid.js

   Popularity comes from reference/quiz/popularity/sa_popularity.json (made by match_popularity.py there):
     score = 2 x Amazon + Nice One
     Amazon   = (101 - best rank) / 100 over the Amazon.sa Best Sellers rows (men, women, all; lists of 100)
     Nice One = (361 - best rank) / 360 over Nice One's "Most Popular" rows (men, women, unisex; ranks run to 358)
   Amazon counts double because it ranks by Saudi purchases and carries both Arab and Western houses; Nice One carries
   few Arab-house flagships. A perfume in neither list scores 0.

   Family strength is the engine's exclusion rule (engine.js recommend()): a family a likely deal-breaker would
   exclude, drydown 0.5 or more or heart 0.7 or more, on the catalogue after evidence. A family pair (f, g) is
   separated when some tile holds f at that strength and g below 0.4 in both heart and drydown (0.4 is the engine's
   STRONG presence, below which a family is a trace). This reproduces the round table's count for its grid, 88 of 90.

   Constraints: each of the ten deciding families at strength in two tiles or more; pair separation no worse than
   the round-table grid; women's no fewer and men's no more than in that grid; at most three tiles per house; never a
   clone with its original; every tile holds a deciding family at strength. Maximise total popularity (ties: a small
   bonus for the owner's anecdote, then the clearest top family). Greedy start, then best single swaps from several
   starts; each constraint is then dropped in turn to show whether it binds. The script prints; it writes nothing. */
"use strict";
const fs = require("fs");
const path = require("path");
const { ROOT, loadSite } = require("./lib/site");

const W = loadSite("data", "mapper", "materials", "evidence", "engine");
const D = W.PP_DATA, E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE);
const POP = JSON.parse(fs.readFileSync(path.join(ROOT, "reference", "quiz", "popularity", "sa_popularity.json"), "utf8")).perfumes;

/* The grid the quiz round table chose (reference/debate/quiz/round1_A.md, section 2, item 7): the baseline. */
const ROUNDTABLE = ["sauvageedp", "bleuedp", "eros", "cdnim", "hawas", "khamrah", "yara", "libre", "blackopium", "goodgirl",
  "cocomademoiselle", "lavieestbelle", "br540", "interlude", "santal33", "oudwood", "badeealoud", "adgedt", "aventus", "invictus"];
/* The ten families that decide recommendations (reference/debate/quiz/BRIEF.md, catalogue facts). */
const DECIDING = ["vanilla_gourmand", "woody_amber", "white_musk", "amber_resin", "tonka_coumarin", "sandalwood_creamy",
  "patchouli", "oud_smoky", "white_floral", "cedar_dry"];
/* Named by Saudi men the owner asked; a tie-breaker only (worth 0.01, a hundredth of one list place's range). */
const ANECDOTE = { sauvageedt: 0.01, sauvageedp: 0.01, swy: 0.01, paradigme: 0.01, diorhomme2020: 0.01 };
const SIZE = 20, PER_HOUSE = 3;

const dd = (P, f) => P.stages.drydown[f] || 0, hh = (P, f) => P.stages.heart[f] || 0;
const strong = (P, f) => dd(P, f) >= 0.5 || hh(P, f) >= 0.7;
const trace = (P, f) => dd(P, f) < 0.4 && hh(P, f) < 0.4;

function popularity(id) {
  const e = POP[id]; if (!e) return { a: 0, n: 0, score: 0 };
  const a = e.amazon.length ? (101 - Math.min(...e.amazon.map(r => r.rank))) / 100 : 0;
  const n = e.niceone.length ? (361 - Math.min(...e.niceone.map(r => r.rank))) / 360 : 0;
  return { a, n, score: 2 * a + n };
}
/* How clearly the drydown has one top family: its weight minus the runner-up's. */
function clarity(P) {
  const w = Object.values(P.stages.drydown).sort((x, y) => y - x);
  return (w[0] || 0) - (w[1] || 0);
}

const INFO = {};
for (const P of E.PERFUMES) {
  const pop = popularity(P.id);
  INFO[P.id] = { P, pop, fams: DECIDING.filter(f => strong(P, f)), value: pop.score + (ANECDOTE[P.id] || 0) + 0.001 * clarity(P) };
}
const CANDIDATES = E.PERFUMES.filter(P => INFO[P.id].fams.length).map(P => P.id);
/* Per perfume, bit i set when DECIDING[i] is at strength (S) or a trace (T); measure() runs for every swap tried. */
const S = {}, T = {};
for (const P of E.PERFUMES) { S[P.id] = 0; T[P.id] = 0; DECIDING.forEach((f, i) => { if (strong(P, f)) S[P.id] |= 1 << i; if (trace(P, f)) T[P.id] |= 1 << i; }); }

function measure(ids) {
  const Ps = ids.map(id => E.byId[id]);
  const famCount = {}, missing = [];
  DECIDING.forEach((f, i) => {
    let n = 0, sep = 0;
    for (const id of ids) if (S[id] & (1 << i)) { n++; sep |= T[id]; }
    famCount[f] = n;
    DECIDING.forEach((g, j) => { if (j !== i && !(sep & (1 << j))) missing.push(`${f} over ${g}`); });
  });
  const gender = { m: 0, f: 0, u: 0 }; for (const P of Ps) gender[P.gender]++;
  const house = {}; for (const P of Ps) house[P.house] = (house[P.house] || 0) + 1;
  const set = new Set(ids);
  const clones = Ps.filter(P => P.cloneOf && set.has(P.cloneOf)).map(P => `${P.id} copies ${P.cloneOf}`);
  return { famCount, pairs: DECIDING.length * (DECIDING.length - 1) - missing.length, missing, gender, house, clones };
}

const BASE = measure(ROUNDTABLE);
const RULES = {
  families: m => DECIDING.reduce((s, f) => s + Math.max(0, 2 - m.famCount[f]), 0),
  pairs: m => Math.max(0, BASE.pairs - m.pairs),
  gender: m => Math.max(0, BASE.gender.f - m.gender.f) + Math.max(0, m.gender.m - BASE.gender.m),
  house: m => Object.values(m.house).reduce((s, n) => s + Math.max(0, n - PER_HOUSE), 0),
  clones: m => m.clones.length
};

function objective(ids, rules) {
  const m = measure(ids);
  let v = 0; for (const r of rules) v += RULES[r](m);
  return ids.reduce((s, id) => s + INFO[id].value, 0) - 100 * v;
}
/* Best single swap until none improves. */
function climb(start, rules) {
  let cur = start.slice(), best = objective(cur, rules);
  for (;;) {
    let move = null;
    const inSet = new Set(cur);
    for (let i = 0; i < cur.length; i++) for (const id of CANDIDATES) {
      if (inSet.has(id)) continue;
      const next = cur.slice(); next[i] = id;
      const v = objective(next, rules);
      if (v > best + 1e-9) { best = v; move = next; }
    }
    if (!move) return { ids: cur, value: best };
    cur = move;
  }
}
function greedy(rules) {
  const out = [];
  for (const id of CANDIDATES.slice().sort((a, b) => INFO[b].value - INFO[a].value)) {
    if (out.length === SIZE) break;
    const next = out.concat(id), m = measure(next);
    if (rules.includes("house") && RULES.house(m)) continue;
    if (rules.includes("clones") && RULES.clones(m)) continue;
    if (rules.includes("gender") && m.gender.m > BASE.gender.m) continue;
    out.push(id);
  }
  return out;
}
function optimise(rules) {
  const starts = [greedy(rules), ROUNDTABLE.filter(id => CANDIDATES.includes(id)), D.QUIZ.grid.slice()];
  let best = null;
  for (const s of starts) {
    const r = climb(s, rules);
    if (!best || r.value > best.value + 1e-9) best = r;
  }
  return best;
}

/* Recognisable first, each sex spread evenly: a tile's key is (its popularity rank within its gender + 0.5) / the
   gender's count, so the top man's, woman's and unisex bottles open the grid and none bunch at the end. */
function order(ids) {
  const key = {};
  for (const g of ["m", "f", "u"]) {
    const group = ids.filter(id => E.byId[id].gender === g).sort((a, b) => INFO[b].value - INFO[a].value);
    group.forEach((id, i) => { key[id] = (i + 0.5) / group.length; });
  }
  return ids.slice().sort((a, b) => key[a] - key[b] || INFO[b].value - INFO[a].value);
}

const ALL = Object.keys(RULES);
const chosen = optimise(ALL);
const grid = order(chosen.ids);
const M = measure(grid);
const fmt = x => x.toFixed(2);
const famText = id => INFO[id].fams.map(f => { const P = E.byId[id]; return `${f} ${dd(P, f) >= 0.5 ? "d" + dd(P, f) : "h" + hh(P, f)}`; }).join(", ");
function evidence(id) {
  const e = POP[id]; if (!e) return "in neither list";
  const a = e.amazon.map(r => `Amazon ${r.list} #${r.rank}`), n = e.niceone.map(r => `Nice One ${r.list} #${r.rank} (${r.reviews} reviews)`);
  return a.concat(n).join("; ") || "in neither list";
}

console.log(`Candidates: ${CANDIDATES.length} of ${E.PERFUMES.length} perfumes hold a deciding family at strength.`);
console.log(`\nChosen grid, in page order (total popularity ${fmt(grid.reduce((s, id) => s + INFO[id].pop.score, 0))}):`);
grid.forEach((id, i) => {
  const P = E.byId[id], p = INFO[id].pop;
  console.log(`${String(i + 1).padStart(2)}. ${id} (${P.gender}) ${P.house} ${P.name}: popularity ${fmt(p.score)} = 2 x ${fmt(p.a)} + ${fmt(p.n)}`);
  console.log(`    ${evidence(id)}`);
  console.log(`    strong: ${famText(id)}`);
});
console.log(`\ndata.js: grid: ${JSON.stringify(grid)}`);

const report = (label, m) => console.log(`${label}: families twice ${DECIDING.filter(f => m.famCount[f] >= 2).length}/10 ` +
  `(${DECIDING.map(f => `${f} ${m.famCount[f]}`).join(", ")}); pairs ${m.pairs}/90` + (m.missing.length ? ` (missing ${m.missing.join("; ")})` : "") +
  `; gender m ${m.gender.m}, f ${m.gender.f}, u ${m.gender.u}; clones ${m.clones.join(", ") || "none"}`);
console.log("");
report("Round-table grid", BASE);
report("New grid", M);
console.log(`Round-table grid popularity ${fmt(ROUNDTABLE.reduce((s, id) => s + INFO[id].pop.score, 0))}`);

const cur = D.QUIZ.grid, left = cur.filter(id => !grid.includes(id)), entered = grid.filter(id => !cur.includes(id));
console.log(`\nAgainst the current QUIZ.grid: left ${left.map(id => `${id} (${fmt(INFO[id].pop.score)})`).join(", ") || "none"}; ` +
  `entered ${entered.map(id => `${id} (${fmt(INFO[id].pop.score)})`).join(", ") || "none"}`);
if (!left.length && JSON.stringify(cur) !== JSON.stringify(grid)) console.log("Same twenty, different order.");

console.log("\nDoes each constraint bind? (optimum with that constraint dropped)");
for (const r of ALL) {
  const alt = optimise(ALL.filter(x => x !== r)), gain = alt.value - chosen.value;
  const out = chosen.ids.filter(id => !alt.ids.includes(id)), inn = alt.ids.filter(id => !chosen.ids.includes(id));
  console.log(`  ${r}: ${out.length ? `binds; without it ${out.join(", ")} would give way to ${inn.join(", ")} (+${fmt(gain)})` : "does not bind"}`);
}
const popular = Object.keys(POP).filter(id => E.byId[id] && INFO[id].pop.score > 0 && !INFO[id].fams.length)
  .sort((a, b) => INFO[b].pop.score - INFO[a].pop.score);
console.log(`\nIn the lists but no deciding family at strength (not candidates): ${popular.map(id => `${id} ${fmt(INFO[id].pop.score)}`).join(", ")}`);
