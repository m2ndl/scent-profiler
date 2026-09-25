/* Note questions (site/js/notes.js) on the live catalogue: which families a wearer is asked about, in which
   stage, and with which listed note words. Rules: reference/quiz/PLAN2.md, "Note questions". */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite } = require("../tools/lib/site");

const W = loadSite("data", "mapper", "evidence", "engine", "notes");
const D = W.PP_DATA, E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE), N = W.PP_NOTES.create(D, W.PP_MAP, E);
const plain = x => JSON.parse(JSON.stringify(x));
const STAGES = E.STAGES;
const rowOf = (id, f, kind) => N.questions(E.byId[id], kind || "worn").find(r => r.f === f);

/* every family at 0.4 or more in its strongest stage */
function candidates(P) {
  const fams = new Set(STAGES.flatMap(s => Object.keys(P.stages[s] || {})));
  return [...fams].map(f => ({ f, stage: E.strongestStage(P, f) })).map(c => Object.assign(c, { w: P.stages[c.stage][c.f] })).filter(c => c.w >= 0.4);
}

const PER_STAGE = { opening: 1, heart: 2, drydown: 3 };
const byW = (a, b) => b.w - a.w;

test("at most one opening, two heart and three drydown rows, five in all, strongest first, in stage order", () => {
  let dropped = 0;
  for (const P of E.PERFUMES) {
    const rows = N.questions(P, "worn"), cand = candidates(P);
    for (let i = 1; i < rows.length; i++) assert.ok(STAGES.indexOf(rows[i - 1].stage) <= STAGES.indexOf(rows[i].stage), `${P.id}: order`);
    for (const r of rows) {
      assert.equal(r.stage, E.strongestStage(P, r.f), `${P.id} ${r.f}`);
      assert.ok(r.w >= 0.4 && r.w === P.stages[r.stage][r.f], `${P.id} ${r.f}`);
    }
    const perStage = STAGES.map(s => Math.min(PER_STAGE[s], cand.filter(c => c.stage === s).length));
    const total = perStage.reduce((a, b) => a + b, 0);
    assert.equal(rows.length, Math.min(5, total), P.id);
    STAGES.forEach((s, k) => {
      const kept = rows.filter(r => r.stage === s), pool = cand.filter(c => c.stage === s).sort(byW);
      assert.equal(kept.length, perStage[k] - (s === "drydown" && total > 5 ? total - 5 : 0), `${P.id} ${s}`);
      /* the kept rows of a stage are its strongest */
      for (const c of pool.filter(c => !kept.some(r => r.f === c.f))) assert.ok(kept.every(r => r.w >= c.w), `${P.id}: dropped ${c.f} is stronger than a kept ${s} row`);
    });
    if (total > 5) dropped++;
  }
  assert.ok(dropped > 0, "no perfume had six rows before the total cap");
});

test("a shop trial gets only opening and heart rows, at most two, the strongest", () => {
  for (const P of E.PERFUMES) {
    const rows = N.questions(P, "shop"), cand = candidates(P);
    const pool = ["opening", "heart"].flatMap(s => cand.filter(c => c.stage === s).sort(byW).slice(0, PER_STAGE[s])).sort(byW);
    assert.ok(rows.length <= 2, P.id);
    assert.equal(rows.length, Math.min(2, pool.length), P.id);
    for (const r of rows) assert.notEqual(r.stage, "drydown", P.id);
    if (pool.length > 2) assert.ok(rows.every(r => r.w >= pool[2].w), `${P.id}: a stronger row was dropped`);
  }
  assert.deepEqual(plain(N.questions(E.byId.sauvageedp, "shop").map(r => r.f)), ["citrus_fresh", "lavender_aromatic"]);
});

test("Declaration has its heart row for cardamom", () => {
  const row = rowOf("declaration", "spice_fresh");
  assert.equal(row.stage, "heart");
  assert.ok(row.words.en.includes("cardamom"));
});

test("no note word repeats across Sauvage EDP's rows", () => {
  const words = N.questions(E.byId.sauvageedp, "worn").flatMap(r => r.words.en);
  assert.equal(new Set(words).size, words.length);
  assert.ok(rowOf("sauvageedp", "spicy_warm").words.en.includes("star anise"), "star anise goes to the family it maps to most strongly");
});

