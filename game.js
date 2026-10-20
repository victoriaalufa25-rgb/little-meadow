(function(){'use strict';
/* ===== LOGIC (no DOM, testable) ===== */
const T=16,MW=24,MH=22,DAY=150,WET=45,KEY='little-meadow-save-2';
const PLOTS=[[7,10],[9,10],[11,10],[13,10],[7,12],[9,12],[11,12],[13,12],[7,14],[9,14],[11,14],[13,14]],LANDC=[0,20,40,70,110,160,220,290,370,460,560,670];
const CROPS={carrot:{n:'Carrot',lv:1,cost:3,need:60,sell:6,xp:5,c:'#ec8c3c'},tomato:{n:'Tomato',lv:2,cost:6,need:80,sell:12,xp:8,c:'#d9534f'},pepper:{n:'Pepper',lv:3,cost:9,need:100,sell:18,xp:11,c:'#c0392b'},maize:{n:'Maize',lv:4,cost:14,need:130,sell:28,xp:15,c:'#f2d27a'},mango:{n:'Mango tree',lv:5,cost:60,need:200,sell:30,xp:25,c:'#f2a93c',tree:1}};
const P={skin:['#f8dcc0','#f3d2b3','#d9a577','#a8734e','#6e4630'],hair:['#5c3f2b','#2b2020','#d9a441','#c4574a','#e6a9b4','#e8e0d0'],top:['#e6a9b4','#8fb8c9','#f2d27a','#a98fd0','#7fae7a','#f6ecd6'],pants:['#8a6144','#5b7aa0','#4f4a5e','#7a9a6a']};
const QUESTS=[['planted','First Seeds','Plant a seed in your garden plot.'],['watered','Thirsty Sprouts','Water your planted seed.'],['harvested','First Harvest','Keep it watered, then pick the ripe crop.'],['sold','Little Market','Sell a crop at Mama Ada\'s stall.'],['filled','Order Up','Deliver an order from the order board.']];
const NAMES=['Mama Ada','Baba Tunde','Aunty Ngozi','Chief Emeka','Little Sade','Mama Bisi'];
function genOrder(S){const ks=Object.keys(CROPS).filter(k=>CROPS[k].lv<=S.lv);if(!ks.length)ks.push('carrot');const items={};let v=0,q=0;
 for(let j=0;j<(ks.length>1&&Math.random()<.5?2:1);j++){const k=ks[Math.floor(Math.random()*ks.length)],n=1+Math.floor(Math.random()*(2+Math.min(6,S.lv/2)));if(!items[k]){items[k]=n;v+=n*CROPS[k].sell;q+=n}}
 return{who:NAMES[Math.floor(Math.random()*NAMES.length)],items,coins:Math.round(v*1.4)+3,xp:q*3+5}}
const EV=[],xpNeed=l=>30+(l-1)*25,ripe=p=>p.g>=CROPS[p.k].need;
const stage=p=>{const f=p.g/CROPS[p.k].need;return f<.15?0:f<.45?1:f<1?2:3};
const TP=[['plant','Plant','seeds'],['water','Water','plants'],['harvest','Harvest','crops'],['sell','Sell','crops'],['order','Fill','orders']];
const genDQ=S=>{const l=[];for(let i=0;i<3;i++){const[k,v,w]=TP[(S.day+i)%5],n=k==='order'?1+Math.floor(S.lv/4):2+Math.floor(S.lv/2)+(k==='water'?1:0);l.push({k,n,have:0,done:0,t:v+' '+n+' '+w,coins:6+n*2,xp:8+n*2})}return l};
const ensure=S=>{if(!S.dq||S.dq.day!==S.day)S.dq={day:S.day,list:genDQ(S)};return S};
const newState=look=>{const s=ensure({v:2,x:9*T,y:6*T+8,dir:'d',coins:10,xp:0,lv:1,land:1,seed:'carrot',inv:{carrot:3},crops:{},plots:PLOTS.map(()=>null),day:1,t:.15,
 q:{planted:0,watered:0,harvested:0,sold:0},qd:[],dq:null,log:['Day 1: I arrived at Little Meadow. Time to start a garden.'],look:look||{skin:1,hs:0,hair:0,os:0,top:0,pants:0,hat:0},set:{sfx:1,mus:1,vol:.6},savedAt:0});s.orders=[0,1,2,3].map(()=>genOrder(s));return s};
const num=Number.isFinite,obj=o=>o&&typeof o==='object';
const valid=s=>!!(s&&s.v===2&&num(s.x)&&num(s.y)&&num(s.coins)&&num(s.day)&&num(s.t)&&num(s.xp)&&num(s.lv)&&s.lv>=1&&num(s.land)&&s.land>=1&&s.land<=PLOTS.length&&CROPS[s.seed]&&obj(s.inv)&&obj(s.crops)&&Array.isArray(s.plots)&&s.plots.length===PLOTS.length&&s.plots.every(p=>p===null||(obj(p)&&CROPS[p.k]&&num(p.g)&&num(p.w)))&&obj(s.q)&&Array.isArray(s.qd)&&Array.isArray(s.log)&&obj(s.dq)&&Array.isArray(s.dq.list)&&obj(s.look)&&obj(s.set)&&Array.isArray(s.orders)&&s.orders.length===4&&s.orders.every(o=>obj(o)&&obj(o.items)&&num(o.coins)&&num(o.xp)));
function gain(S,n){S.xp+=n;while(S.xp>=xpNeed(S.lv)){S.xp-=xpNeed(S.lv);S.lv++;const u=Object.values(CROPS).filter(c=>c.lv===S.lv).map(c=>c.n);EV.push('Level up! You are level '+S.lv+(u.length?'. New in shop: '+u.join(', '):''))}}
const MAP={plant:'planted',water:'watered',harvest:'harvested',sell:'sold',order:'filled'};
function event(S,k,n){n=n||1;S.q[MAP[k]]=(S.q[MAP[k]]||0)+n;ensure(S);
 for(const d of S.dq.list)if(!d.done&&d.k===k){d.have=Math.min(d.n,d.have+n);if(d.have>=d.n){d.done=1;S.coins+=d.coins;EV.push('Daily quest done: '+d.t+' (+'+d.coins+' coins)');gain(S,d.xp)}}
 for(const[q,t]of QUESTS)if(S.q[q]>=1&&!S.qd.includes(q)){S.qd.push(q);S.coins+=5;S.log.push('Day '+S.day+': Finished "'+t+'".');EV.push('Quest done: '+t+' (+5 coins)');gain(S,10)}}
const Logic={
 plant(S,i){const d=CROPS[S.seed];if(i>=S.land)return'This land is not yours yet.';if(S.plots[i])return'Something is already growing here.';if(d.lv>S.lv)return'Reach level '+d.lv+' first.';if(!(S.inv[S.seed]>0))return'No '+d.n+' seeds. Buy more at the stall.';S.inv[S.seed]--;S.plots[i]={k:S.seed,g:0,w:0};gain(S,2);event(S,'plant');return true},
 water(S,i){const p=S.plots[i];if(!p)return'Plant a seed first.';if(ripe(p))return'Already ripe. Pick it!';if(p.w>WET-5)return'The soil is still damp.';p.w=WET;gain(S,1);event(S,'water');return true},
 harvest(S,i){const p=S.plots[i];if(!p||!ripe(p))return'Not ripe yet.';const d=CROPS[p.k];S.crops[p.k]=(S.crops[p.k]||0)+1;if(d.tree)p.g=d.need*.5;else S.plots[i]=null;gain(S,d.xp);event(S,'harvest');return true},
 sell(S){let n=0,v=0;for(const k in S.crops){n+=S.crops[k];v+=S.crops[k]*CROPS[k].sell}if(!n)return'You have nothing to sell.';S.crops={};S.coins+=v;gain(S,n);event(S,'sell',n);return true},
 buy(S,k){const d=CROPS[k];if(!d||d.lv>S.lv)return'Not unlocked yet.';if(S.coins<d.cost)return'Not enough coins.';S.coins-=d.cost;S.inv[k]=(S.inv[k]||0)+1;return true},
 fill(S,i){const o=S.orders[i];if(!o)return'No order here.';for(const k in o.items)if((S.crops[k]||0)<o.items[k])return'You need more '+CROPS[k].n+'.';for(const k in o.items){S.crops[k]-=o.items[k];if(!S.crops[k])delete S.crops[k]}S.coins+=o.coins;gain(S,o.xp);S.orders[i]=genOrder(S);event(S,'order');return true},
 land(S){if(S.land>=PLOTS.length)return'You own all the land for now.';const c=LANDC[S.land];if(S.coins<c)return'Not enough coins.';S.coins-=c;S.land++;S.log.push('Day '+S.day+': Bought garden plot '+S.land+'.');return true},
 tick(S,dt){for(const p of S.plots)if(p&&p.w>0){const u=Math.min(dt,p.w);p.w-=u;p.g=Math.min(CROPS[p.k].need,p.g+u)}
  S.t+=dt/DAY;while(S.t>=1){S.t-=1;S.day++;S.log.push('Day '+S.day+': A new morning in the meadow.');if(S.log.length>30)S.log.shift();ensure(S);EV.push('A new day! New daily quests.')}}
};
if(typeof document==='undefined'){module.exports={Logic,newState,valid,stage,ripe,PLOTS,CROPS,EV,xpNeed};return}

/* ===== ART (all drawn in code) ===== */
const $=i=>document.getElementById(i),cv=$('cv'),g=cv.getContext('2d');
const mk=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'));return c};
const R=(x,c,a,b,w,h)=>{x.fillStyle=c;x.fillRect(a,b,w,h)};
const grassT=[0,1,2,3].map(v=>mk(T,T,x=>{R(x,'#9bb88a',0,0,T,T);for(let i=0;i<5;i++)R(x,i%2?'#8aa97b':'#a9c498',(v*5+i*7)%15,(v*3+i*11)%14,1,2)}));
const flowerT=['#e6a9b4','#f6ecd6','#f2d27a','#c9a0dc'].map((c,k)=>mk(T,T,x=>{x.drawImage(grassT[k],0,0);R(x,'#6f9460',7,9,1,4);R(x,c,6,7,3,1);R(x,c,7,6,1,3);R(x,'#f2a93c',7,7,1,1)}));
const pathT=mk(T,T,x=>{R(x,'#d9bc8f',0,0,T,T);for(let i=0;i<7;i++)R(x,i%2?'#c9a273':'#e8d3ac',(i*5+2)%14,(i*7+1)%14,2,1)});
const soil=w=>mk(T,T,x=>{const d=w?'#5c3f2b':'#8a6144';R(x,w?'#6e4a35':'#a5784f',0,0,T,T);R(x,d,0,0,T,1);R(x,d,0,15,T,1);R(x,d,0,0,1,T);R(x,d,15,0,1,T);for(let r=4;r<14;r+=4)R(x,d,2,r,12,1)});
const soilD=soil(0),soilW=soil(1);
const sign=mk(T,T,x=>{R(x,'#8a6144',7,5,2,9);R(x,'#f6ecd6',3,2,10,6);R(x,'#8a6144',3,2,10,1);R(x,'#e6a9b4',7,4,2,2)});
const cropT={};for(const k in CROPS){const d=CROPS[k],c=d.c;cropT[k]=[mk(T,T,x=>{R(x,'#c9a273',6,9,4,2);R(x,'#f6ecd6',7,9,1,1)}),
 mk(T,T,x=>{R(x,'#6fae5f',7,7,2,4);R(x,'#8fcf7a',5,7,2,1);R(x,'#8fcf7a',9,6,2,1)}),
 mk(T,T,x=>{if(d.tree){R(x,'#7a5238',7,9,2,5);R(x,'#4f7a4a',4,3,8,7);R(x,'#6b9a5e',5,4,5,4)}else{R(x,'#5f9e50',5,5,2,7);R(x,'#6fae5f',7,3,2,9);R(x,'#5f9e50',9,5,2,7);R(x,'#8fcf7a',7,3,2,2)}}),
 mk(T,T,x=>{if(d.tree){R(x,'#7a5238',7,9,2,5);R(x,'#4f7a4a',2,1,12,9);R(x,'#6b9a5e',3,2,8,6);for(const[a,b]of[[4,3],[9,4],[6,7],[11,7]])R(x,c,a,b,2,2)}
  else{R(x,'#5f9e50',5,3,2,6);R(x,'#6fae5f',7,2,2,7);R(x,'#5f9e50',9,3,2,6);R(x,c,6,8,4,3);R(x,c,7,11,2,2);R(x,'rgba(255,255,255,.4)',6,8,1,1)}})]}
const treeT=mk(T,24,x=>{R(x,'rgba(0,0,0,.12)',2,20,12,3);R(x,'#7a5238',6,14,4,8);R(x,'#4f7a4a',1,5,14,10);R(x,'#4f7a4a',3,2,10,14);R(x,'#6b9a5e',3,3,8,8);R(x,'#86b673',4,4,3,3);R(x,'#e6a9b4',9,9,1,1);R(x,'#e6a9b4',5,11,1,1)});
const cot=mk(48,44,x=>{R(x,'rgba(0,0,0,.13)',2,38,46,5);R(x,'#8a6144',34,0,5,8);R(x,'#b95f6e',8,2,32,4);R(x,'#c76f7e',4,6,40,6);R(x,'#d98a98',0,12,48,6);R(x,'#b95f6e',0,18,48,2);R(x,'#f6ecd6',3,20,42,18);R(x,'#e3d2b0',3,34,42,4);R(x,'#8a6144',20,26,9,12);R(x,'#5c3f2b',20,26,9,1);R(x,'#f2d27a',26,32,1,1);
 for(const w of[8,33]){R(x,'#8a6144',w-1,24,10,10);R(x,'#9fcbd9',w,25,8,7);R(x,'#8a6144',w+3,25,1,7);R(x,'#8a6144',w,28,8,1);R(x,'#e6a9b4',w-1,34,10,2)}});
const crate=mk(T,T,x=>{R(x,'rgba(0,0,0,.13)',1,13,14,3);R(x,'#a5784f',1,6,14,8);R(x,'#8a6144',1,6,14,1);R(x,'#8a6144',1,10,14,1);R(x,'#c99a6b',2,7,12,2);R(x,'#8a6144',7,0,2,6);R(x,'#f6ecd6',3,0,10,5);R(x,'#e6a9b4',7,2,2,2)});
const board=mk(T,T,x=>{R(x,'rgba(0,0,0,.13)',1,13,14,3);R(x,'#8a6144',2,4,2,10);R(x,'#8a6144',12,4,2,10);R(x,'#a5784f',1,1,14,8);R(x,'#8a6144',1,1,14,1);R(x,'#f6ecd6',3,3,4,4);R(x,'#e6a9b4',9,3,4,3);R(x,'#f2d27a',8,6,4,2)});
$('i1').src=mk(8,8,x=>{R(x,'#c9972f',2,0,4,8);R(x,'#c9972f',0,2,8,4);R(x,'#f2d27a',2,1,4,6);R(x,'#f2d27a',1,2,6,4)}).toDataURL();
const VIL={skin:2,hs:1,hair:1,os:2,top:3,pants:0,hat:1};
function player(c,px,py,dir,fr,mv,L){const sk=P.skin[L.skin],hr=P.hair[L.hair],tp=P.top[L.top],pn=P.pants[L.pants],X=Math.round(px)-8,Y=Math.round(py)-15,B=mv&&fr%2?1:0,lg=L.hs;
 R(c,'rgba(0,0,0,.18)',X+3,Y+13,10,3);const lc=L.os===2?sk:pn;R(c,lc,X+5,Y+11,2,3-(mv&&fr%2?1:0));R(c,lc,X+9,Y+11,2,3-(mv&&!(fr%2)?1:0));
 R(c,tp,X+4,Y+7-B,8,5);if(L.os===1){R(c,pn,X+4,Y+10-B,8,2);R(c,pn,X+5,Y+7-B,1,3);R(c,pn,X+10,Y+7-B,1,3)}if(L.os===2)R(c,tp,X+3,Y+11-B,10,2);
 R(c,sk,X+3,Y+8-B,1,3);R(c,sk,X+12,Y+8-B,1,3);R(c,sk,X+4,Y+1-B,8,6);R(c,hr,X+3,Y-B,10,3);
 if(dir==='u')R(c,hr,X+3,Y-B,10,lg===1?11:7);else{R(c,hr,X+3,Y+2-B,1,lg===1?8:4);R(c,hr,X+12,Y+2-B,1,lg===1?8:4);
  for(const a of dir==='l'?[5]:dir==='r'?[10]:[6,9])R(c,'#3b2a22',X+a,Y+4-B,1,2);if(dir==='d'){R(c,'#e6a9b4',X+5,Y+6-B,1,1);R(c,'#e6a9b4',X+10,Y+6-B,1,1)}}
 if(L.hs===2)R(c,hr,X+6,Y-2-B,4,2);if(L.hat){R(c,'#e8cf8e',X+2,Y-1-B,12,2);R(c,'#e8cf8e',X+4,Y-3-B,8,3);R(c,'#c76f7e',X+4,Y-1-B,8,1)}}

/* ===== WORLD ===== */
let ground,solid,trees=[];
(function(){solid=new Uint8Array(MW*MH);let sd=7;const rnd=()=>(sd=sd*16807%2147483647)/2147483647;
 for(let i=0;i<MW;i++)trees.push([i,0],[i,MH-1]);for(let j=1;j<MH-1;j++)trees.push([0,j],[MW-1,j]);
 [[17,3],[18,5],[2,12],[16,14],[19,12],[6,16],[13,18],[2,16],[10,4],[19,8],[21,16],[5,19],[17,18],[21,6],[8,19]].forEach(t=>trees.push(t));
 trees.forEach(([a,b])=>solid[b*MW+a]=1);for(let a=3;a<=5;a++)for(let b=2;b<=3;b++)solid[b*MW+a]=1;
 solid[7*MW+12]=1;solid[7*MW+15]=1;solid[7*MW+16]=1;PLOTS.forEach(([a,b])=>solid[b*MW+a]=1);trees.sort((p,q)=>p[1]-q[1]);
 const path=new Set();for(let b=4;b<=8;b++)path.add('4,'+b);for(let a=4;a<=17;a++)path.add(a+',8');
 ground=mk(MW*T,MH*T,x=>{for(let b=0;b<MH;b++)for(let a=0;a<MW;a++){const k=(a*7+b*13)%4;x.drawImage(path.has(a+','+b)?pathT:(!solid[b*MW+a]&&rnd()<.08?flowerT[k]:grassT[k]),a*T,b*T)}})})();
const sol=(x,y)=>{const a=Math.floor(x/T),b=Math.floor(y/T);return a<0||b<0||a>=MW||b>=MH||solid[b*MW+a]===1};
const blk=(x,y)=>[[-4,-4],[4,-4],[-4,0],[4,0]].some(([a,b])=>sol(x+a,y+b));
const fix=s=>{if(blk(s.x,s.y)){s.x=9*T;s.y=6*T+8}return ensure(s)};

/* ===== STATE / SAVE ===== */
let S=newState(),SET={sfx:1,mus:1,vol:.6};
try{Object.assign(SET,JSON.parse(localStorage.getItem('lm-set')||'{}'))}catch(e){}
S.set=SET;
let playing=false,paused=true,hasSave=false,corrupt=false,sel=-1,selTap=-1,near=false,nearB=false,anim=0,moving=false,vw=160,vh=240,sc=3,cx=0,cy=0,off='Checking offline files...',toastT=0;
const held={};
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('little-meadow',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const idbSet=async(k,v)=>{const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})};
const idbGet=async k=>{const d=await idb();return new Promise((res,rej)=>{const r=d.transaction('kv').objectStore('kv').get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})};
async function save(){S.savedAt=Date.now();S.set=SET;const j=JSON.stringify(S);try{localStorage.setItem(KEY,j)}catch(e){}try{await idbSet(KEY,j)}catch(e){}}
function mig(o){if(o&&Array.isArray(o.plots)){while(o.plots.length<PLOTS.length)o.plots.push(null);if(!Array.isArray(o.orders)&&num(o.lv))o.orders=[0,1,2,3].map(()=>genOrder(o))}}
async function loadSave(){let raw=[];try{raw.push(localStorage.getItem(KEY))}catch(e){}try{raw.push(await idbGet(KEY))}catch(e){}
 raw=raw.filter(Boolean);const ok=[];for(const r of raw){try{const o=JSON.parse(r);mig(o);if(valid(o))ok.push(o)}catch(e){}}
 ok.sort((a,b)=>b.savedAt-a.savedAt);return{s:ok[0]?fix(ok[0]):null,bad:!ok.length&&raw.length>0}}

/* ===== AUDIO (synthesized) ===== */
let AC,mi=3;const SC=[262,294,330,392,440,523,588];
function audio(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume()}
function tone(f,d,ty,v,dl){if(!AC)return;const o=AC.createOscillator(),n=AC.createGain(),t=AC.currentTime+(dl||0);o.type=ty;o.frequency.value=f;n.gain.setValueAtTime(0,t);n.gain.linearRampToValueAtTime(Math.max(.0002,v*SET.vol),t+.02);n.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(n);n.connect(AC.destination);o.start(t);o.stop(t+d+.05)}
const SFX={plant:[330,440],water:[520,620,720],pick:[523,659,784],coin:[880,1175],no:[180],tap:[440],lvl:[523,659,784,1047]};
const sfx=k=>{if(!SET.sfx)return;audio();(SFX[k]||[]).forEach((f,i)=>tone(f,.14,'square',.1,i*.08))};
setInterval(()=>{if(!AC||!SET.mus||!playing||document.hidden)return;mi=Math.max(0,Math.min(SC.length-1,mi+Math.floor(Math.random()*3)-1));if(Math.random()<.8)tone(SC[mi]/(Math.random()<.3?2:1),1.4,'triangle',.09)},900);
addEventListener('pointerdown',audio);

/* ===== UI ===== */
const ov=$('ov'),panel=h=>{ov.innerHTML='<div class="pn">'+h+'</div>';ov.className='on';paused=true},close=()=>{ov.className='';paused=false};
function toast(m){const t=$('toast');t.textContent=m;t.className='px on';clearTimeout(toastT);toastT=setTimeout(()=>t.className='px',2800)}
const drain=()=>{if(!EV.length)return;const m=EV.splice(0).join('  ');toast(m);sfx(m.includes('Level')?'lvl':'coin')};
const unlocked=()=>Object.keys(CROPS).filter(k=>CROPS[k].lv<=S.lv);
function begin(isNew){document.body.classList.remove('title');close();playing=true;selTap=-1;ensure(S);if(!unlocked().includes(S.seed))S.seed='carrot';save();
 if(isNew){panel('<h2>Welcome!</h2><p>Walk with the arrows. Stand beside your garden plot, pick a Seed, then Plant, Water and Pick. Every action earns XP. Check the Journal in the Menu for daily quests.</p><div class="col"><button id="ok">Let\'s go</button></div>');$('ok').onclick=close}}
function title(){playing=false;document.body.classList.add('title');
 panel('<div class="logo">Little<br>Meadow</div><p class="c">'+(corrupt?'Your old save could not be read. Start a new game to play.':'A quiet little farm to escape into.')+'</p><div class="col"><button id="bc"'+(hasSave?'':' disabled')+'>Continue</button><button id="bn">New Game</button><button id="bs2">Settings</button></div><p class="c" id="st">'+off+'</p>');
 $('bc').onclick=()=>begin();$('bn').onclick=()=>creator({skin:1,hs:0,hair:0,os:0,top:0,pants:0,hat:0},L=>{S=newState(L);S.set=SET;begin(true)},title,'Start');$('bs2').onclick=()=>settings(title)}
const OPT=[['skin','Skin',P.skin],['hs','Hair style',['Short','Long','Bun']],['hair','Hair colour',P.hair],['os','Outfit',['Tee','Overalls','Dress']],['top','Top colour',P.top],['pants','Bottom colour',P.pants],['hat','Hat',['None','Straw']]];
function creator(L,done,back,label){
 panel('<h2>Your look</h2><canvas id="pv" width="32" height="32"></canvas>'+OPT.map(([k,n,a])=>'<p class="c">'+n+'</p><div class="sws">'+a.map((v,i)=>{const c=v[0]==='#';return'<i data-k="'+k+'" data-i="'+i+'" class="'+(c?'':'t ')+(L[k]===i?'on':'')+'"'+(c?' style="background:'+v+'"':'')+'>'+(c?'':v)+'</i>'}).join('')+'</div>').join('')+'<div class="col"><button id="go">'+label+'</button><button id="bk">Back</button></div>');
 const pc=$('pv').getContext('2d'),rd=()=>{R(pc,'#9bb88a',0,0,32,32);player(pc,16,28,'d',0,false,L)};rd();
 ov.querySelectorAll('i').forEach(e=>{e.onclick=()=>{L[e.dataset.k]=+e.dataset.i;e.parentNode.childNodes.forEach(n=>n.classList.toggle('on',n===e));rd()}});
 $('go').onclick=()=>done(L);$('bk').onclick=back}
function pauseMenu(){if(!playing)return;panel('<h2>Paused</h2><div class="col"><button id="r">Resume</button><button id="j">Journal</button><button id="w">Change outfit</button><button id="s">Settings</button><button id="t">Save &amp; Title</button></div>');
 $('r').onclick=close;$('j').onclick=journal;$('w').onclick=()=>creator({...S.look},L=>{S.look=L;save();pauseMenu()},pauseMenu,'Save look');$('s').onclick=()=>settings(pauseMenu);$('t').onclick=async()=>{await save();hasSave=true;title()}}
function journal(){ensure(S);panel('<h2>Journal</h2><h3>Daily quests (day '+S.day+')</h3>'+S.dq.list.map(d=>'<p><b>'+(d.done?'[x] ':'[ ] ')+d.t+'</b> '+d.have+'/'+d.n+'<br>Reward: '+d.coins+' coins, '+d.xp+' XP</p>').join('')+'<h3>First steps</h3>'+QUESTS.map(([k,t,d])=>'<p><b>'+(S.qd.includes(k)?'[x] ':'[ ] ')+t+'</b><br>'+d+'</p>').join('')+'<h3>Diary</h3>'+S.log.slice(-6).reverse().map(l=>'<p class="l">'+l+'</p>').join('')+'<div class="col"><button id="bk">Back</button></div>');$('bk').onclick=pauseMenu}
function market(m){const n=Object.values(S.crops).reduce((a,b)=>a+b,0),v=Object.keys(S.crops).reduce((a,k)=>a+S.crops[k]*CROPS[k].sell,0);
 panel('<h2>Mama Ada\'s Stall</h2><p>Coins: '+S.coins+'</p><p class="c">'+(m||'Sell your harvest or buy new things.')+'</p><h3>Sell</h3><div class="col"><button id="ms"'+(n?'':' disabled')+'>Sell all ('+n+' items, +'+v+' coins)</button></div><h3>Seeds</h3><div class="col">'+Object.keys(CROPS).map(k=>{const d=CROPS[k];return d.lv>S.lv?'<button disabled>'+d.n+': unlocks at level '+d.lv+'</button>':'<button data-b="'+k+'">'+d.n+' ('+d.cost+' coins), you have '+(S.inv[k]||0)+'</button>'}).join('')+'</div><h3>Land</h3><div class="col">'+(S.land<PLOTS.length?'<button id="ml">Buy garden plot '+(S.land+1)+' ('+LANDC[S.land]+' coins)</button>':'<p>You own all the land for now.</p>')+'<button id="mx">Close</button></div>');
 const go=(r,s)=>{if(r===true){sfx('coin');save();market(s)}else{sfx('no');market(r)}};
 $('ms').onclick=()=>go(Logic.sell(S),'Sold! Coins added.');ov.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>go(Logic.buy(S,b.dataset.b),'Bought a seed.'));
 if($('ml'))$('ml').onclick=()=>go(Logic.land(S),'New plot is yours!');$('mx').onclick=close}
