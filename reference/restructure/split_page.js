/* One-off: splits the inline script of index.html (baseline copy) into site/js/engine.js (pure profile
   logic), site/js/config.js (deployment settings) and site/js/app.js (the page), and replaces the inline
   script in site/index.html with script tags. Every cut and edit is an exact match that must occur
   once; anything else stops the script. Not meant to be re-run. */
"use strict";
const fs = require("fs"), path = require("path");
const BASE = path.join(__dirname, "baseline");
const SITE = "C:/Users/malha/Desktop/Webapps/perfume-profiler/site";

const html = fs.readFileSync(path.join(BASE, "index.html"), "utf8");
const m = /<script>\n([\s\S]*?)<\/script>\n/.exec(html);
let app = m[1];

const once = (hay, needle, what) => { const n = hay.split(needle).length - 1; if (n !== 1) throw new Error(`${what}: found ${n} times`); };
function cut(startMarker, endMarker, what) {
  once(app, startMarker, what + " start"); const a = app.indexOf(startMarker);
  const b = app.indexOf(endMarker, a); if (b < 0) throw new Error(what + " end not found");
  const block = app.slice(a, b + endMarker.length); return { a, b: b + endMarker.length, block };
}
function take(startMarker, endMarker, replacement, what) {
  const c = cut(startMarker, endMarker, what);
  app = app.slice(0, c.a) + replacement + app.slice(c.b);
  return c.block;
}
function edit(src, from, to, what) { once(src, from, what); return src.replace(from, () => to); }

/* 1. blocks that move to the engine */
const bEvidence = take("  /* Provenance stack (reference/debate/ROUNDTABLE.md)", "  const RAW = Object.fromEntries(D.PERFUMES.map(p => [p.id, p]));\n",
  "  const E = window.PP_ENGINE.create(D, M, window.PP_EVIDENCE);\n  const { STAGES, PERFUMES, byId } = E;\n", "applyEvidence");
const bGender = take('  const GENDER = { men: "m"', '};\n', "", "GENDER");
const bResolve = take("  /* Build a catalogue-shaped object from a backend entry", "    return null;\n  }\n",
  "  /* The engine keeps no state: each call gets the page's current ratings, lazy catalogue and images. */\n" +
  "  const state = () => ({ ratings, auto: AUTO, images });\n" +
  "  const resolve = id => E.resolve(id, state());\n" +
  "  const derived = entry => E.derived(entry);\n", "buildAuto..resolve");
const bProvW = take('  const PROV_W = { book: 1', '};\n', "", "PROV_W");
const bProfile = take("  /* ---------- profile engine ---------- */", "    return null;\n  }\n",
  "  /* ---------- profile engine (engine.js) ---------- */\n" +
  "  const computeProfile = () => E.computeProfile(state());\n" +
  "  const recommend = prof => E.recommend(prof, ratings);\n" +
  "  const settleSuggestion = prof => E.settleSuggestion(prof, ratings);\n", "computeProfile..settleSuggestion");

/* 2. the page's own head: engine and config come from their files */
app = edit(app,
  '  const D = window.PP_DATA, M = window.PP_MAP, MAT = window.PP_MATERIALS, EV = window.PP_EVIDENCE || { book: {}, label: {} };\n' +
  '  if (!D || !M || !MAT) { document.getElementById("h1").textContent = "data.js, mapper.js or materials.js did not load. Serve all files from the same folder."; return; }\n' +
  '  const { FAMILIES, CHIPS, STAGE_W } = D;\n' +
  '  const STAGES = ["opening", "heart", "drydown"];\n\n',
  '  const D = window.PP_DATA, M = window.PP_MAP, MAT = window.PP_MATERIALS;\n' +
  '  if (!D || !M || !MAT || !window.PP_ENGINE || !window.PP_CONFIG) { document.getElementById("h1").textContent = "A script in js/ did not load (config, data, mapper, materials or engine). Serve the site folder as it is."; return; }\n' +
  '  const { FAMILIES, CHIPS } = D;\n', "app head");
const cfgBlock = take("  /* ---------- CONFIG: edit these when you deploy ---------- */", "  };\n",
  "  /* Deployment settings: config.js. */\n  const CONFIG = window.PP_CONFIG;\n", "CONFIG");
app = edit(app, "(see mock_backend.py)", "(see tools/mock_backend.py)", "mock path");

