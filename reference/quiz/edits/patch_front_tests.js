const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (f, pairs) => {
  let s = fs.readFileSync(f, "utf8");
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error(f + ": no match " + a.slice(0, 70)); s = s.split(a).join(b); }
  fs.writeFileSync(f, s);
};
edit("tests/quiz.test.js", [
  ["/* The quiz page (site/quiz.html) under the stub browser", "/* The quiz, the front page (site/index.html), under the stub browser"],
  ['const quizScripts = scriptsOf("quiz.html"), appScripts = scriptsOf("index.html");', 'const quizScripts = scriptsOf("index.html"), appScripts = scriptsOf("profile.html");'],
  ['test("quiz.html loads its scripts in order', 'test("the front page (the quiz) loads its scripts in order'],
  ['fs.readFileSync(path.join(SITE, "quiz.html"), "utf8")', 'fs.readFileSync(path.join(SITE, "index.html"), "utf8")'],
  ['/href="index\\.html#sec-profile">See the full profile</', '/href="profile\\.html#sec-profile">See the full profile</'],
  ['href="index\\\\.html\\\\?add=${x.id}">Rate it when you have worn it<', 'href="profile\\\\.html\\\\?add=${x.id}">Rate it when you have worn it<']
]);
edit("tests/page.test.js", [
  ["/* The page under a stub browser (lib/dom.js), loaded exactly as site/index.html loads it:", "/* The profile page (site/profile.html) under a stub browser (lib/dom.js), loaded exactly as the page loads it:"],
  ['const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");', 'const html = fs.readFileSync(path.join(SITE, "profile.html"), "utf8");'],
  ['quizScripts = scriptsOf(fs.readFileSync(path.join(SITE, "quiz.html"), "utf8"));', 'quizScripts = scriptsOf(fs.readFileSync(path.join(SITE, "index.html"), "utf8"));'],
  ['test("scripts in index.html load in order', 'test("scripts in profile.html load in order'],
  ['<p class="hint"><a href="quiz\\.html">Also uses 4 answers from the quiz', '<p class="hint"><a href="index\\.html">Also uses 4 answers from the quiz']
]);
console.log("ok");
