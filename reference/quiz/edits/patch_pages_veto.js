const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (f, pairs) => {
  let s = fs.readFileSync(f, "utf8");
  for (const [a, b] of pairs) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${f}: ${n} matches: ${a.slice(0, 70)}`); s = s.replace(a, () => b); }
  fs.writeFileSync(f, s);
};

edit("site/js/quiz.js", [
  /* strings */
  [`      fromBottles: "From your bottles:", has: "has",`,
   `      why: likes => \`Has \${likes}, which you like.\`, clearOf: fams => \`Free of \${fams}.\`,
      watch: {
        avoid: (f, s, top) => \`A light touch of \${f} in the \${s}, which you said you avoid; \${top} leads.\`,
        avoidOpening: f => \`A touch of \${f} in the opening only, which you said you avoid; it fades within the hour.\`,
        neg: (f, s) => \`Some \${f} in the \${s}, which may be a deal-breaker for you: try a sample first.\`,
        mixed: (f, s) => \`\${f.charAt(0).toUpperCase() + f.slice(1)} in the \${s}: it went well in one of your bottles and badly in another.\`,
        unknown: (f, s) => \`Led by \${f} in the \${s}, which you have not tried yet: a sample will tell.\`
      },
      stageWord: { opening: "opening", heart: "heart", drydown: "base" },
      contradict: (note, bottles, many, f) => \`You said you avoid \${note}, but \${bottles}, which you kept, \${many ? "have" : "has"} \${f}, so the picks do not leave it out. Perhaps another kind of \${note} is what bothers you.\`,
      fromBottles: "From your bottles:", has: "has",`],
  [`      fromBottles: "من عطورك:", has: "فيه",`,
   `      why: likes => \`فيه \${likes}، من العائلات التي تحبها.\`, clearOf: fams => \`خالٍ من \${fams}.\`,
      watch: {
        avoid: (f, s, top) => \`فيه لمسة خفيفة من \${f} في \${s}، مما قلت إنك تتجنبه، لكن الغالب عليه \${top}.\`,
        avoidOpening: f => \`فيه لمسة من \${f} في البداية فقط، مما قلت إنك تتجنبه، وتختفي خلال ساعة.\`,
        neg: (f, s) => \`فيه شيء من \${f} في \${s}، وقد يفسد العطر عليك: جرّب عيّنة أولاً.\`,
        mixed: (f, s) => \`فيه \${f} في \${s}، وقد نجح معك في عطر وانقلب عليك في آخر.\`,
        unknown: (f, s) => \`يغلب عليه \${f} في \${s}، ولم تجرّبه بعد: العيّنة ستخبرك.\`
      },
      stageWord: { opening: "البداية", heart: "القلب", drydown: "القاعدة" },
      contradict: (note, bottles, many, f) => many
        ? \`قلت إنك تتجنب \${note}، لكن \${bottles}، وقد احتفظت بها، فيها \${f}، لذلك لا تستبعده الترشيحات. ربما ما يزعجك نوع آخر من \${note}.\`
        : \`قلت إنك تتجنب \${note}، لكن \${bottles} الذي احتفظت به فيه \${f}، لذلك لا تستبعده الترشيحات. ربما ما يزعجك نوع آخر من \${note}.\`,
      fromBottles: "من عطورك:", has: "فيه",`],
  /* the avoided notes go to the engine and the count */
  [`  const recommend = prof => E.recommend(prof, ratings);`,
   `  /* the note cards the visitor avoided (notes.js): a veto on the picks unless a kept bottle says otherwise */
  const avoided = () => N.avoidedNotes(quiz);
  const recommend = prof => E.recommend(prof, ratings, avoided());`],
  [`    const total = E.PERFUMES.length, out = E.ruledOut(prof).length;`, `    const total = E.PERFUMES.length, out = E.ruledOut(prof, avoided()).length;`],
  [`    const ruled = E.ruledOut(prof).length;`, `    const ruled = E.ruledOut(prof, avoided()).length;`],
  /* the pick card */
  [`  /* a pick as a tile: the bottle, its name, what it has that you like and what it is free of */
  function pickTileHtml(pick, prof) {
    const P = pick.P, PP = resolve(P.id) || P;
    const strong = st => Object.entries(P.stages[st] || {}).filter(([, w]) => w >= 0.5);
    const likes = new Set(byStrength(prof, ["goodLikely", "goodPossible"]));
    const has = strong("drydown").concat(strong("heart")).filter(([f]) => likes.has(f)).sort((a, b) => b[1] - a[1]).map(([f]) => f)[0];
    const carries = f => ["opening", "heart", "drydown"].some(st => (P.stages[st][f] || 0) >= 0.3);
    const free = byStrength(prof, ["badLikely", "badPossible"]).find(f => !carries(f));
    const chips = (has ? \`<span class="qchip good sm"><span class="sr">\${esc(t().has)} </span>\${esc(famShort(has))}</span>\` : "")
      + (free ? \`<span class="qchip free sm">\${esc(t().without(famShort(free)))}</span>\` : "");
    const q = encodeURIComponent(P.house + " " + P.name);
    const sample = (lang === "ar" ? CONFIG.links.sampleSA : CONFIG.links.sampleUS).replace("{q}", q);
    return \`<div class="rec">\${imgTag(PP)}<b>\${esc(pname(P))}</b><span class="qtile-house">\${esc(P.house)}</span>
      \${chips ? \`<div class="qchips">\${chips}</div>\` : ""}
      <a class="btn primary qsample" href="\${sample}" target="_blank" rel="noopener sponsored" data-event="\${esc("sample:" + P.id)}">\${esc(t().getSample)}</a>
      <a class="qbottle" href="\${CONFIG.links.bottle.replace("{q}", q)}" target="_blank" rel="noopener sponsored" data-event="\${esc("sample:" + P.id)}">\${esc(t().bottle)}</a></div>\`;
  }`,
   `  /* A family's short name inside a sentence: lower case in English, as written in Arabic. */
  const famIn = f => low(famShort(f));
  /* A note card's name inside a sentence, brackets dropped: "musk"; in Arabic with the article, "المسك". */
  const noteIn = id => {
    const n = QUIZ.notePicker.flatMap(s => s.notes).find(x => x.id === id); if (!n) return id;
    const w = (lang === "ar" ? n.ar : n.en).replace(/\\s*\\(.*\\)\\s*/, "").trim();
    return lang === "ar" ? (/^ال|\\s/.test(w) ? w : "ال" + w) : w.toLowerCase();
  };
  /* A pick as a card: the bottle and its name, then why it was chosen (the families it has that the visitor likes,
     the deal-breakers it is free of) and, only when there is one, the thing to watch for and why it still made it. */
  function pickTileHtml(pick) {
    const P = pick.P, PP = resolve(P.id) || P, r = pick.reason || { likes: [], clear: [], watch: null };
    const lines = [];
    if (r.likes.length) lines.push(\`<div class="why">\${esc(t().why(listJoin(r.likes.map(famIn))))}</div>\`);
    if (r.clear.length) lines.push(\`<div class="why">\${esc(t().clearOf(listJoin(r.clear.map(famIn))))}</div>\`);
    const w = r.watch;
    if (w) {
      const W = t().watch, s = t().stageWord[w.s];
      const text = w.kind === "avoid" ? W.avoid(famIn(w.f), s, w.top ? famIn(w.top) : famIn(w.f)) : w.kind === "avoidOpening" ? W.avoidOpening(famIn(w.f)) : W[w.kind](famIn(w.f), s);
      lines.push(\`<div class="risk">\${esc(text)}</div>\`);
    }
    const q = encodeURIComponent(P.house + " " + P.name);
    const sample = (lang === "ar" ? CONFIG.links.sampleSA : CONFIG.links.sampleUS).replace("{q}", q);
    return \`<div class="rec qpick"><div class="qpick-head">\${imgTag(PP)}<div class="grow"><b>\${esc(pname(P))}</b><span class="qtile-house">\${esc(P.house)}</span></div></div>
      \${lines.join("")}
      <div class="qpick-links"><a class="btn primary qsample" href="\${sample}" target="_blank" rel="noopener sponsored" data-event="\${esc("sample:" + P.id)}">\${esc(t().getSample)}</a>
      <a class="qbottle" href="\${CONFIG.links.bottle.replace("{q}", q)}" target="_blank" rel="noopener sponsored" data-event="\${esc("sample:" + P.id)}">\${esc(t().bottle)}</a></div></div>\`;
  }
  /* When a kept bottle carries a note the visitor said they avoid, the picks follow the bottle; this says so. */
  function contradictHtml(list) {
    const seen = new Set(), out = [];
    for (const c of list || []) {
      if (seen.has(c.note) || !c.perfumes.length) continue; seen.add(c.note);
      const names = c.perfumes.map(id => resolve(id)).filter(Boolean).map(pname);
      out.push(\`<p class="qcontra">\${esc(t().contradict(noteIn(c.note), listJoin(names), names.length > 1, famIn(c.f)))}</p>\`);
    }
    return out.join("");
  }`],
  [`      return picks.length ? \`<div class="recs recs-tiles">\${picks.map(pk => pickTileHtml(pk, prof)).join("")}</div>\` : "";`,
   `      return picks.length ? \`<div class="recs recs-list">\${picks.map(pk => pickTileHtml(pk)).join("")}</div>\` : "";`],
  [`      \${tasteCardHtml(prof, ids)}<p class="qcompare" id="qcompare">`,
   `      \${tasteCardHtml(prof, ids)}\${contradictHtml(recommend(prof).contradicted)}<p class="qcompare" id="qcompare">`]
]);

