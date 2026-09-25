/* The backend's pure counting functions (backend/apps-script.gs), run under Node: the quiz counts behind the
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
