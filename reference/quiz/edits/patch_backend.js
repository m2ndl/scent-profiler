const fs = require("fs"); const p = "backend/apps-script.gs"; let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(n + " matches: " + a.slice(0, 80)); s = s.replace(a, () => b); };

rep(`/* GET ?stats=1      -> { perfumes: { <id>: { n, o, h, d } } }, last row per device+perfume unless it is a quiz verdict, cached 5 min.`,
`/* GET ?stats=1      -> { perfumes: { <id>: { n, o, h, d } }, quiz: { n, palates, breakers } }, cached 5 min. perfumes: the
                        last row per device+perfume unless it is a quiz verdict. quiz: each device's last finished result.`);

rep(`  const out = { perfumes: {} };
  Object.keys(agg).forEach(id => {`, `  const out = { perfumes: {}, quiz: quizStats_(sheet_("events", EVENT_HEADERS).getDataRange().getValues().slice(1)) };
  Object.keys(agg).forEach(id => {`);

rep(`function rowToEntry_(r) {`, `/* The quiz page sends "result:<palate>:<deal-breakers joined by +>" when a visitor reaches the result. Each
   device counts once, with its last result: n finished devices, how many hold each palate, how many each
   deal-breaker. rows: the events sheet without its header, [ts, device, lang, name, n], in the order written. */
function quizStats_(rows) {
  const last = {};
  rows.forEach(r => { const name = String(r[3] || ""); if (name.indexOf("result:") === 0 && r[1]) last[r[1]] = name; });
  const out = { n: 0, palates: {}, breakers: {} };
  Object.keys(last).forEach(device => {
    const parts = last[device].split(":"), palate = parts[1] || "none", bad = parts[2] ? parts[2].split("+") : [];
    out.n++;
    out.palates[palate] = (out.palates[palate] || 0) + 1;
    bad.forEach(f => { if (f) out.breakers[f] = (out.breakers[f] || 0) + 1; });
  });
  return out;
}

/* The quiz funnel: how many devices reached each screen ("reach:<screen>" events, one per screen per visit)
   and how many reached the result (quiz_done), in the order of the quiz, each as a share of those who saw the
   start screen. The note picker's screens are numbered 1 to 5; a screen whose notes were all answered on a
   bottle is skipped, and the bottle screens (verdicts, notes, narrow) are skipped by "None of these", so a
   later row can be larger than an earlier one. */
const FUNNEL_STEPS_ = ["start", "grid", "verdicts", "notes", "narrow", "picker", "taste", "told", "anosmia", "done"];
function funnelRows_(rows) {
  const seen = {};
  rows.forEach(r => {
    const name = String(r[3] || ""), device = r[1];
    if (!device) return;
    const step = name === "quiz_done" ? "done" : name.indexOf("reach:") === 0 ? name.slice(6) : null;
    if (!step) return;
    (seen[step] = seen[step] || {})[device] = true;
  });
  const order = step => { const [base, i] = step.split(":"); const k = FUNNEL_STEPS_.indexOf(base); return (k < 0 ? 99 : k) * 100 + (Number(i) || 0); };
  const steps = Object.keys(seen).sort((a, b) => order(a) - order(b));
  const count = step => Object.keys(seen[step]).length;
  const base = seen.start ? count("start") : 0;
  return steps.map(step => [step === "done" ? "result" : step, count(step), base ? Math.round(1000 * count(step) / base) / 10 : ""]);
}
/* Writes the funnel to its own sheet. Run it from the Profiler menu in the sheet, or from the script editor. */
function buildFunnel() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const rows = funnelRows_(sheet_("events", EVENT_HEADERS).getDataRange().getValues().slice(1));
  let sh = ss.getSheetByName("funnel");
  if (sh) sh.clear(); else sh = ss.insertSheet("funnel");
  sh.getRange(1, 1, 1, 3).setValues([["screen", "visitors", "% of start"]]);
  if (rows.length) sh.getRange(2, 1, rows.length, 3).setValues(rows);
  sh.getRange(rows.length + 3, 1).setValue("Built " + new Date().toISOString() + ". One visitor is one device; each screen counts once per device.");
}
/* the Profiler menu in the sheet this script is bound to */
function onOpen() {
  try { SpreadsheetApp.getUi().createMenu("Profiler").addItem("Build the quiz funnel", "buildFunnel").addToUi(); } catch (err) { /* not bound to a sheet */ }
}

function rowToEntry_(r) {`);
fs.writeFileSync(p, s);

/* the mock backend keeps events and answers the same quiz counts */
const m = "tools/mock_backend.py"; let t = fs.readFileSync(m, "utf8");
const repm = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(n + " matches (mock): " + a.slice(0, 80)); t = t.replace(a, () => b); };
repm(`  GET  /api?stats=1        -> {perfumes: {id: {n, o, h, d}}}`, `  GET  /api?stats=1        -> {perfumes: {id: {n, o, h, d}}, quiz: {n, palates, breakers}}`);
repm(`RATINGS, CORRECTIONS, LABELS, CATALOGUE = [], [], [], {}`, `RATINGS, CORRECTIONS, LABELS, EVENTS, CATALOGUE = [], [], [], [], {}

def quiz_stats():
    """As quizStats_ in the backend: each device's last "result:<palate>:<deal-breakers>" event, counted."""
    last = {}
    for e in EVENTS:
        name = str(e.get("name") or "")
        if name.startswith("result:") and e.get("device"): last[e["device"]] = name
    out = {"n": 0, "palates": {}, "breakers": {}}
    for name in last.values():
        parts = name.split(":"); palate = parts[1] if len(parts) > 1 and parts[1] else "none"
        out["n"] += 1; out["palates"][palate] = out["palates"].get(palate, 0) + 1
        for f in (parts[2].split("+") if len(parts) > 2 and parts[2] else []):
            if f: out["breakers"][f] = out["breakers"].get(f, 0) + 1
    return out`);
repm(`            return self._json({"perfumes": {k: {"n": a["n"], "o": sum(a["o"]) / len(a["o"]) if a["o"] else None, "h": sum(a["h"]) / len(a["h"]) if a["h"] else None, "d": sum(a["d"]) / len(a["d"]) if a["d"] else None} for k, a in agg.items()}})`,
`            return self._json({"perfumes": {k: {"n": a["n"], "o": sum(a["o"]) / len(a["o"]) if a["o"] else None, "h": sum(a["h"]) / len(a["h"]) if a["h"] else None, "d": sum(a["d"]) / len(a["d"]) if a["d"] else None} for k, a in agg.items()}, "quiz": quiz_stats()})`);
repm(`        if t == "event": print("event", body.get("name"), body.get("n")); return self._json({"ok": True})`,
`        if t == "event": EVENTS.append(body); print("event", body.get("name"), body.get("n")); return self._json({"ok": True})`);
fs.writeFileSync(m, t);
console.log("ok");
