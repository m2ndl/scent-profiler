/* One-off: writes tests/fixtures/ (a frozen catalogue subset, seeded rating scenarios) and the engine
   golden file, capturing the golden from the PRE-SPLIT page (baseline index.html inline script) run on
   that frozen catalogue. Not meant to be re-run; the test's UPDATE_GOLDEN path regenerates the golden
   from the current engine when a change is intended. */
"use strict";
const fs = require("fs"), path = require("path");
const S = __dirname, BASE = path.join(S, "baseline");
const PROJECT = "C:/Users/malha/Desktop/Webapps/perfume-profiler";
const { createPage } = require(path.join(PROJECT, "tests/lib/dom"));
const { summarize, specialIds, formatGolden } = require(path.join(PROJECT, "tests/lib/summary"));
const { makeScenarios, NOTES_ENTRIES } = require("./equiv/scenarios");
const read = f => fs.readFileSync(path.join(BASE, f), "utf8");

(async () => {
  const probe = createPage({});
  probe.load(["data.js", "mapper.js", "materials.js", "evidence.js"].map(n => ({ filename: n, code: read(n) })));
  const W = probe.sandbox, D = W.PP_DATA, EV = W.PP_EVIDENCE;

  /* frozen catalogue: quick picks, every perfume with book or label evidence, clones of those, 25 seeded others */
  const quick = ["sauvageedp", "bleuedp", "aventus", "hacivat", "br540", "khamrah", "yara", "erbapura", "libre", "cdnim"];
  const keep = new Set(quick.concat(Object.keys(EV.book), Object.keys(EV.label)));
  for (const p of D.PERFUMES) if (p.cloneOf && keep.has(p.cloneOf)) keep.add(p.id);
  let a = 20260925; const next = () => { a = (Math.imul(a, 1103515245) + 12345) >>> 0; return a / 4294967296; };
  const rest = D.PERFUMES.map(p => p.id).filter(id => !keep.has(id));
  const target = keep.size + 25;
  while (keep.size < target && rest.length) keep.add(rest.splice(Math.floor(next() * rest.length), 1)[0]);
  const PERFUMES = JSON.parse(JSON.stringify(D.PERFUMES.filter(p => keep.has(p.id))));
  const pick = obj => Object.fromEntries(Object.entries(obj).filter(([id]) => keep.has(id)));
  const catalogue = {
    data: { STAGE_W: D.STAGE_W, CHIPS: JSON.parse(JSON.stringify(D.CHIPS)), PERFUMES },
    evidence: JSON.parse(JSON.stringify({ book: pick(EV.book), label: pick(EV.label) })),
    notesEntries: NOTES_ENTRIES
  };

  /* scenarios over the frozen catalogue; label texts parsed now and stored parsed */
  const labelsDir = path.join(BASE, "reference/labels");
  const labelTexts = fs.readdirSync(labelsDir).filter(f => f.endsWith(".txt")).sort().map(f => read("reference/labels/" + f).split("\n").filter(l => !/^(id|market|date|code|url|source):/i.test(l)).join("\n").trim());
  labelTexts.push("Alcohol Denat., Parfum, Aqua, Coumarin, Linalool, Limonene, Evernia Prunastri Extract, Vanillin, Benzyl Salicylate");
  const evidenceIds = Object.keys(catalogue.evidence.book).concat(Object.keys(catalogue.evidence.label));
  const fixtureData = Object.assign({ FAMILIES: D.FAMILIES }, catalogue.data);
  const scenarios = makeScenarios(60, 5000, fixtureData, labelTexts, W.PP_MATERIALS.parse, evidenceIds)
    .map(sc => ({ seed: sc.seed, ratings: JSON.parse(sc.storage.pp_ratings_v1) }));

  /* golden from the pre-split page: its closures, its catalogue replaced by the frozen one */
  const html = read("index.html");
  const inline = /<script>\n([\s\S]*?)<\/script>/.exec(html)[1];
  const hook = "\n  renderAll();\n  loadCommunity();\n  loadCatalogue();\n})();";
  if (inline.split(hook).length !== 2) throw new Error("hook point not found exactly once");
  const exposed = inline.replace(hook, "\n  window.__PP = { computeProfile, recommend, settleSuggestion, resolve, derived };" + hook);
  const golden = { mapped: null, scenarios: [] };
  for (const sc of scenarios) {
    const page = createPage({ localStorage: { pp_device: JSON.stringify("d_fixture"), pp_lang: JSON.stringify("en"), pp_ratings_v1: JSON.stringify(sc.ratings) } });
    page.load([
      { filename: "fixture/data.js", code: "window.PP_DATA = " + JSON.stringify(fixtureData) + ";" },
      { filename: "old/mapper.js", code: read("mapper.js") },
      { filename: "old/materials.js", code: read("materials.js") },
      { filename: "fixture/evidence.js", code: "window.PP_EVIDENCE = " + JSON.stringify(catalogue.evidence) + ";" },
      { filename: "old/index.html#inline", code: exposed }
    ]);
    const X = page.sandbox.__PP;
    if (!page.snapshot().els.profile) throw new Error("old page did not render");
    const prof = X.computeProfile(), rec = X.recommend(prof), settle = X.settleSuggestion(prof);
    golden.scenarios.push(JSON.parse(JSON.stringify(Object.assign({ seed: sc.seed }, summarize(prof, rec, settle, specialIds(sc.ratings).map(id => X.resolve(id)))))));
    if (!golden.mapped) golden.mapped = JSON.parse(JSON.stringify(NOTES_ENTRIES.map(e => X.derived(e))));
  }

  const FIX = path.join(PROJECT, "tests/fixtures");
  fs.mkdirSync(FIX, { recursive: true });
  fs.writeFileSync(path.join(FIX, "catalogue.json"), JSON.stringify(catalogue, null, 1) + "\n");
  fs.writeFileSync(path.join(FIX, "scenarios.json"), "[\n" + scenarios.map(s => JSON.stringify(s)).join(",\n") + "\n]\n");
  fs.writeFileSync(path.join(FIX, "engine_golden.json"), formatGolden(golden));
  const cls = {}; for (const g of golden.scenarios) for (const v of Object.values(g.profile)) cls[v.cls] = (cls[v.cls] || 0) + 1;
  console.log("fixture perfumes", PERFUMES.length, "scenarios", scenarios.length, "with picks", golden.scenarios.filter(g => g.picks.length).length,
    "with settle", golden.scenarios.filter(g => g.settle).length, "special resolves", golden.scenarios.reduce((n, g) => n + g.resolved.length, 0), "classes", JSON.stringify(cls));
  for (const f of ["catalogue.json", "scenarios.json", "engine_golden.json"]) console.log(f, fs.statSync(path.join(FIX, f)).size, "bytes");
})().catch(e => { console.error(e); process.exit(1); });
