// GAMBLER BRAWL — clip Seedance con alfa «impilata» nei MENU (home, scheda eroe, MVP), 17/11.
// Regola del proprietario: i modelli 3D di gioco non si vedono MAI fuori dalla partita. Fuori partita: le clip Seedance
// (menu_video/<id>/v2/final/, stesso metodo della lobby video) per chi le ha, l'arte 2D approvata per gli altri.
// MP4 H.264: colore premoltiplicato a sinistra, alfa a destra; una tela WebGL per vetrina.
// ClipAlfa.ha(id) -> true se l'eroe ha le clip; ClipAlfa.monta(el, id, {intro}) -> {azione(), ferma()}
(function () {
  'use strict';
  // vi = ?v= dell'intro, v = ?v= delle altre clip (uguale a lobby_video.js)
  var KIT = {
    pistolero: { base: ['fumo', 'bandana', 'cappello', 'guarda', 'estrae'], vi: 'compatta1711', v: '' },
    samurai: { dir: 'v3', base: ['collo', 'zucca', 'guarda', 'inchino'], vi: 'v3a1711', v: 'v3a1711' },   // 17/11 sera: v3 posa 1
    // 21/11: vetrina (home, scheda, MVP) con le clip v3 nuove come la lobby (prima c'era l'arte 2D vecchia: «Gambler Bot non lo vedo nella vetrina»). Azioni da clip.json.
    lupo: { dir: 'v3', base: [], vi: 'v3g2211', v: 'v3g2211' },
    croupier: { dir: 'v3', base: [], vi: 'v3g2211', v: 'v3a2111' },
    arciere: { dir: 'v3', base: [], vi: 'v3g2211', v: 'v3b2111' },
    agamennone: { dir: 'v3', base: [], vi: 'v3g2211', v: 'v3b2111' },
    buttafuori: { dir: 'v3', base: [], vi: 'v3g2211', v: 'v3b2111' },
    pizzaiolo: { dir: 'v3', base: [], vi: 'v3g2211', v: 'v3b2111' },
    dj: { dir: 'v3', base: [], vi: 'v3g2211', v: 'v3b2111' },
    veggente: { dir: 'v3', base: [], vi: 'v3g2211', v: 'v3b2111' },
    bot: { dir: 'v3', base: [], vi: 'v3g2211', v: 'v3g2211' },
    // 23/11: i 4 eroi carte (Fante nella forma normale) con le clip v3: per ora entrata + idle (credito OpenRouter finito: azioni e vittoria non generate)
    dama: { dir: 'v3', base: [], vi: 'vc2311d', v: 'vc2311d' }, asso: { dir: 'v3', base: [], vi: 'vc2311', v: 'vc2311d' },
    regina: { dir: 'v3', base: [], vi: 'vc2311d', v: 'vc2311d' }, fante: { dir: 'v3', base: [], vi: 'vc2311c', v: 'vc2311d' }
    // 17/11 sera: clip v2 del Samurai scartate (stile diverso dal Pistolero): si rifanno in v3. Fino ad allora arte 2D.
    // samurai: { base: ['collo', 'zucca', 'guarda', 'spalla', 'inchino'], vi: 'sam1711', v: 'sam1711' }
  };
  // 22/11 SERIE UNIFORME (richiesta del proprietario: «sembrano inquadrati tutti in modo diverso»). Misure sul 1o fotogramma idle
  // (menu_video/_comune/inquadratura_2211.json): piedi a 909/960 per tutti; s = scala perché occhi-piedi = 580 px x taglia vera
  // (Buttafuori 1,08, Agamennone 1,03); ax = asse del corpo (px su 720) portato al centro. Trasformazione attorno ai piedi:
  // punto D = (360, 909) + s * (F - (ax, 909)). La usano le vetrine qui sotto e i piedistalli di lobby_video.js.
  var INQ = {
    samurai: { s: 0.965, ax: 377 }, pistolero: { s: 0.998, ax: 361 }, lupo: { s: 1.002, ax: 345 }, croupier: { s: 1.002, ax: 400 },
    arciere: { s: 1.019, ax: 370 }, agamennone: { s: 1.041, ax: 360 }, buttafuori: { s: 0.920, ax: 358 }, pizzaiolo: { s: 1.016, ax: 367 },
    dj: { s: 1.002, ax: 353 }, veggente: { s: 0.894, ax: 323 }, bot: { s: 1.047, ax: 409 },
    // 23/11 eroi carte (stessa regola, inquadratura_2211.json)
    dama: { s: 0.972, ax: 345 }, asso: { s: 0.959, ax: 360 }, regina: { s: 1.096, ax: 395 }, fante: { s: 1.158, ax: 376 }
  };
  var PIEDE = 909 / 960, NOINQ = /[?&]inq=0(&|$)/.test(location.search);   // ?inq=0 = inquadratura di prima (solo per le prove)
  // rettangolo {x,y,w,h} del fotogramma intero -> rettangolo corretto per l'eroe (stesse unità)
  function inquadra(id, r) {
    var q = INQ[id]; if (!q || NOINQ) return r;
    return { x: r.x + r.w * (0.5 - q.s * q.ax / 720), y: r.y + r.h * PIEDE * (1 - q.s), w: r.w * q.s, h: r.h * q.s };
  }
  var JSON_ = {};
  function cartella(id) { return 'menu_video/' + id + '/' + (KIT[id].dir || 'v2') + '/final/'; }
  // q = '' clip piena, '_m' telefono (24/11: il menu di Gem Brawl, come la lobby video), '_s' piccola
  function url(id, k, q) { var K = KIT[id], v = k === 'intro' ? K.vi : K.v; return cartella(id) + id + '_' + k + '_alfa' + (q || '') + '.mp4' + (v ? '?v=' + v : ''); }
  function leggi(id) {
    if (!JSON_[id]) JSON_[id] = fetch(cartella(id) + 'clip.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return JSON_[id];
  }
  function azioni(id) { return leggi(id).then(function (j) { return (j && j.azioni) || KIT[id].base; }); }
  // r = rettangolo della clip nella tela (x, y dall'alto, w, h in frazioni): serve per la serie uniforme (inquadra)
  var VS = 'attribute vec2 p;uniform vec4 r;varying vec2 u;void main(){u=vec2(p.x,1.-p.y);gl_Position=vec4((r.x+p.x*r.z)*2.-1.,1.-(r.y+(1.-p.y)*r.w)*2.,0.,1.);}';
  var FS = 'precision mediump float;varying vec2 u;uniform sampler2D t;uniform float px;' +
    'void main(){vec2 c=vec2(clamp(u.x*.5,px,.5-px),u.y);vec2 a=vec2(clamp(.5+u.x*.5,.5+px,1.-px),u.y);' +
    'float al=smoothstep(.1,.95,texture2D(t,a).r);vec3 col=min(texture2D(t,c).rgb,vec3(al));gl_FragColor=vec4(col,al);}';
  function video() {
    var v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto';
    return v;
  }
  function monta(el, id, opz) {
    opz = opz || {};
    var cv = document.createElement('canvas'); cv.className = 'clipv';
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    el.appendChild(cv);
    var gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    var ctl = { vivo: true, azione: function () { }, ferma: function () { } };
    if (!gl) return ctl;
    var sh = function (k, s) { var o = gl.createShader(k); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var upx = gl.getUniformLocation(pr, 'px');
    var rq = inquadra(id, { x: 0, y: 0, w: 1, h: 1 }); gl.uniform4f(gl.getUniformLocation(pr, 'r'), rq.x, rq.y, rq.w, rq.h);
    var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR); });
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    var V = [video(), video()], att = null, giro = 0, ultimoT = -1, lista = [], ultima = null, idleN = 0, serve = 1, forza = null;
    var riserva = function () { return V[0] === att ? V[1] : V[0]; };
    function prepara(src) { var r = riserva(); if (r.getAttribute('src') !== src) { r.setAttribute('src', src); r.load(); } else { try { r.currentTime = 0; } catch (e) { } } }
    function prossima(k) {
      if (forza) { var f = forza; forza = null; return f; }
      if (k !== 'idle') { idleN = 0; serve = k === 'intro' ? 1 : 1 + (Math.random() < 0.45 ? 1 : 0); return 'idle'; }
      idleN++; if (idleN < serve || !lista.length) return 'idle';
      var pool = lista.filter(function (a) { return a !== ultima; }); if (!pool.length) pool = lista; ultima = pool[Math.floor(Math.random() * pool.length)]; return ultima;
    }
    function suona(k) {
      if (!ctl.vivo) return;
      var src = url(id, k, opz.q); prepara(src);
      var r = riserva(), vecchio = att, n = ++giro;
      r.onended = function () { if (n === giro) suona(prossima(k)); };
      var p = r.play(); if (p && p.catch) p.catch(function () { });
      var via = function () { if (n !== giro) return; att = r; ultimoT = -1; if (vecchio && vecchio !== r) vecchio.pause(); };
      if (r.requestVideoFrameCallback) r.requestVideoFrameCallback(via); else r.addEventListener('playing', via, { once: true });
    }
    (function disegna() {
      if (!ctl.vivo) return;
      requestAnimationFrame(disegna);
      var w = Math.round(cv.clientWidth * Math.min(2, window.devicePixelRatio || 1)), h = Math.round(cv.clientHeight * Math.min(2, window.devicePixelRatio || 1));
      if (w > 0 && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; ultimoT = -1; }
      if (!att || att.readyState < 2 || att.currentTime === ultimoT || !w) return;
      ultimoT = att.currentTime;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, att);
      gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(upx, 0.5 / (att.videoWidth || 1440)); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!ctl.primo) { ctl.primo = true; if (opz.pronto) try { opz.pronto(); } catch (e) { } }   // 24/11: primo fotogramma (il menu toglie l'arte 2D)
    })();
    azioni(id).then(function (l) { lista = l; });
    // 22/11 MVP di fine partita (#f-vetrina): parte con la clip di VITTORIA (<id>_vittoria_alfa.mp4) se clip.json ha "vittoria": true,
    // poi idle e azioni come sempre; chi non ce l'ha entra con l'intro di prima.
    if (opz.vittoria || el.id === 'f-vetrina') leggi(id).then(function (j) { if (ctl.vivo) suona(j && j.vittoria ? 'vittoria' : (opz.intro === false ? 'idle' : 'intro')); });
    else suona(opz.intro === false ? 'idle' : 'intro');
    // tocco: la prossima clip è un'azione (dopo quella in corso, così la catena resta senza scatti)
    ctl.azione = function () { if (!lista.length) return; var pool = lista.filter(function (a) { return a !== ultima; }); if (!pool.length) pool = lista; ultima = forza = pool[Math.floor(Math.random() * pool.length)]; };
    ctl.ferma = function () {
      ctl.vivo = false; giro++;
      V.forEach(function (v) { v.pause(); v.onended = null; v.removeAttribute('src'); v.load(); });
      try { var e = gl.getExtension('WEBGL_lose_context'); if (e && !gl.isContextLost()) e.loseContext(); } catch (x) { }   // 24/11: WebKit a volte l'ha gia' perso da solo (avviso in console)
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    };
    return ctl;
  }
  window.ClipAlfa = { KIT: KIT, ha: function (id) { return !!KIT[id]; }, monta: monta, url: url, INQ: INQ, inquadra: inquadra };
})();
