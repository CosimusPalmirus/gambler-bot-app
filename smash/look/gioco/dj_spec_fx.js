/* smash_look_1710 — DJ BASSO: pose AI delle SPECIALI nuove (21/10 notte).
   Proprietario: «migliora tutte le pose di DJ basso e modifica le abilità per dargli più mobility e abilità fighe a tempo
   con la sua passiva». Il motore (esperti.js) ora ha: SCIVOLATA SUL VINILE (laterale), CASSA A RAZZO guidabile (su),
   CASSA A RITMO + TELETRASPORTO sul battito (giù), ONDA DEI BASSI (neutra, in aria a tempo rilancia su).
   Qui solo il DISEGNO: pose AI intere (dj_2110/pose/*.webp, grana dell'atlante), scelte dalla fase della mossa, piu' gli
   effetti AI (dj_2110/fx: note, onde, scintille del vinile). Legge lo stato, non lo scrive. */
(function (root) {
  'use strict';
  const BASE = '/smash_look_1710/dj_2110/pose/';
  const IMG = {}, META = {}; let pronto = false, corrente = null, idleK = 0;
  const ready = fetch(BASE + 'pose.json').then(r => { if (!r.ok) throw Error('pose dj'); return r.json(); }).then(async j => {
    Object.assign(META, j);
    await Promise.all(Object.keys(j).map(async k => { const im = new Image(); im.src = BASE + k + '.webp'; await im.decode(); IMG[k] = im; }));
    pronto = true;
  });
  ready.catch(e => console.warn('DJ pose:', e));
  const FX = {};   // effetti AI (fogli singoli): nota_0..2, onda, scintille, anello
  fetch('/smash_look_1710/dj_2110/fx/fx.json').then(r => r.json()).then(j => { for (const n in j) { const im = new Image(); im.onload = () => { FX[n] = im; }; im.src = '/smash_look_1710/dj_2110/fx/' + n + '.webp'; } }).catch(() => { });
  const MOSSE = { sspec: 1, uspec: 1, dspec: 1, nspec: 1 };
  const djMossa = F => F && F.id === 'dj' && F.st === 'mossa' && MOSSE[F.mv];
  // [posa, stiramento x, schiacciamento y, rotazione gradi (avanti +), avanti in H] oppure null (resta l'atlante)
  function sequenza(F) {
    const mf = F.mf, on = F.r1;
    if (F.mv === 'sspec') {
      const L = on ? 16 : 12;
      // 21/10 notte (proprietario: «non bastano e sono troppo diverse, il disco e' troppo grosso»): 6 pose dallo stesso foglio AI,
      // stesso vinile piccolo: salta sul disco, atterra, (a tempo) carica di spalla, graffia il disco scivolando, frena, scende
      if (mf < 3) return ['s_salta', 1, 1, -3, 0];
      if (mf < 6) return ['s_atterra', mf < 4 ? 1.05 : 1, mf < 4 ? .93 : 1, 2, 0];
      if (mf < 5 + L) { const k = mf - 5; if (on && k < 7) return ['s_carica', 1.03, .97, 3, 0]; return ['s_graffia', 1.02 + .02 * ((k >> 1) & 1), .98, 3, 0]; }
      if (mf < 5 + L + 6) return ['s_frena', 1, 1, -3, 0];
      return ['s_scende', 1, 1, 0, 0];
    }
    if (F.mv === 'uspec') {
      if (mf < 6) return ['u_carica', 1.04, .94, 0, 0];
      if (mf < 16) return ['u_razzo', .96, 1.06, 0, 0];
      return ['u_volo', 1, 1, 0, 0];
    }
    if (F.mv === 'dspec') {
      if (F.r3) return ['d_arriva', mf < 8 ? 1.06 : 1, mf < 8 ? .92 : 1, 0, 0];
      if (mf < 18) return ['d_posa', 1, 1, 0, 0];
      return null;
    }
    if (F.mv === 'nspec') {
      if (mf < 8) return ['n_carica', 1, 1, -3, 0];
      if (mf < 20) return ['n_onda', mf < 11 ? 1.06 : 1, mf < 11 ? .95 : 1, 2, 0];
      return null;
    }
    return null;
  }
  const ST = new WeakMap();
  function st(F) { let s = ST.get(F); if (!s) { s = { scia: [], tele: -99, tx: 0, ty: 0 }; ST.set(F, s); } return s; }
  const TAU = Math.PI * 2;

  function init() {
    const G = root.GBR, L = root.GSLOOK; if (!G || !L || !root.GSE || !root.GSE.corpo || !root.GSE.proj) return setTimeout(init, 60);
    const corpo = root.GSE.corpo;
    root.GSE.corpo = function (F) { return djMossa(F) && pronto && sequenza(F) ? { r: 0, sx: 1, sy: 1, ox: 0, oy: 0, tr: 0 } : corpo.apply(this, arguments); };
    const load = G.load;
    if (load) G.load = async function (ids) { const r = await load.apply(this, arguments); if ((ids || []).includes('dj')) await ready; return r; };
    const prima = L.prima, dopo = L.dopo, draw = G.draw;
    L.prima = function (F) { corrente = F; return prima.apply(this, arguments); };
    L.dopo = function () { const r = dopo.apply(this, arguments); corrente = null; return r; };
    function altezzaIdle() {
      if (idleK) return idleK;
      if (!(window.GBR && GBR.pronto && GBR.pronto('dj'))) return 1.1;   // 21/10 sera: misurare la sagoma provvisoria (atlante non pronto) salvava una scala sbagliata per sempre
      const cv = document.createElement('canvas'); cv.width = cv.height = 300; const x = cv.getContext('2d');
      draw.call(G, x, 'dj', 150, 260, { pose: 'idle', t: 0, h: 100, facing: 1 });
      const d = x.getImageData(0, 0, 300, 300).data; let y0 = 300, y1 = -1;
      for (let y = 0; y < 300; y++) for (let X = 0; X < 300; X++) if (d[(y * 300 + X) * 4 + 3] > 40) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return (idleK = y1 > y0 ? (y1 - y0) / 100 : 1.1);
    }
    function posa(c, nm, gh, dir, sx, sy, rot, av, alpha) {
      const m = META[nm], im = IMG[nm]; if (!m || !im) return false;
      const k = gh * altezzaIdle() / m.guardia, iw = m.w * k, ih = m.h * k, pad = m.v >= 3 ? 4 * k : 0;
      c.save(); c.translate(dir * av * gh, 0); c.rotate(rot * dir * Math.PI / 180); c.scale(dir * sx, sy);
      if (alpha != null) c.globalAlpha *= alpha;
      c.drawImage(im, -iw * .5, -ih + pad, iw, ih); c.restore();
      return true;
    }
    G.draw = function (c, id, x, y, o) {
      const F = corrente;
      if (id !== 'dj' || !djMossa(F) || !pronto) return draw.apply(this, arguments);
      const q = sequenza(F); if (!q || !META[q[0]]) return draw.apply(this, arguments);
      const H = root.GS.D(F).H, gh = o.h || H / 1.1, dir = F.dir < 0 ? -1 : 1;
      const [nm, sx, sy, rot, av] = q;
      c.save(); c.translate(x, y);
      if (!posa(c, nm, gh, dir, sx, sy, rot, av, o.alpha)) { c.restore(); return draw.apply(this, arguments); }
      c.restore();
    };
    // il vinile della scivolata e' nella posa: il proiettile non si disegna (solo scintille e note)
    const proj0 = root.GSE.proj;
    root.GSE.proj = function (c, S, P) { if (P.fo === 'vinile') return true; return proj0.apply(this, arguments); };
    // effetti dietro: scia di note e onde durante la scivolata e il razzo, anelli del teletrasporto
    function nota(c, k, x, y, s, a, r) {
      const I = FX['nota_' + (k % 3)];
      c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(r);
      if (I) { const w = s, h = w * I.naturalHeight / I.naturalWidth; c.drawImage(I, -w / 2, -h / 2, w, h); }
      else { c.fillStyle = '#ff3fd2'; c.beginPath(); c.arc(0, s * .25, s * .22, 0, TAU); c.fill(); c.fillRect(s * .16, -s * .4, s * .08, s * .65); }
      c.restore();
    }
    // 21/10 notte (proprietario: «migliora gli effetti di tutte le abilita' di DJ basso»): effetti disegnati per ogni speciale.
    // A tempo: anello rosa e barre dell'equalizzatore che esplodono; scivolata: scia al neon sul pavimento e linee di velocita';
    // razzo: anelli di bassi e cono di luce sotto i piedi; onda: archi ))) davanti; cassa: tonfo; DROP: colonne di luce.
    const ROSA = '#ff2e93', VIOLA = '#b14dff';
    function anelloE(c, x, y, rx, ry, col, lw, a) { c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.ellipse(x, y, Math.max(1, rx), Math.max(1, ry), 0, 0, TAU); c.stroke(); c.restore(); }
    function effetti(c, S, F, H) {
      const d = F.dir < 0 ? -1 : 1, mf = F.mf, on = F.r1;
      c.save(); c.globalCompositeOperation = 'lighter';
      // battito preso a tempo (F.p3 = fotogramma dell'ultima speciale a tempo)
      const db = S.t - F.p3;
      if (F.p3 > 0 && db >= 0 && db < 16) {
        const v = db / 16;
        anelloE(c, F.x, F.y - H * .5, H * (.5 + 1.1 * v), H * (.5 + 1.1 * v), ROSA, H * .07 * (1 - v), 1 - v);
        for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + .3, r0 = H * (.55 + .9 * v), L = H * (.18 + .12 * (k % 2)) * (1 - v);
          c.globalAlpha = 1 - v; c.fillStyle = k % 2 ? VIOLA : ROSA;
          c.save(); c.translate(F.x + Math.cos(a) * r0, F.y - H * .5 + Math.sin(a) * r0); c.rotate(a + Math.PI / 2); c.fillRect(-H * .04, -L, H * .08, L); c.restore(); }
        c.globalAlpha = 1;
      }
      if (F.st === 'mossa' && F.mv === 'sspec' && mf >= 5) {
        const L = on ? 16 : 12, k = mf - 5;
        if (k < L) {
          const g = c.createLinearGradient(F.x, 0, F.x - d * H * 2.2, 0); g.addColorStop(0, on ? 'rgba(255,46,147,.9)' : 'rgba(255,46,147,.5)'); g.addColorStop(1, 'rgba(255,46,147,0)');
          c.fillStyle = g; c.fillRect(Math.min(F.x, F.x - d * H * 2.2), F.y - H * .05, H * 2.2, H * .08);
          c.strokeStyle = 'rgba(255,255,255,' + (on ? .7 : .4) + ')'; c.lineWidth = 2;
          for (let j = 0; j < 4; j++) { const y = F.y - H * (.35 + j * .22), x0 = F.x - d * H * (.5 + ((S.t * 7 + j * 13) % 9) / 18), x1 = x0 - d * H * (.5 + j * .15);
            c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }
        }
      }
      if (F.st === 'mossa' && F.mv === 'uspec' && mf >= 6 && mf < 22) {
        const k = mf - 6, v = k / 16;
        for (let j = 0; j < 3; j++) { const q = ((k + j * 5) % 15) / 15; anelloE(c, F.x, F.y + H * (.1 + q * 1.4), H * (.25 + .7 * q), H * (.08 + .22 * q), j % 2 ? VIOLA : ROSA, H * .05 * (1 - q), (1 - q) * (1 - v * .5)); }
        const g = c.createLinearGradient(0, F.y, 0, F.y + H * 1.6); g.addColorStop(0, 'rgba(255,46,147,' + (.55 * (1 - v)) + ')'); g.addColorStop(1, 'rgba(255,46,147,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(F.x - H * .2, F.y); c.lineTo(F.x + H * .2, F.y); c.lineTo(F.x + H * .7, F.y + H * 1.6); c.lineTo(F.x - H * .7, F.y + H * 1.6); c.fill();
      }
      if (F.st === 'mossa' && F.mv === 'nspec' && mf >= 7 && mf < 20) {
        const k = mf - 7;
        for (let j = 0; j < 3; j++) { const q = Math.min(1, Math.max(0, (k - j * 2) / 10)); if (q <= 0 || q >= 1) continue;
          const R = H * ((on ? .5 : .35) + q * (on ? 1.4 : .9)); c.globalAlpha = 1 - q; c.strokeStyle = j % 2 ? VIOLA : ROSA; c.lineWidth = H * (on ? .09 : .06) * (1 - q);
          c.beginPath(); c.arc(F.x, F.y - H * .5, R, d > 0 ? -.7 : Math.PI - .7, d > 0 ? .7 : Math.PI + .7); c.stroke(); }
        c.globalAlpha = 1;
      }
      if (F.st === 'mossa' && F.mv === 'dspec' && !F.r3 && mf >= 12 && mf < 24) {
        const v = (mf - 12) / 12; anelloE(c, F.x + d * H * .5, F.y, H * (.3 + .9 * v), H * (.07 + .18 * v), ROSA, H * .06 * (1 - v), 1 - v);
      }
      if (F.st === 'mossa' && F.mv === 'dj_drop' && mf >= 8 && mf < 36) {
        const v = (mf - 8) / 28;
        for (let j = 0; j < 7; j++) { const x = F.x + (j - 3) * H * .9 * (.4 + v), w = H * .22 * (1 - v), h = H * (3 + (j % 3)) * Math.min(1, v * 4);
          const g = c.createLinearGradient(0, F.y, 0, F.y - h); g.addColorStop(0, j % 2 ? 'rgba(177,77,255,.75)' : 'rgba(255,46,147,.8)'); g.addColorStop(1, 'rgba(255,46,147,0)');
          c.globalAlpha = 1 - v; c.fillStyle = g; c.fillRect(x - w / 2, F.y - h, w, h); }
        c.globalAlpha = 1;
      }
      c.restore();
    }
    function dietro(c, S) {
      for (let i = 0; i < S.n; i++) {
        const F = S.L[i]; if (!F || F.id !== 'dj') continue;
        const s = st(F), H = root.GS.D(F).H;
        try { effetti(c, S, F, H); } catch (e) { }
        if (F.st === 'mossa' && (F.mv === 'sspec' || F.mv === 'uspec') && F.mf >= 5) {
          if ((S.t & 1) === 0) s.scia.push({ x: F.x - F.dir * H * .3, y: F.y - (F.mv === 'sspec' ? H * .15 : H * .1), t: S.t, k: (S.t >> 1) % 3, on: F.r1 });
        }
        if (s.scia.length > 40) s.scia.splice(0, s.scia.length - 40);
        for (const p of s.scia) {
          const dt = S.t - p.t; if (dt < 0 || dt > 22) continue;
          const v = dt / 22;
          nota(c, p.k, p.x, p.y - H * (.3 + .5 * v), H * (p.on ? .32 : .24), (1 - v) * (p.on ? 1 : .6), Math.sin(p.t) * .4);
        }
        if (F.st === 'mossa' && F.mv === 'sspec' && F.mf >= 5 && F.mf < 5 + (F.r1 ? 16 : 12)) {   // scintille del vinile sul pavimento
          const I = FX.scintille, w = H * .9;
          if (I) { const h = w * I.naturalHeight / I.naturalWidth; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= .8; c.translate(F.x - F.dir * H * .45, F.y - h * .4); c.scale(-F.dir, 1); c.drawImage(I, -w / 2, -h / 2, w, h); c.restore(); }
        }
        if (F.st === 'mossa' && F.mv === 'dspec' && F.r3 && s.tele < 0) s.tele = S.t;
        if (!(F.st === 'mossa' && F.mv === 'dspec' && F.r3)) { if (s.tele > 0 && S.t - s.tele > 30) s.tele = -99; }
        if (s.tele > 0) {
          const v = (S.t - s.tele) / 24; if (v >= 0 && v < 1) {
            const I = FX.anello;
            for (let r = 0; r < 3; r++) { const vv = Math.min(1, v + r * .18), R = H * (.4 + 1.6 * vv);
              c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= (1 - vv) * .9; c.translate(F.x, F.y - H * .4); c.scale(1, .45);
              if (I) c.drawImage(I, -R, -R, R * 2, R * 2); else { c.strokeStyle = '#ff3fd2'; c.lineWidth = H * .06; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke(); }
              c.restore(); }
          }
        }
      }
    }
    (function agganciaDietro() {
      if (!root.GSFX || !root.GSFX.dietro) return setTimeout(agganciaDietro, 100);
      const d0 = root.GSFX.dietro;
      root.GSFX.dietro = function (c, S) { const r = d0.apply(this, arguments); try { dietro(c, S); } catch (e) { } return r; };
    })();
  }
  init();
})(window);
