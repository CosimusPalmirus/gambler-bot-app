var GX={on:'',attesa:null,tmr:0,timer:0,dlg:false};
function gxEn(){ return (typeof GB_LANG!=='undefined'&&GB_LANG==='en'); }
function gxCtx(){
  var c=(typeof CUR!=='undefined')?CUR:'';
  var fam='',O=null,send=null,scr='';
  try{
    if(c==='arc'&&window.RTD){fam='rtd';O=RTD;send=rtdSend;scr='arc';}
    else if(c==='turf'&&window.TWR){fam='twr';O=TWR;send=twrSend;scr='turf';}
    else if(c==='tank'&&window.TKD){fam='tkd';O=TKD;send=tkSend;scr='tank';}
    else if(c==='glad'&&window.GLD){fam='gld';O=GLD;send=gldSend;scr='glad';}
    if(!O||O.ui!=='match'||O.spec||O.practice||O.over)return null;
    var me=String(O.myId==null?'':O.myId);
    if(!me||me==='undefined'||me==='null')return null;
    if(typeof LOBSP!=='undefined'&&LOBSP.on)return null;
    if(fam==='rtd'){
      var sp=[window.LUPRT,window.LCRT,window.BJRT,window.PKRT,window.DPRT,window.BXRT,window.KJRT,window.SMRT,window.BRRT,window.TPRT,window.GEORT,window.DMRT,window.GSRT,window.SBRT,window.ABRT,window.HPRT];
      for(var i=0;i<sp.length;i++){ if(sp[i]&&sp[i].aperto&&sp[i].spec)return null; }
    }
  }catch(e){ return null; }
  return {fam:fam,O:O,send:send,scr:scr,game:(fam==='rtd'?O.game:fam==='twr'?'turf':fam==='tkd'?'tank':'glad')};
}
function gxInfo(ctx){
  var O=ctx.O, n=0;
  try{ n=Object.keys(O.names||{}).length; }catch(e){}
  var uvu=(n<=2);
  if(O.tour)return {tipo:'torneo',posta_eur:0,uno_contro_uno:uvu};
  var pot=Number(O.potEur)||0, card=null;
  try{ if(typeof LOB!=='undefined'&&LOB.card&&String(LOB.card.game||'')===ctx.game)card=LOB.card; }catch(e){}
  if(!(pot>0))return {tipo:'gratis',posta_eur:0,uno_contro_uno:uvu};
  var posta=0, ok=function(v){ v=Number(v); return (v>0&&v<=pot+0.005)?v:0; };
  if(GX.join&&GX.join.game===ctx.game&&Date.now()-GX.join.t<30*60000)posta=ok(GX.join.tier);
  if(!posta&&card)posta=ok(card.stake_eur);
  if(!posta)posta=pot/Math.max(1,n||2);
  return {tipo:'soldi',posta_eur:Math.round(posta*100)/100,uno_contro_uno:uvu};
}
(function(){
  function avvolgi(nome,O,game){
    var f=window[nome]; if(typeof f!=='function'||f.__gx)return;
    var g=function(){ try{ var o=window[O]; GX.join={game:(typeof game==='function'?game():game),tier:parseFloat(o&&o.tier),t:Date.now()}; }catch(e){} return f.apply(this,arguments); };
    g.__gx=1; window[nome]=g;
  }
  avvolgi('rtdJoin','RTD',function(){return window.RTD?RTD.game:'';});
  avvolgi('twrJoin','TWR','turf'); avvolgi('tkJoin','TKD','tank'); avvolgi('gldJoin','GLD','glad');
})();
function gxCss(){
  if(document.getElementById('gx-css'))return;
  var st=document.createElement('style'); st.id='gx-css';
  st.textContent=''
   +'#gx-esci{position:fixed;z-index:2147482000;left:calc(10px + max(env(safe-area-inset-left,0px),var(--tg-left,0px)));'
   +'top:calc(14px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));display:none;align-items:center;gap:6px;'
   +'height:36px;padding:0 12px 0 10px;border-radius:18px;border:1px solid rgba(248,113,113,.55);'
   +'background:rgba(10,14,26,.94);color:#f1f4fa;font:800 11px/1 Orbitron,"Russo One",sans-serif;letter-spacing:.8px;'
   +'box-shadow:0 4px 14px rgba(0,0,0,.45);-webkit-tap-highlight-color:transparent;touch-action:manipulation;cursor:pointer;}'
   +'#gx-esci b{font-size:14px;line-height:1;}'
   +'#gx-esci.gx-dx{left:auto;right:calc(10px + max(env(safe-area-inset-right,0px),var(--tg-right,0px)));top:calc(52px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}'
   +'#gx-esci.gx-rail{left:calc(54px + var(--oz-l,0px));top:calc(8px + var(--oz-t,0px));}'
   +'#gx-esci:active{transform:scale(.96);}'
   +'body.gx-on .screen.active>.game-hdr>.back-btn{visibility:hidden;}'
   +'body.gx-on .screen.active>.game-hdr>.game-title{padding-left:44px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}';
  document.head.appendChild(st);
}
function gxDom(){
  gxCss();
  var b=document.getElementById('gx-esci');
  if(!b){
    b=document.createElement('button'); b.id='gx-esci'; b.type='button';
    b.setAttribute('aria-label',gxEn()?'Leave the match':'Esci dalla partita');
    b.innerHTML='<b>🏳️</b><span>'+(gxEn()?'EXIT':'ESCI')+'</span>';
    b.addEventListener('click',function(ev){ ev.preventDefault(); ev.stopPropagation(); gxChiedi(); });
    document.body.appendChild(b);
  }
  return b;
}
function gxChiedi(){
  var ctx=gxCtx(); if(!ctx||GX.attesa){ gxTick(); return; }
  var info=gxInfo(ctx);
  GX.dlg=true;
  gbEsciConferma(info,function(){
    GX.dlg=false;
    var c2=gxCtx();
    if(!c2||c2.fam!==ctx.fam){ toast(gxEn()?'The match is already over':'La partita è già finita','warn',1800); return; }
    gxManda(c2,info);
  });
}
function gxManda(ctx,info){
  if(!ctx.O.wsOk||!ctx.O.ws){ toast(gxEn()?'No connection: try again in a moment':'Connessione assente: riprova fra un attimo','err',2200); return; }
  GX.attesa={fam:ctx.fam,t:Date.now(),info:info};
  try{ console.log('[ESCI_PARTITA] abbandona '+ctx.fam+' '+ctx.game+' '+info.tipo); }catch(e){}
  ctx.send({t:'abbandona'});
  if(GX.tmr)clearTimeout(GX.tmr);
  GX.tmr=setTimeout(function(){
    GX.tmr=0;
    if(GX.attesa){ GX.attesa=null; gxTick(); toast(gxEn()?'The server did not answer: try again':'Il server non ha risposto: riprova','err',2400); }
  },10000);
  gxTick();
}
function gxErr(fam,m){
  if(!GX.attesa||GX.attesa.fam!==fam)return;
  GX.attesa=null; if(GX.tmr){clearTimeout(GX.tmr);GX.tmr=0;} gxTick();
}
function gxSoldi(v){ return '€ '+(Number(v)||0).toFixed(2).replace('.',','); }
function gxHtml(info,m,fn){
  var en=gxEn(), tipo=info.tipo, uvu=!!info.uno_contro_uno, h, tit, sub;
  var posta=(m&&Number(m.posta_eur)>0)?Number(m.posta_eur):Number(info.posta_eur)||0;
  if(tipo==='torneo'){
    tit=en?'OUT OF THE TOURNAMENT':'SEI FUORI DAL TORNEO';
    sub=en?'You left this match: you lose it and the tournament goes on without you.':'Hai lasciato il match: lo perdi e il torneo continua senza di te.';
  }else if(tipo==='gratis'){
    tit=en?'YOU LEFT THE MATCH':'HAI LASCIATO LA PARTITA';
    sub=en?('Free match: you lost nothing. '+(uvu?'Your opponent wins the match.':'A bot plays your seat until the end.'))
          :('Partita gratis: non hai perso niente. '+(uvu?'L’avversario vince la partita.':'Al tuo posto gioca un bot fino alla fine.'));
  }else{
    tit=en?'YOU LEFT THE MATCH':'HAI LASCIATO LA PARTITA';
    sub=en?('You lost your stake of <b>'+gxSoldi(posta)+'</b>. '+(uvu?'Your opponent wins the pot.':'A bot plays your seat until the end: you win nothing.'))
          :('Hai perso la tua posta di <b>'+gxSoldi(posta)+'</b>. '+(uvu?'L’avversario vince il piatto.':'Al tuo posto gioca un bot fino alla fine: non vinci niente.'));
  }
  h='<div class="gx-fine" data-tipo="'+tipo+'"><div style="font-size:44px;">🏳️</div><div class="tw-lose-t">'+tit+'</div>'
   +'<div class="tw-ov-sub">'+sub+'</div>';
  if(tipo==='torneo'){
    h+='<div class="tw-ov-btns"><button class="action-btn gold" onclick="'+fn.tour+'">'+(en?'🏆 BACK TO THE TOURNAMENT':'🏆 TORNA AL TORNEO')+'</button></div>';
  }else{
    h+='<div class="tw-ov-btns"><button class="action-btn gold" onclick="'+fn.again+'">'+(fn.againLbl||'🔁 GIOCA ANCORA')+'</button>'
     +'<button class="action-btn" onclick="'+fn.again+';'+fn.via+'">'+fn.viaLbl+'</button></div>';
  }
  return h+'</div>';
}
function gxFine(fam,m){
  try{
    var O=(fam==='rtd')?RTD:(fam==='twr')?TWR:(fam==='tkd')?TKD:GLD;
    if(O.spec)return false;
    var info=(GX.attesa&&GX.attesa.fam===fam)?GX.attesa.info:null;
    if(!info){
      var c=gxCtx();
      info=(c&&c.fam===fam)?gxInfo(c):{tipo:(O.tour||m.tour)?'torneo':(Number(m.pot_eur)>0?'soldi':'gratis'),posta_eur:0,uno_contro_uno:Object.keys(O.names||{}).length<=2};
    }
    GX.attesa=null; if(GX.tmr){clearTimeout(GX.tmr);GX.tmr=0;}
    var ov=document.getElementById('gb-esci-ov'); if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);
    GX.dlg=false;
    var tour=(info.tipo==='torneo');
    try{TWS.play('lose');}catch(e){}
    if(fam==='rtd'){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      RTD.over=m; rtdStopRaf();
      RTD.ui='';
      rtdOvClose();
      try{ if(typeof LUPRT!=='undefined'&&LUPRT.aperto)rtdChiudiLupusRT(true); }catch(e){}
      try{ wsNetBanner('arc',0); }catch(e){}
      rtdOv(gxHtml(info,m,{tour:'rtdTourDone()',again:'rtdAgain()',againLbl:LBL_AGAIN,via:"go('duel')",viaLbl:'⚔️ PvP ARENA'}),true);
      if(!tour)rtdShowLobby(true);
    }else if(fam==='twr'){
      TWR.over=m; TWR.ui='over'; try{TWS.engine(false);TWS.heart(false);}catch(e){}
      twrStopRaf();
      twrOv(gxHtml(info,m,{tour:'twrTourDone()',again:'twrAgain()',via:"go('home')",viaLbl:'🏠 HOME'}),true);
      if(!tour)twrShowLobby(true);
    }else if(fam==='tkd'){
      TKD.over=m; TKD.ui='over'; tkStopRaf();
      tkOv(gxHtml(info,m,{tour:'tkTourDone()',again:'tkAgain()',via:"go('duel')",viaLbl:'⚔️ PvP ARENA'}),true);
      if(!tour)tkShowLobby(true);
    }else{
      try{GLD.mid='';TRN.chatSubbed=0;trnChatSub();trnChatSwap();}catch(_c){}
      GLD.over=m; GLD.ui='over'; gldStopRaf();
      gldOv(gxHtml(info,m,{tour:'gldTourExit()',again:'gldAgain()',via:"go('duel')",viaLbl:'⚔️ PvP ARENA'}),true);
      if(!tour)gldShowLobby(true);
    }
    if(!tour&&typeof loadBalance==='function')loadBalance();
    gxTick();
    return true;
  }catch(e){
    try{console.error('[ESCI_PARTITA] fine',e);}catch(_){}
    return false;
  }
}
function gxIntercetta(fam){
  var c=gxCtx(); if(!c||c.fam!==fam)return false;
  gxChiedi(); return true;
}
function gxTick(){
  var c=gxCtx(), b=gxDom();
  var k=(c&&!GX.attesa&&!document.getElementById('gb-esci-ov'))?c.fam:'';
  if(k!==GX.on){
    GX.on=k; b.style.display=k?'flex':'none';
    try{ document.body.classList.toggle('gx-on',!!k); }catch(e){}
  }
  if(!c&&GX.dlg){ GX.dlg=false; var ov=document.getElementById('gb-esci-ov'); if(ov&&ov.parentNode)ov.parentNode.removeChild(ov); }
  var dx=!!(c&&c.fam==='rtd'&&(RTD.game==='lastcall'||RTD.game==='lupus'||RTD.game==='kaiju'||RTD.game==='settemezzo'||RTD.game==='briscola'||RTD.game==='tappo'||RTD.game==='geo'||RTD.game==='deadmoney'||RTD.game==='smash'||RTD.game==='sbanca'||RTD.game==='abisso'||RTD.game==='hop'));
  if(b.classList.contains('gx-dx')!==dx)b.classList.toggle('gx-dx',dx);
  var rl=false;
  if(k&&!dx){ try{ var r=document.getElementById('oz-rail'); rl=!!(r&&r.classList.contains('su')&&getComputedStyle(r).display!=='none'); }catch(e){} }
  if(b.classList.contains('gx-rail')!==rl)b.classList.toggle('gx-rail',rl);
}
(function(){
  if(typeof window.ebChiedi!=='function')return;
  window.ebChiedi=function(){
    if(!ebCtx()){ ebTick(); return; }
    var ov=document.getElementById('gb-esci-ov');
    if(ov){ if(ov.parentNode)ov.parentNode.removeChild(ov); return; }
    gbEsciConferma({tipo:'allenamento'},function(){ if(ebCtx())ebEsci(); });
  };
  function etichetta(){
    var b=document.getElementById('eb-esci');
    if(b&&!b.__gx){ b.__gx=1; b.innerHTML='<b>🏳️</b><span>'+(gxEn()?'EXIT':'ESCI')+'</span>'; }
  }
  window.__gxEtichetta=etichetta;
})();
(function(){
  function via(){ try{ gxDom(); if(window.__gxEtichetta)__gxEtichetta(); }catch(e){} if(!GX.timer)GX.timer=setInterval(gxTick,400); gxTick(); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',via); else via();
})();
