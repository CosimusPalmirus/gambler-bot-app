// NON SVEGLIARE IL DRAGO - RILASCIO (17/11/2026). ULTIMO file della catena: non cambia il filo ne' le regole.
//  · ?rt=1      dentro la mini app (il ponte del guscio sostituisce la WebSocket): niente tasto lingua, la scheda finale
//               dice «Continua» e avvisa il guscio con l'evento window 'abisso' {t:'fine'|'rivincita'|'menu'}.
//  · ?piatt=dc  Discord, solo gratis: nessuna parola di soldi/scommesse a schermo, in IT e in EN.
//  · bordi del telefono: env(safe-area-inset-*) e --sa-top/bottom/left/right (px) messi su <html> dal guscio.
//  · telefono in ORIZZONTALE: scena a sinistra a tutta altezza, giocatori e tasti in una colonna a destra.
//  · scheda finale: seme e firma solo dopo «Verifica», un tasto principale, sottotitolo vero (premi, gratis, allenamento).
//  · niente foto profilo (regola del proprietario): ogni ladro ha il suo colore e il nome.
"use strict";
const RIL = { rt: Q.get("rt") === "1", dc: Q.get("piatt") === "dc" };
if (RIL.rt) document.documentElement.classList.add("rt");
if (RIL.dc) document.documentElement.classList.add("dc");
// ?vetrina=1: solo la scena (per la clip del menu: niente scritte HTML, niente tasti)
if (Q.get("vetrina") === "1") document.documentElement.classList.add("vetrina");

// ── testi ────────────────────────────────────────────────────────────────────────────────────────────
function rilBot() { return !!(INFO && INFO.seggi && INFO.seggi.some((s) => String(s.uid).indexOf("bot:") === 0)); }
function rilSoldi() { return !!(INFO && INFO.a_soldi && !RIL.dc); }
function rilModo() { return rilSoldi() ? t_("soldi") : rilBot() ? t_("allen") : t_("gratis"); }
Object.assign(TXT.it, { gratis: "Partita gratis" });
Object.assign(TXT.en, { gratis: "Free game" });
if (RIL.dc) {
  Object.assign(TXT.it, { soldi: "Partita gratis", piatto: "", monte: "", pari: "Pari al primo posto: vincete insieme." });
  Object.assign(TXT.en, { soldi: "Free game", piatto: "", monte: "", pari: "Tie for first: you win together." });
}
TXT2.it.modo = () => rilModo();
TXT2.en.modo = () => rilModo();
function rilQuote() {          // «1° 70% · 2° 30%» dalle quote del tavolo (map_info), mai inventate
  const q = (INFO && INFO.quote) || [100], it = LINGUA === "it";
  const rake = Math.round(((INFO && INFO.rake) || 0) * 100);
  const casa = rake ? (it ? " (" + rake + "% alla casa)" : " (" + rake + "% to the house)") : "";
  if (q.length === 1) return (it ? "Montepremi: tutto al 1°" : "Prize pool: all to 1st") + casa;
  const ord = it ? ["1°", "2°", "3°"] : ["1st", "2nd", "3rd"];
  return (it ? "Montepremi: " : "Prize pool: ") + q.map((x, i) => ord[i] + " " + x + "%").join(" · ") + casa;
}

// ── testata: mai soldi su Discord; «Gratis» a una lobby di persone, «Allenamento» coi bot ─────────────
const testataPrimaRil = testata;
testata = function () {
  if (RIL.dc && INFO) INFO.a_soldi = false;
  testataPrimaRil();
  $("sotto").textContent = rilModo() + " · " + INFO.n + " " + t_("gioc");
  if (!rilSoldi()) $("p-piatto").textContent = rilBot() ? t_("allen") : t_("gratis");
  else if (LINGUA === "it") $("p-piatto").textContent = $("p-piatto").textContent.replace(/(\d)\.(\d\d) €/, "$1,$2 €");
};

// ── regole: ai tavoli a soldi (mai su Discord) una riga coi premi ────────────────────────────────────
const regolePrimaRil = apriRegole;
apriRegole = function () {
  regolePrimaRil();
  if (!rilSoldi()) return;
  const r = document.querySelector("#scheda .regole-px");
  if (r) r.insertAdjacentHTML("beforeend", '<div class="r-px"><div class="r-ic"><span class="tasti-px">1°</span></div><div class="r-tx"><b>' + rilQuote() + "</b></div></div>");
};
$("b-regole").onclick = apriRegole;

