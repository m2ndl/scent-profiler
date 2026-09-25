const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (f, pairs) => {
  let s = fs.readFileSync(f, "utf8");
  for (const [a, b] of pairs) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${f}: ${n} matches: ${a.slice(0, 70)}`); s = s.replace(a, () => b); }
  fs.writeFileSync(f, s);
};
edit("site/js/quiz.js", [
  [`  function showResults(list) {
    const box = $("results"); if (!box) return;
    if (!list.length) { box.hidden = true; box.innerHTML = ""; return; }`,
   `  /* While the list is open the page gets room below it (the search box sits near the end of the grid screen), and on a
     phone the box scrolls to the top of the screen, so the keyboard does not cover the list. */
  function roomForResults(open) {
    const host = $("quiz"); if (host && host.classList) host.classList[open ? "add" : "remove"]("qsearching");
    const q = $("q");
    try { if (open && q && window.innerWidth < 700 && q.getBoundingClientRect().top > window.innerHeight * .25) q.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (err) { /* not available */ }
  }
  function showResults(list) {
    const box = $("results"); if (!box) return;
    roomForResults(list.length > 0);
    if (!list.length) { box.hidden = true; box.innerHTML = ""; return; }`],
  [`    /* on a phone the box sits low on the grid screen, with the keyboard below it: bring it to the top so the list has room */
    q.addEventListener("focus", e => {
      showResults(search(e.target.value));
      try { if (window.innerWidth < 700) q.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (err) { /* not available */ }
    });`,
   `    q.addEventListener("focus", e => showResults(search(e.target.value)));`]
]);
edit("site/site.css", [[".qstart .qsteps-h { margin-top: 30px; }\n",
  ".qstart .qsteps-h { margin-top: 30px; }\n/* room below an open search list, so the box can scroll to the top of a phone screen above the keyboard */\n#quiz.qsearching { padding-bottom: 70vh; }\n"]]);
console.log("ok");
