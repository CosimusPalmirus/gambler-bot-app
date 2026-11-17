// NON SVEGLIARE IL DRAGO - le CARTE SPECIALI (16/11 notte). Si carica per ultimo.
// LADRO, SCAMBIO, PATTO: scelta segreta e simultanea (come avanti/torna su), 5 s, poi si girano insieme.
// MAPPA, BUCATO: effetto immediato. Le monete passano solo fra ladri e tessere: la casa non c'entra mai.
"use strict";
const SP_NOMI = {
  it: { LADRO: "LADRO", SCAMBIO: "SCAMBIO", MAPPA: "MAPPA", BUCATO: "SACCO BUCATO", PATTO: "PATTO" },
  en: { LADRO: "THIEF", SCAMBIO: "SWAP", MAPPA: "MAP", BUCATO: "HOLEY BAG", PATTO: "PACT" },
};
const SP_REGOLA = {
  it: { LADRO: "Chi è sul sentiero sceglie in segreto a chi rubare 2 monete dal sacco", SCAMBIO: "Chi ha il sacco più leggero sceglie con chi scambiarlo",
        MAPPA: "Tutti vedono la prossima carta", BUCATO: "Chi è sul sentiero perde 1 moneta: resta sulla tessera", PATTO: "6 monete: tutti DIVIDONO, uno solo TIENE e le prende, due o più TENGONO e nessuno le prende" },
  en: { LADRO: "Everyone on the path secretly picks someone to steal 2 coins from", SCAMBIO: "The lightest bag chooses whom to swap bags with",
        MAPPA: "Everyone sees the next card", BUCATO: "Everyone on the path drops 1 coin on the tile", PATTO: "6 coins: all SPLIT, one alone KEEPS and takes them, two or more KEEP and nobody gets them" },
};
const SPN = (v) => SP_NOMI[LINGUA][v] || v, SPR_ = (v) => SP_REGOLA[LINGUA][v] || "";
TXT2.it.f_speciale = "Scelta segreta"; TXT2.en.f_speciale = "Secret choice";
TXT2.it.f_speciale_fine = "Si rivelano le scelte"; TXT2.en.f_speciale_fine = "Choices revealed";

// le immagini e la carta speciale in pixel
const caricaPrimaSp = caricaTutto;
caricaTutto = async function () { await caricaPrimaSp(); PIX.img.speciali = await carica("pix/speciali.png"); };
const cartaPixPrimaSp = cartaPix;
cartaPix = function (c) {
  if (c.t !== "speciale") return cartaPixPrimaSp(c);
  const k = "carta|sp|" + c.v; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const P = PIX.meta.pal, w = 26, h = 34, cv2 = tela(w, h), x = cv2.getContext("2d");
  x.fillStyle = "rgb(" + P.notte + ")"; x.fillRect(1, 0, w - 2, h); x.fillRect(0, 1, w, h - 2);
  x.fillStyle = "rgb(" + P.cie + ")"; x.fillRect(2, 1, w - 4, 1); x.fillRect(2, h - 2, w - 4, 1); x.fillRect(1, 2, 1, h - 4); x.fillRect(w - 2, 2, 1, h - 4);
  x.fillStyle = "rgb(" + P.g1 + ")"; x.fillRect(2, 2, w - 4, h - 4);
  const i = PIX.meta.speciali.indexOf(c.v); if (i >= 0) x.drawImage(PIX.img.speciali, i * 16, 0, 16, 16, 5, 9, 16, 16);
  pixTesto(x, "?", 4, 3, P.cie, 1, true, "l");
  PIX.cache.set(k, cv2); return cv2;
};