function settings(back){const sv=()=>{try{localStorage.setItem('lm-set',JSON.stringify(SET))}catch(e){}};
 panel('<h2>Settings</h2><div class="col"><button id="a">Sound effects: '+(SET.sfx?'On':'Off')+'</button><button id="m">Music: '+(SET.mus?'On':'Off')+'</button></div><p class="c">Volume</p><input id="v" type="range" min="0" max="100" value="'+Math.round(SET.vol*100)+'"><div class="col"><button id="er">Erase saved game</button><button id="bk">Back</button></div>');
 $('a').onclick=()=>{SET.sfx^=1;sv();sfx('tap');settings(back)};$('m').onclick=()=>{SET.mus^=1;sv();settings(back)};$('v').oninput=e=>{SET.vol=e.target.value/100;sv()};
 let c=0;$('er').onclick=async e=>{if(!c++){e.target.textContent='Tap again to erase';return}try{localStorage.removeItem(KEY)}catch(x){}try{await idbSet(KEY,'')}catch(x){}hasSave=false;corrupt=false;S=newState();S.set=SET;title()};$('bk').onclick=back}
function orders(m){panel('<h2>Order Board</h2><p class="c">'+(m||'Deliver crops for bonus coins and XP.')+'</p>'+S.orders.map((o,i)=>{const ok=Object.keys(o.items).every(k=>(S.crops[k]||0)>=o.items[k]);
  return'<p><b>'+o.who+'</b> wants '+Object.keys(o.items).map(k=>o.items[k]+' '+CROPS[k].n+' (you have '+(S.crops[k]||0)+')').join(', ')+'<br>Reward: '+o.coins+' coins, '+o.xp+' XP</p><div class="col"><button data-o="'+i+'"'+(ok?'':' disabled')+'>Deliver</button></div>'}).join('')+'<div class="col"><button id="ox">Close</button></div>');
 ov.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{const r=Logic.fill(S,+b.dataset.o);if(r===true){save();orders('Delivered! Thank you!')}else{sfx('no');orders(r)}});$('ox').onclick=close}
