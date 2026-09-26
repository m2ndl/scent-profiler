/* Old page against new page, in lockstep, in the project's stub browser (tests/lib/dom.js).
   Each seeded visit loads the same page (the quiz or the profiler) from both trees with the same storage,
   backend and query, then takes the same actions: a click on a button or link drawn on the old page at that
   moment (chosen by the seed), typing in the search box, Enter, Escape, a label paste, running the timers,
   hiding the page. After every action it compares the whole page (every element the page wrote, html lang and
   dir, storage), every request and beacon, the clipboard, history, and any error thrown.
   Usage: node run_equiv.js <oldRoot> <newRoot> <visits> [firstSeed] [only: quiz|profile] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const [OLD, NEW] = [process.argv[2], process.argv[3]];
const VISITS = +(process.argv[4] || 100), SEED0 = +(process.argv[5] || 1), ONLY = process.argv[6] || "";
const { createPage } = require(path.join(NEW, "tests", "lib", "dom.js"));

const cache = {};
function scriptsOf(root, html) {
  const key = root + "|" + html; if (cache[key]) return cache[key];
  const doc = fs.readFileSync(path.join(root, "site", html), "utf8");
  return (cache[key] = [...doc.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: m[1], code: fs.readFileSync(path.join(root, "site", m[1]), "utf8") })));
}
function rng(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const int = n => Math.floor(next() * n);
  return { next, int, pick: arr => arr[int(arr.length)], chance: p => next() < p };
}

/* catalogue facts for building visits, from the old tree */
const W = (() => { const ctx = vm.createContext({}); vm.runInContext("globalThis.window = globalThis;", ctx); for (const n of ["data", "mapper", "materials", "evidence", "engine", "notes"]) vm.runInContext(fs.readFileSync(path.join(OLD, "site", "js", n + ".js"), "utf8"), ctx); return ctx; })();
const D = W.PP_DATA, IDS = D.PERFUMES.map(p => p.id), CHIPS = D.CHIPS.map(c => c.id), FAMS = Object.keys(D.FAMILIES);
const NOTE_IDS = D.QUIZ.notePicker.flatMap(s => s.notes.map(n => n.id));
const EVIDENCE_IDS = [...new Set(Object.keys(W.PP_EVIDENCE.book).concat(Object.keys(W.PP_EVIDENCE.label)))];
const LABELS = fs.readdirSync(path.join(OLD, "evidence", "labels")).filter(f => f.endsWith(".txt")).map(f => fs.readFileSync(path.join(OLD, "evidence", "labels", f), "utf8").split("\n").filter(l => !/^\w+:/.test(l)).join("\n").trim()).concat(["Alcohol Denat., Parfum, Aqua, Coumarin, Linalool, Limonene, Evernia Prunastri Extract, Vanillin, Benzyl Salicylate", "short"]);
const STAGES = ["opening", "heart", "drydown"];
const AUTO_ENTRIES = [
  { id: "f_miller-harris-tea-tonique", name: "Tea Tonique", house: "Miller Harris", brand: "Miller Harris", gender: "u", oilType: "Eau de Toilette", image: "", vendorId: "TeaTonique", auto: true,
    stages: { opening: { citrus_fresh: 0.8, spice_fresh: 0.3 }, heart: { green_herbal: 0.6, leather_smoky: 0.4 }, drydown: { white_musk: 0.6, cedar_dry: 0.5, woody_amber: 0.4 } }, source: "vendor" },
  { id: "f_lalique-encre-noire", name: "Encre Noire", house: "Lalique", brand: "Lalique", gender: "m", oilType: "Eau de Toilette", image: "https://img.example/encre.jpg", vendorId: "EncreNoire", auto: true,
    stages: { opening: { green_herbal: 0.5 }, heart: { vetiver: 0.9 }, drydown: { vetiver: 0.8, white_musk: 0.5, woody_amber: 0.6 } }, source: "vendor" }
];
const NOTES_ENTRIES = [
  { id: "f_creed-green-irish-tweed", name: "Green Irish Tweed", brand: "Creed", gender: "men", oilType: "Eau de Parfum", notes: { top: ["Lemon Verbena", "Iris"], middle: ["Violet Leaf"], base: ["Ambergris", "Sandalwood"] }, accords: ["green", "fresh", "woody", "aromatic"], image: "", vendorId: "GreenIrishTweed", source: "fixture" },
  { id: "f_x-oud-rose", name: "Oud Rose Test", brand: "House X", gender: "women", oilType: "Parfum", notes: { top: ["Saffron", "Pink Pepper"], middle: ["Turkish Rose", "Oud"], base: ["Vanilla", "Patchouli", "Cashmeran"] }, accords: [], image: "", vendorId: "x", source: "fixture" }
];
function respond(url, body) {
  if (!body) {
    if (url.includes("stats=1")) return { perfumes: { aventus: { n: 12, o: 1, h: 0.5, d: -0.25 }, khamrah: { n: 3, o: 2, h: 1, d: 1.5 } }, quiz: { n: 240, breakers: { woody_amber: 60, white_musk: 1, oud_animalic: 30 }, palates: { amber: 40, sweet: 30, "fresh-oud": 5, "oud-fresh": 7 } } };
    if (url.includes("catalogue=1")) return { entries: AUTO_ENTRIES.concat([{ id: "aventus", image: "https://img.example/aventus.jpg" }, { id: "bleuedp", image: "" }, null, { name: "no id" }]) };
    return {};
  }
  if (body.type === "lookup") {
    const q = String(body.q || "").toLowerCase();
    const e = NOTES_ENTRIES.find(x => x.name.toLowerCase() === q) || (q === "encre noire" ? AUTO_ENTRIES[1] : null);
    return e ? { found: true, entry: e } : { found: false };
  }
  return { ok: true };
}

