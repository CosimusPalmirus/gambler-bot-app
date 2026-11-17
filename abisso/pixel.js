// NON SVEGLIARE IL DRAGO - resa in PIXEL ART (16/11/2026). Si carica DOPO abisso.js e ne sostituisce il disegno.
// Tutta l'arte viene da pix/*.png, disegnata dal codice (../pixel/genera.py). La tela lavora a bassa risoluzione:
// 1 pixel d'arte = 2 px CSS sul telefono, 3 sul PC; il browser ingrandisce senza sfumare (image-rendering: pixelated).
"use strict";
const PIX = { meta: null, img: {}, cache: new Map(), PX: 2, pal: [] };
const FRAME_BOT = (n) => PIX.meta.bot.frame.indexOf(n);
const COL_SEGGIO = ["lavanda", "mandarino", "menta", "corallo", "cielo", "girasole", "rubino", "perla"];

caricaTutto = async function () {
  PIX.meta = await (await fetch("pix/pix.json")).json();
  META = { pose: [], bot: {}, colori: COL_SEGGIO };                 // compatibilita' con abisso.js
  PIX.pal = Object.values(PIX.meta.pal);
  const nomi = ["drago", "grotta", "parete", "torcia", "moneta", "mucchio_s", "mucchio_m", "mucchio_l", "calice", "forziere", "segni", "campo", "font", "titolo",
    "tessera0", "tessera1", "tessera2", "tessera3", "bot_carbone"].concat(COL_SEGGIO.map((c) => "bot_" + c));
  await Promise.all(nomi.map(async (n) => { PIX.img[n] = await carica("pix/" + n + ".png"); }));
  for (let i = 0; i < 4; i++) IMG["piastra" + i] = PIX.img["tessera" + i];
};
function ridimensionaPix() {
  const r = cv.getBoundingClientRect();
  PIX.PX = r.width < 600 ? 3 : 4;   // scena piu' vicina: pixel piu' grandi
  cv.width = Math.max(40, Math.round(r.width / PIX.PX)); cv.height = Math.max(40, Math.round(r.height / PIX.PX));
  cv.style.imageRendering = "pixelated"; cx.imageSmoothingEnabled = false; PIX.cache.delete("vignetta");
}
ridimensiona = ridimensionaPix;
geo = function () { const W = cv.width, H = cv.height; return { W, H, T: 40, passo: 25, port: H > W * .9 }; };
posT = function (i, g) { const amp = Math.min(g.W * .2, 40); return { x: Math.round(i < 0 ? Math.max(30, g.W * .24) : g.W / 2 + Math.sin(i * 1.15 + .4) * amp), y: Math.round((i + 1) * g.passo + g.H * .32) }; };
posBot = function (sg, g, gx, gy) {
  const gr = nelGruppo(), k = gr.length, j = Math.max(0, gr.indexOf(sg)), rig = k > 4 ? 2 : 1, per = Math.ceil(k / rig);
  const r = Math.floor(j / per), c = j % per, nr = r === rig - 1 ? k - per * (rig - 1) : per;
  const sp = k > 4 ? 20 : 16; return { x: Math.round(gx + (c - (nr - 1) / 2) * sp + (rig === 2 && r ? 9 : 0)), y: Math.round(gy + 6 + (rig === 2 ? (r ? 8 : -5) : 0)), bh: 30, riga: r, righe: rig };
};

