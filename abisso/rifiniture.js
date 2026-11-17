// NON SVEGLIARE IL DRAGO - correzioni del proprietario (17/11), valgono per TUTTE le modalita'.
// 1. Le tessere del sentiero si leggono: bordo chiaro in cima e alzata di pietra davanti (sembrano gradini).
// 2. Gli AVANZI sul sentiero hanno una corsia loro, sul pavimento DAVANTI ai piedi: mucchio + numero su una targhetta,
//    mai coperti dai ladri, mai uno sopra l'altro (si scostano; un filo li lega alla loro tessera se spostati).
// 3. La vampata finisce bene: punta arrotondata che avvolge il gruppo, poi si assottiglia, sbiadisce a retino e sale in fumo.
"use strict";

// ── 1. tessere leggibili ──
function tesseraChiara(src) {
  const P = PIX.meta.pal, w = src.width, h = src.height, c = tela(w, h + 4), x = c.getContext("2d");
  x.drawImage(src, 0, 0);
  const d = x.getImageData(0, 0, w, h + 4).data, pieno = (xx, yy) => yy >= 0 && yy < h + 4 && d[(yy * w + xx) * 4 + 3] > 0;
  for (let xx = 0; xx < w; xx++) {
    let top = -1, bot = -1;
    for (let yy = 0; yy < h; yy++) if (pieno(xx, yy)) { if (top < 0) top = yy; bot = yy; }
    if (top < 0) continue;
    // alzata di pietra: 3 pixel sotto il bordo, luce a sinistra, ombra a destra, filo nero in fondo
    const lato = xx < w * .3 ? P.p2 : xx < w * .75 ? P.p1 : P.p0;
    pxc(x, lato, xx, bot, 1, 3); pxc(x, P.nero, xx, bot + 3, 1, 1);
    if ((xx + 1) % 7 === 0) pxc(x, P.p0, xx, bot, 1, 3);            // fughe fra i blocchi
    // il bordo in cima: una riga chiara subito sotto il contorno
    if (top + 1 < bot) pxc(x, xx > 2 && xx < w - 3 ? P.p3 : P.p2, xx, top + 1, 1, 1);
  }
  return c;
}
const caricaPrimaRif = caricaTutto;
caricaTutto = async function () {
  await caricaPrimaRif();
  for (let i = 0; i < 4; i++) { const t = PIX.img["tessera" + i]; if (t && !t.chiara) { const c = tesseraChiara(t); c.chiara = 1; PIX.img["tessera" + i] = c; IMG["piastra" + i] = c; } }
};

