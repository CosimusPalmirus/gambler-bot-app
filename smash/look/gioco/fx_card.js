/* COPIA smash_look_1710 di smash_1410/fx_card.js: una sola riga in piu' (niente scia larga per il Campione).
 GAMBLER SMASH — effetti d'impatto «come la card A» (17/10, cantiere smash_fx_1710). SOLO DISEGNO.
   Lampo a stella bianco-giallo con nucleo bianco, raggi lunghi e sottili, anello d'urto, scintille e schegge che volano,
   linee di velocità, scia del pugno, luce di contorno calda sui lottatori, bagliore che illumina l'ambiente,
   energia dorata ad anelli sul colpo caricato (card B). Graduato per forza: jab / medio / forte-smash / KO, più parata.

   Regole:
   - legge lo stato del motore, non lo scrive MAI; niente Math.random (generatore locale xorshift32 del solo disegno);
   - sprite d'effetto cotti UNA volta in canvas fuori schermo (prepara()); nel ciclo solo drawImage/percorsi semplici;
   - pool a dimensione fissa (raffiche e particelle in vettori tipizzati): zero allocazioni per fotogramma;
   - il «fermo immagine» è quello del motore (hitlag del colpito, S.fermo del KO): finché dura, la raffica resta al
     picco e le sue schegge restano sospese in aria, come nella card. Nessun tempo del motore viene toccato.
   Interruttore: GSFX.on (pagina di prova: tasto V, bottone, ?fx=0). */
