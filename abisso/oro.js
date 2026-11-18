// NON SVEGLIARE IL DRAGO - ORO CHIARO (17/11, richiesta del proprietario: «tornando su prende le monete ma il segno resta»).
// 1. La corsia degli avanzi legge il MOTORE (V.strada[i].resto), non i mucchi animati: ogni tessera con avanzi ha la sua
//    targhetta col numero, anche quelli lasciati da SACCO BUCATO / PATTO o visti dopo un rientro. Durante il ritorno tiene
//    il numero di prima finche' i ladri non arrivano (ORO.tiene, ritorno.js), poi mostra il resto con «RESTA n» (ORO.lampo).
//    Numero grande sul telefono (pixel 2x), normale sul PC.
// 2. Sul tasto TORNA SU l'anteprima: «+12 se torni da solo» (sacco + avanzi del sentiero + reliquie, + uovo), con l'icona
//    del forziere se una reliquia la prenderesti da solo. Segue quello che si VEDE (mai in anticipo sulle animazioni).
"use strict";

// ── 1. la corsia degli avanzi ──
function avanziVisibili(t) {
  const out = [];
  if (!V || !V.strada) return out;
  V.strada.forEach((c, i) => {
    let v = c.resto || 0;
    if (ORO.tiene[i] != null) v = ORO.tiene[i];
    if (v <= 0 || i > S.gruppo) return;
    if (S.mucchi.some((m) => m.grande && m.i === i)) return;            // il mucchio grande (divisione o raccolta) c'e' gia'
    if (S.crollo && i === S.crollo.i && t > S.crollo.t0) return;
    out.push({ i, v });
  });
  return out;
}
corsiaAvanzi = function (g, t) {
  if (!V || !PIX.meta) return;
  const P = PIX.meta.pal, sc = (PIX.PX || 3) < 2.5 ? 2 : 1, voci = [];
  for (const a of avanziVisibili(t)) {
    const p = posT(a.i, g), lam = ORO.lampo[a.i] != null && t - ORO.lampo[a.i] < 1.8 && t >= ORO.lampo[a.i];
    const ic = a.v >= 9 ? img("mucchio_m") : img("mucchio_s"), lab = String(a.v);
    const w = ic.width + 3 + pixLargo(lab, sc) + 4;
    voci.push({ i: a.i, v: a.v, ic, lab, w, lam, x0: p.x, px: p.x, py: p.y });
  }
  if (!voci.length) return;
  voci.sort((a, b) => a.i - b.i);
  // posizione voluta: centrata sotto la sua tessera; poi si scostano (da destra a sinistra, poi da sinistra a destra)
  for (const q of voci) q.x = Math.round(q.x0 - q.w / 2);
  for (let k = voci.length - 2; k >= 0; k--) voci[k].x = Math.min(voci[k].x, voci[k + 1].x - voci[k].w - 2);
  let fine = 2;
  for (const q of voci) { q.x = Math.max(q.x, fine); fine = q.x + q.w + 2; }
  // mai sotto i piedi del gruppo
  let piedi = -1e9; { const { gx, gy } = centroGruppo(g); for (const sg of nelGruppo()) piedi = Math.max(piedi, posBot(sg, g, gx, gy).y); }
  const h = Math.max(9, 7 * sc + 4);
  for (const q of voci) {
    const y = Math.max(q.py + 16, piedi + 5), x = q.x;
    if (x > g.W) continue;
    const cxq = x + q.w / 2;
    if (Math.abs(cxq - q.px) > 6 && q.px > 0 && q.px < g.W) for (let yy = q.py + 6; yy < y - 1; yy += 2) pxc(cx, P.o1, Math.round(q.px), yy, 1, 1);
    const acceso = q.lam && Math.floor(t * 6) % 2 === 0;
    pxc(cx, acceso ? P.o3 : P.nero, x - 1, y - 1, q.w + 2, h + 2); pxc(cx, P.notte, x, y, q.w, h);
    pxc(cx, P.o0, x, y, q.w, 1); pxc(cx, P.o0, x, y + h - 1, q.w, 1);
    cx.drawImage(q.ic, x + 2, y + h - q.ic.height - 1);
    pixTesto(cx, q.lab, x + 2 + q.ic.width + 2, y + Math.round((h - 7 * sc) / 2), P.o3, sc, false, "l");
    // il resto appena lasciato: la targhetta lampeggia e sotto dice «RESTA» (sul pavimento: non allarga la corsia)
    if (q.lam) pixTesto(cx, OT("restaTag"), x + q.w / 2, y + h + 3, acceso ? P.o3 : P.o2, 1, true);
    if (window.__audit) PIX.box.push(["avanzo", x - 1, y - 1, q.w + 2, h + 2 + (q.lam ? 11 : 0)]);
  }
};

