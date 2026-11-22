(function () {
  'use strict';
  var W = window;
  if (W.BXG2011_OFF || W.BXG2011) return;
  var C = W.BXG2011 = { v: '2011', err: [], ultimo: null };
  function warn(k, e) { try { if (C.err.length < 20) C.err.push(k + ': ' + (e && e.message || e)); console.warn('[BXG2011] ' + k, e); } catch (_) { } }
  function hex(c) { return (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)) ? c : null; }
  function mx() { try { return (TVL_MAX && TVL_MAX.bx) | 0; } catch (e) { return 0; } }
  function voce(i) {
    i = i | 0; if (i < 1 || i > mx()) return 0;
    try {
      var l = (W.TV3G && TV3G.NUOVI && TV3G.NUOVI.bx) || [];
      for (var k = 0; k < l.length; k++) if (l[k].idx === i) { var c = l[k].c || {}; return { i: i, guanto: hex(c.guanto), polsino: hex(c.polsino) }; }
    } catch (e) { warn('voce', e); }
    return { i: i };
  }
  function diUid(uid) { try { return typeof W.tv3Sk === 'function' ? W.tv3Sk('bx', uid) : 0; } catch (e) { return 0; } }
  function diProf(p) { var v = (((p || {}).tvl) || {}).bx | 0; return (v >= 1 && v <= mx()) ? v : 0; }
  function nome(s) { try { return typeof W.fvNome === 'function' ? W.fvNome(s) : String(s == null ? '' : s); } catch (e) { return String(s); } }
  C.perAperta = function (j) {
    if (!j || j.t !== 'aperta' || j.bxg) return;
    var R = W.RTD || {}, pr = R.profiles || {}, nm = R.names || {};
    if (j.chi === 'a' || j.chi === 'b') {
      var io = String(R.myId || ''), op = null;
      Object.keys(nm).forEach(function (id) { if (String(id) !== io) op = String(id); });
      var mia = voce(diUid(io)), sua = (op && !/^bot/.test(op)) ? voce(diUid(op)) : 0;
      j.bxg = j.chi === 'a' ? [mia, sua] : [sua, mia];
    } else if (Array.isArray(j.nomi) && j.nomi.length >= 2) {
      var per = {}, doppi = {};
      Object.keys(pr).forEach(function (k) {
        var n = (nome((pr[k] || {}).name) || String(nm[k] || '')).slice(0, 24);
        if (!n) return;
        if (per[n] !== undefined) doppi[n] = 1; else per[n] = k;
      });
      j.bxg = [0, 1].map(function (i) {
        var n = String(j.nomi[i] == null ? '' : j.nomi[i]).slice(0, 24);
        if (!n || doppi[n] || per[n] === undefined) return 0;
        return voce(diProf(pr[per[n]]));
      });
    } else return;
    C.ultimo = j.bxg;
  };
  function aggancia() {
    if (typeof W.bxrtGiu !== 'function') return false;
    if (W.bxrtGiu.__bxg) return true;
    var orig = W.bxrtGiu;
    var f = function (m) {
      try { if (m && m.j && m.j.t === 'aperta') C.perAperta(m.j); } catch (e) { warn('aperta', e); }
      return orig.apply(this, arguments);
    };
    f.__bxg = 1; W.bxrtGiu = f;
    return true;
  }
  function segna() {
    try {
      var T = W.TV3G; if (!T || !T.GIOCHI) return false;
      T.GIOCHI.forEach(function (g) { if (g.k === 'boxe') g.gioco = true; });
      if (T.NEL_GIOCO) T.NEL_GIOCO.bx = 1;
      return true;
    } catch (e) { warn('segna', e); return false; }
  }
  function avvio() { aggancia(); segna(); }
  avvio();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio);
  W.addEventListener('load', avvio);
})();
