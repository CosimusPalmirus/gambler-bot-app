// NON SVEGLIARE IL DRAGO - la schermata PRIMA DELLA PARTITA, rifatta (18/11, richiesta del proprietario:
// «quella col titolo e la spiegazione non mi piace: falla MOLTO piu' bella, chiara e figa»).
// Al posto della scheda «Al tavolo» (titolo + 3 righe): una schermata intera sulla grotta, col LOGO nuovo (L2b, pixel),
// la partita spiegata in 4 QUADRI ANIMATI in pixel art (gli sprite veri del gioco): 1 scendi · 2 ogni passo una carta ·
// 3 due segni uguali svegliano il drago · 4 torna su (oro al sicuro, da solo prendi gli avanzi), testi brevi IT/EN;
// la variante (CLASSICA / AVVENTURA, con le regole in piu' dell'avventura: uovo, bivio, bottega); i ladri al tavolo
// con le FOTO vere (bot: il glifo); il conto alla rovescia grande e il «VIA!»; un tocco (o Invio/Spazio/Esc) la salta.
// Soldi: SOLO ai tavoli a soldi di Telegram (posta, piatto, un solo vincitore); mai su Discord (?piatt=dc), mai in allenamento.
// Dura quanto la fase «intro» del motore (4 s): il server non cambia. Si appoggia a ritratti.js (ritratto/gettone).
"use strict";
const INTRO = { el: null, chiuso: false, finito: false, t0: 0, raf: 0, tele: [], vista: 0,
  ver: (() => { try { return new URL(document.currentScript.src).searchParams.get("v") || ""; } catch (e) { return ""; } })() };
const IN_T = {
  it: { p: [["Scendi nella grotta", "In segreto, ogni volta: AVANTI o TORNA SU"],
    ["Ogni passo gira una carta", "L'oro si divide fra chi è giù: il resto resta lì"],
    ["2 segni uguali: si sveglia!", "Chi è ancora giù perde l'oro che porta"],
    ["Torna su: oro al sicuro", "Nel forziere per sempre. Da solo prendi gli avanzi"]],
    tavolo: "Al tavolo", tu: "TU", pronti: "Pronti?", via: "VIA!", salta: "Tocca per saltare", scende: "SI SCENDE!",
    classica: "Classica", avventura: "Avventura", pura: "Pura", evento: "Evento", tutorial: "Tutorial",
    sped: (n) => n + " spedizioni", ladri: (n) => n + " ladri", vince: "Vince chi ha più oro nel forziere",
    avvTit: "Avventura: in più",
    avv: [["UOVO", "Uovo del drago: vale 12, ma finché è dentro OGNI segno sveglia il drago"],
      ["BIVIO", "Bivio: sinistra o destra. L'oro di una via è solo di chi la prende"],
      ["TORCIA", "Bottega fra le spedizioni: torcia, scudo o ninna nanna, pagati col forziere"]],
    posta: (p, t) => "Posta " + p + " · piatto " + t, unico: "Un solo vincitore: tutto il piatto al primo" },
  en: { p: [["Go down the cave", "In secret, every time: GO ON or GO BACK"],
    ["Every step flips a card", "Gold is split among those down: the rest stays"],
    ["2 same signs: it wakes!", "Whoever is still down loses the gold they carry"],
    ["Go back: gold is safe", "Into your chest for good. Alone, you take the leftovers"]],
    tavolo: "At the table", tu: "YOU", pronti: "Ready?", via: "GO!", salta: "Tap to skip", scende: "DOWN WE GO!",
    classica: "Classic", avventura: "Adventure", pura: "Pure", evento: "Event", tutorial: "Tutorial",
    sped: (n) => n + " expeditions", ladri: (n) => n + " thieves", vince: "Most gold in the chest wins",
    avvTit: "Adventure: extras",
    avv: [["UOVO", "Dragon egg: worth 12, but while it's inside ANY sign wakes the dragon"],
      ["BIVIO", "Fork: left or right. A path's gold goes only to those who take it"],
      ["TORCIA", "Shop between expeditions: torch, shield or lullaby, paid from your chest"]],
    posta: (p, t) => "Stake " + p + " · pot " + t, unico: "Single winner: the whole pot to first place" },
};
const inT = (k, ...a) => { const v = IN_T[LINGUA][k]; return typeof v === "function" ? v(...a) : v; };
const inEsc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function inVariante() { const v = String((V && V.variante) || (INFO && INFO.variante) || "classica").toLowerCase(); return IN_T.it[v] ? v : "classica"; }
function inSoldi() { try { return typeof rilSoldi === "function" ? rilSoldi() : !!(INFO && INFO.a_soldi && !/piatt=dc/.test(location.search)); } catch (e) { return false; } }
function inModo() { try { return typeof rilModo === "function" ? rilModo() : t_("allen"); } catch (e) { return ""; } }
function inEuro(c) { const s = (c / 100).toFixed(2); return (LINGUA === "it" ? s.replace(".", ",") : s) + ' <span class="eur">€</span>'; }   // il carattere pixel non ha l'euro

