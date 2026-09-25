/* Runs the same scenarios through two versions of the page and reports every difference in what the
   page wrote (all elements, storage, requests sent, clipboard) and in the engine's outputs.
   Usage: node run_equiv.js <old|new> <old|new> [count] [firstSeed] */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { createPage } = require("./dom");
const { makeScenarios, respond, NOTES_ENTRIES } = require("./scenarios");

const SCRATCH = path.join(__dirname, "..");
const BASE = path.join(SCRATCH, "baseline");
const PROJECT = process.env.NEW_ROOT || "C:/Users/malha/Desktop/Webapps/perfume-profiler";
const read = f => fs.readFileSync(f, "utf8");

function oldScripts() {
  const html = read(path.join(BASE, "index.html"));
  const inline = /<script>\n([\s\S]*?)<\/script>/.exec(html)[1];
  const hook = "\n  renderAll();\n  loadCommunity();\n  loadCatalogue();\n})();";
  if (inline.split(hook).length !== 2) throw new Error("hook point not found exactly once");
  const exposed = inline.replace(hook, "\n  window.__PP = { computeProfile, recommend, settleSuggestion, resolve, derived, buildAuto, getRatings: () => ratings };" + hook);
  return ["data.js", "mapper.js", "materials.js", "evidence.js"].map(n => ({ filename: "old/" + n, code: read(path.join(BASE, n)) }))
    .concat([{ filename: "old/index.html#inline", code: exposed }]);
}
function newScripts() {
  const html = read(path.join(PROJECT, "site/index.html"));
  const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  if (/<script>/.test(html)) throw new Error("new index.html still has an inline script");
  return srcs.map(s => ({ filename: "new/" + s, code: read(path.join(PROJECT, "site", s)) }));
}

const ser = x => JSON.stringify(x, (k, v) => ((k === "perfume" || k === "P" || k === "target") && v && typeof v === "object" ? v.id : v));
function engineOld(page) {
  const X = page.sandbox.__PP; if (!X) return "no engine";
  const prof = X.computeProfile(), rec = X.recommend(prof), settle = X.settleSuggestion(prof);
  return ser({ prof, rec, settle, derived: NOTES_ENTRIES.map(e => X.derived(e)), autos: NOTES_ENTRIES.map(e => X.buildAuto(e)), resolved: Object.keys(X.getRatings()).map(id => X.resolve(id)) });
}
function engineNew(page) {
  const W = page.sandbox; if (!W.PP_ENGINE) return "no engine";
  const E = W.PP_ENGINE.create(W.PP_DATA, W.PP_MAP, W.PP_EVIDENCE);
  const state = { ratings: JSON.parse(page.localStorage.getItem("pp_ratings_v1") || "{}"), auto: {}, images: {} };
  const prof = E.computeProfile(state), rec = E.recommend(prof, state.ratings), settle = E.settleSuggestion(prof, state.ratings);
  return ser({ prof, rec, settle, derived: NOTES_ENTRIES.map(e => E.derived(e)), autos: NOTES_ENTRIES.map(e => E.buildAuto(e)), resolved: Object.keys(state.ratings).map(id => E.resolve(id, state)) });
}

async function trace(kind, sc, keepFull) {
  const scripts = kind === "old" ? oldScripts() : newScripts();
  const page = createPage({ localStorage: sc.storage, navLang: sc.navLang, endpoint: sc.endpoint, respond });
  const steps = [];
  const rec = (label, fn) => {
    let err = null; try { if (fn) fn(); } catch (e) { err = String((e && e.message) || e); }
    const s = JSON.stringify(page.snapshot());
    steps.push({ label, err, hash: crypto.createHash("sha1").update(s).digest("hex"), full: keepFull ? s : null });
  };
  rec("load", () => page.load(scripts));
  const engine = (kind === "old" ? engineOld : engineNew)(page);
  await page.settle(); rec("settled");
  for (const a of sc.actions) {
    rec(JSON.stringify(a), () => {
      if (a.click) page.click(a.click);
      else if (a.label) { page.setValue("lbl-" + a.label.id, a.label.text); page.setValue("lblm-" + a.label.id, a.label.market); page.click({ dataset: { readlabel: a.label.id } }); }
      else if (a.input != null) page.input(a.input);
      else if (a.enter) page.key("Enter", a.enter);
      else if (a.escape) page.key("Escape");
    });
    await page.settle(); rec("settle");
  }
  rec("flush", () => page.flushTimers()); await page.settle(); rec("end");
  return { engine, steps, calls: JSON.stringify(page.calls), clipboard: JSON.stringify(page.clipboard) };
}

