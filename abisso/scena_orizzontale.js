// NON SVEGLIARE IL DRAGO - scena ORIZZONTALE v2 (richiesta del proprietario, 16/11 sera).
// Il sentiero corre DI LATO e scende da sinistra a destra; il mondo scorre di lato (niente camera su/giu').
// Il gruppo sta nella fascia centrale, sempre allo stesso punto; la tana del drago e' in fondo al sentiero, a DESTRA,
// sullo stesso piano, muso verso il gruppo: la vampata viaggia orizzontale lungo il sentiero.
// Sopra: soffitto con stalattiti su due piani di profondita', colonne lontane, la bocca della tana; sotto: il pavimento.
// I consigli del tutorial stanno nel pavimento, sotto il drago e il gruppo (mai sopra).
// Si appoggia a: pixel.js (CAM_ZERO), drago_risveglio.js (dragoX), ritorno.js (camminata di profilo).
"use strict";
window.CAM_ZERO = true;
const ORIZ = { STEP: 34, DROP: 3, LARGO: 250 };

// 1 pixel d'arte = un numero INTERO di pixel del dispositivo (telefono 2x: 3 px; PC: 3 px), scena larga ~250 px d'arte:
// ci stanno gruppo da 8, la vampata e il drago interi
ridimensionaPix = function () {
  const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1, k = Math.max(2, Math.round(r.width * d / ORIZ.LARGO));
  PIX.PX = k / d;
  cv.width = Math.max(40, Math.round(r.width / PIX.PX)); cv.height = Math.max(40, Math.round(r.height / PIX.PX));
  cv.style.imageRendering = "pixelated"; cx.imageSmoothingEnabled = false;
  for (const k2 of [...PIX.cache.keys()]) if (/^(vignetta|oriz)/.test(k2)) PIX.cache.delete(k2);
  PIX.hudB = null;
};
ridimensiona = ridimensionaPix; ridimensionaPix();

// ── impaginazione: dove stanno gruppo, drago e pavimento ──
function gruppoMax() { return V && V.giocatori ? V.giocatori.length : 4; }
function largoGruppo(k) { const per = Math.ceil(k / (k > 4 ? 2 : 1)); return (per - 1) * 19 + 18 + (k > 4 ? 8 : 0); }
function miraDx() { const k = Math.max(1, S.cadono.length || nelGruppo().length); return Math.max(0, Math.round(largoGruppo(k) / 2 - 9)); }   // la vampata arriva al fronte del gruppo e lo investe
function lay(g) {
  const D = PIX.meta ? PIX.meta.drago : { w: 112, h: 66 }, W = g.W;
  const zt = PIX.zonaTop || Math.round(g.H * .62);
  // il drago tutto dentro, a destra: mai oltre il bordo (D.destra = ultima colonna disegnata, ali e coda comprese) — drago 17/11
  const dx = Math.min(Math.max(Math.round(W * .45), W - D.w - 3), W - (D.destra || D.w) - 4);
  const lg = largoGruppo(gruppoMax());
  const gap = Math.max(10, Math.min(36, dx - lg - 6));               // lo spazio della vampata
  const XG = Math.round(Math.max(lg / 2 + 3, dx + 2 - gap - lg / 2));
  return { zt, dx, XG, FL: zt - 10, STEP: ORIZ.STEP, DROP: ORIZ.DROP };
}
function dragoX(g) { return lay(g).dx + Math.round(S.dragOff || 0); }
// la tessera i: a destra le piu' nuove; il punto di vista (S.vistaI) segue il gruppo, quindi il gruppo resta fermo sullo schermo
posT = function (i, g) {
  const L = lay(g), v = S.vistaI == null ? S.gruppo : S.vistaI;
  return { x: Math.round(L.XG + (i - v) * L.STEP), y: Math.round(L.FL - 6 + (i - v) * L.DROP) };
};
posBot = function (sg, g, gx, gy) {
  const gr = nelGruppo(), k = gr.length, j = Math.max(0, gr.indexOf(sg)), rig = k > 4 ? 2 : 1, per = Math.ceil(k / rig);
  const r = Math.floor(j / per), c = j % per, nr = r === rig - 1 ? k - per * (rig - 1) : per;
  return { x: Math.round(gx + (c - (nr - 1) / 2) * 19 + (rig === 2 ? (r ? 4 : -4) : 0)), y: Math.round(gy + 6 + (rig === 2 ? (r ? 6 : -7) : 0)), bh: 30, riga: r, righe: rig };
};
// il pavimento comincia a ~60% della scena: sopra c'e' aria per la grotta, sotto lo spazio dei consigli
zonaDrago = function (g) {
  const top = PIX.hudB || 0, H = g.H, D = PIX.meta ? PIX.meta.drago : { h: 66 };
  let zt = Math.round(top + (H - top) * (H > g.W * 1.3 ? .7 : .68));
  zt = Math.min(H - 14, Math.max(zt, top + D.h + 30));
  return H - zt;
};
// vignetta leggera: solo un filo ai lati e in basso (prima mangiava il drago a destra)
vignetta = function (W, H) {
  const k = "vignetta"; const v = PIX.cache.get(k); if (v && v.width === W && v.height === H) return v;
  const c = tela(W, H), x = c.getContext("2d"); x.fillStyle = "rgb(" + PIX.meta.pal.nero + ")";
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
    const d = Math.min(Math.min(xx, W - 1 - xx) / (W * .04), (H - 1 - yy) / (H * .05)); const s = (1 - d) * 16;
    if (s > BAY[yy & 3][xx & 3]) x.fillRect(xx, yy, 1, 1);
  }
  PIX.cache.set(k, c); return c;
};

