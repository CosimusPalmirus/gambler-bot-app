// GAMBLER BRAWL — motore di simulazione (rosa di 10 eroi, attacco/super/gadget unici).
// Deterministico, a passo fisso (30 passi al secondo), nessun disegno, nessun Math.random,
// nessuna data. Contratto:  input (st.inp[i]) -> Motore.passo(st) -> stato (+ st.ev eventi del passo).
// Lo stesso file gira nel browser e in node (banco.js); domani può girare su un arbitro.
(function (root) {
  'use strict';
  var TICK = 30, DT = 1 / TICK;
  var MURO = 1, CESP = 2, CASSA = 3, TAVOLO = 4;
  var R = 0.38;                       // raggio del corpo di un eroe (caselle)
  var MAXP = 420, MAXZ = 32, MAXT = 32, MAXG = 80, MAXEV = 320, MAXC = 40, POT_MAX = 8;
  var VITA_CASSA = 2400;
  var VITA_G = 1.4;                   // moltiplicatore globale della vita (partite da 2-3 minuti)
  var F_SUP = 1, F_TOR = 2, F_ZONA = 4;
  var PESANTI = { lancia_scagliata: 1, pizza_gigante: 1, freccia_oro: 1 };   // colpi che la mano del buttafuori non ferma
  var MISCHIA_M = { stoccata: 1, doppio_rombo: 1, doppio_artiglio: 1, taglio_lampo: 1, manata: 1, affondo: 1, azzannata: 1 };   // attacchi da mischia (passiva del buttafuori) // origine del danno: super, torretta, zona (non caricano la super)
  var RESPAWN = { gemme: 5, duello: 5, sopravvivenza: -1 };
  var LIMITE = { gemme: 150, duello: 120, sopravvivenza: 180 };
  var SUPPL = { gemme: 60, duello: 45, sopravvivenza: 0 };
  var GEMME_VITTORIA = 10, CONTO_GEMME = 15, OGNI_GEMMA = 7;   // GEMME 22/11: soglia, conto alla rovescia (s), una gemma dalla miniera ogni 7 s
  // entità piazzate (st.tu): tipi
  var TU_TORRETTA = 0, TU_MINA = 1, TU_BARILE = 2, TU_SCAGNOZZO = 3, TU_ESCA = 4, TU_CORDONE = 5, TU_LANCIA = 6, TU_CASSA = 7, TU_FIORE = 8, TU_SIEPE = 9;   // 22/11 Dama: fiore-trappola (super), siepe di rovi (gadget)
  // zone (st.zo): tipi
  var Z_MALE = 0, Z_CURA = 1, Z_SCOPPIO = 2, Z_FUMO = 3;

  // tipi di abilità gestiti (il banco controlla che nessun eroe ne condivida uno)
  var TIPI = {
    att: ['slot', 'tamburo', 'affondo', 'tridente', 'azzannata', 'doppio_artiglio', 'shuriken_ombra', 'dado', 'palla_rotolante', 'pila_crollo', 'taglio_lampo', 'carta_servita', 'manata', 'colpo_rimbalzo', 'freccia_lunga', 'lancia_scagliata', 'pizza_rotante', 'onda_bassi', 'raggio_cristallo', 'seme_rovo', 'stoccata', 'cuore_viandante', 'doppio_rombo'],
    sup: ['slot_torretta', 'famiglia', 'falange', 'rete', 'immersione', 'trasformazione', 'fumogeno', 'maledizione', 'bordata', 'fortezza', 'tre_sette', 'rastrello', 'fuori_dal_locale', 'ventaglio_oro', 'freccia_oro', 'pizza_gigante', 'drop', 'sigilli', 'carica_scudo', 'giardino_trappola', 'asso_manica', 'pioggia_cuori', 'pioggia_quadri'],
    gad: ['truccato', 'ricarica', 'carica_oplita', 'pollice_verso', 'frenesia', 'ululato', 'sostituzione', 'calderone', 'barile', 'pila', 'parata', 'carta_coperta', 'cordone', 'balzo_predatore', 'taglia', 'capriola', 'pizze_scudo', 'cassa_bassi', 'tarocco', 'muro_scudo', 'siepe', 'ritirata', 'grazia_reale', 'scatto_rombo']
  };

  // ---------------- numeri casuali deterministici (mulberry32) ----------------
  function rnd(st) {
    var t = (st.rs = (st.rs + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---------------- griglia ----------------
  function tile(st, c, r) {
    if (c < 0 || r < 0 || c >= st.w || r >= st.h) return MURO;
    return st.g[r * st.w + c];
  }
  function bloccaPasso(st, c, r) { var t = tile(st, c, r); return t === MURO || t === CASSA || t === TAVOLO; }
  function bloccaColpo(st, c, r) { var t = tile(st, c, r); return t === MURO || t === CASSA; }
  function liberoPasso(st, x, y) { return !bloccaPasso(st, Math.floor(x), Math.floor(y)); }

  function lineaLibera(st, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0, d = Math.sqrt(dx * dx + dy * dy), n = Math.ceil(d / 0.2), i;
    for (i = 1; i < n; i++) {
      var f = i / n;
      if (bloccaColpo(st, Math.floor(x0 + dx * f), Math.floor(y0 + dy * f))) return false;
    }
    return true;
  }

  function liberaVicina(st, x, y, out) {
    var c0 = Math.floor(x), r0 = Math.floor(y), raggio, dc, dr;
    if (c0 >= 0 && r0 >= 0 && c0 < st.w && r0 < st.h && !bloccaPasso(st, c0, r0)) { out.x = x; out.y = y; return out; }
    for (raggio = 1; raggio < 8; raggio++) {
      var best = 1e9;
      for (dr = -raggio; dr <= raggio; dr++) for (dc = -raggio; dc <= raggio; dc++) {
        var c = c0 + dc, r = r0 + dr;
        if (c < 0 || r < 0 || c >= st.w || r >= st.h || bloccaPasso(st, c, r)) continue;
        var ddx = c + 0.5 - x, ddy = r + 0.5 - y, d2 = ddx * ddx + ddy * ddy;
        if (d2 < best) { best = d2; out.x = c + 0.5; out.y = r + 0.5; }
      }
      if (best < 1e9) return out;
    }
    out.x = x; out.y = y; return out;
  }

  // [fable 17/11] centro finito DENTRO una casella chiusa (o fuori mappa): si riporta nella casella libera piu' vicina.
  // Prima il ripiego spingeva verso il lato piu' vicino senza guardare se era libero: negli angoli e fuori bordo l'eroe restava nel muro.
  function fuoriDalMuro(st, h) {
    if (!(h.x === h.x) || !(h.y === h.y)) { h.x = st.w / 2; h.y = st.h / 2; }
    var c = Math.floor(h.x), r = Math.floor(h.y);
    if (c >= 0 && r >= 0 && c < st.w && r < st.h && !bloccaPasso(st, c, r)) return false;
    var x = Math.max(0.5, Math.min(st.w - 0.5, h.x)), y = Math.max(0.5, Math.min(st.h - 0.5, h.y)), q = liberaVicina(st, x, y, st._tmp), qc = Math.floor(q.x), qr = Math.floor(q.y);
    h.x = x < qc + R ? qc + R : (x > qc + 1 - R ? qc + 1 - R : x);
    h.y = y < qr + R ? qr + R : (y > qr + 1 - R ? qr + 1 - R : y);
    return true;
  }
  function risolvi(st, h) {
    fuoriDalMuro(st, h);
    spingiFuori(st, h);
    if (fuoriDalMuro(st, h)) spingiFuori(st, h);
  }
  // spostamento a passi corti (mai piu' di 0,3 caselle alla volta): scatti e spinte forti non entrano nei muri ne' li saltano
  function muovi(st, h, dx, dy) {
    var l = Math.sqrt(dx * dx + dy * dy), n = l > 0.3 ? Math.ceil(l / 0.3) : 1;
    for (var k = 0; k < n; k++) { h.x += dx / n; h.y += dy / n; risolvi(st, h); }
  }
  function spingiFuori(st, h) {
    for (var it = 0; it < 2; it++) {
      var c0 = Math.floor(h.x - R), c1 = Math.floor(h.x + R), r0 = Math.floor(h.y - R), r1 = Math.floor(h.y + R);
      for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
        if (!bloccaPasso(st, c, r)) continue;
        var px = h.x < c ? c : (h.x > c + 1 ? c + 1 : h.x);
        var py = h.y < r ? r : (h.y > r + 1 ? r + 1 : h.y);
        var dx = h.x - px, dy = h.y - py, d2 = dx * dx + dy * dy;
        if (d2 >= R * R) continue;
        if (d2 > 1e-10) {
          var d = Math.sqrt(d2), k = (R - d) / d;
          h.x += dx * k; h.y += dy * k;
        } else {
          var sx = h.x - c, sy = h.y - r, m = Math.min(sx, 1 - sx, sy, 1 - sy);
          if (m === sx) h.x = c - R; else if (m === 1 - sx) h.x = c + 1 + R; else if (m === sy) h.y = r - R; else h.y = r + 1 + R;
        }
      }
    }
  }

  // ---------------- eventi (pool) ----------------
  function ev(st, tipo, x, y, a, b, c, d) {
    if (st.nev >= MAXEV) return;
    var e = st.ev[st.nev++];
    e.tipo = tipo; e.x = x; e.y = y; e.a = a; e.b = b; e.c = c; e.d = d;
    if (st.osserva) st.osserva(e);     // solo disegno (fx_eroi.js): legge, non tocca lo stato
  }

  // ---------------- creazione ----------------
  function kEroe(o, id) {
    var T = o.tara || root.TARATURA_BRAWL, m = o.modo === 'duello' ? 'duello' : 'gemme';
    if (T && T[m] && T[m][id]) return T[m][id];
    return 1;
  }

  function crea(o) {
    var tab = o.eroi || root.EROI, M = o.mappa, i;
    var st = {
      TICK: TICK, DT: DT, t: 0, modo: o.modo, M: M, w: M.w, h: M.h,
      g: new Uint8Array(M.g), vc: new Float32Array(M.w * M.h),
      rs: (o.seme >>> 0) || 1,
      eroi: [], inp: [], pr: [], zo: [], tu: [], ge: [], cu: [], ev: [], nev: 0,
      nsq: o.modo === 'sopravvivenza' ? o.giocatori.length : 2,
      punti: [0, 0, 0, 0, 0, 0], gemSq: [0, 0], conto: { sq: -1, t: 0, T: CONTO_GEMME }, prossimaGemma: 5, capo: [-1, -1],   // capo[sq] = chi porta piu' gemme nella squadra (-1 nessuno)
      gas: { on: false, x0: 0, y0: 0, x1: M.w, y1: M.h, t0: 0 },
      supp: false, suppT: 0, ordine: [], fine: null, vis: [], cassaRotta: 0, pcur: 0,
      _b: { a: 0, d: 0, x: 0, y: 0, l: 0 }, _tmp: { x: 0, y: 0 }
    };
    for (i = 0; i < st.g.length; i++) if (st.g[i] === CASSA) st.vc[i] = VITA_CASSA;
    for (i = 0; i < MAXP; i++) st.pr.push({ vivo: 0, k: 0, ab: '', ow: 0, sq: 0, x: 0, y: 0, ox: 0, oy: 0, vx: 0, vy: 0, rest: 0, r: 0, dan: 0, pierce: 0, rimb: 0, mask: 0,
      slF: 0, slT: 0, stun: 0, spin: 0, fl: 0, sti: '', t: 0, T: 0, sx: 0, sy: 0, tx: 0, ty: 0, area: 0, fx: 0, z: 0, eroe: '', rompe: 0, ang: 0, faccia: 0, num: 0, dist: 0, tu: -1 });
    for (i = 0; i < MAXZ; i++) st.zo.push({ vivo: 0, tipo: 0, x: 0, y: 0, r: 0, t: 0, T: 0, val: 0, sq: 0, ow: 0, sl: 0, eroe: '', ab: '', sp: 0 });
    for (i = 0; i < MAXT; i++) st.tu.push({ vivo: 0, tipo: 0, x: 0, y: 0, sq: 0, ow: 0, vita: 0, vmax: 0, cd: 0, dur: 0, durMax: 0, arm: 0, danno: 0, gitt: 0, cad: 0, pv: 0, area: 0, ang: 0, eroe: '', colT: -99, lato: 0 });
    for (i = 0; i < MAXG; i++) st.ge.push({ vivo: 0, x: 0, y: 0, vx: 0, vy: 0, t: 0, o: 0 });
    for (i = 0; i < MAXC; i++) st.cu.push({ vivo: 0, x: 0, y: 0, vx: 0, vy: 0, t: 0 });
    for (i = 0; i < MAXEV; i++) st.ev.push({ tipo: '', x: 0, y: 0, a: 0, b: 0, c: 0, d: 0 });
    var slot = [0, 0];
    for (i = 0; i < o.giocatori.length; i++) {
      var gi = o.giocatori[i], d = tab[gi.eroe];
      if (!d) throw new Error('eroe sconosciuto ' + gi.eroe);
      var sq = st.modo === 'sopravvivenza' ? i : gi.squadra;
      var h = {
        i: i, id: gi.eroe, d: d, sq: sq, slot: st.modo === 'sopravvivenza' ? i : slot[gi.squadra]++, bot: gi.bot | 0, nome: gi.nome || '',
        k: kEroe(o, gi.eroe), x: 0, y: 0, ox: 0, oy: 0, vx: 0, vy: 0, kx: 0, ky: 0, fac: 1, aim: 0, mosso: 0,
        vmax: 0, vita: 0, ammo: 3, cd: 0, sup: 0, supPronta: false,
        vivo: true, rt: 0, riv: 0, rivT: 0, nasc: false, regT: 0, stun: 0, radiceT: 0, rovoT: 0, slowT: 0, slowF: 0, scuT: 0, scuF: 0, invT: 0, prot: 0,
        dashD: 0, dvx: 0, dvy: 0, dmask: 0, dashTipo: '', salT: 0, salTT: 0, salSx: 0, salSy: 0, salTx: 0, salTy: 0, salTipo: '', salDa: -1, z: 0,
        seqN: 0, seqT: 0, seqA: 0, seqI: 0, tirT: 0, tirX: 0, tirY: 0,
        // preparazione di super/gadget (runa a terra)
        prepT: 0, prepTT: 0, prepCosa: 0, prepX: 0, prepY: 0,
        // gadget
        gadUsi: d.gad.usi || 3, gadCd: 0,
        // stati speciali
        sangueT: 0, sangueDps: 0, sangueDa: -1, pauraT: 0, pauraX: 0, pauraY: 0,
        trasT: 0, immT: 0, freT: 0, esecT: 0, trucN: 0, falT: 0, fortT: 0, fortSh: 0, oplT: 0, muroT: 0, muroA: 0, giroT: 0,
        parT: 0, altT: 0, mano: 0, presa: -1, lampoF: 1, capA: 0, colpi: 0, portT: 0, orbT: 0, orbC: 0, dropN: 0, dropT: 0, dropI: 0, cecT: 0, cecA: 0, ventN: 0, ventT: 0, ventI: 0, ventA: 0, taglT: 0, tagliaDa: -1, aggF: 1, pot: 0, vbase: 0,
        gem: 0, ko: 0, morti: 0, dan: 0, cure: 0, gemTot: 0, supUsate: 0, gadUsate: 0,
        cavT: 0, cavSh: 0, corN: 0, corSup: 0, romboT: 0, romboDa: -1, rombo1: 0, mancaT: 0, mancaB: -1, marcaT: 0, marcaDa: -1, graziaN: 0,   // 22/11 carte: Fante (corazza, rombo), Asso (marcato), Regina (grazia)
        tAtt: -99, tSup: -99, tGad: -99, tCol: -99, tKo: -99, tSpawn: 0
      };
      h.vmax = Math.round(d.vita * h.k * VITA_G * (st.modo === 'sopravvivenza' ? 2 : st.modo === 'duello' ? 1.25 : 1)); h.vita = h.vmax; h.vbase = h.vmax;
      st.eroi.push(h);
      st.inp.push({ mx: 0, my: 0, att: 0, ax: 0, ay: 0, sup: 0, sx: 0, sy: 0, gad: 0, gx: 0, gy: 0 });
      st.vis.push(0);
      nasci(st, h);
    }
    if (st.modo === 'sopravvivenza') { st.gas.on = true; st.gas.t0 = M.gas ? M.gas.t0 : 25; }   // 23/11: gas proprio della mappa
    return st;
  }

  function puntoNascita(st, h) {
    var M = st.M;
    if (st.modo === 'sopravvivenza') return M.ffa[h.slot % M.ffa.length];
    var l = M.sp[h.sq];
    return l[h.slot % l.length];
  }

  function nasci(st, h) {
    var p = puntoNascita(st, h);
    h.x = p.x; h.y = p.y; risolvi(st, h); h.ox = h.x; h.oy = h.y; h.vx = h.vy = 0;
    h.vivo = true; h.vita = h.vmax; h.ammo = 3; h.cd = 0; h.stun = 0; h.radiceT = 0; h.slowT = 0; h.scuT = 0; h.invT = 0;
    h.dashD = 0; h.salT = 0; h.z = 0; h.seqN = 0; h.tirT = 0; h.kx = h.ky = 0; h.prepT = 0;
    h.sangueT = 0; h.pauraT = 0; h.trasT = 0; h.immT = 0; h.freT = 0; h.esecT = 0; h.falT = 0; h.fortT = 0; h.fortSh = 0; h.oplT = 0; h.muroT = 0; h.rivT = 0;
    h.parT = 0; h.altT = 0; h.mano = 0; h.salTipo = ''; h.tAtt = -99; h.colpi = 0; h.ventN = 0; h.taglT = 0; h.aggF = 1; h.orbT = 0; h.dropN = 0; h.cecT = 0;
    h.prot = st.t === 0 ? 0 : 1.5; h.tSpawn = st.t; h.regT = 0;
    h.cavT = 0; h.cavSh = 0; h.corN = 0; h.corSup = 0; h.romboT = 0; h.mancaT = 0; h.marcaT = 0; h.graziaN = 0;   // 22/11 carte
    h.aim = h.sq === 0 || (st.modo === 'sopravvivenza' && p.y > st.h / 2) ? -Math.PI / 2 : Math.PI / 2;
  }

  // ---------------- danno, cura, KO ----------------
  function cura(st, h, v, da) {
    if (!h.vivo || v <= 0) return;
    var prima = h.vita;
    h.vita = Math.min(h.vmax, h.vita + v);
    var fatto = h.vita - prima;
    if (fatto > 0) { ev(st, 'cura', h.x, h.y, h.i, Math.round(fatto), 0, 0); if (da) da.cure += fatto; }
    if (fatto > 0 && da && da !== h && da.vivo && da.d.cuoreRegale) { var rg = Math.min(da.vmax - da.vita, fatto * da.d.cuoreRegale); if (rg > 0) { da.vita += rg; da.cure += rg; ev(st, 'cura', da.x, da.y, da.i, Math.round(rg), 1, 0); } }   // 22/11 Regina: cuore regale
  }

  function intoccabile(h) { return h.immT > 0 || h.salTipo === 'balzoCav'; }   // 23/11: il Cavaliere in volo (balzo del gadget) non si tocca

  // il punto (o la sua provenienza) sta nel cono davanti allo scudo alzato
  function davantiScudo(t, ox, oy, x, y) {
    var g = t.d.gad, semi = ((g && g.ango) || 140) * Math.PI / 360, c = Math.cos(t.muroA), s = Math.sin(t.muroA);
    var px = (ox === ox ? ox : x) - t.x, py = (oy === oy ? oy : y) - t.y, d = Math.sqrt(px * px + py * py);
    if (d < 0.05) { px = x - t.x; py = y - t.y; d = Math.sqrt(px * px + py * py); if (d < 0.05) return true; }
    return (px * c + py * s) / d >= Math.cos(semi);
  }
  function danneggia(st, src, t, dmg, fl, x, y) {
    if (!t.vivo || intoccabile(t)) return 0;
    if (t.prot > 0) { ev(st, 'protetto', t.x, t.y, t.i, 0, 0, 0); return 0; }
    // buttafuori, passiva «Alla porta»: chi lo colpisce da vicino in mischia viene respinto con una spinta (e si prende un colpetto)
    if (t.d.portiere && src && src !== t && t.portT <= 0 && !(fl & (F_SUP | F_ZONA | F_TOR)) && MISCHIA_M[src.d.att.tipo]) {
      var pdx = src.x - t.x, pdy = src.y - t.y, pd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
      if (pd < 2.8) { t.portT = t.d.portiere.cd; ev(st, 'portiere', t.x, t.y, t.i, src.i, Math.atan2(pdy, pdx), 0); if (src.falT <= 0 && src.fortT <= 0) { src.kx = pdx / pd * t.d.portiere.spinta * 5.4; src.ky = pdy / pd * t.d.portiere.spinta * 5.4; } if (t.d.portiere.danno) danneggia(st, t, src, t.d.portiere.danno * t.k, F_ZONA, src.x, src.y); }
    }
    // parata del samurai: il colpo non passa e, se chi colpisce è vicino, parte il contrattacco
    if (t.parT > 0 && src && src !== t && !(fl & F_ZONA)) { contrattacco(st, t, src); return 0; }
    if (t.muroT > 0 && src && src !== t && !(fl & F_ZONA) && davantiScudo(t, x, y, x, y)) { ev(st, 'parato', t.x + Math.cos(t.muroA) * 0.5, t.y + Math.sin(t.muroA) * 0.5, t.i, t.muroA, 1, 0); return 0; }
    if (src && src.d.duello && src !== t && !(fl & F_ZONA) && solo(st, t, src.d.duello.raggio)) dmg *= src.d.duello.f;   // 22/11 Asso: duello (nemico isolato)
    if (src && src.esecT > 0 && t.vita / t.vmax < 0.35) { dmg *= 2; ev(st, 'esecuzione', t.x, t.y, t.i, src.i, 0, 0); }
    if (src && src.trasT > 0 && !(fl & (F_ZONA | F_TOR))) dmg *= src.d.sup.dmg || 1;
    if (src && t.taglT > 0 && t.tagliaDa === src.i) dmg *= (src.d.gad.tipo === 'taglia' && src.d.gad.extra) || 1.25;            // ricercato: i colpi del pistolero fanno di piu'
    if (src && src.aggF > 1 && !(fl & (F_SUP | F_TOR | F_ZONA)) && st.t - src.tAtt < 12) dmg *= src.aggF;   // agguato dal cespuglio (mischia)
    if (src && src.pot > 0) dmg *= 1 + 0.1 * src.pot;                                            // cubi della sopravvivenza
    if (t.scuT > 0) dmg *= (1 - t.scuF);
    dmg = Math.round(dmg);
    if (!(dmg > 0) || dmg === Infinity) return 0;   // [fable] anche NaN: una vita NaN rendeva l'eroe immortale
    var vero = dmg;
    if (t.cavSh > 0) { var asc = Math.min(t.cavSh, dmg); t.cavSh -= asc; dmg -= asc; ev(st, 'scudoAssorbe', t.x, t.y, t.i, asc, 1, 0); }   // 22/11 Fante: la corazza del Cavaliere si consuma per prima
    if (t.fortSh > 0) { var ass = Math.min(t.fortSh, dmg); t.fortSh -= ass; dmg -= ass; ev(st, 'scudoAssorbe', t.x, t.y, t.i, ass, 0, 0); }
    t.vita -= dmg; t.tCol = st.t; t.regT = 0;
    if (t.riv < 0.5) t.riv = 0.5;
    if (src) {
      src.dan += vero;
      if (src !== t && src.d.corazza && src.cavT <= 0 && src.vivo && !(fl & (F_ZONA | F_TOR)) && (!(fl & F_SUP) || src.corSup)) { if (fl & F_SUP) src.corSup = 0; caricaCorazza(st, src, 1); }   // 22/11 Fante: ogni colpo a segno riempie la corazza (super = 1)
      if (!(fl & (F_SUP | F_TOR | F_ZONA))) {
        src.sup += vero / (src.d.pieno * src.k * src.d.sup.carica);
        if (src.sup >= 1) { src.sup = 1; if (!src.supPronta) { src.supPronta = true; ev(st, 'superpronta', src.x, src.y, src.i, 0, 0, 0); } }
      }
      if (src.trasT > 0 && src.vivo && !(fl & F_ZONA)) cura(st, src, vero * (src.d.sup.vamp || 0), null);
    }
    ev(st, 'colpo', t.x, t.y, t.i, vero, src ? src.i : -1, fl);
    if (t.vita <= 0) ko(st, t, src);
    return vero;
  }

  // ---------------- 22/11 CARTE: Asso, Regina, Fante ----------------
  // nessun suo alleato (vivo) entro r caselle dal bersaglio: duello dell'Asso
  function solo(st, t, r) {
    for (var i = 0; i < st.eroi.length; i++) { var o = st.eroi[i]; if (o === t || !o.vivo || o.sq !== t.sq) continue; var dx = o.x - t.x, dy = o.y - t.y; if (dx * dx + dy * dy <= r * r) return false; }
    return true;
  }
  // Fante: la corazza si riempie a ogni colpo a segno; piena = Cavaliere
  function caricaCorazza(st, h, n) {
    var c = h.d.corazza; if (!c || h.cavT > 0 || !h.vivo) return;
    h.corN += n; ev(st, 'corazzaCarica', h.x, h.y, h.i, h.corN, c.colpi, 0);
    if (h.corN >= c.colpi) {
      h.corN = 0; h.cavT = c.dur; h.cavSh = c.scudo * h.k;
      ev(st, 'corazza', h.x, h.y, h.i, c.dur, h.cavSh, 0);
    }
  }
  function fineCorazza(st, h) {
    var e = h.d.corazza.esplode;
    h.cavT = 0; h.cavSh = 0; h.corN = 0;
    if (h.dashTipo === 'oplita') { h.dashD = 0; h.oplT = 0; }
    ev(st, 'corazzaEsplode', h.x, h.y, h.i, e.area, 0, 0);
    colpoArea(st, h, h.sq, h.x, h.y, e.area, e.danno * h.k, F_ZONA, 0.8, 0, 0, 0);
  }
  // boomerang (rombi del Fante, cuore della Regina con la grazia): si gira verso chi l'ha tirato
  function giraBoomerang(st, p) {
    if (p.rifl) { p.vivo = 0; ev(st, 'svanito', p.x, p.y, p.ow, p.ang, p.k, 0); return; }   // rimandato dalla parata: non torna
    var o = st.eroi[p.ow0 >= 0 ? p.ow0 : p.ow], v = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 12;
    p.torna = 2; p.passa = 1; p.mask = 0; p.rest = 14; p.dist = 0;   // al ritorno passa sopra i muri
    var a = o && o.vivo ? Math.atan2(o.y - p.y, o.x - p.x) : Math.atan2(-p.vy, -p.vx);
    p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; p.ang = a;
    ev(st, 'boomerang', p.x, p.y, p.ow, a, 0, 0);
  }
  // cuore della Regina che passa su un alleato: lo cura (e carica la super come un colpo)
  function curaCuore(st, p, t) {
    var src = st.eroi[p.ow0 >= 0 ? p.ow0 : p.ow]; if (!src || !src.d.att.cura) return;
    var prima = t.vita, v = src.d.att.cura * src.k;
    cura(st, t, v, src);
    var fatto = t.vita - prima;
    ev(st, 'cuoreCura', t.x, t.y, t.i, src.i, Math.round(fatto), 0);
    if (fatto > 0 && src.vivo) { src.sup += fatto / (src.d.pieno * src.k * src.d.sup.carica); if (src.sup >= 1) { src.sup = 1; if (!src.supPronta) { src.supPronta = true; ev(st, 'superpronta', src.x, src.y, src.i, 0, 0, 0); } } }
  }
  // pioggia di cuori: un cuore ogni o.ogni secondi in un punto a caso dell'area (male ai nemici, cura agli alleati)
  function pioggiaCuori(st, z, src) {
    if (!src) return;
    var o = src.d.sup; z.sp += DT;
    while (z.sp >= o.ogni) {
      z.sp -= o.ogni;
      var a = rnd(st) * Math.PI * 2, rr = z.r * Math.sqrt(rnd(st)), x = clampX(st, z.x + Math.cos(a) * rr), y = clampY(st, z.y + Math.sin(a) * rr);
      ev(st, 'cuoreCade', x, y, z.ow, o.area, 0, 0);
      for (var i = 0; i < st.eroi.length; i++) {
        var t = st.eroi[i]; if (!t.vivo) continue;
        var dx = t.x - x, dy = t.y - y, rq = o.area + R * 0.6;
        if (dx * dx + dy * dy > rq * rq) continue;
        if (t.sq === z.sq) cura(st, t, o.cura * src.k, src);
        else danneggia(st, src, t, o.danno * src.k, F_SUP | F_ZONA, x, y);
      }
    }
  }
  // stoccata dell'Asso: lama dritta e sottile; nell'ultimo terzo e' un colpo di punta (asso)
  function stoccata(st, h, ang, a) {
    var c = Math.cos(ang), s = Math.sin(ang), L, i, len = a.gitt;
    for (L = 0.3; L < len; L += 0.15) { var tx = Math.floor(h.x + c * L), ty = Math.floor(h.y + s * L); if (bloccaColpo(st, tx, ty)) { danneggiaCassa(st, tx, ty, a.danno * h.k, h); break; } }
    if (L > len) L = len;
    var punta = 0;
    for (i = 0; i < st.eroi.length; i++) {
      var t = st.eroi[i];
      if (!t.vivo || t.sq === h.sq) continue;
      var dx = t.x - h.x, dy = t.y - h.y, pr = dx * c + dy * s;
      if (pr < 0 || pr > L + R || Math.abs(dx * s - dy * c) > a.larg + R) continue;
      var asso = pr >= len * 0.62;
      var f = danneggia(st, h, t, a.danno * h.k * (asso ? a.punta : 1), 0, t.x, t.y);
      if (f && t.vivo) spingi(t, c, s, asso ? 0.45 : 0.25);
      if (f && asso) { punta = 1; ev(st, 'puntaAsso', t.x, t.y, h.i, t.i, ang, 0); }
    }
    for (i = 0; i < MAXT; i++) {
      var tu = st.tu[i];
      if (!tu.vivo || tu.sq === h.sq || !bersaglioTu(tu)) continue;
      var ex = tu.x - h.x, ey = tu.y - h.y, pr2 = ex * c + ey * s;
      if (pr2 < 0 || pr2 > L + 0.4 || Math.abs(ex * s - ey * c) > a.larg + 0.4) continue;
      danneggiaTorretta(st, h, tu, a.danno * h.k);
    }
    ev(st, 'stoccata', h.x, h.y, h.i, ang, L, punta);
  }

  function contrattacco(st, t, src) {
    var g = t.d.gad, dx = src.x - t.x, dy = src.y - t.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
    t.parT = 0;
    guarda(t, Math.atan2(dy, dx)); t.tAtt = st.t;
    ev(st, 'parata', t.x, t.y, t.i, src.i, Math.atan2(dy, dx), d <= g.gitt ? 1 : 0);
    if (d > g.gitt || !src.vivo) return;
    // fendente di risposta: arriva sempre a chi l'ha colpito da vicino (anche dietro un cespuglio)
    var fatto = danneggia(st, t, src, g.danno * t.k, 0, src.x, src.y);
    if (fatto && src.vivo) spingi(src, dx / d, dy / d, 0.8);
  }

  function ko(st, t, src) {
    t.vita = 0; t.vivo = false; t.tKo = st.t; t.morti++;
    t.seqN = 0; t.dashD = 0; t.salT = 0; t.salTipo = ''; t.cavT = 0; t.cavSh = 0; t.corN = 0; t.mancaT = 0; t.romboT = 0; t.marcaT = 0; t.tirT = 0; t.z = 0; t.prepT = 0; t.immT = 0; t.parT = 0; t.altT = 0; t.ventN = 0; t.orbT = 0; t.dropN = 0; t.cecT = 0;
    if (src && src !== t) src.ko++;
    ev(st, 'ko', t.x, t.y, t.i, src ? src.i : -1, 0, 0);
    if (t.gem > 0) gemmeSparse(st, t, src);
    // le sue cose piazzate restano (torrette, mine, barili) tranne gli scagnozzi
    for (var j = 0; j < MAXT; j++) { var tu = st.tu[j]; if (tu.vivo && tu.ow === t.i && tu.tipo === TU_SCAGNOZZO) { tu.vivo = 0; ev(st, 'torrettaKo', tu.x, tu.y, tu.ow, 0, tu.tipo, 0); } }
    if (st.modo === 'sopravvivenza') { for (var cq = 0; cq < Math.max(1, t.pot); cq++) { var ca = cq * 2.4; cubo(st, t.x, t.y, Math.cos(ca) * 2.5, Math.sin(ca) * 2.5); } t.pot = 0; }
    var rs = RESPAWN[st.modo];
    if (rs > 0) t.rt = rs; else { t.rt = -1; st.ordine.push(t.sq); }
    if (st.modo === 'duello' && src && src !== t) st.punti[src.sq]++;
    if (st.modo === 'duello' && (!src || src === t)) st.punti[1 - t.sq]++;
    if (st.supp && st.modo !== 'sopravvivenza') {
      // [fable] due KO nello stesso passo ai supplementari: pareggio (prima vinceva chi moriva per ultimo nel ciclo)
      if (st.fine && st.fine.motivo === 'supp_ko' && st.fine.t === st.t && st.fine.vinc !== 1 - t.sq) st.fine.vinc = -1;
      else if (!st.fine) st.fine = { vinc: 1 - t.sq, motivo: 'supp_ko', t: st.t };
    }
  }

  // o: 0 = uscita dalla miniera, 1 = caduta da chi e' andato KO (i bot e il disegno le distinguono)
  function gemma(st, x, y, vx, vy, o) {
    for (var i = 0; i < MAXG; i++) {
      var g = st.ge[i];
      if (!g.vivo) { var q = liberaVicina(st, x, y, st._tmp); g.vivo = 1; g.x = q.x; g.y = q.y; g.vx = vx; g.vy = vy; g.t = 0; g.o = o | 0; return g; }   // [fable] mai dentro acqua/muro (KO in volo): la gemma restava irraggiungibile
    }
    return null;
  }

  // GEMME 22/11: chi va KO lascia TUTTE le gemme a corona attorno a se' (girasole: angolo d'oro, raggio che cresce
  // con il numero), cosi' si contano a colpo d'occhio e non finiscono una sull'altra. Restano a terra finche' qualcuno
  // non le prende. Con l'attrito 0,86 a passo una gemma lanciata a v percorre v*DT/0,14 caselle: v = raggio*0,14/DT.
  function gemmeSparse(st, t, src) {
    var n = t.gem; t.gem = 0;
    var R = n === 1 ? 0.55 : 0.75 + 0.28 * Math.sqrt(n), a0 = rnd(st) * Math.PI * 2;
    for (var k = 0; k < n; k++) {
      var rr = n === 1 ? R : R * Math.sqrt((k + 0.6) / n), a = a0 + k * 2.39996, v = rr * 0.14 / DT;
      gemma(st, t.x, t.y, Math.cos(a) * v, Math.sin(a) * v, 1);
    }
    ev(st, 'gemmeCadute', t.x, t.y, t.i, n, src ? src.i : -1, t.sq);
  }

  // cubo di potenziamento (sopravvivenza): esce dalle casse rotte e da chi va KO
  function cubo(st, x, y, vx, vy) {
    for (var i = 0; i < MAXC; i++) { var q = st.cu[i]; if (!q.vivo) { var lv = liberaVicina(st, x, y, st._tmp); x = lv.x; y = lv.y; q.vivo = 1; q.x = x; q.y = y; q.vx = vx; q.vy = vy; q.t = 0; ev(st, 'cuboNato', x, y, 0, 0, 0, 0); return q; } }
    return null;
  }
  function aggiornaCubi(st) {
    for (var i = 0; i < MAXC; i++) {
      var q = st.cu[i]; if (!q.vivo) continue;
      q.t += DT;
      if (q.vx || q.vy) {
        var nx = q.x + q.vx * DT, ny = q.y + q.vy * DT;
        if (liberoPasso(st, nx, q.y)) q.x = nx; else q.vx = 0;
        if (liberoPasso(st, q.x, ny)) q.y = ny; else q.vy = 0;
        q.vx *= 0.85; q.vy *= 0.85; if (q.vx * q.vx + q.vy * q.vy < 0.01) q.vx = q.vy = 0;
      }
      if (q.t < 0.4) continue;
      for (var j = 0; j < st.eroi.length; j++) {
        var h = st.eroi[j];
        if (!h.vivo || h.salT > 0 || h.immT > 0) continue;
        if ((h.x - q.x) * (h.x - q.x) + (h.y - q.y) * (h.y - q.y) > 0.5) continue;
        q.vivo = 0;
        if (h.pot < POT_MAX) { h.pot++; var piu = Math.round(h.vbase * 0.1); h.vmax += piu; h.vita += piu; }
        ev(st, 'cuboPreso', q.x, q.y, h.i, h.pot, 0, 0);
        break;
      }
    }
  }

  function danneggiaCassa(st, c, r, dmg, src) {
    if (tile(st, c, r) !== CASSA) return;
    var k = r * st.w + c;
    st.vc[k] -= dmg;
    ev(st, 'cassacolpo', c + 0.5, r + 0.5, src ? src.i : -1, dmg, 0, 0);
    if (st.vc[k] <= 0) { st.g[k] = 0; st.vc[k] = 0; st.cassaRotta++; ev(st, 'cassa', c + 0.5, r + 0.5, src ? src.i : -1, 0, 0, 0); if (st.modo === 'sopravvivenza') cubo(st, c + 0.5, r + 0.5, 0, 0); }
  }

  function danneggiaTorretta(st, src, tu, dmg) {
    if (tu.tipo === TU_MINA || tu.tipo === TU_FIORE) return;
    tu.vita -= dmg; tu.colT = st.t;
    ev(st, 'colpo', tu.x, tu.y, -2, Math.round(dmg), src ? src.i : -1, 0);
    if (tu.vita <= 0) fineTorretta(st, tu);
  }
  function fineTorretta(st, tu) {
    if (!tu.vivo) return;
    tu.vivo = 0;
    if (tu.tipo === TU_BARILE) {
      colpoArea(st, st.eroi[tu.ow], tu.sq, tu.x, tu.y, tu.area, tu.danno, F_ZONA, 1.5, 0, 0, 0);
      ev(st, 'esplo', tu.x, tu.y, tu.area, tu.ow, 3, 0);
    } else if (tu.tipo === TU_SIEPE) ev(st, 'siepeRotta', tu.x, tu.y, tu.ow, tu.vita <= 0 ? 0 : 1, tu.ang, 0);   // 22/11 Dama: si sbriciola (0) o appassisce (1)
    else ev(st, 'torrettaKo', tu.x, tu.y, tu.ow, 0, tu.tipo, 0);
  }
  // le entità che i colpi nemici possono colpire
  function bersaglioTu(tu) { return tu.tipo === TU_TORRETTA || tu.tipo === TU_SCAGNOZZO || tu.tipo === TU_ESCA || tu.tipo === TU_BARILE || tu.tipo === TU_CASSA || tu.tipo === TU_SIEPE; }
  // 22/11 Dama: distanza di un punto da un'entità (la siepe è un segmento lungo tu.area per parte, perpendicolare a tu.ang)
  function distTu(tu, x, y) {
    var dx = x - tu.x, dy = y - tu.y;
    if (tu.tipo !== TU_SIEPE) return Math.sqrt(dx * dx + dy * dy);
    var px = -Math.sin(tu.ang), py = Math.cos(tu.ang), l = Math.max(-tu.area, Math.min(tu.area, dx * px + dy * py)), ex = dx - px * l, ey = dy - py * l;
    return Math.sqrt(ex * ex + ey * ey);
  }

  function colpoArea(st, src, sq, x, y, rad, dmg, fl, spinta, stun, sl, slT) {
    var i, tot = 0;
    for (i = 0; i < st.eroi.length; i++) {
      var t = st.eroi[i];
      if (!t.vivo || t.sq === sq) continue;
      var dx = t.x - x, dy = t.y - y, d2 = dx * dx + dy * dy, rr = rad + R * 0.6;
      if (d2 > rr * rr) continue;
      tot += danneggia(st, src, t, dmg, fl, x, y);
      if (t.vivo && !intoccabile(t)) {
        var d = Math.sqrt(d2) || 1;
        if (spinta) spingi(t, dx / d, dy / d, spinta);
        if (stun && t.stun < stun) t.stun = stun;
        if (sl) { t.slowF = sl; t.slowT = slT || 1; }
      }
    }
    for (i = 0; i < MAXT; i++) {
      var tu = st.tu[i];
      if (!tu.vivo || tu.sq === sq || !bersaglioTu(tu)) continue;
      if (distTu(tu, x, y) <= rad + 0.4) danneggiaTorretta(st, src, tu, dmg);
    }
    var c0 = Math.floor(x - rad), c1 = Math.floor(x + rad), r0 = Math.floor(y - rad), r1 = Math.floor(y + rad);
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
      if (tile(st, c, r) !== CASSA) continue;
      var qx = c + 0.5 - x, qy = r + 0.5 - y;
      if (qx * qx + qy * qy <= (rad + 0.5) * (rad + 0.5)) danneggiaCassa(st, c, r, dmg, src);
    }
    return tot;
  }

  function spingi(t, nx, ny, spinta) {
    if (t.falT > 0 || t.fortT > 0 || t.cavT > 0) return;          // falange e fortezza: inamovibili
    var v = spinta * 5.4;
    t.kx = nx * v; t.ky = ny * v;
    if (t.stun < 0.25) t.stun = 0.25;
    t.dashD = 0; t.seqN = 0; t.prepT = 0;
  }

  // ---------------- proiettili ----------------
  function nuovoProiettile(st) {
    for (var n = 0; n < MAXP; n++) {
      var p = st.pr[(st.pcur + n) % MAXP];
      if (!p.vivo) { st.pcur = (st.pcur + n + 1) % MAXP; return p; }
    }
    return null;
  }

  // k: 0 colpo dritto, 1 lob ad arco, 3 rete
  function spara(st, h, ang, o, k, fl, dan, ab) {
    var p = nuovoProiettile(st);
    if (!p) return null;
    var c = Math.cos(ang), s = Math.sin(ang);
    p.vivo = 1; p.k = k; p.ab = ab || o.tipo; p.ow = p.ow0 = h.i; p.sq = h.sq; p.eroe = h.id;
    p.x = p.ox = h.x + c * 0.35; p.y = p.oy = h.y + s * 0.35;
    p.vx = c * (o.pv || 15); p.vy = s * (o.pv || 15); p.ang = ang;
    p.rest = o.gitt; p.r = o.rp || 0.16; p.dan = dan * h.k;
    p.pierce = 0; p.rimb = 0; p.mask = 0; p.slF = 0; p.slT = 0; p.stun = 0; p.spin = 0;
    p.fl = fl; p.sti = o.stile || ''; p.t = 0; p.z = 0; p.rompe = 0; p.fx = 0; p.area = 0; p.faccia = 0; p.num = 0; p.dist = 0; p.tu = -1; p.rifl = 0; p.passa = 0; p.oro = 0; p.a1 = 0; p.torna = 0;
    return p;
  }

  function lancia(st, h, tx, ty, o, T, fx, fl, dan) {
    var p = nuovoProiettile(st);
    if (!p) return null;
    tx = clampX(st, tx); ty = clampY(st, ty);
    p.vivo = 1; p.k = 1; p.ab = o.tipo; p.ow = p.ow0 = h.i; p.sq = h.sq; p.eroe = h.id;
    p.sx = p.x = p.ox = h.x; p.sy = p.y = p.oy = h.y; p.tx = tx; p.ty = ty;
    p.t = 0; p.T = T; p.z = 0; p.vx = (tx - h.x) / T; p.vy = (ty - h.y) / T;
    p.dan = (dan || 0) * h.k; p.area = o.area || 1; p.fx = fx; p.fl = fl; p.sti = o.stile || '';
    p.mask = 0; p.pierce = 0; p.rimb = 0; p.spin = 0; p.stun = 0; p.slF = 0; p.rest = 99; p.rompe = 0; p.faccia = 0; p.num = 0; p.dist = 0; p.tu = -1; p.rifl = 0; p.passa = 0; p.oro = 0; p.torna = 0;
    p.ang = Math.atan2(ty - h.y, tx - h.x);
    return p;
  }

  function aggiornaProiettili(st) {
    var i, j, n, k;
    for (i = 0; i < MAXP; i++) {
      var p = st.pr[i];
      if (!p.vivo) continue;
      p.ox = p.x; p.oy = p.y; p.t += DT;
      if (p.k === 1) {
        var f = p.t / p.T; if (f > 1) f = 1;
        p.x = p.sx + (p.tx - p.sx) * f; p.y = p.sy + (p.ty - p.sy) * f;
        p.z = 4 * f * (1 - f);
        if (p.t >= p.T) atterraLob(st, p);
        continue;
      }
      // palla rotolante: rallenta e si ferma
      if (p.ab === 'palla_rotolante') {
        p.vx *= 0.968; p.vy *= 0.968;
        if (p.vx * p.vx + p.vy * p.vy < 9) { p.vivo = 0; ev(st, 'svanito', p.x, p.y, p.ow, p.ang, p.k, 0); continue; }
      }
      if (p.torna === 2) { var tow = st.eroi[p.ow0 >= 0 ? p.ow0 : p.ow], tvv = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 12;   // 22/11 carte: boomerang che torna
        if (tow && tow.vivo) { var tdx = tow.x - p.x, tdy = tow.y - p.y, tdd = Math.sqrt(tdx * tdx + tdy * tdy) || 1; if (tdd < 0.55) { p.vivo = 0; ev(st, 'boomerangPreso', p.x, p.y, p.ow, p.ang, 0, 0); continue; } p.vx = tdx / tdd * tvv; p.vy = tdy / tdd * tvv; p.ang = Math.atan2(p.vy, p.vx); } }
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * DT;
      n = Math.ceil(sp / 0.22);
      var sx = p.vx * DT / n, sy = p.vy * DT / n, passo = sp / n;
      for (k = 0; k < n && p.vivo; k++) {
        var nx = p.x + sx, ny = p.y + sy, c = Math.floor(nx), r = Math.floor(ny);
        // [fable] passaggio in diagonale fra due caselle chiuse che si toccano per lo spigolo: vale come muro (prima il colpo ci passava)
        var pc0 = Math.floor(p.x), pr0 = Math.floor(p.y), bl = bloccaColpo(st, c, r) || (c !== pc0 && r !== pr0 && bloccaColpo(st, c, pr0) && bloccaColpo(st, pc0, r));
        if (bl && p.passa && c >= 0 && r >= 0 && c < st.w && r < st.h) { /* la freccia d'oro passa i muri */ }
        else if (bl && p.rimb > 0) {
          // rimbalzo sul muro (pistolero): si gira la componente che ha sbattuto
          if (tile(st, c, r) === CASSA) danneggiaCassa(st, c, r, p.dan * 0.5, st.eroi[p.ow]);
          var bx = bloccaColpo(st, c, Math.floor(p.y)), by = bloccaColpo(st, Math.floor(p.x), r);
          if (bx || !by) p.vx = -p.vx;
          if (by || !bx) p.vy = -p.vy;
          p.rimb--; p.num = 9; p.ang = Math.atan2(p.vy, p.vx); sx = p.vx * DT / n; sy = p.vy * DT / n;
          ev(st, 'rimbalzoColpo', p.x, p.y, p.ow, p.ang, 0, 0);
          continue;
        }
        else if (bl && p.torna === 2) { p.x = nx; p.y = ny; continue; }   // 22/11 carte: al ritorno il boomerang passa sopra i muri
        else if (bl) {
          var t0 = tile(st, c, r);
          if (t0 === CASSA) danneggiaCassa(st, c, r, p.rompe ? p.dan * 3 : p.dan, st.eroi[p.ow]);
          if (p.rompe && t0 === CASSA && tile(st, c, r) !== CASSA) { p.x = nx; p.y = ny; continue; }   // [fable] solo la cassa appena sfondata: i muri fermano
          if (p.torna === 1) { giraBoomerang(st, p); ev(st, 'muro', p.x, p.y, p.ow, p.ang + Math.PI, p.k, 0); break; }   // 22/11 carte: sbatte e torna
          p.vivo = 0;
          ev(st, 'muro', p.x, p.y, p.ow, p.ang, p.k, 0);
          break;
        }
        p.x = nx; p.y = ny; p.rest -= passo; p.dist += passo;
        for (j = 0; j < st.eroi.length; j++) {
          var t = st.eroi[j];
          if (p.ab === 'cuore_viandante' && t.vivo && t.sq === p.sq && t.i !== (p.ow0 >= 0 ? p.ow0 : p.ow) && !(p.mask & (1 << j))) { var cdx = t.x - p.x, cdy = t.y - p.y, crr = R + p.r; if (cdx * cdx + cdy * cdy <= crr * crr) { p.mask |= 1 << j; curaCuore(st, p, t); } continue; }
          if (!t.vivo || t.sq === p.sq || (p.mask & (1 << j)) || intoccabile(t) || (t.salT > 0 && t.z > 0.6)) continue;
          var dx = t.x - p.x, dy = t.y - p.y, rr = R + p.r;
          if (dx * dx + dy * dy > rr * rr) continue;
          // parata del samurai: il colpo torna indietro e diventa suo
          if (t.parT > 0) { rifletti(st, p, t); break; }
          // manata del buttafuori: la mano aperta ferma i colpi che arrivano da davanti
          if (t.altT > 0 && !PESANTI[p.ab] && p.vx * Math.cos(t.aim) + p.vy * Math.sin(t.aim) < 0) { p.vivo = 0; ev(st, 'manoFerma', p.x, p.y, t.i, p.ang, 0, 0); break; }
          // carica dell'oplita: lo scudo ferma i colpi che arrivano da davanti
          if (t.oplT > 0 && p.vx * t.dvx + p.vy * t.dvy < 0) { p.vivo = 0; ev(st, 'parato', p.x, p.y, t.i, p.ang, 0, 0); break; }
          // 22/11 muro di scudo (Agamennone): para TUTTO quello che arriva dal davanti dello scudo, pesanti compresi
          if (t.muroT > 0 && davantiScudo(t, p.ox, p.oy, p.x, p.y)) { p.vivo = 0; ev(st, 'parato', p.x, p.y, t.i, p.ang, 1, 0); break; }
          colpisciConProiettile(st, p, t, j);
          if (!p.vivo) break;
        }
        if (!p.vivo) break;
        for (j = 0; j < MAXT; j++) {
          var tu = st.tu[j];
          if (!tu.vivo || tu.sq === p.sq || !bersaglioTu(tu)) continue;
          if (distTu(tu, p.x, p.y) > 0.42 + p.r) continue;
          danneggiaTorretta(st, st.eroi[p.ow], tu, p.dan); p.num = p.num || 1;
          if (!p.pierce) { p.vivo = 0; break; }
        }
        if (p.vivo && p.rest <= 0 && p.torna === 1) { giraBoomerang(st, p); break; }
        if (p.vivo && p.rest <= 0) { p.vivo = 0; ev(st, 'svanito', p.x, p.y, p.ow, p.ang, p.k, 0); }
      }
      // lancia di Agamennone: dove si ferma si pianta (si riprende passandoci sopra, o torna da sola)
      if (!p.vivo && p.ab === 'lancia_scagliata' && !p.rifl) piantaLancia(st, p);
      // carta del croupier finita a vuoto: brucia una carta della mano
      if (!p.vivo && p.ab === 'carta_servita' && !p.num && !p.faccia && !p.rifl) {
        var cr = st.eroi[p.ow];
        if (cr.mano > 0) { cr.mano--; ev(st, 'mano', cr.x, cr.y, cr.i, cr.mano, -1, 0); }
      }
    }
  }

  // raggio del cecchino: istantaneo, lunghissimo, sottile; si ferma sul primo muro o sul primo nemico
  function raggioCecchino(st, h) {
    var a = h.d.att, c = Math.cos(h.cecA), s = Math.sin(h.cecA), L, colpito = null, i;
    guarda(h, h.cecA); h.tAtt = st.t;
    for (L = 0.4; L <= a.gitt; L += 0.12) {
      var x = h.x + c * L, y = h.y + s * L;
      if (bloccaColpo(st, Math.floor(x), Math.floor(y))) { danneggiaCassa(st, Math.floor(x), Math.floor(y), a.danno * h.k, h); break; }
      for (i = 0; i < st.eroi.length && !colpito; i++) { var t = st.eroi[i]; if (t.vivo && t.sq !== h.sq && !intoccabile(t) && !(t.salT > 0 && t.z > 0.6) && (t.x - x) * (t.x - x) + (t.y - y) * (t.y - y) < (R + a.largo) * (R + a.largo)) colpito = t; }
      if (colpito) break;
      var tuc = null; for (i = 0; i < MAXT; i++) { var tu = st.tu[i]; if (tu.vivo && tu.sq !== h.sq && bersaglioTu(tu) && distTu(tu, x, y) < 0.55) { tuc = tu; break; } }
      if (tuc) { danneggiaTorretta(st, h, tuc, a.danno * h.k); break; }
    }
    if (L > a.gitt) L = a.gitt;
    ev(st, 'raggioCristallo', h.x, h.y, h.i, h.cecA, L, colpito ? 1 : 0);
    if (colpito) danneggia(st, h, colpito, a.danno * h.k, 0, colpito.x, colpito.y);
  }
  // pizze che girano attorno al pizzaiolo: distruggono i proiettili nemici che toccano e colpiscono chi è vicino
  function pizzeAttorno(st, h) {
    var o = h.d.gad, i, j;
    h.orbT -= DT; h.orbC -= DT;
    for (j = 0; j < 3; j++) {
      var a = st.t * DT * o.giri + j * 2.094, px = h.x + Math.cos(a) * o.raggio, py = h.y + Math.sin(a) * o.raggio;
      for (i = 0; i < MAXP; i++) { var p = st.pr[i]; if (p.vivo && p.k === 0 && p.sq !== h.sq && (p.x - px) * (p.x - px) + (p.y - py) * (p.y - py) < 0.2) { p.vivo = 0; ev(st, 'pizzaPara', p.x, p.y, h.i, p.ang, 0, 0); } }
    }
    if (h.orbC <= 0) {
      h.orbC = 0.35;
      for (i = 0; i < st.eroi.length; i++) {
        var t = st.eroi[i];
        if (!t.vivo || t.sq === h.sq) continue;
        var dx = t.x - h.x, dy = t.y - h.y, d = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(d - o.raggio) < 0.55 + R * 0.5) danneggia(st, h, t, o.danno * h.k, F_ZONA, t.x, t.y);
      }
    }
  }

  function piantaLancia(st, p) {
    if (p.dist < 1.2) return;   // tirata a bruciapelo: niente lancia da riprendere (sennò contro chi gli sta addosso è una raffica)
    var h = st.eroi[p.ow], tu = nuovaTorretta(st); if (!tu) return;
    var q = liberaVicina(st, clampX(st, p.x - p.vx * DT * 0.5), clampY(st, p.y - p.vy * DT * 0.5), st._tmp);
    tu.tipo = TU_LANCIA; tu.x = q.x; tu.y = q.y; tu.sq = h.sq; tu.ow = h.i; tu.vita = tu.vmax = 1; tu.dur = tu.durMax = h.d.att.resta; tu.ang = p.ang; tu.eroe = h.id; tu.arm = 0.8;   // si riprende solo dopo un attimo: niente raffica a bruciapelo
    ev(st, 'lanciaPiantata', tu.x, tu.y, h.i, p.ang, 0, 0);
  }

  function rifletti(st, p, t) {
    // 22/11 (proprietario): il colpo parato TORNA INDIETRO verso chi l'ha tirato, con la stessa velocità
    var chi = st.eroi[p.ow], v = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1, ra = Math.atan2(-p.vy, -p.vx);
    if (chi && chi.vivo) ra = Math.atan2(chi.y - p.y, chi.x - p.x);
    p.vx = Math.cos(ra) * v; p.vy = Math.sin(ra) * v; p.ang = ra; p.ow = t.i; p.sq = t.sq; p.mask = 0; p.rifl = 1;
    p.rest = Math.max(p.rest, 5); p.fl &= ~F_SUP; p.dan *= 0.8;   // fa un po' meno male dell'originale
    ev(st, 'riflesso', p.x, p.y, t.i, p.ang, 0, 0);
  }

  function colpisciConProiettile(st, p, t, j) {
    var src = st.eroi[p.ow];
    p.mask |= (1 << j);
    var dan = p.dan, orig = st.eroi[p.ow0 >= 0 ? p.ow0 : p.ow] || src;   // [fable] chi ha tirato: i numeri dell'abilita' sono i suoi anche se il samurai l'ha rimandata
    if (p.ab === 'freccia_lunga') dan *= orig.d.att.vicino + (1 - orig.d.att.vicino) * Math.min(1, p.dist / (orig.d.att.gitt * 0.8));   // freccia tesa: piu' vola, piu' fa male
    if (p.ab === 'colpo_rimbalzo' && p.num === 9) dan *= 1.2;                                 // dopo il rimbalzo un filo piu' forte
    var fatto = danneggia(st, src, t, dan, p.fl, p.x, p.y);
    if (p.ab === 'taglia' && t.vivo) { t.taglT = orig.d.gad.dur; t.tagliaDa = src.i; t.rivT = Math.max(t.rivT, orig.d.gad.dur); ev(st, 'ricercato', t.x, t.y, t.i, src.i, 0, 0); }
    if (p.ab === 'asso_manica' && fatto && t.vivo && !p.rifl && src.d.sup.tipo === 'asso_manica') { src.mancaT = src.d.sup.marca; src.mancaB = t.i; src.sup = 1; src.supPronta = true; t.marcaT = src.d.sup.marca; t.marcaDa = src.i; ev(st, 'marcato', t.x, t.y, t.i, src.i, src.d.sup.marca, 0); }   // 22/11 Asso: marcato, la super si ripreme
    if (p.ab === 'carta_servita' && fatto && !p.rifl) { if (!p.faccia && !p.num && src.mano < src.d.att.mano) { src.mano++; ev(st, 'mano', src.x, src.y, src.i, src.mano, 1, 0); } p.num = 1; }
    if (t.vivo && fatto) {
      var v = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1, ux = p.vx / v, uy = p.vy / v;
      // spintarella: ogni colpo a segno sposta un filo chi lo prende (niente stordimento), si sente il colpo
      if (t.falT <= 0 && t.fortT <= 0) { var sk = Math.min(1.2, p.dan / 900) * (p.oro ? 1.8 : 1); /* proporzionale al colpo: i ventagli di gettoni non tengono a distanza */ t.kx += ux * sk; t.ky += uy * sk; }
      switch (p.ab) {
        case 'tridente':
          // tira a sé il primo colpito (solo il primo)
          if (!p.a1) { p.a1 = 1; var dd = Math.sqrt((src.x - t.x) * (src.x - t.x) + (src.y - t.y) * (src.y - t.y)) || 1, tira = Math.min(1.4, dd - 1);
            if (tira > 0.2) { t.tirT = 0.22; t.tirX = t.x + (src.x - t.x) / dd * tira; t.tirY = t.y + (src.y - t.y) / dd * tira; ev(st, 'aggancio', t.x, t.y, t.i, src.i, 0, 0); } }
          break;
        case 'shuriken_ombra':
          // il ninja ricompare dietro il bersaglio
          if (src.vivo && src.immT <= 0) {
            var q = liberaVicina(st, t.x + ux * 0.95, t.y + uy * 0.95, st._tmp);
            ev(st, 'ombra', src.x, src.y, src.i, q.x, q.y, 0);
            src.x = src.ox = q.x; src.y = src.oy = q.y; src.aim = Math.atan2(-uy, -ux); src.fac = -ux >= 0 ? 1 : -1;
            src.dashD = 0; risolvi(st, src); src.ox = src.x; src.oy = src.y;
          }
          break;
        case 'palla_rotolante': spingi(t, ux, uy, 1.2); break;
        case 'freccia_oro': spingi(t, ux, uy, 0.9); break;
        case 'pizza_gigante': spingi(t, ux, uy, 0.8); break;
        case 'tarocco':
          if (src.vivo && t.falT <= 0 && t.fortT <= 0) {
            var sx2 = src.x, sy2 = src.y;
            ev(st, 'scambio', src.x, src.y, src.i, t.i, t.x, t.y);
            src.x = src.ox = t.x; src.y = src.oy = t.y; t.x = t.ox = sx2; t.y = t.oy = sy2; t.dashD = 0; t.seqN = 0; t.prepT = 0;
            risolvi(st, src); risolvi(st, t);
          }
          break;
        case 'tamburo': if (p.spin) spingi(t, ux, uy, p.spin); break;
        case 'rete':
          if (t.radiceT < 1) t.radiceT = 1; t.slowF = 0.6; t.slowT = 2.5;
          ev(st, 'rete', t.x, t.y, t.i, 0, 0, 0);
          break;
      }
    }
    if (!p.pierce) p.vivo = 0;
  }

  function atterraLob(st, p) {
    p.vivo = 0;
    var src = st.eroi[p.ow], z, tu, q;
    switch (p.fx) {
      case 0: // esplosione semplice (bordata)
        colpoArea(st, src, p.sq, p.tx, p.ty, p.area, p.dan, p.fl, 0, 0, 0, 0);
        ev(st, 'esplo', p.tx, p.ty, p.area, p.ow, (p.fl & F_SUP) ? 1 : 0, 0);
        break;
      case 1: // dado: la faccia decide
        var fc = p.faccia, dmg = p.dan * [0, 0.55, 0.78, 1, 1, 1.55, 1.1][fc];
        colpoArea(st, src, p.sq, p.tx, p.ty, p.area, dmg, 0, fc === 4 ? 1.5 : 0, 0, fc === 3 ? 0.45 : 0, 1.6);
        ev(st, 'dado', p.tx, p.ty, p.area, p.ow, fc, 0);
        if (fc === 6) { z = nuovaZona(st); if (z) { z.tipo = Z_SCOPPIO; z.ab = 'dado6'; z.x = p.tx; z.y = p.ty; z.r = p.area; z.t = 0; z.T = 0.35; z.val = p.dan * 0.6; z.sq = p.sq; z.ow = p.ow; z.eroe = src.id; } }
        break;
      case 2: // zona maledetta
        var o = src.d.sup; z = nuovaZona(st);
        if (!z) return;
        z.tipo = Z_MALE; z.ab = o.tipo; z.x = p.tx; z.y = p.ty; z.r = o.area; z.t = 0; z.T = o.dur; z.val = o.dps * src.k; z.sq = p.sq; z.ow = p.ow; z.sl = o.sl || 0; z.eroe = src.id;
        ev(st, 'zona', p.tx, p.ty, z.r, p.ow, z.tipo, 0);
        break;
      case 6: { // seme di rovo (Dama): scoppio + cespuglio di rovi che punge e rallenta
        var ro = src.d.att.rovo || { dur: 2.5, dps: 300, sl: 0.3 };
        var verde = tile(st, Math.floor(p.tx), Math.floor(p.ty)) === CESP ? 1 : 0;   // passiva POLLICE VERDE: in un cespuglio della mappa i rovi durano il doppio
        colpoArea(st, src, p.sq, p.tx, p.ty, p.area, p.dan, 0, 0, 0, 0, 0);
        ev(st, 'rovoScoppia', p.tx, p.ty, p.area, p.ow, verde, 0);
        z = nuovaZona(st); if (!z) break;
        z.tipo = Z_MALE; z.ab = 'rovo'; z.x = p.tx; z.y = p.ty; z.r = p.area; z.t = 0; z.T = ro.dur * (verde ? 2 : 1); z.val = ro.dps * src.k; z.sq = p.sq; z.ow = p.ow; z.sl = ro.sl; z.eroe = src.id; z.sp = verde;
        break;
      }
      case 7: { // GIARDINO TRAPPOLA (super della Dama): runa verde e 6 fiori-trappola nell'area
        var gs = src.d.sup, nf = gs.n || 6, a0 = rnd(st) * 6.2832, fi, q7;
        for (fi = 0; fi < MAXT; fi++) { var vf = st.tu[fi]; if (vf.vivo && vf.ow === p.ow && vf.tipo === TU_FIORE) { vf.vivo = 0; ev(st, 'torrettaKo', vf.x, vf.y, vf.ow, 0, vf.tipo, 0); } }   // un giardino alla volta
        ev(st, 'giardino', p.tx, p.ty, gs.raggio, p.ow, nf, 0);
        for (fi = 0; fi < nf; fi++) {
          // uno al centro, gli altri a corona (a 0,6 del raggio, un filo mossi): coprono l'area senza ammucchiarsi
          var fr = fi === 0 ? 0 : gs.raggio * (0.52 + 0.16 * rnd(st)), fa = a0 + fi * 6.2832 / (nf - 1) + (rnd(st) - 0.5) * 0.4;
          q7 = liberaVicina(st, clampX(st, p.tx + Math.cos(fa) * fr), clampY(st, p.ty + Math.sin(fa) * fr), st._tmp);
          tu = nuovaTorretta(st); if (!tu) break;
          tu.tipo = TU_FIORE; tu.x = q7.x; tu.y = q7.y; tu.sq = p.sq; tu.ow = p.ow; tu.vita = tu.vmax = 1; tu.dur = tu.durMax = gs.dur; tu.arm = gs.arma;
          tu.danno = gs.danno * src.k; tu.area = gs.scatta; tu.ang = fa; tu.eroe = src.id; tu.lato = fi;
        }
        break;
      }
      case 3: // pila di fiches: crolla poco dopo
        z = nuovaZona(st);
        if (!z) return;
        z.tipo = Z_SCOPPIO; z.ab = 'pila_crollo'; z.x = p.tx; z.y = p.ty; z.r = p.area; z.t = 0; z.T = src.d.att.ritardo; z.val = p.dan; z.sq = p.sq; z.ow = p.ow; z.eroe = src.id;
        ev(st, 'pilaPosata', p.tx, p.ty, p.area, p.ow, 0, 0);
        break;
      case 5: { // pizza: primo colpo all'atterraggio, secondo mentre gira
        var pa = src.d.att;
        colpoArea(st, src, p.sq, p.tx, p.ty, p.area, p.dan * pa.tick, 0, 0.25, 0, pa.sl, pa.slT);
        ev(st, 'pizzaAtterra', p.tx, p.ty, p.area, p.ow, 0, 0);
        z = nuovaZona(st); if (!z) return;
        z.tipo = Z_SCOPPIO; z.ab = 'pizza2'; z.x = p.tx; z.y = p.ty; z.r = p.area; z.t = 0; z.T = pa.giro; z.val = p.dan * pa.tick; z.sq = p.sq; z.ow = p.ow; z.eroe = src.id;
        break;
      }
      case 4: // barile
        tu = nuovaTorretta(st);
        if (!tu) return;
        q = liberaVicina(st, p.tx, p.ty, st._tmp);
        var g = src.d.gad;
        tu.tipo = TU_BARILE; tu.x = q.x; tu.y = q.y; tu.sq = p.sq; tu.ow = p.ow; tu.vita = tu.vmax = 1; tu.dur = tu.durMax = g.dur;
        tu.danno = g.danno * src.k; tu.area = g.area; tu.eroe = src.id;
        ev(st, 'barile', tu.x, tu.y, p.ow, 0, 0, 0);
        break;
    }
  }

  function nuovaZona(st) { for (var i = 0; i < MAXZ; i++) if (!st.zo[i].vivo) { st.zo[i].vivo = 1; st.zo[i].sl = 0; st.zo[i].sp = 0; return st.zo[i]; } return null; }
  function nuovaTorretta(st) { for (var i = 0; i < MAXT; i++) if (!st.tu[i].vivo) { st.tu[i].vivo = 1; st.tu[i].colT = -99; st.tu[i].arm = 0; st.tu[i].lato = 0; return st.tu[i]; } return null; }

  // ---------------- mira ----------------
  // (ax,ay) lungo 0..1 = frazione della gittata; quasi zero = dove guardi, a 3/4
  function bersaglio(h, ax, ay, gitt, out) {
    var l = Math.sqrt(ax * ax + ay * ay), a;
    out.l = l;
    if (l < 0.05) { a = h.aim; l = 0.75; } else a = Math.atan2(ay, ax);
    if (l > 1) l = 1;
    out.a = a; out.d = l * gitt;
    out.x = h.x + Math.cos(a) * out.d; out.y = h.y + Math.sin(a) * out.d;
    return out;
  }
  function guarda(h, ang) { h.aim = ang; if (Math.cos(ang) !== 0) h.fac = Math.cos(ang) >= 0 ? 1 : -1; }

  // ---------------- ATTACCHI (uno per eroe, tutti diversi) ----------------
  function attacca(st, h, ax, ay) {
    var a = h.d.att, i;
    var b = bersaglio(h, ax, ay, a.gitt, st._b), ang = b.a;
    var fodero = Math.min(1, (st.t - h.tAtt) * DT / (a.carT || 1));   // samurai: quanto è rimasta la spada nel fodero
    h.aggF = h.nasc && h.d.agguato ? h.d.agguato : 1;
    if (h.aggF > 1) ev(st, 'agguato', h.x, h.y, h.i, 0, 0, 0);
    guarda(h, ang); h.ammo -= 1; h.cd = a.cd; h.combo = (h.tAtt && (st.t - h.tAtt) * DT < 2.0) ? ((h.combo | 0) + 1) % 3 : 0; h.tAtt = st.t;   /* 21/11 notte: combo di 3 colpi (0,1,2) per le animazioni alternate; si azzera dopo 1,2 s */ h.riv = 0.9; h.regT = 0; h.prot = 0;
    if (h.invT > 0) h.invT = 0;
    ev(st, 'sparo', h.x, h.y, h.i, ang, 0, 0);
    switch (a.tipo) {
      case 'slot': {
        // tre rulli: 0 ciliegia, 1 campana, 2 BAR, 3 sette
        var s0, s1, s2;
        if (h.trucN > 0) { s0 = s1 = s2 = 3; h.trucN--; }
        else { s0 = rullo(st); s1 = rullo(st); s2 = rullo(st); }
        ev(st, 'slot', h.x, h.y, h.i, s0 + s1 * 4 + s2 * 16, ang, 0);
        if (FILA3) {   // 21/11 notte (proprietario): 3 gettoni in fila, uno per rullo; ?bot=ventaglio = come prima
          h.seqN = 3; h.seqT = 0; h.seqA = ang; h.seqI = 0; h.seqS = [s0, s1, s2];
          h.seqK = s0 === 3 && s1 === 3 && s2 === 3 ? 3 : s0 === s1 && s1 === s2 ? 2 : (s0 === s1 || s1 === s2 || s0 === s2) ? 1 : 0;
        } else if (s0 === 3 && s1 === 3 && s2 === 3) {
          var jp = spara(st, h, ang, a, 0, 0, a.danno * 3.5, 'slot'); if (jp) { jp.pierce = 1; jp.r = 0.32; jp.num = 7; }
        } else if (s0 === s1 && s1 === s2) ventaglio(st, h, ang, a, 5, 32, a.danno * 0.82, s0);
        else if (s0 === s1 || s1 === s2 || s0 === s2) ventaglio(st, h, ang, a, 3, 16, a.danno * 0.95, s1);
        else ventaglio(st, h, ang, a, 2, 6, a.danno * 1.05, s0);
        break;
      }
      case 'tamburo':
        h.seqN = a.n; h.seqT = 0; h.seqA = ang; h.seqI = 0;
        break;
      case 'affondo': {
        // un passo avanti e infilza in linea
        var c = Math.cos(ang), s = Math.sin(ang);
        h.x += c * 0.5; h.y += s * 0.5; risolvi(st, h);
        linea(st, h, ang, a.gitt, a.largo, a.danno * h.k, 0, 0.4);
        ev(st, 'affondoLancia', h.x, h.y, h.i, ang, a.gitt, 0);
        break;
      }
      case 'tridente': {
        var p = spara(st, h, ang, a, 0, 0, a.danno); if (p) { p.pierce = 1; p.a1 = 0; }
        break;
      }
      case 'azzannata':
        // balzo corto: il morso parte alla fine dello scatto
        h.dashD = a.lunge; h.dvx = Math.cos(ang) * 11; h.dvy = Math.sin(ang) * 11; h.dmask = 0; h.dashTipo = 'azzannata';
        break;
      case 'doppio_artiglio':
        // 22/11: combo del Lupo = una zampata per pressione (destra, sinistra), il 3° colpo è la doppia zampata dall'alto
        if ((h.combo | 0) < 2) mischia(st, h, ang, a.gitt, a.ango, a.danno * 1.7 * h.k, 0, h.combo === 1 ? 'artiglio2' : 'artiglio1');
        else { mischia(st, h, ang, a.gitt, a.ango, a.danno * 1.1 * h.k, 0, 'artiglio1'); h.seqN = 1; h.seqT = 0.2; h.seqA = ang; h.seqI = 0; }
        break;
      case 'shuriken_ombra':
        spara(st, h, ang, a, 0, 0, a.danno);
        break;
      case 'stoccata':   // 22/11 Asso: affondo di stocco con un passo avanti; in fondo alla lama e' un ASSO (colpo di punta)
        h.x += Math.cos(ang) * a.passo; h.y += Math.sin(ang) * a.passo; risolvi(st, h);
        stoccata(st, h, ang, a);
        break;
      case 'cuore_viandante': {   // 22/11 Regina: cuore lento che attraversa tutti (male ai nemici, cura agli alleati)
        var cv = spara(st, h, ang, a, 0, 0, a.danno); if (cv) { cv.pierce = 1; cv.r = a.rp; if (h.graziaN > 0) { h.graziaN = 0; cv.torna = 1; } }
        ev(st, 'cuoreVia', h.x, h.y, h.i, ang, cv && cv.torna ? 1 : 0, 0);
        break;
      }
      case 'doppio_rombo':   // 22/11 Fante: due affondi rapidi; da Cavaliere la Mazzata
        if (h.cavT > 0) { var mz = h.d.corazza.mazzata; h.cd = 0.4; mischia(st, h, ang, mz.gitt, mz.ango, mz.danno * h.k, 0, 'mazzata'); break; }
        h.seqI = 0; st._cm = []; mischia(st, h, ang, a.gitt, a.ango, a.danno * h.k, 0, 'rombo'); h.rombo1 = 0; for (i = 0; i < st._cm.length; i++) h.rombo1 |= 1 << st._cm[i]; st._cm = null;
        h.seqN = 1; h.seqT = a.secondo; h.seqA = ang; h.seqI = 1;
        break;
      case 'seme_rovo':   // 22/11 Dama: seme ad arco che fa nascere un cespuglio di rovi
        lancia(st, h, b.x, b.y, a, a.T, 6, 0, a.danno);
        break;
      case 'dado': {
        var lb = lancia(st, h, b.x, b.y, a, a.T, 1, 0, a.danno);
        if (lb) lb.faccia = 1 + Math.floor(rnd(st) * 6);
        break;
      }
      case 'palla_rotolante': {
        var pr = spara(st, h, ang, a, 0, 0, a.danno); if (pr) { pr.pierce = 1; pr.rompe = 1; }
        break;
      }
      case 'pila_crollo':
        lancia(st, h, b.x, b.y, a, a.T, 3, 0, a.danno);
        break;
      case 'taglio_lampo':
        // Iaido: attraversa in un lampo; il danno cresce col tempo passato nel fodero (fino a +50%)
        h.lampoF = 1 + a.fodero * fodero;
        h.dashD = a.gitt; h.dvx = Math.cos(ang) * a.vdash; h.dvy = Math.sin(ang) * a.vdash; h.dmask = 0; h.dashTipo = 'lampo';
        ev(st, 'lampoVia', h.x, h.y, h.i, ang, a.gitt, fodero >= 1 ? 1 : 0);
        break;
      case 'carta_servita':
        if (h.mano >= a.mano) {
          // SCALA: tre carte a ventaglio che perforano; la mano si svuota
          h.mano = 0;
          for (i = -1; i <= 1; i++) { var sc = spara(st, h, ang + i * a.ventaglio * Math.PI / 360, a, 0, 0, a.danno * a.scala); if (sc) { sc.pierce = 1; sc.faccia = 1; sc.r = 0.22; } }
          ev(st, 'scala', h.x, h.y, h.i, ang, 0, 0);
        } else spara(st, h, ang, a, 0, 0, a.danno);
        break;
      case 'colpo_rimbalzo': {
        // sei colpi nel tamburo: il sesto e' la pallottola d'oro (perfora); tutti rimbalzano una volta sui muri
        h.colpi = (h.colpi % 6) + 1;
        var oro = h.colpi === 6, pb = spara(st, h, ang, a, 0, 0, a.danno * (oro ? a.oro : 1));
        if (pb) { pb.rimb = 1; if (oro) { pb.pierce = 1; pb.oro = 1; pb.r = 0.2; } }
        ev(st, 'tamburoColpo', h.x, h.y, h.i, ang, h.colpi, oro ? 1 : 0);
        break;
      }
      case 'freccia_lunga': spara(st, h, ang, a, 0, 0, a.danno); break;
      case 'pizza_rotante':
        // pizza lanciata a parabola: scavalca i muri, atterra e gira sul posto colpendo due volte
        // nemico addosso davanti a lui: invece della pizza, colpo di PALA che lo ribalta indietro
        var vicinoP = false;
        for (i = 0; i < st.eroi.length; i++) { var pe2 = st.eroi[i]; if (!pe2.vivo || pe2.sq === h.sq) continue; var px3 = pe2.x - h.x, py3 = pe2.y - h.y, pd3 = Math.sqrt(px3 * px3 + py3 * py3), pa3 = Math.atan2(py3, px3) - ang; while (pa3 > Math.PI) pa3 -= 2 * Math.PI; while (pa3 < -Math.PI) pa3 += 2 * Math.PI; if (pd3 < a.pala.gitt + R && Math.abs(pa3) < a.pala.ango * Math.PI / 360 + 0.3) vicinoP = true; }
        if (vicinoP) {
          ev(st, 'pala', h.x, h.y, h.i, ang, a.pala.gitt, 0); mischia(st, h, ang, a.pala.gitt, a.pala.ango, a.pala.danno * h.k, 0, 'pala');
          // poi un saltello all'indietro sulla pala (si ferma prima di un muro): la sua via di fuga contro chi gli sta addosso
          var bk2 = ang + Math.PI, hx2 = h.x, hy2 = h.y;
          for (var cl2 = 0.3; cl2 <= a.pala.salto; cl2 += 0.2) { var tx4 = h.x + Math.cos(bk2) * cl2, ty4 = h.y + Math.sin(bk2) * cl2; if (bloccaPasso(st, Math.floor(tx4), Math.floor(ty4))) break; hx2 = tx4; hy2 = ty4; }
          h.salT = h.salTT = a.pala.T; h.salSx = h.x; h.salSy = h.y; h.salTx = hx2; h.salTy = hy2; h.salTipo = 'saltoPala';
          ev(st, 'saltoPala', h.x, h.y, h.i, hx2, hy2, 0);
          break;
        }
        // da vicino la pizza arriva prima (il tempo di volo cresce con la distanza)
        lancia(st, h, b.x, b.y, a, b.d < a.vicinoT ? a.Tmin : a.Tmin + (a.T - a.Tmin) * Math.min(1, (b.d - a.vicinoT) / (a.gitt - a.vicinoT)), 5, 0, a.danno);
        break;
      case 'onda_bassi': {
        // onda dei bassi a cono: prende tutti quelli nel ventaglio, più forte da vicino; A TEMPO (sul battito) più forte e più larga
        var batt = st.t % a.battito, aTempo = batt <= 3 || batt >= a.battito - 3;
        var go = a.gitt * (aTempo ? 1.12 : 1), so = (a.ango * (aTempo ? 1.2 : 1)) * Math.PI / 360;
        ev(st, 'ondaBassi', h.x, h.y, h.i, ang, go, aTempo ? 1 : 0);
        for (i = 0; i < st.eroi.length; i++) {
          var oe = st.eroi[i];
          if (!oe.vivo || oe.sq === h.sq || intoccabile(oe)) continue;
          var ox = oe.x - h.x, oy = oe.y - h.y, od = Math.sqrt(ox * ox + oy * oy);
          if (od > go + R) continue;
          var oa = Math.atan2(oy, ox) - ang; while (oa > Math.PI) oa -= 2 * Math.PI; while (oa < -Math.PI) oa += 2 * Math.PI;
          if (Math.abs(oa) > so + Math.atan2(R, Math.max(od, 0.3)) || !lineaLibera(st, h.x, h.y, oe.x, oe.y)) continue;
          var of = od < a.pieno_entro ? 1 : 1 - (1 - a.lontano) * Math.min(1, (od - a.pieno_entro) / (go - a.pieno_entro));
          if (danneggia(st, h, oe, a.danno * h.k * of * (aTempo ? a.tempo : a.fuori), 0, oe.x, oe.y) && oe.vivo && oe.falT <= 0 && oe.fortT <= 0) { oe.kx += ox / (od || 1) * 0.8; oe.ky += oy / (od || 1) * 0.8; }
        }
        for (i = 0; i < MAXT; i++) { var ot = st.tu[i]; if (!ot.vivo || ot.sq === h.sq || !bersaglioTu(ot)) continue; var tx3 = ot.x - h.x, ty3 = ot.y - h.y; if (tx3 * tx3 + ty3 * ty3 < go * go) danneggiaTorretta(st, h, ot, a.danno * h.k * 0.7); }
        break;
      }
      case 'raggio_cristallo':
        // cecchino: un attimo di mira (si vede la linea) e poi il raggio lunghissimo, che si ferma sul PRIMO che trova
        h.cecT = a.carica; h.cecA = ang;
        ev(st, 'cecchinoMira', h.x, h.y, h.i, ang, a.gitt, a.carica);
        break;
      case 'lancia_scagliata': { var lz = spara(st, h, ang, a, 0, 0, a.danno); ev(st, 'lanciaVia', h.x, h.y, h.i, ang, 0, 0); break; }
      case 'manata': {
        // mano gigante: spegne i proiettili davanti e resta alzata un attimo
        var semi = a.ango * Math.PI / 360, n = 0;
        for (i = 0; i < MAXP; i++) {
          var q = st.pr[i];
          if (!q.vivo || q.k !== 0 || q.sq === h.sq || PESANTI[q.ab]) continue;
          var qx = q.x - h.x, qy = q.y - h.y, qd = Math.sqrt(qx * qx + qy * qy), qa = Math.atan2(qy, qx) - ang;
          while (qa > Math.PI) qa -= 2 * Math.PI; while (qa < -Math.PI) qa += 2 * Math.PI;
          if (qd < 1.0 && Math.abs(qa) < semi + 0.2) { q.vivo = 0; n++; ev(st, 'manoFerma', q.x, q.y, h.i, q.ang, 0, 0); }
        }
        h.altT = a.alt;
        ev(st, 'manata', h.x, h.y, h.i, ang, a.gitt, n);
        mischia(st, h, ang, a.gitt, a.ango, a.danno * h.k, 0, 'manata');
        break;
      }
    }
  }
  function rullo(st) { var x = rnd(st); return x < 0.34 ? 0 : x < 0.63 ? 1 : x < 0.87 ? 2 : 3; }
  function ventaglio(st, h, ang, a, n, gradi, dan, simbolo) {
    for (var i = 0; i < n; i++) {
      var off = n > 1 ? (i / (n - 1) - 0.5) * gradi * Math.PI / 180 : 0;
      var p = spara(st, h, ang + off, a, 0, 0, dan, 'slot'); if (p) p.num = simbolo;
    }
  }

  // colpo in linea retta istantaneo (lancia)
  function linea(st, h, ang, len, largo, dmg, fl, spinta) {
    var c = Math.cos(ang), s = Math.sin(ang), L = 0, i;
    for (L = 0.3; L < len; L += 0.15) {
      var tx = Math.floor(h.x + c * L), ty = Math.floor(h.y + s * L);
      if (bloccaColpo(st, tx, ty)) { danneggiaCassa(st, tx, ty, dmg, h); break; }
    }
    if (L > len) L = len;
    for (i = 0; i < st.eroi.length; i++) {
      var t = st.eroi[i];
      if (!t.vivo || t.sq === h.sq) continue;
      var dx = t.x - h.x, dy = t.y - h.y, pr = dx * c + dy * s;
      if (pr < 0 || pr > L + R || Math.abs(dx * s - dy * c) > largo + R) continue;
      if (danneggia(st, h, t, dmg, fl, t.x, t.y) && t.vivo && spinta) spingi(t, c, s, spinta);
    }
    for (i = 0; i < MAXT; i++) {
      var tu = st.tu[i];
      if (!tu.vivo || tu.sq === h.sq || !bersaglioTu(tu)) continue;
      var ex = tu.x - h.x, ey = tu.y - h.y, pr2 = ex * c + ey * s;
      if (pr2 < 0 || pr2 > L + 0.4 || Math.abs(ex * s - ey * c) > largo + 0.4) continue;
      danneggiaTorretta(st, h, tu, dmg);
    }
  }

  function mischia(st, h, ang, gitt, angoGradi, dmg, fl, quale) {
    var semi = angoGradi * Math.PI / 360, i, tot = 0;
    if (quale === 'artiglio1' || quale === 'artiglio2') ev(st, 'artiglio', h.x, h.y, h.i, ang, gitt, quale === 'artiglio2' ? -1 : 1);
    else if (quale === 'rombo' || quale === 'mazzata') ev(st, quale === 'rombo' ? 'affondoRombo' : 'mazzata', h.x, h.y, h.i, ang, gitt, h.seqI | 0);   // 22/11 Fante
    else if (quale !== 'manata' && quale !== 'pala') ev(st, 'fendente', h.x, h.y, h.i, ang, gitt, angoGradi);
    for (i = 0; i < st.eroi.length; i++) {
      var t = st.eroi[i];
      if (!t.vivo || t.sq === h.sq) continue;
      var dx = t.x - h.x, dy = t.y - h.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > gitt + R) continue;
      var da = Math.atan2(dy, dx) - ang;
      while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      if (Math.abs(da) > semi + Math.atan2(R, Math.max(d, 0.3))) continue;
      if (!lineaLibera(st, h.x, h.y, t.x, t.y)) continue;
      var f = danneggia(st, h, t, dmg, fl, t.x, t.y);
      if (f > 0 && st._cm) st._cm.push(t.i);   // 22/11 Fante: chi ha preso il primo affondo
      tot += f;
      if (t.vivo && f) {
        // la manata respinge senza stordire (niente catene di stordimenti); le altre mischie spingono poco e stordiscono un attimo
        if (quale === 'manata') { if (t.falT <= 0 && t.fortT <= 0) { var kc = h.combo === 2 ? 1.2 : 0.35; t.kx = dx / (d || 1) * h.d.att.spinta * kc * 5.4; t.ky = dy / (d || 1) * h.d.att.spinta * kc * 5.4;   /* Buttafuori: destro, sinistro spingono poco, la bracciata (3° colpo) spinge */ if (t.stun < 0.12) t.stun = 0.12; } }
        else { spingi(t, dx / (d || 1), dy / (d || 1), quale === 'pala' ? h.d.att.pala.spinta : quale === 'mazzata' ? h.d.corazza.mazzata.spinta : 0.3); if (quale === 'pala' && t.stun < h.d.att.pala.stun) t.stun = h.d.att.pala.stun; }
        if (quale === 'artiglio1' || quale === 'artiglio2') { t.sangueT = 2; t.sangueDps = h.d.att.sangue * h.k; t.sangueDa = h.i; }
      }
    }
    for (i = 0; i < MAXT; i++) {
      var tu = st.tu[i];
      if (!tu.vivo || tu.sq === h.sq || !bersaglioTu(tu)) continue;
      var ex = tu.x - h.x, ey = tu.y - h.y;
      if (ex * ex + ey * ey <= (gitt + 0.4) * (gitt + 0.4)) danneggiaTorretta(st, h, tu, dmg);
    }
    for (var s = 0.6; s <= gitt; s += 0.5) {
      var cx = h.x + Math.cos(ang) * s, cy = h.y + Math.sin(ang) * s, c = Math.floor(cx), r = Math.floor(cy);
      if (tile(st, c, r) === CASSA) { danneggiaCassa(st, c, r, dmg, h); break; }
      if (tile(st, c, r) === MURO) break;
    }
    return tot;
  }

  // ---------------- SUPER (una per eroe, tutte diverse) ----------------
  function superAttacco(st, h, ax, ay) {
    var o = h.d.sup, i, k = h.k;
    var b = bersaglio(h, ax, ay, o.gitt || o.raggio || 5, st._b), ang = b.a;
    guarda(h, ang); h.tSup = st.t; h.supUsate++; h.riv = 0.9; h.prot = 0; h.regT = 0;
    if (h.invT > 0) h.invT = 0;
    ev(st, 'super', h.x, h.y, h.i, ang, 0, 0);
    switch (o.tipo) {
      case 'slot_torretta': {
        var tu = nuovaTorretta(st); if (!tu) break;
        var dd = Math.min(b.d, 2.5), q = liberaVicina(st, h.x + Math.cos(ang) * dd, h.y + Math.sin(ang) * dd, st._tmp);
        tu.tipo = TU_TORRETTA; tu.x = q.x; tu.y = q.y; tu.sq = h.sq; tu.ow = h.i; tu.vita = tu.vmax = o.vita * k; tu.cd = 0.5;
        tu.dur = tu.durMax = o.dur; tu.danno = o.danno * k; tu.gitt = o.gitt; tu.cad = o.cad; tu.pv = o.pv; tu.ang = ang; tu.eroe = h.id;
        ev(st, 'torretta', tu.x, tu.y, h.i, 0, 0, 0);
        break;
      }
      case 'famiglia':
        for (i = 0; i < 2; i++) {
          var g = nuovaTorretta(st); if (!g) break;
          g.tipo = TU_SCAGNOZZO; g.lato = i ? 1 : -1; g.x = clampX(st, h.x + g.lato * 0.9); g.y = clampY(st, h.y + 0.3); if (bloccaColpo(st, Math.floor(g.x), Math.floor(g.y))) { g.x = h.x; g.y = h.y; } g.sq = h.sq; g.ow = h.i;
          g.vita = g.vmax = o.vita * k; g.cd = 0.3 + i * 0.2; g.dur = g.durMax = o.dur; g.danno = o.danno * k; g.gitt = o.gitt; g.cad = o.cad; g.pv = o.pv; g.ang = ang; g.eroe = h.id;
          ev(st, 'scagnozzo', g.x, g.y, h.i, i, 0, 0);
        }
        break;
      case 'asso_manica': {   // 22/11 Asso: carta asso che marca; ripremendo la super scatta fino al marcato e lo trafigge
        var mk = h.mancaT > 0 && h.mancaB >= 0 ? st.eroi[h.mancaB] : null;
        if (mk && mk.vivo) {
          var mdx = mk.x - h.x, mdy = mk.y - h.y, mdd = Math.sqrt(mdx * mdx + mdy * mdy) || 1, ma = Math.atan2(mdy, mdx);
          guarda(h, ma); h.dashD = Math.min(o.dist, mdd + 0.6); h.dvx = mdx / mdd * o.v; h.dvy = mdy / mdd * o.v; h.dmask = 0; h.dashTipo = 'asso'; h.mancaT = 0; h.caricaSup = 0;
          ev(st, 'assoScatto', h.x, h.y, h.i, ma, mk.i, mdd);
        } else {
          h.mancaT = 0; var ac = spara(st, h, ang, o, 0, F_SUP, o.danno, 'asso_manica'); if (ac) ac.r = o.rp;
          ev(st, 'assoVia', h.x, h.y, h.i, ang, 0, 0);
        }
        break;
      }
      case 'pioggia_cuori': {   // 22/11 Regina: per 4 s cadono cuori nell'area (male ai nemici, cura agli alleati)
        var zc = nuovaZona(st); if (!zc) break;
        zc.tipo = Z_MALE; zc.ab = 'pioggia'; zc.x = clampX(st, b.x); zc.y = clampY(st, b.y); zc.r = o.raggio; zc.t = 0; zc.T = o.dur; zc.val = 0; zc.sq = h.sq; zc.ow = h.i; zc.eroe = h.id; zc.sp = 0;
        ev(st, 'zona', zc.x, zc.y, zc.r, h.i, zc.tipo, 1);
        break;
      }
      case 'pioggia_quadri':   // 22/11 Fante: 5 rombi a ventaglio che tornano; da Cavaliere la carica a scudo (meccanica di Agamennone)
        if (h.cavT > 0) {
          var cc = o.cav; guarda(h, ang);
          h.dashD = cc.dist; h.dvx = Math.cos(ang) * cc.v; h.dvy = Math.sin(ang) * cc.v; h.dmask = 0; h.dashTipo = 'oplita'; h.oplT = cc.dist / cc.v + 0.15;
          h.dashDan = cc.danno; h.dashSp = cc.spinta; h.dashStun = cc.stun; h.caricaSup = 1;
          ev(st, 'caricaCavaliere', h.x, h.y, h.i, ang, cc.dist, 0);
          break;
        }
        h.corSup = 1;
        for (i = 0; i < o.n; i++) { var qo = (i / (o.n - 1) - 0.5) * o.ango * Math.PI / 180, rq = spara(st, h, ang + qo, o, 0, F_SUP, o.danno, 'pioggia_quadri'); if (rq) { rq.pierce = 1; rq.torna = 1; rq.r = o.rp; rq.num = i; } }
        ev(st, 'pioggiaQuadri', h.x, h.y, h.i, ang, o.n, 0);
        break;
      case 'carica_scudo':   // 22/11 (proprietario): la super di Agamennone e' una carica in avanti dietro lo scudo
        guarda(h, ang);
        h.dashD = o.dist; h.dvx = Math.cos(ang) * o.v; h.dvy = Math.sin(ang) * o.v; h.dmask = 0; h.dashTipo = 'oplita'; h.oplT = o.dist / o.v + 0.15;
        h.dashDan = o.danno; h.dashSp = o.spinta; h.dashStun = o.stun; h.caricaSup = 1;
        ev(st, 'caricaScudo', h.x, h.y, h.i, ang, o.dist, 0);
        break;
      case 'falange':
        for (i = 0; i < st.eroi.length; i++) {
          var al = st.eroi[i];
          if (!al.vivo || al.sq !== h.sq) continue;
          var ax2 = al.x - h.x, ay2 = al.y - h.y;
          if (ax2 * ax2 + ay2 * ay2 <= o.raggio * o.raggio) { al.scuT = o.dur; al.scuF = o.f; }
        }
        h.falT = o.dur;
        ev(st, 'scudo', h.x, h.y, h.i, o.raggio, 0, 0);
        break;
      case 'rete': spara(st, h, ang, o, 3, F_SUP, o.danno, 'rete'); break;
      case 'immersione': h.immT = o.dur; h.seqN = 0; ev(st, 'tuffo', h.x, h.y, h.i, 0, 0, 0); break;
      case 'trasformazione':
        h.trasT = o.dur;
        // ululato alla luna: chi è vicino scappa
        for (i = 0; i < st.eroi.length; i++) {
          var pe = st.eroi[i];
          if (!pe.vivo || pe.sq === h.sq || intoccabile(pe)) continue;
          var px2 = pe.x - h.x, py2 = pe.y - h.y;
          if (px2 * px2 + py2 * py2 > o.ulula * o.ulula) continue;
          if (pe.d.impavido) continue;   // il buttafuori non ha paura
          pe.pauraT = Math.max(pe.pauraT, o.paura); pe.pauraX = h.x; pe.pauraY = h.y; pe.prepT = 0; pe.seqN = 0;
        }
        ev(st, 'lunaPiena', h.x, h.y, h.i, o.ulula, 0, 0);
        break;
      case 'fumogeno': {
        var z = nuovaZona(st); if (!z) break;
        z.tipo = Z_FUMO; z.ab = 'fumogeno'; z.x = clampX(st, b.x); z.y = clampY(st, b.y); z.r = o.area; z.t = 0; z.T = o.dur; z.val = 0; z.sq = h.sq; z.ow = h.i; z.sl = o.sl; z.eroe = h.id;
        ev(st, 'zona', z.x, z.y, z.r, h.i, z.tipo, 0);
        break;
      }
      case 'maledizione': lancia(st, h, b.x, b.y, o, o.T, 2, F_SUP | F_ZONA, 0); break;
      case 'giardino_trappola': lancia(st, h, b.x, b.y, o, o.T, 7, F_SUP | F_ZONA, 0); break;   // 22/11 Dama: la manciata di semi vola ad arco (anche sopra i muri)
      case 'bordata':
        for (i = 0; i < o.n; i++) {
          var dist = o.gitt * (0.35 + 0.65 * i / Math.max(1, o.n - 1));
          lancia(st, h, h.x + Math.cos(ang) * dist, h.y + Math.sin(ang) * dist, o, o.T + i * 0.12, 0, F_SUP, o.danno);
        }
        break;
      case 'fortezza': h.fortT = o.dur; h.fortSh = h.vmax * o.scudo; break;
      case 'tre_sette': {
        // tre fendenti dal cielo sullo stesso punto, annunciati: 0,45 s, poi ogni 0,32 s; il terzo stordisce
        var cx = clampX(st, b.x), cy = clampY(st, b.y);
        for (i = 0; i < 3; i++) {
          var zs = nuovaZona(st); if (!zs) break;
          zs.tipo = Z_SCOPPIO; zs.ab = 'sette' + (i + 1); zs.x = cx; zs.y = cy; zs.r = o.area; zs.t = 0; zs.T = o.t1 + o.passo * i;
          zs.val = (i === 2 ? o.ultimo : o.danno) * k; zs.sq = h.sq; zs.ow = h.i; zs.eroe = h.id;
        }
        ev(st, 'treSette', cx, cy, h.i, o.area, o.t1, o.passo);
        break;
      }
      case 'rastrello': {
        // rastrello gigante: spazza la linea e trascina tutti i colpiti davanti al banco
        var rc = Math.cos(ang), rs = Math.sin(ang), RL;
        for (RL = 0.4; RL < o.gitt; RL += 0.15) if (bloccaColpo(st, Math.floor(h.x + rc * RL), Math.floor(h.y + rs * RL))) break;
        if (RL > o.gitt) RL = o.gitt;
        ev(st, 'rastrello', h.x, h.y, h.i, ang, RL, 0);
        for (i = 0; i < st.eroi.length; i++) {
          var rt = st.eroi[i];
          if (!rt.vivo || rt.sq === h.sq || intoccabile(rt)) continue;
          var rx = rt.x - h.x, ry = rt.y - h.y, rp = rx * rc + ry * rs;
          if (rp < 0 || rp > RL + R || Math.abs(rx * rs - ry * rc) > o.largo + R) continue;
          danneggia(st, h, rt, o.danno * k, F_SUP, rt.x, rt.y);
          if (!rt.vivo || rt.falT > 0 || rt.fortT > 0) continue;
          var dove = Math.min(o.tira, rp), q2 = liberaVicina(st, h.x + rc * dove, h.y + rs * dove, st._tmp);
          rt.tirT = 0.3; rt.tirX = q2.x; rt.tirY = q2.y; rt.stun = Math.max(rt.stun, o.stun); rt.seqN = 0; rt.dashD = 0; rt.prepT = 0;
          ev(st, 'trascinato', rt.x, rt.y, h.i, rt.i, q2.x, q2.y);
        }
        for (i = 0; i < MAXT; i++) {
          var ru = st.tu[i];
          if (!ru.vivo || ru.sq === h.sq || !bersaglioTu(ru)) continue;
          var ux = ru.x - h.x, uy = ru.y - h.y, up = ux * rc + uy * rs;
          if (up >= 0 && up <= RL + 0.4 && Math.abs(ux * rs - uy * rc) <= o.largo + 0.4) danneggiaTorretta(st, h, ru, o.danno * k);
        }
        break;
      }
      case 'ventaglio_oro':
        // svuota il tamburo a ventaglio, col rinculo che lo fa scivolare indietro
        h.ventN = o.n; h.ventT = 0; h.ventI = 0; h.ventA = ang; h.colpi = 0;
        h.kx = -Math.cos(ang) * o.rinculo; h.ky = -Math.sin(ang) * o.rinculo;
        break;
      case 'pizza_gigante': {
        // una pizza gigante rotola dritta: travolge tutti, rompe le casse, si ferma sui muri
        var pg = spara(st, h, ang, o, 0, F_SUP, o.danno, 'pizza_gigante'); if (pg) { pg.pierce = 1; pg.rompe = 1; pg.r = o.rp; }
        ev(st, 'pizzaGigante', h.x, h.y, h.i, ang, o.gitt, 0);
        break;
      }
      case 'drop':
        // tre onde d'urto attorno a lui sul battito; la terza è il DROP: spinge lontano
        h.dropN = 3; h.dropT = 0; h.dropI = 0;
        break;
      case 'sigilli': {
        // sigilli su tutti i nemici visibili in gittata; poco dopo escono colonne di cristallo dov'erano
        var nsig = 0;
        for (i = 0; i < st.eroi.length; i++) {
          var se = st.eroi[i];
          if (!se.vivo || se.sq === h.sq || !visibile(st, se, h.sq)) continue;
          if ((se.x - h.x) * (se.x - h.x) + (se.y - h.y) * (se.y - h.y) > o.gitt * o.gitt) continue;
          var zs2 = nuovaZona(st); if (!zs2) break;
          zs2.tipo = Z_SCOPPIO; zs2.ab = 'sigillo'; zs2.x = se.x; zs2.y = se.y; zs2.r = o.area; zs2.t = 0; zs2.T = o.T; zs2.val = o.danno * k; zs2.sq = h.sq; zs2.ow = h.i; zs2.eroe = h.id;
          ev(st, 'sigillo', se.x, se.y, h.i, se.i, o.T, o.area); nsig++;
        }
        if (!nsig) ev(st, 'sigillo', b.x, b.y, h.i, -1, o.T, o.area);
        break;
      }
      case 'freccia_oro': {
        var fo = spara(st, h, ang, o, 0, F_SUP, o.danno, 'freccia_oro'); if (fo) { fo.pierce = 1; fo.passa = 1; fo.r = 0.3; fo.oro = 1; }
        ev(st, 'frecciaOro', h.x, h.y, h.i, ang, o.gitt, 0);
        break;
      }
      case 'fuori_dal_locale':
        h.dashD = o.dist; h.dvx = Math.cos(ang) * o.vdash; h.dvy = Math.sin(ang) * o.vdash; h.dmask = 0; h.dashTipo = 'presa';
        break;
    }
  }

  // ---------------- GADGET (uno per eroe, tutti diversi) ----------------
  function gadget(st, h, gx, gy) {
    var o = h.d.gad, i;
    var b = bersaglio(h, gx, gy, o.gitt || 3, st._b), ang = b.a;
    h.gadUsi--; h.gadCd = 4; h.tGad = st.t; h.gadUsate++;
    if (o.tipo !== 'sostituzione' && o.tipo !== 'frenesia') { h.riv = Math.max(h.riv, 0.5); }
    ev(st, 'gadget', h.x, h.y, h.i, ang, 0, 0);
    switch (o.tipo) {
      case 'truccato': h.trucN = 1; break;
      case 'ricarica': h.ammo = 3; break;
      case 'carica_oplita':
        guarda(h, ang);
        h.dashD = o.dist; h.dvx = Math.cos(ang) * 12; h.dvy = Math.sin(ang) * 12; h.dmask = 0; h.dashTipo = 'oplita'; h.oplT = o.dist / 12 + 0.1; h.dashDan = 0; h.dashSp = 0; h.dashStun = 0; h.caricaSup = 0;
        break;
      case 'muro_scudo': h.muroT = o.dur; h.muroA = ang; guarda(h, ang); h.oplT = 0; ev(st, 'scudoSu', h.x, h.y, h.i, ang, o.dur, 0); break;
      case 'pollice_verso': h.esecT = o.dur; break;
      case 'frenesia': h.freT = o.dur; break;
      case 'ululato':
        for (i = 0; i < st.eroi.length; i++) {
          var e = st.eroi[i];
          if (!e.vivo || e.sq === h.sq || intoccabile(e)) continue;
          var dx = e.x - h.x, dy = e.y - h.y;
          if (dx * dx + dy * dy > o.raggio * o.raggio) continue;
          e.pauraT = o.dur; e.pauraX = h.x; e.pauraY = h.y; e.prepT = 0; e.seqN = 0;
        }
        break;
      case 'sostituzione': {
        var tu = nuovaTorretta(st);
        if (tu) { tu.tipo = TU_ESCA; tu.x = h.x; tu.y = h.y; tu.sq = h.sq; tu.ow = h.i; tu.vita = tu.vmax = 1000; tu.dur = tu.durMax = o.dur; tu.eroe = h.id; tu.ang = h.aim; }
        h.invT = o.invis;
        // un passo laterale nel fumo
        var lat = h.aim + Math.PI / 2, q = liberaVicina(st, h.x + Math.cos(lat) * 1.1, h.y + Math.sin(lat) * 1.1, st._tmp);
        h.x = h.ox = q.x; h.y = h.oy = q.y; risolvi(st, h);
        ev(st, 'sostituzione', tu ? tu.x : h.x, tu ? tu.y : h.y, h.i, 0, 0, 0);
        break;
      }
      case 'calderone': {
        var z = nuovaZona(st); if (!z) break;
        var d = b.l < 0.05 ? 0 : b.d;
        z.tipo = Z_CURA; z.ab = 'calderone'; z.x = clampX(st, h.x + Math.cos(ang) * d); z.y = clampY(st, h.y + Math.sin(ang) * d); z.r = o.area; z.t = 0; z.T = o.dur; z.val = o.hps * h.k; z.sq = h.sq; z.ow = h.i; z.eroe = h.id;
        ev(st, 'zona', z.x, z.y, z.r, h.i, z.tipo, 0);
        break;
      }
      case 'barile': lancia(st, h, b.x, b.y, o, o.T, 4, 0, 0); break;
      case 'parata': h.parT = o.dur; guarda(h, h.aim); ev(st, 'parataVia', h.x, h.y, h.i, o.dur, 0, 0); break;
      case 'carta_coperta': {
        // una sola in campo: la vecchia sparisce
        for (i = 0; i < MAXT; i++) { var vm = st.tu[i]; if (vm.vivo && vm.ow === h.i && vm.tipo === TU_MINA) { vm.vivo = 0; ev(st, 'torrettaKo', vm.x, vm.y, vm.ow, 0, vm.tipo, 0); } }
        var mc = Math.cos(ang), ms = Math.sin(ang), ML;
        for (ML = 0.3; ML < b.d; ML += 0.1) if (bloccaPasso(st, Math.floor(h.x + mc * ML), Math.floor(h.y + ms * ML))) { ML -= 0.3; break; }
        if (ML > b.d) ML = b.d;
        var mina = nuovaTorretta(st); if (!mina) break;
        mina.tipo = TU_MINA; mina.x = clampX(st, h.x + mc * Math.max(0, ML)); mina.y = clampY(st, h.y + ms * Math.max(0, ML)); mina.sq = h.sq; mina.ow = h.i;
        mina.vita = mina.vmax = 1; mina.dur = mina.durMax = o.dur; mina.arm = o.arma; mina.danno = o.danno * h.k; mina.area = o.area; mina.ang = ang; mina.eroe = h.id;
        ev(st, 'cartaPosata', mina.x, mina.y, h.i, ang, h.x, h.y);
        break;
      }
      case 'ritirata': {   // 22/11 Asso: salto indietro (lontano da dove miri) e una tacca subito
        guarda(h, ang);
        var rb = ang + Math.PI, rx2 = h.x, ry2 = h.y;
        for (var rl = 0.3; rl <= o.dist; rl += 0.2) { var rtx = h.x + Math.cos(rb) * rl, rty = h.y + Math.sin(rb) * rl; if (bloccaPasso(st, Math.floor(rtx), Math.floor(rty))) break; rx2 = rtx; ry2 = rty; }
        h.salT = h.salTT = o.T; h.salSx = h.x; h.salSy = h.y; h.salTx = rx2; h.salTy = ry2; h.salTipo = 'ritirata';
        h.ammo = Math.min(3, h.ammo + 1);
        ev(st, 'ritirata', h.x, h.y, h.i, rx2, ry2, ang);
        break;
      }
      case 'grazia_reale': h.graziaN = 1; ev(st, 'grazia', h.x, h.y, h.i, 0, 0, 0); break;   // 22/11 Regina: il prossimo cuore torna
      case 'scatto_rombo': {   // 22/11 Fante: scatto dove miri (scoppia i rombi rossi); da Cavaliere spallata (meccanica della carica)
        guarda(h, ang);
        if (h.cavT > 0 && o.balzo) {   // 23/11 (proprietario): da Cavaliere BALZO mirato su un punto, sopra muri e casse, e schianto ad area all'atterraggio
          var bz = o.balzo, bb = bersaglio(h, gx, gy, bz.gitt, st._b), qb = liberaVicina(st, clampX(st, bb.x), clampY(st, bb.y), st._tmp);
          guarda(h, bb.a);
          h.salT = h.salTT = bz.T; h.salSx = h.x; h.salSy = h.y; h.salTx = qb.x; h.salTy = qb.y; h.salTipo = 'balzoCav'; h.dashD = 0; h.kx = h.ky = 0;
          ev(st, 'balzoCav', h.x, h.y, h.i, qb.x, qb.y, bz.T);
          break;
        }
        if (h.cavT > 0) { var sp2 = o.spalla; h.dashD = sp2.dist; h.dvx = Math.cos(ang) * 12; h.dvy = Math.sin(ang) * 12; h.dmask = 0; h.dashTipo = 'oplita'; h.oplT = sp2.dist / 12 + 0.1; h.dashDan = sp2.danno; h.dashSp = sp2.spinta; h.dashStun = sp2.stun; h.caricaSup = 0; ev(st, 'spallata', h.x, h.y, h.i, ang, sp2.dist, 0); break; }
        var vs2 = o.dist / o.T; h.dashD = o.dist; h.dvx = Math.cos(ang) * vs2; h.dvy = Math.sin(ang) * vs2; h.dmask = 0; h.dashTipo = 'rombo'; h.caricaSup = 0;
        ev(st, 'scattoRombo', h.x, h.y, h.i, ang, o.dist, 0);
        break;
      }
      case 'cordone': {
        var cc2 = Math.cos(ang), cs2 = Math.sin(ang), q3 = liberaVicina(st, h.x + cc2 * o.gitt, h.y + cs2 * o.gitt, st._tmp);
        for (i = 0; i < MAXT; i++) { var vc = st.tu[i]; if (vc.vivo && vc.ow === h.i && vc.tipo === TU_CORDONE) { vc.vivo = 0; ev(st, 'torrettaKo', vc.x, vc.y, vc.ow, 0, vc.tipo, 0); } }
        var co = nuovaTorretta(st); if (!co) break;
        co.tipo = TU_CORDONE; co.x = q3.x; co.y = q3.y; co.sq = h.sq; co.ow = h.i; co.vita = co.vmax = 1; co.dur = co.durMax = o.dur; co.area = o.lungo; co.ang = ang; co.eroe = h.id;
        ev(st, 'cordone', co.x, co.y, h.i, ang, o.lungo, 0);
        break;
      }
      case 'siepe': {   // 22/11 Dama: siepe di rovi davanti a lei, perpendicolare alla mira; una sola in campo
        var cs3 = Math.cos(ang), sn3 = Math.sin(ang), q4 = liberaVicina(st, clampX(st, h.x + cs3 * o.dist), clampY(st, h.y + sn3 * o.dist), st._tmp);
        for (i = 0; i < MAXT; i++) { var vs = st.tu[i]; if (vs.vivo && vs.ow === h.i && vs.tipo === TU_SIEPE) fineTorretta(st, vs); }
        var si = nuovaTorretta(st); if (!si) break;
        si.tipo = TU_SIEPE; si.x = q4.x; si.y = q4.y; si.sq = h.sq; si.ow = h.i; si.vita = si.vmax = o.vita * h.k; si.dur = si.durMax = o.dur; si.area = o.lungo / 2; si.ang = ang; si.danno = o.danno * h.k; si.eroe = h.id;
        ev(st, 'siepe', si.x, si.y, h.i, ang, si.area, 0);
        break;
      }
      case 'pizze_scudo': h.orbT = o.dur; h.orbC = 0; ev(st, 'pizzeScudo', h.x, h.y, h.i, o.dur, 0, 0); break;
      case 'cassa_bassi': {
        var cb = nuovaTorretta(st); if (!cb) break;
        var qcb = liberaVicina(st, clampX(st, b.x), clampY(st, b.y), st._tmp);
        for (i = 0; i < MAXT; i++) { var vcb = st.tu[i]; if (vcb.vivo && vcb !== cb && vcb.ow === h.i && vcb.tipo === TU_CASSA) { vcb.vivo = 0; ev(st, 'torrettaKo', vcb.x, vcb.y, vcb.ow, 0, vcb.tipo, 0); } }
        cb.tipo = TU_CASSA; cb.x = qcb.x; cb.y = qcb.y; cb.sq = h.sq; cb.ow = h.i; cb.vita = cb.vmax = o.vita * h.k; cb.dur = cb.durMax = o.dur; cb.cd = o.ogni; cb.danno = o.danno * h.k; cb.area = o.area; cb.eroe = h.id; cb.ang = ang;
        ev(st, 'cassaPosata', cb.x, cb.y, h.i, 0, 0, 0);
        break;
      }
      case 'tarocco': { spara(st, h, ang, o, 0, F_ZONA, o.danno, 'tarocco'); ev(st, 'taroccoVia', h.x, h.y, h.i, ang, 0, 0); break; }
      case 'taglia': { var tg = spara(st, h, ang, o, 0, F_ZONA, o.danno, 'taglia'); ev(st, 'tagliaVia', h.x, h.y, h.i, ang, 0, 0); break; }
      case 'capriola': {
        // capriola all'indietro (lontano da dove miri), poi a mezz'aria una freccia dritta verso la mira
        guarda(h, ang);
        var bk = ang + Math.PI, cl = 0.3, cxp = h.x, cyp = h.y;
        for (cl = 0.3; cl <= o.dist; cl += 0.2) { var tx2 = h.x + Math.cos(bk) * cl, ty2 = h.y + Math.sin(bk) * cl; if (bloccaPasso(st, Math.floor(tx2), Math.floor(ty2))) break; cxp = tx2; cyp = ty2; }
        h.salT = h.salTT = o.T; h.salSx = h.x; h.salSy = h.y; h.salTx = cxp; h.salTy = cyp; h.salTipo = 'capriola'; h.capA = ang;
        ev(st, 'capriola', h.x, h.y, h.i, cxp, cyp, ang);
        break;
      }
      case 'balzo_predatore': {
        guarda(h, ang);
        var q4 = liberaVicina(st, clampX(st, b.x), clampY(st, b.y), st._tmp);
        h.salT = h.salTT = o.T; h.salSx = h.x; h.salSy = h.y; h.salTx = q4.x; h.salTy = q4.y; h.salTipo = 'balzo';
        ev(st, 'balzo', h.x, h.y, h.i, q4.x, q4.y, o.T);
        break;
      }
      case 'pila': {
        var c = Math.floor(h.x + Math.cos(ang) * 1.3), r = Math.floor(h.y + Math.sin(ang) * 1.3);
        if (c >= 0 && r >= 0 && c < st.w && r < st.h && st.g[r * st.w + c] === 0 && !occupata(st, c, r)) {
          st.g[r * st.w + c] = CASSA; st.vc[r * st.w + c] = 1500;
          ev(st, 'muretto', c + 0.5, r + 0.5, h.i, 0, 0, 0);
        }
        break;
      }
    }
  }
  function occupata(st, c, r) {
    for (var i = 0; i < st.eroi.length; i++) { var e = st.eroi[i]; if (e.vivo && Math.abs(e.x - (c + 0.5)) < 0.5 + R && Math.abs(e.y - (r + 0.5)) < 0.5 + R) return true; }
    for (var j = 0; j < MAXG; j++) { var g = st.ge[j]; if (g.vivo && Math.floor(g.x) === c && Math.floor(g.y) === r) return true; }
    // [fable] ne' sui cubi, ne' sui punti di nascita (chi rinasceva finiva dentro il muretto), ne' sulla miniera delle gemme
    for (var q = 0; q < MAXC; q++) { var cu = st.cu[q]; if (cu.vivo && Math.floor(cu.x) === c && Math.floor(cu.y) === r) return true; }
    var M = st.M, liste = [M.ffa || []].concat(M.sp || []), a, b;
    for (a = 0; a < liste.length; a++) for (b = 0; b < liste[a].length; b++) if (Math.floor(liste[a][b].x) === c && Math.floor(liste[a][b].y) === r) return true;
    if (M.gem && Math.floor(M.gem.x) === c && Math.floor(M.gem.y) === r) return true;
    return false;
  }

  function clampX(st, x) { return Math.max(0.3, Math.min(st.w - 0.3, x)); }
  function clampY(st, y) { return Math.max(0.3, Math.min(st.h - 0.3, y)); }

  // ---------------- visibilità ----------------
  function vicinoDiSquadra(st, h, q, dist) {
    for (var i = 0; i < st.eroi.length; i++) {
      var o = st.eroi[i];
      if (!o.vivo || o.sq !== q) continue;
      var dx = o.x - h.x, dy = o.y - h.y;
      if (dx * dx + dy * dy <= dist * dist) return true;
    }
    return false;
  }
  function nelFumoAmico(st, h) {
    for (var i = 0; i < MAXZ; i++) {
      var z = st.zo[i];
      if (!z.vivo || z.tipo !== Z_FUMO || z.sq !== h.sq) continue;
      var dx = h.x - z.x, dy = h.y - z.y;
      if (dx * dx + dy * dy <= z.r * z.r) return true;
    }
    return false;
  }
  function calcolaVisibilita(st) {
    for (var i = 0; i < st.eroi.length; i++) {
      var h = st.eroi[i], m = 0;
      if (h.vivo) {
        var fumo = nelFumoAmico(st, h);
        for (var q = 0; q < st.nsq; q++) {
          if (q === h.sq) { m |= 1 << q; continue; }
          if (h.immT > 0) continue;                                   // sott'acqua: invisibile
          if (h.rivT > 0) { m |= 1 << q; continue; }                  // svelato (frenesia)
          if (h.invT > 0 || fumo) { if (vicinoDiSquadra(st, h, q, 1.5)) m |= 1 << q; }
          else if (h.nasc) { if (h.riv > 0 || vicinoDiSquadra(st, h, q, 2.3)) m |= 1 << q; }
          else m |= 1 << q;
        }
      }
      st.vis[i] = m;
    }
  }
  function visibile(st, h, q) { return (st.vis[h.i] & (1 << q)) !== 0; }

  // ---------------- passo ----------------
  function passo(st) {
    if (st.fine) return;
    st.nev = 0; st.t++;
    var i, j, h, inp, tempo = st.t * DT;

    for (i = 0; i < st.eroi.length; i++) {
      h = st.eroi[i]; inp = st.inp[i];
      h.ox = h.x; h.oy = h.y;
      if (!h.vivo) {
        if (h.rt > 0) { h.rt -= DT; if (h.rt <= 0) { nasci(st, h); ev(st, 'nascita', h.x, h.y, h.i, 0, 0, 0); } }
        inp.att = 0; inp.sup = 0; inp.gad = 0;   // [fable] un comando premuto da morto non parte da solo alla rinascita
        continue;
      }
      if (h.cd > 0) h.cd -= DT;
      if (h.cavT > 0) { h.stun = 0; h.radiceT = 0; h.pauraT = 0; h.tirT = 0; h.kx = 0; h.ky = 0; h.cavT -= DT; if (h.cavT <= 0 || h.cavSh <= 0) fineCorazza(st, h); }   // 22/11 Cavaliere: niente spinte ne' stordimenti
      if (h.romboT > 0) h.romboT -= DT;
      if (h.marcaT > 0) h.marcaT -= DT;
      if (h.mancaT > 0) { h.mancaT -= DT; var mbq = st.eroi[h.mancaB]; if (h.mancaT <= 0 || !mbq || !mbq.vivo) { h.mancaT = 0; if (mbq) mbq.marcaT = 0; if (!(h.prepT > 0 && h.prepCosa === 1)) { h.sup = 0; h.supPronta = false; } ev(st, 'marcaFine', h.x, h.y, h.i, 0, 0, 0); } }
      if (h.stun > 0) h.stun -= DT;
      if (h.radiceT > 0) h.radiceT -= DT;
      if (h.rovoT > 0) h.rovoT -= DT;
      if (h.slowT > 0) h.slowT -= DT;
      if (h.scuT > 0) h.scuT -= DT;
      if (h.invT > 0) h.invT -= DT;
      if (h.riv > 0) h.riv -= DT;
      if (h.rivT > 0) h.rivT -= DT;
      if (h.prot > 0) h.prot -= DT;
      if (h.gadCd > 0) h.gadCd -= DT;
      if (h.pauraT > 0) h.pauraT -= DT;
      if (h.trasT > 0) h.trasT -= DT;
      if (h.freT > 0) h.freT -= DT;
      if (h.esecT > 0) h.esecT -= DT;
      if (h.falT > 0) h.falT -= DT;
      if (h.oplT > 0) h.oplT -= DT;
      if (h.giroT > 0) { h.giroT -= DT; if (h.giroT <= 0) { h.giroT = 0; if (h.vivo) colpoArea(st, h, h.sq, h.x, h.y, h.d.att.giro, h.d.att.danGiro * h.k, F_ZONA, 0.5, 0, 0, 0); } }
      if (h.muroT > 0) { h.muroT -= DT; guarda(h, h.muroA); if (h.muroT <= 0) { h.muroT = 0; ev(st, 'scudoGiu', h.x, h.y, h.i, h.muroA, 0, 0); } }
      if (h.parT > 0) h.parT -= DT;
      if (h.taglT > 0) h.taglT -= DT;
      if (h.portT > 0) h.portT -= DT;
      if (h.altT > 0) h.altT -= DT;
      if (h.fortT > 0) { h.fortT -= DT; if (h.fortT <= 0) h.fortSh = 0; }
      if (h.sangueT > 0) {
        h.sangueT -= DT;
        if (st.t % 10 === 0) danneggia(st, h.sangueDa >= 0 ? st.eroi[h.sangueDa] : null, h, h.sangueDps / 3, F_ZONA, h.x, h.y);
        if (!h.vivo) continue;
      }
      if (h.ammo < 3 && h.seqN === 0) { h.ammo += DT / (h.cavT > 0 ? h.d.corazza.mazzata.ric : h.d.att.ric); if (h.ammo > 3) h.ammo = 3; }

      // --- movimento ---
      h.mosso = 0;
      if (h.tirT > 0) {
        var f = Math.min(1, DT / h.tirT);
        muovi(st, h, (h.tirX - h.x) * f, (h.tirY - h.y) * f); h.tirT -= DT; cordoni(st, h);
      } else if (h.salT > 0) {
        h.salT -= DT;
        var fs = 1 - Math.max(0, h.salT) / h.salTT;
        h.x = h.salSx + (h.salTx - h.salSx) * fs; h.y = h.salSy + (h.salTy - h.salSy) * fs; h.z = 4 * fs * (1 - fs);
        if (h.salT <= 0) { h.z = 0; h.x = h.salTx; h.y = h.salTy; risolvi(st, h); if (h.salTipo) atterra(st, h); }
      } else if (h.dashD > 0) {
        aggiornaScatto(st, h); if (cordoni(st, h)) h.dashD = 0;
      } else {
        var mx = inp.mx, my = inp.my;
        if (!(mx === mx) || !(my === my)) { mx = 0; my = 0; }   // [fable] comando non valido (NaN): fermo, mai una posizione NaN
        var ml = Math.sqrt(mx * mx + my * my);
        if (ml > 1) { mx /= ml; my /= ml; ml = 1; }
        if (h.pauraT > 0) { var fx = h.x - h.pauraX, fy = h.y - h.pauraY, fl = Math.sqrt(fx * fx + fy * fy) || 1; mx = fx / fl; my = fy / fl; ml = 1; }
        if (h.stun > 0 || h.radiceT > 0) { mx = 0; my = 0; ml = 0; }
        var vel = h.cavT > 0 ? h.d.corazza.vel : h.d.vel;
        if (h.slowT > 0) vel *= 1 - h.slowF;
        if (h.trasT > 0) vel *= h.d.sup.vel || 1;
        if (h.freT > 0) vel *= 1.35;
        if (h.immT > 0) vel *= 1.7;
        if (h.prepT > 0) vel *= 0.35;
        if (h.muroT > 0) vel *= (h.d.gad && h.d.gad.lento) || 0.5;
        // accelerazione breve: subito il 48% della velocità, quasi piena in 3 passi (100 ms); si frena più svelti
        var acc = 1;   // scattante: piena velocita' al primo passo, ferma subito (convenzione del genere, 30/10)
        h.vx += (mx * vel - h.vx) * acc; h.vy += (my * vel - h.vy) * acc;
        if (Math.abs(h.vx) < 0.02) h.vx = 0; if (Math.abs(h.vy) < 0.02) h.vy = 0;
        muovi(st, h, (h.vx + h.kx) * DT, (h.vy + h.ky) * DT);
        h.kx *= 0.82; h.ky *= 0.82;
        if (Math.abs(h.kx) < 0.05) h.kx = 0;
        if (Math.abs(h.ky) < 0.05) h.ky = 0;
        cordoni(st, h);
        if (ml > 0.1) { h.mosso = 1; if (Math.abs(mx) > 0.15 && st.t - h.tAtt > 8) h.fac = mx > 0 ? 1 : -1; if (st.t - h.tAtt > 8) h.aim = Math.atan2(my, mx); }
      }
      h.nasc = tile(st, Math.floor(h.x), Math.floor(h.y)) === CESP;

      // --- immersione: riemerge a contatto o a tempo scaduto ---
      if (h.immT > 0) {
        h.immT -= DT;
        var tocca = false;
        for (j = 0; j < st.eroi.length; j++) { var t = st.eroi[j]; if (t.vivo && t.sq !== h.sq && !intoccabile(t) && (t.x - h.x) * (t.x - h.x) + (t.y - h.y) * (t.y - h.y) < 0.85) tocca = true; }
        if (tocca || h.immT <= 0) {
          h.immT = 0;
          var so = h.d.sup;
          colpoArea(st, h, h.sq, h.x, h.y, so.area, so.danno * h.k, F_SUP, 1, 0.5, 0, 0);
          ev(st, 'riemerge', h.x, h.y, h.i, so.area, 0, 0);
        }
      }

      // --- frenesia: i feriti vicini restano scoperti ---
      if (h.freT > 0) for (j = 0; j < st.eroi.length; j++) {
        var w = st.eroi[j];
        if (w.vivo && w.sq !== h.sq && w.vita / w.vmax < 0.5 && (w.x - h.x) * (w.x - h.x) + (w.y - h.y) * (w.y - h.y) < 64) w.rivT = Math.max(w.rivT, 0.2);
      }
      // --- fortezza: chi gli sta vicino rallenta ---
      if (h.fortT > 0) for (j = 0; j < st.eroi.length; j++) {
        var nn = st.eroi[j], so2 = h.d.sup;
        if (nn.vivo && nn.sq !== h.sq && (nn.x - h.x) * (nn.x - h.x) + (nn.y - h.y) * (nn.y - h.y) < so2.raggio * so2.raggio) { nn.slowF = Math.max(nn.slowT > 0 ? nn.slowF : 0, so2.sl); nn.slowT = Math.max(nn.slowT, 0.2); }
      }

      // --- preparazione in corso: alla fine parte super o gadget ---
      if (h.prepT > 0 && (h.stun > 0 || h.pauraT > 0)) h.prepT = 0;
      if (h.prepT > 0) {
        h.prepT -= DT;
        if (h.prepT <= 0) {
          if (h.prepCosa === 1) { h.sup = 0; h.supPronta = false; superAttacco(st, h, h.prepX, h.prepY); }
          else gadget(st, h, h.prepX, h.prepY);
        }
      }

      // --- comandi: attacco, super, gadget ---
      var libero = h.stun <= 0 && h.salT <= 0 && h.dashD <= 0 && h.tirT <= 0 && h.pauraT <= 0 && h.immT <= 0 && h.prepT <= 0 && h.ventN <= 0 && h.cecT <= 0;
      if (libero && inp.sup && h.sup >= 1) avviaPrep(st, h, 1, inp.sx, inp.sy, h.d.sup.prep || 0.25);
      else if (libero && inp.gad && h.gadUsi > 0 && h.gadCd <= 0) avviaPrep(st, h, 2, inp.gx, inp.gy, (h.cavT > 0 && h.d.gad.balzo ? h.d.gad.balzo.prep : h.d.gad.prep) || 0.12);   // 23/11: da Cavaliere l'accovacciata del balzo
      else if (libero && inp.att && h.ammo >= 1 && h.cd <= 0 && h.seqN === 0 && h.muroT <= 0) attacca(st, h, inp.ax, inp.ay);
      inp.att = 0; inp.sup = 0; inp.gad = 0;
      if (h.seqN > 0) aggiornaSequenza(st, h);
      if (h.cecT > 0) { h.cecT -= DT; if (h.cecT <= 0) raggioCecchino(st, h); }
      if (h.dropN > 0) {
        h.dropT -= DT;
        if (h.dropT <= 0) {
          var dr = h.d.sup, ultimo = h.dropN === 1;
          colpoArea(st, h, h.sq, h.x, h.y, dr.raggio * (ultimo ? 1.15 : 1), dr.danno * h.k * (ultimo ? dr.drop : 1), F_SUP, ultimo ? 1.7 : 0.35, ultimo ? 0.3 : 0, 0, 0);
          ev(st, 'dropOnda', h.x, h.y, h.i, dr.raggio * (ultimo ? 1.15 : 1), h.dropI, ultimo ? 1 : 0);
          h.dropI++; h.dropN--; h.dropT += dr.passo;
        }
      }
      if (h.orbT > 0) pizzeAttorno(st, h);
      if (h.ventN > 0) {
        h.ventT -= DT;
        while (h.ventT <= 0 && h.ventN > 0) {
          var vo = h.d.sup, fr = vo.n > 1 ? h.ventI / (vo.n - 1) - 0.5 : 0, va = h.ventA + fr * vo.ango * Math.PI / 180;
          var vp = spara(st, h, va, vo, 0, F_SUP, vo.danno, 'ventaglio_oro'); if (vp) { vp.rimb = 1; vp.pierce = 1; vp.oro = 1; vp.r = 0.18; }
          ev(st, 'sparo', h.x, h.y, h.i, va, 1, 0);
          h.ventT += vo.inter; h.ventI++; h.ventN--;
        }
      }

      // rigenerazione
      h.regT += DT;
      if (h.regT > 3 && h.vita < h.vmax && !fuoriGas(st, h) && st.t - h.tAtt > 3 * TICK && h.sangueT <= 0) {
        if (((st.t - h.tSpawn) % TICK) === 0) cura(st, h, Math.min(h.vmax * 0.1, 520), null);
      }
    }

    aggiornaProiettili(st);
    aggiornaZone(st);
    aggiornaTorrette(st);
    calcolaVisibilita(st);
    aggiornaGas(st, tempo);
    if (st.modo === 'gemme') aggiornaGemme(st);
    if (st.modo === 'sopravvivenza') aggiornaCubi(st);
    regole(st, tempo);
  }

  function avviaPrep(st, h, cosa, x, y, durata) {
    h.prepT = h.prepTT = durata; h.prepCosa = cosa; h.prepX = x; h.prepY = y;
    var l = Math.sqrt(x * x + y * y);
    if (l > 0.05) guarda(h, Math.atan2(y, x));
    ev(st, 'prep', h.x, h.y, h.i, cosa, durata, h.aim);
  }

  // colpi in sequenza (tamburo del Don, seconda zampata del Lupo)
  var FILA3 = !(typeof location !== 'undefined' && /[?&]bot=ventaglio(&|$)/.test(location.search));
  function aggiornaSequenza(st, h) {
    var a = h.d.att;
    h.seqT -= DT;
    while (h.seqT <= 0 && h.seqN > 0) {
      if (a.tipo === 'tamburo') {
        // la rosa si allarga colpo dopo colpo; l'ultimo spinge
        var k = h.seqI / (a.n - 1), dev = (rnd(st) - 0.5) * (2 + 12 * k) * Math.PI / 180;
        var p = spara(st, h, h.seqA + dev, a, 0, 0, a.danno);
        if (p && h.seqN === 1) { p.spin = 0.6; p.r = 0.17; }
        ev(st, 'sparo', h.x, h.y, h.i, h.seqA + dev, 1, 0);
        h.seqT += a.inter; h.seqI++;
      } else if (a.tipo === 'slot') {
        // gettoni in fila: col tris più forti, col 777 l'ultimo è il jackpot che perfora
        var kk = h.seqK || 0, mul = kk === 2 ? 1.25 : kk === 1 ? 1.1 : 1;
        var jack = kk === 3;   // 777: tutti e 3 i gettoni potenziati (x2) e perforanti (proprietario 21/11)
        var pg = spara(st, h, h.seqA, a, 0, 0, a.danno * 0.75 * (jack ? 2 : mul), 'slot');
        if (pg) { pg.num = h.seqS ? h.seqS[h.seqI] : 0; if (jack) { pg.pierce = 1; pg.r = 0.32; pg.num = 7; } }
        if (h.seqI > 0) ev(st, 'sparo', h.x, h.y, h.i, h.seqA, 1, 0);
        h.seqT += a.inter || 0.11; h.seqI++;
      } else if (a.tipo === 'doppio_rombo') {
        // secondo affondo del Fante: chi prende tutti e due si ritrova il rombo rosso sopra
        if (h.cavT <= 0) {
          st._cm = []; mischia(st, h, h.seqA, a.gitt, a.ango, a.danno * h.k, 0, 'rombo');
          for (var ri = 0; ri < st._cm.length; ri++) { var rt = st.eroi[st._cm[ri]]; if (rt.vivo && (h.rombo1 & (1 << rt.i))) { rt.romboT = a.rombo; rt.romboDa = h.i; ev(st, 'romboRosso', rt.x, rt.y, rt.i, h.i, a.rombo, 0); } }
          st._cm = null;
        }
        h.seqT += 1;
      } else if (a.tipo === 'doppio_artiglio') {
        mischia(st, h, h.seqA, a.gitt, a.ango, a.danno * 1.1 * h.k, 0, 'artiglio2');
        h.seqT += 1;
      }
      h.seqN--;
    }
    if (h.seqN < 0) h.seqN = 0;   // 22/11: una spinta (o la trasformazione) durante la sequenza non lascia il contatore a -1
  }

  // scatti: azzannata (Pinna), carica dell'oplita (Agamennone)
  function aggiornaScatto(st, h) {
    var px = h.x, py = h.y, j;
    muovi(st, h, h.dvx * DT, h.dvy * DT);
    var vs = Math.sqrt(h.dvx * h.dvx + h.dvy * h.dvy) || 1;
    var c = Math.floor(h.x + h.dvx / vs * 0.5), r = Math.floor(h.y + h.dvy / vs * 0.5);
    if ((h.dashTipo === 'oplita' || h.dashTipo === 'lampo') && tile(st, c, r) === CASSA) danneggiaCassa(st, c, r, h.dashTipo === 'lampo' ? h.d.att.danno * h.k : 1500, h);
    var mv = Math.sqrt((h.x - px) * (h.x - px) + (h.y - py) * (h.y - py));
    h.dashD -= vs * DT;
    if (mv < vs * DT * 0.3) h.dashD = 0;
    h.mosso = 1;
    if (h.dashTipo === 'oplita') {
      for (j = 0; j < st.eroi.length; j++) {
        var t = st.eroi[j];
        if (!t.vivo || t.sq === h.sq || (h.dmask & (1 << j)) || intoccabile(t)) continue;
        var dx = t.x - h.x, dy = t.y - h.y;
        if (dx * dx + dy * dy > (R * 2 + 0.2) * (R * 2 + 0.2)) continue;
        h.dmask |= 1 << j;
        danneggia(st, h, t, (h.dashDan || 300) * h.k, F_ZONA, t.x, t.y);
        if (t.vivo) { spingi(t, h.dvx / vs, h.dvy / vs, h.dashSp || 1); if (h.dashStun && t.stun < h.dashStun) t.stun = h.dashStun; }
        ev(st, 'impatto', t.x, t.y, h.i, 0, 0, 0);
      }
    }
    if (h.dashTipo === 'lampo') {
      // il taglio passa attraverso: colpisce una volta chi sta lungo la strada (anche fra la posizione di prima e quella di ora)
      var la = h.d.att, rr = R + la.largo;
      for (j = 0; j < st.eroi.length; j++) {
        var u = st.eroi[j];
        if (!u.vivo || u.sq === h.sq || (h.dmask & (1 << j)) || intoccabile(u)) continue;
        var sx = h.x - px, sy = h.y - py, sl = sx * sx + sy * sy, f = sl > 0 ? Math.max(0, Math.min(1, ((u.x - px) * sx + (u.y - py) * sy) / sl)) : 0;
        var ex = u.x - (px + sx * f), ey = u.y - (py + sy * f);
        if (ex * ex + ey * ey > rr * rr) continue;
        h.dmask |= 1 << j;
        var fatto = danneggia(st, h, u, la.danno * h.k * h.lampoF, 0, u.x, u.y);
        if (fatto) ev(st, 'tagliato', u.x, u.y, h.i, Math.atan2(h.dvy, h.dvx), h.lampoF > 1.45 ? 1 : 0, u.i);
      }
      for (j = 0; j < MAXT; j++) {
        var tq = st.tu[j];
        if (!tq.vivo || tq.sq === h.sq || !bersaglioTu(tq) || (tq.colT >= h.tAtt)) continue;
        if ((tq.x - h.x) * (tq.x - h.x) + (tq.y - h.y) * (tq.y - h.y) < (rr + 0.1) * (rr + 0.1)) danneggiaTorretta(st, h, tq, la.danno * h.k);
      }
    }
    if (h.dashTipo === 'asso') {   // 22/11 Asso: insegue il marcato e lo trafigge al contatto
      var am = st.eroi[h.mancaB], so3 = h.d.sup;
      if (am && am.vivo && !intoccabile(am)) {
        var amx = am.x - h.x, amy = am.y - h.y, amd = Math.sqrt(amx * amx + amy * amy) || 1;
        if (amd < R * 2 + 0.35) {
          var ese = am.vita / am.vmax < so3.esegui;
          danneggia(st, h, am, so3.colpo * h.k * (ese ? 2 : 1), F_SUP, am.x, am.y);
          ev(st, 'trafitto', am.x, am.y, h.i, am.i, Math.atan2(h.dvy, h.dvx), ese ? 1 : 0);
          am.marcaT = 0; h.dashD = 0;
        } else { h.dvx = amx / amd * so3.v; h.dvy = amy / amd * so3.v; }
      }
    }
    if (h.dashTipo === 'rombo') {   // 22/11 Fante: passa sui nemici col rombo rosso e lo fa scoppiare
      for (j = 0; j < st.eroi.length; j++) {
        var rv = st.eroi[j];
        if (!rv.vivo || rv.sq === h.sq || (h.dmask & (1 << j)) || intoccabile(rv)) continue;
        var rvx = rv.x - h.x, rvy = rv.y - h.y;
        if (rvx * rvx + rvy * rvy > (R * 2 + 0.2) * (R * 2 + 0.2)) continue;
        h.dmask |= 1 << j;
        if (rv.romboT > 0 && rv.romboDa === h.i) { rv.romboT = 0; danneggia(st, h, rv, h.d.gad.scoppio * h.k, F_ZONA, rv.x, rv.y); ev(st, 'romboScoppia', rv.x, rv.y, h.i, rv.i, 0, 0); if (h.cavT <= 0) caricaCorazza(st, h, 1); }
      }
    }
    if (h.dashTipo === 'presa') {
      // fuori dal locale: il primo che tocca viene afferrato e scaraventato
      for (j = 0; j < st.eroi.length; j++) {
        var w = st.eroi[j];
        if (!w.vivo || w.sq === h.sq || intoccabile(w) || w.salT > 0) continue;
        var wx = w.x - h.x, wy = w.y - h.y;
        if (wx * wx + wy * wy > (R * 2 + 0.25) * (R * 2 + 0.25)) continue;
        afferra(st, h, w, Math.atan2(h.dvy, h.dvx));
        h.dashD = 0;
        break;
      }
    }
    if (h.dashD <= 0) {
      h.dashD = 0;
      if (h.dashTipo === 'azzannata') { var a = h.d.att; mischia(st, h, Math.atan2(h.dvy, h.dvx), a.gitt, a.ango, a.danno * h.k, 0, 'morso'); }
      ev(st, 'fineScatto', h.x, h.y, h.i, 0, 0, 0);
      h.dashTipo = '';
    }
  }

  // il buttafuori afferra e scaraventa: volo basso e lungo (non lo colpisce nessuno mentre vola), muro = più danni
  function afferra(st, h, w, ang) {
    var o = h.d.sup, c = Math.cos(ang), s = Math.sin(ang), L, x = w.x, y = w.y, muro = false;
    ev(st, 'presa', w.x, w.y, h.i, w.i, ang, 0);
    danneggia(st, h, w, o.danno * h.k, F_SUP, w.x, w.y);
    if (!w.vivo) return;
    if (w.falT > 0 || w.fortT > 0 || w.cavT > 0) { w.stun = Math.max(w.stun, o.stun * 0.5); return; }   // inamovibili: solo storditi
    for (L = 0.2; L <= o.lancio; L += 0.2) {
      var nx = w.x + c * L, ny = w.y + s * L;
      if (bloccaPasso(st, Math.floor(nx + c * R), Math.floor(ny + s * R))) { muro = true; break; }
      x = nx; y = ny;
    }
    w.salT = w.salTT = 0.2 + 0.07 * Math.max(1, L); w.salSx = w.x; w.salSy = w.y; w.salTx = x; w.salTy = y; w.salTipo = muro ? 'sbattuto' : 'lanciato'; w.salDa = h.i;
    w.seqN = 0; w.dashD = 0; w.prepT = 0; w.tirT = 0; w.kx = w.ky = 0;
    ev(st, 'scaraventa', w.x, w.y, h.i, x, y, muro ? 1 : 0);
  }
  // atterraggio di un volo: balzo del lupo, capriola dell'arciere o eroe scaraventato
  function atterra(st, h) {
    var tipo = h.salTipo; h.salTipo = '';
    if (tipo === 'capriola') {
      var fa = spara(st, h, h.capA, h.d.att, 0, 0, h.d.att.danno * h.d.gad.forza, 'freccia_lunga');
      if (fa) { fa.dist = h.d.att.gitt; }      // tirata da ferma: vale gia' come una freccia tesa
      guarda(h, h.capA); h.tAtt = st.t;
      ev(st, 'frecciaCapriola', h.x, h.y, h.i, h.capA, 0, 0);
    } else if (tipo === 'balzo') {
      var g = h.d.gad;
      ev(st, 'atterraLupo', h.x, h.y, h.i, g.area, 0, 0);
      for (var i = 0; i < st.eroi.length; i++) {
        var t = st.eroi[i];
        if (!t.vivo || t.sq === h.sq) continue;
        var dx = t.x - h.x, dy = t.y - h.y;
        if (dx * dx + dy * dy > (g.area + R * 0.6) * (g.area + R * 0.6)) continue;
        if (danneggia(st, h, t, g.danno * h.k, F_ZONA, t.x, t.y) && t.vivo) { t.sangueT = 2; t.sangueDps = h.d.att.sangue * h.k; t.sangueDa = h.i; var d = Math.sqrt(dx * dx + dy * dy) || 1; spingi(t, dx / d, dy / d, 0.5); }
      }
    } else if (tipo === 'balzoCav') {   // 23/11 schianto del Cavaliere: area piccola, danno, spinta forte verso l'esterno, breve stordimento
      var bz = h.d.gad.balzo;
      colpoArea(st, h, h.sq, h.x, h.y, bz.area, bz.danno * h.k, F_ZONA, bz.spinta, bz.stun, 0, 0);
      ev(st, 'schiantoCav', h.x, h.y, h.i, bz.area, h.aim, 0);
    } else if (tipo === 'lanciato' || tipo === 'sbattuto') {
      var src = h.salDa >= 0 ? st.eroi[h.salDa] : null, o = src ? src.d.sup : null;
      if (h.stun < (o ? o.stun : 0.6)) h.stun = o ? o.stun : 0.6;
      ev(st, 'atterraLancio', h.x, h.y, h.i, tipo === 'sbattuto' ? 1 : 0, 0, 0);
      if (tipo === 'sbattuto' && src && o) danneggia(st, src, h, o.muro * src.k, F_SUP, h.x, h.y);
    }
  }

  // cordone di velluto: segmento davanti al buttafuori; i nemici ci rimbalzano, gli amici passano
  function cordoni(st, h) {
    var urto = false;
    for (var i = 0; i < MAXT; i++) {
      var tu = st.tu[i];
      if (!tu.vivo || (tu.tipo !== TU_CORDONE && tu.tipo !== TU_SIEPE) || tu.sq === h.sq) continue;
      var px = -Math.sin(tu.ang), py = Math.cos(tu.ang), dx = h.x - tu.x, dy = h.y - tu.y;
      var l = Math.max(-tu.area, Math.min(tu.area, dx * px + dy * py)), qx = tu.x + px * l, qy = tu.y + py * l;
      var ex = h.x - qx, ey = h.y - qy, d2 = ex * ex + ey * ey, rr = R + (tu.tipo === TU_SIEPE ? 0.24 : 0.16);
      if (tu.tipo === TU_SIEPE) {   // 22/11 Dama: la siepe non fa rimbalzare, ferma; e punge chi la tocca (una puntura ogni 0,5 s)
        if (d2 >= rr * rr) continue;
        var ds = Math.sqrt(d2), sx3, sy3;
        if (ds > 1e-4) { sx3 = ex / ds; sy3 = ey / ds; } else { sx3 = Math.cos(tu.ang); sy3 = Math.sin(tu.ang); if ((h.ox - tu.x) * sx3 + (h.oy - tu.y) * sy3 < 0) { sx3 = -sx3; sy3 = -sy3; } }
        h.x = qx + sx3 * rr; h.y = qy + sy3 * rr; risolvi(st, h); h.kx *= 0.3; h.ky *= 0.3;
        if (h.rovoT <= 0 && !intoccabile(h)) { h.rovoT = 0.5; ev(st, 'siepePunge', h.x, h.y, h.i, Math.atan2(sy3, sx3), tu.ow, 0); danneggia(st, st.eroi[tu.ow], h, tu.danno, F_ZONA, h.x, h.y); }
        urto = true; continue;
      }
      if (d2 >= rr * rr) continue;
      var d = Math.sqrt(d2), nx, ny;
      if (d > 1e-4) { nx = ex / d; ny = ey / d; } else { nx = Math.cos(tu.ang); ny = Math.sin(tu.ang); if (h.ox - tu.x < 0 === nx > 0) { nx = -nx; ny = -ny; } }
      h.x = qx + nx * rr; h.y = qy + ny * rr; risolvi(st, h);
      h.kx = nx * 4.5; h.ky = ny * 4.5; h.vx *= 0.2; h.vy *= 0.2;
      if (st.t - tu.colT > 6) { tu.colT = st.t; ev(st, 'rimbalzoCordone', h.x, h.y, h.i, Math.atan2(ny, nx), tu.ow, 0); }
      urto = true;
    }
    return urto;
  }

  function aggiornaZone(st) {
    for (var i = 0; i < MAXZ; i++) {
      var z = st.zo[i];
      if (!z.vivo) continue;
      var zt0 = z.t;   // 22/11: tempo di prima (con z.t - DT l'arrotondamento a volte saltava il tick dei 0,5 s)
      z.t += DT;
      var src = st.eroi[z.ow];
      if (z.ab === 'pioggia') { pioggiaCuori(st, z, src); if (z.t >= z.T) z.vivo = 0; continue; }   // 22/11 Regina
      if (z.tipo === Z_SCOPPIO && (z.ab === 'pizza2' || z.ab === 'sigillo')) {
        if (z.t >= z.T) {
          if (z.ab === 'pizza2') { colpoArea(st, src, z.sq, z.x, z.y, z.r, z.val, 0, 0.25, 0, 0, 0); ev(st, 'pizzaGira', z.x, z.y, z.r, z.ow, 0, 0); }
          else { colpoArea(st, src, z.sq, z.x, z.y, z.r, z.val, F_SUP, 0.6, 0.35, 0, 0); ev(st, 'colonnaCristallo', z.x, z.y, z.r, z.ow, 0, 0); }
          z.vivo = 0;
        }
        continue;
      }
      if (z.tipo === Z_SCOPPIO && z.ab.charAt(0) === 's' && z.ab.length === 6) {
        // tre fendenti 777 (sette1..sette3)
        if (z.t >= z.T) {
          var n7 = +z.ab.charAt(5), so = src.d.sup;
          colpoArea(st, src, z.sq, z.x, z.y, z.r, z.val, F_SUP, n7 === 3 ? 0.9 : 0.35, n7 === 3 ? so.stun : 0, 0, 0);
          ev(st, 'sette', z.x, z.y, z.r, z.ow, n7, 0);
          z.vivo = 0;
        }
        continue;
      }
      if (z.tipo === Z_SCOPPIO) {
        if (z.t >= z.T) {
          colpoArea(st, src, z.sq, z.x, z.y, z.r, z.val, z.ab === 'dado6' ? 0 : 0, z.ab === 'pila_crollo' ? 0.6 : 1, 0, 0, 0);
          ev(st, 'esplo', z.x, z.y, z.r, z.ow, z.ab === 'pila_crollo' ? 4 : 2, 0);
          z.vivo = 0;
        }
        continue;
      }
      if (Math.floor(z.t * 2) !== Math.floor(zt0 * 2)) {
        for (var j = 0; j < st.eroi.length; j++) {
          var h = st.eroi[j];
          if (!h.vivo) continue;
          var dx = h.x - z.x, dy = h.y - z.y;
          if (dx * dx + dy * dy > (z.r + R * 0.5) * (z.r + R * 0.5)) continue;
          if (z.tipo === Z_CURA && h.sq === z.sq) cura(st, h, z.val * 0.5, src);
          if (z.tipo === Z_MALE && h.sq !== z.sq) { danneggia(st, src, h, z.val * 0.5, F_SUP | F_ZONA, h.x, h.y); if (h.vivo && z.sl) { h.slowF = z.sl; h.slowT = 0.6; } }
          if (z.tipo === Z_FUMO && h.sq !== z.sq && z.sl) { h.slowF = z.sl; h.slowT = 0.6; }
        }
      }
      if (z.t >= z.T) z.vivo = 0;
    }
  }

  function aggiornaTorrette(st) {
    for (var i = 0; i < MAXT; i++) {
      var tu = st.tu[i];
      if (!tu.vivo) continue;
      tu.dur -= DT;
      var src = st.eroi[tu.ow];
      if (tu.dur <= 0) { fineTorretta(st, tu); continue; }
      if (tu.tipo === TU_MINA) {
        // carta coperta: si arma, poi scoppia sotto il primo nemico che la calpesta
        if (tu.arm > 0) { tu.arm -= DT; if (tu.arm <= 0) ev(st, 'cartaArmata', tu.x, tu.y, tu.ow, 0, 0, 0); continue; }
        var gm = src.d.gad, sc = gm.scatta || 0.8;
        for (var mi = 0; mi < st.eroi.length; mi++) {
          var me2 = st.eroi[mi];
          if (!me2.vivo || me2.sq === tu.sq || intoccabile(me2) || me2.salT > 0) continue;
          if ((me2.x - tu.x) * (me2.x - tu.x) + (me2.y - tu.y) * (me2.y - tu.y) > sc * sc) continue;
          tu.vivo = 0;
          colpoArea(st, src, tu.sq, tu.x, tu.y, tu.area, tu.danno, F_ZONA, 0.5, 0, gm.sl, gm.slT);
          ev(st, 'cartaScoppia', tu.x, tu.y, tu.area, tu.ow, 0, 0);
          break;
        }
        continue;
      }
      if (tu.tipo === TU_FIORE) {
        // giardino trappola: dopo l'armo, il primo nemico che lo calpesta resta preso dalle radici (stordito) e prende il danno
        if (tu.arm > 0) { tu.arm -= DT; continue; }
        var gf = src.d.sup;
        for (var fj = 0; fj < st.eroi.length; fj++) {
          var vt = st.eroi[fj];
          if (!vt.vivo || vt.sq === tu.sq || intoccabile(vt) || vt.salT > 0) continue;
          if ((vt.x - tu.x) * (vt.x - tu.x) + (vt.y - tu.y) * (vt.y - tu.y) > (tu.area + R * 0.5) * (tu.area + R * 0.5)) continue;
          tu.vivo = 0;
          ev(st, 'fioreScatta', tu.x, tu.y, vt.i, tu.ow, tu.lato, 0);
          danneggia(st, src, vt, tu.danno, F_SUP | F_ZONA, tu.x, tu.y);
          if (vt.vivo && vt.falT <= 0 && vt.fortT <= 0) { if (vt.stun < gf.stun) vt.stun = gf.stun; if (vt.radiceT < gf.stun) vt.radiceT = gf.stun; vt.dashD = 0; vt.seqN = 0; vt.prepT = 0; }
          else if (vt.vivo && vt.stun < gf.stun * 0.5) vt.stun = gf.stun * 0.5;
          break;
        }
        continue;
      }
      if (tu.tipo === TU_SIEPE) continue;
      if (tu.tipo === TU_CASSA) {
        tu.cd -= DT;
        if (tu.cd <= 0) { tu.cd = src.d.gad.ogni; colpoArea(st, src, tu.sq, tu.x, tu.y, tu.area, tu.danno, F_ZONA, 0.3, 0, 0, 0); ev(st, 'cassaPulsa', tu.x, tu.y, tu.ow, tu.area, 0, 0); }
        continue;
      }
      if (tu.tipo === TU_LANCIA) {
        if (tu.arm > 0) { tu.arm -= DT; continue; }
        if (!src.vivo) { tu.vivo = 0; continue; }
        // 22/11: presa anche passandoci sopra di corsa o in scatto (distanza dal TRATTO percorso nel tick, non solo dal punto finale)
        var lx0 = src.ox === src.ox ? src.ox : src.x, ly0 = src.oy === src.oy ? src.oy : src.y, ldx = src.x - lx0, ldy = src.y - ly0, ll = ldx * ldx + ldy * ldy;
        var lk = ll > 1e-6 ? Math.max(0, Math.min(1, ((tu.x - lx0) * ldx + (tu.y - ly0) * ldy) / ll)) : 1, lpx = lx0 + ldx * lk - tu.x, lpy = ly0 + ldy * lk - tu.y;
        if (lpx * lpx + lpy * lpy < 0.6) {
          tu.vivo = 0;
          src.ammo = Math.min(3, src.ammo + 1);
          var la = src.d.att;
          ev(st, 'giroLancia', src.x, src.y, src.i, la.giro, 0, 0);
          src.giroT = 0.15;   // 22/11: il danno del giro arriva quando la punta della lancia passa (non nello stesso istante della presa)
        }
        continue;
      }
      if (tu.tipo === TU_BARILE || tu.tipo === TU_ESCA || tu.tipo === TU_CORDONE) continue;
      if (tu.tipo === TU_SCAGNOZZO) {
        // segue il boss ai fianchi
        if (!src.vivo) { fineTorretta(st, tu); continue; }
        var gx = src.x + tu.lato * 0.95, gy = src.y + 0.25, dx = gx - tu.x, dy = gy - tu.y, dl = Math.sqrt(dx * dx + dy * dy);
        if (dl > 0.05) { var v = Math.min(dl, 4.2 * DT), sxn = clampX(st, tu.x + dx / dl * v), syn = clampY(st, tu.y + dy / dl * v);
          if (!bloccaColpo(st, Math.floor(sxn), Math.floor(tu.y))) tu.x = sxn;      // [fable] non attraversa i muri (sparava da dentro)
          if (!bloccaColpo(st, Math.floor(tu.x), Math.floor(syn))) tu.y = syn; }
      }
      tu.cd -= DT;
      if (tu.cd > 0) continue;
      var best = null, bd = tu.gitt * tu.gitt;
      for (var k = 0; k < st.eroi.length; k++) {
        var e = st.eroi[k];
        if (!e.vivo || e.sq === tu.sq || !visibile(st, e, tu.sq)) continue;
        var ex = e.x - tu.x, ey = e.y - tu.y, d2 = ex * ex + ey * ey;
        if (d2 < bd && lineaLibera(st, tu.x, tu.y, e.x, e.y)) { bd = d2; best = e; }
      }
      if (!best) { tu.cd = 0.1; continue; }
      tu.cd = tu.cad;
      tu.ang = Math.atan2(best.y - tu.y, best.x - tu.x);
      var p = nuovoProiettile(st);
      if (!p) continue;
      p.vivo = 1; p.k = 0; p.ab = tu.tipo === TU_SCAGNOZZO ? 'famiglia' : 'slot_torretta'; p.ow = p.ow0 = tu.ow; p.a1 = 0; p.sq = tu.sq; p.eroe = tu.eroe;
      p.x = p.ox = tu.x + Math.cos(tu.ang) * 0.4; p.y = p.oy = tu.y + Math.sin(tu.ang) * 0.4;
      if (bloccaColpo(st, Math.floor(p.x), Math.floor(p.y))) { p.x = p.ox = tu.x; p.y = p.oy = tu.y; }
      p.vx = Math.cos(tu.ang) * tu.pv; p.vy = Math.sin(tu.ang) * tu.pv; p.ang = tu.ang;
      p.rest = tu.gitt + 0.5; p.r = 0.14; p.dan = tu.danno; p.pierce = 0; p.rimb = 0; p.mask = 0; p.passa = 0; p.oro = 0; p.rifl = 0;
      p.slF = 0; p.slT = 0; p.stun = 0; p.spin = 0; p.torna = 0; p.fl = F_TOR; p.sti = tu.tipo === TU_SCAGNOZZO ? 'proiettile' : 'gettone'; p.t = 0; p.z = 0; p.rompe = 0; p.fx = 0; p.num = 0; p.dist = 0; p.faccia = 0;
      ev(st, 'sparoTorretta', tu.x, tu.y, tu.ow, tu.ang, tu.tipo, 0);
    }
  }

  function fuoriGas(st, h) {
    var g = st.gas;
    return g.on && (h.x < g.x0 || h.x > g.x1 || h.y < g.y0 || h.y > g.y1);
  }

  function aggiornaGas(st, tempo) {
    var g = st.gas;
    if (!g.on) return;
    // 23/11: una mappa della sopravvivenza può avere il suo gas (mappe.js, campo gas: t0, dur, fin, d0, d1, piu); senza, come prima
    var GC = st.modo === 'sopravvivenza' && st.M.gas ? st.M.gas : null;
    var dur = GC ? GC.dur : st.modo === 'sopravvivenza' ? 95 : 30;
    var f = (tempo - g.t0) / dur; if (f < 0) f = 0; if (f > 1) f = 1;
    var e = f * f * (3 - 2 * f), cx = st.w / 2, cy = st.h / 2, fin = GC ? GC.fin : st.modo === 'sopravvivenza' ? 2.5 : 3;
    var hw = st.w / 2 + (fin - st.w / 2) * e, hh = st.h / 2 + (fin - st.h / 2) * e;
    if (tempo < g.t0) { hw = st.w / 2 + 1; hh = st.h / 2 + 1; }
    g.x0 = cx - hw; g.x1 = cx + hw; g.y0 = cy - hh; g.y1 = cy + hh;
    // 23/11 avvisi (solo eventi, nessuna regola): 0 → 5 s prima, 1 → parte, 2 → a metà si fa più forte, 3 → zona finale
    if (st.modo === 'sopravvivenza') {
      var fase = tempo < g.t0 - 5 ? 0 : tempo < g.t0 ? 1 : f < 0.5 ? 2 : f < 1 ? 3 : 4;
      if (fase > (g.fase | 0)) {
        if (fase === 1) ev(st, 'gasAvviso', 0, 0, Math.round(g.t0 - tempo), 0, 0, 0);
        else if (fase === 2) ev(st, 'gasVia', 0, 0, dur, 0, 0, 0);
        else if (fase === 3) ev(st, 'gasForte', 0, 0, 0, 0, 0, 0);
        else if (fase === 4) ev(st, 'gasFinale', 0, 0, 0, 0, 0, 0);
        g.fase = fase;
      }
    }
    if (st.t % (TICK / 2) !== 0) return;
    // danno ogni mezzo secondo: con il gas della mappa cresce mentre si stringe (d0 → d1) e poi di «piu» al secondo
    var dz = GC ? GC.d0 + (GC.d1 - GC.d0) * f + Math.max(0, tempo - g.t0 - dur) * GC.piu : 550 + Math.max(0, tempo - g.t0 - dur) * 40;
    for (var i = 0; i < st.eroi.length; i++) {
      var h = st.eroi[i];
      if (h.vivo && fuoriGas(st, h)) { h.prot = 0; h.immT = 0; danneggia(st, null, h, dz, F_ZONA, h.x, h.y); }
    }
  }

  function aggiornaGemme(st) {
    var i, j, M = st.M;
    if (!st.supp && M.gem && st.t * DT >= st.prossimaGemma) {
      st.prossimaGemma += OGNI_GEMMA;
      // GEMME 22/11: salta fuori dalla miniera e atterra a ~0,6 caselle dal centro (il salto lo disegna il render da g.t)
      var a = rnd(st) * Math.PI * 2;
      gemma(st, M.gem.x, M.gem.y, Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0);
      ev(st, 'gemmaNata', M.gem.x, M.gem.y, a, 0, 0, 0);
    }
    for (i = 0; i < MAXG; i++) {
      var g = st.ge[i];
      if (!g.vivo) continue;
      g.t += DT;
      if (g.vx || g.vy) {
        var nx = g.x + g.vx * DT, ny = g.y + g.vy * DT;
        if (liberoPasso(st, nx, g.y)) g.x = nx; else g.vx = -g.vx * 0.5;
        if (liberoPasso(st, g.x, ny)) g.y = ny; else g.vy = -g.vy * 0.5;
        g.vx *= 0.86; g.vy *= 0.86;
        if (g.vx * g.vx + g.vy * g.vy < 0.01) { g.vx = 0; g.vy = 0; }
      }
      if (g.t < 0.35) continue;
      for (j = 0; j < st.eroi.length; j++) {
        var h = st.eroi[j];
        if (!h.vivo || h.salT > 0 || h.immT > 0) continue;
        var dx = h.x - g.x, dy = h.y - g.y;
        if (dx * dx + dy * dy < 0.55) { g.vivo = 0; h.gem++; h.gemTot++; ev(st, 'gemmaPresa', g.x, g.y, h.i, h.gem, 0, 0); break; }
      }
    }
    st.gemSq[0] = 0; st.gemSq[1] = 0;
    for (j = 0; j < st.eroi.length; j++) if (st.eroi[j].vivo) st.gemSq[st.eroi[j].sq] += st.eroi[j].gem;
    // GEMME 22/11: il portatore principale di ogni squadra (a pari gemme resta quello di prima: niente sfarfallio)
    for (var q = 0; q < 2; q++) {
      var c = st.capo[q], cg = c >= 0 && st.eroi[c].vivo ? st.eroi[c].gem : 0;
      if (cg <= 0) c = -1;
      for (j = 0; j < st.eroi.length; j++) { var e = st.eroi[j]; if (e.sq === q && e.vivo && e.gem > cg) { c = j; cg = e.gem; } }
      st.capo[q] = c;
    }
  }

  function percVita(st, q) {
    var s = 0;
    for (var i = 0; i < st.eroi.length; i++) { var h = st.eroi[i]; if (h.sq === q && h.vivo) s += h.vita / h.vmax; }
    return s;
  }

  function avviaSupplementari(st, tempo) {
    st.supp = true; st.suppT = tempo;
    st.gas.on = true; st.gas.t0 = tempo;
    ev(st, 'supplementari', 0, 0, 0, 0, 0, 0);
  }

  function regole(st, tempo) {
    if (st.fine) return;
    var lim = LIMITE[st.modo];
    if (st.modo === 'gemme') {
      // GEMME 22/11 (regole del genere): conta chi ha ALMENO 10 gemme e PIU' dell'altra squadra.
      // Sotto 10 o pari: il conto si ferma e si azzera. Se passa all'altra squadra riparte da 15 per lei.
      var g0 = st.gemSq[0], g1 = st.gemSq[1], lead = -1, S = GEMME_VITTORIA;
      if (g0 >= S && g0 > g1) lead = 0; else if (g1 >= S && g1 > g0) lead = 1;
      if (lead !== st.conto.sq) {
        var era = st.conto.sq;
        st.conto.sq = lead; st.conto.t = lead >= 0 ? CONTO_GEMME : 0;
        // contoVia: a = squadra che conta, b = durata, c = squadra che contava prima (-1 nessuna: sorpasso se >= 0)
        // contoStop: a = -1, b = motivo (0 = scesa sotto 10, 1 = pareggio a 10 o piu'), c = squadra che contava
        if (lead >= 0) ev(st, 'contoVia', 0, 0, lead, CONTO_GEMME, era, 0);
        else ev(st, 'contoStop', 0, 0, -1, (g0 >= S && g0 === g1) ? 1 : 0, era, 0);
      }
      if (lead >= 0) {
        var prima = Math.ceil(st.conto.t);
        st.conto.t -= DT;
        if (Math.ceil(st.conto.t) !== prima) ev(st, 'contoTic', 0, 0, lead, Math.ceil(st.conto.t), 0, 0);
        if (st.conto.t <= 0) { st.fine = { vinc: lead, motivo: 'gemme' }; return; }
      }
      if (!st.supp && tempo >= lim && lead < 0) {
        if (g0 !== g1) { st.fine = { vinc: g0 > g1 ? 0 : 1, motivo: 'tempo_gemme' }; return; }
        avviaSupplementari(st, tempo);
      }
    } else if (st.modo === 'duello') {
      if (st.punti[0] >= 3 || st.punti[1] >= 3) { st.fine = { vinc: st.punti[0] === st.punti[1] ? -1 : (st.punti[0] > st.punti[1] ? 0 : 1), motivo: 'ko' }; return; }   // [fable] 3-3 nello stesso passo = pareggio (prima vinceva sempre il blu)
      if (!st.supp && tempo >= lim) {
        if (st.punti[0] !== st.punti[1]) { st.fine = { vinc: st.punti[0] > st.punti[1] ? 0 : 1, motivo: 'tempo_ko' }; return; }
        avviaSupplementari(st, tempo);
      }
    } else {
      var vivi = 0, ultimo = -1;
      for (var i = 0; i < st.eroi.length; i++) if (st.eroi[i].vivo) { vivi++; ultimo = st.eroi[i].sq; }
      if (vivi <= 1) { if (ultimo >= 0) st.ordine.push(ultimo); st.fine = { vinc: ultimo, motivo: 'ultimo' }; return; }
      if (tempo >= lim) {
        var best = -1, bv = -1;
        for (var k = 0; k < st.eroi.length; k++) { var h = st.eroi[k]; if (h.vivo && h.vita / h.vmax > bv) { bv = h.vita / h.vmax; best = h.sq; } }
        st.fine = { vinc: best, motivo: 'tempo_vita' }; return;
      }
    }
    if (st.supp && tempo >= st.suppT + SUPPL[st.modo]) {
      var p0 = percVita(st, 0), p1 = percVita(st, 1);
      st.fine = { vinc: p0 > p1 + 1e-6 ? 0 : (p1 > p0 + 1e-6 ? 1 : -1), motivo: 'supp_vita' };
    }
  }

  function tempoRimasto(st) {
    var t = st.t * DT;
    if (st.supp) return Math.max(0, st.suppT + SUPPL[st.modo] - t);
    return Math.max(0, LIMITE[st.modo] - t);
  }

  function impronta(st) {
    var s = st.t | 0;
    for (var i = 0; i < st.eroi.length; i++) {
      var h = st.eroi[i];
      s = (Math.imul(s, 31) + Math.round(h.x * 1000) + Math.round(h.y * 1000) * 7 + h.vita) | 0;
    }
    return s >>> 0;
  }

  var Motore = {
    TICK: TICK, DT: DT, R: R, MURO: MURO, CESP: CESP, CASSA: CASSA, TAVOLO: TAVOLO, VITA_CASSA: VITA_CASSA,
    VITA_G: VITA_G, MAXP: MAXP, MAXZ: MAXZ, MAXT: MAXT, MAXG: MAXG, F_SUP: F_SUP, LIMITE: LIMITE, TIPI: TIPI,
    TU_TORRETTA: TU_TORRETTA, TU_MINA: TU_MINA, TU_BARILE: TU_BARILE, TU_SCAGNOZZO: TU_SCAGNOZZO, TU_ESCA: TU_ESCA, TU_CORDONE: TU_CORDONE, TU_LANCIA: TU_LANCIA, TU_CASSA: TU_CASSA, TU_FIORE: TU_FIORE, TU_SIEPE: TU_SIEPE, MAXC: MAXC,
    Z_MALE: Z_MALE, Z_CURA: Z_CURA, Z_SCOPPIO: Z_SCOPPIO, Z_FUMO: Z_FUMO,
    GEMME_VITTORIA: GEMME_VITTORIA, CONTO_GEMME: CONTO_GEMME, OGNI_GEMMA: OGNI_GEMMA,
    crea: crea, passo: passo, tile: tile, bloccaPasso: bloccaPasso, bloccaColpo: bloccaColpo, lineaLibera: lineaLibera,
    visibile: visibile, fuoriGas: fuoriGas, tempoRimasto: tempoRimasto, rnd: rnd, impronta: impronta, intoccabile: intoccabile
  };
  root.Motore = Motore;
  if (typeof module !== 'undefined') module.exports = Motore;
})(typeof window !== 'undefined' ? window : globalThis);
