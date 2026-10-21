/* smash_look_1710/trio_va/cucu — effetti AI del CUCÙ (20/10, richiesta del proprietario):
   - neutra (Uovo): l'uovo d'oro vola, si posa e si schiude in 5 fasi (intero, crepa, crepe che brillano, il guscio salta e
     il pulcino esce a ali aperte, il pulcino nel guscio), poi il pulcino cammina e becca (fotogrammi AI pulcino0..3);
   - laterale (Scatto a molla): la casetta del cucù si apre dove parte, la MOLLA d'ottone si allunga fino alla sua schiena
     e la riporta indietro; allo scatto una stella «boing» e la scritta CUCÙ!;
   - su (Svolazzo): a ogni battito un ventaglio di piume AI ai lati.
   SOLO DISEGNO: legge proiettili e mosse, non scrive nulla nella simulazione. Si carica dopo effetti_nuovi.js. */
(function (root) {
  'use strict';
  root.GSCUCU2010 = 1;   // duo_fx_2010.js (Codex) lascia a questo file uovo, pulcino, molla, ali e i suoni del Cucu'
  const BASE = '/smash_look_1710/trio_va/cucu/gioco/fx/';
  const NOMI = ['uovo', 'schiusa0', 'schiusa1', 'schiusa2', 'schiusa3', 'schiusa4', 'pulcino0', 'pulcino1', 'pulcino2', 'pulcino3', 'molla', 'casetta', 'boing', 'ali'];
  const IM = {};
  for (const n of NOMI) { const i = new Image(); i.decoding = 'async'; i.src = BASE + n + '.webp'; IM[n] = i; }
  const ok = n => IM[n] && IM[n].complete && IM[n].naturalWidth;
  // disegna l'immagine con la base (piedi) in x,y, alta h, girata se dir < 0
  function base(c, n, x, y, h, dir, rot, alpha) {
    if (!ok(n)) return false;
    const i = IM[n], w = i.naturalWidth * h / i.naturalHeight;
    c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(dir < 0 ? -1 : 1, 1);
    if (alpha != null) c.globalAlpha *= alpha;
    c.drawImage(i, -w / 2, -h, w, h); c.restore(); return true;
  }
  const NASCITA = new WeakMap();   // pulcino -> fotogramma (S.t) in cui e' nato, per la sequenza della schiusa

  function aggancia() {
    const G = root.GSE, I = G && G._int;
    if (!G || !I || !I.FX || !G.proj || !I.FX.molla_cucu) return setTimeout(aggancia, 60);
    const proj0 = G.proj;
    G.proj = function (c, S, P) {
      if (P.fo === 'uovo' || P.fo === 'pulcino') {
        const F = S.L.find(q => q.p === P.own);
        if (F && F.id === 'cucu') {
          const r = P.r, dir = P.dir || (P.vx < 0 ? -1 : 1);
          if (P.fo === 'uovo') {
            NASCITA.delete(P);
            if (P.a1 === 3 && ok('schiusa0')) {   // 21/10 combo: calciato dalla molla. Gira su se stesso, scia d'oro e linee di velocita'
              const i = IM.schiusa0, h = r * 2.6, w = i.naturalWidth * h / i.naturalHeight, d = P.vx < 0 ? -1 : 1, k = P.t - P.a2;
              c.save(); c.globalCompositeOperation = 'lighter';
              for (let g = 4; g >= 1; g--) { c.globalAlpha = .13 * (5 - g); c.fillStyle = '#ffd23b'; c.beginPath(); c.ellipse(P.x - d * g * r * 1.3, P.y - P.vy * g * .6, r * (1.15 - g * .12), r * (.9 - g * .1), 0, 0, Math.PI * 2); c.fill(); }
              c.globalAlpha = .8; c.strokeStyle = '#fff6cc'; c.lineWidth = 2.5; c.lineCap = 'round';
              for (let s = 0; s < 4; s++) { const y = P.y + (s - 1.5) * r * .55, x0 = P.x - d * r * (1.6 + (s % 2) * .6 + ((k + s * 2) % 5) * .15); c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 - d * r * (2.4 + (s % 3) * .7), y); c.stroke(); }
              c.restore();
              c.save(); c.translate(P.x, P.y); c.rotate(d * k * .55); c.drawImage(i, -w / 2, -h / 2, w, h); c.restore();
              if (k < 5) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k / 5; c.strokeStyle = '#ffd23b'; c.lineWidth = 4; c.beginPath(); c.arc(P.x - d * r, P.y, r * (1.5 + k * .9), 0, Math.PI * 2); c.stroke(); c.restore(); }   // l'anello del colpo di molla
              return true;
            }
            if (P.a1 === 0) {   // in volo: l'uovo d'oro con la sua scia, girato nel verso del volo
              if (ok('uovo')) { const i = IM.uovo, h = r * 3, w = i.naturalWidth * h / i.naturalHeight; c.save(); c.translate(P.x, P.y); c.rotate(Math.atan2(P.vy, P.vx)); c.drawImage(i, -w * .72, -h / 2, w, h); c.restore(); return true; }
            } else {            // posato: 0-90 f fino alla schiusa
              const q = Math.min(1, (P.t - P.a2) / 90);
              const n = q < .45 ? 'schiusa0' : q < .75 ? 'schiusa1' : 'schiusa2';
              const tr = q < .45 ? 0 : Math.sin(P.t * (q < .75 ? .6 : 1.3)) * (q < .75 ? .1 : .18);
              if (base(c, n, P.x, P.y, r * 3.4, 1, tr)) return true;
            }
          } else {
            let t0 = NASCITA.get(P); if (t0 == null || t0 > S.t) { t0 = S.t; NASCITA.set(P, t0); }
            const k = S.t - t0;
            if (k < 10) { const s = 1 + .25 * Math.sin(k / 10 * Math.PI); if (base(c, 'schiusa3', P.x, P.y, r * 5 * s, dir)) return true; }
            else if (k < 22) { if (base(c, 'schiusa4', P.x, P.y, r * 3.8, dir)) return true; }
            else {
              const becca = P.t % 20 < 5;
              const n = becca ? 'pulcino3' : 'pulcino' + ((P.t >> 2) % 3), salto = becca ? 0 : Math.abs(Math.sin(P.t * .5)) * r * .15;
              if (base(c, n, P.x, P.y - salto, r * 3, dir)) return true;
            }
          }
        }
      }
      return proj0.apply(this, arguments);
    };

    const molla0 = I.FX.molla_cucu;
    I.FX.molla_cucu = function (c, o) {
      const F = o.F;
      if (!F || F.id !== 'cucu' || !ok('molla') || !ok('casetta')) return molla0.apply(this, arguments);
      if (o.t < 2 || o.t > 34) return;
      const H = o.H, d = o.dir, x0 = F.r1, piedi = o.y;
      const fuori = o.t < 6 ? (o.t - 2) / 4 : o.t > 30 ? (34 - o.t) / 4 : 1;   // la casetta compare e sparisce
      // casetta dietro, alla partenza
      base(c, 'casetta', x0 - d * H * .1, piedi, H * .62 * (.7 + .3 * fuori), d, 0, fuori);
      // molla dalla porta della casetta alla schiena del Cucù (si allunga e si accorcia col corpo)
      const xa = x0 - d * H * .02, xb = o.x - d * H * .22, y = piedi - H * .38, L = (xb - xa) * d;
      if (L > H * .08) {
        const i = IM.molla, h = H * .2 * (1 + .25 * Math.max(0, 1 - L / (H * 2)));
        c.save(); c.translate(xa, y); c.scale(d, 1); c.globalAlpha *= Math.min(1, fuori * 1.5);
        c.drawImage(i, 0, -h / 2, L, h); c.restore();
      }
      // scatto: stella «boing» e CUCÙ!
      if (o.t >= 13 && o.t <= 20) {
        const u = (o.t - 13) / 7, s = u < .3 ? u / .3 * 1.15 : 1.15 - (u - .3) * .4;
        base(c, 'boing', o.x + d * H * .45, o.y - H * .25, H * .7 * s, d, 0, 1 - Math.max(0, u - .6) / .4);
        // la scritta CUCÙ! la fa gia' l'evento 'cucu' (effetti_nuovi.js): qui niente doppione
      }
    };

    const ali0 = I.FX.battiti_ali;
    I.FX.battiti_ali = function (c, o) {
      const F = o.F;
      if (!F || F.id !== 'cucu' || !ok('ali')) return ali0.apply(this, arguments);
      const k = o.t % 12;
      if (k >= 1 && k <= 7) {
        const u = (k - 1) / 6, H = o.H;
        for (const s of [-1, 1]) base(c, 'ali', o.x + s * H * (.35 + .25 * u), o.y - H * .25 + u * H * .15, H * .55, s, s * .3, 1 - u);
      }
    };
  }
  aggancia();
})(window);
