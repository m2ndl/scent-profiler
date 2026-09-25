# Round table: how should a quiz profile a visitor who has rated few or no perfumes?

## The product as it stands
A bilingual (Arabic, English) static site plus a Google Apps Script backend. A visitor rates perfumes
they have worn at three stages (opening, heart, drydown) from -2 to +2, optionally attaching complaint
chips (too sweet, powdery, sharp / chemical, soapy, heavy, smoky, animalic, sour, too loud, faded fast).
The engine (site/js/engine.js) turns ratings into a profile over 32 MATERIAL families (woody ambers,
white musks, vanilla, tonka, oud accords, patchouli, and so on), then recommends three catalogue perfumes
that avoid the disliked families. Thesis: marketing notes are not ingredients, and the drydown is what
makes a bottle unwearable. The profile is dislike-first: the page says a family is a "likely
deal-breaker" only when two or more perfumes point the same way, and "possible" on one.

Code: C:\Users\malha\Desktop\Webapps\perfume-profiler. Read README.md (section "How the profile is
computed"), site/js/engine.js (177 lines), site/js/data.js (FAMILIES with lay descriptions in both
languages, CHIPS, 286 perfumes), site/js/app.js (the page). Load the catalogue in Node through
tools/lib/site.js, never by copying code:
  node -e 'const {loadSite}=require("./tools/lib/site.js"); const W=loadSite("data"); console.log(W.PP_DATA.PERFUMES.length)'
The previous round table on data provenance is in reference/debate/ROUNDTABLE.md; its decisions stand
(curated < notes < label < book; ratings never rewrite a tag; every verdict shows its source).

## Facts already established (re-derive if you doubt them)
- Engine mechanics: rating × presence × stage weight (opening 0.6, heart 0.8, drydown 1.0) × provenance
  weight (book and label 1, curated and vendor notes 0.75); vendor-only entries at half weight. Classes:
  badLikely (mean ≤ -0.7, two or more perfumes negative, none positive), badPossible, mixed, goodLikely,
  goodPossible. recommend() drops any unrated perfume with a likely deal-breaker at ≥ 0.5 drydown or
  ≥ 0.7 heart, then ranks reward minus twice the penalty minus an unknown-family penalty, one per house.
  settleSuggestion() names one unrated perfume that isolates a possible deal-breaker seen once.
  The engine holds no DOM, storage or language; the page supplies state = { ratings, auto, images }.
- Catalogue: 286 verified perfumes (125 niche, 98 designer, 63 Arab-house; 111 men's, 64 women's, 111
  unisex). Perfumes a likely deal-breaker would exclude from recommendations, by family:
  vanilla 114, woody amber 99, white musk 93, amber resin 82, tonka 56, sandalwood 28, patchouli 24,
  oud (smoky) 23, white floral 22, dry cedar 21, leather 21, tobacco 21, vetiver 19, rose 18, iris 10,
  warm spice 10; eight families exclude 8 or fewer; seven families (citrus, animalic oud, animalic,
  saffron, muguet, rose ketones, skin musk) exclude none. So about ten families decide recommendations.
- The well-known bottles are already verified entries: Sauvage (EDT, EDP, Elixir), Bleu de Chanel (EDP,
  Parfum), Aventus, Eros, Baccarat Rouge 540, Black Opium, Libre, La Vie Est Belle, Good Girl, Coco
  Mademoiselle, Acqua di Giò (EDT, Profumo), Invictus, 1 Million, Oud Wood, Tobacco Vanille, Santal 33,
  Interlude Man, Ombre Nomade, Layton, and the Gulf staples Khamrah, Yara, Asad, Bade'e Al Oud, Ameer Al
  Oudh, Club de Nuit Intense Man, Hawas, Kalemat, Shaghaf Oud, Amber Oud, Supremacy. Some are nearly pure
  tests of one family: Sauvage EDP drydown is woody_amber 1.0 with nothing else above 0.3; Coco
  Mademoiselle is patchouli 0.9; Yara is vanilla 0.9 plus white musk 0.7.
- Each family carries a lay description in both languages (data.js, FAMILIES.hint_en / hint_ar), for
  example "Clean-laundry musk: soft, slightly soapy, like freshly ironed cotton" and "Pencil-shavings
  wood, transparent and dry". Complaint chips map to families with weights (data.js, CHIPS).
- Anosmia: the book Scent and Chemistry puts Galaxolide anosmia at about 30 to 37 percent
  (reference/books/scent_and_chemistry_2022.txt:1992); the site's articles discuss musk and woody-amber
  anosmia. No rating question can detect it; a direct question might.
- Audience: Saudi first, then Gulf and global; men and women; shares by WhatsApp and Snapchat; people
  here know raw materials (oud, bakhoor, luban, rose water, cardamom, saffron, musk) from daily life
  and mostly like them. Many have owned Sauvage, Bleu, Eros, Club de Nuit, Khamrah, Yara, Hawas.
- Constraints: one builder, near-zero budget, static hosting, no accounts, both languages from day one,
  weeks not months. Engine changes need a reviewed golden-fixture diff (tests/fixtures/engine_golden.json).

## The question
The site works only for people who have already worn and remember perfumes. The owner wants a quiz that
asks questions, narrows a profile as it goes, asks about very well-known perfumes such as Sauvage, and
still gives a taste profile and recommendations when the visitor has chosen no perfume at all. What should
the quiz ask, what may it honestly conclude from the answers, and how does its output enter the engine?

