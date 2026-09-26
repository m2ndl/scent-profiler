/* Puts the generated entries (entries.txt, from gen.js) into site/js/data.js as the last block of the second list, and
   the Fragrantica page numbers (fids.json) into reference/images/fragrantica_ids.json for the bottle photos.
   Run again, it replaces the block it put there before (and drops the page numbers of entries no longer in it).
   node reference/expansion/apply.js */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const DATA = path.join(ROOT, "site", "js", "data.js"), FIDS = path.join(ROOT, "reference", "images", "fragrantica_ids.json");
const HEAD = "added 26 Sep 2026 (the expansion to 1,000)";
let src = fs.readFileSync(DATA, "utf8"), gone = [];
if (src.includes(HEAD)) {
  const start = src.lastIndexOf(",\n", src.indexOf("    /* " + HEAD)), stop = src.lastIndexOf("\n  ];\n\n  return { FAMILIES");
  gone = [...src.slice(start, stop).matchAll(/^    p\("([^"]+)"/gm)].map(m => m[1]);
  src = src.slice(0, start) + src.slice(stop);
}
const raw = fs.readFileSync(path.join(__dirname, "entries.txt"), "utf8"), entries = raw.replace(/\s+$/, "");
const n = (raw.match(/^    p\("/gm) || []).length;
const block =
`    /* ${HEAD}: ${n} perfumes the Saudi stores sell that the catalogue lacked (Golden Scent, Noon, Nice One, Faces,
       Sephora and Amazon.sa best-seller and popularity lists, read 25 and 26 Sep 2026), and the best-known perfumes of the
       Saudi houses, each with a full top, heart and base breakdown on Fragrantica. Tagged by mapper.js from the notes;
       reference/expansion/ holds the store lists, the matching, and record.json with each pyramid and its sources. */
${entries}`;
const END = "\n  ];\n\n  return { FAMILIES";
const at = src.lastIndexOf(END);
if (at < 0) { console.error("could not find the end of the second list"); process.exit(1); }
const out = src.slice(0, at) + ",\n" + block + src.slice(at);
fs.writeFileSync(DATA, out);
const fids = JSON.parse(fs.readFileSync(FIDS, "utf8")), add = JSON.parse(fs.readFileSync(path.join(__dirname, "fids.json"), "utf8"));
let k = 0, dropped = 0;
for (const id of gone) if (!add[id] && fids[id]) { delete fids[id]; dropped++; }
for (const [id, v] of Object.entries(add)) if (!fids[id] || fids[id].fid !== v.fid) { fids[id] = v; k++; }
if (gone.length) console.log(`replaced the earlier block of ${gone.length}; ${dropped} page numbers of entries no longer in it dropped`);
fs.writeFileSync(FIDS, JSON.stringify(Object.fromEntries(Object.entries(fids).sort()), null, 1) + "\n");
console.log(`${n} entries added to data.js; ${k} page numbers added to fragrantica_ids.json`);
