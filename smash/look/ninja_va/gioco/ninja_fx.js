/* smash_look_1710/ninja_va — effetti del NINJA agganciati alle ANCORE misurate sugli sprite video (atlante: pose[k].ancore,
   per fotogramma, [punta della lama, base della lama] rispetto ai piedi). SOLO DISEGNO: nessuno stato del motore cambia.
   Regola del proprietario: gli effetti sono un contorno secondario, mai sul corpo. Colore: ciano morbido (come la lama).
   - scia SFUMATA lungo l'arco della punta della lama nei fotogrammi attivi (normali, smash, Lama fantasma, Esecuzione);
   - carica (smash tenuti, carica dell'Esecuzione): riflesso che corre lungo la lama + bagliore piccolo sulla punta;
   - smash: bagliore per un istante sulla punta al primo fotogramma attivo; scintille piccole all'impatto;
   - al posto degli effetti vecchi che passavano sul corpo: linea dritta della Lama fantasma, raggi dell'Esecuzione verso
     la mano, X bianca dell'Esecuzione (ora due strisce sfumate ciano davanti a lui), anello duro della Bomba fumogena
     (ora sbuffi di fumo grigio morbidi), anello dell'ombra all'arrivo;
   - lo sprite video NON viene girato/schiacciato dai movimenti di corpo delle speciali (giri di 28 gradi dello Shuriken,
     stiramento della Lama fantasma): le pose sono gia' disegnate. Resta solo il rimpicciolirsi uniforme della Bomba fumogena
     (sparisce nel fumo e riappare) e il piccolo tremito della carica.
   Si aggancia a GSLOOK (campione_fx.js / lupo_fx.js) concatenando: gli altri restano com'erano. */
