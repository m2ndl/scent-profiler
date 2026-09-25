import re,unicodedata
p=r"C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/books/perfumes_the_guide_2018.txt"
txt=open(p,encoding='utf-8').read()
def fold(s): return unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().replace('’',"'")
lines=[fold(l) for l in txt.split('\n')]
terms={'erbapura':['Erba Pura','Xerjoff'],'naxos':['Naxos','1861'],'layton':['Layton'],'herod':['Herod'],'althair':['Althair'],'delina':['Delina'],
'oudwood':['Oud Wood'],'tobaccovanille':['Tobacco Vanil'],'ombreleather':['Ombre Leather','Ombré'],'blackorchid':['Black Orchid'],
'sauvageelixir':['Sauvage Elixir','Elixir'],'diorhommeintense':['Dior Homme','Homme Intense'],'yedp':['YSL Y','Y eau','Saint Laurent Y'],'libre':['Libre'],
'cocomademoiselle':['Mademoiselle'],'lemale':['Le Male'],'lebeau':['Le Beau'],'adg':['Acqua di Gi','Acqua Di Gio'],'prada':['Prada'],'onemillion':['1 Million','One Million'],
'eros':['Eros'],'mancera':['Mancera','Cedrat'],'montale':['Montale'],'initio':['Initio','Side Effect','Oud for Greatness'],'amouage':['Interlude','Reflection'],
'kilian':["Angels' Share","Angel's Share",'Angels Share'],'lv':['Louis Vuitton','Ombre Nomade'],'santal33':['Santal 33','Le Labo'],'lattafa':['Lattafa','Khamrah','Yara','Asad'],
'armaf':['Armaf','Club de Nuit'],'ajmal':['Ajmal'],'arabianoud':['Arabian Oud','Kalemat'],'swiss':['Swiss Arabian','Shaghaf'],'rasasi':['Rasasi','Hawas'],'afnan':['Afnan','9pm','9 PM'],
'goodgirl':['Good Girl'],'alien':['Alien'],'hypnotic':['Hypnotic'],'terre':["Terre d'Herm",'Terre d'],'gypsy':['Gypsy Water'],'kayali':['Kayali','Vanilla 28'],
'fahrenheit':['Fahrenheit'],'allure':['Allure Homme','Allure'],'code':['Armani Code','Code'],'lanuit':["La Nuit de l'Homme","Nuit de l'Homme"],'myslf':['Myslf','MYSLF'],
'lunarossa':['Luna Rossa'],'dylan':['Dylan Blue'],'invictus':['Invictus'],'hacivat':['Hacivat'],'aventus':['Aventus'],'br540':['Baccarat Rouge'],'sauvage':['Sauvage'],'bleu':['Bleu de Chanel'],'swy':['Stronger with'],'blackopium':['Black Opium'],'lveb':['Vie Est Belle'],'grandsoir':['Grand Soir'],'fireplace':['Fireplace']}
for k,ts in terms.items():
    out=[]
    for i,l in enumerate(lines):
        for t in ts:
            if (t in l) if t[0].isupper() or t[0].isdigit() else (t.lower() in l.lower()):
                out.append(i+1); break
    print(k, ts, out[:40])
