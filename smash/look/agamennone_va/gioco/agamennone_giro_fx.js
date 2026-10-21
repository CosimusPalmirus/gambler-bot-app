/* smash_look_1710/agamennone_va — RECUPERO + GIRO DI LANCIA di Agamennone, rifatto il 21/10 notte (proprietario: «devi migliorare
   sound FX, animazione e VFX di quando agamennone recupera la lancia»). SOLO DISEGNO E SUONI: il motore non cambia.
   - ANIMAZIONE: la mossa 'nspec_giro' (41 fotogrammi, t = mf/60) si disegna con i fotogrammi di recupero_2110/giro (clip Seedance
     dalla posa chinata approvata, grana dell'atlante) invece che con la posa dell'atlante (l'atlante resta intatto). Stessa scala e
     stesso pivot dell'atlante: nominale = px / J.scala, poi * h / h_rif.
   - VFX (arte AI in recupero_2110/fx): luccichio della presa, allo STRAPPO crepa nel terreno (resta qualche secondo), zolle che
     esplodono, polvere a sprite (GSFUMO) e zolline che ricadono; nel GIRO un arco di bronzo-oro che segue la punta su un'ellisse
     attorno al corpo (davanti, poi dietro passando in alto) con un brillio sulla testa dell'arco; al ritorno in GUARDIA anello d'urto
     a terra, polvere e brillio sulla punta.
   - SUONI (voci.js): lancia_presa, terra_strappo + lancia_strappo + urlo, lancia_vortice, sassolini, colpo_terra + lancia_guardia.
   agamennone_fx.js, se trova GSAGAGIRO pronto, non disegna piu' la sua scia/polvere del giro e non suona i suoi rumori del giro. */
