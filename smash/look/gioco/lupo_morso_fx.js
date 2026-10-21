/* smash_look_1710 — LUPO: MORSO (dspec), 20/10 notte.
   Proprietario: «più veloce, senza vedere il lupo fermo in una posa» (motore già fatto: scosse ogni 5 f, mossa a vuoto 32 f)
   e «quando missa ha la coda mozzata». Qui solo il DISEGNO: pose AI intere (lupo_morso_2010/*.webp, grana dell'atlante),
   scelte dallo stato della mossa:
   - carica (mf < 3), scatto a fauci spalancate (mf 3..12) con la scia delle zanne;
   - presa (F.r1): due pose della scrollata alternate a ogni scossa (F.r2 conta i fotogrammi di presa, scossa ogni 5),
     lampo del morso all'aggancio, scintille viola a ogni scossa;
   - lancio (F.r1 tornato 0 con F.r2 > 0): torsione all'indietro con lo strappo, poi rientro;
   - a vuoto (F.r2 = 0 dopo il 12° f): fauci che schioccano nel vuoto, sbilanciato, poi rientro.
   21/10 (proprietario: «la speciale in giù del lupo fai un singolo morso con un bel effetto speciale, come per Pinna»):
   il morso in piedi ora è UN SOLO morso (motore: MORSO in lupo_mannaro.js, F.r2 = fotogramma del colpo). Pose: carica ->
   scatto -> m_chiude (fauci serrate, a segno) o m_mancato (a vuoto) -> rientro. Davanti al muso le FAUCI D'ENERGIA AI
   (lupo_morso_2010/fauci: aperte, a metà, chiuse col lampo, che si dissolvono, come le fauci d'acqua di Pinna) e sul
   colpito l'IMPRONTA dei denti con l'onda d'urto. Il morso A TERRA lo disegna lupo_terra_fx.js.
   SOLO DISEGNO: legge lo stato, non lo scrive. */
