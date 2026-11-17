// NON SVEGLIARE IL DRAGO - nomi PICCOLI e discreti (richiesta del proprietario: «i nomi sono troppo grandi»).
// Un secondo strato sopra la scena, in pixel dello SCHERMO: carattere 5x7 a 1x, pillola smorzata, massimo 6 lettere,
// solo «TU» in evidenza. I nomi si vedono solo mentre si sceglie; durante le animazioni un pallino del colore del ladro.
"use strict";
const strato = document.createElement("canvas");
strato.id = "strato-nomi";
strato.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated";
$("scena-box").appendChild(strato);
const sx2 = strato.getContext("2d");
// la scena non disegna piu' i suoi cartellini grandi: segniamo solo dove vanno
impaginaNomi = function (voci) { NOMI_ORA = voci.map((v) => ({ sg: v.sg, x: v.x, y: v.testa })); };
let NOMI_ORA = [];
function nome6(sg) { if (V && sg === V.io) return LINGUA === "it" ? "TU" : "YOU"; const s = ((INFO && INFO.nomi[sg]) || "#" + (sg + 1)).toUpperCase(); return s.slice(0, 6); }
function disegnaNomi() {
  const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
  if (strato.width !== Math.round(r.width * d)) { strato.width = Math.round(r.width * d); strato.height = Math.round(r.height * d); }
  sx2.setTransform(d, 0, 0, d, 0, 0); sx2.clearRect(0, 0, r.width, r.height); sx2.imageSmoothingEnabled = false;
  if (!V || !PIX.meta || !NOMI_ORA.length) return;
  const k = r.width / cv.width, cam = PIX.cam || 0, top = (PIX.hudB || 0) * k, fondo = (PIX.zonaTop || cv.height) * k;
  const calmo = V.fase === "scelta" && !RIT.attivo;          // nomi solo mentre si sceglie
  const P = PIX.meta.pal, posti = [];
  const ordine = NOMI_ORA.slice().sort((a, b) => ((b.sg === V.io) - (a.sg === V.io)) || a.x - b.x);
  for (const v of ordine) {
    const x = v.x * k, yTesta = (v.y - cam) * k;
    if (yTesta < top + 4 || yTesta > fondo) continue;
    const col = TINTE[v.sg % 8], io = v.sg === V.io;
    if (!calmo) {   // pallino del colore del ladro
      sx2.fillStyle = "#0b0810"; sx2.fillRect(Math.round(x) - 3, Math.round(yTesta) - 9, 6, 6);
      sx2.fillStyle = io ? "#ffd27a" : col; sx2.fillRect(Math.round(x) - 2, Math.round(yTesta) - 8, 4, 4);
      continue;
    }
    const tx = nome6(v.sg), w = tx.length * 6 + 5, h = 11;
    let y = yTesta - h - 3, x0 = Math.max(2, Math.min(r.width - w - 2, Math.round(x - w / 2)));
    for (let tent = 0; tent < 6 && posti.some((p) => x0 < p[2] + 2 && p[0] < x0 + w + 2 && y < p[3] + 1 && p[1] < y + h + 1); tent++) y -= h + 2;   // niente sovrapposizioni
    if (y < top + 2) continue;
    posti.push([x0, y, x0 + w, y + h]);
    sx2.fillStyle = io ? "rgba(60,40,8,.92)" : "rgba(12,9,14,.78)"; sx2.fillRect(x0, Math.round(y), w, h);
    sx2.fillStyle = io ? "#ffd27a" : col; sx2.fillRect(x0, Math.round(y) + h - 1, w, 1);            // filo del colore del ladro
    pixTesto(sx2, tx, x0 + 3, Math.round(y) + 2, io ? P.o3 : [214, 208, 226], 1, false, "l");
    if (window.__audit) PIX.box.push(["nome", (x0) / k, (Math.round(y)) / k, w / k, h / k]);
  }
}
const disegnaPrimaNomi = disegna;
disegna = function () { disegnaPrimaNomi(); try { disegnaNomi(); } catch (e) { console.warn(e); } };
