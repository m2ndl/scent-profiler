# Edit scripts, 29 September 2026: the front page

Evidence of how the front page (site/index.html) was built and rebuilt in one session. They are exact-match edits and
fail loudly on a second run: do not re-run them. Listed in the order they ran. Each round was checked by
`node --test tests/*.test.js` and by phone and desktop renders in both languages.

1. `drydown_copy_edit.py`: took the drydown-first wording out of the landing page and the quiz (the quiz's "how it
   ended" questions became "how it went").
2. `move_quiz.py`: moved the quiz from index.html to quiz.html so index.html could be the front page; links, tests and
   the research scripts that load the quiz follow it.
3. `landing_copy_books.py`, `landing_nose.py`, `landing_test_update.py`: the first copy brought in line with the books
   (the note file behind it is kept locally in reference/books/book_facts.md, out of git with the book texts), and the
   grid of 100 noses.
4. `landing_css_fixes.py`, `landing_test_update2.py`, `verifier_fixes_other.py`: the fixes an independent review asked
   for (survey shares as "about", Arabic number agreement, spraying on click, the amber tip, and others).
5. `copy_splice.py` with `copy_words.js` and `copy_render.js`: the copy rebuilt as seven numbered steps, each a claim,
   an example and its evidence (the owner: "I sent that as the basis to build the copy from, not the copy itself").
6. `hook_css.py` with `hook_css.css`, and the words and sections in `hook_words.js` and `hook_render.js`, the tests in
   `hook_tests_render.js` and `hook_tests_tail.js`, the docs in `hook_docs.py`: the copy rewritten to hook the reader
   (the owner: "the copy seems defensive; it needs to be high dopamine"): the 1,000-perfume test, the box turned round,
   sources folded, each section ending on the question the next answers. The words and sections were spliced into
   site/js/landing.js between fixed markers by a short inline script like `copy_splice.py`.

Not here: the 3D atomizer (site/js/bottle3d.js and tools/render_atomizer.py were written whole, then tuned by small
inline edits against renders) and a few one-line fixes made with the editor.
