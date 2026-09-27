/* The ranking of engine.js recommend() (the version of commit 0164d00), rewritten with switches so that changes to it
   can be trialled on the same visitors before any goes into the site. With the defaults it picks exactly what that
   recommend() picks; h_coverage.js and j_trial.js check this on every visitor they run.
     agg        "sum": a family counts in every stage it is in (the engine).
                "likes once": a liked family counts once, at its strongest stage-weighted presence; a disliked, doubtful
                or unmet family still counts in every stage it is in.
                "once": every family counts once, at its strongest stage-weighted presence.
     traces     "count": a family counts at its mean however little of it the rated bottles hold (the engine).
                "unmet": a family that no rated bottle holds at 0.4 or more and that the visitor never spoke about
                (n = 0, no told item or lean) is treated as a family the visitor has not met.
                "neutral": ... is left out of the score altogether.
                "words" (the adopted rule, engine.js picksView): a family no rated stage holds at 0.4 or more is read
                from the visitor's words alone (the profile's wordScore) when there are any, and is unmet when there
                are none, so a trace never outweighs a word. ("unmet" let the traces back in, at full weight, as soon
                as a word was given: an enjoyed note could lower the perfumes that hold it.)
     side       keep the picks to the visitor's side, one gender (men's or women's); unisex perfumes are on every side.
                "kept": the one gender of the gendered bottles they kept (engine.kept); none when they kept no gendered
                bottle, or kept both. "kept, else tried": the same, and when they kept no bottle at all, the one gender of
                the gendered bottles they rated. "kept, else tried, else unisex": the same, and unisex perfumes only when
                those bottles show no gender (none rated, or unisex ones only).
     r9         true: read each score to nine decimal places, as the classes do (the adopted engine), so that exact
                ties between two candidates never depend on the order of the ratings.
     stages     the stages scored; unknownW the cost of a strong unmet family; norm divides by the tag mass.
   The side rule counts catalogue bottles only (the synthetic visitors rate no other kind); the engine also reads the
   gender of vendor and custom bottles. The "likes once" loop keeps the engine's order of summing, so a site engine written the same way can be checked
   against it pick for pick. */
"use strict";
const STAGES = ["opening", "heart", "drydown"];
const r9 = x => Math.round(x * 1e9) / 1e9;
const atStrength = (s, w) => (s === "drydown" && w >= 0.5) || (s === "heart" && w >= 0.7);
const leads = (P, f, s) => { const st = P.stages[s] || {}, w = st[f] || 0; return w >= 0.7 && w >= Math.max(...Object.values(st)); };
const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const named = (P, words) => words.some(w => w && new RegExp("\\b" + reEsc(w) + "s?\\b", "i").test(P.name));
function vetoOf(prof, avoid) {
  const bind = [];
  for (const a of avoid || []) for (const [f, w] of Object.entries(a.fams || {})) {
    if (w < 0.5) continue;
    const kept = ((prof[f] || {}).evidence || []).filter(e => e.value > 0 && e.perfume && e.kept);
    if (!kept.length) bind.push({ f, words: a.words || [] });
  }
  return bind;
}
const vetoed = (P, bind) => bind.some(b => leads(P, b.f, "heart") || leads(P, b.f, "drydown") || named(P, b.words));
/* a family resting on traces alone: no rated bottle holds it at 0.4 or more and the visitor never spoke about it */
const traceOnly = v => !!v && v.n === 0 && !(v.toldEvidence && v.toldEvidence.length);

