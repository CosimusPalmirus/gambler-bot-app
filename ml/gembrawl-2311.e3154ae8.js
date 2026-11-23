var GEMB={wrap:null,fr:null,aperto:false,bb:false,bloccato:false,guard:null,tmr:null,ev:false,n:0,log:[]};
var GEMB_VER="gbgr2311";
function gembDiscord(){
  try{return !!(window.GXDC_RADICE!=null||document.documentElement.classList.contains("gxdc")||(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.__discord));}catch(e){return true;}
}
function gembEn(){return window.GB_LANG==="en";}
function gembTg(){try{return (window.Telegram&&Telegram.WebApp)||null;}catch(e){return null;}}
function gembTgVero(){var t=gembTg();return !!(t&&t.BackButton&&t.platform&&t.platform!=="unknown");}
function gembUrl(){
  var u="gembrawl/gioco/index.html?v="+encodeURIComponent(GEMB_VER)+"&lang="+(gembEn()?"en":"it")+(GEMB.extra||"");
  try{var t=gembTg();
    if(t&&t.initData&&gembTgVero())u+="#tgWebAppData="+encodeURIComponent(t.initData)+"&tgWebAppVersion="+encodeURIComponent(String(t.version||"6.0"))+"&tgWebAppPlatform="+encodeURIComponent(String(t.platform||"unknown"));
  }catch(e){}
  return u;
}
function gembBordi(){
  try{
    var w=GEMB.wrap;if(!w)return;
    var tg2=gembTg(),h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0&&gembTgVero()){w.style.height=Math.round(h)+"px";w.style.bottom="auto";}else{w.style.height="";w.style.bottom="0px";}
    var sa=(tg2&&tg2.safeAreaInset)||{},ca=(tg2&&tg2.contentSafeAreaInset)||{};
    var q=function(l,a,b){var t=(Number(a)||0)+(Number(b)||0),e=(typeof luprtEnv==="function")?luprtEnv(l):0,v=Math.max(t,e);if(!isFinite(v)||v<0)v=0;if(v>200)v=200;return Math.round(v);};
    var T=q("top",sa.top,ca.top),B=q("bottom",sa.bottom,ca.bottom),Lf=q("left",sa.left,ca.left),R=q("right",sa.right,ca.right);
    var f=GEMB.fr.style;f.top=T+"px";f.left=Lf+"px";f.width="calc(100% - "+(Lf+R)+"px)";f.height="calc(100% - "+(T+B)+"px)";
    w.style.setProperty("--gemb-top",T+"px");w.style.setProperty("--gemb-left",Lf+"px");
  }catch(e){}
}
function gembMonta(){
  if(GEMB.wrap)return;
  var w=document.createElement("div");w.id="gemb-wrap";w.setAttribute("role","dialog");w.setAttribute("aria-label","GEM BRAWL");
  w.innerHTML="<div id='gemb-att'><img alt='' src='gembrawl/gioco/ui/logo_C.webp?v=gem2211b' decoding='async'><span><i></i><i></i><i></i></span></div>"
    +"<iframe id='gemb-fr' title='GEM BRAWL' allow='autoplay; fullscreen'></iframe>"
    +"<button type='button' class='gemb-ind'>&#8249;</button>";
  document.body.appendChild(w);
  GEMB.wrap=w;GEMB.fr=w.querySelector("#gemb-fr");
  var im=w.querySelector("#gemb-att img");im.addEventListener("error",function(){im.style.display="none";});
  GEMB.fr.addEventListener("load",function(){
    if(!GEMB.aperto)return;GEMB.log.push("load");gembBordi();
    clearTimeout(GEMB.tmr);GEMB.tmr=setTimeout(function(){if(GEMB.aperto)GEMB.wrap.classList.add("pronto");},600);
    try{GEMB.fr.contentWindow.focus();}catch(e){}
  });
  w.querySelector(".gemb-ind").addEventListener("click",function(){gembChiudi("indietro");});
  document.addEventListener("keydown",function(e){if(GEMB.aperto&&e.key==="Escape"){e.preventDefault();gembChiudi("indietro");}},true);
  if(!GEMB.ev){GEMB.ev=true;
    try{var tg2=gembTg();
      if(tg2&&typeof tg2.onEvent==="function"){["viewportChanged","safeAreaChanged","contentSafeAreaChanged","fullscreenChanged"].forEach(function(k){tg2.onEvent(k,function(){if(GEMB.aperto)gembBordi();});});}}catch(e){}
    try{var mis=function(){if(GEMB.aperto)gembBordi();};window.addEventListener("resize",mis);window.addEventListener("orientationchange",function(){mis();setTimeout(mis,150);setTimeout(mis,450);});}catch(e){}
  }
}
function gembIndietro(){try{var gw=GEMB.fr&&GEMB.fr.contentWindow,gb=gw&&gw.__brawl;if(gb&&typeof gb.indietro==="function"&&gb.indietro())return;}catch(e){}gembChiudi("indietro");}
(function(){try{var sp=String((window.Telegram&&Telegram.WebApp&&Telegram.WebApp.initDataUnsafe&&Telegram.WebApp.initDataUnsafe.start_param)||"").replace(/^r\d{4,15}-/,"");if(sp!=="arena")return;var n=0,t=setInterval(function(){n++;if(typeof go==="function"&&document.getElementById("duel")){clearInterval(t);try{go("duel");}catch(e){}}else if(n>60)clearInterval(t);},150);}catch(e){}})();
(function(){try{var sp=String((window.Telegram&&Telegram.WebApp&&Telegram.WebApp.initDataUnsafe&&Telegram.WebApp.initDataUnsafe.start_param)||"").replace(/^r\d{4,15}-/,"");var m=/^gb(lobby|vedi)[_-]([A-Za-z0-9_-]{1,64})$/.exec(sp);if(!m)return;var ex=(m[1]==="lobby"?"&lobby=":"&guardalid=")+encodeURIComponent(m[2]);if(!window.GB_DEEP)window.GB_DEEP={modo:"gb",gioco:"gembrawl"};GEMB.dl=ex;var n=0,t=setInterval(function(){n++;if(typeof gembApriCon==="function"&&typeof go==="function"&&document.readyState!=="loading"&&n>3){clearInterval(t);try{GEMB.log.push("dl:"+m[1]);gembApriCon(ex);}catch(e){}}else if(n>80)clearInterval(t);},150);}catch(e){}})();
function gembApri(){
  if(gembDiscord())return false;
  if(GEMB.aperto)return true;
  try{if(typeof RTD!=="undefined"&&RTD.ui==="match")return false;}catch(e){}
  try{if(typeof HPCOP!=="undefined"&&HPCOP.aperto)return false;}catch(e){}
  gembMonta();
  var w=GEMB.wrap,ind=w.querySelector(".gemb-ind");
  GEMB.aperto=true;GEMB.n++;GEMB.log.push("apri");
  if(!GEMB.TGS)GEMB.TGS={mio:false,chiesto:false};
  try{var tf=gembTg();if(tf&&gembTgVero()&&/^(ios|android|android_x)$/.test(tf.platform||"")&&typeof tf.isVersionAtLeast==="function"&&tf.isVersionAtLeast("8.0")&&typeof tf.requestFullscreen==="function"){GEMB.TGS.chiesto=true;if(!tf.isFullscreen){GEMB.TGS.mio=true;tf.requestFullscreen();GEMB.log.push("fs:chiesto");}else GEMB.log.push("fs:gia");}}catch(e){}
  ind.setAttribute("aria-label",gembEn()?"Back":"Indietro");
  ind.style.display=gembTgVero()?"none":"flex";
  w.classList.remove("via","pronto");w.style.display="block";
  gembBordi();
  GEMB.fr.setAttribute("src",gembUrl());
  try{document.body.classList.add("gemb-on");}catch(e){}
  try{if(window.GBMusic&&typeof GBMusic.stop==="function")GBMusic.stop();}catch(e){}
  try{if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();GEMB.bloccato=true;}}catch(e){}
  try{var tg2=gembTg();
    if(tg2&&gembTgVero()){if(typeof tg2.expand==="function")tg2.expand();if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes();
      if(!tg2.BackButton.isVisible){tg2.BackButton.onClick(gembIndietro);tg2.BackButton.show();GEMB.bb=true;}}}catch(e){}
  try{GBX.fx("open");}catch(e){}
  clearInterval(GEMB.guard);
  GEMB.guard=setInterval(function(){
    if(!GEMB.aperto){clearInterval(GEMB.guard);return;}
    try{if(typeof RTD!=="undefined"&&RTD.ui==="match")gembChiudi("via");}catch(e){}
  },500);
  return true;
}
function gembChiudi(come){
  if(!GEMB.aperto)return;
  GEMB.aperto=false;clearInterval(GEMB.guard);clearTimeout(GEMB.tmr);GEMB.log.push("chiudi:"+come);
  try{var tfc=gembTg();if(GEMB.TGS&&GEMB.TGS.mio&&tfc&&tfc.isFullscreen&&typeof tfc.exitFullscreen==="function"){tfc.exitFullscreen();GEMB.log.push("fs:rilasciato");}}catch(e){}
  if(GEMB.TGS){GEMB.TGS.mio=false;GEMB.TGS.chiesto=false;}
  var w=GEMB.wrap,fr=GEMB.fr;
  try{document.body.classList.remove("gemb-on");}catch(e){}
  try{if(GEMB.bloccato&&typeof bx2Sblocca==="function")bx2Sblocca();}catch(e){}
  GEMB.bloccato=false;
  try{var tg2=gembTg();
    if(tg2&&gembTgVero()){if(typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();
      if(GEMB.bb){tg2.BackButton.offClick(gembIndietro);tg2.BackButton.hide();}}}catch(e){}
  GEMB.bb=false;
  w.classList.add("via");
  setTimeout(function(){
    if(GEMB.aperto)return;
    w.style.display="none";w.classList.remove("via","pronto");
    try{fr.setAttribute("src","about:blank");}catch(e){}
  },300);
  try{GBX.fx("back");}catch(e){}
}
