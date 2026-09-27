async (page) => {
  /* A: the page as shipped (patched in place, view transitions). B: the same page with window.PP_MOTION_OFF, redrawn
     plainly. Both are walked through the same drawn buttons; after every step the quiz columns must be equal nodes. */
  const browser = page.context().browser();
  /* one walk loses three bottle photos, so the drawn-bottle fallback is patched too */
  const walks = [{ seed: 11, lang: 'en', steps: 70 }, { seed: 23, lang: 'ar', steps: 70 }, { seed: 37, lang: 'en', steps: 70 }, { seed: 41, lang: 'ar', steps: 70 }, { seed: 53, lang: 'en', steps: 70, abort: ['yara', 'sauvageedp', 'khamrah', 'eros'] }];
  const report = [];
  for (const W of walks) {
    const mk = async off => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
      await ctx.addInitScript(([l, o]) => { try { localStorage.setItem('pp_lang', JSON.stringify(l)); } catch (e) {} if (o) window.PP_MOTION_OFF = true; }, [W.lang, off]);
      for (const id of W.abort || []) await ctx.route('**/img/bottles/' + id + '.webp', r => r.abort());
      const p = await ctx.newPage();
      const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
      await p.goto('http://localhost:8765/?endpoint=http://localhost:8765/api', { waitUntil: 'networkidle' });
      return { ctx, p, errs };
    };
    const A = await mk(false), B = await mk(true);
    let s = W.seed; const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    const settle = async p => { await p.waitForTimeout(80); await p.waitForFunction(() => !document.documentElement.classList.contains('vt') && !document.getElementsByClassName('fxfly').length, null, { timeout: 5000 }); await p.waitForTimeout(40); };
    const diffs = []; let steps = 0; const seen = new Set();
    for (; steps < W.steps; steps++) {
      /* the actions drawn on B's page: buttons with data attributes in the quiz column, and the language buttons */
      const acts = await B.p.evaluate(() => {
        const out = [];
        for (const b of document.getElementById('quiz').getElementsByTagName('button')) {
          const d = Object.entries(b.dataset); if (!d.length || b.disabled || b.dataset.sharecard) continue;
          out.push(d.map(([k, v]) => `[data-${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}="${v}"]`).join(''));
        }
        return out;
      });
      if (!acts.length) break;
      const weight = a => /data-(continue|start|verdict|taste|anosmia|skipintro|skip|none|nskip)=/.test(a) ? 4 : /data-(back)=/.test(a) ? 0.6 : 1;
      let pickLang = rnd() < 0.04, sel = null;
      if (!pickLang) { const tot = acts.reduce((t, a) => t + weight(a), 0); let r = rnd() * tot; for (const a of acts) { r -= weight(a); if (r <= 0) { sel = a; break; } } sel = sel || acts[acts.length - 1]; }
      const target = pickLang ? (await B.p.evaluate(() => document.documentElement.lang)) === 'ar' ? '#lang-en' : '#lang-ar' : `#quiz ${sel}`;
      let missing = '';
      for (const X of [A, B]) { try { await X.p.click(target, { timeout: 3000 }); } catch (e) { missing = (X === A ? 'A' : 'B') + ' lacks ' + target; } await settle(X.p); }
      if (missing) { diffs.push({ step: steps, target, cmp: missing }); break; }
      const htmlB = await B.p.evaluate(() => document.getElementById('quiz').innerHTML);
      const cmp = await A.p.evaluate(html => {
        const live = document.getElementById('quiz').cloneNode(true);
        /* counts wait to be seen before they count up; their end value is in data-count */
        for (const el of live.getElementsByTagName('b')) if (/^qc-/.test(el.id)) el.textContent = el.getAttribute('data-count');
        const tp = document.createElement('template'); tp.innerHTML = html;
        const want = document.createElement('div'); want.appendChild(tp.content);
        const a = Array.from(live.childNodes), b = Array.from(want.childNodes);
        if (a.length !== b.length) return 'child count ' + a.length + ' vs ' + b.length;
        for (let i = 0; i < a.length; i++) if (!a[i].isEqualNode(b[i])) {
          /* find the first differing leaf to report */
          const walk = (x, y, path) => {
            if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) return path + ' node ' + x.nodeName + '/' + y.nodeName;
            if (x.nodeType === 3) return x.nodeValue === y.nodeValue ? null : path + ' text "' + x.nodeValue.slice(0, 60) + '" vs "' + y.nodeValue.slice(0, 60) + '"';
            if (x.nodeType === 1) {
              const ax = Array.from(x.attributes).map(t => t.name + '=' + t.value).sort().join(' '), ay = Array.from(y.attributes).map(t => t.name + '=' + t.value).sort().join(' ');
              if (ax !== ay) return path + ' attrs [' + ax.slice(0, 160) + '] vs [' + ay.slice(0, 160) + ']';
              if (x.childNodes.length !== y.childNodes.length) return path + ' children ' + x.childNodes.length + ' vs ' + y.childNodes.length;
              for (let j = 0; j < x.childNodes.length; j++) { const r = walk(x.childNodes[j], y.childNodes[j], path + '>' + x.nodeName + (x.className && x.className.baseVal === undefined ? '.' + x.className : '')); if (r) return r; }
            }
            return null;
          };
          return walk(a[i], b[i], '') || 'unequal (no leaf found)';
        }
        return '';
      }, htmlB);
      const chrome = await Promise.all([A, B].map(X => X.p.evaluate(() => [document.documentElement.lang, document.documentElement.dir, document.getElementById('qprogress').hidden, document.getElementById('qprogress').getAttribute('style'), document.getElementById('nav-profiler').textContent, document.getElementById('quiz').getAttribute('data-step')].join('|'))));
      const step = await B.p.evaluate(() => document.getElementById('quiz').getAttribute('data-step'));
      seen.add(step);
      if (cmp || chrome[0] !== chrome[1]) { diffs.push({ step: steps, target, screen: step, cmp, chrome: chrome[0] === chrome[1] ? '' : chrome }); if (diffs.length > 3) break; }
    }
    report.push({ walk: W.seed + ':' + W.lang, steps, screens: [...seen].join(','), diffs, errsA: A.errs, errsB: B.errs });
    await A.ctx.close(); await B.ctx.close();
  }
  return report;
}
