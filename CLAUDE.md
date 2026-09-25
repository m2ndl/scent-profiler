# Scent Profiler (محلل الذائقة العطرية)

Bilingual (Arabic and English) dislike-first perfume profiler: a static site plus a Google Apps Script
backend. README.md is the full reference; PROJECT_LOG.md is the continuity record.

## Layout

- `site/`: the website and the only folder that is deployed. `js/config.js` holds the deployment settings,
  `js/engine.js` the profile logic, `js/notes.js` the note rows and told items both pages share, `js/app.js` the
  profiler page, `js/quiz.js` the quiz page (`quiz.html`); `js/evidence.js` and `js/bottles.js` are generated, and `img/bottles/`
  holds the bottle photos.
- `backend/apps-script.gs`: the Sheets backend. Its `VERIFIED` list is generated.
- `evidence/`: label lists and the tag changelog, the inputs to `site/js/evidence.js`.
- `tools/`: build and maintenance scripts. `tools/lib/site.js` loads the site scripts into Node; use it
  rather than copying code or evaluating files by hand.
- `tests/`: `node --test tests/*.test.js`.
- `reference/`: research record (books, tag audit, round table). Never deployed.

## Rules

- Run `node --test tests/*.test.js` after any change under `site/`, `evidence/`, `backend/` or `tools/`.
- Never hand-edit `site/js/bottles.js` or `site/img/bottles/` (run `python tools/fetch_bottles.py`, check its contact
  sheets, `--drop` a wrong photo).
- Never hand-edit `site/js/evidence.js` (run `node tools/build_evidence.js`) or the `VERIFIED` list in
  `backend/apps-script.gs` (run `node tools/sync_backend.js`).
- `engine.js` holds no DOM, storage or language; page concerns go in `app.js`. A change in engine
  behaviour needs `node tests/engine.test.js --update` and a reviewed diff of
  `tests/fixtures/engine_golden.json`.
- Nothing outside `site/` is deployed. The book texts in `reference/books/` are copyrighted: keep them out
  of git and out of `site/`.
- Fragella terms: never store or send back vendor note lists. The backend keeps identity, image, vendor id
  and derived family weights only; `tests/page.test.js` checks the page side.
- Provenance order is settled (reference/debate/ROUNDTABLE.md): curated, then notes, then label, then book.
  Ratings never rewrite a tag.
- Local run: `python tools/mock_backend.py 8765`, then
  `http://localhost:8765/?endpoint=http://localhost:8765/api` (launch config `site-mock-backend`).
- The claude.ai preview is built by `python tools/build_artifact.py` into `build/artifact/`; that host
  blocks outbound requests and outside images.
