"""One-off: applies the independent review's fixes to the rebuilt front page (29 Sep 2026). Exact-match edits; fails on
a second run. Files: tools/build_landing.js, site/js/landing.js, site/landing.css."""
ROOT = r"C:\Users\malha\Desktop\Webapps\perfume-profiler"


def edit(rel, pairs):
    p = ROOT + "\\" + rel
    s = open(p, encoding="utf-8").read()
    for a, b in pairs:
        assert s.count(a) == 1, (rel, a[:80])
        s = s.replace(a, b)
    open(p, "w", encoding="utf-8", newline="\n").write(s)


edit(r"tools\build_landing.js", [
    ('''     - for the 1,000-perfume test, the families a visitor can say they like and the ones they can say they cannot
       stand, and for every catalogue perfume one number whose bits say which of those families it clearly carries;''',
     '''     - for the 1,000-perfume test, the families a visitor can say they like and the ones they can say they cannot
       stand, and for every catalogue perfume one number whose bits say which liked families it clearly carries and
       which disliked families would rule it out (the engine's own ruledOut, so the test counts as the quiz does);'''),
    ('''const DISLIKES = ["woody_amber", "white_musk", "patchouli", "oud_smoky", "leather_smoky", "iris_powdery", "aquatic_marine", "incense_resin"];''',
     '''const DISLIKES = ["woody_amber", "white_musk", "patchouli", "cedar_dry", "leather_smoky", "oud_smoky", "iris_powdery", "incense_resin"];'''),
    ('''  const h = html(), one = (re, what) => { const m = re.exec(h); if (!m) fail(what); return m[1]; };''',
     '''  const h = html(), one = (re, what) => { const m = re.exec(h); if (!m) fail(what); return m[1]; };
  /* names are read from the page's markup: undo its escaping, since the front page escapes them again */
  const unesc = x => x.replace(/&(amp|lt|gt|quot|#39);/g, (m, k) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[k]));'''),
    ('''    palate: one(/<div class="qname-t"><p class="eyebrow">[^<]*<\\/p><h1>([^<]+)<\\/h1>/, "the palate's name"),''',
     '''    palate: unesc(one(/<div class="qname-t"><p class="eyebrow">[^<]*<\\/p><h1>([^<]+)<\\/h1>/, "the palate's name")),'''),
    ('''    breakers: [...bad.matchAll(/<span class="qchip bad">([^<]+)<\\/span>/g)].map(m => m[1]),''',
     '''    breakers: [...bad.matchAll(/<span class="qchip bad">([^<]+)<\\/span>/g)].map(m => unesc(m[1])),'''),
    ('''  const w = loadSite("data", "mapper", "bottles", "materials");''',
     '''  const w = loadSite("data", "mapper", "bottles", "materials", "evidence", "engine");'''),
    ('''  /* bit i of a perfume's number: it clearly carries TEST[i] */
  const test = { likes: LIKES, dislikes: DISLIKES, masks: D.PERFUMES.map(P => TEST.reduce((m, f, i) => (carries(P, f) ? m | (1 << i) : m), 0)) };''',
     '''  /* bit i of a perfume's number: it clearly carries the liked family TEST[i], or, for a disliked family, the quiz would
     rule it out if that family were the visitor's deal-breaker */
  const E = w.PP_ENGINE.create(D, M, w.PP_EVIDENCE);
  const outBy = Object.fromEntries(DISLIKES.map(f => [f, new Set(E.ruledOut({ [f]: { cls: "badLikely" } }))]));
  const hit = (P, f) => (outBy[f] ? outBy[f].has(P.id) : carries(P, f));
  const test = { likes: LIKES, dislikes: DISLIKES, masks: D.PERFUMES.map(P => TEST.reduce((m, f, i) => (hit(P, f) ? m | (1 << i) : m), 0)) };'''),
])

