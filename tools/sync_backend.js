#!/usr/bin/env node
/* Writes the VERIFIED list in backend/apps-script.gs (verified ids and search names, which
   enrichVerified() looks up) from site/js/data.js, so the backend never keeps its own copy of the
   catalogue. Run after adding or renaming catalogue entries, then paste the file into the Apps Script
   editor again.
     node tools/sync_backend.js           rewrite the list
     node tools/sync_backend.js --check   exit 1 if the list is out of date (tests/ runs this) */

const fs = require("fs");
const path = require("path");
const { ROOT, loadSite } = require("./lib/site");
const GS = path.join(ROOT, "backend", "apps-script.gs");
const START = "const VERIFIED = [\n", END = "\n];";

function render(src) {
  const w = loadSite("data");
  const list = w.PP_DATA.PERFUMES.map(p => `  [${JSON.stringify(p.id)}, ${JSON.stringify(p.house + " " + p.name)}]`).join(",\n");
  const a = src.indexOf(START), b = src.indexOf(END, a);
  if (a < 0 || b < 0) throw new Error("VERIFIED block not found in backend/apps-script.gs");
  return src.slice(0, a + START.length) + list + src.slice(b);
}

if (require.main === module) {
  const src = fs.readFileSync(GS, "utf8");
  const out = render(src);
  if (process.argv.includes("--check")) {
    if (out !== src) { console.error("backend/apps-script.gs: VERIFIED list is out of date; run node tools/sync_backend.js"); process.exit(1); }
    console.log("VERIFIED list is current");
  } else {
    fs.writeFileSync(GS, out);
    console.log(out === src ? "VERIFIED list already current" : "VERIFIED list rewritten from site/js/data.js");
  }
}

module.exports = { render, GS };
