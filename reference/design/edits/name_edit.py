"""One-off edit: the quiz result gets a taste name with an emblem, a counted funnel, and a share card that leads
with the name. The engine gains a read-only ruledOut(); recommend() and every existing output are unchanged."""
ROOT = "C:/Users/malha/Desktop/Webapps/perfume-profiler/"

def edit(path, pairs):
    s = open(ROOT + path, encoding="utf-8").read()
    for a, b in pairs:
        assert s.count(a) == 1, (path, s.count(a), a[:70])
        s = s.replace(a, b)
    open(ROOT + path, "w", encoding="utf-8", newline="\n").write(s)

# ---------- engine: the exclusion strength named once, and a count of what a profile rules out ----------
edit("site/js/engine.js", [
 ('''            if (likely.includes(f) && ((s === "drydown" && w >= 0.5) || (s === "heart" && w >= 0.7))) excluded = true;''',
  '''            if (likely.includes(f) && atStrength(s, w)) excluded = true;'''),
 ('''    function recommend(prof, ratings) {''',
  '''    /* the strength at which a deal-breaker family rules a perfume out: 0.5 in the drydown or 0.7 in the heart */
    const atStrength = (s, w) => (s === "drydown" && w >= 0.5) || (s === "heart" && w >= 0.7);

    /* Perfumes a profile rules out: those holding a likely or possible deal-breaker at that strength. Read-only;
       recommend() excludes on likely deal-breakers alone, so this count is the wider, cautious one. */
    function ruledOut(prof) {
      const bad = Object.entries(prof).filter(([, v]) => v.cls === "badLikely" || v.cls === "badPossible").map(([f]) => f);
      return PERFUMES.filter(P => bad.some(f => ["heart", "drydown"].some(s => atStrength(s, P.stages[s][f] || 0)))).map(P => P.id);
    }

    function recommend(prof, ratings) {'''),
 ('''    return { STAGES, PERFUMES, byId, applyEvidence, buildAuto, derived, resolve, strongestStage, computeProfile, recommend, settleSuggestion };''',
  '''    return { STAGES, PERFUMES, byId, applyEvidence, buildAuto, derived, resolve, strongestStage, computeProfile, recommend, settleSuggestion, ruledOut };'''),
])

