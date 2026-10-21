/* smash_look_1710 — effetti del LUPO sugli sprite video, agganciati alle ANCORE dell'atlante (pose[k].ancore:
   [0] artigli, [1] bocca; GSLOOK.stato(F).g in px del dispositivo). SOLO DISEGNO.
   18/10 (il proprietario: «non si possono vedere quelle linee bianche»): niente tratti bianchi pieni. Gli strumenti sono
   quelli di smash_1410/lupo_mannaro_fx.js (GSE.lupoSerie: strisce sfumate viola-lavanda con nucleo bianco-caldo, coda
   sottile che svanisce, anelli morbidi, scintille piccole). Qui li si usa sulle ancore vere:
   - scia degli artigli (normali e abilità): la striscia del lupo sul percorso vero dell'artiglio, al posto della scia
     calda del Campione (campione_fx.js GSLOOK.traccia, che per il lupo qui si sostituisce);
   - Artigliata in serie (combo a 3): graffi sfumati sull'artiglio (1ª scendono, 2ª salgono, 3ª la X), anello della
     finestra sulle mani solo se ha colpito;
   - Balzo in volo, Capriola crescente (mezzaluna), Picchiata: striscia sulla storia dell'ancora degli artigli;
   - Morso: due mezzelune sfumate che si chiudono sull'ancora della BOCCA;
   - aura della FURIA: spenta con lo sprite video.
   RIPIEGO: se l'atlante non ha ancore (o il lupo non è ancora sprite video) restano gli effetti di lupo_mannaro_fx.js
   a punti fissi davanti al corpo. */
