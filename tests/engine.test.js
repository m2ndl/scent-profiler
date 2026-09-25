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
