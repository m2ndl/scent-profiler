/* Engine tests on a frozen catalogue (fixtures/catalogue.json: 88 perfumes with their book and label
   evidence), so catalogue edits never break them; only a change in engine.js or mapper.js does.
   - golden: 60 seeded rating sets (fixtures/scenarios.json) must give the profiles, recommendations,
     settle suggestions and resolved perfumes in fixtures/engine_golden.json. That file was first
     captured from the page before the engine had its own file.
   - rules: the recommendation promises in the README hold on every scenario.
   After an intended engine change, rewrite the golden and review its diff before committing:
     node tests/engine.test.js --update */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadSite } = require("../tools/lib/site");
const { summarize, specialIds, formatGolden } = require("./lib/summary");

const FIX = path.join(__dirname, "fixtures");
const readJson = f => JSON.parse(fs.readFileSync(path.join(FIX, f), "utf8"));
const catalogue = readJson("catalogue.json");
const scenarios = readJson("scenarios.json");
const plain = x => JSON.parse(JSON.stringify(x));

const W = loadSite("mapper", "engine");
const E = W.PP_ENGINE.create(catalogue.data, W.PP_MAP, catalogue.evidence);
const stateOf = ratings => ({ ratings, auto: {}, images: {} });
function run(sc) {
  const state = stateOf(sc.ratings);
  const prof = E.computeProfile(state), rec = E.recommend(prof, sc.ratings), settle = E.settleSuggestion(prof, sc.ratings);
  return { prof, rec, settle, state };
}
const current = {
  mapped: plain(catalogue.notesEntries.map(e => E.derived(e))),
  scenarios: scenarios.map(sc => { const r = run(sc); return plain(Object.assign({ seed: sc.seed }, summarize(r.prof, r.rec, r.settle, specialIds(sc.ratings).map(id => E.resolve(id, r.state))))); })
};

if (process.argv.includes("--update")) fs.writeFileSync(path.join(FIX, "engine_golden.json"), formatGolden(current));
const golden = readJson("engine_golden.json");

test("vendor note lists map to the golden family weights", () => {
  assert.deepEqual(current.mapped, golden.mapped);
});

test("every scenario gives the golden profile, recommendations and settle suggestion", () => {
  assert.equal(current.scenarios.length, golden.scenarios.length);
  current.scenarios.forEach((s, i) => assert.deepEqual(s, golden.scenarios[i], `scenario seed ${s.seed}`));
});

test("recommendations: three at most, never a rated perfume, one per house, never a clone beside its original", () => {
  for (const sc of scenarios) {
    const { rec } = run(sc);
    const ids = rec.picks.map(p => p.P.id), houses = rec.picks.map(p => p.P.house), lines = rec.picks.map(p => p.P.cloneOf || p.P.id);
    assert.ok(ids.length <= 3, `seed ${sc.seed}`);
    assert.ok(ids.every(id => !sc.ratings[id]), `seed ${sc.seed}: rated perfume recommended`);
    assert.equal(new Set(houses).size, houses.length, `seed ${sc.seed}: two picks from one house`);
    assert.equal(new Set(lines).size, lines.length, `seed ${sc.seed}: clone beside its original`);
  }
});

test("recommendations exclude a likely deal-breaker at 0.5 or more in the drydown or 0.7 or more in the heart", () => {
  let checked = 0;
  for (const sc of scenarios) {
    const { rec } = run(sc);
    for (const f of rec.likely) for (const p of rec.picks) {
      checked++;
      assert.ok((p.P.stages.drydown[f] || 0) < 0.5 && (p.P.stages.heart[f] || 0) < 0.7, `seed ${sc.seed}: ${p.P.id} carries ${f}`);
    }
  }
  assert.ok(checked > 0, "no scenario had a likely deal-breaker to check");
});

