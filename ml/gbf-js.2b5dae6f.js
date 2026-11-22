(function(){
  'use strict';
  var W=window;
  function en(){return W.GB_LANG==='en';}
  function T(it,e){return en()?e:it;}
  function fermo(){try{if(document.documentElement.classList.contains('gb-lite'))return true;if(W.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return true;}catch(e){}return false;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function eur(v,seg){v=Math.abs(Number(v)||0);var s=v.toFixed(2);return (seg||'')+'€'+s;}
  function numDa(t){
    t=String(t||'');var m=/(\d[\d.,]*)/.exec(t.replace(/\s/g,''));if(!m)return null;
    var s=m[1];if(s.indexOf(',')>=0&&s.indexOf('.')>=0){s=(s.lastIndexOf(',')>s.lastIndexOf('.'))?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');}
    else s=s.replace(',','.');var n=parseFloat(s);return isFinite(n)?n:null;
  }
  function hap(k,v){try{var h=W.Telegram&&Telegram.WebApp&&Telegram.WebApp.HapticFeedback;if(!h)return;if(k==='i')h.impactOccurred(v);else h.notificationOccurred(v);}catch(e){}}
  function suono(n,v){try{if(W.TWS&&TWS.on!==false&&typeof TWS.play==='function')TWS.play(n,v);}catch(e){}}
  var FAM={'arc-modal':'rtd','tw-modal':'twr','tk-modal':'tk','gld-modal':'gld'};
  function stato(f){try{return f==='rtd'?W.RTD:f==='twr'?W.TWR:f==='tk'?W.TKD:f==='gld'?W.GLD:null;}catch(e){return null;}}
  function nomeGioco(f,m){
    try{if(f==='rtd'){var g=(m&&m.game)||(W.RTD&&RTD.game);if(W.RTD_G&&RTD_G[g])return RTD_G[g].title;}}catch(e){}
    return f==='twr'?'🌆 GAMBLER CITY ROYALE':f==='tk'?'🎯 TANK DUEL':f==='gld'?'🏛️ COLOSSEO':'';
  }
  var SVG_G='<defs><linearGradient id="gbfO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#ffd23b"/><stop offset="1" stop-color="#c46a0c"/></linearGradient>'
    +'<linearGradient id="gbfA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c3c9d8"/><stop offset="1" stop-color="#6b7388"/></linearGradient>'
    +'<linearGradient id="gbfR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a7a"/><stop offset="1" stop-color="#8a1020"/></linearGradient></defs>';
  function trofeo(g){return '<path d="M20 10h24v8c0 9-5 16-12 18-7-2-12-9-12-18z" fill="url(#'+g+')" stroke="#3a1a00" stroke-width="2.4" stroke-linejoin="round"/>'
    +'<path d="M20 14h-7c0 8 4 12 9 13M44 14h7c0 8-4 12-9 13" fill="none" stroke="url(#'+g+')" stroke-width="3.6" stroke-linecap="round"/>'
    +'<path d="M29 36h6v7h-6z" fill="url(#'+g+')" stroke="#3a1a00" stroke-width="2"/><path d="M22 43h20l2 8H20z" fill="url(#'+g+')" stroke="#3a1a00" stroke-width="2.4" stroke-linejoin="round"/>'
    +'<path d="M26 15l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L17 22l6-1z" transform="translate(6 1) scale(.62)" fill="#fffbe6" opacity=".9"/>';}
  function fiche(g,rotta){var h='<circle cx="32" cy="32" r="21" fill="url(#'+g+')" stroke="#2a0010" stroke-width="2.4"/>'
    +'<circle cx="32" cy="32" r="14" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="5.5 5.5" opacity=".85"/><circle cx="32" cy="32" r="8" fill="#1a0a2a" opacity=".55"/>';
    if(rotta)h+='<path d="M30 9l4 9-5 6 6 7-4 8 5 7-3 9" fill="none" stroke="#120414" stroke-width="3.4" stroke-linejoin="round"/>';return h;}
  var ICO_AI={"trofeo_oro": "ml/i_dfcba78383.webp", "trofeo_argento": "ml/i_aa7e5542db.webp", "fiche_rotta": "ml/i_e63d5803b4.webp", "due_fiche": "ml/i_1dbbca6c25.webp", "scudo": "ml/i_66026a6f94.webp", "bandiera": "ml/i_2c830a1a0f.webp"};
  function svgIcona(d){
    var e=d.esito,k='fiche_rotta';
    if(e==='vittoria'||e==='pvinto'||e==='tpassa'||e==='bye')k='trofeo_oro';
    else if(e==='podio'||e==='spett')k='trofeo_argento';
    else if(e==='pari')k='due_fiche';
    else if(e==='annullata'||e==='resa')k='scudo';
    else if(e==='abbandono')k='bandiera';
    return '<img src="'+ICO_AI[k]+'" alt="" style="width:84%;height:84%;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.55))">';
  }
  function emojiDi(t){var m=/^([^\w\s]+)\s/.exec(String(t||''));return m?m[1]:'';}
  var GENERICI=/^(HAI VINTO|VITTORIA|SCONFITTA|HAI VINTO IL MATCH!?|YOU WON|YOU WIN!?|VICTORY|DEFEAT|YOU WON THE MATCH!?|ELIMINATO|ELIMINATED|HAI PERSO|YOU LOST|YOU LOSE)$/i;
  function iniziali(n){var s=String(n||'').replace(/[^A-Za-z0-9À-ÿ ]+/g,' ').trim();if(!s)return '?';var w=s.split(/\s+/);return ((w[0]||'').charAt(0)+((w[1]||'').charAt(0)||'')).toUpperCase();}
  function fotoDi(id,io,pr){
    try{if(typeof W.fvFoto==='function')return W.fvFoto(id,pr,io);}catch(e){}
    try{if(io){var u=W.Telegram&&Telegram.WebApp&&Telegram.WebApp.initDataUnsafe&&Telegram.WebApp.initDataUnsafe.user;if(u&&u.photo_url)return u.photo_url;}}catch(e){}
    try{if(/^\d{3,15}$/.test(String(id))&&typeof BACKEND!=='undefined')return BACKEND+'/foto/'+id+'.jpg';}catch(e){}
    return '';
  }
  function leggi(mm,f){
    var tEl=mm.querySelector('.tw-win-t,.tw-lose-t'),bt=mm.querySelector('.tw-ov-btns');
    if(!tEl||!bt)return null;
    var st=stato(f)||{},m=st.over||null;
    var root=tEl.parentNode,tono=tEl.classList.contains('tw-win-t')?'win':'lose';
    var tit=(tEl.textContent||'').trim(),TU=tit.toUpperCase();
    var onc=Array.prototype.map.call(bt.querySelectorAll('button'),function(b){return b.getAttribute('onclick')||'';}).join(' ');
    var ico='',prizeEl=root.querySelector('.tw-win-prize'),righe=[],extra=[];
    Array.prototype.forEach.call(root.children,function(c){
      if(c===tEl||c===bt||c===prizeEl||c.classList.contains('twr-rain'))return;
      if(c.classList.contains('tw-ov-sub')){righe.push(c);return;}
      if(!ico&&(!c.className||c.className==='twr-trophy')&&/font-size:\s*4\d/.test(c.getAttribute('style')||'')&&(c.textContent||'').trim().length<=4){ico=c.textContent.trim();return;}
      extra.push(c);
    });
    var gx=mm.querySelector('.gx-fine'),gxTipo=gx?gx.getAttribute('data-tipo'):'';
    var spett=!!st.spec||/TRIONFA|TRIUMPHS|MATCH CONCLUSO|MATCH FINITO|la guardavi|you were watching/i.test(mm.textContent||'')&&!/rtdAgain|twrAgain|tkAgain|gldAgain/.test(onc);
    var esito;
    if(f==='twr'&&!st.over&&/SEI FUORI|YOU.RE OUT/.test(TU))esito='fuori';
    else if(spett)esito='spett';
    else if(m&&m.annullata&&m.motivo==='pari'&&m.winner==null)esito='pari';
    else if((m&&m.annullata)||/ANNULLAT|INTERROTT|ABORTED|CANCELLED/.test(TU))esito='annullata';
    else if((m&&(m.pari||(m.motivo==='patta'&&m.winner==null)))||/^PATTA|PARI —|PAREGGIO|^DRAW|TIE/.test(TU))esito='pari';
    else if(gx||/LASCIATO|YOU LEFT/.test(TU))esito=(gxTipo==='torneo')?'tfuori':'abbandono';
    else if((m&&m.tour)||/TourDone|torneo/.test(onc)){esito=(m&&m.walkover&&m.you_won)||/PASSI SENZA|WITHOUT PLAYING/.test(TU)?'bye':(tono==='win'?'tpassa':'tfuori');}
    else if((m&&m.practice)||/Prac/.test(onc)||/ALLENAMENTO|PRACTICE/.test(TU))esito=tono==='win'?'pvinto':'pfinito';
    else if(tono==='win'&&m&&!m.you_won&&/RIPRENDI|TAKE BACK/.test(TU))esito='resa';
    else if(tono==='win'&&m&&!m.you_won&&Number(m.your_cut_eur)>0)esito='podio';
    else esito=(tono==='win')?'vittoria':'sconfitta';
    var modo;
    if(esito==='spett')modo='spett';
    else if(esito==='tpassa'||esito==='tfuori'||esito==='bye')modo='torneo';
    else if(esito==='pvinto'||esito==='pfinito')modo='pratica';
    else{var pot=m?Number(m.pot_eur)||0:Number(st.potEur)||0;modo=((m&&m.gratis)||!(pot>0)||(gxTipo==='gratis'))?'gratis':'soldi';}
    if(gxTipo==='torneo'||(m&&m.tour&&esito!=='spett'))modo='torneo';
    return {f:f,st:st,m:m,tEl:tEl,bt:bt,tit:tit,tono:tono,ico:ico,prizeEl:prizeEl,righe:righe,extra:extra,esito:esito,modo:modo,onc:onc};
  }
  var TEMA={vittoria:'oro',podio:'oro',tpassa:'oro',bye:'oro',pvinto:'oro',spett:'oro',sconfitta:'gelo',tfuori:'gelo',fuori:'gelo',abbandono:'gelo',pfinito:'gelo',pari:'neutro',annullata:'neutro',resa:'neutro'};
  var PAROLA={vittoria:'VITTORIA',podio:'PODIO',tpassa:'AVANZI',bye:'AVANZI',pvinto:'VITTORIA',spett:'FINE PARTITA',sconfitta:'SCONFITTA',tfuori:'ELIMINATO',fuori:'SEI FUORI',abbandono:'HAI LASCIATO',pfinito:'SCONFITTA',pari:'PAREGGIO',annullata:'ANNULLATA',resa:'POSTA SALVA'};
  var ICONA={vittoria:'🏆',podio:'🥈',tpassa:'🏆',bye:'🎟️',pvinto:'🏆',spett:'👁️',pari:'🤝',annullata:'🛡️',resa:'🛡️',abbandono:'🏳️'};
  var MODO={soldi:'A SOLDI',gratis:'GRATIS',torneo:'TORNEO',pratica:'ALLENAMENTO',spett:'SPETTATORE'};
  function posta(st,m){
    try{
      var pot=Number(m&&m.pot_eur)||0,n=Object.keys(st.names||{}).length,t=Number(st.tier);
      if(!(pot>0)||n<2)return null;
      if(t>0&&Math.abs(pot-t*n)<0.015)return t;
      if(n===2)return Math.round(pot*50)/100;
    }catch(e){}
    return null;
  }
  function costruisci(L){
    var m=L.m||{},st=L.st,e=L.esito,d={esito:e,tema:TEMA[e]||'oro',modo:L.modo,chips:[],giocatori:[],righe:[],tasti:[]};
    d.gioco=nomeGioco(L.f,L.m);
    d.icona=ICONA[e]||((d.tema==='gelo')?(emojiDi(d.gioco)||L.ico||'♠️'):(L.ico||'🏆'));
    if(e==='fuori'||e==='tfuori')d.icona=emojiDi(d.gioco)||'♠️';
    d.titolo=PAROLA[e]||L.tit;
    var tu=L.tit.replace(/[^\S\r\n]+/g,' ').trim();
    if(e==='podio'&&m.rank)d.titolo=m.rank+'°';
    if(!GENERICI.test(tu)&&tu.toUpperCase()!==d.titolo)d.sapore=tu;
    if(e==='podio'&&m.rank)d.sapore=T('POSTO SUL PODIO','PODIUM FINISH');
    var p=posta(st,L.m),pot=Number(m.pot_eur)||0;
    if(L.modo==='soldi'){
      var vinc=null;
      if(L.prizeEl){vinc=numDa(L.prizeEl.textContent);if(!(vinc>0)&&L.prizeEl.id)vinc=Number(m.your_cut_eur||m.prize_eur)||0;}
      if(e==='vittoria'||e==='podio'){
        if(vinc==null)vinc=Number((m.your_cut_eur>0)?m.your_cut_eur:m.prize_eur)||0;
        d.soldi={lab:'VINCITA',val:vinc,seg:'+'};
        if(p!=null)d.chips.push({l:'Posta',v:eur(p)});
        if(pot>0)d.chips.push({l:'Piatto',v:eur(pot)});
        if(p!=null&&vinc>p)d.chips.push({l:'Netto',v:eur(vinc-p,'+'),c:'su'});
        var gm=String(m.game||'');
        if(e==='vittoria'&&pot>vinc&&!(m.winners&&m.winners.length>1)&&!/^(race|uomonero|lupus)$/.test(gm))d.chips.push({l:'Casa',v:eur(pot-vinc)});
      }else if(e==='resa'){
        d.soldi={lab:'POSTA RESA',val:vinc!=null?vinc:(p||0),seg:'+'};
      }else if(e==='sconfitta'||e==='abbandono'||e==='fuori'){
        if(p==null&&e==='abbandono'){var b=L.righe[0]&&L.righe[0].querySelector('b');if(b)p=numDa(b.textContent);}
        if(p!=null&&e!=='fuori')d.soldi={lab:'POSTA PERSA',val:p,seg:'-'};
        if(pot>0)d.chips.push({l:'Piatto',v:eur(pot)});
      }else if(e==='annullata'||e==='pari'){
        d.soldi={lab:'POSTA RESA',val:p,seg:'',senza:p==null};
        var att=(m.rimborsata===false)||m.rimborso_in_sospeso;
        d.soldi.stato=att?['att','In arrivo sul saldo']:['ok','Tornata sul saldo'];
      }
    }else if(L.modo==='gratis'){d.pill='Nessun euro in gioco';}
    else if(L.modo==='pratica'){d.pill='Nessun premio: è allenamento';}
    else if(L.modo==='torneo'){
      try{if(typeof vsxTorneoInfo==='function'){var ti=vsxTorneoInfo();if(ti&&ti.turno)d.chips.push({l:'Turno',v:ti.turno});if(ti&&ti.testo)d.chips.push({l:'Montepremi',v:ti.testo});}}catch(x){}
    }
    var nn=Object.keys(st.names||{}).length;
    if(m.rank&&nn>2&&e!=='spett')d.chips.push({l:'Posizione',v:m.rank+'° / '+nn});
    if(Number(m.kills)>0)d.chips.push({l:'Kill',v:String(m.kills)});
    try{
      var io=String(st.myId||''),win={};
      if(m.winners&&m.winners.length)m.winners.forEach(function(w){win[String(w)]=1;});else if(m.winner!=null)win[String(m.winner)]=1;
      var ids=Object.keys(st.names||{});
      if(ids.length>=2&&ids.length<=12){
        ids.sort(function(a,b){return (win[b]?2:0)+(b===io?1:0)-((win[a]?2:0)+(a===io?1:0));});
        ids.forEach(function(id){var bt=/^bot/.test(id),pr=bt?null:((st.profiles||{})[id]||null),nm=pr?(W.fvNome?W.fvNome(pr.name):String(pr.name||'')):'';
        d.giocatori.push({id:id,nome:String(nm||st.names[id]||'?'),pr:pr,io:id===io,re:!!win[id]&&e!=='annullata'&&e!=='pari',bot:bt});});
      }
    }catch(x){}
    L.righe.forEach(function(r){if(/^\s*(Piatto|Pot)\b/i.test(r.textContent||''))return;d.righe.push(r);});
    L.extra.forEach(function(x){d.righe.push(x);});
    if(e==='sconfitta'||e==='pfinito')d.invito='Rifatti subito: la prossima può essere tua.';
    d.tasti=Array.prototype.slice.call(L.bt.querySelectorAll('button'));
    return d;
  }
  function fz(t,max){var n=String(t).length,lw=320;try{lw=Math.min(400,(W.innerWidth||360)-44);if(W.innerHeight<520&&W.innerWidth>W.innerHeight)lw=Math.min(380,W.innerWidth/2-40);}catch(e){}return Math.round(Math.max(24,Math.min(max,lw/(n*0.72))));}
  function htmlCarta(d,inline){
    var h='<div class="gbf-eroe">';
    h+='<div class="gbf-top">'+(d.gioco?'<span class="gbf-gioco">'+esc(String(d.gioco).replace(/^[^\w\s]+\s+/,''))+'</span>':'')+'<span class="gbf-modo m-'+d.modo+'">'+MODO[d.modo]+'</span></div>';
    if(!inline)h+='<div class="gbf-med" data-gbf="med"><div class="gbf-raggi"></div><div class="gbf-anello"></div><div class="gbf-ico">'+svgIcona(d)+'</div></div>';
    h+='<div class="gbf-tit" data-gbf="tit" data-t="'+esc(d.titolo)+'" style="--fz:'+fz(d.titolo,inline?42:58)+'px">'+esc(d.titolo)+'</div>';
    if(d.sapore)h+='<div class="gbf-fla" data-gbf="a">'+esc(d.sapore)+'</div>';
    h+='</div><div class="gbf-info">';
    if(d.soldi){
      h+='<div class="gbf-soldi" data-gbf="a"><div class="gbf-lab">'+d.soldi.lab+'</div>';
      if(!d.soldi.senza)h+='<div class="gbf-num" data-gbf="num" data-v="'+(Number(d.soldi.val)||0)+'" data-s="'+d.soldi.seg+'">'+numHTML(d.soldi.seg,d.soldi.val)+'</div>';
      if(d.soldi.stato)h+='<div class="gbf-stato '+d.soldi.stato[0]+'">'+d.soldi.stato[1]+'</div>';
      h+='</div>';
    }
    if(d.pill)h+='<div class="gbf-pill" data-gbf="a">'+d.pill+'</div>';
    if(d.chips.length){h+='<div class="gbf-chips">';d.chips.forEach(function(c){h+='<div class="gbf-chip'+(c.c?' '+c.c:'')+'" data-gbf="a"><i>'+c.l+'</i><b>'+esc(c.v)+'</b></div>';});h+='</div>';}
    if(d.giocatori.length&&!inline){
      h+='<div class="gbf-gioc">';var max=d.giocatori.length>5?4:5,k=0;
      d.giocatori.forEach(function(g){if(k++>=max)return;var f=fotoDi(g.id,g.io,g.pr);
        h+='<div class="gbf-g'+(g.io?' io':'')+(g.re?' re':'')+(g.bot?' bot':'')+'" data-gbf="a"><div class="gbf-av" data-ini="'+esc(iniziali(g.nome))+'">'+(f?'<img alt="" src="'+esc(f)+'">':esc(iniziali(g.nome)))+(g.re?'<span class="gbf-cor">👑</span>':'')+'</div><div class="gbf-gn">'+(g.io?'TU':esc(g.nome))+'</div></div>';});
      if(d.giocatori.length>max)h+='<div class="gbf-piu" data-gbf="a">+'+(d.giocatori.length-max)+'</div>';
      h+='</div>';
    }
    h+='<div class="gbf-det" data-gbf="a"></div>';
    if(d.invito)h+='<div class="gbf-inv" data-gbf="a">'+d.invito+'</div>';
    h+='</div>';
    return h;
  }
  function numHTML(seg,v){return '<span class="gbf-seg">'+(seg||'')+'</span><span class="gbf-cifra">'+eur(v)+'</span>';}
  function monta(box,d,inline){
    box.innerHTML=htmlCarta(d,inline);
    var det=box.querySelector('.gbf-det');
    d.righe.forEach(function(r){det.appendChild(r);});
    var bb=document.createElement('div');bb.className='gbf-btns';bb.setAttribute('data-gbf','b');
    d.tasti.forEach(function(b,i){b.className='gbf-b '+(i===0?'gbf-b1':'gbf-b2');b.removeAttribute('style');bb.appendChild(b);});
    return bb;
  }
  function fotoRipiego(box){
    Array.prototype.forEach.call(box.querySelectorAll('.gbf-av img'),function(im){
      im.addEventListener('error',function(){var a=im.parentNode;if(a){a.removeChild(im);a.insertBefore(document.createTextNode(a.getAttribute('data-ini')||'?'),a.firstChild);}});
    });
  }
  function molla(z,w,n){var out=[],wd=w*Math.sqrt(1-z*z),dur=Math.min(1.6,6/(z*w));for(var i=0;i<=n;i++){var t=dur*i/n;out.push(1-Math.exp(-z*w*t)*(Math.cos(wd*t)+(z*w/wd)*Math.sin(wd*t)));}return {k:out,ms:dur*1000};}
  function entra(el,ritardo,o){
    o=o||{};var s=molla(o.z||0.62,o.w||15,30),dy=o.dy==null?22:o.dy,s0=o.s0==null?0.96:o.s0,fr=[];
    s.k.forEach(function(y,i){fr.push({transform:'translateY('+(dy*(1-y)).toFixed(2)+'px) scale('+(s0+(1-s0)*y).toFixed(4)+')',opacity:Math.min(1,i/6),offset:i/(s.k.length-1)});});
    try{el.animate(fr,{duration:s.ms,delay:ritardo,easing:'linear',fill:'backwards'});}catch(e){}
  }
  function conta(el,v,seg,ritardo,fine){
    var cif=el.querySelector('.gbf-cifra');if(!cif){if(fine)fine();return;}
    var t0=0,w=6.5,ultimo=-1,tick=0;
    cif.textContent=eur(0);
    setTimeout(function(){
      function passo(ts){
        if(!el.isConnected)return;
        if(!t0)t0=ts;var t=(ts-t0)/1000,k=1-(1+w*t)*Math.exp(-w*t);if(t>1.25)k=1;
        var cur=Math.floor(v*k*100)/100;if(k>=1)cur=v;
        var tx=eur(cur);if(tx!==ultimo){cif.textContent=tx;ultimo=tx;}
        if(seg==='+'&&v>0&&ts-tick>110&&k<0.97){tick=ts;suono('coin',0.22);}
        if(k<1)requestAnimationFrame(passo);else{
          try{el.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(0.98)'},{transform:'scale(1)'}],{duration:420,easing:'ease-out'});}catch(e){}
          if(fine)fine();
        }
      }
      requestAnimationFrame(passo);
    },ritardo);
  }
  function coreografia(box,d,inline){
    var calmo=fermo(),i=0;
    if(calmo){return;}
    var med=box.querySelector('[data-gbf="med"]'),tit=box.querySelector('[data-gbf="tit"]');
    if(med)entra(med,40,{z:0.5,w:13,dy:0,s0:0.35});
    if(tit)entra(tit,150,{z:0.55,w:14,dy:0,s0:0.7});
    Array.prototype.forEach.call(box.querySelectorAll('[data-gbf="a"]'),function(el){entra(el,280+i*55);i++;});
    var bb=box.querySelector('[data-gbf="b"]')||box.parentNode.querySelector('[data-gbf="b"]');
    if(bb)entra(bb,420+i*55,{dy:30,s0:1});
  }
  function avviaNumero(box,d){
    var n=box.querySelector('[data-gbf="num"]');if(!n)return;
    var v=Number(n.getAttribute('data-v'))||0,seg=n.getAttribute('data-s')||'';
    if(fermo()||!(v>0)||seg!=='+'){return;}
    conta(n,v,seg,380,function(){if(d.tema==='oro'){hap('i','medium');suono('gold',0.45);}});
  }
  function adatta(box){
    function fai(){var t=box.querySelector('.gbf-tit');if(!t||!t.isConnected)return;var p=t.parentNode,av=(p&&p.clientWidth)||0;
      t.style.fontSize='';var w=t.scrollWidth;if(av>0&&w>av){var fs=parseFloat(getComputedStyle(t).fontSize)||40;t.style.fontSize=Math.max(20,Math.floor(fs*av/w*0.97))+'px';}}
    try{fai();requestAnimationFrame(function(){requestAnimationFrame(fai);});setTimeout(fai,250);}catch(e){}
  }
  function festa(host,overlay,poco){
    if(fermo())return;
    var cv=document.createElement('canvas');cv.className='gbf-cv';host.appendChild(cv);
    var dpr=Math.min(2,W.devicePixelRatio||1),Wd=host.clientWidth||W.innerWidth,Ht=host.clientHeight||W.innerHeight;
    cv.width=Math.round(Wd*dpr);cv.height=Math.round(Ht*dpr);var c=cv.getContext('2d');if(!c)return;c.scale(dpr,dpr);
    var P=[],COL=['#ffd45a','#fff1b8','#f5b829','#ff4fd8','#22d3ee','#ffffff'],N=poco?26:(Wd>700?90:64);
    function nuovo(x,y,vx,vy,coin){P.push({x:x,y:y,vx:vx,vy:vy,r:Math.random()*6.28,vr:(Math.random()-.5)*12,ph:Math.random()*6.28,vp:6+Math.random()*8,s:coin?(6+Math.random()*4):(4+Math.random()*4),coin:coin,col:COL[(Math.random()*COL.length)|0],v:1});}
    for(var i=0;i<N;i++){var lato=i%2?1:-1,coin=Math.random()<0.38;
      nuovo(Wd/2+lato*Wd*0.42,Ht*0.95,-lato*(120+Math.random()*260),-(Ht*0.9+Math.random()*Ht*0.6),coin);}
    var t0=0,ult=0;
    function fr(ts){
      if(!cv.isConnected||(overlay&&!overlay.classList.contains('show'))){if(cv.parentNode)cv.parentNode.removeChild(cv);return;}
      if(!t0){t0=ts;ult=ts;}var dt=Math.min(0.034,(ts-ult)/1000);ult=ts;var age=(ts-t0)/1000;
      c.clearRect(0,0,Wd,Ht);
      for(var j=0;j<P.length;j++){var p=P[j];
        p.vy+=(p.coin?1500:900)*dt;p.vx*=(1-1.2*dt);p.vy*=(1-(p.coin?0.6:2.2)*dt);p.x+=p.vx*dt+(p.coin?0:Math.sin(p.ph)*18*dt);p.y+=p.vy*dt;p.r+=p.vr*dt;p.ph+=p.vp*dt;
        var al=age>2.4?Math.max(0,1-(age-2.4)/0.8):1;if(al<=0||p.y>Ht+30)continue;
        c.globalAlpha=al;c.save();c.translate(p.x,p.y);
        if(p.coin){var sx=Math.abs(Math.cos(p.ph))*0.85+0.15;c.scale(sx,1);c.beginPath();c.arc(0,0,p.s,0,6.283);c.fillStyle='#e9a92a';c.fill();c.beginPath();c.arc(0,0,p.s*0.72,0,6.283);c.fillStyle='#ffd965';c.fill();c.fillStyle='rgba(255,255,255,.7)';c.fillRect(-p.s*0.45,-p.s*0.5,p.s*0.3,p.s*0.5);}
        else{c.rotate(p.r);c.scale(1,Math.cos(p.ph));c.fillStyle=p.col;c.fillRect(-p.s,-p.s*0.4,p.s*2,p.s*0.8);}
        c.restore();}
      c.globalAlpha=1;
      if(age<3.3)requestAnimationFrame(fr);else if(cv.parentNode)cv.parentNode.removeChild(cv);
    }
    setTimeout(function(){requestAnimationFrame(fr);},260);
  }
  function pulisci(o,mm){o.classList.remove('gbf-o','gbf-t-oro','gbf-t-gelo','gbf-t-neutro');mm.classList.remove('gbf-m');var cv=o.querySelector(':scope > .gbf-cv');if(cv)cv.remove();}
  function apri(o,mm,d){
    var box=document.createElement('div');box.className='gbf gbf-t-'+d.tema;box.setAttribute('data-esito',d.esito);
    var col=document.createElement('div');col.className='gbf-col';box.appendChild(col);
    var bb=monta(col,d,false);box.appendChild(bb);
    var tieni=document.createElement('div');tieni.className='gbf-hid';
    while(mm.firstChild)tieni.appendChild(mm.firstChild);
    Array.prototype.forEach.call(tieni.querySelectorAll('[id]'),function(x){if(x.id==='twr-prize')x.removeAttribute('id');});
    mm.appendChild(box);mm.appendChild(tieni);
    o.classList.remove('gbf-t-oro','gbf-t-gelo','gbf-t-neutro');o.classList.add('gbf-o','gbf-t-'+d.tema);mm.classList.add('gbf-m');
    fotoRipiego(box);adatta(box);coreografia(box,d,false);avviaNumero(box,d);
    if(d.tema==='oro'&&d.esito!=='spett')festa(o,o,d.modo!=='soldi');
    if(d.tema==='gelo')hap('i','soft');
    W.GBF.ultimo=d;
  }
  var dentro=false;
  function guarda(mm){
    if(dentro)return;var o=mm.parentNode;if(!o)return;
    if(mm.querySelector(':scope > .gbf'))return;
    var L=null;try{L=leggi(mm,FAM[mm.id]);}catch(e){L=null;}
    if(!L){pulisci(o,mm);return;}
    dentro=true;
    try{var d=costruisci(L);apri(o,mm,d);}catch(e){try{console.warn('GBF',e);}catch(_){}}
    dentro=false;
  }
  var PVP_ULT={k:'',t:0};
  function pvpGuarda(mm){
    if(dentro)return;
    var r=mm.querySelector('.pvp-result');if(!r||r.closest('.gbf-in'))return;
    var par=r.parentNode,sib=[],x=r.nextSibling;
    while(x){sib.push(x);x=x.nextSibling;}
    var btn=sib.filter(function(n){return n.nodeType===1&&n.tagName==='BUTTON'&&/pvp-m-btn/.test(n.className);});
    if(!btn.length)return;
    var amtEl=sib.filter(function(n){return n.nodeType===1&&n.tagName==='DIV'&&!n.className;})[0]||null;
    var txt=(r.textContent||'').replace(/^[^\wÀ-ÿ]+/,'').trim(),TU=txt.toUpperCase(),amt=amtEl?(amtEl.textContent||'').trim():'';
    var cls=r.classList.contains('win')?'win':(r.classList.contains('lose')?'lose':'');
    var onc=btn.map(function(b){return b.getAttribute('onclick')||'';}).join(' ');
    var e,modo='soldi';
    if(/PASSI|ADVANCE/.test(TU))e='tpassa';else if(/ELIMINAT/.test(TU))e='tfuori';
    else if(/PUSH|DRAW|PATTA|PARI|TIE/.test(TU)||(!cls&&/returned|resa|rimbors/i.test(amt)))e='pari';
    else if(/ALLENAMENTO|PROVA|PRACTICE|BOT/.test(TU+' '+amt.toUpperCase())){e=cls==='win'?'pvinto':'pfinito';}
    else e=cls==='win'?'vittoria':'sconfitta';
    if(/torneo/.test(onc)||e==='tpassa'||e==='tfuori')modo='torneo';else if(e==='pvinto'||e==='pfinito'||/practiceStart|GRATIS/.test(onc+' '+amt))modo=(e==='pvinto'||e==='pfinito')?'pratica':'gratis';
    if(modo==='pratica'&&e==='vittoria')e='pvinto';if(modo==='pratica'&&e==='sconfitta')e='pfinito';
    var d={esito:e,tema:TEMA[e]||'oro',modo:modo,gioco:'',chips:[],giocatori:[],righe:[],tasti:btn};
    sib.forEach(function(n){if(n.nodeType===1&&n!==amtEl&&btn.indexOf(n)<0&&(n.textContent||'').trim())d.righe.push(n);});
    d.titolo=PAROLA[e];
    if(txt&&!GENERICI.test(txt)&&!/^(YOU WIN|YOU LOSE|PUSH)$/i.test(txt)&&txt.toUpperCase()!==d.titolo)d.sapore=txt;
    var v=numDa(amt);
    if(modo==='soldi'&&v!=null){
      if(e==='vittoria')d.soldi={lab:'VINCITA NETTA',val:v,seg:'+'};
      else if(e==='sconfitta')d.soldi={lab:'POSTA PERSA',val:v,seg:'-'};
      else if(e==='pari')d.soldi={lab:'POSTA RESA',val:v,seg:''};
    }else if(modo==='pratica'||modo==='gratis')d.pill=modo==='pratica'?'Nessun premio: è allenamento':'Nessun euro in gioco';
    if(e==='sconfitta')d.invito='Rifatti subito: la prossima può essere tua.';
    dentro=true;
    try{
      var box=document.createElement('div');box.className='gbf-in gbf-t-'+d.tema;box.setAttribute('data-esito',e);
      var bb=monta(box,d,true);box.appendChild(bb);
      var tieni=document.createElement('div');tieni.className='gbf-hid';
      par.insertBefore(box,r);tieni.appendChild(r);sib.forEach(function(n){if(n.parentNode===par&&btn.indexOf(n)<0&&d.righe.indexOf(n)<0)tieni.appendChild(n);});
      box.appendChild(tieni);
      adatta(box);
      var k=e+'|'+txt+'|'+amt,ora=Date.now(),nuovo=!(PVP_ULT.k===k&&ora-PVP_ULT.t<30000);PVP_ULT.k=k;PVP_ULT.t=ora;
      if(nuovo){coreografia(box,d,true);avviaNumero(box,d);if(d.tema==='oro')festa(box,null,true);if(d.tema==='gelo')hap('i','soft');}
      W.GBF.ultimo=d;
    }catch(er){try{console.warn('GBF pvp',er);}catch(_){}}
    dentro=false;
  }
  function gbfApri(d,id){
    var mm=document.getElementById(id||'arc-modal');if(!mm)return false;var o=mm.parentNode;
    d=d||{};d.chips=d.chips||[];d.giocatori=d.giocatori||[];d.righe=d.righe||[];d.tasti=d.tasti||[];d.tema=d.tema||TEMA[d.esito]||'oro';d.modo=d.modo||'soldi';d.titolo=d.titolo||PAROLA[d.esito]||'';d.icona=d.icona||ICONA[d.esito]||'🏆';
    mm.innerHTML='';o.classList.add('show');dentro=true;try{apri(o,mm,d);}finally{dentro=false;}return true;
  }
  function avvia(){
    Object.keys(FAM).forEach(function(id){
      var mm=document.getElementById(id);if(!mm||mm.__gbf)return;mm.__gbf=1;
      new MutationObserver(function(){guarda(mm);}).observe(mm,{childList:true});
      if(mm.firstChild)guarda(mm);
    });
    var pm=document.getElementById('pvp-modal');
    if(pm&&!pm.__gbf){pm.__gbf=1;new MutationObserver(function(){pvpGuarda(pm);}).observe(pm,{childList:true,subtree:true});}
  }
  W.GBF={versione:'1710',ultimo:null,apri:gbfApri,disegna:htmlCarta,avvia:avvia};
  W.gbfApri=gbfApri;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',avvia);else avvia();
})();
