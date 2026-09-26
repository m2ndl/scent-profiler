# Project log

Continuity record for the perfume profiler. Newest first.

## 2026-09-26: session close, the catalogue reaches 1,000

At the owner's request the catalogue grew from 333 to 1,000 perfumes (block "added 26 Sep 2026 (the expansion to 1,000)"
in site/js/data.js; record, scripts and README in reference/expansion/). The 667 are the perfumes the Saudi stores list
as best sellers or popular that the catalogue lacked (Golden Scent's Best Sellers, Faces' bestsellers page and badge,
Noon's popularity lists, Sephora's bestsellers, and the earlier Amazon.sa and Nice One lists), 28 of them the best-known
perfumes of the Saudi houses (the owner's added request), each with a full top, heart and base breakdown on Fragrantica,
tagged by mapper.js from the notes, named in Arabic by agents, and given a bottle photo (999 of 1,000 have one; 31 wrong
photos found on the contact sheets were replaced). Three independent checks sampled the store-to-page matching; the
first found 10 blocking errors, the second 4 wrong of 50, the third 1 wrong of 50; all were fixed or removed and the
gaps refilled. The site's older Arabic had cistus as قسط, labdanum as لبنى and pimento as فلفل حلو; corrected to لاذن and
بهار حلو everywhere, on the owner's word. Page speed unchanged (a profile and picks take about 2 ms). Tests 79, all passing.

After deployment, a check of the whole catalogue (structure, same-name versions on Fragrantica, version words in the
store rows, Arabic notes, the live files) found two wrong photos: London for Men and 1881 Men showed the women's bottles
(a Fragella match that dropped the gender word). Both were refetched from their Fragrantica pages and are live (266a57c).

Open, dated 26 Sep 2026:
- 25 older entries have fewer Arabic than English notes in a stage (Bleu de Chanel EDP, Sauvage EDT, Cool Water and
  others), so their Arabic note words likely do not show; offered as a separate task.
- The pyramids are Fragrantica's; the 26 Sep additions preferred the house's own list where they differed, which was
  not practical for 667. Verify_report.md notes N1 to N17 (thin pages, a few doubtful tiers and spellings) are
  the owner's calls.
- The quiz grid still comes from the earlier popularity lists (tools/select_grid.js not re-run).

## 2026-09-26: session close, the site goes live

Session title: the site goes live. Across 25 and 26 September: the quiz result names the palate by the shape of the
kept bottles (one group, two named together, wide, selective) with a short text and a tip; a start screen with a big
Start; one event per screen reached and a result event, with backend counts behind a comparison line (shown from 100
finishers) and a funnel sheet (Profiler menu > Build the quiz funnel). The catalogue grew from 288 to 333 with 45 Saudi
bestsellers from the Amazon.sa and Nice One lists, tagged from published pyramids and checked by eye
(reference/quiz/popularity/additions/). The site went live on GitHub Pages (https://m2ndl.github.io/scent-profiler/,
public repo m2ndl/scent-profiler; a workflow tests, then publishes site/ only), in Arabic by default, with the quiz as
the front page (index.html), the profiler as "Your profile" (profile.html) and quiz.html redirecting. Smaller: a wood
grain header, the search list above the Continue bar, descriptions on 27 note cards, a dark "See the full profile"
button after the picks, plain Arabic for the name of the articles. Last, after a reported case (rose liked, musk
avoided, Montale Roses Musk offered): an avoided note card now keeps out of the picks every perfume it leads, unless a
kept bottle carries it, in which case the result says so; every pick says why it was chosen and names at most one thing
to watch for. A check of the 30 most-recommended perfumes found no weight to correct. Tests 79, all passing. Phone link
current (version 22). All work committed and pushed. Edit scripts kept as evidence in reference/quiz/edits/ (indexed).

Open, dated 26 Sep 2026 (operational):
- Deploy the backend: paste backend/apps-script.gs into Apps Script, deploy a new version, set `endpoint` in
  site/js/config.js. Until then ratings stay on the device and the events, funnel and comparison line are dormant.
- Replace the Google-search placeholders in site/js/config.js `links` with partner shop and affiliate links.
- Finish the grid rebuild with tools/select_grid.js and the refreshed sa_popularity.json (carried from 25 Sep).
- Give the no-bottle (tester) result path the new layout (carried).
- Check the five catalogue entries flagged by the Fragrantica search (carried).
- Tab titles and share previews are still English; Arabic ones were offered, not decided.
- The three-vial test (carried).

Reflective, not scheduled:
- Split the musk note card into clean white musk and heavy Arabian musk oil: the most ambiguous word in the picker, and
  the likely cause of the reported case.
- Whether the complaint chips (too sweet, chemical) should veto picks the way avoided note cards now do.
- The research record and this log are public in the repo; move them to a private repo if that matters.
- Monthly refresh of the Saudi bestseller data; palate names on the profile page (both carried).

## 2026-09-25: session close, the payoff screen

Session title: the payoff screen. Across the day: the site redesigned three times and settled on the apothecary
design; renamed Scent Profiler / محلل الذائقة العطرية; bottle photos for all 288 perfumes; wording fixes (tried on
skin or clothes, زفر); the quiz result rebuilt around a palate name, true counts, a reveal and a share card; Saudi
popularity data collected for the grid. Tests 72, all passing. Phone link current (version 13). Nothing committed.
Edit scripts kept as evidence in reference/design/edits/ with an index.

Open, dated 25 Sep 2026 (operational):
- Commit the whole day's work (quiz, redesign, photos, result screen); it is all in the working tree.
- Finish the grid rebuild: fix the popularity match so Sauvage, Hawas and Aventus count, run tools/select_grid.js,
  write reference/quiz/GRID2.md, apply only after the owner sees the twenty.
- Give the no-bottle (tester) result path the new layout.
- Check the five catalogue entries flagged by the Fragrantica search (task offered).
- Unchanged: deploy the backend, static hosting, shop links, the three-vial test.

Reflective, not scheduled: whether the palate names should also appear on the profiler page; a monthly refresh of
the Saudi bestseller data; whether "ruled out" should count likely deal-breakers only, as recommend() does.

## 2026-09-25: the result's name, count and reveal

The owner judged the payoff still flat. Added, in the quiz page only:
- A palate name with an emblem: nine palates (amber, sweet, oud, musk, woody, rose, floral, fresh, spiced) cover
  the 32 families; the visitor's is the palate of the family the taste card lists first. Dislikes only give the
  selective palate; no signal gives no name.
- A count under it: perfumes checked, ruled out for you (engine.js `ruledOut()`: catalogue perfumes holding a
  likely or possible deal-breaker at the exclusion strength; read-only, recommend() unchanged), chosen for you.
  The numbers count up.
- A reveal before the result (about two seconds, once per visit, a tap skips it, off for reduced motion): the
  visitor's own bottles drop into "You kept" and "Turned on you".
- The share card leads with the emblem, "My palate", the name and the count.
One new quiz test covers the name, the count's truth and the reveal. Tests 72.

Open, dated 25 Sep 2026: the grid rebuild stopped midway when a session ended; tools/select_grid.js exists
and its draft grid drops Sauvage, Hawas and Aventus only because the captured store lists missed them, so it
is not applied. The no-bottle (tester) result path still has the old layout.

## 2026-09-25: the quiz result as a payoff

The result screen now leads with the answer: a taste card (families the visitor is drawn to and their
deal-breaker as chips, each naming the bottles it came from, and a line counting the bottles and answers it
rests on), then the three picks as bottle tiles (photo, a "has" chip, a struck-through "no ..." chip, a Sample
button). The family cards moved into a collapsed "How we worked this out". A share button draws a 1080 x 1350
card (taste chips and the three bottles, first person, in the page language) and hands it to the phone's share
sheet, or saves it where there is none. Engine unchanged; the no-bottle path (testers) is unchanged.
Also added: Prada Paradigme and Dior Homme (2020) to the catalogue, and Saudi popularity data from Nice One
and Amazon.sa (reference/quiz/popularity/) for the grid rebuild, which runs as a separate task.

## 2026-09-25: wording, name and botanical sketches

- The quiz question is now "Which of these have you tried?"; the hint accepts skin or clothes (most Saudis spray
  clothes), home or shop, and rules out a paper strip. "On your skin" left three other Arabic lines.
- Complaint chip حيواني / وسخ became حيواني / زفر; the same word left three family hints and one article line.
- Renamed Scent Profiler / محلل الذائقة العطرية (was Drydown Profiler / محلل القاعدة): the name and the profiler's lede now
  speak of taste across opening, heart and base. The articles keep their drydown subject. New share card
  (site/og.png) from tools/og/card.html in the current design.
- Background: faint line sketches of Redouté's rose and Thomé's lavender in the page margins
  (tools/botanicals.py, site/img/botanical/). Two stronger versions were rejected by the owner.

## 2026-09-25: bottle photos

All 286 perfumes ship with a bottle photo (site/img/bottles/<id>.webp, 160 px transparent, 1.8 MB in total),
listed in the generated site/js/bottles.js; the page shows the shipped photo, then a backend vendor image, then
a drawn bottle. Found by tools/fetch_bottles.py: 207 from Fragella's image CDN by address (background already
removed, no key), 79 from Fragrantica's image server by page number (ids found by web search,
reference/images/fragrantica_ids.json; white background cut away). Every photo was checked on contact sheets;
14 wrong or poor ones (a deodorant stick, sample vials, travel sprays) were rejected and are kept out by
reference/images/rejected.json. Open Beauty Facts was tried first and holds almost no fine fragrance. The
preview build carries the photos inline. Owner's standard, stated this session: accepted practice outranks the
letter of a terms page (memory: custom-over-letter-of-terms).

