/* E6 follow-up: picker entries may carry their own fams; "amber" means resinous amber on a card. Exact match; fails on a second run. */
const fs = require("fs");
const R = "C:/Users/malha/Desktop/Webapps/perfume-profiler/";
function edit(file, pairs) {
  let src = fs.readFileSync(R + file, "utf8");
  for (const [a, b] of pairs) { const n = src.split(a).length - 1; if (n !== 1) throw new Error(file + ": expected one match, found " + n + ": " + a.slice(0, 50)); src = src.replace(a, b); }
  fs.writeFileSync(R + file, src);
}
edit("site/js/data.js", [
  [`    /* The note picker: four screens of single notes people recognise. en is the word passed to
       PP_MAP.famsForNote; the screen titles are in the page's strings. */`,
   `    /* The note picker: four screens of single notes people recognise. en is the word passed to
       PP_MAP.famsForNote, unless the entry carries its own fams: on a card, "amber" means resinous amber,
       while in a note list it often hides an Ambroxan-type base. The screen titles are in the page's strings. */`],
  [`        { id: "amber", en: "amber", ar: "عنبر" },`, `        { id: "amber", en: "amber", ar: "عنبر", fams: { amber_resin: .9 } },`]
]);
edit("site/js/notes.js", [
  [`       - quiz.notes { noteId: 1 | -1 }: one item per family the note word maps to, with the mapper weight;`,
   `       - quiz.notes { noteId: 1 | -1 }: one item per family the note word maps to, with the mapper weight, or
         per family in the picker entry's own fams when it has them;`],
  [`        if (v === 1 || v === -1) push(M.famsForNote(n.en), v, "note:" + n.id);`,
   `        if (v === 1 || v === -1) push(n.fams || M.famsForNote(n.en), v, "note:" + n.id);`]
]);
edit("tests/site.test.js", [
  [`test("the note picker's ids are unique and every note word maps to a family some perfume holds at 0.4 or more", () => {`,
   `test("the note picker's ids are unique and every note maps to a family some perfume holds at 0.4 or more", () => {`],
  [`  const notes = D.QUIZ.notePicker.flatMap(s => s.notes), ids = notes.map(n => n.id), bad = [];`,
   `  const F = new Set(Object.keys(D.FAMILIES)), notes = D.QUIZ.notePicker.flatMap(s => s.notes), ids = notes.map(n => n.id), bad = [];`],
  [`    const fams = W.PP_MAP.famsForNote(n.en) || {};
    if (!Object.keys(fams).some(held)) bad.push(\`\${n.id}: "\${n.en}" maps to \${JSON.stringify(fams)}, which no perfume holds at 0.4\`);`,
   `    if (n.fams) {
      /* an entry's own families replace the mapper's: each must be known, weighted 0..1 and held by some perfume */
      for (const [f, w] of Object.entries(n.fams)) if (!F.has(f) || !(w > 0 && w <= 1) || !held(f)) bad.push(\`\${n.id}: own family \${f} at \${w}\`);
      if (!Object.keys(n.fams).length) bad.push(\`\${n.id}: empty fams\`);
      continue;
    }
    const fams = W.PP_MAP.famsForNote(n.en) || {};
    if (!Object.keys(fams).some(held)) bad.push(\`\${n.id}: "\${n.en}" maps to \${JSON.stringify(fams)}, which no perfume holds at 0.4\`);`]
]);
edit("tests/notes.test.js", [
  [`test("toldItems reads an old string quiz.told as a one-item array, and \\"none\\" as nothing", () => {`,
   `test("a picker entry's own fams replace the mapper: enjoying amber raises resinous amber, not woody ambers", () => {
  assert.ok(W.PP_MAP.famsForNote("amber").woody_amber > 0, "the mapper splits amber, so the entry's own fams matter");
  assert.deepEqual(plain(N.toldItems({ notes: { amber: 1 } })), [{ f: "amber_resin", value: 1, w: 0.9, src: "note:amber" }]);
  /* ambergris stays on the mapper */
  const gris = N.toldItems({ notes: { ambergris: -1 } });
  assert.deepEqual(sortItems(gris), sortItems(Object.entries(W.PP_MAP.famsForNote("ambergris")).map(([f, w]) => ({ f, value: -1, w, src: "note:ambergris" }))));
  assert.ok(gris.some(i => i.f === "woody_amber"));
});

test("toldItems reads an old string quiz.told as a one-item array, and \\"none\\" as nothing", () => {`]
]);
console.log("written");
