var GSRT={wrap:null,fr:null,pronto:false,coda:[],aperto:false,nascosto:false,firma:"",start:null,fineScena:false,loads:0,codaPiena:false,tgEv:false,spec:false,fuori:false,verAvviso:false};
var GSRT_VER="20261120pz959a00c3";
var GSRT_MOTORE_VER="a5d79a0c0c2e";
function gsrtUrl(){return "smash.html?guscio=1&v="+GSRT_VER+"&lang="+((window.GB_LANG==="en")?"en":"it");}
var GSRT_URL=gsrtUrl();
var GSRT_ORIGIN=location.origin;
window.GSSOLDI={
  apri:function(){
    if(RTD.ui==="match"||RTD.ui==="search")return false;
    GSRT.menu=false;rtdChiudiSmashRT(true);
    RTD.game="smash";RTD.practice=false;RTD.spec=false;
    GSRT.lobbyStd=true;RTD.sq=0;
    rtdShowLobby();
    return true;
  },
  saldo:function(){try{return (typeof capEur==="function")?(Number(capEur())||0):0;}catch(e){return 0;}},
  fasce:function(){try{return TWR_TIERS.map(function(t){return String(t[0]);});}catch(e){return ["0.5","1","2","5","10","20","50"];}},
  tier:function(){return String(RTD.tier||"");},
  aggiorna:function(){try{if(typeof loadBalance==="function")return loadBalance();}catch(e){}return null;},
  gioca:function(t,sq,n){return gsrtGioca(this,t,sq,n);},
  lobby:function(){
    try{
      if(typeof S==="undefined"||!S.userId||typeof BACKEND==="undefined")return Promise.resolve(null);
      return fetch(BACKEND+"/lobby/list?user_id="+encodeURIComponent(S.userId)).then(function(r){return r.json();}).then(function(d){
        return ((d&&d.lobbies)||[]).filter(function(c){return c&&c.game==="smash";}).map(function(c){
          return {lid:String(c.lid||""),gratis:!!c.gratis,eur:Number(c.stake_eur)||0,posti:Number(c.posti)||2,seduti:Number(c.seduti)||0,chi:String(c.creator_name||"").slice(0,24),squadre:!!c.squadre};});
      }).catch(function(){return null;});
    }catch(e){return Promise.resolve(null);}
  },
  entra:function(lid){
    if(!lid||RTD.ui==="match"||RTD.ui==="search")return false;
    GSRT.menu=false;gsrtPosta({t:"pausa"});rtdChiudiSmashRT(true);
    try{LOB.from="arc";lobOpen(String(lid),false);}catch(e){return false;}
    return true;
  },
  crea:function(gratis,posti,sq){
    if(RTD.ui==="match"||RTD.ui==="search")return false;
    GSRT.menu=false;gsrtPosta({t:"pausa"});rtdChiudiSmashRT(true);
    try{
      lobOpenCreate("smash","arc");
      LOB.gratis=!!gratis;if(!gratis)LOB.eur=parseFloat(RTD.tier)||0.5;
      var n=Number(posti)||0;if(n>=2&&n<=4)LOB.posti=n;LOB.squadre=(sq==="squadre");if(LOB.squadre)LOB.posti=4;
      if(typeof lobRenderCrea==="function")lobRenderCrea();
    }catch(e){return false;}
    return true;
  },
  esci:function(){
    if(RTD.ui==="search"&&!RTD.tour&&!RTD.practice&&!RTD.spec){GSRT.uscito=Date.now();rtdLeave();}
    gsrtCodaVia();
    GSRT.menu=false;rtdChiudiSmashRT(true);
    RTD.ui="";
    try{wsNetBanner("arc",0);}catch(e){}
    go("duel");
  }
};
function gsrtApriMenu(){
  if(RTD.game!=="smash"||RTD.tour||RTD.spec||RTD.practice)return false;
  if(GSRT.lobbyStd){GSRT.lobbyStd=false;return false;}
  if(GSRT.aperto)return false;
  try{
    if(typeof rtdStopRaf==="function")rtdStopRaf();
    try{GBMusic.stop();}catch(e0){}
    try{var AC=window.AudioContext||window.webkitAudioContext;if(AC){if(!window.GSRT_AC)window.GSRT_AC=new AC();if(window.GSRT_AC.state==="suspended")window.GSRT_AC.resume();}}catch(e1){}
    gsrtMonta();
    GSRT.menu=true;
    gsrtASchermo();
    if(GSRT.pronto){gsrtBordi();gsrtPosta({t:"menu"});}
    return true;
  }catch(e){GSRT.menu=false;return false;}
}
try{window.OZ_RAIL=window.OZ_RAIL||{};window.OZ_RAIL.smash={nascondi:true};}catch(e){}
var GSRT_CODA_MAX=4000;
var GSRT_TETTO_FINE=11000;
var GSRT_HO_BLOCCATO=false;
function gsrtBlocca(){
  try{ if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();GSRT_HO_BLOCCATO=true;} }catch(e){}
}
function gsrtSblocca(){
  try{ if(GSRT_HO_BLOCCATO&&typeof bx2Sblocca==="function")bx2Sblocca(); }catch(e){}
  GSRT_HO_BLOCCATO=false;
}
function gsrtIntero(x,lo,hi){ return typeof x==="number"&&isFinite(x)&&Math.floor(x)===x&&x>=lo&&x<=hi; }
function gsrtTesto(x,max,re){ return typeof x==="string"&&x.length>0&&x.length<=max&&(!re||re.test(x)); }
var GSRT_RE_ID=/^[a-z0-9_]+$/, GSRT_RE_B64=/^[A-Za-z0-9+\/=]+$/, GSRT_RE_HEX=/^[0-9a-f]+$/;
function gsrtSu(o,spec){
  if(!o||typeof o!=="object"||o.t!=="gs")return null;
  var op=o.o;
  if(spec&&op!=="rs"&&op!=="p")return null;
  switch(op){
    case "ver": return gsrtTesto(o.v,40,null)?{t:"gs",o:"ver",v:o.v}:null;
    case "sc": return gsrtTesto(o.f,16,GSRT_RE_ID)?(o.ok===1?{t:"gs",o:"sc",f:o.f,ok:1}:{t:"gs",o:"sc",f:o.f}):null;
    case "ok": return {t:"gs",o:"ok"};
    case "i": return (gsrtIntero(o.f,0,2147483647)&&gsrtTesto(o.d,160,GSRT_RE_B64))?{t:"gs",o:"i",f:o.f,d:o.d}:null;
    case "p": return (typeof o.c==="number"&&isFinite(o.c))?{t:"gs",o:"p",c:o.c}:null;
    case "h": return (gsrtIntero(o.f,0,2147483647)&&gsrtTesto(o.h,8,GSRT_RE_HEX))?{t:"gs",o:"h",f:o.f,h:o.h}:null;
    case "fine": return (gsrtIntero(o.f,0,2147483647)&&gsrtTesto(o.h,8,GSRT_RE_HEX))?{t:"gs",o:"fine",f:o.f,h:o.h}:null;
    case "q": return (gsrtIntero(o.p,0,3)&&gsrtIntero(o.f,0,2147483647))?{t:"gs",o:"q",p:o.p,f:o.f}:null;
    case "rs": return {t:"gs",o:"rs"};
    case "bg": return {t:"gs",o:"bg"};
  }
  return null;
}
function gsrtAltezza(){
  try{
    if(!GSRT.wrap)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var vv=window.visualViewport;
    var h=Math.min(window.innerHeight||0,vv&&vv.height>0?vv.height:window.innerHeight);
    if(h>0){GSRT.wrap.style.height=Math.round(h)+"px";GSRT.wrap.style.bottom="auto";}
    else{GSRT.wrap.style.height="100%";GSRT.wrap.style.bottom="0px";}
  }catch(e){}
}
function gsrtBordi(){
  try{
    if(!GSRT.fr||!GSRT.pronto)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var sa=(tg2&&tg2.safeAreaInset)||{}, ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){
      var t=(Number(a)||0)+(Number(b)||0), e=(typeof luprtEnv==="function")?luprtEnv(lato):0;
      var v=Math.max(t,e);
      if(!isFinite(v)||v<0)v=0; if(v>200)v=200;
      return Math.round(v);
    }
    gsrtPosta({t:"bordi",hudTop:q("top",sa.top,0),top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom),
               left:q("left",sa.left,ca.left),right:q("right",sa.right,ca.right)});
  }catch(e){}
}
function gsrtTelegram(){
  if(GSRT.tgEv)return;GSRT.tgEv=true;
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2&&typeof tg2.onEvent==="function"){
      tg2.onEvent("viewportChanged",function(){gsrtAltezza();gsrtBordi();});
      tg2.onEvent("safeAreaChanged",gsrtBordi);
      tg2.onEvent("contentSafeAreaChanged",gsrtBordi);
      tg2.onEvent("fullscreenChanged",function(){gsrtAltezza();gsrtBordi();});
    }
  }catch(e){}
  try{
    var misura=function(){gsrtAltezza();gsrtBordi();};
    window.addEventListener("resize",misura);
    if(window.visualViewport)window.visualViewport.addEventListener("resize",misura);
    window.addEventListener("orientationchange",function(){misura();setTimeout(misura,120);setTimeout(misura,400);});
  }catch(e2){}
}
function gsrtMonta(){
  if(!GSRT.wrap){
    var w=document.createElement("div");
    w.id="gsrt-wrap";
    w.style.cssText="position:fixed;inset:0;z-index:9100;display:none;background:#0c0918;touch-action:none;overscroll-behavior:none;";
    w.innerHTML="<iframe id='gsrt-fr' title='GAMBLER SMASH' allow='autoplay; fullscreen; gamepad' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w);
    GSRT.wrap=w;GSRT.fr=w.querySelector("#gsrt-fr");
    GSRT.fr.addEventListener("load",function(){ if(GSRT.fr.getAttribute("src")===GSRT_URL)GSRT.loads++; });
    gsrtTelegram();
  }
  if(GSRT.fr.getAttribute("src")!==GSRT_URL){
    GSRT.pronto=false;GSRT.coda=[];GSRT.codaPiena=false;
    GSRT.fr.setAttribute("src",GSRT_URL);
  }
}
function gsrtPrecarica(){
  if(RTD.game!=="smash")return;
  gsrtMonta();
}
function gsrtCssEsci(){
  if(document.getElementById("gsrt-css"))return;
  try{
    var st=document.createElement("style");st.id="gsrt-css";
    st.textContent="body.gsrt-on #gx-esci.gx-dx,body.gsrt-on #eb-esci.eb-dx{top:calc(4px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}";
    document.head.appendChild(st);
  }catch(e){}
}
function gsrtASchermo(){
  GSRT.wrap.style.display="block";
  gsrtCssEsci();
  try{document.body.classList.add("gsrt-on");}catch(e0){}
  gsrtBlocca();
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){ if(typeof tg2.expand==="function")tg2.expand(); if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes(); }
  }catch(e){}
  gsrtAltezza();
}
var GSRT_TENDINA={bloccati:0,rispenti:0};
(function(){
  function inGioco(){try{return document.body.classList.contains("gsrt-on");}catch(e){return false;}}
  function diario(cosa){
    if(GSRT_TENDINA.bloccati+GSRT_TENDINA.rispenti>6)return;
    try{var s=String((new Error()).stack||"").split("\n").slice(2,5).join(" | ").replace(/https?:[^ )]*\//g,"");
      tonUiDiario("smash-tendina",cosa+" "+s);}catch(e){}
  }
  function tieni(){
    try{
      var tg=window.Telegram&&Telegram.WebApp;if(!tg)return;
      if(!tg.__gsrtSw&&typeof tg.enableVerticalSwipes==="function"){
        var acc=tg.enableVerticalSwipes;
        tg.enableVerticalSwipes=function(){
          if(inGioco()){GSRT_TENDINA.bloccati++;diario("bloccato");return tg;}
          return acc.apply(tg,arguments);
        };
        tg.__gsrtSw=1;
      }
      if(inGioco()&&tg.isVerticalSwipesEnabled===true&&typeof tg.disableVerticalSwipes==="function"){
        tg.disableVerticalSwipes();GSRT_TENDINA.rispenti++;diario("rispento");
      }
    }catch(e){}
  }
  tieni();setInterval(tieni,1000);
})();
function gsrtViaDalloSchermo(){
  gsrtSblocca();
  try{document.body.classList.remove("gsrt-on");}catch(e0){}
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2&&typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();}catch(e){}
  GSRT.wrap.style.display="none";
}
var GSRT_TIFO="",GSRT_TIFO_AGG=false;
function gsrtTifo(){
  try{
    if(!GSRT.aperto||GSRT.spec||RTD.spec||RTD.ui!=="match"||RTD.game!=="smash")return;
    var ch=String(trnChatCh()||"");if(ch.indexOf("r:")!==0)return;
    var T=TRN.chat||[],L=T.slice(-2);
    var k=ch+"|"+T.length+"|"+(L.length?String(L[L.length-1].x||""):"");
    if(k===GSRT_TIFO)return;GSRT_TIFO=k;
    if(!L.length)return;
    gsrtGiu({t:"chat",righe:L.map(function(c){return {n:String(c.n||"?").slice(0,24),x:String(c.x||"").slice(0,140),g:c.g?1:0};})});
  }catch(e){}
}
function gsrtTifoAggancia(){
  if(GSRT_TIFO_AGG||typeof trnTickerPaint!=="function")return;
  GSRT_TIFO_AGG=true;
  var v=trnTickerPaint;
  trnTickerPaint=function(){var r=v.apply(this,arguments);gsrtTifo();return r;};
}
function rtdShowSmashRT(m,spec){
  RTD.ui="match";rtdOvClose();
  gsrtCodaStart(m,spec);if(m&&!spec)GSRT.menu=false;
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
  if(typeof GEORT!=="undefined"&&GEORT.aperto&&typeof rtdChiudiGeoRT==="function")rtdChiudiGeoRT(true);
  RTD.ctx=null;RTD.cv=null;
  if(typeof rtdStopRaf==="function")rtdStopRaf();
  RTD._rafT=0;RTD._hintOff=1;
  try{GBMusic.stop();}catch(e){}
  gsrtMonta();
  var eraNascosto=GSRT.aperto&&GSRT.nascosto;
  var eraChiuso=!GSRT.aperto;
  if(eraChiuso)GSRT.coda=[];
  if(m){
    var firma=String((m.map&&m.map.firma!=null)?m.map.firma:"");
    if(GSRT.aperto&&GSRT.firma!==firma){GSRT.coda=[];GSRT.fineScena=false;}
    if(!GSRT.aperto)GSRT.fineScena=false;
    GSRT.firma=firma;GSRT.start=m;
    if(GSRT.pronto&&window.gsrtFoto)setTimeout(gsrtFoto,0);
    GSRT.spec=!!spec;GSRT.fuori=false;
    GSRT_TIFO="";gsrtTifoAggancia();
    var mv=(m.map&&m.map.ver!=null)?String(m.map.ver):"";
    if(mv&&mv!==GSRT_MOTORE_VER&&!GSRT.verAvviso){
      GSRT.verAvviso=true;
      try{toast("GAMBLER SMASH è stato aggiornato: chiudi e riapri la mini app","err",6000);}catch(e1){}
    }
  }
  GSRT.aperto=true;GSRT.nascosto=false;
  gsrtASchermo();
  if(eraNascosto||eraChiuso)gsrtGiu({t:"riprendi"});
  if(!m)rtdSend({t:"rientra"});
  if(m&&spec){
    var mm={},k;for(k in m)mm[k]=m[k];
    mm.t="start";mm.spec=true;mm.you=null;mm.tour=false;
    gsrtGiu(mm);
    return;
  }
  if(m)gsrtGiu(m);
}
function rtdChiudiSmashRT(forza){
  if(!GSRT.wrap||!GSRT.fr)return;
  var visibile=(GSRT.wrap.style.display==="block");
  if(!GSRT.aperto&&!visibile&&!forza)return;
  gsrtViaDalloSchermo();
  if(!forza&&GSRT.aperto&&RTD.ui==="match"){
    GSRT.nascosto=true;
    gsrtGiu({t:"pausa"});
    return;
  }
  GSRT.aperto=false;GSRT.nascosto=false;GSRT.pronto=false;GSRT.coda=[];GSRT.codaPiena=false;GSRT.menu=false;
  GSRT.firma="";GSRT.start=null;GSRT.fineScena=false;
  GSRT.spec=false;GSRT.fuori=false;
  if(GSRT.fr.getAttribute("src")!=="about:blank")GSRT.fr.setAttribute("src","about:blank");
}
function gsrtTettoFine(){ return GSRT_TETTO_FINE; }
function gsrtSpecOver(m){
  RTD.over=m;RTD.specRid=null;
  gsrtGiu(m);
  if(GSRT.fineScena||GSRT.nascosto){rtdSpecOver(m);return;}
  if(RTD.overTmr)clearTimeout(RTD.overTmr);
  RTD.overTmr=setTimeout(function(){RTD.overTmr=null;if(RTD.over===m&&RTD.ui==="match")rtdSpecOver(m);},gsrtTettoFine());
}
function gsrtRicercaPosta(){
  var c=(typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="smash")?LOB.card:null;
  if(!c)return null;
  if(c.gratis||!(Number(c.stake_eur)>0))return 0;
  return Number(c.stake_eur);
}
function gsrtRicercaGratis(gratis){
  if(RTD.game!=="smash"||RTD.tour||RTD.practice||RTD.ui!=="search")return;
  var el=document.getElementById("arc-body");if(!el)return;
  var pz=document.getElementById("arc-prize");
  if(pz&&gratis)pz.textContent="🎁 GRATIS";
  var bt=el.querySelector("button[onclick=\"rtdLeave()\"]");
  if(bt)bt.textContent=gratis?"✖ ESCI":"✖ ANNULLA (rimborso)";
}
function gsrtPosta(m){
  try{ GSRT.fr.contentWindow.postMessage({gs:"giu",m:m},GSRT_ORIGIN); }catch(e){}
}
function gsrtSenzaEventi(m){ return !!(m&&m.t==="s"&&!(m.feed&&m.feed.length)); }
function gsrtSoloRelay(m){ return !!(m&&m.t==="gs"&&(m.o==="i"||m.o==="a"||m.o==="pp")); }
function gsrtGiu(m){
  if(!GSRT.aperto||!GSRT.fr)return;
  if(GSRT.pronto){gsrtPosta(m);return;}
  if(gsrtSoloRelay(m))return;
  var c=GSRT.coda,i;
  if(gsrtSenzaEventi(m)){
    for(i=c.length-1;i>=0;i--){ if(gsrtSenzaEventi(c[i])){c.splice(i,1);break;} }
  }
  c.push(m);
  if(c.length>GSRT_CODA_MAX){
    var k=0;
    for(i=0;i<c.length;i++){ if(c[i]&&c[i].t==="s"){k=i;break;} }
    c.splice(k,1);
    if(!GSRT.codaPiena){
      GSRT.codaPiena=true;
      RTD._rerr="gs:coda piena prima del pronto";
      try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"smash",msg:"coda piena prima del pronto"}));}catch(e){}
    }
  }
}
function gsrtRicevi(m){
  var t=m&&m.t;
  if(t==="gs"){
    if(GSRT.aperto)gsrtGiu(m);
    return true;
  }
  if((t==="lobby"||t==="left"||t==="refund"||t==="err"||t==="riv_invito"||t==="hello_ok")&&gsrtCodaRicevi(m))return true;
  if(t==="s"){
    if(m.g!=="smash")return false;
    GSRT.fuori=!!(m.you&&m.you.sg>=0&&m.you.vivo===false&&m.fase==="gioco");
    gsrtGiu(m);
    return true;
  }
  if(t==="err"&&/^gs_/.test(String(m.code||""))){gsrtGiu(m);return true;}
  if(t==="esce"&&m.game==="smash"){gsrtGiu(m);return false;}
  if(t==="hello_ok"&&GSRT.aperto&&!GSRT.spec&&RTD.game==="smash"&&RTD.ui==="match"&&!RTD.over)rtdSend({t:"rientra"});
  return false;
}
window.addEventListener("message",function(ev){
  if(ev.origin!==GSRT_ORIGIN)return;
  var d=ev.data;if(!d||typeof d!=="object"||d.gs===undefined)return;
  if(!GSRT.fr||ev.source!==GSRT.fr.contentWindow)return;
  if(d.gs==="su"){
    if(!GSRT.aperto)return;
    var o=gsrtSu(d.m,GSRT.spec||RTD.spec);
    if(o)rtdSend(o);
    return;
  }
  if(d.gs==="pronto"){
    GSRT.pronto=true;
    RTD._wsT=performance.now();
    gsrtBordi();
    if(GSRT.aperto){
      var c=GSRT.coda;GSRT.coda=[];
      for(var i=0;i<c.length;i++)gsrtPosta(c[i]);
      if(window.gsrtFoto)setTimeout(gsrtFoto,0);
      if(GSRT.codaPiena){GSRT.codaPiena=false;if(!GSRT.spec)rtdSend({t:"rientra"});}
      return;
    }
    GSRT.coda=[];
    gsrtPosta(GSRT.menu?{t:"menu"}:{t:"pausa"});
    return;
  }
  if(d.gs==="fine_scena"){
    GSRT.fineScena=true;
    if(GSRT.spec&&RTD.spec&&RTD.over&&RTD.over.game==="smash"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdSpecOver(RTD.over);return;
    }
    if(RTD.over&&RTD.over.game==="smash"&&RTD.ui==="match"&&RTD.overTmr){
      clearTimeout(RTD.overTmr);RTD.overTmr=null;rtdShowOver(RTD.over);
    }
    return;
  }
  if(d.gs==="esci"){
    if(!GSRT.aperto)return;
    if(GSRT.spec||RTD.spec){rtdSpecExit();return;}
    if(RTD.over&&RTD.over.game==="smash"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);return;
    }
    if(d.fuori&&GSRT.fuori&&RTD.ui==="match"&&!RTD.practice){
      var cx=null;
      try{cx=(typeof gxCtx==="function")?gxCtx():null;}catch(e1){cx=null;}
      if(cx&&cx.fam==="rtd"&&typeof gxManda==="function"&&typeof gxInfo==="function")gxManda(cx,gxInfo(cx));
      else rtdSend({t:"abbandona"});
      return;
    }
    rtdBack();return;
  }
  if(d.gs==="err"){
    RTD._rerr="gs:"+String(d.msg||"").slice(0,60);
    try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"smash",msg:String(d.msg||"").slice(0,300)}));}catch(e){}
    return;
  }
});
function gsrtEuro(v){var s=lupEuro(v);return (window.GB_LANG==="en")?s.replace(",","."):s;}
function rtdShowOverSmash(m){
  var pratica=!!(m.practice||RTD.practice);
  var gratis=!!m.gratis||!(Number(m.pot_eur)>0);
  var chi=(m.winner!=null)?String(m.winner_name||rtdName(m.winner)||""):String(m.winner_name||"");
  var tasti=gsrtTastiFine(m);
  var tastiPratica='<div class="tw-ov-btns"><button class="action-btn train-btn" onclick="rtdPracAgain()">🔁 ANCORA · GRATIS</button>'
    +'<button class="action-btn gold" onclick="rtdPracToReal()">💰 GIOCA VERA</button></div>';
  var h;
  if(m.motivo==="pari"&&m.winner==null&&!m.abbandono){
    TWS.play("lose");
    h='<div style="font-size:44px;">🤝</div><div class="tw-lose-t">PAREGGIO</div>'
     +'<div class="tw-ov-sub">'+((pratica||gratis)?"Tempo scaduto alla pari: non vince nessuno.":(m.rimborso_in_sospeso?"Tempo scaduto alla pari: la posta torna sul saldo fra poco, stiamo chiudendo i conti.":"Tempo scaduto alla pari: la posta è tornata sul saldo."))+'</div>'
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
    var perche=(m.motivo==="versione")?"Una pagina di gioco era vecchia: chiudi e riapri la mini app."
      :"La partita non è arrivata in fondo.";
    h='<div style="font-size:44px;">🧯</div><div class="tw-lose-t">PARTITA ANNULLATA</div>'
     +'<div class="tw-ov-sub">'+perche+((pratica||gratis)?"":(m.rimborso_in_sospeso?" La posta torna sul saldo fra poco.":" Posta rimborsata."))+'</div>'
     +tasti;
    rtdOv(h,true);
    rtdShowLobby(true);
    if(typeof loadBalance==="function")loadBalance();
    if(m.rimborso_in_sospeso&&typeof loadBalance==="function"){setTimeout(loadBalance,8000);setTimeout(loadBalance,25000);}
    return;
  }
  var riga=m.you_won?'<div class="tw-ov-sub">L’ARENA È TUA</div>'
    :(chi?'<div class="tw-ov-sub"><b>'+trnEsc(chi)+'</b> vince la rissa</div>':'<div class="tw-ov-sub">PARTITA FINITA</div>');
  if(pratica){
    TWS.play(m.you_won?"win":"lose");
    h=riga.replace('class="tw-ov-sub"','class="tw-ov-sub" style="margin-bottom:6px;color:#ffea00;"')
     +practiceOverHTML(!!m.you_won,"rtdPracAgain","rtdPracToReal");
    rtdOv(h,true);
    RTD.ui="";
    rtdShowLobby(true);
    return;
  }
  if(m.abbandono){
    TWS.play("lose");
    h='<div style="font-size:44px;">🏳️</div><div class="tw-lose-t">HAI LASCIATO L’ARENA</div>'
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
     +(gratis?"":'<div class="tw-win-prize">+€ '+gsrtEuro(premio)+'</div>')
     +((!gratis&&m.premio_in_sospeso)?'<div class="tw-ov-sub">Il premio arriva sul saldo fra poco: stiamo chiudendo i conti</div>':"")
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+gsrtEuro(m.pot_eur)+'</div>');
  }else{
    TWS.play("lose");
    h='<div style="font-size:44px;">💀</div><div class="tw-lose-t">SCONFITTA</div>'
     +riga
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+gsrtEuro(m.pot_eur)+'</div>');
  }
  h+=tasti;
  rtdOv(h,true);
  rtdShowLobby(true);
  if(typeof loadBalance==="function")loadBalance();
  if(m.premio_in_sospeso&&typeof loadBalance==="function"){setTimeout(loadBalance,8000);setTimeout(loadBalance,25000);}
}
var GSRT_CQ=null;
var GSRT_RIV=null;
var GSRT_INV=null;
var GSRT_AVV=null;
var GSRT_CQ_T=0;
function gsrtVerPagina(){try{var v=GSRT.fr&&GSRT.fr.contentWindow&&GSRT.fr.contentWindow.GSRETE_VER;if(typeof v==="string"&&/^[0-9a-f]{12}$/.test(v))GSRT_MOTORE_VER=v;}catch(e){}}
window.addEventListener("message",function(ev){try{if(ev.origin===GSRT_ORIGIN&&ev.data&&ev.data.gs==="pronto"&&GSRT.fr&&ev.source===GSRT.fr.contentWindow)gsrtVerPagina();}catch(e){}});
function gsrtEN(){return window.GB_LANG==="en";}
function gsrtL(it,en){return gsrtEN()?en:it;}
function gsrtQui(){return typeof CUR==="undefined"||CUR==="arc";}
function gsrtEsc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function gsrtMmss(ms){var s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+":"+(s%60<10?"0":"")+(s%60);}
function gsrtCodaCss(){
  if(document.getElementById("gsrt-cq-css"))return;
  var st=document.createElement("style");st.id="gsrt-cq-css";
  st.textContent=
   "#gsrt-cq{position:absolute;left:50%;bottom:calc(12px + max(env(safe-area-inset-bottom,0px),var(--tg-bottom,0px)));transform:translateX(-50%);z-index:3;display:none;align-items:center;gap:12px;"
  +"max-width:calc(100% - 24px);padding:9px 10px 9px 16px;border-radius:16px;border:2px solid transparent;color:#fff;font-family:'Russo One',var(--gb-f-disp,Impact),sans-serif;"
  +"background:linear-gradient(180deg,rgba(46,22,82,.97),rgba(12,6,26,.98)) padding-box,linear-gradient(180deg,#fff 0%,#a3abc0 26%,#464c60 52%,#eef1fa 66%,#7c8499 100%) border-box;"
  +"box-shadow:0 0 0 2px #120420,0 0 14px #ffd23b66,0 6px 0 rgba(0,0,0,.6);pointer-events:auto;touch-action:manipulation}"
  +"#gsrt-cq.on{display:flex}"
  +"#gsrt-cq .gq-dot{flex:none;width:14px;height:14px;border-radius:50%;background:#ffd23b;box-shadow:0 0 0 0 #ffd23b99;animation:gqPulse 1.3s infinite}"
  +"#gsrt-cq.inv .gq-dot{background:#5dff7a;box-shadow:0 0 0 0 #5dff7a99}"
  +"@keyframes gqPulse{0%{box-shadow:0 0 0 0 rgba(255,210,59,.7)}70%{box-shadow:0 0 0 12px rgba(255,210,59,0)}100%{box-shadow:0 0 0 0 rgba(255,210,59,0)}}"
  +"#gsrt-cq .gq-tx{display:flex;flex-direction:column;gap:3px;min-width:0}"
  +"#gsrt-cq .gq-tx b{font-weight:400;font-size:15px;letter-spacing:1.5px;color:#ffd23b;text-shadow:0 2px 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
  +"#gsrt-cq .gq-tx span{font:700 12px/1.25 system-ui,sans-serif;color:#e6dcff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
  +"#gsrt-cq button{flex:none;min-height:40px;padding:0 14px;border:0;border-radius:11px;font:400 13px 'Russo One',var(--gb-f-disp,Impact),sans-serif;letter-spacing:1px;color:#fff;background:linear-gradient(180deg,#ff5468,#b8102a);cursor:pointer}"
  +"#gsrt-cq button.ok{background:linear-gradient(180deg,#5dff7a,#14a83a);color:#06240f}"
  +"#gsrt-cq button.x{background:rgba(255,255,255,.12);min-width:40px;padding:0}"
  +"#gsrt-riv{position:absolute;inset:0;z-index:4;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px 18px;text-align:center;color:#fff;"
  +"font-family:'Russo One',var(--gb-f-disp,Impact),sans-serif;background:radial-gradient(700px 420px at 50% 30%,#3a1766 0%,#140a26 60%,#0c0918 100%)}"
  +"#gsrt-riv.on{display:flex}"
  +"#gsrt-riv .gr-t{font-size:clamp(40px,11vw,74px);letter-spacing:3px;color:#ffd23b;-webkit-text-stroke:2px #2a0040;paint-order:stroke fill;text-shadow:0 4px 0 #000,0 0 26px rgba(255,210,59,.6);line-height:1}"
  +"#gsrt-riv .gr-vs{font-size:clamp(17px,4.6vw,24px);letter-spacing:1px;text-shadow:0 2px 0 #000}#gsrt-riv .gr-vs i{font-style:normal;color:#ff5468;margin:0 10px}"
  +"#gsrt-riv .gr-ring{position:relative;width:118px;height:118px}#gsrt-riv .gr-ring svg{position:absolute;inset:0;transform:rotate(-90deg)}"
  +"#gsrt-riv .gr-ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:400;font-size:38px;text-shadow:0 2px 0 #000}"
  +"#gsrt-riv .gr-s{font:700 15px/1.4 system-ui,sans-serif;color:#e6dcff;max-width:440px}#gsrt-riv .gr-s b{color:#ffd23b}"
  +"#gsrt-riv .gr-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}"
  +"#gsrt-riv button{min-height:50px;min-width:150px;padding:0 20px;border:0;border-radius:14px;font:400 16px 'Russo One',var(--gb-f-disp,Impact),sans-serif;letter-spacing:1px;color:#fff;background:linear-gradient(180deg,#ff5468,#b8102a);cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.55)}"
  +"#gsrt-riv button.or{background:linear-gradient(180deg,#ffe066,#e0a400);color:#2a1400}#gsrt-riv button.gh{background:rgba(255,255,255,.12)}"
  +"#gsrt-inv{margin:6px 0 10px;padding:10px 12px;border-radius:12px;background:rgba(93,255,122,.12);border:1px solid rgba(93,255,122,.55);color:#d9ffe0;font-weight:700;font-size:14px}"
  +"#gsrt-inv b{color:#5dff7a}";
  document.head.appendChild(st);
}
function gsrtCodaEl(id,cls){
  if(!GSRT.wrap)return null;
  var el=document.getElementById(id);
  if(!el){gsrtCodaCss();el=document.createElement("div");el.id=id;GSRT.wrap.appendChild(el);}
  return el;
}
function gsrtCodaTic(){
  var serve=!!(GSRT_CQ||GSRT_RIV||GSRT_INV||GSRT_AVV);
  if(GSRT_AVV&&Date.now()>GSRT_AVV.fino)GSRT_AVV=null;
  if(GSRT_INV&&Date.now()>GSRT_INV.fino)GSRT_INV=null;
  if(GSRT_CQ&&GSRT_CQ.stato==="annullo"&&Date.now()-GSRT_CQ.t0>8000)GSRT_CQ=null;
  if(GSRT_RIV&&GSRT_RIV.stato==="chiedo"&&!GSRT_RIV.daMandare&&Date.now()-(GSRT_RIV.tq||GSRT_RIV.t0)>8000)gsrtRivScaduta();
  gsrtCodaRidisegna();gsrtRivDisegna();gsrtInvitoFine();
  if(!serve&&GSRT_CQ_T){clearInterval(GSRT_CQ_T);GSRT_CQ_T=0;}
}
function gsrtCodaTicOn(){if(!GSRT_CQ_T)GSRT_CQ_T=setInterval(gsrtCodaTic,250);}
function gsrtCodaSegna(stato,o){
  o=o||{};
  GSRT_CQ={stato:stato,tier:o.tier||"",sq:o.sq?1:0,modoN:o.n||0,n:0,cap:0,fino:0,gratis:!!o.gratis,eur:o.gratis?0:(parseFloat(o.tier)||0),t0:Date.now(),lid:o.lid||null,mio:!!o.mio,grp:o.grp||""};
  gsrtCodaTicOn();gsrtCodaRidisegna();
}
function gsrtCodaAvviso(txt,ms){GSRT_AVV={txt:String(txt||""),fino:Date.now()+(ms||3500)};gsrtCodaTicOn();gsrtCodaRidisegna();}
function gsrtCodaVia(){
  GSRT_CQ=null;GSRT_RIV=null;GSRT_AVV=null;
  var a=document.getElementById("gsrt-cq");if(a)a.className="";
  var b=document.getElementById("gsrt-riv");if(b)b.className="";
}
function gsrtCodaStart(m,spec){
  gsrtCodaVia();GSRT_INV=null;
  if(!m||spec||m.practice||m.tour)return;
  try{
    var mp=m.map||{},me=String(m.you),avv=[],seg=mp.seggi||[],i;
    for(i=0;i<seg.length;i++)if(seg[i]&&!seg[i].bot&&String(seg[i].uid)!==me)avv.push(String(seg[i].nome||"?").slice(0,24));
    var eur=Number(m.stake_eur)||0,tier=(eur>0)?"":"gratis",fs=GSSOLDI.fasce();
    for(i=0;i<fs.length;i++)if(Math.abs(parseFloat(fs[i])-eur)<1e-6)tier=String(fs[i]);
    var nm=seg.length;if(!(nm>=2&&nm<=4))nm=2;
    GSRT.ultima={tier:tier,eur:eur,gratis:!(eur>0),sq:!!mp.squadre,avv:avv,n:avv.length+1,modoN:mp.squadre?0:nm};
  }catch(e){GSRT.ultima=null;}
}
function gsrtCodaMenu(){
  if(GSRT.aperto||!gsrtQui())return;
  gsrtMonta();
  GSRT.menu=true;
  if(GSRT.wrap.style.display!=="block")gsrtASchermo();
  if(GSRT.pronto){gsrtBordi();gsrtPosta({t:"menu"});}
}
function gsrtCodaTesto(e){
  var it={"insufficient balance":["Saldo insufficiente per questa posta","Balance too low for this stake"],
    "already in a lobby":["Sei già in una coda","You are already in a queue"],
    "posta ancora in gioco":["La tua posta è ancora nella partita di prima","Your stake is still in the previous match"],
    "liquidazione in corso":["Stiamo chiudendo i conti della partita di prima: riprova fra poco","Settling the previous match: try again in a moment"],
    "gambler smash a soldi non ancora aperto":["GAMBLER SMASH a soldi non è ancora aperto","GAMBLER SMASH for money is not open yet"],
    "gambler smash: pagina vecchia, riapri la mini app":["GAMBLER SMASH è stato aggiornato: chiudi e riapri la mini app","GAMBLER SMASH was updated: close and reopen the mini app"],
    "gia impegnato":["Sei già a un tavolo","You are already at a table"]};
  var v=it[e];return v?gsrtL(v[0],v[1]):String(e||gsrtL("Errore","Error")).slice(0,90);
}
function gsrtCodaRidisegna(){
  var el=gsrtCodaEl("gsrt-cq");if(!el)return;
  var vis=GSRT.wrap&&GSRT.wrap.style.display==="block"&&!GSRT.aperto&&!(GSRT_RIV&&GSRT_RIV.stato!=="annullo");
  var c=GSRT_CQ,a=GSRT_AVV&&Date.now()<GSRT_AVV.fino?GSRT_AVV:null,inv=(!c&&GSRT_INV&&Date.now()<GSRT_INV.fino)?GSRT_INV:null;
  if(!vis||(!c&&!a&&!inv)){el.className="";el.innerHTML="";el._k="";return;}
  var t1="",t2="",bt="",now=Date.now(),cls="on";
  if(c){
    var eur=c.eur>0?gsrtEuro(c.eur):"",posta=c.gratis?gsrtL("GRATIS","FREE"):(eur?"€ "+eur:"");
    if(c.stato==="entro"){t1=gsrtL("ENTRO IN CODA…","JOINING THE QUEUE…");t2=posta;}
    else if(c.stato==="annullo"){t1=gsrtL("ESCO DALLA CODA…","LEAVING THE QUEUE…");t2=c.gratis?"":gsrtL("la posta torna sul saldo","your stake goes back to your balance");}
    else if(c.stato==="lobby"){t1="LOBBY "+c.n+"/"+c.cap;t2=[posta,c.mio&&c.grp?gsrtL("invito in ","invite in ")+gsrtEsc(c.grp):"",c.n>=c.cap?gsrtL("si parte","starting"):(c.fino?gsrtL("si chiude fra ","closes in ")+gsrtMmss(c.fino-now):"")].filter(Boolean).join(" · ");}
    else{t1=gsrtL("CERCO AVVERSARI","FINDING OPPONENTS")+" "+c.n+"/"+c.cap;
      t2=[posta,c.fino?(c.n>=2?gsrtL("si parte fra ","starts in "):gsrtL("attesa max ","max wait "))+gsrtMmss(c.fino-now):""].filter(Boolean).join(" · ");}
    if(c.stato!=="annullo")bt=(c.mio&&c.lid?'<button class="x" style="min-width:64px;padding:0 10px" onclick="GSSOLDI.link()">'+gsrtL("LINK","LINK")+'</button>':"")+'<button onclick="gsrtCodaAnnulla()">'+gsrtL("ANNULLA","CANCEL")+'</button>';
    if(a){t2=t1+(t2?" · "+t2:"");t1=a.txt;}
  }else if(inv){
    cls="on inv";t1=gsrtL(gsrtEsc(inv.da||"L’avversario")+" VUOLE LA RIVINCITA",gsrtEsc(inv.da||"Your opponent")+" WANTS A REMATCH");
    t2=(inv.gratis?gsrtL("gratis","free"):"€ "+gsrtEuro(inv.eur))+" · "+Math.max(0,Math.ceil((inv.fino-now)/1000))+" s";
    bt='<button class="ok" onclick="gsrtRivincita()">'+gsrtL("ACCETTA","ACCEPT")+'</button><button class="x" onclick="GSRT_INV=null;gsrtCodaRidisegna()">✕</button>';
  }else{t1=a.txt;}
  var h='<i class="gq-dot"></i><div class="gq-tx"><b>'+t1+'</b>'+(t2?'<span>'+t2+'</span>':'')+'</div>'+bt;
  if(el._k!==h){el._k=h;el.innerHTML=h;}
  el.className=cls;
}
function gsrtCodaAnnulla(){
  var c=GSRT_CQ;if(!c||c.stato==="annullo")return;
  c.stato="annullo";c.t0=Date.now();
  try{TWS.play("click");}catch(e){}
  rtdLeave();
  gsrtCodaRidisegna();
}
function gsrtCodaRicevi(m){
  var t=m.t;
  if(t==="hello_ok"&&GSRT.joinPend){var jp=GSRT.joinPend;GSRT.joinPend=null;rtdSend(jp);}
  if(t==="hello_ok"){if(GSRT_RIV&&GSRT_RIV.stato==="chiedo"&&GSRT_RIV.daMandare){GSRT_RIV.daMandare=false;GSRT_RIV.tq=Date.now();rtdSend({t:"rivincita"});}return false;}
  if(t==="riv_invito"){if(m.game==="smash")gsrtInvito(m);return true;}
  if(RTD.game!=="smash"||RTD.tour||RTD.spec||RTD.practice)return false;
  if(t==="lobby"){
    if(m.game!=="smash"||m.tour)return false;
    if((GSRT_CQ&&GSRT_CQ.stato==="annullo")||(GSRT_RIV&&GSRT_RIV.stato==="annullo")){rtdLeave();return true;}
    var n=Number(m.players)||1,cap=Number(m.cap)||2,fino=(m.starts_in!=null)?(Date.now()+Number(m.starts_in)*1000):0,eur=Number(m.stake_eur)||0;
    if(GSRT_RIV&&(GSRT_RIV.stato==="chiedo"||GSRT_RIV.stato==="attesa")){
      GSRT_RIV.stato="attesa";GSRT_RIV.n=n;GSRT_RIV.cap=cap;GSRT_RIV.fino=fino;RTD.ui="search";gsrtRivDisegna();
      return false;
    }
    if(!GSRT_CQ)GSRT_CQ={stato:"coda",tier:String(m.tier||""),sq:0,t0:Date.now()};
    GSRT_CQ.stato=m.lid?"lobby":"coda";GSRT_CQ.n=n;GSRT_CQ.cap=cap;GSRT_CQ.fino=fino;GSRT_CQ.eur=eur;GSRT_CQ.gratis=!(eur>0);GSRT_CQ.lid=m.lid||null;
    gsrtCodaMenu();gsrtCodaTicOn();gsrtCodaRidisegna();
    return false;
  }
  if(t==="left"){
    var c=GSRT_CQ,r=GSRT_RIV;GSRT_CQ=null;GSRT_RIV=null;
    if((GSRT.uscito&&Date.now()-GSRT.uscito<8000)||!gsrtQui()){GSRT.uscito=0;RTD.ui="";gsrtRivDisegna();gsrtCodaRidisegna();if(typeof loadBalance==="function")loadBalance();return true;}
    if(c||r){var g=c?c.gratis:(r&&r.gratis);gsrtCodaAvviso(g?gsrtL("Sei uscito dalla coda","You left the queue"):gsrtL("Sei uscito dalla coda: posta resa","You left the queue: stake returned"),3200);}
    gsrtRivDisegna();
    return false;
  }
  if(t==="refund"){
    if(GSRT_RIV&&GSRT_RIV.stato!=="fine"){gsrtRivScaduta();return true;}
    if(GSRT_CQ){var g2=GSRT_CQ.gratis;GSRT_CQ=null;gsrtCodaAvviso(g2?gsrtL("Nessuno sfidante: riprova","Nobody joined: try again"):gsrtL("Nessuno sfidante: posta resa","Nobody joined: stake returned"),4500);}
    return false;
  }
  if(t==="err"){
    var e=String(m.msg||"");
    if(/^gs_/.test(String(m.code||"")))return false;
    if(GSRT_RIV&&GSRT_RIV.stato==="chiedo"){gsrtRivErr(e);return true;}
    if(GSRT_RIV&&GSRT_RIV.stato==="annullo"&&e==="not in a lobby")return true;
    if(GSRT_CQ&&GSRT_CQ.stato==="annullo"&&e==="not in a lobby")return true;
    if(GSRT_CQ&&GSRT_CQ.stato==="entro"){GSRT_CQ=null;gsrtCodaAvviso(gsrtCodaTesto(e),4500);}
    return false;
  }
  return false;
}
function gsrtInvito(m){
  if(GSRT_RIV&&GSRT_RIV.stato!=="fine")return;
  GSRT_INV={da:String(m.da||"").slice(0,24),fino:Date.now()+Math.max(1,Number(m.scade)||20)*1000,gratis:!!m.gratis,eur:Number(m.eur)||0};
  gsrtCodaTicOn();
  try{tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred("warning");}catch(e){}
  if(!gsrtInvitoFine()&&!(GSRT.wrap&&GSRT.wrap.style.display==="block"))try{toast(gsrtL((GSRT_INV.da||"L’avversario")+" vuole la rivincita a GAMBLER SMASH",(GSRT_INV.da||"Your opponent")+" wants a GAMBLER SMASH rematch"),"ok",3500);}catch(e2){}
  gsrtCodaRidisegna();
}
function gsrtInvitoRiga(){
  var v=GSRT_INV;if(!v||Date.now()>v.fino)return "";
  return '<div id="gsrt-inv">⚡ '+gsrtL('<b>'+gsrtEsc(v.da||"L’avversario")+'</b> vuole la rivincita','<b>'+gsrtEsc(v.da||"Your opponent")+'</b> wants a rematch')
    +' · <span class="gi-s">'+Math.max(0,Math.ceil((v.fino-Date.now())/1000))+' s</span></div>';
}
function gsrtInvitoFine(){
  var ov=document.getElementById("arc-overlay"),mm=document.getElementById("arc-modal");
  if(!(RTD.ui==="over"&&RTD.game==="smash"&&ov&&ov.classList.contains("show")&&mm&&mm.querySelector("[data-gsriv]")))return false;
  var el=document.getElementById("gsrt-inv"),h=gsrtInvitoRiga();
  if(!h){if(el)el.remove();return true;}
  if(!el){var b=mm.querySelector(".tw-ov-btns");if(b)b.insertAdjacentHTML("beforebegin",h);var rb=mm.querySelector("[data-gsriv]");if(rb)rb.textContent=gsrtL("🔁 ACCETTA LA RIVINCITA","🔁 ACCEPT THE REMATCH");}
  else{var s=el.querySelector(".gi-s");if(s)s.textContent=Math.max(0,Math.ceil((GSRT_INV.fino-Date.now())/1000))+" s";}
  return true;
}
function gsrtTastiFine(m){
  var inv=gsrtInvitoRiga();
  return inv+'<div class="tw-ov-btns" style="flex-wrap:wrap"><button class="action-btn gold" data-gsriv="1" style="flex:1 1 100%" onclick="gsrtRivincita()">'
    +(inv?gsrtL("🔁 ACCETTA LA RIVINCITA","🔁 ACCEPT THE REMATCH"):LBL_AGAIN)+'</button>'
    +'<button class="action-btn" onclick="rtdAgain()">🤜 '+gsrtL("MENU SMASH","SMASH MENU")+'</button>'
    +'<button class="action-btn" onclick="rtdAgain();go(&quot;duel&quot;)">⚔️ PvP ARENA</button></div>';
}
function gsrtRivincita(){
  if(RTD.game!=="smash"||RTD.tour||RTD.spec||RTD.practice)return;
  if(GSRT_RIV&&GSRT_RIV.stato!=="fine")return;
  if(RTD.ui==="match"||GSRT_CQ)return;
  var u=GSRT.ultima;
  if(!u){rtdAgain();return;}
  try{TWS.play("click");tg.HapticFeedback&&tg.HapticFeedback.impactOccurred("medium");}catch(e){}
  GSRT_INV=null;GSRT_AVV=null;
  GSRT_RIV={stato:"chiedo",tier:u.tier,sq:u.sq,gratis:u.gratis,eur:u.eur,avv:u.avv||[],n:0,cap:u.n||2,modoN:u.modoN||0,fino:0,prove:0,t0:Date.now()};
  RTD.ovSticky=false;var o=document.getElementById("arc-overlay");if(o)o.classList.remove("show");
  if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
  RTD.over=null;RTD.ui="search";
  rtdChiudiSmashRT(true);
  gsrtMonta();GSRT.menu=false;gsrtASchermo();
  gsrtCodaTicOn();gsrtRivDisegna();gsrtCodaRidisegna();
  GSRT_RIV.tq=Date.now();
  if(RTD.wsOk&&RTD.ws&&RTD.ws.readyState===1)rtdSend({t:"rivincita"});
  else{GSRT_RIV.daMandare=true;try{rtdConnect();}catch(e3){}}
}
function gsrtRivErr(e){
  var r=GSRT_RIV;if(!r)return;
  if((e==="liquidazione in corso"||e==="posta ancora in gioco"||e==="partita ancora in corso"||e==="already in a lobby")&&r.prove<12){
    r.prove++;setTimeout(function(){if(GSRT_RIV===r&&r.stato==="chiedo"&&gsrtQui()){r.tq=Date.now();rtdSend({t:"rivincita"});}},1500);r.tq=Date.now()+1500;return;
  }
  if(e==="rivincita scaduta"||e==="rivincita non disponibile"||e==="partita ancora in corso"||e==="already in a lobby"){gsrtRivScaduta();return;}
  r.stato="fine";r.msg=gsrtCodaTesto(e);RTD.ui="";gsrtRivDisegna();
}
function gsrtRivScaduta(){
  var r=GSRT_RIV;if(!r)return;
  if(!gsrtQui()){GSRT_RIV=null;RTD.ui="";return;}
  var chi=(r.avv&&r.avv.length===1)?r.avv[0]:"";
  if(r.tier){
    GSRT_RIV=null;gsrtRivDisegna();
    GSRT.menu=true;if(GSRT.pronto){gsrtBordi();gsrtPosta({t:"menu"});}
    RTD.tier=r.tier;RTD.sq=r.sq?1:0;
    gsrtCodaSegna("entro",{tier:r.tier,sq:RTD.sq,n:r.modoN,gratis:r.gratis});
    gsrtCodaAvviso(chi?gsrtL(gsrtEsc(chi)+" non ha accettato: cerco un altro avversario",gsrtEsc(chi)+" did not accept: finding another opponent")
                      :gsrtL("Rivincita non partita: cerco un altro avversario","No rematch: finding another opponent"),5000);
    gsrtJoin(r.tier,RTD.sq,r.modoN);
    return;
  }
  r.stato="fine";RTD.ui="";
  r.msg=chi?gsrtL(gsrtEsc(chi)+" non ha accettato la rivincita",gsrtEsc(chi)+" did not accept the rematch"):gsrtL("La rivincita non è partita","The rematch did not start");
  gsrtRivDisegna();
}
function gsrtRivAnnulla(){
  var r=GSRT_RIV;if(!r)return;
  if(r.stato==="fine"){gsrtRivMenu();return;}
  if(r.stato==="annullo")return;
  r.stato="annullo";r.t0=Date.now();
  rtdLeave();
  gsrtRivDisegna();
  setTimeout(function(){if(GSRT_RIV===r&&r.stato==="annullo")gsrtRivMenu();},8000);
}
function gsrtRivMenu(){
  GSRT_RIV=null;RTD.ui="";gsrtRivDisegna();
  if(gsrtQui())rtdShowLobby();
}
function gsrtRivDisegna(){
  var el=gsrtCodaEl("gsrt-riv");if(!el)return;
  var r=GSRT_RIV;
  if(!r||!(GSRT.wrap&&GSRT.wrap.style.display==="block")||GSRT.aperto){el.className="";el.innerHTML="";el._k="";return;}
  var avv=(r.avv&&r.avv.length)?r.avv.map(gsrtEsc).join(", "):gsrtL("gli altri","the others");
  var posta=r.gratis?gsrtL("Partita <b>gratis</b>","<b>Free</b> match")
    :gsrtL("Posta <b>€ "+gsrtEuro(r.eur)+"</b> · se la rivincita non parte torna sul saldo","Stake <b>€"+gsrtEuro(r.eur)+"</b> · back to your balance if the rematch does not start");
  var h='<div class="gr-t">'+gsrtL("RIVINCITA","REMATCH")+'</div><div class="gr-vs">'+gsrtL("TU","YOU")+'<i>VS</i>'+avv+'</div>',btn;
  if(r.stato==="fine"){
    h+='<div class="gr-s">'+r.msg+'</div>';
    btn='<button class="or" onclick="gsrtRivMenu()">🤜 '+gsrtL("MENU SMASH","SMASH MENU")+'</button><button class="gh" onclick="GSRT_RIV=null;GSSOLDI.esci()">'+gsrtL("ESCI","EXIT")+'</button>';
  }else{
    var resta=r.fino?Math.max(0,r.fino-Date.now()):0,tot=25000,fr=r.fino?Math.min(1,resta/tot):1,C=2*Math.PI*52;
    h+='<div class="gr-ring"><svg viewBox="0 0 118 118"><circle cx="59" cy="59" r="52" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="8"/>'
      +'<circle cx="59" cy="59" r="52" fill="none" stroke="#ffd23b" stroke-width="8" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-fr)).toFixed(1)+'"/></svg>'
      +'<b>'+(r.fino?Math.ceil(resta/1000):"…")+'</b></div>';
    var stato=r.stato==="annullo"?gsrtL("Annullo…","Cancelling…")
      :(r.stato==="chiedo"?gsrtL("Chiedo la rivincita…","Asking for a rematch…")
      :gsrtL("Aspetto "+avv+"… <b>"+r.n+"/"+r.cap+"</b>","Waiting for "+avv+"… <b>"+r.n+"/"+r.cap+"</b>"));
    h+='<div class="gr-s">'+stato+'<br>'+posta+'</div>';
    btn=r.stato==="annullo"?"":'<button class="gh" onclick="gsrtRivAnnulla()">'+gsrtL("ANNULLA","CANCEL")+'</button>';
  }
  h+='<div class="gr-btns">'+btn+'</div>';
  if(el._k!==h){el._k=h;el.innerHTML=h;}
  el.className="on";
}
function gsrtGioca(G,t,sq,n){
  t=String(t);var gr=(t==="gratis");
  if(!gr&&G.fasce().indexOf(t)<0)return "posta";
  if(RTD.ui==="match"||RTD.ui==="search"||RTD.tour||RTD.spec||(GSRT_RIV&&GSRT_RIV.stato!=="fine"))return "occupato";
  if(!gr&&G.saldo()<parseFloat(t)-1e-9)return "saldo";
  RTD.game="smash";RTD.practice=false;RTD.tier=t;RTD.sq=(sq==="squadre")?1:0;
  var nn=Number(n);if(!(nn>=2&&nn<=4)||RTD.sq)nn=0;
  gsrtCodaSegna("entro",{tier:t,sq:RTD.sq,n:nn,gratis:gr});
  gsrtJoin(t,RTD.sq,nn);
  return "ok";
}
function gsrtJoin(t,sq,n){
  RTD.practice=false;
  try{TWS.init();TWS.res();}catch(e){}
  try{tg.HapticFeedback&&tg.HapticFeedback.impactOccurred("medium");}catch(e2){}
  var m={t:"join",game:"smash",tier:String(t),sv:GSRT_MOTORE_VER,sq:sq?1:0};
  if(n)m.n=n;
  if(RTD.wsOk&&RTD.ws&&RTD.ws.readyState===1)rtdSend(m);
  else{GSRT.joinPend=m;try{rtdConnect();}catch(e3){}}
}
GSSOLDI.gruppi=function(){
  try{
    if(typeof S==="undefined"||!S.userId||typeof BACKEND==="undefined")return Promise.resolve([]);
    return fetch(BACKEND+"/lobby/groups?user_id="+encodeURIComponent(S.userId)).then(function(r){return r.json();})
      .then(function(d){return ((d&&d.groups)||[]).map(function(g){return {gid:String(g.gid||""),title:String(g.title||"").slice(0,48),cronaca:g.cronaca};});})
      .catch(function(){return [];});
  }catch(e){return Promise.resolve([]);}
};
GSSOLDI.invita=function(o){
  o=o||{};
  if(typeof S==="undefined"||!S.userId)return Promise.resolve({ok:false,err:gsrtL("Apri Smash dalla mini app per invitare","Open Smash from the mini app to invite")});
  if(RTD.ui==="match"||RTD.ui==="search"||GSRT_CQ||(GSRT_RIV&&GSRT_RIV.stato!=="fine"))return Promise.resolve({ok:false,err:gsrtL("Sei già in coda o a un tavolo","You are already queued or at a table")});
  var gratis=!!o.gratis,e=Number(o.eur)||0;
  if(!gratis&&this.saldo()<e-1e-9)return Promise.resolve({ok:false,err:gsrtL("Saldo insufficiente per questa posta","Balance too low for this stake")});
  if(GSRT.invBusy)return Promise.resolve({ok:false,err:""});
  GSRT.invBusy=1;
  return fetch(BACKEND+"/lobby/create",{method:"POST",headers:{"Content-Type":"application/json","ngrok-skip-browser-warning":"1"},
    body:JSON.stringify({user_id:S.userId,username:(S.username||"Player"),game:"smash",posti:Number(o.posti)||2,squadre:!!o.squadre,
      gratis:gratis,stake_eur:(gratis?0:e),group:String(o.group||"")})})
    .then(function(r){return r.json();}).then(function(d){
      GSRT.invBusy=0;
      if(!d||!d.ok)return {ok:false,err:(typeof lobErrIT==="function"?lobErrIT((d&&d.error)||"errore"):String((d&&d.error)||"errore"))};
      try{if(typeof loadBalance==="function")loadBalance();}catch(e1){}
      RTD.game="smash";RTD.practice=false;RTD.tour=false;RTD.spec=false;RTD.sq=o.squadre?1:0;
      GSRT.invLid=String(d.lid||"");
      gsrtCodaSegna("entro",{tier:"",gratis:!!d.gratis,lid:GSRT.invLid,mio:true,grp:o.gruppo||""});
      GSRT_CQ.eur=gratis?0:e;
      var m={t:"join_open",lid:GSRT.invLid,sq:(o.squadre?(o.sq===2?2:1):0)};
      if(RTD.wsOk&&RTD.ws&&RTD.ws.readyState===1)rtdSend(m);else{GSRT.joinPend=m;try{rtdConnect();}catch(e2){}}
      return {ok:true,lid:GSRT.invLid,annunciata:!!d.annunciata,avviso:d.avviso?(typeof lobErrIT==="function"?lobErrIT(d.avviso):String(d.avviso)):""};
    }).catch(function(){GSRT.invBusy=0;return {ok:false,err:gsrtL("Errore di rete","Network error")};});
};
GSSOLDI.link=function(){
  var lid=(GSRT_CQ&&GSRT_CQ.lid)||GSRT.invLid;if(!lid)return false;
  var lnk="https://t.me/"+BOT_USERNAME_FOR_REF+"?startapp="+(typeof gbInvPre==="function"?gbInvPre():"")+"lobby_"+lid;
  var ok=function(){gsrtCodaAvviso(gsrtL("Link copiato: incollalo dove vuoi","Link copied: paste it anywhere"),3000);};
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(lnk).then(ok,function(){gsrtCodaAvviso(lnk,8000);});return true;}}catch(e){}
  gsrtCodaAvviso(lnk,8000);return true;
};
