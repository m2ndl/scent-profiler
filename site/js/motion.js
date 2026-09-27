/* The quiz's motion and touch (the front page only). A new screen arrives as a view transition: the quiz column slides
   out and in by direction, mirrored in Arabic, and an element carrying the same data-vt on both screens (a bottle)
   flies from its old place to its new one. The same screen is patched in place, keeping its elements, so a pressed
   option animates and keyboard focus stays where it was. Picking a bottle raises a gold mist from its top and flies it
   into the dock. Nothing here changes what a screen says or does: with reduced motion, in a browser without these
   features and under the Node test stub, a screen is simply redrawn.
   Use: PP_MOTION.paint(host, html, { key, dir, after }), patch(el, html), pick(button, on, id), tap(el), chosen(el),
   whenSeen(el, fn), moving(). window.PP_MOTION_OFF = true, set before this file loads, turns every part off (the
   lockstep check compares a patched page with a plainly redrawn one). */

window.PP_MOTION = (function () {
  "use strict";
  const doc = document, off = window.PP_MOTION_OFF === true;
  /* a real DOM: a template element with a content fragment (the test stub has neither) */
  let canPatch = false;
  try { const tp = doc.createElement("template"); canPatch = !off && !!tp && "content" in tp && !!tp.content; } catch (e) { canPatch = false; }
  let mq = null;
  try { mq = canPatch && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null; } catch (e) { mq = null; }
  /* motion is asked again at every use, so a changed system setting applies at once */
  const moving = () => canPatch && !!mq && !mq.matches && typeof requestAnimationFrame === "function";
  const now = () => (window.performance && performance.now ? performance.now() : Date.now());

  /* ---------- the in-place patch ---------- */
  /* An element's identity across a patch: its id, or its data attributes (a tile, an option, a note answer), so a
     button keeps its node while its state changes. Elements with neither are matched by position. */
  function keyOf(n) {
    if (n.nodeType !== 1) return "";
    if (n.id) return "#" + n.id;
    let k = "";
    for (const a of n.attributes) if (a.name.slice(0, 5) === "data-" && a.name !== "data-stage") k += a.name + "=" + a.value + ";";
    return k;
  }
  const sameKind = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.nodeName === b.nodeName && keyOf(a) === keyOf(b)));
  /* A photo that failed to load: page.js swaps in the drawn bottle and clears its own handler. The photo that failed is
     noted here (a capture listener runs before that handler), so a patch keeps the drawn bottle while the markup still
     asks for the same photo, and re-arms the handler when it asks for another. */
  const failed = new WeakMap();
  if (canPatch) doc.addEventListener("error", e => { const t = e.target; if (t && t.nodeName === "IMG") failed.set(t, t.getAttribute("src")); }, true);
  /* attributes follow the new markup; a details element keeps the open state the visitor gave it */
  function syncAttrs(live, next) {
    if (live.nodeName === "IMG" && failed.has(live)) {
      if (failed.get(live) === next.getAttribute("src")) return;
      failed.delete(live);
      if (next.hasAttribute("onerror")) live.setAttribute("onerror", next.getAttribute("onerror"));
    }
    for (let i = live.attributes.length - 1; i >= 0; i--) {
      const name = live.attributes[i].name;
      if (!next.hasAttribute(name) && !(name === "open" && live.nodeName === "DETAILS")) live.removeAttribute(name);
    }
    for (const a of next.attributes) if (live.getAttribute(a.name) !== a.value) live.setAttribute(a.name, a.value);
  }
  function patchChildren(live, next) {
    let cur = live.firstChild;
    for (const n of Array.from(next.childNodes)) {
      let hit = cur && sameKind(cur, n) ? cur : null;
      if (!hit && n.nodeType === 1) {
        const k = keyOf(n);
        if (k) for (let x = cur ? cur.nextSibling : null; x; x = x.nextSibling) if (x.nodeType === 1 && x.nodeName === n.nodeName && keyOf(x) === k) { hit = x; break; }
      }
      if (!hit) { live.insertBefore(n, cur); continue; }
      if (hit === cur) cur = cur.nextSibling; else live.insertBefore(hit, cur);
      if (n.nodeType === 1) { syncAttrs(hit, n); patchChildren(hit, n); }
      else if (hit.nodeValue !== n.nodeValue) hit.nodeValue = n.nodeValue;
    }
    while (cur) { const x = cur.nextSibling; live.removeChild(cur); cur = x; }
  }
  function patch(el, html) {
    if (!el) return;
    if (!canPatch) { el.innerHTML = html; return; }
    const tp = doc.createElement("template");
    tp.innerHTML = html;
    patchChildren(el, tp.content);
  }

  /* ---------- screens ---------- */
  /* key: what makes a screen a new one (the page builds it from the step, the bottle, the picker screen and the
     language); dir: fwd, back, fade or up; after: what the page does once the new markup is in (it runs inside the
     transition, so the new picture includes it). The first screen of a visit is drawn at once. */
  let lastKey = null, running = false, current = null;
  function paint(host, html, o) {
    o = o || {};
    const first = lastKey === null, same = o.key != null && o.key === lastKey;
    lastKey = o.key == null ? null : o.key;
    if (same) { patch(host, html); if (o.after) o.after(); return; }
    if (!first && !running && moving() && typeof doc.startViewTransition === "function") { transition(host, html, o); return; }
    host.innerHTML = html; if (o.after) o.after();
    if (!first && moving()) enter(host, o.dir);
  }
  const ident = v => "vt-" + String(v).replace(/[^A-Za-z0-9_-]/g, "_");
  /* the elements under host carrying one of the names, the first of each; a bottle is named by its photo */
  function marked(host, names) {
    const out = new Map();
    for (const el of host.getElementsByTagName("*")) {
      const v = el.getAttribute("data-vt");
      if (v && names.has(v) && !out.has(v)) out.set(v, el.nodeName === "IMG" ? el : el.getElementsByTagName("img")[0] || el);
    }
    return out;
  }
  function name(el, v) { el.style.viewTransitionName = v; el.style.viewTransitionClass = "qb"; }
  function unname(el) { el.style.viewTransitionName = ""; el.style.viewTransitionClass = ""; if (el.getAttribute("style") === "") el.removeAttribute("style"); }
  function transition(host, html, o) {
    const root = doc.documentElement, want = new Set();
    for (const m of html.matchAll(/data-vt="([^"]+)"/g)) want.add(m[1]);
    const olds = marked(host, want), oldTop = host.getBoundingClientRect().top;
    let news = new Map();
    running = true;
    root.setAttribute("data-motion", o.dir || "fwd"); root.classList.add("vt");
    for (const [v, el] of olds) name(el, ident(v));
    const done = () => {
      running = false; current = null;
      for (const el of news.values()) unname(el);
      root.classList.remove("vt"); root.removeAttribute("data-motion"); root.style.removeProperty("--vt-y");
      if (root.getAttribute("style") === "") root.removeAttribute("style");
    };
    let t;
    try {
      t = doc.startViewTransition(() => {
        host.innerHTML = html; if (o.after) o.after();
        news = marked(host, new Set(olds.keys()));
        for (const [v, el] of news) name(el, ident(v));
        root.style.setProperty("--vt-y", Math.round(oldTop - host.getBoundingClientRect().top) + "px");
      });
    } catch (e) {
      /* the browser refused the transition before running the update: draw the screen plainly */
      for (const el of olds.values()) unname(el);
      done(); host.innerHTML = html; if (o.after) o.after(); return;
    }
    current = t;
    t.finished.then(done, done);
    if (t.ready) t.ready.catch(() => {});
    /* an error in the page's own drawing still reaches the console; a skipped transition is not an error */
    if (t.updateCallbackDone) t.updateCallbackDone.catch(e => { if (!e || e.name !== "AbortError") console.error(e); });
  }
  /* While a transition runs the browser sends taps to the page root, not to the buttons under them. A tap then ends the
     transition at once and goes to the button under the finger, so a quick visitor loses nothing. */
  if (canPatch) doc.addEventListener("click", e => {
    if (!current || e.target !== doc.documentElement) return;
    try { current.skipTransition(); } catch (err) { /* already over */ }
    const el = doc.elementFromPoint(e.clientX, e.clientY), b = el && el.closest ? el.closest("button, a") : null;
    if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault(); b.click();
  }, true);
  /* without view transitions: the new screen glides in on its own */
  function enter(host, dir) {
    const end = e => { if (e && e.target !== host) return; host.classList.remove("fx-in"); host.removeAttribute("data-in"); host.removeEventListener("animationend", end); };
    host.classList.remove("fx-in"); void host.offsetWidth;
    host.setAttribute("data-in", dir || "fwd"); host.classList.add("fx-in");
    host.addEventListener("animationend", end); setTimeout(end, 800);
  }

  /* ---------- touch: where the finger last came down, a light there, a short buzz on phones ---------- */
  let ptr = { type: "", x: 0, y: 0, t: 0 };
  if (canPatch) doc.addEventListener("pointerdown", e => { ptr = { type: e.pointerType || "", x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
  function buzz(ms) {
    if (ptr.type !== "touch" || Date.now() - ptr.t > 1500 || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch (e) { /* not allowed here */ }
  }
  const inQuiz = el => !!(el && el.closest && el.closest("#quiz"));
  function tap(el) { if (moving() && inQuiz(el) && Date.now() - ptr.t < 900) glow(ptr.x, ptr.y); }
  /* an option that moves the visitor on is held, chosen, in the picture of the screen that leaves */
  function chosen(el) { if (!moving() || !inQuiz(el)) return; el.classList.add("fx-chosen"); buzz(8); }

  /* ---------- the mist: gold droplets and a soft cloud, drawn on one canvas over the page ---------- */
  let cv = null, cx = null, dpr = 1, dots = [], puffs = [], raf = 0, last = 0;
  function layer() {
    if (cv) return !!cx;
    try {
      cv = doc.createElement("canvas"); cv.className = "fxlayer"; cv.setAttribute("aria-hidden", "true");
      doc.body.appendChild(cv); cx = cv.getContext("2d");
      /* the canvas covers the viewport without the scroll bar, so its pixels match the page's */
      const fit = () => { const r = doc.documentElement; dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.clientWidth * dpr); cv.height = Math.round(r.clientHeight * dpr); };
      fit(); window.addEventListener("resize", fit);
    } catch (e) { cx = null; }
    return !!cx;
  }
  const GOLD = ["184,134,42", "217,174,79", "240,177,53", "201,156,67", "242,214,138", "140,95,0"];
  function mist(x, y, n) {
    if (!moving() || !layer()) return;
    const t0 = now();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.3, v = 45 + Math.random() * 125;
      dots.push({ x: x + (Math.random() - 0.5) * 12, y: y + Math.random() * 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 0.8 + Math.random() * 1.8, c: GOLD[i % GOLD.length], t0, life: 700 + Math.random() * 500 });
    }
    puffs.push({ x, y: y - 8, r0: 4, r1: 34 + Math.random() * 10, a: 0.5, c: "255,241,205", t0, life: 760 });
    run();
  }
  function glow(x, y) { if (!layer()) return; puffs.push({ x, y, r0: 6, r1: 46, a: 0.3, c: "255,236,190", t0: now(), life: 520 }); run(); }
  function run() { if (!raf) { last = now(); raf = requestAnimationFrame(frame); } }
  function frame(t) {
    const dt = Math.min(0.05, Math.max(0, (t - last) / 1000)); last = t;
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    puffs = puffs.filter(p => {
      const k = (t - p.t0) / p.life; if (k >= 1) return false;
      const r = p.r0 + (p.r1 - p.r0) * (1 - Math.pow(1 - k, 3)), g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, `rgba(${p.c},${(p.a * (1 - k)).toFixed(3)})`); g.addColorStop(1, `rgba(${p.c},0)`);
      cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, r, 0, 6.2832); cx.fill();
      return true;
    });
    dots = dots.filter(d => {
      const k = (t - d.t0) / d.life; if (k >= 1) return false;
      d.vx *= 1 - 2.2 * dt; d.vy = d.vy * (1 - 2.2 * dt) - 24 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      cx.fillStyle = `rgba(${d.c},${(0.95 * (1 - k)).toFixed(3)})`; cx.beginPath(); cx.arc(d.x, d.y, d.r * (1 - 0.4 * k), 0, 6.2832); cx.fill();
      return true;
    });
    if (dots.length || puffs.length) raf = requestAnimationFrame(frame);
    else { raf = 0; cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); }
  }

  /* ---------- a picked bottle: the mist from its top, then its flight into the dock ---------- */
  function fly(img, to, then) {
    /* the target may be mid-pop (scaled), so its size comes from its layout box; a scale keeps its centre in place */
    const a = img.getBoundingClientRect(), b = to.getBoundingClientRect(), bh = to.offsetHeight || b.height;
    if (!a.width || !bh || typeof img.animate !== "function") return;
    const w = doc.createElement("div"), f = doc.createElement("img");
    w.className = "fxfly"; f.src = img.currentSrc || img.src; f.alt = "";
    w.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
    w.appendChild(f); doc.body.appendChild(w);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2), s = bh / a.height, T = 640;
    /* across and down on separate elements with separate easings, so the path is an arc */
    w.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], { duration: T, easing: "cubic-bezier(.45,0,.25,1)", fill: "forwards" });
    const fa = f.animate([
      { transform: "translateY(0) scale(1)" },
      { transform: `translateY(${Math.min(-36, dy * 0.15 - 56)}px) scale(${(0.7 + 0.3 * s).toFixed(3)})`, offset: 0.36 },
      { transform: `translateY(${dy}px) scale(${s.toFixed(3)})` }
    ], { duration: T, easing: "cubic-bezier(.33,0,.25,1)", fill: "forwards" });
    to.animate([{ opacity: 0 }, { opacity: 0, offset: 0.9 }, { opacity: 1 }], { duration: T + 60 });
    const finish = () => { w.remove(); if (then) then(); };
    fa.onfinish = finish; fa.oncancel = finish;
  }
  function pick(btn, on, id) {
    if (!moving() || !btn || typeof btn.getBoundingClientRect !== "function") return;
    buzz(on ? 10 : 5);
    if (!on) return;
    const img = btn.getElementsByTagName("img")[0]; if (!img) return;
    const r = img.getBoundingClientRect();
    mist(r.left + r.width / 2, r.top + r.height * 0.12, 26);
    const tray = doc.getElementById("tray"); let to = null;
    if (tray) for (const c of tray.children) if (c.getAttribute("data-tray") === id) to = c;
    if (to) fly(img, to, () => {
      const go = doc.getElementById("qgo");
      if (go && go.animate) go.animate([{ transform: "scale(1)" }, { transform: "scale(1.045)" }, { transform: "scale(1)" }], { duration: 340, easing: "cubic-bezier(.34,1.56,.64,1)" });
    });
  }

  /* fn runs once el is in view (the counts count up where they are read); at once without motion */
  function whenSeen(el, fn) {
    if (!el) return;
    if (!moving() || typeof IntersectionObserver !== "function") { fn(); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold: 0.4 });
    io.observe(el);
  }

  return { paint, patch, pick, tap, chosen, whenSeen, moving };
})();
