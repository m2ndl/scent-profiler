const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (f, pairs) => {
  let s = fs.readFileSync(f, "utf8");
  for (const [a, b] of pairs) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${f}: ${n} matches: ${a.slice(0, 70)}`); s = s.replace(a, () => b); }
  fs.writeFileSync(f, s);
};
/* the search list opens over the sticky Continue bar and the phone's bottom bar, not under them */
{
  let s = fs.readFileSync("site/site.css", "utf8");
  const m = s.match(/\.results \{ position: absolute;[^\n]*z-index: 4;/);
  if (!m) throw new Error("results rule");
  s = s.replace(m[0], m[0].replace("z-index: 4;", "z-index: 8;"));
  fs.writeFileSync("site/site.css", s);
}
edit("site/site.css", [[".qreturn { margin: 18px 2px 0; font-size: 15px; }\n",
  ".qreturn { margin: 18px 2px 0; font-size: 15px; }\n" +
  "/* Start: the one thing to do on the start screen, so it comes straight after the promise and fills the width on a phone */\n" +
  ".qstart-go.btn.primary { display: flex; width: 100%; min-height: 60px; margin-top: 22px; padding: 14px 28px; font-size: 21px; font-weight: 700; letter-spacing: .01em;\n" +
  "  box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 14px 28px -12px rgba(140,95,0,.85), 0 0 0 4px rgba(242,214,138,.35); }\n" +
  ".qstart-go::after { content: \"\\2192\"; margin-inline-start: 12px; font-weight: 400; }\n" +
  "[dir=\"rtl\"] .qstart-go::after { content: \"\\2190\"; }\n" +
  "@media (min-width: 641px) { .qstart-go.btn.primary { width: auto; min-width: 320px; } }\n" +
  ".qstart .qsteps-h { margin-top: 30px; }\n"]]);
edit("site/js/quiz.js", [
  [`      <div class="hero"><h1>\${esc(t().startH)}</h1><p>\${esc(t().startLede)}</p></div>
      <p class="qsteps-h">\${esc(t().startParts)}</p><ol class="qsteps">\${t().parts.map((name, i) => \`<li><b>\${i + 1}</b><span>\${esc(name)}</span></li>\`).join("")}</ol>
      <p class="qreturn"><a href="\${esc(profilerHref())}">\${esc(t().startBack)}</a></p>
      <div class="qactions"><button type="button" class="btn primary" data-start="1">\${esc(t().startGo)}</button></div></div>\` + foot();`,
   `      <div class="hero"><h1>\${esc(t().startH)}</h1><p>\${esc(t().startLede)}</p></div>
      <button type="button" class="btn primary qstart-go" data-start="1">\${esc(t().startGo)}</button>
      <p class="qsteps-h">\${esc(t().startParts)}</p><ol class="qsteps">\${t().parts.map((name, i) => \`<li><b>\${i + 1}</b><span>\${esc(name)}</span></li>\`).join("")}</ol>
      <p class="qreturn"><a href="\${esc(profilerHref())}">\${esc(t().startBack)}</a></p></div>\` + foot();`],
  [`  /* The start screen: the promise, five of the grid's bottles, the four parts, and Start. */`,
   `  /* The start screen: five of the grid's bottles, the promise, Start, then the four parts and a link for a returning visitor. */`],
  [`    q.addEventListener("focus", e => showResults(search(e.target.value)));`,
   `    /* on a phone the box sits low on the grid screen, with the keyboard below it: bring it to the top so the list has room */
    q.addEventListener("focus", e => {
      showResults(search(e.target.value));
      try { if (window.innerWidth < 700) q.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (err) { /* not available */ }
    });`]
]);
console.log("ok");
