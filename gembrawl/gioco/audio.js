// GAMBLER BRAWL — suoni sintetizzati con WebAudio; dal 30/10 musica a file (musica/) e voci dell'annunciatore (ui/voci/).
(function () {
  'use strict';
  var A = { on: true, musica: true, ctx: null, master: null, sfx: null, mus: null, rumore: null, ultimo: {} };
  try { A.on = localStorage.getItem('gb_sfx') !== '0'; A.musica = localStorage.getItem('gb_mus') !== '0'; } catch (e) { }

  A.sblocca = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    var c = A.ctx = new C();
    A.master = c.createGain(); A.master.gain.value = 0.8;
    // compressore: tanti colpi insieme non devono gracchiare
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.15;
    A.master.connect(comp); comp.connect(c.destination);
    A.sfx = c.createGain(); A.sfx.gain.value = A.on ? 1 : 0; A.sfx.connect(A.master);
    A.mus = c.createGain(); A.mus.gain.value = A.musica ? 0.32 : 0; A.mus.connect(A.master);
    var n = c.sampleRate, b = c.createBuffer(1, n, n), d = b.getChannelData(0), s = 12345;
    for (var i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
    A.rumore = b;
  };

  A.imposta = function (sfx, mus) {
    A.on = sfx; A.musica = mus;
    try { localStorage.setItem('gb_sfx', sfx ? '1' : '0'); localStorage.setItem('gb_mus', mus ? '1' : '0'); } catch (e) { }
    if (A.ctx) { A.sfx.gain.value = sfx ? 1 : 0; A.mus.gain.setTargetAtTime(mus ? 0.32 : 0, A.ctx.currentTime, 0.1); }
  };

  // limita lo stesso suono a una volta ogni `ms`
  function libero(nome, ms) {
    if (!A.ctx) return false;
    var t = A.ctx.currentTime * 1000;
    if (A.ultimo[nome] && t - A.ultimo[nome] < ms) return false;
    A.ultimo[nome] = t; return true;
  }

  function osc(tipo, f0, f1, dur, vol, dest, t0) {
    var c = A.ctx, t = t0 || c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || A.sfx); o.start(t); o.stop(t + dur + 0.02);
    return o;
  }
  function rumore(dur, vol, ftipo, f0, f1, q, dest, t0) {
    var c = A.ctx, t = t0 || c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.rumore; s.playbackRate.value = 1;
    f.type = ftipo; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur); f.Q.value = q || 1;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || A.sfx);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function v(x) { return x * (0.92 + Math.random() * 0.16); } // un filo di variazione

  // ---- catalogo ----
  A.sparo = function (stile, mio) {
    if (!A.ctx || !A.on || !libero('sp' + stile, 45)) return;
    var k = mio ? 1 : 0.45;
    switch (stile) {
      case 'proiettile': case 'gettone': case 'fuoco':
        rumore(0.07, 0.5 * k, 'bandpass', v(2400), 900, 1.2); osc('square', v(180), 60, 0.07, 0.25 * k); break;
      case 'laser': osc('sawtooth', v(1800), 220, 0.18, 0.18 * k); osc('square', v(900), 120, 0.12, 0.12 * k); break;
      case 'raggio': osc('sawtooth', v(300), 1400, 0.16, 0.16 * k); rumore(0.15, 0.2 * k, 'highpass', 3000, 3000, 1); break;
      case 'carta': case 'shuriken': rumore(0.06, 0.4 * k, 'highpass', v(4000), 2500, 2); osc('triangle', v(1400), 700, 0.05, 0.12 * k); break;
      case 'nota': osc('triangle', v(660), 660, 0.18, 0.22 * k); osc('sine', v(990), 990, 0.14, 0.12 * k); break;
      case 'lancia': case 'katana': case 'artigli': case 'morso': case 'pugno':
        rumore(0.13, 0.55 * k, 'bandpass', v(800), 3000, 1.5); break;
      case 'pallottola': case 'revolver': rumore(0.06, 0.6 * k, 'bandpass', v(3000), 1200, 1.1); osc('square', v(220), 70, 0.06, 0.3 * k); rumore(0.12, 0.15 * k, 'highpass', 6000, 3000, 1); break;   // colpo secco del revolver
      case 'freccia': case 'arco': osc('triangle', v(180), 90, 0.12, 0.35 * k); rumore(0.14, 0.3 * k, 'highpass', 4500, 2500, 1.5); osc('sine', v(900), 600, 0.08, 0.06 * k); break;   // corda che schiocca + sibilo
      case 'pizza': rumore(0.1, 0.35 * k, 'bandpass', v(900), 500, 1.5); osc('sine', v(300), 180, 0.1, 0.15 * k); break;   // pizza lanciata (whoosh morbido)
      case 'onda': case 'bassi': break;   // l'onda suona con l'evento ondaBassi
      case 'cristallo': break;            // il raggio suona con raggioCristallo
      case 'mano': case 'schiaffo': rumore(0.09, 0.3 * k, 'lowpass', 1800, 500, 1); break;   // il colpo vero suona con l'evento 'manata'
      case 'suono': osc('sine', 90, 45, 0.3, 0.55 * k); rumore(0.12, 0.25 * k, 'lowpass', 600, 200, 1); break;
      case 'bilia': osc('sine', v(1200), 900, 0.05, 0.3 * k); rumore(0.04, 0.3 * k, 'highpass', 3000, 3000, 1); break;
      default: // lanci ad arco
        osc('sine', v(260), 120, 0.14, 0.35 * k); rumore(0.08, 0.2 * k, 'lowpass', 900, 300, 1);
    }
  };
  // impatto a tre strati: attacco (clic), corpo (tonfo: più danno = più grave) e coda (solo sui colpi pesanti)
  A.colpo = function (pesante, suMe, danno) {
    if (!A.ctx || !A.on || !libero(suMe ? 'cm' : 'co', 35)) return;
    var d = Math.min(1, (danno || (pesante ? 1200 : 500)) / 1800), t = A.ctx.currentTime;
    if (suMe) { osc('square', v(170 - d * 70), 55, 0.12 + d * 0.08, 0.35); rumore(0.08, 0.4, 'lowpass', 1400, 300, 1); if (pesante) rumore(0.25, 0.25, 'lowpass', 600, 80, 1, null, t + 0.05); return; }
    rumore(0.04, 0.55, 'highpass', v(3200 - d * 1200), 2500, 1);
    osc('sine', v(300 - d * 190), 45, 0.08 + d * 0.14, 0.4 + d * 0.35);
    if (pesante) { rumore(0.28, 0.3, 'lowpass', 900, 100, 1, null, t + 0.04); osc('triangle', 90, 40, 0.3, 0.25, null, t + 0.03); }
  };
  A.muro = function () { if (!A.ctx || !A.on || !libero('mu', 60)) return; rumore(0.04, 0.18, 'bandpass', v(1800), 1200, 3); };
  A.cassa = function () {
    if (!A.ctx || !A.on || !libero('ca', 60)) return;
    rumore(0.25, 0.5, 'lowpass', 2500, 300, 1);
    for (var i = 0; i < 5; i++) osc('sine', v(2200 + i * 300), 1800, 0.08, 0.08, null, A.ctx.currentTime + 0.03 + i * 0.035);
  };
  A.esplo = function (grande) {
    if (!A.ctx || !A.on || !libero('es', 50)) return;
    rumore(grande ? 0.7 : 0.4, grande ? 0.9 : 0.6, 'lowpass', 1600, 80, 1);
    osc('sine', 110, 35, grande ? 0.5 : 0.3, 0.8);
  };
  A.ko = function (mio) {
    if (!A.ctx || !A.on) return;
    var t = A.ctx.currentTime;
    rumore(0.6, 0.8, 'lowpass', 2200, 90, 1); osc('sine', 90, 30, 0.5, 0.9);
    // pioggia di fiches
    for (var i = 0; i < 9; i++) osc('triangle', 1800 + (i % 3) * 420 + Math.random() * 200, 1500, 0.07, 0.09, null, t + 0.08 + i * 0.045);
    if (mio) { osc('sawtooth', 220, 110, 0.5, 0.15, null, t + 0.05); }
  };
  // gemme: una scaletta che sale con le gemme che hai in tasca
  A.gemma = function (n) {
    if (!A.ctx || !A.on || !libero('ge', 60)) return;
    var t = A.ctx.currentTime, f = 880 * Math.pow(2, Math.min(n || 1, 14) / 12);
    osc('sine', f, f, 0.22, 0.25, null, t); osc('sine', f * 1.5, f * 1.5, 0.3, 0.18, null, t + 0.06);
  };
  // sirena del conto alla rovescia
  A.sirena = function (nostra) {
    if (!A.ctx || !A.on || !libero('si', 900)) return;
    var t = A.ctx.currentTime, base = nostra ? 520 : 440;
    for (var i = 0; i < 2; i++) osc('sawtooth', base, base * 1.5, 0.35, 0.06, null, t + i * 0.42);
  };
  // la super si carica: una nota per ogni quarto, sempre più alta
  A.caricaNota = function (q) {
    if (!A.ctx || !A.on) return;
    var n = [523, 659, 784, 1046][Math.max(0, Math.min(3, q))];
    osc('triangle', n, n, 0.12, 0.14); osc('sine', n * 2, n * 2, 0.1, 0.05);
  };
  A.serie = function (n) {
    if (!A.ctx || !A.on) return;
    var t = A.ctx.currentTime;
    for (var i = 0; i < n + 2; i++) osc('square', 660 * Math.pow(2, i / 6), 660 * Math.pow(2, i / 6), 0.1, 0.12, null, t + i * 0.07);
  };
  A.superPronta = function () {
    if (!A.ctx || !A.on) return;
    var t = A.ctx.currentTime, n = [523, 659, 784, 1046];
    for (var i = 0; i < 4; i++) osc('square', n[i], n[i], 0.09, 0.12, null, t + i * 0.06);
  };
  // grido della super: dente di sega attraverso due formanti ("HAA!")
  A.superGrido = function (grave) {
    if (!A.ctx || !A.on) return;
    var c = A.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), m = c.createGain();
    var base = grave ? 150 : 240;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(base, t); o.frequency.linearRampToValueAtTime(base * 1.45, t + 0.08); o.frequency.exponentialRampToValueAtTime(base * 0.8, t + 0.45);
    f1.type = 'bandpass'; f1.frequency.value = 750; f1.Q.value = 6; f2.type = 'bandpass'; f2.frequency.value = 1200; f2.Q.value = 7;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(f1); o.connect(f2); f1.connect(m); f2.connect(m); m.connect(g); g.connect(A.sfx);
    o.start(t); o.stop(t + 0.55);
    rumore(0.45, 0.5, 'bandpass', 400, 4000, 0.8);
  };
  A.passo = function () { if (!A.ctx || !A.on || !libero('pa', 120)) return; rumore(0.03, 0.06, 'lowpass', 500, 300, 1); };
  A.ricarica = function () { if (!A.ctx || !A.on || !libero('ri', 120)) return; osc('square', 1900, 2400, 0.035, 0.07); };
  // preparazione di super/gadget: un ronzio che sale per tutta la durata
  A.carica = function (sup, dur) {
    if (!A.ctx || !A.on) return;
    osc(sup ? 'sawtooth' : 'triangle', sup ? 160 : 400, sup ? 640 : 900, Math.max(0.1, dur), sup ? 0.12 : 0.08);
    if (sup) rumore(Math.max(0.1, dur), 0.12, 'bandpass', 300, 2400, 2);
  };
  A.tic = function (acuto) { if (!A.ctx || !A.on) return; osc('square', acuto ? 1320 : 880, acuto ? 1320 : 880, 0.08, 0.12); };
  A.vuoto = function () { if (!A.ctx || !A.on || !libero('vu', 150)) return; osc('square', 200, 160, 0.06, 0.1); };
  A.cura = function () { if (!A.ctx || !A.on || !libero('cu', 250)) return; osc('sine', 660, 990, 0.25, 0.12); };
  A.tasto = function () { if (!A.ctx || !A.on) return; osc('triangle', 900, 1200, 0.06, 0.15); };
  A.fine = function (vinto) {
    if (!A.ctx || !A.on) return;
    var t = A.ctx.currentTime, n = vinto ? [523, 659, 784, 1046, 1318] : [440, 415, 392, 330];
    for (var i = 0; i < n.length; i++) { osc('square', n[i], n[i], 0.22, 0.14, null, t + i * 0.13); osc('triangle', n[i] / 2, n[i] / 2, 0.25, 0.18, null, t + i * 0.13); }
  };

  // ---- suoni dell'interfaccia (giro UI 30/10): tasti, sipario, versus, conto 3-2-1-BRAWL ----
  A.passa = function () { if (!A.ctx || !A.on || !libero('pz', 40)) return; osc('triangle', v(1500), 1700, 0.035, 0.07); };
  A.conferma = function () {
    if (!A.ctx || !A.on || !libero('cf', 60)) return;
    var t = A.ctx.currentTime;
    rumore(0.05, 0.35, 'bandpass', 2600, 1800, 1.4); osc('square', 520, 1040, 0.08, 0.13);
    osc('sine', 1560, 1560, 0.14, 0.09, null, t + 0.03); osc('sine', 2340, 2340, 0.1, 0.05, null, t + 0.05);
  };
  A.indietro = function () { if (!A.ctx || !A.on || !libero('in', 60)) return; osc('triangle', 760, 430, 0.1, 0.14); rumore(0.04, 0.15, 'highpass', 2500, 2500, 1); };
  A.carta = function () {
    if (!A.ctx || !A.on || !libero('ct', 50)) return;
    var t = A.ctx.currentTime;
    osc('sine', 300, 900, 0.08, 0.3); osc('triangle', 1200, 1200, 0.1, 0.1, null, t + 0.04); rumore(0.05, 0.2, 'bandpass', 3500, 2500, 2);
  };
  // fiche che cade sul tavolo: tre tintinnii vicini
  function fiche(t, vol) { for (var i = 0; i < 3; i++) osc('sine', v(2600 + i * 480), 2300, 0.06, vol * (1 - i * 0.25), null, t + i * 0.028); }
  A.sipario = function (dir) {
    if (!A.ctx || !A.on || !libero('sp', 200)) return;
    var t = A.ctx.currentTime;
    rumore(0.32, 0.28, 'bandpass', dir < 0 ? 2800 : 500, dir < 0 ? 500 : 2800, 1.2);
    fiche(t + 0.16, 0.09);
  };
  A.avvio = function () {
    if (!A.ctx || !A.on) return;
    var t = A.ctx.currentTime, n = [261.6, 329.6, 392, 523.3];
    for (var i = 0; i < n.length; i++) { osc('sawtooth', n[i], n[i], 0.5, 0.06, null, t + i * 0.03); osc('square', n[i] * 2, n[i] * 2, 0.25, 0.04, null, t + 0.1 + i * 0.05); }
    rumore(0.5, 0.3, 'bandpass', 300, 4000, 0.9); osc('sine', 120, 40, 0.35, 0.6);
    fiche(t + 0.2, 0.12);
  };
  A.vsEntra = function () { if (!A.ctx || !A.on) return; rumore(0.45, 0.35, 'lowpass', 250, 2200, 1); };
  A.vsColpo = function () {
    if (!A.ctx || !A.on) return;
    var t = A.ctx.currentTime;
    osc('sine', 95, 38, 0.6, 0.95); rumore(0.5, 0.7, 'lowpass', 2600, 120, 1);
    osc('square', 1760, 1700, 0.35, 0.05, null, t + 0.01); osc('square', 2640, 2600, 0.3, 0.035, null, t + 0.01);
    rumore(0.9, 0.12, 'bandpass', 900, 600, 0.7, null, t + 0.08);   // la folla
  };
  // ---- suoni delle abilità nuove (giro GAMEPLAY 30/10): un suono per evento del motore, mai lo stesso per due abilità ----
  // A.fx(tipo, e, mio): e = evento del motore {x, y, a, b, c, d}; mio = l'ho fatto io (più forte)
  function lama(t, k, forte) {   // fruscio dell'aria + anello del metallo
    rumore(0.16, 0.45 * k, 'highpass', 5200, 1800, 1.2, null, t);
    osc('sine', v(forte ? 2100 : 2600), forte ? 1500 : 2200, forte ? 0.35 : 0.2, 0.09 * k, null, t + 0.03);
    osc('triangle', v(4200), 3900, 0.12, 0.04 * k, null, t + 0.03);
  }
  A.fx = function (tipo, e, mio) {
    if (!A.ctx || !A.on || !libero('fx' + tipo, 50)) return;
    var t = A.ctx.currentTime, k = mio ? 1 : 0.5, i;
    switch (tipo) {
      // SAMURAI
      case 'lampoVia': lama(t, k, e.d === 1); osc('sine', 300, 80, 0.12, 0.25 * k); break;                 // scatto che attraversa (d=1: fodero pieno)
      case 'tagliato': osc('sawtooth', v(1400), 400, 0.08, 0.12 * k); rumore(0.06, 0.4 * k, 'bandpass', 3000, 1200, 2); break;
      case 'treSette': for (i = 0; i < 6; i++) osc('square', 600 + (i % 3) * 200, 600 + (i % 3) * 200, 0.05, 0.05 * k, null, t + i * 0.05); break;   // i rulli girano
      case 'sette': { var n = Math.max(1, Math.min(3, e.c || 1)), f = [784, 988, 1175][n - 1]; osc('square', f, f, 0.18, 0.1 * k); osc('sine', f * 2, f * 2, 0.2, 0.06 * k, null, t + 0.03); lama(t + 0.02, k, n === 3); if (n === 3) { osc('sine', 110, 35, 0.5, 0.8 * k); rumore(0.4, 0.6 * k, 'lowpass', 1800, 90, 1); } break; }
      case 'parata': osc('square', 1800, 1750, 0.25, 0.07 * k); osc('square', 2700, 2650, 0.2, 0.05 * k); rumore(0.05, 0.4 * k, 'highpass', 4000, 4000, 1); if (e.d === 1) lama(t + 0.06, k, true); break;   // clang (d=1: risponde)
      case 'riflesso': osc('sine', 2400, 3200, 0.08, 0.1 * k); rumore(0.04, 0.25 * k, 'highpass', 5000, 5000, 1); break;
      // CROUPIER
      case 'mano': if (!mio) return; osc('triangle', e.d > 0 || e.c > 0 ? 1100 : 700, e.c > 0 ? 1500 : 500, 0.06, 0.1); rumore(0.04, 0.2, 'highpass', 6000, 6000, 1); break;   // carta in mano (+1) / giocata (-1)
      case 'scala': for (i = 0; i < 5; i++) osc('triangle', 523 * Math.pow(2, i * 2 / 12), 523 * Math.pow(2, i * 2 / 12), 0.08, 0.1 * k, null, t + i * 0.045); break;
      case 'rastrello': rumore(0.4, 0.4 * k, 'bandpass', 600, 2600, 1.6); osc('sawtooth', 120, 220, 0.3, 0.08 * k); break;   // il rastrello striscia sul tavolo
      case 'trascinato': rumore(0.3, 0.3 * k, 'lowpass', 900, 300, 1); break;
      case 'cartaPosata': rumore(0.05, 0.35 * k, 'bandpass', 2400, 1500, 2); osc('sine', 500, 300, 0.06, 0.12 * k); break;
      case 'cartaScoppia': rumore(0.35, 0.55 * k, 'lowpass', 2400, 200, 1); for (i = 0; i < 6; i++) rumore(0.04, 0.12 * k, 'highpass', 5000 + i * 300, 4000, 2, null, t + 0.05 + i * 0.04); osc('sine', 140, 50, 0.3, 0.5 * k); break;
      // BUTTAFUORI
      case 'manata': rumore(0.07, 0.75 * k, 'bandpass', 1400, 700, 1.1); osc('sine', 180, 70, 0.12, 0.45 * k); break;   // schiaffo pieno
      case 'manoFerma': osc('sine', 150, 60, 0.15, 0.4 * k); rumore(0.05, 0.3 * k, 'lowpass', 1200, 400, 1); break;
      case 'presa': rumore(0.12, 0.4 * k, 'bandpass', 900, 500, 1.4); osc('sawtooth', 110, 90, 0.18, 0.12 * k); break;
      case 'scaraventa': rumore(0.35, 0.4 * k, 'bandpass', 300, 1800, 1); break;
      case 'atterraLancio': osc('sine', e.b === 1 ? 80 : 110, 30, e.b === 1 ? 0.55 : 0.35, 0.9 * k); rumore(e.b === 1 ? 0.5 : 0.3, 0.7 * k, 'lowpass', 1600, 80, 1); if (e.b === 1) for (i = 0; i < 4; i++) osc('triangle', 300 + i * 90, 200, 0.08, 0.07 * k, null, t + 0.05 + i * 0.04); break;   // contro il muro: crollo
      case 'cordone': osc('square', 420, 380, 0.12, 0.1 * k); osc('sine', 1400, 1350, 0.25, 0.06 * k, null, t + 0.02); rumore(0.05, 0.3 * k, 'lowpass', 1500, 500, 1); break;   // il paletto d'ottone
      case 'rimbalzoCordone': osc('sine', 160, 420, 0.18, 0.35 * k); osc('sine', 420, 200, 0.15, 0.15 * k, null, t + 0.12); break;   // boing della corda di velluto
      // LUPO
      case 'lunaPiena': { var c = A.ctx, o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();   // ululato
        o.type = 'sawtooth'; o.frequency.setValueAtTime(260, t); o.frequency.linearRampToValueAtTime(520, t + 0.35); o.frequency.linearRampToValueAtTime(470, t + 0.9); o.frequency.exponentialRampToValueAtTime(240, t + 1.4);
        fl.type = 'bandpass'; fl.frequency.value = 900; fl.Q.value = 3; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * k, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.45);
        o.connect(fl); fl.connect(g); g.connect(A.sfx); o.start(t); o.stop(t + 1.5); rumore(1.2, 0.12 * k, 'bandpass', 700, 1200, 2); break; }
      case 'balzo': rumore(0.3, 0.35 * k, 'bandpass', 400, 2000, 1); osc('sine', 200, 420, 0.25, 0.1 * k); break;
      case 'atterraLupo': osc('sine', 120, 35, 0.4, 0.8 * k); rumore(0.3, 0.5 * k, 'lowpass', 1400, 100, 1); rumore(0.12, 0.3 * k, 'highpass', 3000, 2000, 1.5, null, t + 0.02); break;
      case 'artiglio': rumore(0.1, 0.5 * k, 'highpass', e.d < 0 ? 3600 : 3000, 1500, 1.6); osc('sawtooth', e.d < 0 ? 900 : 700, 300, 0.07, 0.08 * k); break;   // due zampate: la seconda più acuta
      // PISTOLERO
      case 'tamburoColpo': if (!mio) return; if (e.d === 1) { osc('square', 1320, 1320, 0.12, 0.08); osc('sine', 2640, 2640, 0.25, 0.06, null, t + 0.02); osc('sine', 90, 40, 0.25, 0.5); } else osc('square', 2200 + (e.c || 0) * 120, 2100, 0.025, 0.04); break;   // clic del tamburo; il 6° (d'oro) suona
      case 'rimbalzoColpo': osc('sine', v(3200), 1800, 0.12, 0.12 * k); rumore(0.04, 0.2 * k, 'highpass', 5000, 5000, 1); break;   // ping del rimbalzo
      case 'ricercato': osc('square', 392, 392, 0.12, 0.1 * k); osc('square', 523, 523, 0.18, 0.1 * k, null, t + 0.12); rumore(0.08, 0.25 * k, 'bandpass', 2000, 1000, 2); break;   // WANTED: due note da far west
      // ARCIERE
      case 'frecciaOro': for (i = 0; i < 4; i++) osc('triangle', [523, 784, 1046, 1568][i], [523, 784, 1046, 1568][i], 0.3, 0.06 * k, null, t + i * 0.03); rumore(0.5, 0.45 * k, 'bandpass', 600, 4000, 1); osc('sine', 140, 50, 0.4, 0.6 * k); break;
      case 'capriola': rumore(0.3, 0.35 * k, 'bandpass', 2500, 500, 1.2); osc('sine', 300, 600, 0.2, 0.08 * k); break;
      case 'frecciaCapriola': osc('triangle', 200, 100, 0.12, 0.35 * k); rumore(0.12, 0.3 * k, 'highpass', 5000, 2500, 1.5); break;
      // AGAMENNONE (lancia scagliata)
      case 'lanciaVia': rumore(0.22, 0.45 * k, 'bandpass', 700, 2600, 1.4); osc('sawtooth', 160, 90, 0.12, 0.1 * k); break;
      case 'lanciaPiantata': osc('sine', 220, 80, 0.15, 0.5 * k); osc('square', 1500, 1400, 0.3, 0.05 * k, null, t + 0.01); rumore(0.06, 0.4 * k, 'lowpass', 1500, 400, 1); break;   // TUNK + vibrazione dell'asta
      case 'giroLancia': rumore(0.3, 0.5 * k, 'bandpass', 400, 3000, 1.3); rumore(0.25, 0.3 * k, 'bandpass', 3000, 600, 1.3, null, t + 0.12); break;
      // tutti
      case 'agguato': if (!mio) return; rumore(0.12, 0.3, 'bandpass', 1500, 3000, 2); osc('sine', 660, 990, 0.12, 0.1); break;
      case 'cuboNato': k = 0.4; osc('sine', 700, 1400, 0.18, 0.08 * k); break;
      case 'cuboPreso': { var b = Math.min(8, e.b || 1); for (i = 0; i < 3; i++) osc('square', 440 * Math.pow(2, (b + i * 4) / 12), 440 * Math.pow(2, (b + i * 4) / 12), 0.1, 0.07 * k, null, t + i * 0.05); break; }   // arpeggio che sale coi cubi in tasca
      // PIZZAIOLO (g4)
      case 'pala': rumore(0.12, 0.4 * k, 'bandpass', 600, 1800, 1.2); osc('triangle', 220, 140, 0.1, 0.12 * k); break;   // colpo di pala
      case 'pizzaGira': if (!libero('pg', 300)) return; rumore(0.2, 0.12 * k, 'bandpass', 1200, 900, 3); break;
      case 'pizzaAtterra': rumore(0.18, 0.55 * k, 'lowpass', 1400, 200, 1); osc('sine', 160, 70, 0.15, 0.35 * k); rumore(0.06, 0.25 * k, 'highpass', 3000, 3000, 1, null, t + 0.03); break;   // SPLAT
      case 'pizzaGigante': osc('sawtooth', 90, 60, 0.6, 0.15 * k); rumore(0.6, 0.4 * k, 'bandpass', 300, 900, 1); for (i = 0; i < 3; i++) osc('square', 392 + i * 98, 392 + i * 98, 0.12, 0.05 * k, null, t + i * 0.08); break;   // la pizza gigante rotola
      case 'pizzeScudo': for (i = 0; i < 4; i++) rumore(0.08, 0.2 * k, 'bandpass', 1500 + i * 300, 1200, 2, null, t + i * 0.06); break;
      case 'pizzaPara': osc('sine', 500, 260, 0.08, 0.2 * k); rumore(0.05, 0.25 * k, 'lowpass', 1800, 600, 1); break;
      // DJ
      case 'ondaBassi': osc('sine', e.d ? 70 : 90, 40, 0.28, (e.d ? 0.75 : 0.5) * k); osc('sawtooth', 110, 55, 0.18, 0.08 * k); if (e.d) osc('square', 880, 880, 0.06, 0.05 * k, null, t + 0.02); break;   // a tempo (d=1): più profondo + clic
      case 'dropOnda': osc('sine', 60, 30, 0.6, 0.9 * k); rumore(0.5, 0.4 * k, 'lowpass', 900, 80, 1); osc('sawtooth', 220, 55, 0.4, 0.1 * k); break;   // DROP
      case 'cassaPosata': osc('square', 150, 120, 0.1, 0.1 * k); rumore(0.06, 0.3 * k, 'lowpass', 1200, 400, 1); break;
      case 'cassaPulsa': if (!libero('cp', 200)) return; osc('sine', 80, 45, 0.22, 0.45 * k); break;
      // VEGGENTE
      case 'cecchinoMira': if (!mio) return; osc('sine', 1200, 2400, 0.35, 0.05); break;   // la sfera si carica
      case 'raggioCristallo': osc('sine', 2600, 1800, 0.25, 0.14 * k); osc('triangle', 1300, 1250, 0.3, 0.08 * k); rumore(0.15, 0.25 * k, 'highpass', 6000, 4000, 2); if (e.d) osc('sine', 3900, 3900, 0.2, 0.05 * k, null, t + 0.05); break;
      case 'colonnaCristallo': for (i = 0; i < 4; i++) osc('sine', 1568 + i * 392, 1568 + i * 392, 0.3, 0.05 * k, null, t + i * 0.05); osc('sine', 120, 50, 0.3, 0.4 * k); break;
      case 'sigillo': osc('triangle', 660, 990, 0.3, 0.1 * k); osc('sine', 1320, 1320, 0.4, 0.04 * k, null, t + 0.1); break;
      case 'taroccoVia': rumore(0.08, 0.35 * k, 'highpass', 4500, 2500, 2); osc('triangle', 1400, 900, 0.06, 0.08 * k); break;
      case 'scambio': osc('sine', 400, 1600, 0.2, 0.12 * k); osc('sine', 1600, 400, 0.2, 0.12 * k, null, t + 0.18); rumore(0.3, 0.15 * k, 'bandpass', 2000, 800, 3); break;
      case 'protetto': osc('sine', 1046, 1046, 0.2, 0.07 * k); osc('sine', 1568, 1568, 0.25, 0.05 * k, null, t + 0.06); break;
      // vari
      case 'cartaArmata': if (!mio) return; osc('square', 1800, 1800, 0.04, 0.05); break;
      case 'parataVia': osc('square', 1500, 1450, 0.15, 0.05 * k); rumore(0.05, 0.2 * k, 'highpass', 4000, 4000, 1); break;
      case 'tagliaVia': rumore(0.12, 0.3 * k, 'bandpass', 2400, 1200, 2); break;
      case 'portiere': osc('sine', 140, 70, 0.15, 0.4 * k); rumore(0.08, 0.35 * k, 'lowpass', 1500, 400, 1); break;
      // AGAMENNONE
      case 'affondoLancia': rumore(0.12, 0.5 * k, 'bandpass', 900, 3600, 1.5); osc('triangle', 600, 1200, 0.08, 0.08 * k); break;
    }
  };
  // ---- giro 6: ultimo minuto, ultimi 10 secondi, trofei, livello ----
  A.ultimoMinuto = function () {   // fanfara corta e sirena, la musica accelera
    if (!A.ctx || !A.on) return;
    var t = A.ctx.currentTime, n = [392, 523.3, 659.3, 784];
    for (var i = 0; i < n.length; i++) { osc('square', n[i], n[i], 0.16, 0.09, null, t + i * 0.09); osc('sawtooth', n[i] / 2, n[i] / 2, 0.18, 0.05, null, t + i * 0.09); }
    for (var j = 0; j < 2; j++) osc('sawtooth', 560, 840, 0.3, 0.06, null, t + 0.45 + j * 0.34);
    A.musicaVia(true);
  };
  A.dieci = function (n) {   // un tic a secondo, più acuto e più forte verso lo zero
    if (!A.ctx || !A.on) return;
    var f = 700 + (10 - n) * 60;
    osc('square', f, f, 0.07, 0.08 + (10 - n) * 0.012); osc('sine', 120, 60, 0.08, 0.25);
  };
  A.trofei = function () { if (!A.ctx || !A.on) return; var t = A.ctx.currentTime; for (var i = 0; i < 6; i++) osc('sine', 1600 + i * 180, 1500 + i * 180, 0.09, 0.07, null, t + i * 0.07); fiche(t + 0.1, 0.1); };
  A.livello = function () {
    if (!A.ctx || !A.on) return;
    var t = A.ctx.currentTime, n = [523.3, 659.3, 784, 1046.5, 1318.5];
    for (var i = 0; i < n.length; i++) { osc('triangle', n[i], n[i], 0.25, 0.12, null, t + i * 0.07); osc('sine', n[i] * 2, n[i] * 2, 0.2, 0.04, null, t + i * 0.07); }
    rumore(0.6, 0.15, 'highpass', 6000, 3000, 1, null, t + 0.3);
  };

  // ---- voci dell'annunciatore (le stesse di Smash): tre, due, uno, game ----
  var VOCI = {}, vociChieste = false;
  // 23/11 VOCI EN: lingua delle voci = lingua del gioco (gioco.js: ?lang=en, che il tasto Lingua delle opzioni imposta). window.AUDIO_LANG la forza.
  // In inglese le voci italiane non partono MAI (nemmeno queste vecchie di Smash): se manca la battuta EN si resta muti o col suono sintetico.
  var LINGUA = (function () { try { var l = window.AUDIO_LANG || new URLSearchParams(location.search).get('lang'); return l === 'en' ? 'en' : 'it'; } catch (e) { return 'it'; } })();
  A.lingua = LINGUA;
  function caricaVoci() {
    if (vociChieste || !A.ctx || !window.fetch || LINGUA === 'en') return; vociChieste = true;
    ['tre', 'due', 'uno', 'game'].forEach(function (n) {
      fetch((window.AUDIO_RADICE || '') + 'ui/voci/' + n + '.mp3').then(function (r) { return r.arrayBuffer(); }).then(function (b) {
        return new Promise(function (ok, ko) { A.ctx.decodeAudioData(b, ok, ko); });
      }).then(function (buf) { VOCI[n] = buf; }, function () { });
    });
  }
  function voce(n, vol) {
    var b = VOCI[n]; if (!b || !A.ctx || !A.on) return false;
    var s = A.ctx.createBufferSource(), g = A.ctx.createGain(); g.gain.value = vol || 1; s.buffer = b; s.connect(g); g.connect(A.sfx); s.start(); return true;
  }
  A.conto = function (n) {
    if (!A.ctx || !A.on) return;
    A.abbassa(0.35, 2.4);
    if (!voce(['uno', 'due', 'tre'][n - 1], 1)) osc('square', n === 1 ? 990 : 660, n === 1 ? 990 : 660, 0.14, 0.14);
    osc('sine', 170, 60, 0.16, 0.5); rumore(0.06, 0.25, 'highpass', 2500, 2500, 1);
  };
  A.brawl = function () {
    if (!A.ctx || !A.on) return;
    var t = A.ctx.currentTime, n = [523.3, 659.3, 784, 1046.5];
    osc('sine', 120, 35, 0.6, 1); rumore(0.6, 0.8, 'lowpass', 3000, 120, 1);
    for (var i = 0; i < n.length; i++) { osc('square', n[i], n[i], 0.4, 0.07, null, t + 0.02); osc('sawtooth', n[i] / 2, n[i] / 2, 0.45, 0.05, null, t + 0.02); }
    A.superGrido(false);
    rumore(1.2, 0.14, 'bandpass', 900, 700, 0.7, null, t + 0.1);
  };
  A.game = function (vinto) {
    if (!A.ctx || !A.on) return;
    A.abbassa(0.25, 3);
    if (!voce('game', 1)) A.brawl();
    osc('sine', 110, 40, 0.5, 0.8); rumore(0.4, 0.5, 'lowpass', 2000, 100, 1);
  };

  // ---- musica a file (musica/*.mp3, crediti in musica/CREDITI.txt): un brano alla volta, dissolvenza fra i brani ----
  // Si suonano con <audio> collegati al mixer (niente decodifica intera in memoria).
  var TRACCE = { menu: 'musica/menu.mp3', partita: 'musica/partita.mp3', duello: 'musica/duello.mp3', vittoria: 'musica/vittoria.mp3' };
  var MU = { voluta: null, ora: null, el: {}, g: {}, pausa: false };
  // il brano del menu è un ANELLO cucito sul tempo (ui/strumenti/musica_anello.py): si ripete dal buffer WebAudio con loopEnd esatto
  // (l'elemento <audio> lascerebbe un buco a ogni giro). Stessa interfaccia di un <audio>: play, pause, currentTime, playbackRate.
  // quando scaricare la musica del menu: la TUA entrata in lobby è fatta, sei ancora a scegliere (non hai premuto CERCA) e sono passati
  // 2,5 s dallo sblocco; oppure è partita la prima partita (i modelli sono arrivati). ?musica=subito = come prima.
  var MENU_T0 = 0;
  function menuQuando(fn) {
    if (/[?&]musica=subito/.test(location.search)) { fn(); return; }
    if (!MENU_T0) MENU_T0 = performance.now();
    var it = setInterval(function () {
      var B = window.__brawl, L = window.__lobbyv, ok = false;
      try {
        if (B && (B.fase === 'partita' || (B.partite || 0) > 0)) ok = true;
        else if (!L || !L.stato) ok = performance.now() - MENU_T0 > 2500;   // lobby classica: niente entrate da aspettare
        else if (L.stato.fase === 'scelta' && performance.now() - MENU_T0 > 2500 && (L.entrate || []).some(function (e) { return e.i === 0; })) ok = true;
      } catch (e) { ok = true; }
      if (ok) { clearInterval(it); fn(); }
    }, 500);
  }
  function anello(url, jsonUrl, g) {
    var o = { buf: null, src: null, inizio: 0, posa: 0, suona: false, playbackRate: 1, preservesPitch: true, currentTime: 0, durata: 0 };
    // 24/11 (proprietario: musica del menu RITARDATA): il brano (1,2 MB) si scarica solo quando non ruba la rete ai modelli 3D e alle
    // entrate della lobby; appena decodificato entra in dissolvenza (1,5 s). Non blocca mai niente: finché non c'è, silenzio.
    menuQuando(function () {
      Promise.all([fetch(url).then(function (r) { return r.arrayBuffer(); }), fetch(jsonUrl).then(function (r) { return r.json(); }).catch(function () { return {}; })]).then(function (x) {
        o.durata = x[1].durata || 0;
        A.ctx.decodeAudioData(x[0], function (b) {
          o.buf = b;
          if (o.suona) { o.suona = false; var t = A.ctx.currentTime; if (MU.ora === 'menu') { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 1.5); } o.play(); }
        }, function () { });
      }).catch(function () { });
    });
    o.play = function () {
      if (o.suona && o.src) return Promise.resolve();
      o.suona = true; if (!o.buf) return Promise.resolve();
      var s = A.ctx.createBufferSource(); s.buffer = o.buf; s.loop = true; s.loopStart = 0; s.loopEnd = o.durata && o.durata < o.buf.duration ? o.durata : o.buf.duration;
      s.playbackRate.value = o.playbackRate; s.connect(g); s.start(0, o.posa % s.loopEnd); o.src = s; o.inizio = A.ctx.currentTime - o.posa;
      return Promise.resolve();
    };
    o.pause = function () { if (o.src) { try { o.src.stop(); } catch (e) { } o.posa = (A.ctx.currentTime - o.inizio) % (o.src.loopEnd || 1); o.src = null; } o.suona = false; };
    Object.defineProperty(o, 'rate', { set: function (v) { o.playbackRate = v; if (o.src) o.src.playbackRate.setTargetAtTime(v, A.ctx.currentTime, 0.3); } });
    return o;
  }
  function traccia(nome) {
    if (MU.el[nome]) return MU.el[nome];
    if (nome === 'menu' && A.ctx) { var gm = A.ctx.createGain(); gm.gain.value = 0; gm.connect(A.duck); MU.g[nome] = gm; return (MU.el[nome] = anello(TRACCE.menu, 'musica/menu.json', gm)); }
    var el = new Audio(TRACCE[nome]); el.loop = nome !== 'vittoria'; el.preload = 'auto';
    MU.el[nome] = el;
    try { var src = A.ctx.createMediaElementSource(el), g = A.ctx.createGain(); g.gain.value = 0; src.connect(g); g.connect(A.duck); MU.g[nome] = g; } catch (e) { MU.g[nome] = null; }
    return el;
  }
  function suonaVoluta() {
    if (!A.ctx) return;
    if (!A.duck) { A.duck = A.ctx.createGain(); A.duck.gain.value = 1; A.duck.connect(A.mus); }
    var nome = A.musica ? MU.voluta : null, t = A.ctx.currentTime;
    if (nome === MU.ora) return;
    var vecchio = MU.ora;
    if (vecchio) {
      var gv = MU.g[vecchio], ev = MU.el[vecchio];
      if (gv) { gv.gain.cancelScheduledValues(t); gv.gain.setValueAtTime(gv.gain.value, t); gv.gain.linearRampToValueAtTime(0, t + 0.45); }
      setTimeout(function () { if (MU.ora !== vecchio) try { ev.pause(); } catch (e) { } }, 520);
    }
    MU.ora = nome;
    if (!nome) return;
    var el = traccia(nome), g = MU.g[nome];
    if (nome !== 'menu') { try { el.currentTime = 0; } catch (e) { } }
    if (el.rate !== undefined || 'rate' in el) el.rate = 1; else el.playbackRate = 1;
    var p = el.play(); if (p && p.catch) p.catch(function () { });
    if (g) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.35); }
    else el.volume = 0.32;
  }
  A.musicaFile = function (nome) { MU.voluta = nome && TRACCE[nome] ? nome : null; suonaVoluta(); };
  // momenti di tensione (conto delle gemme, supplementari): il brano accelera un poco (il tono resta)
  A.musicaVia = function (intensa) {
    var el = MU.ora && MU.el[MU.ora]; if (!el) return;
    try { if ('rate' in el) el.rate = intensa ? 1.06 : 1; else { el.preservesPitch = true; el.playbackRate = intensa ? 1.06 : 1; } } catch (e) { }
  };
  A.musicaStop = function () { A.musicaFile(null); };
  A.musicaPausa = function (on) { MU.pausa = on; if (!A.ctx || !A.duck) return; var t = A.ctx.currentTime; A.duck.gain.cancelScheduledValues(t); A.duck.gain.setTargetAtTime(on ? 0.35 : 1, t, 0.08); };
  // la musica si abbassa sotto le voci, poi risale da sola
  A.abbassa = function (fino, dur) {
    if (!A.ctx || !A.duck) return;
    var t = A.ctx.currentTime, g = A.duck.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(fino, t + 0.08); g.setValueAtTime(fino, t + dur); g.linearRampToValueAtTime(MU.pausa ? 0.35 : 1, t + dur + 0.6);
  };
  var sblocca0 = A.sblocca;
  A.sblocca = function () { var nuovo = !A.ctx; sblocca0(); if (A.ctx) { caricaVoci(); if (nuovo || MU.voluta !== MU.ora) suonaVoluta(); } };
  var imposta0 = A.imposta;
  A.imposta = function (sfx, mus) { imposta0(sfx, mus); suonaVoluta(); };
  A.registro = MU;

  // ===== 21-22/11 agente AUDIO: campioni per gli 11 eroi + voicelines + ANNUNCIATORE + voci del MENU =====
  // File in audio_prova/ (fonti e licenze in audio_prova/sfx/FONTI.json e AVANZAMENTO_audio_2111.md).
  // ?audio=vecchio  -> tutto come prima (solo sintesi + voci ui/voci). Se un campione non e' ancora caricato suona il vecchio.
  // Mixer: master <- [sfx (campioni + sintesi)] + [voce]; la musica scende sotto le voci (abbassa) e gli sfx calano un poco.
  // Tetto: max 14 campioni insieme, max 3 copie dello stesso suono; una voce alla volta con priorita':
  //   4 annunciatore critico (conto, BRAWL, fine) > 3 annunciatore eventi > 2 mia battuta > 1 battute degli altri.
  A.nuovo = !/[?&]audio=vecchio/.test(location.search);
  var BASE = window.AUDIO_BASE !== undefined ? window.AUDIO_BASE : 'audio_prova/', VER = '?v=a2215';   // VER: cambia quando si rifanno i file (cache del browser)
  // 23/11 VOCI EN: in inglese le battute (eroi + annunciatore) vengono da voci/<chi>/en/ con la loro versione; gli sfx restano gli stessi
  var VOCI_DIR = LINGUA === 'en' ? 'en/' : '', VER_V = LINGUA === 'en' ? '?v=en2311' : VER;
  var DIECI = ['scelta_1', 'scelta_2', 'inizio_1', 'super_1', 'super_2', 'ko_1', 'ko_2', 'colpito_1', 'vittoria', 'sconfitta'];
  var VOCI_EROE = { bot: DIECI.concat(['colpito_2']), pistolero: DIECI, buttafuori: DIECI, samurai: DIECI, lupo: DIECI, croupier: DIECI,
    arciere: DIECI, agamennone: DIECI.concat(['gadget_1', 'gadget_2']), pizzaiolo: DIECI, dj: DIECI, veggente: DIECI,
    dama: DIECI.concat(['gadget_1', 'gadget_2']),   // 22/11 DAMA DI FIORI, voce Leda
    // 22/11 notte CARTE (audio_prova/strumenti/voci_carte.py): Asso = Sadaltager, Regina = Achernar, Fante = Umbriel,
    // Cavaliere = la voce del Fante recitata grave e abbassata (~3 semitoni, eco d'elmo): parla quando il Fante e' trasformato
    asso: DIECI.concat(['gadget_1', 'trafitto_1']), regina: DIECI.concat(['gadget_1', 'cura_1']), fante: DIECI.concat(['trasforma_1', 'trasforma_2']),
    cavaliere: ['super_1', 'super_2', 'trasforma_1'] };
  var ANN = ['tre_1', 'tre_2', 'due_1', 'due_2', 'uno_1', 'uno_2', 'brawl_1', 'brawl_2', 'brawl_3', 'brawl_4', 'modo_gemme', 'modo_duello', 'modo_sopr', 'modo_tutti',
    'primoko_1', 'primoko_2', 'doppio', 'triplo', 'inarrestabile', 'gemmepericolo_1', 'gemmepericolo_2', 'gemmenostre_1', 'gemmenostre_2', 'ultimominuto', 'dieci_1', 'dieci_2',
    'supplementari', 'game_1', 'game_2', 'vittoria_1', 'vittoria_2', 'sconfitta_1', 'sconfitta_2', 'pareggio', 'mvptu', 'mvp', 'benvenuto_1', 'benvenuto_2', 'benvenuto_3',
    'cerca_1', 'cerca_2', 'trovata_1', 'trovata_2', 'pronti_1', 'pronti_2', 'livello', 'trofei', 'eroe_1', 'eroe_2'];
  var SFX_FILE = ['aga_scudo_su', 'aga_parato_1', 'aga_parato_2', 'aga_parato_3', 'aga_scudo_giu', "aga_affondo", "aga_carica", "aga_giro", "aga_impatto_1", "aga_impatto_2", "aga_impatto_3", "aga_lancia", "aga_piantata", "aga_super", "arc_capriola", "arc_impatto_1", "arc_impatto_2", "arc_impatto_3", "arc_oro", "arc_tiro_1", "arc_tiro_2", "arc_tiro_3", "bot_gadget", "bot_gettone_1", "bot_gettone_2", "bot_gettone_3", "bot_jackpot", "bot_leva", "bot_torretta_posa", "bot_torretta_sparo_1", "bot_torretta_sparo_2", "bot_torretta_sparo_3", "butt_atterra", "butt_atterra_muro", "butt_cordone", "butt_manata_1", "butt_manata_2", "butt_manata_3", "butt_portiere", "butt_presa", "butt_rimbalzo_cordone", "butt_scaraventa", "butt_swing", "colpo_leggero_1", "colpo_leggero_2", "colpo_leggero_3", "colpo_pesante_1", "colpo_pesante_2", "crou_carta_1", "crou_carta_2", "crou_carta_3", "crou_impatto_1", "crou_impatto_2", "crou_impatto_3", "crou_mano", "crou_posata", "crou_rastrello", "crou_scala", "crou_scoppia", "dj_cassa", "dj_drop", "dj_impatto_1", "dj_impatto_2", "dj_impatto_3", "dj_onda_1", "dj_onda_2", "dj_onda_3", "dj_pulsa", "dj_tempo", "ko", "lupo_atterra", "lupo_balzo", "lupo_combo_1", "lupo_combo_2", "lupo_combo_3", "lupo_luna", "pist_bossolo_1", "pist_bossolo_2", "pist_impatto_1", "pist_impatto_2", "pist_impatto_3", "pist_oro", "pist_ricercato", "pist_rimbalzo_1", "pist_rimbalzo_2", "pist_sparo_1", "pist_sparo_3", "pist_super", "pist_tamburo", "piz_gigante", "piz_gira", "piz_impatto_1", "piz_impatto_2", "piz_impatto_3", "piz_lancio", "piz_pala_1", "piz_pala_2", "piz_pala_3", "piz_para", "piz_scudo", "piz_splat", "sam_combo_1", "sam_combo_2", "sam_combo_3", "sam_impatto_1", "sam_impatto_2", "sam_impatto_3", "sam_parata", "sam_riflesso", "sam_sette", "sam_sette_3", "sam_taglio", "sam_tresette", "veg_colonna", "veg_impatto_1", "veg_impatto_2", "veg_impatto_3", "veg_mira", "veg_protetto", "veg_raggio_1", "veg_raggio_2", "veg_scambio", "veg_sigillo", "veg_tarocco",
    // GEMME 22/11 (audio_prova/strumenti/fai_sfx_gemme.py, solo Kenney CC0 + sintesi)
    "gemme_cadute_1", "gemme_cadute_2", "gemme_cadute_3", "gemme_cadute_molte", "gemme_ouch", "conto_tic", "conto_teso_1", "conto_teso_2", "conto_teso_3", "conto_teso_4", "conto_teso_5", "conto_via", "conto_stop",
    // DAMA DI FIORI 22/11 (audio_prova/strumenti/ricette_dama.py: Kenney CC0 + Mixkit free + sintesi, niente toni)
    "dama_lancio_1", "dama_lancio_2", "dama_lancio_3", "dama_scoppio_1", "dama_scoppio_2", "dama_scoppio_3", "dama_rovi", "dama_giardino", "dama_radici",
    "dama_siepe", "dama_punge", "dama_siepe_rotta", "dama_impatto_1", "dama_impatto_2", "dama_impatto_3",
    // CARTE 22/11 notte (audio_prova/strumenti/ricette_carte.py: Kenney CC0 + Mixkit free + sintesi). Prima: campioni di altri eroi
    "asso_stoccata_1", "asso_stoccata_2", "asso_stoccata_3", "asso_punta", "asso_lancio", "asso_marcato", "asso_scatto", "asso_trafitto", "asso_ritirata", "asso_impatto_1", "asso_impatto_2", "asso_impatto_3",
    "reg_cuore_1", "reg_cuore_2", "reg_cuore_3", "reg_cura", "reg_cade_1", "reg_cade_2", "reg_cade_3", "reg_pioggia", "reg_grazia", "reg_ritorno", "reg_impatto_1", "reg_impatto_2", "reg_impatto_3",
    "fan_affondo_1", "fan_affondo_2", "fan_rombo", "fan_scoppia", "fan_scatto", "fan_pioggia", "fan_ritorno", "fan_corazza", "fan_esplode", "fan_mazzata_1", "fan_mazzata_2", "fan_carica", "fan_spallata", "fan_travolto",
    "fan_impatto_1", "fan_impatto_2", "fan_impatto_3"];
  // volume di base (dB) per famiglia di suono: i file sono normalizzati sul picco, qui si bilanciano fra loro
  var DB = { bot_leva: -6, bot_gettone: -5, bot_torretta_sparo: -9, bot_jackpot: -4, bot_torretta_posa: -4, bot_gadget: -5,
    pist_sparo: -4, pist_bossolo: -14, pist_tamburo: -12, pist_oro: -4, pist_rimbalzo: -9, pist_super: -3, pist_ricercato: -5, pist_impatto: -8,
    butt_swing: -10, butt_manata: -4, butt_presa: -5, butt_scaraventa: -6, butt_atterra: -3, butt_atterra_muro: -2, butt_cordone: -5, butt_rimbalzo_cordone: -6, butt_portiere: -8,
    colpo_leggero: -10, colpo_pesante: -7, ko: -4,
    sam_combo: -4, sam_taglio: -7, sam_tresette: -4, sam_sette: -4, sam_sette_3: -2, sam_parata: -6, sam_riflesso: -8, sam_impatto: -8,
    lupo_combo: -4, lupo_balzo: -6, lupo_atterra: -4, lupo_luna: -2,
    crou_carta: -6, crou_mano: -12, crou_scala: -7, crou_rastrello: -3, crou_posata: -6, crou_scoppia: -3, crou_impatto: -8,
    arc_tiro: -4, arc_oro: -3, arc_capriola: -7, arc_impatto: -8,
    aga_lancia: -5, aga_piantata: -4, aga_giro: -7, aga_affondo: -6, aga_super: -3, aga_carica: -5, aga_scudo_su: -3, aga_parato: -7, aga_scudo_giu: -8, aga_impatto: -7,
    piz_lancio: -7, piz_pala: -4, piz_gira: -14, piz_splat: -5, piz_gigante: -3, piz_scudo: -6, piz_para: -8, piz_impatto: -8,
    dj_onda: -4, dj_tempo: -3, dj_drop: -1, dj_cassa: -5, dj_pulsa: -10, dj_impatto: -8,
    veg_raggio: -5, veg_mira: -12, veg_colonna: -3, veg_sigillo: -3, veg_tarocco: -6, veg_scambio: -5, veg_protetto: -8, veg_impatto: -8,
    gemme_cadute: -6, gemme_cadute_molte: -4, gemme_ouch: -7, conto_tic: -9, conto_teso: -6, conto_via: -5, conto_stop: -6,
    dama_lancio: -6, dama_scoppio: -4, dama_rovi: -8, dama_giardino: -3, dama_radici: -1, dama_siepe: -4, dama_punge: -7, dama_siepe_rotta: -5, dama_impatto: -8,
    asso_stoccata: -5, asso_punta: -3, asso_lancio: -5, asso_marcato: -5, asso_scatto: -6, asso_trafitto: -2, asso_ritirata: -7, asso_impatto: -8,
    reg_cuore: -6, reg_cura: -8, reg_cade: -13, reg_pioggia: -3, reg_grazia: -6, reg_ritorno: -9, reg_impatto: -8,
    fan_affondo: -5, fan_rombo: -8, fan_scoppia: -3, fan_scatto: -7, fan_pioggia: -4, fan_ritorno: -10, fan_corazza: -2, fan_esplode: -2, fan_mazzata: -4, fan_carica: -4, fan_spallata: -5, fan_travolto: -4, fan_impatto: -8 };
  // impatto sul corpo secondo chi colpisce (famiglia con varianti _1.._3)
  var IMPATTO = { pistolero: ['pist_impatto', 3], samurai: ['sam_impatto', 3], croupier: ['crou_impatto', 3], arciere: ['arc_impatto', 3], agamennone: ['aga_impatto', 3],
    pizzaiolo: ['piz_impatto', 3], dj: ['dj_impatto', 3], veggente: ['veg_impatto', 3], asso: ['asso_impatto', 3], regina: ['reg_impatto', 3], fante: ['fan_impatto', 3], dama: ['dama_impatto', 3] };   // 22/11 notte: anche le carte hanno i loro
  var SUPER_SFX = { pistolero: 'pist_super', agamennone: 'aga_super', regina: 'reg_pioggia' };   // le altre super hanno gia' il loro evento nel motore
  var GADGET_SFX = { bot: 'bot_gadget' };   // Agamennone: il gadget muro_scudo suona con scudoSu
  var BUF = {}, caricati = false, attivi = 0, perNome = {}, inAttesa = null;
  A.mioEroe = null;

  function decodifica(url, ok, fine) {
    fetch(url).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(function (b) { return new Promise(function (s, f) { A.ctx.decodeAudioData(b, s, f); }); })
      .then(function (b) { ok(b); if (fine) fine(); }, function () { if (fine) fine(); });
  }
  // MOBILE 23/11 (piano di caricamento): niente 413 mp3 al primo tocco. A ondate, in una CODA con pochi file in volo (3, 2 in partita),
  // così i modelli 3D della partita passano prima: 1) al tocco annunciatore + sfx comuni; 2) il tuo eroe appena scelto/in partita,
  // gli altri della partita poco dopo; 3) tutto il resto SOLO se serve (una battuta o un suono chiesti la prima volta: intanto suona
  // la sintesi di prima, come quando un campione non è ancora arrivato). ?audio=tutto = tutto subito come prima.
  var PREF = { agamennone: 'aga', pistolero: 'pist', regina: 'reg', pizzaiolo: 'piz', samurai: 'sam', asso: 'asso', buttafuori: 'butt', croupier: 'crou', veggente: 'veg', bot: 'bot', dj: 'dj', arciere: 'arc', lupo: 'lupo', dama: 'dama', fante: 'fan' };
  var DI_PREF = {}; Object.keys(PREF).forEach(function (k) { DI_PREF[PREF[k]] = k; });
  var CODA = [], IN_VOLO = 0, CHIESTI = {}, EROE_OK = {}, TUTTO = /[?&]audio=tutto/.test(location.search);
  function metti(url, ok, prima) { if (CHIESTI[url]) return; CHIESTI[url] = 1; if (prima) CODA.unshift([url, ok]); else CODA.push([url, ok]); vai(); }
  function vai() {
    var max = (window.__brawl && window.__brawl.fase === 'partita') ? 2 : 3;
    while (IN_VOLO < max && CODA.length) { var x = CODA.shift(); IN_VOLO++; decodifica(x[0], x[1], function () { IN_VOLO--; setTimeout(vai, 0); }); }
  }
  function nomeEroe(e) { e = String(e || ''); return VOCI_EROE[e] || PREF[e] ? e : e.split('_')[0]; }
  function caricaEroe(e, prima) {
    e = nomeEroe(e);
    if (!caricati || !e || EROE_OK[e]) return; EROE_OK[e] = 1;
    var v = (VOCI_EROE[e] || []).slice(); if (prima) v.reverse();   // in testa alla coda: l'ordine giusto resta (scelta_1 per prima)
    v.forEach(function (k) {
      metti(BASE + 'voci/' + e + '/' + VOCI_DIR + k + '.mp3' + VER_V, function (b) {
        BUF['v_' + e + '_' + k] = b;
        if (inAttesa && inAttesa.e === e && performance.now() - inAttesa.t < 1500) { var q = inAttesa; inAttesa = null; A.voceEroe(q.e, q.m, true); }
      }, prima);
    });
    var p = PREF[e]; if (p) SFX_FILE.forEach(function (n) { if (n.split('_')[0] === p) metti(BASE + 'sfx/' + n + '.mp3' + VER, function (b) { BUF[n] = b; }, prima); });
  }
  A.caricaEroe = caricaEroe;
  function caricaCampioni() {
    if (caricati || !A.nuovo || !A.ctx || !window.fetch) return; caricati = true;
    if (!A.voce) { A.voce = A.ctx.createGain(); A.voce.gain.value = A.on ? 1 : 0; A.voce.connect(A.master); }
    ANN.forEach(function (k) { metti(BASE + 'voci/annunciatore/' + VOCI_DIR + k + '.mp3' + VER_V, function (b) { BUF['a_' + k] = b; }); });   // prima l'annunciatore
    SFX_FILE.forEach(function (n) { if (!DI_PREF[n.split('_')[0]]) metti(BASE + 'sfx/' + n + '.mp3' + VER, function (b) { BUF[n] = b; }); });   // sfx comuni (conto, colpo, gemme, ko)
    if (A.mioEroe) caricaEroe(A.mioEroe, true);
    if (TUTTO) Object.keys(VOCI_EROE).forEach(function (e) { caricaEroe(e); });
  }
  function dbg(nome) { var k = nome.replace(/_\d+$/, ''); return DB[k] !== undefined ? DB[k] : -6; }
  // suona un campione: varia altezza (+-semi) e volume (+-1,5 dB); false se non c'e' (allora suona il vecchio)
  function camp(nome, vol, semi, ritardo, dest) {
    var b = BUF[nome];
    if (!b && caricati) { var pe = DI_PREF[String(nome).split('_')[0]]; if (pe) caricaEroe(pe, true); }   // MOBILE 23/11: a richiesta
    if (!b || !A.ctx || !A.on) return false;
    if (attivi >= 14 || (perNome[nome] || 0) >= 3) return true;
    var c = A.ctx, s = c.createBufferSource(), g = c.createGain(), t = c.currentTime + (ritardo || 0);
    s.buffer = b; s.playbackRate.value = Math.pow(2, ((Math.random() * 2 - 1) * (semi === undefined ? 0.8 : semi)) / 12);
    g.gain.value = (vol === undefined ? 1 : vol) * Math.pow(10, (dbg(nome) + (Math.random() * 3 - 1.5)) / 20);
    s.connect(g); g.connect(dest || A.sfx); attivi++; perNome[nome] = (perNome[nome] || 0) + 1;
    s.onended = function () { attivi--; perNome[nome]--; };
    s.start(t); return true;
  }
  function uno(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
  function fam(base, n) { return base + '_' + (1 + Math.floor(Math.random() * n)); }   // una variante a caso della famiglia

  // ---- canale voce: una alla volta, per priorita'; coda per le frasi in fila; musica giu' e sfx un filo giu' ----
  var VOCE = { fine: 0, prio: 0, ultimo: {}, coda: [] };
  function parla(b, prio, gain) {
    var c = A.ctx, ora = c.currentTime;
    if (VOCE.src) try { VOCE.src.onended = null; VOCE.src.stop(); } catch (e) { }
    var s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = gain;
    s.connect(g); g.connect(A.voce); s.start(ora); VOCE.src = s; VOCE.fine = ora + b.duration; VOCE.prio = prio;
    s.onended = function () { VOCE.src = null; var q; while ((q = VOCE.coda.shift()) && performance.now() - q.t > 4000) { } if (q) setTimeout(q.f, 120); };
    A.abbassa(0.4, b.duration);
    A.sfx.gain.cancelScheduledValues(ora); A.sfx.gain.setTargetAtTime(A.on ? 0.75 : 0, ora, 0.03); A.sfx.gain.setTargetAtTime(A.on ? 1 : 0, ora + b.duration, 0.15);
  }
  function libera(prio) { return !A.ctx || A.ctx.currentTime >= VOCE.fine || prio > VOCE.prio || (prio >= 4 && prio >= VOCE.prio); }
  // sceglie una variante (mai la stessa due volte di fila)
  function variante(lista, chiave) {
    var k = uno(lista), prima = VOCE.ultimo[chiave];
    if (lista.length > 1 && k === prima) k = lista[(lista.indexOf(k) + 1) % lista.length];
    VOCE.ultimo[chiave] = k; return k;
  }
  A.voceEroe = function (eroe, momento, mia) {
    if (A.ctx && caricati && eroe) caricaEroe(eroe, true);   // MOBILE 23/11: le battute di un eroe si scaricano la prima volta che servono
    if (!A.nuovo || !A.ctx || !A.on || !VOCI_EROE[eroe]) return false;
    var prio = mia ? 2 : 1; if (!libera(prio)) return false;
    var scelte = VOCI_EROE[eroe].filter(function (k) { return k.indexOf(momento) === 0 && BUF['v_' + eroe + '_' + k]; });
    if (!scelte.length) { if (momento === 'scelta' && VOCI_EROE[eroe]) inAttesa = { e: eroe, m: momento, t: performance.now() }; return false; }
    parla(BUF['v_' + eroe + '_' + variante(scelte, eroe + momento)], prio, mia ? 1 : 0.55); return true;
  };
  // annunciatore: cat = 'brawl', 'tre', 'modo_gemme', 'primoko'...; op.coda = aspetta la voce in corso; op.prio (default 3)
  var ultimoAnn = {};
  A.annuncia = function (cat, op) {
    op = op || {};
    if (!A.nuovo || !A.ctx || !A.on) return false;
    var scelte = ANN.filter(function (k) { return (k === cat || k.indexOf(cat + '_') === 0) && BUF['a_' + k]; });
    if (!scelte.length) return false;
    var prio = op.prio || 3, ora = A.ctx.currentTime;
    if (op.raro && ultimoAnn[cat] && ora - ultimoAnn[cat] < op.raro) return false;
    var via = function () { if (!libera(prio)) return; ultimoAnn[cat] = A.ctx.currentTime; parla(BUF['a_' + variante(scelte, 'ann' + cat)], prio, 1); };
    if (op.coda && VOCE.src && ora < VOCE.fine) { VOCE.coda.push({ f: via, t: performance.now() }); return true; }
    if (!libera(prio)) return false;
    via(); return true;
  };
  function voceDopo(eroe, momento, mia, ms) { setTimeout(function () { A.voceEroe(eroe, momento, mia); }, ms); }
  function annDopo(cat, ms, op) { setTimeout(function () { A.annuncia(cat, op); }, ms); }

  // ---- avvolgo le funzioni esistenti ----
  var vecchio = {};
  ['sblocca', 'imposta', 'sparo', 'fx', 'colpo', 'ko', 'superGrido', 'tasto', 'fine', 'brawl', 'ricarica', 'cassa', 'conto', 'game', 'ultimoMinuto', 'dieci', 'serie', 'livello', 'trofei', 'vsEntra', 'vsColpo'].forEach(function (n) { vecchio[n] = A[n]; });
  A.sblocca = function () { vecchio.sblocca(); caricaCampioni(); };
  A.imposta = function (sfx, mus) { vecchio.imposta(sfx, mus); if (A.voce) A.voce.gain.value = sfx ? 1 : 0; };
  var primoKO = false, modoVoluto = null, ultimaTrovata = -99;
  A.impostaEroe = function (id) {
    A.mioEroe = id || null; primoKO = false;
    caricaEroe(id, true);
    // gli altri eroi in campo poco dopo (i modelli 3D della partita intanto passano: la coda ha 2 posti in partita)
    setTimeout(function () { try { var st = window.__brawl && window.__brawl.st; if (st && st.eroi) st.eroi.forEach(function (h) { caricaEroe(h.id); }); } catch (e) { } }, 1500);
  };
  var ultGettone = -9, combo = {};
  function giro(chiave, t, finestra) {   // contatore della combo a 3 (si azzera dopo `finestra` s, come nel motore)
    var cb = combo[chiave] || { n: -1, t: -9 }; cb.n = t - cb.t < (finestra || 1.2) ? (cb.n + 1) % 3 : 0; cb.t = t; combo[chiave] = cb; return cb.n;
  }
  A.sparo = function (stile, mio) {
    if (A.nuovo && A.ctx && A.on) {
      var k = mio ? 1 : 0.5, t = A.ctx.currentTime;
      if (stile === 'gettone' && BUF.bot_gettone_1) {
        if (t - ultGettone > 0.4) camp('bot_leva', k, 0.5);   // la leva solo a inizio raffica
        ultGettone = t; camp(fam('bot_gettone', 3), k, 1.2); return;
      }
      if (stile === 'torretta' && camp(fam('bot_torretta_sparo', 3), 0.7, 1.2)) return;
      if (stile === 'pallottola' && camp(uno(['pist_sparo_1', 'pist_sparo_3']), k, 0.9)) return;
      if (stile === 'mano' && camp('butt_swing', k, 1)) return;
      if ((stile === 'katana' || stile === 'artigli') && BUF.sam_combo_1) return;   // suonano con lampoVia / artiglio (la combo)
      if (stile === 'carta' && camp(fam('crou_carta', 3), k, 1.2)) return;
      if (stile === 'freccia' && camp(fam('arc_tiro', 3), k, 0.3)) return;   // 22/11: thwip secco, poca variazione (non diventa una nota)
      if (stile === 'lancia' && BUF.aga_lancia) return;   // suona con lanciaVia
      if (stile === 'pizza' && camp('piz_lancio', k, 1.2)) return;
      if (stile === 'shuriken' && camp(fam('crou_carta', 3), k * 0.8, 2)) return;
      if (stile === 'seme' && camp(fam('dama_lancio', 3), k, 0.8)) return;   // DAMA: seme lanciato ad arco (fruscio + fwip)
      if (stile === 'cuore' && BUF.reg_cuore_1) return;   // REGINA 22/11 notte: il cuore suona con l'evento cuoreVia (prima qui partiva il sintetico vecchio)
    }
    vecchio.sparo(stile === 'torretta' ? 'gettone' : stile, mio);
  };
  A.fx = function (tipo, e, mio) {
    if (A.nuovo && A.ctx && A.on) {
      var k = mio ? 1 : 0.5, fatto = false, t = A.ctx.currentTime, n;
      switch (tipo) {
        // PISTOLERO
        case 'tamburoColpo': if (!mio) return; fatto = e.d === 1 ? camp('pist_oro', 1, 0.3) : camp('pist_tamburo', 0.6, 1.5); break;
        case 'rimbalzoColpo': fatto = camp(fam('pist_rimbalzo', 2), k, 1.5); break;
        case 'ricercato': fatto = camp('pist_ricercato', k); break;
        // BUTTAFUORI: combo destra, sinistra, bracciata
        case 'manata': n = giro('m' + e.a, t); fatto = camp('butt_manata_' + (n + 1), k, n === 2 ? 0.4 : 1); break;
        case 'presa': fatto = camp('butt_presa', k); break;
        case 'scaraventa': fatto = camp('butt_scaraventa', k); break;
        case 'atterraLancio': fatto = camp(e.b === 1 ? 'butt_atterra_muro' : 'butt_atterra', k, 0.6); break;
        case 'cordone': fatto = camp('butt_cordone', k, 0.5); break;
        case 'rimbalzoCordone': fatto = camp('butt_rimbalzo_cordone', k, 1); break;
        case 'portiere': fatto = camp('butt_portiere', k); break;
        // SAMURAI: combo di 3 fendenti
        case 'lampoVia': n = giro('s' + e.a, t, 1.4); fatto = camp('sam_combo_' + (n + 1), k, n === 2 ? 0.4 : 1); break;
        case 'tagliato': fatto = camp('sam_taglio', k, 1.5); break;
        case 'treSette': fatto = camp('sam_tresette', k, 0.3); break;
        case 'sette': fatto = camp((e.c || 1) >= 3 ? 'sam_sette_3' : 'sam_sette', k, 0.3); break;
        case 'parata': fatto = camp('sam_parata', k, 0.8); break;
        case 'riflesso': fatto = camp('sam_parata', k * 0.7, 1.2); camp('sam_riflesso', k, 1.5); break;   // 23/11: il colpo rimandato fa un piccolo clang d'acciaio
        case 'parataVia': fatto = camp('sam_riflesso', k, 1.5); break;
        // LUPO: due zampate per attacco, combo di 3 sulla prima
        case 'artiglio': if (e.d < 0) fatto = camp('lupo_combo_' + (1 + (giro('l2' + e.a, t, 1.4) % 2)), k * 0.7, 1.5); else { n = giro('l' + e.a, t, 1.4); fatto = camp('lupo_combo_' + (n + 1), k, 1); } break;
        case 'balzo': fatto = camp('lupo_balzo', k); break;
        case 'atterraLupo': fatto = camp('lupo_atterra', k, 0.6); break;
        case 'lunaPiena': fatto = camp('lupo_luna', k, 0); break;
        // CROUPIER
        case 'mano': if (!mio) return; fatto = camp('crou_mano', 1, 2); break;
        case 'scala': fatto = camp('crou_scala', k, 0.3); break;
        case 'rastrello': fatto = camp('crou_rastrello', k, 0.5); break;
        case 'cartaPosata': fatto = camp('crou_posata', k); break;
        case 'cartaScoppia': fatto = camp('crou_scoppia', k, 0.8); break;
        // ARCIERE
        case 'frecciaOro': fatto = camp('arc_oro', k, 0.3); break;
        case 'capriola': fatto = camp('arc_capriola', k); break;
        case 'frecciaCapriola': fatto = camp(fam('arc_tiro', 3), k, 0.3); break;
        // AGAMENNONE
        case 'lanciaVia': fatto = camp('aga_lancia', k, 0.8); break;
        case 'lanciaPiantata': fatto = camp('aga_piantata', k, 0.8); break;
        case 'giroLancia': fatto = camp('aga_giro', k, 0.5); break;
        case 'affondoLancia': fatto = camp('aga_affondo', k, 1); break;
        case 'scudoSu': fatto = camp('aga_scudo_su', k, 0.5); A.voceEroe('agamennone', 'gadget', !!mio); break;
        case 'scudoGiu': fatto = camp('aga_scudo_giu', k * 0.8, 0.8); break;
        case 'paratoScudo': {   // clang di bronzo a ogni colpo fermato: max uno ogni 70 ms, sotto raffica sempre piu' piano
          var ps = combo.scudo || { t: -9, n: 0 }; if (t - ps.t < 0.07) return; ps.n = t - ps.t < 0.5 ? ps.n + 1 : 0; ps.t = t; combo.scudo = ps;
          fatto = camp(fam('aga_parato', 3), k / (1 + 0.35 * Math.min(6, ps.n)), 1.5); break;
        }
        // PIZZAIOLO: la pala da vicino ha 3 colpi diversi
        case 'pala': n = giro('p' + e.a, t, 1.4); fatto = camp('piz_pala_' + (n + 1), k, 1); break;
        case 'pizzaGira': fatto = camp('piz_gira', k * 0.6, 1); break;
        case 'pizzaAtterra': fatto = camp('piz_splat', k, 1.5); break;
        case 'pizzaGigante': fatto = camp('piz_gigante', k, 0.3); break;
        case 'pizzeScudo': fatto = camp('piz_scudo', k); break;
        case 'pizzaPara': fatto = camp('piz_para', k, 1.5); break;
        // DJ
        case 'ondaBassi': fatto = e.d ? camp('dj_tempo', k, 0.3) : camp(fam('dj_onda', 3), k, 0.6); break;
        case 'dropOnda': fatto = camp('dj_drop', k, 0); break;
        case 'cassaPosata': fatto = camp('dj_cassa', k); break;
        case 'cassaPulsa': fatto = camp('dj_pulsa', k, 0.2); break;
        // 22/11 notte CARTE: suoni propri (audio_prova/strumenti/ricette_carte.py) e battute (voci_carte.py). Prima: campioni degli altri eroi
        // ASSO DI PICCHE: stoccata (d=1 colpo di punta: suona puntaAsso), carta della super, marcato, scatto, trafitto, ritirata
        case 'stoccata': if (e.d) break; n = giro('as' + e.a, t, 1.4); fatto = camp('asso_stoccata_' + (n + 1), k, 0.8); break;
        case 'puntaAsso': fatto = camp('asso_punta', k, 0.6); break;
        case 'assoVia': fatto = camp('asso_lancio', k, 0.6); break;
        case 'marcato': fatto = camp('asso_marcato', e.b === 0 || e.a === 0 ? 1 : 0.5, 0.3); break;   // a = marcato, b = l'Asso
        case 'assoScatto': fatto = camp('asso_scatto', k, 0.8); break;
        case 'trafitto': fatto = camp('asso_trafitto', k, 0.3); if (mio) voceDopo('asso', 'trafitto', true, 120); break;
        case 'ritirata': fatto = camp('asso_ritirata', k, 0.8); A.voceEroe('asso', 'gadget', !!mio); break;
        // REGINA DI CUORI: cuore lanciato, cura (b = la Regina), pioggia (cuoreCade, 16 in 4 s), grazia, cuore che torna
        case 'cuoreVia': fatto = camp(fam('reg_cuore', 3), k, 0.8); break;
        case 'cuoreCura': {
          var mia = e.b === 0; fatto = camp('reg_cura', mio || mia ? 1 : 0.5, 0.6);
          if (mia && e.a !== 0 && t - (combo.cura || -99) > 12) { combo.cura = t; voceDopo('regina', 'cura', true, 150); }   // la mia Regina cura un alleato: al massimo ogni 12 s
          break;
        }
        case 'cuoreCade': { var cc = combo.cade || -9; if (t - cc < 0.09) return; combo.cade = t; fatto = camp(fam('reg_cade', 3), k, 1.5); break; }
        case 'grazia': fatto = camp('reg_grazia', k, 0.5); A.voceEroe('regina', 'gadget', !!mio); break;
        case 'cuoreTorna': fatto = camp('reg_ritorno', k, 0.6); break;
        // FANTE DI QUADRI: doppio affondo (d = 0/1), rombo rosso, scoppio, scatto, pioggia di quadri, rombi che tornano
        case 'affondoRombo': fatto = camp('fan_affondo_' + (e.d ? 2 : 1), k, 0.8); break;
        case 'romboRosso': fatto = camp('fan_rombo', e.b === 0 || e.a === 0 ? 1 : 0.5, 1); break;   // a = il segnato, b = il Fante
        case 'romboScoppia': fatto = camp('fan_scoppia', k, 0.8); break;
        case 'scattoRombo': fatto = camp('fan_scatto', k, 0.8); break;
        case 'pioggiaQuadri': fatto = camp('fan_pioggia', k, 0.3); break;
        case 'boomerang': { var bm = combo['bm' + e.a] || -9; if (t - bm < 0.12) return; combo['bm' + e.a] = t; fatto = camp('fan_ritorno', k, 1); break; }   // 5 rombi girano insieme: un suono solo
        // CAVALIERE: corazza che si chiude (+ battuta del Fante, poi a volte la voce cupa), esplosione, mazzata, carica, spallata
        case 'corazza':
          fatto = camp('fan_corazza', k, 0.2); A.voceEroe('fante', 'trasforma', !!mio);
          if (mio && Math.random() < 0.5) voceDopo('cavaliere', 'trasforma', true, 1500);
          break;
        case 'corazzaEsplode': fatto = camp('fan_esplode', k, 0.3); break;
        case 'mazzata': fatto = camp(fam('fan_mazzata', 2), k, 0.6); break;
        case 'caricaCavaliere': fatto = camp('fan_carica', k, 0.5); break;   // la battuta del Cavaliere la fa superGrido (gioco.js passa 'cavaliere')
        case 'spallata': fatto = camp('fan_spallata', k, 0.6); break;
        case 'balzoCav': fatto = camp('fan_scatto', k * 0.8, 0.4); camp('aga_scudo_su', k * 0.5, 0.6); break;   // 23/11 balzo del Cavaliere: stacco + scudo che sale
        case 'schiantoCav': fatto = camp('butt_atterra', k, 0.4); camp('fan_mazzata_2', k * 0.75, 0.5, 0.01); camp('fan_travolto', k * 0.5, 0.6, 0.03); break;   // schianto pesante: tonfo + metallo + crepa
        case 'travolto': fatto = camp('fan_travolto', k, 0.6); break;   // 23/11: chi viene travolto dalla carica del Cavaliere (gioco.js, evento impatto)
        // VEGGENTE
        case 'raggioCristallo': fatto = camp(fam('veg_raggio', 2), k, 0.8); break;
        case 'cecchinoMira': if (!mio) return; fatto = camp('veg_mira', 1, 0.5); break;
        case 'colonnaCristallo': fatto = camp('veg_colonna', k, 0.6); break;
        case 'sigillo': fatto = camp('veg_sigillo', k, 0.5); break;
        case 'taroccoVia': fatto = camp('veg_tarocco', k, 1); break;
        case 'scambio': fatto = camp('veg_scambio', k); break;
        case 'protetto': fatto = camp('veg_protetto', k * 0.8); break;
        // DAMA DI FIORI: seme -> petali + rovi; super giardino trappola; gadget siepe
        case 'rovoScoppia':   // c=1: caduto in un cespuglio della mappa -> rovi doppi
          fatto = camp(fam('dama_scoppio', 3), k, 0.8);
          camp('dama_rovi', k * (e.c === 1 ? 0.9 : 0.6), 0.8, 0.07); if (e.c === 1) camp('dama_rovi', k * 0.6, 1.2, 0.2); break;
        case 'giardino': fatto = camp('dama_giardino', k, 0.3); break;   // la battuta la fa superGrido
        case 'fioreScatta': fatto = camp('dama_radici', mio ? 1 : 0.65, 0.6); break;
        case 'siepe': fatto = camp('dama_siepe', k, 0.5); A.voceEroe('dama', 'gadget', !!mio); break;
        case 'siepePunge': {   // a raffica mentre la si tocca: max uno ogni 150 ms
          var sp = combo.siepe || { t: -9 }; if (t - sp.t < 0.15) return; sp.t = t; combo.siepe = sp;
          fatto = camp('dama_punge', k, 1.5); break;
        }
        case 'siepeRotta': fatto = camp('dama_siepe_rotta', k * (e.b === 1 ? 0.7 : 1), 0.8); break;   // b=1 scaduta: piu' piano
      }
      if (fatto) return;
    }
    vecchio.fx(tipo, e, mio);
  };
  // colpo(pesante, suMe, danno, chiColpisce): ogni eroe colpisce col suo impatto
  var ultColpito = -99;
  A.colpo = function (pesante, suMe, danno, src) {
    if (A.nuovo && A.ctx && A.on && src && VOCI_EROE[src]) {
      var ok = false, im = IMPATTO[src];
      if (im) ok = camp(fam(im[0], im[1]), suMe ? 1 : 0.8, 1.5);
      else if (src === 'buttafuori' || src === 'lupo') ok = camp(pesante ? fam('colpo_pesante', 2) : fam('colpo_leggero', 3), 0.6, 1.5);   // manata e artiglio hanno gia' il loro schiaffo
      else ok = camp(pesante ? fam('colpo_pesante', 2) : fam('colpo_leggero', 3), 0.8, 2);
      if (pesante && src !== 'buttafuori') camp(fam('colpo_pesante', 2), 0.5, 1, 0.01);
      if (!ok) vecchio.colpo(pesante, suMe, danno);
    } else vecchio.colpo(pesante, suMe, danno);
    // colpito forte: a volte l'eroe protesta (al massimo una volta ogni 7 s)
    if (A.nuovo && suMe && pesante && A.mioEroe && A.ctx && A.ctx.currentTime - ultColpito > 7 && Math.random() < 0.6) { ultColpito = A.ctx.currentTime; voceDopo(A.mioEroe, 'colpito', true, 250); }
  };
  // ko(vicino, ioHoFattoKO, sonoIoKO): il primo KO della partita lo annuncia l'annunciatore
  A.ko = function (mio, ioUccido, ioMorto) {
    if (A.nuovo && A.ctx && A.on && A.mioEroe && camp('ko', mio ? 1 : 0.6, 0.6)) { } else vecchio.ko(mio);
    if (!A.nuovo) return;
    if (!primoKO) { primoKO = true; annDopo('primoko', 300); if (ioUccido && A.mioEroe) voceDopo(A.mioEroe, 'ko', true, 1700); return; }
    if (ioUccido && A.mioEroe) voceDopo(A.mioEroe, 'ko', true, 380);
  };
  A.serie = function (n) { vecchio.serie(n); if (A.nuovo) A.annuncia(n >= 4 ? 'inarrestabile' : n === 3 ? 'triplo' : 'doppio'); };
  // super: la battuta dell'eroe prende il posto del grido sintetico
  A.superGrido = function (grave, eroe, mia) {
    if (A.nuovo && VOCI_EROE[eroe] && A.voceEroe(eroe, 'super', !!mia)) { if (SUPER_SFX[eroe]) camp(SUPER_SFX[eroe], mia ? 1 : 0.5); return; }
    if (A.nuovo && SUPER_SFX[eroe] && camp(SUPER_SFX[eroe], mia ? 1 : 0.5)) return;
    vecchio.superGrido(grave);
  };
  A.tasto = function () { if (A.nuovo && GADGET_SFX[A.mioEroe] && camp(GADGET_SFX[A.mioEroe], 1)) return; vecchio.tasto(); };
  A.torretta = function () { if (A.nuovo && camp('bot_torretta_posa', 1, 0.5)) return; vecchio.cassa(); };
  A.jackpot = function () { if (A.nuovo && camp('bot_jackpot', 1, 0)) return; A.superPronta(); };
  A.ricarica = function () { vecchio.ricarica(); if (A.nuovo && A.mioEroe === 'pistolero') camp(fam('pist_bossolo', 2), 1, 2); };
  // ---- annunciatore di partita ----
  A.conto = function (n) {
    if (A.nuovo && A.ctx && A.on && A.annuncia(['uno', 'due', 'tre'][n - 1], { prio: 4 })) { A.abbassa(0.35, 2.4); return; }
    vecchio.conto(n);
  };
  A.brawl = function () {
    if (A.nuovo && A.annuncia('brawl', { prio: 4 })) {
      var sg = A.superGrido; A.superGrido = function () { };   // il vecchio BRAWL sintetico (accordo + colpo) ma senza il grido "HAA" sopra la voce
      try { vecchio.brawl(); } finally { A.superGrido = sg; }
      if (A.mioEroe) voceDopo(A.mioEroe, 'inizio', true, 1500);
      return;
    }
    vecchio.brawl(); if (A.nuovo && A.mioEroe) voceDopo(A.mioEroe, 'inizio', true, 700);
  };
  A.game = function (vinto) { if (A.nuovo && A.annuncia('game', { prio: 4 })) { A.abbassa(0.25, 3); osc('sine', 110, 40, 0.5, 0.8); rumore(0.4, 0.5, 'lowpass', 2000, 100, 1); return; } vecchio.game(vinto); };
  A.ultimoMinuto = function () { vecchio.ultimoMinuto(); if (A.nuovo) annDopo('ultimominuto', 250); };
  A.dieci = function (n) { vecchio.dieci(n); if (A.nuovo && n === 10) A.annuncia('dieci'); };
  A.fine = function (vinto, pari) {
    vecchio.fine(vinto);
    if (!A.nuovo) return;
    annDopo(pari ? 'pareggio' : vinto ? 'vittoria' : 'sconfitta', 500, { prio: 4 });
    if (A.mioEroe && !pari) voceDopo(A.mioEroe, vinto ? 'vittoria' : 'sconfitta', true, 2300);
  };
  A.mvp = function (sonoIo) { if (A.nuovo) annDopo(sonoIo ? 'mvptu' : 'mvp', 4200, { coda: true }); };
  A.gemme = function (nostre) { if (A.nuovo) A.annuncia(nostre ? 'gemmenostre' : 'gemmepericolo', { raro: 8 }); };
  A.supplementari = function () { if (A.nuovo) A.annuncia('supplementari', { prio: 4 }); };
  A.livello = function () { vecchio.livello(); if (A.nuovo) annDopo('livello', 300, { coda: true }); };
  A.trofei = function () { vecchio.trofei(); if (A.nuovo) A.annuncia('trofei', { coda: true, prio: 2 }); };
  // ---- menu e lobby ----
  var ultBenvenuto = -999;
  A.schermo = function (id) {
    if (!A.nuovo || !A.ctx || id !== 's-home') return;
    var ora = A.ctx.currentTime; if (ora - ultBenvenuto < 150) return;
    var primo = ultBenvenuto < -100; ultBenvenuto = ora;
    setTimeout(function () { A.annuncia(primo ? uno(['benvenuto_1', 'benvenuto_3']) : 'benvenuto_2', { prio: 2 }); }, 600);
  };
  A.annunciaModo = function (modo) { modoVoluto = { gemme: 'modo_gemme', duello: 'modo_duello', sopravvivenza: 'modo_sopr', tutti: 'modo_tutti' }[modo] || null; };
  A.vsEntra = function () {
    vecchio.vsEntra();
    if (!A.nuovo || !A.ctx) return;
    if (A.ctx.currentTime - ultimaTrovata > 15) { ultimaTrovata = A.ctx.currentTime; A.annuncia('trovata', { coda: true }); }
    if (modoVoluto) A.annuncia(modoVoluto, { coda: true });
  };
  A.lobby = function (fase) {   // dalla lobby video: 'cerca' | 'trovata' | 'pronti'
    if (!A.nuovo || !A.ctx) return;
    if (fase === 'trovata') ultimaTrovata = A.ctx.currentTime;
    A.annuncia(fase, { coda: true });
  };
  A.sceltaEroe = function (id) { if (!A.voceEroe(id, 'scelta', true)) A.annuncia('eroe', { prio: 2 }); };
  // ---- GEMME 22/11: gemme che cadono al KO e conto alla rovescia (eventi del motore gemmeCadute / contoVia / contoStop / contoTic) ----
  // gemmeCadute(n, nostre, vicino): scroscio di cristalli, piu' grande e forte con tante gemme; «ouch» se le perde la mia squadra
  A.gemmeCadute = function (n, nostre, vicino) {
    if (!A.ctx || !A.on) return;
    var vol = (vicino ? 1 : 0.45) * (0.65 + 0.35 * Math.min(1, n / 6));
    if (A.nuovo && camp(n >= 5 ? 'gemme_cadute_molte' : fam('gemme_cadute', 3), vol, 0.6)) { if (nostre) camp('gemme_ouch', 0.9, 0, 0.1); return; }
    // ripiego sintetico: tintinnii pentatonici che scendono
    var t = A.ctx.currentTime, P = [0, 2, 4, 7, 9], m = Math.min(12, 3 + n);
    for (var i = 0; i < m; i++) { var f = 1568 * Math.pow(2, (P[i % 5] - i * 0.8) / 12); osc('sine', f, f, 0.12, 0.09 * vol, null, t + Math.pow(i / m, 1.3) * 0.4); }
    if (nostre) { osc('triangle', 523, 523, 0.12, 0.12, null, t + 0.1); osc('triangle', 440, 430, 0.22, 0.12, null, t + 0.2); }
  };
  A.contoVia = function (nostra) { if (A.nuovo && camp('conto_via', nostra ? 1 : 0.8, 0)) return; if (!A.ctx || !A.on) return; var t = A.ctx.currentTime; osc('triangle', 523, 1046, 0.3, 0.15, null, t); osc('sine', 1568, 1568, 0.4, 0.1, null, t + 0.28); };
  A.contoStop = function () { if (A.nuovo && camp('conto_stop', 0.9, 0)) return; if (!A.ctx || !A.on) return; osc('sawtooth', 600, 150, 0.35, 0.1); };
  // tic del conto: n = secondi rimasti; gli ultimi 5 hanno un tic proprio, ogni secondo un tono piu' su, col battito sotto
  A.contoTic = function (n, nostra) {
    if (A.nuovo && camp(n >= 1 && n <= 5 ? 'conto_teso_' + n : 'conto_tic', nostra ? 1 : 0.85, 0)) return;
    A.tic(n <= 5);
  };
  A.campioni = BUF;   // per la pagina di prova

  window.Suoni = A;
})();
