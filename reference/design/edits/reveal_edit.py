"""One-off edit: the quiz result leads with a taste card and three bottle tiles; the family cards fold away."""
p = "C:/Users/malha/Desktop/Webapps/perfume-profiler/site/js/quiz.js"
s = open(p, encoding="utf-8").read()

def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:70])
    s = s.replace(a, b)

# strings, English
rep('      resultH: "Your profile from these bottles",\n',
    '      resultH: "Your scent profile",\n'
    '      drawn: { likely: "Drawn to", possible: "Probably drawn to" }, breaker: { likely: "Your deal-breaker", possible: "Possible deal-breaker" },\n'
    '      fromBottles: "From your bottles:", has: "has", without: "without", getSample: "Get a sample",\n'
    '      basis: (b, a) => `Built from ${b} ${b === 1 ? "bottle" : "bottles"} and ${a} ${a === 1 ? "answer" : "answers"}.`,\n'
    '      how: "How we worked this out", picksLede: { avoid: "Chosen to steer clear of your deal-breakers.", like: "Chosen from what you like." },\n')
# strings, Arabic
rep('      resultH: "ملفك من هذه العطور",\n',
    '      resultH: "ذائقتك العطرية",\n'
    '      drawn: { likely: "تنجذب إلى", possible: "على الأرجح تنجذب إلى" }, breaker: { likely: "يفسد العطر عليك", possible: "قد يفسد العطر عليك" },\n'
    '      fromBottles: "من عطورك:", has: "فيه", without: "بلا", getSample: "اطلب عينة",\n'
    '      basis: (b, a) => `بُني على ${b} من عطورك و${a} من إجاباتك.`,\n'
    '      how: "كيف توصّلنا إلى هذا", picksLede: { avoid: "اختيرت لتبتعد عمّا يفسد العطر عليك.", like: "اختيرت مما تحبه." },\n')

