(function() {
  'use strict';
  var BACKEND_DOMAIN = '62-238-17-24.sslip.io';
  var ORIGINAL_FETCH = window.fetch.bind(window);
  function getInitData() {
    var v = '';
    try { v = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || ''; } catch (e) {}
    try {
      if (v) { localStorage.setItem('gb_init_data', v); }
      else { v = localStorage.getItem('gb_init_data') || ''; }
    } catch (e) {}
    return v;
  }
  window.gbInitData = getInitData;
  window.fetch = function(input, init) {
    init = init || {};
    var url = (typeof input === 'string') ? input : (input && input.url) || '';
    var isBackend = url.indexOf(BACKEND_DOMAIN) !== -1;
    if (isBackend) {
      init.headers = init.headers || {};
      if (init.headers instanceof Headers) {
        var h = {};
        init.headers.forEach(function(v, k) { h[k] = v; });
        init.headers = h;
      }
      if (!init.headers['ngrok-skip-browser-warning'] && !init.headers['Ngrok-Skip-Browser-Warning']) {
        init.headers['ngrok-skip-browser-warning'] = '1';
      }
      var initData = getInitData();
      if (initData && !init.headers['X-Telegram-Init-Data'] && !init.headers['x-telegram-init-data']) {
        init.headers['X-Telegram-Init-Data'] = initData;
      }
    }
    return ORIGINAL_FETCH(input, init);
  };
  window.getCurrentTelegramUserId = function() {
    var t = window.Telegram && window.Telegram.WebApp;
    if (t && t.initDataUnsafe && t.initDataUnsafe.user) {
      return String(t.initDataUnsafe.user.id);
    }
    return null;
  };
  console.log('[tg_auth] fetch patched — initData header will be auto-added to ' + BACKEND_DOMAIN + ' requests');
})();
