/* TUTORIAL_2011 - HOP CLASH: il tutorial giocabile (hop.html?modo=tutorial). Fuori da modo=tutorial non fa NIENTE.
   Tutto in pagina: nessuna rete. Le tre chiamate del server di prova (/api/s, /api/azione, /api/nuova) le serve questo file
   rigiocando il fotogramma e il feed REGISTRATI dal motore vero (armate_rt.py, strumenti/registra_hop_tutorial.py ->
   tutorial_dati.js). Il tempo del server si ferma a ogni turno finche' il giocatore non fa la mossa del copione
   (la ninfea con l'anello giallo, SPECIALE quando serve, poi Pronto). Niente soldi, niente classifica, niente coda.
   Col guscio (index, stessa origine): SU {sm:'tut2011', g:'hop', ev:'pronto'|'esci'|'fine', fai:'gioca'|'allena'|''};
   GIU {sm:'tut2011_io', nome, foto}. Stato per le prove: window.__TUT2011. */
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  if (Q.get('modo') !== 'tutorial' || Q.get('rt') === '1') return;
  var ORIG = location.origin, IFR = window.parent !== window;
  var EN = false;
  try { EN = (Q.get('lang') || localStorage.getItem('hc_lang')) === 'en'; } catch (e) { EN = Q.get('lang') === 'en'; }
  var ST = window.__TUT2011 = {g: 'hop', passo: 0, tot: 8, finito: false, rete: 0, api: 0, sbagli: 0, fase: 'carica', attesa: ''};
  var VER = '';
  try { VER = (/[?&]v=([^&]+)/.exec(document.currentScript.src) || [])[1] || ''; } catch (e) {}
  function su(o) { if (!IFR) return; try { o.sm = 'tut2011'; o.g = 'hop'; window.parent.postMessage(o, ORIG); } catch (e) {} }

  /* ---- testi ---- */
  var TX = {
    it: {salta: 'Salta tutorial', avanti: 'Avanti', qui: 'Tocca qui', guida: 'Tutorial',
      intro: ['Benvenuto in HOP CLASH', 'Rane in rissa nello stagno: ognuno sceglie <b>in segreto</b> una ninfea e poi si salta <b>tutti insieme</b>. Vince l’ultima rana all’asciutto.<br>Tu sei <b>Tonfo</b>: 6 turni guidati contro due bot, gratis.'],
      fineInfo: ['Cuori e mappe', 'Ogni rana ha <b>4 cuori</b>: si perdono coi colpi e cadendo in acqua (cascata, gorghi). Ogni partita ha la sua mappa: <b>Stagno</b>, <b>Isole</b> (con i gorghi, come questa) e <b>Giardino</b> (una ninfea col potere in più per fila). Più avanti le ninfee rosse affondano e lo stagno si stringe.<br>Ogni rana ha la sua SPECIALE: Camu, per esempio, tira a sé il primo che vede in dritto o in diagonale, da 2 a 4 caselle.'],
      fineT: 'Hai finito il tutorial!', fineS: 'Ora sai saltare, usare le ninfee coi poteri, la SPECIALE, Ricarica e Radici. Pronto per una partita vera?',
      gioca: 'Gioca ora', allena: 'Allenati coi bot', rivedi: 'Rivedi il tutorial', boom: 'Tutorial finito!',
      no: 'Tocca la ninfea con l’anello giallo', premiSp: 'Premi SPECIALE', noSp: 'Prima premi SPECIALE, poi la ninfea', noPr: 'Prima scegli la ninfea indicata', pronto: 'Ora premi Pronto',
      lez: {salto: ['Il salto', 'Le ninfee <b>accese</b> sono quelle che raggiungi (fino a 2 caselle). Tocca quella con l’<b>anello giallo</b>, poi <b>Pronto</b>. Tutti saltano nello stesso istante.'],
        poteri: ['Le ninfee coi poteri', 'Il simbolo dice cosa fa la ninfea: scatta quando ci atterri. Salta sul <b>getto</b>: spruzza tutta la fila e Bruno perde un <b>cuore</b>.'],
        speciale: ['Il tasto SPECIALE', 'Ogni rana ha un potere suo. Tonfo ha la <b>Panciata</b>: dopo il salto spinge via di 2 chi gli sta attorno (-1). Premi <b>SPECIALE</b>, poi la ninfea accanto a Bruno: finirà nel <b>gorgo</b> e cadrà in acqua.'],
        ricarica: ['Ricarica', 'Sei sul bordo della <b>cascata</b>: a fine turno la corrente porta tutto a sinistra e chi la supera cade in acqua (-1). Salta via, sulla ninfea <b>Ricarica</b>: la SPECIALE torna pronta subito.'],
        radici: ['Radici', 'Lia sta per prendere l’<b>ondata</b>, che spinge via chi le sta attorno. Salta sulle <b>Radici</b>: questo turno e il prossimo nessuno ti sposta (il danno resta).'],
        speciale2: ['Di nuovo la SPECIALE', 'Grazie alla Ricarica la Panciata è già pronta. Bruno ha <b>un cuore solo</b>: premi <b>SPECIALE</b> e atterragli accanto per buttarlo in acqua. Occhio alle <b>Fauci</b>: è una trappola, chi ci finisce viene morso (-1).']}},
    en: {salta: 'Skip tutorial', avanti: 'Next', qui: 'Tap here', guida: 'Tutorial',
      intro: ['Welcome to HOP CLASH', 'A pond brawl: everyone picks a lily pad <b>in secret</b>, then everyone jumps <b>at once</b>. Last frog dry wins.<br>You are <b>Tonfo</b>: 6 guided turns against two bots, free.'],
      fineInfo: ['Hearts and maps', 'Every frog has <b>4 hearts</b>: you lose them to hits and by falling in the water (waterfall, whirlpools). Every match has its own map: <b>Pond</b>, <b>Islands</b> (with whirlpools, like this one) and <b>Garden</b> (one more power pad per row). Later on red pads sink and the pond shrinks.<br>Every frog has its own SPECIAL: Camu, for example, pulls in the first one it sees in a straight or diagonal line, 2 to 4 tiles away.'],
      fineT: 'Tutorial complete!', fineS: 'You can jump, use power pads, the SPECIAL, Recharge and Roots. Ready for a real match?',
      gioca: 'Play now', allena: 'Practice with bots', rivedi: 'Replay the tutorial', boom: 'Tutorial complete!',
      no: 'Tap the pad with the yellow ring', premiSp: 'Press SPECIAL', noSp: 'Press SPECIAL first, then the pad', noPr: 'Pick the marked pad first', pronto: 'Now press Ready',
      lez: {salto: ['Jumping', '<b>Lit</b> pads are the ones you can reach (up to 2 tiles). Tap the one with the <b>yellow ring</b>, then <b>Ready</b>. Everyone jumps at the same moment.'],
        poteri: ['Power pads', 'The symbol tells what the pad does: it fires when you land. Jump on the <b>jet</b>: it sprays the whole row and Bruno loses a <b>heart</b>.'],
        speciale: ['The SPECIAL button', 'Every frog has its own power. Tonfo has the <b>Belly flop</b>: after the jump it shoves everyone around by 2 (-1). Press <b>SPECIAL</b>, then the pad next to Bruno: he ends up in the <b>whirlpool</b> and falls in.'],
        ricarica: ['Recharge', 'You are on the edge of the <b>waterfall</b>: at the end of the turn the current carries everything left, and whoever goes over falls in (-1). Jump away onto the <b>Recharge</b> pad: your SPECIAL is ready again right away.'],
        radici: ['Roots', 'Lia is about to take the <b>wave</b>, which shoves away everyone around her. Jump on the <b>Roots</b>: this turn and the next nobody can move you (damage still hits).'],
        speciale2: ['SPECIAL again', 'Thanks to Recharge the Belly flop is ready already. Bruno has <b>one heart</b> left: press <b>SPECIAL</b> and land next to him to knock him in. Watch the <b>Snapper</b>: it is a trap, whoever ends up on it gets bitten (-1).']}}};
  var L = TX[EN ? 'en' : 'it'];

  /* ---- niente rete: solo i file della pagina ---- */
  function stessa(u) { try { return new URL(u, location.href).origin === ORIG; } catch (e) { return false; } }
  function risposta(o) { return Promise.resolve(new Response(JSON.stringify(o), {status: 200, headers: {'Content-Type': 'application/json'}})); }
  var fetch0 = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (u, o) {
    var url = (typeof u === 'string') ? u : (u && u.url) || '';
    var m = /\/api\/(s|azione|nuova)(\?.*)?$/.exec(url.replace(ORIG, ''));
    if (m) { ST.api++; return servi(m[1], m[2] || '', o); }
    if (!stessa(url) || /\/api\//.test(url)) { ST.rete++; return Promise.reject(new Error('tutorial: niente rete')); }
    return fetch0 ? fetch0(u, o) : Promise.reject(new Error('fetch'));
  };
  try {
    var XO = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (met, url) { if (!stessa(url) || /\/api\//.test(String(url))) { ST.rete++; throw new Error('tutorial: niente rete'); } return XO.apply(this, arguments); };
  } catch (e) {}
  try { window.WebSocket = function () { ST.rete++; throw new Error('tutorial: niente rete'); }; } catch (e) {}
  try { if (navigator.sendBeacon) navigator.sendBeacon = function () { ST.rete++; return false; }; } catch (e) {}
  // le preferenze della pagina vera non si toccano (lezione fatta, tutorial visto): restano quelle di prima
  try { var SI = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (/^hc_(lez|tut)$/.test(String(k))) return; return SI.apply(this, arguments); }; } catch (e) {}

  /* ---- i dati registrati ---- */
  var D = null, IO = {nome: '', foto: '', arrivato: !IFR}, T0 = Date.now();
  (function () { var s = document.createElement('script'); s.src = 'tutorial_dati.js' + (VER ? '?v=' + VER : ''); s.onload = function () { D = window.__HOP_TUT_DATI || null; }; s.onerror = function () { ST.errore = 'dati'; }; (document.head || document.documentElement).appendChild(s); })();
  window.addEventListener('message', function (ev) {
    if (ev.origin !== ORIG || ev.source !== window.parent) return;
    var d = ev.data; if (!d || typeof d !== 'object' || d.sm !== 'tut2011_io') return;
    IO.nome = String(d.nome || '').replace(/[\u0000-\u001f<>&"]/g, '').trim().slice(0, 16);
    var f = String(d.foto || ''); IO.foto = (/^https:\/\/[^\s"'()<>]{4,600}$/.test(f) || /^\/[^\s"'()<>]{2,600}$/.test(f) || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(f)) ? f : '';
    IO.arrivato = true;
  });
  window.__hopFoto = function (i) { return (+i === 0 && IO.foto) ? IO.foto : ''; };
  window.__hopUmano = function (i) { return +i === 0; };

  /* ---- il tempo del server (fermo nelle pause) ---- */
  var tv = 0, corre = false, da = 0, pausa = -1, avviato = false, scelta = false, prontoOk = false, rivelaFatte = 0, sp = null;
  function ora() { return corre ? tv + (performance.now() - da) / 1000 : tv; }
  function ferma(t) { tv = t; corre = false; }
  function vai() { tv = ora(); da = performance.now(); corre = true; }
  function prossimaPausa() { var p = D.pause, i; for (i = 0; i < p.length; i++) if (p[i].t > tv - 1e-6 && i > pausa) return i; return -1; }
  function tick() {
    if (!D || !corre) return;
    var t = ora(), i = prossimaPausa();
    if (i >= 0 && t >= D.pause[i].t) { ferma(D.pause[i].t); pausa = i; scelta = false; prontoOk = false; ST.attesa = D.pause[i].mossa[2] && !abon() ? 'speciale' : 'ninfea'; ST.fase = 'turno'; ST.passo = D.pause[i].turno; setTimeout(guida, 0); return; }
    if (i < 0 && t >= D.fine_t - 0.05 && ST.fase !== 'finale' && ST.fase !== 'fine' && ST.fase !== 'chiudi') { ferma(D.fine_t - 0.05); ST.fase = 'finale'; ST.attesa = 'rivela'; if (rivelaFatte >= D.pause.length) mostraFinale(); }
  }
  function servi(k, qs, o) {
    if (k === 'nuova') return risposta({ok: true});
    if (k === 's') {
      if (!D || !IO.arrivato && Date.now() - T0 < 1500) return risposta({nessuna: true});
      tick();
      var since = 0, mm = /since=(\d+)/.exec(qs); if (mm) since = +mm[1];
      var t = ora(), out;
      if (!avviato) {
        avviato = true; out = JSON.parse(JSON.stringify(D.snap0));
        if (IO.nome) out.nomi[0] = IO.nome;
        out.lezione = testo(out.lezione);
        out.feed = D.feed.filter(function (e) { return e._t <= 0; }).map(copia);
        mostraIntro();
      } else {
        out = {t: t, fine: false};
        out.feed = D.feed.filter(function (e) { return e.s > since && e._t <= t + 1e-6 && (e.k !== 'partita_finita' || ST.fase === 'chiudi'); }).map(copia);
      }
      out.t = t;
      return risposta(out);
    }
    if (k === 'azione') {
      var b = {}; try { b = JSON.parse((o && o.body) || '{}') || {}; } catch (e) { b = {}; }
      azione(b);
      return risposta({ok: true});
    }
    return risposta({ok: false});
  }
  // `t` di spara/mina e' il TIPO del potere (il motore lo scrive sopra il tempo): il tempo del rigioco e' `_t`
  function copia(e) { var c = JSON.parse(JSON.stringify(e)); delete c._t; if (c.k === 'stato' && 'lezione' in c) c.lezione = testo(c.lezione); return c; }
  function testo(z) { if (!z) return z; var t = L.lez[z.id]; if (t) z.tx = [t[0], t[1]]; return z; }

  /* ---- le mosse del giocatore ---- */
  function attesa() { return pausa >= 0 && !corre && ST.fase === 'turno' ? D.pause[pausa].mossa : null; }
  function azione(b) {
    var m = attesa(); if (!m) return;
    if (b.act === 'salta') {
      var ok = +b.ax === m[0] && +b.ay === m[1] && !!b.power === !!m[2];
      scelta = ok;
      if (!ok) { ST.sbagli++; avviso(+b.ax === m[0] && +b.ay === m[1] && m[2] && !b.power ? L.noSp : L.no); }
      else { avviso(L.pronto, true); }
      guida();
      return;
    }
    if (b.act === 'pronto') {
      if (!scelta) { ST.sbagli++; avviso(m[2] && !abon() ? L.noSp : L.noPr); return; }
      prontoOk = true; ST.attesa = 'rivela'; ST.fase = 'rivela'; togliGuida(); avviso('');
      vai();
    }
  }
  function abon() { try { return !!(window.__hopTutInt && window.__hopTutInt.abon()); } catch (e) { return false; } }

  /* ---- la regia della pagina ci avvisa (stadio.js chiama __hopTut.ev dopo ogni evento) ---- */
  window.__hopTut = {
    fermo: function () { return !corre; },
    boomFine: function () { return L.boom; },
    ev: function (e) {
      if (!e) return;
      if (e.k === 'mosse' && attesa()) guida();
      if (e.k === 'blocco') { rivelaFatte++; if (ST.fase === 'finale' && rivelaFatte >= D.pause.length) mostraFinale(); }
    },
    fine: function () { ST.passo = 8; ST.finito = true; ST.fase = 'fine'; segnaPasso(); togliGuida(); setTimeout(cartaFine, 1600); }
  };

  /* ---- interfaccia del tutorial (stile della pagina: vetro scuro dello stagno, giallo dei richiami) ---- */
  function el(t, c, h) { var d = document.createElement(t); if (c) d.className = c; if (h != null) d.innerHTML = h; return d; }
  function css() {
    if (document.getElementById('tut-css')) return;
    var s = el('style'); s.id = 'tut-css';
    s.textContent = '#tut-salta{position:fixed;z-index:12;left:8px;top:calc(70px + var(--st,0px));padding:7px 12px;border-radius:999px;font:600 12.5px var(--x-body);color:#fff;background:rgba(6,22,22,.8);border:1px solid rgba(190,255,235,.18);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer}'
      + '#tut-av{position:fixed;z-index:12;left:50%;transform:translateX(-50%);top:calc(64px + var(--st,0px));max-width:calc(100vw - 24px);padding:8px 14px;border-radius:14px;font:700 14px/1.25 var(--x-body);color:#2a1a00;background:#ffd23f;box-shadow:0 6px 18px rgba(0,0,0,.45);text-align:center;opacity:0;transition:opacity .2s;pointer-events:none}'
      + '#tut-av.on{opacity:1}#tut-av.ok{background:#7fffe0;color:#03211b}'
      + '@media (min-aspect-ratio: 6/5) and (min-width: 860px){#tut-av{top:18px}}'
      + '.tut-ev{outline:3px solid #ffd23f!important;outline-offset:3px;animation:tutPul 1.1s ease-in-out infinite!important}'
      + '@keyframes tutPul{50%{outline-color:rgba(255,210,63,.25);outline-offset:6px}}'
      + '#tut-fr{position:fixed;z-index:12;pointer-events:none;display:none;flex-direction:column;align-items:center;gap:2px;font:800 12px var(--x-body);color:#ffd23f;text-shadow:0 1px 4px rgba(0,0,0,.8);animation:tutSu 1s ease-in-out infinite}'
      + '#tut-fr svg{width:22px;height:22px;fill:#ffd23f;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}'
      + '@keyframes tutSu{50%{transform:translateY(-5px)}}'
      + '#tut-sch{position:fixed;inset:0;z-index:13;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(0,0,0,.5);transition:opacity .3s}'
      + '#tut-sch.nasc{opacity:0;pointer-events:none}'
      + '#tut-sch .card{width:min(440px,100%);max-height:100%;overflow:auto;padding:18px 18px 16px;background:rgba(6,22,22,.9);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,210,63,.45);border-radius:20px}'
      + '#tut-sch .su{font:600 11px var(--x-body);letter-spacing:.08em;text-transform:uppercase;color:#ffd23f}'
      + '#tut-sch h2{margin:4px 0 8px;font:400 28px/1.05 var(--x-show);letter-spacing:.01em;color:#ffb02e;text-shadow:0 3px 0 #7a3a00}'
      + '#tut-sch p{margin:0 0 12px;font:400 14.5px/1.5 var(--x-body);color:#e6eaee}#tut-sch p b{color:#ffd23f;font-weight:600}'
      + '#tut-sch .pt{display:flex;gap:4px;margin:4px 0 14px}#tut-sch .pt i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.15)}#tut-sch .pt i.ok{background:#ffd23f}'
      + '#tut-sch .az{display:flex;flex-direction:column;gap:8px}#tut-sch .az button{border:0;border-radius:14px;min-height:50px;font:700 16px var(--x-body);cursor:pointer}'
      + '#tut-sch .az .p{background:#ffd23f;color:#2a1a00;box-shadow:0 4px 0 #a07c00}#tut-sch .az .s{background:rgba(255,255,255,.1);color:#fff;box-shadow:inset 0 0 0 1px rgba(190,255,235,.18)}'
      + '#tut-sch .az .t{background:none;color:#bfe9dd;min-height:38px;font-weight:600;font-size:14px}'
      + '#tut-sch .vinc{display:flex;align-items:flex-end;gap:12px}#tut-sch .vinc img{height:110px;width:auto;filter:drop-shadow(0 8px 10px rgba(0,0,0,.55))}';
    document.head.appendChild(s);
  }
  var UI = {};
  function monta() {
    if (UI.salta || !document.body) return;
    css();
    UI.salta = el('button', '', L.salta); UI.salta.id = 'tut-salta'; UI.salta.type = 'button';
    UI.salta.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); esci(); });
    UI.av = el('div', ''); UI.av.id = 'tut-av';
    UI.fr = el('div', '', '<span></span><svg viewBox="0 0 24 24"><path d="M12 22 3 11h6V2h6v9h6z"/></svg>'); UI.fr.id = 'tut-fr';
    UI.fr.querySelector('span').textContent = L.qui;
    UI.sch = el('div', 'nasc'); UI.sch.id = 'tut-sch';
    document.body.appendChild(UI.salta); document.body.appendChild(UI.av); document.body.appendChild(UI.fr); document.body.appendChild(UI.sch);
  }
  function esci() { ST.uscito = true; if (IFR) su({ev: 'esci', fai: ''}); else cartaFine(true); }
  var avT = 0;
  // la pillola sta subito sopra la scheda della lezione (o sopra la barra dei comandi)
  function posAv() { try { if (!UI.av) return; var c = document.getElementById('lezc'), b = document.getElementById('bot'), r = null;
    if (c && !c.classList.contains('nasc') && c.offsetHeight) r = c.getBoundingClientRect(); else if (b && b.offsetHeight && !b.classList.contains('via')) r = b.getBoundingClientRect();
    if (r) { UI.av.style.top = 'auto'; UI.av.style.bottom = Math.round(innerHeight - r.top + 8) + 'px'; } else { UI.av.style.bottom = ''; UI.av.style.top = ''; } } catch (e) {} }
  function avviso(t, ok) { posAv(); monta(); if (!UI.av) return; clearTimeout(avT); UI.av.textContent = t || ''; UI.av.classList.toggle('ok', !!ok); UI.av.classList.toggle('on', !!t); if (t && !ok) avT = setTimeout(function () { UI.av.classList.remove('on'); }, 2600); }
  function segnaPasso() { /* lo stato per le prove e per il guscio */ }
  // la freccia sul comando da toccare: SPECIALE (se serve e non e' ancora attiva) o Pronto (dopo la ninfea giusta)
  var EV = null, frT = 0;
  function guida() {
    monta(); var m = attesa(); if (!m) { togliGuida(); return; }
    var bersaglio = null;
    if (scelta) bersaglio = document.getElementById('b-pronto');
    else if (m[2] && !abon()) bersaglio = document.getElementById('b-abil');
    if (EV && EV !== bersaglio) EV.classList.remove('tut-ev');
    EV = bersaglio;
    if (EV) EV.classList.add('tut-ev');
    if (EV && !(UI.av && UI.av.classList.contains('on') && !UI.av.classList.contains('ok'))) avviso(scelta ? L.pronto : L.premiSp, true);
    ST.attesa = scelta ? 'pronto' : (m[2] && !abon() ? 'speciale' : 'ninfea');
    clearInterval(frT); posFr(); frT = setInterval(function () { if (attesa() && !scelta && m[2] && abon() && EV) { guida(); return; } if (attesa() && !scelta && m[2] && !abon() && !EV) { guida(); return; } posFr(); }, 250);
  }
  // niente freccia sopra il tasto (sul telefono finiva sopra il testo della barra): il tasto pulsa e la pillola dice cosa fare
  function posFr() {
    if (!UI.fr) return;
    UI.fr.style.display = 'none'; posAv();
    if (true) return;
    var r = EV.getBoundingClientRect();
    UI.fr.style.display = 'flex'; UI.fr.style.left = (r.left + r.width / 2 - 30) + 'px'; UI.fr.style.width = '60px'; UI.fr.style.top = (r.top - 48) + 'px';
  }
  function togliGuida() { clearInterval(frT); if (EV) EV.classList.remove('tut-ev'); EV = null; if (UI.av && UI.av.classList.contains('ok')) UI.av.classList.remove('on'); if (UI.fr) UI.fr.style.display = 'none'; }
  function punti(k) { var h = ''; for (var i = 1; i <= ST.tot; i++) h += '<i class="' + (i <= k ? 'ok' : '') + '"></i>'; return '<div class="pt">' + h + '</div>'; }
  function scheda(sopra, titolo, corpo, tasti, img) {
    monta(); var c = UI.sch;
    c.innerHTML = '<div class="card"><div class="su"></div>' + (img ? '<div class="vinc"><img alt="" decoding="async"><h2></h2></div>' : '<h2></h2>') + '<p></p><div class="pt-x"></div><div class="az"></div></div>';
    c.querySelector('.su').textContent = sopra; c.querySelector('h2').textContent = titolo; c.querySelector('p').innerHTML = corpo;
    if (img) { var im = c.querySelector('img'); im.src = img; im.onerror = function () { im.remove(); }; }
    c.querySelector('.pt-x').outerHTML = punti(ST.passo);
    var az = c.querySelector('.az');
    tasti.forEach(function (t) { var b = el('button', t[0], ''); b.type = 'button'; b.textContent = t[1]; b.setAttribute('data-tut', t[3] || ''); b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); t[2](); }); az.appendChild(b); });
    c.classList.remove('nasc');
  }
  function chiudiScheda() { if (UI.sch) UI.sch.classList.add('nasc'); }
  function mostraIntro() {
    ST.fase = 'intro'; ST.attesa = 'avanti'; ST.passo = 0;
    var apri = function () {
      if (!document.getElementById('carica') || document.getElementById('carica').classList.contains('via')) {
        scheda(L.guida + ' · HOP CLASH', L.intro[0], L.intro[1], [['p', L.avanti, function () { chiudiScheda(); ST.fase = 'gioco'; ST.attesa = ''; vai(); }, 'avanti'], ['t', L.salta, esci, 'salta']]);
        su({ev: 'pronto', fai: ''});
      } else setTimeout(apri, 150);
    };
    setTimeout(apri, 300);
  }
  function mostraFinale() {
    if (ST.finaleMostrato) return; ST.finaleMostrato = true;
    ST.passo = 7; ST.attesa = 'avanti';
    setTimeout(function () {
      scheda(L.guida + ' · 7/8', L.fineInfo[0], L.fineInfo[1], [['p', L.avanti, function () { chiudiScheda(); ST.fase = 'chiudi'; ST.attesa = ''; tv = D.fine_t; corre = false; }, 'avanti'], ['t', L.salta, esci, 'salta']]);
    }, 400);
  }
  function cartaFine(saltato) {
    ST.passo = 8; ST.finito = !saltato; ST.fase = 'fine'; ST.attesa = 'fine'; togliGuida(); avviso('');
    if (UI.salta) UI.salta.style.display = 'none';
    try { document.getElementById('fine').classList.add('nasc'); document.getElementById('lezc').classList.add('nasc'); } catch (e) {}
    var vai2 = function (fai) { return function () { if (IFR) su({ev: 'fine', fai: fai}); else location.href = 'hop.html'; }; };
    scheda(L.guida + ' · HOP CLASH', L.fineT, L.fineS, [['p', L.gioca, vai2('gioca'), 'gioca'], ['s', L.allena, vai2('allena'), 'allena'],
      ['t', L.rivedi, function () { location.reload(); }, 'rivedi']], 'assets_bayou/pg/tonfo_win.webp');
  }
  // «Salta tutorial» sta subito sotto la barra dei giocatori (a sinistra): li' non c'e' niente della pagina
  function posSalta() { try { if (!UI.salta) return; var t = document.getElementById('top'); if (!t || !t.offsetHeight) return; var r = t.getBoundingClientRect(); UI.salta.style.left = Math.max(8, r.left + 2) + 'px'; UI.salta.style.top = Math.round(r.bottom + 8) + 'px'; } catch (e) {} }
  setInterval(function () { tick(); posSalta(); }, 100);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monta); else monta();
  ST.cella = function () { try { var m = attesa(); if (!m || !window.__hopTutInt) return null; return window.__hopTutInt.cella(m[0], m[1]); } catch (e) { return null; } };
  ST.mossa = function () { var m = attesa(); return m ? {x: m[0], y: m[1], sp: !!m[2]} : null; };
  window.addEventListener('error', function (e) { (ST.errori = ST.errori || []).push(String(e && e.message || '')); });
})();
