/* Writes the catalogue entries for the chosen perfumes (chosen.json) with the site's own mapper, as the 26 Sep 2026
   additions were written: stage weights from the notes only (no accords), note words the mapper misreads given an
   alias, Arabic note words from ar_notes.json plus decisions.json, the perfume's Arabic name, house, sex and tier.
   node gen.js report   prints what still needs a decision (unmatched notes, empty stages, missing Arabic) and writes nothing
   node gen.js          writes entries.txt (p(...) lines), record.json (pyramid, source, votes and stores per entry) and
                        fids.json (Fragrantica page numbers for the bottle photos) */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const { loadSite } = require(path.join(ROOT, "tools", "lib", "site"));
const W = loadSite("data", "mapper");
/* the catalogue without this expansion's own block (when an earlier run's block is already in data.js, it is replaced) */
const HEAD = "added 26 Sep 2026 (the expansion to 1,000)";
const DSRC = fs.readFileSync(path.join(ROOT, "site", "js", "data.js"), "utf8");
const BLOCK = new Set(DSRC.includes(HEAD) ? [...DSRC.slice(DSRC.indexOf(HEAD)).matchAll(/^    p\("([^"]+)"/gm)].map(m => m[1]) : []);
const M = W.PP_MAP, EXIST = new Map(W.PP_DATA.PERFUMES.filter(p => !BLOCK.has(p.id)).map(p => [p.id, p]));
const REPORT = process.argv[2] === "report";
const J = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf8"));
const chosen = J("chosen.json");
const DEC = fs.existsSync(path.join(__dirname, "decisions.json")) ? J("decisions.json") : {};
const designers = J("fragrantica_designers.json");
const AR = Object.assign({}, J("ar_notes.json"), fs.existsSync(path.join(__dirname, "ar_notes_new.json")) ? J("ar_notes_new.json") : {},
  DEC.ar_notes || {});
const AR_NAMES = Object.assign({}, ...fs.readdirSync(__dirname).filter(f => /^ar_names_\d+\.json$/.test(f)).map(J));
const low = s => s.toLowerCase().trim();
const fold = s => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/* note names the mapper does not read, or reads wrongly, mapped to a word it knows (display keeps the published name) */
const MAPALIAS = Object.assign({ "vanille": "vanilla", "citruses": "citrus", "bellini": "peach", "persimmon": "peach", "cactus": "green notes",
  "red currant leaf": "blackcurrant leaf", "passion flower": "white flowers", "african orange flower": "orange blossom",
  "maninka": "peach", "brazilian redwood": "cedar", "ambrette (musk mallow)": "ambrette", "cardamon": "cardamom", "rooibos tea": "tea" },
  DEC.mapalias || {});
const SHOW = Object.assign({ "vanille": "vanilla", "citruses": "citrus", "ambrette (musk mallow)": "ambrette", "cardamon": "cardamom",
  "agarwood (oud)": "oud (agarwood)", "oak moss": "oakmoss", "lily-of-the-valley": "lily of the valley" }, DEC.show || {});
const PROPER = ["Sicilian", "Calabrian", "Bulgarian", "African", "Madagascar", "Tahitian", "Brazilian", "Chinese", "Casablanca", "Virginia",
  "Damask", "Turkish", "Egyptian", "Indian", "Haitian", "Atlas", "Iso E Super", "Cashmeran", "Calone", "Ambroxan", "Taif", "Cambodian",
  "Laotian", "Mysore", "Italian", "Florentine", "Tunisian", "Moroccan", "Mexican", "Sri Lankan", "Guatemalan", "Australian", "Java",
  "Madagascan", "Tonkin", "Bourbon", "Georgywood", "Akigalawood", "Sichuan", "Himalayan", "Russian", "Grasse", "Provence", "Jamaican"];
const show = n => { let s = SHOW[low(n)] || low(n); for (const w of PROPER) s = s.replace(new RegExp("\\b" + w.toLowerCase() + "\\b", "g"), w); return s; };
const r2 = x => Math.round(x * 100) / 100;

/* houses: the catalogue's own spelling where the house is already in it, else Fragrantica's less "Perfumes" */
const HOUSE = Object.assign({ "Maison-Martin-Margiela": "Maison Margiela", "Initio-Parfums-Prives": "Initio", "Alfred-Dunhill": "Dunhill",
  "Etienne-Aigner": "Aigner", "Ibraheem-AlQurashi": "Ibraheem Al Qurashi", "Paco-Rabanne": "Rabanne", "Dolce-Gabbana": "Dolce&Gabbana",
  "Viktor-Rolf": "Viktor&Rolf", "ALREHAB-PERFUMES": "Al Rehab", "DKHOUN": "Dkhoun", "Deraah-Private": "Deraah", "Hermes": "Hermès",
  "Lancome": "Lancôme", "Chloe": "Chloé", "Lattafa-Perfumes": "Lattafa", "Al-Haramain-Perfumes": "Al Haramain", "By-Kilian": "By Kilian",
  "Rosendo-Mateu-Olfactive-Expressions": "Rosendo Mateu", "Roja-Dove": "Roja Parfums", "Montblanc": "Montblanc", "Mugler": "Mugler",
  "Aldakheel-Oud": "Aldakheel Oud", "Alezz-Oud": "Al Ezz Oud", "Surrati-Perfumes": "Surrati", "Reef-Perfumes": "Reef" }, DEC.houses || {});
const houseOf = page => HOUSE[page] || (designers[`/designers/${page}.html`] || page.replace(/-/g, " ")).replace(/\s+(Perfumes?|Parfums?)$/i, "");
const TIER_OF_HOUSE = {};
for (const p of EXIST.values()) (TIER_OF_HOUSE[p.house] = TIER_OF_HOUSE[p.house] || {})[p.tier] = ((TIER_OF_HOUSE[p.house] || {})[p.tier] || 0) + 1;
const ARAB = new Set(["Lattafa", "Afnan", "Armaf", "Rasasi", "Ajmal", "Arabian Oud", "Swiss Arabian", "Al Haramain", "Maison Alhambra",
  "French Avenue", "Fragrance World", "Ard Al Zaafaran", "Al Rehab", "Abdul Samad Al Qurashi", "Ibraheem Al Qurashi", "Al Majed Oud",
  "Aldakheel Oud", "Reef", "Dkhoun", "Deraah", "Anfasic", "Laverne", "Surrati", "Al Ezz Oud", "Almas", "Nasamat", "Ahmed Al Maghribi",
  "Hind Al Oud", "Nabeel", "Oud Elite", "Khaltat", "My Perfumes", "Arabiyat Prestige", "Rayhaan", "Zimaya", "Paris Corner", "Emir",
  "Khadlaj", "Asdaaf", "Bharara", "Aroub", "Gulf Orchid", "Al Wataniah", "Ghawali", "Junaid Perfumes", "Atyab Al Marshoud", "Anfas",
  "Osma", "Sapil"]);
const NICHE = new Set(["Creed", "Parfums de Marly", "Xerjoff", "Maison Francis Kurkdjian", "Nishane", "Initio", "Amouage", "By Kilian",
  "Roja Parfums", "Mancera", "Montale", "Byredo", "Le Labo", "Diptyque", "Memo Paris", "Ormonde Jayne", "Clive Christian", "Penhaligon's",
  "BDK Parfums", "Orto Parisi", "Nasomatto", "Matiere Premiere", "Maison Crivelli", "Frederic Malle", "Serge Lutens", "Tiziana Terenzi",
  "Kajal", "Marc-Antoine Barrois", "Louis Vuitton", "Maison Margiela", "Jo Malone London", "Jo Malone", "Juliette Has a Gun",
  "Escentric Molecules", "Ex Nihilo", "Sospiro", "Boadicea the Victorious", "Electimuss", "Bond No. 9", "Atelier Cologne", "Acqua di Parma",
  "Van Cleef & Arpels", "The Merchant of Venice", "Lorenzo Villoresi", "Houbigant", "Caron", "Parfums MDCI", "Vilhelm Parfumerie",
  "Fragrance Du Bois", "Thameen", "Carner Barcelona", "Zoologist", "Maison Tahité", "Alexandre.J", "Stephane Humbert Lucas 777",
  "Rosendo Mateu", "Ramón Monegal", "L'Auditoire", "Floraïku", "Goldfield & Banks Australia", "Profumum Roma", "Etat Libre d'Orange",
  "Atelier des Ors", "Ramón Béjar", "Nicolai Parfumeur Createur", "The Woods Collection", "Fragrance One"]);
/* houses sold as both: their private lines are niche, the rest designer */
const PRIVATE = { "Giorgio Armani": /armani prive/i, "Chanel":/coromandel|sycomore|boy|bois des iles|beige|jersey|misia|cuir de russie|31 rue cambon|1957|gardenia|no 22|le lion|paris - |paris-/i,
  "Dior": /collection privee|gris dior|oud ispahan|ambre nuit|bois d.argent|sakura|oud rosewood|jasmin des anges|vanilla diorama|tobacolor|spice blend|rouge trafalgar|lucky|eden-roc|souffle|la colle noire|cuir cannage|belle de jour|mitzah/i,
  "Guerlain": /l.art (et|&) la mati|absolus allegoria|cuir intense|santal royal|oud essentiel|tonka imp|spiritueux|rose barbare|musc noble|bois mysterieux|angelique noire|patchouli ardent|rose cherie|lys soleia/i,
  "Tom Ford": /oud wood|tobacco vanille|lost cherry|bitter peach|tuscan leather|fucking fabulous|neroli portofino|soleil|oud minerale|ebene fume|cafe rose|rose prick|tobacco oud|vanilla sex|oud fleur|noir de noir|white suede|jasmin rouge|velvet orchid le|rose de chine|arabian wood|amber absolute|santal blush|grey vetiver|costa azzurra|mandarino|fleur de portofino|electric cherry|cherry smoke|bois pacifique|oud voyager|myrrhe mystere|beau de jour/i };
const tierOf = (house, name) => {
  if (PRIVATE[house]) return PRIVATE[house].test(fold(name)) ? "niche" : "designer";
  if (ARAB.has(house)) return "arab";
  if (NICHE.has(house)) return "niche";
  const t = TIER_OF_HOUSE[house];
  if (t) return Object.entries(t).sort((a, b) => b[1] - a[1])[0][0];
  return "designer";
};

const nameOf = c => {
  const d = designers[`/designers/${c.designer}.html`] || "";
  const t = c.ftitle.trim();
  let n = (d && t.toLowerCase().startsWith(d.toLowerCase() + " ") ? t.slice(d.length + 1) : t).trim();
  /* the house again at the head of the name ("Gucci Guilty Eau de Parfum", "Rabanne Invictus Victory") is dropped, as the
     older entries write them ("Guilty", "Invictus"), unless what is left begins with a word that needs the house
     ("Dior Homme Parfum", "Versace Pour Femme Dylan Blue") */
  for (const p of [houseOf(c.designer), d, "Emporio Armani", "Paco Rabanne", "Rabanne", "Christian Dior"]) {
    const hw = fold(p || "").split(" ").filter(Boolean), w = n.split(/\s+/);
    if (!hw.length || w.length <= hw.length || fold(w.slice(0, hw.length).join(" ")) !== hw.join(" ")) continue;
    const rest = w.slice(hw.length).join(" ");
    /* nor when the name left would open on a common word ("Jaguar Classic", "Dunhill Edition", "Dior Addict") */
    if (!/^(pour|for|eau|le|la|l'|l’|homme|femme|man|men|woman|women|intense|parfum|edp|edt|\d)/i.test(rest) &&
        !/^(classic|edition|sport|platinum|black|blue|gold|red|white|silver|signature|original|icon|custom|addict|club|essential|touch|body|london|weekend|brit)\b/i.test(rest) &&
        !/^(&|\S{1,2}$|uomo$|donna$)/i.test(rest)) n = rest;          /* "Costume National J", "Tiffany & Love", "Valentino Uomo" */
  }
  /* a name Fragrantica prints in capitals ("PRIME MAX") is written as the catalogue writes names */
  return /[a-z]/.test(n) || n.replace(/[^A-Z]/g, "").length < 5 ? n : n.toLowerCase().replace(/\b[a-z]/g, x => x.toUpperCase());
};
/* ids already given in an earlier run stay (the bottle photos are saved under them) */
const PREV = fs.existsSync(path.join(__dirname, "record.json"))
  ? Object.fromEntries(Object.entries(J("record.json")).filter(([k]) => !k.startsWith("_")).map(([id, r]) => [r.fid, id])) : {};
const CACHED = fid => { const f = fs.readdirSync(path.join(__dirname, "cache", "perfumes")).find(x => x.endsWith(`_${fid}.html.json`) || x.endsWith(`_${fid}.json`));
  return f ? JSON.parse(fs.readFileSync(path.join(__dirname, "cache", "perfumes", f), "utf8")) : null; };
const used = new Set(EXIST.keys());
const idFor = (house, name, want) => {
  if (want) return want;
  let base = fold(name).replace(/\b(eau de parfum|eau de toilette|for (men|women)|pour (homme|femme))\b/g, m => m.split(" ").map(w => w[0]).join("")).replace(/ /g, "");
  if (base.length < 5 || /^\d/.test(base) || used.has(base)) base = fold(house).split(" ").map(w => w.slice(0, 4)).join("") + base;
  let id = base.slice(0, 28), k = 2;
  while (used.has(id)) id = base.slice(0, 26) + k++;
  used.add(id);
  return id;
};

for (const id of Object.values(PREV)) used.add(id);
const lines = [], record = {}, fids = {}, problems = [], unmatched = {}, missingAr = {}, empty = [];
const ORDER = { m: 0, f: 1, u: 2 };
const rows = [];
const DUPES = fs.existsSync(path.join(__dirname, "dupes.json")) ? J("dupes.json") : {};
for (let c of chosen) {
  const d = Object.assign({}, (DEC.perfumes || {})[c.fid] || {});
  if (!d.ar && AR_NAMES[c.fid]) d.ar = AR_NAMES[c.fid];            /* before a re-point, while c.fid is the named page */
  /* a store listing matched to an older version of the bottle on sale is moved to the current version's page */
  if (d.repoint) {
    const pg = CACHED(d.repoint.fid);
    if (!pg) { problems.push(`${c.fid}: re-point page ${d.repoint.fid} not read yet`); continue; }
    c = Object.assign({}, c, { fid: d.repoint.fid, url: d.repoint.url, ftitle: d.repoint.title || c.ftitle, page: pg, repointed_from: c.fid, prev_id: PREV[c.fid] });
  }
  /* dupe_check.py's catalogue matches are held back unless read as a separate perfume (decisions.json) */
  if (d.skip || (DUPES[c.fid] && !(DEC.keep_despite_catalogue_match || {})[c.fid])) continue;
  const pg = c.page, house = houseOf(c.designer), name = d.name || nameOf(c);
  const gender = d.gender || pg.gender || "u";
  const tier = d.tier || tierOf(house, name);
  const tm = l => l.map(n => n.replace(/[™®]/g, "").trim());           /* "Ambrofix™" is ambrofix */
  const top = tm(d.top || pg.top), middle = tm(d.middle || pg.middle), base = tm(d.base || pg.base);
  const al = l => l.map(n => MAPALIAS[low(n)] || n);
  const m = M.mapNotes({ top: al(top), middle: al(middle), base: al(base) }, []);
  for (const u of m.unmatched) (unmatched[low(u)] = unmatched[low(u)] || []).push(c.fid);
  const st = m.stages;
  for (const [k, v] of Object.entries(d.set || {})) st[k] = v;
  const hollow = ["opening", "heart", "drydown"].filter(s => !Object.keys(st[s]).length);
  if (hollow.length) { empty.push(`${c.fid} ${house} ${name}: empty ${hollow.join(", ")} (${[top, middle, base].map(l => l.join(", ")).join(" / ")})`); continue; }
  const arParts = [top, middle, base].map(l => l.map(n => { const a = AR[low(n)] || AR[show(n)] || AR[low(SHOW[low(n)] || "")]; if (!a) (missingAr[low(n)] = missingAr[low(n)] || []).push(c.fid); return a || n; }).join("، "));
  rows.push({ c, d, house, name, gender, tier, top, middle, base, st, ar: arParts.join(" / ") });
}
if (REPORT) {
  const byN = o => Object.entries(o).sort((a, b) => b[1].length - a[1].length);
  console.log(`${rows.length} entries ready, ${empty.length} with an empty stage`);
  console.log("\nunmatched notes (count):"); for (const [n, l] of byN(unmatched)) console.log(`  ${l.length}  ${n}`);
  console.log("\nno Arabic yet (count):"); for (const [n, l] of byN(missingAr)) console.log(`  ${l.length}  ${n}`);
  console.log("\nempty stages:"); for (const e of empty) console.log("  " + e);
  /* two entries a visitor would read as the same bottle: an Arabic name already in the catalogue or given twice */
  const arSeen = new Map([...EXIST.values()].map(p => [p.ar, "catalogue " + p.id]));
  console.log("\nArabic names met twice:");
  for (const r of rows) if (r.d.ar) { if (arSeen.has(r.d.ar)) console.log(`  ${r.c.fid} ${r.house} ${r.name}: ${r.d.ar} = ${arSeen.get(r.d.ar)}`); else arSeen.set(r.d.ar, `${r.c.fid} ${r.house} ${r.name}`); }
  const noAr = rows.filter(r => !r.d.ar).length;
  console.log(`\n${noAr} entries without an Arabic name; tiers:`, rows.reduce((o, r) => (o[r.tier] = (o[r.tier] || 0) + 1, o), {}));
  process.exit(0);
}
/* the owner asked for about 1,000: the lowest-ranked candidates beyond that are left out (listed in record.json) */
const ROOM = 1000 - EXIST.size;
/* the Saudi houses were the owner's own request, so the cap falls on store-only candidates first */
rows.sort((a, b) => (b.c.origin === "saudi house") - (a.c.origin === "saudi house") || b.c.score - a.c.score);
const cut = rows.splice(Math.max(0, ROOM));
rows.sort((a, b) => (a.tier === b.tier ? 0 : a.tier < b.tier ? -1 : 1) || ORDER[a.gender] - ORDER[b.gender] || b.c.score - a.c.score);
const esc = s => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
for (const r of rows) {
  const { c, d, house, name, gender, tier, top, middle, base, st } = r;
  if (!d.ar) { problems.push(`${c.fid} ${house} ${name}: no Arabic name`); continue; }
  const id = d.id || c.prev_id || PREV[c.fid] || idFor(house, name);
  const S = s => "{ " + Object.entries(st[s]).sort((a, b) => b[1] - a[1]).map(([f, w]) => `${f}:${String(r2(w)).replace(/^0\./, ".")}`).join(", ") + " }";
  const en = [top, middle, base].map(l => l.map(show).join(", ")).join(" / ");
  lines.push(`    p("${id}","${esc(house)}","${esc(name)}","${esc(d.ar)}","${gender}","${tier}",2,\n      ${S("opening")},\n      ${S("heart")},\n      ${S("drydown")},\n      { en:"${esc(en)}", ar:"${esc(r.ar)}" })`);
  fids[id] = { url: c.url, fid: c.fid, note: `${c.page.year || ""}`.trim() };
  record[id] = { house, name, fid: c.fid, url: c.url, year: c.page.year, fragrantica_title: c.page.title, votes: c.page.votes,
    top, middle, base, set_by_hand: d.set || null, source: d.why || "Fragrantica pyramid", stores: c.stores, origin: c.origin,
    repointed_from: c.repointed_from || null,
    /* store rows read as another perfume are dropped from the record (decisions.json drop_rows) */
    store_rows: (c.rows || []).filter(x => !(d.drop_rows || []).some(s => x.text.includes(s))) };
}
fs.writeFileSync(path.join(__dirname, "entries.txt"), lines.join(",\n"));
record._left_out_for_the_1000_cap = cut.map(r => ({ fid: r.c.fid, house: r.house, name: r.name, score: r.c.score }));
fs.writeFileSync(path.join(__dirname, "record.json"), JSON.stringify(record, null, 1));
fs.writeFileSync(path.join(__dirname, "fids.json"), JSON.stringify(fids, null, 1));
console.log(lines.length, "entries;", problems.length, "problems;", empty.length, "left out with an empty stage");
for (const p of problems.slice(0, 30)) console.log("  " + p);
