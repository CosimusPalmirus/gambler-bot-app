// GAMBLER BRAWL — bot. Scrivono solo st.inp[i] (come farebbe un dito): niente scorciatoie nel motore.
// Vedono solo quello che vede la loro squadra (i cespugli valgono anche per loro).
// Livelli: 1 facile, 2 medio, 3 difficile. Usano un generatore casuale proprio (st.ria),
// così il motore resta deterministico anche con i bot.
(function (root) {
  'use strict';
  var M = root.Motore || (typeof require !== 'undefined' ? require('./motore.js') : null);

  // goffo = probabilità di sprecare la super; vicino = quanto si espone (distanza ideale più corta)
  var LIV = {
    1: { react: 0.4, err: 0.18, lead: 0.45, dodge: 0.25, fuga: 0.15, cad: 0.4, sup: 0.45, pensa: 5, goffo: 0.18, vicino: 0.82, strafe: 0.7 },
    2: { react: 0.36, err: 0.2, lead: 0.5, dodge: 0.4, fuga: 0.28, cad: 0.3, sup: 0.8, pensa: 3, goffo: 0.1, vicino: 0.85, strafe: 0.8 },
    3: { react: 0.18, err: 0.075, lead: 0.92, dodge: 0.8, fuga: 0.36, cad: 0.05, sup: 1, pensa: 2, goffo: 0, vicino: 1, strafe: 1 },
    // "umano finto" per il banco: un principiante discreto al telefono (reazione lenta, mira imprecisa)
    4: { react: 0.38, err: 0.17, lead: 0.45, dodge: 0.3, fuga: 0.28, cad: 0.3, sup: 0.75, pensa: 3, goffo: 0.1, vicino: 0.9, strafe: 0.7 }
  };

  function rnd(st) {
    var t = (st.ria = (st.ria + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function gauss(st) { return (rnd(st) + rnd(st) + rnd(st) - 1.5) * 1.15; }

  function prepara(st, seme) {
    st.ria = ((seme || 1) * 2654435761) | 0 || 7;
    st.ia = [];
    var n = st.w * st.h;
    for (var i = 0; i < st.eroi.length; i++) {
      var h = st.eroi[i], lv = LIV[h.bot || 3] || LIV[3];
      st.ia.push({
        L: lv, liv: h.bot || 3, tgt: -1, vistoT: -99, goalC: -1, goalR: -1, dist: new Int16Array(n), coda: new Int16Array(n),
        pathT: -99, strafe: rnd(st) < 0.5 ? 1 : -1, strafeT: 0, schivaX: 0, schivaY: 0, schivaT: 0, prossimoSparo: 0,
        ultimoX: st.modo === 'sopravvivenza' ? h.x + (st.w / 2 - h.x) * 0.4 : st.w / 2, ultimoY: st.modo === 'sopravvivenza' ? h.y + (st.h / 2 - h.y) * 0.4 : st.h / 2, mx: 0, my: 0, attesa: 0
      });
    }
  }

  // campo delle distanze (BFS a 8 vicini senza tagliare gli angoli) verso la casella obiettivo
  function campo(st, m, gc, gr) {
    var w = st.w, h = st.h, d = m.dist, q = m.coda, i, head = 0, tail = 0;
    for (i = 0; i < d.length; i++) d[i] = 32000;
    if (gc < 0) gc = 0; if (gr < 0) gr = 0; if (gc >= w) gc = w - 1; if (gr >= h) gr = h - 1;
    d[gr * w + gc] = 0; q[tail++] = gr * w + gc;
    while (head < tail) {
      var k = q[head++], c = k % w, r = (k - c) / w, dv = d[k];
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        if (!dc && !dr) continue;
        var nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= w || nr >= h) continue;
        var nk = nr * w + nc;
        if (d[nk] <= dv + 1 || M.bloccaPasso(st, nc, nr)) continue;
        if (dc && dr && (M.bloccaPasso(st, c + dc, r) || M.bloccaPasso(st, c, r + dr))) continue;
        d[nk] = dv + 1;
        q[tail++] = nk;
      }
    }
    m.goalC = gc; m.goalR = gr; m.pathT = st.t;
  }

  // direzione lungo il campo, con scorciatoia in linea retta quando la strada è libera
  function versoObiettivo(st, h, m, gx, gy, out) {
    var gc = Math.floor(gx), gr = Math.floor(gy);
    if (gc !== m.goalC || gr !== m.goalR || st.t - m.pathT > 45) campo(st, m, gc, gr);
    var w = st.w, c = Math.floor(h.x), r = Math.floor(h.y);
    if (strada(st, h.x, h.y, gx, gy)) { out.x = gx - h.x; out.y = gy - h.y; return norm(out); }
    var best = m.dist[r * w + c], bc = c, br = r, neutro = st.modo === 'sopravvivenza', bt = -9, gdx = gx - h.x, gdy = gy - h.y;
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      var nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= w || nr >= st.h) continue;
      var v = m.dist[nr * w + nc];
      if (dc && dr && (M.bloccaPasso(st, c + dc, r) || M.bloccaPasso(st, c, r + dr))) continue;
      // 23/11 sopravvivenza: a pari distanza vince la casella più nella direzione dell'obiettivo (prima vinceva sempre la
      // prima provata, a nord-ovest: chi nasceva in basso ne aveva un piccolo vantaggio)
      // (a pari merito si tiene la casella scelta il passo prima: senza, davanti al pozzo si oscillava fra i due giri)
      var tt = neutro ? dc * gdx + dr * gdy + (nr * w + nc === m.passoK ? 100 : 0) : 0;
      if (v < best) { best = v; bc = nc; br = nr; bt = tt; }
      else if (neutro && v === best && v < m.dist[r * w + c] && tt > bt) { bt = tt; bc = nc; br = nr; }
    }
    if (neutro) m.passoK = br * w + bc;
    out.x = bc + 0.5 - h.x; out.y = br + 0.5 - h.y;
    return norm(out);
  }

  // corridoio largo quanto il corpo (per prendere scorciatoie)
  function strada(st, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 7) return false;
    var n = Math.ceil(d / 0.3), px = -dy / (d || 1) * 0.36, py = dx / (d || 1) * 0.36;
    for (var i = 1; i <= n; i++) {
      var f = i / n, x = x0 + dx * f, y = y0 + dy * f;
      if (M.bloccaPasso(st, Math.floor(x + px), Math.floor(y + py)) || M.bloccaPasso(st, Math.floor(x - px), Math.floor(y - py))) return false;
    }
    return true;
  }

  function norm(o) { var l = Math.sqrt(o.x * o.x + o.y * o.y); if (l > 1e-6) { o.x /= l; o.y /= l; } else { o.x = 0; o.y = 0; } return o; }

  // gira la direzione se davanti c'è un blocco
  function aggira(st, h, o) {
    if (!o.x && !o.y) return o;
    var tent = [0, 0.7, -0.7, 1.4, -1.4, 2.1, -2.1];
    var a0 = Math.atan2(o.y, o.x);
    for (var i = 0; i < tent.length; i++) {
      var a = a0 + tent[i], x = h.x + Math.cos(a) * 0.75, y = h.y + Math.sin(a) * 0.75;
      if (!M.bloccaPasso(st, Math.floor(x), Math.floor(y))) { o.x = Math.cos(a); o.y = Math.sin(a); return o; }
    }
    return o;
  }

  var _v = { x: 0, y: 0 }, _w = { x: 0, y: 0 };

  var MISCHIA = { affondo: 1, azzannata: 1, doppio_artiglio: 1, manata: 1, taglio_lampo: 1, stoccata: 1, doppio_rombo: 1 }, LANCIO = { dado: 1, pila_crollo: 1, pizza_rotante: 1, seme_rovo: 1 };   // 22/11: anche il seme della Dama va ad arco (sopra i muri, distanza a piacere)
  function gittataUtile(d) {
    var a = d.att;
    if (a.tipo === 'azzannata') return a.lunge + a.gitt;
    if (a.tipo === 'taglio_lampo') return a.gitt + 0.2;
    if (MISCHIA[a.tipo]) return a.gitt + 0.15;
    if (a.tipo === 'palla_rotolante') return a.gitt * 0.8;
    return a.gitt * 0.92;
  }
  function distanzaIdeale(d) {
    var a = d.att;
    if (a.tipo === 'taglio_lampo') return 2.2;    // si tiene a un passo e taglia attraverso
    if (a.tipo === 'stoccata') return 2.3;        // 22/11 Asso: sta in fondo alla lama (colpo di punta)
    if (MISCHIA[a.tipo]) return 0.6;
    return a.gitt * 0.72;
  }

  function pensa(st, i) {
    var h = st.eroi[i], m = st.ia[i], inp = st.inp[i], L = m.L, d = h.d, j;
    inp.att = 0; inp.sup = 0; inp.gad = 0;
    if (!h.vivo) { inp.mx = 0; inp.my = 0; m.tgt = -1; return; }
    var pensaOra = ((st.t + i) % L.pensa) === 0;

    // --- bersaglio: il nemico visibile più comodo ---
    if (pensaOra || m.tgt < 0) {
      var best = -1, bs = 1e9; m.vicD = 99; m.vicI = -1;   // 23/11: il nemico visibile più vicino (anche se non lo si attacca)
      for (j = 0; j < st.eroi.length; j++) {
        var e = st.eroi[j];
        if (!e.vivo || e.sq === h.sq || !M.visibile(st, e, h.sq)) continue;
        var dx = e.x - h.x, dy = e.y - h.y, dd = Math.sqrt(dx * dx + dy * dy);
        // sopravvivenza: si attacca solo chi è vicino, o chi ci ha appena colpito, o chi è più debole di noi
        if (st.modo === 'sopravvivenza') {
          var provocato = st.t - h.tCol < 60, piuDebole = e.vita / e.vmax < h.vita / h.vmax - 0.15;
          // 23/11: finché il gas è lontano (prima metà) si ingaggia solo da vicino: si pensa al bottino, le risse vengono dopo
          var calmo = calmaGas(st), vic = calmo ? 3 : zonaFinale(st) ? 99 : 4.5;   // zona finale: si attacca chiunque si veda
          if (dd < m.vicD) { m.vicD = dd; m.vicI = j; }
          if (dd > vic && !(provocato && dd < 8) && !(piuDebole && dd < (calmo ? 4.5 : 7))) continue;
        } else if (dd > 12) continue;
        var s = dd - (1 - e.vita / e.vmax) * 3 + (j === m.tgt ? -1 : 0);
        // [fable] come un giocatore vero: si punta chi porta le gemme quando gli avversari ne hanno tante (livelli 2-3)
        if (st.modo === 'gemme' && m.liv >= 2 && e.gem > 0 && st.gemSq[e.sq] >= 6) s -= Math.min(4, e.gem * (m.liv === 3 ? 0.7 : 0.4));
        // GEMME 22/11: il portatore principale nemico mentre il suo conto corre e' IL bersaglio
        if (st.modo === 'gemme' && m.liv >= 2 && st.capo && st.capo[e.sq] === j && st.conto.sq === e.sq) s -= 3;
        if (s < bs) { bs = s; best = j; }
      }
      if (best !== m.tgt) { m.tgt = best; if (best >= 0) m.vistoT = st.t; }
    }
    var T = m.tgt >= 0 ? st.eroi[m.tgt] : null;
    if (T && (!T.vivo || !M.visibile(st, T, h.sq))) { if (T.vivo) { m.ultimoX = T.x; m.ultimoY = T.y; } T = null; m.tgt = -1; }
    var tdx = 0, tdy = 0, tdist = 99;
    if (T) { tdx = T.x - h.x; tdy = T.y - h.y; tdist = Math.sqrt(tdx * tdx + tdy * tdy); m.ultimoX = T.x; m.ultimoY = T.y; }

    // --- obiettivo ---
    var hp = h.vita / h.vmax, basso = hp < (st.modo === 'sopravvivenza' ? L.fuga + 0.15 : L.fuga), gx, gy, casa = st.M.sp && st.modo !== 'sopravvivenza' ? st.M.sp[h.sq][h.slot % st.M.sp[h.sq].length] : null;
    if (st.modo === 'sopravvivenza' || !casa) casa = { x: st.w / 2, y: st.h / 2 };
    // 23/11 sopravvivenza: chi scappa va lontano dal nemico (dentro la zona sicura), non verso il centro dove si incontrano tutti
    if (st.modo === 'sopravvivenza' && T) { var fd = Math.sqrt((h.x - T.x) * (h.x - T.x) + (h.y - T.y) * (h.y - T.y)) || 1; casa = { x: h.x + (h.x - T.x) / fd * 5, y: h.y + (h.y - T.y) / fd * 5 }; }
    var combatti = !!T;
    // [fable] chi ha in tasca tante gemme non le rischia: si ritira prima (livelli 2-3)
    if (st.modo === 'gemme' && m.liv >= 2 && h.gem >= 4 && hp < (m.liv === 3 ? 0.6 : 0.5)) basso = true;
    if (basso && T && tdist < 7.5) { gx = casa.x; gy = casa.y; combatti = tdist < 3.2; }
    else if (st.modo === 'gemme') {
      var mia = st.gemSq[h.sq], loro = st.gemSq[1 - h.sq], SOG = M.GEMME_VITTORIA || 10;
      // GEMME 22/11 — ruoli come fra giocatori veri (livelli 2-3; il facile resta com'era):
      //  portatore: il capo della squadra con 3+ gemme quando siamo vicini alla soglia, o chiunque ne abbia 5+ → si ritira dietro
      //  gli altri: prima le gemme CADUTE (valgono di piu': sono tante e vicine), poi la caccia al portatore nemico, poi la miniera
      var capoNem = st.capo ? st.capo[1 - h.sq] : -1, CN = capoNem >= 0 ? st.eroi[capoNem] : null;
      if (CN && M.visibile(st, CN, h.sq)) { m.capoX = CN.x; m.capoY = CN.y; m.capoT = st.t; }
      var portatore = m.liv >= 2 && (h.gem >= 5 || (st.capo && st.capo[h.sq] === h.i && h.gem >= 3 && mia >= SOG - 3));
      if ((st.conto.sq === h.sq && h.gem > 0) || portatore) {
        // stiamo vincendo (o porto il tesoro): mi tengo indietro, verso casa; combatto solo chi mi viene addosso
        var arretra = st.conto.sq === h.sq || h.gem >= 7 ? 0.15 : 0.3;
        gx = casa.x + (st.w / 2 - casa.x) * arretra; gy = casa.y + (st.h / 2 - casa.y) * arretra;
        combatti = T && tdist < (portatore ? 4.5 : 6);
        // una gemma caduta proprio qui vicino si prende lo stesso
        for (j = 0; j < st.ge.length; j++) { var gv = st.ge[j]; if (gv.vivo && (gv.x - h.x) * (gv.x - h.x) + (gv.y - h.y) * (gv.y - h.y) < 2.2 * 2.2 && (!T || tdist > 3)) { gx = gv.x; gy = gv.y; break; } }
      } else {
        var gb = null, gd = 9, gs = 9;
        for (j = 0; j < st.ge.length; j++) {
          var g = st.ge[j];
          if (!g.vivo) continue;
          var ex = g.x - h.x, ey = g.y - h.y, ed = Math.sqrt(ex * ex + ey * ey);
          var sc = ed - (m.liv >= 2 && g.o === 1 ? 3 : 0);   // le cadute si vedono da piu' lontano (fino a 12 caselle)
          if (sc < gs) { gs = sc; gd = ed; gb = g; }
        }
        var caccia = m.liv >= 2 && CN && CN.gem >= 3 && (st.conto.sq === 1 - h.sq || loro >= SOG - 3) && m.capoT !== undefined && st.t - m.capoT < 4 * 30;
        if (gb && gb.o === 1 && m.liv >= 2 && (!T || tdist > 2.2 || gd < 1.5)) { gx = gb.x; gy = gb.y; combatti = T && tdist < 4.5; }
        else if (caccia && !(gb && gd < 2)) {
          // il portatore nemico: si va dove e' stato visto per l'ultima volta e lo si ingaggia appena si vede
          if (T && T.i === capoNem) { gx = T.x; gy = T.y; } else { gx = m.capoX; gy = m.capoY; combatti = T && tdist < 4; }
        }
        else if (gb && (!T || tdist > 3 || gd < 2)) { gx = gb.x; gy = gb.y; combatti = T && tdist < 5; }
        else if (T) { gx = T.x; gy = T.y; }
        else if (st.conto.sq === 1 - h.sq || (loro > mia && loro >= 6)) { gx = m.ultimoX; gy = m.ultimoY; }
        else { gx = st.M.gem.x + (h.slot - 1) * 2.2; gy = st.M.gem.y + (h.sq === 0 ? 2 : -2); }
      }
    } else {
      if (T) { gx = T.x; gy = T.y; }
      else if (st.modo === 'sopravvivenza' && m.evitaT > st.t && nelSicuro(st, m.evitaX, m.evitaY, 1.5)) { gx = m.evitaX; gy = m.evitaY; m.botK = 0; }
      else if (st.modo === 'sopravvivenza' && (calmaGas(st)) && m.vicD < 5 && m.vicI >= 0 && st.eroi[m.vicI].vivo &&
        nelSicuro(st, h.x + (h.x - st.eroi[m.vicI].x) / (m.vicD || 1) * 4, h.y + (h.y - st.eroi[m.vicI].y) / (m.vicD || 1) * 4, 2.5)) {
        // 23/11: finché il gas è lontano, un nemico visto a media distanza si lascia stare: ci si allontana per 1,5 s
        // verso un punto fisso (solo se c'è posto nella zona sicura; prima, senza impegno, i bot oscillavano sul posto)
        var ve = st.eroi[m.vicI], vd = m.vicD || 1; m.evitaX = h.x + (h.x - ve.x) / vd * 4; m.evitaY = h.y + (h.y - ve.y) / vd * 4; m.evitaT = st.t + 45;
        gx = m.evitaX; gy = m.evitaY; m.botK = 0;
      }
      else if (st.modo === 'sopravvivenza' && bottino(st, h, m)) { gx = m.botX; gy = m.botY; }   // 23/11: prima il bottino (cubi, casse) nella zona sicura
      else {
        gx = m.ultimoX; gy = m.ultimoY; var ux = gx - h.x, uy = gy - h.y;
        if (ux * ux + uy * uy < 2) {
          // 23/11 sopravvivenza: si gira nel proprio settore e si scende piano verso il centro (il gas fa il resto);
          // prima si puntava un punto a caso attorno al centro e ci si scontrava tutti dopo pochi secondi
          if (st.modo === 'sopravvivenza' && zonaFinale(st)) { m.ultimoX = (st.gas.x0 + st.gas.x1) / 2 + (rnd(st) - 0.5) * 2; m.ultimoY = (st.gas.y0 + st.gas.y1) / 2 + (rnd(st) - 0.5) * 2; }   // zona finale: si va a stanare al centro
          else if (st.modo === 'sopravvivenza') { var fx = h.x - st.w / 2, fy = h.y - st.h / 2; m.ultimoX = st.w / 2 + fx * 0.8 + (rnd(st) - 0.5) * 6; m.ultimoY = st.h / 2 + fy * 0.8 + (rnd(st) - 0.5) * 6; }
          else { m.ultimoX = st.w / 2 + (rnd(st) - 0.5) * 6; m.ultimoY = st.h / 2 + (rnd(st) - 0.5) * 6 * 1.3; }
        }
      }
    }
    if (T || st.modo !== 'sopravvivenza') m.botK = 0;
    // Agamennone: la lancia piantata vicino si va a riprendere (tacca subito + giro di lancia)
    if (d.att.tipo === 'lancia_scagliata' && h.ammo < 2) {
      for (j = 0; j < st.tu.length; j++) {
        var lu = st.tu[j];
        if (!lu.vivo || lu.tipo !== M.TU_LANCIA || lu.ow !== h.i) continue;
        var lx = lu.x - h.x, ly = lu.y - h.y;
        if (lx * lx + ly * ly < 4.5 * 4.5 && (!T || tdist > 2.2 || hp > 0.5)) { gx = lu.x; gy = lu.y; combatti = false; break; }
      }
    }
    // a distanza senza colpi o con uno da mischia addosso: arretra (come un giocatore vero che ricarica)
    var aDist = !MISCHIA[d.att.tipo];
    if (aDist && T && combatti && (h.ammo < 1 && tdist < gittataUtile(d) || MISCHIA[T.d.att.tipo] && tdist < 2.6)) {
      gx = h.x - tdx / (tdist || 1) * 3; gy = h.y - tdy / (tdist || 1) * 3; combatti = false; m.arretra = st.t + 12;
      // [fable] ricarica al RIPARO: se c'e' un muro vicino che copre dal bersaglio ci si mette dietro (medio e difficile)
      // solo contro chi tira da lontano (con uno da mischia addosso il riparo e' una trappola) e solo se la ricarica e' breve (se no si resta nascosti troppo)
      if (m.liv >= 2 && h.ammo < 1 && !MISCHIA[T.d.att.tipo] && d.att.ric <= 1.7) { var rp = riparo(st, h, T, m); if (rp) { gx = rp.x; gy = rp.y; } }
    }
    // [fable] zona nemica che fa male (maledizione, pizza che gira, sigilli): un giocatore ne esce subito
    // (chi combatte in mischia ci passa attraverso finche' sta bene: se no non arriverebbe mai al bersaglio)
    if (m.liv >= 2 && (!MISCHIA[d.att.tipo] || hp < 0.45)) {
      for (j = 0; j < st.zo.length; j++) {
        var zz = st.zo[j];
        if (!zz.vivo || zz.sq === h.sq || zz.tipo === M.Z_CURA || zz.tipo === M.Z_FUMO) continue;
        if (((j * 7 + h.i * 3 + Math.floor((zz.T || 0) * 100)) % 10) >= (m.liv === 3 ? 8 : 4)) continue;   // non sempre: il difficile la vede 8 volte su 10, il medio 4
        var zx = h.x - zz.x, zy = h.y - zz.y, zd = Math.sqrt(zx * zx + zy * zy), zr = (zz.r || 1) + 0.6;
        if (zd < zr) { if (zd < 0.05) { zx = h.x - (T ? T.x : st.w / 2); zy = h.y - (T ? T.y : st.h / 2); zd = Math.sqrt(zx * zx + zy * zy) || 1; } m.schivaX = zx / zd; m.schivaY = zy / zd; m.schivaT = st.t + 6; break; }
      }
    }
    // ferito e senza nemico addosso: si nasconde in un cespuglio vicino per rigenerarsi
    if (hp < 0.45 && !h.nasc && (!T || tdist > 4.5) && !(st.modo === 'sopravvivenza' && zonaFinale(st))) {   // 23/11: nella zona finale niente nascondino (si finiva al limite di tempo)
      var nb = cespuglioVicino(st, h);
      if (nb) { gx = nb.x; gy = nb.y; combatti = false; }
    }
    // mischia: si avvicina passando dai cespugli quando ce n'e' uno sulla strada (agguato)
    if (MISCHIA[d.att.tipo] && T && !h.nasc && tdist > gittataUtile(d) + 1 && tdist < 8 && !basso) {
      var cb = cespuglioVerso(st, h, T, tdist);
      if (cb) { gx = cb.x; gy = cb.y; combatti = false; }
    }
    // il gas: mai restarci dentro
    var gas = st.gas;
    if (gas.on) {
      var mx0 = gas.x0 + 1, mx1 = gas.x1 - 1, my0 = gas.y0 + 1, my1 = gas.y1 - 1;
      if (mx0 > mx1) { mx0 = mx1 = st.w / 2; } if (my0 > my1) { my0 = my1 = st.h / 2; }
      gx = Math.max(mx0, Math.min(mx1, gx)); gy = Math.max(my0, Math.min(my1, gy));
    }
    // 23/11: un obiettivo su una casella chiusa (muro, acqua, fuori campo) si sposta sulla libera più vicina: prima il bot
    // ci spingeva contro e restava fermo (la cassa da rompere resta il bersaglio: davanti ci si ferma da soli)
    if (st.modo === 'sopravvivenza' && !(m.botK === 2 && !T) && !(T && combatti)) liberoVicino(st, gx, gy, _w), gx = _w.x, gy = _w.y;

    // --- movimento ---
    var dir = _v;
    if (T && !(tdist > 1e-3)) { tdx = 0.001; tdy = 0; tdist = 0.001; }   // [fable] bersaglio esattamente addosso: niente 0/0 (il bot diventava NaN e spariva)
    if (combatti && T) {
      var ideale = distanzaIdeale(d) * (MISCHIA[d.att.tipo] ? 1 : L.vicino), mischia = !!MISCHIA[d.att.tipo];
      // distanza giusta: chi tira più lontano dell'avversario si tiene appena fuori dalla sua gittata (come un giocatore vero)
      if (!mischia) { var mia = gittataUtile(d), sua = gittataUtile(T.d); if (mia > sua + 1) ideale = Math.max(ideale, Math.min(mia - 0.6, sua + 0.9)); }
      var visuale = LANCIO[d.att.tipo] || M.lineaLibera(st, h.x, h.y, T.x, T.y);
      if (tdist > ideale + 0.9 || !visuale) versoObiettivo(st, h, m, T.x, T.y, dir);
      else if (tdist < ideale - 1.2 && !mischia) { dir.x = -tdx / tdist; dir.y = -tdy / tdist; aggira(st, h, dir); }
      else {
        if (st.t >= m.strafeT) { m.strafe = rnd(st) < 0.75 ? -m.strafe : m.strafe; m.strafeT = st.t + 9 + Math.floor(rnd(st) * 33); m.fermo = rnd(st) > L.strafe; m.avanti = (rnd(st) - 0.5) * 0.8; }
        dir.x = -tdy / tdist * m.strafe + tdx / tdist * (m.avanti || 0); dir.y = tdx / tdist * m.strafe + tdy / tdist * (m.avanti || 0);
        if (m.fermo) { dir.x = 0; dir.y = 0; }   // il principiante si pianta e si espone
        if (mischia) { dir.x = dir.x * 0.4 + tdx / tdist; dir.y = dir.y * 0.4 + tdy / tdist; norm(dir); }
        aggira(st, h, dir);
      }
      if (basso) { versoObiettivo(st, h, m, gx, gy, dir); }
    } else {
      var ox = gx - h.x, oy = gy - h.y;
      if (ox * ox + oy * oy < 0.5 || (m.botK === 2 && cassaATiro(st, h, m, d))) { dir.x = 0; dir.y = 0; }   // 23/11: davanti alla cassa ci si ferma e si tira
      else versoObiettivo(st, h, m, gx, gy, dir);
    }
    // schivata
    if (pensaOra) schiva(st, h, m, L);
    if (m.schivaT > st.t) { dir.x = dir.x * 0.35 + m.schivaX; dir.y = dir.y * 0.35 + m.schivaY; norm(dir); aggira(st, h, dir); }
    // un filo di inerzia, come un pollice vero
    if (!(dir.x === dir.x) || !(dir.y === dir.y)) { dir.x = 0; dir.y = 0; }
    if (!(m.mx === m.mx) || !(m.my === m.my)) { m.mx = 0; m.my = 0; }
    // [fable] incastrato (vuole muoversi ma da 0,8 s non si sposta): un passo di lato a caso e si ricalcola la strada
    if (st.t % 8 === 0) {
      var fermoDa = (m.px0 !== undefined) ? Math.abs(h.x - m.px0) + Math.abs(h.y - m.py0) : 9;
      if (fermoDa < 0.06 && (dir.x || dir.y) && h.stun <= 0 && h.radiceT <= 0 && h.prepT <= 0) m.blocco = (m.blocco || 0) + 1; else m.blocco = 0;
      m.px0 = h.x; m.py0 = h.y;
      if (m.blocco >= 3) { var ab = rnd(st) * 6.2832; m.schivaX = Math.cos(ab); m.schivaY = Math.sin(ab); m.schivaT = st.t + 10; m.pathT = -99; m.blocco = 0; }
    }
    m.mx += (dir.x - m.mx) * 0.5; m.my += (dir.y - m.my) * 0.5;
    inp.mx = m.mx; inp.my = m.my;

    if (h.prepT > 0) return;
    // --- parata: va presa al momento giusto, si guarda a ogni passo ---
    if (d.gad.tipo === 'parata' && h.gadUsi > 0 && h.gadCd <= 0 && minaccia(st, h) && rnd(st) < L.dodge * 0.55) { inp.gad = 1; inp.gx = 0; inp.gy = 0; return; }
    // --- super ---
    if (h.sup >= 1 && pensaOra && rnd(st) < L.sup * 0.5) {
      // ogni tanto la spreca: parte subito, dove capita
      if (L.goffo && rnd(st) < L.goffo * 0.15) { inp.sup = 1; inp.sx = Math.cos(h.aim); inp.sy = Math.sin(h.aim); return; }
      if (usaSuper(st, h, m, T, tdist, inp)) return;
    }
    // --- gadget ---
    if (h.gadUsi > 0 && h.gadCd <= 0 && pensaOra && rnd(st) < L.sup * 0.35) {
      if (usaGadget(st, h, m, T, tdist, inp)) return;
    }
    // 23/11 sopravvivenza: nessun nemico addosso e una cassa a tiro → la si rompe (i medi e i difficili tengono un colpo di scorta)
    if (!T && m.botK === 2 && h.cd <= 0 && h.seqN <= 0 && st.t >= m.prossimoSparo && h.ammo >= (m.liv >= 2 ? 1.5 : 1) && cassaATiro(st, h, m, d)) {
      var kc = m.botCassa, ccx = kc % st.w + 0.5, ccy = (kc - kc % st.w) / st.w + 0.5, bxx = ccx - h.x, byy = ccy - h.y, bdd = Math.sqrt(bxx * bxx + byy * byy) || 0.01;
      var fr = LANCIO[d.att.tipo] ? Math.max(0.1, Math.min(1, bdd / (d.att.gitt || 6))) : 1;
      inp.ax = bxx / bdd * fr; inp.ay = byy / bdd * fr; inp.att = 1;
      m.prossimoSparo = st.t + Math.round((L.cad + rnd(st) * L.cad) * 30);
      return;
    }
    // --- attacco ---
    if (!T || h.ammo < 1 || h.cd > 0 || h.seqN > 0) return;
    if (st.t - m.vistoT < L.react * 30) return;
    if (st.t < m.prossimoSparo) return;
    var gu = gittataUtile(d);
    if (tdist > gu + 0.3) return;
    var tipo = d.att.tipo;
    if (!LANCIO[tipo] && !M.lineaLibera(st, h.x, h.y, T.x, T.y)) return;
    // difficile: tiene l'ultima tacca se il bersaglio è al limite
    if (m.liv === 3 && h.ammo < 1.3 && tdist > gu * 0.85 && T.vita / T.vmax > 0.3) return;
    // pizzaiolo: contro uno da mischia tiene una tacca per la pala quando arriva addosso
    if (d.att.tipo === 'pizza_rotante' && MISCHIA[T.d.att.tipo] && tdist > d.att.pala.gitt && h.ammo < 2) return;
    if (d.att.tipo === 'onda_bassi') { var bt = (st.t + 1) % d.att.battito; if (!(bt <= 3 || bt >= d.att.battito - 3) && rnd(st) < (m.liv === 3 ? 0.6 : m.liv === 2 ? 0.4 : 0.15)) return; }
    mira(st, h, m, T, tdist, d.att, inp, false);
    inp.att = 1;
    m.prossimoSparo = st.t + Math.round((L.cad + rnd(st) * L.cad) * 30);
  }

  var _cb = { x: 0, y: 0 };
  function cespuglioVerso(st, h, T, tdist) {
    var c0 = Math.floor(h.x), r0 = Math.floor(h.y), best = 1e9, ok = false;
    for (var r = r0 - 4; r <= r0 + 4; r++) for (var c = c0 - 4; c <= c0 + 4; c++) {
      if (M.tile(st, c, r) !== M.CESP) continue;
      var x = c + 0.5, y = r + 0.5, a = Math.hypot(x - h.x, y - h.y), b = Math.hypot(T.x - x, T.y - y);
      if (a > 3.5 || b < 1.5 || b > tdist - 0.8 || a + b > tdist * 1.3) continue;
      if (a + b < best) { best = a + b; _cb.x = x; _cb.y = y; ok = true; }
    }
    return ok ? _cb : null;
  }

  // [fable] casella libera vicina da cui il bersaglio NON ha la linea di tiro (dietro un muro o una cassa)
  var _rp = { x: 0, y: 0 };
  function riparo(st, h, T, m) {
    if (m.ripT && st.t - m.ripT < 10 && m.ripOk) { _rp.x = m.ripX; _rp.y = m.ripY; return _rp; }
    var c0 = Math.floor(h.x), r0 = Math.floor(h.y), best = 1e9, ok = false;
    for (var r = r0 - 3; r <= r0 + 3; r++) for (var c = c0 - 3; c <= c0 + 3; c++) {
      if (c < 0 || r < 0 || c >= st.w || r >= st.h || M.bloccaPasso(st, c, r)) continue;
      var x = c + 0.5, y = r + 0.5, a = Math.hypot(x - h.x, y - h.y);
      if (a > 3.2 || a >= best) continue;
      if (M.lineaLibera(st, T.x, T.y, x, y)) continue;                       // da li' mi vede ancora
      if (Math.hypot(T.x - x, T.y - y) < 2.2) continue;                        // troppo addosso al nemico
      if (!M.lineaLibera(st, h.x, h.y, x, y) && a > 1.5) continue;             // non ci arrivo dritto
      best = a; _rp.x = x; _rp.y = y; ok = true;
    }
    m.ripT = st.t; m.ripOk = ok; m.ripX = _rp.x; m.ripY = _rp.y;
    return ok ? _rp : null;
  }

  var _cv = { x: 0, y: 0 };
  // 23/11 sopravvivenza: il bottino più comodo nella zona sicura. 1 = cubo da raccogliere, 2 = cassa da rompere (m.botCassa = casella).
  // Si sceglie ogni mezzo secondo (o quando quello di prima non c'è più); conta la distanza, una cassa conta un po' di più
  // di un cubo; si lasciano stare quelle con un altro eroe vivo molto più vicino (si eviterebbe solo una rissa per niente).
  // 23/11: «calma» finché la zona sicura copre più del 25% del campo (vale per ogni mappa): si pensa al bottino, non alle risse
  function calmaGas(st) { var g = st.gas; return !g.on || (g.x1 - g.x0) * (g.y1 - g.y0) > 0.25 * st.w * st.h; }
  function zonaFinale(st) { var g = st.gas; return g.on && (g.x1 - g.x0) * (g.y1 - g.y0) < 0.1 * st.w * st.h; }
  function nelSicuro(st, x, y, mg) { var g = st.gas; return !g.on || (x > g.x0 + mg && x < g.x1 - mg && y > g.y0 + mg && y < g.y1 - mg); }
  function bottino(st, h, m) {
    var w = st.w, i;
    if (m.botK === 1 && st.t < m.botT) { var q0 = st.cu[m.botI]; if (q0 && q0.vivo && nelSicuro(st, q0.x, q0.y, 1)) { m.botX = q0.x; m.botY = q0.y; return true; } }
    if (m.botK === 2 && st.t < m.botT && st.g[m.botCassa] === M.CASSA && nelSicuro(st, m.botX, m.botY, 1.2)) return true;
    if (m.botK === -1 && st.t < m.botT) return false;
    // stabilità: quello di prima vale un po' di più (prima un cubo «a 9 caselle» dietro una roccia faceva oscillare il bot);
    // un bersaglio inseguito da più di 10 s senza prenderlo si lascia perdere per 10 s
    var pK = m.botK, pI = pK === 1 ? m.botI : pK === 2 ? m.botCassa : -1, chiave = pK * 100000 + pI;
    if (pK > 0 && chiave !== m.botChi) { m.botChi = chiave; m.botDa = st.t; }
    if (pK > 0 && st.t - m.botDa > 300) { m.botNo = chiave; m.botNoT = st.t + 300; m.botChi = -1; pI = -1; }
    var no = st.t < (m.botNoT || 0) ? m.botNo : -9;
    m.botT = st.t + 15; m.botK = -1; m.botCassa = -1;
    var best = 1e9;
    for (i = 0; i < st.cu.length; i++) {
      var q = st.cu[i]; if (!q.vivo || !nelSicuro(st, q.x, q.y, 1) || 100000 + i === no) continue;
      var dq = Math.sqrt((q.x - h.x) * (q.x - h.x) + (q.y - h.y) * (q.y - h.y)), su = pK === 1 && i === pI ? 4 : 0;
      if (dq - su < 9 && dq - su < best) { best = dq - su; m.botK = 1; m.botI = i; m.botX = q.x; m.botY = q.y; }
    }
    if (m.botK === 1) return true;
    if (!st.iaCasse) { st.iaCasse = []; for (i = 0; i < st.g.length; i++) if (st.g[i] === M.CASSA) st.iaCasse.push(i); }
    best = 1e9;
    for (i = 0; i < st.iaCasse.length; i++) {
      var k = st.iaCasse[i]; if (st.g[k] !== M.CASSA || 200000 + k === no) continue;
      var cx = k % w + 0.5, cy = (k - k % w) / w + 0.5;
      if (!nelSicuro(st, cx, cy, 1.2)) continue;
      var dc = Math.sqrt((cx - h.x) * (cx - h.x) + (cy - h.y) * (cy - h.y)) - (pK === 2 && k === pI ? 3 : 0);
      if (dc > 11 || dc >= best) continue;
      var altro = false, calmo = calmaGas(st);
      for (var j = 0; j < st.eroi.length; j++) {
        var e = st.eroi[j]; if (e === h || !e.vivo) continue;
        var de = Math.sqrt((e.x - cx) * (e.x - cx) + (e.y - cy) * (e.y - cy));
        if (de < dc - 4 || (calmo && de < 6.5 && de < dc + 2)) { altro = true; break; }   // prima metà: la cassa è di chi c'è già
      }
      if (altro) continue;
      best = dc; m.botK = 2; m.botCassa = k; m.botX = cx; m.botY = cy;
    }
    return m.botK === 2;
  }
  // la cassa scelta è a tiro: abbastanza vicina e con la linea libera fino al suo bordo (i lanci ad arco passano sopra)
  function cassaATiro(st, h, m, d) {
    var k = m.botCassa; if (k < 0 || st.g[k] !== M.CASSA) return false;
    var cx = k % st.w + 0.5, cy = (k - k % st.w) / st.w + 0.5, dx = cx - h.x, dy = cy - h.y, dd = Math.sqrt(dx * dx + dy * dy) || 0.01;
    if (dd > Math.min(gittataUtile(d), 5) + 0.45) return false;
    return !!LANCIO[d.att.tipo] || dd < 0.7 + 0.45 || M.lineaLibera(st, h.x, h.y, cx - dx / dd * 0.62, cy - dy / dd * 0.62);
  }
  function liberoVicino(st, x, y, out) {
    x = Math.max(0.5, Math.min(st.w - 0.5, x)); y = Math.max(0.5, Math.min(st.h - 0.5, y));
    var c0 = Math.floor(x), r0 = Math.floor(y);
    out.x = x; out.y = y;
    if (!M.bloccaPasso(st, c0, r0)) return out;
    for (var rr = 1; rr <= 4; rr++) {
      var bd = 1e9;
      for (var r = r0 - rr; r <= r0 + rr; r++) for (var c = c0 - rr; c <= c0 + rr; c++) {
        if (Math.max(Math.abs(c - c0), Math.abs(r - r0)) !== rr || c < 0 || r < 0 || c >= st.w || r >= st.h || M.bloccaPasso(st, c, r)) continue;
        var dd = (c + 0.5 - x) * (c + 0.5 - x) + (r + 0.5 - y) * (r + 0.5 - y);
        if (dd < bd) { bd = dd; out.x = c + 0.5; out.y = r + 0.5; }
      }
      if (bd < 1e9) return out;
    }
    return out;
  }
  function cespuglioVicino(st, h) {
    var c0 = Math.floor(h.x), r0 = Math.floor(h.y), best = 1e9, ok = false;
    for (var r = r0 - 4; r <= r0 + 4; r++) for (var c = c0 - 4; c <= c0 + 4; c++) {
      if (M.tile(st, c, r) !== M.CESP) continue;
      var dd = Math.hypot(c + 0.5 - h.x, r + 0.5 - h.y);
      if (dd < best) { best = dd; _cv.x = c + 0.5; _cv.y = r + 0.5; ok = true; }
    }
    return ok ? _cv : null;
  }

  function mira(st, h, m, T, tdist, o, inp, sup) {
    var t = 0, L = m.L;
    if (o.pv) t = tdist / o.pv; else if (o.T) t = o.T; else if (o.ritardo) t = o.ritardo;
    var px = T.x + T.vx * t * L.lead, py = T.y + T.vy * t * L.lead;
    var ax = px - h.x, ay = py - h.y, ad = Math.sqrt(ax * ax + ay * ay) || 0.01;
    var a = Math.atan2(ay, ax) + gauss(st) * L.err;
    var g = o.gitt || o.dist || o.raggio || 6;
    var frac = Math.min(1, ad / g) * (1 + gauss(st) * L.err * 0.5);
    if (frac < 0.08) frac = 0.08;
    if (!LANCIO[o.tipo] && !sup) frac = 1;
    if (sup) { inp.sx = Math.cos(a) * frac; inp.sy = Math.sin(a) * frac; }
    else { inp.ax = Math.cos(a) * frac; inp.ay = Math.sin(a) * frac; }
  }

  function schiva(st, h, m, L) {
    if (rnd(st) > L.dodge) return;
    // la linea di mira del cecchino si vede: chi è sulla linea fa un passo di lato
    for (var c = 0; c < st.eroi.length; c++) {
      var ce = st.eroi[c];
      if (!ce.vivo || ce.sq === h.sq || ce.cecT <= 0) continue;
      var cx0 = h.x - ce.x, cy0 = h.y - ce.y, cd0 = Math.sqrt(cx0 * cx0 + cy0 * cy0), da0 = Math.atan2(cy0, cx0) - ce.cecA;
      while (da0 > Math.PI) da0 -= 2 * Math.PI; while (da0 < -Math.PI) da0 += 2 * Math.PI;
      if (cd0 < ce.d.att.gitt && Math.abs(Math.sin(da0)) * cd0 < 0.8 && Math.abs(da0) < 1.2) { var lx0 = -Math.sin(ce.cecA), ly0 = Math.cos(ce.cecA); if (Math.sin(da0) < 0) { lx0 = -lx0; ly0 = -ly0; } m.schivaX = lx0; m.schivaY = ly0; m.schivaT = st.t + 8; return; }
    }
    for (var i = 0; i < st.pr.length; i++) {
      var p = st.pr[i];
      if (!p.vivo || p.sq === h.sq) continue;
      if (p.k === 1) {
        var lx = h.x - p.tx, ly = h.y - p.ty, l2 = lx * lx + ly * ly, ra = p.area + 0.5;
        if (l2 < ra * ra && p.T - p.t < 0.5) {
          var l = Math.sqrt(l2) || 1; m.schivaX = lx / l; m.schivaY = ly / l; m.schivaT = st.t + 9; return;
        }
        continue;
      }
      var rx = h.x - p.x, ry = h.y - p.y;
      if (rx * rx + ry * ry > 16) continue;
      var v2 = p.vx * p.vx + p.vy * p.vy, tca = (rx * p.vx + ry * p.vy) / v2;
      if (tca < 0 || tca > 0.55) continue;
      var cx = rx - p.vx * tca, cy = ry - p.vy * tca, cd = Math.sqrt(cx * cx + cy * cy);
      if (cd > M.R + p.r + 0.35) continue;
      var v = Math.sqrt(v2), sx = -p.vy / v, sy = p.vx / v;
      if (cx * sx + cy * sy < 0) { sx = -sx; sy = -sy; }
      m.schivaX = sx; m.schivaY = sy; m.schivaT = st.t + 8;
      return;
    }
  }

  function usaSuper(st, h, m, T, tdist, inp) {
    var o = h.d.sup, t = o.tipo, hp = h.vita / h.vmax;
    function qui() { inp.sup = 1; inp.sx = 0; inp.sy = 0; return true; }
    function verso(frac) { inp.sup = 1; inp.sx = tdx(T, h) / (tdist || 1) * frac; inp.sy = tdy(T, h) / (tdist || 1) * frac; return true; }
    switch (t) {
      case 'asso_manica':   // 22/11 Asso: col marcato in campo si ripreme subito (scatto e trafigge); se no lancia l'asso dritto
        if (h.mancaT > 0) { inp.sup = 1; inp.sx = Math.cos(h.aim); inp.sy = Math.sin(h.aim); return true; }
        if (!T || tdist > o.gitt * 0.9 || !M.lineaLibera(st, h.x, h.y, T.x, T.y)) return false;
        mira(st, h, m, T, tdist, o, inp, true); var al = Math.sqrt(inp.sx * inp.sx + inp.sy * inp.sy) || 1; inp.sx /= al; inp.sy /= al; inp.sup = 1; return true;
      case 'pioggia_quadri':   // 22/11 Fante: rombi a ventaglio da vicino-medio; da Cavaliere la carica a scudo
        if (h.cavT > 0) return T && tdist < o.cav.dist && tdist > 1 ? verso(1) : false;
        return T && tdist < o.gitt * 0.8 && M.lineaLibera(st, h.x, h.y, T.x, T.y) ? verso(1) : false;
      case 'carica_scudo': return T && tdist < 6 && tdist > 1.5 && hp > 0.3 ? verso(1) : false;   // 22/11 Agamennone: carica col scudo verso il nemico a 2-6 caselle (come carica_oplita)
      case 'famiglia': case 'falange': case 'trasformazione': case 'fortezza':
        return T && tdist < 6 ? qui() : false;
      case 'immersione':
        return T && tdist < 6.5 && tdist > 1.5 ? qui() : (hp < 0.35 && T && tdist < 5 ? qui() : false);
      case 'slot_torretta':
        return T && tdist < o.gitt + 1 ? verso(0.5) : false;
      case 'drop': return T && tdist < 3.1 ? qui() : false;
      case 'sigilli': return T && tdist < o.gitt - 0.5 ? qui() : false;
      case 'giardino_trappola':   // 22/11 Dama: semina il giardino dove il nemico sta andando (anche oltre i muri); se e' addosso, fra lei e lui
        if (!T || tdist > o.gitt * 0.95) return false;
        mira(st, h, m, T, tdist, o, inp, true);
        if (tdist < 2.2) { var gl = Math.sqrt(inp.sx * inp.sx + inp.sy * inp.sy) || 1; inp.sx = inp.sx / gl * 0.2; inp.sy = inp.sy / gl * 0.2; }
        inp.sup = 1; return true;
      case 'ventaglio_oro':
        return T && tdist < 6.5 && M.lineaLibera(st, h.x, h.y, T.x, T.y) ? verso(1) : false;
      case 'fuori_dal_locale':
        return T && tdist < o.dist - 0.3 && M.lineaLibera(st, h.x, h.y, T.x, T.y) ? verso(1) : false;
      case 'rastrello':
        if (!T || tdist > o.gitt * 0.9 || !M.lineaLibera(st, h.x, h.y, T.x, T.y)) return false;
        mira(st, h, m, T, tdist, o, inp, true); var rl = Math.sqrt(inp.sx * inp.sx + inp.sy * inp.sy) || 1; inp.sx /= rl; inp.sy /= rl; inp.sup = 1; return true;
      case 'fumogeno':
        if (hp < 0.45 && T && tdist < 6) { inp.sup = 1; inp.sx = 0.01 * Math.cos(h.aim); inp.sy = 0.01 * Math.sin(h.aim); return true; }
        return T && tdist < o.gitt ? verso(Math.min(1, tdist / o.gitt)) : false;
      default:
        if (!T) return false;
        var g = o.gitt || 6;
        if (tdist > g * 0.95) return false;
        if (t === 'rete' && !M.lineaLibera(st, h.x, h.y, T.x, T.y)) return false;
        mira(st, h, m, T, tdist, o, inp, true);
        if (t === 'rete' || t === 'bordata') { var l = Math.sqrt(inp.sx * inp.sx + inp.sy * inp.sy) || 1; inp.sx /= l; inp.sy /= l; }
        inp.sup = 1;
        return true;
    }
  }

  // gadget: ognuno ha il suo momento
  function usaGadget(st, h, m, T, tdist, inp) {
    var o = h.d.gad, hp = h.vita / h.vmax;
    function qui() { inp.gad = 1; inp.gx = 0; inp.gy = 0; return true; }
    function verso(frac) { inp.gad = 1; inp.gx = tdx(T, h) / (tdist || 1) * frac; inp.gy = tdy(T, h) / (tdist || 1) * frac; return true; }
    var gu = gittataUtile(h.d);
    switch (o.tipo) {
      case 'truccato': return T && tdist < gu && h.ammo >= 1 ? qui() : false;
      case 'ricarica': return T && tdist < gu && h.ammo < 0.6 ? qui() : false;
      case 'carica_oplita': return T && tdist < 4.5 && tdist > 1.5 && hp > 0.35 ? verso(1) : false;
      case 'pollice_verso': return T && tdist < gu + 1 && T.vita / T.vmax < 0.45 ? qui() : false;
      case 'frenesia': return T && (T.vita / T.vmax < 0.55 && tdist < 7 || hp < 0.3) ? qui() : false;
      case 'ululato': return T && tdist < 3.5 ? qui() : false;
      case 'sostituzione': return T && hp < 0.45 && tdist < 6 ? qui() : false;
      case 'calderone': return hp < 0.6 && (!T || tdist > 2.5) ? qui() : false;
      case 'barile': return T && tdist < o.gitt ? verso(Math.min(1, tdist / o.gitt)) : false;
      case 'pila': return T && tdist < 6 && hp < 0.6 && !LANCIO[T.d.att.tipo] ? verso(1) : false;
      case 'parata': return false;   // si gestisce a ogni passo (minaccia)
      case 'pizze_scudo': return (minaccia(st, h) || T && tdist < (MISCHIA[T.d.att.tipo] ? 3.5 : 2.2)) ? qui() : false;
      case 'cassa_bassi': return T && tdist < 6 ? verso(Math.min(1, tdist / o.gitt)) : false;
      case 'tarocco': return T && tdist > 2.5 && tdist < 6.5 && M.lineaLibera(st, h.x, h.y, T.x, T.y) && (hp < 0.4 || T.vita / T.vmax < 0.35) ? verso(1) : false;
      case 'taglia': return T && tdist < 6.5 && M.lineaLibera(st, h.x, h.y, T.x, T.y) ? verso(1) : false;
      case 'capriola': return T && tdist < 3.2 && M.lineaLibera(st, h.x, h.y, T.x, T.y) ? verso(1) : false;
      case 'carta_coperta':
        // sulla strada di chi arriva, o sotto i piedi quando si scappa
        if (T && tdist < 2.5) return qui();
        return T && tdist < 7 ? verso(Math.min(1, (tdist * 0.55) / o.gitt)) : false;
      case 'cordone': return T && tdist < 3.2 && (MISCHIA[T.d.att.tipo] || hp < 0.5) ? verso(1) : false;
      case 'siepe':   // 22/11 Dama: la siepe fra lei e chi arriva da vicino, o come riparo dai colpi dritti quando e' ferita
        return T && ((tdist < 3.6 && MISCHIA[T.d.att.tipo]) || (tdist < 6.5 && hp < 0.55 && !LANCIO[T.d.att.tipo]) || (tdist < 6.5 && minaccia(st, h))) ? verso(1) : false;
      case 'ritirata': return T && ((tdist < 1.8 && MISCHIA[T.d.att.tipo]) || (hp < 0.35 && tdist < 4) || (h.ammo < 1 && tdist < 3)) ? verso(1) : false;   // 22/11 Asso: salta via (lontano dalla mira)
      case 'grazia_reale': return T && tdist < 7.5 && h.ammo >= 1 && !h.graziaN ? qui() : false;   // 22/11 Regina
      case 'scatto_rombo':   // 22/11 Fante: scoppia il rombo rosso; da Cavaliere spallata; se no per accorciare
        if (h.cavT > 0 && o.balzo) {   // 23/11 Cavaliere: BALZO con schianto. Addosso a chi e' vicino (anche oltre un muro), o via quando e' ferito e lo pressano
          var bz = o.balzo;
          if (!T) return false;
          if (hp < 0.3 && tdist < 2.8) { inp.gad = 1; inp.gx = -tdx(T, h) / (tdist || 1); inp.gy = -tdy(T, h) / (tdist || 1); return true; }
          if (tdist < bz.gitt + 0.2 && (tdist > 1.6 || T.stun <= 0 && tdist < 1.2) && (hp > 0.3 || !M.lineaLibera(st, h.x, h.y, T.x, T.y))) return verso(Math.min(1, tdist / bz.gitt));
          return false;
        }
        if (T && T.romboT > 0 && T.romboDa === h.i && tdist < o.dist + 0.3) return verso(1);
        return T && tdist > 3 && tdist < o.dist + 1.8 && hp > 0.4 ? verso(1) : false;
      case 'balzo_predatore': return T && tdist > 1.8 && tdist < o.gitt + 0.3 && hp > 0.3 ? verso(Math.min(1, tdist / o.gitt)) : false;
    }
    return false;
  }
  // sta per arrivare un colpo? (proiettile dritto che tocca entro 0,3 s, o un nemico da mischia che sta colpendo da vicino)
  function minaccia(st, h) {
    for (var i = 0; i < st.pr.length; i++) {
      var p = st.pr[i];
      if (!p.vivo || p.k !== 0 || p.sq === h.sq) continue;
      var rx = h.x - p.x, ry = h.y - p.y;
      if (rx * rx + ry * ry > 9) continue;
      var v2 = p.vx * p.vx + p.vy * p.vy, tca = (rx * p.vx + ry * p.vy) / v2;
      if (tca < 0 || tca > 0.3) continue;
      var cx = rx - p.vx * tca, cy = ry - p.vy * tca;
      if (cx * cx + cy * cy < (M.R + p.r + 0.1) * (M.R + p.r + 0.1) && p.dan > 250) return true;
    }
    for (var j = 0; j < st.eroi.length; j++) {
      var e = st.eroi[j];
      if (!e.vivo || e.sq === h.sq || !MISCHIA[e.d.att.tipo]) continue;
      var dx = e.x - h.x, dy = e.y - h.y;
      if (dx * dx + dy * dy < 2.4 * 2.4 && (e.dashD > 0 || e.cd > e.d.att.cd - 0.1 || e.ammo >= 1 && e.cd <= 0 && dx * dx + dy * dy < 1.6)) return true;
    }
    return false;
  }
  function tdx(T, h) { return T.x - h.x; }
  function tdy(T, h) { return T.y - h.y; }

  var IA = { LIV: LIV, prepara: prepara, pensa: pensa };
  root.IA = IA;
  if (typeof module !== 'undefined') module.exports = IA;
})(typeof window !== 'undefined' ? window : globalThis);
