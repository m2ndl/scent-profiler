/* The profiler page (profile.html): its words, rendering and event handlers. The words, storage, sending and
   backend calls it shares with the quiz are in page.js; profile logic lives in engine.js, deployment settings
   in config.js. */
(function () {
  "use strict";
  const D = window.PP_DATA, M = window.PP_MAP, MAT = window.PP_MATERIALS, PAGE = window.PP_PAGE;
  if (!D || !M || !MAT || !window.PP_ENGINE || !window.PP_NOTES || !window.PP_CONFIG || !PAGE) { document.getElementById("h1").textContent = "A script in js/ did not load (config, data, mapper, materials, engine, notes or page). Serve the site folder as it is."; return; }
  const { FAMILIES, CHIPS } = D;
  const E = window.PP_ENGINE.create(D, M, window.PP_EVIDENCE);
  const N = window.PP_NOTES.create(D, M, E);
  const { STAGES, PERFUMES, byId } = E;

  /* Deployment settings: config.js. */
  const CONFIG = window.PP_CONFIG;

  /* ---------- i18n: this page's words; page.js holds the ones both pages show ---------- */
  const T = PAGE.words({
    en: {
      navQuiz: "Bottle quiz",
      heroQuiz: "Not sure where to start? Pick from twenty well-known bottles",
      h1: "Your scent profile",
      lede: "Rate the perfumes and samples you have tried, stage by stage: the opening, the heart and the base. Each rating sharpens what you like, what ruins a perfume for you, and the samples picked for you.",
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
      seenIn: "seen in", once: "one perfume so far", n: n => `${n} perfumes`,
      evidenceLine: (perfume, stage, val) => `${perfume}, ${stage.toLowerCase()}: ${val}`,
      chipLine: (perfume, stage, chip) => `${perfume}, ${stage.toLowerCase()}: you said "${chip}"`,
      avoid: "Also has this in the base:", flag: "This tag looks wrong", flagged: "Noted, thank you",
      settleH: "One sample would settle it",
      settle: (target, fam, others) => `Try ${target}. Its base is ${fam} without ${others}. If that drydown bothers you too, ${fam} is the culprit; if not, look at the others.`,
      emptyRecs: "Recommendations appear once you have rated at least two perfumes.",
      whyClear: fams => `Clear of ${fams} in the base.`,
      whyShares: (fam, perfume) => `Shares ${fam} with ${perfume}, which you liked.`,
      riskUnknown: (fam, stage) => `Contains ${fam} in the ${stage.toLowerCase()}, which you have not rated yet.`,
      riskMixed: (fam, stage) => `Contains ${fam} in the ${stage.toLowerCase()}, and your ratings of it are mixed.`,
      riskNeg: (fam, stage) => `Contains a little ${fam} in the ${stage.toLowerCase()}, which you have disliked before.`,
      riskTold: (fam, stage) => `Contains ${fam} in the ${stage.toLowerCase()}, which you said you avoid.`,
      riskLean: (fam, stage) => `Contains ${fam} in the ${stage.toLowerCase()}, which your quiz answers lean against.`,
      toldUses: n => `Also uses ${n} ${n === 1 ? "answer" : "answers"} from the quiz.`,
      noteLine: (perfume, stage, words, v) => `${perfume}, ${stage.toLowerCase()}: you ${{ 2: "loved", 1: "liked", 0: "didn't mind", "-1": "disliked", "-2": "hated" }[v]} the ${words}`,
      notesS: "Rate its notes", notesHint: "Tap what you remember; skip what you don't.",
      share: "Copy my profile", reset: "Start over", copied: "Copied to clipboard", copyFail: "Select and copy the text below",
      resetConfirm: "Delete all ratings on this device?", resetYes: "Yes, delete", resetNo: "Keep them",
      saved: "Saved on this device", sent: "Saved and shared anonymously",
      community: (n, d) => `Community: ${n} ratings, drydown average ${d}`,
      addCustom: q => `Add "${q}" (not in the list yet)`,
      untagged: "Not in the catalogue yet. Your rating is saved and will count once this perfume is tagged.",
      notFound: "Not found in the reference database; saved as untagged.",
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
    },
    ar: {
      navQuiz: "اختبار العطور",
      heroQuiz: "لا تعرف من أين تبدأ؟ اختر من عشرين عطراً معروفاً",
      h1: "ملفك العطري",
      lede: "قيّم العطور والعيّنات التي جرّبتها، مرحلة بمرحلة: الافتتاحية والقلب والقاعدة. كل تقييم يوضّح ما تحبه وما يفسد العطر عليك والعيّنات المختارة لك.",
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
      seenIn: "ظهر في", once: "عطر واحد حتى الآن", n: n => (n === 2 ? "عطرين" : n <= 10 ? `${n} عطور` : `${n} عطراً`),
      evidenceLine: (perfume, stage, val) => `${perfume}، ${stage}: ${val}`,
      chipLine: (perfume, stage, chip) => `${perfume}، ${stage}: قلت «${chip}»`,
      avoid: "موجود أيضاً في قاعدة:", flag: "هذا الوسم يبدو خاطئاً", flagged: "سُجّل، شكراً",
      settleH: "عينة واحدة تحسم الأمر",
      settle: (target, fam, others) => `جرّب ${target}. قاعدته ${fam} من دون ${others}. إن أزعجتك قاعدته أيضاً فالسبب ${fam}؛ وإن لم تزعجك فانظر إلى البقية.`,
      emptyRecs: "تظهر الترشيحات بعد تقييم عطرين على الأقل.",
      whyClear: fams => `قاعدته خالية من ${fams}.`,
      whyShares: (fam, perfume) => `يشترك في ${fam} مع ${perfume} الذي أعجبك.`,
      riskUnknown: (fam, stage) => `يحتوي على ${fam} في ${stage}، ولم تقيّمه بعد.`,
      riskMixed: (fam, stage) => `يحتوي على ${fam} في ${stage}، وتقييماتك له متباينة.`,
      riskNeg: (fam, stage) => `فيه قليل من ${fam} في ${stage}، وقد أزعجك من قبل.`,
      riskTold: (fam, stage) => `يحتوي على ${fam} في ${stage}، وقد قلت إنك تتجنبه.`,
      riskLean: (fam, stage) => `يحتوي على ${fam} في ${stage}، وإجاباتك في الاختبار تميل ضده.`,
      toldUses: n => `يعتمد الملف أيضاً على إجاباتك في الاختبار (${n}).`,
      noteLine: (perfume, stage, words, v) => `${perfume}: «${words}» (${stage}): إجابتك «${{ 2: "أعجبني كثيراً", 1: "أعجبني", 0: "لا بأس به", "-1": "لم يعجبني", "-2": "كرهته" }[v]}»`,
      notesS: "قيّم نوتاته", notesHint: "اختر ما تتذكره، وتجاوز ما لا تتذكره.",
      share: "انسخ ملفي", reset: "ابدأ من جديد", copied: "نُسخ", copyFail: "حدّد النص وانسخه",
      resetConfirm: "حذف كل التقييمات على هذا الجهاز؟", resetYes: "نعم، احذف", resetNo: "أبقها",
      saved: "محفوظ على هذا الجهاز", sent: "محفوظ ومشارَك بلا اسم",
      community: (n, d) => `المجتمع: ${n} تقييم، متوسط القاعدة ${d}`,
      addCustom: q => `أضف «${q}» (ليس في القائمة بعد)`,
      untagged: "ليس في القائمة بعد. تقييمك محفوظ وسيُحتسب بعد وسم هذا العطر.",
      notFound: "لم يوجد في قاعدة البيانات المرجعية؛ حُفظ من دون وسوم.",
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
<p>تقييمك للقاعدة يزن أكثر من تقييمك للافتتاحية، لأن القاعدة هي ما تعيش معه ست ساعات وما يجعل الزجاجة لا تصلح للاستخدام. تصبح العائلة <b>مُفسداً مرجّحاً</b> فقط عندما يشير عطران أو أكثر إلى الاتجاه نفسه. عطر واحد يعطي مُفسداً <b>محتملاً</b> واقتراحاً بالعينة الواحدة التي تحسم الأمر.</p>
<p>ما لا تستطيعه: تسمية الجزيء بعينه، أو مراعاة بشرتك، أو الصواب مع من لديه فقدان شم خاص بالمسك (نحو واحد من كل اثني عشر شخصاً). تعامل مع كل حكم بوصفه فرضية تختبرها بعينة ٢ مل، لا سبباً للشراء على العمياني.</p>`,
    }
  });

  /* ---------- state ---------- */
  const store = PAGE.store;
  let lang = store.get("pp_lang", "ar");   /* Arabic first, whatever the device language; a chosen language is kept */
  let ratings = store.get("pp_ratings_v1", {});
  let flags = store.get("pp_flags_v1", {});
  /* the helpers both pages share (page.js), reading this page's language and ratings */
  const page = PAGE.create({ D, E, CONFIG, words: T, lang: () => lang, ratings: () => ratings });
  const { device, AUTO, t, fam, pname, chipWord, esc, listJoin, low, partnerLine, imgTag, matches, state, resolve, sendRecord, $, toast, verdictRows, PILL, CARD } = page;
  let community = null;
  let pendingReset = false;
  /* The quiz's word answers (pp_quiz_v1), as the same told items the quiz passes to computeProfile. */
  let quiz = store.get("pp_quiz_v1", {});
  if (!quiz || typeof quiz !== "object") quiz = {};
  const told = N.toldItems(quiz);
  /* A "told" risk says "which you said you avoid" only when an avoided picker card gives that family 0.5 or more;
     a family pushed down only by the taste answer, a chip or a card's lesser family "leans against". */
  const saidAvoid = f => told.some(i => i.f === f && i.value < 0 && /^note:/.test(i.src) && i.w >= 0.5);
  const toldAnswers = D.QUIZ.notePicker.flatMap(s => s.notes).filter(n => quiz.notes && (quiz.notes[n.id] === 1 || quiz.notes[n.id] === -1)).length
    + (quiz.taste === "bitter" || quiz.taste === "sweet" ? 1 : 0) + window.PP_NOTES.normTold(quiz).told.filter(id => CHIPS.some(c => c.id === id)).length;
  const notesOpen = new Set();   /* cards whose "Rate its notes" block is open */
  const editing = new Set();     /* "id|family": answered note rows reopened with "Change" */

  const famHint = k => (FAMILIES[k] ? FAMILIES[k]["hint_" + lang] : "");
  const stageName = s => t().stages[s][0];
  const scaleWord = v => t().scale[v + 2];
  const fmt1 = n => (Math.round(n * 10) / 10).toFixed(1).replace("-", "−");
  const srcWord = p => ({ curated: t().srcCurated, label: t().srcLabel, "label-absent": t().srcLabelAbsent, book: t().srcBook, notes: t().srcNotes })[p] || "";
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
  const computeProfile = () => E.computeProfile(Object.assign(state(), { told }));
  /* the quiz's avoided note cards veto picks unless a kept bottle carries the note (engine.recommend) */
  const recommend = prof => E.recommend(prof, ratings, N.avoidedNotes(quiz));
  const settleSuggestion = prof => E.settleSuggestion(prof, ratings);

  /* ---------- persistence and sharing (the sender is in page.js) ---------- */
  function persist(id) {
    store.set("pp_ratings_v1", ratings);
    if (!CONFIG.endpoint) { toast(t().saved); return; }
    page.queueSend(id);
    toast(t().sent);
  }
  /* One anonymous event per session once a profile exists, so completions can be counted without analytics. */
  function trackProfile(n) {
    if (!CONFIG.endpoint || n < 2) return;
    let seen = false; try { seen = sessionStorage.getItem("pp_evt") === "1"; } catch (e) { /* ignore */ }
    if (seen) return;
    try { sessionStorage.setItem("pp_evt", "1"); } catch (e) { /* ignore */ }
    page.sendEvent("profile_viewed", n);
  }
  function loadCommunity() {
    if (!CONFIG.endpoint) return;
    page.getJSON("stats=1").then(j => { community = j && j.perfumes ? j.perfumes : null; renderRated(); }).catch(() => {});
  }

  /* ---------- rendering ---------- */
  function renderChrome() {
    page.chrome();
    $("nav-articles").textContent = t().navArticles; $("nav-quiz").textContent = t().navQuiz;
    $("h1").textContent = t().h1; $("lede").textContent = t().lede; $("hero-quiz").textContent = t().heroQuiz;
    $("ask").textContent = t().ask; $("q-label").textContent = t().qLabel; $("q").placeholder = t().q; $("hint").textContent = t().hint;
    $("profile-h").textContent = t().profileH; $("profile-lede").textContent = t().profileLede;
    $("recs-h").textContent = t().recsH; $("recs-lede").textContent = t().recsLede;
    $("share").textContent = t().share; $("reset").textContent = pendingReset ? t().resetYes : t().reset;
    $("method-s").textContent = t().methodS; $("method").innerHTML = t().method; $("foot").innerHTML = t().foot + partnerLine();
    const quickIds = ["sauvageedp", "bleuedp", "aventus", "hacivat", "br540", "khamrah", "yara", "erbapura", "libre", "cdnim"];
    $("quick").innerHTML = "<span class='eyebrow'>" + esc(t().quick) + "</span>" + quickIds.filter(id => !ratings[id]).map(id => `<button type="button" data-add="${id}">${esc(pname(byId[id]))}</button>`).join("");
  }

  /* "Rate its notes": the quiz's worn-bottle rows for this perfume, drawn as on the quiz (page.js noteRowHtml) */
  function notesBoxHtml(id, P, r) {
    const rows = N.questions(P, "worn"); if (!rows.length) return "";
    const done = rows.filter(row => (r.noteAnswers && row.f in r.noteAnswers) || (Array.isArray(r.unnoticed) && r.unnoticed.includes(row.f))).length;
    return `<details class="nbox" data-nbox="${esc(id)}"${notesOpen.has(id) ? " open" : ""}><summary>${esc(t().notesS)}${done ? ` <span class="ncount">${done}/${rows.length}</span>` : ""}</summary><div class="hint">${esc(t().notesHint)}</div>
          <div class="nrows">${rows.map(row => page.noteRowHtml(P, row, r, editing.has(id + "|" + row.f), id)).join("")}</div></details>`;
  }
  /* the words an evidence line from a note answer names: the row's note words, or the family */
  function noteWords(P, f) {
    const row = N.questions(P, "worn").find(x => x.f === f) || N.questions(P, "shop").find(x => x.f === f);
    const w = row ? (lang === "ar" ? row.words.ar : row.words.en) : [];
    return w.length ? listJoin(w) : low(fam(f));
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
        <div class="timeline">${stagesHtml}</div>${P.custom ? "" : notesBoxHtml(id, P, r)}${labelForm}
        <div class="again"><span>${esc(t().again)}</span><span class="seg2"><button type="button" data-again="${id}" data-v="1" aria-pressed="${r.again === 1}">${esc(t().yes)}</button><button type="button" data-again="${id}" data-v="0" aria-pressed="${r.again === 0}">${esc(t().no)}</button></span></div>
      </div>`;
    }).join("");
  }

  function renderProfile() {
    const host = $("profile");
    const ids = Object.keys(ratings).filter(id => STAGES.some(s => ratings[id][s] != null));
    /* one line when the quiz's word answers count too, with a link to the quiz */
    const uses = toldAnswers ? `<p class="hint"><a href="index.html">${esc(t().toldUses(toldAnswers))}</a></p>` : "";
    const prof = computeProfile();
    if (!ids.length) { host.innerHTML = `<div class="empty">${esc(t().emptyProfile)}</div>` + uses; return { prof, ids }; }
    trackProfile(ids.length);
    const rows = verdictRows(prof);
    if (!rows.length) { host.innerHTML = `<div class="empty">${esc(t().emptyProfile)}</div>` + uses; return { prof, ids }; }
    host.innerHTML = `<div class="verdicts">` + rows.map(([f, v]) => {
      const evid = v.evidence.slice().sort((a, b) => STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage)).slice(0, 6).map(e => {
        const who = pname(e.perfume);
        const line = e.chip ? t().chipLine(who, stageName(e.stage), chipWord(e.chip)) : e.note ? t().noteLine(who, stageName(e.stage), noteWords(e.perfume, f), e.value) : t().evidenceLine(who, stageName(e.stage), scaleWord(e.value));
        const src = e.chip ? "" : ` <span class="src">${esc(srcWord(e.prov || "curated"))}</span>`;
        return `<li><i class="dot ${e.value < 0 ? "n" : e.value > 0 ? "p" : ""}"></i><span>${esc(line)}${src}</span></li>`;
      }).join("");
      const neverNote = MAT.NEVER_ON_LABEL.includes(f) && (v.cls === "badLikely" || v.cls === "badPossible") ? `<div class="hint">${esc(t().neverOnLabel)}</div>` : "";
      let avoid = "";
      if (v.cls === "badLikely" || v.cls === "badPossible") {
        const also = PERFUMES.filter(P => !ratings[P.id] && (P.stages.drydown[f] || 0) >= 0.6).slice(0, 4).map(pname);
        if (also.length) avoid = `<div class="avoid">${esc(t().avoid)} <b>${esc(listJoin(also))}</b></div>`;
      }
      const pos = Math.min(100, Math.max(0, ((v.score + 2) / 4) * 100));
      const flagged = !!flags[f];
      return `<div class="verdict ${CARD[v.cls]}">
        <div class="v-head"><b>${esc(fam(f))}</b><span class="pill ${PILL[v.cls]}">${esc(t().cls[v.cls])} · ${esc(v.n === 1 ? t().once : t().seenIn + " " + t().n(v.n))}</span></div>
        <div class="hint">${esc(famHint(f))}</div>
        <div class="bar" aria-hidden="true"><i style="left:${lang === "ar" ? "auto" : pos + "%"};right:${lang === "ar" ? pos + "%" : "auto"}"></i></div>
        <ul class="evidence">${evid}</ul>${neverNote}${avoid}
        <button type="button" class="flag" data-flag="${f}" ${flagged ? "disabled" : ""}>${esc(flagged ? t().flagged : t().flag)}</button>
      </div>`;
    }).join("") + `</div>`;
    const settle = settleSuggestion(prof);
    if (settle) host.insertAdjacentHTML("beforeend", `<div class="settle"><b>${esc(t().settleH)}</b>${esc(t().settle(pname(settle.target), fam(settle.f), listJoin(settle.others.map(fam))))}</div>`);
    if (uses) host.insertAdjacentHTML("beforeend", uses);
    return { prof, ids };
  }

  /* The quiz's gate and heading, so both pages show the same picks: two rated perfumes, or any number once the
     quiz's answers name something enjoyed; with none rated, the heading says the picks rest on those answers. */
  function renderRecs(prof, ids) {
    const host = $("recs");
    const gate = ids.length >= 2 || told.some(i => i.value > 0);
    $("recs-h").textContent = !ids.length && gate ? t().toldOnlyH : t().recsH;
    if (!gate) { host.innerHTML = `<div class="empty">${esc(t().emptyRecs)}</div>`; return; }
    const { picks, badAny } = recommend(prof);
    if (!picks.length) { host.innerHTML = `<div class="empty">${esc(t().emptyRecs)}</div>`; return; }
    host.innerHTML = `<div class="recs">` + picks.map(({ P, reason }) => {
      const whys = [];
      const clear = badAny.filter(f => (P.stages.drydown[f] || 0) < 0.2);
      if (clear.length) whys.push(t().whyClear(listJoin(clear.slice(0, 3).map(fam))));
      const liked = Object.entries(prof).filter(([f, v]) => (v.cls === "goodLikely" || v.cls === "goodPossible") && STAGES.some(s => (P.stages[s][f] || 0) >= 0.4)).sort((a, b) => b[1].score - a[1].score)[0];
      if (liked) { const src = liked[1].evidence.find(e => e.value > 0); if (src) whys.push(t().whyShares(fam(liked[0]), pname(src.perfume))); }
      /* one thing to watch for at most, chosen by the engine (a family the visitor avoids, a possible deal-breaker, a
         family their bottles split on, an untried family that leads) */
      const risk = reason && reason.watch;
      const riskLine = risk ? ((risk.kind === "avoid" || risk.kind === "avoidOpening" || risk.kind === "lean") ? (saidAvoid(risk.f) ? t().riskTold : t().riskLean)(fam(risk.f), stageName(risk.s)) : risk.kind === "unknown" ? t().riskUnknown(fam(risk.f), stageName(risk.s)) : risk.kind === "mixed" ? t().riskMixed(fam(risk.f), stageName(risk.s)) : t().riskNeg(fam(risk.f), stageName(risk.s))) : "";
      const PP = resolve(P.id) || P;
      return `<div class="rec">
        <div class="with-thumb">${imgTag(PP)}<div class="grow">
        <div class="r-head"><b>${esc(pname(P))}</b><span class="pill">${esc(P.house)} · ${esc(t().cats[P.gender])}</span></div>
        <div class="notes">${esc(P.notes[lang])}</div>${P.cloneOf && byId[P.cloneOf] ? `<div class="auto-fams">${esc(t().cloneOf)} <b>${esc(pname(byId[P.cloneOf]))}</b></div>` : ""}</div></div>
        ${whys.map(w => `<div class="why">${esc(w)}</div>`).join("")}
        ${riskLine ? `<div class="risk">${esc(riskLine)}</div>` : ""}
        ${page.linksHtml(P)}
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
    panel.innerHTML = `<h3>${esc(t().panelH)}</h3>
      <div class="counts"><div><b>${ids.length}</b><span>${esc(t().pRated)}</span></div><div><b>${bad.length}</b><span>${esc(t().pBad)}</span></div><div><b>${good.length}</b><span>${esc(t().pGood)}</span></div></div>
      <ul>${top.map(([f, v]) => `<li><i class="${PILL[v.cls]}"></i><span>${esc(fam(f))}</span></li>`).join("")}</ul>
      <a class="go" href="#sec-profile">${esc(t().pGo)}</a>`;
    bar.innerHTML = `<span>${esc(t().bottom(ids.length, bad.length))}</span><a href="#sec-profile">${esc(t().bottomGo)}</a>`;
    bar.hidden = false;
  }

  function renderAll() { renderChrome(); renderRated(); const { prof, ids } = renderProfile(); renderRecs(prof, ids); renderPanel(prof, ids); }

  /* ---------- search ---------- */
  function search(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    const verified = PERFUMES.filter(P => !ratings[P.id] && matches(P, q)).map(P => resolve(P.id));
    const auto = Object.keys(AUTO).filter(id => !ratings[id] && !byId[id]).map(id => resolve(id)).filter(P => P && matches(P, q));
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
    page.lookup(name, d => {
      lookingUp = false;
      if (d) { if (ratings[d.id]) { renderAll(); return; } addEntry(d.id, { auto: d }); }
      else { toast(t().notFound); addEntry(customId, { custom: name }); }
    });
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
    /* a note row's answer: -2 to 2, or u (didn't notice it); the answer already chosen clears it. The quiz's src
       stays: the stage ratings, which the community averages read, are unchanged. */
    if (b.dataset.na && b.dataset.nid) {
      const id = b.dataset.nid, r = ratings[id], f = b.dataset.na, P = r && resolve(id);
      if (!P || !N.questions(P, "worn").some(row => row.f === f)) return;
      const na = Object.assign({}, r.noteAnswers); let un = Array.isArray(r.unnoticed) ? r.unnoticed.slice() : [];
      if (b.dataset.v === "u") { if (un.includes(f)) un = un.filter(x => x !== f); else { un.push(f); delete na[f]; } }
      else { const v = +b.dataset.v; if (![-2, -1, 0, 1, 2].includes(v)) return; if (na[f] === v) delete na[f]; else { na[f] = v; un = un.filter(x => x !== f); } }
      if (Object.keys(na).length) r.noteAnswers = na; else delete r.noteAnswers;
      if (un.length) r.unnoticed = un; else delete r.unnoticed;
      editing.delete(id + "|" + f); notesOpen.add(id);
      persist(id); renderAll(); return;
    }
    if (b.dataset.nedit && b.dataset.nid) { editing.add(b.dataset.nid + "|" + b.dataset.nedit); notesOpen.add(b.dataset.nid); renderAll(); return; }
    if (b.dataset.rate && b.dataset.v != null && !b.dataset.chip) {
      const r = ratings[b.dataset.rate]; const v = +b.dataset.v; const s = b.dataset.stage; delete r.src;
      r[s] = r[s] === v ? null : v; if (r[s] == null || r[s] > 0) { if (r.chips) delete r.chips[s]; }
      persist(b.dataset.rate); renderAll(); return;
    }
    if (b.dataset.chip) {
      const r = ratings[b.dataset.rate]; const s = b.dataset.stage; delete r.src; r.chips = r.chips || {}; const arr = r.chips[s] || [];
      r.chips[s] = arr.includes(b.dataset.chip) ? arr.filter(x => x !== b.dataset.chip) : arr.concat(b.dataset.chip);
      persist(b.dataset.rate); renderAll(); return;
    }
    if (b.dataset.again) { const r = ratings[b.dataset.again]; const v = +b.dataset.v; delete r.src; r.again = r.again === v ? null : v; persist(b.dataset.again); renderAll(); return; }
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
  /* keep a "Rate its notes" block open or closed across redraws */
  document.addEventListener("toggle", e => { const d = e.target; if (d && d.dataset && d.dataset.nbox) { if (d.open) notesOpen.add(d.dataset.nbox); else notesOpen.delete(d.dataset.nbox); } }, true);

  renderAll();
  loadCommunity();
  /* ?add=<id> (the quiz's tester cards): add that perfume unless it is rated, again once the lazy catalogue is in
     (for looked-up ids), then drop the parameter so a reload does not add it again. */
  let linkAdd = null; try { linkAdd = new URLSearchParams(location.search).get("add"); } catch (e) { /* ignore */ }
  const addLinked = () => { if (linkAdd && !ratings[linkAdd]) addPerfume(linkAdd); };
  addLinked();
  page.loadCatalogue(renderAll).then(() => {
    if (!linkAdd) return;
    addLinked();
    try { const p = new URLSearchParams(location.search); p.delete("add"); const q = p.toString(); history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash); } catch (e) { /* ignore */ }
  });
})();
