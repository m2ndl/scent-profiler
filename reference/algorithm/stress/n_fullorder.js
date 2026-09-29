/* How meaningful is the engine's order of the whole catalogue, beyond the three picks (FULLORDER.md)?
   The site's engine.js is run with one change, recommend() also returning its internal `scored` list (checked below to
   give the site's picks). Synthetic visitors of the stress apparatus (reference/algorithm/stress/lib.js); truth is the
   oracle's score in lib.js (no ruin, times the pleasure of heart and base). Nothing in site/ changes.
   Usage: node n_fullorder.js. Writes out/n.txt. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const SRC = fs.readFileSync(path.join(L.ROOT, "site", "js", "engine.js"), "utf8");
const OLD = "return { picks, badAny, likely, contradicted: veto.contradicted };";
if (SRC.split(OLD).length !== 2) throw new Error("anchor not found exactly once");
const PATCHED = SRC.replace(OLD, "return { picks, badAny, likely, contradicted: veto.contradicted, scored };");
const ctx = L.site({ engineSource: PATCHED }), site = L.site();
const K = 10;
const t0 = Date.now();
const out = [];
const log = s => { out.push(s); console.log(s); };

/* 0. the patched engine picks what the site picks */
{
  const r = L.rng(5); let same = 0; const n = 400;
  for (let i = 0; i < n; i++) {
    const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 3), r, { notes: 0.6, told: true });
    if (L.run(ctx, ses).picks.join() === L.run(site, ses).picks.join()) same++;
  }
  log(`patched engine gives the site's picks: ${same}/${n}`);
}

