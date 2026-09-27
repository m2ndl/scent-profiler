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

/* Every note answer, not only a lean, is the wearer's word on its family in that bottle (reference/algorithm/stress,
   REPORT.md defect 1): a rating in another stage of that bottle that contradicts it counts as neutral for the family,
   and a complaint chip that contradicts it drops out. Black Aoud holds oud at 0.9 in the heart and 0.8 in the base, so
   the answer belongs to the heart. */
test("a note answer is the wearer's word on its family in that bottle: another stage that contradicts it counts as neutral for it", () => {
  assert.equal(E.strongestStage(E.byId.blackaoud, "oud_smoky"), "heart");
  const fromBottle = (v, id) => v.evidence.filter(e => e.perfume.id === id).map(e => e.value);
  /* oud liked in Black Aoud, whose base turned, and Amber Aoud turned: the base's -2 counts as 0 for the liked oud */
  let prof = profileOf({ blackaoud: { drydown: -2, again: 0, noteAnswers: { oud_smoky: 1 } }, amberaoud: { drydown: -2, again: 0 } });
  assert.deepEqual(plain(fromBottle(prof.oud_smoky, "blackaoud")), [0, 1]);
  assert.ok(!["badLikely", "badPossible"].includes(prof.oud_smoky.cls), "a liked note is not a deal-breaker: " + prof.oud_smoky.cls);
  /* the base that turned still counts for its other families */
  assert.ok(fromBottle(prof.patchouli, "blackaoud").includes(-2));
  /* the other direction: oud hated in Black Aoud, a profiler record whose heart was disliked and base loved, and
     Black Afgano still worn; the loved base does not count for the hated oud */
  prof = profileOf({ blackaoud: { heart: -1, drydown: 2, noteAnswers: { oud_smoky: -2 } }, blackafgano: { drydown: 1, again: 1 } });
  assert.deepEqual(plain(fromBottle(prof.oud_smoky, "blackaoud")), [0, -2]);
  assert.ok(!["goodLikely", "goodPossible"].includes(prof.oud_smoky.cls), "a hated note is not a like: " + prof.oud_smoky.cls);
  assert.ok(fromBottle(prof.patchouli, "blackaoud").includes(2), "the loved base still counts for its other families");
  /* a complaint chip gives way the same way: Olympea's vanilla loved (heart), its base turned "too sweet" and "sharp" */
  assert.equal(E.strongestStage(E.byId.olympea, "vanilla_gourmand"), "heart");
  prof = profileOf({ olympea: { drydown: -2, again: 0, chips: { drydown: ["sweet", "chemical"] }, noteAnswers: { vanilla_gourmand: 2 } } });
  assert.deepEqual(plain(prof.vanilla_gourmand.evidence.filter(e => e.chip).map(e => e.chip)), []);
  assert.deepEqual(plain(prof.woody_amber.evidence.filter(e => e.chip).map(e => e.chip)), ["chemical"]);
  /* "Didn't mind" contradicts a stage that turned, so that stage counts as neutral for the family too */
  prof = profileOf({ blackaoud: { drydown: -2, again: 0, noteAnswers: { oud_smoky: 0 } } });
  assert.deepEqual(plain(fromBottle(prof.oud_smoky, "blackaoud")), [0, 0]);
  /* and a better rating of that stage never lowers the family: oud disliked in Black Aoud, whose heart turned (so it is
     never a kept bottle, where the answer would be a lean), with the base at -2 to 2 */
  const score = v => profileOf({ blackaoud: { heart: -1, drydown: v, again: 0, noteAnswers: { oud_smoky: -1 } }, amberaoud: { drydown: -2, again: 0 } }).oud_smoky.score;
  for (const [lo, hi] of [[-2, -1], [-1, 0], [0, 1], [1, 2]]) assert.ok(score(hi) >= score(lo), `base ${lo} gives ${score(lo)}, base ${hi} gives ${score(hi)}`);
});

