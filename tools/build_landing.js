#!/usr/bin/env node
/* Builds site/js/landing-data.js, the catalogue facts the front page (index.html) shows, so that page need not load
   the whole catalogue:
     - the twenty quiz bottles (QUIZ.grid), each with its name, house, photo, listed notes by stage in both languages
       (a note keeps its Arabic only when that stage's two lists line up, as notes.js does), the family each note maps
       to most strongly (mapper.js) and that family's palate group, and its three stages of families;
     - every family's names, one-line description, palate group and how many catalogue perfumes hold it at 0.4 or
       more in some stage (the engine's threshold for a family a perfume clearly carries);
     - the nine palate groups with their colours, read from site/js/quiz.js (ARCH), and the catalogue's size;
     - the figures the page's steps quote: how many perfumes clearly carry at least one of the seven liked families
       (step 1), how many carry both a liked family and a family that often comes with it (step 5), and, from the
       ingredient labels in evidence/labels/, one perfume's label beside its note list and how many of the labels
       name Iso E Super among their first five ingredients while no note list names it (step 3).
   Run after any change to data.js, mapper.js, bottles.js, materials.js, the palate groups or the labels;
   tests/landing.test.js fails while the file is out of date. */

const fs = require("fs");
const path = require("path");
const { ROOT, SITE, loadSite } = require("./lib/site");
const OUT = path.join(SITE, "js", "landing-data.js");
const LABELS = path.join(ROOT, "evidence", "labels");
const STAGES = ["opening", "heart", "drydown"];
/* step 1: families of smells most people like, shown as the page's first strips */
const LIKED = ["rose", "white_floral", "citrus_fresh", "spicy_warm", "sandalwood_creamy", "vanilla_gourmand", "amber_resin"];
/* step 5: a liked family, and a family many perfumes carry with it */
const PAIR = ["vanilla_gourmand", "woody_amber"];
/* step 3: the perfume whose ingredient label is set beside its note list, and the material counted across the labels */
const EXAMPLE = "pegasus";
const ISO = "tetramethyl acetyloctahydronaphthalenes";
const TOP = 5;

/* the quiz's palate groups (ARCH in quiz.js): id, families and colour */
function palateGroups() {
  const src = fs.readFileSync(path.join(SITE, "js", "quiz.js"), "utf8");
  const out = {};
  for (const m of src.matchAll(/\{ id: "(\w+)", fams: \[([^\]]*)\], color: "(#[0-9A-Fa-f]{6})"/g)) {
    const fams = [...m[2].matchAll(/"(\w+)"/g)].map(x => x[1]);
    if (fams.length) out[m[1]] = { fams, color: m[3] };   /* the selective and wide palates hold no family */
  }
  return out;
}

/* the ingredient labels: a few "key: value" lines, then the ingredients as printed, comma-separated */
function readLabels() {
  return fs.readdirSync(LABELS).filter(f => f.endsWith(".txt")).sort().map(f => {
    const head = {}, rest = [];
    for (const line of fs.readFileSync(path.join(LABELS, f), "utf8").split(/\r?\n/)) {
      const m = /^(\w+):\s*(.*)$/.exec(line);
      if (m && !rest.length) head[m[1]] = m[2].trim(); else if (line.trim()) rest.push(line.trim());
    }
    return { id: head.id, date: head.date, url: head.url, items: rest.join(" ").split(/,\s*/).map(s => s.trim()).filter(Boolean) };
  });
}

