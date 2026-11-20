/* PERSONALIZZA_2011 · smash/pz_smash.js — il tasto PERSONALIZZA nel menu di Gambler Smash (20/11/2026).
   Il proprietario: «in tutti i giochi in cui ci sono sbloccabili aggiungi il tasto PERSONALIZZA» + «Smash: sì, nella sua pagina».
   Smash non ha personaggi bloccati: i suoi sbloccabili sono gli oggetti del look «tavolo» (slot sx: effetto KO, quest
   q18_smash_*), che la mini app mostra in QUESTS › Cosmetici › Tavolo e giochi › Smash.
   Qui SOLO un tasto nel menu principale (#gt .gt-menu, sotto ALLENATI · PERSONAGGI · OPZIONI), con la stessa veste del
   tasto GIOCA A SOLDI (clonato: nessuna regola CSS nuova). Compare SOLO se la pagina sta dentro la mini app e il guscio
   ha GSSOLDI.personalizza (index con PERSONALIZZA_2011): altrove (browser da solo, Discord senza guscio) non c'è.
   Nessuna logica del gioco toccata, nessuna chiamata al server, nessun lavoro per fotogramma (osserva solo i figli
   diretti di body e #ui). File esterno apposta: arena.html di Discord non ammette script in linea. */
(function () {
  'use strict';
  if (window.__pzSmash) return; window.__pzSmash = 1;
  var EN = /[?&]lang=en\b/.test(location.search);
  function guscio() {
    try {
      var p = window.parent;
      if (p !== window && p.location.origin === location.origin && p.GSSOLDI && typeof p.GSSOLDI.personalizza === 'function') return p.GSSOLDI;
    } catch (e) { }
    return null;
  }
  var ICONA = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;margin-right:8px"><path d="M14.5 4.5l5 5-8 8-5-5z"/><path d="M6.5 12.5 4 20l7.5-2.5"/></svg>';
  function metti() {
    var m = document.querySelector('#gt .gt-menu');
    if (!m || m.querySelector('.pz-smash')) return;
    var G = guscio(); if (!G) return;
    var mod = m.querySelector('[data-gt="soldi"]'), b;
    if (mod) {
      b = mod.cloneNode(true);
      b.removeAttribute('id');
      var sp = b.querySelector(':scope > span:not(.gt-luce3):not(.gt-lampo3)'); if (sp) sp.innerHTML = ICONA + (EN ? 'CUSTOMIZE' : 'PERSONALIZZA');
    } else {
      b = document.createElement('button'); b.className = 'gt-t c2';
      b.innerHTML = '<span>' + ICONA + (EN ? 'CUSTOMIZE' : 'PERSONALIZZA') + '</span>';
    }
    b.classList.add('pz-smash'); b.setAttribute('data-gt', 'pz'); b.setAttribute('type', 'button');
    b.style.setProperty('--i', '2');
    var fr = b.querySelector('.gt-freccia'); if (fr) fr.remove();   // una riga sola: icona + scritta, come i tasti piccoli
    b.style.flexDirection = 'row'; b.style.justifyContent = 'center'; b.style.alignItems = 'center';
    b.style.minHeight = '54px'; b.style.width = '100%'; b.style.paddingTop = '8px'; b.style.paddingBottom = '8px';
    var sp2 = b.querySelector(':scope > span:not(.gt-luce3):not(.gt-lampo3)'); if (sp2) { sp2.style.display = 'inline-flex'; sp2.style.alignItems = 'center'; }
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var g = guscio(); if (!g) return;
      try { g.personalizza(); } catch (x) { }
    });
    var tre = m.querySelector('.gt-tre');
    if (tre && tre.parentNode === m) m.insertBefore(b, tre.nextSibling); else m.appendChild(b);
  }
  function guarda() {
    metti();
    try {
      var mo = new MutationObserver(metti);
      mo.observe(document.body, { childList: true });
      var ui = document.getElementById('ui'); if (ui) mo.observe(ui, { childList: true });
      var gt = document.getElementById('gt'); if (gt) mo.observe(gt, { childList: true });
    } catch (e) { }
    // il menu si ricostruisce dentro #gt (nuovo #gt a ogni schermata): ogni 1,5 s si riguarda, solo se il menu c'è e manca il tasto
    setInterval(function () { var m = document.querySelector('#gt .gt-menu'); if (m && !m.querySelector('.pz-smash')) metti(); }, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guarda); else guarda();

  /* ═══ GLI EFFETTI KO (20/11): gli oggetti «tavolo» slot sx, ora DENTRO Smash ═══════════════════════════════════
     sx 1 = SCIA D'ORO («chi butti fuori vola via in una scia d'oro»), sx 2 = ESPLOSIONE NEON («il KO esplode in un anello
     ciano e viola»): stessi colori della vetrina (TV3G). Parte quando chi lo ha equipaggiato manda KO qualcuno.
     Chi ha cosa lo dice il guscio (GSSOLDI.koPosti): in partita online ogni posto col `tvl.sx` del suo profilo del server
     real-time (start.profiles, gli stessi che portano nome e foto) → lo vedono TUTTI, anche chi guarda; in allenamento
     solo il tuo (posto 0, il giocatore umano).
     SOLO DISEGNO: nessun cambio al motore, al verificatore o alla rete (la VER non cambia). Si legge l'evento "ko" che il
     motore manda già (GSUI.evento: a = chi esce, b = chi l'ha colpito per ultimo) e si disegna in GSFX.sopra, nel mondo,
     sopra i lottatori. Spento con ?ko=0 o localStorage gb_pz_ko='0'. */
  var KO = { S: null, sx: [], giro: 0, storia: {}, fx: [], spento: false };
  try { KO.spento = /[?&]ko=0\b/.test(location.search) || localStorage.getItem('gb_pz_ko') === '0'; } catch (e) { }
  window.PZKO = KO;
  function kposti() {
    var p = null;
    try { var G = window.parent !== window && window.parent.location.origin === location.origin && window.parent.GSSOLDI; if (G && typeof G.koPosti === 'function') p = G.koPosti(); } catch (e) { p = null; }
    var sx = [];
    if (p && p.online) { (p.sx || []).forEach(function (v, i) { sx[i] = (v | 0) >= 1 && (v | 0) <= 2 ? v | 0 : 0; }); }
    else if (p) sx[0] = (p.mio | 0) >= 1 && (p.mio | 0) <= 2 ? p.mio | 0 : 0;   // allenamento: il giocatore umano e' il posto 0
    KO.sx = KO.sxForza || sx;   // sxForza: solo per i banchi di prova
  }
  function fase(S) {
    if (S !== KO.S) { KO.S = S; KO.storia = {}; KO.fx = []; KO.giro = 0; kposti(); }
    if (++KO.giro % 120 === 0) kposti();   // ogni ~2 s: un profilo arrivato dopo lo start
  }
  var TAU = Math.PI * 2;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function eo(u) { return 1 - Math.pow(1 - u, 3); }
  function avvia(k, ev, S) {
    // il KO avviene fuori dallo schermo (oltre la zona di uscita): l'effetto parte dagli ultimi punti in cui si vedeva
    var V = KO.vista, tutti = KO.storia[ev.a] || [], st = tutti.filter(function (p) { return p.vis; }).slice(-26);
    var dent = function (p) { if (!V) return { x: p.x, y: p.y }; var mx = (V.x1 - V.x0) * .2, my = (V.y1 - V.y0) * .2;
      return { x: Math.max(V.x0 + mx, Math.min(V.x1 - mx, p.x)), y: Math.max(V.y0 + my, Math.min(V.y1 - my, p.y)) }; };
    if (st.length < 2) { var u0 = dent(tutti.length ? tutti[tutti.length - 1] : { x: ev.x, y: ev.y }); st = [u0, { x: u0.x + 1, y: u0.y }]; }
    if (tutti.length) { var ul = tutti[tutti.length - 1]; if (!ul.vis) st.push(dent(ul)); }   // fino al bordo da cui e' uscito
    var f = { k: k, t0: performance.now(), path: st, dur: k === 1 ? 1600 : 1300, parts: [] };
    var c = dent(st[st.length - 1]);
    f.cx = c.x; f.cy = c.y;
    var a = st[st.length - 1], b = st[Math.max(0, st.length - 4)];
    f.dx = a.x - b.x; f.dy = a.y - b.y;
    for (var i = 0; i < (k === 1 ? 26 : 22); i++) {
      var p = st[(Math.random() * st.length) | 0], ang = Math.random() * TAU, v = rnd(.2, 1);
      f.parts.push(k === 1 ? { x: p.x, y: p.y, vx: Math.cos(ang) * v, vy: -rnd(.4, 1.2), rot: Math.random() * TAU, r: rnd(.55, 1), d: rnd(0, .25) }
                           : { x: f.cx, y: f.cy, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, r: rnd(.4, 1), d: rnd(0, .12), col: i % 2 ? '#22d3ee' : '#a855f7' });
    }
    // tutto in frazioni della vista del KO: la telecamera dopo un KO si sposta e l'effetto deve restare sullo schermo
    if (V) {
      var W0 = V.x1 - V.x0 || 1, H0 = V.y1 - V.y0 || 1, fr = function (p) { return { x: (p.x - V.x0) / W0, y: (p.y - V.y0) / H0 }; };
      f.vista = true; f.path = f.path.map(fr); var cc = fr({ x: f.cx, y: f.cy }); f.cx = cc.x; f.cy = cc.y; f.dx /= W0; f.dy /= H0;
      f.parts.forEach(function (p) { var q = fr(p); p.x = q.x; p.y = q.y; });
    }
    KO.fx.push(f); if (KO.fx.length > 6) KO.fx.shift();
    KO.ultimo = { k: k, a: ev.a, b: ev.b, t: Date.now() };
  }
  function scia(x, f, u, U) {   // SCIA D'ORO: la traiettoria di chi vola via, oro che brucia, monete che cadono
    var P = f.path, al = 1 - u;
    x.lineCap = 'round'; x.lineJoin = 'round';
    var ex = P[P.length - 1], ox = ex.x + f.dx * 5 * eo(Math.min(1, u * 2)), oy = ex.y + f.dy * 5 * eo(Math.min(1, u * 2));
    [[U * .07, 'rgba(255,170,40,' + (.22 * al) + ')'], [U * .035, 'rgba(255,213,74,' + (.75 * al) + ')'], [U * .012, 'rgba(255,250,215,' + al + ')']].forEach(function (s) {
      x.lineWidth = s[0] * (1 - .5 * u); x.strokeStyle = s[1];
      x.beginPath(); x.moveTo(P[0].x, P[0].y); for (var i = 1; i < P.length; i++) x.lineTo(P[i].x, P[i].y); x.lineTo(ox, oy); x.stroke();
    });
    var t = u * f.dur / 1000;
    f.parts.forEach(function (p) {
      var tt = t - p.d; if (tt <= 0) return;
      var px = p.x + p.vx * U * .25 * tt, py = p.y + (p.vy * U * .3 * tt) + U * .9 * tt * tt, r = U * .03 * p.r, sc = Math.cos(p.rot + tt * 9);
      x.save(); x.translate(px, py); x.scale(Math.max(.15, Math.abs(sc)), 1);
      x.globalAlpha = Math.max(0, al * 1.2);
      x.fillStyle = sc > 0 ? '#ffd54a' : '#e0a82e'; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,230,.9)'; x.beginPath(); x.arc(-r * .3, -r * .3, r * .32, 0, TAU); x.fill();
      x.restore();
    });
  }
  function neon(x, f, u, U) {   // ESPLOSIONE NEON: due anelli ciano e viola, raggi e schegge
    var al = 1 - u, r1 = U * (.04 + .24 * eo(u)), r2 = U * (.03 + .17 * eo(Math.max(0, u - .08)));
    x.shadowBlur = U * .05;
    if (u < .16) { x.globalAlpha = (1 - u / .16) * .9; x.fillStyle = '#ffffff'; x.shadowColor = '#22d3ee'; x.beginPath(); x.arc(f.cx, f.cy, U * .09 * (1 + u * 3), 0, TAU); x.fill(); }
    x.globalAlpha = al;
    x.lineWidth = U * .03 * al + 1; x.strokeStyle = '#22d3ee'; x.shadowColor = '#22d3ee'; x.beginPath(); x.arc(f.cx, f.cy, r1, 0, TAU); x.stroke();
    x.lineWidth = U * .02 * al + 1; x.strokeStyle = '#a855f7'; x.shadowColor = '#a855f7'; x.beginPath(); x.arc(f.cx, f.cy, r2, 0, TAU); x.stroke();
    for (var i = 0; i < 14; i++) {
      var a = i / 14 * TAU + .2, q = i % 2 ? .7 : 1;
      x.strokeStyle = i % 2 ? '#a855f7' : '#e0fbff'; x.lineWidth = U * .008 + 1;
      x.beginPath(); x.moveTo(f.cx + Math.cos(a) * r1 * .75, f.cy + Math.sin(a) * r1 * .75); x.lineTo(f.cx + Math.cos(a) * r1 * (1 + .35 * q), f.cy + Math.sin(a) * r1 * (1 + .35 * q)); x.stroke();
    }
    var t = u * f.dur / 1000;
    f.parts.forEach(function (p) {
      var tt = t - p.d; if (tt <= 0) return;
      var d = U * .5 * eo(Math.min(1, tt * 1.4)) * p.r;
      x.fillStyle = p.col; x.shadowColor = p.col; x.globalAlpha = al;
      x.save(); x.translate(f.cx + p.vx * d, f.cy + p.vy * d); x.rotate(Math.atan2(p.vy, p.vx));
      x.fillRect(-U * .018, -U * .004, U * .036, U * .008); x.restore();
    });
    x.shadowBlur = 0;
  }
  function disegna(x, S) {
    if (KO.spento || !x || !S || !S.L) return;
    fase(S);
    var m = x.getTransform ? x.getTransform() : { a: 1, d: 1, e: 0, f: 0 }, sc = Math.abs(m.a) || 1;
    if (m.a && m.d) { var cw = x.canvas.width, ch = x.canvas.height, X0 = -m.e / m.a, X1 = (cw - m.e) / m.a, Y0 = -m.f / m.d, Y1 = (ch - m.f) / m.d;
      KO.vista = { x0: Math.min(X0, X1), x1: Math.max(X0, X1), y0: Math.min(Y0, Y1), y1: Math.max(Y0, Y1) }; }
    var V = KO.vista;
    for (var j = 0; j < S.L.length; j++) {
      var L = S.L[j]; if (!L || L.st === 'morto' || typeof L.x !== 'number') continue;
      var py = L.y - 45, vis = !V || (L.x >= V.x0 && L.x <= V.x1 && py >= V.y0 && py <= V.y1);
      var h = KO.storia[j] || (KO.storia[j] = []); h.push({ x: L.x, y: py, vis: vis }); if (h.length > 40) h.shift();
    }
    if (!KO.fx.length) return;
    var U = Math.min(x.canvas.width, x.canvas.height) / sc;   // un «palco» in unita' del mondo: gli effetti hanno la stessa misura su ogni schermo
    var ora = performance.now();
    for (var i = KO.fx.length - 1; i >= 0; i--) {
      var f = KO.fx[i], u = (ora - f.t0) / f.dur;
      if (u >= 1) { KO.fx.splice(i, 1); continue; }
      var g = f;
      if (f.vista && V) {   // dalle frazioni alla vista di adesso
        var W1 = V.x1 - V.x0, H1 = V.y1 - V.y0, to = function (p) { return { x: V.x0 + p.x * W1, y: V.y0 + p.y * H1 }; }, c0 = to({ x: f.cx, y: f.cy });
        g = { k: f.k, dur: f.dur, path: f.path.map(to), cx: c0.x, cy: c0.y, dx: f.dx * W1, dy: f.dy * H1,
              parts: f.parts.map(function (p) { var q = to(p); return { x: q.x, y: q.y, vx: p.vx, vy: p.vy, rot: p.rot, r: p.r, d: p.d, col: p.col }; }) };
        if (f.k === 2) g.parts.forEach(function (p) { p.x = g.cx; p.y = g.cy; });
      }
      x.save(); x.globalCompositeOperation = 'lighter';
      try { if (f.k === 1) scia(x, g, u, U); else neon(x, g, u, U); } catch (e) { }
      x.restore();
    }
  }
  (function aggancia(n) {
    var UI = window.GSUI, FX = window.GSFX;
    if (!UI || typeof UI.evento !== 'function' || !FX || typeof FX.sopra !== 'function') { if ((n | 0) < 600) setTimeout(function () { aggancia((n | 0) + 1); }, 100); return; }
    if (UI.evento.__pzko) return;
    var ev0 = UI.evento;
    UI.evento = function (S, ev) {
      var r = ev0.apply(this, arguments);
      try {
        if (KO.sxForza) KO.sx = KO.sxForza;
        if (!KO.spento && ev && ev.t === 'ko' && ev.b >= 0 && ev.b !== ev.a && S && S.L) { fase(S); var k = KO.sx[ev.b] | 0; if (k) avvia(k, ev, S); }
      } catch (e) { }
      return r;
    };
    UI.evento.__pzko = 1;
    var so = FX.sopra;
    FX.sopra = function (x, S) { var r = so.apply(this, arguments); try { disegna(x, S); } catch (e) { } return r; };
  })(0);
})();
