/* E4 fixes 3 and 5 to README.md: exact-match replacements, each must match once. */
"use strict";
const fs = require("fs");
const file = "C:/Users/malha/Desktop/Webapps/perfume-profiler/README.md";
let s = fs.readFileSync(file, "utf8");
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`expected 1 match, got ${n}: ${a.slice(0, 80)}`); s = s.replace(a, () => b); };

rep(`each other family that was at 0.4 or more in the offending perfume's stage at under 0.2 (the rule
settleSuggestion uses), four at most. The visitor may answer them or skip.`,
`each other family that was at 0.4 or more in the offending perfume's stage at under 0.2, four at most. The
rule differs from settleSuggestion's twice: it also runs when the offending perfume has no other family at
0.4 or more (settleSuggestion skips those), and it leaves out bottles answered on this visit, including any
answered "another reason". The visitor may answer them or skip.`);

rep(`| \`verdict:still\`, \`verdict:turned\`, \`verdict:other\`, \`verdict:shop\` | chips attached |`,
    `| \`verdict:still\`, \`verdict:turned\`, \`verdict:other\`, \`verdict:shop\` | chips attached; the event goes out when the visitor leaves the bottle, carrying the final verdict |`);

rep(`| \`tester:<id>\` | the card's position, 0 when no cards are shown |`,
    `| \`tester:<id>\` | the card's position, 0 for the anosmia note's link |`);

fs.writeFileSync(file, s);
console.log("README.md: all replacements applied");