// ── tavolozza e foto ridotte a pixel ────────────────────────────────────
function vicino(r, g, b) { let m = 1e9, out = PIX.pal[0]; for (const c of PIX.pal) { const d = (c[0] - r) ** 2 * 3 + (c[1] - g) ** 2 * 4 + (c[2] - b) ** 2 * 2; if (d < m) { m = d; out = c; } } return out; }
function fotoPix(sg, d) {
  const k = "foto|" + sg + "|" + d; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const c = tela(d, d), x = c.getContext("2d", { willReadFrequently: true });
  if (FOTO[sg]) { x.imageSmoothingEnabled = true; copri(x, FOTO[sg], d, d); }
  else { const pc = PIX.meta.pal[["lav_", "man_", "men_", "cor_", "cie_", "gir_", "rub_", "per_"][sg % 8]]; x.fillStyle = "rgb(" + pc + ")"; x.fillRect(0, 0, d, d); }
  const id = x.getImageData(0, 0, d, d), a = id.data;
  for (let i = 0; i < a.length; i += 4) { const v = vicino(a[i], a[i + 1], a[i + 2]); a[i] = v[0]; a[i + 1] = v[1]; a[i + 2] = v[2]; a[i + 3] = 255; }
  x.putImageData(id, 0, 0);
  if (!FOTO[sg]) { x.fillStyle = "#fff"; const L = ((INFO && INFO.nomi[sg]) || "?").slice(0, 1).toUpperCase(); pixTesto(x, L, d / 2, d / 2 - 3, [255, 255, 255], 1, false); }
  PIX.cache.set(k, c); return c;
}
// il bot del seggio, con la foto nell'oblo' (una volta sola per seggio e frame)
function botPix(sg, frame) {
  const k = "bot|" + sg + "|" + frame; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const M = PIX.meta.bot, fi = Math.max(0, M.frame.indexOf(frame)), src = PIX.img["bot_" + COL_SEGGIO[sg % 8]];
  const c = tela(M.w, M.h), x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(src, fi * M.w, 0, M.w, M.h, 0, 0, M.w, M.h);
  const fc = M.faccia[frame];
  if (fc) {
    const ft = fotoPix(sg, fc[2]), fd = ft.getContext("2d").getImageData(0, 0, fc[2], fc[2]).data, id = x.getImageData(0, 0, M.w, M.h), a = id.data;
    for (let y = 0; y < M.h; y++) for (let xx = 0; xx < M.w; xx++) {
      const i = (y * M.w + xx) * 4;
      if (a[i] === 255 && a[i + 1] === 0 && a[i + 2] === 255) {
        const u = Math.min(fc[2] - 1, Math.max(0, xx - fc[0])), v = Math.min(fc[2] - 1, Math.max(0, y - fc[1])), j = (v * fc[2] + u) * 4;
        a[i] = fd[j]; a[i + 1] = fd[j + 1]; a[i + 2] = fd[j + 2];
        if ((u === 1 && v === 2) || (u === 2 && v === 1)) { a[i] = 244; a[i + 1] = 238; a[i + 2] = 224; }   // il riflesso del vetro
      }
    }
    x.putImageData(id, 0, 0);
  }
  PIX.cache.set(k, c); return c;
}
// gettone tondo in pixel art (gettoni, tavolo, podio): disegnato a 20x20 e ingrandito senza sfumare
gettone = function (sg, d) {
  const k = "get|" + sg + "|" + d; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const n = 20, sc2 = tela(n, n), x = sc2.getContext("2d"), r = n / 2, P = PIX.meta.pal;
  const scuri = ["lav_", "man_", "men_", "cor_", "cie_", "gir_", "rub_", "per_"];
  const disco = (rad, col) => { x.fillStyle = col; for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) if ((xx + .5 - r) ** 2 + (yy + .5 - r) ** 2 <= rad * rad) x.fillRect(xx, yy, 1, 1); };
  disco(10, "rgb(" + P.notte + ")"); disco(9, "rgb(" + P[scuri[sg % 8]] + ")"); disco(7.5, TINTE[sg % 8]);
  // la forma del seggio, in scuro, al centro: cerchio, triangolo, quadrato, rombo, stella, croce, pentagono, esagono
  x.fillStyle = "rgb(" + P.notte + ")"; const c = 10, f = sg % 8;
  const poli = (pts) => { x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath(); x.fill(); };
  const reg = (lati, rad, rot) => { const pts = []; for (let i = 0; i < lati; i++) { const an = rot + i * 2 * Math.PI / lati; pts.push([c + Math.cos(an) * rad, c + Math.sin(an) * rad]); } return pts; };
  if (f === 0) { for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) if ((xx + .5 - c) ** 2 + (yy + .5 - c) ** 2 <= 12) x.fillRect(xx, yy, 1, 1); }
  else if (f === 1) poli(reg(3, 4.6, -Math.PI / 2));
  else if (f === 2) x.fillRect(7, 7, 6, 6);
  else if (f === 3) poli(reg(4, 4.4, 0));
  else if (f === 4) { const pts = []; for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 2 : 4.8; pts.push([c + Math.cos(an) * rad, c + Math.sin(an) * rad]); } poli(pts); }
  else if (f === 5) { x.fillRect(9, 6, 2, 8); x.fillRect(6, 9, 8, 2); }
  else if (f === 6) poli(reg(5, 4.4, -Math.PI / 2));
  else poli(reg(6, 4.4, 0));
  x.fillStyle = "rgba(255,255,255,.55)"; x.fillRect(6, 4, 3, 1); x.fillRect(5, 5, 1, 2);
  const out = tela(d, d), cc = out.getContext("2d"); cc.imageSmoothingEnabled = false; cc.drawImage(sc2, 0, 0, d, d);
  PIX.cache.set(k, out); return out;
};
function nomeCorto(sg, max = 8) { if (V && sg === V.io) return LINGUA === "it" ? "TU" : "YOU"; const s2 = ((INFO && INFO.nomi[sg]) || "#" + (sg + 1)).toUpperCase(); return s2.length > max ? s2.slice(0, max) : s2; }
function etichetta(sg, x, y, max = 8) {   // il cartellino col nome, nel colore del ladro
  const P = PIX.meta.pal, tx = nomeCorto(sg, max), w = pixLargo(tx) + 4, io = V && sg === V.io;
  const x0 = Math.round(x - w / 2), y0 = Math.round(y);
  if (window.__audit) PIX.box.push(["nome", x0 - 1, y0 - 1 - (PIX.cam || 0), w + 2, 11]);
  cx.fillStyle = "rgb(" + P.nero + ")"; cx.fillRect(x0 - 1, y0 - 1, w + 2, 11);
  cx.fillStyle = io ? "rgb(" + P.o3 + ")" : TINTE[sg % 8]; cx.fillRect(x0, y0, w, 9);
  cx.fillStyle = "rgb(" + P.notte + ")"; cx.fillRect(x0 + 1, y0 + 1, w - 2, 7);
  pixTesto(cx, tx, x, y0 + 1, io ? P.o3 : rgbDi(TINTE[sg % 8]), 1, false);
}
// I cartellini non si sovrappongono MAI: corsie sopra il gruppo, assegnate in modo goloso (il tuo per primo, in corsia 0).
// Ogni cartellino ha un filo verticale fino alla testa del suo ladro. Se 4 corsie non bastano: solo un segnalino colorato.
function impaginaNomi(voci, W) {
  if (!voci.length) return;
  const P = PIX.meta.pal, max = voci.length > 4 ? 5 : 8, base = Math.min(...voci.map((v) => v.testa)) - 13, posati = [];
  const CORSIE = Math.max(0, Math.min(4, Math.floor((base - (PIX.cam || 0) - (PIX.hudB || 0)) / 11) + 1));
  const ordine = voci.slice().sort((a, b) => ((V && b.sg === V.io) - (V && a.sg === V.io)) || a.x - b.x);
  for (const v of ordine) {
    const w = pixLargo(nomeCorto(v.sg, max)) + 6;
    let x = Math.max(w / 2 + 1, Math.min(W - w / 2 - 1, v.x)), messo = null;
    for (let c = 0; c < CORSIE && !messo; c++) {
      for (const dx of [0, -6, 6, -12, 12]) {
        const r = { x0: x + dx - w / 2, x1: x + dx + w / 2, c };
        if (r.x0 < 0 || r.x1 > W) continue;
        if (!posati.some((o) => o.c === c && r.x0 < o.x1 + 1 && o.x0 < r.x1 + 1)) { messo = r; v.tx = x + dx; break; }
      }
    }
    v.posto = messo; if (messo) posati.push(messo);
  }
  // fili e segnalini prima, poi i cartellini (il tuo per ultimo, sempre sopra)
  for (const v of voci) {
    const col = V && v.sg === V.io ? "rgb(" + P.o3 + ")" : TINTE[v.sg % 8];
    if (v.posto) { const y = base - v.posto.c * 11 + 10; cx.fillStyle = col; for (let yy = y; yy < v.testa - 1; yy += 2) cx.fillRect(Math.round(v.x), yy, 1, 1); }
    else { cx.fillStyle = "rgb(" + P.nero + ")"; cx.fillRect(Math.round(v.x) - 3, v.testa - 9, 7, 7); cx.fillStyle = col; cx.fillRect(Math.round(v.x) - 2, v.testa - 8, 5, 5); }
  }
  const tu = voci.filter((v) => v.posto && V && v.sg === V.io), altri = voci.filter((v) => v.posto && !(V && v.sg === V.io));
  for (const v of altri.concat(tu)) etichetta(v.sg, v.tx, base - v.posto.c * 11, max);
}
// ── testo col carattere 5x7 ─────────────────────────────────────────────
const NORMALIZZA = { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U", "·": "-", "÷": "/", "★": "*", "●": "*", "▲": "*", "■": "*", "◆": "*", "✚": "+", "⬟": "*", "⬢": "*" };
function fontTinto(rgb) {
  const k = "font|" + rgb; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const f = PIX.img.font, c = tela(f.width, f.height), x = c.getContext("2d");
  x.drawImage(f, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "rgb(" + rgb + ")"; x.fillRect(0, 0, c.width, c.height);
  PIX.cache.set(k, c); return c;
}
function pixLargo(s, sc = 1) { return s.length * 6 * sc - sc; }
function pixTesto(ctx, s, x, y, rgb, sc = 1, bordo = true, allinea = "c") {
  s = String(s).toUpperCase().split("").map((ch) => NORMALIZZA[ch] || ch).join("");
  const elenco = PIX.meta.font, w = pixLargo(s, sc), x0 = Math.round(allinea === "c" ? x - w / 2 : allinea === "r" ? x - w : x), y0 = Math.round(y);
  const disegna1 = (atl, dx, dy) => { for (let i = 0; i < s.length; i++) { const k = elenco.indexOf(s[i]); if (k < 0) continue; ctx.drawImage(atl, k * 6, 0, 5, 7, x0 + i * 6 * sc + dx, y0 + dy, 5 * sc, 7 * sc); } };
  if (bordo) { const o = fontTinto(PIX.meta.pal["nero"]); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) disegna1(o, dx, dy); }
  disegna1(fontTinto(rgb), 0, 0);
}
const rgbDi = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

// ── pezzi pre-disegnati: pozze di luce retinate, vignetta, carte ────────
const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function pozza(r, rgb) {   // luce delle torce: pixel caldi retinati che si diradano
  const k = "pozza|" + r + "|" + rgb; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const c = tela(r * 2, r * 2), x = c.getContext("2d"); x.fillStyle = "rgb(" + rgb + ")";
  for (let yy = 0; yy < r * 2; yy++) for (let xx = 0; xx < r * 2; xx++) { const d = Math.hypot(xx + .5 - r, yy + .5 - r) / r; if (d < 1 && (1 - d) * 16 > BAY[yy % 4][xx % 4] + 4) x.fillRect(xx, yy, 1, 1); }
  PIX.cache.set(k, c); return c;
}
function vignetta(W, H) {
  const k = "vignetta"; const v = PIX.cache.get(k); if (v && v.width === W && v.height === H) return v;
  const c = tela(W, H), x = c.getContext("2d"); x.fillStyle = "rgb(" + PIX.meta.pal["nero"] + ")";
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const d = Math.max(Math.abs(xx - W / 2) / (W / 2), Math.abs(yy - H * .55) / (H * .55)); const s = (d - .72) / .28 * 16; if (s > BAY[yy % 4][xx % 4]) x.fillRect(xx, yy, 1, 1); }
  PIX.cache.set(k, c); return c;
}
function cartaPix(c) {
  const k = "carta|" + c.t + "|" + c.v; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const w = 26, h = 34, cv2 = tela(w, h), x = cv2.getContext("2d"), P = PIX.meta.pal;
  const bordo = c.t === "pericolo" ? P.f1 : c.t === "forziere" ? P.o2 : P.t1;
  x.fillStyle = "rgb(" + P.notte + ")"; x.fillRect(1, 0, w - 2, h); x.fillRect(0, 1, w, h - 2);
  x.fillStyle = "rgb(" + bordo + ")"; x.fillRect(2, 1, w - 4, 1); x.fillRect(2, h - 2, w - 4, 1); x.fillRect(1, 2, 1, h - 4); x.fillRect(w - 2, 2, 1, h - 4);
  x.fillStyle = "rgb(" + P.g0 + ")"; x.fillRect(2, 2, w - 4, h - 4);
  let ic = null, sx = 0, sw = 0, sh = 0;
  if (c.t === "perla") { ic = c.v >= 9 ? PIX.img.mucchio_l : c.v >= 5 ? PIX.img.mucchio_m : PIX.img.mucchio_s; sw = ic.width; sh = ic.height; }
  else if (c.t === "pericolo") { ic = PIX.img.segni; sx = PIX.meta.segni.indexOf(c.v) * 16; sw = 16; sh = 16; }
  else if (c.t === "forziere") { ic = c.v >= 10 ? PIX.img.forziere : PIX.img.calice; sw = c.v >= 10 ? 18 : 12; sh = 16; }
  if (ic) x.drawImage(ic, sx, 0, sw, sh, Math.round((w - sw) / 2), Math.round(h * .55 - sh / 2), sw, sh);
  if (c.t !== "pericolo") pixTesto(x, String(c.v), 3, 3, P.o3, 1, true, "l");
  else pixTesto(x, "!", w - 5, 3, P.f3, 1, true, "c");
  PIX.cache.set(k, cv2); return cv2;
}
function dorsoPix() {
  const k = "dorso"; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const P = PIX.meta.pal, c = tela(26, 34), x = c.getContext("2d");
  x.fillStyle = "rgb(" + P.notte + ")"; x.fillRect(1, 0, 24, 34); x.fillRect(0, 1, 26, 32);
  x.fillStyle = "rgb(" + P.d1 + ")"; x.fillRect(2, 2, 22, 30);
  for (let yy = 2; yy < 32; yy++) for (let xx = 2; xx < 24; xx++) if ((xx + yy) % 4 === 0) { x.fillStyle = "rgb(" + P.d2 + ")"; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = "rgb(" + P.o2 + ")"; x.fillRect(11, 14, 4, 6); x.fillRect(9, 16, 8, 2);
  PIX.cache.set(k, c); return c;
}

// ── il disegno della scena ───────────────────────────────────────────────
S.fiamme = []; S.fumi = []; S.scintille = [];
function img(n) { return PIX.img[n]; }
disegna = function () {
  requestAnimationFrame(disegna);
  if (!PIX.meta || !V) { if (PIX.meta) { cx.fillStyle = "#000"; cx.fillRect(0, 0, cv.width, cv.height); } return; }
  const dtr = avanza(), g = geo(), { W, H } = g, t = SIM, P = PIX.meta.pal;
  const { gx, gy, kp, a, b } = centroGruppo(g);
  if (performance.now() - (S.rotella || 0) > 3500) S.camOff = (S.camOff || 0) * .95;
  // ZONE: in alto l'HUD (DOM), in basso il drago; il sentiero vive in mezzo e la camera tiene il gruppo sopra il drago
  aggiornaHud();
  // il sentiero ha sempre spazio per i ladri (due file) e una corsia di nomi: il drago non puo' salire oltre
  const serve = 30 + 12 + (nelGruppo().length > 4 ? 14 : 2) + 18;
  PIX.zonaTop = H - Math.max(24, Math.min(zonaDrago(g, SIM), H - PIX.hudB - serve));
  const meta = S.camRit != null ? S.camRit - (PIX.hudB + PIX.zonaTop) / 2 - 10 : gy - (PIX.zonaTop - 16) + (S.camOff || 0);
  if (window.CAM_ZERO) { S.cam = 0; S.camV = 0; }   // scena orizzontale: il mondo scorre di lato (scena_orizzontale.js), la camera non sale ne' scende
  else if (RM) S.cam = meta; else { S.camV += (meta - S.cam) * .012; S.camV *= .86; S.cam += S.camV; }
  S.scossa *= .9; S.lampo *= .92;
  // morsa: i piedi della fila davanti non entrano mai nella zona del drago
  const piedi = gy + 6 + (nelGruppo().length > 4 ? 8 : 0);
  if (!window.CAM_ZERO && S.camRit == null && piedi - S.cam > PIX.zonaTop - 3 && !(S.camOff < 0)) { S.cam = piedi - (PIX.zonaTop - 3); S.camV = 0; }
  // ...e le teste (con una corsia di nomi) non salgono mai sotto l'HUD
  const teste = gy - 5 - 30 - 13 - (nelGruppo().length > 4 ? 5 : 0);
  if (!window.CAM_ZERO && S.camRit == null && teste - S.cam < PIX.hudB && !(S.camOff > 0)) { S.cam = teste - PIX.hudB; S.camV = 0; }
  const cam = Math.round(S.cam), sx = RM ? 0 : Math.round((Math.random() - .5) * S.scossa * 6), sy = RM ? 0 : Math.round((Math.random() - .5) * S.scossa * 6);
  cx.imageSmoothingEnabled = false;
  cx.save(); cx.translate(sx, sy);
  cx.fillStyle = "rgb(" + P.nero + ")"; cx.fillRect(-8, -8, W + 16, H + 16);
  // 1. fondo della grotta (parallasse .4) e pareti (.8)
  const gr = img("grotta"), go = ((Math.round(cam * .4) % gr.height) + gr.height) % gr.height, gx0 = Math.round((W - gr.width) / 2);
  for (let y = -go; y < H; y += gr.height) cx.drawImage(gr, gx0, y);
  const pa = img("parete"), po = ((Math.round(cam * .8) % pa.height) + pa.height) % pa.height;
  for (let y = -po; y < H; y += pa.height) { cx.drawImage(pa, Math.min(0, Math.round(W * .5 - 120)), y); cx.save(); cx.translate(W, 0); cx.scale(-1, 1); cx.drawImage(pa, Math.min(0, Math.round(W * .5 - 120)), y); cx.restore(); }
  // (semplicita': niente torce ne' pozze di luce: non portano informazione)
  // 2. il DRAGO in fondo: si avvicina scendendo; respira; si agita; si sveglia
  dragoPix(g, t);
  // 3. il mondo (sentiero, tessere, bot)
  cx.save(); cx.beginPath(); cx.rect(0, PIX.hudB, W, Math.max(0, PIX.zonaTop - PIX.hudB)); cx.clip(); cx.translate(0, -cam);
  PIX.cam = cam; if (window.__audit) PIX.box = [];
  const n = V.strada.length;
  for (let i = 0; i <= n; i++) {
    const p = posT(i, g), c = V.strada[i];
    if (S.crollo && i === S.crollo.i && t > S.crollo.t0) { franaPix(i, p, t); continue; }
    cx.globalAlpha = i === n ? .45 : 1; cx.drawImage(img("tessera" + (i % 4)), p.x - 20, p.y - 9); cx.globalAlpha = 1;
    if (!c) continue;
    if (!(S.rivela && S.rivela.i === i && t - S.rivela.t0 < 1.5)) { const cc = cartaPix(c); cx.drawImage(cc, 0, 0, 26, 34, p.x + 13, p.y - 21, 13, 17); }
    if (c.t === "forziere" && (c.preso === null || c.preso === undefined)) reliquiaPix(p, t, c.v);
  }
  for (const m of S.mucchi) mucchioPix(m, g, t);
  // i ladri sul sentiero
  const grp = nelGruppo(), cammina = t - S.passoT0 < .8, lun = Math.hypot(b.x - a.x, b.y - a.y);
  for (const sg of grp) {
    const pl = V.giocatori[sg], q = posBot(sg, g, gx, gy);
    let fr = "idle" + (Math.floor(t * 2 + sg) % 2), salto = 0;
    if (cammina) fr = "walk" + (Math.floor(kp * lun / 4 + sg) % 4);
    else if (V.fine) fr = V.fine.gruppi[0].includes(sg) ? "festa" + (Math.floor(t * 4) % 2) : "idle0";
    else if (pl.sg === V.io && pl.scelta === "giu") fr = "resta";
    else if (V.rischio >= .2) fr = "paura" + (Math.floor(t * 10) % 2);
    if (S.hop[sg] && t - S.hop[sg] < .45) { salto = Math.round(Math.sin((t - S.hop[sg]) / .45 * Math.PI) * 5); fr = "festa0"; }
    const sp = botPix(sg, fr);
    if (sg === V.io) { cx.fillStyle = "rgb(" + P.cie + ")"; cx.fillRect(q.x - 6, q.y + 1, 12, 1); }
    cx.save(); cx.translate(q.x, q.y - salto); if (cammina && b.x < a.x) cx.scale(-1, 1); cx.drawImage(sp, -10, -30); cx.restore();
    if (window.__audit) PIX.box.push(["bot", q.x - 8, q.y - 30 - salto - cam, 16, 30]);
    if (t - S.reveal < .5) { cx.fillStyle = "rgb(" + P.o3 + ")"; for (let s2 = 0; s2 < 8; s2++) { const an = s2 / 8 * Math.PI * 2, rr2 = 10 + (t - S.reveal) * 24; cx.fillRect(Math.round(q.x + Math.cos(an) * rr2), Math.round(q.y - 15 + Math.sin(an) * rr2), 1, 1); } }
    const porta = (MOSTRA[sg] || {}).sacco || 0;
    if (porta > 0) { cx.drawImage(img("moneta"), 0, 0, 9, 9, q.x + 8, q.y - 26, 9, 9); pixTesto(cx, String(porta), q.x + 18, q.y - 25, P.bianco, 1, true, "l"); }
  }
  // i cartellini col nome: sopra a tutti, sfalsati a scacchiera quando il gruppo e' grande
  // tanti: nomi di 4 lettere; la fila dietro ha il nome sopra la testa, quella davanti sotto i piedi (niente sovrapposizioni)
  impaginaNomi(grp.map((sg) => { const q = posBot(sg, g, gx, gy); return { sg, x: q.x, testa: q.y - 30 }; }), g.W);
  for (const r of S.risalgono) {
    const e = (t - r.t0) / r.dur; if (e < 0) continue;
    const pos = lerp(r.da, -1, ease(e)), i0 = Math.floor(pos), q = pos - i0, p0 = posT(i0, g), p1 = posT(i0 + 1, g);
    const x = Math.round(lerp(p0.x, p1.x, q) + r.dx * 8), y = Math.round(lerp(p0.y, p1.y, q) + 6);
    r.pos = { x, y: y - 18 };
    cx.globalAlpha = Math.min(1, (1 - e) * 5); cx.drawImage(botPix(r.sg, "back" + (Math.floor(e * r.dur * 8) % 4)), x - 10, y - 30); cx.globalAlpha = 1;
    const porta = (MOSTRA[r.sg] || {}).sacco || 0;
    if (porta > 0) { cx.drawImage(img("moneta"), 0, 0, 9, 9, x + 8, y - 26, 9, 9); pixTesto(cx, String(porta), x + 18, y - 25, P.bianco, 1, true, "l"); }
    if (V && r.sg === V.io) etichetta(r.sg, x, y - 42);
  }
  S.risalgono = S.risalgono.filter((r) => t - r.t0 < r.dur + .3);
  for (const c of S.cadono) {
    const e = t - c.t0; if (e < 0) continue;
    cx.globalAlpha = Math.max(0, 1 - e / 2.2); cx.drawImage(botPix(c.sg, "cade" + (Math.floor(e * 6) % 2)), Math.round(c.x - 10 + (c.vx > 0 ? 1 : -1) * e * 14), Math.round(c.y - 15 + e * e * 60)); cx.globalAlpha = 1;
  }
  S.cadono = S.cadono.filter((c) => t - c.t0 < 2.4);
  // la carta che sale dalla sabbia, si gira e si posa
  if (S.rivela) cartaSalePix(g, t);
  // monete in volo (con la scia del colore del ladro) e monete perse nel buio
  for (const q of S.gemme) {
    const e = (t - q.t0) / q.dur; if (e < 0) continue;
    const da = q.da(), a2 = q.a(), k = ease(Math.min(1, e)), x = lerp(da.x, a2.x, k), y = lerp(da.y, a2.y, k) - Math.sin(Math.min(1, e) * Math.PI) * 30 * (q.arco || .5) * 2;
    q.scia = q.scia || []; q.scia.push([Math.round(x), Math.round(y)]); if (q.scia.length > 6) q.scia.shift();
    cx.fillStyle = q.col; q.scia.forEach(([sx2, sy2], j) => { if (j < q.scia.length - 1) cx.fillRect(sx2, sy2 + 4, 1, 1); });
    cx.drawImage(img("moneta"), (Math.floor(t * 14 + q.t0 * 7) % 6) * 9, 0, 9, 9, Math.round(x) - 4, Math.round(y), 9, 9);
    if (e >= 1 && !q.fatto) { q.fatto = 1; q.arriva && q.arriva(); }
  }
  S.gemme = S.gemme.filter((q) => !q.fatto);
  for (const s2 of S.schegge) {
    const e = t - s2.t0; if (e < 0) continue; if (!s2.px) { s2.px = s2.x; s2.py = s2.y; s2.pvx = (Math.random() - .5) * 60; s2.pvy = -30 - Math.random() * 40; }
    s2.pvy += 90 * (dtr || .016); s2.px += s2.pvx * (dtr || .016); s2.py += s2.pvy * (dtr || .016);
    cx.globalAlpha = Math.max(0, 1 - e / 2); cx.drawImage(img("moneta"), (Math.floor(t * 18) % 6) * 9, 0, 9, 9, Math.round(s2.px) - 4, Math.round(s2.py), 9, 9); cx.globalAlpha = 1;
  }
  S.schegge = S.schegge.filter((s2) => t - s2.t0 < 2.2);
  const posate = [];          // 17/11 polish: le scritte vive non si sovrappongono (la nuova sale sopra le altre)
  for (const sc of S.scritte) {
    const e = (t - sc.t0) / sc.dur; if (e < 0) continue; const p = sc.p();
    cx.globalAlpha = e > .75 ? Math.max(0, (1 - e) * 4) : 1;
    const scl = sc.px >= .24 ? 2 : 1, lw2 = pixLargo(String(sc.txt), scl) / 2 + 2, h2 = 7 * scl + 3;
    const xx = Math.max(lw2, Math.min(W - lw2, p.x)); let yy = p.y - 10 - Math.round(e * 10);
    for (let k = 0; k < 6 && posate.some((r) => Math.abs(r.x - xx) < r.w + lw2 && Math.abs(r.y - yy) < h2); k++) yy -= h2;
    posate.push({ x: xx, y: yy, w: lw2 });
    pixTesto(cx, sc.txt, xx, yy, rgbDi(sc.col.length === 7 ? sc.col : "#ffffff"), scl, true);
    cx.globalAlpha = 1;
  }
  S.scritte = S.scritte.filter((s2) => t - s2.t0 < s2.dur);
  cx.restore();
  // 4. vignetta retinata e lampo
  cx.globalAlpha = .9; cx.drawImage(vignetta(W, H), 0, 0); cx.globalAlpha = 1;
  if (S.lampo > .02) { cx.globalAlpha = S.lampo * .45; cx.fillStyle = "rgb(" + S.lampoCol + ")"; cx.fillRect(0, 0, W, H); cx.globalAlpha = 1; }
  cx.restore();
  if (V.fase === "scelta" && V.rischio > 0 && SUONO.on) {
    const per = 1.1 - Math.min(.7, V.rischio * 1.6);
    if (performance.now() / 1000 - SUONO.battito > per) { SUONO.battito = performance.now() / 1000; suona("battito", .4 + V.rischio * 1.5); }
  }
  orologio();
};
function dragoPix(g, t) {
  const { W, H } = g, P = PIX.meta.pal, D = PIX.meta.drago, seg = Object.keys(V.visti).length;
  const sveglio = S.crollo && t >= S.crollo.t0 - .2 && t - S.crollo.t0 < 2.6;
  const resp = Math.floor(t * 1.2) % 2, fr = sveglio ? "sveglio" + (Math.floor(t * 6) % 2) : seg ? "agita" + (S.agita && t - S.agita < .8 ? Math.floor(t * 8) % 2 : resp) : "dorme" + resp;
  const sc = (S.gruppo >= 6 || sveglio) && W > 150 ? 2 : 1;
  const vis = Math.min(D.h * sc, 22 + (S.gruppo + 1) * 5 * sc + seg * 4);
  const x = Math.round(W / 2 - D.w * sc / 2), y = Math.round(H - vis - (sveglio ? 10 : 0));
  cx.drawImage(img("drago"), D.frame.indexOf(fr) * D.w, 0, D.w, D.h, x, y, D.w * sc, D.h * sc);
  // la pancia che brilla al ritmo del respiro
  cx.globalCompositeOperation = "lighter"; cx.globalAlpha = .18 + .08 * resp + seg * .03 + (sveglio ? .3 : 0);
  const pr = 18 * sc; cx.drawImage(pozza(pr, P.f2), x + D.pancia[0] * sc - pr, y + D.pancia[1] * sc - pr);
  cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
  // fumo dalle narici: sbuffi di pixel, di piu' a ogni segno
  if (Math.random() < .03 + seg * .04) S.fumi.push({ x: x + 10 * sc, y: y + 40 * sc - (sveglio ? 20 : 0), t0: t });
  for (const f of S.fumi) { const e = t - f.t0, r2 = 1 + Math.floor(e * 2); cx.fillStyle = "rgb(" + (e < .8 ? P.fu1 : P.fu0) + ")"; cx.globalAlpha = Math.max(0, 1 - e / 2); cx.fillRect(Math.round(f.x - e * 6), Math.round(f.y - e * 14), r2, r2); }
  cx.globalAlpha = 1; S.fumi = S.fumi.filter((f) => t - f.t0 < 2);
  // il risveglio: la fiammata sul sentiero, pixel di fuoco
  if (sveglio) {
    const e = t - S.crollo.t0;
    if (e > 0 && e < 1.6) for (let i = 0; i < 14; i++) S.fiamme.push({ x: x + D.bocca[0] * sc, y: y + D.bocca[1] * sc - 16, vx: (Math.random() - .3) * 50, vy: -60 - Math.random() * 90, t0: t });
  }
  for (const f of S.fiamme) { const e = t - f.t0, col = e < .15 ? P.f3 : e < .35 ? P.f2 : e < .6 ? P.f1 : P.f0, s2 = e < .3 ? 3 : 2; cx.fillStyle = "rgb(" + col + ")"; cx.fillRect(Math.round(f.x + f.vx * e), Math.round(f.y + f.vy * e), s2, s2); }
  S.fiamme = S.fiamme.filter((f) => t - f.t0 < .8);
}
function zonaDrago(g, t) { return Math.round(g.H * (.36 + Math.min(.06, (S.gruppo + 1) * .01))); }
function aggiornaHud() {   // il fondo dell'HUD in pixel d'arte: icone, metro e lo spazio FISSO della targa
  const vis = (id) => { const el = document.getElementById(id); return el && el.classList.contains("su"); };
  const cr = vis("chi-risale"), an = vis("annuncio"), av = vis("avviso-segni");
  const set = (id, on) => { const el = document.getElementById(id); if (el && el.style.visibility !== (on ? "" : "hidden")) el.style.visibility = on ? "" : "hidden"; };
  set("annuncio", !cr); set("avviso-segni", !cr && !an); set("prof", !cr && !an && !av);
  PIX.hudN = (PIX.hudN || 0) + 1; if (PIX.hudB != null && PIX.hudN % 30) return;
  const rc = cv.getBoundingClientRect(), k = cv.height / rc.height; let b = 0;
  for (const id of ["pericoli", "metro", "prof"]) { const el = document.getElementById(id); if (!el) continue; const r = el.getBoundingClientRect(); if (r.height) b = Math.max(b, r.bottom - rc.top); }
  PIX.hudB = Math.round(b * k) + 3;
}
function franaPix(i, p, t) {
  const e = t - S.crollo.t0 - (S.crollo.frana || 0), tes = img("tessera" + (i % 4));
  if (e < 0) { cx.drawImage(tes, p.x - 20, p.y - 9); return; }
  for (let k = 0; k < 4; k++) {
    const qx = k % 2, qy = k < 2 ? 0 : 1, dx = (qx ? 1 : -1) * e * 10, dy = e * e * (40 + k * 12);
    cx.globalAlpha = Math.max(0, 1 - e / 2); cx.drawImage(tes, qx * 20, qy * 9, 20, 9, Math.round(p.x - 20 + qx * 20 + dx), Math.round(p.y - 9 + qy * 9 + dy), 20, 9);
  }
  cx.globalAlpha = 1;
}
function mucchioPix(m, g, t) {
  const e = t - m.t0; if (e < 0) return; const v = m.val(); if (v <= 0) return;
  const P = PIX.meta.pal, ic = v >= 9 ? img("mucchio_l") : v >= 4 ? img("mucchio_m") : img("mucchio_s");
  if (m.grande) {
    const q = m.pos(), pop = e < .3 ? Math.round((1 - e / .3) * -6) : 0, sc = 2;
    cx.globalCompositeOperation = "lighter"; cx.globalAlpha = .35; cx.drawImage(pozza(18, P.o2), q.x - 18, q.y - 18 + pop); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
    cx.drawImage(ic, Math.round(q.x - ic.width * sc / 2), Math.round(q.y - ic.height * sc / 2 + pop), ic.width * sc, ic.height * sc);
    pixTesto(cx, String(v), q.x, q.y - ic.height - 10 + pop, P.o3, 2, true);
  } else {
    const p = posT(m.i, g), x = p.x - 14, y = p.y + 1;
    cx.drawImage(ic, Math.round(x - ic.width / 2), Math.round(y - ic.height));
    // la scritta lunga «RESTANO n» solo sull'ultimo mucchio lasciato indietro (mai durante il risveglio); sugli altri solo il numero
    const ultimo = !S.crollo && m.i < S.gruppo && !S.mucchi.some((o) => o !== m && !o.grande && o.i > m.i && o.i < S.gruppo && o.val() > 0);
    if (ultimo) { const tx = t_("restano", v), lw = pixLargo(tx) / 2 + 2; pixTesto(cx, tx, Math.max(lw, Math.min(g.W - lw, x)), y - ic.height - 9, P.o3, 1, true); }
    else pixTesto(cx, String(v), Math.round(x - ic.width / 2) - 2, y - 7, P.o3, 1, true, "r");
  }
}
function reliquiaPix(p, t, v) {
  const P = PIX.meta.pal, x = p.x - 14, y = p.y - 2, ic = v >= 10 ? img("forziere") : img("calice"), w = v >= 10 ? 18 : 12;
  cx.globalCompositeOperation = "lighter"; cx.globalAlpha = .25 + .1 * Math.sin(t * 3); cx.drawImage(pozza(16, P.o3), x - 16, y - 16); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
  cx.drawImage(ic, v >= 10 ? 18 : 0, 0, w, 16, x - w / 2, y - 16, w, 16);
  const s2 = Math.floor(t * 6) % 6; if (s2 < 3) { cx.fillStyle = "rgb(" + P.bianco + ")"; cx.fillRect(x - 4 + s2 * 3, y - 18 + s2, 1, 1); }
  pixTesto(cx, "*" + v, x, y - 27, P.o3, 1, true);
}
function cartaSalePix(g, t) {
  const R = S.rivela, e = t - R.t0, p = posT(R.i, g); if (e < 0 || e > 1.7) return;
  const su = molla((e - .1) / .55), gira = ease((e - .3) / .35), dip = e < .12 ? 2 : 0;
  const y = Math.round(p.y - 14 - su * 26 + dip), fine = e > 1.3 ? ease((e - 1.3) / .4) : 0;
  const P = PIX.meta.pal;
  cx.globalCompositeOperation = "lighter"; cx.globalAlpha = .35 * (1 - fine); cx.drawImage(pozza(24, R.c.t === "pericolo" ? P.f1 : P.o2), p.x - 24, y - 24); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
  const card = gira < .5 ? dorsoPix() : cartaPix(R.c), larg = Math.max(2, Math.round(26 * Math.abs(Math.cos((1 - gira) * Math.PI / 2)) * (1 - fine * .5))), alt = Math.round(34 * (1 - fine * .5));
  const cxp = Math.round(lerp(p.x, p.x + 19, fine)), cyp = Math.round(lerp(y, p.y - 13, fine));
  cx.drawImage(card, cxp - Math.round(larg / 2), cyp - Math.round(alt / 2), larg, alt);
}
// i punti di arrivo delle monete (in pixel d'arte)
puntoDi = function (sg) { return () => { const g = geo(), { gx, gy } = centroGruppo(g), p = posBot(sg, g, gx, gy); return { x: p.x, y: p.y - 22 }; }; };
puntoTessera = function (i, dy = 0) { return () => { const g = geo(), p = posT(i, g); return { x: p.x, y: p.y - 6 - dy * 20 }; }; };
