// GAMBLER BRAWL — LOBBY VIDEO a piedistalli (prototipo locale, 17/11). Si accende con ?lobbyv=1.
// Un piedistallo per ogni posto della TUA squadra (3v3 = 3, tu al centro; duello / tutti contro tutti = 1). Gli avversari non
// hanno piedistallo: solo un contatore «avversari» nella banda di ricerca (si vedono poi nel versus della partita).
// Ogni giocatore della tua squadra — tu e gli alleati (bot) — quando sceglie o cambia eroe lo fa SALTARE DENTRO da fuori quadro, poi idle vivo
// (idle in loop + azioni a caso, mai la stessa due volte di fila). Posti vuoti: «in attesa»; chi ha deciso: PRONTO.
// Le clip Seedance hanno l'alfa «impilata» (MP4 H.264: colore premoltiplicato a sinistra, alfa a destra): UNA sola tela
// WebGL disegna tutti i piedistalli (un contesto solo), ogni posto ha la sua texture. Il tuo posto usa la clip a 720 px,
// gli altri quella a 360 px. Eroi senza clip: arte 2D approvata con lo stesso salto e un idle leggero (CSS).
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  if (Q.get('lobbyv') !== '1') return;
  var LB = window.__brawlLobby, CU = window.CAST_UI || { ORDINE: [], E: {} }, S = window.Suoni || {};
  if (!LB) { console.warn('lobby video: manca window.__brawlLobby'); return; }
  var LANG = Q.get('lang') === 'en' ? 'en' : 'it';
  var TX = {
    it: { scegli: 'Scegli il tuo eroe', cerca: 'Cerca partita', annulla: 'Annulla', attesa: 'In attesa', sceglie: 'Sceglie', pronto: 'PRONTO', tu: 'TU', esci: 'Lobby classica', anteprima: 'arte 2D',
      cercando: 'Cerco giocatori', trovati: 'giocatori', avv: 'Avversari', sono_pronto: 'Sono pronto!', inizia: 'Inizia', tutti: 'Tutti pronti!', modi: { gemme: '3 contro 3', duello: 'Duello 1v1', sopravvivenza: 'Tutti contro tutti' } },
    en: { scegli: 'Choose your champion', cerca: 'Find match', annulla: 'Cancel', attesa: 'Waiting', sceglie: 'Choosing', pronto: 'READY', tu: 'YOU', esci: 'Classic lobby', anteprima: '2D art',
      cercando: 'Finding players', trovati: 'players', avv: 'Opponents', sono_pronto: "I'm ready!", inizia: 'Start', tutti: 'All ready!', modi: { gemme: '3 vs 3', duello: 'Duel 1v1', sopravvivenza: 'Free for all' } }
  }[LANG];

  // ---------------- clip ----------------
  // un kit per eroe (17/11: dopo il Pistolero, il Samurai con lo stesso metodo). Cartella menu_video/<id>/v2/final/:
  // <id>_intro_alfa[_s].mp4, <id>_idle_alfa[_s].mp4, <id>_<azione>_alfa[_s].mp4 + clip.json {azioni, atterra, rimbalzo}.
  // vi = ?v= dell'intro, v = ?v= delle altre clip (il Pistolero tiene gli URL di prima).
  var KIT = {
    pistolero: { tutte: ['fumo', 'tamburo', 'bandana', 'cappello', 'guarda', 'estrae', 'spin'], base: ['fumo', 'bandana', 'cappello', 'guarda', 'estrae'],   // 17/11: 'tamburo' tolta (pistola deformata)
      vi: 'compatta1711', v: '', atterra: 0.09, rimbalzo: 0.58 },
    // 17/11 sera: clip v3 APPROVATE dal proprietario (colore corretto con grade.py)
    // 17/11 sera: Samurai v3 (posa 1, katana sulla spalla, stile Brawl approvato). Intro dal volo (gia' tutto in quadro), atterra a 0,04 s, polvere nella clip.
    // 'abbassa' resa ma fuori rotazione (la lama esce dal bordo sinistro): clip.json decide le azioni.
    samurai: { dir: 'v3', tutte: ['collo', 'zucca', 'guarda', 'inchino', 'abbassa'], base: ['collo', 'zucca', 'guarda', 'inchino'],
      vi: 'v3a1711', v: 'v3a1711', atterra: 0.04, rimbalzo: 0.58, polvere: false },
    // 21/11: Lupo (posa 4) e Croupier (posa 1) v3, stesso metodo del Samurai, relight come il Pistolero. Per ora solo intro + idle
    // (credito OpenRouter finito): le azioni si accendono da clip.json quando ci sono i file.
    lupo: { dir: 'v3', tutte: ['annusa', 'artigli', 'ulula', 'coda', 'papillon'], base: [], vi: 'v3g2211', v: 'v3g2211', atterra: 0.04, rimbalzo: 0.58, polvere: true },
    croupier: { dir: 'v3', tutte: ['baffi', 'visiera', 'rastrella', 'picchietta', 'inchino'], base: [], vi: 'v3g2211', v: 'v3a2111', atterra: 0.04, rimbalzo: 0.58, polvere: true },
    // 21/11 sera: i 7 eroi nuovi (design approvati 21/11), stesso metodo v3. Le azioni accese le decide clip.json di ogni eroe.
    arciere: { dir: 'v3', tutte: ['cappello', 'freccia', 'corda'], base: [], vi: 'v3g2211', v: 'v3b2111', atterra: 0.08, rimbalzo: 0.58, polvere: true },
    agamennone: { dir: 'v3', tutte: ['batte', 'ruggito', 'scudo'], base: [], vi: 'v3g2211', v: 'v3b2111', atterra: 0.1, rimbalzo: 0.58, polvere: true },
    buttafuori: { dir: 'v3', tutte: ['auricolare', 'no', 'nocche'], base: [], vi: 'v3g2211', v: 'v3b2111', atterra: 0.1, rimbalzo: 0.58, polvere: true },
    pizzaiolo: { dir: 'v3', tutte: ['annusa', 'offre', 'picchietta'], base: [], vi: 'v3g2211', v: 'v3b2111', atterra: 0.06, rimbalzo: 0.58, polvere: true },
    dj: { dir: 'v3', tutte: ['ritmo', 'occhiali', 'cuffie'], base: [], vi: 'v3g2211', v: 'v3b2111', atterra: 0.06, rimbalzo: 0.58, polvere: true },
    veggente: { dir: 'v3', tutte: ['sfera', 'occhiolino', 'carte'], base: [], vi: 'v3g2211', v: 'v3b2111', atterra: 0.1, rimbalzo: 0.58, polvere: true },
    bot: { dir: 'v3', tutte: ['leva', 'cappello', 'balletto'], base: [], vi: 'v3g2211', v: 'v3g2211', atterra: 0.08, rimbalzo: 0.58, polvere: true },
    // 23/11: i 4 eroi carte (Fante nella forma normale), metodo v3 dalle pose 2D dei design approvati. Per ora entrata + idle: azioni e vittoria
    // hanno i job pronti ma non sono generate (credito OpenRouter finito); si accendono da clip.json "azioni" quando ci sono i file.
    dama: { dir: 'v3', tutte: ['seme', 'bacca'], base: [], vi: 'vc2311d', v: 'vc2311d', atterra: 0.08, rimbalzo: 0.58, polvere: true },
    asso: { dir: 'v3', tutte: ['gira', 'carta'], base: [], vi: 'vc2311', v: 'vc2311d', atterra: 0.08, rimbalzo: 0.58, polvere: true },
    regina: { dir: 'v3', tutte: ['bacio', 'scettro'], base: [], vi: 'vc2311d', v: 'vc2311d', atterra: 0.08, rimbalzo: 0.58, polvere: true },
    fante: { dir: 'v3', tutte: ['saluto', 'guanti'], base: [], vi: 'vc2311c', v: 'vc2311d', atterra: 0.04, rimbalzo: 0.58, polvere: true }
    // 17/11 sera: clip v2 del Samurai SCARTATE dal proprietario (stile diverso dal Pistolero): si rifanno in v3 dalla posa nello stile Brawl.
    // Finché non ci sono il Samurai usa l'arte 2D. La voce v2 era (intro già atterrato, polvere dalla tela):
    // samurai: { tutte: ['collo', 'zucca', 'guarda', 'spalla', 'inchino'], base: [...], vi: 'sam1711', v: 'sam1711', atterra: 0.02, rimbalzo: 0.58, polvere: true }
  };
  function cartella(id) { return 'menu_video/' + id + '/' + (KIT[id].dir || 'v2') + '/final/'; }   // dir: cartella delle clip (Samurai v3)
  function kitEroe(id, q) {
    var K = KIT[id], P = cartella(id), v = function (x) { return x ? '?v=' + x : ''; };
    return { intro: P + id + '_intro_alfa' + q + '.mp4' + v(K.vi), idle: P + id + '_idle_alfa' + q + '.mp4' + v(K.v),
      azioni: K.tutte.map(function (k) { return { k: k, src: P + id + '_' + k + '_alfa' + q + '.mp4' + v(K.v) }; }) };
  }
  var CLIP = {};
  Object.keys(KIT).forEach(function (id) { CLIP[id] = { atterra: KIT[id].atterra, rimbalzo: KIT[id].rimbalzo, polvere: !!KIT[id].polvere, kit: { '': kitEroe(id, ''), '_s': kitEroe(id, '_s'), '_m': kitEroe(id, '_m') } }; });
  var PRONTO = Promise.all(Object.keys(KIT).map(function (id) {
    return fetch(cartella(id) + 'clip.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (j) {
      var ok = ((j && j.azioni) || KIT[id].base).slice();
      if (id === 'pistolero' && Q.get('spin') === '1') ok.push('spin');   // piroetta: in prova (durante il giro la pistola si allunga)
      ['', '_s', '_m'].forEach(function (q) { var k = CLIP[id].kit[q]; k.azioni = k.azioni.filter(function (a) { return ok.indexOf(a.k) >= 0; }); });
      if (j && j.atterra) CLIP[id].atterra = j.atterra;
      if (j && j.rimbalzo) CLIP[id].rimbalzo = j.rimbalzo;
      if (j && j.polvere !== undefined) CLIP[id].polvere = !!j.polvere;
    });
  })).catch(function () { });
  function arte2d(id) { return 'menu_video/arte2d/' + id + '.webp?v=' + (['dama', 'asso', 'regina', 'fante'].indexOf(id) >= 0 ? 'vc2311d' : 'vs2211'); }   // 23/11: arte dei 4 eroi carte rifatta dalle clip   // 21/11 vetrine: dalle clip approvate (menu_video/vetrine_da_clip.py)
  // 17/11 regola del proprietario: niente render 3D (ritratti/*) fuori partita. Chi non ha icona: segnaposto 2D di Smash
  function busto(id) { return 'ui/segnaposto/' + id + '.webp'; }
  // icona del tasto in basso: quella fatta apposta se c'è (ui/icone/<id>.webp), se no il busto 3D di sempre
  // icone dall'arte 2D approvata (menu_video/icone_da_arte2d.py; il Pistolero dal suo foglio, menu_video/icona_pistolero.py)
  // 21/11 vetrine: tutti gli 11 eroi con l'icona dal 1o fotogramma dell'idle della clip approvata (menu_video/vetrine_da_clip.py)
  var ICONE = {}; ['pistolero', 'samurai', 'bot', 'croupier', 'buttafuori', 'agamennone', 'lupo', 'arciere', 'pizzaiolo', 'dj', 'veggente'].forEach(function (k) { ICONE[k] = 'ui/icone/' + k + '.webp?v=vs2211'; });
  // 23/11: icone dei 4 eroi carte rifatte dal 1o fotogramma idle delle clip (vetrine_da_clip.py), al posto di quelle dal concept
  ['dama', 'asso', 'regina', 'fante'].forEach(function (k) { ICONE[k] = 'ui/icone/' + k + '.webp?v=vc2311d'; });
  function icona(id) { return ICONE[id] || busto(id); }
  function colore(id) { return (CU.E[id] && CU.E[id].col) || '#ff2bd6'; }
  function nome(id) { var c = CU.E[id]; return c ? ((LANG === 'en' && c.nome_en) || c.nome) : id.toUpperCase(); }
  function corto(id) { var n = nome(id); if (n.length <= 11) return n; var p = n.split(' '); return p[0].length <= 3 && p[1] ? p[1] : p[0]; }
  var EROI = (CU.ORDINE.length ? CU.ORDINE : LB.giocabili()).filter(function (id) { return LB.giocabili().indexOf(id) >= 0; });
  // 21/11 sera: pizzaiolo, dj e veggente non sono in CAST_UI.ORDINE (ui/cast.js, 8 eroi) ma il motore li gioca e hanno le clip: si aggiungono in coda
  Object.keys(KIT).forEach(function (id) { if (EROI.indexOf(id) < 0 && LB.giocabili().indexOf(id) >= 0) EROI.push(id); });

  // ---------------- una tela WebGL per tutti i piedistalli ----------------
  var VS = 'attribute vec2 p;uniform vec4 r;varying vec2 u;void main(){u=vec2(p.x,1.-p.y);gl_Position=vec4(r.x+p.x*r.z,r.y+p.y*r.w,0.,1.);}';
  var FS = 'precision mediump float;varying vec2 u;uniform sampler2D t;uniform float px;' +
    'void main(){vec2 c=vec2(clamp(u.x*.5,px,.5-px),u.y);vec2 a=vec2(clamp(.5+u.x*.5,.5+px,1.-px),u.y);' +
    'float al=smoothstep(.1,.95,texture2D(t,a).r);vec3 col=min(texture2D(t,c).rgb,vec3(al));gl_FragColor=vec4(col,al);}';
  var GL = { cv: null, gl: null, posti: [], dpr: 1, sporco: true, fps: 0, nf: 0, t0: performance.now(), lenti: 0 };
  var ROOT = null, FPSEL = null;
  // MOBILE 23/11: telefono (lato corto < 600): un solo eroe in video (il tuo), gli alleati con l'arte 2D tratta dalle clip.
  // Meno decodificatori video insieme (prima fino a 6 <video> carichi) = niente lobby che resta vuota sui telefoni deboli.
  var TEL = Math.min(screen.width || 9999, screen.height || 9999, innerWidth || 9999) < 600;
  var NOCLIP = Q.get('lclip') === '0', FALLITE = {};
  // 23/11 sera (proprietario: «non vedo il salto quando entrano, li vedo comparire»): anche gli alleati con la loro clip (piccola _s),
  // entrate UNA alla volta; con ?lclip=0 / niente WebGL / clip in errore: arte 2D, che fa lo stesso salto (CSS)
  function clipOk(id, tu) { return !!CLIP[id] && !NOCLIP && !FALLITE[id] && !!GL.gl; }
  var ENTRATE = [];   // registro delle entrate (prove): { i, id, tipo: 'clip'|'2d', t, attesa }
  var CODA_ALL = { libera: true, coda: [] };   // alleati: una entrata alla volta
  function turnoAlleato(fn) { if (CODA_ALL.libera) { CODA_ALL.libera = false; fn(); } else CODA_ALL.coda.push(fn); }
  function fineTurno() { var f = CODA_ALL.coda.shift(); if (f) f(); else CODA_ALL.libera = true; }
  function avviaGL(canvas) {
    GL.cv = canvas;
    var gl = null;
    try { gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false }); } catch (e) { gl = null; }
    if (!gl) { GL.gl = null; NOCLIP = true; if (window.GBDIAG) GBDIAG.nota('lobby: niente WebGL, solo arte 2D'); return; }   // MOBILE 23/11: niente WebGL = arte 2D, mai una lobby vuota
    GL.gl = gl;
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); NOCLIP = true; GL.perso = true; if (window.GBDIAG) GBDIAG.nota('lobby: contesto WebGL perso'); ST.posti.forEach(function (p) { if (p.id && !p.el.classList.contains('r2d')) p.eroe(p.id); }); }, false);
    var sh = function (tipo, src) { var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    GL.ur = gl.getUniformLocation(pr, 'r'); GL.upx = gl.getUniformLocation(pr, 'px');
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }
  function nuovaTex() {
    var gl = GL.gl; if (!gl || GL.perso) return null;
    var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tx;
  }
  function misuraGL() {
    if (!GL.gl) return;
    var d = GL.dpr = Math.min(1.5, window.devicePixelRatio || 1), w = Math.round(innerWidth * d), h = Math.round(innerHeight * d);
    if (GL.cv.width !== w || GL.cv.height !== h) { GL.cv.width = w; GL.cv.height = h; }
    GL.sporco = true;
  }
  function scossa(t) { if (t > 0.42) return [0, 0]; var k = 1 - t / 0.42; return [Math.sin(t * 70) * 5 * k, Math.cos(t * 55) * 6 * k * k]; }
  function disegnaGL() {
    var gl = GL.gl, ora = performance.now(), cambiato = GL.sporco;
    GL.posti.forEach(function (p) {
      var v = p.att;
      if (!v || v.readyState < 2 || !p.vivo) return;
      if (v.currentTime !== p.ultimoT) {
        p.ultimoT = v.currentTime; if (!p.tex) return; gl.bindTexture(gl.TEXTURE_2D, p.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v); p.vw = v.videoWidth; p.pieno = true; cambiato = true;
      }
      if (ora - p.scossaT < 450 || p.volo || ora - p.hopT < 260) cambiato = true;
    });
    if (!cambiato) return;
    GL.sporco = false;
    gl.viewport(0, 0, GL.cv.width, GL.cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    var W = innerWidth, H = innerHeight;
    // dal fondo al davanti: prima i posti più in alto (lontani)
    GL.posti.slice().sort(function (a, b) { return a.r.y + a.r.h - (b.r.y + b.r.h); }).forEach(function (p) {
      if (!p.pieno || !p.vivo || !p.mostra) return;
      var o = scossa((ora - p.scossaT) / 1000), r = p.r, vo = voloOff(p, ora); o = [o[0] + vo[0], o[1] + vo[1]];
      // rimbalzo dopo l'atterraggio: nel sorgente il cappello usciva dal quadro, quindi il salto lo fa la tela (piccolo arco)
      var th = (ora - p.hopT) / 240; if (th >= 0 && th < 1) o[1] -= Math.sin(Math.PI * th) * r.h * 0.07;
      gl.bindTexture(gl.TEXTURE_2D, p.tex);
      gl.uniform1f(GL.upx, 0.5 / (p.vw || 720));
      // 22/11 serie uniforme: stessa scala, linea dei piedi e asse per tutti (ClipAlfa.inquadra, tabella INQ in ui/clip_alfa.js)
      r = (window.ClipAlfa && ClipAlfa.inquadra) ? ClipAlfa.inquadra(p.id, r) : r;
      gl.uniform4f(GL.ur, (r.x + o[0]) / W * 2 - 1, 1 - (r.y + o[1] + r.h) / H * 2, r.w / W * 2, r.h / H * 2);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
  }
  // VOLO: l'eroe arriva da FUORI dallo schermo lungo un arco e tocca il piedistallo proprio quando la clip atterra.
  // Tu cadi dall'alto (sei il protagonista, al centro); gli alleati saltano dentro dal loro lato (sinistro da sinistra,
  // destro da destra): si legge subito «arriva un compagno» e le traiettorie non si incrociano con la tua.
  function voloPer(p) {
    var W = innerWidth, H = innerHeight, r = p.r;
    if (p.tu || ST.posti.length === 1) return { dx: 0, dy: -(r.y + r.h + 30), A: 0, dur: 480, su: true };
    var sx = (r.x + r.w / 2) < W / 2;
    return { dx: sx ? -(r.x + r.w + 30) : (W - r.x + 30), dy: -H * 0.12, A: H * 0.22, dur: 620, su: false };
  }
  function voloOff(p, ora) {
    var v = p.volo; if (!v) return [0, 0];
    var t = (ora - v.t0) / v.dur;
    if (t >= 1) { p.volo = null; return [0, 0]; }
    if (v.su) { var e = t * t; return [0, v.dy * (1 - e)]; }          // caduta: accelera come con la gravità
    return [v.dx * (1 - t), v.dy * (1 - t) * (1 - t) - v.A * 4 * t * (1 - t)];   // salto ad arco dal lato
  }
  var ultimoF = performance.now();
  (function ciclo(t) {
    if (GL.gl && !GL.perso && ROOT && ROOT.classList.contains('on') && !document.hidden && !(ST && ST.fase === 'via')) try { disegnaGL(); } catch (e) { if (!GL.errDetto) { GL.errDetto = 1; if (window.GBDIAG) GBDIAG.nota('lobby: disegno ' + e.message); } }
    if (t - ultimoF > 34) GL.lenti++;   // fotogrammi oltre ~30 fps
    ultimoF = t;
    GL.nf++; if (t - GL.t0 > 1000) { GL.fps = Math.round(GL.nf * 1000 / (t - GL.t0)); GL.nf = 0; GL.t0 = t; if (FPSEL) FPSEL.textContent = GL.fps + ' fps · ' + GL.posti.filter(function (p) { return p.att && !p.att.paused; }).length + ' video'; }
    requestAnimationFrame(ciclo);
  })(performance.now());

  // ---------------- un posto (piedistallo) ----------------
  function nuovoVideo() {
    var v = document.createElement('video');
    v.addEventListener('error', function () { if (window.GBDIAG) GBDIAG.nota('lobby: video in errore ' + (v.getAttribute('src') || '').split('/').pop()); });
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto';
    return v;
  }
  function Posto(i) {
    this.i = i; this.id = null; this.stato = 'vuoto'; this.nick = ''; this.squadra = 'blu'; this.tu = i === 0; this.nScelta = 0;
    this.tex = nuovaTex(); this.v = [nuovoVideo(), nuovoVideo()]; this.att = null; this.ultimoT = -1; this.vivo = false; this.pieno = false; this.mostra = false;
    this.scossaT = -1e9; this.hopT = -1e9; this.r = { x: 0, y: 0, w: 1, h: 1 }; this.giro = 0; this.q = this.tu ? (TEL && Q.get('lclipm') !== '0' ? '_m' : '') : '_s';
    var el = this.el = document.createElement('div'); el.className = 'lv-posto vuoto' + (this.tu ? ' tu' : '');
    el.innerHTML = '<img class="lv-pied" src="ui/lv_piedistallo.webp" alt="" draggable="false"><div class="lv-alone"></div><div class="lv-attesa"><i></i></div>' +
      '<div class="lv-ombra"></div><div class="lv-anello"></div><div class="lv-eroebox"><div class="lv-2d"><img alt="" draggable="false"></div></div><div class="lv-polvere"></div>' +
      '<div class="lv-nome"><div class="lv-stato"></div><em class="lv-tutag">' + TX.tu + '</em><b></b><small></small></div>';
    this.d2 = el.querySelector('.lv-2d'); this.img2 = this.d2.querySelector('img');
    GL.posti.push(this);
  }
  Posto.prototype.etichetta = function () {
    var e = this.el, b = e.querySelector('.lv-nome b'), s = e.querySelector('.lv-nome small'), st = e.querySelector('.lv-stato');
    b.textContent = this.tu ? (LANG === 'en' ? 'You' : 'Tu') : (this.nick || '');
    s.textContent = this.id ? corto(this.id) + (CLIP[this.id] ? '' : ' · ' + TX.anteprima) : '';
    e.classList.toggle('vuoto', this.stato === 'vuoto'); e.classList.toggle('pronto', this.stato === 'pronto'); e.classList.toggle('sceglie', this.stato === 'sceglie');
    st.textContent = this.stato === 'pronto' ? TX.pronto : this.stato === 'sceglie' ? TX.sceglie + '…' : this.stato === 'vuoto' ? TX.attesa + '…' : '';
    e.style.setProperty('--kh', this.id ? colore(this.id) : '#ffffff');
  };
  // video: la riserva carica, poi prende il posto al primo fotogramma (la texture tiene l'ultimo fotogramma vecchio: niente lampi)
  Posto.prototype.riserva = function () { return this.v[0] === this.att ? this.v[1] : this.v[0]; };
  Posto.prototype.prepara = function (src) {
    var r = this.riserva();
    if (r.getAttribute('src') !== src) { r.setAttribute('src', src); r.load(); }
    else if (r.currentTime > 0.01 && r.readyState >= 1) { try { r.currentTime = 0; } catch (e) { } }
  };
  Posto.prototype.suona = function (src, finita) {
    var me = this; this.prepara(src);
    var r = this.riserva(), vecchio = this.att, n = ++this.giro;
    r.onended = function () { if (me.giro === n && finita) finita(); };
    var via = function () {
      if (me.giro !== n) return; me.att = r; me.ultimoT = -1; if (vecchio && vecchio !== r) vecchio.pause();
      if (me.voloAttesa) {
        me.voloAttesa = false; r.pause(); try { r.currentTime = 0; } catch (e) { }
        var v = voloPer(me); v.t0 = performance.now(); me.volo = v; me.el.classList.remove('arriva'); me.entrato = me.nScelta;
        ENTRATE.push({ i: me.i, id: me.id, tipo: 'clip', t: Math.round(v.t0), attesa: Math.round(v.t0 - (me.tSc || v.t0)) });
        if (me.turno) setTimeout(function () { if (me.turno) { me.turno = false; fineTurno(); } }, v.dur + 300);
        setTimeout(function () { if (me.giro !== n) return; var x = r.play(); if (x && x.catch) x.catch(function () { }); }, v.dur - 40);
      }
    };
    var p = r.play(); if (p && p.catch) p.catch(function () { });
    if (r.requestVideoFrameCallback) r.requestVideoFrameCallback(via); else r.addEventListener('playing', via, { once: true });
    this.vivo = true;
  };
  Posto.prototype.ferma = function (libera) {
    this.giro++; this.vivo = false; this.regia = null;
    this.v.forEach(function (v) { v.pause(); v.onended = null; if (libera) { v.removeAttribute('src'); v.load(); } });
    if (libera) this.att = null;
    clearInterval(this.ti2); clearTimeout(this.tt2); GL.sporco = true;
  };
  Posto.prototype.atterra = function (polvere) {
    var e = this.el; e.classList.remove('vuoto-eroe'); this.scossaT = performance.now();
    e.classList.remove('scossa'); void e.offsetWidth; e.classList.add('scossa');
    var an = e.querySelector('.lv-anello'); an.classList.remove('via'); void an.offsetWidth; an.classList.add('via');
    if (polvere) {
      // 22/11 POLVERE DELLA LOBBY (proprietario: «si vede ancora il fumo tagliato male»): la polvere non sta piu' nella clip (li' la tagliavano i bordi del
      // riquadro: sotto i piedi ci sono solo 51 px). Nuvolette tonde (ui/lv_nuvola.webp, dall'atlante AI ui/vfx «nuvola») disegnate SOPRA il piedistallo e sopra
      // la tela: nascono ai piedi, si allargano a terra ai due lati, salgono un poco e sfumano in 0,42-0,6 s. Nessun riquadro che le tagli.
      var p = e.querySelector('.lv-polvere'); p.innerHTML = ''; p.style.zIndex = 2500;
      var hh = this.r.h, N = 11;
      for (var i = 0; i < N; i++) {
        var d = document.createElement('i'), lato = i % 2 ? 1 : -1, k = Math.floor(i / 2) / 5, cen = i === N - 1;
        var sz = hh * (cen ? 0.12 : 0.085 + Math.random() * 0.06), x0 = cen ? 0 : lato * hh * (0.1 + 0.1 * Math.random()), x1 = cen ? 0 : lato * hh * (0.22 + 0.28 * k + 0.06 * Math.random());
        var y0 = hh * 0.012, y1 = -hh * (cen ? 0.02 : 0.02 + 0.06 * Math.random()), rot = (Math.random() * 50 - 25), dur = cen ? 420 : 430 + Math.random() * 170;
        d.style.cssText = 'left:' + (-sz / 2).toFixed(1) + 'px;top:' + (-sz * 0.6).toFixed(1) + 'px;width:' + sz.toFixed(1) + 'px;height:' + sz.toFixed(1) + 'px;border-radius:0;background:url(ui/lv_nuvola.webp?v=2211) center/contain no-repeat;opacity:0;animation:none;will-change:transform,opacity';
        p.appendChild(d);
        if (d.animate) d.animate([
          { opacity: 0.96, transform: 'translate(' + x0.toFixed(1) + 'px,' + y0.toFixed(1) + 'px) scale(.42) rotate(' + rot.toFixed(0) + 'deg)', offset: 0 },
          { opacity: 0.9, transform: 'translate(' + (x0 + (x1 - x0) * 0.72).toFixed(1) + 'px,' + (y1 * 0.35).toFixed(1) + 'px) scale(1) rotate(' + (rot * 0.5).toFixed(0) + 'deg)', offset: 0.45 },
          { opacity: 0, transform: 'translate(' + x1.toFixed(1) + 'px,' + y1.toFixed(1) + 'px) scale(1.22) rotate(0deg)', offset: 1 }
        ], { duration: dur, delay: cen ? 0 : Math.random() * 50, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
      }
    }
    if (this.tu) { if (S.vsColpo) try { S.vsColpo(); } catch (x) { } if (navigator.vibrate) try { navigator.vibrate(20); } catch (x) { } }
  };
  // sceglie (o cambia) eroe: SEMPRE l'entrata, anche se è lo stesso
  Posto.prototype.eroe = function (id) {
    var me = this; this.ferma(false); this.id = id; this.etichetta();
    this.el.classList.add('vuoto-eroe'); this.pieno = false; GL.sporco = true;
    var n = ++this.nScelta;
    clearTimeout(this.tFall); this.el.classList.remove('arriva');
    if (this.turno) { this.turno = false; fineTurno(); }
    if (clipOk(id, this.tu) && !this.forza2d) {
      if (!this.tu && !this.inTurno) {   // alleato: aspetta il suo turno (le entrate non si sovrappongono)
        this.mostra = false; this.el.classList.add('arriva'); this.el.classList.remove('r2d'); this.d2.className = 'lv-2d';
        turnoAlleato(function () { if (me.nScelta !== n) { fineTurno(); return; } me.inTurno = true; me.turno = true; me.eroe(id); me.inTurno = false; });
        return;
      }
      this.el.classList.remove('r2d'); this.d2.className = 'lv-2d'; this.mostra = true;
      this.el.classList.add('arriva');   // segnaposto: luce sul piedistallo finché la clip non è pronta
      this.pre2d = new Image(); this.pre2d.src = arte2d(id);   // il ripiego 2D è già scaricato se serve: il suo salto si vede intero
      var reg = this.regia = new Regista(this, CLIP[id].kit[this.q]);
      this.voloAttesa = true; this.volo = null; this.atterrato = false; this.hopT = -1e9; this.tSc = performance.now();
      reg.via('intro', reg.kit.intro);
      // la clip d'entrata non è pronta in tempo (rete lenta, decodificatore occupato)? il salto si fa con l'arte 2D: si vede SEMPRE un salto,
      // mai l'eroe che compare fermo. Tu: dopo ~1,2 s; un alleato: dopo 5 s (intanto resta «sta scegliendo»). In errore: arte 2D per sempre.
      this.tFall = setTimeout(function () {
        if (me.nScelta !== n || me.volo || me.atterrato || me.pieno) return;
        if (window.GBDIAG) GBDIAG.nota('lobby: clip ' + id + ' in ritardo, salto 2D');
        me.forza2d = true; me.eroe(id); me.forza2d = false;
      }, this.tu ? 1200 : 5000);
      (function guarda() {
        if (me.nScelta !== n) return;
        var v = me.att;
        if (v && v.getAttribute('src') === reg.kit.intro && v.currentTime >= CLIP[id].atterra && !me.atterrato) { me.atterrato = true; me.atterra(CLIP[id].polvere); }
        // 17/11: niente saltino dopo l'atterraggio (richiesta del proprietario): la clip atterra e resta ferma
        if (v && v.getAttribute('src') === reg.kit.intro && v.currentTime >= CLIP[id].rimbalzo - 0.1) return;
        requestAnimationFrame(guarda);
      })();
    } else {
      this.mostra = false; this.el.classList.add('r2d');
      var d = this.d2, im2 = this.img2, tS = this.tSc || performance.now(), partito = false;
      d.className = 'lv-2d'; d.style.visibility = 'hidden'; im2.src = arte2d(id);
      // il salto parte quando l'immagine è decodificata (prima partiva subito e, con la rete lenta, l'eroe compariva già atterrato)
      var parti = function () {
        if (partito || me.nScelta !== n) return; partito = true;
        d.style.visibility = ''; me.el.classList.remove('arriva'); me.entrato = n;
        ENTRATE.push({ i: me.i, id: id, tipo: '2d', t: Math.round(performance.now()), attesa: Math.round(performance.now() - tS) });
        if (me.turno) setTimeout(function () { if (me.turno) { me.turno = false; fineTurno(); } }, 900);
        me.salto2d(id, n);
      };
      if (im2.decode) im2.decode().then(parti, parti); else if (im2.complete) parti(); else { im2.onload = parti; im2.onerror = parti; }
      setTimeout(parti, 2500);
    }
  };
  Posto.prototype.salto2d = function (id, n) {
    var me = this;
    {
      // stesso volo per l'arte 2D (CSS): partenza fuori schermo, arco, atterraggio al 55% (0,52 s)
      var v = voloPer(this), d = this.d2;
      d.style.setProperty('--vx0', v.dx + 'px'); d.style.setProperty('--vy0', (v.su ? v.dy : v.dy) + 'px'); d.style.setProperty('--va', v.A + 'px');
      d.className = 'lv-2d'; void d.offsetWidth; d.className = 'lv-2d entra' + (v.su ? ' su' : '');
      this.tt2 = setTimeout(function () { if (me.nScelta !== n) return; me.atterra(true); }, 520);
      setTimeout(function () {
        if (me.nScelta !== n) return; d.className = 'lv-2d vivo';
        d.querySelector('img').style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
        me.ti2 = setInterval(function () { if (Math.random() < 0.4) { d.className = 'lv-2d mossa'; setTimeout(function () { if (d.className === 'lv-2d mossa') d.className = 'lv-2d vivo'; }, 920); } }, 3600 + Math.random() * 1500);
      }, 960);
    }
  };
  Posto.prototype.svuota = function () { clearTimeout(this.tFall); this.el.classList.remove('arriva'); if (this.turno) { this.turno = false; fineTurno(); } this.ferma(true); this.id = null; this.stato = 'vuoto'; this.nick = ''; this.pieno = false; this.mostra = false; this.d2.className = 'lv-2d'; this.el.classList.remove('r2d', 'vuoto-eroe'); this.etichetta(); this.nScelta++; };

  // ---------------- regista dell'idle vivo (uno per posto) ----------------
  function Regista(posto, kit) { this.p = posto; this.kit = kit; this.ultima = null; this.idleN = 0; this.serve = 1; this.log = []; }
  Regista.prototype.dopo = function (cosa) {
    var c = this.kit;
    if (cosa !== 'idle') { this.idleN = 0; this.serve = cosa === 'intro' ? 1 : 1 + (Math.random() < 0.45 ? 1 : 0); return { k: 'idle', src: c.idle }; }
    this.idleN++;
    if (this.idleN < this.serve || !c.azioni.length) return { k: 'idle', src: c.idle };
    var me = this, pool = c.azioni.filter(function (a) { return a.k !== me.ultima; }); if (!pool.length) pool = c.azioni;   // 22/11: con una sola azione (tolte quelle che escono dal quadro) si ripete quella
    var a = pool[Math.floor(Math.random() * pool.length)]; this.ultima = a.k;
    return { k: a.k, src: a.src };
  };
  Regista.prototype.via = function (k, src) {
    var me = this, p = this.p; if (p.regia !== this) return;
    this.log.push(k); if (this.log.length > 40) this.log.shift();
    if (p.tu) window.__lobbyv.ultima = k;
    var d = this.dopo(k);
    // 22/11: la clip dopo si prepara SOLO quando questa e' davvero partita (p.att === r). Prima partiva a 250 ms fissi: se l'entrata non aveva
    // ancora mostrato il primo fotogramma, la riserva veniva ricaricata con l'idle e l'entrata non si vedeva mai (eroe che cade gia' in posa).
    var r = p.riserva(), n = this.log.length;
    p.suona(src, function () { me.via(d.k, d.src); });
    setTimeout(function pre() { if (p.regia !== me || me.log.length !== n) return; if (p.att === r) p.prepara(d.src); else setTimeout(pre, 100); }, 250);
  };

  // ---------------- DOM ----------------
  ROOT = document.createElement('div'); ROOT.id = 'lv';
  ROOT.innerHTML =
    '<div class="lv-sfondo"></div><div class="lv-velo"></div><div class="lv-posti" id="lv-posti"></div><canvas id="lv-gl"></canvas>' +
    '<div class="lv-testa" id="lv-testa"><div class="lv-titolo" id="lv-titolo"></div><button class="lv-modo" id="lv-modo"></button><button class="lv-esci" id="lv-esci"></button></div>' +
    '<div class="lv-banda" id="lv-banda"><span class="lv-radar"></span><span id="lv-banda-t"></span><b class="lv-timer" id="lv-timer">0:00</b>' +
    '<div class="lv-avv" id="lv-avv"></div></div>' +
    '<div class="lv-piede" id="lv-piede"><div class="lv-eroi" id="lv-eroi"></div>' +
    '<button class="gioca lv-cerca" id="lv-cerca"><span class="luce"></span><span class="lampo"></span><span class="g-l" id="lv-cerca-t"></span></button></div>' +
    '<div class="lv-fps" id="lv-fps"></div>';
  document.body.appendChild(ROOT);
  var $ = function (id) { return document.getElementById(id); };
  FPSEL = Q.get('fps') === '1' ? $('lv-fps') : null; if (FPSEL) FPSEL.style.display = 'block';
  avviaGL($('lv-gl'));
  $('lv-esci').textContent = TX.esci;
  EROI.forEach(function (id) {
    var b = document.createElement('button'); b.className = 'lv-chip'; b.dataset.id = id; b.style.setProperty('--kh', colore(id)); b.setAttribute('aria-label', nome(id));
    b.innerHTML = '<img alt="" draggable="false" src="' + icona(id) + '"' + (ICONE[id] ? ' class="ico"' : '') + '>' + (CLIP[id] ? '<span class="lv-dot" title="clip"></span>' : '') + '<span class="lv-lucch">✔</span>';
    b.onclick = function () { if (S.sblocca) S.sblocca(); if (S.carta) try { S.carta(); } catch (e) { } if (S.voceEroe) try { S.voceEroe(id, 'scelta', true); } catch (e) { } scegliMio(id); };   /* audio 21/11: battuta di scelta */
    $('lv-eroi').appendChild(b);
  });

  // ---------------- modalità e posti ----------------
  var MODI = { gemme: { mia: 3, avv: 3 }, duello: { mia: 1, avv: 1 }, sopravvivenza: { mia: 1, avv: 5 } };
  var ST = { modo: ['gemme', 'duello', 'sopravvivenza'].indexOf(Q.get('lmodo')) >= 0 ? Q.get('lmodo') : 'gemme', fase: 'scelta', posti: [], nemici: [], mio: null, timer: null, tPosti: [], t0: 0 };
  window.__lobbyv = { stato: ST, ultima: '', gl: GL };
  var NICK = ['Rango_88', 'Kappa', 'SuperMario_IT', 'Lulù', 'xX_Bandito_Xx', 'Ferro', 'Gigi99', 'NottePiena', 'Tizio', 'Caio.exe', 'Sbirro', 'ZeroTre', 'LaVolpe', 'Fiche', 'Bomber', 'Asso'];
  function costruisciPosti() {
    ST.posti.forEach(function (p) { p.svuota(); p.el.remove(); var i = GL.posti.indexOf(p); if (i >= 0) GL.posti.splice(i, 1); if (GL.gl && p.tex) GL.gl.deleteTexture(p.tex); });
    var m = MODI[ST.modo];
    ST.posti = []; ST.nemici = [];
    for (var i = 0; i < m.mia; i++) {
      var p = new Posto(i); p.squadra = 'blu';
      p.el.classList.add('sq-blu'); p.etichetta();
      $('lv-posti').appendChild(p.el); ST.posti.push(p);
    }
    // avversari: niente piedistallo, solo nome + stato nel contatore
    for (var j = 0; j < m.avv; j++) ST.nemici.push({ nick: '', id: null, stato: 'vuoto', nemico: true });
    disegnaAvv();
    $('lv-modo').textContent = TX.modi[ST.modo] + ' ▸';
    layout();
  }
  // TELEFONO (verticale): tu davanti al centro, grande; gli alleati DIETRO, più in alto e più piccoli, ai lati (a triangolo):
  // così la scena riempie l'altezza invece di lasciare vuota la metà alta. PC: una fila, tu al centro un filo più avanti.
  function posizioni(W, H, oriz, cima, fondo) {
    var out = [], av = fondo - cima, n = ST.posti.length;
    if (n === 1) { var h1 = Math.min(av * 0.97, oriz ? W * 0.5 : W * 1.45); out[0] = { x: W / 2, y: fondo, h: h1, pw: Math.min(h1 * 0.98, W * (oriz ? 0.36 : 0.86)) }; return out; }
    if (oriz) {
      var ho = Math.min(av * 0.97, W * 0.34), dx = Math.min(0.235, ho * 0.66 / W + 0.01);
      out[0] = { x: W / 2, y: fondo, h: ho, pw: ho * 0.98 };
      out[1] = { x: W * (0.5 - dx), y: fondo - av * 0.04, h: ho * 0.86, pw: ho * 0.86 * 0.98 };
      out[2] = { x: W * (0.5 + dx), y: fondo - av * 0.04, h: ho * 0.86, pw: ho * 0.86 * 0.98 };
      return out;
    }
    // gli alleati su piedistalli più alti (all'altezza della tua testa), ai lati: si vedono interi, non dietro di te
    // MOBILE 23/11: gli alleati stanno all'altezza della TUA TESTA (prima delle spalle: il tuo eroe copriva i loro piedistalli) e
    // il tuo eroe si misura sullo spazio che c'è davvero fra la testata e la fila: alleati interi (nome compreso) sotto la testata.
    var hb = Math.min(av / 1.5, W * 0.95), ha = Math.min(hb * 0.58, W * 0.48), ya = Math.max(fondo - hb * 0.92, cima + ha * 1.0);
    out[0] = { x: W / 2, y: fondo, h: hb, pw: Math.min(hb * 0.98, W * 0.72) };
    out[1] = { x: W * 0.2, y: ya, h: ha, pw: Math.min(ha * 0.98, W * 0.38) };
    out[2] = { x: W * 0.8, y: ya, h: ha, pw: Math.min(ha * 0.98, W * 0.38) };
    return out;
  }
  function disegnaAvv() {
    var el = $('lv-avv'), n = ST.nemici.filter(function (q) { return q.stato !== 'vuoto'; }).length;
    el.innerHTML = '<span class="lv-avv-t">' + TX.avv + ' ' + n + '/' + ST.nemici.length + '</span>' +
      ST.nemici.map(function (q) { return '<i class="' + q.stato + '">' + (q.nick ? q.nick.slice(0, 10) : '') + '</i>'; }).join('');
  }
  function layout() {
    var W = innerWidth, H = innerHeight;
    // MOBILE 23/11: l'iframe della mini app nasce minuscolo e poi cresce: niente decisioni su una misura finta (si rifà al cambio)
    if (W < 120 || H < 120) return;
    var oriz = W / H > 1.05, tit = $('lv-titolo');
    ROOT.classList.toggle('oriz', oriz);
    // il titolo: in orizzontale nella testata, in verticale sopra la fila degli eroi (intero, e l'angolo in alto a sinistra resta libero)
    if (oriz && tit.parentNode !== $('lv-testa')) $('lv-testa').insertBefore(tit, $('lv-testa').firstChild);
    else if (!oriz && tit.parentNode !== $('lv-piede')) $('lv-piede').insertBefore(tit, $('lv-eroi'));
    misuraGL();
    // cima: sotto la barra in alto e la banda di ricerca (compatte); fondo: il piedistallo intero (con l'ombra) sopra la fila degli eroi
    var piede = $('lv-piede').getBoundingClientRect().height || 150;
    var testaR = $('lv-testa').getBoundingClientRect(), bandaR = $('lv-banda').getBoundingClientRect();
    var cima = Math.max(testaR.bottom || 44, (bandaR.bottom || 74) + 8) + 4, fondo = H - piede - Math.min(W * 0.74, H * 0.5) * 0.14 - 4;
    if (window.GBS && GBS.ind) cima = Math.max(cima, GBS.ind.b + 6);   // il tasto «‹» della mini app: gli alleati non ci finiscono sotto
    if (oriz) fondo = H - piede - Math.min(W * 0.3, H * 0.6) * 0.98 * 0.14 - 6;
    var pos = posizioni(W, H, oriz, cima, fondo);
    ST.posti.forEach(function (p, i) {
      var q = pos[i]; if (!q) return;
      var hh = q.h, ww = hh * 0.75;
      p.el.style.left = q.x + 'px'; p.el.style.top = q.y + 'px'; p.el.style.setProperty('--hh', hh + 'px'); p.el.style.setProperty('--pw', (q.pw || hh * 0.98) + 'px');
      p.r = { x: q.x - ww / 2, y: q.y - hh * 0.95, w: ww, h: hh };
      // niente z-index sul posto: così nome e stato (z 3000) stanno sopra la tela WebGL, il piedistallo sotto
      if (i === 0) $('lv-posti').appendChild(p.el);   // il tuo davanti agli alleati
    });
    GL.sporco = true;
    // la fila: il tuo eroe resta in vista dopo un cambio di misura
    var fila = $('lv-eroi'), sel = fila.querySelector('.lv-chip.sel');
    if (sel && fila.scrollWidth > fila.clientWidth) fila.scrollLeft = Math.max(0, sel.offsetLeft - fila.clientWidth / 2 + sel.offsetWidth / 2);
    else fila.scrollLeft = 0;
  }
  // MOBILE 23/11: si rifà a ogni cambio vero di misura (rotazione, iframe che cresce, barre di Telegram), non solo al resize
  var ridL = 0;
  function layoutPresto() { if (!ridL) ridL = requestAnimationFrame(function () { ridL = 0; if (ROOT.classList.contains('on')) layout(); }); }
  addEventListener('resize', layoutPresto);
  addEventListener('gb-schermo', layoutPresto);
  if (window.ResizeObserver) try { new ResizeObserver(layoutPresto).observe(ROOT); } catch (e) { }

  // ---------------- tu ----------------
  function scegliMio(id) {
    ST.mio = id; try { localStorage.setItem('gb_eroe', id); } catch (e) { }
    Array.prototype.forEach.call($('lv-eroi').children, function (c) { c.classList.toggle('sel', c.dataset.id === id); if (c.dataset.id === id) { var r = $('lv-eroi'); r.scrollTo({ left: c.offsetLeft - r.clientWidth / 2 + c.offsetWidth / 2, behavior: 'smooth' }); } });
    var p = ST.posti[0]; if (p.stato === 'pronto') return;
    p.stato = 'scelto'; p.eroe(id);
  }

  // ---------------- matchmaking: i posti si riempiono uno alla volta, i bot scelgono (e a volte cambiano) ----------------
  function caso(a, b) { return a + Math.random() * (b - a); }
  function pescaPer(p) {
    // niente doppioni nella stessa squadra; il Pistolero (l'unico con le clip) esce un po' più spesso
    var compagni = p.nemico ? (ST.modo === 'gemme' ? ST.nemici : []) : ST.posti;
    var usati = compagni.filter(function (q) { return q !== p && q.id; }).map(function (q) { return q.id; });
    // ?doppi=1 (solo prova/demo): il primo alleato prende il Pistolero anche se ce l'hai tu, per vedere le clip su un altro piedistallo
    if (Q.get('doppi') === '1' && !p.nemico && !ST.doppioFatto) { ST.doppioFatto = true; ST.doppioPosto = p; return 'pistolero'; }
    var lib = EROI.filter(function (id) { return usati.indexOf(id) < 0 && id !== p.id; });
    var conClip = lib.filter(function (id) { return CLIP[id]; });   // gli eroi con le clip escono un po' più spesso
    if (conClip.length && Math.random() < 0.3 * conClip.length) return conClip[Math.floor(Math.random() * conClip.length)];
    return lib[Math.floor(Math.random() * lib.length)] || EROI[0];
  }
  // MOBILE 23/11: i modelli 3D degli eroi della partita si scaricano appena si sceglie (durante la ricerca), non a partita iniziata
  var pescaVero = pescaPer;
  pescaPer = function (p) {
    var id = pescaVero(p);
    if (p && !p.nemico && !p.tu) { var t1 = performance.now(); (function dopoEntrata() { if (p.id !== id) return; if (p.entrato === p.nScelta || performance.now() - t1 > 8000) scaricaModello(id); else setTimeout(dopoEntrata, 200); })(); }   // alleato: prima la sua clip d'entrata, poi il modello
    else scaricaModello(id);
    return id;
  };
  function scaricaModello(id) { try { if (id && window.R3 && R3.carica && !R3.spento) { var x = R3.carica(id); if (x && x.catch) x.catch(function () { }); } } catch (e) { } }
  function dopo(ms, fn) { var t = setTimeout(fn, ms); ST.tPosti.push(t); return t; }
  function cerca() {
    if (ST.posti[0]) scaricaModello(ST.posti[0].id);
    if (ST.fase !== 'scelta') return;
    ST.fase = 'cerca'; if (S.lobby) try { S.lobby('cerca'); } catch (e) { } ROOT.classList.add('cerca'); ST.t0 = performance.now(); aggiornaBanda();
    ST.timer = setInterval(aggiornaBanda, 250);
    var nick = NICK.slice().sort(function () { return Math.random() - 0.5; });
    // alleati e avversari arrivano mescolati, uno alla volta
    var ordine = ST.posti.slice(1).concat(ST.nemici).sort(function () { return Math.random() - 0.5; }), t = 400;
    ordine.forEach(function (p) {
      t += caso(p.nemico ? 350 : 700, p.nemico ? 900 : 1400);
      dopo(t, function () {
        p.nick = nick.pop(); p.stato = 'sceglie'; if (p.nemico) disegnaAvv(); else p.etichetta(); aggiornaBanda(); if (S.passa) try { S.passa(); } catch (e) { }
        dopo(caso(700, 1400), function () {
          p.stato = 'scelto';
          if (p.nemico) { p.id = pescaPer(p); disegnaAvv(); dopo(caso(800, 2400), function () { p.stato = 'pronto'; disegnaAvv(); controlla(); }); return; }
          p.eroe(pescaPer(p));
          var cambia = Math.random() < 0.35 && p !== ST.doppioPosto;
          if (cambia) dopo(caso(2200, 3200), function () { p.eroe(pescaPer(p)); });
          // 23/11 sera: «pronto» solo dopo che il suo salto d'entrata è partito (al massimo 9 s in più): niente piedistallo vuoto con «PRONTO»
          dopo((cambia ? 3400 : 0) + caso(1800, 3000), function () {
            var t1 = performance.now();
            (function aspetta() { if (ST.fase === 'scelta') return; if (p.entrato === p.nScelta || performance.now() - t1 > 9000) { p.stato = 'pronto'; p.etichetta(); controlla(); } else dopo(150, aspetta); })();
          });
        });
      });
    });
    tastoCerca();
  }
  function aggiornaBanda() {
    var tt = ST.posti.concat(ST.nemici), s = Math.floor((performance.now() - ST.t0) / 1000), dentro = tt.filter(function (p) { return p.stato !== 'vuoto'; }).length;
    $('lv-timer').textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
    $('lv-banda-t').textContent = ST.fase === 'tutti' ? TX.tutti : TX.cercando + ' · ' + dentro + '/' + tt.length + ' ' + TX.trovati;
  }
  function controlla() {
    var bot = ST.posti.slice(1).concat(ST.nemici).every(function (p) { return p.stato === 'pronto'; });
    if (!bot) { tastoCerca(); return; }
    if (ST.posti[0].stato === 'pronto') { tutti(); return; }
    ST.fase = 'bot_pronti'; if (S.lobby) try { S.lobby('trovata'); } catch (e) { } tastoCerca();
    // se non tocchi «Sono pronto» entro 10 s, sei pronto lo stesso
    dopo(10000, mioPronto);
  }
  function mioPronto() {
    if (ST.fase !== 'bot_pronti' && ST.fase !== 'cerca') return;
    var p = ST.posti[0]; p.stato = 'pronto'; p.etichetta();
    if (ST.fase === 'cerca') { tastoCerca(); return; }
    tutti();
  }
  function tutti() { if (S.lobby) try { S.lobby('pronti'); } catch (e) { } ST.fase = 'tutti'; ROOT.classList.add('tutti'); aggiornaBanda(); tastoCerca(); dopo(2200, inizia); }
  function annulla() {
    clearInterval(ST.timer); ST.tPosti.forEach(clearTimeout); ST.tPosti = [];
    ST.posti.slice(1).forEach(function (p) { p.svuota(); });
    ST.nemici.forEach(function (q) { q.nick = ''; q.id = null; q.stato = 'vuoto'; }); disegnaAvv();
    var me = ST.posti[0]; if (me && me.stato === 'pronto') { me.stato = 'scelto'; me.etichetta(); }
    ST.fase = 'scelta'; ROOT.classList.remove('cerca', 'tutti'); tastoCerca();
  }
  function tastoCerca() {
    var b = $('lv-cerca'), t = $('lv-cerca-t'), me = ST.posti[0];
    b.classList.remove('annulla', 'pronto');
    if (ST.fase === 'scelta') t.textContent = TX.cerca;
    else if (ST.fase === 'tutti') t.textContent = TX.inizia;
    else if (me && me.stato === 'pronto') { t.textContent = TX.annulla; b.classList.add('annulla'); }
    else { t.textContent = TX.sono_pronto; b.classList.add('pronto'); }
    $('lv-titolo').textContent = ST.fase === 'scelta' ? TX.scegli : ST.fase === 'tutti' ? TX.tutti : TX.cercando;
    ROOT.classList.toggle('bloccato', !!(me && me.stato === 'pronto'));
  }
  $('lv-cerca').onclick = function () {
    if (S.sblocca) S.sblocca(); if (S.conferma) try { S.conferma(); } catch (e) { }
    var me = ST.posti[0];
    if (ST.fase === 'scelta') cerca();
    else if (ST.fase === 'tutti') inizia();
    else if (me.stato === 'pronto') annulla();
    else mioPronto();
  };
  $('lv-modo').onclick = function () {
    if (ST.fase !== 'scelta') return;
    var k = Object.keys(MODI); ST.modo = k[(k.indexOf(ST.modo) + 1) % k.length];
    costruisciPosti(); scegliMio(ST.mio);
  };

  function inizia() {
    if (ST.fase !== 'tutti') return;
    var me = ST.posti[0];
    ST.fase = 'via'; clearInterval(ST.timer);
    var all = ST.posti.slice(1).map(function (p) { return p.id; });
    var nem = ST.nemici.map(function (q) { return q.id; });
    if (!LB.avvia(me.id, all, nem, ST.modo)) { ST.fase = 'tutti'; return; }
    ST.posti.forEach(function (p) { p.v.forEach(function (v) { v.pause(); }); });   // MOBILE 23/11: sotto il sipario niente video né tela da aggiornare
    // il sipario di gioco.js copre in 0,33 s: sotto si spegne la lobby e si liberano i video
    setTimeout(function () {
      ST.posti.forEach(function (p) { p.ferma(true); clearTimeout(p.tFall); }); ROOT.classList.remove('on', 'cerca', 'tutti'); ST.fase = 'chiusa';
      // MOBILE 23/11: in partita la tela della lobby non tiene memoria della GPU (si rimisura alla riapertura)
      if (GL.gl && GL.cv) { GL.cv.width = 1; GL.cv.height = 1; }
    }, 340);
  }
  function apri() {
    ROOT.classList.add('on');
    ST.fase = 'scelta'; ROOT.classList.remove('cerca', 'tutti'); ST.tPosti.forEach(clearTimeout); ST.tPosti = []; clearInterval(ST.timer);
    costruisciPosti();
    var id = ST.mio || (function () { try { return localStorage.getItem('gb_eroe'); } catch (e) { return null; } })() || LB.eroe();
    if (EROI.indexOf(id) < 0) id = EROI[0];
    tastoCerca();
    PRONTO.then(function () { ST.posti.forEach(function (p, i) { if (i && TEL) return; var c = CLIP[i === 0 && CLIP[id] ? id : 'pistolero']; if (c && clipOk(i === 0 ? id : 'pistolero', !i)) p.prepara(c.kit[p.q].intro); }); scegliMio(id); });   // 23/11: sul telefono si prepara solo la TUA entrata, per prima
  }
  $('lv-esci').onclick = function () { ST.uscito = true; annulla(); ST.posti.forEach(function (p) { p.ferma(true); }); ROOT.classList.remove('on'); };
  // dopo la partita: quando gioco.js torna alla lobby classica, si riapre questa
  var home = document.getElementById('s-home');
  if (home) new MutationObserver(function () { if (home.classList.contains('on') && !ROOT.classList.contains('on') && !ST.uscito) apri(); }).observe(home, { attributes: true, attributeFilter: ['class'] });
  // scheda nascosta: video in pausa
  document.addEventListener('visibilitychange', function () {
    ST.posti.forEach(function (p) { if (!p.att) return; if (document.hidden) p.att.pause(); else if (p.vivo) { var x = p.att.play(); if (x && x.catch) x.catch(function () { }); } });
  });
  // le clip si scaricano subito (entrata + idle, grandi e piccole): il primo salto non aspetta la rete
  // MOBILE 23/11: una alla volta (prima tutte insieme: decine di MB in parallelo che rubavano la rete alla clip che serviva);
  // sul telefono solo le grandi (le piccole degli alleati non servono: arte 2D), e partendo dal tuo eroe
  // (piano di caricamento 23/11): SUBITO solo il tuo eroe; gli altri in coda pigra dopo la prima partita (mai durante una partita),
  // niente se il telefono chiede di risparmiare dati
  PRONTO.then(function () {
    var mio = ST.mio, qq = TEL ? ['_m'] : ['', '_s'], coda = [], pigri = [];
    Object.keys(CLIP).forEach(function (id) { qq.forEach(function (q) { var k = CLIP[id].kit[q]; if (id === mio) coda.push(k.idle); else pigri.push(k.intro, k.idle); }); });   // la tua entrata la scarica il <video> stesso, per prima
    var risparmio = !!(navigator.connection && navigator.connection.saveData);
    function prossimo() {
      if (NOCLIP) return;
      if (!coda.length && pigri.length && !risparmio && window.__brawl && (window.__brawl.partite || 0) > 0 && window.__brawl.fase !== 'partita') coda.push(pigri.shift());
      var u = coda.shift();
      if (!u) { if (pigri.length && !risparmio) setTimeout(prossimo, 4000); return; }
      fetch(u).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).catch(function () { }).then(function () { setTimeout(prossimo, 60); });
    }
    prossimo();
  });
  window.__lobbyv.entrate = ENTRATE;
  window.__lobbyv.apri = apri; window.__lobbyv.cerca = cerca; window.__lobbyv.scegli = scegliMio; window.__lobbyv.pronto = mioPronto;
  // banco: tutti i posti col Pistolero (caso peggiore per i fps: 6 video insieme)
  window.__lobbyv.tutti = function (id) { ST.posti.forEach(function (p, i) { if (i) { p.nick = NICK[i]; p.stato = 'pronto'; p.etichetta(); } p.eroe(id || 'pistolero'); }); };
  window.__lobbyv.tuttiPistolero = function () { window.__lobbyv.tutti('pistolero'); };
  apri();
})();
