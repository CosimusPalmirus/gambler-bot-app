// NON SVEGLIARE IL DRAGO - "vita" (iterazione di rifinitura): rivelazione delle scelte una alla volta,
// carattere del drago a riposo, podio con i ladri in pixel. Si carica per ultimo.
"use strict";
// ── 1. le scelte si girano UNA ALLA VOLTA sopra ogni ladro: «SU» (oro) o «GIU'» (azzurro) ─────────────
const eventoPrimaVita = evento;
evento = function (e, anima) {
  // i punti vanno presi PRIMA che chi torna su lasci il gruppo
  let punti = null;
  if (e.k === "uscite" && anima && (e.risali.length || e.giu.length)) {
    const g = geo(), { gx, gy } = centroGruppo(g), tutti = e.risali.concat(e.giu).sort((a, b) => a - b);
    punti = tutti.map((sg) => { const q = posBot(sg, g, gx, gy); return { sg, x: q.x, y: q.y - 44, su: e.risali.includes(sg) }; });
    // ladri vicini: scritte a scacchiera, non una sopra l'altra (17/11: con piu' di 4 ladri su tre livelli, se no si toccano)
    const livelli = punti.length > 4 ? 3 : 2, cima = Math.min(...punti.map((p) => p.y));
    punti.slice().sort((a, b) => a.x - b.x).forEach((p, r) => { p.y = cima - (r % livelli) * 9; });
  }
  eventoPrimaVita(e, anima);
  if (punti) {
    // 17/11 polish: UNA scritta per gruppo («AVANTI x3», «TORNA SU x2») sopra il gruppo, non una per ladro (si ammucchiavano)
    const it = LINGUA === "it", cima = Math.min(...punti.map((p) => p.y));
    const gruppi = [[punti.filter((p) => p.su), it ? "TORNA SU" : "GO BACK", "#ffd27a"], [punti.filter((p) => !p.su), it ? "AVANTI" : "GO ON", "#56e3ff"]].filter((g) => g[0].length);
    gruppi.forEach(([pp, txt, col], k) => {
      const x = pp.reduce((a, p) => a + p.x, 0) / pp.length, y = cima - (gruppi.length - 1 - k) * 10;
      dopo(.42 + k * .18, () => S.scritte.push({ txt: txt + (pp.length > 1 ? " x" + pp.length : ""), col, p: () => ({ x, y }), t0: SIM, dur: 1.4, px: .14, fondo: true }));
    });
    punti.forEach((pt, j) => dopo(.42 + j * .09, () => suona("gemma", pt.su ? 6 : 1)));
  }
  // un mucchio grande: il drago apre un occhio e guarda l'oro
  if (e.k === "carta" && anima && e.carta.t === "perla" && e.carta.v >= 11) dopo(1.6, () => { S.sbircia = SIM; });
};
// ── 2. il drago a riposo non e' mai fermo: ogni 5-9 s un orecchio, uno sbuffo o un'occhiata ─────────────
S.prossimoTic = 6; S.sbircia = -9;
const disegnaPrimaVita = disegna;
disegna = function () {
  disegnaPrimaVita();
  if (!V || !PIX.meta || RM) return;
  const quieto = !(S.vicino && SIM - S.vicino.t0 < 2) && !(S.crollo && SIM - S.crollo.t0 < 7);
  if (quieto && SIM > S.prossimoTic) {
    const r = Math.random();
    if (r < .4) { S.orecchio = SIM; suonoDrago("orecchio"); }
    else if (r < .75 && PIX.dragoRect) { const [x, y, w] = PIX.dragoRect, sc = w / PIX.meta.drago.w; for (let k = 0; k < 5; k++) S.fumi.push({ x: x + ((PIX.meta.drago.naso || [9, 41])[0]) * sc, y: y + ((PIX.meta.drago.naso || [9, 41])[1]) * sc, t0: SIM + k * .03, vx: -8 - Math.random() * 10, vy: -16 - Math.random() * 10, big: 1 }); }
    else S.sbircia = SIM;
    S.prossimoTic = SIM + 5 + Math.random() * 4;
  }
};
// ── 3. il podio: i ladri veri in pixel sui gradini, il primo festeggia ─────────────────────────────────
const finalePrimaVita = finale;
finale = function (msg) {
  finalePrimaVita(msg);
  const ordine = msg.extra.gruppi.flat(), posti = document.querySelectorAll(".podio .p"), chi = [ordine[1], ordine[0], ordine[2]].filter((x) => x !== undefined);
  clearInterval(finale.k);
  const tele = [];
  posti.forEach((p, i) => {
    const sg = chi[i]; if (sg === undefined) return;
    const old = p.querySelector("canvas"), c = tela(20, 30); c.className = "podio-bot"; old.replaceWith(c); tele.push([c, sg, i === 1 || (msg.extra.gruppi[0].length > 1 && msg.extra.gruppi[0].includes(sg))]);
  });
  let k = 0;
  const giro = () => { k++; for (const [c, sg, primo] of tele) { const x = c.getContext("2d"); x.clearRect(0, 0, 20, 30); x.drawImage(botPixBase(sg, primo ? "festa" + (k % 2) : "idle" + (Math.floor(k / 2) % 2)), 0, 0); } };
  giro(); finale.k = setInterval(giro, RM ? 100000 : 260);
  if (!RM) { suona("reliquia"); setTimeout(() => suonoDrago("evviva"), 300); }
};
