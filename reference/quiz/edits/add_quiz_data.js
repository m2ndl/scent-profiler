/* E6: adds QUIZ.notePicker and QUIZ.taste to site/js/data.js after QUIZ.testers. Exact match; fails on a second run. */
const fs = require("fs");
const F = "C:/Users/malha/Desktop/Webapps/perfume-profiler/site/js/data.js";
const src = fs.readFileSync(F, "utf8");
const old = `      { id: "uomobornroma", family: "vanilla_gourmand" }
    ]
  };
`;
const add = `      { id: "uomobornroma", family: "vanilla_gourmand" }
    ],
    /* The note picker: four screens of single notes people recognise. en is the word passed to
       PP_MAP.famsForNote; the screen titles are in the page's strings. */
    notePicker: [
      { id: "fresh", notes: [
        { id: "lemon", en: "lemon", ar: "ليمون" },
        { id: "bergamot", en: "bergamot", ar: "برغموت" },
        { id: "grapefruit", en: "grapefruit", ar: "جريب فروت" },
        { id: "orange", en: "orange", ar: "برتقال" },
        { id: "mint", en: "mint", ar: "نعناع" },
        { id: "lavender", en: "lavender", ar: "لافندر" },
        { id: "tea", en: "tea", ar: "شاي" },
        { id: "sea_notes", en: "sea notes", ar: "نفحات بحرية" },
        { id: "ginger", en: "ginger", ar: "زنجبيل" }
      ] },
      { id: "flowers", notes: [
        { id: "rose", en: "rose", ar: "ورد" },
        { id: "jasmine", en: "jasmine", ar: "ياسمين" },
        { id: "orange_blossom", en: "orange blossom", ar: "زهر البرتقال" },
        { id: "iris", en: "iris", ar: "سوسن",
          hint_en: "Soft and powdery, like face powder or lipstick.", hint_ar: "ناعم بودري، كبودرة الوجه أو أحمر الشفاه." },
        { id: "peach", en: "peach", ar: "خوخ" },
        { id: "apple", en: "apple", ar: "تفاح" },
        { id: "pineapple", en: "pineapple", ar: "أناناس" },
        { id: "coconut", en: "coconut", ar: "جوز هند" },
        { id: "lily_of_the_valley", en: "lily of the valley", ar: "زنبق الوادي" }
      ] },
      { id: "spices", notes: [
        { id: "cardamom", en: "cardamom", ar: "هيل" },
        { id: "saffron", en: "saffron", ar: "زعفران" },
        { id: "cinnamon", en: "cinnamon", ar: "قرفة" },
        { id: "pink_pepper", en: "pink pepper", ar: "فلفل وردي" },
        { id: "vanilla", en: "vanilla", ar: "فانيلا" },
        { id: "caramel", en: "caramel", ar: "كراميل" },
        { id: "honey", en: "honey", ar: "عسل" },
        { id: "coffee", en: "coffee", ar: "قهوة" },
        { id: "tonka", en: "tonka", ar: "تونكا",
          hint_en: "A warm, sweet bean that smells of almond and hay.", hint_ar: "حبة دافئة حلوة رائحتها كاللوز والقش." }
      ] },
      { id: "woods", notes: [
        { id: "oud", en: "oud", ar: "عود" },
        { id: "sandalwood", en: "sandalwood", ar: "صندل" },
        { id: "cedar", en: "cedar", ar: "خشب الأرز" },
        { id: "vetiver", en: "vetiver", ar: "فيتيفر",
          hint_en: "An earthy root with a dry, slightly smoky freshness.", hint_ar: "جذر ترابي فيه انتعاش جاف ومدخن قليلاً." },
        { id: "patchouli", en: "patchouli", ar: "باتشولي",
          hint_en: "Earthy and dark, like damp soil; common in sweet perfumes.", hint_ar: "ترابي داكن كالتربة الرطبة؛ شائع في العطور الحلوة." },
        { id: "amber", en: "amber", ar: "عنبر" },
        { id: "frankincense", en: "frankincense", ar: "لبان" },
        { id: "leather", en: "leather", ar: "جلد" },
        { id: "tobacco", en: "tobacco", ar: "تبغ" },
        { id: "musk", en: "musk", ar: "مسك" },
        { id: "oakmoss", en: "oakmoss", ar: "طحلب البلوط",
          hint_en: "Damp, earthy tree moss with a slightly bitter edge.", hint_ar: "طحلب شجري رطب ترابي فيه مرارة خفيفة." },
        { id: "ambergris", en: "ambergris", ar: "عنبر رمادي",
          hint_en: "Salty, warm and skin-like; made synthetically today (Ambroxan).", hint_ar: "مالح دافئ يشبه رائحة الجلد؛ يُصنع اليوم صناعياً (أمبروكسان)." }
      ] }
    ],
    /* "Sweet or bitter": the families each side moves and how much. "bitter" adds +1 to the bitter side and
       -1 to the sweet side, each scaled by its weight; "sweet" does the reverse. */
    taste: {
      sweet: { vanilla_gourmand: .8, fruity_sweet: .6, tonka_coumarin: .5, amber_resin: .4, tobacco_honey: .4 },
      bitter: { green_herbal: .7, vetiver: .7, citrus_fresh: .5, oakmoss_chypre: .5, incense_resin: .4, leather_smoky: .3 }
    }
  };
`;
const n = src.split(old).length - 1;
if (n !== 1) throw new Error("expected one match, found " + n);
fs.writeFileSync(F, src.replace(old, add));
console.log("written");
