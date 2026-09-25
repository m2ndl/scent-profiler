const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (f, pairs) => {
  let s = fs.readFileSync(f, "utf8");
  for (const [a, b] of pairs) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${f}: ${n} matches: ${a.slice(0, 70)}`); s = s.replace(a, () => b); }
  fs.writeFileSync(f, s);
};
edit("tests/quiz.test.js", [[
`  assert.equal((h.match(/<div class="rec">/g) || []).length, 3);
  assert.equal((h.match(/<div class="rec tester">/g) || []).length, 3);`,
`  assert.equal((h.match(/<div class="rec qpick">/g) || []).length, 3);
  assert.equal((h.match(/<div class="rec tester">/g) || []).length, 3);`]]);
{
  let s = fs.readFileSync("tests/page.test.js", "utf8");
  const start = s.indexOf(`  /* "sweet" plus "avoid vanilla": citrus is pushed down only by the bitter side of the taste answer */`);
  const endMark = `which your quiz answers lean against\\\\.\`));`;
  const end = s.indexOf(endMark, start);
  if (start < 0 || end < 0) throw new Error("page test block");
  const block = `  /* "sweet" plus "avoid vanilla": a line may say the visitor avoids vanilla, which they did; citrus, pushed down only by
     the bitter side of the taste answer, is never worded as avoided, only as leaned against */
  const answers = { notes: { vanilla: -1 }, taste: "sweet" }, h = recsOf(answers);
  const lines = [...h.matchAll(/<div class="risk">([^<]*)<\\/div>/g)].map(m => m[1]);
  for (const line of lines) {
    if (/which you said you avoid/.test(line)) assert.match(line, new RegExp("^Contains " + esc(FAMILIES.vanilla_gourmand.en)), line);
    if (line.includes(esc(FAMILIES.citrus_fresh.en))) assert.match(line, /which your quiz answers lean against\\./, line);
  }
  /* and no pick is led by vanilla: the avoided card rules those out */
  for (const name of picksOf(h)) {
    const P = D.PERFUMES.find(x => esc(x.name) === name);
    assert.ok(P, name);
    for (const s of ["heart", "drydown"]) { const st = P.stages[s], w = st.vanilla_gourmand || 0; assert.ok(!(w >= 0.7 && w >= Math.max(...Object.values(st))), P.id + " is led by vanilla"); }
  }`;
  s = s.slice(0, start) + block + s.slice(end + endMark.length);
  fs.writeFileSync("tests/page.test.js", s);
}
console.log("ok");
