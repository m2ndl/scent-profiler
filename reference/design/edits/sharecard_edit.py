"""One-off edit: a share card for the quiz result, drawn on a canvas and handed to the phone's share sheet."""
p = "C:/Users/malha/Desktop/Webapps/perfume-profiler/site/js/quiz.js"
s = open(p, encoding="utf-8").read()

def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:70])
    s = s.replace(a, b)

rep('      how: "How we worked this out", picksLede:',
    '      share: "Share my profile", shareMade: "Saved as an image", shareFail: "Your browser could not make the image",\n'
    '      card: { title: "My scent profile", drawn: { likely: "Drawn to", possible: "Probably drawn to" }, breaker: { likely: "My deal-breaker", possible: "Possible deal-breaker" }, picks: "Next to try", tagline: "Find what you hate before you buy" },\n'
    '      how: "How we worked this out", picksLede:')
rep('      how: "كيف توصّلنا إلى هذا", picksLede:',
    '      share: "شارك ذائقتك", shareMade: "حُفظت صورة", shareFail: "تعذّر على المتصفح صنع الصورة",\n'
    '      card: { title: "ذائقتي العطرية", drawn: { likely: "أنجذب إلى", possible: "على الأرجح أنجذب إلى" }, breaker: { likely: "يفسد العطر عليّ", possible: "قد يفسد العطر عليّ" }, picks: "أجرّبها بعد ذلك", tagline: "اعرف ما تكرهه قبل أن تشتري" },\n'
    '      how: "كيف توصّلنا إلى هذا", picksLede:')

# the share button sits right under the picks
rep('''      ${tasteCardHtml(prof, ids)}${recs}${anos}''',
    '''      ${tasteCardHtml(prof, ids)}${recs}<div class="qshare"><button type="button" class="btn" data-sharecard="1">${esc(t().share)}</button></div>${anos}''')

# the click
rep('''    if (d.event) { const [kind, id] = d.event.split(":");''',
    '''    if (d.sharecard) { shareCard(); return; }
    if (d.event) { const [kind, id] = d.event.split(":");''')

