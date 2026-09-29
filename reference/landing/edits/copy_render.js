  /* ---------- rendering ---------- */
  let sprayIdx = -1, sprayOrder = [];
  let spoilId = null, spoilPick = null, timeId = null, timeMin = 10, noseId = "andro";
  const openStrips = new Set();
  /* the critics' stars: how many of the 1,207 rated reviews in Perfumes: The Guide (2018) got one to five stars */
  const STARS = [98, 489, 389, 212, 19];

  /* a step's heading, the labels of its parts, and a bar of a whole with the share of it that holds something else */
  const head = (n, h, p) => `<div class="lp-head"><p class="lp-step">${esc(t().step(n))}</p><h2>${esc(h)}</h2>${p ? `<p>${esc(p)}</p>` : ""}</div>`;
  const tag = k => `<span class="lp-tag">${esc(t()[k])}</span>`;
  const evidence = text => `<p class="lp-src lp-book">${tag("evTag")}${esc(text)}</p>`;
  const inQuiz = text => `<p class="lp-inquiz">${tag("quizTag")}${esc(text)}</p>`;
  const bar = (share, c1, c2, keys) => `<div class="lp-barwrap" aria-hidden="true" style="--c1:${c1};--c2:${c2}"><div class="lp-bar"><i style="--p:${(share * 100).toFixed(1)}%"></i></div>
      <p class="lp-bar-k"><span class="k1">${esc(keys[0])}</span><span class="k2">${esc(keys[1])}</span></p></div>`;

  function heroHtml() {
    return `<section class="lp-hero" id="lp-hero">
      <div class="lp-hero-text">
        <p class="lp-eyebrow">${esc(t().eyebrow)}</p>
        <h1>${esc(t().h1)}</h1>
        <p class="lp-lede">${esc(t().lede)}</p>
        <a class="btn primary lp-go" href="${esc(QUIZ_HREF())}">${esc(t().start)}</a>
        <p class="lp-under"><span>${esc(t().startNote)}</span> <a href="articles.html">${esc(t().read)}</a></p>
      </div>
      <div class="lp-stage" id="lp-stage">
        <canvas class="lp-mist" id="lp-mist" aria-hidden="true"></canvas>
        <div class="lp-field" id="lp-field" aria-hidden="true"></div>
        <div class="lp-invite" aria-hidden="true"><p>${esc(t().invite)}</p></div>
        <button type="button" class="lp-atomizer" id="lp-atomizer" aria-label="${esc(t().bottleLabel)}">${ATOMIZER}<span class="lp-hint" id="lp-hint">${esc(t().press)}</span></button>
        <div class="lp-caption" id="lp-caption"></div>
        <p class="sr" id="lp-live" aria-live="polite"></p>
      </div>
    </section>`;
  }
  /* test strips: each button carries only the family's name, and the reading opens below it */
  function strips(fams) {
    return `<div class="lp-strips" role="list">${fams.map((f, i) => {
      const F = LD.families[f], on = openStrips.has(f), book = t().matBook[f];
      return `<div class="lp-strip-wrap" role="listitem" style="--i:${i}"><div class="lp-strip${on ? " open" : ""}" style="--c:${color(F.group)}">
          <button type="button" class="lp-strip-btn" data-strip="${f}" aria-expanded="${on}" aria-controls="strip-${f}"><span class="lp-strip-name">${esc(fam(f))}</span><span class="lp-strip-tap" aria-hidden="true">${esc(t().matTap)}</span></button>
          <div class="lp-strip-more" id="strip-${f}"${on ? "" : " hidden"}><span class="lp-strip-hint">${esc(lang === "ar" ? F.hint_ar : F.hint_en)}</span><span class="lp-strip-count">${esc(t().matCount(F.count, LD.total))}</span>${book ? `<span class="lp-strip-book">${esc(book)}</span>` : ""}</div>
        </div></div>`;
    }).join("")}</div>`;
  }
  /* step 1: the families of smells most people like, and how many perfumes carry at least one */
  function likedHtml() {
    const L = LD.facts.liked;
    return `<section class="lp-sec lp-mat" id="lp-mat">${head(1, t().likedH, t().likedLede(L.any, LD.total))}${strips(L.fams)}</section>`;
  }
  /* step 2: the critics' stars */
  function critHtml() {
    const max = Math.max(...STARS);
    return `<section class="lp-sec lp-crit" id="lp-crit">${head(2, t().critH, t().critLede)}
      <div class="lp-crit-body">
        <p class="lp-stat"><b>${esc(t().statBig)}</b><span>${esc(t().statText)}</span></p>
        <ul class="lp-stars">${STARS.map((n, i) => `<li class="s${i + 1}"><span class="sr">${esc(t().starsRow(i + 1, n))}</span><span class="lp-stars-k" aria-hidden="true">${"★".repeat(i + 1)}</span><i aria-hidden="true" style="--w:${((n / max) * 100).toFixed(1)}%"></i><span class="lp-stars-n" aria-hidden="true">${esc(lang === "en" ? fmtEn(n) : n)}</span></li>`).join("")}</ul>
      </div>
      ${evidence(t().critSrc)}
    </section>`;
  }
  /* step 3: one perfume's note list beside its ingredient label, a lovely smell with an unlovely part, and the two
     families of synthetic materials behind common list words */
  function listHtml() {
    const X = LD.example, F = LD.facts.labels, wf = LD.families.white_floral;
    const chip = n => `<span class="lp-note" style="--c:${color(n.g)}"><i></i>${esc(noteWord(n))}</span>`;
    const item = x => `<li${x.hidden ? ' class="hit"' : ""}><b>${esc(t().inciNames[x.inci] || x.raw)}</b><span dir="ltr" lang="en">${esc(x.raw)}</span></li>`;
    return `<section class="lp-sec lp-list" id="lp-list">${head(3, t().listH, t().listLede)}
      <div class="lp-ex lp-label">${tag("exTag")}
        <div class="lp-label-top"><img src="${esc(X.photo)}" alt="" loading="lazy"><div><b>${esc(pname(X))}</b><span>${esc(X.house)}</span></div></div>
        <div class="lp-label-cols">
          <div><h3>${esc(t().labelBox)}</h3><div class="lp-notes">${STAGES.flatMap(st => X.notes[st]).map(chip).join("")}</div></div>
          <div><h3>${esc(t().labelInci)}</h3><ol class="lp-inci">${X.label.map(item).join("")}</ol></div>
        </div>
        <p>${esc(t().labelText(pname(X), F.checked, F.iso_top, F.iso_listed))}</p>
      </div>
      <div class="lp-ex">${tag("exTag")}<p>${esc(t().jasmine)}</p>${bar(.1, color(wf.group), "#5A4A3C", t().jasmineKey)}</div>
      <p class="lp-lead">${esc(t().listFamsLead)}</p>
      ${strips(t().listFams)}
      ${evidence(t().listSrc)}
    </section>`;
  }
  /* step 4: 100 people and one smell; the same dots stay hollow from smell to smell, in an order fixed once */
  const PEOPLE = (() => { let a = 7; return shuffle(Array.from({ length: 100 }, (_, i) => i), () => (a = (a * 16807) % 2147483647) / 2147483647); })();
  const RANK = Object.fromEntries(PEOPLE.map((d, k) => [d, k]));
  function noseHtml() {
    const cases = t().noseCases, c = cases.find(x => x.id === noseId) || cases[cases.length - 1], cannot = 100 - c.can;
    const about = c.about ? t().noseAbout + " " : "";
    return `<section class="lp-sec lp-nose" id="lp-nose">${head(4, t().noseH, t().noseLede)}
      <div class="lp-pills" role="group">${cases.map(x => `<button type="button" aria-pressed="${x.id === c.id}" data-nose="${x.id}" style="--c:${color(x.g)}"><i></i>${esc(x.name)}</button>`).join("")}</div>
      <div class="lp-nose-body">
        <div class="lp-people" role="img" aria-label="${esc(about + t().noseCan(c.can) + ", " + about + t().noseCannot(cannot))}" style="--c:${color(c.g)}">${Array.from({ length: 100 }, (_, d) => `<i class="${RANK[d] < cannot ? "off" : "on"}" style="--k:${RANK[d]}"></i>`).join("")}</div>
        <div class="lp-nose-text">
          <p class="lp-legend"><span class="on" style="--c:${color(c.g)}">${esc(about + t().noseCan(c.can))}</span>${cannot ? `<span class="off">${esc(about + t().noseCannot(cannot))}</span>` : ""}</p>
          <p class="lp-nose-note">${esc(c.note)}</p>
          <p class="lp-nose-critics">${esc(t().noseCritics)}</p>
        </div>
      </div>
      ${evidence(t().noseSrc)}
    </section>`;
  }
  /* a row of perfumes to choose from, one pressed */
  const tabs = (ids, cur, attr) => `<div class="lp-tabs" role="group">${ids.map(id => { const s = byId[id]; return s ? `<button type="button" aria-pressed="${id === cur}" data-${attr}="${id}"><img src="${esc(s.photo)}" alt="" loading="lazy"><span>${esc(pname(s))}</span></button>` : ""; }).join("")}</div>`;
  /* the spoiled note: a result in words, which the stable live region below the sections reads out */
  function spoilText() {
    const s = byId[spoilId] || byId[t().spoilIds[0]];
    const all = STAGES.flatMap(st => s.notes[st].map((n, k) => ({ n, key: st + ":" + k })));
    const pick = all.find(x => x.key === spoilPick);
    if (!pick) return [];
    const F = pick.n.f && LD.families[pick.n.f];
    return [t().spoilResult(noteWord(pick.n), all.length, pname(s))].concat(F ? [t().spoilFamily(fam(pick.n.f), F.count, LD.total)] : []);
  }
  /* step 5: how many perfumes carry a liked family and a spoiling one together, then a perfume to try it on */
  function spoilHtml() {
    const s = byId[spoilId] || byId[t().spoilIds[0]];
    const juice = STAGES.flatMap(st => s.notes[st].map(n => color(n.g)));
    const stops = juice.map((c, i) => `${c} ${Math.round((i / Math.max(1, juice.length - 1)) * 100)}%`).join(", ");
    const lines = spoilText();
    const result = lines.length ? lines.map(l => `<p>${esc(l)}</p>`).join("") + `<p class="lp-result-go"><a class="btn primary" href="${esc(QUIZ_HREF())}">${esc(t().start)}</a></p>` : "";
    const P = LD.facts.pair, n = LD.families[P.like].count;
    return `<section class="lp-sec lp-spoil" id="lp-spoil">${head(5, t().spoilH, t().spoilLede)}
      <div class="lp-ex">${tag("exTag")}<p>${esc(t().pairText(n, P.both))}</p>${bar(P.both / n, color(LD.families[P.like].group), color(LD.families[P.dis].group), t().pairKey(n, P.both))}</div>
      <p class="lp-lead">${esc(t().spoilTry)}</p>
      ${tabs(t().spoilIds, s.id, "spoil")}
      <div class="lp-spoil-body${spoilPick ? " spoiled" : ""}">
        <div class="lp-vial" aria-hidden="true" style="--juice: linear-gradient(180deg, ${stops})"><i class="lp-vial-cap"></i><i class="lp-vial-glass"><i class="lp-vial-juice"></i></i></div>
        <div class="lp-spoil-notes">
          <p class="lp-small">${esc(t().spoilPick)}</p>
          ${STAGES.map(st => `<div class="lp-row"><span class="lp-row-k">${esc(t().rowStage[st])}</span><div class="lp-chips">${s.notes[st].map((n, k) => { const key = st + ":" + k; return `<button type="button" class="lp-chip${key === spoilPick ? " bad" : ""}" data-note="${key}" aria-pressed="${key === spoilPick}" style="--c:${color(n.g)}"><i></i>${esc(noteWord(n))}</button>`; }).join("")}</div></div>`).join("")}
          <div class="lp-result">${result}</div>
        </div>
      </div>
      ${inQuiz(t().spoilQuiz)}
      ${evidence(t().spoilBook)}
    </section>`;
  }
  /* step 6: a scent few dislike beside one a few love */
  function loveHtml() {
    return `<section class="lp-sec lp-love" id="lp-love">${head(6, t().loveH, t().loveLede)}
      <div class="lp-pair">${t().loveCards.map(([h, p], i) => `<div class="lp-paircard${i ? " loved" : ""}"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("")}</div>
      ${inQuiz(t().loveQuiz)}
      ${evidence(t().loveSrc)}
    </section>`;
  }
  /* step 7: the stage a time falls in, the first twenty minutes, then to three hours, then later */
  const stageAt = m => (m < 20 ? "opening" : m < 180 ? "heart" : "drydown");
  const nowHtml = m => `${esc(t().timeNow(m))} · ${esc(t().timeIn)}: <b>${esc(t().timeStage[stageAt(m)])}</b>`;
  function timeHtml() {
    const s = byId[timeId] || byId[t().timeIds[0]], cur = stageAt(timeMin);
    return `<section class="lp-sec lp-time" id="lp-time">${head(7, t().timeH, t().timeLede)}
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
      ${inQuiz(t().timeQuiz)}
      ${evidence(t().timeBook)}
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
    host.innerHTML = heroHtml() + likedHtml() + critHtml() + listHtml() + noseHtml() + spoilHtml() + loveHtml() + timeHtml() + quizHtml() + artsHtml() + footHtml() +
      `<p class="sr" id="lp-spoil-live" aria-live="polite"></p>`;
    mist.canvas = $("lp-mist"); mist.ctx = mist.canvas.getContext ? mist.canvas.getContext("2d") : null; mist.parts = []; mist.size();
    if (sprayIdx >= 0) showSpray(false);
    reveal();
    if (booted) autoSpray();
  }

