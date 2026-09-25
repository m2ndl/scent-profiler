# Project log

Continuity record for the perfume profiler. Newest first.

## 2026-09-25: the project split and the rating-send fixes

- Layout: site/ is the only deployed folder (js/engine.js profile logic, js/app.js the page,
  js/config.js the deploy settings); backend/, evidence/, tools/, tests/, reference/. CLAUDE.md added.
  The split changed no behaviour: old and new page identical over 800 scripted sessions
  (reference/restructure/README.md).
- Tests: `node --test tests/*.test.js` (15). Engine golden captured from the old page on a frozen
  88-perfume catalogue; page test in a stub browser; deploy-folder, evidence and backend-list checks.
- Fixed three ways the page lost ratings before they reached the Sheet: a second perfume rated within
  1.2 s cancelled the first one's send; a perfume removed within 1.2 s threw; a rating made just before
  leaving the page was never sent (now sent by sendBeacon on hide or close). The old page lost a rating
  in 95 of 800 sessions with a backend.
- Git: two commits on master (c729c1d split, 7614ded send fixes). Books and build/ ignored;
  .gitattributes keeps LF because the machine's core.autocrlf is true. This log entry and
  reference/restructure/ are not yet committed.

Open, dated 25 Sep 2026, unchanged and all needing Muhammad's accounts: deploy backend/apps-script.gs
(Sheet id, Fragella key); publish site/ on a static host, then set og:image to the full URL; shop links
in site/js/config.js; his own three-vial test. Week-six label test as below.

## 2026-09-25: the profiler's provenance stack

Built the whole site in one session, then audited it, then rebuilt its data model on evidence.

- Product: bilingual dislike-first profiler (rate opening, heart, drydown; infer material families you
  dislike; three samples that avoid them). Static site plus Google Apps Script backend. Preview at
  https://claude.ai/artifact/B976vhVtVsHv3QxXjzkCen (private).
- Catalogue: 286 curated entries, 32 families after the taxonomy audit, 21 marked clones. Lazy vendor
  lookups (Fragella) with derived-weights-only caching. Four bilingual articles, share image, tag queue tool.
- Audit against Turin and Sanchez 2018 and Scent and Chemistry 2022 (Opus agents): evidence for 68 of
  286, 40 corrected; 69 changes logged in reference/audit/applied_changes.jsonl.
- Round table (five voices, Borda): provenance stack chosen unanimously (reference/debate/ROUNDTABLE.md).
  Built: materials.js (97 INCI materials), evidence.js (book and label layers), label paste field,
  source shown per evidence line, never-on-label caveat for woody ambers and ouds.
- Twelve Parfums de Marly labels in reference/labels/ proved the point: Iso E Super declared near the top
  on 11 of 12, absent from every official note list.

Open, dated 25 Sep 2026, all needing Muhammad's accounts: deploy apps-script.gs (Sheet id, Fragella key),
static hosting, affiliate or coupon links in CONFIG.links, his own three-vial test. Week-six test from
the debate: if fewer than 100 of 286 entries have a findable label, launch on notes plus literature.

Reflective ideas, not scheduled: Jellinek effect axes as a second profile layer (reference/audit/
jellinek_axes.md); an Iso E Super family of its own if ratings show people treat it apart from cedar;
statistical family inference once any perfume passes about 120 raters.
