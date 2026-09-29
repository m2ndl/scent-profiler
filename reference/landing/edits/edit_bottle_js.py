"""One-off: replaces the brass atomizer in site/js/landing.js with the sprayed perfume's own bottle (29 Sep 2026).
Exact-match edits; fails on a second run."""
p = r"C:\Users\malha\Desktop\Webapps\perfume-profiler\site\js\landing.js"
s = open(p, encoding="utf-8").read()
pairs = [
    # header comment
    ('''/* The front page (index.html), written for a visitor who scrolls more than reads: a hook and the atomizer on the first
   screen, then a real result, then three short sections that each turn on one tap, then the quiz (quiz.html) and the
   articles. Every section holds one headline, one interaction and one line; its sources fold away under it.
   The centrepiece is a classic atomizer of antique brass (drawn in 3D by js/bottle3d.js): a completed press on it
   squeezes the rubber bulb and sprays one of the quiz's twenty perfumes, whose listed notes rise from the mist in three
   rows, first minutes, first hours and hours later (js/landing-data.js, built by tools/build_landing.js). Under it the
   quiz's first question waits: tried it? Each bottle the visitor has tried goes into the quiz links (?tried=), so the
   quiz opens with them picked. The mist and every other movement sit under prefers-reduced-motion: no-preference;
   without motion the notes simply appear. Shared words and the device store come from page.js. */''',
     '''/* The front page (index.html), written for a visitor who scrolls more than reads: a hook and a perfume bottle on the
   first screen, then a real result, then three short sections that each turn on one tap, then the quiz (quiz.html) and
   the articles. Every section holds one headline, one interaction and one line; its sources fold away under it.
   The centrepiece is the real bottle of one of the quiz's twenty perfumes (its picture from site/img/hero/): a completed
   press on it sprays from its top straight up, and its listed notes rise out of the mist in three rows, first minutes,
   first hours and hours later (js/landing-data.js, built by tools/build_landing.js); the next press brings another
   perfume's bottle, which sprays in its turn. Under it the quiz's first question waits: tried it? Each bottle the visitor
   has tried goes into the quiz links (?tried=), so the quiz opens with them picked. The mist and every other movement
   sit under prefers-reduced-motion: no-preference; without motion the bottles swap and the notes simply appear. Shared
   words and the device store come from page.js. */'''),
    ('''  const tried = [];                       /* the bottles the visitor said, under the atomizer, they have tried */''',
     '''  const tried = [];                       /* the bottles the visitor said, under the stage, they have tried */'''),
    ('''     visitor marks as tried under the atomizer (n: how many so far). */''',
     '''     visitor marks as tried under the stage (n: how many so far). */'''),
    # words
    ('''      press: "Press the bulb",
      bottleLabel: "Perfume atomizer. Press to spray one of the quiz's twenty perfumes and see its notes.",''',
     '''      press: "Press the bottle",
      bottleLabel: name => `${name}. Press to spray it and see its notes; the next press brings another of the quiz's twenty perfumes.`,'''),
    ('''      press: "اضغط على الكرة",
      bottleLabel: "بخّاخ عطر. اضغط لترشّ أحد العطور العشرين في الاختبار وترى نوتاته.",''',
     '''      press: "اضغط على الزجاجة",
      bottleLabel: name => `${name}. اضغط لترشّه وترى نوتاته، والضغطة التالية تأتي بعطر آخر من عطور الاختبار العشرين.`,'''),
    # the atomizer block
    ('''  /* ---------- the atomizer ----------
     A classic atomizer of antique brass: an engraved flacon with a jewel, a silk cord and a rubber bulb in a net.
     js/bottle3d.js draws it live in 3D when WebGL is there; until then, and without it, the page shows a still picture of
     the same atomizer (drawn by tools/render_atomizer.py, which also checks the two positions below). NOZZLE and BULB
     are where the nozzle and the middle of the bulb fall in the atomizer box, as shares of its width and height, drawn
     left to right; in Arabic the atomizer is turned round, so the spray leaves toward the open side of the page. */
  const POSTER = { ltr: "img/atomizer-ltr.webp", rtl: "img/atomizer-rtl.webp" };
  const NOZZLE = [0.884, 0.134], BULB = [0.319, 0.698];
  let jewel = null;   /* the colour the live atomizer's jewel takes for the perfume last sprayed */

''', ''),
    # mist: a spread parameter
    ('''    /* one burst from (x, y) toward angle a (radians), in the colours given: fine droplets in the perfume's colours,
       with a few soft clouds among them, strong enough to read as a spray on a phone */
    burst(x, y, a, cols) {
      const k = Math.max(.6, Math.min(1.3, this.w / 460));
      cols = cols.map(c => tint(c, .85));
      for (let i = 0; i < 260; i++) {
        const spread = (Math.random() - .5) * .75, sp = (3 + Math.random() * 8) * k, big = Math.random() < .16;''',
     '''    /* one burst from (x, y) toward angle a (radians), fanning out over `fan` radians, in the colours given: fine
       droplets in the perfume's colours, with a few soft clouds among them, strong enough to read as a spray on a phone */
    burst(x, y, a, cols, fan) {
      const k = Math.max(.6, Math.min(1.3, this.w / 460));
      cols = cols.map(c => tint(c, .85));
      for (let i = 0; i < 260; i++) {
        const spread = (Math.random() - .5) * (fan || .75), sp = (3 + Math.random() * 8) * k, big = Math.random() < .16;'''),
    ('''     It runs only while droplets are alive, and holds at most 720 of them however fast the bulb is pressed. */''',
     '''     It runs only while droplets are alive, and holds at most 720 of them however fast the bottle is pressed. */'''),
    # state
    ('''  let sprayIdx = -1, sprayOrder = [], touched = false;''',
     '''  let sprayIdx = -1, sprayOrder = [], touched = false;
  let shown = false;   /* whether the bottle on the stage has sprayed, so its notes and question are out */'''),
    # hero markup
    ('''        <button type="button" class="lp-atomizer" id="lp-atomizer" aria-label="${esc(t().bottleLabel)}" style="--bx:${BULB[0]};--by:${BULB[1]}"><img class="lp-poster" src="${lang === "ar" ? POSTER.rtl : POSTER.ltr}" alt="" width="420" height="330" draggable="false"><span class="lp-hint" id="lp-hint">${esc(t().press)}</span></button>''',
     '''        <button type="button" class="lp-bottle" id="lp-bottle" aria-label="${esc(t().bottleLabel(pname(s)))}"><span class="lp-glass" id="lp-glass"><img src="${esc(s.hero.src)}" alt="" width="${s.hero.w}" height="${s.hero.h}" draggable="false"><span class="lp-hint" id="lp-hint">${esc(t().press)}</span></span></button>'''),
    ('''  function heroHtml() {
    return `<section class="lp-hero" id="lp-hero">''',
     '''  function heroHtml() {
    const s = LD.sprays[sprayIdx];
    return `<section class="lp-hero" id="lp-hero">'''),
    # caption: no thumbnail (the bottle stands above it); the perfume's id marks it
    ('''  /* under the atomizer: the perfume just sprayed, and the quiz's first question about it */
  function captionHtml(s) {
    const done = tried.includes(s.id);
    return `<img src="${esc(s.photo)}" alt=""><div class="lp-cap-t"><b>${esc(pname(s))}</b><span>${esc(s.house)}</span></div>''',
     '''  /* under the bottle: the perfume just sprayed, and the quiz's first question about it */
  function captionHtml(s) {
    const done = tried.includes(s.id);
    return `<div class="lp-cap-t" data-id="${esc(s.id)}"><b>${esc(pname(s))}</b><span>${esc(s.house)}</span></div>'''),
    # render: choose the first bottle before drawing; redraw its notes only once it has sprayed
    ('''  function render() {
    chrome();''',
     '''  function render() {
    if (sprayIdx < 0) nextSpray();   /* the first bottle stands on the stage before it sprays */
    chrome();'''),
    ('''    if (sprayIdx >= 0) showSpray(false);
    mount3d();
    reveal();''',
     '''    if (shown) showSpray(false);
    reveal();'''),
    # spraying: the jewel goes
    ('''    /* the jewel takes the colour of the perfume's strongest family in its first hours */
    const f = ((s.stages.heart || [])[0] || (s.stages.opening || [])[0] || [])[0], g = f && LD.families[f] ? LD.families[f].group : null;
    jewel = color(g); if (window.PP_ATOMIZER3D) window.PP_ATOMIZER3D.tint(jewel);
''', ''),
    # nozzle and spray
    ('''  function nozzle() {
    const stage = $("lp-stage"), A = window.PP_ATOMIZER3D;
    const live = A && stage.classList.contains && stage.classList.contains("gl") ? A.nozzle() : null;
    if (live) return live;
    const b = stage.getBoundingClientRect(), r = $("lp-atomizer").getBoundingClientRect(), fx = lang === "ar" ? 1 - NOZZLE[0] : NOZZLE[0];
    return { x: r.left - b.left + r.width * fx, y: r.top - b.top + r.height * NOZZLE[1] };
  }
  function spray() {
    const s = nextSpray(), stage = $("lp-stage");
    if (!stage) return;
    if (motion() && mist.ctx && stage.getBoundingClientRect) {
      const nz = nozzle(), a = lang === "ar" ? Math.PI + .62 : -.62;
      const cols = [...new Set(STAGES.flatMap(st => s.notes[st].map(n => color(n.g))))];
      mist.burst(nz.x, nz.y, a, cols.length ? cols : ["#E8903A"]);
    }
    showSpray(true);
  }
  /* a spray with the bulb's squeeze shown, as a press gives */
  const pressSpray = () => { squeeze(true); spray(); setTimeout(() => squeeze(false), 220); };
  /* the squeeze as a picture only: it shows while a finger or the mouse is down, and for a moment after a key */
  const squeeze = on => { const st = $("lp-stage"); if (st) st.classList.toggle("pressed", on); if (window.PP_ATOMIZER3D) window.PP_ATOMIZER3D.squeeze(on); };''',
     '''  /* where the spray leaves: the middle of the top of the bottle's glass (hero.nx, hero.ny, measured on its picture by
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
    if (shown) { nextSpray(); showBottle(LD.sprays[sprayIdx], go); } else go();
  }
  /* a spray with the press shown, as a finger gives */
  const pressSpray = () => { squeeze(true); spray(); setTimeout(() => squeeze(false), 220); };
  /* the press as a picture only: the bottle dips while a finger or the mouse is down, and for a moment after a key */
  const squeeze = on => { const st = $("lp-stage"); if (st) st.classList.toggle("pressed", on); };'''),
    # the tried answer needs a bottle that has sprayed
    ('''    const s = LD.sprays[sprayIdx]; if (!s) return;
    touch();''',
     '''    const s = LD.sprays[sprayIdx]; if (!s || !shown) return;
    touch();'''),
    # mount3d goes
    ('''  /* the live atomizer takes the picture's place after every render, once js/bottle3d.js has loaded; the hint and its
     ring then follow the bulb as drawn */
  function mount3d() {
    const A = window.PP_ATOMIZER3D, b = $("lp-atomizer"), st = $("lp-stage");
    if (!A || !b || !st) return;
    A.mount(b, st, lang === "ar");
    const p = A.bulb();
    if (p) { b.style.setProperty("--bx", (lang === "ar" ? 1 - p.fx : p.fx).toFixed(3)); b.style.setProperty("--by", p.fy.toFixed(3)); }
    if (jewel) A.tint(jewel);
  }
  document.addEventListener("pp:atomizer3d", mount3d);

''', ''),
    # events
    ('''     The bottle sprays on a completed press (a click, which a tap, the mouse and Enter or Space all give), so a finger''',
     '''     The bottle sprays on a completed press (a click, which a tap, the mouse and Enter or Space all give), so a finger'''),
    ('''    if (!e.target.closest || !e.target.closest("#lp-atomizer") || e.button !== 0) return;''',
     '''    if (!e.target.closest || !e.target.closest("#lp-bottle") || e.button !== 0) return;'''),
    ('''    if (b.id === "lp-atomizer") { touch(); clearTimeout(nextTimer); if (e.detail === 0) { squeeze(true); setTimeout(() => squeeze(false), 160); } spray(); return; }''',
     '''    if (b.id === "lp-bottle") { touch(); clearTimeout(nextTimer); if (e.detail === 0) { squeeze(true); setTimeout(() => squeeze(false), 160); } spray(); return; }'''),
    # auto spray
    ('''  /* one spray on its own as soon as the bottle is in view (on most phones it sits under the promise, on the first
     screen), so the page shows what it does; a visitor who presses first skips it */
  let autoIo = null, booted = false;
  function autoSpray() {
    if (autoIo) { autoIo.disconnect(); autoIo = null; }
    if (sprayIdx >= 0) return;
    const go = () => { if (sprayIdx >= 0 || document.visibilityState === "hidden") return; pressSpray(); };
    const st = $("lp-atomizer"); if (!st) return;''',
     '''  /* one spray on its own as soon as the bottle is in view (on most phones it sits under the promise, on the first
     screen), so the page shows what it does; a visitor who presses first skips it */
  let autoIo = null, booted = false;
  function autoSpray() {
    if (autoIo) { autoIo.disconnect(); autoIo = null; }
    if (shown) return;
    const go = () => { if (shown || document.visibilityState === "hidden") return; pressSpray(); };
    const st = $("lp-bottle"); if (!st) return;'''),
]
for a, b in pairs:
    assert s.count(a) == 1, a[:100]
    s = s.replace(a, b)
open(p, "w", encoding="utf-8", newline="\n").write(s)
print("applied")
