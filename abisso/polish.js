// NON SVEGLIARE IL DRAGO - POLISH prima del rilascio (17/11/2026). Ultimo file della catena (dopo rilascio.js).
// Non cambia il filo ne' le regole. Quattro cose chieste dal proprietario:
//  1. i due tasti della scelta ACCESI e diversi (oro = AVANTI, verde acqua = TORNA SU), stato scelto chiaro, spenti solo
//     quando davvero non si puo' scegliere; l'anello del tempo con i secondi grandi (e niente «·» fuori dalla scelta);
//     su ogni gettone una spunta ✓ quando quel giocatore ha scelto (mai COSA ha scelto);
//  2. meno confusione: gettoni in una griglia che sta pulita da 2 a 8; segni del drago leggibili, con il tocco che
//     spiega (sul PC c'era gia' il passaggio del mouse) e un «!» rosso sul segno gia' uscito;
//  3. UN solo sistema di caratteri: Silkscreen (pixel) per titoli, nomi, numeri e tasti; Pixelify Sans (pixel, con i
//     suoi pesi veri, niente grassetto finto) per il testo. Entrambi OFL, gia' in pix/;
//  4. vibrazione di Telegram (HapticFeedback) se c'e': leggera alla carta, media alla propria scelta, errore quando il
//     drago si sveglia, successo se vinci. Su Discord e fuori da Telegram non fa niente.
"use strict";

// ── 4. vibrazione ────────────────────────────────────────────────────────────────────────────────────
function vibra(tipo) {
  if (RIL.dc) return;
  try {
    let tg = null;
    try { tg = (window.Telegram && Telegram.WebApp) || (window.parent !== window && window.parent.Telegram && window.parent.Telegram.WebApp) || null; } catch (e) { tg = null; }
    const h = tg && tg.HapticFeedback; if (!h) return;
    if (tipo === "errore" || tipo === "successo") h.notificationOccurred(tipo === "errore" ? "error" : "success");
    else h.impactOccurred(tipo);          // light | medium | heavy
  } catch (e) { }
}
window.abissoVibra = vibra;
const eventoPrimaPol = evento;
evento = function (e, anima) {
  eventoPrimaPol(e, anima);
  if (!anima) return;
  if (e.k === "carta") {
    dopo(.9, () => vibra("light"));
    if (e.crollo) dopo(1.15, () => { vibra("heavy"); vibra("errore"); });
  }
};
const mandaPrimaPol = manda;
manda = function (a) { vibra("medium"); mandaPrimaPol(a); };
if (typeof mandaAv === "function") { const mandaAvPrimaPol = mandaAv; mandaAv = function (a, ax) { vibra("medium"); mandaAvPrimaPol(a, ax); }; }
const finalePrimaPol = finale;
finale = function (msg) {
  finalePrimaPol(msg);
  try { if (V && msg.extra && msg.extra.gruppi && msg.extra.gruppi[0].includes(V.io)) vibra("successo"); } catch (e) { }
};

// ── 1. tasti e anello ────────────────────────────────────────────────────────────────────────────────
const azioniPrimaPol = aggiornaAzioni;
aggiornaAzioni = function () {
  azioniPrimaPol();
  if (!V) return;
  const me = V.giocatori[V.io] || {}, giu = $("b-giu"), su = $("b-risali");
  const sc = V.fase === "scelta" ? me.scelta : null;
  giu.classList.toggle("altro", sc === "risali"); su.classList.toggle("altro", sc === "giu");
  $("azioni").classList.toggle("da-scegliere", !giu.disabled && !sc);
};
orologio = function () {
  if (!V) return;
  const an = $("anello"), giro = $("a-giro"), num = $("a-num");
  if (V.fase === "scelta" && !V.fine) {
    const resta = Math.max(0, V.resta - (performance.now() - snapT) / 1000), tot = (INFO && INFO.scelta_s) || 5;
    giro.style.strokeDashoffset = 144.5 * (1 - resta / tot);
    an.classList.remove("spento"); an.classList.toggle("urgente", resta < 2);
    num.textContent = Math.ceil(resta);
  } else {
    giro.style.strokeDashoffset = 144.5; an.classList.add("spento"); an.classList.remove("urgente"); num.textContent = "";
  }
};

// ── 2. gettoni in griglia, segni del drago ───────────────────────────────────────────────────────────
const giocPrimaPol = aggiornaGiocatori;
aggiornaGiocatori = function () {
  giocPrimaPol();
  if (!V) return;
  const n = V.n, col = n <= 4 ? n : n <= 6 ? 3 : 4, tel = $("giocatori-tel");
  if (tel.dataset.col !== String(col)) { tel.dataset.col = col; tel.style.gridTemplateColumns = "repeat(" + col + ",minmax(0,1fr))"; }
};
(function () {
  const box = $("pericoli");
  let t = 0;
  box.addEventListener("click", (ev) => {           // telefono: un tocco spiega il segno (come il mouse sul PC)
    const el = ev.target.closest(".hz"); if (!el) return;
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: Math.max(8, r.left - 40), clientY: r.bottom + 2 }));
    clearTimeout(t); t = setTimeout(nascondiTip, 2600);
  });
  document.querySelectorAll(".hz").forEach((el) => (el.title = ""));
})();

