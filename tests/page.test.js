/* The page under a stub browser (lib/dom.js), loaded exactly as site/index.html loads it: it must render
   what the engine computes, react to clicks, keep ratings on the device and, with a backend, send only
   what the vendor terms allow. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { SITE, loadSite } = require("../tools/lib/site");
const { createPage } = require("./lib/dom");

const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
const scriptsOf = src => [...src.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
const scripts = scriptsOf(html), quizScripts = scriptsOf(fs.readFileSync(path.join(SITE, "quiz.html"), "utf8"));
const W = loadSite("data", "mapper", "materials", "evidence", "engine", "notes");
const E = W.PP_ENGINE.create(W.PP_DATA, W.PP_MAP, W.PP_EVIDENCE), N = W.PP_NOTES.create(W.PP_DATA, W.PP_MAP, E);
const FAMILIES = W.PP_DATA.FAMILIES;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* two perfumes heaviest in woody ambers in the drydown, hated there; one sweet perfume without them, loved */
const byWoody = E.PERFUMES.slice().sort((a, b) => (b.stages.drydown.woody_amber || 0) - (a.stages.drydown.woody_amber || 0));
const hated = byWoody.slice(0, 2).map(p => p.id);
const loved = E.PERFUMES.find(p => E.STAGES.every(s => !p.stages[s].woody_amber) && (p.stages.drydown.vanilla_gourmand || 0) >= 0.6).id;
const ratings = {};
for (const id of hated) ratings[id] = { opening: -1, heart: -1, drydown: -2, again: 0, chips: {} };
ratings[loved] = { opening: 2, heart: 2, drydown: 2, again: 1, chips: {} };
const seed = () => ({ pp_device: JSON.stringify("d_test"), pp_lang: JSON.stringify("en"), pp_ratings_v1: JSON.stringify(ratings) });
const stored = page => JSON.parse(page.localStorage.getItem("pp_ratings_v1"));