// ── 2. l'anteprima sul tasto TORNA SU ──
function anteprimaRitorno() {
  if (!V || !V.giocatori || V.fine) return null;
  const me = V.giocatori[V.io]; if (!me || !me.dentro) return null;
  const m = MOSTRA[V.io], sacco = m ? m.sacco : me.bottino || 0;
  let av = 0; for (const a of avanziVisibili(SIM)) av += a.v;
  let rel = 0;
  V.strada.forEach((c, i) => { if (c.t === "forziere" && c.preso == null && i <= S.gruppo && !(S.rivela && S.rivela.i === i && SIM < S.rivela.t0 + 1.2)) rel += c.v || 0; });
  const uovo = me.uovo ? 12 : 0, soli = V.giocatori.filter((p) => p.dentro).length === 1;
  return { tot: sacco + av + rel + uovo, av, rel, soli };
}
(function () {
  const b = $("b-risali"), sp = b && b.querySelector("[data-t]"); if (!sp) return;
  const col = document.createElement("span"); col.className = "oro-col"; sp.replaceWith(col); col.appendChild(sp);
  const a = document.createElement("small"); a.id = "oro-ant"; a.hidden = true; col.appendChild(a);
  const st = document.createElement("style");
  st.textContent = "#b-risali .oro-col{display:flex;flex-direction:column;align-items:center;line-height:1.05;min-width:0}" +
    "#oro-ant{display:flex;align-items:center;gap:3px;font:700 10px Silkscreen,monospace;letter-spacing:0;white-space:nowrap;margin-top:3px;padding:1px 4px;background:rgba(4,36,29,.82);color:#ffd27a}" +
    "#oro-ant[hidden]{display:none}#oro-ant b{color:#fff3c4;font-weight:700}#oro-ant .l{display:none}" +
    "#oro-ant .rel{width:18px;height:16px;margin:-3px 0;background:url(pix/forziere.png) -18px 0/auto 16px no-repeat;image-rendering:pixelated;flex:none}" +
    "@media (min-width:700px) and (min-height:500px){#oro-ant{font-size:11px}#oro-ant .l{display:inline}#oro-ant .c{display:none}}";
  document.head.appendChild(st);
})();
let oroAntK = "";
function aggiornaAnteprima() {
  const el = $("oro-ant"); if (!el) return;
  const a = anteprimaRitorno(), it = LINGUA !== "en";
  let k = "";
  if (a && a.tot > 0) {
    const da = !a.soli && (a.av > 0 || a.rel > 0);
    k = a.tot + "|" + da + "|" + (a.rel > 0) + "|" + LINGUA;
  }
  if (k === oroAntK) return; oroAntK = k;
  if (!k) { el.hidden = true; el.innerHTML = ""; return; }
  const da = k.split("|")[1] === "true";
  const lungo = da ? (it ? "se torni da solo" : "if you go back alone") : (it ? "al sicuro" : "to safety");
  const corto = da ? (it ? "da solo" : "alone") : (it ? "al sicuro" : "safe");
  el.innerHTML = "<b>+" + a.tot + "</b><span class=\"l\">" + lungo + "</span><span class=\"c\">" + corto + "</span>" + (a.rel > 0 ? '<i class="rel"></i>' : "");
  el.hidden = false;
}
const disegnaPrimaOro = disegna;
disegna = function () {
  disegnaPrimaOro();
  try { aggiornaAnteprima(); } catch (e) { console.warn(e); }
};