Open, dated 25 Sep 2026: five catalogue entries whose notes may describe a different perfume (safariextreme,
cdnimwoman, barakkatrouge, mostwantedparfum, layali) and one misspelt name (Spiritueuse Double Vanille),
offered as a separate task.

## 2026-09-25: the redesign

Session title: linen, plum and the wear ribbon. site/site.css rebuilt as a mobile-first design system; no
markup or script behaviour changed, 70 tests pass, the phone link is republished (its page is now the profiler; the quiz is a file beside it).

- Colour: warm linen and bone surfaces with a paper-grain overlay, a warm brown ink, a plum accent for
  everything actionable, moss and madder for good and bad, ochre for cautions. Three stage hues (gold
  opening, rose heart, amber drydown) draw every timeline, the brand mark, the title rule and the panel
  edge. All colours set in OKLCH at matched chroma and checked for WCAG AA (scratch script palette.js:
  ink 13:1, secondary 6:1, small text 4.5:1, every filled button 4.4:1 or better). Dark mode is a warm
  charcoal, not black.
- Type: Fraunces for Latin headings (the articles page already used it; Young Serif dropped), Reem Kufi
  for Arabic headings, IBM Plex Sans Arabic for text. Arabic body 17px at line-height 1.8, no tracking,
  rating labels never break inside a word (the first render broke لا يعجبني across three lines).