test("scripts in index.html load in order and the page renders the engine's profile and picks", () => {
  assert.deepEqual(scripts.map(s => s.filename), ["js/config.js", "js/data.js", "js/mapper.js", "js/materials.js", "js/evidence.js", "js/engine.js", "js/notes.js", "js/bottles.js", "js/app.js"]);
  const page = createPage({ localStorage: seed() });
  page.load(scripts);
  const els = page.snapshot().els;
  const prof = E.computeProfile({ ratings, auto: {}, images: {} });
  assert.equal(prof.woody_amber.cls, "badLikely");
  assert.match(els.profile.innerHTML, new RegExp(`<div class="verdict bad-likely">\\s*<div class="v-head"><b>${esc(FAMILIES.woody_amber.en).replace(/[()]/g, "\\$&")}</b>`));
  const shown = Object.values(prof).filter(v => v.cls !== "neutral").length;
  assert.equal((els.profile.innerHTML.match(/<div class="verdict /g) || []).length, shown);
  const { picks } = E.recommend(prof, ratings);
  assert.equal(picks.length, 3);
  assert.equal((els.recs.innerHTML.match(/<div class="rec">/g) || []).length, 3);
  let at = -1;
  for (const p of picks) { const i = els.recs.innerHTML.indexOf(`<b>${esc(p.P.name)}</b>`); assert.ok(i > at, `${p.P.id} shown in rank order`); at = i; }
  assert.equal(els.bottombar.hidden, false);
});

test("clicks: language, rating, share, custom name, label, remove, reset", () => {
  const page = createPage({ localStorage: seed() });
  page.load(scripts);
  page.click({ id: "lang-ar" });
  assert.equal(page.snapshot().html.dir, "rtl");
  assert.equal(JSON.parse(page.localStorage.getItem("pp_lang")), "ar");
  page.click({ id: "lang-en" });

  page.click({ dataset: { rate: hated[0], stage: "drydown", v: "2" } });
  assert.equal(stored(page)[hated[0]].drydown, 2);

  page.click({ id: "share" });
  assert.equal(page.clipboard.length, 1);
  assert.match(page.clipboard[0], /^Scent Profiler · \d{4}-\d{2}-\d{2}\n/);
  assert.equal(page.clipboard[0].split("\n").filter(l => / Opening /.test(l)).length, 3);

  page.input("Zz Unknown Scent");
  page.key("Enter", "Zz Unknown Scent");
  assert.equal(stored(page)["x_zz-unknown-scent"].custom, "Zz Unknown Scent");

  const label = fs.readFileSync(path.join(SITE, "..", "evidence", "labels", "layton.txt"), "utf8").split("\n").filter(l => !/^\w+:/.test(l)).join("\n");
  page.setValue("lbl-" + loved, label);
  page.setValue("lblm-" + loved, "SA");
  page.click({ dataset: { readlabel: loved } });
  const L = stored(page)[loved].label;
  assert.equal(L.market, "SA");
  assert.ok(L.parsed.materialsDeclared > 3);
  assert.match(page.snapshot().els.rated.innerHTML, /materials recognised/);

  page.click({ dataset: { remove: loved } });
  assert.equal(stored(page)[loved], undefined);
  page.click({ id: "reset" });
  page.click({ id: "reset" });
  assert.deepEqual(stored(page), {});
});

test("with a backend: lazy catalogue, lookups, and nothing from the vendor's note list sent back", async () => {
  const lookedUp = { id: "f_test-house-lookup-scent", name: "Lookup Scent", brand: "Test House", gender: "men", oilType: "Eau de Parfum", notes: { top: ["Lemon Verbena", "Iris"], middle: ["Violet Leaf"], base: ["Ambergris", "Sandalwood"] }, accords: ["green", "woody"], image: "", vendorId: "GIT", source: "vendor" };
  const cached = { id: "f_lalique-encre-noire", name: "Encre Noire", brand: "Lalique", gender: "men", oilType: "", image: "", vendorId: "EN", stages: { opening: {}, heart: { vetiver: 0.9 }, drydown: { vetiver: 0.8, woody_amber: 0.6 } }, source: "vendor" };
  const respond = (url, body) => {
    if (!body) return url.includes("catalogue=1") ? { entries: [cached] } : url.includes("stats=1") ? { perfumes: { [hated[0]]: { n: 4, o: 0, h: -1, d: -1.5 } } } : {};
    if (body.type === "lookup") return body.q.toLowerCase() === "lookup scent" ? { found: true, entry: lookedUp, cached: false } : { found: false };
    return { ok: true };
  };
  const page = createPage({ localStorage: seed(), endpoint: "http://mock.local/api", respond });
  page.load(scripts);
  await page.settle();
  assert.match(page.snapshot().els.rated.innerHTML, /Community: 4 ratings, drydown average −1\.5/);

  page.input("encre");
  assert.match(page.snapshot().els.results.innerHTML, /data-add="f_lalique-encre-noire"[\s\S]*Auto-tagged from its note list/);

  page.input("lookup scent");
  assert.doesNotMatch(page.snapshot().els.results.innerHTML, /data-add=/, "the looked-up name must not already be in the catalogue");
  page.key("Enter", "lookup scent");
  await page.settle();
  const tagcache = page.calls.find(c => c.body && c.body.type === "tagcache");
  assert.ok(tagcache, "derived weights posted back");
  assert.equal(tagcache.body.id, lookedUp.id);
  assert.ok(tagcache.body.stages && Object.keys(tagcache.body.stages.drydown).length);
  for (const k of ["notes", "accords"]) assert.equal(k in tagcache.body, false, `tagcache must not carry ${k}`);
  assert.equal(stored(page)[lookedUp.id].auto.notes, undefined);

  page.click({ dataset: { rate: lookedUp.id, stage: "drydown", v: "-2" } });
  page.flushTimers();
  const rating = page.calls.filter(c => c.body && c.body.type === "rating").pop();
  assert.equal(rating.body.perfume, lookedUp.id);
  assert.equal(rating.body.drydown, -2);
  for (const k of ["auto", "label"]) assert.equal(k in rating.body, false, `rating must not carry ${k}`);
});

test("with a backend: every rated perfume's last state is sent, and a removed perfume's pending send is dropped without an error", () => {
  const blank = { opening: null, heart: null, drydown: null, again: null, chips: {} };
  const three = { [hated[0]]: blank, [hated[1]]: blank, [loved]: blank };
  const page = createPage({ localStorage: Object.assign(seed(), { pp_ratings_v1: JSON.stringify(three) }), endpoint: "http://mock.local/api", respond: () => ({ ok: true }) });
  page.load(scripts);
  const sent = () => page.calls.filter(c => c.body && c.body.type === "rating").map(c => `${c.body.perfume} ${c.body.heart} ${c.body.drydown}`);

  page.click({ dataset: { rate: hated[0], stage: "drydown", v: "-2" } });
  page.click({ dataset: { rate: hated[1], stage: "drydown", v: "-1" } });
  page.click({ dataset: { rate: hated[0], stage: "heart", v: "1" } });
  page.flushTimers();
  assert.deepEqual(sent().sort(), [`${hated[0]} 1 -2`, `${hated[1]} null -1`].sort());

  page.click({ dataset: { rate: loved, stage: "drydown", v: "2" } });
  page.click({ dataset: { remove: loved } });
  page.flushTimers();
  page.click({ dataset: { rate: hated[1], stage: "opening", v: "0" } });
  page.click({ id: "reset" });
  page.click({ id: "reset" });
  page.flushTimers();
  assert.equal(sent().length, 2, "nothing sent for a removed perfume or after a reset");
});

test("with a backend: pending ratings go out at once when the page is hidden or closed", () => {
  const blank = { opening: null, heart: null, drydown: null, again: null, chips: {} };
  const two = { [hated[0]]: blank, [hated[1]]: blank };
  const open = beacon => { const p = createPage({ localStorage: Object.assign(seed(), { pp_ratings_v1: JSON.stringify(two) }), endpoint: "http://mock.local/api", respond: () => ({ ok: true }), beacon }); p.load(scripts); return p; };
  const sent = page => page.calls.filter(c => c.body && c.body.type === "rating").map(c => `${c.method}${c.keepalive ? " keepalive" : ""} ${c.body.perfume} ${c.body.drydown}`);

  const page = open();
  page.click({ dataset: { rate: hated[0], stage: "drydown", v: "-2" } });
  page.hide();
  assert.deepEqual(sent(page), [`BEACON ${hated[0]} -2`]);
  page.flushTimers();
  assert.equal(sent(page).length, 1, "a flushed rating is not sent again");
  page.click({ dataset: { rate: hated[1], stage: "drydown", v: "-1" } });
  page.fire("pagehide");
  assert.deepEqual(sent(page), [`BEACON ${hated[0]} -2`, `BEACON ${hated[1]} -1`]);

  const old = open(false);
  old.click({ dataset: { rate: hated[0], stage: "drydown", v: "1" } });
  old.hide();
  assert.deepEqual(sent(old), [`POST keepalive ${hated[0]} 1`], "without sendBeacon, a keepalive fetch");
});

/* The quiz and the profiler on one device: the quiz's word answers reach the profiler as the same told items. */
const quizSeed = extra => Object.assign({ pp_device: JSON.stringify("d_test"), pp_lang: JSON.stringify("en") }, extra || {});
const picksOf = h => [...h.matchAll(/<div class="rec">[^]*?<b>([^<]+)<\/b>/g)].map(m => m[1]);
/* the quiz from its picker to the result, every card left as it is */
function quizToEnd(q, o) {
  o = Object.assign({ taste: "unsure", told: ["unsure"] }, o);
  const at = () => q.snapshot().els.quiz.innerHTML;
  if (/data-skip="1"/.test(at())) q.click({ dataset: { skip: "1" } });
  for (let i = 0; i < W.PP_DATA.QUIZ.notePicker.length && /data-pn=/.test(at()); i++) q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { taste: o.taste } });
  for (const c of o.told) q.click({ dataset: { told: c } });
  q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { anosmia: "no" } });
  return at();
}

