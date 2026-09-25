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
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
const W = loadSite("data", "mapper", "materials", "evidence", "engine");
const E = W.PP_ENGINE.create(W.PP_DATA, W.PP_MAP, W.PP_EVIDENCE);
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
  assert.deepEqual(scripts.map(s => s.filename), ["js/config.js", "js/data.js", "js/mapper.js", "js/materials.js", "js/evidence.js", "js/engine.js", "js/app.js"]);
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
  assert.match(page.clipboard[0], /^Drydown Profiler · \d{4}-\d{2}-\d{2}\n/);
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
