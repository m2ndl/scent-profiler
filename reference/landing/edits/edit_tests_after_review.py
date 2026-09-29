"""One-off: updates tests/landing.test.js to the reviewed wording (29 Sep 2026). Exact-match edits; fails on a second run."""
p = r"C:\Users\malha\Desktop\Webapps\perfume-profiler\tests\landing.test.js"
s = open(p, encoding="utf-8").read()
pairs = [
    ('''  assert.match(h, new RegExp(`مثال: ما زال يستخدم ${R.still[0].ar} و${R.still[1].ar}، وانقلب عليه ${R.turned[0].ar} و${R.turned[1].ar} بعد ساعات\\\\.`));''',
     '''  assert.match(h, new RegExp(`مثال: ما زال يستخدم ${R.still[0].ar} و${R.still[1].ar}، وانقلب عليه ${R.turned[0].ar} و${R.turned[1].ar}\\\\.`));'''),
    ('''  assert.match(h, />اكتشف عطورك الثلاثة</);''', '''  assert.match(h, />اكتشف ما يناسبك</);'''),
    ('''  assert.match(h, />Get my three picks</);''', '''  assert.match(h, />Find what suits me</);'''),
    ('''  assert.equal(el("lp-count-k").textContent, "left without woody amber");''', '''  assert.equal(el("lp-count-k").textContent, "left after ruling out woody ambers");'''),
    ('''  assert.equal(el("lp-verdict-t").textContent, `One smell you can't stand ruled out ${gone("woody_amber").toLocaleString("en-US")}. Liking rose, vanilla, citrus and the other popular smells rules out only ${none}.`);''',
     '''  assert.equal(el("lp-verdict-t").textContent, `One smell you can't stand ruled out ${gone("woody_amber").toLocaleString("en-US")}. Only ${none} of the 1,000 have none of rose, vanilla, citrus and the other popular smells.`);'''),
    ('''  assert.equal(el("lp-count-k").textContent, "left without clean musk");''', '''  assert.equal(el("lp-count-k").textContent, "left after ruling out clean musk");'''),
    ('''  assert.equal(m[3], `${noun} خالية من المسك النظيف`);
  assert.match(h, new RegExp(`رائحة واحدة لا تطيقها استبعدت ${gone("white_musk")} عطراً\\\\. أما حبّك للورد والفانيلا والحمضيات وغيرها من الروائح الشائعة فلا يستبعد إلا ${none} عطراً\\\\.`));''',
     '''  assert.equal(m[3], `${noun} بعد استبعاد المسك النظيف`);
  assert.match(h, new RegExp(`رائحة واحدة لا تطيقها استبعدت ${gone("white_musk")} عطراً\\\\. أما الورد والفانيلا والحمضيات وغيرها من الروائح الشائعة فلا يخلو منها كلها إلا ${none} عطراً من الألف\\\\.`));'''),
    ('''  assert.match(page.snapshot().els["lp-caption"].innerHTML, /<span class="lp-tried-q">Tried it\\?<\\/span>\\s*<button type="button" class="lp-tried-yes" data-tried="yes" aria-pressed="false">Yes, I have<\\/button><button type="button" class="lp-tried-no" data-tried="no">Not yet<\\/button>/);''',
     '''  assert.match(page.snapshot().els["lp-caption"].innerHTML, /<span class="lp-tried-q">Tried it\\?<\\/span>\\s*<button type="button" class="lp-tried-yes" data-tried="yes">Yes<\\/button><button type="button" class="lp-tried-no" data-tried="no">Not yet<\\/button>/);'''),
    ('''  /* the result's words: four perfumes, two still used and two that turned hours later (tools/build_landing.js VISITOR);
     the test's verdict names rose, vanilla and citrus among the popular smells */
  const src = fs.readFileSync(path.join(__dirname, "..", "tools", "build_landing.js"), "utf8");
  assert.match(src, /page\\.click\\(\\{ dataset: \\{ when: "drydown" \\} \\}\\)/, "the example's bottles turned hours later");
  assert.equal(LD.result.still.length + LD.result.turned.length, 4, "the copy says four perfumes");''',
     '''  /* the result's words: four perfumes, two still used and two that turned (tools/build_landing.js VISITOR); the test's
     verdict names rose, vanilla and citrus among the popular smells */
  assert.equal(LD.result.still.length + LD.result.turned.length, 4, "the copy says four perfumes");'''),
    ('''  assert.ok(gone("woody_amber") > 10 * none && gone("white_musk") > 10 * none, "the two chips shown first make the largest cut");''',
     '''  assert.ok(gone("woody_amber") > 10 * none && gone("white_musk") > 10 * none, "the two chips shown first make the largest cut");
  /* the test counts as the quiz rules out: the example result's one deal-breaker, woody ambers, rules out the same number
     a few screens above */
  assert.deepEqual(LD.result.breakers.map(b => b.en), ["Woody ambers"]);
  assert.equal(gone("woody_amber"), LD.result.out);'''),
]
for a, b in pairs:
    assert s.count(a) == 1, a[:90]
    s = s.replace(a, b)
open(p, "w", encoding="utf-8", newline="\n").write(s)
print("applied")
