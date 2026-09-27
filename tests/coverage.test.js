/* The picks spread over the catalogue. On the live catalogue, 400 seeded visitors rate three quiz bottles (kept, or
   turned in the heart or base) and now and then enjoy or avoid a note card. When the picks counted a liked family in
   every stage it was in, the few perfumes that are one common base family from opening to base went to most of them:
   Molecule 01 or Grand Soir to 15 to 19 in 100, and the ten most picked perfumes took a quarter of all picks
   (reference/algorithm/stress/COVERAGE.md). */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite } = require("../tools/lib/site");

const W = loadSite("data", "mapper", "materials", "evidence", "engine", "notes");
const D = W.PP_DATA, E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE), N = W.PP_NOTES.create(D, W.PP_MAP, E);
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

test("no perfume goes to more than 11 visitors in 100, and the ten most picked take under 18% of all picks", () => {
  const POOL = D.QUIZ.grid.concat(D.QUIZ.more).filter(id => E.byId[id]), CARDS = D.QUIZ.notePicker.flatMap(s => s.notes);
  for (const seed of [1, 2, 3]) {
    const r = rng(seed), freq = {};
    let visitors = 0, picks = 0;
    for (let i = 0; i < 400; i++) {
      const ratings = {};
      while (Object.keys(ratings).length < 3) {
        const id = POOL[Math.floor(r() * POOL.length)], x = r();
        ratings[id] = x < 0.5 ? { drydown: 1, again: 1, src: "quiz" } : x < 0.8 ? { drydown: -2, again: 0, src: "quiz" } : { heart: -2, again: 0, src: "quiz" };
      }
      const quiz = { notes: {} };
      for (const c of CARDS) if (r() < 0.04) quiz.notes[c.id] = r() < 0.6 ? 1 : -1;
      const prof = E.computeProfile({ ratings, auto: {}, images: {}, told: N.toldItems(quiz) });
      const rec = E.recommend(prof, ratings, N.avoidedNotes(quiz));
      visitors++;
      for (const p of rec.picks) { freq[p.P.id] = (freq[p.P.id] || 0) + 1; picks++; }
    }
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    assert.ok(top[0][1] / visitors < 0.11, `seed ${seed}: ${top[0][0]} goes to ${(100 * top[0][1] / visitors).toFixed(1)} visitors in 100`);
    const share = top.slice(0, 10).reduce((a, x) => a + x[1], 0) / picks;
    assert.ok(share < 0.18, `seed ${seed}: the ten most picked take ${(100 * share).toFixed(1)}% of picks`);
  }
});
