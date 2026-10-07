(function(){
Games.push({
title:'第五關:征服歐洲 🗺️',
rules:'回合制佔領。每回合先把增援兵力點到自己(藍色)的地區,然後點選自己的地區,再點相鄰的地區進攻(派出除 1 以外的全部兵力);點相鄰己方地區則調動兵力。\n戰鬥按兵力加隨機自動計算。消滅紅色對手(俄羅斯、烏克蘭、土耳其、波蘭起家)即勝;第 14 回合時佔領地區較多者勝。',
start(root,api){
  const W=800,H=560,CELL=5,MAXD=100;
  root.innerHTML='<div class="info" id="g5i"></div><canvas id="g5c"></canvas><div class="info" id="g5m"></div><div class="row"><button class="btn" id="g5e">結束回合 ▶</button></div>';
  const cv=root.querySelector('#g5c'),info=root.querySelector('#g5i'),msgEl=root.querySelector('#g5m'),endBtn=root.querySelector('#g5e');
  cv.width=W;cv.height=H;cv.style.setProperty('--ar',W/H);
  const c=cv.getContext('2d');
  const S=[
   ['愛爾蘭',80,190,'p',3],['英國',190,170,'p',4],['伊比利亞',120,430,'p',3],['法國',265,320,'p',4],
   ['德國',400,250,'n',3],['北歐',430,90,'n',2],['波蘭',550,215,'e',4],['意大利',400,410,'n',3],
   ['巴爾幹',560,380,'n',3],['烏克蘭',690,290,'e',3],['俄羅斯',690,110,'e',4],['土耳其',700,460,'e',3]
  ].map((a,i)=>({i,name:a[0],x:a[1],y:a[2],o:a[3],t:a[4]}));
  const adjL=[[0,1],[1,3],[1,4],[1,5],[2,3],[3,4],[3,7],[4,5],[4,6],[4,7],[4,8],[5,6],[5,10],[6,9],[6,10],[6,8],[7,8],[8,9],[8,11],[9,10],[9,11]];
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
  let dirty=true,sel=-1,pool=0,turn=1,busy=false,dead=false,raf=0,msg='',flash={};
  const MAXTURN=14;
  api.onCleanup(()=>{dead=true;cancelAnimationFrame(raf)});
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const cnt=o=>S.filter(s=>s.o===o).length;
  const calc=o=>Math.max(3,Math.floor(cnt(o)/2)+2);
  function upd(){
    info.textContent='第 '+turn+' / '+MAXTURN+' 回合   增援:'+pool+'   你 '+cnt('p')+' 區 | 對手 '+cnt('e')+' 區';
    msgEl.textContent=msg;
  }
  function attack(a,d){
    let A=a.t-1,D=d.t;const A0=A,D0=D;
    while(A>0&&D>0){if(Math.random()<A/(A+D)*1.04)D--;else A--;}
    const oldO=d.o,name=d.name;
    if(D<=0){d.o=a.o;d.t=Math.max(1,A);a.t=1;flash[d.i]=performance.now();dirty=true;Sfx.pop(200);
      return a.name+' 攻佔 '+name+'!('+A0+' 對 '+D0+')';}
    a.t=1+A;d.t=D;flash[d.i]=performance.now();Sfx.hit(0.5);
    return a.name+' 進攻 '+name+' 失敗('+A0+' 對 '+D0+')';
  }
  function checkEnd(){
    if(cnt('e')===0){busy=true;msg='🏆 全歐洲都是你的!';upd();api.win();return true;}
    if(cnt('p')===0){busy=true;msg='你被消滅了';upd();api.lose('你的領土全部被佔領。');return true;}
    return false;
  }
  function pick(e){
    const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
    let best=-1,bd=70;S.forEach(s=>{const d=Math.hypot(x-s.x,y-s.y);if(d<bd){bd=d;best=s.i;}});return best;
  }
  cv.addEventListener('pointerdown',e=>{
    if(busy||dead)return;const i=pick(e);if(i<0){sel=-1;return;}
    const s=S[i];
    if(pool>0){
      if(s.o==='p'){s.t++;pool--;Sfx.click();msg=pool?'繼續分配增援兵力':'增援完成,選擇地區進攻';upd();}
      return;
    }
    if(sel<0){if(s.o==='p'&&s.t>=2){sel=i;Sfx.click();msg='選擇相鄰的目標';}else msg='請選擇有 2 兵以上的己方地區';upd();return;}
    if(i===sel){sel=-1;return;}
    if(!adj[sel].includes(i)){if(s.o==='p'&&s.t>=2)sel=i;else sel=-1;return;}
    const a=S[sel];
    if(s.o==='p'){s.t+=a.t-1;a.t=1;msg='調動兵力到 '+s.name;Sfx.click();sel=-1;}
    else{msg=attack(a,s);sel=-1;}
    upd();checkEnd();
  });
  async function aiTurn(){
    busy=true;sel=-1;msg='對手回合…';upd();await sleep(600);if(dead)return;
    let p=calc('e');
    const front=S.filter(s=>s.o==='e'&&adj[s.i].some(n=>S[n].o!=='e'));
    if(front.length){
      const f=front.sort((a,b)=>b.t-a.t)[Math.random()<0.7?0:front.length-1];f.t+=p;
    }
    for(let k=0;k<8;k++){
      let opt=null;
      S.filter(s=>s.o==='e'&&s.t>=3).forEach(a=>adj[a.i].forEach(n=>{
        const d=S[n];if(d.o==='e')return;const r=(a.t-1)/d.t;
        if(r>1.15&&(!opt||r>opt.r))opt={a,d,r};
      }));
      if(!opt)break;
      msg=attack(opt.a,opt.d);upd();await sleep(900);if(dead)return;
      if(checkEnd())return;
    }
    S.filter(s=>s.o==='e'&&s.t>1&&!adj[s.i].some(n=>S[n].o!=='e')).forEach(s=>{
      const to=adj[s.i].find(n=>adj[n].some(m=>S[m].o!=='e'));
      if(to!==undefined){S[to].t+=s.t-1;s.t=1;}
    });
    turn++;
    if(turn>MAXTURN){
      busy=true;const pp=cnt('p'),ee=cnt('e');
      if(pp>ee){msg='回合結束,你佔領較多地區!';upd();api.win();}
      else{msg='回合結束,對手佔領較多地區';upd();api.lose('時間到,你的領土不夠多('+pp+' 對 '+ee+')。');}
      return;
    }
    pool=calc('p');busy=false;msg='你的回合:先分配 '+pool+' 個增援兵力(點自己的地區)';dirty=true;upd();
  }
  endBtn.onclick=()=>{
    if(busy)return;
    if(pool>0){msg='還有 '+pool+' 個增援未分配';upd();return;}
    Sfx.click();aiTurn();
  };
  function draw(now){
    if(dead)return;
    if(dirty){build();dirty=false;}
    c.drawImage(layer,0,0);
    S.forEach(s=>{
      if(sel>=0&&adj[sel].includes(s.i)&&s.o!=='p'){c.setLineDash([6,4]);c.strokeStyle='#c00';c.lineWidth=3;c.beginPath();c.arc(s.x,s.y,28,0,7);c.stroke();c.setLineDash([]);}
      if(s.i===sel){c.strokeStyle='#ffd400';c.lineWidth=5;c.beginPath();c.arc(s.x,s.y,28,0,7);c.stroke();}
      if(pool>0&&s.o==='p'){c.strokeStyle='#2ecc71';c.lineWidth=3;c.beginPath();c.arc(s.x,s.y,24+Math.sin(now/200)*2,0,7);c.stroke();}
      const f=flash[s.i]&&now-flash[s.i]<500;
      c.fillStyle=f?'#fff58a':'#fff';c.beginPath();c.arc(s.x,s.y,19,0,7);c.fill();
      c.strokeStyle=s.o==='p'?'#1f5fc0':s.o==='e'?'#b3261e':'#8c866a';c.lineWidth=3;c.stroke();
      c.fillStyle='#222';c.font='bold 18px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(s.t,s.x,s.y+1);
      c.font='bold 14px sans-serif';c.lineWidth=3;c.strokeStyle='#fff';c.strokeText(s.name,s.x,s.y+34);c.fillStyle='#3a2340';c.fillText(s.name,s.x,s.y+34);
    });
    raf=requestAnimationFrame(draw);
  }
  pool=calc('p');msg='你的回合:先分配 '+pool+' 個增援兵力(點自己的藍色地區)';upd();raf=requestAnimationFrame(draw);
}});
})();
