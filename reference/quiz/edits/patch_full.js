const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (f, pairs) => {
  let s = fs.readFileSync(f, "utf8");
  for (const [a, b] of pairs) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${f}: ${n} matches: ${a.slice(0, 70)}`); s = s.replace(a, () => b); }
  fs.writeFileSync(f, s);
};
edit("site/js/quiz.js", [[
  "${tipHtml}${recs}<div class=\"qshare\"><button type=\"button\" class=\"btn\" data-sharecard=\"1\">${esc(t().share)}</button></div>${anos}\n      <details class=\"qhow\"><summary>${esc(t().how)}</summary><p class=\"notes\">${esc(t().resultLede)}</p>${famHtml}${told}</details>\n      <div class=\"qactions\"><a class=\"btn primary\" href=\"${esc(profilerHref(\"\", \"#sec-profile\"))}\">${esc(t().full)}</a></div></div>` + foot();",
  "${tipHtml}${recs}\n      <a class=\"btn qfull\" href=\"${esc(profilerHref(\"\", \"#sec-profile\"))}\">${esc(t().full)}</a>\n      <div class=\"qshare\"><button type=\"button\" class=\"btn\" data-sharecard=\"1\">${esc(t().share)}</button></div>${anos}\n      <details class=\"qhow\"><summary>${esc(t().how)}</summary><p class=\"notes\">${esc(t().resultLede)}</p>${famHtml}${told}</details></div>` + foot();"
]]);
edit("site/site.css", [[".qmore { margin-top: 14px; }\n",
  ".qmore { margin-top: 14px; }\n" +
  "/* the full profile: the next step after the picks, dark wood with gold type so it stands apart from the gold Sample buttons */\n" +
  ".qfull.btn { display: flex; width: 100%; min-height: 60px; margin-top: 22px; padding: 14px 28px; font-size: 19px; font-weight: 700; text-decoration: none;\n" +
  "  background: linear-gradient(180deg, #3A2718 0%, #2A1B11 100%); color: #F2D68A; border: 1px solid rgba(242,214,138,.55);\n" +
  "  box-shadow: inset 0 1px 0 rgba(242,214,138,.3), 0 14px 28px -12px rgba(42,27,17,.8); }\n" +
  ".qfull.btn:hover { background: linear-gradient(180deg, #45301F 0%, #2F1F14 100%); color: #FBECB8; border-color: rgba(242,214,138,.75); }\n" +
  ".qfull::after { content: \"\\2192\"; margin-inline-start: 12px; font-weight: 400; }\n" +
  "[dir=\"rtl\"] .qfull::after { content: \"\\2190\"; }\n" +
  "@media (min-width: 641px) { .qfull.btn { width: auto; min-width: 340px; } }\n"]]);
console.log("ok");
