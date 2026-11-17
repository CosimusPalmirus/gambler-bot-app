// NON SVEGLIARE IL DRAGO - le reazioni del drago (16/11 notte). Si carica dopo pixel.js.
// Ogni segno ha il suo "quasi risveglio" (1,5-2 s); i tesori grossi fanno muovere un orecchio;
// il risveglio arrostisce con una vampata chi e' ancora sul sentiero (cartoon, niente sangue).
"use strict";
S.vicino = null; S.orecchio = -9; S.zeta = []; S.cappelli = []; S.polvere = []; S.vento = 0; S.ultimaZ = 0;
const DUR_VICINO = { SBADIGLIO: 1.9, STARNUTO: 1.7, CODA: 1.6, RUSSATA: 1.9, ARTIGLIO: 1.7 };

// ── suoni del drago (sintetizzati) ──────────────────────────────────────
function suonoDrago(tipo) {
  const c = ac(); if (!c) return; mix(); const t = c.currentTime, g = c.createGain(); g.connect(MIX.master || c.destination);
  const rum = (d, tipoF, f, q) => { const n = rumore(c, d), fl = c.createBiquadFilter(); fl.type = tipoF; fl.frequency.value = f; if (q) fl.Q.value = q; n.connect(fl); fl.connect(g); n.start(t); return fl; };
  const osc = (tp, f0, f1, d) => { const o = c.createOscillator(); o.type = tp; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); o.connect(g); o.start(t); o.stop(t + d + .05); };
  if (tipo === "sbadiglio") { osc("sawtooth", 140, 60, 1.4); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.18, t + .5); g.gain.exponentialRampToValueAtTime(.001, t + 1.5); }
  else if (tipo === "starnuto") { const fl = rum(.6, "bandpass", 1800, 1.5); fl.frequency.setValueAtTime(600, t + .55); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.05, t + .5); g.gain.setValueAtTime(.5, t + .55); g.gain.exponentialRampToValueAtTime(.001, t + .9); }
  else if (tipo === "coda") { const fl = rum(.7, "bandpass", 400, 2); fl.frequency.exponentialRampToValueAtTime(2200, t + .5); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.35, t + .35); g.gain.exponentialRampToValueAtTime(.001, t + .7); }
  else if (tipo === "russata") { const fl = rum(1.8, "lowpass", 180); const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 30; lg.gain.value = 80; l.connect(lg); lg.connect(fl.frequency); l.start(t); l.stop(t + 1.8); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.45, t + .9); g.gain.exponentialRampToValueAtTime(.001, t + 1.8); }
  else if (tipo === "artiglio") { for (let i = 0; i < 4; i++) { const n = rumore(c, .08), fl = c.createBiquadFilter(), gg = c.createGain(); fl.type = "highpass"; fl.frequency.value = 2500; n.connect(fl); fl.connect(gg); gg.connect(MIX.master || c.destination); gg.gain.setValueAtTime(.25, t + i * .12); gg.gain.exponentialRampToValueAtTime(.001, t + i * .12 + .08); n.start(t + i * .12); } }
  else if (tipo === "orecchio") { osc("triangle", 900, 1300, .08); g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + .1); }
  else if (tipo === "fuoco") { rum(1.6, "lowpass", 900); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.9, t + .15); g.gain.exponentialRampToValueAtTime(.001, t + 1.6); }
  else if (tipo === "tosse") { for (let i = 0; i < 3; i++) { const n = rumore(c, .12), fl = c.createBiquadFilter(), gg = c.createGain(); fl.type = "bandpass"; fl.frequency.value = 700; n.connect(fl); fl.connect(gg); gg.connect(MIX.master || c.destination); gg.gain.setValueAtTime(.2, t + i * .22); gg.gain.exponentialRampToValueAtTime(.001, t + i * .22 + .12); n.start(t + i * .22); } }
  else if (tipo === "evviva") { for (const [f, d] of [[660, 0], [880, .1], [1100, .2]]) { const o = c.createOscillator(), gg = c.createGain(); o.type = "square"; o.frequency.value = f; o.connect(gg); gg.connect(MIX.master || c.destination); gg.gain.setValueAtTime(.04, t + d); gg.gain.exponentialRampToValueAtTime(.001, t + d + .15); o.start(t + d); o.stop(t + d + .16); } }
}

