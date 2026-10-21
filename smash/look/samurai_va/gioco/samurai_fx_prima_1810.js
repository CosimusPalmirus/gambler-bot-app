/* smash_look_1710/samurai_va — effetti del SAMURAI agganciati alle ANCORE misurate sugli sprite video (atlante: pose[k].ancore,
   per fotogramma, [punta della lama, mani] rispetto ai piedi). SOLO DISEGNO: nessuno stato del motore cambia.
   Regola del proprietario: gli effetti sono un contorno secondario, mai sul corpo.
   - scia luminosa SOTTILE lungo la lama: la parte esterna della lama spazzata negli ultimi fotogrammi attivi, coda che sfuma;
   - carica (smash tenuti e Iaido): un riflesso che corre lungo la lama + stellina sulla punta; lampo breve a carica piena
     SOLO sulla punta; niente tinta su tutto il corpo, niente petali/particelle del tema attorno al corpo in carica;
   - smash: bagliore grande per un istante (2-3 fotogrammi) sulla punta al primo fotogramma attivo;
   - al posto degli effetti di effetti.js che coprivano il corpo (linea bianca diagonale di scatto_taglio, alone della parata,
     bagliore dorato dell'Iaido) gli stessi segni stanno sulla lama.
   Si aggancia a GSLOOK (campione_fx.js) concatenando: il Campione resta com'e'. */
