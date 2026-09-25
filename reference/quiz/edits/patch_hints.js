/* One-line explanations for the note-picker cards whose names most visitors will not know. */
const fs = require("fs");
process.chdir("C:/Users/malha/Desktop/Webapps/perfume-profiler");
const HINTS = {
  bergamot: ["A bitter citrus: the scent of Earl Grey tea.", "حمضيات مرّة عطرية، وهي رائحة شاي إيرل غراي."],
  juniper: ["The fresh, piney berries of the juniper tree.", "ثمار شجرة العرعر: منعشة كرائحة الصنوبر."],
  cypress: ["Evergreen needles and resin, like a pine forest.", "إبر الأشجار دائمة الخضرة وراتنجها، كرائحة غابة صنوبر."],
  sea_notes: ["Salty sea air and cool water, as in blue sport scents.", "هواء البحر المالح والماء البارد، كما في العطور الزرقاء الرياضية."],
  fig: ["Green fig leaf and the milky fruit.", "ورق التين الأخضر وثمرته الحليبية."],
  sea_salt: ["A dry, salty note, like skin after a swim.", "ملوحة جافة كرائحة البشرة بعد السباحة."],
  geranium: ["A green, leafy flower between rose and mint.", "زهرة ورقية خضراء، رائحتها بين الورد والنعناع."],
  tuberose: ["A heavy, creamy white flower, sweeter than jasmine.", "زهرة بيضاء ثقيلة كريمية، أحلى من الياسمين."],
  violet: ["A soft, powdery, sweet flower.", "زهرة بودرية حلوة، أنعم من الورد."],
  lily_of_the_valley: ["A small white flower with a clean, fresh smell, like fine soap.", "زهرة بيضاء صغيرة رائحتها نظيفة منعشة كالصابون الفاخر."],
  ylang_ylang: ["A creamy tropical yellow flower, sweet with a hint of banana.", "زهرة استوائية صفراء كريمية حلوة، فيها لمحة موز."],
  peony: ["A soft pink flower, fresh and lightly rosy.", "زهرة وردية ناعمة، منعشة وفيها لمسة ورد خفيفة."],
  freesia: ["A light, fresh flower with a fruity touch.", "زهرة خفيفة منعشة فيها لمسة فاكهية."],
  magnolia: ["A large creamy white flower with a lemony freshness.", "زهرة بيضاء كبيرة كريمية فيها انتعاش ليموني."],
  gardenia: ["A rich, creamy white flower, close to jasmine.", "زهرة بيضاء غنية كريمية، قريبة من الياسمين."],
  blackcurrant: ["A tart dark berry with a sharp green edge.", "توت داكن حامض فيه حدّة خضراء."],
  raspberry: ["A sweet and tart red berry.", "توت أحمر حلو حامض."],
  praline: ["Caramelised nuts, like a hazelnut sweet.", "مكسرات مكرملة، كحلوى البندق."],
  rum: ["A dark sweet note, like burnt sugar and raisins.", "نفحة حلوة داكنة كالسكر المحروق والزبيب."],
  pink_pepper: ["Pink berries, fresh and lightly spicy, softer than black pepper.", "حبات وردية منعشة حادة قليلاً، أخف من الفلفل الأسود."],
  sage: ["The herb of sage tea: dry and aromatic.", "عشبة شاي المريمية: جافة عطرية."],
  rosemary: ["A kitchen herb that smells a little like pine.", "عشبة مطبخ عطرية، في رائحتها شيء من الصنوبر."],
  sandalwood: ["A soft, creamy, milky wood.", "خشب ناعم كريمي حليبي."],
  cedar: ["A dry wood, like pencil shavings.", "خشب جاف كبُرادة أقلام الرصاص."],
  rosewood: ["A light wood with a rosy, peppery touch.", "خشب خفيف فيه لمسة وردية حارة."],
  lavender: ["A purple herb, fresh and clean, as in lavender soap.", "عشبة بنفسجية منعشة نظيفة، كرائحة صابون اللافندر."],
  caraway: ["A warm seed spice, close to cumin and anise.", "بذور متبّلة دافئة، قريبة من الكمون واليانسون."]
};
let s = fs.readFileSync("site/js/data.js", "utf8");
const q = x => x.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
for (const [id, [en, ar]] of Object.entries(HINTS)) {
  const re = new RegExp(`\\{ id: "${id}", en: "[^"]*", ar: "[^"]*" \\}`);
  const m = s.match(re);
  if (!m) throw new Error("card without a plain entry (already hinted, or missing): " + id);
  if (s.split(m[0]).length !== 2) throw new Error("not unique: " + id);
  s = s.replace(m[0], m[0].replace(/ \}$/, `,\n          hint_en: "${q(en)}", hint_ar: "${q(ar)}" }`));
}
fs.writeFileSync("site/js/data.js", s);
console.log(Object.keys(HINTS).length, "hints added");
