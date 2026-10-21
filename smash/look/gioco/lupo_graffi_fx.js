/* GAMBLER SMASH — LUPO, ARTIGLIATA IN SERIE (speciale laterale): i GRAFFI (20/10 notte, proprietario: «nella speciale
   laterale del lupo migliora effetti visivi, mettici dei graffi»). SOLO DISEGNO: legge lo stato, non lo scrive.
   - Prima: tre strisce sottili sfumate (lupo_mannaro_fx.js serieGraffi). Ora: solchi d'artiglio veri, pieni e affusolati
     (punta sottile, pancia larga, un po' storti), 3 per artigliata e 4 nella X finale, che si aprono lungo l'arco della
     zampa in 3 fotogrammi, restano e svaniscono; strati: ombra viola scura (il taglio) + alone viola + lavanda + nucleo
     bianco-caldo, in 'lighter'. 1ª artigliata scende, 2ª sale, 3ª la X grande con lampo.
   - A segno: segni di graffio SUL NEMICO (lo seguono per 26 f, disegnati sopra di lui con GSLOOK.dopo), scintille
     (GSE.lupoSerie.scintille) e ciuffi di pelo/pezzetti che volano via.
   - Coordinate: lupo_fx.js passa a GSE.lupoSerie.serieGraffi l'ancora vera dell'artiglio in px del dispositivo; il
     trasformato del mondo lo si prende avvolgendo FX.artigli_serie (dopo l'involucro di lupo_fx.js), così i solchi restano
     fermi nel mondo mentre la camera si muove e anche quando parte l'artigliata dopo.
   Pool fissi, niente allocazioni per fotogramma. Si carica dopo lupo_fx.js. */
