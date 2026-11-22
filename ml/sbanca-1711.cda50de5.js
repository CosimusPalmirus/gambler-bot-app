var SBRT={wrap:null,fr:null,pronto:false,coda:[],aperto:false,nascosto:false,firma:"",start:null,fineScena:false,loads:0,codaPiena:false,tgEv:false,spec:false,rientraT:0};
var SBRT_VER="20261120c0af59";
function sbrtUrl(){return "sbanca/sbanca.html?rt=1&modo=rt&piatt=tg&v="+SBRT_VER+"&lang="+((window.GB_LANG==="en")?"en":"it")+"&origine="+encodeURIComponent(location.origin);}
var SBRT_URL=sbrtUrl();
var SBRT_ORIGIN=location.origin;
var SBRT_CODA_MAX=3000;
var SBRT_MOSSE={arma:1,miccia:1,bersaglio:1,spara:1,salto:1,capriola:1};
var SBRT_HO_BLOCCATO=false;
function sbrtBlocca(){
  try{ if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();SBRT_HO_BLOCCATO=true;} }catch(e){}
}
function sbrtSblocca(){
  try{ if(SBRT_HO_BLOCCATO&&typeof bx2Sblocca==="function")bx2Sblocca(); }catch(e){}
  SBRT_HO_BLOCCATO=false;
}
function sbrtNum(x,d){ return (typeof x==="number"&&isFinite(x)&&Math.abs(x)<1e7)?x:d; }
function sbrtAx(a,x){
  if(x===undefined||x===null)return {ok:true,v:null};
  if(typeof x==="number")return isFinite(x)&&Math.abs(x)<1e7?{ok:true,v:x}:{ok:false};
  if(a==="arma"&&typeof x==="string"&&/^[a-z_]{1,24}$/.test(x))return {ok:true,v:x};
  return {ok:false};
}
function sbrtAltezza(){
  try{
    if(!SBRT.wrap)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){SBRT.wrap.style.height=Math.round(h)+"px";SBRT.wrap.style.bottom="auto";}
    else{SBRT.wrap.style.height="100%";SBRT.wrap.style.bottom="0px";}
  }catch(e){}
}
function sbrtBordi(){
  try{
    if(!SBRT.fr||!SBRT.pronto)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var sa=(tg2&&tg2.safeAreaInset)||{}, ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){
      var t=(Number(a)||0)+(Number(b)||0), e=(typeof luprtEnv==="function")?luprtEnv(lato):0;
      var v=Math.max(t,e);
      if(!isFinite(v)||v<0)v=0; if(v>200)v=200;
      return Math.round(v);
    }
    SBRT.fr.contentWindow.postMessage({sm:"bordi",top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom),
      left:q("left",sa.left,ca.left),right:q("right",sa.right,ca.right)},SBRT_ORIGIN);
  }catch(e){}
}
function sbrtTelegram(){
  if(SBRT.tgEv)return;SBRT.tgEv=true;
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2&&typeof tg2.onEvent==="function"){
      tg2.onEvent("viewportChanged",function(){sbrtAltezza();sbrtBordi();});
      tg2.onEvent("safeAreaChanged",sbrtBordi);
      tg2.onEvent("contentSafeAreaChanged",sbrtBordi);
      tg2.onEvent("fullscreenChanged",function(){sbrtAltezza();sbrtBordi();});
    }
  }catch(e){}
  try{
    var misura=function(){if(SBRT.aperto){sbrtAltezza();sbrtBordi();}};
    window.addEventListener("resize",misura);
    if(window.visualViewport)window.visualViewport.addEventListener("resize",misura);
    window.addEventListener("orientationchange",function(){misura();setTimeout(misura,120);setTimeout(misura,400);});
  }catch(e2){}
}
try{
  if(window.OZ&&OZ.giochi)OZ.giochi.sbanca=1;
  window.OZ_RAIL=window.OZ_RAIL||{};window.OZ_RAIL.sbanca={nascondi:true};
  window.OZ_RIMISURA=window.OZ_RIMISURA||{};window.OZ_RIMISURA.sbanca=function(){if(SBRT.aperto){sbrtAltezza();sbrtBordi();}};
}catch(e){}
function sbrtMonta(){
  if(!SBRT.wrap){
    var w=document.createElement("div");
    w.id="sbrt-wrap";
    w.style.cssText="position:fixed;inset:0;z-index:9100;display:none;background:#120a1c;touch-action:none;overscroll-behavior:none;";
    w.innerHTML="<iframe id='sbrt-fr' title='SBANCA' allow='autoplay' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w);
    SBRT.wrap=w;SBRT.fr=w.querySelector("#sbrt-fr");
    SBRT.fr.addEventListener("load",function(){ if(SBRT.fr.getAttribute("src")===SBRT_URL)SBRT.loads++; });
    sbrtTelegram();
  }
  if(SBRT.fr.getAttribute("src")!==SBRT_URL){
    SBRT.pronto=false;SBRT.coda=[];SBRT.codaPiena=false;
    SBRT.fr.setAttribute("src",SBRT_URL);
  }
}
function sbrtPrecarica(){
  if(RTD.game!=="sbanca")return;
  sbrtMonta();
}
function sbrtCssEsci(){
  if(document.getElementById("sbrt-css"))return;
  try{
    var st=document.createElement("style");st.id="sbrt-css";
    st.textContent="body.sbrt-on #gx-esci.gx-dx,body.sbrt-on #eb-esci.eb-dx{top:calc(4px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}";
    document.head.appendChild(st);
  }catch(e){}
}
function sbrtASchermo(){
  SBRT.wrap.style.display="block";
  sbrtCssEsci();
  try{document.body.classList.add("sbrt-on");}catch(e0){}
  sbrtBlocca();
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){ if(typeof tg2.expand==="function")tg2.expand(); if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes(); }
  }catch(e){}
  sbrtAltezza();
}
function sbrtViaDalloSchermo(){
  sbrtSblocca();
  try{document.body.classList.remove("sbrt-on");}catch(e0){}
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2&&typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();}catch(e){}
  SBRT.wrap.style.display="none";
}
function rtdShowSbancaRT(m,spec){
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
  if(typeof GEORT!=="undefined"&&GEORT.aperto&&typeof rtdChiudiGeoRT==="function")rtdChiudiGeoRT(true);
  if(typeof DMRT!=="undefined"&&DMRT.aperto&&typeof rtdChiudiDeadmoneyRT==="function")rtdChiudiDeadmoneyRT(true);
  if(typeof GSRT!=="undefined"&&GSRT.aperto&&typeof rtdChiudiSmashRT==="function")rtdChiudiSmashRT(true);
  RTD.ctx=null;RTD.cv=null;
  if(typeof rtdStopRaf==="function")rtdStopRaf();
  RTD._rafT=0;RTD._hintOff=1;
  try{GBMusic.stop();}catch(e){}
  sbrtMonta();
  var eraNascosto=SBRT.aperto&&SBRT.nascosto;
  var eraChiuso=!SBRT.aperto;
  if(eraChiuso)SBRT.coda=[];
  if(m){
    var firma=String((m.map&&m.map.mat0)?(m.map.tema+"|"+m.map.w+"|"+String(m.map.mat0).length+"|"+String(m.map.mat0).slice(-24)):"");
    if(SBRT.aperto&&SBRT.firma!==firma){SBRT.coda=[];SBRT.fineScena=false;}
    if(!SBRT.aperto)SBRT.fineScena=false;
    SBRT.firma=firma;SBRT.start=m;SBRT.finita=false;
    SBRT.spec=!!spec;
  }
  SBRT.aperto=true;SBRT.nascosto=false;
  sbrtASchermo();
  if(eraNascosto||eraChiuso)sbrtGiu({t:"riprendi"});
  if(!m)rtdSend({t:"rientra"});
  if(m&&spec){
    var mm={},k;for(k in m)mm[k]=m[k];
    mm.t="start";mm.spec=true;mm.you=null;mm.tour=false;
    sbrtGiu(mm);
    return;
  }
  if(m)sbrtGiu(m);
}
function rtdChiudiSbancaRT(forza){
  if(!SBRT.wrap||!SBRT.fr)return;
  var visibile=(SBRT.wrap.style.display==="block");
  if(!SBRT.aperto&&!visibile&&!forza)return;
  sbrtViaDalloSchermo();
  if(!forza&&SBRT.aperto&&RTD.ui==="match"){
    SBRT.nascosto=true;
    sbrtGiu({t:"pausa"});
    return;
  }
  SBRT.aperto=false;SBRT.nascosto=false;SBRT.pronto=false;SBRT.coda=[];SBRT.codaPiena=false;
  SBRT.firma="";SBRT.start=null;SBRT.fineScena=false;SBRT.finita=false;
  SBRT.spec=false;
  if(SBRT.fr.getAttribute("src")!=="about:blank")SBRT.fr.setAttribute("src","about:blank");
}
function sbrtTettoFine(){ return 20000; }
function sbrtSpecOver(m){
  RTD.over=m;RTD.specRid=null;
  sbrtGiu(m);
  if(SBRT.fineScena||SBRT.nascosto){rtdSpecOver(m);return;}
  if(RTD.overTmr)clearTimeout(RTD.overTmr);
  RTD.overTmr=setTimeout(function(){RTD.overTmr=null;if(RTD.over===m&&RTD.ui==="match")rtdSpecOver(m);},sbrtTettoFine());
}
function sbrtRicercaPosta(){
  var c=(typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="sbanca")?LOB.card:null;
  if(!c)return null;
  if(c.gratis||!(Number(c.stake_eur)>0))return 0;
  return Number(c.stake_eur);
}
function sbrtRicercaGratis(gratis){
  if(RTD.game!=="sbanca"||RTD.tour||RTD.practice||RTD.ui!=="search")return;
  var el=document.getElementById("arc-body");if(!el)return;
  var pz=document.getElementById("arc-prize");
  if(pz&&gratis)pz.textContent="🎁 GRATIS";
  var bt=el.querySelector("button[onclick=\"rtdLeave()\"]");
  if(bt)bt.textContent=gratis?"✖ ESCI":"✖ ANNULLA (rimborso)";
}
function sbrtPosta(m){
  try{ SBRT.fr.contentWindow.postMessage({sm:"giu",m:m},SBRT_ORIGIN); }catch(e){}
}
function sbrtSenzaEventi(m){ return !!(m&&m.t==="s"&&!(m.feed&&m.feed.length)); }
function sbrtGiu(m){
  if(!SBRT.aperto||!SBRT.fr)return;
  if(SBRT.pronto){sbrtPosta(m);return;}
  var c=SBRT.coda,i;
  if(sbrtSenzaEventi(m)){
    for(i=c.length-1;i>=0;i--){ if(sbrtSenzaEventi(c[i])){c.splice(i,1);break;} }
  }
  c.push(m);
  if(c.length>SBRT_CODA_MAX){
    var k=0;
    for(i=0;i<c.length;i++){ if(c[i]&&c[i].t==="s"){k=i;break;} }
    c.splice(k,1);
    if(!SBRT.codaPiena){
      SBRT.codaPiena=true;
      RTD._rerr="sb:coda piena prima del pronto";
      try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"sbanca",msg:"coda piena prima del pronto"}));}catch(e){}
    }
  }
}
function sbrtRicevi(m){
  var t=m&&m.t;
  if(t==="s"){
    if(m.g!=="sbanca")return false;
    if(m.over)SBRT.finita=true;
    sbrtGiu(m);
    return true;
  }
  if(t==="sb_err"){sbrtGiu(m);return true;}
  if(t==="esce"&&m.game==="sbanca"){sbrtGiu(m);return false;}
  if(t==="hello_ok"&&SBRT.aperto&&!SBRT.spec&&RTD.game==="sbanca"&&RTD.ui==="match"&&!RTD.over)rtdSend({t:"rientra"});
  return false;
}
window.addEventListener("message",function(ev){
  if(ev.origin!==SBRT_ORIGIN)return;
  var d=ev.data;if(!d||typeof d!=="object"||d.sm===undefined)return;
  if(!SBRT.fr||ev.source!==SBRT.fr.contentWindow)return;
  if(d.sm==="su"){
    var o=d.m;
    if(!o||typeof o!=="object"||!SBRT.aperto||SBRT.spec||RTD.spec)return;
    if(o.t==="in"){rtdSend({t:"in",mx:sbrtNum(o.mx,0),my:sbrtNum(o.my,0)});return;}
    if(o.t==="aim"){rtdSend({t:"aim",ax:sbrtNum(o.ax,1),ay:sbrtNum(o.ay,0),on:1});return;}
    if(o.t==="act"){
      var a=(typeof o.a==="string")?o.a:"";
      if(!Object.prototype.hasOwnProperty.call(SBRT_MOSSE,a))return;
      var ax=sbrtAx(a,o.ax);if(!ax.ok)return;
      rtdSend({t:"act",a:a,ax:ax.v,ay:sbrtNum(o.ay,null),p:sbrtNum(o.p,null)});
      return;
    }
    if(o.t==="rientra"){
      if(SBRT.finita||(RTD.over&&RTD.over.game==="sbanca"))return;
      var n=Date.now();if(n-SBRT.rientraT<3000)return;SBRT.rientraT=n;
      if(!RTD.wsOk){ if((RTD.retries||0)>=10)RTD.retries=0; try{if(typeof rtdConnect==="function")rtdConnect();}catch(e){} return; }
      rtdSend({t:"rientra"});return;
    }
    return;
  }
  if(d.sm==="pronto"){
    SBRT.pronto=true;
    RTD._wsT=performance.now();
    sbrtBordi();
    if(SBRT.aperto){
      var c=SBRT.coda;SBRT.coda=[];
      for(var i=0;i<c.length;i++)sbrtPosta(c[i]);
      if(SBRT.codaPiena){SBRT.codaPiena=false;if(!SBRT.spec)rtdSend({t:"rientra"});}
      return;
    }
    SBRT.coda=[];
    sbrtPosta({t:"pausa"});
    return;
  }
  if(d.sm==="fine_scena"){
    SBRT.fineScena=true;
    if(SBRT.spec&&RTD.spec&&RTD.over&&RTD.over.game==="sbanca"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdSpecOver(RTD.over);return;
    }
    if(RTD.over&&RTD.over.game==="sbanca"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);
    }
    return;
  }
  if(d.sm==="esci"){
    if(!SBRT.aperto)return;
    if(SBRT.spec||RTD.spec){rtdSpecExit();return;}
    if(RTD.over&&RTD.over.game==="sbanca"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);return;
    }
    rtdBack();return;
  }
  if(d.sm==="err"){
    RTD._rerr="sb:"+String(d.msg||"").slice(0,60);
    try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"sbanca",msg:String(d.msg||"").slice(0,300)}));}catch(e){}
    return;
  }
});