/* 3. engine.js: the moved blocks, indented one level deeper, with page state passed in */
let resolveBlock = bResolve;
resolveBlock = edit(resolveBlock, "  function resolve(id) {\n    const r = ratings[id];", "  function resolve(id, state) {\n    const r = state.ratings[id];", "resolve head");
resolveBlock = edit(resolveBlock, "return images[id] && !P.image ? Object.assign({}, P, { image: images[id] }) : P;", "return state.images[id] && !P.image ? Object.assign({}, P, { image: state.images[id] }) : P;", "resolve images");
resolveBlock = edit(resolveBlock, "const entry = (r && r.auto) || AUTO[id];", "const entry = (r && r.auto) || state.auto[id];", "resolve auto");
let profileBlock = bProfile;
profileBlock = edit(profileBlock, "  /* ---------- profile engine ---------- */\n", "", "profile header");
profileBlock = edit(profileBlock, "  function computeProfile() {\n", "  function computeProfile(state) {\n    const ratings = state.ratings;\n", "computeProfile head");
profileBlock = edit(profileBlock, "      const P = resolve(id); if (!P || !P.stages) continue;", "      const P = resolve(id, state); if (!P || !P.stages) continue;", "computeProfile resolve");
profileBlock = edit(profileBlock, "  function recommend(prof) {", "  function recommend(prof, ratings) {", "recommend head");
profileBlock = edit(profileBlock, "  function settleSuggestion(prof) {", "  function settleSuggestion(prof, ratings) {", "settle head");
const indent = s => s.split("\n").map(l => (l ? "  " + l : l)).join("\n");

const engine = `/* Profile engine: merges the evidence layers into each perfume, builds the wearer's profile from their
   ratings and picks the recommendations. It holds no page, storage or language, so the page (app.js),
   the tests and the tools run the same code. */

window.PP_ENGINE = (function () {
  "use strict";
  const STAGES = ["opening", "heart", "drydown"];

  /* D: PP_DATA (catalogue and chips), M: PP_MAP (note mapper), EV: PP_EVIDENCE (book and label layers).
     Functions that need the wearer's data take it as an argument: state = { ratings, auto, images },
     the ratings by id, lazy-catalogue entries by id and bottle images of verified entries by id. */
  function create(D, M, EV) {
    EV = EV || { book: {}, label: {} };
    const { CHIPS, STAGE_W } = D;

${indent(bEvidence)}
${indent(bGender)}
${indent(resolveBlock)}
${indent(bProvW)}
${indent(profileBlock)}
    return { STAGES, PERFUMES, byId, applyEvidence, buildAuto, derived, resolve, computeProfile, recommend, settleSuggestion };
  }

  return { create, STAGES };
})();
`;

/* 4. config.js from the old CONFIG block */
let cfg = cfgBlock;
cfg = edit(cfg, "  /* ---------- CONFIG: edit these when you deploy ---------- */\n  const CONFIG = {\n", "", "config head");
cfg = edit(cfg, "(see apps-script.gs)", "(see backend/apps-script.gs)", "config backend path");
cfg = cfg.replace(/\n  };\n$/, "\n");
if (/\n  };\n?$/.test(cfg)) throw new Error("config tail not removed");
const dedent = s => s.split("\n").map(l => l.replace(/^  /, "")).join("\n");
const config = `/* Deployment settings: the one file to edit when the site goes live. */
window.PP_CONFIG = {
${dedent(cfg).replace(/\n$/, "")}
};
`;

const appOut = `/* The page: language, rendering, storage on this device, backend calls and event handlers.
   Profile logic lives in engine.js, deployment settings in config.js. */
${app}`;

/* 5. index.html: script tags instead of the inline script */
const tags = ["config", "data", "mapper", "materials", "evidence", "engine", "app"].map(n => `<script src="js/${n}.js"></script>`).join("\n") + "\n";
let page = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
if (page !== html) throw new Error("site/index.html is not the baseline file");
page = edit(page, '<script src="data.js"></script>\n<script src="mapper.js"></script>\n<script src="materials.js"></script>\n<script src="evidence.js"></script>\n' + m[0], tags, "index scripts");

fs.writeFileSync(path.join(SITE, "js/engine.js"), engine);
fs.writeFileSync(path.join(SITE, "js/config.js"), config);
fs.writeFileSync(path.join(SITE, "js/app.js"), appOut);
fs.writeFileSync(path.join(SITE, "index.html"), page);
console.log("OK engine", engine.split("\n").length, "lines; app", appOut.split("\n").length, "lines; config", config.split("\n").length, "lines; index", page.split("\n").length, "lines");
