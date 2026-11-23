// GEM BRAWL — MENU PRINCIPALE (24/11 notte, rifatto su richiesta del proprietario: «come la home dei test sul PC», niente vuoti,
// l'ULTIMO PERSONAGGIO GIOCATO al centro con le animazioni della lobby). Stile e pezzi della home classica (#s-home): fondo
// lob-sfondo, fasci, bagliore, pedana, card delle modalita' con l'arte, tasti icona3d, tasto «gioca».
//   verticale: testa (indietro, logo, saldo) · EROE GRANDE al centro con la clip · le modalita' · Gratis | A soldi · il tasto;
//   orizzontale e PC: l'eroe a sinistra, tutto il resto a destra. Zone sicure e notch (env(safe-area-*)).
// L'eroe: localStorage gb_eroe (o quello del gioco); clip della lobby (menu_video/<id>/v3/final, «_m» sul telefono) con ClipAlfa:
// UNA sola clip attiva, liberata quando si esce dal menu; se la clip non arriva in 1,2 s resta l'arte 2D approvata.
// Funzioni: modalita' (Duello, Sopravvivenza, Arraffa gemme / Gem Rush), Tornei «presto», GRATIS | A SOLDI (a soldi spento «presto»
// finche' il server non lo apre; primo tocco = conferma 18+), posta 0,50-50 €, saldo, Tutorial (aggancio GB_MENU.onTutorial per
// ui/tutorial.js), Allenamento (= il gioco di oggi contro i bot), Eroi, Abilita', indietro. Acceso di serie; ?menu=0 = pagina di ieri.
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  if (Q.get('menu') === '0' || Q.get('rete') === '0' || !window.__brawl) return;
  var B = window.__brawl, S = window.Suoni || null, L0 = window.__brawlLobby, CA = window.ClipAlfa;
  window.__menuGB = true;
  // nomi di prima (.gbm-modo, .gbm-pannello > .gbm-via, .gbm-bot .gbm-via, [data-x="eroe"], [data-x="abil"]) tenuti come sinonimi:
  // il pre-menu della mini app (vetrina_gembrawl_2411, gembrawl-scheda-2411.js) preme questi tasti dentro l'iframe
  var GB_MENU = window.GB_MENU = window.GB_MENU || { onTutorial: null };   // ui/tutorial.js mette qui la sua funzione
  var EN = (document.documentElement.lang || 'it').slice(0, 2) === 'en';
  function L(it, en) { return EN ? en : it; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function suono(n) { try { if (S && S[n]) S[n](); } catch (e) { } }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var TEL = Math.min(screen.width || 9999, screen.height || 9999) < 600 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
  var FASCE = ['0.5', '1', '2', '5', '10', '20', '50'], TINTA = ['#9aa3b5', '#ffffff', '#ff4d5e', '#3fb3ff', '#5cff8a', '#ff2bd6', '#ffd23b'];
  function eur(v) { v = Math.round(+v * 100) / 100; var t = Math.floor(v) === v ? String(v) : v.toFixed(2); return (EN ? t : t.replace('.', ',')) + ' €'; }
  var CAST = (window.CAST_UI && window.CAST_UI.E) || {};
  function nomeEroe(id) { var c = CAST[id]; return (c && ((EN && c.nome_en) || c.nome)) || id; }
  function colEroe(id) { var c = CAST[id]; return (c && c.col) || '#ff2bd6'; }
  var CARTE = { dama: 1, asso: 1, regina: 1, fante: 1 };
  function arte2d(id) { return 'menu_video/arte2d/' + id + '.webp' + (CARTE[id] ? '?v=vc2311d' : '?v=vs2211'); }
  var MODI = [
    { id: 'duello', n: 2, t: L('Duello', 'Duel'), s: L('1 contro 1', '1 vs 1'), tag: '1v1', arte: 'ui/modo_duello.webp?v=c2211', k: '#ff6a12' },
    { id: 'sopr', n: 6, t: L('Sopravvivenza', 'Survival'), s: L('6 giocatori', '6 players'), tag: '×6', arte: 'ui/modo_sopr.webp?v=c2211', k: '#3bff8b' },
    { id: 'gemme', n: 6, t: L('Arraffa gemme', 'Gem Rush'), s: L('3 contro 3', '3 vs 3'), tag: '3v3', arte: 'ui/modo_gemme.webp?v=c2211', k: '#b44dff' }
  ];
  var stato = { modo: ls('gb_mg_modo') || 'duello', soldi: false, posta: ls('gb_mg_posta') || '1' };
  if (!MODI.some(function (m) { return m.id === stato.modo; })) stato.modo = 'duello';
  if (FASCE.indexOf(stato.posta) < 0) stato.posta = '1';
  function soldiAperti() { var c = window.__reteUI && window.__reteUI.cli; return !!(c && c.info && c.info.soldi); }   // interruttore del server: oggi spento
  function saldo() {
    var q = Q.get('saldo'); if (q != null && q !== '') return +q;
    try { var P0 = window.parent; if (P0 !== window && P0.S && typeof P0.S.cent === 'number' && isFinite(P0.S.cent)) return P0.S.cent / 100; } catch (e) { }   // la mini app (stessa origine)
    return null;
  }
  function eroeId() { var e = ls('gb_eroe') || (L0 && L0.eroe ? L0.eroe() : ''); var ok = L0 && L0.giocabili ? L0.giocabili() : []; return ok.indexOf(e) >= 0 ? e : (ok[0] || 'samurai'); }
  var IC_IND = '<svg viewBox="0 0 24 24"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_TUT = '<svg viewBox="0 0 24 24" class="gm-svg"><path d="M12 3 2 8l10 5 8-4v6h2V8L12 3Zm-6 9.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8l-6 3-6-3Z" fill="currentColor"/></svg>';
  var IC_BOT = '<svg viewBox="0 0 24 24" class="gm-svg"><path d="M11 2h2v3h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h4V2Zm-2 8.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Zm6 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2ZM8 21h8v1H8z" fill="currentColor"/></svg>';
  var IC_ABIL = '<svg viewBox="0 0 24 24" class="gm-svg"><path d="M14 1 4 14h7l-2 9 10-13h-7l2-9Z" fill="currentColor"/></svg>';
  // GBT2311: IN DIRETTA (occhio con il punto rosso) e condividi
  var IC_LIVE = '<svg viewBox="0 0 24 24" class="gm-svg"><path d="M12 5C6.5 5 2.7 9.3 1.5 12c1.2 2.7 5 7 10.5 7s9.3-4.3 10.5-7C21.3 9.3 17.5 5 12 5Zm0 11.2A4.2 4.2 0 1 1 12 7.8a4.2 4.2 0 0 1 0 8.4Zm0-6.4a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Z" fill="currentColor"/></svg>';
  var IC_COND = '<svg viewBox="0 0 24 24"><path d="M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.2c.5.5 1.2.8 2 .8a3 3 0 1 0-3-3c0 .2 0 .5.1.7L8 9.8A3 3 0 1 0 8 14.2l7.1 4.2c-.1.2-.1.4-.1.6a3 3 0 1 0 3-2.9Z" fill="currentColor"/></svg>';

  // ---------------- la schermata ----------------
  var sc = el('section', 'schermo gm'); sc.id = 's-gb'; sc.dataset.indietro = 's-home'; sc.dataset.musica = 'menu';
  sc.innerHTML =
    '<div class="lob-sfondo"></div><div class="lob-fasci"><i></i><i></i><i></i></div><div class="lob-bagliore gm-bagl"></div>' +
    '<div class="gm-lay">' +
    '  <header class="gm-testa"><button class="indietro gm-ind" aria-label="' + L('Indietro', 'Back') + '">' + IC_IND + '</button>' +
    '    <img class="logo-img gm-logo" alt="Gem Brawl" draggable="false">' +
    '    <div class="ris gm-saldo"><img src="ui/fiche_gb.webp" alt=""><b></b></div></header>' +
    '  <div class="gm-palco">' +
    '    <button class="gm-eroe" aria-label="' + L('Eroe', 'Hero') + '"><div class="gm-alone"></div><div class="pedana"></div><img class="gm-arte" alt="" draggable="false"><div class="gm-clip"></div></button>' +
    '    <div class="targa gm-targa"><span class="cl-ico gm-cl"></span><b class="gm-nome"></b><span class="ruolo gm-ruolo"></span></div>' +
    '    <nav class="gm-lato gm-sx"><button class="icona3d" data-x="eroe" style="--k:#ff2bd6"><img src="ui/ico_eroi.webp?v=c2211" alt=""><span>' + L('Eroi', 'Heroes') + '</span></button>' +
    '      <button class="icona3d gm-ico" data-x="abil" style="--k:#1ad7ff">' + IC_ABIL + '<span>' + L('Abilità', 'Abilities') + '</span></button></nav>' +
    '    <nav class="gm-lato gm-dx"><button class="icona3d gm-ico" data-x="tut" style="--k:#ffd23b">' + IC_TUT + '<span>Tutorial</span></button>' +
    '      <button class="icona3d gm-ico gbm-bot gbm-modo on" data-id="bot" data-x="bot" style="--k:#3bff8b">' + IC_BOT + '<span class="gbm-via">' + L('Allenamento', 'Training') + '</span></button>' +
    '      <button class="icona3d gm-ico gm-live" data-x="live" style="--k:#ff3b5c">' + IC_LIVE + '<span>' + L('In diretta', 'Live') + '</span><em class="gm-live-n" hidden></em></button></nav>' +
    '  </div>' +
    '  <div class="gm-destra">' +
    '    <div class="gm-modi"></div>' +
    '    <div class="gm-soldi"></div>' +
    '    <div class="gm-piede gbm-pannello"><button class="gioca grande gm-via gbm-via"><span class="luce"></span><span class="lampo"></span><span class="g-l"></span><small></small></button></div>' +
    '  </div>' +
    '</div>';
  document.body.appendChild(sc);
  var Q$ = function (s) { return sc.querySelector(s); };
  var modiEl = Q$('.gm-modi'), soldiEl = Q$('.gm-soldi'), via = Q$('.gm-via');
  try { Q$('.gm-logo').src = (document.querySelector('.lob-logo.logo-img') || {}).src || ''; } catch (e) { }
  Q$('.gm-ind').onclick = function () { suono('indietro'); B.ui.vai('s-home', -1); };
  sc.querySelector('[data-x="eroe"]').onclick = function () { suono('passa'); B.ui.vai('s-eroi', 1); };
  sc.querySelector('[data-x="abil"]').onclick = function () { suono('passa'); try { B.ui.scheda(eroeId(), true); } catch (e) { } B.ui.vai('s-scheda', 1); };   // la scheda dell'eroe del menu
  var botEl = sc.querySelector('[data-x="bot"]');
  botEl.onclick = function () { if (window.GBTUT && GBTUT.proponi && GBTUT.proponi(function () { botEl.onclick(); })) return; suono('tasto'); B.ui.vai('s-home', 1); };   // Allenamento: la lobby di oggi contro i bot (al primo Gioca si propone il tutorial, una volta)
  sc.querySelector('[data-x="tut"]').onclick = function () {
    suono('tasto');
    if (typeof GB_MENU.onTutorial === 'function') { try { GB_MENU.onTutorial({ eroe: eroeId(), lang: EN ? 'en' : 'it' }); } catch (e) { } return; }
    if (window.GBTUT && GBTUT.apri) { GBTUT.apri(); return; }   // ui/tutorial.js (si registra anche in GB_MENU.onTutorial)
    // senza ui/tutorial.js: il mini tutorial che il gioco ha gia' (prima partita contro i bot)
    try { localStorage.removeItem('gb_tutorial'); } catch (e) { }
    B.avvia('gemme', eroeId());
  };
  Q$('.gm-eroe').onclick = function () { suono('passa'); if (clip && clip.azione) clip.azione(); else B.ui.vai('s-eroi', 1); };

  MODI.forEach(function (M) {
    var b = el('button', 'gm-m gbm-modo', '<span class="gm-m-arte" style="background-image:url(\'' + M.arte + '\')"></span><span class="gm-m-velo"></span><span class="gm-m-tag">' + M.tag + '</span><span class="gm-m-t"><b>' + M.t + '</b><small>' + M.s + '</small></span>');
    b.dataset.id = M.id; b.style.setProperty('--k', M.k);
    b.onclick = function () { suono('passa'); stato.modo = M.id; ls('gb_mg_modo', M.id); disegna(); };
    modiEl.appendChild(b);
  });
  // GBT2311: TORNEI acceso: porta al torneo Gem Brawl attivo (la mini app apre la scheda del torneo: parent.gembTornei)
  var torn = el('button', 'gm-m gm-torn acceso', '<span class="gm-m-tag">🏆</span><span class="gm-m-t"><b>' + L('Tornei', 'Tournaments') + '</b><small>' + L('Duello a eliminazione', 'Knockout duels') + '</small></span>');
  torn.onclick = function () {
    suono('passa');
    if (window.__reteUI && window.__reteUI.tornei) { window.__reteUI.tornei(); return; }
    avvisoBreve(L('Il tabellone dei tornei è nella mini app del Gambler Bot.', 'The tournament bracket is in the Gambler Bot mini app.'));
  };
  modiEl.appendChild(torn);
  // ---------------- GBT2311: IN DIRETTA (lista delle partite vive, dal server, 5 s di ritardo) ----------------
  var stileL = document.createElement('style');
  stileL.textContent =
    '.gm-torn.acceso{--k:#ffd23b;filter:none;background:radial-gradient(120% 90% at 85% 15%,rgba(255,210,59,.35),transparent 60%),linear-gradient(180deg,#3a2a10,#1a0c22) padding-box,var(--cromo) border-box}' +
    '.gm-torn.acceso .gm-m-t small{background:none;color:#ffe9a8;padding:0;text-transform:none;font-size:clamp(10px,min(1.6vh,2.9vw),12.5px);text-shadow:0 1px 2px #000}' +
    '.gm-live{position:relative}.gm-live .gm-svg{color:#fff}.gm-live::after{content:"";position:absolute;top:7px;right:12px;width:9px;height:9px;border-radius:50%;background:#ff3b5c;box-shadow:0 0 0 2px #120420,0 0 8px #ff3b5c;animation:gm-pulsa 1.4s ease-in-out infinite}' +
    '@keyframes gm-pulsa{50%{opacity:.35;transform:scale(.8)}}.gm-live-n{position:absolute;top:-4px;left:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;font:900 11px/20px system-ui,sans-serif;font-style:normal;color:#fff;background:#ff3b5c;box-shadow:0 0 0 2px #120420}.gm-live-n[hidden]{display:none}' +
    '.gm-dir{width:min(100%,460px);max-height:min(82vh,640px);display:flex;flex-direction:column;text-align:left;padding:14px 12px 12px}' +
    '.gm-dir-t{display:flex;align-items:center;gap:8px;padding:0 4px 8px}.gm-dir-t b{flex:1;font-family:var(--R);font-weight:400;font-size:22px;letter-spacing:.5px}.gm-dir-t b i{display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff3b5c;margin-right:8px;vertical-align:2px;box-shadow:0 0 8px #ff3b5c;animation:gm-pulsa 1.4s ease-in-out infinite}' +
    '.gm-dir-x{width:40px;height:40px;border-radius:12px;border:0;color:#fff;font:900 20px/1 system-ui;background:linear-gradient(180deg,#3b1d63,#1d0c33);box-shadow:inset 0 0 0 2px rgba(255,255,255,.14),0 0 0 2px #120420;cursor:pointer}' +
    '.gm-dir-l{flex:1;min-height:90px;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:2px}' +
    '.gm-dr{--k:#b44dff;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;padding:8px;border-radius:14px;background:linear-gradient(180deg,#2a1048,#160829);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--k) 55%,transparent),0 0 0 2px #120420}' +
    '.gm-dr-tag{font-family:var(--R);font-size:12px;padding:4px 7px 3px;border-radius:8px;color:#fff;background:color-mix(in srgb,var(--k) 70%,#120420);box-shadow:0 0 0 2px #120420;white-space:nowrap}' +
    '.gm-dr-c{min-width:0;display:flex;flex-direction:column;gap:3px}.gm-dr-n{font:900 14px/1.15 system-ui,sans-serif;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.gm-dr-i{display:flex;gap:6px;align-items:center;font:700 11.5px/1.2 system-ui,sans-serif;color:#cfc3e6;white-space:nowrap;overflow:hidden}.gm-dr-i .tr{color:#ffd23b}' +
    '.gm-dr-e{display:flex;gap:2px}.gm-dr-e img{width:20px;height:20px;border-radius:6px;object-fit:cover;background:#0b0614;box-shadow:0 0 0 1.5px #120420}' +
    '.gm-dr-b{display:flex;gap:6px;align-items:center}.gm-dr-b .t3{height:40px;min-width:84px;cursor:pointer}.gm-dr-s{width:40px;height:40px;border-radius:12px;border:0;padding:9px;color:#fff;background:linear-gradient(180deg,#1a5f7a,#0d2c3d);box-shadow:inset 0 0 0 2px rgba(255,255,255,.16),0 0 0 2px #120420;cursor:pointer}.gm-dr-s svg{width:100%;height:100%}' +
    '.gm-dir-v{padding:22px 10px;text-align:center;font:700 14px/1.45 system-ui,sans-serif;color:#e6dcf7}.gm-dir-v b{display:block;font-family:var(--R);font-weight:400;font-size:18px;color:#fff;margin-bottom:6px}' +
    '.gm-dir-p{padding:8px 4px 0;font:700 11px/1.3 system-ui,sans-serif;color:#a99cc4;text-align:center}' +
    '@media (max-width:520px){.gm-dr{grid-template-columns:auto 1fr;row-gap:6px}.gm-dr-n{white-space:normal}.gm-dr-i{flex-wrap:wrap;white-space:normal}.gm-dr-b{grid-column:1/-1;justify-content:flex-end}.gm-dr-b .t3{flex:1;max-width:220px}}';
  document.head.appendChild(stileL);
  var dir = null, dirT = null, liveN = Q$('.gm-live-n');
  var COLMODO = { duello: '#ff6a12', sopr: '#3bff8b', sopravvivenza: '#3bff8b', gemme: '#b44dff' };
  function tagModo(m) { return m === 'duello' ? '1v1' : m === 'gemme' ? '3v3' : '×6'; }
  function nomeModo(m) { var x = MODI.filter(function (q) { return q.id === m || (m === 'sopravvivenza' && q.id === 'sopr'); })[0]; return x ? x.t : m; }
  function mmss(s) { s = Math.max(0, s | 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rigaDiretta(r) {
    var d = el('div', 'gm-dr'); d.style.setProperty('--k', COLMODO[r.modo] || '#b44dff');
    var nomi = (r.nomi || []).map(esc), chi = r.modo === 'duello' && nomi.length === 2 ? nomi[0] + ' <span style="color:#ffd23b">vs</span> ' + nomi[1] : nomi.join(', ');
    if (r.bot) chi += (chi ? ' ' : '') + '<span style="color:#a99cc4">+' + r.bot + ' bot</span>';
    var faccE = (r.eroi || []).slice(0, 6).map(function (id) { return '<img alt="" src="ui/icone/' + esc(id) + '.webp" onerror="this.style.display=\'none\'">'; }).join('');
    var stato = r.fase === 'gioco' ? '⏱ ' + mmss(r.sec) : L('sta per iniziare', 'starting');
    d.innerHTML = '<span class="gm-dr-tag">' + tagModo(r.modo) + '</span>' +
      '<div class="gm-dr-c"><div class="gm-dr-n">' + (chi || nomeModo(r.modo)) + '</div>' +
      '<div class="gm-dr-i">' + (r.tour ? '<span class="tr">🏆 ' + L('Torneo', 'Tournament') + (r.round ? ' · R' + r.round : '') + '</span>' : '<span>' + esc(nomeModo(r.modo)) + '</span>') +
      '<span>' + stato + '</span><span>👁 ' + (r.viewers | 0) + '</span>' + (faccE ? '<span class="gm-dr-e">' + faccE + '</span>' : '') + '</div></div>' +
      '<div class="gm-dr-b"><button class="gm-dr-s" aria-label="' + L('Condividi', 'Share') + '">' + IC_COND + '</button><button class="t3 corto gm-dr-g" style="--k:#ff3b5c"><span class="luce"></span><span>' + L('GUARDA', 'WATCH') + '</span></button></div>';
    d.querySelector('.gm-dr-g').onclick = function () { suono('tasto'); chiudiDirette(); if (window.__reteUI && window.__reteUI.guarda) window.__reteUI.guarda(r.rid); };
    d.querySelector('.gm-dr-s').onclick = function () { suono('passa'); if (window.__reteUI && window.__reteUI.condividi) window.__reteUI.condividi(r.rid); };
    d.dataset.rid = r.rid;
    return d;
  }
  function suLista(rooms) {
    var n = (rooms || []).length;
    liveN.hidden = !n; liveN.textContent = n > 9 ? '9+' : String(n);
    if (!dir) return;
    var l = dir.querySelector('.gm-dir-l'); l.innerHTML = '';
    if (!n) { l.appendChild(el('div', 'gm-dir-v', '<b>' + L('Nessuna partita in diretta', 'No live matches right now') + '</b>' + L('Adesso non gioca nessuno. Entra tu in una partita: qualcuno potrà guardarti!', 'Nobody is playing right now. Start a match yourself: someone might watch you!'))); return; }
    rooms.forEach(function (r) { l.appendChild(rigaDiretta(r)); });
  }
  function apriDirette() {
    if (dir) return;
    if (!window.__reteUI || !window.__reteUI.dirette) { suono('vuoto'); avvisoBreve(L('Server non collegato', 'Server not connected')); return; }
    dir = el('div', 'gm-velo gm-dir-velo', '<div class="gm-foglio gm-dir"><div class="gm-dir-t"><b><i></i>' + L('IN DIRETTA', 'LIVE') + '</b><button class="gm-dir-x" aria-label="' + L('Chiudi', 'Close') + '">✕</button></div>' +
      '<div class="gm-dir-l"><div class="gm-dir-v">' + L('Cerco le partite…', 'Looking for matches…') + '</div></div><div class="gm-dir-p">' + L('Le dirette hanno 5 secondi di ritardo', 'Live matches run 5 seconds behind') + '</div></div>');
    document.body.appendChild(dir);
    dir.querySelector('.gm-dir-x').onclick = function () { suono('indietro'); chiudiDirette(); };
    dir.onclick = function (e) { if (e.target === dir) { suono('indietro'); chiudiDirette(); } };
    window.__reteUI.dirette(suLista);
    clearInterval(dirT); dirT = setInterval(function () { if (dir && window.__reteUI) window.__reteUI.dirette(suLista); }, 2500);
  }
  function chiudiDirette() { clearInterval(dirT); dirT = null; if (dir) { dir.remove(); dir = null; } }
  window.__menuGB_dirette = function () { if (!sc.classList.contains('on')) window.__menuGBapri(); apriDirette(); };
  window.__menuGB_chiudiDirette = chiudiDirette;
  sc.querySelector('[data-x="live"]').onclick = function () { suono('passa'); apriDirette(); };
  var avv = el('div', 'gm-avviso'); document.body.appendChild(avv);   // fuori dalla schermata: l'animazione d'entrata (.schermo.on > *) lo mostrava vuoto var avvT = null;
  function avvisoBreve(t) { avv.textContent = t; avv.classList.add('on'); clearTimeout(avvT); avvT = setTimeout(function () { avv.classList.remove('on'); }, 2600); }

  function conferma18(poi) {
    var f = el('div', 'gm-velo', '<div class="gm-foglio"><b>🔞 ' + L('Solo maggiorenni', 'Adults only') + '</b><p>' + L('Il gioco a soldi è riservato a chi ha 18 anni o più. Confermi di avere almeno 18 anni?', 'Playing for money is for people aged 18 or over. Do you confirm you are at least 18?') + '</p>' +
      '<div class="gm-ft"><button class="t3 corto" data-s="1" style="--k:#5cff8a"><span class="luce"></span><span>' + L('Sì, ho 18 anni', 'Yes, I am 18+') + '</span></button><button class="t3 corto" data-s="0" style="--k:#ff4d5e"><span class="luce"></span><span>' + L('No', 'No') + '</span></button></div></div>');
    document.body.appendChild(f);
    f.querySelector('[data-s="1"]').onclick = function () {
      ls('gb18', '1'); suono('tasto'); f.remove();
      var c = window.__reteUI && window.__reteUI.cli; if (c && c.manda) c.manda({ t: 'gb18', ok: 1 });   // lo stesso messaggio della toppa RT
      poi();
    };
    f.querySelector('[data-s="0"]').onclick = function () { suono('indietro'); f.remove(); };
  }

  // ---------------- l'eroe: UNA clip, liberata all'uscita; arte 2D se la clip non arriva in 1,2 s ----------------
  var clip = null, clipId = '', tRipiego = null;
  function montaEroe() {
    var id = eroeId(), box = Q$('.gm-eroe'), arte = Q$('.gm-arte'), cl = Q$('.gm-clip');
    sc.style.setProperty('--kh', colEroe(id));
    Q$('.gm-nome').textContent = B.nomeCorto ? B.nomeCorto(id) : nomeEroe(id);
    var rr = B.ruoli ? B.ruoli(id) : [], ru = Q$('.gm-ruolo');
    ru.innerHTML = rr.map(function (r, i) { return (i ? '<i class="ruolo2" style="--kr2:' + r.col + '">' : '') + r.tx + (i ? '</i>' : ''); }).join('');
    if (rr[0]) ru.style.setProperty('--kr', rr[0].col);
    if (B.icoClassi) { var ic = B.icoClassi(id); Q$('.gm-cl').innerHTML = ic.html; Q$('.gm-cl').style.setProperty('--kc', ic.col); }
    if (clip && clipId === id) return;
    smonta();
    clipId = id; box.classList.remove('clip-ok');
    arte.onerror = function () { arte.onerror = null; arte.src = 'ui/icone/' + id + '.webp'; };
    arte.src = arte2d(id);
    if (CA && CA.ha(id)) {
      clip = CA.monta(cl, id, { intro: true, q: TEL ? '_m' : '', pronto: function () { clearTimeout(tRipiego); box.classList.add('clip-ok'); box.classList.remove('ripiego'); } });
      clearTimeout(tRipiego);
      tRipiego = setTimeout(function () { if (!box.classList.contains('clip-ok')) box.classList.add('ripiego'); }, 1200);   // resta l'arte 2D (la clip, se arriva dopo, la sostituisce)
    }
  }
  function smonta() { clearTimeout(tRipiego); if (clip) { try { clip.ferma(); } catch (e) { } clip = null; } clipId = ''; Q$('.gm-clip').innerHTML = ''; }
  window.__menuGB_clip = function () { return { attiva: !!(clip && clip.vivo), id: clipId, primo: !!(clip && clip.primo), canvas: Q$('.gm-clip').querySelectorAll('canvas').length, ripiego: Q$('.gm-eroe').classList.contains('ripiego') }; };

  function disegna() {
    var sd = saldo(); Q$('.gm-saldo b').textContent = sd == null ? '—' : eur(sd);
    Array.prototype.forEach.call(modiEl.querySelectorAll('.gm-m[data-id]'), function (b) { b.classList.toggle('sel', b.dataset.id === stato.modo); b.classList.toggle('on', b.dataset.id === stato.modo); });   // «on» = nome di prima (pre-menu)
    var M = MODI.filter(function (x) { return x.id === stato.modo; })[0] || MODI[0], aperti = soldiAperti();
    soldiEl.innerHTML = '';
    var seg = el('div', 'gm-seg', '<button data-g="g"><span>' + L('GRATIS', 'FREE') + '<small>' + L('contro persone', 'vs real people') + '</small></span></button><button data-g="s"><span>' + L('A SOLDI', 'FOR MONEY') + '<small>' + (aperti ? L('vince il piatto', 'winner takes the pot') : L('presto', 'soon')) + '</small></span></button>');
    seg.querySelector('[data-g="g"]').classList.toggle('on', !stato.soldi);
    seg.querySelector('[data-g="s"]').classList.toggle('on', stato.soldi);
    seg.querySelector('[data-g="g"]').onclick = function () { stato.soldi = false; suono('passa'); disegna(); };
    seg.querySelector('[data-g="s"]').onclick = function () { var vai = function () { stato.soldi = true; suono('passa'); disegna(); }; if (ls('gb18') === '1') vai(); else conferma18(vai); };
    soldiEl.appendChild(seg);
    sc.classList.toggle('a-soldi', stato.soldi);
    if (stato.soldi) {
      var fi = el('div', 'gm-fiches');
      FASCE.forEach(function (f, i) {
        var b = el('button', 'gm-f' + (f === stato.posta ? ' on' : ''), '<b>' + (+f < 1 ? (EN ? '0.50' : '0,50') : f) + '</b>'); b.style.setProperty('--tinta', TINTA[i]);
        b.setAttribute('aria-label', eur(f));
        b.onclick = function () { stato.posta = f; ls('gb_mg_posta', f); suono('passa'); disegna(); };
        fi.appendChild(b);
      });
      soldiEl.appendChild(fi);
      var p = +stato.posta, piatto = p * M.n, netto = piatto * 0.95;
      soldiEl.appendChild(el('div', 'gm-targa2', '<span class="oro"><small>' + L('posta', 'stake') + '</small>' + eur(p) + '</span><span><small>' + L('piatto', 'pot') + '</small>' + eur(piatto) + '</span><span><small>' + (M.id === 'gemme' ? L('a testa se vinci', 'each if you win') : L('se vinci', 'if you win')) + '</small>' + eur(M.id === 'gemme' ? netto / 3 : netto) + '</span>'));
    }
    via.classList.toggle('spento', stato.soldi && !aperti);
    via.querySelector('.g-l').textContent = stato.soldi ? (aperti ? L('GIOCA ', 'PLAY ') + eur(stato.posta) : L('PRESTO', 'SOON')) : L('CERCA PARTITA', 'FIND MATCH');
    via.querySelector('small').textContent = stato.soldi ? (aperti ? L('commissione 5%', '5% fee') : L('le partite a soldi non sono ancora aperte', 'money matches are not open yet')) : M.t + ' · ' + L('gratis contro persone', 'free vs real people');
  }
  via.onclick = function () {
    if (stato.soldi) { suono('vuoto'); return; }   // a soldi spento (interruttore del server)
    if (window.GBTUT && GBTUT.proponi && GBTUT.proponi(function () { via.onclick(); })) return;   // al primo Gioca si propone il tutorial (una volta)
    if (!window.__reteUI) { suono('vuoto'); avvisoBreve(L('Server non collegato', 'Server not connected')); return; }
    suono('tasto'); window.__reteUI.coda(stato.modo);
  };

  // ---------------- entrata / uscita: la clip vive solo col menu davanti ----------------
  function togliLobbyVideo() { var lv = document.getElementById('lv'); if (lv) lv.classList.remove('on'); }
  function suApertura() { disegna(); montaEroe(); togliLobbyVideo(); contaDirette(); }
  // GBT2311: il numerino delle dirette sull'icona (una richiesta all'apertura del menu e ogni 15 s col menu davanti; solo se la rete e' gia' su)
  var contaT = null;
  function contaDirette() {
    var R0 = window.__reteUI; if (!R0 || !R0.dirette || !R0.cli || !R0.cli.connessa || !R0.cli.connessa()) return;
    R0.dirette(suLista);
  }
  setInterval(function () { if (sc.classList.contains('on') && !dir) contaDirette(); }, 15000);
  new MutationObserver(function () { if (sc.classList.contains('on')) suApertura(); else { smonta(); chiudiDirette(); } }).observe(sc, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', function () { if (document.hidden) smonta(); else if (sc.classList.contains('on')) montaEroe(); });
  window.__menuGBapri = function () { B.ui.mostra('s-gb'); suApertura(); setTimeout(togliLobbyVideo, 400); };
  function aggancia() { var g = document.getElementById('h-gioca'); if (g) g.onclick = function () { suono('passa'); B.ui.vai('s-gb', 1); }; }
  if (document.readyState === 'complete') aggancia(); else window.addEventListener('load', aggancia);
  setTimeout(aggancia, 500);
  // si apre DIRETTAMENTE sul menu (niente titolo), tranne nelle prove automatiche e quando si chiede un'altra schermata
  if (Q.get('auto') !== '1' && !Q.get('schermo') && !Q.get('replay') && Q.get('subito') !== '1' && !Q.get('guarda') && !Q.get('torneo')) setTimeout(function () { window.__menuGBapri(); }, Q.get('apri') === 'menu' ? 600 : 50);
})();
