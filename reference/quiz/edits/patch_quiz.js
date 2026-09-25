const fs = require("fs"); const p = "site/js/quiz.js"; let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(n + " matches: " + a.slice(0, 80)); s = s.replace(a, () => b); };

/* ---------- strings ---------- */
rep(`      cardPalate: "My palate",\n`, `      cardPalate: "My palate",
      startH: "Find what ruins a perfume for you",
      startLede: "Tell us how the perfumes you know ended for you. We find the material family behind the ones that turned on you, name your palate and choose three samples to try next.",
      startParts: "Four parts:", startGo: "Start",
      palOne: side => \`Your bottles show a liking for \${side}.\`,
      palTwo: (a, b) => \`Your bottles show two likings: \${a}, and \${b}. Each has bottles behind it, so one does not cancel the other.\`,
      pal: {
        amber: { side: "warm, resinous bases", tip: "These materials carry a perfume's last hours, so judge an amber sample hours after you put it on, not at the counter." },
        sweet: { side: "dessert-like sweetness", tip: "Sweet perfumes differ most in their base: the patchouli, woods or musk under the sugar are what set one vanilla apart from the next." },
        oud: { side: "dark, smoky materials", tip: "Most oud in Western perfumes is a smoky accord, while natural oud smells more animal and leathery. If you have met only one, a sample of the other shows which you like." },
        musk: { side: "musks", tip: "Many people cannot smell one or more musks, so a musk perfume can be strong on you while you barely notice it. Ask someone near you before you add more sprays." },
        woody: { side: "woods", tip: "These woods smell very different, from the dry, radiant Ambroxan-type base to creamy sandalwood, so follow the families listed below rather than the word \\"woody\\" on a box." },
        rose: { side: "rose", tip: "A lemony green rose and a honeyed, jammy one rarely smell like the same flower. If you have met only one kind, try a sample of the other." },
        floral: { side: "flowers", tip: "Heavy white florals and light, clean ones are far apart, so follow the families listed below rather than the word \\"floral\\" on a box." },
        fresh: { side: "fresh, bright materials", tip: "Citrus is usually gone within the hour, so what makes a fresh perfume last is something else, often sea notes, musk or woods. Smell a sample again after an hour before you buy." },
        spiced: { side: "spice", tip: "Saffron and warm spices often sit on an oud, amber or woody base, and the base decides whether you keep the perfume. Judge a sample hours in, not only at the first spray." },
        wide: { text: "Your bottles cover several kinds of perfume and none of them leads: you like a wide range.", tip: "For a palate this wide, the useful finding is what you avoid: your deal-breaker rules perfumes out, and everything else is open to you.", tipNone: "No deal-breaker has shown up yet. A bottle that turned on you, rated on the profiler page, is what would find one." },
        selective: { text: "None of your bottles stands out as a like, but they do show what you avoid.", tip: "That is the useful half: the count above shows how many perfumes your deal-breaker rules out." }
      },
      compare: { breaker: (p, n, f) => \`\${p} of the \${n} people who finished this quiz share your deal-breaker: \${f}.\`, palate: (p, n) => \`\${p} of the \${n} people who finished this quiz share your palate.\` }, under1: "Under 1%",
`);
rep(`      cardPalate: "ذائقتي",\n`, `      cardPalate: "ذائقتي",
      startH: "اعرف ما يفسد العطر عليك",
      startLede: "أخبرنا كيف انتهت معك العطور التي تعرفها. نجد عائلة المواد وراء العطور التي انقلبت عليك، ونسمّي ذائقتك، ونختار لك ثلاث عيّنات تجرّبها بعد ذلك.",
      startParts: "أربعة أجزاء:", startGo: "ابدأ",
      palOne: side => \`عطورك تكشف ميلك إلى \${side}.\`,
      palTwo: (a, b) => \`عطورك تكشف ميلين: إلى \${a}، وإلى \${b}. لكلٍّ منهما عطور تشهد له، فلا يلغي أحدهما الآخر.\`,
      pal: {
        amber: { side: "القواعد الدافئة الراتنجية", tip: "هذه المواد تحمل الساعات الأخيرة من العطر، فاحكم على عيّنة العنبر بعد ساعات من وضعها، لا في المتجر." },
        sweet: { side: "الحلاوة التي تشبه الحلويات", tip: "تختلف العطور الحلوة في قاعدتها أكثر من أي شيء آخر: الباتشولي أو الأخشاب أو المسك تحت السكر هي ما يميّز فانيلا عن أخرى." },
        oud: { side: "المواد الداكنة المدخّنة", tip: "أغلب العود في العطور الغربية تركيبة مدخّنة، أما العود الطبيعي فرائحته أقرب إلى الحيواني والجلدي. إن لم تجرّب إلا نوعاً واحداً، فعيّنة من الآخر تبيّن لك أيّهما تحب." },
        musk: { side: "المسك", tip: "كثير من الناس لا يشمّون نوعاً أو أكثر من المسك، فقد يكون عطر المسك قوياً عليك وأنت بالكاد تلاحظه. اسأل من حولك قبل أن تزيد الرشّات." },
        woody: { side: "الأخشاب", tip: "هذه الأخشاب مختلفة جداً، من قاعدة الأمبروكسان الجافة النفّاذة إلى الصندل الكريمي، فاتبع العائلات المذكورة أدناه لا كلمة «خشبي» على العلبة." },
        rose: { side: "الورد", tip: "الورد الأخضر الليموني والورد العسلي المربّى نادراً ما يبدوان زهرة واحدة. إن لم تجرّب إلا نوعاً منهما، فجرّب عيّنة من الآخر." },
        floral: { side: "الزهور", tip: "الزهور البيضاء الثقيلة والزهور الخفيفة النظيفة بعيدة عن بعضها، فاتبع العائلات المذكورة أدناه لا كلمة «زهري» على العلبة." },
        fresh: { side: "المواد المنعشة", tip: "الحمضيات تختفي عادة خلال ساعة، فما يُبقي العطر المنعش مادة أخرى، غالباً النفحات البحرية أو المسك أو الأخشاب. اشتمّ العيّنة مرة أخرى بعد ساعة قبل أن تشتري." },
        spiced: { side: "التوابل", tip: "كثيراً ما يأتي الزعفران والتوابل الدافئة على قاعدة من العود أو العنبر أو الأخشاب، والقاعدة هي التي تحدد إن كنت ستبقي على العطر. احكم على العيّنة بعد ساعات، لا عند الرشّة الأولى فقط." },
        wide: { text: "عطورك من أنواع كثيرة ولا يتقدّم أحدها على البقية: ذائقتك تتسع لأنواع كثيرة.", tip: "في ذائقة بهذا الاتساع، النتيجة المفيدة هي ما تتجنّبه: ما يفسد العطر عليك يستبعد عطوراً، وكل ما عداها متاح لك.", tipNone: "لم يظهر بعد ما يفسد العطر عليك. تقييم عطر انقلب عليك في صفحة المحلل هو ما يكشفه." },
        selective: { text: "لا يبرز من عطورك ما تحبه بوضوح، لكنها تكشف ما تتجنّبه.", tip: "وهذا هو النصف المفيد: الرقم أعلاه يبيّن كم عطراً يستبعده ما يفسد العطر عليك." }
      },
      compare: { breaker: (p, n, f) => \`\${p} ممن أنهوا هذا الاختبار (\${n}) يشاركونك النفور من \${f}.\`, palate: (p, n) => \`\${p} ممن أنهوا هذا الاختبار (\${n}) يشاركونك ذائقتك.\` }, under1: "أقل من 1٪",
`);