// ── il punto di vista: segue il gruppo; nel ritorno segue il capofila, poi torna sul gruppo ──
function aggiornaVista() {
  const R = typeof RIT !== "undefined" ? RIT.attivo : null;
  const kp = ease(Math.max(0, Math.min(1, (SIM - S.passoT0) / .8))), gpos = lerp(S.da, S.gruppo, kp);
  let meta = gpos;
  if (R && typeof posFila === "function") { meta = posFila(R, 0, SIM - R.t0); S.panRit = true; }
  if (S.vistaI == null || RM || (!R && !S.panRit && Math.abs(meta - S.vistaI) > 2.5)) S.vistaI = meta;
  else S.vistaI += (meta - S.vistaI) * .12;
  if (S.panRit && !R && Math.abs(S.gruppo - S.vistaI) < .03) S.panRit = false;
  // il drago e' in fondo al sentiero: se la vista va indietro (ritorno), la tana scivola a destra col gruppo rimasto
  S.dragOff = S.panRit ? Math.max(0, S.gruppo - S.vistaI) * ORIZ.STEP : 0;
}

// ── la grotta: strisce ripetibili disegnate dal codice (pixel per pixel), con parallasse ──
function rndSeme(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function striscia(nome, w, h, fn) {
  const k = "oriz|" + nome + "|" + w + "|" + h; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const c = tela(w, h), x = c.getContext("2d"); fn(x, w, h); PIX.cache.set(k, c); return c;
}
function pxc(x, col, X, Y, w = 1, h = 1) { x.fillStyle = "rgb(" + col + ")"; x.fillRect(X, Y, w, h); }
// stalattite: cono che si assottiglia, luce a sinistra, ombra a destra, goccia sulla punta
function stalattite(x, P, sx, top, lw, lh, chiaro) {
  for (let yy = 0; yy < lh; yy++) {
    const w = Math.max(0, Math.round(lw * Math.pow(1 - yy / lh, .8)));
    pxc(x, chiaro ? P.g0 : P.notte, sx - w, top + yy, w * 2 + 1, 1);
    if (w >= 1) { pxc(x, chiaro ? P.g1 : P.g0, sx - w, top + yy, 1, 1); pxc(x, P.nero, sx + w, top + yy, 1, 1); }
    if (chiaro && w >= 3 && (yy + sx) % 7 === 0) pxc(x, P.g1, sx - w + 2, top + yy, 1, 1);
  }
  if (chiaro && lh > 14) pxc(x, P.cie_, sx, top + lh, 1, 1);
}
function soffittoLontano(h) {
  return striscia("soffL", 200, h, (x, w, hh) => {
    const P = PIX.meta.pal, r = rndSeme(11);
    for (let s = 0; s < 16; s++) stalattite(x, P, Math.round(r() * w), 0, 2 + Math.round(r() * 3), Math.round(hh * (.25 + r() * .55)), false);
  });
}
function soffittoVicino(h) {
  return striscia("soffV", 256, h, (x, w, hh) => {
    const P = PIX.meta.pal, r = rndSeme(7);
    for (let xx = 0; xx < w; xx++) { const b = 5 + Math.round(Math.sin(xx * .09) * 2 + Math.sin(xx * .31) * 1.5); pxc(x, P.notte, xx, 0, 1, b); pxc(x, P.g0, xx, b, 1, 1); }
    for (let s = 0; s < 9; s++) {
      const sx = 6 + Math.round(r() * (w - 12)), lun = s % 3 === 0 ? .75 + r() * .25 : .2 + r() * .4;
      stalattite(x, P, sx, 4, 3 + Math.round(r() * 4), Math.max(8, Math.round(hh * lun) - 4), true);
    }
  });
}
function colonneLontane(h) {
  return striscia("col", 180, h, (x, w, hh) => {
    const P = PIX.meta.pal;
    for (const [c0, lw] of [[30, 9], [104, 13], [150, 7]]) for (let yy = 0; yy < hh; yy++) {
      const ww = lw + Math.round(Math.max(0, 6 - yy) * 1.2) + Math.round(Math.max(0, yy - (hh - 8)) * 1.5);   // si allarga al soffitto e al pavimento
      for (let xx = c0 - ww; xx <= c0 + ww; xx++) { const bordo = Math.min(xx - (c0 - ww), c0 + ww - xx); if (bordo > 0 || BAY[yy & 3][xx & 3] > 7) pxc(x, bordo === 1 ? P.g0 : P.notte, (xx + w) % w, yy, 1, 1); }
    }
  });
}
function sassiDavanti(h) {   // pavimento: sassi, crepe e qualche moneta persa (si muovono col sentiero)
  return striscia("sassi", ORIZ.STEP * 6, h, (x, w, hh) => {
    const P = PIX.meta.pal, r = rndSeme(23);
    for (let s = 0; s < 14; s++) { const sx = Math.round(r() * w), sy = 3 + Math.round(r() * (hh - 6)), sw = 2 + Math.round(r() * 4); pxc(x, P.g0, sx, sy, sw, 1); pxc(x, P.g1, sx, sy - 1, Math.max(1, sw - 1), 1); }
    for (let s = 0; s < 5; s++) { const sx = Math.round(r() * w), sy = 2 + Math.round(r() * (hh * .3)); pxc(x, P.o1, sx, sy, 2, 1); pxc(x, P.o3, sx, sy, 1, 1); }
    for (let s = 0; s < 4; s++) { let cx0 = Math.round(r() * w), cy0 = 4 + Math.round(r() * (hh - 8)); for (let k = 0; k < 8; k++) { pxc(x, P.nero, cx0, cy0, 1, 1); cx0 += 1; cy0 += r() < .4 ? 1 : 0; } }
  });
}
function rocceDavanti(h) {   // primo piano scurissimo in basso: da' profondita'
  return striscia("rocce", 300, h, (x, w, hh) => {
    const P = PIX.meta.pal;
    for (const [c0, lw, lh] of [[40, 34, .8], [150, 22, .45], [230, 40, 1]]) for (let xx = c0 - lw; xx <= c0 + lw; xx++) {
      const k = 1 - Math.pow((xx - c0) / lw, 2); const top = Math.round(hh - hh * lh * Math.sqrt(Math.max(0, k)));
      pxc(x, P.nero, (xx + w) % w, top, 1, hh - top); if (k > .05) pxc(x, P.notte, (xx + w) % w, top, 1, 1);
    }
  });
}
function ripeti(im, off, y) { const w = im.width; let x0 = -(((Math.round(off) % w) + w) % w); for (; x0 < cv.width; x0 += w) cx.drawImage(im, x0, y); }
// la bocca della tana dietro al drago: arco scuro, dentro il bagliore del tesoro
function tana(w, h) {
  return striscia("tana", w, h, (x, ww, hh) => {
    const P = PIX.meta.pal, cx0 = ww / 2;
    for (let yy = 0; yy < hh; yy++) for (let xx = 0; xx < ww; xx++) {
      const nx = (xx - cx0) / (ww / 2), ny = (hh - yy) / hh, d = nx * nx + ny * ny * 1.1;
      if (d > 1) continue;
      if (d > .86) { pxc(x, d > .93 ? P.g1 : P.g0, xx, yy); continue; }               // l'orlo di roccia
      const caldo = (1 - Math.abs(nx)) * (1 - ny) * 16;                                 // bagliore del tesoro in basso al centro
      pxc(x, caldo > BAY[yy & 3][xx & 3] + 9 ? P.o0 : caldo > BAY[yy & 3][xx & 3] + 4 ? P.f0 : caldo > BAY[yy & 3][xx & 3] ? P.d0 : P.nero, xx, yy);
    }
  });
}
function fondoFisso(W, H, top, zt) {   // la parete di fondo: dal nero in alto al bruno vicino al sentiero; il pavimento
  const k = "oriz|fondo|" + W + "|" + H + "|" + top + "|" + zt; if (PIX.cache.has(k)) return PIX.cache.get(k);
  for (const k2 of [...PIX.cache.keys()]) if (k2.startsWith("oriz|fondo|")) PIX.cache.delete(k2);
  const P = PIX.meta.pal, c = tela(W, H), x = c.getContext("2d"), L = lay({ W, H });
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
    const lip = zt - 4 + Math.round((xx - L.XG) / ORIZ.STEP * ORIZ.DROP);
    let col;
    if (yy < top) col = BAY[yy & 3][(xx + (yy >> 2) * 3) & 3] > 13 ? P.g0 : P.notte;                       // la volta di roccia dietro all'HUD
    else if (yy < lip) { const f = Math.max(0, (yy - top) / Math.max(1, lip - top)) * 22; col = f > BAY[yy & 3][xx & 3] + 12 ? P.g0 : f > BAY[yy & 3][xx & 3] ? P.notte : P.nero; }
    else if (yy === lip) col = P.g2;
    else if (yy < lip + 3) col = P.g1;
    else {
      const f = (1 - (yy - lip) / Math.max(1, H - lip)) * 20; col = f > BAY[yy & 3][xx & 3] + 10 ? P.g0 : f > BAY[yy & 3][xx & 3] ? P.notte : P.nero;
      // il bagliore del tesoro che esce dalla tana e si stende sul pavimento davanti
      const gxl = L.dx + 56, dd = Math.hypot((xx - gxl) / 120, (yy - lip) / 34), caldo = (1 - dd) * 14;
      if (caldo > BAY[yy & 3][xx & 3] + 6) col = P.o0; else if (caldo > BAY[yy & 3][xx & 3]) col = yy % 2 ? P.d0 : col;
    }
    pxc(x, col, xx, yy);
  }
  PIX.cache.set(k, c); return c;
}
function scenaFondo(g, t, dx, dy, sc) {
  const { W, H } = g, P = PIX.meta.pal, top = PIX.hudB || 0, zt = PIX.zonaTop, L = lay(g), D = PIX.meta.drago;
  const scorre = (S.vistaI || 0) * ORIZ.STEP, aria = Math.max(20, zt - top);
  cx.drawImage(fondoFisso(W, H, top, zt), 0, 0);
  // piani di profondita': colonne lontane (.15), stalattiti lontane (.3), la tana, stalattiti vicine (.55)
  cx.globalAlpha = .9; ripeti(colonneLontane(Math.max(10, zt - 4 - top)), scorre * .15, top); cx.globalAlpha = 1;
  ripeti(soffittoLontano(Math.round(Math.max(12, Math.min(aria - 86, aria * .55)))), scorre * .3, top);
  const tw = D.w + 46, th = Math.min(D.h + 62, zt - top - 4), tx = Math.round(dx + D.w / 2 - tw / 2 + 6);
  cx.drawImage(tana(tw, th), tx, zt - th);
  const vic = Math.round(Math.max(14, Math.min(aria - 78, aria * .62)));
  ripeti(soffittoVicino(vic), scorre * .55, top - 3);
  // gocce che cadono dalle stalattiti
  if (!RM) { S.gocce = S.gocce || []; if (Math.random() < .03) S.gocce.push({ x: Math.round(Math.random() * W), y: top + 8, t0: t }); }
  for (const d of S.gocce || []) { const e = t - d.t0, yy = Math.round(d.y + 90 * e * e); if (yy < zt - 4) pxc(cx, P.cie, d.x, yy, 1, 2); }
  if (S.gocce) S.gocce = S.gocce.filter((d) => d.y + 90 * (t - d.t0) ** 2 < zt);
  // pavimento: sassi e crepe che scorrono col sentiero; primo piano in basso
  ripeti(sassiDavanti(Math.max(8, H - zt - 2)), scorre, zt + 2);
  const rh = Math.round(Math.min(46, (H - zt) * .4)); if (rh > 8) ripeti(rocceDavanti(rh), scorre * 1.4, H - rh);
  // il campo: una scala di corda che scende dal soffitto (la via per tornare su)
  const cp = posT(-1, g);
  if (cp.x > -10 && cp.x < W + 10) {
    for (let yy = top; yy < cp.y + 6; yy++) { pxc(cx, P.t0, cp.x - 5, yy, 1, 1); pxc(cx, P.t0, cp.x + 5, yy, 1, 1); if ((yy - top) % 5 === 0) pxc(cx, P.t1, cp.x - 4, yy, 9, 1); }
  }
  // monete sparse davanti alla tana
  for (let i = 0; i < 16; i++) { const mx = Math.round(dx - 8 + (i * 37) % Math.max(20, D.w + 10)), my = zt - 3 + (i * 5) % 7; pxc(cx, i % 3 ? P.o2 : P.o3, mx, my, 2, 1); }
  // il tratto di sentiero non ancora esplorato: dal gruppo fino al muso del drago
  const { gx } = centroGruppo(g);
  cx.globalAlpha = .5; for (let xx = Math.round(gx + 24); xx < dx + 4; xx += 4) pxc(cx, P.g1, xx, Math.round(L.FL + 1 + (xx - L.XG) / ORIZ.STEP * ORIZ.DROP), 3, 1); cx.globalAlpha = 1;
}

