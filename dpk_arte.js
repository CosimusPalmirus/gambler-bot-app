/* dpk_arte.js — COSMETICI DEAD PEAK per la pagina (19/09/2026). Generato da monta_arte.py da deadpeak.html 2310479d827b: non modificare a mano. */
/* ── preambolo ── */
(function(){var DPM = globalThis.DPM || (globalThis.DPM = {});
if (!DPM.rng) DPM.rng = function (seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
})();
/* ── client/arte_base.js ── */
/* DEAD PEAK MEAT — arte: tavolozza, terreno cotto a inchiostro, fondali, lava.
   Direzione A «INCHIOSTRO E CARNE»: contorno scuro di spessore costante attorno a
   tutto cio' che si tocca, colori pieni con UNA sola ombra netta, piastre crema
   rivettate, telai rosso sangue, acciaio verde-grigio. Il fondo e' dipinto (immagine
   generata) e piu' spento del piano di gioco: la regola e' che niente del fondo
   possa sembrare un appoggio. */
(function(){
var DPM = globalThis.DPM || (globalThis.DPM = {});
var A = DPM.ARTE = {};
var PAL = A.PAL = {
  ink:'#24150f', inkS:'rgba(36,21,15,',
  // GIRO 2: il terreno passa dalle piastre crema alla ROCCIA grigio-azzurra del banner (i personaggi
  // nuovi sono caramelle lucide: sulla crema si mangiavano il giallo e l'arancio, sulla roccia stanno tutti)
  plate:'#98a1ae', plateS:'#687180', plateL:'#c8d0da', seam:'#566070', rock2:'#8a93a1',
  frame:'#6a4a40', frameS:'#45302a', frameL:'#96705f',   // ferro arrugginito (prima telaio rosso: nei blocchi grandi era un rettangolo piatto)
  steel:'#6f8d89', steelS:'#4b6663', steelL:'#9dbab4',
  grate:'#8c7a66', grateS:'#5d4d3f', grateL:'#c4b09a',
  crumb:'#d8b27a', crumbS:'#a8834e',
  wood:'#b8793f', woodS:'#7f4f28', woodL:'#dca067',
  blood:'#c8101c', bloodD:'#6e0610', bloodL:'#ff7070',
  meat:'#d63d36', meatS:'#9e2626', meatL:'#f07a66', marb:'#f7cdbb',
  saw:'#dfe3e4', sawS:'#a4abb0', sawL:'#ffffff', hub:'#584741',
  spike:'#d7dcdf', spikeS:'#8e979c',
  yel:'#f3c02c', yelS:'#c28e17',
  lava0:'#ffd24a', lava1:'#ff7a1a', lava2:'#c2360f', lava3:'#6e1a0a',
  fondo:'#161a24'
};
A.COLORI = [
  { nome:'TU', casco:'#f3c02c', cascoS:'#c28e17' },
  { nome:'RUGGINE', casco:'#5fcf6a', cascoS:'#35974a' },
  { nome:'LAMA', casco:'#4aa8ff', cascoS:'#2a6fc0' },
  { nome:'NOCCIOLO', casco:'#b07cff', cascoS:'#7a4bc8' },
  { nome:'SCOTTA', casco:'#ff8a3a', cascoS:'#c8561a' }
];

function tela(w, h) {
  var c;
  if (typeof OffscreenCanvas !== 'undefined' && !A.forzaDom) c = new OffscreenCanvas(w, h);
  else { c = document.createElement('canvas'); c.width = w; c.height = h; }
  return c;
}
A.tela = tela;

function rr(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}
A.rr = rr;

/* ---------- immagini ---------- */
A.img = {};
A.carica = function (base, fatto) {
  var nomi = ['fondale', 'tex_piastre', 'tex_muro'];
  for (var i = 0; i < 6; i++) nomi.push('props1_' + i, 'props2_' + i);
  var n = nomi.length, arrivati = 0;
  nomi.forEach(function (nm) {
    var im = new Image();
    im.onload = im.onerror = function () { arrivati++; if (im.naturalWidth) A.img[nm] = im; if (arrivati === n) { A.preparaFondale(); if (fatto) fatto(); } };
    im.src = base + nm + '.webp';
  });
};

/* ---------- fondale cotto una volta ----------
   Il piano di gioco e' chiaro e contornato: il fondo deve stare DUE gradini sotto.
   Il dipinto viene tinto per quota (forgia rosso ruggine in basso, mattatoio
   bordeaux, centrale verde-ardesia, vetta chiara) e gli oggetti di scena diventano
   sagome scure: niente del fondo puo' sembrare un appoggio. Tutto cotto al carico:
   per fotogramma resta un drawImage. */
A.TINTE = [[0.00, '#7a4a3c'], [0.25, '#4e5a78'], [0.50, '#3c4868'], [0.72, '#34505c'], [0.90, '#6a7488'], [1.00, '#c9a860']];   // forgia calda in basso, caverna blu, centrale ottanio, luce d'oro del caveau in cima
A.preparaFondale = function () {
  var im = A.img.fondale;
  if (im) {
    var c = tela(im.width, im.height), g = c.getContext('2d');
    g.drawImage(im, 0, 0);
    var gr = g.createLinearGradient(0, im.height, 0, 0);
    A.TINTE.forEach(function (t) { gr.addColorStop(t[0], t[1]); });
    g.globalCompositeOperation = 'multiply'; g.fillStyle = gr; g.fillRect(0, 0, im.width, im.height);
    g.globalCompositeOperation = 'screen';   // nebbia azzurra della caverna (il banner): allontana il fondo dal piano di gioco
    var fog = g.createLinearGradient(0, 0, 0, im.height);
    fog.addColorStop(0, 'rgba(90,110,150,0.20)'); fog.addColorStop(0.5, 'rgba(70,90,130,0.28)'); fog.addColorStop(1, 'rgba(120,70,50,0.18)');
    g.fillStyle = fog; g.fillRect(0, 0, im.width, im.height);
    g.globalCompositeOperation = 'source-over';
    var vg = g.createLinearGradient(0, 0, im.width, 0);   // bordi piu' scuri: il centro (dove si gioca) respira
    vg.addColorStop(0, 'rgba(8,10,18,0.55)'); vg.addColorStop(0.3, 'rgba(8,10,18,0.12)'); vg.addColorStop(0.7, 'rgba(8,10,18,0.12)'); vg.addColorStop(1, 'rgba(8,10,18,0.55)');
    g.fillStyle = vg; g.fillRect(0, 0, im.width, im.height);
    A.img.fondaleT = c;
  }
  A.sil = {};
  Object.keys(A.img).forEach(function (nm) {
    if (nm.indexOf('props') !== 0) return;
    var s0 = A.img[nm], c2 = tela(s0.width, s0.height), g2 = c2.getContext('2d');
    g2.drawImage(s0, 0, 0);
    g2.globalCompositeOperation = 'source-atop'; g2.fillStyle = 'rgba(12,16,28,0.8)'; g2.fillRect(0, 0, s0.width, s0.height);
    A.sil[nm] = c2;
  });
};

/* ---------- terreno cotto per stanza ----------
   Il contorno si ottiene per celle: ogni lato di cella solida che confina col vuoto
   riceve la sua striscia d'inchiostro, gli angoli convessi si arrotondano. */
A.cuociStanza = function (L, st, S) {
  var M = L.M, W = L.W, y0 = st.y0 - 1, y1 = st.y1 + 1, h = y1 - y0;
  var cw = Math.round(W * S), ch = Math.round(h * S);
  var cv = tela(cw, ch), g = cv.getContext('2d');
  var o = Math.max(2, Math.round(S * 0.085));  // spessore dell'inchiostro
  function sol(cx, cy) { if (cx < 0 || cx >= W) return true; if (cy < 0) return true; if (cy >= M.H) return false; var t = M.t[cy * W + cx]; return t === 1; }
  function X(cx) { return cx * S; }
  function Y(cy) { return (y1 - cy - 1) * S; }   // riga cy -> bordo alto in pixel
  var pat = null;
  // (giro 2: la texture a piastre non va sulla roccia)
  var cy, cx;
  // 0) ombra portata sul fondo: stacca il piano di gioco (luce da sinistra in alto)
  g.fillStyle = 'rgba(4,6,12,0.45)';
  for (cy = y0; cy < y1; cy++) for (cx = 0; cx < W; cx++) {
    if (cy < 0 || cy >= M.H) continue;
    var tt0 = M.t[cy * W + cx];
    if (tt0 === 1) g.fillRect(X(cx) + S * 0.22, Y(cy) + S * 0.26, S, S);
    else if (tt0 === 2) g.fillRect(X(cx) + S * 0.22, Y(cy) + S * 0.26, S, S * 0.34);
  }
  // 1) inchiostro dilatato
  g.fillStyle = PAL.ink;
  for (cy = y0; cy < y1; cy++) for (cx = 0; cx < W; cx++) {
    if (!sol(cx, cy) || cy < 0 || cy >= M.H) continue;
    var xl = X(cx) - (sol(cx - 1, cy) ? 0 : 0), yt = Y(cy);
    g.fillRect(xl - (sol(cx - 1, cy) ? 0 : o * 0.6), yt - (sol(cx, cy + 1) ? 0 : o * 0.6), S + (sol(cx - 1, cy) ? 0 : o * 0.6) + (sol(cx + 1, cy) ? 0 : o * 0.6), S + (sol(cx, cy + 1) ? 0 : o * 0.6) + (sol(cx, cy - 1) ? 0 : o * 0.6));
  }
  // 2) materiale, rientrato dove confina col vuoto
  for (cy = y0; cy < y1; cy++) for (cx = 0; cx < W; cx++) {
    if (!sol(cx, cy) || cy < 0 || cy >= M.H) continue;
    var stl = M.stile[cy * W + cx];
    var eL = !sol(cx - 1, cy), eR = !sol(cx + 1, cy), eT = !sol(cx, cy + 1), eB = !sol(cx, cy - 1);
    var ix = X(cx) + (eL ? o * 0.4 : 0), iy = Y(cy) + (eT ? o * 0.4 : 0);
    var iw = S - (eL ? o * 0.4 : 0) - (eR ? o * 0.4 : 0), ih = S - (eT ? o * 0.4 : 0) - (eB ? o * 0.4 : 0);
    var base = stl === 1 ? PAL.frame : (stl === 2 ? PAL.steel : PAL.plate);
    var sh = stl === 1 ? PAL.frameS : (stl === 2 ? PAL.steelS : PAL.plateS);
    var li = stl === 1 ? PAL.frameL : (stl === 2 ? PAL.steelL : PAL.plateL);
    g.fillStyle = base; g.fillRect(ix, iy, iw, ih);
    // ombra netta: in basso e a destra dei blocchi esposti
    g.fillStyle = sh;
    if (eB) g.fillRect(ix, iy + ih - S * 0.2, iw, S * 0.2);
    if (eR) g.fillRect(ix + iw - S * 0.14, iy, S * 0.14, ih);
    // luce: labbro sopra (e' la superficie che si calpesta: deve staccare)
    if (eT) { g.fillStyle = li; g.fillRect(ix, iy, iw, S * 0.12); }
    if (eL) { g.fillStyle = li; g.fillRect(ix, iy, S * 0.07, ih); }
  }
  // 3) materiale generato in trasparenza (solo piastre)
  if (pat) {
    g.save(); g.globalAlpha = 0.28; g.globalCompositeOperation = 'multiply';
    var sc = S / 64; if (pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().scale(sc * 0.5, sc * 0.5));
    g.fillStyle = pat;
    for (cy = y0; cy < y1; cy++) for (cx = 0; cx < W; cx++) if (sol(cx, cy) && cy >= 0 && cy < M.H && M.stile[cy * W + cx] === 0) g.fillRect(X(cx), Y(cy), S, S);
    g.restore();
  }
  // 4) giunture e rivetti: piastre da 2x2 celle, telai con rivetti in fila, acciaio a costole
  g.lineWidth = Math.max(1, S * 0.03);
  for (cy = y0; cy < y1; cy++) for (cx = 0; cx < W; cx++) {
    if (!sol(cx, cy) || cy < 0 || cy >= M.H) continue;
    var s2 = M.stile[cy * W + cx], px = X(cx), py = Y(cy);
    if (s2 === 0) {   // roccia: sfaccettature, crepe e macchie deterministiche per cella
      var hsh = (cx * 73856093) ^ (cy * 19349663), h1 = ((hsh >>> 3) & 255) / 255, h2 = ((hsh >>> 11) & 255) / 255, h3 = ((hsh >>> 19) & 255) / 255;
      if (h1 < 0.5) { g.fillStyle = PAL.rock2; g.beginPath(); g.moveTo(px + S * h2 * 0.6, py); g.lineTo(px + S, py + S * (0.2 + h3 * 0.5)); g.lineTo(px + S, py + S); g.lineTo(px + S * (0.3 + h1), py + S); g.closePath(); g.fill(); }
      g.strokeStyle = PAL.seam; g.lineWidth = Math.max(1, S * 0.035);
      if (h2 < 0.45) { g.beginPath(); g.moveTo(px + S * (0.15 + h3 * 0.5), py + S * 0.15); g.lineTo(px + S * (0.35 + h1 * 0.3), py + S * 0.5); g.lineTo(px + S * (0.2 + h2 * 0.6), py + S * 0.85); g.stroke(); }
      if (h3 < 0.3 && sol(cx + 1, cy)) { g.beginPath(); g.moveTo(px + S, py + S * h1); g.lineTo(px + S * 0.7, py + S * (h1 * 0.5 + 0.3)); g.stroke(); }
      if (h1 > 0.8) { g.fillStyle = 'rgba(20,26,40,0.25)'; g.beginPath(); g.arc(px + S * h2, py + S * h3, S * 0.09, 0, 6.283); g.fill(); }
      if (h3 > 0.85 && !sol(cx, cy + 1)) { g.fillStyle = 'rgba(120,150,110,0.55)'; g.fillRect(px + S * h1 * 0.6, py + S * 0.1, S * 0.35, S * 0.07); }   // muschio sul bordo
    } else if (s2 === 1) {   // lastre di ferro 2x2 con giunture, bulloni agli angoli e colate di ruggine
      g.strokeStyle = PAL.frameS; g.lineWidth = Math.max(1, S * 0.05);
      if (cx % 2 === 0 && sol(cx - 1, cy)) { g.beginPath(); g.moveTo(px + 0.5, py); g.lineTo(px + 0.5, py + S); g.stroke(); }
      if (cy % 2 === 0 && sol(cx, cy - 1)) { g.beginPath(); g.moveTo(px, py + S - 0.5); g.lineTo(px + S, py + S - 0.5); g.stroke(); }
      if (cx % 2 === 0 && cy % 2 === 1) { rivet(g, px + S * 0.18, py + S * 0.18, S * 0.06, PAL.frameL, PAL.frameS); }
      var hr = ((cx * 131 + cy * 71) % 13);
      if (hr === 0) { g.fillStyle = 'rgba(170,90,40,0.45)'; g.fillRect(px + S * 0.4, py + S * 0.2, S * 0.08, S * 0.8); }
      if (hr === 5) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(px, py + S); g.lineTo(px + S, py); g.lineTo(px + S, py + S * 0.2); g.lineTo(px + S * 0.2, py + S); g.fill(); }
      if (!sol(cx, cy + 1)) { g.fillStyle = PAL.yel; for (var k = 0; k < 4; k++) { g.save(); g.beginPath(); g.rect(px, py + S * 0.13, S, S * 0.14); g.clip(); g.fillStyle = k % 2 ? PAL.ink : PAL.yel; g.beginPath(); g.moveTo(px + k * S / 3, py + S * 0.13); g.lineTo(px + k * S / 3 + S / 6, py + S * 0.13); g.lineTo(px + k * S / 3 + S / 6 - S * 0.14, py + S * 0.27); g.lineTo(px + k * S / 3 - S * 0.14, py + S * 0.27); g.fill(); g.restore(); } }
    } else if (s2 === 2) {
      g.strokeStyle = PAL.steelS; g.beginPath(); g.moveTo(px + S * 0.33, py + 3); g.lineTo(px + S * 0.33, py + S - 3); g.moveTo(px + S * 0.66, py + 3); g.lineTo(px + S * 0.66, py + S - 3); g.stroke();
      rivet(g, px + S * 0.16, py + S * 0.16, S * 0.05, PAL.steelL, PAL.steelS);
    }
  }
  // 5) grate: una sbarra con capriate sotto (ci si passa attraverso)
  for (cy = y0; cy < y1; cy++) {
    cx = 0;
    while (cx < W) {
      if (cy >= 0 && cy < M.H && M.t[cy * W + cx] === 2) {
        var c0 = cx; while (cx < W && M.t[cy * W + cx] === 2) cx++;
        grata(g, X(c0), Y(cy), (cx - c0) * S, S, o);
      } else cx++;
    }
  }
  // maschera delle superfici (per il sangue): solidi + sbarre, leggermente dilatati
  var mk = tela(Math.round(W * S / 2), Math.round(h * S / 2)), mg = mk.getContext('2d');
  mg.fillStyle = '#fff';
  for (cy = y0; cy < y1; cy++) for (cx = 0; cx < W; cx++) {
    if (cy < 0 || cy >= M.H) continue;
    var tt = M.t[cy * W + cx];
    if (tt === 1 || tt === 3) mg.fillRect(X(cx) / 2 - 1, Y(cy) / 2 - 1, S / 2 + 2, S / 2 + 2);
    else if (tt === 2 || tt === 4) mg.fillRect(X(cx) / 2 - 1, Y(cy) / 2 - 1, S / 2 + 2, S * 0.36 / 2 + 2);
  }
  return { cv:cv, y0:y0, y1:y1, S:S, maschera:mk };
};
function rivet(g, x, y, r, c1, c2) {
  g.fillStyle = PAL.ink; g.beginPath(); g.arc(x, y, r * 1.35, 0, 6.283); g.fill();
  g.fillStyle = c1 || PAL.plateL; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
  g.fillStyle = c2 || PAL.plateS; g.beginPath(); g.arc(x + r * 0.25, y + r * 0.25, r * 0.55, 0, 6.283); g.fill();
}
A.rivet = rivet;
function grata(g, x, y, w, S, o) {
  var th = S * 0.3;
  // capriata
  g.strokeStyle = PAL.ink; g.lineWidth = o * 1.1;
  g.beginPath();
  var n = Math.max(1, Math.round(w / S));
  for (var i = 0; i < n; i++) { var a = x + i * S; g.moveTo(a + S * 0.1, y + th); g.lineTo(a + S * 0.5, y + S * 0.62); g.lineTo(a + S * 0.9, y + th); }
  g.stroke();
  g.strokeStyle = PAL.grateS; g.lineWidth = o * 0.45; g.stroke();
  // sbarra
  g.fillStyle = PAL.ink; rr(g, x - o * 0.3, y - o * 0.3, w + o * 0.6, th + o * 0.6, S * 0.08); g.fill();
  g.fillStyle = PAL.grate; g.fillRect(x + o * 0.3, y + o * 0.3, w - o * 0.6, th - o * 0.6);
  g.fillStyle = PAL.grateL; g.fillRect(x + o * 0.3, y + o * 0.3, w - o * 0.6, th * 0.28);
  g.fillStyle = PAL.grateS; g.fillRect(x + o * 0.3, y + th * 0.72, w - o * 0.6, th * 0.22);
  for (var j = 0; j <= n; j++) rivet(g, x + Math.min(w - S * 0.15, Math.max(S * 0.15, j * S)), y + th * 0.5, S * 0.045, PAL.grateL, PAL.grateS);
}
A.grata = grata;

/* ---------- fondale: tre piani ---------- */
A.PROPS = {
  1: [1, 2, 4, 1, 4, 2],           // forgia: crogiolo, ruota, tubo
  2: [0, 3, 5, 0, 3, 5],           // mattatoio: carcassa, catena, lampada
  3: [6, 7, 8, 9, 10, 11]          // centrale: traliccio, ventola, quadro, cavi, bobina, sirena
};
A.propNome = function (i) { return i < 6 ? 'props1_' + i : 'props2_' + (i - 6); };
A.pianoProps = function (L) {
  // posizioni deterministiche: una fila per stanza, lati alternati, il centro resta calmo
  var R = DPM.rng(777), out = [];
  L.stanze.forEach(function (st, k) {
    var lista = A.PROPS[Math.max(1, Math.min(3, st.zona || 1))];
    var n = 3;
    for (var i = 0; i < n; i++) {
      var id = lista[Math.floor(R() * lista.length)];
      var lato = (i + k) % 2 ? 1 : 0;
      out.push({ id:id, x: lato ? 8.2 + R() * 3.2 : 0.3 + R() * 3.0, y: st.y0 + 2 + i * 4.6 + R() * 1.5, s: 0.85 + R() * 0.5, lato:lato });
    }
  });
  return out;
};
})();

/* ── client/arte_corpo.js ── */
/* DEAD PEAK — i personaggi (giro 2): fagiolotti gommosi come nel banner.
   STILE: capsula lucida colorata con contorno d'inchiostro (#24150f, ~0,085 celle),
   una luce morbida in alto a sinistra, un riflesso bianco netto, un'ombra netta sul
   fianco. Occhi grandi a palla che si toccano (sono il cuore del personaggio: guardano,
   sbattono, si spalancano, diventano X, spirale, ^ ^). Bocca piccola. Braccia e gambe
   tozze a salsicciotto, scarponi scuri coi ramponi, imbragatura sulla pancia.
   10 giocatori = 10 colori + 10 sagome di cappello (leggibili anche da daltonici).
   ANIMAZIONE: tutta in codice, a molla (squash & stretch che rimbalza e si spegne);
   la posa si calcola a ogni passo da stato fisico + timer degli eventi.
   CACHE: corpo (con cinghie, corda, visiera), cappello, sagoma della scia e icona
   sono tele cotte una volta per (look, S arrotondato). Per fotogramma restano 2-3
   drawImage + arti a tratti arrotondati raggruppati + occhi e bocca al volo.
   Coordinate locali: celle, piedi in (0,0), y verso il BASSO (canvas), verso = +x. */
