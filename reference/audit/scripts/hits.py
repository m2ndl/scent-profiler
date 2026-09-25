import json,re,unicodedata
R='C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/'
d=json.load(open(R+'audit/entries_part3.json',encoding='utf-8'))
def norm(s):
    s=unicodedata.normalize('NFKD',s)
    s=''.join(c for c in s if not unicodedata.combining(c))
    return s.replace('\u2019',"'").replace('\u2018',"'").lower()
books={k:open(R+'books/'+f,encoding='utf-8').read().split('\n') for k,f in [('G','perfumes_the_guide_2018.txt'),('C','scent_and_chemistry_2022.txt')]}
nb={k:[norm(l) for l in v] for k,v in books.items()}
extra={'mfk724':['724'],'br540extrait':['baccarat rouge'],'renaissance':['renaissance'],'lira':['lira'],'hacivatx':['hacivat'],'elysium':['elysium'],'enigma':['enigma','creation-e'],'danger':['danger'],'meteore':['meteore'],'limmensite':["l'immensite",'immensite'],'thenoir29':['the noir 29','noir 29'],'another13':['another 13'],'molecule01':['molecule 01','molecule 1'],'notaperfume':['not a perfume'],'lovedontbeshy':["love, don't be shy","love don't be shy",'love dont be shy'],'portraitofalady':['portrait of a lady'],'muscravageur':['musc ravageur'],'irishleather':['irish leather'],'kirke':['kirke'],'ganymede':['ganymede'],'alexandriaii':['alexandria'],'torino21':['torino'],'rehab':['rehab'],'gentlefluiditygold':['gentle fluidity'],'nuitdefeu':['nuit de feu'],'intensecafe':['intense cafe'],'rosesvanille':['roses vanille'],'rosesmusk':['roses musk'],'chocolategreedy':['chocolate greedy'],'blackaoud':['black aoud'],'redtobacco':['red tobacco'],'instantcrush':['instant crush']}
out={}
for e in d:
    names=[norm(e['name'])]
    n2=re.sub(r'\s+(eau de parfum|extrait|pour homme.*|parfum cologne)$','',names[0]).strip()
    if n2 not in names: names.append(n2)
    names+= [norm(x) for x in extra.get(e['id'],[])]
    for k in 'GC':
        hits=[]
        for i,l in enumerate(nb[k]):
            for n in names:
                if len(n)<5 and not n.isdigit(): pass
                if re.search(r'(?<![a-z0-9])'+re.escape(n)+r'(?![a-z0-9])',l):
                    hits.append(i+1);break
        out[(e['id'],k)]=hits
    print(e['id'],'| G:',out[(e['id'],'G')][:15],'| C:',out[(e['id'],'C')][:15])
