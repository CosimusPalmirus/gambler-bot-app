/* roster3d.js — CAST PRERENDERIZZATO (sprite 3D) con lo stesso contratto di roster_1410/roster.js.
   Script classico, nessuna dipendenza. Va caricato DOPO roster.js (che resta il ripiego vettoriale):

     <script src="../roster_1410/roster.js"></script>
     <script src="../prerender_1410/roster3d.js"></script>

   window.GBR resta quello di sempre (list/get/draw/portrait/prebake/muzzle/durata/dpr) e in più:
     GBR.load(ids) -> Promise   carica gli atlanti SOLO di chi è in partita (gli altri restano vettoriali)
     GBR.pose(id)  -> ['idle','run',...,'attack_up','air','ulti',...]   le animazioni disponibili
     GBR.ha3d(id)  -> true se quel personaggio ha gli sprite 3D (pronti o da caricare)
   Finché un atlante non è pronto, quel personaggio si disegna col roster vettoriale. */
(function (root) {
  'use strict';
  const VETT = root.GBR && !root.GBR.is3d ? root.GBR : null;
  const BASE = root.GBR3D_BASE || (function () {
    const s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^/]*$/, '') + 'sprite/' : 'sprite/';
  })();
  const POSE_BASE = ['idle', 'run', 'attack', 'super', 'hit', 'ko', 'win', 'jump', 'fall', 'shield'];
  // se una posa in più manca, si ripiega su quella base più vicina
  const ALIAS = {
    attack_up: 'attack', attack_down: 'attack', attack_side: 'attack', air: 'attack', grab: 'attack',
    throw: 'attack', dash: 'attack', walk: 'run', charge: 'super', ulti: 'super', a_terra: 'ko',
    // chiavi di mossa di smash_1410
    jab: 'attack', side: 'attack', up: 'attack', down: 'attack', fsmash: 'attack', usmash: 'attack', dsmash: 'attack',
    nair: 'attack', fair: 'attack', bair: 'attack', uair: 'attack', dair: 'attack', presa: 'attack', lancio: 'attack',
    nspec: 'super', sspec: 'super', uspec: 'super', dspec: 'super', carica: 'super'
  };
  const DURATA = Object.assign({ attack: 0.34, super: 0.75, hit: 0.32, ko: 0.65 }, VETT && VETT.durata);
  const SCALINI = [1, 0.7, 0.5, 0.35, 0.25];     // atlanti ridotti in anticipo (qualità alta, drawImage ~1:1)
  const C = {};                                  // id -> stato del personaggio
  let indice = null, indiceP = null;
  let dpr = Math.min(2, root.devicePixelRatio || 1);
  // qualità: 'basso' = atlante a 0,75x (memoria x0,56). ?q=basso, oppure window.GBR3D_Q, oppure da sola
  // sui telefoni con poca memoria (navigator.deviceMemory <= 2). Va decisa prima di load().
  let QUAL = root.GBR3D_Q || (/[?&]q=basso/.test(root.location ? root.location.search : '') ? 'basso' : '')
    || (/[?&]q=normale/.test(root.location ? root.location.search : '') ? 'normale' : '')
    || (root.navigator && navigator.deviceMemory && navigator.deviceMemory <= 2 ? 'basso' : 'normale');
  // 16/10 (smash_1410, telefono): con GBR.altezzaPx (altezza attesa del lottatore sullo schermo, in pixel veri) la scelta
  // si fa per ogni personaggio: se sullo schermo non è più alto dell'atlante basso (+10%), l'atlante intero non si
  // vedrebbe comunque. Così si scarica il 30% in meno e in memoria pesa il 44% in meno. 0 = non si sa: decide QUAL.
  let ALTEZZA = 0;
  const FORZATA = !!(root.GBR3D_Q || /[?&]q=(basso|normale)/.test(root.location ? root.location.search : ''));
  const FADE = 60;                               // ms di dissolvenza al cambio di posa
  // 26/10 unione quartetto 2: INTERRUTTORE della dissolvenza per lottatore. Con le pose di Nitro (in aria centrate, a terra sui
  // piedi) il fotogramma vecchio che sfuma sotto il nuovo si vede come una DOPPIA FIGURA. 28/10: il proprietario la SPEGNE PER TUTTI.
  const FADE_SPENTA = { pilota: 1 };
  const FADE_SPENTA_TUTTI = true;
  const ST = new Map();                          // chiave -> ultima posa disegnata (per la dissolvenza)

  function caricaIndice() {
    if (!indiceP) indiceP = fetch(BASE + 'indice.json?v=3a4999d88c').then(r => r.ok ? r.json() : { ids: [] })
      .catch(() => ({ ids: [] })).then(j => { indice = new Set(j.ids || []); return indice; });
    return indiceP;
  }
  caricaIndice();

  // 21/10 sera (proprietario: «modelli non caricati» — il Cucù restava vettoriale per tutta la partita sul telefono): un
  // atlante che non arrivava (rete, decodifica) restava in 'errore' per sempre e il lottatore si disegnava col ripiego.
  // Ora si riprova da soli (3 volte, 0,8 / 1,6 / 2,4 s) e, se resta in errore, il disegno riprova ogni 3 s (fino a 10 volte).
  function carica(id) {
    const v = C[id];
    if (v && v.stato === 'errore' && (v.giri || 0) < 10 && performance.now() - (v.errT || 0) > 3000) { delete C[id]; const p = carica(id); C[id].giri = (v.giri || 0) + 1; return p; }
    if (C[id]) return C[id].p;
    const c = C[id] = { stato: 'carico', J: null, img: null, rit: null, scal: {}, tinte: new Map(), p: null, tent: 0 };
    c.p = caricaIndice().then(ix => {
      if (!ix.has(id)) { c.stato = 'no'; return false; }
      const tenta = () => fetch(BASE + id + '.json').then(r => { if (!r.ok) throw new Error('json ' + r.status); return r.json(); }).then(J => {
        c.J = J;
        const basso = !!J.basso && (QUAL === 'basso' || (!FORZATA && ALTEZZA > 0 && ALTEZZA <= J.basso.scala * (J.h_rif || 150) * 1.1));
        c.basso = basso;
        c.b0 = basso ? J.basso.scala : (J.scala || 1);
        const img = new Image(); img.decoding = 'async'; img.src = BASE + (basso ? J.basso.atlante : J.atlante);
        // l'atlante si copia in un canvas: un <img> grande in certi percorsi di disegno (raster software,
        // cache di decodifica piena) può venire ridecodificato a ogni drawImage
        const pr = [img.decode().then(() => {
          const k = canvas(img.naturalWidth, img.naturalHeight);
          k.getContext('2d').drawImage(img, 0, 0);
          c.img = root.GBR3D_IMG ? img : k;
        })];
        if (J.ritratto) {
          const ri = new Image(); ri.src = BASE + J.ritratto;
          pr.push(ri.decode().then(() => { c.rit = ri; }).catch(() => { }));
        }
        return Promise.all(pr);
      });
      const giro = () => tenta().catch(e => {
        if (c.tent++ < 3) return new Promise(r => setTimeout(r, 800 * c.tent)).then(giro);
        throw e;
      });
      return giro().then(() => { c.stato = 'pronto'; return true; })
        .catch(e => { c.stato = 'errore'; c.errT = performance.now(); console.warn('roster3d: ' + id, e); return false; });
    });
    return c.p;
  }

  const pronto = id => { const c = C[id]; return c && c.stato === 'pronto' ? c : null; };

  // ------------------------------------------------------------------ atlanti ridotti
  function canvas(w, h) {
    const k = document.createElement('canvas'); k.width = Math.max(1, w); k.height = Math.max(1, h); return k;
  }
  function riduci(src, w, h) {        // dimezzamenti successivi: niente scalette né aloni
    let s = src, sw = src.width, sh = src.height;
    while (sw / 2 >= w * 1.01) {
      const k = canvas(Math.round(sw / 2), Math.round(sh / 2)), x = k.getContext('2d');
      x.imageSmoothingQuality = 'high'; x.drawImage(s, 0, 0, k.width, k.height);
      s = k; sw = k.width; sh = k.height;
    }
    const k = canvas(w, h), x = k.getContext('2d');
    x.imageSmoothingQuality = 'high'; x.drawImage(s, 0, 0, w, h);
    return k;
  }
  // 16/10: una copia ridotta si fa solo se è davvero più piccola (al massimo il 75% dell'atlante): prima un atlante a
  // 0,73 si copiava a 0,70 (13 MB per il 4% in meno). E se ne tengono al massimo 2 per personaggio (le meno usate vanno).
  const RID_MIN = root.GBR3D_RID || 0.75, RID_MAX = 2;
  function scalino(c, need) {
    const b0 = c.b0 || 1;
    let b = b0;
    for (const s of SCALINI) if (s <= b0 * RID_MIN && s >= need * 0.97) b = s;
    if (b === b0) return { b: b0, src: c.img };
    let z = c.scal[b];
    if (!z) {
      const k = Object.keys(c.scal);
      if (k.length >= RID_MAX) {
        let v = k[0]; for (const q of k) if (c.scal[q].uso < c.scal[v].uso) v = q;
        const w = c.scal[v]; delete c.scal[v]; w.src.width = w.src.height = 0;
        for (const [key, T] of c.tinte) if (key.endsWith('|' + w.b)) c.tinte.delete(key);
      }
      z = c.scal[b] = { b, src: riduci(c.img, Math.round(c.J.w * b), Math.round(c.J.h * b)), uso: 0 };
    }
    z.uso = performance.now();
    return z;
  }

  // ------------------------------------------------------------------ pose
  // nomi del contratto vecchio -> chiavi di mossa di smash (se il personaggio le ha)
  const MOSSA = { attack: 'jab', super: 'nspec', attack_up: 'up', attack_down: 'down', attack_side: 'side', air: 'nair',
    grab: 'presa', throw: 'lancio', charge: 'carica' };
  function risolvi(J, p) {                       // alias "come" fra pose (fsmash -> side ...)
    for (let i = 0; i < 4 && J.pose[p] && J.pose[p].come; i++) p = J.pose[p].come;
    return p;
  }
  function posaDi(J, pose, aim, f) {
    let p = pose || 'idle';
    if (!J.pose[p] && MOSSA[p] && J.pose[MOSSA[p]]) p = MOSSA[p];
    if (p === 'attack' && aim != null) {           // mira in su / in giù -> colpo specifico, se c'è
      const sy = Math.sin(aim);
      if (sy < -0.62 && J.pose.attack_up) p = 'attack_up';
      else if (sy > 0.62 && J.pose.attack_down) p = 'attack_down';
    }
    if (!J.pose[p]) p = ALIAS[p] && J.pose[ALIAS[p]] ? ALIAS[p] : (J.pose[p] ? p : 'idle');
    return risolvi(J, p);
  }
  function fotogramma(P, t) {
    const F = P.f, T = P.durata;
    t = t || 0;
    if (P.loop) { t = t % T; if (t < 0) t += T; } else if (t > T) t = T;
    let i = 0;
    while (i + 1 < F.length && F[i + 1][1] <= t + 1e-6) i++;
    return F[i];
  }
  function verso(o) {
    let f = o.facing < 0 ? -1 : 1;
    if (o.aim != null && Math.cos(o.aim) * f < -0.12) f = -f;   // si gira da solo verso dove mira
    return f;
  }

  // ------------------------------------------------------------------ lampo da colpo (tinta precotta per posa)
  function tinta(c, z, nome, col, a) {
    const key = nome + '|' + col + '|' + a + '|' + z.b;
    let T = c.tinte.get(key);
    if (T) { c.tinte.delete(key); c.tinte.set(key, T); return T; }   // LRU
    const P = c.J.pose[nome], R = c.J.r, b = z.b, pos = {};
    let w = 0, h = 0;
    const usati = [...new Set(P.f.map(f => f[0]))];
    for (const i of usati) { const r = R[i]; pos[i] = w; w += Math.ceil(r[2] * b) + 2; h = Math.max(h, Math.ceil(r[3] * b)); }
    const k = canvas(w, h), x = k.getContext('2d');
    for (const i of usati) { const r = R[i]; x.drawImage(z.src, r[0] * b, r[1] * b, r[2] * b, r[3] * b, pos[i], 0, r[2] * b, r[3] * b); }
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = a; x.fillStyle = col; x.fillRect(0, 0, w, h);
    T = { k, pos };
    c.tinte.set(key, T);
    if (c.tinte.size > 12) c.tinte.delete(c.tinte.keys().next().value);
    return T;
  }

  function scalaCtx(ctx) {
    const m = ctx.getTransform();
    return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
  }

  // ------------------------------------------------------------------ il contratto
  // per il vettoriale le pose in più diventano quelle base (attack_up -> attack, dash -> run...)
  function perVett(o) {
    const p = o.pose;
    if (!p || POSE_BASE.indexOf(p) >= 0 || !ALIAS[p]) return o;
    return Object.assign({}, o, { pose: ALIAS[p] });
  }
  function draw(ctx, id, x, y, o) {
    o = o || {};
    const c = pronto(id);
    if (!c) {
      if (indice && indice.has(id) && (!C[id] || C[id].stato === 'errore')) carica(id);   // in partita: si carica (e si riprova) da solo
      if (VETT) VETT.draw(ctx, id, x, y, perVett(o));
      return;
    }
    const J = c.J, h = o.h || 96, k = h / J.h_rif;
    const f = verso(o), nome = posaDi(J, o.pose, o.aim, f), P = J.pose[nome];
    const F = fotogramma(P, o.t), r = J.r[F[0]];
    const z = scalino(c, k * scalaCtx(ctx));
    const b = z.b, kk = k / b;
    const ax = F[2] * k, ay = F[3] * k;
    const a0 = ctx.globalAlpha;
    if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
    if (o.shadow) {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath();
      ctx.ellipse(x, y, h * 0.3 * (J.taglia || 1), h * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    }
    let src = z.src, sx = r[0] * b, sy = r[1] * b;
    if (o.tint) {
      const T = tinta(c, z, nome, o.tint, o.tintA != null ? o.tintA : 0.7);
      src = T.k; sx = T.pos[F[0]]; sy = 0;
    }
    // dissolvenza di 60 ms al cambio di posa: il fotogramma vecchio sfuma sotto il nuovo (1 drawImage in più,
    // solo durante il passaggio). Non per i fantasmi (alpha < 1) né per due istanze dello stesso id senza `chiave`.
    if (FADE > 0 && !FADE_SPENTA_TUTTI && !FADE_SPENTA[id] && (o.alpha == null || o.alpha >= 0.99)) {
      const key = o.chiave || id, now = performance.now();
      let S = ST.get(key);
      if (!S) ST.set(key, S = { nome, cella: F[0], ax: F[2], ay: F[3], f, t0: -1e9, prev: null, x, ts: now, doppio: false });
      else {
        if (now - S.ts < 3 && Math.abs(x - S.x) > 2) S.doppio = true;   // stesso id disegnato due volte nel fotogramma
        if (S.nome !== nome && !S.doppio) { S.prev = { cella: S.cella, ax: S.ax, ay: S.ay, f: S.f }; S.t0 = now; }
        S.nome = nome; S.cella = F[0]; S.ax = F[2]; S.ay = F[3]; S.f = f; S.x = x; S.ts = now;
      }
      const q = (now - S.t0) / FADE;
      if (S.prev && q < 1 && !o.tint) {
        const r2 = c.J.r[S.prev.cella];
        ctx.globalAlpha = (o.alpha != null ? a0 * o.alpha : a0) * (1 - q);
        cella(ctx, z.src, r2[0] * b, r2[1] * b, r2[2] * b, r2[3] * b, x, y, S.prev.ax * k, S.prev.ay * k, kk, S.prev.f);
        ctx.globalAlpha = o.alpha != null ? a0 * o.alpha : a0;
      }
    }
    cella(ctx, src, sx, sy, r[2] * b, r[3] * b, x, y, ax, ay, kk, f);
    ctx.globalAlpha = a0;
  }

  function cella(ctx, src, sx, sy, sw, sh, x, y, ax, ay, kk, f) {
    if (f > 0) ctx.drawImage(src, sx, sy, sw, sh, x - ax, y - ay, sw * kk, sh * kk);
    else {
      ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
      ctx.drawImage(src, sx, sy, sw, sh, -ax, -ay, sw * kk, sh * kk);
      ctx.restore();
    }
  }

  function muzzle(id, x, y, o) {
    o = o || {};
    const c = pronto(id);
    if (!c) return VETT && VETT.muzzle ? VETT.muzzle(id, x, y, perVett(o)) : [x, y - (o.h || 96) * 0.5];
    const J = c.J, k = (o.h || 96) / J.h_rif, f = verso(o);
    const F = fotogramma(J.pose[posaDi(J, o.pose, o.aim, f)], o.t);
    return [x + f * F[4] * k, y + F[5] * k];
  }

  // punto d'impatto disegnato della posa (rispetto ai piedi, già scalato e specchiato)
  function colpo(id, x, y, o) {
    o = o || {};
    const c = pronto(id); if (!c) return null;
    const J = c.J, k = (o.h || 96) / J.h_rif, f = verso(o), P = J.pose[posaDi(J, o.pose, o.aim, f)];
    if (!P.colpo) return null;
    return { x: x + f * P.colpo[0] * k, y: y + P.colpo[1] * k, t: P.t_impatto };
  }

  function portrait(ctx, id, x, y, size) {
    const c = pronto(id);
    if (c && c.rit) { ctx.drawImage(c.rit, x, y, size, size); return; }
    if (VETT) VETT.portrait(ctx, id, x, y, size);
  }

  function prebake(h, d, ids) {
    const t0 = performance.now(); let byte = 0;
    const tutti = ids || Object.keys(C);
    const vett = [];
    for (const id of tutti) {
      const c = pronto(id);
      if (!c) { vett.push(id); continue; }
      const z = scalino(c, (h || 96) / c.J.h_rif * (d || dpr));
      byte += z.src.width * z.src.height * 4;
    }
    let rv = null;
    if (VETT && VETT.prebake && vett.length) rv = VETT.prebake(h, d, vett);
    return { ms: performance.now() - t0 + (rv ? rv.ms : 0), byte: byte + (rv ? rv.byte : 0) };
  }

  function load(ids) {
    return caricaIndice().then(ix => Promise.all((ids || [...ix]).map(id => ix.has(id) ? carica(id) : Promise.resolve(false))))
      .then(r => (ids || [...indice]).filter((id, i) => r[i]));
  }

  function memoria() {
    let b = 0;
    for (const id in C) {
      const c = C[id]; if (!c.J) continue;
      b += (c.img ? c.img.width * c.img.height : 0) * 4;
      for (const s in c.scal) b += c.scal[s].src.width * c.scal[s].src.height * 4;
      for (const T of c.tinte.values()) b += T.k.width * T.k.height * 4;
    }
    return b + (VETT && VETT.memoria ? VETT.memoria() : 0);
  }

  // GBR.pose(id) -> le animazioni di quel personaggio. Ma smash_1410 usa GBR.pose come elenco globale
  // (GBR.pose.indexOf('attack_up')): la funzione risponde anche così, con tutte le pose che draw accetta
  // (quelle in più ripiegano da sole su quelle base, per i vettoriali e per chi non le ha).
  const TUTTE = POSE_BASE.concat(Object.keys(ALIAS));
  function POSE_FN(id) {
    const c = pronto(id);
    return c ? Object.keys(c.J.pose) : POSE_BASE.slice();
  }
  POSE_FN.indexOf = n => TUTTE.indexOf(n);
  POSE_FN.includes = n => TUTTE.indexOf(n) >= 0;
  POSE_FN.tutte = TUTTE;

  const GBR = {
    is3d: true,
    vettoriale: VETT,
    list: VETT ? VETT.list : [],
    get: id => (VETT ? VETT.get(id) : null),
    draw, muzzle, colpo, portrait, prebake, load, memoria,
    durata: DURATA,
    pose: POSE_FN,
    ha3d: id => !!(indice && indice.has(id)),
    pronto: id => !!pronto(id),
    durataPosa: (id, n) => { const c = pronto(id), P = c && c.J.pose[n]; return P ? P.durata : 0; },   // 20/10: copione delle pose delle ulti
    base: BASE,                                   // cartella degli sprite (ritratti <id>_ritratto.webp)
    // libera la memoria di un personaggio (schermata di scelta: si tengono solo gli ultimi guardati)
    // 16/10: la memoria si rende subito (canvas a 0x0), non quando passa la raccolta
    scarica(id) {
      const c = C[id]; if (!c) return;
      delete C[id]; ST.delete(id);
      if (c.img && c.img.getContext) { c.img.width = c.img.height = 0; }
      for (const s in c.scal) { const k = c.scal[s].src; if (k && k.getContext) k.width = k.height = 0; }
      for (const T of c.tinte.values()) { T.k.width = T.k.height = 0; }
      c.scal = {}; c.tinte.clear(); c.img = null;
    },
    caricati: () => Object.keys(C),
    svuota() {
      for (const id in C) { C[id].scal = {}; C[id].tinte.clear(); }
      if (VETT && VETT.svuota) VETT.svuota();
    },
    get qualita() { return QUAL; },
    set qualita(v) { QUAL = v === 'basso' ? 'basso' : 'normale'; },   // prima di load()
    get altezzaPx() { return ALTEZZA; },
    set altezzaPx(v) { ALTEZZA = +v || 0; },                         // prima di load(): scelta per personaggio
    bassi: () => Object.keys(C).filter(id => C[id].basso),
    get dpr() { return dpr; },
    set dpr(v) { dpr = v; if (VETT) VETT.dpr = v; },
    indice: () => caricaIndice()
  };
  root.GBR = GBR;
})(window);
