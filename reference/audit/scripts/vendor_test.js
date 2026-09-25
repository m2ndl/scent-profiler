const fs=require('fs');
global.window={};
eval(fs.readFileSync('C:/Users/malha/Desktop/Webapps/perfume-profiler/mapper.js','utf8'));
const M=window.PP_MAP;
const known={a91:'woody',a62:'powdery',a75:'sweet',a24:'citrus',a8:'aromatic',a86:'warm spicy',a34:'fresh spicy',a4:'amber',a31:'floral',a53:'musky'};
const d=JSON.parse(fs.readFileSync('fragdb_sample.json','utf8'));
for(const r of d.rows){const x=r.row;
  const desc=x.description.replace(/<[^>]+>/g,' ');
  const g=(re)=>{const m=desc.match(re);return m?m[1].split(/,| and /).map(s=>s.trim()).filter(Boolean):[]};
  const top=g(/Top notes are ([^;]+);/), mid=g(/middle notes are ([^;]+);/), base=g(/base notes are ([^.]+)\./);
  const acc=x.accords.split(';').map(t=>t.split(':')).filter(t=>known[t[0]]).map(t=>known[t[0]]+':'+t[1]);
  const m=M.mapNotes({top,middle:mid,base},acc.map(a=>a.split(':')[0]));
  console.log(x.name,'| accords known:',acc.join(','),'\n  notes:',top.join(','),'/',mid.join(','),'/',base.join(','),'\n  heart:',JSON.stringify(m.stages.heart),'\n  drydown:',JSON.stringify(m.stages.drydown),'\n  unmatched:',m.unmatched.join(','));
}
