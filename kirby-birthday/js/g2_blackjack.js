(function(){
Games.push({
title:'第二關:二十一點 🃏',
rules:'簡單規則:要牌(Hit)或停牌(Stand),莊家 17 點或以上停牌。\n先贏 3 局過關;先輸 3 局則失敗。平手不計。',
start(root,api){
  root.innerHTML='<div class="info" id="g2i"></div><div class="table"><div>莊家 <b id="dv"></b></div><div class="cards" id="dc"></div><div>你 <b id="pv"></b></div><div class="cards" id="pc"></div><div class="info" id="g2m"></div></div><div class="row" id="g2b"></div>';
  const $=s=>root.querySelector(s);
  let dead=false,timers=[],deck,P,D,wins=0,losses=0,hidden=true,over=true;
  api.onCleanup(()=>{dead=true;timers.forEach(clearTimeout)});
  const later=(f,ms)=>timers.push(setTimeout(()=>{if(!dead)f()},ms));
  function newDeck(){const s=['♠','♥','♦','♣'],r=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],d=[];
    s.forEach(x=>r.forEach(y=>d.push({r:y,s:x})));for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
  function val(h){let t=0,a=0;h.forEach(c=>{if(c.r==='A'){a++;t+=11}else if('JQK'.includes(c.r))t+=10;else t+=+c.r;});while(t>21&&a>0){t-=10;a--;}return t;}
  function cardEl(c,back){
    const d=document.createElement('div');
    const red=(c.s==='♥'||c.s==='♦');
    d.className='card'+(back?' back':'')+(red?' red':'');
    d.style.cssText='width:58px;height:82px;background:'+(back?'repeating-linear-gradient(45deg,#4a90e2,#4a90e2 6px,#2a62a8 6px,#2a62a8 12px)':'#fff')+';color:'+(red?'#d11':'#111')+';border:2px solid #333;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;font-weight:700;box-shadow:0 2px 4px #0004;';
    if(!back){
      const r=document.createElement('span');r.textContent=c.r;r.style.cssText='font-size:24px;font-family:Arial,sans-serif;';
      const su=document.createElement('span');su.textContent=c.s+'\uFE0E';su.style.cssText='font-size:26px;font-family:"Segoe UI Symbol","Apple Symbols","DejaVu Sans",Arial,sans-serif;';
      d.append(r,su);
    }
    return d;
  }
  function render(){
    const dc=$('#dc'),pc=$('#pc');dc.innerHTML='';pc.innerHTML='';
    D.forEach((c,i)=>dc.appendChild(cardEl(c,hidden&&i===1)));
    P.forEach(c=>pc.appendChild(cardEl(c)));
    $('#dv').textContent=hidden?'(?)':val(D);$('#pv').textContent=val(P);
    $('#g2i').textContent='勝 '+wins+' / 3   負 '+losses+' / 3';
  }
  function buttons(mode){
    const b=$('#g2b');b.innerHTML='';
    if(mode==='play'){
      const h=document.createElement('button');h.className='btn';h.textContent='要牌 Hit';h.onclick=hit;
      const s=document.createElement('button');s.className='btn alt';s.textContent='停牌 Stand';s.onclick=stand;b.append(h,s);
    }else if(mode==='next'){
      const n=document.createElement('button');n.className='btn';n.textContent='下一局 ▶';n.onclick=deal;b.appendChild(n);
    }
  }
  function deal(){
    deck=newDeck();P=[deck.pop(),deck.pop()];D=[deck.pop(),deck.pop()];hidden=true;over=false;
    $('#g2m').textContent='你的回合';Sfx.click();render();
    if(val(P)===21){stand();return;}
    buttons('play');
  }
  function hit(){if(over)return;P.push(deck.pop());Sfx.click();render();
    if(val(P)>21){end('爆牌了!你輸了','l');}else if(val(P)===21)stand();}
  function stand(){
    if(over)return;buttons('');hidden=false;render();
    (function step(){
      if(dead)return;
      if(val(D)<17){D.push(deck.pop());Sfx.click();render();later(step,700);}
      else{
        const p=val(P),d=val(D);
        if(d>21)end('莊家爆牌!你贏了','w');
        else if(p>d)end('你 '+p+' 對 '+d+',你贏了!','w');
        else if(p<d)end('你 '+p+' 對 '+d+',你輸了','l');
        else end('平手,不計','t');
      }
    })();
  }
  function end(m,r){
    over=true;hidden=false;render();$('#g2m').textContent=m;
    if(r==='w'){wins++;Sfx.good();}else if(r==='l'){losses++;Sfx.bad();}
    $('#g2i').textContent='勝 '+wins+' / 3   負 '+losses+' / 3';
    if(wins>=3){later(()=>api.win(),900);return;}
    if(losses>=3){later(()=>api.lose('莊家今天運氣太好了!'),900);return;}
    buttons('next');
  }
  deal();
}});
})();
