# Scent Profiler (محلل الذائقة العطرية)

Formerly Drydown Profiler; renamed on 25 September 2026 so the name covers taste across all three stages, not the base alone.

A bilingual (Arabic / English) web tool that profiles what a person dislikes in perfume, by
material family and by stage of wear, then recommends three catalogue perfumes that avoid
those families. Static files, no build step, no accounts.

## Layout

`site/` is the website and the only folder that is deployed. Everything else builds, tests or documents it.

| Path | Purpose |
|---|---|
| `site/index.html` | The front page: the bottle quiz, a first profile from well-known bottles the visitor has worn (see Quiz). Markup only; its scripts are in `site/js/`. |
| `site/site.css` | Shared styles for all pages. The design is built on one idea: a perfume is a timeline and the last hours matter most (rating rows are wear timelines, the side panel is a live profile). A still life in daylight: cream glass surfaces with gold rims on pale wood, a dark wood band across the top and grain waves along the bottom, metallic gold on the brand and the primary buttons; the wear ribbon runs calendula, rose petal, amber oil. One theme, no dark mode. Fraunces and Noto Naskh Arabic for headings, IBM Plex Sans Arabic for text; mobile-first. |
| `site/articles.html` | Four bilingual pieces on why drydowns fail (woody ambers, musk anosmia, notes versus ingredients, the three ouds). The site's reason to be found. |
| `site/profile.html` | "Your profile", the profiler: rate any perfume or sample stage by stage, see the full profile, picks and the one sample that would settle a doubt. Markup only. |
| `site/quiz.html` | The quiz's old address: sends visitors to the front page, query and all. |
| `site/og.png` | Share image for WhatsApp, Snapchat and X previews. |
| `site/js/config.js` | Deployment settings: backend URL and shop links. The one file to edit when the site goes live. |
| `site/js/data.js` | Verified catalogue (333 perfumes: 133 designer, 126 niche, 74 Arab-house including 21 marked clones of an original) and the material-family taxonomy. Only this tier drives recommendations. |
| `site/js/mapper.js` | Note-to-family mapper: turns any published note pyramid into families at confidence 1 (about 380 rules plus accord floors). |
| `site/js/materials.js` | Ingredient-list reader: 97 label materials with families and volatility classes (see Provenance). |
| `site/js/evidence.js` | Generated from `evidence/` by `tools/build_evidence.js`: the book and label layers. Never edited by hand. |
| `site/js/engine.js` | Profile engine: evidence merge, profile, recommendations, the one-sample suggestion. No page code, so tests and tools run the same engine under Node. |
| `site/js/notes.js` | Note questions shared by both pages: which of a perfume's families to ask a wearer about, in which stage and with which of its listed note words, and the quiz's word answers turned into the engine's told items. No page, storage or language. |
| `site/js/page.js` | What both pages share: the words both show, the device store, the photo and escape helpers, the rating sender (one pending send per perfume, sent at once when the page is hidden), the backend calls (lazy catalogue, lookup, stats) and the note rows and shop links both draw. |
| `site/js/app.js` | The profiler page: its own words, rendering and clicks. |
| `site/js/quiz.js` | The quiz page: grid, verdicts, note rows, narrowing round, note picker, taste and complaints, Back, result. Writes ordinary ratings into the profiler's device store through page.js. |
| `backend/apps-script.gs` | Google Sheets backend: anonymous ratings, tag corrections, community stats, and the lazy catalogue (on-demand lookups through the Fragella API, cached for everyone). Includes `enrichVerified()` for bottle images; its `VERIFIED` list is written by `tools/sync_backend.js`. |
| `evidence/` | Inputs to `site/js/evidence.js`: `labels/<id>.txt` (ingredient lists) and `applied_changes.jsonl` (every tag change, with its quote and source). |
| `tools/tag_queue.js` | Reads the ratings and catalogue CSV exports and prints the unverified perfumes people rated, by demand, with a data.js stub for each. |
| `tools/sync_backend.js` | Rewrites the backend's `VERIFIED` list from `site/js/data.js`; `--check` reports whether it is current. |
| `tools/mock_backend.py` | Local stand-in for the backend with a three-perfume fixture, for testing without Google or an API key. Serves `site/`. |
| `tools/fetch_bottles.py` | Finds, trims and ships a bottle photo per verified perfume and writes `site/js/bottles.js`; draws contact sheets for review. Needs Pillow. |
| `tools/botanicals.py` | Makes the two faint background sketches in `site/img/botanical/` from public-domain plates (Redouté's rose, 1824; Thomé's lavender, 1885). |
| `tools/build_artifact.py` | Produces `build/artifact/` for the claude.ai Artifact host (preview only; that host blocks outbound requests and outside images). |
| `tools/lib/site.js` | Loads the site scripts into Node the way the page does; every tool and test reads the catalogue through it. |
| `tests/` | `node --test tests/*.test.js`; see Tests. |
| `reference/` | Research record: the books (kept out of git), the tag audit, the round table. Never deployed; only `tools/apply_audit.js` reads from it. |
| `build/` | Generated output, kept out of git. |

