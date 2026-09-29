# One-off edit (29 Sep 2026): tests/landing.test.js gains the checks the verifier asked for.
import pathlib, sys
p = pathlib.Path("C:/Users/malha/Desktop/Webapps/perfume-profiler/tests/landing.test.js")
s = p.read_text(encoding="utf-8")
EDITS = [
    ('''    for (const st of ["opening", "heart", "drydown"]) for (const n of s.notes[st]) assert.ok(n.g in LD.groups, `${s.id} ${n.en}: a palate group`);''',
     '''    for (const st of ["opening", "heart", "drydown"]) for (const n of s.notes[st]) {
      assert.ok(n.g in LD.groups, `${s.id} ${n.en}: a palate group`);
      assert.ok(n.ar, `${s.id} ${n.en}: its Arabic word (the two note lists of that stage must line up in data.js)`);
    }'''),
    ('''  assert.equal((h.match(/<i class="off" style="--k:/g) || []).length, 33);''',
     '''  assert.equal((h.match(/<i class="off" style="--k:/g) || []).length, 33);
  assert.match(h, /<span class="on" style="--c:[^"]*">نحو 67 يشمّونها<\\/span><span class="off">نحو 33 لا يشمّونها<\\/span>/, "survey shares are marked as approximate");
  /* the day of wear reads in correct Arabic: ten minutes take the plural, and the stage is named apart from the time */
  assert.match(h, /id="lp-now">بعد 10 دقائق · المرحلة: <b>الدقائق الأولى<\\/b>/);
  assert.match(h, /<span>2 س<\\/span>/);'''),
    ('''  assert.match(h, />Start the quiz</);''',
     '''  assert.match(h, />Start the quiz</);
  assert.match(h, /id="lp-now">10 minutes in · Stage: <b>First minutes<\\/b>/);'''),
    ('''  page.click({ dataset: { back: "1" } });
  h = page.snapshot().els.quiz.innerHTML;
  assert.match(h, /data-start="1"/);''',
     '''  page.click({ dataset: { back: "1" } });
  h = page.snapshot().els.quiz.innerHTML;
  assert.match(h, /data-start="1"/);
  assert.ok(!page.calls.some(c => c.body && c.body.name === "reach:start"), "Back to the start screen does not send reach:start again");'''),
    ('''  assert.doesNotMatch(words.replace(/\\bdrydown:/g, ""), /ended|انتهى|انتهت|drydown|dry-down/i, "no framing of a perfume by how it ends (the stage key drydown aside)");''',
     '''  assert.doesNotMatch(words.replace(/\\bdrydown:/g, ""), /ended|انتهى|انتهت|drydown|dry-down/i, "no framing of a perfume by how it ends (the stage key drydown aside)");
  /* the survey figures: no smell is shown as reaching everyone (1.2% of the survey had no sense of smell at all) */
  assert.doesNotMatch(words, /can: 100\\b/);'''),
]
for old, new in EDITS:
    n = s.count(old)
    if n != 1:
        sys.exit(f"expected one match, found {n}: {old[:80]}")
    s = s.replace(old, new)
p.write_bytes(s.encode("utf-8"))
print("tests updated")
