// GEM BRAWL 23/11 MOBILE — lo schermo del telefono, dentro la mini app (iframe) e da solo.
//  1. zone sicure vere: quella di Telegram (safeAreaInset + contentSafeAreaInset, della pagina o della mini app che la contiene)
//     meno quello che la mini app ha già tolto spostando l'iframe; e il tasto «‹» della mini app, se c'è, sopra l'iframe.
//     Scrive su :root --tg-t (px da aggiungere sopra a --sa-t) e --ind-b (fondo del tasto «‹», 0 se non c'è).
//  2. rotazione libera: la mini app blocca l'orientamento nei menu (ozAggiorna → lockOrientation); mentre GEM BRAWL è aperto
//     si sblocca (pagina e mini app, stessa origine) e alla chiusura si ridà alla mini app il suo stato.
//  3. un solo avviso quando la misura cambia davvero (resize, orientationchange, visualViewport, ResizeObserver, Telegram):
//     evento 'gb-schermo' su window; se il browser non ha mandato 'resize' (iframe che cresce, rotazioni pigre) lo manda lui.
(function () {
  'use strict';
  var D = document.documentElement, P = null;
  try { if (window.parent && window.parent !== window && window.parent.document) P = window.parent; } catch (e) { P = null; }
  var GBS = window.GBS = { incassato: window.parent !== window, t: 0, ind: null, W: 0, H: 0, oriz: false, n: 0 };
  function tg(w) { try { return (w && w.Telegram && w.Telegram.WebApp) || null; } catch (e) { return null; } }
  function num(v) { v = Number(v); return isFinite(v) && v > 0 ? Math.min(200, v) : 0; }
  function envTop() { try { var s = document.getElementById('sa'); return s ? parseFloat(getComputedStyle(s).paddingTop) || 0 : 0; } catch (e) { return 0; } }
  function zone() {
    var t = 0, ind = null;
    try {
      if (P) {
        var pt = tg(P), fe = window.frameElement, ft = fe ? fe.getBoundingClientRect().top : 0;
        if (pt) t = Math.max(0, num((pt.safeAreaInset || {}).top) + num((pt.contentSafeAreaInset || {}).top) - ft);
        var b = P.document.querySelector('#gemb-wrap .gemb-ind');
        if (b && fe && P.getComputedStyle(b).display !== 'none') {
          var r = b.getBoundingClientRect(), f = fe.getBoundingClientRect();
          if (r.width > 0 && r.bottom > f.top && r.left < f.right) ind = { l: r.left - f.left, t: r.top - f.top, r: r.right - f.left, b: r.bottom - f.top };
        }
      } else {
        var mt = tg(window);
        if (mt && mt.platform && mt.platform !== 'unknown') t = Math.max(0, num((mt.safeAreaInset || {}).top) + num((mt.contentSafeAreaInset || {}).top) - envTop());
      }
    } catch (e) { }
    GBS.t = Math.round(t); GBS.ind = ind;
    D.style.setProperty('--tg-t', GBS.t + 'px');
    D.style.setProperty('--ind-b', (ind ? Math.round(ind.b) : 0) + 'px');
    D.classList.toggle('gb-ind', !!ind);
  }
  // ---- rotazione libera finché la pagina è aperta ----
  var pt0 = P ? tg(P) : null, lockVero = null;
  function libera() {
    [tg(window), pt0].forEach(function (t) { try { if (t && typeof t.unlockOrientation === 'function') t.unlockOrientation(); } catch (e) { } });
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { }
    try { if (P && P.OZ && typeof P.OZ === 'object') P.OZ.lock = false; } catch (e) { }
  }
  if (pt0 && typeof pt0.lockOrientation === 'function') {
    lockVero = pt0.lockOrientation;
    try { pt0.lockOrientation = function () { GBS.lockTentati = (GBS.lockTentati || 0) + 1; }; } catch (e) { lockVero = null; }   // la mini app non ri-blocca mentre si gioca
  }
  libera();
  function ridai() {
    if (!pt0) return;
    try { if (lockVero) pt0.lockOrientation = lockVero; } catch (e) { }
    lockVero = null;
    try { if (P.OZ && typeof P.OZ === 'object') P.OZ.lock = null; if (typeof P.ozAggiorna === 'function') P.ozAggiorna(); } catch (e) { }
  }
  addEventListener('pagehide', ridai);
  addEventListener('beforeunload', ridai);
  // ---- misura che cambia ----
  var nativo = { W: innerWidth, H: innerHeight }, rid = 0;
  addEventListener('resize', function () { nativo.W = innerWidth; nativo.H = innerHeight; pianifica(); }, true);
  function pianifica() { if (!rid) rid = requestAnimationFrame(controlla); }
  function controlla() {
    rid = 0;
    var W = innerWidth, H = innerHeight;
    if (!W || !H) return;
    var cambia = W !== GBS.W || H !== GBS.H;
    zone();
    if (!cambia && GBS.n) return;
    var oriz = W > H, giro = GBS.n && oriz !== GBS.oriz;
    GBS.W = W; GBS.H = H; GBS.oriz = oriz; GBS.n++;
    if (giro) libera();
    if (W !== nativo.W || H !== nativo.H) { nativo.W = W; nativo.H = H; try { dispatchEvent(new Event('resize')); } catch (e) { } }
    try { dispatchEvent(new CustomEvent('gb-schermo', { detail: { W: W, H: H, oriz: oriz, giro: giro } })); } catch (e) { }
  }
  addEventListener('orientationchange', function () { pianifica(); setTimeout(pianifica, 150); setTimeout(pianifica, 450); });
  if (window.visualViewport) visualViewport.addEventListener('resize', pianifica);
  if (window.ResizeObserver) try { new ResizeObserver(pianifica).observe(D); } catch (e) { }
  [tg(window), pt0].forEach(function (t) { try { if (t && t.onEvent) ['viewportChanged', 'safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged'].forEach(function (k) { t.onEvent(k, pianifica); }); } catch (e) { } });
  zone();
  GBS.W = innerWidth; GBS.H = innerHeight; GBS.oriz = GBS.W > GBS.H;
  GBS.aggiorna = function () { zone(); pianifica(); };
})();