(function (root) {
  'use strict';
  const TAU = 6.283185307179586;
  let T = null; // strumenti dal disegno: glow, cam, scossaDir, opz, COLP, inCarica, GS
  let seme = 0x2545F491;
  function rnd() { let x = seme; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; seme = x >>> 0; return seme / 4294967296; }

  // ---------------------------------------------------------------- sprite cotti
  const SP = { stella: [], nucleo: null, raggio: null, anelli: {}, scie: {}, schegge: [], oro: null, esa: null, linee: null };
  function tela(w, h) { const k = document.createElement('canvas'); k.width = w; k.height = h; return k; }
  function faiStella(v) {
    const N = 256, R = N / 2, k = tela(N, N), x = k.getContext('2d');
    x.translate(R, R); x.globalCompositeOperation = 'lighter';
    let g = x.createRadialGradient(0, 0, 0, 0, 0, R * .66);
    g.addColorStop(0, 'rgba(255,244,214,.55)'); g.addColorStop(.22, 'rgba(255,206,120,.24)'); g.addColorStop(.6, 'rgba(255,140,40,.06)'); g.addColorStop(1, 'rgba(255,110,20,0)');
    x.fillStyle = g; x.fillRect(-R, -R, N, N);
    const n = 28;
    for (let i = 0; i < n; i++) {
      const lungo = i % 4 === 0, medio = i % 2 === 0;
      const a = i * TAU / n + (rnd() - .5) * .16 + v * .41;
      const L = R * (lungo ? .84 + rnd() * .16 : medio ? .5 + rnd() * .22 : .26 + rnd() * .2);
      const bw = R * (lungo ? .05 : medio ? .042 : .034) * (.75 + rnd() * .5), r0 = R * .06;
      const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      const gr = x.createLinearGradient(0, 0, ca * L, sa * L);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,240,190,.95)'); gr.addColorStop(.7, 'rgba(255,184,80,.6)'); gr.addColorStop(1, 'rgba(255,130,30,0)');
      x.fillStyle = gr; x.beginPath();
      x.moveTo(ca * r0 + px * bw, sa * r0 + py * bw); x.lineTo(ca * L, sa * L); x.lineTo(ca * r0 - px * bw, sa * r0 - py * bw); x.closePath(); x.fill();
    }
    g = x.createRadialGradient(0, 0, 0, 0, 0, R * .3);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,246,1)'); g.addColorStop(.7, 'rgba(255,236,170,.55)'); g.addColorStop(1, 'rgba(255,200,100,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R * .3, 0, TAU); x.fill();
    return k;
  }
  function faiLampo() { // flash dei colpi piccoli: luce morbida con pochi raggi corti e appena accennati (niente stellina)
    const N = 128, R = 64, k = tela(N, N), x = k.getContext('2d');
    x.translate(R, R); x.globalCompositeOperation = 'lighter';
    let g = x.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,250,228,.95)'); g.addColorStop(.42, 'rgba(255,214,130,.4)'); g.addColorStop(1, 'rgba(255,150,50,0)');
    x.fillStyle = g; x.fillRect(-R, -R, N, N);
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6 + (rnd() - .5) * .3, L = R * (.7 + rnd() * .25), bw = R * .035, ca = Math.cos(a), sa = Math.sin(a);
      const gr = x.createLinearGradient(0, 0, ca * L, sa * L); gr.addColorStop(0, 'rgba(255,250,230,.55)'); gr.addColorStop(1, 'rgba(255,190,90,0)');
      x.fillStyle = gr; x.beginPath(); x.moveTo(-sa * bw, ca * bw); x.lineTo(ca * L, sa * L); x.lineTo(sa * bw, -ca * bw); x.closePath(); x.fill();
    }
    return k;
  }
  function faiNucleo() {
    const N = 128, R = 64, k = tela(N, N), x = k.getContext('2d');
    const g = x.createRadialGradient(R, R, 0, R, R, R);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,240,.95)'); g.addColorStop(.55, 'rgba(255,226,150,.45)'); g.addColorStop(1, 'rgba(255,170,60,0)');
    x.fillStyle = g; x.fillRect(0, 0, N, N); return k;
  }
  function faiRaggio() { // fuso lungo e sottile, punta a destra: x 0..256, y 0..32
    const k = tela(256, 32), x = k.getContext('2d');
    x.globalCompositeOperation = 'lighter';
    let g = x.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(255,190,90,0)'); g.addColorStop(.12, 'rgba(255,200,110,.7)'); g.addColorStop(.6, 'rgba(255,170,60,.35)'); g.addColorStop(1, 'rgba(255,140,40,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(0, 16); x.lineTo(30, 6); x.lineTo(256, 15); x.lineTo(256, 17); x.lineTo(30, 26); x.closePath(); x.fill();
    g = x.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.1, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,246,210,.7)'); g.addColorStop(1, 'rgba(255,230,180,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(0, 16); x.lineTo(28, 12.5); x.lineTo(256, 15.7); x.lineTo(256, 16.3); x.lineTo(28, 19.5); x.closePath(); x.fill();
    return k;
  }
  function anello(col, sottile) {
    const key = sottile ? col + '|s' : col;
    let k = SP.anelli[key]; if (k) return k;
    const N = 256, R = 128; k = tela(N, N); const x = k.getContext('2d');
    const g = x.createRadialGradient(R, R, 0, R, R, R);
    if (sottile) { g.addColorStop(.82, 'rgba(0,0,0,0)'); g.addColorStop(.865, col); g.addColorStop(.885, 'rgba(255,250,235,1)'); g.addColorStop(.905, col); g.addColorStop(.95, 'rgba(0,0,0,0)'); }
    else { g.addColorStop(.74, 'rgba(0,0,0,0)'); g.addColorStop(.83, col); g.addColorStop(.88, 'rgba(255,250,235,1)'); g.addColorStop(.93, col); g.addColorStop(1, 'rgba(0,0,0,0)'); }
    x.globalAlpha = .9; x.fillStyle = g; x.fillRect(0, 0, N, N);
    // spezzato in archi irregolari come l'onda della card (cancella qualche tratto)
    x.globalCompositeOperation = 'destination-out'; x.globalAlpha = .75;
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + rnd() * .8; x.beginPath(); x.moveTo(R, R); x.arc(R, R, R, a, a + .18 + rnd() * .3); x.closePath(); x.fill(); }
    SP.anelli[key] = k; return k;
  }
  function scia(col) { // sbavatura del pugno: coda trasparente a sinistra, testa calda a destra (128x48)
    let k = SP.scie[col]; if (k) return k;
    k = tela(128, 48); const x = k.getContext('2d');
    x.globalCompositeOperation = 'lighter';
    let g = x.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, col); g.addColorStop(1, col);
    x.globalAlpha = .55; x.fillStyle = g; x.beginPath(); x.moveTo(0, 24); x.quadraticCurveTo(60, 4, 112, 6); x.arc(112, 24, 18, -Math.PI / 2, Math.PI / 2); x.quadraticCurveTo(60, 44, 0, 24); x.fill();
    g = x.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.6, 'rgba(255,240,200,.8)'); g.addColorStop(1, 'rgba(255,255,255,1)');
    x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.moveTo(10, 24); x.quadraticCurveTo(64, 14, 114, 15); x.arc(114, 24, 9, -Math.PI / 2, Math.PI / 2); x.quadraticCurveTo(64, 34, 10, 24); x.fill();
    SP.scie[col] = k; return k;
  }
  function faiScheggia(v) { // frammento angoloso chiaro col bordo scuro (32x32)
    const k = tela(32, 32), x = k.getContext('2d'), n = 4 + (v % 3);
    x.translate(16, 16); x.beginPath();
    for (let i = 0; i < n; i++) { const a = i * TAU / n + (rnd() - .5) * .9, r = (i % 2 ? 6 : 13) * (.7 + rnd() * .4); i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.closePath();
    x.fillStyle = v % 2 ? '#f4eefc' : '#e4dcf4'; x.fill();
    x.lineJoin = 'round'; x.lineWidth = 2; x.strokeStyle = '#2a1c40'; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.moveTo(-4, -6); x.lineTo(5, -5); x.lineTo(-2, -1); x.closePath(); x.fill();
    return k;
  }
  function faiOro() { // energia dorata ad anelli (card B): archi a spirale con buchi, 256
    const N = 256, R = 128, k = tela(N, N), x = k.getContext('2d');
    x.translate(R, R); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    const raggi = [.42, .56, .7, .84];
    for (let j = 0; j < raggi.length; j++) {
      const r = R * raggi[j], tratti = 3 + j;
      for (let i = 0; i < tratti; i++) {
        const a0 = i * TAU / tratti + j * .7 + rnd() * .4, a1 = a0 + TAU / tratti * (.45 + rnd() * .3);
        x.strokeStyle = 'rgba(255,190,50,.55)'; x.lineWidth = R * (.075 - j * .012); x.beginPath(); x.arc(0, 0, r, a0, a1); x.stroke();
        x.strokeStyle = 'rgba(255,246,200,.95)'; x.lineWidth = R * (.026 - j * .004); x.beginPath(); x.arc(0, 0, r, a0 + .05, a1 - .05); x.stroke();
      }
    }
    for (let i = 0; i < 26; i++) { const a = rnd() * TAU, r = R * (.35 + rnd() * .6), s = 1.5 + rnd() * 3; x.fillStyle = 'rgba(255,236,160,.9)'; x.fillRect(Math.cos(a) * r - s / 2, Math.sin(a) * r - s / 2, s, s); }
    return k;
  }
  function faiEsa() { // parata: anello esagonale di cristallo
    const N = 256, R = 128, k = tela(N, N), x = k.getContext('2d');
    x.translate(R, R); x.globalCompositeOperation = 'lighter'; x.lineJoin = 'round';
    const es = (r) => { x.beginPath(); for (let i = 0; i <= 6; i++) { const a = i * TAU / 6 + TAU / 12; i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); } };
    x.strokeStyle = 'rgba(110,220,255,.5)'; x.lineWidth = 14; es(R * .82); x.stroke();
    x.strokeStyle = 'rgba(235,252,255,1)'; x.lineWidth = 4; es(R * .82); x.stroke();
    x.strokeStyle = 'rgba(160,236,255,.7)'; x.lineWidth = 2; es(R * .55); x.stroke();
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + TAU / 12; x.beginPath(); x.moveTo(Math.cos(a) * R * .55, Math.sin(a) * R * .55); x.lineTo(Math.cos(a) * R * .82, Math.sin(a) * R * .82); x.stroke(); }
    return k;
  }
  function prepara() {
    if (FX.pronto) return;
    seme = 0x2545F491;
    for (let v = 0; v < 3; v++) SP.stella.push(faiStella(v));
    SP.nucleo = faiNucleo(); SP.lampo = faiLampo(); SP.raggio = faiRaggio(); SP.oro = faiOro(); SP.esa = faiEsa();
    for (let v = 0; v < 4; v++) SP.schegge.push(faiScheggia(v));
    anello('rgba(255,236,190,.9)');
    FX.pronto = true;
  }

  // ---------------------------------------------------------------- raffiche (pool fisso)
  // tipo 0 colpo, 1 parata perfetta, 2 colpo sullo scudo
  const NB = 24, NR = 10, RAF = [];
  for (let i = 0; i < NB; i++) RAF.push({ t: 99, life: 0, x: 0, y: 0, tier: 0, ang: 0, s: 0, col: '#fff', ci: 5, vi: -1, at: -1, v: 0, rot: 0, tipo: 0, hold: 0, hf: 0, ft: 0, picco: 1, ra: new Float32Array(NR), rl: new Float32Array(NR), nr: 0 });
  let rNext = 0;
  function nuovaRaffica() { const b = RAF[rNext]; rNext = (rNext + 1) % NB; return b; }

  // ---------------------------------------------------------------- particelle (vettori tipizzati)
  // k: 0 scintilla (linea), 2 scheggia, 3 brace. ci: indice colore in COLS
  const NP = 384;
  const px = new Float32Array(NP), py = new Float32Array(NP), pvx = new Float32Array(NP), pvy = new Float32Array(NP);
  const pl = new Float32Array(NP), pm = new Float32Array(NP), ps = new Float32Array(NP), pr = new Float32Array(NP), pvr = new Float32Array(NP), pg = new Float32Array(NP);
  const pk = new Uint8Array(NP), pci = new Uint8Array(NP), pbi = new Int8Array(NP);
  let pNext = 0;
  const COLS = ['#ff3b4e', '#3b8bff', '#ffd23b', '#38f08a', '#8fe8ff', '#ffe2a0', '#ffc23a'];
  const C_CIANO = 4, C_CALDO = 5, C_ORO = 6;
  function part(k, x, y, vx, vy, life, size, ci, g, bi) {
    const i = pNext; pNext = (pNext + 1) % NP; vive++;
    px[i] = x; py[i] = y; pvx[i] = vx; pvy[i] = vy; pl[i] = life; pm[i] = life; ps[i] = size; pk[i] = k; pci[i] = ci; pg[i] = g; pbi[i] = bi;
    pr[i] = rnd() * TAU; pvr[i] = (rnd() - .5) * .5;
    return i;
  }
  function muovi(i) {
    px[i] += pvx[i]; py[i] += pvy[i]; pvy[i] += pg[i]; pr[i] += pvr[i];
    const k = pk[i];
    if (k === 0) { pvx[i] *= .955; pvy[i] *= .955; } else if (k === 2) { pvx[i] *= .97; } else { pvx[i] *= .95; pvy[i] = pvy[i] * .95 - .03; }
  }

  // luce di contorno per lottatore (0..3)
  const rim = new Float32Array(4), rimX = new Float32Array(4), rimY = new Float32Array(4), rimOro = new Uint8Array(4);
  // scia del pugno: ultima punta per lottatore
  let ft = 0, vive = 0;   // vive: particelle accese (se 0 il disegno salta i giri sul pool)
  const FX = {
    on: true, pronto: false, conta: 0, bordoOn: true,   // bordoOn: luce di contorno (la parte più cara: uno sprite tinto in più)
    init(t) { T = t; prepara(); for (let i = 0; i < t.COLP.length; i++) { anello(t.COLP[i]); anello(t.COLP[i], 1); scia(t.COLP[i]); } anello('rgba(255,236,190,.9)', 1); scia('#ffffff'); anello('#8fe8ff'); },
    azzera() { for (const b of RAF) b.t = b.life = 99; for (let i = 0; i < NP; i++) pl[i] = 0; rim.fill(0); },
    colpo, parata, scudo, passo, dietro, sopra, bordo, vera, lampo,
  };

  function tierDi(e, F, mA, base, ko) {
    const dmg = e.v1, kb = e.v2;
    // 17/10 sera, il proprietario: «più piccoli, se no diventa caotico; in particolare i colpi normali; per le abilità è diverso».
    // 0-1 = COLPI NORMALI (jab, inclinati, aerei, prese, smash NON caricati): stella piccola, poche scintille, 6-8 f, niente
    //       anelli, raggi, schegge, luce d'ambiente, scossa o fermo visivo. 2 = smash CARICATO e abilità/speciali. 3 = KO.
    if (ko) return 3;
    if (base) return (mA && mA.carica && F && F.mc >= 8) ? 2 : (dmg >= 7 || kb >= 80) ? 1 : 0;
    return dmg >= 8 || kb >= 120 ? 2 : 1;
  }
  const S_TIER = [.2, .26, .5, .62], LIFE = [6, 8, 14, 18], NSC = [3, 5, 14, 22], VSC = [4, 5, 10, 13], NSCH = [0, 0, 7, 14], NRAG = [0, 0, 7, 10];

  function colpo(S, e, F, mA, base, ko) {
    if (!FX.on || !FX.pronto) return false;
    const GS = T.GS, V = S.L[e.b]; if (!V) return false;
    const H = GS.D(V).H, dmg = e.v1, kb = e.v2, wa = e.v3, tier = tierDi(e, F, mA, base, ko);
    const leggero = T.opz.leggero, folla = S.n >= 3;
    const b = nuovaRaffica();
    b.tipo = 0; b.t = 0; b.ft = 0; b.tier = tier; b.life = LIFE[tier]; b.vi = e.b; b.at = e.a;
    b.ang = -wa * TAU / 360; b.v = (rnd() * 3) | 0; b.rot = b.ang + (rnd() - .5) * .5; b.picco = tier >= 2 ? 2 : 1; b.hf = 0;
    b.ci = F ? F.p : C_CALDO; b.col = F ? T.COLP[F.p] : '#ffd36a';
    b.s = H * S_TIER[tier] * (tier < 2 ? (1 + Math.min(.15, dmg * .01)) * (folla ? .85 : 1) : 1 + Math.min(.4, dmg * .012));   // normali: grande quanto un pugno/la testa
    // il lampo sta fra il pugno e il corpo colpito (come nella card), non sopra il colpito
    b.x = e.x - Math.cos(b.ang) * b.s * .3; b.y = e.y - Math.sin(b.ang) * b.s * .3;
    // raggi lunghi: concentrati lungo la direzione del colpo e la sua perpendicolare (come la card)
    b.nr = leggero ? NRAG[tier] >> 1 : NRAG[tier];
    for (let k = 0; k < b.nr; k++) {
      const asse = k % 3 === 0 ? b.ang : k % 3 === 1 ? b.ang + Math.PI : b.ang + (k & 1 ? 1 : -1) * Math.PI / 2;
      b.ra[k] = asse + (rnd() - .5) * 1.1; b.rl[k] = .5 + rnd() * .5 + (k % 3 === 0 ? .4 : 0);
    }
    const bi = RAF.indexOf(b);
    // scintille: per lo più a cono lungo il lancio, un quarto tutt'intorno
    const nsc = leggero ? NSC[tier] >> 1 : NSC[tier], ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    for (let k = 0; k < nsc; k++) {
      const omni = k % 4 === 3, da = omni ? rnd() * TAU : (rnd() - .5) * 1.3, sp = VSC[tier] * (.45 + rnd() * .9);
      const vx = omni ? Math.cos(da) : ca * Math.cos(da) - sa * Math.sin(da), vy = omni ? Math.sin(da) : sa * Math.cos(da) + ca * Math.sin(da);
      const i = part(0, e.x, e.y, vx * sp, vy * sp - (tier >= 2 ? 1.2 : .6), tier < 2 ? 6 + rnd() * 4 : 10 + rnd() * (6 + tier * 3), 1 + rnd() * 1.4, C_CALDO, .24, tier >= 2 ? bi : -1);
      if (tier >= 2) { muovi(i); muovi(i); }   // già un po' aperte quando il fermo le blocca
    }
    // schegge e braci
    const nsh = leggero ? NSCH[tier] >> 1 : NSCH[tier];
    for (let k = 0; k < nsh; k++) {
      const da = (rnd() - .5) * 2.2, sp = 3 + rnd() * (3 + tier * 2);
      const i = part(2, e.x, e.y, (ca * Math.cos(da) - sa * Math.sin(da)) * sp, (sa * Math.cos(da) + ca * Math.sin(da)) * sp - 1.5, 22 + rnd() * 16, H * (.07 + rnd() * .08) * (tier === 3 ? 1.3 : 1), C_CALDO, .32, tier >= 2 ? bi : -1);
      if (tier >= 2) { muovi(i); muovi(i); muovi(i); }
    }
    if (tier >= 2) for (let k = 0; k < (leggero ? 4 : 8); k++) part(3, e.x + (rnd() - .5) * b.s, e.y + (rnd() - .5) * b.s, (rnd() - .5) * 3, -rnd() * 2.5, 26 + rnd() * 20, 1.5 + rnd() * 2, k & 1 ? C_CALDO : C_ORO, 0, -1);
    // luce di contorno su chi è colpito e su chi colpisce
    if (tier >= 2) {
      const fr = 1;
      if (e.b >= 0 && e.b < 4) { rim[e.b] = Math.max(rim[e.b], fr); rimX[e.b] = e.x; rimY[e.b] = e.y; rimOro[e.b] = 0; }
      if (e.a >= 0 && e.a < 4) { rim[e.a] = Math.max(rim[e.a], fr * .9); rimX[e.a] = e.x; rimY[e.a] = e.y; rimOro[e.a] = 0; }
    }
    // camera: lo smash base prima non scuoteva; ora rimbalza poco lungo il colpo e un lampo caldo appena
    if (tier === 2 && base) T.scossaDir(wa, 3 + dmg * .3);   // solo lo smash caricato
    if (tier >= 2 && T.cam.flash < .1) { T.cam.flash = .1; T.cam.flashCol = '#ffe6b0'; }
    FX.conta++;
    return true;
  }
  function parata(S, e) {
    if (!FX.on || !FX.pronto) return false;
    const GS = T.GS, V = S.L[e.a], H = V ? GS.D(V).H : 64;
    const b = nuovaRaffica();
    b.tipo = 1; b.hf = 0; b.t = 0; b.ft = 0; b.tier = 2; b.life = 22; b.x = e.x; b.y = e.y; b.vi = e.a; b.at = e.b; b.ang = 0; b.rot = 0; b.v = 0; b.picco = 2;
    b.ci = C_CIANO; b.col = '#8fe8ff'; b.s = H * .55; b.nr = 0;
    const bi = RAF.indexOf(b);
    for (let k = 0; k < 14; k++) { const a = k * TAU / 14 + rnd() * .3, sp = 4 + rnd() * 6; const i = part(0, e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, 12 + rnd() * 8, 1.8, k % 3 ? C_CIANO : C_CALDO, .05, bi); muovi(i); muovi(i); }
    if (e.a >= 0 && e.a < 4) { rim[e.a] = 1; rimX[e.a] = e.x; rimY[e.a] = e.y; rimOro[e.a] = 2; }
    return true;
  }
  // una scintilla vera al posto delle stelline che volavano (effetti.js Z.stella, disegno.js particelle di tipo 3)
  function vera(x, y, vx, vy, fredda) {
    if (!FX.on) return false;
    let v2 = vx * vx + vy * vy;
    if (v2 < 4) { const a = rnd() * TAU, sp = 2.5 + rnd() * 3; vx += Math.cos(a) * sp; vy += Math.sin(a) * sp - 1.5; }
    part(0, x, y, vx * 1.2, vy * 1.2, 7 + rnd() * 6, 1 + rnd(), fredda ? C_CIANO : C_CALDO, .24, -1);
    return true;
  }
  // il vecchio lampo a stellina (scintilla() del disegno: scontri, contrattacchi, monete...) diventa un flash
  function lampo(x, y, s, col, forte) {
    if (!FX.on || !FX.pronto) return false;
    const b = nuovaRaffica();
    b.tipo = 3; b.t = 0; b.ft = 0; b.tier = forte ? 1 : 0; b.life = forte ? 10 : 7; b.x = x; b.y = y; b.vi = -1; b.ang = 0; b.rot = rnd() * TAU; b.v = 0; b.picco = 1;
    b.ci = C_CALDO; b.col = col; b.s = s * .75; b.nr = 0;
    for (let k = 0; k < (forte ? 6 : 3); k++) { const a = rnd() * TAU, sp = 3 + rnd() * 4; part(0, x, y, Math.cos(a) * sp, Math.sin(a) * sp - 1, 7 + rnd() * 5, 1 + rnd(), col === '#7fd8ff' ? C_CIANO : C_CALDO, .24, -1); }
    return true;
  }
  function scudo(S, e) {
    if (!FX.on || !FX.pronto) return false;
    const b = nuovaRaffica();
    b.tipo = 2; b.t = 0; b.ft = 0; b.tier = 0; b.life = 9; b.x = e.x; b.y = e.y; b.vi = -1; b.ang = 0; b.rot = rnd() * TAU; b.v = (rnd() * 3) | 0; b.picco = 1;
    b.ci = C_CIANO; b.col = '#8fe8ff'; b.s = 14 + e.v1 * 1.2; b.nr = 0;
    for (let k = 0; k < 5; k++) { const a = rnd() * TAU, sp = 3 + rnd() * 3; part(0, e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, 9, 1.4, k & 1 ? C_CIANO : C_CALDO, .05, -1); }
    return true;
  }

  // ---------------------------------------------------------------- passo visivo (60 Hz)
  function passo(S) {
    ft++;
    const fermoKO = S.fermo > 0;
    for (let n = 0; n < NB; n++) {
      const b = RAF[n]; if (b.t >= b.life) continue;
      b.ft++;
      const V = b.vi >= 0 ? S.L[b.vi] : null;
      b.hold = b.tier >= 2 && b.hf < 3 && (fermoKO || (V && V.hl > 0)) && b.t >= b.picco && b.t < b.picco + 1 ? 1 : 0;   // picco tenuto al massimo 3 f
      if (b.hold) b.hf++;
      if (!b.hold) b.t++;
    }
    vive = 0;
    for (let i = 0; i < NP; i++) {
      if (pl[i] <= 0) continue;
      vive++;
      if (fermoKO || (pbi[i] >= 0 && RAF[pbi[i]].hold)) continue;
      pl[i]--; muovi(i);
    }
    let tiene = fermoKO; for (let n = 0; n < NB && !tiene; n++) if (RAF[n].hold && RAF[n].tier >= 2) tiene = true;
    if (!tiene) for (let i = 0; i < 4; i++) rim[i] *= .84;
    // carica: energia dorata e luce dorata su chi carica
    for (let i = 0; i < S.n && i < 4; i++) {
      const F = S.L[i]; if (F.st !== 'mossa') continue;
      const m = T.GS.mossaDi(T.GS.D(F), F.mv);
      if (T.inCarica(F, m)) { const pt = punta(F, m); if (pt) { rim[i] = Math.max(rim[i], .55 + .35 * caricaU(F, m)); rimX[i] = PT.x; rimY[i] = PT.y; rimOro[i] = 1; } }
    }
  }

  // punta del colpo (pugno/arma): la prima hitbox con danno della mossa
  const PT = { x: 0, y: 0, h: null };
  function punta(F, m) {
    if (!m || !m.hb || !m.hb.length) return null;
    let h = null; for (let j = 0; j < m.hb.length; j++) if (m.hb[j].dmg > 2) { h = m.hb[j]; break; }
    if (!h) return null;
    const H = T.GS.D(F).H; PT.x = F.x + F.dir * h.x * H; PT.y = F.y - h.y * H; PT.h = h; return PT;
  }
  function caricaU(F, m) { return Math.max(0, Math.min(1, F.mc / ((m.carica && m.carica.max) || 60))); }

  // ---------------------------------------------------------------- disegno
  function piu(c) { c.globalCompositeOperation = 'lighter'; }
  function norm(c) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  function qDi(b) { return b.hold ? b.picco / b.life : b.t / b.life; }

  // prima dei lottatori: la luce che illumina palco e fondo
  function dietro(c, S) {
    if (!FX.on) return;
    piu(c);
    for (let n = 0; n < NB; n++) {
      const b = RAF[n]; if (b.t >= b.life || (b.tier < 2 && b.tipo !== 1)) continue;
      const q = qDi(b), k = (1 - q) * (1 - q);
      const R = b.s * (b.tier === 3 ? 2.6 : b.tier === 2 ? 2.2 : 1.9);
      c.globalAlpha = (b.tipo === 1 ? .2 : b.tier === 2 ? .16 : .2) * k; c.drawImage(T.glow(b.tipo === 1 ? '#8fe8ff' : '#ffb04a'), b.x - R, b.y - R, R * 2, R * 2);
      c.globalAlpha = .1 * k; c.drawImage(T.glow(b.col), b.x - R * .6, b.y - R * .6, R * 1.2, R * 1.2);
      if (b.tipo === 0 && b.tier >= 2) raffica(c, b);   // il lampo grande sta dietro chi colpisce e chi è colpito
    }
    for (let i = 0; i < S.n && i < 4; i++) if (rimOro[i] === 1 && rim[i] > .05) {
      const R = T.GS.D(S.L[i]).H * 1.6; c.globalAlpha = .3 * rim[i]; c.drawImage(T.glow('#ffb52a'), rimX[i] - R, rimY[i] - R, R * 2, R * 2);
    }
    norm(c);
  }

  // dentro disegnaLottatore, PRIMA dello sprite e con la sua trasformazione: la sagoma calda spostata verso la luce
  // (resta visibile solo sul bordo che guarda il lampo = luce di contorno)
  function bordo(c, F, i, o, rot, sx, sy, cx, cy, H) {
    if (!FX.on || !FX.bordoOn || i > 3 || rim[i] < .06 || (T.opz.leggero && i !== T.opz.umano)) return;
    let dx = rimX[i] - cx, dy = rimY[i] - (cy - H * .5); const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const fall = Math.max(0, 1 - d / (H * 3.2)); if (fall <= 0) return;
    const w = 3.2 / Math.max(.35, T.cam.z);   // ~3 px a schermo
    dx /= d; dy /= d;
    const cr = Math.cos(-rot), sr = Math.sin(-rot), lx = (dx * cr - dy * sr) * w / (sx || 1), ly = (dx * sr + dy * cr) * w / (sy || 1);
    o.tint = rimOro[i] === 2 ? '#bff4ff' : rimOro[i] === 1 ? '#ffd040' : '#ffe2a8'; o.tintA = 1; o.alpha = Math.min(.98, rim[i] * fall * 1.15);
    root.GBR.draw(c, F.id, lx * 1.4, ly * 1.4, o);
  }

  // sopra tutto: scie, energia di carica, raffiche, particelle
  function sopra(c, S) {
    if (!FX.on) return;
    const GS = T.GS;
    piu(c);
    // scie dei pugni e carica dorata
    for (let i = 0; i < S.n; i++) {
      const F = S.L[i]; if (F.st !== 'mossa' || F.hl > 0 && F.mf === 0) continue;
      const d = GS.D(F), m = GS.mossaDi(d, F.mv), H = d.H;
      if (T.inCarica(F, m)) { carica(c, F, m, H); continue; }
      if (root.GSLOOK && root.GSLOOK.niente_tinta_carica && root.GSLOOK.niente_tinta_carica(F)) continue;   // smash_look_1710: il Campione ha la sua scia sottile sul guantone (campione_fx.js)
      if (!m || m.tipo !== 'att' || !punta(F, m)) continue;
      const h = PT.h; if (F.mf < h.f0 - 2 || F.mf > h.f1 + 2) continue;
      const att = F.mf >= h.f0 && F.mf <= h.f1, sx = F.x - F.dir * H * .05, sy = F.y - H * .6;
      let vx = PT.x - sx, vy = PT.y - sy; const L = Math.sqrt(vx * vx + vy * vy); if (L < H * .15) continue;
      const forte = !!m.carica && F.mc >= 8, len = L * (forte ? 1.25 : .8), w = H * (forte ? .3 : .13);
      c.save(); c.translate(PT.x, PT.y); c.rotate(Math.atan2(vy, vx));
      c.globalAlpha = forte ? (att ? .85 : .35) : (att ? .5 : .2);
      c.drawImage(scia(i < 4 ? T.COLP[i] : '#ffffff'), -len, -w / 2, len + w * .4, w);
      c.restore();
    }
    // raffiche: i lampi grandi (smash caricato, abilità, KO) stanno DIETRO i lottatori (in dietro()); qui sopra
    // solo i flash piccoli dei colpi normali, la parata e un puntino di contatto dei grandi nei primi fotogrammi
    for (let n = 0; n < NB; n++) {
      const b = RAF[n]; if (b.t >= b.life) continue;
      if (b.tipo === 1) { disegnaParata(c, b); continue; }
      if (b.tipo === 0 && b.tier >= 2) {
        if (b.t < 3) { const RN = b.s * .14; c.globalAlpha = 1; c.drawImage(SP.nucleo, b.x - RN, b.y - RN, RN * 2, RN * 2); }
        continue;
      }
      raffica(c, b);
    }
    // SCINTILLE VERE (17/10 sera, il proprietario: «niente stelline, scintille vere»): striscia lunga quanto il moto
    // (sfocatura di movimento), coda arancio, corpo giallo, testa bianco-calda; si assottigliano mentre si spengono.
    // Tutte in 18 tratti al massimo (3 spessori x 3 strati x 2 tavolozze), niente stato per scintilla.
    c.lineCap = 'round';
    if (vive) for (let sch = 0; sch < 2; sch++) for (let fa = 0; fa < 3; fa++) for (let st = 0; st < 3; st++) {
      let any = false; c.beginPath();
      const lo = fa === 0 ? .6 : fa === 1 ? .3 : 0, hi = fa === 0 ? 2 : fa === 1 ? .6 : .3;
      const lun = st === 0 ? 2.8 : st === 1 ? 1.6 : .7;
      for (let i = 0; i < NP; i++) {
        if (pl[i] <= 0 || pk[i] !== 0 || (pci[i] === C_CIANO ? 1 : 0) !== sch) continue;
        const a = pl[i] / pm[i]; if (a <= lo || a > hi) continue;
        const k = (pbi[i] >= 0 && RAF[pbi[i]].hold ? .6 : 1) * lun * (ps[i] > 1.8 ? 1.15 : 1);
        c.moveTo(px[i], py[i]); c.lineTo(px[i] - pvx[i] * k, py[i] - pvy[i] * k); any = true;
      }
      if (!any) continue;
      c.globalAlpha = st === 0 ? .85 : 1;
      c.strokeStyle = sch ? (st === 0 ? '#2aa8ff' : st === 1 ? '#a8ecff' : '#ffffff') : (st === 0 ? '#ff7a1e' : st === 1 ? '#ffd050' : '#fff8e6');
      c.lineWidth = (fa === 0 ? 2.6 : fa === 1 ? 1.8 : 1.1) * (st === 0 ? 1 : st === 1 ? .8 : .6);
      c.stroke();
    }
    // braci
    if (vive) for (let i = 0; i < NP; i++) { if (pl[i] <= 0 || pk[i] !== 3) continue; const a = pl[i] / pm[i]; c.globalAlpha = Math.min(1, a * 1.5); c.fillStyle = COLS[pci[i]]; const z = ps[i]; c.fillRect(px[i] - z / 2, py[i] - z / 2, z, z); }
    norm(c);
    // schegge (normali, col bordo scuro: si leggono anche sul fondo chiaro)
    if (vive) for (let i = 0; i < NP; i++) {
      if (pl[i] <= 0 || pk[i] !== 2) continue;
      const a = pl[i] / pm[i], z = ps[i] * 2;
      c.globalAlpha = Math.min(1, a * 2.2);
      c.save(); c.translate(px[i], py[i]); c.rotate(pr[i]); c.drawImage(SP.schegge[i & 3], -z / 2, -z / 2, z, z); c.restore();
    }
    // le schegge della parata brillano d'azzurro
    c.globalAlpha = 1;
  }
  // un lampo (stella, nucleo, raggi, anelli, linee). 17/10 notte, il proprietario: «KO troppo invadente, copre»:
  // i grandi si disegnano dietro i lottatori, più piccoli, più trasparenti, picco breve.
  function raffica(c, b) {
    const q = qDi(b), e = 1 - (1 - q) * (1 - q) * (1 - q), s = b.s, tier = b.tier;
    const vive = tier >= 2 ? Math.pow(1 - q, 1.8) : 1 - q;   // i grandi sfumano in fretta dopo il picco
    // alone nel colore del giocatore (l'accento), sotto il lampo bianco-caldo
    c.globalAlpha = vive * vive * (tier >= 2 ? .3 : .35);
    const RA = s * (tier >= 2 ? .9 : .8) * (.7 + .4 * e);
    c.drawImage(T.glow(b.col), b.x - RA, b.y - RA, RA * 2, RA * 2);
    // anello d'urto (pallido, sottile), il secondo nel colore del giocatore
    if (tier >= 2) {
      const R1 = s * (.4 + 1.2 * e);
      c.globalAlpha = vive * .6; c.drawImage(anello('rgba(255,236,190,.9)', 1), b.x - R1, b.y - R1, R1 * 2, R1 * 2);
      if (tier >= 2 && b.t >= 3) { const q2 = (b.t - 3) / b.life, R2 = s * (.35 + 1.0 * (1 - (1 - q2) * (1 - q2))); c.globalAlpha = Math.max(0, 1 - q2 * 1.6) * .3; c.drawImage(anello(b.col, 1), b.x - R2, b.y - R2, R2 * 2, R2 * 2); }
    }
    // raggi lunghi e sottili
    if (b.nr) {
      const cresce = Math.min(1, (b.hold ? b.picco : b.t) / 3 + .35);
      c.globalAlpha = vive * .6;
      for (let k = 0; k < b.nr; k++) {
        const L = s * (.8 + .9 * b.rl[k]) * cresce, w = s * .07 * (1 - q * .7);
        c.save(); c.translate(b.x, b.y); c.rotate(b.ra[k]); c.drawImage(SP.raggio, s * .1, -w / 2, L, w); c.restore();
      }
    }
    // linee di velocità locali
    if (tier >= 2 && q < .6) {
      c.globalAlpha = (1 - q / .6) * .35; c.fillStyle = '#fff6e0'; c.beginPath();
      const r0 = s * (1.0 + e * .5), r1 = s * (1.6 + e);
      for (let k = 0; k < 16; k++) {
        const a = b.rot + k * TAU / 16 + ((k * 7) % 5) * .05, w = .012 + (k % 3) * .006, rr0 = r0 * (1 + (k % 4) * .12);
        c.moveTo(b.x + Math.cos(a - w) * rr0, b.y + Math.sin(a - w) * rr0); c.lineTo(b.x + Math.cos(a) * r1, b.y + Math.sin(a) * r1); c.lineTo(b.x + Math.cos(a + w) * rr0, b.y + Math.sin(a + w) * rr0);
      }
      c.fill();
    }
    // la stella: si apre di scatto, tiene il picco durante il fermo (sfarfalla appena), poi si ritira
    let sc;
    if (b.hold) sc = 1.0 + .05 * Math.sin(b.ft * 1.9);
    else { const tp = b.t / b.picco; sc = b.t <= b.picco ? .55 + .63 * tp : 1.18 - (b.t - b.picco) / (b.life - b.picco) * .75; }
    const RS = s * sc * (tier >= 2 ? .75 : 1);
    c.globalAlpha = Math.min(1, vive * 1.6);
    c.save(); c.translate(b.x, b.y); c.rotate(b.rot);
    const st = tier < 2 || b.tipo >= 2 ? SP.lampo : SP.stella[b.v];
    if (b.tipo === 2) { c.drawImage(T.glow('#8fe8ff'), -RS, -RS, RS * 2, RS * 2); }
    c.drawImage(st, -RS, -RS, RS * 2, RS * 2);
    c.restore();
    // nucleo bianco
    const RN = s * (tier >= 2 ? .28 : .38) * (b.hold ? 1.05 : 1 - q * .7);
    c.globalAlpha = Math.min(1, vive * 1.4); c.drawImage(SP.nucleo, b.x - RN, b.y - RN, RN * 2, RN * 2);
  }
  function carica(c, F, m, H) {
    if (!punta(F, m)) return;
    const u = caricaU(F, m), x = PT.x, y = PT.y, p = .5 + .5 * Math.sin(ft * .45);
    const R = H * (.34 + .26 * u) * (1 + .06 * p);
    c.globalAlpha = .55 + .25 * u; c.drawImage(T.glow('#ffb52a'), x - R * 1.7, y - R * 1.7, R * 3.4, R * 3.4);
    c.save(); c.translate(x, y);
    c.rotate(ft * .16); c.globalAlpha = .55 + .4 * u; c.drawImage(SP.oro, -R, -R, R * 2, R * 2);
    c.rotate(-ft * .38); c.globalAlpha = .45 + .35 * u; c.drawImage(SP.oro, -R * .72, -R * .72, R * 1.44, R * 1.44);
    c.restore();
    const RN = R * (.42 + .1 * p); c.globalAlpha = .9; c.drawImage(SP.nucleo, x - RN, y - RN, RN * 2, RN * 2);
  }
  function disegnaParata(c, b) {
    const q = qDi(b), e = 1 - (1 - q) * (1 - q), vive = 1 - q, s = b.s;
    c.globalAlpha = vive * vive * .4; const RG = s * 1.1; c.drawImage(T.glow('#8fe8ff'), b.x - RG, b.y - RG, RG * 2, RG * 2);
    const R = s * (.6 + .7 * e);
    c.globalAlpha = Math.min(1, vive * 1.5); c.save(); c.translate(b.x, b.y); c.rotate(q * .6); c.drawImage(SP.esa, -R, -R, R * 2, R * 2); c.restore();
    // scintillio a croce (vetro) e nucleo bianco
    const L = s * (1.6 + 1.2 * (b.hold ? 0 : q)), w = s * .14 * vive;
    for (let k = 0; k < 4; k++) { c.save(); c.translate(b.x, b.y); c.rotate(Math.PI / 4 + k * Math.PI / 2); c.drawImage(SP.raggio, 0, -w / 2, L, w); c.restore(); }
    const RN = s * .3 * (b.hold ? 1.1 : 1 - q * .6); c.globalAlpha = Math.min(1, vive * 1.8); c.drawImage(SP.nucleo, b.x - RN, b.y - RN, RN * 2, RN * 2);
  }

  root.GSFX = FX;
})(window);
