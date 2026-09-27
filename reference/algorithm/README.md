# The lean rule: audit and review record (27 Sep 2026)

The owner kept Hacivat and loved its pineapple top note, and the quiz called them sweet although they prefer bitter.
The fix is the rule in README.md ("A detail never outranks a verdict"): a note liked only in the first minutes, or
disliked in a kept bottle, is a lean; only kept bottles' hearts and bases name the palate. These files are the evidence
behind it. They are a record, not tools: their paths point at the session's scratch folder and an old tree, so adapt
them before any rerun.

| File | What it did | What it showed |
| --- | --- | --- |
| `audit.js` | Runs synthetic quiz visitors through the real page (tests/lib/dom.js) and flags results that contradict their answers. `node audit.js 1500 7` | Before the fix: sweet palates from top notes, rejected bottles voting, silent overrides of the taste answer. After: only `drawn_from_unkept_bottle` (about 300 of 1,500), judged legitimate: a note explicitly loved in the heart or base of a bottle that turned. |
| `REVIEW_round2.md` | The second verifier's report on commits e8c0243, c51b3db and 06f0c29. | One blocking defect (a note hated in a kept bottle became a like through the bottle's other liked stage), a loved top note becoming a deal-breaker, and five smaller ones. All fixed in the following commit, each with a test that fails on the earlier engine. |
| `harness.js` | That verifier's page harness: `quiz(ratings, answers, lang)` and `profile(...)` on a given tree, and `digest(html)`. | Used by the three below. |
| `samebottle.js` | 4,000 random kept-bottle visitors: liked families that carry a kept-bottle dislike, split by where the like comes from. | Likes from the same bottle: 332 before the fix, 0 after. |
| `lovedbreaker.js` | 4,000 random visitors: deal-breakers resting only on bottles where that note was loved. | 0 after the fix. |
| `find_caveats2.js` | Two-bottle grid pairs whose picks carry each caveat. | Supplied the page tests' scenarios (Sauvage and Bleu; Sauvage and Club de Nuit Intense). |

A third verifier was started on the final fixes and stopped when the session ended, with no findings written.
