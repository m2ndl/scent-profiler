import re, json
p=r"C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/books/perfumes_the_guide_2018.txt"
lines=open(p,encoding='utf-8').read().split('\n')
START,END=370,None
for i,l in enumerate(lines):
    if i>1000 and l.strip()=='Glossary': END=i; break
hdr=re.compile(r'^\s*(.+?)\s*\(([^()]+)\)\s*([★☆]+)(.*)$')
hdr2=re.compile(r'^\s*([^★]+?)\s*([★☆]+)(.*)$')
revs=[]
for i in range(START,END):
    l=lines[i]
    if '★' not in l: continue
    m=hdr.match(l)
    if m: revs.append(dict(line=i+1,name=m.group(1),house=m.group(2),stars=m.group(3),cat=m.group(4).strip()))
    else:
        m=hdr2.match(l)
        if m: revs.append(dict(line=i+1,name=m.group(1),house='',stars=m.group(2),cat=m.group(3).strip()))
        else: print('UNPARSED',i+1,l[:100])
for k,r in enumerate(revs):
    end = revs[k+1]['line']-1 if k+1<len(revs) else END
    body=[x.strip() for x in lines[r['line']:end] if x.strip()]
    if not r['cat'] and body: r['cat']=body[0]; body=body[1:]
    r['text']=' '.join(body)
print(len(revs), 'END',END)
json.dump(revs,open('guide_reviews.json','w',encoding='utf-8'),ensure_ascii=False)
for r in revs:
    if not r['house']: print('NOHOUSE',r['line'],r['name'][:80])