## Positions already taken in conversation (attack them; none is settled)
The session model gave three successive answers to the owner, each reversing part of the last.
1. Landmark bottles rated by stage plus everyday-smell anchors (bakhoor, luban, rose water, talc, wet
   soil) mapped to families; categories only as output labels; anchors count at low weight.
2. Reversal: everyday smells are useless here because this audience likes nearly all of them and a natural
   material is not the accord in a bottle; ask instead about failures (the chips) with an optional
   remembered perfume; one verdict per bottle (still wear / stopped wearing), never three stages; with zero
   bottles the honest output is a "starter set" of three diagnostic samples, not a profile; categories are
   family bundles derived from co-occurrence in the catalogue.
3. Reversal: a profile from zero bottles is legitimate because the site already grades evidence by source,
   and stated preference is the lowest rung; ask forced choices over the family descriptions ("which of
   these four would you least want on your skin at the end of the day?", then "which most?"); three screens
   of four order the ten deciding families in six answers; landmarks then test the stated ranking and
   the existing "mixed" class handles contradictions; result = ranking, three recommendations labelled as
   resting on stated preference, then the starter set as "what would confirm this"; categories are names
   for the top of the ranking.
The owner's own framing: predefined profile categories, questions that narrow to one, well-known bottles
as questions, a profile even with no bottles.

## The paths under debate
A. Landmarks first. A grid of about twenty well-known bottles with images; tap the ones you have worn;
   one verdict each (still wear it / stopped wearing it / tried, never bought). Verdicts map mainly to the
   drydown and enter the engine as ratings. With zero bottles, no profile: the page shows a starter set of
   three diagnostic samples chosen to split the deciding families, each labelled with what a failure would
   prove. Narrowing = skipping bottles whose families earlier answers already settled.
B. Stated preference over materials. Forced-choice screens over the families' own lay descriptions
   (pick the worst and best of four); the answers rank the ten deciding families; the ranking enters the
   engine as a new, lowest-weight evidence source; landmark verdicts then confirm or contradict it. Always
   a profile, always labelled "from what you told us" versus "from what you wore". Named categories are
   labels for the top of the ranking.
C. Archetype quiz. Six to eight predefined profile types (for example sweet and warm; clean and fresh;
   dry woods; oud and resin; earthy chypre; smoky leather; powdery floral), each defined as a family set.
   A short decision tree of lifestyle and preference questions (occasion, climate, "fresh or sweet",
   loud or close, sweet tooth, what you burn at home, what you disliked before) narrows to one type; a few
   landmark bottles refine it. Always produces a type with recommendations, shareable by name. The type's
   family set enters the engine as a prior.
D. Experience anchors. Dislike-first questions about lived failures and perceptions rather than materials
   or types: "has a perfume ever been too sweet on you, soapy, chemical, heavy, gone in an hour, made you
   feel sick?" (the existing chips, optionally with the remembered bottle), "do people say a perfume is
   strong on you when you barely smell it?" (anosmia), "which everyday smells do you avoid?" (a short
   list). Chips without a bottle enter as weak negative evidence on their families; a chip with a bottle is
   a full rating; anosmia flags block a white-musk or woody-amber signature recommendation. Landmark
   bottles follow. Zero-bottle output is a list of possible deal-breakers plus the starter set.

Paths may be combined in the amended path; the vote is on which should be the spine of the quiz.

## What each advocate must produce (round 1)
A brief of at most 1,200 words for the assigned path, plain English, no em dashes, no metaphors:
1. The claim: what a visitor with zero bottles gets, what a visitor with three bottles gets, how many
   screens and seconds the quiz takes, and how the output enters engine.js (name the function and the
   change, if any).
2. Evidence, at least eight items, each with a source: a URL you fetched (say what it showed), a paper
   (title, year, venue, what it found; use WebSearch, WebFetch, Consensus or Semantic Scholar), or a file
   path and line in reference/ or site/ (quote at most 15 words from a book). Areas worth testing: how
   well people judge odours from verbal descriptions and how stable stated odour preference is; the
   reliability of best-worst or forced-choice scaling with few items; cold-start preference elicitation
   in recommender systems; what existing perfume quizzes ask (Sephora, Scentbird, Parfumado, Fragrantica
   and others) and any published completion or conversion figures; anosmia prevalence; Gulf perfume
   habits; Jellinek's odour-effects axes (reference/books/jellinek_psychological_basis_1997.txt and
   reference/audit/jellinek_axes.md); anything in Perfumes: The Guide 2018 on how consumers describe
   what they dislike.
3. A worked example: the first five screens in English (question text and options) and the result screen
   for a visitor who has worn nothing, then the result for one who stopped wearing Sauvage EDP and still
   wears Khamrah.
4. Failure modes and what would falsify the path within three months of launch.
5. The weakest point of each rival path, one paragraph each, with evidence where you have it.
6. A cost line: builder hours to first useful version, engine change yes or no, golden fixture touched
   yes or no.
Mark any claim you could not check as UNCHECKED. Do not run git. Write your brief to
reference/debate/quiz/round1_<letter>.md (Fable: round1_fable.md).

## Round 2
Read all five briefs. Answer the strongest objection to your path in at most 400 words. Then cast a Borda
vote: rank paths A to D from 1 to 4 with one sentence per rank. You may rank your own path anywhere;
the tally is public. Write to reference/debate/quiz/round2_<letter>.md.

## Participants
Four advocates (one per path, model Opus) and one further participant (Fable, the session's own model)
who argues for whatever it finds best, votes like the others and does not chair. A chair (Opus) tallies
the votes, checks the citations it can, and writes ROUNDTABLE.md in the format of
reference/debate/ROUNDTABLE.md without adding a preference of its own.
