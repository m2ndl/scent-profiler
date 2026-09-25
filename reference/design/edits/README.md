# Edit scripts, 25 September 2026

Evidence of how the redesign and the quiz result screen were changed. They are exact-match edits and fail loudly
on a second run: do not re-run them. Listed in the order they ran.

1. `palette.js`: derives the colours in OKLCH and prints WCAG contrast for each text/surface pair. Reusable
   as a check; the adopted apothecary palette values are in `../README.md`.
2. `mobile_first.py`: turned `site/site.css` from max-width to min-width media queries. Checked by rendering
   at 390 and 1200 px.
3. `reveal_edit.py`: the quiz result leads with the taste card and three bottle tiles; family cards folded
   under "How we worked this out" (`site/js/quiz.js`). Checked by the quiz tests and a scripted run.
4. `sharecard_edit.py`: the share card drawn on a canvas and handed to the share sheet. Checked by saving
   the card in English and Arabic.
5. `name_edit.py`: palate names and emblems, the count, `ruledOut()` in `site/js/engine.js` (recommend()
   unchanged; engine golden test still passes), the card led by the name.
6. `reveal2_edit.py`: the kept/turned reveal before the result, and the card's tiles fitted above its footer.
   Checked by the new quiz test on the name, count and reveal.
