(function(){
Games.push({
title:'第五關:征服歐洲 🗺️',
rules:'目標:攻佔俄羅斯(對手首都),並守住你的首都英國。\n每回合先獲得資金(各地區收入,首都和城市較高),用來招募步兵、坦克、砲兵,或升級科技與興建要塞。\n點選己方地區 → 再點相鄰地區:敵方/中立 = 進攻,己方 = 調動。每個地區每回合只能行動一次,每地最多 8 個單位。\n山地、森林、首都、要塞都有防禦加成;攻佔地區可提升軍階,增強全軍。30 回合時佔領較多者勝。',
start(root,api){
  const W=800,H=560,CELL=5,MAXD=100,MAXT=30,STACK=8;
  root.innerHTML='<div class="info" id="g5i"></div><canvas id="g5c"></canvas><div class="info" id="g5s"></div><div class="row" id="g5r1"></div><div class="row" id="g5r2"></div><div class="info" id="g5m"></div>';
  const $=s=>root.querySelector(s);
  const cv=$('#g5c'),info=$('#g5i'),selEl=$('#g5s'),msgEl=$('#g5m');
  cv.width=W;cv.height=H;cv.style.setProperty('--ar',W/H);
  const c=cv.getContext('2d');
  const TN={p:'平原',m:'山地',f:'森林'},TM={p:1,m:1.3,f:1.15},TI={p:'',m:'⛰',f:'🌲'};
  const U={inf:{n:'步兵',cost:3,hp:3,atk:1,def:1},tank:{n:'坦克',cost:8,hp:5,atk:3,def:2},art:{n:'砲兵',cost:6,hp:2,atk:3,def:0.5}};
  const RAW=[
   ['愛爾蘭',70,190,'p',1,0,'p',[2,0,0]],['英國',185,160,'p',4,1,'p',[4,1,0]],['伊比利亞',115,430,'m',2,0,'p',[3,0,0]],
   ['法國',255,315,'p',2,0,'p',[3,0,1]],['低地國',320,215,'p',2,0,'p',[2,0,0]],['德國',415,285,'p',2,0,'n',[4,1,0]],
   ['北歐',440,90,'f',1,0,'n',[2,0,0]],['波羅的海',545,170,'f',1,0,'e',[2,0,0]],['波蘭',555,260,'p',2,0,'e',[3,0,0]],
   ['阿爾卑斯',360,370,'m',1,0,'n',[3,0,0]],['意大利',430,450,'m',2,0,'n',[3,0,1]],['巴爾幹',595,400,'m',1,0,'n',[3,0,0]],
   ['羅馬尼亞',655,330,'p',1,0,'e',[2,0,0]],['烏克蘭',700,250,'p',2,0,'e',[3,0,1]],['俄羅斯',700,100,'f',4,1,'e',[4,1,0]],
   ['土耳其',710,470,'m',2,0,'n',[3,1,0]]];
  const S=RAW.map((a,i)=>({i,name:a[0],x:a[1],y:a[2],t:a[3],inc:a[4],cap:!!a[5],o:a[6],u:{inf:a[7][0],tank:a[7][1],art:a[7][2]},fort:0,acted:false}));
  const CAP={p:1,e:14};
  const adjL=[[0,1],[1,3],[1,4],[1,6],[2,3],[3,4],[3,5],[3,9],[4,5],[4,6],[5,6],[5,7],[5,8],[5,9],[6,7],[7,8],[7,14],[8,13],[8,12],[9,10],[10,11],[11,12],[11,15],[12,13],[12,15],[13,14],[7,13]];
  const adj=S.map(()=>[]);adjL.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});
  const gw=W/CELL,gh=H/CELL,gi=new Int8Array(gw*gh).fill(-1);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
    let bi=-1,bd=1e9;const px=x*CELL+CELL/2,py=y*CELL+CELL/2;
    S.forEach(s=>{const d=Math.hypot(px-s.x,py-s.y);if(d<bd){bd=d;bi=s.i;}});
    if(bd<MAXD)gi[y*gw+x]=bi;
  }
  const layer=document.createElement('canvas');layer.width=W;layer.height=H;const lc=layer.getContext('2d');
  const OC={p:'#5b9bf0',e:'#e8625a',n:'#cfc9ae'};
  function build(){
    lc.fillStyle='#bfe3f5';lc.fillRect(0,0,W,H);
    for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
      const r=gi[y*gw+x];if(r<0)continue;
      const rr=x+1<gw?gi[y*gw+x+1]:-1,rd=y+1<gh?gi[(y+1)*gw+x]:-1;
      lc.fillStyle=(rr!==r||rd!==r)?'#3a2340':OC[S[r].o];
      lc.fillRect(x*CELL,y*CELL,CELL,CELL);
    }
  }
  const money={p:6,e:6},tech={p:{a:0,d:0},e:{a:0,d:0}},caps={p:0,e:0};
  let dirty=true,sel=-1,turn=1,busy=false,dead=false,raf=0,msg='',flash={};
  api.onCleanup(()=>{dead=true;cancelAnimationFrame(raf)});
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const total=u=>u.inf+u.tank+u.art;
  const power=u=>u.inf+3*u.tank+3*u.art;
  const cnt=o=>S.filter(s=>s.o===o).length;
  const income=o=>S.filter(s=>s.o===o).reduce((a,s)=>a+s.inc,0);
  const rank=o=>Math.min(5,Math.floor(caps[o]/2));
  const atkMult=o=>1+0.12*tech[o].a+0.06*rank(o);
  function defMult(r){
    const base=r.o==='n'?1:1+0.12*tech[r.o].d+0.04*rank(r.o);
    return base*TM[r.t]*(1+0.25*r.fort)*(r.cap?1.15:1);
  }
  const utext=u=>[u.inf?'步'+u.inf:'',u.tank?'坦'+u.tank:'',u.art?'砲'+u.art:''].filter(Boolean).join(' ')||'無';
  function split(u){const a={inf:u.inf,tank:u.tank,art:u.art};if(a.inf>0)a.inf--;else if(a.art>0)a.art--;else a.tank--;return a;}
  function simBattle(att,reg,side){
    const mk=u=>{const l=[];['inf','art','tank'].forEach(t=>{for(let i=0;i<u[t];i++)l.push({t,hp:U[t].hp});});return l;};
    let A=mk(att),D=mk(reg.u);
    const am=atkMult(side),dm=defMult(reg),ord={inf:0,art:1,tank:2};
    const ap=l=>l.reduce((s,x)=>s+U[x.t].atk,0),dp=l=>l.reduce((s,x)=>s+U[x.t].def,0);
    const dmg=(l,d)=>{l.sort((a,b)=>ord[a.t]-ord[b.t]);while(d>0&&l.length){const x=l[0],k=Math.min(x.hp,d);x.hp-=k;d-=k;if(x.hp<=0)l.shift();}};
    const a0=A.length,d0=D.length;
    for(let r=0;r<5&&A.length&&D.length;r++){
      const a=ap(A)*am*(0.8+Math.random()*0.4),d=dp(D)*dm*(0.8+Math.random()*0.4);
      dmg(D,a*0.65);dmg(A,d*0.65);
    }
    if(!D.length&&!A.length)D=[{t:'inf',hp:1}];
    const cn=l=>{const o={inf:0,tank:0,art:0};l.forEach(x=>o[x.t]++);return o;};
    return{captured:D.length===0,A:cn(A),D:cn(D),aLost:a0-A.length,dLost:d0-D.length};
  }
  function doAttack(src,dst,side){
    const att=split(src.u);
    ['inf','tank','art'].forEach(t=>{src.u[t]-=att[t];});
    const res=simBattle(att,dst,side);
    src.acted=true;flash[dst.i]=performance.now();
    const who=side==='p'?'你':'對手';
    let m;
    if(res.captured){
      const oldO=dst.o;dst.o=side;dst.u=res.A;dst.fort=0;dst.acted=true;dirty=true;
      caps[side]++;
      const rk=rank(side);
      m=who+'攻佔 '+dst.name+'!(損失 '+res.aLost+',殲敵 '+res.dLost+')'+(caps[side]%2===0?' ⭐軍階提升!':'');
      Sfx.pop(200);
    }else{
      ['inf','tank','art'].forEach(t=>{src.u[t]+=res.A[t];});
      dst.u=res.D;
      m=who+'進攻 '+dst.name+' 失敗(損失 '+res.aLost+',殲敵 '+res.dLost+')';
      Sfx.hit(0.6);
    }
    msg=m;return res;
  }
  function endCheck(){
    if(S[CAP.e].o==='p'){busy=true;msg='🏆 攻陷莫斯科!';refresh();api.win();return true;}
    if(S[CAP.p].o==='e'){busy=true;msg='首都淪陷';refresh();api.lose('你的首都英國被攻陷了。');return true;}
    if(cnt('p')===0){busy=true;api.lose('你的領土全部被佔領。');return true;}
    if(cnt('e')===0){busy=true;api.win();return true;}
    return false;
  }
  // ---------- UI
  const row1=$('#g5r1'),row2=$('#g5r2');
  const B={};
  function mkb(row,key,fn,cls){const b=document.createElement('button');b.className='btn '+(cls||'');b.style.fontSize='13px';b.style.padding='8px 10px';b.onclick=()=>{if(busy||dead)return;fn();};row.appendChild(b);B[key]=b;}
  function recruit(t){
    if(sel<0||S[sel].o!=='p'){msg='先選擇一個己方地區';refresh();return;}
    const r=S[sel];
    if(total(r.u)>=STACK){msg='此地區單位已滿('+STACK+')';refresh();return;}
    if(money.p<U[t].cost){msg='資金不足';refresh();return;}
    money.p-=U[t].cost;r.u[t]++;Sfx.click();msg='招募了 '+U[t].n+' 於 '+r.name;refresh();
  }
  function upgrade(k){
    const lv=tech.p[k],cost=12*(lv+1);
    if(lv>=3||money.p<cost)return;money.p-=cost;tech.p[k]++;Sfx.good();msg=(k==='a'?'攻擊':'防禦')+'科技升到 Lv'+tech.p[k];refresh();
  }
  function fort(){
    if(sel<0||S[sel].o!=='p'){msg='先選擇一個己方地區';refresh();return;}
    const r=S[sel];if(r.fort>=2||money.p<10)return;
    money.p-=10;r.fort++;Sfx.pop(150);msg=r.name+' 建了要塞(防禦 +25%)';refresh();
  }
  mkb(row1,'inf',()=>recruit('inf'));mkb(row1,'tank',()=>recruit('tank'));mkb(row1,'art',()=>recruit('art'));
  mkb(row2,'ua',()=>upgrade('a'),'alt');mkb(row2,'ud',()=>upgrade('d'),'alt');mkb(row2,'fort',fort,'alt');
  mkb(row2,'end',()=>{Sfx.click();sel=-1;aiTurn();},'gray');
  function refresh(){
    info.textContent='💰'+money.p+'(+'+income('p')+')  ⭐軍階'+rank('p')+'  攻Lv'+tech.p.a+' 防Lv'+tech.p.d+'  |  第 '+turn+'/'+MAXT+' 回合  |  地區 '+cnt('p')+':'+cnt('e');
    if(sel>=0){const r=S[sel];selEl.textContent=r.name+'('+TN[r.t]+(r.cap?',首都':'')+',收入'+r.inc+')  '+utext(r.u)+'  '+total(r.u)+'/'+STACK+(r.fort?'  🏰×'+r.fort:'')+(r.acted?'  [已行動]':'');}
    else selEl.textContent='點選一個己方(藍色)地區';
    msgEl.textContent=msg;
    const ok=!busy&&sel>=0&&S[sel].o==='p'&&total(S[sel].u)<STACK;
    B.inf.textContent='步兵 $3';B.tank.textContent='坦克 $8';B.art.textContent='砲兵 $6';
    B.inf.disabled=!ok||money.p<3;B.tank.disabled=!ok||money.p<8;B.art.disabled=!ok||money.p<6;
    const ca=12*(tech.p.a+1),cd=12*(tech.p.d+1);
    B.ua.textContent=tech.p.a>=3?'攻擊 MAX':'攻擊↑ $'+ca;B.ud.textContent=tech.p.d>=3?'防禦 MAX':'防禦↑ $'+cd;
    B.ua.disabled=busy||tech.p.a>=3||money.p<ca;B.ud.disabled=busy||tech.p.d>=3||money.p<cd;
    B.fort.textContent='要塞 $10';B.fort.disabled=busy||sel<0||S[sel].o!=='p'||S[sel].fort>=2||money.p<10;
    B.end.textContent='結束回合 ▶';B.end.disabled=busy;
  }
  function pick(e){
    const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
    let best=-1,bd=65;S.forEach(s=>{const d=Math.hypot(x-s.x,y-s.y);if(d<bd){bd=d;best=s.i;}});return best;
  }
  function describe(r){msg=r.name+'('+(r.o==='e'?'敵軍':'中立')+','+TN[r.t]+(r.cap?',首都':'')+'):'+utext(r.u)+',防禦 ×'+defMult(r).toFixed(2);}
  cv.addEventListener('pointerdown',e=>{
    if(busy||dead)return;
    const i=pick(e);
    if(i<0){sel=-1;refresh();return;}
    const r=S[i];
    if(sel<0){if(r.o==='p'){sel=i;Sfx.click();}else describe(r);refresh();return;}
    if(i===sel){sel=-1;refresh();return;}
    const s0=S[sel];
    if(adj[sel].includes(i)){
      if(s0.acted){msg=s0.name+' 本回合已行動';refresh();return;}
      if(total(s0.u)<2){msg='至少要有 2 個單位才能行動';refresh();return;}
      if(r.o==='p'){
        const mv=split(s0.u);let space=STACK-total(r.u),moved=0;
        ['tank','art','inf'].forEach(t=>{const k=Math.min(mv[t],space);r.u[t]+=k;s0.u[t]-=k;space-=k;moved+=k;});
        if(moved===0){msg=r.name+' 單位已滿';refresh();return;}
        s0.acted=true;msg='調動 '+moved+' 個單位到 '+r.name;Sfx.click();sel=-1;
      }else{
        doAttack(s0,r,'p');sel=-1;
      }
      refresh();endCheck();
    }else{
      if(r.o==='p'){sel=i;Sfx.click();}else describe(r);
      refresh();
    }
  });
  // ---------- AI
  function distMap(){
    const d=S.map(()=>99),q=[];S.forEach(s=>{if(s.o!=='e'){d[s.i]=0;q.push(s.i);}});
    while(q.length){const x=q.shift();adj[x].forEach(n=>{if(d[n]>d[x]+1){d[n]=d[x]+1;q.push(n);}});}
    return d;
  }
  async function aiTurn(){
    busy=true;S.forEach(r=>{if(r.o==='e')r.acted=false;});
    money.e+=income('e');msg='對手回合…';refresh();await sleep(700);if(dead)return;
    for(let k=0;k<2;k++){
      const key=Math.random()<0.55?'a':'d',cost=12*(tech.e[key]+1);
      if(tech.e[key]<3&&money.e>=cost+4&&turn>=2){money.e-=cost;tech.e[key]++;msg='對手研發了新科技';refresh();await sleep(500);if(dead)return;}
    }
    const ec=S[CAP.e];
    if(money.e>=13&&ec.fort<2&&adj[ec.i].some(n=>S[n].o!=='e')){money.e-=10;ec.fort++;}
    let g=0;
    while(money.e>=3&&g++<14){
      const cand=S.filter(r=>r.o==='e'&&total(r.u)<STACK);
      if(!cand.length)break;
      const sc=r=>{const h=adj[r.i].filter(n=>S[n].o!=='e');return h.length?h.reduce((s,n)=>s+power(S[n].u),0)+(r.cap?6:0)-power(r.u)*0.5+Math.random()*3:-50+Math.random();};
      cand.sort((a,b)=>sc(b)-sc(a));const r=cand[0];
      let t='inf';
      if(money.e>=8&&r.u.tank<=r.u.inf/2+0.5)t='tank';else if(money.e>=6&&r.u.art<=r.u.inf/3)t='art';
      r.u[t]++;money.e-=U[t].cost;
    }
    for(let pass=0;pass<(turn>=2?2:0);pass++){
      const order=S.filter(r=>r.o==='e'&&!r.acted&&total(r.u)>=2).sort(()=>Math.random()-0.5);
      for(const r of order){
        if(dead)return;
        if(r.o!=='e'||r.acted||total(r.u)<2)continue;
        let best=null;
        adj[r.i].forEach(n=>{
          const d=S[n];if(d.o==='e')return;
          const att=split(r.u);let w=0;for(let k=0;k<6;k++)if(simBattle(att,d,'e').captured)w++;
          const wr=w/6,val=wr+(d.cap?0.6:0)+d.inc*0.05+(d.o==='p'?0.1:0),need=d.cap?0.45:0.75;
          if(wr>=need&&(!best||val>best.val))best={d,val};
        });
        if(best){doAttack(r,best.d,'e');refresh();await sleep(1000);if(dead)return;if(endCheck())return;}
      }
    }
    const dm=distMap();
    S.filter(r=>r.o==='e'&&!r.acted&&total(r.u)>1&&dm[r.i]>1).forEach(r=>{
      let to=null;adj[r.i].forEach(n=>{if(S[n].o==='e'&&dm[n]<dm[r.i]&&total(S[n].u)<STACK&&(!to||dm[n]<dm[to.i]))to=S[n];});
      if(to){const mv=split(r.u);let sp=STACK-total(to.u);['tank','art','inf'].forEach(t=>{const k=Math.min(mv[t],sp);to.u[t]+=k;r.u[t]-=k;sp-=k;});r.acted=true;}
    });
    turn++;
    if(turn>MAXT){
      busy=true;const p=cnt('p'),e=cnt('e');
      if(p>e){msg='30 回合結束,你佔領較多地區!';refresh();api.win();}
      else{msg='30 回合結束,對手佔領較多地區';refresh();api.lose('時間到,你的領土不夠多('+p+' 對 '+e+')。');}
      return;
    }
    startPlayer();
  }
  function startPlayer(){
    S.forEach(r=>{if(r.o==='p')r.acted=false;});
    money.p+=income('p');busy=false;dirty=true;
    msg='你的回合:收入 +'+income('p')+'。招募、升級、進攻吧!';refresh();
  }
  function draw(now){
    if(dead)return;
    if(dirty){build();dirty=false;}
    c.drawImage(layer,0,0);
    c.save();c.strokeStyle='#ffffff99';c.lineWidth=1.5;c.setLineDash([4,5]);
    adjL.forEach(([a,b])=>{c.beginPath();c.moveTo(S[a].x,S[a].y);c.lineTo(S[b].x,S[b].y);c.stroke();});
    c.restore();
    S.forEach(s=>{
      if(sel>=0&&adj[sel].includes(s.i)){
        c.setLineDash([6,4]);c.strokeStyle=s.o==='p'?'#1fa84a':'#c00';c.lineWidth=3;c.beginPath();c.arc(s.x,s.y,29,0,7);c.stroke();c.setLineDash([]);
      }
      if(s.i===sel){c.strokeStyle='#ffd400';c.lineWidth=5;c.beginPath();c.arc(s.x,s.y,29,0,7);c.stroke();}
      const f=flash[s.i]&&now-flash[s.i]<500;
      c.fillStyle=f?'#fff58a':(s.o==='p'&&s.acted&&!busy?'#ddd':'#fff');
      c.beginPath();c.arc(s.x,s.y,20,0,7);c.fill();
      c.strokeStyle=s.o==='p'?'#1f5fc0':s.o==='e'?'#b3261e':'#8c866a';c.lineWidth=s.cap?5:3;c.stroke();
      c.fillStyle='#222';c.font='bold 17px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(total(s.u),s.x,s.y+1);
      c.font='13px sans-serif';
      if(TI[s.t])c.fillText(TI[s.t],s.x-27,s.y-20);
      if(s.fort)c.fillText('🏰'+s.fort,s.x+28,s.y-20);
      if(s.cap)c.fillText('★',s.x,s.y-30);
      c.font='bold 13px sans-serif';c.lineWidth=3;c.strokeStyle='#fff';c.strokeText(s.name,s.x,s.y+34);c.fillStyle='#3a2340';c.fillText(s.name,s.x,s.y+34);
      c.font='11px sans-serif';c.strokeText(utext(s.u),s.x,s.y+48);c.fillText(utext(s.u),s.x,s.y+48);
    });
    raf=requestAnimationFrame(draw);
  }
  if(window.__TEST)window.__g5={S,adj,aiTurn,simBattle,money,tech,startPlayer};
  startPlayer();raf=requestAnimationFrame(draw);
}});
})();
