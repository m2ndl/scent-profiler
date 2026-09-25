/* Note questions: which of a perfume's families to ask a wearer about, in which stage, and with which of
   its listed note words. Shared by the quiz and the profiler so both ask the same rows. It holds no page,
   storage or language: the page picks the words for its language and writes the answers.
   It also turns the quiz's word answers into the engine's told items, so both pages build the same list.
   Use: const N = PP_NOTES.create(D, M, E); N.questions(P, "worn"); N.toldItems(quiz) */

window.PP_NOTES = (function () {
  "use strict";
  const STAGES = ["opening", "heart", "drydown"];
  const MIN = 0.4;       /* a family is asked about at this weight or more in its strongest stage */
  const PER_STAGE = { opening: 1, heart: 2, drydown: 3 };   /* rows per stage */
  const CAP = 5;         /* rows per perfume */
  const SHOP_CAP = 2;    /* a shop trial: opening and heart rows only */

  /* A perfume's note lists by stage: "a, b / c / d, e", with the Arabic list in the same shape. */
  function stageLists(text, sep) {
    const parts = String(text || "").split("/");
    const out = {};
    STAGES.forEach((s, i) => { out[s] = (parts[i] || "").split(sep).map(x => x.trim()).filter(x => x && x !== "–" && x !== "-"); });
    return out;
  }

  /* D: PP_DATA, M: PP_MAP (famsForNote), E: an engine from PP_ENGINE.create (strongestStage). */
  function create(D, M, E) {
    const famWeight = (word, f) => { const fams = M.famsForNote(word); return (fams && fams[f]) || 0; };

    /* The candidate note words for family f: `own` from the row's stage, `other` from the other two stages.
       Each word keeps how strongly it maps to f (m) and its Arabic by position, or null when that stage's
       Arabic and English lists differ in length. */
    function wordsFor(P, f, stage) {
      const notes = P.notes || {};
      const en = stageLists(notes.en, ","), ar = stageLists(notes.ar, /[،,]/);
      const pick = stages => {
        const out = [];
        for (const s of stages) en[s].forEach((w, i) => {
          const m = famWeight(w, f);
          if (m > 0 && !out.some(x => x.en === w)) out.push({ en: w, ar: en[s].length === ar[s].length ? ar[s][i] : null, m });
        });
        return out;
      };
      return { own: pick([stage]), other: pick(STAGES.filter(s => s !== stage)) };
    }

    /* At most five rows { f, stage, w, words: { en, ar } } in stage order. Candidates are the families at
       0.4 or more in their strongest stage (ties to the later stage). Each stage keeps its strongest rows,
       one in the opening, two in the heart and three in the drydown; above five in all, the weakest
       drydown row goes. kind "shop": opening and heart rows only, the two strongest.
       Words: the row's own stage first, then the other two. A word goes on the row whose family it maps to
       most strongly; a row left without a word takes an unshared word from the other stages, and repeats a
       word only when there is none. ar is empty when any of the row's words has no Arabic. */
    function questions(P, kind) {
      if (!P || !P.stages) return [];
      const seen = new Set(), cand = [];
      for (const s of STAGES) for (const f of Object.keys(P.stages[s] || {})) {
        if (seen.has(f)) continue; seen.add(f);
        const stage = E.strongestStage(P, f); if (!stage) continue;
        const w = P.stages[stage][f];
        if (w >= MIN) cand.push({ f, stage, w, order: cand.length });
      }
      const shop = kind === "shop";
      const si = s => STAGES.indexOf(s);
      /* stronger first, then the later stage, then listed first */
      const byStrength = (a, b) => (b.w - a.w) || (si(b.stage) - si(a.stage)) || (a.order - b.order);
      let kept = [];
      for (const s of STAGES) if (!(shop && s === "drydown")) kept.push(...cand.filter(r => r.stage === s).sort(byStrength).slice(0, PER_STAGE[s]));
      while (kept.length > CAP) { const dry = kept.filter(r => r.stage === "drydown"); kept.splice(kept.indexOf(dry[dry.length - 1]), 1); }
      if (shop) kept = kept.sort(byStrength).slice(0, SHOP_CAP);
      kept.sort((a, b) => (si(a.stage) - si(b.stage)) || (b.w - a.w) || (a.order - b.order));

      const rows = kept.map(r => { const c = wordsFor(P, r.f, r.stage); return { r, c, first: c.own.length ? c.own : c.other }; });
      const owner = {};   /* word: the row it maps to most strongly; ties to the stronger row, then the earlier */
      rows.forEach((x, i) => x.first.forEach(c => {
        const o = owner[c.en];
        if (!o || c.m > o.m || (c.m === o.m && x.r.w > o.w)) owner[c.en] = { i, m: c.m, w: x.r.w };
      }));
      rows.forEach((x, i) => { x.words = x.first.filter(c => owner[c.en].i === i); });
      const used = new Set(rows.flatMap(x => x.words.map(c => c.en)));
      for (const x of rows) {
        if (x.words.length) continue;
        x.words = x.first === x.c.own ? x.c.other.filter(c => !used.has(c.en)) : [];
        if (!x.words.length) x.words = x.first;
        x.words.forEach(c => used.add(c.en));
      }
      return rows.map(x => ({ f: x.r.f, stage: x.r.stage, w: x.r.w,
        words: { en: x.words.map(c => c.en), ar: x.words.every(c => c.ar != null) ? x.words.map(c => c.ar) : [] } }));
    }

    /* The quiz's word answers as told items for computeProfile, [{ f, value: 1 | -1, w, src }]:
       - quiz.notes { noteId: 1 | -1 }: one item per family the note word maps to, with the mapper weight, or
         per family in the picker entry's own fams when it has them;
       - quiz.taste "bitter" | "sweet": QUIZ.taste, +1 on the chosen side and -1 on the other; other answers add nothing;
       - quiz.told [chipId]: one item per family in the chip's map, value -1. An old string value is read as
         a one-item array, and "none" as [].
       src is note:<id>, taste:<bitter|sweet> or chip:<id>. */
    function toldItems(quiz) {
      const q = quiz || {}, out = [], Q = D.QUIZ || {};
      const push = (fams, value, src) => { for (const [f, w] of Object.entries(fams || {})) if (w > 0) out.push({ f, value, w, src }); };
      const answers = q.notes || {};
      for (const screen of Q.notePicker || []) for (const n of screen.notes) {
        const v = answers[n.id];
        if (v === 1 || v === -1) push(n.fams || M.famsForNote(n.en), v, "note:" + n.id);
      }
      const side = q.taste === "bitter" || q.taste === "sweet" ? q.taste : null;
      if (side && Q.taste) {
        const other = side === "bitter" ? "sweet" : "bitter";
        push(Q.taste[side], 1, "taste:" + side);
        push(Q.taste[other], -1, "taste:" + side);
      }
      for (const id of normTold(q).told) {
        const chip = D.CHIPS.find(c => c.id === id);
        if (chip) push(chip.fams, -1, "chip:" + id);
      }
      return out;
    }

    return { questions, toldItems };
  }

  /* quiz.told as stored now ({ told: [chipId], toldNone }), from either form: an old string value is a
     one-item array, and "none" is [] with toldNone true. Repeated ids are kept once. */
  function normTold(quiz) {
    const q = quiz || {}, t = q.told;
    if (t === "none") return { told: [], toldNone: true };
    const list = Array.isArray(t) ? t : typeof t === "string" && t ? [t] : [];
    const told = list.filter((x, i) => typeof x === "string" && x && x !== "none" && list.indexOf(x) === i);
    return { told, toldNone: !told.length && (!!q.toldNone || list.includes("none")) };
  }

  return { create, STAGES, stageLists, normTold };
})();
