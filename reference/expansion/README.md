# The expansion to 1,000 perfumes (26 September 2026)

667 perfumes were added to `site/js/data.js` (the block headed "added 26 Sep 2026 (the expansion to 1,000)"), taking the
catalogue from 333 to 1,000. They are the perfumes six Saudi stores list as best sellers or popular that the catalogue
lacked, plus the best-known perfumes of the Saudi houses, each with a full top, heart and base breakdown on Fragrantica.

## Store lists

| File | Store | What was read |
|---|---|---|
| `../quiz/popularity/goldenscent.json` | Golden Scent | the Best Sellers category, 1,079 products in the store's order |
| `faces.json` | Faces | the perfume section (2,005) with the Bestseller badge, and the Fragrance Bestsellers page (92) |
| `noon.txt` | Noon | Eau de Parfum, Eau de Toilette, oils and cologne lists in Noon's popularity order, with rating counts |
| `sephora.txt` | Sephora Saudi | the fragrance best sellers (34) |
| `../quiz/popularity/amazon_sa.json`, `niceone.json` | Amazon.sa, Nice One | the lists read on 25 Sep 2026 |

Faces' review counts are syndicated from other stores and were not used; its Saudi signals are the bestsellers page and
the badge. Noon and Sephora block scripts, so they were read in the browser.

## Scripts, in the order they ran

These are the record of how the entries were made. `fragrantica.py` keeps a cache under `cache/` (parsed pages only).

1. `collect_faces.py` wrote `faces.json`.
2. `rows.py` put every store row in one shape and found each row's house among Fragrantica's designers
   (`fragrantica_designers.json`, the site's designer index).
3. `resolve.py` matched each row to one Fragrantica perfume through its house's designer page (`resolved.json`), and
   placed 322 of the 333 catalogue perfumes the same way. `resolve_check.py` holds the 20 cases it got wrong while it was
   built; all 20 pass.
4. `choose.py` scored each perfume the catalogue lacks by the stores that list it and how high, added the Saudi houses'
   most-reviewed perfumes, and read Fragrantica pages in score order until the catalogue would reach 1,000
   (`candidates.json`, `chosen.json`). Fragrantica refused requests faster than one every 8 to 12 seconds.
5. `dupe_check.py` ran each chosen perfume through the catalogue's own name matcher; the flagged ones were read one by one
   against the catalogue entry's notes and either kept as a separate perfume or held back (`decisions.json`,
   `keep_despite_catalogue_match` and `held_back`, each with its reason).
6. `ar_notes.js` built the Arabic note dictionary from the catalogue's own entries (`ar_notes.json`); an agent translated
   the 313 new note words (`ar_notes_new.json`) and four agent batches named the perfumes in Arabic (`ar_names_1..4.json`),
   from `prep_names.py`'s lists. `decisions.json` corrects a few (Allure Homme spelling, labdanum, rock rose, pimento).
7. `gen.js` wrote the entries with `mapper.js` (notes only; rare note words aliased in `decisions.json` `mapalias`), the
   house, sex and tier; `record.json` keeps each entry's pyramid, Fragrantica page, votes and store rows, and the six
   candidates left out to stop at 1,000. `apply.js` inserted the block and the page numbers
   (`reference/images/fragrantica_ids.json`), then `tools/sync_backend.js` and `tools/fetch_bottles.py` ran.
8. `verify_report.md`: an independent agent's check of all 667 by script and 40 by hand against the store listings,
   Fragrantica and the houses' own pages. Its ten blocking and fifteen should-fix findings were applied through
   `decisions.json` (entries removed, two re-pointed to the bottle on sale, names, aliases, tiers) and the gaps refilled
   from the next candidates; a sweep of all 667 for the same two error kinds (a listing that names another perfume, and a
   tie between versions of one name) followed. `apply.js` replaced the block in place.
9. `verify_report_2.md`: a second check of a fresh sample of 50, on identity only: 4 wrong, 2 unsure. Three were an older
   page chosen where Fragrantica has a newer one of the same name, marked with a year the store listings never carry.
   Every entry with such a newer page of 90 or more reviews (15) was re-pointed to it; the rest were removed.
10. `verify_report_3.md`: a third check of another fresh 50: 48 right, 1 wrong, 1 unsure; both removed. Refills came
    from the next candidates each time, so the block stays at 667.

## Known limits

- The pyramids are Fragrantica's. Where a house's own list differs, Fragrantica's was kept; the 26 Sep additions preferred
  the house's, which was not practical for 667.
- The older entries' Arabic had three note words that name another plant: cistus as قسط (costus), labdanum as لبنى
  (storax) and pimento as فلفل حلو (bell pepper). On the owner's decision (26 Sep 2026) `fix_old_arabic.js` corrected them
  across the catalogue, the resinous-amber family's name and hint, and articles.html (to لاذن and بهار حلو); Jubilation
  XXV's heart, whose Arabic had lost guaiac, was mended by hand.
- 25 older entries still have fewer Arabic than English notes in a stage (Bleu de Chanel EDP, Sauvage EDT, Cool Water
  and others); not touched here.
