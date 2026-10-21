/* smash_look_1710/trio_va/pinna — PINNA (squalo) con la grafica nuova 3D: SOLO DISEGNO, nessuno stato del motore cambia.
   - lo sprite video non viene girato/stirato dai movimenti di corpo delle mosse (le pose sono gia' disegnate:
     Siluro orizzontale, Tromba marina a giri alternati, Panciata di pancia): cp.r/sx/sy/ox/oy azzerati per Pinna;
   - le scie, la carica e le ancore le fa campione_fx.js (pinna in IDS), come per gli altri lottatori video.
   - 19/10 sera (richiesta del proprietario): EFFETTI DELLE SPECIALI con sprite AI (fx/*.webp, fogli in trio_va/pinna/fx/) al posto
     delle gocce/onde blu disegnate a codice (effetti.js FX/MEC/PRJ e disegno.js) che coprivano il corpo. Regola: mai sopra il corpo.
       Morso del kaiju : fauci d'acqua DAVANTI al muso (aperte f6-11, a meta' f12-13, chiuse f14-18 col colpo, si sciolgono f19-24);
       Siluro          : scia d'acqua e bolle DIETRO il corpo, onda di prua piccola davanti al muso;
       Tromba marina   : colonna d'acqua che gira DIETRO e SOTTO lo squalo (due pose alternate ogni 3 fotogrammi);
       Panciata        : le due onde a terra sono l'onda AI; schizzo AI al punto di caduta per 10 fotogrammi.
     Le particelle a tema di queste mosse (MEC/PRJ) per Pinna sono ridotte a poche gocce. ?fx=vecchi o ?pinnafx=vecchi: come prima.
   Si aggancia concatenando GSE.corpo / GSE.proj / GSFX.dietro e avvolgendo GSE._int.FX/MEC/PRJ: gli altri lottatori restano come prima.
   Va caricato dopo disegno.js. */
