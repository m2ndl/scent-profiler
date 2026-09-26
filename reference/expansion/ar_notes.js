/* Arabic for note words, learned from the catalogue itself: each entry's English and Arabic note lists are aligned
   stage by stage and word by word where both have the same number of notes; a word given two Arabic forms keeps the
   commoner. Adds the 26 Sep additions' extra words (decisions.js AR_EXTRA). Writes ar_notes.json.
   node reference/expansion/ar_notes.js */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const { loadSite } = require(path.join(ROOT, "tools", "lib", "site"));
const W = loadSite("data");
const low = s => s.toLowerCase().trim();
const votes = {};
let aligned = 0, skipped = 0;
for (const p of W.PP_DATA.PERFUMES) {
  if (!p.notes || !p.notes.en || !p.notes.ar) continue;
  const en = p.notes.en.split(" / "), ar = p.notes.ar.split(" / ");
  if (en.length !== ar.length) { skipped++; continue; }
  en.forEach((st, i) => {
    const e = st.split(/,\s*/).map(low).filter(Boolean), a = ar[i].split(/،\s*/).map(s => s.trim()).filter(Boolean);
    if (e.length !== a.length) { skipped++; return; }
    e.forEach((w, j) => { (votes[w] = votes[w] || {})[a[j]] = (votes[w][a[j]] || 0) + 1; });
    aligned++;
  });
}
const out = {};
for (const [w, v] of Object.entries(votes)) out[w] = Object.entries(v).sort((x, y) => y[1] - x[1])[0][0];
const extra = require(path.join(ROOT, "reference", "quiz", "popularity", "additions", "decisions.js")).AR_EXTRA || {};
for (const [w, a] of Object.entries(extra)) if (!out[w]) out[w] = a;
fs.writeFileSync(path.join(__dirname, "ar_notes.json"), JSON.stringify(out, null, 1));
const conflicts = Object.entries(votes).filter(([, v]) => Object.keys(v).length > 1);
console.log(Object.keys(out).length, "words;", aligned, "stages aligned,", skipped, "skipped;", conflicts.length, "words with two Arabic forms");
for (const [w, v] of conflicts.slice(0, 15)) console.log("  ", w, JSON.stringify(v));
