/* One-off: rebuilds QUIZ.notePicker in site/js/data.js by rule and prints the table.
   node build_picker.js          print the table only
   node build_picker.js --write  also splice the picker into data.js
   Rules: book = a basic note or odour group in the books; freq = 5+ catalogue perfumes list it (card words);
   cover = a family held at 0.4+ has no other card at 0.5+; gulf = on the owner's Gulf list; kept = rule 4. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/malha/Desktop/Webapps/perfume-profiler";
const { loadSite } = require(ROOT + "/tools/lib/site.js");
const W = loadSite("data", "mapper", "materials", "evidence", "engine");
const D = W.PP_DATA, M = W.PP_MAP, E = W.PP_ENGINE.create(D, M, W.PP_EVIDENCE);

/* [id, en, ar, words counted, rules, extra] ; extra: { fams, hint_en, hint_ar } */
const SCREENS = [
  ["fresh", [
    ["bergamot", "bergamot", "برغموت", ["bergamot"], ""],
    ["lemon", "lemon", "ليمون", ["lemon", "lemon zest"], ""],
    ["mandarin", "mandarin", "يوسفي", ["mandarin", "blood mandarin", "green mandarin"], ""],
    ["grapefruit", "grapefruit", "جريب فروت", ["grapefruit"], ""],
    ["orange", "orange", "برتقال", ["orange", "blood orange", "bitter orange", "sicilian orange"], ""],
    ["juniper", "juniper", "عرعر", ["juniper"], ""],
    ["mint", "mint", "نعناع", ["mint", "peppermint"], "kept"],
    ["violet_leaf", "violet leaf", "ورق البنفسج", ["violet leaf"], "",
      { hint_en: "A green, cucumber-like leaf, not the flower.", hint_ar: "ورقة خضراء رائحتها كالخيار، لا زهرة البنفسج." }],
    ["tea", "tea", "شاي", ["tea", "black tea", "green tea", "oolong tea"], "kept, book",
      { hint_en: "Black or green tea.", hint_ar: "شاي أسود أو أخضر." }],
    ["green_notes", "green notes", "نفحات خضراء", ["green notes", "green leaves"], "book",
      { hint_en: "Cut grass, crushed leaves and galbanum resin: sharp and slightly bitter.", hint_ar: "عشب مقصوص وأوراق مهروسة وراتنج الغالبانوم: حادة ومرّة قليلاً." }],
    ["cypress", "cypress (pine, fir)", "سرو (صنوبر، تنوب)", ["cypress", "pine", "fir resin", "balsam fir"], "book"],
    ["aldehydes", "aldehydes (soapy sparkle)", "ألدهيدات (بريق صابوني)", ["aldehydes"], "cover",
      { hint_en: "A waxy, soapy sparkle at the start of classic florals such as Chanel No. 5.", hint_ar: "بريق شمعي صابوني في بداية العطور الزهرية الكلاسيكية مثل شانيل رقم 5." }],
    ["sea_notes", "sea notes", "نفحات بحرية", ["sea notes", "marine notes", "sea water", "seaweed"], "kept"],
    ["fig", "fig", "تين", ["fig", "fig leaf", "fig tree"], "gulf"],
    ["melon", "melon", "شمام", ["melon", "watermelon", "cucumber"], "book",
      { hint_en: "Watery melon and cucumber freshness.", hint_ar: "انتعاش مائي كالشمام والخيار." }],
    ["sea_salt", "sea salt", "ملح البحر", ["sea salt", "salt"], "gulf"],
    ["petitgrain", "petitgrain", "بيتيتغرين", ["petitgrain"], "book",
      { hint_en: "Leaves and twigs of the bitter-orange tree: a green, woody citrus.", hint_ar: "أوراق وأغصان شجرة البرتقال المر: حمضيات خضراء خشبية." }]
  ]],
  ["flowers", [
    ["jasmine", "jasmine", "ياسمين", ["jasmine", "jasmine sambac", "egyptian jasmine", "water jasmine"], ""],
    ["rose", "rose", "ورد", ["rose", "turkish rose", "may rose", "cristal rose"], ""],
    ["orange_blossom", "orange blossom (neroli)", "زهر البرتقال (نيرولي)", ["orange blossom", "neroli", "tunisian neroli", "african orange flower"], ""],
    ["iris", "iris", "سوسن", ["iris", "orris"], "",
      { hint_en: "Soft and powdery, like face powder or lipstick.", hint_ar: "ناعم بودري، كبودرة الوجه أو أحمر الشفاه." }],
    ["geranium", "geranium", "إبرة الراعي", ["geranium"], ""],
    ["tuberose", "tuberose", "مسك الروم", ["tuberose"], "gulf"],
    ["violet", "violet", "بنفسج", ["violet"], "gulf"],
    ["lily_of_the_valley", "lily of the valley", "زنبق الوادي", ["lily of the valley"], "kept"],
    ["ylang_ylang", "ylang-ylang", "إيلنغ إيلنغ", ["ylang", "ylang-ylang"], "gulf"],
    ["peony", "peony", "فاوانيا", ["peony"], ""],
    ["freesia", "freesia", "فريزيا", ["freesia"], ""],
    ["heliotrope", "heliotrope", "هيليوتروب", ["heliotrope"], "",
      { hint_en: "A powdery flower that smells of almond and vanilla.", hint_ar: "زهرة بودرية رائحتها كاللوز والفانيلا." }],
    ["magnolia", "magnolia", "ماغنوليا", ["magnolia"], ""],
    ["gardenia", "gardenia", "غاردينيا", ["gardenia"], "gulf"],
    ["osmanthus", "osmanthus", "أوسمانثوس", ["osmanthus"], "book",
      { hint_en: "A Chinese flower that smells of apricot and soft leather.", hint_ar: "زهرة صينية رائحتها كالمشمش والجلد الناعم." }],
    ["rose_water", "rose water", "ماء الورد", ["rose water"], "gulf"],
    ["mimosa", "mimosa", "ميموزا", ["mimosa"], "book",
      { hint_en: "A powdery yellow flower with a honeyed, almond-like scent.", hint_ar: "زهرة صفراء بودرية رائحتها كالعسل واللوز." }]
  ]],
  ["fruit", [
    ["vanilla", "vanilla", "فانيلا", ["vanilla", "vanilla orchid", "bourbon vanilla", "black vanilla", "salty vanilla"], ""],
    ["blackcurrant", "blackcurrant", "كشمش أسود", ["blackcurrant", "cassis"], ""],
    ["apple", "apple", "تفاح", ["apple", "green apple", "red apple"], ""],
    ["pear", "pear", "كمثرى", ["pear"], ""],
    ["pineapple", "pineapple", "أناناس", ["pineapple"], ""],
    ["honey", "honey", "عسل", ["honey"], "gulf"],
    ["raspberry", "raspberry", "توت العليق", ["raspberry"], ""],
    ["caramel", "caramel (sugar)", "كراميل (سكر)", ["caramel", "salted caramel", "sugar", "brown sugar", "cane sugar"], "kept"],
    ["coffee", "coffee (chocolate, cocoa)", "قهوة (شوكولاتة، كاكاو)", ["coffee", "cacao", "chocolate", "dark chocolate", "white chocolate"], "kept, gulf"],
    ["peach", "peach", "خوخ", ["peach", "white peach"], "kept"],
    ["praline", "praline", "برالين", ["praline"], ""],
    ["rum", "rum", "رم", ["rum"], "gulf"],
    ["coconut", "coconut", "جوز هند", ["coconut"], "kept"],
    ["plum", "plum", "برقوق", ["plum"], "gulf"],
    ["blackberry", "blackberry", "توت أسود", ["blackberry"], ""],
    ["benzoin", "benzoin", "بنزوين", ["benzoin"], "",
      { hint_en: "A sweet, vanilla-like balsamic resin.", hint_ar: "راتنج بلسمي حلو يشبه الفانيلا (الجاوي)." }],
    ["cherry", "cherry", "كرز", ["cherry", "black cherry", "cherry liqueur"], "gulf"],
    ["milk", "milk", "حليب", ["milk", "almond milk"], "gulf, book",
      { hint_en: "Creamy, milky notes (lactones).", hint_ar: "نفحات كريمية حليبية (لاكتونات)." }],
    ["dried_fruits", "dried fruits (raisin, prune)", "فواكه مجففة (زبيب، برقوق مجفف)", ["dried fruits", "raisin", "prune"], "book"],
    ["dates", "dates", "تمر", ["dates"], "gulf, kept"]
  ]],
  ["spices", [
    ["tonka", "tonka", "تونكا", ["tonka", "roasted tonka"], "",
      { hint_en: "A warm, sweet bean that smells of almond and hay.", hint_ar: "حبة دافئة حلوة رائحتها كاللوز والقش." }],
    ["lavender", "lavender", "لافندر", ["lavender"], ""],
    ["cinnamon", "cinnamon", "قرفة", ["cinnamon"], ""],
    ["saffron", "saffron", "زعفران", ["saffron"], "gulf"],
    ["cardamom", "cardamom", "هيل", ["cardamom"], "gulf"],
    ["pink_pepper", "pink pepper", "فلفل وردي", ["pink pepper"], ""],
    ["pepper", "pepper", "فلفل", ["pepper", "black pepper", "black and white pepper"], "",
      { hint_en: "Black or white pepper.", hint_ar: "فلفل أسود أو أبيض." }],
    ["sage", "sage", "مريمية", ["sage", "clary sage"], ""],
    ["ginger", "ginger", "زنجبيل", ["ginger", "ginger flower"], ""],
    ["nutmeg", "nutmeg", "جوزة الطيب", ["nutmeg"], ""],
    ["almond", "almond", "لوز", ["almond", "bitter almond"], "gulf"],
    ["rosemary", "rosemary", "إكليل الجبل", ["rosemary"], ""],
    ["coriander", "coriander", "كزبرة", ["coriander"], ""],
    ["licorice", "licorice (anise)", "عرقسوس (ينسون)", ["licorice", "anise", "star anise", "tarragon"], "book"],
    ["clove", "clove", "قرنفل", ["clove", "cloves"], "gulf"],
    ["caraway", "caraway", "كراوية", ["caraway"], ""],
    ["cumin", "cumin", "كمون", ["cumin"], "gulf"],
    ["artemisia", "artemisia", "شيح", ["artemisia"], "book",
      { hint_en: "A bitter, silvery desert herb (wormwood).", hint_ar: "عشب صحراوي فضي مرّ، من فصيلة الأفسنتين." }]
  ]],
  ["woods", [
    ["musk", "musk", "مسك", ["musk", "white musk", "chantilly musk"], "gulf",
      { hint_en: "Including clean white musk.", hint_ar: "ومنه المسك الأبيض النظيف." }],
    ["amber", "amber", "عنبر", ["amber", "labdanum", "black amber"], "", { fams: { amber_resin: .9 },
      hint_en: "Warm, sweet and resinous (labdanum); not ambergris.", hint_ar: "راتنجي دافئ حلو (اللبنى)، غير العنبر الرمادي." }],
    ["sandalwood", "sandalwood", "صندل", ["sandalwood"], ""],
    ["patchouli", "patchouli", "باتشولي", ["patchouli"], "",
      { hint_en: "Earthy and dark, like damp soil; common in sweet perfumes.", hint_ar: "ترابي داكن كالتربة الرطبة؛ شائع في العطور الحلوة." }],
    ["cedar", "cedar", "خشب الأرز", ["cedar", "red cedar", "virginia cedar", "moroccan cedar"], ""],
    ["ambroxan", "ambroxan (modern amberwood)", "أمبروكسان (خشب عنبري حديث)", ["ambroxan", "amberwood", "cashmeran"], "",
      { hint_en: "The dry, radiant woody base of Sauvage and Baccarat Rouge 540; also listed as amberwood or cashmeran.",
        hint_ar: "القاعدة الخشبية الجافة المشعّة في سوفاج وباكارات روج 540؛ تُذكر أيضاً باسم خشب عنبري أو كاشميران." }],
    ["vetiver", "vetiver", "فيتيفر", ["vetiver", "red vetiver", "bourbon vetiver", "java vetiver"], "",
      { hint_en: "An earthy root with a dry, slightly smoky freshness.", hint_ar: "جذر ترابي فيه انتعاش جاف ومدخن قليلاً." }],
    ["ambergris", "ambergris", "عنبر رمادي", ["ambergris"], "",
      { hint_en: "Salty, warm and skin-like; made synthetically today (Ambroxan).", hint_ar: "مالح دافئ يشبه رائحة البشرة؛ يُصنع اليوم صناعياً (أمبروكسان)." }],
    ["leather", "leather (suede)", "جلد (شمواه)", ["leather", "suede"], ""],
    ["frankincense", "incense", "لبان", ["incense", "olibanum", "frankincense"], "gulf",
      { hint_en: "Frankincense (olibanum) resin smoke, as in church incense; drier than oud bakhoor.", hint_ar: "دخان راتنج اللبان كبخور الكنائس؛ أجفّ من بخور العود." }],
    ["oud", "oud", "عود", ["oud"], ""],
    ["oakmoss", "oakmoss", "طحلب البلوط", ["oakmoss", "moss"], "",
      { hint_en: "Damp, earthy tree moss with a slightly bitter edge.", hint_ar: "طحلب شجري رطب ترابي فيه مرارة خفيفة." }],
    ["tobacco", "tobacco", "تبغ", ["tobacco", "tobacco leaf"], ""],
    ["birch", "birch", "بتولا", ["birch"], "",
      { hint_en: "Smoky birch tar: campfire smoke and tanned leather.", hint_ar: "قطران البتولا المدخن: دخان الحطب والجلد المدبوغ." }],
    ["skin_musk", "warm skin musk (ambrette)", "مسك الجلد الدافئ (أمبريت)", ["ambrette", "ambrette seeds"], "",
      { hint_en: "A soft, warm musk from ambrette seed that smells like skin.", hint_ar: "مسك ناعم دافئ من بذور الأمبريت، يشبه رائحة البشرة." }],
    ["rosewood", "rosewood", "خشب الورد", ["rosewood", "brazilian rosewood"], ""],
    ["guaiac_wood", "guaiac wood", "خشب الغاياك", ["guaiac wood", "guaiac"], "",
      { hint_en: "A smoky, slightly sweet wood.", hint_ar: "خشب مدخن حلو قليلاً." }],
    ["myrrh", "myrrh", "مُرّ", ["myrrh"], "gulf",
      { hint_en: "A bitter, medicinal resin, often burned with frankincense.", hint_ar: "راتنج مرّ طبي، يُبخَّر غالباً مع اللبان." }],
    ["animalic", "animalic (civet, castoreum)", "حيواني (زباد، قندس)", ["civet", "castoreum"], "cover",
      { hint_en: "Warm fur with a slightly dirty, leathery note; made synthetically today.", hint_ar: "فرو دافئ مع لمسة وسخة أو جلدية؛ يُصنع اليوم صناعياً." }],
    ["oud_oil", "oud oil (hindi oud)", "دهن العود", [], "gulf",
      { hint_en: "Natural oud oil (dehn al oud) from Gulf oud shops: deeper and more animal-like than the oud in most Western perfumes.",
        hint_ar: "دهن العود الطبيعي من محلات العود: أعمق وأكثر حيوانية من العود في أغلب العطور الغربية." }]
  ]]
];

