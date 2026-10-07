window.showFinal=function(root,api){
  const W=400,H=560;
  root.innerHTML='<canvas id="fc"></canvas><div class="info" id="fm" style="max-width:380px"></div><div class="row"><button class="btn alt" id="fr">🔁 重玩一次</button></div>';
  const cv=root.querySelector('#fc');cv.width=W;cv.height=H;cv.style.setProperty('--ar',W/H);
  const c=cv.getContext('2d');
  const cf=window.CFG||{};
  root.querySelector('#fm').textContent=[cf.MESSAGE,cf.FROM,cf.DATE].filter(Boolean).join('\n');
  root.querySelector('#fr').onclick=()=>window.restartAll();
  let dead=false,raf=0,parts=[],conf=[],t0=performance.now(),nextFw=0;
  api.onCleanup(()=>{dead=true;cancelAnimationFrame(raf)});
  Sfx.win();setTimeout(()=>Sfx.cheer(),300);
  for(let i=0;i<80;i++)conf.push({x:Math.random()*W,y:Math.random()*H,v:1+Math.random()*2,c:['#ff6fae','#4a90e2','#ffd23f','#fff','#034694'][i%5],r:Math.random()*6});
  function fw(){
    const x=50+Math.random()*300,y=60+Math.random()*180,col=['#ff6fae','#ffd23f','#4a90e2','#fff','#7ee081'][Math.floor(Math.random()*5)];
    for(let i=0;i<36;i++){const a=i/36*6.283,s=1.5+Math.random()*2.2;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c:col});}
    Sfx.pop(500+Math.random()*400);
  }
  function kirby(x,y,r,t){
    c.save();c.lineWidth=3;c.strokeStyle='#d9739d';
    c.fillStyle='#e0245e';
    [[-1],[1]].forEach(([s])=>{c.beginPath();c.ellipse(x+s*r*0.55,y+r*0.92,r*0.5,r*0.27,s*0.3,0,7);c.fill();});
    c.fillStyle='#ffb3d1';
    const wave=Math.sin(t*6)*0.5;
    c.beginPath();c.ellipse(x-r*1.0,y+r*0.1,r*0.34,r*0.24,-0.6,0,7);c.fill();c.stroke();
    c.beginPath();c.ellipse(x+r*1.0,y-r*0.1,r*0.34,r*0.24,-0.9+wave,0,7);c.fill();c.stroke();
    c.beginPath();c.arc(x,y,r,0,7);c.fill();c.stroke();
    c.fillStyle='#ff7fa8';
    c.beginPath();c.ellipse(x-r*0.58,y+r*0.25,r*0.2,r*0.12,0,0,7);c.fill();
    c.beginPath();c.ellipse(x+r*0.58,y+r*0.25,r*0.2,r*0.12,0,0,7);c.fill();
    [-1,1].forEach(s=>{
      c.fillStyle='#1a1a4a';c.beginPath();c.ellipse(x+s*r*0.24,y-r*0.12,r*0.11,r*0.23,0,0,7);c.fill();
      c.fillStyle='#3b6bff';c.beginPath();c.ellipse(x+s*r*0.24,y-r*0.02,r*0.08,r*0.1,0,0,7);c.fill();
      c.fillStyle='#fff';c.beginPath();c.arc(x+s*r*0.24,y-r*0.22,r*0.06,0,7);c.fill();
    });
    c.fillStyle='#c0224f';c.beginPath();c.ellipse(x,y+r*0.28,r*0.09,r*0.13,0,0,7);c.fill();
    c.strokeStyle='#034694';c.lineWidth=r*0.2;c.lineCap='round';
    c.beginPath();c.arc(x,y+r*0.35,r*0.88,0.35,Math.PI-0.35);c.stroke();
    c.strokeStyle='#fff';c.lineWidth=r*0.05;
    for(let i=0;i<4;i++){const a=0.7+i*0.55;c.beginPath();c.arc(x,y+r*0.35,r*0.88+r*0.05,a,a+0.08);c.stroke();}
    c.fillStyle='#034694';c.beginPath();c.moveTo(x-r*0.38,y-r*0.82);c.lineTo(x+r*0.38,y-r*0.82);c.lineTo(x+r*0.08,y-r*1.7);c.closePath();c.fill();
    c.fillStyle='#fff';c.fillRect(x-r*0.33,y-r*0.97,r*0.66,r*0.1);
    c.beginPath();c.arc(x+r*0.08,y-r*1.7,r*0.12,0,7);c.fill();
    c.restore();
  }
  function draw(now){
    if(dead)return;
    const t=(now-t0)/1000;
    const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2a1b5e');g.addColorStop(0.6,'#ff8fc0');g.addColorStop(1,'#ffd6e8');
    c.fillStyle=g;c.fillRect(0,0,W,H);
    if(now>nextFw){fw();nextFw=now+500+Math.random()*600;}
    parts=parts.filter(p=>p.l>0);
    parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.04;p.l-=0.012;c.globalAlpha=Math.max(0,p.l);c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,2.4,0,7);c.fill();});
    c.globalAlpha=1;
    conf.forEach(f=>{f.y+=f.v;f.x+=Math.sin(f.y/20);if(f.y>H){f.y=-10;f.x=Math.random()*W;}c.fillStyle=f.c;c.fillRect(f.x,f.y,f.r,f.r*1.6);});
    c.textAlign='center';c.lineJoin='round';
    c.font='bold 40px "Comic Sans MS",system-ui,sans-serif';c.lineWidth=7;c.strokeStyle='#3a2340';
    c.fillStyle='#fff';c.strokeText('Happy birthday,',W/2,70);c.fillText('Happy birthday,',W/2,70);
    c.font='bold 62px "Comic Sans MS",system-ui,sans-serif';c.fillStyle='#ffd23f';
    const s=1+Math.sin(t*4)*0.04;c.save();c.translate(W/2,135);c.scale(s,s);c.strokeText('Kirby!!',0,0);c.fillText('Kirby!!',0,0);c.restore();
    kirby(W/2,330+Math.abs(Math.sin(t*3))*-24,95,t);
    c.font='46px sans-serif';c.fillText('🎂',60,470+Math.sin(t*3)*6);c.fillText('🎁',W-60,470+Math.cos(t*3)*6);
    c.fillStyle='#034694';c.fillRect(0,500,W,60);c.fillStyle='#fff';c.fillRect(0,500,W,4);c.fillRect(0,556,W,4);
    c.font='bold 22px system-ui,sans-serif';c.lineWidth=0;c.fillStyle='#fff';c.fillText('💙 Up the Blues! ⚽ 💙',W/2,538);
    raf=requestAnimationFrame(draw);
  }
  raf=requestAnimationFrame(draw);
};
