/* Is the noisy middle of the full order the engine's fault or the limit of what the quiz can learn (FULLORDER.md)?
   Same visitors (three bottles, every answer). Every ranking is scored over the visitor's whole list (unrated perfumes
   on their side); a perfume a ranking leaves out goes to the bottom. Rankings:
   - engine: the site's engine on the visitor's answers (as the site runs it);
   - formula, true taste: the site's ranking formula given a profile that holds the visitor's true opinion of every family;
   - formula, strong families only: the same formula told only the true likes and deal-breakers, every other family
     at the population's mean opinion (0.15), which is the most a quiz could learn if it found the strong families perfectly;
   - truth, strong families only: the hidden-taste score itself with every mild opinion replaced by 0.15.
   Nothing in site/ changes. Usage: node n2_cause.js. Writes out/n2.txt. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const SRC = fs.readFileSync(path.join(L.ROOT, "site", "js", "engine.js"), "utf8");
const OLD = "return { picks, badAny, likely, contradicted: veto.contradicted };";
if (SRC.split(OLD).length !== 2) throw new Error("anchor not found exactly once");
const ctx = L.site({ engineSource: SRC.replace(OLD, "return { picks, badAny, likely, contradicted: veto.contradicted, scored };") });
const K = 10, out = [], log = s => { out.push(s); console.log(s); };
const sig = x => 1 / (1 + Math.exp(-x));
const score = (id, per, u) => { const T = ctx.TRUTH[id]; return (1 - L.pRuinLater(T, per)) * sig(2 * (0.8 * L.hedonic(T.stages.heart, u) + L.hedonic(T.stages.drydown, u))); };
function hashSeed(...xs) { let h = 2166136261; for (const c of xs.join("|")) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const r9 = x => Math.round(x * 1e9) / 1e9;
function ranks(v) {
  const idx = v.map((_, i) => i).sort((a, b) => v[b] - v[a]), rk = new Array(v.length);
  for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && v[idx[j + 1]] === v[idx[i]]) j++; for (let k = i; k <= j; k++) rk[idx[k]] = (i + j) / 2 + 1; i = j + 1; }
  return rk;
}
function pearson(x, y) { const mx = L.mean(x), my = L.mean(y); let a = 0, b = 0, c = 0; for (let i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return a / Math.sqrt(b * c); }
const spearman = (x, y) => pearson(ranks(x), ranks(y));
const BANDS = [[1, 10], [11, 100], [101, 300], [301, 500], [501, 1e9]];
const GAPS = [[1, 24], [25, 99], [100, 299], [300, 1e9]];

const prof = (per, mode) => {
  const p = {};
  for (const f of ctx.FAMS) {
    const bad = per.bad.includes(f), like = per.like.includes(f);
    const s = mode === "full" || bad || like ? per.u[f] : 0.15;
    p[f] = { score: s, n: 1, cls: bad ? "badLikely" : like ? "goodLikely" : "neutral", evidence: [], pos: 0, neg: 0 };
  }
  return p;
};
const NAMES = ["engine", "formula, true taste", "formula, strong families only", "truth, strong families only"];
const acc = Object.fromEntries(NAMES.map(n => [n, { rho: [], bands: BANDS.map(() => ({ k: 0, t: 0, n: 0 })), gaps: GAPS.map(() => ({ c: 0, n: 0 })) }]));
let visitors = 0;
for (const seed of [11, 12, 13, 14, 15]) {
  const r = L.rng(seed * 104729 + 3);
  for (let i = 0; i < 200; i++) {
    const per = L.persona(r, ctx), ses = L.answer(ctx, per, L.bottles(ctx, per, r, 3), r, { notes: 0.6, told: true, unsureWhen: 0.25 });
    const res = L.run(ctx, ses); if (!res.gate) continue; visitors++;
    const side = ctx.E.sideOf(ses.ratings);
    const list = ctx.ALL.filter(id => { const g = ctx.E.byId[id].gender; return !ses.ratings[id] && (!side || g === "u" || g === side); });
    const tr = list.map(id => score(id, per, per.u));
    const fromScored = sc => { const m = {}; for (const s of sc) m[s.P.id] = r9(s.final); return list.map(id => (id in m ? m[id] : -1e9)); };
    const uStrong = Object.assign({}, per.u); for (const f of ctx.FAMS) if (!per.bad.includes(f) && !per.like.includes(f)) uStrong[f] = 0.15;
    const orders = {
      "engine": fromScored(res.rec.scored),
      "formula, true taste": fromScored(ctx.E.recommend(prof(per, "full"), ses.ratings, []).scored),
      "formula, strong families only": fromScored(ctx.E.recommend(prof(per, "strong"), ses.ratings, []).scored),
      "truth, strong families only": list.map(id => score(id, per, uStrong))
    };
    const oc = list.map(id => L.outcome(ctx.TRUTH[id], per, L.rng(hashSeed(seed, i, id)), K));
    for (const [name, v] of Object.entries(orders)) {
      const a = acc[name];
      a.rho.push(spearman(v, tr));
      const order = list.map((_, j) => j).sort((x, y) => v[y] - v[x]), pos = new Array(list.length); order.forEach((j, k) => { pos[j] = k; });
      order.forEach((j, k) => { const b = a.bands[BANDS.findIndex(([lo, hi]) => k + 1 >= lo && k + 1 <= hi)]; b.k += oc[j].keep; b.t += oc[j].turn; b.n++; });
      for (let p = 0; p < 1500; p++) {
        const x = Math.floor(r() * list.length), y = Math.floor(r() * list.length); if (x === y) continue;
        const [hi, lo] = pos[x] < pos[y] ? [x, y] : [y, x], gap = pos[lo] - pos[hi], g = GAPS.findIndex(([m, n]) => gap >= m && gap <= n);
        a.gaps[g].c += v[hi] === v[lo] ? 0.5 : tr[hi] > tr[lo] ? 1 : tr[hi] < tr[lo] ? 0 : 0.5; a.gaps[g].n++;
      }
    }
  }
}
log(`${visitors} visitors (three bottles, every answer, seeds 11 to 15); each ranks the visitor's whole list, left-out perfumes at the bottom\n`);
log(L.table(NAMES.map(n => ({ ranking: n, "Spearman with the hidden taste": L.f2(L.mean(acc[n].rho)) })), ["ranking", "Spearman with the hidden taste"]));
log("\nkept / turn by position in the list");
log(L.table(NAMES.map(n => Object.assign({ ranking: n }, Object.fromEntries(BANDS.map(([lo, hi], k) => [hi > 1e8 ? `${lo}+` : `${lo}-${hi}`, `${L.pct(acc[n].bands[k].k / acc[n].bands[k].n)} / ${L.pct(acc[n].bands[k].t / acc[n].bands[k].n)}`])))),
  ["ranking", ...BANDS.map(([lo, hi]) => (hi > 1e8 ? `${lo}+` : `${lo}-${hi}`))]));
log("\npairs: listed higher is truly the better fit, by distance apart");
log(L.table(NAMES.map(n => Object.assign({ ranking: n }, Object.fromEntries(GAPS.map(([lo, hi], k) => [hi > 1e8 ? `${lo}+` : `${lo}-${hi}`, L.pct(acc[n].gaps[k].c / acc[n].gaps[k].n)])))),
  ["ranking", ...GAPS.map(([lo, hi]) => (hi > 1e8 ? `${lo}+` : `${lo}-${hi}`))]));
fs.writeFileSync(path.join(__dirname, "out", "n2.txt"), out.join("\n") + "\n");
