// NON SVEGLIARE IL DRAGO - il RITORNO al campo (16/11 notte, richiesta del proprietario).
// Chi torna su: si gira, risale il sentiero tessera per tessera in fila; a ogni tessera con avanzi si FERMA,
// il mucchio mostra il suo numero e si divide («6 ÷ 2 = 3»), le monete volano a ognuno nel suo colore, «+3»;
// quello che non si divide resta sulla tessera («resta 1»). Reliquia (solo se da solo): momento d'oro, la solleva.
// Al campo in cima il sacco si svuota nel forziere (conta) e festeggia. La camera li segue.
"use strict";
const RIT = { attivo: null };
const PASSO_VUOTO = .16, PASSO_PIENO = .26, SOSTA = .62, CAMPO = .75;

function pianoRitorno(e) {
  const su = e.risali, da = S.gruppo, tappe = [];
  const tess = e.tessere || {};
  let t = .45;                                   // si girano
  for (let i = da; i >= 0; i--) {
    const tot = tess[i] || tess[String(i)] || 0, c = V && V.strada[i];
    const rel = c && c.t === "forziere" && su.length === 1 && e.forzieri[su[0]] && c.preso === su[0];
    const ferma = tot > 0 || rel;
    t += ferma ? PASSO_PIENO : PASSO_VUOTO;
    tappe.push({ i, arrivo: t, tot, rel: !!rel, resto: c ? c.resto || 0 : 0 });
    if (ferma) t += SOSTA;
  }
  t += PASSO_PIENO;
  // tutto in ~2,6 s: se il sentiero e' lungo si accelera (le soste un po' meno dei passi)
  const f = Math.min(1, 2.6 / (t + CAMPO));
  if (f < 1) { for (const tp of tappe) tp.arrivo *= f; t *= f; }
  RIT.sosta = SOSTA * Math.max(.6, f);
  return { su, tappe, campo: t, fine: t + CAMPO, t0: SIM, da, cassa: e.cassa, forz: e.forzieri };
}
// dove si trova il ladro j della fila al tempo tt (posizione lungo il sentiero, in tessere: da -> -1)
function posFila(R, j, tt) {
  const ritardo = j * .12, x = tt - ritardo;
  if (x <= .45) return R.da;
  let prima = .45, pos = R.da;
  for (const tp of R.tappe) {
    if (x < tp.arrivo) { const k = ease((x - prima) / (tp.arrivo - prima)); return lerp(pos, tp.i, k); }
    pos = tp.i; prima = tp.arrivo + (tp.tot > 0 || tp.rel ? (RIT.sosta || SOSTA) : 0);
    if (x < prima) return pos;
  }
  if (x < R.campo) return lerp(pos, -1, ease((x - prima) / (R.campo - prima)));
  return -1;
}
function puntoFila(R, j, tt) {
  const g = geo(), pos = posFila(R, j, tt), i0 = Math.floor(pos), q = pos - i0, a = posT(i0, g), b = posT(i0 + 1, g);
  const n = R.su.length, dx = (j - (n - 1) / 2) * 12;
  return { x: Math.round(lerp(a.x, b.x, q) + dx), y: Math.round(lerp(a.y, b.y, q) + 6), pos };
}

