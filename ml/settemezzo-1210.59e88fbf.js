var SMRT={wrap:null,fr:null,pronto:false,coda:[],aperto:false,nascosto:false,firma:"",start:null,fineScena:false,loads:0,codaPiena:false,tgEv:false,spec:false,liberoS:0,liberoT:0};
var SMRT_VER="20261118ddcb";
function smrtUrl(){return "settemezzo.html?guscio=1&v="+SMRT_VER+"&lang="+((window.GB_LANG==="en")?"en":"it");}
var SMRT_URL=smrtUrl();
var SMRT_ORIGIN=location.origin;
var SMRT_CODA_MAX=2000;
var SMRT_MOSSE={carta:1,sto:1};
var SMRT_HO_BLOCCATO=false;
function smrtBlocca(){
  try{ if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();SMRT_HO_BLOCCATO=true;} }catch(e){}
}
function smrtSblocca(){
  try{ if(SMRT_HO_BLOCCATO&&typeof bx2Sblocca==="function")bx2Sblocca(); }catch(e){}
  SMRT_HO_BLOCCATO=false;
}
function smrtInt(x,d){
  if(typeof x==="number"&&isFinite(x)&&Math.floor(x)===x&&x>=-2147483648&&x<2147483648)return x;
  return d;
}
function smrtAx(x){
  if(x===undefined||x===null)return {ok:true,v:null};
  if(typeof x==="number"&&smrtInt(x,null)!==null)return {ok:true,v:x};
  return {ok:false};
}
function smrtAltezza(){
  try{
    if(!SMRT.wrap)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){SMRT.wrap.style.height=Math.round(h)+"px";SMRT.wrap.style.bottom="auto";}
    else{SMRT.wrap.style.height="100%";SMRT.wrap.style.bottom="0px";}
  }catch(e){}
}
function smrtBordi(){
  try{
    if(!SMRT.fr||!SMRT.pronto)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var sa=(tg2&&tg2.safeAreaInset)||{}, ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){
      var t=(Number(a)||0)+(Number(b)||0), e=(typeof luprtEnv==="function")?luprtEnv(lato):0;
      var v=Math.max(t,e);
      if(!isFinite(v)||v<0)v=0; if(v>200)v=200;
      return Math.round(v);
    }
    smrtPosta({t:"bordi",top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom),
               left:q("left",sa.left,ca.left),right:q("right",sa.right,ca.right)});
  }catch(e){}
}
function smrtTelegram(){
  if(SMRT.tgEv)return;SMRT.tgEv=true;
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2&&typeof tg2.onEvent==="function"){
      tg2.onEvent("viewportChanged",function(){smrtAltezza();smrtBordi();});
      tg2.onEvent("safeAreaChanged",smrtBordi);
      tg2.onEvent("contentSafeAreaChanged",smrtBordi);
      tg2.onEvent("fullscreenChanged",smrtBordi);
    }
  }catch(e){}
  try{window.addEventListener("orientationchange",function(){setTimeout(smrtBordi,250);});}catch(e2){}
}
function smrtMonta(){
  if(!SMRT.wrap){
    var w=document.createElement("div");
    w.id="smrt-wrap";
    w.style.cssText="position:fixed;inset:0;z-index:9100;display:none;background:#0c2a20;touch-action:none;overscroll-behavior:none;";
    w.innerHTML="<iframe id='smrt-fr' title='SETTE E MEZZO' allow='autoplay' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w);
    SMRT.wrap=w;SMRT.fr=w.querySelector("#smrt-fr");
    SMRT.fr.addEventListener("load",function(){ if(SMRT.fr.getAttribute("src")===SMRT_URL)SMRT.loads++; });
    smrtTelegram();
  }
  if(SMRT.fr.getAttribute("src")!==SMRT_URL){
    SMRT.pronto=false;SMRT.coda=[];SMRT.codaPiena=false;
    SMRT.fr.setAttribute("src",SMRT_URL);
  }
}
function smrtPrecarica(){
  if(RTD.game!=="settemezzo")return;
  smrtMonta();
}
function smrtCssEsci(){
  if(document.getElementById("smrt-css"))return;
  try{
    var st=document.createElement("style");st.id="smrt-css";
    st.textContent="body.smrt-on #gx-esci.gx-dx,body.smrt-on #eb-esci.eb-dx{top:calc(4px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}";
    document.head.appendChild(st);
  }catch(e){}
}
function smrtASchermo(){
  SMRT.wrap.style.display="block";
  smrtCssEsci();
  try{document.body.classList.add("smrt-on");}catch(e0){}
  smrtBlocca();
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){ if(typeof tg2.expand==="function")tg2.expand(); if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes(); }
  }catch(e){}
  smrtAltezza();
}
function smrtViaDalloSchermo(){
  smrtSblocca();
  try{document.body.classList.remove("smrt-on");}catch(e0){}
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2&&typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();}catch(e){}
  SMRT.wrap.style.display="none";
}
var SMRT_TIFO="",SMRT_TIFO_AGG=false;
function smrtTifo(){
  try{
    if(!SMRT.aperto||SMRT.spec||RTD.spec||RTD.ui!=="match"||RTD.game!=="settemezzo")return;
    var ch=String(trnChatCh()||"");if(ch.indexOf("r:")!==0)return;
    var T=TRN.chat||[],L=T.slice(-2);
    var k=ch+"|"+T.length+"|"+(L.length?String(L[L.length-1].x||""):"");
    if(k===SMRT_TIFO)return;SMRT_TIFO=k;
    if(!L.length)return;
    smrtGiu({t:"chat",righe:L.map(function(c){return {n:String(c.n||"?").slice(0,24),x:String(c.x||"").slice(0,140),g:c.g?1:0};})});
  }catch(e){}
}
function smrtTifoAggancia(){
  if(SMRT_TIFO_AGG||typeof trnTickerPaint!=="function")return;
  SMRT_TIFO_AGG=true;
  var v=trnTickerPaint;
  trnTickerPaint=function(){var r=v.apply(this,arguments);smrtTifo();return r;};
}
function rtdShowSettemezzoRT(m,spec){
  RTD.ui="match";rtdOvClose();
  if(typeof BXRT!=="undefined"&&BXRT.aperto)rtdChiudiBoxeRT();
  if(typeof LUPRT!=="undefined"&&LUPRT.aperto&&typeof rtdChiudiLupusRT==="function")rtdChiudiLupusRT(true);
  if(typeof LCRT!=="undefined"&&LCRT.aperto&&typeof rtdChiudiLastcallRT==="function")rtdChiudiLastcallRT(true);
  if(typeof BJRT!=="undefined"&&BJRT.aperto&&typeof rtdChiudiBjRT==="function")rtdChiudiBjRT(true);
  if(typeof PKRT!=="undefined"&&PKRT.aperto&&typeof rtdChiudiPkRT==="function")rtdChiudiPkRT(true);
  if(typeof DPRT!=="undefined"&&DPRT.aperto&&typeof rtdChiudiDeadpeakRT==="function")rtdChiudiDeadpeakRT(true);
  if(typeof KJRT!=="undefined"&&KJRT.aperto&&typeof rtdChiudiKaijuRT==="function")rtdChiudiKaijuRT(true);
  if(typeof BRRT!=="undefined"&&BRRT.aperto&&typeof rtdChiudiBriscolaRT==="function")rtdChiudiBriscolaRT(true);
  if(typeof TPRT!=="undefined"&&TPRT.aperto&&typeof rtdChiudiTappoRT==="function")rtdChiudiTappoRT(true);
  if(typeof SBRT!=="undefined"&&SBRT.aperto&&typeof rtdChiudiSbancaRT==="function")rtdChiudiSbancaRT(true);
  if(typeof ABRT!=="undefined"&&ABRT.aperto&&typeof rtdChiudiAbissoRT==="function")rtdChiudiAbissoRT(true);
  if(typeof HPRT!=="undefined"&&HPRT.aperto&&typeof rtdChiudiHopRT==="function")rtdChiudiHopRT(true);
  if(typeof GEORT!=="undefined"&&GEORT.aperto&&typeof rtdChiudiGeoRT==="function")rtdChiudiGeoRT(true);
  if(typeof DMRT!=="undefined"&&DMRT.aperto&&typeof rtdChiudiDeadmoneyRT==="function")rtdChiudiDeadmoneyRT(true);
  if(typeof GSRT!=="undefined"&&GSRT.aperto&&typeof rtdChiudiSmashRT==="function")rtdChiudiSmashRT(true);
  RTD.ctx=null;RTD.cv=null;
  if(typeof rtdStopRaf==="function")rtdStopRaf();
  RTD._rafT=0;RTD._hintOff=1;
  try{GBMusic.stop();}catch(e){}
  smrtMonta();
  var eraNascosto=SMRT.aperto&&SMRT.nascosto;
  var eraChiuso=!SMRT.aperto;
  if(eraChiuso)SMRT.coda=[];
  if(m){
    var firma=String((m.map&&m.map.firma!=null)?m.map.firma:"");
    if(SMRT.aperto&&SMRT.firma!==firma){SMRT.coda=[];SMRT.fineScena=false;}
    if(!SMRT.aperto)SMRT.fineScena=false;
    SMRT.firma=firma;SMRT.start=m;
    SMRT.spec=!!spec;
    SMRT_TIFO="";smrtTifoAggancia();
  }
  SMRT.aperto=true;SMRT.nascosto=false;
  smrtASchermo();
  if(eraNascosto||eraChiuso)smrtGiu({t:"riprendi"});
  if(!m)rtdSend({t:"rientra"});
  if(m&&spec){
    var mm={},k;for(k in m)mm[k]=m[k];
    mm.t="start";mm.spec=true;mm.you=null;mm.tour=false;
    smrtGiu(mm);
    return;
  }
  if(m)smrtGiu(m);
}
function rtdChiudiSettemezzoRT(forza){
  if(!SMRT.wrap||!SMRT.fr)return;
  var visibile=(SMRT.wrap.style.display==="block");
  if(!SMRT.aperto&&!visibile&&!forza)return;
  smrtViaDalloSchermo();
  if(!forza&&SMRT.aperto&&RTD.ui==="match"){
    SMRT.nascosto=true;
    smrtGiu({t:"pausa"});
    return;
  }
  SMRT.aperto=false;SMRT.nascosto=false;SMRT.pronto=false;SMRT.coda=[];SMRT.codaPiena=false;
  SMRT.firma="";SMRT.start=null;SMRT.fineScena=false;
  SMRT.spec=false;
  if(SMRT.fr.getAttribute("src")!=="about:blank")SMRT.fr.setAttribute("src","about:blank");
}
function smrtTettoFine(){
  var r=0;
  try{ r=Math.max(0,(Number(SMRT.liberoS)||0)*1000-(performance.now()-(Number(SMRT.liberoT)||0))); }catch(e){ r=0; }
  if(!isFinite(r))r=0;
  return Math.max(12000,Math.min(30000,Math.round(r+10000)));
}
function smrtSpecOver(m){
  RTD.over=m;RTD.specRid=null;
  smrtGiu(m);
  if(SMRT.fineScena||SMRT.nascosto){rtdSpecOver(m);return;}
  if(RTD.overTmr)clearTimeout(RTD.overTmr);
  RTD.overTmr=setTimeout(function(){RTD.overTmr=null;if(RTD.over===m&&RTD.ui==="match")rtdSpecOver(m);},smrtTettoFine());
}
function smrtRicercaPosta(){
  var c=(typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="settemezzo")?LOB.card:null;
  if(!c)return null;
  if(c.gratis||!(Number(c.stake_eur)>0))return 0;
  return Number(c.stake_eur);
}
function smrtRicercaGratis(gratis){
  if(RTD.game!=="settemezzo"||RTD.tour||RTD.practice||RTD.ui!=="search")return;
  var el=document.getElementById("arc-body");if(!el)return;
  var pz=document.getElementById("arc-prize");
  if(pz&&gratis)pz.textContent="🎁 GRATIS";
  var bt=el.querySelector("button[onclick=\"rtdLeave()\"]");
  if(bt)bt.textContent=gratis?"✖ ESCI":"✖ ANNULLA (rimborso)";
}
function smrtPosta(m){
  try{ SMRT.fr.contentWindow.postMessage({sm:"giu",m:m},SMRT_ORIGIN); }catch(e){}
}
function smrtSenzaEventi(m){ return !!(m&&m.t==="s"&&!(m.feed&&m.feed.length)); }
function smrtGiu(m){
  if(!SMRT.aperto||!SMRT.fr)return;
  if(SMRT.pronto){smrtPosta(m);return;}
  var c=SMRT.coda,i;
  if(smrtSenzaEventi(m)){
    for(i=c.length-1;i>=0;i--){ if(smrtSenzaEventi(c[i])){c.splice(i,1);break;} }
  }
  c.push(m);
  if(c.length>SMRT_CODA_MAX){
    var k=0;
    for(i=0;i<c.length;i++){ if(c[i]&&c[i].t==="s"){k=i;break;} }
    c.splice(k,1);
    if(!SMRT.codaPiena){
      SMRT.codaPiena=true;
      RTD._rerr="sm:coda piena prima del pronto";
      try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"settemezzo",msg:"coda piena prima del pronto"}));}catch(e){}
    }
  }
}
function smrtRicevi(m){
  var t=m&&m.t;
  if(t==="s"){
    if(m.g!=="settemezzo")return false;
    SMRT.liberoS=Number(m.libero_s)||0;SMRT.liberoT=performance.now();
    SMRT.fuori=!!(m.you&&m.you.sg>=0&&m.you.vivo===false&&m.fase==="gioco");
    smrtGiu(m);
    return true;
  }
  if(t==="err"&&/^sm_/.test(String(m.code||""))){smrtGiu(m);return true;}
  if(t==="esce"&&m.game==="settemezzo"){smrtGiu(m);return false;}
  if(t==="hello_ok"&&SMRT.aperto&&!SMRT.spec&&RTD.game==="settemezzo"&&RTD.ui==="match"&&!RTD.over)rtdSend({t:"rientra"});
  return false;
}
window.addEventListener("message",function(ev){
  if(ev.origin!==SMRT_ORIGIN)return;
  var d=ev.data;if(!d||typeof d!=="object"||d.sm===undefined)return;
  if(!SMRT.fr||ev.source!==SMRT.fr.contentWindow)return;
  if(d.sm==="su"){
    var o=d.m;
    if(!o||typeof o!=="object"||o.t!=="act"||!SMRT.aperto||SMRT.spec||RTD.spec)return;
    var a=(typeof o.a==="string")?o.a:"";
    if(!Object.prototype.hasOwnProperty.call(SMRT_MOSSE,a))return;
    var ax=smrtAx(o.ax);
    if(!ax.ok)return;
    rtdSend({t:"act",a:a,ax:ax.v,ay:null,power:smrtInt(o.power,null)});
    return;
  }
  if(d.sm==="pronto"){
    SMRT.pronto=true;
    RTD._wsT=performance.now();
    smrtBordi();
    if(SMRT.aperto){
      var c=SMRT.coda;SMRT.coda=[];
      for(var i=0;i<c.length;i++)smrtPosta(c[i]);
      if(SMRT.codaPiena){SMRT.codaPiena=false;if(!SMRT.spec)rtdSend({t:"rientra"});}
      return;
    }
    SMRT.coda=[];
    smrtPosta({t:"pausa"});
    return;
  }
  if(d.sm==="fine_scena"){
    SMRT.fineScena=true;
    if(SMRT.spec&&RTD.spec&&RTD.over&&RTD.over.game==="settemezzo"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdSpecOver(RTD.over);return;
    }
    if(RTD.over&&RTD.over.game==="settemezzo"&&RTD.ui==="match"&&RTD.overTmr){
      clearTimeout(RTD.overTmr);RTD.overTmr=null;rtdShowOver(RTD.over);
    }
    return;
  }
  if(d.sm==="esci"){
    if(!SMRT.aperto)return;
    if(SMRT.spec||RTD.spec){rtdSpecExit();return;}
    if(RTD.over&&RTD.over.game==="settemezzo"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);return;
    }
    if(d.fuori&&SMRT.fuori&&RTD.ui==="match"&&!RTD.practice){
      var cx=null;
      try{cx=(typeof gxCtx==="function")?gxCtx():null;}catch(e1){cx=null;}
      if(cx&&cx.fam==="rtd"&&typeof gxManda==="function"&&typeof gxInfo==="function")gxManda(cx,gxInfo(cx));
      else rtdSend({t:"abbandona"});
      return;
    }
    rtdBack();return;
  }
  if(d.sm==="err"){
    RTD._rerr="sm:"+String(d.msg||"").slice(0,60);
    try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"settemezzo",msg:String(d.msg||"").slice(0,300)}));}catch(e){}
    return;
  }
});
function smrtEuro(v){var s=lupEuro(v);return (window.GB_LANG==="en")?s.replace(",","."):s;}
function rtdShowOverSettemezzo(m){
  var pratica=!!(m.practice||RTD.practice);
  var gratis=!!m.gratis||!(Number(m.pot_eur)>0);
  var chi=(m.winner!=null)?String(m.winner_name||rtdName(m.winner)||""):String(m.winner_name||"");
  if(window.GB_LANG==="en")chi=chi.replace(" (bot, uscito)"," (bot, left)");
  var tasti='<div class="tw-ov-btns"><button class="action-btn gold" onclick="rtdAgain()">'+LBL_AGAIN+'</button>'
    +'<button class="action-btn" onclick="rtdAgain();go(&quot;duel&quot;)">⚔️ PvP ARENA</button></div>';
  var tastiPratica='<div class="tw-ov-btns"><button class="action-btn train-btn" onclick="rtdPracAgain()">🔁 ANCORA · GRATIS</button>'
    +'<button class="action-btn gold" onclick="rtdPracToReal()">💰 GIOCA VERA</button></div>';
  var h;
  if(m.motivo==="patta"&&m.winner==null&&!m.abbandono){
    TWS.play("lose");
    h='<div style="font-size:44px;">🤝</div><div class="tw-lose-t">PATTA</div>'
     +'<div class="tw-ov-sub">'+((pratica||gratis)?"Sessanta pari: non vince nessuno.":(m.rimborso_in_sospeso?"Sessanta pari: la posta torna sul saldo fra poco, stiamo chiudendo i conti.":"Sessanta pari: la posta è tornata sul saldo."))+'</div>'
     +(pratica?tastiPratica:tasti);
    rtdOv(h,true);
    if(pratica)RTD.ui="";
    rtdShowLobby(true);
    if(typeof loadBalance==="function")loadBalance();
    if(m.rimborso_in_sospeso&&typeof loadBalance==="function"){setTimeout(loadBalance,8000);setTimeout(loadBalance,25000);}
    return;
  }
  if(m.annullata){
    TWS.play("lose");
    h='<div style="font-size:44px;">🧯</div><div class="tw-lose-t">TAVOLO ANNULLATO</div>'
     +'<div class="tw-ov-sub">'+((pratica||gratis)?"La partita non è arrivata in fondo.":(m.rimborso_in_sospeso?"La partita non è arrivata in fondo: la posta torna sul saldo fra poco.":"La partita non è arrivata in fondo: posta rimborsata."))+'</div>'
     +tasti;
    rtdOv(h,true);
    rtdShowLobby(true);
    if(typeof loadBalance==="function")loadBalance();
    if(m.rimborso_in_sospeso&&typeof loadBalance==="function"){setTimeout(loadBalance,8000);setTimeout(loadBalance,25000);}
    return;
  }
  var riga=m.you_won?'<div class="tw-ov-sub">IL TAVOLO È TUO</div>'
    :(chi?'<div class="tw-ov-sub"><b>'+trnEsc(chi)+'</b> vince il tavolo</div>':'<div class="tw-ov-sub">PARTITA FINITA</div>');
  if(pratica){
    TWS.play(m.you_won?"win":"lose");
    h=riga.replace('class="tw-ov-sub"','class="tw-ov-sub" style="margin-bottom:6px;color:#ff9900;"')
     +practiceOverHTML(!!m.you_won,"rtdPracAgain","rtdPracToReal");
    rtdOv(h,true);
    RTD.ui="";
    rtdShowLobby(true);
    return;
  }
  if(m.abbandono){
    TWS.play("lose");
    h='<div style="font-size:44px;">🏳️</div><div class="tw-lose-t">HAI LASCIATO IL TAVOLO</div>'
     +'<div class="tw-ov-sub">'+(gratis?"Partita gratis: non hai perso niente.":"La tua posta resta nel piatto.")+'</div>'
     +tasti;
    rtdOv(h,true);
    rtdShowLobby(true);
    if(typeof loadBalance==="function")loadBalance();
    return;
  }
  var premio=Number((m.your_cut_eur!=null)?m.your_cut_eur:m.prize_eur)||0;
  if(m.you_won){
    TWS.play("win");
    try{tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred("success");}catch(e){}
    var coins="";for(var i=0;i<12;i++){coins+='<span class="twr-coin" style="left:'+(4+Math.random()*92)+'%;animation-delay:'+(Math.random()*1.6)+'s;">🪙</span>';}
    h='<div class="twr-rain">'+coins+'</div>'
     +'<div style="font-size:46px;" class="twr-trophy">🏆</div>'
     +'<div class="tw-win-t">HAI VINTO</div>'
     +riga
     +(gratis?"":'<div class="tw-win-prize">+€ '+smrtEuro(premio)+'</div>')
     +((!gratis&&m.premio_in_sospeso)?'<div class="tw-ov-sub">Il premio arriva sul saldo fra poco: stiamo chiudendo i conti</div>':"")
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+smrtEuro(m.pot_eur)+'</div>');
  }else{
    TWS.play("lose");
    h='<div style="font-size:44px;">💀</div><div class="tw-lose-t">SCONFITTA</div>'
     +riga
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+smrtEuro(m.pot_eur)+'</div>');
  }
  h+=tasti;
  rtdOv(h,true);
  rtdShowLobby(true);
  if(typeof loadBalance==="function")loadBalance();
  if(m.premio_in_sospeso&&typeof loadBalance==="function"){setTimeout(loadBalance,8000);setTimeout(loadBalance,25000);}
}