- UX: 44px rating buttons that tint red or green on hover before they fill; rated perfumes, verdicts
  and picks are cards; verdict rows wash in their own tint; quiz tiles get a check badge; quiz options
  get a radio mark; the quiz's Continue is sticky at the bottom of a phone screen; the search box has an
  icon; the profile bar keeps to thumb reach. Base rules are the phone; min-width queries add the
  desktop.
- Research inputs (web, 25 Sep 2026): 2026 palette trend towards warm neutrals with one muted accent;
  Arabic web typography guidance (dual-script families, 1.7 to 1.85 line height, zero tracking); touch
  targets 44px with 8px gaps.

- Superseded the same day. A reader called the linen design a newspaper. Three trials followed on the real
  pages as override stylesheets (reference/design/README.md): a khuzama field, then a still life of
  materials from a photograph (amber oil, rose petals, calendula, resin, olive wood), first at night, then in
  daylight, then framed in dark wood with gold lines. The last is now site/site.css: cream glass on pale
  wood, a dark wood band across the top and grain waves fixed along the bottom of the screen, metallic gold
  on the brand, the primary buttons and the profile counts, calendula-rose-amber ribbon, sage and petal rose
  for good and bad. One theme, no dark mode. Arabic headings moved to Noto Naskh Arabic. Phone link
  republished (page is the profiler).

