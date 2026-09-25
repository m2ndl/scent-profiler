/* E6: adds toldItems (and the told normaliser it uses) to site/js/notes.js. Exact match; fails on a second run. */
const fs = require("fs");
const F = "C:/Users/malha/Desktop/Webapps/perfume-profiler/site/js/notes.js";
let src = fs.readFileSync(F, "utf8");
const rep = (a, b) => { const n = src.split(a).length - 1; if (n !== 1) throw new Error("expected one match, found " + n + ": " + a.slice(0, 40)); src = src.replace(a, b); };

rep(`   Use: const N = PP_NOTES.create(D, M, E); N.questions(P, "worn") */`,
`   It also turns the quiz's word answers into the engine's told items, so both pages build the same list.
   Use: const N = PP_NOTES.create(D, M, E); N.questions(P, "worn"); N.toldItems(quiz) */`);

rep(`    return { questions };
  }

  return { create, STAGES, stageLists };`,
`    /* The quiz's word answers as told items for computeProfile, [{ f, value: 1 | -1, w, src }]:
       - quiz.notes { noteId: 1 | -1 }: one item per family the note word maps to, with the mapper weight;
       - quiz.taste "bitter" | "sweet": QUIZ.taste, +1 on the chosen side and -1 on the other; other answers add nothing;
       - quiz.told [chipId]: one item per family in the chip's map, value -1. An old string value is read as
         a one-item array, and "none" as [].
       src is note:<id>, taste:<bitter|sweet> or chip:<id>. */
    function toldItems(quiz) {
      const q = quiz || {}, out = [], Q = D.QUIZ || {};
      const push = (fams, value, src) => { for (const [f, w] of Object.entries(fams || {})) if (w > 0) out.push({ f, value, w, src }); };
      const answers = q.notes || {};
      for (const screen of Q.notePicker || []) for (const n of screen.notes) {
        const v = answers[n.id];
        if (v === 1 || v === -1) push(M.famsForNote(n.en), v, "note:" + n.id);
      }
      const side = q.taste === "bitter" || q.taste === "sweet" ? q.taste : null;
      if (side && Q.taste) {
        const other = side === "bitter" ? "sweet" : "bitter";
        push(Q.taste[side], 1, "taste:" + side);
        push(Q.taste[other], -1, "taste:" + side);
      }
      for (const id of normTold(q).told) {
        const chip = D.CHIPS.find(c => c.id === id);
        if (chip) push(chip.fams, -1, "chip:" + id);
      }
      return out;
    }

    return { questions, toldItems, normTold };
  }

  /* quiz.told as stored now ({ told: [chipId], toldNone }), from either form: an old string value is a
     one-item array, and "none" is [] with toldNone true. Repeated ids are kept once. */
  function normTold(quiz) {
    const q = quiz || {}, t = q.told;
    if (t === "none") return { told: [], toldNone: true };
    const list = Array.isArray(t) ? t : typeof t === "string" && t ? [t] : [];
    const told = list.filter((x, i) => typeof x === "string" && x && x !== "none" && list.indexOf(x) === i);
    return { told, toldNone: !told.length && (!!q.toldNone || list.includes("none")) };
  }

  return { create, STAGES, stageLists, normTold };`);
fs.writeFileSync(F, src);
console.log("written");
