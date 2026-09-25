// Exact-match replacer. Edits file format, repeated:
// @@ relative/path
// old text
// @@>
// new text
// @@.
// Every old text must occur exactly once; nothing is written unless all edits match.
const fs = require("fs");
const src = fs.readFileSync(process.argv[2], "utf8").replace(/\r\n/g, "\n");
const edits = [...src.matchAll(/^@@ (.+)\n([\s\S]*?)\n@@>\n([\s\S]*?)\n@@\.$/gm)].map(m => ({ file: m[1].trim(), old: m[2], new: m[3] }));
const root = "C:/Users/malha/Desktop/Webapps/perfume-profiler/";
const cache = {};
for (const e of edits) {
  const p = root + e.file;
  const s = cache[p] != null ? cache[p] : fs.readFileSync(p, "utf8");
  if (s.includes("\r\n")) { e.old = e.old.replace(/\n/g, "\r\n"); e.new = e.new.replace(/\n/g, "\r\n"); }
  const n = s.split(e.old).length - 1;
  if (n !== 1) { console.error(`FAIL ${e.file}: ${n} matches for ${e.old.slice(0, 80)}`); process.exit(1); }
  cache[p] = s.replace(e.old, () => e.new);
}
for (const [p, s] of Object.entries(cache)) fs.writeFileSync(p, s);
console.log("OK", edits.length, "edits in", Object.keys(cache).length, "files");
