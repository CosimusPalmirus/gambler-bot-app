var KJRT={wrap:null,fr:null,pronto:false,coda:[],aperto:false,nascosto:false,firma:"",start:null,fineScena:false,loads:0,codaPiena:false,tgEv:false,spec:false,schermo:"",ko:false,uscitoKo:false,mostro:null};
var KJRT_VER="20261120b33cb3";
function kjrtUrl(){return "kaiju.html?guscio=1&v="+KJRT_VER+"&lang="+((window.GB_LANG==="en")?"en":"it");}
var KJRT_URL=kjrtUrl();
var KJRT_ORIGIN=location.origin;
var KJRT_CODA_MAX=2000;
var KJRT_MOSSE={tira:1,chiudi:1,cedi:1,compra:1,rinnova:1,passa:1,jolly:1,tele:1,prendi:1,draft:1};
var KJRT_SPECIE=["gorgo","polpo","robo","kong","squalo","pollo","spino","golem"];
var KJRT_HO_BLOCCATO=false;
function kjrtBlocca(){
  try{ if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();KJRT_HO_BLOCCATO=true;} }catch(e){}
}
function kjrtSblocca(){
  try{ if(KJRT_HO_BLOCCATO&&typeof bx2Sblocca==="function")bx2Sblocca(); }catch(e){}
  KJRT_HO_BLOCCATO=false;
}
function kjrtInt(x,d){
  if(typeof x==="number"&&isFinite(x)&&Math.floor(x)===x&&x>=-2147483648&&x<2147483648)return x;
  return d;
}
function kjrtAx(x){
  if(x===undefined||x===null)return {ok:true,v:null};
  if(typeof x==="number"&&kjrtInt(x,null)!==null)return {ok:true,v:x};
  return {ok:false};
}
function kjrtAltezza(){
  try{
    if(!KJRT.wrap)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){KJRT.wrap.style.height=Math.round(h)+"px";KJRT.wrap.style.bottom="auto";}
    else{KJRT.wrap.style.height="100%";KJRT.wrap.style.bottom="0px";}
  }catch(e){}
}
function kjrtBordi(){
  try{
    if(!KJRT.fr||!KJRT.pronto)return;
    var tg2=window.Telegram&&Telegram.WebApp;
    var sa=(tg2&&tg2.safeAreaInset)||{}, ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){
      var t=(Number(a)||0)+(Number(b)||0), e=(typeof luprtEnv==="function")?luprtEnv(lato):0;
      var v=Math.max(t,e);
      if(!isFinite(v)||v<0)v=0; if(v>200)v=200;
      return Math.round(v);
    }
    kjrtPosta({t:"bordi",top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom),
               left:q("left",sa.left,ca.left),right:q("right",sa.right,ca.right)});
  }catch(e){}
}
function kjrtTelegram(){
  if(KJRT.tgEv)return;KJRT.tgEv=true;
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2&&typeof tg2.onEvent==="function"){
      tg2.onEvent("viewportChanged",function(){kjrtAltezza();kjrtBordi();});
      tg2.onEvent("safeAreaChanged",kjrtBordi);
      tg2.onEvent("contentSafeAreaChanged",kjrtBordi);
      tg2.onEvent("fullscreenChanged",kjrtBordi);
    }
  }catch(e){}
  try{window.addEventListener("orientationchange",function(){setTimeout(kjrtBordi,250);});}catch(e2){}
}
function kjrtMonta(){
  if(!KJRT.wrap){
    var w=document.createElement("div");
    w.id="kjrt-wrap";
    w.style.cssText="position:fixed;inset:0;z-index:9100;display:none;background:#12091a;touch-action:none;overscroll-behavior:none;";
    w.innerHTML="<iframe id='kjrt-fr' title='KAIJU BATTLE' allow='autoplay' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w);
    KJRT.wrap=w;KJRT.fr=w.querySelector("#kjrt-fr");
    KJRT.fr.addEventListener("load",function(){ if(KJRT.fr.getAttribute("src")===KJRT_URL)KJRT.loads++; });
    kjrtTelegram();
  }
  if(KJRT.fr.getAttribute("src")!==KJRT_URL){
    KJRT.pronto=false;KJRT.coda=[];KJRT.codaPiena=false;
    KJRT.fr.setAttribute("src",KJRT_URL);
  }
}
function kjrtPrecarica(){
  if(RTD.game!=="kaiju")return;
  kjrtMonta();
}
function kjrtCssEsci(){
  if(document.getElementById("kjrt-css"))return;
  try{
    var st=document.createElement("style");st.id="kjrt-css";
    st.textContent="body.kj-on #gx-esci.gx-dx,body.kj-on #eb-esci.eb-dx{top:calc(4px + max(env(safe-area-inset-top,0px),var(--tg-top,0px)));}";
    document.head.appendChild(st);
  }catch(e){}
}
function kjrtASchermo(){
  KJRT.wrap.style.display="block";
  kjrtCssEsci();
  try{document.body.classList.add("kj-on");}catch(e0){}
  kjrtBlocca();
  try{
    var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){ if(typeof tg2.expand==="function")tg2.expand(); if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes(); }
  }catch(e){}
  kjrtAltezza();
}
function kjrtViaDalloSchermo(){
  kjrtSblocca();
  try{document.body.classList.remove("kj-on");}catch(e0){}
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2&&typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();}catch(e){}
  KJRT.wrap.style.display="none";
}
function kjrtMostro(){
  try{
    if(KJRT.mostro)return {sp:KJRT.mostro.sp,ti:KJRT.mostro.ti};
    var o=JSON.parse(localStorage.getItem("kj_mostro")||"null");
    if(!o||!o.cfg)return undefined;
    var sp=KJRT_SPECIE.indexOf(String(o.cfg.specie)), ti=o.cfg.tinta|0;
    if(sp<0)return undefined;
    if(!(ti>=0&&ti<=6))ti=0;
    return {sp:sp,ti:ti};
  }catch(e){ return undefined; }
}
function kjrtMandaMostro(){
  try{
    var k=kjrtMostro();
    if(!k)return;
    if(!(RTD.wsOk&&RTD.ws&&RTD.ws.readyState===1))return;
    RTD.ws.send(JSON.stringify({t:"kj_mostro",sp:k.sp,ti:k.ti}));
  }catch(e){}
}
function kjrtIngressoDiKaiju(o){
  if(!o)return false;
  if(o.t==="join"||o.t==="join_ticket")return o.game==="kaiju";
  if(o.t==="join_open"){
    if(RTD.game==="kaiju")return true;
    try{ return !!(typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="kaiju"); }catch(e){ return false; }
  }
  return false;
}
(function(){
  var v=window.rtdSend;
  if(typeof v!=="function"||v.__kj)return;
  var g=function(o){
    try{ if(o&&typeof o.t==="string"&&o.t.charAt(0)==="j"&&kjrtIngressoDiKaiju(o))kjrtMandaMostro(); }catch(e){}
    return v.apply(this,arguments);
  };
  g.__kj=1; window.rtdSend=g;
})();
function kjrtSchermo(quale){
  if(KJRT.aperto)return;
  if(quale!=="editor"&&quale!=="guida")return;
  KJRT.schermo=quale;
  kjrtMonta();
  kjrtASchermo();
  if(KJRT.pronto){kjrtPosta({t:"riprendi"});kjrtPosta({t:"schermo",quale:quale});}
}
function kjrtChiudiSchermo(){
  KJRT.schermo="";
  if(!KJRT.wrap)return;
  kjrtViaDalloSchermo();
  if(KJRT.pronto)kjrtPosta({t:"pausa"});
}
function kjrtLobbyBtn(){
  var st="width:100%;margin:8px 0 2px;background:linear-gradient(135deg,#2a120a,#140806);border:1px solid rgba(255,107,61,.55);color:#ffb59c;";
  return '<button class="action-btn" style="'+st+'" onclick="kjrtSchermo(&quot;editor&quot;)">🦖 IL TUO MOSTRO</button>'
        +'<button class="action-btn" style="'+st+'" onclick="kjrtSchermo(&quot;guida&quot;)">📖 COME SI GIOCA</button>';
}
var KJRT_TIFO="",KJRT_TIFO_AGG=false;
function kjrtTifo(){
  try{
    if(!KJRT.aperto||KJRT.spec||RTD.spec||RTD.ui!=="match"||RTD.game!=="kaiju")return;
    var ch=String(trnChatCh()||"");if(ch.indexOf("r:")!==0)return;
    var T=TRN.chat||[],L=T.slice(-2);
    var k=ch+"|"+T.length+"|"+(L.length?String(L[L.length-1].x||""):"");
    if(k===KJRT_TIFO)return;KJRT_TIFO=k;
    if(!L.length)return;
    kjrtGiu({t:"chat",righe:L.map(function(c){return {n:String(c.n||"?").slice(0,24),x:String(c.x||"").slice(0,140),g:c.g?1:0};})});
  }catch(e){}
}
function kjrtTifoAggancia(){
  if(KJRT_TIFO_AGG||typeof trnTickerPaint!=="function")return;
  KJRT_TIFO_AGG=true;
  var v=trnTickerPaint;
  trnTickerPaint=function(){var r=v.apply(this,arguments);kjrtTifo();return r;};
}
function rtdShowKaijuRT(m,spec){
  RTD.ui="match";rtdOvClose();
  if(typeof BXRT!=="undefined"&&BXRT.aperto)rtdChiudiBoxeRT();
  if(typeof LUPRT!=="undefined"&&LUPRT.aperto&&typeof rtdChiudiLupusRT==="function")rtdChiudiLupusRT(true);
  if(typeof LCRT!=="undefined"&&LCRT.aperto&&typeof rtdChiudiLastcallRT==="function")rtdChiudiLastcallRT(true);
  if(typeof BJRT!=="undefined"&&BJRT.aperto&&typeof rtdChiudiBjRT==="function")rtdChiudiBjRT(true);
  if(typeof PKRT!=="undefined"&&PKRT.aperto&&typeof rtdChiudiPkRT==="function")rtdChiudiPkRT(true);
  if(typeof DPRT!=="undefined"&&DPRT.aperto&&typeof rtdChiudiDeadpeakRT==="function")rtdChiudiDeadpeakRT(true);
  if(typeof SMRT!=="undefined"&&SMRT.aperto&&typeof rtdChiudiSettemezzoRT==="function")rtdChiudiSettemezzoRT(true);
  if(typeof BRRT!=="undefined"&&BRRT.aperto&&typeof rtdChiudiBriscolaRT==="function")rtdChiudiBriscolaRT(true);
  if(typeof TPRT!=="undefined"&&TPRT.aperto&&typeof rtdChiudiTappoRT==="function")rtdChiudiTappoRT(true);
  if(typeof SBRT!=="undefined"&&SBRT.aperto&&typeof rtdChiudiSbancaRT==="function")rtdChiudiSbancaRT(true);
  if(typeof ABRT!=="undefined"&&ABRT.aperto&&typeof rtdChiudiAbissoRT==="function")rtdChiudiAbissoRT(true);
  if(typeof HPRT!=="undefined"&&HPRT.aperto&&typeof rtdChiudiHopRT==="function")rtdChiudiHopRT(true);
  if(typeof GSRT!=="undefined"&&GSRT.aperto&&typeof rtdChiudiSmashRT==="function")rtdChiudiSmashRT(true);
  if(typeof GEORT!=="undefined"&&GEORT.aperto&&typeof rtdChiudiGeoRT==="function")rtdChiudiGeoRT(true);
  if(typeof DMRT!=="undefined"&&DMRT.aperto&&typeof rtdChiudiDeadmoneyRT==="function")rtdChiudiDeadmoneyRT(true);
  RTD.ctx=null;RTD.cv=null;
  if(typeof rtdStopRaf==="function")rtdStopRaf();
  RTD._rafT=0;RTD._hintOff=1;
  try{GBMusic.stop();}catch(e){}
  kjrtMonta();
  var eraNascosto=KJRT.aperto&&KJRT.nascosto;
  var eraChiuso=!KJRT.aperto;
  KJRT.schermo="";
  if(eraChiuso)KJRT.coda=[];
  if(m){
    var firma=String((m.map&&m.map.firma!=null)?m.map.firma:"");
    if(KJRT.aperto&&KJRT.firma!==firma){KJRT.coda=[];KJRT.fineScena=false;}
    if(!KJRT.aperto)KJRT.fineScena=false;
    KJRT.firma=firma;KJRT.start=m;
    KJRT.spec=!!spec;
    KJRT.ko=false;KJRT.uscitoKo=false;
    KJRT_TIFO="";kjrtTifoAggancia();
  }
  KJRT.aperto=true;KJRT.nascosto=false;
  kjrtASchermo();
  if(eraNascosto||eraChiuso)kjrtGiu({t:"riprendi"});
  if(!m)rtdSend({t:"rientra"});
  if(m&&spec){
    var mm={},k;for(k in m)mm[k]=m[k];
    mm.t="start";mm.spec=true;mm.you=null;mm.tour=false;
    kjrtGiu(mm);
    return;
  }
  if(m)kjrtGiu(m);
}
function rtdChiudiKaijuRT(forza){
  if(!KJRT.wrap||!KJRT.fr)return;
  var visibile=(KJRT.wrap.style.display==="block");
  if(!KJRT.aperto&&!visibile&&!forza)return;
  kjrtViaDalloSchermo();
  if(!forza&&KJRT.aperto&&RTD.ui==="match"){
    KJRT.nascosto=true;
    kjrtGiu({t:"pausa"});
    return;
  }
  KJRT.aperto=false;KJRT.nascosto=false;KJRT.pronto=false;KJRT.coda=[];KJRT.codaPiena=false;
  KJRT.firma="";KJRT.start=null;KJRT.fineScena=false;
  KJRT.spec=false;KJRT.schermo="";KJRT.ko=false;
  if(KJRT.fr.getAttribute("src")!=="about:blank")KJRT.fr.setAttribute("src","about:blank");
}
function kjrtTettoFine(){
  var r=0;
  try{ r=Math.max(0,(Number(KJRT.liberoS)||0)*1000-(performance.now()-(Number(KJRT.liberoT)||0))); }catch(e){ r=0; }
  if(!isFinite(r))r=0;
  return Math.max(12000,Math.min(30000,Math.round(r+10000)));
}
function kjrtSpecOver(m){
  RTD.over=m;RTD.specRid=null;
  kjrtGiu(m);
  if(KJRT.fineScena||KJRT.nascosto){rtdSpecOver(m);return;}
  if(RTD.overTmr)clearTimeout(RTD.overTmr);
  RTD.overTmr=setTimeout(function(){RTD.overTmr=null;if(RTD.over===m&&RTD.ui==="match")rtdSpecOver(m);},kjrtTettoFine());
}
function kjrtRicercaPosta(){
  var c=(typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="kaiju")?LOB.card:null;
  if(!c)return null;
  if(c.gratis||!(Number(c.stake_eur)>0))return 0;
  return Number(c.stake_eur);
}
function kjrtRicercaGratis(gratis){
  if(RTD.game!=="kaiju"||RTD.tour||RTD.practice||RTD.ui!=="search")return;
  var el=document.getElementById("arc-body");if(!el)return;
  var pz=document.getElementById("arc-prize");
  if(pz&&gratis)pz.textContent="🎁 GRATIS";
  var bt=el.querySelector("button[onclick=\"rtdLeave()\"]");
  if(bt)bt.textContent=gratis?"✖ ESCI":"✖ ANNULLA (rimborso)";
}
function kjrtPosta(m){
  try{ KJRT.fr.contentWindow.postMessage({kj:"giu",m:m},KJRT_ORIGIN); }catch(e){}
}
function kjrtSenzaEventi(m){ return !!(m&&m.t==="s"&&!(m.feed&&m.feed.length)); }
function kjrtGiu(m){
  if((!KJRT.aperto&&!KJRT.schermo)||!KJRT.fr)return;
  if(KJRT.pronto){kjrtPosta(m);return;}
  var c=KJRT.coda,i;
  if(kjrtSenzaEventi(m)){
    for(i=c.length-1;i>=0;i--){ if(kjrtSenzaEventi(c[i])){c.splice(i,1);break;} }
  }
  c.push(m);
  if(c.length>KJRT_CODA_MAX){
    var k=0;
    for(i=0;i<c.length;i++){ if(c[i]&&c[i].t==="s"){k=i;break;} }
    c.splice(k,1);
    if(!KJRT.codaPiena){
      KJRT.codaPiena=true;
      RTD._rerr="kj:coda piena prima del pronto";
      try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"kaiju",msg:"coda piena prima del pronto"}));}catch(e){}
    }
  }
}
function kjrtRicevi(m){
  var t=m&&m.t;
  if(t==="s"){
    if(m.g!=="kaiju")return false;
    KJRT.ko=!!(m.you&&m.you.sg>=0&&m.st&&m.st.g&&m.st.g[m.you.sg]&&m.st.g[m.you.sg].vivo===false&&m.fase==="gioco");
    KJRT.liberoS=Number(m.libero_s)||0;KJRT.liberoT=performance.now();
    kjrtGiu(m);
    return true;
  }
  if(t==="err"&&/^kj_/.test(String(m.code||""))){kjrtGiu(m);return true;}
  if(t==="esce"&&m.game==="kaiju"){kjrtGiu(m);return false;}
  if(t==="hello_ok"&&KJRT.aperto&&!KJRT.spec&&RTD.game==="kaiju"&&RTD.ui==="match"&&!RTD.over)rtdSend({t:"rientra"});
  if(t==="over"&&m.game==="kaiju"&&m.abbandono&&KJRT.uscitoKo&&!RTD.spec&&!m.tour){kjrtFineKo(m);return true;}
  return false;
}
function kjrtFineKo(m){
  try{
    if(typeof GX!=="undefined"){GX.attesa=null;if(GX.tmr){clearTimeout(GX.tmr);GX.tmr=0;}GX.dlg=false;}
    var ov=document.getElementById("gb-esci-ov");if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);
  }catch(e){}
  if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
  RTD.over=m;
  if(typeof rtdStopRaf==="function")rtdStopRaf();
  RTD.ui="";
  rtdOvClose();
  try{wsNetBanner("arc",0);}catch(e){}
  rtdShowOverKaiju(m);
  try{if(typeof gxTick==="function")gxTick();}catch(e){}
}
window.addEventListener("message",function(ev){
  if(ev.origin!==KJRT_ORIGIN)return;
  var d=ev.data;if(!d||typeof d!=="object"||d.kj===undefined)return;
  if(!KJRT.fr||ev.source!==KJRT.fr.contentWindow)return;
  if(d.kj==="pronto"){
    KJRT.pronto=true;
    RTD._wsT=performance.now();
    kjrtBordi();
    if(KJRT.aperto){
      var c=KJRT.coda;KJRT.coda=[];
      for(var i=0;i<c.length;i++)kjrtPosta(c[i]);
      if(KJRT.codaPiena){KJRT.codaPiena=false;if(!KJRT.spec)rtdSend({t:"rientra"});}
      return;
    }
    KJRT.coda=[];
    if(KJRT.schermo){kjrtPosta({t:"riprendi"});kjrtPosta({t:"schermo",quale:KJRT.schermo});return;}
    kjrtPosta({t:"pausa"});
    return;
  }
  if(d.kj==="su"){
    var o=d.m;
    if(!o||typeof o!=="object"||o.t!=="act"||!KJRT.aperto||KJRT.spec||RTD.spec)return;
    var a=(typeof o.a==="string")?o.a:"";
    if(!Object.prototype.hasOwnProperty.call(KJRT_MOSSE,a))return;
    var ax=kjrtAx(o.ax);
    if(!ax.ok)return;
    rtdSend({t:"act",a:a,ax:ax.v,ay:null,power:kjrtInt(o.power,null)});
    return;
  }
  if(d.kj==="mostro"){
    var sp=kjrtInt(d.sp,0), ti=kjrtInt(d.ti,0);
    if(!(sp>=0&&sp<=7))sp=0;
    if(!(ti>=0&&ti<=6))ti=0;
    KJRT.mostro={sp:sp,ti:ti};
    kjrtMandaMostro();
    return;
  }
  if(d.kj==="fine_scena"){
    KJRT.fineScena=true;
    if(KJRT.spec&&RTD.spec&&RTD.over&&RTD.over.game==="kaiju"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdSpecOver(RTD.over);return;
    }
    if(RTD.over&&RTD.over.game==="kaiju"&&RTD.ui==="match"&&RTD.overTmr){
      clearTimeout(RTD.overTmr);RTD.overTmr=null;rtdShowOver(RTD.over);
    }
    return;
  }
  if(d.kj==="esci"){
    if(KJRT.schermo&&!KJRT.aperto){kjrtChiudiSchermo();return;}
    if(!KJRT.aperto)return;
    if(KJRT.spec||RTD.spec){rtdSpecExit();return;}
    if(RTD.over&&RTD.over.game==="kaiju"&&RTD.ui==="match"){
      if(RTD.overTmr){clearTimeout(RTD.overTmr);RTD.overTmr=null;}
      rtdShowOver(RTD.over);return;
    }
    if(d.ko&&KJRT.ko&&RTD.ui==="match"&&!RTD.practice){
      var cx=null;
      try{cx=(typeof gxCtx==="function")?gxCtx():null;}catch(e1){cx=null;}
      KJRT.uscitoKo=true;
      if(cx&&cx.fam==="rtd"&&typeof gxManda==="function"&&typeof gxInfo==="function"){
        gxManda(cx,gxInfo(cx));
        try{ if(typeof GX!=="undefined"&&!GX.attesa)KJRT.uscitoKo=false; }catch(e2){}
      }else{
        rtdSend({t:"abbandona"});
      }
      return;
    }
    rtdBack();return;
  }
  if(d.kj==="err"){
    RTD._rerr="kj:"+String(d.msg||"").slice(0,60);
    try{if(RTD.ws&&RTD.ws.readyState===1)RTD.ws.send(JSON.stringify({t:"clog",at:"kaiju",msg:String(d.msg||"").slice(0,300)}));}catch(e){}
    return;
  }
});
function kjrtEuro(v){var s=lupEuro(v);return (window.GB_LANG==="en")?s.replace(",","."):s;}
function rtdShowOverKaiju(m){
  var pratica=!!(m.practice||RTD.practice);
  var gratis=!!m.gratis||!(Number(m.pot_eur)>0);
  var chi=(m.winner!=null)?String(m.winner_name||rtdName(m.winner)||""):String(m.winner_name||"");
  if(window.GB_LANG==="en")chi=chi.replace(" (bot, uscito)"," (bot, left)");
  var tasti='<div class="tw-ov-btns"><button class="action-btn gold" onclick="rtdAgain()">'+LBL_AGAIN+'</button>'
    +'<button class="action-btn" onclick="rtdAgain();go(&quot;duel&quot;)">⚔️ PvP ARENA</button></div>';
  var h;
  if(m.annullata){
    TWS.play("lose");
    h='<div style="font-size:44px;">🧯</div><div class="tw-lose-t">TAVOLO ANNULLATO</div>'
     +'<div class="tw-ov-sub">'+((pratica||gratis)?"La partita non è arrivata in fondo.":"La partita non è arrivata in fondo: posta rimborsata.")+'</div>'
     +tasti;
    rtdOv(h,true);
    rtdShowLobby(true);
    if(typeof loadBalance==="function")loadBalance();
    return;
  }
  var riga=m.you_won?'<div class="tw-ov-sub">LA CITTÀ È TUA</div>'
    :(chi?'<div class="tw-ov-sub"><b>'+trnEsc(chi)+'</b> conquista la città</div>':'<div class="tw-ov-sub">PARTITA FINITA</div>');
  if(pratica){
    TWS.play(m.you_won?"win":"lose");
    h=riga.replace('class="tw-ov-sub"','class="tw-ov-sub" style="margin-bottom:6px;color:#ff6b3d;"')
     +practiceOverHTML(!!m.you_won,"rtdPracAgain","rtdPracToReal");
    rtdOv(h,true);
    RTD.ui="";
    rtdShowLobby(true);
    return;
  }
  if(m.abbandono){
    TWS.play("lose");
    if(KJRT.uscitoKo){
      h='<div style="font-size:44px;">💥</div><div class="tw-lose-t">'+((window.GB_LANG==="en")?"YOU WERE KNOCKED OUT":"SEI STATO ELIMINATO")+'</div>'
       +'<div class="tw-ov-sub">'+(gratis?"Il tuo mostro è andato KO: il tavolo va avanti senza di te.":"Il tuo mostro è andato KO: la tua posta resta nel piatto.")+'</div>';
    }else{
      h='<div style="font-size:44px;">🏳️</div><div class="tw-lose-t">HAI LASCIATO IL TAVOLO</div>'
       +'<div class="tw-ov-sub">'+(gratis?"Partita gratis: non hai perso niente.":"La tua posta resta nel piatto.")+'</div>';
    }
    h+=tasti;
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
     +(gratis?"":'<div class="tw-win-prize">+€ '+kjrtEuro(premio)+'</div>')
     +((!gratis&&m.premio_in_sospeso)?'<div class="tw-ov-sub">Il premio arriva sul saldo fra poco: stiamo chiudendo i conti</div>':"")
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+kjrtEuro(m.pot_eur)+'</div>');
  }else{
    TWS.play("lose");
    h='<div style="font-size:44px;">💀</div><div class="tw-lose-t">SCONFITTA</div>'
     +riga
     +(gratis?"":'<div class="tw-ov-sub">Piatto € '+kjrtEuro(m.pot_eur)+'</div>');
  }
  h+=tasti;
  rtdOv(h,true);
  rtdShowLobby(true);
  if(typeof loadBalance==="function")loadBalance();
  if(m.premio_in_sospeso&&typeof loadBalance==="function"){setTimeout(loadBalance,8000);setTimeout(loadBalance,25000);}
}
