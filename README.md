# Drydown Profiler

A bilingual (Arabic / English) web tool that profiles what a person dislikes in perfume, by
material family and by stage of wear, then recommends three catalogue perfumes that avoid
those families. Static files, no build step, no accounts.

## Layout

`site/` is the website and the only folder that is deployed. Everything else builds, tests or documents it.

| Path | Purpose |
|---|---|
| `site/index.html` | The profiler page. Markup only; its scripts are in `site/js/`. |
| `site/site.css` | Shared styles for both pages. The design is built on one idea: a perfume is a timeline and the last hours matter most (rating rows are wear timelines, the side panel is a live profile). Young Serif and Reem Kufi for headings, IBM Plex Sans Arabic for text. |
| `site/articles.html` | Four bilingual pieces on why drydowns fail (woody ambers, musk anosmia, notes versus ingredients, the three ouds). The site's reason to be found. |
| `site/og.png` | Share image for WhatsApp, Snapchat and X previews. |
| `site/js/config.js` | Deployment settings: backend URL and shop links. The one file to edit when the site goes live. |
| `site/js/data.js` | Verified catalogue (286 perfumes: 98 designer, 125 niche, 63 Arab-house including 19 marked clones of an original) and the material-family taxonomy. Only this tier drives recommendations. |
| `site/js/mapper.js` | Note-to-family mapper: turns any published note pyramid into families at confidence 1 (about 380 rules plus accord floors). |
| `site/js/materials.js` | Ingredient-list reader: 97 label materials with families and volatility classes (see Provenance). |
| `site/js/evidence.js` | Generated from `evidence/` by `tools/build_evidence.js`: the book and label layers. Never edited by hand. |
| `site/js/engine.js` | Profile engine: evidence merge, profile, recommendations, the one-sample suggestion. No page code, so tests and tools run the same engine under Node. |
| `site/js/app.js` | The page itself: language, rendering, storage on the device, backend calls, clicks. |
| `backend/apps-script.gs` | Google Sheets backend: anonymous ratings, tag corrections, community stats, and the lazy catalogue (on-demand lookups through the Fragella API, cached for everyone). Includes `enrichVerified()` for bottle images; its `VERIFIED` list is written by `tools/sync_backend.js`. |
| `evidence/` | Inputs to `site/js/evidence.js`: `labels/<id>.txt` (ingredient lists) and `applied_changes.jsonl` (every tag change, with its quote and source). |
| `tools/tag_queue.js` | Reads the ratings and catalogue CSV exports and prints the unverified perfumes people rated, by demand, with a data.js stub for each. |
| `tools/sync_backend.js` | Rewrites the backend's `VERIFIED` list from `site/js/data.js`; `--check` reports whether it is current. |
| `tools/mock_backend.py` | Local stand-in for the backend with a three-perfume fixture, for testing without Google or an API key. Serves `site/`. |
| `tools/build_artifact.py` | Produces `build/artifact/` for the claude.ai Artifact host (preview only; that host blocks outbound requests and outside images). |
| `tools/lib/site.js` | Loads the site scripts into Node the way the page does; every tool and test reads the catalogue through it. |
| `tests/` | `node --test tests/*.test.js`; see Tests. |
| `reference/` | Research record: the books (kept out of git), the tag audit, the round table. Never deployed; only `tools/apply_audit.js` reads from it. |
| `build/` | Generated output, kept out of git. |

## Provenance: where every tag comes from

Decided at a five-voice round table (reference/debate/ROUNDTABLE.md). Each family weight on each stage
carries a source, and higher evidence overrides lower:

1. **curated** (site/js/data.js): the note list read by a person, the floor for the 286 shipped entries. When the
   vendor feed is on, looked-up perfumes get **notes** (vendor pyramid through mapper.js) as their floor.
2. **label**: an ingredient list (INCI) parsed by materials.js. It proves presence; a material sets a weight
   only when it is among the first six fragrance materials, further down it records presence only. A
   new-format list (the 56 allergens added by EU Regulation 2023/1545, mandatory from 31 July 2026 for new
   products and 31 July 2028 for all) can also rule a family out when none of its markers is declared:
   tonka, oakmoss, patchouli, sandalwood, dry cedar. Woody ambers, ouds, aquatic, coffee and saffron never
   appear on a label (their materials are not allergens); verdicts on those say so.
3. **book**: a quoted formula figure or expert statement, from the audit changelog.

Wearers' ratings never rewrite a tag; they feed the profile and a review queue. The page shows the source
beside every piece of evidence, and lets a wearer paste the ingredient list from a box, which counts on
that device at once and goes to the `labels` sheet for the evidence queue.

