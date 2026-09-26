/* The new search keeps every old result, in the old order, and only appends word hits after them. */
const fs = require("fs"), path = require("path");
const ROOT = "C:/Users/malha/Desktop/Webapps/perfume-profiler";
const { createPage } = require(ROOT + "/tests/lib/dom.js");
const page = createPage({ localStorage: {} });
page.load(["config", "data", "mapper", "materials", "evidence", "engine", "notes", "bottles", "page"].map(n => ({ filename: n, code: fs.readFileSync(path.join(ROOT, "site/js", n + ".js"), "utf8") })));
const W = page.sandbox, D = W.PP_DATA, E = W.PP_ENGINE.create(D, W.PP_MAP, W.PP_EVIDENCE);
const P0 = W.PP_PAGE.create({ D, E, CONFIG: W.PP_CONFIG, words: W.PP_PAGE.words({ en: {}, ar: {} }), lang: () => "en", ratings: () => ({}) });
const oldHit = (P, q) => (P.name.toLowerCase().includes(q) || (P.house || "").toLowerCase().includes(q) || (P.ar && P.ar.includes(q)) || P.id.includes(q));
const qs = new Set(["amber", "cr", "رد", "tea", "sauvage", "عود", "lattafa", "encre", "dior", "green irish tweed", "khamrah", "unknown scent 7", "ab", "oud rose test", "encre noire", "yara", "cartier declaration", "declaration edt", "lancome idole", "creed aventus", "ysl y edp"]);
for (const P of E.PERFUMES) {
  const words = (P.house + " " + P.name).toLowerCase().split(/\s+/).filter(w => w.length >= 2);
  words.forEach(w => qs.add(w));
  for (let i = 0; i + 1 < words.length; i++) qs.add(words[i] + " " + words[i + 1]);
  qs.add(P.name.toLowerCase()); qs.add((P.house + " " + P.name).toLowerCase());
  if (P.ar) { qs.add(P.ar); P.ar.split(/\s+/).forEach(w => w.length >= 2 && qs.add(w)); }
}
let checked = 0, grew = 0, bad = [];
for (const raw of qs) {
  const q = raw.trim().toLowerCase(); if (!q) continue;
  const old = E.PERFUMES.filter(P => oldHit(P, q)).map(P => P.id).slice(0, 12);
  const neu = P0.searchHits([E.PERFUMES, []], q).map(P => P.id).slice(0, 12);
  checked++;
  if (JSON.stringify(neu.slice(0, old.length)) !== JSON.stringify(old)) bad.push(["order or loss", q, old, neu]);
  if (neu.length > old.length) grew++;
}
console.log(checked, "queries;", grew, "gained results;", bad.length, "lost or reordered an old result");
for (const b of bad.slice(0, 5)) console.log(JSON.stringify(b));
const show = q => console.log(JSON.stringify(q), "->", P0.searchHits([E.PERFUMES, []], q).map(P => P.id).slice(0, 5).join(" "));
["cartier declaration", "declaration edt", "sauvage edt", "lancome idole", "ديكلاراسيون تواليت"].forEach(show);