edit("site/js/app.js", [
  [`  const recommend = prof => E.recommend(prof, ratings);`,
   `  /* the quiz's avoided note cards veto picks unless a kept bottle carries the note (engine.recommend) */
  const recommend = prof => E.recommend(prof, ratings, N.avoidedNotes(quiz));`],
  [`    host.innerHTML = \`<div class="recs">\` + picks.map(({ P, risks }) => {`,
   `    host.innerHTML = \`<div class="recs">\` + picks.map(({ P, reason }) => {`],
  [`      const risk = risks.sort((a, b) => b.sev - a.sev)[0];
      const riskLine = risk ? (risk.kind === "unknown" ? t().riskUnknown(fam(risk.f), stageName(risk.s)) : risk.kind === "mixed" ? t().riskMixed(fam(risk.f), stageName(risk.s)) : risk.kind === "told" ? (saidAvoid(risk.f) ? t().riskTold : t().riskLean)(fam(risk.f), stageName(risk.s)) : t().riskNeg(fam(risk.f), stageName(risk.s))) : "";`,
   `      /* one thing to watch for at most, chosen by the engine (a family the visitor avoids, a possible deal-breaker, a
         family their bottles split on, an untried family that leads) */
      const risk = reason && reason.watch;
      const riskLine = risk ? ((risk.kind === "avoid" || risk.kind === "avoidOpening") ? (saidAvoid(risk.f) ? t().riskTold : t().riskLean)(fam(risk.f), stageName(risk.s)) : risk.kind === "unknown" ? t().riskUnknown(fam(risk.f), stageName(risk.s)) : risk.kind === "mixed" ? t().riskMixed(fam(risk.f), stageName(risk.s)) : t().riskNeg(fam(risk.f), stageName(risk.s))) : "";`]
]);

