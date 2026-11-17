// NON SVEGLIARE IL DRAGO - BRUCIATI: PERDONO TUTTO (richiesta del proprietario, 16/11 sera).
// Prima della vampata ogni ladro sul sentiero mostra il suo sacco (moneta + quanto porta).
// Quando la vampata lo colpisce il sacco SCOPPIA: le monete volano indietro nel tesoro del drago, il numero diventa
// rosso e barrato, sopra la testa esce un grande «-N» rosso; la sua scheda in basso lampeggia rossa col numero barrato
// che poi va a 0; la targa dice «BRUCIATI! perdono tutto quello che portavano (-N)». Non allunga la sequenza.
// Si carica dopo scena_orizzontale.js.
"use strict";
const PERD = { voci: null };      // sg -> quanto portava; impostato al crollo
const TPERD = { scoppio: .3 };    // secondi dopo il colpo della vampata (TW.colpo)
const TXT_PERD = {
  it: { tit: "BRUCIATI!", tutto: (n) => "perdono tutto quello che portavano (-" + n + ")", vuoti: "sacchi vuoti: non perdono niente", io: (n) => "hai perso tutto quello che portavi: -" + n },
  en: { tit: "BURNT!", tutto: (n) => "they lose everything they carried (-" + n + ")", vuoti: "empty bags: nothing to lose", io: (n) => "you lost everything you carried: -" + n },
};
const tp = () => TXT_PERD[LINGUA === "it" ? "it" : "en"];

