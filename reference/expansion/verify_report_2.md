# Identity check of 50 added perfumes

Question per entry: do its store rows in `record.json` name this exact Fragrantica perfume? Checked against the house's
designer list in `cache/designers/`, the cached pages in `cache/perfumes/`, the matcher's notes in `resolved.json`, and the
catalogue above the expansion block in `site/js/data.js`.

Result: **44 right, 4 wrong, 2 unsure.** Three of the four wrong entries are the older of two or more Fragrantica pages
with the same name.

## Sample

Python `random.Random(20260927).sample(pool, 50)`, where `pool` is the 601 ids of `record.json`, in file order, that have
store rows and were not in the first report's sample. The 28 Saudi-house entries have no store rows and are not in the pool.

aqvaph, byzance, insolenceedp, robertocavalliuomo, almajeoudaris, summeryellow, ralplaurromance, labelleparadisegarden,
placevendome, erosedp, robertocavallineroassoluto, ejaazi, lightblueeauintenseph, blackopiumoverred,
allurehommeeditionblancheedp, fahrenheitleparfum, asrar, azzaroph, pradaparadoxevirtualflower, valayaexclusif,
adidasicedive, alfareed, ardenbeauty, scandalphabsolu, ckone, prestigetopaz, acquadigioparfum, egoisteplatinum,
justcavalli, jaguarclassicblack, coachedt, valentinouomo, fakharlattafa, afna9pmnightout, onlywhite, givenchyph,
caroherr212sexymen, dioraddictedp, romance, polored, aliengoddessintense, bossbottledunlimited, boccanera,
scandalphleparfum, versaceph, gentlemanedtintense, moustacheedp, mystiquebouquet, secretmusk, eaudombreleather.

## Wrong

