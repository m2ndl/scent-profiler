/* Where the engine's full order loses to what the answers allow (FULLORDER.md). The ranking formula of recommend() is
   kept throughout; what it is given changes. Rows, on the same visitors (three bottles, every answer, as REPORT.md):
   the engine's profile as it is; the same profile with one kind of reading error corrected; and the reference points:
   the true likes and deal-breakers the answers expose, all of them, and the whole true taste.
   "Exposed" means a rated bottle holds the family at 0.4 or more in its heart or base, or a word answer touches it.
   A family the engine flags or likes wrongly is corrected to neutral at the population's mean opinion (0.15), which is
   what a reader who knew it was neither a like nor a deal-breaker would assume; its true mild opinion is in no answer.
   An exposed like or deal-breaker that is found gets its true strength (a deal-breaker -2, a like 1 to 2) and its class.
   The reference rows read every other family at the mean. The engine change at the end runs the site's engine with one
   constant changed. Nothing in site/ changes.
   Usage: node p_gap_ablation.js [visitors per seed]. Seeds 11 to 15. Writes out/p.txt and out/p.json. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const N_PER = +(process.argv[2] || 300), SEEDS = [11, 12, 13, 14, 15];
const SRC = fs.readFileSync(path.join(L.ROOT, "site", "js", "engine.js"), "utf8");
const ANCHOR = "return { picks, badAny, likely, contradicted: veto.contradicted };";
if (SRC.split(ANCHOR).length !== 2) throw new Error("anchor not found exactly once");
const EXPOSED = SRC.replace(ANCHOR, "return { picks, badAny, likely, contradicted: veto.contradicted, scored };");
const ctx = L.site({ engineSource: EXPOSED }), { E } = ctx;
/* an engine change the rows point to: a family known only from words scores what the words say (the mean of its told
   items, +1 or -1) instead of being pulled toward zero by the prior */
