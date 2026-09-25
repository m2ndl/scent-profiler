/* Profile engine: merges the evidence layers into each perfume, builds the wearer's profile from their
   ratings and picks the recommendations. It holds no page, storage or language, so the page (app.js),
   the tests and the tools run the same code. */

window.PP_ENGINE = (function () {
  "use strict";
  const STAGES = ["opening", "heart", "drydown"];

  /* D: PP_DATA (catalogue and chips), M: PP_MAP (note mapper), EV: PP_EVIDENCE (book and label layers).
     Functions that need the wearer's data take it as an argument: state = { ratings, auto, images },
     the ratings by id, lazy-catalogue entries by id and bottle images of verified entries by id. */
  function create(D, M, EV) {
    EV = EV || { book: {}, label: {} };
    const { CHIPS, STAGE_W } = D;

    /* Provenance stack (reference/debate/ROUNDTABLE.md): curated < label < book. Higher layer wins per
       family and stage; a label confirms presence (weight = max of curated and label) and, in the new
       format, rules out families whose markers are absent; a book quote sets the weight outright. Every
       family keeps its source in prov[stage][family]. */
    function applyEvidence(P, userLabel) {
      const lab0 = EV.label[P.id], book = EV.book[P.id];
      const labels = [lab0, userLabel].filter(Boolean);
      const out = Object.assign({}, P, { stages: {}, prov: {} });
      for (const s of STAGES) {
        const st = Object.assign({}, P.stages[s] || {}); const pv = {};
        for (const f of Object.keys(st)) pv[f] = "curated";
        for (const lab of labels) {
          /* a label proves presence; it takes over the source only when the material is among the first declared (weight 0.4 or more) */
          for (const [f, w] of Object.entries((lab.stages && lab.stages[s]) || {})) { st[f] = Math.max(st[f] || 0, w); if (w >= 0.4) pv[f] = "label"; else if (!pv[f]) pv[f] = "label"; }
          for (const f of lab.absent || []) { if (st[f]) { delete st[f]; pv[f] = "label-absent"; } }
        }
        if (book) for (const [f, o] of Object.entries(book[s] || {})) { if (o.w > 0) { st[f] = o.w; } else delete st[f]; pv[f] = "book"; }
        out.stages[s] = st; out.prov[s] = pv;
      }
      const lab = labels[labels.length - 1];
      out.evidence = { label: lab ? { format: lab.format, date: lab.date || "", market: lab.market || "", url: lab.url || "" } : null, book: !!book };
      out.conf = (book || lab) ? 3 : P.conf;
      return out;
    }
    const PERFUMES = D.PERFUMES.map(p => applyEvidence(p));
    const byId = Object.fromEntries(PERFUMES.map(p => [p.id, p]));
    const RAW = Object.fromEntries(D.PERFUMES.map(p => [p.id, p]));

    const GENDER = { men: "m", male: "m", women: "f", female: "f" };

    /* Build a catalogue-shaped object from a backend entry: confidence 1, families from the mapper. */
    /* Vendor entries arrive either with note lists (mapped here, once, then discarded: the vendor's
       terms forbid caching its data) or already reduced to family weights (what the backend stores). */
    function buildAuto(entry, userLabel) {
      let stages = entry.stages, unmatched = [];
      if (!stages) { const mapped = M.mapNotes(entry.notes || {}, entry.accords || []); stages = mapped.stages; unmatched = mapped.unmatched; }
      const n = entry.notes; const text = n ? [n.top, n.middle, n.base].map(a => (a || []).join(", ") || "–").join(" / ") : "";
      const base = { id: entry.id, house: entry.brand || "", name: entry.name, ar: "", gender: GENDER[String(entry.gender || "").toLowerCase()] || "u", tier: "auto", conf: 1,
        stages, notes: { en: text, ar: text }, image: entry.image || "", auto: true, unmatched };
      const P = applyEvidence(base, userLabel);
      for (const s of STAGES) for (const f of Object.keys(P.prov[s])) if (P.prov[s][f] === "curated") P.prov[s][f] = "notes";
      P.conf = P.evidence.label || P.evidence.book ? 2 : 1;
      return P;
    }
    /* Strip a vendor entry to what may be stored: identity, image and derived weights. */
    function derived(entry) {
      const P = buildAuto(entry);
      return { id: entry.id, name: entry.name, brand: entry.brand || "", gender: entry.gender || "", oilType: entry.oilType || "", image: entry.image || "", vendorId: entry.vendorId || entry.id, stages: P.stages, source: entry.source || "vendor" };
    }
    /* The one place an id becomes a perfume object: verified catalogue, then lazy catalogue, then untagged custom.
       A label the wearer pasted for this perfume is applied on top, on this device. */
    function resolve(id, state) {
      const r = state.ratings[id];
      const userLabel = r && r.label && r.label.parsed ? r.label.parsed : null;
      if (byId[id]) { const P = userLabel ? applyEvidence(RAW[id], userLabel) : byId[id]; return state.images[id] && !P.image ? Object.assign({}, P, { image: state.images[id] }) : P; }
      const entry = (r && r.auto) || state.auto[id];
      if (entry) return buildAuto(entry, userLabel);
      if (r && r.custom) return { id, name: r.custom, house: "", ar: "", gender: "u", conf: 0, stages: null, prov: {}, notes: { en: "", ar: "" }, custom: true };
      return null;
    }

    const PROV_W = { book: 1, label: 1, "label-absent": 1, curated: 0.75, notes: 0.75 };

    function computeProfile(state) {
      const ratings = state.ratings;
      const F = {};
      const STRONG = 0.4; /* a family below this presence is a trace: it nudges the score but is not an exposure */
      const add = (f, value, w, ev) => {
        if (!F[f]) F[f] = { sum: 0, wsum: 0, evidence: [], per: {} };
        const o = F[f]; o.sum += value * w; o.wsum += w; o.evidence.push(ev);
        if (ev.strong) { const pid = ev.perfume.id; o.per[pid] = (o.per[pid] || 0) + value * w; }
      };
      for (const id of Object.keys(ratings)) {
        const P = resolve(id, state); if (!P || !P.stages) continue;
        const cm = P.auto && !(P.evidence && (P.evidence.label || P.evidence.book)) ? 0.5 : 1;   /* vendor-only entries count at half weight */
        const r = ratings[id];
        for (const s of STAGES) {
          const v = r[s]; if (v == null) continue;
          const sw = STAGE_W[s] * cm;
          for (const [f, w] of Object.entries(P.stages[s] || {})) {
            const prov = (P.prov && P.prov[s] && P.prov[s][f]) || "curated";
            add(f, v, w * sw * (PROV_W[prov] || 0.75), { perfume: P, stage: s, value: v, strong: w >= STRONG, prov });
          }
          for (const cid of (r.chips && r.chips[s]) || []) {
            const chip = CHIPS.find(c => c.id === cid); if (!chip) continue;
            for (const [f, cw] of Object.entries(chip.fams)) {
              const present = (P.stages[s] || {})[f] || 0; if (present < 0.2) continue;
              add(f, -1.5, cw * present * sw * 0.6, { perfume: P, stage: s, chip: cid, value: -1.5, strong: present >= STRONG });
            }
          }
        }
      }
      const out = {};
      for (const [f, o] of Object.entries(F)) {
        const score = o.wsum ? o.sum / o.wsum : 0;
        const per = Object.values(o.per);            /* net evidence per perfume */
        const n = per.length;
        const pos = per.filter(x => x > 0).length, neg = per.filter(x => x < 0).length;
        let cls = "neutral";
        if (n >= 2 && pos >= 1 && neg >= 1 && Math.abs(score) < 0.7) cls = "mixed";
        else if (score <= -0.7 && neg >= 2 && pos === 0) cls = "badLikely";
        else if (score <= -0.7 && neg >= 1) cls = "badPossible";
        else if (score <= -0.35 && n >= 2 && neg >= pos) cls = "badPossible";
        else if (score >= 0.7 && pos >= 2 && neg === 0) cls = "goodLikely";
        else if (score >= 0.7 && pos >= 1) cls = "goodPossible";
        else if (score >= 0.35 && n >= 2 && pos >= neg) cls = "goodPossible";
        out[f] = { score, n, cls, evidence: o.evidence.filter(e => e.strong), pos, neg };
      }
      return out;
    }

    function recommend(prof, ratings) {
      const likely = Object.entries(prof).filter(([, v]) => v.cls === "badLikely").map(([f]) => f);
      const badAny = Object.entries(prof).filter(([, v]) => v.cls === "badLikely" || v.cls === "badPossible").map(([f]) => f);
      const scored = [];
      for (const P of PERFUMES) {
        if (ratings[P.id]) continue;
        let penalty = 0, reward = 0, unknown = 0, excluded = false;
        const risks = [];
        for (const s of STAGES) {
          const sw = STAGE_W[s];
          for (const [f, w] of Object.entries(P.stages[s])) {
            const v = prof[f];
            if (likely.includes(f) && ((s === "drydown" && w >= 0.5) || (s === "heart" && w >= 0.7))) excluded = true;
            if (!v) { if (w >= 0.5) { unknown += w * sw; risks.push({ f, s, w, kind: "unknown", sev: w * sw }); } continue; }
            if (v.cls === "mixed") { risks.push({ f, s, w, kind: "mixed", sev: w * sw * 0.8 }); penalty += w * sw * 0.3; continue; }
            if (v.score < 0) { penalty += w * sw * (-v.score) * (v.cls === "badLikely" ? 1.5 : 1); if (w >= 0.3) risks.push({ f, s, w, kind: "neg", sev: w * sw * (-v.score) }); }
            else reward += w * sw * v.score;
          }
        }
        if (excluded) continue;
        scored.push({ P, final: reward - 2 * penalty - 0.3 * unknown, reward, penalty, risks });
      }
      scored.sort((a, b) => b.final - a.final);
      const picks = [], houses = new Set(), lineage = new Set();
      for (const s of scored) {
        const key = s.P.cloneOf || s.P.id;               /* never recommend a clone next to its original */
        if (houses.has(s.P.house) || lineage.has(key)) continue;
        picks.push(s); houses.add(s.P.house); lineage.add(key);
        if (picks.length === 3) break;
      }
      return { picks, badAny, likely };
    }

    /* One unrated verified perfume that isolates a possible deal-breaker seen once. */
    function settleSuggestion(prof, ratings) {
      const poss = Object.entries(prof).filter(([, v]) => v.cls === "badPossible" && v.n === 1);
      for (const [f, v] of poss) {
        const ev = v.evidence.find(e => e.stage === "drydown") || v.evidence[0]; if (!ev) continue;
        const others = Object.keys(ev.perfume.stages[ev.stage]).filter(o => o !== f && ev.perfume.stages[ev.stage][o] >= 0.4);
        if (!others.length) continue;
        const cand = PERFUMES.filter(Q => !ratings[Q.id] && (Q.stages.drydown[f] || 0) >= 0.6 && others.every(o => (Q.stages.drydown[o] || 0) < 0.2));
        if (cand.length) return { target: cand[0], f, others };
      }
      return null;
    }

    return { STAGES, PERFUMES, byId, applyEvidence, buildAuto, derived, resolve, computeProfile, recommend, settleSuggestion };
  }

  return { create, STAGES };
})();
