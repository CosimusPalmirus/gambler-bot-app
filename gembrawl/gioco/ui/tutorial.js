// GEM BRAWL — TUTORIAL GIOCATO (24/11, richiesta del proprietario: «un tasto Tutorial; le scritte non devono MAI nascondere
// il personaggio o gli elementi importanti del gioco»). Sostituisce il mini tutorial di 3 passi di gioco.js (riquadro al centro,
// sopra l'eroe).
//   · Arena di prova PRIVATA (13x16, non entra in window.MAPPE: la firma del motore online non cambia), modo Arraffa gemme,
//     il tuo eroe contro un bersaglio-BOT fermo che alla fine diventa un bot debole. Tu non puoi andare KO.
//   · 9 passi, ognuno si completa FACENDO la cosa: muoviti, tocco breve, trascina per mirare, munizioni, SUPER, GADGET,
//     cespuglio, gemme, sfida al bot. Piccolo premio (spunta, scintille, suono) a ogni passo. SALTA sempre visibile; RIPETI
//     alla fine e dal tasto TUTORIAL del menu. IT/EN. Proposto UNA volta, al primo «Gioca» (GBTUT.proponi).
//   · REGOLA: il riquadro delle scritte e la mano non coprono MAI l'eroe (rettangolo proiettato, con barra e nome), la zona
//     davanti a lui, i nemici, i proiettili, la levetta, i tasti. A ogni fotogramma si provano 8 posti (in alto sotto la barra,
//     ai lati, in basso fra i comandi) e si sceglie il primo libero; se quello di prima è ancora libero si resta lì.
//   · Agganci in gioco.js: B.ponteTut + P.gbtut.inizia/passo/frame (toppa _levelup/tutorial_2411/toppa/applica.py).
//   · Prove: GBTUT.misure() dà i rettangoli (riquadro, mano, eroe, nemici, comandi) — _levelup/tutorial_2411/prova_tutorial.mjs.
(function () {
  'use strict';
  var B = window.__brawl;
  if (!B || !B.ponteTut) return;
  var PT = B.ponteTut, M = window.Motore, D = window.Disegno;
  var Q = new URLSearchParams(location.search);
  var DEBUG = Q.get('tutdebug') === '1';
  function R3() { return window.R3; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function EN() { return PT.lang() === 'en'; }
  function L(it, en) { return EN() ? en : it; }
  function suono(n, a) { try { var S = window.Suoni; if (S && S[n]) S[n](a); } catch (e) { } }
  function vibra(ms) { try { if (ls('gb_vib') !== '0' && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // ---------------- arena di prova (privata) ----------------
  // '.' pavimento, '#' muro, 'B' cespuglio, 'G' miniera, '1' tu, '2' il bot. Righe intere (niente specchio).
  var RIGHE = [
    '.............',
    '......G......',
    '.............',
    '.............',
    '.........2...',
    '.............',
    '.BBB.........',
    '.BBB....##...',
    '.BBB.........',
    '.............',
    '.............',
    '.............',
    '.............',
    '......1......',
    '.............',
    '.............'
  ];
  var COD = { '.': 0, '#': 1, 'B': 2, 'C': 3, 'T': 4, 'G': 0, '1': 0, '2': 0 };
  function mappa() {
    var w = RIGHE[0].length, h = RIGHE.length, g = new Array(w * h), sp = [[], []], gem = null;
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) {
      var ch = RIGHE[r][c]; g[r * w + c] = COD[ch];
      if (ch === '1') sp[0].push({ x: c + 0.5, y: r + 0.5 });
      if (ch === '2') sp[1].push({ x: c + 0.5, y: r + 0.5 });
      if (ch === 'G') gem = { x: c + 0.5, y: r + 0.5 };
    }
    return { id: 'tutorial', nome_it: 'Arena di prova', nome_en: 'Training Arena', modi: ['gemme'], tema: 0, w: w, h: h, g: g, sp: sp, ffa: [], gem: gem, righe: RIGHE.slice(), gas: null };
  }
  var CESPUGLIO = { x: 2.5, y: 7.5 };

  // ---------------- testi (corti) ----------------
  // [titolo, telefono, PC]
  var TX = {
    it: {
      muovi: ['MUOVITI', 'Trascina la levetta a sinistra: vai nel cerchio', 'WASD o frecce: vai nel cerchio'],
      tocco: ['SPARA', 'Tocco breve a destra: spari dritto davanti a te', 'Clic sul bersaglio: spari'],
      mira: ['MIRA', 'Trascina a destra verso il bersaglio e rilascia', 'Punta il bersaglio col mouse e clicca'],
      ricarica: ['MUNIZIONI', 'Hai 3 colpi (le tacche arancio). Sparali tutti: si ricaricano da soli', 'Hai 3 colpi (le tacche arancio). Sparali tutti: si ricaricano da soli'],
      super: ['SUPER', 'Colpisci il bersaglio: ogni colpo carica la SUPER', 'Colpisci il bersaglio: ogni colpo carica la SUPER'],
      super2: ['SUPER!', 'È carica: tocca il tasto giallo (o trascinalo per mirare)', 'È carica: tasto destro o E per lanciarla'],
      gadget: ['GADGET', 'Tocca il tasto piccolo. Poi si ricarica: l’anello si riempie e i numeri contano i secondi.', 'Premi Q. Poi si ricarica: l’anello del tasto si riempie e i numeri contano i secondi.'],   // GADGET A RICARICA (24/11): testi provvisori, da allineare a brawl_3010/AVANZAMENTO_cooldown_gadget.md
      cesp: ['CESPUGLI', 'Entra nel cespuglio: lì dentro i nemici non ti vedono', 'Entra nel cespuglio: lì dentro i nemici non ti vedono'],
      gemme: ['GEMME', 'Raccogli le 3 gemme della miniera', 'Raccogli le 3 gemme della miniera'],
      bot: ['SFIDA', 'Il bot vuole le tue gemme: mettilo KO!', 'Il bot vuole le tue gemme: mettilo KO!'],
      bravo: ['BRAVO!', '', ''],
      salta: 'SALTA ›', fine: 'TUTORIAL COMPLETATO!',
      fine1: 'Arraffa gemme: la squadra che tiene 10 gemme per 15 secondi vince.',
      fine2: 'Se vai KO, le tue gemme cadono a terra: proteggi chi le porta.',
      gioca: 'GIOCA', ripeti: 'Ripeti', chiudi: 'Chiudi',
      prop_t: 'Prima partita?', prop_p: 'Un tutorial veloce (2 minuti) in un\'arena di prova: comandi, SUPER, gadget e gemme.', prop_si: 'Fai il tutorial', prop_no: 'No, gioca',
      tasto: 'Tutorial'
    },
    en: {
      muovi: ['MOVE', 'Drag the left stick: walk into the circle', 'WASD or arrows: walk into the circle'],
      tocco: ['SHOOT', 'Quick tap on the right: shoot straight ahead', 'Click the target: shoot'],
      mira: ['AIM', 'Drag on the right towards the target and let go', 'Point at the target with the mouse and click'],
      ricarica: ['AMMO', 'You have 3 shots (orange marks). Use them all: they reload by themselves', 'You have 3 shots (orange marks). Use them all: they reload by themselves'],
      super: ['SUPER', 'Hit the target: every hit charges your SUPER', 'Hit the target: every hit charges your SUPER'],
      super2: ['SUPER!', 'Charged: tap the yellow button (or drag it to aim)', 'Charged: right click or E to fire it'],
      gadget: ['GADGET', 'Tap the small button. Then it recharges: the ring fills up and the numbers count down the seconds.', 'Press Q. Then it recharges: the button ring fills up and the numbers count down the seconds.'],   // GADGET WITH COOLDOWN (24/11): provisional
      cesp: ['BUSHES', 'Step into the bush: enemies can\'t see you in there', 'Step into the bush: enemies can\'t see you in there'],
      gemme: ['GEMS', 'Grab the 3 gems from the mine', 'Grab the 3 gems from the mine'],
      bot: ['CHALLENGE', 'The bot wants your gems: knock it out!', 'The bot wants your gems: knock it out!'],
      bravo: ['NICE!', '', ''],
      salta: 'SKIP ›', fine: 'TUTORIAL COMPLETE!',
      fine1: 'Gem Rush: the team that holds 10 gems for 15 seconds wins.',
      fine2: 'If you get knocked out, your gems drop: protect the carrier.',
      gioca: 'PLAY', ripeti: 'Replay', chiudi: 'Close',
      prop_t: 'First match?', prop_p: 'A quick tutorial (2 minutes) in a training arena: controls, SUPER, gadget and gems.', prop_si: 'Play the tutorial', prop_no: 'No, just play',
      tasto: 'Tutorial'
    }
  };
  function tx(k) { var t = TX[EN() ? 'en' : 'it']; return t[k]; }
  var PASSI = ['muovi', 'tocco', 'mira', 'ricarica', 'super', 'gadget', 'cesp', 'gemme', 'bot'];

  // ---------------- DOM ----------------
  var css = null, radice = null, box = null, mano = null, salta = null, dbg = null;
  function costruisciDom() {
    if (radice) return;
    radice = el('div', 'tut'); radice.id = 'tut';
    box = el('div', 'tut-box', '<div class="tut-testa"><span class="tut-n"></span><b class="tut-tit"></b><i class="tut-ok">✓</i><button class="tut-salta" type="button"></button></div><p class="tut-p"></p><div class="tut-barra"><i></i></div>');
    mano = el('div', 'tut-mano', '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M4 22 H36 M26 11 L38 22 L26 33" fill="none" stroke="#120826" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 22 H36 M26 11 L38 22 L26 33" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    salta = box.querySelector('.tut-salta');
    salta.onclick = function (e) { e.stopPropagation(); suono('indietro'); chiudi('saltato'); };
    radice.appendChild(box); radice.appendChild(mano);
    if (DEBUG) { dbg = el('canvas', 'tut-dbg'); radice.appendChild(dbg); }
    document.body.appendChild(radice);
  }
  function togliDom() { if (radice) { radice.remove(); radice = box = mano = salta = dbg = null; } }

  // ---------------- stato ----------------
  var T = null;   // il tutorial in corso
  var LIM0 = null;

  function apri() {
    if (T || !M || !window.EROI) return false;
    var P0 = PT.P(); if (P0) return false;   // una partita è già in corso
    var eroe = PT.eroe(); if (!window.EROI[eroe]) eroe = 'samurai';
    var ctrl = nuovoCtrl();
    var cfg = { mappa: mappa(), giocatori: [{ eroe: eroe, squadra: 0, bot: 0 }, { eroe: 'bot', squadra: 1, bot: 1 }], ctrl: ctrl };
    var prima = PT.avvia(cfg);
    if (prima === false) return false;
    T = ctrl; T.modoPrima = prima;
    ls('gb_tut_proposto', '1');
    togliFine();
    return true;
  }

  // ---- il regista: una partita, 9 passi ----
  function nuovoCtrl() {
    var c = {
      P: null, i: -1, fase: 'attesa', t: 0, okT: 0, n: 0, base: 0, vistoVuoto: false, nelCesp: 0, prepara: true,
      bersaglio: null, segno: null, gemme: [], dan0: 0, rilascio: { tipo: '', t: 0, sup: false }, mira0: null, colpi: { tap: 0, drag: 0, tutti: 0 },
      supPronta: false, luce: 0, lay: { cand: -1 }, fatti: 0
    };
    c.inizia = function (P) {
      c.P = P;
      if (LIM0 == null) LIM0 = M.LIMITE.gemme;
      M.LIMITE.gemme = 3600;            // nessuna fine a tempo nell'arena di prova (si rimette alla chiusura)
      P.st.prossimaGemma = 1e9;          // la miniera la apre il tutorial
      var bot = P.st.eroi[1];
      c.vmaxBot = bot.vmax; bot.vmax = bot.vmax * 4; bot.vita = bot.vmax;   // bersaglio robusto (si ricarica sotto metà)
      costruisciDom();
      salta.textContent = tx('salta');
      radice.classList.add('on'); box.classList.remove('vis');
      requestAnimationFrame(guardia);
    };
    // un passo del motore (DT): prima di M.passo, dopo l'input del giocatore
    c.passo = function (st, IA) {
      var me = st.eroi[0], bot = st.eroi[1];
      for (var i = 1; i < st.eroi.length; i++) { var ii = st.inp[i]; ii.mx = ii.my = 0; ii.att = ii.sup = ii.gad = 0; }
      if (c.fase === 'gioco' && PASSI[c.i] === 'bot' && bot.vivo) IA.pensa(st, 1);
      // arena sicura: tu non vai mai KO
      if (me.vivo && me.vita < me.vmax * 0.55) me.vita = me.vmax * 0.55;
      if (PASSI[c.i] !== 'bot' && bot.vivo && bot.vita < bot.vmax * 0.5) bot.vita = bot.vmax;
      var dt = M.DT;
      if (c.fase === 'attesa') { entra(0); return; }
      c.t += dt;
      // colpi a segno: i danni fatti salgono
      var colpo = me.dan > c.dan0 + 0.5; c.dan0 = me.dan;
      if (colpo) {
        var adesso = performance.now(), tipo = PT.IN.desktop ? 'pc' : (adesso - c.rilascio.t < 1500 ? c.rilascio.tipo : 'tap');
        c.colpi.tutti++; if (tipo === 'tap' || tipo === 'pc') c.colpi.tap++; if (tipo === 'drag' || tipo === 'pc') c.colpi.drag++;
      }
      if (c.fase === 'bravo') { c.okT -= dt; if (c.okT <= 0) { if (c.i + 1 < PASSI.length) entra(c.i + 1); else fineGioco(); } return; }
      if (c.fase !== 'gioco') return;
      var id = PASSI[c.i], fatto = false;
      if (id === 'muovi') {
        fatto = Math.hypot(me.x - c.segno.x, me.y - c.segno.y) < 0.75;
      } else if (id === 'tocco') {
        // il tocco breve spara dove guarda l'eroe: se il bersaglio non è più lì davanti (affondi, scatti), ci torna
        var bx = bot.x - me.x, by = bot.y - me.y, bl = Math.hypot(bx, by) || 1, fronte = (bx * Math.cos(me.aim) + by * Math.sin(me.aim)) / bl;
        if (bot.vivo && (st.t - me.tAtt) * dt > 0.7 && (fronte < 0.85 || bl > distTiro(me) * 1.6)) davanti(me, bot);
        fatto = c.colpi.tap >= 2 || c.colpi.tutti >= 4;
      } else if (id === 'mira') {
        fatto = c.colpi.drag >= 1 || c.colpi.tutti >= 4;
      } else if (id === 'ricarica') {
        if (me.ammo < 1) c.vistoVuoto = true;
        c.prog = c.vistoVuoto ? 0.5 + 0.5 * Math.min(1, me.ammo / 2) : (3 - Math.min(3, me.ammo)) / 3 * 0.5;
        fatto = c.vistoVuoto && me.ammo >= 2;
      } else if (id === 'super') {
        if (colpo && me.sup < 1) { me.sup = Math.min(1, me.sup + 0.2); }   // carica più svelta che in partita: 4-5 colpi
        if (me.sup >= 1 && !me.supPronta) { me.supPronta = true; }
        if (me.supPronta && !c.supPronta) { c.supPronta = true; c.luce = 1.6; suono('superPronta'); scrivi(); }
        c.prog = me.sup;
        fatto = me.supUsate > c.base;
      } else if (id === 'gadget') {
        fatto = me.gadUsate > c.base;
      } else if (id === 'cesp') {
        var dentro = M.tile(st, Math.floor(me.x), Math.floor(me.y)) === M.CESP;
        c.nelCesp = dentro ? c.nelCesp + dt : 0;
        fatto = c.nelCesp > 0.6;
      } else if (id === 'gemme') {
        c.prog = Math.min(1, me.gem / 3);
        fatto = me.gem >= 3;
      } else if (id === 'bot') {
        c.prog = bot.vivo ? 1 - bot.vita / bot.vmax : 1;
        fatto = !bot.vivo;
      }
      if (fatto) completa();
    };
    function piazza(h, x, y) {
      var st = c.P.st;
      x = Math.max(0.8, Math.min(st.w - 0.8, x)); y = Math.max(0.8, Math.min(st.h - 0.8, y));
      h.x = h.ox = x; h.y = h.oy = y; h.vx = h.vy = 0; h.kx = h.ky = 0;
    }
    function libero(x, y) { var st = c.P.st; if (x < 0.8 || y < 0.8 || x > st.w - 0.8 || y > st.h - 0.8) return false; var t = M.tile(st, Math.floor(x), Math.floor(y)); return t === 0; }
    function distTiro(me) { var a = me.d.att, g = a.gitt || a.dist || a.raggio || 4; return Math.max(1.7, Math.min(4, g * 0.6)); }
    // il bersaglio dritto davanti all'eroe (dove va il tocco breve); se lì c'è un muro o il bordo, l'eroe si gira verso un posto libero
    function davanti(me, bot) {
      var d = distTiro(me), a = me.aim, ang = [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 3.14];
      for (var k = 0; k < ang.length; k++) {
        var x = me.x + Math.cos(a + ang[k]) * d, y = me.y + Math.sin(a + ang[k]) * d;
        if (libero(x, y)) { if (k) me.aim = a + ang[k]; piazza(bot, x, y); return; }
      }
    }
    function entra(i) {
      var st = c.P.st, me = st.eroi[0], bot = st.eroi[1];
      c.i = i; c.fase = 'gioco'; c.t = 0; c.prog = -1; c.colpi = { tap: 0, drag: 0, tutti: 0 }; c.dan0 = me.dan; c.segno = null; c.luce = 0;
      var id = PASSI[i];
      if (id === 'muovi') {
        c.segno = { x: me.x, y: me.y - 3, r: 0.7 };
        if (bot.vivo) piazza(bot, 10.5, 2.5);
      } else if (id === 'tocco' || id === 'mira' || id === 'ricarica' || id === 'super' || id === 'gadget') {
        if (id === 'tocco') davanti(me, bot);
        if (id === 'mira') {
          var d = distTiro(me), a = me.aim, ang = [1.1, -1.1, 0.8, -0.8, 2.2, -2.2];
          for (var k = 0; k < ang.length; k++) {
            var x = me.x + Math.cos(a + ang[k]) * d, y = me.y + Math.sin(a + ang[k]) * d;
            if (libero(x, y)) { piazza(bot, x, y); break; }
            if (k === ang.length - 1) davanti(me, bot);
          }
        }
        if (id === 'super') { c.base = me.supUsate; c.supPronta = false; if (me.sup >= 1) { c.supPronta = true; c.luce = 1.6; } }
        if (id === 'gadget') { c.base = me.gadUsate; me.gadCd = 0; c.luce = 1.6; }
        if (id === 'ricarica') { c.vistoVuoto = me.ammo < 1; }
      } else if (id === 'cesp') {
        c.segno = { x: CESPUGLIO.x, y: CESPUGLIO.y, r: 1.4 };
        if (bot.vivo) piazza(bot, 10.5, 2.5);
      } else if (id === 'gemme') {
        var G = st.M.gem, pos = [[-0.9, 0.9], [0, 1.4], [0.9, 0.9]], n = 0;
        c.gemme = [];
        for (var j = 0; j < st.ge.length && n < 3; j++) {
          var g = st.ge[j]; if (g.vivo) continue;
          g.vivo = 1; g.x = G.x + pos[n][0]; g.y = G.y + pos[n][1]; g.vx = g.vy = 0; g.t = 0.4; g.o = 0; c.gemme.push(g); n++;
        }
        c.segno = { x: G.x, y: G.y + 1.1, r: 1.5, gemme: true };
        suono('gemma');
      } else if (id === 'bot') {
        bot.vmax = c.vmaxBot; bot.vita = Math.round(bot.vmax * 0.6);
        if (bot.vivo) piazza(bot, st.M.sp[1][0].x, st.M.sp[1][0].y);
      }
      scrivi();
    }
    function completa() {
      c.fase = 'bravo'; c.okT = PASSI[c.i] === 'bot' ? 1.4 : 0.95; c.fatti++;
      premio();
    }
    function fineGioco() {
      c.fase = 'fine';
      ls('gb_tut_fatto', '1'); ls('gb_tutorial', '1');
      suono('livello');
      setTimeout(function () { if (T === c) chiudi('fatto'); }, 0);   // fuori dal passo del motore: il ciclo di gioco.js usa ancora P dopo questo passo
    }
    c.frame = function (dt, g) { if (T === c) disegna(dt, g); };
    c.stato = function () { return { passo: c.i, id: PASSI[c.i] || '', fase: c.fase, t: c.t, prog: c.prog, totale: PASSI.length, supPronta: c.supPronta }; };
    return c;
  }

  // ---------------- scritte ----------------
  function scrivi() {
    if (!T || !box) return;
    var id = PASSI[T.i], q = tx(id === 'super' && T.supPronta ? 'super2' : id), pc = PT.IN.desktop;
    box.querySelector('.tut-n').textContent = (T.i + 1) + '/' + PASSI.length;
    box.querySelector('.tut-tit').textContent = q[0];
    box.querySelector('.tut-p').textContent = pc ? q[2] : q[1];
    box.classList.remove('ok'); box.querySelector('.tut-ok').classList.remove('pop');
    box.classList.toggle('con-barra', id === 'ricarica' || id === 'super' || id === 'gemme' || id === 'bot');
    box.classList.add('vis');
    box.dataset.passo = id;
    T.misH = {};   // le altezze si rimisurano
    T.lay.cand = -1;
  }
  function premio() {
    if (!box) return;
    var q = tx('bravo');
    box.querySelector('.tut-tit').textContent = q[0];
    box.classList.add('ok');
    var b = box.querySelector('.tut-ok'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    for (var i = 0; i < 9; i++) {
      var s = el('i', 'tut-scint'); s.style.setProperty('--a', (i * 40) + 'deg'); s.style.setProperty('--d', (26 + (i % 3) * 10) + 'px');
      b.appendChild(s); (function (s) { setTimeout(function () { s.remove(); }, 700); })(s);
    }
    try { var S = window.Suoni; if (S && S.caricaNota) S.caricaNota(Math.min(2, T.fatti % 3)); else if (S && S.tasto) S.tasto(); } catch (e) { }
    vibra(18);
  }

  // ---------------- geometria: rettangoli sullo schermo ----------------
  var _o = { x: 0, y: 0, z: 0 };
  function proietta(x, y, z) {
    var r3 = R3();
    if (D.tre && r3 && r3.proietta) { r3.proietta(x, y, z || 0, _o); return { x: _o.x, y: _o.y }; }
    var X = D.wx(x), Y = D.wy(y); return { x: X, y: Y - (z || 0) * D.S * (D.cam && D.cam.zoom || 1) * 0.8 };
  }
  function rett(punti, pad) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var i = 0; i < punti.length; i++) { var p = punti[i]; if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
    pad = pad || 0; return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
  }
  function posEroe(i) { var st = T.P.st, h = st.eroi[i], r3 = R3(), v = r3 && r3.eroi && r3.eroi[i]; return v && isFinite(v.x) ? { x: v.x, y: v.y } : { x: h.x, y: h.y }; }
  function testa(i) {
    var r3 = R3(), h = T.P.st.eroi[i], t = null;
    try { if (r3 && r3.testaY) t = r3.testaY(i); } catch (e) { t = null; }
    if (t == null || !isFinite(t)) t = (r3 && r3.altezzaEroe ? r3.altezzaEroe(h.id) : 1.6) * 1.2;
    return Math.max(1.2, t) + (h.z || 0);
  }
  // l'eroe intero: piedi (con l'ombra), corpo, testa, barra della vita, nome e tacche sopra la testa
  function rettEroe(i) {
    var p = posEroe(i), zt = Math.max(2.3, testa(i)), pts = [];   // prudente: mai meno di 2,3 di altezza (salti, armi alzate)
    var dd = [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]];
    for (var k = 0; k < 4; k++) { pts.push(proietta(p.x + dd[k][0], p.y + dd[k][1], 0)); pts.push(proietta(p.x + dd[k][0], p.y + dd[k][1], zt)); }
    var r = rett(pts, 8);
    r.y -= 42; r.h += 42;   // barra della vita, nome, tacche (disegnati sopra la testa)
    return r;
  }
  // davanti all'eroe: da lui fino a 2,6 caselle nella direzione in cui guarda (o verso il bersaglio del passo)
  function rettDavanti() {
    var st = T.P.st, me = st.eroi[0], p = posEroe(0), a = me.aim, L = 2.6;
    var q = { x: p.x + Math.cos(a) * L, y: p.y + Math.sin(a) * L };
    return rett([proietta(p.x, p.y, 0.6), proietta(q.x, q.y, 0), proietta(q.x, q.y, 1.2)], 22);
  }
  function cerchio(x, y, r) { return { x: x - r, y: y - r, w: 2 * r, h: 2 * r }; }
  function rettComandi() {
    var UI = PT.UI, IN = PT.IN, W = PT.W(), H = PT.H(), SA = PT.SA, o = [];
    if (!IN.desktop) {
      var mx = IN.mov.id >= 0 ? IN.mov.bx : UI.mov.x, my = IN.mov.id >= 0 ? IN.mov.by : UI.mov.y;
      o.push({ n: 'levetta', r: cerchio(mx, my, UI.R * 1.3) });
      if (IN.mov.id >= 0) o.push({ n: 'levetta0', r: cerchio(UI.mov.x, UI.mov.y, UI.R * 1.3) });
      o.push({ n: 'attacco', r: cerchio(UI.att.x, UI.att.y, UI.R + 16) });
      if (IN.mira.id >= 0 && !IN.mira.sup) o.push({ n: 'mira', r: cerchio(IN.mira.bx, IN.mira.by, UI.R + 16) });
      o.push({ n: 'super', r: cerchio(UI.sup.x, UI.sup.y, UI.sup.r + 14) });
      o.push({ n: 'gadget', r: cerchio(UI.gad.x, UI.gad.y, UI.gad.r + 14) });
    } else {
      o.push({ n: 'super', r: cerchio(W - SA.r - 60, H - SA.b - 64, 52) });
      o.push({ n: 'gadget', r: cerchio(W - SA.r - 134, H - SA.b - 50, 40) });
    }
    o.push({ n: 'pausa', r: cerchio(UI.pausa.x, UI.pausa.y, UI.pausa.r + 8) });
    return o;
  }
  function rettNemici() {
    var st = T.P.st, me = st.eroi[0], o = [];
    for (var i = 1; i < st.eroi.length; i++) { var e = st.eroi[i]; if (!e.vivo) continue; if (M.visibile && !M.visibile(st, e, me.sq)) continue; o.push({ n: 'nemico' + i, r: rettEroe(i) }); }
    return o;
  }
  function rettProiettili() {
    var st = T.P.st, o = [];
    for (var i = 0; i < st.pr.length; i++) { var p = st.pr[i]; if (!p.vivo) continue; var q = proietta(p.x, p.y, 0.5); o.push({ n: 'proiettile', r: cerchio(q.x, q.y, 16) }); }
    return o;
  }
  function rettObiettivi() {
    var o = [], s = T.segno, st = T.P.st;
    if (s) { var a = proietta(s.x - s.r, s.y - s.r, 0), b = proietta(s.x + s.r, s.y + s.r, 0), c2 = proietta(s.x - s.r, s.y + s.r, 0), d = proietta(s.x + s.r, s.y - s.r, 0); o.push({ n: 'obiettivo', r: rett([a, b, c2, d], 8) }); }
    if (PASSI[T.i] === 'gemme') for (var i = 0; i < T.gemme.length; i++) { var g = T.gemme[i]; if (!g.vivo) continue; var q = proietta(g.x, g.y, 0.4); o.push({ n: 'gemma', r: cerchio(q.x, q.y, 20) }); }
    return o;
  }
  function inter(a, b) { var w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return w > 0 && h > 0 ? w * h : 0; }
  // tutto quello che le scritte non devono coprire
  function vietati() {
    var o = [{ n: 'eroe', r: rettEroe(0) }, { n: 'davanti', r: rettDavanti() }];
    return o.concat(rettNemici(), rettComandi(), rettProiettili(), rettObiettivi());
  }

  // ---------------- dove va il riquadro ----------------
  function altezza(w) {
    var k = Math.round(w);
    if (T.misH[k]) return T.misH[k];
    box.style.width = k + 'px';
    var h = box.offsetHeight || 70;
    T.misH[k] = h; return h;
  }
  function candidati() {
    var W = PT.W(), H = PT.H(), SA = PT.SA, UI = PT.UI, desk = PT.IN.desktop;
    var top = Math.max(PT.hudBasso() + 8, UI.pausa.y + UI.pausa.r + 16), l = SA.l + 10, r = W - SA.r - 10, larga = Math.min(r - l, 380), stretta = Math.min(250, Math.max(170, (r - l) / 2 - 8));
    var c = [];
    c.push({ n: 'alto', w: larga, x: (W - larga) / 2, y: top });
    c.push({ n: 'alto-sx', w: stretta, x: l, y: top });
    c.push({ n: 'alto-dx', w: stretta, x: r - stretta, y: top });
    var media = Math.min(r - l, 300);
    c.push({ n: 'alto-c', w: media, x: (W - media) / 2, y: top });
    [0.36, 0.5, 0.62, 0.24].forEach(function (f, i) {
      c.push({ n: 'lato-sx' + i, w: stretta, x: l, y: H * f });
      c.push({ n: 'lato-dx' + i, w: stretta, x: r - stretta, y: H * f });
    });
    var hS = altezza(stretta);
    var sopraLev = desk ? H - SA.b - 16 : UI.mov.y - UI.R * 1.3 - 10;
    c.push({ n: 'basso-sx', w: stretta, x: l, y: sopraLev - hS });
    var sopraTasti = desk ? H - SA.b - 130 : Math.min(UI.sup.y - UI.sup.r, UI.gad.y - UI.gad.r) - 22;
    c.push({ n: 'basso-dx', w: stretta, x: r - stretta, y: sopraTasti - hS });
    // in basso, fra levetta e tasti (orizzontale, PC)
    var xa = desk ? l : UI.mov.x + UI.R * 1.3 + 10, xb = desk ? W - SA.r - 190 : Math.min(UI.sup.x - UI.sup.r, UI.gad.x - UI.gad.r, UI.att.x - UI.R) - 24;
    var wb = Math.min(380, xb - xa);
    if (wb >= 170) c.push({ n: 'basso', w: wb, x: xa + (xb - xa - wb) / 2, y: H - SA.b - 10 - altezza(wb) });
    for (var i = 0; i < c.length; i++) { c[i].h = altezza(c[i].w); c[i].y = Math.max(top, Math.min(H - SA.b - c[i].h - 6, c[i].y)); }
    return c;
  }
  function piazzaRiquadro(viet) {
    var c = candidati(), W = PT.W(), best = -1, bestA = 1e18, scelto = -1;
    var fissi = viet;
    var aree = c.map(function (q) { var a = 0; for (var j = 0; j < fissi.length; j++) a += inter(q, fissi[j].r); return a; });
    if (T.lay.cand >= 0 && T.lay.cand < c.length && T.lay.n === c[T.lay.cand].n && aree[T.lay.cand] === 0) scelto = T.lay.cand;   // resta dov'era se è ancora libero
    for (var i = 0; scelto < 0 && i < c.length; i++) if (aree[i] === 0) scelto = i;
    if (scelto < 0) { for (i = 0; i < c.length; i++) if (aree[i] < bestA) { bestA = aree[i]; best = i; } scelto = best; }
    var q = c[scelto];
    T.lay.cand = scelto; T.lay.n = q.n; T.lay.area = aree[scelto]; T.lay.r = { x: q.x, y: q.y, w: q.w, h: q.h };
    T.lay.diag = c.map(function (q, i) { return q.n + ':' + Math.round(aree[i]); }).join(' ');
    box.style.width = Math.round(q.w) + 'px';
    box.style.transform = 'translate(' + Math.round(q.x) + 'px,' + Math.round(q.y) + 'px)';
    box.dataset.dove = q.n;
  }

  // ---------------- la mano (indica senza coprire) ----------------
  function bersaglioMano() {
    var id = PASSI[T.i], UI = PT.UI, IN = PT.IN;
    if (IN.desktop || T.fase !== 'gioco') return null;
    if (id === 'muovi' || id === 'cesp') return IN.mov.id >= 0 ? null : { x: UI.mov.x, y: UI.mov.y, r: UI.R * 1.3 };
    if (id === 'tocco' || id === 'mira' || id === 'ricarica') return IN.mira.id >= 0 ? null : { x: UI.att.x, y: UI.att.y, r: UI.R + 16 };
    if (id === 'super' && T.supPronta) return { x: UI.sup.x, y: UI.sup.y, r: UI.sup.r + 14 };
    if (id === 'gadget') return { x: UI.gad.x, y: UI.gad.y, r: UI.gad.r + 14 };
    return null;
  }
  var MANO = 44;   // la freccia disegnata punta a destra: ruotata di a+180° punta al comando
  function piazzaMano(viet) {
    var b = bersaglioMano();
    if (!b) { mano.classList.remove('vis'); T.manoR = null; return; }
    var W = PT.W(), H = PT.H(), boxR = T.lay.r, best = null;
    // si provano 11 angoli attorno al comando (prima quello verso il centro dello schermo)
    var ang = [-2.36, -2.0, -2.7, -1.57, -3.14, -1.2, -0.8, 2.36, 0.8, 0];
    var cx = W / 2 - b.x, cy = H * 0.45 - b.y, a0 = Math.atan2(cy, cx);
    ang.unshift(a0);
    for (var i = 0; i < ang.length * 3; i++) {
      // il centro della freccia sta fuori dal cerchio del comando, lungo l'angolo a (a 3 distanze); la punta guarda il comando
      // ingombro VERO della freccia ruotata (il riquadro che la contiene cresce in diagonale fino a 1,41 volte)
      var a = ang[i % ang.length], q2 = MANO * (Math.abs(Math.cos(a)) + Math.abs(Math.sin(a))), d = b.r + 4 + q2 / 2 + Math.floor(i / ang.length) * 22, cx0 = b.x + Math.cos(a) * d, cy0 = b.y + Math.sin(a) * d;
      var r = { x: cx0 - q2 / 2, y: cy0 - q2 / 2, w: q2, h: q2 };
      if (r.x < 2 || r.y < 2 || r.x + q2 > W - 2 || r.y + q2 > H - 2) continue;
      var a2 = 0; for (var j = 0; j < viet.length; j++) a2 += inter(r, viet[j].r); if (boxR) a2 += inter(r, boxR);
      if (a2 === 0) { best = { r: r, a: a }; break; }
    }
    if (!best) { mano.classList.remove('vis'); T.manoR = null; return; }
    T.manoR = best.r;
    mano.style.transform = 'translate(' + Math.round(best.r.x + best.r.w / 2 - MANO / 2) + 'px,' + Math.round(best.r.y + best.r.h / 2 - MANO / 2) + 'px) rotate(' + Math.round(best.a * 180 / Math.PI + 180) + 'deg)';
    mano.classList.add('vis');
  }

  // ---------------- disegno sul canvas: cerchio a terra, frecce ai bordi, buio ritagliato ----------------
  function disegna(dt, g) {
    if (!radice || !T.P || !T.P.st) return;
    var st = T.P.st, W = PT.W(), H = PT.H(), tempo = performance.now() / 1000;
    radice.classList.toggle('in-pausa', !!PT.pausa());
    // tocco/trascinamento della mira: il tipo dell'ultimo rilascio (per capire tocco breve o mira)
    var IN = PT.IN;
    if (IN.mira.id >= 0) T.mira0 = { uscito: IN.mira.uscito, sup: IN.mira.sup };
    else if (T.mira0) { if (!T.mira0.sup) T.rilascio = { tipo: T.mira0.uscito ? 'drag' : 'tap', t: performance.now(), sup: false }; T.mira0 = null; }
    if (T.fase === 'attesa' || T.i < 0) { box.classList.remove('vis'); mano.classList.remove('vis'); return; }
    g.save();
    // buio ritagliato (solo nei primi istanti di SUPER pronta e GADGET): fori sul tasto, sull'eroe e sui nemici
    if (T.luce > 0 && !IN.desktop && T.fase === 'gioco') {
      T.luce = Math.max(0, T.luce - dt);
      var b = bersaglioMano();
      if (b) {
        var al = Math.min(1, T.luce / 0.6) * 0.42, e0 = rettEroe(0);
        g.globalAlpha = al; g.fillStyle = '#05020c'; g.beginPath(); g.rect(0, 0, W, H);
        g.moveTo(b.x + b.r + 6, b.y); g.arc(b.x, b.y, b.r + 6, 0, 6.2832, true);
        var fori = [e0].concat(rettNemici().map(function (x) { return x.r; }));   // fori ovali sull'eroe e sui nemici: mai buio sopra di loro
        for (var n = 0; n < fori.length; n++) { var q = fori[n]; var ax = q.w * 0.72 + 6, ay = q.h * 0.72 + 6; g.moveTo(q.x + q.w / 2 + ax, q.y + q.h / 2); g.ellipse(q.x + q.w / 2, q.y + q.h / 2, ax, ay, 0, 0, 6.2832);   /* ovale che contiene tutto il rettangolo */ }
        g.fill('evenodd'); g.globalAlpha = 1;
      }
    }
    // il segno a terra (cerchio da raggiungere, cespuglio, miniera)
    var s = T.segno;
    if (s && T.fase === 'gioco') {
      var pul = 0.5 + 0.5 * Math.sin(tempo * 6), pts = [];
      for (var k = 0; k <= 32; k++) { var aa = k / 32 * 6.2832; pts.push(proietta(s.x + Math.cos(aa) * s.r * (0.92 + 0.08 * pul), s.y + Math.sin(aa) * s.r * (0.92 + 0.08 * pul), 0.03)); }
      g.lineWidth = 3; g.strokeStyle = s.gemme ? '#ff5cf0' : '#ffd23b'; g.globalAlpha = 0.55 + 0.4 * pul;
      g.beginPath(); for (k = 0; k < pts.length; k++) { if (k) g.lineTo(pts[k].x, pts[k].y); else g.moveTo(pts[k].x, pts[k].y); } g.stroke();
      g.globalAlpha = 0.14 + 0.08 * pul; g.fillStyle = s.gemme ? '#ff5cf0' : '#ffd23b'; g.fill(); g.globalAlpha = 1;
      frecciaBordo(g, proietta(s.x, s.y, 0), W, H, s.gemme ? '#ff5cf0' : '#ffd23b');
    }
    // il bersaglio fuori dallo schermo: freccia al bordo
    var bot = st.eroi[1], id = PASSI[T.i];
    if (bot.vivo && T.fase === 'gioco' && /tocco|mira|ricarica|super|bot/.test(id)) {
      var pb = posEroe(1), qb = proietta(pb.x, pb.y, 0);
      frecciaBordo(g, qb, W, H, '#ff4d5e');
      // anello sottile ai piedi del bersaglio (non copre il corpo)
      var pr = [];
      for (k = 0; k <= 24; k++) { aa = k / 24 * 6.2832; pr.push(proietta(pb.x + Math.cos(aa) * 0.85, pb.y + Math.sin(aa) * 0.85, 0.03)); }
      g.lineWidth = 2.5; g.strokeStyle = '#ff4d5e'; g.globalAlpha = 0.45 + 0.35 * Math.sin(tempo * 7); g.setLineDash([7, 6]); g.lineDashOffset = -tempo * 20;
      g.beginPath(); for (k = 0; k < pr.length; k++) { if (k) g.lineTo(pr[k].x, pr[k].y); else g.moveTo(pr[k].x, pr[k].y); } g.stroke();
      g.setLineDash([]); g.globalAlpha = 1;
    }
    g.restore();
    // barra di avanzamento del passo
    var bar = box.querySelector('.tut-barra i');
    if (T.prog >= 0) bar.style.width = Math.round(Math.max(0, Math.min(1, T.prog)) * 100) + '%';
    // dove mettere scritte e mano: si ricalcola a ogni fotogramma
    var viet = vietati();
    piazzaRiquadro(viet);
    piazzaMano(viet);
    T.ultimiViet = viet;
    if (dbg) debugDisegna(viet);
  }
  function frecciaBordo(g, p, W, H, col) {
    var m = 34;
    if (p.x > m && p.x < W - m && p.y > m && p.y < H - m) return;
    var cx = W / 2, cy = H / 2, dx = p.x - cx, dy = p.y - cy, a = Math.atan2(dy, dx);
    var t = Math.min(Math.abs((W / 2 - m) / (dx || 1e-6)), Math.abs((H / 2 - m) / (dy || 1e-6)));
    var x = cx + dx * t, y = cy + dy * t;
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col; g.strokeStyle = '#120826'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(14, 0); g.lineTo(-8, -10); g.lineTo(-3, 0); g.lineTo(-8, 10); g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  function debugDisegna(viet) {
    var W = PT.W(), H = PT.H(); if (dbg.width !== W) { dbg.width = W; dbg.height = H; }
    var g = dbg.getContext('2d'); g.clearRect(0, 0, W, H); g.lineWidth = 1.5;
    viet.forEach(function (v) { g.strokeStyle = v.n === 'eroe' ? '#0f0' : v.n === 'davanti' ? '#0ff' : /nemico/.test(v.n) ? '#f44' : '#ff0'; g.strokeRect(v.r.x, v.r.y, v.r.w, v.r.h); });
    if (T.lay.r) { g.strokeStyle = '#f0f'; g.strokeRect(T.lay.r.x, T.lay.r.y, T.lay.r.w, T.lay.r.h); }
  }

  // ---------------- uscita ----------------
  function guardia() {
    if (!T) return;
    var P = PT.P();
    if (T.P && P !== T.P) { chiudi('uscito'); return; }   // uscito dalla pausa («Esci dalla partita») o altro
    requestAnimationFrame(guardia);
  }
  function chiudi(perche) {
    var c = T; if (!c) return;
    T = null;
    if (LIM0 != null) { M.LIMITE.gemme = LIM0; LIM0 = null; }
    if (perche === 'saltato') ls('gb_tut_saltato', '1');
    togliDom();
    if (perche !== 'uscito' && PT.P() === c.P) PT.esci();
    PT.modo(c.modoPrima);
    var menu = document.getElementById('s-gb');
    if (perche !== 'uscito') { if (menu && window.__menuGBapri) window.__menuGBapri(); else PT.vai('s-home', -1); }
    if (perche === 'fatto') mostraFine();
  }

  // ---------------- schede (fuori dalla partita: niente eroe da coprire) ----------------
  var foglio = null;
  function togliFine() { if (foglio) { foglio.remove(); foglio = null; } }
  function mostraFine() {
    togliFine();
    foglio = el('div', 'tut-foglio on', '<div class="tut-carta"><div class="tut-coppa">★</div><b>' + tx('fine') + '</b><p>' + tx('fine1') + '</p><p>' + tx('fine2') + '</p>' +
      '<div class="tut-tasti"><button class="gioca piccolo" data-t="gioca"><span class="luce"></span><span class="lampo"></span><span class="g-l">' + tx('gioca') + '</span></button>' +
      '<button class="t3 corto" data-t="ripeti" style="--k:#1ad7ff"><span class="luce"></span><span>' + tx('ripeti') + '</span></button></div></div>');
    foglio.id = 'tut-fine';
    document.body.appendChild(foglio);
    foglio.querySelector('[data-t="gioca"]').onclick = function () { suono('tasto'); togliFine(); };
    foglio.querySelector('[data-t="ripeti"]').onclick = function () { suono('passa'); togliFine(); apri(); };
  }
  // al primo «Gioca»: una volta sola. Ritorna true se ha mostrato la proposta (chi chiama si ferma; `poi` = gioca davvero)
  function proponi(poi) {
    if (T) return false;
    if (Q.get('auto') === '1' || ls('gb_tut_proposto') === '1' || ls('gb_tut_fatto') === '1' || ls('gb_tutorial') === '1') return false;
    ls('gb_tut_proposto', '1');
    togliFine();
    foglio = el('div', 'tut-foglio on', '<div class="tut-carta"><div class="tut-coppa">?</div><b>' + tx('prop_t') + '</b><p>' + tx('prop_p') + '</p>' +
      '<div class="tut-tasti"><button class="gioca piccolo" data-t="si"><span class="luce"></span><span class="lampo"></span><span class="g-l">' + tx('prop_si') + '</span></button>' +
      '<button class="t3 corto" data-t="no" style="--k:#ffd23b"><span class="luce"></span><span>' + tx('prop_no') + '</span></button></div></div>');
    foglio.id = 'tut-proposta';
    document.body.appendChild(foglio);
    foglio.querySelector('[data-t="si"]').onclick = function () { suono('tasto'); togliFine(); apri(); };
    foglio.querySelector('[data-t="no"]').onclick = function () { suono('passa'); togliFine(); if (poi) poi(); };
    return true;
  }

  // tasto TUTORIAL anche nella home classica (senza menu nuovo: ?menu=0)
  function tastoHome() {
    var nav = document.querySelector('#s-home .lob-lato');
    if (!nav || nav.querySelector('.tut-ico')) return;
    var b = el('button', 'icona3d tut-ico', '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="#1a3a22" stroke="#5cff8a" stroke-width="3"/><path d="M19 15 L35 24 L19 33 Z" fill="#5cff8a"/></svg><span>' + tx('tasto') + '</span>');
    b.style.setProperty('--k', '#5cff8a'); b.setAttribute('data-nav', '');
    b.onclick = function () { suono('passa'); apri(); };
    nav.appendChild(b);
  }
  if (document.readyState === 'complete') tastoHome(); else window.addEventListener('load', tastoHome);

  window.GB_MENU = window.GB_MENU || {}; window.GB_MENU.onTutorial = function () { apri(); };   // 24/11 notte: il tasto Tutorial del menu nuovo (ui/menu_gb.js)
  window.GBTUT = {
    apri: apri, proponi: proponi,
    attivo: function () { return !!T; },
    stato: function () { if (!T) return { attivo: false, fine: !!document.getElementById('tut-fine') }; var s = T.stato(); s.attivo = true; s.dove = T.lay.n || ''; s.area = T.lay.area || 0; return s; },
    // per le prove: i rettangoli di QUESTO fotogramma (riquadro e mano dal DOM, il resto ricalcolato)
    misure: function () {
      if (!T || !box || T.fase === 'attesa' || !T.P) return null;
      var r = box.getBoundingClientRect(), m = mano.classList.contains('vis') ? mano.getBoundingClientRect() : null;
      return { box: { x: r.left, y: r.top, w: r.width, h: r.height }, boxVis: box.classList.contains('vis') && getComputedStyle(box).opacity > 0.5, mano: m ? { x: m.left + 4, y: m.top + 4, w: m.width - 8, h: m.height - 8 } : null,
        eroe: rettEroe(0), davanti: rettDavanti(), nemici: rettNemici(), comandi: rettComandi(), proiettili: rettProiettili(), obiettivi: rettObiettivi(), dove: T.lay.n, diag: T.lay.diag, lay: T.lay.r, W: PT.W(), H: PT.H() };
    },
    _T: function () { return T; }
  };
  // ?tut=1 apre subito il tutorial (prove, link diretti)
  if (Q.get('tut') === '1') setTimeout(function () { apri(); }, 900);
})();
