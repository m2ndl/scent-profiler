# Catalogue expansion to about 1,000 perfumes (26 September 2026)

Owner's request, 26 Sep 2026: expand the catalogue from 333 to as close to 1,000 as possible from the Saudi stores
(Golden Scent, Noon, Sephora, Faces, and the earlier Amazon.sa and Nice One lists); work without stopping to ask; do
not overload the machine (one agent at a time, scripts run one after another).

## Steps

1. Candidates. One table of perfumes the catalogue lacks, from every store list, with the store rank and review
   count kept per source (`candidates.json`). Sets, minis, mists, body sprays, store-brand copies ("inspired by") and
   non-perfumes are left out.
2. Fragrantica pages. Each candidate is matched to its Fragrantica page through the house's designer page
   (`designers/`), by script; what the script cannot place is resolved by one agent at a time.
3. Pyramids. Each page is read by script: top, middle and base notes, accords, sex, year, votes (`pages.json`).
   Parfumo is never used (it serves invented notes after a few loads).
4. Choice. The candidates with a three-stage pyramid, ordered by how many stores list them and how high, until the
   catalogue reaches about 1,000.
5. Tags. Stage weights from `PP_MAP.mapNotes` on the notes only, as in the 26 Sep additions; note words the mapper
   misses get aliases, reviewed across all entries rather than one by one.
6. Arabic. Perfume names and new note words, by an agent in batches, checked by a second agent on a sample.
7. Entries. Generated into a new block of `site/js/data.js`; Fragrantica page numbers into
   `reference/images/fragrantica_ids.json`; photos by `tools/fetch_bottles.py`, contact sheets checked by eye.
8. Checks. `node --test tests/*.test.js`; page speed with the larger catalogue; a fresh verifier agent on a sample of
   entries against their sources; `match_popularity.py` re-run.