## Provenance: where every tag comes from

Decided at a five-voice round table (reference/debate/ROUNDTABLE.md). Each family weight on each stage
carries a source, and higher evidence overrides lower:

1. **curated** (site/js/data.js): the note list read by a person, the floor for the 333 shipped entries. When the
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

Verified perfumes ship with a bottle photo: `site/img/bottles/<id>.webp`, a 160 px transparent thumbnail, listed in the generated `site/js/bottles.js`. `python tools/fetch_bottles.py` finds them: first Fragella's image CDN by address (house plus name, background already removed, no key needed), then Fragrantica's image server by page number for anything missing (ids in `reference/images/fragrantica_ids.json`; the white background is cut away). It draws contact sheets into `build/bottle_sheets/` for checking every match by eye; a wrong or poor photo is removed with `--drop <id>` and its address is never taken again (`reference/images/rejected.json`). Order on the page: the shipped photo, then the backend's vendor image (auto-tagged perfumes), then a drawn bottle. `enrichVerified()` in the backend is no longer needed for verified perfumes. The claude.ai preview build packs the thumbnails into `js/bottles.js` as data URIs, since that host blocks outside images.

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
- `page.test.js`: the page, run in a stub browser, shows what the engine computes, handles clicks, and with a backend never sends the vendor's note lists back; its "Rate its notes" block writes `noteAnswers`, and loaded after the quiz on the same device it gives the quiz's picks.
- `quiz.test.js`: the quiz page in the stub browser: the start screen, the grid and More perfumes, verdicts written as ratings, the note rows, the narrowing round, the note picker, taste, complaints and anosmia answers, Back, the result and testers, the events and ratings sent to a backend, the palate name and its text, the comparison line, and the profiler reading the quiz's ratings and `?add=`.
- `backend.test.js`: the backend's quiz counts (each device's last result, by palate and deal-breaker) and the funnel built from the screen-reached events.
- `notes.test.js`: the note rows (cap, order, shop limit, tie rule, note words and their Arabic) and the told items built from the quiz's answers.
- `site.test.js`: `site/` holds only web files and every link in it resolves inside it; `evidence.js` and the backend's `VERIFIED` list are current; every family and perfume reference resolves.

## Deploy the site (free)

The site is live at https://m2ndl.github.io/scent-profiler/ (repository m2ndl/scent-profiler). Every push to `master` runs `.github/workflows/pages.yml`: the tests first, then, if they pass, GitHub Pages publishes the `site/` folder and nothing else. Set `endpoint` and `links` in `site/js/config.js` to switch on the backend and shop links. The share image (`og:image` in the three pages) is a full URL, since most share previews ignore a relative path; change it if the site moves.

## Collect ratings (free, no server)

Follow the steps at the top of `backend/apps-script.gs`, then paste the web-app URL into
`endpoint` in `site/js/config.js`. Each rating change posts one row; the sheet keeps every
version and the stats endpoint counts only the last row per device and perfume. The page also
reads `?stats=1` to show community averages under each rated perfume. The same answer carries `quiz`: each
device's last finished quiz result, counted by palate and by deal-breaker, which the quiz's comparison line reads.

The sheet gets a **Profiler** menu with **Build the quiz funnel**. It writes a `funnel` sheet: for each quiz screen
in order, how many devices reached it and what share of those who saw the start screen that is. Run it from the
menu or from the script editor whenever you want a fresh count.

