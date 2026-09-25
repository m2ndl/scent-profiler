import sys,re,unicodedata
p=r"C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/books/perfumes_the_guide_2018.txt"
lines=open(p,encoding='utf-8').read().split('\n')
def fold(s): return unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().replace('’',"'")
term=sys.argv[1]; nums=[int(x) for x in sys.argv[2].split(',')]
w=int(sys.argv[3]) if len(sys.argv)>3 else 300
for n in nums:
    l=lines[n-1]; f=fold(l)
    idx=f.lower().find(term.lower())
    # find nearest header above
    h=n-1
    while h>0 and '★' not in lines[h-1]: h-=1
    print(f'--- {n} [under: {lines[h-1].strip()[:70] if h>0 else ""}]')
    print('   ', f[max(0,idx-w):idx+w])