// ── 2. la corsia degli avanzi ──
const mucchioPrimaRif = mucchioPix;
mucchioPix = function (m, g, t) { if (m.grande) return mucchioPrimaRif(m, g, t); };   // i mucchi fermi li disegna la corsia
function corsiaAvanzi(g, t) {
  if (!V || !PIX.meta) return;
  const P = PIX.meta.pal, voci = [], visti = new Set();
  for (const m of S.mucchi) {
    if (m.grande || visti.has(m.i) || t < m.t0) continue;
    const v = m.val(); if (v <= 0) continue;
    if (S.crollo && m.i === S.crollo.i && t > S.crollo.t0) continue;
    visti.add(m.i);
    const p = posT(m.i, g), ic = v >= 9 ? img("mucchio_m") : img("mucchio_s"), lab = String(v);
    const w = ic.width + 3 + pixLargo(lab) + 4;
    voci.push({ i: m.i, v, ic, lab, w, x0: p.x, px: p.x, py: p.y });
  }
  if (!voci.length) return;
  voci.sort((a, b) => a.i - b.i);
  // posizione voluta: centrata sotto la sua tessera; poi si scostano (da destra a sinistra, poi da sinistra a destra)
  for (const q of voci) q.x = Math.round(q.x0 - q.w / 2);
  for (let k = voci.length - 2; k >= 0; k--) voci[k].x = Math.min(voci[k].x, voci[k + 1].x - voci[k].w - 2);
  let fine = 2;
  for (const q of voci) { q.x = Math.max(q.x, fine); fine = q.x + q.w + 2; }
  // mai sotto i piedi del gruppo: le tessere vecchie stanno piu' in alto, quindi la corsia scende almeno sotto i piedi piu' bassi
  let piedi = -1e9; { const { gx, gy } = centroGruppo(g); for (const sg of nelGruppo()) piedi = Math.max(piedi, posBot(sg, g, gx, gy).y); }
  const yLane = (q) => Math.max(q.py + 16, piedi + 5);
  for (const q of voci) {
    const y = yLane(q), h = Math.max(9, q.ic.height + 2), x = q.x;
    if (x > g.W) continue;
    // il filo verso la tessera, se la targhetta e' scostata
    const cxq = x + q.w / 2;
    if (Math.abs(cxq - q.px) > 6 && q.px > 0 && q.px < g.W) for (let yy = q.py + 6; yy < y - 1; yy += 2) pxc(cx, P.o1, Math.round(q.px), yy, 1, 1);
    pxc(cx, P.nero, x - 1, y - 1, q.w + 2, h + 2); pxc(cx, P.notte, x, y, q.w, h);
    pxc(cx, P.o0, x, y, q.w, 1); pxc(cx, P.o0, x, y + h - 1, q.w, 1);
    cx.drawImage(q.ic, x + 2, y + h - q.ic.height - 1);
    pixTesto(cx, q.lab, x + 2 + q.ic.width + 2, y + Math.round((h - 7) / 2), P.o3, 1, false, "l");
    if (window.__audit) PIX.box.push(["avanzo", x - 1, y - 1, q.w + 2, h + 2]);
  }
}
const disegnaPrimaRif = disegna;
disegna = function () {
  disegnaPrimaRif();
  if (!PIX.meta || !V) return;
  try { corsiaAvanzi(geo(), SIM); } catch (e) { console.warn(e); }
};
// i consigli del tutorial scendono sotto la corsia degli avanzi
piazzaCoach = function () {
  const co = document.getElementById("coach"); if (!co || !PIX.zonaTop) return;
  const rc = cv.getBoundingClientRect(), k = rc.height / cv.height, top = Math.round(rc.top + (PIX.zonaTop + 22) * k), mh = Math.max(56, Math.round(rc.bottom - top - 6));
  const s = top + "|" + mh; if (co.dataset.oriz === s) return; co.dataset.oriz = s;
  co.style.top = top + "px"; co.style.bottom = "auto"; co.style.maxHeight = mh + "px"; co.style.overflow = "auto";
};

