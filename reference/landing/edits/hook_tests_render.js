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