// ── scheda finale ────────────────────────────────────────────────────────────────────────────────────
function rilAvvisa(t) { try { window.dispatchEvent(new CustomEvent("abisso", { detail: { t } })); } catch (e) { } }
window.abissoEsci = () => rilAvvisa("menu");
const finalePrimaRil = finale;
finale = function (msg) {
  if (RIL.dc || !msg.premi) msg = Object.assign({}, msg, { premi: null });
  if (RIL.dc && INFO) INFO.a_soldi = false;
  finalePrimaRil(msg);
  const s = $("scheda");
  s.classList.add("fine-ril");
  const sotto = s.querySelector("h2 + p");
  if (sotto && msg.premi && LINGUA === "it") sotto.textContent = sotto.textContent.replace(/(\d)\.(\d\d) €/, "$1,$2 €");
  if (sotto && !msg.premi) sotto.textContent = (msg.extra.gruppi[0].length > 1 ? t_("pari") + " " : "") + (rilSoldi() ? rilQuote() : rilModo());
  const code = s.querySelector("code"), ver = s.querySelector(".verifica"), esito = s.querySelector(".ver-esito"), b = s.querySelector(".btn.giu");
  if (code) code.hidden = true;
  if (ver) ver.addEventListener("click", () => { if (code) code.hidden = false; });
  if (b) {
    if (RIL.rt) {
      b.removeAttribute("onclick");
      b.textContent = LINGUA === "it" ? "Continua" : "Continue";
      b.onclick = (ev) => { ev.preventDefault(); b.disabled = true; rilAvvisa("rivincita"); };
    }
    // il tasto principale prima, la verifica (piccola) sotto
    const coda = [ver, esito, code].filter(Boolean);
    let dopoB = b; for (const x of coda) { dopoB.after(x); dopoB = x; }
  }
  rilAvvisa("fine");
};
addEventListener("keydown", (ev) => {
  if (RIL.rt && ev.key === "Escape" && V && V.fine && !$("velo").hidden) rilAvvisa("menu");
});

