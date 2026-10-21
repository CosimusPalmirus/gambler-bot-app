/* smash_look_1710/trio_va/arciere — ARCIERE con la grafica nuova 3D (19/10 sera): SOLO DISEGNO, nessuno stato del motore cambia.
   Lo sprite video non viene girato/stirato dai movimenti di corpo delle mosse (la capriola del Balzo e tiro, l'inclinazione della
   Pioggia di frecce e lo scatto del Tiro teso sono gia' nelle pose): cp.r/sx/sy/ox/oy azzerati per l'Arciere.
   Scie, carica e ancore: campione_fx.js (arciere in IDS). Va caricato dopo disegno.js. */
(function (root) {
  'use strict';
  const ID = 'arciere';
  const base = new URL('fx/', document.currentScript.src), immagini = {};
  const pronta = Promise.all(['freccia','freccia_veloce','scia','impatto0','impatto1','impatto2','impatto3'].map(nome => new Promise(ok => {
    const im = new Image(); immagini[nome] = im;
    im.onload = () => ok(true); im.onerror = () => ok(false); im.src = new URL(nome + '.webp', base).href;
  })));
  root.GSARCIEREFX = { pronta };
  const fermi = new WeakMap();
  function disegnaFreccia(c, S, P) {
    if (!['freccia','freccia_pioggia','freccia_oro','freccia_gig','gradino'].includes(P.fo)) return false;
    if (!S.L.some(F => F.p === P.own && F.id === ID)) return false;
    const gigante = P.fo === 'freccia_gig', pioggia = P.fo === 'freccia_pioggia' || P.fo === 'freccia_oro';
    const im = immagini[gigante ? 'freccia_veloce' : 'freccia'];
    if (!im.complete || !im.naturalWidth) return false;
    const ang = pioggia ? Math.PI / 2 : P.fo === 'gradino' ? 0 : gigante ? (P.vx < 0 ? Math.PI : 0) : -(P.a1 || 0) * Math.PI / 180;
    const lunghezza = gigante ? 78 : P.fo === 'gradino' ? 46 : 36;
    const altezza = lunghezza * im.naturalHeight / im.naturalWidth;
    c.save(); c.translate(P.x, P.y); c.rotate(ang);
    c.globalAlpha *= Math.min(1, (P.life || 20) / 12);
    if (!P.fermo && P.fo !== 'gradino') {
      const scia = immagini.scia;
      if (scia.complete && scia.naturalWidth) {
        c.save(); c.globalAlpha *= .55; c.globalCompositeOperation = 'lighter';
        c.drawImage(scia, -lunghezza * 1.65, -altezza * .32, lunghezza * 1.5, altezza * .64); c.restore();
      }
    }
    // Il punto fisico del proiettile resta sulla punta della freccia.
    c.drawImage(im, -lunghezza, -altezza / 2, lunghezza, altezza); c.restore();
    let q = fermi.get(P);
    if (!P.fermo) { if (q) fermi.delete(P); }
    else {
      if (!q || q.S !== S || P.t < q.pt) { q = { S, t: S.t, pt: P.t }; fermi.set(P, q); }
      q.pt = P.t;
      const eta = S.t - q.t;
      if (eta >= 0 && eta < 14) {
        const fx = immagini['impatto' + Math.min(3, Math.floor(eta / 3.5))];
        if (fx.complete && fx.naturalWidth) {
          const w = gigante ? 65 : 35, h = w * fx.naturalHeight / fx.naturalWidth;
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 1 - eta / 14;
          c.drawImage(fx, P.x - w / 2, P.y - h / 2, w, h); c.restore();
        }
      }
    }
    return true;
  }
  function aggancia() {
    if (!root.GSE || !root.GSE.corpo) return setTimeout(aggancia, 50);
    const corpo0 = root.GSE.corpo;
    const proj0 = root.GSE.proj;
    root.GSE.proj = function (c, S, P) {
      if (disegnaFreccia(c, S, P)) return true;
      return proj0.apply(this, arguments);
    };
    root.GSE.corpo = function (F, m) {
      const cp = corpo0.apply(this, arguments);
      if (!F || F.id !== ID) return cp;
      cp.sx = 1; cp.sy = 1; cp.r = 0; cp.ox = 0; cp.oy = 0; if (cp.tr) cp.tr = Math.min(cp.tr, .012);
      return cp;
    };
  }
  aggancia();
})(window);
