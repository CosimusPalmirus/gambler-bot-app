/* COPERTINA_2011 — HOP CLASH: la home viva del gioco come COPERTINA della mini app (20/11/2026).
   hop.html?copertina=1&piatt=tg&lang=it|en&v=..&origine=..  mostra SOLO il titolo di stadio.js (logo grande, stagno vivo, sei rane 3D
   sulle ninfee). Niente rete, niente socket, niente lobby interna: il titolo lo apre stadio.js da solo (senza avvia=1 e titolo=0).
   Al tocco: i tuffi e la camera sul protagonista (0,7 s), poi al padre {sm:'hop_cop', ev:'gioca'}; il padre chiude la copertina e
   sotto c'e' gia' la scheda del gioco. Su al padre anche: ev:'pronto' {modo:'3d'|'2d'} quando la copertina e' a schermo, ev:'vivo'
   se il 3D arriva dopo la copertina 2D, ev:'musica' {stato}, ev:'esci' (tasto Esc). Giu dal padre: {sm:'bordi', top,bottom,left,right}.
   Mai bloccati: se dopo 8 s il 3D non e' pronto (o non puo' partire) si mostra la copertina 2D (sfondo dipinto + logo + «Tocca per
   giocare»). stadio.js e' tutto dentro una funzione: con ?copertina=1 espone window.__hopCopInt (una riga COPERTINA_2011 in fondo
   a stadio.js) e da qui si sostituisce SOLO titoloEsci. Senza ?copertina=1 non fa niente. */
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  if (Q.get('copertina') !== '1') return;
  var ORIG = location.origin, FIGLIA = window.parent !== window, EN = (Q.get('lang') || '') === 'en';
  var C = {t0: Date.now(), pronto: false, modo: '', vivo: false, via: false, mandato: false, rete: [], log: [], musica: ''};
  window.__hopCop = C;
  try { document.documentElement.classList.add('hop-cop'); } catch (e) {}
  function su(ev, x) {
    C.log.push(ev + '@' + (Date.now() - C.t0));
    if (!FIGLIA) return;
    var o = {sm: 'hop_cop', ev: ev}, k; if (x) for (k in x) o[k] = x[k];
    try { window.parent.postMessage(o, ORIG); } catch (e) {}
  }
  function el(id) { return document.getElementById(id); }
  // lo stato di stadio.js passa SOLO da window.__hopCopInt (se stadio.js non e' partito: niente, e resta la copertina 2D)
  var I = window.__hopCopInt || null;
  function tit() { try { return I ? I.tit() : undefined; } catch (e) { return undefined; } }
  function tasto0() { try { return I ? I.tasto() : undefined; } catch (e) { return undefined; } }

  // 1. NIENTE RETE: le chiamate del server di prova (/api/...) non partono mai (resta in attesa, come una pagina ferma)
  try {
    var f0 = window.fetch;
    if (typeof f0 === 'function') window.fetch = function (u) {
      var s = String((u && u.url) || u || '');
      if (/\/api\//.test(s) || /^api\//.test(s)) { C.rete.push(s.slice(0, 60)); return new Promise(function () {}); }
      return f0.apply(this, arguments);
    };
    if (window.navigator && navigator.sendBeacon) navigator.sendBeacon = function () { return false; };
  } catch (e) {}

  // 2. I BORDI DEL TELEFONO dal padre (dentro l'iframe env(safe-area-inset-*) vale 0): le stesse variabili del ponte
  window.addEventListener('message', function (ev) {
    if (ev.origin !== ORIG || ev.source !== window.parent) return;
    var d = ev.data; if (!d || typeof d !== 'object' || d.sm !== 'bordi') return;
    try { var r = document.documentElement.style, l = ['top', 'bottom', 'left', 'right'], i;
      for (i = 0; i < l.length; i++) { var v = Number(d[l[i]]); if (isFinite(v) && v >= 0 && v <= 200) r.setProperty('--sa-' + l[i], Math.round(v) + 'px'); } } catch (e) {}
  });

  // 3. L'USCITA: i tuffi e la camera sul protagonista (come il titolo di sempre), poi «gioca» al padre. Al massimo 1,2 s.
  function manda() { if (C.mandato) return; C.mandato = true; su('gioca'); }
  function esci() {
    if (C.via) return; C.via = true;
    var t = el('titolo'); if (t) t.classList.add('esce');
    try { var tk = tasto0(); if (tk) removeEventListener('keydown', tk); } catch (e) {}
    try { if (I) { I.ac(); I.suono('salto'); I.sigla('turno'); } } catch (e) {}
    setTimeout(manda, 1200);
    try {
      var T = tit();
      if (I && T && T.rane && T.rane.length && !I.rm()) {
        T.esce = true; var eroe = T.rane[0]; eroe.festa = 1.2; eroe.vola = null; eroe.alt = 0;
        T.rane.slice(1).forEach(function (o, k) { setTimeout(function () { var T2 = tit(); if (T2 && o.a > .5) I.tuffo(o, k); }, 40 + k * 75); });
        I.tw(.7, function (k) { var T2 = tit(); if (T2) T2.zoom = I.eio(k); }).then(manda, manda);
        return;
      }
    } catch (e) {}
    setTimeout(manda, 250);
  }
  try { if (I) I.esci(esci); } catch (e) {}   // il tocco e Invio del titolo di stadio.js arrivano qui (mai la lobby della pagina)
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !C.via) { e.preventDefault(); su('esci'); } });

  // 4. PRONTO: il titolo 3D e' a schermo (stadio.js toglie il caricamento e apre il titolo da solo)
  function musica() {
    // la musica del menu del level up (stadio.js, LEVELUP_2011) parte solo se il browser lo permette gia' (il tocco nell'Arena vale
    // per l'iframe su Chrome/Android); se no resta muta fino al tocco. Niente trucchi per forzare l'autoplay.
    if (C.musica || C.via) return; C.musica = 'prova';
    try {
      if (!I) { C.musica = 'no'; return; }
      if (I.muto()) { C.musica = 'muto'; return; }
      var A = window.AudioContext || window.webkitAudioContext; if (!A) { C.musica = 'no'; return; }
      var p = new A(), fatto = false;
      var fine = function () {
        if (fatto) return; fatto = true; var ok = p.state === 'running'; try { p.close(); } catch (e) {}
        if (!ok || C.via) { C.musica = 'al tocco'; su('musica', {stato: C.musica}); return; }
        try { C.musica = I.ac().state; } catch (e) { C.musica = 'errore'; }
        su('musica', {stato: C.musica});
      };
      if (p.state === 'running') fine(); else { p.onstatechange = fine; setTimeout(fine, 300); }
    } catch (e) { C.musica = 'errore'; }
  }
  function guarda() {
    var ca = el('carica'), T = tit(), ti = el('titolo');
    var su3d = !!(ca && ca.classList.contains('via') && T && T.rane && ti && !ti.classList.contains('nasc'));
    if (su3d && !C.pronto) { C.pronto = true; C.modo = '3d'; C.vivo = true; su('pronto', {modo: '3d', ms: Date.now() - C.t0}); musica(); return; }
    if (su3d && C.modo === '2d' && !C.vivo) { C.vivo = true; togliCast(); su('vivo', {ms: Date.now() - C.t0}); musica(); }
  }
  var gt = setInterval(function () { guarda(); if (C.vivo || C.via) clearInterval(gt); }, 150);

  // 5. MAI BLOCCATI: la copertina 2D (sfondo dipinto, logo, «Tocca per giocare») se il 3D non arriva in 8 s o non puo' partire.
  //    Se il 3D arriva dopo, stadio.js apre il suo titolo sopra questo (stesso #titolo) e la copertina diventa viva.
  // la copertina 2D: al posto delle rane 3D i loro ritratti in fila che saltellano (stessi file della scelta della rana)
  function cast() {
    try {
      var tt = document.querySelector('#titolo .tt'); if (!tt || tt.querySelector('.cast')) return;
      var pg = 'zip'; try { if (I) pg = I.pg() || pg; } catch (e) {}
      var tutti = ['axa', 'luma', 'camu', 'zip', 'grumo', 'tonfo'], fila = [];
      tutti.forEach(function (x) { if (x !== pg) fila.push(x); });
      fila.splice(3, 0, pg);   // il protagonista (la rana scelta l'ultima volta) in mezzo
      var d = document.createElement('div'); d.className = 'cast cop-cast';
      fila.forEach(function (x) { var im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = 'assets_bayou/ritratti/' + x + (x === pg ? '_win' : '_idle') + '.webp';
        im.addEventListener('error', function () { im.remove(); }); d.appendChild(im); });
      tt.appendChild(d);
    } catch (e) {}
  }
  function togliCast() { try { var c = document.querySelector('#titolo .cop-cast'); if (c) c.remove(); } catch (e) {} }
  function piatta(perche) {
    if (C.pronto || C.via) return;
    C.pronto = true; C.modo = '2d';
    try {
      var ca = el('carica'), ti = el('titolo'), f = el('fondo'), pc = matchMedia('(hover:hover) and (pointer:fine)').matches;
      if (f) f.style.backgroundImage = 'url(assets_bayou/' + (innerWidth > innerHeight ? 'fondo_pc' : 'fondo_tel') + '.jpg)';
      if (ti) { ti.dataset.q = innerWidth > innerHeight * 1.15 ? (innerHeight < 560 ? 'basso' : 'oriz') : 'vert'; ti.classList.remove('nasc', 'esce'); ti.onclick = function () { esci(); }; }
      var s = el('t-sot'); if (s) s.textContent = EN ? 'Pond brawl' : 'Rane in rissa';
      var b = el('t-gioca'); if (b) b.textContent = EN ? (pc ? 'Click to play' : 'Tap to play') : (pc ? 'Clicca per giocare' : 'Tocca per giocare');
      if (ca) ca.classList.add('via');
      cast();
      addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && C.modo === '2d' && !C.vivo) { e.preventDefault(); esci(); } });
    } catch (e) {}
    su('pronto', {modo: '2d', perche: perche, ms: Date.now() - C.t0});
    musica();
  }
  function webgl() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  if (typeof window.THREE === 'undefined' || !webgl()) setTimeout(function () { piatta('no3d'); }, 0);
  else setTimeout(function () { guarda(); piatta('lento'); }, 8000);
  window.addEventListener('error', function (e) { C.log.push('err:' + String(e && e.message || '').slice(0, 80)); });
})();
