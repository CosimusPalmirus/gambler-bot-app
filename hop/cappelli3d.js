/* COSMETICI_2011B_HOP3D · hop/cappelli3d.js (20/11/2026)
   Il proprietario: le anteprime dei cappelli della rana nella vetrina erano disegni 2D brutti: devono essere il cappello
   SUL MODELLO 3D DELLA RANA, quello della partita. Questa pagina (iframe nascosto dell'index, stessa origine) fa SOLO questo:
     1. carica la rana scelta (?pg=, i GLB e il manifest di HOP con la STESSA ?v= di stadio.js: in cache se si e' giocato);
     2. la mette nella posa dell'idle, le mette in testa il cappello (stessa costruzione e stessa misura della testa del
        blocco COSMETICI_2011 di stadio.js: osso mixamorigHead, dati di posa dello scheletro);
     3. con UN solo renderer WebGL disegna N fotogrammi (una lenta oscillazione destra-sinistra) per ogni cappello
        (0 = di serie, 1 cilindro, 2 corona, 3 casco) in un atlante, lo passa al padre come immagine;
     4. libera tutto (renderer, geometrie, materiali, contesto WebGL). Il padre poi toglie l'iframe.
   Contratto col padre: window.parent.HOP3D._ricevi(v, dataURL, meta) per ogni cappello, poi _fine({ok, ms, errore}).
   Niente rete verso il backend, niente soldi, nessun gestore in linea. */
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  var PAD = null; try { PAD = window.parent && window.parent !== window ? window.parent.HOP3D : null; } catch (e) { PAD = null; }
  var T0 = performance.now();
  function fine(o) { o.ms = Math.round(performance.now() - T0); window.__HOP3D_FINE = o; try { if (PAD && PAD._fine) PAD._fine(o); } catch (e) { } }
  function manda(v, url, meta) { try { if (PAD && PAD._ricevi) PAD._ricevi(v, url, meta); } catch (e) { } window.__HOP3D_SETS = (window.__HOP3D_SETS || 0) + 1; (window.__HOP3D_URL || (window.__HOP3D_URL = {}))[v] = url; }
  if (!window.THREE || !THREE.GLTFLoader) { fine({ ok: false, errore: 'three' }); return; }

  var PGS = ['tonfo', 'zip', 'axa', 'camu', 'grumo', 'luma'];
  var PG = PGS.indexOf(Q.get('pg')) >= 0 ? Q.get('pg') : 'tonfo';
  var VER = Q.get('gv') || '20261120b';                       // = const VER di stadio.js (stessa cache dei GLB)
  var N = Math.max(6, Math.min(24, +(Q.get('n') || 16)));       // fotogrammi per cappello
  var PX = Math.max(128, Math.min(384, +(Q.get('px') || 288))); // lato di un fotogramma
  var AMPIO = .62;                                             // oscillazione: +- 0,62 rad (circa 35 gradi)
  var ORDINE = (Q.get('ordine') || '0,1,2,3').split(',').map(Number).filter(function (v) { return v >= 0 && v <= 3; });
  var BORDO = '#ffffff';

  /* ── il cappello: copia fedele del blocco COSMETICI_2011 di stadio.js (capTesta, capCostruisci) con le misure COSMETICI_2011B (CAP_FORMA, CAP_RANA) ── */
  var CAP_FORMA = { 1: {d: .42, giu: .05, dietro: .14, incl: -.16}, 2: {d: .46, giu: .07, dietro: .10, incl: .05}, 3: {d: .66, giu: .04, dietro: .14, incl: 0}};   // = stadio.js COSMETICI_2011B
  // COSMETICI_2011B: correzioni PER RANA (gli occhi sporgenti non si coprono) = CAP_RANA di stadio.js, stessi numeri
  var CAP_RANA = {
    axa: {1: {d: .29, giu: .02}, 2: {d: .31}, 3: {d: .44, giu: .03}},
    grumo: {1: {d: .34, dietro: .32}, 2: {d: .38, dietro: .27}, 3: {d: .5, giu: 0, dietro: .32}},
    zip: {3: {d: .54, giu: .02, dietro: .24}},
    luma: {3: {d: .54, giu: .02, dietro: .24}}};
  function capForma(v) {
    var F = {}, k, base = CAP_FORMA[v], r = (CAP_RANA[PG] || {})[v] || {};
    for (k in base) F[k] = base[k]; for (k in r) F[k] = r[k];
    try { var x = Q.get('forma') ? JSON.parse(Q.get('forma')) : null; if (x && x[v]) for (k in x[v]) F[k] = x[v][k]; } catch (e) { }   // solo banchi: prove di misura
    return F;
  }
  function capTesta(sc, T) {
    var sotto = new Set(); T.traverse(function (n) { sotto.add(n); });
    var pts = [], M = new THREE.Matrix4(), inv = null;
    sc.traverse(function (n) {
      if (!n.isSkinnedMesh || !n.skeleton) return; var sk = n.skeleton, hi = sk.bones.indexOf(T); if (hi < 0) return;
      var P = n.geometry.attributes.position, SI = n.geometry.attributes.skinIndex, SW = n.geometry.attributes.skinWeight; if (!P || !SI || !SW) return;
      var dentro = sk.bones.map(function (b) { return sotto.has(b); }); inv = sk.boneInverses[hi]; M.multiplyMatrices(inv, n.bindMatrix);
      var den = function (a) { if (!a.normalized) return 1; var t = a.array; return t instanceof Int8Array ? 127 : t instanceof Uint8Array ? 255 : t instanceof Int16Array ? 32767 : t instanceof Uint16Array ? 65535 : 1; };
      var dP = den(P), C = ['getX', 'getY', 'getZ', 'getW'], passo = Math.max(1, Math.floor(P.count / 6000));
      for (var k = 0; k < P.count; k += passo) { var w = 0, tot = 0; for (var j = 0; j < 4; j++) { var q = SW[C[j]](k); tot += q; if (dentro[SI[C[j]](k)]) w += q; }
        if (tot > 0 && w / tot >= .6) pts.push(new THREE.Vector3(P.getX(k) / dP, P.getY(k) / dP, P.getZ(k) / dP).applyMatrix4(M)); }
    });
    if (!inv || pts.length < 12) return null;
    var su = new THREE.Vector3(0, 1, 0).transformDirection(inv), av0 = new THREE.Vector3(0, 0, 1).transformDirection(inv);
    var dx = new THREE.Vector3().crossVectors(su, av0).normalize(), av = new THREE.Vector3().crossVectors(dx, su).normalize();
    var a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9, h1 = -1e9, i, p, a, b;
    for (i = 0; i < pts.length; i++) { p = pts[i]; a = p.dot(dx); b = p.dot(av); a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    var ac = (a0 + a1) / 2, bc = (b0 + b1) / 2, larg = a1 - a0, prof = b1 - b0;
    for (i = 0; i < pts.length; i++) { p = pts[i]; a = p.dot(dx); b = p.dot(av); if (Math.abs(a - ac) < larg * .2 && Math.abs(b - bc) < prof * .3) h1 = Math.max(h1, p.dot(su)); }
    if (h1 < -1e8) for (i = 0; i < pts.length; i++) h1 = Math.max(h1, pts[i].dot(su));
    return { su: su, av: av, dx: dx, ac: ac, bc: bc, h1: h1, larg: larg, prof: prof };
  }
  function capContorno(col, sp) {
    var m = new THREE.MeshBasicMaterial({ color: col, side: THREE.BackSide });
    m.onBeforeCompile = function (sh) { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * ' + sp.toFixed(4) + ';'); };
    m.customProgramCacheKey = function () { return 'capc' + sp.toFixed(4); };
    return m;
  }
  function capCostruisci(v, col) {
    var grp = new THREE.Group();
    var S = function (o) { return new THREE.MeshStandardMaterial(o); };
    var metti = function (geo, mat, bordo, f) { var me = new THREE.Mesh(geo, mat); if (f) f(me); grp.add(me);
      if (bordo) { var c = new THREE.Mesh(geo, capContorno(col, bordo)); c.position.copy(me.position); c.quaternion.copy(me.quaternion); c.scale.copy(me.scale); grp.add(c); }
      return me; };
    var V2 = function (x, y) { return new THREE.Vector2(x, y); };
    if (v === 1) {
      var nero = S({ color: 0x18181b, roughness: .32, metalness: .15, emissive: 0x050507 });
      metti(new THREE.LatheGeometry([V2(0, .005), V2(.6, 0), V2(.8, .04), V2(.84, .075), V2(.79, .07), V2(.6, .06), V2(.49, .08), V2(.47, .1),
        V2(.455, .5), V2(.47, .86), V2(.5, .93), V2(.49, .955), V2(.3, .96), V2(0, .962)], 44), nero, .045);
      metti(new THREE.CylinderGeometry(.468, .461, .17, 44, 1, true), S({ color: 0xb91c1c, roughness: .55, metalness: .05, emissive: 0x2a0303, side: THREE.DoubleSide }), 0, function (m) { m.position.y = .2; });
      metti(new THREE.BoxGeometry(.1, .13, .05), S({ color: 0xe5c07b, roughness: .3, metalness: .6, emissive: 0x2a1d05 }), 0, function (m) { m.position.set(.2, .2, .43); m.rotation.y = .42; });
    } else if (v === 2) {
      var oro = S({ color: 0xe0b23c, roughness: .26, metalness: .55, emissive: 0x4a3000, emissiveIntensity: .7, side: THREE.DoubleSide });
      metti(new THREE.CylinderGeometry(.5, .47, .3, 40, 1, true), oro, 0, function (m) { m.position.y = .15; });
      metti(new THREE.TorusGeometry(.475, .045, 10, 44), oro, .03, function (m) { m.rotation.x = Math.PI / 2; m.position.y = .02; });
      metti(new THREE.TorusGeometry(.5, .04, 10, 44), oro, .03, function (m) { m.rotation.x = Math.PI / 2; m.position.y = .3; });
      var gemmaB = S({ color: 0x2563eb, roughness: .12, metalness: .2, emissive: 0x1d4ed8, emissiveIntensity: .55 });
      var rossa = S({ color: 0xdc2626, roughness: .15, metalness: .2, emissive: 0x7f1d1d, emissiveIntensity: .5 });
      for (var k = 0; k < 5; k++) { (function (k) { var a = k / 5 * Math.PI * 2, x = Math.sin(a) * .49, z = Math.cos(a) * .49;
        metti(new THREE.ConeGeometry(.13, .34, 4), oro, .03, function (m) { m.position.set(x, .45, z); m.rotation.y = a + Math.PI / 4; });
        metti(new THREE.SphereGeometry(.065, 12, 8), oro, .025, function (m) { m.position.set(x * 1.01, .64, z * 1.01); });
        if (k) metti(new THREE.SphereGeometry(.05, 10, 8), rossa, 0, function (m) { m.position.set(Math.sin(a) * .51, .15, Math.cos(a) * .51); }); })(k); }
      metti(new THREE.OctahedronGeometry(.11, 0), gemmaB, .025, function (m) { m.position.set(0, .16, .52); m.scale.set(1, 1.25, .55); });
    } else {
      var acc = S({ color: 0x9ca3af, roughness: .3, metalness: .55, emissive: 0x1f2937, emissiveIntensity: .5 });
      var scuro = S({ color: 0x6b7280, roughness: .35, metalness: .6, emissive: 0x111827, emissiveIntensity: .5 });
      metti(new THREE.SphereGeometry(.56, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), acc, .04, function (m) { m.scale.y = .82; });
      metti(new THREE.TorusGeometry(.56, .05, 10, 48), scuro, .03, function (m) { m.rotation.x = Math.PI / 2; m.position.y = .01; });
      metti(new THREE.TorusGeometry(.47, .045, 8, 28, Math.PI), scuro, 0, function (m) { m.rotation.y = Math.PI / 2; m.scale.y = .98; });
      [-1, 1].forEach(function (s) { metti(new THREE.SphereGeometry(.045, 10, 8), scuro, 0, function (m) { m.position.set(s * .5, .14, .2); }); });
      var vis = S({ color: 0x38bdf8, roughness: .08, metalness: .1, emissive: 0x0ea5e9, emissiveIntensity: .55, transparent: true, opacity: .82, side: THREE.DoubleSide });
      metti(new THREE.SphereGeometry(.6, 36, 6, Math.PI / 2 - .85, 1.7, Math.PI / 2 - .2, .34), vis, 0);
    }
    return grp;
  }
  function contornoRana(col, sp) {   // = contornoMat di stadio.js: lo scafo rovesciato che segue lo scheletro
    var m = new THREE.MeshBasicMaterial({ color: col, side: THREE.BackSide, skinning: true });
    m.onBeforeCompile = function (sh) { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * ' + sp.toFixed(5) + ';'); };
    return m;
  }

  /* ── il lavoro ── */
  var R = null, scena = null, cam = null, tutto = [];
  function libera() {
    try { scena && scena.traverse(function (n) { if (n.geometry) n.geometry.dispose(); var m = n.material; (Array.isArray(m) ? m : m ? [m] : []).forEach(function (x) { if (x.map) x.map.dispose(); x.dispose(); }); }); } catch (e) { }
    try { if (R) { R.dispose(); R.forceContextLoss(); } } catch (e) { }
    R = null; scena = null;
  }
  function prendi(ld, f) { return new Promise(function (res) { ld.load('assets_bayou/glb/' + f + '?v=' + VER, res, undefined, function () { res(null); }); }); }
  function cercaClip(lista, n) { n = String(n || ''); return lista.find(function (c) { return c.name === n; }) || lista.find(function (c) { return c.name.toLowerCase().indexOf(n.toLowerCase()) >= 0; }); }
  function pausa() { return new Promise(function (r) { setTimeout(r, 0); }); }

  async function via() {
    try {
      var cv = document.createElement('canvas'); cv.width = PX; cv.height = PX;
      try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { R = null; }
      if (!R || !R.getContext()) { fine({ ok: false, errore: 'webgl' }); return; }
      R.setPixelRatio(1); R.setSize(PX, PX, false); R.outputEncoding = THREE.sRGBEncoding; R.setClearColor(0, 0);
      scena = new THREE.Scene();
      scena.add(new THREE.HemisphereLight(0xcfeeff, 0x0b2a22, .85));
      var sole = new THREE.DirectionalLight(0xe6f4ff, .75); sole.position.set(-6, 14, 6); scena.add(sole);
      var fronte = new THREE.DirectionalLight(0xfff4e0, .55); fronte.position.set(3, 4, 10); scena.add(fronte);   // luce da vetrina: il davanti del cappello si legge
      var retro = new THREE.DirectionalLight(0x7fc8ff, .45); retro.position.set(4, 6, -8); scena.add(retro);
      cam = new THREE.PerspectiveCamera(28, 1, .05, 100);

      var man = null;
      try { var r = await fetch('assets_bayou/glb/manifest.json?v=' + VER); if (r.ok) man = await r.json(); } catch (e) { }
      var m = man && (man[PG] || man['*']); if (!m) { libera(); fine({ ok: false, errore: 'manifest' }); return; }
      var ld = new THREE.GLTFLoader(); if (window.MeshoptDecoder) ld.setMeshoptDecoder(window.MeshoptDecoder);
      var g = await prendi(ld, m.file); if (!g) { libera(); fine({ ok: false, errore: 'glb' }); return; }
      var tCar = performance.now() - T0;
      var sc = g.scene, perno = new THREE.Group(); perno.add(sc); scena.add(perno);
      // la posa: l'idle del manifest, fermo (per Grumo il pezzo «da» senza le mani in testa)
      var sp = m.clip && m.clip.idle, gc = g, tPosa = .25;
      if (sp && typeof sp === 'object' && sp.file) { var gx = await prendi(ld, sp.file); if (gx) gc = gx; }
      if (sp && typeof sp === 'object' && sp.da != null) tPosa = +sp.da + .05;
      var c0 = cercaClip(gc.animations, sp && typeof sp === 'object' ? sp.nome : sp);
      if (c0) { var c = c0.clone(); c.tracks = c.tracks.filter(function (t) { return !/Hips\.position$/.test(t.name); });
        var mix = new THREE.AnimationMixer(sc), az = mix.clipAction(c); az.play(); mix.setTime(Math.min(tPosa, Math.max(0, c.duration - .01))); }
      sc.updateMatrixWorld(true);
      var testa = null; sc.traverse(function (n) { if (!testa && n.isBone && /Head$/.test(n.name)) testa = n; });
      // la misura vera (vertici posati con le ossa) e lo scafo bianco come in partita
      var bb = new THREE.Box3(), v = new THREE.Vector3(), mesh = [];
      sc.traverse(function (n) { if (n.isMesh) mesh.push(n); });
      mesh.forEach(function (n) { n.frustumCulled = false; var P = n.geometry.attributes.position, passo = Math.max(1, Math.floor(P.count / 2500));
        for (var k = 0; k < P.count; k += passo) { if (n.isSkinnedMesh) { n.boneTransform(k, v); v.applyMatrix4(n.matrixWorld); } else v.fromBufferAttribute(P, k).applyMatrix4(n.matrixWorld); bb.expandByPoint(v); } });
      var dim = bb.getSize(new THREE.Vector3());
      var k0 = 1.75 / Math.max(.001, dim.y); perno.scale.setScalar(k0);
      var cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2; sc.position.set(-cx, -bb.min.y, -cz);
      var rawH = 0; mesh.forEach(function (n) { n.geometry.computeBoundingBox(); var b = n.geometry.boundingBox; rawH = Math.max(rawH, b.max.y - b.min.y, b.max.z - b.min.z); });
      var spess = .03 / k0 * (rawH / Math.max(.001, dim.y));
      mesh.forEach(function (n) {
        var s2 = n.isSkinnedMesh ? new THREE.SkinnedMesh(n.geometry, contornoRana(BORDO, spess)) : new THREE.Mesh(n.geometry, contornoRana(BORDO, spess));
        if (n.isSkinnedMesh) s2.bind(n.skeleton, n.bindMatrix); s2.frustumCulled = false; n.parent.add(s2); s2.position.copy(n.position); s2.quaternion.copy(n.quaternion); s2.scale.copy(n.scale);
      });
      var TT = testa ? capTesta(sc, testa) : null;
      // i cappelli (costruiti una volta, se ne accende uno alla volta)
      var cap = {};
      [1, 2, 3].forEach(function (vv) {
        var F = capForma(vv), grp = capCostruisci(vv, BORDO), piv = new THREE.Group(); piv.add(grp); grp.rotation.z = F.incl;
        if (TT && testa) {
          piv.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(TT.dx, TT.su, TT.av));
          piv.position.copy(TT.su).multiplyScalar(TT.h1 - TT.larg * F.giu).addScaledVector(TT.dx, TT.ac).addScaledVector(TT.av, TT.bc - TT.prof * F.dietro);
          piv.scale.setScalar(TT.larg * F.d); testa.add(piv);
        } else { piv.position.set(0, 1.75 * .97, .02); piv.scale.setScalar(.5); perno.add(piv); }
        piv.visible = false; cap[vv] = piv;
      });
      // l'inquadratura: il busto e il cappello piu' alto (la stessa per tutti: cambiando cappello la rana non salta)
      perno.updateMatrixWorld(true);
      var alto = 1.75; [1, 2, 3].forEach(function (vv) { cap[vv].visible = true; perno.updateMatrixWorld(true); var b = new THREE.Box3().setFromObject(cap[vv]); if (isFinite(b.max.y)) alto = Math.max(alto, b.max.y); cap[vv].visible = false; });
      var giu = alto * .3, meta = (alto + giu) / 2, fin = (alto - giu) * 1.16 / 2;
      // le rane larghe (grumo) non si tagliano ai lati: anche la larghezza (che gira con l'oscillazione) deve entrare
      fin = Math.max(fin, Math.max(dim.x, dim.z) * k0 / 2 * 1.06);
      var dist = fin / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      cam.position.set(0, meta + fin * .18, dist); cam.lookAt(0, meta, 0);
      var cols = Math.ceil(Math.sqrt(N * 2)), righe = Math.ceil(N / cols);
      var at = document.createElement('canvas'); at.width = cols * PX; at.height = righe * PX; var ax = at.getContext('2d');
      var tDis = 0;
      for (var oi = 0; oi < ORDINE.length; oi++) {
        var vv = ORDINE[oi], t1 = performance.now();
        [1, 2, 3].forEach(function (w) { cap[w].visible = w === vv; });
        ax.clearRect(0, 0, at.width, at.height);
        for (var f = 0; f < N; f++) {
          perno.rotation.y = Q.get('ang') != null ? +Q.get('ang') : -AMPIO + 2 * AMPIO * f / (N - 1) + .12;   // ?ang= solo per i banchi (foto frontali)
          R.render(scena, cam);
          ax.drawImage(cv, (f % cols) * PX, Math.floor(f / cols) * PX);
          if (f % 6 === 5) await pausa();   // il telefono respira: il filo e' quello della pagina
        }
        var url = at.toDataURL('image/webp', .9);
        if (url.indexOf('data:image/webp') !== 0) url = at.toDataURL('image/png');
        tDis += performance.now() - t1;
        manda(vv, url, { n: N, px: PX, cols: cols, righe: righe, pg: PG, kb: Math.round(url.length * .75 / 1024) });
        await pausa();
      }
      libera();
      fine({ ok: true, pg: PG, n: N, px: PX, caricamento: Math.round(tCar), disegno: Math.round(tDis), testa: !!TT });
    } catch (e) { libera(); fine({ ok: false, errore: String(e && e.message || e) }); }
  }
  via();
})();
