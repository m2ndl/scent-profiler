const fs = require("fs");
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, "utf8");
  for (const [a, b] of pairs) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(file + ": " + n + " matches: " + a.slice(0, 80)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
};
edit("site/js/quiz.js", [
  ["      palTwo: (a, b) => `Your bottles show two likings: ${a}, and ${b}. Each has bottles behind it, so one does not cancel the other.`,",
   "      palTwo: (a, b) => `Your bottles show two likings, each with bottles behind it: ${a}, and ${b}.`, tipH: \"A tip for your palate\","],
  ["      palTwo: (a, b) => `عطورك تكشف ميلين: إلى ${a}، وإلى ${b}. لكلٍّ منهما عطور تشهد له، فلا يلغي أحدهما الآخر.`,",
   "      palTwo: (a, b) => `عطورك تكشف ميلين، لكلٍّ منهما عطور تشهد له: إلى ${a}، وإلى ${b}.`, tipH: \"نصيحة لذائقتك\","],
  [`  /* the lines under the palate name: what the bottles show, then one practical tip (a two-group palate takes the
     lead group's tip) */
  function palateText(arch, prof) {
    const P = t().pal;
    if (arch.id === "wide") return [P.wide.text, byStrength(prof, ["badLikely", "badPossible"]).length ? P.wide.tip : P.wide.tipNone];
    if (arch.id === "selective") return [P.selective.text, P.selective.tip];
    const [a, b] = arch.id.split("-");
    return [b ? t().palTwo(P[a].side, P[b].side) : t().palOne(P[a].side), P[a].tip];
  }`,
   `  /* The line under the palate name says what the bottles show; a group palate's practical tip goes lower, after
     the taste card (a two-group palate takes the lead group's tip). The wide and selective palates keep theirs
     under the name, since there it is what the name means. */
  function palateText(arch, prof) {
    const P = t().pal;
    if (arch.id === "wide") return { about: P.wide.text + " " + (byStrength(prof, ["badLikely", "badPossible"]).length ? P.wide.tip : P.wide.tipNone), tip: "" };
    if (arch.id === "selective") return { about: P.selective.text + " " + P.selective.tip, tip: "" };
    const [a, b] = arch.id.split("-");
    return { about: b ? t().palTwo(P[a].side, P[b].side) : t().palOne(P[a].side), tip: P[a].tip };
  }`],
  ["<h1>${esc(arch[lang])}</h1></div></div><p class=\"qpal\">${esc(palateText(arch, prof).join(\" \"))}</p>`",
   "<h1>${esc(arch[lang])}</h1></div></div><p class=\"qpal\">${esc(palateText(arch, prof).about)}</p>`"],
  ["      ${tasteCardHtml(prof, ids)}<p class=\"qcompare\" id=\"qcompare\">${compareHtml(prof)}</p>${recs}",
   "      ${tasteCardHtml(prof, ids)}<p class=\"qcompare\" id=\"qcompare\">${compareHtml(prof)}</p>${tipHtml}${recs}"],
  ["    const arch = archetypeOf(prof), nPicks = gate ? recommend(prof).picks.length : 0;\n",
   "    const arch = archetypeOf(prof), nPicks = gate ? recommend(prof).picks.length : 0;\n    const tip = arch ? palateText(arch, prof).tip : \"\", tipHtml = tip ? `<p class=\"qtip\"><b>${esc(t().tipH)}</b>${esc(tip)}</p>` : \"\";\n"]
]);
edit("site/site.css", [
  [".qcompare:empty { display: none; }\n",
   ".qcompare:empty { display: none; }\n.qtip { margin: 14px 2px 0; font-size: 14.5px; line-height: 1.55; color: var(--ink-2); padding-inline-start: 12px; border-inline-start: 3px solid var(--oil); }\n.qtip b { display: block; margin-bottom: 2px; font-size: 12.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--gold); }\n[dir=\"rtl\"] .qtip b { letter-spacing: 0; text-transform: none; font-size: 14px; }\n"]
]);
edit("tests/quiz.test.js", [
  ["  assert.match(h, /<p class=\"qpal\">Your bottles show a liking for dessert-like sweetness\\. Sweet perfumes differ most in their base/);\n",
   "  assert.match(h, /<p class=\"qpal\">Your bottles show a liking for dessert-like sweetness\\.<\\/p>/);\n  assert.match(h, /<p class=\"qtip\"><b>A tip for your palate<\\/b>Sweet perfumes differ most in their base/, \"the tip sits lower, under its label\");\n"],
  ["  assert.match(h, /<p class=\"qpal\">Your bottles show two likings: dark, smoky materials, and musks\\. Each has bottles behind it[^<]*Most oud in Western perfumes/, \"both sides, then the lead side's tip\");\n",
   "  assert.match(h, /<p class=\"qpal\">Your bottles show two likings, each with bottles behind it: dark, smoky materials, and musks\\.<\\/p>/, \"both sides\");\n  assert.match(h, /<p class=\"qtip\"><b>A tip for your palate<\\/b>Most oud in Western perfumes/, \"the lead side's tip\");\n"],
  ["[^<]*No deal-breaker has shown up yet/, \"a wide palate without a deal-breaker says so\");\n",
   "[^<]*No deal-breaker has shown up yet/, \"a wide palate without a deal-breaker says so\");\n  assert.doesNotMatch(h, /class=\"qtip\"/, \"the wide palate's tip stays under its name\");\n"]
]);
console.log("ok");