(function (root) {
  'use strict';
  const ID = 'pinna';
  const NUOVI = !(root.location && /[?&](fx|pinnafx)=vecchi/.test(root.location.search));
  const BASE = root.GSPINNA_FX || '/smash_look_1710/trio_va/pinna/gioco/fx/';
  const IM = {};
  function im(n) { let o = IM[n]; if (!o) { o = IM[n] = new Image(); o.decoding = 'async'; o.src = BASE + n + '.webp'; } return o.complete && o.naturalWidth ? o : null; }
  if (NUOVI) ['fauci_0', 'fauci_1', 'fauci_2', 'fauci_3', 'scia', 'prua', 'bolle', 'tromba_0', 'tromba_1', 'schizzo_0', 'schizzo_1', 'onda'].forEach(im);
  // disegna l'immagine n larga w (o alta h se w<0), con il punto d'aggancio (ax, ay in 0..1) su (x, y); dir -1 la specchia
  function metti(c, n, x, y, w, h, ax, ay, dir, a) {
    const I = im(n); if (!I || a <= 0) return;
    if (!w) w = h * I.naturalWidth / I.naturalHeight; if (!h) h = w * I.naturalHeight / I.naturalWidth;
    c.save(); c.globalAlpha *= Math.min(1, a); c.translate(x, y); if (dir < 0) c.scale(-1, 1);
    c.drawImage(I, -w * ax, -h * ay, w, h); c.restore();
  }
  function aggancia() {
    if (!root.GSE || !root.GSE.corpo || !root.GSE._int || !root.GS) return setTimeout(aggancia, 50);
    const corpo0 = root.GSE.corpo;
    root.GSE.corpo = function (F, m) {
      const cp = corpo0.apply(this, arguments);
      if (!F || F.id !== ID) return cp;
      cp.sx = 1; cp.sy = 1; cp.r = 0; cp.ox = 0; cp.oy = 0; if (cp.tr) cp.tr = Math.min(cp.tr, .012);
      return cp;
    };
    if (!NUOVI) return;
    const I = root.GSE._int, FX = I.FX, MEC = I.MEC, PRJ = I.PRJ, Z = I.Z, emq = I.emq;
    // FX[k](c, o, S): il lottatore e' o.F; MEC[k](F, m, t, H, th): il lottatore e' il primo argomento
    const avv = (tab, k, f) => { const f0 = tab[k]; tab[k] = function (a, b) { const F = tab === FX ? (b && b.F) : a; return (F && F.id === ID) ? f.apply(this, arguments) : f0 && f0.apply(this, arguments); }; };
    // --- davanti (dopo i corpi): fauci del morso, onda di prua del siluro
    avv(FX, 'presa_scossa', (c, o) => {
      const t = o.t; if (t < 6 || t > 24) return;
      const n = t < 12 ? 'fauci_0' : t < 14 ? 'fauci_1' : t <= 18 ? 'fauci_2' : 'fauci_3';
      const a = t <= 18 ? 1 : 1 - (t - 18) / 7, k = t < 12 ? .85 + (t - 6) * .02 : 1;
      metti(c, n, o.x + o.dir * o.H * .78, o.y - o.H * .55, o.H * .72 * k, 0, .5, .5, o.dir, .92 * a);
    });
    avv(FX, 'siluro_guidato', (c, o) => { if (o.att) metti(c, 'prua', o.x + o.dir * o.H * .62, o.cy, 0, o.H * .55, .45, .5, -o.dir, .85); });
    avv(FX, 'tromba_marina', () => {});        // la colonna va DIETRO (GSFX.dietro)
    avv(FX, 'schianto', () => {});             // in caduta niente righe: lo schizzo AI arriva con le onde
    // --- particelle: poche gocce al posto della pioggia di prima
    avv(MEC, 'presa_scossa', (F, m, t, H) => { if (t === 14) for (let k = 0; k < 5; k++) emq(Z.goccia, F.x + F.dir * H * .95, F.y - H * .55, F.dir * (1 + Math.random() * 3), -2 - Math.random() * 3, .9); });
    avv(MEC, 'siluro_guidato', (F, m, t, H) => { if (t >= 4 && t % 4 === 0) emq(Z.bolla, F.x - F.dir * H * .9, F.y - H * .5 + (Math.random() - .5) * H * .3, -F.dir * 1.5, -.6, .8); });
    avv(MEC, 'tromba_marina', (F, m, t, H) => { if (t >= 4 && t <= 38 && t % 5 === 0) emq(Z.goccia, F.x + (Math.random() - .5) * H, F.y + H * .3, (Math.random() - .5) * 3, -2, .9); });
    avv(MEC, 'schianto', () => {});
    const prj0 = PRJ.onda_acqua;
    PRJ.onda_acqua = function (P, th) { if (P && P.fo === 'onda_acqua' && P.t % 6 === 0 && th === I.TM[ID]) emq(Z.goccia, P.x, P.y - P.r, (Math.random() - .5) * 2, -2.5, .8); else if (prj0 && th !== I.TM[ID]) prj0.apply(this, arguments); };
    // --- onde della panciata (proiettili): onda AI, schizzo AI nei primi fotogrammi
    const proj0 = root.GSE.proj;
    root.GSE.proj = function (c, S, P) {
      if (P && P.fo === 'onda_acqua' && S && S.L) {
        let F = null; for (let i = 0; i < S.n; i++) if (S.L[i].p === P.own) F = S.L[i]; if (!F) F = S.L[P.own];
        if (F && F.id === ID) {
          const d = P.vx >= 0 ? 1 : -1, H = root.GS.D(F).H, t = P.t, a = P.life < 8 ? P.life / 8 : 1;
          if (t < 12 && !P.dietro) metti(c, t < 6 ? 'schizzo_0' : 'schizzo_1', P.x - d * t * 8, P.y + 4, H * (1.1 + t * .03), 0, .5, 1, 1, .9 * (1 - t / 14));
          metti(c, 'onda', P.x, P.y + 4, H * .95, 0, .55, 1, d, .95 * a);
          return true;
        }
      }
      return proj0.apply(this, arguments);
    };
    // --- dietro (prima dei corpi): scia del siluro, colonna della tromba marina
    function dietro(c, S) {
      if (!S || !S.L) return;
      for (let i = 0; i < S.n; i++) {
        const F = S.L[i]; if (!F || F.id !== ID || F.st !== 'mossa') continue;
        const H = root.GS.D(F).H, t = F.mf;
        if (F.mv === 'sspec' && t >= 4 && t <= 36) {
          const a = t > 30 ? (36 - t) / 6 : Math.min(1, (t - 3) / 3);
          metti(c, 'scia', F.x - F.dir * H * .15, F.y - H * .5, H * 2.3, 0, 1, .5, F.dir, .85 * a);
          if (t % 8 < 4) metti(c, 'bolle', F.x - F.dir * H * 1.5, F.y - H * .55, H * .35, 0, .5, .5, 1, .7 * a);
        }
        if (F.mv === 'uspec' && t >= 4 && t <= 38) {
          const a = t > 32 ? (38 - t) / 6 : Math.min(1, (t - 3) / 3);
          metti(c, ((t / 3) | 0) % 2 ? 'tromba_1' : 'tromba_0', F.x, F.y + H * .95, 0, H * 1.75, .5, 1, 1, .8 * a);
        }
      }
    }
    (function dietroAgg() {
      if (!root.GSFX || !root.GSFX.dietro) return setTimeout(dietroAgg, 50);
      const d0 = root.GSFX.dietro;
      root.GSFX.dietro = function (c, S) { try { dietro(c, S); } catch (e) { } return d0.apply(this, arguments); };
    })();
  }
  aggancia();
})(window);
