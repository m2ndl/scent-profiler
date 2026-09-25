const fs = require("fs"); const p = "site/js/quiz.js"; let s = fs.readFileSync(p, "utf8");
const start = s.indexOf("  /* The name follows the shape of what the visitor kept");
const end = s.indexOf("  /* a two-group palate shades");
if (start < 0 || end < 0) throw new Error("anchors");
const block = `  /* The name follows the shape of what the visitor kept. Each kept bottle votes for one group, the group of the
     liked family with the greatest presence in the stage that was rated (Yara: vanilla at 0.9, so sweet; a
     musk or a wood in the same bottle counts for nothing), with the presence as its weight, so the groups
     with most families gain nothing and a bottle is never split. The group with most weight leads. It names
     the palate alone when it holds more than twice the next group's weight; otherwise the next group joins
     it ("The Fresh and Oud Palate": a summer side and a winter side, not a contradiction), and a third group
     the lead does not outweigh makes the wide palate, whose real finding is the deal-breaker. With dislikes
     only, the selective palate; with neither, none. Told answers never set a class, so only bottles vote. */
  function archetypeOf(prof) {
    const liked = byStrength(prof, ["goodLikely", "goodPossible"]);
    if (!liked.length) return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? SELECTIVE : null;
    const vote = {};   /* perfume id -> [presence, group], the strongest liked family wins; ties keep the stronger family */
    for (const f of liked) for (const e of prof[f].evidence || []) {
      if (!e.perfume || !(e.value > 0)) continue;
      const x = ((e.perfume.stages || {})[e.stage] || {})[f] || 0, cur = vote[e.perfume.id];
      if (x > 0 && (!cur || x > cur[0])) vote[e.perfume.id] = [x, ARCH.find(g => g.fams.includes(f))];
    }
    const G = [];
    for (const [x, a] of Object.values(vote)) { if (!a) continue; const g = G.find(o => o.a === a); if (g) g.sum += x; else G.push({ a, sum: x, first: liked.findIndex(f => a.fams.includes(f)) }); }
    if (!G.length) return null;
    G.sort((p, q) => q.sum - p.sum || p.first - q.first);
    const lead = G[0];
    if (G.length === 1 || lead.sum > 2 * G[1].sum) return lead.a;
    if (G.length >= 3 && lead.sum <= 2 * G[2].sum) return WIDE;
    const a = lead.a, b = G[1].a;
    return { id: a.id + "-" + b.id, icon: a.id, color: a.color, color2: b.color, en: \`The \${a.word} and \${b.word} Palate\`, ar: \`ذائقة \${a.adj} و\${b.adj}\` };
  }
`;
s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(p, s);
