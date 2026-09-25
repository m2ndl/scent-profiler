/* The engine's outputs in a compact, readable form for golden comparisons: perfumes by id, numbers
   exactly as computed, one line per scenario in the golden file. */
"use strict";

function summarize(prof, rec, settle, resolved) {
  return {
    profile: Object.fromEntries(Object.entries(prof).map(([f, v]) => [f, {
      cls: v.cls, score: v.score, n: v.n, pos: v.pos, neg: v.neg,
      evidence: v.evidence.map(e => [e.perfume.id, e.stage, e.value, e.prov || "", e.chip || ""].join(" ").trim())
    }])),
    picks: rec.picks.map(p => ({ id: p.P.id, final: p.final, reward: p.reward, penalty: p.penalty, risks: p.risks.map(r => [r.f, r.s, r.w, r.kind, r.sev].join(" ")) })),
    badAny: rec.badAny,
    likely: rec.likely,
    settle: settle ? { target: settle.target.id, family: settle.f, others: settle.others } : null,
    resolved: resolved.map(P => (P ? { id: P.id, conf: P.conf, stages: P.stages, prov: P.prov, evidence: P.evidence || null } : null))
  };
}

/* ids whose resolution goes beyond the plain catalogue: a pasted label, a lazy-catalogue entry, an untagged name */
const specialIds = ratings => Object.keys(ratings).filter(id => ratings[id].label || ratings[id].auto || ratings[id].custom);

function formatGolden(golden) {
  return "{\n\"mapped\": " + JSON.stringify(golden.mapped) + ",\n\"scenarios\": [\n" + golden.scenarios.map(s => JSON.stringify(s)).join(",\n") + "\n]\n}\n";
}

module.exports = { summarize, specialIds, formatGolden };