function makeVisit(seed) {
  const R = rng(seed);
  const kind = ONLY || (R.chance(0.5) ? "quiz" : "profile");
  const endpoint = R.chance(0.45) ? "http://mock.local/api" : "";
  const storage = {};
  if (R.chance(0.85)) storage.pp_device = JSON.stringify("d_test" + seed);
  const lm = R.int(3); if (lm === 0) storage.pp_lang = JSON.stringify("ar"); else if (lm === 1) storage.pp_lang = JSON.stringify("en");
  const ratings = {}, k = R.chance(0.3) ? 0 : 1 + R.int(6);
  for (let j = 0; j < k; j++) {
    const id = R.chance(0.25) ? R.pick(EVIDENCE_IDS) : R.chance(0.3) ? R.pick(D.QUIZ.grid) : R.pick(IDS);
    const r = { opening: null, heart: null, drydown: null, again: null, chips: {} };
    for (const s of STAGES) if (R.chance(0.7)) r[s] = R.int(5) - 2;
    for (const s of STAGES) if (r[s] != null && r[s] <= 0 && R.chance(0.35)) r.chips[s] = [R.pick(CHIPS)];
    if (R.chance(0.3)) r.again = R.int(2);
    if (R.chance(0.2)) r.src = "quiz";
    if (R.chance(0.2)) r.noteAnswers = { [R.pick(FAMS)]: R.int(5) - 2 };
    if (R.chance(0.1)) r.unnoticed = [R.pick(["white_musk", "woody_amber", "cedar_dry"])];
    ratings[id] = r;
  }
  if (R.chance(0.15)) { const a = R.pick(AUTO_ENTRIES); ratings[a.id] = { opening: R.int(5) - 2, heart: null, drydown: R.int(5) - 2, again: null, chips: {}, auto: a }; }
  if (R.chance(0.1)) ratings["x_mystery-" + seed] = { opening: -1, heart: null, drydown: -2, again: null, chips: {}, custom: "Mystery " + seed };
  if (k || R.chance(0.5)) storage.pp_ratings_v1 = JSON.stringify(ratings);
  if (R.chance(0.4)) {
    const q = {};
    if (R.chance(0.7)) { q.notes = {}; for (let i = 0; i < 1 + R.int(5); i++) q.notes[R.pick(NOTE_IDS)] = R.chance(0.5) ? 1 : -1; }
    if (R.chance(0.5)) q.taste = R.pick(["bitter", "sweet", "both", "unsure"]);
    if (R.chance(0.5)) q.told = R.chance(0.2) ? R.pick(["none", "sweet"]) : [R.pick(["sweet", "chemical", "soapy", "heavy", "powdery", "smoky"])];
    if (R.chance(0.3)) q.anosmia = R.pick(["yes", "no", "unsure"]);
    storage.pp_quiz_v1 = JSON.stringify(q);
  }
  if (R.chance(0.15)) storage.pp_flags_v1 = JSON.stringify({ [R.pick(FAMS)]: true });
  const search = kind === "profile" && R.chance(0.15) ? "?add=" + (R.chance(0.5) ? R.pick(IDS) : AUTO_ENTRIES[0].id) : "";
  return { seed, kind, endpoint, storage, search, beacon: R.chance(0.8), steps: 12 + R.int(45), R };
}

