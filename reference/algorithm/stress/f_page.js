/* Angle 7: what the result page says, read from the real quiz page (tests/lib/dom.js stub browser), against the
   wearer's hidden taste: the palate name, the "drawn to" and deal-breaker chips, the pick cards' lines, contradictions
   a reader can see, the same result in Arabic and English, and the palate on a retest (same bottles, same history,
   answered twice). Usage: node f_page.js [wearers] [seed]. Writes out/f.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 1500), SEED = +(process.argv[3] || 61);
const ROOT = L.ROOT, SITE = path.join(ROOT, "site");
const { createPage } = require(path.join(ROOT, "tests", "lib", "dom"));
const scripts = [...fs.readFileSync(path.join(SITE, "quiz.html"), "utf8").matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map(m => ({ filename: m[1], code: fs.readFileSync(path.join(SITE, m[1]), "utf8") }));
const ctx = L.site(), { D } = ctx;
const GROUPS = L.palateGroups(), groupOf = f => Object.keys(GROUPS).find(g => GROUPS[g].includes(f));
const short = f => D.FAMILIES[f].en.replace(/\s*\([^)]*\)\s*/g, " ").trim();
const byShort = {}; for (const f of Object.keys(D.FAMILIES)) byShort[short(f)] = f;
const byFull = {}; for (const f of Object.keys(D.FAMILIES)) byFull[D.FAMILIES[f].en] = f;
const strip = s => s.replace(/<svg[^]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

function page(ratings, quiz, lang) {
  const answers = Object.assign({ taste: "unsure", told: [], anosmia: "no" }, quiz);
  const p = createPage({ localStorage: { pp_device: JSON.stringify("d"), pp_lang: JSON.stringify(lang || "en"), pp_ratings_v1: JSON.stringify(ratings), pp_quiz_v1: JSON.stringify(answers) } });
  p.load(scripts);
  const html = () => p.snapshot().els.quiz.innerHTML;
  p.click({ dataset: { start: "1" } });
  p.click({ dataset: { none: "1" } });
  for (let i = 0; i < 6 && /data-pn=/.test(html()); i++) p.click({ dataset: { continue: "1" } });
  p.click({ dataset: { taste: answers.taste } });
  p.click({ dataset: { continue: "1" } });
  p.click({ dataset: { anosmia: answers.anosmia } });
  return html();
}
function read(h) {
  const chips = kind => [...((new RegExp(`<div class="qtaste-row ${kind}">([^]*?)</div></div>`).exec(h) || ["", ""])[1]).matchAll(new RegExp(`<span class="qchip ${kind}">([^<]*)</span>`, "g"))].map(m => byShort[m[1].trim()]).filter(Boolean);
  const picks = [...h.matchAll(/<div class="rec qpick">([^]*?)<div class="qpick-links">([^]*?)<\/div><\/div>/g)].map(m => ({
    id: (/data-event="sample:([^"]+)"/.exec(m[2]) || [])[1], why: [...m[1].matchAll(/<div class="why">([^<]*)<\/div>/g)].map(x => x[1]), risk: [...m[1].matchAll(/<div class="risk">([^<]*)<\/div>/g)].map(x => x[1]) }));
  const cards = [...h.matchAll(/<div class="verdict ([\w-]+)"><div class="v-head"><b>([^<]*)<\/b>[^]*?<\/div>((?:<div class="hint[^"]*">[^<]*<\/div>)*)<\/div>/g)]
    .map(m => ({ cls: m[1], f: byFull[m[2].replace(/&amp;/g, "&")], lines: [...m[3].matchAll(/<div class="hint[^"]*">([^<]*)<\/div>/g)].map(x => x[1]) }));
  return { palate: (/id="qe-([\w-]+)"/.exec(h) || [])[1] || null, good: chips("good"), bad: chips("bad"), picks, cards };
}

const acc = { n: 0, named: 0, lead: 0, anyGroup: 0, wrongGroup: 0, special: {}, constant: {}, constantAny: {}, conf: {}, good: [], goodSoft: [], bad: [], freeWatch: 0, freeWatchEx: [], lovedBad: 0, lovedBadEx: [], picksN: 0 };
const r = L.rng(SEED);
for (let i = 0; i < N_PER; i++) {
  const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 3), r, { notes: 0.6, told: true });
  const out = read(page(ses.ratings, ses.quiz, "en"));
  acc.n++;
  /* the palate against the wearer's strongest like */
  const lead = groupOf(per.like.slice().sort((a, b) => per.u[b] - per.u[a])[0]), likedGroups = new Set(per.like.map(groupOf));
  const named = out.palate ? out.palate.split("-") : [];
  const special = !out.palate ? "none" : ["wide", "selective"].includes(out.palate) ? out.palate : null;
  if (special) acc.special[special] = (acc.special[special] || 0) + 1;
  else {
    acc.named++;
    if (named[0] === lead) acc.lead++;
    if (named.some(g => likedGroups.has(g))) acc.anyGroup++; else acc.wrongGroup++;
    for (const g of Object.keys(GROUPS)) { acc.constant[g] = (acc.constant[g] || 0) + (g === lead ? 1 : 0); acc.constantAny[g] = (acc.constantAny[g] || 0) + (likedGroups.has(g) ? 1 : 0); }
  }
  const row = acc.conf[lead] = acc.conf[lead] || {}; const key = special || named[0]; row[key] = (row[key] || 0) + 1;
  if (out.good.length) { acc.good.push(out.good.filter(f => per.like.includes(f)).length / out.good.length); acc.goodSoft.push(out.good.filter(f => per.u[f] >= 0.5).length / out.good.length); }
  if (out.bad.length) acc.bad.push(out.bad.filter(f => per.bad.includes(f)).length / out.bad.length);
  /* a pick card that says "Free of X" and warns about X */
  for (const p of out.picks) {
    acc.picksN++;
    for (const w of p.why) { const m = /^Free of (.*)\.$/.exec(w); if (!m) continue; for (const x of m[1].split(/, | and /)) if (p.risk.some(t => t.toLowerCase().includes(x.toLowerCase()))) { acc.freeWatch++; if (acc.freeWatchEx.length < 3) acc.freeWatchEx.push(`${p.id}: "${w}" / "${p.risk[0]}"`); } }
  }
  /* a deal-breaker card that lists a note the wearer loved or liked; "same bottle" when a bottle with that liked note
     still gives the family negative evidence, otherwise "another bottle" (the liked bottle counts for it) */
  for (const c of out.cards) if (/^bad/.test(c.cls) && c.lines.some(l => / you (loved|liked) the /.test(l))) {
    acc.lovedBad++;
    const prof = L.run(ctx, ses).prof, liked = Object.keys(ses.ratings).filter(id => ((ses.ratings[id].noteAnswers || {})[c.f] || 0) > 0);
    const same = liked.some(id => (prof[c.f].evidence || []).some(e => e.perfume && e.perfume.id === id && e.value < 0));
    acc[same ? "lovedBadSame" : "lovedBadOther"] = (acc[same ? "lovedBadSame" : "lovedBadOther"] || 0) + 1;
    if (acc.lovedBadEx.length < 3) acc.lovedBadEx.push(`${c.f} (${c.cls}, ${same ? "same bottle" : "another bottle"}): ${c.lines.join(" | ")}`);
  }
}
/* the same result in Arabic and English */
const par = { n: 0, palate: 0, picks: 0, ex: [] };
const r2 = L.rng(SEED + 1);
for (let i = 0; i < Math.round(N_PER / 5); i++) {
  const per = L.persona(r2, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r2, 3), r2, { notes: 0.6, told: true });
  const en = read(page(ses.ratings, ses.quiz, "en")), ar = read(page(ses.ratings, ses.quiz, "ar"));
  par.n++; if (en.palate === ar.palate) par.palate++; if (en.picks.map(p => p.id).join() === ar.picks.map(p => p.id).join()) par.picks++;
  else if (par.ex.length < 3) par.ex.push(`${en.picks.map(p => p.id)} / ${ar.picks.map(p => p.id)}`);
}
/* the palate on a retest */
const ret = { n: 0, same: 0, bothNamed: 0, sameNamed: 0 };
const r3 = L.rng(SEED + 2);
for (let i = 0; i < Math.round(N_PER / 3); i++) {
  const per = L.persona(r3, ctx);
  const list = L.bottles(ctx, per, r3, 3).map(b => Object.assign(b, { fixed: b.kind === "shop" ? L.shopTrial(ctx.TRUTH[b.id], per, r3) : L.wear(ctx.TRUTH[b.id], per, r3) }));
  const known = new Set(ctx.CARDS.filter(() => r3() < 0.5).map(c => c.id));
  const a = read(page(...Object.values((s => ({ r: s.ratings, q: s.quiz }))(L.answer(ctx, per, list, r3, { notes: 0.6, told: true, known }))), "en"));
  const b = read(page(...Object.values((s => ({ r: s.ratings, q: s.quiz }))(L.answer(ctx, per, list, r3, { notes: 0.6, told: true, known }))), "en"));
  ret.n++; if (a.palate === b.palate) ret.same++;
  if (a.palate && b.palate) { ret.bothNamed++; if (a.palate === b.palate) ret.sameNamed++; }
}
/* a fixed case for the record: vanilla liked on Supremacy Noir (which turned in its heart), and Yara turned in its base */
const caseA = { supremacynoir: { opening: null, heart: -2, drydown: null, again: 0, chips: {}, src: "quiz", noteAnswers: { vanilla_gourmand: 1 } }, yara: { opening: null, heart: null, drydown: -2, again: 0, chips: {}, src: "quiz" } };
const fixed = read(page(caseA, {}, "en")).cards.filter(c => c.f === "vanilla_gourmand");

const res = { wearers: acc.n, palateNamed: acc.named / acc.n, special: acc.special, leadRight: acc.lead / acc.named, anyLikedGroup: acc.anyGroup / acc.named, noLikedGroup: acc.wrongGroup / acc.named,
  constantBest: Math.max(...Object.values(acc.constant)) / acc.named, constantGroup: Object.entries(acc.constant).sort((a, b) => b[1] - a[1])[0][0],
  constantAnyBest: Math.max(...Object.values(acc.constantAny)) / acc.named, constantAnyGroup: Object.entries(acc.constantAny).sort((a, b) => b[1] - a[1])[0][0], confusion: acc.conf,
  goodChipsTrue: L.mean(acc.good), goodChipsMild: L.mean(acc.goodSoft), badChipsTrue: L.mean(acc.bad), freeWatch: acc.freeWatch, picks: acc.picksN, freeWatchEx: acc.freeWatchEx,
  lovedBad: acc.lovedBad, lovedBadSame: acc.lovedBadSame || 0, lovedBadOther: acc.lovedBadOther || 0, lovedBadEx: acc.lovedBadEx, parity: par, retest: ret, fixedCase: fixed };
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "f.json"), JSON.stringify(res, null, 1));
const P = L.pct;
console.log(`${res.wearers} wearers (three bottles, note rows and told answers), run through the real quiz page\n`);
console.log(`Palate: a group palate is named for ${P(res.palateNamed)}; otherwise ${JSON.stringify(res.special)}.`);
console.log(`  Of the group palates, the lead group is the wearer's strongest like for ${P(res.leadRight)}; it includes any liked group for ${P(res.anyLikedGroup)}; it names no group the wearer likes for ${P(res.noLikedGroup)}.`);
console.log(`  Naming every wearer "${res.constantGroup}" would match the strongest like for ${P(res.constantBest)}; naming every wearer "${res.constantAnyGroup}" would name a liked group for ${P(res.constantAnyBest)}.`);
console.log("  The wearer's strongest like (rows) against the palate named (lead group, or wide / selective / none):");
const cols = ["woody", "sweet", "musk", "amber", "oud", "fresh", "floral", "rose", "spiced", "wide", "selective", "none"];
console.log(L.table(Object.entries(res.confusion).sort().map(([g, row]) => Object.assign({ "true like": g, n: Object.values(row).reduce((a, b) => a + b, 0) }, Object.fromEntries(cols.map(c => [c, row[c] ? P(row[c] / Object.values(row).reduce((a, b) => a + b, 0)) : ""])))), ["true like", "n", ...cols]));
console.log(`\n"Drawn to" chips that are true likes: ${P(res.goodChipsTrue)} (liked at least mildly: ${P(res.goodChipsMild)}); deal-breaker chips that are true: ${P(res.badChipsTrue)}.`);
console.log(`Pick cards saying "Free of X" and warning about X: ${res.freeWatch} of ${res.picks} cards. ${res.freeWatchEx.join(" ; ")}`);
console.log(`Deal-breaker cards (How we worked this out) listing a note the wearer loved or liked: ${res.lovedBad} of ${res.wearers} results (${res.lovedBadSame} through the same bottle, ${res.lovedBadOther} through another). ${res.lovedBadEx.join(" ; ")}`);
console.log(`Arabic and English: same palate ${res.parity.palate} of ${res.parity.n}, same picks ${res.parity.picks} of ${res.parity.n}. ${res.parity.ex.join(" ; ")}`);
console.log(`Retest (same bottles and history, answered twice): same palate ${P(res.retest.same / res.retest.n)}; when both name one, the same ${P(res.retest.sameNamed / res.retest.bothNamed)}.`);
console.log(`Fixed case, vanilla liked on Supremacy Noir, Yara turned: ${JSON.stringify(res.fixedCase)}`);
