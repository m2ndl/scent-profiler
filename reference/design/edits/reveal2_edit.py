"""One-off edit: the card's tiles fit above its footer; a short reveal sorts the visitor's own bottles into kept and
turned before the result appears (skippable, once per visit, off for reduced motion)."""
p = "C:/Users/malha/Desktop/Webapps/perfume-profiler/site/js/quiz.js"
s = open(p, encoding="utf-8").read()

def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:70])
    s = s.replace(a, b)

# the card's tiles: shorter, so they end above the footer band
rep('''x.roundRect(left, y, cw, 360, 26) : x.rect(left, y, cw, 360)''', '''x.roundRect(left, y, cw, 324, 26) : x.rect(left, y, cw, 324)''')
rep('''const s2 = 210,''', '''const s2 = 186,''')
rep('''        const shown2 = lines.slice(0, 2); shown2.forEach((l, k) => x.fillText(l, left + cw / 2, y + 272 + k * 36));
        x.font = `500 24px ${body}`; x.fillStyle = "#816D5D"; x.fillText(pk.P.house, left + cw / 2, y + 272 + shown2.length * 36 + 2);''',
    '''        const shown2 = lines.slice(0, 2); shown2.forEach((l, k) => x.fillText(l, left + cw / 2, y + 244 + k * 34));
        x.font = `500 24px ${body}`; x.fillStyle = "#816D5D"; x.fillText(pk.P.house, left + cw / 2, y + 244 + shown2.length * 34 + 2);''')
rep('''      y += 360;
    }''', '''      y += 324;
    }''')

# strings
rep('      palate: "Your palate", funnel:',
    '      reading: "Reading your bottles", kept: "You kept", turned: "Turned on you", skip: "Show my result",\n      palate: "Your palate", funnel:')
rep('      palate: "ذائقتك", funnel:',
    '      reading: "نقرأ عطورك", kept: "أبقيتها", turned: "انقلبت عليك", skip: "اعرض النتيجة",\n      palate: "ذائقتك", funnel:')

# the reveal
rep("  /* ---------- the share card: a 1080 x 1350 image", r'''  /* ---------- the reveal: the visitor's bottles sort into kept and turned, then the result arrives ---------- */
  let revealed = false, revealTimer = null;
  const stillMotion = () => { try { return !window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return true; } };
  /* a rated bottle is kept when every stage it has is 0 or above and one is above 0, turned when any stage is below 0 */
  function sortedBottles() {
    const kept = [], turned = [];
    for (const id of Object.keys(ratings).filter(hasStage)) {
      const r = ratings[id], vals = STAGES.map(st => r[st]).filter(v => v != null);
      if (vals.some(v => v < 0)) turned.push(id); else if (vals.some(v => v > 0)) kept.push(id);
    }
    return { kept: kept.slice(0, 6), turned: turned.slice(0, 6) };
  }
  function revealHtml(b) {
    let k = 0;
    const col = (ids, label, cls) => `<div class="qsort ${cls}"><div class="qsort-k">${esc(label)}</div><div class="qsort-bottles">${ids.map(id => {
      const P = resolve(id); return P ? `<span class="qsort-b" style="--i:${k++}">${imgTag(P)}</span>` : ""; }).join("")}</div></div>`;
    return `<div class="qreveal-intro" data-skipintro="1" role="status"><p class="qreveal-read">${esc(t().reading)}</p>
      <div class="qsorts">${col(b.kept, t().kept, "kept")}${col(b.turned, t().turned, "turned")}</div>
      <button type="button" class="qlink" data-skipintro="1">${esc(t().skip)}</button></div>`;
  }
  function showResult() { clearTimeout(revealTimer); revealTimer = null; revealed = true; render(); }

''')

# render: the first time the result is reached, the reveal plays first
rep('''    host.innerHTML = (screens[step] || resultHtml)();
    if (!screens[step]) countUp();
  }''',
'''    if (!screens[step] && !revealed) {
      const b = sortedBottles();
      if (!stillMotion() && b.kept.length + b.turned.length >= 2 && typeof setTimeout === "function") {
        host.innerHTML = revealHtml(b);
        revealTimer = setTimeout(showResult, 1500 + 110 * (b.kept.length + b.turned.length));
        return;
      }
      revealed = true;
    }
    host.innerHTML = (screens[step] || resultHtml)();
    if (!screens[step]) countUp();
  }''')

# a tap skips it
rep('''    if (d.sharecard) { shareCard(); return; }''',
    '''    if (d.skipintro) { showResult(); return; }
    if (d.sharecard) { shareCard(); return; }''')
open(p, "w", encoding="utf-8", newline="\n").write(s)
print("ok")
