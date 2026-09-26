# More perfumes: the forty bottles after the grid

The grid screen ("Which of these have you tried?") shows the twenty `QUIZ.grid` bottles. "More perfumes"
(المزيد من العطور) under them adds `QUIZ.more` twenty at a time, forty in all; the search box still reaches every
other catalogue perfume. The list is chosen by `tools/select_more.js`, which prints it and writes nothing.

## The rule

The forty best-known perfumes in the Saudi stores' lists that the grid lacks, one bottle per perfume line.

- **Popularity.** Each store that lists a perfume as a best seller or popular adds 0.5, plus up to 0.5 for its place
  in that list: Golden Scent's best sellers, Nice One's most popular, Amazon.sa's best sellers, Sephora's best
  sellers, Faces' bestsellers page (0.1 for its badge). Noon adds up to 1.0 above its 0.5: up to 0.5 for its rating
  count and up to 0.5 for a "best in category" badge. This is the score `reference/expansion/choose.py` gave the
  667 additions, now for all 1,000.
- **Arab houses.** Six of each twenty. Their bottles sell mostly on Noon and Amazon.sa, and the other stores' lists
  leave them out, so a single ranking would have crowded them out.
- **Men's and women's.** Never more men's than women's in a set, and at most two more women's. The grid leans to
  men's (nine to six), so across the grid and both sets the two come out even: 26 men's, 24 women's, 10 unisex.
- **One per line.** No flanker of a bottle already shown, the grid's included: Sauvage Eau de Toilette is left out
  because the grid has Sauvage Eau de Parfum. A line's women's and men's bottles count as different lines.
- **At most two per house** among the forty; never a clone beside its original; a bottle photo; a deciding family
  at strength (the grid's own rule, from `tools/select_grid.js`).
- **Open checks left out:** the five entries whose notes may describe another perfume (PROJECT_LOG, 25 Sep 2026)
  and those `reference/expansion/verify_report.md` leaves to the owner for identity, sex or pyramid.

Each place in a set goes to the most popular bottle that fits; each set is listed by popularity.

## The forty

| | First twenty | | Second twenty |
|---|---|---|---|
| 1 | Giorgio Armani Stronger With You Intensely | 21 | Tom Ford Noir Extreme |
| 2 | Dior Miss Dior Blooming Bouquet | 22 | Chanel Allure Homme Sport |
| 3 | Jovan Musk for Women | 23 | Gucci Flora Gorgeous Gardenia |
| 4 | Calvin Klein Beauty | 24 | Valentino Donna Born In Roma |
| 5 | Yves Saint Laurent Y Eau de Parfum | 25 | Versace Crystal Noir |
| 6 | Givenchy L'Interdit Eau de Parfum Rouge | 26 | Roberto Cavalli Paradiso |
| 7 | Lancôme Idôle | 27 | Boucheron Quatre pour Femme |
| 8 | Prada Paradoxe | 28 | Tom Ford Ombré Leather |
| 9 | Jean Paul Gaultier Le Male Le Parfum | 29 | Givenchy Gentleman Eau de Parfum Boisée |
| 10 | Rabanne 1 Million | 30 | Dior Hypnotic Poison |
| 11 | Hugo Boss Boss Bottled Night | 31 | Viktor&Rolf Spicebomb Extreme |
| 12 | Montblanc Explorer | 32 | Narciso Rodriguez For Her Eau de Toilette |
| 13 | Gucci Bloom | 33 | Montblanc Legend |
| 14 | Versace Dylan Blue | 34 | Hugo Boss Boss The Scent |
| 15 | Afnan 9pm | 35 | Lattafa Qaed Al Fursan |
| 16 | Reef 33 | 36 | Rasasi Shuhrah Pour Homme |
| 17 | Ajmal Sacrifice for Her | 37 | Swiss Arabian Jannet El Firdaus White |
| 18 | Ajmal Evoke for Her | 38 | Lattafa Eclaire |
| 19 | Afnan Supremacy Collector's Edition Pour Homme | 39 | Al Majed Oud Pure Musk |
| 20 | Arabian Oud Only White | 40 | Rasasi Emotion |

## Sources and limits

Store rows reach a catalogue perfume three ways: through its Fragrantica page (`reference/expansion/resolved.json`,
`record.json`), through `reference/quiz/popularity/sa_popularity.json` for Amazon.sa and Nice One, and through
`reference/quiz/popularity/unresolved_sales.json` for the rows the Fragrantica resolver could not place. That third
file (`match_unresolved.py`) runs the catalogue's own name matcher over those rows; twelve were accepted by hand
where the leftover word is the seller's or a typo, each with its reason. Without it Afnan 9pm (Amazon.sa men's
number 1) lost its place to its flanker 9 PM Night Out. One placement is corrected in the tool: resolved.json
put the catalogue's Ombré Leather (the 2018 Eau de Parfum) on the 2021 Ombré Leather Parfum's page, so the rows
naming the Parfum are left out of its score.

The captured lists still miss some bottles well known in the Gulf (Lattafa Asad, Arabian Oud Kalemat, Ajmal Amber
Wood score low or nothing), so they are not among the forty; the search finds them. The narrowing round ("One more
would settle it") still draws on the grid alone.

`reference/quiz/more_equiv.js` is the lockstep harness of `reference/restructure/shared_page/run_equiv.js` with the
new button's block set aside: over 400 seeded visits, the quiz and profiler before and after this change matched at
every step apart from that block. Evidence, not a tool.