const PRIOR = "const TOLD_PRIOR = TOLD_W;";
if (EXPOSED.split(PRIOR).length !== 2) throw new Error("prior anchor not found exactly once");
const ctxW = L.site({ engineSource: EXPOSED.replace(PRIOR, "const TOLD_PRIOR = 0;") });
const K = 30;
function hashSeed(...xs) { let h = 2166136261; for (const c of xs.join("|")) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const out = [], log = s => { out.push(s); console.log(s); };
const r9 = x => Math.round(x * 1e9) / 1e9;
function ranks(v) { const idx = v.map((_, i) => i).sort((a, b) => v[b] - v[a]), rk = new Array(v.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && v[idx[j + 1]] === v[idx[i]]) j++; for (let k = i; k <= j; k++) rk[idx[k]] = (i + j) / 2 + 1; i = j + 1; } return rk; }
function pearson(x, y) { const mx = L.mean(x), my = L.mean(y); let a = 0, b = 0, c = 0; for (let i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return a / Math.sqrt(b * c); }
const spearman = (x, y) => pearson(ranks(x), ranks(y));
const sig = x => 1 / (1 + Math.exp(-x));
const truth = (id, per) => { const T = ctx.TRUTH[id]; return (1 - L.pRuinLater(T, per)) * sig(2 * (0.8 * L.hedonic(T.stages.heart, per.u) + L.hedonic(T.stages.drydown, per.u))); };

const BAD = ["badLikely", "badPossible"], GOOD = ["goodLikely", "goodPossible"];
const trueEntry = (per, f) => ({ score: per.u[f], n: 1, cls: per.bad.includes(f) ? "badLikely" : per.like.includes(f) ? "goodLikely" : "neutral", evidence: [], pos: 0, neg: 0 });
const mild = () => ({ score: 0.15, n: 1, cls: "neutral", evidence: [], pos: 0, neg: 0 });
/* a copy of the engine's profile with the families chosen by pick(f, v) replaced by entry(f) */
const replace = (prof, pick, entry, fams) => { const p = Object.assign({}, prof); for (const f of fams || Object.keys(prof)) if (pick(f, prof[f])) p[f] = entry(f); return p; };

const ROWS = [
  "engine, as it is",
  "families wrongly flagged as deal-breakers read as neutral",
  "families wrongly shown as liked read as neutral",
  "both of those",
  "exposed deal-breakers found",
  "exposed likes found",
  "exposed deal-breakers and likes found, nothing else",
  "all four",
  "families known only from words: their likes and deal-breakers found, the rest neutral",
  "unmet families read as mildly liked, not as a risk",
  "engine change: words at face value",
  "all four, and unmet families as mildly liked",
  "reference: exposed likes and deal-breakers, the rest at the mean",
  "reference: every like and deal-breaker, the rest at the mean",
  "reference: the whole true taste"
];
const acc = Object.fromEntries(ROWS.map(k => [k, { all: [], seed: {}, keep: [], turn: [] }]));
let visitors = 0;
const t0 = Date.now();
for (const seed of SEEDS) {
  const r = L.rng(seed * 104729 + 3);
  for (let i = 0; i < N_PER; i++) {
    const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 3), r, { notes: 0.6, told: true, unsureWhen: 0.25 });
    const res = L.run(ctx, ses); if (!res.gate) continue;
    visitors++;
    const side = E.sideOf(ses.ratings);
    const list = ctx.ALL.filter(id => { const g = E.byId[id].gender; return !ses.ratings[id] && (!side || g === "u" || g === side); });
    const tr = list.map(id => truth(id, per));
    const told = new Set(res.told.map(t => t.f));
    const exposed = f => told.has(f) || Object.keys(ses.ratings).some(id => ["heart", "drydown"].some(s => ((E.byId[id].stages[s] || {})[f] || 0) >= 0.4));
    const isBad = f => per.bad.includes(f), isLike = f => per.like.includes(f);
    const P0 = res.prof, T = f => trueEntry(per, f);
    const innocent = (f, v) => v && BAD.includes(v.cls) && !isBad(f);
    const falseLike = (f, v) => v && GOOD.includes(v.cls) && !isLike(f);
    const foundBad = (f, v) => isBad(f) && exposed(f), foundLike = (f, v) => isLike(f) && exposed(f);
    const found = p => replace(replace(p, foundBad, T, ctx.FAMS), foundLike, T, ctx.FAMS);
    const fixAll = p => found(replace(replace(p, innocent, mild), falseLike, mild));
    /* unmet: a family the picks would read as not met (no rated stage holds it at 0.4 or more and no word on it) */
    const unmetMild = p => { const q = Object.assign({}, p); for (const f of ctx.FAMS) { const v = q[f]; if (!v || (v.n === 0 && !(v.toldEvidence && v.toldEvidence.length))) q[f] = mild(); } return q; };
    const allMean = pick => { const q = {}; for (const f of ctx.FAMS) q[f] = pick(f) ? T(f) : mild(); return q; };
    const whole = () => { const q = {}; for (const f of ctx.FAMS) q[f] = T(f); return q; };
    const profiles = {
      "engine, as it is": [P0, res.avoid],
      "families wrongly flagged as deal-breakers read as neutral": [replace(P0, innocent, mild), res.avoid],
      "families wrongly shown as liked read as neutral": [replace(P0, falseLike, mild), res.avoid],
      "both of those": [replace(replace(P0, innocent, mild), falseLike, mild), res.avoid],
      "exposed deal-breakers found": [replace(P0, foundBad, T, ctx.FAMS), res.avoid],
      "exposed likes found": [replace(P0, foundLike, T, ctx.FAMS), res.avoid],
      "exposed deal-breakers and likes found, nothing else": [found(P0), res.avoid],
      "all four": [fixAll(P0), res.avoid],
      "families known only from words: their likes and deal-breakers found, the rest neutral": [replace(P0, (f, v) => v && v.n === 0 && v.toldEvidence && v.toldEvidence.length, f => (isBad(f) || isLike(f) ? T(f) : mild())), res.avoid],
      "unmet families read as mildly liked, not as a risk": [unmetMild(P0), res.avoid],
      "all four, and unmet families as mildly liked": [unmetMild(fixAll(P0)), res.avoid],
      "reference: exposed likes and deal-breakers, the rest at the mean": [allMean(f => (isBad(f) || isLike(f)) && exposed(f)), []],
      "reference: every like and deal-breaker, the rest at the mean": [allMean(f => isBad(f) || isLike(f)), []],
      "reference: the whole true taste": [whole(), []]
    };
    for (const [k, [prof, avoid]] of Object.entries(profiles)) {
      const m = {}; for (const x of E.recommend(prof, ses.ratings, avoid).scored) m[x.P.id] = r9(x.final);
      const rho = spearman(list.map(id => (id in m ? m[id] : -1e9)), tr);
      acc[k].all.push(rho); (acc[k].seed[seed] = acc[k].seed[seed] || []).push(rho);
    }
    /* the engine change runs on the same answers; its picks and the site's are worn the same way */
    const resW = L.run(ctxW, ses), mW = {};
    for (const x of resW.rec.scored) mW[x.P.id] = r9(x.final);
    const rhoW = spearman(list.map(id => (id in mW ? mW[id] : -1e9)), tr), kW = acc["engine change: words at face value"];
    kW.all.push(rhoW); (kW.seed[seed] = kW.seed[seed] || []).push(rhoW);
    for (const [k, rr] of [["engine, as it is", res], ["engine change: words at face value", resW]]) {
      if (!rr.picks.length) continue;
      const oc = rr.picks.map(id => L.outcome(ctx.TRUTH[id], per, L.rng(hashSeed(seed, i, id)), K));
      acc[k].keep.push(L.mean(oc.map(o => o.keep))); acc[k].turn.push(L.mean(oc.map(o => o.turn)));
    }
  }
  process.stderr.write(`seed ${seed}: ${((Date.now() - t0) / 1000).toFixed(0)} s\n`);
}
const m = L.mean, f2 = L.f2;
log(`${visitors} visitors shown picks (three bottles, every answer; seeds ${SEEDS.join(", ")}, ${N_PER} drawn per seed). Agreement of the full order with the hidden taste (Spearman over the visitor's whole list, left-out perfumes at the bottom).\n`);
log(L.table(ROWS.map(k => { const s = SEEDS.map(sd => m(acc[k].seed[sd])); return { "what the ranking formula is given": k, agreement: f2(m(acc[k].all)), "seed range": `${f2(Math.min(...s))} to ${f2(Math.max(...s))}`,
  "picks kept / turn": acc[k].keep.length ? `${L.pct(m(acc[k].keep))} / ${L.pct(m(acc[k].turn))}` : "" }; }),
  ["what the ranking formula is given", "agreement", "seed range", "picks kept / turn"]));
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "out", "p.txt"), out.join("\n") + "\n");
fs.writeFileSync(path.join(__dirname, "out", "p.json"), JSON.stringify({ visitors, perSeed: N_PER, seeds: SEEDS, rows: Object.fromEntries(ROWS.map(k => [k, { mean: m(acc[k].all), bySeed: Object.fromEntries(SEEDS.map(sd => [sd, m(acc[k].seed[sd])])), keep: acc[k].keep.length ? m(acc[k].keep) : null, turn: acc[k].turn.length ? m(acc[k].turn) : null }])) }, null, 1));
