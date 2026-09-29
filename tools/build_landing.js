#!/usr/bin/env node
/* Builds site/js/landing-data.js, the catalogue facts the front page (index.html) shows, so that page need not load
   the whole catalogue:
     - the twenty quiz bottles (QUIZ.grid), each with its name, house, photo, listed notes by stage in both languages
       (a note keeps its Arabic only when that stage's two lists line up, as notes.js does), the family each note maps
       to most strongly (mapper.js) and that family's palate group, and its three stages of families;
     - every family's names, one-line description, palate group and how many catalogue perfumes hold it at 0.4 or
       more in some stage (the engine's threshold for a family a perfume clearly carries);
     - the nine palate groups with their colours, read from site/js/quiz.js (ARCH), and the catalogue's size;
     - for the 1,000-perfume test, the families a visitor can say they like and the ones they can say they cannot
       stand, and for every catalogue perfume one number whose bits say which liked families it clearly carries and
       which disliked families would rule it out (the engine's own ruledOut, so the test counts as the quiz does);
     - from the ingredient labels in evidence/labels/, one perfume's label beside its note list, and how many of the
       labels name Iso E Super among their first five ingredients while no note list names it;
     - an example result: what the quiz itself shows a visitor who answers as VISITOR says, run in the stub browser of
       tests/lib/dom.js (the palate's name and emblem, the deal-breaker, the count ruled out and the three picks).
   Run after any change to data.js, mapper.js, bottles.js, materials.js, engine.js, notes.js, quiz.js or the labels;
   tests/landing.test.js fails while the file is out of date. */

const fs = require("fs");
const path = require("path");
const { ROOT, SITE, loadSite } = require("./lib/site");
const OUT = path.join(SITE, "js", "landing-data.js");
const LABELS = path.join(ROOT, "evidence", "labels");
const STAGES = ["opening", "heart", "drydown"];
/* the 1,000-perfume test: smells most people like, and smells that often divide people */
const LIKES = ["rose", "white_floral", "citrus_fresh", "spicy_warm", "sandalwood_creamy", "vanilla_gourmand", "amber_resin"];
const DISLIKES = ["woody_amber", "white_musk", "patchouli", "cedar_dry", "leather_smoky", "oud_smoky", "iris_powdery", "incense_resin"];
/* the perfume whose ingredient label is set beside its note list, and the material counted across the labels */
const EXAMPLE = "pegasus";
const ISO = "tetramethyl acetyloctahydronaphthalenes";
const TOP = 5;
/* the example result's visitor: still uses two bottles, and two turned on them hours later; every other answer is
   left as it comes (no narrowing, no notes, taste and complaints not sure, the musk heard) */
const VISITOR = { still: ["yara", "goodgirl"], turned: ["sauvageedp", "hawas"] };

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

