
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
  assert.match(h, new RegExp(`${reEsc(esc(sauvage.name))} in four parts\\. Tap what you remember; skip what you don&#39;t\\.`));
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

  /* the picker hides the notes already answered on Sauvage's rows */
  h = html(page);
  assert.match(h, /<span class="qpart">Part 2 of 4 · Notes you know · 1 of 4<\/span>/);
  assert.match(h, /<h1>Fresh and green<\/h1>/);
  for (const id of ["bergamot", "lavender"]) assert.doesNotMatch(h, new RegExp(`data-pn="${id}"`), `${id} was answered on a bottle row`);
  assert.match(h, /data-pn="lemon" data-pv="0" aria-pressed="true">Not sure</);
  page.click({ dataset: { pn: "lemon", pv: "1" } });
  page.click({ dataset: { pn: "tea", pv: "1" } });
  assert.match(html(page), /data-pn="tea" data-pv="1" aria-pressed="true">I enjoy it</);
  page.click({ dataset: { continue: "1" } });
  assert.match(html(page), /<h1>Flowers and fruit<\/h1>/);
  page.click({ dataset: { pn: "peach", pv: "-1" } });
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
  /* note answers name the note; the hated citrus disagrees with the lemon enjoyed and the bitter answer */
  assert.match(block("citrus_fresh"), /Possible deal-breaker/);
  assert.match(block("citrus_fresh"), new RegExp(`<div class="hint">${reEsc(esc(sauvage.name))}: you hated the bergamot \\(first minutes\\)</div>`));
  assert.match(block("citrus_fresh"), /<div class="hint qdis">Your bottles and your answer disagree; your bottles count more\.<\/div>/);
  assert.match(block("lavender_aromatic"), new RegExp(`${reEsc(esc(sauvage.name))}: you loved the lavender \\(first hours\\)`));
  assert.doesNotMatch(h, new RegExp(`<b>${reEsc(esc(D.FAMILIES.woody_amber.en))}</b><span class="pill`), "an unnoticed family gives no evidence");
  /* the visitor's own words, each with its source */
  for (const line of ["You enjoy: lemon, tea", "You avoid: peach", "You prefer bitter to sweet", "Has bothered you: too sweet, soapy"])
    assert.match(h, new RegExp(`<div>${reEsc(line)} <span class="src">\\(from what you told us\\)</span></div>`));
  /* the unnoticed woody amber row brings the anosmia note although the answer was no */
  assert.match(h, new RegExp(`<div class="qnote">You did not notice the woody ambers \\(Ambroxan-type\\) in ${reEsc(esc(sauvage.name))}\\. Musks and woody ambers may be hard`));
  const { picks } = E.recommend(E.computeProfile({ ratings: r, auto: {}, images: {}, told: N.toldItems(quiz) }), r);
  assert.deepEqual([...h.matchAll(/data-event="sample:([^"]+)"/g)].map(m => m[1]).filter((x, i, a) => a.indexOf(x) === i), picks.map(p => p.P.id));
});

test("zero bottles and an enjoyed note: picks based only on what the visitor told, then the testers", () => {
  const page = open({ endpoint: ENDPOINT, respond: () => ({ ok: true }) });
  page.click({ dataset: { none: "1" } });
  page.click({ dataset: { pn: "lemon", pv: "1" } });
  finish(page);
  const h = html(page), quiz = stored(page, "pp_quiz_v1");
  assert.match(h, /<h1>Based only on what you told us<\/h1>/);
  const { picks } = E.recommend(E.computeProfile({ ratings: {}, auto: {}, images: {}, told: N.toldItems(quiz) }), {});
  assert.equal(picks.length, 3);
  assert.equal((h.match(/<div class="rec">/g) || []).length, 3);
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
  const page = open();
  const name = id => esc(E.byId[id].name);
  const at = () => {
    const h = html(page), n = /class="qname">([^<]*)</.exec(h);
    return /id="tiles"/.test(h) ? "grid" : /data-nskip=/.test(h) ? "notes " + n[1] : /data-verdict=/.test(h) ? "verdict " + n[1] : /data-skip="1"/.test(h) ? "narrow" : /data-pn=/.test(h) ? "picker" : "other";
  };
  assert.doesNotMatch(html(page), /data-back/, "no Back on the first screen");
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
    for (let i = 0; i < 4; i++) page.click({ dataset: { continue: "1" } });
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
  assert.match(h, /في خمسة أجزاء\. اختر ما تتذكره، وتجاوز ما لا تتذكره\./);
  assert.match(h, new RegExp(`<b>غير مذكور في قائمة نوتاته</b> · <span class="nfam">${reEsc(esc(D.FAMILIES[row.f].ar))}</span>`));
  assert.match(h, /data-v="u" aria-pressed="false">لم ألاحظه</);
  assert.match(h, /<span class="qpart">الجزء 1 من 4 · عطورك<\/span>/);
});

test("the page strings use no form of the Arabic verb for wearing clothes, and no em dash", () => {
  /* the root l-b-s with optional long vowels (لبس, يلبس, ملابس, ملبوس), diacritics removed first */
  const wear = /ل[اآ]?ب[وي]?س/;
  for (const f of ["quiz.js", "app.js", "notes.js"]) {
    const src = fs.readFileSync(path.join(SITE, "js", f), "utf8");
    assert.equal(wear.test(src.replace(/[ً-ْـ]/g, "")), false, `${f} uses the verb for wearing clothes`);
    assert.equal(src.includes("—"), false, `${f} has an em dash`);
  }
});
