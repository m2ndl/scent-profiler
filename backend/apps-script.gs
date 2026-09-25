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
const RATING_HEADERS = ["ts", "device", "lang", "perfume", "name", "opening", "heart", "drydown", "again", "chips_opening", "chips_heart", "chips_drydown"];
const CORRECTION_HEADERS = ["ts", "device", "lang", "family", "perfume", "perfumes"];
const CATALOGUE_HEADERS = ["ts", "id", "name", "brand", "gender", "oil_type", "image", "vendor_id", "stages_json", "source", "verified"];
const LABEL_HEADERS = ["ts", "device", "lang", "perfume", "name", "market", "date", "format", "text"];
const EVENT_HEADERS = ["ts", "device", "lang", "name", "n"];
const FRAGELLA_BASE = "https://api.fragella.com/api/v1";

function sheet_(name, headers) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); }
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
    clip_((chips.opening || []).join("|")), clip_((chips.heart || []).join("|")), clip_((chips.drydown || []).join("|"))
  ]);
  return json_({ ok: true });
}

/* GET ?stats=1      -> { perfumes: { <id>: { n, o, h, d } } }, last row per device+perfume, cached 5 min.
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
  const rows = sheet_("ratings", RATING_HEADERS).getDataRange().getValues().slice(1);
  const last = {};
  rows.forEach(r => { last[r[1] + "::" + r[3]] = r; });
  const agg = {};
  Object.values(last).forEach(r => {
    const id = r[3]; if (!id) return;
    const a = agg[id] || (agg[id] = { n: 0, so: 0, no: 0, sh: 0, nh: 0, sd: 0, nd: 0 });
    a.n++;
    if (r[5] !== "") { a.so += Number(r[5]); a.no++; }
    if (r[6] !== "") { a.sh += Number(r[6]); a.nh++; }
    if (r[7] !== "") { a.sd += Number(r[7]); a.nd++; }
  });
  const out = { perfumes: {} };
  Object.keys(agg).forEach(id => {
    const a = agg[id];
    out.perfumes[id] = { n: a.n, o: a.no ? a.so / a.no : null, h: a.nh ? a.sh / a.nh : null, d: a.nd ? a.sd / a.nd : null };
  });
  const text = JSON.stringify(out);
  cache.put("stats", text, 300);
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
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
  ["safariextreme", "Abdul Samad Al Qurashi Safari Extreme"]
];
