// NON SVEGLIARE IL DRAGO - FOTO GRANDI (18/11, richiesta del proprietario: «le foto profilo sono TROPPO piccole»).
// Si carica dopo rilascio.js/polish.js/oro.js (prima di suoni.js, che resta l'ultimo). Non cambia il filo ne' le regole.
//  · RITRATTO: la foto vera NITIDA dentro una cornice in pixel (angoli a gradini) del colore del seggio; la foto occupa
//    l'80% (prima il 68% di un gettone tondo). I bot e chi non ha foto: il gettone di sempre col glifo del seggio.
//  · gettoni dei giocatori: 26 px sul telefono (erano 14), 30 px in orizzontale (14), 50 px sul PC (42).
//  · SCENA: sopra ogni ladro con la foto un medaglione (38 px telefono, 32 in orizzontale, fino a 72 px PC) col filo fino alla testa;
//    il nome sotto il medaglione mentre si sceglie. Niente sovrapposizioni fra medaglioni/nomi, mai sotto l'HUD ne' sul drago.
//  · PODIO e righe della classifica: foto 46-56 px (erano 28) e righe 40 px (34).
"use strict";
const RITR = { cache: new Map() };
function haFoto(sg) { return !!(typeof FOTO !== "undefined" && FOTO && FOTO[sg]); }
// la sagoma a gradini: n x n celle, angoli tagliati di 3-2-1 celle; disegna righe piene (o le aggiunge al tracciato)
function sagoma(ctx, n, u, ins, path) {
  for (let r = ins; r < n - ins; r++) {
    const e = r - ins, f = n - 1 - ins - r, cut = Math.max(0, 3 - Math.min(e, f));
    const x = (ins + cut) * u, w = (n - 2 * ins - 2 * cut) * u;
    if (w <= 0) continue;
    if (path) ctx.rect(x, r * u, w, u + .5); else ctx.fillRect(x, r * u, w, u + .5);
  }
}
function ritratto(sg, d) {
  d = Math.max(8, Math.round(d));
  const k = sg + "|" + d; if (RITR.cache.has(k)) return RITR.cache.get(k);
  const c = tela(d, d), x = c.getContext("2d"), n = 20, u = d / n, col = TINTE[sg % 8];
  x.fillStyle = "#0b0810"; sagoma(x, n, u, 0);                 // contorno scuro
  x.fillStyle = col; sagoma(x, n, u, 1);                        // cornice del colore del seggio
  x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(0, (n - 2) * u, d, u);   // ombra in basso sulla cornice
  x.save(); x.beginPath(); sagoma(x, n, u, 2, true); x.clip();
  x.fillStyle = "#140f26"; x.fillRect(0, 0, d, d);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
  const im = FOTO[sg], s = Math.max((d - 4 * u) / im.width, (d - 4 * u) / im.height) * 1.04, iw = im.width * s, ih = im.height * s;
  x.drawImage(im, (d - iw) / 2, 2 * u + (d - 4 * u - ih) * .42, iw, ih);
  x.restore();
  x.fillStyle = "rgba(255,255,255,.7)"; x.fillRect(3 * u, 1 * u, 2 * u, u); x.fillRect(2 * u, 2 * u, u, u);   // il riflesso in pixel
  RITR.cache.set(k, c); return c;
}
// ovunque si disegna un gettone: chi ha la foto ha il ritratto, i bot il glifo di sempre
const gettonePrimaRitr = gettone;
gettone = function (sg, d) { return haFoto(sg) ? ritratto(sg, d) : gettonePrimaRitr(sg, d); };

// righe di classifica / riepilogo / storia: tela piu' fitta (la riga e' piu' grande)
const rigaPrimaRitr = riga;
riga = function (sg, destra, extra) {
  const r = rigaPrimaRitr(sg, destra, extra), c = r.querySelector("canvas");
  if (c) { c.width = c.height = 96; c.getContext("2d").drawImage(gettone(sg, 96), 0, 0); if (haFoto(sg)) c.classList.add("ritr"); }
  return r;
};

// il podio: rilascio.js mette la foto a 28 px con stile in linea: qui diventa 46 px (56 al primo), disegnata fitta
const finalePrimaRitr = finale;
finale = function (msg) {
  finalePrimaRitr(msg);
  try {
    document.querySelectorAll("#scheda .podio .p").forEach((p) => {
      const c = p.querySelector(".podio-foto"); if (!c) return;
      const ord = msg.extra.gruppi.flat(), chi = [ord[1], ord[0], ord[2]].filter((v) => v !== undefined);
      const sg = chi[[...p.parentNode.children].indexOf(p)]; if (sg === undefined) return;
      c.width = c.height = 128; const x = c.getContext("2d"); x.clearRect(0, 0, 128, 128); x.drawImage(ritratto(sg, 128), 0, 0);
      const lato = p.classList.contains("primo") ? 56 : 46;
      c.style.cssText = "width:" + lato + "px!important;height:" + lato + "px!important;border-radius:0!important;box-shadow:none!important;image-rendering:auto;margin-top:-4px";
    });
  } catch (e) { console.warn(e); }
};

