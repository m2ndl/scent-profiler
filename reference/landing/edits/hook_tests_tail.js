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
  assert.equal(m[3], `${Number(m[2]) % 100 > 10 ? "عطراً" : Number(m[2]) % 100 === 0 ? "عطر" : "عطور"} خالية من المسك النظيف`);
});