// ── SPAREGGIO dei tornei (17/11, decisione del proprietario): il RT manda nel feed pubblico
//    {k:"spareggio", chi:[seggi], n, max, cassa} = una spedizione in piu' solo per i pari (gli altri restano al campo);
//    {k:"spareggio_pari", chi, n} = ancora pari dopo `max`: la partita si rigioca. Vale anche nei tornei gratis e su Discord.
const SPAR = { on: false, chi: [], n: 0, max: 0 };
const eventoSparPrima = evento;
evento = function (e, anima) {
  eventoSparPrima(e, anima);
  if (e.k === "via") { SPAR.on = false; SPAR.chi = []; }
  if (e.k === "spareggio") {
    SPAR.on = true; SPAR.chi = (e.chi || []).map(Number); SPAR.n = +e.n || 1; SPAR.max = +e.max || 3;
    const it = LINGUA === "it", io = !!(V && SPAR.chi.includes(V.io));
    annuncia((it ? "SPAREGGIO! " : "TIEBREAK! ") + SPAR.n + "/" + SPAR.max,
      it ? (io ? "sei pari: scendi ancora, gli altri restano al campo" : "scendono solo i pari: gli altri restano al campo")
        : (io ? "you are tied: go down again, the others stay at camp" : "only the tied players go down: the others stay at camp"), 3200, "oro");
    log('<b style="color:#ffd27a">' + (it ? "SPAREGGIO " : "TIEBREAK ") + SPAR.n + "/" + SPAR.max + "</b> · " + SPAR.chi.map((x) => nomeCol(x)).join(", "));
    if (anima) vibra("heavy");
    try { aggiornaTesta(); aggiornaGiocatori(); } catch (x) { }
  }
  if (e.k === "spareggio_pari") {
    const it = LINGUA === "it";
    // UN SOLO VINCITORE (17/11 sera): in torneo si rigioca; a soldi le poste tornano; gratis nessun vincitore
    const tor = !!(INFO && INFO.torneo), sol = !!(INFO && INFO.a_soldi);
    const tt = tor ? (it ? "ANCORA PARI: SI RIGIOCA" : "STILL TIED: REPLAYING") : (it ? "ANCORA PARI: NESSUN VINCITORE" : "STILL TIED: NO WINNER");
    const ss = tor ? (it ? "la partita del torneo ricomincia" : "the tournament match starts over")
      : sol ? (it ? "le poste tornano a tutti" : "everyone gets their stake back") : (it ? "nessuno vince questa partita" : "nobody wins this game");
    annuncia(tt, ss, 3600, "oro");
    log('<b style="color:#ffd27a">' + tt + "</b> · " + ss);
  }
};
const testaSparPrima = aggiornaTesta;
aggiornaTesta = function () {
  testaSparPrima();
  if (!SPAR.on) return;
  $("spedizioni").innerHTML = '<span class="sp ora sp-spar">' + (LINGUA === "it" ? "SPAREGGIO " : "TIEBREAK ") + SPAR.n + "/" + SPAR.max + "</span>";
};
const giocSparPrima = aggiornaGiocatori;
aggiornaGiocatori = function () {
  giocSparPrima();
  if (!V) return;
  for (const box of [$("giocatori-pc"), $("giocatori-tel")]) {
    [...box.children].forEach((el, i) => {
      const pari = SPAR.on && SPAR.chi.includes(i), campo = SPAR.on && !pari;
      el.classList.toggle("spar-pari", pari); el.classList.toggle("spar-campo", campo);
      if (campo) { const nm = el.querySelector(".nome"); if (nm && !nm.dataset.campo) { nm.textContent += LINGUA === "it" ? " · al campo" : " · at camp"; } }
    });
  }
};