function build() {
  const w = loadSite("data", "mapper", "bottles", "materials");
  const D = w.PP_DATA, M = w.PP_MAP, PHOTOS = w.PP_BOTTLES || {}, MAT = w.PP_MATERIALS;
  const groups = palateGroups();
  const groupOf = f => Object.keys(groups).find(g => groups[g].fams.includes(f)) || null;
  const byId = Object.fromEntries(D.PERFUMES.map(P => [P.id, P]));
  const lists = (text, sep) => { const parts = String(text || "").split("/"); return STAGES.map((s, i) => (parts[i] || "").split(sep).map(x => x.trim()).filter(x => x && x !== "–" && x !== "-")); };
  /* a perfume's listed notes by stage, each with its Arabic, strongest family and that family's palate group */
  const noteRows = P => {
    const en = lists(P.notes && P.notes.en, ","), ar = lists(P.notes && P.notes.ar, /[،,]/);
    const notes = {};
    STAGES.forEach((s, i) => {
      notes[s] = en[i].map((word, k) => {
        const fams = M.famsForNote(word) || {};
        const top = Object.entries(fams).sort((a, b) => b[1] - a[1])[0];
        return { en: word, ar: en[i].length === ar[i].length ? ar[i][k] : null, f: top ? top[0] : null, g: top ? groupOf(top[0]) : null };
      });
    });
    return notes;
  };
  const carries = (P, f) => STAGES.some(s => ((P.stages[s] || {})[f] || 0) >= 0.4);

  const sprays = D.QUIZ.grid.map(id => {
    const P = byId[id]; if (!P) throw new Error("QUIZ.grid names an unknown perfume: " + id);
    const stages = {};
    for (const s of STAGES) stages[s] = Object.entries(P.stages[s] || {}).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 4);
    return { id, name: P.name, ar: P.ar || "", house: P.house, gender: P.gender, photo: PHOTOS[id] || "", notes: noteRows(P), stages };
  });

  const families = {};
  for (const [f, v] of Object.entries(D.FAMILIES)) {
    const count = D.PERFUMES.filter(P => carries(P, f)).length;
    families[f] = { en: v.en, ar: v.ar, hint_en: v.hint_en || "", hint_ar: v.hint_ar || "", group: groupOf(f), count };
  }
  for (const f of LIKED.concat(PAIR)) if (!families[f]) throw new Error("not a family: " + f);

  /* step 3: a material the labels name, and whether the note lists name it (its INCI name or any alias) */
  const namesOf = inci => { const m = MAT.MATERIALS.find(x => x.inci === inci); return m ? [inci].concat(m.aliases || []) : null; };
  const lists_name = (P, inci) => { const names = namesOf(inci), text = String(P.notes && P.notes.en || "").toLowerCase(); return !!names && names.some(n => new RegExp("(^|[^a-z])" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z])").test(text)); };
  const labels = readLabels();
  for (const L of labels) if (!byId[L.id]) throw new Error("a label names a perfume not in the catalogue: " + L.id);
  const E = byId[EXAMPLE], EL = labels.find(L => L.id === EXAMPLE);
  if (!E || !EL) throw new Error("the example perfume needs a catalogue entry and a label: " + EXAMPLE);
  const example = {
    id: EXAMPLE, name: E.name, ar: E.ar || "", house: E.house, photo: PHOTOS[EXAMPLE] || "", notes: noteRows(E), date: EL.date, url: EL.url,
    /* the first ingredients as printed; a scent material the note list does not name is marked hidden */
    label: EL.items.slice(0, TOP).map(raw => {
      const inci = MAT.norm ? MAT.norm(raw) : raw.toLowerCase();
      const scent = !MAT.IGNORE.some(re => re.test(inci));
      return { raw, inci, hidden: scent && !!namesOf(inci) && !lists_name(E, inci) };
    })
  };
  const isoTop = labels.filter(L => L.items.slice(0, TOP).some(x => x.toLowerCase() === ISO));

  const facts = {
    liked: { fams: LIKED, any: D.PERFUMES.filter(P => LIKED.some(f => carries(P, f))).length },
    pair: { like: PAIR[0], dis: PAIR[1], both: D.PERFUMES.filter(P => carries(P, PAIR[0]) && carries(P, PAIR[1])).length },
    labels: { checked: labels.length, top: TOP, iso_top: isoTop.length, iso_listed: labels.filter(L => lists_name(byId[L.id], ISO)).length }
  };

  const data = { total: D.PERFUMES.length, groups: Object.fromEntries(Object.entries(groups).map(([g, v]) => [g, { color: v.color }])), families, sprays, example, facts };
  const text = `/* Generated by tools/build_landing.js from data.js, mapper.js, bottles.js, materials.js, the palate groups in quiz.js
   and the ingredient labels in evidence/labels/. Do not edit by hand: rerun the tool. What the front page (index.html)
   shows of the catalogue. */
window.PP_LANDING_DATA = ${JSON.stringify(data)};
`;
  return { text, sprays: sprays.length, families: Object.keys(families).length, facts };
}

if (require.main === module) {
  const r = build();
  fs.writeFileSync(OUT, r.text);
  console.log(`site/js/landing-data.js written: ${r.sprays} bottles, ${r.families} families, ${Buffer.byteLength(r.text)} bytes`);
  console.log(JSON.stringify(r.facts));
}

module.exports = { build, OUT };
