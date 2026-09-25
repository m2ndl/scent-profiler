/* The page: language, rendering, storage on this device, backend calls and event handlers.
   Profile logic lives in engine.js, deployment settings in config.js. */
(function () {
  "use strict";
  const D = window.PP_DATA, M = window.PP_MAP, MAT = window.PP_MATERIALS;
  if (!D || !M || !MAT || !window.PP_ENGINE || !window.PP_CONFIG) { document.getElementById("h1").textContent = "A script in js/ did not load (config, data, mapper, materials or engine). Serve the site folder as it is."; return; }
  const { FAMILIES, CHIPS } = D;
  const E = window.PP_ENGINE.create(D, M, window.PP_EVIDENCE);
  const { STAGES, PERFUMES, byId } = E;
  const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect x="20" y="6" width="16" height="8" rx="2" fill="#9a9f9b"/><rect x="14" y="16" width="28" height="34" rx="5" fill="#c9cdc7"/><rect x="19" y="22" width="18" height="22" rx="3" fill="#e6e8e3"/></svg>');

  /* Deployment settings: config.js. */
  const CONFIG = window.PP_CONFIG;
  /* Local testing only: http://localhost:8765/?endpoint=http://localhost:8765/api (see tools/mock_backend.py). */
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { try { const e = new URLSearchParams(location.search).get("endpoint"); if (e) CONFIG.endpoint = e; } catch (err) { /* ignore */ } }

  /* ---------- i18n ---------- */
  const T = {
    en: {
      brand: "Drydown Profiler", tagline: "find what you hate before you buy", navArticles: "Why drydowns fail",
      h1: "Find what ruins a perfume for you.",
      lede: "Rate perfumes you have worn, stage by stage. The opening you loved and the base that turned on you are different facts, and only the second one predicts a wasted bottle.",
      ask: "Which perfume disappointed you?", qLabel: "Search a perfume or house", q: "Type a perfume or a house, in English or Arabic",
      hint: "Start with one you regret, then add ones you loved. Three give a first reading; six give a reliable one.",
      quick: "Common ones:",
      stages: { opening: ["Opening", "15 min"], heart: ["Heart", "2 h"], drydown: ["Drydown", "6 h and later"] },
      scale: ["Hate", "Dislike", "OK", "Like", "Love"],
      bothered: "What bothered you?",
      again: "Would you buy it again?", yes: "Yes", no: "No",
      remove: "Remove",
      emptyRate: "Nothing rated yet. One perfume you regret buying teaches the profiler more than three you loved.",
      profileH: "Your deal-breakers", profileLede: "Material families, not marketing notes. Each verdict lists the ratings it rests on, so you can see how much weight it deserves.",
      emptyProfile: "Rate at least one perfume to see a profile.",
      cls: { badLikely: "Likely deal-breaker", badPossible: "Possible deal-breaker", goodLikely: "Reliably liked", goodPossible: "Probably liked", mixed: "Depends on the perfume" },
      seenIn: "seen in", once: "one perfume so far", n: n => `${n} perfumes`,
      evidenceLine: (perfume, stage, val) => `${perfume}, ${stage.toLowerCase()}: ${val}`,
      chipLine: (perfume, stage, chip) => `${perfume}, ${stage.toLowerCase()}: you said "${chip}"`,
      avoid: "Also has this in the base:", flag: "This tag looks wrong", flagged: "Noted, thank you",
      settleH: "One sample would settle it",
      settle: (target, fam, others) => `Try ${target}. Its base is ${fam} without ${others}. If that drydown bothers you too, ${fam} is the culprit; if not, look at the others.`,
      recsH: "Three to try next", recsLede: "Ranked by what they avoid first, and what they share with your likes second. Samples, never blind bottles.",
      emptyRecs: "Recommendations appear once you have rated at least two perfumes.",
      whyClear: fams => `Clear of ${fams} in the base.`,
      whyShares: (fam, perfume) => `Shares ${fam} with ${perfume}, which you liked.`,
      riskUnknown: (fam, stage) => `Contains ${fam} in the ${stage.toLowerCase()}, which you have not rated yet.`,
      riskMixed: (fam, stage) => `Contains ${fam} in the ${stage.toLowerCase()}, and your ratings of it are mixed.`,
      riskNeg: (fam, stage) => `Contains a little ${fam} in the ${stage.toLowerCase()}, which you have disliked before.`,
      sampleSA: "Sample (Saudi shops)", sampleUS: "Sample (US)", bottle: "Full bottle",
      share: "Copy my profile", reset: "Start over", copied: "Copied to clipboard", copyFail: "Select and copy the text below",
      resetConfirm: "Delete all ratings on this device?", resetYes: "Yes, delete", resetNo: "Keep them",
      saved: "Saved on this device", sent: "Saved and shared anonymously",
      community: (n, d) => `Community: ${n} ratings, drydown average ${d}`,
      addCustom: q => `Add "${q}" (not in the list yet)`,
      untagged: "Not in the catalogue yet. Your rating is saved and will count once this perfume is tagged.",
      lookingUp: "Looking it up…", notFound: "Not found in the reference database; saved as untagged.",
      autoBadge: "Auto-tagged from its note list", autoNote: "Tags were inferred from the published notes, not checked by a person. They count at half weight and never drive recommendations.",
      autoFams: "Inferred:", tagsWrong: "These tags look wrong", verifiedOnly: "Recommendations come only from the hand-checked catalogue.",
      cloneOf: "Often compared to",
      srcCurated: "from its note list", srcLabel: "declared on the ingredient list", srcLabelAbsent: "ruled out by the ingredient list", srcBook: "quoted from a published source", srcNotes: "from vendor notes, unchecked",
      sourcesLine: "Evidence:", srcNone: "note list only", srcLabelNew: "ingredient list (2026 format)", srcLabelOld: "ingredient list (allergens only)", srcBookShort: "published source",
      neverOnLabel: "No ingredient list can show this family; this verdict rests on note lists and published sources.",
      labelH: "Have the box? Paste its ingredient list", labelHint: "Copy the INGREDIENTS line from the box or the retailer page. Materials on the EU list are recognised; the rest is ignored. Nothing else about you is sent.",
      labelBtn: "Read the label", labelMarket: { SA: "Saudi box or site", EU: "EU box or site", US: "US box or site", OTHER: "Other" },
      labelResult: (n, fmt) => `${n} materials recognised, ${fmt}.`, labelNew: "new-format list (2026 rules)", labelOld: "old-format list (allergens only)", labelUnknown: "no recognised materials",
      labelFound: "Declared:", labelAbsent: "Ruled out:", labelThanks: "Saved. This label now counts as evidence for this perfume.",
      panelH: "Your profile so far", pRated: "rated", pBad: "deal-breakers", pGood: "liked", pGo: "See the full profile", pQuiet: "Rate one perfume to start.",
      bottom: (n, m) => `${n} rated · ${m} deal-breakers`, bottomGo: "Profile",
      methodS: "How this works, and what it cannot do",
      method: `<p>Perfume "notes" are marketing descriptions, not ingredients. Two perfumes listing "amber" can smell nothing alike. This tool tags each perfume, at each stage, with the <b>material families</b> people actually react to: woody ambers, white musks, oakmoss, oud accords and so on. The tags are hand-made and sometimes wrong; use the "looks wrong" link.</p>
<p>Your drydown ratings count more than your opening ratings, because the drydown is what you live with for six hours and what makes a bottle unwearable. A family is a <b>likely deal-breaker</b> only when two or more perfumes point the same way. One perfume gives a <b>possible</b> deal-breaker and a suggestion for the single sample that would settle it.</p>
<p>What it cannot do: name the exact molecule, account for your skin, or be right about someone with specific anosmia to musks (roughly one person in twelve). Treat every verdict as a hypothesis to test with a 2 ml sample, never a reason to buy blind.</p>`,
      foot: `<p>Sample and bottle links may earn a commission; ranking never depends on it. Ratings are stored on this device. If sharing is switched on, they are sent anonymously with a random device id and nothing else.</p>`,
      cats: { m: "men", f: "women", u: "unisex" }
    },
    ar: {
      brand: "محلل القاعدة", tagline: "اعرف ما تكرهه قبل أن تشتري", navArticles: "لماذا تفسد القاعدة",
      h1: "اعرف ما يفسد العطر عليك.",
      lede: "قيّم عطوراً لبستها فعلاً، مرحلة بمرحلة. الافتتاحية التي أحببتها والقاعدة التي انقلبت عليك حقيقتان مختلفتان، والثانية وحدها هي التي تتنبأ بزجاجة ضائعة.",
      ask: "أي عطر خذلك؟", qLabel: "ابحث عن عطر أو دار", q: "اكتب اسم عطر أو دار، بالعربية أو الإنجليزية",
      hint: "ابدأ بعطر ندمت عليه، ثم أضف ما أحببته. ثلاثة تعطي قراءة أولى، وستة قراءة موثوقة.",
      quick: "الأكثر شيوعاً:",
      stages: { opening: ["الافتتاحية", "١٥ دقيقة"], heart: ["القلب", "ساعتان"], drydown: ["القاعدة", "٦ ساعات فأكثر"] },
      scale: ["أكرهه", "لا يعجبني", "عادي", "يعجبني", "أعشقه"],
      bothered: "ما الذي أزعجك؟",
      again: "هل تشتريه مرة أخرى؟", yes: "نعم", no: "لا",
      remove: "إزالة",
      emptyRate: "لم تقيّم شيئاً بعد. عطر واحد ندمت على شرائه يعلّم المحلل أكثر من ثلاثة أحببتها.",
      profileH: "ما يفسد العطر عليك", profileLede: "عائلات المواد، لا النوتات التسويقية. كل حكم يعرض التقييمات التي بُني عليها، لتعرف كم يستحق من الثقة.",
      emptyProfile: "قيّم عطراً واحداً على الأقل لترى ملفك.",
      cls: { badLikely: "مُفسد مرجّح", badPossible: "مُفسد محتمل", goodLikely: "تحبه باستمرار", goodPossible: "تحبه على الأرجح", mixed: "يعتمد على العطر" },
      seenIn: "ظهر في", once: "عطر واحد حتى الآن", n: n => (n === 2 ? "عطرين" : n <= 10 ? `${n} عطور` : `${n} عطراً`),
      evidenceLine: (perfume, stage, val) => `${perfume}، ${stage}: ${val}`,
      chipLine: (perfume, stage, chip) => `${perfume}، ${stage}: قلت «${chip}»`,
      avoid: "موجود أيضاً في قاعدة:", flag: "هذا الوسم يبدو خاطئاً", flagged: "سُجّل، شكراً",
      settleH: "عينة واحدة تحسم الأمر",
      settle: (target, fam, others) => `جرّب ${target}. قاعدته ${fam} من دون ${others}. إن أزعجتك قاعدته أيضاً فالسبب ${fam}؛ وإن لم تزعجك فانظر إلى البقية.`,
      recsH: "ثلاثة لتجربتها", recsLede: "مرتّبة بحسب ما تتجنبه أولاً، وما تشترك فيه مع ما أحببته ثانياً. عينات، لا زجاجات على العمياني.",
      emptyRecs: "تظهر الترشيحات بعد تقييم عطرين على الأقل.",
      whyClear: fams => `قاعدته خالية من ${fams}.`,
      whyShares: (fam, perfume) => `يشترك في ${fam} مع ${perfume} الذي أعجبك.`,
      riskUnknown: (fam, stage) => `يحتوي على ${fam} في ${stage}، ولم تقيّمه بعد.`,
      riskMixed: (fam, stage) => `يحتوي على ${fam} في ${stage}، وتقييماتك له متباينة.`,
      riskNeg: (fam, stage) => `فيه قليل من ${fam} في ${stage}، وقد أزعجك من قبل.`,
      sampleSA: "عينة (متاجر سعودية)", sampleUS: "عينة (أمريكا)", bottle: "زجاجة كاملة",
      share: "انسخ ملفي", reset: "ابدأ من جديد", copied: "نُسخ", copyFail: "حدّد النص وانسخه",
      resetConfirm: "حذف كل التقييمات على هذا الجهاز؟", resetYes: "نعم، احذف", resetNo: "أبقها",
      saved: "محفوظ على هذا الجهاز", sent: "محفوظ ومشارَك بلا اسم",
      community: (n, d) => `المجتمع: ${n} تقييم، متوسط القاعدة ${d}`,
      addCustom: q => `أضف «${q}» (ليس في القائمة بعد)`,
      untagged: "ليس في القائمة بعد. تقييمك محفوظ وسيُحتسب بعد وسم هذا العطر.",
      lookingUp: "جارٍ البحث عنه…", notFound: "لم يوجد في قاعدة البيانات المرجعية؛ حُفظ من دون وسوم.",
      autoBadge: "وُسم آلياً من قائمة نوتاته", autoNote: "استُنتجت الوسوم من النوتات المنشورة ولم يراجعها أحد. تُحتسب بنصف الوزن ولا تؤثر في الترشيحات.",
      autoFams: "المستنتج:", tagsWrong: "هذه الوسوم تبدو خاطئة", verifiedOnly: "الترشيحات تأتي فقط من القائمة المراجَعة يدوياً.",
      cloneOf: "يُقارن غالباً بـ",
      srcCurated: "من قائمة نوتاته", srcLabel: "مذكور في قائمة المكونات", srcLabelAbsent: "استُبعد بقائمة المكونات", srcBook: "مقتبس من مصدر منشور", srcNotes: "من نوتات المورّد، غير مراجَع",
      sourcesLine: "الأدلة:", srcNone: "قائمة النوتات فقط", srcLabelNew: "قائمة مكونات (صيغة 2026)", srcLabelOld: "قائمة مكونات (مسببات الحساسية فقط)", srcBookShort: "مصدر منشور",
      neverOnLabel: "لا تُظهر قوائم المكونات هذه العائلة؛ هذا الحكم مبني على قوائم النوتات والمصادر المنشورة.",
      labelH: "العلبة معك؟ الصق قائمة مكوناتها", labelHint: "انسخ سطر INGREDIENTS من العلبة أو من صفحة المتجر. المواد المدرجة في القائمة الأوروبية تُقرأ، والباقي يُتجاهل. لا يُرسل عنك شيء آخر.",
      labelBtn: "اقرأ الملصق", labelMarket: { SA: "علبة أو متجر سعودي", EU: "علبة أو متجر أوروبي", US: "علبة أو متجر أمريكي", OTHER: "غير ذلك" },
      labelResult: (n, fmt) => `تم التعرف على ${n} مادة، ${fmt}.`, labelNew: "قائمة بالصيغة الجديدة (قواعد 2026)", labelOld: "قائمة بالصيغة القديمة (مسببات الحساسية فقط)", labelUnknown: "لا مواد معروفة",
      labelFound: "المذكور:", labelAbsent: "المستبعد:", labelThanks: "حُفظ. هذا الملصق يُحتسب الآن دليلاً لهذا العطر.",
      panelH: "ملفك حتى الآن", pRated: "قيّمت", pBad: "مفسدات", pGood: "تحبها", pGo: "الملف الكامل", pQuiet: "قيّم عطراً واحداً للبدء.",
      bottom: (n, m) => `${n} مقيَّم · ${m} مفسد`, bottomGo: "الملف",
      methodS: "كيف يعمل هذا، وما لا يستطيعه",
      method: `<p>«النوتات» أوصاف تسويقية لا مكونات. عطران يذكران «العنبر» قد لا يتشابهان في شيء. تضع هذه الأداة على كل عطر، في كل مرحلة، وسوماً <b>لعائلات المواد</b> التي يتفاعل معها الناس فعلاً: الأخشاب العنبرية الصناعية، المسك الأبيض، الطحلب، تراكيب العود، وغيرها. الوسوم يدوية وقد تخطئ؛ استخدم رابط «يبدو خاطئاً».</p>
<p>تقييمك للقاعدة يزن أكثر من تقييمك للافتتاحية، لأن القاعدة هي ما تعيش معه ست ساعات وما يجعل الزجاجة غير قابلة للبس. تصبح العائلة <b>مُفسداً مرجّحاً</b> فقط عندما يشير عطران أو أكثر إلى الاتجاه نفسه. عطر واحد يعطي مُفسداً <b>محتملاً</b> واقتراحاً بالعينة الواحدة التي تحسم الأمر.</p>
<p>ما لا تستطيعه: تسمية الجزيء بعينه، أو مراعاة بشرتك، أو الصواب مع من لديه فقدان شم خاص بالمسك (نحو واحد من كل اثني عشر شخصاً). تعامل مع كل حكم بوصفه فرضية تختبرها بعينة ٢ مل، لا سبباً للشراء على العمياني.</p>`,
      foot: `<p>روابط العينات والزجاجات قد تكسب عمولة، والترتيب لا يعتمد عليها أبداً. التقييمات محفوظة على هذا الجهاز. إن كانت المشاركة مفعّلة تُرسل بلا اسم مع معرّف جهاز عشوائي ولا شيء غيره.</p>`,
      cats: { m: "رجالي", f: "نسائي", u: "للجنسين" }
    }
  };

  /* ---------- state ---------- */
  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  let lang = store.get("pp_lang", (navigator.language || "").startsWith("ar") ? "ar" : "en");
  let ratings = store.get("pp_ratings_v1", {});
  let flags = store.get("pp_flags_v1", {});
  let device = store.get("pp_device", null);
  if (!device) { device = "d_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set("pp_device", device); }
  let community = null;
  let pendingReset = false;
  let AUTO = {};        /* id -> catalogue entry from the backend (lazy catalogue) */
  let images = {};      /* verified id -> image url, from the backend's catalogue */

  const t = () => T[lang];
  const fam = k => (FAMILIES[k] ? FAMILIES[k][lang] : k);
  const famHint = k => (FAMILIES[k] ? FAMILIES[k]["hint_" + lang] : "");
  const pname = p => (lang === "ar" && p.ar ? p.ar : p.name);
  const stageName = s => t().stages[s][0];
  const scaleWord = v => t().scale[v + 2];
  const chipWord = id => { const c = CHIPS.find(x => x.id === id); return c ? c[lang] : id; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const listJoin = arr => lang === "ar" ? arr.join("، ") : arr.length > 1 ? arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1] : arr[0] || "";
  const fmt1 = n => (Math.round(n * 10) / 10).toFixed(1).replace("-", "−");

  /* The engine keeps no state: each call gets the page's current ratings, lazy catalogue and images. */
  const state = () => ({ ratings, auto: AUTO, images });
  const resolve = id => E.resolve(id, state());
  const derived = entry => E.derived(entry);
  const srcWord = p => ({ curated: t().srcCurated, label: t().srcLabel, "label-absent": t().srcLabelAbsent, book: t().srcBook, notes: t().srcNotes })[p] || "";
  const imgTag = (P, cls) => `<img class="thumb ${cls || ""}" src="${P && P.image ? esc(P.image) : PLACEHOLDER}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">`;
  const uniqFams = stages => [...new Set(STAGES.flatMap(s => Object.keys((stages && stages[s]) || {})))];
  /* Wearer pastes an ingredient list: parse it here, keep it on this device, send the text for the evidence queue. */
  function readLabel(id) {
    const ta = document.getElementById("lbl-" + id), sel = document.getElementById("lblm-" + id);
    if (!ta || !ratings[id]) return;
    const text = ta.value.trim(); if (text.length < 20) return;
    const parsed = MAT.parse(text);
    ratings[id].label = { text, market: sel ? sel.value : "OTHER", date: new Date().toISOString().slice(0, 10), parsed: { format: parsed.format, stages: parsed.stages, absent: parsed.absent, presence: parsed.presence, materialsDeclared: parsed.materialsDeclared } };
    store.set("pp_ratings_v1", ratings);
    const P = resolve(id);
    if (CONFIG.endpoint) sendRecord({ type: "label", device, lang, perfume: id, name: P ? P.name : id, market: ratings[id].label.market, date: ratings[id].label.date, format: parsed.format, text });
    toast(t().labelThanks); renderAll();
  }

  /* ---------- profile engine (engine.js) ---------- */
  const computeProfile = () => E.computeProfile(state());
  const recommend = prof => E.recommend(prof, ratings);
  const settleSuggestion = prof => E.settleSuggestion(prof, ratings);

  /* ---------- persistence and sharing ---------- */
  let sendTimer = null;
  function persist(id) {
    store.set("pp_ratings_v1", ratings);
    if (!CONFIG.endpoint) { toast(t().saved); return; }
    clearTimeout(sendTimer);
    sendTimer = setTimeout(() => { const P = resolve(id); const { auto, label, ...rest } = ratings[id]; sendRecord({ type: "rating", device, lang, perfume: id, name: P ? P.name : id, ...rest }); }, 1200);
    toast(t().sent);
  }
  function sendRecord(rec) {
    try {
      fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...rec, ts: new Date().toISOString() }) }).catch(() => {});
    } catch (e) { /* offline or blocked */ }
  }
  /* One anonymous event per session once a profile exists, so completions can be counted without analytics. */
  function trackProfile(n) {
    if (!CONFIG.endpoint || n < 2) return;
    let seen = false; try { seen = sessionStorage.getItem("pp_evt") === "1"; } catch (e) { /* ignore */ }
    if (seen) return;
    try { sessionStorage.setItem("pp_evt", "1"); } catch (e) { /* ignore */ }
    sendRecord({ type: "event", name: "profile_viewed", n, device, lang });
  }
  function loadCommunity() {
    if (!CONFIG.endpoint) return;
    try {
      fetch(CONFIG.endpoint + (CONFIG.endpoint.includes("?") ? "&" : "?") + "stats=1").then(r => r.json()).then(j => { community = j && j.perfumes ? j.perfumes : null; renderRated(); }).catch(() => {});
    } catch (e) { /* ignore */ }
  }
  function loadCatalogue() {
    if (!CONFIG.endpoint) return;
    try {
      fetch(CONFIG.endpoint + (CONFIG.endpoint.includes("?") ? "&" : "?") + "catalogue=1").then(r => r.json()).then(j => {
        for (const e of (j && j.entries) || []) { if (!e || !e.id) continue; if (byId[e.id]) { if (e.image) images[e.id] = e.image; } else AUTO[e.id] = e; }
        renderAll();
      }).catch(() => {});
    } catch (e) { /* ignore */ }
  }

  /* ---------- rendering ---------- */
  const $ = id => document.getElementById(id);
  function toast(msg) { const el = $("toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 1600); }

  function renderChrome() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    $("lang-en").setAttribute("aria-pressed", lang === "en"); $("lang-ar").setAttribute("aria-pressed", lang === "ar");
    $("brand").innerHTML = esc(t().brand) + "<small>" + esc(t().tagline) + "</small>";
    $("nav-articles").textContent = t().navArticles;
    $("h1").textContent = t().h1; $("lede").textContent = t().lede;
    $("ask").textContent = t().ask; $("q-label").textContent = t().qLabel; $("q").placeholder = t().q; $("hint").textContent = t().hint;
    $("profile-h").textContent = t().profileH; $("profile-lede").textContent = t().profileLede;
    $("recs-h").textContent = t().recsH; $("recs-lede").textContent = t().recsLede;
    $("share").textContent = t().share; $("reset").textContent = pendingReset ? t().resetYes : t().reset;
    $("method-s").textContent = t().methodS; $("method").innerHTML = t().method; $("foot").innerHTML = t().foot;
    const quickIds = ["sauvageedp", "bleuedp", "aventus", "hacivat", "br540", "khamrah", "yara", "erbapura", "libre", "cdnim"];
    $("quick").innerHTML = "<span class='eyebrow'>" + esc(t().quick) + "</span>" + quickIds.filter(id => !ratings[id]).map(id => `<button type="button" data-add="${id}">${esc(pname(byId[id]))}</button>`).join("");
  }

  function renderRated() {
    const ids = Object.keys(ratings);
    const host = $("rated");
    if (!ids.length) { host.innerHTML = `<div class="empty">${esc(t().emptyRate)}</div>`; return; }
    host.innerHTML = ids.map(id => {
      const r = ratings[id];
      const P = resolve(id);
      if (!P) return "";
      if (P.custom) P.notes = { en: t().untagged, ar: t().untagged };
      let autoHtml = "";
      if (P.cloneOf && byId[P.cloneOf]) autoHtml += `<div class="auto-fams">${esc(t().cloneOf)} <b>${esc(pname(byId[P.cloneOf]))}</b> (${esc(byId[P.cloneOf].house)})</div>`;
      if (P.auto) {
        const famLine = STAGES.map(s => { const fs = Object.entries(P.stages[s] || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f]) => fam(f)); return fs.length ? `<b>${esc(stageName(s))}:</b> ${esc(fs.join(", "))}` : ""; }).filter(Boolean).join(" · ");
        autoHtml += `<div class="auto-badge">${esc(t().autoBadge)}</div><div class="auto-fams">${esc(t().autoFams)} ${famLine || "–"}</div><div class="notes">${esc(t().autoNote)}</div><button type="button" class="flag" data-flagperf="${id}" ${flags[id] ? "disabled" : ""}>${esc(flags[id] ? t().flagged : t().tagsWrong)}</button>`;
      }
      const stagesHtml = STAGES.map(s => {
        const seg = [-2, -1, 0, 1, 2].map(v => `<button type="button" data-rate="${id}" data-stage="${s}" data-v="${v}" aria-pressed="${r[s] === v}">${esc(scaleWord(v))}</button>`).join("");
        const chips = (r[s] != null && r[s] <= 0) ? `<div class="chips"><span class="eyebrow">${esc(t().bothered)}</span>` + CHIPS.map(c => `<button type="button" data-chip="${c.id}" data-rate="${id}" data-stage="${s}" aria-pressed="${!!(r.chips && r.chips[s] && r.chips[s].includes(c.id))}">${esc(c[lang])}</button>`).join("") + "</div>" : "";
        return `<div class="stage ${r[s] != null ? "set" : ""}"><div class="stage-label"><b>${esc(stageName(s))}</b><span>${esc(t().stages[s][1])}</span></div><div class="seg" role="group" aria-label="${esc(stageName(s))}">${seg}</div>${chips}</div>`;
      }).join("");
      const c = community && community[id];
      const commLine = c && c.n ? `<div class="community">${esc(t().community(c.n, fmt1(c.d)))}</div>` : "";
      /* evidence line and the label form (not for untagged names) */
      let evLine = "", labelForm = "";
      if (!P.custom) {
        const srcs = [];
        if (P.evidence && P.evidence.label) srcs.push(P.evidence.label.format === "new" ? t().srcLabelNew : t().srcLabelOld);
        if (P.evidence && P.evidence.book) srcs.push(t().srcBookShort);
        evLine = `<div class="community">${esc(t().sourcesLine)} ${esc(srcs.length ? srcs.join(" · ") : t().srcNone)}</div>`;
        const L = r.label || {};
        const result = L.parsed ? `<div class="auto-fams">${esc(t().labelResult(L.parsed.materialsDeclared, L.parsed.format === "new" ? t().labelNew : L.parsed.format === "old" ? t().labelOld : t().labelUnknown))} ${esc(t().labelFound)} ${esc(uniqFams(L.parsed.stages).map(fam).join(", ") || "–")}${L.parsed.absent && L.parsed.absent.length ? ` · ${esc(t().labelAbsent)} ${esc(L.parsed.absent.map(fam).join(", "))}` : ""}</div>` : "";
        labelForm = `<details class="labelbox" ${L.parsed ? "open" : ""}><summary>${esc(t().labelH)}</summary><div class="hint">${esc(t().labelHint)}</div>
          <textarea id="lbl-${id}" rows="3" placeholder="Alcohol Denat., Parfum, Aqua, ...">${esc(L.text || "")}</textarea>
          <div class="labelrow"><select id="lblm-${id}">${Object.entries(t().labelMarket).map(([k, v]) => `<option value="${k}" ${L.market === k ? "selected" : ""}>${esc(v)}</option>`).join("")}</select><button type="button" class="btn" data-readlabel="${id}">${esc(t().labelBtn)}</button></div>${result}</details>`;
      }
      return `<div class="strip" data-card="${id}">
        <div class="with-thumb">${imgTag(P)}<div class="grow">
        <div class="strip-head"><div class="name">${esc(pname(P))}${P.house ? `<span class="house">${esc(P.house)}</span>` : ""}${lang === "ar" && P.name !== pname(P) ? `<span class="ar">${esc(P.name)}</span>` : (lang !== "ar" && P.ar ? `<span class="ar">${esc(P.ar)}</span>` : "")}</div><button type="button" class="remove" data-remove="${id}">${esc(t().remove)}</button></div>
        <div class="notes">${esc(P.notes[lang])}</div>${evLine}${commLine}${autoHtml}
        </div></div>
        <div class="timeline">${stagesHtml}</div>${labelForm}
        <div class="again"><span>${esc(t().again)}</span><span class="seg2"><button type="button" data-again="${id}" data-v="1" aria-pressed="${r.again === 1}">${esc(t().yes)}</button><button type="button" data-again="${id}" data-v="0" aria-pressed="${r.again === 0}">${esc(t().no)}</button></span></div>
      </div>`;
    }).join("");
  }

  function renderProfile() {
    const host = $("profile");
    const ids = Object.keys(ratings).filter(id => STAGES.some(s => ratings[id][s] != null));
    if (!ids.length) { host.innerHTML = `<div class="empty">${esc(t().emptyProfile)}</div>`; return { prof: {}, ids }; }
    const prof = computeProfile();
    trackProfile(ids.length);
    const order = { badLikely: 0, badPossible: 1, mixed: 2, goodLikely: 3, goodPossible: 4 };
    const rows = Object.entries(prof).filter(([, v]) => v.cls !== "neutral").sort((a, b) => (order[a[1].cls] - order[b[1].cls]) || (Math.abs(b[1].score) - Math.abs(a[1].score)));
    if (!rows.length) { host.innerHTML = `<div class="empty">${esc(t().emptyProfile)}</div>`; return { prof, ids }; }
    const pillCls = { badLikely: "bad", badPossible: "warn", goodLikely: "good", goodPossible: "good", mixed: "" };
    const vCls = { badLikely: "bad-likely", badPossible: "bad-possible", goodLikely: "good-likely", goodPossible: "good-possible", mixed: "mixed" };
    host.innerHTML = `<div class="verdicts">` + rows.map(([f, v]) => {
      const evid = v.evidence.slice().sort((a, b) => STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage)).slice(0, 6).map(e => {
        const who = pname(e.perfume);
        const line = e.chip ? t().chipLine(who, stageName(e.stage), chipWord(e.chip)) : t().evidenceLine(who, stageName(e.stage), scaleWord(e.value));
        const src = e.chip ? "" : ` <span class="src">${esc(srcWord(e.prov || "curated"))}</span>`;
        return `<li><i class="dot ${e.value < 0 ? "n" : e.value > 0 ? "p" : ""}"></i><span>${esc(line)}${src}</span></li>`;
      }).join("");
      const neverNote = MAT.NEVER_ON_LABEL.includes(f) && (v.cls === "badLikely" || v.cls === "badPossible") ? `<div class="hint">${esc(t().neverOnLabel)}</div>` : "";
      let avoid = "";
      if (v.cls === "badLikely" || v.cls === "badPossible") {
        const also = PERFUMES.filter(P => !ratings[P.id] && (P.stages.drydown[f] || 0) >= 0.6).slice(0, 4).map(pname);
        if (also.length) avoid = `<div class="avoid">${esc(t().avoid)} <b>${esc(listJoin(also))}</b></div>`;
      }
      const pos = ((v.score + 2) / 4) * 100;
      const flagged = !!flags[f];
      return `<div class="verdict ${vCls[v.cls]}">
        <div class="v-head"><b>${esc(fam(f))}</b><span class="pill ${pillCls[v.cls]}">${esc(t().cls[v.cls])} · ${esc(v.n === 1 ? t().once : t().seenIn + " " + t().n(v.n))}</span></div>
        <div class="hint">${esc(famHint(f))}</div>
        <div class="bar" aria-hidden="true"><i style="left:${lang === "ar" ? "auto" : pos + "%"};right:${lang === "ar" ? pos + "%" : "auto"}"></i></div>
        <ul class="evidence">${evid}</ul>${neverNote}${avoid}
        <button type="button" class="flag" data-flag="${f}" ${flagged ? "disabled" : ""}>${esc(flagged ? t().flagged : t().flag)}</button>
      </div>`;
    }).join("") + `</div>`;
    const settle = settleSuggestion(prof);
    if (settle) host.insertAdjacentHTML("beforeend", `<div class="settle"><b>${esc(t().settleH)}</b>${esc(t().settle(pname(settle.target), fam(settle.f), listJoin(settle.others.map(fam))))}</div>`);
    return { prof, ids };
  }

  function renderRecs(prof, ids) {
    const host = $("recs");
    if (ids.length < 2) { host.innerHTML = `<div class="empty">${esc(t().emptyRecs)}</div>`; return; }
    const { picks, badAny } = recommend(prof);
    if (!picks.length) { host.innerHTML = `<div class="empty">${esc(t().emptyRecs)}</div>`; return; }
    host.innerHTML = `<div class="recs">` + picks.map(({ P, risks }) => {
      const whys = [];
      const clear = badAny.filter(f => (P.stages.drydown[f] || 0) < 0.2);
      if (clear.length) whys.push(t().whyClear(listJoin(clear.slice(0, 3).map(fam))));
      const liked = Object.entries(prof).filter(([f, v]) => (v.cls === "goodLikely" || v.cls === "goodPossible") && STAGES.some(s => (P.stages[s][f] || 0) >= 0.4)).sort((a, b) => b[1].score - a[1].score)[0];
      if (liked) { const src = liked[1].evidence.find(e => e.value > 0); if (src) whys.push(t().whyShares(fam(liked[0]), pname(src.perfume))); }
      const risk = risks.sort((a, b) => b.sev - a.sev)[0];
      const riskLine = risk ? (risk.kind === "unknown" ? t().riskUnknown(fam(risk.f), stageName(risk.s)) : risk.kind === "mixed" ? t().riskMixed(fam(risk.f), stageName(risk.s)) : t().riskNeg(fam(risk.f), stageName(risk.s))) : "";
      const q = encodeURIComponent(P.house + " " + P.name);
      const link = (tpl, label, primary) => `<a class="${primary ? "primary" : ""}" href="${tpl.replace("{q}", q)}" target="_blank" rel="noopener sponsored">${esc(label)}</a>`;
      const PP = resolve(P.id) || P;
      return `<div class="rec">
        <div class="with-thumb">${imgTag(PP)}<div class="grow">
        <div class="r-head"><b>${esc(pname(P))}</b><span class="pill">${esc(P.house)} · ${esc(t().cats[P.gender])}</span></div>
        <div class="notes">${esc(P.notes[lang])}</div>${P.cloneOf && byId[P.cloneOf] ? `<div class="auto-fams">${esc(t().cloneOf)} <b>${esc(pname(byId[P.cloneOf]))}</b></div>` : ""}</div></div>
        ${whys.map(w => `<div class="why">${esc(w)}</div>`).join("")}
        ${riskLine ? `<div class="risk">${esc(riskLine)}</div>` : ""}
        <div class="links">${link(CONFIG.links.sampleSA, t().sampleSA, lang === "ar")}${link(CONFIG.links.sampleUS, t().sampleUS, lang !== "ar")}${link(CONFIG.links.bottle, t().bottle, false)}</div>
      </div>`;
    }).join("") + `</div>` + (Object.keys(ratings).some(id => { const P = resolve(id); return P && P.auto; }) ? `<div class="notes" style="margin-top:8px">${esc(t().verifiedOnly)}</div>` : "");
  }

  /* The live panel: counts and headline verdicts, updated on every rating. */
  function renderPanel(prof, ids) {
    const panel = $("panel"), bar = $("bottombar");
    const rows = Object.entries(prof).filter(([, v]) => v.cls !== "neutral");
    const bad = rows.filter(([, v]) => v.cls === "badLikely" || v.cls === "badPossible");
    const good = rows.filter(([, v]) => v.cls === "goodLikely" || v.cls === "goodPossible");
    if (!ids.length) { panel.innerHTML = `<h3>${esc(t().panelH)}</h3><div class="quiet">${esc(t().pQuiet)}</div>`; bar.hidden = true; return; }
    const order = { badLikely: 0, badPossible: 1, goodLikely: 2, goodPossible: 3, mixed: 4 };
    const top = rows.sort((a, b) => order[a[1].cls] - order[b[1].cls] || Math.abs(b[1].score) - Math.abs(a[1].score)).slice(0, 5);
    const dotCls = { badLikely: "bad", badPossible: "warn", goodLikely: "good", goodPossible: "good", mixed: "" };
    panel.innerHTML = `<h3>${esc(t().panelH)}</h3>
      <div class="counts"><div><b>${ids.length}</b><span>${esc(t().pRated)}</span></div><div><b>${bad.length}</b><span>${esc(t().pBad)}</span></div><div><b>${good.length}</b><span>${esc(t().pGood)}</span></div></div>
      <ul>${top.map(([f, v]) => `<li><i class="${dotCls[v.cls]}"></i><span>${esc(fam(f))}</span></li>`).join("")}</ul>
      <a class="go" href="#sec-profile">${esc(t().pGo)}</a>`;
    bar.innerHTML = `<span>${esc(t().bottom(ids.length, bad.length))}</span><a href="#sec-profile">${esc(t().bottomGo)}</a>`;
    bar.hidden = false;
  }

  function renderAll() { renderChrome(); renderRated(); const { prof, ids } = renderProfile(); renderRecs(prof, ids); renderPanel(prof, ids); }

  /* ---------- search ---------- */
  function search(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    const hit = P => (P.name.toLowerCase().includes(q) || (P.house || "").toLowerCase().includes(q) || (P.ar && P.ar.includes(q)) || P.id.includes(q));
    const verified = PERFUMES.filter(P => !ratings[P.id] && hit(P)).map(P => resolve(P.id));
    const auto = Object.keys(AUTO).filter(id => !ratings[id] && !byId[id]).map(id => resolve(id)).filter(P => P && hit(P));
    return verified.concat(auto).slice(0, 12);
  }
  function showResults(list, q) {
    const box = $("results");
    q = (q || "").trim();
    const customRow = q.length >= 3 && !list.some(P => P.name.toLowerCase() === q.toLowerCase()) ? `<button type="button" data-addcustom="${esc(q)}"><span>${esc(t().addCustom(q))}</span></button>` : "";
    if (!list.length && !customRow) { box.hidden = true; box.innerHTML = ""; return; }
    box.innerHTML = list.map(P => `<button type="button" data-add="${P.id}"><span class="with-thumb" style="align-items:center">${imgTag(P, "sm")}<span>${esc(pname(P))} <span class="house">${lang === "ar" ? esc(P.name) : (P.ar ? esc(P.ar) : "")}</span></span></span><span class="house">${esc(P.house)} · ${esc(t().cats[P.gender])}${P.auto ? " · " + esc(t().autoBadge) : ""}</span></button>`).join("") + customRow;
    box.hidden = false;
  }
  function addEntry(id, entry) {
    if (ratings[id]) return;
    ratings[id] = Object.assign({ opening: null, heart: null, drydown: null, again: null, chips: {} }, entry || {});
    store.set("pp_ratings_v1", ratings);
    $("q").value = ""; showResults([]);
    renderAll();
    const card = document.querySelector(`[data-card="${id}"]`); if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function addPerfume(id) { if (byId[id]) addEntry(id); else if (AUTO[id]) addEntry(id, { auto: AUTO[id] }); }
  let lookingUp = false;
  function addCustom(name) {
    name = name.trim().slice(0, 80); if (name.length < 3 || lookingUp) return;
    const customId = "x_" + name.toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, "-").replace(/^-|-$/g, "");
    if (!CONFIG.endpoint) { addEntry(customId, { custom: name }); return; }
    lookingUp = true; toast(t().lookingUp); $("q").value = ""; showResults([]);
    const done = (found, entry) => {
      lookingUp = false;
      if (found && entry && entry.id) {
        /* reduce the vendor payload to identity plus derived weights; that is all we keep or send back */
        const d = entry.stages ? entry : derived(entry);
        AUTO[d.id] = d;
        if (!entry.stages && CONFIG.endpoint) sendRecord({ type: "tagcache", ...d });
        if (ratings[d.id]) { renderAll(); return; }
        addEntry(d.id, { auto: d });
      }
      else { toast(t().notFound); addEntry(customId, { custom: name }); }
    };
    try {
      fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ type: "lookup", q: name, lang, device }) })
        .then(r => r.json()).then(j => done(!!(j && j.found), j && j.entry)).catch(() => done(false));
    } catch (e) { done(false); }
  }

  /* ---------- share text ---------- */
  function profileText() {
    const prof = computeProfile();
    const lines = [t().brand + " · " + new Date().toISOString().slice(0, 10), ""];
    const order = ["badLikely", "badPossible", "mixed", "goodLikely", "goodPossible"];
    for (const cls of order) {
      const fs = Object.entries(prof).filter(([, v]) => v.cls === cls).map(([f, v]) => fam(f) + " (" + (v.n === 1 ? t().once : t().n(v.n)) + ")");
      if (fs.length) lines.push(t().cls[cls] + ": " + fs.join("; "));
    }
    lines.push("");
    for (const id of Object.keys(ratings)) { const r = ratings[id]; const P = resolve(id); if (!P) continue; lines.push(pname(P) + ": " + STAGES.map(s => stageName(s) + " " + (r[s] == null ? "–" : scaleWord(r[s]))).join(", ")); }
    return lines.join("\n");
  }

  /* ---------- events ---------- */
  document.addEventListener("click", ev => {
    const b = ev.target.closest("button, a"); if (!b) return;
    if (b.id === "lang-en" || b.id === "lang-ar") { lang = b.id === "lang-en" ? "en" : "ar"; store.set("pp_lang", lang); renderAll(); return; }
    if (b.dataset.add) { addPerfume(b.dataset.add); return; }
    if (b.dataset.addcustom) { addCustom(b.dataset.addcustom); return; }
    if (b.dataset.remove) { delete ratings[b.dataset.remove]; store.set("pp_ratings_v1", ratings); renderAll(); return; }
    if (b.dataset.rate && b.dataset.v != null && !b.dataset.chip) {
      const r = ratings[b.dataset.rate]; const v = +b.dataset.v; const s = b.dataset.stage;
      r[s] = r[s] === v ? null : v; if (r[s] == null || r[s] > 0) { if (r.chips) delete r.chips[s]; }
      persist(b.dataset.rate); renderAll(); return;
    }
    if (b.dataset.chip) {
      const r = ratings[b.dataset.rate]; const s = b.dataset.stage; r.chips = r.chips || {}; const arr = r.chips[s] || [];
      r.chips[s] = arr.includes(b.dataset.chip) ? arr.filter(x => x !== b.dataset.chip) : arr.concat(b.dataset.chip);
      persist(b.dataset.rate); renderAll(); return;
    }
    if (b.dataset.again) { const r = ratings[b.dataset.again]; const v = +b.dataset.v; r.again = r.again === v ? null : v; persist(b.dataset.again); renderAll(); return; }
    if (b.dataset.flag) {
      flags[b.dataset.flag] = true; store.set("pp_flags_v1", flags);
      if (CONFIG.endpoint) sendRecord({ type: "correction", device, lang, family: b.dataset.flag, perfume: "", perfumes: Object.keys(ratings).join("|") });
      renderAll(); return;
    }
    if (b.dataset.readlabel) { readLabel(b.dataset.readlabel); return; }
    if (b.dataset.flagperf) {
      flags[b.dataset.flagperf] = true; store.set("pp_flags_v1", flags);
      if (CONFIG.endpoint) sendRecord({ type: "correction", device, lang, family: "", perfume: b.dataset.flagperf, perfumes: "" });
      renderAll(); return;
    }
    if (b.id === "share") {
      const text = profileText();
      const done = () => toast(t().copied);
      const fail = () => { toast(t().copyFail); const pre = document.createElement("pre"); pre.textContent = text; pre.style.whiteSpace = "pre-wrap"; pre.style.fontSize = "13px"; pre.style.marginTop = "12px"; $("recs").appendChild(pre); const range = document.createRange(); range.selectNodeContents(pre); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); };
      try { navigator.clipboard.writeText(text).then(done, fail); } catch (e) { fail(); }
      return;
    }
    if (b.id === "reset") {
      if (!pendingReset) { pendingReset = true; b.textContent = t().resetYes; const keep = document.createElement("button"); keep.type = "button"; keep.className = "btn"; keep.id = "reset-keep"; keep.textContent = t().resetNo; b.after(keep); toast(t().resetConfirm); return; }
      ratings = {}; flags = {}; store.set("pp_ratings_v1", ratings); store.set("pp_flags_v1", flags); pendingReset = false; const keep = $("reset-keep"); if (keep) keep.remove(); renderAll(); return;
    }
    if (b.id === "reset-keep") { pendingReset = false; b.remove(); $("reset").textContent = t().reset; return; }
  });
  $("q").addEventListener("input", e => showResults(search(e.target.value), e.target.value));
  $("q").addEventListener("focus", e => showResults(search(e.target.value), e.target.value));
  $("q").addEventListener("keydown", e => { if (e.key === "Enter") { const first = $("results").querySelector("[data-add]"); if (first) addPerfume(first.dataset.add); else addCustom(e.target.value); } if (e.key === "Escape") showResults([]); });
  document.addEventListener("click", e => { if (!e.target.closest(".search")) showResults([]); });

  renderAll();
  loadCommunity();
  loadCatalogue();
})();