edit("site/site.css", [[".qmore { margin-top: 14px; }\n",
  ".qmore { margin-top: 14px; }\n" +
  "/* the picks as stacked cards: the bottle and name, why it was chosen, what to watch for, then the links */\n" +
  ".recs-list { grid-template-columns: minmax(0, 1fr); gap: 10px; }\n" +
  ".qpick { padding: 14px 16px 14px; }\n" +
  ".qpick-head { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }\n" +
  ".qpick-head .thumb { width: 72px; height: 72px; border: 0; box-shadow: none; flex: none; }\n" +
  ".qpick-head b { display: block; font-family: var(--font-display); font-weight: 600; font-size: 20px; line-height: 1.25; }\n" +
  "[dir=\"rtl\"] .qpick-head b { font-weight: 700; line-height: 1.5; }\n" +
  ".qpick .why, .qpick .risk { font-size: 14.5px; line-height: 1.55; margin-top: 6px; }\n" +
  ".qpick-links { display: flex; align-items: center; gap: 14px; margin-top: 12px; flex-wrap: wrap; }\n" +
  ".qpick-links .qsample { min-width: 120px; }\n" +
  "/* a note the visitor avoids that their own bottles carry: said plainly under the taste card */\n" +
  ".qcontra { margin: 12px 2px 0; font-size: 14.5px; line-height: 1.6; color: var(--ink-2); padding-inline-start: 12px; border-inline-start: 3px solid var(--oil); }\n"]]);
console.log("ok");
