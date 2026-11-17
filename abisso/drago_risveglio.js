// NON SVEGLIARE IL DRAGO - RISVEGLIO in 7 tempi + zone (v2). Si carica dopo drago_anim.js.
// 0 occhio (primo piano, silenzio) · .7 alza la testa (rombo, polvere dal soffitto) · 1.3 RUGGITO (onda d'urto, scossa)
// 2.0 inspira (pancia accesa, scintille risucchiate) · 2.5 VAMPATA lungo il sentiero (nucleo/bordo/fumo) · 2.8 colpisce
// 3.8 i ladri arrostiti scappano tossendo · 5.0 sbuffo, si riaddormenta · 6.6 fine
"use strict";
const TW = { alza: .7, ruggito: 1.3, inspira: 2.0, fuoco: 2.5, colpo: 2.8, finefuoco: 3.8, sbuffo: 5.0, fine: 6.6 };
const suonaBase = suona;
suona = function (tipo, f) { if (tipo === "crollo") return; return suonaBase(tipo, f); };   // il ruggito lo fa la sequenza
function suonoRuggito() {
  const c = ac(); if (!c) return; mix(); const t = c.currentTime, g = c.createGain(); g.connect(MIX.master || c.destination);
  const o = c.createOscillator(), v = c.createOscillator(), vg = c.createGain(), fl = c.createBiquadFilter();
  o.type = "sawtooth"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 1.6); v.frequency.value = 8; vg.gain.value = 16; v.connect(vg); vg.connect(o.frequency);
  fl.type = "lowpass"; fl.frequency.value = 900; o.connect(fl); fl.connect(g); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.55, t + .12); g.gain.exponentialRampToValueAtTime(.001, t + 1.7);
  o.start(t); v.start(t); o.stop(t + 1.8); v.stop(t + 1.8);
  const n = rumore(c, 1.5), f2 = c.createBiquadFilter(), g2 = c.createGain(); f2.type = "lowpass"; f2.frequency.value = 120; n.connect(f2); f2.connect(g2); g2.connect(MIX.master || c.destination); g2.gain.setValueAtTime(.5, t); g2.gain.exponentialRampToValueAtTime(.001, t + 1.5); n.start(t);
}
function suonoRombo() { const c = ac(); if (!c) return; mix(); const t = c.currentTime, n = rumore(c, .9), f = c.createBiquadFilter(), g = c.createGain(); f.type = "lowpass"; f.frequency.value = 70; n.connect(f); f.connect(g); g.connect(MIX.master || c.destination); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.6, t + .3); g.gain.exponentialRampToValueAtTime(.001, t + .9); n.start(t); }
function suonoInspira() { const c = ac(); if (!c) return; mix(); const t = c.currentTime, n = rumore(c, .5), f = c.createBiquadFilter(), g = c.createGain(); f.type = "bandpass"; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1600, t + .5); n.connect(f); f.connect(g); g.connect(MIX.master || c.destination); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.3, t + .45); g.gain.exponentialRampToValueAtTime(.001, t + .55); n.start(t); }

