var TUT2011={wrap:null,fr:null,g:"",aperto:false,pronto:false,tmr:null,bb:false,bloccato:false,ev:false,log:[]};
var TUT2011_PAG={hop:["hop/hop.html","HPRT_VER","#04201d","HOP CLASH"],sbanca:["sbanca/sbanca.html","SBRT_VER","#120a1c","SBANCA!"],abisso:["abisso/abisso.html","ABRT_VER","#0b0812","NON SVEGLIARE IL DRAGO"]};
function tut2011Ha(g){return Object.prototype.hasOwnProperty.call(TUT2011_PAG,g);}
function tut2011En(){return window.GB_LANG==="en";}
function tut2011Lbl(){return tut2011En()?"Play the tutorial":"Tutorial";}
function tut2011Btn(g){
  if(!tut2011Ha(g))return "";
  return '<button type="button" class="action-btn tut2011-btn" style="width:100%;margin:8px 0 2px;" onclick="tut2011Apri(\''+g+'\')">'+tut2011Lbl()+'</button>';
}
function tut2011Url(g){
  var p=TUT2011_PAG[g],v="";try{v=String(window[p[1]]||"");}catch(e){}
  return p[0]+"?modo=tutorial&tut=2011&piatt=tg&v="+encodeURIComponent(v)+"&lang="+(tut2011En()?"en":"it")+"&origine="+encodeURIComponent(location.origin);
}
function tut2011Bordi(){
  try{
    var w=TUT2011.wrap;if(!w)return;
    var tg2=window.Telegram&&Telegram.WebApp,sa=(tg2&&tg2.safeAreaInset)||{},ca=(tg2&&tg2.contentSafeAreaInset)||{};
    var q=function(l,a,b){var t=(Number(a)||0)+(Number(b)||0),e=(typeof luprtEnv==="function")?luprtEnv(l):0,v=Math.max(t,e);if(!isFinite(v)||v<0)v=0;if(v>200)v=200;return Math.round(v);};
    w.style.paddingTop=q("top",sa.top,ca.top)+"px";w.style.paddingBottom=q("bottom",sa.bottom,ca.bottom)+"px";
    w.style.paddingLeft=q("left",sa.left,ca.left)+"px";w.style.paddingRight=q("right",sa.right,ca.right)+"px";
    var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){w.style.height=Math.round(h)+"px";w.style.bottom="auto";}else{w.style.height="";w.style.bottom="0px";}
  }catch(e){}
}
function tut2011Monta(){
  if(TUT2011.wrap)return;
  var w=document.createElement("div");w.id="tut2011-wrap";
  w.style.cssText="position:fixed;inset:0;z-index:9150;display:none;box-sizing:border-box;background:#000;touch-action:none;overscroll-behavior:none;";
  w.innerHTML="<iframe id='tut2011-fr' title='Tutorial' allow='autoplay' style='display:block;width:100%;height:100%;border:0;'></iframe>"
    +"<button type='button' class='tut2011-x' style='display:none;position:absolute;top:12px;right:12px;z-index:2;height:36px;padding:0 16px;border-radius:18px;border:0;background:rgba(255,255,255,.16);color:#fff;font:600 15px -apple-system,Inter,system-ui,sans-serif;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)'></button>";
  document.body.appendChild(w);
  TUT2011.wrap=w;TUT2011.fr=w.querySelector("#tut2011-fr");
  w.querySelector(".tut2011-x").addEventListener("click",function(){tut2011Chiudi("");});
  window.addEventListener("message",tut2011Msg);
  if(!TUT2011.ev){TUT2011.ev=true;
    try{var tg2=window.Telegram&&Telegram.WebApp;
      if(tg2&&typeof tg2.onEvent==="function"){["viewportChanged","safeAreaChanged","contentSafeAreaChanged","fullscreenChanged"].forEach(function(k){tg2.onEvent(k,function(){if(TUT2011.aperto)tut2011Bordi();});});}}catch(e){}
    try{var mis=function(){if(TUT2011.aperto)tut2011Bordi();};window.addEventListener("resize",mis);window.addEventListener("orientationchange",function(){mis();setTimeout(mis,150);setTimeout(mis,450);});}catch(e){}
  }
}
function tut2011Indietro(){tut2011Chiudi("");}
function tut2011Apri(g){
  if(!tut2011Ha(g)||TUT2011.aperto)return;
  try{if(typeof RTD!=="undefined"&&RTD.ui==="match")return;}catch(e){}
  tut2011Monta();
  var p=TUT2011_PAG[g],w=TUT2011.wrap,x=w.querySelector(".tut2011-x");
  TUT2011.g=g;TUT2011.pronto=false;TUT2011.aperto=true;TUT2011.log.push("apri:"+g);
  w.style.background=p[2];x.style.display="none";x.textContent=tut2011En()?"Close":"Chiudi";
  TUT2011.fr.setAttribute("title",p[3]);TUT2011.fr.setAttribute("src",tut2011Url(g));
  w.style.display="block";
  try{document.body.classList.add("tut2011-on");}catch(e){}
  try{if(typeof bx2Blocca==="function"&&typeof BX2_BLOCCATI!=="undefined"&&BX2_BLOCCATI===null){bx2Blocca();TUT2011.bloccato=true;}}catch(e){}
  try{var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){if(typeof tg2.expand==="function")tg2.expand();if(typeof tg2.disableVerticalSwipes==="function")tg2.disableVerticalSwipes();
      if(tg2.BackButton&&!tg2.BackButton.isVisible){tg2.BackButton.onClick(tut2011Indietro);tg2.BackButton.show();TUT2011.bb=true;}}}catch(e){}
  tut2011Bordi();
  clearTimeout(TUT2011.tmr);
  TUT2011.tmr=setTimeout(function(){if(TUT2011.aperto&&!TUT2011.pronto)x.style.display="block";},15000);
  try{GBX.fx("open");}catch(e){}
}
function tut2011Chiudi(poi){
  if(!TUT2011.aperto)return;
  var g=TUT2011.g;TUT2011.aperto=false;TUT2011.pronto=false;clearTimeout(TUT2011.tmr);TUT2011.log.push("chiudi:"+g+":"+(poi||""));
  try{TUT2011.wrap.style.display="none";TUT2011.fr.setAttribute("src","about:blank");}catch(e){}
  try{document.body.classList.remove("tut2011-on");}catch(e){}
  try{if(TUT2011.bloccato&&typeof bx2Sblocca==="function")bx2Sblocca();}catch(e){}
  TUT2011.bloccato=false;
  try{var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2){if(typeof tg2.enableVerticalSwipes==="function")tg2.enableVerticalSwipes();
      if(TUT2011.bb&&tg2.BackButton){tg2.BackButton.offClick(tut2011Indietro);tg2.BackButton.hide();}}}catch(e){}
  TUT2011.bb=false;
  try{GBX.fx("back");}catch(e){}
  if(poi==="allena")setTimeout(function(){try{if(typeof mgAllena==="function")mgAllena(g);else if(typeof practiceStart==="function")practiceStart(g);}catch(e){}},80);
}
function tut2011Io(){
  var nome="",foto="";
  try{nome=String((typeof S!=="undefined"&&(S.name||S.username))||"").replace(/[\u0000-\u001f<>&"]/g,"").trim().slice(0,24);}catch(e){}
  try{if(typeof window.fvFoto==="function")foto=String(window.fvFoto(S.userId,null,true)||"");}catch(e){}
  try{if(!foto&&typeof dlMyPhoto==="function")foto=String(dlMyPhoto()||"");}catch(e){}
  if(!/^(https:\/\/|\/|data:image\/)/.test(foto))foto="";
  return {sm:"tut2011_io",nome:nome,foto:foto.slice(0,800)};
}
function tut2011Msg(e){
  if(!TUT2011.fr||!TUT2011.aperto||e.source!==TUT2011.fr.contentWindow)return;
  if(e.origin!==location.origin)return;
  var d=e.data;if(!d||typeof d!=="object"||d.sm!=="tut2011")return;
  if(d.g&&d.g!==TUT2011.g)return;
  TUT2011.log.push("ev:"+String(d.ev)+":"+String(d.fai||""));
  if(d.ev==="pronto"){
    TUT2011.pronto=true;try{TUT2011.wrap.querySelector(".tut2011-x").style.display="none";}catch(e1){}
    try{TUT2011.fr.contentWindow.postMessage(tut2011Io(),location.origin);}catch(e2){}
  }else if(d.ev==="esci")tut2011Chiudi("");
  else if(d.ev==="fine")tut2011Chiudi(d.fai==="allena"?"allena":"");
}
