var WN = { v:'home', next:null, met:'ton', dst:null, altro:false, swap:false,
           ok:null, timer:null, depTocco:false, val:null, valTocco:false };
var WN_DEP_KEY = 'wn_dep_attesa';
var WN_WB = { addr:'', ts:0, nano:null, carico:false };
var WN_USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
var WN_UB = { addr:'', ts:0, val:null, carico:false };
function wnU(){
  var st = TONUI.st;
  var u = st && st.usdt;
  return (u && typeof u === 'object' && u.enabled) ? u : null;
}
function wnUsdtDep(){ var u = wnU(); return !!(u && u.deposit_enabled); }
function wnUsdtWd(){ var u = wnU(); return !!(u && u.withdraw_enabled); }
function wnUsdt(n){ return wnTon(n); }
function wnSaldoUsdt(addr){
  if(!addr) return;
  var ora = Date.now();
  if(WN_UB.addr === addr && (WN_UB.carico || ora - WN_UB.ts < 30000)) return;
  WN_UB.addr = addr; WN_UB.ts = ora; WN_UB.carico = true;
  fetch('https://tonapi.io/v2/accounts/' + encodeURIComponent(addr) + '/jettons/' + WN_USDT_MASTER)
    .then(function(r){
      if(r.status === 404) return { balance:'0', jetton:{ decimals:6 } };
      if(!r.ok) throw new Error('tonapi ' + r.status);
      return r.json();
    })
    .then(function(j){
      if(!j || j.balance == null) throw new Error('vuoto');
      var dec = (j.jetton && j.jetton.decimals != null) ? +j.jetton.decimals : 6;
      var v = (+j.balance) / Math.pow(10, dec);
      WN_UB.val = isFinite(v) ? v : null;
    })
    ['catch'](function(){ WN_UB.val = null; })
    .then(function(){ WN_UB.carico = false; WN_UB.ts = Date.now(); if(window.CUR === 'wallet') wnRender(); });
}
function wnWalletUsdt(){
  var st = TONUI.st || {};
  if(!st.address || WN_UB.addr !== st.address || WN_UB.val == null) return null;
  return WN_UB.val;
}
function wnValCorr(){
  if(!wnUsdtDep()) return 'TON';
  if(WN.val === 'USDT' || WN.val === 'TON') return WN.val;
  var wu = wnWalletUsdt();
  return (wu != null && wu > 0) ? 'USDT' : 'TON';
}
function wnValuta(v){
  if(WN.val !== v){
    WN.val = v; WN.valTocco = true; WN.depTocco = false;
    var i = wnEl('tonui-depamt'); if(i) i.value = '';
    var e = wnEl('tonui-err'); if(e) e.style.display = 'none';
  }
  wnRender();
}
function wnUsdtFee(){
  var u = wnU() || {}, st = TONUI.st || {};
  if(u.deposit_fee_pct != null) return +u.deposit_fee_pct;
  return (st.deposit_fee_pct != null) ? +st.deposit_fee_pct : 5;
}
function wnDepUn(d){ return (d && d.val === 'USDT') ? 'USDT' : 'TON'; }
function wnUsdtEur(n){
  var u = wnU(); var p = u && u.prezzo_eur;
  return (p != null && isFinite(+p) && +p > 0) ? n * (+p) : null;
}
function wnEn(){ return window.GB_LANG === 'en'; }
function wnEsc(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function wnNum(n, dec){
  n = +n; if(!isFinite(n)) n = 0;
  var s = n.toFixed(dec==null?2:dec);
  return wnEn() ? s : s.replace('.', ',');
}
function wnEur(n){ return wnEn() ? ('€' + wnNum(n,2)) : ('€ ' + wnNum(n,2)); }
function wnTon(n){
  n = +n; if(!isFinite(n)) n = 0;
  var s = (Math.round(n*100)/100).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
  return wnEn() ? s : s.replace('.', ',');
}
function wnLeggi(v){
  var f = parseFloat(String(v==null?'':v).replace(/\s/g,'').replace(',', '.'));
  return isFinite(f) ? f : NaN;
}
function wnCorto(a){ a = String(a||''); return a.length > 14 ? a.slice(0,6)+'…'+a.slice(-5) : a; }
function wnEl(id){ return document.getElementById(id); }
function wnMostra(id, si, modo){ var e = wnEl(id); if(e) e.style.display = si ? (modo||'') : 'none'; }
function wnTesto(id, t){ var e = wnEl(id); if(e) e.textContent = t; }
var WN_IC = {
  ton: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4db2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16l-8 14L4 6z"/><path d="M12 6v14"/></svg>',
  tonB: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16l-8 14L4 6z"/><path d="M12 6v14"/></svg>',
  ok: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3ddc97" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  att: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4db2ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  spunta: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#04140d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'
};
function wnErrIt(m){
  m = String(m==null?'':m);
  var t = m.replace(/^\s+|\s+$/g,''), r;
  if(!t) return t;
  if((r = /^minimum deposit is ([\d.]+) TON$/i.exec(t))) return 'Il minimo è ' + wnTon(r[1]) + ' TON';
  if((r = /^minimum withdrawal is ([\d.]+) EUR$/i.exec(t))) return 'Il prelievo minimo è ' + wnEur(+r[1]);
  if((r = /^minimum deposit is ([\d.]+) USDT$/i.exec(t))) return 'Il minimo è ' + wnUsdt(r[1]) + ' USDT';
  if(/only withdraw in the currency you deposited/i.test(t)) return 'Si preleva nella moneta con cui hai caricato.';
  var T = {
    'insufficient balance':'Non ci sono abbastanza euro disponibili per questo importo.',
    'invalid amount':'Importo non valido.',
    'amount too small':'Importo troppo piccolo.',
    'amount too large':'Importo troppo grande.',
    'connect your TON wallet first':'Collega prima il tuo wallet.',
    'TON deposits are not open yet':'I depositi in TON non sono ancora aperti.',
    'deposits unavailable':'I depositi in TON non sono disponibili adesso.',
    'could not prepare the transfer':'Non siamo riusciti a preparare il deposito. Riprova tra poco.',
    'TON withdrawals are temporarily unavailable':'I prelievi in TON non sono disponibili adesso.',
    'could not get a challenge from the server':'Il server non ha risposto. Riprova tra poco.',
    'could not open the wallet list':'Non si è aperto il wallet. Riprova.',
    'verification failed':'Il wallet non ha superato la verifica. Riprova.',
    'could not verify':'Il wallet non ha superato la verifica. Riprova.',
    'connection failed':'Collegamento non riuscito. Riprova.',
    'could not send':'Invio non riuscito. Riprova.',
    'Wallet connection is unavailable right now.':'Il collegamento del wallet non è disponibile adesso.',
    'Enter how much you want to deposit.':'Scrivi quanti TON vuoi caricare.',
    'non autenticato':'Apri il wallet dal bot in Telegram.',
    'USDT deposits are not open yet':'I depositi in USDT non sono ancora aperti.',
    'USDT withdrawals are temporarily unavailable':'I prelievi in USDT non sono disponibili adesso.',
    'not enough USDT in your wallet':'Nel wallet non ci sono abbastanza USDT.',
    'could not find your USDT wallet':'Nel wallet collegato non troviamo USDT.'
  };
  if(T.hasOwnProperty(t)) return T[t];
  if(/^the TON price is not fresh/i.test(t)) return 'Il prezzo del TON non è aggiornato in questo momento: riprova tra un minuto.';
  if(/^Your wallet did not prove/i.test(t)) return 'Il wallet non ha dimostrato che l’indirizzo è tuo. Riprova.';
  return t;
}
function wnNumeri(){
  var tot = 0, cap = 0;
  try{ tot = possEurN(); }catch(e){}
  try{ cap = capEur(); }catch(e){}
  tot = +tot || 0; cap = +cap || 0;
  var tav = tot - cap; if(!(tav > 0.009)) tav = 0;
  return { tot:tot, disp:Math.max(0, tot - tav), tav:tav };
}
function wnSaldo(){
  var n = wnNumeri();
  wnTesto('wn-bal', wnEur(n.tot));
  wnTesto('wn-avail', wnEur(n.disp));
  wnTesto('wn-inplay', wnEur(n.tav));
  wnTesto('wn-puoi', wnEur(n.disp));
  wnTesto('wn-puoi-tav', wnEur(n.tav));
  wnMostra('wn-puoi-nota', n.tav > 0);
}
(function(){
  try{
    var r = window.refresh;
    if(typeof r !== 'function' || r.__wn) return;
    var f = function(){
      var x = r.apply(this, arguments);
      try{ if(window.CUR === 'wallet') wnSaldo(); }catch(e){}
      return x;
    };
    f.__wn = 1; window.refresh = f;
  }catch(e){}
})();
function wnEntra(){
  WN.v = WN.next || 'home';
  WN.next = null;
  if(!TONUI.st || (Date.now() - (WN.tonTs||0) > 20000)){
    WN.tonTs = Date.now();
    try{ tonUiLoad(); }catch(e){}
  }
  try{ var sc = wnEl('wn-scroll'); if(sc) sc.scrollTop = 0; }catch(e){}
}
function wnApri(v, met){
  if(met) WN.met = met;
  if(v === 'preleva' && met === 'ton') WN.dst = 'TON';
  if(v === 'carica') WN.depTocco = false;
  WN.next = v || 'home';
  go('wallet');
}
function wnVai(v){
  WN.v = v;
  if(v === 'home') WN.ok = null;
  wnRender();
  try{ var sc = wnEl('wn-scroll'); if(sc) sc.scrollTop = 0; }catch(e){}
}
function wnIndietro(){ wnVai('home'); }
function wnMetodo(m){ WN.met = m; wnRender(); }
function wnAltro(){ WN.altro = !WN.altro; wnRender(); }
function wnSwap(){
  WN.swap = !WN.swap;
  try{ swapToggle(); }catch(e){}
  wnTesto('wn-swap-lab', WN.swap ? 'Chiudi la conversione' : 'Hai un’altra crypto? Convertila in Bitcoin');
}
var WN_TITOLI = { home:'Wallet', carica:'Carica il conto', preleva:'Preleva', ok:'Wallet' };
function wnRender(){
  var v = WN.v;
  if(v === 'ok' && !WN.ok) v = WN.v = 'home';
  ['home','carica','preleva','ok'].forEach(function(k){
    var e = wnEl('wn-v-' + k);
    if(e) e.className = 'wn-v' + (k === v ? ' on' : '');
  });
  wnTesto('wn-titolo', WN_TITOLI[v] || 'Wallet');
  wnMostra('wn-back', v === 'carica' || v === 'preleva', 'flex');
  var st = TONUI.st || null;
  wnMostra('wn-auto', v === 'home' && !!(st && st.auto_illimitato), 'flex');
  if(v !== 'carica'){ var a = wnEl('wn-ton-testa'); if(a){ a.innerHTML = ''; a.removeAttribute('data-h'); } }
  if(v !== 'preleva'){ var b = wnEl('wn-wd-stato'); if(b){ b.innerHTML = ''; b.removeAttribute('data-h'); } }
  wnSaldo();
  if(v === 'home') wnHome();
  else if(v === 'carica') wnCarica();
  else if(v === 'preleva') wnPrelevaV();
  else if(v === 'ok') wnOk();
  wnBattito();
}
function wnSaldoWallet(addr){
  if(!addr) return;
  var ora = Date.now();
  if(WN_WB.addr === addr && (WN_WB.carico || ora - WN_WB.ts < 30000)) return;
  WN_WB.addr = addr; WN_WB.ts = ora; WN_WB.carico = true;
  var a = encodeURIComponent(addr);
  fetch('https://tonapi.io/v2/accounts/' + a)
    .then(function(r){ if(!r.ok) throw new Error('tonapi ' + r.status); return r.json(); })
    .then(function(j){ if(!j || j.balance == null) throw new Error('vuoto'); return +j.balance; })
    ['catch'](function(){
      return fetch('https://toncenter.com/api/v2/getAddressBalance?address=' + a)
        .then(function(r){ return r.json(); })
        .then(function(j){ return (j && j.ok) ? +j.result : null; });
    })
    .then(function(nano){ WN_WB.nano = (nano != null && isFinite(nano)) ? nano : null; })
    ['catch'](function(){ WN_WB.nano = null; })
    .then(function(){ WN_WB.carico = false; WN_WB.ts = Date.now(); if(window.CUR === 'wallet') wnRender(); });
}
function wnWalletTon(){
  var st = TONUI.st || {};
  if(!st.address || WN_WB.addr !== st.address || WN_WB.nano == null) return null;
  return WN_WB.nano / 1e9;
}
function wnNomeWallet(){
  var n = '';
  try{ n = localStorage.getItem('wn_wallet_app') || ''; }catch(e){}
  if(/telegram/i.test(n)) return 'Wallet di Telegram';
  try{ var nm = localStorage.getItem('wn_wallet_nome') || ''; if(n && nm) return nm; }catch(e){}
  return 'Il tuo wallet TON';
}
function wnDepLeggi(){
  try{
    var d = JSON.parse(localStorage.getItem(WN_DEP_KEY) || 'null');
    if(!d || !d.ts) return null;
    if(Date.now() - d.ts > 3*3600*1000){ localStorage.removeItem(WN_DEP_KEY); return null; }
    return d;
  }catch(e){ return null; }
}
function wnDepFirmato(v, valuta, prep){
  var st = TONUI.st || {};
  var ton = wnLeggi(v);
  var usdt = (valuta === 'USDT');
  var fee = usdt ? wnUsdtFee() : ((st.deposit_fee_pct != null) ? +st.deposit_fee_pct : 5);
  var d = { ton: ton, net: ton * (1 - fee/100), ts: Date.now(),
            saldo0: (st.saldo_cent != null) ? +st.saldo_cent : null };
  if(usdt){
    d.val = 'USDT';
    if(prep && prep.netti_usdt != null && isFinite(+prep.netti_usdt)) d.net = +prep.netti_usdt;
    d.eur = (prep && prep.eur_stimati != null && isFinite(+prep.eur_stimati)) ? +prep.eur_stimati : wnUsdtEur(d.net);
  }
  try{ localStorage.setItem(WN_DEP_KEY, JSON.stringify(d)); }catch(e){}
  WN.ok = { tipo:'dep', ton: d.ton, net: d.net, ts: d.ts, accr:false, val: d.val || 'TON', eur: d.eur };
  var i = wnEl('tonui-depamt'); if(i) i.value = '';
  wnVai('ok');
}
function wnDepControlla(){
  var d = wnDepLeggi(), st = TONUI.st;
  if(!d || !st || st.saldo_cent == null || d.saldo0 == null) return;
  if(+st.saldo_cent > d.saldo0){
    try{ localStorage.removeItem(WN_DEP_KEY); }catch(e){}
    if(WN.ok && WN.ok.tipo === 'dep' && WN.ok.ts === d.ts) WN.ok.accr = true;
    try{ loadBalance(); }catch(e){}
    if(typeof toast === 'function') toast('Deposito accreditato sul conto', 'ok', 3500);
  }
}
function wnBattito(){
  var serve = 0;
  if(window.CUR === 'wallet'){
    if(WN.v === 'ok') serve = 6000;
    else if(WN.v === 'home' && (wnDepLeggi() || (TONUI.st && TONUI.st.pending) || (wnU() && wnU().pending))) serve = 15000;
  }
  if(!serve){ if(WN.timer){ clearTimeout(WN.timer); WN.timer = null; } return; }
  if(WN.timer) return;
  WN.timer = setTimeout(function(){
    WN.timer = null;
    if(window.CUR !== 'wallet') return;
    WN.tonTs = Date.now();
    try{ tonUiLoad(); }catch(e){}
  }, serve);
}
function wnTonAgg(){
  var st = TONUI.st;
  if(st && st.connected && st.address){
    wnSaldoWallet(st.address);
    if(wnU()) wnSaldoUsdt(st.address);
  }
  wnDepControlla();
  if(WN.ok && WN.ok.tipo === 'wd') wnWdSegui();
  if(window.CUR === 'wallet') wnRender();
}
function wnTempoFa(ts){
  var m = Math.floor((Date.now() - ts) / 60000);
  if(m < 1) return 'adesso';
  if(m < 60) return m + ' min fa';
  return Math.floor(m / 60) + ' h fa';
}
var WN_STATI_WD = {
  attesa_ok:'In attesa di approvazione',
  richiesto:'In coda',
  attesa_capienza:'In attesa: il wallet della casa si sta ricaricando',
  prenotato:'Sta per partire',
  in_volo:'In uscita',
  trasmesso:'Inviato, la rete lo sta confermando',
  domanda:'In verifica da un operatore',
  doppio:'In verifica da un operatore'
};
function wnFaseWd(p){
  if(!p) return 0;
  if(p.confermato) return 3;
  if(p.stato === 'prenotato' || p.stato === 'in_volo' || p.stato === 'trasmesso') return 2;
  return 1;
}
function wnBarra(n, tot){
  var h = '<div class="wn-bar' + (tot === 2 ? ' wn-bar--2' : '') + '">';
  for(var i = 1; i <= tot; i++) h += '<i' + (i <= n ? ' class="on"' : '') + '></i>';
  return h + '</div>';
}
function wnHome(){
  var st = TONUI.st;
  var c = wnEl('wn-tgcard'), h = '';
  if(st && !TONUI.down){
    if(st.connected){
      var wt = wnWalletTon();
      h = '<div class="wn-card wn-tg"><div class="wn-ic">' + WN_IC.ton + '</div>'
        + '<div class="wn-tg__tx"><div class="wn-tg__t">' + wnEsc(wnNomeWallet()) + '</div>'
        + '<div class="wn-tg__s wn-mono"><span>' + wnEsc(wnCorto(st.address)) + '</span>'
        + (wt != null ? '<span> · ' + wnTon(wt) + ' TON</span>' : '')
        + ((wnU() && wnWalletUsdt() != null) ? '<span> · ' + wnUsdt(wnWalletUsdt()) + ' USDT</span>' : '') + '</div></div>'
        + '<div class="wn-pill">Collegato</div></div>';
    } else if((st.deposit || {}).enabled || st.withdraw_enabled){
      h = '<div class="wn-card wn-tg"><div class="wn-ic">' + WN_IC.ton + '</div>'
        + '<div class="wn-tg__tx"><div class="wn-tg__t">Wallet di Telegram</div>'
        + '<div class="wn-tg__s">' + (wnU() ? 'Per caricare e prelevare in TON e USDT' : 'Per caricare e prelevare in TON') + '</div></div>'
        + '<button class="wn-pill wn-pill--btn" onclick="wnApri(\'carica\',\'ton\')">Collega</button></div>';
    }
  }
  if(c) c.innerHTML = h;
  var co = wnEl('wn-corso'), x = '';
  if(st && st.pending) x += wnCorsoWd(st.pending, 'TON');
  if(wnU() && wnU().pending) x += wnCorsoWd(wnU().pending, 'USDT');
  var d = wnDepLeggi();
  if(d){
    x += '<div class="wn-card wn-corso">'
      + '<div class="wn-row"><span class="wn-k wn-k--blu">In corso</span>'
      + '<span class="wn-nota">' + wnTempoFa(d.ts) + '</span></div>'
      + '<div class="wn-row"><span><span>Deposito</span> <span>' + wnTon(d.ton) + ' ' + wnDepUn(d) + '</span></span>'
      + '<span class="wn-b">≈ ' + wnDepNetto(d) + '</span></div>'
      + wnBarra(1, 2)
      + '<div class="wn-nota">Firmato · Accreditato sul conto</div></div>';
  }
  if(co) co.innerHTML = x;
  wnMovimenti();
}
function wnWdQuanto(p, un){
  var n = (un === 'USDT') ? (p.usdt != null ? p.usdt : p.amount) : (p.ton != null ? p.ton : p.amount);
  if(n != null && isFinite(+n) && +n > 0) return wnTon(+n) + ' ' + un;
  if(p.cent != null) return wnEur((+p.cent)/100);
  return un;
}
function wnCorsoWd(p, un){
  var f = wnFaseWd(p);
  return '<div class="wn-card wn-corso" data-val="' + un + '">'
    + '<div class="wn-row"><span class="wn-k wn-k--blu">In corso</span>'
    + '<span class="wn-nota">' + wnEsc(WN_STATI_WD[p.stato] || p.stato || '') + '</span></div>'
    + '<div class="wn-row"><span><span>Prelievo</span> <span>' + wnEsc(wnWdQuanto(p, un)) + '</span></span>'
    + '<span class="wn-mono wn-nota">' + wnEsc(wnCorto(p.dest)) + '</span></div>'
    + wnBarra(f, 3)
    + '<div class="wn-nota">Richiesto · In uscita · Arrivato nel wallet</div>'
    + (p.hash ? '<a class="wn-a" target="_blank" rel="noopener" href="https://tonviewer.com/transaction/'
        + encodeURIComponent(p.hash) + '">Controlla su tonviewer</a>' : '')
    + wnAnnHtml(p)
    + '</div>';
}
var WN_ANN = {};
function wnAnnHtml(p){
  if(!p || !p.rid) return '';
  if(p.annulla_chiesto || WN_ANN[p.rid] === 'chiesto')
    return '<div class="wn-nota">Annullamento in corso: i soldi tornano sul conto entro un minuto.</div>';
  if(!p.annullabile) return '';
  var armato = (typeof WN_ANN[p.rid] === 'number' && WN_ANN[p.rid] > Date.now());
  return '<button class="wn-btn2" onclick="wnWdAnnulla(\'' + wnEsc(p.rid) + '\')">'
    + (armato ? 'Tocca di nuovo per annullare' : 'Annulla prelievo') + '</button>';
}
function wnWdAnnulla(rid){
  var t = WN_ANN[rid];
  if(!(typeof t === 'number' && t > Date.now())){
    WN_ANN[rid] = Date.now() + 5000;
    wnHome();
    setTimeout(function(){ if(typeof WN_ANN[rid] === 'number'){ delete WN_ANN[rid]; wnHome(); } }, 5200);
    return;
  }
  WN_ANN[rid] = 'chiesto';
  wnHome();
  swapApi('/ton/withdraw/cancel', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ rid: rid })
  }).then(function(res){
    var d = res.data || {};
    if(!res.ok || !d.ok){
      delete WN_ANN[rid];
      toast(d.error_code === 'tardi' ? 'Troppo tardi: il prelievo sta già partendo.'
                                     : 'Non si è potuto annullare. Riprova.', 'error');
    } else {
      toast('Annullamento richiesto: i soldi tornano sul conto entro un minuto.');
      var n = 0, iv = setInterval(function(){
        n++; if(typeof tonUiLoad === 'function') tonUiLoad();
        if(n >= 8) clearInterval(iv);
      }, 15000);
    }
    if(typeof tonUiLoad === 'function') tonUiLoad();
    wnHome();
  })['catch'](function(){ delete WN_ANN[rid]; wnHome(); toast('Rete non disponibile. Riprova.', 'error'); });
}
function wnDepNetto(d){
  if(d && d.val === 'USDT') return (d.eur != null) ? wnEur(d.eur) : (wnUsdt(d.net) + ' USDT');
  return wnTon(d.net) + ' TON';
}
function wnTxImporto(t){
  var raw = +(t.amount || 0);
  var unita = String(t.unita || t.unit || 'BTC').toUpperCase();
  var eur;
  if(unita === 'EUR') eur = raw;
  else if(unita === 'TON') eur = (t.eur !== undefined && t.eur !== null) ? (+t.eur) : null;
  else eur = raw * (+S.rate || 0);
  if(t.gratis) return { testo:'gratis', eur:0 };
  if(eur === null || eur !== eur) return { testo: (unita === 'TON' ? wnTon(Math.abs(raw)) : wnNum(Math.abs(raw), 8)) + ' ' + unita, eur:null };
  return { testo: wnEur(Math.abs(eur)), eur:eur };
}
function wnGiorno(ts){
  var d = new Date(ts*1000), o = new Date();
  if(d.toDateString() === o.toDateString()) return 'Oggi';
  if(d.toDateString() === new Date(o.getTime() - 86400000).toDateString()) return 'Ieri';
  return ('0'+d.getDate()).slice(-2) + '/' + ('0'+(d.getMonth()+1)).slice(-2) + '/' + d.getFullYear();
}
function wnOra(ts){
  var d = new Date(ts*1000);
  return ('0'+d.getHours()).slice(-2) + ':' + ('0'+d.getMinutes()).slice(-2);
}
var WN_COL = {
  dep:{ bg:'#0f2a40', fg:'#4db2ff' }, win:{ bg:'rgba(61,220,151,.12)', fg:'#3ddc97' },
  out:{ bg:'#2a1a1a', fg:'#ff8a7a' }, wd:{ bg:'#2a2410', fg:'#ffd76b' }, neu:{ bg:'#1b2133', fg:'#c6cbe0' }
};
function wnMovimenti(){
  var box = wnEl('w-tx'); if(!box) return;
  var righe = [];
  var txs = (S.txs || []).slice(0, 30);
  for(var i = 0; i < txs.length; i++){
    var t = txs[i] || {};
    var ts = +(t.ts || t.timestamp || 0);
    var sg = (typeof TX_SEGNI !== 'undefined' && TX_SEGNI[t.type]) || 0;
    var lab = (typeof TX_ETICHETTE !== 'undefined' && TX_ETICHETTE[t.type]) || (t.type || 'Gioco');
    var sp = lab.indexOf(' ');
    if(sp > 0 && /[^\u0000-ɏ]/.test(lab.slice(0, sp))) lab = lab.slice(sp + 1);
    var gioco = '';
    if(t.game && t.game !== 'Deposito' && t.game !== 'Prelievo' && t.game !== 'game')
      gioco = (typeof TX_GIOCHI !== 'undefined' && TX_GIOCHI[t.game]) || t.game;
    var imp = wnTxImporto(t);
    var tipo = (t.type === 'deposit') ? 'dep' : (t.type === 'withdraw') ? 'wd'
             : (sg > 0 ? 'win' : (sg < 0 ? 'out' : 'neu'));
    righe.push({ ts:ts, titolo:lab, gioco:gioco, testo:imp.testo, gratis:!!t.gratis,
                 segno: t.gratis ? '' : (sg > 0 ? '+' : (sg < 0 ? '−' : '')), tipo:tipo });
  }
  var st = TONUI.st;
  var hs = (st && st.history) || [];
  for(var j = 0; j < hs.length; j++){
    var r = hs[j] || {};
    var tsr = parseInt(r.ts || r.timestamp || 0, 10);
    var eurR = (r.eur != null) ? +r.eur : ((r.cent != null) ? (+r.cent)/100 : null);
    righe.push({ ts:tsr, titolo:'Prelievo TON', sotto:'Pagato', extra: wnTon(r.amount || r.ton) + ' TON',
                 testo: eurR != null ? wnEur(eurR) : (wnTon(r.amount || r.ton) + ' TON'),
                 segno:'−', tipo:'wd' });
  }
  var hu = (wnU() && wnU().history) || [];
  for(var ju = 0; ju < hu.length; ju++){
    var ru = hu[ju] || {};
    var tsu = parseInt(ru.ts || ru.timestamp || 0, 10);
    var nu = (ru.usdt != null) ? ru.usdt : ru.amount;
    var eurU = (ru.eur != null) ? +ru.eur : ((ru.cent != null) ? (+ru.cent)/100 : null);
    righe.push({ ts:tsu, titolo:'Prelievo USDT', sotto:'Pagato', extra: (nu != null ? wnUsdt(nu) + ' USDT' : ''),
                 testo: eurU != null ? wnEur(eurU) : (wnUsdt(nu) + ' USDT'), segno:'−', tipo:'wd' });
  }
  var d = wnDepLeggi();
  if(d) righe.push({ ts: Math.floor(d.ts/1000), titolo: (d.val === 'USDT' ? 'Deposito USDT' : 'Deposito TON'), sotto:'In arrivo',
                     extra: wnTon(d.ton) + ' ' + wnDepUn(d), testo: '≈ ' + wnDepNetto(d), segno:'+', tipo:'dep', blu:true });
  righe.sort(function(a, b){ return (b.ts||0) - (a.ts||0); });
  if(!righe.length){
    box.innerHTML = '<div class="wn-card wn-vuoto">'
      + '<div class="wn-b">Ancora nessun movimento</div>'
      + '<div class="wn-nota">Qui compaiono i depositi, i prelievi e le vincite, dal piu recente.</div>'
      + '<button class="wn-btn2" onclick="wnApri(\'carica\')">Fai un deposito</button></div>';
    return;
  }
  var out = '', giorno = null, aperto = false;
  for(var k = 0; k < righe.length; k++){
    var m = righe[k];
    var g = m.ts ? wnGiorno(m.ts) : '';
    if(g !== giorno){
      if(aperto) out += '</div>';
      out += '<div class="wn-giorno">' + wnEsc(g) + '</div><div class="wn-card wn-lista">';
      giorno = g; aperto = true;
    }
    var col = WN_COL[m.tipo] || WN_COL.neu;
    var sig = String(m.titolo || '?').charAt(0).toUpperCase();
    var sotto = '';
    if(m.sotto) sotto += '<span>' + wnEsc(m.sotto) + '</span>';
    if(m.extra) sotto += '<span> · ' + wnEsc(m.extra) + '</span>';
    if(m.gioco) sotto += '<span>' + wnEsc(m.gioco) + '</span>';
    if(m.ts) sotto += '<span>' + (sotto ? ' · ' : '') + wnOra(m.ts) + '</span>';
    var colA = m.blu ? '#8ccaff' : (m.segno === '+' ? '#3ddc97' : '#eef0f6');
    out += '<div class="wn-mv"><div class="wn-sg" style="background:' + col.bg + ';color:' + col.fg + ';">' + wnEsc(sig) + '</div>'
      + '<div class="wn-mv__tx"><div class="wn-mv__t">' + wnEsc(m.titolo) + '</div>'
      + '<div class="wn-mv__s">' + sotto + '</div></div>'
      + '<div class="wn-mv__a" style="color:' + colA + ';">'
      + (m.segno ? '<span>' + m.segno + ' </span>' : '') + '<span>' + wnEsc(m.testo) + '</span></div></div>';
  }
  if(aperto) out += '</div>';
  box.innerHTML = out;
}
function wnCollegaHtml(perche){
  return (perche ? '<div class="wn-card wn-info"><div>' + perche + '</div></div>' : '')
    + '<button class="wn-btn wn-btn--ton" id="tonui-cbtn" onclick="tonUiCollega(\'telegram-wallet\')">'
    + WN_IC.tonB + '<span class="wn-lab">Collega il Wallet di Telegram</span></button>'
    + '<button class="wn-btn2" onclick="tonUiCollega()">Altri wallet (Tonkeeper, MyTonWallet…)</button>'
    + '<div class="wn-nota wn-c">Il Wallet di Telegram si apre qui, senza uscire da Telegram. Usa il suo TON Wallet (self-custodial): il saldo del Crypto Wallet non si collega alle app.</div>'
    + '<div class="wn-nota wn-c">Collegare non sposta soldi e non tocca il tuo saldo.</div>';
}
function wnCarica(){
  var m = WN.met;
  var bs = document.querySelectorAll('#wn-v-carica .wn-seg__b');
  for(var i = 0; i < bs.length; i++){
    var on = bs[i].getAttribute('data-m') === m;
    bs[i].className = 'wn-seg__b' + (on ? ' on' : '');
    bs[i].setAttribute('aria-selected', on ? 'true' : 'false');
  }
  ['ton','carta','btc'].forEach(function(k){
    var e = wnEl('wn-pan-' + k); if(e) e.className = 'wn-pan' + (k === m ? ' on' : '');
  });
  if(m === 'btc' || m === 'carta'){ try{ renderDeposit(); }catch(e){} }
  if(m !== 'ton') return;
  var st = TONUI.st, testa = wnEl('wn-ton-testa'), h = '';
  var form = false, altro = false;
  var su = wnUsdtDep() && !TONUI.down;
  var val = su ? wnValCorr() : 'TON';
  var usdt = (val === 'USDT');
  wnMostra('wn-val', su, 'flex');
  var vb = document.querySelectorAll('#wn-val .wn-val__b');
  for(var j = 0; j < vb.length; j++){
    var von = su && vb[j].getAttribute('data-v') === val;
    vb[j].className = 'wn-val__b' + (von ? ' on' : '');
    vb[j].setAttribute('aria-selected', von ? 'true' : 'false');
  }
  wnTesto('wn-dep-unit', usdt ? 'USDT' : 'TON');
  if(TONUI.down){
    h = '<div class="wn-card wn-info"><div>Il TON non è disponibile adesso. Il tuo saldo è al sicuro: qui non cambia niente.</div></div>';
  } else if(!st){
    h = '<div class="wn-card wn-info"><div>Carico…</div></div>';
  } else {
    var dep = st.deposit || {};
    var u = wnU() || {}, udep = u.deposit || {};
    var aperto = usdt ? !!(udep.address || dep.address) : !!dep.enabled;
    if(!aperto){
      h = '<div class="wn-card wn-info"><div>' + (usdt
        ? 'I depositi in USDT non sono disponibili adesso. Per ora puoi caricare in TON, con la carta o con Bitcoin.'
        : (su ? 'I depositi in TON non sono ancora aperti. Per ora puoi caricare in USDT, con la carta o con Bitcoin.'
              : 'I depositi in TON non sono ancora aperti. Per ora puoi caricare con la carta o con Bitcoin.')) + '</div></div>';
    } else if(st.connected && typeof TON_CONNECT_UI !== 'undefined'){
      var wv = usdt ? wnWalletUsdt() : wnWalletTon();
      var car = usdt ? WN_UB.carico : WN_WB.carico;
      h = '<div class="wn-card wn-tg wn-blu"><div class="wn-ic" style="width:40px;height:40px;">' + WN_IC.ton + '</div>'
        + '<div class="wn-tg__tx"><div class="wn-nota">'
        + (wnNomeWallet() === 'Wallet di Telegram' ? 'Dal tuo Wallet di Telegram' : 'Dal tuo wallet collegato') + '</div>'
        + '<div class="wn-b" style="font-size:16px;">'
        + (wv != null ? '<span>' + wnTon(wv) + ' ' + (usdt ? 'USDT' : 'TON') + '</span> <span>disponibili</span>'
            : (car ? '<span>Leggo il saldo…</span>' : '<span class="wn-mono" style="font-size:13px;">' + wnEsc(wnCorto(st.address)) + '</span>'))
        + '</div></div></div>'
        + '<button class="wn-link" onclick="tonUiCollega()">Collega un altro wallet</button>';
      form = true; altro = true;
    } else if(typeof TON_CONNECT_UI === 'undefined'){
      h = '<div class="wn-card wn-info"><div>Il collegamento del wallet non è disponibile adesso. Puoi caricare lo stesso con indirizzo e memo.</div></div>';
      altro = true; WN.altro = true;
    } else {
      h = wnCollegaHtml('');
      altro = true;
    }
    wnTesto('wn-dep-addr', (usdt ? (udep.address || dep.address) : dep.address) || '');
    wnTesto('wn-dep-memo', (usdt ? (udep.memo || dep.memo) : dep.memo) || '');
    if(usdt){
      var um = wnUsdtMin();
      wnTesto('wn-dep-min', um > 0 ? (wnUsdt(um) + ' USDT') : '—');
      wnMostra('wn-dep-min-r', um > 0, 'flex');
    } else {
      wnTesto('wn-dep-min', ((st.min_deposit || st.min_withdraw) ? wnTon(st.min_deposit || st.min_withdraw) + ' TON' : '—'));
      wnMostra('wn-dep-min-r', true, 'flex');
    }
  }
  if(testa && testa.getAttribute('data-h') !== h){ testa.innerHTML = h; testa.setAttribute('data-h', h); }
  wnMostra('wn-ton-form', form, 'flex');
  wnMostra('wn-altro-box', altro, 'flex');
  wnMostra('wn-altro', altro && WN.altro);
  wnMostra('wn-altro-usdt', su);
  wnTesto('wn-altro-lab', WN.altro ? 'Nascondi indirizzo e memo' : 'Mandi da un altro wallet? Indirizzo e memo');
  if(form) wnDepChips();
}
function wnUsdtMin(){
  var u = wnU() || {};
  var v = (u.min_deposit != null) ? +u.min_deposit : 0;
  return (isFinite(v) && v > 0) ? v : 0;
}
function wnDepLimiti(){
  var st = TONUI.st || {};
  if(wnValCorr() === 'USDT'){
    var wu = wnWalletUsdt();
    return { min: wnUsdtMin(), max: (wu != null) ? Math.max(0, Math.floor(wu * 100 + 1e-6) / 100) : null, usdt:true };
  }
  var wt = wnWalletTon();
  var max = (wt != null) ? Math.max(0, Math.floor((wt - 0.05) * 100) / 100) : null;
  return { min: +(st.min_deposit || st.min_withdraw || 0), max: max };
}
function wnDepChips(){
  var L = wnDepLimiti(), box = wnEl('wn-dep-chips'), inp = wnEl('tonui-depamt');
  if(!box) return;
  var vals = [];
  if(!(L.usdt && L.max == null)){
    (L.usdt ? [10, 25, 50, 100] : [5, 10, 25, 50]).forEach(function(v){
      if(v >= L.min && (L.max == null || v <= L.max)) vals.push({ v:v, lab:String(v) });
    });
    if(L.max != null && L.max >= L.min && L.max > 0 && !(L.usdt && vals.length && vals[vals.length-1].v === L.max))
      vals.push({ v:L.max, lab:'MAX' });
  }
  if(inp && !inp.value && !WN.depTocco && vals.length){
    var pre = null;
    for(var i = 0; i < vals.length; i++) if(vals[i].v === 10) pre = vals[i];
    inp.value = String((pre || vals[0]).v);
  }
  var cur = inp ? wnLeggi(inp.value) : NaN;
  var h = '';
  for(var k = 0; k < vals.length; k++){
    var on = Math.abs(cur - vals[k].v) < 1e-9;
    h += '<button class="wn-chip' + (on ? ' on' : '') + '" onclick="wnDepImporto(' + vals[k].v + ')">' + vals[k].lab + '</button>';
  }
  if(!h && L.max != null) h = '<div class="wn-nota">' + (L.usdt
    ? 'Nel wallet collegato non ci sono USDT. Puoi mandarli da un altro wallet con indirizzo e memo.'
    : 'Nel wallet non ci sono abbastanza TON per il deposito minimo.') + '</div>';
  if(box.getAttribute('data-h') !== h){ box.innerHTML = h; box.setAttribute('data-h', h); }
  box.style.display = h ? '' : 'none';
  wnDepRiepilogo();
}
function wnValFerma(){ if(wnUsdtDep() && WN.val !== 'USDT' && WN.val !== 'TON') WN.val = wnValCorr(); }
function wnDepImporto(v){
  var i = wnEl('tonui-depamt');
  WN.depTocco = true; wnValFerma();
  if(i) i.value = wnEn() ? String(v) : String(v).replace('.', ',');
  wnDepChips();
}
function wnDepAgg(){ WN.depTocco = true; wnValFerma(); wnDepChips(); }
function wnDepRiepilogo(){
  var st = TONUI.st || {}, i = wnEl('tonui-depamt');
  var v = i ? wnLeggi(i.value) : NaN;
  var L = wnDepLimiti(), a = '';
  if(L.usdt){
    var fu = wnUsdtFee(), net = v * (1 - fu/100), eur = wnUsdtEur(net);
    wnTesto('wn-dep-mandi', (v > 0) ? (wnUsdt(v) + ' USDT') : '—');
    wnTesto('wn-dep-fee', wnNum(fu, (fu % 1) ? 1 : 0) + '%');
    wnTesto('wn-dep-arriva', (v > 0) ? ('≈ ' + (eur != null ? wnEur(eur) : (wnUsdt(net) + ' USDT'))) : '—');
    if(v > 0 && v < L.min) a = 'Il minimo è ' + wnUsdt(L.min) + ' USDT';
    else if(v > 0 && L.max != null && v > L.max) a = 'Nel wallet non ci sono abbastanza USDT.';
    else {
      var wt = wnWalletTon();
      if(v > 0 && wt != null && wt < 0.1) a = 'Per mandare USDT serve anche un po’ di TON nel wallet, per la commissione di rete.';
    }
  } else {
    var fee = (st.deposit_fee_pct != null) ? +st.deposit_fee_pct : 5;
    wnTesto('wn-dep-mandi', (v > 0) ? (wnTon(v) + ' TON') : '—');
    wnTesto('wn-dep-fee', wnNum(fee, (fee % 1) ? 1 : 0) + '%');
    wnTesto('wn-dep-arriva', (v > 0) ? ('≈ ' + wnTon(v * (1 - fee/100)) + ' TON') : '—');
    if(v > 0 && v < L.min) a = 'Il minimo è ' + wnTon(L.min) + ' TON';
    else if(v > 0 && L.max != null && v > L.max) a = 'Nel wallet non bastano: tieni 0,05 TON per la commissione di rete.';
  }
  var e = wnEl('wn-dep-avv');
  if(e){ e.textContent = a; e.style.display = a ? '' : 'none'; }
}
function wnDeposita(){
  var i = wnEl('tonui-depamt');
  var v = i ? wnLeggi(i.value) : NaN;
  var L = wnDepLimiti();
  if(!(v > 0)){ tonUiDici(L.usdt ? 'Scrivi quanti USDT vuoi caricare.' : 'Scrivi quanti TON vuoi caricare.'); return; }
  if(v < L.min){ wnDepRiepilogo(); return; }
  if(L.usdt && L.max != null && v > L.max){ wnDepRiepilogo(); return; }
  if(i) i.value = String(v);
  tonUiDepositaDalWallet();
}
function wnMonete(){
  var m = S.moneteUscita;
  var l = (m && m.length) ? m.slice() : ['TON', 'BTC'];
  var iu = l.indexOf('USDT');
  if(iu < 0 && !(m && m.length) && wnUsdtWd()) l.push('USDT');
  else if(iu >= 0 && !wnU() && l.length > 1) l.splice(iu, 1);
  var ord = { TON:0, USDT:1, BTC:2 };
  l.sort(function(a, b){ return (ord[a] != null ? ord[a] : 3) - (ord[b] != null ? ord[b] : 3); });
  return l;
}
function wnDest(d){ WN.dst = d; var e = wnEl('wn-wd-err'); if(e) e.style.display = 'none'; wnRender(); }
function wnWdBase(){
  var n = wnNumeri(), st = TONUI.st || {};
  var b = n.disp;
  if(st.saldo_eur != null) b = Math.min(b, +st.saldo_eur);
  return Math.max(0, Math.floor(b * 100 + 1e-6) / 100);
}
function wnWdUsdt(){ return WN.dst === 'USDT'; }
function wnWdMin(){
  var st = TONUI.st || null, u = wnU();
  if(wnWdUsdt() && u && u.min_cent != null) return (+u.min_cent)/100;
  return (st && st.min_cent != null) ? (+st.min_cent)/100 : 10;
}
function wnPrelevaV(){
  var mon = wnMonete();
  if(!WN.dst || mon.indexOf(WN.dst) < 0) WN.dst = (mon.indexOf('TON') >= 0) ? 'TON' : mon[0];
  var st = TONUI.st || null;
  var h = '';
  for(var i = 0; i < mon.length; i++){
    var k = mon[i], on = (k === WN.dst);
    var tw = (k === 'TON' || k === 'USDT');
    var nome = (k === 'TON') ? 'Wallet di Telegram (TON)' : (k === 'USDT' ? 'Wallet di Telegram (USDT)' : (k === 'BTC' ? 'Bitcoin' : k));
    var sotto = tw
      ? ((st && st.connected) ? wnCorto(st.address) : 'Wallet da collegare')
      : (k === 'BTC' ? 'Indirizzo e importo nella chat del bot' : '');
    h += '<button class="wn-d' + (on ? ' on' : '') + '" role="radio" aria-checked="' + (on ? 'true' : 'false') + '" data-k="' + wnEsc(k) + '" onclick="wnDest(\'' + k + '\')">'
      + '<div class="wn-d__o"><i></i></div><div class="wn-d__tx"><div class="wn-d__t">' + wnEsc(nome) + '</div>'
      + '<div class="wn-d__s' + ((tw && st && st.connected) ? ' wn-mono' : '') + '">' + wnEsc(sotto) + '</div></div></button>';
  }
  var dd = wnEl('wn-dest');
  if(dd && dd.getAttribute('data-h') !== h){ dd.innerHTML = h; dd.setAttribute('data-h', h); }
  var m = S.moneteUscita, nota = '';
  if(m && m.length === 0) nota = 'Non hai ancora caricato: il primo prelievo segue la moneta con cui carichi.';
  else if(m && m.length === 2 && m.indexOf('BTC') >= 0 && m.indexOf('TON') >= 0) nota = 'Hai caricato in Bitcoin e TON: puoi prelevare in tutt’e due.';
  else if(m && m.length > 1) nota = 'Puoi prelevare in ognuna delle monete con cui hai caricato.';
  else if(m && m[0] === 'TON') nota = 'Hai caricato in TON: il prelievo esce in TON.';
  else if(m && m[0] === 'BTC') nota = 'Hai caricato in Bitcoin: il prelievo esce in Bitcoin.';
  else if(m && m[0] === 'USDT') nota = 'Hai caricato in USDT: il prelievo esce in USDT.';
  var ne = wnEl('wn-monete'); if(ne){ ne.textContent = nota; ne.style.display = nota ? '' : 'none'; }
  wnTesto('wn-min', wnEur(wnWdMin()).replace(/[.,]00$/, ''));
  var usdt = wnWdUsdt();
  var isTon = (WN.dst === 'TON') || usdt;
  wnMostra('wn-wd-ton', isTon, 'flex');
  wnMostra('wn-wd-btc', !isTon, 'flex');
  if(!isTon) return;
  var x = '', form = false, u = wnU();
  if(TONUI.down) x = '<div class="wn-card wn-info"><div>Il TON non è disponibile adesso. Il tuo saldo è al sicuro: qui non cambia niente.</div></div>';
  else if(!st) x = '<div class="wn-card wn-info"><div>Carico…</div></div>';
  else if(usdt && !wnUsdtWd()) x = '<div class="wn-card wn-info"><div>I prelievi in USDT non sono disponibili adesso. Il tuo saldo resta dov’è.</div></div>';
  else if(!usdt && !st.withdraw_enabled) x = '<div class="wn-card wn-info"><div>I prelievi in TON non sono ancora aperti. Il tuo saldo resta dov’è.</div></div>';
  else if(!st.connected) x = wnCollegaHtml(usdt
      ? 'Per prelevare in USDT collega prima il wallet dove vuoi ricevere gli USDT: il prelievo arriva solo lì, così non c’è un indirizzo da scrivere e da sbagliare.'
      : 'Per prelevare in TON collega prima il wallet dove vuoi ricevere i TON: il prelievo arriva solo lì, così non c’è un indirizzo da scrivere e da sbagliare.');
  else if(usdt ? (u && u.pending) : st.pending) x = '<div class="wn-card wn-info"><div>Un prelievo alla volta: ne hai già uno in corso. Lo segui nel wallet, sotto «In corso».</div></div>'
      + '<button class="wn-btn2" onclick="wnVai(\'home\')">Vedi «In corso»</button>';
  else form = true;
  var se = wnEl('wn-wd-stato');
  if(se && se.getAttribute('data-h') !== x){ se.innerHTML = x; se.setAttribute('data-h', x); }
  wnMostra('wn-wd-form', form, 'flex');
  if(!form) return;
  wnWdAgg(true);
}
function wnWdTempo(v){
  var st = TONUI.st || {}, u = wnU() || {};
  if(wnWdUsdt()){
    var lim = (u.auto_limit_cent != null) ? +u.auto_limit_cent : 0;
    if(!(lim > 0)) return 'Dopo l’approvazione di un operatore';
    if(v > 0) return (Math.round(v * 100) <= lim) ? 'Entro un minuto, in automatico' : 'Dopo l’approvazione di un operatore';
    return 'In automatico fino al tuo tetto, oltre lo approva un operatore';
  }
  if(st.auto_illimitato) return 'Entro un minuto, in automatico';
  if(parseFloat(st.auto_limit || 0) <= 0) return 'Dopo l’approvazione di un operatore';
  return 'In automatico fino al tuo tetto, oltre lo approva un operatore';
}
function wnQuota(q){
  var i = wnEl('tonui-amt'); if(!i) return;
  var v = Math.floor(wnWdBase() * q * 100 + 1e-6) / 100;
  i.value = wnNum(v, 2);
  WN.quota = q;
  wnWdAgg(true);
}
function wnWdAgg(daQuota){
  if(daQuota !== true) WN.quota = null;
  var i = wnEl('tonui-amt');
  var v = i ? wnLeggi(i.value) : NaN;
  wnTesto('wn-wd-eur', (v > 0) ? wnEur(v) : '—');
  wnTesto('wn-wd-btn-n', (v > 0) ? (' ' + wnEur(v)) : '');
  wnTesto('wn-wd-tempo', wnWdTempo(v));
  var ric = 'TON al cambio del momento';
  if(wnWdUsdt()){
    var u = wnU() || {}, p = +u.prezzo_eur;
    ric = (v > 0 && isFinite(p) && p > 0) ? ('≈ ' + wnUsdt(v / p) + ' USDT') : 'USDT al cambio del momento';
  }
  wnTesto('wn-wd-ricevi', ric);
  var cs = document.querySelectorAll('#wn-wd-chips .wn-chip');
  for(var k = 0; k < cs.length; k++)
    cs[k].className = 'wn-chip' + ((WN.quota != null && +cs[k].getAttribute('data-q') === WN.quota) ? ' on' : '');
}
function wnWdErr(t){
  var e = wnEl('wn-wd-err');
  if(e){ e.textContent = t || ''; e.style.display = t ? '' : 'none'; }
  if(t && typeof toast === 'function') toast(t, 'err');
}
function wnPreleva(){
  var i = wnEl('tonui-amt');
  var v = i ? wnLeggi(i.value) : NaN;
  var minE = wnWdMin();
  if(!(v > 0)){ wnWdErr('Scrivi quanto vuoi prelevare.'); return; }
  if(v + 1e-9 < minE){ wnWdErr('Il prelievo minimo è ' + wnEur(minE)); return; }
  if(v > wnWdBase() + 1e-9){ wnWdErr('Non ci sono abbastanza euro disponibili per questo importo.'); return; }
  wnWdErr('');
  if(i) i.value = v.toFixed(2);
  WN.wdVal = wnWdUsdt() ? 'USDT' : 'TON';
  try{ tonUiPreleva(); } finally { WN.wdVal = null; }
  if(i) i.value = wnNum(v, 2);
}
function wnWdOk(d, valuta){
  var usdt = (valuta === 'USDT');
  var q = usdt ? ((d.usdt != null) ? +d.usdt : (+d.amount || 0)) : (+d.amount || 0);
  WN.ok = { tipo:'wd', val: usdt ? 'USDT' : 'TON', ton: q || 0, eur: (d.eur != null) ? +d.eur : ((d.cent != null) ? (+d.cent)/100 : null),
            rid: d.rid || '', needs: !!d.needs_approval, ferma: !!d.queue_paused, capienza: !!d.capienza,
            ts: Date.now(), fase:1, visto:false, finito:false };
  var i = wnEl('tonui-amt'); if(i) i.value = '';
  wnVai('ok');
}
function wnWdSegui(){
  var o = WN.ok, st = TONUI.st; if(!o || !st) return;
  var usdt = (o.val === 'USDT'), u = wnU() || {};
  var p = usdt ? u.pending : st.pending;
  if(p && (!o.rid || !p.rid || p.rid === o.rid)){
    o.visto = true; o.fase = Math.max(o.fase, wnFaseWd(p)); o.stato = p.stato; o.hash = p.hash || o.hash;
    if(usdt && !o.ton && p.usdt != null) o.ton = +p.usdt;
    if(p.confermato) o.finito = true;
  } else if(o.visto && !p){
    var hs = (usdt ? u.history : st.history) || [];
    for(var k = 0; k < hs.length; k++){
      var r = hs[k] || {};
      var rq = usdt ? (+r.usdt || +r.amount || 0) : (+r.amount || +r.ton || 0);
      if((o.rid && r.rid === o.rid) || (o.ton > 0 && Math.abs(rq - o.ton) < 1e-6 &&
         parseInt(r.ts || 0, 10) * 1000 >= o.ts - 120000)){ o.finito = true; o.fase = 3; break; }
    }
  }
}
function wnPassi(lista){
  var h = '';
  for(var i = 0; i < lista.length; i++)
    h += '<div class="wn-passo' + (lista[i][1] ? ' on' : '') + '"><i>' + (lista[i][1] ? WN_IC.spunta : '') + '</i><span>' + wnEsc(lista[i][0]) + '</span></div>';
  return h;
}
function wnOk(){
  var o = WN.ok; if(!o) return;
  var t, x, passi, sum = '', nota = '', fatto;
  var un = (o.val === 'USDT') ? 'USDT' : 'TON';
  if(o.tipo === 'dep'){
    fatto = !!o.accr;
    t = fatto ? 'Deposito accreditato' : 'Deposito inviato';
    x = fatto ? 'Gli euro sono sul tuo conto. Buon divertimento.'
              : 'Hai confermato nel wallet. Ti accreditiamo gli euro appena la rete lo conferma, di solito in un paio di minuti.';
    passi = [['Confermato nel wallet', true], ['Visto sulla rete TON', fatto], ['Euro sul conto', fatto]];
    sum = '<div class="wn-row"><span class="wn-mut">Mandi</span><span class="wn-b">' + wnTon(o.ton) + ' ' + un + '</span></div>'
        + '<div class="wn-row"><span class="wn-mut">Arriva sul conto</span><span class="wn-b">≈ '
        + wnEsc(wnDepNetto({ val:o.val, net:o.net, eur:o.eur })) + '</span></div>';
    if(!fatto) nota = 'Puoi chiudere questa pagina: il saldo si aggiorna da solo.';
  } else {
    fatto = !!o.finito;
    t = fatto ? 'Prelievo arrivato' : 'Prelievo richiesto';
    if(fatto) x = (un === 'USDT') ? 'Gli USDT sono nel tuo wallet.' : 'I TON sono nel tuo wallet.';
    else if(o.capienza) x = 'La cassa USDT si sta ricaricando: il tuo prelievo parte appena c’è copertura. Non si perde niente. Puoi seguirlo nel wallet, sotto «In corso».';
    else if(o.ferma) x = (un === 'USDT')
      ? 'La coda dei prelievi USDT è ferma mentre chiariamo un pagamento precedente: il tuo parte appena riparte. Non si perde niente.'
      : 'La coda dei prelievi TON è ferma mentre chiariamo un pagamento precedente: il tuo parte appena riparte, e fino ad allora puoi annullarlo.';
    else if(o.needs) x = 'Parte appena un operatore lo approva. Puoi seguirlo nel wallet, sotto «In corso».';
    else x = 'Parte in automatico entro un minuto verso il tuo wallet. Puoi seguirlo nel wallet, sotto «In corso».';
    passi = [['Richiesta registrata', true], ['Pagamento in uscita', o.fase >= 2 || fatto], ['Arrivato nel wallet', fatto]];
    sum = (o.eur != null ? '<div class="wn-row"><span class="wn-mut">Prelevi</span><span class="wn-b">' + wnEur(o.eur) + '</span></div>' : '')
        + (o.ton > 0 ? '<div class="wn-row"><span class="wn-mut">Ricevi</span><span class="wn-b">' + wnTon(o.ton) + ' ' + un + '</span></div>' : '');
    if(o.stato && WN_STATI_WD[o.stato] && !fatto) nota = WN_STATI_WD[o.stato];
  }
  wnTesto('wn-ok-t', t);
  wnTesto('wn-ok-x', x);
  var ic = wnEl('wn-ok-ic');
  if(ic){ ic.className = 'wn-ok__ic' + (fatto ? '' : ' att'); ic.innerHTML = fatto ? WN_IC.ok : WN_IC.att; }
  var s = wnEl('wn-ok-sum'); if(s) s.innerHTML = sum;
  var p = wnEl('wn-ok-passi'); if(p) p.innerHTML = wnPassi(passi);
  var n = wnEl('wn-ok-nota'); if(n){ n.textContent = nota; n.style.display = nota ? '' : 'none'; }
  var a = wnEl('wn-ok-link');
  if(a){
    if(o.tipo === 'wd' && o.hash){ a.href = 'https://tonviewer.com/transaction/' + encodeURIComponent(o.hash); a.style.display = ''; }
    else a.style.display = 'none';
  }
}
(function(){
  function fai(){
    try{
      if(!wnEn()) return;
      var a = wnEl('tonui-depamt'); if(a) a.placeholder = 'Other amount';
      var b = wnEl('tonui-amt'); if(b) b.placeholder = 'Amount';
      var c = wnEl('wn-back'); if(c) c.setAttribute('aria-label', 'Back');
    }catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fai); else fai();
})();