// la striscia del telefono: col gettone piu' grande il nome ha meno posto; il glifo davanti al nome si toglie
// (il gettone mostra gia' il glifo dei bot, la cornice colorata il seggio di chi ha la foto): il nome resta leggibile
const aggiornaGiocatoriPrimaRitr = aggiornaGiocatori;
aggiornaGiocatori = function () {
  aggiornaGiocatoriPrimaRitr();
  if (!V) return;
  for (const el of $("giocatori-tel").children) {
    const n = el.querySelector(".nome"), sg = +el.dataset.sg; if (!n) continue;
    const g = gl(sg) + " "; if (n.textContent.indexOf(g) === 0) n.textContent = n.textContent.slice(g.length);
  }
};

// ── la scena: medaglioni sopra i ladri, sullo strato dei nomi (pixel dello schermo, foto nitida) ──────────────────
disegnaNomi = function () {
  const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  if (strato.width !== Math.round(r.width * d) || strato.height !== Math.round(r.height * d)) { strato.width = Math.round(r.width * d); strato.height = Math.round(r.height * d); }
  sx2.setTransform(d, 0, 0, d, 0, 0); sx2.clearRect(0, 0, r.width, r.height); sx2.imageSmoothingEnabled = false;
  RITR.medaglie = 0;
  if (!V || !PIX.meta || !NOMI_ORA.length) return;
  const k = r.width / cv.width, cam = PIX.cam || 0, top = (PIX.hudB || 0) * k, fondo = (PIX.zonaTop || cv.height) * k;
  const calmo = V.fase === "scelta" && !(typeof RIT !== "undefined" && RIT.attivo);
  const P = PIX.meta.pal, posti = [], M = Math.round(Math.max(r.height < 420 ? 32 : 38, Math.min(72, k * 18)));
  let muro = r.width - 2;            // il drago: i medaglioni restano alla sua sinistra
  try { if (typeof dragoX === "function") muro = Math.min(muro, (dragoX(geo()) + 2) * k); } catch (e) { }
  const libero = (a) => a[0] >= 2 && a[2] <= r.width - 2 && a[1] >= top + 2 && !posti.some((p) => a[0] < p[2] + 2 && p[0] < a[2] + 2 && a[1] < p[3] + 2 && p[1] < a[3] + 2);
  const ordine = NOMI_ORA.slice().sort((a, b) => ((b.sg === V.io) - (a.sg === V.io)) || (haFoto(b.sg) - haFoto(a.sg)) || a.x - b.x);
  const fili = [], blocchi = [];
  for (const v of ordine) {
    const x = v.x * k, yTesta = (v.y - cam) * k;
    if (yTesta < top + 4 || yTesta > fondo) continue;
    const col = TINTE[v.sg % 8], io = v.sg === V.io;
    if (haFoto(v.sg)) {
      const tx = calmo ? nome6(v.sg) : "", tw = tx ? tx.length * 6 + 5 : 0, bw = Math.max(M, tw), bh = M + (tx ? 12 : 0);
      let messo = null;
      for (let j = 0; j < 9 && !messo; j++) {
        for (const dx of [0, -.6, .6, -1.15, 1.15]) {
          let x0 = Math.round(x - bw / 2 + dx * M);
          if (x0 + bw > muro - 2 && dx >= 0) x0 = Math.round(muro - 2 - bw);
          const y0 = Math.round(yTesta - 4 - bh - j * Math.round(M * .5));
          const a = [x0, y0, x0 + bw, y0 + bh];
          if (libero(a)) { messo = a; break; }
        }
      }
      if (messo) {
        posti.push(messo); blocchi.push({ a: messo, sg: v.sg, tx, tw, bw, io, col });
        const cxm = (messo[0] + messo[2]) / 2;
        fili.push([cxm, messo[1] + M, x, yTesta - 1, io ? "#ffd27a" : col]);
        continue;
      }
    }
    if (!calmo) {   // pallino del colore del ladro (come prima)
      const a = [Math.round(x) - 3, Math.round(yTesta) - 9, Math.round(x) + 3, Math.round(yTesta) - 3];
      if (!posti.some((p) => a[0] < p[2] && p[0] < a[2] && a[1] < p[3] && p[1] < a[3])) {
        sx2.fillStyle = "#0b0810"; sx2.fillRect(a[0], a[1], 6, 6);
        sx2.fillStyle = io ? "#ffd27a" : col; sx2.fillRect(a[0] + 1, a[1] + 1, 4, 4);
      }
      continue;
    }
    const tx = nome6(v.sg), w = tx.length * 6 + 5, h = 11;
    let y = yTesta - h - 3; const x0 = Math.max(2, Math.min(r.width - w - 2, Math.round(x - w / 2)));
    for (let tent = 0; tent < 8 && !libero([x0, y, x0 + w, y + h]); tent++) y -= h + 2;
    if (!libero([x0, y, x0 + w, y + h])) continue;
    posti.push([x0, y, x0 + w, y + h]);
    sx2.fillStyle = io ? "rgba(60,40,8,.92)" : "rgba(12,9,14,.78)"; sx2.fillRect(x0, Math.round(y), w, h);
    sx2.fillStyle = io ? "#ffd27a" : col; sx2.fillRect(x0, Math.round(y) + h - 1, w, 1);
    pixTesto(sx2, tx, x0 + 3, Math.round(y) + 2, io ? P.o3 : [214, 208, 226], 1, false, "l");
    if (window.__audit) PIX.box.push(["nome", x0 / k, Math.round(y) / k, w / k, h / k]);
  }
  // i fili (tratteggiati, del colore del ladro) sotto, poi i medaglioni
  for (const [x1, y1, x2, y2, c] of fili) {
    const L = Math.hypot(x2 - x1, y2 - y1); if (L < 3) continue;
    sx2.fillStyle = "#0b0810"; for (let s = 0; s < L; s += 3) sx2.fillRect(Math.round(x1 + (x2 - x1) * s / L) - 1, Math.round(y1 + (y2 - y1) * s / L), 3, 2);
    sx2.fillStyle = c; for (let s = 0; s < L; s += 3) sx2.fillRect(Math.round(x1 + (x2 - x1) * s / L), Math.round(y1 + (y2 - y1) * s / L), 1, 2);
  }
  RITR.medaglie = blocchi.length;                 // per le prove
  for (const b of blocchi) {
    const [x0, y0] = b.a, px = Math.round(x0 + (b.bw - M) / 2);
    sx2.imageSmoothingEnabled = true; sx2.drawImage(ritratto(b.sg, M * d), px, y0, M, M); sx2.imageSmoothingEnabled = false;
    if (b.io) { sx2.fillStyle = "#ffd27a"; sx2.fillRect(px + 3, y0 - 2, M - 6, 2); }      // il tuo: un filo d'oro in cima
    if (b.tx) {
      const nx = Math.round(x0 + (b.bw - b.tw) / 2), ny = y0 + M + 1;
      sx2.fillStyle = b.io ? "rgba(60,40,8,.94)" : "rgba(12,9,14,.88)"; sx2.fillRect(nx, ny, b.tw, 11);
      sx2.fillStyle = b.io ? "#ffd27a" : b.col; sx2.fillRect(nx, ny + 10, b.tw, 1);
      pixTesto(sx2, b.tx, nx + 3, ny + 2, b.io ? P.o3 : [236, 232, 244], 1, false, "l");
    }
    if (window.__audit) PIX.box.push(["nome", x0 / k, y0 / k, b.bw / k, (b.a[3] - y0) / k]);
  }
};