const eventoPrimaV2 = evento;
evento = function (e, anima) {
  eventoPrimaV2(e, anima);
  if (!anima || e.k !== "carta" || !e.crollo) return;
  // il crollo di base parte a +1,15 s: spostiamo monete perse, «-n» e frana al momento della vampata
  dopo(1.16, () => {
    if (!S.crollo) return;
    S.crollo.frana = TW.colpo + .6; S.scossa = .15; S.lampo = 0;
    if (MIX.musica && SUONO.ctx) MIX.musica.gain.setTargetAtTime(0, SUONO.ctx.currentTime, .1);
    for (const x of S.schegge) if (SIM - x.t0 < .2) x.t0 += TW.colpo;
    for (const x of S.scritte) if (SIM - x.t0 < .2) x.t0 += TW.colpo;
    dopo(TW.alza, () => { suonoRombo(); if (!RM) S.scossa = .35; });
    dopo(TW.ruggito, () => { suonoRuggito(); if (!RM) S.scossa = 1.2; S.onda = SIM; });
    dopo(TW.inspira, () => suonoInspira());
    dopo(TW.fuoco, () => suonoDrago("fuoco"));
    dopo(TW.colpo + .2, () => { if (!RM) S.scossa = .6; S.lampo = .8; S.lampoCol = "255,140,40"; });
    dopo(TW.colpo + .8, () => suonoDrago("tosse"));
    dopo(TW.sbuffo, () => { suonoDrago("russata"); if (MIX.musica && SUONO.ctx) MIX.musica.gain.setTargetAtTime(.022, SUONO.ctx.currentTime, 1); });
  });
};
function svegliaE(t) { return S.crollo && t >= S.crollo.t0 && t - S.crollo.t0 < TW.fine ? t - S.crollo.t0 : -1; }
// la zona del drago cresce coi segni, sale nelle reazioni e nel risveglio (la camera si allarga)
const zonaBase = zonaDrago;
zonaDrago = function (g, t) {
  const base = zonaBase(g, t), e = svegliaE(t), vi = S.vicino && t - S.vicino.t0 < DUR_VICINO[S.vicino.tipo];
  let voluto = base;
  if (e >= 0) voluto = e < TW.alza || e > TW.sbuffo ? base : Math.round(g.H * .5);
  else if (vi) voluto = Math.round(g.H * .44);
  S.zonaV = S.zonaV == null || RM ? voluto : S.zonaV + (voluto - S.zonaV) * .1;
  return Math.round(S.zonaV);
};
dragoPix = function (g, t) {
  const { W, H } = g, P = PIX.meta.pal, D = PIX.meta.drago, seg = Object.keys(V.visti).length, zt = PIX.zonaTop;
  const resp = Math.floor(t * 1.2) % 2, e = svegliaE(t);
  const vi = e < 0 && S.vicino && t - S.vicino.t0 < DUR_VICINO[S.vicino.tipo] ? S.vicino : null, ev = vi ? t - vi.t0 : 0;
  let fr = seg ? "agita" + resp : "dorme" + resp, scuoti = 0, alza = 0;
  if (e >= 0) {
    // di profilo, sempre verso il sentiero: il collo sale con 5 intermedi, ruggito, inspira, soffio, poi riscende con 4 intermedi
    const su = ["su0", "su1", "su2", "su3", "su4"], giu = ["giu0", "giu1", "giu2", "giu3"];
    if (e < TW.alza) fr = e < .35 ? "agita0" : "w_occhio";
    else if (e < TW.ruggito) fr = su[Math.min(4, Math.floor((e - TW.alza) / (TW.ruggito - TW.alza) * 5))];
    else if (e < TW.inspira) { fr = "ruggito2"; scuoti = RM ? 0 : Math.floor(t * 30) % 2; }
    else if (e < TW.fuoco) fr = "inspira2";
    else if (e < TW.finefuoco) fr = "soffio" + (S.angFuoco || 30) + "_" + (Math.floor(t * 12) % 2);
    else if (e < TW.sbuffo) fr = "su4";
    else if (e < TW.sbuffo + .8) fr = giu[Math.min(3, Math.floor((e - TW.sbuffo) / .8 * 4))];
    else fr = "riaddormenta";
  } else if (vi) {
    if (vi.tipo === "SBADIGLIO") fr = ev < .4 ? "sbadiglio0" : ev < 1.5 ? "sbadiglio1" : "sbadiglio0";
    else if (vi.tipo === "STARNUTO") { fr = ev < .8 ? "starnuto0" : ev < 1.15 ? "starnuto1" : "agita0"; if (ev < .8 && !RM) scuoti = Math.floor(t * 20) % 2; }
    else if (vi.tipo === "CODA") fr = ev < .45 ? "coda0" : ev < 1.3 ? "coda1" : "coda0";
    else if (vi.tipo === "RUSSATA") fr = Math.floor(ev / .45) % 2 ? "russata1" : "russata0";
    else if (vi.tipo === "ARTIGLIO") fr = ev < .9 ? "artiglio0" : ev < 1.45 ? "artiglio1" : "agita0";
  } else if (t - S.orecchio < .5) fr = "orecchio";
  else if (t - (S.sbircia || -9) < .9) fr = "agita" + resp;      // un'occhiata a fessura: guarda i ladri e l'oro
  const sc = W >= 440 ? 2 : 1;
  // la testa (che guarda a sinistra) sta a destra del sentiero: il drago guarda il gruppo, il corpo esce dallo schermo a destra
  // scena orizzontale: il drago e' sdraiato in fondo al sentiero, a DESTRA, sullo stesso piano del gruppo, muso a sinistra
  const x = (typeof dragoX === "function" ? dragoX(g) : Math.round(W - D.w * sc + Math.min(20, D.w * sc * .18))) + scuoti, y = zt - D.h * sc + 6 - alza;
  PIX.dragoFr = fr;
  PIX.dragoRect = [x, y, D.w * sc, D.h * sc];
  if (window.__audit) PIX.boxDrago = ["drago", x + 6 * sc, y + 22 * sc, Math.min(W, x + D.w * sc) - x - 6 * sc, D.h * sc - 22 * sc];
  if (typeof scenaFondo === "function") scenaFondo(g, t, x, y, sc);
  cx.save(); cx.beginPath(); cx.rect(0, PIX.hudB || 0, W, H); cx.clip();
  cx.drawImage(img("drago"), D.frame.indexOf(fr) * D.w, 0, D.w, D.h, x, y, D.w * sc, D.h * sc);
  cx.restore();
  const glow = e >= TW.inspira && e < TW.finefuoco ? .55 + .2 * Math.sin(t * 20) : .18 + .08 * resp + seg * .03 + (vi ? .1 : 0);
  cx.globalCompositeOperation = "lighter"; cx.globalAlpha = Math.min(1, glow); const pr = 18 * sc; cx.drawImage(pozza(pr, P.f2), x + D.pancia[0] * sc - pr, y + D.pancia[1] * sc - pr); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
  const nx = x + D.naso[0] * sc, ny = y + D.naso[1] * sc;
  if (e < 0 && !vi && !RM && t - S.ultimaZ > (seg ? 2.6 : 1.6)) { S.ultimaZ = t; S.zeta.push({ x: nx + 4, y: ny - 8, t0: t }); }
  if (vi && vi.tipo === "RUSSATA" && Math.floor(ev / .45) !== Math.floor((ev - .02) / .45)) S.zeta.push({ x: nx + 2, y: ny - 10, t0: t, big: true });
  for (const z of S.zeta) { const ez = t - z.t0, zy = z.y - Math.round(ez * (z.big ? 22 : 12)); if (zy < (PIX.hudB || 0)) continue; cx.globalAlpha = Math.max(0, 1 - ez / 2); pixTesto(cx, "Z", z.x + Math.round(Math.sin(ez * 3) * 3 + ez * (z.big ? 18 : 8)), zy, P.cie, z.big ? 2 : 1, true); }
  cx.globalAlpha = 1; S.zeta = S.zeta.filter((z) => t - z.t0 < 2);
  if (!RM && Math.random() < .03 + seg * .04) S.fumi.push({ x: nx, y: ny, t0: t, vx: -6, vy: -14 });
  if (vi && vi.tipo === "STARNUTO" && ev > .8 && ev < .95 && !RM) for (let k = 0; k < 10; k++) S.fumi.push({ x: nx, y: ny, t0: t, vx: -20 - Math.random() * 40, vy: -40 - Math.random() * 60, big: 1 });
  if (e >= TW.sbuffo && e < TW.sbuffo + .15 && !RM) for (let k = 0; k < 6; k++) S.fumi.push({ x: nx, y: ny, t0: t, vx: -10 - Math.random() * 20, vy: -10 - Math.random() * 20, big: 1 });
  for (const f of S.fumi) { const ef = t - f.t0, r2 = (f.big ? 3 : 1) + Math.floor(ef * (f.big ? 4 : 2)); cx.fillStyle = "rgb(" + (ef < .8 ? P.fu1 : P.fu0) + ")"; cx.globalAlpha = Math.max(0, 1 - ef / 2); cx.fillRect(Math.round(f.x + (f.vx || -6) * ef), Math.round(f.y + (f.vy || -14) * ef), r2, r2); }
  cx.globalAlpha = 1; S.fumi = S.fumi.filter((f) => t - f.t0 < 2);
  if (vi && vi.tipo === "ARTIGLIO" && ev < .9 && !RM && Math.random() < .5) S.polvere.push({ x: x + 34 * sc + Math.random() * 10, y: y + 56 * sc, t0: t, vx: (Math.random() - .5) * 30, vy: -20 - Math.random() * 20 });
  // 1. primo piano dell'occhio (riquadro dentro la zona del drago)
  if (e >= 0 && e < TW.alza + .2 && !RM) {
    const k = Math.min(1, e / .2) * (e > TW.alza ? 1 - (e - TW.alza) / .2 : 1), bw = 64, bh = 44, bx = Math.round(W - bw - 6 + (1 - k) * 80), by2 = (PIX.hudB || 0) + 6;
    const fi = D.frame.indexOf(e < .3 ? "agita0" : "w_occhio") * D.w;
    cx.fillStyle = "rgb(" + P.nero + ")"; cx.fillRect(bx - 2, by2 - 2, bw + 4, bh + 4); cx.fillStyle = "rgb(" + P.o2 + ")"; cx.fillRect(bx - 1, by2 - 1, bw + 2, bh + 2);
    cx.drawImage(img("drago"), fi + 8, 30, 32, 22, bx, by2, bw, bh);
  }
};
// la polvere, l'onda d'urto, le scintille risucchiate e la vampata a strati: SOPRA al sentiero
function effettiRisveglio(g, t) {
  const P = PIX.meta.pal;
  for (const q of S.polvere) { const ep = t - q.t0; cx.fillStyle = "rgb(" + (ep < .3 ? P.o3 : P.p3) + ")"; cx.globalAlpha = Math.max(0, 1 - ep); cx.fillRect(Math.round(q.x + q.vx * ep), Math.round(q.y + q.vy * ep + ep * ep * 30), 1, 1); }
  cx.globalAlpha = 1; S.polvere = S.polvere.filter((q) => t - q.t0 < 1.2);
  const e = svegliaE(t); if (e < 0 || !PIX.dragoRect) { S.fiamme = []; return; }
  const [x, y, w] = PIX.dragoRect, sc = w / PIX.meta.drago.w, bb = (PIX.meta.drago.bocche || {})[PIX.dragoFr] || (PIX.meta.drago.bocche || {})["su4"] || [12, 18], mx = x + bb[0] * sc, my = y + bb[1] * sc, cam = Math.round(S.cam);
  const { gx, gy } = centroGruppo(g), tx0 = gx + (typeof miraDx === "function" ? miraDx() : 0), ty0 = gy - cam - 14;
  if (!RM && e > TW.alza && e < TW.ruggito + .6 && Math.random() < .6) S.polvere.push({ x: Math.random() * g.W, y: PIX.hudB || 0, t0: t, vx: 0, vy: 20 + Math.random() * 30 });
  if (S.onda && t - S.onda < .6 && !RM) { const r = (t - S.onda) * 160; cx.fillStyle = "rgb(" + P.o3 + ")"; cx.globalAlpha = 1 - (t - S.onda) / .6; for (let a = 0; a < 64; a++) { const an = a / 64 * Math.PI * 2; cx.fillRect(Math.round(mx + Math.cos(an) * r), Math.round(my + Math.sin(an) * r * .7), 2, 1); } cx.globalAlpha = 1; }
  if (!RM && e > TW.inspira && e < TW.fuoco) for (let k = 0; k < 3; k++) { const an = Math.random() * Math.PI * 2, r = 30 + Math.random() * 20; S.fiamme.push({ x: mx + Math.cos(an) * r, y: my + Math.sin(an) * r, vx: -Math.cos(an) * r / .3, vy: -Math.sin(an) * r / .3, t0: t, scint: 1 }); }
  if (e > TW.inspira - .2 && e < TW.fuoco) {   // prima del soffio si sceglie l'angolo della testa verso il gruppo
    const b0 = (PIX.meta.drago.bocche || {})["su4"]; if (b0) { const mx0 = x + b0[0] * sc, my0 = y + b0[1] * sc, ang = Math.atan2(my0 - ty0, mx0 - tx0) * 180 / Math.PI; S.angFuoco = [10, 30, 50].reduce((a2, c2) => Math.abs(c2 - ang) < Math.abs(a2 - ang) ? c2 : a2, 30); S.mira = { tx: tx0, ty: ty0 }; }
  }
  if (e > TW.fuoco && e < TW.finefuoco + .35) getto(e - TW.fuoco, x, y, sc, t, P);
  for (const f of S.fiamme) {
    const ef = t - f.t0;
    if (f.scint) { cx.fillStyle = "rgb(" + P.o3 + ")"; cx.fillRect(Math.round(f.x + f.vx * ef), Math.round(f.y + f.vy * ef), 1, 1); continue; }
    const col = f.strato === 0 ? (ef < .2 ? P.bianco : P.f3) : f.strato === 1 ? (ef < .25 ? P.f2 : P.f1) : (ef < .3 ? P.f1 : P.fu0);
    const s2 = f.strato === 0 ? 3 : f.strato === 1 ? 4 : 5; cx.fillStyle = "rgb(" + col + ")"; cx.globalAlpha = f.strato === 2 ? .6 : 1;
    cx.fillRect(Math.round(f.x + f.vx * ef) - (s2 >> 1), Math.round(f.y + f.vy * ef) - (s2 >> 1), s2, s2);
  }
  cx.globalAlpha = 1; S.fiamme = S.fiamme.filter((f) => t - f.t0 < (f.scint ? .3 : .5));
}
// i ladri colpiti: aspettano spaventati, la vampata li colpisce (lampo), neri e fumanti, cappello che salta, scappano tossendo
arrosto = function (g, t) {
  const P = PIX.meta.pal, cam = Math.round(S.cam), car = img("bot_carbone"); if (!car || !S.crollo) return;
  const e0 = t - S.crollo.t0 - TW.colpo;
  cx.save(); cx.beginPath(); cx.rect(0, PIX.hudB || 0, g.W, Math.max(0, (PIX.zonaTop || g.H) - (PIX.hudB || 0))); cx.clip();
  for (const c of S.cadono) {
    const x0 = Math.round(c.x), y0 = Math.round(c.y + 15 - cam);
    if (e0 < 0) { cx.drawImage(botPixBase(c.sg, "paura" + (Math.floor(t * 10) % 2)), x0 - 10, y0 - 30); continue; }
    if (e0 < .35) {
      cx.drawImage(botPixBase(c.sg, "paura0"), x0 - 10, y0 - 30);
      if (Math.floor(t * 16) % 2) { cx.globalCompositeOperation = "lighter"; cx.drawImage(botPixBase(c.sg, "paura0"), x0 - 10, y0 - 30); cx.globalCompositeOperation = "source-over"; }
    } else if (e0 < 1.15) {
      cx.drawImage(car, (Math.floor(t * 6) % 2) * 20, 0, 20, 30, x0 - 10, y0 - 30, 20, 30);
      if (!c.fumo || t - c.fumo > .12) { c.fumo = t; S.fumi.push({ x: x0 + (Math.random() - .5) * 8, y: y0 - 26, t0: t, vx: (Math.random() - .5) * 8, vy: -20 }); }
      const eh = e0 - .35, hx = x0 + Math.round(eh * 10), hy = y0 - 34 - Math.round(30 * eh - 50 * eh * eh);
      cx.fillStyle = "rgb(" + P.notte + ")"; cx.fillRect(hx - 3, hy, 7, 6); cx.fillStyle = "rgb(" + P.g1 + ")"; cx.fillRect(hx - 2, hy + 1, 5, 4);
    } else if (e0 < 2.6) {
      const er = (e0 - 1.15) / 1.45, xx = Math.round(x0 + Math.sin(er * 12) * 2), yy = Math.round(y0 - er * 60);
      cx.globalAlpha = Math.max(0, 1 - er * .9); cx.drawImage(car, (2 + Math.floor(t * 10) % 4) * 20, 0, 20, 30, xx - 10, yy - 30, 20, 30); cx.globalAlpha = 1;
    }
  }
  cx.restore();
};
// un solo giro di disegno: base (con drago e sentiero) + i caduti trattenuti per tutta la sequenza + gli effetti sopra
const disegnaV1 = disegna;
disegna = function () {
  const tieni = S.crollo && SIM - S.crollo.t0 < TW.fine ? S.cadono.slice() : null;
  disegnaV1();
  if (tieni) for (const c of tieni) if (!S.cadono.includes(c)) S.cadono.push(c);
  if (!PIX.meta || !V) return;
  effettiRisveglio(geo(), SIM);
};
// la targa: la priorita' (chi risale > annuncio > avviso > stato del drago) la applica aggiornaHud a ogni fotogramma

