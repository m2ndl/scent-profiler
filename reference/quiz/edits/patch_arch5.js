const fs = require("fs"); const p = "site/js/quiz.js"; let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (s.split(a).length !== 2) throw new Error("not unique/missing: " + a.slice(0, 70)); s = s.replace(a, b); };
/* split archetypeOf into the vote (palateGroups) and the name */
rep(`  function archetypeOf(prof) {
    const liked = byStrength(prof, ["goodLikely", "goodPossible"]);
    if (!liked.length) return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? SELECTIVE : null;
    const vote = {};`, `  function palateGroups(prof) {
    const liked = byStrength(prof, ["goodLikely", "goodPossible"]);
    const vote = {};`);
rep(`    if (!G.length) return null;
    G.sort((p, q) => q.sum - p.sum || p.first - q.first);
    const lead = G[0];
    if (G.length === 1 || lead.sum > 2 * G[1].sum) return lead.a;`, `    G.sort((p, q) => q.sum - p.sum || p.first - q.first);
    return { liked, G, bottles: Object.keys(vote).length };
  }
  function archetypeOf(prof) {
    const { liked, G, bottles } = palateGroups(prof);
    if (!liked.length) return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? SELECTIVE : null;
    if (!G.length) return null;
    const lead = G[0];
    if (G.length === 1 || lead.sum > 2 * G[1].sum) return lead.a;`);
rep(`    if (G.length >= 3 && Object.keys(vote).length >= 4 && lead.sum <= 2 * G[2].sum) return WIDE;`, `    if (G.length >= 3 && bottles >= 4 && lead.sum <= 2 * G[2].sum) return WIDE;`);
/* the drawn-to families: one per voting group first, so a two-sided or wide palate shows its sides */
rep(`  /* a two-group palate shades from`, `  /* the three families the taste card and the share card show as liked: the strongest family of each voting
     group first, in the groups' order, then the rest by strength, so a two-sided or wide palate shows its sides
     rather than three shades of its strongest group */
  function drawnTo(prof) {
    const { liked, G } = palateGroups(prof), out = [];
    for (const g of G) { const f = liked.find(x => g.a.fams.includes(x)); if (f && !out.includes(f)) out.push(f); }
    for (const f of liked) if (!out.includes(f)) out.push(f);
    return out.slice(0, 3);
  }
  /* a two-group palate shades from`);
rep(`    const good = byStrength(prof, ["goodLikely", "goodPossible"]).slice(0, 3);
    const bad = byStrength(prof, ["badLikely", "badPossible"]).slice(0, 2);
    const rows = tasteRow(prof, good, "good") + tasteRow(prof, bad, "bad");`, `    const good = drawnTo(prof), bad = byStrength(prof, ["badLikely", "badPossible"]).slice(0, 2);
    const rows = tasteRow(prof, good, "good") + tasteRow(prof, bad, "bad");`);
rep(`    const good = byStrength(prof, ["goodLikely", "goodPossible"]).slice(0, 3), bad = byStrength(prof, ["badLikely", "badPossible"]).slice(0, 2);
    let y = 478;`, `    const good = drawnTo(prof), bad = byStrength(prof, ["badLikely", "badPossible"]).slice(0, 2);
    let y = 478;`);
fs.writeFileSync(p, s);
