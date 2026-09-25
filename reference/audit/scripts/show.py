import json,sys
revs=json.load(open('guide_reviews.json',encoding='utf-8'))
for n in [int(x) for x in sys.argv[1].split(',')]:
    for r in revs:
        if r['line']==n: print(f"### {r['line']} {r['name']} ({r['house']}) {r['stars']} | {r['cat']}\n{r['text']}\n")