// ── i 4 quadri: scenette 120x68 pixel d'arte con gli sprite del gioco ──────────────────────────────────────────────
const QW = 120, QH = 68;
function qFondo(x, P) {
  x.fillStyle = "rgb(" + P.notte + ")"; x.fillRect(0, 0, QW, QH);
  const g = PIX.img.grotta; if (g) { x.globalAlpha = .55; x.drawImage(g, 50, 96, QW, QH, 0, 0, QW, QH); x.globalAlpha = 1; }
}
function qBot(x, sg, fr, px, py, flip) {
  const sp = botPix(sg, fr); x.save(); x.translate(Math.round(px), Math.round(py)); if (flip) x.scale(-1, 1); x.drawImage(sp, -10, -30); x.restore();
}
function qMoneta(x, t, px, py) { x.drawImage(PIX.img.moneta, (Math.floor(t * 12) % 6) * 9, 0, 9, 9, Math.round(px) - 4, Math.round(py) - 4, 9, 9); }
const qe = (v) => Math.max(0, Math.min(1, v)), qs = (v) => { v = qe(v); return v * v * (3 - 2 * v); };
function quadro(i, x, t) {
  const P = PIX.meta.pal; qFondo(x, P);
  if (i === 0) {           // 1 · SCENDI: il sentiero a gradini, il ladro scende un passo alla volta
    const L = 2.8, e = (t % L) / L;
    for (let s = 0; s < 4; s++) { const sx = 8 + s * 27, sy = 30 + s * 9; x.fillStyle = "rgb(" + P.g2 + ")"; x.fillRect(sx, sy, 26, 3); x.fillStyle = "rgb(" + P.g1 + ")"; x.fillRect(sx, sy + 3, 26, 2); }
    const passo = Math.min(3, Math.floor(e * 4)), dentro = (e * 4) % 1, mv = qs(dentro / .5);
    const px = 21 + (passo - 1 + mv) * 27, py = 30 + (passo - 1 + mv) * 9;
    const fr = dentro < .5 ? "walk" + (Math.floor(t * 10) % 4) : "idle" + (Math.floor(t * 2) % 2);
    if (passo >= 1) qBot(x, 1, fr, px, py); else qBot(x, 1, "idle0", 21, 30);
    // la freccia AVANTI in pixel, che pulsa
    const a = Math.floor(t * 3) % 2; x.fillStyle = "rgb(" + (a ? P.o3 : P.o2) + ")";
    x.fillRect(100, 8, 4, 10); x.fillRect(96, 16, 12, 2); x.fillRect(98, 18, 8, 2); x.fillRect(100, 20, 4, 2);
  } else if (i === 1) {    // 2 · LA CARTA: sale dal sentiero, si gira, l'oro vola ai due ladri
    const L = 3, e = t % L;
    x.fillStyle = "rgb(" + P.g2 + ")"; x.fillRect(0, 58, QW, 3); x.fillStyle = "rgb(" + P.g1 + ")"; x.fillRect(0, 61, QW, 7);
    qBot(x, 2, "idle" + (Math.floor(t * 2) % 2), 18, 58); qBot(x, 4, "idle" + (Math.floor(t * 2 + 1) % 2), 102, 58);
    const su = qs(e / .5), gira = qs((e - .5) / .35), card = gira < .5 ? dorsoPix() : cartaPix({ t: "perla", v: 7 });
    const w = Math.max(2, Math.round(26 * Math.abs(Math.cos(gira * Math.PI)))), cy = Math.round(56 - su * 30);
    x.drawImage(card, 60 - Math.round(w / 2), cy - 17, w, 34);
    if (e > 1.1 && e < 2.4) { for (const [tx, dx] of [[18, -1], [102, 1]]) for (let c = 0; c < 3; c++) { const k = qs((e - 1.1 - c * .12) / .6); if (k <= 0 || k >= 1) continue; qMoneta(x, t, 60 + (tx - 60) * k, cy - Math.sin(k * Math.PI) * 18 + (30 - cy) * k); } }
    if (e > 1.7) { pixTesto(x, "+3", 18, 14, P.o3, 1, true); pixTesto(x, "+3", 102, 14, P.o3, 1, true); }
    if (e > 1.9) { x.drawImage(PIX.img.mucchio_s, 66, 50); pixTesto(x, "+1", 82, 46, P.bianco, 1, true, "l"); }
  } else if (i === 2) {    // 3 · DUE SEGNI UGUALI: il secondo uguale e il drago si sveglia, la vampata
    const L = 3.2, e = t % L, D = PIX.meta.drago, segno = "CODA";
    const sveglio = e > 1.25 && e < 2.9, fr = sveglio ? "sveglio" + (Math.floor(t * 6) % 2) : "dorme" + (Math.floor(t * 1.4) % 2);
    const sh = sveglio && e < 1.7 ? Math.round(Math.sin(t * 60) * 1.5) : 0;
    x.drawImage(PIX.img.drago, D.frame.indexOf(fr) * D.w, 0, D.w, D.h, 46 + sh, QH - D.h + 2, D.w, D.h);
    const c1 = cartaPix({ t: "pericolo", v: segno });
    x.drawImage(c1, 4, 8);
    if (e > .55) { const k = qs((e - .55) / .3); x.globalAlpha = k; x.drawImage(c1, 6 + 24 * k, 8 + (1 - k) * 10); x.globalAlpha = 1; }
    if (e > .9 && e < 1.3 && Math.floor(t * 8) % 2) { pixTesto(x, "=", 30, 46, P.f3, 2, true); }
    if (sveglio) {
      const bx = 46 + D.bocca[0], by = QH - D.h + 2 + D.bocca[1];
      for (let f = 0; f < 22; f++) { const fx = bx - ((t * 90 + f * 13) % 46), fy = by - 6 + Math.sin(f * 2.3 + t * 9) * 5; x.fillStyle = "rgb(" + [P.f3, P.f2, P.f1][f % 3] + ")"; x.fillRect(Math.round(fx), Math.round(fy), 2, 2); }
      if (e < 1.5) { x.globalAlpha = .35; x.fillStyle = "rgb(" + P.f2 + ")"; x.fillRect(0, 0, QW, QH); x.globalAlpha = 1; }
      pixTesto(x, "!!", 106, 4, P.f3, 1, true);
    } else if (Math.floor(t * 1.4) % 2) pixTesto(x, "Z", 54, 26, P.cie, 1, true);
  } else {                 // 4 · TORNA SU: risale, raccoglie gli avanzi, l'oro nel forziere
    const L = 3, e = t % L;
    x.fillStyle = "rgb(" + P.g2 + ")"; for (let s = 0; s < 3; s++) { x.fillRect(30 + s * 30, 34 + s * 10, 30, 3); }
    x.fillStyle = "rgb(" + P.t1 + ")"; x.fillRect(4, 10, 2, 30); x.fillRect(14, 10, 2, 30); for (let yy = 12; yy < 40; yy += 5) x.fillRect(4, yy, 12, 1);   // la scala del campo
    const fs = Math.floor(t * 4) % 2;
    x.drawImage(PIX.img.forziere, fs && e > 2.1 ? 18 : 0, 0, 18, 16, 20, 18, 18, 16);
    const k = qs(e / 1.9), px = 100 - k * 70, py = 54 - k * 20;
    if (k < .45) { x.drawImage(PIX.img.mucchio_s, 58, 40); pixTesto(x, "2", 56, 32, P.o3, 1, true); }
    if (e < 2.2) qBot(x, 0, k < 1 ? "walk" + (Math.floor(t * 10) % 4) : "festa" + fs, px, py, true);
    else qBot(x, 0, "festa" + fs, 30, 34, true);
    if (e > 1.9 && e < 2.5) { const m = qs((e - 1.9) / .5); qMoneta(x, t, 30 - m * 1, 14 + m * 12 - Math.sin(m * Math.PI) * 10); }
    if (e > 2.1) pixTesto(x, "+8", 29, 6, P.o3, 1, true);
    if (k > .45 && e < 2.1) pixTesto(x, "+2", px, py - 38, P.bianco, 1, true);
  }
}

