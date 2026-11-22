var TPRT={wrap:null,fr:null,pronto:false,coda:[],aperto:false,nascosto:false,firma:"",start:null,fineScena:false,loads:0,codaPiena:false,tgEv:false,spec:false,liberoS:0,liberoT:0};
var TPRT_VER="2026111825ae";
function tprtUrl(){return "tappo.html?guscio=1&v="+TPRT_VER+"&lang="+((window.GB_LANG==="en")?"en":"it");}
var TPRT_URL=tprtUrl();
var TPRT_ORIGIN=location.origin;
var TPRT_CODA_MAX=2000;
var TPRT_MOSSE={passa:1,mano:1};
var TPRT_HO_BLOCCATO=false;
function tprtBlocca(){
  try{ if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();TPRT_HO_BLOCCATO=true;} }catch(e){}
}
function tprtSblocca(){
  try{ if(TPRT_HO_BLOCCATO&&typeof bx2Sblocca==="function")bx2Sblocca(); }catch(e){}
  TPRT_HO_BLOCCATO=false;
}
function tprtInt(x,d){
  if(typeof x==="number"&&isFinite(x)&&Math.floor(x)===x&&x>=-2147483648&&x<2147483648)return x;
  return d;
}
function tprtAx(x){
  if(x===undefined||x===null)return {ok:true,v:null};
  if(typeof x==="number"&&tprtInt(x,null)!==null)return {ok:true,v:x};
  return {ok:false};
}
function tprtAltezza(){
  try{
    if(!TPRT.wrap)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){TPRT.wrap.style.height=Math.round(h)+"px";TPRT.wrap.style.bottom="auto";}
    else{TPRT.wrap.style.height="100%";TPRT.wrap.style.bottom="0px";}
  }catch(e){}
}
function tprtBordi(){
  try{
    if(!TPRT.fr||!TPRT.pronto)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var sa=(tg2&&tg2.safeAreaInset)||{}, ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){
      var t=(Number(a)||0)+(Number(b)||0), e=(typeof luprtEnv==="function")?luprtEnv(lato):0;
      var v=Math.max(t,e);
      if(!isFinite(v)||v<0)v=0; if(v>200)v=200;
      return Math.round(v);
    }
    tprtPosta({t:"bordi",top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom),
               left:q("left",sa.left,ca.left),right:q("right",sa.right,ca.right)});
  }catch(e){}
}
function tprtTelegram(){
  if(TPRT.tgEv)return;TPRT.tgEv=true;
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2&&typeof tg2.onEvent==="function"){
      tg2.onEvent("viewportChanged",function(){tprtAltezza();tprtBordi();});
      tg2.onEvent("safeAreaChanged",tprtBordi);
      tg2.onEvent("contentSafeAreaChanged",tprtBordi);
      tg2.onEvent("fullscreenChanged",tprtBordi);
    }
  }catch(e){}
  try{window.addEventListener("orientationchange",function(){setTimeout(tprtBordi,250);});}catch(e2){}
}
function tprtMonta(){
  if(!TPRT.wrap){
    var w=document.createElement("div");
    w.id="tprt-wrap";
    w.style.cssText="position:fixed;inset:0;z-index:9100;display:none;background:#0b1512;touch-action:none;overscroll-behavior:none;";
    w.innerHTML="<iframe id='tprt-fr' title='BISCA' allow='autoplay' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w);
    TPRT.wrap=w;TPRT.fr=w.querySelector("#tprt-fr");
    TPRT.fr.addEventListener("load",function(){ if(TPRT.fr.getAttribute("src")===TPRT_URL)TPRT.loads++; });
    tprtTelegram();
  }
  if(TPRT.fr.getAttribute("src")!==TPRT_URL){
    TPRT.pronto=false;TPRT.coda=[];TPRT.codaPiena=false;
    TPRT.fr.setAttribute("src",TPRT_URL);
  }
}
function tprtPrecarica(){
  if(RTD.game!=="tappo")return;
  tprtMonta();
}
function tprtCssEsci(){
  if(document.getElementById("tprt-css"))return;
  try{
    var st=document.createElement("style");st.id="tprt-css";
    st.textContent="body.tprt-on #gx-esci.gx-dx,body.tprt-on #eb-esci.eb-dx{top:calc(4px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}";
    document.head.appendChild(st);
  }catch(e){}
}
function tprtASchermo(){
  TPRT.wrap.style.display="block";
  tprtCssEsci();
  try{document.body.classList.add("tprt-on");}catch(e0){}
  tprtBlocca();
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){ if(typeof tg2.expand==="function")tg2.expand(); if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes(); }
  }catch(e){}
  tprtAltezza();
}
function tprtViaDalloSchermo(){
  tprtSblocca();
  try{document.body.classList.remove("tprt-on");}catch(e0){}
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2&&typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();}catch(e){}
  TPRT.wrap.style.display="none";
}
var TPRT_TIFO="",TPRT_TIFO_AGG=false;
function tprtTifo(){
  try{
    if(!TPRT.aperto||TPRT.spec||RTD.spec||RTD.ui!=="match"||RTD.game!=="tappo")return;
    var ch=String(trnChatCh()||"");if(ch.indexOf("r:")!==0)return;
    var T=TRN.chat||[],L=T.slice(-2);
    var k=ch+"|"+T.length+"|"+(L.length?String(L[L.length-1].x||""):"");
    if(k===TPRT_TIFO)return;TPRT_TIFO=k;
    if(!L.length)return;
    tprtGiu({t:"chat",righe:L.map(function(c){return {n:String(c.n||"?").slice(0,24),x:String(c.x||"").slice(0,140),g:c.g?1:0};})});
  }catch(e){}
}
function tprtTifoAggancia(){
  if(TPRT_TIFO_AGG||typeof trnTickerPaint!=="function")return;
  TPRT_TIFO_AGG=true;
  var v=trnTickerPaint;
  trnTickerPaint=function(){var r=v.apply(this,arguments);tprtTifo();return r;};
}
function rtdShowTappoRT(m,spec){
  RTD.ui="match";rtdOvClose();
  if(typeof BXRT!=="undefined"&&BXRT.aperto)rtdChiudiBoxeRT();
  if(typeof LUPRT!=="undefined"&&LUPRT.aperto&&typeof rtdChiudiLupusRT==="function")rtdChiudiLupusRT(true);
  if(typeof LCRT!=="undefined"&&LCRT.aperto&&typeof rtdChiudiLastcallRT==="function")rtdChiudiLastcallRT(true);
  if(typeof BJRT!=="undefined"&&BJRT.aperto&&typeof rtdChiudiBjRT==="function")rtdChiudiBjRT(true);
  if(typeof PKRT!=="undefined"&&PKRT.aperto&&typeof rtdChiudiPkRT==="function")rtdChiudiPkRT(true);
  if(typeof DPRT!=="undefined"&&DPRT.aperto&&typeof rtdChiudiDeadpeakRT==="function")rtdChiudiDeadpeakRT(true);
  if(typeof KJRT!=="undefined"&&KJRT.aperto&&typeof rtdChiudiKaijuRT==="function")rtdChiudiKaijuRT(true);
  if(typeof SMRT!=="undefined"&&SMRT.aperto&&typeof rtdChiudiSettemezzoRT==="function")rtdChiudiSettemezzoRT(true);
  if(typeof BRRT!=="undefined"&&BRRT.aperto&&typeof rtdChiudiBriscolaRT==="function")rtdChiudiBriscolaRT(true);
  if(typeof GEORT!=="undefined"&&GEORT.aperto&&typeof rtdChiudiGeoRT==="function")rtdChiudiGeoRT(true);
  if(typeof DMRT!=="undefined"&&DMRT.aperto&&typeof rtdChiudiDeadmoneyRT==="function")rtdChiudiDeadmoneyRT(true);
  if(typeof GSRT!=="undefined"&&GSRT.aperto&&typeof rtdChiudiSmashRT==="function")rtdChiudiSmashRT(true);
  RTD.ctx=null;RTD.cv=null;
  if(typeof rtdStopRaf==="function")rtdStopRaf();
  RTD._rafT=0;RTD._hintOff=1;
  try{GBMusic.stop();}catch(e){}
  tprtMonta();
  var eraNascosto=TPRT.aperto&&TPRT.nascosto;
  var eraChiuso=!TPRT.aperto;
  if(eraChiuso)TPRT.coda=[];
  if(m){
    var firma=String((m.map&&m.map.firma!=null)?m.map.firma:"");
    if(TPRT.aperto&&TPRT.firma!==firma){TPRT.coda=[];TPRT.fineScena=false;}
    if(!TPRT.aperto)TPRT.fineScena=false;
    TPRT.firma=firma;TPRT.start=m;
    TPRT.spec=!!spec;
    TPRT_TIFO="";tprtTifoAggancia();
  }
  TPRT.aperto=true;TPRT.nascosto=false;
  tprtASchermo();
  if(eraNascosto||eraChiuso)tprtGiu({t:"riprendi"});
  if(!m)rtdSend({t:"rientra"});
  if(m&&spec){
    var mm={},k;for(k in m)mm[k]=m[k];
    mm.t="start";mm.spec=true;mm.you=null;mm.tour=false;
    tprtGiu(mm);
    return;
  }
  if(m)tprtGiu(m);
}
function rtdChiudiTappoRT(forza){
  if(!TPRT.wrap||!TPRT.fr)return;
  var visibile=(TPRT.wrap.style.display==="block");
  if(!TPRT.aperto&&!visibile&&!forza)return;
  tprtViaDalloSchermo();
  if(!forza&&TPRT.aperto&&RTD.ui==="match"){
    TPRT.nascosto=true;
    tprtGiu({t:"pausa"});
    return;
  }
  TPRT.aperto=false;TPRT.nascosto=false;TPRT.pronto=false;TPRT.coda=[];TPRT.codaPiena=false;
  TPRT.firma="";TPRT.start=null;TPRT.fineScena=false;
  TPRT.spec=false;
  if(TPRT.fr.getAttribute("src")!=="about:blank")TPRT.fr.setAttribute("src","about:blank");
}
function tprtTettoFine(){
  var r=0;
  try{ r=Math.max(0,(Number(TPRT.liberoS)||0)*1000-(performance.now()-(Number(TPRT.liberoT)||0))); }catch(e){ r=0; }
  if(!isFinite(r))r=0;
  return Math.max(12000,Math.min(30000,Math.round(r+10000)));
}
function tprtSpecOver(m){
  RTD.over=m;RTD.specRid=null;
  tprtGiu(m);
  if(TPRT.fineScena||TPRT.nascosto){rtdSpecOver(m);return;}
  if(RTD.overTmr)clearTimeout(RTD.overTmr);
  RTD.overTmr=setTimeout(function(){RTD.overTmr=null;if(RTD.over===m&&RTD.ui==="match")rtdSpecOver(m);},tprtTettoFine());
}
function tprtRicercaPosta(){
  var c=(typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="tappo")?LOB.card:null;
  if(!c)return null;
  if(c.gratis||!(Number(c.stake_eur)>0))return 0;
  return Number(c.stake_eur);
}
function tprtRicercaGratis(gratis){
  if(RTD.game!=="tappo"||RTD.tour||RTD.practice||RTD.ui!=="search")return;
  var el=document.getElementById("arc-body");if(!el)return;
  var pz=document.getElementById("arc-prize");
  if(pz&&gratis)pz.textContent="🎁 GRATIS";
  var bt=el.querySelector("button[onclick=\"rtdLeave()\"]");
  if(bt)bt.textContent=gratis?"✖ ESCI":"✖ ANNULLA (rimborso)";
}
function tprtPosta(m){
  try{ TPRT.fr.contentWindow.postMessage({tp:"giu",m:m},TPRT_ORIGIN); }catch(e){}
}
function tprtSenzaEventi(m){ return !!(m&&m.t==="s"&&!(m.feed&&m.feed.length)); }
function tprtGiu(m){
  if(!TPRT.aperto||!TPRT.fr)return;
  if(TPRT.pronto){tprtPosta(m);return;}
  var c=TPRT.coda,i;
  if(tprtSenzaEventi(m)){
    for(i=c.length-1;i>=0;i--){ if(tprtSenzaEventi(c[i])){c.splice(i,1);break;} }
  }
  c.push(m);
  if(c.length>TPRT_CODA_MAX){
    var k=0;
    for(i=0;i<c.length;i++){ if(c[i]&&c[i].t==="s"){k=i;break;} }
    c.splice(k,1);
    if(!TPRT.codaPiena){
      TPRT.codaPiena=true;
      RTD._rerr="tp:coda piena prima del pronto";
      try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"tappo",msg:"coda piena prima del pronto"}));}catch(e){}
    }
  }
}
function tprtRicevi(m){
  var t=m&&m.t;
  if(t==="s"){
    if(m.g!=="tappo")return false;
    TPRT.liberoS=Number(m.libero_s)||0;TPRT.liberoT=performance.now();
    TPRT.fuori=!!(m.you&&m.you.sg>=0&&m.you.vivo===false&&m.fase==="gioco");
    tprtGiu(m);
    return true;
  }
  if(t==="err"&&/^tp_/.test(String(m.code||""))){tprtGiu(m);return true;}
  if(t==="esce"&&m.game==="tappo"){tprtGiu(m);return false;}
  if(t==="hello_ok"&&TPRT.aperto&&!TPRT.spec&&RTD.game==="tappo"&&RTD.ui==="match"&&!RTD.over)rtdSend({t:"rientra"});
  return false;
}
window.addEventListener("message",function(ev){
  if(ev.origin!==TPRT_ORIGIN)return;
  var d=ev.data;if(!d||typeof d!=="object"||d.tp===undefined)return;
  if(!TPRT.fr||ev.source!==TPRT.fr.contentWindow)return;
  if(d.tp==="su"){
    var o=d.m;
    if(!o||typeof o!=="object"||o.t!=="act"||!TPRT.aperto||TPRT.spec||RTD.spec)return;
    var a=(typeof o.a==="string")?o.a:"";
    if(!Object.prototype.hasOwnProperty.call(TPRT_MOSSE,a))return;
    var ax=tprtAx(o.ax);
    if(!ax.ok)return;
    rtdSend({t:"act",a:a,ax:ax.v,ay:null,power:tprtInt(o.power,null)});
    return;
  }
  if(d.tp==="pronto"){
    TPRT.pronto=true;
    RTD._wsT=performance.now();
    tprtBordi();
    if(TPRT.aperto){
      var c=TPRT.coda;TPRT.coda=[];
      for(var i=0;i<c.length;i++)tprtPosta(c[i]);
      if(TPRT.codaPiena){TPRT.codaPiena=false;if(!TPRT.spec)rtdSend({t:"rientra"});}
      return;
    }
    TPRT.coda=[];
    tprtPosta({t:"pausa"});
    return;
  }
  if(d.tp==="fine_scena"){
    TPRT.fineScena=true;
    if(TPRT.spec&&RTD.spec&&RTD.over&&RTD.over.game==="tappo"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdSpecOver(RTD.over);return;
    }
    if(RTD.over&&RTD.over.game==="tappo"&&RTD.ui==="match"&&RTD.overTmr){
      clearTimeout(RTD.overTmr);RTD.overTmr=null;rtdShowOver(RTD.over);
    }
    return;
  }
  if(d.tp==="esci"){
    if(!TPRT.aperto)return;
    if(TPRT.spec||RTD.spec){rtdSpecExit();return;}
    if(RTD.over&&RTD.over.game==="tappo"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);return;
    }
    if(d.fuori&&TPRT.fuori&&RTD.ui==="match"&&!RTD.practice){
      var cx=null;
      try{cx=(typeof gxCtx==="function")?gxCtx():null;}catch(e1){cx=null;}
      if(cx&&cx.fam==="rtd"&&typeof gxManda==="function"&&typeof gxInfo==="function")gxManda(cx,gxInfo(cx));
      else rtdSend({t:"abbandona"});
      return;
    }
    rtdBack();return;
  }
  if(d.tp==="err"){
    RTD._rerr="tp:"+String(d.msg||"").slice(0,60);
    try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"tappo",msg:String(d.msg||"").slice(0,300)}));}catch(e){}
    return;
  }
});
function tprtEuro(v){var s=lupEuro(v);return (window.GB_LANG==="en")?s.replace(",","."):s;}
function rtdShowOverTappo(m){
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
    h=riga.replace('class="tw-ov-sub"','class="tw-ov-sub" style="margin-bottom:6px;color:#6eb250;"')
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
     +(gratis?"":'<div class="tw-win-prize">+€ '+tprtEuro(premio)+'</div>')
     +((!gratis&&m.premio_in_sospeso)?'<div class="tw-ov-sub">Il premio arriva sul saldo fra poco: stiamo chiudendo i conti</div>':"")
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+tprtEuro(m.pot_eur)+'</div>');
  }else{
    TWS.play("lose");
    h='<div style="font-size:44px;">💀</div><div class="tw-lose-t">SCONFITTA</div>'
     +riga
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+tprtEuro(m.pot_eur)+'</div>');
  }
  h+=tasti;
  rtdOv(h,true);
  rtdShowLobby(true);
  if(typeof loadBalance==="function")loadBalance();
  if(m.premio_in_sospeso&&typeof loadBalance==="function"){setTimeout(loadBalance,8000);setTimeout(loadBalance,25000);}
}
