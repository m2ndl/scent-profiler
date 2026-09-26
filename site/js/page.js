/* What the two pages share: the words both show, the device store, the escape and photo helpers, the rating
   sender and the backend calls, and the note rows and shop links both draw. app.js (the profiler) and quiz.js
   (the quiz, the front page) keep only their own words and screens; profile logic stays in engine.js.
   Use: const page = PP_PAGE.create({ D, E, CONFIG, words: T, lang: () => lang, ratings: () => ratings }) */

window.PP_PAGE = (function () {
  "use strict";
  /* the words both pages show; PP_PAGE.words adds a page's own words to them */
  const WORDS = {
    en: {
      brand: "Scent Profiler", tagline: "find what you hate before you buy", navArticles: "Why drydowns fail",
      cls: { badLikely: "Likely deal-breaker", badPossible: "Possible deal-breaker", goodLikely: "Reliably liked", goodPossible: "Probably liked", mixed: "Depends on the perfume" },
      recsH: "Three to try next", recsLede: "Ranked by what they avoid first, and what they share with your likes second. Samples, never blind bottles.",
      toldOnlyH: "Based only on what you told us",
      rowStage: { opening: "First minutes", heart: "First hours", drydown: "Hours later" },
      notListed: "not on its note list", notListedHint: "Some materials are in a perfume without being on its note list.",
      answers: { "-2": "Hated it", "-1": "Disliked it", 0: "Didn't mind", 1: "Liked it", 2: "Loved it", u: "Didn't notice it" },
      change: "Change",
      sampleSA: "Sample (Saudi shops)", sampleUS: "Sample (US)", bottle: "Full bottle",
      lookingUp: "Looking it up…",
      foot: `<p>Sample and bottle links may earn a commission; ranking never depends on it. Ratings are stored on this device. If sharing is switched on, they are sent anonymously with a random device id and nothing else.</p>`,
      cats: { m: "men", f: "women", u: "unisex" }
    },
    ar: {
      brand: "محلل الذائقة العطرية", tagline: "اعرف ما تكرهه قبل أن تشتري", navArticles: "لماذا يتغيّر العطر بعد ساعات",
      cls: { badLikely: "مُفسد مرجّح", badPossible: "مُفسد محتمل", goodLikely: "تحبه باستمرار", goodPossible: "تحبه على الأرجح", mixed: "يعتمد على العطر" },
      recsH: "ثلاثة لتجربتها", recsLede: "مرتّبة بحسب ما تتجنبه أولاً، وما تشترك فيه مع ما أحببته ثانياً. عينات، لا زجاجات على العمياني.",
      toldOnlyH: "بناءً على ما أخبرتنا به فقط",
      rowStage: { opening: "الدقائق الأولى", heart: "الساعات الأولى", drydown: "بعد ساعات" },
      notListed: "غير مذكور في قائمة نوتاته", notListedHint: "بعض المواد تكون في العطر من دون أن تُذكر في قائمة نوتاته.",
      answers: { "-2": "كرهته", "-1": "لم يعجبني", 0: "لا بأس به", 1: "أعجبني", 2: "أعجبني كثيراً", u: "لم ألاحظه" },
      change: "تغيير",
      sampleSA: "عينة (متاجر سعودية)", sampleUS: "عينة (أمريكا)", bottle: "زجاجة كاملة",
      lookingUp: "جارٍ البحث عنه…",
      foot: `<p>روابط العينات والزجاجات قد تكسب عمولة، والترتيب لا يعتمد عليها أبداً. التقييمات محفوظة على هذا الجهاز. إن كانت المشاركة مفعّلة تُرسل بلا اسم مع معرّف جهاز عشوائي ولا شيء غيره.</p>`,
      cats: { m: "رجالي", f: "نسائي", u: "للجنسين" }
    }
  };
  const words = own => ({ en: Object.assign({}, WORDS.en, own.en), ar: Object.assign({}, WORDS.ar, own.ar) });

  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  /* the drawn bottle, for a perfume with no photo: cream glass, amber juice, a gold cap */
  const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect x="22" y="5" width="12" height="9" rx="2" fill="#C99C43"/><rect x="25" y="14" width="6" height="4" fill="#B8862A"/><rect x="14" y="18" width="28" height="33" rx="7" fill="#FCF8F0" stroke="#C1AA8B" stroke-width="1.5"/><path d="M15.5 33h25v10.5a6 6 0 0 1-6 6h-13a6 6 0 0 1-6-6z" fill="#F0B135" opacity=".55"/><rect x="18" y="21" width="3" height="20" rx="1.5" fill="#fff" opacity=".8"/></svg>');
  /* a shipped bottle photo first (js/bottles.js), then the backend's vendor image, then the drawn bottle */
  const bottleSrc = P => (P && window.PP_BOTTLES && window.PP_BOTTLES[P.id]) || (P && P.image) || "";
  const imgTag = (P, cls) => { const src = bottleSrc(P); return `<img class="thumb${src ? " photo" : ""} ${cls || ""}" src="${src ? esc(src) : PLACEHOLDER}" alt="" loading="lazy" onerror="this.onerror=null;this.classList.remove('photo');this.src='${PLACEHOLDER}'">`; };
  /* a search hit: q (trimmed, lower case) in the perfume's name, house, Arabic name or id */
  const matches = (P, q) => (P.name.toLowerCase().includes(q) || (P.house || "").toLowerCase().includes(q) || (P.ar && P.ar.includes(q)) || P.id.includes(q));
  /* a profile's verdicts in reading order: deal-breakers, mixed, then liked, the strongest first in each */
  const ORDER = { badLikely: 0, badPossible: 1, mixed: 2, goodLikely: 3, goodPossible: 4 };
  const verdictRows = prof => Object.entries(prof).filter(([, v]) => v.cls !== "neutral").sort((a, b) => (ORDER[a[1].cls] - ORDER[b[1].cls]) || (Math.abs(b[1].score) - Math.abs(a[1].score)));
  /* a verdict's pill and card classes */
  const PILL = { badLikely: "bad", badPossible: "warn", goodLikely: "good", goodPossible: "good", mixed: "" };
  const CARD = { badLikely: "bad-likely", badPossible: "bad-possible", goodLikely: "good-likely", goodPossible: "good-possible", mixed: "mixed" };

  /* D: PP_DATA; E: an engine from PP_ENGINE.create; CONFIG: PP_CONFIG; words: the page's words from PP_PAGE.words;
     lang and ratings: the page's current language and ratings, which the page replaces as the visitor acts. */
  function create({ D, E, CONFIG, words: T, lang, ratings }) {
    /* Local testing only: http://localhost:8765/?endpoint=http://localhost:8765/api (see tools/mock_backend.py). */
    let endpointParam = "";
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { try { const e = new URLSearchParams(location.search).get("endpoint"); if (e) { CONFIG.endpoint = e; endpointParam = e; } } catch (err) { /* ignore */ } }
    let device = store.get("pp_device", null);
    if (!device) { device = "d_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set("pp_device", device); }
    const AUTO = {};     /* id -> catalogue entry from the backend (lazy catalogue) */
    const images = {};   /* verified id -> image url, from the backend's catalogue */

    const t = () => T[lang()];
    const fam = k => (D.FAMILIES[k] ? D.FAMILIES[k][lang()] : k);
    const pname = p => (lang() === "ar" && p.ar ? p.ar : p.name);
    const chipWord = id => { const c = D.CHIPS.find(x => x.id === id); return c ? c[lang()] : id; };
    const low = s => (lang() === "en" && s ? s[0].toLowerCase() + s.slice(1) : s);
    const listJoin = arr => lang() === "ar" ? arr.join("، ") : arr.length > 1 ? arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1] : arr[0] || "";
    /* a shop link for a perfume: {q} becomes its house and name, {lang} the page language (ar or en) */
    const shopUrl = (tpl, P) => tpl.replace("{q}", encodeURIComponent(P.house + " " + P.name)).replace("{lang}", lang());
    /* the partner program's required statement from config.js, in the page language */
    const partnerLine = () => { const d = CONFIG.disclosure && CONFIG.disclosure[lang()]; return d ? `<p>${esc(d)}</p>` : ""; };

    /* The engine keeps no state: each call gets the page's current ratings, lazy catalogue and images. */
    const state = () => ({ ratings: ratings(), auto: AUTO, images });
    const resolve = id => E.resolve(id, state());

    /* ---------- sending ---------- */
    /* One pending send per perfume, so rating another perfume never cancels it; a perfume removed (or reset)
       before its send fires is not sent; pending sends go out at once when the page is hidden or closed. */
    const sendTimers = {};
    function sendRating(id, leaving) {
      clearTimeout(sendTimers[id]); delete sendTimers[id];
      const r = ratings()[id]; if (!r) return;
      const P = resolve(id); const { auto, label, ...rest } = r;
      sendRecord({ type: "rating", device, lang: lang(), perfume: id, name: P ? P.name : id, ...rest }, leaving);
    }
    /* a rating goes out 1.2 s after its last change; dropSend forgets one whose record went back to what it was */
    function queueSend(id) { clearTimeout(sendTimers[id]); sendTimers[id] = setTimeout(() => sendRating(id), 1200); }
    function dropSend(id) { clearTimeout(sendTimers[id]); delete sendTimers[id]; }
    function flushSends() { for (const id of Object.keys(sendTimers)) sendRating(id, true); }
    /* leaving: the page is being hidden or closed, so the request must outlive it */
    function sendRecord(rec, leaving) {
      const body = JSON.stringify({ ...rec, ts: new Date().toISOString() });
      try {
        if (leaving && navigator.sendBeacon && navigator.sendBeacon(CONFIG.endpoint, body)) return;
        fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, keepalive: !!leaving }).catch(() => {});
      } catch (e) { /* offline or blocked */ }
    }
    /* an anonymous event, so completions and choices can be counted without analytics */
    function sendEvent(name, n) { if (CONFIG.endpoint) sendRecord({ type: "event", name, n, device, lang: lang() }); }
    /* A hidden page may never come back (a closed tab, or a phone that switches apps and later discards it). */
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushSends(); });
    window.addEventListener("pagehide", flushSends);

    /* ---------- the backend ---------- */
    /* a GET with a query (stats=1, catalogue=1), read as JSON; a failed call rejects */
    function getJSON(query) {
      try { return fetch(CONFIG.endpoint + (CONFIG.endpoint.includes("?") ? "&" : "?") + query).then(r => r.json()); } catch (e) { return Promise.reject(e); }
    }
    /* The lazy catalogue: entries for perfumes outside data.js, and vendor images for verified ones; then redraws. */
    function loadCatalogue(then) {
      if (!CONFIG.endpoint) return Promise.resolve();
      return getJSON("catalogue=1").then(j => {
        for (const e of (j && j.entries) || []) { if (!e || !e.id) continue; if (E.byId[e.id]) { if (e.image) images[e.id] = e.image; } else AUTO[e.id] = e; }
        then();
      }).catch(() => {});
    }
    /* A name in neither catalogue: the backend looks it up, and done gets the entry, or null. */
    function lookup(name, done) {
      const got = (found, entry) => {
        if (!(found && entry && entry.id)) { done(null); return; }
        /* reduce the vendor payload to identity plus derived weights; that is all we keep or send back */
        const d = entry.stages ? entry : E.derived(entry);
        AUTO[d.id] = d;
        if (!entry.stages) sendRecord({ type: "tagcache", ...d });
        done(d);
      };
      try {
        fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ type: "lookup", q: name, lang: lang(), device }) })
          .then(r => r.json()).then(j => got(!!(j && j.found), j && j.entry)).catch(() => got(false));
      } catch (e) { got(false); }
    }

    /* ---------- drawing ---------- */
    const $ = id => document.getElementById(id);
    function toast(msg) { const el = $("toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 1600); }
    /* the page language on the html element and the language buttons, and the brand */
    function chrome() {
      document.documentElement.lang = lang(); document.documentElement.dir = lang() === "ar" ? "rtl" : "ltr";
      $("lang-en").setAttribute("aria-pressed", lang() === "en"); $("lang-ar").setAttribute("aria-pressed", lang() === "ar");
      $("brand").innerHTML = esc(t().brand) + "<small>" + esc(t().tagline) + "</small>";
    }
    /* One note row: the stage in plain words, the note words in the page language and the family in small type.
       A row with no listed word says so; the family takes the words' place when the perfume has no note list on
       this page (a looked-up bottle) or when its Arabic list does not match the English one. An answered row
       collapses to its answer unless open (reopened with "Change"). nid: the perfume id the buttons carry on the
       profiler, which shows several perfumes' rows at once. */
    function noteRowHtml(P, row, rec, open, nid) {
      const f = row.f, v = rec.noteAnswers && f in rec.noteAnswers ? rec.noteAnswers[f] : null;
      const un = Array.isArray(rec.unnoticed) && rec.unnoticed.includes(f);
      const words = lang() === "ar" ? row.words.ar : row.words.en;
      const listed = !!(P.notes && /[a-z]/i.test(P.notes.en || ""));
      const perfume = nid == null ? "" : ` data-nid="${esc(nid)}"`;
      let main = esc(fam(f)), small = "", hint = "";
      if (words.length) { main = esc(words.join(lang() === "ar" ? "، " : ", ")); small = esc(fam(f)); }
      else if (!row.words.en.length && listed) { main = esc(t().notListed); small = esc(fam(f)); hint = `<div class="nhint">${esc(t().notListedHint)}</div>`; }
      const head = `<div class="nhead"><span class="nstage">${esc(t().rowStage[row.stage])}</span> · <b>${main}</b>${small ? ` · <span class="nfam">${small}</span>` : ""}</div>`;
      if ((v != null || un) && !open) return `<div class="nrow done">${head}<div class="ndone"><span class="npick">${esc(t().answers[un ? "u" : v])}</span><button type="button" class="qlink" data-nedit="${f}"${perfume}>${esc(t().change)}</button></div></div>`;
      const btn = (x, on, cls) => `<button type="button"${cls ? ` class="${cls}"` : ""} data-na="${f}"${perfume} data-v="${x}" aria-pressed="${on}">${esc(t().answers[x])}</button>`;
      return `<div class="nrow">${head}${hint}<div class="nopts">${[-2, -1, 0, 1, 2].map(x => btn(x, v === x)).join("")}${btn("u", un, "nun")}</div></div>`;
    }
    /* The three shop links for a pick: the Saudi sample shop leads in Arabic, the US one in English, then the
       bottle. event: what a click sends, where the page counts opened links. */
    function linksHtml(P, event) {
      const ev = event ? ` data-event="${esc(event)}"` : "";
      const link = (tpl, label, primary) => `<a class="${primary ? "primary" : ""}" href="${shopUrl(tpl, P)}" target="_blank" rel="noopener sponsored"${ev}>${esc(label)}</a>`;
      return `<div class="links">${link(CONFIG.links.sampleSA, t().sampleSA, lang() === "ar")}${link(CONFIG.links.sampleUS, t().sampleUS, lang() !== "ar")}${link(CONFIG.links.bottle, t().bottle, false)}</div>`;
    }

    return { t, fam, pname, chipWord, low, listJoin, shopUrl, partnerLine, state, resolve, AUTO, device, endpointParam,
      sendRecord, sendEvent, queueSend, dropSend, getJSON, loadCatalogue, lookup, $, toast, chrome, noteRowHtml, linksHtml,
      esc, PLACEHOLDER, bottleSrc, imgTag, matches, verdictRows, PILL, CARD };
  }

  return { words, store, create };
})();
