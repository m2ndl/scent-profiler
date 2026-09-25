#!/usr/bin/env node
/* Tagging queue: which perfumes people rated that are not yet verified, ordered by demand,
   with a ready-to-paste data.js stub for each auto-tagged one.

   Export two sheets from the Google Sheet as CSV (File > Download > CSV) and run:
     node tools/tag_queue.js ratings.csv catalogue.csv
   Output: a ranked list, then stubs. Paste a stub into data.js, correct the families by nose,
   set conf to 2 or 3, and keep the same id so existing ratings attach to it. */

const fs = require("fs");
const { loadSite } = require("./lib/site");
const w = loadSite("data", "mapper");
const verified = new Set(w.PP_DATA.PERFUMES.map(p => p.id));

function csv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (cell !== "" || row.length) { row.push(cell); rows.push(row); } row = []; cell = ""; if (c === "\r" && text[i + 1] === "\n") i++; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift();
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] === undefined ? "" : r[i]])));
}

const [ratingsFile, catalogueFile] = process.argv.slice(2);
if (!ratingsFile) { console.error("usage: node tools/tag_queue.js ratings.csv [catalogue.csv]"); process.exit(1); }
const ratings = csv(fs.readFileSync(ratingsFile, "utf8"));
const catalogue = catalogueFile ? csv(fs.readFileSync(catalogueFile, "utf8")) : [];
const byId = {};
for (const c of catalogue) byId[c.id] = c;

const demand = {};
const seen = new Set();
for (const r of ratings) {
  const key = r.device + "::" + r.perfume;
  if (seen.has(key)) continue; seen.add(key);
  if (verified.has(r.perfume)) continue;
  const d = demand[r.perfume] || (demand[r.perfume] = { id: r.perfume, name: r.name, n: 0, dry: [] });
  d.n++; if (r.drydown !== "") d.dry.push(Number(r.drydown));
}
const queue = Object.values(demand).sort((a, b) => b.n - a.n);
console.log(`\n${queue.length} unverified perfumes rated by ${seen.size} device-perfume pairs\n`);
for (const d of queue) {
  const c = byId[d.id];
  const avg = d.dry.length ? (d.dry.reduce((a, b) => a + b, 0) / d.dry.length).toFixed(2) : "–";
  console.log(`${String(d.n).padStart(4)}  ${d.id.padEnd(40)}  ${(d.name || "").padEnd(36)}  drydown avg ${avg}  ${c ? "auto-tagged" : "untagged"}`);
}
console.log("\n/* ---- stubs for auto-tagged entries (verify by nose before promoting) ---- */\n");
for (const d of queue) {
  const c = byId[d.id]; if (!c) continue;
  const split = s => String(s || "").split("|").map(x => x.trim()).filter(Boolean);
  const notes = { top: split(c.top), middle: split(c.middle), base: split(c.base) };
  const m = w.PP_MAP.mapNotes(notes, split(c.accords));
  const st = s => JSON.stringify(m.stages[s]).replace(/"/g, "").replace(/,/g, ", ").replace(/:/g, ":");
  const g = { men: "m", women: "f" }[String(c.gender).toLowerCase()] || "u";
  const text = [notes.top, notes.middle, notes.base].map(a => a.join(", ")).join(" / ");
  console.log(`    p("${d.id}","${c.brand}","${c.name}","","${g}","auto",2,\n      ${st("opening")}, ${st("heart")}, ${st("drydown")},\n      { en:"${text}", ar:"${text}" }),  /* rated by ${d.n}; unmatched notes: ${m.unmatched.join(", ") || "none"} */\n`);
}
