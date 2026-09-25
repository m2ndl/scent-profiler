import sys,re,unicodedata
p=r"C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/books/scent_and_chemistry_2022.txt"
lines=open(p,encoding='utf-8').read().split('\n')
def fold(s): return unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().replace('’',"'").replace('‘',"'")
terms=sys.argv[1].split('|'); w=int(sys.argv[2]) if len(sys.argv)>2 else 250
for i,l in enumerate(lines[:10500]):
    f=fold(l)
    for t in terms:
        for m in re.finditer(re.escape(t),f):
            j=m.start(); print(f'--- {i+1} [{t}]'); print('   ',f[max(0,j-w):j+w])