function firstDiff(a, b) { let i = 0; while (i < a.length && a[i] === b[i]) i++; return { at: i, a: a.slice(Math.max(0, i - 150), i + 150), b: b.slice(Math.max(0, i - 150), i + 150) }; }

(async () => {
  const [kindA, kindB] = [process.argv[2] || "old", process.argv[3] || "old"];
  const n = +(process.argv[4] || 50), seed0 = +(process.argv[5] || 1000);
  const probe = createPage({}); probe.load(oldScripts().slice(0, 4));
  const W = probe.sandbox;
  const labelsDir = fs.existsSync(path.join(BASE, "reference/labels")) ? path.join(BASE, "reference/labels") : null;
  const labelTexts = fs.readdirSync(labelsDir).filter(f => f.endsWith(".txt")).map(f => read(path.join(labelsDir, f)).split("\n").filter(l => !/^(id|market|date|code|url|source):/i.test(l)).join("\n").trim());
  labelTexts.push("Alcohol Denat., Parfum, Aqua, Coumarin, Linalool, Limonene, Evernia Prunastri Extract, Vanillin, Benzyl Salicylate");
  const evidenceIds = [...new Set(Object.keys(W.PP_EVIDENCE.book).concat(Object.keys(W.PP_EVIDENCE.label)))];
  const scenarios = makeScenarios(n, seed0, W.PP_DATA, labelTexts, W.PP_MATERIALS.parse, evidenceIds);
  let same = 0, differ = 0, steps = 0, errs = 0, clip = 0, posts = 0;
  const actionKinds = {};
  for (const sc of scenarios) {
    for (const a of sc.actions) { const k = Object.keys(a)[0] === "click" ? "click:" + (a.click.id || Object.keys(a.click.dataset)[0]) : Object.keys(a)[0]; actionKinds[k] = (actionKinds[k] || 0) + 1; }
    const A = await trace(kindA, sc, false), B = await trace(kindB, sc, false);
    steps += A.steps.length; errs += A.steps.filter(s => s.err).length; for (const s of A.steps) if (s.err) console.log("  handler error, seed", sc.seed, "step", s.label, ":", s.err); clip += JSON.parse(A.clipboard).length; posts += JSON.parse(A.calls).filter(c => c.method === "POST").length;
    const hashA = A.steps.map(s => s.label + "|" + s.err + "|" + s.hash).join("\n"), hashB = B.steps.map(s => s.label + "|" + s.err + "|" + s.hash).join("\n");
    const ok = A.engine === B.engine && hashA === hashB && A.calls === B.calls && A.clipboard === B.clipboard;
    if (ok) { same++; continue; }
    differ++;
    console.log(`\nseed ${sc.seed}: DIFFERENT`);
    if (A.engine !== B.engine) console.log(" engine:", firstDiff(A.engine, B.engine));
    if (A.calls !== B.calls) console.log(" calls:", firstDiff(A.calls, B.calls));
    if (A.clipboard !== B.clipboard) console.log(" clipboard:", firstDiff(A.clipboard, B.clipboard));
    if (hashA !== hashB) {
      const FA = await trace(kindA, sc, true), FB = await trace(kindB, sc, true);
      const i = FA.steps.findIndex((s, j) => !FB.steps[j] || s.hash !== FB.steps[j].hash || s.err !== FB.steps[j].err);
      console.log(" step", i, FA.steps[i] && FA.steps[i].label, "err", FA.steps[i] && FA.steps[i].err, "/", FB.steps[i] && FB.steps[i].err);
      if (FA.steps[i] && FB.steps[i]) console.log(firstDiff(FA.steps[i].full, FB.steps[i].full));
    }
    if (differ >= 5) { console.log("stopping after 5 differences"); break; }
  }
  console.log(`\n${kindA} vs ${kindB}: ${same} scenarios identical, ${differ} different; ${steps} page states compared per side, ${errs} handler errors (same on both sides), ${clip} clipboard copies, ${posts} POSTs`);
  console.log("actions:", JSON.stringify(actionKinds));
})().catch(e => { console.error(e); process.exit(1); });