// il pannello della scelta
function pannello() {
  let p = $("pannello-sp"); if (p) return p;
  p = document.createElement("div"); p.id = "pannello-sp"; p.hidden = true; $("azioni").prepend(p); return p;
}
function apriPannello(e) {
  const p = pannello(), io = V.io;
  if (!e.chi.includes(io)) { p.hidden = true; return; }
  const tit = '<div class="sp-tit"><span class="sp-ic" style="background-position:' + (PIX.meta.speciali.indexOf(e.tipo) * 25) + '% 0"></span>' + SPN(e.tipo) + '<b id="sp-t">5</b></div><div class="sp-reg">' + SPR_(e.tipo) + "</div>";
  let bt = "";
  if (e.tipo === "PATTO") bt = '<button class="sp-b" data-a="patto" data-x="0">' + (LINGUA === "it" ? "DIVIDI" : "SPLIT") + '</button><button class="sp-b rosso" data-a="patto" data-x="1">' + (LINGUA === "it" ? "TIENI" : "KEEP") + "</button>";
  else {
    const a = e.tipo === "LADRO" ? "ruba" : "scambia";
    for (const sg of e.dentro) if (sg !== io) { const pl = V.giocatori[sg]; bt += '<button class="sp-b" data-a="' + a + '" data-x="' + sg + '" style="--c:' + TINTE[sg % 8] + '">' + gl(sg) + " " + nome(sg) + '<small>' + (MOSTRA[sg] ? MOSTRA[sg].sacco : pl.bottino) + "</small></button>"; }
    if (e.tipo === "SCAMBIO") bt += '<button class="sp-b" data-a="scambia" data-x="-1">' + (LINGUA === "it" ? "NESSUNO" : "NOBODY") + "</button>";
  }
  p.innerHTML = tit + '<div class="sp-bt">' + bt + "</div>"; p.hidden = AUTO;
  p.querySelectorAll(".sp-b").forEach((b) => (b.onclick = () => {
    ac(); if (ws && ws.readyState === 1) ws.send(JSON.stringify({ a: b.dataset.a, ax: +b.dataset.x }));
    p.querySelectorAll(".sp-b").forEach((x) => x.classList.toggle("scelto", x === b));
  }));
  const fine = performance.now() + (e.fino || 5) * 1000;
  clearInterval(apriPannello.k); apriPannello.k = setInterval(() => { const r = Math.max(0, Math.ceil((fine - performance.now()) / 1000)); const el = $("sp-t"); if (el) el.textContent = r; if (!r) clearInterval(apriPannello.k); }, 200);
}

