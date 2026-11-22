(function(){
  if(typeof MG_GIOCHI==="undefined"||!MG_GIOCHI.abisso)return;
  function L(it,en){return (window.GB_LANG==="en")?en:it;}
  function E(s){return (typeof mgEsc==="function")?mgEsc(s):String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function mem(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){}return null;}
  var VAR=["classica","avventura"];
  var M={
    classica:{i:"🐉",t:["CLASSICA","CLASSIC"],
      d:["Il gioco originale: a ogni carta avanti o torni su; due segni uguali svegliano il drago.","The original game: at every card go on or head back; two matching signs wake the dragon."]},
    avventura:{i:"🥚",t:["AVVENTURA","ADVENTURE"],
      d:["La classica + l’UOVO D’ORO nel nido in fondo (vale 30, ma scappando l’occhio del drago può vederti), il BIVIO e la BOTTEGA fra le spedizioni.","Classic + the GOLDEN EGG in the nest at the far end (worth 30, but as you run the dragon’s eye may see you), the FORK and the SHOP between expeditions."]}
  };
  function norm(v){v=String(v==null?"":v).toLowerCase();if(v==="adventure")v="avventura";return VAR.indexOf(v)>=0?v:"classica";}
  function avv(v){return v==="avventura";}
  var ABV=window.ABV={v:"classica",daMenu:0,allena:0,ricerca:null,M:M,VAR:VAR};
  var m0=mem("ab_variante");if(VAR.indexOf(m0)>=0)ABV.v=m0;
  function modoDi(c){return norm(c&&c.modo);}
  window.abvVariante=function(){return ABV.v;};
  window.abvNome=function(v){v=norm(v);return L(M[v].t[0],M[v].t[1]);};
  window.abvDesc=function(v){v=norm(v);return L(M[v].d[0],M[v].d[1]);};
  window.abvModoLobby=function(){return norm(typeof LOB!=="undefined"&&LOB.abModo);};
  function etichetta(v,cls){v=norm(v);return '<span class="'+(cls||"abv-k")+(avv(v)?' avv':'')+'">'+M[v].i+' '+E(abvNome(v))+'</span>';}
  var C=MG_GIOCHI.abisso;
  if(!C.posti)C.posti=[2,8];
  if(!C.bot&&!C.allena)C.bot=4;
  var ORIG={pills:C.pills,regole:C.regole,extra:C.extra};
  var PILLS_AVV=[["🐉","2-8 ladri","2-8 thieves"],["🥚","l’uovo d’oro","the golden egg"],["🔀","bivio e bottega","fork and shop"]];
  var REGOLE_AVV=[["🥚","L’AVVENTURA","THE ADVENTURE",M.avventura.d[0],M.avventura.d[1]]];
  function applicaScheda(){
    C.pills=avv(ABV.v)?PILLS_AVV:ORIG.pills;
    C.regole=(avv(ABV.v)&&ORIG.regole)?ORIG.regole.concat(REGOLE_AVV):ORIG.regole;
  }
  applicaScheda();
  function conta(v){var L0=(typeof MG!=="undefined"&&MG.lobby&&MG.lobby.abisso)||null;if(!L0)return null;return L0.filter(function(c){return modoDi(c)===v;}).length;}
  function tagConta(v){var n=conta(v);if(n===null)return "…";return n+" "+(n===1?"LOBBY":L("LOBBY","LOBBIES"));}
  window.abvSelettore=function(){
    var h='<div class="mg-lbl">'+L("VARIANTE","VARIANT")+'</div><div class="abv-modi" id="abv-modi">';
    VAR.forEach(function(v){var n=conta(v);
      h+='<button type="button" class="mg-modo'+(ABV.v===v?' sel':'')+'" data-k="'+v+'" onclick="abvScegli(\''+v+'\')">'
        +'<span class="mg-mt">'+M[v].i+' '+E(abvNome(v))+'</span>'
        +'<span class="mg-mtag abv-n'+(n?'':' zero')+'" data-k="'+v+'">'+tagConta(v)+'</span></button>';});
    h+='</div><div class="abv-desc" id="abv-desc"><b>'+E(abvNome(ABV.v))+'</b> · '+E(abvDesc(ABV.v))+'</div>';
    return h;
  };
  C.extra=function(){return abvSelettore()+(ORIG.extra?ORIG.extra.apply(this,arguments):"");};
  window.abvScegli=function(v){
    if(VAR.indexOf(v)<0||ABV.v===v)return;
    ABV.v=v;mem("ab_variante",v);applicaScheda();
    try{tg.HapticFeedback&&tg.HapticFeedback.selectionChanged();}catch(e){}
    var y=0;try{y=(document.scrollingElement||document.documentElement).scrollTop;}catch(e){}
    if(typeof rtdShowLobby==="function"&&typeof RTD!=="undefined"&&RTD.game==="abisso"&&RTD.ui==="lobby"&&document.querySelector('#mg-sc[data-g="abisso"]'))rtdShowLobby();
    else{
      try{document.querySelectorAll('#abv-modi .mg-modo').forEach(function(b){b.classList.toggle("sel",b.getAttribute("data-k")===v);});
        var d=document.getElementById("abv-desc");if(d)d.innerHTML='<b>'+E(abvNome(v))+'</b> · '+E(abvDesc(v));}catch(e){}
    }
    try{(document.scrollingElement||document.documentElement).scrollTop=y;}catch(e){}
    try{document.dispatchEvent(new CustomEvent("abv:variante",{detail:{variante:v}}));}catch(e){}
  };
  var _scelta=window.mgScelta;
  if(typeof _scelta==="function")window.mgScelta=function(el,g){
    if(g==="abisso"){try{applicaScheda();}catch(e){}}
    return _scelta.apply(this,arguments);
  };
  var _lobH=window.mgLobbyHTML;
  if(typeof _lobH==="function")window.mgLobbyHTML=function(g,soloGratis){
    if(g!=="abisso"||typeof MG==="undefined"||!MG.lobby||!MG.lobby.abisso)return _lobH.apply(this,arguments);
    var tutte=MG.lobby.abisso,r;
    rinfresca();
    MG.lobby.abisso=tutte.filter(function(c){return modoDi(c)===ABV.v;});
    try{r=_lobH.apply(this,arguments);}finally{MG.lobby.abisso=tutte;}
    return r;
  };
  function rinfresca(){try{document.querySelectorAll('#mg-sc[data-g="abisso"] .abv-n').forEach(function(b){var v=b.getAttribute("data-k"),n=conta(v);b.textContent=tagConta(v);b.classList.toggle("zero",!n);});}catch(e){}}
  var _car=window.mgLobbyCarica;
  if(typeof _car==="function")window.mgLobbyCarica=function(g){
    var r=_car.apply(this,arguments);
    if(g==="abisso"&&typeof MG!=="undefined"){
      var t0=(MG.lobbyAt&&MG.lobbyAt.abisso)||0,k=0,iv=setInterval(function(){
        if(((MG.lobbyAt&&MG.lobbyAt.abisso)||0)!==t0||++k>40){clearInterval(iv);rinfresca();}},250);
      rinfresca();
    }
    return r;
  };
  var _gioca=window.mgGioca;
  if(typeof _gioca==="function")window.mgGioca=function(g){if(g==="abisso")ABV.ricerca={v:ABV.v,t:Date.now()};return _gioca.apply(this,arguments);};
  var _allena=window.mgAllena;
  if(typeof _allena==="function")window.mgAllena=function(g){if(g==="abisso"){ABV.allena=Date.now();ABV.ricerca={v:ABV.v,t:Date.now()};}return _allena.apply(this,arguments);};
  var _creaL=window.mgCreaLobby;
  if(typeof _creaL==="function")window.mgCreaLobby=function(g){
    if(g==="abisso")ABV.daMenu=1;
    try{return _creaL.apply(this,arguments);}finally{ABV.daMenu=0;}
  };
  var _send=window.rtdSend;
  if(typeof _send==="function"&&!_send.__abv){
    var s3=function(o){
      try{
        if(o&&o.game==="abisso"){
          if(o.t==="join"){if(avv(ABV.v)&&o.modo===undefined)o.modo=ABV.v;ABV.ricerca={v:ABV.v,t:Date.now()};}
          if(o.t==="join_ticket"){
            if(ABV.allena&&Date.now()-ABV.allena<60000){if(avv(ABV.v))o.modo=ABV.v;ABV.allena=0;ABV.ricerca={v:ABV.v,t:Date.now()};}
            else ABV.ricerca=null;
          }
        }
        if(o&&o.t==="join_open"&&typeof LOB!=="undefined"&&LOB.card&&LOB.card.game==="abisso"&&String(LOB.card.lid)===String(o.lid))
          ABV.ricerca={v:(LOB.card.modo?modoDi(LOB.card):(LOB.mine?abvModoLobby():"classica")),t:Date.now()};
      }catch(e){}
      return _send.apply(this,arguments);
    };
    s3.__abv=1;s3.__kjv2=_send.__kjv2;s3.__kj=_send.__kj;window.rtdSend=s3;
  }
  function etichettaRicerca(){
    try{
      if(typeof RTD==="undefined"||RTD.game!=="abisso"||RTD.ui!=="search"||!ABV.ricerca)return;
      if(Date.now()-ABV.ricerca.t>20*60000)return;
      var el=document.getElementById("arc-body");if(!el)return;
      var v=norm(ABV.ricerca.v),old=document.getElementById("abv-rb");
      if(old){if(old.getAttribute("data-k")===v)return;old.remove();}
      var t=el.querySelector(".tw-search-t");
      var h='<div class="abv-rb'+(avv(v)?' avv':'')+'" id="abv-rb" data-k="'+v+'"><span>'+M[v].i+' '+E(abvNome(v))+'</span></div>';
      if(t)t.insertAdjacentHTML("afterend",h);else el.insertAdjacentHTML("afterbegin",h);
    }catch(e){}
  }
  var _onMsg=window.rtdOnMsg;
  if(typeof _onMsg==="function")window.rtdOnMsg=function(m){
    try{if(m&&m.t==="lobby"&&m.game==="abisso"&&Object.prototype.hasOwnProperty.call(m,"modo"))ABV.ricerca={v:norm(m.modo),t:Date.now()};}catch(e){}
    var r=_onMsg.apply(this,arguments);
    if(m&&m.t==="lobby"&&m.game==="abisso")etichettaRicerca();
    return r;
  };
  var _cerca=window.rtdShowSearch;
  if(typeof _cerca==="function")window.rtdShowSearch=function(){
    var r=_cerca.apply(this,arguments);
    etichettaRicerca();
    return r;
  };
  var _apri=window.lobOpenCreate;
  if(typeof _apri==="function")window.lobOpenCreate=function(game){
    try{if(typeof LOB!=="undefined")LOB.abModo=(game==="abisso"&&ABV.daMenu)?ABV.v:"classica";}catch(e){}
    return _apri.apply(this,arguments);
  };
  window.abvSetLobModo=function(v){
    if(VAR.indexOf(v)<0||typeof LOB==="undefined")return;
    LOB.abModo=v;
    try{tg.HapticFeedback&&tg.HapticFeedback.selectionChanged();}catch(e){}
    if(typeof lobRenderCrea==="function")lobRenderCrea();
  };
  var _crea=window.lobRenderCrea;
  if(typeof _crea==="function")window.lobRenderCrea=function(){
    var r=_crea.apply(this,arguments);
    try{
      if(typeof LOB==="undefined"||LOB.game!=="abisso"||LOB.ui==="card")return r;
      var v=abvModoLobby(),seg=document.getElementById("lob-posti"),dove="afterend";
      if(!seg){var p=document.getElementById("lob-poste");seg=p&&p.previousElementSibling;dove="beforebegin";}
      if(seg&&!document.getElementById("abv-lmodo")){
        var h='<div class="ut-step-k"><b>'+M[v].i+'</b><span>'+L("Variante","Variant")+'</span><i>'+E(abvNome(v))+'</i></div><div class="ut-seg" id="abv-lmodo">';
        VAR.forEach(function(k){h+='<button class="'+(k===v?'sel':'')+'" onclick="abvSetLobModo(\''+k+'\')">'+M[k].i+' '+E(abvNome(k))+'</button>';});
        h+='</div><div class="ut-note" style="text-align:left">'+E(abvDesc(v))+'</div>';
        seg.insertAdjacentHTML(dove,h);
      }
    }catch(e){}
    return r;
  };
  var _lobCrea=window.lobCrea;
  if(typeof _lobCrea==="function")window.lobCrea=function(){
    if(typeof LOB==="undefined"||LOB.game!=="abisso"||typeof window.fetch!=="function")return _lobCrea.apply(this,arguments);
    var f0=window.fetch,v=abvModoLobby();
    window.fetch=function(u,init){
      try{
        if(String(u).indexOf("/lobby/create")>=0&&init&&typeof init.body==="string"){
          var b=JSON.parse(init.body);
          if(b&&b.game==="abisso"){b.modo=v;init.body=JSON.stringify(b);}
        }
      }catch(e){}
      return f0.apply(this,arguments);
    };
    try{return _lobCrea.apply(this,arguments);}finally{window.fetch=f0;}
  };
  var _riga=window.utLobRow;
  if(typeof _riga==="function")window.utLobRow=function(c){
    var h=_riga.apply(this,arguments);
    try{
      if(c&&c.game==="abisso"){var v=modoDi(c),k='<span class="ut-lr-n">',i=h.indexOf(k);
        if(i>=0){var j=h.indexOf("</span>",i+k.length);if(j>0)h=h.slice(0,j)+" "+etichetta(v)+h.slice(j);}}
    }catch(e){}
    return h;
  };
  var _card=window.lobRenderCard;
  if(typeof _card==="function")window.lobRenderCard=function(){
    var r=_card.apply(this,arguments);
    try{
      var c=(typeof LOB!=="undefined")?LOB.card:null,el=document.getElementById("lob-body");
      if(!c||!el||c.game!=="abisso")return r;
      var v=c.modo?modoDi(c):(LOB.mine?abvModoLobby():"classica");
      var nome=el.querySelector(".ut-lc-n");
      if(nome&&!nome.querySelector(".abv-k"))nome.insertAdjacentHTML("beforeend"," "+etichetta(v));
    }catch(e){}
    return r;
  };
  var _share=window.lobShare;
  if(typeof _share==="function")window.lobShare=function(){
    try{
      var c=(typeof LOB!=="undefined")?LOB.card:null;
      if(c&&c.game==="abisso"&&LOB.lid){
        var v=c.modo?modoDi(c):(LOB.mine?abvModoLobby():"classica");
        if(avv(v)){
          var lnk="https://t.me/"+BOT_USERNAME_FOR_REF+"?startapp="+(typeof gbInvPre==="function"?gbInvPre():"")+"lobby_"+LOB.lid;
          var p=c.gratis?L("gratis","free"):lobEur(c.stake_eur);
          var txt="🥚 "+L("NON SVEGLIARE IL DRAGO","DON’T WAKE THE DRAGON")+" · "+abvNome(v)+" · "+p+"\n"+abvDesc(v)+"\n"+L("Entra: ","Join: ")+lnk;
          if(tg&&tg.openTelegramLink){tg.openTelegramLink("https://t.me/share/url?url="+encodeURIComponent(lnk)+"&text="+encodeURIComponent(txt));return;}
          try{navigator.clipboard.writeText(lnk);toast(L("Link copiato","Link copied"),"ok",1800);}catch(e2){toast(lnk,"ok",4000);}
          return;
        }
      }
    }catch(e){}
    return _share.apply(this,arguments);
  };
  function trnFix(o,prof){
    if(!o||typeof o!=="object"||prof>6)return;
    if(Array.isArray(o)){for(var i=0;i<o.length&&i<200;i++)trnFix(o[i],prof+1);return;}
    if(o.game==="abisso"&&norm(o.variante)==="avventura"&&!o.__abv){
      o.__abv=1;
      var base=o.game_label||L("NON SVEGLIARE IL DRAGO","DON’T WAKE THE DRAGON");
      o.game_label=String(base)+" · "+abvNome("avventura");
    }
    for(var k in o){if(Object.prototype.hasOwnProperty.call(o,k)&&o[k]&&typeof o[k]==="object")trnFix(o[k],prof+1);}
  }
  var _fetch=window.fetch;
  if(typeof _fetch==="function"&&!_fetch.__abv){
    var f4=function(input){
      var p=_fetch.apply(this,arguments);
      try{
        var url=(typeof input==="string")?input:((input&&input.url)||"");
        if(/\/tournament\/(state|public)/.test(url)&&p&&typeof p.then==="function"){
          p=p.then(function(r){
            try{var oj=r.json;if(typeof oj==="function")r.json=function(){return oj.apply(r,arguments).then(function(d){try{trnFix(d,0);}catch(e){}return d;});};}catch(e){}
            return r;
          });
        }
      }catch(e){}
      return p;
    };
    f4.__abv=1;window.fetch=f4;
  }
})();