Files: `site/js/materials.js` (97 materials with families and volatility classes), `site/js/evidence.js` (generated:
book layer from evidence/applied_changes.jsonl, label layer from evidence/labels/*.txt),
`tools/build_evidence.js` (regenerates evidence.js), `tools/apply_audit.js`, `tools/split_families.js`.
To add a label: create evidence/labels/<id>.txt with `id:`, `market:`, `date:`, `url:` lines and the
list, then run `node tools/build_evidence.js`. Identical lists on different perfumes are rejected.

Vendor terms: Fragella forbids caching its data, so the backend stores only identity, image, vendor id and
our derived family weights for looked-up perfumes; note lists reach the requesting page only.

## Three catalogue tiers

1. **Verified** (`site/js/data.js`): hand-tagged, confidence 2 or 3. Recommendations and "one sample would settle it" come only from here.
2. **Auto-tagged** (backend catalogue sheet): perfumes people typed that were not verified. The backend looks each one up once in Fragella, the page maps its notes to families at confidence 1, and the backend keeps only those family weights and the image. They count at half weight in the profile, are labelled on the card, and carry a "these tags look wrong" flag.
3. **Untagged**: typed names the lookup could not find. Ratings are saved with the name so you can tag them later; they do not affect the profile.

Untagged and auto-tagged names in the sheet are your tagging queue, ordered by how often people rate them. Promote an entry to verified by adding it to `site/js/data.js` with the same id, then run `node tools/sync_backend.js`.

## Images

The lookup stores Fragella's product photo with each entry. For the verified perfumes, run `enrichVerified()` once from the Apps Script editor (one request per entry, so about 290: needs the Basic tier, not the free one); the page then shows their bottles too. Without a backend, a neutral bottle placeholder is shown.

## Promoting and adding perfumes

Clones: give a clone the original's tags and `{ cloneOf: "<original id>" }`; the page shows "often compared to" and never recommends a clone beside its original. Untagged and auto-tagged names in the sheet are the tagging queue: run `node tools/tag_queue.js ratings.csv catalogue.csv`.

## Run locally

```
python tools/mock_backend.py 8765
```
then open `http://localhost:8765/?endpoint=http://localhost:8765/api`. The `endpoint` override works only on localhost. Without a backend, serve `site/` from any static server; ratings persist in that browser's localStorage.

## Tests

```
node --test tests/*.test.js
```
- `engine.test.js`: 60 seeded rating sets on a frozen 88-perfume catalogue (`tests/fixtures/`) must give the stored profiles, recommendations and one-sample suggestions, and the recommendation rules below must hold. Catalogue edits do not affect it. After an intended engine change, run `node tests/engine.test.js --update` and review the diff of `tests/fixtures/engine_golden.json`.
- `page.test.js`: the page, run in a stub browser, shows what the engine computes, handles clicks, and with a backend never sends the vendor's note lists back.
- `site.test.js`: `site/` holds only web files and every link in it resolves inside it; `evidence.js` and the backend's `VERIFIED` list are current; every family and perfume reference resolves.

## Deploy the site (free)

Any static host works: GitHub Pages, Cloudflare Pages, Netlify. Publish the `site/` folder and nothing else (set it as the publish directory, or upload its contents). Set `endpoint` and `links` in `site/js/config.js` first. After the first deploy, change `og:image` in `site/index.html` to the image's full URL: most share previews ignore a relative path.

## Collect ratings (free, no server)

Follow the steps at the top of `backend/apps-script.gs`, then paste the web-app URL into
`endpoint` in `site/js/config.js`. Each rating change posts one row; the sheet keeps every
version and the stats endpoint counts only the last row per device and perfume. The page also
reads `?stats=1` to show community averages under each rated perfume.

## Affiliate and sample links

`links` in `site/js/config.js` holds three URL templates with `{q}` for the perfume name. Replace them with a
partner shop's search URL plus your coupon or affiliate parameter. Links carry
`rel="sponsored"`; the footer discloses commissions in both languages.

## How the profile is computed

The rules below are implemented in `site/js/engine.js`.

- Ratings are −2 (hate) to +2 (love) per stage. Stage weights: opening 0.6, heart 0.8, drydown 1.0.
- Each perfume stage lists material families with a presence weight 0 to 1. A rating adds
  `value × presence × stage weight` to every family present.
- Complaint chips ("powdery", "sharp / chemical", ...) add negative evidence only to families
  that are both mapped to the chip and present in that perfume at that stage.
- A family is a **likely deal-breaker** when its weighted mean is ≤ −0.7 across two or more
  perfumes with no positive rating; **possible** on one perfume, or on a milder mean across
  several; **mixed** when the same family drew both likes and dislikes.
- Recommendations exclude any unrated perfume with a likely deal-breaker at ≥ 0.5 presence in
  the drydown (or ≥ 0.7 in the heart), then rank by liked-family reward minus twice the
  dislike penalty minus a small unknown-family penalty, one perfume per house.
- When a possible deal-breaker rests on one perfume, the page names one unrated perfume that
  contains that family in its base without the other suspects, so a single sample settles it.

## Editing the catalogue

Each entry in `site/js/data.js`: `p(id, house, name, arabicName, gender, tier, confidence, opening, heart, drydown, notes)`.
Families and weights are the tagger's judgement of what dominates each stage. Confidence 3 means
the tagger has worn it or the consensus is strong; 2 means tagged from reliable descriptions.
Prefer fewer families with honest weights over long lists. After editing, run `node tools/sync_backend.js`
and the tests.
