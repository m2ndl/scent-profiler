#!/usr/bin/env node
/* Applies the taxonomy changes from reference/audit/taxonomy_audit.md to data.js:
   - four new families (muguet_floral, damascone_fruit, spice_fresh, skin_musk);
   - revised English hints from reference/audit/families_proposed.json, with Arabic hints given here;
   - mechanical split of spicy_warm into warm and fresh spices, decided per stage from the entry's
     own note text (pepper, cardamom, ginger, juniper = fresh; cinnamon, clove, nutmeg, cassia = warm);
   - sage, mint, rosemary and thyme move from green_herbal to lavender_aromatic when a stage's green
     tag rests on them alone;
   - lily of the valley or muguet in a stage's notes adds muguet_floral.
   Edits data.js in place and appends to evidence/applied_changes.jsonl. Run once; a second
   run finds nothing to change. */

const fs = require("fs");
const path = require("path");
const { ROOT: root, SITE, runScript } = require("./lib/site");
const dataPath = path.join(SITE, "js", "data.js");
let src = fs.readFileSync(dataPath, "utf8");
const proposed = JSON.parse(fs.readFileSync(path.join(root, "reference/audit/families_proposed.json"), "utf8"));

/* ---- 1. families block: revised hints and four new families ---- */
const NEW_FAMILIES = {
  muguet_floral: { en: "Lily of the valley (muguet)", ar: "زنبق الوادي (موغيه)", hint_en: "Fresh, sweet lily-of-the-valley floral, light and clean rather than heavy.", hint_ar: "زهري خفيف نظيف يشبه زنبق الوادي، حلو وطازج لا ثقيل." },
  damascone_fruit: { en: "Rose ketones (dried fruit)", ar: "كيتونات الورد (فواكه مجففة)", hint_en: "Jammy dried-fruit smell of plum, raisin and apple with a rosy note, common in many modern florals and men's scents.", hint_ar: "رائحة مربّى الفواكه المجففة (برقوق، زبيب، تفاح) مع لمسة ورد، شائعة في كثير من العطور الحديثة." },
  spice_fresh: { en: "Fresh spices (pepper, cardamom)", ar: "التوابل الباردة (فلفل، هيل)", hint_en: "Dry, peppery spices: black and pink pepper, cardamom, ginger; sharp and fresh rather than sweet.", hint_ar: "توابل جافة فلفلية: فلفل أسود ووردي، هيل، زنجبيل؛ حادة ومنعشة لا حلوة." },
  skin_musk: { en: "Warm skin musks", ar: "المسك الدافئ (مسك الجلد)", hint_en: "Warm, soft, powdery musk that smells like skin, sometimes faintly animal-like.", hint_ar: "مسك دافئ ناعم بودري يشبه رائحة الجلد، وأحياناً فيه لمسة حيوانية خفيفة." }
};
const AR_HINTS = {
  woody_amber: "قاعدة «خشب عنبري» جافة مشعّة حادة قليلاً (أمبروكسان وأقاربه الأقوى) في كثير من العطور الحديثة؛ تدوم ساعات، وبعض الناس لا يشمّون أجزاءً منها.",
  white_musk: "مسك نظيف يشبه الغسيل: ناعم، صابوني قليلاً، كالقطن المكويّ؛ كثيرون لا يشمّون واحداً أو أكثر من هذه المسكات.",
  oakmoss_chypre: "طحلب شجري رطب ترابي مع نفحة مرّة حبرية خفيفة؛ قاعدة عطور الشيبر والفوجير الكلاسيكية.",
  vetiver: "خشب جذري ترابي مع انتعاش يشبه الجريب فروت؛ بعض أنواعه مدخنة.",
  sandalwood_creamy: "خشب ناعم كريمي حليبي بلمسة تشبه الجلد؛ صناعي في الغالب اليوم، وبعض الناس يكادون لا يشمّونه.",
  leather_smoky: "جلد مدبوغ ودخان قطران البتولا: مدخن، قطراني، وأحياناً خشن أو حيواني.",
  aldehydes: "بريق شمعي صابوني معدني قليلاً في بداية العطور الزهرية الكلاسيكية (أسلوب شانيل رقم 5)، يُشبَّه غالباً بالغسيل المكويّ الساخن.",
  white_floral: "ياسمين ومسك الروم وزهر البرتقال ثقيلة حلوة؛ بعض نسخها فيها لمسة حيوانية خفيفة من الإندول.",
  rose: "بتلات الورد، من الطازج الأخضر الليموني إلى العميق العسلي المربّى؛ وإبرة الراعي، الورد الأخضر، تنتمي هنا أيضاً.",
  aquatic_marine: "هواء بحر مالح وانتعاش مائي (كالون)؛ بخلاف الحمضيات لا يتلاشى بسرعة.",
  fruity_sweet: "فاكهة ناضجة أو مسكّرة: خوخ، كمثرى، تفاح، توت، أناناس، كرز ولوز، جوز هند.",
  spicy_warm: "توابل مطبخ دافئة حلوة: قرفة، قرنفل، جوزة الطيب.",
  lavender_aromatic: "لافندر وأعشاب جافة كإكليل الجبل والمريمية والزعتر والنعناع: منعشة كافورية قليلاً، رائحة الفوجير الرجالي الكلاسيكي وصابون اللافندر.",
  green_herbal: "رائحة خضراء حادة كالعشب المقصوص والأوراق والسيقان المهروسة والغالبانوم؛ قد تكون مرّة قليلاً.",
  animalic: "روائح غدد حيوانية (زباد، قندس، تُصنع اليوم صناعياً): فرو دافئ مع لمسة وسخة أو برازية أو جلدية.",
  tobacco_honey: "ورق تبغ الغليون أو السيجار الحلو، غالباً مع نفحات فواكه مجففة أو قش أو عسل.",
  coffee_gourmand: "قهوة محمصة وكاكاو داكن: محمّص حلو مرّ لا سكري."
};
const famStart = src.indexOf("  const FAMILIES = {");
const famEnd = src.indexOf("\n  };", famStart) + 5;
let famBlock = src.slice(famStart, famEnd);
let hintsChanged = 0;
for (const [k, v] of Object.entries(proposed)) {
  if (k.startsWith("_") || k.startsWith("new_")) continue;
  const re = new RegExp(`(\\n    ${k}:\\s*\\{[^{}]*?hint_en: ")([^"]*)(",\\s*hint_ar: ")([^"]*)(")`, "m");
  const m = famBlock.match(re);
  if (!m) { console.warn("family block not found for", k); continue; }
  if (m[2] !== v.hint_en) {
    const ar = AR_HINTS[k] || m[4];
    famBlock = famBlock.replace(re, `$1${v.hint_en.replace(/"/g, "'")}$3${ar}$5`);
    hintsChanged++;
  }
}
const newLines = Object.entries(NEW_FAMILIES).map(([k, v]) => `    ${k}: { en: "${v.en}", ar: "${v.ar}",\n      hint_en: "${v.hint_en}", hint_ar: "${v.hint_ar}" }`).join(",\n");
if (!famBlock.includes("muguet_floral:")) famBlock = famBlock.replace(/\n  };$/, ",\n" + newLines + "\n  };");
src = src.slice(0, famStart) + famBlock + src.slice(famEnd);

