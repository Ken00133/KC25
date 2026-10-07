(function(){
Games.push({
title:'第三關:八球 🎱',
rules:'完整八球規則:先打進第一粒球決定你是全色(1-7)或花色(9-15)。清光自己的球後,最後打進黑 8 獲勝。\n白球落袋或先碰錯球 = 犯規,對手可任意擺放白球。\n操作:在枱面按住拖曳(向瞄準的反方向拉),放手擊球;拉得越遠力度越大。橫向手機更好玩。',
start(root,api){
  const W=800,H=400,R=10,M=30,PR=22;
  root.innerHTML='<div class="info" id="g3i"></div><canvas id="g3c"></canvas><div class="info" id="g3m"></div>';
  const cv=root.querySelector('#g3c'),info=root.querySelector('#g3i'),msgEl=root.querySelector('#g3m');
  cv.width=W;cv.height=H;cv.style.setProperty('--ar',W/H);cv.style.setProperty('--ar',W/H);
  const c=cv.getContext('2d');
  const COL=[null,'#f5c400','#1e4fd8','#e02020','#6a2aa0','#f07a10','#118a3a','#7a1a1a','#111'];
  const pockets=[[M,M],[W/2,M-5],[W-M,M],[M,H-M],[W/2,H-M+5],[W-M,H-M]];
  const mk=(n,x,y)=>({n,x,y,vx:0,vy:0,in:false});
  const cue=mk(0,200,H/2),balls=[cue];
  const order=[1,2,3,4,5,6,7,9,10,11,12,13,14,15];
  for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const d=2*R+0.6;let k=0;
  for(let col=0;col<5;col++)for(let row=0;row<=col;row++){
    const n=(col===2&&row===1)?8:order[k++];
    balls.push(mk(n,560+col*d*0.866,H/2+(row-col/2)*d));
  }
  const type=n=>n<8?'solid':'stripe';
  const nm=g=>g==='solid'?'全色':g==='stripe'?'花色':'未定';
  let turn='p',phase='aim',grp={p:null,a:null},shot={first:null,pocketed:[],scratch:false},drag=null,dead=false,raf=0,timers=[],msg='開球!輪到你';
  api.onCleanup(()=>{dead=true;cancelAnimationFrame(raf);timers.forEach(clearTimeout)});
  const later=(f,ms)=>timers.push(setTimeout(()=>{if(!dead)f()},ms));
  const rem=g=>g?balls.filter(b=>!b.in&&b.n>0&&b.n!==8&&type(b.n)===g).length:7;
  function upd(){
    info.textContent='你:'+nm(grp.p)+'(剩 '+rem(grp.p)+')  |  電腦:'+nm(grp.a)+'(剩 '+rem(grp.a)+')';
    msgEl.textContent=msg;
  }
  function shoot(ang,v){
    cue.vx=Math.cos(ang)*v;cue.vy=Math.sin(ang)*v;
    shot={first:null,pocketed:[],scratch:false};phase='moving';Sfx.kick();
  }
  function pot(b){b.in=true;b.vx=b.vy=0;if(b===cue)shot.scratch=true;else shot.pocketed.push(b.n);Sfx.pot();}
  function physics(){
    const SUB=5;
    for(let s=0;s<SUB;s++){
      for(const b of balls){
        if(b.in)continue;
        b.x+=b.vx/SUB;b.y+=b.vy/SUB;
        for(const p of pockets){if(Math.hypot(b.x-p[0],b.y-p[1])<PR){pot(b);break;}}
        if(b.in)continue;
        const sp=Math.hypot(b.vx,b.vy);
        if(b.x<M+R){b.x=M+R;b.vx=Math.abs(b.vx)*0.8;Sfx.hit(Math.min(1,sp/15));}
        if(b.x>W-M-R){b.x=W-M-R;b.vx=-Math.abs(b.vx)*0.8;Sfx.hit(Math.min(1,sp/15));}
        if(b.y<M+R){b.y=M+R;b.vy=Math.abs(b.vy)*0.8;Sfx.hit(Math.min(1,sp/15));}
        if(b.y>H-M-R){b.y=H-M-R;b.vy=-Math.abs(b.vy)*0.8;Sfx.hit(Math.min(1,sp/15));}
      }
      for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
        const a=balls[i],b=balls[j];if(a.in||b.in)continue;
        const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
        if(dist<2*R&&dist>0){
          const nx=dx/dist,ny=dy/dist,ov=2*R-dist;
          a.x-=nx*ov/2;a.y-=ny*ov/2;b.x+=nx*ov/2;b.y+=ny*ov/2;
          const dv=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
          if(dv>0){
            a.vx-=dv*nx;a.vy-=dv*ny;b.vx+=dv*nx;b.vy+=dv*ny;
            Sfx.hit(Math.min(1,dv/12));
            if(shot.first==null){if(a===cue)shot.first=b.n;else if(b===cue)shot.first=a.n;}
          }
        }
      }
    }
    let moving=false;
    for(const b of balls){
      if(b.in)continue;
      b.vx*=0.988;b.vy*=0.988;
      if(Math.hypot(b.vx,b.vy)<0.08){b.vx=b.vy=0;}else moving=true;
    }
    if(!moving)resolve();
  }
  function finish(w){
    phase='over';upd();
    later(()=>{if(w==='p')api.win();else api.lose('電腦打進黑 8 或你犯規輸了。再試一次!');},1200);
  }
  function resolve(){
    const s=turn,o=s==='p'?'a':'p',P=shot.pocketed,sc=shot.scratch,who=s==='p'?'你':'電腦',oth=s==='p'?'電腦':'你';
    const g=grp[s];
    const before=g?rem(g)+P.filter(n=>n!==8&&type(n)===g).length:7;
    const cleared=!!g&&before===0;
    let foul=sc,legal;
    if(shot.first==null)legal=false;
    else if(g)legal=cleared?shot.first===8:(shot.first!==8&&type(shot.first)===g);
    else legal=shot.first!==8;
    if(!legal)foul=true;
    if(P.includes(8)){
      if(cleared&&!foul){msg=who+'打進黑 8!';finish(s);}
      else{msg=who+'黑 8 落袋但不合規則!';finish(o);}
      return;
    }
    if(!g&&!foul){const f=P.find(n=>n!==8);if(f){grp[s]=type(f);grp[o]=grp[s]==='solid'?'stripe':'solid';}}
    const own=P.some(n=>n!==8&&grp[s]&&type(n)===grp[s]);
    if(foul){
      msg=who+'犯規'+(sc?'(白球落袋)':!legal?'(先碰錯球/沒碰球)':'')+'!'+oth+'獲得自由球';
      turn=o;phase='place';Sfx.bad();
    }else if(own){msg=who+'繼續擊球';phase='aim';}
    else{turn=o;phase='aim';msg='輪到'+oth;}
    upd();
    if(turn==='a')later(aiTurn,1100);
    else if(phase==='place')msg+=':點擊枱面放置白球';
    upd();
  }
  function free(x,y){
    if(x<M+R||x>W-M-R||y<M+R||y>H-M-R)return false;
    return balls.every(b=>b===cue||b.in||Math.hypot(b.x-x,b.y-y)>2*R+1);
  }
  function placeCue(x,y){cue.x=x;cue.y=y;cue.vx=cue.vy=0;cue.in=false;phase='aim';}
  function blocked(x1,y1,x2,y2,ex){
    const dx=x2-x1,dy=y2-y1,L2=dx*dx+dy*dy;
    for(const b of balls){
      if(b.in||ex.includes(b))continue;
      let t=L2?((b.x-x1)*dx+(b.y-y1)*dy)/L2:0;t=Math.max(0,Math.min(1,t));
      if(Math.hypot(b.x-(x1+t*dx),b.y-(y1+t*dy))<1.8*R)return true;
    }
    return false;
  }
  function aiTurn(){
    if(dead||phase==='over')return;
    if(phase==='place'){
      for(let i=0;i<80;i++){const x=120+Math.random()*130,y=70+Math.random()*260;if(free(x,y)){placeCue(x,y);break;}}
      if(phase==='place')placeCue(150,H/2);
    }
    let targets=balls.filter(b=>!b.in&&b.n>0&&b.n!==8&&(!grp.a||type(b.n)===grp.a));
    if(grp.a&&rem(grp.a)===0)targets=balls.filter(b=>!b.in&&b.n===8);
    if(!targets.length)targets=balls.filter(b=>!b.in&&b.n>0);
    let best=null;
    for(const t of targets)for(const p of pockets){
      let ux=p[0]-t.x,uy=p[1]-t.y;const d2=Math.hypot(ux,uy);ux/=d2;uy/=d2;
      const gx=t.x-ux*2*R,gy=t.y-uy*2*R;
      if(gx<M+R||gx>W-M-R||gy<M+R||gy>H-M-R)continue;
      const vx=gx-cue.x,vy=gy-cue.y,d1=Math.hypot(vx,vy);if(d1<1)continue;
      const cos=(vx*ux+vy*uy)/d1;if(cos<0.35)continue;
      if(blocked(cue.x,cue.y,gx,gy,[cue,t])||blocked(t.x,t.y,p[0],p[1],[t,cue]))continue;
      const score=d1+d2+(1-cos)*400;
      if(!best||score<best.score)best={score,ang:Math.atan2(vy,vx),d1,d2};
    }
    if(!best){const t=targets[Math.floor(Math.random()*targets.length)];
      best={ang:Math.atan2(t.y-cue.y,t.x-cue.x),d1:Math.hypot(t.x-cue.x,t.y-cue.y),d2:200};}
    let ang=best.ang+(Math.random()-0.5)*0.09;
    if(Math.random()<0.15)ang+=(Math.random()<0.5?-1:1)*0.12;
    const v=Math.max(8,Math.min(20,(best.d1+best.d2)/83*1.4+4));
    shoot(ang,v);msg='電腦擊球…';upd();
  }
  function rayT(ang){
    const dx=Math.cos(ang),dy=Math.sin(ang);let best=2000;
    for(const b of balls){
      if(b===cue||b.in)continue;
      const fx=b.x-cue.x,fy=b.y-cue.y,pr=fx*dx+fy*dy;if(pr<=0)continue;
      const p2=fx*fx+fy*fy-pr*pr;if(p2>4*R*R)continue;
      best=Math.min(best,pr-Math.sqrt(4*R*R-p2));
    }
    const tx=dx>0?(W-M-R-cue.x)/dx:dx<0?(M+R-cue.x)/dx:1e9,ty=dy>0?(H-M-R-cue.y)/dy:dy<0?(M+R-cue.y)/dy:1e9;
    return Math.min(best,tx,ty);
  }
  function pt(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
  cv.addEventListener('pointerdown',e=>{
    if(turn!=='p'||dead)return;const p=pt(e);
    if(phase==='place'){if(free(p.x,p.y)){placeCue(p.x,p.y);msg='輪到你,拖曳擊球';upd();}return;}
    if(phase==='aim'){drag={a:p,b:p};cv.setPointerCapture(e.pointerId);}
  });
  cv.addEventListener('pointermove',e=>{if(drag)drag.b=pt(e);});
  cv.addEventListener('pointerup',()=>{
    if(!drag)return;
    const dx=drag.a.x-drag.b.x,dy=drag.a.y-drag.b.y,dd=Math.hypot(dx,dy);drag=null;
    if(dd>10&&phase==='aim'&&turn==='p'){shoot(Math.atan2(dy,dx),Math.min(dd,160)/160*20+1);msg='';upd();}
  });
  function drawBall(b){
    c.fillStyle='#0003';c.beginPath();c.arc(b.x+2,b.y+3,R,0,7);c.fill();
    c.save();c.translate(b.x,b.y);c.beginPath();c.arc(0,0,R,0,7);c.clip();
    if(b.n===0){c.fillStyle='#fff';c.fillRect(-R,-R,2*R,2*R);}
    else if(b.n>8){c.fillStyle='#fff';c.fillRect(-R,-R,2*R,2*R);c.fillStyle=COL[b.n-8];c.fillRect(-R,-5,2*R,10);}
    else{c.fillStyle=COL[b.n];c.fillRect(-R,-R,2*R,2*R);}
    if(b.n>0){c.fillStyle='#fff';c.beginPath();c.arc(0,0,4.8,0,7);c.fill();c.fillStyle='#000';c.font='bold 7px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(b.n,0,0.5);}
    const gr=c.createRadialGradient(-3,-3,1,0,0,R);gr.addColorStop(0,'#fff6');gr.addColorStop(1,'#0002');c.fillStyle=gr;c.fillRect(-R,-R,2*R,2*R);
    c.restore();
  }
  function draw(){
    if(dead)return;
    if(phase==='moving')physics();
    c.fillStyle='#6b3f1d';c.fillRect(0,0,W,H);
    c.fillStyle='#1f8f4e';c.fillRect(M-6,M-6,W-2*M+12,H-2*M+12);
    c.strokeStyle='#ffffff30';c.beginPath();c.moveTo(280,M);c.lineTo(280,H-M);c.stroke();
    c.fillStyle='#111';pockets.forEach(p=>{c.beginPath();c.arc(p[0],p[1],PR-3,0,7);c.fill();});
    balls.forEach(b=>{if(!b.in)drawBall(b);});
    if(phase==='aim'&&turn==='p'&&!cue.in){
      let ang=null,pow=0;
      if(drag){const dx=drag.a.x-drag.b.x,dy=drag.a.y-drag.b.y;if(Math.hypot(dx,dy)>4){ang=Math.atan2(dy,dx);pow=Math.min(Math.hypot(dx,dy),160)/160;}}
      if(ang!==null){
        const t=rayT(ang);c.setLineDash([6,6]);c.strokeStyle='#fff';c.lineWidth=2;
        c.beginPath();c.moveTo(cue.x,cue.y);c.lineTo(cue.x+Math.cos(ang)*t,cue.y+Math.sin(ang)*t);c.stroke();c.setLineDash([]);
        c.beginPath();c.arc(cue.x+Math.cos(ang)*t,cue.y+Math.sin(ang)*t,R,0,7);c.stroke();
        const bk=14+pow*70;c.strokeStyle='#e8c07a';c.lineWidth=5;c.beginPath();
        c.moveTo(cue.x-Math.cos(ang)*bk,cue.y-Math.sin(ang)*bk);c.lineTo(cue.x-Math.cos(ang)*(bk+170),cue.y-Math.sin(ang)*(bk+170));c.stroke();
        c.fillStyle='#fff';c.fillRect(20,H-14,pow*200,6);
      }
    }
    if(phase==='place'&&turn==='p'){c.fillStyle='#fff';c.font='bold 22px sans-serif';c.textAlign='center';c.fillText('點擊放置白球',W/2,H/2-40);}
    raf=requestAnimationFrame(draw);
  }
  upd();raf=requestAnimationFrame(draw);
}});
})();
