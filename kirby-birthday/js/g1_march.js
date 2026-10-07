(function(){
Games.push({
title:'第一關:步操訓練 🫡',
rules:'第一部分:聽口令(普通話),按對應按鈕。8 個口令內錯誤不可達 3 次。\n第二部分:齊步走,左右腳輪流踏步。藍色音符 = 左腳,粉紅色 = 右腳,到圈圈時按對應按鈕,16 拍中至少準 10 拍。\n(電腦鍵盤:口令用 1-6;踏步用 ←/→ 或 A/D)',
start(root,api){
  const W=360,H=300;
  root.innerHTML='<div class="info" id="g1i"></div><canvas id="g1c"></canvas><div class="cmd" id="g1cmd"></div><div class="bar"><i id="g1b"></i></div><div class="btns" id="g1btns"></div>';
  const cv=root.querySelector('#g1c');cv.width=W;cv.height=H;cv.style.setProperty('--ar',W/H);
  const c=cv.getContext('2d'),info=root.querySelector('#g1i'),cmdEl=root.querySelector('#g1cmd'),bar=root.querySelector('#g1b'),btns=root.querySelector('#g1btns');
  const CM=[['立正','F'],['向右轉','R'],['向左轉','L'],['向後轉','B'],['齊步走','M'],['稍息','S']];
  let face='F',marching=false,atEase=false,phase='A',dead=false,raf=0,timers=[];
  let round=0,mist=0,cur=null,deadline=0,acceptA=false,lastCmd=-1,bounce=0;
  let B0=0,beatMs=560,hits=0,notes=[],bPhase=false,lastBeat=-1,flash='',flashT=0;
  api.onCleanup(()=>{dead=true;cancelAnimationFrame(raf);timers.forEach(clearTimeout);document.removeEventListener('keydown',onKey);speechSynthesis&&speechSynthesis.cancel&&speechSynthesis.cancel();});
  const later=(f,ms)=>{timers.push(setTimeout(()=>{if(!dead)f()},ms))};
  function mkBtns(){
    btns.innerHTML='';btns.style.gridTemplateColumns='repeat(3,1fr)';
    CM.forEach((m,i)=>{const b=document.createElement('button');b.className='btn';b.textContent=m[0];b.onclick=()=>pressA(i);btns.appendChild(b);});
  }
  function speak(t){try{const u=new SpeechSynthesisUtterance(t);u.lang='zh-CN';u.rate=0.9;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}
  function nextRound(){
    if(round>=8){startB();return;}
    cmdEl.textContent='預備…';acceptA=false;info.textContent='口令 '+(round+1)+' / 8  |  錯誤 '+mist+' / 3';
    later(()=>{
      let k;do{k=Math.floor(Math.random()*CM.length)}while(k===lastCmd);lastCmd=k;cur=k;
      cmdEl.textContent=CM[k][0]+'!';speak(CM[k][0]);Sfx.whistle&&Sfx.drum(true);
      const lim=2600-round*130;deadline=performance.now()+lim;acceptA=true;
      bar.style.transition='none';bar.style.width='100%';
      requestAnimationFrame(()=>{bar.style.transition='width '+lim+'ms linear';bar.style.width='0%';});
      later(()=>{if(acceptA){acceptA=false;wrong('超時!');}},lim);
    },900+Math.random()*500);
  }
  function apply(k){
    const t=CM[k][1];
    atEase=false;
    if(t==='F'||t==='R'||t==='L'||t==='B'){face=t;marching=false;}
    else if(t==='M'){marching=true;}
    else if(t==='S'){marching=false;face='F';atEase=true;}
    bounce=1;Sfx.stomp();
  }
  function pressA(i){
    if(phase==='B'){return;}
    if(!acceptA)return;
    acceptA=false;
    if(i===cur){apply(i);Sfx.good();cmdEl.textContent='✔ '+CM[i][0];round++;later(nextRound,700);}
    else wrong('按錯了!');
  }
  function wrong(m){
    mist++;Sfx.bad();cmdEl.textContent='✖ '+m;info.textContent='錯誤 '+mist+' / 3';
    if(mist>=3){later(()=>api.lose('步操出錯太多次,教官不滿意!'),500);return;}
    round++;later(nextRound,900);
  }
  function startB(){
    phase='B';marching=false;face='F';bar.style.width='0%';
    cmdEl.textContent='齊步走!左、右、左、右';info.textContent='準備…';
    btns.innerHTML='';btns.style.gridTemplateColumns='1fr 1fr';
    ['左腳','右腳'].forEach((lb,i)=>{const b=document.createElement('button');b.className='btn big '+(i?'':'alt');b.textContent=i?'右腳 ▶':'◀ 左腳';
      b.onpointerdown=e=>{e.preventDefault();pressB(i?'R':'L');};btns.appendChild(b);});
    later(()=>{
      B0=performance.now()+4*beatMs;
      notes=[];for(let k=0;k<16;k++)notes.push({t:B0+k*beatMs,hit:false,side:k%2?'R':'L'});
      hits=0;bPhase=true;lastBeat=-1;marching=true;
    },1000);
  }
  function pressB(side){
    if(!bPhase)return;const now=performance.now();
    let best=null,bd=1e9;
    notes.forEach(n=>{const d=Math.abs(now-n.t);if(!n.hit&&d<bd){bd=d;best=n;}});
    if(best&&bd<170&&best.side===side){best.hit=true;hits++;flash=bd<80?'完美!':'好!';Sfx.good();}
    else if(best&&bd<170){flash='腳錯了!';Sfx.bad();}
    else{flash='不準';Sfx.bad();}
    flashT=now;
  }
  function onKey(e){
    if(phase==='A'&&e.key>='1'&&e.key<='6')pressA(+e.key-1);
    if(phase==='B'){const k=e.key.toLowerCase();
      if(k==='arrowleft'||k==='a'||k==='z'){e.preventDefault();pressB('L');}
      else if(k==='arrowright'||k==='d'||k==='x'||k==='/'){e.preventDefault();pressB('R');}}
  }
  document.addEventListener('keydown',onKey);

  function limb(x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function fig(x,y,s,t,mar,fc){
    c.save();c.translate(x,y);c.scale(s,s);c.lineCap='round';c.lineWidth=7;
    const side=(fc==='R'||fc==='L'),dir=fc==='R'?1:-1,sn=Math.sin(t);
    c.strokeStyle='#1b2a49';
    if(!side){
      const l=mar?Math.max(0,sn)*14:0,r=mar?Math.max(0,-sn)*14:0;
      if(atEase){limb(-8,0,-22,38);limb(8,0,10,38);}else{limb(-8,0,-8,38-l);limb(8,0,8,38-r);}
    }else{
      const sw=mar?sn*14:0;limb(0,0,-sw,38);limb(0,0,sw,38);
    }
    c.fillStyle='#233a6b';
    const bw=side?16:30;c.fillRect(-bw/2,-46,bw,48);
    c.strokeStyle='#233a6b';c.lineWidth=6;
    if(!side){if(atEase){limb(-17,-42,-9,-12);limb(17,-42,9,-12);c.fillStyle='#f2c9a0';c.beginPath();c.arc(0,-10,5,0,7);c.fill();}else{const a=mar?sn*10:0;limb(-17,-42,-18,-8-a);limb(17,-42,18,-8+a);}}
    else{const a=mar?sn*14:0;limb(0,-42,a,-10);}
    c.fillStyle='#f2c9a0';c.beginPath();c.arc(0,-58,11,0,7);c.fill();
    c.fillStyle='#111c3a';c.fillRect(-12,-76,24,11);
    c.fillStyle='#d4af37';c.fillRect(-12,-67,24,3);
    if(fc==='F'){c.fillStyle='#111c3a';c.fillRect(-12,-66,24,3);c.fillStyle='#222';c.beginPath();c.arc(-4,-57,1.8,0,7);c.arc(4,-57,1.8,0,7);c.fill();}
    else if(side){c.fillStyle='#111c3a';c.fillRect(dir>0?4:-18,-68,14,4);c.fillStyle='#222';c.beginPath();c.arc(dir*5,-57,1.8,0,7);c.fill();}
    c.restore();
  }
  function draw(now){
    if(dead)return;
    c.fillStyle='#8fbf7a';c.fillRect(0,0,W,H);
    c.fillStyle='#7aab67';for(let i=0;i<8;i++)c.fillRect(0,i*40,W,20);
    c.fillStyle='#fff8';c.fillRect(0,110,W,2);
    let tt=0;
    if(phase==='B'&&bPhase){tt=(now-B0)/beatMs*Math.PI;}
    else if(marching){tt=now/beatMs*Math.PI;}
    if(phase==='B'&&bPhase){
      const b=Math.floor((now-(B0-4*beatMs))/beatMs);
      if(b!==lastBeat&&b>=0){lastBeat=b;Sfx.drum(b%4===0);
        if(b<4)cmdEl.textContent=['1','2','3','4'][b];else if(b<20)cmdEl.textContent=(b%2?'右':'左')+'!';}
    }
    bounce*=0.9;
    const by=bounce*-6;
    fig(90,130+by,1,tt,marching,face);fig(180,130+by,1,tt,marching,face);fig(270,130+by,1,tt,marching,face);
    fig(135,205+by,1,tt,marching,face);fig(225,205+by,1,tt,marching,face);
    if(phase==='B'&&bPhase){
      c.fillStyle='#0008';c.fillRect(0,236,W,64);
      [['L',254,'左'],['R',284,'右']].forEach(([sd,y,lb])=>{
        c.strokeStyle='#ffd23f';c.lineWidth=3;c.beginPath();c.arc(50,y,13,0,7);c.stroke();
        c.fillStyle='#fff';c.font='bold 12px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(lb,18,y);
        notes.forEach(n=>{
          if(n.side!==sd)return;const x=50+(n.t-now)*0.2;if(x<20||x>W)return;
          c.fillStyle=n.hit?'#4caf50':(sd==='L'?'#4a90e2':'#ff6fae');c.beginPath();c.arc(x,y,10,0,7);c.fill();
        });
      });
      if(now-flashT<500){c.fillStyle='#fff';c.font='bold 22px sans-serif';c.fillText(flash,W/2-30,60);}
      info.textContent='命中 '+hits+' / 16 (需要 10)';
      if(now>B0+16*beatMs+500){bPhase=false;if(hits>=10){cmdEl.textContent='🎖 步操完美!';api.win();}else{api.lose('節奏不夠準('+hits+'/16),再練習一下!');}}
    }
    raf=requestAnimationFrame(draw);
  }
  mkBtns();raf=requestAnimationFrame(draw);later(nextRound,600);
}});
})();