# the drawing, before resultHtml
rep("  function resultHtml() {\n", r'''  /* ---------- the share card: a 1080 x 1350 image of the taste card and the three picks ---------- */
  function loadImg(src) {
    return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  }
  async function drawCard() {
    const W = 1080, H = 1350, M = 72, rtl = lang === "ar";
    const disp = rtl ? '"Noto Naskh Arabic", serif' : '"Fraunces", Georgia, serif', body = '"IBM Plex Sans Arabic", sans-serif';
    try { await Promise.all([`600 72px ${disp}`, `600 34px ${body}`, `500 30px ${body}`].map(f => document.fonts.load(f))); } catch (e) { /* draw with what is there */ }
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"); if (!x) return null;
    const gold = x.createLinearGradient(0, 0, W, 0);
    [["0", "#B8862A"], [".3", "#F2D68A"], [".5", "#D4A94A"], [".65", "#FBECB8"], ["1", "#A8781F"]].forEach(([o, col]) => gold.addColorStop(+o, col));
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#F6E8D0"); bg.addColorStop(1, "#EFDBBD");
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const glow = x.createRadialGradient(W * .15, 220, 0, W * .15, 220, 520); glow.addColorStop(0, "rgba(240,177,53,.28)"); glow.addColorStop(1, "rgba(240,177,53,0)");
    x.fillStyle = glow; x.fillRect(0, 0, W, H);
    const band = (y, h) => { const g = x.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "#3A2718"); g.addColorStop(1, "#1E130C"); x.fillStyle = g; x.fillRect(0, y, W, h); };
    band(0, 128); x.fillStyle = gold; x.fillRect(0, 128, W, 6);
    band(H - 96, 96); x.fillStyle = gold; x.fillRect(0, H - 96, W, 6);
    x.direction = rtl ? "rtl" : "ltr"; x.textBaseline = "alphabetic";
    const at = (px) => rtl ? W - px : px;
    const text = (str, px, y, font, fill, align) => { x.font = font; x.fillStyle = fill; x.textAlign = align || (rtl ? "right" : "left"); x.fillText(str, at(px), y); };
    /* the header band: the site's name in gold */
    text(t().brand, M, 84, `600 50px ${disp}`, gold);
    /* the title */
    text(t().card.title, M, 262, `600 76px ${disp}`, "#2A1B11");
    x.fillStyle = gold; x.fillRect(rtl ? W - M - 120 : M, 290, 120, 6);
    const prof = computeProfile();
    const good = byStrength(prof, ["goodLikely", "goodPossible"]).slice(0, 3), bad = byStrength(prof, ["badLikely", "badPossible"]).slice(0, 2);
    let y = 372;
    const chipRow = (fams, fill, ink) => {
      x.font = `600 36px ${body}`; let cx = M;
      for (const f of fams) {
        const label = famShort(f), w = x.measureText(label).width + 64;
        if (cx + w > W - M && cx > M) { cx = M; y += 84; }
        const left = rtl ? W - cx - w : cx;
        x.fillStyle = fill; x.beginPath(); x.roundRect ? x.roundRect(left, y, w, 66, 33) : x.rect(left, y, w, 66); x.fill();
        x.fillStyle = ink; x.textAlign = "center"; x.fillText(label, left + w / 2, y + 45);
        cx += w + 14;
      }
      y += 66;
    };
    const section = (fams, kind) => {
      if (!fams.length) return;
      const likely = fams.some(f => prof[f].cls === (kind === "good" ? "goodLikely" : "badLikely"));
      text((kind === "good" ? t().card.drawn : t().card.breaker)[likely ? "likely" : "possible"], M, y, `600 30px ${body}`, kind === "good" ? "#8C5F00" : "#A72A68");
      y += 22; chipRow(fams, kind === "good" ? "#D8ECCE" : "#FFDCE9", kind === "good" ? "#446630" : "#A72A68"); y += 70;
    };
    section(good, "good"); section(bad, "bad");
    /* the three picks */
    const { picks } = recommend(prof);
    if (picks.length) {
      y = Math.max(y, 760);
      text(t().card.picks, M, y, `600 30px ${body}`, "#8C5F00"); y += 26;
      const cw = (W - 2 * M - 2 * 24) / 3;
      const imgs = await Promise.all(picks.map(pk => loadImg(bottleSrc(pk.P) || PLACEHOLDER)));
      picks.forEach((pk, i) => {
        const left = rtl ? W - M - (i + 1) * cw - i * 24 : M + i * (cw + 24);
        x.fillStyle = "rgba(252,248,240,.78)"; x.beginPath(); x.roundRect ? x.roundRect(left, y, cw, 380, 26) : x.rect(left, y, cw, 380); x.fill();
        x.strokeStyle = "rgba(140,95,0,.35)"; x.lineWidth = 2; x.stroke();
        const im = imgs[i]; if (im) { const s2 = 230, r = Math.min(s2 / im.width, s2 / im.height); x.drawImage(im, left + (cw - im.width * r) / 2, y + 20 + (s2 - im.height * r), im.width * r, im.height * r); }
        x.font = `600 30px ${body}`; x.fillStyle = "#2A1B11"; x.textAlign = "center";
        const words = pname(pk.P).split(" "), lines = []; let line = "";
        for (const w2 of words) { const tryL = line ? line + " " + w2 : w2; if (x.measureText(tryL).width > cw - 28 && line) { lines.push(line); line = w2; } else line = tryL; }
        lines.push(line);
        lines.slice(0, 2).forEach((l, k) => x.fillText(l, left + cw / 2, y + 290 + k * 38));
      });
      y += 380;
    }
    /* the footer band: the tagline */
    x.font = `500 32px ${body}`; x.fillStyle = "#F2D68A"; x.textAlign = "center"; x.fillText(t().card.tagline, W / 2, H - 36);
    return new Promise(res => c.toBlob(b => res(b), "image/png"));
  }
  async function shareCard() {
    let blob = null;
    try { blob = await drawCard(); } catch (e) { blob = null; }
    if (!blob) { toast(t().shareFail); return; }
    const file = new File([blob], lang === "ar" ? "ذائقتي-العطرية.png" : "my-scent-profile.png", { type: "image/png" });
    sendEvent("share_card", 0);
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: t().card.title }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast(t().shareMade);
  }

  function resultHtml() {
''')
open(p, "w", encoding="utf-8", newline="\n").write(s)
print("ok")