test("a word sits on the row whose family it maps to most strongly, and repeats only on a row with no word of its own", () => {
  let repeats = 0;
  for (const P of E.PERFUMES) {
    const rows = N.questions(P, "worn");
    const count = {};
    for (const r of rows) for (const w of r.words.en) count[w] = (count[w] || 0) + 1;
    for (const [w, n] of Object.entries(count)) {
      if (n < 2) continue;
      const holders = rows.filter(r => r.words.en.includes(w));
      const m = r => W.PP_MAP.famsForNote(w)[r.f];
      /* the strongest holder (ties: the stronger row, then the earlier) may keep other words; every other
         holder carries only shared words */
      const best = holders.slice().sort((a, b) => (m(b) - m(a)) || (b.w - a.w))[0];
      for (const r of holders) if (r !== best) { assert.ok(r.words.en.every(x => count[x] > 1), `${P.id} ${r.f}: ${w} repeated beside a word of its own`); repeats++; }
    }
  }
  assert.ok(repeats > 0, "no perfume repeats a word, so the rule was not exercised");
});

test("Sauvage EDP gives four rows, with ambroxan on the woody amber row", () => {
  const rows = N.questions(E.byId.sauvageedp, "worn");
  assert.equal(rows.length, 4);
  const wa = rows.find(r => r.f === "woody_amber");
  assert.equal(wa.stage, "drydown");
  assert.ok(wa.words.en.includes("ambroxan"));
});

test("Narciso Rodriguez For Her gets a drydown row: a tie between heart and drydown goes to the drydown", () => {
  const P = E.byId.narcisoforher;
  assert.equal(P.stages.heart.white_musk, P.stages.drydown.white_musk);
  const row = rowOf("narcisoforher", "white_musk");
  assert.equal(row.stage, "drydown");
  assert.ok(N.questions(P, "worn").some(r => r.stage === "drydown"));
});

test("Baccarat Rouge 540's woody amber row finds amberwood in its heart list", () => {
  const P = E.byId.br540, row = rowOf("br540", "woody_amber");
  assert.equal(row.stage, "drydown");
  assert.ok(!W.PP_NOTES.stageLists(P.notes.en, ",").drydown.some(w => (W.PP_MAP.famsForNote(w) || {}).woody_amber), "the drydown list names no woody amber note");
  assert.ok(row.words.en.includes("amberwood"));
  assert.equal(row.words.ar[row.words.en.indexOf("amberwood")], W.PP_NOTES.stageLists(P.notes.ar, /[،,]/).heart[0]);
});

test("every note word maps to its row's family, and every Arabic list matches its English list or is empty", () => {
  let words = 0, arabic = 0;
  for (const P of E.PERFUMES) for (const kind of ["worn", "shop"]) for (const r of N.questions(P, kind)) {
    for (const w of r.words.en) { assert.ok((W.PP_MAP.famsForNote(w) || {})[r.f] > 0, `${P.id} ${r.f} ${w}`); words++; }
    assert.ok(r.words.ar.length === r.words.en.length || r.words.ar.length === 0, `${P.id} ${r.f}`);
    if (r.words.ar.length) arabic++;
  }
  assert.ok(words > 0 && arabic > 0);
});

test("a perfume with no stages, such as an untagged custom name, gets no rows", () => {
  assert.deepEqual(plain(N.questions({ id: "x", stages: null }, "worn")), []);
});

/* Told items (PLAN2.md, "Told items"): the quiz's word answers as the engine's told list. */
const sortItems = items => plain(items).sort((a, b) => (a.src + a.f + a.value).localeCompare(b.src + b.f + b.value));
const chipItems = id => Object.entries(D.CHIPS.find(c => c.id === id).fams).map(([f, w]) => ({ f, value: -1, w, src: "chip:" + id }));