const eventoPrimaRit = evento;
window.RITORNO_NUOVO = true;
evento = function (e, anima) {
  eventoPrimaRit(e, anima);
  if (e.k !== "uscite" || !anima || !e.risali.length) return;
  const orig = e;
  dopo(.55, () => {
    const R = pianoRitorno(orig); RIT.attivo = R;
    // gli avanzi: a ogni tappa il mucchio si divide fra chi passa
    R.tappe.forEach((tp) => {
      if (tp.tot > 0) {
        const k = R.su.length, q = tp.tot / k, inizio = tp.tot + tp.resto;
        const m = { i: tp.i, t0: SIM + tp.arrivo, grande: true, val: () => (SIM - R.t0 < tp.arrivo + .3 ? inizio : tp.resto), pos: () => { const p = posT(tp.i, geo()); return { x: p.x - 16, y: p.y - 8 }; } };
        dopo(tp.arrivo, () => { S.mucchi.push(m); suona("mucchio"); S.scritte.push({ txt: inizio + " / " + k + " = " + q + (tp.resto ? "  " + (LINGUA === "it" ? "RESTA " : "LEFT ") + tp.resto : ""), col: "#ffe2a0", p: () => { const p = posT(tp.i, geo()); return { x: p.x, y: p.y - 28 }; }, t0: SIM, dur: SOSTA + .5, px: .1, fondo: true }); });
        R.su.forEach((sg, j) => {
          attendi(sg, 1);
          for (let c = 0; c < Math.min(q, 4); c++) S.gemme.push({ col: TINTE[sg % 8], da: () => { const p = posT(tp.i, geo()); return { x: p.x - 16, y: p.y - 8 }; }, a: () => { const p = puntoFila(R, j, SIM - R.t0); return { x: p.x, y: p.y - 22 }; },
            t0: SIM + tp.arrivo + .2 + j * .12 + c * .05, dur: .4, arco: .35,
            arriva: c === Math.min(q, 4) - 1 ? () => { suona("gemma", j); contatore(sg, "sacco", q, TINTE[sg % 8], "+" + q); S.scritte.push({ txt: "+" + q, col: TINTE[sg % 8], p: ((jj) => () => { const p = puntoFila(R, jj, SIM - R.t0); return { x: p.x, y: p.y - 34 }; })(j), t0: SIM, dur: .9, px: .14 }); fatto(sg); } : null });
        });
        dopo(tp.arrivo + SOSTA + .2, () => { S.mucchi = S.mucchi.filter((x) => x !== m); });
      }
      if (tp.rel) dopo(tp.arrivo, () => {
        const sg = R.su[0], v = R.forz[sg];
        suona("reliquia"); S.lampo = .5; S.lampoCol = "255,200,90"; RIT.trofeo = { sg, v, t0: SIM };
        annuncia((LINGUA === "it" ? "Solo tu! Reliquia +" : "Only you! Relic +") + v, nome(sg), 1600, "oro");
        attendi(sg, 1); dopo(.3, () => { contatore(sg, "sacco", v, "#ffc85a", "*+" + v); fatto(sg); });
      });
    });
    // al campo: il sacco si svuota nel forziere, contando; festa
    dopo(R.campo, () => {
      R.su.forEach((sg, j) => {
        const tot = R.cassa[sg] || 0, s0 = (MOSTRA[sg] || {}).sacco || 0, passi = Math.max(1, Math.min(8, tot)); let k = 0;
        attendi(sg, 1);
        const giro = setInterval(() => { k++; const parte = k === passi ? tot - Math.floor(tot / passi) * (passi - 1) : Math.floor(tot / passi);
          contatore(sg, "cassa", parte, "#ffc85a", k === passi ? "+" + tot : null); contatore(sg, "sacco", -Math.min(MOSTRA[sg].sacco, Math.ceil(s0 / passi)), "#fff", null);
          if (k % 2) suona("cassa"); if (k >= passi) { clearInterval(giro); fatto(sg); } }, RM ? 1 : 50);
        S.scritte.push({ txt: (LINGUA === "it" ? "FORZIERE +" : "CHEST +") + tot, col: "#ffc85a", p: ((jj) => () => { const p = puntoFila(R, jj, SIM - R.t0); return { x: p.x, y: p.y - 36 - jj * 9 }; })(j), t0: SIM + j * .1, dur: 1.1, px: .12, fondo: true });
      });
    });
    dopo(R.fine, () => { if (RIT.attivo === R) RIT.attivo = null; RIT.trofeo = null; R.su.forEach((sg) => S.tenuti.delete(sg)); });
  });
};
// chi torna su non e' piu' nel gruppo (lo disegniamo noi)
const nelGruppoPrimaRit = nelGruppo;
nelGruppo = function () { const g = nelGruppoPrimaRit(); return RIT.attivo ? g.filter((sg) => !RIT.attivo.su.includes(sg)) : g; };

// la camera: segue la fila che risale (poi torna sul gruppo alla carta dopo)
const zonaPrimaRit = zonaDrago;
function disegnaRitorno() {
  const R = RIT.attivo; if (!R || !PIX.meta) return;
  const g = geo(), tt = SIM - R.t0, P = PIX.meta.pal, cam = Math.round(S.cam);
  cx.save(); cx.beginPath(); cx.rect(0, PIX.hudB || 0, g.W, Math.max(0, (PIX.zonaTop || g.H) - (PIX.hudB || 0))); cx.clip(); cx.translate(0, -cam);
  R.su.forEach((sg, j) => {
    const p = puntoFila(R, j, tt), x = tt - j * .12;
    let fr;
    if (x < .45) fr = x < .2 ? "idle0" : "back0";                                       // si gira
    else if (tt > R.campo) fr = "festa" + (Math.floor(tt * 6 + j) % 2);                 // festa al campo
    else if (RIT.trofeo && RIT.trofeo.sg === sg) fr = "festa0";                         // solleva la reliquia
    else { const fermo = R.tappe.some((tp) => (tp.tot > 0 || tp.rel) && x >= tp.arrivo && x < tp.arrivo + (RIT.sosta || SOSTA)); fr = fermo ? "idle" + (Math.floor(tt * 3) % 2) : "back" + (Math.floor(tt * 9 + j) % 4); }
    if (window.CAM_ZERO && /^back/.test(fr)) { cx.save(); cx.translate(p.x, p.y); cx.scale(-1, 1); cx.drawImage(botPixBase(sg, "walk" + fr.slice(4)), -10, -30); cx.restore(); }   // sentiero orizzontale: tornano verso sinistra, di profilo
    else cx.drawImage(botPixBase(sg, fr), p.x - 10, p.y - 30);
    if (RIT.trofeo && RIT.trofeo.sg === sg) { const ic = img(RIT.trofeo.v >= 10 ? "forziere" : "calice"), w = RIT.trofeo.v >= 10 ? 18 : 12; cx.drawImage(ic, RIT.trofeo.v >= 10 ? 18 : 0, 0, w, 16, p.x - w / 2, p.y - 50, w, 16); }
    if (window.__audit) PIX.box.push(["bot", p.x - 8, p.y - 30 - cam, 16, 30]);
  });
  cx.restore();
}
const disegnaPrimaRit = disegna;
disegna = function () {
  // camera: durante il ritorno guarda il capofila
  const R = RIT.attivo;
  if (R) { const p = puntoFila(R, 0, SIM - R.t0); S.camOff = 0; S.camRit = p.y; } else S.camRit = null;
  disegnaPrimaRit();
  disegnaRitorno();
};
