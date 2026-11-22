var GEORT={wrap:null,fr:null,pronto:false,coda:[],aperto:false,nascosto:false,firma:"",start:null,fineScena:false,loads:0,codaPiena:false,tgEv:false,spec:false,liberoS:0,liberoT:0};
var GEORT_VER="20261120bbbca7";
function geortUrl(){return "geo.html?guscio=1&v="+GEORT_VER+"&lang="+((window.GB_LANG==="en")?"en":"it");}
var GEORT_URL=geortUrl();
var GEORT_ORIGIN=location.origin;
var GEORT_CODA_MAX=2000;
var GEORT_MOSSE={indovina:1,mappa:1,carico:1,pin:1};
var GEORT_HO_BLOCCATO=false;
function geortBlocca(){
  try{ if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();GEORT_HO_BLOCCATO=true;} }catch(e){}
}
function geortSblocca(){
  try{ if(GEORT_HO_BLOCCATO&&typeof bx2Sblocca==="function")bx2Sblocca(); }catch(e){}
  GEORT_HO_BLOCCATO=false;
}
function geortInt(x,d){
  if(typeof x==="number"&&isFinite(x)&&Math.floor(x)===x&&x>=-2147483648&&x<2147483648)return x;
  return d;
}
function geortAx(x){
  if(x===undefined||x===null)return {ok:true,v:null};
  if(typeof x==="number"&&geortInt(x,null)!==null)return {ok:true,v:x};
  return {ok:false};
}
function geortAltezza(){
  try{
    if(!GEORT.wrap)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){GEORT.wrap.style.height=Math.round(h)+"px";GEORT.wrap.style.bottom="auto";}
    else{GEORT.wrap.style.height="100%";GEORT.wrap.style.bottom="0px";}
  }catch(e){}
}
function geortBordi(){
  try{
    if(!GEORT.fr||!GEORT.pronto)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var sa=(tg2&&tg2.safeAreaInset)||{}, ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){
      var t=(Number(a)||0)+(Number(b)||0), e=(typeof luprtEnv==="function")?luprtEnv(lato):0;
      var v=Math.max(t,e);
      if(!isFinite(v)||v<0)v=0; if(v>200)v=200;
      return Math.round(v);
    }
    geortPosta({t:"bordi",top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom),
               left:q("left",sa.left,ca.left),right:q("right",sa.right,ca.right)});
  }catch(e){}
}
function geortTelegram(){
  if(GEORT.tgEv)return;GEORT.tgEv=true;
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2&&typeof tg2.onEvent==="function"){
      tg2.onEvent("viewportChanged",function(){geortAltezza();geortBordi();});
      tg2.onEvent("safeAreaChanged",geortBordi);
      tg2.onEvent("contentSafeAreaChanged",geortBordi);
      tg2.onEvent("fullscreenChanged",geortBordi);
    }
  }catch(e){}
  try{window.addEventListener("orientationchange",function(){setTimeout(geortBordi,250);});}catch(e2){}
}
function geortMonta(){
  if(!GEORT.wrap){
    var w=document.createElement("div");
    w.id="geort-wrap";
    w.style.cssText="position:fixed;inset:0;z-index:9100;display:none;background:#06080f;touch-action:none;overscroll-behavior:none;";
    w.innerHTML="<iframe id='geort-fr' title='GEO BET' allow='autoplay' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w);
    GEORT.wrap=w;GEORT.fr=w.querySelector("#geort-fr");
    GEORT.fr.addEventListener("load",function(){ if(GEORT.fr.getAttribute("src")===GEORT_URL)GEORT.loads++; });
    geortTelegram();
  }
  if(GEORT.fr.getAttribute("src")!==GEORT_URL){
    GEORT.pronto=false;GEORT.coda=[];GEORT.codaPiena=false;
    GEORT.fr.setAttribute("src",GEORT_URL);
  }
}
function geortPrecarica(){
  if(RTD.game!=="geo")return;
  geortMonta();
}
function geortCssEsci(){
  if(document.getElementById("geort-css"))return;
  try{
    var st=document.createElement("style");st.id="geort-css";
    st.textContent="body.geort-on #gx-esci.gx-dx,body.geort-on #eb-esci.eb-dx{top:calc(4px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}";
    document.head.appendChild(st);
  }catch(e){}
}
function geortASchermo(){
  GEORT.wrap.style.display="block";
  geortCssEsci();
  try{document.body.classList.add("geort-on");}catch(e0){}
  geortBlocca();
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){ if(typeof tg2.expand==="function")tg2.expand(); if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes(); }
  }catch(e){}
  geortAltezza();
}
function geortViaDalloSchermo(){
  geortSblocca();
  try{document.body.classList.remove("geort-on");}catch(e0){}
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2&&typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();}catch(e){}
  GEORT.wrap.style.display="none";
}
var GEORT_TIFO="",GEORT_TIFO_AGG=false;
function geortTifo(){
  try{
    if(!GEORT.aperto||GEORT.spec||RTD.spec||RTD.ui!=="match"||RTD.game!=="geo")return;
    var ch=String(trnChatCh()||"");if(ch.indexOf("r:")!==0)return;
    var T=TRN.chat||[],L=T.slice(-2);
    var k=ch+"|"+T.length+"|"+(L.length?String(L[L.length-1].x||""):"");
    if(k===GEORT_TIFO)return;GEORT_TIFO=k;
    if(!L.length)return;
    geortGiu({t:"chat",righe:L.map(function(c){return {n:String(c.n||"?").slice(0,24),x:String(c.x||"").slice(0,140),g:c.g?1:0};})});
  }catch(e){}
}
function geortTifoAggancia(){
  if(GEORT_TIFO_AGG||typeof trnTickerPaint!=="function")return;
  GEORT_TIFO_AGG=true;
  var v=trnTickerPaint;
  trnTickerPaint=function(){var r=v.apply(this,arguments);geortTifo();return r;};
}
function rtdShowGeoRT(m,spec){
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
  if(typeof TPRT!=="undefined"&&TPRT.aperto&&typeof rtdChiudiTappoRT==="function")rtdChiudiTappoRT(true);
  if(typeof SBRT!=="undefined"&&SBRT.aperto&&typeof rtdChiudiSbancaRT==="function")rtdChiudiSbancaRT(true);
  if(typeof ABRT!=="undefined"&&ABRT.aperto&&typeof rtdChiudiAbissoRT==="function")rtdChiudiAbissoRT(true);
  if(typeof HPRT!=="undefined"&&HPRT.aperto&&typeof rtdChiudiHopRT==="function")rtdChiudiHopRT(true);
  if(typeof DMRT!=="undefined"&&DMRT.aperto&&typeof rtdChiudiDeadmoneyRT==="function")rtdChiudiDeadmoneyRT(true);
  if(typeof GSRT!=="undefined"&&GSRT.aperto&&typeof rtdChiudiSmashRT==="function")rtdChiudiSmashRT(true);
  RTD.ctx=null;RTD.cv=null;
  if(typeof rtdStopRaf==="function")rtdStopRaf();
  RTD._rafT=0;RTD._hintOff=1;
  try{GBMusic.stop();}catch(e){}
  geortMonta();
  var eraNascosto=GEORT.aperto&&GEORT.nascosto;
  var eraChiuso=!GEORT.aperto;
  if(eraChiuso)GEORT.coda=[];
  if(m){
    var firma=String((m.map&&m.map.firma!=null)?m.map.firma:"");
    if(GEORT.aperto&&GEORT.firma!==firma){GEORT.coda=[];GEORT.fineScena=false;}
    if(!GEORT.aperto)GEORT.fineScena=false;
    GEORT.firma=firma;GEORT.start=m;
    GEORT.spec=!!spec;
    GEORT_TIFO="";geortTifoAggancia();
  }
  GEORT.aperto=true;GEORT.nascosto=false;
  geortTastoAnnulla(false);
  if(m&&!spec){
    GEORT.finita=false;
    if(m.practice)GEORT.ultimo={modo:"allena"};
    else if(m.tour)GEORT.ultimo={modo:"torneo"};
    else if(!(Number(m.pot_eur)>0))GEORT.ultimo={modo:"gratis"};
    else if(!(GEORT.ultimo&&GEORT.ultimo.modo==="soldi"&&GEORT.ultimo.daCoda))GEORT.ultimo={modo:"amici"};
  }
  geortASchermo();
  if(eraNascosto||eraChiuso)geortGiu({t:"riprendi"});
  if(!m)rtdSend({t:"rientra"});
  if(m&&spec){
    var mm={},k;for(k in m)mm[k]=m[k];
    mm.t="start";mm.spec=true;mm.you=null;mm.tour=false;
    geortGiu(mm);
    return;
  }
  if(m)geortGiu(m);
}
function rtdChiudiGeoRT(forza){
  if(!GEORT.wrap||!GEORT.fr)return;
  var visibile=(GEORT.wrap.style.display==="block");
  if(!GEORT.aperto&&!visibile&&!forza)return;
  geortTastoAnnulla(false);geortConfChiudi();
  geortViaDalloSchermo();
  if(!forza&&GEORT.aperto&&RTD.ui==="match"){
    GEORT.nascosto=true;
    geortGiu({t:"pausa"});
    return;
  }
  GEORT.aperto=false;GEORT.nascosto=false;GEORT.pronto=false;GEORT.coda=[];GEORT.codaPiena=false;
  GEORT.firma="";GEORT.start=null;GEORT.fineScena=false;
  GEORT.spec=false;
  if(GEORT.fr.getAttribute("src")!=="about:blank")GEORT.fr.setAttribute("src","about:blank");
}
function geortTettoFine(){
  var r=0;
  try{ r=Math.max(0,(Number(GEORT.liberoS)||0)*1000-(performance.now()-(Number(GEORT.liberoT)||0))); }catch(e){ r=0; }
  if(!isFinite(r))r=0;
  return Math.max(12000,Math.min(30000,Math.round(r+10000)));
}
function geortSpecOver(m){
  RTD.over=m;RTD.specRid=null;
  geortGiu(m);
  if(GEORT.fineScena||GEORT.nascosto){rtdSpecOver(m);return;}
  if(RTD.overTmr)clearTimeout(RTD.overTmr);
  RTD.overTmr=setTimeout(function(){RTD.overTmr=null;if(RTD.over===m&&RTD.ui==="match")rtdSpecOver(m);},geortTettoFine());
}
function geortRicercaPosta(){
  var c=(typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="geo")?LOB.card:null;
  if(!c)return null;
  if(c.gratis||!(Number(c.stake_eur)>0))return 0;
  return Number(c.stake_eur);
}
function geortRicercaGratis(gratis){
  if(RTD.game!=="geo"||RTD.tour||RTD.practice||RTD.ui!=="search")return;
  var el=document.getElementById("arc-body");if(!el)return;
  var pz=document.getElementById("arc-prize");
  if(pz&&gratis)pz.textContent="🎁 GRATIS";
  var bt=el.querySelector("button[onclick=\"rtdLeave()\"]");
  if(bt)bt.textContent=gratis?"✖ ESCI":"✖ ANNULLA (rimborso)";
}
function geortPosta(m){
  try{ GEORT.fr.contentWindow.postMessage({geo:"giu",m:m},GEORT_ORIGIN); }catch(e){}
}
function geortSenzaEventi(m){ return !!(m&&m.t==="s"&&!(m.feed&&m.feed.length)); }
function geortGiu(m){
  if(!GEORT.aperto||!GEORT.fr)return;
  if(GEORT.pronto){geortPosta(m);return;}
  var c=GEORT.coda,i;
  if(geortSenzaEventi(m)){
    for(i=c.length-1;i>=0;i--){ if(geortSenzaEventi(c[i])){c.splice(i,1);break;} }
  }
  c.push(m);
  if(c.length>GEORT_CODA_MAX){
    var k=0;
    for(i=0;i<c.length;i++){ if(c[i]&&c[i].t==="s"){k=i;break;} }
    c.splice(k,1);
    if(!GEORT.codaPiena){
      GEORT.codaPiena=true;
      RTD._rerr="geo:coda piena prima del pronto";
      try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"geo",msg:"coda piena prima del pronto"}));}catch(e){}
    }
  }
}
function geortRicevi(m){
  var t=m&&m.t;
  if(t==="s"){
    if(m.g!=="geo")return false;
    GEORT.liberoS=Number(m.libero_s)||0;GEORT.liberoT=performance.now();
    GEORT.fuori=!!(m.you&&m.you.sg>=0&&m.you.vivo===false&&m.fase==="gioco");
    geortGiu(m);
    return true;
  }
  if(t==="err"&&/^geo_/.test(String(m.code||""))){geortGiu(m);return true;}
  if(t==="esce"&&m.game==="geo"){geortGiu(m);return false;}
  if(t==="hello_ok"&&GEORT.aperto&&!GEORT.spec&&RTD.game==="geo"&&RTD.ui==="match"&&!RTD.over)rtdSend({t:"rientra"});
  return false;
}
window.addEventListener("message",function(ev){
  if(ev.origin!==GEORT_ORIGIN)return;
  var d=ev.data;if(!d||typeof d!=="object"||d.geo===undefined)return;
  if(!GEORT.fr||ev.source!==GEORT.fr.contentWindow)return;
  if(d.geo==="su"){
    var o=d.m;
    if(!o||typeof o!=="object"||o.t!=="act"||!GEORT.aperto||GEORT.spec||RTD.spec)return;
    var a=(typeof o.a==="string")?o.a:"";
    if(!Object.prototype.hasOwnProperty.call(GEORT_MOSSE,a))return;
    var ax=geortAx(o.ax);
    if(!ax.ok)return;
    var ay=geortAx(o.ay);
    if(!ay.ok)return;
    rtdSend({t:"act",a:a,ax:ax.v,ay:ay.v,power:geortInt(o.power,null)});
    return;
  }
  if(d.geo==="pronto"){
    GEORT.pronto=true;
    RTD._wsT=performance.now();
    geortBordi();
    if(GEORT.aperto){
      var c=GEORT.coda;GEORT.coda=[];
      for(var i=0;i<c.length;i++)geortPosta(c[i]);
      if(GEORT.codaPiena){GEORT.codaPiena=false;if(!GEORT.spec)rtdSend({t:"rientra"});}
      return;
    }
    GEORT.coda=[];
    geortPosta({t:"pausa"});
    return;
  }
  if(d.geo==="fine_scena"){
    GEORT.fineScena=true;
    if(GEORT.spec&&RTD.spec&&RTD.over&&RTD.over.game==="geo"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdSpecOver(RTD.over);return;
    }
    if(RTD.over&&RTD.over.game==="geo"&&RTD.ui==="match"&&RTD.overTmr){
      clearTimeout(RTD.overTmr);RTD.overTmr=null;rtdShowOver(RTD.over);
    }
    return;
  }
  if(d.geo==="esci"){
    if(!GEORT.aperto)return;
    if(GEORT.spec||RTD.spec){rtdSpecExit();return;}
    if(RTD.ui==="search"){geortAnnulla();return;}
    if(RTD.over&&RTD.over.game==="geo"&&(RTD.ui==="match"||RTD.ui==="over")){geortFineEsci();return;}
    rtdBack();return;
  }
  if(d.geo==="rigioca"){
    if(!GEORT.aperto||GEORT.spec||RTD.spec)return;
    geortRigioca();
    return;
  }
  if(d.geo==="err"){
    RTD._rerr="geo:"+String(d.msg||"").slice(0,60);
    try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"geo",msg:String(d.msg||"").slice(0,300)}));}catch(e){}
    return;
  }
});
function geortEuro(v){var s=lupEuro(v);return (window.GB_LANG==="en")?s.replace(",","."):s;}
function rtdShowOverGeo(m){
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
    h=riga.replace('class="tw-ov-sub"','class="tw-ov-sub" style="margin-bottom:6px;color:#f3c262;"')
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
     +(gratis?"":'<div class="tw-win-prize">+€ '+geortEuro(premio)+'</div>')
     +((!gratis&&m.premio_in_sospeso)?'<div class="tw-ov-sub">Il premio arriva sul saldo fra poco: stiamo chiudendo i conti</div>':"")
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+geortEuro(m.pot_eur)+'</div>');
  }else{
    TWS.play("lose");
    h='<div style="font-size:44px;">💀</div><div class="tw-lose-t">SCONFITTA</div>'
     +riga
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+geortEuro(m.pot_eur)+'</div>');
  }
  h+=tasti;
  rtdOv(h,true);
  rtdShowLobby(true);
  if(typeof loadBalance==="function")loadBalance();
  if(m.premio_in_sospeso&&typeof loadBalance==="function"){setTimeout(loadBalance,8000);setTimeout(loadBalance,25000);}
}
function geortEn(){return window.GB_LANG==="en";}
function geortEur(v){
  v=Math.round((Number(v)||0)*100)/100;
  var s=(Math.round(v)===v)?String(v):v.toFixed(2);
  return geortEn()?"€"+s:s.replace(".",",")+" €";
}
function geortCoda(m){
  if(RTD.game!=="geo"||RTD.spec||!m||m.game!=="geo")return;
  if(RTD.ui==="match"&&!RTD.over)return;
  geortMonta();
  var eraChiuso=!GEORT.aperto;
  if(eraChiuso){GEORT.coda=[];GEORT.firma="";GEORT.start=null;GEORT.fineScena=false;GEORT.spec=false;}
  GEORT.aperto=true;GEORT.nascosto=false;GEORT.finita=false;
  if(GEORT.wrap.style.display!=="block")geortASchermo();
  if(eraChiuso&&GEORT.pronto)geortGiu({t:"riprendi"});
  geortGiu(m);
  geortTastoAnnulla(true);
}
function geortTastoAnnulla(on){
  var b=document.getElementById("geort-annulla");
  if(!on){if(b)b.style.display="none";return;}
  if(!b){
    b=document.createElement("button");b.id="geort-annulla";b.type="button";
    b.onclick=function(ev){try{ev.preventDefault();}catch(e){}geortAnnulla();};
    document.body.appendChild(b);
  }
  var soldi=!RTD.practice&&!RTD.tour&&(parseFloat(RTD.tier)>0)&&!(typeof geortRicercaPosta==="function"&&geortRicercaPosta()===0);
  b.innerHTML='<b>✕</b><span>'+(soldi?(geortEn()?"CANCEL":"ANNULLA"):(geortEn()?"EXIT":"ESCI"))+'</span>';
  b.style.display="flex";
}
function geortAnnulla(){
  geortTastoAnnulla(false);
  if(RTD.tour){rtdChiudiGeoRT(true);rtdBack();return;}
  if(RTD.practice){
    rtdLeave();rtdStopRaf();
    RTD.ui="";RTD.practice=false;RTD.pendingTicket=null;
    rtdChiudiGeoRT(true);rtdOvClose();
    if(typeof TRN!=="undefined"&&TRN.trainFrom){trnTrainBack();return;}
    rtdShowLobby();return;
  }
  rtdChiudiGeoRT(true);
  rtdLeave();
}
function geortOver(m){
  geortGiu(m);
  GEORT.finita=true;
  if(typeof loadBalance==="function"){
    loadBalance();
    if(m.premio_in_sospeso||m.rimborso_in_sospeso){setTimeout(loadBalance,8000);setTimeout(loadBalance,25000);}
  }
  if(!GEORT.aperto||GEORT.nascosto||!GEORT.pronto||RTD.ui!=="match"){rtdShowOver(m);return;}
}
function geortFineEsci(){
  if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
  rtdChiudiGeoRT(true);
  if(RTD.tour){rtdTourDone();return;}
  if(RTD.practice&&typeof TRN!=="undefined"&&TRN.trainFrom){RTD.ui="";RTD.practice=false;rtdOvClose();trnTrainBack();return;}
  RTD.practice=false;
  rtdAgain();
}
function geortRigioca(){
  var u=GEORT.ultimo||{modo:"amici"};
  if(u.modo==="allena"){geortRicarica();RTD.over=null;RTD.ui="";practiceStart("geo");return;}
  if(u.modo==="soldi"&&parseFloat(u.tier)>0){geortConfApri(u.tier);return;}
  geortFineEsci();
  if(u.modo==="torneo")return;
  if(typeof geoSceltaModo==="function")geoSceltaModo(u.modo==="gratis"?"gratis":"amici");
}
function geortRicarica(){
  if(!GEORT.fr)return;
  GEORT.pronto=false;GEORT.coda=[];GEORT.codaPiena=false;GEORT.firma="";GEORT.start=null;GEORT.fineScena=false;GEORT.finita=false;
  try{GEORT.fr.setAttribute("src","about:blank");}catch(e){}
  setTimeout(function(){try{if(GEORT.aperto&&GEORT.fr.getAttribute("src")==="about:blank")GEORT.fr.setAttribute("src",GEORT_URL);}catch(e){}},30);
}
function geortSaldo(){try{return (typeof capEur==="function")?capEur():0;}catch(e){return 0;}}
function geortConfChiudi(){var c=document.getElementById("geort-conf");if(c)c.classList.remove("on");}
function geortConfApri(tier){
  var posta=parseFloat(tier)||0,saldo=geortSaldo(),basta=saldo>=posta-1e-9,en=geortEn();
  var c=document.getElementById("geort-conf");
  if(!c){c=document.createElement("div");c.id="geort-conf";document.body.appendChild(c);}
  c.innerHTML='<div class="gc-box">'
    +'<div class="gc-k">'+(en?"PLAY AGAIN":"RIGIOCA")+'</div>'
    +'<div class="gc-t">'+(en?"Same table, stake ":"Stessa coda, posta ")+'<b>'+geortEur(posta)+'</b></div>'
    +'<div class="gc-s'+(basta?'':' no')+'">'+(en?"Balance ":"Saldo ")+'<b>'+geortEur(saldo)+'</b>'
    +(basta?'':' · '+(en?"not enough for this stake":"non basta per questa posta"))+'</div>'
    +'<div class="gc-b">'
    +'<button type="button" class="gc-no" onclick="geortConfChiudi()">'+(en?"Not now":"Non ora")+'</button>'
    +(basta?'<button type="button" class="gc-si" onclick="geortConfSi(\''+String(tier).replace(/[^0-9.]/g,"")+'\')">'+(en?"PLAY ":"RIGIOCA A ")+geortEur(posta)+'</button>'
      :'<button type="button" class="gc-si" onclick="geortConfChiudi();geortFineEsci();if(typeof geoSceltaModo===\'function\')geoSceltaModo(\'soldi\')">'+(en?"CHANGE STAKE":"CAMBIA POSTA")+'</button>')
    +'</div></div>';
  requestAnimationFrame(function(){c.classList.add("on");});
}
function geortConfSi(tier){
  geortConfChiudi();
  if(geortSaldo()<(parseFloat(tier)||0)-1e-9){toast(geortEn()?"Balance too low":"Saldo insufficiente","err",2400);return;}
  GEORT.ultimo={modo:"soldi",tier:String(tier),daCoda:true};
  RTD.over=null;RTD.practice=false;RTD.tour=false;
  if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
  geortRicarica();
  RTD.tier=String(tier);
  rtdShowSearch();
  geortTastoAnnulla(true);
  rtdJoin();
}
