/* E6 follow-up: told-only families score tsum / (twsum + TOLD_PRIOR). Exact match; fails on a second run. */
const fs = require("fs");
const F = "C:/Users/malha/Desktop/Webapps/perfume-profiler/site/js/engine.js";
let src = fs.readFileSync(F, "utf8");
const rep = (a, b) => { const n = src.split(a).length - 1; if (n !== 1) throw new Error("expected one match, found " + n + ": " + a.slice(0, 50)); src = src.replace(a, b); };
rep(`    const TOLD_W = 0.3; /* one told item at full weight, against 0.75 for one strong drydown tag on a worn bottle */
`, `    const TOLD_W = 0.3; /* one told item at full weight, against 0.75 for one strong drydown tag on a worn bottle */
    const TOLD_PRIOR = TOLD_W; /* a family with told items only scores tsum / (twsum + TOLD_PRIOR): one full-weight
                                  item gives 0.5, two agreeing ones about 0.67, a 0.3-weight side effect about 0.23 */
`);
rep(`        if (!out[f]) out[f] = { score: t.tsum / t.twsum, n: 0,`, `        if (!out[f]) out[f] = { score: t.tsum / (t.twsum + TOLD_PRIOR), n: 0,`);
fs.writeFileSync(F, src);
console.log("written");