(function (root) {
  'use strict';
  const ID = 'samurai', TAU = Math.PI * 2;
  let J = null, tv = 0;
  fetch((root.GBR3D_BASE || '') + ID + '.json').then(r => r.json()).then(j => { J = j; });
  const ST = new WeakMap();
  function st(F) { let s = ST.get(F); if (!s) { s = { g: null, h: [], lampo: 0 }; ST.set(F, s); } return s; }
  function fotogramma(P, t) {
    const F = P.f, T = P.durata; t = t || 0;
    if (P.loop) { t = t % T; if (t < 0) t += T; } else if (t > T) t = T;
    let i = 0; while (i + 1 < F.length && F[i + 1][1] <= t + 1e-6) i++;
    return i;
  }
  function verso(facing, aim) { let f = facing < 0 ? -1 : 1; if (aim != null && Math.cos(aim) * f < -0.12) f = -f; return f; }
  const SMASH = { fsmash: 1, usmash: 1, dsmash: 1 };

  // la lama "taglia" adesso? (fotogrammi attivi del motore, piu' i colpi delle speciali fatte a copione)
  function attiva(F, m) {
    if (!m) return false;
    if (F.mv === 'nspec') return F.r1 === 1 && F.mf >= 30 && F.mf <= 36;
    if (F.mv === 'dspec') return F.mf >= 26 && F.mf <= 31;
    if (m.hb) for (const h of m.hb) if (!h.presa && F.mf >= h.f0 - 2 && F.mf <= h.f1 + 1) return true;
    if (m.mant && F.mf >= m.mant.f0 && F.mf <= m.mant.f1) return true;
    return false;
  }
  function inCarica(F, m) {
    if (!m) return 0;
    if (m.carica && F.mc > 0 && F.mf === m.carica.f) return Math.min(1, F.mc / (m.carica.max || 60));
    if (F.mv === 'nspec' && !F.r1 && F.mf > 2) return Math.min(1, (F.r2 || 0) / 40);
    return 0;
  }

  const L0 = root.GSLOOK || {};
  const L = root.GSLOOK = Object.assign({}, L0);
  let Fcur = null;
  L.prima = function (F) { if (F.id === ID) { tv++; Fcur = F; } else Fcur = null; if (L0.prima) return L0.prima.apply(this, arguments); };
  // IAIDO tenuto: il motore fa correre mf da 1 a 40 mentre si tiene SPECIALE (t fino a ~0,69): senza questo, dopo mf 30
  // si vedeva gia' lo zanshin (t 0,56) con il tasto ancora tenuto. Solo disegno: finche' il colpo non e' partito (r1 = 0)
  // la posa resta quella di CARICA (t 0,3).
  function agganciaDraw() {
    const G = root.GBR; if (!G || !G.draw) return setTimeout(agganciaDraw, 50);
    if (G.__sam) return; G.__sam = 1; const d0 = G.draw;
    G.draw = function (c, id, x, y, o) {
      const F = Fcur;
      if (id === ID && F && o && o.pose === 'nspec' && F.st === 'mossa' && F.mv === 'nspec' && !F.r1 && F.mf > 3 && (o.alpha == null || o.alpha >= .99)) o.t = .3;
      return d0.apply(this, arguments);
    };
  }
  agganciaDraw();
  L.niente_tinta_carica = function (F) { return F.id === ID || !!(L0.niente_tinta_carica && L0.niente_tinta_carica(F)); };
  L.scia = function () { if (L0.scia) return L0.scia.apply(this, arguments); };
  L.stato_sam = function (F) { return ST.get(F); };
  L.dopo = function (c, F, d, V, pose, t, gh, aim) {
    if (F.id !== ID) { if (L0.dopo) return L0.dopo.apply(this, arguments); return; }
    if (!J) return;
    const M0 = c.getTransform();
    let nm = pose; for (let q = 0; q < 4 && J.pose[nm] && J.pose[nm].come; q++) nm = J.pose[nm].come;
    const P = J.pose[nm], s = st(F);
    if (!P || !P.ancore) { s.g = null; s.h.length = 0; s.o = [M0.e, M0.f]; return; }
    const i = fotogramma(P, t), A = P.ancore[i]; if (!A || A.length < 2) { s.g = null; return; }
    const k = (gh || 96) / J.h_rif, f = verso(F.dir, aim), M = c.getTransform();
    s.g = A.map(([ax, ay]) => { const x = f * ax * k, y = ay * k; return [M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f]; });
    s.r = (gh || 96) * Math.sqrt(Math.abs(M.a * M.d - M.b * M.c));
    s.posa = nm; s.i = i; s.o = [M.e, M.f];   // pivot del disegno (piedi) in px dispositivo
    if (L.controllo && F.st === 'mossa') {        // banco: sotto l'ancora della punta c'e' davvero la lama (pixel chiaro e grigio)?
      const p = s.g[0], x0 = Math.round(p[0]) - 4, y0 = Math.round(p[1]) - 4;
      let ok = 0; if (V && V.flash > 1) ok = -2; else if (p[0] < 4 || p[1] < 4 || p[0] > c.canvas.width - 5 || p[1] > c.canvas.height - 5) ok = -2; else try { const D = c.getImageData(x0, y0, 9, 9).data; for (let q = 0; q < D.length; q += 4) { const mx = Math.max(D[q], D[q + 1], D[q + 2]), mn = Math.min(D[q], D[q + 1], D[q + 2]); if (mx > 110 && mx - mn < 60) ok++; } } catch (e) { ok = -1; }
      (L.esiti_sam = L.esiti_sam || []).push([nm, i, ok, F.mv, Math.round(p[0]), Math.round(p[1])]);
    }
    const m = F.st === 'mossa' ? root.GS.mossaDi(d, F.mv) : null;
    const att = F.st === 'mossa' && attiva(F, m);
    const u = s.h[s.h.length - 1];
    if (!att || s.hp !== nm || (u && Math.hypot(u[0][0] - s.g[0][0], u[0][1] - s.g[0][1]) > s.r * 1.2)) s.h.length = 0;
    if (att) { s.h.push([s.g[0].slice(), s.g[1].slice()]); if (s.h.length > 5) s.h.shift(); }
    // lampo grande solo un istante: primo fotogramma attivo degli smash
    if (att && m && SMASH[F.mv] && m.hb && m.hb[0] && F.mf === m.hb[0].f0) s.lampo = 3;
    s.hp = nm;
    traccia(c, F);
    const q = F.st === 'mossa' ? inCarica(F, m) : 0;
    if (F.st === 'mossa' && (q > 0 || (F.mv === 'nspec' && !F.r1 && F.mf > 2))) carica(c, F, q);
    if (s.lampo > 0) { lampo(c, F, s.lampo / 3); s.lampo--; }
  };

  // scia sottile: ARCO della punta attorno alle mani (le pose chiave saltano: una fascia dritta fra due pose faceva un
  // cuneo grigio; l'arco segue il giro vero della lama), filo bianco sottile + alone azzurro appena piu' largo, coda che sfuma
  function traccia(c, F) {
    const s = st(F); const h = s.h; if (h.length < 2) return;
    const H = s.r || 100, n = h.length, cur = h[n - 1], bx = cur[1][0], by = cur[1][1];
    const R = Math.hypot(cur[0][0] - bx, cur[0][1] - by); if (R < H * .15) return;
    const ang = h.map(e => Math.atan2(e[0][1] - e[1][1], e[0][0] - e[1][0]));
    let tot = 0; const pas = [];
    for (let i = 1; i < n; i++) { let d = ang[i] - ang[i - 1]; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; pas.push(d); tot += Math.abs(d); }
    if (tot < .25 || tot > 4) return;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    let a0 = ang[0];
    for (let i = 0; i < pas.length; i++) {
      const w = (i + 1) / pas.length, a1 = a0 + pas[i];
      for (const [col, al, lw, rr] of [['#9fd8ff', .12 + .25 * w, .02 + .02 * w, .93], ['#ffffff', .25 + .6 * w, .004 + .008 * w, .985]]) {
        c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = Math.max(1, H * lw);
        c.beginPath(); c.arc(bx, by, R * rr, a0, a1, pas[i] < 0); c.stroke();
      }
      a0 = a1;
    }
    c.restore();
  }
  // carica: riflesso che corre lungo la lama + stellina sulla punta
  function carica(c, F, q) {
    const s = st(F); if (!s.g) return;
    const p = s.g[0], b = s.g[1], H = s.r || 100;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
    const u = (tv * .06) % 1, x = b[0] + (p[0] - b[0]) * u, y = b[1] + (p[1] - b[1]) * u;
    const gr = c.createRadialGradient(x, y, 0, x, y, H * (.035 + .03 * q));
    gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(160,220,255,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, H * (.035 + .03 * q), 0, TAU); c.fill();
    // stellina a 4 punte sulla punta, cresce con la carica
    const r = H * (.03 + .06 * q), a = tv * .05;
    c.globalAlpha = .55 + .4 * q; c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, H * .006);
    c.beginPath();
    for (let k = 0; k < 4; k++) { const an = a + k * Math.PI / 2; c.moveTo(p[0], p[1]); c.lineTo(p[0] + Math.cos(an) * r, p[1] + Math.sin(an) * r); }
    c.stroke();
    if (q >= 1 && (tv % 24) < 3) { c.globalAlpha = .8; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(p[0], p[1], r * .6, 0, TAU); c.fill(); }
    c.restore();
  }
  function lampo(c, F, k) {
    const s = st(F); if (!s.g) return; const p = s.g[0], H = s.r || 100;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .6 * k;
    const gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], H * .22);
    gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.4, 'rgba(190,230,255,.5)'); gr.addColorStop(1, 'rgba(120,180,255,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], H * .22, 0, TAU); c.fill(); c.restore();
  }
  // filo luminoso lungo la lama (parata)
  function filo(c, F, al) {
    const s = st(F); if (!s.g) return; const p = s.g[0], b = s.g[1], H = s.r || 100;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al; c.strokeStyle = '#eaf6ff'; c.lineCap = 'round';
    c.lineWidth = Math.max(1, H * .012); c.beginPath(); c.moveTo(b[0] + (p[0] - b[0]) * .25, b[1] + (p[1] - b[1]) * .25); c.lineTo(p[0], p[1]); c.stroke(); c.restore();
  }

  function aggancia() {
    const X = root.GSE && root.GSE._int && root.GSE._int.FX;
    if (!X || !X.attraversa || !root.GSE.scia) return setTimeout(aggancia, 50);
    const T = root.GSE._int;
    const scia0 = root.GSE.scia;
    root.GSE.scia = function (c, S, F) { if (F.id === ID) return true; return scia0.apply(this, arguments); };
    const att0 = X.attraversa, sca0 = X.scatto_taglio, par0 = X.parata;
    X.attraversa = function (c, o) { if (o.F && o.F.id === ID) return; return att0.apply(this, arguments); };   // la carica dell'Iaido sta sulla lama (L.dopo)
    X.scatto_taglio = function (c, o) { if (o.F && o.F.id === ID) return; return sca0.apply(this, arguments); };  // niente linea bianca sul corpo: c'e' la scia della lama
    X.parata = function (c, o) { if (o.F && o.F.id === ID) { if (o.t >= 3 && o.t <= 11) filo(c, o.F, .5 + .3 * Math.sin(o.t)); return; } return par0.apply(this, arguments); };
    // tema: nello SVOLAZZO della lama solo petali piccoli (i «7» grandi coprivano la punta a ogni fendente); il «7» resta
    // solo sul COLPO andato a segno (firma Samurai Slot), dove sta sull'avversario
    if (T.TM && T.TM[ID] && T.TM[ID].s) { const pe = T.TM[ID].s[0]; T.TM[ID].s = [pe, pe, pe]; }
    // in carica niente particelle del tema (petali) attorno al corpo
    const passo0 = root.GSE.passo;
    root.GSE.passo = function (S) {
      let via = false;
      for (let i = 0; i < S.n; i++) { const F = S.L[i]; if (F.id === ID && F.st === 'mossa' && inCarica(F, root.GS.mossaDi(root.GS.D(F), F.mv)) > 0) via = true; }
      if (!via || !T.TM || !T.TM[ID]) return passo0.apply(this, arguments);
      const th = T.TM[ID]; delete T.TM[ID];
      try { return passo0.apply(this, arguments); } finally { T.TM[ID] = th; }
    };
  }
  aggancia();

  // 18/10 (controllo 12): nel menu di scelta la cella usa il ritratto piccolo di smash_1410 (ritratti/samurai.webp, grafica
  // vecchia, sola lettura). Qui, solo nella pagina di prova, la cella prende il ritratto nuovo dell'atlante (samurai_ritratto.webp).
  const RIT = (root.GBR3D_BASE || '') + ID + '_ritratto.webp';
  function ritratti() {
    document.querySelectorAll('img[src$="ritratti/' + ID + '.webp"]').forEach(im => { im.src = RIT; });
  }
  try { new MutationObserver(ritratti).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) { }
  setInterval(ritratti, 500);
})(window);
