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

test("no file in site/ is empty, and every WebP and PNG ends where its header says (a cut-off write shows as a missing image)", () => {
  const bad = [];
  for (const f of walk(SITE)) {
    const b = fs.readFileSync(f), rel = path.relative(SITE, f), ext = path.extname(f).toLowerCase();
    if (!b.length) { bad.push(`${rel}: empty`); continue; }
    if (ext === ".webp" && !(b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP" && b.readUInt32LE(4) + 8 === b.length)) bad.push(`${rel}: not a whole WebP`);
    if (ext === ".png" && !(b.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) && b.subarray(-12).equals(Buffer.from("0000000049454e44ae426082", "hex")))) bad.push(`${rel}: not a whole PNG`);
  }
  assert.deepEqual(bad, []);
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

test("the quiz grid and testers name catalogue perfumes, and each tester's drydown is its family alone", () => {
  const W = loadSite("data", "mapper", "materials", "evidence", "engine");
  const D = W.PP_DATA, E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE), F = new Set(Object.keys(D.FAMILIES));
  const bad = [];
  if (D.QUIZ.grid.length !== 20 || new Set(D.QUIZ.grid).size !== 20) bad.push("the grid needs twenty distinct ids");
  for (const id of D.QUIZ.grid) if (!E.byId[id]) bad.push(`grid: unknown ${id}`);
  for (const t of D.QUIZ.testers) {
    const p = E.byId[t.id];
    if (!p) { bad.push(`tester: unknown ${t.id}`); continue; }
    if (!F.has(t.family)) bad.push(`tester ${t.id}: unknown family ${t.family}`);
    if (p.tier !== "designer") bad.push(`tester ${t.id}: tier ${p.tier}`);
    const d = p.stages.drydown || {};
    if (!((d[t.family] || 0) >= 0.8)) bad.push(`tester ${t.id}: ${t.family} at ${d[t.family] || 0} in the drydown`);
    for (const [f, w] of Object.entries(d)) if (f !== t.family && w >= 0.4) bad.push(`tester ${t.id}: ${f} at ${w} in the drydown`);
  }
  assert.deepEqual(bad, []);
});

test("QUIZ.more names distinct catalogue perfumes the grid lacks, each with a bottle photo, never a clone beside its original", () => {
  const W = loadSite("data", "bottles");
  const D = W.PP_DATA, byId = Object.fromEntries(D.PERFUMES.map(p => [p.id, p])), shown = D.QUIZ.grid.concat(D.QUIZ.more), bad = [];
  if (!D.QUIZ.more.length || new Set(D.QUIZ.more).size !== D.QUIZ.more.length) bad.push("QUIZ.more needs distinct ids");
  for (const id of D.QUIZ.more) {
    if (!byId[id]) { bad.push(`unknown ${id}`); continue; }
    if (D.QUIZ.grid.includes(id)) bad.push(`${id} is in the grid already`);
    if (!W.PP_BOTTLES[id]) bad.push(`${id} has no bottle photo`);
    if (byId[id].cloneOf && shown.includes(byId[id].cloneOf)) bad.push(`${id} is shown beside its original ${byId[id].cloneOf}`);
    for (const o of shown) if (byId[o] && byId[o].cloneOf === id) bad.push(`${id} is shown beside its clone ${o}`);
  }
  assert.deepEqual(bad, []);
});

test("the note picker: five screens of at most twenty cards, unique ids, every note maps to a family some perfume holds at 0.4 or more, and every such family has a card", () => {
  const W = loadSite("data", "mapper", "materials", "evidence", "engine");
  const D = W.PP_DATA, E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE);
  const held = f => E.PERFUMES.some(P => ["opening", "heart", "drydown"].some(s => ((P.stages[s] || {})[f] || 0) >= 0.4));
  const F = new Set(Object.keys(D.FAMILIES)), notes = D.QUIZ.notePicker.flatMap(s => s.notes), ids = notes.map(n => n.id), bad = [];
  if (D.QUIZ.notePicker.length !== 5) bad.push("the picker needs five screens");
  for (const s of D.QUIZ.notePicker) if (s.notes.length > 20) bad.push(`${s.id}: ${s.notes.length} cards, more than twenty`);
  if (new Set(ids).size !== ids.length) bad.push("duplicate ids: " + ids.filter((x, i) => ids.indexOf(x) !== i).join(", "));
  for (const n of notes) {
    if (!n.en || !n.ar) bad.push(`${n.id}: missing en or ar`);
    if (n.fams) {
      /* an entry's own families replace the mapper's: each must be known, weighted 0..1 and held by some perfume */
      for (const [f, w] of Object.entries(n.fams)) if (!F.has(f) || !(w > 0 && w <= 1) || !held(f)) bad.push(`${n.id}: own family ${f} at ${w}`);
      if (!Object.keys(n.fams).length) bad.push(`${n.id}: empty fams`);
      continue;
    }
    const fams = W.PP_MAP.famsForNote(n.en) || {};
    if (!Object.keys(fams).some(held)) bad.push(`${n.id}: "${n.en}" maps to ${JSON.stringify(fams)}, which no perfume holds at 0.4`);
  }
  for (const n of notes) if (!n.hint_en !== !n.hint_ar) bad.push(`${n.id}: a hint in one language only`);
  /* every family some perfume holds at 0.4 or more is reached by a card at 0.5 or more */
  const famsOf = n => n.fams || W.PP_MAP.famsForNote(n.en) || {};
  for (const f of F) if (held(f) && !notes.some(n => (famsOf(n)[f] || 0) >= 0.5)) bad.push(`${f}: no card gives it 0.5 or more`);
  for (const id of ["vetiver", "patchouli", "tonka", "iris", "ambergris", "oakmoss"]) {
    const n = notes.find(x => x.id === id);
    if (!n || !n.hint_en || !n.hint_ar) bad.push(`${id}: needs a hint in both languages`);
  }
  assert.deepEqual(bad, []);
});

test("QUIZ.taste names only known families, with weights from 0.3 to 0.8", () => {
  const D = loadSite("data").PP_DATA, F = new Set(Object.keys(D.FAMILIES)), bad = [];
  assert.deepEqual(Object.keys(D.QUIZ.taste).sort(), ["bitter", "sweet"]);
  for (const [side, fams] of Object.entries(D.QUIZ.taste)) for (const [f, w] of Object.entries(fams)) {
    if (!F.has(f)) bad.push(`${side}: unknown family ${f}`);
    if (!(w >= 0.3 && w <= 0.8)) bad.push(`${side} ${f}: weight ${w}`);
  }
  assert.deepEqual(bad, []);
});

test("no string in QUIZ uses any form of the verb for wearing clothes, or an em dash", () => {
  const strings = [];
  const walkValues = v => { if (typeof v === "string") strings.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walkValues); };
  walkValues(loadSite("data").PP_DATA.QUIZ);
  /* the root l-b-s with optional long vowels (لبس, يلبس, لابس, ملبوس), diacritics removed first */
  const wear = /ل[اآ]?ب[وي]?س/;
  assert.deepEqual(strings.filter(s => wear.test(s.replace(/[ً-ْـ]/g, "")) || s.includes(String.fromCharCode(0x2014))), []);
  assert.ok(strings.some(s => /[؀-ۿ]/.test(s)), "QUIZ holds Arabic strings to check");
});

test("site/js/bottles.js and site/img/bottles/ agree, and every entry is a catalogue perfume (run python tools/fetch_bottles.py)", () => {
  const W = loadSite("data", "bottles");
  const ids = new Set(W.PP_DATA.PERFUMES.map(p => p.id));
  const listed = Object.entries(W.PP_BOTTLES);
  const files = fs.readdirSync(path.join(SITE, "img", "bottles")).filter(f => f.endsWith(".webp"));
  for (const [id, src] of listed) {
    assert.ok(ids.has(id), `${id} is not in the catalogue`);
    assert.equal(src, `img/bottles/${id}.webp`);
    assert.ok(fs.existsSync(path.join(SITE, src)), `${src} is missing`);
  }
  assert.deepEqual(files.map(f => f.slice(0, -5)).sort(), listed.map(([id]) => id).sort(), "a file in img/bottles/ that bottles.js does not list");
});
