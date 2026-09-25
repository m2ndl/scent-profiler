/* Maps each researched pyramid to stage weights with the site's own mapper, for review before the entries are written.
   node tag.js [ids...]   prints stages, unmatched notes and the Arabic note words still missing */
const fs = require("fs"), path = require("path");
const ROOT = "C:/Users/malha/Desktop/Webapps/perfume-profiler";
const { loadSite } = require(ROOT + "/tools/lib/site");
const W = loadSite("data", "mapper");
const M = W.PP_MAP;
const AR = JSON.parse(fs.readFileSync(path.join(__dirname, "ar_notes.json"), "utf8"));
const research = [];
for (const f of ["research_1.json", "research_2.json", "research_3.json", "research_4.json"]) {
  const p = path.join(__dirname, f); if (fs.existsSync(p)) research.push(...JSON.parse(fs.readFileSync(p, "utf8")));
}
const DEC = fs.existsSync(path.join(__dirname, "decisions.js")) ? require("./decisions.js") : {};
const only = process.argv.slice(2);
const low = s => s.toLowerCase().trim();
const rows = [];
for (const r of research) {
  if (DEC[r.id] && DEC[r.id].set) {}
  if (only.length && !only.includes(r.id)) continue;
  const d = DEC[r.id] || {};
  if (d.skip) { console.log(`\n## ${r.id}: skipped (${d.skip})`); continue; }
  const top = d.top || r.top || [], middle = d.middle || r.middle || [], base = d.base || r.base || [];
  const accords = d.accords || r.accords || [];
  /* notes only, as the last additions were: the accord floor puts citrus and florals into the drydown */
  /* note names the mapper does not read, or reads wrongly, mapped to the word it knows; the published names stay for display */
  const ALIAS = { "vanille": "vanilla", "citruses": "citrus", "bellini": "peach", "persimmon": "peach", "cactus": "green notes",
    "red currant leaf": "blackcurrant leaf", "passion flower": "white flowers", "african orange flower": "orange blossom",
    "maninka": "peach", "brazilian redwood": "cedar", "ambrette (musk mallow)": "ambrette", "cardamon": "cardamom", "rooibos tea": "tea" };
  const al = l => l.map(n => ALIAS[low(n)] || n);
  const m = M.mapNotes({ top: al(top), middle: al(middle), base: al(base) }, d.useAccords ? accords : []);
  const missingAr = [...top, ...middle, ...base].map(low).filter(w => !AR[w] && !(DEC.AR_EXTRA || {})[w]);
  const accUnknown = accords.filter(a => !M.ACCORDS[M.norm(a)]);
  console.log(`\n## ${r.id}: ${r.house} ${r.name} (${r.year}, ${r.concentration}, ${r.gender}) [${r.confidence}]`);
  console.log(`   ${top.join(", ")} / ${middle.join(", ")} / ${base.join(", ")}`);
  console.log(`   accords: ${accords.join(", ")}${accUnknown.length ? "  (unknown to mapper: " + accUnknown.join(", ") + ")" : ""}`);
  for (const s of ["opening", "heart", "drydown"]) console.log(`   ${s.padEnd(8)} ${JSON.stringify(m.stages[s])}`);
  if (m.unmatched.length) console.log(`   unmatched notes: ${m.unmatched.join(", ")}`);
  if (missingAr.length) console.log(`   no Arabic yet: ${[...new Set(missingAr)].join(", ")}`);
  rows.push({ id: r.id, stages: m.stages });
}
fs.writeFileSync(path.join(__dirname, "mapped.json"), JSON.stringify(rows, null, 1));
