/* A minimal stand-in for the browser, enough to run the page scripts under Node: element stubs by id,
   localStorage and sessionStorage, a recorded fetch and sendBeacon with canned answers, page hiding, and
   timers that run only when flushed. Every element the page touches is kept, so a snapshot shows
   everything the page wrote. Options: localStorage, navLang, endpoint, respond, beacon (false: none),
   search (a query string such as "?add=yara", joined with the endpoint's when both are given).
   history.replaceState is recorded in page.history. */
"use strict";
const vm = require("vm");

function createPage(opts) {
  opts = opts || {};
  const els = new Map();
  const register = el => { if (el._id) els.set(el._id, el); };
  function makeElement(id) {
    const el = {
      _id: id || null, innerHTML: "", textContent: "", placeholder: "", value: "", hidden: false, className: "", type: "",
      dataset: {}, attrs: {}, listeners: {}, style: {}, removed: false, after_: null,
      classList: { set: new Set(), add(c) { this.set.add(c); }, remove(c) { this.set.delete(c); }, contains(c) { return this.set.has(c); } },
      setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
      addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
      insertAdjacentHTML(pos, html) { if (pos !== "beforeend") throw new Error("stub supports beforeend only"); this.innerHTML += html; },
      appendChild(child) { (this.children = this.children || []).push(child); return child; },
      after(node) { this.after_ = node._id || "(element)"; }, remove() { this.removed = true; if (this._id) els.delete(this._id); },
      querySelector(sel) { const m = sel === "[data-add]" && /data-add="([^"]*)"/.exec(this.innerHTML); return m ? { dataset: { add: m[1] } } : null; },
      scrollIntoView() {}
    };
    Object.defineProperty(el, "id", { get() { return el._id || ""; }, set(v) { el._id = v; register(el); }, enumerable: false });
    return el;
  }
  const byId = id => { if (!els.has(id)) els.set(id, makeElement(id)); return els.get(id); };
  const docListeners = {};
  const document = {
    documentElement: { lang: "en", dir: "ltr" },
    visibilityState: "visible",
    getElementById: byId,
    addEventListener(type, fn) { (docListeners[type] = docListeners[type] || []).push(fn); },
    querySelector() { return null; },
    createElement() { return makeElement(null); },
    createRange() { return { selectNodeContents() {} }; }
  };
  const makeStorage = init => {
    const m = new Map(Object.entries(init || {}));
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }, dump: () => Object.fromEntries(m) };
  };
  const localStorage = makeStorage(opts.localStorage);
  const sessionStorage = makeStorage();
  const calls = [], clipboard = [];
  const fetch = (url, o) => {
    const body = o && o.body ? JSON.parse(o.body) : null;
    if (body) delete body.ts;                                  /* the send time differs run to run */
    const call = { url, method: (o && o.method) || "GET", body };
    if (o && o.keepalive) call.keepalive = true;
    calls.push(call);
    const answer = opts.respond ? opts.respond(url, body) : {};
    return Promise.resolve({ json: () => Promise.resolve(JSON.parse(JSON.stringify(answer))) });
  };
  const sendBeacon = (url, data) => {
    const body = JSON.parse(data); delete body.ts;
    calls.push({ url, method: "BEACON", body });
    return true;
  };
  const winListeners = {};
  const history = [];
  const query = [opts.search ? String(opts.search).replace(/^\?/, "") : "", opts.endpoint ? "endpoint=" + encodeURIComponent(opts.endpoint) : ""].filter(Boolean).join("&");
  const timers = new Map(); let nextTimer = 1;
  const sandbox = {
    document, localStorage, sessionStorage, fetch, console, URLSearchParams,
    navigator: Object.assign({ language: opts.navLang || "en-US", clipboard: { writeText: t => { clipboard.push(t); return Promise.resolve(); } } }, opts.beacon === false ? {} : { sendBeacon }),
    addEventListener(type, fn) { (winListeners[type] = winListeners[type] || []).push(fn); },
    location: { hostname: opts.endpoint ? "localhost" : "example.org", pathname: "/", hash: "", search: query ? "?" + query : "" },
    history: { replaceState(state, title, url) { history.push({ state, title, url }); } },
    setTimeout: fn => { const id = nextTimer++; timers.set(id, fn); return id; },
    clearTimeout: id => { timers.delete(id); },
    getSelection: () => ({ removeAllRanges() {}, addRange() {} })
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext("globalThis.window = globalThis;", ctx);

  const page = {
    ctx, sandbox, calls, clipboard, localStorage, history,
    load(scripts) { for (const s of scripts) vm.runInContext(s.code, ctx, { filename: s.filename }); },
    /* as in a browser, a timer that throws does not stop the others; the first error is rethrown at the end */
    flushTimers() {
      const errors = []; let n = 0;
      while (timers.size) { const [id, fn] = timers.entries().next().value; timers.delete(id); try { fn(); } catch (e) { errors.push(e); } if (++n > 1000) throw new Error("timer loop"); }
      if (errors.length) throw errors[0];
    },
    settle() { return new Promise(r => setImmediate(r)); },
    /* the tab is switched away or closed: visibilitychange to hidden, then (when closing) pagehide */
    hide() { document.visibilityState = "hidden"; for (const fn of docListeners.visibilitychange || []) fn({ type: "visibilitychange" }); },
    fire(type) { for (const fn of winListeners[type] || []) fn({ type }); },
    /* a click on a button: an id for the fixed buttons, a dataset for the generated ones */
    click(spec) {
      const b = spec.id ? byId(spec.id) : Object.assign(makeElement(null), { dataset: Object.assign({}, spec.dataset) });
      if (spec.id && spec.dataset) b.dataset = Object.assign({}, spec.dataset);
      const ev = { target: { closest: sel => (sel === "button, a" ? b : null) } };
      for (const fn of docListeners.click || []) fn(ev);
    },
    input(value) { const q = byId("q"); q.value = value; for (const fn of q.listeners.input || []) fn({ target: q }); },
    key(key, value) { const q = byId("q"); if (value != null) q.value = value; for (const fn of q.listeners.keydown || []) fn({ key, target: q }); },
    setValue(id, value) { byId(id).value = value; },
    snapshot() {
      const out = { html: { lang: document.documentElement.lang, dir: document.documentElement.dir }, els: {} };
      for (const id of [...els.keys()].sort()) {
        const e = els.get(id);
        out.els[id] = { innerHTML: e.innerHTML, textContent: e.textContent, placeholder: e.placeholder, value: e.value, hidden: e.hidden, attrs: e.attrs, classes: [...e.classList.set].sort(), after: e.after_ };
      }
      out.storage = localStorage.dump();
      return out;
    }
  };
  return page;
}

module.exports = { createPage };
