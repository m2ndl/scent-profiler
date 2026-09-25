/* Profile engine: merges the evidence layers into each perfume, builds the wearer's profile from their
   ratings and picks the recommendations. It holds no page, storage or language, so the page (app.js),
   the tests and the tools run the same code. */

window.PP_ENGINE = (function () {
  "use strict";
  const STAGES = ["opening", "heart", "drydown"];

  /* The stage where a perfume holds family f most strongly; a tie goes to the later stage. null when the
     perfume does not hold f. Note answers apply in this stage, and the note questions ask about it. */
  function strongestStage(P, f) {
    if (!P || !P.stages) return null;
    let best = null, bw = 0;
    for (const s of STAGES) { const w = (P.stages[s] || {})[f] || 0; if (w > 0 && w >= bw) { best = s; bw = w; } }
    return best;
  }

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
    const TOLD_W = 0.3; /* one told item at full weight, against 0.75 for one strong drydown tag on a worn bottle */
    const TOLD_PRIOR = TOLD_W; /* a family with told items only scores tsum / (twsum + TOLD_PRIOR): one full-weight
                                  item gives 0.5, two agreeing ones about 0.67, a 0.3-weight side effect about 0.23 */

    /* state.told (optional): what the visitor said in words, [{ f, value: 1 | -1, w: 0..1, src }]. Told items
       keep their own sums and count only for a family with no strong bottle evidence (n = 0), so they can
       reorder picks but never set a class or an exclusion. */
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
        /* note answers: an observation of one family in its strongest stage, where it replaces the stage rating;
           an answer on a family the perfume no longer holds is skipped. An unnoticed family gives no evidence. */
        const unnoticed = new Set(Array.isArray(r.unnoticed) ? r.unnoticed : []);
        const answers = [];
        for (const [f, val] of Object.entries(r.noteAnswers || {})) {
          if (!Number.isFinite(val) || unnoticed.has(f)) continue;
          const s = strongestStage(P, f); if (s) answers.push([f, val, s]);
        }
        const answered = (f, s) => answers.some(a => a[0] === f && a[2] === s);
        for (const s of STAGES) {
          const v = r[s]; if (v == null) continue;
          const sw = STAGE_W[s] * cm;
          for (const [f, w] of Object.entries(P.stages[s] || {})) {
            if (unnoticed.has(f) || answered(f, s)) continue;
            const prov = (P.prov && P.prov[s] && P.prov[s][f]) || "curated";
            add(f, v, w * sw * (PROV_W[prov] || 0.75), { perfume: P, stage: s, value: v, strong: w >= STRONG, prov });
          }
          const cv = Math.min(-1.5, v - 0.5);
          for (const cid of (r.chips && r.chips[s]) || []) {
            const chip = CHIPS.find(c => c.id === cid); if (!chip) continue;
            for (const [f, cw] of Object.entries(chip.fams)) {
              if (unnoticed.has(f)) continue;
              const present = (P.stages[s] || {})[f] || 0; if (present < 0.2) continue;
              add(f, cv, cw * present * sw * 0.6, { perfume: P, stage: s, chip: cid, value: cv, strong: present >= STRONG });
            }
          }
        }
        for (const [f, val, s] of answers) {
          const w = P.stages[s][f];
          const prov = (P.prov && P.prov[s] && P.prov[s][f]) || "curated";
          add(f, val, w * STAGE_W[s] * cm * (PROV_W[prov] || 0.75), { perfume: P, stage: s, value: val, strong: w >= STRONG, prov, note: true });
        }
      }
      const T = {};
      for (const it of Array.isArray(state.told) ? state.told : []) {
        if (!it || !it.f || !Number.isFinite(it.value) || !(it.w > 0)) continue;
        const t = T[it.f] || (T[it.f] = { tsum: 0, twsum: 0, evidence: [] });
        const w = TOLD_W * it.w;
        t.tsum += it.value * w; t.twsum += w;
        t.evidence.push({ told: true, src: it.src, stage: null, value: it.value, strong: false, prov: "told" });
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
      for (const [f, t] of Object.entries(T)) {
        if (!out[f]) out[f] = { score: t.tsum / (t.twsum + TOLD_PRIOR), n: 0, cls: "neutral", evidence: [], pos: 0, neg: 0 };
        else if (out[f].n === 0) out[f].score = (F[f].sum + t.tsum) / (F[f].wsum + t.twsum);
        out[f].toldScore = t.tsum / t.twsum;
        out[f].toldNeg = t.evidence.every(e => e.value < 0);
        out[f].toldEvidence = t.evidence;
      }
      return out;
    }

    /* the strength at which a deal-breaker family rules a perfume out: 0.5 in the drydown or 0.7 in the heart */
    const atStrength = (s, w) => (s === "drydown" && w >= 0.5) || (s === "heart" && w >= 0.7);

    /* Notes the visitor said they avoid (notes.js avoidedNotes: [{ id, fams: { family: weight }, words: [name words] }]).
       An avoided family (weight 0.5 or more on the card) binds the picks unless a bottle the visitor kept holds it
       strongly (prof[f].pos > 0): then the bottles win, and the family is returned as a contradiction for the page to
       explain. Binding means no pick where that family leads the heart or the base, or whose name carries the note. */
    function vetoOf(prof, avoid) {
      const bind = [], contradicted = [];
      for (const a of avoid || []) {
        for (const [f, w] of Object.entries(a.fams || {})) {
          if (w < 0.5) continue;
          const v = prof[f];
          if (v && v.pos > 0) {
            const kept = [...new Set((v.evidence || []).filter(e => e.value > 0 && e.perfume).map(e => e.perfume.id))];
            contradicted.push({ note: a.id, f, perfumes: kept });
          } else bind.push({ note: a.id, f, words: a.words || [] });
        }
      }
      return { bind, contradicted };
    }
    /* a family leads a stage when it is the strongest there, at 0.7 or more */
    const leads = (P, f, s) => { const st = P.stages[s] || {}, w = st[f] || 0; return w >= 0.7 && w >= Math.max(...Object.values(st)); };
    const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const named = (P, words) => words.some(w => w && new RegExp("\\b" + reEsc(w) + "s?\\b", "i").test(P.name));
    const vetoed = (P, veto) => veto.bind.some(b => leads(P, b.f, "heart") || leads(P, b.f, "drydown") || named(P, b.words));

    /* Perfumes a profile rules out: those holding a likely or possible deal-breaker at that strength, and those an
       avoided note rules out. Read-only; recommend() excludes on likely deal-breakers alone, so this count is the
       wider, cautious one. */
    function ruledOut(prof, avoid) {
      const bad = Object.entries(prof).filter(([, v]) => v.cls === "badLikely" || v.cls === "badPossible").map(([f]) => f);
      const veto = vetoOf(prof, avoid);
      return PERFUMES.filter(P => bad.some(f => ["heart", "drydown"].some(s => atStrength(s, P.stages[s][f] || 0))) || vetoed(P, veto)).map(P => P.id);
    }

    /* Why a pick was chosen, as data for the page to put into words: up to two liked families it carries in the heart
       or base, up to two deal-breakers it is free of, and at most one thing to watch for, by priority: a family the
       visitor said they avoid (secondary here, or only in the opening), a possible deal-breaker, a family their words
       lean against (sweet or bitter, a complaint), a family their bottles split on, then a family they have not met
       that leads the heart or base. Traces under 0.3 are not
       named: nearly every perfume carries a little musk. */
    function reasonOf(P, prof, badAny, veto) {
      /* liked: a liked class from the bottles, or, with no bottle on it, a clear lean from what the visitor said */
      const good = v => v && (v.cls === "goodLikely" || v.cls === "goodPossible" || (v.n === 0 && v.score >= 0.3));
      const deep = f => Math.max(P.stages.heart[f] || 0, P.stages.drydown[f] || 0);
      const likes = Object.entries(prof).filter(([f, v]) => good(v) && deep(f) >= 0.4).sort((a, b) => deep(b[0]) * b[1].score - deep(a[0]) * a[1].score).slice(0, 2).map(([f]) => f);
      const clear = badAny.filter(f => (P.stages.drydown[f] || 0) < 0.2).slice(0, 2);
      const top = ["drydown", "heart"].map(s => Object.entries(P.stages[s] || {}).sort((a, b) => b[1] - a[1])[0]).filter(Boolean).sort((a, b) => b[1] - a[1])[0];
      const where = f => { const w = STAGES.map(s => [s, P.stages[s][f] || 0]).sort((a, b) => b[1] - a[1]); return w[0]; };
      let watch = null;
      for (const b of veto.bind) {
        const [s, w] = where(b.f); if (w < 0.3) continue;
        const onlyOpening = (P.stages.heart[b.f] || 0) < 0.3 && (P.stages.drydown[b.f] || 0) < 0.3;
        watch = { kind: onlyOpening ? "avoidOpening" : "avoid", f: b.f, s, note: b.note, top: top ? top[0] : null }; break;
      }
      const inDeep = (pred, min) => Object.entries(prof).filter(([f, v]) => pred(v) && deep(f) >= min).sort((a, b) => deep(b[0]) - deep(a[0]))[0];
      if (!watch) { const x = inDeep(v => v.cls === "badPossible" || v.cls === "badLikely", 0.3); if (x) watch = { kind: "neg", f: x[0], s: where(x[0])[0] }; }
      if (!watch) {
        const x = Object.entries(prof).filter(([f, v]) => v.n === 0 && v.score < 0 && !veto.bind.some(b => b.f === f) && where(f)[1] >= 0.3).sort((a, b) => a[1].score - b[1].score)[0];
        if (x) watch = { kind: "lean", f: x[0], s: where(x[0])[0] };
      }
      if (!watch) { const x = inDeep(v => v.cls === "mixed", 0.3); if (x) watch = { kind: "mixed", f: x[0], s: where(x[0])[0] }; }
      if (!watch) {
        const x = ["drydown", "heart"].map(s => Object.keys(P.stages[s] || {}).filter(f => !prof[f] && leads(P, f, s)).map(f => [f, s])[0]).filter(Boolean)[0];
        if (x) watch = { kind: "unknown", f: x[0], s: x[1] };
      }
      return { likes, clear, watch };
    }

    function recommend(prof, ratings, avoid) {
      const likely = Object.entries(prof).filter(([, v]) => v.cls === "badLikely").map(([f]) => f);
      const badAny = Object.entries(prof).filter(([, v]) => v.cls === "badLikely" || v.cls === "badPossible").map(([f]) => f);
      const veto = vetoOf(prof, avoid);
      const scored = [];
      for (const P of PERFUMES) {
        if (ratings[P.id] || vetoed(P, veto)) continue;
        let penalty = 0, reward = 0, unknown = 0, excluded = false;
        const risks = [];
        for (const s of STAGES) {
          const sw = STAGE_W[s];
          for (const [f, w] of Object.entries(P.stages[s])) {
            const v = prof[f];
            if (likely.includes(f) && atStrength(s, w)) excluded = true;
            if (!v) { if (w >= 0.5) { unknown += w * sw; risks.push({ f, s, w, kind: "unknown", sev: w * sw }); } continue; }
            if (v.cls === "mixed") { risks.push({ f, s, w, kind: "mixed", sev: w * sw * 0.8 }); penalty += w * sw * 0.3; continue; }
            if (v.score < 0) { penalty += w * sw * (-v.score) * (v.cls === "badLikely" ? 1.5 : 1); if (w >= 0.3) risks.push({ f, s, w, kind: v.n === 0 && v.toldNeg ? "told" : "neg", sev: w * sw * (-v.score) }); }
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
      for (const p of picks) p.reason = reasonOf(p.P, prof, badAny, veto);
      return { picks, badAny, likely, contradicted: veto.contradicted };
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

    return { STAGES, PERFUMES, byId, applyEvidence, buildAuto, derived, resolve, strongestStage, computeProfile, recommend, settleSuggestion, ruledOut };
  }

  return { create, STAGES, strongestStage };
})();