/* ---------- state: the start screen comes first ---------- */
rep(`  /* the step machine, in four parts: grid, verdicts, notes and narrow (your bottles); picker (notes you know);
     taste (sweet or bitter); told and anosmia (what bothers you); then the result */
  let step = "grid";`, `  /* the step machine: a start screen, then four parts: grid, verdicts, notes and narrow (your bottles); picker
     (notes you know); taste (sweet or bitter); told and anosmia (what bothers you); then the result */
  let step = "start";`);

/* ---------- go(): the result event and the comparison counts ---------- */
rep(`    if (next === "result" && !doneSent) { doneSent = true; sendEvent("quiz_done", Object.keys(ratings).filter(hasStage).length); }`,
`    if (next === "result") {
      if (!doneSent) { doneSent = true; sendEvent("quiz_done", Object.keys(ratings).filter(hasStage).length); }
      sendResult(); loadQuizStats();
    }`);
rep(`  function sendOnce(key, name, n) { if (sent.has(key)) return; sent.add(key); sendEvent(name, n); }\n`,
`  function sendOnce(key, name, n) { if (sent.has(key)) return; sent.add(key); sendEvent(name, n); }
  /* The result as one event, "result:<palate>:<deal-breakers joined by +>", with the rated bottles as n: the
     backend keeps each device's last one and counts palates and deal-breakers for the comparison line. A
     changed result after Back goes out again. */
  function sendResult() {
    const prof = computeProfile(), arch = archetypeOf(prof);
    const name = "result:" + (arch ? arch.id : "none") + ":" + byStrength(prof, ["badLikely", "badPossible"]).join("+");
    sendOnce(name, name, Object.keys(ratings).filter(hasStage).length);
  }
  /* the backend's counts of finished quizzes, asked for once, when the result is first reached */
  let quizStats = null, statsAsked = false;
  function loadQuizStats() {
    if (statsAsked || !CONFIG.endpoint) return;
    statsAsked = true;
    try {
      fetch(CONFIG.endpoint + (CONFIG.endpoint.includes("?") ? "&" : "?") + "stats=1").then(r => r.json()).then(j => {
        if (!j || !j.quiz) return;
        quizStats = j.quiz;
        const el = $("qcompare"); if (el && step === "result") el.innerHTML = compareHtml(computeProfile());
      }).catch(() => {});
    } catch (e) { /* offline or blocked */ }
  }
`);

