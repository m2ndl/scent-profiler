/* The quiz becomes the front page (site/index.html) and the profiler "Your profile" (site/profile.html). */
const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, "utf8");
  for (const [a, b] of pairs) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${file}: ${n} matches: ${a.slice(0, 70)}`); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
};
/* the front page: the quiz, with the site's own share tags */
edit("site/index.html", [
  ['<meta property="og:title" content="Bottle quiz · اختبار العطور">',
   '<meta property="og:title" content="Scent Profiler · محلل الذائقة العطرية">\n<meta property="og:description" content="Find what ruins a perfume for you before you buy. اعرف ما يفسد العطر عليك قبل أن تشتري.">'],
  ['<title>Bottle Quiz · Scent Profiler</title>', '<title>Scent Profiler</title>'],
  ['<a href="index.html" id="nav-profiler"></a>', '<a href="profile.html" id="nav-profiler"></a>']
]);
edit("site/profile.html", [
  ['<meta property="og:title" content="Scent Profiler · محلل الذائقة العطرية">', '<meta property="og:title" content="Your profile · Scent Profiler">'],
  ['<title>Scent Profiler</title>', '<title>Your profile · Scent Profiler</title>'],
  ['<a href="quiz.html" id="nav-quiz"></a>', '<a href="index.html" id="nav-quiz"></a>'],
  ['<a class="hero-link" href="quiz.html" id="hero-quiz"></a>', '<a class="hero-link" href="index.html" id="hero-quiz"></a>']
]);
edit("site/articles.html", [
  ['<a class="back" href="index.html" id="back"></a>', '<a class="back" href="profile.html" id="back"></a>'],
  ['<a class="back" href="quiz.html" id="nav-quiz"></a>', '<a class="back" href="index.html" id="nav-quiz"></a>'],
  ['back: "Back to the profiler",', 'back: "Your profile",'],
  ['back: "العودة إلى المحلل",', 'back: "ملفك العطري",']
]);
edit("site/js/app.js", [
  ['<p class="hint"><a href="quiz.html">', '<p class="hint"><a href="index.html">'],
  ['      h1: "Find what ruins a perfume for you.",', '      h1: "Your scent profile",'],
  ['      h1: "اعرف ما يفسد العطر عليك.",', '      h1: "ملفك العطري",'],
  ['      lede: "Rate perfumes you have tried, stage by stage: the opening, the heart and the base. What you like and dislike across all three adds up to your taste, and shows which materials to avoid before you buy.",',
   '      lede: "Rate the perfumes and samples you have tried, stage by stage: the opening, the heart and the base. Each rating sharpens what you like, what ruins a perfume for you, and the samples picked for you.",']
]);
{ /* the Arabic lede, replaced whole */
  let s = fs.readFileSync("site/js/app.js", "utf8");
  const m = s.match(/      lede: "قيّم عطوراً جرّبتها فعلاً[^"]*",/);
  if (!m) throw new Error("Arabic lede");
  s = s.replace(m[0], '      lede: "قيّم العطور والعيّنات التي جرّبتها، مرحلة بمرحلة: الافتتاحية والقلب والقاعدة. كل تقييم يوضّح ما تحبه وما يفسد العطر عليك والعيّنات المختارة لك.",');
  fs.writeFileSync("site/js/app.js", s);
}
edit("site/js/quiz.js", [
  ['/* The quiz page (quiz.html): which well-known bottles', '/* The quiz, the site\'s front page (index.html): which well-known bottles'],
  ['/* Local testing only: http://localhost:8765/quiz.html?endpoint=http://localhost:8765/api', '/* Local testing only: http://localhost:8765/?endpoint=http://localhost:8765/api'],
  ['    return "index.html" + (p.length ? "?" + p.join("&") : "") + (hash || "");', '    return "profile.html" + (p.length ? "?" + p.join("&") : "") + (hash || "");'],
  ['navProfiler: "The profiler", navArticles: "Why drydowns fail",', 'navProfiler: "Your profile", navArticles: "Why drydowns fail",'],
  ['navProfiler: "المحلل", navArticles: "لماذا تفسد القاعدة",', 'navProfiler: "ملفك العطري", navArticles: "لماذا تفسد القاعدة",'],
  ['      startParts: "Four parts:", startGo: "Start",', '      startParts: "Four parts:", startGo: "Start", startBack: "Took the quiz before? Rate the samples you tried",'],
  ['      startParts: "أربعة أجزاء:", startGo: "ابدأ",', '      startParts: "أربعة أجزاء:", startGo: "ابدأ", startBack: "أنهيت الاختبار من قبل؟ قيّم العيّنات التي جرّبتها",'],
  ['    $("brand").setAttribute("href", profilerHref());', '    $("brand").setAttribute("href", "index.html" + (endpointParam ? "?endpoint=" + encodeURIComponent(endpointParam) : ""));'],
  ['      <p class="qsteps-h">${esc(t().startParts)}</p><ol class="qsteps">${t().parts.map((name, i) => `<li><b>${i + 1}</b><span>${esc(name)}</span></li>`).join("")}</ol>\n',
   '      <p class="qsteps-h">${esc(t().startParts)}</p><ol class="qsteps">${t().parts.map((name, i) => `<li><b>${i + 1}</b><span>${esc(name)}</span></li>`).join("")}</ol>\n      <p class="qreturn"><a href="${esc(profilerHref())}">${esc(t().startBack)}</a></p>\n']
]);
edit("site/js/data.js", [['/* The quiz page (quiz.html):', '/* The quiz (the front page, index.html):']]);
edit("site/site.css", [['.qcompare:empty { display: none; }\n',
  '.qcompare:empty { display: none; }\n/* the start screen\'s link for a returning visitor */\n.qreturn { margin: 18px 2px 0; font-size: 15px; }\n.qreturn a { font-weight: 500; }\n']]);
console.log("ok");
