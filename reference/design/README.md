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
