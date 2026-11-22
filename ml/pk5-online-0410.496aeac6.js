var PK5RT_VER="p5-425692b5";
var PK5={ov:null,wrap:null,fr:null,pronto:false,coda:[],aperto:false,lista:false,modo:'',tid:'',guardaTid:'',
  el:null,ultimo:null,attesaSiedi:0,verifica:false,dopo:null,tmrEl:0,tmrRete:0,rit:0,retiT:0,tgEv:false,loads:0,
  bot:3,livello:'medio',esci:false};
var PK5_POSTE=[10,25,50,100];
var PK5_MOSSE={passo:1,vedo:1,rilancio:1,lascio:1,cambio:1,scegli_variante:1,scopri:1,scarta:1,scambia:1};
function pk5En(){return window.GB_LANG==='en';}
function pk5Url(){return 'poker5.html?guscio=1&v='+PK5RT_VER+'&lang='+(pk5En()?'en':'it');}
var PK5_ORIGIN=location.origin;
function pk5E(cent){var v=(Math.round(Number(cent)||0)/100).toFixed(2);return pk5En()?('€'+v):(v.replace('.',',')+' €');}
function pk5Esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function pk5Saldo(){try{return Math.max(0,Math.floor((typeof capEur==='function'?capEur():0)*100+1e-6));}catch(e){return 0;}}
function pk5Int(x,lo,hi){return (typeof x==='number'&&isFinite(x)&&Math.floor(x)===x&&x>=lo&&x<=hi);}
function pk5TidOk(t){return typeof t==='string'&&/^[A-Za-z0-9-]{1,40}$/.test(t);}
function pk5Css(){
  if(document.getElementById('pk5-css'))return;
  var st=document.createElement('style');st.id='pk5-css';
  st.textContent=''
  +'#pk5-ov{position:fixed;inset:0;z-index:9050;display:none;flex-direction:column;background:radial-gradient(ellipse at 50% -10%,#14301f 0%,#090d14 55%,#06080d 100%);color:#e7eef6;font-family:Inter,system-ui,sans-serif;}'
  +'#pk5-ov.on{display:flex;}'
  +'#pk5-ov .pk5-hd{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:calc(10px + max(env(safe-area-inset-top,0px),var(--tg-top,0px))) 12px 8px;}'
  +'#pk5-ov .pk5-back{width:38px;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#e7eef6;font-size:18px;cursor:pointer;}'
  +'#pk5-ov .pk5-tt{flex:1 1 auto;min-width:0;font-family:"Russo One",Impact,sans-serif;font-size:17px;letter-spacing:.6px;color:#bef264;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
  +'#pk5-ov .pk5-saldo{flex:0 0 auto;font:800 12px/1 ui-monospace,Menlo,monospace;color:#fde68a;background:rgba(0,0,0,.35);border:1px solid rgba(253,230,138,.35);border-radius:999px;padding:7px 10px;}'
  +'#pk5-ov .pk5-sc{flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 12px calc(18px + env(safe-area-inset-bottom,0px));max-width:640px;width:100%;margin:0 auto;box-sizing:border-box;}'
  +'#pk5-ov .pk5-sub{font-size:12.5px;line-height:1.45;color:#aab6c4;margin:2px 2px 12px;}'
  +'#pk5-ov .pk5-sez{margin:14px 2px 8px;font:800 11px/1.2 system-ui,sans-serif;letter-spacing:1.2px;color:#8fa3b8;display:flex;align-items:center;gap:8px;}'
  +'#pk5-ov .pk5-sez i{font-style:normal;font-weight:700;color:#fca5a5;letter-spacing:.3px;}'
  +'#pk5-ov .pk5-poste{display:grid;grid-template-columns:1fr 1fr;gap:8px;}'
  +'#pk5-ov .pk5-po{position:relative;border-radius:14px;padding:11px 11px 10px;background:linear-gradient(160deg,rgba(32,48,38,.92),rgba(12,18,24,.95));border:1px solid rgba(190,242,100,.28);box-shadow:0 6px 18px rgba(0,0,0,.35);}'
  +'#pk5-ov .pk5-po b{display:block;font:900 22px/1.05 ui-monospace,Menlo,monospace;color:#f7fee7;}'
  +'#pk5-ov .pk5-po small{display:block;font:600 10.5px/1.35 system-ui,sans-serif;color:#9fb0c0;margin-top:3px;}'
  +'#pk5-ov .pk5-po .n{display:block;font:700 10.5px/1.3 system-ui,sans-serif;color:#bef264;margin-top:4px;min-height:14px;}'
  +'#pk5-ov .pk5-po.spento{opacity:.45;filter:grayscale(.6);}'
  +'#pk5-ov .pk5-bt{display:block;width:100%;margin-top:8px;min-height:40px;border-radius:11px;border:1px solid rgba(190,242,100,.6);background:linear-gradient(180deg,#65a30d,#3f6212);color:#f7fee7;font:800 12px/1 system-ui,sans-serif;letter-spacing:.7px;cursor:pointer;}'
  +'#pk5-ov .pk5-bt.alt{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.2);color:#dbe4ee;}'
  +'#pk5-ov .pk5-bt[disabled]{opacity:.5;cursor:default;}'
  +'#pk5-ov .pk5-tav{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);margin-bottom:6px;}'
  +'#pk5-ov .pk5-tav .ps{flex:0 0 auto;min-width:54px;text-align:center;font:900 12px/1 ui-monospace,monospace;color:#1a2e05;background:#bef264;border-radius:8px;padding:6px 5px;}'
  +'#pk5-ov .pk5-tav .ps.gr{background:#7dd3fc;color:#082f49;}'
  +'#pk5-ov .pk5-tav .ch{flex:1 1 auto;min-width:0;}'
  +'#pk5-ov .pk5-tav .ch b{display:block;font:700 12px/1.25 system-ui,sans-serif;color:#e7eef6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
  +'#pk5-ov .pk5-tav .ch small{display:block;font:600 10.5px/1.3 system-ui,sans-serif;color:#8fa3b8;}'
  +'#pk5-ov .pk5-tav button{flex:0 0 auto;min-height:36px;padding:0 10px;border-radius:10px;border:1px solid rgba(190,242,100,.55);background:rgba(101,163,13,.3);color:#ecfccb;font:800 10.5px/1 system-ui,sans-serif;letter-spacing:.5px;cursor:pointer;}'
  +'#pk5-ov .pk5-tav button.g{border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#cbd5e1;}'
  +'#pk5-ov .pk5-vuoto{font-size:12px;color:#8fa3b8;padding:10px 4px;}'
  +'#pk5-ov .pk5-bot{border-radius:14px;padding:12px;background:linear-gradient(160deg,rgba(30,41,59,.9),rgba(12,18,24,.95));border:1px solid rgba(125,211,252,.3);}'
  +'#pk5-ov .pk5-sc2{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;}'
  +'#pk5-ov .pk5-sc2 button{flex:1 1 0;min-width:44px;min-height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#dbe4ee;font:800 11px/1 system-ui,sans-serif;cursor:pointer;}'
  +'#pk5-ov .pk5-sc2 button.on{border-color:#7dd3fc;background:rgba(125,211,252,.18);color:#e0f2fe;}'
  +'#pk5-ov .pk5-nota{font-size:11px;line-height:1.45;color:#7f8fa1;margin:12px 2px 0;}'
  +'.pk5-mod{position:fixed;inset:0;z-index:10040;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(0,0,0,.72);}'
  +'.pk5-mod .bx{width:100%;max-width:380px;background:linear-gradient(165deg,#141a2e,#0a0e1a);border:1px solid #84cc16;border-radius:18px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.7);color:#e5e7eb;font-family:Inter,system-ui,sans-serif;}'
  +'.pk5-mod h3{margin:0 0 4px;font-family:"Russo One",sans-serif;font-size:16px;color:#bef264;font-weight:400;letter-spacing:.4px;}'
  +'.pk5-mod p{margin:6px 0;font-size:13px;line-height:1.45;color:#cbd5e1;}'
  +'.pk5-mod .cifra{text-align:center;margin:12px 0 4px;font:900 30px/1.1 ui-monospace,Menlo,monospace;color:#fde68a;}'
  +'.pk5-mod .cifra small{display:block;font:700 11px/1.4 system-ui,sans-serif;color:#94a3b8;}'
  +'.pk5-mod input[type=range]{width:100%;accent-color:#84cc16;height:34px;}'
  +'.pk5-mod .pre{display:flex;gap:6px;margin-top:4px;}'
  +'.pk5-mod .pre button{flex:1 1 0;min-height:34px;border-radius:9px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#dbe4ee;font:800 11px/1 system-ui,sans-serif;cursor:pointer;}'
  +'.pk5-mod .riga{display:flex;justify-content:space-between;font-size:12px;color:#94a3b8;margin-top:8px;}'
  +'.pk5-mod .riga b{color:#e2e8f0;font-family:ui-monospace,Menlo,monospace;}'
  +'.pk5-mod .err{margin-top:8px;font-size:12.5px;color:#fca5a5;min-height:16px;}'
  +'.pk5-mod .ok{display:block;width:100%;margin-top:12px;}'
  +'.pk5-mod .no{display:block;width:100%;margin-top:8px;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.18)!important;color:#cbd5e1!important;box-shadow:none!important;}'
  +'.pk5-mod .gira{width:34px;height:34px;margin:10px auto;border-radius:50%;border:3px solid rgba(190,242,100,.25);border-top-color:#bef264;animation:pk5g 1s linear infinite;}'
  +'@keyframes pk5g{to{transform:rotate(360deg);}}'
  +'#pk5-toast{position:fixed;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:10045;max-width:90%;padding:10px 16px;border-radius:12px;background:#141b2b;border:1px solid rgba(255,255,255,.18);color:#e5e7eb;font:600 13px/1.4 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity .25s;text-align:center;}'
  +'#pk5-toast.on{opacity:1;}#pk5-toast.err{border-color:#ef4444;}#pk5-toast.ok{border-color:#84cc16;}';
  document.head.appendChild(st);
}
function pk5Toast(msg,tipo,ms){
  pk5Css();
  var t=document.getElementById('pk5-toast');
  if(!t){t=document.createElement('div');t.id='pk5-toast';document.body.appendChild(t);}
  t.textContent=msg;t.className='on '+(tipo||'');
  clearTimeout(t._tm);t._tm=setTimeout(function(){t.className='';},ms||2600);
}
function pk5Vivo(){return PK5.lista||!!PK5.modo||PK5.attesaSiedi>0||PK5.verifica;}
function pk5Rete(){
  if(typeof rtdConnect!=='function'||typeof RTD==='undefined')return;
  if(!RTD.ws||RTD.ws.readyState>1){ try{rtdConnect();}catch(e){} }
  if(!PK5.tmrRete)PK5.tmrRete=setInterval(pk5Guardia,1500);
}
function pk5Guardia(){
  if(!pk5Vivo()){clearInterval(PK5.tmrRete);PK5.tmrRete=0;return;}
  var ok=!!(RTD.ws&&RTD.ws.readyState===1&&RTD.wsOk);
  if(PK5.pronto)pk5Posta({t:'rete',ok:ok});
  if(ok){PK5.rit=0;return;}
  if(RTD.ws&&RTD.ws.readyState===0)return;
  var ora=Date.now();
  if(RTD.closedByUs){
    if(ora-(PK5.kickT||0)>60000)PK5.kick=0;
    PK5.kickT=ora;PK5.kick=(PK5.kick|0)+1;
    if(PK5.kick>3){ if(PK5.kick===4)pk5Toast(pk5En()?'The game is open on another device':'Il gioco è aperto su un altro dispositivo','err',4000); return; }
    RTD.closedByUs=false;
  }
  if(ora<PK5.retiT)return;
  PK5.rit=Math.min(PK5.rit+1,6);
  PK5.retiT=ora+Math.round(900*Math.pow(1.5,PK5.rit));
  try{rtdConnect();}catch(e){}
}
function pk5Manda(o){
  if(typeof RTD==='undefined'||!RTD.wsOk||!RTD.ws||RTD.ws.readyState!==1){
    pk5Toast(pk5En()?'No connection: try again in a moment':'Connessione assente: riprova fra un attimo','err');pk5Rete();return false;
  }
  rtdSend(o);return true;
}
function pk5Apri(o){
  o=o||{};
  pk5Css();
  if(!(window.S&&S.userId)){ var n=(o._n|0)+1; if(n<30){o._n=n;setTimeout(function(){pk5Apri(o);},300);} return; }
  if(!PK5.ov){
    var d=document.createElement('div');d.id='pk5-ov';
    d.innerHTML='<div class="pk5-hd"><button class="pk5-back" type="button" aria-label="indietro">←</button>'
      +'<div class="pk5-tt">♠ POKER · '+(pk5En()?'5-HANDED TABLE':'TAVOLO A 5')+'</div><div class="pk5-saldo" id="pk5-saldo"></div></div>'
      +'<div class="pk5-sc" id="pk5-sc"></div>';
    document.body.appendChild(d);PK5.ov=d;
    d.querySelector('.pk5-back').onclick=pk5Chiudi;
    d.addEventListener('click',pk5ClickLista,false);
  }
  PK5.lista=true;PK5.ov.classList.add('on');
  try{if(typeof TWS!=='undefined'){TWS.init();TWS.res();}}catch(_a){}
  PK5.dopo=(o.modo&&o.modo!=='lista')?o:null;
  pk5Disegna();
  pk5Rete();
  if(RTD.wsOk)pk5DopoHello();
  if(!PK5.tmrEl)PK5.tmrEl=setInterval(function(){
    if(!PK5.lista||PK5.aperto){return;}
    if(RTD.wsOk)rtdSend({t:'pk5_elenco'});
    var sd=document.getElementById('pk5-saldo');if(sd)sd.textContent=pk5E(pk5Saldo());
  },6000);
  if(typeof loadBalance==='function'){try{loadBalance().then(function(){pk5Disegna();});}catch(e){}}
}
function pk5Chiudi(){
  if(PK5.modo==='seduto'){pk5Mostra();return;}
  PK5.lista=false;
  if(PK5.ov)PK5.ov.classList.remove('on');
  if(PK5.tmrEl){clearInterval(PK5.tmrEl);PK5.tmrEl=0;}
}
function pk5DopoHello(){
  if(PK5.lista)rtdSend({t:'pk5_elenco'});
  if(PK5.modo)pk5Giu({t:'pieno'});
  if(PK5.modo==='guarda'&&PK5.tid)rtdSend({t:'pk5_guarda',tid:PK5.tid});
  var d=PK5.dopo;
  if(d&&d.modo==='prova'){PK5.dopo=null;pk5Allena();}
  else if(d&&d.modo==='guarda'&&pk5TidOk(d.tid)){PK5.dopo=null;PK5.guardaTid=d.tid;rtdSend({t:'pk5_guarda',tid:d.tid});}
}
function pk5Disegna(){
  if(!PK5.ov)return;
  var en=pk5En(),E=PK5.el||{},tv=E.tavoli||[],soldi=(E.soldi!==false);
  var sd=document.getElementById('pk5-saldo');if(sd)sd.textContent=pk5E(pk5Saldo());
  var h='<div class="pk5-sub">'+(en
    ?'Italian poker from 2 to 5 players, with the <b>teresina</b>. Sit down buying chips from your balance, play as many hands as you like, stand up whenever you want: your chips go back to your balance.'
    :'Poker all’italiana da 2 a 5, con la <b>teresina</b>. Ti siedi comprando fiche col saldo, giochi quante mani vuoi, ti alzi quando vuoi: le tue fiche tornano sul saldo.')+'</div>';
  if(PK5.modo==='seduto')h+='<button class="pk5-bt" data-a="torna">'+(en?'♠ BACK TO YOUR TABLE':'♠ TORNA AL TUO TAVOLO')+'</button>';
  h+='<div class="pk5-sez">'+(en?'💶 CASH TABLES':'💶 A SOLDI')+(soldi?'':' <i>'+(en?'opening soon':'aprono presto')+'</i>')+'</div><div class="pk5-poste">';
  for(var i=0;i<PK5_POSTE.length;i++){
    var p=PK5_POSTE[i],nt=0,ng=0;
    for(var k=0;k<tv.length;k++)if(tv[k].tipo==='soldi'&&tv[k].posta===p){nt++;ng+=tv[k].seduti|0;}
    h+='<div class="pk5-po'+(soldi?'':' spento')+'"><b>'+pk5E(p)+'</b><small>'+(en?'stake · buy-in ':'posta · buy-in ')+pk5E(20*p)+' – '+pk5E(100*p)+'</small>'
      +'<span class="n">'+(nt?(nt+' '+(en?(nt>1?'tables':'table'):(nt>1?'tavoli':'tavolo'))+' · '+ng+' '+(en?'seated':'seduti')):(en?'no table yet':'nessun tavolo, apri tu'))+'</span>'
      +'<button class="pk5-bt" data-a="posta" data-p="'+p+'"'+(soldi&&PK5.modo!=='seduto'?'':' disabled')+'>'+(en?'SIT DOWN':'SIEDITI')+'</button></div>';
  }
  h+='</div>';
  h+='<div class="pk5-sez">'+(en?'🃏 OPEN TABLES':'🃏 TAVOLI APERTI')+'</div>';
  if(!PK5.el)h+='<div class="pk5-vuoto">'+(en?'Loading…':'Carico…')+'</div>';
  else if(!tv.length)h+='<div class="pk5-vuoto">'+(en?'No open table: sit down and the table opens with you.':'Nessun tavolo aperto: siediti e il tavolo si apre con te.')+'</div>';
  for(var j=0;j<tv.length;j++){
    var t=tv[j];if(!pk5TidOk(t.tid))continue;
    var gr=(t.tipo==='gratis'),pieno=(t.seduti|0)>=(t.posti|0||5);
    var nomi=(t.nomi||[]).slice(0,5).map(pk5Esc).join(', ');
    h+='<div class="pk5-tav"><span class="ps'+(gr?' gr':'')+'">'+(gr?(en?'FREE':'GRATIS'):pk5E(t.posta))+'</span>'
      +'<div class="ch"><b>'+(nomi||(en?'empty table':'tavolo vuoto'))+'</b><small>'+(t.seduti|0)+'/'+(t.posti|0||5)+(en?' seated':' seduti')
      +(t.spettatori?' · 👁 '+(t.spettatori|0):'')+(t.gruppo?(en?' · group':' · gruppo'):'')+(t.mano?' · '+(en?'hand ':'mano ')+(t.mano|0):'')+'</small></div>'
      +((!pieno&&PK5.modo!=='seduto'&&(gr||soldi))?'<button data-a="tavolo" data-t="'+t.tid+'">'+(en?'SIT':'SIEDITI')+'</button>':'')
      +'<button class="g" data-a="guarda" data-t="'+t.tid+'">'+(en?'WATCH':'GUARDA')+'</button></div>';
  }
  h+='<div class="pk5-sez">'+(en?'🆓 FREE · play chips':'🆓 GRATIS · fiche finte')+'</div>'
    +'<button class="pk5-bt alt" data-a="gratis"'+(PK5.modo==='seduto'?' disabled':'')+'>'+(en?'SIT AT A FREE TABLE':'SIEDITI A UN TAVOLO GRATIS')+'</button>';
  h+='<div class="pk5-sez">'+(en?'🤖 PRACTICE AGAINST THE BOTS':'🤖 ALLENATI CONTRO I BOT')+'</div><div class="pk5-bot">'
    +'<div style="font-size:12px;color:#aab6c4;">'+(en?'How many bots':'Quanti bot')+'</div><div class="pk5-sc2">';
  for(var b=1;b<=4;b++)h+='<button data-a="nbot" data-n="'+b+'" class="'+(PK5.bot===b?'on':'')+'">'+b+'</button>';
  h+='</div><div style="font-size:12px;color:#aab6c4;margin-top:8px;">'+(en?'Level':'Livello')+'</div><div class="pk5-sc2">';
  var LV=[['facile',en?'EASY':'FACILE'],['medio',en?'MEDIUM':'MEDIO'],['forte',en?'STRONG':'FORTE']];
  for(var l=0;l<LV.length;l++)h+='<button data-a="liv" data-l="'+LV[l][0]+'" class="'+(PK5.livello===LV[l][0]?'on':'')+'">'+LV[l][1]+'</button>';
  h+='</div><button class="pk5-bt" data-a="allena"'+(PK5.modo==='seduto'?' disabled':'')+'>'+(en?'🤖 PRACTICE':'🤖 ALLENATI')+'</button></div>';
  h+='<div class="pk5-nota">'+(en
    ?'Stake = the ante everyone puts in each hand. Pot limit. House rake: 5% of the pot, max 3 stakes, only if the hand reaches the draw; nothing on the teresina, nothing at free tables.'
    :'Posta = quello che tutti mettono a ogni mano. Pot limit. La casa prende il 5% del piatto, al massimo 3 poste, solo se la mano arriva al cambio; niente sulla teresina, niente ai tavoli gratis.')+'</div>';
  document.getElementById('pk5-sc').innerHTML=h;
}
function pk5ClickLista(ev){
  var b=ev.target.closest?ev.target.closest('[data-a]'):null;if(!b||b.disabled)return;
  var a=b.getAttribute('data-a');
  if(a==='posta'){var p=+b.getAttribute('data-p');pk5Compra({tipo:'soldi',posta:p});return;}
  if(a==='gratis'){pk5Compra({tipo:'gratis',posta:10});return;}
  if(a==='tavolo'){pk5CompraTid(b.getAttribute('data-t'));return;}
  if(a==='guarda'){var t=b.getAttribute('data-t');if(pk5TidOk(t)){PK5.guardaTid=t;pk5Manda({t:'pk5_guarda',tid:t});}return;}
  if(a==='nbot'){PK5.bot=+b.getAttribute('data-n');pk5Disegna();return;}
  if(a==='liv'){PK5.livello=b.getAttribute('data-l');pk5Disegna();return;}
  if(a==='allena'){pk5Allena();return;}
  if(a==='torna'){pk5Mostra();return;}
}
function pk5Allena(){
  if(PK5.attesaSiedi)return;
  if(pk5Manda({t:'pk5_siedi',tipo:'pratica',bot:PK5.bot|0||3,livello:PK5.livello||'medio'}))pk5AttesaSiedi();
}
function pk5AttesaSiedi(){
  PK5.attesaSiedi=Date.now();
  setTimeout(function(){ if(PK5.attesaSiedi&&Date.now()-PK5.attesaSiedi>=11900&&!PK5.verifica){PK5.attesaSiedi=0;pk5Toast(pk5En()?'The server did not answer: try again':'Il server non ha risposto: riprova','err');pk5BuyErr('');} },12000);
}
function pk5Tavolo(tid){
  var tv=(PK5.el&&PK5.el.tavoli)||[];
  for(var i=0;i<tv.length;i++)if(tv[i].tid===tid)return tv[i];
  var m=/^g[A-Za-z0-9]+-(\d+|gratis)$/.exec(tid);
  if(m){var gr=(m[1]==='gratis'),p=gr?10:(m[1]|0);if(gr||PK5_POSTE.indexOf(p)>=0)return {tid:tid,tipo:gr?'gratis':'soldi',posta:p,buyin_min:20*p,buyin_max:100*p,nuovo:true};}
  return null;
}
function pk5CompraTid(tid,posto){
  if(!pk5TidOk(tid))return;
  var t=pk5Tavolo(tid);
  if(!t){pk5Toast(pk5En()?'This table is not there any more':'Questo tavolo non c’è più','err');return;}
  pk5Compra({tid:tid,tipo:t.tipo,posta:t.posta,buyin_min:t.buyin_min,buyin_max:t.buyin_max,posto:posto});
}
function pk5Compra(o){
  var en=pk5En(),p=o.posta|0||10,gr=(o.tipo==='gratis');
  if(o.tipo==='soldi'&&PK5.el&&PK5.el.soldi===false){pk5Toast(en?'Cash tables are not open yet: play free or practice':'I tavoli a soldi non sono ancora aperti: gioca gratis o allenati','err',3200);return;}
  var mn=o.buyin_min||20*p,mx=o.buyin_max||100*p,sal=pk5Saldo();
  var cap=gr?mx:Math.min(mx,Math.floor(sal/p)*p);
  var val=gr?Math.round(mx/2/p)*p:Math.max(mn,Math.min(cap,Math.round(50*p)));
  var poco=!gr&&sal<mn;
  pk5ModChiudi();
  var m=document.createElement('div');m.className='pk5-mod';m.id='pk5-buy';
  m.innerHTML='<div class="bx"><h3>'+(gr?(en?'🆓 FREE TABLE':'🆓 TAVOLO GRATIS'):(en?'💶 SIT DOWN · stake ':'💶 SIEDITI · posta ')+pk5E(p))+'</h3>'
    +'<p>'+(gr?(en?'Play chips: you lose nothing and win nothing.':'Fiche finte: non perdi niente e non vinci niente.')
      :(en?'How many chips do you bring to the table? From 20 to 100 stakes. They come back to your balance when you stand up.':'Quante fiche porti al tavolo? Da 20 a 100 poste. Tornano sul saldo quando ti alzi.'))+'</p>'
    +'<div class="cifra"><span id="pk5-bv">'+pk5E(val)+'</span><small id="pk5-bp">'+Math.round(val/p)+(en?' stakes':' poste')+'</small></div>'
    +'<input id="pk5-br" type="range" min="'+mn+'" max="'+(gr?mx:Math.max(mn,cap))+'" step="'+p+'" value="'+val+'"'+(poco?' disabled':'')+'>'
    +'<div class="pre"><button data-v="'+mn+'">'+(en?'MIN':'MIN')+'</button><button data-v="'+(50*p)+'">50</button><button data-v="'+(gr?mx:Math.max(mn,cap))+'">MAX</button></div>'
    +(gr?'':'<div class="riga"><span>'+(en?'Your balance':'Il tuo saldo')+'</span><b>'+pk5E(sal)+'</b></div>'
      +'<div class="riga"><span>'+(en?'After sitting down':'Dopo che ti siedi')+'</span><b id="pk5-bd">'+pk5E(sal-val)+'</b></div>')
    +'<div class="err" id="pk5-be">'+(poco?(en?'Not enough balance: you need at least ':'Saldo insufficiente: servono almeno ')+pk5E(mn):'')+'</div>'
    +(poco?'<button class="action-btn gold ok" id="pk5-bdep">'+(en?'💳 DEPOSIT':'💳 DEPOSITA')+'</button>'
      :'<button class="action-btn gold ok" id="pk5-bok">'+(en?'SIT DOWN':'MI SIEDO')+' · '+pk5E(val)+'</button>')
    +'<button class="action-btn no" id="pk5-bno">'+(en?'CANCEL':'ANNULLA')+'</button></div>';
  document.body.appendChild(m);
  var r=document.getElementById('pk5-br');
  function metti(v){
    v=Math.max(mn,Math.min(+r.max,Math.round(v/p)*p));r.value=v;
    document.getElementById('pk5-bv').textContent=pk5E(v);
    document.getElementById('pk5-bp').textContent=Math.round(v/p)+(en?' stakes':' poste');
    var bd=document.getElementById('pk5-bd');if(bd)bd.textContent=pk5E(sal-v);
    var ok=document.getElementById('pk5-bok');if(ok)ok.textContent=(en?'SIT DOWN':'MI SIEDO')+' · '+pk5E(v);
  }
  r.addEventListener('input',function(){metti(+r.value);});
  [].forEach.call(m.querySelectorAll('.pre button'),function(b){b.onclick=function(){if(!r.disabled)metti(+b.getAttribute('data-v'));};});
  m.addEventListener('click',function(e){if(e.target===m&&!PK5.attesaSiedi)pk5ModChiudi();});
  document.getElementById('pk5-bno').onclick=function(){if(PK5.verifica)return;pk5ModChiudi();};
  var dep=document.getElementById('pk5-bdep');
  if(dep)dep.onclick=function(){pk5ModChiudi();pk5Chiudi();try{go('deposit');}catch(e){}};
  var okb=document.getElementById('pk5-bok');
  if(okb)okb.onclick=function(){
    if(PK5.attesaSiedi||PK5.verifica)return;
    var v=+r.value;
    var msg=o.tid?{t:'pk5_siedi',tid:o.tid,buyin:v}:{t:'pk5_siedi',tipo:gr?'gratis':'soldi',posta:p,buyin:v};
    if(o.tid&&pk5Int(o.posto,0,4))msg.posto=o.posto;
    if(!pk5Manda(msg))return;
    pk5AttesaSiedi();
    okb.disabled=true;okb.textContent=en?'Sitting down…':'Mi siedo…';
    document.getElementById('pk5-be').textContent='';
  };
}
function pk5BuyErr(t){
  var e=document.getElementById('pk5-be');if(e)e.textContent=t||'';
  var ok=document.getElementById('pk5-bok');if(ok){ok.disabled=false;var r=document.getElementById('pk5-br');ok.textContent=(pk5En()?'SIT DOWN':'MI SIEDO')+(r?' · '+pk5E(+r.value):'');}
}
function pk5ModChiudi(){
  var ids=['pk5-buy','pk5-ver','pk5-ric','pk5-fine'];
  for(var i=0;i<ids.length;i++){var e=document.getElementById(ids[i]);if(e&&e.parentNode)e.parentNode.removeChild(e);}
}
function pk5Verifica(on){
  var en=pk5En(),v=document.getElementById('pk5-ver');
  PK5.verifica=!!on;
  if(!on){if(v&&v.parentNode)v.parentNode.removeChild(v);return;}
  if(v)return;
  v=document.createElement('div');v.className='pk5-mod';v.id='pk5-ver';
  v.innerHTML='<div class="bx"><h3>'+(en?'⏳ PAYMENT BEING CHECKED':'⏳ PAGAMENTO IN VERIFICA')+'</h3><div class="gira"></div>'
    +'<p>'+(en?'The payment for your buy-in has not been confirmed yet. We keep trying by ourselves with the same request: <b>do not press again</b>, you will not pay twice.'
      :'Il pagamento del buy-in non è ancora confermato. Riproviamo noi con la stessa richiesta: <b>non ripremere</b>, non paghi due volte.')+'</p></div>';
  document.body.appendChild(v);
}
function pk5Ricarica(){
  var en=pk5En(),U=PK5.ultimo,io=U&&U.io;
  if(!io||!(io.ricarica_max>0)){pk5Toast(en?'You are at the table maximum':'Sei al massimo del tavolo','err');return;}
  var p=U.posta|0||10,gr=(U.tipo!=='soldi'),sal=pk5Saldo();
  var mx=gr?io.ricarica_max:Math.min(io.ricarica_max,Math.floor(sal/p)*p);
  if(mx<p){pk5Toast(en?'Not enough balance to rebuy':'Saldo insufficiente per ricaricare','err');return;}
  pk5ModChiudi();
  var m=document.createElement('div');m.className='pk5-mod';m.id='pk5-ric';
  m.innerHTML='<div class="bx"><h3>'+(en?'➕ REBUY':'➕ RICARICA')+'</h3>'
    +'<p>'+(en?'The chips come in at the start of the next hand. You can reach the table maximum: ':'Le fiche entrano all’inizio della prossima mano. Puoi arrivare al massimo del tavolo: ')+'<b>'+pk5E(U.buyin_max)+'</b>.</p>'
    +'<div class="cifra"><span id="pk5-rv">'+pk5E(mx)+'</span><small>'+(en?'now at the table ':'adesso al tavolo ')+pk5E(io.stack)+'</small></div>'
    +'<input id="pk5-rr" type="range" min="'+p+'" max="'+mx+'" step="'+p+'" value="'+mx+'">'
    +(gr?'':'<div class="riga"><span>'+(en?'Your balance':'Il tuo saldo')+'</span><b>'+pk5E(sal)+'</b></div>')
    +'<button class="action-btn gold ok" id="pk5-rok">'+(en?'REBUY':'RICARICO')+' · '+pk5E(mx)+'</button>'
    +'<button class="action-btn no" id="pk5-rno">'+(en?'CANCEL':'ANNULLA')+'</button></div>';
  document.body.appendChild(m);
  var r=document.getElementById('pk5-rr');
  r.addEventListener('input',function(){var v=+r.value;document.getElementById('pk5-rv').textContent=pk5E(v);document.getElementById('pk5-rok').textContent=(en?'REBUY':'RICARICO')+' · '+pk5E(v);});
  m.addEventListener('click',function(e){if(e.target===m)pk5ModChiudi();});
  document.getElementById('pk5-rno').onclick=pk5ModChiudi;
  document.getElementById('pk5-rok').onclick=function(){var v=+r.value;if(pk5Int(v,1,1e7)&&pk5Manda({t:'pk5_ricarica',cent:v}))pk5ModChiudi();};
}
function pk5Esci(){
  var en=pk5En(),U=PK5.ultimo,io=U&&U.io;
  if(PK5.modo!=='seduto'||!io)return;
  var tipo=U.tipo==='soldi'?'soldi':(U.tipo==='pratica'?'allenamento':'gratis');
  var stack=(io.stack|0)+(io.ricarica_attesa|0);
  var inMano=false;
  try{var s=U.s||{};if(s.fase&&s.fase!=='attesa'){for(var i=0;i<(s.giocatori||[]).length;i++){var g=s.giocatori[i];if(g.posto===io.posto&&g.dentro)inMano=true;}}}catch(e){}
  var mano=inMano?(en?' You are in a hand: you fold it, and the chips already in the pot stay there.':' Sei in una mano: la passi, e le fiche già nel piatto restano lì.'):'';
  var o={tipo:tipo,posta_eur:stack/100,uno_contro_uno:false};
  if(tipo==='soldi'){
    o.tit=en?'🏳️ STAND UP FROM THE TABLE?':'🏳️ TI ALZI DAL TAVOLO?';
    o.txt=(en?'Your chips (<b>'+pk5E(stack)+'</b>) go back to your balance.':'Le tue fiche (<b>'+pk5E(stack)+'</b>) tornano sul saldo.')+mano;
    o.si=en?('STAND UP · '+pk5E(stack)+' TO BALANCE'):('MI ALZO · '+pk5E(stack)+' SUL SALDO');o.col='#f59e0b';
  }else if(tipo==='gratis'){
    o.tit=en?'🆓 LEAVE THE FREE TABLE?':'🆓 ESCI DAL TAVOLO GRATIS?';
    o.txt=(en?'Play chips: you lose nothing.':'Fiche finte: non perdi niente.')+mano;
    o.si=en?'STAND UP':'MI ALZO';o.col='#38bdf8';
  }
  PK5.esci=true;
  gbEsciConferma(o,function(){
    PK5.esci=false;
    if(PK5.modo!=='seduto'){pk5Toast(en?'You are not at the table any more':'Non sei più al tavolo','err');return;}
    pk5Manda({t:'pk5_alzati'});
  });
}
function pk5Monta(){
  var url=pk5Url();
  if(!PK5.wrap){
    var w=document.createElement('div');w.id='pk5-wrap';
    w.style.cssText='position:fixed;inset:0;z-index:9100;display:none;background:#05070d;touch-action:none;overscroll-behavior:none;';
    w.innerHTML="<iframe id='pk5-fr' title='POKER 5' allow='autoplay' style='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;'></iframe>";
    document.body.appendChild(w);PK5.wrap=w;PK5.fr=w.querySelector('#pk5-fr');
    PK5.fr.addEventListener('load',function(){if(PK5.fr.getAttribute('src')===pk5Url())PK5.loads++;});
    pk5Telegram();
  }
  if(PK5.fr.getAttribute('src')!==url){PK5.pronto=false;PK5.coda=[];PK5.fr.setAttribute('src',url);}
}
function pk5Telegram(){
  if(PK5.tgEv)return;PK5.tgEv=true;
  try{var tg2=window.Telegram&&Telegram.WebApp;
    if(tg2&&typeof tg2.onEvent==='function'){
      tg2.onEvent('viewportChanged',function(){pk5Altezza();pk5Bordi();});
      tg2.onEvent('safeAreaChanged',pk5Bordi);tg2.onEvent('contentSafeAreaChanged',pk5Bordi);tg2.onEvent('fullscreenChanged',pk5Bordi);
    }}catch(e){}
  try{window.addEventListener('orientationchange',function(){setTimeout(pk5Bordi,250);});}catch(e2){}
}
function pk5Altezza(){
  try{if(!PK5.wrap)return;var tg2=window.Telegram&&Telegram.WebApp;
    var h=tg2?Number(tg2.viewportStableHeight||tg2.viewportHeight||0):0;
    if(h>0){PK5.wrap.style.height=Math.round(h)+'px';PK5.wrap.style.bottom='auto';}
    else{PK5.wrap.style.height='100%';PK5.wrap.style.bottom='0px';}}catch(e){}
}
function pk5Bordi(){
  try{if(!PK5.fr||!PK5.pronto)return;
    var tg2=window.Telegram&&Telegram.WebApp,sa=(tg2&&tg2.safeAreaInset)||{},ca=(tg2&&tg2.contentSafeAreaInset)||{};
    function q(lato,a,b){var t=(Number(a)||0)+(Number(b)||0),e=(typeof luprtEnv==='function')?luprtEnv(lato):0;var v=Math.max(t,e);if(!isFinite(v)||v<0)v=0;if(v>200)v=200;return Math.round(v);}
    pk5Posta({t:'bordi',top:q('top',sa.top,ca.top),bottom:q('bottom',sa.bottom,ca.bottom),left:q('left',sa.left,ca.left),right:q('right',sa.right,ca.right)});
  }catch(e){}
}
function pk5Posta(m){try{PK5.fr.contentWindow.postMessage({pk5:'giu',m:m},PK5_ORIGIN);}catch(e){}}
function pk5Giu(m){
  if(!PK5.fr)return;
  if(PK5.pronto){pk5Posta(m);return;}
  var c=PK5.coda;
  c.push(m);
  if(c.length>600){c.splice(0,c.length-600);PK5.codaPiena=true;}
}
function pk5Mostra(){
  pk5Monta();
  PK5.aperto=true;PK5.wrap.style.display='block';
  if(PK5.ov)PK5.ov.classList.remove('on');
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2){if(typeof tg2.expand==='function')tg2.expand();if(typeof tg2.disableVerticalSwipes==='function')tg2.disableVerticalSwipes();}}catch(e){}
  pk5Altezza();
  pk5Giu({t:'riprendi'});
}
function pk5Nascondi(spegni){
  if(!PK5.wrap)return;
  PK5.aperto=false;PK5.wrap.style.display='none';
  try{var tg2=window.Telegram&&Telegram.WebApp;if(tg2&&typeof tg2.enableVerticalSwipes==='function')tg2.enableVerticalSwipes();}catch(e){}
  if(spegni){pk5Giu({t:'azzera'});pk5Posta({t:'pausa'});}
  if(PK5.lista&&PK5.ov){PK5.ov.classList.add('on');pk5Disegna();if(RTD.wsOk)rtdSend({t:'pk5_elenco'});}
}
window.addEventListener('message',function(ev){
  if(ev.origin!==PK5_ORIGIN)return;
  var d=ev.data;if(!d||typeof d!=='object'||d.pk5===undefined)return;
  if(!PK5.fr||ev.source!==PK5.fr.contentWindow)return;
  if(d.pk5==='pronto'){
    PK5.pronto=true;pk5Bordi();
    if(!PK5.aperto)pk5Posta({t:'pausa'});
    var c=PK5.coda;PK5.coda=[];for(var i=0;i<c.length;i++)pk5Posta(c[i]);
    if(PK5.codaPiena||!c.length){PK5.codaPiena=false;if(PK5.modo==='seduto'&&RTD.wsOk){pk5Posta({t:'pieno'});rtdSend({t:'pk5_rientra'});}}
    if(PK5.modo==='guarda'&&!c.length&&RTD.wsOk&&PK5.tid){pk5Posta({t:'pieno'});rtdSend({t:'pk5_guarda',tid:PK5.tid});}
    if(d.d3===false){try{rtdSend({t:'clog',at:'poker5',msg:'tavolo 2D (niente WebGL)'});}catch(_c){}}
    return;
  }
  if(d.pk5!=='su')return;
  var o=d.m;if(!o||typeof o!=='object')return;
  switch(o.t){
    case 'mossa':{
      if(PK5.modo!=='seduto')return;
      var m=o.m;if(!m||typeof m!=='object'||!Object.prototype.hasOwnProperty.call(PK5_MOSSE,m.t))return;
      if(!pk5Int(o.mano,0,1e9))return;
      var x={t:m.t};
      if(m.t==='rilancio'){if(!pk5Int(m.quanto,1,1e8))return;x.quanto=m.quanto;}
      if(m.t==='cambio'){if(Object.prototype.toString.call(m.carte)!=='[object Array]'||m.carte.length>4)return;
        for(var k=0;k<m.carte.length;k++)if(!pk5Int(m.carte[k],0,5))return;x.carte=m.carte.slice();}
      if(m.t==='scegli_variante'){if(typeof m.chiave!=='string'||!/^[a-z0-9]{2,20}$/.test(m.chiave))return;x.chiave=m.chiave;}
      if(m.t==='scopri'||m.t==='scarta'){if(!pk5Int(m.carta,0,5))return;x.carta=m.carta;}
      if(m.t==='scambia'){if(!pk5Int(m.mia,0,5)||!pk5Int(m.fila,0,9))return;x.mia=m.mia;x.fila=m.fila;}
      pk5Manda({t:'pk5_mossa',m:x,mano:o.mano});
      return;
    }
    case 'esci':pk5Esci();return;
    case 'ricarica':if(PK5.modo==='seduto')pk5Ricarica();return;
    case 'pausa':if(PK5.modo==='seduto')pk5Manda({t:'pk5_pausa',on:!!o.on});return;
    case 'siedi':{
      if(PK5.modo!=='guarda')return;
      var tid=String(o.tid||PK5.tid);
      var U=PK5.ultimo;
      if(U&&U.tid===tid&&U.tipo!=='pratica')pk5Compra({tid:tid,tipo:U.tipo,posta:U.posta,buyin_min:U.buyin_min,buyin_max:U.buyin_max,posto:pk5Int(o.posto,0,4)?o.posto:undefined});
      return;
    }
    case 'chiudi':
      if(PK5.modo==='guarda'){rtdSend({t:'pk5_smetti'});PK5.modo='';PK5.tid='';PK5.guardaTid='';PK5.lista=true;pk5Nascondi(true);}
      return;
    case 'clog':try{rtdSend({t:'clog',at:'poker5',msg:String(o.msg||'').slice(0,300)});}catch(e){}return;
    default:return;
  }
});
function pk5Ricevi(m){
  var t=m&&m.t;
  if(t==='hello_ok'){ if(pk5Vivo())setTimeout(pk5DopoHello,0); return false; }
  if(typeof t!=='string'||t.indexOf('pk5_')!==0)return false;
  var en=pk5En();
  if(t==='pk5_elenco'){
    PK5.el=m;
    if(!PK5.modo&&!PK5.fineSegno){PK5.fineSegno=setTimeout(function(){PK5.fineSegno=0;if(!PK5.modo)pk5Segna('');},4000);}
    if(PK5.lista&&!PK5.aperto)pk5Disegna();
    var d=PK5.dopo;
    if(d&&d.modo==='siedi'){PK5.dopo=null;
      if(!pk5TidOk(d.tid)){pk5Toast(en?'Invalid table link':'Link del tavolo non valido','err');}
      else pk5CompraTid(d.tid);
    }
    return true;
  }
  if(t==='pk5_seduto'){
    if(!pk5TidOk(String(m.tid||'')))return true;
    PK5.attesaSiedi=0;pk5Verifica(false);pk5ModChiudi();
    PK5.modo='seduto';PK5.tid=m.tid;PK5.guardaTid='';PK5.lista=true;
    if(m.tipo!=='pratica')pk5Segna(m.tid);
    var rp=document.getElementById('pk5-ripresa');if(rp&&rp.parentNode)rp.parentNode.removeChild(rp);
    pk5Monta();pk5Giu({t:'azzera'});pk5Giu({t:'seduto',entra:true});
    pk5Mostra();
    if(m.tipo==='soldi'&&typeof loadBalance==='function')try{loadBalance();}catch(e){}
    try{if(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.HapticFeedback)Telegram.WebApp.HapticFeedback.notificationOccurred('success');}catch(e){}
    return true;
  }
  if(t==='pk5_stato'){
    var tid=String(m.tid||'');if(!pk5TidOk(tid))return true;
    if(m.io&&!m.spettatore){
      if(PK5.modo!=='seduto'||PK5.tid!==tid){
        PK5.modo='seduto';PK5.tid=tid;PK5.lista=true;PK5.attesaSiedi=0;pk5Verifica(false);pk5ModChiudi();
        if(m.tipo!=='pratica')pk5Segna(tid);
        pk5Monta();pk5Giu({t:'azzera'});pk5Giu({t:'pieno'});pk5Mostra();
      }
    }else{
      if(PK5.modo!=='guarda'||PK5.tid!==tid){
        if(PK5.guardaTid!==tid)return true;
        PK5.modo='guarda';PK5.tid=tid;PK5.lista=true;
        pk5Monta();pk5Giu({t:'azzera'});pk5Giu({t:'pieno'});pk5Mostra();
      }
    }
    PK5.ultimo=m;
    pk5Giu(m);
    return true;
  }
  if(t==='pk5_alzato'){
    var era=(PK5.modo==='seduto'&&(!m.tid||m.tid===PK5.tid));
    if(!era)return true;
    var U=PK5.ultimo||{},tipo=U.tipo||'';
    PK5.modo='';PK5.tid='';PK5.ultimo=null;PK5.lista=true;pk5Segna('');
    var ov=document.getElementById('gb-esci-ov');if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);
    pk5Nascondi(true);
    pk5Esito(m,tipo);
    if(typeof loadBalance==='function')try{loadBalance().then(pk5Disegna);}catch(e){}
    if(RTD.wsOk)rtdSend({t:'pk5_elenco'});
    return true;
  }
  if(t==='pk5_err'){
    var code=String(m.code||''),testo=pk5ErrTesto(code,m.msg);
    if(code==='in_verifica'){pk5Verifica(true);return true;}
    if(code==='mossa'||code==='ricarica'||code==='non_seduto'){pk5Giu({t:'err',code:code,msg:testo});if(code==='ricarica')pk5Toast(testo,'err');return true;}
    var siedi=!!PK5.attesaSiedi||PK5.verifica;
    PK5.attesaSiedi=0;
    if(PK5.verifica){pk5Verifica(false);}
    if(code==='guarda'){PK5.guardaTid='';pk5Toast(testo,'err');return true;}
    if(siedi&&document.getElementById('pk5-buy')){pk5BuyErr(testo);if(code==='tavolo'||code==='pieno'){if(RTD.wsOk)rtdSend({t:'pk5_elenco'});}}
    else pk5Toast(testo,'err',3200);
    if(code==='saldo'&&typeof loadBalance==='function')try{loadBalance();}catch(e){}
    if(PK5.aperto)pk5Giu({t:'err',code:code,msg:testo});
    return true;
  }
  return true;
}
function pk5ErrTesto(code,msg){
  var en=pk5En();
  if(!en&&msg)return String(msg).slice(0,200);
  var E={saldo:['Saldo insufficiente','Insufficient balance'],buyin:['Buy-in fuori dai limiti del tavolo (20-100 poste)','Buy-in outside the table limits (20-100 stakes)'],
    posta:['Posta non ammessa','Stake not allowed'],pieno:['Il tavolo è pieno','The table is full'],tavolo:['Questo tavolo non c’è più','This table is not there any more'],
    altrove:['Sei già in un’altra partita: prima finisci quella','You are already in another game: finish it first'],
    gia_seduto:['Sei già seduto a un tavolo di poker','You are already seated at a poker table'],
    soldi_spenti:['I tavoli a soldi non sono ancora aperti: gioca gratis o allenati','Cash tables are not open yet: play free or practice'],
    in_verifica:['Pagamento in verifica','Payment being checked'],mossa:['Mossa non valida','Move not allowed'],
    ricarica:['Ricarica non ammessa adesso','Rebuy not allowed now'],non_seduto:['Non sei seduto al tavolo','You are not seated'],
    guarda:['Questo tavolo non si può guardare','This table cannot be watched']};
  var r=E[code];
  return r?r[en?1:0]:(msg?String(msg).slice(0,200):(en?'Error':'Errore'));
}
function pk5Esito(m,tipo){
  var en=pk5En(),cent=m.cent|0,mot=String(m.motivo||'esci');
  var MOT={esci:['Ti sei alzato dal tavolo.','You stood up from the table.'],assente:['Sei stato alzato: eri assente da troppe mani.','You were stood up: you were away for too many hands.'],
    chiuso:['Il tavolo si è chiuso: non c’erano abbastanza giocatori.','The table closed: there were not enough players.'],
    riavvio:['Il server di gioco si è riavviato: la mano in corso è stata annullata.','The game server restarted: the hand in progress was cancelled.'],
    vuoto:['Sei rimasto senza fiche e non hai ricaricato.','You ran out of chips and did not rebuy.']};
  var r=MOT[mot]||MOT.esci;
  pk5ModChiudi();
  var d=document.createElement('div');d.className='pk5-mod';d.id='pk5-fine';
  var soldi=(tipo==='soldi');
  d.innerHTML='<div class="bx"><h3>'+(en?'♠ YOU LEFT THE TABLE':'♠ TI SEI ALZATO')+'</h3><p>'+r[en?1:0]+'</p>'
    +'<div class="cifra">'+(soldi?'+ '+pk5E(cent):pk5E(cent))+'<small>'+(soldi?(m.pagato===false?(en?'being credited: it arrives by itself, do not worry':'in accredito: arriva da solo, non serve fare niente'):(en?'back on your balance':'tornati sul saldo')):(en?'play chips':'fiche finte'))+'</small></div>'
    +'<button class="action-btn gold ok" id="pk5-fok">'+(en?'OK':'OK')+'</button></div>';
  document.body.appendChild(d);
  document.getElementById('pk5-fok').onclick=pk5ModChiudi;
  d.addEventListener('click',function(e){if(e.target===d)pk5ModChiudi();});
}
function pk5Segna(tid){try{if(tid)localStorage.setItem('pk5_seduto',tid);else localStorage.removeItem('pk5_seduto');}catch(e){}}
function pk5Ripresa(){
  var tid='';try{tid=localStorage.getItem('pk5_seduto')||'';}catch(e){}
  if(!pk5TidOk(tid)||PK5.modo||PK5.lista)return;
  var en=pk5En();pk5Css();
  var el=document.getElementById('pk5-ripresa');
  if(!el){el=document.createElement('div');el.id='pk5-ripresa';document.body.appendChild(el);}
  el.setAttribute('style','position:fixed;left:10px;right:10px;top:calc(env(safe-area-inset-top,0px) + 10px);z-index:9000;padding:12px 14px;border-radius:16px;border:2px solid #84cc16;background:linear-gradient(165deg,#13250b,#0a0e1a);box-shadow:0 12px 36px rgba(0,0,0,.7);display:flex;align-items:center;gap:10px;font-family:Inter,system-ui,sans-serif;');
  el.innerHTML='<div style="flex:1;min-width:0;"><div style="font-family:Orbitron,sans-serif;font-weight:900;color:#bef264;font-size:14px;letter-spacing:1.2px;">♠ POKER</div>'
    +'<div style="color:#e8ecf5;font-size:12.5px;margin-top:3px;line-height:1.35;">'+(en?'You were seated at a table: if you are away too long you are stood up with your chips.':'Eri seduto a un tavolo: se resti via troppo vieni alzato col tuo gruzzolo.')+'</div></div>'
    +'<button id="pk5-rip-vai" style="flex:none;padding:9px 12px;border-radius:10px;border:0;background:linear-gradient(135deg,#a3e635,#65a30d);color:#11131a;font-weight:800;font-size:12px;">'+(en?'BACK TO TABLE':'TORNA AL TAVOLO')+'</button>'
    +'<button id="pk5-rip-x" aria-label="chiudi" style="flex:none;width:30px;height:30px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#cfd6e6;font-size:14px;">✕</button>';
  document.getElementById('pk5-rip-vai').onclick=function(){if(el.parentNode)el.parentNode.removeChild(el);pk5Apri();};
  document.getElementById('pk5-rip-x').onclick=function(){if(el.parentNode)el.parentNode.removeChild(el);};
}
(function(){
  function via(){ setTimeout(function(){ try{ if(window.S&&S.userId)pk5Ripresa(); }catch(e){} },1800); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',via); else via();
})();
function pk5Deep(sp){
  sp=String(sp||'').replace(/^r\d{4,15}-/,'');
  var a=/^poker[_-]([A-Za-z0-9-]{1,40})$/.exec(sp),b=/^guardapoker[_-]([A-Za-z0-9-]{1,40})$/.exec(sp);
  if(a){pk5Apri({modo:'siedi',tid:a[1]});return true;}
  if(b){pk5Apri({modo:'guarda',tid:b[1]});return true;}
  return false;
}