// ── gli eventi: quando il drago reagisce ────────────────────────────────
const eventoPrimaDrago = evento;
evento = function (e, anima) {
  eventoPrimaDrago(e, anima);
  if (!anima) return;
  if (e.k === "discesa") { S.vicino = null; S.zeta = []; S.cappelli = []; S.polvere = []; }
  if (e.k !== "carta") return;
  const c = e.carta;
  if (c.t === "pericolo" && !e.crollo) {
    dopo(1.0, () => {
      S.vicino = { tipo: c.v, t0: SIM }; suonoDrago(c.v.toLowerCase());
      for (let k = 0; k < 3; k++) dopo(.25 + k * .3, () => suona("battito", 1.6));
      if (c.v === "STARNUTO") dopo(.8, () => { const g = geo(), { gx, gy } = centroGruppo(g); nelGruppo().forEach((sg, j) => { const q = posBot(sg, g, gx, gy); S.cappelli.push({ sg, x: q.x, y: q.y - 30, t0: SIM + j * .04 }); }); });
      if (c.v === "CODA") dopo(.55, () => { const g = geo(), p = posT(S.gruppo, g); for (let k = 0; k < 4; k++) S.schegge.push({ x: p.x + (k - 1.5) * 6, y: p.y - 4, vx: 0, vy: 0, t0: SIM }); });
    });
  }
  if ((c.t === "perla" && c.v >= 9) || c.t === "forziere") dopo(1.7, () => { S.orecchio = SIM; suonoDrago("orecchio"); });
  if (c.t === "pericolo" && e.crollo) {
    dopo(1.55, () => suonoDrago("fuoco"));
    dopo(2.5, () => suonoDrago("tosse"));
    dopo(2.2, () => { if (V && V.giocatori.some((p) => !p.dentro && !Object.keys(e.div).map(Number).includes(p.sg))) suonoDrago("evviva"); });
  }
};