test("the profiler, loaded with the quiz's storage, gives the quiz's picks and uses its answers", () => {
  const q = createPage({ localStorage: quizSeed() });
  q.load(quizScripts);
  q.click({ dataset: { start: "1" } });
  q.click({ dataset: { tile: "sauvageedp" } });
  q.click({ dataset: { tile: "yara" } });
  q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { verdict: "turned" } });
  q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { na: "citrus_fresh", v: "-2" } });
  q.click({ dataset: { na: "woody_amber", v: "u" } });
  q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { verdict: "still" } });
  q.click({ dataset: { continue: "1" } });
  if (/data-skip="1"/.test(q.snapshot().els.quiz.innerHTML)) q.click({ dataset: { skip: "1" } });
  q.click({ dataset: { pn: "lemon", pv: "1" } });
  q.click({ dataset: { continue: "1" } });
  q.click({ dataset: { pn: "peach", pv: "-1" } });
  const qh = quizToEnd(q, { taste: "bitter", told: ["sweet"] });
  assert.equal(picksOf(qh).length, 3);

  const page = createPage({ localStorage: q.localStorage.dump() });
  page.load(scripts);
  const els = page.snapshot().els;
  assert.deepEqual(picksOf(els.recs.innerHTML), picksOf(qh));
  assert.equal(els["recs-h"].textContent, "Three to try next");
  assert.match(els.profile.innerHTML, /<p class="hint"><a href="quiz\.html">Also uses 4 answers from the quiz\.<\/a><\/p>/);
  assert.match(els.profile.innerHTML, new RegExp(`${esc(E.byId.sauvageedp.name)}, opening: you hated the bergamot <span class="src">`), "the evidence line names the note");
});

