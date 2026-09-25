# Round table: what should be the source of truth for a perfume's material families?

## The product
A bilingual web tool where people rate perfumes they have worn by stage (opening, heart, drydown).
The tool infers which MATERIAL families a person dislikes (woody ambers, white musks, oakmoss, oud
accords and so on, 28 families today) and recommends perfumes that avoid them. Its thesis: marketing
"notes" are not ingredients, and the drydown is what makes a bottle unwearable.

Code and data: C:\Users\malha\Desktop\Webapps\perfume-profiler (data.js holds 286 curated entries with
per-stage family weights; mapper.js turns note words into families; apps-script.gs is the backend
with an on-demand lookup through the Fragella API).

## The problem
Every entry needs, per stage, the material families present and how strongly. Nobody publishes that.
- Brands publish note pyramids (marketing). Reference sites (Fragrantica, Parfumo) copy them and add
  crowd votes on notes and accords. Data vendors (Fragella, 80k perfumes, API from $12/month; FragDB,
  140k, CSV, $1,000/year) aggregate the reference sites.
- The 286 entries were tagged by an AI from memory of note lists plus judgment. An audit against
  Turin and Sanchez (Perfumes: The Guide 2018) and Ohloff, Pickenhagen, Kraft and Grau (Scent and
  Chemistry, 2022) found evidence for only 68 of 286, and corrected tags on 40 of those 68. Results
  are in reference/audit/ (tags_part*.json, *_summary.md, taxonomy_audit.md, applied_changes.jsonl).
- Ingredient lists (INCI) printed on boxes and shown on retailer pages name real molecules in
  descending concentration, and EU regulation 2023/1545 adds 56 allergens to the 26 already required
  (labels from 31 July 2026 for new products, 31 July 2028 for all). Coumarin, evernia, santalol,
  ionones, damascones, vanillin, eugenol, linalool, limonene appear.
  CORRECTION (verified against the published list of the 56 additions): the additions include
  "Tetramethyl acetyloctahydronaphthalenes" (OTNE, sold as Iso E Super), "Hexamethylindanopyran"
  (HHCB, sold as Galaxolide), "Hexadecanolactone" (Exaltolide, a macrocyclic musk), "Acetyl cedrene",
  "Rose ketones" (damascones), santalol, sclareol and vanillin. Ambrox, Cashmeran, Norlimbanol and
  Habanolide are NOT on the list. So from 31 July 2026 (new products) and 31 July 2028 (all),
  labels must name Iso E Super and Galaxolide when present above 0.001 percent, which is almost
  always when they are used at all. Source: cosmeservice.com summary of Regulation 2023/1545.
- Scent and Chemistry gives formula percentages for a few dozen classics. Nothing like it exists at
  scale. GC-MS analyses of commercial perfumes are rare and mostly private.
- The site will collect stage-split ratings from anonymous wearers. The owner judges ratings too
  unreliable to rewrite tags: anosmia (6 to 9 percent cannot smell some musks), skin, vocabulary,
  small numbers, gaming.

## Constraints
Solo builder, no interviews or surveys, no staff, near-zero budget (tens of dollars a month), Saudi
and global audience, Arabic and English, launch within weeks, must be legally clean (no scraping
Fragrantica; its terms forbid it).

## The paths under debate
A. Provenance stack. Tags carry a source: notes (vendor pyramid through the mapper) < INCI ingredient
   list (through a material table with volatility classes for stage) < quoted literature or formula.
   Higher evidence overrides lower. Ratings never rewrite tags; they only flag a tag for review.
B. Vendor and crowd first. License a vendor feed (notes, accords, crowd-derived "note occurrence"),
   map it mechanically, skip the material layer, and spend the effort on scale and product. Accept
   marketing-level accuracy; correct only what users flag.
C. Materials first. Build only from ingredient lists, formula disclosures, expert statements naming
   materials, and any GC-MS in print. Small, slow, true catalogue; no marketing notes at all;
   perfumes without material evidence stay untagged.
D. Data first. Collect stage-split ratings at scale and infer latent families statistically
   (perfumes whose drydowns the same people hate cluster). Tags are weak priors only. Accept that
   the first year runs on priors.

## What each advocate must produce
A brief of at most 1,200 words for the assigned path, in plain English, no em dashes, no metaphors:
1. The claim: what the path delivers in 3 months and in 12 months (coverage, accuracy, cost, effort).
2. Evidence, at least eight items, each with a source: a URL you fetched, or a file path and line
   in reference/ (quote at most 15 words from a book). Test claims where you can: for example, fetch
   a retailer product page and check whether it shows an ingredient list; check whether the Fragella
   or FragDB documentation includes ingredients or only notes; check what the EU allergen list
   actually contains; look for studies on inferring odor character from preference data; check the
   Open Beauty Facts coverage of perfumes.
3. The path's failure modes and what would falsify it.
4. The weakest point of each rival path, one paragraph each, with evidence where you have it.
5. A cost line: money per month and builder hours to first useful version.

Rebuttal round (later): read all five briefs, answer the strongest objection to your path in at most
400 words, then cast a Borda vote: rank all four paths 1 to 4 with one sentence per rank. You may
rank your own path anywhere; honesty is rewarded because the tally is public.

## Participants
Four advocates (one per path, model Opus) and one further participant (Fable, the session's own
model) who argues and votes like the others and does not chair. A chair (Opus) tallies the votes
and writes the summary without adding a preference of its own.
