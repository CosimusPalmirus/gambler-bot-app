var HPRT={wrap:null,fr:null,pronto:false,coda:[],aperto:false,nascosto:false,firma:"",start:null,fineScena:false,loads:0,codaPiena:false,tgEv:false,spec:false,rientraT:0};
var HPRT_VER="20261120b57e64";
function hprtUrl(){return "hop/hop.html?rt=1&modo=rt&piatt=tg&avvia=1&titolo=0&v="+HPRT_VER+"&lang="+((window.GB_LANG==="en")?"en":"it")+"&origine="+encodeURIComponent(location.origin);}
var HPRT_URL=hprtUrl();
var HPRT_ORIGIN=location.origin;
var HPRT_CODA_MAX=3000;
var HPRT_MOSSE={salta:1,pronto:1,pg:1};
var HPRT_HO_BLOCCATO=false;
function hprtBlocca(){
  try{ if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();HPRT_HO_BLOCCATO=true;} }catch(e){}
}
function hprtSblocca(){
  try{ if(HPRT_HO_BLOCCATO&&typeof bx2Sblocca==="function")bx2Sblocca(); }catch(e){}
  HPRT_HO_BLOCCATO=false;
}
function hprtNum(x,d){ return (typeof x==="number"&&isFinite(x)&&Math.abs(x)<1e7)?x:d; }
function hprtAx(a,x){
  if(x===undefined||x===null)return {ok:true,v:null};
  if(typeof x==="number"&&isFinite(x)&&Math.floor(x)===x&&Math.abs(x)<64)return {ok:true,v:x};
  return {ok:false};
}
function hprtAltezza(){
  try{
    if(!HPRT.wrap)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){HPRT.wrap.style.height=Math.round(h)+"px";HPRT.wrap.style.bottom="auto";}
    else{HPRT.wrap.style.height="100%";HPRT.wrap.style.bottom="0px";}
  }catch(e){}
}
function hprtBordi(){
  try{
    if(!HPRT.fr||!HPRT.pronto)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var sa=(tg2&&tg2.safeAreaInset)||{}, ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){
      var t=(Number(a)||0)+(Number(b)||0), e=(typeof luprtEnv==="function")?luprtEnv(lato):0;
      var v=Math.max(t,e);
      if(!isFinite(v)||v<0)v=0; if(v>200)v=200;
      return Math.round(v);
    }
    HPRT.fr.contentWindow.postMessage({sm:"bordi",top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom),
      left:q("left",sa.left,ca.left),right:q("right",sa.right,ca.right)},HPRT_ORIGIN);
  }catch(e){}
}
function hprtTelegram(){
  if(HPRT.tgEv)return;HPRT.tgEv=true;
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2&&typeof tg2.onEvent==="function"){
      tg2.onEvent("viewportChanged",function(){hprtAltezza();hprtBordi();});
      tg2.onEvent("safeAreaChanged",hprtBordi);
      tg2.onEvent("contentSafeAreaChanged",hprtBordi);
      tg2.onEvent("fullscreenChanged",function(){hprtAltezza();hprtBordi();});
    }
  }catch(e){}
  try{
    var misura=function(){if(HPRT.aperto){hprtAltezza();hprtBordi();}};
    window.addEventListener("resize",misura);
    if(window.visualViewport)window.visualViewport.addEventListener("resize",misura);
    window.addEventListener("orientationchange",function(){misura();setTimeout(misura,120);setTimeout(misura,400);});
  }catch(e2){}
}
try{
  if(window.OZ&&OZ.giochi)OZ.giochi.hop=1;
  window.OZ_RAIL=window.OZ_RAIL||{};window.OZ_RAIL.hop={nascondi:true};
  window.OZ_RIMISURA=window.OZ_RIMISURA||{};window.OZ_RIMISURA.hop=function(){if(HPRT.aperto){hprtAltezza();hprtBordi();}};
}catch(e){}
function hprtMonta(){
  if(!HPRT.wrap){
    var w=document.createElement("div");
    w.id="hprt-wrap";
    w.style.cssText="position:fixed;inset:0;z-index:9100;display:none;background:#04201d;touch-action:none;overscroll-behavior:none;";
    w.innerHTML="<iframe id='hprt-fr' title='HOP CLASH' allow='autoplay' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w);
    HPRT.wrap=w;HPRT.fr=w.querySelector("#hprt-fr");
    HPRT.fr.addEventListener("load",function(){ if(HPRT.fr.getAttribute("src")===HPRT_URL)HPRT.loads++; });
    hprtTelegram();
  }
  if(HPRT.fr.getAttribute("src")!==HPRT_URL){
    HPRT.pronto=false;HPRT.coda=[];HPRT.codaPiena=false;
    HPRT.fr.setAttribute("src",HPRT_URL);
  }
}
function hprtPrecarica(){
  if(RTD.game!=="hop")return;
  hprtMonta();
}
function hprtCssEsci(){
  if(document.getElementById("hprt-css"))return;
  try{
    var st=document.createElement("style");st.id="hprt-css";
    st.textContent="body.hprt-on #gx-esci.gx-dx,body.hprt-on #eb-esci.eb-dx{top:calc(4px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}";
    document.head.appendChild(st);
  }catch(e){}
}
function hprtASchermo(){
  HPRT.wrap.style.display="block";
  hprtCssEsci();
  try{document.body.classList.add("hprt-on");}catch(e0){}
  hprtBlocca();
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){ if(typeof tg2.expand==="function")tg2.expand(); if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes(); }
  }catch(e){}
  hprtAltezza();
}
function hprtViaDalloSchermo(){
  hprtSblocca();
  try{document.body.classList.remove("hprt-on");}catch(e0){}
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2&&typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();}catch(e){}
  HPRT.wrap.style.display="none";
}
function rtdShowHopRT(m,spec){
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
  if(typeof ABRT!=="undefined"&&ABRT.aperto&&typeof rtdChiudiAbissoRT==="function")rtdChiudiAbissoRT(true);
  RTD.ctx=null;RTD.cv=null;
  if(typeof rtdStopRaf==="function")rtdStopRaf();
  RTD._rafT=0;RTD._hintOff=1;
  try{GBMusic.stop();}catch(e){}
  hprtMonta();
  var eraNascosto=HPRT.aperto&&HPRT.nascosto;
  var eraChiuso=!HPRT.aperto;
  if(eraChiuso)HPRT.coda=[];
  if(m){
    var firma=String((m.map&&m.map.firma)?(m.map.firma+"|"+m.map.n):"");
    if(HPRT.aperto&&HPRT.firma!==firma){HPRT.coda=[];HPRT.fineScena=false;}
    if(!HPRT.aperto)HPRT.fineScena=false;
    HPRT.firma=firma;HPRT.start=m;HPRT.finita=false;
    HPRT.spec=!!spec;
  }
  HPRT.aperto=true;HPRT.nascosto=false;
  hprtASchermo();
  if(eraNascosto||eraChiuso)hprtGiu({t:"riprendi"});
  if(!m)rtdSend({t:"rientra"});
  if(m&&spec){
    var mm={},k;for(k in m)mm[k]=m[k];
    mm.t="start";mm.spec=true;mm.you=null;mm.tour=false;
    hprtGiu(mm);
    return;
  }
  if(m)hprtGiu(m);
}
function rtdChiudiHopRT(forza){
  if(!HPRT.wrap||!HPRT.fr)return;
  var visibile=(HPRT.wrap.style.display==="block");
  if(!HPRT.aperto&&!visibile&&!forza)return;
  hprtViaDalloSchermo();
  if(!forza&&HPRT.aperto&&RTD.ui==="match"){
    HPRT.nascosto=true;
    hprtGiu({t:"pausa"});
    return;
  }
  HPRT.aperto=false;HPRT.nascosto=false;HPRT.pronto=false;HPRT.coda=[];HPRT.codaPiena=false;
  HPRT.firma="";HPRT.start=null;HPRT.fineScena=false;HPRT.finita=false;
  HPRT.spec=false;
  if(HPRT.fr.getAttribute("src")!=="about:blank")HPRT.fr.setAttribute("src","about:blank");
}
function hprtTettoFine(){ return 25000; }
function hprtSpecOver(m){
  RTD.over=m;RTD.specRid=null;
  hprtGiu(m);
  if(HPRT.fineScena||HPRT.nascosto){rtdSpecOver(m);return;}
  if(RTD.overTmr)clearTimeout(RTD.overTmr);
  RTD.overTmr=setTimeout(function(){RTD.overTmr=null;if(RTD.over===m&&RTD.ui==="match")rtdSpecOver(m);},hprtTettoFine());
}
function hprtRicercaPosta(){
  var c=(typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="hop")?LOB.card:null;
  if(!c)return null;
  if(c.gratis||!(Number(c.stake_eur)>0))return 0;
  return Number(c.stake_eur);
}
function hprtRicercaGratis(gratis){
  if(RTD.game!=="hop"||RTD.tour||RTD.practice||RTD.ui!=="search")return;
  var el=document.getElementById("arc-body");if(!el)return;
  var pz=document.getElementById("arc-prize");
  if(pz&&gratis)pz.textContent="🎁 GRATIS";
  var bt=el.querySelector("button[onclick=\"rtdLeave()\"]");
  if(bt)bt.textContent=gratis?"✖ ESCI":"✖ ANNULLA (rimborso)";
}
function hprtPosta(m){
  try{ HPRT.fr.contentWindow.postMessage({sm:"giu",m:m},HPRT_ORIGIN); }catch(e){}
}
function hprtSenzaEventi(m){ return !!(m&&m.t==="s"&&!(m.feed&&m.feed.length)); }
function hprtGiu(m){
  if(!HPRT.aperto||!HPRT.fr)return;
  if(HPRT.pronto){hprtPosta(m);return;}
  var c=HPRT.coda,i;
  if(hprtSenzaEventi(m)){
    for(i=c.length-1;i>=0;i--){ if(hprtSenzaEventi(c[i])){c.splice(i,1);break;} }
  }
  c.push(m);
  if(c.length>HPRT_CODA_MAX){
    var k=0;
    for(i=0;i<c.length;i++){ if(c[i]&&c[i].t==="s"){k=i;break;} }
    c.splice(k,1);
    if(!HPRT.codaPiena){
      HPRT.codaPiena=true;
      RTD._rerr="hp:coda piena prima del pronto";
      try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"hop",msg:"coda piena prima del pronto"}));}catch(e){}
    }
  }
}
function hprtRicevi(m){
  var t=m&&m.t;
  if(t==="s"){
    if(m.g!=="hop")return false;
    if(m.over)HPRT.finita=true;
    hprtGiu(m);
    return true;
  }
  if(t==="err"&&m.code==="hop_act_no"){hprtGiu(m);return true;}
  if(t==="esce"&&m.game==="hop"){hprtGiu(m);return false;}
  if(t==="hello_ok"&&HPRT.aperto&&!HPRT.spec&&RTD.game==="hop"&&RTD.ui==="match"&&!RTD.over)rtdSend({t:"rientra"});
  return false;
}
window.addEventListener("message",function(ev){
  if(ev.origin!==HPRT_ORIGIN)return;
  var d=ev.data;if(!d||typeof d!=="object"||d.sm===undefined)return;
  if(!HPRT.fr||ev.source!==HPRT.fr.contentWindow)return;
  if(d.sm==="su"){
    var o=d.m;
    if(!o||typeof o!=="object"||!HPRT.aperto||HPRT.spec||RTD.spec)return;
    if(o.t==="act"){
      var a=(typeof o.a==="string")?o.a:"";
      if(!Object.prototype.hasOwnProperty.call(HPRT_MOSSE,a))return;
      var ax=hprtAx(a,o.ax);if(!ax.ok)return;
      var ay=hprtAx(a,o.ay);if(!ay.ok)return;
      if(a==="salta"&&(ax.v===null||ay.v===null))return;
      rtdSend({t:"act",a:a,ax:ax.v,ay:ay.v,p:(o.p===1?1:0)});
      return;
    }
    if(o.t==="rientra"){
      if(HPRT.finita||(RTD.over&&RTD.over.game==="hop"))return;
      var n=Date.now();if(n-HPRT.rientraT<3000)return;HPRT.rientraT=n;
      if(!RTD.wsOk){ if((RTD.retries||0)>=10)RTD.retries=0; try{if(typeof rtdConnect==="function")rtdConnect();}catch(e){} return; }
      rtdSend({t:"rientra"});return;
    }
    return;
  }
  if(d.sm==="pronto"){
    HPRT.pronto=true;
    RTD._wsT=performance.now();
    hprtBordi();
    if(HPRT.aperto){
      var c=HPRT.coda;HPRT.coda=[];
      for(var i=0;i<c.length;i++)hprtPosta(c[i]);
      if(HPRT.codaPiena){HPRT.codaPiena=false;if(!HPRT.spec)rtdSend({t:"rientra"});}
      return;
    }
    HPRT.coda=[];
    hprtPosta({t:"pausa"});
    return;
  }
  if(d.sm==="fine_scena"){
    HPRT.fineScena=true;
    if(HPRT.spec&&RTD.spec&&RTD.over&&RTD.over.game==="hop"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdSpecOver(RTD.over);return;
    }
    if(RTD.over&&RTD.over.game==="hop"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);
    }
    return;
  }
  if(d.sm==="esci"){
    if(!HPRT.aperto)return;
    if(HPRT.spec||RTD.spec){rtdSpecExit();return;}
    if(RTD.over&&RTD.over.game==="hop"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);return;
    }
    rtdBack();return;
  }
  if(d.sm==="err"){
    RTD._rerr="hp:"+String(d.msg||"").slice(0,60);
    try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"hop",msg:String(d.msg||"").slice(0,300)}));}catch(e){}
    return;
  }
});
