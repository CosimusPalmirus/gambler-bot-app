// GEM BRAWL — F1 rete (23/11): LE SCHERMATE ONLINE (coda, scelta dell'eroe, avvisi, fine) sopra rete.js.
// Si accende SOLO con ?rete=ws://... nell'indirizzo: senza, la pagina e' identica a prima (il gioco contro i bot non cambia).
//   ?rete=ws://127.0.0.1:8871/?rtt=70   server (o rete finta del banco)
//   &uid=...&nome=...                    chi gioca (se manca: uno a caso, tenuto nel telefono)
//   &modo=duello|sopr|gemme&subito=1     entra subito in coda (prove)
//   &guarda=1                            spettatore (5 s di ritardo)
//   &perf=1                              misura gb-perf a schermo (RTT, quanto si vede, colpo, correzioni, fermi)
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  // 24/11 ONLINE: di serie il server RT vero (dialetto 'rt', autenticazione con l'initData di Telegram); ?rete= = il
  // server di prova del banco (dialetto 'locale', se non si dice &dial=rt). ?rete=0 spegne tutto (pagina di ieri).
  var RT_URL = 'wss://62-238-17-24.sslip.io/turfws';
  var URLR = Q.get('rete') || RT_URL, DIAL = Q.get('dial') || (Q.get('rete') ? 'locale' : 'rt');
  if (Q.get('rete') === '0' || !window.ReteGB || !window.__brawl) return;
  var B = window.__brawl, S = window.Suoni || null;
  var LANG = (document.documentElement.lang || 'it').slice(0, 2) === 'en' ? 'en' : 'it';
  var TX = {
    it: { online: 'Online', sotto: 'Gratis contro persone', duello: 'Duello', sopr: 'Sopravvivenza', gemme: '3 contro 3', annulla: 'Annulla', coda: 'In coda', cerca: 'Cerco avversari…', scegli: 'Scegli il tuo eroe', conferma: 'Combatti', attendi: 'Aspetto gli altri…', pausa: 'Pausa: un giocatore si è disconnesso', afk: 'Muoviti o esci dalla partita fra', stacco: 'Connessione persa: riprovo…', no_versione: 'Versione diversa: ricarica la pagina', no: 'Partita annullata', verificata: 'Verificata dal server', guarda: 'Guardi con 5 s di ritardo', esce: 'ha lasciato la partita', bot: 'lo guida un bot' },
    en: { online: 'Online', sotto: 'Free against people', duello: 'Duel', sopr: 'Survival', gemme: '3 vs 3', annulla: 'Cancel', coda: 'In queue', cerca: 'Looking for opponents…', scegli: 'Pick your hero', conferma: 'Fight', attendi: 'Waiting for the others…', pausa: 'Paused: a player disconnected', afk: 'Move or you leave the match in', stacco: 'Connection lost: retrying…', no_versione: 'Different version: reload the page', no: 'Match cancelled', verificata: 'Verified by the server', guarda: 'Watching with a 5 s delay', esce: 'left the match', bot: 'a bot drives it' }
  };
  // GBT2311: tornei e spettatori
  TX.it.torneo = 'Torneo'; TX.en.torneo = 'Tournament';
  TX.it.t_attesa = 'Aspetto il tuo avversario…'; TX.en.t_attesa = 'Waiting for your opponent…';
  TX.it.t_arriva = 'Avversario trovato!'; TX.en.t_arriva = 'Opponent found!';
  TX.it.t_fra = 'Si parte fra'; TX.en.t_fra = 'Starts in';
  TX.it.t_torna = 'Torna al torneo'; TX.en.t_torna = 'Back to the tournament';
  TX.it.t_bye = 'Passi il turno!'; TX.en.t_bye = 'You advance!';
  TX.it.t_bye_sub = 'Il tuo avversario non si è presentato: sei al turno dopo.'; TX.en.t_bye_sub = 'Your opponent did not show up: you are through to the next round.';
  TX.it.t_scaduto = 'Biglietto scaduto'; TX.en.t_scaduto = 'Ticket expired';
  TX.it.t_scaduto_sub = 'Questo match non si può più giocare da qui: torna al tabellone del torneo.'; TX.en.t_scaduto_sub = 'This match can no longer be played from here: go back to the tournament bracket.';
  TX.it.t_vinto = 'Passi al turno dopo'; TX.en.t_vinto = 'You go through to the next round';
  TX.it.t_perso = 'Fuori dal torneo'; TX.en.t_perso = 'Out of the tournament';
  TX.it.diretta = 'In diretta'; TX.en.diretta = 'Live';
  TX.it.entro = 'Entro nella partita…'; TX.en.entro = 'Joining the match…';
  TX.it.inizio = 'La partita sta per iniziare…'; TX.en.inizio = 'The match is about to start…';
  TX.it.altra = 'Guarda un’altra'; TX.en.altra = 'Watch another';
  TX.it.torna = 'Torna'; TX.en.torna = 'Back';
  TX.it.no_finita = 'La partita è già finita'; TX.en.no_finita = 'That match is already over';
  TX.it.no_trovata = 'Partita non trovata'; TX.en.no_trovata = 'Match not found';
  TX.it.no_piena = 'Troppi spettatori: riprova fra poco'; TX.en.no_piena = 'Too many viewers: try again soon';
  TX.it.no_impegnato = 'Sei già in coda o in partita'; TX.en.no_impegnato = 'You are already queued or playing';
  TX.it.no_giochi = 'In questa partita giochi tu'; TX.en.no_giochi = 'You are playing in this match';
  TX.it.copiato = 'Codice della diretta copiato'; TX.en.copiato = 'Live code copied';
  TX.it.no_tornei = 'Il tabellone dei tornei è nella mini app del Gambler Bot: Giochi → Tornei → Gem Brawl.'; TX.en.no_tornei = 'The tournament bracket is in the Gambler Bot mini app: Games → Tournaments → Gem Brawl.';
  TX.it.gno = 'Non si può guardare adesso: segui con la tua vista'; TX.en.gno = 'You cannot watch right now: following with your own view';
  function T(k) { return (TX[LANG] && TX[LANG][k]) || TX.it[k] || k; }
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function suono(n) { try { if (S && S[n]) S[n](); } catch (e) { } }
  var uid = Q.get('uid');
  if (!uid) { try { uid = localStorage.getItem('gb_uid_rete'); } catch (e) { } if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10); try { localStorage.setItem('gb_uid_rete', uid); } catch (e) { } } }
  var tgU = null; try { tgU = window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user; } catch (e) { }
  if (DIAL === 'rt' && tgU && tgU.id && !Q.get('uid')) uid = String(tgU.id);   // sul RT vero l'uid lo decide l'initData firmato
  var nome = Q.get('nome') || (tgU && (tgU.first_name || tgU.username)) || ('Giocatore ' + uid.slice(-3));
  var CAST = (window.CAST_UI && window.CAST_UI.E) || {};
  function nomeEroe(id) { var c = CAST[id]; return (c && ((LANG === 'en' && c.nome_en) || c.nome)) || id; }

  // ---------------- la schermata (una sola, con tre stati: modi, coda, scelta) ----------------
  var sc = el('section', 'schermo rete-sc'); sc.id = 's-rete'; sc.dataset.indietro = 's-home'; sc.dataset.musica = 'menu';
  sc.innerHTML = '<div class="rete-box"><h1 class="rete-tit"></h1><p class="rete-sub"></p><div class="rete-corpo"></div><div class="rete-tasti"></div></div>';
  document.body.appendChild(sc);
  var tit = sc.querySelector('.rete-tit'), sub = sc.querySelector('.rete-sub'), corpo = sc.querySelector('.rete-corpo'), tasti = sc.querySelector('.rete-tasti');
  var avviso = el('div', 'rete-avviso'); document.body.appendChild(avviso);
  var perfEl = el('div', 'rete-perf'); if (Q.get('perf') === '1') document.body.appendChild(perfEl);
  var avvT = null;
  function avvisa(t, ms) { avviso.textContent = t; avviso.classList.add('on'); clearTimeout(avvT); if (ms) avvT = setTimeout(function () { avviso.classList.remove('on'); }, ms); }
  function togliAvviso() { avviso.classList.remove('on'); }
  function tasto(txt, cls, fn) { var b = el('button', 't3 corto ' + (cls || ''), null); b.innerHTML = '<span class="luce"></span><span></span>'; b.lastChild.textContent = txt; b.onclick = function () { suono('tasto'); fn(); }; return b; }

  var cli = window.ReteGB.cliente({ url: URLR, uid: uid, nome: nome, dialetto: DIAL, leggiInput: function () { return B.inputRete ? B.inputRete() : null; } });
  window.__rete = cli;
  var modo = Q.get('modo') || 'duello', scelta = null, confermato = false, fineTimer = null, connesso = false;
  // GBT2311: UNA connessione per tutto (coda, torneo, lista in diretta, spettatore): quello che serve dopo `hello_ok` si
  // mette in fila e parte al saluto (prima on.ciao veniva riscritto a ogni ingresso e restava acceso anche nei rientri).
  var pronta = false, inArrivo = false, fila = [];
  function assicura(fn) {
    if (pronta && cli.connessa()) { fn(); return; }
    fila.push(fn);
    if (!inArrivo && !cli.connessa()) { inArrivo = true; cli.connetti(); }
  }
  cli.on.ciao = function () { connesso = true; pronta = true; inArrivo = false; var l = fila; fila = []; l.forEach(function (f) { try { f(); } catch (e) { } }); };
  var TID = Q.get('tid') || '', TOUR = null, NOMI_SEGGI = null;

  function schermoModi() {
    tit.textContent = T('online'); sub.textContent = T('sotto'); corpo.innerHTML = ''; tasti.innerHTML = '';
    ['duello', 'sopr', 'gemme'].forEach(function (m) {
      var b = el('button', 'gioca piccolo rete-modo'); b.innerHTML = '<span class="luce"></span><span class="lampo"></span><span class="g-l"></span>'; b.querySelector('.g-l').textContent = T(m);
      b.onclick = function () { suono('tasto'); entraCoda(m); }; corpo.appendChild(b);
    });
    tasti.appendChild(tasto(T('annulla'), '', function () { B.ui.vai(window.__menuGB ? 's-gb' : 's-home', -1); }));
  }
  function entraCoda(m) {
    modo = m; scelta = null; confermato = false;
    if (typeof LOBBY !== 'undefined' && LOBBY) { LOBBY = null; etichettaAncora(null); }   // GBGRUPPI_2311
    if (TOUR) { TOUR = null; var fa = $('f-ancora'), fe = $('f-eroe'), g = fa && fa.querySelector('.g-l'); if (g && fa.dataset.txt) { g.textContent = fa.dataset.txt; g.style.fontSize = ''; g.style.whiteSpace = ''; } if (fe) fe.style.display = ''; }   // GBT2311: coda gratis dopo un torneo
    assicura(function () { cli.coda(modo); });   // GBT2311: una connessione sola (assicura)
    tit.textContent = T(modo); sub.textContent = T('cerca'); corpo.innerHTML = '<div class="rete-giro"></div><div class="rete-coda"></div>'; tasti.innerHTML = '';
    tasti.appendChild(tasto(T('annulla'), '', function () { cli.esciCoda(); if (window.__menuGB) B.ui.vai('s-gb', -1); else schermoModi(); }));
    if (B.ui && window.__brawl && document.getElementById('s-rete').classList.contains('on') === false) B.ui.vai('s-rete', 1);
  }
  cli.on.coda = function (m) {
    if (!m.modo) return;
    var c = corpo.querySelector('.rete-coda'); if (!c) return;
    var tot = m.modo === 'duello' ? 2 : 6;
    c.textContent = T('coda') + ' · ' + m.n + '/' + tot + (m.modo !== 'duello' && m.max ? ' · ' + Math.max(0, Math.ceil(m.max - m.attesa)) + ' s' : '');
  };
  cli.on.partita = function () { scelta = null; confermato = false; tit.textContent = T('scegli'); sub.textContent = ''; corpo.innerHTML = ''; tasti.innerHTML = ''; suono('vsColpo'); };
  cli.on.sel = function (m) {
    if (!corpo.querySelector('.rete-griglia')) {
      corpo.innerHTML = '<div class="rete-tempo"></div><div class="rete-griglia"></div><div class="rete-conf"></div>';
      var g = corpo.querySelector('.rete-griglia');
      m.eroi.forEach(function (id) {
        var b = el('button', 'rete-eroe'); b.dataset.id = id;
        var im = el('img'); im.alt = ''; im.draggable = false; im.src = 'ui/icone/' + id + '.webp';
        im.onerror = function () { im.onerror = null; im.src = 'menu_video/arte2d/' + id + '.webp'; };
        b.appendChild(im); b.appendChild(el('span', null, nomeEroe(id)));
        b.onclick = function () { if (confermato) return; scelta = id; suono('passa'); cli.scegli(id, false); evidenzia(); };
        g.appendChild(b);
      });
      tasti.innerHTML = '';
      tasti.appendChild(tasto(T('conferma'), 'rete-ok', function () { if (confermato) return; confermato = true; if (!scelta) scelta = m.mia || preferito(m.eroi); cli.scegli(scelta, true); evidenzia(); sub.textContent = T('attendi'); }));
      if (!scelta) { scelta = m.mia || preferito(m.eroi); cli.scegli(scelta, false); }
      evidenzia();
      var fino = performance.now() + (m.fino || 25000);
      var tt = corpo.querySelector('.rete-tempo');
      (function giro() { if (!tt.isConnected) return; var r = Math.max(0, Math.ceil((fino - performance.now()) / 1000)); tt.textContent = r + ' s'; if (r > 0) setTimeout(giro, 250); })();
      if (Q.get('reteauto') === '1') setTimeout(function () { confermato = true; cli.scegli(scelta, true); evidenzia(); }, 600);
    }
    var cf = corpo.querySelector('.rete-conf');
    if (cf) { cf.innerHTML = ''; (m.conf || []).forEach(function (v, k) { var d = el('i', v ? 'si' : ''); d.title = (m.nomi || [])[k] || ''; if (k === m.mio) d.classList.add('io'); cf.appendChild(d); }); }
  };
  function preferito(eroi) { var a = (window.__brawl && window.__brawl.P && null); var e = null; try { e = Q.get('eroe') || localStorage.getItem('gb_eroe'); } catch (x) { } return eroi.indexOf(e) >= 0 ? e : eroi[Math.floor(Math.random() * eroi.length)]; }
  function evidenzia() { Array.prototype.forEach.call(corpo.querySelectorAll('.rete-eroe'), function (b) { b.classList.toggle('sel', b.dataset.id === scelta); b.classList.toggle('ok', confermato && b.dataset.id === scelta); }); }
  cli.on.car = function () { togliAvviso(); B.avviaRete(cli); };
  cli.on.via = function (tra) { B.viaRete(tra); };
  cli.on.pausa = function (m) { if (m.on) avvisa(T('pausa') + (m.s ? ' (' + m.s + ' s)' : '')); else togliAvviso(); };
  cli.on.afk = function (m) { avvisa(T('afk') + ' ' + Math.ceil(m.resta || 8) + ' s', 3000); if (navigator.vibrate) try { navigator.vibrate([60, 60, 60]); } catch (e) { } };
  cli.on.esce = function (m) { avvisa((m.nome || '?') + ' ' + T('esce') + (m.bot ? ' · ' + T('bot') : ''), 2500); };
  cli.on.staccato = function () {
    pronta = false; inArrivo = !cli.chiuso && /^(scelta|carica|gioco|coda|guarda)$/.test(cli.fase);   // GBT2311: rete.js si riattacca da solo in queste fasi
    if (cli.fase === 'gioco' || cli.fase === 'guarda') avvisa(T('stacco'));
  };
  cli.on.connesso = function () { if (cli.fase === 'gioco' || cli.fase === 'guarda') togliAvviso(); };
  cli.on.no = function (m) { if (TOUR) { schermoTorneo(T('no'), String(m.perche || ''), true); return; } avvisa(m.perche === 'versione' ? T('no_versione') : m.perche === 'auth' || m.perche === 'auth failed' ? (LANG === 'en' ? 'Open the game from Telegram to play online' : 'Apri il gioco da Telegram per giocare online') : m.perche === 'bad game' ? (LANG === 'en' ? 'Online play opens in a few minutes: try again soon (Training works now)' : 'Il gioco online apre fra pochi minuti: riprova presto (l’Allenamento va già)') : T('no') + ' (' + m.perche + ')', 4000); setTimeout(function () { if (B.esciRete) B.esciRete(); B.ui.vai(window.__menuGB ? 's-gb' : 's-home', -1); }, 1500); };
  cli.on.fuori = function (m) { avvisa(m.perche === 'afk' ? (LANG === 'en' ? 'You were idle too long: out of the match' : 'Fermo troppo a lungo: sei fuori dalla partita') : T('no'), 4000); setTimeout(function () { if (B.esciRete) B.esciRete(); B.ui.vai('s-home', -1); }, 1800); };
  cli.on.fine = function (m) {
    if (cli.io >= 0) cli.mandaPerf();   // GBT2311: lo spettatore esterno non e' seduto al tavolo
    if (TOUR) fineTorneoTasti();
    // il verdetto del server (verificatore) sotto il risultato della schermata di fine
    clearTimeout(fineTimer);
    fineTimer = setTimeout(function () {
      var mo = $('f-motivo'); if (mo && m.verifica && m.verifica.ok) mo.textContent += ' · ✓ ' + T('verificata');
      if (mo && TOUR && cli.tourEsito && !cli.tourEsito.walkover) mo.textContent += ' · ' + T(cli.tourEsito.you_won ? 't_vinto' : 't_perso');   // GBT2311
    }, 2200);
  };
  // dopo una partita online «Lobby» torna al menu principale (non alla lobby dei bot)
  (function () { var fh = $('f-home'); if (!fh) return; var orig = fh.onclick; fh.onclick = function (e) { if (B.ultimaRete && TOUR) { suono('indietro'); tornaTorneo(); return; } if (B.ultimaRete && window.__menuGB) { suono('indietro'); if (B.esciRete) B.esciRete(); window.__menuGBapri(); return; } if (orig) orig.call(fh, e); }; })();
  B.reteAncora = function () { if (TOUR) { tornaTorneo(); return; } B.ui.vai('s-rete', 1); setTimeout(function () { entraCoda(modo); }, 380); };   // GBT2311: in torneo niente «di nuovo in coda»
  B.reteEsci = function () { cli.esci(); };
  // GBT2311: dove si va uscendo dalla pausa di una partita online (o di una diretta): menu di Gem Brawl, o il torneo
  B.reteDove = function () { if (TOUR || TID) { setTimeout(tornaTorneo, 60); } return window.__menuGB ? 's-gb' : 's-home'; };

  // ================= GBT2311: TORNEI =================
  // La mini app apre la pagina con &torneo=<biglietto>&tid=<torneo>. Si aspetta l'avversario (fino a 180 s dal biglietto),
  // poi la partita e' identica al Duello gratis; a fine match «Torna al torneo» (mai «di nuovo in coda»).
  var stile = document.createElement('style');
  stile.textContent = '.rete-tour{display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px 0 4px}.rete-tour .rt-fra{font-family:var(--R,inherit);font-size:44px;line-height:1;color:#fff;-webkit-text-stroke:1px #120420;paint-order:stroke fill;text-shadow:0 3px 0 #000,0 0 18px rgba(255,210,59,.6)}.rete-tour .rt-eti{font:800 12px/1.2 system-ui,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:#ffd23b}.rete-tour .rt-gioc{font:800 14px/1.3 system-ui,sans-serif;color:#efe6ff}.rete-tour .rt-gioc b{color:#5cff8a}.rete-tour.arriva .rt-gioc{animation:rt-pop .5s cubic-bezier(.2,1.6,.4,1)}@keyframes rt-pop{from{transform:scale(1.35)}to{transform:none}}.rete-msg{font:700 14px/1.4 system-ui,sans-serif;color:#e6dcf7;margin:4px 0 8px;text-align:center}';
  document.head.appendChild(stile);
  function tornaTorneo() {
    var tid = (TOUR && TOUR.tid) || TID || '';
    try { if (window.parent && window.parent !== window && typeof window.parent.gembTornei === 'function') { window.parent.gembTornei(tid); return; } } catch (e) { }
    // pagina aperta da sola (/gembrawl del bot): il tabellone sta nella mini app; si torna al menu con l'avviso
    if (B.esciRete) B.esciRete();
    B.ui.vai(window.__menuGB ? 's-gb' : 's-home', -1);
    setTimeout(function () { avvisa(T('no_tornei'), 5000); }, 450);
  }
  // la lobby video (lobby_video.js) si apre da sola al caricamento: col link del torneo o di una diretta non deve coprire niente
  function viaLobbyVideo() { var f = function () { var lv = document.getElementById('lv'); if (lv) lv.classList.remove('on'); }; f(); setTimeout(f, 700); }
  function schermoTorneo(titolo, testo) {
    if (!document.getElementById('s-rete').classList.contains('on')) B.ui.mostra('s-rete');
    tit.textContent = titolo; sub.textContent = ''; corpo.innerHTML = ''; tasti.innerHTML = '';
    if (testo) corpo.appendChild(el('p', 'rete-msg', testo));
    tasti.appendChild(tasto(T('t_torna'), 'rete-ok', tornaTorneo));
  }
  var attesaT = null;
  function avviaTorneo(ticket, tid) {
    TOUR = { ticket: ticket, tid: tid || '' }; modo = 'duello';
    B.ui.mostra('s-rete'); viaLobbyVideo();
    tit.textContent = T('torneo') + ' · ' + T('duello'); sub.textContent = T('t_attesa');
    corpo.innerHTML = '<div class="rete-giro"></div><div class="rete-tour"><span class="rt-eti"></span><span class="rt-fra"></span><span class="rt-gioc"></span></div>'; tasti.innerHTML = '';
    tasti.appendChild(tasto(T('t_torna'), '', function () { tornaTorneo(); }));
    assicura(function () { cli.torneo(ticket, tid); });
  }
  cli.on.torneoAttesa = function (m) {
    var box = corpo.querySelector('.rete-tour'); if (!box) return;
    var n = m.n | 0, cap = (m.cap | 0) || 2, prima = +box.dataset.n || 0;
    box.querySelector('.rt-gioc').innerHTML = (LANG === 'en' ? 'Players ' : 'Giocatori ') + '<b>' + n + '</b>/' + cap;
    if (n > prima && prima) { box.classList.remove('arriva'); void box.offsetWidth; box.classList.add('arriva'); sub.textContent = T('t_arriva'); suono('vsColpo'); }
    box.dataset.n = n;
    clearInterval(attesaT);
    if (m.fra != null && isFinite(+m.fra)) {
      var fino = performance.now() + (+m.fra) * 1000;
      box.querySelector('.rt-eti').textContent = T('t_fra');
      var giro = function () { if (!box.isConnected) { clearInterval(attesaT); return; } box.querySelector('.rt-fra').textContent = Math.max(0, Math.ceil((fino - performance.now()) / 1000)) + ' s'; };
      giro(); attesaT = setInterval(giro, 250);
    }
  };
  cli.on.torneoNo = function (m) { clearInterval(attesaT); schermoTorneo(T('t_scaduto'), T('t_scaduto_sub') + (m.perche && !/scadut|expired/i.test(m.perche) ? ' (' + m.perche + ')' : '')); };
  cli.on.torneoFine = function (m) {
    clearInterval(attesaT);
    if (m.walkover) { schermoTorneo(T('t_bye'), LANG === 'it' && m.msg ? m.msg : T('t_bye_sub')); suono('trofei'); return; }   // il msg del server e' solo in italiano
    fineTorneoTasti();
  };
  function fineTorneoTasti() {
    var fa = $('f-ancora'), fe = $('f-eroe');
    if (fa) { var g = fa.querySelector('.g-l'); if (g) { if (!fa.dataset.txt) fa.dataset.txt = g.textContent; g.textContent = T('t_torna'); g.style.fontSize = '0.74em'; g.style.whiteSpace = 'nowrap'; } }
    if (fe) fe.style.display = 'none';
  }

  // ================= GBT2311: SPETTATORI =================
  // &guarda=<rid> (rt...): guarda una partita (dal tabellone del torneo o da un link); la lista IN DIRETTA del menu fa lo stesso.
  // 5 s di ritardo, tutta l'arena; si esce (unwatch) e si rientra (nuovo watch = nuova foto); a fine partita Torna / Guarda un'altra.
  function guardaStanza(rid) {
    var P0 = B.P && B.P();
    if (P0 && P0.rete && !P0.spett && B.fase !== 'fine') return false;   // mai mentre si gioca
    if (window.SPETT && SPETT.nascondi) SPETT.nascondi();
    NOMI_SEGGI = null; cli.nomiSeggi = null;
    if (B.esciRete && P0 && P0.spett) B.esciRete();
    B.ui.mostra('s-rete'); viaLobbyVideo();
    tit.textContent = T('diretta'); sub.textContent = T('entro'); corpo.innerHTML = '<div class="rete-giro"></div>'; tasti.innerHTML = '';
    tasti.appendChild(tasto(T('torna'), '', function () { esciSpett('torna'); }));
    assicura(function () { cli.guarda(rid); cli.dirette(); });
    return true;
  }
  cli.on.guardi = function (m) {
    sub.textContent = m.fase === 'gioco' ? T('entro') : T('inizio');
    if (m.fase !== 'gioco') cli.dirette();
  };
  cli.on.sfoto = function () { avvisa(T('guarda'), 2500); if (!cli.nomiSeggi) cli.dirette(); };
  cli.on.guardaNo = function (m) {
    var k = { finita: 'no_finita', piena: 'no_piena', impegnato: 'no_impegnato', giochi: 'no_giochi' }[m.code] || 'no_trovata';
    var P0 = B.P && B.P();
    if (B.esciRete && P0 && P0.spett) B.esciRete();
    B.ui.mostra('s-rete');
    tit.textContent = T('diretta'); sub.textContent = ''; corpo.innerHTML = ''; tasti.innerHTML = '';
    corpo.appendChild(el('p', 'rete-msg', T(k)));
    tasti.appendChild(tasto(T('altra'), 'rete-ok', function () { esciSpett('altra'); }));
    tasti.appendChild(tasto(TID ? T('t_torna') : T('torna'), '', function () { esciSpett('torna'); }));
  };
  // la lista IN DIRETTA: a chi l'ha chiesta (menu) + i nomi dei giocatori della stanza guardata (solo senza bot: l'ordine e' quello dei seggi)
  var ascoltaLista = [];
  cli.on.dirette = function (rooms) {
    if (cli.spettatore && cli.guardaRid) {
      for (var i = 0; i < rooms.length; i++) if (rooms[i].rid === cli.guardaRid) {
        var r = rooms[i], n = cli.st ? cli.st.eroi.length : (r.modo === 'duello' ? 2 : 6);
        if (!r.bot && r.nomi && r.nomi.length === n) { NOMI_SEGGI = r.nomi.slice(); cli.nomiSeggi = NOMI_SEGGI; }
      }
    }
    ascoltaLista.slice().forEach(function (f) { try { f(rooms); } catch (e) { } });
  };
  function esciSpett(dove) {
    if (cli.spettatore && !cli.elimGuarda) cli.smetti();
    if (window.SPETT && SPETT.nascondi) SPETT.nascondi();
    if (B.esciRete) B.esciRete();
    if (dove === 'torna' && TID) { tornaTorneo(); return; }
    B.ui.vai(window.__menuGB ? 's-gb' : 's-home', -1);
    if (dove === 'altra' && window.__menuGB_dirette) setTimeout(function () { window.__menuGB_dirette(); }, 420);
  }
  function condividi(rid) {
    rid = rid || cli.guardaRid || ''; if (!rid) return;
    try { if (window.parent && window.parent !== window && typeof window.parent.gembCondividi === 'function') { window.parent.gembCondividi(rid); return; } } catch (e) { }
    var fatto = function () { avvisa(T('copiato') + ': ' + rid, 3000); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(rid).then(fatto, fatto); return; } } catch (e) { }
    fatto();
  }
  // ================= GBT2311: ELIMINATO (sopravvivenza) =================
  cli.on.gok = function () { if (B.spettatoreRete) B.spettatoreRete(); if (window.SPETT && SPETT.gok) SPETT.gok(); if (document.getElementById('s-rete').classList.contains('on')) { sub.textContent = T('entro'); corpo.innerHTML = '<div class="rete-giro"></div>'; tasti.innerHTML = ''; } avvisa(T('guarda'), 3000); };
  cli.on.gno = function () { if (window.SPETT && SPETT.gno) SPETT.gno(); avvisa(T('gno'), 3000); };
  function esciPartita() {
    cli.esci(); if (B.esciRete) B.esciRete();
    if (TOUR) { tornaTorneo(); return; }
    B.ui.vai(window.__menuGB ? 's-gb' : 's-home', -1);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden && cli.fase === 'gioco') cli.sfondo(); });

  // ================= GBGRUPPI_2311: LA LOBBY DEL GRUPPO, LO SPETTATORE DEL GRUPPO, LA RIVINCITA =================
  // &lobby=<lid>: dal tasto ENTRA dell'annuncio nel gruppo (la mini app apre questa pagina). Si aspetta nella lobby
  // (quanti, su quanti, fra quanto) e si parte quando e' piena o allo scadere: i posti vuoti li prende il bot del motore
  // (solo gratis). &guardalid=<lid>: dal tasto GUARDA, la partita della lobby con 5 s di ritardo (si aspetta il via).
  TX.it.l_tit = 'Lobby del gruppo'; TX.en.l_tit = 'Group lobby';
  TX.it.l_entro = 'Prendo il tuo posto…'; TX.en.l_entro = 'Taking your seat…';
  TX.it.l_attesa = 'Aspetto gli altri del gruppo…'; TX.en.l_attesa = 'Waiting for the rest of the group…';
  TX.it.l_dentro = 'Dentro'; TX.en.l_dentro = 'In';
  TX.it.l_parte = 'si parte fra'; TX.en.l_parte = 'starts in';
  TX.it.l_bot = 'Allo scadere i posti vuoti vanno ai bot (servono almeno 2 persone).'; TX.en.l_bot = 'When time runs out bots take the empty seats (at least 2 people needed).';
  TX.it.l_soldi = 'Allo scadere si parte se ci sono abbastanza persone, altrimenti le poste tornano.'; TX.en.l_soldi = 'When time runs out the match starts if enough people joined, otherwise stakes are returned.';
  TX.it.l_esci = 'Esci dalla lobby'; TX.en.l_esci = 'Leave the lobby';
  TX.it.l_piena = 'La lobby è piena: ci vediamo alla prossima'; TX.en.l_piena = 'The lobby is full: see you next time';
  TX.it.l_chiusa = 'Questa lobby non c’è più'; TX.en.l_chiusa = 'This lobby is gone';
  TX.it.l_scaduta = 'Lobby chiusa: non c’erano abbastanza persone'; TX.en.l_scaduta = 'Lobby closed: not enough people';
  TX.it.l_gattesa = 'La partita non è ancora cominciata: aspetto il via…'; TX.en.l_gattesa = 'The match has not started yet: waiting for kick-off…';
  TX.it.rivincita = 'Rivincita'; TX.en.rivincita = 'Rematch';
  TX.it.r_attendi = 'Aspetto gli altri per la rivincita…'; TX.en.r_attendi = 'Waiting for the others to rematch…';
  TX.it.r_si = 'Ci sono'; TX.en.r_si = 'In';
  TX.it.r_tu = 'Tu'; TX.en.r_tu = 'You';
  TX.it.r_attesi = 'manca'; TX.en.r_attesi = 'missing';
  TX.it.r_chiede = 'vuole la rivincita: tocca «Rivincita»'; TX.en.r_chiede = 'wants a rematch: tap «Rematch»';
  TX.it.r_no = 'Niente rivincita'; TX.en.r_no = 'No rematch';
  TX.it.r_cerca = 'Cerca partita'; TX.en.r_cerca = 'Find a match';
  TX.it.r_menu = 'Menu'; TX.en.r_menu = 'Menu';
  TX.it.r_rifiutata = 'ha detto no'; TX.en.r_rifiutata = 'said no';
  TX.it.r_scaduta = 'non ha risposto'; TX.en.r_scaduta = 'did not answer';
  TX.it.r_non_collegato = 'è uscito dal gioco'; TX.en.r_non_collegato = 'left the game';
  TX.it.r_occupato = 'sta già giocando'; TX.en.r_occupato = 'is already playing';
  TX.it.r_non_disponibile = 'Rivincita non disponibile'; TX.en.r_non_disponibile = 'Rematch not available';
  var LOBBY = null, GLID = null;
  function alMenu() { if (B.esciRete) B.esciRete(); if (window.__menuGBapri) window.__menuGBapri(); else B.ui.vai('s-home', -1); }
  function mmss(s) { s = Math.max(0, Math.ceil(+s || 0)); var m = Math.floor(s / 60), r = s % 60; return m ? m + ':' + (r < 10 ? '0' : '') + r : r + ' s'; }
  function etichettaAncora(txt) {
    var fa = $('f-ancora'), g = fa && fa.querySelector('.g-l'); if (!g) return;
    if (!fa.dataset.txt) fa.dataset.txt = g.textContent;
    g.textContent = txt || fa.dataset.txt;
  }
  function avviaLobby(lid) {
    LOBBY = { lid: lid, attesa: true }; TOUR = null; scelta = null; confermato = false;
    B.ui.mostra('s-rete'); viaLobbyVideo();
    tit.textContent = T('l_tit'); sub.textContent = T('l_entro');
    corpo.innerHTML = '<div class="rete-giro"></div><div class="rete-coda"></div><p class="rete-msg rete-lnota"></p>'; tasti.innerHTML = '';
    tasti.appendChild(tasto(T('l_esci'), '', function () { cli.esciLobby(); LOBBY = null; alMenu(); }));
    assicura(function () { cli.lobby(lid); });
  }
  (function () {
    var coda0 = cli.on.coda;
    cli.on.coda = function (m) {
      if (!(LOBBY && LOBBY.attesa && m.lid)) { coda0(m); return; }
      var c = corpo.querySelector('.rete-coda'); if (!c) return;
      tit.textContent = T('l_tit') + ' · ' + T(m.modo || 'duello'); sub.textContent = T('l_attesa');
      c.textContent = T('l_dentro') + ' ' + m.n + '/' + (m.cap || '?') + (m.fra != null ? ' · ' + T('l_parte') + ' ' + mmss(m.fra) : '');
      var nt = corpo.querySelector('.rete-lnota'); if (nt) nt.textContent = T(m.stake > 0 ? 'l_soldi' : 'l_bot');
    };
    var part0 = cli.on.partita;
    cli.on.partita = function (m) { if (LOBBY) LOBBY.attesa = false; etichettaAncora(null); part0(m); };
    var no0 = cli.on.no;
    cli.on.no = function (m) {
      if (LOBBY && LOBBY.attesa) {
        var p = String((m && m.perche) || '');
        var k = /piena/.test(p) ? 'l_piena' : /scadut/.test(p) ? 'l_scaduta' : /already|impegn/.test(p) ? 'no_impegnato' : /auth/.test(p) ? null : 'l_chiusa';
        LOBBY = null;
        if (!k) { no0(m); return; }
        tit.textContent = T('l_tit'); sub.textContent = ''; corpo.innerHTML = ''; tasti.innerHTML = '';
        corpo.appendChild(el('p', 'rete-msg', T(k)));
        tasti.appendChild(tasto(T('r_cerca'), 'rete-ok', function () { entraCoda(modo); }));
        tasti.appendChild(tasto(T('r_menu'), '', alMenu));
        return;
      }
      no0(m);
    };
    var fine0 = cli.on.fine;
    cli.on.fine = function (m) { fine0(m); if (LOBBY && !TOUR && cli.io >= 0) etichettaAncora(T('rivincita')); };
    var ancora0 = B.reteAncora;
    B.reteAncora = function () { if (LOBBY && !TOUR) { rivChiedi(cli.rivOff || cli.rid); return; } ancora0(); };
  })();
  function rivChiedi(rid) {
    B.ui.vai('s-rete', 1);
    tit.textContent = T('rivincita'); sub.textContent = T('r_attendi'); corpo.innerHTML = '<div class="rete-giro"></div><div class="rete-coda"></div>'; tasti.innerHTML = '';
    tasti.appendChild(tasto(T('annulla'), '', function () { cli.rivNo(); LOBBY = null; etichettaAncora(null); alMenu(); }));
    setTimeout(function () { cli.rivOff = null; cli.rivincita(rid); }, 380);
  }
  cli.on.rivStato = function (m) {
    var c = corpo.querySelector('.rete-coda'); if (!c || !cli.riv) return;
    var si = [T('r_tu')].concat(m.si || []);
    c.textContent = T('r_si') + ': ' + si.join(', ') + ((m.attesi || []).length ? ' · ' + T('r_attesi') + ': ' + m.attesi.join(', ') : '') + ' · ' + mmss(m.scade);
  };
  cli.on.rivOfferta = function (m) { cli.rivOff = m.rid || null; etichettaAncora(T('rivincita')); avvisa((m.da || '?') + ' ' + T('r_chiede'), 6000); suono('vsColpo'); };
  cli.on.rivFine = function (m) {
    etichettaAncora(null); cli.rivOff = null;
    var chi = (m.chi || []).join(', '), k = 'r_' + (m.motivo || 'non_disponibile');
    var testo = m.motivo === 'non_disponibile' || m.motivo === 'errore' || m.motivo === 'saldo' ? T('r_non_disponibile') : (m.tu ? T('r_non_disponibile') : chi + ' ' + T(k));
    if (!document.getElementById('s-rete').classList.contains('on') || !/^(coda|menu)$/.test(cli.fase)) { avvisa(testo, 3500); return; }
    LOBBY = null;
    tit.textContent = T('r_no'); sub.textContent = ''; corpo.innerHTML = ''; tasti.innerHTML = '';
    corpo.appendChild(el('p', 'rete-msg', testo));
    tasti.appendChild(tasto(T('r_cerca'), 'rete-ok', function () { entraCoda(modo); }));
    tasti.appendChild(tasto(T('r_menu'), '', alMenu));
  };
  // lo spettatore dal gruppo: la stanza nasce al via della lobby; prima il server risponde «non ancora cominciata»
  function guardaLobby(lid) { GLID = { lid: lid, n: 0 }; if (guardaStanza('lid:' + lid)) sub.textContent = T('l_gattesa'); }
  cli.on.errore = function (m) {
    if (!GLID || cli.fase !== 'guarda' || cli.st || !/non .{0,3} ancora cominciata/.test(String((m && m.msg) || ''))) return;
    sub.textContent = T('l_gattesa');
    if (++GLID.n > 240) { cli.on.guardaNo({ code: 'trovata' }); return; }   // ~12 minuti (la lobby vive 10)
    var g = GLID;
    setTimeout(function () { if (GLID === g && cli.fase === 'guarda' && !cli.st) cli.guarda('lid:' + g.lid); }, 3000);
  };

  // ---------------- ingresso: il menu principale di Gem Brawl (ui/menu_gb.js) apre la coda di un modo ----------------
  window.__reteUI = { coda: function (m) { B.ui.vai('s-rete', 1); setTimeout(function () { entraCoda(m); }, 380); }, cli: cli,
    // GBT2311: per menu_gb.js e spettatore.js
    dirette: function (fn) { if (fn && ascoltaLista.indexOf(fn) < 0) ascoltaLista.push(fn); assicura(function () { cli.dirette(); }); },
    smettiLista: function (fn) { var i = ascoltaLista.indexOf(fn); if (i >= 0) ascoltaLista.splice(i, 1); },
    guarda: function (rid) { return guardaStanza(rid); }, condividi: condividi, tornei: tornaTorneo, tid: function () { return (TOUR && TOUR.tid) || TID; },
    esciSpett: esciSpett, guardaElim: function () { cli.guardaElim(); }, esciPartita: esciPartita, torneo: function () { return !!TOUR; } };
  schermoModi();

  // ---------------- gb-perf a schermo (?perf=1) ----------------
  if (Q.get('perf') === '1') setInterval(function () {
    if (cli.fase !== 'gioco' && cli.fase !== 'guarda') { perfEl.textContent = ''; return; }
    var r = cli.riassunto();
    perfEl.textContent = 'RTT ' + r.rtt_med + ' ms · vedo ' + r.vedo_med + ' ms · colpo ' + r.colpo_med + ' ms\ncorr ' + r.corr_mov + ' (' + r.corr_mov_med + ') · fermi ' + r.fermi + ' (' + r.fermo_max + ' ms) · ' + r.kbs + ' KB/s · div ' + r.div;
  }, 1000);

  // ---------------- prove: entra subito (&subito=1) o guarda (&guarda=1) ----------------
  var avviaSubito = function () {
    if (Q.get('lobby')) { avviaLobby(Q.get('lobby')); return; }   // GBGRUPPI_2311: ENTRA dal gruppo
    if (Q.get('guardalid')) { guardaLobby(Q.get('guardalid')); return; }   // GBGRUPPI_2311: GUARDA dal gruppo
    if (Q.get('torneo')) { avviaTorneo(Q.get('torneo'), TID); return; }   // GBT2311: match di torneo
    if (Q.get('guarda') && Q.get('guarda') !== '1') { guardaStanza(Q.get('guarda')); return; }   // GBT2311: diretta (rid rt...)
    if (Q.get('guarda') === '1') { assicura(function () { cli.guarda(Q.get('rid') || null); avvisa(T('guarda'), 3000); }); return; }
    if (Q.get('subito') === '1') { B.ui.mostra('s-rete'); entraCoda(modo); }
  };
  if (document.readyState === 'complete') setTimeout(avviaSubito, 300); else window.addEventListener('load', function () { setTimeout(avviaSubito, 300); });
})();
