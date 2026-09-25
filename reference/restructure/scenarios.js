/* Deterministic scenarios for the page: seeded ratings, stored language, backend on or off, and a
   sequence of clicks, searches and label pastes. Same seed, same scenario. */
"use strict";

function rng(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const int = n => Math.floor(next() * n);
  return { next, int, pick: arr => arr[int(arr.length)], chance: p => next() < p };
}

const STAGES = ["opening", "heart", "drydown"];
const AUTO_ENTRIES = [
  { id: "f_miller-harris-tea-tonique", name: "Tea Tonique", brand: "Miller Harris", gender: "unisex", oilType: "Eau de Toilette", image: "", vendorId: "TeaTonique",
    stages: { opening: { citrus_fresh: 0.8, spice_fresh: 0.3 }, heart: { green_herbal: 0.6, leather_smoky: 0.4 }, drydown: { white_musk: 0.6, cedar_dry: 0.5, woody_amber: 0.4 } }, source: "vendor" },
  { id: "f_lalique-encre-noire", name: "Encre Noire", brand: "Lalique", gender: "men", oilType: "Eau de Toilette", image: "https://img.example/encre.jpg", vendorId: "EncreNoire",
    stages: { opening: { green_herbal: 0.5 }, heart: { vetiver: 0.9 }, drydown: { vetiver: 0.8, white_musk: 0.5, woody_amber: 0.6 } }, source: "vendor" }
];
const NOTES_ENTRIES = [
  { id: "f_creed-green-irish-tweed", name: "Green Irish Tweed", brand: "Creed", gender: "men", oilType: "Eau de Parfum", notes: { top: ["Lemon Verbena", "Iris"], middle: ["Violet Leaf"], base: ["Ambergris", "Sandalwood"] }, accords: ["green", "fresh", "woody", "aromatic"], image: "", vendorId: "GreenIrishTweed", source: "fixture" },
  { id: "f_miller-harris-tea-tonique", name: "Tea Tonique", brand: "Miller Harris", gender: "unisex", oilType: "Eau de Toilette", notes: { top: ["Bergamot", "Lemon", "Nutmeg"], middle: ["Black Tea", "Birch", "Mate"], base: ["Musk", "Iso E Super", "Smoke"] }, accords: ["citrus", "aromatic", "smoky", "woody"], image: "", vendorId: "TeaTonique", source: "fixture" },
  { id: "f_x-oud-rose", name: "Oud Rose Test", brand: "House X", gender: "women", oilType: "Parfum", notes: { top: ["Saffron", "Pink Pepper"], middle: ["Turkish Rose", "Oud"], base: ["Vanilla", "Patchouli", "Cashmeran"] }, accords: [], image: "", vendorId: "x", source: "fixture" }
];