(function(){
var DPM = globalThis.DPM, A = DPM.ARTE, PAL = A.PAL, TAU = Math.PI * 2;
var INK = PAL.ink || '#24150f';
function cl(v, a, b) { return v < a ? a : (v > b ? b : v); }
function sgn(v) { return v > 0 ? 1 : (v < 0 ? -1 : 0); }

/* ---------- i 10 look ---------- */
A.LOOK = [
  { nome:'GIALLO',    col:'#f7c531', colS:'#c48a12', colL:'#ffe98c', cappello:'arrampicata', hat:'#ef5530', hatS:'#b0331a', hatL:'#ff9a74', decor:'x' },
  { nome:'VERDE',     col:'#5fc93a', colS:'#378a22', colL:'#b0f07a', cappello:'militare',    hat:'#6e7d3a', hatS:'#4a5626', hatL:'#98a95c', decor:'cintura' },
  { nome:'ROSSO',     col:'#ea4038', colS:'#a52128', colL:'#ff9484', cappello:'nessuno',     hat:'#d9b26e', hatS:'#9c7438', hatL:'#f2d9a0', decor:'corda' },
  { nome:'VIOLA',     col:'#9d5ee6', colS:'#6734ad', colL:'#d0a8ff', cappello:'cantiere',    hat:'#f4f3ee', hatS:'#bdbcb2', hatL:'#ffffff', decor:'zip' },
  { nome:'BLU',       col:'#2f8fea', colS:'#1b5bab', colL:'#8cc9ff', cappello:'visiera',     hat:'#e3e9ee', hatS:'#a9b4bd', hatL:'#ffffff', decor:'cintura' },
  { nome:'ARANCIO',   col:'#ff8a1f', colS:'#c1560b', colL:'#ffc47a', cappello:'minatore',    hat:'#7b4a2a', hatS:'#52301a', hatL:'#a8714a', decor:'cintura' },
  { nome:'ROSA',      col:'#ff7fb8', colS:'#cc4d88', colL:'#ffc6df', cappello:'lana',        hat:'#27b0a2', hatS:'#197a70', hatL:'#6fe0d2', decor:'cintura' },
  { nome:'CIANO',     col:'#36d3d6', colS:'#1f959b', colL:'#a4f5f3', cappello:'aviatore',    hat:'#8c5530', hatS:'#5c3519', hatL:'#bd8457', decor:'cintura' },
  { nome:'BIANCO',    col:'#e8ecef', colS:'#a7b2bc', colL:'#ffffff', cappello:'alpino',      hat:'#44603a', hatS:'#2c4226', hatL:'#6f8f60', decor:'cintura' },
  { nome:'ANTRACITE', col:'#555b69', colS:'#343843', colL:'#9aa2b4', cappello:'bandana',     hat:'#e0313b', hatS:'#9c1b24', hatL:'#ff7d7d', decor:'cintura' }
];
A.LOOK.forEach(function (l, i) { l.id = i; });
function lookDi(look) {
  if (look && look.col) return look;
  if (typeof look === 'number') return A.LOOK[((look % 10) + 10) % 10];
  return A.LOOK[0];
}
A.lookDi = lookDi;

/* ---------- misure del corpo (celle) ---------- */
var B = { w:0.68, top:-1.2, bot:-0.22, hipY:-0.3, hipX:0.13, shY:-0.53, shX:0.35, hat:0.86,
  eyeY:-0.84, eyeX:0.085, erx:0.146, ery:0.172, pup:0.076, mouthY:-0.6, mouthX:0.12,
  limb:0.155, arm:0.25, boot:0.13 };
A.CORPO_MISURE = B;

/* ---------- stato dell'animazione ---------- */
A.nuovaAnim = function () {
  return { sx:1, sy:1, vsx:0, vsy:0, face:1, lean:0, fase:0, scie:[], scieT:0, passo:0, gocciaT:0, nato:0,
    t:Math.random() * 10, twist:0, vtwist:0, blink:1 + Math.random() * 3, bT:0, doppio:0,
    lookX:0.6, lookY:0, tAria:0, slideT:0, hatY:0, hatV:0, hatR:0, hatVR:0,
    giro:0, tUso:9, usoId:0, usoAng:0, tSpD:9, spDir:1, tSpP:9, spPDir:1, spPF:0,
    stordT:0, arrivo:0, spav:0, pericolo:0, tBonk:9, tAtt:9, attF:0, tSalto:9, tPop:9, tPresa:9,
    oggetto:0, wasG:true, ox:0, rot:0, vx:0, vy:0, g:true, ws:0, skid:0 };
};
function molla(an, dt) {
  var k = 300, d = 12;
  an.vsx += ((1 - an.sx) * k - an.vsx * d) * dt; an.vsy += ((1 - an.sy) * k - an.vsy * d) * dt;
  an.sx += an.vsx * dt; an.sy += an.vsy * dt;
  an.vtwist += ((0 - an.twist) * 140 - an.vtwist * 11) * dt; an.twist += an.vtwist * dt;
  // cappello: molla propria, non entra nella testa
  an.hatV += ((0 - an.hatY) * 420 - an.hatV * 13) * dt; an.hatY += an.hatV * dt;
  if (an.hatY < -0.05) { an.hatY = -0.05; if (an.hatV < 0) an.hatV = -an.hatV * 0.45; }
  if (an.hatY > 0.3) { an.hatY = 0.3; an.hatV = 0; }
  an.hatVR += ((0 - an.hatR) * 260 - an.hatVR * 10) * dt; an.hatR += an.hatVR * dt;
}
function colpo(an, sx, sy) { an.sx = sx; an.sy = sy; an.vsx = 0; an.vsy = 0; }

A.animaEvento = function (an, e) {
  if (!an || !e) return;
  switch (e.k) {
    case 'salto': colpo(an, 0.72, 1.32); an.tSalto = 0; an.hatV = -1.6; break;
    case 'muro':
      colpo(an, 0.66, 1.3); an.face = -(e.lato || an.face); an.giro = 1; an.tSalto = 0;
      an.vtwist = (e.lato || 1) * 9; an.hatVR = (e.lato || 1) * 6; break;
    case 'atterra':
      var f = cl((e.forza || 10) / 22, 0, 1.3);
      f = Math.min(1, f); colpo(an, 1 + 0.4 * f + 0.05, 1 - 0.36 * f - 0.04); an.tAtt = 0; an.attF = f;
      an.hatV = -1 - f * 3.5; break;
    case 'bonk': colpo(an, 1.28, 0.76); an.tBonk = 0; an.hatV = -2.5; an.hatVR = 5; break;
    case 'pop': colpo(an, 0.84, 1.16); an.tPop = 0; break;
    case 'rinascita': colpo(an, 0.4, 1.8); an.nato = 0.001; an.stordT = 0; an.spav = 0; an.tUso = 9; an.tSpP = 9; an.tSpD = 9; an.arrivo = 0; an.hatY = 0.25; an.hatV = 0; break;
    case 'spinta_data': an.tSpD = 0; an.spDir = e.dir || an.face; an.face = an.spDir; colpo(an, 1.18, 0.88); break;
    case 'spinta_presa':
      an.tSpP = 0; an.spPDir = e.dir || 1; an.spPF = cl(e.forza == null ? 0.7 : e.forza, 0, 1);
      colpo(an, 0.68 - 0.1 * an.spPF, 1.18); an.vtwist = -an.spPDir * 10 * (0.5 + an.spPF); an.hatVR = an.spPDir * 8; an.spav = 1; break;
    case 'presa': an.tPresa = 0; an.oggetto = e.id || an.oggetto; colpo(an, 1.12, 0.9); break;
    case 'uso':
      an.tUso = 0; an.usoId = e.id || an.oggetto || 0;
      var dx = e.dx == null ? an.face : e.dx, dy = e.dy == null ? 0 : e.dy;
      if (Math.abs(dx) > 0.15) an.face = dx > 0 ? 1 : -1;
      // angolo nel verso del corpo: 0 = giu', PI/2 = avanti, PI = su (dy del mondo verso l'alto)
      an.usoAng = Math.atan2(Math.abs(dx) < 0.15 ? 0.2 : Math.abs(dx), -dy);
      colpo(an, 0.9, 1.1); break;
    case 'stordito': an.stordT = Math.max(an.stordT, e.durata || 1.2); colpo(an, 1.2, 0.82); an.hatVR = 7; break;
    case 'arrivo': an.arrivo = 0.001; colpo(an, 0.7, 1.35); an.hatV = 3; break;
    case 'paura': an.spav = 1; colpo(an, 0.84, 1.18); an.hatV = 2.2; break;
    default: break;
  }
};

A.animaPasso = function (an, c, dt, info) {
  var p = c.p;
  dt = cl(dt || 0, 0, 0.05);
  an.t += dt;
  molla(an, dt);
  an.vx = p.vx; an.vy = p.vy; an.g = !!p.grounded; an.ws = p.wallside || 0; an.skid = p.skidT > 0 ? 1 : 0;
  var ferito = an.tSpP < 0.35 || an.stordT > 0 || (info && info.stordito);
  // verso
  var fOld = an.face;
  if (an.tUso < 0.3 || an.tSpD < 0.25) { /* il verso lo tiene il gesto */ }
  else if (p.wallside) an.face = -p.wallside;
  else if (Math.abs(p.vx) > 0.3 && p.skidT <= 0) an.face = p.vx > 0 ? 1 : -1;
  if (an.face !== fOld && an.giro <= 0 && p.grounded) { an.giro = 0.6; an.sx = Math.min(an.sx, 0.86); }
  if (an.giro > 0) an.giro = Math.max(0, an.giro - dt * 5);
  // piega (spazio del mondo: + = testa verso +x)
  var tl = p.grounded ? cl(p.vx / 10.5, -1, 1) * 0.2 : cl(p.vx / 12, -1, 1) * 0.1;
  if (p.skidT > 0) tl = -sgn(p.vx) * 0.3;
  if (an.tSpD < 0.22) tl = an.spDir * 0.2;
  if (an.tSpP < 0.4) tl = -an.spPDir * 0.14 * (0.5 + an.spPF);
  an.lean += (tl - an.lean) * Math.min(1, dt * 16);
  if (p.grounded) { an.fase += Math.abs(p.vx) * dt * 2.3; an.tAria = 0; } else an.tAria += dt;
  if (!p.grounded && !p.wallside && an.tSalto > 0.08) {
    var st = cl(Math.abs(p.vy) / 26, 0, 1) * 0.14;
    an.sy += (1 + st - an.sy) * dt * 6; an.sx += (1 - st * 0.7 - an.sx) * dt * 6;
  }
  if (p.wallside) { an.slideT += dt; an.sx += (0.84 - an.sx) * dt * 12; an.sy += (1.07 - an.sy) * dt * 12; } else an.slideT = 0;
  // timer
  an.tSalto += dt; an.tAtt += dt; an.tBonk += dt; an.tPop += dt; an.tUso += dt; an.tSpD += dt; an.tSpP += dt; an.tPresa += dt;
  if (an.stordT > 0) an.stordT = Math.max(0, an.stordT - dt);
  if (an.arrivo > 0) an.arrivo += dt;
  an.spav = Math.max(0, an.spav - dt * 1.6);
  if (info) {
    an.pericolo += ((info.pericolo || 0) - an.pericolo) * Math.min(1, dt * 10);
    if (info.oggetto != null) an.oggetto = info.oggetto;
    if (info.stordito && an.stordT < 0.1) an.stordT = 0.1;
  } else an.pericolo *= Math.max(0, 1 - dt * 6);
  // palpebre: ogni 2-5 s, doppio battito ogni tanto
  an.blink -= dt;
  if (an.blink < 0) { an.bT = 0.11; if (an.doppio) { an.doppio = 0; an.blink = 2 + Math.random() * 3; } else if (Math.random() < 0.25) { an.doppio = 1; an.blink = 0.2; } else an.blink = 2 + Math.random() * 3; }
  if (an.bT > 0) an.bT -= dt;
  // sguardo (mondo): dove vai, o il punto indicato
  var lx = an.face * 0.55 + cl(p.vx / 10, -1, 1) * 0.45, ly = cl(p.vy / 18, -1, 1);
  if (p.skidT > 0) { lx = -sgn(p.vx); ly = 0; }
  if (p.wallside) { lx = -p.wallside * 0.7; ly = 0.4; }
  if (an.tUso < 0.4) { lx = Math.sin(an.usoAng) * an.face; ly = -Math.cos(an.usoAng); }
  if (info && info.guardaX != null && info.guardaY != null) {
    var gx = info.guardaX - p.x, gy = info.guardaY - (p.y + 0.8), gd = Math.hypot(gx, gy) || 1;
    lx = gx / gd; ly = gy / gd;
  }
  if (ferito) { lx = 0; ly = 0; }
  var kk = Math.min(1, dt * 14);
  an.lookX += (lx - an.lookX) * kk; an.lookY += (ly - an.lookY) * kk;
  if (an.nato > 0) { an.nato += dt; if (an.nato > 0.5) an.nato = 0; }
  // scie: afterimage quando si va forte
  an.scieT -= dt;
  var v = Math.hypot(p.vx, p.vy);
  if (an.scieT <= 0) {
    an.scieT = 1 / 30;
    if (v > 11 || p.wjLock > 0) { an.scie.push({ x:p.x, y:p.y, a:0.4, sx:an.sx, sy:an.sy, f:an.face }); if (an.scie.length > 5) an.scie.shift(); }
  }
  for (var i = an.scie.length - 1; i >= 0; i--) { an.scie[i].a -= dt * 2.2; if (an.scie[i].a <= 0) an.scie.splice(i, 1); }
  an.wasG = p.grounded;
};

/* ---------- cache delle tele ---------- */
var CACHE = {}, nCache = 0;
function inkCelle(S) { return Math.max(1.6, S * 0.085) / S; }
// tela cotta: regione [x0,x1]x[y0,y1] in celle, disegnata in unita' di cella
function cuoci(key, S, x0, y0, x1, y1, fn) {
  var hit = CACHE[key];
  if (hit) return hit;
  if (nCache > 400) { CACHE = {}; nCache = 0; }
  var w = Math.max(1, Math.ceil((x1 - x0) * S)), h = Math.max(1, Math.ceil((y1 - y0) * S));
  var cv = A.tela(w, h), g = cv.getContext('2d');
  g.save(); g.scale(S, S); g.translate(-x0, -y0);
  g.lineJoin = 'round'; g.lineCap = 'round';
  fn(g, inkCelle(S), S);
  g.restore();
  hit = CACHE[key] = { cv:cv, ax:-x0 * S, ay:-y0 * S, S:S };
  nCache++;
  return hit;
}
function metti(g, sp, k) {   // disegna una tela cotta nell'origine corrente (k = S / S cotto)
  g.drawImage(sp.cv, -sp.ax * k, -sp.ay * k, sp.cv.width * k, sp.cv.height * k);
}
A.svuotaCacheCorpo = function () { CACHE = {}; nCache = 0; };

function pathCorpo(g, gr) {
  var top = B.top - gr, bot = B.bot + gr, hw = B.w / 2 + gr, ht = B.w / 2 * 0.93 + gr, rb = 0.24 + gr, K = 0.5523;
  var yT = top + ht, mid = (yT + bot - rb) / 2;
  g.beginPath();
  g.moveTo(0, top);
  g.bezierCurveTo(ht * K, top, ht, yT - ht * K, ht, yT);
  g.bezierCurveTo(ht, mid, hw, mid, hw, bot - rb);
  g.bezierCurveTo(hw, bot - rb * (1 - K), hw - rb * (1 - K), bot, hw - rb, bot);
  g.lineTo(-hw + rb, bot);
  g.bezierCurveTo(-hw + rb * (1 - K), bot, -hw, bot - rb * (1 - K), -hw, bot - rb);
  g.bezierCurveTo(-hw, mid, -ht, mid, -ht, yT);
  g.bezierCurveTo(-ht, yT - ht * K, -ht * K, top, 0, top);
  g.closePath();
}
function ellisse(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }

function spriteCorpo(L, S) {
  return cuoci('c' + L.id + '_' + S, S, -0.72, -1.36, 0.72, -0.06, function (g, o) {
    if (L.fi && A.finitura) A.finitura(g, L, o, false);   // COSMETICI v2: sotto la sagoma
    if (A.decorSotto) A.decorSotto(g, L, o);   // COSMETICI v2 wave 2: mantello dietro la sagoma
    g.fillStyle = INK; pathCorpo(g, o); g.fill();
    if (L.decor === 'corda') {   // rotolo di corda sulla schiena: sporge dalla sagoma
      g.lineWidth = 0.085 + o * 2; g.strokeStyle = INK; ellisse(g, -0.33, -0.62, 0.12, 0.17, 0.3); g.stroke();
    }
    g.fillStyle = L.colS; pathCorpo(g, 0); g.fill();
    g.save(); pathCorpo(g, 0); g.clip();
    g.fillStyle = L.col; g.save(); g.translate(-0.085, -0.06); pathCorpo(g, 0); g.fill(); g.restore();
    var rg = g.createRadialGradient(-0.14, -0.98, 0.02, -0.14, -0.98, 0.5);
    rg.addColorStop(0, L.colL + 'dd'); rg.addColorStop(1, L.colL + '00');
    g.fillStyle = rg; g.fillRect(-0.7, -1.3, 1.4, 1.2);
    // imbragatura / cintura (tono su tono)
    g.fillStyle = 'rgba(36,21,15,0.42)'; g.strokeStyle = 'rgba(36,21,15,0.42)';
    if (L.decor === 'x') {
      g.lineWidth = 0.065; g.beginPath(); g.moveTo(-0.38, -0.78); g.lineTo(0.28, -0.3); g.moveTo(0.38, -0.78); g.lineTo(-0.28, -0.3); g.stroke();
    }
    if (L.decor === 'zip') { g.lineWidth = 0.03; g.beginPath(); g.moveTo(0.06, -0.66); g.lineTo(0.06, -0.2); g.stroke(); }
    g.fillRect(-0.5, -0.45, 1, 0.08);
    if (A.decorDentro) A.decorDentro(g, L, o);   // COSMETICI v2: moschettoni, toppe, piumino, grembiule, fascia
    if (L.decor === 'corda') {
      g.lineWidth = 0.1; g.strokeStyle = INK; g.beginPath(); g.moveTo(-0.4, -0.9); g.lineTo(0.4, -0.3); g.stroke();
      g.lineWidth = 0.065; g.strokeStyle = L.hat; g.stroke();
      g.lineWidth = 0.02; g.strokeStyle = L.hatS; g.setLineDash([0.035, 0.05]); g.stroke(); g.setLineDash([]);
    }
    // riflesso netto (COSMETICI v2: la finitura, se c'e', lo disegna a modo suo)
    if (L.fi && A.finitura) A.finitura(g, L, o, true);
    else {
    g.fillStyle = 'rgba(255,255,255,0.9)'; ellisse(g, -0.19, -1.07, 0.055, 0.115, 0.6); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; ellisse(g, -0.27, -0.5, 0.03, 0.08, 0.15); g.fill();
    }
    g.restore();
    // fibbia
    g.fillStyle = 'rgba(36,21,15,0.8)'; g.fillRect(0.06, -0.46, 0.1, 0.1);
    g.fillStyle = '#dfe3e6'; g.fillRect(0.075, -0.445, 0.07, 0.07);
    if (L.decor === 'corda') {
      g.lineWidth = 0.085; g.strokeStyle = L.hat; ellisse(g, -0.33, -0.62, 0.12, 0.17, 0.3); g.stroke();
      g.lineWidth = 0.025; g.strokeStyle = L.hatS; ellisse(g, -0.33, -0.62, 0.12, 0.17, 0.3); g.stroke();
    }
    if (L.cappello === 'visiera') {   // visiera scura: gli occhi ci stanno SOPRA, bianchi sul nero
      g.fillStyle = INK; A.rr(g, -0.27 - o, -1.06 - o, 0.8 + o * 2, 0.46 + o * 2, 0.16 + o); g.fill();
      g.fillStyle = '#1b2232'; A.rr(g, -0.27, -1.06, 0.8, 0.46, 0.16); g.fill();
      g.fillStyle = 'rgba(140,220,255,0.6)'; A.rr(g, 0.4, -1.0, 0.08, 0.2, 0.04); g.fill();
    }
    if (A.decorFuori) A.decorFuori(g, L, o);   // COSMETICI v2
  });
}
function spriteSagoma(L, S) {
  return cuoci('s' + L.id + '_' + S, S, -0.5, -1.3, 0.5, -0.1, function (g) { g.fillStyle = L.colL; pathCorpo(g, 0); g.fill(); });
}

/* ---------- cappelli: origine = cima della testa ---------- */
function cupola(g, x, y, rx, ry, fondo) {   // mezza ellisse sopra + bordo inferiore curvo
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, Math.PI, TAU); g.quadraticCurveTo(x, y + (fondo || 0), x - rx, y); g.closePath();
}
var CAPPELLI = {
  arrampicata: function (g, L, o) {
    var parti = [function () { cupola(g, 0, 0.14, 0.41, 0.36, -0.05); }, function () { A.rr(g, -0.1, -0.31, 0.2, 0.12, 0.05); }];
    disegnaParti(g, parti, [L.hat, L.hatS], o, L, 0, -0.06, -0.05);
    g.fillStyle = L.hatS; A.rr(g, -0.27, -0.1, 0.13, 0.055, 0.025); g.fill(); A.rr(g, 0.08, -0.12, 0.13, 0.055, 0.025); g.fill();
    g.fillStyle = 'rgba(36,21,15,0.35)'; g.fillRect(-0.4, 0.08, 0.8, 0.045);
    luce(g, -0.2, -0.1);
  },
  militare: function (g, L, o) {
    var parti = [function () { ellisse(g, 0.02, 0.12, 0.53, 0.1); }, function () { cupola(g, 0, 0.1, 0.42, 0.33, 0.02); }];
    disegnaParti(g, parti, [L.hatS, L.hat], o, L, 1, -0.06, -0.05);
    g.fillStyle = INK; ellisse(g, 0.15, -0.06, 0.085 + o * 0.5, 0.085 + o * 0.5); g.fill();
    g.fillStyle = '#f4c430'; ellisse(g, 0.15, -0.06, 0.085, 0.085); g.fill();
    g.fillStyle = '#c28e17'; ellisse(g, 0.17, -0.04, 0.035, 0.035); g.fill();
    luce(g, -0.2, -0.08);
  },
  nessuno: null,
  cantiere: function (g, L, o) {
    var parti = [function () { ellisse(g, 0.1, 0.11, 0.52, 0.075); }, function () { cupola(g, 0, 0.1, 0.36, 0.4, 0.02); }, function () { A.rr(g, -0.06, -0.36, 0.12, 0.3, 0.05); }];
    disegnaParti(g, parti, [L.hatS, L.hat, L.hatL], o, L, 1, -0.06, -0.05);
    g.fillStyle = L.hatS; g.fillRect(-0.035, -0.33, 0.07, 0.4); g.fillStyle = L.hatL; g.fillRect(-0.035, -0.33, 0.03, 0.4);
    luce(g, -0.19, -0.14);
  },
  visiera: function (g, L, o) {
    var parti = [function () { g.beginPath(); g.moveTo(-0.42, 0.22); g.ellipse(0, 0.2, 0.42, 0.44, 0, Math.PI, TAU); g.lineTo(0.42, 0.14); g.quadraticCurveTo(0.1, 0.08, -0.2, 0.16); g.closePath(); }];
    disegnaParti(g, parti, [L.hat], o, L, 0, -0.06, -0.05);
    g.fillStyle = INK; ellisse(g, -0.26, 0.1, 0.06 + o * 0.5, 0.06 + o * 0.5); g.fill();
    g.fillStyle = '#8b96a0'; ellisse(g, -0.26, 0.1, 0.06, 0.06); g.fill();
    g.fillStyle = L.hatS; g.fillRect(-0.02, -0.22, 0.05, 0.3);
    luce(g, -0.2, -0.08);
  },
  minatore: function (g, L, o) {
    var parti = [function () { ellisse(g, 0.0, 0.12, 0.46, 0.07); }, function () { cupola(g, 0, 0.1, 0.38, 0.32, 0.02); },
      function () { ellisse(g, 0.3, -0.06, 0.15, 0.15); }];
    disegnaParti(g, parti, [L.hatS, L.hat, '#8a9098'], o, L, 1, -0.06, -0.05);
    g.fillStyle = '#5e646b'; ellisse(g, 0.33, -0.04, 0.12, 0.12); g.fill();
    g.fillStyle = '#fff3a0'; ellisse(g, 0.33, -0.06, 0.095, 0.095); g.fill();
    g.fillStyle = '#ffffff'; ellisse(g, 0.3, -0.09, 0.035, 0.035); g.fill();
    luce(g, -0.19, -0.08);
  },
  lana: function (g, L, o) {
    var parti = [function () { g.beginPath(); g.moveTo(-0.39, 0.12); g.lineTo(-0.38, 0.0); g.bezierCurveTo(-0.38, -0.3, -0.2, -0.38, 0, -0.38); g.bezierCurveTo(0.2, -0.38, 0.38, -0.3, 0.38, 0.0); g.lineTo(0.39, 0.12); g.quadraticCurveTo(0, 0.06, -0.39, 0.12); g.closePath(); },
      function () { A.rr(g, -0.42, -0.02, 0.84, 0.17, 0.07); }, function () { ellisse(g, -0.02, -0.44, 0.15, 0.15); }];
    disegnaParti(g, parti, [L.hat, L.hatS, '#f6f1e7'], o, L, 0, -0.06, -0.05);
    g.fillStyle = L.hatL; g.fillRect(-0.38, -0.2, 0.76, 0.07);
    g.fillStyle = '#cfc5b2'; ellisse(g, 0.02, -0.41, 0.09, 0.09); g.fill();
    g.fillStyle = '#fffdf6'; ellisse(g, -0.06, -0.49, 0.05, 0.05); g.fill();
    g.strokeStyle = 'rgba(36,21,15,0.3)'; g.lineWidth = 0.025; g.beginPath();
    for (var i = -3; i <= 3; i++) { g.moveTo(i * 0.11, 0.0); g.lineTo(i * 0.11, 0.13); } g.stroke();
  },
  aviatore: function (g, L, o) {
    var parti = [function () { A.rr(g, -0.46, 0.02, 0.18, 0.56, 0.08); }, function () { cupola(g, 0, 0.22, 0.41, 0.46, -0.04); },
      function () { ellisse(g, 0.1, -0.04, 0.1, 0.1); }, function () { ellisse(g, 0.34, -0.04, 0.1, 0.1); }];
    disegnaParti(g, parti, [L.hatS, L.hat, '#c9a04e', '#c9a04e'], o, L, 1, -0.06, -0.05);
    g.fillStyle = L.hatS; g.fillRect(-0.4, -0.07, 0.4, 0.06);
    g.fillStyle = INK; g.fillRect(0.19, -0.06, 0.06, 0.04);
    g.fillStyle = '#8fdcff'; ellisse(g, 0.1, -0.04, 0.065, 0.065); g.fill(); ellisse(g, 0.34, -0.04, 0.065, 0.065); g.fill();
    g.fillStyle = '#ffffff'; ellisse(g, 0.08, -0.07, 0.025, 0.025); g.fill(); ellisse(g, 0.32, -0.07, 0.025, 0.025); g.fill();
    g.fillStyle = '#c9a04e'; g.fillRect(-0.43, 0.46, 0.12, 0.05);
  },
  alpino: function (g, L, o) {
    var penna = function () { g.beginPath(); g.moveTo(-0.16, -0.08); g.quadraticCurveTo(-0.5, -0.22, -0.6, -0.74); g.quadraticCurveTo(-0.36, -0.38, -0.06, -0.14); g.closePath(); };
    var parti = [penna, function () { ellisse(g, 0.03, 0.08, 0.5, 0.085); },
      function () { g.beginPath(); g.moveTo(-0.33, 0.07); g.lineTo(-0.27, -0.2); g.quadraticCurveTo(0.0, -0.34, 0.26, -0.26); g.lineTo(0.35, 0.07); g.closePath(); }];
    disegnaParti(g, parti, ['#efe9da', L.hatS, L.hat], o, L, 2, -0.06, -0.04);
    g.fillStyle = L.hatS; g.fillRect(-0.32, -0.04, 0.66, 0.08);
    g.fillStyle = '#3a342c'; g.beginPath(); g.moveTo(-0.6, -0.74); g.quadraticCurveTo(-0.52, -0.5, -0.44, -0.44); g.lineTo(-0.5, -0.4); g.closePath(); g.fill();
    g.fillStyle = INK; ellisse(g, -0.2, -0.06, 0.065 + o * 0.5, 0.065 + o * 0.5); g.fill();
    g.fillStyle = '#c0392b'; ellisse(g, -0.2, -0.06, 0.065, 0.065); g.fill();
  },
  bandana: function (g, L, o) {
    var parti = [function () { g.beginPath(); g.moveTo(-0.4, 0.06); g.lineTo(-0.68, -0.08); g.lineTo(-0.6, 0.12); g.lineTo(-0.7, 0.3); g.lineTo(-0.38, 0.18); g.closePath(); },
      function () { cupola(g, 0, 0.2, 0.4, 0.34, -0.02); }, function () { ellisse(g, -0.4, 0.13, 0.09, 0.09); }];
    disegnaParti(g, parti, [L.hatS, L.hat, L.hat], o, L, 1, -0.06, -0.05);
    g.fillStyle = '#ffffff';
    [[0.05, -0.05], [-0.18, 0.04], [0.24, 0.06], [-0.05, 0.14]].forEach(function (d) { ellisse(g, d[0], d[1], 0.03, 0.03); g.fill(); });
    g.fillStyle = L.hatS; g.fillRect(-0.39, 0.13, 0.78, 0.06);
  }
};
function disegnaParti(g, parti, colori, o, L, iOmbra, dx, dy) {
  // parte per parte: inchiostro (sporge di o e fa da linea di stacco sulla parte sotto), colore, ombra netta
  g.strokeStyle = INK; g.lineWidth = o * 2;
  parti.forEach(function (fp, i) {
    fp(); g.fillStyle = INK; g.fill(); g.stroke();
    g.fillStyle = colori[i]; g.fill();
    if (i === iOmbra) {
      g.save(); fp(); g.clip();
      g.fillStyle = L.hatS; g.fillRect(-1, -1, 2, 2);
      g.translate(dx, dy); fp(); g.fillStyle = L.hat; g.fill();
      g.restore();
    }
  });
}
function luce(g, x, y) { g.fillStyle = 'rgba(255,255,255,0.75)'; ellisse(g, x, y, 0.05, 0.09, 0.9); g.fill(); }

function spriteCappello(L, S) {
  var fn = CAPPELLI[L.cappello];
  if (!fn) return null;
  return cuoci('h' + L.id + '_' + S, S, -0.75, -0.82, 0.68, 0.7, function (g, o) { fn(g, L, o); });
}
A.spriteCappello = spriteCappello;
// COSMETICI v2: i cappelli premium si registrano qui; gli attrezzi servono ai disegni nuovi
A.CAPPELLI = CAPPELLI;
A.KIT = { INK:INK, B:B, cupola:cupola, ellisse:ellisse, disegnaParti:disegnaParti, luce:luce, pathCorpo:pathCorpo, cuoci:cuoci, metti:metti };

/* ---------- la posa: stato fisico + timer degli eventi -> angoli e facce ----------
   Angoli delle braccia nel verso del corpo: 0 = giu', +PI/2 = avanti, PI = su, - = indietro.
   occhi: 0 normali, 1 chiusi, 2 spalancati, 3 fatica, 4 X, 5 spirale, 6 felici ^ ^, 7 strizzati > <, 8 grinta
   bocca: 0 sorriso, 1 «o», 2 denti stretti, 3 aperta felice, 4 ondulata, 5 fagiolo, 6 «o» piccola */
var P = { ox:0, bob:0, rot:0, ssx:1, ssy:1, shake:0, aB:0, aF:0, fBx:0, fBy:0, fFx:0, fFy:0,
  occhi:0, bocca:0, pup:1, es:1, bDav:0, hatUp:0, hatRot:0, stelle:0, sangue:0, lookX:0, lookY:0 };
function lerp(a, b, t) { return a + (b - a) * t; }
function posa(an, p) {
  var t = an.t || 0, g = !!p.grounded, vx = p.vx || 0, vy = p.vy || 0, ws = p.wallside || 0, av = Math.abs(vx);
  var br = Math.sin(t * 2.6), e;
  P.ox = 0; P.bob = 0; P.rot = 0; P.ssx = 1 - br * 0.014; P.ssy = 1 + br * 0.026; P.shake = 0;
  P.aB = -0.22 - br * 0.06; P.aF = 0.22 + br * 0.06;
  P.fBx = -0.15; P.fBy = 0; P.fFx = 0.15; P.fFy = 0;
  P.occhi = 0; P.bDav = 0; P.bocca = (g && av < 0.5) ? 5 : 0; P.pup = 1; P.es = 1; P.hatUp = 0; P.hatRot = 0; P.stelle = 0; P.sangue = 0;
  P.lookX = (an.lookX || 0) * (an.face || 1); P.lookY = an.lookY || 0;
  if (ws) {                                   // scivolata: il muro e' dietro, una mano sul muro
    P.ox = -0.04; P.shake = Math.sin(t * 47) * 0.012;
    P.aB = -2.2; P.aF = 0.75 + Math.sin(t * 9) * 0.12; P.bDav = 1;
    P.fBx = -0.24; P.fBy = -0.14; P.fFx = 0.1; P.fFy = -0.03;
    P.occhi = 3; P.bocca = 2;
  } else if (!g) {
    if (vy > 3) {                             // salita: braccia su, gambe raccolte
      P.aF = 2.2; P.aB = -2.05; P.fFx = 0.14; P.fFy = -0.1; P.fBx = -0.1; P.fBy = -0.03; P.bocca = 5;
      if (an.tSalto < 0.12) { P.fFx = 0.06; P.fFy = 0.05; P.fBx = -0.07; P.fBy = 0.05; P.bocca = 2; }
    } else if (vy >= -3) {                    // apice: braccia aperte
      P.aF = 1.55; P.aB = -1.6; P.fFx = 0.2; P.fFy = -0.07; P.fBx = -0.18; P.fBy = -0.02; P.bocca = 6;
    } else {                                  // caduta: braccia in alto che sbracciano
      P.aF = 2.3 + Math.sin(t * 22) * 0.3; P.aB = -2.3 + Math.sin(t * 22 + 1.7) * 0.3;
      P.fFx = 0.2; P.fFy = 0.02 + Math.sin(t * 17) * 0.03; P.fBx = -0.19; P.fBy = 0.02 - Math.sin(t * 17) * 0.03; P.bocca = 1;
      if (vy < -14) { P.occhi = 2; P.es = 1.1; P.pup = 0.72; }
    }
  } else if (p.skidT > 0) {                   // frenata: piede avanti, braccia indietro, sguardo al nuovo verso
    P.fFx = 0.3; P.fBx = -0.04; P.fBy = -0.06; P.aF = -1.3; P.aB = -2.3; P.occhi = 2; P.es = 1.06; P.bocca = 2;
  } else if (av > 0.5) {                      // corsa
    var ph = an.fase * Math.PI, s = Math.sin(ph), co = Math.cos(ph), kv = Math.min(1, av / 8);
    P.fFx = 0.05 + s * 0.22 * kv; P.fFy = -Math.max(0, co) * 0.15 * kv;
    P.fBx = -0.05 - s * 0.22 * kv; P.fBy = -Math.max(0, -co) * 0.15 * kv;
    P.aF = 0.3 - s * 1.15 * kv; P.aB = -0.3 + s * 1.15 * kv;
    P.bob = Math.abs(co) * 0.06 * kv; P.ssy = 1 + Math.abs(co) * 0.04 * kv; P.ssx = 1 - Math.abs(co) * 0.03 * kv;
  }
  if (an.oggetto && !ws) P.aF = lerp(P.aF, 1.15, 0.75);
  if (an.tAtt < 0.24 && g) {
    e = (1 - an.tAtt / 0.24) * Math.min(1, an.attF + 0.2);
    P.fFx += 0.12 * e; P.fBx -= 0.12 * e; P.aF = lerp(P.aF, 1.3, e); P.aB = lerp(P.aB, -1.3, e);
    if (an.attF > 0.6 && an.tAtt < 0.14) { P.occhi = 7; P.bocca = 2; }
  }
  if (an.tPop < 0.25) { e = 1 - an.tPop / 0.25; P.aF = lerp(P.aF, 2.3, e); P.aB = lerp(P.aB, -2.2, e); }
  if (an.giro > 0) {                          // torsione (salto a muro / giro sul posto): di taglio a meta'
    e = Math.sin(Math.min(1, an.giro) * Math.PI);
    P.ssx *= 1 - (g ? 0.22 : 0.4) * e;
    if (!g) { P.aF = lerp(P.aF, 2.2, e); P.aB = lerp(P.aB, -2.4, e); P.rot += 0.22 * e; P.fFy -= 0.08 * e; P.fBy -= 0.08 * e; }
  }
  if (an.tUso < 0.42) {                       // uso: carica dietro, colpo nel verso dato, ritorno
    var u = an.tUso, ang;
    if (u < 0.07) ang = lerp(0.6, an.usoAng - 2.3, u / 0.07);
    else if (u < 0.15) ang = lerp(an.usoAng - 2.3, an.usoAng + 0.35, (u - 0.07) / 0.08);
    else ang = lerp(an.usoAng + 0.35, an.usoAng, Math.min(1, (u - 0.15) / 0.12));
    P.aF = ang; P.aB = -1.0; P.rot += (u < 0.07 ? -0.14 : 0.16) * Math.sin(Math.min(1, u / 0.42) * Math.PI);
    P.occhi = 8; P.bocca = u < 0.07 ? 2 : 3;
  }
  if (an.tSpD < 0.3) {                        // spallata
    e = Math.sin(an.tSpD / 0.3 * Math.PI);
    P.ox += 0.15 * e; P.rot += 0.16 * e; P.aF = lerp(P.aF, -0.15, e); P.aB = lerp(P.aB, -1.9, e);
    P.fFx = lerp(P.fFx, 0.28, e); P.fBx = lerp(P.fBx, -0.26, e); P.occhi = 8; P.bocca = 2;
  }
  var paura = Math.max(an.spav || 0, ((an.pericolo || 0) - 0.35) / 0.65);
  if (paura > 0.05) {
    P.occhi = 2; P.es = 1 + 0.15 * Math.min(1, paura); P.pup = 1 - 0.45 * Math.min(1, paura); P.bocca = 6;
    if (an.spav > 0.3) { e = Math.min(1, an.spav); P.aF = lerp(P.aF, 2.1, e); P.aB = lerp(P.aB, -2.0, e); }
    if (an.pericolo > 0.6) P.shake += Math.sin(t * 61) * 0.01;
  }
  var durP = 0.2 + 0.3 * (an.spPF || 0);
  if (an.tSpP < durP) {                       // spinta presa: di lato, occhi sbarrati
    e = 1 - an.tSpP / durP; var d = an.spPDir * (an.face || 1);
    P.ox += d * 0.1 * e; P.rot += -d * 0.22 * e * (0.5 + an.spPF);
    P.aF = lerp(P.aF, d > 0 ? -2.1 : 2.6, e); P.aB = lerp(P.aB, d > 0 ? -2.6 : 2.1, e);
    P.occhi = 2; P.es = 1.15; P.pup = 0.5; P.bocca = 1; P.lookX = 0; P.lookY = 0;
  }
  if (an.tBonk < 0.35) { e = 1 - an.tBonk / 0.35; P.occhi = 7; P.bocca = 1; P.aF = lerp(P.aF, 2.55, e); P.aB = lerp(P.aB, -2.55, e); }
  if (an.stordT > 0) {
    P.rot += Math.sin(t * 5) * 0.16; P.occhi = 5; P.bocca = 4; P.stelle = 1;
    P.aF = 0.5 + Math.sin(t * 5) * 0.3; P.aB = -0.5 + Math.sin(t * 5 + 1) * 0.3;
  }
  if (an.arrivo > 0) {                        // vetta: salterelli, braccia al cielo, occhi felici
    P.occhi = 6; P.bocca = 3;
    P.aF = 2.35 + Math.sin(t * 14) * 0.35; P.aB = -2.35 + Math.sin(t * 14 + 1.2) * 0.35;
    if (g) { P.bob = Math.abs(Math.sin(t * 7)) * 0.14; P.fFx = 0.1; P.fBx = -0.1; }
  }
  if (an.bT > 0 && (P.occhi === 0 || P.occhi === 3 || P.occhi === 8)) P.occhi = 1;
}

/* ---------- disegno ---------- */
var MOLLE0 = { sx:1, sy:1, lean:0, twist:0, hatY:0, hatR:0 };
function scarpone(g, x, y, bw, o, S) {
  g.beginPath(); g.moveTo(x - S * 0.04, y); g.lineTo(x + S * 0.075, y);
  g.strokeStyle = INK; g.lineWidth = bw + o * 2; g.stroke();
  g.strokeStyle = '#3d302b'; g.lineWidth = bw; g.stroke();
  if (S >= 40) {   // ramponi
    var yy = y + bw * 0.5 + o * 0.6, dy = S * 0.045;
    g.fillStyle = '#d3d8dc'; g.beginPath();
    for (var i = 0; i < 4; i++) { var px = x - S * 0.075 + i * S * 0.055; g.moveTo(px, yy); g.lineTo(px + S * 0.02, yy + dy); g.lineTo(px + S * 0.04, yy); }
    g.fill();
  }
}
function palpebra(g, x, ey, R, Ry, hL, hR, col, oi) {
  var aL = Math.PI - Math.asin(hL), aR = 2 * Math.PI + Math.asin(hR);
  g.beginPath(); g.ellipse(x, ey, R, Ry, 0, aL, aR); g.closePath();
  g.fillStyle = col; g.fill();
  g.beginPath(); g.moveTo(x + R * Math.cos(aL), ey + Ry * Math.sin(aL)); g.lineTo(x + R * Math.cos(aR), ey + Ry * Math.sin(aR));
  g.strokeStyle = INK; g.lineWidth = oi; g.stroke();
}
/* ONLINE 15/09 — STILI DEGLI OCCHI (cosmetico): tondi (di serie), grandi, furbi, ciglia, occhiali.
   Solo sugli occhi aperti: le espressioni (X, spirale, ^ ^, chiusi) restano uguali per tutti. */
function stileOcchi(g, L, m, x1, x2, Y, rx, ry, oi, lid, S) {
  var st = L.occhi;
  if (!st || st === 'tondi' || st === 'grandi') return;
  if (st === 'furbi' && (m === 0 || m === 2)) { palpebra(g, x1, Y, rx + oi, ry + oi, -0.35, -0.05, lid, oi); palpebra(g, x2, Y, rx + oi, ry + oi, -0.05, -0.35, lid, oi); return; }
  if (st === 'ciglia') {
    g.strokeStyle = INK; g.lineWidth = Math.max(1.1, S * 0.03); g.beginPath();
    for (var i = 0; i < 2; i++) { var xx = i ? x2 : x1, sg = i ? 1 : -1;
      for (var k = 0; k < 3; k++) { var a = -Math.PI / 2 + sg * (0.35 + k * 0.38); g.moveTo(xx + Math.cos(a) * (rx + oi), Y + Math.sin(a) * (ry + oi)); g.lineTo(xx + Math.cos(a) * (rx + oi + S * 0.07), Y + Math.sin(a) * (ry + oi + S * 0.07)); } }
    g.stroke(); return;
  }
  if (st === 'occhiali') {
    g.strokeStyle = '#3a3f4a'; g.lineWidth = Math.max(1.6, S * 0.05); g.beginPath();
    g.moveTo(x1 + rx * 1.3, Y); g.ellipse(x1, Y, rx * 1.3, ry * 1.25, 0, 0, Math.PI * 2);
    g.moveTo(x2 + rx * 1.3, Y); g.ellipse(x2, Y, rx * 1.3, ry * 1.25, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = 'rgba(160,220,255,0.18)'; g.beginPath(); g.ellipse(x1, Y, rx * 1.2, ry * 1.15, 0, 0, Math.PI * 2); g.ellipse(x2, Y, rx * 1.2, ry * 1.15, 0, 0, Math.PI * 2); g.fill();
  }
}
function occhiEBocca(g, L, t, S, o, cx, ey, erx, ery, mx, my) {
  var og = L.occhi === 'grandi' ? 1.14 : 1;   // ONLINE 15/09: lo stile degli occhi e' un cosmetico (LOOK_API.md)
  var m = P.occhi, rx = erx * S * P.es * og, ry = ery * S * P.es * og, gap = erx * S * 0.97, Y = ey * S;
  var x1 = cx * S - gap, x2 = cx * S + gap, oi = Math.max(1.1, o * 0.62), i, xx;
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (m === 6 || m === 7) {
    g.strokeStyle = INK; g.lineWidth = Math.max(1.7, S * 0.062); g.beginPath();
    if (m === 6) {
      for (i = 0; i < 2; i++) { xx = i ? x2 : x1; g.moveTo(xx - rx * 0.8, Y + ry * 0.3); g.lineTo(xx, Y - ry * 0.5); g.lineTo(xx + rx * 0.8, Y + ry * 0.3); }
    } else {
      g.moveTo(x1 - rx * 0.7, Y - ry * 0.6); g.lineTo(x1 + rx * 0.6, Y); g.lineTo(x1 - rx * 0.7, Y + ry * 0.6);
      g.moveTo(x2 + rx * 0.7, Y - ry * 0.6); g.lineTo(x2 - rx * 0.6, Y); g.lineTo(x2 + rx * 0.7, Y + ry * 0.6);
    }
    g.stroke();
  } else {
    g.fillStyle = INK; g.beginPath();
    g.moveTo(x1 + rx + oi, Y); g.ellipse(x1, Y, rx + oi, ry + oi, 0, 0, TAU);
    g.moveTo(x2 + rx + oi, Y); g.ellipse(x2, Y, rx + oi, ry + oi, 0, 0, TAU); g.fill();
    var lid = L.cappello === 'visiera' ? '#1b2232' : L.col;
    g.fillStyle = m === 1 ? lid : '#ffffff'; g.beginPath();
    g.moveTo(x1 + rx, Y); g.ellipse(x1, Y, rx, ry, 0, 0, TAU);
    g.moveTo(x2 + rx, Y); g.ellipse(x2, Y, rx, ry, 0, 0, TAU); g.fill();
    if (m === 1) {
      g.strokeStyle = INK; g.lineWidth = oi; g.beginPath(); g.moveTo(x1 - rx, Y + ry * 0.15); g.lineTo(x2 + rx, Y + ry * 0.15); g.stroke();
    } else if (m === 4) {
      g.strokeStyle = INK; g.lineWidth = Math.max(1.5, S * 0.05); g.beginPath();
      for (i = 0; i < 2; i++) { xx = i ? x2 : x1; g.moveTo(xx - rx * 0.55, Y - ry * 0.55); g.lineTo(xx + rx * 0.55, Y + ry * 0.55); g.moveTo(xx + rx * 0.55, Y - ry * 0.55); g.lineTo(xx - rx * 0.55, Y + ry * 0.55); }
      g.stroke();
    } else if (m === 5) {
      g.strokeStyle = INK; g.lineWidth = Math.max(1.2, S * 0.036); g.beginPath();
      for (i = 0; i < 2; i++) {
        xx = i ? x2 : x1;
        for (var j = 0; j < 14; j++) { var a = j * 0.8 + t * (i ? -9 : 9), r = rx * (0.06 + j * 0.058); var px = xx + Math.cos(a) * r, py = Y + Math.sin(a) * r * ry / rx; if (j) g.lineTo(px, py); else g.moveTo(px, py); }
      }
      g.stroke();
    } else {
      var pr = B.pup * S * P.pup * (S < 30 ? 1.12 : 1), lim = 0.46 + (1 - P.pup) * 0.3;
      var pxo = cl(P.lookX, -1, 1) * (rx - pr * 0.85) * lim * 1.75, pyo = cl(-P.lookY, -1, 1) * (ry - pr * 0.85) * lim * 1.6;
      g.fillStyle = L.pupilla || INK; g.beginPath();
      g.moveTo(x1 + pxo + pr, Y + pyo); g.arc(x1 + pxo, Y + pyo, pr, 0, TAU);
      g.moveTo(x2 + pxo + pr, Y + pyo); g.arc(x2 + pxo, Y + pyo, pr, 0, TAU); g.fill();
      if (S >= 34) {
        g.fillStyle = '#ffffff'; g.beginPath(); var gr = pr * 0.34;
        g.moveTo(x1 + pxo - pr * 0.35 + gr, Y + pyo - pr * 0.4); g.arc(x1 + pxo - pr * 0.35, Y + pyo - pr * 0.4, gr, 0, TAU);
        g.moveTo(x2 + pxo - pr * 0.35 + gr, Y + pyo - pr * 0.4); g.arc(x2 + pxo - pr * 0.35, Y + pyo - pr * 0.4, gr, 0, TAU); g.fill();
      }
      if (m === 3) { palpebra(g, x1, Y, rx + oi, ry + oi, 0.02, -0.12, lid, oi); palpebra(g, x2, Y, rx + oi, ry + oi, -0.12, 0.02, lid, oi); }
      else if (m === 8) { palpebra(g, x1, Y, rx + oi, ry + oi, -0.85, -0.25, lid, oi); palpebra(g, x2, Y, rx + oi, ry + oi, -0.25, -0.85, lid, oi); }
      stileOcchi(g, L, m, x1, x2, Y, rx, ry, oi, lid, S);
    }
  }
  if (L.oc && A.occhiExtra) A.occhiExtra(g, L, S, o, x1, x2, Y, rx, ry, m);   // COSMETICI v2
  // bocca
  var X0 = mx * S, Y0 = my * S;
  g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = Math.max(1.3, S * 0.042);
  switch (P.bocca) {
    case 0: g.beginPath(); g.arc(X0, Y0 - S * 0.05, S * 0.06, 0.45, Math.PI - 0.45); g.stroke(); break;
    case 1: g.beginPath(); g.ellipse(X0, Y0, Math.max(1.3, S * 0.045), Math.max(1.7, S * 0.062), 0, 0, TAU); g.fill(); break;
    case 2: A.rr(g, X0 - S * 0.085, Y0 - S * 0.033, S * 0.17, Math.max(2, S * 0.066), S * 0.02); g.fill();
      if (S >= 34) { g.fillStyle = '#fff'; g.fillRect(X0 - S * 0.065, Y0 - S * 0.012, S * 0.13, S * 0.022); } break;
    case 3: g.beginPath(); g.moveTo(X0 + S * 0.095, Y0 - S * 0.035); g.arc(X0, Y0 - S * 0.035, S * 0.095, 0, Math.PI); g.closePath(); g.fill();
      if (S >= 34) { g.fillStyle = '#e4575a'; g.beginPath(); g.ellipse(X0, Y0 + S * 0.03, S * 0.045, S * 0.025, 0, 0, TAU); g.fill(); } break;
    case 4: g.beginPath(); g.moveTo(X0 - S * 0.09, Y0); for (var w = 1; w <= 4; w++) g.lineTo(X0 - S * 0.09 + w * S * 0.045, Y0 + (w % 2 ? -1 : 1) * S * 0.025); g.stroke(); break;
    case 6: g.beginPath(); g.ellipse(X0, Y0, Math.max(1.1, S * 0.032), Math.max(1.4, S * 0.042), 0, 0, TAU); g.fill(); break;
    default: g.beginPath(); g.ellipse(X0, Y0, Math.max(1.6, S * 0.056), Math.max(1.1, S * 0.03), 0, 0, TAU); g.fill();
  }
}
function stelle(g, t, S, o) {
  g.fillStyle = '#ffe14a'; g.strokeStyle = INK; g.lineWidth = Math.max(1, o * 0.6);
  for (var i = 0; i < 3; i++) {
    var a = t * 4 + i * 2.094, x = Math.cos(a) * 0.44 * S, y = (B.top - 0.3) * S + Math.sin(a) * 0.09 * S, r = S * 0.1 * (0.8 + 0.25 * Math.sin(a)), q = r * 0.36;
    g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + q, y - q); g.lineTo(x + r, y); g.lineTo(x + q, y + q); g.lineTo(x, y + r); g.lineTo(x - q, y + q); g.lineTo(x - r, y); g.lineTo(x - q, y - q); g.closePath();
    g.stroke(); g.fill();
  }
}

function disegna(g, L, an, p, X, Y, S, a, morto) {
  var Sr = Math.max(4, Math.round(S)), k = S / Sr, o = Math.max(1.6, S * 0.085), face = an.face || 1;
  var sx = an.sx * P.ssx, sy = an.sy * P.ssy, i;
  // scie: sagoma chiara
  if (!morto && an.scie && an.scie.length && L.sc && A.scia) A.scia(g, L, an, p, X, Y, S, a);   // COSMETICI v2
  else if (!morto && an.scie && an.scie.length) {
    var sg = spriteSagoma(L, Sr);
    for (i = 0; i < an.scie.length; i++) {
      var sc = an.scie[i];
      g.globalAlpha = sc.a * a * 0.7;
      g.save(); g.translate(X + (sc.x - p.x) * S, Y - (sc.y - p.y) * S); g.scale((sc.f || 1) * sc.sx, sc.sy); metti(g, sg, k); g.restore();
    }
  }
  g.globalAlpha = a;
  if (p.grounded) { g.fillStyle = 'rgba(20,10,8,0.28)'; g.beginPath(); g.ellipse(X, Y, S * 0.44 * Math.min(1.6, sx), S * 0.075, 0, 0, TAU); g.fill(); }
  g.save();
  g.translate(X, Y);
  if (an.lean) g.transform(1, 0, -an.lean, 1, 0, 0);
  g.scale(face, 1);
  g.translate((P.ox + P.shake) * S, 0);
  var rot = P.rot + (an.twist || 0) * 0.04;
  if (rot) g.rotate(rot);
  g.scale(sx, sy);
  g.lineCap = 'round'; g.lineJoin = 'round';
  var lw = B.limb * S, bw = B.boot * S, bob = P.bob * S, al = B.arm * S;
  var hy = B.hipY * S - bob, shy = B.shY * S - bob;
  // arti dietro
  var sBx = -B.shX * S, aBx = sBx + Math.sin(P.aB) * al, aBy = shy + Math.cos(P.aB) * al;
  var fBx = P.fBx * S, fBy = (P.fBy - 0.07) * S;
  var sFx = B.shX * S, aFx = sFx + Math.sin(P.aF) * al, aFy = shy + Math.cos(P.aF) * al;
  var fFx = P.fFx * S, fFy = (P.fFy - 0.07) * S;
  g.beginPath(); g.moveTo(-B.hipX * S, hy); g.lineTo(fBx, fBy); if (!P.bDav) { g.moveTo(sBx, shy); g.lineTo(aBx, aBy); }
  g.strokeStyle = INK; g.lineWidth = lw + o * 2; g.stroke();
  g.strokeStyle = L.colS; g.lineWidth = lw; g.stroke();
  scarpone(g, fBx, fBy, bw, o, S);
  // gamba davanti: anche lei dietro al corpo (l'anca sta dentro la pancia)
  g.beginPath(); g.moveTo(B.hipX * S, hy); g.lineTo(fFx, fFy);
  g.strokeStyle = INK; g.lineWidth = lw + o * 2; g.stroke();
  g.strokeStyle = L.col; g.lineWidth = lw; g.stroke();
  scarpone(g, fFx, fFy, bw, o, S);
  // corpo, faccia, cappello
  g.translate(0, -bob);
  metti(g, spriteCorpo(L, Sr), k);
  if (morto) {
    g.fillStyle = PAL.blood || '#c8101c';
    g.beginPath(); g.ellipse(-0.18 * S, -0.5 * S, 0.1 * S, 0.08 * S, 0.4, 0, TAU); g.moveTo(0.26 * S, -0.3 * S); g.ellipse(0.2 * S, -0.3 * S, 0.06 * S, 0.075 * S, 0, 0, TAU);
    g.moveTo(0.3 * S, -1.0 * S); g.ellipse(0.25 * S, -1.0 * S, 0.05 * S, 0.04 * S, 0, 0, TAU); g.rect(-0.2 * S, -0.5 * S, 0.035 * S, 0.22 * S); g.fill();
  }
  occhiEBocca(g, L, an.t || 0, S, o, B.eyeX, B.eyeY, B.erx, B.ery, B.mouthX, B.mouthY);
  var hs = spriteCappello(L, Sr);
  if (hs) {
    g.save(); g.translate(P.hatUp * S * 0.3, (B.top - 0.02 - (an.hatY || 0) - P.hatUp) * S);
    var hr = (an.hatR || 0) * 0.12 + P.hatRot; if (hr) g.rotate(hr);
    g.scale(B.hat / Math.sqrt(Math.max(0.3, sx)), B.hat / Math.sqrt(Math.max(0.3, sy)));
    metti(g, hs, k); g.restore();
  }
  if (P.stelle) stelle(g, an.t || 0, S, o);
  g.translate(0, bob);
  // arti davanti
  g.beginPath(); g.moveTo(sFx, shy); g.lineTo(aFx, aFy); if (P.bDav) { g.moveTo(sBx, shy); g.lineTo(aBx, aBy); }
  g.strokeStyle = INK; g.lineWidth = lw + o * 2; g.stroke();
  g.strokeStyle = L.col; g.lineWidth = lw; g.stroke();
  // oggetto in mano (dritto, non specchiato)
  var id = an.tUso < 0.42 && an.usoId ? an.usoId : an.oggetto;
  if (id && A.iconaOggetto && !morto) {
    g.save(); g.translate(aFx, aFy); g.scale(1 / sx, 1 / sy); if (rot) g.rotate(-rot); g.scale(face, 1);
    try { A.iconaOggetto(g, id, 0, 0, S * 0.42); } catch (err) { }
    g.restore();
  }
  g.restore();
  // sbuffo della rinascita (COSMETICI v2: effetto scelto)
  if (an.nato > 0 && !morto && L.ri && A.rinascita) A.rinascita(g, L, an.nato / 0.5, X, Y, S);
  else if (an.nato > 0 && !morto) {
    var u = an.nato / 0.5;
    g.fillStyle = 'rgba(255,248,235,' + (0.85 * (1 - u)).toFixed(3) + ')'; g.beginPath();
    for (i = 0; i < 8; i++) {
      var ag = i * Math.PI / 4 + 0.3, rr0 = (0.35 + u * 0.6) * S, cx = X + Math.cos(ag) * rr0, cy = Y - 0.45 * S + Math.sin(ag) * rr0 * 0.7, cr = (0.15 * (1 - u) + 0.03) * S;
      g.moveTo(cx + cr, cy); g.arc(cx, cy, cr, 0, TAU);
    }
    g.fill();
  }
  g.globalAlpha = 1;
}

/* disegna il corpo coi piedi in (X,Y) pixel, S = pixel per cella */
A.corpo = function (g, c, an, X, Y, S, alfa, look) {
  var L = lookDi(look), p = c.p;
  posa(an, p);
  if (an.arrivo > 0 && L.em && A.emote) A.emote(P, an, L.em, p);   // COSMETICI v2: esultanza scelta
  disegna(g, L, an, p, X, Y, S, alfa == null ? 1 : alfa, false);
  if (an.arrivo > 0 && L.em && A.emoteDopo) A.emoteDopo(g, L, an, X, Y, S);   // COSMETICI v2 wave 2
};

var FERMO = { x:0, y:0, vx:0, vy:0, grounded:true, wallside:0, skidT:0, wjLock:0 };
/* fermo-immagine della morte: u 0..1 */
A.corpoMorto = function (g, an, X, Y, S, look, u) {
  var L = lookDi(look), k;
  u = cl(u == null ? 1 : u, 0, 1);
  var e = 1 - Math.pow(1 - u, 3), salva = {};
  for (k in MOLLE0) { salva[k] = an[k]; an[k] = MOLLE0[k]; }
  var nato = an.nato; an.nato = 0;
  posa(an, FERMO);
  P.occhi = 4; P.bocca = 4; P.es = 1.08; P.rot = 0; P.ox = 0; P.bob = 0; P.shake = 0; P.stelle = 0;
  P.aF = lerp(0.3, 1.75, e); P.aB = lerp(-0.3, -1.75, e);
  P.fFx = lerp(0.15, 0.36, e); P.fBx = lerp(-0.15, -0.36, e); P.fFy = 0; P.fBy = 0;
  P.ssx = 1 + 0.55 * e; P.ssy = 1 - 0.42 * e; P.hatUp = e * 0.42; P.hatRot = e * 0.7;
  disegna(g, L, an, FERMO, X, Y, S, 1, true);
  for (k in MOLLE0) an[k] = salva[k];
  an.nato = nato;
};

/* ---------- pezzetti (gib): tela quadrata sz px ---------- */
function rngSemplice(s) { s = (s | 0) * 2654435761 >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
A.gib = function (look, seme, sz) {
  var L = lookDi(look); seme = seme | 0; sz = Math.max(6, Math.round(sz || 16));
  var tipo = ((seme % 5) + 5) % 5, key = 'g' + L.id + '_' + (((seme % 16) + 16) % 16) + '_' + sz;
  return cuoci(key, sz, -0.5, -0.5, 0.5, 0.5, function (g, o0) {
    var R = rngSemplice(seme + 7), o = Math.max(1.2 / sz, 0.07), sang = PAL.blood || '#c8101c', i;
    if (tipo === 2) {          // salsicciotto di braccio
      var an = R() * 3;
      g.save(); g.rotate(an);
      g.beginPath(); g.moveTo(-0.22, 0); g.lineTo(0.22, 0);
      g.strokeStyle = INK; g.lineWidth = 0.26 + o * 2; g.stroke(); g.strokeStyle = L.col; g.lineWidth = 0.26; g.stroke();
      g.fillStyle = sang; g.beginPath(); g.ellipse(-0.27, 0, 0.07, 0.13, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(-0.12, -0.08, 0.2, 0.04);
      g.restore();
    } else if (tipo === 3) {   // scarpone coi ramponi
      g.save(); g.rotate(R() * 2 - 1);
      A.rr(g, -0.3 - o, -0.14 - o, 0.6 + o * 2, 0.28 + o * 2, 0.12); g.fillStyle = INK; g.fill();
      A.rr(g, -0.3, -0.14, 0.6, 0.28, 0.1); g.fillStyle = '#3d302b'; g.fill();
      g.fillStyle = '#d3d8dc'; for (i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-0.24 + i * 0.15, 0.15); g.lineTo(-0.2 + i * 0.15, 0.3); g.lineTo(-0.16 + i * 0.15, 0.15); g.fill(); }
      g.fillStyle = L.col; A.rr(g, -0.12, -0.3, 0.22, 0.18, 0.08); g.fill();
      g.fillStyle = sang; g.beginPath(); g.ellipse(0, -0.32, 0.1, 0.05, 0, 0, TAU); g.fill();
      g.restore();
    } else if (tipo === 4) {   // occhio a palla
      g.fillStyle = INK; g.beginPath(); g.arc(0, 0, 0.3 + o, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 0.3, 0, TAU); g.fill();
      var pa = R() * TAU; g.fillStyle = INK; g.beginPath(); g.arc(Math.cos(pa) * 0.12, Math.sin(pa) * 0.12, 0.13, 0, TAU); g.fill();
      g.strokeStyle = sang; g.lineWidth = 0.06; g.beginPath(); g.moveTo(-0.28, 0.1); g.quadraticCurveTo(-0.4, 0.3, -0.46, 0.44); g.stroke();
    } else {                   // pezzo di gomma colorata
      var n = 7, pts = [];
      for (i = 0; i < n; i++) { var a = i / n * TAU + R() * 0.4, r = 0.26 + R() * 0.16; pts.push([Math.cos(a) * r, Math.sin(a) * r * (0.75 + R() * 0.25)]); }
      var giro = function () { g.beginPath(); for (var j = 0; j < n; j++) { var q = pts[j], q2 = pts[(j + 1) % n]; var mx = (q[0] + q2[0]) / 2, my = (q[1] + q2[1]) / 2; if (!j) g.moveTo((pts[n - 1][0] + q[0]) / 2, (pts[n - 1][1] + q[1]) / 2); g.quadraticCurveTo(q[0], q[1], mx, my); } g.closePath(); };
      giro(); g.strokeStyle = INK; g.lineWidth = o * 2; g.stroke();
      g.fillStyle = L.col; g.fill();
      g.save(); giro(); g.clip();
      g.fillStyle = L.colS; g.fillRect(-0.5, 0.06, 1, 0.5);
      g.fillStyle = sang; g.beginPath(); g.ellipse(0.1 + R() * 0.1, -0.02, 0.2, 0.14, R() * 3, 0, TAU); g.fill();
      g.fillStyle = PAL.bloodD || '#6e0610'; g.beginPath(); g.ellipse(0.14, 0.02, 0.08, 0.05, 0, 0, TAU); g.fill();
      g.restore();
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(-0.14, -0.14, 0.05, 0.08, 0.6, 0, TAU); g.fill();
    }
  }).cv;
};

/* ---------- cappello che vola via (centrato in x,y) ---------- */
A.cappelloVolante = function (g, look, x, y, ang, S) {
  var L = lookDi(look), Sr = Math.max(4, Math.round(S)), k = S / Sr, hs = spriteCappello(L, Sr);
  g.save(); g.translate(x, y); if (ang) g.rotate(ang);
  if (hs) { g.translate(0, 0.1 * S); metti(g, hs, k); }
  else {   // il rosso non ha cappello: vola via il rotolo di corda
    var o = Math.max(1.6, S * 0.085);
    g.beginPath(); g.ellipse(0, 0, 0.14 * S, 0.19 * S, 0.3, 0, TAU);
    g.strokeStyle = INK; g.lineWidth = 0.085 * S + o * 2; g.stroke();
    g.strokeStyle = L.hat; g.lineWidth = 0.085 * S; g.stroke();
    g.strokeStyle = L.hatS; g.lineWidth = Math.max(1, 0.025 * S); g.stroke();
  }
  g.restore();
};

/* ---------- icona: testina tonda di raggio r px (HUD, minimappa, classifica) ---------- */
A.icona = function (g, look, x, y, r) {
  var L = lookDi(look), R0 = 0.46, Sr = Math.max(4, Math.round(r / R0)), k = r / R0 / Sr;
  var sp = cuoci('i' + L.id + '_' + Sr, Sr, -0.95, -1.3, 0.85, 0.62, function (g2, o, S) {
    g2.fillStyle = INK; g2.beginPath(); g2.arc(0, 0, R0 + o, 0, TAU); g2.fill();
    if (L.decor === 'corda') { g2.lineWidth = 0.09 + o * 2; g2.strokeStyle = INK; g2.beginPath(); g2.arc(0, 0, R0 + 0.02, 2.2, 3.4); g2.stroke(); }
    g2.fillStyle = L.colS; g2.beginPath(); g2.arc(0, 0, R0, 0, TAU); g2.fill();
    g2.save(); g2.beginPath(); g2.arc(0, 0, R0, 0, TAU); g2.clip();
    g2.fillStyle = L.col; g2.beginPath(); g2.arc(-0.06, -0.05, R0, 0, TAU); g2.fill();
    g2.fillStyle = 'rgba(255,255,255,0.9)'; ellisse(g2, -0.28, -0.16, 0.05, 0.1, 0.5); g2.fill();
    g2.restore();
    if (L.decor === 'corda') { g2.lineWidth = 0.09; g2.strokeStyle = L.hat; g2.beginPath(); g2.arc(0, 0, R0 + 0.02, 2.2, 3.4); g2.stroke(); }
    if (L.cappello === 'visiera') { g2.fillStyle = INK; A.rr(g2, -0.38 - o, -0.2 - o, 0.8 + o * 2, 0.42 + o * 2, 0.14); g2.fill(); g2.fillStyle = '#1b2232'; A.rr(g2, -0.38, -0.2, 0.8, 0.42, 0.13); g2.fill(); }
    // occhi fissi, sguardo avanti; un pixel in piu' di pupilla per la misura piccola
    var sP = { occhi:P.occhi, bocca:P.bocca, pup:P.pup, es:P.es, lookX:P.lookX, lookY:P.lookY };
    P.occhi = 0; P.bocca = 5; P.pup = 1.15; P.es = 1; P.lookX = 0.5; P.lookY = 0;
    g2.scale(1 / S, 1 / S);
    occhiEBocca(g2, L, 0, S, Math.max(1.6, S * 0.085), 0.03, 0.0, 0.175, 0.2, 0.12, 0.3);
    g2.scale(S, S);
    for (var q in sP) P[q] = sP[q];
    var fn = CAPPELLI[L.cappello];
    if (fn) { g2.save(); g2.translate(0, -R0 + 0.06); g2.scale(1.18, 1.18); fn(g2, L, o / 1.18); g2.restore(); }
  });
  g.save(); g.translate(x, y); metti(g, sp, k); g.restore();
};

})();