/* catalogue counts: perfumes listing any of a card's words */
const lists = D.PERFUMES.map(P => { const s = new Set(); for (const part of String(P.notes.en).split("/")) for (const w of part.split(",")) { const n = M.norm(w); if (n) s.add(n); } return s; });
const count = words => lists.filter(s => words.some(w => s.has(w))).length;
const famsOf = c => c.fams || M.famsForNote(c.en) || {};
const strong = c => Object.entries(famsOf(c)).filter(([, w]) => w >= 0.5).map(([f, w]) => f + " " + w).join(", ");

const screens = SCREENS.map(([id, cards]) => ({ id, notes: cards.map(([cid, en, ar, words, rules, x]) => Object.assign({ id: cid, en, ar, n: count(words), rules: [count(words) >= 5 ? "freq" : "", rules].filter(Boolean).join(", ") }, x || {}))
  .map((c, i) => Object.assign(c, { order: i })).sort((a, b) => (b.n - a.n) || (a.order - b.order)) }));

const rows = [["screen", "card (en)", "ar", "perfumes", "families at 0.5+", "rule"]];
for (const s of screens) for (const c of s.notes) rows.push([s.id, c.en, c.ar, String(c.n), strong(c) || "(none at 0.5; " + JSON.stringify(famsOf(c)) + ")", c.rules]);
console.log(rows.map(r => "| " + r.join(" | ") + " |").join("\n"));
console.log("cards per screen:", screens.map(s => s.id + " " + s.notes.length).join(", "), "; total", screens.reduce((a, s) => a + s.notes.length, 0));