(function (root) {
  'use strict';
  const ID = 'lupo', PI = Math.PI, TAU = PI * 2;
  const VIO = [150, 96, 255], LAV = [205, 186, 255], CALD = [255, 246, 226], SCURO = [40, 12, 70], ORO = [255, 196, 110];
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')';
  // variazioni fisse dei singoli artigli (lunghezza, curva, spostamento lungo il taglio, spessore): «un po' storti»
  const VAR = [[1, .18, 0, 1], [.92, .1, .06, .9], [1.06, .24, -.05, 1.05], [.85, .14, .1, .8]];

  // ---- un solco affusolato lungo una Bézier quadratica (x0,y0)-(bx,by)-(x1,y1), tracciato fino a s (0..1), spessore w
  const NP = 16, LX = new Float32Array(NP + 1), LY = new Float32Array(NP + 1), RX = new Float32Array(NP + 1), RY = new Float32Array(NP + 1);
  function solco(c, x0, y0, bx, by, x1, y1, w, s) {
    if (s <= .02 || w <= .1) return;
    for (let j = 0; j <= NP; j++) {
      const q = s * j / NP, a = (1 - q) * (1 - q), b2 = 2 * (1 - q) * q, e = q * q;
      const px = a * x0 + b2 * bx + e * x1, py = a * y0 + b2 * by + e * y1;
      const tx = 2 * (1 - q) * (bx - x0) + 2 * q * (x1 - bx), ty = 2 * (1 - q) * (by - y0) + 2 * q * (y1 - by), L = Math.hypot(tx, ty) || 1;
      // profilo: entra sottile, pancia al 30%, punta lunga e sottile alla fine (u = posizione sul solco intero)
      const u = q, pr = u < .3 ? Math.pow(u / .3, .7) : Math.pow(1 - (u - .3) / .7, 1.3), hw = w * .5 * Math.max(.04, pr);
      LX[j] = px - ty / L * hw; LY[j] = py + tx / L * hw; RX[j] = px + ty / L * hw; RY[j] = py - tx / L * hw;
    }
    c.beginPath(); c.moveTo(LX[0], LY[0]);
    for (let j = 1; j <= NP; j++) c.lineTo(LX[j], LY[j]);
    for (let j = NP; j >= 0; j--) c.lineTo(RX[j], RY[j]);
    c.closePath(); c.fill();
  }
  // un graffio (n artigli paralleli) centrato in (cx, cy), mezza lunghezza r, verso del lottatore dir, sg +1 scende / -1 sale,
  // larghezza base w, s tracciato 0..1, a trasparenza. Quattro passate: taglio scuro, alone, lavanda, nucleo.
  function graffio(c, cx, cy, r, dir, sg, n, w, s, a, oro) {
    const x0 = cx - dir * r, y0 = cy - sg * r * .95, x1 = cx + dir * r * .9, y1 = cy + sg * r * .85;
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, px = -(y1 - y0) / L, py = (x1 - x0) / L;
    const passate = [[SCURO, 1.3, .5, 'source-over'], [VIO, 1.8, .26, 'lighter'], [oro ? ORO : LAV, 1, .8, 'lighter'], [CALD, .38, 1, 'lighter']];
    for (const [col, kw, ka, op] of passate) {
      c.globalCompositeOperation = op; c.fillStyle = rgba(col, ka * a);
      for (let k = 0; k < n; k++) {
        const v = VAR[k % 4], m = k - (n - 1) / 2, off = m * r * .27 + v[2] * r, cu = r * v[1] * sg * dir;
        const ax = x0 + px * off, ay = y0 + py * off, ex = x0 + (x1 - x0) * v[0] + px * off, ey = y0 + (y1 - y0) * v[0] + py * off;
        solco(c, ax, ay, (ax + ex) / 2 + px * cu, (ay + ey) / 2 + py * cu, ex, ey, w * kw * v[3] * (1 - Math.abs(m) * .12), s);
      }
    }
    c.globalCompositeOperation = 'source-over';
  }

  // ---- solchi nel mondo (restano fermi mentre la camera si muove): pool
  const NG = 12, GR = []; for (let i = 0; i < NG; i++) GR.push({ on: 0, F: null, r2: -1, n: 0, x: 0, y: 0, r: 0, dir: 1, t0: 0, w: 1 });
  // ---- segni sul nemico (coordinate relative ai suoi piedi) + ciuffi che volano: pool
  const NM = 8, MK = []; for (let i = 0; i < NM; i++) MK.push({ on: 0, V: null, ox: 0, oy: 0, r: 0, dir: 1, sg: 1, n: 0, t0: 0, w: 1 });
  const NB = 40, BX = new Float32Array(NB), BY = new Float32Array(NB), BVX = new Float32Array(NB), BVY = new Float32Array(NB), BL = new Float32Array(NB), BS = new Float32Array(NB), BR = new Float32Array(NB);
  let bN = 0, seme = 0x2545f491;
  const rnd = () => { let x = seme; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; seme = x >>> 0; return seme / 4294967296; };
  let S = null, tvis = 0;   // la partita che si sta disegnando (da GSE.chi) e un contatore di fotogrammi di disegno
  const HIT = new WeakMap();   // per lupo: l'artigliata gia' registrata a segno { k: r2*4+n, t: tvis }

  function aggancia() {
    const G = root.GSE, X = G && G._int && G._int.FX, LS = G && G.lupoSerie, L = root.GSLOOK;
    // aspetta anche l'involucro di lupo_fx.js (quello che passa l'ancora vera a LS.serieGraffi)
    if (!X || !X.artigli_serie || !LS || !L || !root.GBR || String(X.artigli_serie).indexOf('serieGraffi') < 0) return setTimeout(aggancia, 80);
    let Mw = null, Fcur = null;
    const a0 = X.artigli_serie;
    X.artigli_serie = function (c, o) {
      Fcur = o.F; Mw = c.getTransform();
      a0.apply(this, arguments);   // -> lupo_fx.js -> LS.serieGraffi (qui sotto) con l'ancora in px del dispositivo
      disegnaSolchi(c, o.F);
      Fcur = null;
    };
    // al posto delle strisce sottili: registra il solco nel mondo (una volta per artigliata) e lo disegna disegnaSolchi
    LS.serieGraffi = function (c, F, dir, P, r, k) {
      const d = F.mf - F.r2, n = Math.min(2, F.r1);
      if (d < 3 || !Mw || F !== Fcur) return;
      let g = null; for (const q of GR) if (q.on && q.F === F && q.r2 === F.r2 && q.n === n) { g = q; break; }
      const inv = Mw.inverse(), sc = Math.sqrt(Math.abs(Mw.a * Mw.d - Mw.b * Mw.c)) || 1, Hw0 = r / (n === 2 ? .22 : .16) / sc;
      // il centro dei solchi un quarto d'altezza piu' avanti dell'ancora (sull'artiglio teso, non sul braccio)
      const wx = inv.a * P[0] + inv.c * P[1] + inv.e + dir * Hw0 * .24, wy = inv.b * P[0] + inv.d * P[1] + inv.f;
      if (!g) {
        g = GR[0]; for (const q of GR) if (!q.on) { g = q; break; } else if (q.t0 < g.t0) g = q;
        g.on = 1; g.F = F; g.r2 = F.r2; g.n = n; g.dir = dir; g.t0 = tvis;
      }
      if (d <= 6) { const Hw = r / (n === 2 ? .22 : .16) / sc; g.x = wx; g.y = wy; g.r = Hw * (n === 2 ? .55 : .42); g.w = Hw * (n === 2 ? .085 : .07); }   // segue l'artiglio finche' si apre, poi resta
      // a segno: segni sul nemico, scintille, pezzetti (una volta per artigliata)
      const h = HIT.get(F);
      if ((F.r3 & 1) && !(h && h.k === F.r2 * 4 + n && tvis - h.t < 40) && S) {
        HIT.set(F, { k: F.r2 * 4 + n, t: tvis });
        let V = null, bd = 1e9;
        for (let i = 0; i < S.n; i++) { const o = S.L[i]; if (o === F) continue; const D = Math.hypot(o.x - wx, (o.y - 30) - wy); if (D < bd) { bd = D; V = o; } }
        if (V) {
          let m = MK[0]; for (const q of MK) if (!q.on) { m = q; break; } else if (q.t0 < m.t0) m = q;
          m.on = 1; m.V = V; m.ox = wx - V.x; m.oy = wy - V.y; m.r = g.r * .55; m.dir = dir; m.sg = n === 1 ? -1 : 1; m.n = n; m.t0 = tvis; m.w = g.w;
          const ang = n === 2 ? -0.7 : n === 1 ? -0.4 : 0.35;
          LS.scintille(wx, wy, n === 2 ? 22 : 12, dir > 0 ? ang : PI - ang, 1.5, n === 2 ? 10 : 7, 1.1);
          for (let i = 0; i < (n === 2 ? 12 : 6); i++) {
            const j = bN; bN = (bN + 1) % NB; const a = (dir > 0 ? -.5 : PI + .5) + (rnd() - .5) * 2.2, v = 2 + rnd() * 4;
            BX[j] = wx; BY[j] = wy; BVX[j] = Math.cos(a) * v; BVY[j] = Math.sin(a) * v - 1.5; BL[j] = 22 + rnd() * 14; BS[j] = 2 + rnd() * 3; BR[j] = rnd() * TAU;
          }
        }
      }
    };
    function disegnaSolchi(c, F) {
      c.save(); c.setTransform(Mw);
      for (const g of GR) {
        if (!g.on || g.F !== F) continue;
        const age = tvis - g.t0; if (age > 22) { g.on = 0; continue; }
        const s = Math.min(1, (age + 1) / 3), a = age < 9 ? 1 : 1 - (age - 9) / 13, fin = g.n === 2;
        if (fin && age < 3) { c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * 1.6); gr.addColorStop(0, rgba(CALD, .55 * (1 - age / 3))); gr.addColorStop(1, rgba(VIO, 0)); c.fillStyle = gr; c.fillRect(g.x - g.r * 1.6, g.y - g.r * 1.6, g.r * 3.2, g.r * 3.2); c.globalCompositeOperation = 'source-over'; }
        if (g.n === 0) graffio(c, g.x, g.y, g.r, g.dir, 1, 3, g.w, s, a, false);
        else if (g.n === 1) graffio(c, g.x, g.y, g.r, g.dir, -1, 3, g.w, s, a, false);
        else { graffio(c, g.x, g.y, g.r, g.dir, 1, 4, g.w, s, a, true); graffio(c, g.x, g.y, g.r, g.dir, -1, 4, g.w, Math.max(0, (age - 1) / 3), a, true); }
      }
      c.restore();
    }
    // segni sul nemico + pezzetti: dopo il disegno di ogni lottatore (trasformato locale: origine ai suoi piedi)
    function dopoMio(c, F) {
      for (const m of MK) {
        if (!m.on || m.V !== F) continue;
        const age = tvis - m.t0; if (age > 26) { m.on = 0; continue; }
        const a = (age < 14 ? .9 : .9 * (1 - (age - 14) / 12)), s = Math.min(1, (age + 1) / 2);
        graffio(c, m.ox, m.oy, m.r, m.dir, m.sg, m.n === 2 ? 4 : 3, m.w * .7, s, a, m.n === 2);
        if (m.n === 2) graffio(c, m.ox, m.oy, m.r, m.dir, -m.sg, 4, m.w * .7, s, a, true);
      }
    }
    function avvolgiDopo() {
      const L2 = root.GSLOOK; if (!L2 || (L2.dopo && L2.dopo.__graffi)) return;
      const d0 = L2.dopo;
      const f = function (c, F) { if (d0) d0.apply(this, arguments); try { dopoMio(c, F); } catch (e) { } };
      f.__graffi = 1; L2.dopo = f;
    }
    avvolgiDopo(); setInterval(avvolgiDopo, 500);   // altri *_fx.js possono rifare GSLOOK.dopo dopo di noi
    // la partita e il passo dei pezzetti: GSE.chi e' chiamato per ogni lottatore disegnato
    const chi0 = G.chi;
    let ultimoT = -1;
    G.chi = function (S2, F, i) {
      S = S2;
      if (i === 0 && S2.t !== ultimoT) { ultimoT = S2.t; tvis++; muoviPezzi(); }
      if (chi0) chi0.apply(this, arguments);
    };
    root.GSLUPOGRAFFI = { graffio, disegnaPezzi };
  }
  function muoviPezzi() { for (let i = 0; i < NB; i++) if (BL[i] > 0) { BX[i] += BVX[i]; BY[i] += BVY[i]; BVY[i] += .3; BVX[i] *= .95; BR[i] += .25; BL[i]--; } }
  function disegnaPezzi(c) {
    for (let i = 0; i < NB; i++) {
      if (BL[i] <= 0) continue; const q = Math.min(1, BL[i] / 12);
      c.save(); c.translate(BX[i], BY[i]); c.rotate(BR[i]); c.globalAlpha *= q;
      c.fillStyle = i % 3 ? 'rgba(150,120,220,.95)' : 'rgba(240,232,255,.95)';
      c.beginPath(); c.moveTo(-BS[i], 0); c.quadraticCurveTo(0, -BS[i] * .7, BS[i] * 1.6, 0); c.quadraticCurveTo(0, BS[i] * .5, -BS[i], 0); c.fill();
      c.restore();
    }
  }
  // i pezzetti si disegnano nel mondo dietro ai lottatori (GSFX.dietro e' gia' nel sistema del mondo)
  (function agganciaDietro() {
    if (!root.GSFX || !root.GSFX.dietro) return setTimeout(agganciaDietro, 100);
    const d0 = root.GSFX.dietro;
    root.GSFX.dietro = function (c, S2) { const r = d0.apply(this, arguments); try { disegnaPezzi(c); } catch (e) { } return r; };
  })();
  aggancia();
})(window);