test("evidence layers: a book quote sets the weight, a new-format label rules families out", () => {
  const [bookId, book] = Object.entries(catalogue.evidence.book)[0];
  const [stage, fams] = Object.entries(book).find(([, v]) => Object.keys(v).length);
  const [fam, quote] = Object.entries(fams)[0];
  const P = E.byId[bookId];
  assert.equal(P.prov[stage][fam], "book");
  assert.equal(P.stages[stage][fam] || 0, quote.w > 0 ? quote.w : 0);
  let ruledOut = 0;
  for (const [labelId, lab] of Object.entries(catalogue.evidence.label)) {
    const raw = catalogue.data.PERFUMES.find(p => p.id === labelId), book = catalogue.evidence.book[labelId] || {};
    for (const f of lab.absent) for (const s of E.STAGES) {
      if (!(raw.stages[s] || {})[f] || (book[s] && f in book[s])) continue;
      assert.equal(E.byId[labelId].stages[s][f], undefined, `${labelId} ${s} ${f}`);
      assert.equal(E.byId[labelId].prov[s][f], "label-absent");
      ruledOut++;
    }
  }
  assert.ok(ruledOut > 0, "no fixture label rules out a curated family");
});

/* Note answers (a wearer's answer on one family of a worn bottle) and told answers (what the visitor said in
   words): reference/quiz/PLAN2.md, "Engine". Without either input every output above is unchanged. */
const M = W.PP_MAP;
const profileOf = (ratings, told) => E.computeProfile(Object.assign(stateOf(ratings), told ? { told } : {}));
const toldFor = (word, value) => Object.entries(M.famsForNote(word)).map(([f, w]) => ({ f, value, w, src: "note:" + word }));
/* the quiz's own told items (QUIZ.taste from the live data; the frozen catalogue has no QUIZ) */
const live = loadSite("data", "mapper", "notes");
const N = live.PP_NOTES.create(live.PP_DATA, live.PP_MAP, E);
const evLines = v => plain(v.evidence.map(e => [e.perfume.id, e.stage, e.value, e.note ? "note" : ""].join(" ").trim()));
const bottleSide = v => ({ score: v.score, n: v.n, cls: v.cls, pos: v.pos, neg: v.neg, evidence: evLines(v) });
/* recommend() with every other perfume marked rated, so the picks give the rank between two perfumes */
const onlyTwo = (a, b) => Object.fromEntries(E.PERFUMES.filter(P => P.id !== a && P.id !== b).map(P => [P.id, {}]));

test("strongestStage: the stage with the highest weight, ties to the later stage, null when not held", () => {
  const P = { stages: { opening: { a: 0.5 }, heart: { a: 0.7, b: 0.3 }, drydown: { a: 0.7 } } };
  assert.equal(E.strongestStage(P, "a"), "drydown");
  assert.equal(E.strongestStage(P, "b"), "heart");
  assert.equal(E.strongestStage(P, "c"), null);
  assert.equal(E.strongestStage({ stages: null }, "a"), null);
  assert.equal(W.PP_ENGINE.strongestStage, E.strongestStage);
});

test("a note answer replaces the stage rating for its family, in the answer's stage only", () => {
  /* br540 holds woody amber at 0.9 in the heart and 1 in the drydown, so the answer belongs to the drydown */
  const prof = profileOf({ br540: { heart: 2, drydown: -2, noteAnswers: { woody_amber: 1 } } });
  assert.deepEqual(evLines(prof.woody_amber), ["br540 heart 2", "br540 drydown 1 note"]);
  assert.equal(prof.woody_amber.score, profileOf({ br540: { heart: 2, drydown: 1 } }).woody_amber.score);
  /* the drydown rating still applies to the drydown's other families */
  assert.deepEqual(bottleSide(prof.cedar_dry), bottleSide(profileOf({ br540: { heart: 2, drydown: -2 } }).cedar_dry));
});

test("note answers on families the perfume does not hold are skipped, with no NaN", () => {
  const base = { drydown: -2, again: 0 };
  const withAnswers = Object.assign({ noteAnswers: { oud_smoky: -2, rose: 2, no_such_family: 1 } }, base);
  const sum = r => { const p = profileOf({ sauvageedp: r }); return plain(summarize(p, E.recommend(p, { sauvageedp: r }), null, [])); };
  assert.deepEqual(sum(withAnswers), sum(base));
  for (const v of Object.values(profileOf({ sauvageedp: withAnswers }))) assert.ok(Number.isFinite(v.score));
});

