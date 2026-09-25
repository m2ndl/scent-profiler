/* One-off: the quiz page's picker titles, the "More notes" fold and the bracket-aware row check. Exact-match
   replacements; a second run fails because the old text is gone. */
const fs = require("fs");
const file = "C:/Users/malha/Desktop/Webapps/perfume-profiler/site/js/quiz.js";
let s = fs.readFileSync(file, "utf8");
const rep = (a, b) => { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error("not found once: " + a.slice(0, 60)); s = s.slice(0, i) + b + s.slice(i + a.length); };
rep(`pickerH: { fresh: "Fresh and green", flowers: "Flowers and fruit", spices: "Spices and sweets", woods: "Woods, resins and musks" },`,
    `pickerH: { fresh: "Citrus and fresh", flowers: "Flowers", fruit: "Fruit and sweet", spices: "Spices and herbs", woods: "Woods, resins, musks and smoke" },`);
rep(`pick: { 1: "I enjoy it", "-1": "I avoid it", 0: "Not sure" }, pickCount: (i, n) => \`\${i} of \${n}\`,`,
    `pick: { 1: "I enjoy it", "-1": "I avoid it", 0: "Not sure" }, pickCount: (i, n) => \`\${i} of \${n}\`, pickMore: n => \`More notes (\${n})\`,`);
rep(`pickerH: { fresh: "منعش وأخضر", flowers: "زهور وفواكه", spices: "توابل وحلويات", woods: "أخشاب وراتنجات ومسك" },`,
    `pickerH: { fresh: "حمضيات ومنعش", flowers: "زهور", fruit: "فواكه وحلويات", spices: "توابل وأعشاب", woods: "أخشاب وراتنجات ومسك ودخان" },`);
rep(`pick: { 1: "أحبه", "-1": "أتجنبه", 0: "لست متأكداً" }, pickCount: (i, n) => \`\${i} من \${n}\`,`,
    `pick: { 1: "أحبه", "-1": "أتجنبه", 0: "لست متأكداً" }, pickCount: (i, n) => \`\${i} من \${n}\`, pickMore: n => \`نوتات أخرى (\${n})\`,`);
rep(`  let pk = 0;                   /* the note picker screen shown */\n`,
    `  let pk = 0;                   /* the note picker screen shown */\n  const pkMore = new Set();     /* picker screens opened with "More notes" */\n`);
/* a card labelled "ambroxan (modern amberwood)" is asked as "ambroxan" */
rep(`     "apple" in "pineapple", "tea" in "teak", or "orange" on an orange blossom row. Case is ignored. */`,
    `     "apple" in "pineapple", "tea" in "teak", or "orange" on an orange blossom row. Case is ignored, and so is
     a label's part in brackets: "ambroxan (modern amberwood)" is asked as "ambroxan". */`);
rep(`    const w = n.en.toLowerCase(), f = mainFam(n),`,
    `    const w = n.en.toLowerCase().replace(/\s*\(.*\)\s*$/, ""), f = mainFam(n),`);
rep(`  /* four screens of single notes, each card "I enjoy it", "I avoid it" or "Not sure" (the default) */
  function pickerHtml() {
    const s = pickScreens().find(x => x.i === pk); if (!s) return "";
    const notes = quiz.notes || {};`,
    `  /* five screens of single notes, each card "I enjoy it", "I avoid it" or "Not sure" (the default). A screen
     shows its first ten cards; "More notes" shows the rest in place, and a screen whose folded cards hold an
     answer opens by itself. */
  const FOLD = 10;
  function pickerHtml() {
    const s = pickScreens().find(x => x.i === pk); if (!s) return "";
    const notes = quiz.notes || {};
    const open = pkMore.has(pk) || s.cards.slice(FOLD).some(n => notes[n.id] === 1 || notes[n.id] === -1);
    const cards = open ? s.cards : s.cards.slice(0, FOLD);`);
rep(`      <div class="pcards">\${s.cards.map(card).join("")}</div>
      <div class="qactions"><button type="button" class="btn primary" data-continue="1">\${esc(t().next)}</button></div>\` + foot();`,
    `      <div class="pcards">\${cards.map(card).join("")}</div>
      \${cards.length < s.cards.length ? \`<div class="qactions"><button type="button" class="btn" data-pmore="1">\${esc(t().pickMore(s.cards.length - cards.length))}</button></div>\` : ""}
      <div class="qactions"><button type="button" class="btn primary" data-continue="1">\${esc(t().next)}</button></div>\` + foot();`);
rep(`    if (d.pn && step === "picker") {`,
    `    if (d.pmore && step === "picker") { pkMore.add(pk); render(); return; }
    if (d.pn && step === "picker") {`);
fs.writeFileSync(file, s);
console.log("quiz.js edited");
/* Note: the askedOnRow replacement above lost its backslashes in the template literal and wrote /s*(.*)s*$/;
   it was corrected by hand to /\s*\(.*\)\s*$/ and checked by the full-run test (it fails without the strip). */