/* ── client/sangue.js ── */
/* DEAD PEAK MEAT — sangue ed effetti.
   Il sangue che resta sta su UNA tela per stanza (mezza risoluzione): ogni goccia che
   tocca una superficie si timbra li' e muore. Il disegno per fotogramma e' un
   drawImage per stanza visibile, qualunque sia la quantita' di sangue: il costo NON
   cresce col tempo. Le particelle vivono in pool fissi (niente allocazioni).
   Intensita': 2 alto · 1 medio · 0 niente. */
(function(){
var DPM = globalThis.DPM, A = DPM.ARTE, PAL = A.PAL, TAU = Math.PI * 2;
var SG = DPM.SANGUE = { liv:2 };
var L, S, tele = [], splats = [], gibSpr = [];

function creaSplat(seed, sz) {
  var R = DPM.rng(seed), c = A.tela(sz, sz), g = c.getContext('2d'), cx = sz / 2, cy = sz / 2, r = sz * 0.22;
  function blob(col, k) {
    g.fillStyle = col; g.beginPath();
    var n = 14;
    for (var i = 0; i <= n; i++) { var a = i / n * TAU, rr = r * k * (0.75 + R() * 0.45); var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.fill();
  }
  var R0 = DPM.rng(seed); R = R0; blob(PAL.bloodD, 1.12); R = DPM.rng(seed); blob(PAL.blood, 1.0);
  R = DPM.rng(seed * 3 + 1);
  for (var j = 0; j < 7; j++) {   // gocce satellite
    var a = R() * TAU, d = r * (1.2 + R() * 0.9), s = r * (0.08 + R() * 0.2);
    g.fillStyle = PAL.bloodD; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s * 1.25, 0, TAU); g.fill();
    g.fillStyle = PAL.blood; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, 0, TAU); g.fill();
  }
  g.fillStyle = 'rgba(255,150,150,0.8)'; g.beginPath(); g.ellipse(cx - r * 0.3, cy - r * 0.35, r * 0.25, r * 0.1, -0.5, 0, TAU); g.fill();
  return c;
}
function creaGib(seed, sz) {
  var R = DPM.rng(seed), c = A.tela(sz, sz), g = c.getContext('2d'), cx = sz / 2, cy = sz / 2, r = sz * 0.3;
  var pts = [], n = 5 + Math.floor(R() * 3);
  for (var i = 0; i < n; i++) { var a = i / n * TAU + R() * 0.4, rr = r * (0.6 + R() * 0.45); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  g.lineJoin = 'round';
  g.beginPath(); pts.forEach(function (p, k) { if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath();
  g.fillStyle = PAL.meat; g.fill(); g.strokeStyle = PAL.ink; g.lineWidth = sz * 0.08; g.stroke();
  g.save(); g.clip(); g.fillStyle = PAL.meatS; g.fillRect(cx, cy - r, r * 1.5, r * 2.2);
  if (R() < 0.5) { g.fillStyle = PAL.marb; g.beginPath(); g.ellipse(cx - r * 0.2, cy - r * 0.1, r * 0.35, r * 0.13, R() * 3, 0, TAU); g.fill(); }
  else { g.fillStyle = '#f3eadc'; g.beginPath(); g.ellipse(cx, cy, r * 0.5, r * 0.12, R() * 3, 0, TAU); g.fill(); }
  g.restore();
  return c;
}

SG.init = function (livello, scala, cotture) {
  L = livello; S = scala; tele = [];
  splats = []; for (var i = 0; i < 10; i++) splats.push(creaSplat(101 + i * 17, 48));
  gibSpr = []; for (var j = 0; j < 8; j++) gibSpr.push(creaGib(501 + j * 23, 40));
  var Sb = S / 2;
  cotture.forEach(function (ck, k) {
    var cv = A.tela(Math.round(L.W * Sb), Math.round((ck.y1 - ck.y0) * Sb));
    // traccia delle superfici: rettangoli fusi per riga (clip economico)
    var M = L.M, path = new Path2D(), cy, cx;
    for (cy = Math.max(0, ck.y0); cy < Math.min(M.H, ck.y1); cy++) {
      cx = 0;
      while (cx < L.W) {
        var t = M.t[cy * L.W + cx];
        if (t === 1) { var c0 = cx; while (cx < L.W && M.t[cy * L.W + cx] === 1) cx++; path.rect(c0 * Sb - 1, (ck.y1 - cy - 1) * Sb - 1, (cx - c0) * Sb + 2, Sb + 2); }
        else if (t === 2) { var c1 = cx; while (cx < L.W && M.t[cy * L.W + cx] === 2) cx++; path.rect(c1 * Sb - 1, (ck.y1 - cy - 1) * Sb - 1, (cx - c1) * Sb + 2, Sb * 0.32 + 2); }
        else cx++;
      }
    }
    tele.push({ cv:cv, g:cv.getContext('2d'), y0:ck.y0, y1:ck.y1, path:path });
  });
};
function telaDi(y) { for (var i = 0; i < tele.length; i++) if (y >= tele[i].y0 + 1 && y < tele[i].y1 - 1) return tele[i]; for (var j = 0; j < tele.length; j++) if (y >= tele[j].y0 && y < tele[j].y1) return tele[j]; return null; }
SG.tele = function () { return tele; };

/* timbro diretto sulla superficie (con clip alle superfici) */
function timbra(x, y, r, ang, allunga, clip) {
  var tl = telaDi(y); if (!tl) return;
  var Sb = S / 2, g = tl.g, px = x * Sb, py = (tl.y1 - y) * Sb, sp = splats[(Math.random() * splats.length) | 0], sz = r * Sb * 2.6;
  g.save();
  if (clip !== false) g.clip(tl.path);
  g.translate(px, py); g.rotate(ang || Math.random() * TAU); g.scale(allunga || 1, 1);
  g.drawImage(sp, -sz / 2, -sz / 2, sz, sz);
  g.restore();
}
SG.timbra = timbra;
SG.striscia = function (x, y, dx, dy, larg) {   // strisciata (scia su muro/pavimento)
  if (SG.liv === 0) return;
  var tl = telaDi(y); if (!tl) return;
  var Sb = S / 2, g = tl.g;
  g.save(); g.clip(tl.path);
  g.strokeStyle = PAL.blood; g.lineCap = 'round'; g.lineWidth = larg * Sb;
  g.beginPath(); g.moveTo(x * Sb, (tl.y1 - y) * Sb); g.lineTo((x + dx) * Sb, (tl.y1 - y - dy) * Sb); g.stroke();
  g.strokeStyle = PAL.bloodD; g.lineWidth = larg * Sb * 0.35; g.globalAlpha = 0.6; g.stroke();
  g.restore();
};

/* ---------- pool di particelle ----------
   tipo: 1 goccia di sangue · 2 scintilla · 3 sbuffo di polvere (a fumetto) · 4 fumo ·
   5 brace · 6 detrito · 7 anello d'urto · 8 pezzo di carne · 9 casco che vola */
var N = 900;
var P = { t:new Uint8Array(N), x:new Float32Array(N), y:new Float32Array(N), vx:new Float32Array(N), vy:new Float32Array(N),
  vita:new Float32Array(N), max:new Float32Array(N), s:new Float32Array(N), a:new Float32Array(N), va:new Float32Array(N), k:new Uint8Array(N), rimb:new Uint8Array(N) };
SG.P = P; var libero = 0;
SG.caschi = []; SG.gibLook = [];
// pezzi del corpo del colore del giocatore (A.gib del corpo nuovo), in cache per look
var gibCache = {};
function gibDi(look, k) {
  if (!look || !A.gib || !look.nome) return gibSpr[k];
  var key = (look.id != null ? look.id : look.nome) + '_' + k; if (!gibCache[key]) gibCache[key] = A.gib(look, 501 + k * 23, 40);   // COSMETICI v2: stessa tinta, cappelli diversi
  return gibCache[key];
}
function nuova(tipo, x, y, vx, vy, vita, s) {
  for (var n = 0; n < N; n++) {
    var i = (libero + n) % N;
    if (P.t[i] === 0) { libero = i + 1; P.t[i] = tipo; P.x[i] = x; P.y[i] = y; P.vx[i] = vx; P.vy[i] = vy; P.vita[i] = 0; P.max[i] = vita; P.s[i] = s; P.a[i] = Math.random() * TAU; P.va[i] = 0; P.k[i] = 0; P.rimb[i] = 0; return i; }
  }
  return -1;
}
SG.nuova = nuova;
SG.conta = function () { var c = 0; for (var i = 0; i < N; i++) if (P.t[i]) c++; return c; };

SG.schizzo = function (x, y, n, vx, vy, forza) {
  if (SG.liv === 0) return;
  n = Math.round(n * (SG.liv === 2 ? 1 : 0.4));
  for (var i = 0; i < n; i++) {
    var a = Math.random() * TAU, v = forza * (0.3 + Math.random() * 0.9);
    nuova(1, x, y, vx * 0.35 + Math.cos(a) * v, vy * 0.35 + Math.sin(a) * v + forza * 0.25, 3, 0.12 + Math.random() * 0.22);
  }
};
SG.scintille = function (x, y, n, dx, dy, v) {
  for (var i = 0; i < n; i++) { var a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.4, s = v * (0.5 + Math.random()); nuova(2, x, y, Math.cos(a) * s, Math.sin(a) * s, 0.18 + Math.random() * 0.25, 1); }
};
SG.polvere = function (x, y, n, dirx, forza) {
  for (var i = 0; i < n; i++) nuova(3, x + (Math.random() - 0.5) * 0.4, y + 0.1, dirx * (0.5 + Math.random()) * forza + (Math.random() - 0.5) * 2, Math.random() * 1.5, 0.3 + Math.random() * 0.2, 0.12 + Math.random() * 0.11);
};
SG.fumo = function (x, y, n, s) { for (var i = 0; i < n; i++) nuova(4, x + (Math.random() - 0.5) * 0.3, y, (Math.random() - 0.5) * 1.2, 0.8 + Math.random(), 0.7 + Math.random() * 0.5, s || 0.3); };
SG.brace = function (x, y, n) { for (var i = 0; i < n; i++) nuova(5, x + (Math.random() - 0.5) * 1.5, y, (Math.random() - 0.5) * 1.5, 1.5 + Math.random() * 2.5, 0.8 + Math.random() * 0.8, 0.05 + Math.random() * 0.05); };
SG.detriti = function (x, y, n, forza, col) { for (var i = 0; i < n; i++) { var j = nuova(6, x + (Math.random() - 0.5) * 0.6, y + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * forza, Math.random() * forza * 0.8, 1.2, 0.1 + Math.random() * 0.12); if (j >= 0) { P.va[j] = (Math.random() - 0.5) * 20; P.k[j] = col || 0; } } };
SG.anello = function (x, y, r, col) { var j = nuova(7, x, y, 0, 0, 0.28, r); if (j >= 0) P.k[j] = col || 0; };

/* morte: il corpo esplode in gocce, pezzi di carne e il casco che vola */
SG.morte = function (x, y, vx, vy, causa, look) {
  var colore = look && look.col ? look.col : look;
  var liv = SG.liv;
  SG.anello(x, y, 1.6, 1);
  var casco = nuova(9, x, y + 0.4, vx * 0.3 + (Math.random() - 0.5) * 6, 9 + Math.random() * 4, 6, 0.4);
  if (casco >= 0) { P.va[casco] = (Math.random() - 0.5) * 22; SG.caschi[casco] = look; }
  if (liv === 0) { SG.fumo(x, y, 10, 0.5); SG.polvere(x, y - 0.3, 8, 0, 3); return; }
  if (look && look.mo && A.morteStile) { A.morteStile(SG, x, y, vx, vy, look, liv); return; }   // COSMETICI v2: morte a tema
  SG.schizzo(x, y, 70, vx, vy, 9);
  var ng = liv === 2 ? 9 : 4;
  for (var i = 0; i < ng; i++) {
    var a = Math.random() * TAU, v = 5 + Math.random() * 7;
    var j = nuova(8, x, y, Math.cos(a) * v + vx * 0.3, Math.sin(a) * v + 4, 5, 0.26 + Math.random() * 0.2);
    if (j >= 0) { P.va[j] = (Math.random() - 0.5) * 25; P.k[j] = (Math.random() * gibSpr.length) | 0; SG.gibLook[j] = look; }
  }
  // macchia grande dove e' successo
  timbra(x, y, 1.1, 0, 1, true);
};

var M = null;
SG.aggiorna = function (dt, livello, lavaY) {
  M = livello.M;
  for (var i = 0; i < N; i++) {
    var t = P.t[i]; if (!t) continue;
    P.vita[i] += dt;
    if (P.vita[i] >= P.max[i]) {
      if (t === 8 && SG.liv > 0) {   // il pezzo resta: timbrato sulla tela senza clip
        stampaGib(i);
      }
      P.t[i] = 0; continue;
    }
    var x = P.x[i], y = P.y[i];
    if (t === 1) {
      P.vy[i] -= 30 * dt;
      var nx = x + P.vx[i] * dt, ny = y + P.vy[i] * dt;
      if (M.solido(Math.floor(nx), Math.floor(ny)) || (P.vy[i] < 0 && M.unavia(Math.floor(nx), Math.floor(ny)) && (ny - Math.floor(ny)) > 0.7)) {
        var v = Math.hypot(P.vx[i], P.vy[i]);
        timbra(nx, ny, P.s[i] * (0.8 + Math.min(1.6, v * 0.08)), Math.atan2(P.vy[i], P.vx[i]), 1 + Math.min(1.8, v * 0.06));
        P.t[i] = 0; continue;
      }
      if (ny < lavaY) { P.t[i] = 0; continue; }
      P.x[i] = nx; P.y[i] = ny;
    } else if (t === 2) {
      P.vy[i] -= 20 * dt; P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt;
    } else if (t === 3) {
      P.vx[i] *= (1 - 4 * dt); P.vy[i] *= (1 - 3 * dt); P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt;
    } else if (t === 4) {
      P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt; P.vx[i] *= (1 - dt);
    } else if (t === 5) {
      P.x[i] += P.vx[i] * dt + Math.sin(P.vita[i] * 6 + i) * dt * 0.6; P.y[i] += P.vy[i] * dt;
    } else if (t === 6 || t === 8 || t === 9 || t === 10) {   // 10 = pezzetto cosmetico (morte a tema)
      P.vy[i] -= 32 * dt; P.a[i] += P.va[i] * dt;
      var nx2 = x + P.vx[i] * dt, ny2 = y + P.vy[i] * dt;
      if (M.solido(Math.floor(nx2), Math.floor(y))) { P.vx[i] *= -0.45; nx2 = x; P.va[i] *= -0.6; if (t === 8) { timbra(x, y, 0.3, 0, 1); } }
      if (M.solido(Math.floor(nx2), Math.floor(ny2)) || (P.vy[i] < 0 && M.unavia(Math.floor(nx2), Math.floor(ny2)) && ny2 - Math.floor(ny2) > 0.72)) {
        if (t === 8 && Math.abs(P.vy[i]) > 3) timbra(nx2, ny2, 0.35, Math.atan2(P.vy[i], P.vx[i]), 1.5);
        P.vy[i] *= -0.32; P.vx[i] *= 0.6; P.va[i] *= 0.5; ny2 = y; P.rimb[i]++;
        if (Math.abs(P.vy[i]) < 1.2 && P.rimb[i] > 1) { P.vy[i] = 0; P.vx[i] *= 0.8; if (t === 8 && P.max[i] - P.vita[i] > 0.9) P.max[i] = P.vita[i] + 0.9; }
      }
      if (ny2 < lavaY) { P.t[i] = 0; continue; }
      P.x[i] = nx2; P.y[i] = ny2;
    }
  }
};
function stampaGib(i) {
  var tl = telaDi(P.y[i]); if (!tl) return;
  var Sb = S / 2, sz = P.s[i] * Sb * 2.2;
  tl.g.save(); tl.g.translate(P.x[i] * Sb, (tl.y1 - P.y[i]) * Sb); tl.g.rotate(P.a[i]);
  tl.g.drawImage(gibDi(SG.gibLook[i], P.k[i]), -sz / 2, -sz / 2, sz, sz); tl.g.restore();
}

SG.disegnaTele = function (g, V) {
  var Sb = S / 2;
  for (var i = 0; i < tele.length; i++) {
    var tl = tele[i];
    if (tl.y0 > V.yT + 1 || tl.y1 < V.yB - 1) continue;
    // GIRO 2: solo la parte a schermo (la tela e' larga 23 colonne, se ne vedono 15)
    var ya = Math.min(tl.y1, V.yT + 0.5), yb = Math.max(tl.y0, V.yB - 0.5), xa = Math.max(0, Math.floor(V.x0) - 1), xb = Math.min(L.W, Math.ceil((V.x1 || L.W)) + 1);
    if (ya <= yb || xb <= xa) continue;
    var sx0 = xa * Sb, sy0 = (tl.y1 - ya) * Sb, sw = (xb - xa) * Sb, sh = (ya - yb) * Sb;
    g.drawImage(tl.cv, sx0, sy0, sw, sh, V.sx(xa), V.sy(ya), (xb - xa) * V.S, (ya - yb) * V.S);
  }
};
SG.disegnaParticelle = function (g, V) {
  var s = V.S, i, t;
  // scintille e braci (additive)
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  g.strokeStyle = '#ffd36a'; g.lineWidth = Math.max(1.5, s * 0.06); g.beginPath();
  for (i = 0; i < N; i++) { if (P.t[i] !== 2) continue; var x = V.sx(P.x[i]), y = V.sy(P.y[i]); g.moveTo(x, y); g.lineTo(x - P.vx[i] * s * 0.025, y + P.vy[i] * s * 0.025); }
  g.stroke();
  g.fillStyle = '#ff9a3a';
  for (i = 0; i < N; i++) { if (P.t[i] !== 5) continue; var f = 1 - P.vita[i] / P.max[i]; g.globalAlpha = f; g.beginPath(); g.arc(V.sx(P.x[i]), V.sy(P.y[i]), P.s[i] * s, 0, TAU); g.fill(); }
  g.restore();
  // fumo
  for (i = 0; i < N; i++) {
    if (P.t[i] !== 4) continue; var u = P.vita[i] / P.max[i];
    g.globalAlpha = 0.45 * (1 - u); g.fillStyle = '#8a7c74'; g.beginPath(); g.arc(V.sx(P.x[i]), V.sy(P.y[i]), (P.s[i] + u * 0.5) * s, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  // sbuffi a fumetto: cerchio con contorno
  for (i = 0; i < N; i++) {
    if (P.t[i] !== 3) continue; var u2 = P.vita[i] / P.max[i], r = (P.s[i] * (0.6 + u2 * 0.9)) * s, x3 = V.sx(P.x[i]), y3 = V.sy(P.y[i]);
    g.globalAlpha = 1 - u2 * u2; g.fillStyle = PAL.ink; g.beginPath(); g.arc(x3, y3, r + s * 0.05, 0, TAU); g.fill();
    g.fillStyle = '#f4ead8'; g.beginPath(); g.arc(x3, y3, r, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  // gocce in volo
  g.fillStyle = PAL.blood;
  for (i = 0; i < N; i++) { if (P.t[i] !== 1) continue; var r2 = P.s[i] * s * 0.55; g.beginPath(); g.ellipse(V.sx(P.x[i]), V.sy(P.y[i]), r2 * 1.4, r2, -Math.atan2(P.vy[i], P.vx[i]), 0, TAU); g.fill(); }
  // detriti
  for (i = 0; i < N; i++) {
    if (P.t[i] !== 6) continue; var sz = P.s[i] * s;
    g.save(); g.translate(V.sx(P.x[i]), V.sy(P.y[i])); g.rotate(P.a[i]);
    g.fillStyle = PAL.ink; g.fillRect(-sz * 0.6, -sz * 0.6, sz * 1.2, sz * 1.2);
    g.fillStyle = P.k[i] === 1 ? PAL.wood : (P.k[i] === 2 ? '#8a8f90' : PAL.crumb); g.fillRect(-sz * 0.4, -sz * 0.4, sz * 0.8, sz * 0.8);
    g.restore();
  }
  if (A.disegnaCosmetici) A.disegnaCosmetici(g, V, P, N, SG);   // COSMETICI v2: pezzetti tipo 10
  // pezzi di carne e caschi
  for (i = 0; i < N; i++) {
    if (P.t[i] === 8) { var sz2 = P.s[i] * s * 2.2; g.save(); g.translate(V.sx(P.x[i]), V.sy(P.y[i])); g.rotate(P.a[i]); g.drawImage(gibDi(SG.gibLook[i], P.k[i]), -sz2 / 2, -sz2 / 2, sz2, sz2); g.restore(); }
    else if (P.t[i] === 9) {
      var fade = Math.min(1, (P.max[i] - P.vita[i]) / 0.6);
      g.save(); g.globalAlpha = fade; g.translate(V.sx(P.x[i]), V.sy(P.y[i])); g.rotate(P.a[i]);
      var lk = SG.caschi[i];
      if (lk && lk.nome && A.cappelloVolante) { g.restore(); g.save(); g.globalAlpha = fade; A.cappelloVolante(g, lk, V.sx(P.x[i]), V.sy(P.y[i]), P.a[i], s); g.restore(); }
      else {
        var col = (lk && lk.col) || lk || PAL.yel;
        g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(0, 0, s * 0.42, s * 0.34, 0, Math.PI, 0); g.lineTo(s * 0.5, s * 0.05); g.lineTo(-s * 0.5, s * 0.05); g.closePath(); g.fill();
        g.fillStyle = col; g.beginPath(); g.ellipse(0, -s * 0.02, s * 0.33, s * 0.26, 0, Math.PI, 0); g.closePath(); g.fill();
        g.restore();
      }
    }
    else if (P.t[i] === 7) {
      var u3 = P.vita[i] / P.max[i];
      g.strokeStyle = P.k[i] === 1 ? 'rgba(255,255,255,' + (1 - u3) + ')' : 'rgba(255,200,90,' + (1 - u3) + ')';
      g.lineWidth = s * 0.25 * (1 - u3); g.beginPath(); g.arc(V.sx(P.x[i]), V.sy(P.y[i]), P.s[i] * s * (0.3 + u3), 0, TAU); g.stroke();
    }
  }
};
})();

/* ── client/look.js ── */
/* DEAD PEAK MEAT — LOOK API (15/09/2026): colore + cappello + occhi dei fagiolotti.
   Contratto per il cantiere dei cosmetici (vedi LOOK_API.md). Tutto qui, nessun altro file da toccare:
   - DPM.LOOK_API.COLORI   [{id, nome, col}]            i colori del corpo (id stabile, 'giallo'...)
   - DPM.LOOK_API.CAPPELLI [{id, nome, hat}]            i cappelli ('nessuno' = senza)
   - DPM.LOOK_API.OCCHI    [{id, nome}]                  gli stili degli occhi ('tondi' di serie)
   - DPM.LOOK_API.crea({colore, cappello, occhi})         -> oggetto look pronto per il disegno
         colore: id di COLORI oppure '#rrggbb' libero · cappello: id · occhi: id (valori ignoti -> di serie)
   - DPM.LOOK_API.daProfilo(profilo, seggio, uid)        -> look di un giocatore dal profilo del server
         legge profilo.dp2 = {c, h, o} (c = id colore o '#rrggbb', h = id cappello, o = id occhi);
         senza dp2 ripiega sul colore del seggio (come oggi) e, se c'e', su profilo.scl.bodyCol / bodyCol.
   - DPM.LOOK_API.anteprima(canvas, look, opzioni)       disegna il personaggio fermo (negozio/editor)
   Un look ostile vale al piu' un cosmetico: nessun valore entra nel motore (il server non li legge). */
(function(){
var DPM = globalThis.DPM, A = DPM.ARTE;
function hex(c) { return /^#[0-9a-fA-F]{6}$/.test(String(c || '')); }
function mix(c, t, k) {   // c verso t (0..1)
  var a = parseInt(c.slice(1), 16), b = parseInt(t.slice(1), 16);
  var r = Math.round(((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k), gg = Math.round(((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k), bl = Math.round((a & 255) * (1 - k) + (b & 255) * k);
  return '#' + ((1 << 24) + (r << 16) + (gg << 8) + bl).toString(16).slice(1);
}
var BASE = A.LOOK;   // i 10 look dello slice (colore + cappello abbinati)
var COLORI = BASE.map(function (l) { return { id:l.nome.toLowerCase(), nome:l.nome, col:l.col, colS:l.colS, colL:l.colL }; });
var CAPPELLI = BASE.map(function (l) { return { id:l.cappello, nome:l.cappello.toUpperCase(), hat:l.hat, hatS:l.hatS, hatL:l.hatL, decor:l.decor }; });
var OCCHI = [{ id:'tondi', nome:'TONDI' }, { id:'grandi', nome:'GRANDI' }, { id:'furbi', nome:'FURBI' }, { id:'ciglia', nome:'CIGLIA' }, { id:'occhiali', nome:'OCCHIALI' }];
function trova(lista, id) { for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; return null; }
var cache = {};
function crea(o) {
  o = o || {};
  var colore = o.colore, cp = trova(CAPPELLI, o.cappello) || CAPPELLI[0], oc = trova(OCCHI, o.occhi) || OCCHI[0];
  var c = hex(colore) ? { id:String(colore).toLowerCase(), nome:'', col:String(colore).toLowerCase() } : (trova(COLORI, colore) || COLORI[0]);
  var id = 'L|' + c.id + '|' + cp.id + '|' + oc.id;
  if (cache[id]) return cache[id];
  var col = c.col;
  var lk = { id:id, nome:c.nome || 'SCALATORE', col:col, colS:c.colS || mix(col, '#1b1020', 0.32), colL:c.colL || mix(col, '#ffffff', 0.48),
    cappello:cp.id, hat:cp.hat, hatS:cp.hatS, hatL:cp.hatL, decor:cp.decor || 'cintura', occhi:oc.id };
  cache[id] = lk;
  return lk;
}
function daProfilo(pr, seggio, uid) {
  var base = BASE[((seggio | 0) % BASE.length + BASE.length) % BASE.length];
  var d = pr && typeof pr === 'object' ? pr.dp2 : null;
  if (d && typeof d === 'object' && (d.c || d.h || d.o)) return crea({ colore: d.c || base.nome.toLowerCase(), cappello: d.h || base.cappello, occhi: d.o || 'tondi' });
  var bc = pr && (pr.bodyCol || (pr.scl && pr.scl.bodyCol));
  if (hex(bc)) return crea({ colore: bc, cappello: base.cappello });
  return crea({ colore: base.nome.toLowerCase(), cappello: base.cappello });
}
function anteprima(canvas, look, op) {
  op = op || {};
  var g = canvas.getContext('2d'), w = canvas.width, h = canvas.height, S = op.S || Math.min(w, h) * 0.42;
  g.clearRect(0, 0, w, h);
  var an = A.nuovaAnim(), c = { id:0, p:{ x:0, y:0, vx:0, vy:0, grounded:true, wallside:0, stun:0, skidT:0, wjLock:0, face:1 }, vivo:true, catT:0, ogg:0 };
  an.t = op.t || 0; an.blink = 9;
  A.animaPasso(an, c, 1 / 60, { pericolo:0, guardaX:null, guardaY:null, stordito:false, oggetto:0 });
  A.corpo(g, c, an, w / 2, h * 0.86, S, 1, look);
}
DPM.LOOK_API = { COLORI:COLORI, CAPPELLI:CAPPELLI, OCCHI:OCCHI, crea:crea, daProfilo:daProfilo, anteprima:anteprima, VERSIONE:'20260915a' };
DPM.LOOK_DA_PROFILO = daProfilo;
})();

/* ── cosmetici/dpk_cosmetici.js ── */
/* DEAD PEAK — COSMETICI v2 del fagiolotto (15/09/2026; 19/09: sul Dead Peak ONLINE, campo `ol` = stile
   degli occhi di LOOK_API, profilo `dpk` o `dp2`).
   Si carica DOPO arte_base.js, arte_corpo.js (con gli agganci di applica_dp.py) e sangue.js.
   Tutto e' disegno: niente tocca fisica, sagoma di collisione, nomi o frecce.

   IL LOOK (dp_look, dal backend, solo indici):
     co tinta (0 AUTO = colore del posto, 1-10 = i 10 colori)  · ca cappello (0 AUTO, 1 nessuno,
     2-10 i 9 cappelli di serie, 11-18 premium) · oc occhi (0-3 liberi, 4-9 premium) ·
     de decoro (0 AUTO, 1-4 liberi, 5-10 premium) · fi finitura (0-1, 2-4) · sc scia (0-1, 2-6) ·
     mo morte (0 sangue, 1-5) · ri rinascita (0, 1-4) · em esultanza (0, 1-4)

   LEGGIBILITA' (regola dura): la TINTA e' unica nella partita. DPK.tinte() la assegna in
   ordine di posto: chi chiede un colore gia' preso riceve il primo libero. Il nome e la
   freccia del gioco non cambiano. Nessuna opzione rende il corpo piu' piccolo, trasparente
   o del colore del fondo.

   API
     DPK.norm(look)                 -> look pulito (interi nei range)
     DPK.tinte([{seat, co}, ...])   -> [indice tinta 0-9 per ciascuno, stesso ordine]
     DPK.risolvi(look, tinta)       -> oggetto look per A.corpo / A.icona / SG.morte (in cache)
     DPK.NOMI[campo][i]             -> [IT, EN]
*/
(function(){
var DPM = globalThis.DPM, A = DPM.ARTE, K = A.KIT, TAU = Math.PI * 2;
var INK = K.INK, ellisse = K.ellisse, cupola = K.cupola, disegnaParti = K.disegnaParti, luce = K.luce, pathCorpo = K.pathCorpo;
var DPK = DPM.COSMETICI = {};

var MAX = { co:10, ca:18, oc:9, de:10, fi:4, sc:6, mo:5, ri:4, em:4, ol:4 };   // = cosmetics_common.DPK_IDX_MAX
DPK.MAX = MAX;
DPK.CAMPI = ['co', 'ca', 'oc', 'de', 'fi', 'sc', 'mo', 'ri', 'em', 'ol'];
DPK.FREE = { co:[0,1,2,3,4,5,6,7,8,9,10], ca:[0,1,2,3,4,5,6,7,8,9,10], oc:[0,1,2,3], de:[0,1,2,3,4], fi:[0,1], sc:[0,1], mo:[0], ri:[0], em:[0], ol:[0,1,2,3,4] };
DPK.NOMI = {
  co:[['AUTO','AUTO'],['GIALLO','YELLOW'],['VERDE','GREEN'],['ROSSO','RED'],['VIOLA','PURPLE'],['BLU','BLUE'],['ARANCIO','ORANGE'],['ROSA','PINK'],['CIANO','CYAN'],['BIANCO','WHITE'],['ANTRACITE','CHARCOAL']],
  ca:[['AUTO','AUTO'],['NESSUNO','NONE'],['ARRAMPICATA','CLIMBING'],['MILITARE','ARMY'],['CANTIERE','HARD HAT'],['VISIERA','VISOR'],['MINATORE','MINER'],['LANA','BEANIE'],['AVIATORE','AVIATOR'],['ALPINO','ALPINE'],['BANDANA','BANDANA'],['CASCHETTO CHIODATO','SPIKED HELMET'],['CAPPUCCIO','HOOD'],['PON-PON GIGANTE','GIANT BOBBLE'],['CUFFIA DA MACELLAIO','BUTCHER CAP'],['CASCO NEON','NEON HELMET'],['COLBACCO','FUR HAT'],['CILINDRO','TOP HAT'],['CORONA DI GHIACCIO','ICE CROWN']],
  oc:[['NIENTE','NONE'],['CIGLIA LUNGHE','LONG LASHES'],['SOPRACCIGLIA','BROWS'],['LENTIGGINI','FRECKLES'],['BENDA','EYEPATCH'],['OCCHIAIE','DARK CIRCLES'],['IRIDI NEON','NEON IRISES'],['MONOCOLO','MONOCLE'],["PUPILLE D'ORO",'GOLD PUPILS'],['CICATRICE','SCAR']],
  de:[['AUTO','AUTO'],['CINTURA','BELT'],['IMBRAGO X','X HARNESS'],['CORDA','ROPE'],['ZIP','ZIP'],['MOSCHETTONI','CARABINERS'],['TOPPE','PATCHES'],['PIUMINO','PUFFER'],['GREMBIULE','APRON'],['PELLICCIA','FUR COLLAR'],["FASCIA D'ORO",'GOLD SASH']],
  fi:[['LUCIDA','GLOSSY'],['OPACA','MATTE'],['NEON','NEON'],['METALLO','METAL'],['ORO','GOLD']],
  sc:[['SAGOMA','SILHOUETTE'],['PUNTINI','DOTS'],['STELLINE','STARS'],['BOLLE','BUBBLES'],['FULMINI','BOLTS'],['FIAMME BLU','BLUE FLAMES'],['ARCOBALENO','RAINBOW']],
  mo:[['SANGUE','BLOOD'],['GELATINA','JELLY'],['CORIANDOLI','CONFETTI'],['OSSA','BONES'],['GHIACCIO','ICE'],["MONETE D'ORO",'GOLD COINS']],
  ri:[['SBUFFO','PUFF'],['ANELLO DI STELLE','STAR RING'],['LAPIDE','TOMBSTONE'],['FULMINE','LIGHTNING'],['FUOCHI','FIREWORKS']],
  em:[['SALTELLI','HOPS'],['PIROETTA','SPIN'],['BALLETTO','DANCE'],['MUSCOLI','FLEX'],['INCHINO','BOW']],
  ol:[['TONDI','ROUND'],['GRANDI','BIG'],['FURBI','SLY'],['CIGLIA','LASHES'],['OCCHIALI','GLASSES']]   // 19/09: stile occhi del gioco nuovo (LOOK_API)
};

DPK.norm = function (l) {
  l = l || {};
  var o = {}, f, v;
  for (var i = 0; i < DPK.CAMPI.length; i++) {
    f = DPK.CAMPI[i]; v = l[f];
    v = (typeof v === 'number' || typeof v === 'string') ? (v | 0) : 0;
    o[f] = (v < 0 || v > MAX[f]) ? 0 : v;
  }
  return o;
};

/* tinta unica: in ordine di posto, chi chiede un colore libero lo prende; gli altri il primo libero
   partendo dal proprio posto. Deterministico: tutti i client vedono le stesse tinte. */
DPK.tinte = function (lista) {
  var preso = [], out = new Array(lista.length), ordine = lista.map(function (x, i) { return i; });
  ordine.sort(function (a, b) { return (lista[a].seat | 0) - (lista[b].seat | 0) || a - b; });
  ordine.forEach(function (i) {
    var co = lista[i].co | 0;
    if (co >= 1 && co <= 10 && !preso[co - 1]) { preso[co - 1] = 1; out[i] = co - 1; } else out[i] = -1;
  });
  ordine.forEach(function (i) {
    if (out[i] >= 0) return;
    var s = ((lista[i].seat | 0) % 10 + 10) % 10;
    for (var k = 0; k < 10; k++) { var t = (s + k) % 10; if (!preso[t]) { preso[t] = 1; out[i] = t; return; } }
    out[i] = s;   // piu' di 10 giocatori: impossibile oggi (Dead Peak ne ha al massimo 10)
  });
  return out;
};

var CAP_DI_SERIE = [null, null, 0, 1, 3, 4, 5, 6, 7, 8, 9];   // ca 2..10 -> indice di A.LOOK col suo cappello
var CAP_PREMIUM = { 11:'chiodato', 12:'cappuccio', 13:'ponpon', 14:'macellaio', 15:'neon', 16:'colbacco', 17:'cilindro', 18:'corona' };
var COL_PREMIUM = {
  chiodato:  ['#8d97a1', '#5d666f', '#c4ccd3'],
  cappuccio: ['#6b5140', '#46342a', '#957462'],
  ponpon:    ['#d9433a', '#9d2a24', '#ff8a7a'],
  macellaio: ['#f2f0ea', '#bdb8ac', '#ffffff'],
  neon:      ['#263246', '#171f2c', '#3f5270'],
  colbacco:  ['#7a553a', '#523621', '#a67b58'],
  cilindro:  ['#2c2c35', '#18181e', '#4a4a57'],
  corona:    ['#bfe9ff', '#6fb7da', '#ffffff']
};
var DECOR = [null, 'cintura', 'x', 'corda', 'zip', 'moschettoni', 'toppe', 'piumino', 'grembiule', 'pelliccia', 'fascia'];
var CACHE = {};
var PUPILLA = { 6:'#0a8fb0', 8:'#b37a07' };
// tabelle esposte per la wave 2 (dpk_cosmetici_w2.js le allunga; gli indici di oggi non cambiano)
DPK._CAP = CAP_PREMIUM; DPK._COLCAP = COL_PREMIUM; DPK._DECOR = DECOR; DPK._PUPILLA = PUPILLA;

DPK.risolvi = function (look, tinta) {
  var d = DPK.norm(look), t = ((tinta | 0) % 10 + 10) % 10;
  var key = 'k' + t + '.' + d.ca + '.' + d.de + '.' + d.oc + '.' + d.fi + '.' + d.sc + '.' + d.mo + '.' + d.ri + '.' + d.em + '.' + d.ol;
  var hit = CACHE[key];
  if (hit) return hit;
  var base = A.LOOK[t], L = {};
  for (var k in base) L[k] = base[k];
  L.id = key; L.tinta = t;
  if (d.ca === 1) L.cappello = 'nessuno';
  else if (d.ca >= 2 && d.ca <= 10) { var s = A.LOOK[CAP_DI_SERIE[d.ca]]; L.cappello = s.cappello; L.hat = s.hat; L.hatS = s.hatS; L.hatL = s.hatL; }
  else if (d.ca >= 11) { var nm = CAP_PREMIUM[d.ca], c = COL_PREMIUM[nm]; L.cappello = nm; L.hat = c[0]; L.hatS = c[1]; L.hatL = c[2]; }
  if (d.de >= 1) L.decor = DECOR[d.de];
  // il rotolo di corda del ROSSO ha bisogno di un colore di corda anche senza cappello di serie
  if (L.decor === 'corda' && L.cappello !== 'nessuno' && d.ca !== 0) { L.cordaCol = '#d9b26e'; }
  L.oc = d.oc; L.fi = d.fi; L.sc = d.sc; L.mo = d.mo; L.ri = d.ri; L.em = d.em;
  L.pupilla = PUPILLA[d.oc] || null;
  L.occhi = DP2_OCCHI[d.ol] || 'tondi';   // 19/09: stile degli occhi del Dead Peak nuovo (arte_corpo stileOcchi)
  if (Object.keys(CACHE).length > 300) CACHE = {};
  CACHE[key] = L;
  return L;
};

/* tinta nuova piu' vicina a un colore libero vecchio (bodyCol) — stesso conto di cosmetici_v2.tinta_vicina */
var TINTE_HEX = ['#f7c531', '#5fc93a', '#ea4038', '#9d5ee6', '#2f8fea', '#ff8a1f', '#ff7fb8', '#36d3d6', '#e8ecef', '#555b69'];
DPK.tintaVicina = function (hex) {
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return 0;
  var scl = {'#f87171':3,'#38bdf8':5,'#a3e635':2,'#facc15':1,'#c084fc':4,'#fb923c':6,'#2dd4bf':8,'#f472b6':7,'#e5e7eb':9,'#94a3b8':10}[hex.toLowerCase()]; if (scl) return scl;   // i 10 colori dell'editor vecchio: stesso nome
  var r = parseInt(hex.substr(1, 2), 16), g2 = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16), best = 0, bd = -1;
  for (var i = 0; i < 10; i++) {
    var t = TINTE_HEX[i], tr = parseInt(t.substr(1, 2), 16), tg = parseInt(t.substr(3, 2), 16), tb = parseInt(t.substr(5, 2), 16);
    var d = 2 * (r - tr) * (r - tr) + 4 * (g2 - tg) * (g2 - tg) + 3 * (b - tb) * (b - tb);
    if (bd < 0 || d < bd) { bd = d; best = i + 1; }
  }
  return best;
};
/* il look di un profilo del server: dpk (pagina nuova) o, per chi ha la pagina vecchia, solo la
   tinta ricavata da scl.bodyCol (nessun premium dedotto: non si regala niente a nessuno) */
/* 19/09 — i tre livelli, dal piu' ricco:
   1. `dpk` (pagina nuova + server col relay dei cosmetici): il fagiolotto intero, premium compresi;
   2. `dp2` {c, h, o} (pagina nuova, server di oggi: patch S5 LOOK_API): colore, cappello di serie, occhi;
   3. `scl.bodyCol` (pagina vecchia): solo la tinta piu' vicina. Mai un premium dedotto. */
var DP2_COLORI = ['giallo', 'verde', 'rosso', 'viola', 'blu', 'arancio', 'rosa', 'ciano', 'bianco', 'antracite'];
var DP2_CAPPELLI = { nessuno:1, arrampicata:2, militare:3, cantiere:4, visiera:5, minatore:6, lana:7, aviatore:8, alpino:9, bandana:10 };
var DP2_OCCHI = ['tondi', 'grandi', 'furbi', 'ciglia', 'occhiali'];
DPK.DP2 = { COLORI:DP2_COLORI, CAPPELLI:DP2_CAPPELLI, OCCHI:DP2_OCCHI };
DPK.daDp2 = function (d) {
  var o = DPK.norm({});
  if (!d || typeof d !== 'object') return o;
  var c = String(d.c || ''), i = DP2_COLORI.indexOf(c);
  o.co = i >= 0 ? i + 1 : DPK.tintaVicina(c);
  o.ca = DP2_CAPPELLI[String(d.h || '')] || 0;
  i = DP2_OCCHI.indexOf(String(d.o || ''));
  o.ol = i >= 0 ? i : 0;
  return o;
};
DPK.daProfilo = function (prof) {
  if (prof && prof.dpk && typeof prof.dpk === 'object') return DPK.norm(prof.dpk);
  if (prof && prof.dp2 && typeof prof.dp2 === 'object' && (prof.dp2.c || prof.dp2.h || prof.dp2.o)) return DPK.daDp2(prof.dp2);
  var o = DPK.norm({});
  var bc = prof && (prof.bodyCol || (prof.scl && prof.scl.bodyCol));
  if (bc) o.co = DPK.tintaVicina(bc);
  return o;
};
/* aggancio per il client online (online.js primoSnap): DPM.LOOK_DA_PROFILO(profilo, seat, uid[, tutti])
   `tutti` (facoltativo) = profili in ordine di posto -> tinte a due passate (chi chiede un colore lo
   ottiene se libero). Senza `tutti`: una passata nell'ordine delle chiamate (seat 0 azzera), sempre unica. */
var SEQ = { preso:[] };
DPM.LOOK_DA_PROFILO = function (prof, seat, uid, tutti) {
  seat = seat | 0;
  if (tutti && tutti.length) {
    var t2 = DPK.tinte(tutti.map(function (p, i) { return { seat:i, co:DPK.daProfilo(p).co }; }));
    return DPK.risolvi(DPK.daProfilo(prof), t2[seat]);
  }
  if (seat === 0) SEQ.preso = [];
  var d = DPK.daProfilo(prof), t = -1;
  if (d.co >= 1 && !SEQ.preso[d.co - 1]) t = d.co - 1;
  for (var k = 0; t < 0 && k < 10; k++) { var q = (seat + k) % 10; if (!SEQ.preso[q]) t = q; }
  if (t < 0) t = seat % 10;
  SEQ.preso[t] = 1;
  return DPK.risolvi(d, t);
};

/* ═══════════════ CAPPELLI PREMIUM (origine = cima della testa, celle) ═══════════════ */
var C = A.CAPPELLI;
C.chiodato = function (g, L, o) {
  var parti = [function () { cupola(g, 0, 0.14, 0.43, 0.38, -0.05); }];
  // chiodi PRIMA (dietro la cupola): sporgono dalla sagoma del cappello
  g.strokeStyle = INK; g.lineWidth = o * 2; g.fillStyle = '#dfe4e8';
  [[-0.3, -0.12, -0.45, -0.3], [0, -0.24, 0, -0.44], [0.3, -0.12, 0.45, -0.3]].forEach(function (s) {
    g.beginPath(); g.moveTo(s[0] - 0.06, s[1] + 0.04); g.lineTo(s[2], s[3]); g.lineTo(s[0] + 0.06, s[1] + 0.04); g.closePath(); g.stroke(); g.fill();
  });
  disegnaParti(g, parti, [L.hat], o, L, 0, -0.06, -0.05);
  g.fillStyle = L.hatS; g.fillRect(-0.42, 0.06, 0.84, 0.06);
  g.fillStyle = '#f4c430'; ellisse(g, 0.18, -0.02, 0.05, 0.05); g.fill();
  luce(g, -0.2, -0.1);
};
C.cappuccio = function (g, L, o) {
  var parti = [function () {
    g.beginPath(); g.moveTo(-0.5, 0.62); g.quadraticCurveTo(-0.56, -0.1, -0.2, -0.36); g.quadraticCurveTo(0.1, -0.52, 0.34, -0.28);
    g.quadraticCurveTo(0.56, -0.02, 0.48, 0.32); g.lineTo(0.36, 0.3); g.quadraticCurveTo(0.34, 0.06, 0.1, 0.02);
    g.quadraticCurveTo(-0.32, 0.02, -0.36, 0.62); g.closePath();
  }];
  disegnaParti(g, parti, [L.hat], o, L, 0, 0.05, -0.05);
  g.strokeStyle = 'rgba(36,21,15,0.35)'; g.lineWidth = 0.025; g.beginPath(); g.moveTo(-0.3, -0.2); g.quadraticCurveTo(0.0, -0.3, 0.3, -0.2); g.stroke();
  g.fillStyle = L.hatS; A.rr(g, -0.12, -0.05, 0.08, 0.05, 0.02); g.fill();
};
C.ponpon = function (g, L, o) {
  var parti = [function () { g.beginPath(); g.moveTo(-0.39, 0.12); g.lineTo(-0.38, 0.0); g.bezierCurveTo(-0.38, -0.34, -0.2, -0.42, 0, -0.42); g.bezierCurveTo(0.2, -0.42, 0.38, -0.34, 0.38, 0.0); g.lineTo(0.39, 0.12); g.quadraticCurveTo(0, 0.06, -0.39, 0.12); g.closePath(); },
    function () { A.rr(g, -0.42, -0.02, 0.84, 0.17, 0.07); }, function () { ellisse(g, 0.02, -0.62, 0.27, 0.25); }];
  disegnaParti(g, parti, [L.hat, '#f6f1e7', '#f6f1e7'], o, L, 0, -0.06, -0.05);
  g.fillStyle = '#ffffff'; for (var i = -2; i <= 2; i++) { ellisse(g, i * 0.15, -0.2, 0.035, 0.035); g.fill(); }
  g.fillStyle = '#d7cfbf'; ellisse(g, 0.08, -0.56, 0.14, 0.12); g.fill();
  g.fillStyle = '#ffffff'; ellisse(g, -0.06, -0.7, 0.07, 0.06); g.fill();
};
C.macellaio = function (g, L, o) {
  var parti = [function () { g.beginPath(); g.moveTo(-0.44, 0.14); g.bezierCurveTo(-0.52, -0.22, -0.3, -0.36, 0, -0.34); g.bezierCurveTo(0.32, -0.36, 0.52, -0.2, 0.44, 0.14); g.quadraticCurveTo(0, 0.04, -0.44, 0.14); g.closePath(); },
    function () { A.rr(g, -0.44, 0.02, 0.88, 0.12, 0.05); }];
  disegnaParti(g, parti, [L.hat, L.hatS], o, L, 0, -0.06, -0.05);
  g.fillStyle = '#c8101c'; ellisse(g, 0.22, -0.12, 0.07, 0.05, 0.4); g.fill(); ellisse(g, 0.3, -0.03, 0.03, 0.025); g.fill();
  luce(g, -0.22, -0.14);
};
C.neon = function (g, L, o) {
  var parti = [function () { cupola(g, 0, 0.16, 0.44, 0.42, -0.04); }, function () { A.rr(g, -0.46, 0.06, 0.92, 0.1, 0.05); }];
  disegnaParti(g, parti, [L.hat, L.hatS], o, L, 0, -0.06, -0.05);
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = 'rgba(57,255,176,0.45)'; g.lineWidth = 0.1; g.beginPath(); g.moveTo(-0.34, -0.02); g.quadraticCurveTo(0, -0.4, 0.34, -0.02); g.stroke();
  g.restore();
  g.strokeStyle = '#39ffb0'; g.lineWidth = 0.04; g.beginPath(); g.moveTo(-0.34, -0.02); g.quadraticCurveTo(0, -0.4, 0.34, -0.02); g.stroke();
  g.fillStyle = '#39ffb0'; A.rr(g, -0.4, 0.085, 0.8, 0.04, 0.02); g.fill();
  luce(g, -0.22, -0.12);
};
C.colbacco = function (g, L, o) {
  var parti = [function () {
    g.beginPath(); g.moveTo(-0.44, 0.14);
    for (var i = 0; i <= 8; i++) { var a = Math.PI + i / 8 * Math.PI, r = 0.46 + (i % 2 ? 0.05 : 0); g.lineTo(Math.cos(a) * r, -0.06 + Math.sin(a) * r * 0.9); }
    g.lineTo(0.44, 0.14); g.quadraticCurveTo(0, 0.06, -0.44, 0.14); g.closePath();
  }];
  disegnaParti(g, parti, [L.hat], o, L, 0, -0.06, -0.05);
  g.strokeStyle = 'rgba(36,21,15,0.35)'; g.lineWidth = 0.022;
  for (var j = 0; j < 7; j++) { var x = -0.34 + j * 0.11; g.beginPath(); g.moveTo(x, 0.04); g.quadraticCurveTo(x + 0.04, -0.12, x, -0.3); g.stroke(); }
  g.fillStyle = L.hatL; ellisse(g, -0.18, -0.26, 0.08, 0.05, 0.5); g.fill();
};
C.cilindro = function (g, L, o) {
  var parti = [function () { ellisse(g, 0.02, 0.1, 0.52, 0.09); }, function () { A.rr(g, -0.3, -0.62, 0.62, 0.74, 0.06); }];
  disegnaParti(g, parti, [L.hatS, L.hat], o, L, 1, -0.06, 0);
  g.fillStyle = '#b3202f'; g.fillRect(-0.3, -0.06, 0.62, 0.12);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-0.2, -0.56, 0.05, 0.44);
};
C.corona = function (g, L, o) {
  var parti = [function () {
    g.beginPath(); g.moveTo(-0.42, 0.14); g.lineTo(-0.44, -0.2); g.lineTo(-0.26, -0.06); g.lineTo(-0.16, -0.46); g.lineTo(-0.04, -0.1);
    g.lineTo(0.06, -0.6); g.lineTo(0.16, -0.1); g.lineTo(0.28, -0.46); g.lineTo(0.36, -0.06); g.lineTo(0.48, -0.2); g.lineTo(0.44, 0.14); g.closePath();
  }];
  disegnaParti(g, parti, [L.hat], o, L, 0, -0.05, -0.04);
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.moveTo(0.06, -0.5); g.lineTo(0.1, -0.16); g.lineTo(0.03, -0.16); g.closePath(); g.fill();
  g.fillStyle = '#ffd24a'; A.rr(g, -0.42, 0.02, 0.86, 0.1, 0.04); g.fill();
  g.fillStyle = '#e0313b'; ellisse(g, 0.02, 0.07, 0.05, 0.04); g.fill();
};

/* ═══════════════ FINITURE (tela cotta del corpo) ═══════════════ */
A.finitura = function (g, L, o, sopra) {
  var f = L.fi;
  if (!sopra) {                          // sotto la sagoma: un alone che NON rimpicciolisce nulla
    if (f === 2) { g.fillStyle = L.colL + '55'; pathCorpo(g, o * 2.6); g.fill(); g.fillStyle = L.colL + '99'; pathCorpo(g, o * 1.7); g.fill(); }
    else if (f === 4) { g.fillStyle = '#ffd24a'; pathCorpo(g, o * 1.9); g.fill(); }
    return;
  }
  if (f === 1) {                         // opaca: niente riflesso netto, solo un velo
    g.fillStyle = 'rgba(255,255,255,0.18)'; ellisse(g, -0.18, -1.02, 0.09, 0.14, 0.6); g.fill();
    return;
  }
  // lucida di base per le altre
  g.fillStyle = 'rgba(255,255,255,0.9)'; ellisse(g, -0.19, -1.07, 0.055, 0.115, 0.6); g.fill();
  if (f === 2) {                         // neon: bordo interno luminoso
    g.strokeStyle = L.colL; g.lineWidth = 0.05; pathCorpo(g, -0.03); g.stroke();
  } else if (f === 3) {                  // metallo: bande di luce verticali
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(-0.3, -1.3, 0.07, 1.2); g.fillRect(0.12, -1.3, 0.04, 1.2);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0.2, -1.3, 0.1, 1.2);
    g.fillStyle = 'rgba(255,255,255,0.7)'; ellisse(g, -0.27, -0.5, 0.025, 0.1, 0.1); g.fill();
  } else if (f === 4) {                  // oro: brillantini
    g.fillStyle = 'rgba(255,236,160,0.95)';
    [[-0.22, -0.72, 0.07], [0.2, -0.95, 0.05], [0.15, -0.38, 0.06]].forEach(function (s) { stella4(g, s[0], s[1], s[2]); });
  }
};
function stella4(g, x, y, r) {
  var q = r * 0.28; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + q, y - q); g.lineTo(x + r, y); g.lineTo(x + q, y + q); g.lineTo(x, y + r); g.lineTo(x - q, y + q); g.lineTo(x - r, y); g.lineTo(x - q, y - q); g.closePath(); g.fill();
}

/* ═══════════════ DECORI ═══════════════ */
A.decorDentro = function (g, L, o) {
  var d = L.decor, i;
  if (d === 'moschettoni') {
    g.lineWidth = 0.035;
    [-0.26, 0.3].forEach(function (x) {
      g.strokeStyle = INK; ellisse(g, x, -0.33, 0.07, 0.1); g.lineWidth = 0.06; g.stroke();
      g.strokeStyle = '#cfd5da'; g.lineWidth = 0.035; ellisse(g, x, -0.33, 0.07, 0.1); g.stroke();
    });
  } else if (d === 'toppe') {
    [[-0.28, -0.78, 0.2, 0.17, '#e0c07a'], [0.08, -0.36, 0.22, 0.14, L.colS]].forEach(function (p) {
      g.fillStyle = p[4]; A.rr(g, p[0], p[1], p[2], p[3], 0.03); g.fill();
      g.strokeStyle = 'rgba(36,21,15,0.55)'; g.lineWidth = 0.018; g.setLineDash([0.03, 0.03]); A.rr(g, p[0] + 0.025, p[1] + 0.025, p[2] - 0.05, p[3] - 0.05, 0.02); g.stroke(); g.setLineDash([]);
    });
  } else if (d === 'piumino') {
    g.strokeStyle = 'rgba(36,21,15,0.3)'; g.lineWidth = 0.03;
    for (i = 0; i < 4; i++) { var y = -0.98 + i * 0.2; g.beginPath(); g.moveTo(-0.4, y); g.quadraticCurveTo(0, y + 0.07, 0.4, y); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.14)';
    for (i = 0; i < 4; i++) g.fillRect(-0.4, -0.95 + i * 0.2, 0.8, 0.06);
  } else if (d === 'grembiule') {
    g.fillStyle = '#f4f1ea';
    g.beginPath(); g.moveTo(-0.22, -0.8); g.lineTo(0.26, -0.8); g.lineTo(0.3, -0.22); g.lineTo(-0.26, -0.22); g.closePath(); g.fill();
    g.strokeStyle = '#f4f1ea'; g.lineWidth = 0.04; g.beginPath(); g.moveTo(-0.2, -0.8); g.lineTo(-0.1, -1.05); g.moveTo(0.24, -0.8); g.lineTo(0.14, -1.05); g.stroke();
    g.fillStyle = '#c8101c'; ellisse(g, 0.08, -0.55, 0.07, 0.05, 0.6); g.fill(); ellisse(g, -0.1, -0.4, 0.04, 0.03); g.fill();
    g.fillStyle = 'rgba(36,21,15,0.18)'; g.fillRect(-0.26, -0.26, 0.56, 0.04);
  } else if (d === 'fascia') {
    g.strokeStyle = '#a8740e'; g.lineWidth = 0.16; g.beginPath(); g.moveTo(-0.42, -0.95); g.lineTo(0.42, -0.28); g.stroke();
    g.strokeStyle = '#f2c14e'; g.lineWidth = 0.11; g.stroke();
    g.fillStyle = '#fff3b0'; stella4(g, -0.05, -0.62, 0.07);
  } else if (d === 'corda' && L.cordaCol) {
    // la corda disegnata dal corpo usa L.hat: con un cappello non di serie la ricoloriamo sopra
    g.lineWidth = 0.065; g.strokeStyle = L.cordaCol; g.beginPath(); g.moveTo(-0.4, -0.9); g.lineTo(0.4, -0.3); g.stroke();
  }
};
A.decorFuori = function (g, L, o) {
  if (L.decor !== 'pelliccia') return;
  var i, pts = [];
  for (i = 0; i < 9; i++) pts.push([-0.4 + i * 0.1, -0.56 + Math.abs(i - 4) * 0.012]);
  g.fillStyle = INK; pts.forEach(function (p) { ellisse(g, p[0], p[1], 0.08 + o, 0.07 + o); g.fill(); });
  g.fillStyle = '#8a6a4a'; pts.forEach(function (p) { ellisse(g, p[0], p[1], 0.08, 0.07); g.fill(); });
  g.fillStyle = '#b8946c'; pts.forEach(function (p, j) { if (j % 2) { ellisse(g, p[0] - 0.02, p[1] - 0.025, 0.035, 0.025); g.fill(); } });
};

/* ═══════════════ OCCHI E FACCIA (pixel) ═══════════════ */
A.occhiExtra = function (g, L, S, o, x1, x2, Y, rx, ry, m) {
  var c = L.oc, i, lw = Math.max(1.1, S * 0.03);
  g.lineCap = 'round';
  if (c === 1 && S >= 18) {                       // ciglia
    g.strokeStyle = INK; g.lineWidth = lw; g.beginPath();
    [x1, x2].forEach(function (x, k) { var sg = k ? 1 : -1; for (i = 0; i < 3; i++) { var a = -Math.PI / 2 + sg * (0.5 + i * 0.35); var bx = x + Math.cos(a) * rx, by = Y + Math.sin(a) * ry; g.moveTo(bx, by); g.lineTo(bx + Math.cos(a) * S * 0.06, by + Math.sin(a) * S * 0.06); } });
    g.stroke();
  } else if (c === 2) {                           // sopracciglia (arrabbiate con la grinta)
    var t = (m === 8 || m === 7 || m === 2) ? 0.22 : -0.08;
    g.strokeStyle = INK; g.lineWidth = Math.max(1.6, S * 0.055); g.beginPath();
    g.moveTo(x1 - rx * 0.9, Y - ry * 1.35 - t * S * 0.3); g.lineTo(x1 + rx * 0.7, Y - ry * 1.35 + t * S * 0.3);
    g.moveTo(x2 + rx * 0.9, Y - ry * 1.35 - t * S * 0.3); g.lineTo(x2 - rx * 0.7, Y - ry * 1.35 + t * S * 0.3);
    g.stroke();
  } else if (c === 3 && S >= 18) {                // lentiggini
    g.fillStyle = L.colS; g.beginPath();
    [x1, x2].forEach(function (x) { for (i = 0; i < 3; i++) { var px = x - rx * 0.5 + i * rx * 0.5, py = Y + ry * 1.45 + (i % 2) * S * 0.02; g.moveTo(px + S * 0.018, py); g.arc(px, py, S * 0.018, 0, TAU); } });
    g.fill();
  } else if (c === 4) {                           // benda sull'occhio destro
    g.strokeStyle = INK; g.lineWidth = Math.max(1.4, S * 0.04); g.beginPath(); g.moveTo(x1 - rx * 2.2, Y - ry * 1.5); g.lineTo(x2 + rx * 1.6, Y + ry * 0.6); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.ellipse(x2, Y, rx * 1.12, ry * 1.08, 0, 0, TAU); g.fill();
    g.fillStyle = '#3a2a24'; g.beginPath(); g.ellipse(x2 - rx * 0.25, Y - ry * 0.3, rx * 0.3, ry * 0.2, -0.5, 0, TAU); g.fill();
  } else if (c === 5) {                           // occhiaie
    g.strokeStyle = 'rgba(70,30,80,0.5)'; g.lineWidth = Math.max(1.2, S * 0.04); g.beginPath();
    g.arc(x1, Y + ry * 0.2, rx * 1.05, 0.5, Math.PI - 0.5); g.moveTo(x2 + rx * 1.05 * Math.cos(0.5), Y + ry * 0.2 + rx * 1.05 * Math.sin(0.5)); g.arc(x2, Y + ry * 0.2, rx * 1.05, 0.5, Math.PI - 0.5); g.stroke();
  } else if (c === 6) {                           // iridi neon: anello luminoso
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(24,231,255,0.55)'; g.lineWidth = Math.max(1, S * 0.03);
    g.beginPath(); g.ellipse(x1, Y, rx * 1.1, ry * 1.1, 0, 0, TAU); g.moveTo(x2 + rx * 1.1, Y); g.ellipse(x2, Y, rx * 1.1, ry * 1.1, 0, 0, TAU); g.stroke(); g.restore();
  } else if (c === 7) {                           // monocolo d'oro
    g.strokeStyle = INK; g.lineWidth = Math.max(2.2, S * 0.06); g.beginPath(); g.ellipse(x2, Y, rx * 1.15, ry * 1.15, 0, 0, TAU); g.stroke();
    g.strokeStyle = '#e8b72f'; g.lineWidth = Math.max(1.3, S * 0.035); g.stroke();
    g.beginPath(); g.moveTo(x2 + rx * 0.8, Y + ry * 0.9); g.quadraticCurveTo(x2 + rx * 1.6, Y + ry * 3, x2 + rx * 0.6, Y + ry * 4.2); g.lineWidth = Math.max(1, S * 0.018); g.stroke();
  } else if (c === 8) {                           // pupille d'oro (colore in L.pupilla) + scintilla
    if (S >= 24) { g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(x1 + rx * 0.45, Y - ry * 0.6, S * 0.02, 0, TAU); g.arc(x2 + rx * 0.45, Y - ry * 0.6, S * 0.02, 0, TAU); g.fill(); }
  } else if (c === 9) {                           // cicatrice sull'occhio sinistro
    g.strokeStyle = '#b8505a'; g.lineWidth = Math.max(1.5, S * 0.04); g.beginPath(); g.moveTo(x1 - rx * 0.6, Y - ry * 1.6); g.lineTo(x1 + rx * 0.7, Y + ry * 1.5); g.stroke();
    if (S >= 22) { g.strokeStyle = INK; g.lineWidth = Math.max(1, S * 0.015); g.beginPath(); for (i = 0; i < 3; i++) { var k2 = (i - 1) * 0.8, cx = x1 + rx * 0.05 + rx * 0.65 * k2, cy = Y + ry * 1.55 * k2; g.moveTo(cx - rx * 0.3, cy - ry * 0.12); g.lineTo(cx + rx * 0.3, cy + ry * 0.12); } g.stroke(); }
  }
};

/* ═══════════════ SCIE (stessi punti della scia di serie) ═══════════════ */
var ARCO = ['#ff4d4d', '#ffa53a', '#ffe14a', '#5fd35f', '#3aa0ff', '#9d5ee6'];
A.scia = function (g, L, an, p, X, Y, S, a) {
  var sc = an.scie, n = sc.length, i, s, x, y, st = L.sc;
  g.save();
  for (i = 0; i < n; i++) {
    s = sc[i]; x = X + (s.x - p.x) * S; y = Y - (s.y - p.y) * S - 0.7 * S;
    var al = s.a * a * 1.6; if (al <= 0) continue; if (al > 1) al = 1;
    g.globalAlpha = al;
    if (st === 1) { g.fillStyle = L.colL; g.beginPath(); g.arc(x, y, S * (0.1 + i * 0.02), 0, TAU); g.fill(); }
    else if (st === 2) { g.fillStyle = '#ffe14a'; stella4(g, x, y, S * (0.16 + 0.03 * Math.sin(i + an.t * 9))); g.strokeStyle = INK; g.lineWidth = Math.max(1, S * 0.02); g.stroke(); }
    else if (st === 3) { g.strokeStyle = '#e8f6ff'; g.lineWidth = Math.max(1, S * 0.03); g.beginPath(); g.arc(x + Math.sin(i * 2.1) * S * 0.15, y, S * (0.09 + 0.03 * (i % 3)), 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x - S * 0.04, y - S * 0.06, S * 0.03, S * 0.03); }
    else if (st === 5) {
      g.fillStyle = '#2f7dff'; g.beginPath(); g.moveTo(x, y - S * 0.36); g.quadraticCurveTo(x + S * 0.2, y, x, y + S * 0.12); g.quadraticCurveTo(x - S * 0.2, y, x, y - S * 0.36); g.fill();
      g.fillStyle = '#bfe6ff'; g.beginPath(); g.moveTo(x, y - S * 0.16); g.quadraticCurveTo(x + S * 0.09, y + S * 0.02, x, y + S * 0.08); g.quadraticCurveTo(x - S * 0.09, y + S * 0.02, x, y - S * 0.16); g.fill();
    }
  }
  if ((st === 4 || st === 6) && n >= 1) {        // tratti che uniscono i punti fino al corpo
    var px = [], py = [];
    for (i = 0; i < n; i++) { px.push(X + (sc[i].x - p.x) * S); py.push(Y - (sc[i].y - p.y) * S - 0.7 * S); }
    px.push(X); py.push(Y - 0.7 * S);
    g.globalAlpha = Math.min(1, sc[n - 1].a * a * 2);
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (st === 4) {
      g.beginPath(); g.moveTo(px[0], py[0]);
      for (i = 1; i < px.length; i++) { var mx = (px[i - 1] + px[i]) / 2 + ((i % 2) ? 1 : -1) * S * 0.18, my = (py[i - 1] + py[i]) / 2 + ((i % 2) ? -1 : 1) * S * 0.12; g.lineTo(mx, my); g.lineTo(px[i], py[i]); }
      g.strokeStyle = '#5fd0ff'; g.lineWidth = Math.max(2, S * 0.1); g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1, S * 0.04); g.stroke();
    } else {
      for (var b = 0; b < ARCO.length; b++) {
        g.beginPath(); var off = (b - 2.5) * S * 0.05;
        g.moveTo(px[0], py[0] + off); for (i = 1; i < px.length; i++) g.lineTo(px[i], py[i] + off);
        g.strokeStyle = ARCO[b]; g.lineWidth = Math.max(1, S * 0.055); g.stroke();
      }
    }
  }
  g.restore();
};

/* ═══════════════ RINASCITA (u 0..1 in mezzo secondo) ═══════════════ */
A.rinascita = function (g, L, u, X, Y, S) {
  var i, r = L.ri;
  g.save();
  if (r === 1) {
    g.fillStyle = '#ffe14a'; g.strokeStyle = INK; g.lineWidth = Math.max(1, S * 0.03); g.globalAlpha = 1 - u * u;
    for (i = 0; i < 8; i++) { var a = i * TAU / 8 + u * 2.4, rr = (0.3 + u * 0.9) * S; stella4(g, X + Math.cos(a) * rr, Y - 0.6 * S + Math.sin(a) * rr * 0.75, S * 0.13 * (1 - u * 0.5)); g.stroke(); g.fill(); }
  } else if (r === 2) {
    var su = Math.min(1, u * 3), crolla = Math.max(0, (u - 0.45) / 0.55), lx = X - 0.75 * S, ly = Y;
    g.globalAlpha = 1 - crolla;
    g.translate(lx, ly + crolla * 0.3 * S); g.rotate(-0.12 - crolla * 0.5);
    var h = 0.62 * S * su;
    g.fillStyle = INK; A.rr(g, -0.22 * S - 2, -h - 2, 0.44 * S + 4, h + 4, 0.18 * S); g.fill();
    g.fillStyle = '#9aa2ad'; A.rr(g, -0.22 * S, -h, 0.44 * S, h, 0.16 * S); g.fill();
    if (su > 0.8) { g.strokeStyle = '#5e6570'; g.lineWidth = Math.max(1.2, S * 0.04); g.beginPath(); g.moveTo(0, -h + 0.12 * S); g.lineTo(0, -h + 0.4 * S); g.moveTo(-0.1 * S, -h + 0.22 * S); g.lineTo(0.1 * S, -h + 0.22 * S); g.stroke(); }
  } else if (r === 3) {
    if (u < 0.35) {
      var k = 1 - u / 0.35; g.globalAlpha = k;
      g.beginPath(); g.moveTo(X + 0.2 * S, Y - 4 * S); g.lineTo(X - 0.15 * S, Y - 2.4 * S); g.lineTo(X + 0.18 * S, Y - 2.2 * S); g.lineTo(X - 0.1 * S, Y - 0.7 * S);
      g.strokeStyle = '#8fe8ff'; g.lineWidth = Math.max(3, S * 0.2); g.lineJoin = 'round'; g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1.5, S * 0.07); g.stroke();
    }
    g.globalAlpha = 1 - u; g.strokeStyle = '#bff3ff'; g.lineWidth = Math.max(1.5, S * 0.08 * (1 - u));
    g.beginPath(); g.ellipse(X, Y, (0.3 + u * 0.9) * S, (0.1 + u * 0.25) * S, 0, 0, TAU); g.stroke();
  } else if (r === 4) {
    var cols = ['#ff4d6d', '#ffe14a', '#5fd0ff'];
    for (var b = 0; b < 3; b++) {
      var cx = X + (b - 1) * 0.7 * S, cy = Y - (1.5 + (b % 2) * 0.4) * S, uu = Math.max(0, u * 1.3 - b * 0.12);
      if (uu <= 0 || uu > 1) continue;
      g.globalAlpha = 1 - uu; g.fillStyle = cols[b]; g.beginPath();
      for (i = 0; i < 10; i++) { var a2 = i * TAU / 10, rr2 = uu * 0.7 * S; g.moveTo(cx + Math.cos(a2) * rr2 + S * 0.06, cy + Math.sin(a2) * rr2); g.arc(cx + Math.cos(a2) * rr2, cy + Math.sin(a2) * rr2, S * 0.06, 0, TAU); }
      g.fill();
    }
  }
  g.restore();
};

/* ═══════════════ ESULTANZA IN VETTA (modifica la posa P gia' calcolata) ═══════════════ */
A.emote = function (P, an, em, p) {
  var t = an.arrivo || 0, e;
  if (em === 1) {                                   // piroetta: salto e giro su se stesso (la sagoma si "gira")
    e = (t * 1.4) % 1;
    var cz = Math.cos(e * TAU);
    P.ssx = Math.max(0.12, Math.abs(cz));             // mai negativo (l'ombra vuole un raggio positivo)
    an.face = (cz < 0 ? -1 : 1) * (an.faceEm || (an.faceEm = an.face || 1));   // il giro lo fa il verso (solo animazione)
    P.rot = 0; P.bob = Math.sin(e * Math.PI) * 0.45;
    P.aF = 2.5; P.aB = -2.5; P.fFx = 0.06; P.fBx = -0.06; P.fFy = -0.1; P.fBy = -0.1; P.occhi = 6; P.bocca = 3;
  } else if (em === 2) {                            // balletto
    var s = Math.sin(t * 9);
    P.ox = s * 0.07; P.rot = s * 0.14; P.bob = Math.abs(Math.cos(t * 9)) * 0.08;
    P.aF = 1.2 + s * 0.9; P.aB = -1.2 + s * 0.9; P.fFx = 0.14 + s * 0.1; P.fBx = -0.14 + s * 0.1; P.fFy = -Math.max(0, s) * 0.1; P.fBy = -Math.max(0, -s) * 0.1;
    P.occhi = 6; P.bocca = 3;
  } else if (em === 3) {                            // muscoli
    P.aF = 1.95 + Math.sin(t * 16) * 0.05; P.aB = -1.95 - Math.sin(t * 16) * 0.05; P.bob = 0;
    P.ssx = 1.07; P.ssy = 0.97; P.fFx = 0.2; P.fBx = -0.2; P.fFy = 0; P.fBy = 0;
    P.occhi = 8; P.bocca = 2; P.shake = Math.sin(t * 50) * 0.008;
  } else if (em === 4) {                            // inchino
    e = Math.max(0, Math.sin(t * 2.6));
    P.rot = 0.5 * e; P.bob = 0; P.aF = 0.15 + e * 0.5; P.aB = -0.15 - e * 1.2; P.fFx = 0.12; P.fBx = -0.12; P.fFy = 0; P.fBy = 0;
    P.occhi = e > 0.4 ? 1 : 6; P.bocca = 0;
  }
};

/* ═══════════════ MORTE A TEMA (pezzetti tipo 10 nel pool di sangue.js) ═══════════════
   k = stile*16 + variante. Mai piu' pezzi del sangue di serie (70 gocce + 9 pezzi). */
var CONF = ['#ff4d6d', '#ffe14a', '#5fd0ff', '#7dff8a', '#c58bff', '#ffa53a'];
A.morteStile = function (SG, x, y, vx, vy, look, liv) {
  var P = SG.P, m = look.mo, n, i, j, a, v;
  var quanti = liv === 2 ? 1 : 0.5;
  SG.anello(x, y, 1.6, 1);
  if (m === 3) SG.schizzo(x, y, 18, vx, vy, 7);    // ossa: un po' di sangue resta
  n = Math.round((m === 2 ? 46 : m === 5 ? 26 : m === 3 ? 12 : 30) * quanti);
  for (i = 0; i < n; i++) {
    a = Math.random() * TAU; v = 4 + Math.random() * 8;
    j = SG.nuova(10, x, y + 0.3, Math.cos(a) * v + vx * 0.3, Math.sin(a) * v + 5, m === 2 ? 2.2 : 1.6, (m === 2 ? 0.09 : m === 5 ? 0.16 : 0.13) + Math.random() * 0.08);
    if (j >= 0) { P.va[j] = (Math.random() - 0.5) * 24; P.k[j] = m * 16 + ((Math.random() * 6) | 0); SG.gibLook[j] = look; }
  }
  if (m === 1) {                                    // gelatina: i pezzi gommosi di serie restano
    for (i = 0; i < 5 * quanti; i++) { a = Math.random() * TAU; v = 5 + Math.random() * 6; j = SG.nuova(8, x, y, Math.cos(a) * v, Math.sin(a) * v + 4, 5, 0.26 + Math.random() * 0.2); if (j >= 0) { P.va[j] = (Math.random() - 0.5) * 25; P.k[j] = (Math.random() * 8) | 0; SG.gibLook[j] = look; } }
  }
  if (m === 4) SG.polvere(x, y - 0.2, 8, 0, 3);
};
A.disegnaCosmetici = function (g, V, P, N, SG) {
  var s = V.S, i, k, st, va, sz, u;
  for (i = 0; i < N; i++) {
    if (P.t[i] !== 10) continue;
    k = P.k[i]; st = k >> 4; va = k & 15; sz = P.s[i] * s; u = P.vita[i] / P.max[i];
    g.save(); g.globalAlpha = u > 0.75 ? (1 - u) / 0.25 : 1;
    g.translate(V.sx(P.x[i]), V.sy(P.y[i])); g.rotate(P.a[i]);
    if (st === 1) {                                 // gelatina
      var lk = SG.gibLook[i] || {}; g.fillStyle = INK; g.beginPath(); g.ellipse(0, 0, sz * 1.25 + 1, sz + 1, 0, 0, TAU); g.fill();
      g.fillStyle = va % 2 ? (lk.colL || '#fff') : (lk.col || '#f3c02c'); g.beginPath(); g.ellipse(0, 0, sz * 1.25, sz, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(-sz * 0.5, -sz * 0.5, sz * 0.35, sz * 0.25);
    } else if (st === 2) {                          // coriandoli (si girano: larghezza che pulsa)
      g.scale(1, Math.abs(Math.cos(P.vita[i] * 9 + i)) + 0.15);
      g.fillStyle = CONF[va % CONF.length]; g.fillRect(-sz, -sz * 0.6, sz * 2, sz * 1.2);
    } else if (st === 3) {                          // ossa
      g.fillStyle = INK; g.fillRect(-sz * 1.3, -sz * 0.32, sz * 2.6, sz * 0.64);
      g.beginPath(); g.arc(-sz * 1.3, -sz * 0.3, sz * 0.42, 0, TAU); g.arc(-sz * 1.3, sz * 0.3, sz * 0.42, 0, TAU); g.arc(sz * 1.3, -sz * 0.3, sz * 0.42, 0, TAU); g.arc(sz * 1.3, sz * 0.3, sz * 0.42, 0, TAU); g.fill();
      g.fillStyle = '#f3eadc'; g.fillRect(-sz * 1.25, -sz * 0.2, sz * 2.5, sz * 0.4);
      g.beginPath(); g.arc(-sz * 1.3, -sz * 0.3, sz * 0.3, 0, TAU); g.arc(-sz * 1.3, sz * 0.3, sz * 0.3, 0, TAU); g.arc(sz * 1.3, -sz * 0.3, sz * 0.3, 0, TAU); g.arc(sz * 1.3, sz * 0.3, sz * 0.3, 0, TAU); g.fill();
    } else if (st === 4) {                          // schegge di ghiaccio
      g.fillStyle = INK; g.beginPath(); g.moveTo(0, -sz * 1.6 - 1); g.lineTo(sz * 0.8 + 1, sz * 0.8); g.lineTo(-sz * 0.7 - 1, sz * 0.9); g.closePath(); g.fill();
      g.fillStyle = va % 2 ? '#bfe9ff' : '#7cc8ec'; g.beginPath(); g.moveTo(0, -sz * 1.5); g.lineTo(sz * 0.7, sz * 0.7); g.lineTo(-sz * 0.6, sz * 0.8); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(-sz * 0.1, -sz * 0.9, sz * 0.18, sz * 0.8);
    } else if (st === 5) {                          // monete d'oro che girano
      g.scale(Math.abs(Math.cos(P.vita[i] * 7 + i)) * 0.85 + 0.15, 1);
      g.fillStyle = INK; g.beginPath(); g.arc(0, 0, sz + 1, 0, TAU); g.fill();
      g.fillStyle = '#e8b72f'; g.beginPath(); g.arc(0, 0, sz, 0, TAU); g.fill();
      g.fillStyle = '#fff0a8'; g.beginPath(); g.arc(-sz * 0.25, -sz * 0.25, sz * 0.35, 0, TAU); g.fill();
    }
    g.restore();
  }
};
})();

/* ── cosmetici/dpk_cosmetici_w2.js ── */
/* DEAD PEAK — COSMETICI v2 · WAVE 2 (15/09/2026, decisione D6 del proprietario).
   Si carica DOPO dpk_cosmetici.js. Aggiunge SOLO indici nuovi (i vecchi restano identici, lo
   verifica il banco): cappelli 19-24, occhi 10-13, decori 11-14, finiture 5-6, scie 7-9,
   morti 6-7, rinascite 5-6, esultanze 5-6. Stesse regole: la tinta del corpo non cambia mai
   (le finiture nuove sono veli sottili sopra), niente rende il fagiolotto piu' piccolo o trasparente. */
(function(){
var DPM = globalThis.DPM, A = DPM.ARTE, K = A.KIT, DPK = DPM.COSMETICI, TAU = Math.PI * 2;
var INK = K.INK, ellisse = K.ellisse, cupola = K.cupola, disegnaParti = K.disegnaParti, luce = K.luce, pathCorpo = K.pathCorpo;

/* ── tabelle ── */
var M = DPK.MAX; M.ca = 24; M.oc = 13; M.de = 14; M.fi = 6; M.sc = 9; M.mo = 7; M.ri = 6; M.em = 6;   // = cosmetics_common.DPK_IDX_MAX
var N = DPK.NOMI;
N.ca.push(['CORNA VICHINGHE','VIKING HORNS'], ['PALOMBARO','DIVING HELMET'], ['AUREOLA','HALO'], ['TRICORNO','TRICORN'], ["CORONA D'ALLORO",'LAUREL WREATH'], ['ZUCCA','PUMPKIN']);
N.oc.push(['OCCHI A CUORE','HEART EYES'], ['MASCHERINA','EYE MASK'], ['OCCHI DI GATTO','CAT EYES'], ['OCCHIALI A STELLA','STAR SHADES']);
N.de.push(['MANTELLO','CAPE'], ['BRETELLE','SUSPENDERS'], ['SALVAGENTE','LIFEBUOY'], ['MEDAGLIA','MEDAL']);
N.fi.push(['IRIDESCENTE','IRIDESCENT'], ['GALASSIA','GALAXY']);
N.sc.push(['NOTE MUSICALI','MUSIC NOTES'], ['PIPISTRELLI','BATS'], ['CUORICINI','HEARTS']);
N.mo.push(['CARAMELLE','CANDY'], ['FANTASMINO','LITTLE GHOST']);
N.ri.push(['PODIO','PODIUM'], ['PORTALE','PORTAL']);
N.em.push(['CHITARRA','AIR GUITAR'], ['TROFEO','TROPHY']);
var CAP = DPK._CAP, COLCAP = DPK._COLCAP, DEC = DPK._DECOR, PUP = DPK._PUPILLA;
CAP[19] = 'vichingo'; CAP[20] = 'palombaro'; CAP[21] = 'aureola'; CAP[22] = 'tricorno'; CAP[23] = 'alloro'; CAP[24] = 'zucca';
COLCAP.vichingo = ['#9aa3ab', '#646c74', '#cfd6dc']; COLCAP.palombaro = ['#c9853a', '#8e5a22', '#f0b76e'];
COLCAP.aureola = ['#ffe27a', '#e0b43a', '#fff6c8']; COLCAP.tricorno = ['#2a2230', '#16111b', '#4a3e52'];
COLCAP.alloro = ['#5da84a', '#3a7430', '#9fdc84']; COLCAP.zucca = ['#ff8a1f', '#c1560b', '#ffc47a'];
DEC[11] = 'mantello'; DEC[12] = 'bretelle'; DEC[13] = 'salvagente'; DEC[14] = 'medaglia';
PUP[12] = '#2a1a05';

/* ── cappelli ── */
var C = A.CAPPELLI;
C.vichingo = function (g, L, o) {
  var corno = function (s) { return function () { g.beginPath(); g.moveTo(s * 0.3, -0.02); g.quadraticCurveTo(s * 0.62, -0.08, s * 0.66, -0.52); g.quadraticCurveTo(s * 0.5, -0.2, s * 0.22, -0.2); g.closePath(); }; };
  disegnaParti(g, [corno(-1), corno(1)], ['#f1e6c8', '#f1e6c8'], o, L, -1, 0, 0);
  disegnaParti(g, [function () { cupola(g, 0, 0.14, 0.42, 0.37, -0.05); }], [L.hat], o, L, 0, -0.06, -0.05);
  g.fillStyle = L.hatS; g.fillRect(-0.02, -0.22, 0.05, 0.34);
  g.fillStyle = '#b07a2a'; g.fillRect(-0.42, 0.04, 0.84, 0.07);
  luce(g, -0.2, -0.1);
};
C.palombaro = function (g, L, o) {
  var parti = [function () { ellisse(g, 0, 0.12, 0.5, 0.46); }];
  disegnaParti(g, parti, [L.hat], o, L, 0, -0.06, -0.05);
  g.fillStyle = INK; ellisse(g, 0.16, 0.1, 0.24 + o, 0.22 + o); g.fill();
  g.fillStyle = '#9fd8ef'; ellisse(g, 0.16, 0.1, 0.24, 0.22); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.8)'; ellisse(g, 0.08, 0.02, 0.06, 0.04, -0.5); g.fill();
  g.strokeStyle = L.hatS; g.lineWidth = 0.05; ellisse(g, 0.16, 0.1, 0.27, 0.25); g.stroke();
  g.fillStyle = L.hatL; [[-0.36, -0.1], [-0.3, 0.3], [0.1, -0.3]].forEach(function (q) { ellisse(g, q[0], q[1], 0.04, 0.04); g.fill(); });
};
C.aureola = function (g, L, o) {
  // l'aureola galleggia: anello d'oro sopra la testa (niente copre la faccia)
  g.lineWidth = 0.1 + o * 2; g.strokeStyle = INK; ellisse(g, 0, -0.22, 0.34, 0.1); g.stroke();
  g.lineWidth = 0.1; g.strokeStyle = L.hat; ellisse(g, 0, -0.22, 0.34, 0.1); g.stroke();
  g.lineWidth = 0.03; g.strokeStyle = L.hatL; ellisse(g, 0, -0.25, 0.3, 0.07); g.stroke();
};
C.tricorno = function (g, L, o) {
  var parti = [function () { g.beginPath(); g.moveTo(-0.62, 0.02); g.quadraticCurveTo(-0.3, 0.14, 0, 0.12); g.quadraticCurveTo(0.3, 0.14, 0.62, 0.02); g.quadraticCurveTo(0.44, -0.2, 0.2, -0.36); g.quadraticCurveTo(0, -0.28, -0.2, -0.36); g.quadraticCurveTo(-0.44, -0.2, -0.62, 0.02); g.closePath(); }];
  disegnaParti(g, parti, [L.hat], o, L, 0, -0.05, -0.04);
  g.strokeStyle = '#d9b26e'; g.lineWidth = 0.035; g.beginPath(); g.moveTo(-0.58, 0.01); g.quadraticCurveTo(0, 0.1, 0.58, 0.01); g.stroke();
  g.fillStyle = '#f4f1ea'; ellisse(g, 0, -0.14, 0.08, 0.07); g.fill();
  g.fillStyle = INK; g.fillRect(-0.035, -0.17, 0.07, 0.02); g.fillRect(-0.05, -0.1, 0.1, 0.018);
};
C.alloro = function (g, L, o) {
  for (var s = -1; s <= 1; s += 2) for (var i = 0; i < 5; i++) {
    var a = Math.PI * (0.95 - i * 0.13), x = Math.cos(a) * 0.4 * s, y = 0.12 - Math.sin(a) * 0.3;
    g.fillStyle = INK; ellisse(g, x, y, 0.1 + o, 0.05 + o, a * s + (s > 0 ? 0 : Math.PI)); g.fill();
    g.fillStyle = i % 2 ? L.hat : L.hatL; ellisse(g, x, y, 0.1, 0.05, a * s + (s > 0 ? 0 : Math.PI)); g.fill();
  }
  g.fillStyle = '#e0313b'; ellisse(g, 0, 0.12, 0.05, 0.04); g.fill();
};
C.zucca = function (g, L, o) {
  var parti = [function () { ellisse(g, 0, 0.02, 0.52, 0.42); }, function () { A.rr(g, -0.05, -0.56, 0.1, 0.18, 0.04); }];
  disegnaParti(g, parti, [L.hat, '#5a7a2a'], o, L, 0, -0.06, -0.05);
  g.strokeStyle = L.hatS; g.lineWidth = 0.03;
  [-0.26, 0, 0.26].forEach(function (x) { g.beginPath(); g.moveTo(x, -0.38); g.quadraticCurveTo(x * 1.5, 0.02, x, 0.42); g.stroke(); });
  g.fillStyle = '#3a1a05';
  g.beginPath(); g.moveTo(-0.28, -0.08); g.lineTo(-0.14, -0.16); g.lineTo(-0.1, -0.02); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(0.28, -0.08); g.lineTo(0.14, -0.16); g.lineTo(0.1, -0.02); g.closePath(); g.fill();
  luce(g, -0.26, -0.18);
};

/* ── decori ── */
var decDentro = A.decorDentro, decFuori = A.decorFuori;
A.decorSotto = function (g, L, o) {        // dietro la sagoma (aggancio applica_dp)
  if (L.decor !== 'mantello') return;
  g.beginPath(); g.moveTo(-0.14, -1.0); g.quadraticCurveTo(-0.62, -0.7, -0.7, -0.14); g.lineTo(-0.2, -0.24); g.closePath();
  g.fillStyle = INK; g.fill(); g.lineWidth = o * 2; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.moveTo(-0.16, -0.98); g.quadraticCurveTo(-0.58, -0.68, -0.66, -0.18); g.lineTo(-0.22, -0.27); g.closePath();
  g.fillStyle = '#b3202f'; g.fill();
  g.fillStyle = '#7a0010'; g.beginPath(); g.moveTo(-0.3, -0.8); g.quadraticCurveTo(-0.5, -0.5, -0.56, -0.2); g.lineTo(-0.44, -0.22); g.closePath(); g.fill();
};
A.decorDentro = function (g, L, o) {
  decDentro(g, L, o);
  var d = L.decor;
  if (d === 'bretelle') {
    g.strokeStyle = '#3a2a1e'; g.lineWidth = 0.06;
    g.beginPath(); g.moveTo(-0.22, -0.95); g.lineTo(-0.16, -0.45); g.moveTo(0.26, -0.95); g.lineTo(0.2, -0.45); g.stroke();
    g.fillStyle = '#d9b26e'; g.fillRect(-0.2, -0.5, 0.07, 0.06); g.fillRect(0.16, -0.5, 0.07, 0.06);
  } else if (d === 'medaglia') {
    g.strokeStyle = '#2f6fd6'; g.lineWidth = 0.07; g.beginPath(); g.moveTo(-0.2, -1.05); g.lineTo(0.05, -0.72); g.lineTo(0.3, -1.05); g.stroke();
    g.fillStyle = INK; ellisse(g, 0.05, -0.64, 0.11 + o * 0.6, 0.11 + o * 0.6); g.fill();
    g.fillStyle = '#f2c14e'; ellisse(g, 0.05, -0.64, 0.11, 0.11); g.fill();
    g.fillStyle = '#fff3b0'; ellisse(g, 0.02, -0.67, 0.035, 0.035); g.fill();
  }
};
A.decorFuori = function (g, L, o) {
  decFuori(g, L, o);
  if (L.decor !== 'salvagente') return;
  g.lineWidth = 0.14 + o * 2; g.strokeStyle = INK; ellisse(g, 0, -0.4, 0.46, 0.13); g.stroke();
  g.lineWidth = 0.14; g.strokeStyle = '#f4f1ea'; ellisse(g, 0, -0.4, 0.46, 0.13); g.stroke();
  g.strokeStyle = '#e0313b'; g.setLineDash([0.18, 0.2]); ellisse(g, 0, -0.4, 0.46, 0.13); g.stroke(); g.setLineDash([]);
};

/* ── finiture (veli sopra: la tinta resta) ── */
var fin = A.finitura;
A.finitura = function (g, L, o, sopra) {
  if (L.fi < 5) return fin(g, L, o, sopra);
  if (!sopra) return;
  if (L.fi === 5) {                           // iridescente: velo arcobaleno leggero
    var lg = g.createLinearGradient(-0.4, -1.2, 0.4, -0.2);
    ['rgba(255,80,160,0.22)', 'rgba(80,200,255,0.22)', 'rgba(120,255,140,0.2)', 'rgba(255,230,90,0.22)'].forEach(function (c, i) { lg.addColorStop(i / 3, c); });
    g.fillStyle = lg; g.fillRect(-0.7, -1.3, 1.4, 1.2);
  } else {                                    // galassia: velo notte + stelline
    g.fillStyle = 'rgba(40,20,80,0.28)'; g.fillRect(-0.7, -1.3, 1.4, 1.2);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    [[-0.2, -0.9, 0.02], [0.18, -0.7, 0.03], [-0.05, -0.4, 0.02], [0.25, -1.0, 0.015], [-0.28, -0.55, 0.018]].forEach(function (s) { ellisse(g, s[0], s[1], s[2], s[2]); g.fill(); });
  }
  g.fillStyle = 'rgba(255,255,255,0.9)'; ellisse(g, -0.19, -1.07, 0.055, 0.115, 0.6); g.fill();
};

/* ── occhi ── */
var occ = A.occhiExtra;
A.occhiExtra = function (g, L, S, o, x1, x2, Y, rx, ry, m) {
  if (L.oc < 10) return occ(g, L, S, o, x1, x2, Y, rx, ry, m);
  var c = L.oc;
  if (c === 10) {                             // cuoricini sulle pupille
    if (m === 6 || m === 7 || m === 4 || m === 5 || m === 1) return;
    [x1, x2].forEach(function (x) {
      var r = rx * 0.55; g.fillStyle = '#e0314f'; g.beginPath();
      g.moveTo(x, Y + r * 0.9); g.bezierCurveTo(x - r * 1.4, Y - r * 0.1, x - r * 0.7, Y - r * 1.2, x, Y - r * 0.45);
      g.bezierCurveTo(x + r * 0.7, Y - r * 1.2, x + r * 1.4, Y - r * 0.1, x, Y + r * 0.9); g.fill();
    });
  } else if (c === 11) {                      // mascherina: fascia scura coi fori degli occhi
    g.save(); g.fillStyle = '#1b1b22';
    g.beginPath(); A.rr(g, x1 - rx * 2.0, Y - ry * 1.25, (x2 - x1) + rx * 4.0, ry * 2.5, ry * 0.9);
    g.moveTo(x1 + rx * 1.05, Y); g.ellipse(x1, Y, rx * 1.05, ry * 1.05, 0, 0, TAU, true);
    g.moveTo(x2 + rx * 1.05, Y); g.ellipse(x2, Y, rx * 1.05, ry * 1.05, 0, 0, TAU, true);
    g.fill('evenodd');
    g.strokeStyle = '#1b1b22'; g.lineWidth = Math.max(1.2, S * 0.03); g.beginPath(); g.moveTo(x1 - rx * 2, Y); g.lineTo(x1 - rx * 2.9, Y + ry * 0.8); g.stroke();
    g.restore();
  } else if (c === 12) {                      // occhi di gatto: iride verde e pupilla a fessura (sopra la pupilla)
    if (m !== 0 && m !== 2 && m !== 3 && m !== 8) return;
    [x1, x2].forEach(function (x) {
      g.fillStyle = 'rgba(140,220,60,0.55)'; g.beginPath(); g.ellipse(x, Y, rx * 0.75, ry * 0.8, 0, 0, TAU); g.fill();
      g.fillStyle = '#12100a'; g.beginPath(); g.ellipse(x, Y, rx * 0.16, ry * 0.7, 0, 0, TAU); g.fill();
    });
  } else if (c === 13) {                      // occhiali a stella
    [x1, x2].forEach(function (x) {
      var r = rx * 1.25; g.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r; g.lineTo(x + Math.cos(a) * rr, Y + Math.sin(a) * rr); }
      g.closePath(); g.fillStyle = 'rgba(255,79,163,0.55)'; g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1.2, S * 0.03); g.stroke();
    });
    g.strokeStyle = INK; g.lineWidth = Math.max(1.2, S * 0.03); g.beginPath(); g.moveTo(x1 + rx * 0.6, Y - ry * 0.4); g.lineTo(x2 - rx * 0.6, Y - ry * 0.4); g.stroke();
  }
};

/* ── scie ── */
var scia = A.scia;
A.scia = function (g, L, an, p, X, Y, S, a) {
  if (L.sc < 7) return scia(g, L, an, p, X, Y, S, a);
  var sc = an.scie, i, s, x, y, al;
  g.save();
  for (i = 0; i < sc.length; i++) {
    s = sc[i]; x = X + (s.x - p.x) * S; y = Y - (s.y - p.y) * S - 0.7 * S + Math.sin(i * 1.7 + (an.t || 0) * 6) * S * 0.12;
    al = Math.min(1, s.a * a * 1.8); if (al <= 0) continue; g.globalAlpha = al;
    if (L.sc === 7) {                         // note musicali
      g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = Math.max(1, S * 0.03);
      g.beginPath(); g.ellipse(x, y, S * 0.09, S * 0.065, -0.4, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(x + S * 0.08, y - S * 0.02); g.lineTo(x + S * 0.08, y - S * 0.32); g.lineTo(x + S * 0.2, y - S * 0.24); g.stroke();
    } else if (L.sc === 8) {                  // pipistrelli
      var fl = Math.sin((an.t || 0) * 30 + i) * 0.5 + 0.5, w = S * 0.22, h = S * 0.1 * (0.4 + fl);
      g.fillStyle = '#2a2230'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - w * 0.5, y - h * 1.5, x - w, y - h * 0.2); g.quadraticCurveTo(x - w * 0.5, y + h * 0.2, x, y + h * 0.5);
      g.quadraticCurveTo(x + w * 0.5, y + h * 0.2, x + w, y - h * 0.2); g.quadraticCurveTo(x + w * 0.5, y - h * 1.5, x, y); g.fill();
    } else {                                  // cuoricini
      var r = S * 0.1; g.fillStyle = i % 2 ? '#ff5d8f' : '#ff9ab8'; g.beginPath();
      g.moveTo(x, y + r); g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.8, y - r * 1.4, x, y - r * 0.5);
      g.bezierCurveTo(x + r * 0.8, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r); g.fill();
    }
  }
  g.restore();
};

/* ── rinascita ── */
var rin = A.rinascita;
A.rinascita = function (g, L, u, X, Y, S) {
  if (L.ri < 5) return rin(g, L, u, X, Y, S);
  g.save();
  if (L.ri === 5) {                           // podio che sale sotto i piedi e poi sparisce
    var h = S * 0.28 * Math.min(1, u * 3), al = u > 0.7 ? (1 - u) / 0.3 : 1; g.globalAlpha = al;
    g.fillStyle = INK; A.rr(g, X - S * 0.62, Y - 1, S * 1.24, h + 3, 3); g.fill();
    g.fillStyle = '#f2c14e'; A.rr(g, X - S * 0.58, Y, S * 1.16, Math.max(0, h - 2), 2); g.fill();
    if (h > S * 0.2) { g.fillStyle = INK; g.font = 'bold ' + Math.round(S * 0.22) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('1', X, Y + S * 0.03); }
  } else {                                    // portale: anello viola che si apre e si chiude
    var k = Math.sin(Math.min(1, u) * Math.PI), rx = S * 0.7 * k, ry = S * 0.95 * k;
    if (rx > 1) {
      g.globalAlpha = 0.85; g.lineWidth = Math.max(2, S * 0.12); g.strokeStyle = '#7c3aed'; g.beginPath(); g.ellipse(X, Y - S * 0.62, rx, ry, 0, 0, TAU); g.stroke();
      g.lineWidth = Math.max(1, S * 0.04); g.strokeStyle = '#d8b4fe'; g.beginPath(); g.ellipse(X, Y - S * 0.62, rx * 0.86, ry * 0.86, u * 6, 0.3, 4.5); g.stroke();
    }
  }
  g.restore();
};

/* ── esultanze ── */
var emo = A.emote;
A.emote = function (P, an, em, p) {
  if (em < 5) return emo(P, an, em, p);
  var t = an.arrivo || 0;
  if (em === 5) {                             // chitarra: una mano pizzica, l'altra sul manico
    P.aF = 0.9 + Math.sin(t * 22) * 0.35; P.aB = 1.9; P.bob = Math.abs(Math.sin(t * 11)) * 0.05;
    P.rot = -0.08 + Math.sin(t * 5.5) * 0.06; P.fFx = 0.2; P.fBx = -0.16; P.occhi = 8; P.bocca = 3;
  } else {                                    // trofeo alzato con due mani
    P.aF = 2.85; P.aB = -2.85; P.bob = Math.abs(Math.sin(t * 6)) * 0.1; P.fFx = 0.12; P.fBx = -0.12; P.occhi = 6; P.bocca = 3;
  }
};
A.emoteDopo = function (g, L, an, X, Y, S) {  // gli oggetti delle esultanze (aggancio applica_dp, dopo il corpo)
  var t = an.arrivo || 0, f = an.face || 1, bob = (L.em === 6 ? Math.abs(Math.sin(t * 6)) * 0.1 : Math.abs(Math.sin(t * 11)) * 0.05) * S;
  g.save();
  if (L.em === 5) {
    g.translate(X + f * 0.05 * S, Y - 0.5 * S - bob); g.scale(f, 1); g.rotate(-0.5);
    g.fillStyle = INK; g.beginPath(); g.ellipse(-0.05 * S, 0, 0.2 * S + 2, 0.15 * S + 2, 0, 0, TAU); g.fill(); g.fillRect(0.05 * S, -0.04 * S - 2, 0.55 * S, 0.08 * S + 4);
    g.fillStyle = '#e0313b'; g.beginPath(); g.ellipse(-0.05 * S, 0, 0.2 * S, 0.15 * S, 0, 0, TAU); g.fill();
    g.fillStyle = '#3a2a1e'; g.fillRect(0.05 * S, -0.03 * S, 0.55 * S, 0.06 * S);
    g.fillStyle = '#1b1b22'; g.beginPath(); g.arc(-0.05 * S, 0, 0.05 * S, 0, TAU); g.fill();
  } else if (L.em === 6) {
    g.translate(X, Y - 1.62 * S - bob);
    g.fillStyle = INK; A.rr(g, -0.18 * S - 2, 0.12 * S, 0.36 * S + 4, 0.1 * S + 3, 2); g.fill();
    g.beginPath(); g.moveTo(-0.22 * S - 2, -0.26 * S - 2); g.lineTo(0.22 * S + 2, -0.26 * S - 2); g.quadraticCurveTo(0.2 * S, 0.05 * S, 0.04 * S, 0.08 * S); g.lineTo(0.04 * S, 0.14 * S); g.lineTo(-0.04 * S, 0.14 * S); g.lineTo(-0.04 * S, 0.08 * S); g.quadraticCurveTo(-0.2 * S, 0.05 * S, -0.22 * S - 2, -0.26 * S - 2); g.fill();
    g.fillStyle = '#f2c14e'; A.rr(g, -0.18 * S, 0.13 * S, 0.36 * S, 0.08 * S, 2); g.fill();
    g.beginPath(); g.moveTo(-0.2 * S, -0.25 * S); g.lineTo(0.2 * S, -0.25 * S); g.quadraticCurveTo(0.18 * S, 0.04 * S, 0.02 * S, 0.07 * S); g.lineTo(-0.02 * S, 0.07 * S); g.quadraticCurveTo(-0.18 * S, 0.04 * S, -0.2 * S, -0.25 * S); g.fill();
    g.fillStyle = '#fff3b0'; g.fillRect(-0.12 * S, -0.2 * S, 0.04 * S, 0.14 * S);
  }
  g.restore();
};

/* ── morte a tema: caramelle e fantasmino (tipo 10, stile 6-7) ── */
var mst = A.morteStile, dco = A.disegnaCosmetici;
var CAR = ['#ff5d8f', '#5fd0ff', '#ffe14a', '#7dff8a', '#c58bff'];
A.morteStile = function (SG, x, y, vx, vy, look, liv) {
  if (look.mo < 6) return mst(SG, x, y, vx, vy, look, liv);
  var P = SG.P, i, j, a, v, q = liv === 2 ? 1 : 0.5;
  SG.anello(x, y, 1.6, 1);
  if (look.mo === 6) {
    for (i = 0; i < Math.round(26 * q); i++) {
      a = Math.random() * TAU; v = 4 + Math.random() * 7;
      j = SG.nuova(10, x, y + 0.3, Math.cos(a) * v + vx * 0.3, Math.sin(a) * v + 5, 1.8, 0.12 + Math.random() * 0.06);
      if (j >= 0) { P.va[j] = (Math.random() - 0.5) * 20; P.k[j] = 6 * 16 + ((Math.random() * 5) | 0); SG.gibLook[j] = look; }
    }
  } else {
    j = SG.nuova(10, x, y + 0.5, 0, 0, 1.6, 0.5);   // il fantasmino: la quota la decide il disegno (origine in P.a, P.va = 0)
    if (j >= 0) { P.va[j] = 0; P.a[j] = y + 0.5; P.k[j] = 7 * 16; SG.gibLook[j] = look; }
    SG.polvere(x, y - 0.2, 6, 0, 2);
  }
};
A.disegnaCosmetici = function (g, V, P, N2, SG) {
  dco(g, V, P, N2, SG);
  var s = V.S, i, st, u, sz;
  for (i = 0; i < N2; i++) {
    if (P.t[i] !== 10) continue;
    st = P.k[i] >> 4; if (st < 6) continue;
    u = P.vita[i] / P.max[i]; sz = P.s[i] * s;
    g.save(); g.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1;
    if (st === 6) {
      g.translate(V.sx(P.x[i]), V.sy(P.y[i])); g.rotate(P.a[i]);
      var c = CAR[(P.k[i] & 15) % CAR.length];
      g.fillStyle = INK; g.beginPath(); g.ellipse(0, 0, sz + 1, sz * 0.7 + 1, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-sz * 0.9, 0); g.lineTo(-sz * 1.8, -sz * 0.6); g.lineTo(-sz * 1.8, sz * 0.6); g.closePath(); g.moveTo(sz * 0.9, 0); g.lineTo(sz * 1.8, -sz * 0.6); g.lineTo(sz * 1.8, sz * 0.6); g.closePath(); g.fill();
      g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, sz, sz * 0.7, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(-sz * 0.4, -sz * 0.4, sz * 0.5, sz * 0.2);
    } else {
      // fantasmino: sale da dove e' morto (y dal tempo, non dalla fisica)
      var gx = V.sx(P.x[i]) + Math.sin(u * 9) * s * 0.15, gy = V.sy(P.a[i] + u * 2.2), r = sz;
      g.translate(gx, gy);
      g.fillStyle = INK; g.beginPath(); g.arc(0, 0, r + 1.5, Math.PI, 0); g.lineTo(r + 1.5, r * 1.2); g.lineTo(-r - 1.5, r * 1.2); g.closePath(); g.fill();
      g.fillStyle = '#f4f6fb'; g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.lineTo(r, r * 1.1);
      for (var w = 0; w < 4; w++) g.lineTo(r - (w + 0.5) * r / 2, r * (w % 2 ? 1.1 : 0.85));
      g.lineTo(-r, r * 1.1); g.closePath(); g.fill();
      g.fillStyle = INK; g.beginPath(); g.ellipse(-r * 0.35, -r * 0.1, r * 0.14, r * 0.2, 0, 0, TAU); g.ellipse(r * 0.35, -r * 0.1, r * 0.14, r * 0.2, 0, 0, TAU); g.fill();
    }
    g.restore();
  }
};
})();