test("told items never change the score, n or class of a family with bottle evidence: Khamrah still plus a long told list", () => {
  const ratings = { khamrah: { drydown: 1, again: 1 } };
  const enjoy = ["vanilla", "caramel", "honey", "tonka", "lemon", "bergamot", "grapefruit", "orange", "tea", "mint"];
  const avoid = ["peach", "musk", "oud", "rose", "leather"];
  const told = [].concat(...enjoy.map(w => toldFor(w, 1)), ...avoid.map(w => toldFor(w, -1)), plain(N.toldItems({ taste: "bitter" })));
  assert.ok(told.length >= 20);
  const before = profileOf(ratings), after = profileOf(ratings, told);
  const strong = Object.keys(before).filter(f => before[f].n >= 1);
  for (const f of ["vanilla_gourmand", "tonka_coumarin", "amber_resin"]) assert.equal(before[f].cls, "goodPossible", f);
  for (const f of strong) {
    assert.deepEqual(bottleSide(after[f]), bottleSide(before[f]), f);
    if (told.some(t => t.f === f)) assert.ok(Number.isFinite(after[f].toldScore), `${f} keeps its told score for display`);
  }
});

test("told items never change the score, n or class of a family with bottle evidence: golden seed 5018 plus avoid cedar", () => {
  const sc = scenarios.find(s => s.seed === 5018);
  const told = toldFor("cedar", -1);
  assert.deepEqual(plain(told.map(t => t.f)), ["cedar_dry"]);
  const before = profileOf(sc.ratings), after = profileOf(sc.ratings, told);
  assert.equal(before.cedar_dry.cls, "badPossible");
  const sum = p => plain(summarize(p, E.recommend(p, sc.ratings), E.settleSuggestion(p, sc.ratings), []));
  assert.deepEqual(sum(after), sum(before));
  assert.equal(after.cedar_dry.toldNeg, true);
});

test("an unnoticed family gives no evidence, from the stage rating, a chip or a note answer", () => {
  const prof = profileOf({ sauvageedp: { drydown: -2, chips: { drydown: ["chemical"] }, unnoticed: ["woody_amber"], noteAnswers: { woody_amber: -2 } } });
  assert.equal(prof.woody_amber, undefined);
  /* the drydown's other family still takes the rating */
  assert.equal(prof.vanilla_gourmand.score, -2);
});

test("a note answer counts even when its stage has no stage rating", () => {
  /* a shop trial that put the wearer off: the hated drydown note is bottle evidence */
  const prof = profileOf({ sauvageedp: { opening: -1, noteAnswers: { woody_amber: -2 } } });
  assert.deepEqual(evLines(prof.woody_amber), ["sauvageedp drydown -2 note"]);
  assert.equal(prof.woody_amber.score, -2);
  assert.equal(prof.woody_amber.n, 1);
  assert.equal(prof.woody_amber.cls, "badPossible");
});

test("two bottles with a hated note in the same family give a likely deal-breaker, when neither was kept", () => {
  const ratings = { sauvageedp: { opening: -1, noteAnswers: { woody_amber: -2 } }, bleuedp: { heart: -2, again: 0, noteAnswers: { woody_amber: -2 } } };
  const prof = profileOf(ratings), rec = E.recommend(prof, ratings);
  assert.equal(prof.woody_amber.cls, "badLikely");
  assert.ok(rec.likely.includes("woody_amber"));
  for (const p of rec.picks) assert.ok((p.P.stages.drydown.woody_amber || 0) < 0.5 && (p.P.stages.heart.woody_amber || 0) < 0.7, p.P.id);
});

/* A detail never outranks a verdict: a note disliked in a bottle the wearer still wears, or liked only in the first
   minutes, is a lean (told sums: it moves the score, never a class), and the picks that carry it say so. */
test("a note disliked in a bottle the wearer still wears is a lean: no deal-breaker, nothing ruled out, a caveat on a pick that carries it", () => {
  for (const v of [-1, -2]) {
    const ratings = { sauvageedp: { drydown: 1, again: 1, noteAnswers: { woody_amber: v } } };
    const prof = profileOf(ratings);
    assert.equal(prof.woody_amber.cls, "neutral", "hated or disliked: " + v);
    assert.equal(prof.woody_amber.n, 0);
    assert.ok(prof.woody_amber.score < 0, "it still leans against woody ambers");
    assert.deepEqual(plain(prof.woody_amber.toldEvidence.map(e => [e.lean, e.perfume.id, e.stage, e.note])), [["kept", "sauvageedp", "drydown", v]]);
    assert.equal(E.ruledOut(prof).length, 0, "nothing ruled out");
    /* a pick holding woody ambers names the note and the bottle */
    const rec = E.recommend(prof, Object.assign(onlyTwo("bleuedp", "br540"), ratings));
    for (const pk of rec.picks) if (Math.max(...E.STAGES.map(s => pk.P.stages[s].woody_amber || 0)) >= 0.3) assert.deepEqual(plain(pk.reason.watch), { kind: "leanKept", f: "woody_amber", s: "drydown", perfume: "sauvageedp" }, pk.P.id);
    assert.ok(rec.picks.some(pk => pk.reason.watch && pk.reason.watch.kind === "leanKept"), "a pick carries the caveat");
  }
  /* the same note hated in a bottle that turned on the wearer is a deal-breaker, as before */
  assert.equal(profileOf({ sauvageedp: { heart: -2, again: 0, noteAnswers: { woody_amber: -2 } } }).woody_amber.cls, "badPossible");
});

