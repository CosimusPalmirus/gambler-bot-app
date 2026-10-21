/* smash_look_1710 — CROUPIER: pose e effetti delle SPECIALI (21/10 notte).
   Proprietario: «devi migliorare e mettere molte più pose per le abilità del croupier» e «anche migliorare gli effetti
   speciali del croupier».
   - 20 pose AI alla scala dell'idle (croupier_va/spec_2110/*.webp, pose.json; fogli a due pannelli su fondo BLU perche' la
     visiera e' verde, scala misurata sulla testa, grana dell'atlante con strumenti/grana_atlante.py);
   - la posa la sceglie la fase della mossa (mf e r1/r2/r3 del motore: speciali.js SPE.croupier + esperti.js), con
     stiramento e schiacciamento; finita la parte disegnata qui torna la posa dell'atlante (rientro morbido);
   - effetti AI (croupier_va/spec_2110/fx: scia, lampo, scoppio, luccichii, falce, polvere d'oro, schegge di fiche,
     anello), disegnati in 'lighter': scia d'oro dietro le carte lanciate, falce del rastrello, gradini della SCALA REALE
     con le carte d'oro 10-J-Q-K-A (arte dell'ulti, croupier_ulti_2010/scala), scoppio dell'asso, carta servita armata con
     l'anello, esplosione della mina con le schegge di fiche, impatti d'oro sui colpi a segno.
   SOLO DISEGNO: legge lo stato del motore e gli eventi, non scrive niente. Pool fissi (32 effetti), niente allocazioni
   per fotogramma nel disegno. */
