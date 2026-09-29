"""One-off: updates tests/landing.test.js from the brass atomizer to the perfume's own bottle (29 Sep 2026).
Exact-match edits; fails on a second run."""
p = r"C:\Users\malha\Desktop\Webapps\perfume-profiler\tests\landing.test.js"
s = open(p, encoding="utf-8").read()
pairs = [
    ('''   with one reach:start, and its words keep the site's rules. The atomizer's mist and motion need a real browser; here
   the page must simply render without them. */''',
     '''   with one reach:start, and its words keep the site's rules. The mist, the bottles' swap and the motion need a real
   browser; here the page must simply render without them. */'''),
    ('''  assert.deepEqual([...LD.sprays.map(s => s.id)], [...D.QUIZ.grid], "the atomizer sprays the quiz's twenty bottles");
  assert.deepEqual([...Object.keys(LD.groups)].sort(), ["amber", "floral", "fresh", "musk", "oud", "rose", "spiced", "sweet", "woody"]);
  for (const s of LD.sprays) {
    assert.ok(s.photo && fs.existsSync(path.join(SITE, s.photo)), `${s.id} has a shipped photo`);''',
     '''  assert.deepEqual([...LD.sprays.map(s => s.id)], [...D.QUIZ.grid], "the stage shows the quiz's twenty bottles");
  assert.deepEqual([...Object.keys(LD.groups)].sort(), ["amber", "floral", "fresh", "musk", "oud", "rose", "spiced", "sweet", "woody"]);
  for (const s of LD.sprays) {
    assert.ok(s.photo && fs.existsSync(path.join(SITE, s.photo)), `${s.id} has a shipped photo`);
    /* its large picture for the stage (python tools/fetch_hero_bottles.py), sized, with the spray's point on its glass */
    const H = s.hero;
    assert.equal(H.src, `img/hero/${s.id}.webp`);
    assert.ok(fs.existsSync(path.join(SITE, H.src)), `${s.id}: its large picture`);
    assert.ok(H.w > 0 && H.h >= 300, `${s.id}: tall enough to stand sharp on a phone (${H.h} px)`);
    assert.ok(H.nx > 0.2 && H.nx < 0.8 && H.ny >= 0 && H.ny < 0.1, `${s.id}: the spray leaves from the top of the glass (${H.nx}, ${H.ny})`);'''),
    ('''  assert.match(h, /class="lp-atomizer" id="lp-atomizer" aria-label="بخّاخ عطر/);
  /* the atomizer's still picture, turned for Arabic; js/bottle3d.js replaces it with the live one where it can */
  assert.match(h, /<img class="lp-poster" src="img\\/atomizer-rtl\\.webp"/);''',
     '''  /* one of the twenty bottles stands on the stage before any spray, named in its label */
  const first = /<button type="button" class="lp-bottle" id="lp-bottle" aria-label="([^"]+)\\. اضغط لترشّه وترى نوتاته، والضغطة التالية تأتي بعطر آخر من عطور الاختبار العشرين\\."><span class="lp-glass" id="lp-glass"><img src="img\\/hero\\/([a-z0-9]+)\\.webp"/.exec(h);
  assert.ok(first, "the bottle on the stage");
  const onStage = LD.sprays.find(s => s.id === first[2]);
  assert.ok(onStage && first[1] === (onStage.ar || onStage.name));
  assert.match(h, /<span class="lp-hint" id="lp-hint">اضغط على الزجاجة<\\/span>/);
  assert.doesNotMatch(h, /atomizer|lp-poster/);'''),
    ('''  assert.match(h, /<img class="lp-poster" src="img\\/atomizer-ltr\\.webp"/);''',
     '''  assert.match(h, new RegExp(`aria-label="${onStage.name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\\\. Press to spray it and see its notes; the next press brings another of the quiz's twenty perfumes\\\\."><span class="lp-glass" id="lp-glass"><img src="img/hero/${onStage.id}\\\\.webp"`), "the same bottle stays through a language switch");'''),
    ('''  for (const side of ["ltr", "rtl"]) assert.ok(fs.existsSync(path.join(SITE, "img", `atomizer-${side}.webp`)), `the ${side} still picture (python tools/render_atomizer.py)`);
''', ''),
    ('''test("under the atomizer, tried it? Yes carries the bottle into every link to the quiz, and Not yet sprays another", () => {''',
     '''test("under the bottle, tried it? Yes carries the bottle into every link to the quiz, and Not yet sprays another", () => {'''),
    ('''m = cap && /^<img src="([^"]+)" alt=""><div class="lp-cap-t">/.exec(cap.innerHTML); return m ? LD.sprays.find(s => s.photo === m[1]) : null; };''',
     '''m = cap && /^<div class="lp-cap-t" data-id="([^"]+)">/.exec(cap.innerHTML); return m ? LD.sprays.find(s => s.id === m[1]) : null; };
  const label = () => page.snapshot().els["lp-bottle"].attrs["aria-label"];'''),
    ('''  const first = sprayed();
  assert.ok(first, "the first spray names one of the twenty");''',
     '''  const first = sprayed();
  assert.ok(first, "the first spray names one of the twenty");
  assert.match(html(page), new RegExp(`<img src="img/hero/${first.id}\\\\.webp"`), "the first spray is the bottle that stood on the stage");'''),
    ('''  const third = sprayed();
  assert.ok(third && third.id !== second.id && third.id !== first.id, "Not yet sprays another at once");''',
     '''  const third = sprayed();
  assert.ok(third && third.id !== second.id && third.id !== first.id, "Not yet sprays another at once");
  assert.ok(label().startsWith(third.name + ". Press to spray it"), "the bottle's label names the perfume now on the stage");'''),
]
for a, b in pairs:
    assert s.count(a) == 1, a[:100]
    s = s.replace(a, b)
open(p, "w", encoding="utf-8", newline="\n").write(s)
print("applied")