(function (root) {
  'use strict';
  const ID = 'lupo';
  function aggancia() {
    const X = root.GSE && root.GSE._int && root.GSE._int.FX, L = root.GSLOOK, LS = root.GSE && root.GSE.lupoSerie;
    if (!X || !X.artigli_serie || !L || !root.GBR || !LS) return setTimeout(aggancia, 60);
    const vero = F => { const s = L.stato(F); return s && s.g ? s : null; };
    const a0 = X.artigli_serie, c0 = X.capriola_crescente, m0 = X.morso_scuote, b0 = X.balzo_predatore;
    const schermo = (c, f) => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); try { f(); } finally { c.restore(); } };
    // storia di un'ancora (px del dispositivo) per lottatore, per le scie di volo
    const ST = new WeakMap();
    function storia(F, chiave, p, max) {
      let h = ST.get(F); if (!h || h.k !== chiave) { h = { k: chiave, p: [], f: -9 }; ST.set(F, h); }
      if (F.mf !== h.f) {
        const u = h.p[h.p.length - 1], sb = L.stato(F), H = (sb && sb.r) || 100;
        if (F.mf < h.f || F.mf - h.f > 3 || (u && Math.hypot(u[0] - p[0], u[1] - p[1]) > H * .45)) h.p.length = 0;   // salto dell'ancora: si riparte
        h.f = F.mf; h.p.push([p[0], p[1]]); if (h.p.length > (max || 7)) h.p.shift();
      }
      return h.p;
    }
    X.artigli_serie = function (c, o) {
      const F = o.F, s = vero(F); if (!s) return a0.apply(this, arguments);
      const n = Math.min(2, F.r1), H = s.r || 100, k = H * .0143, p = s.g[0];
      schermo(c, () => { LS.serieGraffi(c, F, F.dir, p, H * (n === 2 ? .22 : .16), k); LS.finestra(c, F, p, k); });
    };
    X.balzo_predatore = function (c, o) {
      const F = o.F, s = vero(F);
      if (F.lm && F.lm.fase === 1) return;
      if (F.lm && F.lm.fase === 2 && s) { const H = s.r || 100, P = storia(F, 'ribalzo', s.g[0], 4); schermo(c, () => LS.striscia(c, P, H * .026, LS.PAL.vio, LS.PAL.cald, .65)); return; }
      if (!s || !F.r2 || F.r3 !== 1) return b0.apply(this, arguments);   // la traiettoria in carica resta quella del mondo
      const H = s.r || 100, P = storia(F, 'balzo', s.g[0], 7);
      schermo(c, () => LS.striscia(c, P, H * .045, LS.PAL.vio, LS.PAL.cald, .9));
    };
    X.capriola_crescente = function (c, o) {
      const F = o.F, s = vero(F);
      if (F.lm && F.lm.fase === 1) return;
      if (F.lm && F.lm.fase === 2 && s) { const H = s.r || 100, P = storia(F, 'ribalzo', s.g[0], 4); schermo(c, () => LS.striscia(c, P, H * .026, LS.PAL.vio, LS.PAL.cald, .65)); return; } if (!s) return c0.apply(this, arguments);
      const H = s.r || 100;
      if (F.r1 === 1) { const P = storia(F, 'picchiata', s.g[0], 7); schermo(c, () => LS.striscia(c, P, H * .05, LS.PAL.vio, LS.PAL.oro, .9)); return; }
      if (o.t >= 5 && o.t <= 22) { const P = storia(F, 'capriola', s.g[0], 8); schermo(c, () => LS.striscia(c, P, H * .045, LS.PAL.vio, LS.PAL.cald, 1 - Math.max(0, (o.t - 14) / 10))); }
    };
    X.morso_scuote = function (c, o) {
      const F = o.F, s = vero(F); if (!s) return m0.apply(this, arguments);
      if (F.r1 || o.t < 5 || o.t > 12) return;
      const p = s.g[1] || s.g[0], H = s.r || 100;
      schermo(c, () => LS.fauci(c, p, H * .07, F.dir, (o.t - 5) / 7, H * .0143));
    };
    // scia degli artigli dei normali sulle ancore: nei colori del lupo (la traccia di campione_fx.js è calda, del Campione)
    const tr0 = L.traccia;
    L.traccia = function (c, F) {
      if (F.id !== ID) return tr0.apply(this, arguments);
      const s = L.stato(F); if (!s || !s.h || s.h.length < 2) return;
      const H = s.r || 100; let v = 0; for (let i = 1; i < s.h.length; i++) v += Math.hypot(s.h[i][0] - s.h[i - 1][0], s.h[i][1] - s.h[i - 1][1]);
      if (v < H * .25) return;
      schermo(c, () => LS.striscia(c, s.h, H * .04, LS.PAL.vio, LS.PAL.cald, .85));
    };
    // aura della furia: con lo sprite video non si accende sul corpo (la furia resta nel motore e nella scheda)
    const LU = root.GSLUPO, draw0 = root.GBR.draw;
    if (LU && LU.furia) root.GBR.draw = function (ctx, id, x, y, o) {
      if (id !== ID) return draw0.apply(this, arguments);
      const fu = LU.furia; LU.furia = () => 0;
      try { return draw0.apply(this, arguments); } finally { LU.furia = fu; }
    };
  }
  aggancia();
})(window);

