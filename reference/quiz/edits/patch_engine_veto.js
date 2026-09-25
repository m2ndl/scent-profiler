const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (f, pairs) => {
  let s = fs.readFileSync(f, "utf8");
  for (const [a, b] of pairs) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${f}: ${n} matches: ${a.slice(0, 70)}`); s = s.replace(a, () => b); }
  fs.writeFileSync(f, s);
};

edit("site/js/engine.js", [
/* ruledOut: deal-breakers, plus perfumes an avoided note rules out */
[`    /* Perfumes a profile rules out: those holding a likely or possible deal-breaker at that strength. Read-only;
       recommend() excludes on likely deal-breakers alone, so this count is the wider, cautious one. */
    function ruledOut(prof) {
      const bad = Object.entries(prof).filter(([, v]) => v.cls === "badLikely" || v.cls === "badPossible").map(([f]) => f);
      return PERFUMES.filter(P => bad.some(f => ["heart", "drydown"].some(s => atStrength(s, P.stages[s][f] || 0)))).map(P => P.id);
    }`,
`    /* Notes the visitor said they avoid (notes.js avoidedNotes: [{ id, fams: { family: weight }, words: [name words] }]).
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
    const reEsc = x => x.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
    const named = (P, words) => words.some(w => w && new RegExp("\\\\b" + reEsc(w) + "s?\\\\b", "i").test(P.name));
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
       visitor said they avoid (secondary here, or only in the opening), a possible deal-breaker, a family their
       bottles split on, then a family they have not met that leads the heart or base. Traces under 0.3 are not
       named: nearly every perfume carries a little musk. */
    function reasonOf(P, prof, badAny, veto) {
      const good = v => v && (v.cls === "goodLikely" || v.cls === "goodPossible");
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
      if (!watch) { const x = inDeep(v => v.cls === "mixed", 0.3); if (x) watch = { kind: "mixed", f: x[0], s: where(x[0])[0] }; }
      if (!watch) {
        const x = ["drydown", "heart"].map(s => Object.keys(P.stages[s] || {}).filter(f => !prof[f] && leads(P, f, s)).map(f => [f, s])[0]).filter(Boolean)[0];
        if (x) watch = { kind: "unknown", f: x[0], s: x[1] };
      }
      return { likes, clear, watch };
    }`],
/* recommend: the veto and the reasons */
[`    function recommend(prof, ratings) {
      const likely = Object.entries(prof).filter(([, v]) => v.cls === "badLikely").map(([f]) => f);
      const badAny = Object.entries(prof).filter(([, v]) => v.cls === "badLikely" || v.cls === "badPossible").map(([f]) => f);
      const scored = [];
      for (const P of PERFUMES) {
        if (ratings[P.id]) continue;`,
`    function recommend(prof, ratings, avoid) {
      const likely = Object.entries(prof).filter(([, v]) => v.cls === "badLikely").map(([f]) => f);
      const badAny = Object.entries(prof).filter(([, v]) => v.cls === "badLikely" || v.cls === "badPossible").map(([f]) => f);
      const veto = vetoOf(prof, avoid);
      const scored = [];
      for (const P of PERFUMES) {
        if (ratings[P.id] || vetoed(P, veto)) continue;`],
[`        if (picks.length === 3) break;
      }
      return { picks, badAny, likely };
    }`,
`        if (picks.length === 3) break;
      }
      for (const p of picks) p.reason = reasonOf(p.P, prof, badAny, veto);
      return { picks, badAny, likely, contradicted: veto.contradicted };
    }`]
]);
/* recommend() is declared before ruledOut in the file: the helpers it calls are function declarations or consts
   defined before any call is made at runtime, so the order is safe. */
edit("site/js/notes.js", [
[`    return { questions, toldItems };`,
`    /* The note-picker cards the visitor avoided, for engine.recommend's veto: the card's families (its own fams, else
       the mapper's) and the word a perfume's name would carry ("musk" in Roses Musk), brackets dropped. */
    function avoidedNotes(quiz) {
      const answers = (quiz && quiz.notes) || {}, out = [];
      for (const screen of (D.QUIZ || {}).notePicker || []) for (const n of screen.notes) {
        if (answers[n.id] !== -1) continue;
        out.push({ id: n.id, fams: n.fams || M.famsForNote(n.en) || {}, words: [n.en.replace(/\\s*\\(.*\\)\\s*/, "").trim()] });
      }
      return out;
    }

    return { questions, toldItems, avoidedNotes };`]
]);
console.log("ok");
