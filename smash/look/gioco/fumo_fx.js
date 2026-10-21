/* GAMBLER SMASH — FUMO E POLVERE A SPRITE (20/10, proprietario: «migliora tutti gli effetti di fumo per farli belli
   invece che delle palle»). Arte AI in smash_look_1710/fumo_2010 (atlante.py): 7 sbuffi cartoon, la nuvola
   d'atterraggio in 6 fasi, 4 scie di scatto; grigi su trasparente, tinti qui per colore (fumo, polvere, farina...).
   SOLO DISEGNO: chi lo chiama (disegno.js, effetti.js, *_fx.js) gli passa posizioni e tempi; nessuno stato del motore.
   Senza atlante (non ancora caricato) GSFUMO.pronto e' false e i chiamanti disegnano come prima.
   API: sbuffo(c, x, y, r, col, seme, vita)  vita 1 -> 0 · nuvola(x, y, w, col) e scia(x, y, dir, w, col) nel pool
   proprio, disegnate da disegna(c) · cuoci48(x2d, col, a, seme) per gli sprite precotti di effetti.js. */
(function (root) {
  'use strict';
  const BASE = '/smash_look_1710/fumo_2010/';
  const FU = { pronto: false };
  let J = null, IM = null;
  const TINTE = new Map();   // colore -> atlante tinto (pochi colori: fumo, polvere, farina, sabbia, nebbie)
  fetch(BASE + 'fumo.json').then(r => r.json()).then(j => {
    J = j; IM = new Image(); IM.onload = () => { FU.pronto = true; }; IM.src = BASE + 'fumo.webp';
  }).catch(() => { });
  function tinto(col) {
    let t = TINTE.get(col); if (t) return t;
    t = document.createElement('canvas'); t.width = IM.naturalWidth; t.height = IM.naturalHeight;
    const x = t.getContext('2d'); x.drawImage(IM, 0, 0);
    // il colore copre il grigio ma lascia l'ombreggiatura (le parti in ombra restano piu' scure)
    x.globalCompositeOperation = 'multiply'; x.fillStyle = col; x.fillRect(0, 0, t.width, t.height);
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = .35; x.fillRect(0, 0, t.width, t.height);
    x.globalCompositeOperation = 'destination-in'; x.globalAlpha = 1; x.drawImage(IM, 0, 0);
    if (TINTE.size > 24) TINTE.clear();
    TINTE.set(col, t); return t;
  }
  // uno sbuffo: variante e rotazione dal seme, cresce e sale piano mentre svanisce (l'alpha la mette il chiamante)
  FU.sbuffo = function (c, x, y, r, col, seme, vita) {
    const s = J.s[seme % J.s.length], T = tinto(col);
    const k = r * 2.3 / Math.max(s[2], s[3]), w = s[2] * k, h = s[3] * k;
    const rot = (((seme * 37) % 100) / 100 - .5) * .7 + (1 - vita) * .25 * (seme & 1 ? 1 : -1), fl = seme & 2 ? -1 : 1;
    c.translate(x, y); c.rotate(rot); c.scale(fl, 1);
    c.drawImage(T, s[0], s[1], s[2], s[3], -w / 2, -h / 2, w, h);
    c.scale(fl, 1); c.rotate(-rot); c.translate(-x, -y);
  };
  // sprite precotto 48 px per effetti.js (sbuffi a tema: fumo, farina, sabbia, gesso, nebbie)
  FU.cuoci48 = function (x, col, a, seme) {
    const s = J.s[(seme || 0) % J.s.length], T = tinto(col), k = 46 / Math.max(s[2], s[3]);
    x.globalAlpha = a; x.drawImage(T, s[0], s[1], s[2], s[3], 24 - s[2] * k / 2, 24 - s[3] * k / 2, s[2] * k, s[3] * k); x.globalAlpha = 1;
  };
  // pool proprio: nuvole d'atterraggio (6 fasi) e scie di scatto. Tempo = fotogrammi di disegno.
  const N = 24, P = []; for (let i = 0; i < N; i++) P.push({ t: 99, T: 1, x: 0, y: 0, w: 0, col: '', tipo: 0, dir: 1, v: 0 });
  let nx = 0;
  function nuovo(tipo, x, y, w, col, dir, T) { const p = P[nx]; nx = (nx + 1) % N; p.t = 0; p.T = T; p.tipo = tipo; p.x = x; p.y = y; p.w = w; p.col = col; p.dir = dir || 1; p.v = (Math.random() * 4) | 0; }
  FU.nuvola = function (x, y, w, col) { if (FU.pronto) nuovo(0, x, y, w, col || '#d8cbb0', 1, 24); };
  FU.scia = function (x, y, dir, w, col) { if (FU.pronto) nuovo(1, x, y, w, col || '#d8cbb0', dir, 18); };
  FU.disegna = function (c) {
    if (!FU.pronto) return;
    const a0 = c.globalAlpha;
    for (let i = 0; i < N; i++) {
      const p = P[i]; if (p.t >= p.T) continue; p.t++;
      const u = p.t / p.T, T = tinto(p.col);
      if (p.tipo === 0) {   // nuvola: le 6 fasi in sequenza, appoggiata a terra (y = suolo)
        const f = J.n[Math.min(J.n.length - 1, Math.floor(u * J.n.length))], k = p.w / 256;
        c.globalAlpha = a0 * (u < .6 ? .8 : .8 * (1 - (u - .6) / .4));
        c.drawImage(T, f[0], f[1], f[2], f[3], p.x - f[2] * k / 2, p.y - f[3] * k + 4, f[2] * k, f[3] * k);
      } else {   // scia: dietro allo scatto, si allunga e svanisce
        const f = J.c[p.v % J.c.length], k = p.w / 384 * (.7 + u * .5), w = f[2] * k, h = f[3] * k;
        c.globalAlpha = a0 * .9 * (1 - u);
        c.translate(p.x, p.y); c.scale(p.dir, 1);   // la parte grossa della scia (destra nel foglio) resta attaccata a chi scatta
        c.drawImage(T, f[0], f[1], f[2], f[3], -w * .92, -h + 4, w, h);
        c.scale(p.dir, 1); c.translate(-p.x, -p.y);
      }
    }
    c.globalAlpha = a0;
  };
  root.GSFUMO = FU;
})(window);
