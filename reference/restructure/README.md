# Restructure scripts (evidence, not tools)

One-off scripts from 25 September 2026, when the flat project was split into site/, backend/,
evidence/, tools/ and tests/. They are kept so the split and the fixture golden can be audited. Do
not re-run them: they read a scratchpad copy of the old project that no longer exists, and each edit
is an exact match that fails on a second run.

In the order they ran:

1. `split_page.js`: cut the inline script of `old_index.html` into site/js/engine.js, app.js and
   config.js, and replaced it with script tags in site/index.html. Checked by `run_equiv.js`.
2. `run_equiv.js` with `scenarios.js`: ran the old page (`old_index.html`) and the new one in the stub
   browser (tests/lib/dom.js) over 800 seeded sessions of clicks, searches and label pastes, comparing
   every page state, every request, the clipboard and the engine's outputs. All identical
   (`equiv_500.log`); planted one-line engine changes were each detected.
3. `make_fixtures.js`: wrote tests/fixtures/ (88-perfume frozen catalogue, 60 scenarios) and
   captured engine_golden.json from the old page's own code.
4. `patch_docs.js`: README paths and sections for the new layout (`old_README.md` is the version it
   edited); coverage-checked line by line, every dropped word a renamed path.
5. `fix_check.js`: after the rating-send fixes, confirmed against the old page that only rating sends
   changed: page states and other requests identical, no errors, one send per perfume with its
   stored state. The old page lost a rating in 95 of 800 sessions with a backend.

Pre-restructure files not kept here are identical to their committed versions (data.js, mapper.js,
materials.js, articles.html, site.css, og.png) or differ only in paths (tools, apps-script.gs,
evidence.js header).

Later: `shared_page/` holds the scripts and log from moving the code both pages shared into
`site/js/page.js` (26 September 2026).