Open, dated 25 Sep 2026: og.png still carries the old teal; commit the redesign with the quiz; a light
sample sits in the bottom strip of the screen for a moment while scrolling (the waves are fixed), which is
the one readability cost to watch; the earlier open items stand.

## 2026-09-25: the bottle quiz

Session title: the quiz built twice. A second page, site/quiz.html with js/quiz.js, lets a visitor who has
rated nothing get a profile; the design came out of a five-voice round table and two plan reviews, and the
owner deepened it the same day.

- Round table (reference/debate/quiz/): four paths for the quiz; landmark bottles (A) took all five first
  places, Borda A 20, B 12, D 12, C 6. Two cited numbers were refuted on re-run. Five books were added and
  converted to page-marked text in reference/books/ (Engen 1991, Barkai and Wilson 2014, Calkin and
  Jellinek 1994, Gilbert 2008, McGee 2020).
- Built (reference/quiz/PLAN.md, VERIFY_V1.md): a grid of twenty well-known bottles, one verdict each
  written as an ordinary rating (still wear +1 drydown; turned -2 on the stage named; shop trial opening
  -1), complaint chips, one narrowing round, anosmia question, testers for a visitor with no bottle, events
  for the record's falsifiers, `src` column and quiz-row skip in the backend. Engine: a complaint chip now
  scores half a point below its rating (11 golden scenarios moved, reference/quiz/E1_golden_diff.txt).
- Deepened at the owner's request (PLAN2.md, VERIFY_V2.md): per-bottle note rows from js/notes.js (up to
  five, balanced by stage, "didn't notice it"), a note picker of 92 single notes on five screens built from
  catalogue frequency, the books and a Gulf list (reference/quiz/edits/build_picker.js), a bitter-or-sweet
  question, multi-select complaints, "I don't remember" options, Back. Told answers enter the engine in
  separate sums and count only for families no bottle judged (`TOLD_W` 0.3 with a prior), so they reorder
  picks but never exclude. The profiler page reads the same answers and rates notes on each card.
- Arabic: the owner's rule, never render "wear" as لبس; every string now uses جرّب or استخدم (memory:
  arabic-wear-not-literal). Fifteen existing strings changed.
- Tests 15 to 70. Phone link (private, no backend): https://claude.ai/artifact/HDFnLa4mnH2fbMQYd1vuXr.
  Nothing committed: 15 modified files and 5 new ones are in the working tree.

Open, dated 25 Sep 2026: commit the quiz; the three task chips (tile aria-labels, the profiler's Enter
duplicate, the lactone split of fruity_sweet); review the changed Arabic lines listed in the session;
decide the picker merges (neroli with orange blossom, suede with leather, pine with cypress); the shop
verdict marks every strong opening family a possible deal-breaker (engine rule, left as is); the earlier
open items (deploy, hosting, links, three-vial test) stand.

Reflective: Jellinek's eight effect classes cannot be expressed by the 32 families; the round table's
falsifiers (ROUNDTABLE.md section 6) are the measures to read once the backend collects events.

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
