(function(){
Games.push({
title:'第四關:十二碼點球 ⚽',
rules:'標準互射點球:每方 5 球,先射的一方是你,領先到對手追不上就提早結束;5 球後平手則進入突然死亡。\n射門:點擊球門內的目標位置(太靠邊或太高可能射失)。\n撲救:對手起腳後,點擊球門想撲向的位置。',
start(root,api){
  const W=420,H=440,GX1=70,GX2=350,GY1=100,GY2=200,SX=210,SY=380;
  root.innerHTML='<div class="info" id="g4i"></div><canvas id="g4c"></canvas><div class="info" id="g4m"></div>';
  const cv=root.querySelector('#g4c'),info=root.querySelector('#g4i'),msgEl=root.querySelector('#g4m');
  cv.width=W;cv.height=H;cv.style.setProperty('--ar',W/H);
  const c=cv.getContext('2d');
  let pS=0,cS=0,pK=0,cK=0,pH=[],cH=[],mode='shoot',dead=false,raf=0,timers=[];
  let kx=210,kT=210,ball={x:SX,y:SY,s:1},anim=null,diveSet=false,txt='';
  api.onCleanup(()=>{dead=true;cancelAnimationFrame(raf);timers.forEach(clearTimeout)});
  const later=(f,ms)=>timers.push(setTimeout(()=>{if(!dead)f()},ms));
  const lerp=(a,b,t)=>a+(b-a)*t;
  function upd(){
    info.textContent='你 '+pS+' : '+cS+' 對手   '+(pK>=5&&cK>=5?'(突然死亡)':'');
    msgEl.textContent=txt;
  }
  function hist(){return '你 '+pH.join(' ')+'  |  對手 '+cH.join(' ');}
  function startShoot(){mode='shoot';kx=kT=210;ball={x:SX,y:SY,s:1};anim=null;txt='輪到你射門:點擊球門內的目標\n'+hist();upd();}
  function startSave(){
    mode='save';kx=kT=210;diveSet=false;ball={x:SX,y:SY,s:1};anim=null;txt='對手準備射門…點擊球門選擇撲救位置\n'+hist();upd();Sfx.whistle();
    later(()=>{
      let tx=90+Math.random()*240,ty=105+Math.random()*90;
      if(Math.random()<0.12){tx=Math.random()<0.5?GX1-30:GX2+30;}
      anim={t0:performance.now(),dur:850,tx,ty,type:'save'};Sfx.kick();
    },1300+Math.random()*900);
  }
  function pt(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
  cv.addEventListener('pointerdown',e=>{
    const p=pt(e);
    if(mode==='shoot'){
      if(p.y>270)return;
      mode='anim';
      let tx=p.x+(Math.random()-0.5)*24,ty=p.y+(Math.random()-0.5)*14;
      const k2=Math.random()<0.25?210:100+Math.random()*220;kT=k2;
      anim={t0:performance.now(),dur:520,tx,ty,type:'shoot'};Sfx.kick();
    }else if(mode==='save'){
      if(anim&&(performance.now()-anim.t0)/anim.dur>0.65)return;
      kT=Math.max(GX1+15,Math.min(GX2-15,p.x));diveSet=true;Sfx.click();
    }
  });
  function endKick(){
    const a=anim;anim=null;
    const inGoal=a.tx>GX1+4&&a.tx<GX2-4&&a.ty>GY1&&a.ty<GY2;
    let res;
    if(a.type==='shoot'){
      const edge=a.tx<GX1+25||a.tx>GX2-25||a.ty<GY1+14;
      if(!inGoal||(edge&&Math.random()<0.15))res='miss';
      else res=Math.abs(kx-a.tx)<52?'save':'goal';
      pK++;pH.push(res==='goal'?'⚽':'✖');if(res==='goal')pS++;
      txt=res==='goal'?'⚽ 入球!!':res==='save'?'🧤 被守門員撲出!':'❌ 射失了!';
    }else{
      if(!inGoal)res='miss';else res=Math.abs(kx-a.tx)<58?'save':'goal';
      cK++;cH.push(res==='goal'?'⚽':'✖');if(res==='goal')cS++;
      txt=res==='goal'?'😱 對手入球…':res==='save'?'🧤 撲救成功!!':'😅 對手射失了!';
    }
    if(res==='goal'){a.type==='shoot'?Sfx.cheer():Sfx.bad();if(a.type==='shoot')Sfx.good();}
    else if(a.type==='shoot'){Sfx.bad();}else{Sfx.good();Sfx.cheer();}
    upd();mode='wait';
    later(()=>{
      const pr=Math.max(0,5-pK),cr=Math.max(0,5-cK);
      let out=null;
      if(pK>=5&&cK>=5){if(pK===cK&&pS!==cS)out=pS>cS?'w':'l';}
      else{if(pS>cS+cr)out='w';else if(cS>pS+pr)out='l';}
      if(out==='w'){txt='🏆 你贏了點球大戰 '+pS+':'+cS;upd();api.win();}
      else if(out==='l'){txt='輸了點球大戰 '+pS+':'+cS;upd();api.lose('點球大戰輸了 '+pS+':'+cS+',再來!');}
      else if(a.type==='shoot')startSave();else startShoot();
    },1500);
  }
  function keeper(x,dive){
    c.save();c.translate(x,GY2-5);
    const tilt=Math.max(-0.7,Math.min(0.7,(kT-x)/90));c.rotate(tilt*(dive?1:0));
    c.fillStyle='#f5c400';c.fillRect(-12,-46,24,34);
    c.fillStyle='#222';c.fillRect(-12,-12,24,16);
    c.fillStyle='#f2c9a0';c.beginPath();c.arc(0,-56,10,0,7);c.fill();
    c.strokeStyle='#f5c400';c.lineWidth=6;c.lineCap='round';
    c.beginPath();c.moveTo(-12,-42);c.lineTo(-30,-62-(dive?10:-12));c.moveTo(12,-42);c.lineTo(30,-62-(dive?10:-12));c.stroke();
    c.fillStyle='#fff';c.beginPath();c.arc(-31,-64-(dive?10:-12),5,0,7);c.arc(31,-64-(dive?10:-12),5,0,7);c.fill();
    c.restore();
  }
  function draw(now){
    if(dead)return;
    c.fillStyle='#3d9b4a';c.fillRect(0,0,W,H);
    c.fillStyle='#46a955';for(let i=0;i<9;i++)c.fillRect(0,i*50,W,25);
    c.fillStyle='#fff';c.fillRect(GX1-60,GY2,GX2-GX1+120,3);
    c.strokeStyle='#fff';c.lineWidth=2;c.strokeRect(GX1-90,GY2,GX2-GX1+180,150);
    c.fillStyle='#e8e8e8';c.fillRect(0,0,W,GY1-45);
    c.strokeStyle='#ffffff55';c.lineWidth=1;
    for(let x=GX1;x<=GX2;x+=14){c.beginPath();c.moveTo(x,GY1);c.lineTo(x,GY2);c.stroke();}
    for(let y=GY1;y<=GY2;y+=14){c.beginPath();c.moveTo(GX1,y);c.lineTo(GX2,y);c.stroke();}
    c.fillStyle='#fff';c.fillRect(GX1-4,GY1-4,GX2-GX1+8,5);c.fillRect(GX1-4,GY1-4,5,GY2-GY1+6);c.fillRect(GX2-1,GY1-4,5,GY2-GY1+6);
    c.fillStyle='#fff';c.beginPath();c.arc(SX,SY,3,0,7);c.fill();
    if(anim){
      const p=Math.min(1,(now-anim.t0)/anim.dur);
      ball.x=lerp(SX,anim.tx,p);ball.y=lerp(SY,anim.ty,p)-Math.sin(p*Math.PI)*18;ball.s=1-0.5*p;
      if(anim.type==='shoot')kx=lerp(kx,kT,0.14);
      if(p>=1&&mode!=='wait'){if(anim.type==='save')mode='wait';endKick();}
    }
    if(mode==='save'&&anim){kx=lerp(kx,kT,0.14);}
    else if(mode==='wait'||mode==='save'||mode==='shoot'){kx=lerp(kx,kT,0.14);}
    keeper(kx,Math.abs(kT-kx)>3||anim);
    c.fillStyle='#0004';c.beginPath();c.ellipse(ball.x,ball.y+10*ball.s,10*ball.s,4*ball.s,0,0,7);c.fill();
    c.fillStyle='#fff';c.strokeStyle='#222';c.lineWidth=1.5;c.beginPath();c.arc(ball.x,ball.y,11*ball.s,0,7);c.fill();c.stroke();
    c.fillStyle='#222';c.beginPath();c.arc(ball.x,ball.y,4*ball.s,0,7);c.fill();
    if(mode==='shoot'){c.fillStyle='#fff';c.font='bold 16px sans-serif';c.textAlign='center';c.fillText('👆 點擊球門射門',W/2,GY2+60);}
    raf=requestAnimationFrame(draw);
  }
  raf=requestAnimationFrame(draw);
  startShoot();
}});
})();
