/* The front page (index.html), written for a visitor who scrolls more than reads: a hook and a perfume bottle on the
   first screen, then a real result, then three short sections that each turn on one tap, then the quiz (quiz.html) and
   the articles. Every section holds one headline, one interaction and one line; its sources fold away under it.
   The centrepiece is the real bottle of one of the quiz's twenty perfumes (its picture from site/img/hero/): a completed
   press on it sprays from its top straight up, and its listed notes rise out of the mist in three rows, first minutes,
   first hours and hours later (js/landing-data.js, built by tools/build_landing.js); the next press brings another
   perfume's bottle, which sprays in its turn. Under it the quiz's first question waits: tried it? Each bottle the visitor
   has tried goes into the quiz links (?tried=), so the quiz opens with them picked. The mist and every other movement
   sit under prefers-reduced-motion: no-preference; without motion the bottles swap and the notes simply appear. Shared
   words and the device store come from page.js. */
(function () {
  "use strict";
  const host = document.getElementById("lp");
  const PAGE = window.PP_PAGE, LD = window.PP_LANDING_DATA, CONFIG = window.PP_CONFIG || { endpoint: "" };
  if (!host) return;
  if (!PAGE || !LD) { host.textContent = "A script in js/ did not load (page or landing data). Serve the site folder as it is."; return; }
  const STAGES = ["opening", "heart", "drydown"];
  const store = PAGE.store;
  let lang = store.get("pp_lang", "ar");   /* Arabic first, whatever the device language; a chosen language is kept */
  const tried = [];                       /* the bottles the visitor said, under the stage, they have tried */

  /* Local testing only, as page.js does: http://localhost:8765/?endpoint=http://localhost:8765/api */
  let endpointParam = "";
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { try { const e = new URLSearchParams(location.search).get("endpoint"); if (e) { CONFIG.endpoint = e; endpointParam = e; } } catch (err) { /* ignore */ } }
  const withEndpoint = href => (endpointParam ? href + (href.includes("?") ? "&" : "?") + "endpoint=" + encodeURIComponent(endpointParam) : href);
  const QUIZ_HREF = () => withEndpoint("quiz.html?go=1" + (tried.length ? "&tried=" + tried.join(",") : ""));
  /* This page is the quiz's start screen: one "reach:start" per visit, from the device id the quiz and the profiler use
     (the same format page.js makes), so the backend's funnel still begins here. "land:tried" counts the bottles a
     visitor marks as tried under the stage (n: how many so far). */
  function send(name, n) {
    if (!CONFIG.endpoint) return;
    let device = store.get("pp_device", null);
    if (!device) { device = "d_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set("pp_device", device); }
    try { fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ type: "event", name, n, device, lang, ts: new Date().toISOString() }) }).catch(() => {}); } catch (e) { /* offline or blocked */ }
  }
  send("reach:start", 0);

  /* Arabic counted nouns: 1 and 2 have their own forms, 3 to 10 take the plural, 11 and more the singular */
  const arCount = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`);
  /* the word "perfume" after a number in Arabic, where the last two digits decide: 1000 عطر, 1207 عطور, 427 عطراً */
  const arNoun = n => { const r = n % 100; return r === 0 || (n > 100 && r <= 2) ? "عطر" : r <= 10 ? "عطور" : "عطراً"; };
  const arPerfumes = n => (n === 1 ? "عطر واحد" : n === 2 ? "عطران" : `${n} ${arNoun(n)}`);
  const fmtEn = n => Number(n).toLocaleString("en-US");

  /* ---------- words ----------
     The hook is the bottle the reader bought and stopped using. The sections: a real result (what the quiz gives), the
     1,000-perfume test (one smell you cannot stand rules out far more than all the popular smells you like), the box
     turned round (the label names what the note list leaves out) and the nose (a third of people cannot smell a common
     musk). Figures from the catalogue, the labels and the example result come from js/landing-data.js; figures from
     the books are written here, with their sources in each section's folded Sources. */
  const T = PAGE.words({
    en: {
      navQuiz: "The quiz", navProfiler: "Your profile",
      h1: "Bought a perfume you never wear? One note may be why.",
      lede: "Four quick parts look for the smell behind it, then choose perfumes for you to try.",
      start: "Find what suits me", cont: n => `Continue with ${n} ${n === 1 ? "bottle" : "bottles"}`,
      startNote: "Free. No sign-up.",
      press: "Press the bottle",
      bottleLabel: name => `${name}. Press to spray it and see its notes; the next press brings another of the quiz's twenty perfumes.`,
      triedQ: "Tried it?", triedYes: "Yes", triedNo: "Not yet", triedDone: "Added to your quiz",
      sprayedLive: (house, name, rows) => `Sprayed ${house} ${name}. ${rows}. Tried it?`,
      srcTag: "Sources",

      getKick: "What you get",
      getH: "Tell it about four perfumes you've tried, and you get a result like this.",
      getPalate: "Your palate", getBad: "Your deal-breaker", getPicks: "Three to try",
      getOut: total => `of our ${fmtEn(total)} perfumes ruled out`,
      getWho: (a, b, c, d) => `An example: still uses ${a} and ${b}; ${c} and ${d} turned on them.`,

      testKick: "Try it",
      testH: "Tap one smell you can't stand. Watch the count fall from 1,000.",
      testNames: { woody_amber: "Woody ambers", white_musk: "Clean musk", patchouli: "Patchouli", cedar_dry: "Dry cedar", leather_smoky: "Leather",
        oud_smoky: "Smoky oud", iris_powdery: "Powdery iris", incense_resin: "Incense" },
      testAll: () => "perfumes in our catalogue",
      testLeft: (n, name) => `left after ruling out ${name.toLowerCase()}`,
      testVerdict: (gone, none) => `One smell you can't stand ruled out ${fmtEn(gone)}. Only ${fmtEn(none)} of the 1,000 have none of rose, vanilla, citrus and the other popular smells.`,
      testWhy: "That's why the quiz starts with what you can't stand.",
      testGo: "Find yours",
      testSrc: "Counts from our catalogue of 1,000 perfumes. A smell you can't stand rules a perfume out as the quiz does: when its family is strong in the heart or the base. A perfume has a popular smell when that family is clearly present in at least one of its stages. The popular smells: rose, white flowers, citrus, warm spices, sandalwood, vanilla and resin amber.",

      listKick: "Turn the box around",
      listH: "The box says jasmine and vanilla. What does the label say?",
      listLede: name => `${name} by Parfums de Marly lists nine notes. Turn the box around and read its ingredients.`,
      boxOn: "On the box", labelOn: "On the label, first five ingredients",
      flip: "Turn it around", flipBack: "Back to the box", boxTease: "Now read the other side.",
      inciNames: { "alcohol denat.": "alcohol", parfum: "fragrance", aqua: "water", "tetramethyl acetyloctahydronaphthalenes": "Iso E Super", hexamethylindanopyran: "Galaxolide" },
      labelHidden: "Two synthetic materials near the top. The note list names neither.",
      labelCount: (checked, iso, listed) => `${iso} of the ${checked} Parfums de Marly labels we checked list Iso E Super among the first five ingredients. ${listed ? `Only ${listed} of their note lists mention it.` : "None of their note lists mentions it."}`,
      listSrc: "Labels: the ingredient lists on the Parfums de Marly website, September 2026. Iso E Super is a synthetic woody material and Galaxolide a synthetic musk.",

      noseKick: "Your nose",
      noseH: "About 1 in 3 people can't smell this musk. Are you one of them?",
      noseLede: "It's Galaxolide, the musk on that label, and clean musks like it are in nearly half of our 1,000 perfumes. Tap a smell and watch 100 people split.",
      noseCases: [
        { id: "banana", name: "Banana", can: 99, about: true, note: "Everyone smells this one, except the 1 in 100 who can't smell anything at all.", g: "fresh" },
        { id: "clove", name: "Clove", can: 99, about: true, note: "Everyone smells this one too, except the 1 in 100 who can't smell anything at all.", g: "spiced" },
        { id: "musk", name: "Clean musk", can: 67, about: true, note: "About 1 in 3 miss it completely. To them, a perfume built on it smells much weaker than it is.", g: "musk" },
        { id: "andro", name: "Androstenone", can: 67, about: true, note: "Most people who smell it say urine. Some say sweet flowers. About 1 in 3 smell nothing.", g: "amber" }
      ],
      noseCan: n => `${n} can smell it`, noseCannot: n => `${n} cannot`, noseAbout: "about", noseGroup: "Pick a smell",
      noseSrc: "Survey: the National Geographic Smell Survey, as reported in Ohloff and others, Scent and Chemistry (2022). About 400 kinds of smell receptor, with genes that vary between people: McGee, Nose Dive (2020); Gilbert, What the Nose Knows (2008).",

      quizH: "Four quick parts, then perfumes chosen for you.",
      quizLede: "It learns first from the perfumes you've tried, then from what you say about notes.",
      quizSteps: ["Your bottles", "Notes you know", "Sweet or bitter", "What bothers you"],

      artH: "Read more",
      arts: [
        ["woody-ambers", "Woody ambers", "The modern materials some people love and others cannot stand."],
        ["musk-anosmia", "The musk you cannot smell", "Why a musk perfume can be strong on you while you barely notice it."],
        ["notes-not-ingredients", "Notes are not ingredients", "What the list on the box tells you, and what it leaves out."],
        ["three-ouds", "Oud is not one smell", "Three kinds of oud, and how to tell which one you like."]
      ],
      artGo: "Read"
    },
    ar: {
      navQuiz: "الاختبار", navProfiler: "ملفك العطري",
      h1: "اشتريت عطراً ثم تركته؟ قد تكون نوتة واحدة هي السبب.",
      lede: "أربعة أجزاء سريعة تبحث عن الرائحة التي وراء ذلك، ثم تختار لك عطوراً لتجرّبها.",
      start: "اكتشف ما يناسبك", cont: n => `تابع مع ${arCount(n, "عطر واحد", "عطرين", "عطور", "عطراً")}`,
      startNote: "مجاناً، وبلا تسجيل.",
      press: "اضغط على الزجاجة",
      bottleLabel: name => `${name}. اضغط لترشّه وترى نوتاته، والضغطة التالية تأتي بعطر آخر من عطور الاختبار العشرين.`,
      triedQ: "جرّبته من قبل؟", triedYes: "نعم", triedNo: "ليس بعد", triedDone: "أضفناه إلى اختبارك",
      sprayedLive: (house, name, rows) => `رششت ${name} من ${house}. ${rows}. هل جرّبته من قبل؟`,
      srcTag: "المصادر",

      getKick: "ما تحصل عليه",
      getH: "أخبرنا عن أربعة عطور جرّبتها، فتحصل على نتيجة كهذه.",
      getPalate: "ذائقتك", getBad: "ما يفسد العطر عليك", getPicks: "ثلاثة عطور لتجرّبها",
      getOut: (total, n) => `${arNoun(n)} استُبعدت من ${arPerfumes(total)} في قائمتنا`,
      getWho: (a, b, c, d) => `مثال: ما زال يستخدم ${a} و${b}، وانقلب عليه ${c} و${d}.`,

      testKick: "جرّب بنفسك",
      testH: "اختر رائحة واحدة لا تطيقها، وانظر كم عطراً يبقى من الألف.",
      testNames: { woody_amber: "الأخشاب العنبرية الصناعية", white_musk: "المسك النظيف", patchouli: "الباتشولي", cedar_dry: "الأرز الجاف", leather_smoky: "الجلد",
        oud_smoky: "العود المدخّن", iris_powdery: "السوسن البودري", incense_resin: "البخور" },
      testAll: n => `${arNoun(n)} في قائمتنا`,
      testLeft: (n, name) => `${arNoun(n)} بعد استبعاد ${name}`,
      testVerdict: (gone, none) => `رائحة واحدة لا تطيقها استبعدت ${arPerfumes(gone)}. أما الورد والفانيلا والحمضيات وغيرها من الروائح الشائعة فلا يخلو منها كلها إلا ${arPerfumes(none)} من الألف.`,
      testWhy: "لهذا يبدأ الاختبار بما لا تطيقه.",
      testGo: "اكتشف ما لا تطيقه",
      testSrc: "الأرقام من قائمتنا التي تضم 1000 عطر. الرائحة التي لا تطيقها تستبعد العطر كما يفعل الاختبار: حين تكون عائلتها قوية في قلبه أو قاعدته. ويُحسب للعطر رائحة شائعة حين تظهر عائلتها فيه بوضوح في مرحلة واحدة على الأقل من مراحله. الروائح الشائعة: الورد والزهور البيضاء والحمضيات والتوابل الدافئة والصندل والفانيلا والعنبر الراتنجي.",

      listKick: "اقلب العلبة",
      listH: "العلبة تقول ياسمين وفانيلا. فماذا يقول الملصق؟",
      listLede: name => `عطر ${name} من دار بارفيوم دي مارلي يذكر تسع نوتات. اقلب العلبة واقرأ مكوناته.`,
      boxOn: "على العلبة", labelOn: "على الملصق: أول خمسة مكونات",
      flip: "اقلب العلبة", flipBack: "أعدها", boxTease: "والآن اقرأ الجهة الأخرى.",
      inciNames: { "alcohol denat.": "كحول", parfum: "عطر", aqua: "ماء", "tetramethyl acetyloctahydronaphthalenes": "إيزو إي سوبر", hexamethylindanopyran: "غالاكسوليد" },
      labelHidden: "مادتان صناعيتان في أول القائمة، ولا تذكر قائمة النوتات أيّاً منهما.",
      labelCount: (checked, iso, listed) => `في ${iso} من ${arCount(checked, "ملصق واحد", "ملصقين", "ملصقات", "ملصقاً")} راجعناها لهذه الدار يأتي إيزو إي سوبر بين أول خمسة مكونات. ${listed ? `ولا تذكره إلا قوائم نوتات ${listed} منها.` : "ولا تذكره قائمة نوتات أيّ منها."}`,
      listSrc: "الملصقات: قوائم المكونات على موقع Parfums de Marly، سبتمبر 2026. إيزو إي سوبر مادة خشبية صناعية، وغالاكسوليد مسك صناعي.",

      noseKick: "أنفك",
      noseH: "نحو ثلث الناس لا يشمّون هذا المسك. هل أنت منهم؟",
      noseLede: "إنه غالاكسوليد، المسك المذكور في ذلك الملصق، والمسك النظيف مثله موجود في قرابة نصف عطور قائمتنا الألف. اختر رائحة وشاهد كيف ينقسم 100 شخص.",
      noseCases: [
        { id: "banana", name: "الموز", can: 99, about: true, note: "يشمّها الجميع، إلا واحداً من كل مئة فقد حاسة الشم كلها.", g: "fresh" },
        { id: "clove", name: "القرنفل", can: 99, about: true, note: "ويشمّها الجميع أيضاً، إلا واحداً من كل مئة فقد حاسة الشم كلها.", g: "spiced" },
        { id: "musk", name: "المسك النظيف", can: 67, about: true, note: "نحو الثلث لا يشمّونه أبداً، فيبدو لهم العطر المبني عليه أضعف بكثير مما هو عليه.", g: "musk" },
        { id: "andro", name: "الأندروستينون", can: 67, about: true, note: "أكثر من يشمّه يقول إن رائحته كالبول، وبعضهم يجدها كالزهور الحلوة، ونحو الثلث لا يشمّ شيئاً.", g: "amber" }
      ],
      noseCan: n => `${n} يشمّونها`, noseCannot: n => (n === 1 ? "واحد لا يشمّها" : `${n} لا يشمّونها`), noseAbout: "نحو", noseGroup: "اختر رائحة",
      noseSrc: "المسح: مسح ناشيونال جيوغرافيك للشم، كما نقله أولوف وآخرون في كتاب Scent and Chemistry (2022). نحو 400 نوع من مستقبلات الشم تختلف جيناتها بين الناس: ماكغي في كتاب Nose Dive (2020)، وغيلبرت في كتاب What the Nose Knows (2008).",

      quizH: "أربعة أجزاء سريعة، ثم عطور مختارة لك.",
      quizLede: "يتعلم أولاً من العطور التي جرّبتها، ثم مما تقوله عن النوتات.",
      quizSteps: ["عطورك", "نوتات تعرفها", "حلو أو مرّ", "ما يزعجك"],

      artH: "اقرأ المزيد",
      arts: [
        ["woody-ambers", "الأخشاب العنبرية", "المواد الحديثة التي يحبها بعض الناس ولا يطيقها آخرون."],
        ["musk-anosmia", "المسك الذي لا تستطيع شمّه", "لماذا قد يكون عطر المسك قوياً عليك وأنت بالكاد تلاحظه."],
        ["notes-not-ingredients", "النوتات ليست مكونات", "ما تخبرك به القائمة على العلبة، وما لا تذكره."],
        ["three-ouds", "العود ليس رائحة واحدة", "ثلاثة أنواع من العود، وكيف تعرف أيّها تحب."]
      ],
      artGo: "اقرأ"
    }
  });
  const t = () => T[lang];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = id => document.getElementById(id);
  const color = g => (g && LD.groups[g] ? LD.groups[g].color : "#8C7A66");
  const pname = s => (lang === "ar" && s.ar ? s.ar : s.name);
  const noteWord = n => (lang === "ar" && n.ar ? n.ar : n.en);
  const motion = () => !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  /* a colour mixed into a base (cream unless given): k of the colour, so mist and liquid stay luminous */
  const tint = (hex, k, base) => { const rgb = x => { const h = x.replace("#", ""); return [0, 2, 4].map(j => parseInt(h.slice(j, j + 2), 16)); }, c = rgb(hex), b = rgb(base || "#FFF7E4");
    return "#" + c.map((v, j) => Math.round(v * k + b[j] * (1 - k)).toString(16).padStart(2, "0")).join("").toUpperCase(); };
  /* a Fisher-Yates shuffle with the random source given */
  const shuffle = (arr, rnd) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- the mist: droplets on a canvas, drawn from pre-rendered sprites ----------
     It runs only while droplets are alive, and holds at most 720 of them however fast the bottle is pressed. */
  const MAX_PARTS = 720;
  const mist = {
    canvas: null, ctx: null, parts: [], raf: 0, w: 0, h: 0, dpr: 1, sprites: {},
    sprite(col) {
      if (this.sprites[col]) return this.sprites[col];
      const c = document.createElement("canvas"); c.width = c.height = 48;
      const x = c.getContext("2d"); if (!x) return null;
      const g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
      g.addColorStop(0, col); g.addColorStop(.4, col + "C8"); g.addColorStop(1, col + "00");
      x.fillStyle = g; x.fillRect(0, 0, 48, 48);
      return (this.sprites[col] = c);
    },
    size() {
      if (!this.canvas || !this.canvas.getBoundingClientRect) return;
      const r = this.canvas.getBoundingClientRect();
      this.dpr = Math.min(2, window.devicePixelRatio || 1); this.w = r.width; this.h = r.height;
      this.canvas.width = Math.round(r.width * this.dpr); this.canvas.height = Math.round(r.height * this.dpr);
    },
    /* one burst from (x, y) toward angle a (radians), fanning out over `fan` radians, in the colours given: fine
       droplets in the perfume's colours, with a few soft clouds among them, strong enough to read as a spray on a phone */
    burst(x, y, a, cols, fan) {
      const k = Math.max(.6, Math.min(1.3, this.w / 460));
      cols = cols.map(c => tint(c, .85));
      for (let i = 0; i < 260; i++) {
        const spread = (Math.random() - .5) * (fan || .75), sp = (3 + Math.random() * 8) * k, big = Math.random() < .16;
        this.parts.push({ x, y, vx: Math.cos(a + spread) * sp, vy: Math.sin(a + spread) * sp, r: big ? 18 + Math.random() * 30 : 2.6 + Math.random() * 6,
          life: 0, max: 80 + Math.random() * 100, col: Math.random() < .18 ? "#FFF3D6" : cols[i % cols.length], a: big ? .3 : .95, delay: Math.floor(Math.random() * 16) });
      }
      if (this.parts.length > MAX_PARTS) this.parts.splice(0, this.parts.length - MAX_PARTS);
      if (!this.raf && this.ctx) this.raf = requestAnimationFrame(() => this.step());
    },
    step() {
      const x = this.ctx; if (!x) { this.raf = 0; return; }
      x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); x.clearRect(0, 0, this.w, this.h);
      this.parts = this.parts.filter(p => p.life < p.max);
      for (const p of this.parts) {
        if (p.delay > 0) { p.delay--; continue; }
        p.life++; p.x += p.vx; p.y += p.vy; p.vx *= .962; p.vy = p.vy * .962 - .02; p.r *= 1.008;
        const s = this.sprite(p.col); if (!s) continue;
        x.globalAlpha = p.a * Math.max(0, 1 - p.life / p.max);
        x.drawImage(s, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      x.globalAlpha = 1;
      this.raf = this.parts.length ? requestAnimationFrame(() => this.step()) : 0;
    }
  };

  /* ---------- rendering ---------- */
  let sprayIdx = -1, sprayOrder = [], touched = false;
  let shown = false;   /* whether the bottle on the stage has sprayed, so its notes and question are out */
  let noseId = "musk", flipped = false, hate = null;   /* hate: the smell tapped in the 1,000-perfume test */

  const fmt = n => (lang === "en" ? fmtEn(n) : String(n));
  const kick = k => `<p class="lp-kick">${esc(t()[k])}</p>`;
  const head = (k, h, p) => `<div class="lp-head">${kick(k)}<h2>${esc(h)}</h2>${p ? `<p>${esc(p)}</p>` : ""}</div>`;
  /* a section's sources, folded away under the section */
  const sources = text => `<details class="lp-srcx"><summary>${esc(t().srcTag)}</summary><p>${esc(text)}</p></details>`;
  const ctaText = () => (tried.length ? t().cont(tried.length) : t().start);
  const goBtn = cls => `<a class="btn primary lp-go${cls ? " " + cls : ""}" href="${esc(QUIZ_HREF())}" data-quiz="1">${esc(ctaText())}</a>`;
  /* a number that runs from where it stands to its new value; without motion it simply changes */
  function countTo(el, to) {
    if (!el) return;
    const from = +(el.dataset && el.dataset.now) || 0;
    if (el.dataset) el.dataset.now = to;
    if (!motion() || typeof requestAnimationFrame !== "function" || typeof performance === "undefined" || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 560;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  function heroHtml() {
    const s = LD.sprays[sprayIdx];
    return `<section class="lp-hero" id="lp-hero">
      <div class="lp-hero-text">
        <h1>${esc(t().h1)}</h1>
        <p class="lp-lede">${esc(t().lede)}</p>
        ${goBtn("lp-hero-go")}
        <p class="lp-under">${esc(t().startNote)}</p>
      </div>
      <div class="lp-stage${touched ? " touched" : ""}" id="lp-stage">
        <canvas class="lp-mist" id="lp-mist" aria-hidden="true"></canvas>
        <div class="lp-field" id="lp-field" aria-hidden="true"></div>
        <button type="button" class="lp-bottle" id="lp-bottle" aria-label="${esc(t().bottleLabel(pname(s)))}"><span class="lp-glass" id="lp-glass"><img src="${esc(s.hero.src)}" alt="" width="${s.hero.w}" height="${s.hero.h}" draggable="false"><span class="lp-hint" id="lp-hint">${esc(t().press)}</span></span></button>
        <div class="lp-caption" id="lp-caption"></div>
        <p class="sr" id="lp-live" aria-live="polite"></p>
      </div>
    </section>`;
  }
  /* under the bottle: the perfume just sprayed, and the quiz's first question about it */
  function captionHtml(s) {
    const done = tried.includes(s.id);
    return `<div class="lp-cap-t" data-id="${esc(s.id)}"><b>${esc(pname(s))}</b><span>${esc(s.house)}</span></div>
      <div class="lp-tried" role="group" aria-label="${esc(t().triedQ)}"><span class="lp-tried-q">${esc(done ? t().triedDone : t().triedQ)}</span>
      <button type="button" class="lp-tried-yes${done ? " on" : ""}" data-tried="yes">${esc(t().triedYes)}</button><button type="button" class="lp-tried-no" data-tried="no">${esc(t().triedNo)}</button></div>`;
  }

  /* ---------- what you get: the result the quiz gives the example visitor (landing-data.js, from a run of the quiz) ---------- */
  function getHtml() {
    const R = LD.result, total = LD.total;
    const bottle = b => `<figure class="lp-res-b"><img src="${esc(b.photo)}" alt="" loading="lazy"><figcaption><b>${esc(pname(b))}</b><span>${esc(b.house)}</span></figcaption></figure>`;
    const out = lang === "en" ? t().getOut(total) : t().getOut(total, R.out);
    return `<section class="lp-sec lp-get" id="lp-get">${head("getKick", t().getH)}
      <div class="lp-res">
        <div class="lp-res-name">${R.emblem}<p class="lp-res-k">${esc(t().getPalate)}</p><h3>${esc(R.palate[lang])}</h3></div>
        <div class="lp-res-bad"><span class="lp-res-k">${esc(t().getBad)}</span>${R.breakers.map(b => `<span class="lp-res-chip">${esc(b[lang])}</span>`).join("")}</div>
        <p class="lp-res-out"><b data-count="${R.out}">${esc(fmt(R.out))}</b><span>${esc(out)}</span></p>
        <p class="lp-res-k">${esc(t().getPicks)}</p>
        <div class="lp-res-picks">${R.picks.map(bottle).join("")}</div>
      </div>
      <p class="lp-res-who">${esc(t().getWho(pname(R.still[0]), pname(R.still[1]), pname(R.turned[0]), pname(R.turned[1])))}</p>
      ${goBtn()}
    </section>`;
  }

  /* ---------- the 1,000-perfume test ----------
     The visitor taps the one smell they cannot stand; the count falls from the whole catalogue to the perfumes that do
     not clearly carry it, and the verdict sets that beside the few perfumes that carry none of the popular smells.
     Bit i of each number in LD.test.masks says whether that perfume clearly carries the i-th smell of the likes
     followed by the dislikes. */
  const TESTF = LD.test.likes.concat(LD.test.dislikes);
  const LIKED = LD.test.likes.reduce((m, f) => m | (1 << TESTF.indexOf(f)), 0);
  function testView() {
    const H = hate ? 1 << TESTF.indexOf(hate) : 0, total = LD.test.masks.length;
    let gone = 0, none = 0;
    for (const x of LD.test.masks) { if (x & H) gone++; if (!(x & LIKED)) none++; }
    const shown = total - gone;
    return { shown, total, label: hate ? t().testLeft(shown, t().testNames[hate]) : t().testAll(total), kept: shown / total, gone: gone / total, verdict: hate ? t().testVerdict(gone, none) : "" };
  }
  function testHtml() {
    const v = testView();
    const pick = f => `<button type="button" class="lp-pick hate" data-hate="${f}" aria-pressed="${hate === f}" style="--c:${color(LD.families[f].group)}"><i></i>${esc(t().testNames[f])}</button>`;
    return `<section class="lp-sec lp-test" id="lp-test">${head("testKick", t().testH)}
      <div class="lp-picks" role="group" aria-label="${esc(t().testH)}">${LD.test.dislikes.map(pick).join("")}</div>
      <div class="lp-meter" id="lp-meter">
        <p class="lp-meter-n"><b id="lp-count" data-now="${v.shown}">${esc(fmt(v.shown))}</b><span id="lp-count-k">${esc(v.label)}</span></p>
        <div class="lp-meter-bar" aria-hidden="true"><i class="kept" id="lp-kept" style="--w:${(v.kept * 100).toFixed(1)}%"></i><i class="gone" id="lp-gone" style="--w:${(v.gone * 100).toFixed(1)}%"></i></div>
        <div class="lp-verdict" id="lp-verdict"${v.verdict ? "" : " hidden"}><p id="lp-verdict-t">${esc(v.verdict)}</p><p class="why">${esc(t().testWhy)}</p><a class="btn primary lp-test-go" href="${esc(QUIZ_HREF())}" data-quiz="1">${esc(t().testGo)}</a></div>
        <p class="sr" id="lp-test-live" aria-live="polite"></p>
      </div>
      ${sources(t().testSrc)}
    </section>`;
  }
  /* after a tap: the chips, the count (which runs), the bar (which slides) and the verdict change in place, and the
     count is brought into view if the tap left it off screen */
  function updateTest() {
    const v = testView();
    if (host.querySelectorAll) host.querySelectorAll("[data-hate]").forEach(b => b.setAttribute("aria-pressed", hate === b.dataset.hate));
    countTo($("lp-count"), v.shown);
    $("lp-count-k").textContent = v.label;
    for (const [id, w] of [["lp-kept", v.kept], ["lp-gone", v.gone]]) { const el = $(id); if (el && el.style.setProperty) el.style.setProperty("--w", (w * 100).toFixed(1) + "%"); }
    $("lp-verdict").hidden = !v.verdict;
    $("lp-verdict-t").textContent = v.verdict;
    $("lp-test-live").textContent = `${fmt(v.shown)} ${v.label}. ${v.verdict}`;
    const m = $("lp-meter");
    if (m && m.getBoundingClientRect && m.scrollIntoView) { const r = m.getBoundingClientRect(); if (r.top < 0 || r.bottom > window.innerHeight) m.scrollIntoView({ behavior: motion() ? "smooth" : "auto", block: "nearest" }); }
  }

  /* ---------- the box turned round: the note list on one side, the ingredient label on the other ---------- */
  function listHtml() {
    const X = LD.example, F = LD.facts.labels;
    const chip = n => `<span class="lp-note" style="--c:${color(n.g)}"><i></i>${esc(noteWord(n))}</span>`;
    const item = x => `<li${x.hidden ? ' class="hit"' : ""}><b>${esc(t().inciNames[x.inci] || x.raw)}</b><span dir="ltr" lang="en">${esc(x.raw)}</span></li>`;
    const top = `<div class="lp-label-top"><img src="${esc(X.photo)}" alt="" loading="lazy"><div><b>${esc(pname(X))}</b><span>${esc(X.house)}</span></div></div>`;
    return `<section class="lp-sec lp-list" id="lp-list">${head("listKick", t().listH, t().listLede(pname(X)))}
      <div class="lp-flip${flipped ? " on" : ""}" id="lp-flip">
        <div class="lp-flip-in">
          <div class="lp-face lp-front"${flipped ? " inert" : ""}>${top}<h3>${esc(t().boxOn)}</h3><div class="lp-notes">${STAGES.flatMap(st => X.notes[st]).map(chip).join("")}</div>
            <p class="lp-tease">${esc(t().boxTease)}</p><button type="button" class="lp-flipbtn" data-flip="1">${esc(t().flip)}<i aria-hidden="true"></i></button></div>
          <div class="lp-face lp-back"${flipped ? "" : " inert"}>${top}<h3>${esc(t().labelOn)}</h3><ol class="lp-inci">${X.label.map(item).join("")}</ol><p class="lp-small">${esc(t().labelHidden)}</p>
            <button type="button" class="lp-flipbtn" data-flip="0">${esc(t().flipBack)}<i aria-hidden="true"></i></button></div>
        </div>
      </div>
      <p class="lp-fact">${esc(t().labelCount(F.checked, F.iso_top, F.iso_listed))}</p>
      ${sources(t().listSrc)}
    </section>`;
  }
  /* turning the box plays in place, so the card can turn */
  function flip(on) {
    flipped = on;
    const card = $("lp-flip"); if (!card || !card.classList) return;
    card.classList.toggle("on", on);
    const front = card.querySelector && card.querySelector(".lp-front"), back = card.querySelector && card.querySelector(".lp-back");
    if (front && back) {
      if (on) { front.setAttribute("inert", ""); back.removeAttribute("inert"); } else { back.setAttribute("inert", ""); front.removeAttribute("inert"); }
      const b = (on ? back : front).querySelector(".lp-flipbtn"); if (b) b.focus({ preventScroll: true });
    }
  }

  /* ---------- the nose: 100 people and one smell, on a plum band; the same dots stay hollow from smell to smell ---------- */
  const PEOPLE = (() => { let a = 7; return shuffle(Array.from({ length: 100 }, (_, i) => i), () => (a = (a * 16807) % 2147483647) / 2147483647); })();
  const RANK = Object.fromEntries(PEOPLE.map((d, k) => [d, k]));
  function noseHtml() {
    const cases = t().noseCases, c = cases.find(x => x.id === noseId) || cases[cases.length - 1], cannot = 100 - c.can;
    const about = c.about ? t().noseAbout + " " : "";
    return `<section class="lp-sec lp-nose lp-band" id="lp-nose">${head("noseKick", t().noseH, t().noseLede)}
      <div class="lp-pills" role="group" aria-label="${esc(t().noseGroup)}">${cases.map(x => `<button type="button" aria-pressed="${x.id === c.id}" data-nose="${x.id}" style="--c:${color(x.g)}"><i></i>${esc(x.name)}</button>`).join("")}</div>
      <div class="lp-nose-body">
        <div class="lp-people" role="img" aria-label="${esc(about + t().noseCan(c.can) + ", " + about + t().noseCannot(cannot))}">${Array.from({ length: 100 }, (_, d) => `<i class="${RANK[d] < cannot ? "off" : "on"}" style="--k:${RANK[d]}"></i>`).join("")}</div>
        <p class="lp-legend"><span class="on">${esc(about + t().noseCan(c.can))}</span>${cannot ? `<span class="off">${esc(about + t().noseCannot(cannot))}</span>` : ""}</p>
        <p class="lp-nose-note">${esc(c.note)}</p>
      </div>
      ${sources(t().noseSrc)}
    </section>`;
  }

  function quizHtml() {
    return `<section class="lp-sec lp-quiz" id="lp-quiz">
      <div class="lp-head"><h2>${esc(t().quizH)}</h2><p>${esc(t().quizLede)}</p></div>
      <ol class="lp-steps">${t().quizSteps.map((h, i) => `<li><b>${i + 1}</b><span>${esc(h)}</span></li>`).join("")}</ol>
      ${goBtn()}
    </section>`;
  }
  function artsHtml() {
    return `<section class="lp-sec lp-arts" id="lp-arts">
      <div class="lp-head"><h2>${esc(t().artH)}</h2></div>
      <div class="lp-cards">${t().arts.map(([id, h, p]) => `<a class="lp-card" href="articles.html#${id}"><h3>${esc(h)}</h3><p>${esc(p)}</p><span>${esc(t().artGo)}</span></a>`).join("")}</div>
    </section>`;
  }
  function footHtml() {
    const d = CONFIG.disclosure && CONFIG.disclosure[lang];
    return `<footer class="foot"><nav class="footnav"><a href="${esc(QUIZ_HREF())}" data-quiz="1">${esc(t().navQuiz)}</a><a href="${esc(withEndpoint("profile.html"))}">${esc(t().navProfiler)}</a><a href="articles.html">${esc(t().navArticles)}</a></nav>${t().foot}${d ? `<p>${esc(d)}</p>` : ""}</footer>`;
  }

  function chrome() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    $("lang-en").setAttribute("aria-pressed", lang === "en"); $("lang-ar").setAttribute("aria-pressed", lang === "ar");
    $("brand").innerHTML = esc(t().brand) + "<small>" + esc(t().tagline) + "</small>";
    $("brand").setAttribute("href", withEndpoint("index.html"));
    $("nav-quiz").textContent = t().navQuiz; $("nav-quiz").setAttribute("href", QUIZ_HREF());
    $("nav-profiler").textContent = t().navProfiler; $("nav-profiler").setAttribute("href", withEndpoint("profile.html"));
    $("nav-articles").textContent = t().navArticles;
  }
  function render() {
    if (sprayIdx < 0) nextSpray();   /* the first bottle stands on the stage before it sprays */
    chrome();
    host.innerHTML = heroHtml() + getHtml() + testHtml() + listHtml() + noseHtml() + quizHtml() + artsHtml() + footHtml() +
      `<p class="sr" id="lp-tried-live" aria-live="polite"></p>`;
    mist.canvas = $("lp-mist"); mist.ctx = mist.canvas.getContext ? mist.canvas.getContext("2d") : null; mist.parts = []; mist.size();
    if (shown) showSpray(false);
    reveal();
    if (booted) autoSpray();
  }
  /* every way into the quiz carries the bottles marked as tried, and the calls to action say how many */
  function quizLinks() {
    $("nav-quiz").setAttribute("href", QUIZ_HREF());
    if (!host.querySelectorAll) return;
    host.querySelectorAll("a[data-quiz]").forEach(a => { a.setAttribute("href", QUIZ_HREF()); if (a.classList.contains("lp-go")) a.textContent = ctaText(); });
  }

  /* ---------- spraying ---------- */
  /* the next perfume in a shuffled round of the twenty, leaving out those already marked as tried */
  function nextSpray() {
    const open = i => !tried.includes(LD.sprays[i].id) && i !== sprayIdx;
    sprayOrder = sprayOrder.filter(open);
    if (!sprayOrder.length) sprayOrder = shuffle(LD.sprays.map((s, i) => i).filter(open), Math.random);
    if (!sprayOrder.length) sprayOrder = [Math.floor(Math.random() * LD.sprays.length)];
    sprayIdx = sprayOrder.shift();
    return LD.sprays[sprayIdx];
  }
  /* The notes of the current spray in three rows. fly: they rise from the nozzle (measured after layout, then eased
     into place); without it, or without motion, they simply appear. */
  function showSpray(fly) {
    const s = LD.sprays[sprayIdx], field = $("lp-field"), cap = $("lp-caption"), stage = $("lp-stage");
    if (!s || !field) return;
    field.innerHTML = STAGES.map(st => `<div class="lp-frow"><span class="lp-frow-k">${esc(t().rowStage[st])}</span><div class="lp-fnotes">${s.notes[st].map(n => `<span class="lp-fnote" style="--c:${color(n.g)}"><i></i>${esc(noteWord(n))}</span>`).join("")}</div></div>`).join("");
    fitField(field, stage);
    const focused = cap.contains && cap.contains(document.activeElement) ? document.activeElement.dataset.tried : null;
    cap.innerHTML = captionHtml(s);
    refocus(cap, focused);
    cap.classList.add("on"); stage.classList.add("sprayed");
    $("lp-live").textContent = t().sprayedLive(s.house, pname(s), STAGES.map(st => t().rowStage[st] + ": " + s.notes[st].map(noteWord).join(", ")).join(". "));
    if (!fly || !motion() || !field.querySelectorAll || !stage.getBoundingClientRect) return;
    const nz = nozzle(), box = stage.getBoundingClientRect();
    let k = 0;
    /* each row's label arrives with its row */
    field.querySelectorAll(".lp-frow-k").forEach((el, ri) => {
      el.style.transition = "none"; el.style.opacity = "0";
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = `opacity .5s ease ${(2 - ri) * 110 + 250}ms`; el.style.opacity = "1"; }));
    });
    field.querySelectorAll(".lp-fnote").forEach(el => {
      const r = el.getBoundingClientRect(), dx = nz.x - (r.left - box.left + r.width / 2), dy = nz.y - (r.top - box.top + r.height / 2);
      el.style.transition = "none"; el.style.opacity = "0"; el.style.transform = `translate(${dx}px, ${dy}px) scale(.3)`;
      const row = el.closest(".lp-frow"), ri = [...field.children].indexOf(row);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = ""; el.style.transitionDelay = `${(2 - ri) * 110 + (k++) * 45}ms`;
        el.style.opacity = "1"; el.style.transform = "";
      }));
    });
  }
  /* The notes must stay inside the arch. A long list can reach its curve on a narrow screen, so the chips shrink one
     step at a time until every chip and row label lies inside it. The arch is measured as the browser draws it: radii
     too large for the box are scaled down together, as CSS requires. */
  function fitField(field, stage) {
    field.classList.remove("dense", "denser");
    if (!stage || !stage.getBoundingClientRect || !field.querySelectorAll || !window.getComputedStyle) return;
    const inside = () => {
      const s = stage.getBoundingClientRect(), cs = window.getComputedStyle(stage);
      const rad = v => { const [a, b] = String(v || "0").split(" ").map(parseFloat); return [a || 0, isNaN(b) ? a || 0 : b]; };
      const [tlx, tly] = rad(cs.borderTopLeftRadius), [trx, tr_y] = rad(cs.borderTopRightRadius), [blx, bly] = rad(cs.borderBottomLeftRadius), [brx, bry] = rad(cs.borderBottomRightRadius);
      const k = Math.min(1, s.width / (tlx + trx || 1), s.width / (blx + brx || 1), s.height / (tly + bly || 1), s.height / (tr_y + bry || 1));
      const rx = tlx * k, ry = tly * k;
      for (const el of field.querySelectorAll(".lp-fnote, .lp-frow-k")) {
        const r = el.getBoundingClientRect(), ly = r.top - s.top - 3;
        if (ly < 0) return false;
        for (const x of [r.left - s.left, r.right - s.left]) {
          if (ly >= ry) continue;
          const cx = Math.min(Math.max(x, rx), s.width - rx), dx = (x - cx) / rx, dy = (ly - ry) / ry;
          if (dx * dx + dy * dy > 1) return false;
        }
      }
      return true;
    };
    for (const c of ["dense", "denser"]) { if (inside()) return; field.classList.add(c); }
  }
  /* where the spray leaves: the middle of the top of the bottle's glass (hero.nx, hero.ny, measured on its picture by
     tools/fetch_hero_bottles.py), in the stage's own pixels */
  function nozzle() {
    const stage = $("lp-stage"), img = $("lp-glass").querySelector("img"), H = LD.sprays[sprayIdx].hero;
    const b = stage.getBoundingClientRect(), r = img.getBoundingClientRect();
    return { x: r.left - b.left + r.width * H.nx, y: r.top - b.top + r.height * H.ny };
  }
  /* The bottle on the stage becomes the perfume given, then `then` runs. With motion the old bottle sinks away and the
     new one rises in once its picture is ready; without it, or under the test stub, it is simply replaced. */
  function showBottle(s, then) {
    const g = $("lp-glass"), btn = $("lp-bottle"), img = g && g.querySelector ? g.querySelector("img") : null;
    if (btn) btn.setAttribute("aria-label", t().bottleLabel(pname(s)));
    if (!img) { then(); return; }
    const swap = () => { img.setAttribute("src", s.hero.src); img.setAttribute("width", s.hero.w); img.setAttribute("height", s.hero.h); };
    if (!motion() || typeof Image !== "function") { swap(); then(); return; }
    const pre = new Image(); pre.src = s.hero.src;
    const ready = pre.decode ? pre.decode().catch(() => {}) : Promise.resolve();
    g.classList.add("out");
    Promise.all([ready, new Promise(r => setTimeout(r, 200))]).then(() => { swap(); g.classList.remove("out"); requestAnimationFrame(then); });
  }
  /* the next bottle's picture, fetched ahead so a press can show it at once */
  function preloadNext() {
    if (typeof Image !== "function") return;
    const open = i => !tried.includes(LD.sprays[i].id) && i !== sprayIdx;
    if (!sprayOrder.filter(open).length) return;
    new Image().src = LD.sprays[sprayOrder.filter(open)[0]].hero.src;
  }
  /* A press: the bottle on the stage sprays straight up into the space its notes rise to. Once it has sprayed, the next
     press brings another perfume's bottle first. */
  function spray() {
    const go = () => {
      const s = LD.sprays[sprayIdx], stage = $("lp-stage");
      if (!s || !stage) return;
      if (motion() && mist.ctx && stage.getBoundingClientRect) {
        const nz = nozzle(), cols = [...new Set(STAGES.flatMap(st => s.notes[st].map(n => color(n.g))))];
        mist.burst(nz.x, nz.y, -Math.PI / 2, cols.length ? cols : ["#E8903A"], 1.1);
      }
      shown = true;
      showSpray(true);
      preloadNext();
    };
    if (swapping) return;   /* a press while a bottle is on its way in waits for it */
    if (shown) { swapping = true; nextSpray(); showBottle(LD.sprays[sprayIdx], () => { swapping = false; go(); }); } else go();
  }
  let swapping = false;
  /* a spray with the press shown, as a finger gives */
  const pressSpray = () => { squeeze(true); spray(); setTimeout(() => squeeze(false), 220); };
  /* the press as a picture only: the bottle dips while a finger or the mouse is down, and for a moment after a key */
  const squeeze = on => { const st = $("lp-stage"); if (st) st.classList.toggle("pressed", on); };
  /* the visitor's own first press or answer ends the hint on the bulb */
  const touch = () => { touched = true; const st = $("lp-stage"); if (st) st.classList.add("touched"); };
  /* a redrawn caption hands keyboard focus back to the answer button that had it */
  const refocus = (cap, which) => { if (!which || !cap.querySelector) return; const b = cap.querySelector(`[data-tried="${which}"]`); if (b) b.focus({ preventScroll: true }); };
  /* Tried it? Yes adds the bottle to the quiz links and says so, then the next perfume comes; Not yet sprays the next. */
  let nextTimer = null;
  function answerTried(yes) {
    const s = LD.sprays[sprayIdx]; if (!s || !shown) return;
    touch();
    clearTimeout(nextTimer);
    if (!yes) { pressSpray(); return; }
    if (!tried.includes(s.id)) { tried.push(s.id); send("land:tried", tried.length); }
    quizLinks();
    const cap = $("lp-caption"); if (cap) { cap.innerHTML = captionHtml(s); refocus(cap, "yes"); }
    const live = $("lp-tried-live"); if (live) live.textContent = `${t().triedDone}: ${pname(s)}. ${ctaText()}.`;
    nextTimer = setTimeout(pressSpray, 900);
  }
  /* sections fade up as they come into view; without IntersectionObserver or motion they are simply there */
  let io = null;
  function reveal() {
    const els = host.querySelectorAll ? host.querySelectorAll(".lp-sec") : [];
    if (!motion() || !("IntersectionObserver" in window)) { els.forEach(el => el.classList.add("seen")); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("seen"); io.unobserve(e.target);
      /* true counts run up from zero as their section arrives */
      e.target.querySelectorAll("[data-count]").forEach(el => { el.dataset.now = 0; el.textContent = fmt(0); countTo(el, +el.dataset.count); });
    }), { rootMargin: "0px 0px -10% 0px" });
    els.forEach(el => io.observe(el));
  }

  /* ---------- events ----------
     The bottle sprays on a completed press (a click, which a tap, the mouse and Enter or Space all give), so a finger
     that starts a scroll on the bottle does not spray. */
  host.addEventListener("pointerdown", e => {
    if (!e.target.closest || !e.target.closest("#lp-bottle") || e.button !== 0) return;
    if (e.pointerType === "mouse") e.preventDefault();
    squeeze(true);
  });
  document.addEventListener("pointerup", () => squeeze(false));
  document.addEventListener("pointercancel", () => squeeze(false));
  host.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const d = b.dataset;
    if (b.id === "lp-bottle") { touch(); clearTimeout(nextTimer); if (e.detail === 0) { squeeze(true); setTimeout(() => squeeze(false), 160); } spray(); return; }
    if (d.tried) { answerTried(d.tried === "yes"); return; }
    if (d.hate) { hate = hate === d.hate ? null : d.hate; updateTest(); return; }
    if (d.flip) { flip(d.flip === "1"); return; }
    if (d.nose) { noseId = d.nose; swap("lp-nose", noseHtml, `[data-nose="${d.nose}"]`); return; }
  });
  /* redraw one section in place, keeping it revealed, and keep focus on the control that was used */
  function swap(id, html, focusSel) {
    const old = $(id); if (!old) return;
    const tmp = document.createElement("div"); tmp.innerHTML = html();
    const el = tmp.firstElementChild; el.classList.add("seen"); old.replaceWith(el);
    const f = focusSel ? el.querySelector(focusSel) : null; if (f) f.focus({ preventScroll: true });
  }
  $("lang-en").addEventListener("click", () => { lang = "en"; store.set("pp_lang", lang); render(); });
  $("lang-ar").addEventListener("click", () => { lang = "ar"; store.set("pp_lang", lang); render(); });
  if (window.addEventListener) window.addEventListener("resize", () => { mist.size(); if (sprayIdx >= 0) fitField($("lp-field"), $("lp-stage")); });

  /* one spray on its own as soon as the bottle is in view (on most phones it sits under the promise, on the first
     screen), so the page shows what it does; a visitor who presses first skips it */
  let autoIo = null, booted = false;
  function autoSpray() {
    if (autoIo) { autoIo.disconnect(); autoIo = null; }
    if (shown) return;
    const go = () => { if (shown || document.visibilityState === "hidden") return; pressSpray(); };
    const st = $("lp-bottle"); if (!st) return;
    if (!("IntersectionObserver" in window)) { setTimeout(go, 900); return; }
    autoIo = new IntersectionObserver(es => { if (es.some(e => e.intersectionRatio >= .5)) { autoIo.disconnect(); autoIo = null; setTimeout(go, 600); } }, { threshold: [.5] });
    autoIo.observe(st);
  }
  render();
  booted = true;
  autoSpray();
})();
