// GEM BRAWL — F1 rete (23/11): IL CODEC DEI PACCHETTI fra il server autoritativo e i telefoni.
// Lo stesso file gira nel processo node del server (gembrawl_diretta.mjs) e nella pagina (rete.js): stessi conti, stesso ordine.
//
// IDEA. Il server simula la partita vera e, per ogni giocatore, tiene uno SPECCHIO di quello che quel telefono sa gia'.
// A ogni passo manda solo le differenze fra la verita' (filtrata dalla vista del server: cespugli, fumo, immersione) e lo
// specchio. Specchio e telefono fanno gli stessi identici conti (stesse operazioni IEEE, stesso ordine), quindi restano uguali
// bit per bit: lo controlla un'impronta ogni 30 passi.
//   · ogni campo numerico si ESTRAPOLA: se e' cambiato anche al passo prima, il telefono continua da solo con la stessa
//     pendenza (timer che scendono, proiettili dritti, l'eroe che corre dritto). Il server manda un valore solo quando la
//     verita' si stacca dallo specchio oltre una tolleranza piccola (TOL). Cosi' un proiettile costa un solo messaggio;
//   · un eroe che esce dalla vista si CONGELA (sul telefono resta l'ultima cosa vista, che il disegno spegne); quando rientra
//     si mandano solo i campi diversi. Un oggetto delle riserve (proiettili, zone, torrette, gemme, cubi) che esce dalla vista
//     torna «vuoto» sui due lati;
//   · TCP (websocket) consegna in ordine e non perde: le differenze si appoggiano sempre al pacchetto prima.
// Niente di nascosto passa: si codifica SOLO cio' che Motore.vista(st, seggio) dice visibile (il banco lo ricontrolla).
(function (root) {
  'use strict';
  var VER = 'gbc1-2311';
  var DT = 1 / 30;
  var RISERVE = [['P', 'pr'], ['Z', 'zo'], ['U', 'tu'], ['G', 'ge'], ['C', 'cu']];
  // campi che non viaggiano: d = scheda (costante, il telefono la ha), ox/oy li rifa' il telefono (interpolazione del disegno),
  // regT e seqS servono solo al motore, i e' l'indice (costante), nome lo sa il telefono (dalla cfg)
  var SALTA = { E: { d: 1, ox: 1, oy: 1, regT: 1, seqS: 1, i: 1, nome: 1 }, P: { ox: 1, oy: 1 }, Z: {}, U: {}, G: {}, C: {} };
  var GLOB = ['punti.0', 'punti.1', 'punti.2', 'punti.3', 'punti.4', 'punti.5', 'gemSq.0', 'gemSq.1', 'conto.sq', 'conto.t', 'conto.T',
    'prossimaGemma', 'capo.0', 'capo.1', 'gas.on', 'gas.x0', 'gas.y0', 'gas.x1', 'gas.y1', 'gas.t0', 'supp', 'suppT', 'cassaRotta'];
  // tolleranze (caselle / secondi): sotto la tolleranza lo specchio continua da solo
  var TOL_DEF = 0.0015, TOL = { E: { x: 0.003, y: 0.003, z: 0.004, vx: 0.04, vy: 0.04, kx: 0.05, ky: 0.05, aim: 0.012, ammo: 0.02 }, P: { x: 0.01, y: 0.01, z: 0.01, rest: 0.05, dist: 0.05 }, G: { x: 0.01, y: 0.01 }, C: { x: 0.01, y: 0.01 } };
  // campi che viaggiano al centesimo (la velocita' e la mira servono al disegno, non ai conti)
  var CENT = { E: { vx: 1, vy: 1, kx: 1, ky: 1, aim: 1 }, P: {}, Z: {}, U: {}, G: {}, C: {} };

  function scalare(v) { var t = typeof v; return t === 'number' || t === 'boolean' || t === 'string'; }
  // il numero che viaggia: interi come sono, gli altri al millesimo. -0 -> 0, NaN -> 0, infinito -> +-1e9 (JSON non li porta)
  function q(v) {
    if (typeof v !== 'number') return v;
    if (!(v === v)) return 0;
    if (v === Infinity) return 1e9; if (v === -Infinity) return -1e9;
    if (v === 0) return 0;
    if (Math.floor(v) === v) return v;
    var r = Math.round(v * 1000) / 1000;
    return r === 0 ? 0 : r;
  }
  function qe(v, c) { if (typeof v !== 'number') return v; if (!(v === v)) return 0; if (Math.floor(v) === v) return v === 0 ? 0 : v; var k = c ? 100 : 1000, r = Math.round(v * k) / k; return r === 0 ? 0 : r; }

  // ---- tabelle dei campi: dallo stato APPENA CREATO (uguale sul server e sul telefono: stessa firma = stesso motore) ----
  function tabelle(st) {
    var tab = { E: chiavi(st.eroi, SALTA.E), S: GLOB.slice() };
    for (var r = 0; r < RISERVE.length; r++) tab[RISERVE[r][0]] = chiavi(st[RISERVE[r][1]].slice(0, 1), SALTA[RISERVE[r][0]]);
    return tab;
  }
  function chiavi(lista, salta) {
    var vis = {}, out = [];
    for (var i = 0; i < lista.length; i++) for (var k in lista[i]) if (!salta[k] && !vis[k] && scalare(lista[i][k])) { vis[k] = 1; out.push(k); }
    return out.sort();
  }
  function leggiG(st, p) { var a = p.split('.'); var o = st[a[0]]; return a.length > 1 ? o[a[1]] : o; }
  function scriviG(st, p, v) { var a = p.split('.'); if (a.length > 1) st[a[0]][a[1]] = v; else st[a[0]] = v; }

  // ---- un'entita' dello specchio: valori (m), ultimo valore mandato (lv), passo dell'ultimo invio (ls), pendenza (s) ----
  function nuovaEnt(n) { return { vis: false, m: new Array(n), lv: new Array(n), ls: new Array(n), s: new Array(n) }; }
  function riempiEnt(e, tab, o) {   // dal modello (oggetto vuoto o stato fresco): pendenze a zero
    for (var j = 0; j < tab.length; j++) { var v = q(o[tab[j]]); e.m[j] = v === undefined ? 0 : v; e.lv[j] = e.m[j]; e.ls[j] = -1e9; e.s[j] = 0; }
  }
  function estendi(e, n) { while (e.m.length < n) { e.m.push(0); e.lv.push(0); e.ls.push(-1e9); e.s.push(0); } }
  // 1 · estrapolazione di un passo (solo chi era in vista al passo prima)
  function estrapola(e) { var m = e.m, s = e.s; for (var j = 0; j < m.length; j++) if (s[j] !== 0) m[j] = m[j] + s[j]; }
  // 3 · un valore arrivato al passo f: la pendenza nasce solo da due invii in passi consecutivi
  function metti(e, j, v, f) {
    if (typeof v === 'number') { e.s[j] = (e.ls[j] === f - 1 && typeof e.lv[j] === 'number') ? v - e.lv[j] : 0; }
    else e.s[j] = 0;
    e.m[j] = v; e.lv[j] = v; e.ls[j] = f;
  }
  function ferma(e) { for (var j = 0; j < e.s.length; j++) { e.s[j] = 0; e.ls[j] = -1e9; } }

  // ---- impronta dello specchio (FNV-1a sui bit veri) ----
  var HF = new Float64Array(1), HU = new Uint32Array(HF.buffer), hh = 0;
  function hx(x) { hh = Math.imul(hh ^ (x | 0), 16777619); }
  function hv(v) {
    if (typeof v === 'number') { HF[0] = v === 0 ? 0 : v; hx(HU[0]); hx(HU[1]); }
    else if (typeof v === 'boolean') { hx(v ? 7 : 5); }
    else { v = String(v); hx(v.length); for (var i = 0; i < v.length; i++) hx(v.charCodeAt(i)); }
  }
  function hashSpecchio(S) {
    hh = 0x811c9dc5 | 0;
    var j, k;
    for (k = 0; k < S.E.length; k++) { hx(S.E[k].vis ? 1 : 0); for (j = 0; j < S.E[k].m.length; j++) hv(S.E[k].m[j]); }
    for (var r = 0; r < RISERVE.length; r++) {
      var P = S[RISERVE[r][0]];
      for (k = 0; k < P.length; k++) if (P[k] && P[k].vis) { hx(k); for (j = 0; j < P[k].m.length; j++) hv(P[k].m[j]); }
    }
    for (j = 0; j < S.S.m.length; j++) hv(S.S.m[j]);
    for (j = 0; j < S.g.length; j++) { hx(S.g[j]); hx(S.vc[j]); }
    hv(S.fine); hv(S.ordine);
    return hh >>> 0;
  }

  // ---- lo specchio: STESSA struttura sul server (uno per giocatore + spettatori) e sul telefono ----
  function specchio(st0) {
    var tab = tabelle(st0), S = { tab: tab, f: 0, E: [], S: nuovaEnt(tab.S.length), g: new Uint8Array(st0.g), vc: new Int32Array(st0.vc.length), fine: '', ordine: '[]', nEroi: st0.eroi.length };
    for (var k = 0; k < st0.eroi.length; k++) { var e = nuovaEnt(tab.E.length); riempiEnt(e, tab.E, st0.eroi[k]); S.E.push(e); }
    var vuoti = {};
    for (var r = 0; r < RISERVE.length; r++) { var c = RISERVE[r][0]; S[c] = new Array(st0[RISERVE[r][1]].length); vuoti[c] = st0[RISERVE[r][1]][0]; }
    S.vuoto = {};   // valori di un oggetto vuoto della riserva (come esce da crea / prVuoto)
    for (var c2 in vuoti) { var ev = nuovaEnt(tab[c2].length); riempiEnt(ev, tab[c2], vuoti[c2]); S.vuoto[c2] = ev.m.slice(); }
    var gv = { m: [] }; for (var j = 0; j < tab.S.length; j++) { var v = q(leggiG(st0, tab.S[j])); S.S.m[j] = v; S.S.lv[j] = v; S.S.ls[j] = -1e9; S.S.s[j] = 0; }
    for (var i = 0; i < st0.vc.length; i++) S.vc[i] = Math.round(st0.vc[i]);
    S.fine = JSON.stringify(st0.fine || null); S.ordine = JSON.stringify(st0.ordine || []);
    return S;
  }
  function entRiserva(S, c, k) {
    var e = S[c][k];
    if (!e) { e = S[c][k] = nuovaEnt(S.tab[c].length); }
    var vz = S.vuoto[c];
    for (var j = 0; j < e.m.length; j++) { var v = j < vz.length ? vz[j] : 0; e.m[j] = v; e.lv[j] = v; e.ls[j] = -1e9; e.s[j] = 0; }
    return e;
  }
  // passo 1 comune: estrapola chi era in vista
  function inizioPasso(S, f) {
    S.f = f;
    for (var k = 0; k < S.E.length; k++) if (S.E[k].vis) estrapola(S.E[k]);
    for (var r = 0; r < RISERVE.length; r++) { var P = S[RISERVE[r][0]]; for (var i = 0; i < P.length; i++) if (P[i] && P[i].vis) estrapola(P[i]); }
    estrapola(S.S);
  }

  // =====================================================================================================================
  // CODIFICATORE (server). viewer = indice del seggio, oppure -1 = spettatore (vede tutto).
  // =====================================================================================================================
  function codificatore(st0, viewer) {
    var S = specchio(st0), M = root.Motore, out = { sq: 0, eroi: [], pr: [], zo: [], tu: [], ge: [], cu: [], ev: [] };
    var vistoE = new Uint8Array(st0.eroi.length), vistoR = {};
    for (var r = 0; r < RISERVE.length; r++) vistoR[RISERVE[r][0]] = new Uint8Array(st0[RISERVE[r][1]].length);
    var noti = {}; for (var cn in S.tab) { noti[cn] = {}; for (var jn0 = 0; jn0 < S.tab[cn].length; jn0++) noti[cn][S.tab[cn][jn0]] = 1; }
    function vistaTutto(st) {
      var o = out, k; o.eroi.length = o.pr.length = o.zo.length = o.tu.length = o.ge.length = o.cu.length = o.ev.length = 0;
      for (k = 0; k < st.eroi.length; k++) o.eroi.push(k);
      for (var r = 0; r < RISERVE.length; r++) { var L = st[RISERVE[r][1]], A = o[RISERVE[r][1]]; for (k = 0; k < L.length; k++) if (L[k].vivo) A.push(k); }
      for (k = 0; k < st.nev; k++) o.ev.push(k);
      return o;
    }
    // confronto di un oggetto vero con la sua entita': coppie [j, valore] in d
    function differenze(e, tab, o, tolT, d, f, nuove, cod) {
      var n0 = d.length;
      for (var j = 0; j < tab.length; j++) {
        var v = o[tab[j]];
        if (v === undefined) continue;
        var vq = CENT[cod][tab[j]] ? qe(v, 1) : q(v), m = e.m[j];
        if (typeof vq === 'number' && typeof m === 'number') {
          var t = tolT[tab[j]] || TOL_DEF, dd = vq - m;
          if (dd <= t && dd >= -t) continue;
        } else if (vq === m) continue;
        metti(e, j, vq, f); d.push(j, vq);
      }
      // campi nati durante la partita (il motore aggiunge qualche campo agli oggetti): si annunciano e si mandano
      var nt = noti[cod];
      for (var key in o) {
        if (nt[key] === 1 || (SALTA[cod] && SALTA[cod][key])) continue;
        if (!scalare(o[key])) continue;
        nt[key] = 1; tab.push(key); nuove.push([cod, key]);
        var jn = tab.length - 1; estendiTutte(cod, tab.length);
        var vn = q(o[key]); metti(e, jn, vn, f); d.push(jn, vn);
      }
      return d.length - n0;
    }
    function estendiTutte(cod, n) {
      if (cod === 'E') { for (var k = 0; k < S.E.length; k++) estendi(S.E[k], n); }
      else { var P = S[cod]; for (var i = 0; i < P.length; i++) if (P[i]) estendi(P[i], n); S.vuoto[cod].push(0); }
    }
    return {
      S: S, viewer: viewer,
      // un passo: restituisce l'oggetto pacchetto (senza t/o: li aggiunge chi spedisce)
      passo: function (st, extra) {
        var f = st.t, V = viewer >= 0 ? M.vista(st, viewer, out) : vistaTutto(st), pk = { f: f }, nuove = [], k, j;
        inizioPasso(S, f);
        // eroi
        var vm = 0; for (k = 0; k < V.eroi.length; k++) vm |= 1 << V.eroi[k];
        pk.v = vm;
        var dE = [];
        for (k = 0; k < st.eroi.length; k++) {
          var e = S.E[k], dentro = (vm >> k) & 1;
          if (!dentro) { if (e.vis) { e.vis = false; ferma(e); } continue; }
          if (!e.vis) { e.vis = true; ferma(e); }
          var d = [];
          if (differenze(e, S.tab.E, st.eroi[k], TOL.E, d, f, nuove, 'E')) dE.push(k, d.length / 2), Array.prototype.push.apply(dE, d);
        }
        if (dE.length) pk.E = dE;
        // riserve
        for (var r = 0; r < RISERVE.length; r++) {
          var c = RISERVE[r][0], L = st[RISERVE[r][1]], A = V[RISERVE[r][1]], vis = vistoR[c], P = S[c], dR = [], via = [];
          for (k = 0; k < A.length; k++) vis[A[k]] = 2;
          for (k = 0; k < P.length; k++) if (P[k] && P[k].vis && vis[k] !== 2) { P[k].vis = false; entRiserva(S, c, k).vis = false; via.push(k); }
          for (k = 0; k < A.length; k++) {
            var s = A[k], en = P[s];
            vis[s] = 0;
            if (!en || !en.vis) { en = entRiserva(S, c, s); en.vis = true; }
            var d2 = [];
            if (differenze(en, S.tab[c], L[s], TOL[c] || {}, d2, f, nuove, c)) dR.push(s, d2.length / 2), Array.prototype.push.apply(dR, d2);
          }
          if (dR.length) pk[c] = dR;
          if (via.length) pk[c + 'X'] = via;
        }
        // globali
        var dS = [];
        for (j = 0; j < S.tab.S.length; j++) {
          var vg = q(leggiG(st, S.tab.S[j])), mg = S.S.m[j];
          if (typeof vg === 'number' && typeof mg === 'number') { var dg = vg - mg; if (dg <= TOL_DEF && dg >= -TOL_DEF) continue; }
          else if (vg === mg) continue;
          metti(S.S, j, vg, f); dS.push(j, vg);
        }
        if (dS.length) pk.S = dS;
        var fi = JSON.stringify(st.fine || null); if (fi !== S.fine) { S.fine = fi; pk.F = st.fine || null; }
        var oi = JSON.stringify(st.ordine || []); if (oi !== S.ordine) { S.ordine = oi; pk.O = st.ordine.slice(); }
        // griglia e vita delle casse (le casse si vedono da tutti: sono il terreno)
        var dM = [];
        for (j = 0; j < st.g.length; j++) { var vcj = Math.round(st.vc[j]); if (st.g[j] !== S.g[j] || vcj !== S.vc[j]) { S.g[j] = st.g[j]; S.vc[j] = vcj; dM.push(j, st.g[j], vcj); } }
        if (dM.length) pk.M = dM;
        // eventi del passo (solo quelli della vista)
        if (V.ev.length) {
          var dV = [];
          for (k = 0; k < V.ev.length; k++) { var ev = st.ev[V.ev[k]]; dV.push([ev.tipo, qe(ev.x, 1), qe(ev.y, 1), qe(ev.a), qe(ev.b), qe(ev.c), qe(ev.d)]); }
          pk.V = dV;
        }
        if (nuove.length) pk.K = nuove;
        if (f % 30 === 0) pk.hm = hashSpecchio(S);
        if (extra) for (var x in extra) pk[x] = extra[x];
        return pk;
      },
      hash: function () { return hashSpecchio(S); },
      foto: function () { return fotoSpecchio(S); }   // lo specchio intero (rientro, spettatore che arriva)
    };
  }

  // ---- foto dello specchio: tutto, esatto (JSON porta i double senza perdite) ----
  function entJ(e) { return e ? [e.vis ? 1 : 0, e.m, e.lv, e.ls.map(function (x) { return x < -1e8 ? -1 : x; }), e.s] : 0; }
  function entDaJ(a) { if (!a) return null; return { vis: !!a[0], m: a[1].slice(), lv: a[2].slice(), ls: a[3].map(function (x) { return x < 0 ? -1e9 : x; }), s: a[4].slice() }; }
  function fotoSpecchio(S) {
    var o = { f: S.f, tab: S.tab, E: S.E.map(entJ), S: entJ(S.S), g: Array.prototype.slice.call(S.g), vc: Array.prototype.slice.call(S.vc), fine: S.fine, ordine: S.ordine, vuoto: S.vuoto };
    for (var r = 0; r < RISERVE.length; r++) { var c = RISERVE[r][0], L = []; for (var k = 0; k < S[c].length; k++) if (S[c][k] && S[c][k].vis) L.push(k, entJ(S[c][k])); o[c] = L; }
    return o;
  }

  // =====================================================================================================================
  // DECODIFICATORE (telefono). st = lo stato della pagina creato con Motore.crea(cfg): il disegno lo legge come sempre.
  // =====================================================================================================================
  function decodificatore(st0, mioSq) {
    var S = specchio(st0), st = st0, R = { st: st, S: S, f: 0, div: 0, hmOk: 0, mioSq: mioSq | 0 };
    function versoSt(e, tab, o) { for (var j = 0; j < tab.length; j++) o[tab[j]] = e.m[j]; }
    function svuota(o, c) { var tab = S.tab[c], vz = S.vuoto[c]; for (var j = 0; j < tab.length; j++) o[tab[j]] = j < vz.length ? vz[j] : 0; o.vivo = 0; }
    function deltas(arr, pool, cod, f) {
      var i = 0;
      while (i < arr.length) {
        var k = arr[i++], n = arr[i++], e;
        if (cod === 'E') e = S.E[k];
        else { e = S[cod][k]; if (!e || !e.vis) { e = entRiserva(S, cod, k); e.vis = true; } }
        for (var x = 0; x < n; x++) { var j = arr[i++], v = arr[i++]; metti(e, j, v, f); }
      }
    }
    R.applica = function (pk) {
      var f = pk.f, k, j, c, r;
      if (pk.K) for (k = 0; k < pk.K.length; k++) {
        c = pk.K[k][0]; S.tab[c].push(pk.K[k][1]);
        if (c === 'E') for (j = 0; j < S.E.length; j++) estendi(S.E[j], S.tab.E.length);
        else { for (j = 0; j < S[c].length; j++) if (S[c][j]) estendi(S[c][j], S.tab[c].length); S.vuoto[c].push(0); }
      }
      inizioPasso(S, f);
      // eroi: vista, ingressi, uscite (stesso ordine del codificatore)
      var vm = pk.v | 0;
      for (k = 0; k < S.E.length; k++) {
        var e = S.E[k], dentro = (vm >> k) & 1;
        if (!dentro) { if (e.vis) { e.vis = false; ferma(e); } }
        else if (!e.vis) { e.vis = true; ferma(e); }
      }
      if (pk.E) deltas(pk.E, null, 'E', f);
      for (r = 0; r < RISERVE.length; r++) {
        c = RISERVE[r][0];
        var via = pk[c + 'X'];
        if (via) for (k = 0; k < via.length; k++) { entRiserva(S, c, via[k]).vis = false; svuota(st[RISERVE[r][1]][via[k]], c); }
        if (pk[c]) deltas(pk[c], null, c, f);
      }
      if (pk.S) for (j = 0; j < pk.S.length; j += 2) metti(S.S, pk.S[j], pk.S[j + 1], f);
      if (pk.F !== undefined) S.fine = JSON.stringify(pk.F || null);
      if (pk.O) S.ordine = JSON.stringify(pk.O);
      if (pk.M) for (j = 0; j < pk.M.length; j += 3) { S.g[pk.M[j]] = pk.M[j + 1]; S.vc[pk.M[j]] = pk.M[j + 2]; st.g[pk.M[j]] = pk.M[j + 1]; st.vc[pk.M[j]] = pk.M[j + 2]; }
      if (pk.hm !== undefined) { if (hashSpecchio(S) === pk.hm) R.hmOk++; else R.div++; }
      R.f = f;
      // lo stato della pagina: l'interpolazione del disegno va da ox a x
      st.t = f;
      for (k = 0; k < st.eroi.length; k++) {
        var h = st.eroi[k], ee = S.E[k];
        h.ox = h.x; h.oy = h.y;
        if (ee.vis) versoSt(ee, S.tab.E, h);
        st.vis[k] = ee.vis ? (1 << R.mioSq) : 0;
      }
      for (r = 0; r < RISERVE.length; r++) {
        c = RISERVE[r][0]; var L = st[RISERVE[r][1]], P = S[c], isP = c === 'P';
        for (k = 0; k < P.length; k++) if (P[k] && P[k].vis) { var o = L[k]; if (isP) { o.ox = o.x; o.oy = o.y; } versoSt(P[k], S.tab[c], o); }
      }
      for (j = 0; j < S.tab.S.length; j++) scriviG(st, S.tab.S[j], S.S.m[j]);
      if (pk.F !== undefined) st.fine = pk.F ? JSON.parse(JSON.stringify(pk.F)) : null;
      if (pk.O) st.ordine = pk.O.slice();
      // eventi: nello stesso posto dove li mette il motore (st.ev, st.nev): il disegno e i suoni li leggono come offline
      st.nev = 0;
      if (pk.V) for (k = 0; k < pk.V.length && k < st.ev.length; k++) {
        var a = pk.V[k], ev = st.ev[st.nev++];
        ev.tipo = a[0]; ev.x = a[1]; ev.y = a[2]; ev.a = a[3]; ev.b = a[4]; ev.c = a[5]; ev.d = a[6];
        if (st.osserva) st.osserva(ev);
      }
    };
    // rientro / spettatore: si carica lo specchio intero del server
    R.carica = function (F) {
      // copie: la stessa foto la caricano due specchi (arrivo e riproduzione) e le tabelle crescono coi campi nuovi
      S.f = F.f; S.tab = JSON.parse(JSON.stringify(F.tab)); S.vuoto = JSON.parse(JSON.stringify(F.vuoto)); S.fine = F.fine; S.ordine = F.ordine;
      S.E = F.E.map(entDaJ); S.S = entDaJ(F.S);
      for (var i = 0; i < F.g.length; i++) { S.g[i] = F.g[i]; S.vc[i] = F.vc[i]; st.g[i] = F.g[i]; st.vc[i] = F.vc[i]; }
      for (var r2 = 0; r2 < RISERVE.length; r2++) {
        var c2 = RISERVE[r2][0], L2 = st[RISERVE[r2][1]];
        for (var x = 0; x < S[c2].length; x++) { S[c2][x] = null; if (L2[x].vivo) svuota(L2[x], c2); }
        for (var y = 0; y < F[c2].length; y += 2) S[c2][F[c2][y]] = entDaJ(F[c2][y + 1]);
        for (var z = 0; z < S[c2].length; z++) if (S[c2][z] && S[c2][z].vis) versoSt(S[c2][z], S.tab[c2], L2[z]);
      }
      st.t = F.f;
      for (var k2 = 0; k2 < st.eroi.length; k2++) { var h2 = st.eroi[k2]; versoSt(S.E[k2], S.tab.E, h2); h2.ox = h2.x; h2.oy = h2.y; st.vis[k2] = S.E[k2].vis ? (1 << R.mioSq) : 0; }
      for (var j2 = 0; j2 < S.tab.S.length; j2++) scriviG(st, S.tab.S[j2], S.S.m[j2]);
      st.fine = JSON.parse(S.fine); st.ordine = JSON.parse(S.ordine); st.nev = 0;
      R.f = F.f;
    };
    R.hash = function () { return hashSpecchio(S); };
    return R;
  }

  var Codec = { VER: VER, codificatore: codificatore, decodificatore: decodificatore, tabelle: tabelle, q: q, hashSpecchio: hashSpecchio, RISERVE: RISERVE, GLOB: GLOB };
  root.GBCodec = Codec;
  if (typeof module !== 'undefined') module.exports = Codec;
})(typeof window !== 'undefined' ? window : globalThis);
