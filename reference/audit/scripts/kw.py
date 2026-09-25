import re,sys,unicodedata,bisect
L=open(r'C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/books/perfumes_the_guide_2018.txt',encoding='utf-8').read().split('\n')
hdr=[i for i,l in enumerate(L) if re.match(r'^\s*.+\(.+\)\s*[★☆]',l)]
def strip(s): return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn').replace('’',"'")
LS=[strip(l).lower() for l in L]
pat=sys.argv[1].lower(); W=int(sys.argv[2]) if len(sys.argv)>2 else 200
for i,l in enumerate(LS):
    for m in re.finditer(pat,l):
        j=bisect.bisect_right(hdr,i)-1
        h=L[hdr[j]].strip() if j>=0 else '-'
        s=max(0,m.start()-W); e=m.end()+W
        print(f'[{i}] <{h}> ...{L[i][s:e].strip()}...')
