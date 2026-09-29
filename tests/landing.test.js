/* The front page (site/index.html) under the stub browser (lib/dom.js): its generated data is current (the example
   result included, which is a run of the quiz), it renders in both languages from that data, every way into the quiz
   opens the quiz on its first question with the bottles marked as tried already picked, it starts the backend's funnel
   with one reach:start, and its words keep the site's rules. The mist, the bottles' swap and the motion need a real
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
  assert.deepEqual([...LD.sprays.map(s => s.id)], [...D.QUIZ.grid], "the stage shows the quiz's twenty bottles");
  assert.deepEqual([...Object.keys(LD.groups)].sort(), ["amber", "floral", "fresh", "musk", "oud", "rose", "spiced", "sweet", "woody"]);
  for (const s of LD.sprays) {
    assert.ok(s.photo && fs.existsSync(path.join(SITE, s.photo)), `${s.id} has a shipped photo`);
    /* its large picture for the stage (python tools/fetch_hero_bottles.py), sized, with the spray's point on its glass */
    const H = s.hero;
    assert.equal(H.src, `img/hero/${s.id}.webp`);
    assert.ok(fs.existsSync(path.join(SITE, H.src)), `${s.id}: its large picture`);
    assert.ok(H.w > 0 && H.h >= 300, `${s.id}: tall enough to stand sharp on a phone (${H.h} px)`);
    assert.ok(H.nx > 0.05 && H.nx < 0.95 && H.ny >= 0 && H.ny < 0.1, `${s.id}: the spray leaves from the top of the glass, off centre where the cap is, as on Good Girl's heel (${H.nx}, ${H.ny})`);
    for (const st of ["opening", "heart", "drydown"]) for (const n of s.notes[st]) {
      assert.ok(n.g in LD.groups, `${s.id} ${n.en}: a palate group`);
      assert.ok(n.ar, `${s.id} ${n.en}: its Arabic word (the two note lists of that stage must line up in data.js)`);
    }
  }
  /* the example result is what the quiz gives its visitor: two bottles still used, two that turned, a deal-breaker, three
     picks, each bottle with a shipped photo and both names */
  const R = LD.result;
  assert.equal(R.still.length, 2); assert.equal(R.turned.length, 2);
  assert.ok(R.breakers.length >= 1 && R.breakers.every(b => b.en && b.ar));
  assert.equal(R.picks.length, 3);
  assert.ok(R.palate.en && R.palate.ar && /^<svg class="qemblem" viewBox="0 0 64 64"/.test(R.emblem));
  assert.ok(R.out > 0 && R.out < LD.total);
  for (const b of R.still.concat(R.turned, R.picks)) {
    assert.ok(b.photo && fs.existsSync(path.join(SITE, b.photo)), `${b.id} has a shipped photo`);
    assert.ok(b.ar && b.name && b.house, `${b.id}: names`);
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
  assert.match(h, /<h1>اشتريت عطراً ثم تركته؟ قد تكون نوتة واحدة هي السبب\.<\/h1>/);
  /* one of the twenty bottles stands on the stage before any spray, named in its label */
  const first = /<button type="button" class="lp-bottle" id="lp-bottle" aria-label="([^"]+)\. اضغط لترشّه وترى نوتاته، والضغطة التالية تأتي بعطر آخر من عطور الاختبار العشرين\."><span class="lp-glass" id="lp-glass"><img src="img\/hero\/([a-z0-9]+)\.webp"/.exec(h);
  assert.ok(first, "the bottle on the stage");
  const onStage = LD.sprays.find(s => s.id === first[2]);
  assert.ok(onStage && first[1] === (onStage.ar || onStage.name));
  assert.match(h, /<span class="lp-hint" id="lp-hint">اضغط على الزجاجة<\/span>/);
  assert.doesNotMatch(h, /atomizer|lp-poster/);
  /* the sections in order: the result, then three that turn on one tap each, then the quiz and the articles */
  const order = [...h.matchAll(/<section class="lp-sec [^"]*" id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(order, ["lp-get", "lp-test", "lp-list", "lp-nose", "lp-quiz", "lp-arts"]);
  assert.doesNotMatch(h, /class="lp-next"/, "no closing question cards");
  assert.equal((h.match(/<details class="lp-srcx"><summary>المصادر<\/summary>/g) || []).length, 3, "the three evidence sections' sources, folded");
  /* the example result, as the quiz gives it */
  const R = LD.result;
  assert.ok(h.includes(R.emblem));
  assert.match(h, new RegExp(`<p class="lp-res-k">ذائقتك</p><h3>${R.palate.ar}</h3>`));
  assert.match(h, new RegExp(`<span class="lp-res-chip">${R.breakers[0].ar}</span>`));
  assert.match(h, new RegExp(`<b data-count="${R.out}">${R.out}</b><span>عطراً استُبعدت من 1000 عطر في قائمتنا</span>`));
  for (const b of R.picks) assert.match(h, new RegExp(`<img src="${b.photo}" alt="" loading="lazy"><figcaption><b>${b.ar}</b>`));
  assert.match(h, new RegExp(`مثال: ما زال يستخدم ${R.still[0].ar} و${R.still[1].ar}، وانقلب عليه ${R.turned[0].ar} و${R.turned[1].ar}\\.`));
  /* the 1,000-perfume test starts at the whole catalogue, with only the smells to tap as disliked */
  assert.match(h, /<b id="lp-count" data-now="1000">1000<\/b><span id="lp-count-k">عطر في قائمتنا<\/span>/);
  assert.equal((h.match(/data-like="/g) || []).length, 0);
  assert.equal((h.match(/data-hate="/g) || []).length, 8);
  assert.ok(h.indexOf('data-hate="') < h.indexOf('id="lp-meter"'), "the smells come before the count, so a tap shows its result below it");
  /* the box and its label: the two materials the note list leaves out are marked, and the count reads in Arabic */
  assert.deepEqual([...h.matchAll(/<li class="hit"><b>([^<]+)<\/b>/g)].map(m => m[1]), ["إيزو إي سوبر", "غالاكسوليد"]);
  assert.match(h, /في 11 من 12 ملصقاً راجعناها لهذه الدار يأتي إيزو إي سوبر بين أول خمسة مكونات\. ولا تذكره قائمة نوتات أيّ منها\./);
  /* every call to action opens the quiz on its first question */
  const hrefs = [...h.matchAll(/<a class="btn primary[^"]*" href="([^"]+)"/g)].map(m => m[1]);
  assert.ok(hrefs.length >= 4);
  for (const href of hrefs) assert.equal(href, "quiz.html?go=1");
  assert.equal(page.snapshot().els["nav-quiz"].attrs.href, "quiz.html?go=1");
  assert.match(h, />اكتشف ما يناسبك</);
  /* a hundred people per smell, from the survey: the clean musk first, a third of them unable to smell it */
  assert.match(h, /aria-pressed="true" data-nose="musk"/);
  assert.match(h, /<section class="lp-sec lp-nose lp-band" id="lp-nose">/);
  assert.equal((h.match(/<i class="(on|off)" style="--k:/g) || []).length, 100);
  assert.equal((h.match(/<i class="off" style="--k:/g) || []).length, 33);
  assert.match(h, /<span class="on">نحو 67 يشمّونها<\/span><span class="off">نحو 33 لا يشمّونها<\/span>/, "survey shares are marked as approximate");
  assert.match(h, /<ol class="lp-steps"><li><b>1<\/b><span>عطورك<\/span><\/li>/);
  assert.match(h, /href="articles\.html#woody-ambers"/);
  page.sandbox.document.getElementById("lang-en").listeners.click[0]();
  h = html(page);
  assert.equal(page.snapshot().html.dir, "ltr");
  assert.match(h, /<h1>Bought a perfume you never wear\? One note may be why\.<\/h1>/);
  const attr = x => x.replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(h, new RegExp(`aria-label="${attr(onStage.name)}\\. ${attr("Press to spray it and see its notes; the next press brings another of the quiz's twenty perfumes.")}"><span class="lp-glass" id="lp-glass"><img src="img/hero/${onStage.id}\\.webp"`), "the same bottle stays through a language switch");
  assert.match(h, />Find what suits me</);
  assert.match(h, new RegExp(`<p class="lp-res-k">Your palate</p><h3>${R.palate.en}</h3>`));
  assert.match(h, new RegExp(`<b data-count="${R.out}">${R.out}</b><span>of our 1,000 perfumes ruled out</span>`));
  assert.match(h, /<b id="lp-count" data-now="1000">1,000<\/b><span id="lp-count-k">perfumes in our catalogue<\/span>/);
  assert.match(h, /11 of the 12 Parfums de Marly labels we checked list Iso E Super among the first five ingredients\. None of their note lists mentions it\./);
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

  /* ?tried: the bottles marked as tried on the front page arrive picked; an unknown id is ignored, a rated one stays rated */
  const tried = createPage({ search: "?go=1&tried=yara,nosuch,khamrah,libre", localStorage: { pp_device: JSON.stringify("d_go"), pp_lang: JSON.stringify("en"), pp_ratings_v1: JSON.stringify({ libre: { opening: null, heart: null, drydown: 1, again: 1, chips: {} } }) } });
  tried.load(quizScripts);
  const tiles = tried.snapshot().els.tiles.innerHTML;
  assert.deepEqual([...tiles.matchAll(/data-tile="([^"]+)" aria-pressed="true"/g)].map(m => m[1]).sort(), ["khamrah", "yara"]);
  assert.match(tried.snapshot().els["grid-actions"].innerHTML, /<span class="qgo-t">Continue with 2<\/span>/);
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
    /* every smell in the test has a short name in both languages */
    const names = new RegExp(`${lang}: \\{[\\s\\S]*?testNames: \\{([^}]*)\\}`).exec(words);
    const keys = [...names[1].matchAll(/(\w+):/g)].map(x => x[1]).sort();
    assert.deepEqual(keys, [...LD.test.dislikes].sort(), `${lang}: the test's smells`);
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
  /* every ingredient shown has its common name in both languages */
  const page = open();
  for (const lang of ["ar", "en"]) {
    if (lang === "en") page.sandbox.document.getElementById("lang-en").listeners.click[0]();
    const h = html(page);
    for (const x of LD.example.label) assert.match(h, new RegExp(`<b>[^<]+</b><span dir="ltr" lang="en">${x.raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</span>`), `${lang}: ${x.raw}`);
    assert.doesNotMatch(h, new RegExp(`<b>${LD.example.label[2].raw}</b>`), `${lang}: Iso E Super is named, not only its chemical name`);
  }
  /* the result's words: four perfumes, two still used and two that turned (tools/build_landing.js VISITOR); the test's
     verdict names rose, vanilla and citrus among the popular smells */
  assert.equal(LD.result.still.length + LD.result.turned.length, 4, "the copy says four perfumes");
  for (const f of ["rose", "vanilla_gourmand", "citrus_fresh"]) assert.ok(LD.test.likes.includes(f), `${f} is one of the popular smells`);
});

test("the 1,000-perfume test: one smell the visitor cannot stand, set beside all the popular smells", () => {
  const page = open({ localStorage: { pp_lang: JSON.stringify("en") } });
  const tap = dataset => page.sandbox.document.getElementById("lp").listeners.click[0]({ target: { closest: sel => (sel === "button" ? { id: "", dataset } : null) }, detail: 1, preventDefault() {} });
  const el = id => page.snapshot().els[id];
  const all = [...LD.test.likes, ...LD.test.dislikes], bit = f => 1 << all.indexOf(f);
  const liked = LD.test.likes.reduce((m, f) => m | bit(f), 0);
  const none = LD.test.masks.filter(x => !(x & liked)).length;
  const gone = f => LD.test.masks.filter(x => x & bit(f)).length;
  assert.match(html(page), /<div class="lp-verdict" id="lp-verdict" hidden>/, "no verdict before a tap");
  tap({ hate: "woody_amber" });
  assert.equal(el("lp-count").textContent, (LD.total - gone("woody_amber")).toLocaleString("en-US"));
  assert.equal(el("lp-count-k").textContent, "left after ruling out woody ambers");
  assert.equal(el("lp-verdict").hidden, false);
  assert.equal(el("lp-verdict-t").textContent, `One smell you can't stand ruled out ${gone("woody_amber").toLocaleString("en-US")}. Only ${none} of the 1,000 have none of rose, vanilla, citrus and the other popular smells.`);
  /* the headline's claim holds whichever smell is tapped */
  for (const f of LD.test.dislikes) assert.ok(gone(f) > none, `${f} rules out more (${gone(f)}) than all the popular smells (${none})`);
  assert.ok(gone("woody_amber") > 10 * none && gone("white_musk") > 10 * none, "the two chips shown first make the largest cut");
  /* the test counts as the quiz rules out: the example result's one deal-breaker, woody ambers, rules out the same number
     a few screens above */
  assert.deepEqual([...LD.result.breakers.map(b => b.en)], ["Woody ambers"]);
  assert.equal(gone("woody_amber"), LD.result.out);
  /* a second tap on the same smell takes it back; another replaces it */
  tap({ hate: "woody_amber" });
  assert.equal(el("lp-verdict").hidden, true);
  assert.equal(el("lp-count").textContent, "1,000");
  tap({ hate: "white_musk" });
  assert.equal(el("lp-count-k").textContent, "left after ruling out clean musk");
  /* in Arabic the noun agrees with the number */
  page.sandbox.document.getElementById("lang-ar").listeners.click[0]();
  const h = html(page), m = /<b id="lp-count" data-now="(\d+)">(\d+)<\/b><span id="lp-count-k">([^<]+)<\/span>/.exec(h);
  assert.ok(m, "the count after a language switch");
  const n = Number(m[2]), r = n % 100, noun = r === 0 || (n > 100 && r <= 2) ? "عطر" : r <= 10 ? "عطور" : "عطراً";
  assert.equal(m[3], `${noun} بعد استبعاد المسك النظيف`);
  assert.match(h, new RegExp(`رائحة واحدة لا تطيقها استبعدت ${gone("white_musk")} عطراً\\. أما الورد والفانيلا والحمضيات وغيرها من الروائح الشائعة فلا يخلو منها كلها إلا ${none} عطراً من الألف\\.`));
});

test("under the bottle, tried it? Yes carries the bottle into every link to the quiz, and Not yet sprays another", () => {
  const page = open({ endpoint: ENDPOINT, localStorage: { pp_device: JSON.stringify("d_tried"), pp_lang: JSON.stringify("en") } });
  const tap = dataset => page.sandbox.document.getElementById("lp").listeners.click[0]({ target: { closest: sel => (sel === "button" ? { id: "", dataset } : null) }, detail: 1, preventDefault() {} });
  const sprayed = () => { const cap = page.snapshot().els["lp-caption"], m = cap && /^<div class="lp-cap-t" data-id="([^"]+)">/.exec(cap.innerHTML); return m ? LD.sprays.find(s => s.id === m[1]) : null; };
  const label = () => page.snapshot().els["lp-bottle"].attrs["aria-label"];
  assert.equal(sprayed(), null, "nothing sprayed before the page's own first spray");
  page.flushTimers();   /* the first spray, once the bottle is in view (at once without IntersectionObserver) */
  const first = sprayed();
  assert.ok(first, "the first spray names one of the twenty");
  assert.match(html(page), new RegExp(`<img src="img/hero/${first.id}\\.webp"`), "the first spray is the bottle that stood on the stage");
  assert.match(page.snapshot().els["lp-caption"].innerHTML, /<span class="lp-tried-q">Tried it\?<\/span>\s*<button type="button" class="lp-tried-yes" data-tried="yes">Yes<\/button><button type="button" class="lp-tried-no" data-tried="no">Not yet<\/button>/);
  tap({ tried: "yes" });
  assert.match(page.snapshot().els["lp-caption"].innerHTML, /<span class="lp-tried-q">Added to your quiz<\/span>/);
  const quizHref = () => page.snapshot().els["nav-quiz"].attrs.href;
  assert.equal(quizHref(), `quiz.html?go=1&tried=${first.id}&endpoint=${encodeURIComponent(ENDPOINT)}`);
  assert.deepEqual(page.calls.filter(c => c.body && c.body.name === "land:tried").map(c => c.body.n), [1]);
  page.flushTimers();   /* the next perfume comes on its own, never one already marked */
  const second = sprayed();
  assert.ok(second && second.id !== first.id);
  tap({ tried: "no" });
  const third = sprayed();
  assert.ok(third && third.id !== second.id && third.id !== first.id, "Not yet sprays another at once");
  assert.ok(label().startsWith(third.name + ". Press to spray it"), "the bottle's label names the perfume now on the stage");
  assert.equal(quizHref(), `quiz.html?go=1&tried=${first.id}&endpoint=${encodeURIComponent(ENDPOINT)}`, "Not yet adds nothing");
  /* a redraw (here a language switch) keeps the tried bottles, and the calls to action say how many */
  page.sandbox.document.getElementById("lang-ar").listeners.click[0]();
  const h = html(page);
  const hrefs = [...h.matchAll(/<a class="btn primary[^"]*" href="([^"]+)"/g)].map(m => m[1]);
  assert.ok(hrefs.length >= 4 && hrefs.every(x => x === `quiz.html?go=1&amp;tried=${first.id}&amp;endpoint=${encodeURIComponent(ENDPOINT)}`));
  assert.match(h, />تابع مع عطر واحد</);
});
