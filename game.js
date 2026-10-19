(function(){'use strict';
/* ===== LOGIC (no DOM, testable) ===== */
const T=16,MW=22,MH=20,DAY=150,NEED=90,WET=45,KEY='little-meadow-save';
const PLOTS=[[7,10],[9,10],[11,10]];
const LOOKS={hair:['#5c3f2b','#2b2020','#d9a441','#c4574a','#e6a9b4'],shirt:['#e6a9b4','#8fb8c9','#f2d27a','#a98fd0','#7fae7a'],skin:['#f3d2b3','#d9a577','#a8734e','#6e4630']};
const QUESTS=[['planted','First Seeds','Plant a carrot seed in a garden plot.'],['watered','Thirsty Sprouts','Water your planted seed.'],['harvested','First Harvest','Keep it watered, then pick the ripe carrot.'],['sold','Little Market','Sell a carrot at the market crate.']];
const stage=g=>g<20?0:g<50?1:g<NEED?2:3;
const newState=look=>({v:1,x:9*T,y:6*T+8,dir:'d',coins:5,inv:{seed:3,carrot:0},plots:PLOTS.map(()=>null),day:1,t:.15,
 q:{planted:0,watered:0,harvested:0,sold:0},qd:[],log:['Day 1: I arrived at Little Meadow. Time to start a garden.'],look:look||{hair:0,shirt:0,skin:0},set:{sfx:1,mus:1,vol:.6},savedAt:0});
const num=Number.isFinite;
const valid=s=>!!(s&&s.v===1&&num(s.x)&&num(s.y)&&num(s.coins)&&num(s.day)&&num(s.t)&&s.inv&&num(s.inv.seed)&&num(s.inv.carrot)&&Array.isArray(s.plots)&&s.plots.length===PLOTS.length&&s.plots.every(p=>p===null||(p&&num(p.g)&&num(p.w)))&&s.q&&Array.isArray(s.qd)&&Array.isArray(s.log)&&s.look&&s.set);
const Logic={
 plant(S,i){if(S.plots[i])return'Something is already growing here.';if(S.inv.seed<1)return'No seeds left. Buy some at the market crate.';S.inv.seed--;S.plots[i]={g:0,w:0};S.q.planted++;return true},
 water(S,i){const p=S.plots[i];if(!p)return'Plant a seed first.';if(p.g>=NEED)return'Already ripe. Pick it!';if(p.w>WET-5)return'The soil is still damp.';p.w=WET;S.q.watered++;return true},
 harvest(S,i){const p=S.plots[i];if(!p||p.g<NEED)return'Not ripe yet.';S.plots[i]=null;S.inv.carrot++;S.q.harvested++;return true},
 sell(S){const n=S.inv.carrot;if(n<1)return'You have no carrots to sell.';S.inv.carrot=0;S.coins+=n*6;S.q.sold+=n;return true},
 buy(S){if(S.coins<3)return'Not enough coins.';S.coins-=3;S.inv.seed++;return true},
 tick(S,dt){for(const p of S.plots)if(p&&p.w>0){const u=Math.min(dt,p.w);p.w-=u;p.g=Math.min(NEED,p.g+u)}
  S.t+=dt/DAY;while(S.t>=1){S.t-=1;S.day++;S.log.push('Day '+S.day+': A new morning in the meadow.');if(S.log.length>30)S.log.shift()}},
 quests(S){const o=[];for(const[k,t]of QUESTS)if(S.q[k]>=1&&!S.qd.includes(k)){S.qd.push(k);S.coins+=5;S.log.push('Day '+S.day+': Finished "'+t+'".');o.push(t)}return o}
};
if(typeof document==='undefined'){module.exports={Logic,newState,valid,stage,PLOTS,NEED,WET};return}

/* ===== ART (drawn in code, no image files needed) ===== */
const $=i=>document.getElementById(i),cv=$('cv'),g=cv.getContext('2d');
const mk=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'));return c};
const R=(x,c,a,b,w,h)=>{x.fillStyle=c;x.fillRect(a,b,w,h)};
const grassT=[0,1,2,3].map(v=>mk(T,T,x=>{R(x,'#9bb88a',0,0,T,T);for(let i=0;i<5;i++)R(x,i%2?'#8aa97b':'#a9c498',(v*5+i*7)%15,(v*3+i*11)%14,1,2)}));
const flowerT=['#e6a9b4','#f6ecd6','#f2d27a','#c9a0dc'].map((c,k)=>mk(T,T,x=>{x.drawImage(grassT[k],0,0);R(x,'#6f9460',7,9,1,4);R(x,c,6,7,3,1);R(x,c,7,6,1,3);R(x,'#f2a93c',7,7,1,1)}));
const pathT=mk(T,T,x=>{R(x,'#d9bc8f',0,0,T,T);for(let i=0;i<7;i++)R(x,i%2?'#c9a273':'#e8d3ac',(i*5+2)%14,(i*7+1)%14,2,1)});
const soil=w=>mk(T,T,x=>{const d=w?'#5c3f2b':'#8a6144';R(x,w?'#6e4a35':'#a5784f',0,0,T,T);R(x,d,0,0,T,1);R(x,d,0,15,T,1);R(x,d,0,0,1,T);R(x,d,15,0,1,T);for(let r=4;r<14;r+=4)R(x,d,2,r,12,1)});
const soilD=soil(0),soilW=soil(1);
const cropT=[mk(T,T,x=>{R(x,'#c9a273',6,9,4,2);R(x,'#f6ecd6',7,9,1,1)}),
 mk(T,T,x=>{R(x,'#6fae5f',7,7,2,4);R(x,'#8fcf7a',5,7,2,1);R(x,'#8fcf7a',9,6,2,1)}),
 mk(T,T,x=>{R(x,'#5f9e50',5,5,2,7);R(x,'#6fae5f',7,3,2,9);R(x,'#5f9e50',9,5,2,7);R(x,'#8fcf7a',7,3,2,2)}),
 mk(T,T,x=>{R(x,'#5f9e50',5,3,2,6);R(x,'#6fae5f',7,2,2,7);R(x,'#5f9e50',9,3,2,6);R(x,'#ec8c3c',6,9,4,2);R(x,'#ec8c3c',7,11,2,2);R(x,'#ffb05a',6,9,1,1)})];
const treeT=mk(T,24,x=>{R(x,'rgba(0,0,0,.12)',2,20,12,3);R(x,'#7a5238',6,14,4,8);R(x,'#4f7a4a',1,5,14,10);R(x,'#4f7a4a',3,2,10,14);R(x,'#6b9a5e',3,3,8,8);R(x,'#86b673',4,4,3,3);R(x,'#e6a9b4',9,9,1,1);R(x,'#e6a9b4',5,11,1,1)});
const cot=mk(48,44,x=>{R(x,'rgba(0,0,0,.13)',2,38,46,5);R(x,'#8a6144',34,0,5,8);R(x,'#b95f6e',8,2,32,4);R(x,'#c76f7e',4,6,40,6);R(x,'#d98a98',0,12,48,6);R(x,'#b95f6e',0,18,48,2);R(x,'#f6ecd6',3,20,42,18);R(x,'#e3d2b0',3,34,42,4);R(x,'#8a6144',20,26,9,12);R(x,'#5c3f2b',20,26,9,1);R(x,'#f2d27a',26,32,1,1);
 for(const w of[8,33]){R(x,'#8a6144',w-1,24,10,10);R(x,'#9fcbd9',w,25,8,7);R(x,'#8a6144',w+3,25,1,7);R(x,'#8a6144',w,28,8,1);R(x,'#e6a9b4',w-1,34,10,2)}});
const crate=mk(T,T,x=>{R(x,'rgba(0,0,0,.13)',1,13,14,3);R(x,'#a5784f',1,6,14,8);R(x,'#8a6144',1,6,14,1);R(x,'#8a6144',1,10,14,1);R(x,'#c99a6b',2,7,12,2);R(x,'#8a6144',7,0,2,6);R(x,'#f6ecd6',3,0,10,5);R(x,'#e6a9b4',7,2,2,2)});
$('i1').src=mk(8,8,x=>{R(x,'#c9972f',2,0,4,8);R(x,'#c9972f',0,2,8,4);R(x,'#f2d27a',2,1,4,6);R(x,'#f2d27a',1,2,6,4)}).toDataURL();
$('i2').src=mk(8,8,x=>{R(x,'#8a6144',1,0,6,8);R(x,'#f6ecd6',2,1,4,6);R(x,'#e6a9b4',3,3,2,2)}).toDataURL();
$('i3').src=mk(8,8,x=>{R(x,'#6fae5f',3,0,2,2);R(x,'#ec8c3c',2,2,4,4);R(x,'#ec8c3c',3,6,2,2)}).toDataURL();
function player(c,px,py,dir,fr,mv,L){const sk=LOOKS.skin[L.skin],hr=LOOKS.hair[L.hair],sh=LOOKS.shirt[L.shirt],X=Math.round(px)-8,Y=Math.round(py)-15,B=mv&&fr%2?1:0;
 R(c,'rgba(0,0,0,.18)',X+3,Y+13,10,3);R(c,'#5c3f2b',X+5,Y+11,2,3-(mv&&fr%2?1:0));R(c,'#5c3f2b',X+9,Y+11,2,3-(mv&&!(fr%2)?1:0));
 R(c,sh,X+4,Y+7-B,8,5);R(c,sk,X+3,Y+8-B,1,3);R(c,sk,X+12,Y+8-B,1,3);
 R(c,sk,X+4,Y+1-B,8,6);R(c,hr,X+3,Y-B,10,3);
 if(dir==='u')R(c,hr,X+3,Y-B,10,7);else{R(c,hr,X+3,Y+2-B,1,4);R(c,hr,X+12,Y+2-B,1,4);
  const e=dir==='l'?[5]:dir==='r'?[10]:[6,9];for(const a of e)R(c,'#3b2a22',X+a,Y+4-B,1,2);if(dir==='d'){R(c,'#e6a9b4',X+5,Y+6-B,1,1);R(c,'#e6a9b4',X+10,Y+6-B,1,1)}}}

/* ===== WORLD ===== */
let ground,solid,trees=[];
(function(){solid=new Uint8Array(MW*MH);let sd=7;const rnd=()=>(sd=sd*16807%2147483647)/2147483647;
 for(let i=0;i<MW;i++)trees.push([i,0],[i,MH-1]);for(let j=1;j<MH-1;j++)trees.push([0,j],[MW-1,j]);
 [[17,3],[18,5],[2,12],[16,14],[19,12],[6,15],[13,16],[2,16],[10,4],[19,8]].forEach(t=>trees.push(t));
 trees.forEach(([a,b])=>solid[b*MW+a]=1);for(let a=3;a<=5;a++)for(let b=2;b<=3;b++)solid[b*MW+a]=1;
 solid[7*MW+15]=1;PLOTS.forEach(([a,b])=>solid[b*MW+a]=1);trees.sort((p,q)=>p[1]-q[1]);
 const path=new Set();for(let b=4;b<=8;b++)path.add('4,'+b);for(let a=4;a<=17;a++)path.add(a+',8');
 ground=mk(MW*T,MH*T,x=>{for(let b=0;b<MH;b++)for(let a=0;a<MW;a++){const k=(a*7+b*13)%4;x.drawImage(path.has(a+','+b)?pathT:(!solid[b*MW+a]&&rnd()<.08?flowerT[k]:grassT[k]),a*T,b*T)}})})();
const sol=(x,y)=>{const a=Math.floor(x/T),b=Math.floor(y/T);return a<0||b<0||a>=MW||b>=MH||solid[b*MW+a]===1};
const blk=(x,y)=>[[-4,-4],[4,-4],[-4,0],[4,0]].some(([a,b])=>sol(x+a,y+b));
const fix=s=>{if(blk(s.x,s.y)){s.x=9*T;s.y=6*T+8}return s};

/* ===== STATE / SAVE ===== */
let S=newState(),SET={sfx:1,mus:1,vol:.6};
try{Object.assign(SET,JSON.parse(localStorage.getItem('lm-set')||'{}'))}catch(e){}
S.set=SET;
let playing=false,paused=true,hasSave=false,corrupt=false,sel=-1,selTap=-1,near=false,anim=0,moving=false,vw=160,vh=240,sc=3,cx=0,cy=0,off='Checking offline files...',toastT=0;
const held={};
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('little-meadow',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const idbSet=async(k,v)=>{const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})};
const idbGet=async k=>{const d=await idb();return new Promise((res,rej)=>{const r=d.transaction('kv').objectStore('kv').get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})};
async function save(){S.savedAt=Date.now();S.set=SET;const j=JSON.stringify(S);try{localStorage.setItem(KEY,j)}catch(e){}try{await idbSet(KEY,j)}catch(e){}}
async function loadSave(){let raw=[];try{raw.push(localStorage.getItem(KEY))}catch(e){}try{raw.push(await idbGet(KEY))}catch(e){}
 raw=raw.filter(Boolean);const ok=[];for(const r of raw){try{const o=JSON.parse(r);if(valid(o))ok.push(o)}catch(e){}}
 ok.sort((a,b)=>b.savedAt-a.savedAt);return{s:ok[0]?fix(ok[0]):null,bad:!ok.length&&raw.length>0}}

/* ===== AUDIO (synthesized, no files) ===== */
let AC,mi=3;const SC=[262,294,330,392,440,523,588];
function audio(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume()}
function tone(f,d,ty,v,dl){if(!AC)return;const o=AC.createOscillator(),n=AC.createGain(),t=AC.currentTime+(dl||0);o.type=ty;o.frequency.value=f;n.gain.setValueAtTime(0,t);n.gain.linearRampToValueAtTime(Math.max(.0002,v*SET.vol),t+.02);n.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(n);n.connect(AC.destination);o.start(t);o.stop(t+d+.05)}
const SFX={plant:[330,440],water:[520,620,720],pick:[523,659,784],coin:[880,1175],no:[180],tap:[440]};
const sfx=k=>{if(!SET.sfx)return;audio();(SFX[k]||[]).forEach((f,i)=>tone(f,.14,'square',.1,i*.08))};
setInterval(()=>{if(!AC||!SET.mus||!playing||document.hidden)return;mi=Math.max(0,Math.min(SC.length-1,mi+Math.floor(Math.random()*3)-1));if(Math.random()<.8)tone(SC[mi]/(Math.random()<.3?2:1),1.4,'triangle',.09)},900);
addEventListener('pointerdown',audio);

/* ===== UI ===== */
const ov=$('ov');
const panel=h=>{ov.innerHTML='<div class="pn">'+h+'</div>';ov.className='on';paused=true};
const close=()=>{ov.className='';paused=false};
function toast(m){const t=$('toast');t.textContent=m;t.className='px on';clearTimeout(toastT);toastT=setTimeout(()=>t.className='px',2400)}
function chkQ(){Logic.quests(S).forEach(t=>{sfx('coin');toast('Quest complete: '+t+' (+5 coins)')})}
function begin(isNew){document.body.classList.remove('title');close();playing=true;selTap=-1;save();
 if(isNew){panel('<h2>Welcome!</h2><p>Walk with the arrows. Stand beside a garden plot, then Plant, Water and Pick. Open the Journal from the Menu to see your first quest.</p><div class="col"><button id="ok">Let\'s go</button></div>');$('ok').onclick=close}}
function title(){playing=false;document.body.classList.add('title');
 panel('<div class="logo">Little<br>Meadow</div><p class="c">'+(corrupt?'Your old save could not be read. Start a new game to play.':'A quiet little farm to escape into.')+'</p><div class="col"><button id="bc"'+(hasSave?'':' disabled')+'>Continue</button><button id="bn">New Game</button><button id="bs">Settings</button></div><p class="c" id="st">'+off+'</p>');
 $('bc').onclick=()=>begin();$('bn').onclick=creator;$('bs').onclick=()=>settings(title)}
function creator(){const L={hair:0,shirt:0,skin:0};
 panel('<h2>Who are you?</h2><canvas id="pv" width="32" height="32"></canvas>'+['hair','shirt','skin'].map(k=>'<p class="c">'+k+'</p><div class="sws">'+LOOKS[k].map((c,i)=>'<i data-k="'+k+'" data-i="'+i+'" style="background:'+c+'"></i>').join('')+'</div>').join('')+'<div class="col"><button id="go">Start</button><button id="bk">Back</button></div>');
 const pc=$('pv').getContext('2d'),rd=()=>{R(pc,'#9bb88a',0,0,32,32);player(pc,16,28,'d',0,false,L)};rd();
 ov.querySelectorAll('i').forEach(e=>{e.onclick=()=>{L[e.dataset.k]=+e.dataset.i;e.parentNode.childNodes.forEach(n=>n.classList.toggle('on',n===e));rd()}});
 $('go').onclick=()=>{S=newState(L);S.set=SET;begin(true)};$('bk').onclick=title}
function pauseMenu(){if(!playing)return;panel('<h2>Paused</h2><div class="col"><button id="r">Resume</button><button id="j">Journal</button><button id="s">Settings</button><button id="t">Save &amp; Title</button></div>');
 $('r').onclick=close;$('j').onclick=journal;$('s').onclick=()=>settings(pauseMenu);$('t').onclick=async()=>{await save();hasSave=true;title()}}
function journal(){panel('<h2>Journal</h2><h3>Quests</h3>'+QUESTS.map(([k,t,d])=>'<p><b>'+(S.qd.includes(k)?'[x] ':'[ ] ')+t+'</b><br>'+d+'</p>').join('')+'<h3>Diary</h3>'+S.log.slice(-8).reverse().map(l=>'<p class="l">'+l+'</p>').join('')+'<div class="col"><button id="bk">Back</button></div>');$('bk').onclick=pauseMenu}
function market(m){panel('<h2>Market Crate</h2><p>Coins: '+S.coins+' | Carrots: '+S.inv.carrot+' | Seeds: '+S.inv.seed+'</p><p class="c">'+(m||'Carrots sell for 6 coins. Seeds cost 3.')+'</p><div class="col"><button id="ms">Sell all carrots</button><button id="mb">Buy carrot seed</button><button id="mx">Close</button></div>');
 const go=(f,s)=>()=>{const r=Logic[f](S);if(r===true){sfx('coin');chkQ();save();market(s)}else{sfx('no');market(r)}};
 $('ms').onclick=go('sell','Sold! Coins added.');$('mb').onclick=go('buy','Bought a seed.');$('mx').onclick=close}
function settings(back){const sv=()=>{try{localStorage.setItem('lm-set',JSON.stringify(SET))}catch(e){}};
 panel('<h2>Settings</h2><div class="col"><button id="a">Sound effects: '+(SET.sfx?'On':'Off')+'</button><button id="m">Music: '+(SET.mus?'On':'Off')+'</button></div><p class="c">Volume</p><input id="v" type="range" min="0" max="100" value="'+Math.round(SET.vol*100)+'"><div class="col"><button id="er">Erase saved game</button><button id="bk">Back</button></div>');
 $('a').onclick=()=>{SET.sfx^=1;sv();sfx('tap');settings(back)};$('m').onclick=()=>{SET.mus^=1;sv();settings(back)};$('v').oninput=e=>{SET.vol=e.target.value/100;sv()};
 let c=0;$('er').onclick=async e=>{if(!c++){e.target.textContent='Tap again to erase';return}try{localStorage.removeItem(KEY)}catch(x){}try{await idbSet(KEY,'')}catch(x){}hasSave=false;corrupt=false;S=newState();S.set=SET;title()};$('bk').onclick=back}
function act(k){if(sel<0)return;const r=Logic[k](S,sel);
 if(r===true){sfx({plant:'plant',water:'water',harvest:'pick'}[k]);toast({plant:'Planted a carrot seed!',water:'Watered! It grows while the soil is damp.',harvest:'Picked a carrot!'}[k]);chkQ();save()}else{sfx('no');toast(r)}}
$('bp').onclick=()=>act('plant');$('bw').onclick=()=>act('water');$('bh').onclick=()=>act('harvest');$('bm').onclick=()=>market();$('menu').onclick=pauseMenu;

/* ===== INPUT ===== */
document.querySelectorAll('#pad button').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();held[k]=1});['pointerup','pointercancel','pointerleave'].forEach(n=>b.addEventListener(n,()=>held[k]=0))});
const KM={ArrowUp:'u',w:'u',ArrowDown:'d',s:'d',ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r'};
addEventListener('keydown',e=>{if(KM[e.key])held[KM[e.key]]=1});addEventListener('keyup',e=>{if(KM[e.key])held[KM[e.key]]=0});
addEventListener('blur',()=>{for(const k in held)held[k]=0});addEventListener('contextmenu',e=>e.preventDefault());
const dist=i=>Math.hypot(S.x-(PLOTS[i][0]*T+8),S.y-4-(PLOTS[i][1]*T+8));
cv.addEventListener('pointerdown',e=>{if(!playing||paused)return;const r=cv.getBoundingClientRect(),wx=(e.clientX-r.left)/r.width*vw+cx,wy=(e.clientY-r.top)/r.height*vh+cy;
 const i=PLOTS.findIndex(([a,b])=>wx>=a*T-2&&wx<a*T+T+2&&wy>=b*T-2&&wy<b*T+T+2);
 if(i>=0){if(dist(i)<42){selTap=i;sfx('tap')}else toast('Walk closer to that plot.')}
 else if(near&&wx>15*T-2&&wx<16*T+2&&wy>7*T-6&&wy<8*T+2)market()});

/* ===== LOOP ===== */
function fit(){const w=innerWidth,h=innerHeight;sc=Math.max(2,Math.round(w/140));vw=Math.ceil(w/sc);vh=Math.ceil(h/sc);cv.width=vw;cv.height=vh;g.imageSmoothingEnabled=false}
addEventListener('resize',fit);fit();
function update(dt){let dx=(held.r?1:0)-(held.l?1:0),dy=(held.d?1:0)-(held.u?1:0);moving=!!(dx||dy);
 if(moving){if(dx&&dy){dx*=.7071;dy*=.7071}S.dir=dy?(dy<0?'u':'d'):(dx<0?'l':'r');const sp=54*dt;
  if(!blk(S.x+dx*sp,S.y))S.x+=dx*sp;if(!blk(S.x,S.y+dy*sp))S.y+=dy*sp;anim+=dt*8}
 Logic.tick(S,dt);chkQ();
 let best=-1,bd=30;PLOTS.forEach((p,i)=>{const d=dist(i);if(d<bd){bd=d;best=i}});
 if(selTap>=0&&dist(selTap)<46)best=selTap;else selTap=-1;sel=best;
 near=Math.hypot(S.x-(15*T+8),S.y-4-(7*T+8))<30}
const sT=(e,v)=>{if(e.textContent!==''+v)e.textContent=v},hud={co:$('co'),sd:$('sd'),cr:$('cr'),tm:$('tm'),ht:$('ht')};
function ui(){const p=sel>=0?S.plots[sel]:null,st=p?stage(p.g):-1;
 $('bp').disabled=!(sel>=0&&!p);$('bw').disabled=!(p&&st<3);$('bh').disabled=!(p&&p.g>=NEED);$('bm').style.display=near?'':'none';
 sT(hud.co,S.coins);sT(hud.sd,S.inv.seed);sT(hud.cr,S.inv.carrot);
 const h=(6+S.t*24)%24,hh=Math.floor(h),mm=Math.floor(h%1*6)*10;sT(hud.tm,'Day '+S.day+'  '+(((hh+11)%12)+1)+':'+(mm<10?'0':'')+mm+(hh<12?' AM':' PM'));
 sT(hud.ht,sel<0?(near?'Market crate nearby':'Walk beside a garden plot'):'Plot '+(sel+1)+': '+(p?['Seed','Sprout','Growing','Ripe!'][st]+(st<3?(p.w>0?', watered':', thirsty'):''):'Empty'))}
function draw(){const WW=MW*T,WH=MH*T;
 cx=vw>=WW?-Math.round((vw-WW)/2):Math.max(0,Math.min(WW-vw,Math.round(S.x-vw/2)));
 cy=vh>=WH?-Math.round((vh-WH)/2):Math.max(0,Math.min(WH-vh,Math.round(S.y-vh/2-8)));
 R(g,'#6f9460',0,0,vw,vh);g.save();g.translate(-cx,-cy);g.drawImage(ground,0,0);g.drawImage(cot,48,26);g.drawImage(crate,15*T,7*T);
 const tm=Date.now()/400;
 PLOTS.forEach(([a,b],i)=>{const p=S.plots[i];g.drawImage(p&&p.w>0?soilW:soilD,a*T,b*T);if(p){const st=stage(p.g);g.drawImage(cropT[st],a*T,b*T);if(st===3)R(g,'#fff6d8',a*T+3+Math.round(Math.sin(tm)*2+2),b*T+2,1,1)}
  if(i===sel){g.globalAlpha=.7+Math.sin(tm*2)*.3;g.strokeStyle='#fff6d8';g.lineWidth=1;g.strokeRect(a*T+.5,b*T+.5,T-1,T-1);R(g,'#e6a9b4',a*T,b*T,2,2);R(g,'#e6a9b4',a*T+14,b*T,2,2);R(g,'#e6a9b4',a*T,b*T+14,2,2);R(g,'#e6a9b4',a*T+14,b*T+14,2,2);g.globalAlpha=1}});
 const ty=Math.floor(S.y/T),dt=t=>g.drawImage(treeT,t[0]*T,t[1]*T+T-24);let i=0;
 for(;i<trees.length&&trees[i][1]<=ty;i++)dt(trees[i]);
 player(g,S.x,S.y,S.dir,Math.floor(anim),moving,S.look);for(;i<trees.length;i++)dt(trees[i]);g.restore();
 const t=S.t,k=t<.55?0:t<.7?(t-.55)/.15:t<.9?1:(1-t)/.1;
 if(t>.5&&t<.7)R(g,'rgba(255,160,110,.1)',0,0,vw,vh);
 if(k>0){R(g,'rgba(25,30,80,'+(k*.5).toFixed(2)+')',0,0,vw,vh);if(k>.3){R(g,'rgba(255,220,130,.9)',56-cx,51-cy,8,7);R(g,'rgba(255,220,130,.9)',81-cx,51-cy,8,7)}}}
let last=0;function loop(ts){const dt=Math.min(.1,(ts-last)/1000||0);last=ts;if(playing&&!paused&&!document.hidden)update(dt);else moving=false;ui();draw();requestAnimationFrame(loop)}
setInterval(()=>{if(playing)save()},5000);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)save()});addEventListener('pagehide',()=>{if(playing)save()});

/* ===== OFFLINE / BOOT ===== */
if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{off='Offline setup failed. Open the game over https.';const s=$('st');if(s)s.textContent=off}));
 navigator.serviceWorker.ready.then(()=>{off='Offline ready \u2713';const s=$('st');if(s)s.textContent=off})}else off='Offline install is not supported in this browser.';
loadSave().then(r=>{hasSave=!!r.s;corrupt=r.bad;if(r.s){S=r.s;Object.assign(SET,S.set);S.set=SET}title()}).catch(()=>title());
requestAnimationFrame(loop);
})();