// ── 3. la vampata che finisce bene ──
// 0-.25 s la punta corre al gruppo; resta piena fino a 1,05 s; da 1,05 a 1,65 si assottiglia e sbiadisce a retino
// (prima il nucleo, poi il bordo), dal 1,3 la coda si stacca dalla bocca che si chiude; braci e fumo salgono e svaniscono.
getto = function (et, x, y, sc, t, P) {
  const bb = (PIX.meta.drago.bocche || {})[PIX.dragoFr] || (PIX.meta.drago.bocche || {})["soffio30_0"] || (PIX.meta.drago.bocche || {})["su4"]; if (!bb || !S.mira) return;
  if (!S.bocca || et < .05) S.bocca = { x: x + bb[0] * sc, y: y + bb[1] * sc };     // la bocca resta dov'era anche quando il collo riscende
  const mx = S.bocca.x, my = S.bocca.y, tx = S.mira.tx, ty = S.mira.ty, L0 = Math.hypot(tx - mx, ty - my) || 1;
  const dx = (tx - mx) / L0, dy = (ty - my) / L0, nx = -dy, ny = dx;
  const L = L0 + 12;                                        // la vampata avvolge il fronte del gruppo
  const vita = et < 1.05 ? 1 : Math.max(0, 1 - (et - 1.05) / .6);
  if (vita <= 0) return;
  const punta = Math.min(1, et / .25) * L, coda = et > 1.3 ? Math.min(L * .7, (et - 1.3) / .35 * L * .7) : 0;
  for (let s2 = coda; s2 <= punta; s2 += 1) {
    const k = s2 / L, ond = Math.sin(s2 * .1 - t * 18) * (.3 + k * 1.1), cxp = mx + dx * s2 + nx * ond, cyp = my + dy * s2 + ny * ond;
    // il getto si allarga in punta (sbuffo che avvolge) e si arrotonda: niente taglio netto
    const fiore = s2 > L0 - 14 ? (s2 - (L0 - 14)) * .45 : 0;
    let bordo = (2 + s2 * .2 + fiore + (((Math.floor(t * 20) * 7 + Math.floor(s2 / 5) * 3) % 4) === 0 ? 1 : 0)) * (.45 + .55 * vita);
    const dallaPunta = punta - s2;
    if (dallaPunta < bordo) bordo = Math.sqrt(Math.max(0, bordo * bordo - (bordo - dallaPunta) * (bordo - dallaPunta)));   // punta tonda
    const dallaCoda = s2 - coda;
    if (coda > 0 && dallaCoda < 6) bordo *= dallaCoda / 6;                               // anche la coda si chiude morbida
    const nucleo = Math.max(1.2, bordo * .38 - k * 1.2) * vita;
    for (let w = -Math.ceil(bordo); w <= Math.ceil(bordo); w += 1) {
      const px = Math.round(cxp + nx * w), py = Math.round(cyp + ny * w), a2 = Math.abs(w) / Math.max(.5, bordo);
      if (a2 > 1) continue;
      // retino: man mano che si spegne restano sempre meno pixel, prima ai bordi
      if (vita < 1 && BAY[py & 3][px & 3] > vita * 16 + (1 - a2) * 5 - 2) continue;
      const col = a2 < nucleo / Math.max(.5, bordo) ? (vita > .7 ? (k < .3 ? P.bianco : P.f3) : P.f2) : a2 < .7 ? (vita > .4 ? P.f2 : P.f1) : (BAY[py & 3][px & 3] > 7 ? P.f1 : P.f0);
      cx.fillStyle = "rgb(" + col + ")"; cx.fillRect(px, py, 1, 1);
    }
  }
  // fumo e braci dove arriva; mentre si spegne, braci e fumo salgono da tutto il getto
  if (!RM && et < 1.5 && Math.random() < .8) S.fumi.push({ x: mx + dx * Math.min(punta, L0) + (Math.random() - .5) * 8, y: my + dy * Math.min(punta, L0) - 4, t0: t, vx: (Math.random() - .5) * 16, vy: -16 - Math.random() * 16 });
  if (!RM && vita < 1) for (let j = 0; j < 2; j++) {
    const s2 = coda + Math.random() * Math.max(1, punta - coda);
    if (Math.random() < .5) S.fumi.push({ x: mx + dx * s2, y: my + dy * s2 - 2, t0: t, vx: (Math.random() - .5) * 10, vy: -14 - Math.random() * 14, big: Math.random() < .3 ? 1 : 0 });
    else S.fiamme.push({ x: mx + dx * s2 + (Math.random() - .5) * 6, y: my + dy * s2, vx: (Math.random() - .5) * 12, vy: -20 - Math.random() * 25, t0: t, strato: 1 });
  }
  cx.globalCompositeOperation = "lighter"; cx.globalAlpha = .18 * vita; cx.drawImage(pozza(30, P.f2), Math.round(mx + dx * Math.min(punta, L0) - 30), Math.round(my + dy * Math.min(punta, L0) - 30)); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
};
// il getto si disegna fino allo spegnimento completo (1,65 s dopo l'inizio del fuoco)
const effettiPrimaRif = effettiRisveglio;
effettiRisveglio = function (g, t) {
  effettiPrimaRif(g, t);
  const e = svegliaE(t);
  if (e < 0) { S.bocca = null; return; }
  const et = e - TW.fuoco;
  if (et >= TW.finefuoco - TW.fuoco + .35 && et < 1.7 && PIX.dragoRect) { const [x, y, w] = PIX.dragoRect; getto(et, x, y, w / PIX.meta.drago.w, t, PIX.meta.pal); }
};
