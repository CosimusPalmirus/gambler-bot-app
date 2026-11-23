// GEM BRAWL 23/11 MOBILE — diagnosi leggera. Sempre: conta i contesti WebGL, ascolta «contesto perso», tiene gli ultimi avvisi
// in memoria (GBDIAG.nota) e sa dire cosa regge la GPU (GBDIAG.gpu()). Con ?diag=1: registro ogni 5 s (memoria, texture, video vivi),
// salvato anche nel telefono (localStorage, sopravvive a un ricaricamento), e un tasto DIAG in basso a sinistra con il riepilogo
// da copiare o fotografare. Niente rete, niente server.
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search), ON = Q.get('diag') === '1', T0 = Date.now();
  var G = window.GBDIAG = { on: ON, log: [], contesti: [], persi: 0, errori: 0, shader: 0 };
  function ora() { return ((Date.now() - T0) / 1000).toFixed(1) + 's'; }
  G.nota = function (s) {
    var r = ora() + ' ' + String(s).slice(0, 300);
    G.log.push(r); if (G.log.length > 300) G.log.splice(0, G.log.length - 300);
    if (ON) { salva(); if (G.el && G.el.classList.contains('aperto')) G.mostra(); }
  };
  var salvaT = 0;
  function salva() { if (salvaT) return; salvaT = setTimeout(function () { salvaT = 0; try { localStorage.setItem('gb_diag', JSON.stringify({ quando: new Date(T0).toISOString(), log: G.log.slice(-200), gpu: G._gpu || null })); } catch (e) { } }, 400); }
  var prima = null; try { prima = ON ? JSON.parse(localStorage.getItem('gb_diag') || 'null') : null; } catch (e) { }
  // ---- errori JS ----
  addEventListener('error', function (e) { G.errori++; G.nota('ERRORE ' + (e.message || (e.target && (e.target.src || e.target.href)) || '?') + (e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : '')); }, true);
  addEventListener('unhandledrejection', function (e) { G.errori++; var r = e.reason; G.nota('PROMESSA ' + (r && (r.message || r)) ); });
  // ---- contesti WebGL: quanti, quali, persi ----
  try {
    var gc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (tipo, o) {
      var c = gc.apply(this, arguments);
      if (c && /webgl/.test(tipo) && !this.__gbd) {
        this.__gbd = 1; var cv = this, nome = (cv.id || cv.className || 'canvas') + ':' + tipo;
        G.contesti.push(nome); if (ON) G.nota('contesto ' + nome + ' (' + G.contesti.length + ' in tutto)');
        cv.addEventListener('webglcontextlost', function () { G.persi++; G.nota('CONTESTO PERSO ' + nome); }, false);
        cv.addEventListener('webglcontextrestored', function () { G.nota('contesto ripreso ' + nome); }, false);
      }
      return c;
    };
  } catch (e) { }
  // ---- cosa regge la GPU (una volta, su una tela a parte che poi si butta) ----
  G.gpu = function () {
    if (G._gpu) return G._gpu;
    var o = { webgl2: false, webgl1: false };
    try {
      var c = document.createElement('canvas'); c.__gbd = 1; c.width = c.height = 1;   // la tela di prova non si conta
      var gl = c.getContext('webgl2'); o.webgl2 = !!gl;
      if (!gl) { gl = c.getContext('webgl') || c.getContext('experimental-webgl'); o.webgl1 = !!gl; }
      if (gl) {
        var dbg = gl.getExtension('WEBGL_debug_renderer_info');
        o.gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        o.marca = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        o.versione = gl.getParameter(gl.VERSION); o.glsl = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
        o.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE); o.maxUnitaF = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS); o.maxUnitaV = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
        o.maxUniformF = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS); o.maxUniformV = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS); o.maxVarying = gl.getParameter(gl.MAX_VARYING_VECTORS);
        var hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT); o.highpF = !!(hp && hp.precision > 0);
        o.est = ['EXT_color_buffer_float', 'EXT_color_buffer_half_float', 'OES_texture_float_linear', 'OES_standard_derivatives', 'WEBGL_compressed_texture_astc', 'WEBGL_compressed_texture_etc', 'EXT_texture_compression_bptc', 'KHR_parallel_shader_compile'].filter(function (k) { return !!gl.getExtension(k); });
        var lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext();
      }
    } catch (e) { o.errore = String(e && e.message || e); }
    // GPU debole: Mali/Adreno vecchie/PowerVR, poca texture, niente highp, o WebGL2 assente
    var g = String(o.gpu || '');
    o.debole = !o.webgl2 || (o.maxTex || 0) < 8192 || !o.highpF || /Mali-(T|G5[0-9]|G7[0-6])|Mali-4|PowerVR|Adreno \(TM\) [1-5]\d\d|SwiftShader|llvmpipe/i.test(g);
    G._gpu = o;
    return o;
  };
  // ---- registro ogni 5 s ----
  function video() { var n = 0, a = 0; [].forEach.call(document.querySelectorAll('video'), function (v) { if (v.getAttribute('src')) { n++; if (!v.paused) a++; } }); return n + ' carichi/' + a + ' attivi'; }
  function stato() {
    var s = [];
    try { if (performance.memory) s.push('js ' + Math.round(performance.memory.usedJSHeapSize / 1048576) + '/' + Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'); } catch (e) { }
    try { if (window.R3 && R3.renderer && R3.renderer.info) { var m = R3.renderer.info.memory; s.push('tex ' + m.textures + ' geo ' + m.geometries + ' draw ' + R3.renderer.info.render.calls); } } catch (e) { }
    s.push('video ' + video()); s.push('webgl ' + G.contesti.length + (G.persi ? ' PERSI ' + G.persi : ''));
    try { s.push('render ' + (window.Disegno ? (Disegno.tre ? '3D' : '2D') : '?') + (window.R3 && R3.profilo ? ' ' + R3.profilo : '')); } catch (e) { }
    try { if (window.__brawl) s.push('fase ' + window.__brawl.fase); } catch (e) { }
    return s.join(' · ');
  }
  G.stato = stato;
  G.riepilogo = function () {
    var g = G.gpu(), r = [];
    r.push('GEM BRAWL diag ' + new Date().toISOString().slice(0, 19) + ' ' + innerWidth + 'x' + innerHeight + ' dpr ' + (window.devicePixelRatio || 1));
    r.push(navigator.userAgent);
    r.push('GPU ' + (g.gpu || '?') + ' / ' + (g.marca || '?'));
    r.push((g.webgl2 ? 'WebGL2' : g.webgl1 ? 'SOLO WebGL1' : 'NIENTE WebGL') + ' · ' + (g.versione || '') + ' · maxTex ' + g.maxTex + ' · highp ' + (g.highpF ? 'si' : 'NO') + ' · unità ' + g.maxUnitaF + '/' + g.maxUnitaV + ' · uniform ' + g.maxUniformF + '/' + g.maxUniformV + ' · varying ' + g.maxVarying + (g.debole ? ' · PROFILO RIDOTTO' : ''));
    r.push('est: ' + (g.est || []).join(', '));
    r.push('contesti: ' + G.contesti.join(', ') + ' · persi ' + G.persi + ' · errori ' + G.errori + ' · shader rotti ' + G.shader);
    r.push('ora: ' + stato());
    r.push('--- registro ---'); r = r.concat(G.log.slice(-60));
    if (prima && prima.log) { r.push('--- sessione prima (' + prima.quando + ') ---'); r = r.concat(prima.log.slice(-25)); }
    return r.join('\n');
  };
  if (!ON) return;
  setInterval(function () { G.nota(stato()); }, 5000);
  function monta() {
    var b = document.createElement('div'); b.id = 'gbdiag';
    b.innerHTML = '<button type="button" class="gd-t">DIAG</button><div class="gd-p"><pre></pre><div class="gd-k"><button type="button" class="gd-c">Copia</button><button type="button" class="gd-x">Chiudi</button></div></div>';
    var st = document.createElement('style');
    st.textContent = '#gbdiag{position:fixed;left:calc(env(safe-area-inset-left,0px) + 4px);bottom:calc(env(safe-area-inset-bottom,0px) + 4px);z-index:99999;font:11px/1.3 ui-monospace,monospace;color:#d8ffe0}' +
      '#gbdiag .gd-t{background:#000c;color:#3bff8b;border:1px solid #3bff8b;border-radius:6px;padding:4px 7px;font:700 11px monospace}#gbdiag.persi .gd-t{color:#ff4d5e;border-color:#ff4d5e}' +
      '#gbdiag .gd-p{display:none;position:fixed;inset:8px;background:#000e;border:1px solid #3bff8b;border-radius:8px;padding:8px;flex-direction:column}#gbdiag.aperto .gd-p{display:flex}' +
      '#gbdiag pre{flex:1;margin:0;overflow:auto;white-space:pre-wrap;word-break:break-all;user-select:text;-webkit-user-select:text}#gbdiag .gd-k{display:flex;gap:8px;margin-top:6px}#gbdiag .gd-k button{flex:1;padding:10px;font:700 13px system-ui;border-radius:8px;border:0;background:#3bff8b;color:#062010}';
    document.head.appendChild(st); document.body.appendChild(b); G.el = b;
    G.mostra = function () { b.querySelector('pre').textContent = G.riepilogo(); };
    b.querySelector('.gd-t').onclick = function () { b.classList.toggle('aperto'); if (b.classList.contains('aperto')) G.mostra(); };
    b.querySelector('.gd-x').onclick = function () { b.classList.remove('aperto'); };
    b.querySelector('.gd-c').onclick = function () {
      var t = G.riepilogo();
      try { navigator.clipboard.writeText(t).then(function () { b.querySelector('.gd-c').textContent = 'Copiato'; }, sel); } catch (e) { sel(); }
      function sel() { var r = document.createRange(); r.selectNodeContents(b.querySelector('pre')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); try { document.execCommand('copy'); } catch (e) { } }
    };
    setInterval(function () { b.classList.toggle('persi', G.persi > 0 || G.shader > 0); }, 1000);
  }
  if (document.body) monta(); else addEventListener('DOMContentLoaded', monta);
  G.nota('avvio ' + location.search.slice(0, 120));
  setTimeout(function () { var g = G.gpu(); G.nota('GPU ' + g.gpu + ' · ' + (g.webgl2 ? 'WebGL2' : 'WebGL1') + ' · maxTex ' + g.maxTex + (g.debole ? ' · ridotto' : '')); }, 0);
})();
