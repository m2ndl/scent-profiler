/* Compare the engine golden at HEAD with the one on disk, per scenario seed, and check the changed set
   against the scenarios that carry a complaint chip on a stage rated -2. Run from the project root. */
"use strict";
const fs = require("fs");
const { execSync } = require("child_process");
const oldG = JSON.parse(execSync("git show HEAD:tests/fixtures/engine_golden.json", { encoding: "utf8", maxBuffer: 1 << 28 }));
const newG = JSON.parse(fs.readFileSync("tests/fixtures/engine_golden.json", "utf8"));
const scenarios = JSON.parse(fs.readFileSync("tests/fixtures/scenarios.json", "utf8"));
const STAGES = ["opening", "heart", "drydown"];
const J = x => JSON.stringify(x);
const r3 = x => Math.round(x * 1000) / 1000;
const lines = [];
const out = s => lines.push(s);

/* chips sitting on a stage rated -2, per seed */
const chipOnMinus2 = {};
const chipBelowMinus1Other = [];
for (const sc of scenarios) {
  const hits = [];
  for (const [id, r] of Object.entries(sc.ratings)) for (const s of STAGES) {
    const chips = (r.chips && r.chips[s]) || [];
    if (!chips.length || r[s] == null) continue;
    if (r[s] === -2) hits.push(`${id} ${s} [${chips.join(", ")}]`);
    else if (r[s] < -1) chipBelowMinus1Other.push(`${sc.seed} ${id} ${s} rated ${r[s]}`);
  }
  chipOnMinus2[sc.seed] = hits;
}

out(`mapped section changed: ${J(oldG.mapped) !== J(newG.mapped)}`);
out(`scenario count: old ${oldG.scenarios.length}, new ${newG.scenarios.length}`);
const changed = [];
newG.scenarios.forEach((n, i) => {
  const o = oldG.scenarios[i];
  if (o.seed !== n.seed) throw new Error(`seed order differs at ${i}`);
  if (J(o) !== J(n)) changed.push([o, n]);
});
out(`changed scenarios: ${changed.length}`);
out("");

for (const [o, n] of changed) {
  out(`seed ${n.seed}  (chips on a -2 stage: ${chipOnMinus2[n.seed].join("; ") || "none"})`);
  const fams = [...new Set([...Object.keys(o.profile), ...Object.keys(n.profile)])].sort();
  for (const f of fams) {
    const a = o.profile[f], b = n.profile[f];
    if (!a || !b) { out(`  ${f}: ${a ? "removed" : "added"}`); continue; }
    const parts = [];
    if (a.score !== b.score) parts.push(`score ${r3(a.score)} -> ${r3(b.score)} (${b.score - a.score >= 0 ? "+" : ""}${r3(b.score - a.score)})`);
    if (a.cls !== b.cls) parts.push(`class ${a.cls} -> ${b.cls}`);
    for (const k of ["n", "pos", "neg"]) if (a[k] !== b[k]) parts.push(`${k} ${a[k]} -> ${b[k]}`);
    if (parts.length) out(`  ${f}: ${parts.join(", ")}`);
    else if (J(a) !== J(b)) out(`  ${f}: evidence text only`);
  }
  const other = ["picks", "badAny", "likely", "settle", "resolved"].filter(k => J(o[k]) !== J(n[k]));
  out(`  other fields changed: ${other.join(", ") || "none"}`);
  for (const k of ["badAny", "likely"]) if (other.includes(k)) out(`    ${k}: ${J(o[k])} -> ${J(n[k])}`);
  if (other.includes("picks")) {
    const oi = o.picks.map(p => p.id).join(", "), ni = n.picks.map(p => p.id).join(", ");
    if (oi !== ni) out(`    picks: ${oi} -> ${ni}`);
    else {
      const moved = n.picks.map((p, i) => [p, o.picks[i]]).filter(([p, q]) => J(p) !== J(q))
        .map(([p, q]) => `${p.id} final ${r3(q.final)} -> ${r3(p.final)}${J(p.risks) !== J(q.risks) ? ", risks changed" : ""}`);
      out(`    picks: same ids and order; ${moved.join("; ")}`);
    }
  }
  if (other.includes("settle")) out(`    settle: ${J(o.settle)} -> ${J(n.settle)}`);
  out("");
}

const changedSeeds = new Set(changed.map(([, n]) => n.seed));
const withChip = Object.keys(chipOnMinus2).filter(s => chipOnMinus2[s].length).map(Number);
const changedWithoutChip = [...changedSeeds].filter(s => !chipOnMinus2[s].length);
const chipUnchanged = withChip.filter(s => !changedSeeds.has(s));
out("Checks against tests/fixtures/scenarios.json");
out(`  scenarios with a chip on a stage rated -2: ${withChip.length}`);
out(`  changed scenarios that carry such a chip: ${changed.length - changedWithoutChip.length} of ${changed.length}`);
out(`  changed scenarios without such a chip: ${changedWithoutChip.length ? changedWithoutChip.join(", ") : "none"}`);
out(`  scenarios with such a chip that did not change: ${chipUnchanged.length ? chipUnchanged.join(", ") : "none"}`);
/* why a scenario with a chip on a -2 stage can stay unchanged: the chip adds only to its families present at 0.2 or more in that stage */
const { loadSite } = require(require("path").resolve("tools/lib/site"));
const W = loadSite("mapper", "engine");
const cat = JSON.parse(fs.readFileSync("tests/fixtures/catalogue.json", "utf8"));
const E = W.PP_ENGINE.create(cat.data, W.PP_MAP, cat.evidence);
const CH = cat.data.CHIPS;
for (const seed of chipUnchanged) {
  const sc = scenarios.find(x => x.seed === seed), state = { ratings: sc.ratings, auto: {}, images: {} };
  const reasons = [];
  for (const [id, r] of Object.entries(sc.ratings)) for (const st of STAGES) {
    if (r[st] !== -2) continue;
    for (const cid of (r.chips && r.chips[st]) || []) {
      const P = E.resolve(id, state), chip = CH.find(c => c.id === cid);
      if (!P || !P.stages) { reasons.push(`${id} unresolved`); continue; }
      if (!chip) { reasons.push(`${cid} unknown chip`); continue; }
      const hit = Object.keys(chip.fams).filter(f => ((P.stages[st] || {})[f] || 0) >= 0.2);
      reasons.push(`${id} ${st} ${cid}: ${hit.length ? "families present " + hit.join(", ") : "no chip family at 0.2 or more"}`);
    }
  }
  out(`    ${seed}: ${reasons.join("; ")}`);
}
out(`  chips on a stage rated below -1 other than -2: ${chipBelowMinus1Other.length ? chipBelowMinus1Other.join("; ") : "none"}`);
process.stdout.write(lines.join("\n") + "\n");
