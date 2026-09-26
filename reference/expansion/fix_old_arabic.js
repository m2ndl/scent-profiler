/* The owner's decision, 26 Sep 2026: correct three Arabic note words in the older entries. cistus was written قسط (costus)
   and labdanum لبنى (storax); both are لاذن. pimento was written فلفل حلو (bell pepper); it is بهار حلو (allspice).
   A word changes only where its English partner, aligned stage by stage and word by word, is that note. The family name
   and note-card hint for resinous amber, and one article sentence, wrote labdanum as اللبنى: those become اللاذن.
   Evidence, not a tool: an exact-match script; run once. node reference/expansion/fix_old_arabic.js */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const DATA = path.join(ROOT, "site", "js", "data.js"), ART = path.join(ROOT, "site", "articles.html");
const FIX = { cistus: ["قسط", "لاذن"], labdanum: ["لبنى", "لاذن"], pimento: ["فلفل حلو", "بهار حلو"] };
let src = fs.readFileSync(DATA, "utf8"), n = 0;
src = src.replace(/\{ en:"([^"]*)", ar:"([^"]*)" \}/g, (all, en, ar) => {
  const E = en.split(" / "), A = ar.split(" / ");
  if (E.length !== A.length) return all;
  const out = A.map((st, i) => {
    const e = E[i].split(", "), a = st.split("، ");
    if (e.length !== a.length) return st;
    return a.map((w, j) => { const f = FIX[e[j].toLowerCase().trim()]; if (f && w === f[0]) { n++; return f[1]; } return w; }).join("، ");
  }).join(" / ");
  return `{ en:"${en}", ar:"${out}" }`;
});
const fam = [["العنبر الراتنجي (اللبنى، البنزوين)", "العنبر الراتنجي (اللاذن، البنزوين)"], ["راتنجي دافئ حلو (اللبنى)", "راتنجي دافئ حلو (اللاذن)"]];
for (const [a, b] of fam) { if (!src.includes(a)) throw new Error("not found: " + a); src = src.split(a).join(b); n++; }
fs.writeFileSync(DATA, src);
let art = fs.readFileSync(ART, "utf8");
const A1 = "الراتنجات (اللبنى، البنزوين)";
if (!art.includes(A1)) throw new Error("article sentence not found");
fs.writeFileSync(ART, art.split(A1).join("الراتنجات (اللاذن، البنزوين)"));
console.log(n + 1, "changes");
