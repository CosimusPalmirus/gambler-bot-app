var BRRT={wrap:null,fr:null,pronto:false,coda:[],aperto:false,nascosto:false,firma:"",start:null,fineScena:false,loads:0,codaPiena:false,tgEv:false,spec:false,liberoS:0,liberoT:0};
var BRRT_VER="202611186143";
function brrtUrl(){return "briscola.html?guscio=1&v="+BRRT_VER+"&lang="+((window.GB_LANG==="en")?"en":"it");}
var BRRT_URL=brrtUrl();
var BRRT_ORIGIN=location.origin;
var BRRT_CODA_MAX=2000;
var BRRT_MOSSE={gioca:1};
var BRRT_HO_BLOCCATO=false;
function brrtBlocca(){
  try{ if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();BRRT_HO_BLOCCATO=true;} }catch(e){}
}
function brrtSblocca(){
  try{ if(BRRT_HO_BLOCCATO&&typeof bx2Sblocca==="function")bx2Sblocca(); }catch(e){}
  BRRT_HO_BLOCCATO=false;
}
function brrtInt(x,d){
  if(typeof x==="number"&&isFinite(x)&&Math.floor(x)===x&&x>=-2147483648&&x<2147483648)return x;
  return d;
}
function brrtAx(x){
  if(x===undefined||x===null)return {ok:true,v:null};
  if(typeof x==="number"&&brrtInt(x,null)!==null)return {ok:true,v:x};
  return {ok:false};
}
function brrtAltezza(){
  try{
    if(!BRRT.wrap)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){BRRT.wrap.style.height=Math.round(h)+"px";BRRT.wrap.style.bottom="auto";}
    else{BRRT.wrap.style.height="100%";BRRT.wrap.style.bottom="0px";}
  }catch(e){}
}
function brrtBordi(){
  try{
    if(!BRRT.fr||!BRRT.pronto)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var sa=(tg2&&tg2.safeAreaInset)||{}, ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){
      var t=(Number(a)||0)+(Number(b)||0), e=(typeof luprtEnv==="function")?luprtEnv(lato):0;
      var v=Math.max(t,e);
      if(!isFinite(v)||v<0)v=0; if(v>200)v=200;
      return Math.round(v);
    }
    brrtPosta({t:"bordi",top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom),
               left:q("left",sa.left,ca.left),right:q("right",sa.right,ca.right)});
  }catch(e){}
}
function brrtTelegram(){
  if(BRRT.tgEv)return;BRRT.tgEv=true;
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2&&typeof tg2.onEvent==="function"){
      tg2.onEvent("viewportChanged",function(){brrtAltezza();brrtBordi();});
      tg2.onEvent("safeAreaChanged",brrtBordi);
      tg2.onEvent("contentSafeAreaChanged",brrtBordi);
      tg2.onEvent("fullscreenChanged",brrtBordi);
    }
  }catch(e){}
  try{window.addEventListener("orientationchange",function(){setTimeout(brrtBordi,250);});}catch(e2){}
}
function brrtMonta(){
  if(!BRRT.wrap){
    var w=document.createElement("div");
    w.id="brrt-wrap";
    w.style.cssText="position:fixed;inset:0;z-index:9100;display:none;background:#06140f;touch-action:none;overscroll-behavior:none;";
    w.innerHTML="<iframe id='brrt-fr' title='BRISCOLA' allow='autoplay' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w);
    BRRT.wrap=w;BRRT.fr=w.querySelector("#brrt-fr");
    BRRT.fr.addEventListener("load",function(){ if(BRRT.fr.getAttribute("src")===BRRT_URL)BRRT.loads++; });
    brrtTelegram();
  }
  if(BRRT.fr.getAttribute("src")!==BRRT_URL){
    BRRT.pronto=false;BRRT.coda=[];BRRT.codaPiena=false;
    BRRT.fr.setAttribute("src",BRRT_URL);
  }
}
function brrtPrecarica(){
  if(RTD.game!=="briscola")return;
  brrtMonta();
}
function brrtCssEsci(){
  if(document.getElementById("brrt-css"))return;
  try{
    var st=document.createElement("style");st.id="brrt-css";
    st.textContent="body.brrt-on #gx-esci.gx-dx,body.brrt-on #eb-esci.eb-dx{top:calc(4px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}";
    document.head.appendChild(st);
  }catch(e){}
}
function brrtASchermo(){
  BRRT.wrap.style.display="block";
  brrtCssEsci();
  try{document.body.classList.add("brrt-on");}catch(e0){}
  brrtBlocca();
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){ if(typeof tg2.expand==="function")tg2.expand(); if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes(); }
  }catch(e){}
  brrtAltezza();
}
function brrtViaDalloSchermo(){
  brrtSblocca();
  try{document.body.classList.remove("brrt-on");}catch(e0){}
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2&&typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();}catch(e){}
  BRRT.wrap.style.display="none";
}
var BRRT_TIFO="",BRRT_TIFO_AGG=false;
function brrtTifo(){
  try{
    if(!BRRT.aperto||BRRT.spec||RTD.spec||RTD.ui!=="match"||RTD.game!=="briscola")return;
    var ch=String(trnChatCh()||"");if(ch.indexOf("r:")!==0)return;
    var T=TRN.chat||[],L=T.slice(-2);
    var k=ch+"|"+T.length+"|"+(L.length?String(L[L.length-1].x||""):"");
    if(k===BRRT_TIFO)return;BRRT_TIFO=k;
    if(!L.length)return;
    brrtGiu({t:"chat",righe:L.map(function(c){return {n:String(c.n||"?").slice(0,24),x:String(c.x||"").slice(0,140),g:c.g?1:0};})});
  }catch(e){}
}
function brrtTifoAggancia(){
  if(BRRT_TIFO_AGG||typeof trnTickerPaint!=="function")return;
  BRRT_TIFO_AGG=true;
  var v=trnTickerPaint;
  trnTickerPaint=function(){var r=v.apply(this,arguments);brrtTifo();return r;};
}
function rtdShowBriscolaRT(m,spec){
  RTD.ui="match";rtdOvClose();
  if(typeof BXRT!=="undefined"&&BXRT.aperto)rtdChiudiBoxeRT();
  if(typeof LUPRT!=="undefined"&&LUPRT.aperto&&typeof rtdChiudiLupusRT==="function")rtdChiudiLupusRT(true);
  if(typeof LCRT!=="undefined"&&LCRT.aperto&&typeof rtdChiudiLastcallRT==="function")rtdChiudiLastcallRT(true);
  if(typeof BJRT!=="undefined"&&BJRT.aperto&&typeof rtdChiudiBjRT==="function")rtdChiudiBjRT(true);
  if(typeof PKRT!=="undefined"&&PKRT.aperto&&typeof rtdChiudiPkRT==="function")rtdChiudiPkRT(true);
  if(typeof DPRT!=="undefined"&&DPRT.aperto&&typeof rtdChiudiDeadpeakRT==="function")rtdChiudiDeadpeakRT(true);
  if(typeof KJRT!=="undefined"&&KJRT.aperto&&typeof rtdChiudiKaijuRT==="function")rtdChiudiKaijuRT(true);
  if(typeof SMRT!=="undefined"&&SMRT.aperto&&typeof rtdChiudiSettemezzoRT==="function")rtdChiudiSettemezzoRT(true);
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
  brrtMonta();
  var eraNascosto=BRRT.aperto&&BRRT.nascosto;
  var eraChiuso=!BRRT.aperto;
  if(eraChiuso)BRRT.coda=[];
  if(m){
    var firma=String((m.map&&m.map.firma!=null)?m.map.firma:"");
    if(BRRT.aperto&&BRRT.firma!==firma){BRRT.coda=[];BRRT.fineScena=false;}
    if(!BRRT.aperto)BRRT.fineScena=false;
    BRRT.firma=firma;BRRT.start=m;
    BRRT.spec=!!spec;
    BRRT_TIFO="";brrtTifoAggancia();
  }
  BRRT.aperto=true;BRRT.nascosto=false;
  brrtASchermo();
  if(eraNascosto||eraChiuso)brrtGiu({t:"riprendi"});
  if(!m)rtdSend({t:"rientra"});
  if(m&&spec){
    var mm={},k;for(k in m)mm[k]=m[k];
    mm.t="start";mm.spec=true;mm.you=null;mm.tour=false;
    brrtGiu(mm);
    return;
  }
  if(m)brrtGiu(m);
}
function rtdChiudiBriscolaRT(forza){
  if(!BRRT.wrap||!BRRT.fr)return;
  var visibile=(BRRT.wrap.style.display==="block");
  if(!BRRT.aperto&&!visibile&&!forza)return;
  brrtViaDalloSchermo();
  if(!forza&&BRRT.aperto&&RTD.ui==="match"){
    BRRT.nascosto=true;
    brrtGiu({t:"pausa"});
    return;
  }
  BRRT.aperto=false;BRRT.nascosto=false;BRRT.pronto=false;BRRT.coda=[];BRRT.codaPiena=false;
  BRRT.firma="";BRRT.start=null;BRRT.fineScena=false;
  BRRT.spec=false;
  if(BRRT.fr.getAttribute("src")!=="about:blank")BRRT.fr.setAttribute("src","about:blank");
}
function brrtTettoFine(){
  var r=0;
  try{ r=Math.max(0,(Number(BRRT.liberoS)||0)*1000-(performance.now()-(Number(BRRT.liberoT)||0))); }catch(e){ r=0; }
  if(!isFinite(r))r=0;
  return Math.max(12000,Math.min(30000,Math.round(r+10000)));
}
function brrtSpecOver(m){
  RTD.over=m;RTD.specRid=null;
  brrtGiu(m);
  if(BRRT.fineScena||BRRT.nascosto){rtdSpecOver(m);return;}
  if(RTD.overTmr)clearTimeout(RTD.overTmr);
  RTD.overTmr=setTimeout(function(){RTD.overTmr=null;if(RTD.over===m&&RTD.ui==="match")rtdSpecOver(m);},brrtTettoFine());
}
function brrtRicercaPosta(){
  var c=(typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="briscola")?LOB.card:null;
  if(!c)return null;
  if(c.gratis||!(Number(c.stake_eur)>0))return 0;
  return Number(c.stake_eur);
}
function brrtRicercaGratis(gratis){
  if(RTD.game!=="briscola"||RTD.tour||RTD.practice||RTD.ui!=="search")return;
  var el=document.getElementById("arc-body");if(!el)return;
  var pz=document.getElementById("arc-prize");
  if(pz&&gratis)pz.textContent="🎁 GRATIS";
  var bt=el.querySelector("button[onclick=\"rtdLeave()\"]");
  if(bt)bt.textContent=gratis?"✖ ESCI":"✖ ANNULLA (rimborso)";
}
function brrtPosta(m){
  try{ BRRT.fr.contentWindow.postMessage({br:"giu",m:m},BRRT_ORIGIN); }catch(e){}
}
function brrtSenzaEventi(m){ return !!(m&&m.t==="s"&&!(m.feed&&m.feed.length)); }
function brrtGiu(m){
  if(!BRRT.aperto||!BRRT.fr)return;
  if(BRRT.pronto){brrtPosta(m);return;}
  var c=BRRT.coda,i;
  if(brrtSenzaEventi(m)){
    for(i=c.length-1;i>=0;i--){ if(brrtSenzaEventi(c[i])){c.splice(i,1);break;} }
  }
  c.push(m);
  if(c.length>BRRT_CODA_MAX){
    var k=0;
    for(i=0;i<c.length;i++){ if(c[i]&&c[i].t==="s"){k=i;break;} }
    c.splice(k,1);
    if(!BRRT.codaPiena){
      BRRT.codaPiena=true;
      RTD._rerr="br:coda piena prima del pronto";
      try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"briscola",msg:"coda piena prima del pronto"}));}catch(e){}
    }
  }
}
function brrtRicevi(m){
  var t=m&&m.t;
  if(t==="s"){
    if(m.g!=="briscola")return false;
    BRRT.liberoS=Number(m.libero_s)||0;BRRT.liberoT=performance.now();
    BRRT.fuori=!!(m.you&&m.you.sg>=0&&m.you.vivo===false&&m.fase==="gioco");
    brrtGiu(m);
    return true;
  }
  if(t==="err"&&/^br_/.test(String(m.code||""))){brrtGiu(m);return true;}
  if(t==="esce"&&m.game==="briscola"){brrtGiu(m);return false;}
  if(t==="hello_ok"&&BRRT.aperto&&!BRRT.spec&&RTD.game==="briscola"&&RTD.ui==="match"&&!RTD.over)rtdSend({t:"rientra"});
  return false;
}
window.addEventListener("message",function(ev){
  if(ev.origin!==BRRT_ORIGIN)return;
  var d=ev.data;if(!d||typeof d!=="object"||d.br===undefined)return;
  if(!BRRT.fr||ev.source!==BRRT.fr.contentWindow)return;
  if(d.br==="su"){
    var o=d.m;
    if(!o||typeof o!=="object"||o.t!=="act"||!BRRT.aperto||BRRT.spec||RTD.spec)return;
    var a=(typeof o.a==="string")?o.a:"";
    if(!Object.prototype.hasOwnProperty.call(BRRT_MOSSE,a))return;
    var ax=brrtAx(o.ax);
    if(!ax.ok)return;
    rtdSend({t:"act",a:a,ax:ax.v,ay:null,power:brrtInt(o.power,null)});
    return;
  }
  if(d.br==="pronto"){
    BRRT.pronto=true;
    RTD._wsT=performance.now();
    brrtBordi();
    if(BRRT.aperto){
      var c=BRRT.coda;BRRT.coda=[];
      for(var i=0;i<c.length;i++)brrtPosta(c[i]);
      if(BRRT.codaPiena){BRRT.codaPiena=false;if(!BRRT.spec)rtdSend({t:"rientra"});}
      return;
    }
    BRRT.coda=[];
    brrtPosta({t:"pausa"});
    return;
  }
  if(d.br==="fine_scena"){
    BRRT.fineScena=true;
    if(BRRT.spec&&RTD.spec&&RTD.over&&RTD.over.game==="briscola"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdSpecOver(RTD.over);return;
    }
    if(RTD.over&&RTD.over.game==="briscola"&&RTD.ui==="match"&&RTD.overTmr){
      clearTimeout(RTD.overTmr);RTD.overTmr=null;rtdShowOver(RTD.over);
    }
    return;
  }
  if(d.br==="esci"){
    if(!BRRT.aperto)return;
    if(BRRT.spec||RTD.spec){rtdSpecExit();return;}
    if(RTD.over&&RTD.over.game==="briscola"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);return;
    }
    if(d.fuori&&BRRT.fuori&&RTD.ui==="match"&&!RTD.practice){
      var cx=null;
      try{cx=(typeof gxCtx==="function")?gxCtx():null;}catch(e1){cx=null;}
      if(cx&&cx.fam==="rtd"&&typeof gxManda==="function"&&typeof gxInfo==="function")gxManda(cx,gxInfo(cx));
      else rtdSend({t:"abbandona"});
      return;
    }
    rtdBack();return;
  }
  if(d.br==="err"){
    RTD._rerr="br:"+String(d.msg||"").slice(0,60);
    try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"briscola",msg:String(d.msg||"").slice(0,300)}));}catch(e){}
    return;
  }
});
function brrtEuro(v){var s=lupEuro(v);return (window.GB_LANG==="en")?s.replace(",","."):s;}
function rtdShowOverBriscola(m){
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
    h=riga.replace('class="tw-ov-sub"','class="tw-ov-sub" style="margin-bottom:6px;color:#ff26ff;"')
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
     +(gratis?"":'<div class="tw-win-prize">+€ '+brrtEuro(premio)+'</div>')
     +((!gratis&&m.premio_in_sospeso)?'<div class="tw-ov-sub">Il premio arriva sul saldo fra poco: stiamo chiudendo i conti</div>':"")
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+brrtEuro(m.pot_eur)+'</div>');
  }else{
    TWS.play("lose");
    h='<div style="font-size:44px;">💀</div><div class="tw-lose-t">SCONFITTA</div>'
     +riga
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+brrtEuro(m.pot_eur)+'</div>');
  }
  h+=tasti;
  rtdOv(h,true);
  rtdShowLobby(true);
  if(typeof loadBalance==="function")loadBalance();
  if(m.premio_in_sospeso&&typeof loadBalance==="function"){setTimeout(loadBalance,8000);setTimeout(loadBalance,25000);}
}