/* data: PP_DATA; labelTexts: ingredient lists; parse: PP_MATERIALS.parse */
function makeScenarios(n, seed0, data, labelTexts, parse, evidenceIds) {
  const ids = data.PERFUMES.map(p => p.id);
  const chips = data.CHIPS.map(c => c.id);
  const fams = Object.keys(data.FAMILIES);
  const out = [];
  for (let i = 0; i < n; i++) {
    const seed = seed0 + i;
    const R = rng(seed);
    const endpoint = R.chance(0.35) ? "http://mock.local/api" : "";
    const ratings = {};
    const k = i < 3 ? i : 1 + R.int(9);                    /* scenarios 0, 1, 2 hold 0, 1 and 2 perfumes */
    for (let j = 0; j < k; j++) {
      const id = R.chance(0.3) ? R.pick(evidenceIds) : R.pick(ids);
      const r = { opening: null, heart: null, drydown: null, again: null, chips: {} };
      for (const s of STAGES) if (R.chance(0.8)) r[s] = R.int(5) - 2;
      for (const s of STAGES) if (r[s] != null && r[s] <= 0 && R.chance(0.35)) r.chips[s] = [...new Set([R.pick(chips), R.pick(chips)])].slice(0, 1 + R.int(2));
      if (R.chance(0.3)) r.again = R.int(2);
      if (R.chance(0.12)) { const text = R.pick(labelTexts); const p = parse(text); r.label = { text, market: R.pick(["SA", "EU", "US", "OTHER"]), date: "2026-09-20", parsed: { format: p.format, stages: p.stages, absent: p.absent, presence: p.presence, materialsDeclared: p.materialsDeclared } }; }
      ratings[id] = r;
    }
    if (R.chance(0.2)) { const a = R.pick(AUTO_ENTRIES); ratings[a.id] = { opening: R.int(5) - 2, heart: null, drydown: R.int(5) - 2, again: null, chips: {}, auto: a }; }
    if (R.chance(0.15)) ratings["x_mystery-" + seed] = { opening: -1, heart: null, drydown: -2, again: null, chips: {}, custom: "Mystery " + seed };
    const storage = { pp_device: JSON.stringify("d_test" + seed), pp_ratings_v1: JSON.stringify(ratings) };
    if (R.chance(0.2)) storage.pp_flags_v1 = JSON.stringify({ [R.pick(fams)]: true });
    const langMode = R.int(3);
    if (langMode === 0) storage.pp_lang = JSON.stringify("ar"); else if (langMode === 1) storage.pp_lang = JSON.stringify("en");
    const navLang = R.chance(0.5) ? "ar-SA" : "en-GB";

    /* actions, tracking which ids are rated so most clicks hit real cards */
    const rated = new Set(Object.keys(ratings));
    const actions = [];
    const nAct = 3 + R.int(9);
    for (let a = 0; a < nAct; a++) {
      const kind = R.int(16);
      const anyRated = [...rated];
      const target = anyRated.length ? R.pick(anyRated) : null;
      if (kind <= 2 && target) actions.push({ click: { dataset: { rate: target, stage: R.pick(STAGES), v: String(R.int(5) - 2) } } });
      else if (kind === 3 && target) actions.push({ click: { dataset: { chip: R.pick(chips), rate: target, stage: R.pick(STAGES) } } });
      else if (kind === 4 && target) actions.push({ click: { dataset: { again: target, v: String(R.int(2)) } } });
      else if (kind === 5) { const id = endpoint && R.chance(0.3) ? R.pick(AUTO_ENTRIES).id : R.pick(ids); actions.push({ click: { dataset: { add: id } } }); rated.add(id); }
      else if (kind === 6 && target) { actions.push({ click: { dataset: { remove: target } } }); rated.delete(target); }
      else if (kind === 7) actions.push({ click: { id: R.chance(0.5) ? "lang-ar" : "lang-en" } });
      else if (kind === 8) actions.push({ click: { dataset: { flag: R.pick(fams) } } });
      else if (kind === 9 && target) actions.push({ click: { dataset: { flagperf: target } } });
      else if (kind === 10 && target) actions.push({ label: { id: target, text: R.pick(labelTexts), market: R.pick(["SA", "EU", "US", "OTHER"]) } });
      else if (kind === 11) actions.push({ input: R.pick(["amber", "cr", "رد", "tea", "xx", "sauvage", "عود", "lattafa", "  ", "encre"]) });
      else if (kind === 12) { const q = R.pick(["green irish tweed", "khamrah", "Unknown Scent 7", "ab", "tea tonique", "oud rose test"]); actions.push({ enter: q }); }
      else if (kind === 13) actions.push({ click: { id: "share" } });
      else if (kind === 14) { actions.push({ click: { id: "reset" } }); if (R.chance(0.5)) { actions.push({ click: { id: "reset" } }); rated.clear(); } else actions.push({ click: { id: "reset-keep" } }); }
      else actions.push({ escape: true });
    }
    out.push({ seed, endpoint, navLang, storage, actions });
  }
  return out;
}

/* Canned backend answers for scenarios with an endpoint. */
function respond(url, body) {
  if (!body) {
    if (url.includes("stats=1")) return { perfumes: { aventus: { n: 12, o: 1, h: 0.5, d: -0.25 }, khamrah: { n: 3, o: 2, h: 1, d: 1.5 }, br540: { n: 1, o: null, h: null, d: -2 } } };
    if (url.includes("catalogue=1")) return { entries: AUTO_ENTRIES.concat([{ id: "aventus", image: "https://img.example/aventus.jpg" }, { id: "bleuedp", image: "" }, null, { name: "no id" }]) };
    return {};
  }
  if (body.type === "lookup") {
    const q = String(body.q || "").toLowerCase();
    const e = NOTES_ENTRIES.find(x => x.name.toLowerCase() === q);
    return e ? { found: true, entry: e, cached: false } : { found: false, reason: "no_match" };
  }
  return { ok: true };
}

module.exports = { makeScenarios, respond, NOTES_ENTRIES, AUTO_ENTRIES, STAGES };
