const fs=require('fs'), path=require('path');
const root='C:/Users/malha/Desktop/Webapps/perfume-profiler';
global.window={};
eval(fs.readFileSync(path.join(root,'mapper.js'),'utf8'));
eval(fs.readFileSync(path.join(root,'reference/audit/data.before_audit.js'),'utf8'));
const M=window.PP_MAP, D=window.PP_DATA;
const byId={}; for(const e of D.PERFUMES) byId[e.id]=e;
const rows=fs.readFileSync(path.join(root,'reference/audit/applied_changes.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const stageKey={opening:'opening',heart:'heart',drydown:'drydown'};
let agree=0, n=0, upN=0, upHit=0, downN=0, downHit=0; const detail=[];
for(const r of rows){
  const e=byId[r.id]; if(!e){detail.push('missing '+r.id);continue;}
  const parts=e.notes.en.split('/').map(s=>s.split(',').map(x=>x.trim()).filter(Boolean));
  const m=M.mapNotes({top:parts[0]||[],middle:parts[1]||[],base:parts[2]||[]},[]);
  const w=(m.stages[r.stage]||{})[r.family]||0;
  n++;
  if(r.to>r.from){upN++; const hit = w>=0.3 && w>r.from; if(hit)upHit++; detail.push(`UP ${r.id} ${r.stage} ${r.family} ${r.from}->${r.to} mapper=${w} ${hit?'HIT':'miss'}`);}
  else {downN++; const hit = w < r.from; if(hit)downHit++; detail.push(`DOWN ${r.id} ${r.stage} ${r.family} ${r.from}->${r.to} mapper=${w} ${hit?'HIT':'miss'}`);}
}
console.log({n,upN,upHit,downN,downHit});
console.log(detail.join('\n'));
