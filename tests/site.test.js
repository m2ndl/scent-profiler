/* What gets deployed and what gets generated: site/ is self-contained and holds only web files, the
   generated files are current, and the catalogue's references all resolve. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { SITE, loadSite } = require("../tools/lib/site");
const { build, OUT } = require("../tools/build_evidence");
const { render, GS } = require("../tools/sync_backend");

const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));

test("site/ holds only web files (no notes, sources, books or backend code)", () => {
  const allowed = new Set([".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".webp", ".woff2", ".webmanifest"]);
  const extra = walk(SITE).filter(f => !allowed.has(path.extname(f).toLowerCase()) && path.basename(f) !== "robots.txt");
  assert.deepEqual(extra.map(f => path.relative(SITE, f)), []);
});

test("every local link and script in site/*.html points to a file inside site/", () => {
  for (const page of fs.readdirSync(SITE).filter(f => f.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(SITE, page), "utf8");
    for (const [, ref] of html.matchAll(/(?:src|href|content)="([^"]+)"/g)) {
      if (/^(https?:|data:|mailto:|#)/.test(ref) || !/\.\w+$/.test(ref.split(/[?#]/)[0])) continue;
      const target = path.resolve(SITE, ref.split(/[?#]/)[0]);
      assert.ok(target.startsWith(SITE + path.sep), `${page}: ${ref} leaves site/`);
      assert.ok(fs.existsSync(target), `${page}: ${ref} is missing`);
    }
  }
});

test("site/js/evidence.js is current with evidence/ (run node tools/build_evidence.js)", () => {
  const withoutDate = s => s.replace(/\n "built": "[^"]*",/, "");
  const r = build();
  assert.deepEqual(r.rejected, []);
  assert.equal(withoutDate(fs.readFileSync(OUT, "utf8")), withoutDate(r.text));
});

test("the backend's VERIFIED list matches the catalogue (run node tools/sync_backend.js)", () => {
  const src = fs.readFileSync(GS, "utf8");
  assert.equal(render(src), src);
});

test("catalogue, chips, mapper, materials and evidence name only known families and perfumes", () => {
  const W = loadSite("data", "mapper", "materials", "evidence");
  const D = W.PP_DATA, F = new Set(Object.keys(D.FAMILIES)), ids = D.PERFUMES.map(p => p.id), idSet = new Set(ids);
  const bad = [];
  if (idSet.size !== ids.length) bad.push("duplicate ids: " + ids.filter((x, i) => ids.indexOf(x) !== i).join(", "));
  for (const p of D.PERFUMES) {
    for (const s of ["opening", "heart", "drydown"]) for (const [f, w] of Object.entries(p.stages[s] || {})) {
      if (!F.has(f)) bad.push(`${p.id} ${s}: unknown family ${f}`);
      if (!(w > 0 && w <= 1)) bad.push(`${p.id} ${s} ${f}: weight ${w}`);
    }
    if (p.cloneOf && !idSet.has(p.cloneOf)) bad.push(`${p.id}: clone of unknown ${p.cloneOf}`);
  }
  for (const c of D.CHIPS) for (const f of Object.keys(c.fams)) if (!F.has(f)) bad.push(`chip ${c.id}: ${f}`);
  for (const [pat, fams] of W.PP_MAP.RULES) for (const f of Object.keys(fams)) if (!F.has(f)) bad.push(`mapper rule ${pat}: ${f}`);
  for (const m of W.PP_MATERIALS.MATERIALS) for (const f of Object.keys(m.fams)) if (!F.has(f)) bad.push(`material ${m.inci}: ${f}`);
  for (const f of W.PP_MATERIALS.NEVER_ON_LABEL.concat(Object.keys(W.PP_MATERIALS.ABSENCE))) if (!F.has(f)) bad.push(`materials list: ${f}`);
  for (const layer of ["book", "label"]) for (const id of Object.keys(W.PP_EVIDENCE[layer])) if (!idSet.has(id)) bad.push(`${layer} evidence for unknown ${id}`);
  assert.deepEqual(bad, []);
});
