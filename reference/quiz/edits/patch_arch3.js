const fs = require("fs"); const p = "site/js/quiz.js"; let s = fs.readFileSync(p, "utf8");
const start = s.indexOf("  /* The name follows the shape of what the visitor kept");
const end = s.indexOf("  /* a two-group palate shades");
if (start < 0 || end < 0) throw new Error("anchors");
const block = `  /* The name follows the shape of what the visitor kept, group by group. A kept bottle weighs in a group by
     the presence of the strongest liked family it holds there (Yara: 0.9 sweet, 0.7 musk, 0.4 woody), so a
     bottle counts once per group and the groups with most families gain nothing. The lead group is the one
     with the greatest weight over the bottles. A second side is what another group adds beyond the lead on
     the same bottles: sandalwood in a vanilla bottle adds nothing, an oud bottle adds itself whole. The lead
     names the palate alone when it outweighs twice the strongest addition; otherwise that side joins it ("The
     Fresh and Oud Palate": a summer side and a winter side, not a contradiction), and a third side the lead
     does not outweigh makes the wide palate, whose real finding is the deal-breaker. With dislikes only, the
     selective palate; with neither, none. Told answers never set a class, so only bottles shape the name. */
  function archetypeOf(prof) {
    const liked = byStrength(prof, ["goodLikely", "goodPossible"]);
    if (!liked.length) return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? SELECTIVE : null;
    const G = ARCH.map(a => {
      const fams = liked.filter(f => a.fams.includes(f)), w = {};
      for (const f of fams) for (const e of prof[f].evidence || []) {
        if (!e.perfume || !(e.value > 0)) continue;
        const x = ((e.perfume.stages || {})[e.stage] || {})[f] || 0;
        if (x > (w[e.perfume.id] || 0)) w[e.perfume.id] = x;
      }
      return { a, w, sum: Object.values(w).reduce((t, x) => t + x, 0), first: fams.length ? liked.indexOf(fams[0]) : -1 };
    }).filter(g => g.sum > 0);
    if (!G.length) return null;
    G.sort((p, q) => q.sum - p.sum || p.first - q.first);
    const lead = G[0], covered = Object.assign({}, lead.w);
    const adds = g => Object.entries(g.w).reduce((t, [id, x]) => t + Math.max(0, x - (covered[id] || 0)), 0);
    const side = () => G.slice(1).map(g => [g, adds(g)]).filter(([, x]) => x > 0).sort((p, q) => q[1] - p[1] || p[0].first - q[0].first)[0];
    const second = side();
    if (!second || lead.sum > 2 * second[1]) return lead.a;
    for (const [id, x] of Object.entries(second[0].w)) if (x > (covered[id] || 0)) covered[id] = x;
    const third = side();
    if (third && lead.sum <= 2 * third[1]) return WIDE;
    const a = lead.a, b = second[0].a;
    return { id: a.id + "-" + b.id, icon: a.id, color: a.color, color2: b.color, en: \`The \${a.word} and \${b.word} Palate\`, ar: \`ذائقة \${a.adj} و\${b.adj}\` };
  }
`;
s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(p, s);