// ── stile ────────────────────────────────────────────────────────────────────────────────────────────
(function () {
  const st = document.createElement("style");
  st.id = "polish-css";
  st.textContent = [
    // 3. caratteri: Pixelify coi suoi pesi VERI (e' un carattere variabile 400-700), mai grassetto sintetico
    '@font-face{font-family:"Pixelify";src:url(pix/PixelifySans.ttf) format("truetype");font-weight:400 700;font-display:swap}',
    "html{font-synthesis:none}",
    "body,button,input,code,kbd,#tip,.regole,.storia{font-family:\"Pixelify\",ui-monospace,monospace}",
    ".scheda h2,.pannello h3,.nome,.riga .nm,.podio .nmp,.podio .pr,.tav-p,.stat b,.sp-tit,.sp-b,#bottega h2,#bottega .bt-o .nm,#bottega .bt-oro,.c-ok,#coach b,.r-tx b,.tasti-pc,#sotto,.pill,kbd{font-family:\"Silkscreen\",\"Pixelify\",monospace!important;font-weight:400!important;letter-spacing:.02em}",
    ".scheda h2{font-size:19px;color:#ffd27a;text-shadow:2px 2px 0 #7a1f12}",
    ".scheda p,.r-tx,.tav-regole,.stat span,#coach .c-testo,#bottega .bt-sub,#bottega .bt-o .ef{font-weight:400}",
    ".scheda code{font-size:10px}",
    // 1. i due tasti: accesi e diversi
    "#azioni .btn.giu{background:#ffb22e!important;color:#2a1200!important;box-shadow:inset 0 -5px 0 #b8630c,inset 0 4px 0 #ffe39a!important}",
    "#azioni .btn.risali{background:#3fd0ae!important;color:#04241d!important;box-shadow:inset 0 -5px 0 #187a64,inset 0 4px 0 #b9fff0!important}",
    "#azioni .btn:disabled{opacity:.32!important;filter:saturate(.25) brightness(.85)!important;cursor:default}",
    "#azioni .btn.altro:not(:disabled){opacity:.55;filter:saturate(.6)}",
    "#azioni .btn.scelto:not(:disabled){transform:translateY(3px);outline:3px solid #fff;outline-offset:-3px}",
    "#azioni .btn.scelto:not(:disabled)::after{content:'\\2713';font-family:Silkscreen,monospace;font-size:16px;margin-left:6px}",
    "#azioni.da-scegliere .btn{animation:pol-invito 1.4s ease-in-out infinite}",
    "#azioni.da-scegliere .btn.risali{animation-delay:.7s}",
    "@keyframes pol-invito{50%{filter:brightness(1.18)}}",
    "@media (prefers-reduced-motion:reduce){#azioni.da-scegliere .btn{animation:none}}",
    // l'anello del tempo: fondo pieno, secondi grandi, oro che diventa rosso; fuori dalla scelta si spegne
    "#anello{border-radius:50%;background:#1d1418;box-shadow:0 0 0 2px #3a2a24;transition:opacity .2s}",
    "#anello .a-fondo{stroke:#3a2a24!important;stroke-width:5}",
    "#a-giro{stroke:#ffd27a!important;stroke-width:5!important;stroke-linecap:butt!important;transition:stroke .2s}",
    "#anello.urgente #a-giro{stroke:#ff5a4e!important}",
    "#anello.urgente{animation:pol-urgente .5s steps(2) infinite}",
    "@keyframes pol-urgente{50%{box-shadow:0 0 0 2px #ff5a4e,0 0 14px #ff5a4e}}",
    "#a-num{font-family:Silkscreen,monospace!important;font-size:22px!important;color:#fff;text-shadow:2px 2px 0 #000}",
    "#anello.spento{opacity:.25}",
    // la spunta di chi ha scelto (mai cosa)
    ".gioc.scelto::after{content:'\\2713';position:absolute;top:1px;right:4px;font-family:Silkscreen,monospace;font-size:12px;line-height:1;color:#56e3ff;text-shadow:1px 1px 0 #000;pointer-events:none}",
    // 2. gettoni: tutti uguali, nessuno a capo da solo
    "#giocatori-tel .gioc{min-width:0}",
    "#giocatori-tel .gioc .nome{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    // segni del drago: piu' leggibili; quello gia' uscito ha il «!» rosso; un tocco li spiega
    "#pericoli{pointer-events:auto;cursor:help}",
    ".hz .ic{opacity:.72!important}",
    ".hz.visto .ic{opacity:1!important}",
    ".hz.visto::after{content:'!';position:absolute;top:-4px;right:-2px;width:14px;height:14px;background:#ff5a4e;color:#fff;font:10px/14px Silkscreen,monospace;text-align:center;box-shadow:0 0 0 2px #1a1016;pointer-events:none}",
    // spareggio: il contatore delle spedizioni diventa «SPAREGGIO n/max», i pari in oro, gli altri al campo
    "#spedizioni .sp.sp-spar{width:auto!important;padding:0 8px;font-size:11px!important;white-space:nowrap;background:#ffc46b;color:#2a1700}",
    ".gioc.spar-pari{box-shadow:inset 0 0 0 3px #ffd27a!important;background:#2a2010!important}",
    ".gioc.spar-campo{opacity:.5}",
  ].join("\n");
  document.head.appendChild(st);
})();
