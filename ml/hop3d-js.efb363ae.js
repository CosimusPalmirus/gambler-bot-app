(function () {
  'use strict';
  var W = window, D = document;
  if (W.HOP3D_OFF || W.HOP3D) return;
  var PAG = 'hop/cappelli3d.html?v=2298d8b4';
  var H = W.HOP3D = { v: '2011b', sets: {}, scuri: {}, stato: '', pg: '', info: null, err: null, t0: 0, ms: 0, fr: null };
  var PGS = ['tonfo', 'zip', 'axa', 'camu', 'grumo', 'luma'];
  function warn(d, e) { try { console.warn('[HOP3D] ' + d, e); } catch (_) { } }
  function discord() { try { return !!(W.GXDC_RADICE || D.documentElement.classList.contains('gxdc') || (W.Telegram && Telegram.WebApp && Telegram.WebApp.__discord)); } catch (e) { return false; } }
  function pgMio() { var p = null; try { p = localStorage.getItem('hc_pg'); } catch (e) { } return PGS.indexOf(p) >= 0 ? p : 'tonfo'; }
  function risparmio() { try { var c = navigator.connection; return !!(c && c.saveData); } catch (e) { return false; } }
  var tAttesa = 0;
  function togliFr() { clearTimeout(tAttesa); tAttesa = 0; var f = H.fr; H.fr = null; if (f) { try { f.src = 'about:blank'; } catch (e) { } try { f.remove(); } catch (e) { } } }
  function avvia(prima) {
    var pg = pgMio();
    if (H.pg && H.pg !== pg && H.stato !== 'caricando') { H.sets = {}; H.scuri = {}; H.stato = ''; }
    if (H.stato) return;
    if (discord() || risparmio()) { H.stato = 'spento'; return; }
    H.stato = 'caricando'; H.pg = pg; H.t0 = Date.now();
    var ordine = [prima | 0, 0, 1, 2, 3].filter(function (v, i, a) { return a.indexOf(v) === i; }).join(',');
    try {
      var f = D.createElement('iframe');
      f.setAttribute('aria-hidden', 'true'); f.setAttribute('tabindex', '-1'); f.setAttribute('title', 'hop3d');
      f.style.cssText = 'position:fixed;left:-10000px;top:0;width:8px;height:8px;border:0;opacity:0;pointer-events:none;visibility:hidden';
      f.src = PAG + '&pg=' + pg + '&ordine=' + ordine;
      D.body.appendChild(f); H.fr = f;
      tAttesa = setTimeout(function () { if (H.stato === 'caricando') { H.err = 'tempo'; H.stato = Object.keys(H.sets).length ? 'fatto' : 'rotto'; togliFr(); } }, 25000);
    } catch (e) { H.stato = 'rotto'; H.err = String(e && e.message || e); togliFr(); }
  }
  H._ricevi = function (v, url, meta) {
    try {
      var im = new Image();
      im.onload = function () { H.sets[v] = { im: im, m: meta }; ridisegna(); };
      im.onerror = function () { warn('immagine ' + v, ''); };
      im.src = url;
    } catch (e) { warn('ricevi', e); }
  };
  H._fine = function (o) {
    H.info = o; H.ms = Date.now() - H.t0;
    if (!o || !o.ok) H.err = (o && o.errore) || 'errore';
    H.stato = (o && o.ok) ? 'fatto' : (Object.keys(H.sets).length ? 'fatto' : 'rotto');
    setTimeout(togliFr, 60);
  };
  function bloccata(cv) { try { return !!(cv && cv.closest && cv.closest('.st-quest,.st-presto,.st-corso')); } catch (e) { return false; } }
  function scuro(v) {
    if (H.scuri[v]) return H.scuri[v];
    var s = H.sets[v], c = D.createElement('canvas'); c.width = s.im.naturalWidth; c.height = s.im.naturalHeight;
    var x = c.getContext('2d'); x.drawImage(s.im, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(4,14,11,.66)'; x.fillRect(0, 0, c.width, c.height);
    return (H.scuri[v] = c);
  }
  function lucchetto(x, cx, cy, r) {
    x.save(); x.translate(cx, cy);
    x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.arc(0, 0, r * 1.35, 0, 6.2832); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.92)'; x.lineWidth = Math.max(1.2, r * .2); x.lineCap = 'round';
    x.beginPath(); x.arc(0, -r * .2, r * .42, Math.PI, 0); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.92)'; x.fillRect(-r * .62, -r * .2, r * 1.24, r * .9);
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(-r * .08, r * .05, r * .16, r * .36);
    x.restore();
  }
  var RAR = { 1: 'rgba(96,165,250,', 2: 'rgba(192,132,252,', 3: 'rgba(96,165,250,' };
  function disegna3d(x, Wd, Ht, t, idx) {
    var s = H.sets[idx], m = s.m, chiusa = bloccata(x.canvas);
    var g = x.createRadialGradient(Wd * .5, Ht * .42, Ht * .05, Wd * .5, Ht * .5, Math.max(Wd, Ht) * .75);
    g.addColorStop(0, '#0d3b2e'); g.addColorStop(1, '#03110c'); x.fillStyle = g; x.fillRect(0, 0, Wd, Ht);
    var lato = Math.min(Wd * .98, Ht * .99), px = (Wd - lato) / 2, py = Ht - lato;
    if (idx && !chiusa) {
      var a = .2 + .08 * Math.sin(t * 2.1), hg = x.createRadialGradient(Wd / 2, py + lato * .32, 0, Wd / 2, py + lato * .32, lato * .48);
      hg.addColorStop(0, (RAR[idx] || RAR[1]) + a + ')'); hg.addColorStop(1, (RAR[idx] || RAR[1]) + '0)'); x.fillStyle = hg; x.fillRect(0, 0, Wd, Ht);
    }
    var ph = (1 - Math.cos(t / 6 * 6.2832)) / 2, f = ph * (m.n - 1), f0 = Math.floor(f), a2 = f - f0, f1 = Math.min(m.n - 1, f0 + 1);
    var src = chiusa ? scuro(idx) : s.im;
    function fot(i, al) { if (al <= .01) return; x.globalAlpha = al; x.drawImage(src, (i % m.cols) * m.px, Math.floor(i / m.cols) * m.px, m.px, m.px, px, py, lato, lato); }
    fot(f0, 1); fot(f1, a2); x.globalAlpha = 1;
    if (chiusa && Wd < 200) lucchetto(x, Wd - Math.max(12, lato * .1), Math.max(12, lato * .1), Math.max(5, lato * .045));
    var lp = ((t * .4) % 1.8) - .4; if (lp > 0 && lp < 1 && !chiusa) { var sg = x.createLinearGradient(Wd * lp - Wd * .15, 0, Wd * lp + Wd * .15, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.07)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = sg; x.fillRect(0, 0, Wd, Ht); }
  }
  function scena(orig) {
    return function (x, Wd, Ht, t, idx, seed, k) {
      idx = idx | 0;
      if (H.sets[idx] && H.pg === pgMio()) { try { disegna3d(x, Wd, Ht, t, idx); return; } catch (e) { warn('disegno', e); } }
      if (!H.stato || (H.pg && H.pg !== pgMio() && H.stato !== 'caricando')) avvia(idx);
      return orig[0].apply(this, arguments);
    };
  }
  function ridisegna() {
    try {
      var I = TV3._int, sc = I.SCENE.hc;
      [].forEach.call(D.querySelectorAll('canvas[data-slot="hc"]'), function (cv) {
        var r = cv.__tv3; if (!r || r.anim || !r.w || !r.h) return;
        var x = cv.getContext('2d'); if (!x) return;
        x.setTransform(r.k || 1, 0, 0, r.k || 1, 0, 0); x.clearRect(0, 0, r.w, r.h);
        sc[0](x, r.w, r.h, sc[2], r.idx | 0, r.seed, r.k);
      });
    } catch (e) { warn('ridisegna', e); }
  }
  function aggancia() {
    try {
      var I = W.TV3 && TV3._int; if (!I || !I.SCENE || !I.SCENE.hc) return false;
      if (I.SCENE.hc.__hop3d) return true;
      var o = I.SCENE.hc, n = [scena(o), o[1], o[2]]; n.__hop3d = 1; n.__orig = o; I.SCENE.hc = n;
      H.aggancio = 1; return true;
    } catch (e) { warn('aggancio', e); return false; }
  }
  if (!aggancia()) {
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', aggancia);
    W.addEventListener('load', aggancia);
  }
})();
