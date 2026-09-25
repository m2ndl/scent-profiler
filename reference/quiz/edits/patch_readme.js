const fs = require("fs"); const p = "README.md"; let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(n + " matches: " + a.slice(0, 80)); s = s.replace(a, () => b); };

rep(`version and the stats endpoint counts only the last row per device and perfume. The page also
reads \`?stats=1\` to show community averages under each rated perfume.
`, `version and the stats endpoint counts only the last row per device and perfume. The page also
reads \`?stats=1\` to show community averages under each rated perfume. The same answer carries \`quiz\`: each
device's last finished quiz result, counted by palate and by deal-breaker, which the quiz's comparison line reads.

The sheet gets a **Profiler** menu with **Build the quiz funnel**. It writes a \`funnel\` sheet: for each quiz screen
in order, how many devices reached it and what share of those who saw the start screen that is. Run it from the
menu or from the script editor whenever you want a fresh count.
`);

rep(`\`site/quiz.html\` is a first run for visitors who do not know where to start. It shows twenty well-known
bottles`, `\`site/quiz.html\` is a first run for visitors who do not know where to start. It opens on a start screen
with the promise ("Find what ruins a perfume for you"), five of the grid's bottles, the four parts as numbered
cards and a Start button; it states no time. It then shows twenty well-known
bottles`);

rep(`anosmia). Every screen but the first has a Back button.`, `anosmia). Every screen but the start screen has a Back button.`);

rep(`Events (\`events\` sheet) and the falsifier each one measures (reference/debate/quiz/ROUNDTABLE.md, section 6):`,
`The result opens on the palate name and its emblem. The name follows what the kept bottles show: each kept bottle
counts for one of nine palate groups (the group of its strongest liked family, weighted by that family's presence),
and the lead group names the palate alone when it holds more than twice the next group's weight. Otherwise both are
named ("The Oud and Musk Palate"), and from four bottles a third group the lead does not outweigh makes "The Wide
Palate". Dislikes only give "The Selective Palate". One sentence under the name says what the bottles show; below the
taste card come the comparison line and a tip for the lead group. The wide and selective palates keep their tip
under the name, since there the deal-breaker is the finding. The comparison line appears only once 100 people have
finished the quiz: the share who hold the visitor's strongest deal-breaker, or, without one, the same palate.

Events (\`events\` sheet) and the falsifier each one measures (reference/debate/quiz/ROUNDTABLE.md, section 6):`);

rep(`| \`sample:<id>\` | the recommendation's position | sample-link use from the quiz's recommendations (no falsifier) |
`, `| \`sample:<id>\` | the recommendation's position | sample-link use from the quiz's recommendations (no falsifier) |
| \`reach:<screen>\` | 0; one per screen reached: \`start\`, \`grid\`, \`verdicts\`, \`notes\`, \`narrow\`, \`picker:1\` to \`picker:5\`, \`taste\`, \`told\`, \`anosmia\` | the funnel (Build the quiz funnel): where visitors stop |
| \`result:<palate>:<deal-breakers>\` | ratings with a stage set; deal-breakers joined by \`+\` | the counts behind the comparison line; sent again when a changed answer changes the result |
`);

rep(`Each event goes out once per visit, when its screen is first left, so going Back and answering again sends nothing
new.`, `Each event goes out once per visit, when its screen is first left (a \`reach\` event when it is first shown), so
going Back and answering again sends nothing new; only a changed result sends a new \`result\` event.`);
fs.writeFileSync(p, s);
console.log("ok");