function sideOf(E, ratings, rule) {
  const ids = Object.keys(ratings).filter(id => E.byId[id] && (E.kept(ratings[id]) || STAGES.some(s => ratings[id][s] != null)));
  const kept = ids.filter(id => E.kept(ratings[id]));
  const from = kept.length || rule === "kept" ? kept : ids;
  const g = new Set(from.map(id => E.byId[id].gender).filter(x => x === "m" || x === "f"));
  /* "kept, else tried, else unisex": bottles that show no side (none rated, or unisex ones only) keep the picks unisex */
  if (!g.size && rule === "kept, else tried, else unisex") return "u";
  return g.size === 1 ? [...g][0] : null;
}
function ranker(E, SW, opt, perfumes) {
  opt = Object.assign({ agg: "sum", traces: "count", stages: STAGES, unknownW: 0.3, norm: false, side: false, r9: false }, opt || {});
  const LIST = perfumes || E.PERFUMES;
  return function rank(prof, ratings, avoid, n) {
    const likely = Object.entries(prof).filter(([, v]) => v.cls === "badLikely").map(([f]) => f);
    const bind = vetoOf(prof, avoid), scored = [];
    const side = opt.side ? sideOf(E, ratings, opt.side) : null;
    const read0 = f => {
      const v = prof[f];
      if (opt.traces === "count" || !v || v.n > 0) return v;
      if (opt.traces === "words") return v.toldEvidence && v.toldEvidence.length ? Object.assign({}, v, { score: v.wordScore }) : undefined;
      return traceOnly(v) ? (opt.traces === "unmet" ? undefined : null) : v;
    };
    const view = {}; for (const f of Object.keys(prof)) view[f] = read0(f);
    const read = f => view[f];
    for (const P of LIST) {
      if (ratings[P.id] || vetoed(P, bind)) continue;
      if (side && P.gender !== "u" && P.gender !== side) continue;
      let excluded = false;
      for (const s of STAGES) for (const [f, w] of Object.entries(P.stages[s])) if (likely.includes(f) && atStrength(s, w)) excluded = true;
      if (excluded) continue;
      let reward = 0, penalty = 0, unknown = 0, mass = 0;
      if (opt.agg === "sum" || opt.agg === "likes once") {
        const liked = {};
        const like = (f, x) => { if (opt.agg === "sum") reward += x; else liked[f] = Math.max(liked[f] || 0, x); };
        for (const s of opt.stages) for (const [f, w] of Object.entries(P.stages[s])) {
          const sw = SW[s]; mass += w * sw;
          const v = read(f);
          if (v === null) continue;
          if (!v) { if (w >= 0.5) unknown += w * sw; continue; }
          const sc = opt.r9 ? r9(v.score) : v.score;
          if (v.cls === "mixed") { if (Math.abs(r9(v.score)) < 0.7) penalty += w * sw * 0.3; else if (sc < 0) penalty += w * sw * (-sc); else like(f, w * sw * sc); continue; }
          if (sc < 0) penalty += w * sw * (-sc) * (v.cls === "badLikely" ? 1.5 : 1);
          else like(f, w * sw * sc);
        }
        for (const x of Object.values(liked)) reward += x;
      } else {
        const fam = {};
        for (const s of opt.stages) for (const [f, w] of Object.entries(P.stages[s])) {
          const o = fam[f] || (fam[f] = { max: 0, unkMax: 0 });
          o.max = Math.max(o.max, w * SW[s]); if (w >= 0.5) o.unkMax = Math.max(o.unkMax, w * SW[s]);
        }
        for (const [f, o] of Object.entries(fam)) {
          const v = read(f); mass += o.max;
          if (v === null) continue;
          if (!v) { unknown += o.unkMax; continue; }
          if (v.cls === "mixed") { if (Math.abs(r9(v.score)) < 0.7) penalty += o.max * 0.3; else if (v.score < 0) penalty += o.max * (-v.score); else reward += o.max * v.score; continue; }
          if (v.score < 0) penalty += o.max * (-v.score) * (v.cls === "badLikely" ? 1.5 : 1);
          else reward += o.max * v.score;
        }
      }
      let final = reward - 2 * penalty - opt.unknownW * unknown;
      if (opt.norm) final = final / Math.max(1e-9, mass);
      scored.push({ P, final });
    }
    scored.sort((a, b) => b.final - a.final);
    const picks = [], houses = new Set(), lineage = new Set();
    for (const s of scored) {
      const key = s.P.cloneOf || s.P.id;
      if (houses.has(s.P.house) || lineage.has(key)) continue;
      picks.push(s.P.id); houses.add(s.P.house); lineage.add(key);
      if (picks.length === (n || 3)) break;
    }
    return picks;
  };
}
module.exports = { ranker, traceOnly, vetoOf, sideOf };