// ── i ladri arrostiti restano RICONOSCIBILI: stesso sprite, anneriti dal fumo, occhi sbarrati, cappello sfrangiato che fuma ──
function bruciato(sg, fr, v) {
  const k = "bruciato|" + sg + "|" + fr + "|" + v; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const src = botPixBase(sg, fr), c = tela(src.width, src.height + 5), x = c.getContext("2d"), P = PIX.meta.pal;
  x.drawImage(src, 0, 5);
  x.globalCompositeOperation = "source-atop";
  x.fillStyle = "rgba(30,16,14,.48)"; x.fillRect(0, 0, c.width, c.height);                     // affumicato: il colore si vede ancora
  for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx++) {                 // fuliggine a chiazze, di piu' sul lato della vampata (destra)
    if (BAY[(yy + (xx >> 2)) & 3][xx & 3] < 2 + xx / c.width * 7) { x.fillStyle = "rgba(12,7,9,.72)"; x.fillRect(xx, yy, 1, 1); }
  }
  x.globalCompositeOperation = "source-over";
  pxc(x, P.bianco, 7, 18, 2, 2); pxc(x, P.bianco, 11, 18, 2, 2); pxc(x, P.nero, 8, 19, 1, 1); pxc(x, P.nero, 12, 19, 1, 1);   // occhi sbarrati
  for (const [sx, sl] of [[7, 2], [8, 4], [10, 3], [11, 5], [12, 2]]) pxc(x, P.nero, sx, 5 - sl + 1, 1, sl);                 // cappello sfrangiato
  pxc(x, v ? P.f3 : P.f2, 8, 2, 1, 1); pxc(x, v ? P.f2 : P.f3, 11, 1, 1, 1); pxc(x, P.f1, 10, 3, 1, 1);                       // braci
  PIX.cache.set(k, c); return c;
}
arrosto = function (g, t) {
  const P = PIX.meta.pal, cam = Math.round(S.cam); if (!S.crollo) return;
  const e0 = t - S.crollo.t0 - TW.colpo;
  cx.save(); cx.beginPath(); cx.rect(0, PIX.hudB || 0, g.W, Math.max(0, (PIX.zonaTop || g.H) - (PIX.hudB || 0))); cx.clip();
  S.cadono.forEach((c, j) => {
    const x0 = Math.round(c.x), y0 = Math.round(c.y + 15 - cam), v = Math.floor(t * 8 + j) % 2;
    if (e0 < 0) { cx.drawImage(botPixBase(c.sg, "paura" + (Math.floor(t * 10) % 2)), x0 - 10 + (RM ? 0 : Math.floor(t * 24 + j) % 2), y0 - 30); return; }
    if (e0 < .3) {   // colpiti: lampo sullo sprite vero
      cx.drawImage(botPixBase(c.sg, "paura0"), x0 - 10, y0 - 30);
      if (Math.floor(t * 16) % 2) { cx.globalCompositeOperation = "lighter"; cx.drawImage(botPixBase(c.sg, "paura0"), x0 - 10, y0 - 30); cx.globalCompositeOperation = "source-over"; }
      return;
    }
    if (e0 < 1.1) {  // fermi, anneriti, un colpo di tosse, fumo dal cappello
      const tos = Math.floor((e0 - .3) / .22) % 3 === 1 ? 1 : 0;
      cx.drawImage(bruciato(c.sg, "paura0", v), x0 - 10, y0 - 35 - tos);
      if (!RM && (!c.fumo || t - c.fumo > .1)) { c.fumo = t; S.fumi.push({ x: x0 + (Math.random() - .5) * 6, y: y0 - 33, t0: t, vx: (Math.random() - .5) * 6, vy: -18 }); }
      return;
    }
    // scappano a SINISTRA lungo il sentiero, verso il campo, saltellando e tossendo, fino a uscire dallo schermo
    const er = Math.max(0, (e0 - 1.1 - j * .07) / 1.15), q = er * er * (3 - 2 * Math.min(1, er));
    const xx = Math.round(x0 - Math.min(1, q) * (x0 + 30)), yy = Math.round(y0 - Math.min(1, q) * (x0 + 30) / ORIZ.STEP * ORIZ.DROP - (RM ? 0 : Math.abs(Math.sin(er * 16)) * 3));
    if (xx < -14) return;
    cx.save(); cx.translate(xx, yy); if (er > 0) cx.scale(-1, 1);
    cx.drawImage(bruciato(c.sg, er > 0 ? "walk" + (Math.floor(t * 12 + j) % 4) : "paura0", v), -10, -35); cx.restore();
    if (!RM && er > 0 && Math.random() < .3) S.fumi.push({ x: xx + 4, y: yy - 30, t0: t, vx: 12, vy: -10 });
  });
  cx.restore();
};

// ── i consigli del tutorial: nel pavimento, sotto il drago e il gruppo (mai sopra) ──
function piazzaCoach() {
  const co = document.getElementById("coach"); if (!co || !PIX.zonaTop) return;
  const rc = cv.getBoundingClientRect(), k = rc.height / cv.height, top = Math.round(rc.top + (PIX.zonaTop + 9) * k), mh = Math.max(56, Math.round(rc.bottom - top - 6));
  const s = top + "|" + mh; if (co.dataset.oriz === s) return; co.dataset.oriz = s;
  co.style.top = top + "px"; co.style.bottom = "auto"; co.style.maxHeight = mh + "px"; co.style.overflow = "auto";
}
const disegnaPrimaOriz = disegna;
disegna = function () {
  if (V && PIX.meta) aggiornaVista();
  disegnaPrimaOriz();
  try { piazzaCoach(); } catch (e) { /* niente */ }
};