// le scene delle speciali
const eventoPrimaSp = evento;
evento = function (e, anima) {
  eventoPrimaSp(e, anima);
  if (!anima) return;
  const P = PIX.meta.pal;
  if (e.k === "carta" && e.carta.t === "speciale") {
    const v = e.carta.v, i = e.prof - 1;
    dopo(1.25, () => annuncia(SPN(v), SPR_(v), 2400, "oro"));
    log('<b style="color:#56e3ff">' + SPN(v) + "</b> · " + SPR_(v));
    if (v === "MAPPA" && e.prossima) dopo(2.2, () => { const c = e.prossima; annuncia(SPN("MAPPA"), (LINGUA === "it" ? "la prossima: " : "next: ") + (c.t === "pericolo" ? NP(c.v) : c.t === "perla" ? c.v + " " + t_("perle") : c.t === "speciale" ? SPN(c.v) : t_("rel") + " " + c.v), 2600, "oro"); });
    if (v === "BUCATO" && e.bucato) {
      Object.keys(e.bucato).map(Number).forEach((sg, j) => {
        attendi(sg, 1);
        S.gemme.push({ col: TINTE[sg % 8], da: puntoDi(sg), a: puntoTessera(i), t0: SIM + 1.5 + j * .12, dur: .5, arco: .2,
          arriva: () => { contatore(sg, "sacco", -1, "#ff6b60", "-1"); fatto(sg); } });
      });
    }
    if (e.vuota) dopo(2.0, () => annuncia(SPN(v), LINGUA === "it" ? "nessun effetto: serve almeno un altro ladro sul sentiero" : "no effect: needs another thief on the path", 1800));
  }
  if (e.k === "speciale_aperta") {
    apriPannello(e);
    const chi = e.tipo === "SCAMBIO" ? nome(e.chi[0]) + (LINGUA === "it" ? " sceglie con chi scambiare" : " chooses whom to swap with") : (LINGUA === "it" ? "tutti scelgono in segreto" : "everyone chooses in secret");
    annuncia(SPN(e.tipo), chi, 2000, "oro");
  }
  if (e.k === "speciale_esito") {
    pannello().hidden = true;
    const sc = e.scelte, righe = [];
    if (e.tipo === "PATTO") {
      // il voto si rivela sopra ogni ladro, poi le monete
      Object.entries(sc).forEach(([s, x]) => S.scritte.push({ txt: x ? (LINGUA === "it" ? "TIENI" : "KEEP") : (LINGUA === "it" ? "DIVIDI" : "SPLIT"), col: x ? "#ff6b60" : "#7be3a4", p: puntoDi(+s), t0: SIM, dur: 1.6, px: .14 }));
      const esito = { dividi: LINGUA === "it" ? "tutti dividono" : "everyone splits", tiene: LINGUA === "it" ? "uno solo tiene: le prende!" : "one keeper takes all!", nessuno: LINGUA === "it" ? "troppi avidi: nessuno le prende" : "too greedy: nobody gets them" }[e.esito];
      dopo(.6, () => annuncia(SPN("PATTO"), esito, 2000, e.esito === "nessuno" ? "rosso" : "oro"));
      e.movimenti.forEach((m, j) => { attendi(m.a, 1); for (let k = 0; k < Math.min(m.q, 6); k++) S.gemme.push({ col: TINTE[m.a % 8], da: puntoTessera(S.gruppo, .3), a: puntoDi(m.a), t0: SIM + .8 + j * .15 + k * .05, dur: .55, arco: .4, arriva: k === Math.min(m.q, 6) - 1 ? () => { contatore(m.a, "sacco", m.q, TINTE[m.a % 8], "+" + m.q); fatto(m.a); } : null }); });
      righe.push(Object.entries(sc).map(([s, x]) => nomeCol(+s) + " " + (x ? "TIENI" : "DIVIDI")).join(" · ") + " → " + esito);
    } else if (e.tipo === "LADRO") {
      e.movimenti.forEach((m, j) => {
        attendi(m.da, 1); attendi(m.a, 1);
        dopo(j * .35, () => { S.scritte.push({ txt: "-" + m.q, col: "#ff6b60", p: puntoDi(m.da), t0: SIM, dur: 1.2, px: .14 }); contatore(m.da, "sacco", -m.q, "#ff6b60", "-" + m.q); fatto(m.da); });
        for (let k = 0; k < m.q; k++) S.gemme.push({ col: TINTE[m.a % 8], da: puntoDi(m.da), a: puntoDi(m.a), t0: SIM + j * .35 + k * .08, dur: .55, arco: .5, arriva: k === m.q - 1 ? () => { S.hop[m.a] = SIM; contatore(m.a, "sacco", m.q, TINTE[m.a % 8], "+" + m.q); fatto(m.a); } : null });
        righe.push(nomeCol(m.a) + (LINGUA === "it" ? " ruba " : " steals ") + m.q + (LINGUA === "it" ? " a " : " from ") + nomeCol(m.da));
      });
      if (!e.movimenti.length) righe.push(LINGUA === "it" ? "sacchi vuoti: niente da rubare (chi porta oro rischia di piu')" : "empty bags: nothing to steal (carrying gold is riskier)");
      dopo(.2, () => annuncia(SPN("LADRO"), righe.length ? righe.map((r) => r.replace(/<[^>]+>/g, "")).join(" · ") : "", 2400, "rosso"));
    } else if (e.tipo === "SCAMBIO") {
      const m = e.movimenti[0];
      if (m) {
        const [a, b] = m.scambio; attendi(a, 1); attendi(b, 1);
        for (let k = 0; k < 4; k++) { S.gemme.push({ col: TINTE[a % 8], da: puntoDi(a), a: puntoDi(b), t0: SIM + k * .06, dur: .6, arco: .6 }); S.gemme.push({ col: TINTE[b % 8], da: puntoDi(b), a: puntoDi(a), t0: SIM + k * .06, dur: .6, arco: -.4 }); }
        dopo(.7, () => { contatore(a, "sacco", m.q[1] - m.q[0], TINTE[a % 8], (m.q[1] - m.q[0] >= 0 ? "+" : "") + (m.q[1] - m.q[0])); contatore(b, "sacco", m.q[0] - m.q[1], TINTE[b % 8], (m.q[0] - m.q[1] >= 0 ? "+" : "") + (m.q[0] - m.q[1])); fatto(a); fatto(b); });
        righe.push(nomeCol(a) + (LINGUA === "it" ? " scambia il sacco con " : " swaps bags with ") + nomeCol(b) + " (" + m.q[0] + " ⇄ " + m.q[1] + ")");
      } else righe.push(LINGUA === "it" ? "nessuno scambio" : "no swap");
      dopo(.2, () => annuncia(SPN("SCAMBIO"), righe.map((r) => r.replace(/<[^>]+>/g, "")).join(" "), 2200, "oro"));
    }
    if (e.auto && e.auto.length) righe.push(e.auto.map(nomeCol).join(", ") + " · " + t2_("auto"));
    log(righe.join(" · "));
  }
};
// lucchetto sui gettoni anche nella scelta speciale
const aggiornaGiocatoriPrimaSp = aggiornaGiocatori;
aggiornaGiocatori = function () {
  aggiornaGiocatoriPrimaSp();
  if (!V || V.fase !== "speciale" || !V.pend) return;
  document.querySelectorAll(".gioc").forEach((el) => { const sg = +el.dataset.sg; el.classList.toggle("scelto", V.pend.scelto.includes(sg)); });
};
// il mazzo pubblico mostra anche le speciali rimaste
const aggiornaPericoliPrimaSp = aggiornaPericoli;
aggiornaPericoli = function () {
  aggiornaPericoliPrimaSp();
  const k = V.composizione, rim = PIX.meta.speciali.filter((x) => k[x]);
  if (rim.length) $("mazzo").insertAdjacentHTML("beforeend", '<span class="z">' + (LINGUA === "it" ? "Speciali" : "Specials") + "</span><b>" + rim.length + "</b>");
};