(function (root) {
  'use strict';
  const BASE = '/smash_look_1710/lupo_morso_2010/';
  const IMG = {}, META = {}; let pronto = false, corrente = null, idleK = 0;
  const ready = fetch(BASE + 'pose.json').then(r => { if (!r.ok) throw Error('pose morso'); return r.json(); }).then(async j => {
    Object.assign(META, j);
    await Promise.all(Object.keys(j).map(async k => { const im = new Image(); im.src = BASE + k + '.webp'; await im.decode(); IMG[k] = im; }));
    pronto = true;
  });
  ready.catch(e => console.warn('Lupo morso:', e));
  const FAU = {};   // fauci d'energia (fauci_0..3) e impronta, immagini intere su fondo trasparente
  ['fauci_0', 'fauci_1', 'fauci_2', 'fauci_3', 'impronta'].forEach(n => { const im = new Image(); im.onload = () => { FAU[n] = im; }; im.src = BASE + 'fauci/' + n + '.webp'; });
  function metti(c, n, x, y, w, dir, a, rot) {
    const I = FAU[n]; if (!I || a <= 0) return; const h = w * I.naturalHeight / I.naturalWidth;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= Math.min(1, a); c.translate(x, y); if (rot) c.rotate(rot); if (dir < 0) c.scale(-1, 1);
    c.drawImage(I, -w / 2, -h / 2, w, h); c.restore();
  }
  const TAU = Math.PI * 2;
  const morso = F => F && F.id === 'lupo' && F.st === 'mossa' && F.mv === 'dspec';
  // [posa, stiramento x, schiacciamento y, rotazione (gradi, avanti +), spostamento avanti in H]
  function sequenza(F) {
    const mf = F.mf;
    if (F.rT) return ['m_rientro', 1, 1, 0, 0];   // coda del morso a terra
    if (mf <= 5) return ['m_carica', .96 + .01 * mf, 1.04 - .01 * mf, 0, 0];
    if (F.r2) {   // a segno al fotogramma F.r2 (durante l'hitlag mf resta fermo li')
      if (mf < F.r2) return ['m_scatto', 1.1, .93, 3, 0];
      if (mf < F.r2 + 8) return ['m_chiude', mf < F.r2 + 2 ? 1.08 : 1, mf < F.r2 + 2 ? .94 : 1, mf < F.r2 + 3 ? 3 : 0, mf < F.r2 + 3 ? .03 : 0];
      return ['m_rientro', 1, 1, 0, 0];
    }
    if (mf <= 12) { const q = Math.min(1, (mf - 5) / 3); return ['m_scatto', 1 + .1 * q, 1 - .07 * q, 3 * q, 0]; }
    if (mf < 20) return ['m_mancato', mf < 15 ? 1.06 : 1, mf < 15 ? .95 : 1, mf < 15 ? 4 : 0, 0];
    return ['m_rientro', 1, 1, 0, 0];
  }
  const ST = new WeakMap();
  function st(F) { let s = ST.get(F); if (!s) { s = { mf: -1, r1: 0, r2: 0, k: 0, fx: [], scia: [], ghost: [], chiusa: -99, vuoto: -99 }; ST.set(F, s); } return s; }

  function init() {
    const G = root.GBR, L = root.GSLOOK; if (!G || !L || !root.GSE || !root.GSE.corpo) return setTimeout(init, 60);
    const corpo = root.GSE.corpo;
    root.GSE.corpo = function (F) { return morso(F) && pronto ? { r: 0, sx: 1, sy: 1, ox: 0, oy: 0, tr: 0 } : corpo.apply(this, arguments); };
    const load = G.load;
    if (load) G.load = async function (ids) { const r = await load.apply(this, arguments); if ((ids || []).includes('lupo')) await ready; return r; };
    const prima = L.prima, dopo = L.dopo, draw = G.draw;
    L.prima = function (F) { corrente = F; return prima.apply(this, arguments); };
    L.dopo = function () { const r = dopo.apply(this, arguments); corrente = null; return r; };
    function altezzaIdle() {   // idle disegnato con h = 100 (una volta)
      if (idleK) return idleK;
      if (!(window.GBR && GBR.pronto && GBR.pronto('lupo'))) return 1.11;   // 21/10 sera: misurare la sagoma provvisoria (atlante non pronto) salvava una scala sbagliata per sempre
      const cv = document.createElement('canvas'); cv.width = cv.height = 300; const x = cv.getContext('2d');
      draw.call(G, x, 'lupo', 150, 260, { pose: 'idle', t: 0, h: 100, facing: 1 });
      const d = x.getImageData(0, 0, 300, 300).data; let y0 = 300, y1 = -1;
      for (let y = 0; y < 300; y++) for (let X = 0; X < 300; X++) if (d[(y * 300 + X) * 4 + 3] > 40) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return (idleK = y1 > y0 ? (y1 - y0) / 100 : 1.11);
    }
    function posa(c, nm, gh, dir, sx, sy, rot, av, alpha) {
      const m = META[nm], im = IMG[nm]; if (!m || !im) return;
      const k = gh * altezzaIdle() / m.guardia, iw = m.w * k, ih = m.h * k, pad = m.v >= 3 ? 4 * k : 0;
      c.save(); c.translate(dir * av * gh, 0); c.rotate(rot * dir * Math.PI / 180); c.scale(dir * sx, sy);
      if (alpha != null) c.globalAlpha *= alpha;
      c.drawImage(im, -iw * .5, -ih + pad, iw, ih); c.restore();
    }
    G.draw = function (c, id, x, y, o) {
      const F = corrente;
      if (id !== 'lupo' || !morso(F) || !pronto) return draw.apply(this, arguments);
      const H = root.GS.D(F).H, gh = o.h || H / 1.1, dir = F.dir < 0 ? -1 : 1, al = o.alpha == null ? 1 : o.alpha;
      const [nm, sx, sy, rot, av] = sequenza(F);
      // disegni secondari (sagome, lampo d'impatto a tinta piena): solo la posa, niente stato
      if (al < .99 || o.tintA) { c.save(); c.translate(x, y); posa(c, nm, gh, dir, sx, sy, rot, av, al); c.restore(); return; }
      const s = st(F);
      if (F.mf < s.mf - 2 && !F.r1) { s.fx.length = 0; s.scia.length = 0; s.ghost.length = 0; }   // mossa nuova
      const nuovo = F.mf !== s.mf || F.r2 !== s.r2; s.k++;
      const bocca = (fa, su) => [F.x + dir * fa * H, F.y - su * H];
      // eventi visti dal disegno (confronto con lo stato del fotogramma prima)
      if (F.mf < s.mf - 2) { s.chiusa = -99; s.vuoto = -99; }
      if (!F.rT && F.r2 && !s.r2) {   // MORSO a segno: fauci serrate, impronta sul colpito, scossa
        const [bx, by] = bocca(.78, .6); s.chiusa = s.k; s.fx.push({ t: 0, x: bx + dir * H * .1, y: by, tipo: 'impronta', r: 1 });
        if (root.GSD && root.GSD.scossa) root.GSD.scossa(.45);
      }
      if (!F.rT && !F.r2 && F.mf === 13 && s.mf === 12) { const [bx, by] = bocca(.7, .55); s.vuoto = s.k; s.fx.push({ t: 0, x: bx, y: by, tipo: 'vuoto', r: .7 }); }
      // scia delle zanne nello scatto (coordinate del mondo)
      if (!F.r1 && !F.r2 && F.mf >= 3 && F.mf <= 12 && nuovo) { const [bx, by] = bocca(.62, .6); s.scia.push({ x: bx, y: by, t: s.k }); }
      while (s.scia.length && s.k - s.scia[0].t > 10) s.scia.shift();
      // sagome fantasma dello scatto
      c.save(); c.translate(x, y);
      const scatto = !F.r1 && !F.r2 && F.mf >= 3 && F.mf <= 12;
      if (scatto) for (let i = 0; i < s.ghost.length; i++) { const g = s.ghost[i]; c.save(); c.translate(g.x - F.x, 0); c.globalCompositeOperation = 'lighter'; posa(c, 'm_scatto', gh, dir, g.sx, g.sy, 0, 0, al * (.1 + .06 * i)); c.restore(); }
      if (scatto && nuovo) { s.ghost.push({ x: F.x, sx, sy }); if (s.ghost.length > 3) s.ghost.shift(); }
      if (!scatto) s.ghost.length = 0;
      posa(c, nm, gh, dir, sx, sy, rot, av, al);
      c.restore();
      s.mf = F.mf; s.r1 = F.r1; s.r2 = F.r2;
      c.save(); c.translate(x - F.x, y - F.y);   // coordinate del mondo
      zanne(c, s, H, dir);
      if (!F.rT) fauci(c, F, s, H, dir);
      effetti(c, s, H);
      c.restore();
    };
    // scia delle zanne: due mezzelune (mascella sopra e sotto) che si stringono verso la bocca
    function zanne(c, s, H, dir) {
      const S = s.scia; if (S.length < 2) return;
      const u = S[S.length - 1], vita = Math.max(0, 1 - (s.k - u.t) / 8); if (vita <= 0) return;
      const p0 = S[0];
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const lato of [-1, 1]) {
        const g = c.createLinearGradient(p0.x, p0.y, u.x, u.y);
        g.addColorStop(0, 'rgba(160,110,255,0)'); g.addColorStop(1, 'rgba(235,220,255,' + (.85 * vita) + ')');
        c.strokeStyle = g; c.lineWidth = H * .05 * vita;
        c.beginPath(); c.moveTo(p0.x, p0.y + lato * H * .14);
        c.quadraticCurveTo((p0.x + u.x) / 2, u.y + lato * H * .2, u.x + dir * H * .08, u.y + lato * H * .03); c.stroke();
      }
      c.restore();
    }
    // le FAUCI D'ENERGIA davanti al muso: si spalancano nello scatto, si serrano col lampo sul colpo (o a vuoto senza
    // lampo) e si dissolvono. Tempi: mf dello scatto; dopo la chiusura, fotogrammi di disegno (s.k) dalla chiusura.
    function fauci(c, F, s, H, dir) {
      const mf = F.mf, x = F.x + dir * H * .82, y = F.y - H * .62, w = H * .95;
      const dc = s.k - s.chiusa, dv = s.k - s.vuoto;
      if (dc >= 0 && dc < 16) { if (dc < 6) metti(c, 'fauci_2', x + dir * H * .05, y, w * (1.08 - .01 * dc), dir, 1); else metti(c, 'fauci_3', x + dir * H * .05 * (1 + (dc - 6) * .2), y - H * .02 * (dc - 6), w, dir, 1 - (dc - 6) / 10); return; }
      if (dv >= 0 && dv < 12) { if (dv < 3) metti(c, 'fauci_1', x, y, w * .95, dir, .9); else metti(c, 'fauci_3', x + dir * H * .04 * (dv - 3), y, w * .9, dir, .8 * (1 - (dv - 3) / 9)); return; }
      if (F.r2 || mf < 6 || mf > 12) return;
      const q = Math.min(1, (mf - 5) / 3);
      metti(c, mf >= 11 ? 'fauci_1' : 'fauci_0', x - dir * H * .1 * (1 - q), y, w * (.75 + .25 * q), dir, .35 + .6 * q);
    }
    function effetti(c, s, H) {
      for (let i = s.fx.length - 1; i >= 0; i--) {
        const f = s.fx[i]; f.t++;
        if (f.tipo === 'impronta') {   // impronta dei denti con l'onda d'urto (arte AI), sul colpito
          const dI = 16; if (f.t > dI) { s.fx.splice(i, 1); continue; }
          const u = f.t / dI; metti(c, 'impronta', f.x, f.y, H * (.7 + .8 * Math.sqrt(u)), 1, f.t < 5 ? 1 : 1 - (f.t - 5) / 11);
          continue;
        }
        const dur = f.tipo === 'scossa' ? 10 : f.tipo === 'vuoto' ? 9 : 16;
        if (f.t > dur) { s.fx.splice(i, 1); continue; }
        const u = f.t / dur, R = H * (.18 + .55 * u) * f.r;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - u;
        if (f.tipo === 'morso' || f.tipo === 'strappo') {   // stella a punte viola-bianca e anello
          c.fillStyle = '#efe2ff'; c.beginPath();
          for (let k = 0; k < 14; k++) { const a = k * TAU / 14 + f.r, r = k % 2 ? R * .3 : R * (1.1 - .25 * u); c.lineTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); }
          c.closePath(); c.fill();
          c.strokeStyle = 'rgba(180,120,255,' + (1 - u) + ')'; c.lineWidth = H * .05 * (1 - u);
          c.beginPath(); c.arc(f.x, f.y, R * 1.3, 0, TAU); c.stroke();
          if (f.tipo === 'morso') {   // impronta delle zanne: due file di denti che si chiudono
            c.fillStyle = 'rgba(255,255,255,' + (1 - u) + ')';
            for (let k = -2; k <= 2; k++) for (const v of [-1, 1]) { const tx = f.x + k * H * .05, ty = f.y + v * H * (.11 - .05 * Math.min(1, f.t / 4)); c.beginPath(); c.moveTo(tx - H * .02, ty); c.lineTo(tx + H * .02, ty); c.lineTo(tx, ty - v * H * .06); c.closePath(); c.fill(); }
          }
        }
        if (f.tipo === 'scossa' || f.tipo === 'strappo') {   // scintille viola che schizzano dalla parte della scossa
          c.fillStyle = 'rgba(200,150,255,' + (1 - u) + ')';
          for (let k = 0; k < 9; k++) { const a = (f.d || 1) * (-.9 + k * .22) + (f.tipo === 'strappo' ? Math.PI : 0) * (f.d < 0 ? 1 : 0), r = H * (.15 + .7 * u) * (.6 + (k % 3) * .25); c.beginPath(); c.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r - H * .2 * u * u, H * .025 * (1 - u), 0, TAU); c.fill(); }
          c.strokeStyle = 'rgba(235,220,255,' + (.8 * (1 - u)) + ')'; c.lineWidth = H * .02;
          for (let k = 0; k < 3; k++) { const a = (f.d || 1) * (-.5 + k * .5); c.beginPath(); c.moveTo(f.x + Math.cos(a) * R * .4, f.y + Math.sin(a) * R * .4); c.lineTo(f.x + Math.cos(a) * R * 1.1, f.y + Math.sin(a) * R * 1.1); c.stroke(); }
        }
        if (f.tipo === 'vuoto') {   // schiocco nel vuoto: due archi che si chiudono e una sbuffata
          c.strokeStyle = 'rgba(220,200,255,' + (.8 * (1 - u)) + ')'; c.lineWidth = H * .03;
          const ap = H * .16 * (1 - u);
          c.beginPath(); c.arc(f.x, f.y - ap, H * .12, .2 * Math.PI, .8 * Math.PI); c.stroke();
          c.beginPath(); c.arc(f.x, f.y + ap, H * .12, 1.2 * Math.PI, 1.8 * Math.PI); c.stroke();
        }
        c.restore();
      }
    }
    root.GSLUPOMORSO = { pronta: () => ready, stato: F => ST.get(F) };
  }
  init();
})(window);