# helpers, placed before resultHtml
rep("  function resultHtml() {\n", r'''  /* ---------- the result's first screen: a taste card and three bottle tiles ---------- */
  /* a family's name without its bracketed gloss: "Woody ambers (Ambroxan-type)" -> "Woody ambers" */
  const famShort = k => fam(k).replace(/\s*[(（][^)）]*[)）]\s*/g, " ").trim();
  const byStrength = (prof, classes) => Object.entries(prof).filter(([, v]) => classes.includes(v.cls))
    .sort((a, b) => classes.indexOf(a[1].cls) - classes.indexOf(b[1].cls) || Math.abs(b[1].score) - Math.abs(a[1].score)).map(([f]) => f);
  /* every answer the visitor gave: a verdict and its note rows per bottle, the picker cards, taste, complaints, anosmia */
  function answerCount(ids) {
    let n = 0;
    for (const id of ids) { const r = ratings[id] || {}; n += 1 + Object.keys(r.noteAnswers || {}).length + (Array.isArray(r.unnoticed) ? r.unnoticed.length : 0); }
    n += Object.values(quiz.notes || {}).filter(v => v).length;
    if (quiz.taste) n += 1;
    const told = normTold(quiz); n += told.told.length || (told.toldNone ? 1 : 0);
    if (quiz.anosmia) n += 1;
    return n;
  }
  /* one row of the taste card: a label, the families as chips, and the bottles they were seen in */
  function tasteRow(prof, fams, kind) {
    if (!fams.length) return "";
    const likely = fams.some(f => prof[f].cls === (kind === "good" ? "goodLikely" : "badLikely"));
    const label = (kind === "good" ? t().drawn : t().breaker)[likely ? "likely" : "possible"];
    const seen = new Set();
    for (const f of fams) for (const e of prof[f].evidence || []) if (e.perfume && (kind === "good" ? e.value > 0 : e.value < 0)) seen.add(pname(e.perfume));
    const from = seen.size ? `<div class="qtaste-from">${esc(t().fromBottles)} ${esc(listJoin([...seen].slice(0, 3)))}</div>` : "";
    return `<div class="qtaste-row ${kind}"><div class="qtaste-k">${esc(label)}</div><div class="qchips">${fams.map(f => `<span class="qchip ${kind}">${esc(famShort(f))}</span>`).join("")}</div>${from}</div>`;
  }
  function tasteCardHtml(prof, ids) {
    const good = byStrength(prof, ["goodLikely", "goodPossible"]).slice(0, 3);
    const bad = byStrength(prof, ["badLikely", "badPossible"]).slice(0, 2);
    const rows = tasteRow(prof, good, "good") + tasteRow(prof, bad, "bad");
    return `<div class="qreveal"><div class="qtaste">${rows || `<p class="qtaste-none">${esc(t().noFamilies)}</p>`}</div>
      <p class="qbasis">${esc(t().basis(ids.length, answerCount(ids)))}</p></div>`;
  }
  /* a pick as a tile: the bottle, its name, what it has that you like and what it is free of */
  function tileHtml(pick, prof) {
    const P = pick.P, PP = resolve(P.id) || P;
    const strong = st => Object.entries(P.stages[st] || {}).filter(([, w]) => w >= 0.5);
    const likes = new Set(byStrength(prof, ["goodLikely", "goodPossible"]));
    const has = strong("drydown").concat(strong("heart")).filter(([f]) => likes.has(f)).sort((a, b) => b[1] - a[1]).map(([f]) => f)[0];
    const carries = f => ["opening", "heart", "drydown"].some(st => (P.stages[st][f] || 0) >= 0.3);
    const free = byStrength(prof, ["badLikely", "badPossible"]).find(f => !carries(f));
    const chips = (has ? `<span class="qchip good sm"><span class="sr">${esc(t().has)} </span>${esc(famShort(has))}</span>` : "")
      + (free ? `<span class="qchip bad sm"><span class="sr">${esc(t().without)} </span>${esc(famShort(free))}</span>` : "");
    const q = encodeURIComponent(P.house + " " + P.name);
    const sample = (lang === "ar" ? CONFIG.links.sampleSA : CONFIG.links.sampleUS).replace("{q}", q);
    return `<div class="rec">${imgTag(PP)}<b>${esc(pname(P))}</b><span class="qtile-house">${esc(P.house)}</span>
      ${chips ? `<div class="qchips">${chips}</div>` : ""}
      <a class="btn primary qsample" href="${sample}" target="_blank" rel="noopener sponsored" data-event="${esc("sample:" + P.id)}">${esc(t().getSample)}</a>
      <a class="qbottle" href="${CONFIG.links.bottle.replace("{q}", q)}" target="_blank" rel="noopener sponsored" data-event="${esc("sample:" + P.id)}">${esc(t().bottle)}</a></div>`;
  }

  function resultHtml() {
''')

# picks as tiles, in both the bottle path and the told-only path
rep("      return picks.length ? `<div class=\"recs\">${picks.map(recHtml).join(\"\")}</div>` : \"\";",
    "      return picks.length ? `<div class=\"recs recs-tiles\">${picks.map(pk => tileHtml(pk, prof)).join(\"\")}</div>` : \"\";")

# the bottle path: card, picks, the note on musks, then the working folded away
old_tail = s[s.index("    let recs = \"\";\n    if (gate) { const list = picksHtml();"):s.index("  function render() {")]
new_tail = '''    let recs = "";
    const anyBad = Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible");
    if (gate) { const list = picksHtml(); if (list) recs = `<h2 class="qh2">${esc(t().recsH)}</h2><p class="notes">${esc(t().picksLede[anyBad ? "avoid" : "like"])}</p>${list}`; }
    else recs = `<div class="empty">${esc(t().oneMore)}</div>`;
    return topHtml() + `<div class="qresult"><div class="hero"><h1>${esc(t().resultH)}</h1></div>
      ${tasteCardHtml(prof, ids)}${recs}${anos}
      <details class="qhow"><summary>${esc(t().how)}</summary><p class="notes">${esc(t().resultLede)}</p>${famHtml}${told}</details>
      <div class="qactions"><a class="btn primary" href="${esc(profilerHref("", "#sec-profile"))}">${esc(t().full)}</a></div></div>` + foot();
  }

'''
s = s.replace(old_tail, new_tail)
open(p, "w", encoding="utf-8", newline="\n").write(s)
print("ok")