// ── la schermata ──────────────────────────────────────────────────────────────────────────────────────────────────
function inGiocatori() {
  if (!V) return "";
  return V.giocatori.map((p, i) => {
    const io = p.sg === V.io, nm = (INFO && INFO.nomi && INFO.nomi[p.sg]) || "#" + (p.sg + 1);
    return '<div class="in-g' + (io ? " io" : "") + '" data-sg="' + p.sg + '" style="--d:' + (i * .07).toFixed(2) + "s;--c:" + TINTE[p.sg % 8] + '"><canvas width="112" height="112"></canvas><span class="in-nm">' + inEsc(nm) + "</span>" + (io ? '<i class="in-tu">' + inT("tu") + "</i>" : "") + '<b class="in-ok">✓</b></div>';
  }).join("");
}
function introCostruisci() {
  const el = document.createElement("div"); el.id = "intro"; el.className = "intro";
  el.setAttribute("role", "dialog");
  const v = inVariante(), avv = v === "avventura", soldi = inSoldi();
  const chips = ['<span class="in-chip var' + (avv ? " avv" : "") + '">' + inEsc(inT(v)) + "</span>", '<span class="in-chip">' + inEsc(inModo()) + "</span>",
    '<span class="in-chip">' + inT("sped", (V && V.D) || (INFO && INFO.D) || 5) + "</span>", '<span class="in-chip">' + inT("ladri", (V && V.n) || (INFO && INFO.n) || 0) + "</span>"];
  let soldiH = "";
  if (soldi && INFO && INFO.B) soldiH = '<div class="in-soldi"><b>' + inT("posta", inEuro(INFO.B), inEuro(INFO.B * INFO.n)) + "</b> · " + inEsc(inT("unico")) + (INFO.rake ? " (" + Math.round(INFO.rake * 100) + "% " + (LINGUA === "it" ? "alla casa" : "to the house") + ")" : "") + "</div>";
  const passi = IN_T[LINGUA].p.map((p, i) => '<li class="in-p" style="--i:' + i + '"><canvas width="' + QW + '" height="' + QH + '"></canvas><div class="in-tx"><b><i>' + (i + 1) + "</i>" + inEsc(p[0]) + "</b><span>" + inEsc(p[1]) + "</span></div></li>").join("");
  const avvH = avv ? '<div class="in-avv"><h4>' + inEsc(inT("avvTit")) + "</h4>" + IN_T[LINGUA].avv.map((a) => '<div class="in-a"><span class="in-ic" style="background-position:' + (AV_IC_X(a[0])) + '% 0"></span><span>' + inEsc(a[1]) + "</span></div>").join("") + "</div>" : "";
  el.innerHTML = '<div class="in-velo"></div><div class="in-wrap' + (avv ? " con-avv" : "") + '">' +
    '<div class="in-sx"><header class="in-testa"><img class="in-logo" alt="Non svegliare il drago" src="pix/logo.webp' + (INTRO.ver ? "?v=" + INTRO.ver : "") + '"><div class="in-chips">' + chips.join("") + "</div>" + soldiH + "</header>" +
    '<section class="in-tav"><h3>' + inEsc(inT("tavolo")) + '</h3><div class="in-gioc' + ((V && V.giocatori.length > 4) ? " molti" : "") + '">' + inGiocatori() + "</div></section>" +
    '<footer class="in-via"><div class="in-conto"><b id="in-num">3</b></div><div class="in-pronti"><b id="in-pr">' + inEsc(inT("pronti")) + "</b><small>" + inEsc(inT("salta")) + "</small></div></footer></div>" +
    '<div class="in-dx"><ol class="in-passi">' + passi + "</ol>" + avvH + "</div>" +
    "</div>";
  document.body.appendChild(el);
  el.querySelectorAll(".in-g").forEach((g) => { const sg = +g.dataset.sg, c = g.querySelector("canvas"); c.getContext("2d").drawImage(gettone(sg, 112), 0, 0); if (haFoto(sg)) g.classList.add("con-foto"); });
  INTRO.tele = [...el.querySelectorAll(".in-p canvas")].map((c) => { const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return x; });
  el.addEventListener("pointerdown", (ev) => { ev.preventDefault(); introChiudi(true); });
  return el;
}
function AV_IC_X(n) { const i = (typeof AV_IC !== "undefined" && AV_IC[n] != null) ? AV_IC[n] : 0; return (i / 5 * 100).toFixed(2); }
function introMostra() {
  if (INTRO.chiuso || INTRO.el || !V || !PIX.meta || document.documentElement.classList.contains("vetrina")) return;
  INTRO.el = introCostruisci(); INTRO.t0 = performance.now();
  requestAnimationFrame(() => INTRO.el && INTRO.el.classList.add("su"));
  const giro = () => { if (!INTRO.el) return; introFotogramma(); INTRO.raf = requestAnimationFrame(giro); };
  INTRO.raf = requestAnimationFrame(giro);
}
function introFotogramma() {
  const t = (performance.now() - INTRO.t0) / 1000, el = INTRO.el;
  // i quadri si accendono uno dopo l'altro (0,15 s · 0,85 · 1,55 · 2,25), poi restano accesi e animati
  INTRO.tele.forEach((x, i) => { const on = t > .15 + i * .7; const li = x.canvas.parentNode; if (on && !li.classList.contains("on")) li.classList.add("on"); try { quadro(i, x, RM ? 1.2 : (on ? t - .15 - i * .7 : 0)); } catch (e) { } });
  if (!INTRO.finito && V) {
    const resta = Math.max(0, (V.resta || 0) - (performance.now() - snapT) / 1000), n = Math.ceil(resta);
    const num = el.querySelector("#in-num"), pr = el.querySelector("#in-pr");
    const testo = resta <= .45 ? inT("via") : String(Math.max(1, n));
    if (num.textContent !== testo) { num.textContent = testo; num.parentNode.classList.remove("batti"); void num.offsetWidth; num.parentNode.classList.add("batti"); num.parentNode.classList.toggle("via", resta <= .45); }
    if (resta <= 1.4 && pr.dataset.k !== "via") { pr.dataset.k = "via"; el.classList.add("pronti"); }
  }
}
function introVia() {           // fine della fase intro: «SI SCENDE!» e la schermata si apre sulla grotta
  if (!INTRO.el || INTRO.finito) return;
  INTRO.finito = true;
  const el = INTRO.el; el.classList.add("scende");
  el.insertAdjacentHTML("beforeend", '<div class="in-scende"><b>' + inEsc(inT("scende")) + "</b></div>");
  setTimeout(() => introChiudi(false), RM ? 300 : 900);
}
function introChiudi(tocco) {
  if (!INTRO.el) return;
  const el = INTRO.el; INTRO.el = null; INTRO.chiuso = true; cancelAnimationFrame(INTRO.raf);
  el.classList.add("via-tutta"); el.style.pointerEvents = "none";
  setTimeout(() => el.remove(), tocco ? 220 : 380);
}
addEventListener("keydown", (ev) => { if (INTRO.el && (ev.key === "Escape" || ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); ev.stopImmediatePropagation(); introChiudi(true); } }, true);

