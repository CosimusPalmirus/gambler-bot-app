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
    // 20/10 v3 (proprietario: «feel e animazione del balzo non soddisfano»): sequenza di 14 pose AI alla scala dell'idle,
    // impatto sul muro (schiacciata + scossa + anello di polvere), stacco esplosivo, volo con sagome fantasma e linee di
    // velocita', artigliata in volo, caduta e atterraggio duro. FACE: verso in cui guarda la posa nel file (+1 destra).
    const FACE = { parete_via: -1 };
    const ST3 = new WeakMap();   // per lottatore: ultima fase vista, fotogrammi di disegno, scie
    function st3(F) { let s = ST3.get(F); if (!s) { s = { fase: 0, k: 0, ghost: [], fine: -1, polv: [] }; ST3.set(F, s); } return s; }
    function sequenza(w, age) {   // [posa, durata dello schiacciamento/stiramento]
      if (w.fase === 1) {
        if (w.ny) return age < 3 ? ['soffitto', 1] : ['soffitto', 0];
        return age < 2 ? ['parete_arrivo', 1] : age < 5 ? ['parete', 0] : ['m_coil', 0];
      }
      if (w.ny) return age < 3 ? ['s_stacco', 0] : age < 6 ? ['soffitto_via', 0] : age < 11 ? ['balzo', 0] : age < 13 ? ['v_carica', 0] : age < 15 ? ['v_artiglio', 0] : ['balzo_raccolta', 0];
      return age < 2 ? ['m_stacco', 0] : age < 4 ? ['parete_via', 0] : age < 10 ? ['balzo', 0] : age < 12 ? ['v_carica', 0] : age < 14 ? ['v_artiglio', 0] : ['balzo_raccolta', 0];
    }
    function disegnaPosa(c, nm, x, y, H, gh, dir, rot, sx, sy, alpha) {
      const m = META[nm], im = IMG[nm]; if (!m || !im) return null;
      const k = m.guardia ? gh * 1.115 / m.guardia : gh * .29 / m.testa, iw = m.w * k, ih = m.h * k;
      c.save(); c.translate(x, y - H * .5); if (rot) c.rotate(rot); c.scale(dir * (FACE[nm] || 1) * sx, sy);
      c.globalAlpha *= alpha;
      c.drawImage(im, -iw * .5, -ih * .5, iw, ih);
      const M = c.getTransform(); c.restore();
      return { M, iw, ih };
    }
    G.draw = function (c, id, x, y, o) {
      const F = corrente;
      if (id !== 'lupo' || !F || !pronto) return draw.apply(this, arguments);
      const w = F.lm, s = st3(F), H = root.GS.D(F).H, gh = o.h || H / 1.12;
      // dopo il balzo: caduta e atterraggio duro (fase 3 fino a terra, poi 8 fotogrammi d'impatto)
      if (!speciale(F)) {
        if (w && w.fase === 3 && s.fine >= 0) {
          s.k++;
          const dopo = s.k - s.fine;
          if ((F.st === 'atterra' || F.st === 'terra') && dopo < 60) {
            if (s.atterra == null) { s.atterra = s.k; if (root.GSD && root.GSD.scossa) root.GSD.scossa(.35); s.polv.push({ x, y, t: 0, r: H * .5 }); }
            const a = s.k - s.atterra;
            if (a < 9) { const q = a < 3 ? 1 : 1 - (a - 3) / 6; disegnaPosa(c, a < 5 ? 'a_impatto' : 'raccolta', x, y, H * (1 - .1 * q), gh, F.dir, 0, 1 + .12 * q, 1 - .12 * q, o.alpha == null ? 1 : o.alpha); polvere(c, s); return; }
            s.fine = -1;
          } else if ((F.st === 'cade' || F.st === 'aria') && dopo < 60) {
            disegnaPosa(c, dopo < 6 ? 'balzo_raccolta' : 'a_cade', x, y, H, gh, F.dir, 0, 1, 1, o.alpha == null ? 1 : o.alpha); polvere(c, s); return;
          } else s.fine = -1;
        }
        polvere(c, s);
        return draw.apply(this, arguments);
      }
      s.k++;
      const age = F.mf - w.t;
      if (s.fase !== w.fase) {   // cambio di fase: scossa e polvere sul punto di contatto
        if (w.fase === 1) { if (root.GSD && root.GSD.scossa) root.GSD.scossa(.45); s.polv.push({ x: x - (w.nx || 0) * H * .3, y: y - H * .5 + (w.ny ? -H * .4 : 0), t: 0, r: H * .55 }); }
        if (w.fase === 2) { if (root.GSD && root.GSD.scossa) root.GSD.scossa(.3); s.polv.push({ x: x - (w.nx || 0) * H * .25, y: y - H * .5 + (w.ny ? -H * .4 : 0), t: 0, r: H * .7 }); s.ghost.length = 0; }
        s.fase = w.fase; s.atterra = null;
      }
      if (w.fase === 2 && age >= 17) { s.fine = s.k; s.atterra = null; }
      const [nm, urto] = sequenza(w, age);
      let dir = w.fase === 1 ? (w.nx || F.dir) : (w.vx > 0 ? 1 : w.vx < 0 ? -1 : F.dir);
      let rot = 0, sx = 1, sy = 1;
      if (w.fase === 1 && urto) { sx = .8; sy = 1.12; }   // schiacciata contro il muro
      if (w.fase === 1 && !urto && age > 4) { const tr = Math.sin(s.k * 1.7) * .012; sx = 1 - Math.abs(tr) * 3; rot = tr; }   // tensione: trema
      if (w.fase === 2) {
        const v = Math.hypot(w.vx, w.vy), sp = 1.6 - 1.2 * age / 18;
        if (nm === 'balzo' || nm === 'v_carica' || nm === 'v_artiglio') rot = Math.atan2(w.vy, Math.abs(w.vx)) * (dir > 0 ? 1 : -1) * .9;
        if (age < 6) { sx = 1 + .18 * sp / 1.6; sy = 1 - .1 * sp / 1.6; }   // stiramento nella direzione del volo
      }
      const al = o.alpha == null ? 1 : o.alpha;
      // sagome fantasma del volo (le ultime 4)
      if (w.fase === 2) {
        for (let i = 0; i < s.ghost.length; i++) { const g = s.ghost[i]; disegnaPosa(c, g.nm, g.x, g.y, H, gh, g.dir, g.rot, g.sx, g.sy, al * (.12 + .08 * i)); }
        s.ghost.push({ nm, x, y, dir, rot, sx, sy }); if (s.ghost.length > 4) s.ghost.shift();
        // linee di velocita' dietro al corpo
        const v = Math.hypot(w.vx, w.vy) || 1, ux = w.vx / v, uy = w.vy / v, sp = 1.6 - 1.2 * age / 18;
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const off = (i - 2) * H * .16, px = x - uy * off, py = y - H * .5 + ux * off, L = H * (.5 + .25 * ((i * 7 + s.k) % 3)) * sp;
          const g = c.createLinearGradient(px, py, px - ux * L, py - uy * L); g.addColorStop(0, 'rgba(220,200,255,' + (.5 * al) + ')'); g.addColorStop(1, 'rgba(180,140,255,0)');
          c.strokeStyle = g; c.lineWidth = H * .025; c.beginPath(); c.moveTo(px - ux * H * .3, py - uy * H * .3); c.lineTo(px - ux * (H * .3 + L), py - uy * (H * .3 + L)); c.stroke();
        }
        c.restore();
      }
      const r = disegnaPosa(c, nm, x, y, H, gh, dir, rot, sx, sy, al);
      polvere(c, s);
      if (r) {
        const loc = w.fase === 1 ? [r.iw * .45, -r.ih * .1] : [r.iw * .45, 0];
        const M = r.M, point = [M.a * loc[0] + M.c * loc[1] + M.e, M.b * loc[0] + M.d * loc[1] + M.f];
        WS.set(F, { point, H: H * Math.sqrt(Math.abs(M.a * M.d - M.b * M.c)), posa: nm, age });
      }
    };
    // anelli di polvere/aria sul muro, sul soffitto e all'atterraggio (coordinate del mondo)
    function polvere(c, s) {
      for (let i = s.polv.length - 1; i >= 0; i--) {
        const p = s.polv[i]; p.t++; if (p.t > 14) { s.polv.splice(i, 1); continue; }
        const u = p.t / 14, R = p.r * (.4 + .9 * u);
        // 20/10: al posto dell'anello e dei puntini, sbuffi di polvere cartoon attorno al punto (fumo_fx.js)
        if (root.GSFUMO && root.GSFUMO.pronto) { c.save(); c.globalAlpha *= (1 - u) * .85; for (let k = 0; k < 6; k++) { const a = k * 1.05 + p.r; root.GSFUMO.sbuffo(c, p.x + Math.cos(a) * R, p.y + Math.sin(a) * R * .55, p.r * (.22 + .2 * u), '#d6c8ec', k + (p.r | 0), 1 - u); } c.restore(); continue; }
        c.save(); c.globalAlpha *= (1 - u) * .7; c.strokeStyle = '#e9dcff'; c.lineWidth = p.r * .12 * (1 - u);
        c.beginPath(); c.ellipse(p.x, p.y, R, R * .55, 0, 0, Math.PI * 2); c.stroke();
        c.fillStyle = 'rgba(200,180,230,' + (.25 * (1 - u)) + ')';
        for (let k = 0; k < 6; k++) { const a = k * 1.05 + p.r; c.beginPath(); c.arc(p.x + Math.cos(a) * R * 1.1, p.y + Math.sin(a) * R * .6, p.r * .1 * (1 - u), 0, Math.PI * 2); c.fill(); }
        c.restore();
      }
    }
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