/* Nuove pose IA dell'appoggio e del ribalzo: renderer locale, nessuna scrittura nella simulazione. */
(function (root) {
  'use strict';
  const BASE = '/smash_look_1710/lupo_va/muro_2010/';
  const IMG = {}, META = {}; let pronto = false, corrente = null;
  const ready = fetch(BASE + 'pose.json').then(r => { if (!r.ok) throw Error('pose Lupo'); return r.json(); }).then(async j => {
    Object.assign(META, j);
    await Promise.all(Object.keys(j).map(async k => { const im = new Image(); im.src = BASE + k + '.webp'; await im.decode(); IMG[k] = im; }));
    pronto = true;
  });
  ready.catch(e => console.warn('Lupo appoggio:', e));
  const WS = new WeakMap();
  function speciale(F) { return F && F.id === 'lupo' && F.st === 'mossa' && (F.mv === 'nspec' || F.mv === 'uspec') && F.lm && (F.lm.fase === 1 || F.lm.fase === 2); }
  function init() {
    const G = root.GBR, L = root.GSLOOK; if (!G || !L) return setTimeout(init, 60);
    const corpo = root.GSE.corpo;
    root.GSE.corpo = function (F, m) { return speciale(F) ? { r: 0, sx: 1, sy: 1, ox: 0, oy: 0, tr: 0 } : corpo.apply(this, arguments); };
    const load = G.load;
    G.load = async function (ids) { const result = await load.apply(this, arguments); if ((ids || []).includes('lupo')) await ready; return result; };
    const prima = L.prima, dopo = L.dopo, draw = G.draw, traccia = L.traccia;
    L.prima = function (F) { corrente = F; return prima.apply(this, arguments); };
    L.traccia = function (c, F) { if (!speciale(F)) return traccia.apply(this, arguments); };
    G.draw = function (c, id, x, y, o) {
      const F = corrente;
      if (id !== 'lupo' || !speciale(F) || !pronto) return draw.apply(this, arguments);
      const w = F.lm, age = F.mf - w.t, H = root.GS.D(F).H, gh = o.h || H / 1.12;
      let nm, dir = F.dir, rot = 0;
      if (w.fase === 1) { nm = w.ny ? 'soffitto' : age < 3 ? 'parete_arrivo' : 'parete'; if (w.nx) dir = -w.nx; }
      else {
        nm = age < 4 ? w.ny ? 'soffitto_via' : 'parete_via' : age < 11 ? 'balzo' : age < 15 ? 'balzo_raccolta' : 'raccolta';   // 20/10: tempi piu' lunghi (volo 18 f)
        // La spinta dalla parete è disegnata verso sinistra nel foglio.
        if (nm === 'parete_via') dir = -F.dir;
        if (nm === 'balzo' || nm === 'balzo_raccolta') rot = Math.atan2(w.vy, Math.abs(w.vx));
      }
      // v2 (20/10): pose nuove con la guardia accanto nello stesso foglio: la guardia del foglio vale l'idle disegnato
      // (alto gh * 1,115 col Lupo, misurato nel Chrome), quindi le pose escono alla stessa scala delle altre
      const m = META[nm], im = IMG[nm], k = m.guardia ? gh * 1.115 / m.guardia : gh * .29 / m.testa;
      const iw = m.w * k, ih = m.h * k;
      let ox = -iw * .5, oy = -H * .5 - ih * .5;
      if (w.fase === 1 && w.nx) { ox = root.GS.hw(F) - iw; oy = -ih; }
      if (w.fase === 1 && w.ny) oy = -root.GS.hh(F);
      c.save(); c.translate(x, y); c.scale(dir, 1);
      if (rot) { c.translate(0, -H * .5); c.rotate(rot); c.translate(0, H * .5); }
      c.globalAlpha *= o.alpha == null ? 1 : o.alpha;
      c.drawImage(im, ox, oy, iw, ih);
      const M = c.getTransform(), local = w.fase === 1 && w.nx ? [ox + iw * .96, oy + ih * .37] : w.fase === 1 ? [ox + iw * .77, oy + ih * .06] : [ox + iw * .94, oy + ih * .56];
      const point = [M.a * local[0] + M.c * local[1] + M.e, M.b * local[0] + M.d * local[1] + M.f];
      WS.set(F, { point, H: H * Math.sqrt(Math.abs(M.a * M.d - M.b * M.c)), posa: nm, age });
      c.restore();
    };
    L.dopo = function (c, F) {
      if (!speciale(F) || !pronto) { corrente = null; return dopo.apply(this, arguments); }
      const q = WS.get(F); if (!q) { corrente = null; return dopo.apply(this, arguments); }
      let st = L.stato(F);
      if (!st) { dopo.apply(this, arguments); st = L.stato(F); }
      if (st) { st.g = [q.point, q.point]; st.r = q.H; st.posa = q.posa; st.i = q.age; st.h = []; }
      corrente = null;
    };
    root.GSLUPOMURO = { pronta: () => ready, stato: F => WS.get(F) };
  }
  init();
})(window);