/* ---- 2. per-entry splits driven by each entry's own note text ---- */
const w = runScript(src, dataPath);
const entries = w.PP_DATA.PERFUMES;
const FRESH = /\b(pepper|peppercorn|cardamom|ginger|juniper|pimento|coriander|sichuan|pink pepper)\b/i;
const WARM = /\b(cinnamon|clove|nutmeg|cassia|allspice|saffron)\b/i;
const HERB = /\b(sage|mint|peppermint|spearmint|rosemary|thyme|clary sage|artemisia|wormwood|eucalyptus|oregano|basil|tarragon)\b/i;
const GREEN = /\b(grass|leaf|leaves|galbanum|violet leaf|fig leaf|tomato leaf|stems|green notes|green|ivy|bamboo|cucumber|rhubarb|hyacinth|blackcurrant leaf|cassis leaf|bay leaf|laurel|juniper|pine|fir|cypress|tea|mate|cannabis|seaweed|algae|bulrush)\b/i;
const MUGUET = /\b(lily of the valley|lily-of-the-valley|muguet)\b/i;
const STAGES = ["opening", "heart", "drydown"];
const log = [];
function locate(id) {
  const start = src.indexOf(`p("${id}",`); if (start < 0) return null;
  const end = src.indexOf("\n    p(", start + 1);
  const block = src.slice(start, end < 0 ? src.length : end);
  const objs = []; let depth = 0, from = -1;
  for (let i = 0; i < block.length; i++) { const c = block[i]; if (c === "{") { if (depth === 0) from = i; depth++; } else if (c === "}") { depth--; if (depth === 0 && from >= 0) { objs.push([from, i + 1]); from = -1; if (objs.length === 3) break; } } }
  return objs.length === 3 ? { start, block, objs } : null;
}
function rewrite(id, stageIdx, mutate) {
  const loc = locate(id); if (!loc) return false;
  const [f, t] = loc.objs[stageIdx];
  const objText = loc.block.slice(f, t);
  const inner = objText.slice(1, -1).trim();
  const map = new Map(inner ? inner.split(",").map(s => s.trim()).filter(Boolean).map(p => { const [k, v] = p.split(":").map(x => x.trim()); return [k, parseFloat(v)]; }) : []);
  const before = new Map(map);
  mutate(map);
  const changed = [...map.entries()].some(([k, v]) => before.get(k) !== v) || [...before.keys()].some(k => !map.has(k));
  if (!changed) return false;
  const body = [...map.entries()].filter(([, v]) => v > 0).map(([k, v]) => `${k}:${String(Math.round(v * 100) / 100).replace(/^0\./, ".")}`).join(", ");
  const after = body ? `{ ${body} }` : "{}";
  const newBlock = loc.block.slice(0, f) + after + loc.block.slice(t);
  src = src.slice(0, loc.start) + newBlock + src.slice(loc.start + loc.block.length);
  for (const [k, v] of map) if (before.get(k) !== v) log.push({ ts: new Date().toISOString(), id, stage: STAGES[stageIdx], family: k, from: before.get(k) || 0, to: v, confidence: "high", source: "taxonomy", reason: "taxonomy split from the entry's own note text" });
  for (const k of before.keys()) if (!map.has(k)) log.push({ ts: new Date().toISOString(), id, stage: STAGES[stageIdx], family: k, from: before.get(k), to: 0, confidence: "high", source: "taxonomy", reason: "taxonomy split from the entry's own note text" });
  return true;
}
let touched = 0;
for (const p of entries) {
  const parts = p.notes.en.split(" / ");
  STAGES.forEach((s, i) => {
    const text = parts[i] || "";
    const st = p.stages[s];
    let did = false;
    if (st.spicy_warm) {
      const fresh = FRESH.test(text), warm = WARM.test(text);
      if (fresh && !warm) did = rewrite(p.id, i, m => { const v = m.get("spicy_warm"); m.delete("spicy_warm"); m.set("spice_fresh", v); }) || did;
      else if (fresh && warm) did = rewrite(p.id, i, m => { const v = m.get("spicy_warm"); m.set("spice_fresh", Math.max(m.get("spice_fresh") || 0, Math.round(v * 0.8 * 100) / 100)); }) || did;
    }
    if (st.green_herbal) {
      const herb = HERB.test(text), green = GREEN.test(text);
      if (herb && !green) did = rewrite(p.id, i, m => { const v = m.get("green_herbal"); m.delete("green_herbal"); m.set("lavender_aromatic", Math.max(m.get("lavender_aromatic") || 0, v)); }) || did;
      else if (herb && green) did = rewrite(p.id, i, m => { const v = m.get("green_herbal"); m.set("lavender_aromatic", Math.max(m.get("lavender_aromatic") || 0, Math.round(v * 0.7 * 100) / 100)); }) || did;
    }
    if (MUGUET.test(text) && !st.muguet_floral) did = rewrite(p.id, i, m => { m.set("muguet_floral", 0.5); }) || did;
    if (did) touched++;
  });
}
/* sanity: the file must still evaluate with the same entry count */
const w2 = runScript(src, dataPath);
if (w2.PP_DATA.PERFUMES.length !== entries.length) { console.error("entry count changed; not writing"); process.exit(1); }
fs.writeFileSync(dataPath, src);
if (log.length) fs.appendFileSync(path.join(root, "evidence", "applied_changes.jsonl"), log.map(l => JSON.stringify(l)).join("\n") + "\n");
console.log(`hints revised: ${hintsChanged}; new families: ${Object.keys(w2.PP_DATA.FAMILIES).length - Object.keys(w.PP_DATA.FAMILIES).length + (src.includes("muguet_floral:") ? 0 : 0)}; stage rewrites: ${touched}; logged changes: ${log.length}; families now: ${Object.keys(w2.PP_DATA.FAMILIES).length}`);
