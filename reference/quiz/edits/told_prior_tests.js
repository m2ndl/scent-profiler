/* E6 follow-up: engine tests for the told prior. Exact match; fails on a second run. */
const fs = require("fs");
const F = "C:/Users/malha/Desktop/Webapps/perfume-profiler/tests/engine.test.js";
let src = fs.readFileSync(F, "utf8");
const rep = (a, b) => { const n = src.split(a).length - 1; if (n !== 1) throw new Error("expected one match, found " + n + ": " + a.slice(0, 50)); src = src.replace(a, b); };
rep(`      assert.equal(prof[f].score, value); assert.equal(prof[f].evidence.length, 0);`,
    `      assert.equal(prof[f].score, value * 0.5, f); assert.equal(prof[f].evidence.length, 0);`);
rep(`test("a told avoid lowers a perfume's rank and a told enjoy raises it", () => {`,
`test("a told-only score is pulled toward zero by the told weight, so a side effect of the taste answer counts less than a named note", () => {
  const score = told => profileOf({}, told).leather_smoky.score;
  const item = w => ({ f: "leather_smoky", value: 1, w, src: "test" });
  assert.equal(score([item(1)]), 0.5);
  assert.ok(Math.abs(score([item(1), item(1)]) - 2 / 3) < 1e-9);
  assert.ok(Math.abs(score([item(0.3)]) - 0.09 / 0.39) < 1e-9);
  /* "prefer bitter" from the live QUIZ.taste against an explicit "enjoy leather" */
  const taste = loadSite("data").PP_DATA.QUIZ.taste;
  const bitter = Object.entries(taste.bitter).map(([f, w]) => ({ f, value: 1, w, src: "taste:bitter" }))
    .concat(Object.entries(taste.sweet).map(([f, w]) => ({ f, value: -1, w, src: "taste:bitter" })));
  assert.ok(bitter.some(t => t.f === "leather_smoky"));
  const side = score(bitter), named = score(toldFor("leather", 1));
  assert.ok(side > 0 && side < named, \`prefer bitter \${side}, enjoy leather \${named}\`);
  /* the display field keeps the plain told mean */
  assert.equal(profileOf({}, bitter).leather_smoky.toldScore, 1);
});

test("a told avoid lowers a perfume's rank and a told enjoy raises it", () => {`);
fs.writeFileSync(F, src);
console.log("written");