(function (root) {
  'use strict';
  const ID = 'ninja', TAU = Math.PI * 2;
  const CIA = '69e4ff';   // ciano della lama
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
    if (F.mv === 'sspec') { const s0 = F.r1 ? 3 : 8; return F.mf >= s0 && F.mf <= s0 + 9; }
    if (F.mv === 'nin_es') return F.mf >= 6 && F.mf <= 11;
    if (F.mv === 'nspec' || F.mv === 'uspec' || F.mv === 'dspec') return false;
    if (m.hb) for (const h of m.hb) if (!h.presa && F.mf >= h.f0 - 2 && F.mf <= h.f1 + 1) return true;
    if (m.mant && F.mf >= m.mant.f0 && F.mf <= m.mant.f1 && F.mv !== 'dash') return true;
    return false;
  }
  function inCarica(F, m) {
    if (!m) return 0;
    if (m.carica && F.mc > 0 && F.mf === m.carica.f) return Math.min(1, F.mc / (m.carica.max || 60));
    if (F.mv === 'nin_es' && F.mf < 6) return Math.min(1, (F.mf + 1) / 6);
    return 0;
  }

  const L0 = root.GSLOOK || {};
  const L = root.GSLOOK = Object.assign({}, L0);
  L.prima = function (F) { if (F.id === ID) tv++; if (L0.prima) return L0.prima.apply(this, arguments); };
  L.niente_tinta_carica = function (F) { return F.id === ID || !!(L0.niente_tinta_carica && L0.niente_tinta_carica(F)); };
  L.scia = function () { if (L0.scia) return L0.scia.apply(this, arguments); };
  L.stato_nin = function (F) { return ST.get(F); };
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
      let ok = 0; if (V && V.flash > 1) ok = -2; else if (p[0] < 4 || p[1] < 4 || p[0] > c.canvas.width - 5 || p[1] > c.canvas.height - 5) ok = -2; else try { const D = c.getImageData(x0, y0, 9, 9).data; for (let q = 0; q < D.length; q += 4) { const r = D[q], g = D[q + 1], b = D[q + 2]; if (b > 170 && g > 150 && b - r > 60) ok++; } } catch (e) { ok = -1; }
      (LG.esiti_nin = LG.esiti_nin || []).push([nm, i, ok, F.mv, Math.round(p[0]), Math.round(p[1])]);
    }
    const m = F.st === 'mossa' ? root.GS.mossaDi(d, F.mv) : null;
    if (F.st === 'mossa' && F.mv === 'nin_es' && F.mf <= 2) { if (!s.sfod) { s.sfod = 1; SUONO.sfodera(); } } else if (F.mv !== 'nin_es' || F.st !== 'mossa') s.sfod = 0;
    const att = F.st === 'mossa' && attiva(F, m);
    const u = s.h[s.h.length - 1];
    if (!att || s.hp !== nm || (u && Math.hypot(u[0][0] - s.g[0][0], u[0][1] - s.g[0][1]) > s.r * 1.2)) s.h.length = 0;
    if (att) { s.h.push([s.g[0].slice(), s.g[1].slice()]); if (s.h.length > 5) s.h.shift(); }
    const f0 = m && m.hb && m.hb[0] ? m.hb[0].f0 : (F.mv === 'nin_es' ? 6 : F.mv === 'sspec' ? (F.r1 ? 3 : 8) : -9);
    if (att && m && (SMASH[F.mv] || F.mv === 'nin_es') && F.mf === f0) s.lampo = 3;
    if (att && F.mf === f0 && s.ultSc !== F.mf + ':' + F.mv) { s.ultSc = F.mf + ':' + F.mv; scintille(F, s.g[0], s.r || 100); }
    s.hp = nm;
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
      if (root.GSFUMO && root.GSFUMO.pronto) { c.globalAlpha = .8 * (1 - u); root.GSFUMO.sbuffo(c, q.x, q.y, r * .8, '#9a98ad', i, 1 - u); continue; }   // 20/10: nuvolette cartoon (fumo_fx.js)
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

  // ---- ESECUZIONE: taglio che attraversa lo schermo (durata ~0,45 s) ----
  const ES = [];
  const T_FERMO = 6, T_APRE = 18, T_FINE = 28;   // fotogrammi: linea ferma, si apre, svanisce
  function esecuzioneBuio(c) {
    if (!ES.length) return;
    let k = 0; for (const e of ES) k = Math.max(k, e.t < T_FERMO ? 1 : Math.max(0, 1 - (e.t - T_FERMO) / 10));
    if (k <= 0) return;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(2,6,14,' + (.32 * k) + ')'; c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore();
  }
  function esecuzioneTaglio(c) {
    for (let i = ES.length - 1; i >= 0; i--) {
      const e = ES[i]; e.t++;
      if (e.t > T_FINE) { ES.splice(i, 1); continue; }
      const M = c.getTransform(), px = M.a * e.x + M.c * e.y + M.e, py = M.b * e.x + M.d * e.y + M.f, sc = Math.hypot(M.a, M.b), H = e.H * sc;
      const ang = -e.dir * .2, ux = Math.cos(ang) * e.dir, uy = Math.sin(ang), nx = -uy, ny = ux, L = c.canvas.width * 1.2;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      const riga = (off, w, col, al) => {
        const x0 = px - ux * L + nx * off, y0 = py - uy * L + ny * off, x1 = px + ux * L + nx * off, y1 = py + uy * L + ny * off;
        const gr = c.createLinearGradient(x0, y0, x1, y1);
        gr.addColorStop(0, 'rgba(' + col + ',0)'); gr.addColorStop(.42, 'rgba(' + col + ',' + al * .6 + ')'); gr.addColorStop(.5, 'rgba(' + col + ',' + al + ')'); gr.addColorStop(.58, 'rgba(' + col + ',' + al * .6 + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
        c.strokeStyle = gr; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      };
      if (e.t <= T_FERMO) {   // linea netta e sottile, ferma: l'istante sospeso
        const q = Math.min(1, e.t / 2);
        riga(0, Math.max(3, H * .06), hex(CIA), .25 * q); riga(0, Math.max(1.5, H * .012), '235,252,255', .95 * q);
      } else {               // si apre: due fili che si separano e svaniscono, scintille lungo il taglio
        const u = Math.min(1, (e.t - T_FERMO) / (T_APRE - T_FERMO)), off = H * .16 * u, al = 1 - Math.max(0, (e.t - T_FERMO) / (T_FINE - T_FERMO));
        for (const s of [1, -1]) { riga(s * off, Math.max(2, H * .03), hex(CIA), .35 * al); riga(s * off, Math.max(1, H * .008), '235,252,255', .7 * al); }
        if (e.t === T_FERMO + 1) for (let k = 0; k < 26; k++) {
          const d = (Math.random() - .5) * H * 3.2, v = H * (.01 + Math.random() * .03), s = Math.random() < .5 ? 1 : -1;
          e.sc.push({ x: px + ux * d, y: py + uy * d, vx: nx * s * v + ux * (Math.random() - .5) * v, vy: ny * s * v + uy * (Math.random() - .5) * v, t: 0, T: 8 + (Math.random() * 10 | 0), b: Math.random() < .4 });
        }
      }
      for (const q of e.sc) {   // scintille: tratti brevi ciano e bianchi
        if (q.t > q.T) continue; q.t++; const x0 = q.x, y0 = q.y; q.x += q.vx; q.y += q.vy; q.vx *= .9; q.vy = q.vy * .9 + H * .002;
        const a = 1 - q.t / q.T, gr = c.createLinearGradient(x0, y0, q.x, q.y);
        gr.addColorStop(0, 'rgba(' + hex(CIA) + ',0)'); gr.addColorStop(1, q.b ? 'rgba(255,255,255,' + a + ')' : 'rgba(' + hex(CIA) + ',' + a + ')');
        c.strokeStyle = gr; c.lineWidth = Math.max(1, H * .012); c.beginPath(); c.moveTo(x0, y0); c.lineTo(q.x, q.y); c.stroke();
      }
      if (e.t >= 3 && e.t <= 22) {   // kanji piccolo sopra il punto del colpo, poi svanisce
        const a = e.t < 6 ? (e.t - 3) / 3 : 1 - (e.t - 6) / 16;
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.max(0, a) * .9;
        c.font = '900 ' + Math.round(H * .34) + 'px "Yu Mincho", "MS Mincho", "Noto Serif JP", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = Math.max(2, H * .03); c.strokeStyle = 'rgba(4,20,30,.85)'; c.strokeText('斬', px - e.dir * H * 1.1, py - H * 1.05);
        c.fillStyle = '#e8fcff'; c.fillText('斬', px - e.dir * H * 1.1, py - H * 1.05);
      }
      c.restore();
    }
  }
  // ---- suono dell'Esecuzione: WebAudio proprio (audio.js non espone il suo contesto), volume tarato sui colpi del gioco ----
  const SUONO = (function () {
    let ac = null, out = null, nb = null;
    function pronto() {
      const G = root.GSS; if (!G) return false;
      if (!ac) {
        const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return false;
        ac = new AC(); const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.connect(ac.destination);
        out = ac.createGain(); out.gain.value = .72; out.connect(comp);
        nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
      return ac.state === 'running';
    }
    function rum(t0, dur, f0, f1, tipo, q, vol) {
      const s = ac.createBufferSource(); s.buffer = nb; const f = ac.createBiquadFilter(); f.type = tipo; f.Q.value = q;
      f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      const g = ac.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .004); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(out); s.start(t0); s.stop(t0 + dur + .02);
    }
    function ton(t0, dur, f0, f1, tipo, vol, att) {
      const o = ac.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      const g = ac.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + (att || .003)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + .02);
    }
    return {
      // sfoderata: fruscio metallico che sale + tre parziali inarmoniche che suonano (sring)
      sfodera() {
        if (!pronto()) return; const t = ac.currentTime;
        rum(t, .16, 2500, 9000, 'bandpass', 3, .16);
        [2637, 3951, 5274].forEach((f, k) => ton(t + .03, .34 - k * .06, f * 1.004, f, 'sine', .07 - k * .015, .006));
      },
      // taglio secco + colpo basso (piu' pieno con la catena lunga); il silenzio prima e' il tempo fra la carica e il colpo
      taglio(n) {
        if (!pronto()) return; const t = ac.currentTime + .045;   // un respiro di silenzio dopo la sfoderata
        rum(t, .07, 9000, 3000, 'highpass', 1.5, .5);
        ton(t, .09, 3400, 800, 'square', .12);
        ton(t + .01, .7 + n * .05, 95, 30, 'sine', .75);
        rum(t + .01, .45, 900, 60, 'lowpass', .8, .35 + n * .04);
      },
    };
  })();

  function aggancia() {
    const X = root.GSE && root.GSE._int && root.GSE._int.FX;
    if (!X || !X.attraversa || !root.GSE.scia || !X.esecuzione_neon) return setTimeout(aggancia, 50);
    const T = root.GSE._int;
    const scia0 = root.GSE.scia;
    root.GSE.scia = function (c, S, F) { if (F.id === ID) return true; return scia0.apply(this, arguments); };
    // movimento del corpo delle speciali: lo sprite video non si gira e non si stira (le pose sono gia' disegnate)
    const corpo0 = root.GSE.corpo;
    root.GSE.corpo = function (F, m) {
      const cp = corpo0.apply(this, arguments);
      if (F.id !== ID) return cp;
      if (F.mv === 'uspec') { const s = Math.min(cp.sx, cp.sy); cp.sx = s; cp.sy = s; }
      else { cp.sx = 1; cp.sy = 1; }
      cp.r = 0; cp.ox = 0; cp.oy = 0; if (cp.tr) cp.tr = Math.min(cp.tr, .012);
      return cp;
    };
    const nin = (f0, nuovo) => function (c, o) { if (o.F && o.F.id === ID) return nuovo(c, o); return f0.apply(this, arguments); };
    X.shuriken_catena = nin(X.shuriken_catena, (c, o) => {   // lampo piccolo dove parte la stella (f 6 e 12), niente stella finta in mano
      const H = o.H; if (o.t === 6 || o.t === 7 || o.t === 12 || o.t === 13) alone(c, o.x + o.dir * H * .45, o.y - H * (o.t < 9 ? .62 : .5), H * .09, .35);
    });
    X.lama_catena = nin(X.lama_catena, () => { });          // la linea dritta sul corpo non c'e' piu': c'e' la scia della lama
    X.esecuzione_neon = nin(X.esecuzione_neon, () => { });  // i raggi verso la mano non ci sono piu': la carica sta sulla lama
    X.fumo_catena = nin(X.fumo_catena, (c, o) => {
      const ft = o.F.r1 ? 6 : 12;
      if ((o.t === 3 || o.t === ft) && st(o.F).fumo !== o.t) { st(o.F).fumo = o.t; fumo(o.x, o.y, o.H); }
    });
    const firme0 = root.GSE.disegnaFirme;   // il fumo resta anche dopo la fine della mossa: si disegna col resto della scena
    root.GSE.disegnaFirme = function (c) { const r = firme0.apply(this, arguments); fumoPasso(c); return r; };
    const att0 = X.attraversa, sca0 = X.scatto_taglio, par0 = X.parata;
    X.attraversa = function (c, o) { if (o.F && o.F.id === ID) return; return att0.apply(this, arguments); };
    X.scatto_taglio = function (c, o) { if (o.F && o.F.id === ID) return; return sca0.apply(this, arguments); };
    X.parata = function (c, o) { if (o.F && o.F.id === ID) { if (o.t >= 3 && o.t <= 11) filo(c, o.F, .5 + .3 * Math.sin(o.t)); return; } return par0.apply(this, arguments); };
    const proj0 = root.GSE.proj;
    root.GSE.proj = function (c, S, P) {
      const F = S && S.L ? S.L[P.own] : null;
      if (F && F.id === ID) {
        if (P.fo === 'x_lama') return true;   // la Lama fantasma si vede dalla scia della lama vera
        if (P.fo === 'x_ombra') { alone(c, P.x, P.y, P.r * .9, .35 * Math.min(1, P.life / 3)); return true; }
        if (P.fo === 'x_esecuzione') {
          const r = P.r, Lx = r * 1.4, q = Math.min(1, (P.t + 1) / 3), al = Math.min(1, P.life / 3);
          c.save(); c.globalCompositeOperation = 'lighter';
          for (const s of [1, -1]) fuso(c, P.x - Lx * q, P.y - s * Lx * q, P.x + Lx * q, P.y + s * Lx * q, r * .16, al);
          c.restore();
          return true;
        }
      }
      return proj0.apply(this, arguments);
    };
    // ESECUZIONE (fine della combo speciale verso giu', 18/10 sera): al posto del lampo su tutto lo schermo e della scritta grande
    // di esperti_fx, un TAGLIO pulito: linea ciano sottile che attraversa lo schermo nel punto del colpo, ferma un istante, poi si
    // apre in due con scintille ciano e bianche; per un attimo lo sfondo si scurisce (sotto i lottatori, mai sopra) e compare un
    // kanji piccolo (斬, «taglio»). Suono proprio: sfoderata metallica, silenzio brevissimo, taglio secco e colpo basso.
    const nev0 = root.GS.nev;
    root.GS.nev = function () {
      const n = nev0.apply(this, arguments), E = root.GS.EV;
      for (let k = 0; k < n; k++) {
        const e = E[k]; if (!e || e.t !== 'x_esecuzione') continue;
        const S = root.__smash && root.__smash.S, F = S && S.L ? S.L.find(q => q.p === e.a) : null;
        if (!F || F.id !== ID) continue;
        e.t = 'x_esecuzione_nin';
        ES.push({ x: e.x, y: e.y, n: e.v1 || 0, t: 0, H: root.GS.D(F).H, dir: F.dir < 0 ? -1 : 1, sc: [] });
        SUONO.taglio(e.v1 || 0);
      }
      return n;
    };
    if (root.GSFX && root.GSFX.dietro) {   // oscuramento SOLO dello sfondo: disegnato prima dei lottatori
      const d0 = root.GSFX.dietro;
      root.GSFX.dietro = function (c) { const r = d0.apply(this, arguments); esecuzioneBuio(c); return r; };
    }
    const firme1 = root.GSE.disegnaFirme;
    root.GSE.disegnaFirme = function (c) { const r = firme1.apply(this, arguments); esecuzioneTaglio(c); return r; };
    // tema: nello svolazzo della lama niente stelle grandi (solo fumo leggero); colori ciano come la lama nuova
    if (T.TM && T.TM[ID]) {
      const th = T.TM[ID], Zf = th.s && th.s[0];
      if (Zf) th.s = [Zf, Zf];
      th.dc = th.g = th.r = th.tc = '#' + CIA; th.pg = -1; th.pr = -1;
    }
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
  // nuovo dell'atlante (ninja_ritratto.webp)
  const RIT = (root.GBR3D_BASE || '') + ID + '_ritratto.webp';
  function ritratti() { document.querySelectorAll('img[src$="ritratti/' + ID + '.webp"]').forEach(im => { im.src = RIT; }); }
  try { new MutationObserver(ritratti).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) { }
  setInterval(ritratti, 500);
})(window);