const unesc = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
/* every button and data-carrying link drawn on the page, as click specs */
function candidates(snap) {
  const out = [];
  for (const el of Object.values(snap.els)) {
    for (const [tag] of (el.innerHTML || "").matchAll(/<(?:button|a)\b[^>]*>/g)) {
      if (/\sdisabled\b/.test(tag)) continue;
      const ds = {};
      for (const [, name, val] of tag.matchAll(/\sdata-([a-z-]+)="([^"]*)"/g)) ds[name.replace(/-([a-z])/g, (m, c) => c.toUpperCase())] = unesc(val);
      const idm = /\sid="([^"]+)"/.exec(tag);
      if (Object.keys(ds).length) out.push({ dataset: ds }); else if (idm) out.push({ id: idm[1] });
    }
  }
  return out;
}
const WEIGHT = d => d.continue || d.verdict || d.start || d.taste || d.anosmia ? 12 : d.told ? 3 : d.tile || d.na || d.pn || d.when || d.rate || d.chip || d.back || d.event ? 1 : 2;

function load(root, v) {
  const page = createPage({ localStorage: Object.assign({}, v.storage), endpoint: v.endpoint || undefined, respond, beacon: v.beacon ? undefined : false, search: v.search || undefined, navLang: "en-GB" });
  /* one clock and one random stream for both trees, so a new device id and the share text's date agree */
  vm.runInContext(`(function () { let s = 7; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const R = Date; Date = function (...a) { return a.length ? new R(...a) : new R(1790000000000); }; Date.now = () => 1790000000000; Date.prototype = R.prototype; })();`, page.ctx);
  let err = null;
  try { page.load(scriptsOf(root, v.kind === "quiz" ? "index.html" : "profile.html")); } catch (e) { err = "load: " + e.message; }
  return { page, err };
}
/* the new quiz's one addition, the More perfumes block, taken out before comparing: everything else must match */
const MORE_DIV = String.fromCharCode(10) + '      <div class="qmore" id="grid-more"></div>';
const strip = snap => { delete snap.els["grid-more"]; for (const e of Object.values(snap.els)) e.innerHTML = e.innerHTML.split(MORE_DIV).join(""); return snap; };
const state = (p, err, isNew) => JSON.stringify({ snap: isNew ? strip(p.snapshot()) : p.snapshot(), calls: p.calls, clip: p.clipboard, hist: p.history, err });
function firstDiff(a, b) { let i = 0; while (i < a.length && a[i] === b[i]) i++; return "\n   old: " + a.slice(Math.max(0, i - 160), i + 160) + "\n   new: " + b.slice(Math.max(0, i - 160), i + 160); }