// ── stile ────────────────────────────────────────────────────────────────────────────────────────────────────────
(function () {
  const st = document.createElement("style");
  st.id = "ritr-css";
  st.textContent = [
    // PC (colonna a sinistra)
    "html body #giocatori-pc .gioc .foto,html body #giocatori-pc .gioc .foto canvas{width:50px;height:50px}",
    ".gioc .foto canvas,.riga canvas,.tav-p canvas{image-rendering:auto}",
    // telefono in verticale: la striscia di 4 gettoni per riga, foto 26 px
    "@media (max-width:899px),(max-aspect-ratio:5/4){",
    " html body #app .gioc .foto{width:26px!important;height:26px!important;flex:0 0 26px!important}",
    " html body #app .gioc .foto canvas{width:26px!important;height:26px!important}",
    " html body #app .gioc{gap:5px!important;padding:4px 4px!important}",
    " html body #app .gioc .nome{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}",
    " html body #app .gioc .info{flex:1 1 auto}",
    "}",
    // telefono in orizzontale (colonna di 300 px): foto 30 px
    "@media (max-height:520px) and (min-aspect-ratio:3/2){",
    " html body #app #giocatori-tel .gioc .foto{width:30px!important;height:30px!important;flex:0 0 30px!important}",
    " html body #app #giocatori-tel .gioc .foto canvas{width:30px!important;height:30px!important}",
    " html body #app #giocatori-tel .gioc{padding:3px 5px!important}",
    " html body .fine-ril .riga canvas{width:30px!important;height:30px!important}",
    "}",
    // classifica: righe con la foto piu' grande
    ".riga canvas{width:40px!important;height:40px!important}",
  ].join("\n");
  document.head.appendChild(st);
})();