# ---------- quiz page ----------
ARCH = r'''  /* ---------- the taste name: nine palates cover the 32 families; the strongest liked group names the visitor ---------- */
  const ICON = {
    amber: '<path d="M12 3c3.6 4.6 6 7.9 6 11.2a6 6 0 0 1-12 0C6 10.9 8.4 7.6 12 3z"/><path d="M9.2 14.6a3 3 0 0 0 2.4 2.9" opacity=".7"/>',
    sweet: [0, 72, 144, 216, 288].map(a => `<ellipse cx="12" cy="7.2" rx="2.6" ry="4.4" transform="rotate(${a} 12 12)"/>`).join("") + '<circle cx="12" cy="12" r="1.6"/>',
    oud: '<path d="M8 21c-2.4-3 2.4-5 0-8.5s2.4-5 0-8.5M12 21c-2.4-3 2.4-5 0-8.5s2.4-5 0-8.5M16 21c-2.4-3 2.4-5 0-8.5s2.4-5 0-8.5"/>',
    musk: '<circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="12" r="5.6" opacity=".75"/><circle cx="12" cy="12" r="8.8" opacity=".45"/>',
    woody: '<ellipse cx="12.4" cy="12.2" rx="2" ry="1.7"/><ellipse cx="12" cy="12" rx="5" ry="4.4"/><ellipse cx="11.6" cy="12.3" rx="8.4" ry="7.6"/><path d="M12 12l6.6-4.8"/>',
    rose: '<path d="M12 12.2c.1-1.4 2-1.5 2.1-.1.1 1.8-2.4 2.9-3.9 1.6-1.9-1.6-.8-5 2.2-5.1 3.3-.1 5 3.2 3.6 6-1.6 3.1-6.4 3.6-8.6.5"/><path d="M12 18.6v3M12 20.4c-2.4-.2-3.6-1.6-3.8-3 2 0 3.4.9 3.8 3zM12 20.4c2.4-.2 3.6-1.6 3.8-3-2 0-3.4.9-3.8 3z"/>',
    floral: [0, 72, 144, 216, 288].map(a => `<circle cx="12" cy="6.6" r="3.1" transform="rotate(${a} 12 12)"/>`).join("") + '<circle cx="12" cy="12" r="1.9"/>',
    fresh: '<circle cx="12" cy="12" r="8.8"/><circle cx="12" cy="12" r="6.8" opacity=".7"/>' + [0, 60, 120].map(a => `<path d="M12 5.2v13.6" transform="rotate(${a} 12 12)"/>`).join(""),
    spiced: [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<ellipse cx="12" cy="6.4" rx="1.5" ry="3.4" transform="rotate(${a} 12 12)"/>`).join("") + '<circle cx="12" cy="12" r="1.2"/>',
    selective: '<path d="M12 3.5l7.5 7-7.5 10.5-7.5-10.5z"/><path d="M4.5 10.5h15M9 10.5l3 10.5 3-10.5M9 10.5l3-7 3 7" opacity=".75"/>'
  };
  const ARCH = [
    { id: "amber", fams: ["amber_resin", "tonka_coumarin", "tobacco_honey"], color: "#B96A16", en: "The Amber Palate", ar: "ذائقة عنبرية" },
    { id: "sweet", fams: ["vanilla_gourmand", "coffee_gourmand", "fruity_sweet"], color: "#A87B3F", en: "The Sweet Palate", ar: "ذائقة حلوة" },
    { id: "oud", fams: ["oud_smoky", "oud_animalic", "incense_resin", "leather_smoky", "animalic"], color: "#5B3A24", en: "The Oud Palate", ar: "ذائقة عودية" },
    { id: "musk", fams: ["white_musk", "skin_musk", "aldehydes"], color: "#7F7899", en: "The Musk Palate", ar: "ذائقة مسكية" },
    { id: "woody", fams: ["woody_amber", "sandalwood_creamy", "cedar_dry", "vetiver", "patchouli", "oakmoss_chypre"], color: "#735236", en: "The Woody Palate", ar: "ذائقة خشبية" },
    { id: "rose", fams: ["rose", "damascone_fruit"], color: "#B8467A", en: "The Rose Palate", ar: "ذائقة وردية" },
    { id: "floral", fams: ["white_floral", "iris_powdery", "muguet_floral"], color: "#98688F", en: "The Floral Palate", ar: "ذائقة زهرية" },
    { id: "fresh", fams: ["citrus_fresh", "aquatic_marine", "green_herbal", "lavender_aromatic", "spice_fresh"], color: "#3F7F6C", en: "The Fresh Palate", ar: "ذائقة منعشة" },
    { id: "spiced", fams: ["spicy_warm", "saffron_leathery"], color: "#A5412A", en: "The Spiced Palate", ar: "ذائقة متبّلة" }
  ];
  const SELECTIVE = { id: "selective", fams: [], color: "#6B4E3D", en: "The Selective Palate", ar: "ذائقة انتقائية" };
  /* the group whose liked families score highest; with dislikes only, the selective palate; with neither, none */
  function archetypeOf(prof) {
    let best = null, bestScore = 0;
    for (const a of ARCH) {
      const sc = a.fams.reduce((s, f) => s + (prof[f] && (prof[f].cls === "goodLikely" || prof[f].cls === "goodPossible") ? prof[f].score : 0), 0);
      if (sc > bestScore) { best = a; bestScore = sc; }
    }
    if (best) return best;
    return Object.values(prof).some(v => v.cls === "badLikely" || v.cls === "badPossible") ? SELECTIVE : null;
  }
  const emblemSvg = (a, size) => `<svg class="qemblem" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="qe-${a.id}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="${a.color}" stop-opacity="1"/><stop offset="1" stop-color="${a.color}"/></radialGradient><linearGradient id="qr-${a.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8862A"/><stop offset=".35" stop-color="#F2D68A"/><stop offset=".55" stop-color="#C99C43"/><stop offset=".75" stop-color="#FBECB8"/><stop offset="1" stop-color="#A8781F"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#qr-${a.id})"/><circle cx="32" cy="32" r="26.5" fill="url(#qe-${a.id})"/><g transform="translate(14 14) scale(1.5)" fill="none" stroke="#FCF8F0" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICON[a.id]}</g></svg>`;
  /* the funnel: every catalogue perfume checked, the ones a deal-breaker rules out, the three chosen */
  function funnelHtml(prof, nPicks) {
    const total = E.PERFUMES.length, out = E.ruledOut(prof).length;
    const cell = (n, label, cls) => `<div class="qfun ${cls || ""}"><b data-count="${n}">${n}</b><span>${esc(label)}</span></div>`;
    return `<div class="qfunnel">${cell(total, t().funnel.checked)}${cell(out, t().funnel.out, "out")}${nPicks ? cell(nPicks, t().funnel.picked, "pick") : ""}</div>`;
  }
  /* numbers count up once the result is on screen; a visitor who prefers less motion sees them at once */
  function countUp(root) {
    let still = false; try { still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { still = true; }
    if (still || typeof requestAnimationFrame !== "function") return;
    for (const el of root.querySelectorAll ? root.querySelectorAll("[data-count]") : []) {
      const end = +el.dataset.count, t0 = performance.now(), dur = 900 + Math.min(end, 300);
      const tick = now => { const k = Math.min(1, (now - t0) / dur), e2 = 1 - Math.pow(1 - k, 3); el.textContent = String(Math.round(end * e2)); if (k < 1) requestAnimationFrame(tick); };
      el.textContent = "0"; requestAnimationFrame(tick);
    }
  }

'''

