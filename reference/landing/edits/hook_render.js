  /* ---------- rendering ---------- */
  let sprayIdx = -1, sprayOrder = [];
  let spoilId = null, spoilPick = null, timeId = null, timeMin = 10, noseId = "musk", flipped = false;
  const likes = new Set(); let hate = null;   /* the 1,000-perfume test: smells tapped as liked, and the one that is not */
  /* the critics' stars: how many of the 1,207 rated reviews in Perfumes: The Guide (2018) got one to five stars */
  const STARS = [98, 489, 389, 212, 19];

  const fmt = n => (lang === "en" ? fmtEn(n) : String(n));
  const kick = k => `<p class="lp-kick">${esc(t()[k])}</p>`;
  const head = (k, h, p) => `<div class="lp-head">${kick(k)}<h2>${esc(h)}</h2>${p ? `<p>${esc(p)}</p>` : ""}</div>`;
  const tag = k => `<span class="lp-tag">${esc(t()[k])}</span>`;
  /* a section's sources, folded away under the section */
  const sources = text => `<details class="lp-srcx"><summary>${esc(t().srcTag)}</summary><p>${esc(text)}</p></details>`;
  const inQuiz = text => `<p class="lp-inquiz">${tag("quizTag")}${esc(text)}</p>`;
  /* the question a section leaves open, which leads to the section that answers it */
  const next = (text, to) => `<a class="lp-next" href="#${to}" data-next="${to}"><span>${esc(text)}</span><i aria-hidden="true"></i></a>`;
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
    return `<section class="lp-hero" id="lp-hero">
      <div class="lp-hero-text">
        <p class="lp-eyebrow">${esc(t().eyebrow)}</p>
        <h1>${esc(t().h1)}</h1>
        <p class="lp-lede">${esc(t().lede)}</p>
        <a class="btn primary lp-go" href="${esc(QUIZ_HREF())}">${esc(t().start)}</a>
        <p class="lp-under"><span>${esc(t().startNote)}</span> <a class="lp-down" href="#lp-test" data-next="lp-test">${esc(t().down)}<i aria-hidden="true"></i></a></p>
      </div>
      <div class="lp-stage" id="lp-stage">
        <canvas class="lp-mist" id="lp-mist" aria-hidden="true"></canvas>
        <div class="lp-field" id="lp-field" aria-hidden="true"></div>
        <div class="lp-invite" aria-hidden="true"><p>${esc(t().invite)}</p></div>
        <button type="button" class="lp-atomizer" id="lp-atomizer" aria-label="${esc(t().bottleLabel)}" style="--bx:${BULB[0]};--by:${BULB[1]}"><img class="lp-poster" src="${lang === "ar" ? POSTER.rtl : POSTER.ltr}" alt="" width="420" height="330" draggable="false"><span class="lp-hint" id="lp-hint">${esc(t().press)}</span></button>
        <div class="lp-caption" id="lp-caption"></div>
        <p class="sr" id="lp-live" aria-live="polite"></p>
      </div>
    </section>`;
  }

  /* ---------- the 1,000-perfume test ----------
     How many catalogue perfumes clearly carry at least one smell the visitor likes, and how many of those are left
     once the one smell they cannot stand is taken out. Bit i of each number in LD.test.masks says whether that perfume
     clearly carries the i-th smell of the likes followed by the dislikes. */
  const TESTF = LD.test.likes.concat(LD.test.dislikes);
  function testView() {
    const bit = f => 1 << TESTF.indexOf(f);
    const L = [...likes].reduce((m, f) => m | bit(f), 0), H = hate ? bit(hate) : 0, total = LD.test.masks.length;
    let n = 0, m = 0;
    for (const x of LD.test.masks) if (!L || (x & L)) { n++; if (!(x & H)) m++; }
    const shown = H ? m : n;
    return {
      shown, total,
      label: H ? t().testLeft(m, t().testNames[hate]) : L ? t().testLiked(n) : t().testAll(total),
      kept: shown / total, gone: H ? (n - m) / total : 0,
      verdict: H ? t().testVerdict(total - n, n - m) : ""
    };
  }
  function testHtml() {
    const v = testView();
    const pick = (f, kind, on) => `<button type="button" class="lp-pick${kind === "hate" ? " hate" : ""}" data-${kind}="${f}" aria-pressed="${on}" style="--c:${color(LD.families[f].group)}"><i></i>${esc(t().testNames[f])}</button>`;
    return `<section class="lp-sec lp-test" id="lp-test">${head("testKick", t().testH)}
      <div class="lp-test-body">
        <div class="lp-meter">
          <p class="lp-meter-n"><b id="lp-count" data-now="${v.shown}">${esc(fmt(v.shown))}</b><span id="lp-count-k">${esc(v.label)}</span></p>
          <div class="lp-meter-bar" aria-hidden="true"><i class="kept" id="lp-kept" style="--w:${(v.kept * 100).toFixed(1)}%"></i><i class="gone" id="lp-gone" style="--w:${(v.gone * 100).toFixed(1)}%"></i></div>
          <div class="lp-verdict" id="lp-verdict"${v.verdict ? "" : " hidden"}><p id="lp-verdict-t">${esc(v.verdict)}</p><p class="why">${esc(t().testWhy)}</p><a class="btn primary lp-test-go" href="${esc(QUIZ_HREF())}">${esc(t().testGo)}</a></div>
          <p class="sr" id="lp-test-live" aria-live="polite"></p>
        </div>
        <div class="lp-test-picks">
          <p class="lp-test-k">${esc(t().testLike)}</p>
          <div class="lp-picks" role="group" aria-label="${esc(t().testLike)}">${LD.test.likes.map(f => pick(f, "like", likes.has(f))).join("")}</div>
          <p class="lp-test-k">${esc(t().testHate)}</p>
          <div class="lp-picks" role="group" aria-label="${esc(t().testHate)}">${LD.test.dislikes.map(f => pick(f, "hate", hate === f)).join("")}</div>
        </div>
      </div>
      ${sources(t().testSrc)}
      ${next(t().testNext, "lp-list")}
    </section>`;
  }
  /* after a tap: the chips, the count (which runs), the bar (which slides) and the verdict change in place */
  function updateTest() {
    const v = testView();
    if (host.querySelectorAll) {
      host.querySelectorAll("[data-like]").forEach(b => b.setAttribute("aria-pressed", likes.has(b.dataset.like)));
      host.querySelectorAll("[data-hate]").forEach(b => b.setAttribute("aria-pressed", hate === b.dataset.hate));
    }
    countTo($("lp-count"), v.shown);
    $("lp-count-k").textContent = v.label;
    for (const [id, w] of [["lp-kept", v.kept], ["lp-gone", v.gone]]) { const el = $(id); if (el && el.style.setProperty) el.style.setProperty("--w", (w * 100).toFixed(1) + "%"); }
    $("lp-verdict").hidden = !v.verdict;
    $("lp-verdict-t").textContent = v.verdict;
    $("lp-test-live").textContent = `${fmt(v.shown)} ${v.label}. ${v.verdict}`;
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
            <button type="button" class="lp-flipbtn" data-flip="1">${esc(t().flip)}<i aria-hidden="true"></i></button></div>
          <div class="lp-face lp-back"${flipped ? "" : " inert"}>${top}<h3>${esc(t().labelOn)}</h3><ol class="lp-inci">${X.label.map(item).join("")}</ol><p class="lp-small">${esc(t().labelHidden)}</p>
            <button type="button" class="lp-flipbtn" data-flip="0">${esc(t().flipBack)}<i aria-hidden="true"></i></button></div>
        </div>
      </div>
      <p class="lp-fact">${esc(t().labelCount(F.checked, F.iso_top, F.iso_listed))}</p>
      <p class="lp-fact">${esc(t().jasmine)}</p>
      ${sources(t().listSrc)}
      ${next(t().listNext, "lp-nose")}
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

  /* ---------- the nose: 100 people and one smell; the same dots stay hollow from smell to smell ---------- */
  const PEOPLE = (() => { let a = 7; return shuffle(Array.from({ length: 100 }, (_, i) => i), () => (a = (a * 16807) % 2147483647) / 2147483647); })();
  const RANK = Object.fromEntries(PEOPLE.map((d, k) => [d, k]));
  function noseHtml() {
    const cases = t().noseCases, c = cases.find(x => x.id === noseId) || cases[cases.length - 1], cannot = 100 - c.can;
    const about = c.about ? t().noseAbout + " " : "";
    return `<section class="lp-sec lp-nose" id="lp-nose">${head("noseKick", t().noseH, t().noseLede)}
      <div class="lp-pills" role="group">${cases.map(x => `<button type="button" aria-pressed="${x.id === c.id}" data-nose="${x.id}" style="--c:${color(x.g)}"><i></i>${esc(x.name)}</button>`).join("")}</div>
      <div class="lp-nose-body">
        <div class="lp-people" role="img" aria-label="${esc(about + t().noseCan(c.can) + ", " + about + t().noseCannot(cannot))}" style="--c:${color(c.g)}">${Array.from({ length: 100 }, (_, d) => `<i class="${RANK[d] < cannot ? "off" : "on"}" style="--k:${RANK[d]}"></i>`).join("")}</div>
        <div class="lp-nose-text">
          <p class="lp-legend"><span class="on" style="--c:${color(c.g)}">${esc(about + t().noseCan(c.can))}</span>${cannot ? `<span class="off">${esc(about + t().noseCannot(cannot))}</span>` : ""}</p>
          <p class="lp-nose-note">${esc(c.note)}</p>
          <p class="lp-nose-critics">${esc(t().noseCritics)}</p>
        </div>
      </div>
      ${sources(t().noseSrc)}
      ${next(t().noseNext, "lp-spoil")}
    </section>`;
  }

  /* a row of perfumes to choose from, one pressed */
  const tabs = (ids, cur, attr) => `<div class="lp-tabs" role="group">${ids.map(id => { const s = byId[id]; return s ? `<button type="button" aria-pressed="${id === cur}" data-${attr}="${id}"><img src="${esc(s.photo)}" alt="" loading="lazy"><span>${esc(pname(s))}</span></button>` : ""; }).join("")}</div>`;
  /* ---------- one note: the result in words, which the stable live region below the sections reads out ---------- */
  function spoilText() {
    const s = byId[spoilId] || byId[t().spoilIds[0]];
    const all = STAGES.flatMap(st => s.notes[st].map((n, k) => ({ n, key: st + ":" + k })));
    const pick = all.find(x => x.key === spoilPick);
    if (!pick) return [];
    const F = pick.n.f && LD.families[pick.n.f];
    return [t().spoilResult(noteWord(pick.n), all.length, pname(s))].concat(F ? [t().spoilFamily(fam(pick.n.f), F.count, LD.total)] : []);
  }
  function spoilHtml() {
    const s = byId[spoilId] || byId[t().spoilIds[0]];
    const juice = STAGES.flatMap(st => s.notes[st].map(n => color(n.g)));
    const stops = juice.map((c, i) => `${c} ${Math.round((i / Math.max(1, juice.length - 1)) * 100)}%`).join(", ");
    const lines = spoilText();
    const result = lines.length ? lines.map(l => `<p>${esc(l)}</p>`).join("") + `<p class="lp-result-go"><a class="btn primary" href="${esc(QUIZ_HREF())}">${esc(t().start)}</a></p>` : "";
    return `<section class="lp-sec lp-spoil" id="lp-spoil">${head("spoilKick", t().spoilH, t().spoilLede)}
      ${tabs(t().spoilIds, s.id, "spoil")}
      <div class="lp-spoil-body${spoilPick ? " spoiled" : ""}">
        <div class="lp-vial" aria-hidden="true" style="--juice: linear-gradient(180deg, ${stops})"><i class="lp-vial-cap"></i><i class="lp-vial-glass"><i class="lp-vial-juice"></i></i></div>
        <div class="lp-spoil-notes">
          <p class="lp-small">${esc(t().spoilPick)}</p>
          ${STAGES.map(st => `<div class="lp-row"><span class="lp-row-k">${esc(t().rowStage[st])}</span><div class="lp-chips">${s.notes[st].map((n, k) => { const key = st + ":" + k; return `<button type="button" class="lp-chip${key === spoilPick ? " bad" : ""}" data-note="${key}" aria-pressed="${key === spoilPick}" style="--c:${color(n.g)}"><i></i>${esc(noteWord(n))}</button>`; }).join("")}</div></div>`).join("")}
          <div class="lp-result">${result}</div>
        </div>
      </div>
      <p class="lp-fact">${esc(t().spoilFact)}</p>
      ${inQuiz(t().spoilQuiz)}
      ${sources(t().spoilSrc)}
      ${next(t().spoilNext, "lp-crit")}
    </section>`;
  }

  /* ---------- the rare ones: the critics' stars, counted up as they come into view ---------- */
  function critHtml() {
    const max = Math.max(...STARS);
    return `<section class="lp-sec lp-crit" id="lp-crit">${head("critKick", t().critH)}
      <div class="lp-crit-body">
        <p class="lp-stat"><b>${esc(t().statBig)}</b><span>${esc(t().statText)}</span></p>
        <ul class="lp-stars">${STARS.map((n, i) => `<li class="s${i + 1}"><span class="sr">${esc(t().starsRow(i + 1, n))}</span><span class="lp-stars-k" aria-hidden="true">${"★".repeat(i + 1)}</span><i aria-hidden="true" style="--w:${((n / max) * 100).toFixed(1)}%"></i><span class="lp-stars-n" aria-hidden="true" data-count="${n}">${esc(fmt(n))}</span></li>`).join("")}</ul>
      </div>
      <p class="lp-fact">${esc(t().critLove)}</p>
      ${sources(t().critSrc)}
      ${next(t().critNext, "lp-time")}
    </section>`;
  }

  /* ---------- over the day: the stage a time falls in, the first twenty minutes, then to three hours, then later ---------- */
  const stageAt = m => (m < 20 ? "opening" : m < 180 ? "heart" : "drydown");
  const nowHtml = m => `${esc(t().timeNow(m))} · ${esc(t().timeIn)}: <b>${esc(t().timeStage[stageAt(m)])}</b>`;
  function timeHtml() {
    const s = byId[timeId] || byId[t().timeIds[0]], cur = stageAt(timeMin);
    return `<section class="lp-sec lp-time" id="lp-time">${head("timeKick", t().timeH, t().timeLede)}
      ${tabs(t().timeIds, s.id, "time")}
      <div class="lp-clock">
        <label class="sr" for="lp-range">${esc(t().timeSlider)}</label>
        <input type="range" id="lp-range" min="0" max="480" step="5" value="${timeMin}" aria-valuetext="${esc(t().timeNow(timeMin))}" style="--p:${(timeMin / 480) * 100}%">
        <div class="lp-ticks" aria-hidden="true">${[0, 2, 4, 6, 8].map(h => `<span>${h ? esc(t().tick(h)) : "0"}</span>`).join("")}</div>
        <p class="lp-now" id="lp-now">${nowHtml(timeMin)}</p>
      </div>
      <div class="lp-stages">${STAGES.map(st => `<div class="lp-stagecard${st === cur ? " on" : ""}" data-st="${st}">
          <h3>${esc(t().timeStage[st])}</h3>
          <ul class="lp-bars">${s.stages[st].map(([f, w]) => `<li><span>${esc(fam(f))}</span><i style="--w:${Math.round(w * 100)}%;--c:${color(LD.families[f] ? LD.families[f].group : null)}"></i></li>`).join("")}</ul>
          <p class="lp-small"><b>${esc(t().timeNotes)}:</b> ${esc(s.notes[st].map(noteWord).join(lang === "ar" ? "، " : ", "))}</p>
        </div>`).join("")}</div>
      <p class="lp-fact">${esc(t().timeFact)}</p>
      ${inQuiz(t().timeQuiz)}
      ${sources(t().timeSrc)}
      ${next(t().timeNext, "lp-quiz")}
    </section>`;
  }
  function quizHtml() {
    return `<section class="lp-sec lp-quiz" id="lp-quiz">
      <div class="lp-head"><h2>${esc(t().quizH)}</h2><p>${esc(t().quizLede)}</p></div>
      <ol class="lp-steps">${t().quizSteps.map(([h, p], i) => `<li><b>${i + 1}</b><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></li>`).join("")}</ol>
      <div class="lp-gets"><h3>${esc(t().getH)}</h3><ul>${t().gets.map(([h, p]) => `<li><b>${esc(h)}</b><span>${esc(p)}</span></li>`).join("")}</ul></div>
      <a class="btn primary lp-go" href="${esc(QUIZ_HREF())}">${esc(t().start)}</a>
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
    return `<footer class="foot"><nav class="footnav"><a href="${esc(QUIZ_HREF())}">${esc(t().navQuiz)}</a><a href="${esc(withEndpoint("profile.html"))}">${esc(t().navProfiler)}</a><a href="articles.html">${esc(t().navArticles)}</a></nav>${t().foot}${d ? `<p>${esc(d)}</p>` : ""}</footer>`;
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
    chrome();
    host.innerHTML = heroHtml() + testHtml() + listHtml() + noseHtml() + spoilHtml() + critHtml() + timeHtml() + quizHtml() + artsHtml() + footHtml() +
      `<p class="sr" id="lp-spoil-live" aria-live="polite"></p>`;
    mist.canvas = $("lp-mist"); mist.ctx = mist.canvas.getContext ? mist.canvas.getContext("2d") : null; mist.parts = []; mist.size();
    if (sprayIdx >= 0) showSpray(false);
    mount3d();
    reveal();
    if (booted) autoSpray();
  }

