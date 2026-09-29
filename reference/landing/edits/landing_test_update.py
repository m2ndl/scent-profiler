# One-off edit (29 Sep 2026): tests/landing.test.js follows the front page's copy brought in line with the books.
import pathlib, sys
p = pathlib.Path("C:/Users/malha/Desktop/Webapps/perfume-profiler/tests/landing.test.js")
s = p.read_text(encoding="utf-8")
EDITS = [
    ('''  assert.match(h, /<h1>العطر يُصنع من روائح جميلة، فلماذا لا يناسبك منه إلا القليل؟<\\/h1>/);''',
     '''  assert.match(h, /<h1>تُباع العطور على أنها روائح جميلة، فلماذا لا يناسبك منها إلا القليل؟<\\/h1>/);'''),
    ('''  assert.equal((h.match(/data-strip="/g) || []).length, 8);''',
     '''  assert.equal((h.match(/data-strip="/g) || []).length, 10);
  /* a hundred people per smell, from the survey: androstenone first, a third of them unable to smell it */
  assert.match(h, /data-nose="andro" style="[^"]*"|aria-pressed="true" data-nose="andro"/);
  assert.equal((h.match(/<i class="(on|off)" style="--k:/g) || []).length, 100);
  assert.equal((h.match(/<i class="off" style="--k:/g) || []).length, 33);'''),
    ('''  assert.match(h, /<h1>Perfume is made of beautiful smells\\. So why do so few suit you\\?<\\/h1>/);''',
     '''  assert.match(h, /<h1>Perfumes are sold as beautiful smells\\. So why do so few suit you\\?<\\/h1>/);'''),
]
for old, new in EDITS:
    n = s.count(old)
    if n != 1:
        sys.exit(f"expected one match, found {n}: {old[:70]}")
    s = s.replace(old, new)
p.write_bytes(s.encode("utf-8"))
print("test updated")
