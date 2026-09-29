const fs=require('fs');const src=fs.readFileSync('site/js/landing-data.js','utf8');const window={};eval(src);const LD=window.PP_LANDING_DATA;
const F=LD.test.likes.concat(LD.test.dislikes), M=LD.test.masks, T=M.length, nl=LD.test.likes.length;
const bySize={};
for(let s=1;s<(1<<nl);s++){const k=s.toString(2).split('1').length-1; let n=0; const kept=[]; for(const x of M) if(x&s){n++;kept.push(x);} 
 for(let d=0;d<LD.test.dislikes.length;d++){const H=1<<(nl+d); let g=0; for(const x of kept) if(x&H) g++; const likesOut=T-n; (bySize[k]=bySize[k]||{n:0,win:0,ratio:[]}); bySize[k].n++; if(g>likesOut) bySize[k].win++; }}
for(const k in bySize) console.log('likes tapped',k,'combos',bySize[k].n,'dislike rules out more than likes:',(100*bySize[k].win/bySize[k].n).toFixed(0)+'%');
// single likes coverage
LD.test.likes.forEach((f,i)=>{let n=0;for(const x of M) if(x&(1<<i)) n++; console.log(f,n);});
LD.test.dislikes.forEach((f,i)=>{let n=0;for(const x of M) if(x&(1<<(nl+i))) n++; console.log('dis',f,n);});
const ALL=(1<<nl)-1; let n=0; for(const x of M) if(x&ALL) n++; console.log('all likes carry one:',n);
LD.test.dislikes.forEach((f,i)=>{let m=0;for(const x of M) if((x&ALL)&&!(x&(1<<(nl+i)))) m++; console.log('all likes, hate',f,'left',m,'gone',n-m);});
