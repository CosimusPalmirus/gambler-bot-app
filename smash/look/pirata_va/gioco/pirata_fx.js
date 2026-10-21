/* smash_look_1710/pirata_va — effetti del PIRATA agganciati alle ANCORE della SCIABOLA misurate sugli sprite video
   (atlante: pose[k].ancore = [punta, base della lama] rispetto ai piedi). SOLO DISEGNO: nessuno stato del motore cambia.
   Regola del proprietario: effetti come contorno secondario, mai sul corpo. Colore: acciaio chiaro (bianco-azzurro).
   - scia sfumata lungo l'arco della punta nei fotogrammi attivi; nelle stoccate dritte una scia corta dietro la punta;
   - carica degli smash: riflesso che corre lungo la lama + bagliore piccolo sulla punta; lampo breve sulla punta al primo colpo;
   - lo sprite video non viene girato/stirato dai movimenti di corpo delle speciali (le pose sono gia' disegnate);
   - Mortaio (tenuto): la posa e' la carica (inginocchiato, mortaio puntato) finche' non spara, poi lo sparo (tPosa, solo disegno).
   Si aggancia a GSLOOK concatenando: gli altri lottatori restano com'erano. */
(function (root) {
  'use strict';
  const ID = 'pirata', TAU = Math.PI * 2;
  const CIA = 'dfe8ff';   // acciaio chiaro della sciabola
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

  // la lama "taglia" adesso? (fotogrammi attivi del motore, piu' i tagli delle speciali fatte a copione)
  function attiva(F, m) {
    if (!m) return false;
    if (F.mv === 'nspec' || F.mv === 'uspec' || F.mv === 'dspec' || F.mv === 'sspec') return false;   // mortaio, cannone, barile, rampino: niente scia della lama
    if (m.hb) for (const h of m.hb) if (!h.presa && F.mf >= h.f0 - 2 && F.mf <= h.f1 + 1) return true;
    return false;
  }
  function inCarica(F, m) {
    if (!m) return 0;
    if (m.carica && F.mc > 0 && F.mf === m.carica.f) return Math.min(1, F.mc / (m.carica.max || 60));
    return 0;
  }

  const L0 = root.GSLOOK || {};
  const L = root.GSLOOK = Object.assign({}, L0);
  // Mortaio (nspec, tenuto): finche' si tiene il tasto la posa resta la carica (t .2 nell'atlante), allo sparo (F.r2) parte lo sparo
  function tPosaMortaio(F, mf) {
    if (!F.r2) return Math.min(.2, .2 * mf / 10);
    const dt = mf - F.r2; if (dt < 3) return .2 + .12 * dt / 3;
    return Math.min(.749, .32 + .43 * (dt - 3) / 23);
  }
  L.prima = function (F) {
    if (F.id === ID) {
      tv++;
      try { const m = root.GS.mossaDi(root.GS.D(F), 'nspec'); if (m && !m.tPosa) m.tPosa = tPosaMortaio; } catch (e) { }
    }
    if (L0.prima) return L0.prima.apply(this, arguments);
  };
  L.niente_tinta_carica = function (F) { return F.id === ID || !!(L0.niente_tinta_carica && L0.niente_tinta_carica(F)); };
  L.scia = function () { if (L0.scia) return L0.scia.apply(this, arguments); };
  L.stato_pir = function (F) { return ST.get(F); };
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
    s.posa = nm; s.i = i; s.o = [M.e, M.f];
    const LG = root.GSLOOK || L;   // 19/10 qa_va: gli *_fx.js caricati dopo fanno altre copie di GSLOOK: il banco accende controllo/esiti sull'ultima
    if (LG.controllo && F.st === 'mossa') {        // banco: sotto l'ancora della punta c'e' davvero la lama (pixel ciano chiaro)?
      const p = s.g[0], x0 = Math.round(p[0]) - 4, y0 = Math.round(p[1]) - 4;
      let ok = 0; if (V && V.flash > 1) ok = -2; else if (p[0] < 4 || p[1] < 4 || p[0] > c.canvas.width - 5 || p[1] > c.canvas.height - 5) ok = -2; else try { const D = c.getImageData(x0, y0, 9, 9).data; for (let q = 0; q < D.length; q += 4) { const r = D[q], g = D[q + 1], b = D[q + 2]; if (Math.max(r, g, b) - Math.min(r, g, b) < 45 && Math.max(r, g, b) > 140) ok++; /* acciaio della lama */ } } catch (e) { ok = -1; }
      let px_ = null; if (L.marca) try { px_ = Array.from(c.getImageData(Math.round(p[0]), Math.round(p[1]), 1, 1).data).slice(0, 3); } catch (e) { }
      (LG.esiti_pir = LG.esiti_pir || []).push([nm, i, ok, F.mv, Math.round(p[0]), Math.round(p[1])].concat(px_ ? [px_.join('/')] : []));
    }
    const m = F.st === 'mossa' ? root.GS.mossaDi(d, F.mv) : null;
    const att = F.st === 'mossa' && attiva(F, m);
    const u = s.h[s.h.length - 1];
    if (!att || s.hp !== nm || (u && Math.hypot(u[0][0] - s.g[0][0], u[0][1] - s.g[0][1]) > s.r * 1.2)) s.h.length = 0;
    if (att) { s.h.push([s.g[0].slice(), s.g[1].slice()]); if (s.h.length > 5) s.h.shift(); }
    const f0 = m && m.hb && m.hb[0] ? m.hb[0].f0 : -9;
    if (att && m && SMASH[F.mv] && F.mf === f0) s.lampo = 3;
    if (att && F.mf === f0 && s.ultSc !== F.mf + ':' + F.mv) { s.ultSc = F.mf + ':' + F.mv; scintille(F, s.g[0], s.r || 100); }
    s.hp = nm;
    if (L.marca) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.lineWidth = 2; c.strokeStyle = '#0f0'; c.beginPath(); c.arc(s.g[0][0], s.g[0][1], 5, 0, TAU); c.stroke(); c.strokeStyle = '#00f'; c.beginPath(); c.arc(s.g[1][0], s.g[1][1], 5, 0, TAU); c.stroke(); c.restore(); }   // banco: dove stanno le ancore
    traccia(c, F);
    const q = F.st === 'mossa' ? inCarica(F, m) : 0;
    if (q > 0) carica(c, F, q);
    if (s.lampo > 0) { lampo(c, F, s.lampo / 3); s.lampo--; }
    scintillePasso(c, F);
  };

  // scia: striscia sfumata lungo l'arco della punta attorno alla base della lama, senza tratti pieni
  function traccia(c, F) {
    const s = st(F); const h = s.h; if (h.length < 2) return;
    const H = s.r || 100, n = h.length, cur = h[n - 1], bx = cur[1][0], by = cur[1][1];
    const R = Math.hypot(cur[0][0] - bx, cur[0][1] - by); if (R < H * .15) return;
    const ang = h.map(e => Math.atan2(e[0][1] - e[1][1], e[0][0] - e[1][0]));
    let tot = 0; const pas = [];
    for (let i = 1; i < n; i++) { let d = ang[i] - ang[i - 1]; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; pas.push(d); tot += Math.abs(d); }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
    if (tot < .25) {   // lama che avanza dritta (affondo, Lama fantasma): scia corta e sfumata dietro la punta, lungo la lama
      const p = cur[0], o = h[0][0], L2 = Math.hypot(p[0] - o[0], p[1] - o[1]);
      if (L2 > H * .08 && tot < .25) {
        const gr = c.createLinearGradient(o[0], o[1], p[0], p[1]);
        gr.addColorStop(0, 'rgba(' + hex(CIA) + ',0)'); gr.addColorStop(1, 'rgba(' + hex(CIA) + ',.32)');
        const nx = -(p[1] - o[1]) / L2, ny = (p[0] - o[0]) / L2, w = H * .03;
        c.fillStyle = gr; c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(p[0] + nx * w, p[1] + ny * w); c.lineTo(p[0] - nx * w, p[1] - ny * w); c.closePath(); c.fill();
      }
      c.restore(); return;
    }
    if (tot > 2.6) { c.restore(); return; }   // oltre 150 gradi il verso del giro e' ambiguo: niente scia
    const A = []; let acc = ang[0]; const passi = []; for (const d of pas) { for (let k = 0; k < 14; k++) passi.push(d / 14); }
    A.push(acc); for (const d of passi) { acc += d; A.push(acc); }
    const m = A.length - 1;
    for (const [ri, ro, col, al] of [[.62, 1.0, '60,190,255', .24], [.80, .975, '200,246,255', .36]]) {
      for (let k = 0; k < m; k++) {
        const u0 = k / m, u1 = (k + 1) / m, w0 = Math.pow(u0, .7), w1 = Math.pow(u1, .7);
        const r0i = R * (ro - (ro - ri) * w0), r1i = R * (ro - (ro - ri) * w1);
        const a0 = A[k], a1 = A[k + 1];
        c.globalAlpha = al * (u0 + u1) / 2;
        c.fillStyle = 'rgb(' + col + ')';
        c.beginPath();
        c.moveTo(bx + Math.cos(a0) * R * ro, by + Math.sin(a0) * R * ro); c.lineTo(bx + Math.cos(a1) * R * ro, by + Math.sin(a1) * R * ro);
        c.lineTo(bx + Math.cos(a1) * r1i, by + Math.sin(a1) * r1i); c.lineTo(bx + Math.cos(a0) * r0i, by + Math.sin(a0) * r0i); c.closePath(); c.fill();
      }
    }
    c.restore();
  }
  function hex(h) { return parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16); }
  // scintille piccole all'impatto (primo fotogramma attivo): brevi, ciano chiaro, sulla punta
  const SC = [];
  function scintille(F, p, H) { for (let k = 0; k < 6; k++) { const a = Math.random() * TAU, v = H * (.012 + Math.random() * .018); SC.push({ F, x: p[0], y: p[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v - H * .004, t: 0, T: 6 + (Math.random() * 5 | 0) }); } }
  function scintillePasso(c, F) {
    if (!SC.length) return;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = SC.length - 1; i >= 0; i--) {
      const q = SC[i]; if (q.F !== F) continue;
      q.t++; if (q.t > q.T) { SC.splice(i, 1); continue; }
      const u = 1 - q.t / q.T, x0 = q.x, y0 = q.y; q.x += q.vx; q.y += q.vy; q.vy += .25; q.vx *= .9; q.vy *= .9;
      const gr = c.createLinearGradient(x0, y0, q.x, q.y); gr.addColorStop(0, 'rgba(60,190,255,0)'); gr.addColorStop(1, 'rgba(215,250,255,' + (.85 * u) + ')');
      c.strokeStyle = gr; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(q.x, q.y); c.stroke();
    }
    c.restore();
  }
  // carica: riflesso che corre lungo la lama + bagliore piccolo sulla punta che cresce
  function carica(c, F, q) {
    const s = st(F); if (!s.g) return;
    const p = s.g[0], b = s.g[1], H = s.r || 100;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
    const u = (tv * .06) % 1, x = b[0] + (p[0] - b[0]) * u, y = b[1] + (p[1] - b[1]) * u;
    let gr = c.createRadialGradient(x, y, 0, x, y, H * (.035 + .03 * q));
    gr.addColorStop(0, 'rgba(235,252,255,.9)'); gr.addColorStop(1, 'rgba(' + hex(CIA) + ',0)');
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, H * (.035 + .03 * q), 0, TAU); c.fill();
    const r = H * (.04 + .06 * q);
    gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
    gr.addColorStop(0, 'rgba(235,252,255,' + (.5 + .4 * q) + ')'); gr.addColorStop(.45, 'rgba(' + hex(CIA) + ',' + (.3 + .2 * q) + ')'); gr.addColorStop(1, 'rgba(' + hex(CIA) + ',0)');
    c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill();
    c.restore();
  }
  function lampo(c, F, k) {
    const s = st(F); if (!s.g) return; const p = s.g[0], H = s.r || 100;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .6 * k;
    const gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], H * .22);
    gr.addColorStop(0, 'rgba(240,252,255,.95)'); gr.addColorStop(.4, 'rgba(' + hex(CIA) + ',.5)'); gr.addColorStop(1, 'rgba(' + hex(CIA) + ',0)');
    c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], H * .22, 0, TAU); c.fill(); c.restore();
  }
  function filo(c, F, al) {
    const s = st(F); if (!s.g) return; const p = s.g[0], b = s.g[1], H = s.r || 100;
    const x0 = b[0] + (p[0] - b[0]) * .25, y0 = b[1] + (p[1] - b[1]) * .25;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    const gr = c.createLinearGradient(x0, y0, p[0], p[1]); gr.addColorStop(0, 'rgba(' + hex(CIA) + ',0)'); gr.addColorStop(.6, 'rgba(' + hex(CIA) + ',' + (.35 * al) + ')'); gr.addColorStop(1, 'rgba(235,252,255,' + (.55 * al) + ')');
    c.strokeStyle = gr; c.lineWidth = Math.max(2, H * .03); c.beginPath(); c.moveTo(x0, y0); c.lineTo(p[0], p[1]); c.stroke(); c.restore();
  }
  // bagliore morbido (radiale) in coordinate del mondo (ctx con la trasformazione della scena)
  function alone(c, x, y, r, al, col) {
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(' + (col || hex(CIA)) + ',' + al + ')'); gr.addColorStop(1, 'rgba(' + (col || hex(CIA)) + ',0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
  }
  // sbuffi di fumo grigio morbidi (Bomba fumogena), nel mondo
  const FUMO = [];
  function fumo(x, y, H) { for (let k = 0; k < 7; k++) { const a = k * TAU / 7 + Math.random() * .5; FUMO.push({ x: x + Math.cos(a) * H * .18, y: y - H * (.15 + Math.random() * .5), vx: Math.cos(a) * H * .012, vy: -H * (.004 + Math.random() * .006), r: H * (.22 + Math.random() * .12), t: 0, T: 26 + (Math.random() * 10 | 0) }); } }
  function fumoPasso(c) {
    if (!FUMO.length) return;
    c.save();
    for (let i = FUMO.length - 1; i >= 0; i--) {
      const q = FUMO[i]; q.t++; if (q.t > q.T) { FUMO.splice(i, 1); continue; }
      const u = q.t / q.T; q.x += q.vx; q.y += q.vy; q.vx *= .95;
      const r = q.r * (.7 + u * .8);
      if (root.GSFUMO && root.GSFUMO.pronto) { c.globalAlpha = .8 * (1 - u); root.GSFUMO.sbuffo(c, q.x, q.y, r * .8, q.col ? 'rgb(' + q.col + ')' : '#9a98ad', i, 1 - u); continue; }   // 20/10: nuvolette cartoon (fumo_fx.js)
      const gr = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      gr.addColorStop(0, 'rgba(150,150,165,' + (.55 * (1 - u)) + ')'); gr.addColorStop(1, 'rgba(150,150,165,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(q.x, q.y, r, 0, TAU); c.fill();
    }
    c.restore();
  }
  // X dell'Esecuzione: due strisce sfumate a fuso (niente tratti bianchi pieni)
  function fuso(c, x0, y0, x1, y1, w, al) {
    const L2 = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L2, ny = (x1 - x0) / L2, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    for (const [k, col, a] of [[1, hex(CIA), .3], [.4, '235,252,255', .5]]) {
      const gr = c.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, 'rgba(' + col + ',0)'); gr.addColorStop(.5, 'rgba(' + col + ',' + (a * al) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(x0, y0); c.lineTo(mx + nx * w * k, my + ny * w * k); c.lineTo(x1, y1); c.lineTo(mx - nx * w * k, my - ny * w * k); c.closePath(); c.fill();
    }
  }

  function aggancia() {
    const X = root.GSE && root.GSE._int && root.GSE._int.FX;
    if (!X || !root.GSE.scia || !root.GSE.corpo) return setTimeout(aggancia, 50);
    const T = root.GSE._int;
    const scia0 = root.GSE.scia;
    root.GSE.scia = function (c, S, F) { if (F.id === ID) return true; return scia0.apply(this, arguments); };
    // movimento del corpo delle speciali: lo sprite video non si gira e non si stira (le pose sono gia' disegnate)
    const corpo0 = root.GSE.corpo;
    root.GSE.corpo = function (F, m) {
      const cp = corpo0.apply(this, arguments);
      if (F.id !== ID) return cp;
      cp.sx = 1; cp.sy = 1; cp.r = 0; cp.ox = 0; cp.oy = 0; if (cp.tr) cp.tr = Math.min(cp.tr, .012);
      return cp;
    };
    // in carica niente particelle del tema attorno al corpo
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

  // menu di scelta: finche' smash_1410/ritratti/ninja.webp e' quello vecchio, nella pagina di prova la cella prende il ritratto
  // nuovo dell'atlante (pirata_ritratto.webp)
  const RIT = (root.GBR3D_BASE || '') + ID + '_ritratto.webp';
  function ritratti() { document.querySelectorAll('img[src$="ritratti/' + ID + '.webp"]').forEach(im => { im.src = RIT; }); }
  try { new MutationObserver(ritratti).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) { }
  setInterval(ritratti, 500);
})(window);
