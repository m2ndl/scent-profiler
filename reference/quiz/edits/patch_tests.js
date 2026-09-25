const fs = require("fs");
const p = "tests/quiz.test.js"; let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(n + " matches: " + a.slice(0, 80)); s = s.replace(a, () => b); };

/* the palate text in the shape test */
rep(`  assert.match(h, /<p class="eyebrow">Your palate<\\/p><h1>The Sweet Palate<\\/h1>/);\n`,
`  assert.match(h, /<p class="eyebrow">Your palate<\\/p><h1>The Sweet Palate<\\/h1>/);
  assert.match(h, /<p class="qpal">Your bottles show a liking for dessert-like sweetness\\. Sweet perfumes differ most in their base/);
`);
rep(`  assert.match(h, /<div class="qname-hero" style="--arch:#5B3A24"><svg class="qemblem"[^]*?<h1>The Oud and Musk Palate<\\/h1>/);\n`,
`  assert.match(h, /<div class="qname-hero" style="--arch:#5B3A24"><svg class="qemblem"[^]*?<h1>The Oud and Musk Palate<\\/h1>/);
  assert.match(h, /<p class="qpal">Your bottles show two likings: dark, smoky materials, and musks\\. Each has bottles behind it[^<]*Most oud in Western perfumes/, "both sides, then the lead side's tip");
`);
rep(`  assert.match(h, /<div class="qname-hero" style="--arch:#4E6B62"><svg class="qemblem"[^]*?<h1>The Wide Palate<\\/h1>/);\n`,
`  assert.match(h, /<div class="qname-hero" style="--arch:#4E6B62"><svg class="qemblem"[^]*?<h1>The Wide Palate<\\/h1>/);
  assert.match(h, /<p class="qpal">Your bottles cover several kinds of perfume[^<]*the useful finding is what you avoid/, "a wide palate with a deal-breaker points to it");
`);

s += `
test("every palate group has its text in both languages", () => {
  const src = fs.readFileSync(path.join(SITE, "js", "quiz.js"), "utf8");
  const ids = [...src.matchAll(/\\{ id: "([a-z]+)", fams: \\[/g)].map(m => m[1]);
  assert.equal(ids.length, 9);
  for (const id of ids) assert.equal((src.match(new RegExp(\`\\\\b\${id}: \\\\{ side: "[^"]+", tip: "[^"]+" \\\\}\`, "g")) || []).length, 2, id + ": English and Arabic");
  for (const id of ["wide", "selective"]) assert.equal((src.match(new RegExp(\`\\\\b\${id}: \\\\{ text: "\`, "g")) || []).length, 2, id);
});

test("the start screen, one reached event per screen, the result event, and the comparison with other finishers", async () => {
  /* the start screen: the promise, five of the grid's bottles, the four parts, Start, and no time estimate */
  const first = open({ atStart: true });
  let h = html(first);
  assert.match(h, /<h1>Find what ruins a perfume for you<\\/h1>/);
  assert.equal((h.match(/<img class="thumb/g) || []).length, 5);
  assert.match(h, /<li><b>1<\\/b><span>Your bottles<\\/span><\\/li><li><b>2<\\/b><span>Notes you know<\\/span><\\/li><li><b>3<\\/b><span>Sweet or bitter<\\/span><\\/li><li><b>4<\\/b><span>What bothers you<\\/span><\\/li>/);
  assert.match(h, /data-start="1">Start</);
  first.click({ id: "lang-ar" });
  h = html(first);
  assert.match(h, /<h1>اعرف ما يفسد العطر عليك<\\/h1>/);
  assert.match(h, /data-start="1">ابدأ</);
  assert.doesNotMatch(h + html(open({ atStart: true })), /minute|دقيق|دقائق/, "no time estimate");

  /* with a backend that has 240 finished results, a quarter of them sharing every deal-breaker */
  let statsCalls = 0;
  const quizCounts = n => ({ n, palates: {}, breakers: Object.fromEntries(Object.keys(D.FAMILIES).map(f => [f, n / 4])) });
  const respond = n => (url, body) => { if (!body && url.includes("stats=1")) { statsCalls++; return { perfumes: {}, quiz: quizCounts(n) }; } return { ok: true }; };
  const page = open({ endpoint: ENDPOINT, respond: respond(240) });
  twoBottles(page);
  finish(page, { told: ["chemical"] });
  await page.settle();
  const names = page.calls.filter(c => c.body && c.body.type === "event").map(c => c.body.name);
  const reach = names.filter(x => x.startsWith("reach:"));
  assert.deepEqual(reach.slice(0, 4), ["reach:start", "reach:grid", "reach:verdicts", "reach:notes"]);
  assert.deepEqual(reach.slice(-3), ["reach:taste", "reach:told", "reach:anosmia"]);
  const pick = reach.filter(x => x.startsWith("reach:picker:")).map(x => +x.split(":")[2]);
  assert.ok(pick.length >= 1 && pick.every((x, i) => x >= 1 && x <= 5 && (i === 0 || x > pick[i - 1])), "picker screens in order: " + pick);
  assert.equal(new Set(reach).size, reach.length, "each screen is reported once");
  const result = page.calls.filter(c => c.body && c.body.type === "event" && c.body.name.startsWith("result:"));
  assert.equal(result.length, 1);
  assert.match(result[0].body.name, /^result:[a-z]+(-[a-z]+)?:[a-z_]+(\\+[a-z_]+)*$/);
  assert.equal(result[0].body.n, 2);
  assert.ok(names.indexOf("quiz_done") < names.indexOf(result[0].body.name), "quiz_done first");

  /* the counts are asked for once; the line names the strongest deal-breaker and its share */
  assert.equal(statsCalls, 1);
  assert.match(page.snapshot().els.qcompare.innerHTML, /^25% of the 240 people who finished this quiz share your deal-breaker: [a-z]/);
  page.click({ id: "lang-ar" });
  assert.match(html(page), /<p class="qcompare" id="qcompare">25٪ ممن أنهوا هذا الاختبار \\(240\\) يشاركونك النفور من /);

  /* under a hundred finishers, no comparison */
  const few = open({ endpoint: ENDPOINT, respond: respond(99) });
  twoBottles(few);
  finish(few, { told: ["chemical"] });
  await few.settle();
  assert.equal(few.snapshot().els.qcompare.innerHTML, "");
  assert.match(html(few), /<p class="qcompare" id="qcompare"><\\/p>/);
});
`;
fs.writeFileSync(p, s);

