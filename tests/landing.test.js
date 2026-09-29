/* The front page (site/index.html) under the stub browser (lib/dom.js): its generated data is current, it renders in
   both languages from that data, every way into the quiz opens the quiz on its first question, it starts the backend's
   funnel with one reach:start, and its words keep the site's rules. The atomizer's mist and motion need a real
   browser; here the page must simply render without them. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { SITE, loadSite } = require("../tools/lib/site");
const { build, OUT } = require("../tools/build_landing");
const { createPage } = require("./lib/dom");

const scriptsOf = file => [...fs.readFileSync(path.join(SITE, file), "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
const landingScripts = scriptsOf("index.html"), quizScripts = scriptsOf("quiz.html");
const ENDPOINT = "http://mock.local/api";
const LD = (() => { const c = vm.createContext({}); vm.runInContext("globalThis.window = globalThis;", c); vm.runInContext(fs.readFileSync(OUT, "utf8"), c); return c.PP_LANDING_DATA; })();
const open = opts => { const p = createPage(opts || {}); p.load(landingScripts); return p; };
const html = page => page.snapshot().els.lp.innerHTML;

test("site/js/landing-data.js is current (run node tools/build_landing.js)", () => {
  assert.equal(fs.readFileSync(OUT, "utf8"), build().text);
  const D = loadSite("data").PP_DATA;
  assert.equal(LD.total, D.PERFUMES.length);
  assert.deepEqual([...LD.sprays.map(s => s.id)], [...D.QUIZ.grid], "the atomizer sprays the quiz's twenty bottles");
  assert.deepEqual([...Object.keys(LD.groups)].sort(), ["amber", "floral", "fresh", "musk", "oud", "rose", "spiced", "sweet", "woody"]);
  for (const s of LD.sprays) {
    assert.ok(s.photo && fs.existsSync(path.join(SITE, s.photo)), `${s.id} has a shipped photo`);
    for (const st of ["opening", "heart", "drydown"]) for (const n of s.notes[st]) {
      assert.ok(n.g in LD.groups, `${s.id} ${n.en}: a palate group`);
      assert.ok(n.ar, `${s.id} ${n.en}: its Arabic word (the two note lists of that stage must line up in data.js)`);
    }
  }
});

test("index.html is the front page and quiz.html the quiz", () => {
  assert.deepEqual(landingScripts.map(s => s.filename), ["js/config.js", "js/page.js", "js/landing-data.js", "js/landing.js"]);
  assert.ok(quizScripts.some(s => s.filename === "js/quiz.js"));
  assert.match(fs.readFileSync(path.join(SITE, "index.html"), "utf8"), /<link rel="stylesheet" href="landing\.css">/);
  for (const f of ["profile.html", "articles.html"]) assert.doesNotMatch(fs.readFileSync(path.join(SITE, f), "utf8"), /id="nav-quiz" href="index\.html"|href="index\.html" id="nav-quiz"/, `${f} leads to the quiz, not the front page`);
});

test("the front page renders in Arabic first and in English, from the catalogue's data", () => {
  const page = open();
  let h = html(page);
  assert.equal(page.snapshot().html.dir, "rtl");
  assert.match(h, /<h1>نوتة واحدة قد تفسد عليك العطر كله\. اعرف أيّها\.<\/h1>/);
  assert.match(h, /class="lp-atomizer" id="lp-atomizer" aria-label="بخّاخ عطر/);
  /* the atomizer's still picture, turned for Arabic; js/bottle3d.js replaces it with the live one where it can */
  assert.match(h, /<img class="lp-poster" src="img\/atomizer-rtl\.webp"/);
  /* the sections in order, each ending on the question the next one answers */
  const order = [...h.matchAll(/<section class="lp-sec [^"]*" id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(order, ["lp-test", "lp-list", "lp-nose", "lp-spoil", "lp-crit", "lp-time", "lp-quiz", "lp-arts"]);
  const nexts = [...h.matchAll(/class="lp-next" href="#([^"]+)" data-next="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(nexts, ["lp-list", "lp-nose", "lp-spoil", "lp-crit", "lp-time", "lp-quiz"], "each closing question leads to the next section");
  assert.equal((h.match(/<details class="lp-srcx"><summary>المصادر<\/summary>/g) || []).length, 6, "every section's sources, folded");
  /* the 1,000-perfume test starts at the whole catalogue */
  assert.match(h, /<b id="lp-count" data-now="1000">1000<\/b><span id="lp-count-k">عطر في قائمتنا<\/span>/);
  assert.equal((h.match(/data-like="/g) || []).length, 7);
  assert.equal((h.match(/data-hate="/g) || []).length, 8);
  /* the box and its label: the two materials the note list leaves out are marked, and the count reads in Arabic */
  assert.deepEqual([...h.matchAll(/<li class="hit"><b>([^<]+)<\/b>/g)].map(m => m[1]), ["إيزو إي سوبر", "غالاكسوليد"]);
  assert.match(h, /في 11 من 12 ملصقاً راجعناها لهذه الدار يأتي إيزو إي سوبر بين أول خمسة مكونات\. ولا تذكره قائمة نوتات أيّ منها\./);
  assert.equal((h.match(/<li class="s[1-5]"><span class="sr">/g) || []).length, 5, "one bar per star rating");
  assert.match(h, /<span class="sr">نجمتان: 489 عطراً<\/span>/);
  /* every call to action opens the quiz on its first question */
  const hrefs = [...h.matchAll(/<a class="btn primary[^"]*" href="([^"]+)"/g)].map(m => m[1]);
  assert.ok(hrefs.length >= 3);
  for (const href of hrefs) assert.equal(href, "quiz.html?go=1");
  assert.equal(page.snapshot().els["nav-quiz"].attrs.href, "quiz.html?go=1");
  /* a hundred people per smell, from the survey: the clean musk first, a third of them unable to smell it */
  assert.match(h, /aria-pressed="true" data-nose="musk"/);
  assert.equal((h.match(/<i class="(on|off)" style="--k:/g) || []).length, 100);
  assert.equal((h.match(/<i class="off" style="--k:/g) || []).length, 33);
  assert.match(h, /<span class="on" style="--c:[^"]*">نحو 67 يشمّونها<\/span><span class="off">نحو 33 لا يشمّونها<\/span>/, "survey shares are marked as approximate");
  /* the day of wear reads in correct Arabic: ten minutes take the plural, and the stage is named apart from the time */
  assert.match(h, /id="lp-now">بعد 10 دقائق · المرحلة: <b>الدقائق الأولى<\/b>/);
  assert.match(h, /<span>2 س<\/span>/);
  assert.match(h, /data-spoil="khamrah"/);
  assert.match(h, /data-time="sauvageedp"/);
  assert.match(h, /href="articles\.html#woody-ambers"/);
  page.sandbox.document.getElementById("lang-en").listeners.click[0]();
  h = html(page);
  assert.equal(page.snapshot().html.dir, "ltr");
  assert.match(h, /<h1>One note can ruin a perfume for you\. Find out which\.<\/h1>/);
  assert.match(h, /<img class="lp-poster" src="img\/atomizer-ltr\.webp"/);
  assert.match(h, />Find your deal-breakers</);
  assert.match(h, /<b id="lp-count" data-now="1000">1,000<\/b><span id="lp-count-k">perfumes in our catalogue<\/span>/);
  assert.match(h, /11 of the 12 Parfums de Marly labels we checked list Iso E Super among the first five ingredients\. None of their note lists mentions it\./);
  assert.match(h, /id="lp-now">10 minutes in · Stage: <b>First minutes<\/b>/);
  assert.equal(JSON.parse(page.localStorage.getItem("pp_lang")), "en");
});

test("with a backend, the front page starts the funnel: one reach:start from the device id the quiz uses", () => {
  const page = open({ endpoint: ENDPOINT, localStorage: { pp_device: JSON.stringify("d_front") } });
  const events = page.calls.filter(c => c.body && c.body.type === "event");
  assert.deepEqual(events.map(c => c.body), [{ type: "event", name: "reach:start", n: 0, device: "d_front", lang: "ar" }]);
  assert.equal(events[0].url, ENDPOINT);
  /* local testing carries the endpoint into the quiz */
  assert.match(html(page), new RegExp(`href="quiz\\.html\\?go=1&amp;endpoint=${encodeURIComponent(ENDPOINT).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  /* a first visit makes the device id in the same form as page.js */
  const fresh = open({ endpoint: ENDPOINT });
  assert.match(JSON.parse(fresh.localStorage.getItem("pp_device")), /^d_[a-z0-9]+$/);
  /* without a backend nothing is sent */
  assert.equal(open().calls.length, 0);
});

test("quiz.html?go opens the quiz on its first question, and Back leads to the start screen", () => {
  const page = createPage({ endpoint: ENDPOINT, search: "?go=1", localStorage: { pp_device: JSON.stringify("d_go"), pp_lang: JSON.stringify("en") }, respond: () => ({ ok: true }) });
  page.load(quizScripts);
  let h = page.snapshot().els.quiz.innerHTML;
  assert.match(h, /<h1>Which of these have you tried\?<\/h1>/);
  const reached = page.calls.filter(c => c.body && c.body.type === "event").map(c => c.body.name);
  assert.ok(reached.includes("reach:grid") && !reached.includes("reach:start"), "the front page sent reach:start; the quiz does not repeat it");
  page.click({ dataset: { back: "1" } });
  h = page.snapshot().els.quiz.innerHTML;
  assert.match(h, /data-start="1"/);
  assert.ok(!page.calls.some(c => c.body && c.body.name === "reach:start"), "Back to the start screen does not send reach:start again");
});

test("the front page's words keep the site's rules", () => {
  const src = fs.readFileSync(path.join(SITE, "js", "landing.js"), "utf8");
  const words = src.slice(src.indexOf("const T = PAGE.words("), src.indexOf("const t = () => T[lang];"));
  assert.ok(words.length > 1000);
  assert.doesNotMatch(words, /\u2014/, "no em dash");
  assert.doesNotMatch(words, /لبس|يلبس|ألبس|لبست/, "wearing a perfume is جرّب or استخدم, never لبس");
  assert.doesNotMatch(words.replace(/\bdrydown:/g, ""), /ended|انتهى|انتهت|drydown|dry-down/i, "no framing of a perfume by how it ends (the stage key drydown aside)");
  /* the survey figures: no smell is shown as reaching everyone (1.2% of the survey had no sense of smell at all) */
  assert.doesNotMatch(words, /can: 100\b/);
  const T = (() => { const c = vm.createContext({}); vm.runInContext("globalThis.window = globalThis;", c); vm.runInContext(fs.readFileSync(path.join(SITE, "js", "page.js"), "utf8"), c); return c.PP_PAGE; })();
  assert.ok(T && T.words, "page.js exposes the shared words");
  for (const lang of ["en", "ar"]) {
    const m = new RegExp(`${lang}: \\{[\\s\\S]*?spoilIds: \\[([^\\]]*)\\][\\s\\S]*?timeIds: \\[([^\\]]*)\\]`).exec(words);
    assert.ok(m, lang);
    for (const id of (m[1] + "," + m[2]).match(/"(\w+)"/g).map(x => x.slice(1, -1))) assert.ok(LD.sprays.some(s => s.id === id), `${lang}: ${id} is one of the atomizer's perfumes`);
    /* every smell in the test has a short name in both languages */
    const names = new RegExp(`${lang}: \\{[\\s\\S]*?testNames: \\{([^}]*)\\}`).exec(words);
    const keys = [...names[1].matchAll(/(\w+):/g)].map(x => x[1]).sort();
    assert.deepEqual(keys, [...LD.test.likes, ...LD.test.dislikes].sort(), `${lang}: the test's smells`);
  }
});

test("the sections' words match the data they describe", () => {
  /* the copy names these by hand, so the data must still say the same */
  for (const f of [...LD.test.likes, ...LD.test.dislikes]) assert.ok(f in LD.families, `${f} is a family`);
  assert.equal(LD.test.masks.length, LD.total, "one number per catalogue perfume");
  assert.equal(LD.example.id, "pegasus", "the box and the musk name Pegasus");
  assert.equal(["opening", "heart", "drydown"].reduce((n, st) => n + LD.example.notes[st].length, 0), 9, "the copy says its box lists nine notes");
  assert.deepEqual([LD.example.notes.opening[0].en, LD.example.notes.drydown[0].en], ["bergamot", "vanilla"], "from bergamot to vanilla");
  assert.ok(LD.example.photo && fs.existsSync(path.join(SITE, LD.example.photo)), "the example has a shipped photo");
  for (const st of ["opening", "heart", "drydown"]) for (const n of LD.example.notes[st]) assert.ok(n.ar, `${n.en}: its Arabic word`);
  assert.equal(LD.facts.labels.top, 5, "the copy says the first five ingredients");
  assert.deepEqual([...LD.example.label.filter(x => x.hidden).map(x => x.inci)], ["tetramethyl acetyloctahydronaphthalenes", "hexamethylindanopyran"], "the copy names Iso E Super and Galaxolide as the materials the list leaves out");
  const musk = LD.families.white_musk.count;
  assert.ok(musk >= 400 && musk < 500, `"nearly half" of the catalogue carries a clean musk (${musk})`);
  for (const side of ["ltr", "rtl"]) assert.ok(fs.existsSync(path.join(SITE, "img", `atomizer-${side}.webp`)), `the ${side} still picture (python tools/render_atomizer.py)`);
  /* every ingredient shown has its common name in both languages */
  const page = open();
  for (const lang of ["ar", "en"]) {
    if (lang === "en") page.sandbox.document.getElementById("lang-en").listeners.click[0]();
    const h = html(page);
    for (const x of LD.example.label) assert.match(h, new RegExp(`<b>[^<]+</b><span dir="ltr" lang="en">${x.raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</span>`), `${lang}: ${x.raw}`);
    assert.doesNotMatch(h, new RegExp(`<b>${LD.example.label[2].raw}</b>`), `${lang}: Iso E Super is named, not only its chemical name`);
  }
  /* the critics' stars add up to the 1,207 reviews the words cite */
  const src = fs.readFileSync(path.join(SITE, "js", "landing.js"), "utf8");
  const stars = /const STARS = \[([^\]]+)\]/.exec(src)[1].split(",").map(Number);
  assert.equal(stars.reduce((a, b) => a + b, 0), 1207);
  assert.equal(stars[4], 19, "five stars to 19");
  assert.ok(Math.abs((stars[0] + stars[1]) / 1207 - 0.5) < 0.02, "nearly half at one or two stars");
});

test("the 1,000-perfume test counts what a visitor likes, then what one dislike takes out", () => {
  const page = open({ localStorage: { pp_lang: JSON.stringify("en") } });
  const tap = dataset => page.sandbox.document.getElementById("lp").listeners.click[0]({ target: { closest: sel => (sel === "button" ? { id: "", dataset } : null) }, detail: 1, preventDefault() {} });
  const el = id => page.snapshot().els[id];
  const all = [...LD.test.likes, ...LD.test.dislikes], bit = f => 1 << all.indexOf(f);
  const count = (liked, hated) => {
    const L = liked.reduce((m, f) => m | bit(f), 0), H = hated ? bit(hated) : 0;
    let n = 0, m = 0;
    for (const x of LD.test.masks) if (!L || x & L) { n++; if (!(x & H)) m++; }
    return { n, m };
  };
  tap({ like: "rose" }); tap({ like: "vanilla_gourmand" }); tap({ like: "citrus_fresh" });
  let c = count(["rose", "vanilla_gourmand", "citrus_fresh"]);
  assert.equal(el("lp-count").textContent, c.n.toLocaleString("en-US"));
  assert.equal(el("lp-count-k").textContent, "have something you like");
  assert.equal(el("lp-verdict").hidden, true, "no verdict before a dislike");
  tap({ hate: "woody_amber" });
  c = count(["rose", "vanilla_gourmand", "citrus_fresh"], "woody_amber");
  assert.equal(el("lp-count").textContent, c.m.toLocaleString("en-US"));
  assert.equal(el("lp-count-k").textContent, "left without woody amber");
  assert.equal(el("lp-verdict").hidden, false);
  assert.equal(el("lp-verdict-t").textContent, `Your likes ruled out ${(LD.total - c.n).toLocaleString("en-US")}. One dislike ruled out ${(c.n - c.m).toLocaleString("en-US")}.`);
  assert.ok(c.n - c.m > (LD.total - c.n) * 3, "one dislike rules out far more than all three likes together");
  /* a second tap on the same dislike takes it back; another dislike replaces it */
  tap({ hate: "woody_amber" });
  assert.equal(el("lp-verdict").hidden, true);
  tap({ hate: "white_musk" });
  assert.equal(el("lp-count-k").textContent, "left without clean musk");
  /* in Arabic the noun agrees with the number */
  page.sandbox.document.getElementById("lang-ar").listeners.click[0]();
  const h = html(page), m = /<b id="lp-count" data-now="(\d+)">(\d+)<\/b><span id="lp-count-k">([^<]+)<\/span>/.exec(h);
  assert.ok(m, "the count after a language switch");
  const n = Number(m[2]), r = n % 100, noun = r === 0 || (n > 100 && r <= 2) ? "عطر" : r <= 10 ? "عطور" : "عطراً";
  assert.equal(m[3], `${noun} خالية من المسك النظيف`);
});
