(function(){
  'use strict';
  if (window.XGB || typeof window.gembApri !== 'function') return;
  var XGB = window.XGB = { on: true, passa: false, da: 'duel', modo: 'duello', posta: 'gratis', guida: null, ultimo: null, aperte: 0 };
  var D = document;
  function L(it, en){ return (window.GB_LANG === 'en') ? en : it; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function fx(n){ try { if (window.GBX && GBX.fx) GBX.fx(n); } catch(e){} }
  function sfx(n, h){ try { if (window.GBX) { if (GBX.sfx) GBX.sfx(n); if (h && GBX.hap) GBX.hap(h); } } catch(e){} }
  function avviso(it, en){ try { toast(L(it, en), 'err', 2600); } catch(e){} }
  try { if (window.XCL && XCL.ids) XCL.ids.gembrawl = 1; } catch(e){}
  var MODI = [
    { k:'duello', it:'Duello',        en:'Duel',     sit:'Uno contro uno. Chi arriva per primo a 3 KO vince.',                          sen:'One on one. First to 3 KOs wins.', n:2 },
    { k:'sopr',   it:'Sopravvivenza', en:'Survival', sit:'Sei in sei, ognuno per sé. Il gas stringe l’arena: resta in piedi per ultimo.', sen:'Six players, every one for themselves. The gas closes in: be the last one standing.', n:6 },
    { k:'gemme',  it:'3 contro 3',    en:'3 vs 3',   sit:'Arraffa gemme: la squadra che ne tiene 10 per 15 secondi vince.',               sen:'Gem Rush: the team that holds 10 gems for 15 seconds wins.', n:6 }
  ];
  function modo(k){ for (var i = 0; i < MODI.length; i++) if (MODI[i].k === k) return MODI[i]; return MODI[0]; }
  var SVG = {
    mira:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9"/>',
    stella:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    gemma:'<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5"/>',
    foglia:'<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="M5 19 13 11"/>',
    coppa:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11M12 14v4M8.5 20.5h7"/>',
    persone:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.8-3.3 3.2-5 6-5s5.2 1.7 6 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.5 14.6c2.3.2 3.9 1.7 4.5 4.4"/>',
    fulmine:'<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
    joystick:'<rect x="3" y="13.5" width="18" height="7" rx="3"/><path d="M12 13.5V8.5"/><circle cx="12" cy="6" r="2.5"/>',
    cassa:'<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    tempo:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
    libro:'<path d="M4 5.5c3-1.3 5.7-1.3 8 .5 2.3-1.8 5-1.8 8-.5v13c-3-1.3-5.7-1.3-8 .5-2.3-1.8-5-1.8-8-.5z"/><path d="M12 6v13"/>',
    robot:'<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4.5M9.5 13h.01M14.5 13h.01M9.5 16h5"/>'
  };
  function ic(k, liscia){ return '<span class="xa-ri' + (liscia ? ' xa-ri--l' : '') + '" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true">' + (SVG[k] || SVG.stella) + '</svg></span>'; }
  function riga(k, t, s){ return '<div class="xa-ap-r">' + ic(k) + '<span class="xa-ap-rt"><b>' + esc(t) + '</b><span>' + esc(s) + '</span></span></div>'; }
  function regoleBrevi(){
    return [
      ['joystick', L('Muoviti, mira, spara', 'Move, aim, shoot'), L('Levetta a sinistra per muoverti, mira e spara a destra. Su PC: WASD e mouse.', 'Left stick to move, aim and shoot on the right. On PC: WASD and mouse.')],
      ['fulmine', L('Super e gadget', 'Super and gadget'), L('Ogni colpo a segno carica la super, diversa per ogni eroe. Il gadget è il suo trucco in più.', 'Every hit charges your super, different for every hero. The gadget is their extra trick.')],
      ['foglia', L('Cespugli', 'Bushes'), L('Nei cespugli non ti vedono finché non attacchi o non ti arrivano vicino.', 'In the bushes nobody sees you until you attack or they get close.')],
      ['gemma', L('Tre modi', 'Three modes'), L('Duello a 3 KO, Sopravvivenza in sei col gas, Arraffa gemme 3 contro 3.', 'Duel to 3 KOs, six-player Survival with the gas, Gem Rush 3 vs 3.')]
    ];
  }
  function regoleTutte(){
    var en = window.GB_LANG === 'en';
    var partita = [
      ['joystick', L('I comandi', 'The controls'), L('Telefono: levetta a sinistra, mira e spara a destra · PC: WASD + mouse, E super, Q gadget, Esc pausa · Gamepad: levette, RT spara, Y/LT super, LB gadget', 'Phone: left stick, aim and shoot on the right · PC: WASD + mouse, E super, Q gadget, Esc pause · Gamepad: sticks, RT shoot, Y/LT super, LB gadget')],
      ['fulmine', L('La super', 'The super'), L('Si carica colpendo: quando è piena il tasto si accende. Ogni eroe ha la sua (pizza gigante, carica dietro lo scudo, giardino di rovi...)', 'It charges as you hit: when it is full the button lights up. Every hero has their own (giant pizza, shield charge, bramble garden...)')],
      ['stella', L('Il gadget', 'The gadget'), L('Il trucco in più di ogni eroe, col suo tempo di ricarica', 'Every hero’s extra trick, with its own cooldown')],
      ['foglia', L('Cespugli', 'Bushes'), L('Dentro un cespuglio sei nascosto: ti vedono solo se attacchi o se ti arrivano vicino', 'Inside a bush you are hidden: they only see you if you attack or get close')],
      ['cassa', L('Casse e cubi', 'Crates and cubes'), L('In Sopravvivenza le casse rotte e chi va KO lasciano cubi che ti rendono più forte', 'In Survival broken crates and knocked-out players drop cubes that power you up')],
      ['persone', L('15 eroi', '15 heroes'), L('Ognuno con attacco, super, gadget e passiva suoi: li trovi in Eroi e in Abilità', 'Each with their own attack, super, gadget and passive: see Heroes and Abilities')]
    ];
    var modi = [
      ['coppa', L('Duello', 'Duel'), L('Uno contro uno. Chi arriva per primo a 3 KO vince. A tempo scaduto in parità: supplementari, il prossimo KO decide.', 'One on one. First to 3 KOs wins. Tied at the buzzer: overtime, next KO decides.')],
      ['tempo', L('Sopravvivenza', 'Survival'), L('Sei in sei, ognuno per sé, nessuna rinascita. Il gas stringe l’arena: resta in piedi per ultimo.', 'Six players, every one for themselves, no respawns. The gas closes in on the arena: be the last one standing.')],
      ['gemma', L('Arraffa gemme · 3 contro 3', 'Gem Rush · 3 vs 3'), L('Le gemme escono dal centro. La squadra che ne tiene 10 o più per 15 secondi vince. Se vai KO le perdi tutte.', 'Gems spawn in the middle. Hold 10 or more for 15 seconds to win. Get knocked out and you drop them all.')],
      ['robot', L('Allenamento', 'Training'), L('Contro i bot, offline, quando vuoi: scegli modo e bravura dei bot', 'Against bots, offline, any time: pick the mode and the bots’ skill')]
    ];
    var note = [
      L('Gratis: partite online vere contro persone, senza posta. Il risultato lo verifica il server.', 'Free: real online matches against people, no stake. The server verifies the result.'),
      L('A soldi: presto. Si giocherà con posta, piatto al vincitore meno il 5%, solo dai 18 anni.', 'For money: soon. Stakes, the pot to the winner minus 5%, 18+ only.'),
      L('Tornei: Duello a eliminazione, dalla tab TORNEI.', 'Tournaments: knockout duels, from the TOURNAMENTS tab.')
    ];
    return { partita: partita, modi: modi, note: note, en: en };
  }
  function occupato(){
    try {
      if (typeof RTD !== 'undefined' && (RTD.ui === 'match' || RTD.ui === 'search')) return true;
      if (typeof GEMB !== 'undefined' && GEMB.aperto) return true;
      if (typeof HPCOP !== 'undefined' && HPCOP.aperto) return true;
    } catch(e){ return true; }
    return false;
  }
  function discord(){ try { return (typeof gembDiscord === 'function') ? gembDiscord() : false; } catch(e){ return true; } }
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){} return null; }
  var scr = null, body = null;
  function schermata(){
    if (scr && scr.isConnected) return scr;
    scr = D.createElement('div');
    scr.id = 'xgb'; scr.className = 'screen xa-fr xa-ap-scr xgb-scr';
    scr.innerHTML = '<div class="game-hdr"><button class="back-btn" type="button" aria-label="Indietro">←</button><div class="game-title">GEM BRAWL</div><div class="game-bal" id="xgb-bal">€0.00</div></div>' +
      '<div class="game-content xa-ap-on" id="xgb-body"></div>';
    var arc = D.getElementById('arc');
    if (arc && arc.parentNode) arc.parentNode.insertBefore(scr, arc.nextSibling); else D.body.appendChild(scr);
    body = scr.querySelector('#xgb-body');
    scr.querySelector('.back-btn').addEventListener('click', indietro);
    clonaCss();
    try { new MutationObserver(saldoTesta).observe(D.getElementById('arc-bal'), { childList:true, characterData:true, subtree:true }); } catch(e){}
    return scr;
  }
  function saldoTesta(){ var a = D.getElementById('arc-bal'), b = D.getElementById('xgb-bal'); if (a && b && b.textContent !== a.textContent) b.textContent = a.textContent; }
  function indietro(){
    fx('back');
    var d = XGB.da; if (!d || d === 'xgb' || d === 'arc' || !D.getElementById(d)) d = 'duel';
    go(d);
  }
  var RE_IS = /:is\(\s*#arc\s*,[^)]*\)/g;
  function pezzi(sel){
    var out = [], d = 0, s = 0;
    for (var i = 0; i < sel.length; i++) { var c = sel.charAt(i); if (c === '(') d++; else if (c === ')') d--; else if (c === ',' && !d) { out.push(sel.slice(s, i)); s = i + 1; } }
    out.push(sel.slice(s)); return out;
  }
  function clonaCss(){
    if (D.getElementById('xgb-clone')) return;
    var testo = [];
    var giro = function(rules, dentro){
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.type === 1 && r.selectorText && r.selectorText.indexOf('#arc') >= 0 && /xa-fr|xa-ap-scr/.test(r.selectorText)) {
          var nuovi = pezzi(r.selectorText).filter(function(p){ RE_IS.lastIndex = 0; return RE_IS.test(p) && /xa-fr|xa-ap-scr/.test(p); })
            .map(function(p){ RE_IS.lastIndex = 0; return p.replace(RE_IS, '#xgb').trim(); });
          if (nuovi.length) testo.push((dentro ? dentro + '{' : '') + nuovi.join(',') + '{' + r.style.cssText + '}' + (dentro ? '}' : ''));
        } else if (r.type === 4 && r.cssRules) giro(r.cssRules, '@media ' + r.media.mediaText);
      }
    };
    var ss = D.styleSheets;
    for (var i = 0; i < ss.length; i++) { var n = ss[i].ownerNode; if (!n || n.id !== 'gbx-css') continue; try { giro(ss[i].cssRules, ''); } catch(e){} }
    var st = D.createElement('style'); st.id = 'xgb-clone'; st.textContent = testo.join('\n');
    D.head.appendChild(st);
    XGB.regoleCopiate = testo.length;
  }
  function disegna(){
    schermata(); saldoTesta();
    var m = modo(XGB.modo), en = window.GB_LANG === 'en';
    var meta = '<span>~3 min</span><span>' + L('2–6 giocatori', '2–6 players') + '</span><span>' + L('15 eroi', '15 heroes') + '</span>';
    var h = '';
    h += '<div class="xa-ap-ban" aria-hidden="true"><img class="xa-ap-bi" src="gbx_pv_gembrawl.webp" alt=""><img class="xa-ap-bb" src="gbx_bn_gembrawl.webp" alt="" decoding="async"></div>';
    h += '<div class="xa-ap-hd"><span class="xa-ap-ic"><img src="gbx_pv_gembrawl.webp" alt="" width="64" height="64" decoding="async"></span><div class="xa-ap-ht"><h1>GEM BRAWL</h1><p>' +
      L('Rissa a squadre: gemme, super e cespugli', 'Team brawler: gems, supers and bushes') + '</p><small class="xa-ap-meta">' + meta + '</small></div></div>';
    h += '<h2 class="xa-ap-sez">' + L('Modalità', 'Mode') + '</h2><div class="xa-ap-seg xgb-modi" role="radiogroup">' +
      MODI.map(function(x){ var s = x.k === m.k; return '<button type="button" data-xgb-modo="' + x.k + '" class="' + (s ? 'sel' : '') + '" role="radio" aria-checked="' + s + '">' + esc(en ? x.en : x.it) + '</button>'; }).join('') + '</div>';
    h += '<p class="xa-ap-info xgb-modo-s">' + esc(en ? m.sen : m.sit) + '</p>';
    h += '<h2 class="xa-ap-sez">' + L('Come si gioca', 'How to play') + '</h2><div class="xa-ap-grp">';
    regoleBrevi().forEach(function(r){ h += riga(r[0], r[1], r[2]); });
    h += '<button type="button" class="xa-ap-r xa-ap-more" data-xgb="regole">' + ic('libro', 1) + '<span class="xa-ap-rt"><b>' + L('Regole complete', 'Full rules') + '</b></span></button></div>';
    h += '<div class="xa-ap-grp xa-ap-grp2">' +
      '<button type="button" class="xa-ap-r xa-ap-more" data-xgb="eroi">' + ic('persone', 1) + '<span class="xa-ap-rt"><b>' + L('Eroi', 'Heroes') + '</b><span>' + L('Scegli il tuo tra 15 eroi', 'Pick yours among 15 heroes') + '</span></span></button>' +
      '<button type="button" class="xa-ap-r xa-ap-more" data-xgb="abil">' + ic('fulmine', 1) + '<span class="xa-ap-rt"><b>' + L('Abilità', 'Abilities') + '</b><span>' + L('Attacco, super, gadget e passiva, con le clip', 'Attack, super, gadget and passive, with clips') + '</span></span></button>' +
      '<button type="button" class="xa-ap-r xa-ap-more" data-xgb="bot">' + ic('robot', 1) + '<span class="xa-ap-rt"><b>' + L('Allenamento', 'Training') + '</b><span>' + L('Contro i bot · gratis · offline', 'Against bots · free · offline') + '</span></span></button>' +
      '<button type="button" class="xa-ap-r xa-ap-more" data-xgb="tornei">' + ic('coppa', 1) + '<span class="xa-ap-rt"><b>' + L('Tornei', 'Tournaments') + '</b><span>' + L('Duello a eliminazione: iscriviti e guarda le dirette', 'Knockout duels: sign up and watch live') + '</span></span></button></div>';
    var gr = XGB.posta === 'gratis';
    h += '<h2 class="xa-ap-sez">' + L('Posta', 'Stake') + '</h2><div class="xa-ap-fi">' +
      '<button type="button" class="xa-fi xa-fi--g' + (gr ? ' sel' : '') + '" data-xgb-posta="gratis">' + L('Gratis', 'Free') + '</button>' +
      '<button type="button" class="xa-fi xa-fi--g xgb-presto" data-xgb-posta="soldi" aria-disabled="true">' + L('A soldi', 'For money') + '<small>' + L('presto', 'soon') + '</small></button></div>';
    h += '<p class="xa-ap-info">' + L('Online gratis · ', 'Online for free · ') + esc(en ? m.en : m.it) + L(' · contro persone vere', ' · against real people') + '</p>';
    h += '<p class="xa-ap-nota">' + L('Le partite a soldi arrivano presto: posta, piatto al vincitore meno il 5%, solo dai 18 anni.', 'Money matches are coming soon: stakes, the pot to the winner minus 5%, 18+ only.') + '</p>';
    h += '<div class="xa-ap-bar"><button type="button" class="xa-ap-go" data-xgb="gioca">' + L('Gioca gratis', 'Play for free') + '</button>' +
      '<div class="xa-ap-sec"><button type="button" data-xgb="bot">' + L('Allenati coi bot', 'Practice with bots') + '</button><button type="button" data-xgb="eroi">' + L('Scegli l’eroe', 'Pick a hero') + '</button></div></div>';
    var ap = D.createElement('div'); ap.className = 'xa-ap xgb-ap'; ap.innerHTML = h;
    var bb = ap.querySelector('.xa-ap-bb'), ban = ap.querySelector('.xa-ap-ban'), ok = (window.XA && XA.img) ? XA.img['gbx_bn_gembrawl.webp'] : null;
    if (ok === true) ban.classList.add('xa-ap-ban--ok');
    bb.addEventListener('load', function(){ try { XA.img['gbx_bn_gembrawl.webp'] = true; } catch(e){} ban.classList.add('xa-ap-ban--ok'); }, { once:true });
    bb.addEventListener('error', function(){ bb.remove(); }, { once:true });
    ap.addEventListener('click', clic);
    var vec = body.querySelector(':scope > .xa-ap'), st = body.scrollTop;
    if (vec) vec.replaceWith(ap); else body.appendChild(ap);
    body.scrollTop = st;
    XGB.ultimo = { modo: m.k, posta: XGB.posta };
  }
  function apri(da){
    XGB.da = da || 'duel';
    var mm = ls('gb_mg_modo'); if (mm && modo(mm).k === mm) XGB.modo = mm;
    XGB.posta = 'gratis';
    disegna();
    if (body) body.scrollTop = 0;
    XGB.aperte++;
  }
  XGB.apri = function(da){ schermata(); apri(da || (typeof CUR !== 'undefined' ? CUR : 'duel')); go('xgb'); };
  XGB.allena = function(){ nelGioco('bot', ['modo', 'allena']); };
  var gembVero = window.gembApri;
  function apriGioco(){
    XGB.passa = true;
    var ok = false;
    try { ok = !!gembVero(); } finally { XGB.passa = false; }
    return ok;
  }
  window.gembApri = function(){
    if (XGB.on && !XGB.passa && !discord() && !occupato()) {
      try { XGB.apri(typeof CUR !== 'undefined' ? CUR : 'duel'); return true; }
      catch(err){ try { console.warn('XGB', err); } catch(_){} }
    }
    return gembVero.apply(this, arguments);
  };
  function clic(e){
    var t = e.target.closest('[data-xgb], [data-xgb-modo], [data-xgb-posta]'); if (!t) return;
    var mo = t.getAttribute('data-xgb-modo'), po = t.getAttribute('data-xgb-posta'), a = t.getAttribute('data-xgb');
    if (mo) { if (mo !== XGB.modo) { XGB.modo = mo; ls('gb_mg_modo', mo); sfx('tick', 'sel'); disegna(); } return; }
    if (po) {
      if (po === 'soldi') { sfx('soft'); avviso('Le partite a soldi di Gem Brawl arrivano presto.', 'Gem Brawl money matches are coming soon.'); return; }
      return;
    }
    if (a === 'regole') { regolePagina(); return; }
    if (a === 'tornei') { fx('open'); try { window.gembTornei(''); } catch(e2){} return; }
    if (a === 'gioca') { nelGioco(XGB.modo, ['modo', 'cerca']); return; }
    if (a === 'bot') { nelGioco('bot', ['modo', 'allena']); return; }
    if (a === 'eroi') { nelGioco(null, ['eroe']); return; }
    if (a === 'abil') { nelGioco(null, ['abil']); return; }
  }
  function nelGioco(m, passi){
    if (occupato()) { avviso('Sei già a un tavolo o in coda.', 'You are already at a table or in the queue.'); return; }
    if (m) ls('gb_mg_modo', m);
    XGB.dest = m || XGB.modo;
    fx('open');
    if (!apriGioco()) { avviso('Gem Brawl non si è aperto: riprova.', 'Gem Brawl did not open: try again.'); return; }
    guida(passi);
  }
  function docGioco(){ try { return GEMB.fr && GEMB.fr.contentDocument; } catch(e){ return null; } }
  function menuPronto(d){ try { var s = d && d.getElementById('s-gb'); return !!(s && s.classList.contains('on') && d.defaultView.__menuGB); } catch(e){ return false; } }
  var SEL = {
    modo:  function(){ return '#s-gb .gbm-modo[data-id="' + XGB.dest + '"]'; },
    cerca: function(){ return '#s-gb .gbm-pannello > .gbm-via'; },
    allena:function(){ return '#s-gb .gbm-bot .gbm-via'; },
    eroe:  function(){ return '#s-gb [data-x="eroe"]'; },
    abil:  function(){ return '#s-gb [data-x="abil"]'; }
  };
  function guida(passi){
    var giro = XGB.guida = { passi: passi.slice(), i: 0, t0: Date.now(), fatto: [], fine: '' };
    var tic = function(){
      if (XGB.guida !== giro) return;
      if (typeof GEMB === 'undefined' || !GEMB.aperto) { giro.fine = 'chiuso'; return; }
      if (Date.now() - giro.t0 > 45000) { giro.fine = 'tempo'; return; }
      var d = docGioco();
      if (!menuPronto(d)) { setTimeout(tic, 150); return; }
      var k = giro.passi[giro.i];
      if (!k) { giro.fine = 'ok'; return; }
      var el = d.querySelector(SEL[k]());
      if (el) {
        if (!(k === 'modo' && el.classList.contains('on'))) { try { el.click(); } catch(e){} }
        giro.fatto.push(k); giro.i++;
        if (giro.i >= giro.passi.length) { giro.fine = 'ok'; return; }
        setTimeout(tic, 120); return;
      }
      setTimeout(tic, 150);
    };
    setTimeout(tic, 80);
  }
  function regolePagina(){
    var R = regoleTutte();
    var grp = function(rr){ return '<div class="xa-ap-grp">' + rr.map(function(r){ return riga(r[0], r[1], r[2]); }).join('') + '</div>'; };
    var o = D.createElement('div'); o.className = 'xa-sheet xgb-regole';
    o.innerHTML = '<div class="xa-sheet-p" role="dialog" aria-modal="true"><div class="xa-sheet-h"><b>GEM BRAWL</b><button type="button" class="xa-sheet-x">' + L('Fine', 'Done') + '</button></div>' +
      '<div class="xa-sheet-c">' + grp(R.partita) +
      '<h2 class="xa-ap-sez">' + L('Modalità', 'Modes') + '</h2>' + grp(R.modi) +
      '<div class="xa-sheet-n">' + R.note.map(function(n){ return '<p>' + esc(n) + '</p>'; }).join('') + '</div></div></div>';
    var chiudi = function(){ o.classList.remove('on'); setTimeout(function(){ o.remove(); }, 260); fx('back'); };
    o.addEventListener('click', function(e){ if (e.target === o || e.target.closest('.xa-sheet-x')) chiudi(); });
    D.body.appendChild(o); requestAnimationFrame(function(){ o.classList.add('on'); });
    fx('open');
  }
})();
