/* The quiz, the front page (site/index.html), under the stub browser (lib/dom.js), loaded exactly as the page loads it:
   the grid, verdicts written as ratings, the note rows, the narrowing round, the note picker, taste,
   complaints and anosmia answers, Back, the result and testers, what is sent to a backend, and the profiler
   reading the quiz's ratings. Assertions read the HTML the page wrote (page.snapshot()). */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { SITE, loadSite } = require("../tools/lib/site");
const { createPage } = require("./lib/dom");

const scriptsOf = file => [...fs.readFileSync(path.join(SITE, file), "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
const quizScripts = scriptsOf("index.html"), appScripts = scriptsOf("profile.html");
const W = loadSite("data", "mapper", "materials", "evidence", "engine", "notes");
const D = W.PP_DATA, E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE), N = W.PP_NOTES.create(D, W.PP_MAP, E);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const blank = { opening: null, heart: null, drydown: null, again: null, chips: {} };
const seed = extra => Object.assign({ pp_device: JSON.stringify("d_test"), pp_lang: JSON.stringify("en") }, extra || {});
/* the quiz opens on its start screen; open() presses Start unless atStart is set */
const start = p => p.click({ dataset: { start: "1" } });
const open = opts => { const p = createPage(Object.assign({ localStorage: seed() }, opts)); p.load(quizScripts); if (!(opts && opts.atStart)) start(p); return p; };
const html = page => page.snapshot().els.quiz.innerHTML;
const stored = (page, key) => JSON.parse(page.localStorage.getItem(key || "pp_ratings_v1"));
const ENDPOINT = "http://mock.local/api";

/* Sauvage turned on the wearer hours later, with a chemical complaint; Yara is still worn. Both note screens
   are left with Next and nothing answered. */
function twoBottles(page) {
  page.click({ dataset: { tile: "sauvageedp" } });
  page.click({ dataset: { tile: "yara" } });
  page.click({ dataset: { continue: "1" } });
  assert.match(html(page), new RegExp(`<h1 class="qname">${reEsc(esc(E.byId.sauvageedp.name))}</h1>`));
  page.click({ dataset: { verdict: "turned" } });
  page.click({ dataset: { when: "drydown" } });
  page.click({ dataset: { chip: "chemical", stage: "drydown" } });
  page.click({ dataset: { continue: "1" } });
  assert.match(html(page), /data-nskip="1"/, "Sauvage's note screen");
  page.click({ dataset: { continue: "1" } });
  assert.match(html(page), new RegExp(`<h1 class="qname">${reEsc(esc(E.byId.yara.name))}</h1>`));
  page.click({ dataset: { verdict: "still" } });
  assert.match(html(page), /data-nskip="1"/, "Yara's note screen");
  page.click({ dataset: { continue: "1" } });
}
/* From the narrowing round or the note picker to the result: the narrowing skipped, every picker card left as it
   is, then the taste, complaints and anosmia answers. */
function finish(page, o) {
  o = Object.assign({ taste: "unsure", told: ["unsure"], anosmia: "no" }, o);
  if (/data-skip="1"/.test(html(page))) page.click({ dataset: { skip: "1" } });
  for (let i = 0; i < D.QUIZ.notePicker.length && /data-pn=/.test(html(page)); i++) page.click({ dataset: { continue: "1" } });
  assert.match(html(page), /When a perfume leans one way, which do you prefer\?/);
  page.click({ dataset: { taste: o.taste } });
  assert.match(html(page), /Which of these have bothered you in a perfume\? Pick all that apply\./);
  for (const c of o.told) page.click({ dataset: { told: c } });
  page.click({ dataset: { continue: "1" } });
  assert.match(html(page), /Do people say a perfume is strong on you when you can barely smell it\?/);
  page.click({ dataset: { anosmia: o.anosmia } });
}
/* the events a test checks by sequence; the screen-reached and result events have their own test */
const counted = c => c.body && c.body.type === "event" && !/^(reach|result):/.test(c.body.name);
const events = page => page.calls.filter(counted).map(c => [c.body.name, c.body.n]);

test("the front page (the quiz) loads its scripts in order and the grid shows the twenty bottles; rated ones cannot be answered", () => {
  assert.deepEqual(quizScripts.map(s => s.filename), ["js/config.js", "js/data.js", "js/mapper.js", "js/materials.js", "js/evidence.js", "js/engine.js", "js/notes.js", "js/bottles.js", "js/quiz.js"]);
  const src = fs.readFileSync(path.join(SITE, "js", "quiz.js"), "utf8");
  assert.doesNotMatch(src, /querySelector/);
  assert.doesNotMatch(src, /<button(?![^>]*type="button")/, "every button is type=button");
  const page = open();
  const tiles = page.snapshot().els.tiles.innerHTML;
  assert.deepEqual([...tiles.matchAll(/data-tile="([^"]+)"/g)].map(m => m[1]), [...D.QUIZ.grid]);
  const qs = (fs.readFileSync(path.join(SITE, "index.html"), "utf8") + html(page)).match(/id="q"/g) || [];
  assert.equal(qs.length, 1, "one search box");

  /* a record with a stage set is rated; an all-null one (left by a tester link) is not */
  const seeded = open({ localStorage: seed({ pp_ratings_v1: JSON.stringify({ sauvageedp: Object.assign({}, blank, { drydown: -1 }), yara: blank }) }) });
  seeded.click({ dataset: { tile: "sauvageedp" } });
  seeded.click({ dataset: { tile: "yara" } });
  const t2 = seeded.snapshot().els.tiles.innerHTML;
  assert.match(t2, /data-tile="sauvageedp" aria-pressed="false" disabled>[\s\S]*?already rated/);
  assert.match(t2, /data-tile="yara" aria-pressed="true">/);
});

test("two bottles: verdicts written as ratings, a narrowing round, then the told questions and the result", () => {
  const page = open();
  twoBottles(page);
  const r = stored(page);
  assert.deepEqual(r.sauvageedp, { opening: null, heart: null, drydown: -2, again: 0, chips: { drydown: ["chemical"] }, src: "quiz" });
  assert.deepEqual(r.yara, { opening: null, heart: null, drydown: 1, again: 1, chips: {}, src: "quiz" });

  const offered = [...html(page).matchAll(/data-tile="([^"]+)"/g)].map(m => m[1]);
  assert.ok(offered.length >= 1 && offered.length <= 4, `narrowing offers 1 to 4 tiles, got ${offered.length}`);
  for (const id of offered) assert.ok((E.byId[id].stages.drydown.woody_amber || 0) >= 0.6, `${id} holds woody ambers in its drydown`);

  assert.match(html(page), /data-skip="1">None of these, or I don&#39;t know them</);
  finish(page, { told: ["chemical"] });

  const h = html(page);
  assert.match(h, new RegExp(`<b>${reEsc(esc(D.FAMILIES.woody_amber.en))}</b><span class="pill warn">Possible deal-breaker</span></div><div class="hint">${reEsc(esc(E.byId.sauvageedp.name))} <span class="src">\\(from what you wore\\)</span>`));
  assert.match(h, /<div>Has bothered you: sharp \/ chemical <span class="src">\(from what you told us\)<\/span><\/div>/);
  assert.doesNotMatch(h, /class="qnote"/, "no anosmia note when the answer is no");
  const prof = E.computeProfile({ ratings: r, auto: {}, images: {}, told: N.toldItems(stored(page, "pp_quiz_v1")) });
  const { picks } = E.recommend(prof, r, N.avoidedNotes(stored(page, "pp_quiz_v1")));
  assert.equal(picks.length, 3);
  assert.equal((h.match(/<div class="rec qpick">/g) || []).length, 3);
  let at = -1;
  for (const p of picks) { const i = h.indexOf(`<b>${esc(p.P.name)}</b>`); assert.ok(i > at, `${p.P.id} shown in rank order`); at = i; }
  assert.match(h, /<a class="btn qfull" href="profile\.html#sec-profile">See the full profile</);
  assert.ok(h.indexOf('class="recs') < h.indexOf('class="btn qfull"') && h.indexOf('class="btn qfull"') < h.indexOf("data-sharecard"), "the full profile comes straight after the picks");
});

test("zero bottles: three testers ordered by the told complaint, no recommendations, answers kept on the device", () => {
  const page = open();
  page.click({ dataset: { none: "1" } });
  finish(page, { told: ["sweet"], anosmia: "yes" });
  const h = html(page);
  assert.match(h, /Your profile comes from perfumes you have worn, so it cannot be built yet\./);
  assert.doesNotMatch(h, /<div class="rec">/, "no recommendations");
  const cards = h.split('<div class="rec tester">').slice(1);
  assert.equal(cards.length, 3);
  const by = f => D.QUIZ.testers.find(x => x.family === f);
  const expected = [by("vanilla_gourmand"), by("woody_amber"), by("white_musk")];
  cards.forEach((card, i) => {
    const x = expected[i], P = E.byId[x.id];
    const links = /<div class="links">([\s\S]*?)<\/div>/.exec(card)[1];
    const q = encodeURIComponent(P.house + " " + P.name);
    const hrefs = [...links.matchAll(/href="([^"]*)"[^>]*data-event="tester:([^"]+)"/g)];
    assert.equal(hrefs.length, 3, `${x.id}: three links`);
    for (const [, href, id] of hrefs) { assert.ok(href.includes(q), `${x.id}: ${href} carries the encoded house and name`); assert.equal(id, x.id); }
    const n = E.PERFUMES.filter(o => o.id !== x.id && ((o.stages.drydown[x.family] || 0) >= 0.5 || (o.stages.heart[x.family] || 0) >= 0.7)).length;
    assert.match(card, new RegExp(`If this bothers you, ${n} other perfumes in our catalogue carry the same family in their base\\.`));
    assert.match(card, new RegExp(`href="profile\\.html\\?add=${x.id}">Rate it when you have worn it<`));
  });
  assert.deepEqual(stored(page, "pp_quiz_v1"), { taste: "unsure", told: ["sweet"], anosmia: "yes" });
  assert.match(h, new RegExp(`<div class="qnote">[^<]*${reEsc(esc(E.byId[by("white_musk").id].name))}`));
  assert.equal(page.localStorage.getItem("pp_ratings_v1"), null, "nothing written");
});

test("with a backend: ratings carry src and nothing else of the page's, events carry the right n, hiding sends pending ratings, the lookup keeps no notes", async () => {
  const lookedUp = { id: "f_test-house-lookup-scent", name: "Lookup Scent", brand: "Test House", gender: "men", oilType: "Eau de Parfum", notes: { top: ["Lemon Verbena", "Iris"], middle: ["Violet Leaf"], base: ["Ambergris", "Sandalwood"] }, accords: ["green", "woody"], image: "", vendorId: "GIT", source: "vendor" };
  const respond = (url, body) => {
    if (!body) return url.includes("catalogue=1") ? { entries: [{ id: "sauvageedp", name: "Sauvage", brand: "Dior", image: "https://img.example/sauvage.jpg" }] } : {};
    if (body.type === "lookup") return body.q.toLowerCase() === "lookup scent" ? { found: true, entry: lookedUp, cached: false } : { found: false };
    return { ok: true };
  };
  /* a shipped bottle photo wins over the backend's image; without one, the backend's image shows */
  const shipped = open({ endpoint: ENDPOINT, respond });
  await shipped.settle();
  assert.match(shipped.snapshot().els.tiles.innerHTML, /data-tile="sauvageedp"[^>]*><img class="thumb photo[^"]*" src="img\/bottles\/sauvageedp\.webp"/, "shipped photo on the tile");
  const page = createPage({ localStorage: seed(), endpoint: ENDPOINT, respond });
  page.load(quizScripts.map(s => s.filename === "js/bottles.js" ? { filename: s.filename, code: "window.PP_BOTTLES = {};" } : s));
  start(page);
  await page.settle();
  assert.match(page.snapshot().els.tiles.innerHTML, /data-tile="sauvageedp"[^>]*><img class="thumb photo[^"]*" src="https:\/\/img\.example\/sauvage\.jpg"/, "catalogue image on the tile");

  page.input("lookup scent");
  assert.doesNotMatch(page.snapshot().els.results.innerHTML, /data-add=/);
  page.key("Enter", "lookup scent");
  await page.settle();
  const tagcache = page.calls.find(c => c.body && c.body.type === "tagcache");
  assert.ok(tagcache, "derived weights posted back");
  assert.equal(tagcache.body.id, lookedUp.id);
  for (const k of ["notes", "accords"]) assert.equal(k in tagcache.body, false, `tagcache must not carry ${k}`);
  assert.match(page.snapshot().els.tiles.innerHTML, new RegExp(`data-tile="${lookedUp.id}" aria-pressed="true"`));
  page.click({ dataset: { tile: lookedUp.id } });
  page.key("Enter", "Zz no such scent");
  await page.settle();
  assert.match(page.snapshot().els.toast.textContent, /on your profile./);

  twoBottles(page);
  page.hide();
  const ratings = page.calls.filter(c => c.body && c.body.type === "rating");
  assert.deepEqual(ratings.map(c => `${c.method} ${c.body.perfume}`).sort(), ["BEACON sauvageedp", "BEACON yara"]);
  for (const c of ratings) {
    assert.equal(c.body.src, "quiz");
    for (const k of ["auto", "label"]) assert.equal(k in c.body, false, `rating must not carry ${k}`);
  }
  assert.deepEqual(ratings.find(c => c.body.perfume === "sauvageedp").body.chips, { drydown: ["chemical"] });
  page.flushTimers();
  assert.equal(page.calls.filter(c => c.body && c.body.type === "rating").length, 2, "a flushed rating is not sent again");

  finish(page, { taste: "both", told: ["sweet"], anosmia: "yes" });
  const first = /data-event="sample:([^"]+)"/.exec(html(page))[1];
  page.click({ dataset: { event: "sample:" + first } });
  const rows = id => N.questions(E.byId[id], "worn").length;
  assert.deepEqual(events(page), [["quiz_grid", 2], ["verdict:turned", 1], ["notes:0", rows("sauvageedp")], ["verdict:still", 0], ["notes:0", rows("yara")],
    ["taste:both", 0], ["told:sweet", 0], ["anosmia:yes", 0], ["quiz_done", 2], ["sample:" + first, 1]]);
  for (const c of page.calls.filter(c => c.body && c.body.type === "event")) assert.deepEqual(Object.keys(c.body).sort(), ["device", "lang", "n", "name", "type"]);
});

test("the profiler shows the quiz's ratings, drops src when one is changed there, and adds ?add= perfumes", async () => {
  const quiz = open();
  twoBottles(quiz);
  const st = quiz.localStorage.dump();

  const prof = createPage({ localStorage: st });
  prof.load(appScripts);
  const rated = prof.snapshot().els.rated.innerHTML;
  assert.match(rated, /data-rate="sauvageedp" data-stage="drydown" data-v="-2" aria-pressed="true"/);
  assert.match(rated, /data-chip="chemical" data-rate="sauvageedp" data-stage="drydown" aria-pressed="true"/);
  assert.match(rated, /data-rate="yara" data-stage="drydown" data-v="1" aria-pressed="true"/);
  assert.match(rated, /data-again="yara" data-v="1" aria-pressed="true"/);
  prof.click({ dataset: { rate: "yara", stage: "heart", v: "2" } });
  assert.equal("src" in stored(prof).yara, false, "rate drops src");
  assert.equal(stored(prof).sauvageedp.src, "quiz");
  prof.click({ dataset: { chip: "powdery", rate: "sauvageedp", stage: "drydown" } });
  assert.equal("src" in stored(prof).sauvageedp, false, "chip drops src");
  const again = createPage({ localStorage: st });
  again.load(appScripts);
  again.click({ dataset: { again: "yara", v: "0" } });
  assert.equal("src" in stored(again).yara, false, "again drops src");

  const added = createPage({ localStorage: seed(), search: "?add=sauvageedp" });
  added.load(appScripts);
  await added.settle();
  assert.deepEqual(stored(added).sauvageedp, blank);
  assert.equal(added.history.length, 1);
  assert.doesNotMatch(added.history[0].url, /add=/);

  /* a looked-up id is added once the lazy catalogue is in; the endpoint parameter stays */
  const cached = { id: "f_lalique-encre-noire", name: "Encre Noire", brand: "Lalique", gender: "men", oilType: "", image: "", vendorId: "EN", stages: { opening: {}, heart: { vetiver: 0.9 }, drydown: { vetiver: 0.8, woody_amber: 0.6 } }, source: "vendor" };
  const lazy = createPage({ localStorage: seed(), search: "?add=" + cached.id, endpoint: ENDPOINT, respond: (url, body) => (!body && url.includes("catalogue=1") ? { entries: [cached] } : {}) });
  lazy.load(appScripts);
  assert.equal(stored(lazy), null, "not in the catalogue before it loads");
  await lazy.settle();
  assert.equal(stored(lazy)[cached.id].auto.id, cached.id);
  assert.equal(lazy.history.length, 1);
  assert.match(lazy.history[0].url, /endpoint=/);
  assert.doesNotMatch(lazy.history[0].url, /add=/);
});

test("language: Arabic is the default on an English device; a stored English choice is kept", () => {
  for (const [scripts, host] of [[quizScripts, "quiz"], [appScripts, "rated"]]) {
    const fresh = createPage({ localStorage: { pp_device: JSON.stringify("d_test") }, navLang: "en-US" });
    fresh.load(scripts);
    const snap = fresh.snapshot();
    assert.equal(snap.html.lang, "ar", host);
    assert.equal(snap.html.dir, "rtl", host);
    assert.match(snap.els.brand.innerHTML, /^محلل الذائقة العطرية<small>/, host);
  }
  const chosen = createPage({ localStorage: seed(), navLang: "ar-SA" });
  chosen.load(quizScripts);
  assert.equal(chosen.snapshot().html.lang, "en", "a visitor who chose English keeps it");
});

test("language: the Arabic toggle sets rtl, is stored, and the tiles show Arabic names", () => {
  const page = open();
  page.click({ id: "lang-ar" });
  const snap = page.snapshot();
  assert.equal(snap.html.dir, "rtl");
  assert.equal(snap.html.lang, "ar");
  assert.equal(JSON.parse(page.localStorage.getItem("pp_lang")), "ar");
  for (const id of D.QUIZ.grid) assert.match(snap.els.tiles.innerHTML, new RegExp(`data-tile="${id}"[^>]*>[^]*?<span class="qtile-name">${reEsc(esc(E.byId[id].ar))}</span>`));
  assert.equal(snap.els["nav-profiler"].textContent, "ملفك العطري");
  page.click({ id: "lang-en" });
  assert.equal(page.snapshot().html.dir, "ltr");
});

test("mirror: a quiz rating record has the profiler's keys plus src", () => {
  const quiz = open({ endpoint: ENDPOINT, respond: () => ({ ok: true }) });
  quiz.click({ dataset: { tile: "yara" } });
  quiz.click({ dataset: { continue: "1" } });
  quiz.click({ dataset: { verdict: "still" } });
  quiz.flushTimers();
  const q = quiz.calls.find(c => c.body && c.body.type === "rating").body;
  const app = createPage({ localStorage: seed({ pp_ratings_v1: JSON.stringify({ yara: blank }) }), endpoint: ENDPOINT, respond: () => ({ ok: true }) });
  app.load(appScripts);
  app.click({ dataset: { rate: "yara", stage: "drydown", v: "1" } });
  app.flushTimers();
  const a = app.calls.find(c => c.body && c.body.type === "rating").body;
  assert.deepEqual(Object.keys(q).sort(), Object.keys(a).concat("src").sort());
});

test("search: Enter on a picked or rated name keeps the catalogue bottle and looks nothing up", async () => {
  const vendorDup = { id: "f_dior-sauvage", name: "Sauvage Eau de Parfum", brand: "Dior", gender: "men", oilType: "Eau de Parfum", notes: { top: ["Bergamot"], middle: ["Lavender"], base: ["Ambroxan"] }, accords: ["woody"], image: "", vendorId: "DS", source: "vendor" };
  const respond = (url, body) => (body && body.type === "lookup" ? { found: true, entry: vendorDup, cached: false } : {});
  const page = open({ localStorage: seed({ pp_ratings_v1: JSON.stringify({ hawaselixir: Object.assign({}, blank, { drydown: 1 }) }) }), endpoint: ENDPOINT, respond });
  await page.settle();
  page.click({ dataset: { tile: "sauvageedp" } });
  page.key("Enter", "Sauvage Eau de Parfum");
  await page.settle();
  page.key("Enter", "Hawas Elixir");
  await page.settle();
  assert.equal(page.calls.filter(c => c.body && c.body.type === "lookup").length, 0, "no lookup");
  assert.deepEqual([...page.snapshot().els.tiles.innerHTML.matchAll(/data-tile="([^"]+)" aria-pressed="true"/g)].map(m => m[1]), ["sauvageedp"]);
  assert.match(page.snapshot().els.toast.textContent, /Already rated/);
});

test("shop verdict: opening -1, and the result names the bottle as a shop trial in both languages", () => {
  const page = open();
  page.click({ dataset: { tile: "hawas" } });
  page.click({ dataset: { continue: "1" } });
  page.click({ dataset: { verdict: "shop" } });
  page.click({ dataset: { continue: "1" } });
  assert.deepEqual(stored(page).hawas, { opening: -1, heart: null, drydown: null, again: null, chips: {}, src: "quiz" });
  /* a shop trial is asked only about its opening and heart */
  const shopRows = N.questions(E.byId.hawas, "shop");
  assert.ok(shopRows.length >= 1 && shopRows.every(r => r.stage !== "drydown"));
  assert.equal((html(page).match(/<div class="nrow">/g) || []).length, shopRows.length);
  page.click({ dataset: { continue: "1" } });
  finish(page, { told: ["none"] });
  const h = html(page);
  assert.match(h, new RegExp(`<div class="hint">${reEsc(esc(E.byId.hawas.name))} <span class="src">\\(from a shop trial\\)</span></div>`));
  assert.doesNotMatch(h, /from what you wore/);
  page.click({ id: "lang-ar" });
  assert.match(html(page), new RegExp(`<div class="hint">${reEsc(esc(E.byId.hawas.ar))} <span class="src">\\(من تجربة في متجر\\)</span></div>`));

  /* the same record made on the profiler (no src) is a wear, not a shop trial */
  const prof = open({ localStorage: seed({ pp_ratings_v1: JSON.stringify({ hawas: Object.assign({}, blank, { opening: -1 }) }) }) });
  prof.click({ dataset: { none: "1" } });
  finish(prof, { told: ["none"] });
  assert.match(html(prof), new RegExp(`<div class="hint">${reEsc(esc(E.byId.hawas.name))} <span class="src">\\(from what you wore\\)</span></div>`));
  assert.doesNotMatch(html(prof), /from a shop trial/);
});

test("the anosmia note's tester link sends n = 0, apart from the tester card's position", () => {
  const page = open({ endpoint: ENDPOINT, respond: () => ({ ok: true }) });
  page.click({ dataset: { none: "1" } });
  finish(page, { told: ["none"], anosmia: "yes" });
  const id = D.QUIZ.testers.find(x => x.family === "white_musk").id;
  assert.match(html(page), new RegExp(`<div class="qnote">[^]*?data-note="1" data-event="tester:${id}"`));
  page.click({ dataset: { event: "tester:" + id } });
  page.click({ dataset: { event: "tester:" + id, note: "1" } });
  const sent = page.calls.filter(c => c.body && c.body.type === "event" && c.body.name === "tester:" + id).map(c => c.body.n);
  assert.deepEqual(sent, [D.QUIZ.testers.findIndex(x => x.id === id) + 1, 0]);
});

test("the full run: note rows on the first bottle, skip the rest, the picker, taste, complaints and the result", () => {
  const page = open({ endpoint: ENDPOINT, respond: () => ({ ok: true }) });
  page.click({ dataset: { tile: "sauvageedp" } });
  page.click({ dataset: { tile: "yara" } });
  page.click({ dataset: { continue: "1" } });
  assert.match(html(page), /<span class="qpart">Part 1 of 4 · Your bottles<\/span>/);
  page.click({ dataset: { verdict: "turned" } });
  page.click({ dataset: { when: "drydown" } });
  page.click({ dataset: { continue: "1" } });

  /* Sauvage's rows from notes.js, one per family, in the page's words */
  const sauvage = E.byId.sauvageedp, rows = N.questions(sauvage, "worn");
  let h = html(page);
  assert.match(h, new RegExp(`Four notes from ${reEsc(esc(sauvage.name))}\\. Tap what you remember; skip what you don&#39;t\\.`));
  assert.equal((h.match(/<div class="nrow">/g) || []).length, rows.length);
  assert.match(h, new RegExp(`<span class="nstage">Hours later</span> · <b>ambroxan</b> · <span class="nfam">${reEsc(esc(D.FAMILIES.woody_amber.en))}</span>`));
  assert.match(h, /data-na="woody_amber" data-v="u" aria-pressed="false">Didn&#39;t notice it</);
  assert.match(h, /data-nskip="1">Skip the notes for this bottle</);
  assert.doesNotMatch(h, /data-nskipall/, "no skip-all link on the first bottle");
  page.click({ dataset: { na: "lavender_aromatic", v: "2" } });
  page.click({ dataset: { na: "citrus_fresh", v: "-2" } });
  page.click({ dataset: { na: "woody_amber", v: "u" } });
  h = html(page);
  assert.equal((h.match(/<div class="nrow done">/g) || []).length, 3, "answered rows collapse");
  assert.match(h, /<span class="npick">Didn&#39;t notice it<\/span><button type="button" class="qlink" data-nedit="woody_amber">Change</);
  page.click({ dataset: { nedit: "citrus_fresh" } });
  assert.match(html(page), /data-na="citrus_fresh" data-v="-2" aria-pressed="true">Hated it</, "Change reopens the row with its answer");
  page.click({ dataset: { continue: "1" } });

  page.click({ dataset: { verdict: "still" } });
  assert.match(html(page), /data-nskipall="1">Skip notes for the other bottles</);
  page.click({ dataset: { nskipall: "1" } });

  /* the picker hides the notes already answered on Sauvage's rows, and shows ten cards before "More notes" */
  h = html(page);
  assert.match(h, /<span class="qpart">Part 2 of 4 · Notes you know · 1 of 5<\/span>/);
  assert.match(h, /<h1>Citrus and fresh<\/h1>/);
  assert.doesNotMatch(h, /data-pn="bergamot"/, "bergamot was answered on a bottle row");
  assert.match(h, /data-pn="lemon" data-pv="0" aria-pressed="true">Not sure</);
  const cardsOn = x => [...x.matchAll(/data-pn="([^"]+)" data-pv="0"/g)].map(m => m[1]);
  assert.equal(cardsOn(h).length, 10);
  assert.doesNotMatch(h, /data-pn="petitgrain"/, "the screen's last card waits behind More notes");
  page.click({ dataset: { pn: "lemon", pv: "1" } });
  page.click({ dataset: { pn: "tea", pv: "1" } });
  assert.match(html(page), /data-pn="tea" data-pv="1" aria-pressed="true">I enjoy it</);
  const more = /data-pmore="1">More notes \((\d+)\)</.exec(html(page));
  assert.ok(more, "a More notes button");
  page.click({ dataset: { pmore: "1" } });
  h = html(page);
  assert.match(h, /<h1>Citrus and fresh<\/h1>/, "More notes opens the rest on the same screen");
  assert.equal(cardsOn(h).length, 10 + Number(more[1]));
  assert.match(h, /data-pn="petitgrain" data-pv="0"/);
  assert.doesNotMatch(h, /data-pmore=/);
  assert.match(h, /data-pn="lemon" data-pv="1" aria-pressed="true">I enjoy it</, "answers stay when the screen opens");
  page.click({ dataset: { continue: "1" } });
  assert.match(html(page), /<h1>Flowers<\/h1>/);
  page.click({ dataset: { continue: "1" } });
  assert.match(html(page), /<h1>Fruit and sweet<\/h1>/);
  page.click({ dataset: { pn: "peach", pv: "-1" } });
  page.click({ dataset: { continue: "1" } });
  h = html(page);
  assert.match(h, /<h1>Spices and herbs<\/h1>/);
  assert.doesNotMatch(h, /data-pn="lavender"/, "lavender was answered on a bottle row");
  page.click({ dataset: { pmore: "1" } });
  assert.doesNotMatch(html(page), /data-pn="lavender"/);
  page.click({ dataset: { continue: "1" } });
  h = html(page);
  assert.match(h, /<h1>Woods, resins, musks and smoke<\/h1>/);
  page.click({ dataset: { pmore: "1" } });
  /* the unnoticed woody amber row named ambroxan; the card's bracketed label does not stop the match */
  assert.doesNotMatch(html(page), /data-pn="ambroxan"/, "ambroxan was on an answered bottle row");
  assert.match(html(page), /data-pn="ambergris" data-pv="0"/);
  finish(page, { taste: "bitter", told: ["sweet", "soapy"], anosmia: "no" });
  page.flushTimers();

  const r = stored(page);
  assert.deepEqual(r.sauvageedp, { opening: null, heart: null, drydown: -2, again: 0, chips: {}, src: "quiz", noteAnswers: { lavender_aromatic: 2, citrus_fresh: -2 }, unnoticed: ["woody_amber"] });
  assert.deepEqual(r.yara, { opening: null, heart: null, drydown: 1, again: 1, chips: {}, src: "quiz" });
  const sent = page.calls.filter(c => c.body && c.body.type === "rating" && c.body.perfume === "sauvageedp").pop().body;
  assert.deepEqual([sent.noteAnswers, sent.unnoticed], [r.sauvageedp.noteAnswers, r.sauvageedp.unnoticed], "the rating is resent with its note answers");
  const quiz = stored(page, "pp_quiz_v1");
  assert.deepEqual(quiz, { notes: { lemon: 1, tea: 1, peach: -1 }, taste: "bitter", told: ["sweet", "soapy"], anosmia: "no" });
  assert.deepEqual(events(page), [["quiz_grid", 2], ["verdict:turned", 0], ["notes:3", rows.length], ["verdict:still", 0], ["notes:skipall", N.questions(E.byId.yara, "worn").length],
    ["like:lemon", 0], ["like:tea", 0], ["avoid:peach", 0], ["taste:bitter", 0], ["told:sweet", 0], ["told:soapy", 0], ["anosmia:no", 0], ["quiz_done", 2]]);

  h = html(page);
  const block = f => { const m = new RegExp(`<div class="verdict [a-z-]+"><div class="v-head"><b>${reEsc(esc(D.FAMILIES[f].en))}</b>[^]*?</div></div>`).exec(h); assert.ok(m, `${f} is in the profile`); return m[0]; };
  /* note answers name the note; the hated citrus disagrees with the lemon enjoyed, which the line names (the bitter
     answer is not named), and the soapy chip's 0.3 on lavender is too weak to count */
  assert.match(block("citrus_fresh"), /Possible deal-breaker/);
  assert.match(block("citrus_fresh"), new RegExp(`<div class="hint">${reEsc(esc(sauvage.name))}: you hated the bergamot \\(first minutes\\)</div>`));
  assert.match(block("citrus_fresh"), /<div class="hint qdis">Your bottles and your answer \(lemon\) disagree; your bottles count more\.<\/div>/);
  assert.match(block("lavender_aromatic"), new RegExp(`${reEsc(esc(sauvage.name))}: you loved the lavender \\(first hours\\)`));
  assert.doesNotMatch(block("lavender_aromatic"), /qdis/);
  assert.doesNotMatch(h, new RegExp(`<b>${reEsc(esc(D.FAMILIES.woody_amber.en))}</b><span class="pill`), "an unnoticed family gives no evidence");
  /* the visitor's own words, each with its source */
  for (const line of ["You enjoy: lemon, tea", "You avoid: peach", "You prefer bitter to sweet", "Has bothered you: too sweet, soapy"])
    assert.match(h, new RegExp(`<div>${reEsc(line)} <span class="src">\\(from what you told us\\)</span></div>`));
  /* the unnoticed woody amber row brings the anosmia note although the answer was no */
  assert.match(h, new RegExp(`<div class="qnote">You did not notice the woody ambers \\(Ambroxan-type\\) in ${reEsc(esc(sauvage.name))}\\. Musks and woody ambers may be hard`));
  const { picks } = E.recommend(E.computeProfile({ ratings: r, auto: {}, images: {}, told: N.toldItems(quiz) }), r, N.avoidedNotes(quiz));
  assert.deepEqual([...h.matchAll(/data-event="sample:([^"]+)"/g)].map(m => m[1]).filter((x, i, a) => a.indexOf(x) === i), [...picks.map(p => p.P.id)]);
});

test("zero bottles and an enjoyed note: picks based only on what the visitor told, then the testers", () => {
  const page = open({ endpoint: ENDPOINT, respond: () => ({ ok: true }) });
  page.click({ dataset: { none: "1" } });
  page.click({ dataset: { pn: "lemon", pv: "1" } });
  finish(page);
  const h = html(page), quiz = stored(page, "pp_quiz_v1");
  assert.match(h, /<h1>Based only on what you told us<\/h1>/);
  const { picks } = E.recommend(E.computeProfile({ ratings: {}, auto: {}, images: {}, told: N.toldItems(quiz) }), {}, N.avoidedNotes(quiz));
  assert.equal(picks.length, 3);
  assert.equal((h.match(/<div class="rec qpick">/g) || []).length, 3);
  assert.equal((h.match(/<div class="rec tester">/g) || []).length, 3);
  const confirm = h.indexOf('<h2 class="qh2">Samples that would confirm it</h2>');
  assert.ok(h.indexOf('<div class="rec">') < confirm && confirm < h.indexOf('<div class="rec tester">'), "the picks, then the heading, then the testers");
  let at = -1;
  for (const p of picks) { const i = h.indexOf(`<b>${esc(p.P.name)}</b>`); assert.ok(i > at && i < confirm, `${p.P.id} shown in rank order`); at = i; }
  assert.match(h, /<div>You enjoy: lemon <span class="src">\(from what you told us\)<\/span><\/div>/);
  assert.deepEqual(events(page).map(e => e[0]), ["quiz_grid", "like:lemon", "taste:unsure", "told:unsure", "anosmia:no", "quiz_done"]);
});

test("zero bottles with every answer at not sure or I don't know: the testers only", () => {
  const page = open();
  page.click({ dataset: { none: "1" } });
  finish(page, { taste: "unsure", told: ["unsure"], anosmia: "unsure" });
  const h = html(page);
  assert.match(h, /<h1>Start with a sample<\/h1>/);
  assert.equal((h.match(/<div class="rec tester">/g) || []).length, 3);
  assert.doesNotMatch(h, /<div class="rec">|Based only on what you told us|class="qtold"/);
  assert.deepEqual(stored(page, "pp_quiz_v1"), { taste: "unsure", told: [], anosmia: "unsure" });
});

test("a picker card is hidden by an answered row word of its main family that holds it as a whole word", () => {
  const row = (id, f) => N.questions(E.byId[id], "worn").find(r => r.f === f).words.en;
  assert.ok(row("accento", "white_musk").includes("white musk") && row("accento", "fruity_sweet").includes("pineapple"));
  assert.ok(row("lazysunday", "white_floral").includes("orange blossom"));
  const rated = { opening: null, heart: 1, drydown: null, again: null, chips: {} };
  const ratings = {
    accento: Object.assign({}, rated, { noteAnswers: { white_musk: 1, fruity_sweet: 1 } }),
    lazysunday: Object.assign({}, rated, { noteAnswers: { white_floral: -1 } })
  };
  const page = open({ localStorage: seed({ pp_ratings_v1: JSON.stringify(ratings) }) });
  page.click({ dataset: { none: "1" } });
  const asked = [];
  for (let i = 0; i < D.QUIZ.notePicker.length && /data-pn=/.test(html(page)); i++) {
    if (/data-pmore="1"/.test(html(page))) page.click({ dataset: { pmore: "1" } });
    asked.push(...[...html(page).matchAll(/data-pn="([^"]+)" data-pv="0"/g)].map(m => m[1]));
    page.click({ dataset: { continue: "1" } });
  }
  assert.ok(!asked.includes("musk"), "musk was answered as white musk");
  /* "pineapple" does not hold "apple" as a whole word; orange blossom sits on a floral row, not the orange card's citrus */
  for (const id of ["apple", "orange"]) assert.ok(asked.includes(id), `${id} is still asked`);
});

test("the picker in Arabic: five titled screens, ten cards each before More notes, and every card reachable", () => {
  const page = open();
  page.click({ id: "lang-ar" });
  page.click({ dataset: { none: "1" } });
  const titles = [], seen = [];
  for (let i = 0; i < D.QUIZ.notePicker.length; i++) {
    const s = D.QUIZ.notePicker[i];
    let h = html(page);
    titles.push(/<h1>([^<]*)<\/h1>/.exec(h)[1]);
    assert.equal((h.match(/data-pv="0"/g) || []).length, Math.min(10, s.notes.length), `${s.id}: ten cards before More notes`);
    if (s.notes.length > 10) {
      assert.match(h, new RegExp(`data-pmore="1">نوتات أخرى \\(${s.notes.length - 10}\\)<`));
      page.click({ dataset: { pmore: "1" } });
      h = html(page);
    }
    const ids = [...h.matchAll(/data-pn="([^"]+)" data-pv="0"/g)].map(m => m[1]);
    assert.deepEqual(ids, [...s.notes.map(n => n.id)], `${s.id}: every card, in the screen's order`);
    for (const n of s.notes) assert.match(h, new RegExp(`<b>${reEsc(esc(n.ar))}</b>`));
    seen.push(...ids);
    page.click({ dataset: { continue: "1" } });
  }
  assert.equal(new Set(titles).size, D.QUIZ.notePicker.length, "each screen has its own title");
  for (const x of titles) assert.ok(x && x !== "undefined" && /[؀-ۿ]/.test(x), `an Arabic title: ${x}`);
  assert.equal(seen.length, D.QUIZ.notePicker.flatMap(s => s.notes).length);
  assert.doesNotMatch(html(page), /data-pn=/, "the taste question follows the fifth screen");

  /* a folded card that holds an answer opens its screen by itself */
  const last = D.QUIZ.notePicker[0].notes[D.QUIZ.notePicker[0].notes.length - 1].id;
  const again = open({ localStorage: seed({ pp_quiz_v1: JSON.stringify({ notes: { [last]: -1 } }) }) });
  again.click({ dataset: { none: "1" } });
  assert.match(html(again), new RegExp(`data-pn="${last}" data-pv="-1" aria-pressed="true"`));
  assert.doesNotMatch(html(again), /data-pmore=/);
});

test("I don't remember: a verdict that writes nothing, and a when that keeps the drydown", () => {
  const page = open({ endpoint: ENDPOINT, respond: () => ({ ok: true }) });
  page.click({ dataset: { tile: "hawas" } });
  page.click({ dataset: { tile: "yara" } });
  page.click({ dataset: { continue: "1" } });
  assert.match(html(page), /data-verdict="unsure" aria-pressed="false">I don&#39;t remember how it ended</);
  page.click({ dataset: { verdict: "unsure" } });
  assert.match(html(page), new RegExp(`<h1 class="qname">${reEsc(esc(E.byId.yara.name))}</h1>`));
  page.click({ dataset: { verdict: "turned" } });
  page.click({ dataset: { when: "unsure" } });
  assert.match(html(page), /data-when="unsure" aria-pressed="true">I don&#39;t remember</);
  page.click({ dataset: { continue: "1" } });
  page.click({ dataset: { continue: "1" } });
  const r = stored(page);
  assert.equal(r.hawas, undefined, "nothing written");
  assert.deepEqual(r.yara, { opening: null, heart: null, drydown: -2, again: 0, chips: {}, src: "quiz" });
  assert.deepEqual(events(page), [["quiz_grid", 2], ["verdict:unsure", 0], ["verdict:turned", 0], ["when:unsure", 0], ["notes:0", N.questions(E.byId.yara, "worn").length]]);
});

test("Back returns to the screen before, through the notes, skip-all and the narrowing round", () => {
  const page = open({ atStart: true });
  const name = id => esc(E.byId[id].name);
  const at = () => {
    const h = html(page), n = /class="qname">([^<]*)</.exec(h);
    return /id="tiles"/.test(h) ? "grid" : /data-nskip=/.test(h) ? "notes " + n[1] : /data-verdict=/.test(h) ? "verdict " + n[1] : /data-skip="1"/.test(h) ? "narrow" : /data-pn=/.test(h) ? "picker" : "other";
  };
  assert.doesNotMatch(html(page), /data-back/, "no Back on the start screen");
  start(page);
  assert.equal(at(), "grid");
  page.click({ dataset: { back: "1" } });
  assert.match(html(page), /data-start="1"/, "Back on the grid returns to the start screen");
  start(page);
  page.click({ dataset: { tile: "sauvageedp" } });
  page.click({ dataset: { tile: "yara" } });
  page.click({ dataset: { continue: "1" } });
  page.click({ dataset: { verdict: "turned" } });
  page.click({ dataset: { chip: "chemical" } });
  page.click({ dataset: { continue: "1" } });
  assert.equal(at(), "notes " + name("sauvageedp"));
  page.click({ dataset: { back: "1" } });
  assert.equal(at(), "verdict " + name("sauvageedp"));
  assert.match(html(page), /data-verdict="turned" aria-pressed="true"/);
  page.click({ dataset: { back: "1" } });
  assert.equal(at(), "grid");
  assert.match(page.snapshot().els.tiles.innerHTML, /data-tile="sauvageedp" aria-pressed="true">/, "a bottle answered on this visit can be picked again");
  page.click({ dataset: { continue: "1" } });
  assert.equal(at(), "verdict " + name("sauvageedp"));
  page.click({ dataset: { continue: "1" } });
  page.click({ dataset: { continue: "1" } });
  page.click({ dataset: { verdict: "still" } });
  page.click({ dataset: { nskipall: "1" } });
  assert.equal(at(), "narrow");
  page.click({ dataset: { back: "1" } });
  assert.equal(at(), "notes " + name("yara"));
  assert.match(html(page), /data-nskipall/, "skip-all is undone");
  page.click({ dataset: { continue: "1" } });
  assert.equal(at(), "narrow");
  const offered = /data-tile="([^"]+)"/.exec(html(page))[1];
  page.click({ dataset: { tile: offered } });
  page.click({ dataset: { continue: "1" } });
  assert.equal(at(), "verdict " + name(offered));
  assert.match(html(page), /Bottle 1 of 1/);
  page.click({ dataset: { back: "1" } });
  assert.equal(at(), "narrow");
  assert.match(html(page), new RegExp(`data-tile="${offered}" aria-pressed="true"`));
  page.click({ dataset: { back: "1" } });
  assert.equal(at(), "notes " + name("yara"));
  assert.deepEqual(stored(page).sauvageedp.chips, { drydown: ["chemical"] }, "answers stay after Back");
});

test("an old string quiz.told is read as a one-item list, and none as nothing has bothered", () => {
  const toComplaints = page => {
    page.click({ dataset: { none: "1" } });
    for (let i = 0; i < D.QUIZ.notePicker.length; i++) page.click({ dataset: { continue: "1" } });
    page.click({ dataset: { taste: "unsure" } });
  };
  const page = open({ localStorage: seed({ pp_quiz_v1: JSON.stringify({ told: "sweet", anosmia: "no" }) }) });
  toComplaints(page);
  assert.match(html(page), /data-told="sweet" aria-pressed="true"/);
  assert.equal((html(page).match(/aria-pressed="true"/g) || []).length, 1);
  assert.deepEqual(stored(page, "pp_quiz_v1").told, ["sweet"]);
  page.click({ dataset: { continue: "1" } });
  page.click({ dataset: { anosmia: "no" } });
  assert.match(html(page), /<div>Has bothered you: too sweet <span class="src">/);
  assert.equal(/<div class="rec tester">[^]*?data-event="tester:([^"]+)"/.exec(html(page))[1], D.QUIZ.testers.find(x => x.family === "vanilla_gourmand").id, "the complaint orders the testers");

  const none = open({ localStorage: seed({ pp_quiz_v1: JSON.stringify({ told: "none" }) }) });
  toComplaints(none);
  assert.match(html(none), /data-told="none" aria-pressed="true">Nothing has bothered me</);
  const q = stored(none, "pp_quiz_v1");
  assert.deepEqual([q.told, q.toldNone], [[], true]);
  /* "I don't know" clears the others */
  none.click({ dataset: { told: "smoky" } });
  none.click({ dataset: { told: "unsure" } });
  assert.deepEqual((html(none).match(/data-told="[a-z]+" aria-pressed="true"/g) || []), ['data-told="unsure" aria-pressed="true"']);
});

test("a row with no listed note says so, with its hint, in both languages", () => {
  const page = open();
  page.click({ dataset: { tile: "br540" } });
  page.click({ dataset: { continue: "1" } });
  page.click({ dataset: { verdict: "still" } });
  const rows = N.questions(E.byId.br540, "worn"), row = rows.find(r => !r.words.en.length);
  assert.ok(row, "Baccarat Rouge 540 has a row with no listed note");
  const stage = { opening: "First minutes", heart: "First hours", drydown: "Hours later" }[row.stage];
  assert.match(html(page), new RegExp(`<span class="nstage">${stage}</span> · <b>not on its note list</b> · <span class="nfam">${reEsc(esc(D.FAMILIES[row.f].en))}</span></div><div class="nhint">Some materials are in a perfume without being on its note list\\.</div>`));
  page.click({ id: "lang-ar" });
  const h = html(page);
  assert.equal(rows.length, 5);
  assert.match(h, /خمس نوتات من [^<]+\. اختر ما تتذكره، وتجاوز ما لا تتذكره\./);
  assert.match(h, new RegExp(`<b>غير مذكور في قائمة نوتاته</b> · <span class="nfam">${reEsc(esc(D.FAMILIES[row.f].ar))}</span>`));
  assert.match(h, /data-v="u" aria-pressed="false">لم ألاحظه</);
  assert.match(h, /<span class="qpart">الجزء 1 من 4 · عطورك<\/span>/);
});

test("the page strings use no form of the Arabic verb for wearing clothes, and no em dash", () => {
  /* the root l-b-s with optional long vowels (the verb, its present tense, clothes, worn), diacritics removed first */
  const wear = /ل[اآ]?ب[وي]?س/;
  for (const f of ["quiz.js", "app.js", "notes.js"]) {
    const src = fs.readFileSync(path.join(SITE, "js", f), "utf8");
    assert.equal(wear.test(src.replace(/[ً-ْـ]/g, "")), false, `${f} uses the verb for wearing clothes`);
    assert.equal(src.includes(String.fromCharCode(0x2014)), false, `${f} has an em dash`);
  }
});

test("the result leads with a palate name and a true count; the reveal sorts the visitor's bottles first", () => {
  /* without a motion preference the stub has no matchMedia, so the result is shown at once */
  const page = open();
  twoBottles(page);
  finish(page, { told: ["chemical"] });
  const h = html(page), r = stored(page);
  const prof = E.computeProfile({ ratings: r, auto: {}, images: {}, told: N.toldItems(stored(page, "pp_quiz_v1")) });
  /* the name follows the shape of the liked families: one group, two groups named together, or the wide palate */
  const liked = Object.entries(prof).filter(([, v]) => v.cls === "goodLikely" || v.cls === "goodPossible");
  assert.ok(liked.length, "the two bottles give a liked family");
  assert.match(h, /<div class="qname-hero" style="--arch:#[0-9A-F]{6}"><svg class="qemblem"[^]*?<p class="eyebrow">Your palate<\/p><h1>The ([A-Z][a-z]+|[A-Z][a-z]+ and [A-Z][a-z]+|Wide) Palate<\/h1>/);
  /* the count: the whole catalogue, the perfumes a deal-breaker rules out, and the picks shown */
  const total = E.PERFUMES.length, out = E.ruledOut(prof).length;
  assert.ok(out > 0 && out < total, `ruled out ${out} of ${total}`);
  assert.match(h, new RegExp(`data-count="${total}">${total}</b><span>perfumes checked</span>`));
  assert.match(h, new RegExp(`data-count="${out}">${out}</b><span>ruled out for you</span>`));
  assert.match(h, /data-count="3">3<\/b><span>chosen for you<\/span>/);
  /* every ruled-out perfume holds a possible or likely deal-breaker at the engine's exclusion strength */
  const bad = Object.entries(prof).filter(([, v]) => v.cls === "badLikely" || v.cls === "badPossible").map(([f]) => f);
  for (const id of E.ruledOut(prof)) {
    const P = E.byId[id];
    assert.ok(bad.some(f => (P.stages.drydown[f] || 0) >= 0.5 || (P.stages.heart[f] || 0) >= 0.7), `${id} is ruled out for a reason`);
  }

  /* with motion allowed, the reveal plays first: kept and turned bottles, then the result on the timer or a tap */
  const moving = createPage({ localStorage: seed() });
  moving.sandbox.matchMedia = () => ({ matches: false });
  moving.load(quizScripts);
  start(moving);
  twoBottles(moving);
  finish(moving, { told: ["chemical"] });
  let m = html(moving);
  assert.match(m, /<div class="qreveal-intro"[^]*class="qsort kept"[^]*class="qsort turned"/);
  assert.ok(m.indexOf("sauvageedp") > m.indexOf('class="qsort turned"') || m.indexOf("Sauvage") > m.indexOf('class="qsort turned"'), "Sauvage is on the turned side");
  assert.doesNotMatch(m, /class="qresult"/);
  moving.click({ dataset: { skipintro: "1" } });
  assert.match(html(moving), /class="qresult"/);
  /* the reveal plays once: going back and forward again shows the result directly */
  moving.flushTimers();
  assert.match(html(moving), /class="qresult"/);
});

/* Every bottle in `kept` is still worn, every bottle in `turned` turned in the drydown; a note screen, when one
   comes, is left with Next. */
function keep(page, kept, turned) {
  for (const id of kept.concat(turned)) page.click({ dataset: { tile: id } });
  page.click({ dataset: { continue: "1" } });
  for (let i = 0; i < kept.length + turned.length; i++) {
    const name = /<h1 class="qname">([^<]*)<\/h1>/.exec(html(page))[1];
    const id = kept.concat(turned).find(x => esc(E.byId[x].name) === name);
    assert.ok(id, "a bottle screen for " + name);
    page.click({ dataset: { verdict: kept.includes(id) ? "still" : "turned" } });
    if (!kept.includes(id)) page.click({ dataset: { when: "drydown" } });
    page.click({ dataset: { continue: "1" } });
    if (/data-nskip="1"/.test(html(page))) page.click({ dataset: { continue: "1" } });
  }
}

test("the palate name follows the shape of the kept bottles: one group, two groups named together, or wide", () => {
  /* Yara and Khamrah are both vanilla bottles: one group names the palate, and the card shows its shades */
  let page = open();
  keep(page, ["yara", "khamrah"], ["sauvageedp"]);
  finish(page);
  let h = html(page);
  assert.match(h, /<p class="eyebrow">Your palate<\/p><h1>The Sweet Palate<\/h1>/);
  assert.match(h, /<p class="qpal">Your bottles show a liking for dessert-like sweetness\.<\/p>/);
  assert.match(h, /<p class="qtip"><b>A tip for your palate<\/b>Sweet perfumes differ most in their base/, "the tip sits lower, under its label");

  /* Aventus (a musk) and Interlude (an oud) are two sides: both are named, the emblem shades from the first
     group's colour into the second's, and the card's liked chips show one family of each side */
  page = open();
  keep(page, ["aventus", "interlude"], ["sauvageedp"]);
  finish(page);
  h = html(page);
  assert.match(h, /<div class="qname-hero" style="--arch:#5B3A24"><svg class="qemblem"[^]*?<h1>The Oud and Musk Palate<\/h1>/);
  assert.match(h, /<p class="qpal">Your bottles show two likings, each with bottles behind it: dark, smoky materials, and musks\.<\/p>/, "both sides");
  assert.match(h, /<p class="qtip"><b>A tip for your palate<\/b>Most oud in Western perfumes/, "the lead side's tip");
  assert.match(h, /<radialGradient id="qe-oud-musk"[^]*?stop-color="#5B3A24" stop-opacity="1"\/><stop offset="1" stop-color="#7F7899"\/>/);
  const chips = /<div class="qtaste-row good">[^]*?<\/div><\/div>/.exec(h)[0];
  assert.match(chips, /Clean white musks/);
  assert.match(chips, /Incense|Oud, smoky or medicinal|Leather and birch smoke/);

  /* four kept bottles of four kinds, none leading: the wide palate, and the card shows three different sides */
  page = open();
  keep(page, ["eros", "goodgirl", "interlude", "adgedt"], ["sauvageedp"]);
  finish(page);
  h = html(page);
  assert.match(h, /<div class="qname-hero" style="--arch:#4E6B62"><svg class="qemblem"[^]*?<h1>The Wide Palate<\/h1>/);
  assert.match(h, /<p class="qpal">Your bottles cover several kinds of perfume[^<]*No deal-breaker has shown up yet/, "a wide palate without a deal-breaker says so");
  assert.doesNotMatch(h, /class="qtip"/, "the wide palate's tip stays under its name");
  const wide = /<div class="qtaste-row good">[^]*?<\/div><\/div>/.exec(h)[0];
  assert.equal((wide.match(/<span class="qchip good">/g) || []).length, 3, "three chips");
  assert.match(wide, /Incense|Oud, smoky or medicinal|Leather and birch smoke/);
  assert.match(wide, /From your bottles: [^<]+, [^<]+ and [^<]+<\/div>/, "one family from each of three bottles, not three shades of one");

  /* three bottles of three kinds are a sample, not a wardrobe: the two strongest sides name it */
  page = open();
  keep(page, ["eros", "interlude", "adgedt"], ["sauvageedp"]);
  finish(page);
  assert.match(html(page), /<h1>The [A-Z][a-z]+ and [A-Z][a-z]+ Palate<\/h1>/);
});

test("every palate group has its text in both languages", () => {
  const src = fs.readFileSync(path.join(SITE, "js", "quiz.js"), "utf8");
  const ids = [...src.matchAll(/\{ id: "([a-z]+)", fams: \[/g)].map(m => m[1]).filter(id => id !== "wide" && id !== "selective");
  assert.equal(ids.length, 9);
  for (const id of ids) assert.equal((src.match(new RegExp(`\\b${id}: \\{ side: "[^"]+", tip: "(?:[^"\\\\]|\\\\.)+" \\}`, "g")) || []).length, 2, id + ": English and Arabic");
  for (const id of ["wide", "selective"]) assert.equal((src.match(new RegExp(`\\b${id}: \\{ text: "`, "g")) || []).length, 2, id);
});

test("the start screen, one reached event per screen, the result event, and the comparison with other finishers", async () => {
  /* the start screen: the promise, five of the grid's bottles, the four parts, Start, and no time estimate */
  const first = open({ atStart: true });
  let h = html(first);
  assert.match(h, /<h1>Find what ruins a perfume for you<\/h1>/);
  assert.equal((h.match(/<img class="thumb/g) || []).length, 5);
  assert.match(h, /<li><b>1<\/b><span>Your bottles<\/span><\/li><li><b>2<\/b><span>Notes you know<\/span><\/li><li><b>3<\/b><span>Sweet or bitter<\/span><\/li><li><b>4<\/b><span>What bothers you<\/span><\/li>/);
  assert.match(h, /data-start="1">Start</);
  assert.ok(h.indexOf('data-start="1"') < h.indexOf('class="qsteps"'), "Start comes straight after the promise, before the four parts");
  /* a returning visitor goes to their profile to rate the samples; the old quiz address lands on the front page */
  assert.match(h, /<p class="qreturn"><a href="profile\.html">Took the quiz before\? Rate the samples you tried<\/a><\/p>/);
  assert.match(fs.readFileSync(path.join(SITE, "quiz.html"), "utf8"), /location\.replace\("index\.html" \+ location\.search \+ location\.hash\)/);
  first.click({ id: "lang-ar" });
  h = html(first);
  assert.match(h, /<h1>اعرف ما يفسد العطر عليك<\/h1>/);
  assert.match(h, /data-start="1">ابدأ</);
  assert.doesNotMatch(h + html(open({ atStart: true })), /minute|دقيق|دقائق/, "no time estimate");

  /* with a backend that has 240 finished results, a quarter of them sharing every deal-breaker */
  let statsCalls = 0;
  const quizCounts = n => ({ n, palates: {}, breakers: Object.fromEntries(Object.keys(D.FAMILIES).map(f => [f, n / 4])) });
  const respond = n => (url, body) => { if (!body && url.includes("stats=1")) { statsCalls++; return { perfumes: {}, quiz: quizCounts(n) }; } return { ok: true }; };
  const page = open({ endpoint: ENDPOINT, respond: respond(240) });
  twoBottles(page);
  finish(page, { told: ["chemical"] });
  await page.settle();
  const names = page.calls.filter(c => c.body && c.body.type === "event").map(c => c.body.name);
  const reach = names.filter(x => x.startsWith("reach:"));
  assert.deepEqual(reach.slice(0, 4), ["reach:start", "reach:grid", "reach:verdicts", "reach:notes"]);
  assert.deepEqual(reach.slice(-3), ["reach:taste", "reach:told", "reach:anosmia"]);
  const pick = reach.filter(x => x.startsWith("reach:picker:")).map(x => +x.split(":")[2]);
  assert.ok(pick.length >= 1 && pick.every((x, i) => x >= 1 && x <= 5 && (i === 0 || x > pick[i - 1])), "picker screens in order: " + pick);
  assert.equal(new Set(reach).size, reach.length, "each screen is reported once");
  const result = page.calls.filter(c => c.body && c.body.type === "event" && c.body.name.startsWith("result:"));
  assert.equal(result.length, 1);
  assert.match(result[0].body.name, /^result:[a-z]+(-[a-z]+)?:[a-z_]+(\+[a-z_]+)*$/);
  assert.equal(result[0].body.n, 2);
  assert.ok(names.indexOf("quiz_done") < names.indexOf(result[0].body.name), "quiz_done first");

  /* the counts are asked for once; the line names the strongest deal-breaker and its share */
  assert.equal(statsCalls, 1);
  assert.match(page.snapshot().els.qcompare.innerHTML, /^25% of the 240 people who finished this quiz share your deal-breaker: [a-z]/);
  page.click({ id: "lang-ar" });
  assert.match(html(page), /<p class="qcompare" id="qcompare">25٪ ممن أنهوا هذا الاختبار \(240\) يشاركونك النفور من /);

  /* under a hundred finishers, no comparison */
  const few = open({ endpoint: ENDPOINT, respond: respond(99) });
  twoBottles(few);
  finish(few, { told: ["chemical"] });
  await few.settle();
  assert.equal(few.snapshot().els.qcompare.innerHTML, "");
  assert.match(html(few), /<p class="qcompare" id="qcompare"><\/p>/);
});

test("an avoided note keeps perfumes it leads out of the picks, unless a kept bottle carries it; every pick says why", () => {
  const led = (P, f) => ["heart", "drydown"].some(s => { const st = P.stages[s], w = st[f] || 0; return w >= 0.7 && w >= Math.max(...Object.values(st)); });
  const picksIn = h => [...h.matchAll(/data-event="sample:([^"]+)"/g)].map(m => m[1]).filter((x, i, a) => a.indexOf(x) === i);
  /* the reported case: no bottles, rose liked and musk avoided on the note cards; Roses Musk used to be the third pick */
  let page = open({ localStorage: seed({ pp_quiz_v1: JSON.stringify({ notes: { rose: 1, musk: -1 } }) }) });
  page.click({ dataset: { none: "1" } });
  finish(page);
  let h = html(page), ids = picksIn(h.split('class="rec tester"')[0]);
  assert.equal(ids.length, 3);
  for (const id of ids) {
    assert.notEqual(id, "rosesmusk");
    assert.ok(!led(E.byId[id], "white_musk") && !/musk/i.test(E.byId[id].name), id + " is led by musk or named for it");
  }
  assert.equal((h.match(/<div class="rec qpick">[^]*?<div class="(why|risk)">/g) || []).length, 3, "each pick has a reason line");
  assert.match(h, /which you said you avoid; [^<]+ leads\.|Has rose, which you like\./);

  /* Yara kept: her bottle carries white musk, so the picks follow the bottle and the result says so */
  page = open({ localStorage: seed({ pp_quiz_v1: JSON.stringify({ notes: { musk: -1 } }) }) });
  keep(page, ["yara"], []);
  finish(page);
  h = html(page);
  assert.match(h, /<p class="qcontra">You said you avoid musk, but Yara, which you kept, has clean white musks, so the picks do not leave it out\. Perhaps another kind of musk is what bothers you\.<\/p>/);
  page.click({ id: "lang-ar" });
  assert.match(html(page), /<p class="qcontra">قلت إنك تتجنب المسك، لكن يارا الذي احتفظت به فيه المسك الأبيض النظيف، لذلك لا تستبعده الترشيحات\./);

  /* the count of perfumes ruled out takes in what the avoided note rules out */
  const prof = E.computeProfile({ ratings: {}, auto: {}, images: {}, told: N.toldItems({ notes: { musk: -1 } }) });
  assert.ok(E.ruledOut(prof, N.avoidedNotes({ notes: { musk: -1 } })).includes("rosesmusk"));
  assert.ok(!E.ruledOut(prof).includes("rosesmusk"), "without the avoided note, nothing is ruled out");
});

test("a partner statement set in config.js closes the footer of both pages in the page language; none when it is empty", () => {
  const withStatement = (list, d) => list.map(s => s.filename === "js/config.js" ? Object.assign({}, s, { code: s.code + `\nwindow.PP_CONFIG.disclosure = ${JSON.stringify(d)};` }) : s);
  const d = { en: "As a partner I earn from qualifying purchases.", ar: "بصفتي شريكًا أكسب من عمليات الشراء المؤهلة." };
  const footOf = h => /<footer class="foot">([\s\S]*?)<\/footer>/.exec(h)[1];
  for (const l of ["en", "ar"]) {
    const quiz = createPage({ localStorage: seed({ pp_lang: JSON.stringify(l) }) });
    quiz.load(withStatement(quizScripts, d)); start(quiz);
    assert.ok(footOf(html(quiz)).endsWith(`<p>${esc(d[l])}</p>`), `quiz footer (${l})`);
    const prof = createPage({ localStorage: seed({ pp_lang: JSON.stringify(l) }) });
    prof.load(withStatement(appScripts, d));
    assert.ok(prof.snapshot().els.foot.innerHTML.endsWith(`<p>${esc(d[l])}</p>`), `profile footer (${l})`);
  }
  const none = createPage({ localStorage: seed() });
  none.load(withStatement(appScripts, { en: "", ar: "" }));
  assert.equal((none.snapshot().els.foot.innerHTML.match(/<p>/g) || []).length, 1, "profile footer without a statement");
  const q2 = createPage({ localStorage: seed() }); q2.load(withStatement(quizScripts, { en: "", ar: "" })); start(q2);
  assert.equal((footOf(html(q2)).match(/<p>/g) || []).length, 1, "quiz footer without a statement");
});

test("shop links fill {q} with the perfume's house and name and {lang} with the page language, on both pages", () => {
  const tpl = "https://shop.example/{lang}/search?q={q}&ref=x";
  const withLinks = list => list.map(s => s.filename === "js/config.js" ? Object.assign({}, s, { code: s.code + `\nwindow.PP_CONFIG.links.bottle = ${JSON.stringify(tpl)};` }) : s);
  const want = (P, l) => `https://shop.example/${l}/search?q=${encodeURIComponent(P.house + " " + P.name)}&ref=x`;
  const quiz = createPage({ localStorage: seed() });
  quiz.load(withLinks(quizScripts)); start(quiz);
  twoBottles(quiz); finish(quiz);
  for (const l of ["en", "ar"]) {
    if (l === "ar") quiz.click({ id: "lang-ar" });
    const bottles = [...html(quiz).matchAll(/class="qbottle" href="([^"]+)" [^>]*data-event="sample:([^"]+)"/g)];
    assert.equal(bottles.length, 3, `three picks (${l})`);
    for (const [, href, id] of bottles) assert.equal(href, want(E.byId[id], l));
  }
  const prof = createPage({ localStorage: seed({ pp_lang: JSON.stringify("ar"), pp_ratings_v1: JSON.stringify({ sauvageedp: Object.assign({}, blank, { drydown: -2, again: 0 }), yara: Object.assign({}, blank, { drydown: 2, again: 1 }) }) }) });
  prof.load(withLinks(appScripts));
  const hrefs = [...prof.snapshot().els.recs.innerHTML.matchAll(/href="(https:\/\/shop\.example\/[^"]+)"/g)].map(m => m[1]);
  assert.equal(hrefs.length, 3, "one bottle link per pick on the profile page");
  for (const h of hrefs) assert.match(h, /^https:\/\/shop\.example\/ar\/search\?q=[^&]+&ref=x$/);
});
