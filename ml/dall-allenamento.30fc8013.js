var EB={on:'',bb:false,conf:false,duel:'',duelPr:false,duelFine:false,timer:0,cbBB:null};
function ebEn(){ return (typeof GB_LANG!=='undefined'&&GB_LANG==='en'); }
function ebTg(){ try{ return window.Telegram&&window.Telegram.WebApp; }catch(e){ return null; } }
function ebCtx(){
  var c=(typeof CUR!=='undefined')?CUR:'';
  try{
    if(c==='arc'&&window.RTD&&RTD.practice&&!RTD.tour&&!RTD.spec)return 'rtd';
    if(c==='turf'&&window.TWR&&TWR.practice&&!TWR.tour&&!TWR.spec)return 'twr';
    if(c==='glad'&&window.GLD&&GLD.practice&&!GLD.tour&&!GLD.spec)return 'gld';
    if(c==='tank'&&window.TKD&&TKD.practice&&!TKD.tour&&!TKD.spec)return 'tkd';
    if(c==='duel'&&EB.duel&&EB.duelPr){
      var ov=document.getElementById('pvp-overlay');
      if(ov&&ov.classList.contains('show'))return EB.duel;
    }
  }catch(e){}
  return '';
}
function ebCss(){
  if(document.getElementById('eb-css'))return;
  var st=document.createElement('style'); st.id='eb-css';
  st.textContent=''
   +'#eb-esci{position:fixed;z-index:2147482000;left:calc(10px + max(env(safe-area-inset-left,0px),var(--tg-left,0px)));'
   +'top:calc(14px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));display:none;align-items:center;gap:6px;'
   +'height:36px;padding:0 11px 0 9px;border-radius:18px;border:1px solid rgba(255,255,255,.3);'
   +'background:rgba(10,14,26,.94);color:#f1f4fa;font:800 11px/1 Orbitron,"Russo One",sans-serif;letter-spacing:.8px;'
   +'box-shadow:0 4px 14px rgba(0,0,0,.45);-webkit-tap-highlight-color:transparent;touch-action:manipulation;cursor:pointer;}'
   +'#eb-esci b{font-size:13px;line-height:1;color:#ff8f8f;}'
   +'#eb-esci.eb-dx{left:auto;right:calc(10px + max(env(safe-area-inset-right,0px),var(--tg-right,0px)));top:calc(52px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}'
   +'#eb-esci:active{transform:scale(.96);}'
   +'body.eb-on .screen.active>.game-hdr>.back-btn{visibility:hidden;}'
   +'body.eb-on .screen.active>.game-hdr>.game-title{padding-left:36px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
   +'#eb-conf{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;'
   +'background:rgba(0,0,0,.62);padding:16px;}'
   +'#eb-conf .eb-box{width:100%;max-width:330px;border-radius:18px;border:1px solid rgba(255,255,255,.16);'
   +'background:linear-gradient(165deg,#161c2e,#0a0e1a);padding:18px 16px 14px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.7);}'
   +'#eb-conf .eb-t{font:900 16px/1.25 Orbitron,"Russo One",sans-serif;color:#fff;letter-spacing:.5px;}'
   +'#eb-conf .eb-s{margin-top:6px;font-size:13px;line-height:1.35;color:#b9c2d6;}'
   +'#eb-conf .eb-b{display:flex;gap:10px;margin-top:16px;}'
   +'#eb-conf button{flex:1;height:46px;border-radius:12px;border:0;font:800 14px/1 Orbitron,"Russo One",sans-serif;letter-spacing:1px;}'
   +'#eb-si{background:linear-gradient(135deg,#ff5b5b,#c81e3a);color:#fff;}'
   +'#eb-no{background:rgba(255,255,255,.1);color:#e8ecf5;border:1px solid rgba(255,255,255,.2)!important;}';
  document.head.appendChild(st);
}
function ebDom(){
  ebCss();
  var b=document.getElementById('eb-esci');
  if(!b){
    b=document.createElement('button'); b.id='eb-esci'; b.type='button';
    b.setAttribute('aria-label',ebEn()?'Leave the practice':'Esci dall’allenamento');
    b.innerHTML='<b>✕</b><span>'+(ebEn()?'EXIT':'ESCI')+'</span>';
    b.addEventListener('click',function(ev){ ev.preventDefault(); ev.stopPropagation(); ebChiedi(); });
    document.body.appendChild(b);
  }
  return b;
}
function ebChiedi(){
  if(!ebCtx()){ ebTick(); return; }
  if(EB.conf){ ebResta(); return; }
  ebCss();
  var c=document.getElementById('eb-conf');
  if(!c){ c=document.createElement('div'); c.id='eb-conf'; document.body.appendChild(c); }
  var en=ebEn();
  c.innerHTML='<div class="eb-box" role="dialog" aria-modal="true">'
    +'<div class="eb-t">'+(en?'Leave the practice?':'Esci dall’allenamento?')+'</div>'
    +'<div class="eb-s">'+(en?'Nothing is lost: it is a free game against bots.':'Nessuna perdita: è una partita gratis contro i bot.')+'</div>'
    +'<div class="eb-b"><button type="button" id="eb-no">'+(en?'STAY':'RESTA')+'</button>'
    +'<button type="button" id="eb-si">'+(en?'EXIT':'ESCI')+'</button></div></div>';
  c.onclick=function(ev){ if(ev.target===c)ebResta(); };
  document.getElementById('eb-no').onclick=function(ev){ ev.stopPropagation(); ebResta(); };
  document.getElementById('eb-si').onclick=function(ev){ ev.stopPropagation(); ebConferma(); };
  c.style.display='flex'; EB.conf=true;
  try{ var t=ebTg(); t&&t.HapticFeedback&&t.HapticFeedback.impactOccurred('light'); }catch(e){}
}
function ebResta(){
  EB.conf=false;
  var c=document.getElementById('eb-conf'); if(c)c.style.display='none';
}
function ebConferma(){ ebResta(); ebEsci(); }
function ebLascia(O,sendFn){
  try{ if(typeof sendFn==='function')sendFn({t:'leave'}); }catch(e){}
  try{ if(O&&O.ws){ O.closedByUs=true; O.ws.onclose=null; O.ws.onerror=null; O.ws.onmessage=null; O.ws.close(); } }catch(e){}
  try{ if(O){ O.ws=null; O.wsOk=false; } }catch(e){}
}
function ebDopo(){
  if(typeof TRN!=='undefined'&&TRN.trainFrom&&typeof trnTrainBack==='function'){ trnTrainBack(); return; }
  go('duel');
}
function ebEsci(){
  var k=ebCtx(); if(!k)return;
  try{ console.log('[ESCI_BOT] esce da '+k); }catch(e){}
  if(k==='rtd'){
    rtdBack();
  }else if(k==='tkd'){
    var wt=TKD.ws; tkBack();
    if(wt&&TKD.ws===wt)ebLascia(TKD,null);
  }else if(k==='gld'){
    ebLascia(GLD,gldSend);
    try{ if(typeof gldStopRaf==='function')gldStopRaf(); }catch(e){}
    GLD.ui=''; GLD.practice=false; GLD.pendingTicket=null;
    try{ gldOvClose(); }catch(e){}
    try{ wsNetBanner('glad',0); }catch(e){}
    ebDopo();
  }else if(k==='twr'){
    ebLascia(TWR,twrSend);
    try{ twrStopRaf(); }catch(e){}
    TWR.ui=''; TWR.practice=false; TWR.pendingTicket=null;
    try{ twrOvClose(); }catch(e){}
    try{ wsNetBanner('turf',0); }catch(e){}
    try{ if(typeof twr3dSmonta==='function')twr3dSmonta(); }catch(e){}
    ebDopo();
  }else if(k==='rr'||k==='ch'){
    var url=(k==='rr')?'/duel/rr_cancel':'/duel/ch_cancel';
    try{ if(k==='rr'){ dlRrStopPoll(); dlRrStopTick(); } else { dlChStopPoll(); dlChStopTick(); } }catch(e){}
    EB.duel=''; EB.duelPr=false;
    if(!EB.duelFine){
      try{ fetch(BACKEND+url,{method:'POST',headers:dlBjHdr(),body:JSON.stringify({user_id:S.userId})}).catch(function(){}); }catch(e){}
    }
    try{ dlCloseOverlay(); }catch(e){}
    if(typeof TRN!=='undefined'&&TRN.trainFrom&&typeof trnTrainBack==='function'){ trnTrainBack(); }
  }
  ebTick();
}
function ebBackClick(){ if(EB.conf){ ebResta(); return; } if(ebCtx())ebChiedi(); }
function ebTick(){
  var k=ebCtx(), b=ebDom();
  if(k!==EB.on){
    EB.on=k;
    b.style.display=k?'flex':'none';
    try{ document.body.classList.toggle('eb-on',!!k); }catch(e){}
    if(!k&&EB.conf)ebResta();
  }
  var dx=(k==='rtd'&&window.RTD&&(RTD.game==='lastcall'||RTD.game==='lupus'||RTD.game==='kaiju'||RTD.game==='settemezzo'||RTD.game==='briscola'||RTD.game==='tappo'||RTD.game==='geo'||RTD.game==='deadmoney'||RTD.game==='smash'||RTD.game==='sbanca'||RTD.game==='abisso'||RTD.game==='hop'));
  if(b.classList.contains('eb-dx')!==dx)b.classList.toggle('eb-dx',dx);
  var t=ebTg();
  if(t&&t.BackButton){
    try{
      if(k&&!EB.bb){
        if(!EB.cbBB){ EB.cbBB=ebBackClick; t.BackButton.onClick(EB.cbBB); }
        t.BackButton.show(); EB.bb=true;
      }else if(!k&&EB.bb){ t.BackButton.hide(); EB.bb=false; }
    }catch(e){}
  }
}
function ebFrecce(){
  ['arc','turf','glad','tank'].forEach(function(id){
    var sc=document.getElementById(id), bk=sc&&sc.querySelector('.game-hdr .back-btn');
    if(!bk||bk.__eb)return; bk.__eb=1;
    bk.addEventListener('click',function(ev){
      if(ebCtx()){ ev.preventDefault(); ev.stopImmediatePropagation(); ebChiedi(); }
    },true);
  });
}
(function(){
  function avvolgi(nome,chiave){
    var o=window[nome]; if(typeof o!=='function'||o.__eb)return;
    var f=function(d){
      try{ if(d&&typeof d==='object'){ EB.duel=chiave; EB.duelPr=!!d.pratica;
        EB.duelFine=(d.status==='done'||d.state==='done'||!!d.over); } }catch(e){}
      return o.apply(this,arguments);
    };
    f.__eb=1; window[nome]=f;
  }
  avvolgi('dlRrEnter','rr'); avvolgi('dlRrBoard','rr');
  avvolgi('dlChEnter','ch'); avvolgi('dlChBoard','ch');
  var av=window.dlAvvisoPartita;
  if(typeof av==='function'&&!av.__eb){
    var fa=function(g){
      var self=this, args=arguments, gg=String(g||'');
      var st=(gg==='rr')?'/duel/rr_state':(gg==='chess'||gg==='ch')?'/duel/ch_state':'';
      if(!st)return av.apply(self,args);
      var sulTavolo=(typeof CUR!=='undefined'&&CUR==='duel'&&EB.duel);
      fetch(BACKEND+st,{method:'POST',headers:dlBjHdr(),body:JSON.stringify({user_id:S.userId})})
        .then(function(r){return r.json();}).then(function(d){
          if(d&&d.pratica){
            if(!sulTavolo){
              var cu=(gg==='rr')?'/duel/rr_cancel':'/duel/ch_cancel';
              fetch(BACKEND+cu,{method:'POST',headers:dlBjHdr(),body:JSON.stringify({user_id:S.userId})}).catch(function(){});
            }
            return;
          }
          av.apply(self,args);
        }).catch(function(){ av.apply(self,args); });
    };
    fa.__eb=1; window.dlAvvisoPartita=fa;
  }
})();
(function(){
  function via(){ try{ ebDom(); ebFrecce(); }catch(e){} if(!EB.timer)EB.timer=setInterval(ebTick,400); ebTick(); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',via); else via();
})();
