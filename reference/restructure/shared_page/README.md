# The shared page script (site/js/page.js)

On 26 September 2026 the code that site/js/app.js (the profiler) and site/js/quiz.js (the quiz) both
carried, about ninety identical lines, moved into site/js/page.js: the eighteen word-table entries the two
pages held identically in both languages, the device store, the escape and photo helpers, the rating
sender, the backend calls, and the note rows and shop links both pages draw. Nothing a visitor sees or the
backend receives changed.

In the order they ran:

1. `split_words.js`: moved the shared word-table entries into page.js and left each page its own, wrapped
   in `PAGE.words(...)`; it checked that each page's merged table equals its old one key by key in both
   languages before writing. Evidence only: its edits are exact matches and fail on a second run. The
   helper moves were made by hand after it.
2. `run_equiv.js`: runs the old page and the new one side by side in the project's stub browser
   (tests/lib/dom.js). Each seeded visit loads the quiz or the profiler from both trees with the same
   storage, backend and query, then takes the same actions: a click on a button or link drawn on the old
   page at that moment, typing in the search box, Enter, Escape, a label paste, running the timers, hiding
   the page. After every action it compares every element the page wrote, html lang and dir, storage,
   every request and beacon, the clipboard and history. It can be re-run against any two trees, the old
   one exported with `git checkout-index -a --prefix=<dir>/`:
   `node run_equiv.js <old root> <new root> <visits> [first seed] [quiz|profile]`.
3. `equiv.log`: old against old (the harness is deterministic), old (commit ca6fb8c) against new over 800
   visits (all identical, 29,390 page states, every quiz screen reached), and four one-line changes planted
   in page.js (a missing attribute, a reordered request field, one Arabic word, a wrong query separator),
   each caught on the first visits.
4. `search_check.js`: for the later search change in page.js (whole-phrase hits first, then every typed word):
   over 6,010 queries built from the catalogue's own words, no result the old search gave is lost or moved.
