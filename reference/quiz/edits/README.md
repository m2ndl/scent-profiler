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
