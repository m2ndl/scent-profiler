const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (f, pairs) => {
  let s = fs.readFileSync(f, "utf8");
  for (const [a, b, all] of pairs) { const n = s.split(a).length - 1; if (all ? n < 1 : n !== 1) throw new Error(`${f}: ${n} matches: ${a.slice(0, 70)}`); s = s.split(a).join(b); }
  fs.writeFileSync(f, s);
};
/* engine: a lean from the visitor's words (sweet or bitter, a complaint) is a thing to watch for, after a possible
   deal-breaker; the profile page words it "which your quiz answers lean against" */
edit("site/js/engine.js", [[
`      if (!watch) { const x = inDeep(v => v.cls === "mixed", 0.3); if (x) watch = { kind: "mixed", f: x[0], s: where(x[0])[0] }; }`,
`      if (!watch) {
        const x = Object.entries(prof).filter(([f, v]) => v.n === 0 && v.score < 0 && !veto.bind.some(b => b.f === f) && where(f)[1] >= 0.3).sort((a, b) => a[1].score - b[1].score)[0];
        if (x) watch = { kind: "lean", f: x[0], s: where(x[0])[0] };
      }
      if (!watch) { const x = inDeep(v => v.cls === "mixed", 0.3); if (x) watch = { kind: "mixed", f: x[0], s: where(x[0])[0] }; }`]]);
edit("site/js/engine.js", [[
`       visitor said they avoid (secondary here, or only in the opening), a possible deal-breaker, a family their
       bottles split on, then a family they have not met that leads the heart or base.`,
`       visitor said they avoid (secondary here, or only in the opening), a possible deal-breaker, a family their words
       lean against (sweet or bitter, a complaint), a family their bottles split on, then a family they have not met
       that leads the heart or base.`]]);
edit("site/js/app.js", [[
`      const riskLine = risk ? ((risk.kind === "avoid" || risk.kind === "avoidOpening") ? (saidAvoid(risk.f) ? t().riskTold : t().riskLean)(fam(risk.f), stageName(risk.s))`,
`      const riskLine = risk ? ((risk.kind === "avoid" || risk.kind === "avoidOpening" || risk.kind === "lean") ? (saidAvoid(risk.f) ? t().riskTold : t().riskLean)(fam(risk.f), stageName(risk.s))`]]);
edit("site/js/quiz.js", [
  [`        neg: (f, s) => \`Some \${f} in the \${s}, which may be a deal-breaker for you: try a sample first.\`,`,
   `        neg: (f, s) => \`Some \${f} in the \${s}, which may be a deal-breaker for you: try a sample first.\`,
        lean: (f, s) => \`Some \${f} in the \${s}, which your answers lean against.\`,`],
  [`        neg: (f, s) => \`فيه شيء من \${f} في \${s}، وقد يفسد العطر عليك: جرّب عيّنة أولاً.\`,`,
   `        neg: (f, s) => \`فيه شيء من \${f} في \${s}، وقد يفسد العطر عليك: جرّب عيّنة أولاً.\`,
        lean: (f, s) => \`فيه شيء من \${f} في \${s}، وإجاباتك تميل ضدّه.\`,`]
]);
/* tests: the new pick cards, and picks computed with the avoided notes as the pages do */
edit("tests/page.test.js", [
  [`const picksOf = h => [...h.matchAll(/<div class="rec">[^]*?<b>([^<]+)<\\/b>/g)].map(m => m[1]);`,
   `const picksOf = h => [...h.matchAll(/<div class="rec(?: qpick)?">[^]*?<b>([^<]+)<\\/b>/g)].map(m => m[1]);`],
  [`told: N.toldItems(answers) }), {});`, `told: N.toldItems(answers) }), {}, N.avoidedNotes(answers));`, true]
]);
edit("tests/quiz.test.js", [
  [`  const { picks } = E.recommend(prof, r);
  assert.equal(picks.length, 3);
  assert.equal((h.match(/<div class="rec">/g) || []).length, 3);`,
   `  const { picks } = E.recommend(prof, r, N.avoidedNotes(stored(page, "pp_quiz_v1")));
  assert.equal(picks.length, 3);
  assert.equal((h.match(/<div class="rec qpick">/g) || []).length, 3);`],
  [`told: N.toldItems(quiz) }), r);`, `told: N.toldItems(quiz) }), r, N.avoidedNotes(quiz));`],
  [`told: N.toldItems(quiz) }), {});`, `told: N.toldItems(quiz) }), {}, N.avoidedNotes(quiz));`]
]);
console.log("ok");