test("every rated card has a Rate its notes block that writes noteAnswers and unnoticed, and resends the rating", () => {
  const page = createPage({ localStorage: seed(), endpoint: "http://mock.local/api", respond: () => ({ ok: true }) });
  page.load(scripts);
  const rated = page.snapshot().els.rated.innerHTML;
  for (const id of Object.keys(ratings)) assert.match(rated, new RegExp(`<details class="nbox" data-nbox="${id}"><summary>Rate its notes</summary>`));
  const id = hated[0], P = E.byId[id], rows = N.questions(P, "worn");
  assert.equal((rated.match(new RegExp(`data-nid="${id}" data-v="-2"`, "g")) || []).length, rows.length, "one row per question");
  const a = rows.find(r => r.f === "woody_amber"), b = rows.find(r => r.f !== "woody_amber");
  page.click({ dataset: { na: a.f, nid: id, v: "-2" } });
  page.click({ dataset: { na: b.f, nid: id, v: "u" } });
  const r = stored(page)[id];
  assert.deepEqual(r.noteAnswers, { [a.f]: -2 });
  assert.deepEqual(r.unnoticed, [b.f]);
  const els = page.snapshot().els;
  assert.match(els.rated.innerHTML, new RegExp(`<details class="nbox" data-nbox="${id}" open><summary>Rate its notes <span class="ncount">2/${rows.length}</span>`));
  assert.match(els.rated.innerHTML, new RegExp(`<span class="npick">Hated it</span><button type="button" class="qlink" data-nedit="${a.f}" data-nid="${id}">Change</button>`));
  page.flushTimers();
  const sent = page.calls.filter(c => c.body && c.body.type === "rating").pop().body;
  assert.deepEqual([sent.perfume, sent.noteAnswers, sent.unnoticed], [id, { [a.f]: -2 }, [b.f]]);
  const words = a.words.en.length > 1 ? a.words.en.slice(0, -1).join(", ") + " and " + a.words.en[a.words.en.length - 1] : a.words.en[0] || FAMILIES[a.f].en[0].toLowerCase() + FAMILIES[a.f].en.slice(1);
  assert.match(els.profile.innerHTML, new RegExp(`${esc(P.name)}, drydown: you hated the ${words.replace(/[()]/g, "\\$&")} <span class="src">`), "the evidence line names the note");
  /* the same answer again clears it */
  page.click({ dataset: { nedit: a.f, nid: id } });
  page.click({ dataset: { na: a.f, nid: id, v: "-2" } });
  assert.equal("noteAnswers" in stored(page)[id], false);
});

