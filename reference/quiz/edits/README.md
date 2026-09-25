# Edit scripts from the quiz build (25 September 2026)

Evidence of what each executor changed, in the order they ran. They are records, not tools: each
matches exact text and fails loudly on a second run. Do not re-run them. The checks that verified each
step were `node --test tests/*.test.js` and the diffs the planner read between steps (PLAN.md, PLAN2.md,
VERIFY_V1.md, VERIFY_V2.md in the folder above).

1. `golden_diff.js` (E1): compares the engine golden before and after the complaint-chip rule; output in ../E1_golden_diff.txt.
2. `e4_quiz_edits.js`, `e4_readme_edits.js` (E4): the verifier's fixes to quiz.js and README after the first quiz build.
3. `add_quiz_data.js`, `add_told_items.js`, `told_prior.js`, `told_prior_tests.js`, `amber_fams.js` (E6): QUIZ picker and taste data, toldItems in notes.js, the told prior in engine.js, the amber card's own family map.
4. `rep.py` with `quiz_*.txt`, `app_1.txt`, `backend_1.txt`, `quiztest_*`, `pagetest_*`, `readme_1.txt` (E7): the deeper quiz (note screens, picker, taste, complaints, Back), the profiler's note rows, backend columns, tests and README. Each .txt is a replacement spec rep.py applied.
5. `rep.js` with `edits_site.txt`, `edits_tests.txt`, `edits_tests2.txt` (E8): the second verifier's fixes (risk wording, disagreement line, Arabic).
6. `build_picker.js`, `edit_quiz.js` (E9): the 92-card note picker built from catalogue frequency, the books and the Gulf list; the picker fold in quiz.js.

## Edit scripts from 25 and 26 September 2026 (the site goes live)

Same status: records of what changed, matching exact text, not to be re-run. Each step was checked with
`node --test tests/*.test.js` and a phone render in both languages before it was published.

7. `patch_arch.js` to `patch_arch5.js`: the palate name follows the shape of the kept bottles (one group, two groups
   named together, wide, selective); `patch_arch2.js` and `patch_arch3.js` were rules replaced by `patch_arch4.js` (one
   vote per bottle); `patch_arch5.js` split the vote into `palateGroups()` and made the liked chips show one family per side.
8. `patch_quiz.js`, `patch_backend.js`, `patch_tests.js`, `patch_tip.js`, `patch_readme.js`: the start screen, one
   `reach:` event per screen and a `result:` event, the palate text and tip, the comparison line; the backend's quiz
   counts and funnel sheet; `tests/backend.test.js`.
9. `patch_front.js`, `patch_front_tests.js`, `patch_front_docs.js`: the quiz became the front page (`index.html`), the
   profiler "Your profile" (`profile.html`), `quiz.html` a redirect.
10. `patch_arabic_label.js`: the articles' Arabic name ("لماذا يتغيّر العطر بعد ساعات") and "your profile" in five messages.
11. `patch_start_search.js`, `patch_search_room.js`: the big Start button above the four parts; the search list above the
    Continue bar with room to scroll on a phone.
12. `patch_hints.js`: one-line descriptions for 27 note-picker cards.
13. `patch_full.js`: "See the full profile" as a dark button straight after the picks.
14. `patch_engine_veto.js`, `patch_pages_veto.js`, `patch_veto_tests.js`, `patch_veto_tests2.js`, `patch_readme_veto.js`:
    avoided note cards veto the picks they lead unless a kept bottle carries them; the contradiction line; a reason and
    at most one watch item per pick. The engine golden was unchanged (no scenario avoids a card).
