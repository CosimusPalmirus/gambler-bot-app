/* GAMBLER SMASH — disegno (canvas 2D). Legge lo stato, non lo cambia mai.
   passo(S): una volta per passo della simulazione (60 Hz): consuma gli eventi, muove particelle e camera.
   disegna(S, L): disegna il fotogramma. Pool fissi per particelle, scintille e raggi KO: zero allocazioni nel ciclo. */
(function (root) {
  'use strict';
  const GS = root.GS;
  const TAU = 6.283185307179586;
  const COLP = ['#ff3b4e', '#3b8bff', '#ffd23b', '#38f08a'];
  const COLP_SCURO = ['#7a0f1c', '#0f2f7a', '#7a5a0f', '#0f6a3a'];
  let ctx = null, cvs = null, dpr = 1;
  let A = null, SF = null; // arena (dati) e sfondi precotti
  const opz = { umano: 0, lang: 'it', perf: false, aimSegno: 1, nomi: [], impatto: true, leggero: false };   // impatto: IMPACT FRAME acceso (?impatto=0 o la pausa lo spengono)

  // ---------- tavolozza indicizzata (le particelle portano un indice, non una stringa nuova) ----------
  const PAL = [], PALi = {};
  function pc(s) { let i = PALi[s]; if (i == null) { i = PAL.length; PAL.push(s); PALi[s] = i; } return i; }
  const C_BIANCO = pc('#ffffff'), C_FUMO = pc('#9a96a8'), C_POLV = pc('#d8cbb0'), C_FUOCO = pc('#ff8a1c'), C_FUOCO2 = pc('#ffd23b'), C_ROSSO = pc('#ff3030'), C_BLU = pc('#7fd8ff'), C_ACQUA = pc('#5ab8ff'), C_GHIACCIO = pc('#cfefff'), C_FOGLIA = pc('#5aa83a'), C_SCURO = pc('#2a2238'), C_ORO = pc('#ffd23b'), C_VIOLA = pc('#b45aff');

  // ---------- sprite di bagliore precotti (niente shadowBlur nel ciclo) ----------
  const GLOW = {};
  function glow(col) {
    let g = GLOW[col];
    if (g) return g;
    g = document.createElement('canvas'); g.width = g.height = 64;
    const x = g.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, col); gr.addColorStop(.35, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = 1; x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    GLOW[col] = g;
    return g;
  }

  // ---------- particelle (pool a vettori tipizzati) ----------
  const NPART = 640;
  const px = new Float32Array(NPART), py = new Float32Array(NPART), pvx = new Float32Array(NPART), pvy = new Float32Array(NPART);
  const pl = new Float32Array(NPART), pm = new Float32Array(NPART), ps = new Float32Array(NPART), pr = new Float32Array(NPART);
  const pk = new Uint8Array(NPART), pcol = new Uint8Array(NPART), pg = new Float32Array(NPART);
  let pNext = 0, pVive = 0;
  // tipi: 0 scintilla(linea) 1 fumo 2 polvere 3 stella 4 detrito 5 bagliore 6 anello 7 goccia
  // 16/10: effetti ridotti (opz.leggero, telefoni che non reggono i 60 fps neanche a dpr 1): metà delle particelle
  // minute (scintille, fumo, polvere, detriti, gocce); bagliori, anelli e stelle restano tutti. Solo disegno.
  let contaE = 0;
  function emetti(k, x, y, vx, vy, life, size, col, grav) {
    if (k === 3 && root.GSFX && root.GSFX.vera(x, y, vx, vy, col === C_GHIACCIO || col === C_BLU)) return;   // FX 17/10: le stelline (tipo 3) diventano scintille vere
    if (opz.leggero && k !== 3 && k !== 5 && k !== 6 && (++contaE & 1)) return;
    let i = pNext;
    for (let n = 0; n < NPART; n++) { if (pl[i] <= 0) break; i = (i + 1) % NPART; }
    pNext = (i + 1) % NPART;
    px[i] = x; py[i] = y; pvx[i] = vx; pvy[i] = vy; pl[i] = life; pm[i] = life; ps[i] = size; pk[i] = k; pcol[i] = col; pg[i] = grav || 0; pr[i] = Math.random() * TAU;
  }
  // sbuffi di fumo e polvere: sprite precotti per colore (niente percorsi nel ciclo)
  const SBUF = [];
  function sbuffo(ci) {
    let g = SBUF[ci];
    if (g) return g;
    g = document.createElement('canvas'); g.width = g.height = 32;
    const x = g.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, PAL[ci]); gr.addColorStop(.6, PAL[ci]); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    SBUF[ci] = g; return g;
  }
  function particellePasso() {
    let n = 0;
    for (let i = 0; i < NPART; i++) {
      if (pl[i] <= 0) continue;
      pl[i]--; n++;
      const k = pk[i];
      px[i] += pvx[i]; py[i] += pvy[i]; pvy[i] += pg[i];
      if (k === 0) { pvx[i] *= .88; pvy[i] *= .88; }
      else if (k === 1) { pvx[i] *= .94; pvy[i] = pvy[i] * .94 - .04; }
      else if (k === 2) { pvx[i] *= .9; pvy[i] *= .9; }
      else if (k === 3 || k === 4) { pvx[i] *= .97; pr[i] += .2; }
    }
    pVive = n;
  }
  function disegnaParticelle(c, z) {
    // passo normale: fumo, polvere, detriti, gocce
    for (let i = 0; i < NPART; i++) {
      if (pl[i] <= 0) continue;
      const k = pk[i]; if (k === 0 || k === 5 || k === 6 || k === 3) continue;
      const a = pl[i] / pm[i];
      c.fillStyle = PAL[pcol[i]];
      if (k === 1 || k === 2) {
        c.globalAlpha = a * (k === 1 ? .75 : .9);
        const r = ps[i] * (1.6 - a * .6) * 1.5;
        c.drawImage(sbuffo(pcol[i]), px[i] - r, py[i] - r, r * 2, r * 2);
      } else if (k === 4) {
        c.globalAlpha = Math.min(1, a * 2);
        const s = ps[i];
        c.save(); c.translate(px[i], py[i]); c.rotate(pr[i]); c.fillRect(-s / 2, -s / 2, s, s * .6); c.restore();
      } else if (k === 7) {
        c.globalAlpha = Math.min(1, a * 2);
        c.beginPath(); c.arc(px[i], py[i], ps[i], 0, TAU); c.fill();
      }
    }
    // passo additivo: scintille, bagliori, anelli, stelle
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < NPART; i++) {
      if (pl[i] <= 0) continue;
      const k = pk[i]; if (!(k === 0 || k === 5 || k === 6 || k === 3)) continue;
      const a = pl[i] / pm[i];
      if (k === 0) {
        c.strokeStyle = PAL[pcol[i]]; c.globalAlpha = Math.min(1, a * 1.6); c.lineWidth = ps[i] * (.4 + a * .6);
        c.beginPath(); c.moveTo(px[i], py[i]); c.lineTo(px[i] - pvx[i] * 2.4, py[i] - pvy[i] * 2.4); c.stroke();
      } else if (k === 5) {
        c.globalAlpha = a * .8; const r = ps[i] * (1.2 - a * .2);
        c.drawImage(glow(PAL[pcol[i]]), px[i] - r, py[i] - r, r * 2, r * 2);
      } else if (k === 6) {
        c.strokeStyle = PAL[pcol[i]]; c.globalAlpha = a; c.lineWidth = 3 * a + 1;
        c.beginPath(); c.arc(px[i], py[i], ps[i] * (1.15 - a), 0, TAU); c.stroke();
      } else if (k === 3) {
        c.fillStyle = PAL[pcol[i]]; c.globalAlpha = Math.min(1, a * 1.5);
        stella4(c, px[i], py[i], ps[i] * (.5 + .5 * Math.abs(Math.sin(pr[i] * 2))), pr[i]);
      }
    }
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
  }
  function stella4(c, x, y, r, rot) {
    c.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = rot + k * TAU / 8, rr = k % 2 ? r * .28 : r;
      const X = x + Math.cos(a) * rr, Y = y + Math.sin(a) * rr;
      if (k) c.lineTo(X, Y); else c.moveTo(X, Y);
    }
    c.closePath(); c.fill();
  }

  // ---------- scintille di colpo (grandi, chiare) ----------
  const NSC = 16;
  const SC = []; for (let i = 0; i < NSC; i++) SC.push({ t: 0, life: 0, x: 0, y: 0, s: 0, col: '#fff', rot: 0, sp: new Float32Array(10), forte: 0 });
  let scNext = 0;
  function scintilla(x, y, s, col, forte, wa, breve) {
    if (root.GSFX && root.GSFX.lampo(x, y, s, col, forte)) return;   // FX 17/10: il lampo a stellina diventa un flash
    const o = SC[scNext]; scNext = (scNext + 1) % NSC;
    o.t = 0; o.life = forte ? 16 : breve ? 7 : 11; o.bordo = !!breve; o.x = x; o.y = y; o.s = s; o.col = col; o.forte = forte;
    const dirA = wa == null ? Math.random() * TAU : -wa * TAU / 360;
    o.rot = dirA;
    // le punte lungo la direzione del colpo sono lunghe, quelle di lato corte: si legge da dove arriva
    for (let k = 0; k < 10; k++) { const c = Math.cos(k * TAU / 10); o.sp[k] = (wa == null ? .55 + Math.random() * .6 : .45 + 1.1 * Math.pow(Math.abs(c), 3) * (c > 0 ? 1 : .55) + Math.random() * .15); }
  }
  function disegnaScintille(c) {
    for (let i = 0; i < NSC; i++) {
      const o = SC[i]; if (o.t >= o.life) continue;
      const q = o.t / o.life, e = 1 - (1 - q) * (1 - q);
      const R = o.s * (.6 + e * .7);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 1 - q;
      c.drawImage(glow(o.col), o.x - R * 1.6, o.y - R * 1.6, R * 3.2, R * 3.2);
      c.globalCompositeOperation = 'source-over';
      // stella colorata
      c.fillStyle = o.col; c.globalAlpha = Math.min(1, (1 - q) * 1.6);
      c.beginPath();
      for (let k = 0; k < 20; k++) {
        const a = o.rot + k * TAU / 20, rr = k % 2 ? R * .32 : R * o.sp[k >> 1];
        const X = o.x + Math.cos(a) * rr, Y = o.y + Math.sin(a) * rr;
        if (k) c.lineTo(X, Y); else c.moveTo(X, Y);
      }
      if (o.bordo) { c.strokeStyle = '#120a1e'; c.lineWidth = 2.5; c.stroke(); }   // colpi base: bordo scuro, stacca da ogni arena
      c.closePath(); c.fill();
      // cuore bianco
      c.fillStyle = '#fff';
      c.beginPath();
      for (let k = 0; k < 20; k++) {
        const a = o.rot + k * TAU / 20, rr = (k % 2 ? R * .16 : R * o.sp[k >> 1] * .55) * (1 - q * .5);
        const X = o.x + Math.cos(a) * rr, Y = o.y + Math.sin(a) * rr;
        if (k) c.lineTo(X, Y); else c.moveTo(X, Y);
      }
      c.closePath(); c.fill();
      if (o.forte) {
        c.strokeStyle = '#fff'; c.lineWidth = 4 * (1 - q); c.globalAlpha = 1 - q;
        c.beginPath(); c.arc(o.x, o.y, R * (1 + e * 1.4), 0, TAU); c.stroke();
      }
      c.globalAlpha = 1;
    }
  }
  function scintillePasso() { for (let i = 0; i < NSC; i++) if (SC[i].t < SC[i].life) SC[i].t++; }

  // ---------- scritte volanti (numeri, PARATA!, +cura...) in pool ----------
  const POP = []; for (let i = 0; i < 24; i++) POP.push({ t: 99, life: 40, txt: '', col: '#fff', x: 0, y: 0, h: 20, salita: 40 });
  let popNext = 0;
  function scrittaPop(txt, col, x, y, h, life) { const o = POP[popNext]; popNext = (popNext + 1) % POP.length; o.t = 0; o.life = life || 40; o.txt = txt; o.col = col; o.x = x; o.y = y; o.h = h || 22; o.salita = 40; return o; }
  function disegnaPop(c) {
    for (let i = 0; i < POP.length; i++) {
      const o = POP[i]; if (o.t >= o.life) continue;
      const q = o.t / o.life, s = q < .15 ? .6 + q / .15 * .6 : 1.2 - Math.min(.2, (q - .15));
      root.GSE.scritta(c, o.txt, o.col, o.x, o.y - q * o.salita, o.h * s, q > .7 ? (1 - q) / .3 : 1);
    }
  }

  // ---------- raggi KO e stelle ----------
  const KO = []; for (let i = 0; i < 4; i++) KO.push({ t: 99, x: 0, y: 0, ang: 0, col: '#fff', stella: 0, id: '', p: 0 });
  let koNext = 0;

  // ---------- stato visivo per lottatore ----------
  const VF = [];
  function nuovoVF() {
    return { sqx: 1, sqy: 1, flash: 0, hlMax: 1, pose: '', pt: 0, spin: 0, pshake: 0, ppop: 1, sob: 0, sobx: 0, soby: 0, pctPrima: 0, hx: new Float32Array(8), hy: new Float32Array(8), hi: 0, ghost: 0, col: '#fff', col2: '#fff', fumo: 0, morto: 0, prevSt: '', vPrima: 0, gh: 64, passo: 0, derapa: 0, dirPrima: 1, combo: 0, comboFino: 0, comboPop: null, pjy: 0, pjv: 0, ciclo: 0, antic: 0 };
  }

  // ---------- camera ----------
  const cam = { x: 0, y: -150, z: .7, bx: 0, by: -150, bz: .7, trauma: 0, tt: 0, punch: 0, phx: 0, phy: 0, flash: 0, flashCol: '#fff', linee: 0, lx: 0, ly: 0, ka: -1, kv: -1, vx: 0, vy: 0, vz: 0, px: 0, py: -150, pz: .7, a: 1, sdx: 0, sdy: 0, samp: 0, sph: 0 };
  let L = null; // impaginazione corrente

  // ---------- annunci a schermo ----------
  const ann = { testo: '', t: 99, life: 60, col: '#fff', size: 1 };
  function annuncio(testo, col, life, size, alto) { ann.testo = testo; ann.t = 0; ann.life = life || 60; ann.col = col || '#fff'; ann.size = size || 1; ann.alto = !!alto; }   // 18/10: alto = in alto sotto l'HUD, piccolo (ui_1810.js)

  let SUONI = null; // collegato da gioco.js
  let rallenta = 0;  // fotogrammi di rallentatore dopo un colpo da KO (li consuma il guscio)
  let tempoVis = 0;
  // ---------- IMPACT FRAME (16/10) ----------
  // Sui colpi davvero forti, per ~2 fotogrammi a 30 Hz (70 ms in tutto) l'immagine diventa ad alto contrasto: fondo quasi
  // nero e lottatori a silhouette bianca con linee di velocità dal punto d'impatto, poi il negativo (fondo chiaro,
  // silhouette nere), poi normale. Si somma al fermo del colpo. Solo disegno: legge gli eventi, non tocca il motore.
  // QUANDO (misure di banco/impatto_soglia.js, 60 partite a 4 fra bot, 125 minuti, 105 colpi al minuto: kb mediano 67,
  // 95° percentile 215, 99° 317): colpo da KO previsto (colpoKO, anche le ulti che chiudono), oppure contraccolpo
  // >= IMP_KB, oppure smash caricato almeno a metà con contraccolpo >= IMP_KB_CAR. Risultato: uno ogni ~22 s in una
  // partita a 4. Sicurezza degli occhi: mai due a meno di IMP_PAUSA passi (1,5 s), durata breve, interruttore.
  const IMP_KB = 260, IMP_KB_CAR = 140, IMP_CAR = .5, IMP_PAUSA = 90, IMP_MS1 = 35, IMP_MS2 = 70;
  const IMPF = { pend: 0, t0: -1e9, ult: -1e9, x: 0, y: 0, ka: -1, kv: -1, n: 0 };
  function fortissimo(e, F, mA) {
    if (e.t === 'colpoKO') return true;
    const kb = e.v2;
    if (kb >= IMP_KB) return true;
    return !!(mA && mA.carica && F.mc / mA.carica.max >= IMP_CAR && kb >= IMP_KB_CAR);
  }
  // fase dell'impact frame in questo fotogramma di disegno: 0 spento, 1 silhouette chiare su nero, 2 negativo
  function fasePImpatto() {
    if (IMPF.pend) { IMPF.pend = 0; IMPF.t0 = performance.now(); }
    const d = performance.now() - IMPF.t0;
    return d < 0 ? 0 : d < IMP_MS1 ? 1 : d < IMP_MS2 ? 2 : 0;
  }

  // ================== preparazione ==================
  function init(canvas) {
    cvs = canvas; ctx = canvas.getContext('2d', { alpha: false });
    root.GSE.init({ glow, stella4, emetti, pc, tv: () => tempoVis, C: { FUMO: C_FUMO, POLV: C_POLV, ORO: C_ORO, BLU: C_BLU, ACQUA: C_ACQUA, GHIACCIO: C_GHIACCIO, ROSSO: C_ROSSO, VIOLA: C_VIOLA, FOGLIA: C_FOGLIA, SCURO: C_SCURO } });
    // FX 17/10 (fx_card.js): effetti d'impatto come la card A. Solo disegno; GSFX.on = false torna ai vecchi.
    // 18/10: KO speciali (ko_speciali.js: KO sullo schermo e verso l'orizzonte), solo disegno
    if (root.GSKO) root.GSKO.init({ gbrScala, posa3d, glow, stella4, VF, cam, COLP, tv: () => tempoVis, suoni: () => SUONI });
    if (root.GSFX) root.GSFX.init({ glow, cam, scossaDir, opz, COLP, inCarica: (F, m) => !(root.GSLOOK && root.GSLOOK.niente_tinta_carica && root.GSLOOK.niente_tinta_carica(F)) && inCarica(F, m), GS });   // smash_look_1710: la carica del Campione sta sul guantone
  }
  function preparaArena(S) {
    A = GS.AR.perId[S.arena];
    SF = root.GSF.prepara(A);
    SF.suono = k => { if (SUONI && k === 'giro') SUONI.dado(); }; // arene 15/10: la leva della slot
    VF.length = 0;
    for (let i = 0; i < S.n; i++) {
      const v = nuovoVF();
      const g = root.GBR && root.GBR.get(S.L[i].id);
      v.col = (g && g.colore) || COLP[i]; v.col2 = (g && g.colore2) || '#fff';
      v.gh = GS.D(S.L[i]).H / ((g && g.taglia) || 1);
      VF.push(v);
    }
    root.GSE.prepara(S.L.map(F => F.id));
    for (let i = 0; i < S.n; i++) ritratto(S.L[i].id, 120, COLP[i]);
    for (let i = 0; i < NPART; i++) pl[i] = 0;
    for (const o of SC) o.t = o.life = 0;
    for (const k of KO) k.t = 99;
    if (root.GSFX) root.GSFX.azzera();
    cam.x = cam.bx = cam.px = 0; cam.y = cam.by = cam.py = -140; cam.vx = cam.vy = cam.vz = 0; cam.trauma = 0; cam.punch = 0; cam.flash = 0;
    ann.t = 99;
  }

  // ================== interpolazione fra i passi del motore ==================
  // prima di ogni passo si copiano le posizioni; il disegno mescola precedente e attuale con alpha (0..1),
  // così a 90/120 Hz il movimento resta continuo. I salti grandi (teletrasporti, rinascite) non si mescolano.
  // ⚠️ RX/RY/QRX/QRY vanno in Float64: ripristina() li riscrive nello STATO. In Float32 il disegno arrotondava le
  // posizioni del motore e la partita nella pagina divergeva da quella del motore puro (rollback/online) — 15/10
  const IST = ['', '', '', ''];   // 18/10: stato prima del passo (lasciare il bordo e' un teletrasporto: niente mescola)
  const IPX = new Float64Array(4), IPY = new Float64Array(4), RX = new Float64Array(4), RY = new Float64Array(4);
  const QPX = new Float64Array(64), QPY = new Float64Array(64), QRX = new Float64Array(64), QRY = new Float64Array(64), QT = new Int32Array(64);
  function prima(S) {
    for (let i = 0; i < S.n; i++) { IPX[i] = S.L[i].x; IPY[i] = S.L[i].y; IST[i] = S.L[i].st; }
    for (let i = 0; i < S.P.length; i++) { QPX[i] = S.P[i].x; QPY[i] = S.P[i].y; QT[i] = S.P[i].on ? S.P[i].t : -1; }
  }
  function mescola(S, a) {
    for (let i = 0; i < S.n; i++) {
      const F = S.L[i]; RX[i] = F.x; RY[i] = F.y;
      const dx = F.x - IPX[i], dy = F.y - IPY[i];
      if (dx * dx + dy * dy < 140 * 140 && !(IST[i] === 'appeso' && F.st !== 'appeso')) { F.x = IPX[i] + dx * a; F.y = IPY[i] + dy * a; }
    }
    for (let i = 0; i < S.P.length; i++) {
      const P = S.P[i]; QRX[i] = P.x; QRY[i] = P.y;
      if (!P.on || QT[i] < 0 || QT[i] !== P.t - 1) continue;
      const dx = P.x - QPX[i], dy = P.y - QPY[i];
      if (dx * dx + dy * dy < 120 * 120) { P.x = QPX[i] + dx * a; P.y = QPY[i] + dy * a; }
    }
  }
  function ripristina(S) {
    for (let i = 0; i < S.n; i++) { S.L[i].x = RX[i]; S.L[i].y = RY[i]; }
    for (let i = 0; i < S.P.length; i++) { S.P[i].x = QRX[i]; S.P[i].y = QRY[i]; }
  }

  // ================== passo visivo (60 Hz) ==================
  function passo(S) {
    tempoVis++;
    const n = GS.nev();
    for (let k = 0; k < n; k++) evento(S, GS.EV[k]);
    if (root.GSV) root.GSV.passo(S);   // 19/10 voci.js: urlo dei colpi caricati al rilascio/impatto (solo audio, legge lo stato)
    if (root.GSFX) root.GSFX.passo(S);
    if (S.fermo > 0) { cam.punch = Math.max(cam.punch, 1); camPasso(S, true); return; }
    particellePasso(); scintillePasso(); root.GSE.passo(S); // particelle e scoppi a tema
    for (let i = 0; i < 4; i++) if (KO[i].t < 90) KO[i].t++;
    for (let i = 0; i < POP.length; i++) if (POP[i].t < POP[i].life) POP[i].t++;
    if (ann.t < ann.life) ann.t++;
    if (cam.flash > 0) cam.flash = Math.max(0, cam.flash - .12);
    if (cam.linee > 0) cam.linee--;
    for (let i = 0; i < S.n; i++) visivoLottatore(S, S.L[i], VF[i], i);
    camPasso(S, false);
  }

  function visivoLottatore(S, F, V, i) {
    const d = GS.D(F), H = d.H;
    V.sqx += (1 - V.sqx) * .34; V.sqy += (1 - V.sqy) * .34;
    if (V.antic > 0) V.antic--;
    if (V.ciclo > 0) V.ciclo--;
    V.pjv += 1.1; V.pjy += V.pjv; if (V.pjy > 0) { V.pjy = 0; V.pjv = 0; }
    if (V.flash > 0) V.flash--;
    if (V.sob > 0) V.sob--;
    if (V.pshake > 0) V.pshake *= .9;
    V.ppop += (1 - V.ppop) * .2;
    V.pt++;
    // passo della corsa proporzionale alla velocità (le gambe non pattinano), derapata nel giro
    V.passo += F.st === 'terra' ? Math.min(1.6, Math.abs(F.vx) / d.corsa * 1.25) : 1;
    if (V.derapa > 0) V.derapa--;
    if (F.st === 'terra' && F.dir !== V.dirPrima && Math.abs(F.vx) > 1.2) { V.derapa = 10; for (let k = 0; k < 5; k++) emetti(2, F.x + F.dir * 8, F.y - 2, F.dir * (1 + k * .6), -.6, 16, 6 + k, C_POLV, 0); if (SUONI) SUONI.derapa(); }
    V.dirPrima = F.dir;
    // scie e fumo nei voli lunghi
    const sp = Math.sqrt(F.kx * F.kx + F.ky * F.ky);
    if (F.st === 'stun' && F.hl === 0 && sp > 5) {
      V.spin += (F.kx >= 0 ? 1 : -1) * Math.min(.5, sp * .025);
      if (tempoVis % 2 === 0) emetti(1, F.x - F.kx * .5, F.y - H * .5 - F.ky * .5, -F.kx * .05 + (Math.random() - .5), -F.ky * .05, 30 + sp, 7 + sp * .6, C_FUMO, 0);
      if (sp > 13) { emetti(0, F.x, F.y - H * .5, -F.kx * .3 + (Math.random() - .5) * 3, -F.ky * .3 + (Math.random() - .5) * 3, 10, 4, Math.random() < .5 ? C_FUOCO : C_FUOCO2, 0); }
      if (sp > 8) { const nx = -F.ky / sp, ny = F.kx / sp; for (let k = -1; k <= 1; k += 2) emetti(0, F.x + nx * k * H * .3 - F.kx * .6, F.y - H * .5 + ny * k * H * .3 - F.ky * .6, F.kx * .55, F.ky * .55, 6, 2, C_BIANCO, 0); }
      if (sp > 18 && tempoVis % 2) emetti(5, F.x, F.y - H * .5, 0, 0, 10, H * .6, pc(V.col), 0);
    } else { V.spin *= .7; if (Math.abs(V.spin) < .01) V.spin = 0; }
    // scia dei movimenti veloci
    if (tempoVis % 2 === 0) { V.hi = (V.hi + 1) & 7; V.hx[V.hi] = F.x; V.hy[V.hi] = F.y; }
    // sbuffo allo scatto e passi in corsa
    if (F.st === 'terra' && F.plat >= 0) {
      const av = Math.abs(F.vx);
      if (av > d.corsa * .55 && V.vPrima <= d.corsa * .55) for (let k = 0; k < 4; k++) emetti(2, F.x - F.dir * 8, F.y - 2, -F.dir * (1 + k), -.4 - k * .2, 16, 7 + k * 2, C_POLV, 0);
      else if (av > d.corsa * .45 && Math.floor(V.passo / 13) !== Math.floor((V.passo - Math.min(1.6, av / d.corsa * 1.25)) / 13)) { emetti(2, F.x - F.dir * 6, F.y - 2, -F.dir * 1.2, -.3, 12, 4 + av * .5, C_POLV, 0); if (SUONI) SUONI.passo(av / d.corsa); }
      V.vPrima = av;
    } else V.vPrima = 0;
    // effetti delle mosse in corso
    if (F.st === 'mossa' && F.hl === 0) {
      const m = GS.mossaDi(d, F.mv), k = m.fx && m.fx.k;
      if (inCarica(F, m) && tempoVis % 3 === 0 && !(root.GSLOOK && root.GSLOOK.niente_tinta_carica && root.GSLOOK.niente_tinta_carica(F))) {
        const a = Math.random() * TAU, r = H * (.9 + Math.random() * .4);
        emetti(0, F.x + Math.cos(a) * r, F.y - H * .5 + Math.sin(a) * r, -Math.cos(a) * 4, -Math.sin(a) * 4, 12, 3, C_ORO, 0);
      }
      if (m.mant && F.mf >= m.mant.f0 && F.mf <= m.mant.f1) {
        if (k === 'fiamma' || k === 'onda') emetti(k === 'fiamma' ? 5 : 6, F.x + (Math.random() - .5) * 10, F.y + 4, (Math.random() - .5) * 2, 3 + Math.random() * 3, 18, k === 'fiamma' ? 16 : 20, k === 'fiamma' ? (Math.random() < .5 ? C_FUOCO : C_FUOCO2) : pc(V.col), 0);
        if (k === 'acqua') emetti(7, F.x + (Math.random() - .5) * H * .6, F.y - H * .4, (Math.random() - .5) * 5, -Math.random() * 4, 26, 3 + Math.random() * 3, C_ACQUA, .3);
        if (k === 'ghiaccio') emetti(3, F.x + (Math.random() - .5) * H * .6, F.y - H * Math.random(), 0, 0, 20, 7, C_GHIACCIO, 0);
        if (k === 'foglie') emetti(4, F.x + (Math.random() - .5) * H, F.y - H * Math.random(), (Math.random() - .5) * 3, 1, 30, 6, C_FOGLIA, .05);
        if (k === 'carte') emetti(4, F.x + (Math.random() - .5) * H, F.y - H * Math.random(), (Math.random() - .5) * 3, 1, 26, 9, C_BIANCO, .08);
        if (k === 'pipistrelli') emetti(4, F.x + (Math.random() - .5) * H, F.y - H * Math.random(), (Math.random() - .5) * 5, -1, 26, 7, C_SCURO, 0);
        if (k === 'kart' || k === 'ruota' || k === 'scopa' || k === 'scia' || k === 'lama' || k === 'elica' || k === 'scia_su' || k === 'pugno_su' || k === 'artiglio' || k === 'fumo')
          if (tempoVis % 2) emetti(2, F.x, F.y - 4, -F.vx * .2, -1, 18, 8, C_POLV, 0);
      }
      if (k === 'fiamma' && m.hb.length && !m.mant) for (const h of m.hb) if (F.mf >= h.f0 && F.mf <= h.f1) emetti(5, F.x + F.dir * h.x * H + (Math.random() - .5) * 20, F.y - h.y * H + (Math.random() - .5) * 20, F.dir * 3, -1, 14, 22, Math.random() < .5 ? C_FUOCO : C_FUOCO2, 0);
    }
    if (F.st === 'stordito' && tempoVis % 6 === 0) {
      const a = tempoVis * .2; emetti(3, F.x + Math.cos(a) * H * .35, F.y - H * 1.1, 0, -.2, 14, 6, C_ORO, 0);
    }
  }

  function camPasso(S, fermo) {
    if (!L) return;
    let x1 = 1e9, x2 = -1e9, y1 = 1e9, y2 = -1e9, n = 0;
    for (let i = 0; i < S.n; i++) {
      const F = S.L[i];
      if (F.st === 'morto' || F.st === 'fuori') continue;
      const bz = A.blast;
      const x = Math.max(bz.l + 120, Math.min(bz.r - 120, F.x)), y = Math.max(bz.t + 140, Math.min(bz.b - 60, F.y));
      if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; n++;
    }
    if (!n) { x1 = -200; x2 = 200; y1 = -200; y2 = 0; }
    // durante l'effetto di un'ulti si inquadra tutto il palco e il cielo sopra: lo spettacolo è lì
    if (S.U.on && S.U.fase === 2) { const st = A.solidi[0]; x1 = Math.min(x1, st.x1 - 60); x2 = Math.max(x2, st.x2 + 60); y1 = Math.min(y1, -440); }
    y2 = Math.max(y2, 30); y1 = Math.min(y1, -60);
    // margini: in verticale lo schermo è stretto, meglio stringere e lasciare le bolle a chi esce
    // rettangolo sicuro (schermo): fra la levetta e i tasti, sotto l'HUD. I lottatori stanno lì dentro
    const SR = L.safe || { x1: L.gx, x2: L.gx + L.gw, y1: L.gy, y2: L.gy + L.gh };
    const sw = SR.x2 - SR.x1, sh = SR.y2 - SR.y1;
    const mx = L.verticale ? 85 : 70, mt = 120, mb = 55;
    const bw = x2 - x1 + mx * 2, bh = y2 - y1 + mt + mb;
    let zt = Math.min(sw / bw, sh / bh);
    // zoom massimo più stretto: in 1v1 vicini i lottatori sono grandi
    const zMax = Math.min(sw / (L.verticale ? 330 : 300), sh / 260);
    const zMin = Math.max(L.verticale ? .44 : .4, L.gw / ((A.blast.r - A.blast.l) * .92), L.gh / ((A.blast.b - A.blast.t) * .95));
    zt = Math.max(zMin, Math.min(zMax, zt));
    // il centro dei lottatori va al centro del rettangolo sicuro, non al centro dello schermo
    const ox = (SR.x1 + SR.x2) / 2 - (L.gx + L.gw / 2), oy = (SR.y1 + SR.y2) / 2 - (L.gy + L.gh / 2);
    const tx = (x1 + x2) / 2 - ox / zt, ty = (y1 + y2) / 2 - (mt - mb) / 2 - oy / zt;
    if (!fermo) {
      const w = .11, wz = .07;
      cam.vx += w * w * (tx - cam.bx) - 2 * w * cam.vx; cam.bx += cam.vx;
      cam.vy += w * w * (ty - cam.by) - 2 * w * cam.vy; cam.by += cam.vy;
      const lz = Math.log(cam.bz);
      cam.vz += wz * wz * (Math.log(zt) - lz) - 2 * wz * cam.vz; cam.bz = Math.exp(lz + cam.vz);
      // non uscire troppo dalle zone di morte
      const hw = L.gw / 2 / cam.bz, hh = L.gh / 2 / cam.bz;
      cam.bx = Math.max(A.blast.l + hw * .9, Math.min(A.blast.r - hw * .9, cam.bx));
      cam.by = Math.max(A.blast.t + hh * .8, Math.min(A.blast.b - hh * .9, cam.by));
      if (cam.punch > 0) cam.punch = Math.max(0, cam.punch - .08);
    }
    // vista = base + pugno di zoom verso il colpo da KO
    const p = cam.punch, e = p * p * (3 - 2 * p);
    if (!fermo && p === 0) { cam.px = cam.x; cam.py = cam.y; cam.pz = cam.z; }
    cam.x = cam.bx + (cam.phx - cam.bx) * e * .7;
    cam.y = cam.by + (cam.phy - cam.by) * e * .7;
    cam.z = cam.bz * (1 + e * .45);
    cam.trauma = Math.max(0, cam.trauma - (fermo ? .01 : .03));
    cam.samp *= fermo ? .96 : .8; cam.sph += 1.55;
  }
  // scossa direzionale: la camera rimbalza avanti e indietro lungo la direzione del colpo, cresce col contraccolpo
  function scossaDir(wa, amp) {
    const r = wa * TAU / 360; cam.sdx = Math.cos(r); cam.sdy = -Math.sin(r);
    cam.samp = Math.min(30, Math.max(cam.samp, amp)); cam.sph = 0;
  }
  function scossa(t) { cam.trauma = Math.min(1, cam.trauma + t); }

  // ================== eventi della simulazione ==================
  function evento(S, e) {
    if (root.GSV) root.GSV.evento(S, e);   // 18/10 voci.js: versi e suoni dei lottatori (solo audio, legge l'evento e basta)
    if (root.GSUI && root.GSUI.evento && root.GSUI.evento(S, e, tempoVis)) return;   // 18/10 ui_1810.js: fiche AI (rottura a frammenti)
    const F = e.a >= 0 ? S.L[e.a] : null;
    switch (e.t) {
      case 'colpo': case 'colpoKO': {
        const V = S.L[e.b], dmg = e.v1, kb = e.v2, wa = e.v3, ko = e.t === 'colpoKO';
        const VV = VF[e.b];
        // CHIAREZZA (15/10): i colpi delle mosse base (jab, inclinate, smash, aerei, corsa) hanno effetti piccoli e brevi
        // nel colore del giocatore che colpisce; speciali, ulti e KO restano grandi. Con 3-4 giocatori ancora meno.
        const mA = F && F.st === 'mossa' ? GS.mossaDi(GS.D(F), F.mv) : null;
        const base = !ko && !!mA && mA.tipo === 'att', folla = S.n >= 3, kB = base ? (folla ? .42 : .55) : 1;
        if (base) { VV.sob = 3; VV.sobx = Math.cos(wa * TAU / 360) * 3; VV.soby = -Math.sin(wa * TAU / 360) * 3;
          scrittaPop(String(Math.max(1, Math.round(dmg))), F ? COLP[F.p] : '#fff', V.x + (V.x >= (F ? F.x : V.x) ? 1 : -1) * GS.D(V).H * .35, V.y - GS.D(V).H * 1.05, 13, 20).salita = 10; }
        VV.flash = ko ? 3 : 3; VV.pshake = Math.min(16, 4 + dmg * .9); VV.ppop = 1.3 + Math.min(.45, dmg * .025); VV.pjv = -(3 + dmg * .35);
        // contatore di combo: colpi che arrivano mentre il colpito è ancora stordito dal colpo prima
        VV.combo = tempoVis <= VV.comboFino ? VV.combo + 1 : 1; VV.comboFino = tempoVis + V.hl + Math.floor(kb * .4) + 8;
        // un solo cartello per combo: si aggiorna (e risalta) invece di accatastarsi
        if (VV.combo >= 3) {
          const cp = VV.comboPop;
          if (cp && cp.t < cp.life && cp.txt.indexOf('COMBO') === 0) { cp.txt = 'COMBO ×' + VV.combo; cp.t = 0; cp.life = 34; cp.h = 18 + Math.min(12, VV.combo * 1.5); cp.x = V.x; cp.y = V.y - GS.D(V).H * 1.6; }
          else VV.comboPop = scrittaPop('COMBO ×' + VV.combo, '#ffd23b', V.x, V.y - GS.D(V).H * 1.6, 18 + Math.min(12, VV.combo * 1.5), 34);
        }
        // commenti dei colpi notevoli
        if (!base && wa > 240 && wa < 300 && V.plat < 0 && kb > 60) scrittaPop(opz.lang === 'en' ? 'SPIKE!' : 'SCHIACCIATA!', '#ff6a3b', e.x, e.y - 40, 22, 40);
        if (!base) scossaDir(wa, 2 + dmg * .45 + kb * .045 + (ko ? 10 : 0));
        VV.hlMax = Math.max(1, V.hl);
        const col = F ? COLP[F.p] : '#fff';
        const fxN = !!root.GSFX && root.GSFX.colpo(S, e, F, mA, base, ko);   // FX 17/10: lampo/raggi/anello/schegge nuovi
        if (!fxN) {
        const s = (ko ? 12 + dmg * 1.5 : 12 + dmg * 2.2) * (F && F.id === 'boxer' ? 1.35 : 1);
        if (F && F.id === 'boxer' && dmg > 8) { emetti(5, e.x, e.y, 0, 0, 12, 40 + dmg * 3, C_ORO, 0); emetti(6, e.x, e.y, 0, 0, 10, 26 + dmg * 2, C_ROSSO, 0); }
        scintilla(e.x, e.y, s * kB, base ? col : (ko ? '#fff2a0' : (dmg > 11 ? '#ffd23b' : '#ffffff')), !base && (ko || dmg > 12), wa, base);
        // scintille nella direzione del lancio
        const ca = Math.cos(wa * TAU / 360), sa = -Math.sin(wa * TAU / 360);
        const nn = Math.round((4 + (dmg * .8 | 0) + (ko ? 10 : 0)) * (base ? kB * .8 : 1));
        for (let k = 0; k < nn; k++) {
          const sp = (4 + Math.random() * (6 + dmg * .7)) * (base ? .7 : 1), da = (Math.random() - .5) * 1.4;
          const vx = ca * Math.cos(da) - sa * Math.sin(da), vy = ca * Math.sin(da) + sa * Math.cos(da);
          emetti(0, e.x, e.y, vx * sp, vy * sp, (10 + Math.random() * 8) * (base ? .5 : 1), (2 + dmg * .25) * (base ? .7 : 1), base ? (k % 2 ? pc(col) : C_BIANCO) : (k % 3 ? C_BIANCO : pc(col)), 0);
        }
        if (dmg > 9 && !base) emetti(6, e.x, e.y, 0, 0, 14, 30 + dmg * 3, C_BIANCO, 0);
        if (base) emetti(6, e.x, e.y, 0, 0, 8, (18 + dmg * 1.5) * kB * 1.6, pc(col), 0);   // anello piccolo nel colore di chi colpisce
        }
        if (!base) root.GSE.impatto(S, e, F); // scoppio a tema di chi colpisce (acqua di Pinna, monete del Bot...)
        if (!base) scossa(ko ? .45 : Math.min(.2, dmg * .008));
        if (ko) { cam.phx = e.x; cam.phy = e.y; cam.punch = 1; cam.flash = .18; cam.flashCol = '#fff'; cam.linee = 22; cam.lx = e.x; cam.ly = e.y; cam.ka = e.a; cam.kv = e.b; VV.ciclo = 34; if (SUONI) SUONI.crack(); rallenta = 20; }
        if (opz.impatto && fortissimo(e, F, mA) && tempoVis - IMPF.ult >= IMP_PAUSA) {
          IMPF.ult = tempoVis; IMPF.pend = 1; IMPF.x = e.x; IMPF.y = e.y; IMPF.ka = e.a; IMPF.kv = e.b; IMPF.n++;
        }
        if (SUONI) SUONI.colpo(dmg, kb, ko);
        break;
      }
      case 'scudo': if (!(root.GSFX && root.GSFX.scudo(S, e))) { scintilla(e.x, e.y, 12 + e.v1, '#7fd8ff', false); emetti(6, e.x, e.y, 0, 0, 10, 26, C_BLU, 0); } scossa(.05); if (SUONI) SUONI.scudo(e.v1); break;
      case 'armatura': scintilla(e.x, e.y, 14 + e.v1, '#ffb060', false); if (SUONI) SUONI.colpo(e.v1 * .6, 0, false); break;
      case 'ko': {
        const k = KO[koNext]; koNext = (koNext + 1) % 4;
        const V = S.L[e.a];
        k.t = 0; k.x = e.x; k.y = e.y; k.col = COLP[e.a]; k.id = V.id; k.p = e.a;
        k.stella = e.v1 === 2 ? 1 : 0;
        // 18/10: tipo del KO scelto dal disegno (ko_speciali.js, hash di partita/giocatore/stock): 0 esplosione, 1 orizzonte, 2 schermo
        k.tipo = root.GSKO ? root.GSKO.tipo(S, e, A) : 0; if (root.GSKO) k.stella = 0;
        k.ang = Math.atan2(cam.by - e.y, cam.bx - e.x);
        if (e.v1 === 0) k.ang = 0; if (e.v1 === 1) k.ang = Math.PI; if (e.v1 === 3) k.ang = -Math.PI / 2;
        if (!k.stella && !k.tipo) { scossa(.9); cam.flash = .55; cam.flashCol = COLP[e.a]; }
        if (SUONI) SUONI.ko(k.stella || k.tipo ? 1 : 0, e.v3 <= 0);
        if (e.b >= 0) { const sx = Math.max(A.blast.l + 160, Math.min(A.blast.r - 160, e.x)), sy = Math.max(A.blast.t + 160, Math.min(40, e.y)); scrittaPop((opz.lang === 'en' ? 'KO AT ' : 'KO A ') + Math.round(e.v2) + '%!', e.v2 < 90 ? '#ff3b4e' : '#ffffff', sx, sy, e.v2 < 90 ? 30 : 24, 70); }
        break;
      }
      case 'salto': case 'salto2': {
        const VV = VF[e.a]; VV.sqx = .78; VV.sqy = 1.24; if (e.t === 'salto2') VV.s2 = tempoVis;
        const n = e.t === 'salto2' ? 6 : 4;
        for (let k = 0; k < n; k++) emetti(2, e.x + (Math.random() - .5) * 20, e.y - 2, (Math.random() - .5) * 4, e.t === 'salto2' ? 2 : -.5, 18, 7 + Math.random() * 5, C_POLV, 0);
        if (e.t === 'salto2') emetti(6, e.x, e.y, 0, 0, 12, 26, C_BIANCO, 0);
        if (SUONI) SUONI.salto(e.t === 'salto2');
        break;
      }
      case 'atterra': {
        const VV = VF[e.a], u = Math.min(1, e.v1 / 14);
        VV.sqx = 1 + .36 * u + .1; VV.sqy = 1 - .3 * u - .08;
        if (e.v1 > 3) for (let k = 0; k < 2 + u * 6; k++) emetti(2, e.x + (k % 2 ? 1 : -1) * (6 + k * 3), e.y - 2, (k % 2 ? 1 : -1) * (1.5 + u * 3), -.3, 16, 6 + u * 6, C_POLV, 0);
        if (SUONI && e.v1 > 3) SUONI.atterra(u);
        break;
      }
      case 'rimbalzo': {
        for (let k = 0; k < 10; k++) emetti(4, e.x, e.y, (Math.random() - .5) * 8, -Math.random() * 7, 28, 5, C_POLV, .35);
        emetti(6, e.x, e.y, 0, 0, 14, 40, C_BIANCO, 0);
        scossa(.25);
        if (SUONI) SUONI.rimbalzo();
        break;
      }
      case 'tech': if (VF[e.a]) VF[e.a].tc = tempoVis; emetti(6, e.x, e.y - 20, 0, 0, 14, 36, C_BLU, 0); emetti(5, e.x, e.y - 20, 0, 0, 10, 40, C_BIANCO, 0); if (SUONI) SUONI.tech(); break;
      case 'boom': {
        emetti(6, e.x, e.y, 0, 0, 18, e.v1 * 1.3, C_FUOCO2, 0);
        for (let k = 0; k < 18; k++) { const a = Math.random() * TAU, s = 2 + Math.random() * 7; emetti(k % 3 ? 5 : 1, e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 18 + Math.random() * 14, 16 + Math.random() * 14, k % 3 ? (k % 2 ? C_FUOCO : C_FUOCO2) : C_FUMO, 0); }
        scossa(.4); if (SUONI) SUONI.boom();
        break;
      }
      case 'clank': scintilla(e.x, e.y, 18, '#ffffff', false); for (let k = 0; k < 6; k++) emetti(0, e.x, e.y, (Math.random() - .5) * 10, (Math.random() - .5) * 10, 10, 2, C_ORO, 0); if (SUONI) SUONI.clank(); break;
      case 'counter': scintilla(e.x, e.y, 34, '#ffffff', true); cam.flash = .3; cam.flashCol = '#ffffff'; scrittaPop(opz.lang === 'en' ? 'COUNTER!' : 'CONTRATTACCO!', '#ffffff', e.x, e.y - 50, 22, 44); if (SUONI) SUONI.counter(); break;
      case 'riflesso': emetti(6, e.x, e.y, 0, 0, 10, 30, C_BLU, 0); scintilla(e.x, e.y, 16, '#7fd8ff', false); if (SUONI) SUONI.clank(); break;
      case 'rotto': {
        for (let k = 0; k < 16; k++) { const a = Math.random() * TAU, s = 3 + Math.random() * 6; emetti(4, e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 34, 7, C_BLU, .25); }
        emetti(6, e.x, e.y, 0, 0, 20, 70, C_BLU, 0); scossa(.4); cam.flash = .35; cam.flashCol = '#7fd8ff';
        if (SUONI) SUONI.rotto();
        break;
      }
      case 'tele': for (let k = 0; k < 8; k++) emetti(1, e.x + (Math.random() - .5) * 40, e.y - Math.random() * 60, (Math.random() - .5) * 2, -Math.random(), 26, 14, C_FUMO, 0); emetti(3, e.x, e.y - 30, 0, 0, 18, 14, C_BIANCO, 0); if (SUONI) SUONI.tele(); break;
      case 'proj': if (F) { emetti(5, e.x, e.y, 0, 0, 7, 20 + e.v1, pc(VF[e.a].col), 0); if (SUONI) SUONI.proj(F.id); } break;
      case 'poof': for (let k = 0; k < 4; k++) emetti(1, e.x, e.y, (Math.random() - .5) * 2, -Math.random(), 18, 8, C_FUMO, 0); break;
      case 'mossa': {
        if (F && VF[e.a]) { const VV = VF[e.a]; VV.antic = 5; VV.sqx = e.v1 ? .86 : .9; VV.sqy = e.v1 ? 1.16 : 1.1; }
        if (!SUONI || !F) break;
        const dd = GS.L.lista[e.v3 >> 6], kk = GS.L.KEYS[e.v3 & 63], mm = dd && kk && dd.mosse[kk];
        if (mm && mm.son) SUONI.preset(mm.son); else SUONI.fruscio(e.v1, e.v2);
        break;
      }
      case 'carica': if (SUONI) SUONI.carica(e.v1); break;
      case 'presa': if (SUONI) SUONI.presa(); break;
      case 'lancio_presa': { if (VF[e.a]) VF[e.a].ld = e.v1; const st = GS.L.lista[e.v2] && GS.L.lista[e.v2].lanci.stile; emetti(6, e.x, e.y - 30, 0, 0, 14, 36, C_BIANCO, 0); root.GSE.lancio(S, e, F); if (SUONI) SUONI.fruscio(0, 30); break; }
      case 'bordo': if (SUONI) SUONI.bordo(); break;
      case 'trump': emetti(5, e.x, e.y, 0, 0, 12, 46, C_BIANCO, 0); scrittaPop(opz.lang === 'en' ? 'LEDGE STOLEN!' : 'BORDO RUBATO!', '#ffd23b', e.x, e.y - 60, 18, 36); if (SUONI) SUONI.bordo(); break;
      case 'libero': emetti(6, e.x, e.y, 0, 0, 12, 34, C_BIANCO, 0); for (let k = 0; k < 6; k++) emetti(0, e.x, e.y, (Math.random() - .5) * 8, -Math.random() * 6, 14, 3, C_BIANCO, .3); if (SUONI) SUONI.tech(); break;
      case 'sdi': emetti(3, e.x, e.y - 30, 0, 0, 6, 10, C_BIANCO, 0); break;
      case 'salto_pieno': emetti(2, e.x, e.y + 4, 0, 1.5, 10, 6, C_POLV, 0); break;
      case 'lag_atterra': { const VV = VF[e.a]; if (VV) { VV.sqx = 1.3; VV.sqy = .7; } for (let k = 0; k < 4; k++) emetti(2, e.x + (k - 1.5) * 10, e.y - 2, (k - 1.5) * 1.4, -.4, 16, 7, C_POLV, 0); break; }
      case 'stordito': for (let k = 0; k < 6; k++) emetti(3, e.x, e.y, (Math.random() - .5) * 5, -Math.random() * 4, 24, 8, C_ORO, 0); if (SUONI) SUONI.stordito(); break;
      case 'rinasce': emetti(6, e.x, e.y, 0, 0, 20, 50, pc(COLP[e.a]), 0); if (SUONI) SUONI.rinasce(); break;
      case 'via': annuncio(opz.lang === 'en' ? 'GO!' : 'VIA!', '#ffd23b', 50, 1.3); if (SUONI) SUONI.via(); break;
      // arene 15/10: pericoli a tempo (metro)
      case 'treno_avviso': annuncio(opz.lang === 'en' ? (e.v1 < 0 ? '◀ TRAIN!' : 'TRAIN! ▶') : (e.v1 < 0 ? '◀ TRENO!' : 'TRENO! ▶'), '#ff3b4e', 110, .7); if (SUONI) SUONI.campana(); break;
      case 'treno': scossa(.22); if (SUONI) SUONI.boom(); break;
      case 'pericolo': scrittaPop(opz.lang === 'en' ? 'RUN OVER!' : 'INVESTITO!', '#ff6a3b', e.x, e.y - 50, 22, 44); break;
      case 'sd': annuncio(opz.lang === 'en' ? 'SUDDEN DEATH' : 'SPAREGGIO!', '#ff3b4e', 90, .8); if (SUONI) SUONI.via(); break;
      case 'fine': annuncio('GAME!', '#ffffff', 999, 1.4); cam.flash = .6; if (SUONI) SUONI.fine(); break;
      case 'trappola': emetti(2, e.x, e.y, 0, -1, 14, 10, C_POLV, 0); break;
      case 'oggetto': emetti(3, e.x, e.y + 60, 0, 0, 30, 16, C_ORO, 0); break;
      case 'raccogli': if (SUONI) SUONI.bordo(); break;
      case 'rimbalzo_p': if (SUONI) SUONI.tick(); break;
      case 'fiche_appare': annuncio(opz.lang === 'en' ? 'FINISHER CHIP!' : 'FICHE FINISHER!', '#ffd23b', 70, .55); emetti(6, e.x, e.y, 0, 0, 30, 80, C_ORO, 0); if (SUONI) SUONI.fiche(0); break;
      case 'fiche_colpo': { for (let k = 0; k < 8; k++) emetti(0, e.x, e.y, (Math.random() - .5) * 12, (Math.random() - .5) * 12, 14, 3, C_ORO, 0); scintilla(e.x, e.y, 26, '#ffd23b', false); scossa(.08); if (SUONI) SUONI.fiche(1); break; }
      case 'fiche_rotta': {
        for (let k = 0; k < 30; k++) { const a = Math.random() * TAU, sp = 3 + Math.random() * 9; emetti(k % 2 ? 4 : 0, e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, 30, 6, k % 3 ? C_ORO : C_ROSSO, k % 2 ? .25 : 0); }
        emetti(6, e.x, e.y, 0, 0, 24, 140, C_ORO, 0); cam.flash = .45; cam.flashCol = '#ffd23b'; scossa(.35);
        if (e.a === opz.umano) annuncio(opz.lang === 'en' ? 'ULTI READY: press SPECIAL!' : 'ULTI PRONTA: premi SPECIALE!', '#ffd23b', 100, .55);
        if (SUONI) SUONI.fiche(2);
        break;
      }
      case 'fiche_persa': for (let k = 0; k < 12; k++) emetti(0, e.x, e.y, (Math.random() - .5) * 10, -Math.random() * 8, 18, 3, C_ORO, .2); if (SUONI) SUONI.fiche(1); break;
      case 'ulti_spenta': emetti(1, e.x, e.y - 40, 0, -1, 30, 26, C_FUMO, 0); break;
      case 'ulti_intro': if (SUONI) SUONI.ulti(0); break;
      case 'ulti_via': scossa(.6); cam.flash = .5; cam.flashCol = COLP[e.a]; if (SUONI) SUONI.ulti(1); break;
      case 'ulti_fine': break;
      case 'scontro': scintilla(e.x, e.y, 30 + e.v1, '#ffffff', true); for (let k = 0; k < 10; k++) emetti(0, e.x, e.y, (Math.random() - .5) * 14, (Math.random() - .5) * 14, 12, 3, C_ORO, 0); scossa(.2); scrittaPop(opz.lang === 'en' ? 'CLASH!' : 'SCONTRO!', '#fff', e.x, e.y - 30, 20, 34); if (SUONI) SUONI.scontro(); break;
      case 'parata': if (!(root.GSFX && root.GSFX.parata(S, e))) { emetti(6, e.x, e.y, 0, 0, 16, 50, C_BIANCO, 0); emetti(5, e.x, e.y, 0, 0, 12, 60, C_BLU, 0); } cam.flash = .25; cam.flashCol = '#ffffff'; scrittaPop(opz.lang === 'en' ? 'PERFECT SHIELD!' : 'PARATA PERFETTA!', '#7fd8ff', e.x, e.y - 40, 22, 44); if (SUONI) SUONI.parata(); break;
      case 'barcolla': for (let k = 0; k < 8; k++) emetti(3, e.x, e.y, (Math.random() - .5) * 5, -Math.random() * 4, 30, 9, C_ORO, 0); scrittaPop(opz.lang === 'en' ? 'STAGGERED!' : 'BARCOLLA!', '#ffd23b', e.x, e.y - 30, 22, 50); scossa(.25); if (SUONI) SUONI.campana(); break;
      case 'sdraiato': for (let k = 0; k < 6; k++) emetti(2, e.x + (k - 3) * 8, e.y - 2, (k - 3) * .8, -.4, 18, 8, C_POLV, 0); if (SUONI) SUONI.atterra(1); break;
      case 'rialza': emetti(2, e.x, e.y - 2, 0, -.5, 14, 10, C_POLV, 0); break;
      case 'muro_salto': for (let k = 0; k < 6; k++) emetti(2, e.x, e.y + (k - 3) * 8, e.v1 * 2, (k - 3) * .4, 16, 7, C_POLV, 0); emetti(6, e.x, e.y, 0, 0, 12, 26, C_BIANCO, 0); if (SUONI) SUONI.salto(true); break;
      case 'colpetto': scintilla(e.x, e.y, 10, '#ffffff', false); if (SUONI) SUONI.colpo(2, 0, false); break;
      case 'dado': { const v = e.v1; scrittaPop(v > 9 ? (Math.floor(v / 10) + ' + ' + (v % 10)) : String(v), '#b6ff3b', e.x, e.y, v > 9 ? 40 : 30, 60); if (SUONI) SUONI.dado(); break; }
      case 'boxe_colpo': if (e.v1 >= 9) { scrittaPop(opz.lang === 'en' ? 'BOMB!' : 'BOMBA!', '#ffd23b', e.x, e.y - 20, 22, 30); scossa(.18); } break;
      case 'bomba_via': { const VV = VF[e.a]; if (VV) { VV.sqx = 1.25; VV.sqy = .82; } for (let k = 0; k < 6; k++) emetti(2, e.x - (F ? F.dir : 1) * k * 5, e.y - 2, -(F ? F.dir : 1) * (2 + k * .8 + e.v1 * 3), -.6 - k * .2, 18, 8 + k + e.v1 * 6, C_POLV, 0); scossa(.06 + e.v1 * .14); if (SUONI) { SUONI.dash(); SUONI.preset(['w', 300 + e.v1 * 400, 120, .25 + e.v1 * .2, .25, .6]); } break; }
      case 'bomba_impatto': scintilla(e.x, e.y, 26 + e.v1 * 10, e.v1 >= 3 ? '#ffd23b' : '#ff6a3b', true); emetti(6, e.x, e.y, 0, 0, 12, 40 + e.v1 * 14, e.v1 >= 3 ? C_ORO : C_ROSSO, 0); break;
      case 'carica_piena': emetti(5, e.x, e.y, 0, 0, 14, 60, C_ORO, 0); if (SUONI) SUONI.tick(); break;
      case 'pesca': if (SUONI) { SUONI.tick(); SUONI.carica(e.v1 / 5); } break;
      case 'scala': { const k = e.v1; emetti(2, e.x, e.y + 4, 0, 1, 10, 8, C_BIANCO, 0); if (k >= 4) { scrittaPop(opz.lang === 'en' ? 'ROYAL FLUSH!' : 'SCALA REALE!', '#ffd23b', e.x, e.y - 90, 24, 50); emetti(6, e.x, e.y - 30, 0, 0, 16, 70, C_ORO, 0); scossa(.2); if (SUONI) SUONI.campana(); } else if (SUONI) SUONI.carica(.2 + k * .2); break; }
      case 'banco': scrittaPop(opz.lang === 'en' ? 'HOUSE WINS!' : 'BANCO!', '#ffd23b', e.x, e.y - 30, 22, 40); scossa(.15); if (SUONI) SUONI.counter(); break;
      case 'aggancio': scintilla(e.x, e.y - 30, 14, '#ffd23b', false); if (SUONI) SUONI.presa(); break;
      case 'servita': if (F) for (let k = 0; k < 4; k++) emetti(2, e.x + F.dir * (20 + k * 6), e.y - 2, F.dir * (1 + e.v1 * 3), -.4, 14, 6 + k, C_POLV, 0); if (SUONI) SUONI.dash(); break;
      case 'ululato': emetti(6, e.x, e.y, 0, 0, 14, 30 + e.v1 * 50, C_BIANCO, 0); scossa(.05 + e.v1 * .15); if (SUONI) SUONI.ululato(); break;
      case 'carica_messa': scrittaPop(opz.lang === 'en' ? 'CHARGE KEPT' : 'CARICA TENUTA', '#ffd23b', e.x, e.y - 20, 15, 30); break;
      case 'sfonda': emetti(5, e.x, e.y, 0, 0, 16, 90, C_ORO, 0); scrittaPop(opz.lang === 'en' ? 'SHIELD SMASHED!' : 'SCUDO SFONDATO!', '#ffd23b', e.x, e.y - 50, 24, 50); scossa(.4); cam.flash = .2; cam.flashCol = '#ffd23b'; if (SUONI) { SUONI.rotto(); SUONI.crack(); } break;
      case 'scivola': for (let k = 0; k < 6; k++) emetti(2, e.x - e.v1 * k * 6, e.y - 2, -e.v1 * (1 + k * .5), -.8, 18, 7 + k, C_POLV, 0); if (SUONI) SUONI.dash(); break;
      case 'rabbia_piena': emetti(5, e.x, e.y, 0, 0, 18, 80, C_ROSSO, 0); scrittaPop(opz.lang === 'en' ? 'CHAMP RAGE!' : 'RABBIA DEL CAMPIONE!', '#ff3b3b', e.x, e.y - 30, 22, 60); if (SUONI) SUONI.campana(); break;
      case 'gancioKO': cam.flash = .25; cam.flashCol = '#ff2020'; scrittaPop(opz.lang === 'en' ? 'KO HOOK!' : 'GANCIO KO!', '#ff3b3b', e.x, e.y - 60, 30, 50); scossa(.25); if (SUONI) SUONI.carica(1); break;
      case 'gancio_finale': cam.punch = 1; cam.phx = e.x; cam.phy = e.y; rallenta = 24; if (SUONI) SUONI.crack(); break;
      case 'trasf': { emetti(6, e.x, e.y - 40, 0, 0, 24, 100, C_ROSSO, 0); for (let k = 0; k < 14; k++) emetti(5, e.x, e.y - 40, (Math.random() - .5) * 8, (Math.random() - .5) * 8, 20, 20, C_ROSSO, 0); scossa(.3); if (SUONI) SUONI.ululato(); break; }
      case 'lento': emetti(6, e.x, e.y - 30, 0, 0, 14, 40, C_GHIACCIO, 0); break;
      case 'maledetto': scrittaPop('☠', '#b45aff', e.x, e.y, 30, 40); break;
      case 'cura': scrittaPop('+' + Math.round(e.v1) + '%', '#38f08a', e.x, e.y, 20, 40); break;
      case 'assorbe': emetti(6, e.x, e.y, 0, 0, 14, 40, C_ROSSO, 0); scrittaPop('+' + Math.round(e.v1), '#ffd23b', e.x, e.y - 20, 18, 30); if (SUONI) SUONI.scudo(e.v1); break;
      case 'guardia_ok': emetti(6, e.x, e.y, 0, 0, 14, 40, C_BIANCO, 0); scrittaPop(opz.lang === 'en' ? 'BLOCKED!' : 'BLOCCATO!', '#7fffd4', e.x, e.y - 30, 18, 36); if (SUONI) SUONI.parata(); break;
      case 'campana': scrittaPop('DING DING!', '#ffd23b', e.x, e.y - 120, 32, 60); if (SUONI) SUONI.campana(); break;
      case 'iaido': for (let k = 0; k < 12; k++) emetti(0, e.x + (e.v1 - e.x) * k / 12, e.y, 0, 0, 16, 5, C_BIANCO, 0); if (SUONI) SUONI.taglio(); break;
      case 'settebello': scrittaPop('7'.repeat(e.v1), '#ffcf33', e.x, e.y, 28, 24); if (SUONI) SUONI.taglio(); break;
      case 'pilastro': scossa(.25); emetti(6, e.x, e.y, 0, 0, 16, 60, C_VIOLA, 0); if (SUONI) SUONI.boom(); break;
      case 'terremoto': scossa(.5); for (let k = 0; k < 16; k++) emetti(4, e.x + (Math.random() - .5) * 300, e.y - 2, (Math.random() - .5) * 3, -2 - Math.random() * 5, 30, 6, C_POLV, .35); if (SUONI) SUONI.boom(); break;
      case 'sostituzione': for (let k = 0; k < 8; k++) emetti(1, e.x + (Math.random() - .5) * 30, e.y, 0, -.5, 22, 12, C_FUMO, 0); if (SUONI) SUONI.tele(); break;
      case 'carambola': if (SUONI) SUONI.tick(); emetti(0, e.x, e.y, 0, -3, 8, 3, C_BIANCO, 0); break;
      case 'appiccica': scrittaPop('!', '#ff8a1c', e.x, e.y - 20, 26, 30); break;
      case 'scambio': for (let k = 0; k < 10; k++) emetti(3, e.x + (Math.random() - .5) * 40, e.y + (Math.random() - .5) * 40, 0, -1, 24, 8, C_VIOLA, 0); if (SUONI) SUONI.tele(); break;
      case 'pulsa': if (SUONI) SUONI.basso(); break;
      case 'molla': emetti(6, e.x, e.y, 0, 0, 12, 30 + e.v1 * 30, C_BLU, 0); break;
      case 'liana': emetti(4, e.x, e.y, 0, -1, 26, 8, C_FOGLIA, .1); break;
      case 'rilascio': scintilla(e.x, e.y, 30 + e.v1, '#ff6a3b', true); scossa(.2); break;
      case 'conficca': for (let k = 0; k < 5; k++) emetti(4, e.x, e.y, (Math.random() - .5) * 5, -Math.random() * 4, 22, 5, C_POLV, .3); if (SUONI) SUONI.clank(); break;
      case 'inchioda': scrittaPop('!', '#fff', e.x, e.y - 60, 24, 30); break;
      case 'ricompone': for (let k = 0; k < 6; k++) emetti(4, e.x + (Math.random() - .5) * 40, e.y - 10, (Math.random() - .5) * 4, -3, 20, 6, C_BIANCO, .3); break;
      case 'clic': scrittaPop('CLICK', '#ff3030', e.x, e.y, 16, 24); break;
      case 'skid': case 'frena': { const F2 = S.L[e.a], dv = F2 ? -F2.dir : 1; for (let k = 0; k < 5; k++) emetti(2, e.x + (Math.random() - .5) * 12, e.y - 2, dv * (1 + Math.random() * 2.5), -.5 - Math.random(), 18, 6 + k * 1.5, C_POLV, 0); if (VF[e.a]) VF[e.a].derapa = 8; if (SUONI) SUONI.derapa(); break; }
      case 'dash': { for (let k = 0; k < 4; k++) emetti(2, e.x - e.v1 * 10, e.y - 2, -e.v1 * (1.5 + k), -.4, 14, 7 + k, C_POLV, 0); const VV = VF[e.a]; if (VV) { VV.sqx = 1.18; VV.sqy = .86; } if (SUONI) SUONI.dash(); break; }
      case 'ff': { emetti(3, e.x, e.y - 10, 0, 0, 10, 14, C_BIANCO, 0); emetti(0, e.x, e.y - 30, 0, 9, 8, 3, C_BIANCO, 0); const VV = VF[e.a]; if (VV) { VV.sqx = .85; VV.sqy = 1.2; } if (SUONI) SUONI.ff(); break; }
    }
  }

  // ================== disegno ==================
  // mira per GBR: angolo del MONDO in radianti con y in giù (0 = destra, -PI/2 = su)
  function aimDi(m, dir) { const r = (m.aim || 0) * TAU / 360; return dir > 0 ? -r : Math.PI + r; }
  // tempo della posa sincronizzato con la mossa: l'impatto disegnato (≈0.13 s in 'attack', ≈0.32 s in 'super')
  // cade sul primo fotogramma attivo della hitbox
  function tempoMossa(m, mf, sup) {
    let f0 = 0, f1 = 0;
    if (m.hb.length) { f0 = m.hb[0].f0; f1 = m.hb[0].f1; }
    else if (m.proj && m.proj.length) { f0 = m.proj[0].f; f1 = f0 + 2; }
    else if (m.mant) { f0 = m.mant.f0; f1 = m.mant.f1; }
    else { f0 = 8; f1 = 12; }
    if (f1 > 60) f1 = f0 + 6;
    const imp = sup ? .32 : .13, fine = sup ? .75 : .34;
    if (mf < f0) return imp * mf / Math.max(1, f0);
    // 16/10 colpi caricati (smash): la posa dell'impatto si tiene almeno TIENI_IMP fotogrammi di gioco anche a vuoto
    // (prima durava solo i fotogrammi attivi, 2-4); il tempo resta dentro il fotogramma dell'impatto dell'atlante
    // (0,13-0,146), poi il seguito recupera nel resto della mossa. Solo disegno: hitbox e tempi del motore uguali.
    if (m.carica) {
      const fh = Math.max(f1, f0 + TIENI_IMP - 1);
      if (mf <= fh) return imp + .012 * (mf - f0) / Math.max(1, fh - f0);
      return Math.min(fine, imp + .03 + (fine - imp - .03) * (mf - fh) / Math.max(1, m.tot - fh));
    }
    if (mf <= f1) return imp + .03 * (mf - f0) / Math.max(1, f1 - f0 + 1);
    return Math.min(fine, imp + .03 + (fine - imp - .03) * (mf - f1) / Math.max(1, m.tot - f1));
  }
  const TIENI_IMP = 6;
  // sta CARICANDO adesso (tasto tenuto, il motore tiene F.mf fermo su m.carica.f). F.mc resta > 0 fino alla fine
  // della mossa (serve al danno) e conta anche i giri delle raffiche: da solo non vuol dire «in carica».
  function inCarica(F, m) { return F.mc > 0 && !!m && !!m.carica && F.mf === m.carica.f; }
  // smash per cui in carica la posa generica 'carica' si legge meglio del fotogramma della mossa ('id.mossa': 1)
  const CARICA_GEN = {};
  const POSA = { pose: 'idle', aim: undefined, t: 0 };
  function posaDi(S, F, V) {
    let pose = 'idle', aim = undefined, t = V.pt / 60;
    const d = GS.D(F);
    switch (F.st) {
      case 'terra': pose = Math.abs(F.vx) > 1 ? 'run' : 'idle'; if (pose === 'run') t = V.passo / 60; break;
      case 'squat': case 'atterra': pose = F.lanciato > 0 ? 'attack' : 'idle'; if (F.lanciato > 0) { t = .2; aim = F.dir > 0 ? -.4 : Math.PI + .4; } break;
      case 'aria': pose = F.tum ? 'ko' : F.vy < 0 ? 'jump' : 'fall'; break; // tumble: volo scomposto
      case 'cade': pose = 'fall'; break;
      case 'mossa': { const m = GS.mossaDi(d, F.mv); pose = m.posa || 'attack'; aim = aimDi(m, F.dir); t = m.tPosa ? m.tPosa(F, F.mf) : tempoMossa(m, F.mf, pose === 'super'); break; } // tPosa: la mossa decide il tempo della posa (Arciere: il rilascio cade quando parte la freccia)
      case 'scudo': pose = 'shield'; break;
      case 'schiva': pose = F.plat >= 0 ? 'idle' : 'fall'; break;
      case 'stun': { const sp = Math.sqrt(F.kx * F.kx + F.ky * F.ky); pose = sp > 6 ? 'ko' : 'hit'; break; }
      case 'sdraiato': pose = 'ko'; t = .5 + V.pt / 60; break;
      case 'stordito': case 'preso': pose = 'hit'; break;
      case 'appeso': pose = 'fall'; break;
      case 'tiene': pose = 'attack'; t = .13; aim = F.dir > 0 ? 0 : Math.PI; break;
      case 'rinasce': pose = 'idle'; break;
      case 'ulti': pose = 'super'; t = Math.min(.7, V.pt / 60); break;
    }
    POSA.pose = pose; POSA.aim = aim; POSA.t = t;
    return POSA;
  }
  const CICLO = ['#ffffff', '#ff3b4e', '#ffd23b', '#3bb8ff'];
  // la scia del guantone del Campione: dalla spalla al punto del colpo, a strati che sfumano
  function sciaGuantone(c, F, d, V) {
    const m = GS.mossaDi(d, F.mv);
    if (!m || !m.hb || !m.hb.length) return;
    let h = null; for (let j = 0; j < m.hb.length; j++) { const q = m.hb[j]; if (F.mf >= q.f0 - 2 && F.mf <= q.f1 + 3 && q.dmg > 2) { h = q; break; } }
    if (!h) return;
    const H = d.H, sx = F.x, sy = F.y - H * .65, gx = F.x + F.dir * h.x * H, gy = F.y - h.y * H, att = F.mf >= h.f0 && F.mf <= h.f1;
    c.lineCap = 'round';
    for (let k = 3; k >= 1; k--) {
      const q = k / 3, mx = sx + (gx - sx) * (1 - q * .55), my = sy + (gy - sy) * (1 - q * .55) - H * .12 * q;
      c.globalAlpha = (att ? .5 : .25) * (1 - q * .6); c.strokeStyle = k === 1 ? '#ffd23b' : '#ff3b3b'; c.lineWidth = H * (.2 - q * .04);
      c.beginPath(); c.moveTo(mx, my); c.lineTo(gx, gy); c.stroke();
    }
    c.globalAlpha = 1;
  }
  const POSE_OK = { idle: 1, run: 1, attack: 1, super: 1, hit: 1, ko: 1, win: 1, jump: 1, fall: 1, shield: 1 };
  // pose nuove del cast (quando ci saranno): attack_up, attack_down, dash, grab, charge, ulti — altrimenti le vecchie
  function poseG(nome, rip, id) {
    const G = root.GBR; if (!G || !G.pose) return rip;
    const P = typeof G.pose === 'function' ? G.pose(id) : G.pose;
    return P && P.indexOf && P.indexOf(nome) >= 0 ? nome : rip;
  }
  // posa dell'atlante 3D per una chiave di mossa, solo se quel personaggio è già carico in 3D
  const MV3D = { jab2: 'jab', jab3: 'jab', gko: 'nspec', sale_att: 'side', rialza_att: 'side' };
  const POSE3D = {};
  function posa3d(id, k) {
    const G = root.GBR; if (!G || !G.pronto || !G.pronto(id)) return null;
    const P = POSE3D[id] || (POSE3D[id] = G.pose(id));
    // 18/10: prima la posa DEDICATA della mossa (jab2, jab3, gko...), la riserva di MV3D solo se l'atlante non ce l'ha.
    // Prima la riserva vinceva sempre: la serie di pugni si disegnava tutta come 'jab' e il gancio KO come 'nspec'.
    if (P.indexOf(k) >= 0) return k;
    const r = MV3D[k];
    return r && P.indexOf(r) >= 0 ? r : null;
  }

  // stato del motore -> posa dell'atlante 3D (solo se quel personaggio ce l'ha); null = la posa di prima
  const RECENTE = 30;   // fotogrammi di disegno in cui un evento (tech, risalita, rialzata, doppio salto) decide la posa
  function stato3d(F, V, d) {
    const fa = k => tempoVis - (V[k] == null ? -1e9 : V[k]);
    if (V.ps3 === 'sdraiato' && F.st !== 'sdraiato') V.ri = tempoVis;
    if (V.ps3 === 'appeso' && F.st === 'atterra') V.sl = tempoVis;
    if (V.ps3 === 'appeso' && F.st === 'aria' && F.vy < -2) V.sb = tempoVis;   // 18/10: salto dal bordo -> posa 'salto_bordo' (se l'atlante ce l'ha)
    let n = null;
    switch (F.st) {
      case 'terra':
        if (F.skid > 0) n = 'frenata';
        else if (F.dashT > 0) n = 'scatto';
        else if (Math.abs(F.vx) > 1) n = F.run || Math.abs(F.vx) > d.corsa * .72 ? null : 'walk';
        else if (F.ch) n = 'accucciato';
        break;
      case 'squat': n = 'accucciato'; break;
      case 'atterra':
        if (F.lanciato > 0) n = V.ld === 3 ? 'lancio_giu' : 'lancio';
        else if (fa('sl') < RECENTE) n = 'risale';
        else if (fa('tc') < RECENTE) n = 'tech';
        else if (fa('ri') < RECENTE) n = 'rialza';
        else n = 'atterra';
        break;
      case 'aria':
        if (F.tum) n = 'volo';
        else if (fa('sb') < 22 && posa3d(F.id, 'salto_bordo')) n = 'salto_bordo';
        else if (fa('s2') < 24) n = 'salto2';
        else if (F.ff && F.vy > 0) n = 'caduta_rapida';
        break;
      case 'appeso': n = 'appeso'; break;
      case 'schiva': n = F.mv === 'rotola' ? 'rotola' : F.mv === 'schivata' ? 'schivata' : 'schivata_aria'; break;
      case 'stun': if (Math.sqrt(F.kx * F.kx + F.ky * F.ky) > 6) n = 'volo'; break;
      case 'stordito': n = 'stordito'; break;
      case 'preso': n = 'preso'; break;
    }
    return n ? tieni3d(F, V, n) : null;
  }
  function stato3dFine(F, V) { return F.st === 'terra' || F.st === 'atterra' ? tieni3d(F, V, 'applaude') : null; }
  function tieni3d(F, V, n) {
    if (!posa3d(F.id, n)) return null;
    if (V.p3 !== n) { V.p3 = n; V.t3 = 0; } else V.t3++;
    return n;
  }

  const O_RIM = { pose: '', t: 0, facing: 1, h: 64, aim: null, tint: null, tintA: 1, alpha: 1 };   // FX 17/10: riusato, niente allocazioni
  function disegnaLottatore(c, S, F, i) {
    const V = VF[i], d = GS.D(F), H = d.H, gh = V.gh;
    if (F.nasc) return;
    const ps = posaDi(S, F, V);
    if (root.GSE.chi) root.GSE.chi(S, F, i); // asso_picche_fx.js: il disegno sa chi sta disegnando (ala nera, lama)
    let pose = ps.pose, aim = ps.aim, t = ps.t;
    if (S.fine && S.vinc === i) pose = 'win';
    if (pose !== V.pose) { V.pose = pose; V.pt = 0; t = pose === 'attack' || pose === 'super' || pose === 'run' ? t : 0; }
    let gpose = pose;
    if (F.st === 'mossa') {
      const k = F.mv;
      if (k === 'up' || k === 'usmash' || k === 'uair') gpose = poseG('attack_up', gpose, F.id);
      else if (k === 'down' || k === 'dsmash' || k === 'dair') gpose = poseG('attack_down', gpose, F.id);
      else if (k === 'dash') gpose = poseG('dash', gpose, F.id);
      else if (k === 'presa') gpose = poseG('grab', gpose, F.id);
      // 16/10: la posa di carica SOLO mentre si carica; al rilascio torna la posa della mossa (lo swing e l'impatto).
      // Prima bastava F.mc > 0, che resta acceso fino alla fine: dopo il rilascio si vedeva sempre la carica.
      const car = inCarica(F, GS.mossaDi(d, k));
      if (car) gpose = poseG('charge', gpose, F.id);
      // studio 3D: l'atlante ha una posa per ogni chiave di mossa (jab, fair, uspec, carica...)
      // 16/10 sera: in carica si disegna il fotogramma della MOSSA STESSA all'istante della carica (t = tempoMossa al
      // fotogramma m.carica.f: la rincorsa che l'atlante ha già prima dell'impatto: shiko, lama indietro...). La posa
      // generica 'carica' resta solo come riserva (mossa senza atlante, o elencata in CARICA_GEN). Solo disegno.
      const p3 = car ? ((!CARICA_GEN[F.id + '.' + k] && posa3d(F.id, k)) || posa3d(F.id, 'carica')) : posa3d(F.id, k);
      if (p3) gpose = p3;
    }
    if (F.st === 'tiene') gpose = posa3d(F.id, 'presa') || poseG('grab', gpose, F.id);
    if (F.st === 'ulti') gpose = posa3d(F.id, 'ulti') || poseG('ulti', gpose, F.id);
    // giro 3: pose di stato dell'atlante 3D (camminata, frenata, appeso, rotolata, doppio salto, lanci...)
    if (F.st !== 'mossa' && F.st !== 'tiene' && F.st !== 'ulti') {
      const s3 = S.fine ? (S.vinc === i ? null : stato3dFine(F, V)) : stato3d(F, V, d);
      if (s3) { gpose = s3; t = (s3 === 'walk' ? V.passo : V.t3) / 60; }
    }
    if (V.ps3 === 'appeso' && F.st !== 'appeso') V.lb = tempoVis;   // 18/10: lascia il bordo (risale, sale_att, salto): niente dissolvenza
    V.ps3 = F.st;
    if (pose === 'shield' && !POSE_OK.shield) gpose = 'idle';
    let x = F.x, y = F.y;
    if (F.hl > 0 && (F.st === 'stun' || F.st === 'stordito')) x += Math.sin(tempoVis * 2.7) * Math.min(7, 2 + F.hl * .5);
    if (V.sob > 0) { x += V.sobx * V.sob / 3; y += V.soby * V.sob / 3; }   // piccolo sobbalzo del colpito (colpi base)
    // movimento del corpo della mossa (rotazioni, avvitamenti, schiacciamenti, balzi, tremolii)
    let rot = 0, bsx = 1, bsy = 1, bo = 0, bv = 0;
    if (F.st === 'mossa') {
      const m = GS.mossaDi(d, F.mv), cp = root.GSE.corpo(F, m);
      rot = cp.r * F.dir * TAU / 360; bsx = cp.sx; bsy = cp.sy; bo = cp.ox * H * F.dir; bv = cp.oy * H;
      if (cp.tr) { bo += Math.sin(tempoVis * 2.9) * cp.tr * H; bv += Math.cos(tempoVis * 3.7) * cp.tr * H * .5; }
    } else if (F.st === 'terra' && F.plat >= 0) {
      rot = Math.max(-.16, Math.min(.16, F.vx * .016));
      if (V.derapa > 0) { rot = -F.dir * .22 * V.derapa / 10; bsx = 1.08; }
      if (F.skid > 0) { rot = -F.dir * .3; bsx = 1.1; bsy = .92; if (tempoVis % 2) emetti(2, F.x + F.dir * 10, F.y - 2, F.dir * 1.5, -.6, 14, 7, C_POLV, 0); }
    } else if (F.st === 'aria' && F.tum) rot = F.dir * tempoVis * .22; // tumble: gira su se stesso
    else if (F.st === 'aria' || F.st === 'cade') rot = Math.max(-.12, Math.min(.12, F.vx * .012));
    if (F.st === 'ulti') bsy = 1 + Math.sin(tempoVis * .3) * .04;
    // anticipo: nei primi fotogrammi della mossa il corpo si carica all'indietro (si vede che ha risposto)
    if (F.st === 'mossa' && V.antic > 0) rot -= F.dir * .14 * V.antic / 5;
    if (F.sbil > 55 && F.st !== 'stun') rot += Math.sin(tempoVis * .35) * .1 * (F.sbil / 100);
    let ghost = false;
    if (F.st === 'mossa') {
      const m = GS.mossaDi(d, F.mv);
      if (m.mant && F.mf >= m.mant.f0 && F.mf <= m.mant.f1 + 2) ghost = true;
    }
    if (F.st === 'schiva' && F.mv !== 'schivata') ghost = true;
    // smash_look_1710: la scia del Campione la disegna campione_fx.js sulle ancore misurate del guantone (GSLOOK)
    if (F.id === 'boxer' && F.st === 'mossa') { if (root.GSLOOK && root.GSLOOK.scia) root.GSLOOK.scia(c, F, d, V, GS.mossaDi(d, F.mv)); else sciaGuantone(c, F, d, V); }
    if (ghost) {
      for (let k = 2; k >= 1; k--) {
        const j = (V.hi - k * 2 + 8) & 7;
        root.GBR.draw(c, F.id, V.hx[j], V.hy[j], { pose: gpose, t, facing: F.dir, h: gh, aim, alpha: .16 * k, tint: V.col });
      }
    }
    if (F.ulti > 0) root.GSE.aura(c, F, H, COLP[i], tempoVis);
    if (F.trasf > 0) root.GSE.luce(c, F.x, F.y - H * .5, H * 1.1, '#ff2020', .35 + .15 * Math.sin(tempoVis * .3));
    let alpha = 1;
    if (F.st === 'schiva' && GS.invSchiva(F)) alpha = .45;
    if (F.inv > 0 && (tempoVis >> 2) % 2 && F.st !== 'rinasce' && F.st !== 'ulti') alpha = .55;
    // 18/10: appena lasciato il bordo il pivot del motore salta (0,7 H avanti, 0,9 H in su): la dissolvenza di roster3d.js disegnerebbe
    // la posa appesa sul pivot nuovo (due figure). alpha < .99 la spegne; le pose del bordo sono gia' continue (bordo_pose.py)
    if (V.lb != null && tempoVis - V.lb < 5) alpha = Math.min(alpha, .985);
    let tint = null;
    if (V.flash > 0) tint = V.flash > 1 ? '#ffffff' : null;
    else if (F.st === 'mossa' && inCarica(F, GS.mossaDi(d, F.mv)) && (tempoVis >> 2) % 2 && !(root.GSLOOK && root.GSLOOK.niente_tinta_carica && root.GSLOOK.niente_tinta_carica(F))) tint = '#ffe066';   // smash_look_1710: niente lampo su tutto il corpo, la carica sta sul guantone
    else if (F.ulti > 0 && (tempoVis >> 3) % 2) tint = '#ffd23b';
    else if (F.st === 'cade' && (tempoVis >> 3) % 2) tint = '#555577';
    else if (F.st === 'stordito' && (tempoVis >> 3) % 2) tint = '#ffd23b';
    else if (F.lento > 0 && (tempoVis >> 3) % 2) tint = '#9fdcff';
    else if (F.maled > 0 && (tempoVis >> 3) % 2) tint = '#b45aff';
    else if (F.trasf > 0 && (tempoVis >> 2) % 2) tint = '#ff4040';
    if (V.ciclo > 0) tint = CICLO[(V.ciclo >> 1) % 4]; // ciclo di colore sul colpo da KO
    const sc = F.trasf > 0 ? 1.3 : 1;
    c.save();
    c.translate(x + bo, y + bv);
    if (V.spin || rot) { c.translate(0, -H * .5); c.rotate(V.spin + rot); c.translate(0, H * .5); }
    let sqx = V.sqx * bsx * sc, sqy = V.sqy * bsy * sc;
    if (F.st === 'squat') { sqx *= 1.12; sqy *= .86; }
    if (F.ch && (F.st === 'terra' || F.st === 'mossa')) { sqx *= 1.1; sqy *= .78; }
    c.scale(sqx, sqy);
    if (root.GSFX && root.GSFX.on) { O_RIM.pose = gpose; O_RIM.t = t; O_RIM.facing = F.dir; O_RIM.h = gh; O_RIM.aim = aim; root.GSFX.bordo(c, F, i, O_RIM, V.spin + rot, sqx, sqy, x + bo, y + bv, H); }   // FX 17/10: luce di contorno
    if (root.GSLOOK && root.GSLOOK.prima) root.GSLOOK.prima(F, gpose, t);
    root.GBR.draw(c, F.id, 0, 0, { pose: gpose, t, facing: F.dir, h: gh, aim, tint, alpha });
    if (root.GSLOOK && root.GSLOOK.dopo) root.GSLOOK.dopo(c, F, d, V, gpose, t, gh, aim);
    c.restore();
    // per l'impact frame: la stessa posa, nello stesso posto, ridisegnata a tinta piena
    V.ix = x + bo; V.iy = y + bv; V.ir = V.spin + rot; V.isx = sqx; V.isy = sqy; V.ip = gpose; V.it = t; V.ia = aim; V.ih = gh; V.iH = H;
    if (F.maled > 0) root.GSE.scritta(c, '☠', '#b45aff', F.x, F.y - H * 1.45, 18, .85);
    if (F.lento > 0 && (tempoVis & 7) === 0) emetti(3, F.x + (Math.random() - .5) * H * .6, F.y - Math.random() * H, 0, .5, 16, 6, C_GHIACCIO, 0);
    if (F.st === 'scudo') {
      const q = Math.max(.25, F.scudo / 50), r = H * .62 * q + 6;
      const perf = F.sf <= 5;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = .45; c.drawImage(glow(perf ? '#ffffff' : COLP[i]), F.x - r * 1.3, F.y - H * .5 - r * 1.3, r * 2.6, r * 2.6);
      c.globalAlpha = .9; c.strokeStyle = '#ffffff'; c.lineWidth = 2;
      c.beginPath(); c.arc(F.x, F.y - H * .5, r, 0, TAU); c.stroke();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
  }

  // effetti delle mosse: archi dei fendenti, affondi, pugni, onde
  function fxMosse(c, S) {
    for (let i = 0; i < S.n; i++) {
      const F = S.L[i];
      if (F.st !== 'mossa') continue;
      const d = GS.D(F), m = GS.mossaDi(d, F.mv), H = d.H, t = F.mf, V = VF[i];
      const k = m.fx ? m.fx.k : '';
      const col = V.col;
      if (m.mec) root.GSE.mossa(c, S, F, m, F.x, F.y, col);
      if (F.nasc) continue;
      const tema = root.GSE.scia(c, S, F, m, H, t); // normali: scia a tema al posto dell'archetipo dell'arma
      // contrattacco e riflettore
      if (m.counter && t >= m.counter.f0 && t <= m.counter.f1) {
        const pul = .5 + .5 * Math.sin(tempoVis * .6);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = .5 + pul * .3;
        c.strokeStyle = '#ffffff'; c.lineWidth = 3;
        c.beginPath(); c.arc(F.x, F.y - H * .5, H * (.62 + pul * .08), 0, TAU); c.stroke();
        c.drawImage(glow(col), F.x - H, F.y - H * 1.5, H * 2, H * 2);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      if (m.rifl && t >= m.rifl.f0 && t <= m.rifl.f1) {
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = .7; c.strokeStyle = '#7fd8ff'; c.lineWidth = 3;
        const r = m.rifl.r * H; c.beginPath();
        for (let q = 0; q <= 6; q++) { const a = q * TAU / 6 + tempoVis * .1; const X = F.x + Math.cos(a) * r, Y = F.y - H * .5 + Math.sin(a) * r; if (q) c.lineTo(X, Y); else c.moveTo(X, Y); }
        c.stroke(); c.globalAlpha = .25; c.fillStyle = '#7fd8ff'; c.fill();
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      if (k === 'elica' && m.mant && t >= m.mant.f0 && t <= m.mant.f1 + 4) {
        const a = tempoVis * .9;
        c.strokeStyle = col; c.lineWidth = 5; c.globalAlpha = .9;
        c.beginPath(); c.ellipse(F.x, F.y - H * 1.05, H * .7 * Math.abs(Math.cos(a)), H * .12, 0, 0, TAU); c.stroke();
        c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.ellipse(F.x, F.y - H * 1.05, H * .7 * Math.abs(Math.sin(a)), H * .1, 0, 0, TAU); c.stroke();
        c.globalAlpha = 1;
      }
      if ((k === 'scia_su' || k === 'pugno_su' || k === 'arco' || k === 'artiglio') && m.su && m.mant && t >= m.mant.f0 && t <= m.mant.f1 + 3) {
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = col; c.globalAlpha = .7;
        for (let q = -2; q <= 2; q++) { c.lineWidth = 3 - Math.abs(q) * .6; c.beginPath(); c.moveTo(F.x + q * H * .12, F.y + H * .2); c.lineTo(F.x + q * H * .12, F.y + H * (.9 + Math.abs(q) * .2)); c.stroke(); }
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      if (m.tuffo && F.ma && t >= m.tuffo.f) {
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = col; c.globalAlpha = .8;
        for (let q = -2; q <= 2; q++) { c.lineWidth = 3; c.beginPath(); c.moveTo(F.x + q * H * .14, F.y - H * 1.1); c.lineTo(F.x + q * H * .14, F.y - H * (2 + Math.abs(q) * .3)); c.stroke(); }
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      // hitbox: bagliore + disegno dell'arma
      for (let j = 0; j < m.hb.length; j++) {
        const h = m.hb[j];
        if (h.soloAria && !F.ma) continue; if (h.soloTerra && F.ma) continue;
        if (h.presa) continue;
        const f0 = h.f0, f1 = (h.soloAria && m.tuffo) ? 999 : h.f1;
        if (t < f0 - 3 || t > f1 + 7) continue;
        const attivo = t >= f0 && t <= f1;
        const hx = F.x + F.dir * h.x * H, hy = F.y - h.y * H, r = h.r * H * (m.carica ? 1 + (F.mc / m.carica.max) * m.carica.mul * .3 : 1);
        const fade = t > f1 ? 1 - (t - f1) / 8 : 1;
        if (attivo) {
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = .14;
          c.drawImage(glow(col), hx - r, hy - r, r * 2, r * 2);
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        }
        if (tema) continue;
        if (j > 0 && (k === 'arco' || k === 'pesante' || k === 'artiglio') && m.hb[0].f0 === f0 && Math.abs(m.hb[0].x) > .3 && Math.abs(h.x) > .3 && Math.sign(h.x) === Math.sign(m.hb[0].x)) continue;
        if (k === 'arco' || k === 'pesante' || k === 'artiglio' || k === 'giro') {
          const a0 = k === 'giro' ? 0 : (m.fx.a0 != null ? m.fx.a0 : 80), a1 = k === 'giro' ? 330 : (m.fx.a1 != null ? m.fx.a1 : -30);
          const flip = h.x < -.12 ? -1 : 1;
          const p = Math.max(0, Math.min(1, (t - (f0 - 3)) / (f1 - f0 + 4)));
          const cx = F.x + F.dir * .05 * H, cy = F.y - H * .55;
          let R = Math.sqrt((hx - cx) * (hx - cx) + (hy - cy) * (hy - cy)) + r * .25;
          if (k === 'giro') R = Math.max(r, H * .45);
          if (R < H * .4) R = H * .4;
          const w = r * (k === 'pesante' ? 1.4 : 1.05);
          const dirv = F.dir * flip;
          arco(c, cx, cy, R, a0, a0 + (a1 - a0) * easeOut(p), w, col, fade, dirv, k === 'artiglio');
        } else if (k === 'affondo' || k === 'tentacolo') {
          const bx0 = F.x + F.dir * H * .15, by0 = F.y - H * .55;
          const ext = Math.min(1, Math.max(0, (t - f0 + 3) / 4));
          const tx = bx0 + (hx + F.dir * r * .8 - bx0) * ext, ty = by0 + (hy - by0) * ext;
          c.globalAlpha = fade;
          if (k === 'tentacolo') {
            c.strokeStyle = col; c.lineWidth = r * .9; c.lineCap = 'round';
            c.beginPath(); c.moveTo(bx0, by0); c.quadraticCurveTo((bx0 + tx) / 2, by0 - H * .5, tx, ty); c.stroke();
            c.fillStyle = '#fff'; for (let q = 1; q < 5; q++) { const u = q / 5; c.beginPath(); c.arc(bx0 + (tx - bx0) * u, by0 + (ty - by0) * u - Math.sin(u * 3.14) * H * .25, r * .14, 0, TAU); c.fill(); }
          } else {
            const nx = -(ty - by0), ny = tx - bx0, nl = Math.sqrt(nx * nx + ny * ny) || 1, wv = r * .45;
            c.fillStyle = col;
            c.beginPath(); c.moveTo(bx0 + nx / nl * wv, by0 + ny / nl * wv); c.lineTo(tx, ty); c.lineTo(bx0 - nx / nl * wv, by0 - ny / nl * wv); c.closePath(); c.fill();
            c.fillStyle = '#fff'; c.beginPath(); c.moveTo(bx0 + nx / nl * wv * .35, by0 + ny / nl * wv * .35); c.lineTo(tx, ty); c.lineTo(bx0 - nx / nl * wv * .35, by0 - ny / nl * wv * .35); c.closePath(); c.fill();
            c.strokeStyle = '#fff'; c.lineWidth = 2;
            for (let q = -1; q <= 1; q += 2) { c.beginPath(); c.moveTo(bx0 - F.dir * H * .3, by0 + q * wv * 1.6); c.lineTo(tx - F.dir * H * .4, ty + q * wv * 1.6); c.stroke(); }
            if (attivo && t - f0 < 3) { c.globalCompositeOperation = 'lighter'; c.drawImage(glow('#ffffff'), tx - r, ty - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; }
          }
          c.globalAlpha = 1;
        } else if (k === 'pugno' || k === 'pugno_su' || k === 'magia' || k === 'onda' || k === 'gelo' || k === 'morso' || k === 'fiamma' || k === 'counter' || k === 'lancio' || k === 'rifl' || k === 'schianto') {
          if (!attivo && t < f0) continue;
          const q = Math.min(1, (t - f0 + 1) / (f1 - f0 + 6));
          c.globalAlpha = fade * (1 - q * .5);
          if (k === 'magia' || k === 'onda' || k === 'gelo') {
            c.strokeStyle = k === 'gelo' ? '#cfefff' : col; c.lineWidth = 4;
            c.beginPath(); c.arc(hx, hy, r * (.4 + q * .8), 0, TAU); c.stroke();
            c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(hx, hy, r * (.2 + q * .6), 0, TAU); c.stroke();
            if (k === 'magia') { c.fillStyle = '#fff'; stella4(c, hx, hy, r * .5 * (1 - q), tempoVis * .2); }
            if (k === 'gelo') for (let s = 0; s < 8; s++) { const a = s * TAU / 8; c.beginPath(); c.moveTo(hx + Math.cos(a) * r * .5, hy + Math.sin(a) * r * .5); c.lineTo(hx + Math.cos(a) * r * 1.1, hy + Math.sin(a) * r * 1.1); c.stroke(); }
          } else if (k === 'morso') {
            const ap = attivo ? .1 : .7;
            c.fillStyle = '#fff'; c.strokeStyle = col; c.lineWidth = 3;
            for (const sgn of [-1, 1]) {
              c.beginPath(); c.arc(hx, hy + sgn * r * ap, r, sgn > 0 ? Math.PI : 0, sgn > 0 ? TAU : Math.PI); c.stroke();
              for (let s = 0; s < 4; s++) { const xx = hx - r * .7 + s * r * .45; c.beginPath(); c.moveTo(xx, hy + sgn * r * ap); c.lineTo(xx + r * .15, hy + sgn * r * (ap - .35)); c.lineTo(xx + r * .3, hy + sgn * r * ap); c.fill(); }
            }
          } else {
            // pugno: onda d'urto + linee di velocità
            c.strokeStyle = '#fff'; c.lineWidth = 3;
            c.beginPath(); c.arc(hx, hy, r * (.5 + q), 0, TAU); c.stroke();
            c.strokeStyle = col; c.lineWidth = 3;
            for (let s = -1; s <= 1; s++) { c.beginPath(); c.moveTo(hx - F.dir * r * (1.2 + Math.abs(s) * .4), hy + s * r * .45); c.lineTo(hx - F.dir * r * (2.4 + Math.abs(s) * .3), hy + s * r * .45); c.stroke(); }
          }
          c.globalAlpha = 1;
        }
      }
    }
  }
  function easeOut(p) { return 1 - (1 - p) * (1 - p) * (1 - p); }
  // fendente a mezzaluna: dalla coda (sottile) alla testa (larga)
  function arco(c, cx, cy, R, a0, a1, w, col, fade, dir, artiglio) {
    const N = 12;
    const toC = a => { const wa = dir > 0 ? a : 180 - a; return -wa * TAU / 360; };
    const passaggi = artiglio ? [-w * .45, 0, w * .45] : [0];
    for (let pi = 0; pi < passaggi.length; pi++) {
      const off = passaggi[pi], ww = artiglio ? w * .32 : w;
      for (let strato = 0; strato < 2; strato++) {
        const sw = strato ? ww * .38 : ww;
        c.fillStyle = strato ? '#ffffff' : col;
        c.globalAlpha = fade * (strato ? .95 : .85);
        c.beginPath();
        for (let q = 0; q <= N; q++) {
          const u = q / N, a = toC(a0 + (a1 - a0) * u), th = sw * u * u;
          const rr = R + off + th * .5;
          const X = cx + Math.cos(a) * rr, Y = cy + Math.sin(a) * rr;
          if (q) c.lineTo(X, Y); else c.moveTo(X, Y);
        }
        for (let q = N; q >= 0; q--) {
          const u = q / N, a = toC(a0 + (a1 - a0) * u), th = sw * u * u;
          const rr = R + off - th * .5;
          c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        c.closePath(); c.fill();
      }
    }
    c.globalAlpha = 1;
  }

  // ---------- proiettili ----------
  function disegnaProiettili(c, S) {
    for (let q = 0; q < GS.NP; q++) {
      const P = S.P[q];
      if (!P.on) continue;
      const own = P.own >= 0 ? VF[P.own] : null;
      const col = own ? own.col : '#ffd23b';
      const r = P.r, x = P.x, y = P.y, t = P.t;
      if (root.GSE.proj(c, S, P, col, tempoVis)) continue;
      c.save(); c.translate(x, y);
      switch (P.fo) {
        case 'esplosione': {
          const q2 = 1 - P.life / P.life0;
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = 1 - q2 * .6; c.drawImage(glow('#ff8a1c'), -r * 1.5, -r * 1.5, r * 3, r * 3);
          c.globalAlpha = 1 - q2; c.drawImage(glow('#ffffff'), -r * .8, -r * .8, r * 1.6, r * 1.6);
          c.globalCompositeOperation = 'source-over';
          break;
        }
        case 'fiche': case 'gettone': case 'fiche_grande': case 'fiche_bomba': {
          c.rotate(t * .3);
          const cc = P.fo === 'fiche_bomba' ? '#c8102e' : P.fo === 'gettone' ? '#e8c547' : col;
          c.fillStyle = cc; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
          c.strokeStyle = '#fff'; c.lineWidth = r * .22; c.setLineDash([r * .5, r * .4]); c.beginPath(); c.arc(0, 0, r * .8, 0, TAU); c.stroke(); c.setLineDash([]);
          c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, r * .42, 0, TAU); c.fill();
          if (P.fo === 'fiche_bomba' && (t >> 2) % 2) { c.fillStyle = '#ff3030'; c.beginPath(); c.arc(0, 0, r * .3, 0, TAU); c.fill(); }
          break;
        }
        case 'proiettile': case 'laser': {
          const a = Math.atan2(P.vy, P.vx); c.rotate(a);
          c.globalCompositeOperation = 'lighter';
          c.strokeStyle = P.fo === 'laser' ? '#1ad7ff' : '#ffd23b'; c.lineWidth = r * 1.4; c.lineCap = 'round';
          c.beginPath(); c.moveTo(-r * (P.fo === 'laser' ? 8 : 4), 0); c.lineTo(r, 0); c.stroke();
          c.strokeStyle = '#fff'; c.lineWidth = r * .6; c.beginPath(); c.moveTo(-r * 3, 0); c.lineTo(r, 0); c.stroke();
          c.globalCompositeOperation = 'source-over';
          break;
        }
        case 'carta': case 'tarocco': case 'carta_trap': {
          if (P.fo !== 'carta_trap') c.rotate(t * .45); else c.rotate(-.1);
          const w = r * 1.3, h = r * 1.8;
          c.fillStyle = P.fo === 'tarocco' ? '#2a1450' : (P.fo === 'carta_trap' && P.fermo) ? '#8a1020' : '#fff'; c.fillRect(-w / 2, -h / 2, w, h);
          c.strokeStyle = P.fo === 'tarocco' ? '#f0c94a' : '#c8102e'; c.lineWidth = 2; c.strokeRect(-w / 2, -h / 2, w, h);
          c.fillStyle = P.fo === 'tarocco' ? '#f0c94a' : '#c8102e'; stella4(c, 0, 0, r * .5, 0);
          if (P.fo === 'carta_trap' && P.t > 20 && (t >> 3) % 2) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .6; c.drawImage(glow('#ff3030'), -r * 1.5, -r * 1.5, r * 3, r * 3); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
          break;
        }
        case 'lancia': {
          const a = Math.atan2(P.vy, P.vx); c.rotate(a);
          c.strokeStyle = '#8a5a2c'; c.lineWidth = r * .35; c.beginPath(); c.moveTo(-r * 6, 0); c.lineTo(r, 0); c.stroke();
          c.fillStyle = '#e8e8f0'; c.beginPath(); c.moveTo(r * 2.4, 0); c.lineTo(r * .6, -r * .6); c.lineTo(r * .6, r * .6); c.fill();
          break;
        }
        case 'rete': {
          c.rotate(t * .1); c.strokeStyle = '#e8d9a8'; c.lineWidth = 2;
          c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
          for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * r * .38, -r * .92); c.lineTo(k * r * .38, r * .92); c.moveTo(-r * .92, k * r * .38); c.lineTo(r * .92, k * r * .38); c.stroke(); }
          break;
        }
        case 'sfera': {
          c.globalCompositeOperation = 'lighter'; c.drawImage(glow('#b45aff'), -r * 2, -r * 2, r * 4, r * 4); c.globalCompositeOperation = 'source-over';
          c.fillStyle = '#d9b8ff'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * .35, -r * .35, r * .3, 0, TAU); c.fill();
          break;
        }
        case 'chiave': {
          c.rotate(t * .5); c.fillStyle = '#c9ced8'; c.fillRect(-r * 1.2, -r * .22, r * 2.4, r * .44);
          c.beginPath(); c.arc(r * 1.2, 0, r * .5, .6, TAU - .6); c.lineTo(r * 1.2, 0); c.fill();
          break;
        }
        case 'bilia': {
          c.fillStyle = ['#e8c547', '#1f5fbf', '#c8102e', '#6b2fa3', '#ff7a1a', '#1f7a4a'][q % 6]; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(r * .2, -r * .1, r * .42, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(-r * .4, -r * .45, r * .2, 0, TAU); c.fill();
          break;
        }
        case 'shuriken': { c.rotate(t * .7); c.fillStyle = '#d0d6e0'; stella4(c, 0, 0, r * 1.5, 0); c.fillStyle = '#20232e'; c.beginPath(); c.arc(0, 0, r * .3, 0, TAU); c.fill(); break; }
        case 'dado': case 'dado_ogg': {
          c.rotate(t * .25); const s = r * 1.5;
          c.fillStyle = '#fff'; c.fillRect(-s / 2, -s / 2, s, s); c.strokeStyle = '#6b2fa3'; c.lineWidth = 2; c.strokeRect(-s / 2, -s / 2, s, s);
          c.fillStyle = '#111'; const pp = [[-.25, -.25], [.25, .25], [0, 0], [.25, -.25], [-.25, .25]];
          for (let k = 0; k < 1 + ((t >> 3) % 5); k++) { c.beginPath(); c.arc(pp[k][0] * s, pp[k][1] * s, s * .09, 0, TAU); c.fill(); }
          break;
        }
        case 'pizza': {
          c.rotate(t * .3); c.fillStyle = '#e8b04a'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
          c.fillStyle = '#d6312b'; c.beginPath(); c.arc(0, 0, r * .8, 0, TAU); c.fill();
          c.fillStyle = '#f7e7b0'; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(Math.cos(k * 1.3) * r * .5, Math.sin(k * 1.3) * r * .5, r * .15, 0, TAU); c.fill(); }
          c.fillStyle = '#8a1a1a'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(Math.cos(k * 1.6 + 1) * r * .35, Math.sin(k * 1.6 + 1) * r * .35, r * .13, 0, TAU); c.fill(); }
          break;
        }
        case 'nota': {
          c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = r * .25;
          c.beginPath(); c.ellipse(-r * .3, r * .4, r * .45, r * .32, -.4, 0, TAU); c.fill();
          c.beginPath(); c.moveTo(r * .1, r * .3); c.lineTo(r * .1, -r * 1.1); c.lineTo(r * .7, -r * .7); c.stroke();
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = .4; c.drawImage(glow(col), -r * 1.5, -r * 1.5, r * 3, r * 3); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
          break;
        }
        case 'disco': {
          c.rotate(t * .6); c.fillStyle = '#111'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
          c.strokeStyle = '#333'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, r * .75, 0, TAU); c.stroke();
          c.fillStyle = col; c.beginPath(); c.arc(0, 0, r * .38, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.fillRect(-1, -r * .38, 2, r * .3);
          break;
        }
        case 'pipistrello': {
          const fl = Math.sin(t * .6) * .6; c.scale(P.vx >= 0 ? 1 : -1, 1);
          c.fillStyle = '#1a0a14';
          c.beginPath(); c.moveTo(0, 0); c.lineTo(-r * 1.4, -r * (.4 + fl)); c.lineTo(-r * .7, r * .1); c.lineTo(-r * 1.1, r * .3); c.lineTo(0, r * .3);
          c.lineTo(r * 1.1, r * .3); c.lineTo(r * .7, r * .1); c.lineTo(r * 1.4, -r * (.4 + fl)); c.closePath(); c.fill();
          c.fillStyle = '#ff3030'; c.fillRect(r * .1, -r * .05, r * .14, r * .14);
          break;
        }
        case 'zucchina': {
          c.rotate(t * .2); c.fillStyle = '#ff8a1c'; c.beginPath(); c.ellipse(0, 0, r, r * .85, 0, 0, TAU); c.fill();
          c.strokeStyle = '#c45a10'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, r * .4, r * .85, 0, 0, TAU); c.stroke();
          c.fillStyle = '#3a7a2a'; c.fillRect(-r * .1, -r * 1.1, r * .2, r * .35);
          break;
        }
        case 'palla_cannone': case 'neve': {
          c.fillStyle = P.fo === 'neve' ? '#f4fbff' : '#1a1a20'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
          c.fillStyle = P.fo === 'neve' ? '#bfe2f5' : '#555'; c.beginPath(); c.arc(-r * .3, -r * .3, r * .3, 0, TAU); c.fill();
          if (P.fo === 'palla_cannone' && (t & 1)) emetti(1, x, y, 0, -.3, 14, r * .7, C_FUMO, 0);
          break;
        }
        case 'inchiostro': {
          c.globalAlpha = .85; c.fillStyle = '#2a1036';
          for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(Math.cos(k * 1.3 + t * .1) * r * .5, Math.sin(k * 1.7 + t * .1) * r * .4, r * (.45 + (k % 2) * .15), 0, TAU); c.fill(); }
          c.globalAlpha = 1;
          break;
        }
        case 'onda_sonora': case 'ululato': {
          c.scale(P.vx >= 0 ? 1 : -1, 1);
          c.strokeStyle = P.fo === 'ululato' ? '#dfe6ff' : col; c.lineWidth = 4; c.globalAlpha = .9;
          for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(-k * r * .45, 0, r * (1 - k * .2), -1, 1); c.stroke(); }
          c.globalAlpha = 1;
          break;
        }
        case 'onda_terra': case 'onda_acqua': {
          c.scale(P.vx >= 0 ? 1 : -1, 1);
          const acqua = P.fo === 'onda_acqua';
          c.fillStyle = acqua ? '#5ab8ff' : '#c9a46a';
          c.beginPath(); c.moveTo(-r * 1.4, 0);
          for (let k = 0; k < 4; k++) { c.lineTo(-r * 1.1 + k * r * .7, -r * (1.2 + (k % 2) * .6) * (acqua ? 1.2 : 1)); c.lineTo(-r * .8 + k * r * .7, 0); }
          c.closePath(); c.fill();
          if (t % 3 === 0) emetti(acqua ? 7 : 4, x, y - r, (Math.random() - .5) * 3, -2 - Math.random() * 2, 18, 3, acqua ? C_ACQUA : C_POLV, .3);
          break;
        }
        case 'olio': { c.fillStyle = '#111'; c.beginPath(); c.ellipse(0, -2, r * 1.3, r * .3, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(160,120,255,.5)'; c.beginPath(); c.ellipse(-r * .3, -3, r * .4, r * .08, 0, 0, TAU); c.fill(); break; }
        case 'calderone': {
          c.fillStyle = '#222'; c.beginPath(); c.arc(0, -r * .5, r * .7, 0, Math.PI); c.fill();
          c.fillStyle = '#5aff7a'; c.beginPath(); c.ellipse(0, -r * .5, r * .65, r * .15, 0, 0, TAU); c.fill();
          if (t % 8 === 0) emetti(7, x + (Math.random() - .5) * r, y - r * .6, 0, -1.5, 20, 3, pc('#5aff7a'), .02);
          break;
        }
        case 'radici': { c.strokeStyle = '#6b4220'; c.lineWidth = 4; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * r * .4, 0); c.quadraticCurveTo(k * r * .6, -r * .5, k * r * .3, -r * (.6 + Math.abs(k) * .1)); c.stroke(); } break; }
        case 'valigetta': case 'barile': {
          const blink = P.t > 20 && (t >> 3) % 2;
          if (P.fo === 'valigetta') { c.fillStyle = '#3a2a1a'; c.fillRect(-r, -r * 1.1, r * 2, r * 1.1); c.fillStyle = '#d4af37'; c.fillRect(-r * .2, -r * 1.3, r * .4, r * .25); }
          else { c.fillStyle = '#7a4c22'; c.fillRect(-r * .8, -r * 1.6, r * 1.6, r * 1.6); c.fillStyle = '#333'; c.fillRect(-r * .8, -r * 1.3, r * 1.6, r * .15); c.fillRect(-r * .8, -r * .5, r * 1.6, r * .15); }
          if (blink) { c.fillStyle = '#ff3030'; c.beginPath(); c.arc(0, -r * .6, r * .2, 0, TAU); c.fill(); }
          break;
        }
        default: { c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); }
      }
      c.restore();
    }
  }

  function disegnaOggetti(c, S) {
    for (let i = 0; i < GS.NO; i++) {
      const o = S.O[i]; if (!o.on) continue;
      if (o.t > 780 && (o.t >> 2) % 2) continue;
      const r = 13;
      c.save(); c.translate(o.x, o.y - r);
      if (o.k === 0) {
        c.fillStyle = '#c8102e'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); c.arc(0, 0, r * .8, 0, TAU); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#111'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillText('BOOM', 0, 3);
      } else {
        c.fillStyle = '#fff'; c.fillRect(-r, -r, r * 2, r * 2); c.strokeStyle = '#111'; c.lineWidth = 2; c.strokeRect(-r, -r, r * 2, r * 2);
        c.fillStyle = '#111'; for (const [a, b] of [[-.5, -.5], [.5, .5], [0, 0]]) { c.beginPath(); c.arc(a * r, b * r, 2.5, 0, TAU); c.fill(); }
      }
      if (o.tiene < 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .3 + .2 * Math.sin(tempoVis * .2); c.drawImage(glow('#ffd23b'), -r * 2, -r * 2, r * 4, r * 4); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      c.restore();
    }
  }

  // ---------- palco ----------
  function disegnaStrato(c, img, f, ybase, z) {
    if (!img) return;
    const k = z * (.55 + f * .6);
    const sx = L.gx + L.gw / 2, sy = L.gy + L.gh / 2;
    const x0 = sx - (img.width / 2 + cam.x * f) * k;
    const y0 = sy + (ybase - cam.y * f - img.height) * k;
    c.drawImage(img, x0, y0, img.width * k, img.height * k);
    return y0 + img.height * k;
  }
  function disegnaPalco(c, S) {
    // arene 15/10: ogni arena disegna da sé il suo palco 3D precotto, le piattaforme e le parti animate (sfondi.js)
    root.GSF.palco(c, A, SF, S.t);
  }
  function ombre(c, S) {
    c.fillStyle = 'rgba(0,0,0,.35)';
    for (let i = 0; i < S.n; i++) {
      const F = S.L[i];
      if (F.st === 'morto' || F.st === 'fuori' || F.st === 'rinasce') continue;
      // piano sotto
      let best = 1e9;
      for (const s of A.solidi) if (F.x >= s.x1 && F.x <= s.x2 && s.top >= F.y - 2 && s.top < best) best = s.top;
      for (let k = 0; k < A.piatt.length; k++) if (F.x >= GS.PX1[k] && F.x <= GS.PX2[k] && GS.PY[k] >= F.y - 2 && GS.PY[k] < best) best = GS.PY[k];
      if (best > 1e8) continue;
      const H = GS.D(F).H, dist = best - F.y, k = Math.max(.25, 1 - dist / 400);
      c.globalAlpha = k;
      c.beginPath(); c.ellipse(F.x, best + 1, H * .32 * k + 4, 4 + 3 * k, 0, 0, TAU); c.fill();
      // anello del colore del giocatore
      c.strokeStyle = COLP[i]; c.lineWidth = 2.5; c.globalAlpha = k * .9;
      c.beginPath(); c.ellipse(F.x, best + 1, H * .36 * k + 6, 5 + 3 * k, 0, 0, TAU); c.stroke();
    }
    c.globalAlpha = 1;
  }
  const ETX = new Float32Array(4), ETY = new Float32Array(4);
  function etichette(c, S, z) {
    let ne = 0;
    // l'umano per primo: la sua etichetta resta ferma, le altre si spostano sopra
    for (let q = 0; q < S.n; q++) {
      const i = q === 0 ? opz.umano : (q === opz.umano ? 0 : q);
      if (i < 0 || i >= S.n) continue;
      const F = S.L[i];
      if (F.st === 'morto' || F.st === 'fuori' || F.nasc) continue;
      const H = GS.D(F).H;
      const io = i === opz.umano;
      const testo = io ? (opz.lang === 'en' ? 'YOU' : 'TU') : (opz.cpu ? 'CPU' : 'P' + (i + 1));
      const sx = (F.x - cam.x) * z + L.gx + L.gw / 2;
      let sy = (F.y - H * 1.12 - cam.y) * z + L.gy + L.gh / 2 - (io ? 6 + Math.sin(tempoVis * .15) * 3 : 4);
      for (let k = 0; k < ne; k++) if (Math.abs(ETX[k] - sx) < 44 && Math.abs(ETY[k] - sy) < 20) sy = ETY[k] - 21;
      ETX[ne] = sx; ETY[ne] = sy; ne++;
      c.fillStyle = COLP[i];
      c.beginPath(); c.moveTo(sx, sy + 8); c.lineTo(sx - 7, sy); c.lineTo(sx + 7, sy); c.closePath(); c.fill();
      c.font = `900 ${io ? 15 : 12}px "Arial Black", Impact, sans-serif`; c.textAlign = 'center';
      const w = c.measureText(testo).width + 10;
      c.fillStyle = io ? COLP[i] : 'rgba(10,8,20,.75)';
      rr(c, sx - w / 2, sy - (io ? 20 : 17), w, io ? 19 : 16, 5); c.fill();
      c.fillStyle = io ? '#0b0b14' : COLP[i];
      c.fillText(testo, sx, sy - (io ? 5 : 4.5));
    }
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  // bolle di chi è fuori dall'inquadratura
  function bolle(c, S, z) {
    for (let i = 0; i < S.n; i++) {
      const F = S.L[i];
      if (F.st === 'morto' || F.st === 'fuori') continue;
      const H = GS.D(F).H;
      const sx = (F.x - cam.x) * z + L.gx + L.gw / 2, sy = (F.y - H * .5 - cam.y) * z + L.gy + L.gh / 2;
      const m = 34;
      if (sx > L.gx - 10 && sx < L.gx + L.gw + 10 && sy > L.gy - 10 && sy < L.gy + L.gh + 10) continue;
      const bx = Math.max(L.gx + m, Math.min(L.gx + L.gw - m, sx)), by = Math.max(L.gy + m, Math.min(L.gy + L.gh - m, sy));
      c.fillStyle = 'rgba(10,8,20,.8)'; c.strokeStyle = COLP[i]; c.lineWidth = 3;
      c.beginPath(); c.arc(bx, by, 26, 0, TAU); c.fill(); c.stroke();
      const a = Math.atan2(sy - by, sx - bx);
      c.fillStyle = COLP[i]; c.beginPath(); c.moveTo(bx + Math.cos(a) * 36, by + Math.sin(a) * 36); c.lineTo(bx + Math.cos(a + .35) * 26, by + Math.sin(a + .35) * 26); c.lineTo(bx + Math.cos(a - .35) * 26, by + Math.sin(a - .35) * 26); c.fill();
      c.save(); c.beginPath(); c.arc(bx, by, 24, 0, TAU); c.clip();
      gbrScala(c, F.id, bx, by + 20, { pose: 'ko', t: tempoVis / 60, facing: F.dir, h: 40 }, VF[i].gh);
      c.restore();
    }
  }

  // il cast cuoce i pezzi per fasce di scala (max 4 per personaggio): le taglie variabili si disegnano
  // alla scala di gioco e si ridimensionano con una trasformazione, così non si ricuoce mai durante la partita
  function gbrScala(c, id, x, y, o, hBase) {
    const k = o.h / hBase; c.save(); c.translate(x, y); c.scale(k, k); o.h = hBase; root.GBR.draw(c, id, 0, 0, o); c.restore();
  }
  // raggi KO e stelle (coordinate di schermo)
  function disegnaKO(c, S, z) {
    for (let i = 0; i < 4; i++) {
      const k = KO[i];
      if (k.tipo && root.GSKO) { if (k.t < 90) root.GSKO.disegna(c, S, k, L, z); continue; }
      if (k.t >= 60) continue;
      const q = k.t / 60;
      if (k.stella) {
        // vola verso il fondo e diventa una stella
        const sx = L.gx + L.gw * (.3 + (k.p % 3) * .2), sy = L.gy + 40;
        if (q < .6) {
          const u = q / .6, s = 1 - u * .9;
          gbrScala(c, k.id, sx + (u * 40), L.gy + 10 + u * 50, { pose: 'ko', t: k.t / 20, facing: 1, h: 60 * s }, VF[k.p] ? VF[k.p].gh : 64);
        } else {
          const u = (q - .6) / .4;
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = 1 - u; c.drawImage(glow(k.col), sx + 40 - 30, sy + 50 - 30, 60, 60);
          c.fillStyle = '#fff'; stella4(c, sx + 40, sy + 50, 18 * (1 - u * .5), u * 3);
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        }
        continue;
      }
      // punto dello schianto sul bordo dello schermo
      let sx = (k.x - cam.x) * z + L.gx + L.gw / 2, sy = (k.y - cam.y) * z + L.gy + L.gh / 2;
      sx = Math.max(L.gx, Math.min(L.gx + L.gw, sx)); sy = Math.max(L.gy, Math.min(L.gy + L.gh, sy));
      const len = Math.max(L.gw, L.gh) * 1.3 * Math.min(1, q * 5), w = (1 - q) * 70 + 10;
      c.save(); c.translate(sx, sy); c.rotate(k.ang);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = (1 - q) * .9;
      c.fillStyle = k.col;
      c.beginPath(); c.moveTo(0, -w); c.lineTo(len, -w * .15); c.lineTo(len, w * .15); c.lineTo(0, w); c.closePath(); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(0, -w * .4); c.lineTo(len * .8, 0); c.lineTo(0, w * .4); c.closePath(); c.fill();
      c.globalAlpha = 1 - q;
      const R = 90 * (1 - q) + 40;
      c.drawImage(glow(k.col), -R, -R, R * 2, R * 2);
      c.drawImage(glow('#ffffff'), -R * .5, -R * .5, R, R);
      c.globalCompositeOperation = 'source-over';
      c.restore();
      c.globalAlpha = 1;
    }
  }

  // ---------- HUD ----------
  const RIT = {};
  function ritratto(id, size, col) {
    const key = id + size + col;
    if (RIT[key]) return RIT[key];
    const k = document.createElement('canvas'); k.width = k.height = size;
    const x = k.getContext('2d');
    x.save(); x.beginPath(); x.arc(size / 2, size / 2, size / 2 - 2, 0, TAU); x.clip();
    x.fillStyle = '#1a1428'; x.fillRect(0, 0, size, size);
    try { root.GBR.portrait(x, id, 0, 0, size); } catch (e) { }
    x.restore();
    x.strokeStyle = col; x.lineWidth = 3; x.beginPath(); x.arc(size / 2, size / 2, size / 2 - 1.5, 0, TAU); x.stroke();
    RIT[key] = k;
    return k;
  }
  function colorePct(p) {
    if (p < 35) return '#ffffff';
    if (p < 70) return '#ffe680';
    if (p < 110) return '#ffad3b';
    if (p < 150) return '#ff5a2a';
    if (p < 200) return '#ff2020';
    return '#b00010';
  }
  // 16/10 (telefono): l'HUD si disegnava da capo a ogni fotogramma (testi col contorno, misure dei testi): ~16% del
  // tempo JS a CPU 6x. Ora ogni riquadro si cuoce in un canvas suo e si ricuoce solo quando cambia (percentuale, vite,
  // tremolio dopo un colpo, misura); a ogni fotogramma resta un drawImage. Sopra, dal vivo, solo fiche e rabbia.
  const HUDC = [], HPAD = 26;   // margine: la percentuale che «salta» dopo un colpo esce dal riquadro
  function pannello(c, S, i, x, y, cw, ch, p, ox, oy, nVite) {
    if (root.GSUI && root.GSUI.pannello) return root.GSUI.pannello(c, S, i, x, y, cw, ch, p, ox, oy, nVite, { V: VF[i], COLP, opz, ritratto, colorePct });   // 18/10 ui_1810.js
    const F = S.L[i], V = VF[i];
    c.fillStyle = 'rgba(12,9,24,.82)'; rr(c, x, y, cw, ch, 10); c.fill();
    c.fillStyle = COLP[i]; rr(c, x, y, cw, 5, 3); c.fill();
    if (i === opz.umano) { c.strokeStyle = COLP[i]; c.lineWidth = 2; rr(c, x + 1, y + 1, cw - 2, ch - 2, 10); c.stroke(); }
    const ps = Math.min(ch - 16, cw * .42);
    c.drawImage(ritratto(F.id, Math.round(ps * 2), COLP[i]), x + 5, y + 9, ps, ps);
    // percentuale grande che trema
    const fs = Math.min(ch * .5, cw * .3) * V.ppop;
    const tx = x + cw - 8, ty = y + ch * .62 + V.pjy;
    c.textAlign = 'right';
    c.font = `italic 900 ${fs * .5}px "Arial Black", Impact, sans-serif`;
    c.fillStyle = colorePct(p);
    c.fillText('%', tx + ox, ty + oy);
    const pw = c.measureText('%').width;
    c.font = `italic 900 ${fs}px "Arial Black", Impact, sans-serif`;
    c.lineWidth = 4; c.strokeStyle = '#0b0b14';
    c.strokeText(String(p), tx - pw + ox, ty + oy);
    c.fillText(String(p), tx - pw + ox, ty + oy);
    // vite come pallini
    const dr = Math.max(3, Math.min(5, cw * .03));
    for (let k = 0; k < nVite; k++) {
      c.fillStyle = k < F.vite ? COLP[i] : 'rgba(255,255,255,.15)';
      c.beginPath(); c.arc(tx - k * (dr * 2.6) - dr, y + ch - dr - 6, dr, 0, TAU); c.fill();
    }
    // nome
    c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.8)';
    const nome = opz.nomi[i] || F.id;
    const spazio = cw - 22 - (dr * 2.6) * nVite;
    let fsN = Math.max(8, Math.min(12, cw * .08));
    c.font = `800 ${fsN}px system-ui, sans-serif`;
    const wN = c.measureText(nome).width;
    if (wN > spazio) { fsN = Math.max(7, fsN * spazio / wN); c.font = `800 ${fsN}px system-ui, sans-serif`; }
    c.fillText(nome, x + 7, y + ch - 6);
  }
  function cotta(i, w, h) {
    const H = HUDC[i] || (HUDC[i] = { k: '', cv: document.createElement('canvas') });
    const W2 = Math.ceil(w * dpr), H2 = Math.ceil(h * dpr);
    if (H.cv.width !== W2 || H.cv.height !== H2) { H.cv.width = W2; H.cv.height = H2; }
    return H;
  }
  function hud(c, S) {
    const R = L.hud, n = S.n, gap = 6;
    const cw = Math.min(170, (R.w - gap * (n + 1)) / n), ch = R.h;
    const x0 = R.x + (R.w - (cw * n + gap * (n - 1))) / 2;
    const nVite = S.vite > 9 ? 0 : S.vite;   // allenamento: vite infinite, niente pallini
    for (let i = 0; i < n; i++) {
      const F = S.L[i], V = VF[i], x = x0 + i * (cw + gap), y = R.y;
      const fuori = F.st === 'fuori';
      const p = F.st === 'morto' || fuori ? 0 : Math.floor(F.pct);
      const sh = V.pshake;
      const ox = sh > .3 ? (Math.random() - .5) * sh : 0, oy = sh > .3 ? (Math.random() - .5) * sh : 0;
      c.globalAlpha = fuori ? .45 : 1;
      // mentre la percentuale salta/trema dopo un colpo si disegna dal vivo come prima (ricuocere a ogni fotogramma
      // costerebbe di più: testo in un canvas piccolo + caricamento); da ferma, dalla copia cotta
      const animo = sh > .3 || Math.abs(V.ppop - 1) > .004 || V.pjy < -.3;
      if (animo) pannello(c, S, i, x, y, cw, ch, p, ox, oy, nVite);
      else {
        const key = `${cw.toFixed(1)}|${ch}|${dpr}|${p}|${F.vite}|${nVite}|${F.id}|${opz.nomi[i] || ''}|${i === opz.umano}`;
        const Hc = cotta(i, cw + HPAD * 2, ch + HPAD * 2);
        if (Hc.k !== key || Hc.x !== x || Hc.y !== y) {
          const q = Hc.cv.getContext('2d');
          q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, Hc.cv.width, Hc.cv.height);
          q.setTransform(dpr, 0, 0, dpr, (HPAD - x) * dpr, (HPAD - y) * dpr);
          q.globalAlpha = 1;
          pannello(q, S, i, x, y, cw, ch, p, 0, 0, nVite);
          Hc.k = key; Hc.x = x; Hc.y = y;
        }
        c.drawImage(Hc.cv, x - HPAD, y - HPAD, Hc.cv.width / dpr, Hc.cv.height / dpr);
      }
      const ps = Math.min(ch - 16, cw * .42);
      // ha la fiche rotta: chip che pulsa con il tempo che resta
      if (F.ulti > 0) {
        const pr = (Math.sin(tempoVis * .3) + 1) * .5, rr2 = ps * .26 * (1 + pr * .15);
        if (root.GSUI && root.GSUI.chipUlti) root.GSUI.chipUlti(c, F, x + 5 + ps * .85, y + 9 + ps * .85, rr2, GS.ULTI_POTERE, tempoVis);   // 18/10 ui_1810.js: la fiche AI
        else {
        c.fillStyle = '#c8102e'; c.beginPath(); c.arc(x + 5 + ps * .85, y + 9 + ps * .85, rr2, 0, TAU); c.fill();
        c.strokeStyle = '#ffd23b'; c.lineWidth = 3; c.beginPath(); c.arc(x + 5 + ps * .85, y + 9 + ps * .85, rr2 + 3, -Math.PI / 2, -Math.PI / 2 + TAU * F.ulti / GS.ULTI_POTERE); c.stroke();
        }
      }
      // RABBIA DEL CAMPIONE: barra sotto il ritratto, piena = pulsa rossa
      if (GS.D(F).rabbia && !fuori) {
        const bw = ps, bh = 5, bx2 = x + 5, by2 = y + 9 + ps + 2, q = F.rab / 100, piena = q >= 1;
        c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(bx2, by2, bw, bh);
        c.fillStyle = piena ? ((tempoVis >> 2) % 2 ? '#ff2020' : '#ffd23b') : '#d6312b'; c.fillRect(bx2, by2, bw * q, bh);
      }
      c.globalAlpha = 1;
    }
    // tempo (cotto anche lui: cambia una volta al secondo)
    const rest = Math.max(0, S.tempo - S.t), sec = Math.ceil(rest / 60);
    const tt = S.vite > 9 ? '∞' : S.sd ? (opz.lang === 'en' ? 'SUDDEN DEATH' : 'SPAREGGIO') : `${(sec / 60) | 0}:${String(sec % 60).padStart(2, '0')}`;
    const rosso = !S.sd && sec <= 10 && (tempoVis >> 4) % 2;
    const ins = L.ins || { l: 0, t: 0 };
    const tx = L.verticale ? L.gx + L.gw / 2 : L.gx + 64 + ins.l, ty = L.gy + 8 + ins.t;
    const Hc = cotta(4, 160, 34), key = `${tt}|${rosso}|${dpr}|${S.sd}`;
    if (Hc.k !== key) {
      const q = Hc.cv.getContext('2d');
      q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, Hc.cv.width, Hc.cv.height);
      q.setTransform(dpr, 0, 0, dpr, 0, 0);
      q.font = `italic 900 ${S.sd ? 15 : 18}px "Arial Black", Impact, sans-serif`;
      q.textAlign = 'center';
      const w = q.measureText(tt).width + 22;
      q.fillStyle = 'rgba(12,9,24,.7)'; rr(q, 80 - w / 2, 4, w, 26, 13); q.fill();
      q.fillStyle = rosso ? '#ff3b4e' : '#fff';
      q.fillText(tt, 80, 24);
      Hc.k = key;
    }
    c.drawImage(Hc.cv, tx - 80, ty - 4, 160, 34);
  }

  function annunci(c, S) {
    // conto alla rovescia dalla simulazione
    let testo = '', col = '#fff', scala = 1, a = 1, alto = false;
    if (S.via > 0) {
      const n = Math.ceil(S.via / 45);
      if (n <= 3) { testo = String(n); const q = 1 - (S.via % 45) / 45; scala = 1.6 - Math.min(1, q * 3) * .6; a = 1 - Math.max(0, q - .7) * 3; col = ['#3bff8b', '#ffd23b', '#ff3b4e'][n - 1] || '#fff'; }
    } else if (ann.t < ann.life) {
      testo = ann.testo; col = ann.col; alto = ann.alto; const q = ann.t / 20; scala = alto ? (q < 1 ? 1 + (1 - easeOut(q)) * .25 : 1) : ann.size * (q < 1 ? 1 + (1 - easeOut(q)) * .8 : 1); a = ann.life > 200 ? 1 : 1 - Math.max(0, (ann.t - ann.life + 15) / 15);
    }
    if (!testo) return;
    let fs = Math.min(L.gw * .2, L.gh * .28) * scala;
    if (alto) { c.font = `italic 900 100px "Arial Black", Impact, sans-serif`; fs = Math.min(L.gh * .075, L.gw * .6 * 100 / c.measureText(testo).width) * scala; }
    c.save(); c.globalAlpha = Math.max(0, a);
    if (alto) c.translate(L.gx + L.gw / 2, (L.hud && !L.verticale ? L.hud.y + L.hud.h : L.gy) + fs * .9);
    else c.translate(L.gx + L.gw / 2, L.gy + L.gh * .45);
    c.rotate(-.06);
    c.font = `italic 900 ${fs}px "Arial Black", Impact, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = fs * .14; c.strokeStyle = '#0b0b14'; c.lineJoin = 'round'; c.strokeText(testo, 0, 0);
    c.fillStyle = col; c.fillText(testo, 0, 0);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillText(testo, 0, -fs * .04);
    c.restore();
  }

  // linee radiali da manga sul colpo da KO
  // l'impact frame: fondo pieno, i lottatori a silhouette piena (la loro posa di questo fotogramma), linee di velocità
  function impactFrame(c, S, fase, z) {
    const fondo = fase === 1 ? '#06030c' : '#f3efe4', sag = fase === 1 ? '#ffffff' : '#08050f';
    c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalAlpha = 1; c.fillStyle = fondo; c.fillRect(L.gx, L.gy, L.gw, L.gh);
    c.restore();
    // linee di velocità dal punto d'impatto (cunei sottili, fissi: niente caso)
    const R = Math.max(L.gw, L.gh) / z, ix = IMPF.x, iy = IMPF.y;
    c.fillStyle = sag; c.globalAlpha = fase === 1 ? .9 : .8;
    c.beginPath();
    for (let k = 0; k < 40; k++) {
      const a = k * TAU / 40 + ((k * 7) % 5) * .03, r0 = (60 + ((k * 37) % 11) * 14) / Math.max(.5, z * .9), w = .008 + ((k * 13) % 4) * .004;
      c.moveTo(ix + Math.cos(a - w) * r0, iy + Math.sin(a - w) * r0); c.lineTo(ix + Math.cos(a) * R, iy + Math.sin(a) * R); c.lineTo(ix + Math.cos(a + w) * r0, iy + Math.sin(a + w) * r0);
    }
    c.fill();
    c.globalAlpha = 1;
    // silhouette: prima gli altri, sopra chi colpisce e chi è colpito
    for (let g = 0; g < 2; g++) for (let i = 0; i < S.n; i++) {
      const F = S.L[i], V = VF[i];
      if (F.st === 'morto' || F.st === 'fuori' || F.nasc || V.ip == null) continue;
      if ((i === IMPF.ka || i === IMPF.kv) !== (g === 1)) continue;
      c.save(); c.translate(V.ix, V.iy);
      if (V.ir) { c.translate(0, -V.iH * .5); c.rotate(V.ir); c.translate(0, V.iH * .5); }
      c.scale(V.isx, V.isy);
      root.GBR.draw(c, F.id, 0, 0, { pose: V.ip, t: V.it, facing: F.dir, h: V.ih, aim: V.ia, tint: sag, tintA: 1 });
      c.restore();
    }
    // stella d'impatto al centro
    c.fillStyle = sag; c.beginPath();
    for (let k = 0; k < 16; k++) { const a = k * TAU / 16, r = (k % 2 ? 9 : 34) / Math.max(.5, z * .9); if (k) c.lineTo(ix + Math.cos(a) * r, iy + Math.sin(a) * r); else c.moveTo(ix + r, iy); }
    c.fill();
  }
  function linee(c, z) {
    if (cam.linee <= 0) return;
    const sx = (cam.lx - cam.x) * z + L.gx + L.gw / 2, sy = (cam.ly - cam.y) * z + L.gy + L.gh / 2;
    c.save(); c.globalAlpha = Math.min(1, cam.linee / 10) * .8;
    c.fillStyle = '#fff';
    const R = Math.max(L.gw, L.gh);
    for (let k = 0; k < 28; k++) {
      const a = k * TAU / 28 + (k % 3) * .05, r0 = R * (.22 + ((k * 37) % 10) / 40);
      c.beginPath(); c.moveTo(sx + Math.cos(a - .015) * r0, sy + Math.sin(a - .015) * r0); c.lineTo(sx + Math.cos(a) * R, sy + Math.sin(a) * R); c.lineTo(sx + Math.cos(a + .015) * r0, sy + Math.sin(a + .015) * r0); c.fill();
    }
    c.restore();
  }

  function disegna(S, Lay, alfa) {
    const a = alfa == null ? 1 : Math.max(0, Math.min(1, alfa));
    mescola(S, a);
    const cx0 = cam.x, cy0 = cam.y, cz0 = cam.z;
    if (!cam.punch) { cam.x = cam.px + (cam.x - cam.px) * a; cam.y = cam.py + (cam.y - cam.py) * a; cam.z = cam.pz + (cam.z - cam.pz) * a; }
    try { disegnaDentro(S, Lay); } finally { ripristina(S); cam.x = cx0; cam.y = cy0; cam.z = cz0; }
  }
  function disegnaDentro(S, Lay) {
    L = Lay;
    const c = ctx;
    const W = L.W, H = L.H;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // cielo
    c.drawImage(SF.cielo, 0, 0, W, H);
    // scossa (trauma^2, sinusoidi: liscia, non rumore)
    const tr = cam.trauma * cam.trauma;
    const so = cam.samp * Math.cos(cam.sph);
    const shx = tr * 22 * Math.sin(tempoVis * 1.7) * Math.cos(tempoVis * .9) + cam.sdx * so, shy = tr * 16 * Math.sin(tempoVis * 2.3 + 1) + cam.sdy * so;
    const z = cam.z;
    c.save();
    c.translate(shx, shy);
    disegnaStrato(c, SF.far, SF.farF, 150, z);
    disegnaStrato(c, SF.mid, SF.midF, 160, z);
    if (S.U.on && S.U.fase === 2) { c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0); root.GSE.atmosfera(c, S, L, tempoVis); c.restore(); }
    // mondo
    c.save();
    c.translate(L.gx + L.gw / 2, L.gy + L.gh / 2);
    c.scale(z, z);
    c.rotate(tr * .03 * Math.sin(tempoVis * 1.1));
    c.translate(-cam.x, -cam.y);
    disegnaPalco(c, S);
    if (S.U.on && S.U.fase === 2) root.GSE.scena(c, S, tempoVis);
    // piattaforme di rinascita
    for (let i = 0; i < S.n; i++) {
      const F = S.L[i]; if (F.st !== 'rinasce') continue;
      c.fillStyle = COLP[i]; c.globalAlpha = .9; c.beginPath(); c.ellipse(F.x, F.y + 4, 34, 7, 0, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .5; c.drawImage(glow(COLP[i]), F.x - 50, F.y - 20, 100, 40); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    ombre(c, S);
    disegnaOggetti(c, S);
    if (root.GSFX) root.GSFX.dietro(c, S);   // FX 17/10: il lampo illumina palco e fondo
    // dietro i lottatori: bagliore del colore del giocatore (leggibilità nel caos); con gli effetti ridotti solo il tuo
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < S.n; i++) {
      if (opz.leggero && i !== opz.umano) continue;
      const F = S.L[i]; if (F.st === 'morto' || F.st === 'fuori') continue;
      const Hh = GS.D(F).H; c.globalAlpha = i === opz.umano ? .3 : .18;   // 18/10: alone ridotto come smash_1410 (coordinatore)
      c.drawImage(glow(COLP[i]), F.x - Hh * .75, F.y - Hh * 1.2, Hh * 1.5, Hh * 1.4);
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // lottatori: l'umano per ultimo (sopra gli altri)
    for (let i = 0; i < S.n; i++) { if (i === opz.umano) continue; const F = S.L[i]; if (F.st === 'morto' || F.st === 'fuori') continue; disegnaLottatore(c, S, F, i); }
    if (opz.umano >= 0 && opz.umano < S.n) { const F = S.L[opz.umano]; if (F.st !== 'morto' && F.st !== 'fuori') disegnaLottatore(c, S, F, opz.umano); }
    fxMosse(c, S);
    disegnaProiettili(c, S);
    if (SF.sopra) SF.sopra(c, S.t); // arene 15/10: avvisi dei pericoli sopra i lottatori (fari del treno, rulli, vassoio)
    if (S.FB.on) root.GSE.ficheFin(c, S.FB, tempoVis);
    if (root.GSUI && root.GSUI.ficheDopo) root.GSUI.ficheDopo(c, S, tempoVis);   // 18/10 ui_1810.js: frammenti e lampo della rottura
    disegnaParticelle(c, z);
    root.GSE.disegnaTema(c);
    // colpo da KO: la scena si spegne, restano accesi solo chi colpisce e chi vola
    if (cam.linee > 0 && cam.kv >= 0) {
      const k = Math.min(1, cam.linee / 8);
      c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = `rgba(4,2,10,${.55 * k})`; c.fillRect(L.gx, L.gy, L.gw, L.gh);
      c.restore();
      if (cam.ka >= 0 && S.L[cam.ka] && S.L[cam.ka].st !== 'morto') disegnaLottatore(c, S, S.L[cam.ka], cam.ka);
      if (S.L[cam.kv] && S.L[cam.kv].st !== 'morto') disegnaLottatore(c, S, S.L[cam.kv], cam.kv);
    }
    disegnaScintille(c);
    if (root.GSFX) root.GSFX.sopra(c, S);   // FX 17/10: scie, carica dorata, lampi, anelli, raggi, schegge
    root.GSE.disegnaFirme(c);
    disegnaPop(c);
    if (root.GSHV && root.GSHV.on) root.GSHV.disegna(c, S); // 16/10 hitbox_vista.js: ?hitbox=1, hurtbox/hitbox/proiettili del motore
    const imp = fasePImpatto();
    if (imp) impactFrame(c, S, imp, z);
    c.restore();
    etichette(c, S, z);
    linee(c, z);
    disegnaKO(c, S, z);
    bolle(c, S, z);
    c.restore();
    // lampo
    if (cam.flash > 0 && !imp) { c.globalAlpha = cam.flash * .55; c.fillStyle = cam.flashCol; c.fillRect(L.gx, L.gy, L.gw, L.gh); c.globalAlpha = 1; }
    if (L.verticale) { c.fillStyle = '#0d0918'; c.fillRect(0, L.gh, W, H - L.gh); c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(0, L.gh, W, 1); }
    hud(c, S);
    if (root.GSHV && root.GSHV.on) root.GSHV.hud(c, L);
    annunci(c, S);
    if (S.U.on && S.U.fase === 1) {
      const U = S.U, info = GS.UL.perId[U.id];
      root.GSE.intro(c, S, L, VF[U.p].col, opz.lang === 'en' ? info.en : info.nome, U.id);
    }
    // nome del colpo del Campione mentre carica (come nella BOXE)
  }

  function ridimensiona(w, h, d) {
    dpr = d; cvs.width = Math.round(w * d); cvs.height = Math.round(h * d);
    cvs.style.width = w + 'px'; cvs.style.height = h + 'px';
  }

  root.GSD = {
    get rallenta() { return rallenta; }, set rallenta(v) { rallenta = v; },
    init, preparaArena, passo, disegna, prima, ridimensiona, opz, cam, COLP, scossa, annuncio, colorePct, posaDi,
    CARICA_GEN,   // 16/10 sera: smash con la posa generica in carica (banco/carica_foglio.mjs la confronta)
    // banco: quanti impact frame sono scattati; impattoA(ms) rimette l'orologio dell'ultimo a ms dall'inizio (per le foto)
    impatti: () => IMPF.n, impattoA(ms) { IMPF.pend = 0; IMPF.t0 = performance.now() - ms; }, impatto: () => { const d = performance.now() - IMPF.t0; return d < IMP_MS1 ? 1 : d < IMP_MS2 ? 2 : 0; },
    set suoni(s) { SUONI = s; }, get particelle() { return pVive; }, emetti, pc, ritratto, glow, rr,
    stress(n) { for (let k = 0; k < n; k++) emetti(k % 2 ? 1 : 0, (Math.random() - .5) * 600, -Math.random() * 300, (Math.random() - .5) * 6, (Math.random() - .5) * 6, 40 + Math.random() * 40, 6 + Math.random() * 8, k % 5, 0); },
  };
})(window);
