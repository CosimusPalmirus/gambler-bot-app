var HPCOP={wrap:null,fr:null,aperto:false,pronto:false,modo:"",arrivo:0,tmr:null,guard:null,bb:false,bloccato:false,rinvio:false,ev:false,n:0,t0:0,ms:null,musica:"",log:[]};
function hpcopDiscord(){
  try{return !!(window.GXDC_RADICE!=null||document.documentElement.classList.contains("gxdc")||(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.__discord));}catch(e){return true;}
}
function hpcopEn(){return window.GB_LANG==="en";}
function hpcopTg(){try{return (window.Telegram&&Telegram.WebApp)||null;}catch(e){return null;}}
function hpcopTgVero(){var t=hpcopTg();return !!(t&&t.BackButton&&t.platform&&t.platform!=="unknown");}
function hpcopUrl(){
  var v="";try{v=String(HPRT_VER||"");}catch(e){}
  return "hop/hop.html?copertina=1&piatt=tg&v="+encodeURIComponent(v)+"&lang="+(hpcopEn()?"en":"it")+"&origine="+encodeURIComponent(location.origin);
}
function hpcopBordi(){
  try{
    var w=HPCOP.wrap;if(!w)return;
    var tg2=hpcopTg(),h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0&&hpcopTgVero()){w.style.height=Math.round(h)+"px";w.style.bottom="auto";}else{w.style.height="";w.style.bottom="0px";}
    var sa=(tg2&&tg2.safeAreaInset)||{},ca=(tg2&&tg2.contentSafeAreaInset)||{};
    var q=function(l,a,b){var t=(Number(a)||0)+(Number(b)||0),e=(typeof luprtEnv==="function")?luprtEnv(l):0,v=Math.max(t,e);if(!isFinite(v)||v<0)v=0;if(v>200)v=200;return Math.round(v);};
    var b={sm:"bordi",top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom),left:q("left",sa.left,ca.left),right:q("right",sa.right,ca.right)};
    w.style.setProperty("--hpcop-top",b.top+"px");w.style.setProperty("--hpcop-bottom",b.bottom+"px");
    if(HPCOP.fr&&HPCOP.fr.contentWindow&&HPCOP.aperto)HPCOP.fr.contentWindow.postMessage(b,location.origin);
  }catch(e){}
}
function hpcopMonta(){
  if(HPCOP.wrap)return;
  var st=document.createElement("style");st.id="hpcop-css";
  st.textContent="#hpcop-wrap{position:fixed;left:0;right:0;top:0;bottom:0;z-index:9120;display:none;box-sizing:border-box;background:#04201d;touch-action:none;overscroll-behavior:none;opacity:1;transition:opacity .28s ease}"
    +"#hpcop-wrap.via{opacity:0;pointer-events:none}"
    +"#hpcop-wrap>iframe{position:absolute;left:0;top:0;width:100%;height:100%;border:0;display:block;background:transparent}"
    +"#hpcop-att{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;pointer-events:none}"
    +"#hpcop-att img{width:min(64vw,300px);height:auto;filter:drop-shadow(0 10px 24px rgba(0,0,0,.55))}"
    +"#hpcop-att span{display:flex;gap:10px}#hpcop-att i{width:10px;height:10px;border-radius:50%;background:#7fffe0;opacity:.85;animation:hpcopSalta 1s ease-in-out infinite}"
    +"#hpcop-att i:nth-child(2){background:#ffb02e;animation-delay:.15s}#hpcop-att i:nth-child(3){background:#4fc8ff;animation-delay:.3s}"
    +"@keyframes hpcopSalta{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}"
    +"#hpcop-wrap .hpcop-ind{position:absolute;z-index:2;top:calc(10px + var(--hpcop-top,0px));left:10px;width:40px;height:40px;border-radius:20px;border:0;padding:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.32);color:#fff;font:600 22px/1 -apple-system,Inter,system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}"
    +"#hpcop-wrap .hpcop-ind:focus-visible,#hpcop-wrap .hpcop-vai:focus-visible{outline:2px solid #7fffe0;outline-offset:3px}"
    +"#hpcop-wrap .hpcop-vai{position:absolute;z-index:2;left:50%;bottom:calc(7vh + var(--hpcop-bottom,0px));transform:translateX(-50%);display:none;border:0;border-radius:999px;padding:14px 30px;background:#ffb02e;color:#2a1300;font:700 17px/1 -apple-system,Inter,system-ui,sans-serif;letter-spacing:.02em;cursor:pointer;box-shadow:0 4px 0 #a24800,0 8px 20px rgba(0,0,0,.4)}"
    +"@media (prefers-reduced-motion:reduce){#hpcop-wrap{transition:none}#hpcop-att i{animation:none}}";
  document.head.appendChild(st);
  var w=document.createElement("div");w.id="hpcop-wrap";w.setAttribute("role","dialog");w.setAttribute("aria-label","HOP CLASH");
  w.innerHTML="<div id='hpcop-att'><img alt='' src='hop/assets_bayou/logo/logo_main_512.webp' decoding='async'><span><i></i><i></i><i></i></span></div>"
    +"<iframe id='hpcop-fr' title='HOP CLASH' allow='autoplay'></iframe>"
    +"<button type='button' class='hpcop-ind'>&#8249;</button><button type='button' class='hpcop-vai'></button>";
  document.body.appendChild(w);
  HPCOP.wrap=w;HPCOP.fr=w.querySelector("#hpcop-fr");
  var im=w.querySelector("#hpcop-att img");im.addEventListener("error",function(){im.style.display="none";});
  HPCOP.fr.addEventListener("load",function(){if(!HPCOP.aperto)return;hpcopBordi();try{HPCOP.fr.contentWindow.focus();}catch(e){}});
  w.querySelector(".hpcop-ind").addEventListener("click",function(){hpcopChiudi("indietro");});
  w.querySelector(".hpcop-vai").addEventListener("click",function(){hpcopChiudi("gioca");});
  window.addEventListener("message",hpcopMsg);
  document.addEventListener("keydown",function(e){if(HPCOP.aperto&&e.key==="Escape"){e.preventDefault();hpcopChiudi("indietro");}},true);
  if(!HPCOP.ev){HPCOP.ev=true;
    try{var tg2=hpcopTg();
      if(tg2&&typeof tg2.onEvent==="function"){["viewportChanged","safeAreaChanged","contentSafeAreaChanged","fullscreenChanged"].forEach(function(k){tg2.onEvent(k,function(){if(HPCOP.aperto)hpcopBordi();});});}}catch(e){}
    try{var mis=function(){if(HPCOP.aperto)hpcopBordi();};window.addEventListener("resize",mis);window.addEventListener("orientationchange",function(){mis();setTimeout(mis,150);setTimeout(mis,450);});}catch(e){}
  }
}
function hpcopMsg(e){
  if(!HPCOP.fr||e.source!==HPCOP.fr.contentWindow||e.origin!==location.origin)return;
  var d=e.data;if(!d||typeof d!=="object"||d.sm!=="hop_cop")return;
  HPCOP.log.push("ev:"+String(d.ev).slice(0,10)+(d.modo?":"+String(d.modo).slice(0,3):""));
  if(!HPCOP.aperto)return;
  if(d.ev==="pronto"){
    HPCOP.pronto=true;HPCOP.modo=String(d.modo||"");HPCOP.ms=Date.now()-HPCOP.t0;clearTimeout(HPCOP.tmr);
    try{HPCOP.wrap.querySelector(".hpcop-vai").style.display="none";}catch(e1){}
    hpcopBordi();
  }else if(d.ev==="vivo")HPCOP.modo="3d";
  else if(d.ev==="musica")HPCOP.musica=String(d.stato||"").slice(0,12);
  else if(d.ev==="gioca")hpcopChiudi("gioca");
  else if(d.ev==="esci")hpcopChiudi("indietro");
}
function hpcopIndietro(){hpcopChiudi("indietro");}
function hpcopApri(){
  if(HPCOP.aperto||hpcopDiscord())return false;
  try{if(typeof RTD!=="undefined"&&RTD.ui==="match")return false;}catch(e){}
  try{if(typeof HPRT!=="undefined"&&HPRT.aperto)return false;}catch(e){}
  try{if(typeof TUT2011!=="undefined"&&TUT2011.aperto)return false;}catch(e){}
  hpcopMonta();
  var w=HPCOP.wrap,en=hpcopEn(),ind=w.querySelector(".hpcop-ind"),vai=w.querySelector(".hpcop-vai");
  HPCOP.aperto=true;HPCOP.pronto=false;HPCOP.modo="";HPCOP.ms=null;HPCOP.musica="";HPCOP.n++;HPCOP.t0=Date.now();HPCOP.log.push("apri");
  ind.setAttribute("aria-label",en?"Back":"Indietro");vai.textContent=en?"Tap to play":"Tocca per giocare";vai.style.display="none";
  ind.style.display=hpcopTgVero()?"none":"flex";
  w.classList.remove("via");w.style.display="block";
  HPCOP.fr.setAttribute("src",hpcopUrl());
  try{document.body.classList.add("hpcop-on");}catch(e){}
  try{if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();HPCOP.bloccato=true;}}catch(e){}
  try{var tg2=hpcopTg();
    if(tg2&&hpcopTgVero()){if(typeof tg2.expand==="function")tg2.expand();if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes();
      if(!tg2.BackButton.isVisible){tg2.BackButton.onClick(hpcopIndietro);tg2.BackButton.show();HPCOP.bb=true;}}}catch(e){}
  hpcopBordi();
  clearTimeout(HPCOP.tmr);
  HPCOP.tmr=setTimeout(function(){if(HPCOP.aperto&&!HPCOP.pronto){try{vai.style.display="block";}catch(e){}}},9000);
  clearInterval(HPCOP.guard);
  HPCOP.guard=setInterval(function(){
    if(!HPCOP.aperto){clearInterval(HPCOP.guard);return;}
    var via=false;
    try{if(typeof CUR!=="undefined"&&CUR!=="arc")via=true;}catch(e){}
    try{if(typeof RTD!=="undefined"&&RTD.ui==="match")via=true;}catch(e){}
    try{if(typeof HPRT!=="undefined"&&HPRT.aperto)via=true;}catch(e){}
    try{if(typeof TUT2011!=="undefined"&&TUT2011.aperto)via=true;}catch(e){}
    if(via)hpcopChiudi("via");
  },400);
  return true;
}
function hpcopChiudi(come){
  if(!HPCOP.aperto)return;
  HPCOP.aperto=false;clearTimeout(HPCOP.tmr);clearInterval(HPCOP.guard);HPCOP.log.push("chiudi:"+come);
  var w=HPCOP.wrap,fr=HPCOP.fr;
  try{document.body.classList.remove("hpcop-on");}catch(e){}
  try{if(HPCOP.bloccato&&typeof bx2Sblocca==="function")bx2Sblocca();}catch(e){}
  HPCOP.bloccato=false;
  try{var tg2=hpcopTg();
    if(tg2&&hpcopTgVero()){if(typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();
      if(HPCOP.bb){tg2.BackButton.offClick(hpcopIndietro);tg2.BackButton.hide();}}}catch(e){}
  HPCOP.bb=false;
  if(come==="indietro"){try{if(typeof rtdBack==="function")rtdBack();else go("duel");}catch(e){try{go("duel");}catch(e2){}}}
  w.classList.add("via");
  setTimeout(function(){
    if(HPCOP.aperto)return;
    w.style.display="none";w.classList.remove("via");
    try{fr.setAttribute("src","about:blank");}catch(e){}
    hpcopDopo(come);
  },300);
  try{GBX.fx(come==="gioca"?"open":"back");}catch(e){}
}
function hpcopDopo(come){
  if(!HPCOP.rinvio)return;HPCOP.rinvio=false;
  if(come==="indietro")return;
  try{if(typeof CUR!=="undefined"&&CUR==="arc"&&typeof RTD!=="undefined"&&RTD.game==="hop"&&typeof HPRT!=="undefined"&&HPRT.loads===0){var f=window.hprtPrecarica;(f&&f.__vero?f.__vero:f)();HPCOP.log.push("precarica:ora");}}catch(e){}
}
(function(){
  var orig=window.hprtPrecarica;if(typeof orig!=="function"||orig.__hpcop)return;
  var f=function(){
    if(HPCOP.aperto||HPCOP.arrivo>Date.now()){HPCOP.rinvio=true;HPCOP.log.push("precarica:rinviata");return;}
    return orig.apply(this,arguments);
  };
  f.__hpcop=1;f.__vero=orig;window.hprtPrecarica=f;
})();
document.addEventListener("click",function(e){
  if(HPCOP.aperto||hpcopDiscord())return;
  var r=e.target&&e.target.closest&&e.target.closest('#duel .xa-row[data-g="hop"],#duel .xa-slide[data-g="hop"],#duel .hop-mega');
  if(!r||r.classList.contains("xa-soon"))return;
  HPCOP.arrivo=Date.now()+800;
  setTimeout(function(){
    HPCOP.arrivo=0;
    var ok=false;
    try{ok=(typeof CUR!=="undefined"&&CUR==="arc")&&(window.RTD_GAME==="hop"||(typeof RTD!=="undefined"&&RTD.game==="hop"));}catch(x){}
    if(!(ok&&hpcopApri())&&HPCOP.rinvio){HPCOP.rinvio=false;try{var f=window.hprtPrecarica;(f&&f.__vero?f.__vero:f)();}catch(x2){}}
  },0);
},true);
