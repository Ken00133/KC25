(function(){
  const stage=document.getElementById('stage'),ov=document.getElementById('overlay'),box=document.getElementById('box');
  const lvl=document.getElementById('lvl'),failEl=document.getElementById('fails'),mute=document.getElementById('mute');
  const REWARDS=[
    {f:'Random Party Room.jpg',t:'Level 1 clear!隊友集合完畢',s:'派對室'},
    {f:'Near Christmas.jpg',t:'聖誕樹:我只是來打醬油的',s:'聖誕樹'},
    {f:'Macau2.jpg',t:'澳門街頭,一起走過的路',s:'澳門街頭'},
    {f:'Macau.jpg',t:'那個手勢是想把澳門塔抓起來嗎',s:'澳門塔'},
    {f:'Hotpot with Sunny birthday.jpg',t:'火鍋太好吃,表情都管理不了',s:'火鍋聚會'}
  ];
  const rsrc=r=>'pics/'+encodeURIComponent(r.f);
  const BADGE='position:absolute;right:6px;bottom:6px;background:rgba(58,35,64,.82);color:#fff;font-size:12px;font-weight:700;padding:3px 9px;border-radius:12px;pointer-events:none';
  let unlocked=REWARDS.map(()=>false);
  let idx=0,fails=0,cleanups=[],ended=false,phase='intro';
  const lb=document.createElement('div');
  lb.style.cssText='position:fixed;inset:0;background:rgba(20,10,30,.94);display:none;z-index:30;flex-direction:column;align-items:center;justify-content:center;padding:12px;cursor:zoom-out';
  lb.innerHTML='<img id="lbimg" alt="" style="max-width:100%;max-height:82dvh;object-fit:contain;border-radius:10px;box-shadow:0 4px 24px #000a"><div id="lbcap" style="color:#fff;font-weight:700;margin-top:12px;text-align:center;font-size:17px"></div><div style="color:#ffffffaa;font-size:12px;margin-top:6px">點任何位置關閉</div>';
  document.body.appendChild(lb);
  function openPhoto(i){
    const r=REWARDS[i];
    lb.querySelector('#lbimg').src=rsrc(r);
    lb.querySelector('#lbcap').textContent=r.t;
    lb.style.display='flex';Sfx.click();
  }
  function closePhoto(){lb.style.display='none';}
  lb.onclick=closePhoto;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closePhoto();});
  window.openPhoto=openPhoto;
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
    phase='gallery';
    let cells='';
    REWARDS.forEach((r,i)=>{
      cells+=unlocked[i]
        ?'<div class="gthumb" data-i="'+i+'" style="cursor:zoom-in"><div style="position:relative"><img src="'+rsrc(r)+'" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;display:block"><span style="position:absolute;right:4px;bottom:4px;background:rgba(58,35,64,.82);color:#fff;font-size:11px;padding:1px 6px;border-radius:10px;pointer-events:none">🔍 放大</span></div><div style="font-size:11px;margin-top:2px">'+r.s+'</div></div>'
        :'<div><div style="width:100%;aspect-ratio:1;border-radius:10px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:28px">🔒</div><div style="font-size:11px;margin-top:2px">未解鎖</div></div>';
    });
    show('<h2>'+(all?'🎊 你解鎖了全部 5 個獎勵!':'🎁 你解鎖了 '+n+' / '+REWARDS.length+' 個獎勵')+'</h2>'
      +'<p style="background:#fff3c4;border-radius:10px;padding:6px 10px;font-size:14px;font-weight:700">👆 點擊相片可以放大查看</p>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0">'+cells+'</div>'
      +(all?'<p>全部回憶集齊了!</p>':'<p>跳過的關卡沒有獎勵。</p>')+btn('gok',label));
    box.querySelectorAll('.gthumb').forEach(el=>{el.onclick=()=>openPhoto(+el.dataset.i);});
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
        teardown();phase='won';
        const r=REWARDS[idx],ri=idx;unlocked[idx]=true;
        const n=unlocked.filter(Boolean).length,last=idx===Games.length-1;
        show('<h2>🎉 過關!</h2><p>🎁 解鎖獎勵 '+n+' / '+REWARDS.length+'</p>'
          +'<div id="rwwrap" style="position:relative;display:inline-block;cursor:zoom-in"><img id="rwimg" src="'+rsrc(r)+'" alt="" style="max-width:100%;max-height:42dvh;border-radius:12px;box-shadow:0 3px 10px #0004;display:block"><span style="'+BADGE+'">🔍 點擊放大</span></div>'
          +'<p><b>'+r.t+'</b></p><p style="background:#fff3c4;border-radius:10px;padding:5px 10px;font-size:13px;font-weight:700">👆 點擊相片可以放大查看</p>'+btn('nx',last?'領取全部獎勵 ▶':'下一關 ▶'));
        document.getElementById('rwwrap').onclick=()=>openPhoto(ri);
        document.getElementById('nx').onclick=next;
      },700);
    },
    lose(msg){
      if(ended)return;ended=true;Sfx.lose();fails++;updHud();
      setTimeout(()=>{
        teardown();phase='lost';
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
    ended=false;phase='play';teardown();updHud();
    Games[idx].start(stage,api);
  }
  function intro(){
    teardown();updHud();phase='intro';
    if(idx>=Games.length){hide();lvl.textContent='🎂';failEl.textContent='';phase='final';showFinal(stage,api);return;}
    const g=Games[idx];
    show('<h2>'+g.title+'</h2><p>'+g.rules+'</p>'+btn('go','開始 ▶'));
    document.getElementById('go').onclick=()=>{Sfx.init();Sfx.click();hide();begin();};
  }
  if(window.CFG&&CFG.DEBUG_SKIP){
    const hud=document.getElementById('hud');
    const mk=(ic,tt,fn,bg)=>{
      const b=document.createElement('button');b.textContent=ic;b.title=tt;b.style.background=bg||'#ffd23f';
      b.onclick=()=>{Sfx.init();fn();};hud.insertBefore(b,mute);
    };
    mk('⏮','上一關',()=>{ended=true;idx=Math.max(0,idx-1);fails=0;hide();intro();});
    mk('✅','一鍵過關(算過關,會解鎖獎勵)',()=>{
      if(idx>=Games.length||phase==='final'||phase==='gallery')return;
      if(phase==='won'){hide();next();return;}
      if(phase!=='play'){hide();begin();}
      api.win();
    },'#7ee081');
    mk('⏭','跳過此關(不解鎖獎勵)',()=>{ended=true;hide();next();});
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
