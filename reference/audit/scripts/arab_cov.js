const fs=require('fs');global.window={};
eval(fs.readFileSync('C:/Users/malha/Desktop/Webapps/perfume-profiler/data.js','utf8'));
const P=window.PP_DATA.PERFUMES; const arab=P.filter(p=>p.tier==='arab');
const tags={}; for(const f of fs.readdirSync('C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/audit').filter(f=>/^tags_part\d\.json$/.test(f))) for(const it of JSON.parse(fs.readFileSync('C:/Users/malha/Desktop/Webapps/perfume-profiler/reference/audit/'+f,'utf8'))) tags[it.id]=it;
const clones=arab.filter(p=>p.cloneOf), orig=arab.filter(p=>!p.cloneOf);
const ev=a=>a.filter(p=>tags[p.id]&&(tags[p.id].found_in_guide||tags[p.id].found_in_chemistry)).length;
console.log('arab',arab.length,'clones',clones.length,'originals',orig.length,'orig with direct evidence',ev(orig),'clones with direct',ev(clones));
