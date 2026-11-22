(function () {
  'use strict';
  var W = window, D = document;
  if (W.COS11B_OFF || W.COS11B) return;
  var C = W.COS11B = { v: '2011b', err: [] };
  function warn(k, e) { try { if (C.err.length < 30) C.err.push(k + ': ' + (e && e.message || e)); console.warn('[COS11B] ' + k, e); } catch (_) { } }
  function mx(sl) { try { return (TVL_MAX && TVL_MAX[sl]) | 0; } catch (e) { return 0; } }
  function ok(sl, v) { v = v | 0; return (v >= 1 && v <= mx(sl)) ? v : 0; }
  function mio(sl) { try { return ok(sl, (tvlLook() || {})[sl]); } catch (e) { return 0; } }
  function sk(sl, uid) { try { return typeof W.tv3Sk === 'function' ? W.tv3Sk(sl, uid) : 0; } catch (e) { return 0; } }
  function daInfo(info, sl) { return ok(sl, info && info.tvl ? info.tvl[sl] : 0); }
  function set(sl, i) { try { var l = (W.TV3G && TV3G.NUOVI[sl]) || []; for (var k = 0; k < l.length; k++) if (l[k].idx === i) return l[k].c; } catch (e) { } return null; }
  C.mio = mio; C.sk = sk;
  var AL = { k: {} };
  C.alley = function (raw) {
    var bb = raw.bombs || [], ps = raw.p || [], vivi = {}, i, j;
    for (i = 0; i < bb.length; i++) {
      var b = bb[i], k = b[0] + '_' + b[1];
      if (!(k in AL.k)) {
        var chi = null, dm = 1.6;
        for (j = 0; j < ps.length; j++) { var p = ps[j], d = Math.abs(p[1] - b[0]) + Math.abs(p[2] - b[1]); if (p[3] && d < dm) { dm = d; chi = p[0]; } }
        AL.k[k] = chi;
      }
      vivi[k] = 1;
      b.__oro = AL.k[k] != null && sk('al', AL.k[k]) === 1;
    }
    for (var q in AL.k) if (!vivi[q]) delete AL.k[q];
  };
  var PZ_T = { 1: { c: '#f1efe9', s: '#6b6b6b', d: '#1c1c1c', ds: '#000000' }, 2: { c: '#e5e7eb', s: '#6b7280', d: '#d4af37', ds: '#5a4300' } };
  C.damaPz = function (raw, v, mineP) {
    var seat = raw.seat || 0, own = (v === 1 || v === 2) ? 0 : 1, u = Object.keys(raw.sc || {})[own];
    var i = u != null ? sk('pz', u) : 0; if (!PZ_T[i]) return null;
    var lato = (own === seat) ? 'c' : 'd', t = PZ_T[i];
    return lato === 'c' ? { c: t.c, s: t.s } : { c: t.d, s: t.ds };
  };
  C.bgTono = function (raw) { var v = raw && raw.turn != null ? sk('dd', raw.turn) : 0; return v === 1 ? 'gold' : v === 2 ? 'd2' : v === 3 ? 'd3' : 'white'; };
  var BGT = {
    d2: { lato: '#7a0a1e', dx: '#5c0716', su: ['#ff8a9c', '#b3102f'], pip: '#ffd34d', pipB: '#fff1b0', pipC: '#8a6400' },
    d3: { lato: 'rgba(120,160,210,.6)', dx: 'rgba(90,130,190,.55)', su: ['rgba(238,246,255,.97)', 'rgba(160,198,240,.8)'], pip: '#1e3a8a', pipB: '#3b5bb8', pipC: '#0b1a44' }
  };
  function bake(val, tone, S, big) {
    var T = BGT[tone], Dm = Math.ceil(S * 3.6);
    return rtdSprite('cs11bg' + val + '_' + tone + '_' + S + (big ? 'b' : ''), Dm, Dm, function (x) {
      var ss = S / 13, i;
      x.translate(Dm / 2, Dm / 2); x.scale(ss, ss);
      x.fillStyle = T.lato; bgRR(x, -13, -13 + 2.8, 26, 26, 5); x.fill();
      x.fillStyle = T.dx; bgRR(x, -13 + 2.8, -13 + 1.2, 26, 26, 5); x.fill();
      var gt = x.createLinearGradient(0, -13, 0, 13); gt.addColorStop(0, T.su[0]); gt.addColorStop(1, T.su[1]);
      x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 6; x.shadowOffsetY = 3;
      x.fillStyle = gt; bgRR(x, -13, -13, 26, 26, 5); x.fill();
      x.shadowBlur = 0; x.shadowOffsetY = 0;
      x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-10, -11); x.lineTo(10, -11); x.stroke();
      if (big) { x.fillStyle = T.pip; x.font = 'bold 15px Russo One, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('' + val, 0, 1); }
      else {
        var P = bgPips[val] || [];
        for (i = 0; i < P.length; i++) {
          var px = P[i][0] * 4.6, py = P[i][1] * 4.6, pg = x.createRadialGradient(px - .8, py - .8, .3, px, py, 2.9);
          pg.addColorStop(0, T.pipB); pg.addColorStop(.7, T.pip); pg.addColorStop(1, T.pipC);
          x.fillStyle = pg; x.beginPath(); x.arc(px, py, 2.7, 0, 6.283); x.fill();
        }
      }
    });
  }
  C.bgSpr = function (o, S, big) { ['d2', 'd3'].forEach(function (t) { o[t] = [null]; for (var v = 1; v <= 6; v++) o[t][v] = bake(v, t, S, big); }); };
  C.bgDraw = function (ctx, cx, cy, val, o) {
    if (!o || !BGT[o.tone]) return false;
    var S = o.S || 13, spr = bake(val, o.tone, S, !!o.big), d = spr.width, sc = o.scale || 1;
    ctx.save(); ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha); ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot);
    ctx.scale(sc * (o.sx || 1), sc * (o.sy || 1)); ctx.drawImage(spr, -d / 2, -d / 2);
    if (o.ring) { var rs = S / 13; ctx.scale(rs, rs); ctx.strokeStyle = o.ring; ctx.lineWidth = 2.2; bgRR(ctx, -14.5, -14.5, 29, 29, 6); ctx.stroke(); }
    ctx.restore(); return true;
  };
  function cos3d(G, o, k) { if (!G || typeof G.cosmetici !== 'function') return; var s = JSON.stringify(o); if (G.__cs11 === s) return; G.__cs11 = s; try { G.cosmetici(o); } catch (e) { warn('tav3d', e); } }
  function aggancia3d() {
    if (typeof W.tv3dFotogramma === 'function' && !W.tv3dFotogramma.__cs11) {
      var f0 = W.tv3dFotogramma;
      var f = function (g, ctx, raw) {
        var r = f0.apply(this, arguments);
        if (r && raw) try {
          var G = TV3D.g, ks = Object.keys(raw.sc || {}), o = {};
          if (g === 'backg') { o.dd = {}; ks.forEach(function (u) { o.dd[u] = sk('dd', u); }); }
          else { var st = raw.seat || 0; o.pz = { tu: ks[st] != null ? sk('pz', ks[st]) : 0, lui: ks[1 - st] != null ? sk('pz', ks[1 - st]) : 0 }; }
          cos3d(G, o);
        } catch (e) { warn('tv3d', e); }
        return r;
      };
      f.__cs11 = 1; W.tv3dFotogramma = f;
    }
    if (typeof W.tv3dScGiro === 'function' && !W.tv3dScGiro.__cs11) {
      var g0 = W.tv3dScGiro;
      var g2 = function () {
        var r = g0.apply(this, arguments);
        try {
          var s = TV3D.sc;
          if (s && s.g && s.avviato && s.modo === 'gioco' && W.DLCH && DLCH.view) {
            var io = mio('pz'), lui = oppSk(DLCH.view, 'pz'), bianco = DLCH.color !== 'b';
            cos3d(s.g, { pz: { w: bianco ? io : lui, b: bianco ? lui : io } });
          }
        } catch (e) { warn('tv3dsc', e); }
        return r;
      };
      g2.__cs11 = 1; W.tv3dScGiro = g2;
    }
  }
  var V = {};
  ['dlRrBoard', 'dlRpsBoard', 'dlBsBoard', 'dlChBoard'].forEach(function (n) {
    var o = W[n]; if (typeof o !== 'function' || o.__cs11) return;
    var f = function (d) { V[n] = d || V[n]; var r = o.apply(this, arguments); presto(); return r; };
    f.__cs11 = 1; for (var k in o) { try { f[k] = o[k]; } catch (e) { } } W[n] = f;
  });
  C.V = V;
  if (typeof W.dlVsScreen === 'function' && !W.dlVsScreen.__cs11) {
    var vs0 = W.dlVsScreen;
    var vs1 = function (d) { try { var y = !!(d && d.you_p1); C.oppVs = d ? { info: (y ? d.p2_info : d.p1_info) || null, nome: String((y ? d.p2_name : d.p1_name) || '') } : null; } catch (e) { } return vs0.apply(this, arguments); };
    vs1.__cs11 = 1; W.dlVsScreen = vs1;
  }
  function oppSk(view, sl) {
    if (!view) return 0;
    var v = daInfo(view.opp_info, sl); if (v) return v;
    var o = C.oppVs; if (!o || view.pratica || !o.nome || String(view.opp_name || '') !== o.nome) return 0;
    return daInfo(o.info, sl);
  }
  C.oppSk = oppSk;
  function cls(el, pre, val, max) { if (!el) return; for (var i = 1; i <= max; i++) el.classList.toggle(pre + i, val === i); }
  function swap(img, nuovo) { if (img && img.getAttribute('src') !== nuovo) img.setAttribute('src', nuovo); }
  var RE_XMR = /^xmr_(rock|paper|scissors)(?:_v|_mo1)?\.webp$/;
  function sincronizza() {
    var ov = D.getElementById('pvp-overlay');
    var dc = D.getElementById('dice'); if (dc) cls(dc, 'cs11-dd', mio('dd'), 3);
    if (!ov) return;
    var bsv = V.dlBsBoard; cls(ov, 'cs11-bs', mio('bs'), 1); cls(ov, 'cs11-bso', oppSk(bsv, 'bs'), 1);
    var gun = D.getElementById('dlrr-gun');
    if (gun && V.dlRrBoard) { var rr = V.dlRrBoard, chi = rr.your_turn ? mio('rv') : oppSk(rr, 'rv'); swap(gun, chi === 1 ? 'rr_revolver_rv1.webp' : 'rr_revolver.png'); gun.classList.toggle('cs11-rv1', chi === 1); }
    var rp = V.dlRpsBoard;
    if (rp) {
      var mm = mio('mo'), lm = oppSk(rp, 'mo');
      if ((mm || lm) && !C.preMo) { C.preMo = ['rock', 'paper', 'scissors'].map(function (k) { var i = new Image(); i.src = 'xmr_' + k + '_mo1.webp'; return i; }); }
      [].forEach.call(ov.querySelectorAll('img.xmr-im'), function (im) {
        var m = RE_XMR.exec(im.getAttribute('src') || ''); if (!m) return;
        var lui = !!(im.closest && im.closest('.xmr-h.lui')), v = lui ? lm : mm;
        swap(im, v === 1 ? 'xmr_' + m[1] + '_mo1.webp' : 'xmr_' + m[1] + (lui ? '_v' : '') + '.webp');
      });
    }
    var cb = ov.querySelector('#ch-board');
    if (cb && V.dlChBoard && W.DLCH) {
      var io = mio('pz'), op = oppSk(DLCH.view || V.dlChBoard, 'pz'), bianco = DLCH.color !== 'b';
      cls(cb, 'cs11-pzw', bianco ? io : op, 2); cls(cb, 'cs11-pzb', bianco ? op : io, 2);
    }
    var dy = D.getElementById('dl-die-y'), dO = D.getElementById('dl-die-o');
    if (dy) cls(dy, 'cs11-dd', mio('dd'), 3);
    if (dO) { var ot = 0; try { ot = ok('dd', W.DD3 && DD3.oppTvl ? DD3.oppTvl.dd : 0); } catch (e) { } cls(dO, 'cs11-dd', ot, 3); }
  }
  var giro = 0;
  function presto() { if (giro) return; giro = 1; (W.requestAnimationFrame || setTimeout)(function () { giro = 0; try { sincronizza(); } catch (e) { warn('sinc', e); } }); }
  C.sincronizza = sincronizza;
  function cssDadi() {
    var P = { 1: [[45, 45]], 2: [[27, 27], [63, 63]], 3: [[25, 25], [45, 45], [65, 65]], 4: [[27, 27], [63, 27], [27, 63], [63, 63]], 5: [[25, 25], [65, 25], [45, 45], [25, 65], [65, 65]], 6: [[27, 23], [63, 23], [27, 45], [63, 45], [27, 67], [63, 67]] };
    var ST = { 1: ['#1a1204', 'linear-gradient(155deg,#ffe27a,#b8860b)'], 2: ['#ffd34d', 'linear-gradient(155deg,#ff5a74,#6a0014)'], 3: ['#1e3a8a', 'linear-gradient(155deg,rgba(214,236,255,.92),rgba(150,190,235,.55))'] };
    var s = '';
    for (var k = 1; k <= 3; k++) for (var f = 1; f <= 6; f++) {
      var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 90 90'><g fill='" + ST[k][0] + "'>" + P[f].map(function (p) { return "<circle cx='" + p[0] + "' cy='" + p[1] + "' r='" + (f === 1 ? 8 : 7) + "'/>"; }).join('') + '</g></svg>';
      var u = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") center/100% no-repeat,' + ST[k][1] + '!important}\n';
      s += '#pvp-overlay.xz-g-dice #dl-die-y.cs11-dd' + k + '[data-f="' + f + '"],#pvp-overlay.xz-g-dice #dl-die-o.cs11-dd' + k + '[data-f="' + f + '"]{background:' + u;
    }
    try { var st = D.createElement('style'); st.id = 'cos2011b-dadi'; st.textContent = s; D.head.appendChild(st); } catch (e) { warn('css', e); }
  }
  var RE_XQD = /^xqd_(tu|lui)_(pronto|spara|colpito)(?:_rv1)?\.webp$/;
  function agganciaDraw() {
    if (typeof W.rtdDrawDrawG !== 'function' || W.rtdDrawDrawG.__cs11) return;
    var o = W.rtdDrawDrawG, ult = { el: null, k: '' };
    var f = function (ctx, raw) {
      var r = o.apply(this, arguments);
      try {
        var st = D.getElementById('xqd-stage'); if (!st || !raw) return r;
        var ks = Object.keys(raw.sc || {}), me = (W.RTD && !RTD.spec && RTD.myId != null) ? String(RTD.myId) : (ks[0] || null), op = null;
        ks.forEach(function (k) { if (String(k) !== String(me)) op = k; });
        var vt = me != null ? sk('rv', me) : 0, vl = op != null ? sk('rv', op) : 0, k = vt + '|' + vl;
        if (ult.el === st && ult.k === k && !st.__cs11nuovo) return r;
        ult.el = st; ult.k = k;
        [].forEach.call(st.querySelectorAll('.xqd-po img'), function (im) {
          var m = RE_XQD.exec(im.getAttribute('src') || ''); if (!m) return;
          var v = m[1] === 'tu' ? vt : vl; swap(im, 'xqd_' + m[1] + '_' + m[2] + (v === 1 ? '_rv1' : '') + '.webp');
        });
      } catch (e) { warn('draw', e); }
      return r;
    };
    f.__cs11 = 1; f._xqd = o._xqd; W.rtdDrawDrawG = f;
  }
  var FATTI = { alley: 'al', dama: 'pz', bs: 'bs', draw: 'rv', rps: 'mo', kaiju: 'kj', lupus: 'lp', geo: 'gb', deadmoney: 'dm', abisso: 'ab' };
  function segna() {
    try {
      var T = W.TV3G; if (!T || !T.GIOCHI) return false;
      T.GIOCHI.forEach(function (g) { if (FATTI[g.k]) g.gioco = true; });
      Object.keys(FATTI).forEach(function (k) { if (T.NEL_GIOCO) T.NEL_GIOCO[FATTI[k]] = 1; });
      return true;
    } catch (e) { warn('segna', e); return false; }
  }
  function defs() {
    if (D.getElementById('cs11-defs')) return;
    var s = '<svg id="cs11-defs" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true"><defs>' +
      '<pattern id="cs11-marmo" patternContentUnits="objectBoundingBox" width="1" height="1"><rect width="1" height="1" fill="#f1efe9"/>' +
      '<path d="M0 .3C.2 .25 .3 .45 .55 .4S.8 .2 1 .28M0 .72C.25 .66 .4 .8 .6 .7S.85 .55 1 .62M.2 0C.25 .2 .15 .35 .3 .55" fill="none" stroke="#9a9a9a" stroke-width=".035"/></pattern>' +
      '<pattern id="cs11-onice" patternContentUnits="objectBoundingBox" width="1" height="1"><rect width="1" height="1" fill="#141414"/>' +
      '<path d="M0 .35C.2 .3 .35 .5 .6 .42S.85 .25 1 .3M0 .75C.3 .7 .45 .82 .7 .72" fill="none" stroke="#5a5a5a" stroke-width=".035"/><rect x=".12" y=".05" width=".12" height=".9" fill="rgba(255,255,255,.12)"/></pattern>' +
      '<linearGradient id="cs11-argento" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#cbd5e1"/><stop offset="1" stop-color="#8b97a8"/></linearGradient>' +
      '<linearGradient id="cs11-oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#d4af37"/><stop offset="1" stop-color="#7a5600"/></linearGradient>' +
      '</defs></svg>';
    try { D.body.insertAdjacentHTML('beforeend', s); } catch (e) { warn('defs', e); }
  }
  function avvio() {
    defs(); segna(); aggancia3d(); agganciaDraw(); cssDadi();
    try {
      var ov = D.getElementById('pvp-overlay');
      if (ov && W.MutationObserver) new MutationObserver(presto).observe(ov, { childList: true, subtree: true });
    } catch (e) { warn('osserva', e); }
    setInterval(presto, 1500);
    presto();
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