The ratings sheet's last column is `src` (`quiz` for a quiz verdict, empty otherwise). A sheet made before
that column existed gets the `src` header in row 1 on the first rating or stats request after the new
version is deployed; its older rows stay empty there.

## Affiliate and sample links

`links` in `site/js/config.js` holds three URL templates with `{q}` for the perfume name. Replace them with a
partner shop's search URL plus your coupon or affiliate parameter; `{lang}` becomes `ar` or `en`, for shops
whose addresses carry the language. Links carry `rel="sponsored"`; the footer discloses commissions in both
languages. A program that requires its own statement goes in `disclosure` beside the links, one string per
language, and closes the footer of both pages; change the two together.

noon, checked 26 Sep 2026: its affiliate program (affiliates.noon.com) signs up with
an email and a phone number, and its links carry the affiliate's UTM parameters, so the bottle template is
`https://www.noon.com/saudi-{lang}/search/?q={q}` plus those parameters. A purchase counts within 24 hours of the
click; commission depends on the category, up to 10%; payout is by bank transfer once commissions reach AED 200,
about 45 days after the month ends. A noon search found 8 of the 10 perfumes the quiz shows most (Dior Homme 2020
was not found; Serge Lutens Un Bois Vanille was not checked). TOOIJ, the Saudi perfume shop, found about 6 of 40.

## How the profile is computed

The rules below are implemented in `site/js/engine.js`.

- Ratings are −2 (hate) to +2 (love) per stage. Stage weights: opening 0.6, heart 0.8, drydown 1.0.
- Each perfume stage lists material families with a presence weight 0 to 1. A rating adds
  `value × presence × stage weight` to every family present.
- Complaint chips ("powdery", "sharp / chemical", ...) add negative evidence only to families
  that are both mapped to the chip and present in that perfume at that stage. A chip scores half
  a point below the rating it sits on, never above −1.5, so on a −2 rating it counts −2.5 and the
  accused families always score below the perfume's other families.
- A family's strongest stage (`strongestStage`) is the stage where the perfume holds it at the
  highest weight, with a tie going to the later stage.
- An answer on one of a worn bottle's notes (`noteAnswers`, −2 to +2) replaces the stage rating
  for that family in its strongest stage only and counts even when that stage has no rating,
  while a family marked "didn't notice it" (`unnoticed`) gives no evidence at all.
- What the visitor told the quiz in words (`state.told`: notes enjoyed or avoided, bitter or
  sweet, complaints) counts at 0.3 of an item's weight in separate sums, used only for a family
  with no strong bottle evidence, so it can reorder the picks but never sets a class. A family known only from told answers scores their weighted sum over their weights
  plus 0.3, which pulls it toward zero: one full-weight answer gives 0.5, and a 0.3-weight side
  effect of the bitter or sweet answer about 0.23.
