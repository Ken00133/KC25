window.Sfx=(function(){
  let ctx=null,on=true,timer=null,st=0,lastHit=0,songOn=false,songTimer=null,pending=false;
  function init(){
    if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(A)ctx=new A();}
    if(ctx&&ctx.state==='suspended')ctx.resume();
    if(on&&!timer)startBgm();
  }
  function tone(f,d,type,vol,delay){
    if(!ctx||!on)return;
    d=d||0.12;type=type||'sine';vol=vol==null?0.15:vol;delay=delay||0;
    const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+d+0.03);
  }
  function noise(d,vol,hp,delay){
    if(!ctx||!on)return;
    const n=Math.floor(ctx.sampleRate*d),buf=ctx.createBuffer(1,n,ctx.sampleRate),a=buf.getChannelData(0);
    for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
    const s=ctx.createBufferSource();s.buffer=buf;
    const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=hp||800;
    const g=ctx.createGain();g.gain.value=vol||0.2;
    s.connect(f);f.connect(g);g.connect(ctx.destination);s.start(ctx.currentTime+(delay||0));
  }
  const mel=[523,587,659,784,880,784,659,587],bass=[131,175,196,175];
  function startBgm(){
    timer=setInterval(()=>{
      if(!on||!ctx||songOn)return;
      const k=st%8;
      tone(mel[(k*3+(st>>3))%8]*(k%4===3?1:1),0.18,'triangle',0.035);
      if(k%2===0)tone(bass[(st>>1)%4],0.3,'sine',0.05);
      st++;
    },260);
  }
  
  const NT={G4:392,A4:440,B4:494,C5:523,D5:587,E5:659,F5:698,G5:784};
  const MEL=[
    ['G4',.75],['G4',.25],['A4',1],['G4',1],['C5',1],['B4',2],
    ['G4',.75],['G4',.25],['A4',1],['G4',1],['D5',1],['C5',2],
    ['G4',.75],['G4',.25],['G5',1],['E5',1],['C5',1],['B4',1],['A4',1],
    ['F5',.75],['F5',.25],['E5',1],['C5',1],['D5',1],['C5',2]
  ];
  const CH={C:[131,330,392],G:[98,247,294],F:[87,220,262]};
  const BARS=['C','G','C','C','C','F','F','C'];
  const PASS=24,SPB_BPM=132;
  function playPass(t0){
    const spb=60/SPB_BPM;let b=0;
    MEL.forEach(([n,d])=>{
      tone(NT[n],d*spb*0.9,'square',0.07,t0+b*spb-ctx.currentTime);
      tone(NT[n]*2,d*spb*0.5,'square',0.015,t0+b*spb-ctx.currentTime);
      b+=d;
    });
    BARS.forEach((c,i)=>{
      const bt=t0+i*3*spb-ctx.currentTime,ch=CH[c];
      tone(ch[0],spb*0.9,'triangle',0.14,bt);
      tone(ch[1],spb*0.4,'square',0.03,bt+spb);tone(ch[2],spb*0.4,'square',0.03,bt+spb);
      tone(ch[1],spb*0.4,'square',0.03,bt+2*spb);tone(ch[2],spb*0.4,'square',0.03,bt+2*spb);
      noise(0.04,0.06,5000,i*3*spb);noise(0.03,0.04,6000,(i*3+1)*spb);noise(0.03,0.04,6000,(i*3+2)*spb);
    });
    [523,659,784,1047].forEach((f,i)=>tone(f,0.12,'square',0.05,(PASS+0.2)*spb+i*0.07));
  }
  function birthday(){
    init();if(!ctx)return;
    if(ctx.state!=='running'){
      pending=true;
      try{ctx.resume().then(()=>{if(pending&&ctx.state==='running'){pending=false;birthday();}});}catch(e){}
      return;
    }
    pending=false;stopSong();songOn=true;
    const spb=60/SPB_BPM;
    (function loop(){
      if(!songOn)return;
      if(on)playPass(ctx.currentTime+0.15);
      songTimer=setTimeout(loop,(PASS+3)*spb*1000);
    })();
  }
  function stopSong(){songOn=false;pending=false;if(songTimer){clearTimeout(songTimer);songTimer=null;}}
  function unlock(){
    init();
    if(pending&&ctx&&ctx.state==='running'){pending=false;birthday();}
    else if(pending&&ctx){ctx.resume&&ctx.resume().then(()=>{if(pending&&ctx.state==='running'){pending=false;birthday();}});}
  }
  ['touchend','click','keydown'].forEach(ev=>window.addEventListener(ev,unlock,{passive:true}));
  return{
    init,birthday,stopSong,blocked(){return pending},
    toggle(){on=!on;if(on&&!timer&&ctx)startBgm();return on;},
    click(){tone(660,0.06,'square',0.08)},
    good(){tone(660,0.1,'triangle',0.15);tone(880,0.15,'triangle',0.15,0.09)},
    bad(){tone(180,0.25,'sawtooth',0.12)},
    win(){[523,659,784,1047].forEach((f,i)=>tone(f,0.25,'triangle',0.18,i*0.12))},
    lose(){[392,330,262].forEach((f,i)=>tone(f,0.3,'sawtooth',0.12,i*0.18))},
    kick(){noise(0.08,0.35,200);tone(120,0.1,'sine',0.25)},
    hit(v){const n=performance.now();if(n-lastHit<45)return;lastHit=n;tone(900+v*600,0.05,'square',0.04+v*0.08)},
    pot(){tone(220,0.15,'sine',0.25);tone(160,0.2,'sine',0.2,0.08)},
    drum(acc){tone(acc?140:100,0.12,'sine',0.35);noise(0.04,acc?0.2:0.1,2000)},
    stomp(){noise(0.07,0.3,300);tone(90,0.1,'sine',0.25)},
    whistle(){tone(2400,0.25,'sine',0.1);tone(2600,0.35,'sine',0.1,0.2)},
    cheer(){noise(0.8,0.15,1500)},
    pop(f){tone(f||300,0.2,'sine',0.2);noise(0.15,0.15,1200)}
  };
})();
