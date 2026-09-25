/* Checks the send-timer fix against the pre-split page on the same scenarios: every page state and every
   non-rating request must be identical; the fixed page must raise no errors; its rating sends must be one
   per perfume, each the perfume's final stored state, and include every send the old page made for a
   perfume still present. Usage: node fix_check.js [count] [firstSeed] */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { createPage } = require("./dom");
const { makeScenarios, respond } = require("./scenarios");
const BASE = path.join(__dirname, "..", "baseline");
const PROJECT = process.env.NEW_ROOT || "C:/Users/malha/Desktop/Webapps/perfume-profiler";
const read = f => fs.readFileSync(f, "utf8");

const oldScripts = () => ["data.js", "mapper.js", "materials.js", "evidence.js"].map(n => ({ filename: "old/" + n, code: read(path.join(BASE, n)) }))
  .concat([{ filename: "old/inline", code: /<script>\n([\s\S]*?)<\/script>/.exec(read(path.join(BASE, "index.html")))[1] }]);
const newScripts = () => [...read(path.join(PROJECT, "site/index.html")).matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: "new/" + m[1], code: read(path.join(PROJECT, "site", m[1])) }));

async function trace(scripts, sc) {
  const page = createPage({ localStorage: sc.storage, navLang: sc.navLang, endpoint: sc.endpoint, respond });
  const states = [], errors = [];
  const rec = fn => { try { if (fn) fn(); } catch (e) { errors.push(String(e.message || e)); } states.push(crypto.createHash("sha1").update(JSON.stringify(page.snapshot())).digest("hex")); };
  rec(() => page.load(scripts)); await page.settle(); rec();
  for (const a of sc.actions) {
    rec(() => {
      if (a.click) page.click(a.click);
      else if (a.label) { page.setValue("lbl-" + a.label.id, a.label.text); page.setValue("lblm-" + a.label.id, a.label.market); page.click({ dataset: { readlabel: a.label.id } }); }
      else if (a.input != null) page.input(a.input);
      else if (a.enter) page.key("Enter", a.enter);
      else if (a.escape) page.key("Escape");
    });
    await page.settle(); rec();
  }
  rec(() => page.flushTimers()); await page.settle(); rec();
  const final = JSON.parse(page.localStorage.getItem("pp_ratings_v1") || "{}");
  return { states, errors, calls: page.calls, final };
}

(async () => {
  const n = +(process.argv[2] || 500), seed0 = +(process.argv[3] || 1000);
  const probe = createPage({}); probe.load(oldScripts().slice(0, 4)); const W = probe.sandbox;
  const labelsDir = path.join(BASE, "reference/labels");
  const labelTexts = fs.readdirSync(labelsDir).filter(f => f.endsWith(".txt")).map(f => read(path.join(labelsDir, f)).split("\n").filter(l => !/^(id|market|date|code|url|source):/i.test(l)).join("\n").trim());
  const evidenceIds = [...new Set(Object.keys(W.PP_EVIDENCE.book).concat(Object.keys(W.PP_EVIDENCE.label)))];
  const scenarios = makeScenarios(n, seed0, W.PP_DATA, labelTexts, W.PP_MATERIALS.parse, evidenceIds);
  let ok = 0, bad = 0, oldErr = 0, oldSends = 0, newSends = 0, recovered = 0;
  for (const sc of scenarios) {
    const A = await trace(oldScripts(), sc), B = await trace(newScripts(), sc);
    const problems = [];
    if (A.states.join() !== B.states.join()) problems.push("page states differ at step " + A.states.findIndex((h, i) => h !== B.states[i]));
    const other = c => JSON.stringify(c.filter(x => !(x.body && x.body.type === "rating")));
    if (other(A.calls) !== other(B.calls)) problems.push("non-rating requests differ");
    if (B.errors.length) problems.push("new page errors: " + B.errors.join("; "));
    const rA = A.calls.filter(x => x.body && x.body.type === "rating").map(x => x.body), rB = B.calls.filter(x => x.body && x.body.type === "rating").map(x => x.body);
    const ids = rB.map(b => b.perfume);
    if (new Set(ids).size !== ids.length) problems.push("two sends for one perfume");
    for (const b of rB) {
      const f = B.final[b.perfume];
      if (!f) { problems.push("sent a perfume that is not stored: " + b.perfume); continue; }
      const { auto, label, ...rest } = f;
      for (const [k, v] of Object.entries(rest)) if (JSON.stringify(b[k]) !== JSON.stringify(v)) problems.push(`${b.perfume}.${k} sent ${JSON.stringify(b[k])}, stored ${JSON.stringify(v)}`);
      if ("auto" in b || "label" in b) problems.push("auto or label sent");
    }
    for (const a of rA) if (B.final[a.perfume] && !rB.some(b => JSON.stringify(b) === JSON.stringify(a))) problems.push("old send missing: " + a.perfume);
    oldErr += A.errors.length; oldSends += rA.length; newSends += rB.length; if (rB.length > rA.length) recovered++;
    if (problems.length) { bad++; console.log("seed", sc.seed, problems.slice(0, 4)); } else ok++;
  }
  console.log(`${ok} scenarios as specified, ${bad} not; old page: ${oldErr} errors, ${oldSends} rating sends; fixed page: 0 errors required, ${newSends} rating sends; ${recovered} scenarios where the old page lost a rating`);
})().catch(e => { console.error(e); process.exit(1); });