edit(r"site\js\landing.js", [
    # English words
    ('''      lede: "Four quick parts find that note, then choose three perfumes for you to try.",
      start: "Get my three picks",''',
     '''      lede: "Four quick parts look for the smell behind it, then choose perfumes for you to try.",
      start: "Find what suits me",'''),
    ('''      triedQ: "Tried it?", triedYes: "Yes, I have", triedNo: "Not yet", triedDone: "Added to your quiz",''',
     '''      triedQ: "Tried it?", triedYes: "Yes", triedNo: "Not yet", triedDone: "Added to your quiz",'''),
    ('''      getWho: (a, b, c, d) => `An example: still uses ${a} and ${b}; ${c} and ${d} turned on them hours later.`,''',
     '''      getWho: (a, b, c, d) => `An example: still uses ${a} and ${b}; ${c} and ${d} turned on them.`,'''),
    ('''      testH: "Tap one smell you can't stand. Watch 1,000 perfumes shrink.",
      testNames: { woody_amber: "Woody amber", white_musk: "Clean musk", patchouli: "Patchouli", oud_smoky: "Smoky oud", leather_smoky: "Leather",
        iris_powdery: "Powdery iris", aquatic_marine: "Marine notes", incense_resin: "Incense" },
      testAll: () => "perfumes in our catalogue",
      testLeft: (n, name) => `left without ${name.toLowerCase()}`,
      testVerdict: (gone, none) => `One smell you can't stand ruled out ${fmtEn(gone)}. Liking rose, vanilla, citrus and the other popular smells rules out only ${fmtEn(none)}.`,''',
     '''      testH: "Tap one smell you can't stand. Watch the count fall from 1,000.",
      testNames: { woody_amber: "Woody ambers", white_musk: "Clean musk", patchouli: "Patchouli", cedar_dry: "Dry cedar", leather_smoky: "Leather",
        oud_smoky: "Smoky oud", iris_powdery: "Powdery iris", incense_resin: "Incense" },
      testAll: () => "perfumes in our catalogue",
      testLeft: (n, name) => `left after ruling out ${name.toLowerCase()}`,
      testVerdict: (gone, none) => `One smell you can't stand ruled out ${fmtEn(gone)}. Only ${fmtEn(none)} of the 1,000 have none of rose, vanilla, citrus and the other popular smells.`,'''),
    ('''      testSrc: "Counts from our catalogue of 1,000 perfumes. A perfume counts for a smell when that family is clearly present in at least one of its stages. The popular smells: rose, white flowers, citrus, warm spices, sandalwood, vanilla and resin amber.",''',
     '''      testSrc: "Counts from our catalogue of 1,000 perfumes. A smell you can't stand rules a perfume out as the quiz does: when its family is strong in the heart or the base. A perfume has a popular smell when that family is clearly present in at least one of its stages. The popular smells: rose, white flowers, citrus, warm spices, sandalwood, vanilla and resin amber.",'''),
    ('''      noseCan: n => `${n} can smell it`, noseCannot: n => `${n} cannot`, noseAbout: "about",''',
     '''      noseCan: n => `${n} can smell it`, noseCannot: n => `${n} cannot`, noseAbout: "about", noseGroup: "Pick a smell",'''),
    ('''      quizH: "Four quick parts, then your three perfumes.",''',
     '''      quizH: "Four quick parts, then perfumes chosen for you.",'''),
    # Arabic words
    ('''      lede: "أربعة أجزاء سريعة تكشف لك هذه النوتة، ثم تختار لك ثلاثة عطور لتجرّبها.",
      start: "اكتشف عطورك الثلاثة",''',
     '''      lede: "أربعة أجزاء سريعة تبحث عن الرائحة التي وراء ذلك، ثم تختار لك عطوراً لتجرّبها.",
      start: "اكتشف ما يناسبك",'''),
    ('''      triedQ: "جرّبته من قبل؟", triedYes: "نعم، جرّبته", triedNo: "ليس بعد", triedDone: "أضفناه إلى اختبارك",''',
     '''      triedQ: "جرّبته من قبل؟", triedYes: "نعم", triedNo: "ليس بعد", triedDone: "أضفناه إلى اختبارك",'''),
    ('''      getPalate: "ذائقتك", getBad: "يفسد العطر عليك", getPicks: "ثلاثة لتجربتها",''',
     '''      getPalate: "ذائقتك", getBad: "ما يفسد العطر عليك", getPicks: "ثلاثة عطور لتجرّبها",'''),
    ('''      getWho: (a, b, c, d) => `مثال: ما زال يستخدم ${a} و${b}، وانقلب عليه ${c} و${d} بعد ساعات.`,''',
     '''      getWho: (a, b, c, d) => `مثال: ما زال يستخدم ${a} و${b}، وانقلب عليه ${c} و${d}.`,'''),
    ('''      testKick: "جرّبها",''', '''      testKick: "جرّب بنفسك",'''),
    ('''      testNames: { woody_amber: "الخشب العنبري", white_musk: "المسك النظيف", patchouli: "الباتشولي", oud_smoky: "العود المدخّن", leather_smoky: "الجلد",
        iris_powdery: "السوسن البودري", aquatic_marine: "النفحات البحرية", incense_resin: "البخور" },
      testAll: n => `${arNoun(n)} في قائمتنا`,
      testLeft: (n, name) => `${arNoun(n)} خالية من ${name}`,
      testVerdict: (gone, none) => `رائحة واحدة لا تطيقها استبعدت ${arPerfumes(gone)}. أما حبّك للورد والفانيلا والحمضيات وغيرها من الروائح الشائعة فلا يستبعد إلا ${arPerfumes(none)}.`,''',
     '''      testNames: { woody_amber: "الأخشاب العنبرية الصناعية", white_musk: "المسك النظيف", patchouli: "الباتشولي", cedar_dry: "الأرز الجاف", leather_smoky: "الجلد",
        oud_smoky: "العود المدخّن", iris_powdery: "السوسن البودري", incense_resin: "البخور" },
      testAll: n => `${arNoun(n)} في قائمتنا`,
      testLeft: (n, name) => `${arNoun(n)} بعد استبعاد ${name}`,
      testVerdict: (gone, none) => `رائحة واحدة لا تطيقها استبعدت ${arPerfumes(gone)}. أما الورد والفانيلا والحمضيات وغيرها من الروائح الشائعة فلا يخلو منها كلها إلا ${arPerfumes(none)} من الألف.`,'''),
    ('''      testSrc: "الأرقام من قائمتنا التي تضم 1000 عطر: يُحسب العطر لرائحة ما حين تظهر عائلتها فيه بوضوح في مرحلة واحدة على الأقل من مراحله. الروائح الشائعة: الورد والزهور البيضاء والحمضيات والتوابل الدافئة والصندل والفانيلا والعنبر الراتنجي.",''',
     '''      testSrc: "الأرقام من قائمتنا التي تضم 1000 عطر. الرائحة التي لا تطيقها تستبعد العطر كما يفعل الاختبار: حين تكون عائلتها قوية في قلبه أو قاعدته. ويُحسب للعطر رائحة شائعة حين تظهر عائلتها فيه بوضوح في مرحلة واحدة على الأقل من مراحله. الروائح الشائعة: الورد والزهور البيضاء والحمضيات والتوابل الدافئة والصندل والفانيلا والعنبر الراتنجي.",'''),
    ('''note: "نحو الثلث لا يشمّونه أبداً، فيبدو لهم العطر المبني عليه أضعف كثيراً مما هو.", g: "musk" },''',
     '''note: "نحو الثلث لا يشمّونه أبداً، فيبدو لهم العطر المبني عليه أضعف بكثير مما هو عليه.", g: "musk" },'''),
    ('''note: "أكثر من يشمّه يقول إن رائحته كالبول، وبعضهم يقول زهور حلوة، ونحو الثلث لا يشمّ شيئاً.", g: "amber" }''',
     '''note: "أكثر من يشمّه يقول إن رائحته كالبول، وبعضهم يجدها كالزهور الحلوة، ونحو الثلث لا يشمّ شيئاً.", g: "amber" }'''),
    ('''      noseCan: n => `${n} يشمّونها`, noseCannot: n => (n === 1 ? "واحد لا يشمّها" : `${n} لا يشمّونها`), noseAbout: "نحو",''',
     '''      noseCan: n => `${n} يشمّونها`, noseCannot: n => (n === 1 ? "واحد لا يشمّها" : `${n} لا يشمّونها`), noseAbout: "نحو", noseGroup: "اختر رائحة",'''),
    ('''      noseSrc: "المسح: مسح ناشيونال جيوغرافيك للشم، كما نقله أولوف وآخرون في «الرائحة والكيمياء» (2022). نحو 400 نوع من مستقبلات الشم تختلف جيناتها بين الناس: ماكغي، «الغوص بالأنف» (2020)؛ غيلبرت، «ما يعرفه الأنف» (2008).",''',
     '''      noseSrc: "المسح: مسح ناشيونال جيوغرافيك للشم، كما نقله أولوف وآخرون في كتاب Scent and Chemistry (2022). نحو 400 نوع من مستقبلات الشم تختلف جيناتها بين الناس: ماكغي في كتاب Nose Dive (2020)، وغيلبرت في كتاب What the Nose Knows (2008).",'''),
    ('''      quizH: "أربعة أجزاء سريعة، ثم عطورك الثلاثة.",''',
     '''      quizH: "أربعة أجزاء سريعة، ثم عطور مختارة لك.",'''),
    # the caption: no aria-pressed on Yes (it cannot be taken back); a class marks a bottle already added
    ('''      <button type="button" class="lp-tried-yes" data-tried="yes" aria-pressed="${done}">${esc(t().triedYes)}</button>''',
     '''      <button type="button" class="lp-tried-yes${done ? " on" : ""}" data-tried="yes">${esc(t().triedYes)}</button>'''),
    # keep keyboard focus on the answer buttons when the caption is redrawn
    ('''    fitField(field, stage);
    cap.innerHTML = captionHtml(s);''',
     '''    fitField(field, stage);
    const focused = cap.contains && cap.contains(document.activeElement) ? document.activeElement.dataset.tried : null;
    cap.innerHTML = captionHtml(s);
    refocus(cap, focused);'''),
    ('''    const cap = $("lp-caption"); if (cap) cap.innerHTML = captionHtml(s);''',
     '''    const cap = $("lp-caption"); if (cap) { cap.innerHTML = captionHtml(s); refocus(cap, "yes"); }'''),
    ('''  /* Tried it? Yes adds the bottle to the quiz links and says so, then the next perfume comes; Not yet sprays the next. */''',
     '''  /* a redrawn caption hands keyboard focus back to the answer button that had it */
  const refocus = (cap, which) => { if (!which || !cap.querySelector) return; const b = cap.querySelector(`[data-tried="${which}"]`); if (b) b.focus({ preventScroll: true }); };
  /* Tried it? Yes adds the bottle to the quiz links and says so, then the next perfume comes; Not yet sprays the next. */'''),
    ('''      <div class="lp-pills" role="group">${cases.map(''',
     '''      <div class="lp-pills" role="group" aria-label="${esc(t().noseGroup)}">${cases.map('''),
    ('''  /* one spray on its own as soon as the bottle is in view (on a phone it sits under the promise, on the first screen),
     so the page shows what it does; a visitor who presses first skips it */''',
     '''  /* one spray on its own as soon as the bottle is in view (on most phones it sits under the promise, on the first
     screen), so the page shows what it does; a visitor who presses first skips it */'''),
])

edit(r"site\landing.css", [
    ('''.lp-tried .lp-tried-yes[aria-pressed="true"] { background: var(--gold-soft); box-shadow: inset 0 0 0 1px var(--gold); }
.lp-tried .lp-tried-yes[aria-pressed="true"]::before { content: "\\2713\\00a0"; }''',
     '''.lp-tried .lp-tried-yes.on { background: var(--gold-soft); box-shadow: inset 0 0 0 1px var(--gold); }
.lp-tried .lp-tried-yes.on::before { content: "\\2713\\00a0"; }
@media (max-width: 379px) { .lp-tried { gap: 6px; } .lp-tried-q { font-size: 13.5px; } .lp-tried button { padding: 6px 11px; font-size: 13.5px; } }'''),
])
print("applied")
