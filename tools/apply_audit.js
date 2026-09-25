#!/usr/bin/env node
/* Applies audited tag corrections to data.js in place, keeping the file's formatting.

   Usage:
     node tools/apply_audit.js --min high            # apply only high-confidence changes
     node tools/apply_audit.js --min medium --dry    # preview medium and above, write nothing
   Reads reference/audit/tags_part*.json (output of the audit agents), edits the matching
   p("id", ...) entry's stage object, and appends every applied change to
   evidence/applied_changes.jsonl so the edit can be audited or reversed.
   An entry or family it cannot find is reported and skipped, never guessed. */

const fs = require("fs");
const path = require("path");
const { ROOT: root, SITE, runScript } = require("./lib/site");
const args = process.argv.slice(2);
const min = (args[args.indexOf("--min") + 1] || "high").toLowerCase();
const dry = args.includes("--dry");
/* --skip id:stage:family,id:stage:family  leaves named changes unapplied (reviewer's veto) */
const skipList = new Set((args[args.indexOf("--skip") + 1] || "").split(",").filter(x => args.includes("--skip") && x));
/* --source guide,chemistry,original  applies only changes from those sources; --no-log skips the changelog (re-applies) */
const onlySources = args.includes("--source") ? new Set((args[args.indexOf("--source") + 1] || "").split(",").filter(Boolean)) : null;
const noLog = args.includes("--no-log");
const rank = { low: 0, medium: 1, high: 2 };
if (!(min in rank)) { console.error("--min must be low, medium or high"); process.exit(1); }

const dataPath = path.join(SITE, "js", "data.js");
let src = fs.readFileSync(dataPath, "utf8");
const w = runScript(src, dataPath);
const famKeys = new Set(Object.keys(w.PP_DATA.FAMILIES));
const ids = new Set(w.PP_DATA.PERFUMES.map(p => p.id));

const files = fs.readdirSync(path.join(root, "reference/audit")).filter(f => /^tags_part\d+\.json$/.test(f)).sort();
if (!files.length) { console.error("no tags_part*.json found"); process.exit(1); }
const audits = files.flatMap(f => JSON.parse(fs.readFileSync(path.join(root, "reference/audit", f), "utf8")));

/* Locate the three stage objects of one entry in the source text.
   An entry looks like: p("id","House","Name","ar","g","tier",N,\n {opening}, {heart}, {drydown},\n { notes }...) */
function locate(id) {
  const start = src.indexOf(`p("${id}",`);
  if (start < 0) return null;
  const end = src.indexOf("\n    p(", start + 1);
  const block = src.slice(start, end < 0 ? src.length : end);
  const objs = [];
  let depth = 0, from = -1;
  for (let i = 0; i < block.length; i++) {
    const c = block[i];
    if (c === "{") { if (depth === 0) from = i; depth++; }
    else if (c === "}") { depth--; if (depth === 0 && from >= 0) { objs.push([from, i + 1]); from = -1; if (objs.length === 3) break; } }
  }
  if (objs.length < 3) return null;
  return { start, block, objs };
}
const STAGE_IDX = { opening: 0, heart: 1, drydown: 2 };

function setWeight(objText, family, to) {
  const inner = objText.slice(1, -1).trim();
  const parts = inner ? inner.split(",").map(s => s.trim()).filter(Boolean) : [];
  const map = new Map(parts.map(p => { const [k, v] = p.split(":").map(s => s.trim()); return [k, v]; }));
  if (to <= 0) map.delete(family); else map.set(family, String(to).replace(/^0\./, "."));
  const body = [...map.entries()].map(([k, v]) => `${k}:${v}`).join(", ");
  return body ? `{ ${body} }` : "{}";
}

let applied = 0, skipped = 0;
const log = [];
for (const a of audits) {
  for (const ch of a.changes || []) {
    const conf = String(ch.confidence || "low").toLowerCase();
    if ((rank[conf] ?? 0) < rank[min]) { skipped++; continue; }
    if (skipList.has(`${a.id}:${ch.stage}:${ch.family}`)) { console.log("vetoed     ", a.id, ch.stage, ch.family); skipped++; continue; }
    if (onlySources && !onlySources.has(String(ch.source || ""))) { skipped++; continue; }
    if (!ids.has(a.id)) { console.warn("unknown id", a.id); skipped++; continue; }
    if (!famKeys.has(ch.family)) { console.warn("unknown family", ch.family, "for", a.id); skipped++; continue; }
    if (!(ch.stage in STAGE_IDX)) { console.warn("bad stage", ch.stage, "for", a.id); skipped++; continue; }
    const loc = locate(a.id);
    if (!loc) { console.warn("could not locate entry", a.id); skipped++; continue; }
    const [f, t] = loc.objs[STAGE_IDX[ch.stage]];
    const before = loc.block.slice(f, t);
    const after = setWeight(before, ch.family, Number(ch.to));
    if (before === after) { skipped++; continue; }
    const newBlock = loc.block.slice(0, f) + after + loc.block.slice(t);
    src = src.slice(0, loc.start) + newBlock + src.slice(loc.start + loc.block.length);
    applied++;
    log.push({ ts: new Date().toISOString(), id: a.id, stage: ch.stage, family: ch.family, from: ch.from, to: ch.to, confidence: conf, source: ch.source, quote: ch.quote, reason: ch.reason });
    console.log(`${dry ? "would apply" : "applied"}  ${a.id.padEnd(24)} ${ch.stage.padEnd(8)} ${ch.family.padEnd(18)} ${ch.from} -> ${ch.to}  [${conf}] ${ch.reason || ""}`);
  }
}
if (!dry && applied) {
  /* the edited file must still evaluate and keep every id */
  const w2 = runScript(src, dataPath);
  if (w2.PP_DATA.PERFUMES.length !== w.PP_DATA.PERFUMES.length) { console.error("entry count changed; aborting without writing"); process.exit(1); }
  fs.writeFileSync(dataPath, src);
  if (!noLog) fs.appendFileSync(path.join(root, "evidence", "applied_changes.jsonl"), log.map(l => JSON.stringify(l)).join("\n") + "\n");
}
console.log(`\n${applied} change(s) ${dry ? "previewed" : "applied"}, ${skipped} skipped (below --min ${min} or unresolvable).`);
