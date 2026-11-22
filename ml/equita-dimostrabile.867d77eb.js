var FAIR_T={it:{titolo:"EQUITÀ",
  intro:"Ogni giocata contro la casa nasce dal <b>seme del server</b> (segreto, ma ne vedi già l'impronta), dal <b>tuo seme</b> e dal <b>numero della giocata</b>. Quando cambi seme ti viene rivelato quello vecchio: con «Verifica» rifai ogni giocata e controlli che l'impronta torni.",
  hash:"Impronta del seme del server (sha256)",nonce:"Prossima giocata: n°",client:"Il tuo seme",salva:"SALVA",
  regole:"Lettere, cifre, _ e - · max 32. Salvarlo cambia anche il seme del server.",ruota:"🔄 CAMBIA SEME DEL SERVER",
  rivelati:"📜 SEMI RIVELATI",ultime:"🕘 ULTIME GIOCATE (n° → gioco)",nessuno:"Nessun seme ritirato, per ora: cambia seme per rivelare quello in uso.",
  attesa:"⏳ si rivela fra poco (o a partita finita)",srv:"Seme del server",cli:"Tuo seme",giocate:"giocate n° 0–",zero:"nessuna giocata",
  verifica:"🔍 VERIFICA",fatto:"✅ Seme cambiato. Quello vecchio compare qui sotto fra un minuto.",
  aperta:"⏸ Hai una partita ancora aperta (gratta, bot roulette, caveau, poker, blackjack, run o crash). Finiscila e poi cambia seme: rivelarlo adesso vorrebbe dire mostrarti le carte che devi ancora pescare.",
  clientno:"❌ Il seme può avere solo lettere, cifre, _ e -, al massimo 32 caratteri.",errore:"Connessione non riuscita, riprova.",nessunag:"Nessuna giocata con questo seme."},
 en:{titolo:"PROVABLY FAIR",
  intro:"Every bet against the house comes from the <b>server seed</b> (secret, but you already see its fingerprint), <b>your seed</b> and the <b>bet number</b>. When you change seed the old one is revealed: tap «Verify» to replay every bet and check the fingerprint matches.",
  hash:"Server seed fingerprint (sha256)",nonce:"Next bet: #",client:"Your seed",salva:"SAVE",
  regole:"Letters, digits, _ and - · max 32. Saving it also changes the server seed.",ruota:"🔄 CHANGE SERVER SEED",
  rivelati:"📜 REVEALED SEEDS",ultime:"🕘 LATEST BETS (# → game)",nessuno:"No retired seeds yet: change seed to reveal the current one.",
  attesa:"⏳ revealed shortly (or when your game ends)",srv:"Server seed",cli:"Your seed",giocate:"bets #0–",zero:"no bets",
  verifica:"🔍 VERIFY",fatto:"✅ Seed changed. The old one shows up below in a minute.",
  aperta:"⏸ You still have a game open (scratch, bot roulette, vault, poker, blackjack, run or crash). Finish it, then change seed: revealing it now would show you the cards you haven't drawn yet.",
  clientno:"❌ The seed can only have letters, digits, _ and -, at most 32 characters.",errore:"Connection failed, try again.",nessunag:"No bets with this seed."}};
function fairT(){return FAIR_T[(window.GB_LANG==='en')?'en':'it'];}
function fairEsc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fairMsg(t,cl){var m=document.getElementById('fair-msg');if(m){m.className='fair-msg '+(cl||'');m.innerHTML=t||'';}}
function fairApriVerifica(s,c,h){
  var u=BACKEND+'/equita?s='+encodeURIComponent(s)+'&c='+encodeURIComponent(c)+'&h='+encodeURIComponent(h);
  try{ if(tg&&tg.openLink){tg.openLink(u);return;} }catch(e){}
  window.open(u,'_blank');
}
function fairDisegna(d){
  var T=fairT();
  document.getElementById('fair-hash').textContent=d.hash||'—';
  document.getElementById('fair-nonce').textContent=(d.nonce!=null?d.nonce:'—');
  var inp=document.getElementById('fair-client');
  if(inp&&document.activeElement!==inp)inp.value=d.client||'';
  var st=document.getElementById('fair-storico');
  if(!d.storico||!d.storico.length){st.innerHTML='<div class="fair-card fair-hint">'+T.nessuno+'</div>';}
  else st.innerHTML=d.storico.slice(0,5).map(function(x){
    var g=x.giocate?(T.giocate+(x.giocate-1)):T.zero;
    var srv=x.server?'<div class="fair-mono">'+fairEsc(x.server)+'</div>'+
      '<button class="fair-btn" onclick="fairApriVerifica(\''+fairEsc(x.server)+'\',\''+fairEsc(x.client)+'\',\''+fairEsc(x.hash)+'\')">'+T.verifica+'</button>'
      :'<div class="fair-hint">'+T.attesa+'</div>';
    return '<div class="fair-seed"><b>#'+fairEsc(x.sid)+'</b> · '+g+' · '+T.cli+': <span class="fair-mono">'+fairEsc(x.client)+'</span>'+
      '<div class="fair-lbl">'+T.hash+'</div><div class="fair-mono">'+fairEsc(x.hash)+'</div>'+
      '<div class="fair-lbl">'+T.srv+'</div>'+srv+'</div>';
  }).join('');
  var gl=document.getElementById('fair-giocate');
  gl.innerHTML=(d.giocate&&d.giocate.length)?d.giocate.slice(0,20).map(function(g){return '<b>'+fairEsc(g[0])+'</b> → '+fairEsc(g[1]);}).join(' · '):T.nessunag;
}
function fairInit(){
  var T=fairT();
  [].forEach.call(document.querySelectorAll('#fair [data-fair]'),function(el){var k=el.getAttribute('data-fair');if(T[k]!=null)el.innerHTML=T[k];});
  fairMsg('');
  if(!S.userId)return;
  fetch(BACKEND+'/equita/stato?user_id='+S.userId+'&_t='+Date.now(),{cache:'no-store'})
    .then(function(r){return r.json();}).then(function(d){if(d&&d.ok)fairDisegna(d);else fairMsg(T.errore,'ko');})
    .catch(function(){fairMsg(T.errore,'ko');});
}
function fairManda(corpo){
  var T=fairT();
  [].forEach.call(document.querySelectorAll('#fair .fair-btn'),function(b){b.disabled=true;});
  corpo.user_id=S.userId;
  fetch(BACKEND+'/equita/ruota',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corpo)})
    .then(function(r){return r.json();}).then(function(d){
      if(d&&d.ok){fairDisegna(d);fairMsg(T.fatto,'ok');setTimeout(function(){if(CUR==='fair')fairInit();},62000);}
      else fairMsg(d&&d.error==='aperta'?T.aperta:(d&&d.error==='client'?T.clientno:T.errore),'ko');
    }).catch(function(){fairMsg(T.errore,'ko');})
    .then(function(){[].forEach.call(document.querySelectorAll('#fair .fair-btn'),function(b){b.disabled=false;});});
}
function fairRuota(){fairManda({});}
function fairSalvaClient(){
  var v=(document.getElementById('fair-client').value||'').trim();
  if(!/^[A-Za-z0-9_\-]{1,32}$/.test(v)){fairMsg(fairT().clientno,'ko');return;}
  fairManda({client:v});
}
