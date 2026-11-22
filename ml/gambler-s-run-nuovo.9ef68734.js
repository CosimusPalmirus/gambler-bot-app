var GRN={wrap:null,fr:null,aperto:false,tgEv:false};
var GRN_VER="5b944e2befb2749d444c9e651004e371";
function grnUrl(){return "gamblers_run.html?guscio=1&v="+GRN_VER+"&lang="+((window.GB_LANG==="en")?"en":"it");}
function grnVecchio(){ window.__grnVecchio=true; try{ go('grun'); } finally { window.__grnVecchio=false; } }
function grnApri(){
  var uid=(window.S&&S.userId)?String(S.userId):'';
  if(!uid){ grnVecchio(); return; }
  var fatto=false, t=setTimeout(function(){ if(!fatto){ fatto=true; grnVecchio(); } }, 6000);
  fetch(BACKEND+'/grn/stato?user_id='+encodeURIComponent(uid)).then(function(r){ return r.ok?r.json():null; }).then(function(d){
    if(fatto) return; fatto=true; clearTimeout(t);
    if(!d||!d.attivo||d.vecchia){ grnVecchio(); return; }
    grnMostra();
  }, function(){ if(fatto) return; fatto=true; clearTimeout(t); grnVecchio(); });
}
function grnAltezza(){
  try{ if(!GRN.wrap)return; var tg2=window.Telegram&&Telegram.WebApp; var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){GRN.wrap.style.height=Math.round(h)+"px";GRN.wrap.style.bottom="auto";} else {GRN.wrap.style.height="100%";GRN.wrap.style.bottom="0px";} }catch(e){}
}
function grnBordi(){
  try{ if(!GRN.fr||!GRN.aperto)return; var tg2=window.Telegram&&Telegram.WebApp; var sa=(tg2&&tg2.safeAreaInset)||{}, ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){ var v=(Number(a)||0)+(Number(b)||0), e=(typeof luprtEnv==="function")?luprtEnv(lato):0; v=Math.max(v,e); if(!isFinite(v)||v<0)v=0; if(v>200)v=200; return Math.round(v); }
    GRN.fr.contentWindow.postMessage({grn:"bordi",top:q("top",sa.top,ca.top),bottom:q("bottom",sa.bottom,ca.bottom)},location.origin); }catch(e){}
}
function grnMostra(){
  if(!GRN.wrap){
    var w=document.createElement("div"); w.id="grn-wrap";
    w.style.cssText="position:fixed;inset:0;z-index:9100;display:none;background:#0d0710;touch-action:none;overscroll-behavior:none;";
    w.innerHTML="<iframe id='grn-fr' title=\"GAMBLER'S RUN\" allow='autoplay' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w); GRN.wrap=w; GRN.fr=w.querySelector("#grn-fr");
    GRN.fr.addEventListener("load",function(){ setTimeout(grnBordi,300); });
    if(!GRN.tgEv){ GRN.tgEv=true; try{ var tg2=window.Telegram&&Telegram.WebApp; if(tg2&&typeof tg2.onEvent==="function"){ tg2.onEvent("viewportChanged",function(){grnAltezza();grnBordi();}); tg2.onEvent("safeAreaChanged",grnBordi); tg2.onEvent("contentSafeAreaChanged",grnBordi); } }catch(e){} }
  }
  if(GRN.fr.getAttribute("src")!==grnUrl()) GRN.fr.setAttribute("src",grnUrl());
  GRN.aperto=true; GRN.wrap.style.display="block"; grnAltezza();
  try{ GBMusic.stop(); }catch(e){}
  try{ var tg2=window.Telegram&&Telegram.WebApp; if(tg2){ if(typeof tg2.expand==="function")tg2.expand(); if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes(); } }catch(e){}
}
function grnChiudi(){
  if(!GRN.wrap)return;
  GRN.aperto=false; GRN.wrap.style.display="none";
  if(GRN.fr.getAttribute("src")!=="about:blank") GRN.fr.setAttribute("src","about:blank");
  try{ var tg2=window.Telegram&&Telegram.WebApp; if(tg2&&typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes(); }catch(e){}
  try{ if(typeof loadBalance==="function")loadBalance(); }catch(e){}
}
window.addEventListener("message",function(ev){
  if(ev.origin!==location.origin||!ev.data||!ev.data.grn)return;
  if(ev.data.grn==="esci"){ grnChiudi(); }
  else if(ev.data.grn==="saldo"){ try{ if(typeof loadBalance==="function")loadBalance(); }catch(e){} }
});