// ── il drago, con le sue reazioni ────────────────────────────────────────
dragoPix = function (g, t) {
  const { W, H } = g, P = PIX.meta.pal, D = PIX.meta.drago, seg = Object.keys(V.visti).length;
  const sveglio = S.crollo && t >= S.crollo.t0 - .25 && t - S.crollo.t0 < 2.6;
  const resp = Math.floor(t * 1.2) % 2;
  let fr = seg ? "agita" + resp : "dorme" + resp, scuoti = 0;
  const vi = S.vicino && t - S.vicino.t0 < DUR_VICINO[S.vicino.tipo] ? S.vicino : null, e = vi ? t - vi.t0 : 0;
  if (sveglio) { const ec = t - S.crollo.t0; fr = ec < .35 ? "artiglio1" : ec < 1.0 ? "ruggito" : "sveglio" + (Math.floor(t * 8) % 2); }
  else if (vi) {
    if (vi.tipo === "SBADIGLIO") fr = e < .45 ? "sbadiglio0" : e < 1.45 ? "sbadiglio1" : "sbadiglio0";
    else if (vi.tipo === "STARNUTO") { fr = e < .8 ? "starnuto0" : e < 1.15 ? "starnuto1" : "agita0"; if (e < .8) scuoti = Math.floor(t * 20) % 2; }
    else if (vi.tipo === "CODA") fr = e < .5 ? "coda0" : e < 1.3 ? "coda1" : "coda0";
    else if (vi.tipo === "RUSSATA") fr = Math.floor(e / .45) % 2 ? "russata1" : "russata0";
    else if (vi.tipo === "ARTIGLIO") fr = e < .9 ? "artiglio0" : e < 1.45 ? "artiglio1" : "agita0";
  } else if (t - S.orecchio < .5) fr = "orecchio";
  const sc = S.gruppo >= 6 && W > 150 ? 2 : 1;
  // quanto si vede: cresce scendendo; durante una reazione o il risveglio il drago "sale" in scena (spinta della camera)
  const base = Math.min(D.h * sc, 22 + (S.gruppo + 1) * 5 * sc + seg * 4), voluto = sveglio ? D.h * sc : vi ? Math.max(base, D.h * sc * .8) : base;
  S.dragoVis = S.dragoVis == null ? voluto : S.dragoVis + (voluto - S.dragoVis) * (RM ? 1 : .12);
  const vis = Math.round(S.dragoVis);
  const x = Math.round(W / 2 - D.w * sc / 2) + scuoti, y = Math.round(H - vis - (sveglio ? 10 : 0));
  cx.drawImage(img("drago"), D.frame.indexOf(fr) * D.w, 0, D.w, D.h, x, y, D.w * sc, D.h * sc);
  cx.globalCompositeOperation = "lighter"; cx.globalAlpha = .18 + .08 * resp + seg * .03 + (sveglio ? .3 : 0) + (vi ? .1 : 0);
  const pr = 18 * sc; cx.drawImage(pozza(pr, P.f2), x + D.pancia[0] * sc - pr, y + D.pancia[1] * sc - pr);
  cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
  const nx = x + D.naso[0] * sc, ny = y + D.naso[1] * sc;
  // le «Z» del sonno (si fermano quando si agita)
  if (!vi && !sveglio && !RM && t - S.ultimaZ > (seg ? 2.6 : 1.6)) { S.ultimaZ = t; S.zeta.push({ x: nx + 4, y: ny - 8, t0: t, big: false }); }
  if (vi && vi.tipo === "RUSSATA" && Math.floor(e / .45) !== Math.floor((e - (dtUltimo || .016)) / .45)) S.zeta.push({ x: nx + 2, y: ny - 10, t0: t, big: true });
  for (const z of S.zeta) { const ez = t - z.t0; cx.globalAlpha = Math.max(0, 1 - ez / 2); pixTesto(cx, "Z", z.x + Math.round(Math.sin(ez * 3) * 3 + ez * (z.big ? 18 : 8)), z.y - Math.round(ez * (z.big ? 22 : 12)), P.cie, z.big ? 2 : 1, true); }
  cx.globalAlpha = 1; S.zeta = S.zeta.filter((z) => t - z.t0 < 2);
  // fumo dalle narici (di piu' a ogni segno); lo starnuto spara una nuvola sul sentiero
  if (!RM && Math.random() < .03 + seg * .04) S.fumi.push({ x: nx, y: ny, t0: t, vx: -6, vy: -14 });
  if (vi && vi.tipo === "STARNUTO" && e > .8 && e < .95 && !RM) for (let k = 0; k < 10; k++) S.fumi.push({ x: nx, y: ny, t0: t, vx: -20 - Math.random() * 40, vy: -40 - Math.random() * 60, big: 1 });
  for (const f of S.fumi) { const ef = t - f.t0, r2 = (f.big ? 3 : 1) + Math.floor(ef * (f.big ? 4 : 2)); cx.fillStyle = "rgb(" + (ef < .8 ? P.fu1 : P.fu0) + ")"; cx.globalAlpha = Math.max(0, 1 - ef / 2); cx.fillRect(Math.round(f.x + (f.vx || -6) * ef), Math.round(f.y + (f.vy || -14) * ef), r2, r2); }
  cx.globalAlpha = 1; S.fumi = S.fumi.filter((f) => t - f.t0 < 2);
  // l'artiglio graffia l'oro: polvere dorata
  if (vi && vi.tipo === "ARTIGLIO" && e < .9 && !RM && Math.random() < .5) S.polvere.push({ x: x + 34 * sc + Math.random() * 10, y: y + 56 * sc, t0: t, vx: (Math.random() - .5) * 30, vy: -20 - Math.random() * 20 });
  for (const q of S.polvere) { const ep = t - q.t0; cx.fillStyle = "rgb(" + (ep < .3 ? P.o3 : P.p3) + ")"; cx.globalAlpha = Math.max(0, 1 - ep); cx.fillRect(Math.round(q.x + q.vx * ep), Math.round(q.y + q.vy * ep + ep * ep * 30), 1, 1); }
  cx.globalAlpha = 1; S.polvere = S.polvere.filter((q) => t - q.t0 < 1);
  // la coda che spazza vicino al sentiero
  if (vi && vi.tipo === "CODA" && e > .45 && e < 1.2 && !RM) {
    const k = (e - .45) / .75, cam = Math.round(S.cam), { gx, gy } = centroGruppo(g), ty = gy - cam + 14;
    for (let i = 0; i < 18; i++) { const u = i / 17, xx = W + 20 - (W + 60) * Math.min(1, k * 1.3) + u * 50, yy = ty + Math.sin(u * 3) * 6, rr2 = Math.max(1, 6 - u * 4) | 0; cx.fillStyle = "rgb(" + P.notte + ")"; cx.fillRect(Math.round(xx) - rr2 - 1, Math.round(yy) - rr2 - 1, rr2 * 2 + 2, rr2 * 2 + 2); cx.fillStyle = "rgb(" + (i % 4 ? P.d2 : P.o2) + ")"; cx.fillRect(Math.round(xx) - rr2, Math.round(yy) - rr2, rr2 * 2, rr2 * 2); }
  }
  // il risveglio: la vampata mirata al gruppo che spazza tutto il sentiero
  if (sveglio) {
    const ec = t - S.crollo.t0, cam = Math.round(S.cam), { gx, gy } = centroGruppo(g);
    const mx = x + D.bocca[0] * sc, my = y + D.bocca[1] * sc - 14;
    if (ec > .35 && ec < 1.7 && !RM) for (let i = 0; i < 18; i++) {
      const tx = gx + Math.sin(ec * 5) * 34 + (Math.random() - .5) * 20, ty = gy - cam - 12 + (Math.random() - .5) * 16, d = Math.hypot(tx - mx, ty - my) || 1, v = d / (.3 + Math.random() * .15);
      S.fiamme.push({ x: mx, y: my, vx: (tx - mx) / d * v, vy: (ty - my) / d * v, t0: t });
    }
    if (ec > .35 && ec < 1.7) { cx.globalCompositeOperation = "lighter"; cx.globalAlpha = .25; cx.drawImage(pozza(40, P.f2), gx - 40, gy - cam - 52); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over"; }
  }
  for (const f of S.fiamme) { const ef = t - f.t0, col = ef < .12 ? P.f3 : ef < .3 ? P.f2 : ef < .5 ? P.f1 : P.f0, s2 = ef < .25 ? 4 : ef < .45 ? 3 : 2; cx.fillStyle = "rgb(" + col + ")"; cx.fillRect(Math.round(f.x + f.vx * ef) - (s2 >> 1), Math.round(f.y + f.vy * ef) - (s2 >> 1), s2, s2); }
  S.fiamme = S.fiamme.filter((f) => t - f.t0 < .6);
};
let dtUltimo = .016;

// ── il gruppo durante le reazioni: congelati, chinati, traballanti; e l'arrosto ──
const disegnaPrimaDrago = disegna;
const botPixBase = botPix;
botPix = function (sg, frame) {
  const vi = S.vicino && SIM - S.vicino.t0 < DUR_VICINO[S.vicino.tipo] ? S.vicino : null;
  if (vi && V && (V.giocatori[sg] || {}).dentro && /^(idle|resta|paura)/.test(frame)) {
    if (vi.tipo === "SBADIGLIO") frame = "paura0";                                   // immobili
    else if (vi.tipo === "CODA") frame = "paura" + (Math.floor(SIM * 12) % 2);       // si abbassano
    else if (vi.tipo === "STARNUTO" || vi.tipo === "ARTIGLIO") frame = "paura" + (Math.floor(SIM * 10) % 2);
  }
  return botPixBase(sg, frame);
};
// i cappelli che volano via con lo starnuto, e i ladri arrostiti
function disegnaExtra(g, t) {
  const P = PIX.meta.pal, cam = Math.round(S.cam);
  for (const h of S.cappelli) {
    const e = t - h.t0; if (e < 0) continue;
    const x = Math.round(h.x - e * 18), y = Math.round(h.y - cam - 26 * e + 40 * e * e);
    const scuri = ["lav_", "man_", "men_", "cor_", "cie_", "gir_", "rub_", "per_"];
    cx.fillStyle = "rgb(" + P.notte + ")"; cx.fillRect(x - 4, y - 1, 9, 7); cx.fillStyle = "rgb(" + P[scuri[h.sg % 8]] + ")"; cx.fillRect(x - 2, y, 5, 4); cx.fillRect(x - 3, y + 4, 7, 1);
  }
  S.cappelli = S.cappelli.filter((h) => t - h.t0 < 1.3);
  // quelli gia' al campo durante il risveglio: esultano al sicuro
  if (S.crollo && t - S.crollo.t0 < 2.6 && V) {
    const base = posT(-1, g), salvi = V.giocatori.filter((p) => !p.dentro && !S.cadono.some((c) => c.sg === p.sg)).slice(0, 4);
    salvi.forEach((p, j) => cx.drawImage(botPixBase(p.sg, "festa" + (Math.floor(t * 4 + j) % 2)), base.x - 30 + j * 14, base.y - 34 - cam));
  }
}
// i ladri colpiti dalla vampata: lampo bianco, carbonizzati che fumano, cappello che salta, poi scappano tossendo verso il campo
function arrosto(g, t) {
  const P = PIX.meta.pal, cam = Math.round(S.cam), car = img("bot_carbone"); if (!car) return;
  for (const c of S.cadono) {
    const e = t - c.t0; if (e < 0) continue;
    const x0 = Math.round(c.x), y0 = Math.round(c.y + 15 - cam);
    if (e < .45) {
      cx.drawImage(botPixBase(c.sg, "paura" + (Math.floor(t * 16) % 2)), x0 - 10, y0 - 30);
      if (Math.floor(t * 16) % 2) { cx.globalCompositeOperation = "lighter"; cx.globalAlpha = .8; cx.drawImage(botPixBase(c.sg, "paura0"), x0 - 10, y0 - 30); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over"; }
    } else if (e < 1.15) {
      cx.drawImage(car, (Math.floor(t * 6) % 2) * 20, 0, 20, 30, x0 - 10, y0 - 30, 20, 30);
      if (!c.fumo || t - c.fumo > .12) { c.fumo = t; S.fumi.push({ x: x0 + (Math.random() - .5) * 8, y: y0 - 26, t0: t, vx: (Math.random() - .5) * 8, vy: -20 }); }
      const eh = e - .45; const hx = x0 + Math.round(eh * 10), hy = y0 - 34 - Math.round(30 * eh - 50 * eh * eh);
      cx.fillStyle = "rgb(" + P.notte + ")"; cx.fillRect(hx - 3, hy, 7, 6); cx.fillStyle = "rgb(" + P.g1 + ")"; cx.fillRect(hx - 2, hy + 1, 5, 4);
    } else {
      const er = (e - 1.15) / 1.25, xx = Math.round(x0 + Math.sin(er * 12) * 2), yy = Math.round(y0 - er * 70);
      cx.globalAlpha = Math.max(0, 1 - er * .9); cx.drawImage(car, (2 + Math.floor(t * 10) % 4) * 20, 0, 20, 30, xx - 10, yy - 30, 20, 30); cx.globalAlpha = 1;
      if (Math.random() < .2) S.fumi.push({ x: xx, y: yy - 26, t0: t, vx: 0, vy: -10 });
    }
  }
}
disegna = function () {
  // il disegno di base, ma i caduti li disegniamo noi (arrosto) e lo vento delle russate scuote il gruppo
  const cadutiVeri = S.cadono; S.cadono = [];
  const vi = S.vicino && SIM - S.vicino.t0 < DUR_VICINO[S.vicino.tipo] ? S.vicino : null;
  let spinta = 0; if (vi && !RM) { if (vi.tipo === "RUSSATA") spinta = Math.round(Math.sin(SIM * 18) * 2); if (vi.tipo === "SBADIGLIO" || vi.tipo === "ARTIGLIO") S.camOff = (S.camOff || 0) * .9 + 8 * .1; }
  cx.save(); cx.translate(spinta, 0);
  disegnaPrimaDrago();
  cx.restore();
  S.cadono = cadutiVeri.concat(S.cadono);   // i caduti aggiunti durante il disegno (dalla scaletta) non si perdono
  if (!PIX.meta || !V) return;
  const g = geo(), t = SIM;
  arrosto(g, t); disegnaExtra(g, t);
  S.cadono = S.cadono.filter((c) => t - c.t0 < 7);
};
// requestAnimationFrame dentro il disegno di base chiama «disegna» per nome: ora e' questa versione