// il getto: cono a strati (nucleo bianco-giallo, bordo arancio-rosso, fumo in punta), tremolante, CONTINUO dalla bocca al bersaglio.
// In 0,25 s la punta arriva al gruppo; resta ~1 s; poi la coda si stacca dalla bocca e il getto si dissolve verso il bersaglio.
function getto(et, x, y, sc, t, P) {
  const bb = (PIX.meta.drago.bocche || {})[PIX.dragoFr] || (PIX.meta.drago.bocche || {})["soffio30_0"]; if (!bb || !S.mira) return;
  const mx = x + bb[0] * sc, my = y + bb[1] * sc, tx = S.mira.tx, ty = S.mira.ty, L = Math.hypot(tx - mx, ty - my) || 1;
  const dx = (tx - mx) / L, dy = (ty - my) / L, nx = -dy, ny = dx;
  const punta = Math.min(1, et / .25) * L, coda = et > 1.3 ? Math.min(L, (et - 1.3) / .35 * L) : 0;
  for (let s2 = coda; s2 <= punta; s2 += 1) {
    const k = s2 / L, ond = Math.sin(s2 * .1 - t * 18) * (.3 + k * 1.1), cxp = mx + dx * s2 + nx * ond, cyp = my + dy * s2 + ny * ond;
    const bordo = 2 + s2 * .2 + (((Math.floor(t * 20) * 7 + Math.floor(s2 / 5) * 3) % 4) === 0 ? 1 : 0), nucleo = Math.max(1.2, bordo * .38 - k * 1.2);
    for (let w = -bordo; w <= bordo; w += 1) {
      const px = Math.round(cxp + nx * w), py = Math.round(cyp + ny * w), a2 = Math.abs(w) / bordo;
      const col = a2 < nucleo / bordo ? (k < .3 ? P.bianco : P.f3) : a2 < .7 ? P.f2 : (BAY[py & 3][px & 3] > 7 ? P.f1 : P.f0);
      cx.fillStyle = "rgb(" + col + ")"; cx.fillRect(px, py, 1, 1);
    }
  }
  // fumo e braci dove il getto arriva
  if (!RM && et < 1.5 && Math.random() < .8) S.fumi.push({ x: mx + dx * punta + (Math.random() - .5) * 8, y: my + dy * punta - 4, t0: t, vx: (Math.random() - .5) * 16, vy: -16 - Math.random() * 16 });
  // bagliore caldo sulla scena
  cx.globalCompositeOperation = "lighter"; cx.globalAlpha = .18; cx.drawImage(pozza(30, P.f2), Math.round(mx + dx * punta - 30), Math.round(my + dy * punta - 30)); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
}
