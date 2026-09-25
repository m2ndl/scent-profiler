/* Writes the catalogue entries (p(...) lines for site/js/data.js) from the research files, decisions.js and the mapper,
   plus additions.json (the record: pyramid, sources and the reason for any override) and fids.json (Fragrantica page
   numbers for the bottle photos). node gen.js */
const fs = require("fs"), path = require("path");
const ROOT = "C:/Users/malha/Desktop/Webapps/perfume-profiler";
const { loadSite } = require(ROOT + "/tools/lib/site");
const W = loadSite("data", "mapper");
const M = W.PP_MAP, EXIST = new Set(W.PP_DATA.PERFUMES.map(p => p.id));
const DEC = require("./decisions.js");
const AR = Object.assign({}, JSON.parse(fs.readFileSync(path.join(__dirname, "ar_notes.json"), "utf8")), DEC.AR_EXTRA || {});
const research = [];
for (const f of ["research_1.json", "research_2.json", "research_3.json", "research_4.json"]) {
  const p = path.join(__dirname, f); if (fs.existsSync(p)) research.push(...JSON.parse(fs.readFileSync(p, "utf8")));
}
const low = s => s.toLowerCase().trim();
/* note names the mapper does not read, or reads wrongly (as in tag.js) */
const MAPALIAS = { "vanille": "vanilla", "citruses": "citrus", "bellini": "peach", "persimmon": "peach", "cactus": "green notes",
  "red currant leaf": "blackcurrant leaf", "passion flower": "white flowers", "african orange flower": "orange blossom",
  "maninka": "peach", "brazilian redwood": "cedar", "ambrette (musk mallow)": "ambrette", "cardamon": "cardamom", "rooibos tea": "tea" };
/* display spellings: French or plural forms shown in plain English */
const SHOW = { "vanille": "vanilla", "citruses": "citrus", "ambrette (musk mallow)": "ambrette", "cardamon": "cardamom", "agarwood (oud)": "oud (agarwood)", "oak moss": "oakmoss" };
const PROPER = ["Sicilian", "Calabrian", "Bulgarian", "African", "Madagascar", "Tahitian", "Brazilian", "Chinese", "Casablanca",
  "Virginia", "Damask", "Turkish", "Egyptian", "Indian", "Haitian", "Atlas", "Iso E Super", "Cashmeran", "Calone", "Ambroxan", "Taif", "Cambodian", "Laotian", "Mysore"];
const show = n => { let s = SHOW[low(n)] || low(n); for (const w of PROPER) s = s.replace(new RegExp("\\b" + w.toLowerCase() + "\\b", "g"), w); return s; };
const r2 = x => Math.round(x * 100) / 100;
const lines = [], record = {}, fids = {}, problems = [];
const ORDER = ["m", "f", "u"];
const chosen = research.filter(r => DEC[r.id] && !DEC[r.id].skip);
chosen.sort((a, b) => ORDER.indexOf(DEC[a.id].gender) - ORDER.indexOf(DEC[b.id].gender) || DEC[a.id].tier.localeCompare(DEC[b.id].tier));
for (const r of chosen) {
  const d = DEC[r.id], id = d.id || r.id;
  if (EXIST.has(id)) { problems.push(id + ": id already in the catalogue"); continue; }
  const top = d.top || r.top || [], middle = d.middle || r.middle || [], base = d.base || r.base || [];
  if (!top.length || !middle.length || !base.length) { problems.push(id + ": a stage has no notes"); continue; }
  const al = l => l.map(n => MAPALIAS[low(n)] || n);
  const st = M.mapNotes({ top: al(top), middle: al(middle), base: al(base) }, []).stages;
  for (const [k, v] of Object.entries(d.set || {})) st[k] = v;
  const S = s => "{ " + Object.entries(st[s]).sort((a, b) => b[1] - a[1]).map(([f, w]) => `${f}:${String(r2(w)).replace(/^0\./, ".")}`).join(", ") + " }";
  const en = [top, middle, base].map(l => l.map(show).join(", ")).join(" / ");
  const arParts = [top, middle, base].map(l => l.map(n => { const a = AR[low(n)] || AR[SHOW[low(n)]]; if (!a) problems.push(`${id}: no Arabic for "${n}"`); return a || n; }).join("، "));
  const ar = arParts.join(" / ");
  const esc = s => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines.push(`    p("${id}","${esc(d.house)}","${esc(d.name)}","${d.ar}","${d.gender}","${d.tier}",2,\n      ${S("opening")},\n      ${S("heart")},\n      ${S("drydown")},\n      { en:"${esc(en)}", ar:"${esc(ar)}" })`);
  const url = d.url || r.fragrantica_url;
  const fid = d.fid || (url && +(/-(\d+)\.html/.exec(url) || [])[1]);
  if (fid) fids[id] = { url, fid, note: `${r.year || ""} ${d.why ? "(" + d.why + ")" : ""}`.trim() };
  record[id] = { house: d.house, name: d.name, year: r.year, concentration: r.concentration, top, middle, base,
    source: d.why ? d.why : "Fragrantica pyramid", set_by_hand: d.set || null, fragrantica_url: url, sources: r.sources, research_note: r.notes };
}
fs.writeFileSync(path.join(__dirname, "entries.js.txt"), lines.join(",\n"));
fs.writeFileSync(path.join(__dirname, "additions.json"), JSON.stringify(record, null, 1));
fs.writeFileSync(path.join(__dirname, "fids.json"), JSON.stringify(fids, null, 1));
console.log(lines.length, "entries;", problems.length, "problems");
for (const p of problems) console.log("  " + p);