function act(k){if(sel<0)return;const r=Logic[k](S,sel);
 if(r===true){sfx({plant:'plant',water:'water',harvest:'pick'}[k]);save()}else{sfx('no');toast(r)}}
$('bp').onclick=()=>act('plant');$('bw').onclick=()=>act('water');$('bh').onclick=()=>act('harvest');$('bm').onclick=()=>market();$('bo').onclick=()=>orders();$('menu').onclick=pauseMenu;
$('bs').onclick=()=>{const l=unlocked();S.seed=l[(l.indexOf(S.seed)+1)%l.length];sfx('tap')};

/* ===== INPUT ===== */
document.querySelectorAll('#pad button').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();held[k]=1});['pointerup','pointercancel','pointerleave'].forEach(n=>b.addEventListener(n,()=>held[k]=0))});
const KM={ArrowUp:'u',w:'u',ArrowDown:'d',s:'d',ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r'};
addEventListener('keydown',e=>{if(KM[e.key])held[KM[e.key]]=1});addEventListener('keyup',e=>{if(KM[e.key])held[KM[e.key]]=0});
addEventListener('blur',()=>{for(const k in held)held[k]=0});addEventListener('contextmenu',e=>e.preventDefault());
const dist=i=>Math.hypot(S.x-(PLOTS[i][0]*T+8),S.y-4-(PLOTS[i][1]*T+8));
cv.addEventListener('pointerdown',e=>{if(!playing||paused)return;const r=cv.getBoundingClientRect(),wx=(e.clientX-r.left)/r.width*vw+cx,wy=(e.clientY-r.top)/r.height*vh+cy;
 const i=PLOTS.findIndex(([a,b])=>wx>=a*T-2&&wx<a*T+T+2&&wy>=b*T-2&&wy<b*T+T+2);
 if(i>=0){if(i>=S.land)toast('For sale! Buy this plot at the stall ('+LANDC[i]+' coins).');else if(dist(i)<42){selTap=i;sfx('tap')}else toast('Walk closer to that plot.')}
 else if(near&&wx>15*T-2&&wx<17*T+2&&wy>7*T-6&&wy<8*T+2)market();else if(nearB&&wx>12*T-2&&wx<13*T+2&&wy>7*T-2&&wy<8*T+2)orders()});

/* ===== LOOP ===== */
function fit(){const w=innerWidth,h=innerHeight;sc=Math.max(2,Math.round(w/140));vw=Math.ceil(w/sc);vh=Math.ceil(h/sc);cv.width=vw;cv.height=vh;g.imageSmoothingEnabled=false}
addEventListener('resize',fit);fit();
function update(dt){let dx=(held.r?1:0)-(held.l?1:0),dy=(held.d?1:0)-(held.u?1:0);moving=!!(dx||dy);
 if(moving){if(dx&&dy){dx*=.7071;dy*=.7071}S.dir=dy?(dy<0?'u':'d'):(dx<0?'l':'r');const sp=54*dt;
  if(!blk(S.x+dx*sp,S.y))S.x+=dx*sp;if(!blk(S.x,S.y+dy*sp))S.y+=dy*sp;anim+=dt*8}
 Logic.tick(S,dt);
 let best=-1,bd=30;for(let i=0;i<S.land;i++){const d=dist(i);if(d<bd){bd=d;best=i}}
 if(selTap>=0&&selTap<S.land&&dist(selTap)<46)best=selTap;else selTap=-1;sel=best;
 near=Math.hypot(S.x-(16*T),S.y-4-(7*T+8))<34;nearB=Math.hypot(S.x-(12*T+8),S.y-4-(7*T+8))<34}
const sT=(e,v)=>{if(e.textContent!==''+v)e.textContent=v},hud={co:$('co'),lv:$('lv'),tm:$('tm'),ht:$('ht'),xp:$('xp'),bs:$('bs')},SN=['Seed','Sprout','Growing','Ripe!'];
function ui(){const p=sel>=0?S.plots[sel]:null,st=p?stage(p):-1,rp=p&&ripe(p),d=CROPS[S.seed];
 $('bp').disabled=!(sel>=0&&!p);$('bw').disabled=!(p&&!rp);$('bh').disabled=!rp;$('bm').style.display=near?'':'none';$('bo').style.display=nearB?'':'none';
 sT(hud.co,S.coins);sT(hud.lv,S.lv);hud.xp.style.width=Math.round(S.xp/xpNeed(S.lv)*100)+'%';sT(hud.bs,d.n+' x'+(S.inv[S.seed]||0));
 const h=(6+S.t*24)%24,hh=Math.floor(h),mm=Math.floor(h%1*6)*10;sT(hud.tm,'Day '+S.day+'  '+(((hh+11)%12)+1)+':'+(mm<10?'0':'')+mm+(hh<12?' AM':' PM'));
 sT(hud.ht,sel<0?(near?'Mama Ada\'s stall nearby':nearB?'Order board nearby':'Walk beside a garden plot'):'Plot '+(sel+1)+': '+(p?CROPS[p.k].n+', '+SN[st]+(st<3?(p.w>0?', watered':', thirsty'):''):'Empty'))}
function draw(){const WW=MW*T,WH=MH*T;
 cx=vw>=WW?-Math.round((vw-WW)/2):Math.max(0,Math.min(WW-vw,Math.round(S.x-vw/2)));
 cy=vh>=WH?-Math.round((vh-WH)/2):Math.max(0,Math.min(WH-vh,Math.round(S.y-vh/2-8)));
 R(g,'#6f9460',0,0,vw,vh);g.save();g.translate(-cx,-cy);g.drawImage(ground,0,0);g.drawImage(cot,48,26);g.drawImage(crate,15*T,7*T);g.drawImage(board,12*T,7*T);player(g,16*T+8,8*T-1,'d',0,false,VIL);
 const tm=Date.now()/400;
 PLOTS.forEach(([a,b],i)=>{if(i>=S.land){g.drawImage(sign,a*T,b*T);return}const p=S.plots[i];g.drawImage(p&&p.w>0?soilW:soilD,a*T,b*T);if(p){const st=stage(p);g.drawImage(cropT[p.k][st],a*T,b*T);if(st===3)R(g,'#fff6d8',a*T+3+Math.round(Math.sin(tm)*2+2),b*T+2,1,1)}
  if(i===sel){g.globalAlpha=.7+Math.sin(tm*2)*.3;g.strokeStyle='#fff6d8';g.lineWidth=1;g.strokeRect(a*T+.5,b*T+.5,T-1,T-1);for(const[u,v]of[[0,0],[14,0],[0,14],[14,14]])R(g,'#e6a9b4',a*T+u,b*T+v,2,2);g.globalAlpha=1}});
 const ty=Math.floor(S.y/T),dt=t=>g.drawImage(treeT,t[0]*T,t[1]*T+T-24);let i=0;
 for(;i<trees.length&&trees[i][1]<=ty;i++)dt(trees[i]);
 player(g,S.x,S.y,S.dir,Math.floor(anim),moving,S.look);for(;i<trees.length;i++)dt(trees[i]);g.restore();
 const t=S.t,k=t<.55?0:t<.7?(t-.55)/.15:t<.9?1:(1-t)/.1;
 if(t>.5&&t<.7)R(g,'rgba(255,160,110,.1)',0,0,vw,vh);
 if(k>0){R(g,'rgba(25,30,80,'+(k*.5).toFixed(2)+')',0,0,vw,vh);if(k>.3){R(g,'rgba(255,220,130,.9)',56-cx,51-cy,8,7);R(g,'rgba(255,220,130,.9)',81-cx,51-cy,8,7)}}}
let last=0;function loop(ts){const dt=Math.min(.1,(ts-last)/1000||0);last=ts;if(playing&&!paused&&!document.hidden)update(dt);else moving=false;if(playing)drain();else EV.length=0;ui();draw();requestAnimationFrame(loop)}
setInterval(()=>{if(playing)save()},5000);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)save()});addEventListener('pagehide',()=>{if(playing)save()});

/* ===== OFFLINE / BOOT ===== */
if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{off='Offline setup failed. Open the game over https.';const s=$('st');if(s)s.textContent=off}));
 navigator.serviceWorker.ready.then(()=>{off='Offline ready \u2713';const s=$('st');if(s)s.textContent=off})}else off='Offline install is not supported in this browser.';
loadSave().then(r=>{hasSave=!!r.s;corrupt=r.bad;if(r.s){S=r.s;Object.assign(SET,S.set);S.set=SET}title()}).catch(()=>title());
requestAnimationFrame(loop);
})();
