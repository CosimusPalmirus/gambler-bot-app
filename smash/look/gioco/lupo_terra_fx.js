/* smash_look_1710 — LUPO: MORSO A TERRA (variante della speciale giù su un nemico disteso), 21/10.
   Proprietario: «quando usa speciale in giù su un nemico atterrato parte un'animazione apposta del lupo che attacca il
   nemico atterrato, così si può collegare la speciale normale con la speciale giù» e poi «migliora gli effetti e
   l'animazione». Motore: lupo_mannaro.js morsoTerra (F.rT 1 = in corso, 2 = lanciato da terra; F.r2 = fotogrammi di
   presa; F.r3 = attacchi; tempi = TERRA: balzo 1-9, inchioda al 10, attacchi dal 15 ogni 6, poi lo strappo).
   Qui solo il DISEGNO, con 10 pose AI intere (lupo_terra_2110/*.webp, grana dell'atlante) e gli effetti AI
   (lupo_terra_2110/fx/fx.webp: morso con le zanne, graffi, onda a terra, anello d'urto, scintille, schegge, pelo, stella):
   - balzo: stacco (t_stacco) -> volo ad arco (t_salto) con sagome -> discesa ad artigli (t_cade) con le scie;
   - inchioda (t_inchioda): onda a terra, schegge, polvere a sprite, scossa;
   - attacchi alternati, ognuno con l'anticipo: MORSO (t_fauci -> t_morso -> t_scossa, esplosione con le zanne e
     scintille) e ARTIGLIATA (t_artiglio -> t_inchioda -> t_scossa, graffi a tre artigli e ciuffi di pelo);
   - strappo (t_strappo) con l'anello d'urto, la stella e le schegge; poi si rialza (t_rialza) e torna il morso normale.
   Caricato da gioco/index.html DOPO lupo_morso_fx.js (lo avvolge). SOLO DISEGNO: legge lo stato, non lo scrive. */