test("with no rated perfume and an enjoyed note in the quiz, the profiler shows the quiz's heading and picks", () => {
  const answers = { notes: { lemon: 1, musk: -1 } };
  const q = createPage({ localStorage: quizSeed({ pp_quiz_v1: JSON.stringify(answers) }) });
  q.load(quizScripts);
  q.click({ dataset: { start: "1" } });
  q.click({ dataset: { none: "1" } });
  const qh = quizToEnd(q);
  assert.match(qh, /<h1>Based only on what you told us<\/h1>/);

  const page = createPage({ localStorage: q.localStorage.dump() });
  page.load(scripts);
  const els = page.snapshot().els;
  assert.equal(els["recs-h"].textContent, "Based only on what you told us");
  assert.equal(picksOf(els.recs.innerHTML).length, 3);
  assert.deepEqual(picksOf(els.recs.innerHTML), picksOf(qh).slice(0, 3));
  assert.match(els.profile.innerHTML, /Also uses 2 answers from the quiz\./);
  /* a pick holding a family the visitor said they avoid says so */
  const { picks } = E.recommend(E.computeProfile({ ratings: {}, auto: {}, images: {}, told: N.toldItems(answers) }), {});
  const risk = picks.map(p => p.risks.slice().sort((x, y) => y.sev - x.sev)[0]).find(x => x && x.kind === "told");
  assert.ok(risk, "a pick's main risk is a family the visitor avoids");
  const stage = { opening: "opening", heart: "heart", drydown: "drydown" }[risk.s];
  assert.match(els.recs.innerHTML, new RegExp(`Contains ${esc(FAMILIES[risk.f].en).replace(/[()]/g, "\\$&")} in the ${stage}, which you said you avoid\\.`));
});

test("zero bottles with a taste answer: no pick says the visitor said they avoid a family they never named", () => {
  const recsOf = answers => {
    const page = createPage({ localStorage: quizSeed({ pp_quiz_v1: JSON.stringify(answers) }) });
    page.load(scripts);
    const els = page.snapshot().els;
    assert.equal(els["recs-h"].textContent, "Based only on what you told us");
    assert.equal(picksOf(els.recs.innerHTML).length, 3);
    return els.recs.innerHTML;
  };
  assert.doesNotMatch(recsOf({ notes: { lemon: 1 }, taste: "sweet" }), /which you said you avoid/);
  /* "sweet" plus "avoid vanilla": citrus is pushed down only by the bitter side of the taste answer */
  const answers = { notes: { vanilla: -1 }, taste: "sweet" }, h = recsOf(answers);
  const { picks } = E.recommend(E.computeProfile({ ratings: {}, auto: {}, images: {}, told: N.toldItems(answers) }), {});
  const risk = picks.map(p => p.risks.slice().sort((x, y) => y.sev - x.sev)[0]).find(x => x && x.kind === "told");
  assert.ok(risk && risk.f === "citrus_fresh", "a pick's main risk is citrus, from the taste answer alone");
  const stage = { opening: "opening", heart: "heart", drydown: "drydown" }[risk.s];
  assert.match(h, new RegExp(`Contains ${esc(FAMILIES.citrus_fresh.en).replace(/[()]/g, "\\$&")} in the ${stage}, which your quiz answers lean against\\.`));
  assert.doesNotMatch(h, /which you said you avoid/);
});
