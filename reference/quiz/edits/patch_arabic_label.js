const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const edit = (f, pairs) => {
  let s = fs.readFileSync(f, "utf8");
  for (const [a, b, n] of pairs) { const c = s.split(a).length - 1; if (c !== (n || 1)) throw new Error(`${f}: ${c} matches: ${a.slice(0, 60)}`); s = s.split(a).join(b); }
  fs.writeFileSync(f, s);
};
/* the articles' name: plain Arabic for "why the drydown ruins it" */
edit("site/js/app.js", [['navArticles: "لماذا تفسد القاعدة"', 'navArticles: "لماذا يتغيّر العطر بعد ساعات"']]);
edit("site/js/quiz.js", [
  ['navArticles: "لماذا تفسد القاعدة"', 'navArticles: "لماذا يتغيّر العطر بعد ساعات"'],
  /* the profiler is "Your profile" now */
  ['ratedToast: "Already rated on the profiler page."', 'ratedToast: "Already rated on your profile."'],
  ['notFound: "Not found. You can add it by name on the profiler page."', 'notFound: "Not found. You can add it by name on your profile."'],
  ['Rating more bottles on the profiler page, especially ones that turned on you, is how one shows up.', 'Rating more bottles on your profile, especially ones that turned on you, is how one shows up.'],
  ['No family stands out yet. More bottles on the profiler page will show one.', 'No family stands out yet. More bottles on your profile will show one.'],
  ['One more bottle gives you three recommendations. Add it on the profiler page.', 'One more bottle gives you three recommendations. Add it on your profile.'],
  ['ratedToast: "قيّمته من قبل في صفحة المحلل."', 'ratedToast: "قيّمته من قبل في ملفك العطري."'],
  ['notFound: "لم نجده. يمكنك إضافته باسمه في صفحة المحلل."', 'notFound: "لم نجده. يمكنك إضافته باسمه في ملفك العطري."'],
  ['تقييم مزيد من العطور في صفحة المحلل، وخاصة التي انقلبت عليك، هو ما يُظهره.', 'تقييم مزيد من العطور في ملفك العطري، وخاصة التي انقلبت عليك، هو ما يُظهره.'],
  ['noFamilies: "لا تبرز أي عائلة بعد. قيّم عطوراً أخرى في صفحة المحلل لتظهر."', 'noFamilies: "لا تبرز أي عائلة بعد. قيّم عطوراً أخرى في ملفك العطري لتظهر."'],
  ['oneMore: "عطر واحد آخر يعطيك ثلاثة ترشيحات. أضفه في صفحة المحلل."', 'oneMore: "عطر واحد آخر يعطيك ثلاثة ترشيحات. أضفه في ملفك العطري."']
]);
edit("site/articles.html", [
  ['<meta property="og:title" content="Why the drydown ruins it · لماذا تفسد القاعدة العطر">', '<meta property="og:title" content="Why the drydown ruins it · لماذا يتغيّر العطر بعد ساعات؟">'],
  ['h1: "لماذا تفسد القاعدة العطر",', 'h1: "لماذا يتغيّر العطر بعد ساعات؟",'],
  ['foot: "كُتبت لأجل المحلل. لا روابط عمولة في هذه الصفحة."', 'foot: "كُتبت لأجل محلل الذائقة العطرية. لا روابط عمولة في هذه الصفحة."']
]);
console.log("ok");
