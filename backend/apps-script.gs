/* Google Apps Script backend for the profiler.
   Stores anonymous ratings, tag corrections, pasted ingredient labels and derived family weights
   for perfumes people looked up. No accounts, no personal data.

   Deploy (about five minutes):
   1. Create a blank Google Sheet. Copy its id from the URL (the long string between /d/ and /edit).
   2. Extensions > Apps Script. Replace the default code with this file. Set SHEET_ID below.
   3. Optional, for on-demand lookups: Project Settings > Script Properties > add
      FRAGELLA_KEY = your key from https://api.fragella.com (free tier is 20 requests a month,
      Basic is 5,000 for about $12 a month). Without the key, unknown perfumes stay untagged.
   4. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy.
   5. Copy the web-app URL into endpoint in site/js/config.js.
   Re-deploying after edits: Deploy > Manage deployments > edit > new version.

   Vendor terms: Fragella forbids caching large parts of its data. A lookup therefore returns the
   vendor's note list to the requesting page only and stores nothing; the page reduces it to our
   own family weights and posts those back (type "tagcache"), and that is all the catalogue sheet
   holds: identity, image, vendor id, derived weights. */

const SHEET_ID = "PASTE_YOUR_SHEET_ID";
const RATING_HEADERS = ["ts", "device", "lang", "perfume", "name", "opening", "heart", "drydown", "again", "chips_opening", "chips_heart", "chips_drydown", "src", "noteAnswers", "unnoticed"];
const CORRECTION_HEADERS = ["ts", "device", "lang", "family", "perfume", "perfumes"];
const CATALOGUE_HEADERS = ["ts", "id", "name", "brand", "gender", "oil_type", "image", "vendor_id", "stages_json", "source", "verified"];
const LABEL_HEADERS = ["ts", "device", "lang", "perfume", "name", "market", "date", "format", "text"];
const EVENT_HEADERS = ["ts", "device", "lang", "name", "n"];
const FRAGELLA_BASE = "https://api.fragella.com/api/v1";

function sheet_(name, headers) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); return sh; }
  /* a sheet made before a column was added gets the missing header cells in row 1 */
  const have = sh.getLastColumn();
  if (have < headers.length) sh.getRange(1, have + 1, 1, headers.length - have).setValues([headers.slice(have)]);
  return sh;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
const clip_ = (s, n) => String(s == null ? "" : s).slice(0, n || 200);
const num_ = v => (v === null || v === undefined || v === "" ? "" : Number(v));
const slug_ = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "bad json" }); }
  const ts = body.ts || new Date().toISOString();
  if (body.type === "lookup") return json_(lookup_(body.q));
  if (body.type === "tagcache") return json_(tagcache_(body));
  if (body.type === "label") {
    sheet_("labels", LABEL_HEADERS).appendRow([ts, clip_(body.device), clip_(body.lang), clip_(body.perfume), clip_(body.name), clip_(body.market, 20), clip_(body.date, 20), clip_(body.format, 20), clip_(body.text, 4000)]);
    return json_({ ok: true });
  }
  if (body.type === "event") {
    sheet_("events", EVENT_HEADERS).appendRow([ts, clip_(body.device), clip_(body.lang), clip_(body.name), num_(body.n)]);
    return json_({ ok: true });
  }
  if (body.type === "correction") {
    sheet_("corrections", CORRECTION_HEADERS).appendRow([ts, clip_(body.device), clip_(body.lang), clip_(body.family), clip_(body.perfume), clip_(body.perfumes, 2000)]);
    return json_({ ok: true });
  }
  const chips = body.chips || {};
  sheet_("ratings", RATING_HEADERS).appendRow([
    ts, clip_(body.device), clip_(body.lang), clip_(body.perfume), clip_(body.name),
    num_(body.opening), num_(body.heart), num_(body.drydown), num_(body.again),
    clip_((chips.opening || []).join("|")), clip_((chips.heart || []).join("|")), clip_((chips.drydown || []).join("|")),
    clip_(body.src, 20),
    clip_(JSON.stringify(body.noteAnswers || {}), 500), clip_((Array.isArray(body.unnoticed) ? body.unnoticed : []).join("|"))
  ]);
  return json_({ ok: true });
}

/* GET ?stats=1      -> { perfumes: { <id>: { n, o, h, d } }, quiz: { n, palates, breakers } }, cached 5 min. perfumes: the
                        last row per device+perfume unless it is a quiz verdict. quiz: each device's last finished result.
   GET ?catalogue=1  -> { entries: [ {id, name, brand, gender, oilType, image, vendorId, stages, source} ] }, cached 5 min. */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.catalogue) return catalogue_();
  if (p.stats) return stats_();
  return json_({ ok: true, hint: "append ?stats=1 or ?catalogue=1" });
}

function stats_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get("stats");
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  const data = sheet_("ratings", RATING_HEADERS).getDataRange().getValues();
  const srcCol = data.length ? data[0].indexOf("src") : -1;   /* found by name, so older sheets still work */
  const rows = data.slice(1);
  const last = {};
  rows.forEach(r => { last[r[1] + "::" + r[3]] = r; });
  const agg = {};
  Object.values(last).forEach(r => {
    const id = r[3]; if (!id) return;
    if (srcCol >= 0 && r[srcCol] === "quiz") return;             /* quiz verdicts stay out of community averages */
    const a = agg[id] || (agg[id] = { n: 0, so: 0, no: 0, sh: 0, nh: 0, sd: 0, nd: 0 });
    a.n++;
    if (r[5] !== "") { a.so += Number(r[5]); a.no++; }
    if (r[6] !== "") { a.sh += Number(r[6]); a.nh++; }
    if (r[7] !== "") { a.sd += Number(r[7]); a.nd++; }
  });
  const out = { perfumes: {}, quiz: quizStats_(sheet_("events", EVENT_HEADERS).getDataRange().getValues().slice(1)) };
  Object.keys(agg).forEach(id => {
    const a = agg[id];
    out.perfumes[id] = { n: a.n, o: a.no ? a.so / a.no : null, h: a.nh ? a.sh / a.nh : null, d: a.nd ? a.sd / a.nd : null };
  });
  const text = JSON.stringify(out);
  cache.put("stats", text, 300);
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

/* The quiz page sends "result:<palate>:<deal-breakers joined by +>" when a visitor reaches the result. Each
   device counts once, with its last result: n finished devices, how many hold each palate, how many each
   deal-breaker. rows: the events sheet without its header, [ts, device, lang, name, n], in the order written. */
function quizStats_(rows) {
  const last = {};
  rows.forEach(r => { const name = String(r[3] || ""); if (name.indexOf("result:") === 0 && r[1]) last[r[1]] = name; });
  const out = { n: 0, palates: {}, breakers: {} };
  Object.keys(last).forEach(device => {
    const parts = last[device].split(":"), palate = parts[1] || "none", bad = parts[2] ? parts[2].split("+") : [];
    out.n++;
    out.palates[palate] = (out.palates[palate] || 0) + 1;
    bad.forEach(f => { if (f) out.breakers[f] = (out.breakers[f] || 0) + 1; });
  });
  return out;
}

/* The quiz funnel: how many devices reached each screen ("reach:<screen>" events, one per screen per visit)
   and how many reached the result (quiz_done), in the order of the quiz, each as a share of those who saw the
   start screen. The note picker's screens are numbered 1 to 5; a screen whose notes were all answered on a
   bottle is skipped, and the bottle screens (verdicts, notes, narrow) are skipped by "None of these", so a
   later row can be larger than an earlier one. */
const FUNNEL_STEPS_ = ["start", "grid", "verdicts", "notes", "narrow", "picker", "taste", "told", "anosmia", "done"];
function funnelRows_(rows) {
  const seen = {};
  rows.forEach(r => {
    const name = String(r[3] || ""), device = r[1];
    if (!device) return;
    const step = name === "quiz_done" ? "done" : name.indexOf("reach:") === 0 ? name.slice(6) : null;
    if (!step) return;
    (seen[step] = seen[step] || {})[device] = true;
  });
  const order = step => { const [base, i] = step.split(":"); const k = FUNNEL_STEPS_.indexOf(base); return (k < 0 ? 99 : k) * 100 + (Number(i) || 0); };
  const steps = Object.keys(seen).sort((a, b) => order(a) - order(b));
  const count = step => Object.keys(seen[step]).length;
  const base = seen.start ? count("start") : 0;
  return steps.map(step => [step === "done" ? "result" : step, count(step), base ? Math.round(1000 * count(step) / base) / 10 : ""]);
}
/* Writes the funnel to its own sheet. Run it from the Profiler menu in the sheet, or from the script editor. */
function buildFunnel() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const rows = funnelRows_(sheet_("events", EVENT_HEADERS).getDataRange().getValues().slice(1));
  let sh = ss.getSheetByName("funnel");
  if (sh) sh.clear(); else sh = ss.insertSheet("funnel");
  sh.getRange(1, 1, 1, 3).setValues([["screen", "visitors", "% of start"]]);
  if (rows.length) sh.getRange(2, 1, rows.length, 3).setValues(rows);
  sh.getRange(rows.length + 3, 1).setValue("Built " + new Date().toISOString() + ". One visitor is one device; each screen counts once per device.");
}
/* the Profiler menu in the sheet this script is bound to */
function onOpen() {
  try { SpreadsheetApp.getUi().createMenu("Profiler").addItem("Build the quiz funnel", "buildFunnel").addToUi(); } catch (err) { /* not bound to a sheet */ }
}

function rowToEntry_(r) {
  let stages = null; try { stages = r[8] ? JSON.parse(r[8]) : null; } catch (err) { stages = null; }
  return { id: r[1], name: r[2], brand: r[3], gender: r[4], oilType: r[5], image: r[6], vendorId: r[7], stages, source: r[9], verified: r[10] };
}

function catalogue_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get("catalogue");
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  const rows = sheet_("catalogue", CATALOGUE_HEADERS).getDataRange().getValues().slice(1);
  const seen = {};
  const entries = [];
  rows.forEach(r => { if (r[1] && !seen[r[1]]) { seen[r[1]] = true; entries.push(rowToEntry_(r)); } });
  const text = JSON.stringify({ entries: entries.slice(-5000) });
  if (text.length < 95000) cache.put("catalogue", text, 300);
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

