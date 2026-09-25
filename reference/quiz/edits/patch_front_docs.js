const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (f, pairs) => {
  let s = fs.readFileSync(f, "utf8");
  for (const [a, b] of pairs) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${f}: ${n} matches: ${a.slice(0, 70)}`); s = s.replace(a, () => b); }
  fs.writeFileSync(f, s);
};
edit("README.md", [
  ["| `site/index.html` | The profiler page. Markup only; its scripts are in `site/js/`. |",
   "| `site/index.html` | The front page: the bottle quiz, a first profile from well-known bottles the visitor has worn (see Quiz). Markup only; its scripts are in `site/js/`. |"],
  ["| `site/quiz.html` | The bottle quiz: a first profile from well-known bottles the visitor has worn (see Quiz). Markup only. |",
   "| `site/profile.html` | \"Your profile\", the profiler: rate any perfume or sample stage by stage, see the full profile, picks and the one sample that would settle a doubt. Markup only. |\n| `site/quiz.html` | The quiz's old address: sends visitors to the front page, query and all. |"],
  ["`site/quiz.html` is a first run for visitors who do not know where to start. It opens on a start screen\nwith the promise (\"Find what ruins a perfume for you\"), five of the grid's bottles, the four parts as numbered\ncards and a Start button; it states no time.",
   "The quiz is the front page (`site/index.html`). It opens on a start screen\nwith the promise (\"Find what ruins a perfume for you\"), five of the grid's bottles, the four parts as numbered\ncards, a Start button and, for a returning visitor, a link to rate the samples they tried on their profile\n(`site/profile.html`); it states no time."],
  ["opens `index.html?add=<id>`, which adds that perfume on the profiler", "opens `profile.html?add=<id>`, which adds that perfume on the profiler"],
  ["Local run: `http://localhost:8765/quiz.html?endpoint=http://localhost:8765/api`. Links from the quiz to\nthe profiler carry the `endpoint` parameter.",
   "Local run: `http://localhost:8765/?endpoint=http://localhost:8765/api` (the quiz); the profile page is\n`profile.html` with the same parameter. Links from the quiz to the profile carry the `endpoint` parameter."]
]);
edit("CLAUDE.md", [
  ["`js/app.js` the\n  profiler page, `js/quiz.js` the quiz page (`quiz.html`);",
   "`js/app.js` the\n  profile page (`profile.html`), `js/quiz.js` the quiz, which is the front page (`index.html`);"]
]);
console.log("ok");
