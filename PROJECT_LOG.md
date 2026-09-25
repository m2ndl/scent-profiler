# Project log

Continuity record for the perfume profiler. Newest first.

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
