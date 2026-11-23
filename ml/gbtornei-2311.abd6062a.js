function gembTrnL(it,en){return (window.GB_LANG==="en")?en:it;}
function gembApriCon(extra){
  if(typeof gembDiscord==="function"&&gembDiscord()){try{toast(gembTrnL("Gem Brawl si gioca dalla mini app di Telegram","Gem Brawl is played from the Telegram mini app"),"warn",2600);}catch(e){}return false;}
  var X=window.XGB,ok=false;
  GEMB.extra=String(extra||"");
  try{
    if(GEMB.aperto&&GEMB.fr){GEMB.wrap.classList.remove("pronto");GEMB.fr.setAttribute("src",gembUrl());ok=true;}
    else{if(X)X.passa=true;try{ok=!!gembApri();}finally{if(X)X.passa=false;}}
  }catch(e){ok=false;}
  finally{GEMB.extra="";}
  if(!ok){try{toast(gembTrnL("Finisci la partita in corso e riprova","Finish the match in progress and try again"),"warn",2600);}catch(e){}}
  return ok;
}
function gembTrnId(x){return String(x||"").replace(/[^A-Za-z0-9_-]/g,"").slice(0,64);}
function gembTrnEntra(ticket,tid){
  ticket=String(ticket||"");if(!ticket)return false;
  return gembApriCon("&torneo="+encodeURIComponent(ticket)+"&tid="+encodeURIComponent(gembTrnId(tid)));
}
function gembTrnGuarda(rid,tid){
  rid=gembTrnId(rid);if(!rid)return false;tid=gembTrnId(tid);
  return gembApriCon("&guarda="+encodeURIComponent(rid)+(tid?"&tid="+encodeURIComponent(tid):""));
}
function gembAllena(){
  if(window.XGB&&typeof XGB.allena==="function"){XGB.allena();return;}
  try{localStorage.setItem("gb_mg_modo","bot");}catch(e){}
  gembApriCon("");
}
function gembTrnAttivo(){
  var d=(typeof TRN!=="undefined"&&TRN.state)||null,i,up;
  if(!d)return "";
  if(d.active&&String(d.game||"")==="gembrawl"&&d.status!=="done")return gembTrnId(d.id);
  up=d.upcoming||[];
  for(i=0;i<up.length;i++){if(String(up[i].game||"")==="gembrawl")return gembTrnId(up[i].id);}
  return "";
}
window.gembTornei=function(tid){
  tid=gembTrnId(tid);
  try{if(typeof gembChiudi==="function")gembChiudi("torneo");}catch(e){}
  if(!tid)tid=gembTrnAttivo();
  try{
    if(tid){TRN.want=tid;TRN.wantN=0;go("torneo");if(TRN.state)trnWantTry();}
    else{
      TRN.want="";TRN.det=null;TRN.detSig="";go("torneo");if(typeof trnRender==="function")trnRender();
      if(!TRN.state){var n=0,iv=setInterval(function(){
        if(++n>40||CUR!=="torneo"||TRN.det){clearInterval(iv);return;}
        if(TRN.state){clearInterval(iv);var t=gembTrnAttivo();if(t)trnDetOpen(t);}
      },250);}
    }
  }catch(e){}
  return tid;
};
window.gembCondividi=function(rid){
  rid=gembTrnId(rid);if(!rid)return "";
  var lnk="https://t.me/"+BOT_USERNAME_FOR_REF+"?startapp="+(typeof gbInvPre==="function"?gbInvPre():"")+"gbguarda_"+rid;
  var txt=gembTrnL("Guarda in diretta la partita di GEM BRAWL: ","Watch the GEM BRAWL match live: ");
  try{var t=gembTg();
    if(t&&t.openTelegramLink&&gembTgVero()){t.openTelegramLink("https://t.me/share/url?url="+encodeURIComponent(lnk)+"&text="+encodeURIComponent(txt));return lnk;}}catch(e){}
  try{navigator.clipboard.writeText(lnk).then(function(){toast(gembTrnL("Link copiato","Link copied"),"ok",1800);},function(){toast(lnk,"ok",4000);});}
  catch(e2){try{toast(lnk,"ok",4000);}catch(e3){}}
  return lnk;
};
