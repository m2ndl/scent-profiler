/* Angle 3: the catalogue's tags, which every result rests on. No person tagged any perfume. The 286 older entries carry
   judgement tags (an earlier Claude session read each note list and description and set the weights; about 40 were
   later corrected against two books); the other 714 were tagged by mapper.js from their note lists (the 26 Sep 2026
   additions and the expansion). Clones copy their original's tags and are left out.
   1. The two methods on the same perfumes: mapper.js run on each judgement-tagged perfume's own note list (notes only,
      the aliases the expansion used), compared stage by stage. Neither is the truth; this measures how far they differ.
   2. Both against an independent human source: Fragrantica's crowd-voted main accords (cached pages in
      reference/expansion/cache/perfumes/), read through mapper.js's own accord table. For the judgement-tagged perfumes
      with a cached page, both their judgement tags and the mapper's tags for the same perfumes are scored; the 667
      expansion perfumes are scored as shipped.
   3. What the disagreement costs: on the judgement-tagged perfumes only, wearers smell one tag set while the engine
      works from the other, both ways round, against the engine working from the tags the wearers smell.
   Usage: node b_tags.js [wearers] [seed]. Writes out/b.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 1500), SEED = +(process.argv[3] || 41), K = 30;
const ROOT = L.ROOT, S = L.STAGES;
const base = L.site(), { M, D } = base;
const GROUPS = L.palateGroups(), groupOf = f => Object.keys(GROUPS).find(g => GROUPS[g].includes(f));
const famName = f => D.FAMILIES[f].en.replace(/\s*\([^)]*\)/g, "");

/* which block each entry sits in: the two 26 Sep blocks and two 25 Sep entries were tagged by the mapper */
const src = fs.readFileSync(path.join(ROOT, "site", "js", "data.js"), "utf8");
const cut1 = src.indexOf("added 26 Sep 2026: the best-selling"), cut2 = src.indexOf("added 26 Sep 2026 (the expansion to 1,000)");
const idsIn = (a, b) => new Set([...src.slice(a, b).matchAll(/^\s*p\("([^"]+)"/gm)].map(m => m[1]));
const MAPPED = new Set([...idsIn(cut1, src.length), "diorhomme2020", "paradigme"]);
const EXPANSION = idsIn(cut2, src.length);
const JUDGED = D.PERFUMES.filter(p => !MAPPED.has(p.id) && !p.cloneOf).map(p => p.id);

/* mapper.js on an entry's own note list, as reference/expansion/gen.js wrote the expansion (notes only, with its aliases) */
const DEC = JSON.parse(fs.readFileSync(path.join(ROOT, "reference", "expansion", "decisions.json"), "utf8"));
const ALIAS = Object.assign({ vanille: "vanilla", citruses: "citrus", bellini: "peach", persimmon: "peach", cactus: "green notes", "red currant leaf": "blackcurrant leaf",
  "passion flower": "white flowers", "african orange flower": "orange blossom", maninka: "peach", "brazilian redwood": "cedar", "ambrette (musk mallow)": "ambrette",
  cardamon: "cardamom", "rooibos tea": "tea" }, DEC.mapalias || {});
function mapped(p) {
  const ls = base.W.PP_NOTES.stageLists(p.notes.en, ",");
  const al = list => list.map(w => ALIAS[w.toLowerCase()] || w);
  const m = M.mapNotes({ top: al(ls.opening), middle: al(ls.heart), base: al(ls.drydown) });
  return { stages: m.stages, unmatched: m.unmatched };
}

/* ---------- 1. the two methods on the same perfumes ---------- */
const one = { perStage: {}, bias: {}, unmatched: 0, words: 0, examples: [] };
for (const s of S) one.perStage[s] = { prec: [], rec: [], top: [], mae: [] };
for (const id of JUDGED) {
  const p = D.PERFUMES.find(x => x.id === id), m = mapped(p);
  one.unmatched += m.unmatched.length; one.words += S.reduce((n, s) => n + base.W.PP_NOTES.stageLists(p.notes.en, ",")[s].length, 0);
  let diff = null;
  for (const s of S) {
    const h = p.stages[s] || {}, q = m.stages[s] || {};
    const H = Object.keys(h).filter(f => h[f] >= 0.4), Q = Object.keys(q).filter(f => q[f] >= 0.4);
    if (Q.length) one.perStage[s].prec.push(Q.filter(f => H.includes(f)).length / Q.length);
    if (H.length) one.perStage[s].rec.push(H.filter(f => Q.includes(f)).length / H.length);
    const th = Object.entries(h).sort((a, b) => b[1] - a[1])[0], tq = Object.entries(q).sort((a, b) => b[1] - a[1])[0];
    if (th) one.perStage[s].top.push(tq && tq[0] === th[0] ? 1 : 0);
    const U = [...new Set([...Object.keys(h), ...Object.keys(q)])];
    if (U.length) one.perStage[s].mae.push(L.mean(U.map(f => Math.abs((h[f] || 0) - (q[f] || 0)))));
    for (const f of U) { const b = one.bias[f] = one.bias[f] || { over: 0, under: 0, n: 0 }; const d = (q[f] || 0) - (h[f] || 0); if (d >= 0.3) b.over++; if (d <= -0.3) b.under++; b.n++; }
    if (s === "drydown" && th && (!tq || tq[0] !== th[0])) diff = `${p.name}: base, judgement ${JSON.stringify(h)}; mapper ${JSON.stringify(q)} (listed base notes: ${p.notes.en.split("/")[2].trim()})`;
  }
  if (diff && one.examples.length < 8) one.examples.push(diff);
}

/* ---------- 2. both against the crowd's accords ---------- */
const cacheDir = path.join(ROOT, "reference", "expansion", "cache", "perfumes");
const byFid = new Map(fs.existsSync(cacheDir) ? fs.readdirSync(cacheDir).map(f => [+(/_(\d+)\.html\.json$/.exec(f) || [])[1], f]) : []);
const accordsOf = fid => (byFid.has(fid) ? JSON.parse(fs.readFileSync(path.join(cacheDir, byFid.get(fid)), "utf8")).accords || [] : []);
const famsOf = a => Object.keys(M.ACCORDS[M.norm(a)] || {});
/* one perfume's tags against its accords: strict by family, lenient by palate group (a "woody" vote is met by any wood) */
function score(stages, acc) {
  const first = acc.find(a => famsOf(a).length); if (!first) return null;
  const tagged = new Set(S.flatMap(s => Object.entries(stages[s] || {}).filter(([, w]) => w >= 0.3).map(([f]) => f)));
  const tgGroups = new Set([...tagged].map(groupOf));
  const top6 = new Set(acc.slice(0, 6).flatMap(famsOf)), top6g = new Set([...top6].map(groupOf));
  const bt = Object.entries(stages.drydown || {}).sort((a, b) => b[1] - a[1])[0];
  const strong = [...new Set(["heart", "drydown"].flatMap(s => Object.entries(stages[s] || {}).filter(([, w]) => w >= 0.5).map(([f]) => f)))];
  return { firstMissing: !famsOf(first).some(f => tagged.has(f)), firstMissingGroup: !famsOf(first).some(f => tgGroups.has(groupOf(f))),
    baseUnbacked: !!bt && !top6.has(bt[0]), baseUnbackedGroup: !!bt && !top6g.has(groupOf(bt[0])),
    strongBacked: strong.length ? strong.filter(f => top6.has(f)).length / strong.length : null, first, top: acc.slice(0, 6), base: stages.drydown };
}
const ids = JSON.parse(fs.readFileSync(path.join(ROOT, "reference", "images", "fragrantica_ids.json"), "utf8"));
const resolved = JSON.parse(fs.readFileSync(path.join(ROOT, "reference", "expansion", "resolved.json"), "utf8")).catalogue;
const rec = JSON.parse(fs.readFileSync(path.join(ROOT, "reference", "expansion", "record.json"), "utf8"));
const two = { judgement: [], mapperSame: [], expansion: [], examples: [] };
for (const id of JUDGED) {
  const acc = accordsOf((ids[id] && ids[id].fid) || resolved[id]); if (!acc.length) continue;
  const p = D.PERFUMES.find(x => x.id === id);
  const a = score(p.stages, acc), b = score(mapped(p).stages, acc); if (!a || !b) continue;
  two.judgement.push(a); two.mapperSame.push(b);
  if ((a.baseUnbackedGroup || b.baseUnbackedGroup) && two.examples.length < 8) two.examples.push(`${p.house} ${p.name}: accords ${a.top.join(", ")} | judgement base ${JSON.stringify(a.base)} | mapper base ${JSON.stringify(b.base)}`);
}
two.expansionExamples = [];
for (const id of EXPANSION) {
  const r = rec[id]; if (!r) continue; const acc = accordsOf(r.fid); if (!acc.length) continue;
  const P = base.E.byId[id], s = score(P.stages, acc); if (!s) continue;
  two.expansion.push(s);
  if (s.baseUnbackedGroup && two.expansionExamples.length < 6) two.expansionExamples.push(`${P.house} ${P.name}: accords ${s.top.join(", ")} | base ${JSON.stringify(s.base)}`);
}
/* how crowded the bases are: families at 0.4 or more in the base, judgement-tagged against mapper-tagged entries as shipped */
const crowd = ids => L.mean(ids.map(id => Object.values(base.E.byId[id].stages.drydown || {}).filter(w => w >= 0.4).length));
const judgedAll = D.PERFUMES.filter(p => !MAPPED.has(p.id)).map(p => p.id), mappedAll = D.PERFUMES.filter(p => MAPPED.has(p.id)).map(p => p.id);
const crowding = { judgement: crowd(judgedAll), mapper: crowd(mappedAll) };
const sum = list => ({ n: list.length, firstMissing: L.mean(list.map(x => x.firstMissing ? 1 : 0)), firstMissingGroup: L.mean(list.map(x => x.firstMissingGroup ? 1 : 0)),
  baseUnbacked: L.mean(list.map(x => x.baseUnbacked ? 1 : 0)), baseUnbackedGroup: L.mean(list.map(x => x.baseUnbackedGroup ? 1 : 0)), strongBacked: L.mean(list.map(x => x.strongBacked).filter(v => v != null)) });
const twoSum = { judgement: sum(two.judgement), mapperSame: sum(two.mapperSame), expansion: sum(two.expansion) };

/* ---------- 3. what the disagreement costs ---------- */
const judgedOnly = P => P.filter(p => JUDGED.includes(p.id));
const judgCtx = L.site({ perfumes: judgedOnly });
const mapStages = Object.fromEntries(JUDGED.map(id => [id, mapped(D.PERFUMES.find(x => x.id === id)).stages]));
const mapCtx = L.site({ perfumes: P => judgedOnly(P).map(p => Object.assign({}, p, { stages: mapStages[p.id] })) });
const cross = (engineCtx, truthCtx) => L.site({ perfumes: P => judgedOnly(P).map(p => engineCtx === "map" ? Object.assign({}, p, { stages: mapStages[p.id] }) : p), truth: truthCtx.E.byId });
function evaluate(ctx, seed) {
  const rp = L.rng(seed), ra = L.rng(seed + 1), re = L.rng(seed + 2);
  const acc = { keep: [], turn: [], prec: [], likes: [], top: [] };
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(rp, ctx), list = L.bottles(ctx, per, rp, 3);
    const ses = L.answer(ctx, per, list, ra, { notes: 0.6, told: true, unsureWhen: 0.25 });
    const res = L.run(ctx, ses);
    const fb = L.classOf(res.prof, ["badLikely", "badPossible"]), fg = L.classOf(res.prof, ["goodLikely", "goodPossible"]);
    if (fb.length) { acc.prec.push(fb.filter(f => per.bad.includes(f)).length / fb.length); acc.top.push(per.bad.includes(L.byStrength(res.prof, ["badLikely", "badPossible"])[0]) ? 1 : 0); }
    if (fg.length) acc.likes.push(fg.filter(f => per.like.includes(f)).length / fg.length);
    if (res.picks.length) { const oc = res.picks.map(id => L.outcome(ctx.TRUTH[id], per, re, K)); acc.keep.push(L.mean(oc.map(x => x.keep))); acc.turn.push(L.mean(oc.map(x => x.turn))); }
  }
  return { keep: L.mean(acc.keep), turn: L.mean(acc.turn), dbPrecision: L.mean(acc.prec), dbTopRight: L.mean(acc.top), likePrecision: L.mean(acc.likes) };
}
const three = {
  perfumes: JUDGED.length,
  "judgement / judgement": evaluate(judgCtx, SEED), "judgement / mapper": evaluate(cross("map", judgCtx), SEED),
  "mapper / mapper": evaluate(mapCtx, SEED), "mapper / judgement": evaluate(cross("judg", mapCtx), SEED)
};

const out = { judged: JUDGED.length, one, two: twoSum, twoExamples: two.examples, expansionExamples: two.expansionExamples, crowding, three };
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "b.json"), JSON.stringify(out, null, 1));
const P = L.pct;
console.log(`1. The two methods on the same ${JUDGED.length} judgement-tagged perfumes (clones left out); ${one.unmatched} of ${one.words} note words unread by the mapper\n`);
console.log(L.table(S.map(s => ({ stage: s, "mapper families (0.4+) also in the judgement tags": P(L.mean(one.perStage[s].prec)), "judgement families (0.4+) the mapper also finds": P(L.mean(one.perStage[s].rec)),
  "same strongest family": P(L.mean(one.perStage[s].top)), "mean weight gap": L.f2(L.mean(one.perStage[s].mae)) })),
  ["stage", "mapper families (0.4+) also in the judgement tags", "judgement families (0.4+) the mapper also finds", "same strongest family", "mean weight gap"]));
