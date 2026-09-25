# How the 45 Saudi bestsellers were added (26 September 2026)

Records, not tools: the scripts point at a session folder and match exact text. Do not re-run them; the result is
in `site/js/data.js` (the block headed "added 26 Sep 2026") and `../additions.json`.

1. `missing.py` read the two store lists (`../amazon_sa.json`, `../niceone.json`) through `../match_popularity.py` and
   wrote `missing.json`: every listing row that matched no catalogue perfume as a sale. The candidates were chosen from
   it by hand: real sprays and the leading oils, no store-brand copies, body sprays or sets.
2. `research_1.json` to `research_4.json`: four research agents' findings, one per group (men's designer, Arab houses
   and oils, women's designer A and B): the pyramid, accords, Fragrantica page and the sources read for each field.
   Fragrantica pages were read in a browser (WebFetch is refused); Parfumo began serving invented notes after about
   nine page loads, so no claim rests on Parfumo alone.
3. `decisions.js`: per perfume, the catalogue name, Arabic name, gender and tier, the house's pyramid where it and
   Fragrantica disagreed (Yara Moi, My Burberry, Moonlight Patchouli, True Instinct, Hugo Man's 2021 relaunch, the
   Choco Musk and Musk Silk oils), the hand corrections to mapped stages (`set`), and Arabic for new note words.
   Ajmal Raindrops was left out: no reliable pyramid.
4. `tag.js` printed each mapping for review; `gen.js` wrote the entries (notes only through `mapper.js`, no accords),
   `../additions.json` and the Fragrantica page numbers merged into `reference/images/fragrantica_ids.json`.
5. `patch_matcher.py` taught `../match_popularity.py` the store spellings and perfume oils, after which all 45 match
   the listing rows that made them candidates and no existing perfume's matches changed.
6. `toppicks.js`: the data check afterwards. Across 6,000 simulated visitors it lists the 30 most-recommended perfumes
   and compares their musk, vanilla, ambroxan, oud and rose weights with their note lists. No weight needed changing;
   five list musk at the end of a long base and carry it as a trace, which the pick rules leave unnamed.
