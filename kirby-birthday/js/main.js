(function(){
  const stage=document.getElementById('stage'),ov=document.getElementById('overlay'),box=document.getElementById('box');
  const lvl=document.getElementById('lvl'),failEl=document.getElementById('fails'),mute=document.getElementById('mute');
  const REWARDS=[
    {f:'Random Party Room.jpg',t:'Level 1 clear!隊友集合完畢',s:'派對室'},
    {f:'Near Christmas.jpg',t:'聖誕樹:我只是來打醬油的',s:'聖誕樹'},
    {f:'Macau.jpg',t:'澳門街頭,一起走過的路',s:'澳門街頭'},
    {f:'Macau2.jpg',t:'那個手勢是想把澳門塔抓起來嗎',s:'澳門塔'},
    {f:'Hotpot with Sunny birthday.jpg',t:'火鍋太好吃,表情都管理不了',s:'火鍋聚會'}
  ];
  const rsrc=r=>'pics/'+encodeURIComponent(r.f);
  let unlocked=REWARDS.map(()=>false);
  let idx=0,fails=0,cleanups=[],ended=false;
  function teardown(){cleanups.forEach(f=>{try{f()}catch(e){}});cleanups=[];stage.innerHTML='';}
  function show(html){box.innerHTML=html;ov.style.display='flex';}
  function hide(){ov.style.display='none';}
  function btn(id,label,cls){return '<button class="btn '+(cls||'')+'" id="'+id+'">'+label+'</button>';}
  function updHud(){
    lvl.textContent=idx<Games.length?'第 '+(idx+1)+' / '+Games.length+' 關':'🎂';
    failEl.textContent=fails?'失敗 '+fails+' 次':'';
  }
  function gallery(label,cb){
    const n=unlocked.filter(Boolean).length,all=n===REWARDS.length;
    let cells='';
    REWARDS.forEach((r,i)=>{
      cells+=unlocked[i]
        ?'<div><img src="'+rsrc(r)+'" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;display:block"><div style="font-size:11px;margin-top:2px">'+r.s+'</div></div>'
        :'<div><div style="width:100%;aspect-ratio:1;border-radius:10px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:28px">🔒</div><div style="font-size:11px;margin-top:2px">未解鎖</div></div>';
    });
    show('<h2>'+(all?'🎊 你解鎖了全部 5 個獎勵!':'🎁 你解鎖了 '+n+' / '+REWARDS.length+' 個獎勵')+'</h2>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0">'+cells+'</div>'
      +(all?'<p>全部回憶集齊了!</p>':'<p>跳過的關卡沒有獎勵。</p>')+btn('gok',label));
    document.getElementById('gok').onclick=cb;
  }
  window.showGallery=()=>gallery('關閉',()=>hide());
  function next(){
    fails=0;idx++;
    if(idx>=Games.length){Sfx.cheer();gallery('▶ 前往生日驚喜',()=>{hide();intro();});}
    else intro();
  }
  const api={
    onCleanup(f){cleanups.push(f)},
    win(){
      if(ended)return;ended=true;Sfx.win();
      setTimeout(()=>{
        teardown();
        const r=REWARDS[idx];unlocked[idx]=true;
        const n=unlocked.filter(Boolean).length,last=idx===Games.length-1;
        show('<h2>🎉 過關!</h2><p>🎁 解鎖獎勵 '+n+' / '+REWARDS.length+'</p>'
          +'<img src="'+rsrc(r)+'" alt="" style="max-width:100%;max-height:42dvh;border-radius:12px;box-shadow:0 3px 10px #0004">'
          +'<p><b>'+r.t+'</b></p>'+btn('nx',last?'領取全部獎勵 ▶':'下一關 ▶'));
        document.getElementById('nx').onclick=next;
      },700);
    },
    lose(msg){
      if(ended)return;ended=true;Sfx.lose();fails++;updHud();
      setTimeout(()=>{
        teardown();
        let h='<h2>😢 失敗</h2><p>'+(msg||'再試一次吧!')+'</p>'+btn('rt','🔁 再試一次');
        if(fails>=3)h+=btn('sk','⏭ 跳過此關(沒有獎勵)','gray');
        show(h);
        document.getElementById('rt').onclick=()=>{hide();begin();};
        const sk=document.getElementById('sk');
        if(sk)sk.onclick=next;
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
    [['⏮',-1,'上一關'],['⏭',1,'下一關(跳過,不計獎勵)']].forEach(([ic,d,tt])=>{
      const b=document.createElement('button');b.textContent=ic;b.title=tt;b.style.background='#ffd23f';
      b.onclick=()=>{
        Sfx.init();ended=true;
        if(d>0){hide();next();}
        else{idx=Math.max(0,idx-1);fails=0;hide();intro();}
      };
      hud.insertBefore(b,mute);
    });
  }
  mute.onclick=()=>{Sfx.init();mute.textContent=Sfx.toggle()?'🔊':'🔇';};
  window.restartAll=()=>{idx=0;fails=0;unlocked=REWARDS.map(()=>false);intro();};
  setTimeout(()=>{REWARDS.forEach(r=>{const i=new Image();i.src=rsrc(r);});},3000);
  const h=parseInt(location.hash.slice(1));
  if(h>=1&&h<=6){idx=h-1;intro();}
  else if(h===7){unlocked=REWARDS.map(()=>true);idx=Games.length;gallery('▶ 前往生日驚喜',()=>{hide();intro();});}
  else{
    show('<h2>🌸 Kirby 生日大冒險</h2><p>通過 5 個小遊戲,每關都會解鎖一張回憶相片,最後有特別驚喜!\n建議開啟聲音。手機玩八球及點球時,橫向拿著會更好。</p>'+btn('st','開始冒險 ▶'));
    document.getElementById('st').onclick=()=>{Sfx.init();Sfx.click();hide();intro();};
  }
})();
