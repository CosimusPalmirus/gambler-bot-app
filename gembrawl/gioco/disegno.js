// GAMBLER BRAWL — disegno. Legge lo stato del motore e lo disegna; non lo modifica mai.
// Regole di prestazione: canvas 2D, sfondo della mappa precotto, sprite precotti per muri/cespugli/casse,
// pool per particelle, effetti e numeri (nessuna allocazione per fotogramma), niente shadowBlur né filtri.
(function () {
  'use strict';
  var NOMI_TESTA = /[?&]nomi=1/.test(location.search);
  var BARRA_A = (function () { var v = parseFloat(new URLSearchParams(location.search).get('barraalfa')); return v > 0 ? Math.min(1, v) : 0.8; })();
  var BARRA_K = (function () { var v = parseFloat(new URLSearchParams(location.search).get('barra')); return v > 0 ? v : 0.8; })();   // 22/11: altezza della barra vita sopra l'eroe (1 = come prima)
  var M = window.Motore, PI2 = Math.PI * 2;
  var FEEL_BARRA = (function () { try { var q = new URLSearchParams(location.search); return q.get('feel') !== '0' && q.get('feelbarra') !== '0'; } catch (e) { return true; } })();   // FEEL 21/11
  var COL = { io: '#5cff8a', blu: '#3fb3ff', rosso: '#ff4d5e', oro: '#ffd23f', bianco: '#ffffff' };
  var TEMI = [
    { pav: ['#2a0f3a', '#2f1242'], motivo: '#c9a227', muroTop: '#3d1f63', muroF1: '#5b2b8c', muroF2: '#24103a', neon: '#ff3df2', bordo: '#120618' },
    { pav: ['#3a0d18', '#420f1c'], motivo: '#ffd23f', muroTop: '#1f4a42', muroF1: '#2c6457', muroF2: '#0e2420', neon: '#ffd23f', bordo: '#14050a' },
    { pav: ['#15151f', '#191926'], motivo: '#00e5ff', muroTop: '#2c2c40', muroF1: '#26263a', muroF2: '#11111b', neon: '#00e5ff', bordo: '#08080e' },
    { pav: ['#262b33', '#2b313a'], motivo: '#f1c40f', muroTop: '#5d6d7e', muroF1: '#4a5a6b', muroF2: '#25303b', neon: '#f1c40f', bordo: '#0d1014' },
    { pav: ['#c98f58', '#d29a62'], motivo: '#ffd23f', muroTop: '#d98a5a', muroF1: '#b5532e', muroF2: '#6e2a16', neon: '#ff9a3d', bordo: '#3a1f2c' }   // 23/11 Canyon del Jackpot
  ];
  var HW = 0.55;      // altezza dei muri (caselle)
  var MAXPA = 420, MAXFX = 64, MAXNUM = 48;

  var D = {
    cv: null, ctx: null, W: 0, H: 0, dpr: 1, S: 32, Sd: 32, st: null, io: 0,
    sfondo: null, spr: {}, tema: TEMI[0], pad: 2,
    cam: { x: 0, y: 0, tx: 0, ty: 0, trauma: 0, zoom: 1, zp: 0, t: 0, kx: 0, ky: 0 },
    pa: [], fx: [], num: [], strCache: {}, vis: [],
    eroiV: [],   // stato visivo per eroe (pose, lampi, barra fantasma)
    buckets: [], colpoCassa: null, tempo: 0, vignetta: null, perf: false
  };

  // ---------------- utilità ----------------
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function str(n) { var s = D.strCache[n]; if (s === undefined) { s = String(n); D.strCache[n] = s; } return s; }
  function coloreEroe(id) { var c = window.GBR && GBR.get(id); return (c && c.colore) || '#ffffff'; }
  function colore2Eroe(id) { var c = window.GBR && GBR.get(id); return (c && c.colore2) || '#ffffff'; }
  function tagliaEroe(id) { var c = window.GBR && GBR.get(id); return (c && c.taglia) || 1; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function hash(c, r) { var h = (c * 374761393 + r * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

  D.init = function (cv) {
    D.tre = !!(window.R3 && window.R3.init);
    D.cv = cv; D.ctx = cv.getContext('2d', { alpha: D.tre });
    for (var i = 0; i < MAXPA; i++) D.pa.push({ on: 0, k: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, s: 1, c: '#fff', rot: 0, vr: 0, g: 0 });
    for (i = 0; i < MAXFX; i++) D.fx.push({ on: 0, k: '', x: 0, y: 0, a: 0, b: 0, c: 0, d: 0, life: 0, max: 1, col: '#fff', i: 0 });
    for (i = 0; i < MAXNUM; i++) D.num.push({ on: 0, x: 0, y: 0, s: '', col: '#fff', life: 0, max: 1, big: 0, vx: 0, val: 0, tgt: -9, src: -9 });
  };

  D.ridimensiona = function (W, H, dpr) {
    D.W = W; D.H = H; D.dpr = dpr;
    D.cv.width = Math.round(W * dpr); D.cv.height = Math.round(H * dpr);
    D.cv.style.width = W + 'px'; D.cv.style.height = H + 'px';
    // casella: in verticale ~12,5 caselle di larghezza, in orizzontale ~12 di altezza
    D.S = Math.max(22, Math.min(W / 12, H / 10.5, 96));
    // casella intera in pixel del dispositivo: muri, cespugli e casse si copiano 1:1 senza filtri
    D.S = Math.round(D.S * dpr) / dpr;
    D.vignetta = null; TC = {}; TCn = 0;
    if (D.tre) R3.ridimensiona(W, H, dpr);
    if (D.st) D.prepara(D.st, D.io);
  };

  // ---------------- precottura ----------------
  D.prepara = function (st, io) {
    D.st = st; D.io = io;
    D.tema = TEMI[st.M.tema || 0] || TEMI[0];
    D.Sd = Math.min(Math.round(D.S * D.dpr), 110);
    // lo sfondo si cuoce alla scala ESATTA dello schermo: così si copia 1:1 senza filtrare ogni pixel
    D.Sb = Math.min(D.S * D.dpr, 110);
    SPRC = {}; SPRCn = 0;
    D.colpoCassa = new Float32Array(st.w * st.h);
    D.colpoCassa.fill(-99);
    cuociSprite();
    if (D.tre) R3.prepara(st, io); else cuociSfondo(st);
    D.buckets.length = 0;
    for (var r = 0; r <= st.h + 1; r++) D.buckets.push([]);
    D.eroiV.length = 0;
    for (var i = 0; i < st.eroi.length; i++) D.eroiV.push({ shx: 0, shy: 0, dirCol: 0, tDir: -9, posa: 'idle', t0: 0, flash: -9, fant: st.eroi[i].vita, rinculo: 0, rx: 0, ry: 0, passoT: 0, supT: -9, ultimaVita: st.eroi[i].vita, viva: true, x: st.eroi[i].x, y: st.eroi[i].y, vista: 1 });
    var p0 = st.eroi[io];
    D.cam.x = D.cam.tx = p0.x; D.cam.y = D.cam.ty = p0.y + (st.modo === 'sopravvivenza' ? 0 : (p0.sq === 0 ? -2 : 2));
    if (window.GBR && GBR.prebake) { try { D.cottura = GBR.prebake(D.S * 1.4, D.dpr, st.eroi.map(function (h) { return h.id; })); } catch (e) { } }
  };

  function cuociSprite() {
    var S = D.Sd, T = D.tema, g, c, i;
    D.spr = {};
    // muro con faccia frontale e muro "pieno" (coperto da quello sotto)
    for (var v = 0; v < 2; v++) {
      c = mk(S, S * (1 + HW)); g = c.getContext('2d');
      var top = S * HW * 0 , fy = S;           // il cubo va da y=0 (cima) a y=S*(1+HW)
      // cima
      g.fillStyle = T.muroTop; g.fillRect(0, 0, S, S);
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, 0, S, S * 0.14);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, S * 0.5, S, S * 0.5);
      g.fillStyle = T.neon; g.globalAlpha = 0.35; g.fillRect(S * 0.46, S * 0.2, S * 0.08, S * 0.6); g.globalAlpha = 1;
      if (v === 0) {
        var gr = g.createLinearGradient(0, fy, 0, fy + S * HW);
        gr.addColorStop(0, T.muroF1); gr.addColorStop(1, T.muroF2);
        g.fillStyle = gr; g.fillRect(0, fy, S, S * HW);
        // dettaglio della faccia: schermo di slot / fregio
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(S * 0.18, fy + S * HW * 0.2, S * 0.64, S * HW * 0.45);
        g.fillStyle = T.neon; g.globalAlpha = 0.85;
        for (i = 0; i < 3; i++) g.fillRect(S * (0.24 + i * 0.2), fy + S * HW * 0.28, S * 0.12, S * HW * 0.29);
        g.globalAlpha = 1;
        g.fillStyle = T.neon; g.fillRect(0, fy, S, Math.max(1, S * 0.035));
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, fy + S * HW - Math.max(1, S * 0.05), S, Math.max(1, S * 0.05));
      }
      D.spr['muro' + v] = c;
    }
    // cespugli (3 varianti): palme in vaso / siepe di velluto
    for (v = 0; v < 3; v++) {
      c = mk(S, S * 1.4); g = c.getContext('2d');
      var oy = S * 0.4, n = 6;
      for (i = 0; i < n; i++) {
        var a = (i / n) * PI2 + v, rx = S * (0.5 + Math.cos(a) * 0.26), ry = oy + S * (0.52 + Math.sin(a) * 0.2);
        g.fillStyle = i % 2 ? '#1f7a3a' : '#25934a';
        g.beginPath(); g.ellipse(rx, ry - S * 0.08, S * 0.27, S * 0.3, 0, 0, PI2); g.fill();
      }
      g.fillStyle = '#2fb35a'; g.beginPath(); g.ellipse(S * 0.5, oy + S * 0.35, S * 0.34, S * 0.32, 0, 0, PI2); g.fill();
      g.fillStyle = 'rgba(180,255,170,0.35)';
      for (i = 0; i < 4; i++) { g.beginPath(); g.ellipse(S * (0.3 + 0.13 * i + v * 0.02), oy + S * (0.2 + (i % 2) * 0.12), S * 0.08, S * 0.05, -0.5, 0, PI2); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(S * 0.5, oy + S * 0.88, S * 0.42, S * 0.1, 0, 0, PI2); g.fill();
      D.spr['cesp' + v] = c;
    }
    // cassa di fiches (intera e incrinata): più piccola dei muri, rossa e oro, con la pila di fiches sopra
    for (v = 0; v < 2; v++) {
      c = mk(S, S * 1.3); g = c.getContext('2d');
      var y0 = S * 0.42, m0 = S * 0.1, cw = S * 0.8;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(m0 + S * 0.05, y0 + S * 0.86, cw, S * 0.06);
      g.fillStyle = '#c0283a'; g.fillRect(m0, y0, cw, S * 0.5);                  // cima
      g.fillStyle = '#7d1422'; g.fillRect(m0, y0 + S * 0.5, cw, S * 0.36);      // fronte
      g.fillStyle = '#ffd23f'; g.fillRect(m0, y0 + S * 0.5, cw, Math.max(1, S * 0.04));
      g.fillRect(m0 + cw * 0.45, y0 + S * 0.5, cw * 0.1, S * 0.36);
      g.strokeStyle = '#2a0610'; g.lineWidth = Math.max(1, S * 0.045); g.strokeRect(m0, y0, cw, S * 0.86);
      // pila di fiches
      for (i = 0; i < 3; i++) {
        var fy2 = y0 + S * 0.28 - i * S * 0.08;
        g.fillStyle = ['#1d3557', '#f1faee', '#2a9d8f'][i]; g.beginPath(); g.ellipse(S * 0.5, fy2, S * 0.2, S * 0.1, 0, 0, PI2); g.fill();
        g.strokeStyle = '#111'; g.lineWidth = Math.max(1, S * 0.025); g.stroke();
      }
      g.strokeStyle = '#fff'; g.setLineDash([S * 0.04, S * 0.04]); g.lineWidth = Math.max(1, S * 0.025);
      g.beginPath(); g.ellipse(S * 0.5, y0 + S * 0.12, S * 0.14, S * 0.065, 0, 0, PI2); g.stroke(); g.setLineDash([]);
      if (v === 1) {
        g.strokeStyle = '#1a0308'; g.lineWidth = Math.max(1, S * 0.04);
        g.beginPath(); g.moveTo(S * 0.25, y0 + S * 0.5); g.lineTo(S * 0.36, y0 + S * 0.68); g.lineTo(S * 0.3, y0 + S * 0.86);
        g.moveTo(S * 0.78, y0 + S * 0.05); g.lineTo(S * 0.66, y0 + S * 0.3); g.stroke();
      }
      D.spr['cassa' + v] = c;
    }
    // gemma
    c = mk(S * 0.6, S * 0.6); g = c.getContext('2d');
    var q = S * 0.3;
    g.fillStyle = '#b44dff'; g.beginPath(); g.moveTo(q, q * 0.1); g.lineTo(q * 1.8, q * 0.75); g.lineTo(q, q * 1.9); g.lineTo(q * 0.2, q * 0.75); g.closePath(); g.fill();
    g.fillStyle = '#e3b5ff'; g.beginPath(); g.moveTo(q, q * 0.1); g.lineTo(q * 1.8, q * 0.75); g.lineTo(q, q * 0.9); g.lineTo(q * 0.2, q * 0.75); g.closePath(); g.fill();
    g.strokeStyle = '#3d0a66'; g.lineWidth = Math.max(1, S * 0.03); g.beginPath(); g.moveTo(q, q * 0.1); g.lineTo(q * 1.8, q * 0.75); g.lineTo(q, q * 1.9); g.lineTo(q * 0.2, q * 0.75); g.closePath(); g.stroke();
    D.spr.gemma = c;
  }

  function cuociSfondo(st) {
    var S = D.Sb, T = D.tema, pad = D.pad, w = st.w, h = st.h;
    var c = mk((w + pad * 2) * S, (h + pad * 2) * S), g = c.getContext('2d'), r, k, x, y;
    g.fillStyle = T.bordo; g.fillRect(0, 0, c.width, c.height);
    // pavimento
    for (r = 0; r < h; r++) for (k = 0; k < w; k++) {
      x = Math.round((k + pad) * S); y = Math.round((r + pad) * S);
      g.fillStyle = T.pav[(r + k) & 1]; g.fillRect(x, y, Math.round((k + 1 + pad) * S) - x, Math.round((r + 1 + pad) * S) - y);
    }
    // motivo del tappeto: rombi dorati sugli incroci
    g.strokeStyle = T.motivo; g.globalAlpha = 0.22; g.lineWidth = Math.max(1, S * 0.03);
    for (r = 0; r <= h; r += 2) for (k = 0; k <= w; k += 2) {
      x = (k + pad) * S; y = (r + pad) * S;
      g.beginPath(); g.moveTo(x, y - S * 0.35); g.lineTo(x + S * 0.35, y); g.lineTo(x, y + S * 0.35); g.lineTo(x - S * 0.35, y); g.closePath(); g.stroke();
    }
    g.globalAlpha = 0.1;
    for (r = 1; r < h; r += 2) for (k = 1; k < w; k += 2) { x = (k + pad) * S; y = (r + pad) * S; g.fillStyle = T.motivo; g.beginPath(); g.arc(x, y, S * 0.07, 0, PI2); g.fill(); }
    g.globalAlpha = 1;
    // nascite (luce della squadra)
    if (st.modo !== 'sopravvivenza') {
      for (var s = 0; s < 2; s++) {
        var lista = st.M.sp[s], colr = s === 0 ? COL.blu : COL.rosso;
        for (var j = 0; j < lista.length; j++) {
          x = (lista[j].x + pad) * S; y = (lista[j].y + pad) * S;
          var gr = g.createRadialGradient(x, y, 0, x, y, S * 1.6);
          gr.addColorStop(0, colr); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.globalAlpha = 0.28; g.fillStyle = gr; g.fillRect(x - S * 1.6, y - S * 1.6, S * 3.2, S * 3.2); g.globalAlpha = 1;
          g.strokeStyle = colr; g.lineWidth = Math.max(1, S * 0.05); g.globalAlpha = 0.6;
          g.beginPath(); g.ellipse(x, y, S * 0.45, S * 0.3, 0, 0, PI2); g.stroke(); g.globalAlpha = 1;
        }
      }
    }
    // miniera delle gemme
    if (st.M.gem) {
      x = (st.M.gem.x + pad) * S; y = (st.M.gem.y + pad) * S;
      g.fillStyle = '#1a0a26'; g.beginPath(); g.ellipse(x, y, S * 0.9, S * 0.65, 0, 0, PI2); g.fill();
      g.strokeStyle = '#b44dff'; g.lineWidth = Math.max(2, S * 0.08); g.beginPath(); g.ellipse(x, y, S * 0.9, S * 0.65, 0, 0, PI2); g.stroke();
      g.strokeStyle = '#ffd23f'; g.lineWidth = Math.max(1, S * 0.03); g.setLineDash([S * 0.1, S * 0.08]);
      g.beginPath(); g.ellipse(x, y, S * 1.25, S * 0.9, 0, 0, PI2); g.stroke(); g.setLineDash([]);
    }
    // tavoli verdi (bloccano il passo, non i colpi): panno con bordo di legno sui lati liberi
    for (r = 0; r < h; r++) for (k = 0; k < w; k++) {
      if (st.g[r * w + k] !== M.TAVOLO) continue;
      x = (k + pad) * S; y = (r + pad) * S;
      var su = r > 0 && st.g[(r - 1) * w + k] === M.TAVOLO, giu = r < h - 1 && st.g[(r + 1) * w + k] === M.TAVOLO;
      var sx = k > 0 && st.g[r * w + k - 1] === M.TAVOLO, dx = k < w - 1 && st.g[r * w + k + 1] === M.TAVOLO;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + S * 0.08, y + S * 0.16, S, S);
      g.fillStyle = '#5a2e12'; g.fillRect(x, y, S, S);
      var m = S * 0.16;
      g.fillStyle = '#137a3c';
      g.fillRect(x + (sx ? 0 : m), y + (su ? 0 : m), S - (sx ? 0 : m) - (dx ? 0 : m), S - (su ? 0 : m) - (giu ? 0 : m));
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x + (sx ? 0 : m), y + (su ? 0 : m), S - (sx ? 0 : m) - (dx ? 0 : m), S * 0.12);
      if (!giu) { g.fillStyle = '#3a1c08'; g.fillRect(x, y + S - S * 0.06, S, S * 0.06); }
      // carte e fiche sparse
      var hh = hash(k, r);
      if (hh < 0.35) { g.fillStyle = '#fff'; g.save(); g.translate(x + S * 0.5, y + S * 0.5); g.rotate(hh * 6); g.fillRect(-S * 0.12, -S * 0.17, S * 0.24, S * 0.34); g.fillStyle = '#c0392b'; g.fillRect(-S * 0.05, -S * 0.05, S * 0.1, S * 0.1); g.restore(); }
      else if (hh < 0.6) { g.fillStyle = hh < 0.48 ? '#e63946' : '#1d3557'; g.beginPath(); g.ellipse(x + S * 0.4, y + S * 0.5, S * 0.14, S * 0.1, 0, 0, PI2); g.fill(); }
    }
    // ombre di contatto dei muri e delle casse sul pavimento
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (r = 0; r < h; r++) for (k = 0; k < w; k++) {
      var t = st.g[r * w + k];
      if (t === M.MURO) { x = (k + pad) * S; y = (r + pad) * S; g.fillRect(x + S * 0.12, y + S, S, S * 0.22); }
    }
    // bordo neon della mappa
    g.strokeStyle = T.neon; g.lineWidth = Math.max(2, S * 0.06); g.globalAlpha = 0.8;
    g.strokeRect(pad * S - S * 0.04, pad * S - S * 0.04, w * S + S * 0.08, h * S + S * 0.08); g.globalAlpha = 1;
    D.sfondo = c;
  }

  // ---------------- camera ----------------
  D.scuoti = function (q) { if (D.tre) R3.scuoti(q); D.cam.trauma = Math.min(1, D.cam.trauma + q); };
  D.zoomPugno = function (q) { if (D.tre) R3.zoomPugno(q); D.cam.zp = Math.max(D.cam.zp, q); };
  D.calcio = function (ax, ay, q) { if (D.tre) R3.calcio(ax, ay, q); D.cam.kx -= ax * q; D.cam.ky -= ay * q; };

  D.aggiornaCamera = function (dt, mx, my, guarda) {
    if (D.tre) { R3.aggiornaCamera(dt, mx, my, guarda); return; }
    var st = D.st, p = st.eroi[D.io], c = D.cam, ev = D.eroiV[D.io];
    var px = ev.x, py = ev.y;
    var off = 0;
    if (st.modo !== 'sopravvivenza') off = (p.sq === 0 ? -1 : 1) * (D.W > D.H ? 1.6 : 2.2);
    var tx = px + (guarda ? mx : 0), ty = py + off + (guarda ? my : 0);
    // non oltre i bordi della mappa (con un margine)
    var vw = D.W / D.S / 2, vh = D.H / D.S / 2;
    tx = vw * 2 >= st.w + 2 ? st.w / 2 : Math.max(vw - 1, Math.min(st.w + 1 - vw, tx));
    ty = vh * 2 >= st.h + 2 ? st.h / 2 : Math.max(vh - 1.5, Math.min(st.h + 1.5 - vh, ty));
    var k = 1 - Math.exp(-dt * 7);
    c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
    c.trauma = Math.max(0, c.trauma - dt * 1.7);
    c.zp = Math.max(0, c.zp - dt * 0.6);
    c.kx *= Math.exp(-dt * 18); c.ky *= Math.exp(-dt * 18);
    c.t += dt;
    c.zoom = 1 + c.zp;
  };

  // ---------------- effetti (pool) ----------------
  function particella(k, x, y, z, vx, vy, vz, life, s, c) {
    for (var i = 0; i < MAXPA; i++) {
      var p = D.pa[D._pc = (D._pc + 1) % MAXPA];
      if (!p.on) { p.on = 1; p.k = k; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.max = life; p.s = s; p.c = c; p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 20; p.g = 0; return p; }
    }
    return null;
  }
  D._pc = 0;
  function effetto(k, x, y, a, b, c, d, life, col, i) {
    for (var n = 0; n < MAXFX; n++) {
      var f = D.fx[n];
      if (!f.on) { f.on = 1; f.k = k; f.x = x; f.y = y; f.a = a; f.b = b; f.c = c; f.d = d; f.life = life; f.max = life; f.col = col; f.i = i | 0; return f; }
    }
    return null;
  }
  // i colpi ravvicinati dello stesso tiratore sullo stesso bersaglio si sommano in un numero solo
  function numero(x, y, val, col, big, tgt, src) {
    var n, q;
    if (typeof val === 'number' && tgt != null) {
      for (n = 0; n < MAXNUM; n++) {
        q = D.num[n];
        if (q.on && q.tgt === tgt && q.src === src && q.max - q.life < 0.45) {
          q.val += val; q.s = str(q.val); q.life = q.max; q.x = x; q.y = y; q.big = Math.max(q.big, big); q.col = col; return;
        }
      }
    }
    // [fable gioco] piu' numeri vivi sullo stesso bersaglio (tiratori diversi): si aprono a ventaglio invece di accavallarsi
    var gia = 0;
    if (tgt != null && tgt >= 0) for (n = 0; n < MAXNUM; n++) if (D.num[n].on && D.num[n].tgt === tgt) gia++;
    for (n = 0; n < MAXNUM; n++) {
      q = D.num[n];
      if (!q.on) { q.on = 1; q.alto = tgt != null && tgt >= 0 ? 1 : 0; q.x = x + (Math.random() - 0.5) * 0.3 + (gia ? ((gia % 2) ? 0.55 : -0.55) * Math.ceil(gia / 2) : 0); q.y = y; q.val = typeof val === 'number' ? val : 0; q.s = typeof val === 'number' ? str(val) : val; q.col = col; q.life = 0.85; q.max = 0.85; q.big = big; q.vx = (Math.random() - 0.5) * 0.8; q.tgt = tgt == null ? -9 : tgt; q.src = src == null ? -9 : src; return; }
    }
  }
  D.particella = particella; D.numero = numero;
  // in 3D gli effetti a terra li disegna R3; restano 2D solo i lampi di schermo
  D.effetto = function (k, x, y, a, b, c, d, life, col, i) {
    if (D.tre) {
      if (k === 'fendente') return R3.effetto('fendente', x, y, a, c, col, life, b);
      if (k === 'onda') return R3.effetto('disco', x, y, a, 0, col, life);
      if (k === 'colonna') return R3.effetto('colonna', x, y, 1, 0, col, life);
      if (k === 'lancia') return R3.effetto('lancia', x, y, a, b, col, life);
      if (k === 'fauci') return R3.effetto('fauci', x, y, a, b, col, life);
      if (k !== 'lampoSchermo') return null;
    }
    return effetto(k, x, y, a, b, c, d, life, col, i);
  };

  // scintille in un cono
  D.scintille = function (x, y, ang, n, col, vel) {
    for (var i = 0; i < n; i++) {
      var a = ang + (Math.random() - 0.5) * 1.6, v = (vel || 7) * (0.5 + Math.random());
      particella(0, x, y, 0.5, Math.cos(a) * v, Math.sin(a) * v, 0, 0.18 + Math.random() * 0.15, 1, col);
    }
  };
  D.fiches = function (x, y, n, forza) {
    if (D.tre) { R3.fiches(x, y, n, forza); return; }
    var cc = ['#e63946', '#1d3557', '#f1faee', '#2a9d8f', '#ffd23f', '#111'];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * PI2, v = (1 + Math.random() * 3.5) * (forza || 1);
      particella(2, x, y, 0.6, Math.cos(a) * v, Math.sin(a) * v * 0.8, 3 + Math.random() * 5, 0.9 + Math.random() * 0.6, 0.16 + Math.random() * 0.06, cc[i % cc.length]);
    }
  };
  D.fumo = function (x, y, n, col, s) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * PI2, v = 0.4 + Math.random() * 1.4;
      particella(3, x + Math.cos(a) * 0.2, y + Math.sin(a) * 0.2, 0.2, Math.cos(a) * v, Math.sin(a) * v * 0.7, 0.3, 0.4 + Math.random() * 0.3, (s || 0.35) * (0.7 + Math.random() * 0.6), col || 'rgba(230,220,255,1)');
    }
  };
  D.anello = function (x, y, r, col, life) { if (D.tre) { R3.effetto('anello', x, y, r, 0, col, life || 0.35); return; } effetto('anello', x, y, r, 0, 0, 0, life || 0.35, col); };
  D.lampo = function (x, y, r, col) { particella(5, x, y, 0, 0, 0, 0, 0.09, r, col || '#fff'); };
  D.bossolo = function (x, y, ang) {
    var a = ang + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) + Math.PI + (Math.random() - 0.5);
    particella(1, x, y, 0.55, Math.cos(a) * 2, Math.sin(a) * 1.4, 2.5 + Math.random() * 2, 0.7, 0.07, '#e9c46a');
  };

  // ---------------- disegno del mondo ----------------
  var _px = 0, _pr = { x: 0, y: 0, z: 0 };
  function wx(x) { if (D.tre) { _px = x; return R3.proietta(x, D._py, 0, _pr).x; } return (x - D.cam.x) * D.S * D.cam.zoom + D.W / 2 + D._shx; }
  function wy(y, h) { if (D.tre) { return R3.proietta(_px, y, h || 0, _pr).y; } return (y - D.cam.y) * D.S * D.cam.zoom + D.H / 2 + D._shy; }
  D._py = 0;
  var _lastY = 0;
  // proietta un punto a terra (x,y) e restituisce la X; la Y si legge subito dopo con py2()
  function px2(x, y) { if (D.tre) { R3.proietta(x, y, 0, _pr); _lastY = _pr.y; return _pr.x; } _lastY = wy(y); return wx(x); }
  function py2() { return _lastY; }
  D.px2 = px2; D.py2 = py2;
  D._shx = 0; D._shy = 0;
  D.wx = wx; D.wy = wy;

  D.frame = function (alpha, dt, mira) {
    var g = D.ctx, st = D.st, S = D.S, c = D.cam, i, j;
    D.tempo += dt;
    if (D.tre) {
      // il mondo lo disegna Three.js; qui solo l'interfaccia sopra (barre, numeri, scintille, frecce)
      for (i = 0; i < st.eroi.length; i++) {
        var hh = st.eroi[i], vv = D.eroiV[i];
        vv.x = hh.ox + (hh.x - hh.ox) * alpha; vv.y = hh.oy + (hh.y - hh.oy) * alpha;
        if (hh.salT <= 0 && hh.tirT <= 0 && Math.abs(hh.x - hh.ox) > 2) { vv.x = hh.x; vv.y = hh.y; }
        vv.vista = R3.eroi[i] ? R3.eroi[i].vista : 1;
      }
      R3.miraOn = D.miraOn; R3.miraAng = D.miraAng;
      R3.frame(alpha, dt, mira, D.tempo);
      D.S = R3.scala();
      g.setTransform(D.dpr, 0, 0, D.dpr, 0, 0);
      g.clearRect(0, 0, D.W, D.H);
      var Z3 = D.S;
      var SK3 = D.salta || {};
      disegnaFx(g, st, Z3, dt);
      if (!SK3.part) disegnaParticelle(g, Z3, dt);
      if (!SK3.teste) { disegnaTesteEroi(g, st, Z3); disegnaNumeri(g, Z3, dt); }
      disegnaFuoriSchermo(g, st, Z3);
      return;
    }
    var sh = c.trauma * c.trauma, n = c.t * 31;
    D._shx = (Math.sin(n * 1.7) + Math.sin(n * 2.9) * 0.5) * 9 * sh + c.kx;
    D._shy = (Math.sin(n * 2.3) + Math.sin(n * 3.7) * 0.5) * 7 * sh + c.ky;
    g.setTransform(D.dpr, 0, 0, D.dpr, 0, 0);
    var Z = S * c.zoom;
    // sfondo (solo la parte visibile)
    g.fillStyle = D.tema.bordo; g.fillRect(0, 0, D.W, D.H);
    var x0 = c.x - D.W / 2 / Z - D._shx / Z, y0 = c.y - D.H / 2 / Z - D._shy / Z;
    var esatto = c.zoom === 1 && Math.abs(D.Sb - S * D.dpr) < 0.001;
    if (esatto) {
      // copia 1:1 in pixel del dispositivo, a coordinate intere: la strada più veloce anche senza GPU
      g.setTransform(1, 0, 0, 1, 0, 0);
      var bx = Math.round((x0 + D.pad) * D.Sb), by = Math.round((y0 + D.pad) * D.Sb), cw = D.cv.width, ch = D.cv.height;
      var sx0 = Math.max(0, bx), sy0 = Math.max(0, by), sx1 = Math.min(D.sfondo.width, bx + cw), sy1 = Math.min(D.sfondo.height, by + ch);
      if (sx1 > sx0 && sy1 > sy0) g.drawImage(D.sfondo, sx0, sy0, sx1 - sx0, sy1 - sy0, sx0 - bx, sy0 - by, sx1 - sx0, sy1 - sy0);
      g.setTransform(D.dpr, 0, 0, D.dpr, 0, 0);
      // il pezzo dello sfondo copiato ha spostato il centro di meno di un pixel: allinea il mondo allo stesso arrotondamento
      D._shx += ((x0 + D.pad) * D.Sb - bx) / D.dpr; D._shy += ((y0 + D.pad) * D.Sb - by) / D.dpr;
    } else {
      var Sd = D.Sb, sx = (x0 + D.pad) * Sd, sy = (y0 + D.pad) * Sd, sw = D.W / Z * Sd, shh = D.H / Z * Sd;
      var dx = 0, dy = 0, dw = D.W, dh = D.H;
      if (sx < 0) { dx = -sx / Sd * Z; dw -= dx; sw += sx; sx = 0; }
      if (sy < 0) { dy = -sy / Sd * Z; dh -= dy; shh += sy; sy = 0; }
      if (sx + sw > D.sfondo.width) { var ex = sx + sw - D.sfondo.width; sw -= ex; dw -= ex / Sd * Z; }
      if (sy + shh > D.sfondo.height) { var ey = sy + shh - D.sfondo.height; shh -= ey; dh -= ey / Sd * Z; }
      if (sw > 0 && shh > 0) g.drawImage(D.sfondo, sx, sy, sw, shh, dx, dy, dw, dh);
    }

    // posizioni interpolate degli eroi
    for (i = 0; i < st.eroi.length; i++) {
      var h = st.eroi[i], v = D.eroiV[i];
      v.x = h.ox + (h.x - h.ox) * alpha; v.y = h.oy + (h.y - h.oy) * alpha;
      if (h.salT <= 0 && h.tirT <= 0 && Math.abs(h.x - h.ox) > 2) { v.x = h.x; v.y = h.y; }
    }

    var SK = D.salta || {};
    if (!SK.terra) disegnaTerra(g, st, Z, dt);
    if (mira) disegnaMira(g, st, mira, Z);

    // righe visibili, ordinate in profondità
    var r0 = Math.max(-1, Math.floor(y0) - 1), r1 = Math.min(st.h, Math.ceil(y0 + D.H / Z) + 1);
    var c0 = Math.max(-1, Math.floor(x0)), c1 = Math.min(st.w, Math.ceil(x0 + D.W / Z));
    for (i = 0; i < D.buckets.length; i++) D.buckets[i].length = 0;
    for (i = 0; i < st.eroi.length; i++) {
      var hv = D.eroiV[i], br = Math.floor(hv.y);
      if (br >= 0 && br < st.h) D.buckets[br].push(i);
    }
    for (i = 0; i < st.tu.length; i++) if (st.tu[i].vivo) { var tb = Math.floor(st.tu[i].y); if (tb >= 0 && tb < st.h) D.buckets[tb].push(100 + i); }
    for (i = 0; i < st.ge.length; i++) if (st.ge[i].vivo) { var gb = Math.floor(st.ge[i].y); if (gb >= 0 && gb < st.h) D.buckets[gb].push(200 + i); }

    for (var r = r0; r <= r1; r++) {
      // entità della riga
      if (r >= 0 && r < st.h) {
        var b = D.buckets[r];
        for (j = 0; j < b.length; j++) {
          var id = b[j];
          if (id >= 200) disegnaGemma(g, st.ge[id - 200], Z);
          else if (id >= 100) disegnaTorretta(g, st, st.tu[id - 100], Z);
          else if (!SK.eroi) disegnaEroe(g, st, id, Z, dt);
        }
      }
      // blocchi della riga
      for (var k = c0; k <= c1 && !SK.blocchi; k++) {
        var t = muroA(st, k, r) ? M.MURO : ((r < 0 || k < 0 || r >= st.h || k >= st.w) ? -1 : st.g[r * st.w + k]);
        if (t === M.MURO) {
          var sotto = muroA(st, k, r + 1) ? 1 : 0;
          blit(g, D.spr['muro' + sotto], wx(k), wy(r - HW), Z, Z * (1 + HW));
        } else if (t === M.CASSA) {
          var kk = r * st.w + k, rotta = st.vc[kk] < M.VITA_CASSA * 0.5 ? 1 : 0, tc = D.tempo - D.colpoCassa[kk], scx = 0;
          if (tc < 0.18) scx = Math.sin(tc * 90) * Z * 0.05 * (1 - tc / 0.18);
          blit(g, D.spr['cassa' + rotta], wx(k) + scx, wy(r - 0.3), Z, Z * 1.3);
          if (tc < 0.08) { g.globalAlpha = 0.6 * (1 - tc / 0.08); g.fillStyle = '#fff'; g.fillRect(wx(k) + Z * 0.06 + scx, wy(r), Z * 0.88, Z * 0.96); g.globalAlpha = 1; }
        } else if (t === M.CESP) {
          // trasparente se ci sono dentro io o un alleato
          var dentro = cespuglioOccupato(st, k, r);
          if (dentro) g.globalAlpha = 0.45;
          blit(g, D.spr['cesp' + ((k * 7 + r * 13) % 3)], wx(k), wy(r - 0.4), Z, Z * 1.4);
          if (dentro) g.globalAlpha = 1;
        }
      }
    }

    if (!SK.proj) disegnaProiettiliScie(g, st, Z, alpha);
    disegnaFx(g, st, Z, dt);
    if (!SK.part) disegnaParticelle(g, Z, dt);
    disegnaGas(g, st, Z);
    if (!SK.teste) disegnaTesteEroi(g, st, Z);
    disegnaNumeri(g, Z, dt);
    disegnaFuoriSchermo(g, st, Z);
  };

  // copia di uno sprite: 1:1 a pixel interi quando la camera non zooma (via veloce anche senza GPU)
  function blit(g, spr, x, y, w, h) {
    if (D.cam.zoom === 1 && spr.width === D.Sd) {
      var d = D.dpr;
      g.drawImage(spr, Math.round(x * d) / d, Math.round(y * d) / d, spr.width / d, spr.height / d);
    } else g.drawImage(spr, x, y, w + 0.5, h + 0.5);
  }

  // muro vero o anello di muri attorno alla mappa
  function muroA(st, k, r) {
    if (r < -1 || k < -1 || r > st.h || k > st.w) return false;
    if (r === -1 || k === -1 || r === st.h || k === st.w) return true;
    return st.g[r * st.w + k] === M.MURO;
  }

  function cespuglioOccupato(st, k, r) {
    var me = st.eroi[D.io];
    for (var i = 0; i < st.eroi.length; i++) {
      var h = st.eroi[i];
      if (!h.vivo || h.sq !== me.sq) continue;
      if (Math.abs(h.x - (k + 0.5)) < 1.6 && Math.abs(h.y - (r + 0.5)) < 1.6 && h.nasc) return true;
    }
    return false;
  }

  // ---------------- terra: zone, ombre, bersagli dei lob, mine ----------------
  function disegnaTerra(g, st, Z, dt) {
    var i, z, me = st.eroi[D.io];
    for (i = 0; i < st.zo.length; i++) {
      z = st.zo[i];
      if (!z.vivo) continue;
      var X = wx(z.x), Y = wy(z.y), R = z.r * Z, amico = z.sq === me.sq;
      if (z.tipo === 2) {
        // colpo orbitale in arrivo: mirino che si stringe
        var f = z.t / z.T;
        g.strokeStyle = amico ? COL.oro : COL.rosso; g.lineWidth = 3;
        g.globalAlpha = 0.35 + 0.5 * f;
        g.beginPath(); g.ellipse(X, Y, R, R * 0.7, 0, 0, PI2); g.stroke();
        g.beginPath(); g.ellipse(X, Y, R * (1 - f * 0.8), R * 0.7 * (1 - f * 0.8), 0, 0, PI2); g.stroke();
        g.globalAlpha = 0.12 + 0.2 * f; g.fillStyle = amico ? COL.oro : COL.rosso;
        g.beginPath(); g.ellipse(X, Y, R, R * 0.7, 0, 0, PI2); g.fill();
        g.globalAlpha = 1;
        continue;
      }
      var col = z.tipo === 1 ? '#5cff8a' : (z.vamp ? '#c0392b' : '#a24bff');
      var pul = 0.5 + 0.5 * Math.sin(D.tempo * 8 + i);
      g.globalAlpha = 0.18 + 0.06 * pul; g.fillStyle = col;
      g.beginPath(); g.ellipse(X, Y, R, R * 0.72, 0, 0, PI2); g.fill();
      g.globalAlpha = 0.7; g.strokeStyle = col; g.lineWidth = 2.5;
      g.setLineDash([8, 6]); g.lineDashOffset = -D.tempo * 30;
      g.beginPath(); g.ellipse(X, Y, R, R * 0.72, 0, 0, PI2); g.stroke();
      g.setLineDash([]); g.globalAlpha = 1;
      // simboli che salgono
      if (Math.random() < dt * 14) particella(z.tipo === 1 ? 7 : 3, z.x + (Math.random() - 0.5) * z.r * 1.4, z.y + (Math.random() - 0.5) * z.r, 0.1, 0, 0, 1.2, 0.6, 0.18, col);
    }
    // ombre degli eroi
    for (i = 0; i < st.eroi.length; i++) {
      var h = st.eroi[i], v = D.eroiV[i];
      if (!h.vivo || v.vista <= 0.01) continue;
      var sz = tagliaEroe(h.id) * (1 - h.z * 0.3);
      g.globalAlpha = 0.35 * v.vista; g.fillStyle = '#000';
      g.beginPath(); g.ellipse(wx(v.x), wy(v.y) + Z * 0.04, Z * 0.36 * sz, Z * 0.15 * sz, 0, 0, PI2); g.fill();
      g.globalAlpha = 1;
      if (i === D.io && D.tempo - v.tDir < 0.7) {
        var fa = 1 - (D.tempo - v.tDir) / 0.7;
        g.strokeStyle = COL.rosso; g.lineWidth = 5; g.globalAlpha = fa;
        g.beginPath(); g.ellipse(wx(v.x), wy(v.y), Z * 0.9, Z * 0.5, 0, v.dirCol - 0.55, v.dirCol + 0.55); g.stroke();
        g.globalAlpha = 1;
      }
      // anello di squadra sotto i piedi
      var colS = i === D.io ? COL.io : (h.sq === me.sq ? COL.blu : COL.rosso);
      g.strokeStyle = colS; g.lineWidth = i === D.io ? 3 : 2; g.globalAlpha = 0.85 * v.vista;
      g.beginPath(); g.ellipse(wx(v.x), wy(v.y), Z * 0.42 * sz, Z * 0.19 * sz, 0, 0, PI2); g.stroke();
      if (h.sup >= 1) {
        g.strokeStyle = COL.oro; g.lineWidth = 2; g.globalAlpha = (0.5 + 0.5 * Math.sin(D.tempo * 10)) * v.vista;
        g.beginPath(); g.ellipse(wx(v.x), wy(v.y), Z * 0.52 * sz, Z * 0.25 * sz, 0, 0, PI2); g.stroke();
      }
      g.globalAlpha = 1;
    }
    // bersagli dei lob in volo
    for (i = 0; i < st.pr.length; i++) {
      var p = st.pr[i];
      if (!p.vivo || p.k !== 1) continue;
      var amicoP = p.sq === me.sq, X2 = wx(p.tx), Y2 = wy(p.ty), R2 = p.area * Z, ff = p.t / p.T;
      g.strokeStyle = amicoP ? 'rgba(255,255,255,0.55)' : COL.rosso; g.lineWidth = 2;
      g.globalAlpha = 0.4 + ff * 0.5;
      g.beginPath(); g.ellipse(X2, Y2, R2, R2 * 0.7, 0, 0, PI2); g.stroke();
      g.globalAlpha = 0.1 + ff * 0.2; g.fillStyle = amicoP ? '#fff' : COL.rosso;
      g.beginPath(); g.ellipse(X2, Y2, R2 * ff, R2 * 0.7 * ff, 0, 0, PI2); g.fill();
      g.globalAlpha = 1;
    }
    // mine (visibili solo a chi le ha piazzate e ai suoi)
    for (i = 0; i < st.tu.length; i++) {
      var tu = st.tu[i];
      if (!tu.vivo || tu.tipo !== 1) continue;
      var mia = tu.sq === me.sq;
      g.globalAlpha = mia ? 0.9 : 0.18;
      disegnaZucchetta(g, wx(tu.x), wy(tu.y), Z * 0.35, tu.arm > 0);
      g.globalAlpha = 1;
    }
  }

  function disegnaZucchetta(g, X, Y, r, spenta) {
    g.fillStyle = '#e67e22'; g.beginPath(); g.ellipse(X, Y - r * 0.6, r, r * 0.8, 0, 0, PI2); g.fill();
    g.strokeStyle = '#7a3a06'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(X, Y - r * 0.6, r * 0.45, r * 0.8, 0, 0, PI2); g.stroke();
    g.fillStyle = spenta ? '#3a1c08' : '#ffef5a';
    g.beginPath(); g.moveTo(X - r * 0.5, Y - r * 0.7); g.lineTo(X - r * 0.2, Y - r * 0.9); g.lineTo(X - r * 0.2, Y - r * 0.6); g.fill();
    g.beginPath(); g.moveTo(X + r * 0.5, Y - r * 0.7); g.lineTo(X + r * 0.2, Y - r * 0.9); g.lineTo(X + r * 0.2, Y - r * 0.6); g.fill();
    g.fillStyle = '#1d8348'; g.fillRect(X - r * 0.1, Y - r * 1.55, r * 0.2, r * 0.35);
  }

  function disegnaGemma(g, ge, Z) {
    var X = wx(ge.x), Y = wy(ge.y), b = Math.sin(D.tempo * 5 + ge.x) * Z * 0.06, s = Z * 0.55;
    if (ge.t < 0.5) b -= Math.sin(Math.PI * ge.t / 0.5) * Z * (ge.o ? 0.45 : 0.8);   // GEMME 22/11: saltello quando esce dalla miniera / cade dal KO
    g.globalAlpha = 0.3; g.fillStyle = '#000'; g.beginPath(); g.ellipse(X, Y + Z * 0.05, Z * 0.2, Z * 0.08, 0, 0, PI2); g.fill(); g.globalAlpha = 1;
    g.drawImage(D.spr.gemma, X - s / 2, Y - s - Z * 0.12 + b, s, s);
    if (((D.tempo * 3 + ge.x) % 1) < 0.08) { g.fillStyle = '#fff'; g.fillRect(X - 1, Y - s * 0.9 + b, 2, 2); }
  }

  function disegnaTorretta(g, st, tu, Z) {
    if (tu.tipo !== 0) return;
    var X = wx(tu.x), Y = wy(tu.y), me = st.eroi[D.io], col = tu.sq === me.sq ? COL.blu : COL.rosso;
    var hit = D.tempo - (D._colTorr && D._colTorr[tu.ow] || -9);
    g.globalAlpha = 0.35; g.fillStyle = '#000'; g.beginPath(); g.ellipse(X, Y + 2, Z * 0.42, Z * 0.16, 0, 0, PI2); g.fill(); g.globalAlpha = 1;
    g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.ellipse(X, Y, Z * 0.45, Z * 0.2, 0, 0, PI2); g.stroke();
    var c1 = coloreEroe(tu.eroe), c2 = colore2Eroe(tu.eroe);
    if (tu.eroe === 'pizzaiolo') {
      // forno a cupola
      g.fillStyle = '#9c5a32'; g.beginPath(); g.arc(X, Y - Z * 0.25, Z * 0.42, Math.PI, 0); g.lineTo(X + Z * 0.42, Y); g.lineTo(X - Z * 0.42, Y); g.fill();
      g.fillStyle = '#2b1206'; g.beginPath(); g.arc(X, Y - Z * 0.12, Z * 0.18, Math.PI, 0); g.fill();
      g.fillStyle = (Math.sin(D.tempo * 20) > 0) ? '#ff9f1c' : '#ffd23f'; g.beginPath(); g.arc(X, Y - Z * 0.12, Z * 0.1, Math.PI, 0); g.fill();
    } else {
      // slot machine
      g.fillStyle = c1; rr(g, X - Z * 0.3, Y - Z * 0.95, Z * 0.6, Z * 0.95, Z * 0.1); g.fill();
      g.strokeStyle = '#111'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#111'; g.fillRect(X - Z * 0.22, Y - Z * 0.75, Z * 0.44, Z * 0.26);
      var sp = Math.floor(D.tempo * 12);
      for (var i = 0; i < 3; i++) { g.fillStyle = ['#ff4d5e', '#ffd23f', '#5cff8a'][(sp + i) % 3]; g.fillRect(X - Z * 0.19 + i * Z * 0.14, Y - Z * 0.72, Z * 0.1, Z * 0.2); }
      g.strokeStyle = c2; g.lineWidth = 3; g.beginPath(); g.moveTo(X + Z * 0.3, Y - Z * 0.6); g.lineTo(X + Z * 0.45, Y - Z * 0.85); g.stroke();
      g.fillStyle = '#ff4d5e'; g.beginPath(); g.arc(X + Z * 0.45, Y - Z * 0.88, Z * 0.07, 0, PI2); g.fill();
    }
    // barra della vita
    var f = Math.max(0, tu.vita / tu.vmax), bw = Z * 0.7;
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(X - bw / 2 - 1, Y - Z * 1.18 - 1, bw + 2, 6);
    g.fillStyle = col; g.fillRect(X - bw / 2, Y - Z * 1.18, bw * f, 4);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(X - bw / 2, Y - Z * 1.18 + 4, bw * (tu.dur / tu.durMax), 1);
  }

  // ---------------- eroi ----------------
  function posa(st, h, v) {
    var t = st.t, TK = M.TICK;
    if (!h.vivo) return 'ko';
    if (h.salT > 0) return h.salT / h.salTT > 0.5 ? 'jump' : 'fall';
    if (t - h.tSup < 0.45 * TK) return 'super';
    if (t - h.tAtt < 0.28 * TK) return 'attack';
    if (t - h.tCol < 0.16 * TK || h.stun > 0) return 'hit';
    if (h.mosso || h.dashD > 0) return 'run';
    return 'idle';
  }

  function disegnaEroe(g, st, i, Z, dt) {
    var h = st.eroi[i], v = D.eroiV[i], me = st.eroi[D.io];
    var amico = h.sq === me.sq, vis = M.visibile(st, h, me.sq);
    // dissolvenza dentro/fuori dai cespugli
    var bersaglioVista = !h.vivo ? (st.t - h.tKo < 0.7 * M.TICK ? 1 : 0) : (vis ? 1 : 0);
    if (amico && h.vivo) bersaglioVista = (h.invT > 0 || h.nasc) ? 0.55 : 1;
    v.vista += (bersaglioVista - v.vista) * Math.min(1, dt * 14);
    if (v.vista < 0.02) return;
    var p = posa(st, h, v);
    if (p !== v.posa) { v.posa = p; v.t0 = D.tempo; }
    var X = wx(v.x), Y = wy(v.y) - h.z * Z * 1.4;
    if (X < -Z * 2 || X > D.W + Z * 2 || Y < -Z * 0.5 || Y > D.H + Z * 3) return;
    // rinculo visivo
    if (v.rinculo > 0) { v.rinculo = Math.max(0, v.rinculo - dt * 7); X -= Math.cos(h.aim) * v.rinculo * Z * 0.22; Y -= Math.sin(h.aim) * v.rinculo * Z * 0.16; }
    if (h.stun > 0 && h.tirT <= 0 && h.kx === 0) X += Math.sin(D.tempo * 60) * 1.2;
    // spinta del colpo (solo visiva) che rientra subito
    if (v.shx || v.shy) { X += v.shx * Z * 0.16; Y += v.shy * Z * 0.12; var dk = Math.exp(-dt * 16); v.shx *= dk; v.shy *= dk; if (Math.abs(v.shx) + Math.abs(v.shy) < 0.02) { v.shx = 0; v.shy = 0; } }
    // polvere quando corre
    if (h.vivo && h.mosso && h.salT <= 0 && v.vista > 0.5) { v.passoT += dt; if (v.passoT > 0.2) { v.passoT = 0; particella(3, v.x - Math.cos(h.aim) * 0.15, v.y + 0.05, 0, -h.vx * 0.15, -h.vy * 0.15, 0.2, 0.32, 0.13, 'rgba(225,215,255,1)'); if (i === D.io && D.suonoPasso) D.suonoPasso(); } }
    var tint = null, tl = D.tempo - v.flash;
    if (tl < 0.09) tint = '#ffffff';
    else if (h.furT > 0 && Math.sin(D.tempo * 18) > 0.3) tint = '#ff2d55';
    else if (h.stun > 0.3 && Math.sin(D.tempo * 14) > 0) tint = '#9ad8ff';
    var alpha = v.vista;
    if (h.prot > 0 && Math.sin(D.tempo * 30) > 0) alpha *= 0.5;
    var hh = Z * 1.4;
    // aura dello scudo
    if (h.scuT > 0 && h.vivo) {
      g.globalAlpha = 0.22 * alpha; g.fillStyle = COL.oro;
      g.beginPath(); g.ellipse(X, Y - hh * 0.45, Z * 0.62, hh * 0.62, 0, 0, PI2); g.fill();
      g.globalAlpha = 0.8 * alpha; g.strokeStyle = COL.oro; g.lineWidth = 2; g.stroke(); g.globalAlpha = 1;
    }
    try {
      var aim = h.aim, fac = h.fac;
      if (i === D.io && D.miraOn && h.vivo) { aim = D.miraAng; fac = Math.cos(aim) >= 0 ? 1 : -1; }
      if (!(D.salta && D.salta.gbr)) GBR.draw(g, h.id, X, Y, { pose: v.posa, t: D.tempo - v.t0, facing: fac, h: hh, aim: aim, tint: tint, alpha: alpha });
    } catch (e) { if (!D._errDraw) { D._errDraw = 1; console.warn('GBR.draw', h.id, e); } }
    // stelline dello stordimento
    if (h.stun > 0.3 && h.vivo) {
      for (var s = 0; s < 3; s++) {
        var a = D.tempo * 6 + s * 2.1;
        g.fillStyle = COL.oro; g.fillRect(X + Math.cos(a) * Z * 0.35 - 2, Y - hh * 1.05 + Math.sin(a) * Z * 0.1 - 2, 4, 4);
      }
    }
  }

  // barre e scritte sopra le teste: in un passaggio a parte, mai coperte dai muri
  var BX = [], BY = [], BOK = [];
  function disegnaTesteEroi(g, st, Z) {
    var me = st.eroi[D.io], n = st.eroi.length, i, j;
    // con la camera alta (eroi piccoli) le barre si rimpiccioliscono: non devono coprire l'azione
    // 22/11: su telefono (caselle piccole) la barra non scende più a un minimo fisso grande: segue la grandezza degli eroi; ?barragrande=1 = come prima
    var BG = /[?&]barragrande=1/.test(location.search);
    var sZ = BG ? Math.max(0.72, Math.min(1, Z / 34)) : Math.max(0.5, Math.min(1, Z / 34)), bw = BG ? Math.max(40, Math.min(84, Z * 1.6)) : Math.max(24, Math.min(80, Z * 1.35));
    // 23/11: su telefono barra più stretta (larga circa quanto l'eroe) e più vicina alla testa; numero ancora leggibile
    var MOB = !BG && Math.min(window.innerWidth || 999, window.innerHeight || 999) < 600;
    if (MOB) { sZ = Math.max(0.68, Math.min(0.82, Z / 34)); bw = Math.max(22, Math.min(56, Z * 0.95)); }
    var BK = MOB ? BARRA_K * 0.92 : BARRA_K;
    D.sZ = sZ;
    // posizioni delle barre, poi si allontanano quelle che si sovrappongono (mischie)
    for (i = 0; i < n; i++) {
      var hh0 = st.eroi[i], vv = D.eroiV[i];
      BOK[i] = hh0.vivo && vv.vista >= 0.3;
      if (D.tre) { var ty = R3.testaY && !/[?&]barravecchia=1/.test(location.search) ? R3.testaY(i) : null; var pt = R3.proietta(vv.x, vv.y, ty != null ? ty : hh0.z * 1.4 + R3.altezzaEroe(hh0.id) * (hh0.trasT > 0 ? 1.25 : 1) * BK + 0.02, _pr);   /* 23/11: barra ancorata alla testa vera del modello (?barravecchia=1 = calcolo di prima) */ BX[i] = pt.x; BY[i] = pt.y - (MOB ? 0 : 2); }   /* 22/11: barra più vicina alla testa (prima x1 + 0,15 e -6 px); ?barra=1 = come prima */
      else { BX[i] = wx(vv.x); BY[i] = wy(vv.y) - hh0.z * Z * 1.4 - Z * 1.4 * tagliaEroe(hh0.id) * BK - (MOB ? 2 : 4); }
    }
    for (var giro = 0; giro < 3; giro++) for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      if (i === j || !BOK[i] || !BOK[j] || BY[i] > BY[j] || (BY[i] === BY[j] && i > j)) continue;
      // i è sopra (o pari): se le etichette si toccano, i sale
      var sep = 36 * (D.sZ || 1); if (Math.abs(BX[i] - BX[j]) < bw + 8 && BY[j] - BY[i] < sep) BY[i] = BY[j] - sep;
    }
    // (UI 30/10) barre come in Brawl Stars: pillola con bordo scuro, numero DENTRO la barra, nome sopra in Russo One
    var nomi = D.nomiTeste || (D.nomiTeste = {});
    for (i = 0; i < n; i++) {
      var h = st.eroi[i], v = D.eroiV[i];
      if (!BOK[i]) continue;
      var amico = h.sq === me.sq, io = i === D.io;
      var X = BX[i], Y = BY[i];
      var bh = Math.round((io ? 15 : 12) * sZ), bw2 = io ? bw + 10 * sZ : bw, x0 = X - bw2 / 2;
      // barra fantasma (il danno appena preso si svuota con calma)
      // FEEL 21/11: il pezzo di vita appena perso resta bianco 0,32 s (si legge quanto ha fatto il colpo), poi si svuota svelto; ?feel=0 / ?feelbarra=0 = come prima
      if (v.fant > h.vita) { if (FEEL_BARRA) { if (v.fantV !== h.vita) { v.fantV = h.vita; v.fantT = D.tempo; } if (D.tempo - v.fantT > 0.32) v.fant = Math.max(h.vita, v.fant - h.vmax * 1.6 * (1 / 60)); } else v.fant = Math.max(h.vita, v.fant - h.vmax * 0.9 * (1 / 60)); }
      else { v.fant = h.vita; v.fantV = h.vita; }
      var f = Math.max(0, h.vita / h.vmax), ff = Math.max(0, v.fant / h.vmax);
      var colB = io ? COL.io : (amico ? COL.blu : COL.rosso);
      g.globalAlpha = v.vista * BARRA_A;   // 22/11: barra leggermente trasparente (?barraalfa=1 = piena)
      g.fillStyle = 'rgba(8,4,16,0.92)'; rr(g, x0 - 3, Y - 3, bw2 + 6, bh + 6, (bh + 6) / 2); g.fill();
      g.strokeStyle = io ? 'rgba(59,255,139,0.8)' : (amico ? 'rgba(63,179,255,0.6)' : 'rgba(255,77,94,0.6)'); g.lineWidth = 1.2; rr(g, x0 - 3, Y - 3, bw2 + 6, bh + 6, (bh + 6) / 2); g.stroke();
      g.save(); rr(g, x0, Y, bw2, bh, bh / 2); g.clip();
      g.fillStyle = '#2a1e3c'; g.fillRect(x0, Y, bw2, bh);
      g.fillStyle = '#ffffff'; g.fillRect(x0, Y, bw2 * ff, bh);
      g.fillStyle = (f < 0.3 && Math.sin(D.tempo * 12) > 0) ? '#ffb3b3' : colB; g.fillRect(x0, Y, bw2 * f, bh);
      g.fillStyle = 'rgba(255,255,255,0.32)'; g.fillRect(x0, Y, bw2 * f, bh * 0.38);
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x0, Y + bh * 0.72, bw2 * f, bh * 0.28);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      for (var k = 1000; k < h.vmax; k += 1000) g.fillRect(x0 + bw2 * k / h.vmax, Y, 1, bh);
      g.restore();
      // numero dentro la barra
      testoTesta(g, str(Math.ceil(h.vita / 10) * 10), X, Y + bh / 2 + 0.5, Math.round((io ? 12 : 10) * sZ * 2) / 2, '#ffffff');
      // nome sopra (gli altri; io ho le munizioni sotto)
      if (!io && NOMI_TESTA) { var nm = nomi[h.id];   /* 22/11: nomi sopra la barra tolti (troppa roba); ?nomi=1 = di nuovo */ if (!nm) { var cu = window.CAST_UI && CAST_UI.E[h.id], gb = window.GBR && GBR.get && GBR.get(h.id); nm = (cu && cu.nome) || (gb && gb.nome) || h.id; if (nm.length > 11) nm = nm.split(' ')[0]; nomi[h.id] = nm = nm.toUpperCase(); } targhetta(g, nm, X, Y - 10 * sZ - 1, amico ? '#3fb3ff' : '#ff4d5e', sZ); }
      // munizioni (solo le mie)
      if (io) {
        var aw = bw2 / 3;
        for (var a = 0; a < 3; a++) {
          var piena = Math.min(1, Math.max(0, h.ammo - a)), ax = x0 + a * aw;
          g.fillStyle = 'rgba(8,4,16,0.92)'; rr(g, ax, Y + bh + 4, aw - 2, 9, 4.5); g.fill();
          g.fillStyle = piena >= 1 ? '#ff9f1c' : '#a35a10';
          if (piena >= 1 && D.tempo - (D._ammoLampo || -9) < 0.12 && a === Math.floor(h.ammo) - 1) g.fillStyle = '#fff6c8';
          if (D._ammoRosso > D.tempo) g.fillStyle = '#ff3b3b';
          if (piena > 0.02) { rr(g, ax + 1.5, Y + bh + 5.5, Math.max(6, (aw - 5) * piena), 6, 3); g.fill(); if (piena >= 1) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(ax + 4, Y + bh + 6, aw - 10, 1.5); } }
        }
      }
      // gemme portate
      // GEMME 22/11: pillola SOPRA la testa (sopra il nome) con gemma + numero; il portatore principale della squadra
      // (st.capo) ha il bordo d'oro e pulsa: e' lui il bersaglio. Prima: gemmina piccola accanto alla barra.
      if (h.gem > 0) {
        var capo = st.capo && st.capo[h.sq] === i && h.gem >= 2;
        var gsz = Math.round((capo ? 20 : 17) * sZ), ns = str(h.gem), pxN = Math.round((capo ? 14 : 12) * sZ);
        var pwG = gsz + pxN * 0.7 * ns.length + 12 * sZ, phG = gsz + 2, pulsa = capo ? 1 + 0.07 * Math.sin(D.tempo * 7) : 1;
        var gyC = Y - (io ? 12 : 26) * sZ - phG / 2;
        g.save(); g.translate(X, gyC); g.scale(pulsa, pulsa);
        g.fillStyle = 'rgba(30,8,48,0.92)'; rr(g, -pwG / 2, -phG / 2, pwG, phG, phG / 2); g.fill();
        g.strokeStyle = capo ? COL.oro : (amico ? 'rgba(63,179,255,0.8)' : 'rgba(255,77,94,0.8)'); g.lineWidth = capo ? 2.2 : 1.3; rr(g, -pwG / 2, -phG / 2, pwG, phG, phG / 2); g.stroke();
        g.drawImage(D.spr.gemma, -pwG / 2 + 3 * sZ, -gsz / 2, gsz, gsz);
        testoTesta(g, ns, -pwG / 2 + gsz + 3 * sZ + pxN * 0.35 * ns.length + 2, 0.5, pxN, capo ? '#ffe27a' : '#f0d4ff');
        g.restore();
      }
      g.globalAlpha = 1;
    }
  }
  // targhetta del nome: pillola scura col bordo del colore della squadra (cotta)
  var TG = {};
  function targhetta(g, s, x, y, col, sc) {
    sc = sc || 1;
    var k = s + '|' + col, c = TG[k];
    if (!c) {
      var d = D.dpr, f = '400 9.5px GBRusso, "Arial Black", system-ui, sans-serif'; g.font = f;
      var w = Math.ceil(g.measureText(s).width + 14), h = 15;
      c = mk(w * d, h * d); var q = c.getContext('2d'); q.scale(d, d);
      q.fillStyle = 'rgba(8,4,16,0.78)'; rr(q, 0.5, 0.5, w - 1, h - 1, 7); q.fill(); q.strokeStyle = col; q.lineWidth = 1; rr(q, 0.5, 0.5, w - 1, h - 1, 7); q.stroke();
      q.font = f; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillStyle = '#ffffff'; q.fillText(s, w / 2, h / 2 + 0.5);
      c._w = w; c._h = h; TG[k] = c;
    }
    g.drawImage(c, x - c._w * sc / 2, y - c._h * sc / 2, c._w * sc, c._h * sc);
  }
  if (document.fonts && document.fonts.load) document.fonts.load('400 10px GBRusso').then(function () { TG = {}; }, function () { });
  // scritte sopra le teste in Russo One (cotte una volta, come D.testo)
  var TT = {}, TTn = 0;
  function testoTesta(g, s, x, y, px, col) {
    var k = s + '|' + px + '|' + col, c = TT[k];
    if (!c) {
      if (TTn > 200) { TT = {}; TTn = 0; }
      var d = D.dpr, f = '400 ' + px + 'px GBRusso, "Arial Black", system-ui, sans-serif';
      g.font = f;
      var w = Math.ceil(g.measureText(s).width + px * 0.6 + 6), h = Math.ceil(px * 1.5 + 6);
      c = mk(w * d, h * d);
      var q = c.getContext('2d'); q.scale(d, d); q.font = f; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineJoin = 'round';
      q.lineWidth = Math.max(2.5, px * 0.3); q.strokeStyle = '#0b0614'; q.strokeText(s, w / 2, h / 2 + 0.5); q.fillStyle = col; q.fillText(s, w / 2, h / 2 + 0.5);
      c._w = w; c._h = h; TT[k] = c; TTn++;
    }
    g.drawImage(c, Math.round((x - c._w / 2) * D.dpr) / D.dpr, Math.round((y - c._h / 2) * D.dpr) / D.dpr, c._w, c._h);
  }
  if (document.fonts && document.fonts.load) document.fonts.load('400 12px GBRusso').then(function () { TT = {}; TTn = 0; }, function () { });

  // ---------------- mira (linea / cono / arco / cerchio) ----------------
  function disegnaMira(g, st, m, Z) {
    var h = st.eroi[D.io];
    if (!h.vivo) return;
    var v = D.eroiV[D.io], X = wx(v.x), Y = wy(v.y), f = m.forma, ang = m.ang, col = m.col, R = m.gitt * Z;
    g.save();
    g.globalAlpha = m.alpha;
    g.fillStyle = col; g.strokeStyle = col;
    if (f === 'linea' || f === 'rimbalzo') {
      var larg = Math.max(6, m.larg * Z), c = Math.cos(ang), s = Math.sin(ang);
      // la linea si ferma al primo muro (come il colpo) e mostra i rimbalzi
      var px = h.x, py = h.y, dxl = c, dyl = s, rest = m.gitt, rimb = f === 'rimbalzo' ? m.rimb : 0, passi = 0;
      g.lineCap = 'round'; g.lineWidth = larg;
      g.beginPath(); g.moveTo(wx(px), wy(py));
      while (rest > 0 && passi++ < 400) {
        var nx = px + dxl * 0.1, ny = py + dyl * 0.1;
        if (M.bloccaColpo(st, Math.floor(nx), Math.floor(ny))) {
          if (rimb > 0 && M.tile(st, Math.floor(nx), Math.floor(ny)) !== M.CASSA) {
            var bx = M.bloccaColpo(st, Math.floor(nx), Math.floor(py)), by = M.bloccaColpo(st, Math.floor(px), Math.floor(ny));
            if (bx) dxl = -dxl; if (by) dyl = -dyl; if (!bx && !by) { dxl = -dxl; dyl = -dyl; }
            rimb--; g.lineTo(wx(px), wy(py)); continue;
          }
          if (!m.passaMuri) break;
        }
        px = nx; py = ny; rest -= 0.1;
      }
      g.lineTo(wx(px), wy(py)); g.globalAlpha = m.alpha * 0.55; g.stroke();
      g.globalAlpha = m.alpha; g.lineWidth = 2; g.stroke();
    } else if (f === 'cono') {
      var semi = Math.max(5, m.ango) * Math.PI / 360;
      g.beginPath(); g.moveTo(X, Y);
      g.ellipse(X, Y, R, R, 0, ang - semi, ang + semi); g.closePath();
      g.globalAlpha = m.alpha * 0.45; g.fill(); g.globalAlpha = m.alpha; g.lineWidth = 2; g.stroke();
    } else if (f === 'arco' || f === 'punto') {
      var d = m.dist * Z, TX = X + Math.cos(ang) * d, TY = Y + Math.sin(ang) * d, A = m.area * Z;
      // traiettoria tratteggiata
      g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath();
      for (var q = 0; q <= 12; q++) { var t = q / 12, lx = X + (TX - X) * t, ly = Y + (TY - Y) * t - (f === 'arco' ? Math.sin(t * Math.PI) * Math.min(d, 4 * Z) * 0.45 : 0); if (q === 0) g.moveTo(lx, ly); else g.lineTo(lx, ly); }
      g.stroke(); g.setLineDash([]);
      if (m.multi) {
        for (var b = 0; b < m.multi; b++) {
          var dd = m.gitt * (0.35 + 0.65 * b / Math.max(1, m.multi - 1)) * Z;
          g.globalAlpha = m.alpha * 0.4; g.beginPath(); g.ellipse(X + Math.cos(ang) * dd, Y + Math.sin(ang) * dd, A, A * 0.72, 0, 0, PI2); g.fill();
        }
      } else {
        g.globalAlpha = m.alpha * 0.4; g.beginPath(); g.ellipse(TX, TY, A, A * 0.72, 0, 0, PI2); g.fill();
        g.globalAlpha = m.alpha; g.lineWidth = 2; g.stroke();
      }
      // gittata massima
      g.globalAlpha = m.alpha * 0.25; g.lineWidth = 1.5; g.beginPath(); g.ellipse(X, Y, R, R, 0, 0, PI2); g.stroke();
    } else if (f === 'cerchio') {
      g.globalAlpha = m.alpha * 0.3; g.beginPath(); g.ellipse(X, Y, R, R * 0.75, 0, 0, PI2); g.fill();
      g.globalAlpha = m.alpha; g.lineWidth = 2; g.stroke();
    }
    g.restore();
  }

  // ---------------- proiettili ----------------
  function disegnaProiettiliScie(g, st, Z, alpha) {
    // prima passata: solo le scie (raccolte e disegnate per colore); seconda: i corpi
    D._soloScie = true; disegnaProiettili(g, st, Z, alpha);
    disegnaScie(g);
    D._soloScie = false; NSC = 0; disegnaProiettili(g, st, Z, alpha); NSC = 0;
  }
  function disegnaProiettili(g, st, Z, alpha) {
    var me = st.eroi[D.io];
    for (var i = 0; i < st.pr.length; i++) {
      var p = st.pr[i];
      if (!p.vivo) continue;
      var x = p.ox + (p.x - p.ox) * alpha, y = p.oy + (p.y - p.oy) * alpha;
      var col = coloreEroe(p.eroe), X = wx(x), Y = wy(y), amico = p.sq === me.sq;
      var bordo = amico ? '#ffffff' : '#ff4d5e';
      if (D._soloScie && p.k !== 0) continue;
      if (p.k === 1) {
        var z = 4 * (p.t / p.T) * (1 - p.t / p.T) + 0.0;
        var hgt = Math.min(2.4, Math.sqrt((p.tx - p.sx) * (p.tx - p.sx) + (p.ty - p.sy) * (p.ty - p.sy)) * 0.35 + 0.8);
        g.globalAlpha = 0.35; g.fillStyle = '#000'; g.beginPath(); g.ellipse(X, Y, Z * 0.2, Z * 0.08, 0, 0, PI2); g.fill(); g.globalAlpha = 1;
        var LY = Y - z * hgt * Z - Z * 0.4;
        disegnaOggettoLob(g, p.sti, X, LY, Z * (p.fl ? 0.34 : 0.26), D.tempo * 9 + i, col, bordo);
        continue;
      }
      var a = p.ang, c = Math.cos(a), s = Math.sin(a);
      if (p.k === 2) {
        // uncino / tentacolo: corda dal lanciatore
        var ow = D.eroiV[p.ow];
        g.strokeStyle = p.eroe === 'polpone' ? '#9b59b6' : '#c9a227'; g.lineWidth = Z * 0.12;
        g.beginPath(); g.moveTo(wx(ow.x), wy(ow.y) - Z * 0.5); g.lineTo(X, Y - Z * 0.4); g.stroke();
        g.fillStyle = bordo; g.beginPath(); g.arc(X, Y - Z * 0.4, Z * 0.2, 0, PI2); g.fill();
        continue;
      }
      if (p.k === 3) {
        var rr2 = Z * 0.45 * (0.8 + 0.2 * Math.sin(D.tempo * 20));
        g.strokeStyle = '#e8d5a3'; g.lineWidth = 2;
        g.beginPath(); g.arc(X, Y - Z * 0.4, rr2, 0, PI2); g.stroke();
        g.beginPath(); g.moveTo(X - rr2, Y - Z * 0.4); g.lineTo(X + rr2, Y - Z * 0.4); g.moveTo(X, Y - Z * 0.4 - rr2); g.lineTo(X, Y - Z * 0.4 + rr2); g.stroke();
        continue;
      }
      Y -= Z * 0.42; // i colpi volano all'altezza del petto
      var r = Math.max(3, p.r * Z), coda = Math.min(1.1, p.t * 20) * Z * (p.fl ? 1.3 : 0.9);
      // la scia si disegna dopo, tutte insieme per colore
      if (D._soloScie) { if (NSC < 400) { var sc0 = SCIE[NSC++]; sc0.x = X; sc0.y = Y; sc0.x2 = X - c * coda; sc0.y2 = Y - s * coda * 0.85; sc0.col = col; sc0.w = r * 1.6; } continue; }
      // corpo del colpo: sprite cotto una volta, già ruotato (32 direzioni): qui è solo una copia
      var sti = p.sti, rot = a;
      if (sti === 'carta') rot = D.tempo * 18 + i;
      else if (sti === 'shuriken') rot = D.tempo * 30 + i;
      else if (sti === 'chiave') rot = D.tempo * 25 + i;
      else if (sti === 'bilia' || sti === 'inchiostro' || sti === 'neve' || sti === 'nota' || sti === 'pipistrello') rot = 0;
      var spr = spriteColpo(sti, col, amico, p.fl, r, Z, rot);
      var sc = p.t < 0.07 ? 1.6 - p.t / 0.07 * 0.6 : 1;   // appena sparato è più grosso (scoppio)
      if (!amico) { var rg = r * 2.3 * sc; g.drawImage(sprFumo('#ff2846'), X - rg, Y - rg, rg * 2, rg * 2); }
      if (sc === 1) { var dd = D.dpr; g.drawImage(spr, Math.round((X - spr._w / 2) * dd) / dd, Math.round((Y - spr._h / 2) * dd) / dd, spr._w, spr._h); }
      else g.drawImage(spr, X - spr._w / 2 * sc, Y - spr._h / 2 * sc, spr._w * sc, spr._h * sc);
    }
  }
  var SCIE = [], NSC = 0;
  for (var si = 0; si < 400; si++) SCIE.push({ x: 0, y: 0, x2: 0, y2: 0, col: '', w: 0 });
  // le scie vanno sotto i colpi: si disegnano per colore, un tracciato per colore
  function disegnaScie(g) {
    if (!NSC) return;
    g.globalAlpha = 0.45; g.lineCap = 'butt';
    for (var i = 0; i < NSC; i++) {
      var c = SCIE[i].col;
      if (!c) continue;
      g.strokeStyle = c; g.lineWidth = SCIE[i].w; g.beginPath();
      for (var j = i; j < NSC; j++) {
        var q = SCIE[j];
        if (q.col !== c) continue;
        g.moveTo(q.x2, q.y2); g.lineTo(q.x, q.y); q.col = '';
      }
      g.stroke();
    }
    g.globalAlpha = 1; NSC = 0;
  }

  var SPRC = {}, SPRCn = 0;
  function spriteColpo(sti, col, amico, fl, r, Z, rot) {
    var giri = Math.round(rot / PI2 * 32) & 31;
    var rq = Math.round(r * 2) / 2, k = sti + '|' + col + '|' + (amico ? 1 : 0) + '|' + (fl ? 1 : 0) + '|' + rq + '|' + giri;
    var c = SPRC[k];
    if (c) return c;
    if (SPRCn > 1500) { SPRC = {}; SPRCn = 0; }
    r = rq;
    var lato = Math.ceil(sti === 'taglio' ? Z * 2.4 : Math.max(r * 6, 16)) + 4, d = D.dpr;
    c = mk(lato * d, lato * d); c._w = lato; c._h = lato;
    var g = c.getContext('2d'); g.scale(d, d); g.translate(lato / 2, lato / 2);
    var bordo = amico ? '#ffffff' : '#ff4d5e';
    g.rotate(giri / 32 * PI2);
    g.lineCap = 'round';
    switch (sti) {
      case 'carta':
        g.fillStyle = '#fff'; g.fillRect(-r, -r * 1.4, r * 2, r * 2.8); g.strokeStyle = amico ? '#c0392b' : bordo; g.lineWidth = 1.5; g.strokeRect(-r, -r * 1.4, r * 2, r * 2.8);
        g.fillStyle = '#c0392b'; g.fillRect(-r * 0.3, -r * 0.3, r * 0.6, r * 0.6); break;
      case 'shuriken':
        g.fillStyle = '#ff2e88'; g.beginPath();
        for (var q = 0; q < 8; q++) { var rad = q % 2 ? r * 0.5 : r * 1.6, aa = q * Math.PI / 4; g.lineTo(Math.cos(aa) * rad, Math.sin(aa) * rad); }
        g.closePath(); g.fill(); g.strokeStyle = bordo; g.lineWidth = 1.5; g.stroke(); break;
      case 'bilia':
        g.fillStyle = fl ? '#111' : '#ffd23f'; g.beginPath(); g.arc(0, 0, r * 1.2, 0, PI2); g.fill();
        g.strokeStyle = bordo; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(-r * 0.3, -r * 0.3, r * 0.45, 0, PI2); g.fill();
        if (fl) { g.fillStyle = '#111'; g.font = 'bold ' + Math.round(r * 0.8) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('8', -r * 0.3, -r * 0.28); }
        break;
      case 'nota':
        g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, r * 1.1, r * 0.8, -0.4, 0, PI2); g.fill();
        g.strokeStyle = bordo; g.lineWidth = 2; g.beginPath(); g.moveTo(r, 0); g.lineTo(r, -r * 2.2); g.lineTo(r * 1.8, -r * 1.7); g.stroke(); break;
      case 'pipistrello':
        g.fillStyle = '#2b0b14'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-r * 2, -r); g.lineTo(-r, r * 0.3); g.lineTo(0, r * 0.6); g.lineTo(r, r * 0.3); g.lineTo(r * 2, -r); g.closePath(); g.fill();
        g.strokeStyle = amico ? '#ff4d5e' : bordo; g.lineWidth = 1.5; g.stroke(); break;
      case 'taglio':
        g.strokeStyle = '#fff'; g.lineWidth = Z * 0.18; g.beginPath(); g.arc(-Z * 0.3, 0, Z * 0.75, -1.1, 1.1); g.stroke();
        g.strokeStyle = COL.oro; g.lineWidth = Z * 0.08; g.beginPath(); g.arc(-Z * 0.3, 0, Z * 0.75, -1.1, 1.1); g.stroke(); break;
      case 'tridente': case 'chiave':
        g.strokeStyle = sti === 'chiave' ? '#b0bec5' : COL.oro; g.lineWidth = 3;
        g.beginPath(); g.moveTo(-r * 2.2, 0); g.lineTo(r * 1.6, 0); g.stroke();
        g.beginPath(); g.moveTo(r * 1.6, -r); g.lineTo(r * 2.4, -r); g.moveTo(r * 1.6, r); g.lineTo(r * 2.4, r); g.moveTo(r * 1.6, 0); g.lineTo(r * 2.6, 0); g.stroke(); break;
      case 'inchiostro': case 'neve':
        g.fillStyle = sti === 'neve' ? '#f4fbff' : '#6c2bb0'; g.beginPath(); g.arc(0, 0, r * 1.15, 0, PI2); g.fill();
        g.strokeStyle = amico ? (sti === 'neve' ? '#85c1e9' : '#d7a6ff') : bordo; g.lineWidth = 2; g.stroke(); break;
      default:
        // proiettile / gettone / laser / fuoco: nucleo bianco + alone del colore dell'eroe
        g.fillStyle = col; g.globalAlpha = 0.5; g.beginPath(); g.arc(0, 0, r * 1.8, 0, PI2); g.fill(); g.globalAlpha = 1;
        g.strokeStyle = '#fff'; g.lineWidth = r * 1.1;
        g.beginPath(); g.moveTo(-r * 2.2, 0); g.lineTo(r, 0); g.stroke();
        if (!amico) { g.strokeStyle = COL.rosso; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, r * 1.6, 0, PI2); g.stroke(); }
    }
    SPRC[k] = c; SPRCn++;
    return c;
  }

  function disegnaOggettoLob(g, sti, X, Y, r, rot, col, bordo) {
    g.save(); g.translate(X, Y); g.rotate(rot);
    switch (sti) {
      case 'dado': case 'maledizione':
        g.fillStyle = sti === 'dado' ? '#f5f0e1' : '#a24bff'; rr(g, -r, -r, r * 2, r * 2, r * 0.3); g.fill(); g.strokeStyle = bordo; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#111'; g.beginPath(); g.arc(-r * 0.45, -r * 0.45, r * 0.18, 0, PI2); g.arc(r * 0.45, r * 0.45, r * 0.18, 0, PI2); g.fill(); break;
      case 'pizza':
        g.fillStyle = '#f4c06a'; g.beginPath(); g.arc(0, 0, r * 1.1, 0, PI2); g.fill();
        g.fillStyle = '#d62828'; g.beginPath(); g.arc(0, 0, r * 0.85, 0, PI2); g.fill();
        g.fillStyle = '#fff3c4'; for (var i = 0; i < 4; i++) { g.beginPath(); g.arc(Math.cos(i * 1.6) * r * 0.45, Math.sin(i * 1.6) * r * 0.45, r * 0.2, 0, PI2); g.fill(); }
        g.strokeStyle = bordo; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, r * 1.1, 0, PI2); g.stroke(); break;
      case 'zucca': g.rotate(-rot); disegnaZucchetta(g, 0, r * 0.7, r * 0.9, false); break;
      case 'palla':
        g.fillStyle = '#1c1c1c'; g.beginPath(); g.arc(0, 0, r, 0, PI2); g.fill(); g.strokeStyle = bordo; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#666'; g.beginPath(); g.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, PI2); g.fill(); break;
      case 'sciame':
        g.fillStyle = '#2b0b14'; for (var b = 0; b < 4; b++) { g.beginPath(); g.arc(Math.cos(b * 1.57) * r * 0.6, Math.sin(b * 1.57) * r * 0.6, r * 0.35, 0, PI2); g.fill(); } break;
      default:
        g.fillStyle = col; g.beginPath(); g.arc(0, 0, r, 0, PI2); g.fill(); g.strokeStyle = bordo; g.lineWidth = 2; g.stroke();
    }
    g.restore();
  }

  // ---------------- effetti istantanei ----------------
  function disegnaFx(g, st, Z, dt) {
    for (var i = 0; i < MAXFX; i++) {
      var f = D.fx[i];
      if (!f.on) continue;
      f.life -= dt;
      if (f.life <= 0) { f.on = 0; continue; }
      var k = 1 - f.life / f.max, X = px2(f.x, f.y), Y = py2();
      switch (f.k) {
        case 'anello':
          g.strokeStyle = f.col; g.globalAlpha = 1 - k; g.lineWidth = 4 * (1 - k) + 1;
          g.beginPath(); g.ellipse(X, Y, f.a * Z * (0.3 + 0.7 * Math.sqrt(k)), f.a * Z * 0.72 * (0.3 + 0.7 * Math.sqrt(k)), 0, 0, PI2); g.stroke(); break;
        case 'fendente':
          // f.a angolo, f.b gittata, f.c ampiezza (gradi)
          var semi = Math.max(18, f.c) * Math.PI / 360, R = f.b * Z, sweep = -semi + (2 * semi) * Math.min(1, k * 2.2);
          var ang = f.a, dir = f.d;
          g.globalAlpha = (1 - k) * 0.9; g.fillStyle = f.col;
          g.beginPath(); g.moveTo(X, Y - Z * 0.4);
          var s0 = dir > 0 ? ang - semi : ang + semi, s1 = ang + sweep * dir;
          g.arc(X, Y - Z * 0.4, R, Math.min(s0, s1), Math.max(s0, s1)); g.closePath(); g.fill();
          g.strokeStyle = '#fff'; g.lineWidth = 3 * (1 - k) + 1; g.beginPath(); g.arc(X, Y - Z * 0.4, R * 0.95, Math.min(s0, s1), Math.max(s0, s1)); g.stroke();
          break;
        case 'raggio':
          var len = f.b * Z, c = Math.cos(f.a), s = Math.sin(f.a), w = (1 - k) * Z * 0.35 + 2;
          g.lineCap = 'round';
          g.globalAlpha = 0.55 * (1 - k); g.strokeStyle = f.col; g.lineWidth = w * 2.2;
          g.beginPath(); g.moveTo(X, Y - Z * 0.45); g.lineTo(X + c * len, Y - Z * 0.45 + s * len); g.stroke();
          g.globalAlpha = 1 - k; g.strokeStyle = '#fff'; g.lineWidth = w * 0.6; g.stroke();
          break;
        case 'onda':
          var RR = f.a * Z * (0.2 + 0.8 * Math.sqrt(k));
          g.globalAlpha = (1 - k) * 0.5; g.fillStyle = f.col; g.beginPath(); g.ellipse(X, Y, RR, RR * 0.72, 0, 0, PI2); g.fill();
          g.globalAlpha = 1 - k; g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
          break;
        case 'colonna':
          // raggio dal cielo (colpo orbitale)
          g.globalAlpha = 1 - k; g.fillStyle = f.col; g.fillRect(X - Z * 0.5 * (1 - k), 0, Z * (1 - k), Y);
          g.fillStyle = '#fff'; g.fillRect(X - Z * 0.18 * (1 - k), 0, Z * 0.36 * (1 - k), Y);
          break;
        case 'lampoSchermo':
          g.globalAlpha = (1 - k) * f.a; g.fillStyle = f.col; g.fillRect(0, 0, D.W, D.H);
          break;
      }
      g.globalAlpha = 1;
    }
  }

  // sprite morbidi per fumo e fiches (uno per colore), così le particelle sono solo copie
  var PSPR = {};
  function sprFumo(col) {
    var k = 'f' + col, c = PSPR[k];
    if (c) return c;
    c = mk(32, 32); var g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 2, 16, 16, 16);
    gr.addColorStop(0, col); gr.addColorStop(0.6, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.9; g.fillStyle = gr; g.beginPath(); g.arc(16, 16, 16, 0, PI2); g.fill();
    return (PSPR[k] = c);
  }
  function sprFiche(col) {
    var k = 'c' + col, c = PSPR[k];
    if (c) return c;
    c = mk(24, 24); var g = c.getContext('2d');
    g.fillStyle = col; g.beginPath(); g.arc(12, 12, 11, 0, PI2); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.setLineDash([3, 3]); g.beginPath(); g.arc(12, 12, 7.5, 0, PI2); g.stroke();
    g.setLineDash([]); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.2; g.beginPath(); g.arc(12, 12, 11, 0, PI2); g.stroke();
    return (PSPR[k] = c);
  }

  function disegnaParticelle(g, Z, dt) {
    var nsc = 0, i, p, k, X, Y;
    for (i = 0; i < MAXPA; i++) {
      p = D.pa[i];
      if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) { p.on = 0; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      k = p.life / p.max;
      if (p.k === 1 || p.k === 2) {
        p.vz -= 18 * dt; p.z += p.vz * dt;
        if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.4; p.vx *= 0.6; p.vy *= 0.6; p.vr *= 0.5; }
        p.rot += p.vr * dt;
      } else if (p.k === 0) { p.vx *= 0.9; p.vy *= 0.9; nsc++; continue; }
      else if (p.k === 3 || p.k === 7) { p.z += p.vz * dt; p.vx *= 0.94; p.vy *= 0.94; }
      if (p.k === 5) continue;
      X = px2(p.x, p.y); Y = py2() - p.z * Z;
      if (X < -40 || X > D.W + 40 || Y < -40 || Y > D.H + 40) continue;
      if (p.k === 1) { g.globalAlpha = Math.min(1, k * 2); g.fillStyle = p.c; g.fillRect(X - Z * 0.06, Y - Z * 0.025, Z * 0.12, Z * 0.05); }
      else if (p.k === 2) {
        g.globalAlpha = Math.min(1, k * 2.5);
        var sy = Math.abs(Math.cos(p.rot)) * 0.8 + 0.2, rr = p.s * Z;
        g.drawImage(sprFiche(p.c), X - rr, Y - rr * sy, rr * 2, rr * 2 * sy);
      } else if (p.k === 3) { g.globalAlpha = k * 0.55; var rf = p.s * Z * (1.6 - k * 0.6); g.drawImage(sprFumo(p.c), X - rf, Y - Z * 0.3 - rf, rf * 2, rf * 2); }
      else if (p.k === 7) { g.globalAlpha = k; g.fillStyle = p.c; var q = p.s * Z * 0.5; g.fillRect(X - q, Y - q * 0.3, q * 2, q * 0.6); g.fillRect(X - q * 0.3, Y - q, q * 0.6, q * 2); }
    }
    // scintille e lampi: luce additiva, tutte le scintille in un solo tracciato
    g.globalCompositeOperation = 'lighter';
    if (nsc) {
      g.globalAlpha = 0.9; g.strokeStyle = '#ffe7a0'; g.lineWidth = 2; g.beginPath();
      for (i = 0; i < MAXPA; i++) {
        p = D.pa[i];
        if (!p.on || p.k !== 0) continue;
        k = p.life / p.max; X = px2(p.x, p.y); Y = py2() - p.z * Z;
        g.moveTo(X, Y); g.lineTo(X - p.vx * 0.035 * Z * k, Y - p.vy * 0.035 * Z * k);
      }
      g.stroke();
    }
    for (i = 0; i < MAXPA; i++) {
      p = D.pa[i];
      if (!p.on || p.k !== 5) continue;
      k = p.life / p.max; X = px2(p.x, p.y); Y = py2() - p.z * Z;
      var rl = p.s * Z * (1.2 - k * 0.2);
      g.globalAlpha = k; g.drawImage(sprFumo(p.c), X - rl, Y - Z * 0.4 - rl, rl * 2, rl * 2);
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }

  function disegnaNumeri(g, Z, dt) {
    for (var i = 0; i < MAXNUM; i++) {
      var q = D.num[i];
      if (!q.on) continue;
      q.life -= dt;
      if (q.life <= 0) { q.on = 0; continue; }
      var t = 1 - q.life / q.max;
      // salto con rimbalzo: sale in fretta, si gonfia e poi svanisce
      var sc = t < 0.12 ? 0.4 + (t / 0.12) * 1.0 : 1.4 - Math.min(0.4, (t - 0.12) * 2);
      // [fable gioco] i numeri sui personaggi partono SOPRA targhetta e barra della vita (prima le coprivano)
      var X = px2(q.x + q.vx * t, q.y), Y = py2() - Z * (q.alto ? 2.75 : 1.95) - Math.sin(Math.min(1, t * 2.5) * Math.PI / 2) * Z * 0.8;
      g.globalAlpha = (t > 0.7 ? (1 - t) / 0.3 : 1) * (q.big ? 1 : 0.7);
      D.testo(g, q.s, X, Y, q.big ? 24 : 14, q.col, '#0b0614', null, sc / 1.15);
    }
    g.globalAlpha = 1;
  }

  function disegnaGas(g, st, Z) {
    var gas = st.gas;
    if (!gas.on) return;
    var x0 = wx(gas.x0), x1 = wx(gas.x1), y0 = wy(gas.y0), y1 = wy(gas.y1);
    g.fillStyle = 'rgba(40,200,90,0.28)';
    if (y0 > 0) g.fillRect(0, 0, D.W, y0);
    if (y1 < D.H) g.fillRect(0, y1, D.W, D.H - y1);
    g.fillRect(0, Math.max(0, y0), Math.max(0, x0), Math.min(D.H, y1) - Math.max(0, y0));
    if (x1 < D.W) g.fillRect(x1, Math.max(0, y0), D.W - x1, Math.min(D.H, y1) - Math.max(0, y0));
    g.strokeStyle = '#7dff9a'; g.lineWidth = 3; g.setLineDash([10, 8]); g.lineDashOffset = D.tempo * 20;
    g.strokeRect(x0, y0, x1 - x0, y1 - y0); g.setLineDash([]);
  }

  // frecce ai bordi per i nemici visibili fuori dallo schermo
  function disegnaFuoriSchermo(g, st, Z) {
    var me = st.eroi[D.io], m = 26;
    for (var i = 0; i < st.eroi.length; i++) {
      var h = st.eroi[i];
      if (i === D.io || !h.vivo || !M.visibile(st, h, me.sq)) continue;
      var v = D.eroiV[i], X = px2(v.x, v.y), Y = py2() - Z * 0.6;
      if (X > 0 && X < D.W && Y > 0 && Y < D.H) continue;
      var cx = D.W / 2, cy = D.H / 2, dx = X - cx, dy = Y - cy;
      var k = Math.min((D.W / 2 - m) / Math.abs(dx || 1e-3), (D.H / 2 - m - 40) / Math.abs(dy || 1e-3));
      var ax = cx + dx * k, ay = cy + dy * k, a = Math.atan2(dy, dx);
      g.save(); g.translate(ax, ay); g.rotate(a);
      g.fillStyle = h.sq === me.sq ? COL.blu : COL.rosso; g.globalAlpha = 0.9;
      g.beginPath(); g.moveTo(12, 0); g.lineTo(-6, -9); g.lineTo(-6, 9); g.closePath(); g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
  }

  // vignetta rossa quando mi colpiscono (precotta)
  D.vignettaRossa = function (a) {
    if (a <= 0.01) return;
    if (!D.vignetta) {
      var c = mk(256, 256), g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 60, 128, 128, 182);
      gr.addColorStop(0, 'rgba(255,0,40,0)'); gr.addColorStop(1, 'rgba(255,0,40,1)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256); D.vignetta = c;
    }
    var g2 = D.ctx; g2.globalAlpha = Math.min(1, a); g2.drawImage(D.vignetta, 0, 0, D.W, D.H); g2.globalAlpha = 1;
  };

  // scritta con contorno, cotta una volta e poi solo copiata
  var TC = {}, TCn = 0;
  D.testo = function (g, s, x, y, px, col, bordo, al, scala) {
    px = Math.round(px);
    var k = s + '|' + px + '|' + col + '|' + (bordo || '');
    var c = TC[k];
    if (!c) {
      if (TCn > 300) { TC = {}; TCn = 0; }
      var d = D.dpr, f = '900 ' + px + 'px "Arial Black", system-ui, sans-serif', mg = g;
      mg.font = f;
      var w = Math.ceil(mg.measureText(s).width + px * 0.5 + 6);
      c = mk(w * d, (px * 1.5 + 6) * d);
      var q = c.getContext('2d'); q.scale(d, d); q.font = f; q.textAlign = 'center'; q.textBaseline = 'middle';
      q.lineWidth = Math.max(3, px * 0.18); q.strokeStyle = bordo || '#12081f'; q.lineJoin = 'round';
      q.strokeText(s, w / 2, (px * 1.5 + 6) / 2); q.fillStyle = col; q.fillText(s, w / 2, (px * 1.5 + 6) / 2);
      c._w = w; c._h = px * 1.5 + 6;
      TC[k] = c; TCn++;
    }
    var ox = al === 'right' ? c._w - (c._w - (c._w - px * 0.25 - 3)) : (al === 'left' ? px * 0.25 + 3 : c._w / 2);
    var d2 = D.dpr;
    if (scala && scala !== 1) { g.drawImage(c, x - ox * scala, y - c._h / 2 * scala, c._w * scala, c._h * scala); return; }
    g.drawImage(c, Math.round((x - ox) * d2) / d2, Math.round((y - c._h / 2) * d2) / d2, c._w, c._h);
  };

  D.COL = COL;
  window.Disegno = D;
})();
