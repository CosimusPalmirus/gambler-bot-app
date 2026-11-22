(function () {
  'use strict';
  if (window.PCX) return;
  var PCX = window.PCX = { v: '1811' };
  var H = document.documentElement;
  var L = function (it, en) { return (window.GB_LANG === 'en') ? en : it; };
  function pc() { return H.classList.contains('xpc-pc'); }
  var RCK = window.RCK = { dir: 0, t0: 0, l: 0, r: 0, freno: 0, shift: 0 };
  RCK.val = function () {
    if (!RCK.dir) return 0;
    var k = Math.min(1, (performance.now() - RCK.t0) / 250);
    return RCK.dir * (0.30 + 0.25 * k);
  };
  function rckDir() {
    var d = RCK.r && RCK.l ? RCK.ultimo : (RCK.r ? 1 : (RCK.l ? -1 : 0));
    if (d !== RCK.dir) { RCK.dir = d; RCK.t0 = performance.now(); }
  }
  function rckFreno() { try { RCC.gas = (RCK.freno || RCK.shift) ? 0 : RC_GAS_AUTO; } catch (e) { } }
  RCK.azzera = function () { RCK.l = RCK.r = 0; RCK.dir = 0; RCK.freno = RCK.shift = 0; rckFreno(); };
  PCX.raceTasto = function (c, giu, rep) {
    if (c === 'ArrowLeft' || c === 'KeyA') { if (!!RCK.l !== giu) { RCK.l = giu ? 1 : 0; if (giu) RCK.ultimo = -1; rckDir(); } return true; }
    if (c === 'ArrowRight' || c === 'KeyD') { if (!!RCK.r !== giu) { RCK.r = giu ? 1 : 0; if (giu) RCK.ultimo = 1; rckDir(); } return true; }
    if (c === 'ArrowDown' || c === 'KeyS') { if (!rep) { RCK.freno = giu ? 1 : 0; rckFreno(); } return true; }
    if (c === 'ShiftLeft' || c === 'ShiftRight') { if (!rep) { RCK.shift = giu ? 1 : 0; rckFreno(); } return true; }
    if (c === 'ArrowUp' || c === 'KeyW') return true;
    if (c === 'Space') { if (!rep) { try { RCC.drift = giu; RTD.aim.on = giu; } catch (e) { } } return true; }
    return false;
  };
  addEventListener('blur', function () { RCK.azzera(); });
  var PCG = window.PCG = {};
  var PX_MOUSE = 150, PX_PIENA = 78;
  function inGolf() { try { return CUR === 'arc' && RTD.ui === 'match' && RTD.game === 'golf' && !RTD.spec; } catch (e) { return false; } }
  function palla() { var raw = RTD.lastRaw; if (!raw || raw.moving) return false; var mb = (raw.balls || {})[RTD.myId]; return !!(mb && !mb[3]); }
  function puo() {
    if (!palla()) return false;
    try { if (gf3dAcceso()) return !!GF3D.g.puoMirare(); } catch (e) { }
    return true;
  }
  function spara(d) {
    var g3 = null; try { g3 = gf3dTiro(d); } catch (e) { g3 = null; }
    if (g3) { rtdSend({ t: 'act', a: 'shot', ax: g3.ax, ay: g3.ay, power: g3.power }); }
    else {
      var _gc = RTD.lastRaw && RTD.lastRaw.course, sx = (RTD.cssW || 1) / ((_gc && _gc.w) || (RTD.map && RTD.map.w) || 1), sy = (RTD.cssH || 1) / ((_gc && _gc.h) || (RTD.map && RTD.map.h) || 1);
      var wx = -d.dx / sx, wy = -d.dy / sy, wm = Math.hypot(wx, wy) || 1;
      rtdSend({ t: 'act', a: 'shot', ax: wx / wm, ay: wy / wm, power: Math.max(0.2, d.pw) });
    }
    try { tg.HapticFeedback && tg.HapticFeedback.impactOccurred('medium'); } catch (e) { }
    PCG.tiri = (PCG.tiri || 0) + 1;
  }
  function vista() { try { gf3dTocco(); } catch (e) { } }
  function zoom(f) { try { if (gf3dAcceso() && GF3D.g.zoom) GF3D.g.zoom(f); } catch (e) { } }
  function chiudiGuida() { try { if (window.XPC && XPC.aperta && XPC.aperta()) XPC.guida(false); } catch (e) { } }
  var MS = null;
  function zona(t) { return !!(t && t.closest && t.closest('#arc-wrap') && !t.closest('button,a,input,select,textarea,.xpc-guida,.xpc-btn,#arc-overlay,.tw-overlay')); }
  addEventListener('mousedown', function (e) {
    if (!pc() || !inGolf() || !zona(e.target)) return;
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    e.stopPropagation(); e.preventDefault();
    chiudiGuida();
    if (e.button === 2) { vista(); return; }
    if (e.button !== 0) return;
    KB.via();
    if (!palla()) return;
    MS = { x0: e.clientX, y0: e.clientY, m: 0 };
    RTD.drag = { sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, pw: 0 };
    try { gf3dSblocca(); } catch (x) { }
  }, true);
  addEventListener('mousemove', function (e) {
    if (!MS) return;
    e.stopPropagation();
    if (!RTD.drag || !inGolf()) { MS = null; return; }
    var dx = e.clientX - MS.x0, dy = e.clientY - MS.y0;
    MS.m = Math.hypot(dx, dy);
    var k = PX_PIENA / PX_MOUSE;
    RTD.drag.dx = dx * k; RTD.drag.dy = dy * k;
    RTD.drag.pw = Math.min(1, Math.hypot(RTD.drag.dx, RTD.drag.dy) / PX_PIENA);
  }, true);
  addEventListener('mouseup', function (e) {
    if (!MS) { if (RTD && RTD.drag && RTD.drag.kb && e.button === 0) e.stopPropagation(); return; }
    e.stopPropagation();
    var d = RTD.drag, m = MS.m; MS = null; RTD.drag = null;
    if (!d || !inGolf()) return;
    if (m < 8) { vista(); return; }
    if (Math.hypot(d.dx, d.dy) < 14) return;
    spara(d);
  }, true);
  addEventListener('wheel', function (e) {
    if (!pc() || !inGolf() || !zona(e.target)) return;
    e.preventDefault(); zoom(e.deltaY > 0 ? 1.1 : 1 / 1.1);
  }, { capture: true, passive: false });
  var KB = PCG.KB = { on: false, ang: 0, pw: 0.5, k: {}, raf: 0, t: 0 };
  KB.via = function () { if (KB.on) { KB.on = false; if (RTD.drag && RTD.drag.kb) RTD.drag = null; } };
  function kbDrag() {
    var Lp = Math.max(0.2, KB.pw) * PX_PIENA;
    RTD.drag = { sx: 0, sy: 0, dx: -Math.sin(KB.ang) * Lp, dy: Math.cos(KB.ang) * Lp, pw: Math.max(0.2, KB.pw), kb: 1 };
  }
  function kbPasso(t) {
    KB.raf = 0;
    if (!KB.on) return;
    if (!inGolf() || !puo()) { KB.via(); return; }
    var dt = KB.t ? Math.min(0.05, (t - KB.t) / 1000) : 0.016; KB.t = t;
    var fine = KB.k.shift ? 0.25 : 1;
    var giro = (KB.k.r ? 1 : 0) - (KB.k.l ? 1 : 0), pot = (KB.k.u ? 1 : 0) - (KB.k.d ? 1 : 0);
    if (giro) KB.ang = Math.max(-Math.PI, Math.min(Math.PI, KB.ang + giro * 1.3 * fine * dt));
    if (pot) KB.pw = Math.max(0.2, Math.min(1, KB.pw + pot * 0.55 * fine * dt));
    kbDrag();
    if (giro || pot) KB.raf = requestAnimationFrame(kbPasso); else KB.t = 0;
  }
  function kbVai() { if (!KB.raf) { KB.t = 0; KB.raf = requestAnimationFrame(kbPasso); } }
  function kbAccendi() {
    if (KB.on) return true;
    if (!puo()) return false;
    KB.on = true; KB.ang = 0; kbDrag();
    try { gf3dSblocca(); } catch (x) { }
    return true;
  }
  PCX.golfTasto = function (c, giu, rep, e) {
    var dirs = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd' };
    if (c === 'ShiftLeft' || c === 'ShiftRight') { KB.k.shift = giu; return true; }
    if (dirs[c]) {
      KB.k[dirs[c]] = giu;
      if (giu) { chiudiGuida(); if (kbAccendi()) kbVai(); }
      return true;
    }
    if (c === 'Space' || c === 'Enter' || c === 'NumpadEnter') {
      if (giu && !rep) {
        chiudiGuida();
        if (!KB.on) { kbAccendi(); return true; }
        if (puo() && RTD.drag && RTD.drag.kb) { var d = RTD.drag; KB.on = false; RTD.drag = null; spara(d); }
      }
      return true;
    }
    if (c === 'KeyV' || c === 'KeyC') { if (giu && !rep) vista(); return true; }
    if (c === 'Equal' || c === 'NumpadAdd') { if (giu) zoom(1 / 1.1); return true; }
    if (c === 'Minus' || c === 'NumpadSubtract') { if (giu) zoom(1.1); return true; }
    if (c === 'Backspace' || c === 'KeyX') { if (giu) KB.via(); return true; }
    return false;
  };
  addEventListener('blur', function () { KB.k = {}; });
  PCG.stato = function () { return { on: KB.on, ang: +KB.ang.toFixed(3), pw: +KB.pw.toFixed(3), drag: !!(RTD && RTD.drag), kb: !!(RTD && RTD.drag && RTD.drag.kb), tiri: PCG.tiri || 0, d3: (function () { try { return gf3dAcceso(); } catch (e) { return false; } })() }; };
  PCG.rapporto = function (wrap) {
    try {
      if (!pc() || RTD.game !== 'golf' || !gf3dVuole()) return null;
      var r = wrap.getBoundingClientRect(), W = r.width || innerWidth, Hh = wrap.clientHeight || r.height;
      if (!Hh || Hh < 120) return null;
      return Math.max(0.3, Math.min(1.5, Hh / W));
    } catch (e) { return null; }
  };
  var css = document.createElement('style');
  css.textContent = 'html.pcx-golf #arc-body{position:relative}'
    + 'html.pcx-golf #arc-draghint{position:absolute;left:18px;top:62px;bottom:auto;right:auto;transform:none;z-index:6;pointer-events:none;margin:0;max-width:min(330px,calc(50% - 110px));white-space:normal;text-align:left;line-height:1.35}'
    + 'html.pcx-golf #arc-status:empty{display:none}';
  (document.head || H).appendChild(css);
  var golfSu = false, rifai = 0;
  function rimisura() { clearTimeout(rifai); rifai = setTimeout(function () { try { if (inGolf()) rtdCanvasInit(); } catch (e) { } }, 60); }
  setInterval(function () {
    var su = pc() && inGolf();
    if (su !== golfSu) { golfSu = su; H.classList.toggle('pcx-golf', su); if (su) rimisura(); }
  }, 300);
  try {
    var cade0 = window.gf3dCade;
    if (typeof cade0 === 'function' && !cade0.__pcx) {
      gf3dCade = function () { var r = cade0.apply(this, arguments); if (golfSu) rimisura(); return r; };
      gf3dCade.__pcx = 1;
    }
  } catch (e) { }
  var eraAcceso = false;
  setInterval(function () { var a = false; try { a = golfSu && gf3dAcceso(); } catch (e) { } if (a && !eraAcceso) rimisura(); eraAcceso = a; }, 300);
  setInterval(function () {
    try {
      if (!pc() || !inGolf()) return;
      var h = document.getElementById('arc-draghint'); if (!h) return;
      var t = L('Trascina indietro dovunque · o ← → mira, ↑ ↓ potenza, Spazio tira · V vista · rotella zoom',
                'Drag back anywhere · or ← → aim, ↑ ↓ power, Space shoot · V view · wheel zoom');
      if (h.textContent !== t) h.textContent = t;
    } catch (e) { }
  }, 500);
})();
