"use strict";
// ── NON SVEGLIARE IL DRAGO · SUONI VERI (17/11) ─────────────────────────────────────────────────────
// Caricato per ULTIMO (dopo polish.js). Sostituisce i suoni sintetizzati con file veri (cartella suoni/, mono, ~280 KB mp3 /
// ~230 KB opus) e un mixer vero: master -> limitatore; bus musica (con «duck» sotto il ruggito e la vampata), bus effetti
// (al massimo 3 voci insieme, le piu' importanti vincono), bus ambiente (aria della grotta, gocce, respiro del drago).
// Musica: «Grotta», composta dal codice (0 KB): bordone grave in re, note pizzicate rade con eco di caverna.
// Il tasto audio resta quello di prima; la scelta (acceso/spento) si ricorda in localStorage «drago_audio».
// I file si caricano dopo il primo tocco (regole autoplay di iOS / Telegram). Finche' un file non e' pronto suona il
// vecchio effetto sintetizzato, quindi non c'e' mai silenzio. Niente suoni «da casino'» (slot, fiches, registratori di cassa).
// Lo stesso file serve la pagina ascolta.html (window.SUONI_PAGINA = {...} prima di caricarlo).
(function () {
  const PAGINA = window.SUONI_PAGINA || null;
  const BASE = (PAGINA && PAGINA.base) || "suoni/";
  const VAR = { passo: 3 };                       // momenti con piu' varianti: passo_1..3
  const IDS = ["passo", "svela", "tasto_giu", "tasto_su", "tic", "ui", "mucchio", "gemma", "reliquia", "pericolo", "battito", "ringhio",
    "sbadiglio", "starnuto", "coda", "russata", "artiglio", "orecchio", "rombo", "ruggito", "inspira", "fuoco", "bruciati", "tosse",
    "lampade", "risalita", "cassa", "campo", "evviva", "spareggio", "vittoria", "sconfitta", "uovo", "bivio", "bottega", "compra",
    "ninna", "scudo", "torcia", "goccia"];
  const PRIO = { ruggito: 5, fuoco: 5, rombo: 4, vittoria: 4, sconfitta: 4, spareggio: 4, pericolo: 3, reliquia: 3, ringhio: 3, sbadiglio: 3,
    starnuto: 3, coda: 3, russata: 3, artiglio: 3, inspira: 3, tosse: 3, bruciati: 3, uovo: 3, scudo: 3, ninna: 3, mucchio: 2, campo: 2,
    lampade: 2, svela: 2, battito: 2, evviva: 2, torcia: 2, bivio: 2, bottega: 2 };   // il resto = 1
  const GUAD = { ringhio: .8, gemma: .85, orecchio: .8, battito: .75 };          // ritocchi di volume per momento (sopra il livello del file)
  const MUSICA = "A";   // A = «Grotta» dal codice; "file" = suoni/musica.(ogg|mp3); "vecchia"; "0" = nessuna (la scrive build_suoni.py --scelte)
  const E = { ctx: null, bus: null, buf: {}, voci: [], ultimo: {}, carico: 0, fmt: null, musica: null, finaleT: -9, vol: { master: .9, musica: .5, sfx: 1, amb: .7 } };
  window.SUONI = E;

  // ── formato: opus in ogg dove si puo', mp3 altrimenti (Safari / iOS) ──
  E.formato = function () {
    if (E.fmt) return E.fmt;
    let ok = ""; try { ok = new Audio().canPlayType('audio/ogg; codecs="opus"'); } catch (e) { }
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    return (E.fmt = ok && !ios ? "ogg" : "mp3");
  };

  // ── il mixer ──
  E.attacca = function (ctx) {
    if (E.bus && E.ctx === ctx) return E.bus;
    E.ctx = ctx; const c = ctx, g = (v) => { const n = c.createGain(); n.gain.value = v; return n; };
    const B = E.bus = {};
    B.lim = c.createDynamicsCompressor(); B.lim.threshold.value = -8; B.lim.knee.value = 6; B.lim.ratio.value = 12; B.lim.attack.value = .003; B.lim.release.value = .2;
    B.master = g(E.vol.master); B.master.connect(B.lim); B.lim.connect(c.destination);
    B.sfx = g(E.vol.sfx); B.sfx.connect(B.master);
    B.amb = g(E.vol.amb); B.amb.connect(B.master);
    // musica: [respiro: il vecchio MIX.musica, valore nominale .022] -> [compensa] -> [duck] -> [volume] -> master
    B.musResp = g(.022); B.musComp = g(1 / .022); B.duck = g(1); B.mus = g(E.vol.musica);
    B.musResp.connect(B.musComp); B.musComp.connect(B.duck); B.duck.connect(B.mus); B.mus.connect(B.master);
    // eco di caverna condivisa (musica, gocce, code degli effetti grossi)
    B.riv = c.createConvolver(); B.riv.buffer = E.risposta(c, 3.4); B.rivOut = g(.55); B.riv.connect(B.rivOut); B.rivOut.connect(B.master);
    B.rivSfx = g(.18); B.sfx.connect(B.rivSfx); B.rivSfx.connect(B.riv);
    B.rivMus = c.createConvolver(); B.rivMus.buffer = B.riv.buffer; B.rivMus.connect(B.duck);   // l'eco della musica segue volume e duck della musica
    return B;
  };
  E.risposta = function (c, dur) {   // risposta all'impulso finta: rumore che decade, con le alte che muoiono prima
    const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const a = b.getChannelData(ch); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n, k = .25 + .7 * t; lp = lp * k + (Math.random() * 2 - 1) * (1 - k); a[i] = lp * Math.pow(1 - t, 2.2) * (i < 600 ? i / 600 : 1); } }
    return b;
  };
  E.volume = function (bus, v) { E.vol[bus] = v; if (E.bus && E.bus[bus === "musica" ? "mus" : bus]) E.bus[bus === "musica" ? "mus" : bus].gain.setTargetAtTime(v, E.ctx.currentTime, .05); };
  E.ducka = function (db, tenuta) {   // abbassa la musica (e l'aria) sotto il ruggito / la vampata, poi risale piano
    if (!E.bus) return; const t = E.ctx.currentTime, v = Math.pow(10, db / 20);
    for (const n of [E.bus.duck]) { n.gain.cancelScheduledValues(t); n.gain.setTargetAtTime(v, t, .06); n.gain.setTargetAtTime(1, t + tenuta, .9); }
  };

  // ── caricamento ──
  E.urls = function (id) { const ext = "." + E.formato(); return VAR[id] ? Array.from({ length: VAR[id] }, (_, k) => BASE + id + "_" + (k + 1) + ext) : [BASE + id + ext]; };
  E.decodifica = function (url) {
    E._cache = E._cache || {};
    if (!E._cache[url]) E._cache[url] = fetch(url).then((r) => { if (!r.ok) throw new Error(url + " " + r.status); return r.arrayBuffer(); })
      .then((a) => new Promise((ok, no) => E.ctx.decodeAudioData(a, ok, no)));
    return E._cache[url];
  };
  E.carica = function () {
    if (E.carico || !E.ctx) return; E.carico = 1;
    const tutti = IDS.map((id) => Promise.all(E.urls(id).map(E.decodifica)).then((b) => { E.buf[id] = b; }).catch((e) => console.warn("suoni:", id, e.message || e)));
    if (MUSICA === "file") tutti.push(E.decodifica(BASE + "musica." + E.formato()).then((b) => { E.buf.musica = [b]; if (E.musica === "file") E.avviaMusica("file"); }).catch(() => { }));
    Promise.all(tutti).then(() => { E.carico = 2; });
  };

  // ── una voce ──
  // o: { vol, rate, pan, dt (ritardo in s), riv (eco extra 0..1) }. Ritorna false se il file non c'e' (allora suona il vecchio).
  E.suona = function (id, o) {
    o = o || {}; const c = E.ctx; if (!c || !E.bus) return false;
    const bb = E.buf[id]; if (!bb || !bb.length) return false;
    const ora = c.currentTime, pr = PRIO[id] || 1;
    if (id === "gemma" || id === "cassa" || id === "passo" || id === "orecchio") { if (ora - (E.ultimo[id] || -9) < .055) return true; }
    E.ultimo[id] = ora;
    E.voci = E.voci.filter((v) => v.fine > ora);
    if (E.voci.length >= 3) {   // al massimo 3 effetti insieme: cede il meno importante (a parita', il piu' vecchio)
      let peggio = null; for (const v of E.voci) if (!peggio || v.pr < peggio.pr || (v.pr === peggio.pr && v.t0 < peggio.t0)) peggio = v;
      if (peggio.pr > pr) return true;
      try { peggio.g.gain.setTargetAtTime(0, ora, .015); peggio.s.stop(ora + .08); } catch (e) { }
      E.voci = E.voci.filter((v) => v !== peggio);
    }
    const b = bb[Math.floor(Math.random() * bb.length)], s = c.createBufferSource(), g = c.createGain(), t0 = ora + (o.dt || 0);
    s.buffer = b; s.playbackRate.value = o.rate || 1; g.gain.value = (o.vol == null ? 1 : o.vol) * (GUAD[id] || 1);
    let ultimo = g;
    if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = o.pan; g.connect(p); ultimo = p; }
    s.connect(g); ultimo.connect(E.bus.sfx);
    if (o.riv) { const r = c.createGain(); r.gain.value = o.riv; ultimo.connect(r); r.connect(E.bus.riv); }
    s.start(t0);
    E.voci.push({ s, g, pr, t0, fine: t0 + b.duration / (o.rate || 1), id });
    return true;
  };

  // ── musica «Grotta» (dal codice): bordone in re, note pizzicate rade su Re- / Sib / Do / La-, gonfiori lenti ──
  const ACC = [[293.7, 349.2, 440, 587.3], [233.1, 293.7, 349.2, 466.2], [261.6, 329.6, 392, 523.3], [220, 261.6, 329.6, 440]];
  E.avviaMusica = function (tipo) {
    if (!E.bus) return; E.fermaMusica(); E.musica = tipo || MUSICA; const c = E.ctx, B = E.bus, M = E._m = { nodi: [], timer: 0 };
    const tieni = (n) => (M.nodi.push(n), n);
    if (E.musica === "file") {
      if (!E.buf.musica) return;   // arriva col caricamento
      const s = tieni(c.createBufferSource()), g = tieni(c.createGain()); s.buffer = E.buf.musica[0]; s.loop = true; g.gain.value = .7; s.connect(g); g.connect(B.musResp); s.start(); return;
    }
    if (E.musica === "vecchia") return E._vecchia(M, tieni);
    if (E.musica === "0") return;
    // il bordone: due seghe gravi (re, la) dietro un filtro che respira piano + un re piu' alto per i telefoni
    const LIV = .14;   // livello della Grotta: ~ -36 dBFS RMS, sotto gli effetti (misurato con strumenti/misura_pagina.py)
    const out = tieni(c.createGain()), rvs = tieni(c.createGain()); out.gain.value = LIV; rvs.gain.value = LIV; out.connect(B.musResp); rvs.connect(B.rivMus);
    const fl = tieni(c.createBiquadFilter()); fl.type = "lowpass"; fl.frequency.value = 240; fl.Q.value = .8;
    const lfo = tieni(c.createOscillator()), lg = tieni(c.createGain()); lfo.frequency.value = .045; lg.gain.value = 90; lfo.connect(lg); lg.connect(fl.frequency); lfo.start();
    const dr = tieni(c.createGain()); dr.gain.value = 0; dr.gain.setTargetAtTime(.32, c.currentTime, 2.5); fl.connect(dr); dr.connect(out);
    for (const [f, d, tp] of [[73.42, 0, "sawtooth"], [110, 4, "sawtooth"], [73.42, -6, "triangle"], [146.83, 2, "sine"]]) { const o = tieni(c.createOscillator()); o.type = tp; o.frequency.value = f; o.detune.value = d; const og = tieni(c.createGain()); og.gain.value = tp === "sine" ? .35 : .5; o.connect(og); og.connect(fl); o.start(); }
    // le note: eco a 0,43 s con coda scura + la caverna
    const eco = tieni(c.createDelay(1)), ecoFb = tieni(c.createGain()), ecoLp = tieni(c.createBiquadFilter()); eco.delayTime.value = .43; ecoFb.gain.value = .32; ecoLp.type = "lowpass"; ecoLp.frequency.value = 1300;
    eco.connect(ecoLp); ecoLp.connect(ecoFb); ecoFb.connect(eco); ecoLp.connect(out);
    const nota = (f, t, v, lungo) => {
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
      o.type = "triangle"; o.frequency.value = f; o2.type = "sine"; o2.frequency.value = f * 2; o2.detune.value = 3;
      lp.type = "lowpass"; lp.frequency.setValueAtTime(lungo ? 700 : 2200, t); lp.frequency.exponentialRampToValueAtTime(lungo ? 500 : 700, t + (lungo ? 5 : 1.2));
      const og = c.createGain(); og.gain.value = .25; o2.connect(og); og.connect(lp); o.connect(lp); lp.connect(g);
      g.gain.setValueAtTime(.0001, t);
      if (lungo) { g.gain.exponentialRampToValueAtTime(v, t + 2.6); g.gain.exponentialRampToValueAtTime(.0001, t + 7); }
      else { g.gain.exponentialRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + 2.4); }
      g.connect(out); g.connect(eco); const rv = c.createGain(); rv.gain.value = lungo ? 1.2 : .8; g.connect(rv); rv.connect(rvs);
      const fine = t + (lungo ? 7.2 : 2.6); o.start(t); o2.start(t); o.stop(fine); o2.stop(fine);
    };
    let prossima = c.currentTime + 1.5, passo = 0, ultima = -1;
    const pianifica = () => {
      if (!E.ctx || E._m !== M) return;
      while (prossima < c.currentTime + .6) {
        const acc = ACC[Math.floor(passo / 16) % 4], tens = Math.min(1, E.tensione || 0);
        if (passo % 32 === 0) nota(acc[0] / 2, prossima, .16, true);                 // ogni 16 s un gonfiore lento sul basso dell'accordo
        const p = passo % 4 === 0 ? .55 : passo % 2 === 0 ? .22 : .09;               // piu' sul battere, poche in levare
        if (Math.random() < p * (1 - tens * .5)) {
          let k; do { k = Math.floor(Math.random() * acc.length); } while (k === ultima && acc.length > 1); ultima = k;
          nota(acc[k] * (Math.random() < .2 ? 2 : 1), prossima + (Math.random() - .5) * .03, .09 + Math.random() * .05, false);
        }
        prossima += .5; passo++;
      }
    };
    pianifica(); M.timer = setInterval(pianifica, 200);
  };
  E._vecchia = function (M, tieni) {   // la musica di prima (accordi triangolari), solo per il confronto nella pagina
    const c = E.ctx, acc = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 196, 261.6], [196, 246.9, 293.7]]; let k = 0;
    const out = tieni(c.createGain()); out.gain.value = .04; out.connect(E.bus.musResp);   // = il livello di allora (.022 x .9) col volume musica di serie
    const suonaAcc = () => { if (E._m !== M) return; const t0 = c.currentTime; for (const fr of acc[k % 4]) { const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = fr; const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + 1.2); g.gain.linearRampToValueAtTime(0, t0 + 4.2); o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 4.3); } k++; };
    suonaAcc(); M.timer = setInterval(suonaAcc, 4000);
  };
  E.fermaMusica = function () {
    const M = E._m; if (!M) return; E._m = null; clearInterval(M.timer);
    for (const n of M.nodi) { try { if (n.stop) n.stop(); } catch (e) { } try { n.disconnect(); } catch (e) { } }
  };

  // ── ambiente: aria della grotta (rumore marrone), respiro del drago (compatibile col vecchio respiro()), gocce ──
  E.avviaAmbiente = function (MIX, gocceFile) {
    if (!E.bus || E._amb) return E._amb; const c = E.ctx, B = E.bus, A = E._amb = {};
    const n = c.sampleRate * 6, bf = c.createBuffer(1, n, c.sampleRate), a = bf.getChannelData(0); let ultimo = 0;
    for (let i = 0; i < n; i++) { ultimo = (ultimo + .02 * (Math.random() * 2 - 1)) / 1.02; a[i] = ultimo * 3.2; }
    const aria = c.createBufferSource(); aria.buffer = bf; aria.loop = true; const fl = c.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 170;
    A.amb = c.createGain(); A.amb.gain.value = .05; aria.connect(fl); fl.connect(A.amb); A.amb.connect(B.amb); aria.start(); A.fonti = [aria];
    // un filo di vento che va e viene
    const vb = c.createBiquadFilter(); vb.type = "bandpass"; vb.frequency.value = 420; vb.Q.value = 2; const vg = c.createGain(); vg.gain.value = .0;
    const vl = c.createOscillator(), vlg = c.createGain(); vl.frequency.value = .07; vlg.gain.value = .012; vl.connect(vlg); vlg.connect(vg.gain); vl.start();
    aria.connect(vb); vb.connect(vg); vg.connect(B.amb);
    // respiro del drago: banda stretta grave, il vecchio respiro() ne muove velocita' e profondita' col rischio
    const r = c.createBufferSource(); r.buffer = bf; r.loop = true; r.loopStart = 1.3; const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 190; bp.Q.value = 1.4;
    A.resp = c.createGain(); A.resp.gain.value = 0; const lfo = c.createOscillator(); lfo.frequency.value = .18; const lg = c.createGain(); lg.gain.value = .05;
    const sc = c.createGain(); sc.gain.value = 2.2; lfo.connect(lg); lg.connect(A.resp.gain); r.connect(bp); bp.connect(A.resp); A.resp.connect(sc); sc.connect(B.amb); r.start(0, 1.3); lfo.start(); A.fonti.push(r, lfo, vl);
    A.respLfo = { lfo, lg };
    if (MIX) { MIX.amb = A.amb; MIX.resp = A.resp; MIX.respLfo = A.respLfo; }
    // le gocce: ogni 4-9 s, tono e lato a caso, con l'eco della caverna
    const goccia = () => {
      if (!E._amb) return;
      if (!(gocceFile !== false && E.suonaGoccia())) E.gocciaSintetica();
      A.t = setTimeout(goccia, 4000 + Math.random() * 5000);
    };
    A.t = setTimeout(goccia, 2500);
    return A;
  };
  E.suonaGoccia = function () {
    const bb = E.buf.goccia; if (!bb || !E.bus || E.gocceSint) return false; const c = E.ctx, s = c.createBufferSource(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    s.buffer = bb[0]; s.playbackRate.value = .8 + Math.random() * .45; g.gain.value = .7 + Math.random() * .3; s.connect(g);
    const out = p ? (p.pan.value = Math.random() * 1.4 - .7, g.connect(p), p) : g; out.connect(E.bus.amb); const rv = c.createGain(); rv.gain.value = .8; out.connect(rv); rv.connect(E.bus.riv); s.start(); return true;
  };
  E.gocciaSintetica = function () {
    if (!E.bus) return; const c = E.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f = 1300 + Math.random() * 1200;
    o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.1, t + .05);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .09);
    o.connect(g); g.connect(E.bus.amb); const rv = c.createGain(); rv.gain.value = 1.5; g.connect(rv); rv.connect(E.bus.riv); o.start(t); o.stop(t + .12);
  };
  E.fermaAmbiente = function () { const A = E._amb; if (!A) return; E._amb = null; clearTimeout(A.t); for (const f of A.fonti) { try { f.stop(); } catch (e) { } } try { A.amb.disconnect(); A.resp.disconnect(); } catch (e) { } };

  if (PAGINA) return;   // ── da qui in giu': solo nel gioco ──────────────────────────────────────────────────
  if (typeof SUONO === "undefined" || typeof suona !== "function") return;

  // ── acceso / spento ricordato ──
  try { const m = localStorage.getItem("drago_audio"); if (m === "0") SUONO.on = false; else if (m === "1" && !AUTO) SUONO.on = true; } catch (e) { }
  const tastoAudio = document.getElementById("b-audio");
  if (tastoAudio) tastoAudio.style.opacity = SUONO.on ? 1 : .4;

  // ── il contesto: come prima, ma senza il ronzio fisso a 55 Hz e col mixer nuovo ──
  ac = function () {
    if (!SUONO.on) return null;
    if (!SUONO.ctx) { try { SUONO.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } E.attacca(SUONO.ctx); }
    return SUONO.ctx;
  };
  mix = function () {
    const c = SUONO.ctx; if (!c) return MIX; E.attacca(c);
    if (!MIX.master) {
      MIX.master = c.createGain(); MIX.master.gain.value = .8; MIX.master.connect(E.bus.sfx);   // i vecchi effetti (di riserva) passano dagli effetti
      MIX.musica = E.bus.musResp;
      E.avviaAmbiente(MIX); E.avviaMusica(MUSICA);
    }
    return MIX;
  };

  // ── sblocco al primo tocco (iOS / Telegram: il contesto parte solo dentro un gesto) + caricamento ──
  const sblocca = () => {
    if (!SUONO.on) return; const c = ac(); if (!c) return;
    try { c.resume(); const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) { }
    mix(); E.carica();
  };
  for (const ev of ["pointerdown", "touchend", "keydown"]) addEventListener(ev, sblocca, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => { const c = SUONO.ctx; if (!c) return; if (document.hidden) c.suspend(); else if (SUONO.on) c.resume(); });
  if (tastoAudio) tastoAudio.onclick = () => {
    SUONO.on = !SUONO.on; try { localStorage.setItem("drago_audio", SUONO.on ? "1" : "0"); } catch (e) { }
    if (SUONO.on) { sblocca(); E.suona("ui"); } else if (SUONO.ctx) SUONO.ctx.suspend();
    tastoAudio.style.opacity = SUONO.on ? 1 : .4;
  };

  const ora = () => (SUONO.ctx ? SUONO.ctx.currentTime : 0);
  const inSveglia = () => typeof S !== "undefined" && S.crollo && typeof SIM !== "undefined" && SIM - S.crollo.t0 < (typeof TW !== "undefined" ? TW.fine : 6.6);
  const vicinoFinale = () => performance.now() / 1000 - E.finaleT < 1.5;

  // ── gli effetti di base ──
  const suonaPrimaSuoni = suona;
  let nPasso = 0, campoT = -9;
  suona = function (tipo, f) {
    if (!SUONO.on) return; const c = ac(); if (!c) return; mix();
    const vai = (id, o) => E.suona(id, o) || (suonaPrimaSuoni(tipo, f), true);
    const forza = f == null ? 1 : f;
    switch (tipo) {
      case "passo": return vai("passo", { rate: .92 + Math.random() * .16, vol: [.9, .7, 1][nPasso++ % 3] });
      case "svela": return vai("svela");
      case "mucchio": return vai("mucchio");
      case "gemma": return vai("gemma", { rate: Math.min(1.35, .94 + forza * .05) + Math.random() * .04, vol: .8 });
      case "reliquia": if (vicinoFinale()) return; return vai("reliquia");
      case "battito": return vai("battito", { vol: Math.min(1, .25 + forza * .45) });   // quello continuo della scelta parte piano e cresce col rischio
      case "pericolo":
        // la seconda chiamata (perdita.js) arriva quando la vampata colpisce: li' sono i ladri bruciacchiati che perdono l'oro
        if (inSveglia() && SIM - S.crollo.t0 > 2) return vai("bruciati");
        return vai("pericolo", { riv: .4 });
      case "lampade": return vai("lampade");
      case "cassa":
        if (performance.now() - campoT > 2500) { campoT = performance.now(); E.suona("campo", { vol: .9 }); }
        return vai("cassa", { rate: .95 + Math.random() * .1, vol: .8 });
      case "crollo": return;   // il ruggito lo fa la sequenza del risveglio
    }
    return suonaPrimaSuoni(tipo, f);
  };

  // ── il drago ──
  const dragoPrimaSuoni = suonoDrago;
  suonoDrago = function (tipo) {
    if (!SUONO.on) return; const c = ac(); if (!c) return; mix();
    const vai = (id, o) => E.suona(id, o) || (dragoPrimaSuoni(tipo), true);
    if (["sbadiglio", "starnuto", "coda", "russata", "artiglio"].includes(tipo)) {
      if (tipo === "russata" && inSveglia()) return vai("russata", { vol: .8 });       // si riaddormenta dopo la vampata
      E.suona("ringhio", { vol: .75, riv: .5 });                                         // PRIMO AVVISO: il drago si agita...
      return vai(tipo, { dt: .12, riv: .3 });                                            // ...e fa il suo gesto
    }
    if (tipo === "orecchio") return vai("orecchio", { rate: .9 + Math.random() * .2, vol: .7 });
    // drago_anim.js lancia anche una sua vampata a +0,4 s dal crollo (prima del ruggito): con i file veri si sentirebbe
    // il fuoco prima del ruggito, quindi vale solo quella della sequenza del risveglio (TW.fuoco / TW.colpo)
    const dt = inSveglia() ? SIM - S.crollo.t0 : 99;
    if (tipo === "fuoco") { if (dt < TW.fuoco - .2) return; E.ducka(-12, 1.8); return vai("fuoco", { riv: .5 }); }
    if (tipo === "tosse") { if (dt < TW.colpo) return; return vai("tosse"); }
    if (tipo === "evviva") { if (vicinoFinale()) return; return vai("evviva", { vol: .8 }); }
    return dragoPrimaSuoni(tipo);
  };
  const ruggitoPrima = suonoRuggito, romboPrima = suonoRombo, inspiraPrima = suonoInspira;
  suonoRuggito = function () { if (!SUONO.on || !ac()) return; mix(); E.ducka(-14, 2.6); if (!E.suona("ruggito", { riv: .6 })) ruggitoPrima(); };
  suonoRombo = function () { if (!SUONO.on || !ac()) return; mix(); E.ducka(-6, 1.2); if (!E.suona("rombo", { riv: .4 })) romboPrima(); };
  suonoInspira = function () { if (!SUONO.on || !ac()) return; mix(); if (!E.suona("inspira")) inspiraPrima(); };

  // ── avventura ──
  if (typeof suonoAvv === "function") {
    const avvPrima = suonoAvv;
    suonoAvv = function (tipo) {
      if (!SUONO.on || !ac()) return; mix();
      if (["uovo", "bivio", "bottega", "compra", "ninna", "scudo", "torcia"].includes(tipo) && E.suona(tipo, tipo === "ninna" ? { riv: .5 } : null)) return;
      avvPrima(tipo);
    };
  }

  // ── tasti: AVANTI grave, TORNA SU piu' acuto; tocchi dell'interfaccia ──
  const mandaPrimaSuoni = manda;
  manda = function (a) { if (SUONO.on && ac()) { mix(); E.suona(a === "risali" ? "tasto_su" : "tasto_giu"); } mandaPrimaSuoni(a); };
  document.addEventListener("click", (ev) => {
    if (!SUONO.on || !SUONO.ctx) return;
    const b = ev.target.closest && ev.target.closest("button"); if (!b || b.id === "b-giu" || b.id === "b-risali" || b.id === "b-audio") return;
    E.suona("ui", { vol: .8 });
  }, true);

  // ── gli ultimi 3 secondi: tic (l'ultimo piu' acuto), solo se sei dentro e la scelta e' aperta ──
  let ultimoNum = "";
  const orologioPrimaSuoni = orologio;
  orologio = function () {
    orologioPrimaSuoni();
    if (!SUONO.on || !SUONO.ctx || typeof V === "undefined" || !V) return;
    const n = (document.getElementById("a-num") || {}).textContent || "";
    if (n !== ultimoNum) {
      ultimoNum = n; const me = V.giocatori[V.io] || {}, k = +n;
      if (V.fase === "scelta" && !V.fine && me.dentro && k >= 1 && k <= 3) E.suona("tic", { rate: k === 1 ? 1.25 : 1, vol: k === 1 ? 1 : .75 });
    }
  };

  // ── eventi: tensione della musica, risalita, spareggio ──
  const eventoPrimaSuoni = evento;
  evento = function (e, anima) {
    eventoPrimaSuoni(e, anima);
    if (!anima || !SUONO.on || !SUONO.ctx) return;
    if (e.k === "uscite" && e.risali && e.risali.length) dopo(.75, () => E.suona("risalita", { vol: .9 }));
    if (e.k === "spareggio" || e.k === "spareggio_pari") { E.ducka(-8, 2); E.suona("spareggio"); }
  };
  setInterval(() => { if (typeof V !== "undefined" && V) E.tensione = Math.min(1, (V.rischio || 0) * 1.5 + Object.keys(V.visti || {}).length * .15); }, 1000);

  // ── la fine: vittoria o sconfitta (al posto della reliquia + evviva di prima) ──
  const finalePrimaSuoni = finale;
  finale = function (msg) {
    E.finaleT = performance.now() / 1000;
    finalePrimaSuoni(msg);
    try {
      if (!SUONO.on || !SUONO.ctx || AUTO) return;
      const vinto = V && msg.extra && msg.extra.gruppi && msg.extra.gruppi[0].includes(V.io);
      E.ducka(-10, 3.5); setTimeout(() => E.suona(vinto ? "vittoria" : "sconfitta"), 250);
    } catch (e) { }
  };
})();
