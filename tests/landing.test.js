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
  assert.match(h, /<h1>الورد والفانيلا والصندل كلها روائح جميلة، فلماذا لا يناسبك من العطور إلا القليل؟<\/h1>/);
  assert.match(h, /class="lp-atomizer" id="lp-atomizer" aria-label="بخّاخ عطر/);
  /* seven numbered steps, in order, before the quiz */
  const steps = [...h.matchAll(/<p class="lp-step">([^<]+)<\/p>/g)].map(m => m[1]);
  assert.deepEqual(steps, ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة"].map(w => "الخطوة " + w));
  assert.ok(h.indexOf("الخطوة السابعة") < h.indexOf('id="lp-quiz"'));
  /* the figures the steps quote come from the generated data, in correct Arabic */
  assert.match(h, /في قائمتنا 1000 عطر، وفي 972 منها تظهر بوضوح/);
  assert.match(h, /في قائمتنا 427 عطراً تظهر فيها عائلة الفانيلا بوضوح، وفي 152 منها خشب عنبري أيضاً/);
  assert.match(h, /وراجعنا ملصقات 12 عطراً من الدار نفسها، فوجدنا إيزو إي سوبر بين أول خمسة مكونات في 11 منها، ولم تذكره قائمة نوتات أيّ منها\./);
  /* the label beside the note list: the two materials the list leaves out are marked */
  assert.deepEqual([...h.matchAll(/<li class="hit"><b>([^<]+)<\/b>/g)].map(m => m[1]), ["إيزو إي سوبر", "غالاكسوليد"]);
  assert.equal((h.match(/<li class="s[1-5]"><span class="sr">/g) || []).length, 5, "one bar per star rating");
  assert.match(h, /<span class="sr">نجمتان: 489 عطراً<\/span>/);
  /* every call to action opens the quiz on its first question */
  const hrefs = [...h.matchAll(/<a class="btn primary[^"]*" href="([^"]+)"/g)].map(m => m[1]);
  assert.ok(hrefs.length >= 2);
  for (const href of hrefs) assert.equal(href, "quiz.html?go=1");
  assert.equal(page.snapshot().els["nav-quiz"].attrs.href, "quiz.html?go=1");
  /* the strips name catalogue families with true counts once opened (seven liked families in step 1, two families of
     synthetic materials in step 3); the tabs name perfumes the atomizer carries */
  assert.equal((h.match(/data-strip="/g) || []).length, 9);
  /* a hundred people per smell, from the survey: androstenone first, a third of them unable to smell it */
  assert.match(h, /data-nose="andro" style="[^"]*"|aria-pressed="true" data-nose="andro"/);
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
  assert.match(h, /<h1>Rose, vanilla and sandalwood all smell lovely\. So why do so few perfumes suit you\?<\/h1>/);
  assert.match(h, />Start the quiz</);
  assert.match(h, /<p class="lp-step">Step 7<\/p>/);
  assert.match(h, /Of the 1,000 perfumes in our catalogue, 972 clearly carry/);
  assert.match(h, /Of the 12 Parfums de Marly labels we checked, 11 name Iso E Super among the first five ingredients, and none of their note lists mentions it\./);
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
    const fams = new RegExp(`${lang}: \\{[\\s\\S]*?listFams: \\[([^\\]]*)\\]`).exec(words);
    for (const f of fams[1].match(/"(\w+)"/g).map(x => x.slice(1, -1))) assert.ok(f in LD.families, `${lang}: ${f} is a family`);
  }
});

test("the steps' words match the data they describe", () => {
  /* the copy names these by hand, so the data must still say the same */
  for (const f of LD.facts.liked.fams) assert.ok(f in LD.families, `${f} is a family`);
  assert.equal(LD.facts.liked.fams.length, 7);
  assert.deepEqual([LD.facts.pair.like, LD.facts.pair.dis], ["vanilla_gourmand", "woody_amber"], "step 5 speaks of vanilla and woody ambers");
  assert.equal(LD.example.id, "pegasus", "steps 3 and 4 name Pegasus");
  assert.ok(LD.example.photo && fs.existsSync(path.join(SITE, LD.example.photo)), "the example has a shipped photo");
  for (const st of ["opening", "heart", "drydown"]) for (const n of LD.example.notes[st]) assert.ok(n.ar, `${n.en}: its Arabic word`);
  assert.equal(LD.facts.labels.top, 5, "the copy says the first five ingredients");
  assert.deepEqual([...LD.example.label.filter(x => x.hidden).map(x => x.inci)], ["tetramethyl acetyloctahydronaphthalenes", "hexamethylindanopyran"], "step 3 names Iso E Super and Galaxolide as the materials the list leaves out");
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
  assert.ok(Math.abs((stars[0] + stars[1]) / 1207 - 0.5) < 0.02, "about half at one or two stars");
});