/* Store what the page derived from a lookup: identity, image, vendor id and family weights. Never notes. */
function tagcache_(b) {
  if (!b.id || !b.stages) return { ok: false, error: "id and stages required" };
  const sh = sheet_("catalogue", CATALOGUE_HEADERS);
  const rows = sh.getDataRange().getValues().slice(1);
  if (rows.some(r => r[1] === b.id)) return { ok: true, existed: true };
  sh.appendRow([new Date().toISOString(), clip_(b.id, 120), clip_(b.name), clip_(b.brand), clip_(b.gender, 20), clip_(b.oilType, 40), clip_(b.image, 500), clip_(b.vendorId, 120), clip_(JSON.stringify(b.stages), 4000), clip_(b.source || "vendor", 20), ""]);
  CacheService.getScriptCache().remove("catalogue");
  return { ok: true };
}

/* Lazy catalogue: a cache hit returns our stored derived entry; otherwise one Fragella call whose
   note list goes back to the requesting page only and is not stored. */
function lookup_(q) {
  q = String(q || "").trim().slice(0, 80);
  if (q.length < 3) return { found: false, reason: "short" };
  const key = q.toLowerCase();
  const sh = sheet_("catalogue", CATALOGUE_HEADERS);
  const rows = sh.getDataRange().getValues().slice(1);
  for (const r of rows) {
    const name = String(r[2]).toLowerCase(), brand = String(r[3]).toLowerCase();
    if (name === key || (brand + " " + name) === key || (name + " " + brand) === key) return { found: true, entry: rowToEntry_(r), cached: true };
  }
  const apiKey = PropertiesService.getScriptProperties().getProperty("FRAGELLA_KEY");
  if (!apiKey) return { found: false, reason: "no_key" };
  let list;
  try {
    const res = UrlFetchApp.fetch(FRAGELLA_BASE + "/fragrances?search=" + encodeURIComponent(q) + "&limit=3", { headers: { "x-api-key": apiKey }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return { found: false, reason: "api_" + res.getResponseCode() };
    const data = JSON.parse(res.getContentText());
    list = Array.isArray(data) ? data : (data.data || data.results || data.fragrances || []);
  } catch (err) { return { found: false, reason: "api_error" }; }
  if (!list || !list.length) return { found: false, reason: "no_match" };
  const f = list[0];
  /* Reject a fuzzy match that shares no word with the query. */
  const hay = ((f.Brand || "") + " " + (f.Name || "")).toLowerCase();
  const tokens = key.split(/[^a-z0-9؀-ۿ]+/).filter(t => t.length >= 3);
  if (tokens.length && !tokens.some(t => hay.indexOf(t) >= 0)) return { found: false, reason: "weak_match" };
  const names = arr => (arr || []).map(x => (typeof x === "string" ? x : x && x.name) || "").filter(Boolean);
  const notes = f.Notes || {};
  const entry = {
    id: "f_" + slug_((f.Brand || "") + " " + (f.Name || "")), name: f.Name || q, brand: f.Brand || "", gender: f.Gender || "",
    oilType: f.OilType || "", notes: { top: names(notes.Top), middle: names(notes.Middle), base: names(notes.Base) },
    accords: f["Main Accords"] || [], image: f["Image URL"] || "", vendorId: f._id || "", source: "vendor"
  };
  return { found: true, entry, cached: false };
}

/* One-time enrichment: fetch an image and vendor id for every verified catalogue entry and store it
   under the verified id, so the page can show bottle photos. No note lists are stored. Run it from
   the Apps Script editor: select enrichVerified in the toolbar and press Run. One request per entry. */
function enrichVerified() {
  const sh = sheet_("catalogue", CATALOGUE_HEADERS);
  const have = {};
  sh.getDataRange().getValues().slice(1).forEach(r => { have[r[1]] = true; });
  const apiKey = PropertiesService.getScriptProperties().getProperty("FRAGELLA_KEY");
  if (!apiKey) throw new Error("Set FRAGELLA_KEY in Script Properties first");
  let done = 0;
  VERIFIED.forEach(([id, q]) => {
    if (have[id]) return;
    const res = UrlFetchApp.fetch(FRAGELLA_BASE + "/fragrances?search=" + encodeURIComponent(q) + "&limit=1", { headers: { "x-api-key": apiKey }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return;
    const data = JSON.parse(res.getContentText());
    const list = Array.isArray(data) ? data : (data.data || data.results || data.fragrances || []);
    const f = list[0]; if (!f) return;
    sh.appendRow([new Date().toISOString(), id, f.Name || q, f.Brand || "", f.Gender || "", f.OilType || "", f["Image URL"] || "", f._id || "", "", "vendor", "yes"]);
    done++;
    Utilities.sleep(250);
  });
  CacheService.getScriptCache().remove("catalogue");
  Logger.log("enriched " + done + " entries");
}

/* Verified ids and search names, written from site/js/data.js by tools/sync_backend.js. Do not edit by hand. */
const VERIFIED = [
  ["aventus", "Creed Aventus"],
  ["hacivat", "Nishane Hacivat"],
  ["erbapura", "Xerjoff Erba Pura"],
  ["naxos", "Xerjoff XJ 1861 Naxos"],
  ["layton", "Parfums de Marly Layton"],
  ["herod", "Parfums de Marly Herod"],
  ["althair", "Parfums de Marly Althaïr"],
  ["delina", "Parfums de Marly Delina"],
  ["br540", "Maison Francis Kurkdjian Baccarat Rouge 540"],
  ["grandsoir", "Maison Francis Kurkdjian Grand Soir"],
  ["oudwood", "Tom Ford Oud Wood"],
  ["tobaccovanille", "Tom Ford Tobacco Vanille"],
  ["ombreleather", "Tom Ford Ombré Leather"],
  ["blackorchid", "Tom Ford Black Orchid"],
  ["sauvageelixir", "Dior Sauvage Elixir"],
  ["sauvageedp", "Dior Sauvage Eau de Parfum"],
  ["bleuedp", "Chanel Bleu de Chanel Eau de Parfum"],
  ["diorhommeintense", "Dior Dior Homme Intense"],
  ["diorhomme2020", "Dior Dior Homme (2020)"],
  ["paradigme", "Prada Paradigme"],
  ["yedp", "Yves Saint Laurent Y Eau de Parfum"],
  ["libre", "Yves Saint Laurent Libre"],
  ["blackopium", "Yves Saint Laurent Black Opium"],
  ["cocomademoiselle", "Chanel Coco Mademoiselle Eau de Parfum"],
  ["lemaleelixir", "Jean Paul Gaultier Le Male Elixir"],
  ["lebeauleparfum", "Jean Paul Gaultier Le Beau Le Parfum"],
  ["swyintensely", "Giorgio Armani Stronger With You Intensely"],
  ["adgprofumo", "Giorgio Armani Acqua di Giò Profumo"],
  ["pradalhomme", "Prada Prada L'Homme"],
  ["onemillion", "Rabanne 1 Million"],
  ["eros", "Versace Eros"],
  ["cedratboise", "Mancera Cedrat Boisé"],
  ["arabianstonka", "Montale Arabians Tonka"],
  ["oudforgreatness", "Initio Oud for Greatness"],
  ["sideeffect", "Initio Side Effect"],
  ["interlude", "Amouage Interlude Man"],
  ["reflection", "Amouage Reflection Man"],
  ["angelsshare", "By Kilian Angels' Share"],
  ["ombrenomade", "Louis Vuitton Ombre Nomade"],
  ["santal33", "Le Labo Santal 33"],
  ["bythefireplace", "Maison Margiela Replica By the Fireplace"],
  ["khamrah", "Lattafa Khamrah"],
  ["yara", "Lattafa Yara"],
  ["asad", "Lattafa Asad"],
  ["badeealoud", "Lattafa Bade'e Al Oud Oud for Glory"],
  ["cdnim", "Armaf Club de Nuit Intense Man"],
  ["amberwood", "Ajmal Amber Wood"],
  ["kalemat", "Arabian Oud Kalemat"],
  ["shaghafoud", "Swiss Arabian Shaghaf Oud"],
  ["hawas", "Rasasi Hawas"],
  ["9pm", "Afnan 9pm"],
  ["lavieestbelle", "Lancôme La Vie Est Belle"],
  ["goodgirl", "Carolina Herrera Good Girl"],
  ["alien", "Mugler Alien"],
  ["hypnoticpoison", "Dior Hypnotic Poison"],
  ["terredhermes", "Hermès Terre d'Hermès"],
  ["gypsywater", "Byredo Gypsy Water"],
  ["vanilla28", "Kayali Vanilla 28"],
  ["sauvageedt", "Dior Sauvage Eau de Toilette"],
  ["fahrenheit", "Dior Fahrenheit"],
  ["bleuparfum", "Chanel Bleu de Chanel Parfum"],
  ["allurehommesport", "Chanel Allure Homme Sport"],
  ["armanicode", "Giorgio Armani Armani Code"],
  ["adgedt", "Giorgio Armani Acqua di Giò"],
  ["swy", "Giorgio Armani Stronger With You"],
  ["lanuit", "Yves Saint Laurent La Nuit de l'Homme"],
  ["yedt", "Yves Saint Laurent Y Eau de Toilette"],
  ["myslf", "Yves Saint Laurent Myslf"],
  ["lunarossacarbon", "Prada Luna Rossa Carbon"],
  ["lunarossaocean", "Prada Luna Rossa Ocean"],
  ["erosflame", "Versace Eros Flame"],
  ["dylanblue", "Versace Dylan Blue"],
  ["invictus", "Rabanne Invictus"],
  ["onemillionelixir", "Rabanne 1 Million Elixir"],
  ["phantom", "Rabanne Phantom"],
  ["lemale", "Jean Paul Gaultier Le Male"],
  ["lemaleleparfum", "Jean Paul Gaultier Le Male Le Parfum"],
  ["ultramale", "Jean Paul Gaultier Ultra Male"],
  ["scandalhomme", "Jean Paul Gaultier Scandal Pour Homme"],
  ["uomobornroma", "Valentino Uomo Born in Roma"],
  ["uomointense", "Valentino Uomo Intense"],
  ["gentlemanedp", "Givenchy Gentleman Eau de Parfum"],
  ["gentlemanreserve", "Givenchy Gentleman Réserve Privée"],
  ["explorer", "Montblanc Explorer"],
  ["legend", "Montblanc Legend"],
  ["bossbottled", "Hugo Boss Boss Bottled"],
  ["wantedbynight", "Azzaro Wanted by Night"],
  ["mostwantedparfum", "Azzaro The Most Wanted Parfum"],
  ["badboy", "Carolina Herrera Bad Boy"],
  ["burberryhero", "Burberry Hero"],
  ["noirextreme", "Tom Ford Noir Extreme"],
  ["lostcherry", "Tom Ford Lost Cherry"],
  ["bitterpeach", "Tom Ford Bitter Peach"],
  ["tuscanleather", "Tom Ford Tuscan Leather"],
  ["fabulous", "Tom Ford Fucking Fabulous"],
  ["neroliportofino", "Tom Ford Neroli Portofino"],
  ["h24", "Hermès H24"],
  ["terreparfum", "Hermès Terre d'Hermès Parfum"],
  ["maninblack", "Bvlgari Man in Black"],
  ["tygar", "Bvlgari Tygar"],
  ["woodessence", "Bvlgari Wood Essence"],
  ["leaudissey", "Issey Miyake L'Eau d'Issey Pour Homme"],
  ["coolwater", "Davidoff Cool Water"],
  ["lhommeideal", "Guerlain L'Homme Idéal"],
  ["theonemen", "Dolce&Gabbana The One for Men"],
  ["lightbluemen", "Dolce&Gabbana Light Blue Pour Homme"],
  ["kdg", "Dolce&Gabbana K"],
  ["declaration", "Cartier Déclaration"],
  ["spicebombextreme", "Viktor&Rolf Spicebomb Extreme"],
  ["cocomademoiselleintense", "Chanel Coco Mademoiselle Intense"],
  ["chanelno5", "Chanel No 5 Eau de Parfum"],
  ["chanceeautendre", "Chanel Chance Eau Tendre"],
  ["jadore", "Dior J'adore"],
  ["missdior", "Dior Miss Dior (2021)"],
  ["idole", "Lancôme Idôle"],
  ["monparis", "Yves Saint Laurent Mon Paris"],
  ["libreintense", "Yves Saint Laurent Libre Intense"],
  ["si", "Giorgio Armani Sì"],
  ["myway", "Giorgio Armani My Way"],
  ["guccibloom", "Gucci Bloom"],
  ["gucciguilty", "Gucci Guilty"],
  ["floragardenia", "Gucci Flora Gorgeous Gardenia"],
  ["paradoxe", "Prada Paradoxe"],
  ["pradacandy", "Prada Candy"],
  ["burberryher", "Burberry Her"],
  ["cloud", "Ariana Grande Cloud"],
  ["cheirosa62", "Sol de Janeiro Cheirosa '62"],
  ["lovefestcherry", "Kayali Lovefest Burning Cherry"],
  ["scandal", "Jean Paul Gaultier Scandal"],
  ["daisy", "Marc Jacobs Daisy"],
  ["flowerbomb", "Viktor&Rolf Flowerbomb"],
  ["narcisoforher", "Narciso Rodriguez For Her Eau de Toilette"],
  ["chloe", "Chloé Chloé Eau de Parfum"],
  ["angel", "Mugler Angel"],
  ["linterdit", "Givenchy L'Interdit Eau de Parfum"],
  ["olympea", "Rabanne Olympéa"],
  ["ladymillion", "Rabanne Lady Million"],
  ["goodgirlblush", "Carolina Herrera Good Girl Blush"],
  ["woodsage", "Jo Malone Wood Sage & Sea Salt"],
  ["englishpear", "Jo Malone English Pear & Freesia"],
  ["peonysuede", "Jo Malone Peony & Blush Suede"],
  ["git", "Creed Green Irish Tweed"],
  ["smw", "Creed Silver Mountain Water"],
  ["millesimeimperial", "Creed Millésime Impérial"],
  ["viking", "Creed Viking"],
  ["aventusforher", "Creed Aventus for Her"],
  ["oudsatinmood", "Maison Francis Kurkdjian Oud Satin Mood"],
  ["mfk724", "Maison Francis Kurkdjian 724"],
  ["gentlefluiditygold", "Maison Francis Kurkdjian Gentle Fluidity Gold"],
  ["aquauniversalis", "Maison Francis Kurkdjian Aqua Universalis"],
  ["br540extrait", "Maison Francis Kurkdjian Baccarat Rouge 540 Extrait"],
  ["pegasus", "Parfums de Marly Pegasus"],
  ["percival", "Parfums de Marly Percival"],
  ["greenley", "Parfums de Marly Greenley"],
  ["sedley", "Parfums de Marly Sedley"],
  ["carlisle", "Parfums de Marly Carlisle"],
  ["kalan", "Parfums de Marly Kalan"],
  ["oriana", "Parfums de Marly Oriana"],
  ["valaya", "Parfums de Marly Valaya"],
  ["alexandriaii", "Xerjoff Alexandria II"],
  ["renaissance", "Xerjoff XJ 1861 Renaissance"],
  ["accento", "Xerjoff Accento"],
  ["torino21", "Xerjoff Torino21"],
  ["lira", "Xerjoff Casamorati Lira"],
  ["ani", "Nishane Ani"],
  ["hacivatx", "Nishane Hacivat X"],
  ["wulongcha", "Nishane Wulong Cha"],
  ["fanyourflames", "Nishane Fan Your Flames"],
  ["hundredsilentways", "Nishane Hundred Silent Ways"],
  ["rehab", "Initio Rehab"],
  ["atomicrose", "Initio Atomic Rose"],
  ["musktherapy", "Initio Musk Therapy"],
  ["blessedbaraka", "Initio Blessed Baraka"],
  ["redtobacco", "Mancera Red Tobacco"],
  ["instantcrush", "Mancera Instant Crush"],
  ["rosesvanille", "Mancera Roses Vanille"],
  ["intensecafe", "Montale Intense Café"],
  ["blackaoud", "Montale Black Aoud"],
  ["rosesmusk", "Montale Roses Musk"],
  ["chocolategreedy", "Montale Chocolate Greedy"],
  ["jubilationxxv", "Amouage Jubilation XXV"],
  ["reflection45", "Amouage Reflection 45"],
  ["guidance", "Amouage Guidance"],
  ["enclave", "Amouage Enclave"],
  ["another13", "Le Labo Another 13"],
  ["thenoir29", "Le Labo Thé Noir 29"],
  ["baldafrique", "Byredo Bal d'Afrique"],
  ["mojaveghost", "Byredo Mojave Ghost"],
  ["blanche", "Byredo Blanche"],
  ["blacksaffron", "Byredo Black Saffron"],
  ["philosykos", "Diptyque Philosykos"],
  ["tamdao", "Diptyque Tam Dao"],
  ["doson", "Diptyque Do Son"],
  ["fleurdepeau", "Diptyque Fleur de Peau"],
  ["blackphantom", "By Kilian Black Phantom"],
  ["lovedontbeshy", "By Kilian Love Don't Be Shy"],
  ["goodgirlgonebad", "By Kilian Good Girl Gone Bad"],
  ["rollinginlove", "By Kilian Rolling in Love"],
  ["portraitofalady", "Frederic Malle Portrait of a Lady"],
  ["muscravageur", "Frederic Malle Musc Ravageur"],
  ["elysium", "Roja Parfums Elysium Pour Homme Parfum Cologne"],
  ["enigma", "Roja Parfums Enigma Pour Homme"],
  ["danger", "Roja Parfums Danger Pour Homme"],
  ["amberaoud", "Roja Parfums Amber Aoud"],
  ["imagination", "Louis Vuitton Imagination"],
  ["limmensite", "Louis Vuitton L'Immensité"],
  ["afternoonswim", "Louis Vuitton Afternoon Swim"],
  ["meteore", "Louis Vuitton Météore"],
  ["nuitdefeu", "Louis Vuitton Nuit de Feu"],
  ["megamare", "Orto Parisi Megamare"],
  ["blackafgano", "Nasomatto Black Afgano"],
  ["molecule01", "Escentric Molecules Molecule 01"],
  ["notaperfume", "Juliette Has a Gun Not a Perfume"],
  ["grischarnel", "BDK Parfums Gris Charnel"],
  ["rougesmoking", "BDK Parfums Rouge Smoking"],
  ["ganymede", "Marc-Antoine Barrois Ganymede"],
  ["irishleather", "Memo Paris Irish Leather"],
  ["kirke", "Tiziana Terenzi Kirke"],
  ["jazzclub", "Maison Margiela Replica Jazz Club"],
  ["lazysunday", "Maison Margiela Replica Lazy Sunday Morning"],
  ["coffeebreak", "Maison Margiela Replica Coffee Break"],
  ["chergui", "Serge Lutens Chergui"],
  ["ambresultan", "Serge Lutens Ambre Sultan"],
  ["unboisvanille", "Serge Lutens Un Bois Vanille"],
  ["spiritueuxdoublevanille", "Guerlain Spiritueux Double Vanille"],
  ["santalroyal", "Guerlain Santal Royal"],
  ["tonkaimperiale", "Guerlain Tonka Impériale"],
  ["coromandel", "Chanel Coromandel Eau de Parfum"],
  ["sycomore", "Chanel Sycomore Eau de Parfum"],
  ["ambrenuit", "Dior Ambre Nuit"],
  ["oudispahan", "Dior Oud Ispahan"],
  ["boisdargent", "Dior Bois d'Argent"],
  ["grisdior", "Dior Gris Dior"],
  ["twilly", "Hermès Twilly d'Hermès"],
  ["jardinnil", "Hermès Un Jardin sur le Nil"],
  ["ameeraloudh", "Lattafa Ameer Al Oudh Intense Oud"],
  ["raghba", "Lattafa Raghba"],
  ["fakharblack", "Lattafa Fakhar Black"],
  ["anaabiyedhrouge", "Lattafa Ana Abiyedh Rouge"],
  ["oudmood", "Lattafa Oud Mood"],
  ["nebras", "Lattafa Nebras"],
  ["eclaire", "Lattafa Eclaire"],
  ["angham", "Lattafa Angham"],
  ["teriaq", "Lattafa Teriaq"],
  ["qaedalfursan", "Lattafa Qaed Al Fursan"],
  ["hisconfession", "Lattafa His Confession"],
  ["asadbourbon", "Lattafa Asad Bourbon"],
  ["khamrahqahwa", "Lattafa Khamrah Qahwa"],
  ["yaratous", "Lattafa Yara Tous"],
  ["yaracandy", "Lattafa Yara Candy"],
  ["liam", "Lattafa Liam"],
  ["cdnimwoman", "Armaf Club de Nuit Intense Woman"],
  ["cdnmilestone", "Armaf Club de Nuit Milestone"],
  ["cdnsillage", "Armaf Club de Nuit Sillage"],
  ["urbanelixir", "Armaf Club de Nuit Urban Man Elixir"],
  ["mandarinsky", "Armaf Odyssey Mandarin Sky"],
  ["supremacysilver", "Afnan Supremacy Silver"],
  ["supremacynotonly", "Afnan Supremacy Not Only Intense"],
  ["supremacynoir", "Afnan Supremacy Noir"],
  ["turathiblue", "Afnan Turathi Blue"],
  ["hawaselixir", "Rasasi Hawas Elixir"],
  ["shuhrah", "Rasasi Shuhrah Pour Homme"],
  ["layuqawam", "Rasasi La Yuqawam Pour Homme"],
  ["fattan", "Rasasi Fattan"],
  ["daarej", "Rasasi Daarej Men"],
  ["wisaldhahab", "Ajmal Wisal Dhahab"],
  ["aurum", "Ajmal Aurum"],
  ["silvershade", "Ajmal Silver Shade"],
  ["kalematblack", "Arabian Oud Kalemat Black"],
  ["woodyao", "Arabian Oud Woody"],
  ["madawi", "Arabian Oud Madawi"],
  ["shaghafoudaswad", "Swiss Arabian Shaghaf Oud Aswad"],
  ["layali", "Swiss Arabian Layali"],
  ["amberoudgold", "Al Haramain Amber Oud Gold Edition"],
  ["amberoudruby", "Al Haramain Amber Oud Ruby"],
  ["laventure", "Al Haramain L'Aventure"],
  ["detournoir", "Al Haramain Détour Noir"],
  ["jeanloweimmortel", "Maison Alhambra Jean Lowe Immortel"],
  ["kismetangel", "Maison Alhambra Kismet Angel"],
  ["avant", "Maison Alhambra Avant"],
  ["toscanoleather", "Maison Alhambra Toscano Leather"],
  ["glacierbold", "Maison Alhambra Glacier Bold"],
  ["barakkatrouge", "Fragrance World Barakkat Rouge 540"],
  ["barakkatsatinoud", "Fragrance World Barakkat Satin Oud"],
  ["liquidbrun", "French Avenue Liquid Brun"],
  ["oud24hours", "Ard Al Zaafaran Oud 24 Hours"],
  ["bhararaking", "Bharara King"],
  ["safariextreme", "Abdul Samad Al Qurashi Safari Extreme"],
  ["hawasice", "Rasasi Hawas Ice"],
  ["supremacycollector", "Afnan Supremacy Collector's Edition Pour Homme"],
  ["najdia", "Lattafa Najdia"],
  ["nauticavoyage", "Nautica Voyage"],
  ["swyabsolutely", "Giorgio Armani Stronger With You Absolutely"],
  ["bossbottlednight", "Hugo Boss Boss Bottled Night"],
  ["hugoman", "Hugo Boss Hugo Man"],
  ["mostwantedintense", "Azzaro The Most Wanted Eau de Parfum Intense"],
  ["trueinstinct", "David Beckham True Instinct"],
  ["thescentmen", "Hugo Boss Boss The Scent"],
  ["guiltyabsolute", "Gucci Guilty Absolute pour Homme"],
  ["emblem", "Montblanc Emblem"],
  ["lhommeidealedp", "Guerlain L'Homme Idéal Eau de Parfum"],
  ["euphoriamen", "Calvin Klein Euphoria Men"],
  ["oudmalaki", "Chopard Oud Malaki"],
  ["yaramoi", "Lattafa Yara Moi"],
  ["cdnwoman", "Armaf Club de Nuit Woman"],
  ["amaali", "Swiss Arabian Amaali"],
  ["ckin2uher", "Calvin Klein CK IN2U Her"],
  ["ckbeauty", "Calvin Klein Beauty"],
  ["eternitymoment", "Calvin Klein Eternity Moment"],
  ["sheerbeauty", "Calvin Klein Sheer Beauty"],
  ["euphoriawomen", "Calvin Klein Euphoria"],
  ["jovanmusk", "Jovan Musk for Women"],
  ["quatre", "Boucheron Quatre pour Femme"],
  ["paradiso", "Roberto Cavalli Paradiso"],
  ["cavalliedp", "Roberto Cavalli Roberto Cavalli Eau de Parfum"],
  ["paradisoazzurro", "Roberto Cavalli Paradiso Azzurro"],
  ["guessseductive", "Guess Seductive"],
  ["dgpourfemme", "Dolce&Gabbana Dolce&Gabbana Pour Femme"],
  ["erospourfemme", "Versace Eros Pour Femme"],
  ["lapanthere", "Cartier La Panthère"],
  ["elieleparfum", "Elie Saab Le Parfum"],
  ["narcisoforheredp", "Narciso Rodriguez For Her Eau de Parfum"],
  ["crystalnoir", "Versace Crystal Noir"],
  ["myburberry", "Burberry My Burberry"],
  ["thescentforher", "Hugo Boss Boss The Scent For Her"],
  ["interditrouge", "Givenchy L'Interdit Eau de Parfum Rouge"],
  ["guccibamboo", "Gucci Bamboo"],
  ["dynasty", "Lattafa Dynasty"],
  ["aroubjazal", "Aroub Jazal"],
  ["chocomusk", "Al Rehab Choco Musk"],
  ["musksilk", "Ajmal Musk Silk"],
  ["musamamwhite", "Lattafa Musamam White Intense"],
  ["moonlightpatchouli", "Van Cleef & Arpels Moonlight Patchouli"],
  ["royaleblue", "Rasasi Royale Blue"],
  ["hawasblack", "Rasasi Hawas Black"],
  ["vision", "Ajmal Vision"],
  ["arabianknight", "Arabian Oud Arabian Knight"],
  ["arabiancode", "Arabian Oud Arabian Code"],
  ["bluefm", "Rasasi Blue For Men"],
  ["tarteelsilver", "Arabian Oud Tarteel Silver"],
  ["asrar", "Arabian Oud Asrar"],
  ["elbrince", "Al Majed Oud Elbrince"],
  ["shaghafmen", "Swiss Arabian Shaghaf Men"],
  ["sultani", "Arabian Oud Sultani"],
  ["alwisamday", "Rasasi Al Wisam Day"],
  ["ehsas", "Arabian Oud Ehsas"],
  ["alfareed", "Arabian Oud Al Fareed"],
  ["solid", "Sapil Solid"],
  ["khamrahdukhan", "Lattafa Khamrah Dukhan"],
  ["hawaskobra", "Rasasi Hawas Kobra"],
  ["officer", "Al Rehab Officer"],
  ["salvointense", "Maison Alhambra Salvo Intense"],
  ["arabianknightsilver", "Arabian Oud Arabian Knight Silver"],
  ["rarecarbon", "Afnan Rare Carbon"],
  ["supremacyinheaven", "Afnan Supremacy In Heaven"],
  ["clubdenuitintensemanparfum", "Armaf Club de Nuit Intense Man Parfum"],
  ["aseelspecialedition", "Arabian Oud Aseel Special Edition"],
  ["blueoud", "Arabian Oud Blue Oud"],
  ["odysseyaoud", "Armaf Odyssey Aoud"],
  ["blackincense", "Abdul Samad Al Qurashi Black Incense"],
  ["arabsofdiriyah", "Reef Arabs of Diriyah"],
  ["evokeforher", "Ajmal Evoke for Her"],
  ["sacrificeforher", "Ajmal Sacrifice for Her"],
  ["emotion", "Rasasi Emotion"],
  ["adore", "Arabian Oud Adore"],
  ["velvettouch", "Arabian Oud Velvet Touch"],
  ["shuhrahpf", "Rasasi Shuhrah Pour Femme"],
  ["misslavernebloom", "Laverne Miss Laverne Bloom"],
  ["pinkdiamondsakura", "Ibraheem Al Qurashi Pink Diamond Sakura"],
  ["romance", "Rasasi Romance"],
  ["daarejpf", "Rasasi Daarej pour Femme"],
  ["rosenoir", "Ahmed Al Maghribi Rose Noir"],
  ["rasheeqa", "Swiss Arabian Rasheeqa"],
  ["mystiquebouquet", "Afnan Mystique Bouquet"],
  ["theone", "Laverne The One"],
  ["princessreef", "Reef Princess Reef"],
  ["misslaverne", "Laverne Miss Laverne"],
  ["reef11", "Reef Reef 11"],
  ["afna9pmnightout", "Afnan 9 PM Night Out"],
  ["reef33", "Reef Reef 33"],
  ["onlywhite", "Arabian Oud Only White"],
  ["jannetelfirdauswhite", "Swiss Arabian Jannet El Firdaus White"],
  ["puremusk", "Al Majed Oud Pure Musk"],
  ["almajeoudice", "Al Majed Oud Ice"],
  ["reef19", "Reef Reef 19"],
  ["reef33white", "Reef 33 White"],
  ["woodwhite", "Al Majed Oud Wood White"],
  ["secretmusk", "Swiss Arabian Secret Musk"],
  ["serious", "Al Majed Oud Serious"],
  ["almajeoudsun", "Al Majed Oud Sun"],
  ["anaabiyedh", "Lattafa Ana Abiyedh"],
  ["bluediamondaqua", "Ibraheem Al Qurashi Blue Diamond Aqua"],
  ["maahirblackedition", "Lattafa Maahir Black Edition"],
  ["almajeoudcuir", "Al Majed Oud Cuir"],
  ["almajeoudnoir", "Al Majed Oud Noir"],
  ["rarereef", "Afnan Rare Reef"],
  ["ahmealmaghmarj", "Ahmed Al Maghribi Marj"],
  ["blacksecret", "Al Majed Oud Black Secret"],
  ["afna9pmrebel", "Afnan 9 PM Rebel"],
  ["ahmealmaghkaaf", "Ahmed Al Maghribi Kaaf"],
  ["ambers", "Osma Amber' S"],
  ["onlypink", "Arabian Oud Only Pink"],
  ["prestigeruby", "Al Majed Oud Prestige Ruby"],
  ["dominicantobacco", "Ibraheem Al Qurashi Dominican Tobacco"],
  ["abayaarabs", "Reef Abaya Arabs"],
  ["musksilksupreme", "Ajmal Musk Silk Supreme"],
  ["specialmusk", "Ibraheem Al Qurashi Special Musk"],
  ["rose01", "Swiss Arabian Rose 01"],
  ["taraf", "Arabian Oud Taraf"],
  ["bluelaverne", "Laverne Blue Laverne"],
  ["afna9pmelixir", "Afnan 9PM Elixir"],
  ["kashmirmusk", "Arabian Oud Kashmir Musk"],
  ["sapphireleather", "Ibraheem Al Qurashi Sapphire Leather"],
  ["balasrose", "Ibraheem Al Qurashi Balas Rose"],
  ["noora", "Swiss Arabian Noora"],
  ["ehsaskhas", "Arabian Oud Ehsas Khas"],
  ["prestigetopaz", "Al Majed Oud Prestige Topaz"],
  ["ejaazi", "Lattafa Ejaazi"],
  ["almajeoudaris", "Al Majed Oud Aris"],
  ["ramzlattafagold", "Lattafa Ramz Lattafa (Gold)"],
  ["danatalduniya", "Ajmal Danat Al Duniya"],
  ["attarmubakhar", "Swiss Arabian Attar Mubakhar"],
  ["whitef", "Osma White' F"],
  ["reef31", "Reef Reef 31"],
  ["hayaatialmaleky", "Lattafa Hayaati Al Maleky"],
  ["bonsoir", "Osma Bonsoir"],
  ["summeryellow", "Reef Summer Yellow"],
  ["historicsahara", "Afnan Historic Sahara"],
  ["rasaattarmubakhar", "Rasasi Attar Mubakhar"],
  ["vanillas", "Osma Vanilla S"],
  ["frenchtobacco", "Ibraheem Al Qurashi French Tobacco"],
  ["citrusf", "Osma Citrus' F"],
  ["pesca", "Reef Pesca"],
  ["mazaajrhythm", "Zimaya Mazaaj Rhythm"],
  ["woodyw", "Osma Woody' W"],
  ["coral", "Reef Coral"],
  ["braziliantobacco", "Ibraheem Al Qurashi Brazilian Tobacco"],
  ["amiri", "Arabian Oud Amiri"],
  ["summeroud", "Ahmed Al Maghribi Summer Oud"],
  ["kayaanclassic", "Al Wataniah Kayaan Classic"],
  ["titan", "Reef Titan"],
  ["ibraalqurablueoud", "Ibraheem Al Qurashi Blue Oud"],
  ["oudcouture", "Ahmed Al Maghribi Oud Couture"],
  ["khaltaatalarabiaroyaldelight", "Lattafa Khaltaat Al Arabia Royal Delight"],
  ["vulcanfeu", "French Avenue Vulcan Feu"],
  ["spanishtobacco", "Ibraheem Al Qurashi Spanish Tobacco"],
  ["hersh2", "Al Ezz Oud Hersh 2"],
  ["mexicantobacco", "Ibraheem Al Qurashi Mexican Tobacco"],
  ["maahir", "Lattafa Maahir"],
  ["almajeoudsea", "Al Majed Oud Sea"],
  ["rosewood", "Arabian Oud Rosewood"],
  ["arabiantobacco", "Ibraheem Al Qurashi Arabian Tobacco"],
  ["primemax", "Dkhoun Prime Max"],
  ["islanddreams", "Khadlaj Island Dreams"],
  ["hershlahab", "Al Ezz Oud Hersh Lahab"],
  ["khashabaloudboisdeoud", "Abdul Samad Al Qurashi Khashab Al-Oud Bois de Oud"],
  ["blackdiamondincense", "Ibraheem Al Qurashi Black Diamond Incense"],
  ["cullinandiamondiris", "Ibraheem Al Qurashi Cullinan Diamond Iris"],
  ["greektobacco", "Ibraheem Al Qurashi Greek Tobacco"],
  ["amberoud", "Al Haramain Amber Oud"],
  ["ladorbakhurclassic", "Laverne La'dor Bakhur Classic"],
  ["jamaicantobacco", "Ibraheem Al Qurashi Jamaican Tobacco"],
  ["kingtobacco", "Laverne King Tobacco"],
  ["cubantobacco", "Laverne Cuban Tobacco"],
  ["reef21", "Reef Reef 21"],
  ["iwashere", "Laverne I Was Here"],
  ["blancash", "Reef Blanc Ash"],
  ["volcano", "Reef Volcano"],
  ["atlantishomme", "Laverne Atlantis Homme"],
  ["muskgarden", "Laverne Musk Garden"],
  ["dare700am", "Laverne Dare 7:00 AM"],
  ["bleudechanel", "Chanel Bleu de Chanel Eau de Toilette"],
  ["gentlemanedpboisee", "Givenchy Gentleman Eau de Parfum Boisée"],
  ["themostwantedintense", "Azzaro The Most Wanted Eau de Toilette Intense"],
  ["jaguarclassicgold", "Jaguar Jaguar Classic Gold"],
  ["diorhommesport", "Dior Dior Homme Sport"],
  ["hotwater", "Davidoff Hot Water"],
  ["bentleyfmintense", "Bentley Bentley for Men Intense"],
  ["dirtyenglishfm", "Juicy Couture Dirty English for Men"],
  ["gentlemanedtintense", "Givenchy Gentleman Eau de Toilette Intense"],
  ["sauvageparfum", "Dior Sauvage Parfum"],
  ["erosedp", "Versace Eros Eau de Parfum"],
  ["lhommelacoste", "Lacoste L'Homme Lacoste"],
  ["guiltyph", "Gucci Guilty Pour Homme"],
  ["acquadigioprofondoparfum", "Giorgio Armani Acqua di Giò Profondo Parfum"],
  ["yleparfum", "Yves Saint Laurent Y Le Parfum"],
  ["tommy", "Tommy Hilfiger Tommy"],
  ["jaguarclassicblack", "Jaguar Jaguar Classic Black"],
  ["yedpintense", "Yves Saint Laurent Y Eau de Parfum Intense"],
  ["caroherr212vipmen", "Carolina Herrera 212 VIP Men"],
  ["champion", "Davidoff Champion"],
  ["jaguarclassic", "Jaguar Jaguar Classic"],
  ["valentinouomo", "Valentino Valentino Uomo"],
  ["kbydolceandgabbanaedp", "Dolce&Gabbana K by Dolce & Gabbana Eau de Parfum"],
  ["marbertmanpure", "Marbert Marbert Man Pure"],
  ["robertocavalliuomo", "Roberto Cavalli Roberto Cavalli Uomo"],
  ["legendspirit", "Montblanc Legend Spirit"],
  ["dunhilliconabsolute", "Dunhill Dunhill Icon Absolute"],
  ["bossbottledparfum", "Hugo Boss Boss Bottled Parfum"],
  ["mrburberryedp", "Burberry Mr. Burberry Eau de Parfum"],
  ["zinodavidoff", "Davidoff Zino Davidoff"],
  ["lhomme", "Yves Saint Laurent L'Homme"],
  ["givenchyph", "Givenchy Givenchy pour Homme"],
  ["bentleyfmazure", "Bentley Bentley For Men Azure"],
  ["chicfm", "Carolina Herrera Chic For Men"],
  ["versaceph", "Versace Versace Pour Homme"],
  ["scandalphleparfum", "Jean Paul Gaultier Scandal Pour Homme Le Parfum"],
  ["givepi", "Givenchy Pi"],
  ["azzaroph", "Azzaro Azzaro pour Homme"],
  ["bluejeans", "Versace Blue Jeans"],
  ["custom", "Dunhill Custom"],
  ["armanicodeparfum", "Giorgio Armani Armani Code Parfum"],
  ["individuel", "Montblanc Individuel"],
  ["bossbottledunlimited", "Hugo Boss Boss Bottled Unlimited"],
  ["caroherr212vipblack", "Carolina Herrera 212 VIP Black"],
  ["acquadigioprofondo", "Giorgio Armani Acqua di Giò Profondo"],
  ["pashacartier", "Cartier Pasha de Cartier"],
  ["scandalphabsolu", "Jean Paul Gaultier Scandal Pour Homme Absolu"],
  ["touchfm", "Burberry Touch for Men"],
  ["londonfm", "Burberry London for Men"],
  ["mrburberry", "Burberry Mr. Burberry"],
  ["emporioarmanistrongerwithyou", "Giorgio Armani Stronger With You Tobacco"],
  ["euphoriamenintense", "Calvin Klein Euphoria Men Intense"],
  ["thedreamer", "Versace The Dreamer"],
  ["versacemaneaufraiche", "Versace Versace Man Eau Fraiche"],
  ["armanieaudecedre", "Giorgio Armani Armani Eau de Cèdre"],
  ["eternityfm", "Calvin Klein Eternity For Men"],
  ["onemanshow", "Jacques Bogart One Man Show"],
  ["lapidusph", "Ted Lapidus Lapidus Pour Homme"],
  ["rabanneinvictusvictory", "Rabanne Invictus Victory"],
  ["allurehomme", "Chanel Allure Homme"],
  ["versacephoudnoir", "Versace Versace Pour Homme Oud Noir"],
  ["aguabrava", "Antonio Puig Agua Brava"],
  ["encrenoire", "Lalique Encre Noire"],
  ["joophomme", "Joop! Joop! Homme"],
  ["eaudombreleather", "Tom Ford Eau d'Ombré Leather"],
  ["guiltyelixirdeparfumph", "Gucci Guilty Elixir de Parfum pour Homme"],
  ["mercedesbenzintense", "Mercedes-Benz Mercedes Benz Intense"],
  ["l1212edpblancforhim", "Lacoste L.12.12 Eau de Parfum Blanc For Him"],
  ["pashadecartiereditionnoireed", "Cartier Pasha de Cartier Edition Noire Eau de Toilette"],
  ["fierce", "Abercrombie & Fitch Fierce"],
  ["jaguarfmgoldinblack", "Jaguar Jaguar For Men Gold in Black"],
  ["sauvageeauforte", "Dior Sauvage Eau Forte"],
  ["lebeauparadisegarden", "Jean Paul Gaultier Le Beau Paradise Garden"],
  ["yesiamthekingleparfum", "Geparlys Yes I Am The King Le Parfum"],
  ["rabanne1milliongoldenoud", "Rabanne Rabanne 1 Million Golden Oud"],
  ["diorhommeparfum2025", "Dior Dior Homme Parfum"],
  ["valentinouomoborninromainten", "Valentino Uomo Born In Roma Intense"],
  ["valentinouomoborninromacoral", "Valentino Uomo Born In Roma Coral Fantasy"],
  ["gentlemansociety", "Givenchy Gentleman Society"],
  ["rabanneinvictusvictoryelixir", "Rabanne Invictus Victory Elixir"],
  ["heroedp", "Burberry Hero Eau de Parfum"],
  ["sculpturehomme", "Nikos Sculpture Homme"],
  ["jaguarfm", "Jaguar Jaguar For Men"],
  ["declarationparfum", "Cartier Déclaration Parfum"],
  ["pradalhommeintense", "Prada Prada L'Homme Intense"],
  ["declarationedp", "Cartier Déclaration Eau de Parfum"],
  ["jaguarclassicred", "Jaguar Jaguar Classic Red"],
  ["pashadecartiereditionnoiresp", "Cartier Pasha de Cartier Edition Noire Sport"],
  ["caroherr212men", "Carolina Herrera 212 Men"],
  ["calvkleidefy", "Calvin Klein Defy"],
  ["polored", "Ralph Lauren Polo Red"],
  ["boucheronquatreph", "Boucheron Quatre Pour Homme"],
  ["lightblueeauintenseph", "Dolce&Gabbana Light Blue Eau Intense Pour Homme"],
  ["gucciguiltyloveeditionph", "Gucci Guilty Love Edition Pour Homme"],
  ["momentumintense", "Bentley Momentum Intense"],
  ["scuderiaferrariblack", "Ferrari Scuderia Ferrari Black"],
  ["iconracing", "Dunhill Icon Racing"],
  ["drakkarnoir", "Guy Laroche Drakkar Noir"],
  ["hugojustdifferent", "Hugo Boss Hugo Just Different"],
  ["gentlemenonly", "Givenchy Gentlemen Only"],
  ["rabanne1millionlucky", "Rabanne Rabanne 1 Million Lucky"],
  ["guiltyphedp", "Gucci Guilty Pour Homme Eau de Parfum"],
  ["infiniteedt", "Bentley Infinite Eau de Toilette"],
  ["adidasicedive", "Adidas Ice Dive"],
  ["defyparfum", "Calvin Klein Defy Parfum"],
  ["rogeandgallopen", "Roger & Gallet Open"],
  ["essential", "Lacoste Essential"],
  ["chrome", "Azzaro Chrome"],
  ["chmen", "Carolina Herrera CH Men"],
  ["bentleyfm", "Bentley Bentley for Men"],
  ["silverscentintense", "Jacques Bogart Silver Scent Intense"],
  ["eaudelacostel1212white", "Lacoste Eau de Lacoste L.12.12. White"],
  ["egoisteplatinum", "Chanel Egoiste Platinum"],
  ["encrenoiresport", "Lalique Encre Noire Sport"],
  ["bentleyfmabsolute", "Bentley Bentley For Men Absolute"],
  ["poloblue", "Ralph Lauren Polo Blue"],
  ["desireblue", "Dunhill Desire Blue"],
  ["cigar", "Rémy Latour Cigar"],
  ["silverscent", "Jacques Bogart Silver Scent"],
  ["dunhilledition", "Dunhill Dunhill Edition"],
  ["bossinmotion", "Hugo Boss Boss in Motion"],
  ["iconelite", "Dunhill Icon Elite"],
  ["aramis", "Aramis Aramis"],
  ["moustacheedp", "Rochas Moustache Eau de Parfum"],
  ["crisronacr7", "Cristiano Ronaldo CR7"],
  ["leathermalaki", "Chopard Leather Malaki"],
  ["wanted", "Azzaro Wanted"],
  ["lebeaunarcisse", "Jean Paul Gaultier Le Beau Narcisse"],
  ["scuderiaferrarired", "Ferrari Scuderia Ferrari Red"],
  ["emporioarmanistrongerwithy2", "Giorgio Armani Stronger With You Parfum"],
  ["dolceandgabbanaphintenso", "Dolce&Gabbana Dolce&Gabbana Pour Homme Intenso"],
  ["givenchyphbluelabel", "Givenchy Givenchy pour Homme Blue Label"],
  ["yesiamtheking", "Geparlys Yes I Am The King"],
  ["diorhommeeaufm", "Dior Dior Homme Eau for Men"],
  ["mercedesbenzclubblackedt", "Mercedes-Benz Mercedes Benz Club Black Eau de Toilette"],
  ["rabannepacorabanneph", "Rabanne Paco Rabanne Pour Homme"],
  ["coolwaterintense", "Davidoff Cool Water Intense"],
  ["pureblack", "Creation Lamis Pure Black"],
  ["bentleyfmsilverlake", "Bentley Bentley For Men Silverlake"],
  ["contradiction", "Calvin Klein Contradiction"],
  ["legendblue", "Montblanc Legend Blue"],
  ["polosport", "Ralph Lauren Polo Sport"],
  ["coachfm", "Coach Coach for Men"],
  ["hugodarkblue", "Hugo Boss Hugo Dark Blue"],
  ["chop1000miglia", "Chopard 1000 Miglia"],
  ["linstantdeguerlainphedp", "Guerlain L'Instant de Guerlain pour Homme EDP"],
  ["weekendfm", "Burberry Weekend for Men"],
  ["encrenoirealextreme", "Lalique Encre Noire A L'Extreme"],
  ["rabanneblackxs", "Rabanne Rabanne Black XS"],
  ["poloblueedp", "Ralph Lauren Polo Blue Eau de Parfum"],
  ["leaudisseyphintense", "Issey Miyake L'Eau d'Issey Pour Homme Intense"],
  ["aqvaph", "Bvlgari Aqva Pour Homme"],
  ["hugoenergise", "Hugo Boss Hugo Energise"],
  ["desireextreme", "Dunhill Desire Extreme"],
  ["fbyferragamoblack", "Salvatore Ferragamo F by Ferragamo Black"],
  ["versacelhomme", "Versace Versace L'Homme"],
  ["explorerplatinum", "Montblanc Explorer Platinum"],
  ["hugoiced", "Hugo Boss Hugo Iced"],
  ["jaguarclassicchromite", "Jaguar Jaguar Classic Chromite"],
  ["lhommeidealextreme", "Guerlain L'Homme Idéal Extrême"],
  ["theonefmedpintense", "Dolce&Gabbana The One For Men Eau de Parfum Intense"],
  ["theonemysteriousnight", "Dolce&Gabbana The One Mysterious Night"],
  ["iconracingblue", "Dunhill Icon Racing Blue"],
  ["spicebombdarkleather", "Viktor&Rolf Spicebomb Dark Leather"],
  ["gentlemansocietyedpambree", "Givenchy Gentleman Society Eau de Parfum Ambrée"],
  ["gucciguiltyblackph", "Gucci Guilty Black Pour Homme"],
  ["jovanmuskfm", "Jovan Musk for Men"],
  ["allurehommesportsuperleggera", "Chanel Allure Homme Sport Superleggera"],
  ["fahrenheitleparfum", "Dior Fahrenheit Le Parfum"],
  ["myslfleparfum", "Yves Saint Laurent MYSLF Le Parfum"],
  ["emporioarmanistrongerwithy3", "Giorgio Armani Stronger With You Only"],
  ["artisanpure", "John Varvatos Artisan Pure"],
  ["blueseduction", "Antonio Banderas Blue Seduction"],
  ["caroherr212sexymen", "Carolina Herrera 212 Sexy Men"],
  ["leseldissey", "Issey Miyake Le Sel d’Issey"],
  ["lhommeedp", "Yves Saint Laurent L'Homme Eau de Parfum"],
  ["nauticavoyageheritage", "Nautica Voyage Heritage"],
  ["toyboy", "Moschino Toy Boy"],
  ["bvlgarimanwoodneroli", "Bvlgari Bvlgari Man Wood Neroli"],
  ["acquadigioelixir", "Giorgio Armani Acqua di Giò Elixir"],
  ["azzarosportedt", "Azzaro Azzaro Sport Eau de Toilette"],
  ["erosparfum", "Versace Eros Parfum"],
  ["theonephparfum", "Dolce&Gabbana The One Pour Homme Parfum"],
  ["starwalker", "Montblanc Starwalker"],
  ["declarationessence", "Cartier Declaration Essence"],
  ["explorerultrablue", "Montblanc Explorer Ultra Blue"],
  ["vetiver", "Guerlain Vetiver"],
  ["yvessainlaurm7", "Yves Saint Laurent M7"],
  ["legendedp", "Montblanc Legend Eau de Parfum"],
  ["emporioarmanistrongerwithy4", "Giorgio Armani Stronger With You Leather"],
  ["cerr1881men", "Cerruti 1881 Men"],
  ["lhommeideallintense", "Guerlain L'Homme Idéal L'Intense"],
  ["cliniquehappyfm", "Clinique Happy For Men"],
  ["trussardiuomo", "Trussardi Trussardi Uomo"],
  ["xeryusrouge", "Givenchy Xeryus Rouge"],
  ["boucheronph", "Boucheron Boucheron Pour Homme"],
  ["korloffinwhite", "Korloff Paris Korloff In White"],
  ["narcisorodriguezforhimbleuno", "Narciso Rodriguez Narciso Rodriguez for Him Bleu Noir Parfum"],
  ["artisan", "John Varvatos Artisan"],
  ["coachplatinum", "Coach Coach Platinum"],
  ["acquadigioparfum", "Giorgio Armani Acqua di Giò Parfum"],
  ["lunarossablack", "Prada Luna Rossa Black"],
  ["legendnight", "Montblanc Legend Night"],
  ["tous1920theorigin", "Tous 1920 The Origin"],
  ["costumenationalhomme", "Costume National Costume National Homme"],
  ["lanuitdelhommeleparfum", "Yves Saint Laurent La Nuit de L'Homme Le Parfum"],
  ["kouros", "Yves Saint Laurent Kouros"],
  ["dunhicon", "Dunhill Icon"],
  ["fusiondisseyextreme", "Issey Miyake Fusion d'Issey Extrême"],
  ["drivenedt", "Dunhill Driven Eau de Toilette"],
  ["allurehommeeditionblancheedp", "Chanel Allure Homme Edition Blanche Eau de Parfum"],
  ["missdiorbloomingbouquet", "Dior Miss Dior Blooming Bouquet"],
  ["libreleparfum", "Yves Saint Laurent Libre Le Parfum"],
  ["valentinodonnaborninroma", "Valentino Donna Born In Roma"],
  ["chanceeautendreedp", "Chanel Chance Eau Tendre Eau de Parfum"],
  ["pradaparadoxeintense", "Prada Paradoxe Intense"],
  ["inred", "Armand Basi In Red"],
  ["brightcrystal", "Versace Bright Crystal"],
  ["gucciguiltyabsolutepf", "Gucci Guilty Absolute Pour Femme"],
  ["tommygirl", "Tommy Hilfiger Tommy Girl"],
  ["escadamagnetism", "Escada Magnetism"],
  ["sipassione", "Giorgio Armani Sì Passione"],
  ["premierjour", "Nina Ricci Premier Jour"],
  ["london", "Burberry London"],
  ["paradisoassoluto", "Roberto Cavalli Paradiso Assoluto"],
  ["leparfuminwhite", "Elie Saab Le Parfum in White"],
  ["bossorange", "Hugo Boss Boss Orange"],
  ["guccirush", "Gucci Rush"],
  ["lolitalempicka", "Lolita Lempicka Lolita Lempicka"],
  ["missdiorparfum", "Dior Miss Dior Parfum"],
  ["robertocavallineroassoluto", "Roberto Cavalli Nero Assoluto"],
  ["monguerlain", "Guerlain Mon Guerlain"],
  ["insolenceedp", "Guerlain Insolence Eau de Parfum"],
  ["gabrielle", "Chanel Gabrielle"],
  ["miracle", "Lancôme Miracle"],
  ["valentinodonna", "Valentino Valentino Donna"],
  ["dioraddictedp", "Dior Dior Addict Eau de Parfum"],
  ["lalique", "Lalique Lalique"],
  ["girlofnowshine", "Elie Saab Girl of Now Shine"],
  ["puremuscforher", "Narciso Rodriguez Pure Musc For Her"],
  ["joybydiorintense", "Dior Joy by Dior Intense"],
  ["cacheden", "Cacharel Eden"],
  ["joybydior", "Dior Joy by Dior"],
  ["florence", "Roberto Cavalli Florence"],
  ["alluresensuelle", "Chanel Allure Sensuelle"],
  ["floragorgeousjasmine", "Gucci Flora Gorgeous Jasmine"],
  ["myburberryblush", "Burberry My Burberry Blush"],
  ["narcisopoudree", "Narciso Rodriguez Narciso Poudree"],
  ["gucciguiltyedp", "Gucci Guilty Eau de Parfum"],
  ["gucciguiltyelixirdeparfumpf", "Gucci Guilty Elixir de Parfum pour Femme"],
  ["franckolivier", "Franck Olivier Franck Olivier"],
  ["linstantmagicedp", "Guerlain L'instant Magic Eau de Parfum"],
  ["rabannemilliongoldforher", "Rabanne Million Gold For Her"],
  ["theonlyone", "Dolce&Gabbana The Only One"],
  ["coach", "Coach Coach Eau de Parfum"],
  ["purepoison", "Dior Pure Poison"],
  ["valentinodonnaborninromainte", "Valentino Donna Born In Roma Intense"],
  ["angeoudemonlesecret", "Givenchy Ange Ou Demon Le Secret"],
  ["faraway", "Avon Far Away"],
  ["burberrybritsheer", "Burberry Burberry Brit Sheer"],
  ["dolcandgabbtheone", "Dolce&Gabbana The One"],
  ["boucheron", "Boucheron Boucheron"],
  ["amarige", "Givenchy Amarige"],
  ["petitsetmamans", "Bvlgari Petits et Mamans"],
  ["coachdreamssunset", "Coach Dreams Sunset"],
  ["vivalajuicy", "Juicy Couture Viva la Juicy"],
  ["lovestory", "Chloé Love Story"],
  ["leparfumessentiel", "Elie Saab Le Parfum Essentiel"],
  ["monguerlainedpintense", "Guerlain Mon Guerlain Eau de Parfum Intense"],
  ["still", "Jennifer Lopez Still"],
  ["lacostepf", "Lacoste Lacoste Pour Femme"],
  ["signature", "Montblanc Signature"],
  ["pradaparadoxevirtualflower", "Prada Paradoxe Virtual Flower"],
  ["obsession", "Calvin Klein Obsession"],
  ["labelleleparfum", "Jean Paul Gaultier La Belle Le Parfum"],
  ["lapetiterobenoire", "Guerlain La Petite Robe Noire"],
  ["emporioarmanibecauseitsyou", "Giorgio Armani Because It’s You"],
  ["linterditedpintense", "Givenchy L'Interdit Eau de Parfum Intense"],
  ["floragorgeousmagnolia", "Gucci Flora Gorgeous Magnolia"],
  ["hotcouture", "Givenchy Hot Couture"],
  ["goddess", "Burberry Goddess"],
  ["theonlyoneedpintense", "Dolce&Gabbana The Only One Eau de Parfum Intense"],
  ["debut", "Aigner Debut"],
  ["happyspirit", "Chopard Happy Spirit"],
  ["placevendome", "Boucheron Place Vendôme"],
  ["irresistiblegivenchy", "Givenchy Irresistible Givenchy"],
  ["burberryherlondondream", "Burberry Her London Dream"],
  ["coconoir", "Chanel Coco Noir"],
  ["raregold", "Avon Rare Gold"],
  ["idylleedp", "Guerlain Idylle Eau de Parfum"],
  ["organza", "Givenchy Organza"],
  ["linterditedprougeultime", "Givenchy L'Interdit Eau de Parfum Rouge Ultime"],
  ["weekendfw", "Burberry Weekend for Women"],
  ["myburberryblack", "Burberry My Burberry Black"],
  ["tresormidnightrose", "Lancôme Trésor Midnight Rose"],
  ["leparfumedpintense", "Elie Saab Le Parfum Eau de Parfum Intense"],
  ["versacepfdylanblue", "Versace Versace Pour Femme Dylan Blue"],
  ["femme", "Hugo Boss Femme"],
  ["scandalbynight", "Jean Paul Gaultier Scandal By Night"],
  ["redjeans", "Versace Red Jeans"],
  ["girlofnow", "Elie Saab Girl of Now"],
  ["muscnoirroseforher", "Narciso Rodriguez Musc Noir Rose For Her"],
  ["amoramor", "Cacharel Amor Amor"],
  ["velvetorchid", "Tom Ford Velvet Orchid"],
  ["devotion", "Dolce&Gabbana Devotion"],
  ["mywayintense", "Giorgio Armani My Way Intense"],
  ["donnatrussardi", "Trussardi Donna Trussardi"],
  ["gabrielleessence", "Chanel Gabrielle Essence"],
  ["hypnoticpoisonedp", "Dior Hypnotic Poison Eau de Parfum"],
  ["narciso", "Narciso Rodriguez Narciso"],
  ["classique", "Jean Paul Gaultier Classique"],
  ["lanuittresor", "Lancôme La Nuit Trésor"],
  ["chanceedt", "Chanel Chance Eau de Toilette"],
  ["chanceedp", "Chanel Chance Eau de Parfum"],
  ["whitemusk", "Tesori d'Oriente White Musk"],
  ["foreverandeverdior", "Dior Forever and Ever Dior"],
  ["morenanoir", "Parfums Morena Morena Noir"],
  ["caroherrch", "Carolina Herrera CH"],
  ["lapetiterobenoireedpintense", "Guerlain La Petite Robe Noire Eau de Parfum Intense"],
  ["daisyeausofresh", "Marc Jacobs Daisy Eau So Fresh"],
  ["lancy", "Dorall Collection Lancy"],
  ["floragorgeousgardeniaintense", "Gucci Flora Gorgeous Gardenia Intense"],
  ["samsaraedp", "Guerlain Samsara Eau de Parfum"],
  ["siedpintense", "Giorgio Armani Si Eau de Parfum Intense"],
  ["librelabsoluplatine", "Yves Saint Laurent Libre L'Absolu Platine"],
  ["iconic", "Guess Iconic"],
  ["angeoudemon", "Givenchy Ange ou Demon"],
  ["sipassioneintense", "Giorgio Armani Sì Passione Intense"],
  ["gaultierdivineleparfum", "Jean Paul Gaultier Gaultier Divine Le Parfum"],
  ["labelleparadisegarden", "Jean Paul Gaultier La Belle Paradise Garden"],
  ["libreflowersandflames", "Yves Saint Laurent Libre Flowers & Flames"],
  ["goodgirlblushelixiredp", "Carolina Herrera Good Girl Blush Elixir Eau de Parfum"],
  ["gaultierdivine", "Jean Paul Gaultier Gaultier Divine"],
  ["goodgirlmidnight", "Carolina Herrera Good Girl Midnight"],
  ["libreedt", "Yves Saint Laurent Libre Eau de Toilette"],
  ["patchoulimusc", "Narciso Rodriguez Patchouli Musc"],
  ["scherrer2", "Jean-Louis Scherrer Scherrer 2"],
  ["labomba", "Carolina Herrera La Bomba"],
  ["incandessencelotus", "Avon Incandessence Lotus"],
  ["incandessence", "Avon Incandessence"],
  ["rarepearls", "Avon Rare Pearls"],
  ["linterditedt", "Givenchy L'Interdit Eau de Toilette"],
  ["miutine", "Miu Miu Miutine"],
  ["touch", "Tous Touch"],
  ["nomade", "Chloé Nomade"],
  ["erospfedt", "Versace Eros Pour Femme Eau de Toilette"],
  ["laliqueleparfum", "Lalique Lalique Le Parfum"],
  ["elizarde5thavenue", "Elizabeth Arden 5th Avenue"],
  ["lightblueedt", "Dolce&Gabbana Light Blue Eau de Toilette"],
  ["chopwish", "Chopard Wish"],
  ["borninromathegolddonna", "Valentino Born in Roma the Gold Donna"],
  ["justcavalli", "Roberto Cavalli Just Cavalli"],
  ["beautiful", "Estée Lauder Beautiful"],
  ["wishoflove", "Avon Wish of Love"],
  ["celebre", "Avon Célèbre"],
  ["creation", "Ted Lapidus Creation"],
  ["tomorrow", "Avon Tomorrow"],
  ["bossmaviepf", "Hugo Boss Boss Ma Vie Pour Femme"],
  ["pandora", "J. Casanova Pandora"],
  ["cachnoa", "Cacharel Noa"],
  ["whitetea", "Elizabeth Arden White Tea"],
  ["baiservole", "Cartier Baiser Vole"],
  ["diordune", "Dior Dune"],
  ["hotgold", "Benetton Hot Gold"],
  ["allofme", "Narciso Rodriguez All Of Me"],
  ["anaisanais", "Cacharel Anais Anais"],
  ["hugoxx", "Hugo Boss Hugo XX"],
  ["labelle", "Jean Paul Gaultier La Belle"],
  ["pleasures", "Estée Lauder Pleasures"],
  ["ladyemblem", "Montblanc Lady Emblem"],
  ["whitelinen", "Estée Lauder White Linen"],
  ["liveluxe", "Jennifer Lopez Live Luxe"],
  ["knowing", "Estée Lauder Knowing"],
  ["angeledt", "Mugler Angel Eau de Toilette"],
  ["eaudeprivatecollection", "Estée Lauder Eau de Private Collection"],
  ["eilish", "Billie Eilish Eilish"],
  ["floragorgeousorchid", "Gucci Flora Gorgeous Orchid"],
  ["yellowdiamond", "Versace Yellow Diamond"],
  ["avonluckforher", "Avon Luck for Her"],
  ["aromaticselixir", "Clinique Aromatics Elixir"],
  ["hugowomanedp", "Hugo Boss Hugo Woman Eau de Parfum"],
  ["cerr1881", "Cerruti 1881"],
  ["emanungadiva", "Emanuel Ungaro Diva"],
  ["leparfumbridal", "Elie Saab Le Parfum Bridal"],
  ["yvessainlaurelle", "Yves Saint Laurent Elle"],
  ["shalis", "Remy Marquis Shalis"],
  ["versacewoman", "Versace Versace Woman"],
  ["justcavalliwildheartforher", "Roberto Cavalli Just Cavalli Wild Heart for Her"],
  ["caroherr212vip", "Carolina Herrera 212 VIP"],
  ["muscnoirforher", "Narciso Rodriguez Musc Noir For Her"],
  ["blackopiumoverred", "Yves Saint Laurent Black Opium Over Red"],
  ["youthdew", "Estée Lauder Youth-Dew"],
  ["korlofflady", "Korloff Paris Korloff Lady"],
  ["guccibloomintense", "Gucci Bloom Intense"],
  ["perrelli360", "Perry Ellis 360°"],
  ["dahliadivin", "Givenchy Dahlia Divin"],
  ["dolce", "Dolce&Gabbana Dolce"],
  ["coachdreams", "Coach Dreams"],
  ["guessfw", "Guess Guess for Women"],
  ["burberrywomen", "Burberry Burberry Women"],
  ["gucciguiltyedpintensepf", "Gucci Guilty Eau de Parfum Intense Pour Femme"],
  ["brightcrystalabsolu", "Versace Bright Crystal Absolu"],
  ["scandalleparfum", "Jean Paul Gaultier Scandal Le Parfum"],
  ["narcisoedpcristal", "Narciso Rodriguez Narciso Eau de Parfum Cristal"],
  ["jennlopelive", "Jennifer Lopez Live"],
  ["idoleaura", "Lancôme Idôle Aura"],
  ["ladyemblemelixir", "Montblanc Lady Emblem Elixir"],
  ["monguerlainsparklingbouquet", "Guerlain Mon Guerlain Sparkling Bouquet"],
  ["izialanuit", "Sisley Izia La Nuit"],
  ["hugowomanextreme", "Hugo Boss Hugo Woman Extreme"],
  ["cocomademoiselleleauprivee", "Chanel Coco Mademoiselle L'Eau Privée"],
  ["serpentboheme", "Boucheron Serpent Bohème"],
  ["touchofpink", "Lacoste Touch of Pink"],
  ["presencedunefemme", "Montblanc Présence d'une femme"],
  ["goldeatheromannightabsolute", "Bvlgari Goldea The Roman Night Absolute"],
  ["byzance", "Rochas Byzance"],
  ["narcisoedpambree", "Narciso Rodriguez Narciso Eau de Parfum Ambrée"],
  ["champselyseesedp", "Guerlain Champs Elysees Eau de Parfum"],
  ["leparfumroyal", "Elie Saab Le Parfum Royal"],
  ["splendidatubereusemystique", "Bvlgari Splendida Tubereuse Mystique"],
  ["chanceeaufraiche", "Chanel Chance Eau Fraiche"],
  ["idolenow", "Lancôme Idôle Now"],
  ["versacepfdylanpurple", "Versace Versace Pour Femme Dylan Purple"],
  ["aliengoddessintense", "Mugler Alien Goddess Intense"],
  ["ralplaurromance", "Ralph Lauren Romance"],
  ["tiffanyandloveforher", "Tiffany Tiffany & Love For Her"],
  ["monparisintensement", "Yves Saint Laurent Mon Paris Intensement"],
  ["zenedp", "Shiseido Zen Eau de Parfum"],
  ["myeuphoria", "Calvin Klein My Euphoria"],
  ["chanceeauvive", "Chanel Chance Eau Vive"],
  ["perceive", "Avon Perceive"],
  ["splendidamagnoliasensuel", "Bvlgari Splendida Magnolia Sensuel"],
  ["splendidajasminnoir", "Bvlgari Splendida Jasmin Noir"],
  ["dolcegarden", "Dolce&Gabbana Dolce Garden"],
  ["missdiorabsolutelyblooming", "Dior Miss Dior Absolutely Blooming"],
  ["ardenbeauty", "Elizabeth Arden Arden Beauty"],
  ["lapetiterobenoireedt", "Guerlain La Petite Robe Noire Eau de Toilette"],
  ["secretderochas", "Rochas Secret de Rochas"],
  ["touchfw", "Burberry Touch for Women"],
  ["happychopardlemondulci", "Chopard Happy Chopard Lemon Dulci"],
  ["nomadenaturelleedp", "Chloé Nomade Naturelle Eau de Parfum"],
  ["dioraddictedt", "Dior Dior Addict Eau de Toilette"],
  ["cinema", "Yves Saint Laurent Cinéma"],
  ["starlight", "Aigner Starlight"],
  ["eternity", "Calvin Klein Eternity"],
  ["manifesto", "Yves Saint Laurent Manifesto"],
  ["paradisorosa", "Roberto Cavalli Paradiso Rosa"],
  ["intenseoud", "Gucci Intense Oud"],
  ["chopardrosemalaki", "Chopard Rose Malaki"],
  ["supremebouquet", "Yves Saint Laurent Supreme Bouquet"],
  ["irisdesyracuse", "Boucheron Iris de Syracuse"],
  ["tuxedosharppatchouli", "Yves Saint Laurent Tuxedo Sharp Patchouli"],
  ["ckeveryoneedt", "Calvin Klein CK Everyone Eau de Toilette"],
  ["memoireduneodeur", "Gucci Mémoire d’une Odeur"],
  ["costumenationalj", "Costume National Costume National J"],
  ["ckone", "Calvin Klein CK One"],
  ["tearsfromthemoon", "Gucci Tears From The Moon"],
  ["rougesantal", "Korloff Paris Rouge Santal"],
  ["easybakeintense", "Huda Beauty Easy Bake Intense"],
  ["muskmalaki", "Chopard Musk Malaki"],
  ["ckonegold", "Calvin Klein CK One Gold"],
  ["scentofgold", "Trussardi Scent of Gold"],
  ["officefm", "Fragrance One Office For Men"],
  ["pourunhommedecaron", "Caron Pour Un Homme de Caron"],
  ["intensecedratboise", "Mancera Intense Cedrat Boise"],
  ["castley", "Parfums de Marly Castley"],
  ["epicman", "Amouage Epic Man"],
  ["absoluaventus", "Creed Absolu Aventus"],
  ["greyvetiver", "Tom Ford Grey Vetiver"],
  ["quelquesfleursloriginal", "Houbigant Quelques Fleurs l'Original"],
  ["delinaexclusif", "Parfums de Marly Delina Exclusif"],
  ["goodgirlgonebadextreme", "By Kilian Good Girl Gone Bad Extreme"],
  ["palatine", "Parfums de Marly Palatine"],
  ["windflowers", "Creed Wind Flowers"],
  ["valayaexclusif", "Parfums de Marly Valaya Exclusif"],
  ["womaningold", "By Kilian Woman in Gold"],
  ["honourwoman", "Amouage Honour Woman"],
  ["rosesgreedy", "Mancera Roses Greedy"],
  ["armaniprivevertmalachite", "Giorgio Armani Armani Prive Vert Malachite"],
  ["ambreimperial", "Van Cleef & Arpels Ambre Impérial"],
  ["halfeti", "Penhaligon's Halfeti"],
  ["vibrato", "Sospiro Vibrato"],
  ["matsukita", "Clive Christian Matsukita"],
  ["deepamber", "Ramón Béjar Deep Amber"],
  ["blackstoneextraitdeparfum", "Ramón Béjar Black Stone Extrait de Parfum"],
  ["goldintensiveaoud", "Mancera Gold Intensive Aoud"],
  ["boisdore", "Van Cleef & Arpels Bois Doré"],
  ["brutus", "Orto Parisi Brutus"],
  ["aoudvanille", "Mancera Aoud Vanille"],
  ["oudtobacco", "Montale Oud Tobacco"],
  ["morningchess", "Vilhelm Parfumerie Morning Chess"],
  ["zafeeroudvanille", "Alexandre.J Zafeer Oud Vanille"],
  ["africanleather", "Memo Paris African Leather"],
  ["moroccanleather", "Memo Paris Moroccan Leather"],
  ["italianleather", "Memo Paris Italian Leather"],
  ["starrynights", "Montale Starry Nights"],
  ["interludeblackiris", "Amouage Interlude Black Iris"],
  ["oudrosewood", "Dior Oud Rosewood"],
  ["wildroseoud", "Mancera Wild Rose Oud"],
  ["aoudexclusif", "Mancera Aoud Exclusif"],
  ["wildroses", "The Woods Collection Wild Roses"],
  ["saharianwind", "Mancera Saharian Wind"],
  ["grischarnelextrait", "BDK Parfums Gris Charnel Extrait"],
  ["patchouliblanc", "Van Cleef & Arpels Patchouli Blanc"],
  ["sakura", "Dior Sakura"],
  ["lelionedp", "Chanel Le Lion Eau de Parfum"],
  ["laytonexclusif", "Parfums de Marly Layton Exclusif"],
  ["terroni", "Orto Parisi Terroni"],
  ["halfetileather", "Penhaligon's Halfeti Leather"],
  ["twilight", "The Woods Collection Twilight"],
  ["noirdenoir", "Tom Ford Noir de Noir"],
  ["armanipriverougemalachite", "Giorgio Armani Armani Prive Rouge Malachite"],
  ["marfa", "Memo Paris Marfa"],
  ["opera", "Xerjoff Opera"],
  ["lunefeline", "Atelier des Ors Lune Feline"],
  ["felino", "Carner Barcelona Felino"],
  ["roseomeyyade", "Atelier des Ors Rose Omeyyade"],
  ["nudaveritas", "Atelier des Ors Nuda Veritas"],
  ["teintdeneigeedp", "Lorenzo Villoresi Teint de Neige Eau de Parfum"],
  ["goldenoud", "Alexandre.J Golden Oud"],
  ["frenchleather", "Memo Paris French Leather"],
  ["patchouliintense", "Nicolai Parfumeur Createur Patchouli Intense"],
  ["royalwater", "Creed Royal Water"],
  ["leatherpatchouli", "Montale Leather Patchouli"],
  ["purelove", "Montale Pure Love"],
  ["ambraedp", "Acqua di Parma Ambra Eau de Parfum"],
  ["boccanera", "Orto Parisi Boccanera"],
  ["moonfever", "Memo Paris Moon Fever"],
  ["blacktoblack", "Mancera Black to Black"]
];
