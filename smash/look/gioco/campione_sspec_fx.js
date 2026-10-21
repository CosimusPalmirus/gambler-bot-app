/* smash_look_1710 — CAMPIONE: SVENTOLA IN VOLO (sspec, Jolt Haymaker di Little Mac) e MONTANTE KO (gko), 20/10 notte.
   Proprietario: «la speciale laterale del campione devi animarla meglio, simile a quella di Little Mac, con un bell'effetto
   visivo che segue l'arco dell'azione»; «migliora anche il montante KO: caricato dal basso, pugno verso l'alto, scia su tutta
   la curva, con più pose se no viene laggoso».
   - pose AI alla scala dell'idle (boxer_sspec_2010/*.webp, pose.json: guardia = altezza della guardia equivalente);
   - la posa la sceglie la fase della mossa (mf, r1/r2/r3 del motore, vedi CONTRATTO_sspec_boxer.md), con stiramento e
     schiacciamento, sagome fantasma nel balzo;
   - SCIA larga lungo l'arco del guantone: i punti sono quelli delle hitbox del motore (JOLT_ARCO / GKO_ARCO, in H dai piedi)
     più l'attacco dell'arco, tenuti in coordinate del MONDO, così la scia resta sulla traiettoria del balzo;
   - Bomba (nspec, 20/10 notte, «rifai anche la speciale normale caricata con pose più belle»): carica in 3 stadi col
     guantone che brilla sempre di più, scatto, pugno teso con la scia dritta, frenata, rientro;
   - SCHIVATA E CONTRO (dspec, 20/10 notte, «la speciale in giù è strana e mancano pose»): schivata di busto in 2 fasi con
     sagome, tenuta, rientro; col contraccolpo lampo + gancio-montante con la scia ad arco, chiusura;
   - impatto (stella, anello, scintille) quando il colpo prende qualcuno (F.mh diventa diverso da 0); carica dorata sul
     guantone nel montante. SOLO DISEGNO: legge lo stato, non lo scrive. */
