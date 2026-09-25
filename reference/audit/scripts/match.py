import json, unicodedata, re
def norm(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    s=s.replace("’","'")
    return re.sub(r'[^a-z0-9 ]',' ',s)
revs=json.load(open('guide_reviews.json',encoding='utf-8'))
ents=json.load(open(r'C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/audit/entries_part1.json',encoding='utf-8'))
houses={}
for r in revs: houses.setdefault(norm(r['house']).strip(),[]).append(r)
for e in ents:
    hn=norm(e['house']).split()
    cands=[r for r in revs if any(w in norm(r['house']).split() for w in hn if len(w)>3) or norm(e['house']).strip() in norm(r['house'])]
    nm=norm(e['name'])
    key=[w for w in nm.split() if w not in ('eau','de','parfum','toilette','the','le','la','l','edp','edt')]
    hits=[r for r in revs if all(w in norm(r['name']).split() for w in key[:2])]
    print(f"== {e['id']} [{e['house']} / {e['name']}]")
    for r in hits: print('   NAME:',r['line'],r['name'],'(',r['house'],')',r['stars'],r['cat'])
    print('   HOUSE:',', '.join(f"{r['name']}@{r['line']}" for r in cands)[:600])
