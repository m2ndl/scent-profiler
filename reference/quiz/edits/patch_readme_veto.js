const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
let s = fs.readFileSync("README.md", "utf8");
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${n} matches: ${a.slice(0, 70)}`); s = s.replace(a, () => b); };
rep(`  with no strong bottle evidence, so it can reorder the picks but never sets a class or excludes
  a perfume. A family known only from told answers`,
`  with no strong bottle evidence, so it can reorder the picks but never sets a class. A family known only from told answers`);
rep(`- A family is a **likely deal-breaker** when its weighted mean is ≤ −0.7 across two or more`,
`- A note card answered "avoid" is also a veto on the picks (\`PP_NOTES.avoidedNotes\`, \`engine.recommend(prof, ratings,
  avoid)\`): no pick where that card's family (weight 0.5 or more on the card) leads the heart or the base (0.7 or more,
  and the strongest there), or whose name carries the note, and \`ruledOut()\` counts those perfumes. A kept bottle that
  holds the family strongly (\`pos > 0\`) lifts the veto: the bottles win, \`recommend()\` returns the family under
  \`contradicted\`, and the quiz result says so under the taste card ("You said you avoid musk, but Yara, which you kept,
  has clean white musks..."). With no avoided card nothing changes, so the engine golden is unaffected.
- Each pick carries \`reason\`: up to two liked families it has in the heart or base (a liked class, or a clear lean
  from the visitor's words), up to two deal-breakers it is free of, and at most one thing to watch for, in this order:
  an avoided family that is only secondary here (0.3 or more) or only in the opening, a possible deal-breaker, a family
  the visitor's words lean against, a family their bottles split on, then an untried family that leads the heart or
  base. Traces under 0.3 are never named. The quiz shows these as lines on stacked pick cards; the profile page uses the
  watch item for its risk line.
- A family is a **likely deal-breaker** when its weighted mean is ≤ −0.7 across two or more`);
rep(`(see How the profile is computed): they can reorder the picks but never set a class or exclude a perfume. The`,
`(see How the profile is computed): they can reorder the picks but never set a class; an avoided note card also vetoes
the picks it leads, unless a kept bottle carries it. The`);
fs.writeFileSync("README.md", s);
console.log("ok");