fs.writeFileSync("tests/backend.test.js", `/* The backend's pure counting functions (backend/apps-script.gs), run under Node: the quiz counts behind the
   comparison line and the funnel built from the screen-reached events. The Google services are not touched. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "backend", "apps-script.gs"), "utf8"), ctx);
const plain = x => JSON.parse(JSON.stringify(x));
/* events sheet rows without the header: [ts, device, lang, name, n], in the order written */
const row = (device, name, n) => ["2026-09-26T10:00:00Z", device, "en", name, n == null ? 0 : n];
const ROWS = [
  row("d1", "reach:start"), row("d1", "reach:grid"), row("d1", "quiz_grid", 2), row("d1", "reach:verdicts"),
  row("d2", "reach:start"), row("d2", "reach:grid"), row("d2", "reach:picker:1"),
  row("d1", "reach:picker:1"), row("d1", "reach:picker:2"), row("d1", "reach:taste"), row("d1", "reach:told"), row("d1", "reach:anosmia"),
  row("d1", "quiz_done", 2), row("d1", "result:sweet:woody_amber", 2),
  row("d3", "reach:start"), row("d3", "reach:grid"), row("d3", "reach:picker:1"), row("d3", "reach:picker:2"), row("d3", "reach:taste"),
  row("d3", "reach:told"), row("d3", "reach:anosmia"), row("d3", "quiz_done", 0), row("d3", "result:wide:", 0),
  row("d1", "reach:start"), row("d1", "result:oud-musk:woody_amber+white_floral", 3), row("d1", "sample:yara", 1),
  row("", "reach:start")
];

test("quiz counts: each device's last result, its palate and its deal-breakers", () => {
  assert.deepEqual(plain(ctx.quizStats_(ROWS)), { n: 2, palates: { "oud-musk": 1, wide: 1 }, breakers: { woody_amber: 1, white_floral: 1 } });
  assert.deepEqual(plain(ctx.quizStats_([])), { n: 0, palates: {}, breakers: {} });
});

test("funnel: devices per screen in the quiz's order, as a share of the start screen", () => {
  assert.deepEqual(plain(ctx.funnelRows_(ROWS)), [
    ["start", 3, 100], ["grid", 3, 100], ["verdicts", 1, 33.3], ["picker:1", 3, 100], ["picker:2", 2, 66.7],
    ["taste", 2, 66.7], ["told", 2, 66.7], ["anosmia", 2, 66.7], ["result", 2, 66.7]
  ]);
});
`);
console.log("ok");
