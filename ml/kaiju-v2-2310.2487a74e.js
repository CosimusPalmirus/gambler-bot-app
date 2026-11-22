(function(){
  if(typeof MG_GIOCHI==="undefined"||!MG_GIOCHI.kaiju)return;
  function L(it,en){return (window.GB_LANG==="en")?en:it;}
  function E(s){return (typeof mgEsc==="function")?mgEsc(s):String(s==null?"":s);}
  function mem(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){}return null;}
  var MODI=["classica","ultimo","caos","squadre"];
  var FASCE_NUOVE=["1","5"];
  var M={
    classica:{i:"🦖",t:["CLASSICA","CLASSIC"],
      d:["20 stelle o l’ultimo in piedi. Dadi mutanti, 34 carte, il bottino dei KO.","20 stars or the last one standing. Mutant dice, 34 cards, loot from every KO."],
      lob:["CLASSICA","CLASSIC"]},
    ultimo:{i:"💀",t:["ULTIMO IN PIEDI","LAST STANDING"],
      d:["Niente stelle: vince solo l’ultimo vivo. Le stelle diventano energia, la furia sale ogni 3 giri. Si parte con un potere a scelta.","No stars: only the last one alive wins. Stars turn into energy, fury rises every 3 rounds. You start with a power of your choice."],
      lob:["ULTIMO IN PIEDI","LAST STANDING"]},
    caos:{i:"🌀",t:["CAOS","CHAOS"],
      d:["Dadi mutanti 3 volte più spesso, leggendarie doppie, si vince a 12 stelle (15 in due). Un potere a scelta.","Mutant dice 3 times as often, double legendaries, 12 stars to win (15 one-on-one). A power of your choice."],
      lob:["CAOS","CHAOS"]},
    squadre:{i:"🤝",t:["2 CONTRO 2","2 VS 2"],
      d:["Due squadre: vi alternate al turno, stelle in comune (30 per vincere), i colpi non toccano il compagno, la vita che avanza cura lui. Vincete in due, premio diviso.","Two teams: you alternate turns, shared stars (30 to win), hits never touch your teammate, spare healing goes to them. You win together, the prize is split."],
      lob:["2 CONTRO 2","2 VS 2"]}
  };
  var KJV2=window.KJV2={modo:"classica",daMenu:0,allena:0,condividi:0,inSoldi:0,M:M,MODI:MODI,FASCE:FASCE_NUOVE};
  var m0=mem("kj_v2_modo");if(MODI.indexOf(m0)>=0)KJV2.modo=m0;
  function nuovo(m){return m&&m!=="classica";}
  function modoDi(c){var m=c&&c.modo;return MODI.indexOf(m)>=0?m:"classica";}
  window.kjv2Nome=function(m){m=MODI.indexOf(m)>=0?m:"classica";return L(M[m].t[0],M[m].t[1]);};
  window.kjv2ModoLobby=function(){var m=(typeof LOB!=="undefined"&&LOB.kjModo)||"classica";return MODI.indexOf(m)>=0?m:"classica";};
  var C=MG_GIOCHI.kaiju,ORIG={pills:C.pills,feat:C.feat,vince:C.vince,posti:C.posti,bot:C.bot,allena:C.allena,notaSoldi:C.notaSoldi,nota:C.nota};
  var SCHEDA={
    classica:{pills:[["🦖","2-5 mostri","2-5 monsters"],["🎲","dadi mutanti","mutant dice"],["⭐","20 stelle","20 stars"]]},
    ultimo:{pills:[["🦖","2-5 mostri","2-5 monsters"],["💀","niente stelle","no stars"],["🔥","furia ogni 3 giri","fury every 3 rounds"]],
      re:["L’ULTIMO","THE LAST ONE","Le stelle diventano energia: vince solo chi resta vivo.","Stars become energy: only the survivor wins."],
      vince:["Solo l’ultimo vivo prende tutto","Only the last one alive takes it all"]},
    caos:{pills:[["🦖","2-5 mostri","2-5 monsters"],["🌀","mutanti ×3","mutants ×3"],["⭐","12 stelle","12 stars"]],
      re:["IL CAOS","CHAOS","Mutanti 3 volte più spesso, leggendarie doppie, 12 stelle.","Mutants 3 times as often, double legendaries, 12 stars."],
      vince:["12 stelle o l’ultimo in piedi","12 stars or the last one standing"]},
    squadre:{pills:[["🤝","2 contro 2","2 vs 2"],["⭐","30 stelle in squadra","30 team stars"],["💰","premio diviso","split prize"]],
      re:["LA SQUADRA","THE TEAM","Turni alterni, stelle in comune: i colpi non toccano il compagno.","Alternating turns, shared stars: hits never touch your teammate."],
      vince:["La squadra vincente si divide il piatto","The winning team splits the pot"],
      posti:[4,4],bot:3,allena:["Tu e un bot contro due bot","You and a bot vs two bots"],
      notaSoldi:["A soldi parte solo con 4 persone vere, squadre a sorte · premio diviso fra i due vincitori · se in 3 minuti non siete in 4 la posta torna","For money it starts only with 4 real people, random teams · the prize is split between the two winners · if you are not 4 within 3 minutes the stake comes back"]}
  };
  var NOTA_FASCE=["Coda a soldi a 1 € e a 5 € · per un’altra posta crea una lobby · se il tavolo non si riempie la posta torna","Money queue at €1 and €5 · for another stake create a lobby · if the table doesn’t fill the stake comes back"];
  function applicaScheda(){
    var s=SCHEDA[KJV2.modo]||{};
    C.pills=s.pills||ORIG.pills;
    C.feat=ORIG.feat.slice();if(s.re)C.feat[3]=s.re;
    C.vince=s.vince||ORIG.vince;C.posti=s.posti||ORIG.posti;C.bot=s.bot||ORIG.bot;
    C.allena=s.allena||ORIG.allena;
    C.notaSoldi=s.notaSoldi||(nuovo(KJV2.modo)?NOTA_FASCE:ORIG.notaSoldi);
  }
  function conta(m){var L0=(typeof MG!=="undefined"&&MG.lobby&&MG.lobby.kaiju)||null;if(!L0)return null;return L0.filter(function(c){return modoDi(c)===m;}).length;}
  function tagConta(m){var n=conta(m);if(n===null)return "…";return n+" "+(n===1?L("LOBBY","LOBBY"):L("LOBBY","LOBBIES"));}
  window.kjv2Selettore=function(){
    var h='<div class="mg-lbl">'+L("MODALITÀ","GAME MODE")+'</div><div class="kjv2-modi" id="kjv2-modi">';
    MODI.forEach(function(m){var n=conta(m);
      h+='<button type="button" class="mg-modo'+(KJV2.modo===m?' sel':'')+'" data-k="'+m+'" onclick="kjv2Modo(\''+m+'\')">'
        +'<span class="mg-mt">'+M[m].i+' '+E(L(M[m].t[0],M[m].t[1]))+'</span>'
        +'<span class="mg-mtag kjv2-n'+(n?'':' zero')+'" data-k="'+m+'">'+tagConta(m)+'</span></button>';});
    h+='</div><div class="kjv2-desc" id="kjv2-desc"><b>'+E(L(M[KJV2.modo].t[0],M[KJV2.modo].t[1]))+'</b> · '+E(L(M[KJV2.modo].d[0],M[KJV2.modo].d[1]))+'</div>';
    return h;
  };
  window.kjv2Tasti=function(){
    var st="background:linear-gradient(135deg,#2a120a,#140806);border:1px solid rgba(255,107,61,.55);color:#ffb59c;";
    var cmd="/game kaiju"+(KJV2.modo==="classica"?"":(" "+(KJV2.modo==="squadre"?"2v2":KJV2.modo)));
    return '<button class="action-btn" style="width:100%;margin:0;'+st+'" onclick="kjrtSchermo(&quot;editor&quot;)">🦖 '+L("IL TUO MOSTRO","YOUR MONSTER")+'</button>'
      +'<div class="kjv2-info">'
      +'<button class="action-btn" style="'+st+'" onclick="kjrtSchermo(&quot;guida&quot;)">📖 '+L("ISTRUZIONI","HOW TO PLAY")+'</button>'
      +'<button class="action-btn" style="'+st+'" onclick="kjrtSchermo(&quot;kaiju&quot;)">👾 '+L("I KAIJU","THE KAIJU")+'</button>'
      +'<button class="action-btn" style="'+st+'" onclick="kjrtSchermo(&quot;carte&quot;)">🃏 '+L("POTERI E CARTE","POWERS & CARDS")+'</button></div>'
      +'<div class="kjv2-gr"><button type="button" class="mg-cta viola" style="min-height:48px;font-size:16px" onclick="kjv2Gruppi()">📣 <span>'+L("LOBBY NEI GRUPPI","LOBBY IN YOUR GROUPS")+'</span></button>'
      +'<div class="mg-nota">'+E(L("Crei la lobby ","You create the lobby ")+"("+kjv2Nome(KJV2.modo)+")"+L(" e la mandi in un gruppo Telegram. Dal gruppo: "," and send it to a Telegram group. From the group: ")+cmd)+'</div></div>';
  };
  C.extra=function(){return kjv2Selettore()+kjv2Tasti();};
  window.kjv2Modo=function(m){
    if(MODI.indexOf(m)<0||KJV2.modo===m)return;
    KJV2.modo=m;mem("kj_v2_modo",m);
    try{tg.HapticFeedback&&tg.HapticFeedback.selectionChanged();}catch(e){}
    var y=0;try{y=(document.scrollingElement||document.documentElement).scrollTop;}catch(e){}
    if(typeof rtdShowLobby==="function"&&typeof RTD!=="undefined"&&RTD.game==="kaiju"&&RTD.ui==="lobby")rtdShowLobby();
    try{(document.scrollingElement||document.documentElement).scrollTop=y;}catch(e){}
  };
  window.kjv2Gruppi=function(){
    KJV2.condividi=Date.now();
    var gr=(typeof MG!=="undefined"&&MG.modo&&MG.modo.kaiju==="gratis");
    if(typeof mgCreaLobby==="function")mgCreaLobby("kaiju",gr);
  };
  var _scelta=window.mgScelta;
  if(typeof _scelta==="function")window.mgScelta=function(el,g){
    if(g==="kaiju"){try{applicaScheda();}catch(e){}}
    return _scelta.apply(this,arguments);
  };
  var _modi=window.mgModi;
  if(typeof _modi==="function")window.mgModi=function(c){
    var q=_modi.apply(this,arguments);
    try{if(c===C&&nuovo(KJV2.modo))q.forEach(function(x){if(x.k==="soldi")x.tag=FASCE_NUOVE.map(function(f){return mgEur(parseFloat(f));}).join(" · ");
      if(x.k==="amici"&&KJV2.modo==="squadre")x.tag=L("4 POSTI","4 SEATS");});}catch(e){}
    return q;
  };
  var _fasce=window.mgFasce;
  if(typeof _fasce==="function")window.mgFasce=function(){
    var f=_fasce.apply(this,arguments);
    if(KJV2.inSoldi)f=f.filter(function(x){return FASCE_NUOVE.indexOf(String(x[0]))>=0;});
    return f;
  };
  var _pan=window.mgPannello;
  if(typeof _pan==="function")window.mgPannello=function(g){
    if(g!=="kaiju")return _pan.apply(this,arguments);
    var k=(typeof MG!=="undefined"&&MG.modo)?MG.modo[g]:"",h;
    if(k==="soldi"&&nuovo(KJV2.modo)){
      try{if(typeof RTD!=="undefined"&&FASCE_NUOVE.indexOf(String(RTD.tier))<0)RTD.tier=FASCE_NUOVE[0];}catch(e){}
      KJV2.inSoldi=1;try{h=_pan.apply(this,arguments);}finally{KJV2.inSoldi=0;}
      try{var tutte=_fasce().map(function(x){return String(x[0]);});
        h=h.replace(/class="mg-fiche f\d( sel)?" data-t="([^"]+)"/g,function(_t,sel,t){var i=tutte.indexOf(t);return 'class="mg-fiche f'+(i<0?0:i)+(sel||"")+'" data-t="'+t+'"';});}catch(e){}
    }else h=_pan.apply(this,arguments);
    if(k==="gratis"&&KJV2.modo==="squadre")h+='<div class="mg-nota">'+E(L("Gratis in meno di 4: i posti vuoti li prende un bot.","Free with fewer than 4: a bot takes the empty seats."))+'</div>';
    return h;
  };
  var _lobH=window.mgLobbyHTML;
  if(typeof _lobH==="function")window.mgLobbyHTML=function(g,soloGratis){
    if(g!=="kaiju"||typeof MG==="undefined"||!MG.lobby||!MG.lobby.kaiju)return _lobH.apply(this,arguments);
    var tutte=MG.lobby.kaiju,r;
    rinfresca();
    MG.lobby.kaiju=tutte.filter(function(c){return modoDi(c)===KJV2.modo;});
    try{r=_lobH.apply(this,arguments);}finally{MG.lobby.kaiju=tutte;}
    return r;
  };
  function rinfresca(){try{document.querySelectorAll('#mg-sc[data-g="kaiju"] .kjv2-n').forEach(function(b){var m=b.getAttribute("data-k"),n=conta(m);b.textContent=tagConta(m);b.classList.toggle("zero",!n);});}catch(e){}}
  var _car=window.mgLobbyCarica;
  if(typeof _car==="function")window.mgLobbyCarica=function(g){
    var r=_car.apply(this,arguments);
    if(g==="kaiju"&&typeof MG!=="undefined"){
      var t0=MG.lobbyAt.kaiju||0,k=0,iv=setInterval(function(){
        if((MG.lobbyAt.kaiju||0)!==t0||++k>40){clearInterval(iv);rinfresca();}},250);
      rinfresca();
    }
    return r;
  };
  var _allena=window.mgAllena;
  if(typeof _allena==="function")window.mgAllena=function(g){if(g==="kaiju")KJV2.allena=Date.now();return _allena.apply(this,arguments);};
  var _creaL=window.mgCreaLobby;
  if(typeof _creaL==="function")window.mgCreaLobby=function(g){
    if(g==="kaiju")KJV2.daMenu=1;
    try{return _creaL.apply(this,arguments);}finally{KJV2.daMenu=0;}
  };
  var _send=window.rtdSend;
  if(typeof _send==="function"&&!_send.__kjv2){
    var s2=function(o){
      try{
        if(o&&o.game==="kaiju"){
          if(o.t==="join"&&nuovo(KJV2.modo)&&o.modo===undefined)o.modo=KJV2.modo;
          if(o.t==="join_ticket"&&KJV2.allena&&Date.now()-KJV2.allena<60000){if(nuovo(KJV2.modo))o.modo=KJV2.modo;KJV2.allena=0;}
        }
      }catch(e){}
      return _send.apply(this,arguments);
    };
    s2.__kjv2=1;s2.__kj=_send.__kj;window.rtdSend=s2;
  }
  window.kjrtSchermo=function(quale){
    if(typeof KJRT==="undefined"||KJRT.aperto)return;
    if(["editor","guida","kaiju","carte"].indexOf(quale)<0)return;
    KJRT.schermo=quale;
    kjrtMonta();
    kjrtASchermo();
    if(KJRT.pronto){kjrtPosta({t:"riprendi"});kjrtPosta({t:"schermo",quale:quale});}
  };
  var _posta=window.kjrtPosta;
  if(typeof _posta==="function")window.kjrtPosta=function(o){
    try{if(o&&o.t==="schermo"&&!o.modo)o.modo=KJV2.modo;}catch(e){}
    return _posta.apply(this,arguments);
  };
  var _apri=window.lobOpenCreate;
  if(typeof _apri==="function")window.lobOpenCreate=function(game){
    try{if(typeof LOB!=="undefined")LOB.kjModo=(game==="kaiju"&&KJV2.daMenu)?KJV2.modo:"classica";}catch(e){}
    if(!(game==="kaiju"&&KJV2.daMenu))KJV2.condividi=0;
    return _apri.apply(this,arguments);
  };
  window.kjv2SetLobModo=function(m){
    if(MODI.indexOf(m)<0||typeof LOB==="undefined")return;
    LOB.kjModo=m;if(m==="squadre")LOB.posti=4;
    try{tg.HapticFeedback&&tg.HapticFeedback.selectionChanged();}catch(e){}
    if(typeof lobRenderCrea==="function")lobRenderCrea();
  };
  var _crea=window.lobRenderCrea;
  if(typeof _crea==="function")window.lobRenderCrea=function(){
    if(typeof LOB!=="undefined"&&LOB.game==="kaiju"&&LOB.kjModo==="squadre")LOB.posti=4;
    var r=_crea.apply(this,arguments);
    try{
      if(typeof LOB==="undefined"||LOB.game!=="kaiju")return r;
      var m=kjv2ModoLobby(),seg=document.getElementById("lob-posti");
      if(seg&&!document.getElementById("kjv2-lmodo")){
        var h='<div class="ut-step-k"><b>🦖</b><span>'+L("Modalità","Mode")+'</span><i>'+E(kjv2Nome(m))+'</i></div><div class="ut-seg" id="kjv2-lmodo">';
        MODI.forEach(function(k){h+='<button class="'+(k===m?'sel':'')+'" onclick="kjv2SetLobModo(\''+k+'\')">'+E(kjv2Nome(k))+'</button>';});
        h+='</div><div class="ut-note" style="text-align:left">'+E(L(M[m].d[0],M[m].d[1]))+'</div>';
        seg.insertAdjacentHTML("afterend",h);
        if(m==="squadre")seg.querySelectorAll("button").forEach(function(b){if(String(b.textContent).trim()!=="4"){b.disabled=true;b.style.opacity=".3";}});
      }
    }catch(e){}
    return r;
  };
  var _setP=window.lobSetPosti;
  if(typeof _setP==="function")window.lobSetPosti=function(n){
    if(typeof LOB!=="undefined"&&LOB.game==="kaiju"&&LOB.kjModo==="squadre"&&Number(n)!==4)return;
    return _setP.apply(this,arguments);
  };
  var _card=window.lobRenderCard;
  if(typeof _card==="function")window.lobRenderCard=function(){
    var r=_card.apply(this,arguments);
    try{
      var c=(typeof LOB!=="undefined")?LOB.card:null,el=document.getElementById("lob-body");
      if(!c||!el||c.game!=="kaiju")return r;
      var m=MODI.indexOf(c.modo)>=0?c.modo:(LOB.mine?kjv2ModoLobby():"classica");
      var nome=el.querySelector(".ut-lc-n");
      if(nome&&!nome.querySelector(".kjv2-k"))nome.insertAdjacentHTML("beforeend",' <span class="kjv2-k" style="font-size:.62em;padding:3px 8px;border-radius:999px;background:#ff6b3d;color:#1a0700;vertical-align:middle">'+E(kjv2Nome(m))+'</span>');
      if(KJV2.condividi&&LOB.mine&&LOB.lid&&c.lid===LOB.lid){
        var vecchio=Date.now()-KJV2.condividi>120000;KJV2.condividi=0;
        if(!vecchio){if(c.annunciata){if(typeof toast==="function")toast(L("Lobby annunciata nel gruppo","Lobby announced in the group"),"ok",2400);}
          else setTimeout(function(){try{lobShare();}catch(e){}},350);}
      }
    }catch(e){}
    return r;
  };
  var _share=window.lobShare;
  if(typeof _share==="function")window.lobShare=function(){
    try{
      var c=(typeof LOB!=="undefined")?LOB.card:null;
      if(c&&c.game==="kaiju"&&LOB.lid){
        var m=MODI.indexOf(c.modo)>=0?c.modo:(LOB.mine?kjv2ModoLobby():"classica");
        var lnk="https://t.me/"+BOT_USERNAME_FOR_REF+"?startapp="+gbInvPre()+"lobby_"+LOB.lid;
        var p=c.gratis?L("gratis","free"):lobEur(c.stake_eur);
        var txt="🦖 KAIJU BATTLE · "+kjv2Nome(m)+" · "+p+"\n"+L(M[m].d[0],M[m].d[1])+"\n"+L("Entra: ","Join: ")+lnk;
        if(tg&&tg.openTelegramLink){tg.openTelegramLink("https://t.me/share/url?url="+encodeURIComponent(lnk)+"&text="+encodeURIComponent(txt));return;}
        try{navigator.clipboard.writeText(lnk);toast(L("Link copiato","Link copied"),"ok",1800);}catch(e2){toast(lnk,"ok",4000);}
        return;
      }
    }catch(e){}
    return _share.apply(this,arguments);
  };
})();