test("a note liked only in the first minutes is a lean: not a like, the taste answer counts against it, a caveat on a pick that carries it", () => {
  const ratings = { hacivat: { drydown: 1, again: 1, noteAnswers: { fruity_sweet: 2 } } };
  assert.equal(E.strongestStage(E.byId.hacivat, "fruity_sweet"), "opening");
  const prof = profileOf(ratings);
  assert.equal(prof.fruity_sweet.cls, "neutral");
  assert.equal(prof.fruity_sweet.n, 0);
  assert.ok(prof.fruity_sweet.score > 0 && prof.fruity_sweet.score < 1, "a lean, pulled toward zero: " + prof.fruity_sweet.score);
  const bitter = profileOf(ratings, plain(N.toldItems({ taste: "bitter" })));
  assert.ok(bitter.fruity_sweet.score < prof.fruity_sweet.score, "the bitter answer pulls it down");
  /* a note liked in the heart is bottle evidence, as before */
  assert.equal(profileOf({ oriana: { drydown: 1, again: 1, noteAnswers: { fruity_sweet: 2 } } }).fruity_sweet.cls, "goodPossible");
  /* a pick with sweet fruit in its heart is not said to be liked for it, and names the top note */
  const rec = E.recommend(prof, Object.assign(onlyTwo("oriana", "erbapura"), ratings));
  assert.ok(rec.picks.length >= 1);
  for (const pk of rec.picks) {
    assert.ok(!pk.reason.likes.includes("fruity_sweet"), pk.P.id + " does not count sweet fruit as a like");
    if (pk.reason.watch && pk.reason.watch.kind === "leanOpening") assert.deepEqual(plain(pk.reason.watch), { kind: "leanOpening", f: "fruity_sweet", s: "heart", perfume: "hacivat" });
  }
  assert.ok(rec.picks.some(pk => pk.reason.watch && pk.reason.watch.kind === "leanOpening"), "one of them carries the caveat");
});

test("a lean is the wearer's word on its family in that bottle: the bottle's stage ratings count for it only where they agree", () => {
  /* Hacivat kept, its cedar hated: the answer goes to the heart (0.6), and the base the visitor liked holds cedar at 0.4.
     The liked base does not make the hated note a like, and still counts for the base's other families. */
  assert.equal(E.strongestStage(E.byId.hacivat, "cedar_dry"), "heart");
  assert.ok(E.byId.hacivat.stages.drydown.cedar_dry >= 0.4);
  let prof = profileOf({ hacivat: { drydown: 1, again: 1, noteAnswers: { cedar_dry: -2 } } });
  assert.equal(prof.cedar_dry.n, 0);
  assert.equal(prof.cedar_dry.cls, "neutral");
  assert.ok(prof.cedar_dry.score < 0, "it leans against cedar");
  assert.deepEqual(bottleSide(prof.oakmoss_chypre), bottleSide(profileOf({ hacivat: { drydown: 1, again: 1 } }).oakmoss_chypre));
  /* a profiler record with the heart and the base liked: the heart's like of the hated woody ambers gives way too */
  prof = profileOf({ br540: { heart: 1, drydown: 2, noteAnswers: { woody_amber: -2 } } });
  assert.equal(prof.woody_amber.n, 0);
  assert.ok(prof.woody_amber.score < 0);
  /* Black Phantom turned in the base, its coffee loved: coffee is strongest in the opening, and at 0.5 in the base that
     turned, which does not make the loved note a deal-breaker; the base's other families take the rating */
  assert.equal(E.strongestStage(E.byId.blackphantom, "coffee_gourmand"), "opening");
  prof = profileOf({ blackphantom: { drydown: -2, again: 0, noteAnswers: { coffee_gourmand: 2 } } });
  assert.equal(prof.coffee_gourmand.cls, "neutral");
  assert.equal(prof.coffee_gourmand.n, 0);
  assert.ok(prof.coffee_gourmand.score > 0, "it leans toward coffee");
  assert.equal(profileOf({ blackphantom: { drydown: -2, again: 0 } }).coffee_gourmand.cls, "badPossible", "without the answer the base blames coffee");
  assert.equal(prof.vanilla_gourmand.cls, "badPossible");
  /* a rated opening keeps its like when its top note is loved too */
  assert.deepEqual(bottleSide(profileOf({ aventus: { opening: 2, noteAnswers: { fruity_sweet: 2 } } }).fruity_sweet), bottleSide(profileOf({ aventus: { opening: 2 } }).fruity_sweet));
  assert.equal(profileOf({ aventus: { opening: 2 } }).fruity_sweet.cls, "goodPossible");
});

