(function () {
  'use strict';
  if (window.RC3) return;
  if (typeof rtdDrawRace !== 'function' || typeof rcCarOf !== 'function') return;
  var RC_3D = true;
  var VER = String(window.RC3D_VER || 'dev');
  var MAX_ATTESA = 8000, MAX_CARICA = 6000;
  var RC3 = window.RC3 = { v: '1711', fr: null, g: null, host: null, err: null, gl2: null, giu: null, nato: 0,
    avviato: false, svelato: false, mappa: null, st: null, fpsT: 0, prontoT: 0, lentoT: 0, look: {}, frame: 0 };
  var RC3_MOD = ['cuneo', 'muscle', 'tuner', 'rally', 'pickup', 'formula', 'kei'];
  var RC3_NOMI = ['CUNEO', 'MUSCLE', 'TUNER', 'RALLY', 'PICK-UP', 'FORMULA', 'KEI'];
  var RC3_FAM = [[0, 0], [1, 0], [0, 1], [3, 1], [3, 0], [2, 0], [3, 2]];
  var RC3_DA = [[0, 2], [1], [5], [4, 3, 6]];
  function hexRgb(h) { if (!/^#[0-9a-fA-F]{6}$/.test(h || '')) return null; var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbHex(c) { return '#' + c.map(function (v) { return ('0' + (v & 255).toString(16)).slice(-2); }).join(''); }
  function rcVariante(hex) { var c = hexRgb(hex); if (!c) return 0; return ((c[0] & 3) === 2 && (c[2] & 3) === 1) ? (c[1] & 3) : 0; }
  function rcConVariante(hex, v) {
    var c = hexRgb(hex) || [136, 146, 168];
    if (!v) return (rcVariante(hex) ? rgbHex([c[0] ^ 1, c[1], c[2]]) : rgbHex(c));
    return rgbHex([(c[0] & 252) | 2, (c[1] & 252) | (v & 3), (c[2] & 252) | 1]);
  }
  function rcColoreSimile(a, b) { var x = hexRgb(a), y = hexRgb(b); return !!(x && y && Math.abs(x[0] - y[0]) <= 3 && Math.abs(x[1] - y[1]) <= 3 && Math.abs(x[2] - y[2]) <= 3); }
  function rcModelOf(c) {
    c = c || {};
    if (c.model != null && (c.model | 0) >= 0 && (c.model | 0) < 7) return c.model | 0;
    var L = RC3_DA[Math.max(0, Math.min(3, c.shape | 0))], v = rcVariante(c.wheel);
    return L[v] != null ? L[v] : L[0];
  }
  window.rcModelOf = rcModelOf; window.RC3_MOD = RC3_MOD; window.rcConVariante = rcConVariante;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function beacon(t, d) { try { if (typeof blgBeaconStep === 'function') blgBeaconStep(t, d || {}); } catch (e) { } }
  function lang() { return (window.GB_LANG === 'en') ? 'en' : 'it'; }
  function en() { return lang() === 'en'; }
  function discord() { return !!(window.GXDC_RADICE != null || document.documentElement.classList.contains('gxdc')); }
  function src(extra) { return 'race3d.html?v=' + encodeURIComponent(VER) + '&lang=' + lang() + (discord() ? '&dc=1' : '') + (extra || ''); }
  function base() {
    var ls = lsGet('gb_rc3d');
    if (ls === '0') return false;
    if (!(RC_3D || ls === '1')) return false;
    if (discord() && !window.GXDC_RACE3D) return false;
    if (RC3.gl2 == null) {
      if (typeof B3D !== 'undefined' && B3D && B3D.gl2 != null) RC3.gl2 = B3D.gl2;
      else {
        RC3.gl2 = false;
        try { var c = document.createElement('canvas'), g = c.getContext('webgl2'); if (g) { RC3.gl2 = true; var lc = g.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); } } catch (e) { RC3.gl2 = false; }
      }
    }
    return RC3.gl2;
  }
  function lite() {
    if (typeof RTD !== 'undefined' && RTD.lite) return true;
    if (lsGet('gb_lite') === '1') return true;
    return false;
  }
  function vuole() {
    if (RTD.game !== 'race') return false;
    if (lsGet('gb_rc3d') === '1') return base();
    if (lite()) return false;
    if ((+lsGet('gb_rc3d_lento') || 0) >= 2) return false;
    if (RC3.giu && RC3.giu === RTD.map) return false;
    return base();
  }
  function G() { try { return RC3.fr && RC3.fr.contentWindow && RC3.fr.contentWindow.RACE3D; } catch (e) { return null; } }
  function monta() {
    var wrap = document.getElementById('arc-wrap'); if (!wrap) return;
    if (RC3.fr && RC3.host && RC3.host.parentNode === wrap) return;
    smonta();
    try {
      var h = document.createElement('div'); h.id = 'rc3d-host'; h.setAttribute('aria-hidden', 'true');
      var fr = document.createElement('iframe'); fr.id = 'rc3d-fr'; fr.setAttribute('aria-hidden', 'true'); fr.setAttribute('tabindex', '-1');
      fr.setAttribute('scrolling', 'no'); fr.setAttribute('title', 'street race 3d');
      fr.src = src();
      h.appendChild(fr); wrap.insertBefore(h, wrap.firstChild);
      RC3.host = h; RC3.fr = fr; RC3.nato = Date.now(); RC3.avviato = false; RC3.svelato = false; RC3.g = null; RC3.prontoT = 0;
    } catch (e) { cade(e); }
  }
  function smonta() {
    var g = RC3.g; if (g) { try { g.ferma(); } catch (e) { } }
    if (RC3.host && RC3.host.parentNode) RC3.host.parentNode.removeChild(RC3.host);
    RC3.host = null; RC3.fr = null; RC3.g = null; RC3.avviato = false; RC3.svelato = false;
    var wrap = document.getElementById('arc-wrap'); if (wrap) wrap.classList.remove('rc3d-on');
    var cv = document.getElementById('arc-cv'); if (cv) cv.style.background = '';
  }
  function cade(e, lento) {
    RC3.err = String((e && e.message) || e);
    RC3.giu = RTD.map || 1;
    if (lento) lsSet('gb_rc3d_lento', String((+lsGet('gb_rc3d_lento') || 0) + 1));
    try { console.warn('[race3d] torno al 2D: ' + RC3.err); } catch (x) { }
    beacon('rc3dcade', { d: RC3.err.slice(0, 160) });
    smonta();
    try { RTD.cam.ok = false; } catch (x) { }
  }
  window.rc3dCade = cade;
  var RC_TRC = (typeof RC_TRAILC !== 'undefined' && RC_TRAILC) ? RC_TRAILC : ['', '#fb923c', '#a5f3fc', '#c084fc'];
  function hexOk(v, d) { return /^#[0-9a-fA-F]{6}$/.test(v || '') ? v : d; }
  function look3(c, mio, pid) {
    c = c || {};
    var m = rcModelOf(c);
    if (pid != null && !mio) {
      var pr = (RTD.profiles || {})[pid];
      if (!(pr && pr.car)) { var hsh = 0, s = String(pid); for (var i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) >>> 0; var L = RC3_DA[Math.max(0, Math.min(3, c.shape | 0))]; m = L[(hsh >> 9) % L.length]; }
    }
    var o = { m: m, p: hexOk(c.col, '#ef4444'), a: hexOk(c.col2, '#ffffff'), w: hexOk(c.wheel, '#8892a8'), n: hexOk(c.neon, '#22d3ee'),
      d: Math.max(0, Math.min(3, c.decal | 0)), sp: 0, tr: null };
    if (mio) { o.sp = Math.max(0, Math.min(2, c.sp | 0)); if ((c.tr | 0) > 0 && RC_TRC[c.tr | 0]) o.tr = RC_TRC[c.tr | 0]; }
    return o;
  }
  window.rcLook3 = look3;
  function look(pid) {
    var C = RC3.look, k = String(pid);
    if (C[k]) return C[k];
    var c = null; try { c = rcCarOf(pid); } catch (e) { c = null; }
    var o = look3(c, String(pid) === String(RTD.myId), k);
    C[k] = o; return o;
  }
  function avvisa(tipo, dato) {
    try {
      if (tipo === 'caduto') { cade(String(dato)); return; }
      if (tipo === 'lento') { cade('race3d lento (p95 ' + Math.round(+dato || 0) + ' ms)', true); return; }
      if (tipo === 'fps') {
        var n = Date.now(); if (n - RC3.fpsT < 30000) return; RC3.fpsT = n;
        var inf = null; try { inf = RC3.g.info(); } catch (e) { }
        beacon('rc3dfps', { fps: Math.round(+dato || 0), p95: inf ? inf.lavoro_p95 : 0, q: inf ? inf.qualita : '', dc: inf ? inf.calls : 0, t: inf ? inf.tema : '' });
      }
    } catch (e) { }
  }
  function stato(raw, lp) {
    var st = RC3.st || (RC3.st = { n: 0, righe: [], freeze: 0, over: false, io: '', joy: { on: false, mx: 0, my: 0 } });
    var A = RC3._A || (RC3._A = {}), k;
    for (k in A) delete A[k];
    var ra0 = lp && lp.a ? (lp.a.p || []) : [], rb0 = lp && lp.b ? (lp.b.p || []) : (raw.p || []), kk = lp ? lp.k : 0, i;
    for (i = 0; i < ra0.length; i++) A[ra0[i][0]] = ra0[i];
    var n = 0, lead = null;
    for (i = 0; i < rb0.length; i++) {
      var rb = rb0[i], ra = A[rb[0]] || rb, q = st.righe[n] || (st.righe[n] = {});
      var da = (rb[3] || 0) - (ra[3] || 0); da = Math.atan2(Math.sin(da), Math.cos(da));
      q.pid = String(rb[0]);
      q.x = ra[1] + (rb[1] - ra[1]) * kk; q.y = ra[2] + (rb[2] - ra[2]) * kk; q.a = (ra[3] || 0) + da * kk;
      q.v = rb[4] || 0; q.lap = rb[5] | 0; q.rank = rb[6] | 0; q.fl = rb[7] | 0; q.di = (rb[8] || 0) / 100;
      q.z = ((ra.length > 9 ? ra[9] || 0 : 0) + ((rb.length > 9 ? rb[9] || 0 : 0) - (ra.length > 9 ? ra[9] || 0 : 0)) * kk) / 20;
      if (!lead || q.rank < lead.rank) lead = q;
      n++;
    }
    st.n = n;
    st.freeze = raw.freeze || 0; st.over = !!raw.over;
    st.io = String(RTD.myId);
    if (RTD.spec || !rb0.some(function (r) { return String(r[0]) === st.io; })) st.io = lead ? lead.pid : st.io;
    var j = RTD.joy || {};
    st.joy.on = !!(j.on && !RTD.spec); st.joy.mx = j.mx || 0; st.joy.my = j.my || 0;
    return st;
  }
  function sovra(ctx, raw, st, now, w, hh, sch) {
    var dpr = (RTD.dpr || window.devicePixelRatio || 1), i, me = null;
    for (i = 0; i < st.n; i++) if (st.righe[i].pid === String(RTD.myId)) me = st.righe[i];
    if (sch && sch.w) {
      var kx = w / sch.w, ky = hh / sch.h;
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      var fs0 = Math.round(11.5 * dpr), fs1 = Math.round(9 * dpr);
      for (i = 0; i < sch.cart.length; i++) {
        var c = sch.cart[i]; if (!c.vis) continue;
        var r = null; for (var j = 0; j < st.n; j++) if (st.righe[j].pid === c.pid) { r = st.righe[j]; break; }
        if (!r) continue;
        var io = c.pid === String(RTD.myId);
        var t = (io ? (en() ? 'YOU' : 'TU') : String(rtdName(c.pid)).slice(0, 9)) + '  P' + r.rank;
        var x = c.x * kx, y = c.y * ky;
        var fs = io ? fs0 : fs1;
        ctx.font = '700 ' + fs + 'px Inter, "Inter Tight", system-ui, sans-serif';
        var tw = ctx.measureText(t).width + 12 * dpr, th = fs + 7 * dpr;
        ctx.fillStyle = io ? 'rgba(12,16,28,.78)' : 'rgba(8,10,16,.55)';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x - tw / 2, y - th, tw, th, th / 2); ctx.fill(); } else ctx.fillRect(x - tw / 2, y - th, tw, th);
        if (io && ctx.roundRect) { ctx.strokeStyle = 'rgba(126,233,251,.85)'; ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.roundRect(x - tw / 2, y - th, tw, th, th / 2); ctx.stroke(); }
        ctx.fillStyle = io ? '#7ee9fb' : (r.rank === 1 ? '#ffd700' : 'rgba(255,255,255,.92)');
        ctx.fillText(t, x, y - 5 * dpr);
        if (r.fl & 8) { ctx.fillStyle = '#ffd700'; ctx.fillText(en() ? 'FINISHED' : 'ARRIVATO', x, y - th - 3 * dpr); }
        if (io && (r.fl & 1) && window.RC2 && RC2.pillola) { try { RC2.pillola(ctx, x, y - th - 3 * dpr, r.fl, dpr); } catch (e) { } }
      }
      ctx.restore();
    }
    if (me) {
      var vv = me.v || 0;
      var gear = vv < 4 ? 0 : vv < 8 ? 1 : vv < 12 ? 2 : 3;
      var inGear = (vv - [0, 4, 8, 12][gear]) / [4, 4, 4, 7][gear];
      try {
        if (!RTD._sc.engOff) { RTD._sc.engOff = 1; TWS.engine(false); }
        rcEng(true, 0.35 + gear * 0.28 + inGear * 0.34, vv, gear);
        rcSkid(!!(me.fl & 1), me.di || 0, !!(me.fl & 16), !!(me.fl & 32));
        rcBoost(!!(me.fl & 4));
      } catch (e) { }
      var pos6 = me.rank;
      if (RTD._sc.lastPos == null) RTD._sc.lastPos = pos6;
      else if (pos6 !== RTD._sc.lastPos) {
        if (now - (RTD._sc.posT || 0) > 1500) {
          try { rcSfx(pos6 < RTD._sc.lastPos ? 'rcPassUp' : 'rcPassDn', 1); } catch (e) { }
          if (pos6 < RTD._sc.lastPos) { try { hapGioco('leggero'); } catch (e2) { } }
          RTD._sc.posT = now;
        }
        RTD._sc.lastPos = pos6;
      }
      var cps = RTD.map && RTD.map.checkpoints;
      if (cps && cps.length) {
        var bi = 0, bd = 1e18;
        for (var ci = 0; ci < cps.length; ci++) { var dx = cps[ci][0] - me.x, dy = cps[ci][1] - me.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; bi = ci; } }
        var last = RTD._sc.lastCp;
        if (last == null) RTD._sc.lastCp = bi;
        else if (bi !== last) { if (bi === ((last + 1) % cps.length) && bi !== 0) { try { TWS.play('cp', 0.55); } catch (e) { } } RTD._sc.lastCp = bi; }
      }
      var RS = 1.55, tcx = w / 2, tcy = hh - (34 * RS);
      try {
        var tach = rtdSprite('rc_tach2', Math.round(80 * RS), Math.round(80 * RS), function (tc) {
          tc.translate(40 * RS, 40 * RS);
          tc.fillStyle = 'rgba(4,8,16,.62)'; tc.beginPath(); tc.arc(0, 0, 32 * RS, 0, 6.283); tc.fill();
          tc.strokeStyle = 'rgba(255,255,255,.22)'; tc.lineWidth = 6 * RS; tc.lineCap = 'round';
          tc.beginPath(); tc.arc(0, 0, 26 * RS, 2.4, 7.0, false); tc.stroke();
          for (var tk = 0; tk <= 8; tk++) { var ta = 2.4 + tk / 8 * 4.6; tc.strokeStyle = tk >= 7 ? 'rgba(248,113,113,.8)' : 'rgba(255,255,255,.4)'; tc.lineWidth = 2 * RS; tc.beginPath(); tc.moveTo(Math.cos(ta) * 21 * RS, Math.sin(ta) * 21 * RS); tc.lineTo(Math.cos(ta) * 26 * RS, Math.sin(ta) * 26 * RS); tc.stroke(); }
        });
        ctx.drawImage(tach, tcx - 40 * RS, tcy - 40 * RS);
      } catch (e) { }
      var frac = Math.min(1, vv / 19);
      ctx.strokeStyle = frac > 0.85 ? '#f87171' : frac > 0.55 ? '#facc15' : '#a3e635';
      ctx.lineWidth = 5 * RS; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(tcx, tcy, 26 * RS, 2.4, 2.4 + frac * 4.6, false); ctx.stroke();
      ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold ' + Math.round(12 * RS * 1.15) + 'px Russo One, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(Math.round(vv * 14), tcx, tcy + 3 * RS);
      ctx.font = Math.round(7 * RS) + 'px Russo One, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.fillText('KM/H', tcx, tcy + 14 * RS);
      if (me.fl & 16) {
        var nb = (me.fl & 256) ? 3 : (me.fl & 32) ? 2 : 1, zc = ['#3fa9ff', '#ff9a2e', '#c34dff'][nb - 1];
        for (var b = 0; b < 3; b++) { ctx.fillStyle = b < nb ? zc : 'rgba(255,255,255,.18)'; ctx.fillRect(tcx - 21 * RS + b * 15 * RS, tcy - 42 * RS, 12 * RS, 3.2 * RS); }
      }
    }
    var mm = 74, pad = 8;
    try {
      if (!RTD._sc.mmCv) {
        var mc = document.createElement('canvas'); mc.width = mm; mc.height = mm; var m2 = mc.getContext('2d');
        m2.fillStyle = 'rgba(4,8,16,.7)'; m2.fillRect(0, 0, mm, mm); m2.strokeStyle = 'rgba(56,189,248,.4)'; m2.strokeRect(0.5, 0.5, mm - 1, mm - 1);
        var ln0 = RTD.map.line || []; m2.strokeStyle = 'rgba(255,255,255,.5)'; m2.lineWidth = 2; m2.beginPath();
        ln0.forEach(function (p0, ii) { var mx0 = p0[0] / 64 * mm, my0 = p0[1] / 64 * mm; if (ii === 0) m2.moveTo(mx0, my0); else m2.lineTo(mx0, my0); });
        m2.closePath(); m2.stroke();
        RTD._sc.mmCv = mc;
      }
      ctx.drawImage(RTD._sc.mmCv, w - mm - pad, pad);
      for (i = 0; i < st.n; i++) {
        var rr = st.righe[i], mx = w - mm - pad + rr.x / 64 * mm, my = pad + rr.y / 64 * mm;
        if (rr.pid === String(RTD.myId)) {
          ctx.save(); ctx.translate(mx, my); ctx.rotate(rr.a); ctx.fillStyle = '#38bdf8';
          ctx.beginPath(); ctx.moveTo(4.5, 0); ctx.lineTo(-3, -3); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill(); ctx.restore();
        } else { ctx.fillStyle = (rr.rank === 1) ? '#ffd700' : '#f87171'; ctx.beginPath(); ctx.arc(mx, my, 2, 0, 6.283); ctx.fill(); }
      }
    } catch (e) { }
  }
  function fotogramma(ctx, raw, lp, now, w, hh, dt) {
    if (!vuole()) { if (RC3.fr) smonta(); return false; }
    var wrap = document.getElementById('arc-wrap');
    if (!RC3.fr || !RC3.host || RC3.host.parentNode !== wrap) { monta(); return false; }
    var g = G();
    if (!g) { if (Date.now() - RC3.nato > MAX_ATTESA) cade('race3d: il ponte non risponde in ' + MAX_ATTESA + ' ms'); return false; }
    if (g.errore) { cade('race3d: ' + g.errore); return false; }
    if (!g.pronto) { if (Date.now() - RC3.nato > MAX_ATTESA) cade('race3d: non pronto'); return false; }
    if (!RC3.avviato || RC3.mappa !== RTD.map) {
      RC3.look = {}; RC3.mappa = RTD.map; RC3._sc0 = null;
      var ok = false;
      try { ok = g.avvia({ mappa: RTD.map, io: String(RTD.myId), look: look, nome: function (p) { return rtdName(p); }, avvisa: avvisa }) === true; } catch (e) { cade(e); return false; }
      if (!ok) { cade('race3d: avvia ha detto no (' + (g.errore || '?') + ')'); return false; }
      RC3.avviato = true; RC3.g = g; RC3.prontoT = Date.now(); RC3.lentoT = 0;
      beacon('rc3dok', { ver: VER, ms: Date.now() - RC3.nato });
    }
    if (g.caricando) { if (Date.now() - RC3.prontoT > MAX_CARICA) cade('race3d: GPU non pronta'); return false; }
    var st;
    try { st = stato(raw, lp); } catch (e) { cade(e); return false; }
    try { g.fotogramma(now, dt, st); } catch (e) { cade(e); return false; }
    if (!RC3.svelato) {
      RC3.svelato = true;
      if (wrap) wrap.classList.add('rc3d-on');
      var cv = document.getElementById('arc-cv'); if (cv) cv.style.background = 'transparent';
    }
    if (RTD.fxq && RTD.fxq.length) RTD.fxq.length = 0;
    RTD._sc.fxMap = function () { return [-9999, -9999]; };
    if (!st.over && st.freeze <= 0 && dt > 0.0455) { if (!RC3.lentoT) RC3.lentoT = now; else if (now - RC3.lentoT > 4000) { cade('race3d: sotto 22 fps per 4 s', true); return true; } }
    else RC3.lentoT = 0;
    var sch = null; try { sch = g.schermo(); } catch (e) { }
    try { sovra(ctx, raw, st, now, w, hh, sch); } catch (e) { }
    RC3.frame++;
    return true;
  }
  window.rc3dFotogramma = fotogramma;
  var _rc2d = rtdDrawRace;
  rtdDrawRace = function (ctx, raw, lp, now, w, hh, dt) {
    try { if (window.RC2 && RC2.fantasmi) RC2.fantasmi(raw, lp, dt || 0.016, now); } catch (e) { }
    var fatto = false;
    try { fatto = fotogramma(ctx, raw, lp, now, w, hh, dt); } catch (e) { cade(e); fatto = false; }
    if (!fatto) return _rc2d.apply(this, arguments);
  };
  if (typeof rtdFeedEvent === 'function') {
    var _fe = rtdFeedEvent;
    rtdFeedEvent = function (e) {
      var r = _fe.apply(this, arguments);
      try { if (RTD.game === 'race' && RC3.g && RC3.avviato && e) RC3.g.evento(e); } catch (x) { }
      return r;
    };
  }
  var ST = { fr: null, g: null, t0: 0, coda: [], cache: {}, giu: false, tim: null, ozio: null, lavora: false };
  function stPuo() {
    if (ST.giu || !base() || lite()) return false;
    if (typeof RTD !== 'undefined' && RTD.ui === 'match' && RTD.game === 'race') return false;
    return true;
  }
  function stChiudi() {
    if (ST.tim) { clearTimeout(ST.tim); ST.tim = null; }
    if (ST.ozio) { clearTimeout(ST.ozio); ST.ozio = null; }
    try { if (ST.fr && ST.fr.parentNode) ST.fr.parentNode.removeChild(ST.fr); } catch (e) { }
    ST.fr = null; ST.g = null; ST.lavora = false;
  }
  function stGiu(p) {
    ST.giu = true; try { console.warn('[auto 3D] foto spente: ' + p); } catch (e) { }
    beacon('rc3fotogiu', { d: String(p).slice(0, 120) });
    var c = ST.coda; ST.coda = []; c.forEach(function (j) { try { j.no(); } catch (e) { } });
    stChiudi();
  }
  function stApri() {
    if (ST.fr) return;
    try {
      var fr = document.createElement('iframe'); fr.setAttribute('aria-hidden', 'true'); fr.setAttribute('tabindex', '-1'); fr.setAttribute('scrolling', 'no');
      fr.setAttribute('title', 'foto auto 3d');
      fr.style.cssText = 'position:fixed;left:0;bottom:0;width:8px;height:8px;border:0;opacity:.01;pointer-events:none;z-index:-1;';
      fr.src = src('&studio=1');
      document.body.appendChild(fr); ST.fr = fr; ST.t0 = Date.now(); ST.g = null;
      var prova = function () {
        ST.tim = null; if (!ST.fr) return;
        var g = null; try { g = fr.contentWindow && fr.contentWindow.RACE3D; } catch (e) { g = null; }
        if (g && g.errore) return stGiu('studio: ' + g.errore);
        if (g && g.pronto && g.vetrina && g.vetrina.foto) { ST.g = g; beacon('rc3foto', { ms: Date.now() - ST.t0 }); return stGira(); }
        if (Date.now() - ST.t0 > MAX_ATTESA) return stGiu('studio non pronto');
        ST.tim = setTimeout(prova, 90);
      };
      ST.tim = setTimeout(prova, 90);
    } catch (e) { stGiu('apri: ' + ((e && e.message) || e)); }
  }
  function stGira() {
    if (!ST.g || ST.lavora) return;
    if (ST.ozio) { clearTimeout(ST.ozio); ST.ozio = null; }
    var j = ST.coda.shift();
    if (!j) { ST.ozio = setTimeout(stChiudi, 20000); return; }
    ST.lavora = true;
    var fatto = false, tt = setTimeout(function () { if (!fatto) { fatto = true; ST.lavora = false; stGiu('foto oltre 9 s'); } }, 9000);
    ST.g.vetrina.foto(j.look, j.opz).then(function (cv) {
      if (fatto) return; fatto = true; clearTimeout(tt); ST.lavora = false;
      ST.cache[j.k] = cv; j.si(cv); stGira();
    }, function (e) {
      if (fatto) return; fatto = true; clearTimeout(tt); ST.lavora = false;
      j.no(e); stGira();
    });
  }
  function fotoAuto(lk, opz, si, no) {
    opz = opz || {};
    var k = JSON.stringify([lk.m, lk.p, lk.a, lk.w, lk.n, lk.d, lk.sp, opz.vista || 'tre4', opz.w | 0, opz.h | 0]);
    if (ST.cache[k]) { si(ST.cache[k]); return true; }
    if (!stPuo()) { if (no) no(); return false; }
    ST.coda.push({ k: k, look: lk, opz: opz, si: si, no: no || function () { } });
    if (!ST.fr) stApri(); else stGira();
    return false;
  }
  window.RC3F = ST; window.rc3Foto = fotoAuto;
  function metti(cv, foto) {
    try {
      var x = cv.getContext('2d'), W = cv.width, H = cv.height;
      x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
      var k = Math.min(W / foto.width, H / foto.height), w = foto.width * k, h = foto.height * k;
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.drawImage(foto, (W - w) / 2, (H - h) / 2, w, h); x.restore();
    } catch (e) { }
  }
  function lookSkin(patch) {
    var mio = twrCarLook(), o = {}, k;
    for (k in mio) o[k] = mio[k];
    if (patch) for (k in patch) o[k] = patch[k];
    if (!patch || patch.shape == null) { var mm = rcModelOf(mio), f = RC3_FAM[mm]; o.shape = f[0]; o.wheel = rcConVariante(o.wheel, f[1]); }
    try { var x = JSON.parse(lsGet('gb_car_x') || 'null'); if (x) { o.sp = x.spoiler | 0; o.tr = x.trail | 0; } } catch (e) { }
    return look3(o, true);
  }
  if (typeof _cosDrawPreview === 'function') {
    var _cdp = _cosDrawPreview;
    _cosDrawPreview = function (cv, mode, patch) {
      var r = _cdp.apply(this, arguments);
      if (mode === 'race' && cv) {
        try {
          var W = cv.width, H = cv.height;
          fotoAuto(lookSkin(patch), { w: 352, h: 320 }, function (foto) {
            if (cv.width === W && cv.height === H) { metti(cv, foto); cv.classList.add('rc3-foto'); }
          });
        } catch (e) { }
      }
      return r;
    };
  }
  if (typeof qnAnteprima === 'function') {
    var _qa = qnAnteprima;
    qnAnteprima = function (cv, pr) {
      if (cv && pr && pr.tipo !== 'cent' && pr.mode === 'race' && typeof _cosDrawPreview === 'function') {
        try {
          var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height);
          var bg = x.createRadialGradient(cv.width / 2, cv.height * .42, 4, cv.width / 2, cv.height / 2, cv.width * .7); bg.addColorStop(0, 'rgba(40,48,72,.65)'); bg.addColorStop(1, 'rgba(8,10,18,.95)');
          cv.style.background = 'radial-gradient(circle at 50% 42%,rgba(40,48,72,.65),rgba(8,10,18,.95) 70%)';
          _cosDrawPreview(cv, 'race', pr.look_patch || {});
          return;
        } catch (e) { }
      }
      return _qa.apply(this, arguments);
    };
  }
  if (typeof cosEquip === 'function') {
    var _ce = cosEquip;
    cosEquip = function (mode, id) {
      var prima = null;
      if (mode === 'race') { try { prima = rcModelOf(twrCarLook()); } catch (e) { prima = null; } }
      var r = _ce.apply(this, arguments);
      if (mode === 'race' && prima != null) {
        var t0 = Date.now(), giro = function () {
          var eq = (window.S && S.cosmetics && S.cosmetics.equipped) || {};
          if (eq.race !== id) { if (Date.now() - t0 < 8000) setTimeout(giro, 250); return; }
          try {
            var cat = (window.COS && COS.data && COS.data.catalog && COS.data.catalog.race) || [], cd = null;
            cat.forEach(function (c) { if (c.id === id) cd = c; });
            var lk = twrCarLook();
            RC3.look = {}; fotoBuoni();
            if (!cd || !cd.look_patch || cd.look_patch.shape != null || rcModelOf(lk) === prima) return;
            var f = RC3_FAM[prima];
            if ((lk.shape | 0) !== f[0]) return;
            var car = { shape: f[0], col: lk.col, col2: lk.col2, wheel: rcConVariante(lk.wheel, f[1]), neon: lk.neon, decal: lk.decal | 0 };
            lsSet('gb_car', JSON.stringify(car));
            try { RTD._lookC = {}; } catch (e) { }
            fetch(BACKEND + '/gangster', { method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
              body: JSON.stringify({ user_id: S.userId, look: twrLook(), car: car }) }).catch(function () { });
          } catch (e) { }
        };
        setTimeout(giro, 300);
      }
      return r;
    };
  }
  function fotoBuoni() { try { [].forEach.call(document.querySelectorAll('.rc3-btn-auto'), function (b) { b.removeAttribute('data-k'); }); } catch (e) { } }
  function lobbyTasto() {
    var righe = document.querySelectorAll('#arc .xa-ap-r, #arc-body .xa-ap-r');
    for (var i = 0; i < righe.length; i++) { var bb = righe[i].querySelector('b'); if (bb && /tua auto|your car/i.test(bb.textContent) && righe[i].offsetParent) return righe[i]; }
    var b = document.querySelector('#arc-body .mg-extra button[onclick^="rcCarEditor"]') || document.querySelector('#arc-body button[onclick^="rcCarEditor"]');
    return b && b.offsetParent ? b : null;
  }
  function lobbyAuto() {
    try {
      if (typeof RTD === 'undefined' || RTD.game !== 'race') return;
      var b = lobbyTasto(); if (!b) return;
      var c0 = twrCarLook(); try { var x = JSON.parse(lsGet('gb_car_x') || 'null'); if (x) c0.sp = x.spoiler | 0; } catch (e) { }
      var lk = look3(c0, true), k = JSON.stringify(lk);
      if (b.getAttribute('data-k') === k && b.querySelector('canvas.rc3-btn-cv')) return;
      fotoAuto(lk, { w: 264, h: 132, vista: 'lato' }, function (foto) {
        if (!b.isConnected) return;
        b.classList.add('rc3-btn-auto'); b.setAttribute('data-k', k);
        var cv = b.querySelector('canvas.rc3-btn-cv');
        if (!cv) { cv = document.createElement('canvas'); cv.className = 'rc3-btn-cv'; cv.setAttribute('aria-hidden', 'true'); b.appendChild(cv); }
        cv.width = foto.width; cv.height = foto.height; metti(cv, foto);
      });
    } catch (e) { }
  }
  window.rc3LobbyAuto = lobbyAuto;
  function lobbyPiu() { [60, 450, 1300, 2600].forEach(function (t) { setTimeout(lobbyAuto, t); }); }
  if (typeof rtdShowLobby === 'function') {
    var _sl = rtdShowLobby;
    rtdShowLobby = function () {
      var r = _sl.apply(this, arguments);
      try { if (RTD.game === 'race') lobbyPiu(); } catch (e) { }
      return r;
    };
  }
  var RC3_PRIM = ['#ef4444', '#dc2626', '#f97316', '#facc15', '#a3e635', '#22c55e', '#2dd4bf', '#38bdf8', '#0ea5e9', '#2563eb', '#6366f1', '#c084fc', '#f472b6', '#e5e7eb', '#71717a', '#111318'];
  var RC3_ACC = ['#ffffff', '#111111', '#ffd700', '#ef4444', '#38bdf8', '#a3e635', '#c084fc', '#f97316', '#2dd4bf', '#f472b6'];
  var RC3_RUOTE = ['#8892a8', '#e5e7eb', '#111111', '#ffd700', '#ef4444', '#38bdf8', '#c084fc'];
  var RC3_NEON = ['#22d3ee', '#a3e635', '#f472b6', '#facc15', '#c084fc', '#ef4444', '#f97316', '#ffffff'];
  var RC3_LIV = function () { return en() ? ['PLAIN', 'STRIPES', 'FLAMES', 'NUMBER'] : ['LISCIA', 'STRISCIA', 'FIAMME', 'NUMERO']; };
  var RC3_SCIA = function () { return en() ? ['NEON', 'FIRE', 'ICE', 'VIOLET'] : ['NEON', 'FUOCO', 'GHIACCIO', 'VIOLA']; };
  var RC3_ALA = function () { return en() ? ['STOCK', 'GT WING', 'NONE'] : ['DI SERIE', 'ALA GT', 'NESSUNO']; };
  var V3 = { fr: null, g: null, host: null, ok: false, t0: 0, tim: null, vig: null, mai: false, err: null, gira: null };
  function edLook3() {
    var L = RC_ED.look || {}, x = RC_ED.x || {};
    var o = look3({ shape: L.shape, col: L.col, col2: L.col2, wheel: L.wheel, neon: L.neon, decal: L.decal, sp: x.spoiler, tr: x.trail }, true);
    o.m = L.model != null ? L.model : rcModelOf(L);
    return o;
  }
  function v3Apri() {
    if (V3.mai || V3.fr) return;
    if (!base() || lite()) return;
    var cv = document.getElementById('rc-ed-cv'); if (!cv || !cv.parentNode) return;
    var stg = cv.parentNode;
    try {
      if (getComputedStyle(stg).position === 'static') stg.style.position = 'relative';
      var h = document.createElement('div'); h.id = 'rc3d-ed-host';
      h.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;display:none;overflow:hidden;border-radius:inherit;touch-action:none;z-index:1;';
      var fr = document.createElement('iframe'); fr.setAttribute('scrolling', 'no'); fr.setAttribute('title', en() ? 'your car in 3D' : 'la tua auto in 3D');
      fr.style.cssText = 'width:100%;height:100%;border:0;display:block;background:#000;';
      fr.src = src('&vetrina=1');
      h.appendChild(fr); stg.insertBefore(h, cv.nextSibling);
      var gi = document.createElement('div'); gi.className = 'rc3-gira'; gi.setAttribute('aria-hidden', 'true');
      gi.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>';
      gi.querySelector('span').textContent = en() ? 'Drag to rotate' : 'Trascina per girare';
      h.appendChild(gi); V3.gira = gi;
      V3.fr = fr; V3.host = h; V3.t0 = Date.now(); V3.ok = false; V3.g = null;
      V3.tim = setTimeout(v3Prova, 80);
    } catch (e) { v3Giu('apri: ' + ((e && e.message) || e)); }
  }
  function v3Prova() {
    V3.tim = null; if (!V3.fr) return;
    var g = null; try { g = V3.fr.contentWindow && V3.fr.contentWindow.RACE3D; } catch (e) { g = null; }
    if (g && g.errore) return v3Giu('ponte: ' + g.errore);
    if (g && g.pronto && g.vetrina) {
      V3.g = g; var ok = false;
      try { ok = g.vetrina.avvia(edLook3()); } catch (e) { return v3Giu('avvia: ' + ((e && e.message) || e)); }
      if (!ok) return v3Giu('avvia: ' + (g.vetrina.errore || 'no'));
      try { g.vetrina.precarica(); } catch (e) { }
      return v3Aspetta();
    }
    if (Date.now() - V3.t0 > MAX_ATTESA) return v3Giu('3D non pronto');
    V3.tim = setTimeout(v3Prova, 80);
  }
  function v3Aspetta() {
    V3.tim = null; if (!V3.g) return;
    var v = V3.g.vetrina;
    if (v.errore) return v3Giu(v.errore);
    if (v.fotogrammi > 0 && v.info && v.info().modello) return v3Mostra();
    if (Date.now() - V3.t0 > MAX_ATTESA + MAX_CARICA) return v3Giu('nessun fotogramma');
    V3.tim = setTimeout(v3Aspetta, 60);
  }
  function v3Mostra() {
    V3.ok = true;
    if (V3.host) V3.host.style.display = 'block';
    var cv = document.getElementById('rc-ed-cv'); if (cv) cv.style.visibility = 'hidden';
    var stg = cv && cv.parentNode; if (stg) stg.classList.add('rc3-ed-3d');
    if (V3.gira) V3.gira.classList.add('on');
    beacon('rced3d', { ms: Date.now() - V3.t0 });
    V3.vig = setInterval(function () {
      if (!V3.ok) return;
      if (!V3.host || !document.body.contains(V3.host)) { v3Chiudi(); return; }
      var v = V3.g && V3.g.vetrina; if (!v) return v3Giu('vetrina sparita');
      if (v.errore) return v3Giu(v.errore);
      if (V3.g.perso) return v3Giu('contesto WebGL perso');
      if (V3.gira && v.toccata && V3.gira.classList.contains('on')) V3.gira.classList.remove('on');
    }, 400);
  }
  function v3Giu(p) {
    V3.err = String(p); V3.mai = true;
    try { console.warn('[auto 3D] torno al 2D: ' + V3.err); } catch (e) { }
    beacon('rced3dgiu', { d: V3.err.slice(0, 120) });
    v3Chiudi();
    var cv = document.getElementById('rc-ed-cv'); if (cv) cv.style.visibility = 'visible';
  }
  function v3Chiudi() {
    if (V3.tim) { clearTimeout(V3.tim); V3.tim = null; }
    if (V3.vig) { clearInterval(V3.vig); V3.vig = null; }
    try { if (V3.g && V3.g.vetrina) V3.g.vetrina.ferma(); } catch (e) { }
    try { if (V3.host && V3.host.parentNode) V3.host.parentNode.removeChild(V3.host); } catch (e) { }
    try { var cv = document.getElementById('rc-ed-cv'); if (cv && cv.parentNode) cv.parentNode.classList.remove('rc3-ed-3d'); } catch (e) { }
    V3.fr = null; V3.g = null; V3.host = null; V3.ok = false; V3.gira = null;
  }
  function v3Look() { if (!V3.ok || !V3.g || !V3.g.vetrina) return; try { V3.g.vetrina.look(edLook3()); } catch (e) { v3Giu('look: ' + ((e && e.message) || e)); } }
  window.RC3V = V3;
  rcCarEditor = function () {
    var L0 = twrCarLook();
    RC_ED.look = rcCarNorm(L0);
    RC_ED.look.model = rcModelOf(L0);
    RC_ED.x = { trail: 0, spoiler: 0 };
    try { var x0 = JSON.parse(lsGet('gb_car_x') || 'null'); if (x0) { RC_ED.x.trail = x0.trail | 0; RC_ED.x.spoiler = x0.spoiler | 0; } } catch (e) { }
    RC_ED.look.tr = RC_ED.x.trail; RC_ED.look.sp = RC_ED.x.spoiler;
    RC_ED.spin = 0; RC_ED.boostT = 0; RC_ED.flashT = 0; RC_ED.t0 = performance.now(); RC_ED.skCyc = -1; RC_ED.puffT = 0;
    RC_ED.bgCv = null; RC_ED.skCv = null; RC_ED.puffs = [];
    var E = en();
    var sw = function (f, cols) {
      var out = '<div class="twr-swrow" data-f="' + f + '">';
      cols.forEach(function (c) { out += '<span class="twr-sw" data-v="' + c + '" style="background:' + c + ';" onclick="rcEdSet(\'' + f + '\',\'' + c + '\')"></span>'; });
      return out + '</div>';
    };
    var opts = function (f, list, cls) {
      var o = '<div class="twr-optrow' + (cls ? ' ' + cls : '') + '" data-f="' + f + '">';
      list.forEach(function (d, i) { o += '<button class="twr-opt" data-i="' + i + '" onclick="rcEdSet(\'' + f + '\',' + i + ')">' + d + '</button>'; });
      return o + '</div>';
    };
    var hd = function (lbl, f, solo) {
      return '<div class="rc-ed-h">' + lbl + (f ? '<span class="rc-ed-cur" id="rc-cur-' + f + '"></span>' : '')
        + (solo ? '<span class="rc-ed-badge">' + (E ? 'only you see it' : 'solo tu la vedi') + '</span>' : '') + '</div>';
    };
    var html = '<div class="pvp-m-title" style="color:#fca5a5;">' + (E ? 'YOUR CAR' : 'LA TUA AUTO') + '</div>'
      + '<div class="rc-ed-stage"><canvas id="rc-ed-cv" width="360" height="240"></canvas>'
      + '<button class="rc-ed-rev" onclick="rcEdRev()">BOOST</button></div>'
      + '<div class="rc-ed-secs">'
      + hd(E ? 'MODEL' : 'MODELLO', 'shape') + opts('shape', RC3_NOMI, 'rc3-mods')
      + hd(E ? 'SPOILER' : 'SPOILER', 'spoiler', true) + opts('spoiler', RC3_ALA())
      + hd(E ? 'BODY COLOUR' : 'CARROZZERIA', '') + sw('col', RC3_PRIM)
      + hd(E ? 'DETAILS' : 'DETTAGLI', '') + sw('col2', RC3_ACC)
      + hd(E ? 'LIVERY' : 'LIVREA', 'decal') + opts('decal', RC3_LIV())
      + hd(E ? 'RIMS' : 'CERCHI', '') + sw('wheel', RC3_RUOTE)
      + hd(E ? 'UNDERGLOW' : 'NEON SOTTOSCOCCA', '') + sw('neon', RC3_NEON)
      + hd(E ? 'BOOST TRAIL' : 'SCIA', 'trail', true) + opts('trail', RC3_SCIA())
      + '</div>'
      + '<button class="action-btn gold" style="width:100%;margin-top:14px;" onclick="rcEdSave()">' + (E ? 'SAVE CAR' : 'SALVA AUTO') + '</button>'
      + '<div class="rc-ed-note">' + (E ? 'Opponents will see your new car from the next race.' : 'Gli avversari vedranno la nuova auto dalla prossima gara.') + '</div>'
      + '<button class="action-btn" style="width:100%;margin-top:8px;background:#1f2937;color:#cbd5e1;" onclick="rcEdClose()">' + (E ? 'CLOSE' : 'CHIUDI') + '</button>';
    rtdOv(html, true);
    RC3_RUOTE.forEach(function (c) { if (rcColoreSimile(c, RC_ED.look.wheel)) RC_ED.look.wheel = c; });
    rcEdMark();
    try { v3Apri(); } catch (e) { }
    var loop = function () {
      var ov = document.getElementById('arc-overlay');
      var away = (typeof CUR !== 'undefined' && CUR !== 'arc');
      if (!document.getElementById('rc-ed-cv') || !ov || !ov.classList.contains('show') || away) {
        RC_ED.raf = null; if (away) rtdOvClose(); v3Chiudi(); return;
      }
      if (!V3.ok) { try { rcEdDraw(); } catch (e) { } }
      RC_ED.raf = requestAnimationFrame(loop);
    };
    if (RC_ED.raf) cancelAnimationFrame(RC_ED.raf);
    RC_ED.raf = requestAnimationFrame(loop);
  };
  rcEdSet = function (f, v) {
    if (f === 'shape') {
      var m = Math.max(0, Math.min(6, v | 0));
      RC_ED.look.shape = RC3_FAM[m][0]; RC_ED.look.model = m;
    } else if (f === 'trail') { RC_ED.x.trail = v | 0; RC_ED.look.tr = v | 0; RC_ED.boostT = performance.now(); try { if (V3.ok) V3.g.vetrina.boost(); } catch (e) { } }
    else if (f === 'spoiler') { RC_ED.x.spoiler = v | 0; RC_ED.look.sp = v | 0; }
    else if (f === 'decal') { RC_ED.look.decal = Math.max(0, Math.min(3, v | 0)); }
    else { RC_ED.look[f] = v; if (f === 'col2') RC_ED.flashT = performance.now(); }
    rcEdMark(); v3Look();
    try { TWS.play('pick', 0.5); } catch (e) { }
  };
  rcEdMark = function () {
    var L = RC_ED.look || {}, x = RC_ED.x || {}, m = L.model != null ? L.model : rcModelOf(L);
    document.querySelectorAll('#arc-modal [data-f]').forEach(function (row) {
      var f = row.getAttribute('data-f');
      var num = (f === 'shape' || f === 'decal' || f === 'trail' || f === 'spoiler');
      var cur = f === 'shape' ? m : f === 'trail' ? (x.trail | 0) : f === 'spoiler' ? (x.spoiler | 0) : f === 'decal' ? (L.decal | 0) : L[f];
      row.querySelectorAll('button,span.twr-sw').forEach(function (b) {
        var on = num ? parseInt(b.getAttribute('data-i'), 10) === cur : b.getAttribute('data-v') === cur;
        b.classList.toggle('sel', on);
      });
    });
    var nm = { shape: [RC3_NOMI, m], decal: [RC3_LIV(), L.decal | 0], trail: [RC3_SCIA(), x.trail | 0], spoiler: [RC3_ALA(), x.spoiler | 0] };
    Object.keys(nm).forEach(function (f) { var el = document.getElementById('rc-cur-' + f); if (el) el.textContent = nm[f][0][nm[f][1]] || ''; });
  };
  var _rcEdRev = rcEdRev;
  rcEdRev = function () { try { _rcEdRev(); } catch (e) { } try { if (V3.ok) V3.g.vetrina.boost(); } catch (e) { } try { if (typeof hapGioco === 'function') hapGioco('medio'); } catch (e) { } };
  rcEdSave = function () {
    var L = RC_ED.look, m = L.model != null ? L.model : rcModelOf(L), f = RC3_FAM[m];
    var lk = { shape: f[0], col: L.col, col2: L.col2, wheel: rcConVariante(L.wheel || '#8892a8', f[1]), neon: L.neon || '#22d3ee', decal: Math.max(0, Math.min(3, L.decal | 0)) };
    lsSet('gb_car', JSON.stringify(lk));
    lsSet('gb_car_x', JSON.stringify({ trail: RC_ED.x.trail | 0, spoiler: RC_ED.x.spoiler | 0 }));
    RTD._lookC = {}; RC3.look = {}; fotoBuoni();
    fetch(BACKEND + '/gangster', { method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
      body: JSON.stringify({ user_id: S.userId, look: twrLook(), car: lk }) })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function () { toast(en() ? 'Car saved' : 'Auto salvata', 'ok', 2000); try { TWS.play('gold', 0.7); } catch (x) { } })
      .catch(function () { toast(en() ? 'Saved on this device only - it will sync later' : 'Salvata solo su questo dispositivo — verrà risincronizzata', 'warn', 3000); });
    try { if (typeof grHaptic === 'function') grHaptic('pick'); } catch (x) { }
    rcEdClose();
  };
  var _rcEdClose = rcEdClose;
  rcEdClose = function () { v3Chiudi(); var r = _rcEdClose.apply(this, arguments); try { if (RTD.game === 'race') lobbyPiu(); } catch (e) { } return r; };
})();
