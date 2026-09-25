/* Loads the site's browser scripts into Node the way the page loads them: in order, into one shared
   window. Tools and tests read the catalogue, mapper, materials and engine through this, never by
   copying code. Example: const W = loadSite("data", "mapper"); W.PP_DATA.PERFUMES */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const SITE = path.join(ROOT, "site");

function newWindow() {
  const ctx = vm.createContext({});
  vm.runInContext("globalThis.window = globalThis;", ctx);
  return ctx;
}

function loadSite(...names) {
  const ctx = newWindow();
  for (const n of names) {
    const file = path.join(SITE, "js", n + ".js");
    vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  }
  return ctx;
}

/* Runs one script from its source text, for tools that edit data.js as text and re-read the result. */
function runScript(code, filename) {
  const ctx = newWindow();
  vm.runInContext(code, ctx, { filename });
  return ctx;
}

module.exports = { ROOT, SITE, loadSite, runScript };
