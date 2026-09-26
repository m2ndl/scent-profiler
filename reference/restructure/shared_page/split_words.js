/* Moves the word-table entries that app.js and quiz.js hold identically, in both languages, into
   site/js/page.js (the block between the WORDS markers), and leaves each page its own entries, wrapped in
   PAGE.words(...). Checked at the end: each page's merged table equals its old table key by key.
   Usage: node split_words.js <project root>   (exact-match edits: a second run fails) */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = process.argv[2];
const JS = f => path.join(ROOT, "site", "js", f);

/* ---- a small scanner for the T literal: strings, templates with ${}, brackets ---- */
function skipString(s, i) { const q = s[i]; i++; while (s[i] !== q) { if (s[i] === "\\") i++; i++; } return i + 1; }
function skipTemplate(s, i) {
  i++;
  while (s[i] !== "`") {
    if (s[i] === "\\") { i += 2; continue; }
    if (s[i] === "$" && s[i + 1] === "{") { i = skipExpr(s, i + 2, "}") + 1; continue; }
    i++;
  }
  return i + 1;
}
/* scan to the closing char at depth 0 (returns its index) */
function skipExpr(s, i, close) {
  let depth = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'") { i = skipString(s, i); continue; }
    if (c === "`") { i = skipTemplate(s, i); continue; }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") { if (depth === 0 && c === close) return i; depth--; }
    i++;
  }
  throw new Error("unbalanced");
}
/* the entries of the object literal whose "{" is at open: key, the entry's span including its comma */
function entries(s, open) {
  const close = skipExpr(s, open + 1, "}"), out = [];
  let i = open + 1;
  while (true) {
    while (/\s/.test(s[i])) i++;
    if (i >= close) break;
    const km = /^("[^"]*"|[A-Za-z_$][\w$]*)\s*:\s*/.exec(s.slice(i, i + 80));
    if (!km) throw new Error("no key at " + s.slice(i, i + 40));
    const key = km[1].replace(/"/g, ""), start = i;
    let j = i + km[0].length, depth = 0;
    while (j < close) {
      const c = s[j];
      if (c === '"' || c === "'") { j = skipString(s, j); continue; }
      if (c === "`") { j = skipTemplate(s, j); continue; }
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      else if (c === "," && depth === 0) break;
      j++;
    }
    const valueEnd = j, end = j < close ? j + 1 : j;   /* past the comma when there is one */
    out.push({ key, start, valueEnd, end });
    i = end;
  }
  return { close, list: out };
}
function tableOf(src) {
  const at = src.indexOf("const T = {"); if (at < 0 || src.indexOf("const T = {", at + 1) >= 0) throw new Error("const T not found exactly once");
  const open = src.indexOf("{", at), outer = entries(src, open);
  const langs = {};
  for (const e of outer.list) { const brace = src.indexOf("{", e.start); langs[e.key] = { brace, ...entries(src, brace) }; }
  return { at, open, close: outer.close, langs };
}
const evalTable = (src, t) => vm.runInNewContext("(" + src.slice(t.open, t.close + 1) + ")", { cap: x => x });
const norm = v => typeof v === "function" ? "fn:" + v.toString() : typeof v === "object" ? JSON.stringify(v, (k, x) => typeof x === "function" ? "fn:" + x.toString() : x) : JSON.stringify(v);

const srcA = fs.readFileSync(JS("app.js"), "utf8"), srcQ = fs.readFileSync(JS("quiz.js"), "utf8");
const tA = tableOf(srcA), tQ = tableOf(srcQ);
const A = evalTable(srcA, tA), Q = evalTable(srcQ, tQ);
const COMMON = Object.keys(A.en).filter(k => k in Q.en && ["en", "ar"].every(l => norm(A[l][k]) === norm(Q[l][k])));
console.log("common:", COMMON.join(", "));

/* the WORDS block for page.js: app.js's own source text of each common entry, grouped by its line there */
function wordsBlock() {
  let out = "";
  for (const l of ["en", "ar"]) {
    out += `    ${l}: {\n`;
    const lines = [];
    for (const e of tA.langs[l].list.filter(e => COMMON.includes(e.key))) {
      const lineNo = srcA.slice(0, e.start).split("\n").length, text = srcA.slice(e.start, e.valueEnd);
      const last = lines[lines.length - 1];
      if (last && last.lineNo === lineNo) last.parts.push(text); else lines.push({ lineNo, parts: [text] });
    }
    out += lines.map(x => "      " + x.parts.join(", ")).join(",\n") + "\n";
    out += `    }${l === "en" ? "," : ""}\n`;
  }
  return out;
}

/* remove the common entries from a page's table; a line left with only spaces goes */
function stripCommon(src, t) {
  const cuts = [];
  for (const l of ["en", "ar"]) for (const e of t.langs[l].list) if (COMMON.includes(e.key)) {
    let end = e.end; while (src[end] === " ") end++;                       /* the space before the next entry on the line */
    cuts.push([e.start, end]);
  }
  cuts.sort((a, b) => b[0] - a[0]);
  let out = src;
  for (const [s, e] of cuts) out = out.slice(0, s) + out.slice(e);
  /* a table's last entry keeps no dangling comma issues: JS allows it; blank lines inside the table go */
  const head = out.indexOf("const T = {"), tail = skipExpr(out, out.indexOf("{", head) + 1, "}");
  const inside = out.slice(head, tail + 1).split("\n").filter(line => line.trim() !== "").join("\n");
  out = out.slice(0, head) + inside.replace("const T = {", "const T = PAGE.words({") + out.slice(tail + 1).replace(/^;/, ");");
  return out;
}

const newA = stripCommon(srcA, tA), newQ = stripCommon(srcQ, tQ);
const block = wordsBlock();
const pagePath = JS("page.js"), page = fs.readFileSync(pagePath, "utf8");
const marker = /(  const WORDS = \{\n)    \/\* WORDS \*\/\n(  \};)/;
if (!marker.test(page)) throw new Error("page.js WORDS marker not found");
const newPage = page.replace(marker, (m, a, b) => a + block + b);

/* check: each page's merged table equals its old one, key by key, in both languages */
const W = vm.runInNewContext("(" + newPage.slice(newPage.indexOf("const WORDS = {") + 14, newPage.indexOf("\n  };", newPage.indexOf("const WORDS = {")) + 4) + ")", {});
const merged = (src) => {
  const at = src.indexOf("const T = PAGE.words({"), open = src.indexOf("{", at), close = skipExpr(src, open + 1, "}");
  const own = vm.runInNewContext("(" + src.slice(open, close + 1) + ")", { cap: x => x });
  return { en: Object.assign({}, W.en, own.en), ar: Object.assign({}, W.ar, own.ar) };
};
for (const [name, oldT, newSrc] of [["app.js", A, newA], ["quiz.js", Q, newQ]]) {
  const M = merged(newSrc);
  for (const l of ["en", "ar"]) {
    const ko = Object.keys(oldT[l]).sort(), kn = Object.keys(M[l]).sort();
    if (JSON.stringify(ko) !== JSON.stringify(kn)) throw new Error(`${name} ${l}: key sets differ`);
    for (const k of ko) if (norm(oldT[l][k]) !== norm(M[l][k])) throw new Error(`${name} ${l}.${k} differs`);
  }
  console.log(name, "merged table equals the old one:", Object.keys(M.en).length, "keys per language");
}
fs.writeFileSync(JS("app.js"), newA); fs.writeFileSync(JS("quiz.js"), newQ); fs.writeFileSync(pagePath, newPage);
console.log("written: app.js, quiz.js, page.js");