const sig = x => 1 / (1 + Math.exp(-x));
const truth = (per, id) => { const T = ctx.TRUTH[id]; return (1 - L.pRuinLater(T, per)) * sig(2 * (0.8 * L.hedonic(T.stages.heart, per.u) + L.hedonic(T.stages.drydown, per.u))); };
function hashSeed(...xs) { let h = 2166136261; for (const c of xs.join("|")) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const r9 = x => Math.round(x * 1e9) / 1e9;
function ranks(v) {
  const idx = v.map((_, i) => i).sort((a, b) => v[b] - v[a]), rk = new Array(v.length);
  for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && v[idx[j + 1]] === v[idx[i]]) j++; for (let k = i; k <= j; k++) rk[idx[k]] = (i + j) / 2 + 1; i = j + 1; }
  return rk;
}
function pearson(x, y) { const mx = L.mean(x), my = L.mean(y); let a = 0, b = 0, c = 0; for (let i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return a / Math.sqrt(b * c); }
const spearman = (x, y) => pearson(ranks(x), ranks(y));
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

/* a ranking that ignores the visitor: each perfume's mean truth over 3,000 visitors */
const GEN = {};
{
  const r = L.rng(777), pers = Array.from({ length: 3000 }, () => L.persona(r, ctx));
  for (const id of ctx.ALL) GEN[id] = L.mean(pers.map(p => truth(p, id)));
}

const BANDS = [[1, 3], [4, 10], [11, 30], [31, 100], [101, 300], [301, 1e9]];
const bandOf = rk => BANDS.findIndex(([a, b]) => rk >= a && rk <= b);
const GAPS = [[1, 24], [25, 99], [100, 299], [300, 1e9]];

function population(name, nb, o, seeds, nPer) {
  const acc = { rho: [], rhoGen: [], rhoInfo: [], S: [], X: [], O: [], zero: [], distinct: [], tieMax: [], ov10: [], ov50: [], ov100: [], gate: 0, n: 0,
    eng: BANDS.map(() => ({ k: 0, t: 0, n: 0 })), orc: BANDS.map(() => ({ k: 0, t: 0, n: 0 })), all: { k: 0, t: 0, n: 0 }, ex: { k: 0, t: 0, n: 0 },
    conc: GAPS.map(() => ({ c: 0, n: 0 })), concGen: GAPS.map(() => ({ c: 0, n: 0 })) };
  const perSeed = [];
  for (const seed of seeds) {
    const r = L.rng(seed * 7919 + nb * 13 + (o.told ? 1 : 0) + (o.notes ? 2 : 0));
    const rhoSeed = [], topSeed = [], botSeed = [];
    for (let i = 0; i < nPer; i++) {
      const per = L.persona(r, ctx), list = nb ? L.bottles(ctx, per, r, nb) : [];
      const ses = L.answer(ctx, per, list, r, o), res = L.run(ctx, ses);
      acc.n++; if (!res.gate) continue; acc.gate++;
      const S = res.rec.scored, ids = S.map(s => s.P.id), inS = new Set(ids);
      const side = ctx.E.sideOf(ses.ratings);
      const onSide = id => { const g = ctx.E.byId[id].gender; return !side || g === "u" || g === side; };
      const X = ctx.ALL.filter(id => !ses.ratings[id] && !inS.has(id) && onSide(id));
      acc.S.push(S.length); acc.X.push(X.length); acc.O.push(ctx.ALL.filter(id => !ses.ratings[id] && !onSide(id)).length);
      const fin = S.map(s => r9(s.final)), tr = ids.map(id => truth(per, id)), gen = ids.map(id => GEN[id]);
      const rho = spearman(fin, tr); acc.rho.push(rho); rhoSeed.push(rho); acc.rhoGen.push(spearman(gen, tr));
      /* perfumes the answers say nothing about: no liked, disliked or doubtful family read, only unmet ones */
      const zeroMask = S.map(s => s.reward === 0 && s.penalty === 0);
      acc.zero.push(zeroMask.filter(Boolean).length / S.length);
      const infoIdx = S.map((_, j) => j).filter(j => !zeroMask[j]);
      if (infoIdx.length > 10) acc.rhoInfo.push(spearman(infoIdx.map(j => fin[j]), infoIdx.map(j => tr[j])));
      const counts = {}; for (const f of fin) counts[f] = (counts[f] || 0) + 1;
      acc.distinct.push(Object.keys(counts).length / S.length); acc.tieMax.push(Math.max(...Object.values(counts)) / S.length);
      const orcOrder = ids.map((id, j) => j).sort((a, b) => tr[b] - tr[a]), orcRank = new Array(ids.length); orcOrder.forEach((j, k) => { orcRank[j] = k + 1; });
      for (const [N, key] of [[10, "ov10"], [50, "ov50"], [100, "ov100"]]) { const top = new Set(orcOrder.slice(0, N)); acc[key].push(ids.slice(0, N).filter((_, j) => top.has(j)).length / N); }
      /* simulated wears, the same for a (visitor, perfume) whichever order is scored */
      let tk = 0, tt = 0, bk = 0, bt = 0, nt = 0, nbm = 0;
      ids.forEach((id, j) => {
        const oc = L.outcome(ctx.TRUTH[id], per, L.rng(hashSeed(seed, i, id)), K);
        const e = acc.eng[bandOf(j + 1)], g = acc.orc[bandOf(orcRank[j])];
        e.k += oc.keep; e.t += oc.turn; e.n++; g.k += oc.keep; g.t += oc.turn; g.n++; acc.all.k += oc.keep; acc.all.t += oc.turn; acc.all.n++;
        if (j < 10) { tk += oc.keep; tt += oc.turn; nt++; } if (j >= ids.length - 100) { bk += oc.keep; bt += oc.turn; nbm++; }
      });
      topSeed.push(tk / nt); botSeed.push(bk / nbm);
      for (const id of X) { const oc = L.outcome(ctx.TRUTH[id], per, L.rng(hashSeed(seed, i, id)), K); acc.ex.k += oc.keep; acc.ex.t += oc.turn; acc.ex.n++; }
      /* pairs: when the list puts A above B, how often A is truly the better fit, by how far apart they are listed */
      for (let p = 0; p < 1500; p++) {
        const a = Math.floor(r() * ids.length), b = Math.floor(r() * ids.length); if (a === b) continue;
        const [hi, lo] = a < b ? [a, b] : [b, a], gi = GAPS.findIndex(([x, y]) => lo - hi >= x && lo - hi <= y);
        const c = fin[hi] === fin[lo] ? 0.5 : tr[hi] > tr[lo] ? 1 : tr[hi] < tr[lo] ? 0 : 0.5;
        acc.conc[gi].c += c; acc.conc[gi].n++;
        const cg = gen[hi] === gen[lo] ? 0.5 : (gen[hi] > gen[lo]) === (tr[hi] > tr[lo]) ? 1 : 0;
        acc.concGen[gi].c += cg; acc.concGen[gi].n++;
      }
    }
    perSeed.push({ seed, rho: L.mean(rhoSeed), top10keep: L.mean(topSeed), bottom100keep: L.mean(botSeed) });
  }
  const P = L.pct, f2 = L.f2, m = L.mean;
  log(`\n## ${name} (${acc.n} visitors, ${P(acc.gate / acc.n)} shown picks; seeds ${seeds.join(", ")})`);
  log(`ranked by the engine: ${m(acc.S).toFixed(0)} perfumes; left out on the visitor's side (likely deal-breaker or avoided note): ${m(acc.X).toFixed(0)}; other side: ${m(acc.O).toFixed(0)}`);
  log(`Spearman, engine order against the hidden taste: mean ${f2(m(acc.rho))} (quartiles ${f2(q(acc.rho, 0.25))}, ${f2(q(acc.rho, 0.5))}, ${f2(q(acc.rho, 0.75))}); a ranking that ignores the visitor: ${f2(m(acc.rhoGen))}`);
  log(`  over the perfumes the answers say something about: ${f2(m(acc.rhoInfo))}`);
  if (perSeed.length > 1) log(`  by seed: rho ${perSeed.map(s => f2(s.rho)).join(", ")}; top-10 kept ${perSeed.map(s => P(s.top10keep)).join(", ")}; bottom-100 kept ${perSeed.map(s => P(s.bottom100keep)).join(", ")}`);
  log(`perfumes the answers say nothing about (score from unmet families only): ${P(m(acc.zero))}; distinct scores per perfume ranked: ${P(m(acc.distinct))}; largest tie: ${P(m(acc.tieMax))} of the list`);
  log(`overlap with the best possible order: top 10 ${P(m(acc.ov10))}, top 50 ${P(m(acc.ov50))}, top 100 ${P(m(acc.ov100))} (chance: ${P(10 / m(acc.S))}, ${P(50 / m(acc.S))}, ${P(100 / m(acc.S))})`);
  log(L.table(BANDS.map(([a, b], k) => ({ ranks: b > 1e8 ? `${a}+` : `${a}-${b}`, "engine kept": P(acc.eng[k].k / acc.eng[k].n), "engine turn": P(acc.eng[k].t / acc.eng[k].n), "best-order kept": P(acc.orc[k].k / acc.orc[k].n), "best-order turn": P(acc.orc[k].t / acc.orc[k].n) }))
    .concat([{ ranks: "all ranked", "engine kept": P(acc.all.k / acc.all.n), "engine turn": P(acc.all.t / acc.all.n), "best-order kept": "", "best-order turn": "" },
      { ranks: "left out", "engine kept": P(acc.ex.k / acc.ex.n), "engine turn": P(acc.ex.t / acc.ex.n), "best-order kept": "", "best-order turn": "" }]),
    ["ranks", "engine kept", "engine turn", "best-order kept", "best-order turn"]));
  log("pairs: listed higher is truly the better fit, by distance apart in the list");
  log(L.table(GAPS.map(([a, b], k) => ({ apart: b > 1e8 ? `${a}+` : `${a}-${b}`, engine: P(acc.conc[k].c / acc.conc[k].n), "ignores the visitor": P(acc.concGen[k].c / acc.concGen[k].n) })), ["apart", "engine", "ignores the visitor"]));
}

const VNT = { notes: 0.6, told: true, unsureWhen: 0.25 };
population("Three bottles, every answer", 3, VNT, [11, 12, 13, 14, 15], 200);
population("Three bottles, verdicts only", 3, { notes: 0, told: false, unsureWhen: 0.25 }, [11], 500);
population("Eight bottles, every answer", 8, VNT, [11], 500);
population("Word answers only", 0, { notes: 0, told: true, unsureWhen: 0.25 }, [11], 500);

/* retest: the same bottles and history, answered twice (as a2_stability.js retest 1) */
{
  const r = L.rng(4242), rho = [], ov = { 10: [], 50: [], 100: [] }, move = [], far = [];
  let n = 0;
  for (let i = 0; i < 600; i++) {
    const per = L.persona(r, ctx);
    const list = L.bottles(ctx, per, r, 3).map(b => Object.assign(b, { fixed: b.kind === "shop" ? L.shopTrial(ctx.TRUTH[b.id], per, r) : L.wear(ctx.TRUTH[b.id], per, r) }));
    const known = new Set(ctx.CARDS.filter(() => r() < 0.5).map(c => c.id));
    const a = L.run(ctx, L.answer(ctx, per, list, r, Object.assign({ known }, VNT))), b = L.run(ctx, L.answer(ctx, per, list, r, Object.assign({ known }, VNT)));
    if (!a.gate || !b.gate) continue; n++;
    const ra = {}, rb = {}; a.rec.scored.forEach((s, j) => { ra[s.P.id] = j + 1; }); b.rec.scored.forEach((s, j) => { rb[s.P.id] = j + 1; });
    const both = Object.keys(ra).filter(id => rb[id]);
    const fa = {}, fb = {}; a.rec.scored.forEach(s => { fa[s.P.id] = r9(s.final); }); b.rec.scored.forEach(s => { fb[s.P.id] = r9(s.final); });
    rho.push(spearman(both.map(id => fa[id]), both.map(id => fb[id])));
    for (const N of [10, 50, 100]) { const tb = new Set(b.rec.scored.slice(0, N).map(s => s.P.id)); ov[N].push(a.rec.scored.slice(0, N).filter(s => tb.has(s.P.id)).length / N); }
    const top100 = a.rec.scored.slice(0, 100).map(s => s.P.id).filter(id => rb[id]);
    move.push(q(top100.map(id => Math.abs(ra[id] - rb[id])), 0.5));
    far.push(both.filter(id => Math.abs(ra[id] - rb[id]) > 100).length / both.length);
  }
  log(`\n## Retest, three bottles, same history, answered twice (${n} visitors)`);
  log(`Spearman between the two lists: ${L.f2(L.mean(rho))} (quartiles ${L.f2(q(rho, 0.25))}, ${L.f2(q(rho, 0.5))}, ${L.f2(q(rho, 0.75))})`);
  log(`top 10 in common ${L.pct(L.mean(ov[10]))}, top 50 ${L.pct(L.mean(ov[50]))}, top 100 ${L.pct(L.mean(ov[100]))}`);
  log(`first list's top 100: median move ${L.mean(move).toFixed(0)} places (mean over visitors of each visitor's median); perfumes moving more than 100 places: ${L.pct(L.mean(far))}`);
}

/* the tags' own imprecision: the engine reads every weight shaken by 15%, the visitors smell the catalogue */
{
  const r0 = L.rng(915);
  const shaken = L.site({ engineSource: PATCHED, truth: ctx.E.byId, perfumes: list => list.map(P => Object.assign({}, P, { stages: Object.fromEntries(L.STAGES.map(s => [s, Object.fromEntries(Object.entries(P.stages[s] || {}).map(([f, w]) => [f, L.clamp(w * (1 + 0.15 * L.normal(r0)), 0.05, 1)]))])) })) });
  const r = L.rng(5150), rho = [], rhoT = [], rhoT0 = [], ov = { 10: [], 100: [] };
  let n = 0;
  for (let i = 0; i < 500; i++) {
    const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 3), r, VNT);
    const a = L.run(ctx, ses), b = L.run(shaken, ses); if (!a.gate || !b.gate) continue; n++;
    const fa = {}, fb = {}; a.rec.scored.forEach(s => { fa[s.P.id] = r9(s.final); }); b.rec.scored.forEach(s => { fb[s.P.id] = r9(s.final); });
    const both = Object.keys(fa).filter(id => id in fb);
    rho.push(spearman(both.map(id => fa[id]), both.map(id => fb[id])));
    rhoT0.push(spearman(both.map(id => fa[id]), both.map(id => truth(per, id)))); rhoT.push(spearman(both.map(id => fb[id]), both.map(id => truth(per, id))));
    for (const N of [10, 100]) { const tb = new Set(b.rec.scored.slice(0, N).map(s => s.P.id)); ov[N].push(a.rec.scored.slice(0, N).filter(s => tb.has(s.P.id)).length / N); }
  }
  log(`\n## Tags shaken by 15% (${n} visitors, three bottles, every answer)`);
  log(`Spearman, list on the catalogue's tags against the list on shaken tags: ${L.f2(L.mean(rho))}; top 10 in common ${L.pct(L.mean(ov[10]))}, top 100 ${L.pct(L.mean(ov[100]))}`);
  log(`against the hidden taste: catalogue tags ${L.f2(L.mean(rhoT0))}, shaken tags ${L.f2(L.mean(rhoT))}`);
}
log(`\n${((Date.now() - t0) / 1000).toFixed(0)} s`);
fs.writeFileSync(path.join(__dirname, "out", "n.txt"), out.join("\n") + "\n");