// ── stile ────────────────────────────────────────────────────────────────────────────────────────────
(function () {
  const st = document.createElement("style");
  st.id = "ril-css";
  st.textContent = [
    // bordi del telefono: il massimo fra quelli del browser e quelli che passa il guscio
    ":root{--sat:max(env(safe-area-inset-top,0px),var(--sa-top,0px));--sab:max(env(safe-area-inset-bottom,0px),var(--sa-bottom,0px));--sal:max(env(safe-area-inset-left,0px),var(--sa-left,0px));--sar:max(env(safe-area-inset-right,0px),var(--sa-right,0px))}",
    "#app{padding:calc(var(--sat) + 6px) calc(var(--sar) + 12px) calc(var(--sab) + 6px) calc(var(--sal) + 12px)!important}",
    "@media (min-width:900px) and (min-aspect-ratio:5/4){#app{padding:calc(var(--sat) + 14px) calc(var(--sar) + 18px) calc(var(--sab) + 14px) calc(var(--sal) + 18px)!important}}",
    "#velo{padding:calc(var(--sat) + 8px) calc(var(--sar) + 8px) calc(var(--sab) + 8px) calc(var(--sal) + 8px)}",
    "#coach{bottom:calc(var(--sab) + 150px)!important}",
    // mini app: la lingua la decide l'index
    "html.rt #b-lingua{display:none!important}",
    // mini app: l'index disegna il SUO «Esci» in alto a destra sopra l'iframe (~80x36 a top 4px + bordo, right 8px):
    // la testata lascia libera una zona di 96x44 px in alto a destra (telefono, orizzontale, PC)
    "html.in-rt #testa{padding-right:96px!important;min-height:44px}",
    // scheda: si scorre se non ci sta, tasto principale in evidenza, verifica come link
    ".scheda{max-height:100%;overflow:auto;overscroll-behavior:contain}",
    ".fine-ril .verifica{background:none!important;box-shadow:none!important;color:var(--tenue)!important;height:30px!important;font-size:11px!important;margin-top:4px!important;text-decoration:underline;clip-path:none!important}",
    ".fine-ril .ver-esito{text-align:center}",
    ".fine-ril code{margin-top:6px!important}",
    ".fine-ril .btn.giu{position:sticky;bottom:0;z-index:2}",
    "html.vetrina #app{grid-template-columns:1fr!important;grid-template-rows:1fr!important;grid-template-areas:'scena'!important;padding:0!important;gap:0!important}",
    "html.vetrina #testa,html.vetrina #giocatori-tel,html.vetrina #azioni,html.vetrina #colonna-sx,html.vetrina #colonna-dx,html.vetrina #annuncio,html.vetrina #prof,html.vetrina #chi-risale,html.vetrina #coach,html.vetrina #velo,html.vetrina #tip{display:none!important}",
    "html.vetrina #scena-box{box-shadow:none!important}",
    // la BOTTEGA (6 s) sta sopra il consiglio del tutorial (il consiglio copriva il tasto NIENTE)
    "#bottega{z-index:16!important}",
    "body:has(#bottega:not([hidden])) #coach{visibility:hidden}",
    "#bottega .bt-card{max-height:calc(100% - 16px);overflow:auto}",
    // TELEFONO IN ORIZZONTALE: scena a sinistra a tutta altezza, colonna di 300 px a destra
    "@media (max-height:520px) and (min-aspect-ratio:3/2){",
    " html body #app{grid-template-columns:minmax(0,1fr) 300px!important;grid-template-rows:auto minmax(0,1fr) auto!important;grid-template-areas:'scena testa' 'scena gioc' 'scena azioni'!important;gap:6px 10px!important}",
    " html body #colonna-sx,html body #colonna-dx{display:none!important}",
    " html body #testa{justify-content:space-between}",
    " html body .titolo{display:none!important}",
    " html body #giocatori-tel{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;align-content:start;overflow:auto;min-height:0;padding:3px}",
    " html body #giocatori-tel .gioc{flex-direction:row!important;gap:4px!important;padding:4px 5px!important;align-items:center!important}",
    " html body #giocatori-tel .gioc .foto{width:14px;height:14px;flex:0 0 14px}",
    " html body #giocatori-tel .gioc .foto canvas{width:14px!important;height:14px!important}",
    " html body #giocatori-tel .gioc .foto .lampada,html body #giocatori-tel .gioc .lucchetto{display:none!important}",
    " html body #giocatori-tel .gioc .info{display:flex;flex-direction:column;min-width:0}",
    " html body #giocatori-tel .gioc .nome{font-size:11px}",
    " html body #giocatori-tel .gioc .conti{gap:4px;font-size:10px}",
    " html body #giocatori-tel .gioc.scelto{box-shadow:0 0 0 2px #56e3ff!important}",
    " html body #azioni{width:auto!important}",
    " html body #fase-pill,html body #riga-log,html body kbd{display:none!important}",
    " html body .pulsanti{gap:6px}",
    " html body #azioni .btn{height:46px!important;font-size:12px!important;gap:5px}",
    " html body #azioni .btn svg{width:16px;height:16px}",
    " html body #anello,html body #anello svg{width:46px!important;height:46px!important;flex:0 0 46px!important}",
    " html body #a-num{font-size:16px}",
    " html body .scheda{width:min(92vw,560px)}",
    " html body .podio{margin:2px 0 6px}",
    " html body .podio .p canvas.podio-bot{width:40px!important;height:60px!important}",
    " html body .podio .p.primo canvas.podio-bot{width:54px!important;height:81px!important}",
    " html body .podio .base{width:64px;font-size:16px}",
    " html body .scheda h2{font-size:17px}",
    " html body .tav-key{display:none}",
    " html body #bottega .bt-card{width:min(92vw,560px);padding:10px;gap:5px}",
    " html body #bottega .bt-sub{display:none}",
    " html body #bottega h2{font-size:16px}",
    " html body #bottega .bt-o{min-height:40px;padding:4px 8px}",
    " html body #bottega .bt-o .ef{font-size:10.5px}",
    " html body #bottega .bt-o.niente{min-height:34px}",
    " html body #coach{bottom:auto!important;top:calc(var(--sat) + 8px);left:calc(var(--sal) + 8px);transform:none!important;width:min(56vw,380px)}",
    " html body .fine-ril .stat{display:none}",
    " html body .fine-ril .riga{padding:3px 4px}",
    " html body .fine-ril .riga canvas{width:24px;height:24px}",
    " html body .fine-ril .podio .p canvas.podio-bot{width:32px!important;height:48px!important}",
    " html body .fine-ril .podio .p.primo canvas.podio-bot{width:44px!important;height:66px!important}",
    " html body .fine-ril .podio .base{width:56px;font-size:14px}",
    "}",
  ].join("\n");
  document.head.appendChild(st);
})();
