/* smash_look_1710 — effetti del CAMPIONE agganciati alle ANCORE misurate sugli sprite video (atlante: pose[k].ancore,
   per fotogramma, [guantone che colpisce, l'altro] rispetto ai piedi). SOLO DISEGNO: nessuno stato del motore cambia.
   Regola del proprietario: gli effetti sono un contorno secondario, mai sul corpo intero.
   - scia luminosa SOTTILE sul percorso vero del guantone (arco nel gancio, dritta nel diretto), coda che sfuma in fretta;
   - carica: nucleo piccolo bianco-giallo sul guantone che carica, 2 anelli che si stringono, scintille risucchiate,
     lampo breve a carica piena; niente tinta lampeggiante su tutto il corpo;
   - Bomba (nspec) e Gancio KO (gko): stessi elementi, al posto degli effetti a tutto corpo di effetti.js.
   Ganci: disegno.js (copia in questa cartella) chiama GSLOOK.prima/dopo attorno al GBR.draw del lottatore e GSLOOK.scia. */
(function (root) {
  'use strict';
  // 18/10: vale per tutti i lottatori video con ancore nell'atlante (IDS): Campione, Lupo (+ altri quando arrivano)
  const ID = 'boxer', IDS = { boxer: 1, lupo: 1, croupier: 1, bot: 1, don: 1, buttafuori: 1, veggente: 1, sumo: 1 }, TAU = Math.PI * 2;
  const JJ = {}; let tv = 0;
  for (const id in IDS) fetch((root.GBR3D_BASE || '') + id + '.json').then(r => r.json()).then(j => { if (j && j.pose && Object.values(j.pose).some(p => p.ancore)) JJ[id] = j; }).catch(() => {});
  const ST = new WeakMap();     // per lottatore: ancore correnti (px del dispositivo) + storia del guantone
  function st(F) { let s = ST.get(F); if (!s) { s = { g: null, h: [], vis: -1 }; ST.set(F, s); } return s; }

  function fotogramma(P, t) {
    const F = P.f, T = P.durata; t = t || 0;
    if (P.loop) { t = t % T; if (t < 0) t += T; } else if (t > T) t = T;
    let i = 0; while (i + 1 < F.length && F[i + 1][1] <= t + 1e-6) i++;
    return i;
  }
  function verso(facing, aim) { let f = facing < 0 ? -1 : 1; if (aim != null && Math.cos(aim) * f < -0.12) f = -f; return f; }

  const L = root.GSLOOK = {
    prima(F) { if (JJ[F.id]) tv++; },
    // dopo il disegno del corpo (ctx ancora con la trasformazione del corpo): le ancore in px del dispositivo
    dopo(c, F, d, V, pose, t, gh, aim) {
      const J = JJ[F.id]; if (!J) return;
      let nm = pose; for (let q = 0; q < 4 && J.pose[nm] && J.pose[nm].come; q++) nm = J.pose[nm].come;
      const P = J.pose[nm]; const s = st(F); s.posa = nm;
      if (!P || !P.ancore) { s.g = null; return; }
      const i = fotogramma(P, t), A = P.ancore[i]; if (!A || !A.length) { s.g = null; return; }
      const k = (gh || 96) / J.h_rif, f = verso(F.dir, aim), M = c.getTransform();
      s.g = A.map(([ax, ay]) => { const x = f * ax * k, y = ay * k; return [M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f]; });
      s.r = (gh || 96) * Math.sqrt(Math.abs(M.a * M.d - M.b * M.c));   // ~ altezza del personaggio in px dispositivo
      s.vis = tv; s.i = i; s.o = [M.e, M.f];   // il punto del motore (piedi/pivot) in px del dispositivo
      const LG = root.GSLOOK || L;   // 19/10: gli altri *_fx.js avvolgono GSLOOK in una copia: il banco imposta controllo/esiti su quella
      if (LG.controllo && F.st === 'mossa') {        // banco: il guantone disegnato e' davvero sotto l'ancora? (rosso nei 9x9 px)
        const p = s.g[0], x0 = Math.round(p[0]) - 4, y0 = Math.round(p[1]) - 4;
        let ok = 0; if (V && V.flash > 1) ok = -2; else if (p[0] < 4 || p[1] < 4 || p[0] > c.canvas.width - 5 || p[1] > c.canvas.height - 5) ok = -2; else try { const D = c.getImageData(x0, y0, 9, 9).data; const lu = F.id === 'lupo', cr = F.id === 'croupier', bo = F.id === 'bot', dn = F.id === 'don', bf = F.id === 'buttafuori', vg = F.id === 'veggente', su = F.id === 'sumo'; for (let q = 0; q < D.length; q += 4) if (su ? (D[q + 3] > 200 && D[q] > 150 && D[q] - D[q + 2] > 70) : vg ? (D[q + 3] > 200 && ((D[q] > 140 && D[q + 1] > 140 && D[q + 2] > 140) || (D[q] > 90 && D[q] > D[q + 1] && D[q + 1] >= D[q + 2] && D[q] - D[q + 2] > 30))) : bf ? (D[q + 3] > 200 && D[q] > 70 && D[q] > D[q + 1] && D[q + 1] >= D[q + 2] && D[q] - D[q + 2] > 25) : dn ? (D[q + 3] > 200 && D[q] > 90 && D[q] > D[q + 2]) : bo ? (D[q + 3] > 200 && D[q] > 80 && Math.abs(D[q] - D[q + 2]) < 45 && Math.abs(D[q] - D[q + 1]) < 45) : cr ? ((D[q] > 110 && D[q + 1] > 60 && D[q + 1] < 160 && D[q + 2] < 100 && D[q] > D[q + 2] * 1.5) || (D[q] > 150 && D[q + 1] > 120 && D[q + 2] > 90 && D[q] >= D[q + 1] && D[q + 1] >= D[q + 2] - 4 && D[q + 3] > 200)) : lu ? ((D[q + 2] > 120 && D[q + 2] > D[q + 1] * 1.05 && D[q] > 80) || (D[q] > 190 && D[q + 1] > 180 && D[q + 2] > 170)) : (D[q] > 105 && D[q + 1] < 80 && D[q + 2] < 80 && D[q] > 2 * D[q + 1])) ok++; } catch (e) { ok = -1; }
        (LG.esiti = LG.esiti || []).push([F.id + ':' + nm, i, ok, F.mv, Math.round(p[0]), Math.round(p[1]), c.canvas.width, c.canvas.height]);
      }
      // storia del guantone per la scia: solo vicino ai fotogrammi attivi del colpo, si azzera se cambia posa o se
      // l'ancora salta (l'altro guantone diventa quello che colpisce)
      const m = F.st === 'mossa' ? root.GS.mossaDi(d, F.mv) : null;
      let att = false;
      if (m && m.hb) for (const h of m.hb) if (!h.presa && F.mf >= h.f0 - 3 && F.mf <= h.f1 + 1) { att = true; break; }
      if (m && m.mant && F.mf >= m.mant.f0 && F.mf <= m.mant.f1) att = true;
      if (m && F.mv === 'nspec' && F.r2) att = F.mf - F.r2 <= (F.r3 || 8) + 2;
      const u = s.h[s.h.length - 1];
      // continuita': si segue lo stesso guantone (il piu' vicino all'ultimo punto), non "quello piu' avanti" che
      // nei ganci passa da una mano all'altra e disegnava zig-zag
      let gp = s.g[0];
      if (u && s.g[1]) { const d0 = Math.hypot(u[0] - s.g[0][0], u[1] - s.g[0][1]), d1 = Math.hypot(u[0] - s.g[1][0], u[1] - s.g[1][1]); if (d1 < d0) gp = s.g[1]; }
      if (!att || s.hp !== nm || (u && Math.hypot(u[0] - gp[0], u[1] - gp[1]) > s.r * .9)) { s.h.length = 0; gp = s.g[0]; }
      if (att) { s.h.push(gp.slice()); if (s.h.length > 6) s.h.shift(); }
      s.hp = nm;
      L.traccia(c, F);   // la scia finisce SUL guantone di questo fotogramma (disegnata dopo il corpo)
    },
    stato(F) { return ST.get(F); },
    niente_tinta_carica(F) { return !!JJ[F.id]; },
    scia() {},   // gancio di disegno.js prima del corpo: niente (la scia larga di prima non c'e' piu')
    // scia sottile del guantone
    traccia(c, F) {
      const s = st(F); if (!s.h || s.h.length < 2) return;
      const H = s.r || 100;
      let v = 0; for (let i = 1; i < s.h.length; i++) v += Math.hypot(s.h[i][0] - s.h[i - 1][0], s.h[i][1] - s.h[i - 1][1]);
      if (v < H * .25) return;                       // solo quando il guantone corre davvero
      // 18/10: niente linee dure. Striscia SFUMATA a nastro: punti ammorbiditi, larghezza che cresce dalla coda alla testa,
      // riempita con un gradiente lungo il percorso (coda trasparente -> bordo caldo -> nucleo chiaro vicino al guantone)
      const P = [], n0 = s.h.length;
      for (let i = 0; i < n0 - 1; i++) {
        const a = s.h[Math.max(0, i - 1)], b = s.h[i], c2 = s.h[i + 1], d2 = s.h[Math.min(n0 - 1, i + 2)];
        for (let k = 0; k < 4; k++) {   // Catmull-Rom
          const t = k / 4, t2 = t * t, t3 = t2 * t;
          P.push([.5 * (2 * b[0] + (-a[0] + c2[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c2[0] - d2[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c2[0] + d2[0]) * t3),
                  .5 * (2 * b[1] + (-a[1] + c2[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c2[1] - d2[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c2[1] + d2[1]) * t3)]);
        }
      }
      P.push(s.h[n0 - 1]);
      const n = P.length; if (n < 3) return;
      const nastro = (wmax) => {
        const L = [], R = [];
        for (let i = 0; i < n; i++) {
          const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
          const u = i / (n - 1), w = H * wmax * Math.pow(u, 1.4);
          L.push([P[i][0] - dy / l * w, P[i][1] + dx / l * w]); R.push([P[i][0] + dy / l * w, P[i][1] - dx / l * w]);
        }
        c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (const q of L) c.lineTo(q[0], q[1]); for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath();
      };
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
      const g1 = c.createLinearGradient(P[0][0], P[0][1], P[n - 1][0], P[n - 1][1]);
      g1.addColorStop(0, 'rgba(255,120,30,0)'); g1.addColorStop(.6, 'rgba(255,150,40,.28)'); g1.addColorStop(1, 'rgba(255,200,90,.55)');
      nastro(.034); c.fillStyle = g1; c.fill();
      const g2 = c.createLinearGradient(P[0][0], P[0][1], P[n - 1][0], P[n - 1][1]);
      g2.addColorStop(0, 'rgba(255,240,200,0)'); g2.addColorStop(.7, 'rgba(255,236,190,.25)'); g2.addColorStop(1, 'rgba(255,248,225,.6)');
      nastro(.012); c.fillStyle = g2; c.fill();
      c.restore();
    },
    // nucleo di carica sul guantone (q 0..1)
    carica(c, F, q, quale) {
      const s = st(F); if (!s.g) return;
      const p = (F.id === 'lupo' || F.id === 'croupier' || F.id === 'bot' || F.id === 'don' || F.id === 'buttafuori' || F.id === 'veggente' || F.id === 'sumo' ? s.g[0] : s.g[quale]) || s.g[0], H = s.r || 100, r = H * (.04 + .06 * q);   // lupo: la carica sugli artigli (l'ancora 1 e' la bocca)
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 2.2);
      gr.addColorStop(0, 'rgba(255,255,240,' + (.7 + .3 * q) + ')'); gr.addColorStop(.35, 'rgba(255,214,90,' + (.45 + .4 * q) + ')'); gr.addColorStop(1, 'rgba(255,140,30,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], r * 2.2, 0, TAU); c.fill();
      for (let k = 0; k < 2; k++) {                 // anelli che si stringono verso il pugno
        const u = ((tv * .045 + k * .5) % 1), R = r * (1.3 + 2.6 * (1 - u));
        c.globalAlpha = (.15 + .4 * q) * u; c.strokeStyle = '#ffe9a8'; c.lineWidth = Math.max(1, H * .006);
        c.beginPath(); c.arc(p[0], p[1], R, 0, TAU); c.stroke();
      }
      for (let k = 0; k < 6; k++) {                 // scintille risucchiate
        const a = k * 1.047 + tv * .07, u = ((tv * .06 + k * .17) % 1), R = r * (1.2 + 3.5 * (1 - u));
        const x = p[0] + Math.cos(a) * R, y = p[1] + Math.sin(a) * R;
        c.globalAlpha = (.3 + .5 * q) * u; c.fillStyle = '#fff3c0'; c.beginPath(); c.arc(x, y, Math.max(1, H * .007), 0, TAU); c.fill();
      }
      if (q >= 1 && (tv % 24) < 3) {                // lampo breve a carica piena, solo sul guantone
        c.globalAlpha = .8; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(p[0], p[1], r * 1.4, 0, TAU); c.fill();
      }
      c.restore();
    },
    lampo(c, F, quale, k) {
      const s = st(F); if (!s.g) return; const p = s.g[quale || 0], H = s.r || 100;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .5 * k;
      const gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], H * .14);
      gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], H * .14, 0, TAU); c.fill(); c.restore();
    },
  };

  // ---- carica degli smash: disegnata dopo il corpo, dal passo degli effetti di mossa (GSE.mossa chiama FX[m.mec]);
  // per gli smash senza mec si aggancia al disegno del corpo
  const dopo0 = L.dopo;
  L.dopo = function (c, F, d, V, pose, t, gh, aim) {
    dopo0.apply(this, arguments);
    if (!JJ[F.id] || F.st !== 'mossa') return;
    const m = root.GS.mossaDi(d, F.mv);
    if (m && m.carica && F.mc > 0 && F.mf === m.carica.f) L.carica(c, F, Math.min(1, F.mc / (m.carica.max || 60)), 1);
  };

  function aggancia() {
    const X = root.GSE && root.GSE._int && root.GSE._int.FX;
    if (!X || !X.pugno_sfondascudi) return setTimeout(aggancia, 50);
    const T = root.GSE._int;
    // scia a tema (effetti.js): per il Campione la sostituisce la scia sottile sul guantone; in carica niente bagliore
    // largo ne' sudore/stelle che girano attorno al corpo
    // proiettile della Bomba (e' la hitbox dello scatto): al posto del disco grande, un'onda sottile sul guantone
    const proj0 = root.GSE.proj;
    root.GSE.proj = function (c, S, P, col, tv) {
      if (P.fo !== 'bomba_campione') return proj0.apply(this, arguments);
      let F = null; for (let i = 0; i < S.n; i++) if (S.L[i].p === P.own) F = S.L[i];
      const g = F && st(F).g; if (!g) return true;
      const q = 1 - P.life / P.life0, p = g[0], H = st(F).r || 100, oro = P.a1 >= 3;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = .55 * (1 - q); c.strokeStyle = oro ? '#ffe27a' : '#ffb06a'; c.lineWidth = Math.max(1.5, H * .012);
      c.beginPath(); c.arc(p[0], p[1], H * (.08 + .22 * q), 0, TAU); c.stroke();
      c.globalAlpha = .45 * (1 - q * .7);
      const gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], H * .12); gr.addColorStop(0, oro ? 'rgba(255,240,170,.9)' : 'rgba(255,190,120,.8)'); gr.addColorStop(1, 'rgba(255,140,40,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], H * .12, 0, TAU); c.fill();
      c.restore(); return true;
    };
    const scia0 = root.GSE.scia;
    root.GSE.scia = function (c, S, F, m, H, t) { if (JJ[F.id] && m && m.fx) return true; return scia0.apply(this, arguments); };
    const passo0 = root.GSE.passo;
    root.GSE.passo = function (S) {
      let via = false;
      for (let i = 0; i < S.n; i++) { const F = S.L[i]; if (JJ[F.id] && F.st === 'mossa' && F.mc > 0) { const m = root.GS.mossaDi(root.GS.D(F), F.mv); if (m && m.carica && F.mf === m.carica.f) via = true; } }
      if (!via) return passo0.apply(this, arguments);
      const sv = {}; for (const id in JJ) { sv[id] = T.TM[id]; delete T.TM[id]; }
      try { return passo0.apply(this, arguments); } finally { for (const id in sv) if (sv[id]) T.TM[id] = sv[id]; }
    };
    // BOMBA: il segno a terra di dove arriverai resta (informazione di gioco), il resto sta sul guantone
    X.pugno_sfondascudi = function (c, o) {
      const F = o.F, q = F.r1 / 60, col = q >= 1 ? '#ffd23b' : '#ff8a3b';
      if (!F.r2) {
        L.carica(c, F, q, 1);
        const aria = F.plat < 0, k = aria ? (F.uN ? 0 : .6) : 1;
        if (k > 0) {
          const dd = (40 + 250 * q) * k * 1.15, tx = o.x + o.dir * dd, ty = aria ? o.y - o.H * .1 : o.y - 2;
          c.globalAlpha = .25 + q * .3; c.strokeStyle = col; c.lineWidth = 2; c.setLineDash([6, 8]);
          c.beginPath(); c.moveTo(o.x + o.dir * o.H * .3, ty); c.lineTo(tx, ty); c.stroke(); c.setLineDash([]);
          c.fillStyle = col; c.beginPath(); c.moveTo(tx + o.dir * 9, ty); c.lineTo(tx - o.dir * 3, ty - 7); c.lineTo(tx - o.dir * 3, ty + 7); c.closePath(); c.fill();
          c.globalAlpha = 1;
        }
      } else {
        const dt = o.t - F.r2;
        if (dt <= 4) L.lampo(c, F, 0, 1 - dt / 5);
        if (F.plat >= 0 && dt <= F.r3 && (o.tv & 1)) T.T.emetti(2, o.x - o.dir * 12, o.y - 2, -o.dir * (2 + q * 3), -.8, 16, 6 + q * 4, T.T.C.POLV, 0);
      }
    };
    // GANCIO KO: niente luce rossa sul corpo; carica sul guantone tirato indietro, poi la scia ad arco (GSLOOK.scia)
    X.gancio_ko = function (c, o) {
      const F = o.F;
      if (o.t < 13) L.carica(c, F, o.t / 13, 1);
      else if (o.t < 16) L.lampo(c, F, 0, 1 - (o.t - 13) / 3);
    };
  }
  aggancia();
})(window);
