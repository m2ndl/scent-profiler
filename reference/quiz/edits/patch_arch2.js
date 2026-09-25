const fs = require("fs"); const p = "site/js/quiz.js"; let s = fs.readFileSync(p, "utf8");
const start = s.indexOf("  /* the name follows the shape of what the visitor likes");
const end = s.indexOf("  /* a two-group palate shades");
if (start < 0 || end < 0) throw new Error("anchors");
const block = `  /* The name follows the shape of what the visitor kept, group by group: which of their bottles each palate
     group rests on (a bottle counts once for a group however many of its families it holds, so the groups with
     most families gain nothing). The lead group is the one with most confirmed families, then most bottles.
     A group whose bottles the lead already covers is a shade of the lead, not a second side. The lead names
     the palate alone when it rests on more than twice the bottles any other side adds; otherwise the strongest
     other side joins it ("The Fresh and Oud Palate": a summer side and a winter side, not a contradiction), and a
     third side the lead does not outweigh makes the wide palate, whose real finding is the deal-breaker. With
     dislikes only, the selective palate; with neither, none. Told answers never set a class, so only bottles
     shape the name. */
  function archetypeOf(prof) {
    const liked = byStrength(prof, ["goodLikely", "goodPossible"]);
    if (!liked.length) return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? SELECTIVE : null;
    const G = ARCH.map(a => {
      const fams = liked.filter(f => a.fams.includes(f)), bottles = new Set();
      for (const f of fams) for (const e of prof[f].evidence || []) if (e.perfume && e.value > 0) bottles.add(e.perfume.id);
      return { a, bottles, sure: fams.filter(f => prof[f].cls === "goodLikely").length, first: fams.length ? liked.indexOf(fams[0]) : -1 };
    }).filter(g => g.first >= 0);
    G.sort((p, q) => q.sure - p.sure || q.bottles.size - p.bottles.size || p.first - q.first);
    const lead = G[0], covered = new Set(lead.bottles);
    const adds = g => [...g.bottles].filter(b => !covered.has(b)).length;
    const side = () => G.slice(1).filter(g => adds(g) > 0).sort((p, q) => adds(q) - adds(p) || q.sure - p.sure || p.first - q.first)[0];
    const second = side();
    if (!second || lead.bottles.size > 2 * adds(second)) return lead.a;
    for (const b of second.bottles) covered.add(b);
    const third = side();
    if (third && lead.bottles.size <= 2 * adds(third)) return WIDE;
    const a = lead.a, b = second.a;
    return { id: a.id + "-" + b.id, icon: a.id, color: a.color, color2: b.color, en: \`The \${a.word} and \${b.word} Palate\`, ar: \`ذائقة \${a.adj} و\${b.adj}\` };
  }
`;
s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(p, s);