/* ---------- the start screen ---------- */
rep(`  /* The grid screen keeps its search box across tile taps: only the tiles and the buttons are redrawn. */`,
`  /* The start screen: the promise, five of the grid's bottles, the four parts, and Start. */
  function startHtml() {
    const shelf = QUIZ.grid.slice(0, 5).map(id => imgTag(resolve(id))).join("");
    return \`<div class="qstart"><div class="qstart-shelf" aria-hidden="true">\${shelf}</div>
      <div class="hero"><h1>\${esc(t().startH)}</h1><p>\${esc(t().startLede)}</p></div>
      <p class="qsteps-h">\${esc(t().startParts)}</p><ol class="qsteps">\${t().parts.map((name, i) => \`<li><b>\${i + 1}</b><span>\${esc(name)}</span></li>\`).join("")}</ol>
      <div class="qactions"><button type="button" class="btn primary" data-start="1">\${esc(t().startGo)}</button></div></div>\` + foot();
  }
  /* The grid screen keeps its search box across tile taps: only the tiles and the buttons are redrawn. */`);

/* ---------- palate text and comparison ---------- */
rep(`  /* a two-group palate shades from`, `  /* the lines under the palate name: what the bottles show, then one practical tip (a two-group palate takes the
     lead group's tip) */
  function palateText(arch, prof) {
    const P = t().pal;
    if (arch.id === "wide") return [P.wide.text, byStrength(prof, ["badLikely", "badPossible"]).length ? P.wide.tip : P.wide.tipNone];
    if (arch.id === "selective") return [P.selective.text, P.selective.tip];
    const [a, b] = arch.id.split("-");
    return [b ? t().palTwo(P[a].side, P[b].side) : t().palOne(P[a].side), P[a].tip];
  }
  /* The comparison line: how many people who finished the quiz share the visitor's strongest deal-breaker, or,
     without one, their palate (a two-group palate counted in either order). Only from COMPARE_MIN finishers,
     so a handful of early visitors never produce a percentage. */
  const COMPARE_MIN = 100;
  function compareHtml(prof) {
    const q = quizStats; if (!q || !(q.n >= COMPARE_MIN)) return "";
    const pct = c => { const v = Math.round(100 * c / q.n); return v < 1 ? t().under1 : v + (lang === "ar" ? "٪" : "%"); };
    const bad = byStrength(prof, ["badLikely", "badPossible"])[0];
    if (bad) return q.breakers && q.breakers[bad] ? esc(t().compare.breaker(pct(q.breakers[bad]), q.n, low(famShort(bad)))) : "";
    const arch = archetypeOf(prof); if (!arch || !q.palates) return "";
    const [a, b] = arch.id.split("-"), c = (q.palates[arch.id] || 0) + (b ? q.palates[b + "-" + a] || 0 : 0);
    return c ? esc(t().compare.palate(pct(c), q.n)) : "";
  }
  /* a two-group palate shades from`);
rep(`      ? \`<div class="qname-hero" style="--arch:\${arch.color}">\${emblemSvg(arch, 96)}<div><p class="eyebrow">\${esc(t().palate)}</p><h1>\${esc(arch[lang])}</h1></div></div>\`
      : \`<div class="hero"><h1>\${esc(t().resultH)}</h1></div>\`;`,
`      ? \`<div class="qname-hero" style="--arch:\${arch.color}">\${emblemSvg(arch, 96)}<div><p class="eyebrow">\${esc(t().palate)}</p><h1>\${esc(arch[lang])}</h1></div></div><p class="qpal">\${esc(palateText(arch, prof).join(" "))}</p>\`
      : \`<div class="hero"><h1>\${esc(t().resultH)}</h1></div>\`;`);
rep(`      \${tasteCardHtml(prof, ids)}\${recs}`, `      \${tasteCardHtml(prof, ids)}<p class="qcompare" id="qcompare">\${compareHtml(prof)}</p>\${recs}`);

/* ---------- render: the start screen and the reached-screen events ---------- */
rep(`  function render() {
    renderChrome();
    const host = $("quiz");`, `  function render() {
    renderChrome();
    /* each screen reached on this visit goes out once, so the backend's funnel shows where people stop; picker
       screens by their position among the five, the result by quiz_done */
    if (step !== "result") { const k = step === "picker" ? "picker:" + (pk + 1) : step; sendOnce("reach:" + k, "reach:" + k, 0); }
    const host = $("quiz");`);
rep(`    const screens = { verdicts: verdictHtml,`, `    const screens = { start: startHtml, verdicts: verdictHtml,`);
rep(`    if (d.back) { back(); return; }`, `    if (d.back) { back(); return; }
    if (d.start && step === "start") { go("grid"); return; }`);
fs.writeFileSync(p, s);
console.log("ok");
