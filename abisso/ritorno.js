// NON SVEGLIARE IL DRAGO - il RITORNO al campo (16/11 notte, richiesta del proprietario).
// Chi torna su: si gira, risale il sentiero tessera per tessera in fila; a ogni tessera con avanzi si FERMA,
// il mucchio mostra il suo numero e si divide («6 ÷ 2 = 3»), le monete volano a ognuno nel suo colore, «+3»;
// quello che non si divide resta sulla tessera («resta 1»). Reliquia (solo se da solo): momento d'oro, la solleva.
// Al campo in cima il sacco si svuota nel forziere (conta) e festeggia. La camera li segue.
"use strict";
const RIT = { attivo: null };
const PASSO_VUOTO = .16, PASSO_PIENO = .26, SOSTA = .62, CAMPO = .75;

// 17/11 ORO: ogni tappa ha la sua sosta: piena dove si divide (o la reliquia), breve dove l'avanzo NON si divide
// (meno monete di chi torna su: resta li', e lo diciamo), zero dove non c'e' niente.
const SOSTA_RESTO = .42;
function pianoRitorno(e) {
  const su = e.risali, da = S.gruppo, tappe = [];
  const tess = e.tessere || {};
  let t = .45;                                   // si girano
  for (let i = da; i >= 0; i--) {
    const tot = tess[i] || tess[String(i)] || 0, c = V && V.strada[i];
    const rel = c && c.t === "forziere" && su.length === 1 && e.forzieri[su[0]] && c.preso === su[0];
    const resto = c ? c.resto || 0 : 0, solo = tot === 0 && resto > 0 && !rel;
    const ferma = tot > 0 || rel;
    t += ferma || solo ? PASSO_PIENO : PASSO_VUOTO;
    const tp = { i, arrivo: t, tot, rel: !!rel, resto, solo, sosta: ferma ? SOSTA : solo ? SOSTA_RESTO : 0 };
    tappe.push(tp);
    t += tp.sosta;
  }
  t += PASSO_PIENO;
  // tutto in ~2,6 s (3 s con avanzi da spiegare): se il sentiero e' lungo si accelera (le soste un po' meno dei passi)
  const lim = tappe.some((tp) => tp.solo || tp.resto) ? 3 : 2.6, f = Math.min(1, lim / (t + CAMPO));
  if (f < 1) { for (const tp of tappe) { tp.arrivo *= f; tp.sosta *= Math.max(.6, f); } t *= f; }
  RIT.sosta = SOSTA * Math.max(.6, f);
  return { su, tappe, campo: t, fine: t + CAMPO, t0: SIM, da, cassa: e.cassa, forz: e.forzieri, e };
}
// dove si trova il ladro j della fila al tempo tt (posizione lungo il sentiero, in tessere: da -> -1)
function posFila(R, j, tt) {
  const ritardo = j * .12, x = tt - ritardo;
  if (x <= .45) return R.da;
  let prima = .45, pos = R.da;
  for (const tp of R.tappe) {
    if (x < tp.arrivo) { const k = ease((x - prima) / (tp.arrivo - prima)); return lerp(pos, tp.i, k); }
    pos = tp.i; prima = tp.arrivo + (tp.sosta || 0);
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

// ── 17/11 ORO: chiarezza dell'oro al ritorno (richiesta del proprietario) ──
// ORO.tiene[i]: il numero che la corsia degli avanzi mostra sulla tessera i finche' chi torna su non ci arriva
// (il server ha gia' tolto la parte divisa: senza questo il numero cambiava PRIMA che arrivassero, e sembrava rotto).
// ORO.lampo[i]: la targhetta della tessera dice «RESTA n» per un attimo (il resto del resto, spiegato).
// Eventi per i suoni (li ascolta suoni.js, se c'e'): window "abisso:oro" con detail.tipo =
//   divide (il mucchio si divide), moneta (arriva a un ladro), resta (il resto rimane), reliquia, cassa (al campo).
const ORO = window.ORO = window.ORO || { tiene: {}, lampo: {} };
function oroEvento(tipo, d) { try { window.dispatchEvent(new CustomEvent("abisso:oro", { detail: Object.assign({ tipo }, d || {}) })); } catch (x) { } }
const ORO_T = {
  it: { portate: "portate", sentiero: "dal sentiero", rel: "reliquia", uovo: "uovo", diviso: (k) => "diviso in " + k, restano: (n) => (n === 1 ? "resta 1" : "restano " + n) + " sul sentiero", restanoC: (n) => (n === 1 ? "resta 1" : "restano " + n), restaTag: "RESTA",
        testa: "A TESTA", tutto: "DAL SENTIERO", restaPix: (n) => "RESTA " + n, nonBasta: (n, k) => n + " / " + k + " = 0  RESTA " + n },
  en: { portate: "carried", sentiero: "from the path", rel: "relic", uovo: "egg", diviso: (k) => "split " + k + " ways", restano: (n) => n + (n === 1 ? " stays" : " stay") + " on the path", restanoC: (n) => n + (n === 1 ? " stays" : " stay"), restaTag: "STAYS",
        testa: "EACH", tutto: "FROM THE PATH", restaPix: (n) => n + " STAYS", nonBasta: (n, k) => n + " / " + k + " = 0  " + n + " STAYS" } };
const OT = (k, ...a) => { const v = ORO_T[LINGUA === "en" ? "en" : "it"][k]; return typeof v === "function" ? v(...a) : v; };
// quanto prende sg tornando su, scomposto: portate (il suo sacco) + dal sentiero (avanzi divisi) + reliquia + uovo
function dettaglioRitorno(e, sg) {
  const tot = (e.cassa || {})[sg] || 0, sent = e.a_testa || 0, rel = (e.forzieri || {})[sg] || 0, uovo = (e.uova || {})[sg] || 0;
  return { tot, sent, rel, uovo, port: Math.max(0, tot - sent - rel - uovo) };
}
function partiRitorno(d) {
  const p = [];
  if (d.port) p.push(d.port + " " + (d.port === 1 && LINGUA !== "en" ? "portata" : OT("portate")));
  if (d.sent) p.push(d.sent + " " + OT("sentiero"));
  if (d.rel) p.push("★" + d.rel + " " + OT("rel"));
  if (d.uovo) p.push(d.uovo + " " + OT("uovo"));
  return p;
}
// «Tu +8 (5 portate + 3 dal sentiero)»
function rigaRitorno(e, sg, html) {
  const d = dettaglioRitorno(e, sg), p = partiRitorno(d), nm = html ? nomeCol(sg) : nome(sg);
  if (!p.length) return nm + " +" + d.tot;
  if (p.length === 1) return nm + " +" + p[0];
  return nm + " +" + d.tot + " (" + p.join(" + ") + ")";
}
function rimastiSentiero() { let n = 0; if (V && V.strada) for (const c of V.strada) n += c.resto || 0; return n; }

const eventoPrimaRit = evento;
window.RITORNO_NUOVO = true;
evento = function (e, anima) {
  if (e.k === "discesa") { ORO.tiene = {}; ORO.lampo = {}; }
  eventoPrimaRit(e, anima);
  if (e.k !== "uscite" || !anima || !e.risali.length) return;
  const orig = e;
  // la corsia tiene i numeri di PRIMA della raccolta finche' i ladri non arrivano su quella tessera
  const tess = e.tessere || {};
  for (const k of Object.keys(tess)) { const i = +k, c = V && V.strada[i]; if (tess[k] > 0 && c) ORO.tiene[i] = (c.resto || 0) + tess[k]; }
  // BUG del 17/11 (live): se al ritorno non c'era niente da dividere, a 0,55 s nessuno teneva i gettoni: si allineavano subito
  // al server (cassa gia' piena), poi al campo la cassa contava DI NUOVO (24 -> 45) e tornava a 24. Ora li teniamo fino alla fine.
  e.risali.forEach((sg) => attendi(sg, 1));
  dopo(.55, () => {
    const R = pianoRitorno(orig); RIT.attivo = R;
    const k = R.su.length;
    let tRel = -9;
    // gli avanzi: a ogni tappa il mucchio si divide fra chi passa
    R.tappe.forEach((tp) => {
      if (tp.tot > 0) {
        const q = tp.tot / k, inizio = tp.tot + tp.resto;
        const m = { i: tp.i, t0: SIM + tp.arrivo, grande: true, val: () => (SIM - R.t0 < tp.arrivo + .3 ? inizio : tp.resto), pos: () => { const p = posT(tp.i, geo()); return { x: p.x - 16, y: p.y - 8 }; } };
        const txt = k === 1 ? "+" + inizio + " " + OT("tutto") : inizio + " / " + k + " = " + q + " " + OT("testa") + (tp.resto ? "  " + OT("restaPix", tp.resto) : "");
        dopo(tp.arrivo, () => {
          delete ORO.tiene[tp.i]; S.mucchi.push(m); suona("mucchio"); oroEvento("divide", { i: tp.i, tot: inizio, k, q, resto: tp.resto });
          S.scritte.push({ txt, col: "#ffe2a0", p: () => { const p = posT(tp.i, geo()); return { x: p.x, y: p.y - 28 }; }, t0: SIM, dur: tp.sosta + .7, px: .1, fondo: true });
        });
        R.su.forEach((sg, j) => {
          attendi(sg, 1);
          for (let c = 0; c < Math.min(q, 4); c++) S.gemme.push({ col: TINTE[sg % 8], da: () => { const p = posT(tp.i, geo()); return { x: p.x - 16, y: p.y - 8 }; }, a: () => { const p = puntoFila(R, j, SIM - R.t0); return { x: p.x, y: p.y - 22 }; },
            t0: SIM + tp.arrivo + .2 + j * .12 + c * .05, dur: .4, arco: .35,
            arriva: c === Math.min(q, 4) - 1 ? () => { suona("gemma", j); oroEvento("moneta", { sg, q, i: tp.i }); contatore(sg, "sacco", q, TINTE[sg % 8], "+" + q); S.scritte.push({ txt: "+" + q, col: TINTE[sg % 8], p: ((jj) => () => { const p = puntoFila(R, jj, SIM - R.t0); return { x: p.x, y: p.y - 34 }; })(j), t0: SIM, dur: .9, px: .14 }); fatto(sg); } : null });
        });
        dopo(tp.arrivo + tp.sosta + .2, () => {
          S.mucchi = S.mucchi.filter((x) => x !== m);
          if (tp.resto) { ORO.lampo[tp.i] = SIM; oroEvento("resta", { i: tp.i, n: tp.resto }); }
        });
      }
      if (tp.solo) dopo(tp.arrivo, () => {            // l'avanzo non basta per tutti: resta li', e lo diciamo
        ORO.lampo[tp.i] = SIM; oroEvento("resta", { i: tp.i, n: tp.resto });
        S.scritte.push({ txt: OT("nonBasta", tp.resto, k), col: "#ffe2a0", p: () => { const p = posT(tp.i, geo()); return { x: p.x, y: p.y - 28 }; }, t0: SIM, dur: tp.sosta + .8, px: .1, fondo: true });
      });
      if (tp.rel) { tRel = tp.arrivo; dopo(tp.arrivo, () => {
        const sg = R.su[0], v = R.forz[sg];
        suona("reliquia"); oroEvento("reliquia", { sg, v, i: tp.i }); S.lampo = .5; S.lampoCol = "255,200,90"; RIT.trofeo = { sg, v, t0: SIM };
        annuncia((LINGUA === "it" ? "Solo tu! Reliquia +" : "Only you! Relic +") + v, nome(sg), 1600, "oro");
        attendi(sg, 1); dopo(.3, () => { contatore(sg, "sacco", v, "#ffc85a", "*+" + v); fatto(sg); });
      }); }
    });
    // al campo: il sacco si svuota nel forziere, contando; festa
    dopo(R.campo, () => {
      R.su.forEach((sg, j) => {
        const tot = R.cassa[sg] || 0, s0 = (MOSTRA[sg] || {}).sacco || 0, passi = Math.max(1, Math.min(8, tot)); let k2 = 0;
        attendi(sg, 1); oroEvento("cassa", { sg, v: tot });
        const giro = setInterval(() => { k2++; const parte = k2 === passi ? tot - Math.floor(tot / passi) * (passi - 1) : Math.floor(tot / passi);
          contatore(sg, "cassa", parte, "#ffc85a", k2 === passi ? "+" + tot : null); contatore(sg, "sacco", -Math.min(MOSTRA[sg].sacco, Math.ceil(s0 / passi)), "#fff", null);
          if (k2 % 2) suona("cassa"); if (k2 >= passi) { clearInterval(giro); fatto(sg); } }, RM ? 1 : 50);
        S.scritte.push({ txt: "+" + tot, col: TINTE[sg % 8], p: ((jj) => () => { const p = puntoFila(R, jj, SIM - R.t0); return { x: p.x, y: p.y - 36 - jj * 9 }; })(j), t0: SIM + j * .1, dur: 1.1, px: .12, fondo: true });
      });
    });
    // la targa: «Tu +8» / «5 portate + 3 dal sentiero · diviso in 2 · restano 1 sul sentiero» (dopo il momento della reliquia)
    dopo(Math.max(R.campo - .2, tRel + 1.65), () => annuncioRitorno(orig));
    dopo(R.fine, () => { if (RIT.attivo === R) RIT.attivo = null; RIT.trofeo = null; R.su.forEach((sg) => { S.tenuti.delete(sg); fatto(sg); }); for (const tp of R.tappe) delete ORO.tiene[tp.i]; });
  });
};
function annuncioRitorno(e) {
  const su = e.risali, k = su.length, io = V ? V.io : -1, primo = su.includes(io) ? io : su[0];
  const d = dettaglioRitorno(e, primo), p = partiRitorno(d), extra = [];
  if (k > 1 && e.a_testa) extra.push(OT("diviso", k));
  const rim = rimastiSentiero();
  let titolo = nome(primo) + " +" + d.tot;
  if (k === 2) { const s2 = su.find((s) => s !== primo); titolo += " · " + nome(s2) + " +" + ((e.cassa || {})[s2] || 0); }
  else if (k > 2) titolo += " · " + (LINGUA === "en" ? "and " + (k - 1) + " others" : "e altri " + (k - 1));
  // il resto lasciato sul sentiero: per esteso se ci sta, corto se no, niente se la riga e' gia' piena (lo dice la corsia)
  const base = p.join(" + ") + (extra.length ? (p.length ? " · " : "") + extra.join(" · ") : "");
  let sotto = base;
  if (rim && k > 1) for (const r of [OT("restano", rim), OT("restanoC", rim)]) { const t2 = base + (base ? " · " : "") + r; if (t2.length <= 46) { sotto = t2; break; } }
  annuncia(titolo, sotto, 2600, "oro");
}
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
    else { const fermo = R.tappe.some((tp) => tp.sosta > 0 && x >= tp.arrivo && x < tp.arrivo + tp.sosta); fr = fermo ? "idle" + (Math.floor(tt * 3) % 2) : "back" + (Math.floor(tt * 9 + j) % 4); }
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