(function (root) {
  'use strict';
  const BASE = '/smash_look_1710/boxer_sspec_2010/';
  const IMG = {}, META = {}; let pronto = false, corrente = null, idleK = 0;
  const ready = fetch(BASE + 'pose.json').then(r => { if (!r.ok) throw Error('pose Campione'); return r.json(); }).then(async j => {
    Object.assign(META, j);
    await Promise.all(Object.keys(j).map(async k => { const im = new Image(); im.src = BASE + k + '.webp'; await im.decode(); IMG[k] = im; }));
    pronto = true;
  });
  ready.catch(e => console.warn('Campione sventola:', e));
  const TAU = Math.PI * 2;
  // arco del guantone in H dai piedi (x avanti, y su), per fotogramma della mossa: prima dei punti delle hitbox
  // l'attacco del gesto (braccio che sale dietro la testa / guantone che parte dal basso)
  const ARCO = {
    sspec: [[8, -.25, 1.1], [10, -.12, 1.32], [12, .1, 1.36], [13, .3, 1.2], [15, .58, 1.05], [17, .78, .8], [19, .86, .55], [21, .8, .32], [23, .7, .25]],
    gko: [[9, -.15, .3], [11, .3, .12], [12, .5, .22], [13, .62, .42], [14, .72, .78], [15, .56, 1.15], [16, .3, 1.42], [17, .14, 1.5], [19, .08, 1.55]],
  };
  const ARCO_CTR = [[3, .1, .4], [5, .45, .62], [7, .72, .86], [9, .78, 1.05], [12, .55, 1.3], [14, .3, 1.38]];
  function puntoArco(mv, mf, F, s) {
    if (mv === 'dspec') {   // contraccolpo: gancio-montante di risposta (tempo dal contraccolpo, non mf: il motore salta a 25)
      if (s.ctr < 0) return null; const c = s.k - s.ctr, A = ARCO_CTR; if (c < A[0][0] || c > A[A.length - 1][0]) return null;
      let i = 0; while (i + 1 < A.length && A[i + 1][0] <= c) i++;
      const a = A[i], b = A[Math.min(A.length - 1, i + 1)], q = b[0] > a[0] ? (c - a[0]) / (b[0] - a[0]) : 0;
      return [a[1] + (b[1] - a[1]) * q, a[2] + (b[2] - a[2]) * q];
    }
    if (mv === 'nspec') {   // Bomba: il guantone teso davanti per tutto lo scatto (la scia nasce dal movimento del corpo)
      const dt = F.r2 ? mf - F.r2 : -1; return dt >= 1 && dt <= F.r3 + 2 ? [.85, .62] : null;
    }
    const A = ARCO[mv]; if (mf < A[0][0] || mf > A[A.length - 1][0]) return null;
    let i = 0; while (i + 1 < A.length && A[i + 1][0] <= mf) i++;
    const a = A[i], b = A[Math.min(A.length - 1, i + 1)], q = b[0] > a[0] ? (mf - a[0]) / (b[0] - a[0]) : 0;
    return [a[1] + (b[1] - a[1]) * q, a[2] + (b[2] - a[2]) * q];
  }
  function mossa(F) { return F && F.id === 'boxer' && F.st === 'mossa' && (F.mv === 'sspec' || F.mv === 'gko' || F.mv === 'nspec' || F.mv === 'dspec') ? F.mv : null; }
  // [posa, stiramento x, schiacciamento y, rotazione in gradi (avanti +), alzata in H]
  function sequenza(F, mv, s) {
    const mf = F.mf;
    if (mv === 'dspec') {   // SCHIVATA E CONTRO: schivata di busto, tenuta, rientro; col contraccolpo: scatto, gancio, chiusura
      if (s && s.ctr >= 0) { const c = s.k - s.ctr; return c < 5 ? ['c_scatto', .92, 1.1, 0, 0] : c < 16 ? ['c_colpo', 1.08, .95, 0, 0] : c < 26 ? ['c_dopo', 1, 1, 0, 0] : ['d_risale', 1, 1, 0, 0]; }
      if (mf < 4) return ['d_schiva1', 1.04, .95, 0, 0];
      if (mf < 9) return ['d_schiva2', 1.06, .92, 0, 0];
      if (mf < 23) return ['d_tieni', 1 + .02 * Math.sin(mf * .6), 1 - .02 * Math.sin(mf * .6), 0, 0];
      if (mf < 28) return ['d_schiva2', 1, 1, 0, 0];
      return ['d_risale', 1, 1, 0, 0];
    }
    if (mv === 'sspec') {
      if (!F.r1) { const q = Math.min(1, mf / 7); return ['s_carica', 1 - .06 * q, 1 + .05 * q, -6 * q, 0]; }
      if (F.r1 === 1) {
        if (mf < 9) return ['s_stacco', .9, 1.12, 4, 0];
        if (mf < 13) return ['s_volo', 1.04, .97, 6, 0];
        if (mf < 15) return ['s_sv1', 1, 1, 6, 0];
        if (mf < 18) return ['s_sv2', 1.06, .96, 8, 0];
        if (mf < 23) return ['s_sv3', 1.04, .97, 6, 0];
        return ['s_dopo', 1, 1, 4, 0];
      }
      const dt = mf - F.r2, coda = (F.r3 & 2) ? 12 : 30;
      if (dt < 3) return ['s_atterra', 1.12, .86, 0, 0];
      if (dt < coda * .6) return ['s_atterra', 1, 1, 0, 0];
      return ['s_rientro', 1, 1, 0, 0];
    }
    if (mv === 'nspec') {   // Bomba: carica in 3 stadi (F.r1 0..60), scatto, pugno teso per F.r3 f, frenata, rientro
      if (!F.r2) { const q = F.r1 / 60, tr = q > .8 ? Math.sin(F.mf * 2.3) * 1.6 : 0; return [q < .34 ? 'b_carica1' : q < .8 ? 'b_carica2' : 'b_carica3', 1 + .06 * q, 1 - .06 * q, tr, 0]; }
      const dt = mf - F.r2;
      if (dt <= 2) return ['b_scatto', 1.1, .93, 4, 0];
      if (dt <= F.r3) return ['b_pugno', 1.08, .95, 0, 0];
      if (dt <= F.r3 + 7) return ['b_frena', dt <= F.r3 + 2 ? 1.08 : 1, dt <= F.r3 + 2 ? .92 : 1, 0, 0];
      return ['b_rientro', 1, 1, 0, 0];
    }
    // gko: carica 0-10 (accucciata che trema), partenza dal basso, salita in 3 fasi, pugno al cielo coi piedi staccati
    if (mf < 10) { const q = mf / 10; return ['k_carica', 1 + .05 * q, 1 - .07 * q, 0, 0]; }
    if (mf < 13) return ['k_parte', .94, 1.08, 0, 0];
    if (mf < 14) return ['k_sale1', .92, 1.1, 0, 0];
    if (mf < 16) return ['k_sale2', .92, 1.12, 0, .04];
    if (mf < 24) return ['k_alto', .95, 1.08, 0, .14 * Math.sin(Math.min(1, (mf - 16) / 8) * Math.PI)];
    if (mf < 38) return ['k_ricade', mf < 26 ? 1.08 : 1, mf < 26 ? .9 : 1, 0, 0];
    return ['k_rientro', 1, 1, 0, 0];
  }
  // 21/10 (proprietario: «quando il campione fa la speciale laterale cambia la dimensione», anche nspec e dspec): le pose AI
  // uscivano ~8% piu' grandi dell'idle dell'atlante (testa, cintura e gambe sovrapposte all'idle combaciano a x0,92;
  // confronto in boxer_sspec_2010/FOGLIO_dimensione_*.png). Vale per tutte le pose di questo file.
  const DIM = .92;
  const ST = new WeakMap();
  function st(F) { let s = ST.get(F); if (!s) { s = { mf: -1, mv: null, scia: [], ghost: [], fx: [], mh: 0, k: 0, ctr: -1 }; ST.set(F, s); } return s; }

  function init() {
    const G = root.GBR, L = root.GSLOOK; if (!G || !L || !root.GSE || !root.GSE.corpo) return setTimeout(init, 60);
    const corpo = root.GSE.corpo;
    root.GSE.corpo = function (F, m) { return mossa(F) && pronto ? { r: 0, sx: 1, sy: 1, ox: 0, oy: 0, tr: 0 } : corpo.apply(this, arguments); };
    const load = G.load;
    if (load) G.load = async function (ids) { const r = await load.apply(this, arguments); if ((ids || []).includes('boxer')) await ready; return r; };
    const prima = L.prima, traccia = L.traccia, draw = G.draw;
    L.prima = function (F) { corrente = F; return prima.apply(this, arguments); };
    const dopo = L.dopo;
    L.dopo = function () { const r = dopo.apply(this, arguments); corrente = null; return r; };
    L.traccia = function (c, F) { if (!(mossa(F) && pronto)) return traccia.apply(this, arguments); };   // la scia sottile di campione_fx lascia il posto a questa
    function altezzaIdle() {   // idle disegnato con h = 100 (una volta)
      if (idleK) return idleK;
      const cv = document.createElement('canvas'); cv.width = cv.height = 300; const x = cv.getContext('2d');
      draw.call(G, x, 'boxer', 150, 260, { pose: 'idle', t: 0, h: 100, facing: 1 });
      const d = x.getImageData(0, 0, 300, 300).data; let y0 = 300, y1 = -1;
      for (let y = 0; y < 300; y++) for (let X = 0; X < 300; X++) if (d[(y * 300 + X) * 4 + 3] > 40) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return (idleK = y1 > y0 ? (y1 - y0) / 100 : 1.09);
    }
    function posa(c, nm, gh, dir, sx, sy, rot, su, alpha) {
      const m = META[nm], im = IMG[nm]; if (!m || !im) return;
      const k = gh * altezzaIdle() / m.guardia * DIM, iw = m.w * k, ih = m.h * k;
      c.save(); c.translate(0, -su * gh); c.rotate(rot * dir * Math.PI / 180); c.scale(dir * sx, sy);
      if (alpha != null) c.globalAlpha *= alpha;
      const pad = m.v >= 3 ? 4 * k : 0;   // grana_atlante.py: 4 px di margine attorno (contorno): i piedi tornano a terra
      c.drawImage(im, -iw * .5, -ih + pad, iw, ih); c.restore();
    }
    G.draw = function (c, id, x, y, o) {
      const F = corrente, mv = mossa(F);
      if (id !== 'boxer' || !mv || !pronto) return draw.apply(this, arguments);
      const s = st(F), H = root.GS.D(F).H, gh = o.h || H / 1.02, dir = F.dir < 0 ? -1 : 1, al = o.alpha == null ? 1 : o.alpha;
      // disegni secondari (sagome della scia di movimento, lampo d'impatto a tinta piena): solo la posa, niente stato
      if (al < .99 || o.tintA) { const [nm0, a0, b0, r0, u0] = sequenza(F, mv, ST.get(F)); c.save(); c.translate(x, y); posa(c, nm0, gh, dir, a0, b0, r0, u0, al); c.restore(); return; }
      if (s.mv !== mv || F.mf < s.mf - 2) { s.mv = mv; s.scia.length = 0; s.ghost.length = 0; s.mh = 0; s.ctr = -1; }
      const mf0 = s.mf, nuovo = F.mf !== s.mf; s.mf = F.mf; s.k++;
      // contraccolpo: il motore salta la mossa al f 25 con 24 f d'invulnerabilita' (e 10 di hitlag)
      if (mv === 'dspec') { if (s.ctr < 0 && F.mf >= 25 && mf0 < 25 && mf0 >= 4 && F.inv >= 14) { s.ctr = s.k; s.fx.push({ x: F.x + dir * H * .5, y: F.y - H * .7, t: 0, big: 1.3 }); if (root.GSD && root.GSD.scossa) root.GSD.scossa(.5); } }
      const [nm, sx, sy, rot, su] = sequenza(F, mv, s);
      // sagome fantasma nel balzo (coordinate del mondo: restano dietro mentre lui avanza)
      const schiva = mv === 'dspec' && s.ctr < 0 && F.mf < 12;
      if (schiva && s.ghost.length) for (let i = 0; i < s.ghost.length; i++) { const g = s.ghost[i]; c.save(); c.translate(x - dir * H * .12 * (s.ghost.length - i), y); c.globalCompositeOperation = 'lighter'; posa(c, g.nm, gh, dir, g.sx, g.sy, 0, 0, al * (.12 + .06 * i)); c.restore(); }
      if (schiva && nuovo) { s.ghost.push({ nm: F.mf < 4 ? 'd_schiva1' : 'd_schiva2', sx: 1, sy: 1 }); if (s.ghost.length > 3) s.ghost.shift(); }
      const volo = mv === 'sspec' ? F.r1 === 1 : mv === 'nspec' ? !!F.r2 && F.mf - F.r2 >= 1 && F.mf - F.r2 <= F.r3 : (F.mf >= 13 && F.mf < 24);
      c.save(); c.translate(x, y);
      if (volo) for (let i = 0; i < s.ghost.length; i++) {
        const g = s.ghost[i]; c.save(); c.translate(g.x - F.x, g.y - F.y); c.globalCompositeOperation = 'lighter';
        posa(c, g.nm, gh, dir, g.sx, g.sy, g.rot, g.su, al * (.1 + .07 * i)); c.restore();
      }
      if (volo && nuovo) { s.ghost.push({ nm, x: F.x, y: F.y, sx, sy, rot, su }); if (s.ghost.length > 4) s.ghost.shift(); }
      if (!volo && !schiva) s.ghost.length = 0;
      // carica del montante: bagliore dorato sul guantone basso che cresce, scintille risucchiate
      if (mv === 'gko' && F.mf < 13) {
        const q = Math.min(1, F.mf / 11), gx = dir * (F.mf < 10 ? -.2 : .35) * H, gy = -(F.mf < 10 ? .38 : .18) * H, r = H * (.12 + .22 * q);
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(gx, gy, 0, gx, gy, r * 2.2); g.addColorStop(0, 'rgba(255,250,210,' + (.9 * q) + ')'); g.addColorStop(.35, 'rgba(255,200,60,' + (.55 * q) + ')'); g.addColorStop(1, 'rgba(255,120,20,0)');
        c.fillStyle = g; c.beginPath(); c.arc(gx, gy, r * 2.2, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,230,150,' + (.7 * q) + ')'; c.lineWidth = H * .02;
        for (let i = 0; i < 6; i++) { const a = i * 1.05 + s.k * .25, R = r * (2.6 - 1.4 * ((s.k * .07 + i * .17) % 1)); c.beginPath(); c.moveTo(gx + Math.cos(a) * R, gy + Math.sin(a) * R); c.lineTo(gx + Math.cos(a) * R * .8, gy + Math.sin(a) * R * .8); c.stroke(); }
        c.restore();
      }
      if (mv === 'nspec' && !F.r2) {
        const q = F.r1 / 60, gx = -dir * (.28 + .1 * q) * H, gy = -(.48 - .15 * q) * H, r = H * (.08 + .2 * q), pieno = q >= 1 && (s.k >> 2) % 2 === 0;
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(gx, gy, 0, gx, gy, r * 2.4); g.addColorStop(0, 'rgba(255,250,215,' + (.5 + .45 * q) + ')'); g.addColorStop(.35, pieno ? 'rgba(255,255,255,.8)' : 'rgba(255,190,50,' + (.5 * q + .15) + ')'); g.addColorStop(1, 'rgba(255,110,20,0)');
        c.fillStyle = g; c.beginPath(); c.arc(gx, gy, r * 2.4, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,220,140,' + (.3 + .5 * q) + ')'; c.lineWidth = H * .018;
        for (let i = 0; i < 2 + Math.floor(q * 3); i++) { const R = r * (3.2 - 2 * ((s.k * .05 + i * .33) % 1)); c.beginPath(); c.arc(gx, gy, R, 0, TAU); c.stroke(); }
        c.restore();
      }
      posa(c, nm, gh, dir, sx, sy, rot, su, al);
      c.restore();
      // punto dell'arco in coordinate del mondo (solo quando avanza la mossa: nell'hitlag la scia resta ferma)
      if (nuovo || (mv === 'dspec' && s.ctr >= 0)) {
        const p = puntoArco(mv, F.mf, F, s);
        if (p) s.scia.push({ x: F.x + dir * p[0] * H, y: F.y - p[1] * H - su * gh, t: s.k });
        if (F.mh && !s.mh) {   // il colpo e' andato a segno: impatto sul guantone
          const u = s.scia[s.scia.length - 1] || { x: F.x + dir * H * .7, y: F.y - H * .7 };
          s.fx.push({ x: u.x, y: u.y, t: 0, big: mv === 'gko' ? 1.5 : 1 });
          if (root.GSD && root.GSD.scossa) root.GSD.scossa(mv === 'gko' ? .6 : .35);
        }
        s.mh = F.mh;
      }
      while (s.scia.length && s.k - s.scia[0].t > 16) s.scia.shift();
      c.save(); c.translate(x - F.x, y - F.y);   // da qui in poi coordinate del mondo
      nastro(c, s, H, al, mv);
      impatti(c, s, H);
      c.restore();
    };
    // la scia: nastro sfumato che si allarga verso il guantone (Catmull-Rom sui punti dell'arco), oro caldo con nucleo
    // bianco, piu' una seconda passata 'lighter' per il bagliore
    function nastro(c, s, H, al, mv) {
      const S = s.scia; if (S.length < 2) return;
      const P = [];
      for (let i = 0; i < S.length - 1; i++) {
        const a = S[Math.max(0, i - 1)], b = S[i], c2 = S[i + 1], d = S[Math.min(S.length - 1, i + 2)];
        for (let k = 0; k < 5; k++) {
          const t = k / 5, t2 = t * t, t3 = t2 * t;
          P.push([.5 * (2 * b.x + (-a.x + c2.x) * t + (2 * a.x - 5 * b.x + 4 * c2.x - d.x) * t2 + (-a.x + 3 * b.x - 3 * c2.x + d.x) * t3),
                  .5 * (2 * b.y + (-a.y + c2.y) * t + (2 * a.y - 5 * b.y + 4 * c2.y - d.y) * t2 + (-a.y + 3 * b.y - 3 * c2.y + d.y) * t3),
                  b.t + (c2.t - b.t) * t]);
        }
      }
      const u = S[S.length - 1]; P.push([u.x, u.y, u.t]);
      const n = P.length, eta = s.k - u.t, vita = Math.max(0, 1 - eta / 14);
      if (vita <= 0) return;
      const W = H * (mv === 'gko' ? .3 : .26);
      const L = [], R = [];
      for (let i = 0; i < n; i++) {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        const q = i / (n - 1), w = W * (.08 + .92 * q * q) * vita;
        L.push([P[i][0] - dy / l * w, P[i][1] + dx / l * w]); R.push([P[i][0] + dy / l * w, P[i][1] - dx / l * w]);
      }
      c.save(); c.globalAlpha *= al;
      const g = c.createLinearGradient(P[0][0], P[0][1], u.x, u.y);
      g.addColorStop(0, 'rgba(255,120,30,0)'); g.addColorStop(.45, 'rgba(255,170,40,' + (.55 * vita) + ')'); g.addColorStop(.85, 'rgba(255,225,120,' + (.9 * vita) + ')'); g.addColorStop(1, 'rgba(255,255,235,' + vita + ')');
      c.fillStyle = g; c.beginPath(); c.moveTo(L[0][0], L[0][1]);
      for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]);
      for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
      c.closePath(); c.fill();
      // nucleo e bagliore
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = 'rgba(255,240,190,' + (.55 * vita) + ')'; c.lineWidth = W * .22;
      c.beginPath(); c.moveTo(P[Math.floor(n * .4)][0], P[Math.floor(n * .4)][1]); for (let i = Math.floor(n * .4) + 1; i < n; i++) c.lineTo(P[i][0], P[i][1]); c.stroke();
      const gg = c.createRadialGradient(u.x, u.y, 0, u.x, u.y, W * 1.6); gg.addColorStop(0, 'rgba(255,250,220,' + (.8 * vita) + ')'); gg.addColorStop(1, 'rgba(255,170,40,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(u.x, u.y, W * 1.6, 0, TAU); c.fill();
      // linee di velocita' lungo l'arco
      c.strokeStyle = 'rgba(255,230,160,' + (.35 * vita) + ')'; c.lineWidth = H * .012;
      for (let i = 2; i < n - 1; i += 3) { const p = P[i], q = i / n; c.beginPath(); c.moveTo(L[i][0], L[i][1]); c.lineTo(L[i][0] + (L[i][0] - p[0]) * .9 * q, L[i][1] + (L[i][1] - p[1]) * .9 * q); c.stroke(); }
      c.restore();
    }
    // impatto: lampo a stella, anello che si allarga, scintille
    function impatti(c, s, H) {
      for (let i = s.fx.length - 1; i >= 0; i--) {
        const f = s.fx[i]; f.t++; if (f.t > 18) { s.fx.splice(i, 1); continue; }
        const u = f.t / 18, R = H * (.25 + .9 * u) * f.big;
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = (1 - u);
        c.fillStyle = '#fff3c4'; c.beginPath();
        for (let k = 0; k < 16; k++) { const a = k * TAU / 16 + f.big, r = k % 2 ? R * .28 : R * (1.1 - .3 * u); c.lineTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); }
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,200,80,' + (1 - u) + ')'; c.lineWidth = H * .05 * (1 - u) * f.big;
        c.beginPath(); c.arc(f.x, f.y, R * 1.25, 0, TAU); c.stroke();
        c.fillStyle = 'rgba(255,220,120,' + (1 - u) + ')';
        for (let k = 0; k < 10; k++) { const a = k * 2.4 + f.big, r = R * (1.2 + .6 * u); c.beginPath(); c.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, H * .03 * (1 - u) * f.big, 0, TAU); c.fill(); }
        c.restore();
      }
    }
    root.GSCAMPIONEFX = { pronta: () => ready, stato: F => ST.get(F) };
  }
  init();
})(window);
