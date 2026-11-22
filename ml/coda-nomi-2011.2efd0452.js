(function(){
  'use strict';
  var CN = {membri: null, foto: {}, gioco: '', lid: null, visti: {}};
  window.CN_CODA = CN;
  function L(it, en){ return window.GB_LANG === 'en' ? en : it; }
  function iniz(s){ s = String(s || '').replace(/[^0-9A-Za-zÀ-ɏͰ-ϿЀ-ӿ֐-ۿ぀-ヿ一-鿿]/g, ''); return (s.charAt(0) || '?').toUpperCase(); }
  function fotoOk(u){ u = String(u || ''); return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(u) || /^https:\/\/[^\s"'<>]+$/.test(u); }
  function persona(m, foto, nuovo){
    if (m.vuoto) {
      var pv = document.createElement('div'); pv.className = 'cn-p vuoto';
      var av0 = document.createElement('div'); av0.className = 'cn-av';
      var n0 = document.createElement('div'); n0.className = 'cn-n'; n0.textContent = L('Libero', 'Open');
      pv.appendChild(av0); pv.appendChild(n0); return pv;
    }
    var io = !!m.io, nome = io ? L('Tu', 'You') : (String(m.n || '').trim() || (m.b ? 'Bot' : L('Giocatore', 'Player')));
    var p = document.createElement('div'); p.className = 'cn-p' + (io ? ' io' : '') + (nuovo ? ' cn-nuovo' : '');
    var av = document.createElement('div'); av.className = 'cn-av';
    av.textContent = iniz(m.n || nome);
    if (foto && fotoOk(foto)) {
      var im = document.createElement('img'); im.alt = ''; im.decoding = 'async'; im.referrerPolicy = 'no-referrer';
      im.addEventListener('error', function(){ if (im.parentNode) im.parentNode.removeChild(im); }, {once: true});
      im.src = foto; av.appendChild(im);
    }
    var n = document.createElement('div'); n.className = 'cn-n'; n.textContent = nome;
    p.title = String(m.n || nome);
    p.appendChild(av); p.appendChild(n);
    return p;
  }
  function blocco(lista, fotoDi, chiave, riga){
    var w = document.createElement('div'); w.className = 'cn-tav' + (riga ? ' cn-riga' : ''); w.setAttribute('data-cn', chiave);
    w.setAttribute('aria-label', L('Al tavolo', 'At the table') + ': ' + lista.map(function(m){ return m.io ? L('tu', 'you') : String(m.n || ''); }).join(', '));
    var k = document.createElement('div'); k.className = 'cn-tav-k';
    var pieni = lista.filter(function(m){ return !m.vuoto; }).length;
    k.textContent = L('Al tavolo', 'At the table') + ' · ' + pieni + (pieni < lista.length ? '/' + lista.length : '');
    var g = document.createElement('div'); g.className = 'cn-tav-g';
    lista.forEach(function(m){
      var id = m.vuoto ? '' : String(m.k || m.n || '');
      var nuovo = CN.visti.__on && !CN.visti[id];
      CN.visti[id] = 1;
      g.appendChild(persona(m, fotoDi(m), nuovo));
    });
    CN.visti.__on = 1;
    w.appendChild(k); w.appendChild(g);
    if (riga) setTimeout(function(){ try {
      w.classList.toggle('cn-scorre', g.scrollWidth > g.clientWidth + 2);
      var io = g.querySelector('.cn-p.io'); if (io && g.scrollWidth > g.clientWidth + 2) g.scrollLeft = Math.max(0, io.offsetLeft - g.offsetLeft - 8);
    } catch(e){} }, 0);
    return w;
  }
  function firma(lista, fotoDi){
    return lista.map(function(m){ return [m.k, m.n, m.io ? 1 : 0, m.vuoto ? 1 : 0, fotoDi(m) ? 1 : 0].join('\u0001'); }).join('\u0002') + '|' + (window.GB_LANG || '');
  }
  var CORPI = ['arc-body', 'tw-body', 'gld-body', 'tk-body'];
  function corpoRicerca(){
    for (var i = 0; i < CORPI.length; i++) {
      var b = document.getElementById(CORPI[i]);
      if (!b || !b.offsetParent) continue;
      var a = b.querySelector('.gbc-posti') || b.querySelector('#arc-sn,#twr-sn,#gld-sn,.tw-search-n');
      if (a) return {b: b, a: a};
    }
    return null;
  }
  function togliRicerca(){
    CORPI.forEach(function(id){ var b = document.getElementById(id); if (!b) return;
      [].forEach.call(b.querySelectorAll('.cn-tav'), function(x){ x.parentNode.removeChild(x); });
      [].forEach.call(b.querySelectorAll('.cn-con'), function(x){ x.classList.remove('cn-con'); }); });
  }
  function disegnaRicerca(){
    if (window.CN_OFF) { togliRicerca(); return; }
    var c = corpoRicerca();
    if (!c || !CN.membri || !CN.membri.length) { togliRicerca(); return; }
    var fotoDi = function(m){ return m.b ? '' : (CN.foto[m.k] || ''); };
    var f = firma(CN.membri, fotoDi), vecchio = c.b.querySelector('.cn-tav');
    if (vecchio && vecchio.getAttribute('data-cn') === f && vecchio.previousElementSibling === c.a) return;
    if (vecchio) vecchio.parentNode.removeChild(vecchio);
    var w = blocco(CN.membri, fotoDi, f, true);
    c.a.parentNode.insertBefore(w, c.a.nextSibling);
    if (c.a.classList.contains('gbc-posti')) c.a.parentNode.classList.add('cn-con');
  }
  var giro = 0;
  function presto(){ if (giro) return; giro = 1; setTimeout(function(){ giro = 0; try { disegnaRicerca(); disegnaCarta(); } catch(e){ try { console.warn('CN', e); } catch(_){} } }, 0); }
  function ricevi(m){
    if (!m || typeof m !== 'object') return;
    var t = m.t;
    if (t === 'hello_ok') { CN.foto = {}; return; }
    if (t === 'start' || t === 'left' || t === 'refund') { CN.membri = null; CN.visti = {}; presto(); return; }
    if (t !== 'lobby' || m.tour) return;
    if (!Array.isArray(m.membri)) { CN.membri = null; presto(); return; }
    var g = String(m.game || '') + '|' + String(m.lid || m.tier || '');
    if (g !== CN.gioco) { CN.gioco = g; CN.visti = {}; }
    CN.lid = m.lid || null;
    CN.membri = m.membri.slice(0, 12).filter(function(x){ return x && typeof x === 'object'; });
    if (m.foto && typeof m.foto === 'object') for (var k in m.foto) if (Object.prototype.hasOwnProperty.call(m.foto, k) && fotoOk(m.foto[k])) CN.foto[k] = m.foto[k];
    presto();
  }
  function avvolgi(nome){
    var o = window[nome];
    if (typeof o !== 'function' || o.__cn) return;
    var f = function(m){ try { ricevi(m); } catch(e){} return o.apply(this, arguments); };
    f.__cn = 1;
    try { window[nome] = f; } catch(e){}
  }
  function disegnaCarta(){
    var body = document.getElementById('lob-body');
    if (!body) return;
    var vecchio = body.querySelector('.cn-tav');
    var c = (typeof LOB !== 'undefined' && LOB) ? LOB.card : null;
    var sedi = body.querySelector('#lob-seats-v');
    var lista = null, fotoDi = function(){ return ''; };
    if (!window.CN_OFF && c && sedi && String(c.stato || 'aperta') === 'aperta') {
      if (CN.membri && CN.lid && String(CN.lid) === String(c.lid)) { lista = CN.membri; fotoDi = function(m){ return m.b ? '' : (CN.foto[m.k] || ''); }; }
      else if (Array.isArray(c.giocatori) && c.giocatori.length) {
        var base = (typeof BACKEND === 'string' ? BACKEND : '').replace(/\/+$/, '');
        lista = c.giocatori.slice(0, 10).map(function(g, i){
          g = g || {};
          var f = String(g.f || '');
          return {k: 'c' + i, n: String(g.n || ''), f: /^\/foto\/k\/[0-9a-f]{24}\.jpg$/.test(f) && base ? base + f : ''};
        });
        fotoDi = function(m){ return m.f || ''; };
      }
      else if (Array.isArray(c.nomi) && c.nomi.length) lista = c.nomi.slice(0, 10).map(function(n, i){ return {k: 'c' + i, n: String(n || '')}; });
    }
    if (!lista) { if (vecchio) vecchio.parentNode.removeChild(vecchio); if (sedi && sedi.__cnNasc) { sedi.__cnNasc = 0; sedi.style.removeProperty('display'); } return; }
    var posti = Math.min(10, Number(c.posti) || 0), occ = Math.max(lista.length, Math.min(posti, Number(c.seduti) || 0));
    lista = lista.slice(0, 10);
    for (var i = lista.length; i < occ; i++) lista.push({k: 'x' + i, n: ''});
    for (var j = lista.length; j < posti; j++) lista.push({k: 'v' + j, vuoto: 1});
    sedi.__cnNasc = 1; sedi.style.setProperty('display', 'none', 'important');
    var f = firma(lista, fotoDi);
    if (vecchio && vecchio.getAttribute('data-cn') === f && vecchio.previousElementSibling === sedi) return;
    if (vecchio) vecchio.parentNode.removeChild(vecchio);
    sedi.parentNode.insertBefore(blocco(lista, fotoDi, f), sedi.nextSibling);
  }
  function avvolgiCarta(){
    var o = window.lobRenderCard;
    if (typeof o !== 'function' || o.__cn) return;
    var f = function(){ var r = o.apply(this, arguments); presto(); return r; };
    f.__cn = 1;
    try { window.lobRenderCard = f; } catch(e){}
  }
  function monta(){ ['rtdOnMsg', 'twrOnMsg', 'gldOnMsg', 'tkOnMsg'].forEach(avvolgi); avvolgiCarta(); }
  monta();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monta);
  window.addEventListener('load', monta);
  setInterval(function(){ monta(); if (CN.membri) disegnaRicerca(); }, 2000);
})();