/* The quiz run for VISITOR in one language, read from the result screen it writes. */
function quizResult(lang, byId) {
  const { createPage } = require("../tests/lib/dom");
  const scripts = [...fs.readFileSync(path.join(SITE, "quiz.html"), "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
  const page = createPage({ localStorage: { pp_device: JSON.stringify("d_example"), pp_lang: JSON.stringify(lang) } });
  page.load(scripts);
  const html = () => page.snapshot().els.quiz.innerHTML;
  const fail = what => { throw new Error(`the example visitor's quiz run (${lang}) stopped at ${what}`); };
  const all = VISITOR.still.concat(VISITOR.turned);
  page.click({ dataset: { start: "1" } });
  for (const id of all) page.click({ dataset: { tile: id } });
  page.click({ dataset: { continue: "1" } });
  /* the bottles come in the grid's order: each screen is known by the name in its heading */
  const esc = x => String(x).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  for (let k = 0; k < all.length; k++) {
    const name = (/<h1 class="qname">([^<]*)<\/h1>/.exec(html()) || [])[1];
    const id = all.find(x => name === esc(lang === "ar" && byId[x].ar ? byId[x].ar : byId[x].name));
    if (!id) fail("bottle screen " + (k + 1));
    page.click({ dataset: { verdict: VISITOR.still.includes(id) ? "still" : "turned" } });
    if (!VISITOR.still.includes(id)) page.click({ dataset: { when: "drydown" } });
    page.click({ dataset: { continue: "1" } });
    if (/data-nskip="1"/.test(html())) page.click({ dataset: { continue: "1" } });
  }
  if (/data-skip="1"/.test(html())) page.click({ dataset: { skip: "1" } });
  for (let i = 0; i < 40 && /data-pn=/.test(html()); i++) page.click({ dataset: { continue: "1" } });
  page.click({ dataset: { taste: "unsure" } });
  page.click({ dataset: { told: "unsure" } });
  page.click({ dataset: { continue: "1" } });
  page.click({ dataset: { anosmia: "no" } });
  const h = html(), one = (re, what) => { const m = re.exec(h); if (!m) fail(what); return m[1]; };
  /* names are read from the page's markup: undo its escaping, since the front page escapes them again */
  const unesc = x => x.replace(/&(amp|lt|gt|quot|#39);/g, (m, k) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[k]));
  const bad = one(/<div class="qtaste-row bad">([^]*?)<\/div><\/div>/, "the deal-breaker");
  return {
    palate: unesc(one(/<div class="qname-t"><p class="eyebrow">[^<]*<\/p><h1>([^<]+)<\/h1>/, "the palate's name")),
    emblem: one(/(<svg class="qemblem"[^]*?<\/svg>)/, "the emblem").replace(/ width="\d+" height="\d+"/, ""),
    breakers: [...bad.matchAll(/<span class="qchip bad">([^<]+)<\/span>/g)].map(m => unesc(m[1])),
    out: +one(/<div class="qfun out"><span class="sr">(\d+) /, "the count ruled out"),
    picks: [...new Set([...h.matchAll(/data-event="sample:([^"]+)"/g)].map(m => m[1]))]
  };
}

function build() {
  const w = loadSite("data", "mapper", "bottles", "materials", "evidence", "engine");
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
  const TEST = LIKES.concat(DISLIKES);
  for (const f of TEST) if (!families[f]) throw new Error("not a family: " + f);

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
    labels: { checked: labels.length, top: TOP, iso_top: isoTop.length, iso_listed: labels.filter(L => lists_name(byId[L.id], ISO)).length }
  };
  /* bit i of a perfume's number: it clearly carries the liked family TEST[i], or, for a disliked family, the quiz would
     rule it out if that family were the visitor's deal-breaker */
  const ENG = w.PP_ENGINE.create(D, M, w.PP_EVIDENCE);
  const outBy = Object.fromEntries(DISLIKES.map(f => [f, new Set(ENG.ruledOut({ [f]: { cls: "badLikely" } }))]));
  const hit = (P, f) => (outBy[f] ? outBy[f].has(P.id) : carries(P, f));
  const test = { likes: LIKES, dislikes: DISLIKES, masks: D.PERFUMES.map(P => TEST.reduce((m, f, i) => (hit(P, f) ? m | (1 << i) : m), 0)) };

  /* the example result, in both languages; the bottles it names come with their names and photos */
  const en = quizResult("en", byId), ar = quizResult("ar", byId);
  if (en.emblem !== ar.emblem || en.out !== ar.out || en.picks.join() !== ar.picks.join() || en.breakers.length !== ar.breakers.length) throw new Error("the example result differs between the two languages");
  if (en.picks.length !== 3 || !en.breakers.length) throw new Error("the example result needs a deal-breaker and three picks");
  const bottle = id => { const P = byId[id]; return { id, name: P.name, ar: P.ar || "", house: P.house, photo: PHOTOS[id] || "" }; };
  const result = {
    still: VISITOR.still.map(bottle), turned: VISITOR.turned.map(bottle),
    palate: { en: en.palate, ar: ar.palate }, emblem: en.emblem,
    breakers: en.breakers.map((x, i) => ({ en: x, ar: ar.breakers[i] })), out: en.out, picks: en.picks.map(bottle)
  };

  const data = { total: D.PERFUMES.length, groups: Object.fromEntries(Object.entries(groups).map(([g, v]) => [g, { color: v.color }])), families, sprays, example, facts, test, result };
  const text = `/* Generated by tools/build_landing.js from data.js, mapper.js, bottles.js, materials.js, the palate groups in quiz.js,
   the ingredient labels in evidence/labels/ and a run of the quiz. Do not edit by hand: rerun the tool. What the front
   page (index.html) shows of the catalogue. */
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
