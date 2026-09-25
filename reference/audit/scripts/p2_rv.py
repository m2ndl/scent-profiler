import re,sys,bisect
L=open(r'C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/books/perfumes_the_guide_2018.txt',encoding='utf-8').read().split('\n')
hdr=[i for i,l in enumerate(L) if re.match(r'^\s*.+\(.+\)\s*[★☆]',l)]
for a in sys.argv[1:]:
    n=int(a)
    j=bisect.bisect_right(hdr,n)-1
    h=hdr[j] if j>=0 else 0
    nxt=hdr[j+1] if j+1<len(hdr) else len(L)
    print('=====',n,'in review:',L[h].strip())
    txt=' '.join(l.strip() for l in L[h:nxt] if l.strip())
    print(txt[:4000])
    print()