test("a kept bottle: bought again, or its heart and base 0 or above with one above 0; the opening never decides", () => {
  assert.equal(E.kept, W.PP_ENGINE.kept);
  for (const [r, want] of [
    [{ drydown: 1, again: 1 }, true],                /* the quiz's "I still wear it" */
    [{ drydown: -2, again: 0 }, false],              /* "it turned on me" */
    [{ opening: -2, again: 0 }, false],              /* it turned in the first minutes */
    [{ opening: -1 }, false],                        /* the shop trial */
    [{ opening: -1, heart: 1, drydown: 2 }, true],
    [{ opening: 2 }, false],
    [{ heart: 0, drydown: 0 }, false],
    [{ heart: -1, drydown: 2 }, false],
    [{ heart: -1, drydown: 2, again: 1 }, true],
    [null, false]
  ]) assert.equal(E.kept(r), want, JSON.stringify(r));
  /* so a note hated in a profiler record with a disliked opening and a liked heart and base is a lean */
  const prof = profileOf({ sauvageedp: { opening: -1, heart: 1, drydown: 2, noteAnswers: { woody_amber: -2 } } });
  assert.equal(prof.woody_amber.n, 0);
  assert.deepEqual(plain(prof.woody_amber.toldEvidence.map(e => e.lean)), ["kept"]);
});

test("a lean comes after the bottles' verdicts: a pick with a family the bottles split on names that, not a note disliked in a kept bottle", () => {
  /* woody ambers disliked in kept Sauvage; cedar loved in Bleu and hated in Hacivat, neither with a verdict */
  const ratings = { sauvageedp: { drydown: 1, again: 1, noteAnswers: { woody_amber: -2 } }, bleuedp: { noteAnswers: { cedar_dry: 2 } }, hacivat: { noteAnswers: { cedar_dry: -2 } } };
  const prof = profileOf(ratings);
  assert.equal(prof.cedar_dry.cls, "mixed");
  assert.deepEqual(plain(prof.woody_amber.toldEvidence.map(e => e.lean)), ["kept"]);
  for (const id of ["layton", "althair"]) {
    const P = E.byId[id];
    assert.ok(Math.max(P.stages.heart.woody_amber || 0, P.stages.drydown.woody_amber || 0) >= 0.3, id + " holds woody ambers in its heart or base");
    const rec = E.recommend(prof, Object.assign(Object.fromEntries(E.PERFUMES.filter(Q => Q.id !== id).map(Q => [Q.id, {}])), ratings));
    assert.equal(rec.picks[0].P.id, id);
    assert.equal(rec.picks[0].reason.watch.kind, "mixed", id);
  }
});

