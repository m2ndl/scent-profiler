# Design trials, 25 September 2026

Three designs were rendered on the real pages before one was adopted into `site/site.css`. The samples were
override stylesheets on top of the site's own, served from the repo root (launch config `repo-root`, port 8766),
and were removed once the choice was made; this file is the record.

1. **Linen and plum.** Warm linen and bone, a plum accent, gold-rose-amber wear ribbon, paper grain, Fraunces.
   Adopted first, then judged by a reader as closer to a newspaper than to perfume: the editorial apparatus
   (serif, small-caps labels, hairlines, grain) outweighed the small perfume cues.
2. **Khuzama field.** A field of the Gulf desert flower: pale sky, violet haze, warm sand, scattered blooms,
   frosted-glass cards. Answered the newspaper objection; set aside for the third.
3. **Apothecary still life** (adopted). From a photograph of amber oils in corked vials, rose petals, calendula,
   frankincense resin and chamomile on olive wood. Tried first at night (too dark), then in daylight (too
   pastel), then with dark wood at the top and bottom of the screen and gold lines, which is the version in
   `site/site.css`. Palette in OKLCH, contrast-checked: ground #F6E8D0, paper #FCF8F0, ink #2A1B11, gold text
   #8C5F00, bad #A72A68, good #446630, warn #9A5500, ribbon #ECAA0B / #D1528B / #CC6600.

Arabic headings moved from Reem Kufi to Noto Naskh Arabic during the trials: the Kufi blurred at heading sizes.

**Botanical sketches** (added the same day, at the owner's request for a natural touch). A hand-drawn SVG rose
and lavender read as clip art; faded colour plates were too strong behind text. The adopted version is a fine
old-gold line sketch of the flowering tops only, dissolving downward, placed in the page margins: Redouté's
*Rosa centifolia anglica rubra* (Les Roses, 1817-1824) at the top right and Thomé's *Lavandula angustifolia*
(Flora von Deutschland, 1885) above the waves at the left. Both plates are public domain on Wikimedia Commons;
`tools/botanicals.py` rebuilds them.

# The removal pass, 28 September 2026

Asked whether the design was world class, the answer was no: too many effects at once, and four defects on a phone. At
the owner's word five things were removed or changed (site/site.css, site/js/quiz.js, site/js/app.js):

1. The dark waves fixed along the bottom of the screen and the four soft discs are gone. Glass cards passing over the
   waves had looked greyed out (the start screen's four parts, the result's counts).
2. The rose and lavender sketches no longer sit behind the page, where on a phone they fell behind text (the intro on
   a small screen, the footer, the profile's hint). They close every page in a band of their own after the footer.
3. Gold is one flat colour (#D4A94A, #C4973A on hover): a fill on the brand mark, the primary buttons, the selected
   tile's check and the chosen wheel label, and a thin line under the header, the hero and the section titles. The
   metallic gradients, the light that swept across the gold buttons and the palate name, and the emblem's metallic
   ring are gone; the step and pick numbers are gold rings.
4. On a phone the header is one row on every page and screen: the name and one button for the other language (63 px
   high at 360 px wide; the start screen's was 181). Its two links open the footer instead.
5. The quiz grid's sixty photos show the bottle alone. Nine showed the box or props: seven now use their Fragrantica
   page photo, and two are cropped by tools/fetch_bottles.py from reference/images/crops.json (edits/photo_data_edit.py).

Later the same day, at the owner's word: the flat Start button looked poor, and the text needed to read more clearly.
The primary buttons now carry a soft shade of gold (#E3C170 at the top to #CC9E47 at the bottom) with a fine darker
edge; Start is a 56 px block with 16 px corners. Arabic text is set in Noto Sans Arabic, whose letters draw larger and
more open than IBM Plex Sans Arabic's at the same size (the headings' Noto Naskh Arabic is its sister face); Latin text
stays IBM Plex Sans. The two text greys are darker (#4B3B2F and #665344, 8.8 and 6.0 to 1 on the ground). The Arabic
font adds about 65 KB to the first load.