EN = ('      palate: "Your palate", funnel: { checked: "perfumes checked", out: "ruled out for you", picked: "chosen for you" },\n'
      '      cardPalate: "My palate",\n')
AR = ('      palate: "ذائقتك", funnel: { checked: "عطراً فحصناها", out: "استبعدناها لك", picked: "اخترناها لك" },\n'
      '      cardPalate: "ذائقتي",\n')

edit("site/js/quiz.js", [
 ('      share: "Share my profile",', EN + '      share: "Share my profile",'),
 ('      share: "شارك ذائقتك",', AR + '      share: "شارك ذائقتك",'),
 ("  /* ---------- the share card: a 1080 x 1350 image", ARCH + "  /* ---------- the share card: a 1080 x 1350 image"),
 # the hero: emblem, eyebrow, the name, the funnel; picks computed once so the funnel can count them
 ('''    return topHtml() + `<div class="qresult"><div class="hero"><h1>${esc(t().resultH)}</h1></div>
      ${tasteCardHtml(prof, ids)}${recs}''',
  '''    const arch = archetypeOf(prof), nPicks = gate ? recommend(prof).picks.length : 0;
    const hero = arch
      ? `<div class="qname-hero" style="--arch:${arch.color}">${emblemSvg(arch, 96)}<div><p class="eyebrow">${esc(t().palate)}</p><h1>${esc(arch[lang])}</h1></div></div>`
      : `<div class="hero"><h1>${esc(t().resultH)}</h1></div>`;
    return topHtml() + `<div class="qresult">${hero}${funnelHtml(prof, nPicks)}
      ${tasteCardHtml(prof, ids)}${recs}'''),
 # count up after the result is drawn
 ('''    host.innerHTML = (screens[step] || resultHtml)();
  }''',
  '''    host.innerHTML = (screens[step] || resultHtml)();
    if (!screens[step]) countUp(host);
  }'''),
 # the share card leads with the name and its emblem
 ('''    /* the title */
    text(t().card.title, M, 262, `600 76px ${disp}`, "#2A1B11");
    x.fillStyle = gold; x.fillRect(rtl ? W - M - 120 : M, 290, 120, 6);
    const prof = computeProfile();''',
  '''    /* the name: the emblem, "My palate", then the palate's name; without one, the plain title */
    const prof = computeProfile(), arch = archetypeOf(prof);
    if (arch) {
      const em = await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(emblemSvg(arch, 150).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')));
      if (em) x.drawImage(em, rtl ? W - M - 150 : M, 168, 150, 150);
      const tx = M + 150 + 34;
      text(t().cardPalate, tx, 222, `600 32px ${body}`, "#8C5F00");
      text(arch[lang], tx, 292, `600 ${rtl ? 70 : 64}px ${disp}`, "#2A1B11");
    } else {
      text(t().card.title, M, 262, `600 76px ${disp}`, "#2A1B11");
    }
    x.fillStyle = gold; x.fillRect(rtl ? W - M - 120 : M, 336, 120, 6);
    const ruled = E.ruledOut(prof).length;'''),
 ('''    let y = 372;''', '''    let y = 420;'''),
 # the card's funnel line, under the picks
 ('''      y += 380;
    }''',
  '''      y += 380;
    }
    x.font = `600 30px ${body}`; x.fillStyle = "#614E3F"; x.textAlign = "center";
    x.fillText(`${E.PERFUMES.length} ${t().funnel.checked} · ${ruled} ${t().funnel.out}`, W / 2, Math.min(y + 70, H - 140));'''),
])
print("ok")