(async () => {
  let same = 0, differ = 0, steps = 0, errors = 0, posts = 0, beacons = 0;
  const kinds = {}, screens = new Set();
  for (let i = 0; i < VISITS; i++) {
    const v = makeVisit(SEED0 + i), R = v.R;
    const A = load(OLD, v), B = load(NEW, v);
    const ok = (label, ea, eb) => { const sa = state(A.page, ea), sb = state(B.page, eb, true); steps++; if (sa === sb) return true; console.log(`seed ${v.seed} (${v.kind}) differs after ${label}:${firstDiff(sa, sb)}`); return false; };
    await A.page.settle(); await B.page.settle();
    let good = ok("load", A.err, B.err);
    for (let s = 0; good && s < v.steps; s++) {
      const snap = A.page.snapshot(), cands = candidates(snap);
      const quizEl = snap.els.quiz && snap.els.quiz.innerHTML; if (quizEl) { const m = [["start", /data-start=/], ["grid", /id="tiles"/], ["verdicts", /data-verdict=/], ["notes", /data-nskip=/], ["narrow", /data-skip=/], ["picker", /data-pn=/], ["taste", /data-taste=/], ["told", /data-told=/], ["anosmia", /data-anosmia=/], ["reveal", /qreveal-intro/], ["result", /class="qresult"/], ["result-picks", /class="rec qpick"/], ["result-testers", /class="rec tester"/], ["palate", /qname-hero/]].filter(([, re]) => re.test(quizEl)); for (const [n] of m) screens.add(n); }
      let action; const roll = R.next();
      if (roll < 0.06) action = { input: R.pick(["amber", "cr", "رد", "tea", "sauvage", "عود", "lattafa", "  ", "encre", "dior"]) };
      else if (roll < 0.09) action = { enter: R.pick(["green irish tweed", "khamrah", "Unknown Scent 7", "ab", "oud rose test", "encre noire", "yara"]) };
      else if (roll < 0.1) action = { escape: true };
      else if (roll < 0.14) action = { flush: true };
      else if (roll < 0.15) action = { hide: true };
      else if (roll < 0.22 && v.kind === "profile") action = { click: { id: R.pick(["share", "reset", "reset-keep", "lang-en", "lang-ar"]) } };
      else if (roll < 0.25) action = { click: { id: R.pick(["lang-en", "lang-ar"]) } };
      else if (cands.length) {
        const total = cands.reduce((t, c) => t + (c.dataset ? WEIGHT(c.dataset) : 1), 0);
        let x = R.next() * total, c = cands[0];
        for (const cand of cands) { x -= cand.dataset ? WEIGHT(cand.dataset) : 1; if (x <= 0) { c = cand; break; } }
        action = { click: c };
        if (c.dataset && c.dataset.readlabel) action.label = { id: c.dataset.readlabel, text: R.pick(LABELS), market: R.pick(["SA", "EU", "US", "OTHER"]) };
      } else action = { flush: true };
      const k = action.click ? "click:" + (action.click.id || Object.keys(action.click.dataset).join("+")) : Object.keys(action)[0];
      kinds[k] = (kinds[k] || 0) + 1;
      const run = side => { try {
        const p = side.page;
        if (action.label) { p.setValue("lbl-" + action.label.id, action.label.text); p.setValue("lblm-" + action.label.id, action.label.market); }
        if (action.click) p.click(action.click);
        else if (action.input != null) p.input(action.input);
        else if (action.enter) p.key("Enter", action.enter);
        else if (action.escape) p.key("Escape");
        else if (action.flush) p.flushTimers();
        else if (action.hide) p.hide();
        return null;
      } catch (e) { return String(e && e.message || e); } };
      const ea = run(A), eb = run(B); if (ea) errors++;
      await A.page.settle(); await B.page.settle();
      good = ok(JSON.stringify(action).slice(0, 140), ea, eb);
    }
    if (good) {
      const end = side => { try { side.page.flushTimers(); side.page.hide(); side.page.fire("pagehide"); return null; } catch (e) { return String(e.message); } };
      const ea = end(A), eb = end(B); await A.page.settle(); await B.page.settle();
      good = ok("end", ea, eb);
    }
    posts += A.page.calls.filter(c => c.method === "POST").length; beacons += A.page.calls.filter(c => c.method === "BEACON").length;
    if (good) same++; else { differ++; if (differ >= 5) { console.log("stopping after 5 differing visits"); break; } }
  }
  console.log(`\n${same} visits identical, ${differ} different; ${steps} page states compared; ${errors} handler errors (identical on both sides); ${posts} POSTs and ${beacons} beacons sent by the old page`);
  console.log("quiz screens reached:", [...screens].sort().join(" "));
  console.log("actions:", JSON.stringify(Object.fromEntries(Object.entries(kinds).sort((a, b) => b[1] - a[1]))));
})().catch(e => { console.error(e); process.exit(1); });