(function (root) {
  'use strict';
  const BASE = '/smash_look_1710/lupo_terra_2110/';
  const T = { SALTO: 9, PRIMO: 15, PASSO: 6 };   // uguali a TERRA in lupo_mannaro.js
  const IMG = {}, META = {}, FX = { im: null, j: null }; let pronto = false, corrente = null, idleK = 0;
  const ready = Promise.all([
    fetch(BASE + 'pose.json').then(r => { if (!r.ok) throw Error('pose terra'); return r.json(); }).then(async j => {
      Object.assign(META, j);
      await Promise.all(Object.keys(j).map(async k => { const im = new Image(); im.src = BASE + k + '.webp'; await im.decode(); IMG[k] = im; }));
    }),
    fetch(BASE + 'fx/fx.json').then(r => r.json()).then(async j => { const im = new Image(); im.src = BASE + 'fx/fx.webp'; await im.decode(); FX.im = im; FX.j = j; }),
  ]).then(() => { pronto = true; });
  ready.catch(e => console.warn('Lupo terra:', e));
  const TAU = Math.PI * 2;
  const terra = F => F && F.id === 'lupo' && F.st === 'mossa' && F.mv === 'dspec' && (F.rT === 1 || (F.rT === 2 && F.mf < 29));
  const morsoN = j => j % 2 === 0;   // attacchi pari = morso, dispari = artigliata
  // [posa, stiramento x, schiacciamento y, rotazione (gradi, avanti +), sollevamento (in H), avanti (in H)]
  function sequenza(F) {
    if (F.rT === 2) {   // strappo e rialzo (il motore riparte da mf 18)
      const m = F.mf;
      if (m < 20) return ['t_strappo', 1.1, .92, -4, 0, .05];
      if (m < 24) return ['t_strappo', 1, 1, 0, 0, 0];
      return ['t_rialza', 1, 1, 0, 0, 0];
    }
    const dt = F.r2;
    if (dt <= 2) return ['t_stacco', 1.06, .9, 0, 0, 0];
    if (dt <= T.SALTO) {
      const q = (dt - 2) / (T.SALTO - 2), su = .55 * Math.sin(Math.min(1, q * 1.15) * Math.PI);
      return dt <= 6 ? ['t_salto', 1.05, 1, 6 * q, su, 0] : ['t_cade', 1, 1.04, 0, su, 0];
    }
    if (dt < T.PRIMO - 2) { const u = (dt - T.SALTO - 1) / 2; return ['t_inchioda', 1.12 - .06 * u, .86 + .07 * u, 0, 0, 0]; }
    if (dt < T.PRIMO) return [morsoN(0) ? 't_fauci' : 't_artiglio', 1, 1, -3, 0, 0];   // anticipo del primo attacco
    const j = Math.floor((dt - T.PRIMO) / T.PASSO), p = (dt - T.PRIMO) % T.PASSO, fine = j + 1 >= F.r3;
    if (p < 2) return morsoN(j) ? ['t_morso', 1.08 - .04 * p, .93 + .03 * p, 4, 0, .04] : ['t_inchioda', 1.08 - .04 * p, .92 + .04 * p, 2, 0, .03];
    if (p < 4) return ['t_scossa', 1 + .03 * (3 - p), 1, (j % 4 < 2 ? -5 : 5) * (p === 2 ? 1 : .5), 0, 0];
    if (fine) return ['t_inchioda', 1.04, .95, 0, 0, -.02];   // si carica per lo strappo
    return [morsoN(j + 1) ? 't_fauci' : 't_artiglio', 1, 1, -3, 0, -.02];
  }
  const ST = new WeakMap();
  function st(F) { let s = ST.get(F); if (!s) { s = { r2: -1, rT: 0, mf: 0, k: 0, fx: [], ghost: [], scia: [] }; ST.set(F, s); } return s; }
  // un pezzo dell'atlante degli effetti, centrato in (x, y), largo w (in px del mondo)
  function pezzo(c, nm, x, y, w, rot, fl, alpha) {
    const r = FX.j && FX.j[nm]; if (!r) return;
    const h = w * r[3] / r[2];
    c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (fl) c.scale(fl, 1); c.globalAlpha *= alpha;
    c.drawImage(FX.im, r[0], r[1], r[2], r[3], -w / 2, -h / 2, w, h); c.restore();
  }

  function init() {
    const G = root.GBR, L = root.GSLOOK; if (!G || !L || !root.GSE || !root.GSE.corpo || !root.GSLUPOMORSO) return setTimeout(init, 60);
    const load = G.load;
    if (load) G.load = async function (ids) { const r = await load.apply(this, arguments); if ((ids || []).includes('lupo')) await ready; return r; };
    const prima = L.prima, dopo = L.dopo, draw = G.draw;
    L.prima = function (F) { corrente = F; return prima.apply(this, arguments); };
    L.dopo = function () { const r = dopo.apply(this, arguments); corrente = null; return r; };
    function altezzaIdle() {
      if (idleK) return idleK;
      const cv = document.createElement('canvas'); cv.width = cv.height = 300; const x = cv.getContext('2d');
      draw.call(G, x, 'lupo', 150, 260, { pose: 'idle', t: 0, h: 100, facing: 1 });
      const d = x.getImageData(0, 0, 300, 300).data; let y0 = 300, y1 = -1;
      for (let y = 0; y < 300; y++) for (let X = 0; X < 300; X++) if (d[(y * 300 + X) * 4 + 3] > 40) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return (idleK = y1 > y0 ? (y1 - y0) / 100 : 1.11);
    }
    function posa(c, nm, gh, dir, sx, sy, rot, alpha) {
      const m = META[nm], im = IMG[nm]; if (!m || !im) return;
      const k = gh * altezzaIdle() / m.guardia, iw = m.w * k, ih = m.h * k, pad = m.v >= 3 ? 4 * k : 0;
      c.save(); c.rotate(rot * dir * Math.PI / 180); c.scale(dir * sx, sy);
      if (alpha != null) c.globalAlpha *= alpha;
      c.drawImage(im, -iw * .5, -ih + pad, iw, ih); c.restore();
    }
    const scossa = v => { if (root.GSD && root.GSD.scossa) root.GSD.scossa(v); };
    const nuvola = (x, y, w) => { if (root.GSFUMO && root.GSFUMO.nuvola) root.GSFUMO.nuvola(x, y, w); };
    G.draw = function (c, id, x, y, o) {
      const F = corrente;
      if (id !== 'lupo' || !terra(F) || !pronto) return draw.apply(this, arguments);
      const H = root.GS.D(F).H, gh = o.h || H / 1.1, dir = F.dir < 0 ? -1 : 1, al = o.alpha == null ? 1 : o.alpha;
      const [nm, sx, sy, rot, su, av] = sequenza(F);
      if (al < .99 || o.tintA) { c.save(); c.translate(x + dir * av * H, y - su * H); posa(c, nm, gh, dir, sx, sy, rot, al); c.restore(); return; }
      const s = st(F);
      if (F.rT === 1 && (s.rT !== 1 || F.r2 < s.r2)) { s.fx.length = 0; s.ghost.length = 0; s.scia.length = 0; }   // presa nuova
      const nuovo = F.r2 !== s.r2 || F.rT !== s.rT || F.mf !== s.mf; s.k++;
      const bx = F.x + dir * H * .5, by = F.y - H * .14;   // dove sta il nemico disteso sotto il lupo
      if (nuovo && F.rT === 1) {
        const dt = F.r2;
        if (dt === T.SALTO + 1) {   // INCHIODA
          s.fx.push({ t: 0, tipo: 'onda', x: bx, y: F.y, w: H * 1.9 }, { t: 0, tipo: 'schegge', x: bx, y: F.y - H * .1, w: H * .9 }, { t: 0, tipo: 'stella', x: bx, y: by, w: H * .7 });
          nuvola(bx - dir * H * .3, F.y, H * .8); scossa(.45);
        }
        if (dt >= T.PRIMO && (dt - T.PRIMO) % T.PASSO === 0) {
          const j = (dt - T.PRIMO) / T.PASSO;
          if (morsoN(j)) { s.fx.push({ t: 0, tipo: 'morso', x: bx + dir * H * .05, y: by - H * .05, w: H * 1.05 }, { t: 0, tipo: 'scintille', x: bx, y: by - H * .2, w: H * .9 }); scossa(.25); }
          else { s.fx.push({ t: 0, tipo: 'graffio', x: bx, y: by - H * .05, w: H * 1.1, fl: dir }, { t: 0, tipo: 'pelo', x: bx + dir * H * .1, y: by - H * .25, w: H * .55, fl: dir }, { t: 0, tipo: 'onda', x: bx, y: F.y, w: H * 1.1, piccola: 1 }); scossa(.2); }
          nuvola(bx + dir * H * .35, F.y, H * .32);
        }
      }
      if (nuovo && F.rT === 2 && s.rT === 1) {   // STRAPPO
        s.fx.push({ t: 0, tipo: 'anello', x: bx, y: by - H * .25, w: H * 2 }, { t: 0, tipo: 'stella', x: bx, y: by - H * .25, w: H * 1.2 },
          { t: 0, tipo: 'schegge', x: bx, y: F.y - H * .1, w: H * 1.2 }, { t: 0, tipo: 'scintille', x: bx + dir * H * .3, y: by - H * .5, w: H * 1.3 });
        nuvola(bx, F.y, H * .9); scossa(.6);
      }
      // scie degli artigli nel balzo (coordinate del mondo): punta delle zampe davanti
      const inVolo = F.rT === 1 && F.r2 >= 3 && F.r2 <= T.SALTO;
      if (inVolo && nuovo) s.scia.push({ x: F.x + dir * H * .45, y: F.y - su * H - H * .15, t: s.k });
      while (s.scia.length && s.k - s.scia[0].t > 9) s.scia.shift();
      c.save(); c.translate(x, y);
      if (inVolo) for (let i = 0; i < s.ghost.length; i++) { const g = s.ghost[i]; c.save(); c.translate(g.x - F.x, -g.su * H); c.globalCompositeOperation = 'lighter'; posa(c, g.nm, gh, dir, 1, 1, g.rot, al * (.1 + .07 * i)); c.restore(); }
      if (inVolo && nuovo) { s.ghost.push({ x: F.x, su, rot, nm }); if (s.ghost.length > 3) s.ghost.shift(); }
      if (!inVolo) s.ghost.length = 0;
      c.save(); c.translate(dir * av * H, -su * H); posa(c, nm, gh, dir, sx, sy, rot, al); c.restore();
      c.restore();
      s.r2 = F.r2; s.rT = F.rT; s.mf = F.mf;
      c.save(); c.translate(x - F.x, y - F.y);   // coordinate del mondo
      scie(c, s, H);
      effetti(c, s, dir);
      c.restore();
    };
    function scie(c, s, H) {
      const S = s.scia; if (S.length < 2) return;
      const u = S[S.length - 1], vita = Math.max(0, 1 - (s.k - u.t) / 7); if (vita <= 0) return;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let a = -1; a <= 1; a++) {   // tre artigli
        const g = c.createLinearGradient(S[0].x, S[0].y, u.x, u.y);
        g.addColorStop(0, 'rgba(150,90,255,0)'); g.addColorStop(1, 'rgba(235,215,255,' + (.8 * vita) + ')');
        c.strokeStyle = g; c.lineWidth = H * (.035 - .008 * Math.abs(a)) * vita;
        c.beginPath(); c.moveTo(S[0].x, S[0].y + a * H * .07);
        for (let i = 1; i < S.length; i++) c.lineTo(S[i].x, S[i].y + a * H * .07);
        c.stroke();
      }
      c.restore();
    }
    // durate e sequenze dei pezzi AI (fotogrammi): [nome, da, a]
    const SEQ = {
      morso: [['morso1', 0, 2], ['morso2', 2, 7], ['morso3', 7, 12], ['morso4', 12, 18]],
      graffio: [['graffio1', 0, 2], ['graffio2', 2, 7], ['graffio3', 7, 13]],
      onda: [['onda1', 0, 4], ['onda2', 4, 10], ['onda3', 10, 17]],
      anello: [['anello1', 0, 3], ['anello2', 3, 9], ['anello3', 9, 15], ['anello4', 15, 22]],
      scintille: [['scintille', 0, 14]], schegge: [['schegge', 0, 16]], pelo: [['pelo', 0, 16]], stella: [['stella', 0, 8]],
    };
    function effetti(c, s, dir) {
      if (!FX.im) return;
      for (let i = s.fx.length - 1; i >= 0; i--) {
        const f = s.fx[i], q = SEQ[f.tipo], fine = q[q.length - 1][2];
        if (f.t >= fine) { s.fx.splice(i, 1); continue; }
        const p = q.find(e => f.t >= e[1] && f.t < e[2]), u = (f.t - p[1]) / (p[2] - p[1]), tot = f.t / fine;
        let w = f.w, al = 1, x = f.x, y = f.y, rot = 0;
        if (f.tipo === 'morso') { w *= .85 + .3 * tot; al = f.t < 12 ? 1 : 1 - u; }
        else if (f.tipo === 'graffio') { w *= 1 + .1 * tot; al = f.t < 7 ? 1 : 1 - u; rot = dir * .15; }
        else if (f.tipo === 'onda') { w *= (f.piccola ? .8 : .7) + .6 * tot; al = 1 - tot * tot; y -= w * .02; }
        else if (f.tipo === 'anello') { w *= .5 + .9 * Math.sqrt(tot); al = f.t < 9 ? 1 : 1 - (f.t - 9) / 13; }
        else if (f.tipo === 'stella') { w *= 1.3 - .6 * tot; al = 1 - tot; rot = tot * .6; }
        else if (f.tipo === 'scintille') { w *= .8 + .7 * tot; al = 1 - tot; y -= f.w * .4 * tot; }
        else if (f.tipo === 'schegge') { w *= .8 + .6 * tot; al = 1 - tot * tot; y -= f.w * .25 * Math.sin(tot * Math.PI); }
        else if (f.tipo === 'pelo') { w *= .8 + .4 * tot; al = 1 - tot; y -= f.w * .5 * tot; x += (f.fl || 1) * f.w * .4 * tot; rot = (f.fl || 1) * tot * .8; }
        c.save(); if (f.tipo !== 'schegge' && f.tipo !== 'pelo') c.globalCompositeOperation = 'lighter';
        pezzo(c, p[0], x, y, w, rot, f.fl && f.tipo === 'graffio' ? -f.fl : f.fl || 0, Math.max(0, al));
        c.restore();
        f.t++;
      }
    }
    root.GSLUPOTERRA = { pronta: () => ready, stato: F => ST.get(F) };
  }
  init();
})(window);