// 1. al crollo: ci segniamo quanto portava ognuno; via le monete cadenti e il «-n» di base (li facciamo noi, al momento giusto)
const eventoPrimaPerd = evento;
evento = function (e, anima) {
  eventoPrimaPerd(e, anima);
  if (!anima || e.k !== "carta" || !e.crollo) return;
  const voci = {}; Object.entries(e.div).forEach(([s, q]) => { voci[+s] = Math.max(0, -q); });
  dopo(1.17, () => {
    PERD.voci = voci; PERD.t0 = S.crollo ? S.crollo.t0 : SIM;
    S.schegge = S.schegge.filter((x) => x.t0 < SIM + .5);
    S.scritte = S.scritte.filter((x) => !(x.col === "#ff6b60" && x.t0 > SIM + .5));
    const tot = Object.values(voci).reduce((a, b) => a + b, 0), io = V && voci[V.io];
    dopo(TW.colpo + TPERD.scoppio - .02, () => {
      annuncia(tp().tit, tot ? (io ? tp().io(io) : tp().tutto(tot)) : tp().vuoti, 2600, "rosso");
      if (tot) suona("pericolo");
    });
  });
};
// 2. la scheda in basso: il sacco non si svuota al crollo ma quando la vampata colpisce: lampo rosso, numero barrato, poi 0
const contatorePrimaPerd = contatore;
contatore = function (sg, chi, delta, col, testoPiu) {
  const n = -delta;
  if (chi !== "sacco" || !(n > 0) || !S.crollo || Math.abs(SIM - S.crollo.t0) > .05) return contatorePrimaPerd(sg, chi, delta, col, testoPiu);
  attendi(sg, 1);
  dopo(TW.colpo + TPERD.scoppio, () => {
    document.querySelectorAll('.gioc[data-sg="' + sg + '"]').forEach((el) => {
      el.classList.remove("brucia"); void el.offsetWidth; el.classList.add("brucia");
      const sa = el.querySelector(".sacco"); if (sa) { sa.classList.remove("vuoto"); sa.classList.add("barrato"); }
      const p = el.querySelector(".piu"); if (p) { p.textContent = "-" + n; p.style.color = "#ff6b60"; p.classList.remove("va"); void p.offsetWidth; p.classList.add("va"); }
    });
    dopo(.9, () => {
      document.querySelectorAll('.gioc[data-sg="' + sg + '"] .sacco').forEach((sa) => sa.classList.remove("barrato"));
      contatorePrimaPerd(sg, "sacco", delta, col, null); fatto(sg);
      dopo(1.1, () => document.querySelectorAll('.gioc[data-sg="' + sg + '"]').forEach((el) => el.classList.remove("brucia")));
    });
  });
};
(function () {
  const st = document.createElement("style");
  st.textContent = ".gioc.brucia{animation:brucia .3s steps(1) 6}" +
    "@keyframes brucia{0%{background:#6a1414;border-color:#ff6b60;box-shadow:0 0 0 2px #ff6b60}50%{background:#2a0c0c;border-color:#a33}}" +
    ".gioc.brucia .sacco{display:inline-flex!important;opacity:1!important;color:#ff6b60!important}.gioc.brucia{border-color:#ff6b60!important}" +
    ".gioc .sacco.barrato b{color:#ff6b60;text-decoration:line-through;text-decoration-thickness:2px}.gioc .sacco.barrato{color:#ff6b60;opacity:1}";
  document.head.appendChild(st);
})();
// 3. in scena: il sacco sopra ognuno, lo scoppio, le monete che tornano nel tesoro, il «-N»
function perditaScena(g, t) {
  if (!S.crollo || !PERD.voci || !PIX.meta || PERD.t0 !== S.crollo.t0) return;
  const e0 = t - S.crollo.t0 - TW.colpo; if (e0 > 2.4) return;
  const P = PIX.meta.pal, D = PIX.meta.drago, L = lay(g), cad = S.cadono.filter((c) => PERD.voci[c.sg] != null);
  if (!cad.length) return;
  const molti = cad.length > 4, sc = molti ? 1 : 2, alto = sc * 7;
  const ordine = cad.slice().sort((a, b) => a.x - b.x);
  const base = Math.min(...cad.map((c) => Math.round(c.y + 15) - 30)) - 4;   // una riga comune sopra a tutte le teste
  // a livelli: ogni scritta va sul livello piu' basso dove non tocca la vicina (anche col gruppo su due file)
  const prima = e0 < TPERD.scoppio, larg = (c) => prima ? 9 + pixLargo(String(PERD.voci[c.sg]), 1) + 1 : pixLargo("-" + PERD.voci[c.sg], sc) + 2;
  const fine = [], livello = new Map();
  for (const c of ordine) { if (!PERD.voci[c.sg]) continue; const w = larg(c), sx = c.x - w / 2; let l = 0; while (fine[l] != null && fine[l] > sx - 2) l++; fine[l] = sx + w; livello.set(c, l); }
  cx.save(); cx.beginPath(); cx.rect(0, PIX.hudB || 0, g.W, Math.max(0, (PIX.zonaTop || g.H) - (PIX.hudB || 0))); cx.clip();
  ordine.forEach((c, r) => {
    const n = PERD.voci[c.sg], x0 = Math.round(c.x), piedi = Math.round(c.y + 15), testa = piedi - 30;
    const sopra = base - (livello.get(c) || 0) * ((prima ? 9 : alto) + 3);
    if (e0 < TPERD.scoppio) {                                               // prima: il sacco con quanto porta
      if (e0 < -1.6 || !n) return;
      const s = String(n), w = 9 + pixLargo(s, 1) + 1;
      cx.drawImage(img("moneta"), 0, 0, 9, 9, x0 - w / 2 | 0, sopra - 8, 9, 9); pixTesto(cx, s, (x0 - w / 2 | 0) + 10, sopra - 7, P.bianco, 1, true, "l");
      if (window.__audit) PIX.box.push(["perdita", (x0 - w / 2 | 0), sopra - 8, w, 9]);
      return;
    }
    const ep = e0 - TPERD.scoppio;
    if (!n) return;
    // lo scoppio: un anello di pixel dorati per un attimo
    if (ep < .18 && !RM) { cx.fillStyle = "rgb(" + P.o3 + ")"; for (let a = 0; a < 12; a++) { const an = a / 12 * Math.PI * 2, rr = 3 + ep * 40; cx.fillRect(Math.round(x0 + Math.cos(an) * rr), Math.round(sopra - 4 + Math.sin(an) * rr * .7), 1, 1); } }
    // il «-N» rosso: salta su e resta finche' scappano
    const s = "-" + n, w = pixLargo(s, sc), salta = RM ? 0 : Math.round(Math.max(0, .12 - ep) * 30);
    const fade = ep > 1.7 ? Math.max(0, 1 - (ep - 1.7) / .4) : 1;
    const xx = Math.max(w / 2 + 1, Math.min(g.W - w / 2 - 1, x0));
    cx.globalAlpha = fade; pixTesto(cx, s, Math.round(xx), sopra - alto - salta, rgbDi("#ff5a4e"), sc, true); cx.globalAlpha = 1;
    if (window.__audit && fade > .3) PIX.box.push(["perdita", Math.round(xx - w / 2) - 1, sopra - alto - salta - 1, w + 2, alto + 2]);
  });
  cx.restore();
  // le monete tornano nel tesoro del drago (volano sopra la vampata e cadono nel mucchio d'oro)
  if (e0 >= TPERD.scoppio) {
    const ep = e0 - TPERD.scoppio, dxr = dragoX(g);
    ordine.forEach((c, r) => {
      const n = Math.min(PERD.voci[c.sg], 8);
      for (let k = 0; k < n; k++) {
        const t1 = ep - k * .05 - r * .03, dur = .8; if (t1 < 0 || t1 > dur + .25) continue;
        const q = Math.min(1, t1 / dur), ax = c.x, ay = c.y - 20, bx = dxr + 40 + ((k * 13 + r * 7) % 46), by = L.zt - 6;
        const x = ax + (bx - ax) * q, y = ay + (by - ay) * q - Math.sin(q * Math.PI) * (34 + (k % 3) * 6);
        if (q < 1) cx.drawImage(img("moneta"), (Math.floor(t * 14 + k) % 6) * 9, 0, 9, 9, Math.round(x) - 4, Math.round(y) - 4, 9, 9);
        else { cx.fillStyle = "rgb(" + P.o3 + ")"; cx.globalAlpha = 1 - (t1 - dur) / .25; cx.fillRect(Math.round(bx) - 1, Math.round(by) - 3, 3, 1); cx.fillRect(Math.round(bx), Math.round(by) - 4, 1, 3); cx.globalAlpha = 1; }
      }
    });
  }
}
const disegnaPrimaPerd = disegna;
disegna = function () { disegnaPrimaPerd(); if (V && PIX.meta) { try { perditaScena(geo(), SIM); } catch (x) { console.warn(x); } } };
