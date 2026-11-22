var TONUI = { ui:null, st:null, busy:false };
function tonUiFmt(x){
  var n = parseFloat(x||0);
  if(!isFinite(n)) return '0';
  var s = n.toFixed(9).replace(/0+$/,'').replace(/\.$/,'');
  return s || '0';
}
function tonUiCorto(a){
  a = String(a||'');
  return a.length > 16 ? a.slice(0,8)+'\u2026'+a.slice(-6) : a;
}
function tonUiEsc(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                             .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function tonUiApri(){
  if(TONUI.ui) return TONUI.ui;
  if(typeof TON_CONNECT_UI === 'undefined') return null;
  try{
    TONUI.ui = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: location.origin + location.pathname.replace(/[^/]*$/,'')
                   + 'tonconnect-manifest.json',
      actionsConfiguration: { twaReturnUrl: 'https://t.me/Master_Gambler_bot' }
    });
    tonUiAscolta(TONUI.ui);
  }catch(e){
    TONUI.ui = null;
    tonUiDiario('istanza-fallita', (e && e.message) ? e.message : String(e));
  }
  return TONUI.ui;
}
function tonUiDiario(passo, nota){
  try{
    swapApi('/ton/connect/log', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ passo: passo, nota: String(nota||'').slice(0,300) })
    })['catch'](function(){});
  }catch(e){}
}
var TONUI_ATT = 'tonui_attesa';
function tonUiAttesaApri(){
  try{ localStorage.setItem(TONUI_ATT, String(Date.now())); }catch(e){}
}
function tonUiAttesaChiudi(){
  try{ localStorage.removeItem(TONUI_ATT); }catch(e){}
}
function tonUiAttesaViva(){
  try{
    var t = parseInt(localStorage.getItem(TONUI_ATT) || '0', 10);
    if(!t) return false;
    if(Date.now() - t > 300000){ tonUiAttesaChiudi(); return false; }
    return true;
  }catch(e){ return false; }
}
function tonUiAmbiente(){
  var p = '?', wa = null;
  try{ wa = window.Telegram && window.Telegram.WebApp; }catch(e){}
  try{ if(wa && wa.platform) p = String(wa.platform); }catch(e){}
  var v = '?';
  try{ if(wa && wa.version) v = String(wa.version); }catch(e){}
  return 'platform=' + p
       + ' ver=' + v
       + ' proxy=' + (typeof window.TelegramWebviewProxy !== 'undefined')
       + ' openLink=' + !!(wa && typeof wa.openLink === 'function')
       + ' openTgLink=' + !!(wa && typeof wa.openTelegramLink === 'function')
       + ' hash=' + (location.hash ? location.hash.slice(0, 24) : 'vuoto');
}
function tonUiSonda(){
  if(TONUI.sonda) return;
  TONUI.sonda = true;
  window.addEventListener('error', function(ev){
    if(!tonUiAttesaViva()) return;
    var m = (ev && ev.message) ? ev.message : 'errore senza messaggio';
    var d = (ev && ev.filename) ? (' @' + String(ev.filename).slice(-40)
                                   + ':' + ev.lineno) : '';
    tonUiDiario('errore-pagina', m + d);
    tonUiDici(m);
  });
  window.addEventListener('unhandledrejection', function(ev){
    if(!tonUiAttesaViva()) return;
    var r = ev && ev.reason;
    var m = (r && r.message) ? r.message : String(r);
    tonUiDiario('promessa-caduta', m);
    tonUiDici(m);
  });
}
function tonUiApriModale(ui, puoRiprovare, unSolo){
  var p;
  if(unSolo && typeof ui.openSingleWalletModal === 'function'){
    try{ p = ui.openSingleWalletModal(unSolo); }
    catch(e){ p = null; tonUiDiario('singolo-rifiutato', (e && e.message) ? e.message : String(e)); }
    if(p && typeof p.then === 'function'){
      p = p['catch'](function(e){
        var m = (e && e.message) ? String(e.message) : String(e);
        if(m.indexOf('already connected') !== -1) throw e;
        tonUiDiario('singolo-rifiutato', m);
        return ui.openModal();
      });
    }
  }
  if(!p){ try{ p = ui.openModal(); }catch(e){ p = Promise.reject(e); } }
  if(!p || typeof p.then !== 'function') p = Promise.resolve(p);
  return p['catch'](function(e){
    var m = (e && e.message) ? String(e.message) : String(e);
    if(!puoRiprovare || m.indexOf('already connected') === -1) throw e;
    tonUiDiario('gia-collegato', 'il modale ha detto already connected: scollego');
    var d = null;
    try{ d = ui.disconnect(); }catch(e2){}
    if(!d || typeof d.then !== 'function') d = Promise.resolve();
    return d['catch'](function(){ return null; }).then(function(){
      return tonUiApriModale(ui, false, unSolo);
    });
  });
}
function tonUiSbloccaBtn(){
  var b = document.getElementById('tonui-cbtn');
  if(b){ b.disabled = false; (b.querySelector('.wn-lab') || b).textContent = 'Collega il Wallet di Telegram'; }
}
function tonUiDici(t){
  if(t && typeof wnErrIt === 'function') t = wnErrIt(t);
  var e = document.getElementById('tonui-err');
  if(e){ e.textContent = t || ''; e.style.display = t ? '' : 'none'; }
  if(t && typeof toast==='function') toast(t, 'err');
}
function tonUiAscolta(ui){
  if(TONUI.sub) return;
  TONUI.sub = true;
  ui.onStatusChange(function(w){
    if(!w || !w.connectItems || !w.connectItems.tonProof) return;
    if(!tonUiAttesaViva()) return;
    tonUiAttesaChiudi();
    var tp = w.connectItems.tonProof;
    if(!tp.proof){
      var m = (tp.error && tp.error.message) ? tp.error.message
            : 'the wallet did not provide a proof of ownership';
      tonUiDiario('prova-mancante', m);
      tonUiDici('Il wallet non ha dimostrato che l\u2019indirizzo \u00e8 tuo. Riprova.');
      tonUiSbloccaBtn();
      return;
    }
    tonUiDiario('prova-arrivata', String((w.account && w.account.address) || ''));
    swapApi('/ton/connect/verify', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        account:{ address:w.account.address,
                  walletStateInit:w.account.walletStateInit,
                  publicKey:w.account.publicKey },
        proof: tp.proof
      })
    }).then(function(res){
      if(!res || !res.ok || !res.data || !res.data.ok)
        throw new Error((res&&res.data&&res.data.error) || 'verification failed');
      tonUiDici('');
      try{ localStorage.setItem('wn_wallet_app', String(w.appName || ''));
           localStorage.setItem('wn_wallet_nome', String(w.name || '')); }catch(_n){}
      if(typeof toast==='function') toast('Wallet collegato','ok');
      return tonUiLoad();
    })['catch'](function(e){
      var m = (e && e.message) ? String(e.message) : 'could not verify';
      tonUiDiario('verifica-fallita', m);
      tonUiDici(m);
    }).then(function(){ tonUiSbloccaBtn(); });
  }, function(err){
    tonUiAttesaChiudi();
    var m = (err && err.message) ? String(err.message) : 'connection failed';
    tonUiDiario('errore-wallet', m);
    tonUiDici(m);
    tonUiSbloccaBtn();
  });
}
var TONUI_MODO = 'carica';
function tonUiGo(modo){
  TONUI_MODO = (modo === 'preleva') ? 'preleva' : 'carica';
  if(typeof wnApri === 'function'){ wnApri(TONUI_MODO, 'ton'); return; }
  go('ton');
  tonUiModo();
  tonUiLoad();
}
function tonUiModo(){
  var pre = (TONUI_MODO === 'preleva');
  var t = document.querySelector('#ton .game-title');
  if(t){
    var n = t.lastChild;
    if(n && n.nodeType === 3) n.nodeValue = pre ? 'PRELEVA IN TON' : 'CARICA CON TON';
  }
  var wd = document.getElementById('tonui-wd');
  var wc = document.getElementById('tonui-wcard');
  if(wd && wc && wc.parentNode){
    if(pre){ wc.parentNode.insertBefore(wd, wc); wd.style.display = ''; }
    else {
      var pend = document.getElementById('tonui-pend');
      if(pend && pend.parentNode === wc.parentNode) wc.parentNode.insertBefore(wd, pend);
    }
  }
  var db = document.getElementById('tonui-depbody');
  var dcard = db && db.closest ? db.closest('.info-card') : null;
  if(dcard) dcard.style.display = pre ? 'none' : '';
  var intro = document.querySelector('#ton .bal-card');
  if(intro) intro.style.display = pre ? 'none' : '';
  if(wc) wc.style.display = (pre && !(TONUI.st && TONUI.st.connected)) ? 'none' : '';
  var wdb = document.getElementById('tonui-wdbody');
  if(pre && wdb && !TONUI.st) wdb.innerHTML = '<div class="ton-p">Carico…</div>';
}
function tonUiLoad(){
  var b = document.getElementById('tonui-bal');
  if(b) b.textContent = '\u2026';
  return swapApi('/ton/state').then(function(res){
    if(!res.ok){ tonUiNonPronto(); return; }
    TONUI.st = res.data || {};
    TONUI.down = false;
    tonUiDisegna();
    try{ tonUiModo(); }catch(e){}
    try{ if(typeof wnTonAgg === 'function') wnTonAgg(); }catch(e){}
  }).catch(function(){ tonUiNonPronto(); });
}
function tonUiNonPronto(){
  TONUI.down = true;
  try{ if(typeof wnTonAgg === 'function') wnTonAgg(); }catch(e){}
  var b = document.getElementById('tonui-bal');
  if(b) b.textContent = '\u2014';
  var s = document.getElementById('tonui-sub');
  if(s) s.innerHTML = '&nbsp;';
  tonUiErrore('TON is not available right now. Your balance is safe \u2014 '
            + 'nothing here affects it.');
  var wd = document.getElementById('tonui-wd');
  if(wd) wd.style.display = 'none';
  var p = document.getElementById('tonui-pend');
  if(p) p.style.display = 'none';
}
function tonUiErrore(t){
  var w = document.getElementById('tonui-wbody');
  if(w) w.innerHTML = '<div class="ton-p ton-p--warn">'
                    + tonUiEsc(t) + '</div>';
}
function tonUiDisegna(){
  var s = TONUI.st || {};
  var b = document.getElementById('tonui-bal');
  if(b) b.textContent = (s.saldo_eur!=null)
    ? ('\u20ac' + (+s.saldo_eur).toFixed(2))
    : (tonUiFmt(s.balance) + ' TON');
  var _te = (s.eur===undefined||s.eur===null) ? null : +s.eur;
  if(s.saldo_eur!=null) _te = null;
  var _tv = (_te!==null && _te>0)
    ? ('<span class="ton-sub-k">\u2248 \u20ac' + _te.toFixed(2) + '</span>') : '';
  var sub = document.getElementById('tonui-sub');
  if(sub) sub.innerHTML = _tv + (s.connected
    ? '<span class="ton-sub-k">WITHDRAWALS TO</span>'
      + '<span class="ton-sub-v">' + tonUiEsc(tonUiCorto(s.address)) + '</span>'
    : '<span class="ton-sub-k">WALLET NOT CONNECTED</span>');
  var w = document.getElementById('tonui-wbody');
  if(w){
    if(typeof TON_CONNECT_UI === 'undefined'){
      w.innerHTML = '<div class="ton-p">'
        + 'Wallet connection is unavailable right now. Your balance is safe.'
        + '</div>';
    } else if(s.connected){
      w.innerHTML =
        '<div class="ton-lbl">CONNECTED ADDRESS</div>'
        + '<div class="ton-well ton-well--addr">' + tonUiEsc(s.address) + '</div>'
        + '<div class="ton-acts">'
        + '<button class="action-btn" onclick="tonUiCopia()">'
        + '\ud83d\udccb COPY</button>'
        + '<button class="action-btn red" onclick="tonUiScollega()">'
        + 'DISCONNECT</button></div>'
        + '<div class="ton-note">'
        + 'Withdrawals go to this address only. Nothing else can be entered '
        + 'by hand \u2014 that is the point.</div>';
    } else {
      var meta = false;
      try{ meta = !!(TONUI.ui && (TONUI.ui.connected ||
                    (TONUI.ui.account && TONUI.ui.account.address))); }catch(e){}
      w.innerHTML =
        '<div class="ton-p">'
        + (meta
           ? 'Your wallet is connected here, but it has not proved it is '
             + 'yours yet. Tap below: it will reconnect and sign a short '
             + 'message. Nothing leaves your wallet.'
           : 'Connect your TON wallet to tell us <b>where to send your '
             + 'withdrawals</b>. No address to type, nothing to mistype.')
        + '</div>'
        + '<div class="ton-note">'
        + 'Connecting does <b>not</b> move any TON. '
        + 'The TON in your wallet stay in your wallet \u2014 we cannot see '
        + 'them or touch them. The balance above is what you hold '
        + '<b>inside the casino</b>, and it only grows with a deposit.</div>'
        + (meta
           ? '<button class="action-btn red ton-w" '
             + 'onclick="tonUiScollega()">DISCONNECT</button>'
           : '')
        + '<button class="action-btn gold ton-w ton-cta" '
        + 'onclick="tonUiCollega()" id="tonui-cbtn">\ud83d\udd17 CONNECT WALLET</button>'
        + '<div id="tonui-err" class="ton-err" style="display:none;"></div>';
    }
  }
  var wd = document.getElementById('tonui-wd');
  var wb = document.getElementById('tonui-wdbody');
  if(wd && wb){
    wd.style.display = '';
    if(!s.withdraw_enabled){
      wb.innerHTML = '<div class="ton-p">'
        + 'TON withdrawals are not open yet. Your balance stays where it is.'
        + '</div>';
    } else if(!s.connected){
      wb.innerHTML = '<div class="ton-p">'
        + 'Per prelevare in TON collega prima il <b>wallet dove vuoi ricevere i TON</b>: '
        + 'il prelievo arriva solo li\u2019, cosi\u2019 non c\u2019e\u2019 un indirizzo da scrivere e da sbagliare.'
        + '</div>'
        + '<div class="ton-note">Collegare non sposta soldi e non tocca il tuo saldo.</div>'
        + '<button class="action-btn gold ton-w ton-cta" onclick="tonUiCollega()">'
        + '\ud83d\udc8e COLLEGA IL WALLET</button>';
    } else if(s.pending){
      wb.innerHTML = '<div class="ton-p">'
        + 'One withdrawal at a time.</div>';
    } else {
      var avviso = (parseFloat(s.auto_limit||0) <= 0)
        ? '<div class="ton-note">'
          + 'Questo prelievo lo approva un operatore prima che parta: succede '
          + 'quando sul conto non ci sono depositi in TON da cui far partire il '
          + 'pagamento automatico. Non e\u2019 un problema del tuo conto.</div>'
        : '';
      wb.innerHTML =
        '<div class="ton-amt">'
        + '<input id="tonui-amt" class="ton-inp" type="text" inputmode="decimal" '
        + 'placeholder="0.00">'
        + '<button class="action-btn ton-max" onclick="tonUiMax()">MAX</button>'
        + '</div>'
        + '<div class="ton-row"><span class="ton-row__k">DISPONIBILE</span>'
        + '<span class="ton-row__v">' + ((s.saldo_eur!=null)
            ? ('\u20ac' + (+s.saldo_eur).toFixed(2))
            : (tonUiFmt(s.balance) + ' TON')) + '</span></div>'
        + '<div class="ton-row"><span class="ton-row__k">MINIMO</span>'
        + '<span class="ton-row__v">' + ((s.min_cent!=null)
            ? ('\u20ac' + (s.min_cent/100).toFixed(2))
            : (tonUiFmt(s.min_withdraw) + ' TON')) + '</span></div>'
        + '<button class="action-btn gold ton-w ton-cta" '
        + 'id="tonui-wdbtn" onclick="tonUiPreleva()">\ud83d\udce4 PRELEVA SUL MIO WALLET</button>'
        + avviso;
    }
  }
  var p = document.getElementById('tonui-pend');
  var pb = document.getElementById('tonui-pendbody');
  if(p && pb){
    if(s.pending){
      var spiega = {
        attesa_ok:'waiting for approval',
        richiesto:'queued',
        attesa_capienza:'waiting for the house wallet to be topped up',
        prenotato:'about to leave',
        in_volo:'in progress',
        trasmesso:'sent \u2014 waiting for the chain to confirm'
      }[s.pending.stato] || s.pending.stato;
      p.style.display = '';
      pb.innerHTML = '<div class="ton-pend">'
        + '<div class="ton-pend__st">' + tonUiEsc(spiega) + '</div>'
        + '<div class="ton-num">' + tonUiFmt(s.pending.ton) + ' TON</div>'
        + '</div>'
        + '<div class="ton-lbl ton-lbl--sp">TO</div>'
        + '<div class="ton-well ton-well--addr ton-well--s">'
        + tonUiEsc(s.pending.dest||'') + '</div>'
        + (s.pending.hash
            ? ('<div class="ton-lbl ton-lbl--sp">'
               + (s.pending.confermato ? 'TRANSACTION' : 'BROADCAST HASH')
               + '</div>'
               + '<div class="ton-well ton-well--addr ton-well--s">'
               + tonUiEsc(s.pending.hash) + '</div>'
               + '<a class="ton-link" target="_blank" rel="noopener" href="'
               + 'https://tonviewer.com/transaction/'
               + encodeURIComponent(s.pending.hash) + '">Check it on tonviewer</a>'
               + (s.pending.confermato ? ''
                  : '<div class="ton-p ton-p--s">This is the hash of the '
                    + 'message we broadcast. The final transaction hash may '
                    + 'differ.</div>'))
            : '');
    } else { p.style.display = 'none'; }
  }
  var db = document.getElementById('tonui-depbody');
  if(db){
    var dep = s.deposit || {};
    if(dep.enabled){
      db.innerHTML =
        '<div class="ton-p">'
        + 'Send TON to this address, <b>with the memo below</b>. It is '
        + 'credited automatically within a couple of minutes '
        + '(' + (s.deposit_fee_pct != null ? s.deposit_fee_pct : 5)
        + '% deposit fee).</div>'
        + '<div class="ton-row"><span class="ton-row__k">MINIMUM</span>'
        + '<span class="ton-row__v">' + tonUiFmt(s.min_deposit || s.min_withdraw) + ' TON</span></div>'
        + '<div class="ton-lbl ton-lbl--sp">ADDRESS</div>'
        + '<div class="ton-well ton-well--addr">' + tonUiEsc(dep.address) + '</div>'
        + '<button class="action-btn ton-w" '
        + 'onclick="tonUiCopiaDep(\'address\')">\ud83d\udccb COPY ADDRESS</button>'
        + '<div class="ton-lbl ton-lbl--sp ton-lbl--must">'
        + 'MEMO / COMMENT \u00b7 REQUIRED</div>'
        + '<div class="ton-well ton-well--memo">' + tonUiEsc(dep.memo) + '</div>'
        + '<button class="action-btn gold ton-w" '
        + 'onclick="tonUiCopiaDep(\'memo\')">\ud83d\udccb COPY MEMO</button>'
        + (s.connected
           ? '<div class="ton-sep"></div>'
             + '<div class="ton-lbl">FROM YOUR WALLET</div>'
             + '<div class="ton-p">'
             + '<b>Or send it straight from your connected wallet</b> '
             + '\u2014 nothing to copy, the memo is filled in for you.</div>'
             + '<div class="ton-amt">'
             + '<input id="tonui-depamt" class="ton-inp" type="text" '
             + 'inputmode="decimal" placeholder="0.00">'
             + '</div>'
             + '<button class="action-btn ton-w" '
             + 'id="tonui-depbtn" onclick="tonUiDepositaDalWallet()">'
             + '\ud83d\udcb8 SEND FROM MY WALLET</button>'
             + '<div class="ton-note">Your wallet will ask you to confirm. That '
             + 'step cannot be skipped \u2014 it is what keeps your funds '
             + 'yours.</div>'
           : '')
        + '<div class="ton-note">'
        + 'Forgot the memo? Nothing is lost \u2014 it just '
        + 'has to be matched by hand, which takes longer. Contact support '
        + 'with the transaction hash.</div>';
    } else {
      db.innerHTML =
        '<div class="ton-p">'
        + 'Direct TON deposits are not enabled yet. For now you can convert '
        + 'TON into your BTC balance \u2014 it lands on your deposit address '
        + 'automatically.</div>'
        + '<button class="action-btn ton-btn ton-w" '
        + 'onclick="go(\'deposit\');if(typeof tonQuickStart===\'function\')tonQuickStart();">'
        + '\ud83d\udd04 CONVERT TON \u2192 BTC</button>';
    }
  }
  var h = document.getElementById('tonui-hist');
  if(h){
    var rows = s.history || [];
    if(!rows.length){
      h.innerHTML = '<div class="gb-empty">'
        + '<div class="gb-empty__ico">\ud83d\udc8e</div>'
        + '<div class="gb-empty__ttl">No TON withdrawals yet</div>'
        + '<div class="gb-empty__txt">Withdrawals to your connected wallet '
        + 'show up here, newest first.</div></div>';
    } else {
      var out = '';
      for(var i=0;i<rows.length;i++){
        var r = rows[i] || {};
        var d = new Date((parseInt(r.ts||r.timestamp||0,10))*1000);
        out += '<div class="tx-item">'
             + '<div class="tx-info"><div class="tx-type">TON withdrawal</div>'
             + '<div class="tx-time">'
             + tonUiEsc(isNaN(d.getTime())?'':d.toLocaleDateString()) + '</div></div>'
             + '<div class="tx-amt">\u2212' + tonUiFmt(r.amount)
             + ' TON</div></div>';
      }
      h.innerHTML = out;
    }
  }
}
function tonUiCopia(){
  var s = TONUI.st || {};
  if(!s.address) return;
  try{
    if(navigator.clipboard) navigator.clipboard.writeText(s.address);
    if(typeof toast==='function') toast('Address copied','ok');
  }catch(e){}
}
function tonUiDepositaDalWallet(){
  var ui = tonUiApri();
  if(!ui){ tonUiDici('Wallet connection is unavailable right now.'); return; }
  var i = document.getElementById('tonui-depamt');
  var v = i ? String(i.value||'').trim() : '';
  if(!v){ tonUiDici('Enter how much you want to deposit.'); return; }
  var btn = document.getElementById('tonui-depbtn');
  var btnL = btn ? (btn.querySelector('.wn-lab') || btn) : null;
  if(btn){ btn.disabled = true; btnL.textContent = 'Preparo\u2026'; }
  tonUiDici('');
  var _usdt = (typeof wnValCorr === 'function' && wnValCorr() === 'USDT');
  var _prep = null;
  swapApi('/ton/deposit/prepare', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(_usdt ? { amount: v, valuta: 'USDT' } : { amount: v })
  }).then(function(res){
    var d = res.data || {};
    if(!res.ok || !d.ok) throw new Error(d.error || 'could not prepare the transfer');
    if(btn) btnL.textContent = 'Conferma nel wallet\u2026';
    var _msgs;
    if(_usdt){
      if(!d.messages || !d.messages.length) throw new Error('could not prepare the transfer');
      _msgs = [];
      for(var _k = 0; _k < d.messages.length; _k++){
        var _m = d.messages[_k] || {};
        var _o = { address: _m.address, amount: String(_m.amount_nano) };
        if(_m.payload) _o.payload = _m.payload;
        if(_m.state_init) _o.stateInit = _m.state_init;
        _msgs.push(_o);
      }
      _prep = d;
    } else {
      _msgs = [{ address: d.address, amount: d.amount_nano, payload: d.payload }];
    }
    return ui.sendTransaction({
      validUntil: Math.floor(Date.now()/1000) + (d.valid_seconds || 300),
      messages: _msgs
    });
  }).then(function(){
    tonUiDiario('deposito-firmato', _usdt ? 'USDT' : '');
    if(typeof wnDepFirmato==='function'){ try{ wnDepFirmato(v, _usdt ? 'USDT' : 'TON', _prep); }catch(_w){} }
    else if(typeof toast==='function')
      toast('Inviato. Lo accreditiamo in un paio di minuti.','ok');
    if(i) i.value = '';
    return tonUiLoad();
  })['catch'](function(e){
    var m = (e && e.message) ? String(e.message) : 'could not send';
    if(m.indexOf('Reject') !== -1 || m.indexOf('cancel') !== -1 ||
       m.indexOf('declined') !== -1){
      tonUiDiario('deposito-annullato', m);
      tonUiDici('');
    } else {
      tonUiDiario('deposito-fallito', m);
      tonUiDici(m);
    }
  }).then(function(){
    var b = document.getElementById('tonui-depbtn');
    if(b){ b.disabled = false; (b.querySelector('.wn-lab') || b).textContent = 'Conferma nel Wallet'; }
  });
}
function tonUiCopiaDep(quale){
  var dep = (TONUI.st || {}).deposit || {};
  var v = quale === 'memo' ? dep.memo : dep.address;
  if(!v) return;
  try{
    if(navigator.clipboard) navigator.clipboard.writeText(v);
    if(typeof toast==='function')
      toast(quale === 'memo' ? 'Memo copiato' : 'Indirizzo copiato', 'ok');
  }catch(e){}
}
function tonUiMax(){
  var i = document.getElementById('tonui-amt');
  if(!i || !TONUI.st) return;
  i.value = (TONUI.st.saldo_eur!=null)
    ? (+TONUI.st.saldo_eur).toFixed(2)
    : tonUiFmt(TONUI.st.balance);
}
function tonUiCollega(unSolo){
  var ui = tonUiApri();
  if(!ui){ tonUiDici('Wallet connection is unavailable right now.'); return; }
  var btn = document.getElementById('tonui-cbtn');
  if(btn){ btn.disabled = true; (btn.querySelector('.wn-lab') || btn).textContent = 'Collegamento\u2026'; }
  tonUiDici('');
  tonUiSonda();
  tonUiDiario('inizio', '');
  try{ ui.setConnectRequestParameters({ state:'loading' }); }catch(e){}
  var ripristino = Promise.resolve();
  try{
    if(ui.connectionRestored && typeof ui.connectionRestored.then === 'function')
      ripristino = ui.connectionRestored;
  }catch(e){}
  ripristino['catch'](function(){ return null; }).then(function(){
    var gia = false;
    try{ gia = !!(ui.connected || (ui.account && ui.account.address)); }catch(e){}
    if(!gia) return null;
    tonUiDiario('gia-collegato', 'scollego per ottenere una prova nuova');
    var d = null;
    try{ d = ui.disconnect(); }catch(e){}
    if(d && typeof d.then === 'function') return d['catch'](function(){ return null; });
    return null;
  }).then(function(){
    return swapApi('/ton/connect/nonce');
  }).then(function(res){
    if(!res.ok || !res.data || !res.data.nonce) throw new Error('could not get a challenge from the server');
    ui.setConnectRequestParameters({ state:'ready',
      value:{ tonProof: res.data.nonce } });
    tonUiDiario('nonce-ok', '');
    tonUiAttesaApri();
    return tonUiApriModale(ui, true, unSolo || null);
  }).then(function(){
    tonUiDiario('modale-aperta', tonUiAmbiente());
  })['catch'](function(e){
    tonUiAttesaChiudi();
    try{ ui.setConnectRequestParameters(null); }catch(e2){}
    var m = (e && e.message) ? String(e.message) : 'could not open the wallet list';
    tonUiDiario('apertura-fallita', m);
    tonUiDici(m);
    tonUiSbloccaBtn();
  });
}
function tonUiScollega(){
  var ui = tonUiApri();
  tonUiAttesaChiudi();
  try{ if(ui) ui.disconnect(); }catch(e){}
  tonUiDici('');
  if(typeof toast==='function')
    toast('Scollegato. Il tuo saldo e il tuo wallet restano come sono.','ok');
  try{ tonUiDisegna(); }catch(e){}
}
(function(){
  function riprendi(){
    if(!tonUiAttesaViva()) return;
    tonUiDiario('ripresa', 'tentativo in sospeso');
    var ui = tonUiApri();
    if(!ui){ tonUiAttesaChiudi(); return; }
    try{
      if(typeof ui.connectionRestored === 'object' && ui.connectionRestored &&
         typeof ui.connectionRestored.then === 'function'){
        ui.connectionRestored.then(function(ok){
          tonUiDiario('ripresa-esito', ok ? 'connessione ripristinata'
                                          : 'nessuna connessione da ripristinare');
        })['catch'](function(){});
      }
    }catch(e){}
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', riprendi);
  } else {
    setTimeout(riprendi, 0);
  }
})();
function tonUiPreleva(){
  if(TONUI.busy) return;
  var _usdt = !!(window.WN && WN.wdVal === 'USDT');
  var i = document.getElementById('tonui-amt');
  var v = i ? String(i.value||'').trim() : '';
  if(!v){ if(typeof toast==='function') toast('Scrivi quanto vuoi prelevare.','err'); return; }
  var btn = document.getElementById('tonui-wdbtn');
  var btnL = btn ? (btn.querySelector('.wn-lab') || btn) : null;
  var btnT = btnL ? btnL.textContent : '';
  TONUI.busy = true;
  if(btn){ btn.disabled = true; btnL.textContent = 'Invio\u2026'; }
  var _wb = { amount: v };
  var _wf = parseFloat(String(v).replace(',', '.'));
  if(TONUI.st && TONUI.st.saldo_cent!=null && isFinite(_wf) && _wf>0 &&
     !/^(all|max|tutto)$/i.test(String(v).trim())){
    _wb.cent = Math.round(_wf*100);
  }
  if(_usdt){
    if(!(isFinite(_wf) && _wf > 0)){
      TONUI.busy = false;
      if(btn){ btn.disabled=false; btnL.textContent=btnT; }
      if(typeof wnWdErr==='function') wnWdErr('Scrivi quanto vuoi prelevare.');
      return;
    }
    _wb = { cent: Math.round(_wf*100), valuta: 'USDT' };
  }
  swapApi('/ton/withdraw', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(_wb)
  }).then(function(res){
    TONUI.busy = false;
    var d = res.data || {};
    if(!res.ok || !d.ok){
      var TON_ERR = {
        saldo:       'Non ci sono abbastanza euro disponibili per questo importo.',
        gia_uno:     'Hai gi\u00e0 un prelievo TON in corso.',
        sospesi:     'I prelievi TON sono in pausa: prima va chiarito un pagamento. Non si perde niente.',
        sconosciuto: 'Conto non trovato.',
        inesistente: 'Questa richiesta non esiste pi\u00f9.'
      };
      if(_usdt){
        TON_ERR.gia_uno  = 'Hai gi\u00e0 un prelievo USDT in corso.';
        TON_ERR.sospesi  = 'I prelievi USDT sono in pausa: prima va chiarito un pagamento. Non si perde niente.';
        TON_ERR.capienza = 'La cassa USDT non basta adesso: riprova pi\u00f9 tardi o preleva un importo pi\u00f9 piccolo.';
      }
      var msg = TON_ERR[d.error_code]
        || (d.error && typeof wnErrIt==='function' ? wnErrIt(d.error) : d.error)
        || 'Prelievo rifiutato';
      if(typeof wnWdErr==='function') wnWdErr(msg);
      else if(typeof toast==='function') toast(msg,'err');
      if(btn){ btn.disabled=false; btnL.textContent=btnT; }
      return;
    }
    if(typeof wnWdOk==='function'){
      try{ wnWdOk(d, _usdt ? 'USDT' : 'TON'); }catch(_w){}
      if(btn){ btn.disabled=false; btnL.textContent=btnT; }
      return tonUiLoad();
    }
    if(typeof toast==='function')
      toast(d.queue_paused
        ? 'Requested. The TON queue is paused while we clear an earlier payment: yours leaves as soon as it restarts, and you can cancel until then.'
        : (d.needs_approval
          ? 'Richiesto. Parte appena un operatore lo approva.'
          : 'Richiesto. Parte entro un minuto.'), 'ok');
    return tonUiLoad();
  }).catch(function(){
    TONUI.busy = false;
    if(typeof wnWdErr==='function') wnWdErr('Rete non disponibile');
    else if(typeof toast==='function') toast('Rete non disponibile','err');
    if(btn){ btn.disabled=false; btnL.textContent=btnT; }
  });
}