- A note card answered "avoid" is also a veto on the picks (`PP_NOTES.avoidedNotes`, `engine.recommend(prof, ratings,
  avoid)`): no pick where that card's family (weight 0.5 or more on the card) leads the heart or the base (0.7 or more,
  and the strongest there), or whose name carries the note, and `ruledOut()` counts those perfumes. A kept bottle that
  holds the family strongly (`pos > 0`) lifts the veto: the bottles win, `recommend()` returns the family under
  `contradicted`, and the quiz result says so under the taste card ("You said you avoid musk, but Yara, which you kept,
  has clean white musks..."). With no avoided card nothing changes, so the engine golden is unaffected.
- Each pick carries `reason`: up to two liked families it has in the heart or base (a liked class, or a clear lean
  from the visitor's words), up to two deal-breakers it is free of, and at most one thing to watch for, in this order:
  an avoided family that is only secondary here (0.3 or more) or only in the opening, a possible deal-breaker, a family
  the visitor's words lean against, a family their bottles split on, then an untried family that leads the heart or
  base. Traces under 0.3 are never named. The quiz shows these as lines on stacked pick cards; the profile page uses the
  watch item for its risk line.
- A family is a **likely deal-breaker** when its weighted mean is ≤ −0.7 across two or more
  perfumes with no positive rating; **possible** on one perfume, or on a milder mean across
  several; **mixed** when the same family drew both likes and dislikes.
- Recommendations exclude any unrated perfume with a likely deal-breaker at ≥ 0.5 presence in
  the drydown (or ≥ 0.7 in the heart), then rank by liked-family reward minus twice the
  dislike penalty minus a small unknown-family penalty, one perfume per house.
- When a possible deal-breaker rests on one perfume, the page names one unrated perfume that
  contains that family in its base without the other suspects, so a single sample settles it.

## Quiz

The quiz is the front page (`site/index.html`). It opens on a start screen
with the promise ("Find what ruins a perfume for you"), five of the grid's bottles, the four parts as numbered
cards, a Start button and, for a returning visitor, a link to rate the samples they tried on their profile
(`site/profile.html`); it states no time. It then shows twenty well-known
bottles (`QUIZ.grid` in `site/js/data.js`) and asks which the visitor has worn, or tried on the wrist in a
shop. "More perfumes" (المزيد من العطور) under the tiles adds the next twenty of `QUIZ.more`, forty bottles in
all: the best-known perfumes in the Saudi stores' lists that the grid lacks, six of each twenty from the Arab
houses, one bottle per perfume line, chosen by `tools/select_more.js` (reference/quiz/MORE.md). The narrowing round
still draws on the grid alone. The search box adds any other catalogue perfume, with a backend lookup for names
outside the catalogue. Each tapped bottle gets one verdict, written at once as an ordinary rating into the device store
the profiler reads (`pp_ratings_v1`), so the profiler shows the same bottles as rated cards.

| Verdict | Rating written | `again` | Chips |
|---|---|---|---|
| I still wear it | drydown +1 | 1 | none |
| I stopped wearing it: it turned on me | −2 on the stage named by "When did it bother you?" (first minutes: opening; first hours: heart; hours later or on clothes: drydown, the default; "I don't remember" keeps the drydown) | 0 | optional, on that stage |
| I stopped for another reason | nothing | | |
| I tried it in a shop and it put me off | opening −1 | null | optional, on opening |
| I don't remember how it ended | nothing | | |

The screens come in four parts, named on a top line ("Part 1 of 4 · Your bottles"): your bottles (grid, verdicts,
note rows, narrowing), notes you know (the note picker), sweet or bitter, and what bothers you (complaints and
anosmia). Every screen but the start screen has a Back button. It restores a snapshot of the screen before (the bottle
queue and position, the round, the narrowing list, the picker screen and "skip notes for the other bottles"), so
round two, narrowing and skip-all go back correctly; answers already given stay.

After "still", "turned" or "shop" comes one screen of the bottle's note rows, from `PP_NOTES.questions(P, kind)` in
`site/js/notes.js` (kind "worn" for still and turned, "shop" for a shop trial). Each row is a family the perfume
holds at 0.4 or more, asked in its strongest stage: at most one opening, two heart and three drydown rows, five in
all; a shop trial gets opening and heart rows only, two at most. A row shows the stage in plain words (first
minutes, first hours, hours later), the perfume's own note words for that family in the page language, and the
family name, for example "First hours · cardamom, pepper · Fresh spices". A row whose family matches no word on the
note list reads "not on its note list", with a hint that some materials are in a perfume without being listed.
The answers run from "Hated it" to "Loved it" (−2 to +2) with "Didn't notice it" set apart, and an answered row
collapses to its answer. They go into the bottle's rating record as `noteAnswers: { family: -2..2 }` and
`unnoticed: [family]`, and the record is sent again. The intro line names the bottle and its number of rows; every
row is optional and Next always works; "Skip the notes for this bottle" is on every note screen, and from the
second bottle on "Skip notes for the other bottles" ends note screens for the visit. The profiler's rated cards
carry the same rows (kind "worn") in a collapsible "Rate its notes" block, which keeps a quiz record's `src`
because its stage ratings do not change.

Every quiz rating also carries `src: "quiz"`. The profiler deletes `src` when the wearer changes that
rating there, and the community averages skip a device's rating while its last version is a quiz verdict.
A bottle counts as rated only when a stage is set; its tile shows "already rated" and cannot be answered.

After the verdicts comes one narrowing round. For each possible deal-breaker seen in one perfume, most
negative first, the page offers unrated grid bottles that hold that family at 0.6 or more in the drydown and
each other family that was at 0.4 or more in the offending perfume's stage at under 0.2, four at most. The
rule differs from settleSuggestion's twice: it also runs when the offending perfume has no other family at
0.4 or more (settleSuggestion skips those), and it leaves out bottles answered on this visit, including any
answered "another reason". The visitor may answer them, with the same verdict and note screens, or skip with
"None of these, or I don't know them".

Everyone then answers the told questions, answers in words kept in `pp_quiz_v1`:
- **Note picker** (part 2): four screens of single notes (`QUIZ.notePicker`: fresh and green; flowers and fruit;
  spices and sweets; woods, resins and musks). Each card offers "I enjoy it", "I avoid it" and "Not sure" (the
  default), with a one-line hint on less familiar notes. A card is hidden when its word was on a bottle row the
  visitor answered, alone or as a whole word inside a longer word on a row of the card's main family ("musk" in
  "white musk", but not "apple" in "pineapple" or "orange" on an orange blossom row). A screen with no card left
  is skipped. Stored as `notes: { noteId: 1 | -1 }`.
- **Sweet or bitter** (part 3): bitter and fresh, sweet, both, or I don't know; stored as `taste`. "Bitter" adds +1
  to the bitter side of `QUIZ.taste` and −1 to the sweet side, each scaled by its weight; "sweet" does the reverse;
  the other two add nothing.
- **Complaints** (part 4): any number of six chips, or "Nothing has bothered me" or "I don't know", each of which
  clears the others. Stored as `told: [chipId]`, with `toldNone` for "Nothing has bothered me"; an older string
  value is read as a one-item list, and "none" as `toldNone`.
- **Anosmia** (part 4): whether people call a perfume strong on them when they can barely smell it (yes, no, not
  sure); stored as `anosmia`.

Both pages turn these answers into the same told items (`PP_NOTES.toldItems`) and pass them to computeProfile
(see How the profile is computed): they can reorder the picks but never set a class; an avoided note card also vetoes
the picks it leads, unless a kept bottle carries it. The
complaints also order the testers, and anosmia yes or not sure adds a note naming the white-musk tester and its
sample link. Known limit: "peach" maps to the sweet-fruit family, which also holds berries and pineapple. A
separate data task, the lactone split, will give peach, apricot, coconut, osmanthus and tuberose their own family.

The result lists the profile's families with the bottles each rests on. Evidence from a note answer names the note
("Sauvage: you hated the ambroxan (hours later)"). When a picker card or complaint chip that gives a classed family
0.5 or more points the other way, the family names it: "Your bottles and your answer (lemon) disagree; your bottles
count more." Below it, the visitor's own words are listed
("You enjoy: lemon, tea", "You avoid: peach", "You prefer bitter to sweet", "Has bothered you: too sweet"), each
marked "from what you told us". A white musk, woody amber, creamy sandalwood or dry cedar row the visitor did not
notice brings the anosmia note, naming that bottle and family, whatever the anosmia answer was.

Three recommendations appear from two rated bottles, or from any number once a told item is positive (an enjoyed
note, or a side of the taste question); avoid-only answers barely move the zero-bottle picks, so they do not
unlock them. With no rated bottle and a positive told item, the heading reads "Based only on what you told us" and
the testers follow under "Samples that would confirm it". Otherwise a visitor with no rated bottle gets the three
testers alone (`QUIZ.testers`: the tested family at 0.8 or more in the drydown, no other family at 0.4 or more,
designer tier), each with the number of other catalogue perfumes that carry its family in the base; the tester
whose family weighs most in the told complaints' family maps comes first. The profiler uses the same gate and
heading, and its profile section adds "Also uses <n> answers from the quiz." with a link to the quiz. Its risk
line for a family known only from answers against it reads "which you said you avoid" when an avoided picker card
gives that family 0.5 or more, and "which your quiz answers lean against" otherwise (a taste answer, a complaint
chip, or a card's lesser family). "Rate it when you have worn it"
opens `profile.html?add=<id>`, which adds that perfume on the profiler (retrying once the lazy catalogue loads, for
looked-up ids) and then removes the parameter from the address.

The result opens on the palate name and its emblem. The name follows what the kept bottles show: each kept bottle
counts for one of nine palate groups (the group of its strongest liked family, weighted by that family's presence),
and the lead group names the palate alone when it holds more than twice the next group's weight. Otherwise both are
named ("The Oud and Musk Palate"), and from four bottles a third group the lead does not outweigh makes "The Wide
Palate". Dislikes only give "The Selective Palate". One sentence under the name says what the bottles show; below the
taste card come the comparison line and a tip for the lead group. The wide and selective palates keep their tip
under the name, since there the deal-breaker is the finding. The comparison line appears only once 100 people have
finished the quiz: the share who hold the visitor's strongest deal-breaker, or, without one, the same palate.

Events (`events` sheet) and the falsifier each one measures (reference/debate/quiz/ROUNDTABLE.md, section 6):

| Event | n | Measures |
|---|---|---|
| `quiz_grid` | bottles tapped, 0 for "None of these" | over half of starters tap no bottle; median taps below two |
| `grid_more` | the extra bottles now shown (20, then 40) | how far visitors look past the twenty (no falsifier) |
| `verdict:still`, `verdict:turned`, `verdict:other`, `verdict:shop`, `verdict:unsure` | chips attached; the event goes out when the visitor leaves the bottle, after its note screen | "another reason" under 10 percent of stops; median visitor ticks four or more chips; "I don't remember" over a quarter of verdicts |
| `when:unsure` | 0 | over half of "turned" verdicts cannot name the stage, so most −2s rest on the drydown default |
| `notes:<rows answered>`, `notes:skip`, `notes:skipall` | rows on the screen | median answered rows under one per note screen, or skip and skip-all together over half of note screens; with the ratings rows, a note answer's sign contradicts a later profiler rating of that stage over a quarter of the time |
| `like:<note>`, `avoid:<note>` | 0; sent for each answered card when the visitor leaves the picker screen | over 80 percent of answered cards are "avoid"; among later raters, families of avoided notes score no lower than others |
| `taste:bitter`, `taste:sweet`, `taste:both`, `taste:unsure` | 0 | "I don't know" over 40 percent; among later raters, bitter answerers' sweet-side families score no lower than sweet answerers' |
| `told:<chip>`, `told:none`, `told:unsure` | 0; one per chip ticked | told families score no lower than others among later raters; median visitor ticks four or more complaints |
| `anosmia:yes`, `anosmia:no`, `anosmia:unsure` | 0 | "yes" over 25 percent |
| `quiz_done` | ratings with a stage set | completion under 50 percent (against `quiz_grid`); with the ratings rows, under half of two-bottle visitors reach a deal-breaker class |
| `tester:<id>` | the card's position, 0 for the anosmia note's link | under 5 percent open a tester link; with later ratings of that id, under 10 percent of zero-bottle visitors return with a verdict |
| `sample:<id>` | the recommendation's position | sample-link use from the quiz's recommendations (no falsifier) |
| `reach:<screen>` | 0; one per screen reached: `start`, `grid`, `verdicts`, `notes`, `narrow`, `picker:1` to `picker:5`, `taste`, `told`, `anosmia` | the funnel (Build the quiz funnel): where visitors stop |
| `result:<palate>:<deal-breakers>` | ratings with a stage set; deal-breakers joined by `+` | the counts behind the comparison line; sent again when a changed answer changes the result |

Each event goes out once per visit, when its screen is first left (a `reach` event when it is first shown), so
going Back and answering again sends nothing new; only a changed result sends a new `result` event. The ratings rows measure the rest: a later profiler rating of a quiz bottle whose sign contradicts the
verdict (over a quarter of the time falsifies the mapping), and whether bottles given "too sweet" hold
vanilla or tonka at 0.4 or more in the drydown.

Local run: `http://localhost:8765/?endpoint=http://localhost:8765/api` (the quiz); the profile page is
`profile.html` with the same parameter. Links from the quiz to the profile carry the `endpoint` parameter.

## Editing the catalogue

Each entry in `site/js/data.js`: `p(id, house, name, arabicName, gender, tier, confidence, opening, heart, drydown, notes)`.
Families and weights are the tagger's judgement of what dominates each stage. Confidence 3 means
the tagger has worn it or the consensus is strong; 2 means tagged from reliable descriptions.
Prefer fewer families with honest weights over long lists. After editing, run `node tools/sync_backend.js`
and the tests.
