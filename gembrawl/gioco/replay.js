// GEM BRAWL — registratore e riproduttore di partite (spettatore 23/11).
// Il motore (motore.js) è deterministico e l'IA (ia.js) ha il suo generatore (st.ria): per rifare una partita IDENTICA
// bastano la configurazione (mappa, modo, eroi, seme) + l'input del giocatore 0 a ogni passo (30 al secondo).
// Niente DOM: gira uguale nel browser (window.REPLAY) e in node (require) per le prove di regressione.
//
//   const R = REPLAY.registratore({ mappa, modo, giocatori, seme, auto });
//   ... a ogni passo, DOPO l'input del giocatore e IA.pensa degli altri, PRIMA di M.passo:  R.passo(st)
//   ... DOPO M.passo:                                                                       R.dopo(st)
//   R.chiudi(st) -> dati (oggetto JSON, ~10-40 KB per 3 minuti)
//   R.pacchetto() -> { da, n, inp, cs } solo i passi nuovi dall'ultima chiamata (base dello spettatore esterno, ~ogni 100 ms)
//
//   const L = REPLAY.lettore(dati)  (oppure REPLAY.lettore(intestazione) + L.aggiungi(pacchetto) per il flusso in diretta)
//   ... a ogni passo, AL POSTO dell'input del giocatore e PRIMA di IA.pensa degli altri: L.input(st, IA)  (false = finiti)
//   ... DOPO M.passo: L.dopo(st)   (confronta i controlli di stato: L.deragliato = primo passo diverso, o -1)
//   REPLAY.simula(dati, M, IA, mappe, eroi?) -> esito della partita rigiocata senza disegno (prove e verifica)
//   Diretta: L.diretta = true; L.riserva = 30 (passi di ritardo); L.puo() dice se si può fare un passo; L.chiudi(esito) a fine partita.
(function (root) {
  'use strict';
  var VER = 1;
  // ordine fisso dei campi di st.inp[i] (motore.js, crea)
  var CAMPI = ['mx', 'my', 'att', 'ax', 'ay', 'sup', 'sx', 'sy', 'gad', 'gx', 'gy'];
  var NC = CAMPI.length;
  // millesimi: la levetta e la mira restano lisce, il file resta piccolo e la cifra riletta dal JSON è IDENTICA
  function q(v) { v = +v || 0; return Math.round(v * 1000) / 1000; }

  // impronta corta di stato (posizioni al centesimo, vita intera, vivo): ogni 30 passi
  function impronta(st) {
    var h = 0x811c9dc5 | 0, i, e;
    function mix(v) { h = Math.imul(h ^ (v | 0), 16777619); }
    mix(st.t);
    for (i = 0; i < st.eroi.length; i++) {
      e = st.eroi[i];
      mix(Math.round(e.x * 100)); mix(Math.round(e.y * 100)); mix(Math.round(e.vita)); mix(e.vivo ? 1 : 0); mix(e.ko); mix(e.gem | 0);
    }
    return h >>> 0;
  }
  // impronta della mappa: se un'altra versione del gioco cambia la mappa, il replay lo dice invece di mostrare un'altra partita
  function improntaMappa(m) {
    var h = 0x811c9dc5 | 0, g = m.g, i;
    for (i = 0; i < g.length; i++) h = Math.imul(h ^ g[i], 16777619);
    return (h >>> 0).toString(36) + '.' + m.w + 'x' + m.h;
  }

  function registratore(cfg) {
    var prec = new Array(NC), righe = [], ripeti = 0, n = 0, ko = [], cs = [], uscito = 0, uscitoR = 0, csUscito = 0, koUscito = 0, chiuso = null;
    for (var i = 0; i < NC; i++) prec[i] = 0;
    var intest = {
      v: VER, gioco: 'gembrawl', modo: cfg.modo, mappa: cfg.mappa.id, impronta: improntaMappa(cfg.mappa), seme: cfg.seme >>> 0, auto: cfg.auto ? 1 : 0,
      giocatori: cfg.giocatori.map(function (g) { return { eroe: g.eroe, squadra: g.squadra | 0, bot: g.bot | 0, nome: g.nome || '' }; }),
      quando: cfg.quando || 0
    };
    function chiudiRipeti() { if (ripeti > 0) { righe.push(ripeti); ripeti = 0; } }
    return {
      intest: intest,
      // prima di M.passo: arrotonda l'input del giocatore (lo stesso numero che rileggerà il riproduttore) e lo segna
      passo: function (st) {
        if (chiuso) return;
        var inp = st.inp[0], mask = 0, val = [], j, v;
        for (j = 0; j < NC; j++) { v = q(inp[CAMPI[j]]); inp[CAMPI[j]] = v; if (v !== prec[j]) { mask |= 1 << j; val.push(v); prec[j] = v; } }
        if (!mask) ripeti++;
        else { chiudiRipeti(); val.unshift(mask); righe.push(val); }
        n++;
      },
      // dopo M.passo: KO del passo e impronta ogni secondo
      dopo: function (st) {
        if (chiuso) return;
        for (var k = 0; k < st.nev; k++) { var e = st.ev[k]; if (e.tipo === 'ko') ko.push([st.t, e.a, e.b]); }
        if (st.t % 30 === 0) cs.push(impronta(st));
      },
      passi: function () { return n; },
      // flusso in diretta: le righe nuove dall'ultima chiamata (ripetizioni in corso comprese)
      pacchetto: function () {
        chiudiRipeti();
        var p = { da: uscito, n: n - uscito, inp: righe.slice(uscitoR), cs: cs.slice(csUscito), csDa: csUscito, ko: ko.slice(koUscito) };
        uscito = n; uscitoR = righe.length; csUscito = cs.length; koUscito = ko.length;
        return p;
      },
      chiudi: function (st) {
        if (chiuso) return chiuso;
        chiudiRipeti();
        chiuso = {};
        for (var k in intest) chiuso[k] = intest[k];
        chiuso.n = n; chiuso.inp = righe; chiuso.cs = cs;
        chiuso.esito = st && st.fine ? { vinc: st.fine.vinc, motivo: st.fine.motivo, t: st.t, ordine: (st.ordine || []).slice(), ko: ko } : { vinc: null, motivo: 'interrotta', t: st ? st.t : n, ordine: st ? (st.ordine || []).slice() : [], ko: ko };
        return chiuso;
      }
    };
  }

  function lettore(dati) {
    var cur = new Array(NC), righe = (dati.inp || []).slice(), ri = 0, rip = 0, letti = 0, totale = dati.n || 0, j;
    for (j = 0; j < NC; j++) cur[j] = 0;
    var csAtteso = (dati.cs || []).slice(), csI = 0, ko = [];
    var L = {
      dati: dati, deragliato: -1, ko: ko,
      // diretta (spettatore esterno): si resta `riserva` passi indietro (30 = 1 s) finché il giocatore non chiude la partita
      diretta: false, riserva: 30, chiuso: false,
      puo: function () { return L.pronti() > (L.diretta && !L.chiuso ? L.riserva : 0); },
      chiudi: function (esito) { L.chiuso = true; if (esito) dati.esito = esito; },
      // flusso in diretta: aggiunge un pacchetto del registratore
      aggiungi: function (p) { for (var k = 0; k < p.inp.length; k++) righe.push(p.inp[k]); totale += p.n; if (p.cs) for (k = 0; k < p.cs.length; k++) csAtteso[(p.csDa || 0) + k] = p.cs[k]; },
      pronti: function () { return totale - letti; },
      letti: function () { return letti; },
      totale: function () { return totale; },
      finito: function () { return letti >= totale; },
      input: function (st, IA) {
        if (letti >= totale) return false;
        if (dati.auto && IA) IA.pensa(st, 0);   // in ?auto=1 il giocatore 0 era un bot: il suo pensiero consuma il generatore dell'IA
        if (rip > 0) rip--;
        else {
          var r = righe[ri++];
          if (typeof r === 'number') rip = r - 1;
          else if (r) { var mask = r[0], v = 1; for (j = 0; j < NC; j++) if (mask & (1 << j)) cur[j] = r[v++]; }
        }
        var inp = st.inp[0];
        for (j = 0; j < NC; j++) inp[CAMPI[j]] = cur[j];
        letti++;
        return true;
      },
      dopo: function (st) {
        for (var k = 0; k < st.nev; k++) { var e = st.ev[k]; if (e.tipo === 'ko') ko.push([st.t, e.a, e.b]); }
        if (st.t % 30 === 0) { var c = impronta(st), a = csAtteso[csI++]; if (a !== undefined && a !== c && L.deragliato < 0) L.deragliato = st.t; }
      }
    };
    return L;
  }

  // la configurazione di M.crea a partire dai dati (mappe = MAPPE del gioco)
  function configura(dati, mappe) {
    var m = mappe[dati.mappa];
    if (!m) throw new Error('replay: mappa sconosciuta ' + dati.mappa);
    var avviso = improntaMappa(m) !== dati.impronta ? 'la mappa ' + dati.mappa + ' è cambiata da quando la partita è stata registrata' : '';
    return { mappa: m, modo: dati.modo, giocatori: dati.giocatori.map(function (g) { return { eroe: g.eroe, squadra: g.squadra, bot: g.bot, nome: g.nome }; }), seme: dati.seme, avviso: avviso };
  }

  // confronto fra due esiti (vincitore, motivo, ordine di eliminazione, KO uno per uno)
  function confronta(a, b) {
    var diff = [];
    if (!a || !b) return ['esito mancante'];
    if (a.vinc !== b.vinc) diff.push('vincitore ' + a.vinc + ' / ' + b.vinc);
    if (a.motivo !== b.motivo) diff.push('motivo ' + a.motivo + ' / ' + b.motivo);
    if (a.t !== b.t) diff.push('durata ' + a.t + ' / ' + b.t);
    if (JSON.stringify(a.ordine || []) !== JSON.stringify(b.ordine || [])) diff.push('ordine ' + JSON.stringify(a.ordine) + ' / ' + JSON.stringify(b.ordine));
    if (JSON.stringify(a.ko) !== JSON.stringify(b.ko)) diff.push('KO ' + a.ko.length + ' / ' + b.ko.length + (a.ko.length && b.ko.length ? ' (primo diverso al passo ' + primoDiverso(a.ko, b.ko) + ')' : ''));
    return diff;
  }
  function primoDiverso(x, y) { for (var i = 0; i < Math.max(x.length, y.length); i++) if (JSON.stringify(x[i]) !== JSON.stringify(y[i])) return (x[i] || y[i])[0]; return -1; }

  // rigioca senza disegno (node o browser): stessi passi del ciclo di gioco.js
  function simula(dati, M, IA, mappe, eroi, tara) {
    var c = configura(dati, mappe);
    var o = { mappa: c.mappa, modo: c.modo, giocatori: c.giocatori, seme: c.seme };
    if (eroi) o.eroi = eroi; if (tara) o.tara = tara;
    var st = M.crea(o);
    IA.prepara(st, c.seme);
    var L = lettore(dati), guard = 0;
    while (!st.fine && guard++ < 200000) {
      if (!L.input(st, IA)) break;
      for (var i = 1; i < st.eroi.length; i++) IA.pensa(st, i);
      M.passo(st);
      L.dopo(st);
    }
    var esito = st.fine ? { vinc: st.fine.vinc, motivo: st.fine.motivo, t: st.t, ordine: (st.ordine || []).slice(), ko: L.ko } : { vinc: null, motivo: 'interrotta', t: st.t, ordine: (st.ordine || []).slice(), ko: L.ko };
    return { esito: esito, deragliato: L.deragliato, diff: confronta(dati.esito, esito), avviso: c.avviso, st: st };
  }

  var REPLAY = { VER: VER, CAMPI: CAMPI, q: q, impronta: impronta, improntaMappa: improntaMappa, registratore: registratore, lettore: lettore, configura: configura, confronta: confronta, simula: simula };
  root.REPLAY = REPLAY;
  if (typeof module !== 'undefined' && module.exports) module.exports = REPLAY;
})(typeof window !== 'undefined' ? window : globalThis);
