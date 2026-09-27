/* The engine golden before and after the coverage change, reviewed by script: the vendor mapping, profiles, deal-breaker
   lists, settle suggestions and resolved perfumes must be unchanged, and every scenario's picks must be what the adopted
   rules of rank_trial.js pick on the frozen catalogue (and the old golden's, what its defaults pick). The old golden is
   read from commit 0164d00. Usage: node golden_review.js. Writes out/golden.txt. */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..", "..");
const { loadSite } = require(path.join(ROOT, "tools", "lib", "site"));
const { ranker } = require("./rank_trial");
const c = require(path.join(ROOT, "tests", "fixtures", "catalogue.json"));
const scenarios = require(path.join(ROOT, "tests", "fixtures", "scenarios.json"));
const W = loadSite("mapper", "engine");
const E = W.PP_ENGINE.create(c.data, W.PP_MAP, c.evidence);
const oldG = JSON.parse(require("child_process").execSync("git show 0164d00:tests/fixtures/engine_golden.json", { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 }));
const newG = JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "engine_golden.json"), "utf8"));
const adopted = ranker(E, c.data.STAGE_W, { agg: "likes once", traces: "words", side: "kept, else tried", r9: true }), old = ranker(E, c.data.STAGE_W, {});
const same = { profile: 0, badAny: 0, likely: 0, settle: 0, resolved: 0 };
let newMatch = 0, oldMatch = 0, changed = 0;
scenarios.forEach((sc, i) => {
  const o = oldG.scenarios[i], n = newG.scenarios[i];
  for (const k of Object.keys(same)) if (JSON.stringify(o[k]) === JSON.stringify(n[k])) same[k]++;
  const prof = E.computeProfile({ ratings: sc.ratings, auto: {}, images: {} });
  if (adopted(prof, sc.ratings, []).join() === n.picks.map(p => p.id).join()) newMatch++;
  if (old(prof, sc.ratings, []).join() === o.picks.map(p => p.id).join()) oldMatch++;
  if (o.picks.map(p => p.id).join() !== n.picks.map(p => p.id).join()) changed++;
});
const lines = [`scenarios ${scenarios.length}; vendor mapping unchanged: ${JSON.stringify(oldG.mapped) === JSON.stringify(newG.mapped)}`,
  `unchanged: ${Object.entries(same).map(([k, v]) => `${k} ${v}`).join(", ")}`,
  `picks equal to the adopted rules: ${newMatch}; old picks equal to the ranking of 0164d00: ${oldMatch}; scenarios whose picks changed: ${changed}`];
fs.writeFileSync(path.join(__dirname, "out", "golden.txt"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
