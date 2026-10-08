(function(){
  const stage=document.getElementById('stage'),ov=document.getElementById('overlay'),box=document.getElementById('box');
  const lvl=document.getElementById('lvl'),failEl=document.getElementById('fails'),mute=document.getElementById('mute');
  let idx=0,fails=0,cleanups=[],ended=false;
  function teardown(){cleanups.forEach(f=>{try{f()}catch(e){}});cleanups=[];stage.innerHTML='';}
  function show(html){box.innerHTML=html;ov.style.display='flex';}
  function hide(){ov.style.display='none';}
  function btn(id,label,cls){return '<button class="btn '+(cls||'')+'" id="'+id+'">'+label+'</button>';}
  function updHud(){
    lvl.textContent=idx<Games.length?'第 '+(idx+1)+' / '+Games.length+' 關':'🎂';
    failEl.textContent=fails?'失敗 '+fails+' 次':'';
  }
  const api={
    onCleanup(f){cleanups.push(f)},
    win(){
      if(ended)return;ended=true;Sfx.win();
      setTimeout(()=>{
        teardown();
        show('<h2>🎉 過關!</h2><p>做得好!</p>'+btn('nx','下一關 ▶'));
        document.getElementById('nx').onclick=()=>{idx++;fails=0;intro();};
      },700);
    },
    lose(msg){
      if(ended)return;ended=true;Sfx.lose();fails++;updHud();
      setTimeout(()=>{
        teardown();
        let h='<h2>😢 失敗</h2><p>'+(msg||'再試一次吧!')+'</p>'+btn('rt','🔁 再試一次');
        if(fails>=3)h+=btn('sk','⏭ 跳過此關','gray');
        show(h);
        document.getElementById('rt').onclick=()=>{hide();begin();};
        const sk=document.getElementById('sk');
        if(sk)sk.onclick=()=>{idx++;fails=0;intro();};
      },900);
    }
  };
  function begin(){
    ended=false;teardown();updHud();
    Games[idx].start(stage,api);
  }
  function intro(){
    teardown();updHud();
    if(idx>=Games.length){hide();lvl.textContent='🎂';failEl.textContent='';showFinal(stage,api);return;}
    const g=Games[idx];
    show('<h2>'+g.title+'</h2><p>'+g.rules+'</p>'+btn('go','開始 ▶'));
    document.getElementById('go').onclick=()=>{Sfx.init();Sfx.click();hide();begin();};
  }
  if(window.CFG&&CFG.DEBUG_SKIP){
    const hud=document.getElementById('hud');
    [['⏮',-1,'上一關'],['⏭',1,'下一關']].forEach(([ic,d,tt])=>{
      const b=document.createElement('button');b.textContent=ic;b.title=tt;b.style.background='#ffd23f';
      b.onclick=()=>{Sfx.init();ended=true;idx=Math.max(0,Math.min(Games.length,idx+d));fails=0;hide();intro();};
      hud.insertBefore(b,mute);
    });
  }
  mute.onclick=()=>{Sfx.init();mute.textContent=Sfx.toggle()?'🔊':'🔇';};
  window.restartAll=()=>{idx=0;fails=0;intro();};
  const h=parseInt(location.hash.slice(1));
  if(h>=1&&h<=6){idx=h-1;intro();}
  else{
    show('<h2>🌸 Kirby 生日大冒險</h2><p>通過 5 個小遊戲,就能看到特別驚喜!\n建議開啟聲音。手機玩八球及點球時,橫向拿著會更好。</p>'+btn('st','開始冒險 ▶'));
    document.getElementById('st').onclick=()=>{Sfx.init();Sfx.click();hide();intro();};
  }
})();