test("a family one bottle counts for and another against is mixed, however far the sum leans (the README's rule)", () => {
  /* vanilla loved in Yara, still worn; Khamrah and Vanilla 28 turned too sweet */
  const ratings = { yara: { drydown: 1, again: 1, noteAnswers: { vanilla_gourmand: 2 } }, khamrah: { drydown: -2, again: 0, chips: { drydown: ["sweet"] } }, vanilla28: { drydown: -2, again: 0, chips: { drydown: ["sweet"] } } };
  let prof = profileOf(ratings);
  assert.ok(prof.vanilla_gourmand.score <= -0.7, "the sum leans well against vanilla: " + prof.vanilla_gourmand.score);
  assert.equal(prof.vanilla_gourmand.cls, "mixed");
  const rec = E.recommend(prof, ratings);
  assert.ok(!rec.badAny.includes("vanilla_gourmand") && !rec.likely.includes("vanilla_gourmand"));
  /* without any note answer: Sauvage still worn, BR540 Extrait turned sharp */
  prof = profileOf({ sauvageedp: { drydown: 1, again: 1 }, br540extrait: { drydown: -2, again: 0, chips: { drydown: ["chemical"] } } });
  assert.ok(prof.woody_amber.score <= -0.7);
  assert.equal(prof.woody_amber.cls, "mixed");
  /* and the other way: liked twice, disliked once */
  prof = profileOf({ yara: { drydown: 2, again: 1 }, vanilla28: { drydown: 2, again: 1 }, khamrah: { drydown: -1, again: 0 } });
  assert.ok(prof.vanilla_gourmand.score >= 0.7);
  assert.equal(prof.vanilla_gourmand.cls, "mixed");
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

test("a pick is free of a deal-breaker only when it holds that family under 0.2 in every stage, not just the base", () => {
  /* Fabulous turned in the heart, so its leather is a possible deal-breaker; Aventus holds leather in its opening (0.4)
     and heart (0.6) but not its base */
  const ratings = { fabulous: { heart: -2, again: 0 } };
  const prof = profileOf(ratings), rec = E.recommend(prof, Object.assign(onlyTwo("aventus", "blackorchid"), ratings));
  assert.ok(rec.badAny.includes("leather_smoky"));
  const aventus = rec.picks.find(p => p.P.id === "aventus");
  assert.ok(aventus, "Aventus is picked");
  assert.ok(!aventus.reason.clear.includes("leather_smoky"), "not free of leather: " + aventus.reason.clear);
  assert.equal(aventus.reason.watch.f, "leather_smoky", "the leather in its heart is the thing to watch for");
  /* the promise on every golden scenario */
  for (const sc of scenarios) for (const p of run(sc).rec.picks) for (const f of p.reason.clear) for (const s of E.STAGES) assert.ok((p.P.stages[s][f] || 0) < 0.2, `seed ${sc.seed}: ${p.P.id} is not free of ${f}`);
});

test("the order of the ratings never moves a family across a class line (sums that differ in the last digit)", () => {
  /* four bottles whose weighted mean for one family is exactly 0.7: summed in one order it comes to 0.6999999999999998 */
  const P = [["a", 0.6], ["b", 0.6], ["c", 0.5], ["d", 0.3]].map(([id, w]) => ({ id, house: id, name: id, ar: "", gender: "u", tier: "designer", conf: 3,
    stages: { opening: {}, heart: {}, drydown: { x: w } }, notes: { en: "", ar: "" } }));
  const mini = W.PP_ENGINE.create({ CHIPS: [], STAGE_W: catalogue.data.STAGE_W, PERFUMES: P }, W.PP_MAP, { book: {}, label: {} });
  const ratings = { a: { drydown: 1 }, b: { drydown: 0 }, c: { drydown: 1 }, d: { drydown: 1 } };
  const reversed = Object.fromEntries(Object.entries(ratings).reverse());
  const x = r => mini.computeProfile(stateOf(r)).x;
  assert.notEqual(x(ratings).score, x(reversed).score, "the two sums differ in the last digit");
  assert.equal(x(ratings).cls, x(reversed).cls);
  assert.equal(x(ratings).cls, "goodLikely");
});

test("stored values are held to the scale: a hand-edited 99 counts as 2, a note answer of a million as 2, text that is not a number as unanswered", () => {
  const sum = ratings => { const p = profileOf(ratings); return plain(summarize(p, E.recommend(p, ratings), E.settleSuggestion(p, ratings), [])); };
  const two = { sauvageedp: { drydown: 2, chips: {} }, yara: { drydown: -2, chips: {} } };
  assert.deepEqual(sum({ sauvageedp: { drydown: 99, chips: {} }, yara: { drydown: -2, chips: {} } }), sum(two));
  assert.deepEqual(sum({ sauvageedp: { drydown: "2", chips: {} }, yara: { drydown: "-2", chips: {} } }), sum(two));
  assert.deepEqual(sum({ sauvageedp: { drydown: 2, heart: "much", chips: {} }, yara: { drydown: -2, opening: NaN, chips: {} } }), sum(two));
  const answered = v => ({ sauvageedp: { drydown: 1, again: 0, chips: {}, noteAnswers: { woody_amber: v } }, yara: { drydown: -2, chips: {} } });
  assert.deepEqual(sum(answered(1e6)), sum(answered(2)));
  assert.equal(E.kept({ heart: -99, drydown: 5 }), E.kept({ heart: -2, drydown: 2 }));
  /* only a number, or text that is only a number, is read, and a fraction is rounded; true, a list or blank text counts as unanswered */
  for (const odd of [true, false, [2], [], " ", "0x1"]) assert.deepEqual(sum({ sauvageedp: { drydown: 2, heart: odd, chips: {} }, yara: { drydown: -2, chips: {} } }), sum(two), JSON.stringify(odd));
  assert.deepEqual(sum({ sauvageedp: { drydown: 1.6, chips: {} }, yara: { drydown: -2.2, chips: {} } }), sum(two));
  /* halves round away from zero, so a half on either side mirrors the other */
  assert.deepEqual(sum({ sauvageedp: { drydown: 1.5, chips: {} }, yara: { drydown: -1.5, chips: {} } }), sum(two));
  assert.deepEqual(sum(answered(true)), sum({ sauvageedp: { drydown: 1, again: 0, chips: {} }, yara: { drydown: -2, chips: {} } }));
});

test("an avoided note gives way only to a bottle the visitor kept: a liking in a bottle that turned never lifts it", () => {
  const avoid = plain(N.avoidedNotes({ notes: { vanilla: -1 } }));
  assert.ok(avoid.length === 1 && avoid[0].fams.vanilla_gourmand >= 0.5);
  /* Olympea turned in its base with its vanilla (heart) liked; Sauvage, still worn, holds vanilla only as a trace */
  let ratings = { olympea: { drydown: -2, again: 0, noteAnswers: { vanilla_gourmand: 1 } }, sauvageedp: { drydown: 1, again: 1 } };
  assert.equal(E.kept(ratings.olympea), false);
  let rec = E.recommend(profileOf(ratings), ratings, avoid);
  assert.deepEqual(plain(rec.contradicted), []);
  /* Yara, still worn, holds vanilla strongly: the bottles win, and only Yara is named */
  ratings = Object.assign({ yara: { drydown: 1, again: 1 } }, ratings);
  rec = E.recommend(profileOf(ratings), ratings, avoid);
  assert.deepEqual(plain(rec.contradicted.map(c => c.perfumes)), [["yara"]]);
});

test("\"Didn't mind\" is the wearer's word too: a loved or a turned stage of that bottle counts as neutral for the family, and its chips do not count", () => {
  /* Black Aoud loved throughout and bought again, its oud "Didn't mind" */
  let prof = profileOf({ blackaoud: { opening: 2, heart: 2, drydown: 2, again: 1, noteAnswers: { oud_smoky: 0 } } });
  assert.ok(prof.oud_smoky.evidence.every(e => e.value === 0), JSON.stringify(plain(prof.oud_smoky.evidence.map(e => e.value))));
  assert.equal(prof.oud_smoky.cls, "neutral");
  assert.equal(prof.patchouli.cls, "goodPossible", "the loved stages still count for its other families");
  /* its base turned smoky and heavy: no chip counts against the oud, and the chips still count for patchouli */
  prof = profileOf({ blackaoud: { drydown: -2, again: 0, chips: { drydown: ["smoky", "heavy"] }, noteAnswers: { oud_smoky: 0 } } });
  assert.deepEqual(plain(prof.oud_smoky.evidence.filter(e => e.chip)), []);
  assert.ok(prof.patchouli.evidence.some(e => e.chip === "heavy"));
});

test("a loved top note is not made a deal-breaker by a complaint chip on a later stage", () => {
  /* Bitter Peach: sweet fruit at 0.9 in the opening and 0.5 in the heart; the heart turned "too sweet" */
  assert.equal(E.strongestStage(E.byId.bitterpeach, "fruity_sweet"), "opening");
  const prof = profileOf({ bitterpeach: { heart: -2, again: 0, chips: { heart: ["sweet"] }, noteAnswers: { fruity_sweet: 2 } } });
  assert.equal(prof.fruity_sweet.n, 0);
  assert.equal(prof.fruity_sweet.cls, "neutral");
  assert.ok(prof.fruity_sweet.score > 0, "the lean still leans toward sweet fruit");
});

test("in the picks a mixed family is weighed by its mean once the mean leans clearly, and costs a flat 0.3 while balanced", () => {
  const rated = onlyTwo("vanilla28", "aventus");
  const penaltyOf = v => E.recommend({ vanilla_gourmand: Object.assign({ n: 3, evidence: [] }, v) }, rated).picks.find(p => p.P.id === "vanilla28").penalty;
  /* disliked in two bottles and liked in one: labelled mixed, weighed as the possible deal-breaker it was */
  assert.equal(penaltyOf({ cls: "mixed", score: -1.2, pos: 1, neg: 2 }), penaltyOf({ cls: "badPossible", score: -1.2, pos: 0, neg: 2 }));
  const P = E.byId.vanilla28, flat = E.STAGES.reduce((t, s) => t + (P.stages[s].vanilla_gourmand || 0) * catalogue.data.STAGE_W[s] * 0.3, 0);
  assert.ok(Math.abs(penaltyOf({ cls: "mixed", score: -0.5, pos: 1, neg: 1 }) - flat) < 1e-12);
});

test("in the picks a liked family earns its reward once, at its strongest stage, and a disliked one costs in every stage", () => {
  /* Not a Perfume holds woody ambers at 1 from opening to base; counted in every stage it collected 0.6 + 0.8 + 1 */
  const rated = onlyTwo("notaperfume", "aventus");
  const pickOf = v => E.recommend({ woody_amber: Object.assign({ n: 2, evidence: [] }, v) }, rated).picks.find(p => p.P.id === "notaperfume");
  assert.ok(Math.abs(pickOf({ cls: "goodLikely", score: 1, pos: 2, neg: 0 }).reward - 1) < 1e-12);
  assert.ok(Math.abs(pickOf({ cls: "goodLikely", score: 2, pos: 2, neg: 0 }).reward - 2) < 1e-12);
  assert.ok(Math.abs(pickOf({ cls: "badPossible", score: -1, pos: 0, neg: 2 }).penalty - (0.6 + 0.8 + 1)) < 1e-12);
});

test("a family the rated bottles hold only as a trace, and the visitor never spoke of, counts in the picks as unmet and is never called a like", () => {
  /* Aventus, still worn, holds vanilla at 0.2 in its base: vanilla scores +1 with no exposure (n = 0) */
  const ratings = { aventus: { drydown: 1, again: 1 } };
  let prof = profileOf(ratings);
  assert.ok(prof.vanilla_gourmand.n === 0 && prof.vanilla_gourmand.score > 0 && !prof.vanilla_gourmand.toldEvidence);
  const rated = Object.assign(onlyTwo("vanilla28", "grandsoir"), ratings);
  let v28 = E.recommend(prof, rated).picks.find(p => p.P.id === "vanilla28");
  assert.ok(!v28.reason.likes.includes("vanilla_gourmand"), "likes " + v28.reason.likes);
  const vr = v28.risks.filter(r => r.f === "vanilla_gourmand");
  assert.ok(vr.length && vr.every(r => r.kind === "unknown"), "vanilla is unmet");
  /* said in words, it counts: an enjoyed vanilla card makes it a like */
  prof = profileOf(ratings, toldFor("vanilla", 1));
  v28 = E.recommend(prof, rated).picks.find(p => p.P.id === "vanilla28");
  assert.ok(v28.reason.likes.includes("vanilla_gourmand"), "likes " + v28.reason.likes);
  assert.ok(!v28.risks.some(r => r.f === "vanilla_gourmand"));
  /* Aventus turned in its base: the vanilla trace scores -2, but the answers never leaned against vanilla */
  const turned = { aventus: { drydown: -2, again: 0 } };
  prof = profileOf(turned);
  assert.ok(prof.vanilla_gourmand.n === 0 && prof.vanilla_gourmand.score < 0);
  const osm = E.recommend(prof, Object.assign(onlyTwo("oudsatinmood", "vanilla28"), turned)).picks.find(p => p.P.id === "oudsatinmood");
  assert.ok(!(osm.reason.watch && osm.reason.watch.f === "vanilla_gourmand"), JSON.stringify(osm.reason.watch));
  assert.equal(osm.penalty, 0, "a trace in a bottle that turned costs nothing");
});

test("picks stay on the side of the gendered bottles the visitor kept, or, with none kept, of those rated", () => {
  const kept = { drydown: 1, again: 1 }, turned = { drydown: -2, again: 0 };
  const genders = ratings => E.recommend(profileOf(ratings), ratings).picks.map(p => p.P.gender);
  /* two men's bottles kept: the picks once included Oriana; two women's: Althair */
  assert.ok(genders({ aventus: kept, althair: kept }).every(g => g !== "f"));
  assert.ok(genders({ delina: kept, libre: kept }).every(g => g !== "m"));
  assert.equal(E.sideOf({ aventus: kept, althair: kept }), "m");
  assert.equal(E.sideOf({ althair: turned, delina: kept }), "f", "the kept bottle decides");
  assert.equal(E.sideOf({ aventus: turned, layton: turned }), "m", "none kept: the bottles rated");
  assert.equal(E.sideOf({ aventus: kept, delina: kept }), null, "both genders kept");
  assert.equal(E.sideOf({ grandsoir: kept, delina: turned }), null, "only a unisex bottle kept");
  assert.equal(E.sideOf({ delina: {}, aventus: turned }), "m", "a record with no stage set is not a rating");
  assert.equal(E.sideOf({}), null);
});

test("the order of the ratings never reorders the picks (two candidates tied but for the last digit)", () => {
  /* x scores exactly 0.7, summed in one order as 0.6999999999999998; p holds x at 1 in its base, q holds z, liked at 1,
     at 0.7: in truth they tie, and a tie goes to the perfume listed first */
  const mk = (id, st) => ({ id, house: id, name: id, ar: "", gender: "u", tier: "designer", conf: 3, stages: { opening: {}, heart: {}, drydown: st }, notes: { en: "", ar: "" } });
  const P = [mk("a", { x: 0.6 }), mk("b", { x: 0.6 }), mk("c", { x: 0.5 }), mk("d", { x: 0.3 }), mk("e", { z: 1 }), mk("p", { x: 1 }), mk("q", { z: 0.7 })];
  const mini = W.PP_ENGINE.create({ CHIPS: [], STAGE_W: catalogue.data.STAGE_W, PERFUMES: P }, W.PP_MAP, { book: {}, label: {} });
  const ratings = { a: { drydown: 1 }, b: { drydown: 0 }, c: { drydown: 1 }, d: { drydown: 1 }, e: { drydown: 1 } };
  const reversed = Object.fromEntries(Object.entries(ratings).reverse());
  const picks = r => plain(mini.recommend(mini.computeProfile(stateOf(r)), r).picks.map(p => p.P.id));
  assert.notEqual(mini.computeProfile(stateOf(ratings)).x.score, mini.computeProfile(stateOf(reversed)).x.score, "the two sums differ in the last digit");
  assert.deepEqual(picks(ratings), ["p", "q"]);
  assert.deepEqual(picks(reversed), ["p", "q"]);
});

test("a word for a family never counts against it: a trace in a bottle that turned never outweighs an enjoyed note", () => {
  /* Sauvage turned in its base, which holds vanilla at 0.3, a trace; the visitor enjoys the vanilla card */
  const ratings = { sauvageedp: { drydown: -2, again: 0 } };
  const quiet = profileOf(ratings), said = profileOf(ratings, toldFor("vanilla", 1));
  assert.ok(said.vanilla_gourmand.n === 0 && said.vanilla_gourmand.score < 0, "trace and word together lean against vanilla");
  const rated = Object.assign(onlyTwo("vanilla28", "grandsoir"), ratings);
  const finalOf = prof => E.recommend(prof, rated).picks.find(p => p.P.id === "vanilla28").final;
  assert.ok(finalOf(said) >= finalOf(quiet), `enjoying vanilla lowered Vanilla 28: ${finalOf(quiet)} to ${finalOf(said)}`);
  assert.ok(E.picksView(said).vanilla_gourmand.score > 0, "the picks read the word alone");
  /* and so does the card: vanilla is a like, and nothing warns against it */
  const card = E.recommend(said, rated).picks.find(p => p.P.id === "vanilla28").reason;
  assert.ok(card.likes.includes("vanilla_gourmand"), "likes " + card.likes);
  assert.ok(!(card.watch && card.watch.f === "vanilla_gourmand"), "watch " + JSON.stringify(card.watch));
  assert.equal(E.picksView(quiet).vanilla_gourmand, undefined, "a trace alone is a family not met");
});
