/* smash_look_1710/trio_va/pinna — PINNA (squalo) con la grafica nuova 3D: SOLO DISEGNO, nessuno stato del motore cambia.
   - lo sprite video non viene girato/stirato dai movimenti di corpo delle mosse (le pose sono gia' disegnate:
     Siluro orizzontale, Tromba marina a giri alternati, Panciata di pancia): cp.r/sx/sy/ox/oy azzerati per Pinna;
   - le scie, la carica e le ancore le fa campione_fx.js (pinna in IDS), come per gli altri lottatori video.
   Si aggancia concatenando GSE.corpo: gli altri lottatori restano come prima. Va caricato dopo disegno.js. */
(function (root) {
  'use strict';
  const ID = 'pinna';
  function aggancia() {
    if (!root.GSE || !root.GSE.corpo) return setTimeout(aggancia, 50);
    const corpo0 = root.GSE.corpo;
    root.GSE.corpo = function (F, m) {
      const cp = corpo0.apply(this, arguments);
      if (!F || F.id !== ID) return cp;
      cp.sx = 1; cp.sy = 1; cp.r = 0; cp.ox = 0; cp.oy = 0; if (cp.tr) cp.tr = Math.min(cp.tr, .012);
      return cp;
    };
  }
  aggancia();
})(window);