(function (root) {
  'use strict';
  const ID = 'agamennone', B = '/smash_look_1710/agamennone_va/recupero_2110/', TAU = Math.PI * 2;
  const G = { j: null, im: [], n: 0, fx: null, fxj: null, J: null, M: null, S: null };
  const GA = root.GSAGAGIRO = { get pronto() { return !!(G.j && G.n === G.j.f.length && G.fx && G.fxj && G.J); } };
  fetch(B + 'giro/giro.json').then(r => r.json()).then(j => {
    G.j = j; j.f.forEach((f, i) => { const im = new Image(); im.onload = () => { G.n++; }; im.src = B + 'giro/g_' + String(i).padStart(2, '0') + '.webp'; G.im[i] = im; });
  }).catch(() => { });
  fetch(B + 'fx/fx.json').then(r => r.json()).then(j => { G.fxj = j; const im = new Image(); im.onload = () => { G.fx = im; }; im.src = B + 'fx/fx.webp'; }).catch(() => { });
  fetch((root.GBR3D_BASE || '/smash_look_1710/gioco/sprite/') + ID + '.json').then(r => r.json()).then(j => { G.J = j; }).catch(() => { });

  // ---------- animazione ----------
  function disegna(c, x, y, o) {
    const mf = Math.max(0, Math.min(40, Math.round((o.t || 0) * 60))), m = G.j.f[mf], im = G.im[mf];
    const k = (o.h || 96) / G.J.h_rif / (G.J.scala || 1), f = o.facing < 0 ? -1 : 1;
    c.save(); c.translate(x, y); c.scale(f, 1); if (o.alpha != null) c.globalAlpha *= o.alpha;
    c.drawImage(im, -m.ax * k, -m.ay * k, m.w * k, m.h * k);
    c.restore();
  }
  (function agganciaDraw() {
    const G2 = root.GBR; if (!G2 || !G2.draw) return setTimeout(agganciaDraw, 80);
    const d0 = G2.draw;
    G2.draw = function (c, id, x, y, o) {
      if (id === ID && o && o.pose === 'nspec_giro' && !o.tint && GA.pronto) return disegna(c, x, y, o);
      return d0.apply(this, arguments);
    };
  })();

  // ---------- effetti ----------
  const fxi = (c, nome, x, y, w, rot, al, sx, sy) => {   // un elemento dell'atlante degli effetti, centrato in (x, y), largo w
    const r = G.fxj[nome]; if (!r || al <= 0) return;
    const h = w * r[3] / r[2];
    c.save(); c.globalAlpha *= Math.min(1, al); c.translate(x, y); if (rot) c.rotate(rot); if (sx || sy) c.scale(sx || 1, sy || 1);
    c.drawImage(G.fx, r[0], r[1], r[2], r[3], -w / 2, -h / 2, w, h); c.restore();
  };
  const ST = new WeakMap();
  function st(F) { let s = ST.get(F); if (!s) { s = { on: false, mask: 0, mfp: -1, crepa: null, zolle: [], t0: 0 }; ST.set(F, s); } return s; }
  const H_ = F => root.GS.D(F).H;
  function suono(n) { if (root.GSV && root.GSV.rumore) root.GSV.rumore(n); }
  // momenti del recupero: [mf, bit, cosa]
  const MOMENTI = [[0, 0, 'presa'], [4, 1, 'strappo'], [7, 2, 'vortice'], [11, 3, 'sassi'], [24, 4, 'guardia']];
  function momenti(F, s, S) {
    if (F.st !== 'mossa' || F.mv !== 'nspec_giro') { s.on = false; return; }
    if (!s.on || F.mf < s.mfp) { s.on = true; s.mask = 0; s.x = F.x; s.y = F.y; s.d = F.dir; s.H = H_(F); s.base = F.x + F.dir * s.H * .3; }
    s.mfp = F.mf;
    for (const [f, bit, cosa] of MOMENTI) {
      if (F.mf < f || (s.mask & (1 << bit))) continue;
      s.mask |= 1 << bit;
      if (F.mf > f + 3) continue;   // entrato tardi (ripresa a meta'): niente scoppi fuori tempo
      const H = s.H, t = S.t;
      if (cosa === 'presa') { suono('lancia_presa'); s.tPresa = t; }
      if (cosa === 'strappo') {
        suono('terra_strappo'); suono('lancia_strappo');
        if (root.GSV && root.GSV.on && root.GSV.suonaFile) root.GSV.suonaFile(ID, 'raccolta_urlo', { vol: .82 });
        s.tStrappo = t; s.crepa = { x: s.base, y: s.y, t, d: s.d };
        s.zolle.length = 0;
        for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .32 + (k % 2 ? .1 : -.1); const v = H * (.045 + (k % 3) * .012); s.zolle.push({ x: s.base, y: s.y - H * .05, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: k * 1.3, vr: (k % 2 ? 1 : -1) * .25, t: 0 }); }
        if (root.GSFUMO && root.GSFUMO.nuvola) root.GSFUMO.nuvola(s.base, s.y, H * .6, '#d9c4a0');
      }
      if (cosa === 'vortice') { suono('lancia_vortice'); suono('lancia_rotazione'); }
      if (cosa === 'sassi') suono('sassolini');
      if (cosa === 'guardia') {
        suono('colpo_terra'); suono('lancia_guardia'); s.tGuardia = t;
        if (root.GSFUMO && root.GSFUMO.nuvola) root.GSFUMO.nuvola(s.x - s.d * H * .25, s.y, H * .55, '#d9c4a0');
      }
    }
  }
  // dietro ai lottatori (mondo): la crepa dove era piantata la lancia
  function dietro(c, S) {
    G.M = c.getTransform(); G.S = S;
    if (!GA.pronto || !S || !S.L) return;
    for (let i = 0; i < S.n; i++) {
      const F = S.L[i]; if (!F || F.id !== ID) continue;
      const s = ST.get(F); if (!s || !s.crepa) continue;
      const dt = S.t - s.crepa.t, H = s.H || H_(F); if (dt > 150) { s.crepa = null; continue; }
      const al = dt < 4 ? dt / 4 : dt > 110 ? 1 - (dt - 110) / 40 : 1;
      fxi(c, 'crepa', s.crepa.x, s.crepa.y + H * .02, H * (.95 + .1 * Math.min(1, dt / 6)), 0, al * .95, 1, .55);
    }
  }
  // davanti al re (mondo): luccichio, zolle, arco del giro, anello della guardia
  function davanti(c, F) {
    const S = G.S; if (!GA.pronto || !S || !G.M) return;
    const s = st(F); momenti(F, s, S);
    const H = s.H || H_(F), t = S.t, d = s.d || F.dir, x = s.x != null ? s.x : F.x, y = s.y != null ? s.y : F.y;
    c.save(); c.setTransform(G.M);
    // luccichio della presa (mano sull'asta)
    if (s.tPresa != null) { const dt = t - s.tPresa; if (dt < 10) fxi(c, 'brillio', x + d * H * .22, y - H * .62, H * (.25 + .25 * Math.sin(dt / 10 * Math.PI)), dt * .15, 1 - dt / 10); }
    // strappo: zolle che esplodono + lampo alla base + zolline che ricadono
    if (s.tStrappo != null) {
      const dt = t - s.tStrappo;
      if (dt < 16) { const u = dt / 16; fxi(c, 'zolle', s.base, y - H * (.28 + .25 * u), H * (.8 + .5 * u), 0, 1 - u * u); }
      if (dt < 7) { c.globalCompositeOperation = 'lighter'; fxi(c, 'lampo', s.base, y - H * .15, H * (.5 + .4 * dt / 7), 0, 1 - dt / 7); c.globalCompositeOperation = 'source-over'; }
      if (dt < 40) for (const z of s.zolle) {
        if (z.tUlt !== t) { z.tUlt = t; z.t++; z.x += z.vx; z.y += z.vy; z.vy += H * .005; z.r += z.vr; if (z.y > y) { z.y = y; z.vy *= -.25; z.vx *= .6; } }
        fxi(c, 'zolline', z.x, z.y - H * .03, H * .16, z.r, 1 - Math.max(0, z.t - 26) / 14);
      }
    }
    // giro: arco di bronzo-oro sull'ellisse attorno al corpo; la testa dell'arco segue la punta (davanti, in alto, dietro, in basso)
    if (F.st === 'mossa' && F.mv === 'nspec_giro' && F.mf >= 7 && F.mf <= 24) {
      const mf = F.mf, th = mf <= 8 ? .5 * (8 - mf) : mf <= 21 ? -TAU * (mf - 8) / 13 : -TAU - .3 * (mf - 21);
      const al = mf < 8 ? .6 : mf > 21 ? Math.max(0, 1 - (mf - 21) / 3) : 1;
      const cx = x, cy = y - H * .62, Rx = H * 1.08, Ry = H * .3, r = G.fxj.arco2, w = H * 2.1 * Rx / H;
      c.globalCompositeOperation = 'lighter';
      for (const [nome, dth, a2, sc] of [['arco3', .9, .35, 1.02], ['arco2', 0, .95, 1]]) {
        c.save(); c.translate(cx, cy); c.scale(d, Ry / Rx); c.rotate(th + dth - 40 * Math.PI / 180);
        fxi(c, nome, 0, 0, Rx * 2 * sc * (nome === 'arco3' ? G.fxj.arco3[2] / G.fxj.arco3[3] : r[2] / r[3]), 0, al * a2); c.restore();
      }
      const hx = cx + d * Math.cos(th) * Rx, hy = cy + Math.sin(th) * Ry;
      fxi(c, 'brillio', hx, hy, H * .32, mf * .4, al);
      if (mf >= 8 && mf <= 12) fxi(c, 'velocita', cx + d * Rx * .55, cy + Ry * .2, H * 1.2, 0, .5 * al, d, .6);
      c.globalCompositeOperation = 'source-over';
    }
    // guardia: anello d'urto schiacciato a terra + brillio sulla punta in avanti
    if (s.tGuardia != null) {
      const dt = t - s.tGuardia;
      if (dt < 14) { const u = dt / 14; c.globalCompositeOperation = 'lighter'; fxi(c, 'anello', x, y - H * .02, H * (.6 + 1.4 * u), 0, (1 - u) * .9, 1, .28); fxi(c, 'brillio', x + d * H * 1.15, y - H * .42, H * (.35 - .2 * u), dt * .2, 1 - u); c.globalCompositeOperation = 'source-over'; }
      else if (dt > 40) s.tGuardia = null;
    }
    c.restore();
  }
  (function aggancia() {
    if (!root.GSLOOK || !root.GSFX || !root.GSFX.dietro) return setTimeout(aggancia, 100);
    const d0 = root.GSFX.dietro;
    root.GSFX.dietro = function (c, S) { const r = d0.apply(this, arguments); try { dietro(c, S); } catch (e) { } return r; };
    const L = root.GSLOOK, dopo0 = L.dopo;
    L.dopo = function (c, F) { const r = dopo0 ? dopo0.apply(this, arguments) : undefined; if (F && F.id === ID) try { davanti(c, F); } catch (e) { } return r; };
  })();
})(window);