// la vecchia scheda «Al tavolo» non si costruisce piu' (aggiornaPolish la salta se la trova gia' «fatta»);
// il suo #tav-sub resta, nascosto, per chi lo aggiorna (abisso.js, avventura.js)
(function () { const p = document.createElement("p"); p.id = "tav-sub"; p.hidden = true; document.body.appendChild(p); })();
const aggiornaPolishPrimaIntro = aggiornaPolish;
aggiornaPolish = function () {
  const intro = V && V.fase === "intro" && !V.fine;
  if (intro) { $("scheda").dataset.tavolo = 1; introMostra(); }
  aggiornaPolishPrimaIntro();
  if (!intro && INTRO.el) introVia();
  if (intro && INTRO.el && V.giocatori) {       // assenti / offline in tempo reale nell'elenco
    INTRO.el.querySelectorAll(".in-g").forEach((g) => { const p = V.giocatori[+g.dataset.sg] || {}; g.classList.toggle("off", !!(p.afk || p.offline)); });
  }
};

// ── stile ────────────────────────────────────────────────────────────────────────────────────────────────────────
(function () {
  const st = document.createElement("style");
  st.id = "intro-css";
  st.textContent = `
.intro{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;overflow:auto;overscroll-behavior:contain;
  padding:calc(var(--sat,0px) + 10px) calc(var(--sar,0px) + 12px) calc(var(--sab,0px) + 10px) calc(var(--sal,0px) + 12px);box-sizing:border-box;
  background:#0b0810;cursor:pointer;-webkit-tap-highlight-color:transparent;opacity:0;transition:opacity .25s}
.intro.su{opacity:1}
.intro .in-velo{position:fixed;inset:0;z-index:-1;background:
  radial-gradient(120% 70% at 50% 108%,rgba(255,110,40,.30),rgba(255,110,40,0) 60%),
  radial-gradient(90% 60% at 50% 30%,rgba(60,38,70,.55),rgba(11,8,16,0) 70%),
  linear-gradient(180deg,rgba(11,8,16,.35),rgba(11,8,16,.92)),url(pix/grotta.png) center top/660px auto repeat #0b0810;image-rendering:pixelated}
.in-wrap{width:100%;max-width:520px;margin:auto;display:flex;flex-direction:column;gap:clamp(6px,1.4vh,14px);color:#f4f2fb}
.in-sx,.in-dx{display:contents}
.in-testa{order:1}.in-passi{order:2}.in-avv{order:3}.in-tav{order:4}.in-via{order:5}
.eur{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:700}
.in-testa{display:flex;flex-direction:column;align-items:center;gap:6px}
.in-logo{display:block;width:min(300px,76vw,calc(22vh * 1.32));height:auto;image-rendering:pixelated;filter:drop-shadow(0 6px 0 rgba(0,0,0,.55));animation:in-logo .7s cubic-bezier(.34,1.56,.64,1) both}
@keyframes in-logo{from{transform:translateY(-14px) scale(.9);opacity:0}}
html.in-rt .in-logo{width:min(300px,calc(100vw - 200px),calc(22vh * 1.32))}
.in-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:5px}
.in-chip{font:400 10px/1 "Silkscreen",monospace;letter-spacing:.04em;text-transform:uppercase;padding:5px 7px;background:#1d1418;color:#d8d4ea;box-shadow:0 0 0 2px #3a2a24}
.in-chip.var{background:#ffc046;color:#2a1200;box-shadow:inset 0 -2px 0 #c27a18,0 0 0 2px #0b0810}
.in-chip.var.avv{background:#58d6a8;color:#06231a;box-shadow:inset 0 -2px 0 #2a8f6d,0 0 0 2px #0b0810}
.in-soldi{font-size:12px;color:#ffe2a0;text-align:center;line-height:1.35}.in-soldi b{color:#ffd27a}
.in-passi{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}
.in-p{position:relative;background:#140e14;box-shadow:0 0 0 2px #3a2a24,0 4px 0 2px #060408;padding:5px;display:flex;flex-direction:column;gap:5px;opacity:.28;transform:translateY(6px) scale(.97);transition:opacity .3s,transform .45s cubic-bezier(.34,1.56,.64,1),box-shadow .3s}
.in-p.on{opacity:1;transform:none;box-shadow:0 0 0 2px #6b4a2a,0 4px 0 2px #060408}
.in-p canvas{display:block;width:100%;height:auto;aspect-ratio:120/68;image-rendering:pixelated;background:#0b0810}
.in-tx{display:flex;flex-direction:column;gap:2px;padding:0 2px 2px}
.in-tx b{font:400 11px/1.25 "Silkscreen",monospace;color:#ffd27a;letter-spacing:.02em;display:flex;gap:6px;align-items:flex-start}
.in-tx b i{font-style:normal;flex:0 0 auto;min-width:16px;height:16px;display:grid;place-items:center;background:#ffc046;color:#2a1200;font-size:10px;box-shadow:inset 0 -2px 0 #c27a18}
.in-p:nth-child(3) .in-tx b{color:#ff8a70}.in-p:nth-child(3) .in-tx b i{background:#ff5a4e;color:#fff;box-shadow:inset 0 -2px 0 #a3241c}
.in-tx span{font-size:11.5px;line-height:1.3;color:#d8d4ea}
.in-avv{background:#0f1a16;box-shadow:0 0 0 2px #2a8f6d;padding:7px 8px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px 8px}
.in-avv h4{grid-column:1/-1;margin:0;font:400 10px/1 "Silkscreen",monospace;color:#58d6a8;letter-spacing:.05em;text-transform:uppercase}
.in-a{display:flex;gap:6px;align-items:flex-start;font-size:10.5px;line-height:1.28;color:#d8f4ea}
.in-ic{flex:0 0 32px;height:32px;background:url(pix/avventura.png) 0 0/600% 100% no-repeat;image-rendering:pixelated}
.in-tav h3{margin:0 0 6px;font:400 10px/1 "Silkscreen",monospace;letter-spacing:.06em;color:#9a96ad;text-transform:uppercase;text-align:center}
.in-gioc{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 6px}
.in-g{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;animation:in-g .5s var(--d) cubic-bezier(.34,1.56,.64,1) both}
@keyframes in-g{from{transform:translateY(10px) scale(.8);opacity:0}}
.in-g canvas{width:48px;height:48px;image-rendering:auto}
.in-g.con-foto canvas{width:54px;height:54px}
.in-nm{font:400 10px/1.1 "Silkscreen",monospace;color:var(--c);max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 0 #000}
.in-tu{position:absolute;top:-6px;left:50%;transform:translateX(-50%);font:400 9px/1 "Silkscreen",monospace;font-style:normal;background:#ffd27a;color:#2a1200;padding:2px 4px;box-shadow:0 0 0 2px #0b0810}
.in-ok{position:absolute;top:30px;right:calc(50% - 32px);width:16px;height:16px;display:grid;place-items:center;font-size:11px;background:#58d6a8;color:#06231a;box-shadow:0 0 0 2px #0b0810;transform:scale(0);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.in-g.con-foto .in-ok{top:36px;right:calc(50% - 34px)}
.intro.pronti .in-ok{transform:scale(1)}
.intro.pronti .in-g:nth-child(2) .in-ok{transition-delay:.05s}.intro.pronti .in-g:nth-child(3) .in-ok{transition-delay:.1s}.intro.pronti .in-g:nth-child(4) .in-ok{transition-delay:.15s}
.intro.pronti .in-g:nth-child(5) .in-ok{transition-delay:.2s}.intro.pronti .in-g:nth-child(6) .in-ok{transition-delay:.25s}.intro.pronti .in-g:nth-child(7) .in-ok{transition-delay:.3s}.intro.pronti .in-g:nth-child(8) .in-ok{transition-delay:.35s}
.in-g.off{opacity:.4}
.in-via{display:flex;align-items:center;justify-content:center;gap:12px}
.in-conto{width:62px;height:62px;display:grid;place-items:center;background:#ffc046;box-shadow:inset 0 -4px 0 #c27a18,0 0 0 3px #0b0810,0 0 28px rgba(255,180,70,.55)}
.in-conto b{font:400 32px/1 "Silkscreen",monospace;color:#2a1200}
.in-conto.via{background:#ff5a4e;box-shadow:inset 0 -4px 0 #a3241c,0 0 0 3px #0b0810,0 0 34px rgba(255,90,78,.7)}.in-conto.via b{font-size:20px;color:#fff}
.in-conto.batti{animation:in-batti .45s cubic-bezier(.34,1.56,.64,1)}
@keyframes in-batti{from{transform:scale(1.35)}}
.in-pronti{display:flex;flex-direction:column;gap:3px}
.in-pronti b{font:400 18px/1 "Silkscreen",monospace;color:#f4f2fb;letter-spacing:.03em}
.in-pronti small{font-size:11px;color:#9a96ad}
.in-scende{position:fixed;inset:0;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle at 50% 55%,rgba(255,120,40,.35),rgba(11,8,16,0) 60%)}
.in-scende b{font:400 clamp(28px,9vw,64px)/1 "Silkscreen",monospace;color:#ffd27a;text-shadow:0 4px 0 #6b2a10,0 0 30px rgba(255,150,60,.8);animation:in-scende .9s cubic-bezier(.34,1.56,.64,1) both}
@keyframes in-scende{0%{transform:scale(.4);opacity:0}30%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
.intro.scende .in-wrap{transition:opacity .35s,transform .5s;opacity:.15;transform:scale(.96)}
.intro.via-tutta{opacity:0;transition:opacity .3s}
html.vetrina .intro{display:none!important}
/* telefono basso (360x640...): niente seconde righe, ladri su una fila */
@media (max-height:720px) and (max-aspect-ratio:1/1){
  .in-tx span{display:none}
  .in-wrap{gap:6px}.in-soldi{font-size:10px;line-height:1.25}
  .in-logo{width:min(250px,70vw,calc(20vh * 1.32))}
  html.in-rt .in-logo{width:min(250px,calc(100vw - 200px),calc(20vh * 1.32))}
  .in-gioc.molti{grid-template-columns:repeat(8,minmax(0,1fr));gap:4px 3px}
  .in-gioc.molti .in-g canvas{width:36px;height:36px}
  .in-gioc:not(.molti){grid-template-columns:repeat(4,minmax(0,1fr))}
  .in-g.con-foto canvas{width:40px;height:40px}
  .in-nm{font-size:9px}
  .in-ok{top:22px;right:calc(50% - 22px)}.in-g.con-foto .in-ok{top:26px;right:calc(50% - 24px)}
  .in-conto{width:50px;height:50px}.in-conto b{font-size:26px}
  .in-avv{padding:5px 6px;gap:4px 6px}.in-a{font-size:9.5px}.in-ic{flex-basis:24px;height:24px}
}
/* telefono in verticale con l'AVVENTURA: un riquadro in piu', il resto si stringe */
@media (max-aspect-ratio:1/1){
  .con-avv .in-tx span{display:none}
  .con-avv .in-logo{width:min(240px,64vw,calc(17vh * 1.32))}
  html.in-rt .con-avv .in-logo{width:min(240px,calc(100vw - 200px),calc(17vh * 1.32))}
  .con-avv .in-avv{grid-template-columns:1fr;gap:4px}
  .con-avv .in-a{align-items:center}
  .con-avv .in-ic{flex-basis:26px;height:26px}
  .con-avv .in-gioc.molti{grid-template-columns:repeat(8,minmax(0,1fr));gap:4px 3px}
  .con-avv .in-gioc.molti .in-g canvas{width:36px;height:36px}.con-avv .in-gioc.molti .in-g.con-foto canvas{width:40px;height:40px}
  .con-avv .in-gioc.molti .in-nm{font-size:9px}
  .con-avv .in-gioc.molti .in-ok{top:22px;right:calc(50% - 22px)}.con-avv .in-gioc.molti .in-g.con-foto .in-ok{top:26px;right:calc(50% - 24px)}
}
@media (max-aspect-ratio:1/1) and (max-height:720px){
  .con-avv .in-p canvas{aspect-ratio:120/52;object-fit:cover}
  .con-avv .in-logo{width:min(200px,56vw,calc(12vh * 1.32))}
  .con-avv.in-wrap{gap:5px}
}
/* telefono in orizzontale: logo, ladri e conto a sinistra; i 4 quadri a destra */
@media (max-height:520px) and (min-aspect-ratio:3/2){
  .intro{padding:calc(var(--sat,0px) + 8px) calc(var(--sar,0px) + 12px) calc(var(--sab,0px) + 8px) calc(var(--sal,0px) + 12px)}
  html.in-rt .in-dx{padding-top:34px}          /* il «Esci» dell'index sta in alto a destra, sopra i quadri */
  .in-soldi{font-size:10px;line-height:1.25}
  .in-wrap{max-width:880px;flex-direction:row;align-items:center;gap:16px}
  .in-sx{display:flex;flex-direction:column;gap:8px;flex:0 0 36%;min-width:0}
  .in-dx{display:flex;flex-direction:column;gap:8px;flex:1 1 auto;min-width:0}
  .in-via{justify-content:flex-start}
  .in-chip:nth-child(4){display:none}
  .in-chip{font-size:9px;padding:4px 6px}
  .in-logo{width:min(250px,30vw,calc(27vh * 1.32))}
  html.in-rt .in-logo{width:min(250px,30vw,calc(27vh * 1.32))}
  .in-tx span{display:none}
  .in-p{padding:4px;gap:3px}
  .in-p canvas{aspect-ratio:120/58;object-fit:cover}
  .con-avv .in-p canvas{aspect-ratio:120/46}
  .in-gioc{gap:6px 4px}
  .in-g canvas{width:34px;height:34px}.in-g.con-foto canvas{width:40px;height:40px}
  .in-ok{top:20px;right:calc(50% - 22px)}.in-g.con-foto .in-ok{top:26px;right:calc(50% - 24px)}
  .in-conto{width:46px;height:46px}.in-conto b{font-size:24px}.in-conto.via b{font-size:15px}
  .in-avv{padding:5px 7px;gap:3px 8px}.in-a{font-size:9.5px;line-height:1.22}.in-ic{flex-basis:22px;height:22px}
}
/* PC: tutto piu' grande, i 4 quadri in fila */
@media (min-width:900px) and (min-aspect-ratio:5/4){
  .in-wrap{max-width:1080px;gap:18px}
  .in-logo{width:min(400px,calc(30vh * 1.32))}
  .con-avv .in-logo{width:min(360px,calc(24vh * 1.32))}
  .in-passi{grid-template-columns:repeat(4,1fr);gap:14px}
  .in-p{padding:7px}
  .in-tx b{font-size:13px}.in-tx span{font-size:13px}
  .in-chip{font-size:12px;padding:6px 9px}
  .in-soldi{font-size:14px}
  .in-gioc{display:flex;justify-content:center;flex-wrap:wrap;gap:14px 18px}
  .in-g{width:96px}
  .in-g canvas{width:64px;height:64px}.in-g.con-foto canvas{width:76px;height:76px}
  .in-nm{font-size:12px}
  .in-ok{top:44px;right:8px}.in-g.con-foto .in-ok{top:54px;right:4px}
  .in-avv{padding:10px 14px}.in-a{font-size:12.5px}.in-ic{flex-basis:40px;height:40px}
  .in-conto{width:76px;height:76px}.in-conto b{font-size:40px}.in-conto.via b{font-size:26px}
  .in-pronti b{font-size:24px}.in-pronti small{font-size:13px}
}
`;
  document.head.appendChild(st);
})();
