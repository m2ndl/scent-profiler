/* E4 fixes 1, 2, 4, 5, 7 to site/js/quiz.js: exact-match replacements, each must match once. */
"use strict";
const fs = require("fs");
const file = "C:/Users/malha/Desktop/Webapps/perfume-profiler/site/js/quiz.js";
let s = fs.readFileSync(file, "utf8");
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`expected 1 match, got ${n}: ${a.slice(0, 80)}`); s = s.replace(a, () => b); };

/* 2 (S2): narrowHint */
rep(`narrowHint: "Each of these has a family you may dislike in its base, without the other suspects. How it ended for you shows which family is the problem.",`,
    `narrowHint: "Each of these has, in its base, a family that may be a deal-breaker for you. Your verdict on it shows whether that family is the problem.",`);
rep(`narrowHint: "في قاعدة كل واحد منها عائلة قد لا تحبها، من دون بقية المشتبه بها. كيف انتهى معك يبيّن أي عائلة هي السبب.",`,
    `narrowHint: "في قاعدة كل واحد منها عائلة قد تكون مُفسدة لك. وجوابك عنه يبيّن إن كانت هذه العائلة هي السبب.",`);

/* 4 (N5) */
rep(`gridQ: "أيّ هذه العطور لبستَه على بشرتك، أو جرّبته على معصمك في متجر؟",`,
    `gridQ: "أيّ هذه العطور لبستها على بشرتك، أو جرّبتها على معصمك في متجر؟",`);
rep(`noFamilies: "لا تبرز أي عائلة بعد. عطور أكثر في صفحة المحلل تُظهرها.",`,
    `noFamilies: "لا تبرز أي عائلة بعد. قيّم عطوراً أخرى في صفحة المحلل لتظهر.",`);
rep(`لترى هل تزعجك تلك العائلة`, `لترى إن كانت تلك العائلة تزعجك`);
rep(`resultH: "What your bottles say",`, `resultH: "Your profile from these bottles",`);
rep(`resultH: "ما تقوله عطورك",`, `resultH: "ملفك من هذه العطور",`);

/* 7: the source word for a shop trial */
rep(`      worn: "from what you wore",\n`, `      worn: "from what you wore", shopTrial: "from a shop trial",\n`);
rep(`      worn: "مما لبسته",\n`, `      worn: "مما لبسته", shopTrial: "من تجربة في متجر",\n`);
rep(`  const hasStage = id => { const r = ratings[id]; return !!r && STAGES.some(s => r[s] != null); };\n`,
    `  const hasStage = id => { const r = ratings[id]; return !!r && STAGES.some(s => r[s] != null); };\n` +
    `  /* A rating whose only set stage is opening at -1 is a shop trial (the shop verdict writes it). */\n` +
    `  const shopTrial = id => { const r = ratings[id]; return !!r && r.opening === -1 && r.heart == null && r.drydown == null; };\n`);
rep(`      const names = [...new Set(v.evidence.map(e => pname(e.perfume)))];
      return \`<div class="verdict \${vCls[v.cls]}"><div class="v-head"><b>\${esc(fam(f))}</b><span class="pill \${pillCls[v.cls]}">\${esc(t().cls[v.cls])}</span></div><div class="hint">\${esc(listJoin(names))} <span class="src">(\${esc(t().worn)})</span></div></div>\`;`,
    `      /* the bottles grouped by source word: worn, or only tried in a shop */
      const groups = {};
      for (const e of v.evidence) { const k = shopTrial(e.perfume.id) ? "shopTrial" : "worn"; (groups[k] = groups[k] || new Set()).add(pname(e.perfume)); }
      const src = Object.entries(groups).map(([k, names]) => \`\${esc(listJoin([...names]))} <span class="src">(\${esc(t()[k])})</span>\`).join(lang === "ar" ? "؛ " : "; ");
      return \`<div class="verdict \${vCls[v.cls]}"><div class="v-head"><b>\${esc(fam(f))}</b><span class="pill \${pillCls[v.cls]}">\${esc(t().cls[v.cls])}</span></div><div class="hint">\${src}</div></div>\`;`);

/* 1 (S1): Enter on a picked or rated name re-adds it instead of looking it up */
rep(`  function search(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    const hit = P => (P.name.toLowerCase().includes(q) || (P.house || "").toLowerCase().includes(q) || (P.ar && P.ar.includes(q)) || P.id.includes(q));
    const open = id => !hasStage(id) && !picked.has(id);`,
    `  /* any: also match picked and rated bottles (the Enter key's check before a lookup) */
  function search(q, any) {
    q = q.trim().toLowerCase(); if (!q) return [];
    const hit = P => (P.name.toLowerCase().includes(q) || (P.house || "").toLowerCase().includes(q) || (P.ar && P.ar.includes(q)) || P.id.includes(q));
    const open = id => any || (!hasStage(id) && !picked.has(id));`);
rep(`      if (e.key === "Enter") { const list = search(e.target.value); if (list.length) addPick(list[0].id); else lookup(e.target.value); }`,
    `      /* a picked or rated name is in the catalogue: addPick keeps it picked or toasts "already rated"; only an unknown name is looked up */
      if (e.key === "Enter") { const v = e.target.value, open = search(v), list = open.length ? open : search(v, true); if (list.length) addPick(list[0].id); else lookup(v); }`);

/* 5 (N4): the anosmia note's link sends n = 0 */
rep(`rel="noopener sponsored" data-event="tester:\${esc(P.id)}">\${esc(lang === "ar" ? t().sampleSA : t().sampleUS)}</a></div>\`;`,
    `rel="noopener sponsored" data-note="1" data-event="tester:\${esc(P.id)}">\${esc(lang === "ar" ? t().sampleSA : t().sampleUS)}</a></div>\`;`);
rep(`    /* a shop link opens in a new tab; the event records which one and its position on the page (0: not a card) */
    if (d.event) { const [kind, id] = d.event.split(":"); sendEvent(d.event, (kind === "tester" ? shown.testers : shown.picks).indexOf(id) + 1); return; }`,
    `    /* a shop link opens in a new tab; the event records which one and its position on the page (0: not a card,
       or the anosmia note's link) */
    if (d.event) { const [kind, id] = d.event.split(":"); sendEvent(d.event, d.note ? 0 : (kind === "tester" ? shown.testers : shown.picks).indexOf(id) + 1); return; }`);

fs.writeFileSync(file, s);
console.log("quiz.js: all replacements applied");
