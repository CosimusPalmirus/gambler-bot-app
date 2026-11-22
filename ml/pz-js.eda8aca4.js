(function(){
  'use strict';
  if (window.PZ || window.PZ_OFF) return;
  try { if (localStorage.getItem('gb_pz') === '0') return; } catch(e){}
  var W = window, D = document;
  var PZ = W.PZ = { v:'20261120', spia:[], ponte:true, foto:{}, aperto:null };
  function en(){ return W.GB_LANG === 'en'; }
  function L(it, e){ return en() ? e : it; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function warn(d, e){ try { console.warn('[PZ] ' + d, e); } catch(_){} }
  function spia(k, x){ PZ.spia.push({ k:k, x:x, t:Date.now() }); if (PZ.spia.length > 300) PZ.spia.shift(); }
  function $(id){ return (A && A.el && A.el.querySelector('#' + id)) || D.getElementById(id); }
  function unisci(a, b){ var o = {}, k; if (a) for (k in a) o[k] = a[k]; if (b) for (k in b) o[k] = b[k]; return o; }
  var RE_EMO = /(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{2604}\u{2607}-\u{2712}\u{2714}\u{2716}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}][\u{FE0F}\u{200D}\u{20E3}]*)+|[\u{FE0F}\u{20E3}]/gu;
  function pulito(s){ return String(s == null ? '' : s).replace(RE_EMO, '').replace(/\s{2,}/g, ' ').trim(); }
  function frase(t){
    t = pulito(t);
    if (!t || t !== t.toUpperCase() || t === t.toLowerCase()) return t;
    var s = t.toLowerCase(), i = s.search(/[a-zà-ɏ]/);
    s = i < 0 ? s : s.slice(0, i) + s.charAt(i).toUpperCase() + s.slice(i + 1);
    return s.replace(/«([a-zà-ɏ])/g, function(m, c){ return '«' + c.toUpperCase(); });
  }
  var IC = {
    pennello:'<path d="M14.5 4.5l5 5-8 8-5-5z"/><path d="M6.5 12.5 4 20l7.5-2.5"/>',
    lucchetto:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    dono:'<rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M2.5 9h19M12 9v11.5M12 9c-1.5-4-6-4.5-6-2s4 2 6 2c2 0 6 .5 6-2s-4.5-2-6 2"/>',
    bersaglio:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9"/>',
    freccia:'<path d="M5 12h13M13 6.5 18.5 12 13 17.5"/>',
    indietro:'<path d="M15 5l-7 7 7 7"/>',
    mano:'<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a5.5 5.5 0 0 1-5.5 5.5h-.5a5 5 0 0 1-4.2-2.3L5.6 14a1.5 1.5 0 0 1 2.4-1.8L9 13.5"/>',
    play:'<path d="M8 5.5v13l10.5-6.5z"/>',
    orologio:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    occhio:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'
  };
  function ic(k){ return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || IC.bersaglio) + '</svg>'; }
  var MODI = {
    turf:    { g:['Gambler City', 'Gambler City'], a:['a Gambler City', 'in Gambler City'], chi:['Il tuo mafioso', 'Your mobster'], ed:'twrOpenEditor', tre:true, foto3:true, ico:'turf' },
    glad:    { g:['Colosseo', 'Colosseum'], a:['al Colosseo', 'in the Colosseum'], chi:['Il tuo gladiatore', 'Your gladiator'], ed:'gladOpenEditor', ico:'glad' },
    race:    { g:['Street Race', 'Street Race'], a:['a Street Race', 'in Street Race'], chi:['La tua auto', 'Your car'], ed:'rcCarEditor', tre:true, ico:'race' },
    calcio:  { g:['Derby', 'Derby'], a:['al Derby', 'in the Derby'], chi:['Il tuo calciatore', 'Your player'], ed:'derbyEditor', tre:true, foto3:true, ico:'calcio' },
    scalata: { g:['Dead Peak', 'Dead Peak'], a:['a Dead Peak', 'on Dead Peak'], chi:['Il tuo scalatore', 'Your climber'], ed:'deadpeakEditor', ico:'scalata' }
  };
  var ED_MODO = { twrOpenEditor:'turf', gladOpenEditor:'glad', rcCarEditor:'race', derbyEditor:'calcio', deadpeakEditor:'scalata' };
  var TAV = { dice:['dadi',['dd']], backg:['dadi',['dd']], bj1v1:['carte',['db']], pk1v1:['carte',['db']], golf:['golf',['gp']],
    pool8:['pool',['st']], pool15:['pool',['st']], snake:['snake',['sn']], pong:['pong',['pg']], shove:['shove',['sh']], basket:['basket',['bk']],
    sumo:['sumo',['su']], tank:['tank',['tk']], archery:['archery',['ar']], alley:['alley',['al']], dama:['dama',['pz']], damaru:['dama',['pz']],
    chess:['dama',['pz']], geo:['geo',['gb']], kaiju:['kaiju',['kj']], hop:['hop',['hc']], sbanca:['sbanca',['sb']], smash:['smash',['sx']],
    deadmoney:['deadmoney',['dm']], abisso:['abisso',['ab']], lupus:['lupus',['lp']], boxe:['boxe',['bx']], bs:['bs',['bs']], draw:['draw',['rv']],
    rr:['draw',['rv']], rps:['rps',['mo']] };
  var GIOCO_Q = { grun:["Gambler's Run", "Gambler's Run"], turf:['Gambler City', 'Gambler City'], glad:['Colosseo', 'Colosseum'], race:['Street Race', 'Street Race'], calcio:['Derby', 'Derby'], scalata:['Dead Peak', 'Dead Peak'] };
  var RAR = { common:['Comune', 'Common', '#aeaeb2'], rare:['Rara', 'Rare', '#5a96ff'], epic:['Epica', 'Epic', '#a59df7'], legend:['Leggendaria', 'Legendary', '#f5b14c'] };
  function rar(r){ return RAR[r] || RAR.common; }
  var CAR = { va:0, cbs:[] };
  function caricaCos(cb, forza){
    if (!W.S || !S.userId || typeof BACKEND === 'undefined' || typeof COS === 'undefined') { if (cb) cb(); return; }
    if (COS.data && !forza) { if (cb) cb(); return; }
    if (CAR.va && Date.now() - (CAR.t0 || 0) > 8000) CAR.va = 0;
    CAR.cbs.push(cb); if (CAR.va) return; CAR.va = 1; CAR.t0 = Date.now();
    var modi = 'turf'; try { modi = gcr2Modi(); } catch(e){}
    var url = BACKEND + '/cosmetics_data?v=2&modi=' + modi + '&user_id=' + S.userId;
    spia('GET', '/cosmetics_data');
    fetch(url, { headers:{ 'ngrok-skip-browser-warning':'1' } })
      .then(function(r){ return r.json(); })
      .then(function(d){ if (d && d.ok) { COS.data = d; S.rtStats = d.stats || d.progress || null; S.cosmetics = { unlocked:d.unlocked || {}, equipped:d.equipped || {} }; } })
      .catch(function(e){ warn('cosmetics_data', e); })
      .then(function(){ CAR.va = 0; var l = CAR.cbs; CAR.cbs = []; l.forEach(function(f){ try { if (f) f(); } catch(e){ warn('cb', e); } }); });
  }
  var QC = { cbs:[] };
  function caricaQN(cb, forza){
    if (typeof QN === 'undefined' || !W.S || !S.userId || (QN.lista && !forza)) { if (cb) cb(); return; }
    if (QC.cbs.length && Date.now() - (QC.t0 || 0) > 8000) QC.cbs = [];
    QC.cbs.push(cb);
    if (QC.cbs.length > 1) return;
    QC.t0 = Date.now();
    spia('GET', '/challenges');
    try {
      QN.carica = 1;
      qnCarica(function(){ QN.carica = 0; var l = QC.cbs; QC.cbs = []; l.forEach(function(f){ try { if (f) f(); } catch(e){ warn('cbq', e); } }); });
    } catch(e){ QN.carica = 0; var l = QC.cbs; QC.cbs = []; l.forEach(function(f){ try { if (f) f(); } catch(_){} }); }
  }
  function qDi(id){ try { return qnDi(id); } catch(e){ return null; } }
  function spenta(id){ var l = (typeof QN !== 'undefined' && QN.spente) || []; for (var i = 0; i < l.length; i++) if (l[i] && l[i].id === id) return l[i]; return null; }
  function agganciaQN(){
    var o = W.qnDati;
    if (typeof o !== 'function' || o.__pz) return;
    var f = function(d){ var r = o.apply(this, arguments); try { if (d && Object.prototype.toString.call(d.qn_spente) === '[object Array]') QN.spente = d.qn_spente; } catch(e){} return r; };
    f.__pz = 1; W.qnDati = f;
  }
  function nomeSet(cd){ return frase((en() && cd.name_en) ? cd.name_en : cd.name); }
  function descSet(cd){ return pulito((en() && cd.desc_en) ? cd.desc_en : (cd.desc || '')); }
  function nomeQ(q){ return frase(q ? ((en() && q.name_en) ? q.name_en : (q.name || '')) : ''); }
  function descQ(q){ return pulito(q ? ((en() && q.desc_en) ? q.desc_en : (q.desc || '')) : ''); }
  function voci(mode){
    var d = (typeof COS !== 'undefined') && COS.data; if (!d) return null;
    var cat = (d.catalog && d.catalog[mode]) || [], prog = d.progress || {};
    var unl = (d.unlocked && d.unlocked[mode]) || [], eq = (d.equipped && d.equipped[mode]) || null, out = [];
    cat.forEach(function(cd){
      if (!cd || !cd.id) return;
      var q = cd.quest ? qDi(cd.quest) : null, mio = unl.indexOf(cd.id) >= 0;
      if (cd.quest && !q && !mio) { out.push({ cd:cd, id:cd.id, q:null, qs:spenta(cd.quest), mio:false, eq:false, goal:1, p:0, st:'presto' }); return; }
      var v = { cd:cd, id:cd.id, q:q, mio:mio, eq:(eq === cd.id) };
      if (cd.quest) { v.goal = q ? (q.goal | 0 || 1) : 1; v.p = q ? (q.prog | 0) : 1; }
      else { v.goal = (cd.challenge && cd.challenge.goal) | 0 || 1; v.p = (prog[cd.challenge && cd.challenge.stat] | 0); }
      if (v.eq) v.st = 'eq';
      else if (mio || (q && q.presa)) v.st = 'mio';
      else if (cd.quest) v.st = (q && q.fatta && !q.presa) ? 'pronta' : 'quest';
      else v.st = v.p >= v.goal ? 'pronta' : 'bloc';
      out.push(v);
    });
    return out;
  }
  function conta(l){ var c = { tot:0, miei:0, pronti:0 }; (l || []).forEach(function(v){ if (v.st === 'presto') return; c.tot++; if (v.st === 'eq' || v.st === 'mio') c.miei++; if (v.st === 'pronta') c.pronti++; }); return c; }
  var SFIDE = {
    games:  [['Gioca 1 partita', 'Gioca %n partite'], ['Play 1 match', 'Play %n matches']],
    wins:   [['Vinci 1 partita', 'Vinci %n partite'], ['Win 1 match', 'Win %n matches']],
    kills:  [['Elimina 1 avversario', 'Elimina %n avversari'], ['Take out 1 rival', 'Take out %n rivals']],
    podium: [['Arriva sul podio 1 volta', 'Arriva sul podio %n volte'], ['Finish on the podium once', 'Finish on the podium %n times']],
    goals:  [['Segna 1 gol', 'Segna %n gol'], ['Score 1 goal', 'Score %n goals']],
    deaths: [['Cadi 1 volta', 'Cadi %n volte'], ['Fall once', 'Fall %n times']]
  };
  function sfida(cd, mode){
    var st = String((cd.challenge && cd.challenge.stat) || ''), k = st.replace(/^[a-z]+_/, ''), g = (cd.challenge && cd.challenge.goal) | 0;
    var f = SFIDE[k], t;
    if (f) { t = f[en() ? 1 : 0][g === 1 ? 0 : 1].replace('%n', g); }
    else t = g + ' × ' + st;
    return t + ' ' + L(MODI[mode].a[0], MODI[mode].a[1]);
  }
  function look2D(mode, patch){
    try {
      if (mode === 'turf') return unisci(gcrLook(), patch);
      if (mode === 'scalata' && typeof dpkLook === 'function') return unisci(dpkLook(), patch);
    } catch(e){}
    return patch || null;
  }
  function lookAuto(patch){
    var mio = twrCarLook(), o = unisci(mio, patch);
    if (!patch || patch.shape == null) o.model = rcModelOf(mio); else delete o.model;
    try { var x = JSON.parse(localStorage.getItem('gb_car_x') || 'null'); if (x) { o.sp = x.spoiler | 0; o.tr = x.trail | 0; } } catch(e){}
    return rcLook3(o, true);
  }
  var GL2 = null;
  function autoTre(){
    try {
      if (typeof rcLook3 !== 'function' || typeof rcModelOf !== 'function' || typeof twrCarLook !== 'function' || !W.RC3D_VER) return false;
      if (localStorage.getItem('gb_rc3d') === '0' || localStorage.getItem('gb_lite') === '1') return false;
      if (typeof RTD !== 'undefined' && RTD && (RTD.lite || (RTD.ui === 'match' && RTD.game === 'race'))) return false;
      var dcx = W.GXDC_RADICE != null || D.documentElement.classList.contains('gxdc');
      if (dcx && !W.GXDC_RACE3D) return false;
      if (GL2 == null) {
        if (typeof B3D !== 'undefined' && B3D && B3D.gl2 != null) GL2 = !!B3D.gl2;
        else { GL2 = false; var c = D.createElement('canvas'), g = c.getContext('webgl2'); if (g) { GL2 = true; var lc = g.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); } }
      }
      return GL2;
    } catch(e){ return false; }
  }
  var VETR = {
    turf:   { puo:function(){ return typeof cos3Puo === 'function' && cos3Puo('turf'); }, src:function(){ return gcrVetSrc(); }, g:'GCR3D', opz:function(l){ return { look:l, arma:'PISTOL', sfondo:'#0e0d16' }; } },
    calcio: { puo:function(){ return typeof cos3Puo === 'function' && cos3Puo('calcio'); }, src:function(){ return blg3dSrc(); }, g:'BLG3D', opz:function(l){ return { look:l, sfondo:'#0e0d16' }; } },
    race:   { puo:autoTre, g:'RACE3D', opz:function(l){ return l; },
              src:function(){ var dcx = W.GXDC_RADICE != null || D.documentElement.classList.contains('gxdc'); return 'race3d.html?v=' + encodeURIComponent(String(W.RC3D_VER)) + '&lang=' + (en() ? 'en' : 'it') + (dcx ? '&dc=1' : '') + '&vetrina=1'; },
              pronto:function(v){ var i = null; try { i = v.info && v.info(); } catch(e){} return v.fotogrammi > 0 && !!(i && i.modello); } }
  };
  function look3D(mode, patch){
    if (mode === 'race') return lookAuto(patch);
    if (mode === 'turf') return gcrNorm(unisci(gcrLook(), patch));
    return cos3Look('calcio', patch);
  }
  function chiaveFoto(mode, patch){ try { return (typeof cos3Chiave === 'function') ? cos3Chiave(mode, patch) : null; } catch(e){ return null; } }
  function fotoDi(mode, patch){
    var k = chiaveFoto(mode, patch); if (!k) return null;
    return PZ.foto[k] || (W.COS3 && COS3.foto && COS3.foto[k]) || null;
  }
  function disegnaTessera(cv, mode, v){
    var f = MODI[mode].foto3 ? fotoDi(mode, v.cd.look_patch) : null;
    if (f) { try { var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(f, 0, 0, cv.width, cv.height); return true; } catch(e){} }
    try { _cosDrawPreview(cv, mode, v.cd.look_patch); } catch(e){ warn('tessera', e); }
    return false;
  }
  var A = null;
  function vocePerId(id){ var l = (A && A.voci) || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function scegliIniziale(l){
    var i; for (i = 0; i < l.length; i++) if (l[i].st === 'pronta') return l[i].id;
    for (i = 0; i < l.length; i++) if (l[i].st === 'eq') return l[i].id;
    return l.length ? l[0].id : null;
  }
  function apri(mode){
    if (!MODI[mode]) return;
    if (A) chiudi(true);
    spia('apri', mode);
    var M = MODI[mode];
    var el = D.createElement('div'); el.id = 'pz'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('data-mode', mode);
    el.innerHTML = '<div class="pz-nav"><button type="button" class="pz-x" data-pz="chiudi">' + ic('indietro') + '<span>' + L('Indietro', 'Back') + '</span></button><b>' + L('Personalizza', 'Customize') + '</b><span></span></div>'
      + '<div class="pz-sc"><div class="pz-in">'
      + '<div class="pz-hd"><img src="gbx_pv_' + M.ico + '.webp" alt="" onerror="this.style.display=\'none\'"><div><h1>' + esc(L(M.chi[0], M.chi[1])) + '</h1><p class="pz-sub">' + esc(L(M.g[0], M.g[1])) + '</p></div></div>'
      + '<div class="pz-stage" id="pz-stage"><canvas class="pz-cv" id="pz-cv"></canvas><div class="pz-3d" id="pz-3d"></div>'
      + '<span class="pz-chip sx" id="pz-chip"></span><span class="pz-chip dx" id="pz-gira" hidden>' + ic('mano') + L('Trascina per girare', 'Drag to turn') + '</span>'
      + '<div class="pz-velo"><span class="pz-anello"></span><span>' + L('Preparo le anteprime…', 'Preparing previews…') + '</span></div></div>'
      + '<div id="pz-corpo"><div class="pz-vuoto"><div class="pz-anello"></div>' + L('Carico i tuoi set…', 'Loading your sets…') + '</div></div>'
      + '</div></div>';
    D.body.appendChild(el);
    D.documentElement.classList.add('pz-on');
    A = { mode:mode, el:el, sel:null, voci:[], vet:null, giro:0, busy:null };
    el.addEventListener('click', clic);
    requestAnimationFrame(function(){ el.classList.add('on'); });
    try { GBX.fx('open'); } catch(e){}
    disegnaPalco();
    if (M.tre) vetApri();
    var dopo = function(){ if (A && A.el === el) rifai(); };
    if (typeof COS !== 'undefined' && COS.data && typeof QN !== 'undefined' && QN.lista) dopo();
    caricaQN(function(){ caricaCos(dopo, true); }, true);
  }
  function chiudi(subito){
    if (!A) return;
    var a = A; A = null;
    vetButta(a);
    try { [].forEach.call(a.el.querySelectorAll('[id]'), function(e){ e.removeAttribute('id'); }); a.el.removeAttribute('id'); } catch(e){}
    D.documentElement.classList.remove('pz-on');
    a.el.classList.remove('on');
    if (subito) a.el.remove(); else setTimeout(function(){ a.el.remove(); }, 230);
    if (!subito) { try { GBX.fx('back'); } catch(e){} }
    spia('chiudi', a.mode);
  }
  PZ.apri = apri; PZ.chiudi = function(){ chiudi(false); };
  PZ.stato = function(){ return A ? { mode:A.mode, sel:A.sel, tre:!!(A.vet && A.vet.ok), voci:(A.voci || []).map(function(v){ return v.id + ':' + v.st + ':' + v.p + '/' + v.goal; }) } : null; };
  function rifai(){
    if (!A) return;
    var mode = A.mode, l = voci(mode), corpo = $('pz-corpo');
    if (!corpo) return;
    if (!l) { corpo.innerHTML = '<div class="pz-vuoto">' + (W.S && S.userId ? L('Non riesco a caricare i set. Riprova fra poco.', 'Could not load the sets. Try again shortly.') : L('Apri in Telegram', 'Open in Telegram')) + '</div>'; return; }
    A.voci = l;
    if (!A.sel || !vocePerId(A.sel)) A.sel = scegliIniziale(l);
    var c = conta(l), sub = A.el.querySelector('.pz-sub');
    if (sub) sub.textContent = L(MODI[mode].g[0], MODI[mode].g[1]) + ' · ' + L(c.miei + ' di ' + c.tot + ' set tuoi', c.miei + ' of ' + c.tot + ' sets owned');
    var gr = { pronta:[], miei:[], bloc:[], presto:[] };
    l.forEach(function(v){ (v.st === 'pronta' ? gr.pronta : (v.st === 'eq' || v.st === 'mio') ? gr.miei : v.st === 'presto' ? gr.presto : gr.bloc).push(v); });
    var h = '<div class="pz-info" id="pz-info"></div>';
    var sez = function(tit, arr){
      if (!arr.length) return '';
      return '<h2 class="pz-sez">' + tit + '<small>' + arr.length + '</small></h2><div class="pz-grid" role="radiogroup">' + arr.map(tessera).join('') + '</div>';
    };
    h += sez(L('Da riscattare', 'Ready to claim'), gr.pronta) + sez(L('I tuoi', 'Yours'), gr.miei) + sez(L('Da sbloccare', 'To unlock'), gr.bloc) + sez(L('In arrivo', 'Coming soon'), gr.presto);
    if (!l.length) h += '<div class="pz-vuoto">—</div>';
    h += '<div class="pz-grp"><button type="button" class="pz-riga" data-pz="dettagli"><span class="pz-ri">' + ic('pennello') + '</span><span class="pz-rt"><b>' + L('Modifica i dettagli', 'Edit the details') + '</b><span>' + L('Colori e pezzi liberi, uno per uno', 'Free colours and pieces, one by one') + '</span></span></button>'
      + '<button type="button" class="pz-riga" data-pz="quests"><span class="pz-ri">' + ic('bersaglio') + '</span><span class="pz-rt"><b>' + L('Tutte le quest', 'All quests') + '</b><span>' + L('Quest › Nuove', 'Quests › New') + '</span></span></button></div>'
      + '<p class="pz-nota">' + L('Solo aspetto: si sblocca giocando, niente acquisti e niente soldi. Lo vedono anche gli altri in partita.', 'Looks only: unlocked by playing, no purchases and no money. Other players see it in the match too.') + '</p>';
    corpo.innerHTML = h;
    [].forEach.call(corpo.querySelectorAll('.pz-t canvas'), function(cv){ var v = vocePerId(cv.getAttribute('data-id')); if (v) disegnaTessera(cv, mode, v); });
    info();
    disegnaPalco();
    if (A.vet && A.vet.ok) {
      if (A.vet.fotoFatte && MODI[mode].foto3 && l.some(function(v){ return !fotoDi(mode, v.cd.look_patch); })) A.vet.fotoFatte = false;
      if (!A.vet.fotoFatte) fotoMancanti();
    }
  }
  function tessera(v){
    var r = rar(v.cd.rarity), stt, bd = '';
    if (v.st === 'eq') { stt = L('In uso', 'Equipped'); bd = ic('check'); }
    else if (v.st === 'mio') stt = L('Tuo', 'Yours');
    else if (v.st === 'pronta') { stt = L('Da riscattare', 'Ready'); bd = ic('dono'); }
    else if (v.st === 'presto') { stt = L('In arrivo', 'Coming soon'); bd = ic('orologio'); }
    else if (v.st === 'quest') { stt = L('Quest', 'Quest') + ' · ' + Math.min(v.p, v.goal) + '/' + v.goal; bd = ic('lucchetto'); }
    else { stt = Math.min(v.p, v.goal) + ' / ' + v.goal; bd = ic('lucchetto'); }
    return '<button type="button" class="pz-t st-' + v.st + (A.sel === v.id ? ' on' : '') + '" role="radio" aria-checked="' + (A.sel === v.id) + '" data-sel="' + esc(v.id) + '" style="--rc:' + r[2] + '">'
      + '<span class="pz-tc"><canvas width="176" height="160" data-id="' + esc(v.id) + '"></canvas>' + (bd ? '<i class="pz-tb">' + bd + '</i>' : '') + '</span>'
      + '<span class="pz-tn">' + esc(nomeSet(v.cd)) + '</span><span class="pz-ts">' + esc(stt) + '</span></button>';
  }
  function barra(p, g){ var k = Math.max(0, Math.min(1, p / (g || 1))); return '<div class="pz-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + g + '" aria-valuenow="' + Math.min(p, g) + '"><i style="--k:' + (k * 100).toFixed(1) + '%"></i></div>'; }
  function info(){
    var box = $('pz-info'), v = vocePerId(A && A.sel); if (!box) return;
    if (!v) { box.innerHTML = ''; return; }
    var r = rar(v.cd.rarity), mode = A.mode, h = '', q = v.q, occ = A.busy === v.id;
    h += '<div class="pz-nm"><span class="pz-rar" style="--rc:' + r[2] + '">' + L(r[0], r[1]) + '</span><b>' + esc(nomeSet(v.cd)) + '</b></div>';
    var ds = descSet(v.cd); if (ds) h += '<p class="pz-ds">' + esc(ds) + '</p>';
    if (v.st === 'eq') {
      h += '<div class="pz-az"><button type="button" class="pz-b ok" disabled>' + ic('check') + L('In uso adesso', 'Equipped now') + '</button></div>';
    } else if (v.st === 'mio') {
      h += '<div class="pz-az"><button type="button" class="pz-b pri" data-pz="equip"' + (occ ? ' disabled' : '') + '>' + (occ ? '…' : L('Equipaggia', 'Equip')) + '</button></div>';
    } else if (v.st === 'pronta') {
      var tq = q ? L('Quest completata: ', 'Quest complete: ') + '<b>«' + esc(nomeQ(q)) + '»</b>' : L('Sfida completata: ', 'Challenge complete: ') + '<b>' + esc(sfida(v.cd, mode)) + '</b>';
      h += '<div class="pz-box"><div class="pz-bt">' + ic('dono') + '<span>' + tq + '</span></div>' + barra(v.goal, v.goal) + '<div class="pz-bp"><span>' + v.goal + ' / ' + v.goal + '</span><b>' + L('Fatto', 'Done') + '</b></div></div>'
        + '<div class="pz-az"><button type="button" class="pz-b pri" data-pz="riscatta"' + (occ ? ' disabled' : '') + '>' + (occ ? '…' : ic('dono') + L('Riscatta', 'Claim')) + '</button></div>';
    } else if (v.st === 'presto') {
      var qs = v.qs, nq = qs ? frase((en() && qs.name_en) ? qs.name_en : qs.name) : '';
      h += '<div class="pz-box"><div class="pz-bt">' + ic('orologio') + '<span>' + (nq ? L('Si sblocca con la quest <b>«' + esc(nq) + '»</b>, in arrivo', 'Unlocks with the quest <b>«' + esc(nq) + '»</b>, coming soon') : L('Si sblocca con una quest <b>in arrivo</b>', 'Unlocks with an <b>upcoming</b> quest')) + '</span></div>'
        + '<div class="pz-bd">' + L('Non si può ancora riscattare: quando la quest si accende la trovi in Quest › Nuove.', 'It cannot be claimed yet: when the quest goes live you will find it in Quests › New.') + '</div></div>';
    } else if (v.st === 'quest') {
      var dove = L('Si trova in Quest › Nuove', 'Find it in Quests › New') + (q && GIOCO_Q[q.gioco] ? ' · ' + L(GIOCO_Q[q.gioco][0], GIOCO_Q[q.gioco][1]) : '');
      h += '<div class="pz-box"><div class="pz-bt">' + ic('lucchetto') + '<span>' + L('Si sblocca con la quest ', 'Unlocks with the quest ') + '<b>«' + esc(nomeQ(q)) + '»</b></span></div>'
        + (descQ(q) ? '<div class="pz-bd">' + esc(descQ(q)) + '</div>' : '') + barra(v.p, v.goal)
        + '<div class="pz-bp"><span>' + (q && q.tipo === 'max' ? L('Migliore: ', 'Best: ') : '') + Math.min(v.p, v.goal) + ' / ' + v.goal + '</span><span>' + esc(dove) + '</span></div></div>'
        + '<div class="pz-az"><button type="button" class="pz-b pri" data-pz="quest">' + L('Vai alla quest', 'Go to the quest') + ic('freccia') + '</button></div>';
    } else {
      var manca = Math.max(0, v.goal - v.p);
      h += '<div class="pz-box"><div class="pz-bt">' + ic('lucchetto') + '<span>' + L('Per sbloccarlo: ', 'To unlock it: ') + '<b>' + esc(sfida(v.cd, mode)) + '</b></span></div>' + barra(v.p, v.goal)
        + '<div class="pz-bp"><span>' + Math.min(v.p, v.goal) + ' / ' + v.goal + '</span><span>' + (manca ? L('ne mancano ' + manca, manca + ' to go') : '') + '</span></div></div>'
        + '<div class="pz-az"><button type="button" class="pz-b sec" data-pz="gioca">' + ic('play') + L('Gioca per sbloccarlo', 'Play to unlock it') + '</button></div>';
    }
    box.innerHTML = h;
    var chip = $('pz-chip');
    if (chip) chip.innerHTML = (v.st === 'eq') ? ic('check') + L('In uso', 'Equipped') : (v.st === 'mio' ? L('Tuo', 'Yours') : ic('occhio') + L('Anteprima', 'Preview'));
    var st = $('pz-stage'); if (st) st.style.setProperty('--rc', r[2]);
  }
  function seleziona(id){
    if (!A || !vocePerId(id)) return;
    A.sel = id; spia('scegli', id);
    try { GBX.fx('tick'); } catch(e){}
    [].forEach.call(A.el.querySelectorAll('.pz-t'), function(b){ var on = b.getAttribute('data-sel') === id; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    info(); disegnaPalco();
  }
  function lookSel(){ var v = vocePerId(A && A.sel); return v ? v.cd.look_patch : null; }
  function disegnaPalco(){
    if (!A) return;
    var cv = $('pz-cv'); if (!cv) return;
    var r = cv.getBoundingClientRect(), dpr = Math.min(2, W.devicePixelRatio || 1);
    var w = Math.max(60, Math.round(r.width * dpr)), h = Math.max(40, Math.round(r.height * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    try {
      var oh = Math.round(h * 0.94), ow = Math.min(w, Math.round(oh * 176 / 160));
      var off = A.off || (A.off = D.createElement('canvas'));
      if (off.width !== ow || off.height !== oh) { off.width = ow; off.height = oh; }
      _cosDrawPreview(off, A.mode, look2D(A.mode, lookSel()));
      var x = cv.getContext('2d'); x.clearRect(0, 0, w, h); x.drawImage(off, Math.round((w - ow) / 2), Math.round((h - oh) / 2));
      var a = A, giro = ++A.giro;
      [300, 1000, 2500].forEach(function(ms){ setTimeout(function(){
        if (A !== a || a.giro !== giro) return;
        try { _cosDrawPreview(off, a.mode, look2D(a.mode, lookSel())); x.clearRect(0, 0, w, h); x.drawImage(off, Math.round((w - ow) / 2), Math.round((h - oh) / 2)); } catch(_){}
      }, ms); });
    } catch(e){ warn('palco', e); }
    if (A.vet && A.vet.ok && !A.vet.scatta) { try { A.vet.g.vetrina.look(look3D(A.mode, lookSel())); } catch(e){ vet2D('look: ' + e); } }
  }
  function vetApri(){
    var mode = A.mode, VT = VETR[mode]; if (!VT) return;
    try { if (!VT.puo()) return; } catch(e){ return; }
    var host = $('pz-3d'); if (!host) return;
    var fr = D.createElement('iframe'); fr.setAttribute('aria-hidden', 'true'); fr.setAttribute('tabindex', '-1'); fr.setAttribute('scrolling', 'no');
    try { fr.src = VT.src(); } catch(e){ return; }
    host.appendChild(fr);
    var a = A, V = a.vet = { fr:fr, g:null, ok:false, t0:Date.now(), tim:null, vig:null, scatta:false, fotoFatte:false };
    spia('3d', mode);
    var scaduta = function(){ return Date.now() - V.t0 > 25000; };
    var vivo = function(){ return A === a && a.vet === V; };
    var prova = function(){
      if (!vivo()) return;
      var g = null; try { g = fr.contentWindow && fr.contentWindow[VT.g]; } catch(e){}
      if (g && g.errore) return vet2D('3d: ' + g.errore);
      if (g && g.pronto && g.vetrina) {
        var ok = false; try { ok = g.vetrina.avvia(VT.opz(look3D(mode, lookSel()))); } catch(e){}
        try { if (ok && g.vetrina.precarica) g.vetrina.precarica(); } catch(e){}
        if (!ok) return vet2D('avvia: ' + (g.vetrina.errore || 'no'));
        V.g = g; aspetta(); return;
      }
      if (g && g.pronto && !g.vetrina) return vet2D('senza vetrina');
      if (scaduta()) return vet2D('non pronto in 25 s');
      V.tim = setTimeout(prova, 90);
    };
    var aspetta = function(){
      if (!vivo()) return;
      var v = V.g.vetrina;
      if (v.errore) return vet2D('vetrina: ' + v.errore);
      if (VT.pronto ? VT.pronto(v) : v.fotogrammi > 0) return mostra();
      if (scaduta()) return vet2D('nessun fotogramma');
      V.tim = setTimeout(aspetta, 60);
    };
    var mostra = function(){
      V.ok = true;
      var st = $('pz-stage'); if (st) st.classList.add('tre');
      var gi = $('pz-gira'); if (gi) gi.hidden = false;
      V.vig = setInterval(function(){
        if (!vivo()) return;
        try {
          var v = V.g.vetrina;
          if (V.g.errore || v.errore) return vet2D('vetrina: ' + (v.errore || V.g.errore));
          if (mode === 'turf' && typeof TWR !== 'undefined' && TWR && (TWR.ui === 'match' || TWR.ui === 'search' || TWR.ui === 'spec')) return vet2D('partita');
          if (v.toccata && gi) gi.hidden = true;
        } catch(e){ vet2D('vig: ' + e); }
      }, 800);
      fotoMancanti();
    };
    V.tim = setTimeout(prova, 60);
  }
  function fotoMancanti(){
    var a = A, V = a && a.vet; if (!V || !V.ok || V.scatta || V.fotoFatte || !a.voci || !a.voci.length) return;
    if (!MODI[a.mode].foto3) { V.fotoFatte = true; return; }
    var mode = a.mode, lista = a.voci.filter(function(v){ return !fotoDi(mode, v.cd.look_patch); });
    if (!lista.length) { V.fotoFatte = true; return; }
    V.scatta = true;
    var st = $('pz-stage'); if (st) st.classList.add('foto');
    var v3 = V.g.vetrina, w = V.fr.contentWindow, i = 0, ang = null;
    try { if (typeof v3.angolo === 'function') ang = v3.angolo(); } catch(e){}
    var fine = function(){
      V.scatta = false; V.fotoFatte = true;
      if (st) st.classList.remove('foto');
      try { if (ang != null && typeof v3.angolo === 'function') v3.angolo(ang); } catch(e){}
      if (A === a) { try { v3.look(look3D(mode, lookSel())); } catch(e){} }
      spia('foto3d', lista.length);
    };
    var uno = function(){
      if (A !== a || a.vet !== V) return;
      if (i >= lista.length) return fine();
      var it = lista[i], n0, giri = 0;
      try { if (typeof v3.angolo === 'function') v3.angolo(0.35); v3.look(cos3Look(mode, it.cd.look_patch)); n0 = v3.fotogrammi; } catch(e){ return fine(); }
      var su = function(){
        if (A !== a || a.vet !== V) return;
        if (v3.errore || ++giri > 300) return fine();
        if (v3.fotogrammi < n0 + 3) { w.requestAnimationFrame(su); return; }
        try {
          var src = null, cs = V.fr.contentDocument.getElementsByTagName('canvas'), k;
          for (k = 0; k < cs.length; k++) if (!src || cs[k].width * cs[k].height > src.width * src.height) src = cs[k];
          if (src && src.width > 1) {
            var f = D.createElement('canvas'); f.width = 176; f.height = 160;
            var rr = 176 / 160, sh = src.height * 0.86, sw = sh * rr; if (sw > src.width * 0.92) { sw = src.width * 0.92; sh = sw / rr; }
            f.getContext('2d').drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, 176, 160);
            var key = chiaveFoto(mode, it.cd.look_patch); if (key) PZ.foto[key] = f;
            var cv = a.el.querySelector('.pz-t canvas[data-id="' + it.id + '"]');
            if (cv) { var x = cv.getContext('2d'); x.clearRect(0, 0, 176, 160); x.drawImage(f, 0, 0); }
          }
        } catch(e){ return fine(); }
        i++; uno();
      };
      w.requestAnimationFrame(su);
    };
    uno();
  }
  function vet2D(perche){
    warn('torno al 2D: ' + perche);
    if (!A) return;
    var st = $('pz-stage'); if (st) st.classList.remove('tre', 'foto');
    var gi = $('pz-gira'); if (gi) gi.hidden = true;
    vetButta(A); A.vet = { ok:false, morto:perche };
    disegnaPalco();
  }
  function vetButta(a){
    var V = a && a.vet; if (!V) return;
    if (V.tim) clearTimeout(V.tim);
    if (V.vig) clearInterval(V.vig);
    try { if (V.g && V.g.vetrina) V.g.vetrina.ferma(); } catch(e){}
    try { if (V.fr && V.fr.parentNode) V.fr.parentNode.removeChild(V.fr); } catch(e){}
    V.fr = null; V.g = null; V.ok = false;
  }
  function occupato(id){ if (!A) return; A.busy = id; info(); var a = A; setTimeout(function(){ if (A === a && a.busy === id) { a.busy = null; info(); } }, 5000); }
  function clic(e){
    if (!A) return;
    var t = e.target.closest('[data-pz], [data-sel]'); if (!t || !A.el.contains(t)) return;
    var sel = t.getAttribute('data-sel'); if (sel) { seleziona(sel); return; }
    var k = t.getAttribute('data-pz'), v = vocePerId(A.sel), mode = A.mode;
    if (k === 'chiudi') { chiudi(false); return; }
    if (k === 'equip' && v && v.st === 'mio') { spia('cosEquip', mode + ':' + v.id); occupato(v.id); cosEquip(mode, v.id); return; }
    if (k === 'riscatta' && v && v.st === 'pronta') {
      occupato(v.id);
      if (v.cd.quest) { spia('qnClaim', v.cd.quest); qnClaim(v.cd.quest); dopoQuest(v.cd.quest); }
      else { spia('cosClaim', mode + ':' + v.id); cosClaim(mode, v.id); }
      return;
    }
    if (k === 'quest' && v && v.cd.quest) { PZ.vaiQuest(v.cd.quest); return; }
    if (k === 'quests') { PZ.vaiQuest(null); return; }
    if (k === 'gioca') { chiudi(false); return; }
    if (k === 'dettagli') { PZ.dettagli(mode); return; }
  }
  function dopoQuest(qid){
    var a = A, n = 0;
    var giro = function(){
      if (A !== a) return;
      var q = qDi(qid);
      if (q && q.presa) { caricaCos(function(){ if (A === a) { a.busy = null; rifai(); } }, true); return; }
      if (++n < 40) setTimeout(giro, 150); else { a.busy = null; rifai(); }
    };
    setTimeout(giro, 150);
  }
  PZ.vaiQuest = function(qid){
    spia('vaiQuest', qid);
    chiudi(true);
    try { go('challenges'); } catch(e){ warn('go', e); return; }
    setTimeout(function(){
      try { if (qid && W.TV3 && typeof TV3.vaiQuest === 'function') TV3.vaiQuest(qid); else chSwitchTab('nuove'); } catch(e){ warn('quest', e); }
    }, 60);
  };
  PZ.dettagli = function(mode){
    var nome = MODI[mode] && MODI[mode].ed, f = nome && W[nome];
    spia('editor', nome);
    if (typeof f !== 'function') return;
    chiudi(true);
    try { f(); } catch(e){ warn('editor', e); }
  };
  PZ.tavolo = function(k){
    spia('tavolo', k);
    if (A) chiudi(true);
    try {
      if (W.TV3) { TV3.gioco = k; TV3.firma = ''; }
      try { localStorage.setItem('gb_tv3_g', k); } catch(_){}
      go('challenges');
      chSwitchTab('cosmetics');
      cosSwitchMode('tavolo');
    } catch(e){ warn('tavolo', e); }
  };
  function aggancia(){
    var o = W.renderCosmeticsCards;
    if (typeof o === 'function' && !o.__pz) {
      var f = function(){ var r = o.apply(this, arguments); try { if (A) { A.busy = null; rifai(); } righe(); } catch(e){ warn('rifai', e); } return r; };
      f.__pz = 1; W.renderCosmeticsCards = f;
    }
  }
  var CORPI = ['arc-body', 'tw-body', 'tk-body', 'gld-body', 'pvp-modal'];
  var RE_ED = /\b(il tuo|la tua|your)\s+(mafioso|gladiatore|calciatore|scalatore|auto|mobster|gladiator|player|climber|car)\b/i;
  function giocoDi(body){
    if (body.id === 'pvp-modal') return (W.XA && XA.dlId) || '';
    var mg = body.querySelector(':scope > .mg-sc'); if (mg && mg.getAttribute('data-g')) return mg.getAttribute('data-g');
    var scr = body.closest('.screen');
    if (scr && scr.id === 'arc') { try { return String((typeof RTD !== 'undefined' && RTD && RTD.game) || W.RTD_GAME || ''); } catch(e){ return ''; } }
    return scr ? scr.id : '';
  }
  function tavConta(slots){
    var c = { tot:0, miei:0, pronti:0 }, pos = [];
    try { pos = tvlPosseduti() || []; } catch(e){}
    (typeof TVL_SKIN !== 'undefined' ? TVL_SKIN : []).forEach(function(s){
      if (slots.indexOf(s.slot) < 0) return;
      var q = null; try { q = qnDiSkin('tavolo', s.id); } catch(e){}
      var mio = pos.indexOf(s.id) >= 0;
      if (!q && !mio) return;
      c.tot++; if (mio || (q && q.presa)) c.miei++; else if (q && q.fatta) c.pronti++;
    });
    return c;
  }
  function testoRiga(mode, tav){
    var c;
    if (mode) { var l = voci(mode); if (!l) return L('Scegli il set e guarda le quest per sbloccarne altri', 'Pick a set and see the quests to unlock more'); c = conta(l); }
    else c = tavConta(tav[1]);
    var s = L(c.miei + ' di ' + c.tot + ' tuoi', c.miei + ' of ' + c.tot + ' owned');
    if (c.pronti) s += ' · ' + L(c.pronti + ' da riscattare', c.pronti + ' ready to claim');
    return s;
  }
  function inietta(body){
    var ap = body.querySelector(':scope > .xa-ap'); if (!ap || ap.querySelector('.pz-sr')) return;
    var g = giocoDi(body), mode = MODI[g] ? g : null, tav = mode ? null : TAV[g];
    if (!mode && !tav) return;
    if (tav) {
      if (typeof QN === 'undefined' || typeof TVL_SKIN === 'undefined' || !W.TV3) return;
      if (!QN.lista) { caricaQN(function(){ if (QN.lista) righe(); }); return; }
      if (!tavConta(tav[1]).tot) return;
    }
    var b = D.createElement('button'); b.type = 'button'; b.className = 'xa-ap-r xa-ap-more pz-sr';
    b.setAttribute('data-pzm', mode || ''); b.setAttribute('data-pzt', tav ? tav[0] : '');
    b.innerHTML = '<span class="xa-ri xa-ri--l" aria-hidden="true">' + ic('pennello') + '</span><span class="xa-ap-rt"><b>' + L('Personalizza', 'Customize') + '</b><span></span></span>';
    b.querySelector('.xa-ap-rt span').textContent = testoRiga(mode, tav);
    b.addEventListener('click', function(e){
      e.stopPropagation();
      try { GBX.fx('open'); } catch(_){}
      if (mode) apri(mode); else PZ.tavolo(tav[0]);
    });
    var grp = ap.querySelector('.xa-ap-grp2');
    if (grp) {
      [].forEach.call(grp.querySelectorAll('.xa-ap-r'), function(r){ var t = r.querySelector('.xa-ap-rt b'); if (t && RE_ED.test(t.textContent)) r.classList.add('pz-via'); });
      grp.insertBefore(b, grp.firstChild);
    } else {
      grp = D.createElement('div'); grp.className = 'xa-ap-grp xa-ap-grp2 pz-grp2'; grp.appendChild(b);
      var fi = ap.querySelector('.xa-ap-fi'), dove = fi && fi.previousElementSibling && fi.previousElementSibling.matches('h2') ? fi.previousElementSibling : (fi || ap.querySelector('.xa-ap-info, .xa-ap-nota, .xa-ap-bar'));
      if (dove) ap.insertBefore(grp, dove); else ap.appendChild(grp);
    }
    spia('riga', g);
    if (mode && typeof COS !== 'undefined' && !COS.data) caricaQN(function(){ caricaCos(righe); });
  }
  function righe(){
    [].forEach.call(D.querySelectorAll('.xa-ap .pz-sr'), function(b){
      var m = b.getAttribute('data-pzm'), t = b.getAttribute('data-pzt'), tav = null, k;
      if (!m) for (k in TAV) if (TAV[k][0] === t) { tav = TAV[k]; break; }
      var s = b.querySelector('.xa-ap-rt span'); if (s) s.textContent = testoRiga(m || null, tav);
    });
    CORPI.forEach(function(id){ var b = $(id); if (b) inietta(b); });
  }
  PZ.righe = righe;
  function guarda(){
    CORPI.forEach(function(id){
      var b = $(id); if (!b || b.__pz) return; b.__pz = 1;
      inietta(b);
      try { new MutationObserver(function(rs){
        for (var i = 0; i < rs.length; i++) for (var j = 0; j < rs[i].addedNodes.length; j++) {
          var n = rs[i].addedNodes[j];
          if (n.nodeType === 1 && n.classList.contains('xa-ap')) { inietta(b); return; }
        }
      }).observe(b, { childList:true }); } catch(e){ warn('guarda', e); }
    });
  }
  D.addEventListener('click', function(e){
    if (!PZ.ponte) return;
    var t = e.target && e.target.closest ? e.target.closest('[onclick]') : null; if (!t || t.closest('#pz')) return;
    var m = /^\s*(twrOpenEditor|gladOpenEditor|rcCarEditor|derbyEditor|deadpeakEditor)\(\)\s*;?\s*$/.exec(t.getAttribute('onclick') || '');
    if (!m || !MODI[ED_MODO[m[1]]]) return;
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    spia('ponte', m[1]);
    apri(ED_MODO[m[1]]);
  }, true);
  D.addEventListener('keydown', function(e){ if (A && e.key === 'Escape') chiudi(false); });
  D.addEventListener('gbx:screen', function(){ if (A) chiudi(true); });
  W.addEventListener('resize', function(){ if (A) disegnaPalco(); }, { passive:true });
  function ponteSmash(){
    var G = W.GSSOLDI; if (!G || G.personalizza) return;
    G.koPosti = function(){
      var n = function(v){ v = v | 0; return v >= 1 && v <= 2 ? v : 0; }, mio = 0;
      try { mio = n(tvlLook().sx); } catch(e){}
      try {
        if (typeof GSRT !== 'undefined' && GSRT.aperto && GSRT.start) {
          var m = GSRT.start, sg = (m.map && m.map.seggi) || [], pr = m.profiles || {}, rp = (typeof RTD !== 'undefined' && RTD && RTD.profiles) || {}, out = [];
          sg.forEach(function(s){
            if (!s) return;
            var uid = String(s.uid == null ? '' : s.uid), g = s.sg | 0;
            if (/^bot/.test(uid) || s.bot) { out[g] = 0; return; }
            var io = !m.spec && m.you != null && uid === String(m.you);
            var t = (pr[uid] && pr[uid].tvl) || (rp[uid] && rp[uid].tvl) || {};
            out[g] = io ? mio : n(t.sx);
          });
          return { online:true, sx:out };
        }
      } catch(e){ warn('koPosti', e); }
      return { online:false, mio:mio };
    };
    G.personalizza = function(){
      spia('smash', 'personalizza');
      try { if (typeof RTD !== 'undefined' && RTD && RTD.ui === 'match') return false; } catch(e){}
      try { if (typeof G.esci === 'function') G.esci(); } catch(e){ warn('smash esci', e); }
      PZ.tavolo('smash');
      return true;
    };
  }
  function notaSmash(){
    if (!W.TV3 || typeof TV3.barraGiochi !== 'function' || TV3.barraGiochi.__pz) return;
    var o = TV3.barraGiochi;
    TV3.barraGiochi = function(){
      var h = o.apply(this, arguments), g = TV3.gioco;
      if (!g) { try { g = localStorage.getItem('gb_tv3_g'); } catch(e){} }
      if (g === 'smash' && typeof h === 'string') h = h.replace(/<p class="tv3g-nota">[\s\S]*?<\/p>/, '');
      return h;
    };
    TV3.barraGiochi.__pz = 1;
  }
  function via(){ try { aggancia(); agganciaQN(); guarda(); ponteSmash(); notaSmash(); } catch(e){ warn('via', e); } }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', via); else via();
  W.addEventListener('load', via);
})();
