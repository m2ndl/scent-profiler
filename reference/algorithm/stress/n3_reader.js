/* How much of the engine's gap is information the answers do not hold, and how much is reading (FULLORDER.md)?
   "Perfect reader of these answers": the site's formula told the true likes and deal-breakers that the answers
   expose (a rated bottle holds the family at 0.4 or more in its heart or base, or the visitor's words name it), and
   the population mean (0.15) for everything else. It assumes the reader can tell which exposed family is the liked or
   hated one, so it is an upper bound for any reading of these answers. Nothing in site/ changes.
   Usage: node n3_reader.js. Writes out/n3.txt. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib");
const SRC = fs.readFileSync(path.join(L.ROOT, "site", "js", "engine.js"), "utf8");
const OLD = "return { picks, badAny, likely, contradicted: veto.contradicted };";
if (SRC.split(OLD).length !== 2) throw new Error("anchor not found exactly once");
const ctx = L.site({ engineSource: SRC.replace(OLD, "return { picks, badAny, likely, contradicted: veto.contradicted, scored };") });
const out = [], log = s => { out.push(s); console.log(s); };
const sig = x => 1 / (1 + Math.exp(-x));
const score = (id, per) => { const T = ctx.TRUTH[id]; return (1 - L.pRuinLater(T, per)) * sig(2 * (0.8 * L.hedonic(T.stages.heart, per.u) + L.hedonic(T.stages.drydown, per.u))); };
const r9 = x => Math.round(x * 1e9) / 1e9;
function ranks(v) { const idx = v.map((_, i) => i).sort((a, b) => v[b] - v[a]), rk = new Array(v.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && v[idx[j + 1]] === v[idx[i]]) j++; for (let k = i; k <= j; k++) rk[idx[k]] = (i + j) / 2 + 1; i = j + 1; } return rk; }
function pearson(x, y) { const mx = L.mean(x), my = L.mean(y); let a = 0, b = 0, c = 0; for (let i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return a / Math.sqrt(b * c); }
const spearman = (x, y) => pearson(ranks(x), ranks(y));
const prof = (per, known) => { const p = {}; for (const f of ctx.FAMS) { const bad = per.bad.includes(f) && known(f), like = per.like.includes(f) && known(f); p[f] = { score: bad || like ? per.u[f] : 0.15, n: 1, cls: bad ? "badLikely" : like ? "goodLikely" : "neutral", evidence: [], pos: 0, neg: 0 }; } return p; };
function population(name, nb, o) {
  const acc = { engine: [], reader: [], strong: [], likesExposed: [], badExposed: [] }; let n = 0;
  for (const seed of [11, 12, 13, 14, 15]) {
    const r = L.rng(seed * 104729 + nb);
    for (let i = 0; i < 200; i++) {
      const per = L.persona(r, ctx), ses = L.answer(ctx, per, nb ? L.bottles(ctx, per, r, nb) : [], r, o);
      const res = L.run(ctx, ses); if (!res.gate) continue; n++;
      const side = ctx.E.sideOf(ses.ratings);
      const list = ctx.ALL.filter(id => { const g = ctx.E.byId[id].gender; return !ses.ratings[id] && (!side || g === "u" || g === side); });
      const tr = list.map(id => score(id, per));
      const fromScored = sc => { const m = {}; for (const s of sc) m[s.P.id] = r9(s.final); return list.map(id => (id in m ? m[id] : -1e9)); };
      const told = new Set(res.told.map(t => t.f));
      const exposed = f => told.has(f) || Object.keys(ses.ratings).some(id => ["heart", "drydown"].some(s => ((ctx.E.byId[id].stages[s] || {})[f] || 0) >= 0.4));
      acc.engine.push(spearman(fromScored(res.rec.scored), tr));
      acc.reader.push(spearman(fromScored(ctx.E.recommend(prof(per, exposed), ses.ratings, []).scored), tr));
      acc.strong.push(spearman(fromScored(ctx.E.recommend(prof(per, () => true), ses.ratings, []).scored), tr));
      acc.likesExposed.push(per.like.filter(exposed).length / per.like.length);
      if (per.bad.length) acc.badExposed.push(per.bad.filter(exposed).length / per.bad.length);
    }
  }
  log(`| ${name} | ${n} | ${L.f2(L.mean(acc.engine))} | ${L.f2(L.mean(acc.reader))} | ${L.f2(L.mean(acc.strong))} | ${L.pct(L.mean(acc.likesExposed))} | ${L.pct(L.mean(acc.badExposed))} |`);
}
log("Spearman with the hidden taste over the visitor's whole list (seeds 11 to 15)\n");
log("| Visitors | n | engine | perfect reader of these answers | all strong families known | likes exposed | deal-breakers exposed |");
log("|---|---|---|---|---|---|---|");
const VNT = { notes: 0.6, told: true, unsureWhen: 0.25 };
population("Three bottles, every answer", 3, VNT);
population("Three bottles, verdicts only", 3, { notes: 0, told: false, unsureWhen: 0.25 });
population("Eight bottles, every answer", 8, VNT);
population("Word answers only", 0, { notes: 0, told: true, unsureWhen: 0.25 });
fs.writeFileSync(path.join(__dirname, "out", "n3.txt"), out.join("\n") + "\n");
