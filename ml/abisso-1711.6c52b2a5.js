var ABRT={wrap:null,fr:null,pronto:false,coda:[],aperto:false,nascosto:false,firma:"",start:null,fineScena:false,loads:0,codaPiena:false,tgEv:false,spec:false,rientraT:0};
var ABRT_VER="20261120b97e00";
function abrtUrl(){return "abisso/abisso.html?rt=1&modo=rt&piatt=tg&v="+ABRT_VER+"&lang="+((window.GB_LANG==="en")?"en":"it")+"&origine="+encodeURIComponent(location.origin);}
var ABRT_URL=abrtUrl();
var ABRT_ORIGIN=location.origin;
var ABRT_CODA_MAX=3000;
var ABRT_MOSSE={giu:1,risali:1,sx:1,dx:1,uovo:1,compra:1,faro:1,ruba:1,scambia:1,patto:1,pronto:1};
var ABRT_HO_BLOCCATO=false;
function abrtBlocca(){
  try{ if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();ABRT_HO_BLOCCATO=true;} }catch(e){}
}
function abrtSblocca(){
  try{ if(ABRT_HO_BLOCCATO&&typeof bx2Sblocca==="function")bx2Sblocca(); }catch(e){}
  ABRT_HO_BLOCCATO=false;
}
function abrtNum(x,d){ return (typeof x==="number"&&isFinite(x)&&Math.abs(x)<1e7)?x:d; }
function abrtAx(a,x){
  if(x===undefined||x===null)return {ok:true,v:null};
  if(typeof x==="number"&&isFinite(x)&&Math.floor(x)===x&&Math.abs(x)<64)return {ok:true,v:x};
  return {ok:false};
}
function abrtAltezza(){
  try{
    if(!ABRT.wrap)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){ABRT.wrap.style.height=Math.round(h)+"px";ABRT.wrap.style.bottom="auto";}
    else{ABRT.wrap.style.height="100%";ABRT.wrap.style.bottom="0px";}
  }catch(e){}
}
function abrtBordi(){
  try{
    if(!ABRT.fr||!ABRT.pronto)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var sa=(tg2&&tg2.safeAreaInset)||{}, ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){
      var t=(Number(a)||0)+(Number(b)||0), e=(typeof luprtEnv==="function")?luprtEnv(lato):0;
      var v=Math.max(t,e);
      if(!isFinite(v)||v<0)v=0; if(v>200)v=200;
      return Math.round(v);
    }
    ABRT.fr.contentWindow.postMessage({sm:"bordi",top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom),
      left:q("left",sa.left,ca.left),right:q("right",sa.right,ca.right)},ABRT_ORIGIN);
  }catch(e){}
}
function abrtTelegram(){
  if(ABRT.tgEv)return;ABRT.tgEv=true;
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2&&typeof tg2.onEvent==="function"){
      tg2.onEvent("viewportChanged",function(){abrtAltezza();abrtBordi();});
      tg2.onEvent("safeAreaChanged",abrtBordi);
      tg2.onEvent("contentSafeAreaChanged",abrtBordi);
      tg2.onEvent("fullscreenChanged",function(){abrtAltezza();abrtBordi();});
    }
  }catch(e){}
  try{
    var misura=function(){if(ABRT.aperto){abrtAltezza();abrtBordi();}};
    window.addEventListener("resize",misura);
    if(window.visualViewport)window.visualViewport.addEventListener("resize",misura);
    window.addEventListener("orientationchange",function(){misura();setTimeout(misura,120);setTimeout(misura,400);});
  }catch(e2){}
}
try{
  if(window.OZ&&OZ.giochi)OZ.giochi.abisso=1;
  window.OZ_RAIL=window.OZ_RAIL||{};window.OZ_RAIL.abisso={nascondi:true};
  window.OZ_RIMISURA=window.OZ_RIMISURA||{};window.OZ_RIMISURA.abisso=function(){if(ABRT.aperto){abrtAltezza();abrtBordi();}};
}catch(e){}
function abrtMonta(){
  if(!ABRT.wrap){
    var w=document.createElement("div");
    w.id="abrt-wrap";
    w.style.cssText="position:fixed;inset:0;z-index:9100;display:none;background:#0d0a14;touch-action:none;overscroll-behavior:none;";
    w.innerHTML="<iframe id='abrt-fr' title='NON SVEGLIARE IL DRAGO' allow='autoplay' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w);
    ABRT.wrap=w;ABRT.fr=w.querySelector("#abrt-fr");
    ABRT.fr.addEventListener("load",function(){ if(ABRT.fr.getAttribute("src")===ABRT_URL)ABRT.loads++; });
    abrtTelegram();
  }
  if(ABRT.fr.getAttribute("src")!==ABRT_URL){
    ABRT.pronto=false;ABRT.coda=[];ABRT.codaPiena=false;
    ABRT.fr.setAttribute("src",ABRT_URL);
  }
}
function abrtPrecarica(){
  if(RTD.game!=="abisso")return;
  abrtMonta();
}
function abrtCssEsci(){
  if(document.getElementById("abrt-css"))return;
  try{
    var st=document.createElement("style");st.id="abrt-css";
    st.textContent="body.abrt-on #gx-esci.gx-dx,body.abrt-on #eb-esci.eb-dx{top:calc(4px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}";
    document.head.appendChild(st);
  }catch(e){}
}
function abrtASchermo(){
  ABRT.wrap.style.display="block";
  abrtCssEsci();
  try{document.body.classList.add("abrt-on");}catch(e0){}
  abrtBlocca();
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){ if(typeof tg2.expand==="function")tg2.expand(); if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes(); }
  }catch(e){}
  abrtAltezza();
}
function abrtViaDalloSchermo(){
  abrtSblocca();
  try{document.body.classList.remove("abrt-on");}catch(e0){}
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2&&typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();}catch(e){}
  ABRT.wrap.style.display="none";
}
function rtdShowAbissoRT(m,spec){
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
  if(typeof SBRT!=="undefined"&&SBRT.aperto&&typeof rtdChiudiSbancaRT==="function")rtdChiudiSbancaRT(true);
  RTD.ctx=null;RTD.cv=null;
  if(typeof rtdStopRaf==="function")rtdStopRaf();
  RTD._rafT=0;RTD._hintOff=1;
  try{GBMusic.stop();}catch(e){}
  abrtMonta();
  var eraNascosto=ABRT.aperto&&ABRT.nascosto;
  var eraChiuso=!ABRT.aperto;
  if(eraChiuso)ABRT.coda=[];
  if(m){
    var firma=String((m.map&&m.map.firma)?(m.map.firma+"|"+m.map.n):"");
    if(ABRT.aperto&&ABRT.firma!==firma){ABRT.coda=[];ABRT.fineScena=false;}
    if(!ABRT.aperto)ABRT.fineScena=false;
    ABRT.firma=firma;ABRT.start=m;ABRT.finita=false;
    ABRT.spec=!!spec;
  }
  ABRT.aperto=true;ABRT.nascosto=false;
  abrtASchermo();
  if(eraNascosto||eraChiuso)abrtGiu({t:"riprendi"});
  if(!m)rtdSend({t:"rientra"});
  if(m&&spec){
    var mm={},k;for(k in m)mm[k]=m[k];
    mm.t="start";mm.spec=true;mm.you=null;mm.tour=false;
    abrtGiu(mm);
    return;
  }
  if(m)abrtGiu(m);
}
function rtdChiudiAbissoRT(forza){
  if(!ABRT.wrap||!ABRT.fr)return;
  var visibile=(ABRT.wrap.style.display==="block");
  if(!ABRT.aperto&&!visibile&&!forza)return;
  abrtViaDalloSchermo();
  if(!forza&&ABRT.aperto&&RTD.ui==="match"){
    ABRT.nascosto=true;
    abrtGiu({t:"pausa"});
    return;
  }
  ABRT.aperto=false;ABRT.nascosto=false;ABRT.pronto=false;ABRT.coda=[];ABRT.codaPiena=false;
  ABRT.firma="";ABRT.start=null;ABRT.fineScena=false;ABRT.finita=false;
  ABRT.spec=false;
  if(ABRT.fr.getAttribute("src")!=="about:blank")ABRT.fr.setAttribute("src","about:blank");
}
function abrtTettoFine(){ return 20000; }
function abrtSpecOver(m){
  RTD.over=m;RTD.specRid=null;
  abrtGiu(m);
  if(ABRT.fineScena||ABRT.nascosto){rtdSpecOver(m);return;}
  if(RTD.overTmr)clearTimeout(RTD.overTmr);
  RTD.overTmr=setTimeout(function(){RTD.overTmr=null;if(RTD.over===m&&RTD.ui==="match")rtdSpecOver(m);},abrtTettoFine());
}
function abrtRicercaPosta(){
  var c=(typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="abisso")?LOB.card:null;
  if(!c)return null;
  if(c.gratis||!(Number(c.stake_eur)>0))return 0;
  return Number(c.stake_eur);
}
function abrtRicercaGratis(gratis){
  if(RTD.game!=="abisso"||RTD.tour||RTD.practice||RTD.ui!=="search")return;
  var el=document.getElementById("arc-body");if(!el)return;
  var pz=document.getElementById("arc-prize");
  if(pz&&gratis)pz.textContent="🎁 GRATIS";
  var bt=el.querySelector("button[onclick=\"rtdLeave()\"]");
  if(bt)bt.textContent=gratis?"✖ ESCI":"✖ ANNULLA (rimborso)";
}
function abrtPosta(m){
  try{ ABRT.fr.contentWindow.postMessage({sm:"giu",m:m},ABRT_ORIGIN); }catch(e){}
}
function abrtSenzaEventi(m){ return !!(m&&m.t==="s"&&!(m.feed&&m.feed.length)); }
function abrtGiu(m){
  if(!ABRT.aperto||!ABRT.fr)return;
  if(ABRT.pronto){abrtPosta(m);return;}
  var c=ABRT.coda,i;
  if(abrtSenzaEventi(m)){
    for(i=c.length-1;i>=0;i--){ if(abrtSenzaEventi(c[i])){c.splice(i,1);break;} }
  }
  c.push(m);
  if(c.length>ABRT_CODA_MAX){
    var k=0;
    for(i=0;i<c.length;i++){ if(c[i]&&c[i].t==="s"){k=i;break;} }
    c.splice(k,1);
    if(!ABRT.codaPiena){
      ABRT.codaPiena=true;
      RTD._rerr="sb:coda piena prima del pronto";
      try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"abisso",msg:"coda piena prima del pronto"}));}catch(e){}
    }
  }
}
function abrtRicevi(m){
  var t=m&&m.t;
  if(t==="s"){
    if(m.g!=="abisso")return false;
    if(m.over)ABRT.finita=true;
    abrtGiu(m);
    return true;
  }
  if(t==="err"&&m.code==="ab_act_no"){abrtGiu(m);return true;}
  if(t==="esce"&&m.game==="abisso"){abrtGiu(m);return false;}
  if(t==="hello_ok"&&ABRT.aperto&&!ABRT.spec&&RTD.game==="abisso"&&RTD.ui==="match"&&!RTD.over)rtdSend({t:"rientra"});
  return false;
}
window.addEventListener("message",function(ev){
  if(ev.origin!==ABRT_ORIGIN)return;
  var d=ev.data;if(!d||typeof d!=="object"||d.sm===undefined)return;
  if(!ABRT.fr||ev.source!==ABRT.fr.contentWindow)return;
  if(d.sm==="su"){
    var o=d.m;
    if(!o||typeof o!=="object"||!ABRT.aperto||ABRT.spec||RTD.spec)return;
    if(o.t==="act"){
      var a=(typeof o.a==="string")?o.a:"";
      if(!Object.prototype.hasOwnProperty.call(ABRT_MOSSE,a))return;
      var ax=abrtAx(a,o.ax);if(!ax.ok)return;
      rtdSend({t:"act",a:a,ax:ax.v});
      return;
    }
    if(o.t==="rientra"){
      if(ABRT.finita||(RTD.over&&RTD.over.game==="abisso"))return;
      var n=Date.now();if(n-ABRT.rientraT<3000)return;ABRT.rientraT=n;
      if(!RTD.wsOk){ if((RTD.retries||0)>=10)RTD.retries=0; try{if(typeof rtdConnect==="function")rtdConnect();}catch(e){} return; }
      rtdSend({t:"rientra"});return;
    }
    return;
  }
  if(d.sm==="pronto"){
    ABRT.pronto=true;
    RTD._wsT=performance.now();
    abrtBordi();
    if(ABRT.aperto){
      var c=ABRT.coda;ABRT.coda=[];
      for(var i=0;i<c.length;i++)abrtPosta(c[i]);
      if(ABRT.codaPiena){ABRT.codaPiena=false;if(!ABRT.spec)rtdSend({t:"rientra"});}
      return;
    }
    ABRT.coda=[];
    abrtPosta({t:"pausa"});
    return;
  }
  if(d.sm==="fine_scena"){
    ABRT.fineScena=true;
    if(ABRT.spec&&RTD.spec&&RTD.over&&RTD.over.game==="abisso"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdSpecOver(RTD.over);return;
    }
    if(RTD.over&&RTD.over.game==="abisso"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);
    }
    return;
  }
  if(d.sm==="esci"){
    if(!ABRT.aperto)return;
    if(ABRT.spec||RTD.spec){rtdSpecExit();return;}
    if(RTD.over&&RTD.over.game==="abisso"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);return;
    }
    rtdBack();return;
  }
  if(d.sm==="err"){
    RTD._rerr="ab:"+String(d.msg||"").slice(0,60);
    try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"abisso",msg:String(d.msg||"").slice(0,300)}));}catch(e){}
    return;
  }
});