| Entry | Store rows | What they name instead, and the evidence | Fix |
|---|---|---|---|
| `insolenceedp` (fid 4566, 2008) | Golden Scent "Guerlain Insolence EDP - 75 ml Eau de Parfum For Women", Noon "Guerlain Insolence EDP 75ml", Faces "Insolence Eau de Parfum 75ml" | Guerlain's designer list has three pages titled "Insolence Eau de Parfum": 2008 (4566, 433 reviews), 2017 (58910, 181) and 2021 (67537, 257). `resolved.json` marks all four rows "tie: Guerlain Insolence Eau de Parfum, Guerlain Insolence Eau de Parfum"; the matcher took the first listed, the oldest. The stores sell the current bottle, most likely the 2021 page. | Re-point to 67537 (or 58910 if the store bottle is the 2017 one) and regenerate. |
| `dioraddictedp` (fid 15270, 2012) | Golden Scent "Dior Addict EDP" 100 ml and 50 ml, Nice One, Faces | Dior's list has "Dior Addict Eau de Parfum (2014)", fid 28201, 565 reviews against 276 for the 2012 page. The block's own `dioraddictedt` is the 2014 Eau de Toilette (25159), released with the 2014 EDP. | Re-point to 28201 and regenerate. |
| `byzance` (fid 1423, 1987) | Golden Scent "Rochas Byzance - 90 ml Eau de Parfum For Women" (two rows) | Rochas' list has "Byzance (2019)", fid 57842, 115 reviews: the relaunch, sold as a 90 ml Eau de Parfum. The 1987 page is the discontinued original. Same rule as B9 and B10 of the first report. | Re-point to 57842 and regenerate. |
| `coachedt` (fid 11915, 2010 women's EDT) | Noon "Coach EDT 100ml" only | The row names no sex. In the record, Coach's women's bottles are 90 ml (`coach`: "Coach Coach Women - 90ml", "Coach EDP 90ml") and the 100 ml EDT is Coach for Men (`coachfm`: "Coach For Men - 100 ml Eau De Toilette for Men"), already in the block. If the listing is a women's EDT, the one on sale is Coach the Fragrance Eau de Toilette (2016, fid 41869), not the 2010 page, by the rule used for `coach` (B10). | Remove; or re-point to 41869 if the Noon listing shows the women's bottle. |

## Unsure

| Entry | Store rows | Doubt | What settles it |
|---|---|---|---|
| `valentinouomo` (fid 19558, 2014) | Golden Scent "Valentino Uomo Eau de Toilette For Men" and 100 ml, Nice One, Faces | A same-name page "Valentino Uomo 2021" (fid 84716, 96 reviews) sits beside the 2014 original (795 reviews), as "Valentino Uomo Intense 2021" (75094) does beside Uomo Intense. The rows fit either. | Whether the Uomo EDT the stores ship is the 2021 reissue (the store's box, or Valentino's site). If it is, re-point to 84716. |
| `fakharlattafa` (fid 30864, 2015, unisex) | Noon "Lattafa Fakhar EDP 100ml" (rank 42, 1,500 ratings) and "Lattafa Fakhar Lattafa EDP 100ml" (837 ratings) | Neither row names a colour or sex. The Fakhar bottles on Fragrantica with many reviews are Fakhar Black (men, 70465, 831 reviews, the older catalogue's `fakharblack`) and Fakhar Rose (women, 70466, 394); the 2015 page has 13 reviews and a fruity floral pyramid. Two top-selling Noon listings are unlikely to be the least-reviewed version. | The two Noon listings' bottle: black is `fakharblack` (remove this entry), rose/gold is 70466 (re-point), anything else keeps 30864. |

## Right

| Entry | Why the rows name it |
|---|---|
| `aqvaph` | "BVLGARI Aqva EDT 100ml": plain Aqva is Aqva Pour Homme; Amara, Marine, Atlantiqve and Toniq each carry their own word. |
| `robertocavalliuomo` | "Roberto Cavalli Uomo ... Eau de Toilette for Men"; the flankers carry their own words. |
| `almajeoudaris` | "Aris From Classic Collection": Classic Collection is the line; the only Aris page. |
| `summeryellow` | Exact name; only page. |
| `ralplaurromance` | "Romance Eau De Parfum Women": the 1998 Romance is the EDP; Intense, Parfum and Elixir carry their words. |
| `labelleparadisegarden` | Exact name, women's EDP. |
| `placevendome` | Rows say EDP; the EDT has its own page (20564). |
| `erosedp` | "Versace Eros EDP ... For Men": the 2020 EDP, not Eros (EDT) in the older catalogue. |
| `robertocavallineroassoluto` | Exact name, 75 ml EDP for women. |
| `ejaazi` | "for Men" is the store's label on a unisex perfume; the only other page is Intensive Silver. |
| `lightblueeauintenseph` | "Light Blue Eau Intense EDP ... for Men": the men's Eau Intense, not `lightbluemen`. |
| `blackopiumoverred` | Exact name. |
| `allurehommeeditionblancheedp` | "edition blanche for men eau de parfum": the 2014 EDP; the 2008 page is the EDT. |
| `fahrenheitleparfum` | Exact name. |
| `asrar` | "Arabian Oud Asrar EDP"; only page of the name. |
| `azzaroph` | "Azzaro Pour Homme EDT 100ml"; the 1978 EDT. |
| `pradaparadoxevirtualflower` | Exact name. |
| `valayaexclusif` | "Valaya Exclusif"; Valaya (older catalogue) is a different page. |
| `adidasicedive` | Exact name; only page. |
| `alfareed` | Exact name; only page. |
| `ardenbeauty` | Exact name; only page. |
| `scandalphabsolu` | "Scandal Absolu ... For Men": the men's page (91053), not the women's Scandal Absolu (91052). |
| `ckone` | "Ck One Eau de Toilette for Men and Women"; flankers carry their words. |
| `prestigetopaz` | Exact name. |
| `acquadigioparfum` | "acqua di gio for men parfum": the 2023 Parfum; Profumo is the older catalogue's `adgprofumo`. |
| `egoisteplatinum` | "Platinum Egoiste Eau de Toilette for Men". |
| `justcavalli` | "Just Cavalli Women EDT": the 2013 women's Just Cavalli. |
| `jaguarclassicblack` | Exact name, EDT for men. |
| `afna9pmnightout` | "9 PM Night Out ... Extrait De Parfum". |
| `onlywhite` | Exact name. |
| `givenchyph` | "Givenchy Pour Homme Eau de Toilette For Men"; Blue Label is its own entry. |
| `caroherr212sexymen` | "212 sexy for men eau de toilette". |
| `romance` | "Rasasi Romance EDP"; the only other Romance page (Forever) is a men's perfume. |
| `polored` | Faces "Polo Red Men Perfume": no concentration named, and Faces lists the Polo Red EDP and Extreme under their own names, so the plain name is the 2013 original. |
| `aliengoddessintense` | Exact name. |
| `bossbottledunlimited` | Exact name, EDT for men. |
| `boccanera` | Exact name; only page. |
| `scandalphleparfum` | "Scandal Le Parfum ... For Men": the men's page (74915); the women's is `scandalleparfum`. |
| `versaceph` | "Versace Pour Homme Eau de Toilette for Men". |
| `gentlemanedtintense` | "Gentleman EDT Intense". |
| `moustacheedp` | "ROCHAS Moustache EDP 125ml": the 2018 EDP. |
| `mystiquebouquet` | Exact name, women's EDP. |
| `secretmusk` | "Secret Musk Perfume Oil 12ml"; only page of the name. |
| `eaudombreleather` | "Eau D'ombré Leather EDT": not Ombré Leather (older catalogue). |