/* family coverage */
const held = f => E.PERFUMES.some(P => ["opening", "heart", "drydown"].some(st => ((P.stages[st] || {})[f] || 0) >= 0.4));
const all = screens.flatMap(s => s.notes);
for (const f of Object.keys(D.FAMILIES)) {
  const reach = all.filter(c => (famsOf(c)[f] || 0) >= 0.5).map(c => c.id);
  const coverOnly = all.filter(c => (famsOf(c)[f] || 0) >= 0.5 && /cover/.test(c.rules) && !/freq|gulf|kept|book/.test(c.rules));
  if (!reach.length || coverOnly.length || !held(f)) console.log("family", f, "held:", held(f), "cards at 0.5+:", reach.join(" ") || "none");
}
const ids = all.map(c => c.id); if (new Set(ids).size !== ids.length) console.log("DUPLICATE IDS");

if (process.argv.includes("--write")) {
  const q = s => JSON.stringify(s);
  const fam = o => "{ " + Object.entries(o).map(([k, v]) => k + ": " + String(v).replace(/^0\./, ".")) .join(", ") + " }";
  const card = c => {
    let line = `        { id: ${q(c.id)}, en: ${q(c.en)}, ar: ${q(c.ar)}` + (c.fams ? `, fams: ${fam(c.fams)}` : "");
    if (c.hint_en) line += `,\n          hint_en: ${q(c.hint_en)}, hint_ar: ${q(c.hint_ar)}`;
    return line + " }";
  };
  const text = `    /* The note picker: five screens of single notes, each ordered by how many catalogue perfumes list the
       card's word or its synonyms. A card is here when the perfumery books name it as a basic note or odour
       group, when 5 or more catalogue perfumes list it, when a family some perfume holds at 0.4 or more would
       otherwise have no card at 0.5 or more, or when Gulf shoppers know it from daily life. A screen shows ten
       cards and folds the rest behind "More notes". en is the word passed to PP_MAP.famsForNote, which also
       reads a label's part in brackets, unless the entry carries its own fams: on a card, "amber" means
       resinous amber, while in a note list it often hides an Ambroxan-type base. The screen titles are in the
       quiz page's strings. */
    notePicker: [
${screens.map(s => `      { id: ${q(s.id)}, notes: [\n${s.notes.map(card).join(",\n")}\n      ] }`).join(",\n")}
    ],
`;
  const file = path.join(ROOT, "site/js/data.js"), src = fs.readFileSync(file, "utf8");
  const a = src.indexOf("    /* The note picker:"), b = src.indexOf("    /* \"Sweet or bitter\"");
  if (a < 0 || b < a) throw new Error("markers not found");
  fs.writeFileSync(file, src.slice(0, a) + text + src.slice(b));
  console.log("written", file);
}