console.log("\nFamilies the mapper most often puts 0.3 or more above / below the judgement tags (any stage):");
console.log(Object.entries(one.bias).map(([f, b]) => [f, b.over, b.under]).sort((a, b) => (b[1] + b[2]) - (a[1] + a[2])).slice(0, 10).map(([f, o, u]) => `  ${famName(f)}: above ${o}, below ${u}`).join("\n"));
console.log("\nBases whose strongest family differs:"); for (const e of one.examples) console.log("  " + e);
console.log("\n2. Against Fragrantica's crowd-voted accords (first accord: the first that names a family; lenient: any family of the same palate group counts)\n");
console.log(L.table([["judgement tags", twoSum.judgement], ["mapper tags, same perfumes", twoSum.mapperSame], ["mapper tags, the 667 expansion", twoSum.expansion]].map(([k, v]) => ({ tags: k, perfumes: v.n,
  "first accord missing": P(v.firstMissing), "first accord missing, lenient": P(v.firstMissingGroup), "strongest base family not in the first six accords": P(v.baseUnbacked),
  "strongest base family not backed, lenient": P(v.baseUnbackedGroup), "strong families (0.5+) backed by the first six accords": P(v.strongBacked) })),
  ["tags", "perfumes", "first accord missing", "first accord missing, lenient", "strongest base family not in the first six accords", "strongest base family not backed, lenient", "strong families (0.5+) backed by the first six accords"]));
for (const e of two.examples) console.log("  " + e);
console.log("  Expansion perfumes whose strongest base family no accord in the first six backs, even by palate group:");
for (const e of two.expansionExamples) console.log("    " + e);
console.log(`  Families at 0.4 or more in a base: ${crowding.judgement.toFixed(2)} for the judgement-tagged entries, ${crowding.mapper.toFixed(2)} for the mapper-tagged ones (all 1,000 as shipped).`);
console.log(`\n3. What the disagreement costs (${JUDGED.length} judgement-tagged perfumes; three bottles with note rows and told answers; ${N_PER} wearers)\n`);
console.log(L.table(Object.entries(three).filter(([k]) => k.includes("/")).map(([k, v]) => ({ "wearers smell / engine reads": k, "picks kept": P(v.keep), "picks that turn": P(v.turn),
  "flagged deal-breakers that are true": P(v.dbPrecision), "first deal-breaker true": P(v.dbTopRight), "likes that are true": P(v.likePrecision) })),
  ["wearers smell / engine reads", "picks kept", "picks that turn", "flagged deal-breakers that are true", "first deal-breaker true", "likes that are true"]));