test("toldItems turns note answers, the taste answer and complaint chips into items with their source", () => {
  const items = N.toldItems({ notes: { tea: 1, peach: -1 }, taste: "bitter", told: ["sweet", "soapy"], toldNone: false });
  const expected = [];
  for (const [id, v] of [["tea", 1], ["peach", -1]]) {
    const n = D.QUIZ.notePicker.flatMap(s => s.notes).find(x => x.id === id);
    for (const [f, w] of Object.entries(W.PP_MAP.famsForNote(n.en))) expected.push({ f, value: v, w, src: "note:" + id });
  }
  for (const [f, w] of Object.entries(D.QUIZ.taste.bitter)) expected.push({ f, value: 1, w, src: "taste:bitter" });
  for (const [f, w] of Object.entries(D.QUIZ.taste.sweet)) expected.push({ f, value: -1, w, src: "taste:bitter" });
  expected.push(...chipItems("sweet"), ...chipItems("soapy"));
  assert.deepEqual(sortItems(items), sortItems(expected));
  assert.ok(items.some(i => i.f === "green_herbal" && i.src === "note:tea" && i.value === 1 && i.w === 0.5));
  /* "sweet" is the mirror of "bitter"; "both" and "unsure" add nothing */
  const sweet = N.toldItems({ taste: "sweet" });
  assert.deepEqual(sortItems(sweet), sortItems(N.toldItems({ taste: "bitter" }).map(i => Object.assign(i, { value: -i.value, src: "taste:sweet" }))));
  for (const taste of ["both", "unsure"]) assert.deepEqual(plain(N.toldItems({ taste })), []);
  /* "not sure" removes the key; stray values, unknown notes and chips without families add nothing */
  assert.deepEqual(plain(N.toldItems({ notes: { tea: 0, lemon: "1", nosuchnote: 1 }, told: ["loud", "faded", "nosuchchip"] })), []);
});

test("a picker entry's own fams replace the mapper: enjoying amber raises resinous amber, not woody ambers", () => {
  assert.ok(W.PP_MAP.famsForNote("amber").woody_amber > 0, "the mapper splits amber, so the entry's own fams matter");
  assert.deepEqual(plain(N.toldItems({ notes: { amber: 1 } })), [{ f: "amber_resin", value: 1, w: 0.9, src: "note:amber" }]);
  /* ambergris stays on the mapper */
  const gris = N.toldItems({ notes: { ambergris: -1 } });
  assert.deepEqual(sortItems(gris), sortItems(Object.entries(W.PP_MAP.famsForNote("ambergris")).map(([f, w]) => ({ f, value: -1, w, src: "note:ambergris" }))));
  assert.ok(gris.some(i => i.f === "woody_amber"));
});

test("toldItems reads an old string quiz.told as a one-item array, and \"none\" as nothing", () => {
  assert.deepEqual(plain(N.toldItems({ told: "smoky" })), plain(N.toldItems({ told: ["smoky"] })));
  assert.deepEqual(sortItems(N.toldItems({ told: "smoky" })), sortItems(chipItems("smoky")));
  assert.deepEqual(plain(N.toldItems({ told: "none" })), []);
  assert.deepEqual(plain(W.PP_NOTES.normTold({ told: "none" })), { told: [], toldNone: true });
  assert.deepEqual(plain(W.PP_NOTES.normTold({ told: "smoky" })), { told: ["smoky"], toldNone: false });
  assert.deepEqual(plain(W.PP_NOTES.normTold({ told: [], toldNone: true })), { told: [], toldNone: true });
  assert.deepEqual(plain(W.PP_NOTES.normTold({ told: ["sweet", "sweet"] })), { told: ["sweet"], toldNone: false });
});

test("an empty quiz state gives no told items", () => {
  for (const q of [undefined, null, {}, { notes: {}, told: [], toldNone: false }]) assert.deepEqual(plain(N.toldItems(q)), []);
});

test("with no bottles, \"prefer bitter\" and \"enjoy tea, lemon\" give three picks without a strong vanilla drydown", () => {
  const told = N.toldItems({ notes: { tea: 1, lemon: 1 }, taste: "bitter" });
  const prof = E.computeProfile({ ratings: {}, auto: {}, images: {}, told });
  const r = E.recommend(prof, {});
  assert.equal(r.picks.length, 3);
  for (const s of r.picks) assert.ok(!((s.P.stages.drydown.vanilla_gourmand || 0) >= 0.7), `${s.P.id}: vanilla ${s.P.stages.drydown.vanilla_gourmand} in the drydown`);
  assert.deepEqual(plain(r.likely), []);
  assert.deepEqual(plain(r.badAny), []);
});