test("told-only families stay neutral with n = 0, never appear in likely or badAny, and never exclude", () => {
  const fams = [...new Set(E.PERFUMES.flatMap(P => E.STAGES.flatMap(s => Object.keys(P.stages[s]))))];
  for (const value of [-1, 1]) {
    const told = fams.map(f => ({ f, value, w: 1, src: "test" }));
    const prof = profileOf({}, told), rec = E.recommend(prof, {});
    for (const f of fams) {
      assert.equal(prof[f].cls, "neutral", f); assert.equal(prof[f].n, 0);
      assert.equal(prof[f].score, value * 0.5, f); assert.equal(prof[f].evidence.length, 0);
    }
    assert.equal(rec.likely.length, 0); assert.equal(rec.badAny.length, 0);
    assert.equal(rec.picks.length, 3);
    /* on every golden scenario, told answers on every family change no class, exclusion or settle suggestion */
    for (const sc of scenarios) {
      const before = profileOf(sc.ratings), after = profileOf(sc.ratings, told);
      for (const f of Object.keys(before)) assert.equal(after[f].cls, before[f].cls, `seed ${sc.seed} ${f}`);
      const rb = E.recommend(before, sc.ratings), ra = E.recommend(after, sc.ratings);
      assert.deepEqual(plain(ra.likely), plain(rb.likely)); assert.deepEqual(plain(ra.badAny), plain(rb.badAny));
      assert.deepEqual(plain(E.settleSuggestion(after, sc.ratings)), plain(E.settleSuggestion(before, sc.ratings)), `seed ${sc.seed}`);
    }
  }
});

test("a told-only score is pulled toward zero by the told weight, so a side effect of the taste answer counts less than a named note", () => {
  const score = told => profileOf({}, told).leather_smoky.score;
  const item = w => ({ f: "leather_smoky", value: 1, w, src: "test" });
  assert.equal(score([item(1)]), 0.5);
  assert.ok(Math.abs(score([item(1), item(1)]) - 2 / 3) < 1e-9);
  assert.ok(Math.abs(score([item(0.3)]) - 0.09 / 0.39) < 1e-9);
  /* "prefer bitter" from the live QUIZ.taste against an explicit "enjoy leather" */
  const taste = loadSite("data").PP_DATA.QUIZ.taste;
  const bitter = Object.entries(taste.bitter).map(([f, w]) => ({ f, value: 1, w, src: "taste:bitter" }))
    .concat(Object.entries(taste.sweet).map(([f, w]) => ({ f, value: -1, w, src: "taste:bitter" })));
  assert.ok(bitter.some(t => t.f === "leather_smoky"));
  const side = score(bitter), named = score(toldFor("leather", 1));
  assert.ok(side > 0 && side < named, `prefer bitter ${side}, enjoy leather ${named}`);
  /* the display field keeps the plain told mean */
  assert.equal(profileOf({}, bitter).leather_smoky.toldScore, 1);
});

test("a told avoid lowers a perfume's rank and a told enjoy raises it", () => {
  /* blackaoud holds oud; aventus holds none */
  const rated = onlyTwo("blackaoud", "aventus");
  const order = told => E.recommend(profileOf({}, told), rated).picks.map(p => [p.P.id, p.final]);
  const base = order([]), enjoy = order(toldFor("oud", 1)), avoid = order(toldFor("oud", -1));
  const finalOf = (o, id) => o.find(x => x[0] === id)[1];
  assert.equal(enjoy[0][0], "blackaoud");
  assert.equal(avoid[1][0], "blackaoud");
  assert.ok(finalOf(avoid, "blackaoud") < finalOf(base, "blackaoud") && finalOf(base, "blackaoud") < finalOf(enjoy, "blackaoud"));
  assert.equal(finalOf(enjoy, "aventus"), finalOf(base, "aventus"));
});

test("risk kind told appears only with told input, and only when every told item for the family is negative", () => {
  for (const sc of scenarios) for (const p of run(sc).rec.picks) assert.ok(p.risks.every(r => r.kind !== "told"), `seed ${sc.seed}`);
  const rated = onlyTwo("blackaoud", "aventus");
  const kinds = told => E.recommend(profileOf({}, told), rated).picks.find(p => p.P.id === "blackaoud").risks.filter(r => r.f === "oud_smoky").map(r => r.kind);
  assert.ok(kinds([]).every(k => k === "unknown"));
  const avoided = kinds(toldFor("oud", -1));
  assert.ok(avoided.length && avoided.every(k => k === "told"));
  /* a small enjoy and a larger avoid: the score is below zero, but the answers are mixed */
  const mixed = kinds([{ f: "oud_smoky", value: 1, w: 0.2, src: "note:oud" }, { f: "oud_smoky", value: -1, w: 0.8, src: "chip:heavy" }]);
  assert.ok(mixed.length && mixed.every(k => k === "neg"));
});