(function (root) {
  'use strict';
  const BASE = '/smash_look_1710/croupier_va/spec_2110/', SCALA_B = '/smash_look_1710/croupier_ulti_2010/scala/';
  const IMG = {}, META = {}, FXI = { im: null, r: null }, CARTE = [];
  let pronto = false, corrente = null, idleK = 0;
  const carica = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
  const ready = Promise.all([
    fetch(BASE + 'pose.json').then(r => r.json()).then(async j => { Object.assign(META, j); await Promise.all(Object.keys(j).map(async k => { IMG[k] = await carica(BASE + k + '.webp'); })); }),
    fetch(BASE + 'fx/fx.json').then(r => r.json()).then(async j => { FXI.r = j; FXI.im = await carica(BASE + 'fx/fx.webp'); }),
    Promise.all(['c10', 'cJ', 'cQ', 'cK', 'cA'].map(async (n, k) => { CARTE[k] = await carica(SCALA_B + n + '.webp'); })),
  ]).then(() => { pronto = true; });
  ready.catch(e => console.warn('Croupier speciali:', e));
  const TAU = Math.PI * 2;
  const MOSSE = { nspec: 1, cro_coppia: 1, cro_tris: 1, cro_scala: 1, cro_colore: 1, sspec: 1, uspec: 1, dspec: 1 };
  function mossa(F) { return F && F.id === 'croupier' && F.st === 'mossa' && MOSSE[F.mv] ? F.mv : null; }
  const ST = new WeakMap();
  function st(F) { let s = ST.get(F); if (!s) { s = { mv: null, mf: -1, aggancio: -1, dir0: 0, gira: 0, k: 0 }; ST.set(F, s); } return s; }

  // [posa, stiramento x, schiacciamento y, rotazione (gradi, avanti +), alzata in H] oppure null = posa dell'atlante
  function sequenza(F, mv, s) {
    const mf = F.mf;
    if (mv === 'nspec') {   // CARTA ALTA (calata senza combinazione): mostra la mano, carica, lancio al f 10, chiusura
      if (mf < 5) return ['n_mostra', 1, 1, 0, 0];
      if (mf < 10) { const q = (mf - 5) / 5; return ['n_carica', 1 - .05 * q, 1 + .04 * q, -4 * q, 0]; }
      if (mf < 16) return ['n_lancia', mf < 12 ? 1.08 : 1.02, mf < 12 ? .94 : .98, 3, 0];
      if (mf < 28) return ['n_dopo', 1, 1, 0, 0];
      return null;
    }
    if (mv === 'cro_coppia') {   // due carte forti al f 9
      if (mf < 9) { const q = mf / 9; return ['n_carica', 1 - .05 * q, 1 + .05 * q, -5 * q, 0]; }
      if (mf < 21) return ['k_coppia', mf < 12 ? 1.08 : 1, mf < 12 ? .93 : 1, 2, 0];
      if (mf < 31) return ['n_dopo', 1, 1, 0, 0];
      return null;
    }
    if (mv === 'cro_tris') {   // la sega di tre carte parte al f 10: caricamento laterale, lancio, chiusura
      if (mf < 10) { const q = mf / 10; return ['k_tris', 1 - .04 * q, 1 + .03 * q, -6 * q, 0]; }
      if (mf < 22) return ['n_lancia', mf < 13 ? 1.1 : 1.02, mf < 13 ? .92 : .98, 4, 0];
      if (mf < 35) return ['n_dopo', 1, 1, 0, 0];
      return null;
    }
    if (mv === 'cro_scala') {   // ghigliottina al f 10: braccio che si alza, poi cala (sentenza)
      if (mf < 10) { const q = mf / 10; return ['k_scala', .97, 1 + .06 * q, -3 * q, .03 * q]; }
      if (mf < 14) return ['k_scala', 1.08, .9, 4, 0];
      if (mf < 34) return ['k_scala', 1, 1, 0, 0];
      return null;
    }
    if (mv === 'cro_colore') {   // scoppio tutto intorno al f 8: si raccoglie, poi esplode a braccia aperte
      if (mf < 8) { const q = mf / 8; return ['s_balzo', 1 + .04 * q, 1 - .06 * q, 0, 0]; }
      if (mf < 12) return ['k_colore', 1.12, .9, 0, 0];
      if (mf < 34) return ['k_colore', 1, 1, 0, 0];
      return null;
    }
    if (mv === 'sspec') {   // RASTRELLO: caricamento, allungo (colpisce f 12-15), aggancio e trascinamento, spinta o ribaltata
      if (s.aggancio >= 0) {
        const dt = mf - s.aggancio;
        if (dt < 10) return ['r_tira', 1 + .02 * Math.sin(dt * 1.3), 1, -2, 0];
        if (dt < 22) return s.gira ? ['r_ribalta', dt < 13 ? .94 : 1, dt < 13 ? 1.08 : 1, 0, 0] : ['r_spinge', dt < 13 ? 1.1 : 1.02, dt < 13 ? .92 : .98, 3, 0];
        return null;
      }
      if (mf < 9) { const q = mf / 9; return ['r_carica', 1 - .05 * q, 1 + .05 * q, -5 * q, 0]; }
      if (mf < 12) return ['r_allunga', 1.12, .9, 2, 0];
      if (mf < 30) return ['r_allunga', 1, 1, 0, 0];   // a vuoto il rastrello resta giu' un attimo (punibile)
      if (mf < 38) return ['r_tira', 1, 1, 0, 0];
      return null;
    }
    if (mv === 'uspec') {   // SCALA REALE: un gradino ogni 8 f (dal f 4) finche' si tiene; all'asso la posa trionfale
      if (mf < 4) return ['s_balzo', 1.04, .9, 0, 0];
      const ph = (mf - 4) % 8, k = F.r1 | 0;
      if (k >= 5 && mf >= 37) return ['s_asso', 1, 1, 0, 0];
      if (F.r3 && mf >= F.r3) return ['s_sale', 1, 1, 0, 0];
      if (ph < 2) return ['s_sale', .94, 1.08, 0, 0];
      if (ph < 6) return ['s_sale', 1, 1, 0, 0];
      return ['s_gradino', 1.04, .95, 0, 0];
    }
    if (mv === 'dspec') {   // CARTA SERVITA: chino col palmo sulla carta (tieni = piu' lontano), la fa scivolare, si rialza
      if (!F.r2) { const q = Math.min(1, (F.r1 | 0) / 30); return ['d_prepara', 1 + .03 * q, 1 - .03 * q, Math.sin(mf * 1.7) * q * 1.2, 0]; }
      const dt = mf - F.r2;
      if (dt < 7) return ['d_serve', dt < 3 ? 1.1 : 1.02, dt < 3 ? .92 : .99, 0, 0];
      if (dt < 13) return ['d_rialza', 1, 1, 0, 0];
      return null;
    }
    return null;
  }

  // ------------------------------------------------------------------ effetti: pool fisso in coordinate del mondo
  const POOL = []; for (let i = 0; i < 32; i++) POOL.push({ t: 99, life: 1, nm: '', x: 0, y: 0, rot: 0, sc: 1, cresce: 0, al: 1, vx: 0, vy: 0, vr: 0 });
  function fx(nm, x, y, sc, life, o) {
    let p = POOL[0]; for (const q of POOL) if (q.t >= q.life) { p = q; break; }
    p.t = 0; p.life = life || 16; p.nm = nm; p.x = x; p.y = y; p.sc = sc; p.rot = (o && o.rot) || 0; p.cresce = (o && o.cresce) || 0;
    p.al = (o && o.al) || 1; p.vx = (o && o.vx) || 0; p.vy = (o && o.vy) || 0; p.vr = (o && o.vr) || 0;
  }
  function sprite(c, nm, x, y, w, rot, al, sx) {   // sprite dell'atlante FX centrato, larghezza w
    const r = FXI.r && FXI.r[nm]; if (!r || !FXI.im) return;
    const h = w * r[3] / r[2];
    c.save(); c.globalAlpha = al; c.translate(x, y); if (rot) c.rotate(rot); if (sx) c.scale(sx, 1);
    c.drawImage(FXI.im, r[0], r[1], r[2], r[3], -w / 2, -h / 2, w, h); c.restore();
  }
  function disegnaFx(c, H) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of POOL) {
      if (p.t >= p.life) continue;
      const u = p.t / p.life, a = p.al * (u < .15 ? u / .15 : 1 - (u - .15) / .85);
      sprite(c, p.nm, p.x + p.vx * p.t, p.y + p.vy * p.t, H * p.sc * (1 + p.cresce * u), p.rot + p.vr * p.t, Math.max(0, a));
    }
    c.restore();
  }
  function passoFx() { for (const p of POOL) if (p.t < p.life) p.t++; }

  // ------------------------------------------------------------------ eventi del motore
  const croupier = (S, i) => i >= 0 && S.L[i] && S.L[i].id === 'croupier';
  function evento(S, e) {
    const GS = root.GS; if (!GS) return;
    const A = e.a >= 0 ? S.L[e.a] : null, H = A ? GS.D(A).H : 60;
    switch (e.t) {
      case 'colpo': case 'colpoKO': {
        if (!croupier(S, e.a)) return;
        const forte = e.t === 'colpoKO' || e.v1 >= 11;
        fx('lampo', e.x, e.y, forte ? 1.3 : .8, forte ? 16 : 11, { rot: Math.random() * 6 });
        fx('luccichii', e.x, e.y, forte ? 1.4 : .9, 22, { cresce: .5 });
        if (forte) fx('schegge', e.x, e.y, 1.5, 20, { cresce: .6 });
        break;
      }
      case 'aggancio': if (croupier(S, e.a)) { fx('lampo', e.x, e.y - H * .5, .7, 10); fx('anello', e.x, e.y - H * .5, .8, 14, { cresce: .6, rot: 1 }); } break;
      case 'banco': if (croupier(S, e.a)) { fx('scoppio', e.x, e.y, 1.6, 20, { cresce: .3 }); fx('anello', e.x, e.y, 1.2, 22, { cresce: 1, vr: .08 }); } break;
      case 'boom': if (croupier(S, e.a)) { fx('scoppio', e.x, e.y - H * .2, 2, 22, { cresce: .4 }); fx('schegge', e.x, e.y - H * .2, 2.2, 26, { cresce: .8 }); fx('polvere', e.x, e.y - H * .05, 1.8, 30, { cresce: .5, vy: -.4, al: .7 }); } break;
      case 'trappola': if (croupier(S, e.a)) fx('anello', e.x, e.y - H * .12, .9, 18, { cresce: .8 }); break;
      case 'scala': if (croupier(S, e.a)) { fx('lampo', e.x, e.y, .6 + .12 * e.v1, 10); fx('polvere', e.x, e.y, .7, 18, { al: .55, vy: .5 }); } break;
      case 'x_calata': if (croupier(S, e.a) && e.v1 > 0) fx('anello', e.x, e.y, .9 + .2 * e.v1, 20, { cresce: .8, vr: .1 }); break;
      case 'servita': if (croupier(S, e.a)) fx('polvere', e.x + A.dir * H * .45, e.y, .6, 16, { al: .6, vx: A.dir * 1.2 }); break;
    }
  }

  // ------------------------------------------------------------------ proiettili del croupier: scie e carte d'oro
  function scia(c, P, H, lungo) {
    const v = Math.hypot(P.vx || 0, P.vy || 0); if (v < 1) return;
    const a = Math.atan2(P.vy || 0, P.vx || 0), L = H * (lungo || 1.1) * Math.min(1, v / 12);
    c.save(); c.globalCompositeOperation = 'lighter';
    sprite(c, 'scia', P.x - Math.cos(a) * L * .45, P.y - Math.sin(a) * L * .45, L, a, .85);
    c.restore();
  }
  function proiettile(c, S, P) {   // true = disegnato qui (il disegno vecchio non serve)
    const F = S.L[P.own]; if (!F || F.id !== 'croupier' || !pronto) return false;
    const H = root.GS.D(F).H, t = (P.life0 || P.life) - P.life;
    switch (P.fo) {
      case 'carta': scia(c, P, H, 1.2); if ((t & 3) === 0) fx('luccichii', P.x, P.y, .35, 10, { al: .6 }); return false;   // la carta resta quella di prima, con la scia d'oro
      case 'carta_scala': {   // gradino: la carta d'oro 10-J-Q-K-A di piatto sotto i piedi, con bagliore
        const k = Math.max(0, Math.min(4, P.a1 | 0)), im = CARTE[k]; if (!im) return false;
        const q = P.life / (P.life0 || 20), w = H * .62, h = w * im.naturalHeight / im.naturalWidth;
        c.save(); c.globalAlpha = Math.min(1, q * 2.5); c.translate(P.x, P.y + 2); c.scale(1, .34); c.drawImage(im, -w / 2, -h / 2, w, h); c.restore();
        c.save(); c.globalCompositeOperation = 'lighter'; sprite(c, 'polvere', P.x, P.y + 2, H * .8, 0, .35 * q); c.restore();
        return true;
      }
      case 'scala_reale': {   // all'asso: scoppio d'oro e le cinque carte che volano via a ventaglio
        const q = 1 - P.life / (P.life0 || 7);
        c.save(); c.globalCompositeOperation = 'lighter'; sprite(c, 'scoppio', P.x, P.y, H * (1.6 + 1.2 * q), q * 2, 1 - q * .6); sprite(c, 'luccichii', P.x, P.y, H * (1.4 + 1.8 * q), 0, 1 - q * .4); c.restore();
        for (let k = 0; k < 5; k++) {
          const im = CARTE[k]; if (!im) continue; const a = -Math.PI / 2 + (k - 2) * .45, R = H * (.3 + 1.4 * q), w = H * .42;
          c.save(); c.translate(P.x + Math.cos(a) * R, P.y + Math.sin(a) * R); c.rotate(a + Math.PI / 2 + q * (k - 2)); c.globalAlpha = 1 - q * .5;
          c.drawImage(im, -w / 2, -w * 1.47 / 2, w, w * 1.47); c.restore();
        }
        return true;
      }
      case 'carta_trap': {   // carta servita: scivola con la scia; armata = anello d'oro che pulsa sotto
        if (!P.fermo) { scia(c, P, H, .9); return false; }
        const pul = .75 + .25 * Math.sin(t * .25);
        c.save(); c.globalCompositeOperation = 'lighter'; c.translate(P.x, P.y - H * .04); c.scale(1, .4); sprite(c, 'anello', 0, 0, H * .95 * pul, t * .05, .55 * pul); c.restore();
        return false;
      }
      case 'x_sega': c.save(); c.globalCompositeOperation = 'lighter'; sprite(c, 'anello', P.x, P.y, H * 1.1, t * .4, .6); c.restore(); return false;
      case 'x_ghigliottina': { c.save(); c.globalCompositeOperation = 'lighter'; sprite(c, 'scia', P.x, P.y - H * .55, H * 1.3, -Math.PI / 2, .9); c.restore(); return false; }
      case 'x_colore': { const q = 1 - P.life / (P.life0 || 10); c.save(); c.globalCompositeOperation = 'lighter'; sprite(c, 'scoppio', P.x, P.y, H * (1.4 + 1.6 * q), q, 1 - q * .5); sprite(c, 'polvere', P.x, P.y, H * (1.2 + 1.4 * q), 0, .5 * (1 - q)); c.restore(); return false; }
    }
    return false;
  }

  function init() {
    const G = root.GBR, L = root.GSLOOK, E = root.GSE;
    if (!G || !L || !E || !E.corpo || !E.proj || !E.passo) return setTimeout(init, 60);
    const corpo = E.corpo;
    E.corpo = function (F, m) { return mossa(F) && pronto && sequenza(F, F.mv, st(F)) ? { r: 0, sx: 1, sy: 1, ox: 0, oy: 0, tr: 0 } : corpo.apply(this, arguments); };
    const load = G.load;
    if (load) G.load = async function (ids) { const r = await load.apply(this, arguments); if ((ids || []).includes('croupier')) await ready; return r; };
    const prima = L.prima, dopo = L.dopo, draw = G.draw;
    L.prima = function (F) { corrente = F; return prima.apply(this, arguments); };
    L.dopo = function () { const r = dopo.apply(this, arguments); corrente = null; return r; };
    const projO = E.proj;
    E.proj = function (c, S, P) { try { if (proiettile(c, S, P)) return true; } catch (e) { } return projO.apply(this, arguments); };
    const passoO = E.passo;
    E.passo = function (S) {
      const r = passoO.apply(this, arguments);
      try { passoFx(); const gs = root.GS; if (gs && gs.nev) { const n = gs.nev(); for (let k = 0; k < n; k++) evento(S, gs.EV[k]); } } catch (e) { }
      return r;
    };
    function altezzaIdle() {
      if (idleK) return idleK;
      if (!(window.GBR && GBR.pronto && GBR.pronto('croupier'))) return 1.0;   // 21/10 sera: misurare la sagoma provvisoria (atlante non pronto) salvava una scala sbagliata per sempre
      const cv = document.createElement('canvas'); cv.width = cv.height = 300; const x = cv.getContext('2d');
      draw.call(G, x, 'croupier', 150, 260, { pose: 'idle', t: 0, h: 100, facing: 1 });
      const d = x.getImageData(0, 0, 300, 300).data; let y0 = 300, y1 = -1;
      for (let y = 0; y < 300; y++) for (let X = 0; X < 300; X++) if (d[(y * 300 + X) * 4 + 3] > 40) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return (idleK = y1 > y0 ? (y1 - y0) / 100 : 1.0);
    }
    function posa(c, nm, gh, dir, sx, sy, rot, su, alpha) {
      const m = META[nm], im = IMG[nm]; if (!m || !im) return false;
      const k = gh * altezzaIdle() / m.guardia, iw = m.w * k, ih = m.h * k;
      c.save(); c.translate(0, -su * gh); c.rotate(rot * dir * Math.PI / 180); c.scale(dir * sx, sy);
      if (alpha != null) c.globalAlpha *= alpha;
      const pad = m.v >= 3 ? 4 * k : 0;   // grana_atlante.py: 4 px di margine (contorno): i piedi tornano a terra
      c.drawImage(im, -iw * .5, -ih + pad, iw, ih); c.restore(); return true;
    }
    G.draw = function (c, id, x, y, o) {
      const F = corrente;
      if (id !== 'croupier' || !F || F.id !== 'croupier' || !pronto) return draw.apply(this, arguments);
      const H = root.GS.D(F).H, al = o.alpha == null ? 1 : o.alpha, mv = mossa(F);
      let disegnato = false;
      if (mv) {
        const s = st(F), gh = o.h || H / .98, dir = F.dir < 0 ? -1 : 1;
        if (al >= .99 && !o.tintA) {
          if (s.mv !== mv || F.mf < s.mf - 2) { s.mv = mv; s.aggancio = -1; s.gira = 0; s.dir0 = F.dir; }
          if (mv === 'sspec' && F.r1 && s.aggancio < 0) { s.aggancio = F.r2 | 0; s.dir0 = F.dir; }
          if (mv === 'sspec' && s.aggancio >= 0 && F.dir !== s.dir0) s.gira = 1;
          const nuovo = F.mf !== s.mf; s.mf = F.mf; s.k++;
          // falce d'oro del rastrello: all'allungo (f 11-15) davanti, nella ribaltata sopra la testa
          if (nuovo && mv === 'sspec' && s.aggancio < 0 && F.mf >= 11 && F.mf <= 13) fx('falce', F.x + dir * H * .95, F.y - H * .45, 1.3, 9, { rot: dir > 0 ? .15 : Math.PI - .15, al: .9 });
          if (nuovo && mv === 'sspec' && s.gira && F.mf - s.aggancio === 10) fx('falce', F.x, F.y - H * 1.15, 1.6, 12, { rot: -Math.PI / 2, al: .9 });
          if (nuovo && (mv === 'nspec' && F.mf === 10 || mv === 'cro_coppia' && F.mf === 9 || mv === 'cro_tris' && F.mf === 10)) fx('lampo', F.x + dir * H * .6, F.y - H * .62, .6, 8);
          if (nuovo && mv === 'cro_scala' && F.mf === 10) fx('lampo', F.x + dir * H * .2, F.y - H * 1.1, .8, 10);
          if (nuovo && mv === 'cro_colore' && F.mf === 8) { fx('scoppio', F.x, F.y - H * .5, 2.2, 18, { cresce: .3 }); fx('luccichii', F.x, F.y - H * .5, 2.4, 26, { cresce: .6 }); }
          if (nuovo && mv === 'dspec' && !F.r2 && (F.mf & 3) === 0) fx('luccichii', F.x + dir * H * .5, F.y - H * .08, .35 + .4 * Math.min(1, (F.r1 | 0) / 30), 12);
        }
        const q = sequenza(F, mv, ST.get(F));
        if (q) { c.save(); c.translate(x, y); disegnato = posa(c, q[0], gh, dir, q[1], q[2], q[3], q[4], al); c.restore(); }
      }
      if (!disegnato) draw.apply(this, arguments);
      if (al >= .99 && !o.tintA) { c.save(); c.translate(x - F.x, y - F.y); disegnaFx(c, H); c.restore(); }   // effetti in coordinate del mondo
    };
  }
  root.GSCROUPIERFX = { pronta: () => ready, stato: F => ST.get(F), sequenza };
  init();
})(window);
