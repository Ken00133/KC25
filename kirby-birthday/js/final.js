window.showFinal=function(root,api){
  const W=400,H=560;
  root.innerHTML='<canvas id="fc"></canvas><div class="info" id="fm" style="max-width:380px"></div><div class="info" id="ftap" style="display:none;background:#ffd23f;border-radius:10px;padding:6px 12px">👆 瀏覽器要求先點一下畫面,點任何位置就會開始播放音樂</div><div class="row"><button class="btn" id="fs">🎵 重播生日歌</button><button class="btn alt" id="fg">🖼 獎勵相片</button><button class="btn gray" id="fr">🔁 重玩一次</button></div>';
  const cv=root.querySelector('#fc');cv.width=W;cv.height=H;cv.style.setProperty('--ar',W/H);
  const c=cv.getContext('2d');
  const cf=window.CFG||{};
  root.querySelector('#fm').textContent=[cf.MESSAGE,cf.FROM,cf.DATE].filter(Boolean).join('\n');
  root.querySelector('#fr').onclick=()=>window.restartAll();
  root.querySelector('#fs').onclick=()=>Sfx.birthday();
  root.querySelector('#fg').onclick=()=>window.showGallery&&window.showGallery();
  const tap=root.querySelector('#ftap');
  const tapT=setInterval(()=>{tap.style.display=(Sfx.blocked&&Sfx.blocked())?'block':'none';},400);
  let dead=false,raf=0,parts=[],conf=[],t0=performance.now(),nextFw=0;
  api.onCleanup(()=>{dead=true;cancelAnimationFrame(raf);clearInterval(tapT);Sfx.stopSong&&Sfx.stopSong();});
  Sfx.win();setTimeout(()=>{Sfx.cheer();Sfx.birthday&&Sfx.birthday();},900);
  for(let i=0;i<80;i++)conf.push({x:Math.random()*W,y:Math.random()*H,v:1+Math.random()*2,c:['#ff6fae','#4a90e2','#ffd23f','#fff','#7ee081'][i%5],r:Math.random()*6});
  function fw(){
    const x=50+Math.random()*300,y=60+Math.random()*180,col=['#ff6fae','#ffd23f','#4a90e2','#fff','#7ee081'][Math.floor(Math.random()*5)];
    for(let i=0;i<36;i++){const a=i/36*6.283,s=1.5+Math.random()*2.2;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c:col});}
    Sfx.pop(500+Math.random()*400);
  }
  function partyHat(x,y,r){
    c.save();
    c.translate(x+r*0.1,y-r*0.86);c.rotate(0.16);
    const bw=r*0.46,hh=r*0.95;
    c.beginPath();c.moveTo(-bw,0);c.lineTo(bw,0);c.lineTo(0,-hh);c.closePath();
    c.save();c.clip();
    c.fillStyle='#ff5fa2';c.fillRect(-r,-hh-4,2*r,hh+8);
    const cols=['#ffd23f','#4a90e2','#7ee081','#ff5fa2'];
    c.save();c.rotate(-0.75);
    for(let i=-8;i<8;i++){c.fillStyle=cols[((i%4)+4)%4];c.fillRect(i*r*0.2,-r*2,r*0.2,r*4);}
    c.restore();
    c.fillStyle='#ffffffcc';
    [[-0.18,-0.2],[0.15,-0.32],[-0.05,-0.55],[0.08,-0.72],[-0.22,-0.4]].forEach(([dx,dy])=>{c.beginPath();c.arc(dx*r,dy*r,r*0.04,0,7);c.fill();});
    c.restore();
    c.lineWidth=2.5;c.strokeStyle='#5a3a7a';c.lineJoin='round';
    c.beginPath();c.moveTo(-bw,0);c.lineTo(bw,0);c.lineTo(0,-hh);c.closePath();c.stroke();
    c.fillStyle='#ffd23f';c.beginPath();c.ellipse(0,0,bw*1.02,r*0.07,0,0,7);c.fill();c.stroke();
    c.fillStyle='#fff';c.beginPath();c.arc(0,-hh,r*0.13,0,7);c.fill();c.stroke();
    c.restore();
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
    partyHat(x,y,r);
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
    kirby(W/2,340+Math.abs(Math.sin(t*3))*-24,90,t);
    c.font='46px sans-serif';c.fillText('🎂',60,470+Math.sin(t*3)*6);c.fillText('🎁',W-60,470+Math.cos(t*3)*6);
    c.fillStyle='#034694';c.fillRect(0,500,W,60);c.fillStyle='#fff';c.fillRect(0,500,W,4);c.fillRect(0,556,W,4);
    c.font='bold 22px system-ui,sans-serif';c.lineWidth=0;c.fillStyle='#fff';c.fillText('💙 Up the Blues! ⚽ 💙',W/2,538);
    raf=requestAnimationFrame(draw);
  }
  raf=requestAnimationFrame(draw);
};
