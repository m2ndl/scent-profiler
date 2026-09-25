const fs = require("fs"); const p = "site/js/quiz.js"; let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing: " + a.slice(0, 60)); if (s.split(a).length !== 2) throw new Error("not unique: " + a.slice(0, 60)); s = s.replace(a, b); };
rep(`    selective: '<path d="M12 3.5l7.5 7-7.5 10.5-7.5-10.5z"/><path d="M4.5 10.5h15M9 10.5l3 10.5 3-10.5M9 10.5l3-7 3 7" opacity=".75"/>'\n  };`,
`    selective: '<path d="M12 3.5l7.5 7-7.5 10.5-7.5-10.5z"/><path d="M4.5 10.5h15M9 10.5l3 10.5 3-10.5M9 10.5l3-7 3 7" opacity=".75"/>',
    wide: [-56, -28, 0, 28, 56].map(a => \`<path d="M12 19.5V5.5" transform="rotate(\${a} 12 19.5)"/>\`).join("") + '<path d="M4.6 12.4a9 9 0 0 1 14.8 0" opacity=".75"/><circle cx="12" cy="19.5" r="1.3"/>'
  };
  /* word and adj name the group inside a two-group palate: "The Fresh and Oud Palate", "ذائقة منعشة وعودية" */`);
const words = { amber: ["Amber", "عنبرية"], sweet: ["Sweet", "حلوة"], oud: ["Oud", "عودية"], musk: ["Musk", "مسكية"], woody: ["Woody", "خشبية"], rose: ["Rose", "وردية"], floral: ["Floral", "زهرية"], fresh: ["Fresh", "منعشة"], spiced: ["Spiced", "متبّلة"] };
for (const [id, [w, a]] of Object.entries(words)) {
    const row = s.match(new RegExp(`\{ id: "${id}"[^
]*? \}`)); if (!row) throw new Error("no ARCH row " + id);
  s = s.replace(row[0], row[0].replace(/ }$/, `, word: "${w}", adj: "${a}" }`));
}
rep(`  const SELECTIVE = { id: "selective", fams: [], color: "#6B4E3D", en: "The Selective Palate", ar: "ذائقة انتقائية" };
  /* the group of the strongest liked family, the one the taste card lists first (a sum over the group would favour
     the groups with most families); with dislikes only, the selective palate; with neither, none */
  function archetypeOf(prof) {
    const top = byStrength(prof, ["goodLikely", "goodPossible"])[0];
    if (top) return ARCH.find(a => a.fams.includes(top)) || null;
    return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? SELECTIVE : null;
  }
`, `  const SELECTIVE = { id: "selective", fams: [], color: "#6B4E3D", en: "The Selective Palate", ar: "ذائقة انتقائية" };
  const WIDE = { id: "wide", fams: [], color: "#4E6B62", en: "The Wide Palate", ar: "ذائقة واسعة" };
  /* the name follows the shape of what the visitor likes, in the taste card's order. One group, or a group holding
     two of the three families the card shows, names the palate. Two groups name it together ("The Fresh and Oud
     Palate": a summer side and a winter side, not a contradiction). Four or more liked families across three or
     more groups make the wide palate, whose real finding is the deal-breaker. With dislikes only, the selective
     palate; with neither, none. A sum over a group would favour the groups with most families, so the order of
     the families themselves decides. */
  function archetypeOf(prof) {
    const liked = byStrength(prof, ["goodLikely", "goodPossible"]);
    if (!liked.length) return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? SELECTIVE : null;
    const groups = [];
    for (const f of liked) { const a = ARCH.find(g => g.fams.includes(f)); if (a && !groups.includes(a)) groups.push(a); }
    const lead = groups[0];
    if (!lead) return null;
    if (groups.length === 1 || liked.slice(0, 3).filter(f => lead.fams.includes(f)).length >= 2) return lead;
    if (groups.length >= 3 && liked.length >= 4) return WIDE;
    const b = groups[1];
    return { id: lead.id + "-" + b.id, icon: lead.id, color: lead.color, color2: b.color, en: \`The \${lead.word} and \${b.word} Palate\`, ar: \`ذائقة \${lead.adj} و\${b.adj}\` };
  }
  /* a two-group palate shades from the first group's colour into the second's and carries the first group's mark */
`);
rep(`<stop offset="1" stop-color="\${a.color}"/></radialGradient>`, `<stop offset="1" stop-color="\${a.color2 || a.color}"/></radialGradient>`);
fs.writeFileSync(p, s);
