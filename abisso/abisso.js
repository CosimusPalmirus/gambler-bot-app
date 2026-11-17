// ABISSO - client v3 «rifinitura» (16/11/2026). Solo vista: il server decide tutto.
// Riceve {t:"info"}, {t:"snap", s}, {t:"fine"}; manda {a:"giu"|"risali"}.
"use strict";
const Q = new URLSearchParams(location.search);
const AUTO = Q.get("auto") === "1";
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COLORI = ["lavanda", "mandarino", "menta", "corallo", "cielo", "girasole", "rubino", "perla"];
const TINTE = ["#b3a6ff", "#ff9a52", "#58d6a8", "#ff6f7d", "#59b6ff", "#ffd24a", "#ff4f7b", "#eceaf6"];
const PERICOLI = ["SBADIGLIO", "STARNUTO", "CODA", "RUSSATA", "ARTIGLIO"];
const NOMI_PER = { it: { SBADIGLIO: "SBADIGLIO", STARNUTO: "STARNUTO", CODA: "CODA", RUSSATA: "RUSSATA", ARTIGLIO: "ARTIGLIO" }, en: { SBADIGLIO: "YAWN", STARNUTO: "SNEEZE", CODA: "TAIL", RUSSATA: "SNORE", ARTIGLIO: "CLAW" } };
const NP = (h) => NOMI_PER[LINGUA][h] || h;
const $ = (id) => document.getElementById(id);
let LINGUA = (Q.get("lang") || (navigator.language || "it")).slice(0, 2) === "en" ? "en" : "it";
const TXT = {
  it: { logo: "NON SVEGLIARE IL DRAGO", resta: "Avanti", risali: "Torna su", disastro: "Risveglio", mazzo: "Mazzo pubblico", diario: "Diario", firma: "Firma del seme",
    sommozzatori: "Ladri", spedizione: "Spedizione", chi: "Chi torna su?", restano: (n) => "restano " + n, tutti: "Tutti vanno avanti",
    gratis: "Gratis", allen: "Allenamento", soldi: "A soldi", gioc: "giocatori", piatto: "Piatto", perle: "monete", perla: "moneta",
    avviso: (h) => "un altro " + NP(h) + " e si sveglia", primo: "il drago si agita", dis: "IL DRAGO SI SVEGLIA!", persi: "chi è sul sentiero scappa e perde l'oro",
    rel: "RELIQUIA", relsub: "la prende solo chi torna su DA SOLO", solo: "Solo tu! Reliquia", risale: " torna su", risalgono: " tornano su",
    testa: "a testa", inCassa: "in cassaforte", tu: "Tu", fineSp: "Fine spedizione", vinto: "Hai vinto!", finita: "Partita finita",
    pari: "Pari al primo posto: il premio si divide.", monte: "Montepremi", rigioca: "Rigioca", scegli: "Avanti o torni su? Nessuno vede la tua scelta",
    scelto: "Scelta fatta · si girano tutte insieme", su: "Sei al campo: guardi chi va avanti", tesori: "Oro (tesori)", reliquie: "Reliquie",
    gia: "si è già agitato!", tutteSu: "Tutti al campo.", crollata: "Il drago si è svegliato: chi era sul sentiero ha perso l'oro.", dorme: "Il drago dorme", agita: "Il drago si agita", sveglio: "IL DRAGO È SVEGLIO" },
  en: { logo: "DON'T WAKE THE DRAGON", resta: "Go on", risali: "Go back", disastro: "Wake-up", mazzo: "Public deck", diario: "Log", firma: "Seed hash",
    sommozzatori: "Thieves", spedizione: "Expedition", chi: "Who goes back?", restano: (n) => n + " stay here", tutti: "Everyone goes on",
    gratis: "Free", allen: "Practice", soldi: "Real money", gioc: "players", piatto: "Pot", perle: "coins", perla: "coin",
    avviso: (h) => "one more " + NP(h) + " and it wakes", primo: "the dragon stirs", dis: "THE DRAGON WAKES!", persi: "everyone on the path flees and drops their gold",
    rel: "RELIC", relsub: "only a thief going back ALONE takes it", solo: "Only you! Relic", risale: " goes back", risalgono: " go back",
    testa: "each", inCassa: "banked", tu: "You", fineSp: "End of expedition", vinto: "You won!", finita: "Game over",
    pari: "Tie for first: the prize is split.", monte: "Prize pool", rigioca: "Play again", scegli: "Go on or go back? Nobody sees your choice",
    scelto: "Choice locked · all revealed together", su: "You're at camp: watch who goes on", tesori: "Gold (treasure)", reliquie: "Relics",
    gia: "already stirred!", tutteSu: "Everyone at camp.", crollata: "The dragon woke up: thieves on the path lost their gold.", dorme: "The dragon sleeps", agita: "The dragon stirs", sveglio: "THE DRAGON IS AWAKE" },
};
const t_ = (k, ...a) => { const v = TXT[LINGUA][k]; return typeof v === "function" ? v(...a) : v; };
function traduci() { document.querySelectorAll("[data-t]").forEach((e) => (e.textContent = t_(e.dataset.t))); $("b-lingua").textContent = LINGUA === "it" ? "EN" : "IT"; document.documentElement.lang = LINGUA; }

const CODA = [];
let META = null, INFO = null, V = null, FOTO = [], ws = null, snapT = 0, pronto = false;
const IMG = {}, SPR = new Map();
function carica(src) { return new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }); }
// FOTO_VERE_1711: la foto profilo vera, in CORS (la tela non si sporca: pixel.js ne legge i pixel); 3 s al massimo, poi colore
function caricaFoto(src) {
  return new Promise((ok) => {
    let fatto = false; const fine = (v) => { if (!fatto) { fatto = true; ok(v); } };
    if (!/^(https:\/\/|\/)/.test(String(src || ""))) return fine(null);
    const i = new Image(); i.crossOrigin = "anonymous"; i.referrerPolicy = "no-referrer";
    i.onload = () => fine(i.naturalWidth ? i : null); i.onerror = () => fine(null); setTimeout(() => fine(null), 3000); i.src = src;
  });
}
// a ogni partita nuova i seggi cambiano persona: via i disegni in cache che contengono una faccia, i gettoni si ridisegnano
function fotoRinfresca() {
  try { if (typeof PIX !== "undefined" && PIX.cache) for (const k of [...PIX.cache.keys()]) if (/^(foto|bot|get)\|/.test(k)) PIX.cache.delete(k); } catch (e) {}
  document.querySelectorAll(".gioc[data-ok]").forEach((el) => { delete el.dataset.ok; });
}
async function caricaTutto() {
  META = await (await fetch("asset/meta.json")).json();
  const l = [];
  for (const c of COLORI) for (const p of META.pose) l.push(["bot_" + c + "_" + p, "asset/bot_" + c + "_" + p + ".webp"]);
  for (const p of META.pose) if (META.bot[p].visiera) l.push(["vis_" + p, "asset/visiera_" + p + ".png"]);
  for (const n of ["sbadiglio", "starnuto", "coda", "russata", "artiglio", "grotta", "campo", "drago1", "drago2", "drago3",
    "o_moneta", "o_mucchietto", "o_mucchio", "o_gemma", "o_calice", "o_corona", "o_forziere", "o_torcia", "piastra0", "piastra1", "piastra2", "piastra3"]) l.push([n, "asset/" + n + ".webp"]);
  await Promise.all(l.map(async ([k, s]) => { IMG[k] = await carica(s); }));
  // rocce in primo piano: sagome scure delle piastre
  for (let i = 0; i < 4; i++) { const p = IMG["piastra" + i]; if (!p) continue; const c = tela(p.width, p.height), x = c.getContext("2d"); x.drawImage(p, 0, 0); x.globalCompositeOperation = "source-atop"; x.fillStyle = "rgba(10,5,2,.88)"; x.fillRect(0, 0, c.width, c.height); IMG["roccia" + i] = c; }
}
function tela(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
function nome(sg) { return sg === (V && V.io) ? t_("tu") : (INFO && INFO.nomi[sg]) || "#" + (sg + 1); }
function copri(ctx, img, w, h) { const s = Math.max(w / img.width, h / img.height) * 1.08, iw = img.width * s, ih = img.height * s; ctx.drawImage(img, (w - iw) / 2, h * .5 - ih * .47, iw, ih); }
function ripiego(ctx, sg, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, TINTE[sg % 8]); g.addColorStop(1, "#140f26"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff"; ctx.font = "700 " + Math.round(h * .55) + "px -apple-system,Segoe UI,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(((INFO && INFO.nomi[sg]) || "?").slice(0, 1).toUpperCase(), w / 2, h * .54);
}
function vetro(ctx, w, h) {
  ctx.globalCompositeOperation = "source-atop";
  const r = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .28, w / 2, h / 2, Math.max(w, h) * .55); r.addColorStop(0, "rgba(0,0,0,0)"); r.addColorStop(1, "rgba(5,3,15,.7)"); ctx.fillStyle = r; ctx.fillRect(0, 0, w, h);
  const l = ctx.createRadialGradient(w * .38, h * .22, 1, w * .45, h * .3, w * .55); l.addColorStop(0, "rgba(255,255,255,.36)"); l.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = l; ctx.fillRect(0, 0, w, h * .6);
  ctx.globalCompositeOperation = "source-over";
}
function sprite(sg, posa) {
  const k = sg + "|" + posa; if (SPR.has(k)) return SPR.get(k);
  const img = IMG["bot_" + COLORI[sg % 8] + "_" + posa], m = META.bot[posa]; if (!img) return null;
  const c = tela(m.w, m.h), x = c.getContext("2d"); x.drawImage(img, 0, 0, m.w, m.h);
  if (m.visiera && IMG["vis_" + posa]) {
    const [x0, y0, x1, y1] = m.visiera, w = x1 - x0 + 6, h = y1 - y0 + 6, o = tela(w, h), oc = o.getContext("2d");
    if (FOTO[sg]) copri(oc, FOTO[sg], w, h); else ripiego(oc, sg, w, h);
    vetro(oc, w, h); oc.globalCompositeOperation = "destination-in"; oc.drawImage(IMG["vis_" + posa], x0 - 3, y0 - 3, w, h, 0, 0, w, h);
    x.drawImage(o, x0 - 3, y0 - 3);
  }
  SPR.set(k, c); return c;
}
function gettone(sg, d) {
  const k = "g|" + sg + "|" + d; if (SPR.has(k)) return SPR.get(k);
  const c = tela(d, d), x = c.getContext("2d"), r = d / 2;
  x.fillStyle = TINTE[sg % 8]; x.beginPath(); x.arc(r, r, r, 0, 7); x.fill();
  x.fillStyle = "#b8925a"; x.beginPath(); x.arc(r, r, r * .87, 0, 7); x.fill();
  const o = tela(d, d), oc = o.getContext("2d"); if (FOTO[sg]) copri(oc, FOTO[sg], d, d); else ripiego(oc, sg, d, d);
  vetro(oc, d, d); oc.globalCompositeOperation = "destination-in"; oc.fillStyle = "#000"; oc.beginPath(); oc.arc(r, r, r * .78, 0, 7); oc.fill();
  x.drawImage(o, 0, 0); SPR.set(k, c); return c;
}
function gemmaTinta(col) {   // perla col bagliore del colore del giocatore (pre-disegnata: niente filtri al volo)
  const k = "gem|" + col; if (SPR.has(k)) return SPR.get(k);
  const c = tela(64, 64), x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, col); g.addColorStop(.45, col + "88"); g.addColorStop(1, col + "00"); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  if (IMG.o_moneta) x.drawImage(IMG.o_moneta, 15, 15, 34, 34);
  SPR.set(k, c); return c;
}

// ── audio sintetizzato ───────────────────────────────────────────────────
const SUONO = { ctx: null, on: !AUTO, battito: 0 };
function ac() { if (!SUONO.on) return null; if (!SUONO.ctx) { try { SUONO.ctx = new (window.AudioContext || window.webkitAudioContext)(); const c = SUONO.ctx, g = c.createGain(); g.gain.value = .02; g.connect(c.destination); for (const f of [55, 55.6, 82.4]) { const o = c.createOscillator(); o.frequency.value = f; o.connect(g); o.start(); } } catch (e) { return null; } } return SUONO.ctx; }
function rumore(c, d) { const b = c.createBuffer(1, c.sampleRate * d, c.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; }
function suona(tipo, forza = 1) {
  const c = ac(); if (!c) return; mix(); const t = c.currentTime, g = c.createGain(); g.connect(MIX.master || c.destination);
  const osc = (tp, f0, f1, d, v) => { const o = c.createOscillator(); o.type = tp; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); o.connect(g); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.start(t); o.stop(t + d + .05); };
  const filtrato = (tp, f, d, v) => { const n = rumore(c, d), fl = c.createBiquadFilter(); fl.type = tp; fl.frequency.value = f; n.connect(fl); fl.connect(g); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); n.start(t); };
  if (tipo === "passo") filtrato("lowpass", 380, .1, .1);
  else if (tipo === "battito") osc("sine", 72, 40, .18, .14 * forza);
  else if (tipo === "scricchiolio") filtrato("bandpass", 200 + Math.random() * 150, .5, .4 * forza);
  else if (tipo === "gemma") osc("triangle", 1300 + forza * 140, 2600, .16, .05);
  else if (tipo === "mucchio") osc("triangle", 660, 1320, .25, .1);
  else if (tipo === "pericolo") osc("sawtooth", 110, 55, .9, .15);
  else if (tipo === "svela") { filtrato("highpass", 1800, .35, .07); osc("sine", 300, 900, .3, .12); }
  else if (tipo === "crollo") { filtrato("lowpass", 260, 2.6, .7); const o = c.createOscillator(), v = c.createOscillator(), vg = c.createGain(), fl = c.createBiquadFilter(); o.type = "sawtooth"; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(48, t + 2); v.frequency.value = 7; vg.gain.value = 14; v.connect(vg); vg.connect(o.frequency); fl.type = "lowpass"; fl.frequency.value = 700; o.connect(fl); fl.connect(g); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.5, t + .15); g.gain.exponentialRampToValueAtTime(.001, t + 2.2); o.start(t); v.start(t); o.stop(t + 2.3); v.stop(t + 2.3); }
  else if (tipo === "reliquia") { osc("sine", 523, 1046, .6, .14); setTimeout(() => suona("gemma", 6), 120); }
  else if (tipo === "cassa") osc("square", 880, 1760, .08, .2);
  else if (tipo === "lampade") { filtrato("highpass", 3000, .08, .06); for (const fr of [392, 494, 587]) { const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = fr; o.connect(g); o.start(t); o.stop(t + .5); } g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.001, t + .5); }
}

// ── tempo simulato: rallentatore e "hit-stop" per il disastro ────────────
let SIM = 0, TS = 1, FERMO = 0, RALLENTA_FINO = 0, ultimoReal = performance.now();
const AGENDA = [];
function dopo(s, fn) { AGENDA.push({ t: SIM + (RM ? Math.min(s, .05) : s), fn }); }
function avanza() {
  const ora = performance.now(), dt = Math.min(.05, (ora - ultimoReal) / 1000); ultimoReal = ora;
  if (FERMO > 0) { FERMO -= dt; return 0; }
  TS = SIM < RALLENTA_FINO ? .35 : Math.min(1, TS + dt * 2);
  SIM += dt * TS;
  for (let i = AGENDA.length - 1; i >= 0; i--) if (SIM >= AGENDA[i].t) { const a = AGENDA.splice(i, 1)[0]; try { a.fn(); } catch (e) { console.warn(e); } }
  return dt;
}

const VIGNETTA = { c: null };
function bagliore(rgb, a) {   // bagliore radiale pre-disegnato: niente gradienti a ogni fotogramma
  const k = "b|" + rgb + "|" + a; if (SPR.has(k)) return SPR.get(k);
  const c = tela(128, 128), x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 1, 64, 64, 64);
  g.addColorStop(0, "rgba(" + rgb + "," + a + ")"); g.addColorStop(1, "rgba(" + rgb + ",0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  SPR.set(k, c); return c;
}
// ── il mondo ─────────────────────────────────────────────────────────────
const cv = $("scena"), cx = cv.getContext("2d");
function ridimensiona() { const r = cv.getBoundingClientRect(), d = S && S.bassa ? 1 : Math.min(r.width < 600 ? 1.5 : 2, devicePixelRatio || 1); VIGNETTA.c = null; cv.width = Math.max(10, Math.round(r.width * d)); cv.height = Math.max(10, Math.round(r.height * d)); }
addEventListener("resize", () => ridimensiona()); if (window.ResizeObserver) new ResizeObserver(() => ridimensiona()).observe(cv);
const S = {
  gruppo: -1, da: -1, passoT0: -9, cam: 0, camV: 0, scossa: 0, lampo: 0, lampoCol: "255,80,70",
  rivela: null, mucchi: [], gemme: [], schegge: [], scritte: [], risalgono: [], cadono: [], crollo: null, frane: [], fumi: [],
  hop: {}, creature: {}, particelle: [], meduse: [], reveal: -9, sospeso: false, raggi: {}, reliquieSp: {},
};
const MOSTRA = {};          // contatori mostrati (sacco/cassa) - si aggiornano quando l'animazione arriva
const ATTESA = {};          // animazioni ancora in volo per seggio
function geo() {
  const W = cv.width, H = cv.height, port = H > W * .9;
  const T = port ? Math.min(W * .5, H * .36) : Math.min(W * .3, H * .5);
  return { W, H, T, passo: T * (port ? .86 : .76), port };
}
function posT(i, g) { const amp = g.port ? g.W * .18 : g.W * .16; return { x: g.W / 2 + (i < 0 ? 0 : Math.sin(i * 1.15 + .4) * amp), y: (i + 1) * g.passo + g.H * .3 }; }
const lerp = (a, b, t) => a + (b - a) * t, ease = (t) => (t = Math.max(0, Math.min(1, t)), t * t * (3 - 2 * t));
const molla = (t) => { t = Math.max(0, Math.min(1, t)); return 1 - Math.cos(t * Math.PI * 2.5) * Math.exp(-t * 6); };
function preparaMare() {
  for (let i = 0; i < 110; i++) S.particelle.push({ x: Math.random(), y: Math.random(), z: .3 + Math.random() * .9 });
  for (let i = 0; i < 5; i++) S.meduse.push({ k: i % Math.max(1, META.meduse || 1), x: Math.random(), y: Math.random() * 3, f: Math.random() * 6, sc: .09 + Math.random() * .09 });
}
function nelGruppo() {   // chi e' ancora sul sentiero (e non sta risalendo o cadendo)
  if (!V) return [];
  return V.giocatori.filter((p) => (p.dentro || S.tenuti.has(p.sg)) && !S.risalgono.some((r) => r.sg === p.sg) && !S.cadono.some((r) => r.sg === p.sg)).map((p) => p.sg);
}
S.tenuti = new Set();          // seggi da tenere in scena finche' non parte la loro animazione
function posBot(sg, g, gx, gy) {
  const gr = nelGruppo(), k = gr.length, j = Math.max(0, gr.indexOf(sg)), rig = k > 4 ? 2 : 1, per = Math.ceil(k / rig);
  const r = Math.floor(j / per), c = j % per, nr = r === rig - 1 ? k - per * (rig - 1) : per, bh = g.T * (k > 5 ? .44 : .52);
  return { x: gx + (c - (nr - 1) / 2) * bh * .62 + (rig === 2 && r ? bh * .3 : 0), y: gy + g.T * .1 + (rig === 2 ? (r ? g.T * .1 : -g.T * .06) : 0), bh };
}
function centroGruppo(g) {
  const kp = ease((SIM - S.passoT0) / .8), a = posT(S.da, g), b = posT(S.gruppo, g);
  return { gx: lerp(a.x, b.x, kp), gy: lerp(a.y, b.y, kp), kp, a, b };
}
function puntoDi(sg) { return () => { const g = geo(), { gx, gy } = centroGruppo(g), p = posBot(sg, g, gx, gy); return { x: p.x, y: p.y - p.bh * .6 }; }; }
function puntoTessera(i, dy = 0) { return () => { const g = geo(), p = posT(i, g); return { x: p.x, y: p.y - g.T * (.12 + dy) }; }; }

function disegna() {
  requestAnimationFrame(disegna);
  if (!META) return;
  const dtr = avanza(), g = geo(), { W, H, T } = g, t = SIM;
  // qualita' adattiva: se il telefono fatica (fotogrammi > 24 ms per un po'), si alleggerisce da solo
  if (dtr > 0) { S.medDt = (S.medDt || .016) * .97 + dtr * .03; if (!S.bassa && SIM > 4 && S.medDt > .024) { S.bassa = true; ridimensiona(); } }
  const { gx, gy, kp, a, b } = centroGruppo(g);
  // camera: molla smorzata verso il gruppo (carrello che scende)
  if (performance.now() - (S.rotella || 0) > 3500) S.camOff = (S.camOff || 0) * .95;   // dopo 3,5 s torna sul gruppo
  const meta = gy - H * (g.port ? .55 : .58) + (S.camOff || 0);
  if (RM) S.cam = meta; else { S.camV += (meta - S.cam) * .012; S.camV *= .86; S.cam += S.camV; }
  S.scossa *= .9; S.lampo *= .92;
  const f = Math.min(1, Math.max(0, S.gruppo + kp) / 14);
  const sx = RM ? 0 : (Math.random() - .5) * S.scossa * 18, sy = RM ? 0 : (Math.random() - .5) * S.scossa * 18;
  cx.save(); cx.translate(sx, sy);
  cx.fillStyle = "#000"; cx.fillRect(-20, -20, W + 40, H + 40);
  // 1. lontano: il fosso (parallasse .35)
  const fo = IMG.grotta;
  if (fo) {
    const s = W / fo.width, fh = fo.height * s, off = ((S.cam * .35) % (fh * 2) + fh * 2) % (fh * 2);
    cx.globalAlpha = .9 - .4 * f;
    for (let y = -off - fh; y < H + fh; y += fh) { const k = Math.round((y + off) / fh); cx.save(); if (k % 2) { cx.translate(0, y + fh); cx.scale(1, -1); cx.drawImage(fo, 0, 0, W, fh); } else cx.drawImage(fo, 0, y, W, fh); cx.restore(); }
    cx.globalAlpha = 1;
  }
  const lg = cx.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, "rgba(120,60,10," + (.18 * (1 - f)) + ")"); lg.addColorStop(1, "rgba(0,0,0,.45)"); cx.fillStyle = lg; cx.fillRect(0, 0, W, H);
  for (const p of (S.bassa ? S.particelle.slice(0, 50) : S.particelle)) { p.y -= .0005 * p.z * TS; if (p.y < 0) p.y = 1; cx.fillStyle = "rgba(255," + Math.round(150 + 60 * p.z) + ",80," + (.12 + .35 * p.z * (.6 + .4 * Math.sin(t * 3 + p.x * 20))) + ")"; const r = p.z * (W / 700 + .8); cx.fillRect(p.x * W, ((p.y * H - S.cam * .15 * p.z) % H + H) % H, r, r); }
  cx.globalCompositeOperation = "screen";
  // luci delle torce che tremolano ai lati
  for (let k = 0; k < 3; k++) { const x = k % 2 ? W * .02 : W * .98, y = ((H * (.2 + k * .35) - S.cam * .6) % (H * 1.2) + H * 1.2) % (H * 1.2) - H * .1, r = W * (.35 + .03 * Math.sin(t * 9 + k * 2)); cx.globalAlpha = .9; cx.drawImage(bagliore("255,150,60", .28), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }
  // 2. il DRAGO in fondo al sentiero: piu' si scende piu' e' vicino; si agita a ogni segno
  const risc = V ? V.rischio : 0;
  dragoDisegna(g, t, f);
  if (0) Object.entries(S.creature).forEach(([h, c], i) => {
    const im = IMG[h.toLowerCase()]; if (!im) return;
    const ent = ease((t - c.t0) / 1.3), lato = c.lato, s = H * (.5 + .25 * risc) * (1 + .03 * Math.sin(t * 1.3 + i)) / im.height;
    const vic = (.1 + risc * 1.1) * ent, w = im.width * s, x = lato < 0 ? -w * (1 - vic * .45) + w * .35 * ent : W - w * (vic * .45) - w * .35 * ent + w * .3;
    cx.globalAlpha = .75 * ent * (c.via ? Math.max(0, 1 - (t - c.via) * 2) : 1);
    cx.save(); cx.translate(x + w / 2, H * (.3 + .2 * (i % 2)) + Math.sin(t * .9 + i) * 12); cx.rotate(Math.sin(t * .7 + i) * .05 * lato); if (lato > 0) cx.scale(-1, 1);
    cx.drawImage(im, -w / 2, -im.height * s / 2, w, im.height * s); cx.restore();
  });
  cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
  // 3. medio: sentiero, tessere, bot (coordinate del mondo)
  cx.save(); const Z = S.zoom || 1; if (Z !== 1) { cx.translate(W / 2, H / 2); cx.scale(Z, Z); cx.translate(-W / 2, -H / 2); } cx.translate(0, -S.cam);
  const base = posT(-1, g);
  if (IMG.campo) { const s = T * 1.3 / IMG.campo.width; cx.drawImage(IMG.campo, base.x - IMG.campo.width * s / 2, base.y - IMG.campo.height * s * .8, IMG.campo.width * s, IMG.campo.height * s); }
  const n = V ? V.strada.length : 0;
  cx.fillStyle = "rgba(255,200,110,.35)";
  for (let i = -1; i < n; i++) { const p0 = posT(i, g), p1 = posT(i + 1, g); for (let k = 1; k < 6; k++) { const q = k / 6; cx.beginPath(); cx.arc(lerp(p0.x, p1.x, q), lerp(p0.y, p1.y, q), T * .011, 0, 7); cx.fill(); } }
  for (let i = 0; i <= n; i++) {
    const p = posT(i, g), im = IMG["piastra" + (i % 4)], c = V && V.strada[i];
    if (S.crollo && i === S.crollo.i && t > S.crollo.t0) { franaDisegna(i, p, g, t); continue; }
    if (im) { cx.globalAlpha = i === n ? .3 : 1; const s = T / im.width; cx.drawImage(im, p.x - T / 2, p.y - im.height * s * .45, T, im.height * s); cx.globalAlpha = 1; }
    if (!c) continue;
    if (!(S.rivela && S.rivela.i === i && t - S.rivela.t0 < 1.5)) cartaPiccola(c, p.x + T * .32, p.y - T * .3, T * .19);
    if (c.t === "forziere" && (c.preso === null || c.preso === undefined)) reliquiaDisegna(p, g, t, c.v);
  }
  // i bot ancora giu'
  const gr = nelGruppo(), cammina = t - S.passoT0 < .8;
  const lungh = Math.hypot(b.x - a.x, b.y - a.y);
  for (const sg of gr) {
    const p = V.giocatori[sg], q = posBot(sg, g, gx, gy), bh = q.bh;
    let posa = posaDi(p), salto = 0;
    if (cammina) posa = (Math.floor((kp * lungh) / (bh * .32) + sg) % 2) ? "cammina1" : "cammina2";
    if (S.hop[sg] && t - S.hop[sg] < .45) { const e = (t - S.hop[sg]) / .45; salto = Math.sin(e * Math.PI) * bh * .18; posa = "festa"; }
    const sp = sprite(sg, posa); if (!sp) continue;
    const s = bh / sp.height, sq = salto ? 1 + Math.sin((t - S.hop[sg]) / .45 * Math.PI * 2) * .05 : 1;
    if (sg === V.io) { cx.fillStyle = "rgba(86,227,255,.22)"; cx.beginPath(); cx.ellipse(q.x, q.y, bh * .34, bh * .09, 0, 0, 7); cx.fill(); }
    cx.save(); cx.translate(q.x, q.y - salto); if (cammina && b.x < a.x) cx.scale(-1, 1); cx.scale(1 / sq, sq);
    cx.drawImage(sp, -sp.width * s / 2, -bh, sp.width * s, bh); cx.restore();
    // lampada: alla rivelazione si accende di colpo (chi resta)
    if (t - S.reveal < .6) { const e = (t - S.reveal) / .6; cx.strokeStyle = "rgba(140,245,255," + (1 - e) + ")"; cx.lineWidth = T * .018; cx.beginPath(); cx.arc(q.x, q.y - bh * .6, bh * (.4 + e * .4), 0, 7); cx.stroke(); }
    const mostra = (MOSTRA[sg] || {}).sacco || 0;
    if (mostra > 0) sacchetto(q.x + bh * .3, q.y - bh * 1.02, mostra, T, TINTE[sg % 8]);
  }
  // i mucchi di perle: davanti ai bot (quello che salta su sopra il gruppo e i resti sul bordo delle tessere)
  for (const m of S.mucchi) mucchioDisegna(m, g, t);
  // chi risale
  for (const r of S.risalgono) {
    const e = (t - r.t0) / r.dur; if (e < 0) { continue; }
    const pos = lerp(r.da, -1, ease(e)), i0 = Math.floor(pos), q = pos - i0, p0 = posT(i0, g), p1 = posT(i0 + 1, g), bh = T * .46;
    const x = lerp(p0.x, p1.x, q) + r.dx * bh * .5, y = lerp(p0.y, p1.y, q) + T * .08;
    r.pos = { x, y: y - bh * .6 };
    const sp = sprite(r.sg, (Math.floor(e * r.dur * 6) % 2) ? "schiena1" : "schiena2"); if (!sp) continue;
    const s = bh / sp.height; cx.globalAlpha = Math.min(1, (1 - e) * 5);
    cx.drawImage(sp, x - sp.width * s / 2, y - bh, sp.width * s, bh); cx.globalAlpha = 1;
    if ((MOSTRA[r.sg] || {}).sacco) sacchetto(x + bh * .3, y - bh * 1.02, MOSTRA[r.sg].sacco, T, TINTE[r.sg % 8]);
  }
  S.risalgono = S.risalgono.filter((r) => t - r.t0 < r.dur + .3);
  // chi cade nel disastro
  for (const c of S.cadono) {
    const e = t - c.t0; if (e < 0) continue; const sp = sprite(c.sg, "cade"); if (!sp) continue;
    const bh = T * .48, s = bh / sp.height; cx.globalAlpha = Math.max(0, 1 - e / 2.4);
    cx.save(); cx.translate(c.x + c.vx * e, c.y + e * e * T * 1.5); cx.rotate(c.giro * e); cx.drawImage(sp, -sp.width * s / 2, -bh / 2, sp.width * s, bh); cx.restore(); cx.globalAlpha = 1;
  }
  S.cadono = S.cadono.filter((c) => t - c.t0 < 2.6);
  // la carta che sale dalla sabbia: anticipo, slancio, giro, assestamento
  if (S.rivela) cartaSale(g, t);
  // il disastro: la creatura piomba
  if (S.crollo) {
    const e = t - S.crollo.t0, im = IMG[S.crollo.tipo.toLowerCase()];
    if (0 && im && e > -.2 && e < 2.4) { const s = T * (1 + Math.min(1, (e + .2) * 2) * 1.3) / im.height; cx.globalCompositeOperation = "screen"; cx.globalAlpha = Math.max(0, 1 - Math.max(0, e - 1.6)); cx.drawImage(im, gx - im.width * s / 2, gy - im.height * s * .62, im.width * s, im.height * s); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over"; }
  }
  // perle in volo (scie nel colore del giocatore) e schegge del disastro
  gemmeDisegna(g, t);
  for (const sc of S.scritte) scrittaDisegna(sc, g, t);
  S.scritte = S.scritte.filter((s) => t - s.t0 < s.dur);
  cx.restore();
  // 4. primo piano: rocce scure (parallasse 1.35)
  for (let k = -2; k < (S.bassa ? -2 : 6); k++) {
    const yw = Math.floor(S.cam * 1.35 / (g.passo * 1.6) + k) * g.passo * 1.6, im = IMG["roccia" + ((k + 8) % 4)]; if (!im) continue;
    const ys = yw - S.cam * 1.35, lato = (Math.floor(yw / (g.passo * 1.6)) % 2) ? -1 : 1, w = T * 1.4, h = im.height * w / im.width;
    cx.drawImage(im, lato < 0 ? -w * .55 : W - w * .45, ys, w, h);
  }
  cx.restore();
  if (!VIGNETTA.c || VIGNETTA.c.width !== W || VIGNETTA.c.height !== H) { const c2 = tela(W, H), x2 = c2.getContext("2d"), vg = x2.createRadialGradient(W / 2, H * .55, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .8); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.85)"); x2.fillStyle = vg; x2.fillRect(0, 0, W, H); VIGNETTA.c = c2; }
  cx.globalAlpha = .6 + .4 * f; cx.drawImage(VIGNETTA.c, 0, 0); cx.globalAlpha = 1;
  if (S.lampo > .01) { cx.fillStyle = "rgba(" + S.lampoCol + "," + S.lampo * .5 + ")"; cx.fillRect(0, 0, W, H); }
  if (V && V.fase === "scelta" && V.rischio > 0 && SUONO.on) {
    const per = 1.1 - Math.min(.7, V.rischio * 1.6);
    if (performance.now() / 1000 - SUONO.battito > per) { SUONO.battito = performance.now() / 1000; suona("battito", .4 + V.rischio * 1.5); if (V.rischio > .15 && !RM) S.scossa = Math.max(S.scossa, V.rischio * .15); }
  }
  orologio();
}
function dragoDisegna(g, t, f) {
  cx.globalCompositeOperation = "source-over"; cx.globalAlpha = 1;
  const { W, H } = g, seg = V ? Object.keys(V.visti).length : 0, sveglio = S.crollo && t - S.crollo.t0 < 2.6 && t >= S.crollo.t0 - .2;
  const im = sveglio ? IMG.drago3 : seg ? IMG.drago2 : IMG.drago1; if (!im) return;
  const vicino = Math.min(1, Math.max(0, (S.gruppo + 1) / 12)) * .8 + seg * .06, resp = 1 + .018 * Math.sin(t * 1.1);
  const scuote = S.agita && t - S.agita < .6 ? Math.sin((t - S.agita) * 40) * .01 : 0;
  const w = W * (g.port ? 1.05 : .62) * (.75 + vicino * .55) * resp, h = im.height * w / im.width;
  const x = W / 2 - w / 2 + (g.port ? 0 : W * .02), y = H - h * (.62 + vicino * .25) + (sveglio ? -H * .05 : 0);
  cx.save(); cx.globalAlpha = .55 + .35 * Math.min(1, vicino + (sveglio ? 1 : 0));
  cx.translate(x + w / 2, y + h / 2); cx.rotate(scuote); cx.drawImage(im, -w / 2, -h / 2, w, h); cx.restore();
  // la pancia che brilla al ritmo del respiro
  const bx = x + w * .5, by = y + h * .62, br = w * (.18 + .03 * Math.sin(t * 1.1)) * (sveglio ? 1.8 : 1);
  cx.globalCompositeOperation = "lighter"; cx.globalAlpha = Math.min(1, (.25 + .1 * Math.sin(t * 1.1) + seg * .04) / .4); cx.drawImage(bagliore("255,130,30", .4), bx - br, by - br, br * 2, br * 2); cx.globalAlpha = 1;
  // il fumo dalle narici: di piu' a ogni segno
  if (!S.bassa && Math.random() < .02 + seg * .025) S.fumi.push({ x: x + w * .3 + Math.random() * w * .06, y: y + h * .48, t0: t, s: 1 + Math.random() });
  for (const q of S.fumi) { const e = t - q.t0, r = w * .025 * (1 + e) * q.s; cx.globalCompositeOperation = "source-over"; cx.globalAlpha = Math.max(0, 1 - e * .45); cx.drawImage(bagliore("160,150,140", .14), q.x - r, q.y - e * h * .15 - r, r * 2, r * 2); cx.globalAlpha = 1; }
  S.fumi = S.fumi.filter((q) => t - q.t0 < 2.5);
  // il risveglio: la fiammata che spazza il sentiero
  if (sveglio) {
    const e = t - S.crollo.t0, k = Math.min(1, Math.max(0, e) * 2.5), fx = x + w * .33, fy = y + h * .42;
    cx.globalCompositeOperation = "lighter";
    for (let j = 0; j < 4; j++) { const ang = -Math.PI / 2 - .35 + j * .23 + Math.sin(t * 13 + j) * .05, L = H * .9 * k; const fg2 = cx.createLinearGradient(fx, fy, fx + Math.cos(ang) * L, fy + Math.sin(ang) * L); fg2.addColorStop(0, "rgba(255,240,180," + (.55 * (1 - Math.max(0, e - 1.4))) + ")"); fg2.addColorStop(.5, "rgba(255,120,30," + (.4 * (1 - Math.max(0, e - 1.4))) + ")"); fg2.addColorStop(1, "rgba(255,60,0,0)"); cx.strokeStyle = fg2; cx.lineWidth = W * (.12 + .04 * j); cx.lineCap = "round"; cx.beginPath(); cx.moveTo(fx, fy); cx.lineTo(fx + Math.cos(ang) * L, fy + Math.sin(ang) * L); cx.stroke(); }
  }
  cx.globalCompositeOperation = "source-over";
}
function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
function artCarta(c) { if (c.t === "perla") return c.v >= 9 ? "o_mucchio" : "o_mucchietto"; if (c.t === "pericolo") return c.v.toLowerCase(); return c.v >= 10 ? "o_forziere" : "o_calice"; }
function nomeCarta(c) { return c.t === "pericolo" ? NP(c.v) : c.t === "forziere" ? t_("rel") : (LINGUA === "en" ? "GOLD" : "ORO"); }
function carta(c, x, y, w, h) {
  const bordo = c.t === "pericolo" ? "#ff5a4e" : c.t === "forziere" ? "#ffc85a" : "#b9a6ff";
  rr(x, y, w, h, w * .1); cx.fillStyle = "#07070c"; cx.fill();
  const im = IMG[artCarta(c)]; if (im) { cx.save(); rr(x, y, w, h, w * .1); cx.clip(); if (c.t === "pericolo") cx.drawImage(im, x - w * .2, y + h * .05, w * 1.4, w * 1.4); else { const k = Math.min(w * .9 / im.width, h * .6 / im.height); cx.drawImage(im, x + (w - im.width * k) / 2, y + h * .2, im.width * k, im.height * k); } cx.restore(); }
  cx.lineWidth = w * .04; cx.strokeStyle = bordo; rr(x, y, w, h, w * .1); cx.stroke();
  cx.fillStyle = "#fff"; cx.textAlign = "center"; cx.textBaseline = "middle";
  if (c.t === "perla" || c.t === "forziere") { cx.font = "800 " + Math.round(w * .3) + "px -apple-system,Segoe UI,sans-serif"; cx.fillText(c.v, x + w * .22, y + h * .14); }
  cx.font = "800 " + Math.round(w * .115) + "px -apple-system,Segoe UI,sans-serif"; cx.fillText(nomeCarta(c), x + w / 2, y + h * .9);
}
function dorso(x, y, w, h) { rr(x, y, w, h, w * .1); const gr = cx.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, "#5c2a12"); gr.addColorStop(1, "#1a0b05"); cx.fillStyle = gr; cx.fill(); cx.strokeStyle = "#b8925a"; cx.lineWidth = w * .035; cx.stroke(); }
function cartaPiccola(c, x, y, w) { carta(c, x - w / 2, y - w * .66, w, w * 1.33); }
function cartaSale(g, t) {
  const R = S.rivela, e = t - R.t0, p = posT(R.i, g); if (e < 0 || e > 1.7) return;
  const T = g.T, w = T * .62, h = w * 1.33;
  // anticipo (si abbassa), slancio con rimbalzo, giro, assestamento
  const dip = e < .12 ? Math.sin(e / .12 * Math.PI) * T * .05 : 0;
  const su = molla((e - .1) / .55), gira = ease((e - .3) / .35);
  const y = p.y - T * .2 - su * T * .55 + dip, scY = e < .12 ? .9 : (e < .5 ? 1.05 : 1);
  cx.globalCompositeOperation = "screen"; const rg = cx.createRadialGradient(p.x, y, 2, p.x, y, T * .95);
  rg.addColorStop(0, R.c.t === "pericolo" ? "rgba(255,80,70,.55)" : R.c.t === "forziere" ? "rgba(255,200,90,.6)" : "rgba(150,230,255,.5)"); rg.addColorStop(1, "rgba(0,0,0,0)");
  cx.fillStyle = rg; cx.fillRect(p.x - T, y - T, T * 2, T * 2); cx.globalCompositeOperation = "source-over";
  const fine = e > 1.3 ? ease((e - 1.3) / .4) : 0;
  cx.save(); cx.translate(lerp(p.x, p.x + T * .32, fine), lerp(y, p.y - T * .42, fine)); const sc = lerp(1, .31, fine);
  cx.scale(Math.max(.04, Math.abs(Math.cos((1 - gira) * Math.PI / 2))) * sc, scY * sc);
  if (gira < .5) dorso(-w / 2, -h / 2, w, h); else carta(R.c, -w / 2, -h / 2, w, h);
  cx.restore();
}
function testo(txt, x, y, px, col, fondo) {
  cx.font = "800 " + Math.round(px) + "px -apple-system,Segoe UI,sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
  if (fondo) { const w = cx.measureText(txt).width + px * .9; cx.fillStyle = "rgba(0,0,0,.62)"; rr(x - w / 2, y - px * .75, w, px * 1.5, px * .75); cx.fill(); }
  cx.lineWidth = px * .18; cx.strokeStyle = "rgba(0,0,0,.7)"; cx.strokeText(txt, x, y + 1); cx.fillStyle = col; cx.fillText(txt, x, y + 1);
}
function sacchetto(x, y, v, T, col) {
  const d = T * .1, im = gemmaTinta(col); cx.drawImage(im, x - d, y - d, d * 2, d * 2); testo(String(v), x + d * 1.05, y, T * .085, "#fff");
}
function mucchioDisegna(m, g, t) {
  const p = posT(m.i, g), e = t - m.t0; if (e < 0) return;
  const T = g.T; let sc = 1, x = p.x - T * .36, y = p.y + T * .1;
  if (m.grande) { const q = m.pos(); x = q.x; y = q.y; sc = molla(e / .45) * (1.5 - .35 * ease((e - .6) / .4)); }
  const v = m.val(); if (v <= 0) return;
  const im = v >= 4 ? IMG.o_mucchio : IMG.o_mucchietto, w = T * .3 * sc;
  if (im) { cx.globalCompositeOperation = "screen"; const rg = cx.createRadialGradient(x, y, 1, x, y, w); rg.addColorStop(0, "rgba(255,226,160,.45)"); rg.addColorStop(1, "rgba(0,0,0,0)"); cx.fillStyle = rg; cx.fillRect(x - w, y - w, w * 2, w * 2); cx.globalCompositeOperation = "source-over"; cx.drawImage(im, x - w / 2, y - im.height * w / im.width / 2, w, im.height * w / im.width); }
  if (m.grande) testo(String(v), x, y - T * .2 * sc, T * .17 * sc, "#ffe9b8");
  else testo(t_("restano", v), x, y - T * .14, T * .075, "#ffe2a0", true);
}
function reliquiaDisegna(p, g, t, v) {
  const T = g.T, x = p.x - T * .22, y = p.y - T * .14, ch = v >= 10 ? IMG.o_forziere : IMG.o_corona;
  cx.globalCompositeOperation = "lighter";
  for (let k = 0; k < 8; k++) { const a = t * .4 + k * Math.PI / 4; cx.fillStyle = "rgba(255,200,90,.07)"; cx.beginPath(); cx.moveTo(x, y); cx.arc(x, y, T * .55, a, a + .18); cx.fill(); }
  cx.globalCompositeOperation = "source-over";
  if (ch) { const w = T * .3; cx.drawImage(ch, x - w / 2, y - ch.height * w / ch.width / 2 + Math.sin(t * 2) * 2, w, ch.height * w / ch.width); }
  testo("★ " + v, x, y - T * .2, T * .08, "#ffd27a", true);
}
function franaDisegna(i, p, g, t) {
  const im = IMG["piastra" + (i % 4)]; if (!im) return; const T = g.T, e = t - S.crollo.t0, s = T / im.width, h = im.height * s;
  for (let k = 0; k < 4; k++) {   // quattro pezzi che si staccano e cadono nel buio
    const dx = (k % 2 ? 1 : -1) * e * T * .25, dy = e * e * T * (1 + k * .3), rot = (k % 2 ? 1 : -1) * e * (.6 + k * .2);
    cx.save(); cx.globalAlpha = Math.max(0, 1 - e / 2.2); cx.translate(p.x + dx + (k % 2 ? T * .25 : -T * .25), p.y + dy + (k < 2 ? -h * .2 : h * .1)); cx.rotate(rot);
    cx.beginPath(); cx.rect(k % 2 ? 0 : -T / 2, k < 2 ? -h / 2 : 0, T / 2, h / 2); cx.clip();
    cx.drawImage(im, -T / 2 - (k % 2 ? T * .25 : -T * .25) + (k % 2 ? 0 : 0), -h * .5, T, h); cx.restore();
  }
  cx.globalAlpha = 1;
}
function gemmeDisegna(g, t) {
  const T = g.T;
  for (const q of S.gemme) {
    const e = (t - q.t0) / q.dur; if (e < 0) continue;
    const da = q.da(), a = q.a(), k = ease(e), x = lerp(da.x, a.x, k), y = lerp(da.y, a.y, k) - Math.sin(Math.min(1, e) * Math.PI) * T * (q.arco || .5);
    q.scia = q.scia || []; q.scia.push([x, y]); if (q.scia.length > 7) q.scia.shift();
    cx.strokeStyle = q.col + "aa"; cx.lineWidth = T * .025 * (q.grande ? 1.4 : 1); cx.lineCap = "round"; cx.beginPath(); q.scia.forEach(([sx, sy], j) => (j ? cx.lineTo(sx, sy) : cx.moveTo(sx, sy))); cx.stroke();
    const d = T * (q.grande ? .085 : .065) * (1 + .25 * Math.sin(e * Math.PI)); cx.drawImage(gemmaTinta(q.col), x - d, y - d, d * 2, d * 2);
    if (e >= 1 && !q.fatto) { q.fatto = 1; q.arriva && q.arriva(); }
  }
  S.gemme = S.gemme.filter((q) => !q.fatto);
  for (const s of S.schegge) {   // disastro: le perle portate schizzano via e affondano
    const e = t - s.t0; if (e < 0) continue; s.vx *= .985; s.vy = s.vy * .985 + T * .02;
    s.x += s.vx * .016 * TS; s.y += s.vy * .016 * TS; const d = T * .05;
    cx.globalAlpha = Math.max(0, 1 - e / 2.2); cx.drawImage(gemmaTinta("#ffb020"), s.x - d, s.y - d, d * 2, d * 2);
  }
  cx.globalAlpha = 1; S.schegge = S.schegge.filter((s) => t - s.t0 < 2.3);
}
function scrittaDisegna(s, g, t) {
  const e = (t - s.t0) / s.dur; if (e < 0) return; const p = s.p(), k = Math.min(1, e * 4);
  cx.globalAlpha = e > .75 ? (1 - e) * 4 : 1; testo(s.txt, p.x, p.y - g.T * (.05 + e * .25), g.T * s.px * (.6 + .4 * molla(k)), s.col, s.fondo); cx.globalAlpha = 1;
}
function posaDi(p) {
  if (!V) return "attesa";
  if (V.fine) return V.fine.gruppi[0].includes(p.sg) ? "festa" : "attesa";
  if (p.sg === V.io && p.scelta === "giu") return "resta";
  if (V.rischio >= .2) return "paura";
  return "attesa";
}

// ── i contatori dei gettoni (sacco = portate e a rischio, cassa = al sicuro) ──
function contatore(sg, chi, delta, col, testoPiu) {
  MOSTRA[sg] = MOSTRA[sg] || { sacco: 0, cassa: 0 }; MOSTRA[sg][chi] = Math.max(0, MOSTRA[sg][chi] + delta);
  document.querySelectorAll('.gioc[data-sg="' + sg + '"]').forEach((el) => {
    const b = el.querySelector("." + chi + " b"); if (b) { b.textContent = MOSTRA[sg][chi]; b.classList.remove("num-pop"); void b.offsetWidth; b.classList.add("num-pop"); }
    el.querySelector("." + chi).classList.toggle("vuoto", !MOSTRA[sg][chi]);
    if (testoPiu) { const p = el.querySelector(".piu"); p.textContent = testoPiu; p.style.color = col; p.classList.remove("va"); void p.offsetWidth; p.classList.add("va"); el.classList.remove("preso"); void el.offsetWidth; el.classList.add("preso"); }
  });
}
function sincronizza() {   // i seggi senza animazioni in volo seguono il server
  if (!V) return;
  for (const p of V.giocatori) {
    if (ATTESA[p.sg] > 0) continue;
    MOSTRA[p.sg] = MOSTRA[p.sg] || { sacco: 0, cassa: 0 };
    if (MOSTRA[p.sg].sacco !== p.bottino || MOSTRA[p.sg].cassa !== p.cassa) { MOSTRA[p.sg].sacco = p.bottino; MOSTRA[p.sg].cassa = p.cassa; aggiornaGiocatori(); }
  }
}
const attendi = (sg, k) => { ATTESA[sg] = (ATTESA[sg] || 0) + k; };
const fatto = (sg) => { ATTESA[sg] = Math.max(0, (ATTESA[sg] || 0) - 1); if (!ATTESA[sg]) setTimeout(sincronizza, 50); };
function log(html) {
  $("riga-log").innerHTML = html;
  const d = $("diario"); if (d) { d.insertAdjacentHTML("afterbegin", "<div>" + html + "</div>"); while (d.children.length > 14) d.lastChild.remove(); }
}
const col = (sg) => TINTE[sg % 8];
const nomeCol = (sg) => '<b style="color:' + col(sg) + '">' + gl(sg) + " " + nome(sg) + "</b>";

// ── gli eventi del server diventano scene ────────────────────────────────
function annuncia(testo, sotto, ms, cls) {
  const a = $("annuncio"); a.className = cls || ""; a.innerHTML = testo + (sotto ? "<small>" + sotto + "</small>" : "");
  void a.offsetWidth; a.classList.add("su"); clearTimeout(annuncia.t); annuncia.t = setTimeout(() => a.classList.remove("su"), ms || 1600);
}
function evento(e, anima) { eventoBase(e, anima); try { polishEvento(e, anima); } catch (x) { console.warn(x); } }
function eventoBase(e, anima) {
  if (e.k === "discesa") {
    Object.assign(S, { gruppo: -1, da: -1, passoT0: -9, rivela: null, crollo: null, mucchi: [], gemme: [], schegge: [], risalgono: [], cadono: [], scritte: [], creature: {} });
    S.tenuti.clear(); S.inizioCassa = V ? V.giocatori.map((p) => p.cassa) : [];
    if (anima) annuncia(t_("spedizione") + " " + (e.d + 1) + " / " + e.D, e.forzieri.length ? t_("reliquie") + ": " + e.forzieri.map((v) => "★" + v).join(" ") : "", 2200);
    log(t_("spedizione") + " <b>" + (e.d + 1) + "/" + e.D + "</b>");
    document.querySelectorAll(".gioc").forEach((el) => el.classList.add("acceso"));
    return;
  }
  if (e.k === "carta") {
    const c = e.carta, i = e.prof - 1;
    S.da = S.gruppo; S.gruppo = i; S.passoT0 = SIM;
    if (!anima) { if (c.t === "pericolo" && !S.creature[c.v]) S.creature[c.v] = { t0: SIM - 9, lato: Object.keys(S.creature).length % 2 ? 1 : -1 }; return; }
    for (let k = 0; k < 3; k++) dopo(k * .26, () => suona("passo"));
    S.rivela = { i, c, t0: SIM + .8 }; dopo(.85, () => suona("svela"));
    const div = Object.entries(e.div).map(([s, q]) => [+s, q]);
    if (c.t === "perla") {
      // 1. il mucchio salta su col suo numero; 2. si divide: un flusso per giocatore, uno alla volta
      const sopra = () => { const g = geo(), { gx, gy } = centroGruppo(g); return { x: gx, y: gy - g.T * (nelGruppo().length > 4 ? .88 : .76) }; };
      const m = { i, t0: SIM + 1.55, grande: true, rest: c.v, val: () => m.rest, pos: sopra }; S.mucchi.push(m);
      dopo(1.55, () => suona("mucchio"));
      const ordine = div.filter(([s]) => s !== V.io).concat(div.filter(([s]) => s === V.io));
      // 17/11 polish: la parte di ognuno UNA volta sopra il mucchio («+3 A TESTA»), non un numero su ogni ladro (si coprivano)
      if (ordine.length > 1) dopo(2.05, () => S.scritte.push({ txt: "+" + ordine[0][1] + (LINGUA === "it" ? " A TESTA" : " EACH"), col: "#ffe2a0", p: () => { const q = sopra(); return { x: q.x, y: q.y - 12 }; }, t0: SIM, dur: 1.8, px: .14 }));
      ordine.forEach(([sg, q], j) => {
        attendi(sg, 1); storia(sg, "+" + q + " " + t_("perle") + " (" + c.v + " / " + div.length + ")");
        const io = sg === V.io, t0 = 2.05 + j * .15, n = Math.min(q, 6);
        dopo(t0, () => { m.rest -= q; });
        for (let k = 0; k < n; k++) S.gemme.push({ col: col(sg), grande: io, da: sopra, a: puntoDi(sg), t0: SIM + t0 + k * .05, dur: io ? .8 : .6, arco: .25,
          arriva: k === n - 1 ? () => { S.hop[sg] = SIM; suona("gemma", j); contatore(sg, "sacco", q, col(sg), "+" + q); if (io || ordine.length === 1) S.scritte.push({ txt: gl(sg) + " +" + q, col: col(sg), p: puntoDi(sg), t0: SIM, dur: io ? 1.6 : 1.2, px: io ? .26 : .18 }); fatto(sg); } : null });
        if (!n) dopo(t0, () => fatto(sg));
      });
      const fineDiv = 2.05 + ordine.length * .15 + .6;
      dopo(fineDiv - .3, () => { if (e.resto) for (let k = 0; k < Math.min(e.resto, 4); k++) S.gemme.push({ col: "#ffe2a0", da: sopra, a: () => { const g = geo(), p = posT(i, g); return { x: p.x - g.T * .36, y: p.y + g.T * .1 }; }, t0: SIM + k * .06, dur: .45, arco: .1 }); });
      dopo(fineDiv, () => { m.grande = false;  S.mucchi = S.mucchi.filter((x) => x !== m); S.mucchi.push({ i, t0: SIM, val: () => (V && V.strada[i] ? V.strada[i].resto || 0 : 0) }); });
      log(div.map(([s, q]) => nomeCol(s) + " +" + q).join(" · ") + (e.resto ? " · " + t_("restano", "<b>" + e.resto + "</b>") : ""));
    } else if (c.t === "pericolo") {
      dopo(.95, () => suona("pericolo"));
      if (!e.crollo) {
        dopo(1.0, () => { S.creature[c.v] = { t0: SIM, lato: Object.keys(S.creature).length % 2 ? 1 : -1 }; annuncia(NP(c.v), t_("primo") + " · " + t_("avviso", c.v), 2000, "rosso"); S.agita = SIM; S.fumo = (S.fumo || 0) + 1; });
        log('<b style="color:#ff8a80">' + NP(c.v) + "</b> · " + t_("primo"));
      } else {
        div.forEach(([sg, q]) => { attendi(sg, 1); S.tenuti.add(sg); storia(sg, t_("dis") + " " + c.v + " -" + (-q) + " " + t_("perle")); });
        dopo(1.15, () => {   // DISASTRO: fermo-immagine, rallentatore, scossa, la tessera frana, i bot cadono
          if (!RM) { FERMO = .14; RALLENTA_FINO = SIM + .9; }
          suona("crollo"); S.scossa = RM ? 0 : 1.6; S.lampo = 1; S.lampoCol = "255,70,60";
          S.crollo = { tipo: c.v, i, t0: SIM };
          const g = geo(), { gx, gy } = centroGruppo(g);
          const posti = div.map(([sg]) => posBot(sg, g, gx, gy));   // prima di toglierli dal gruppo: ognuno resta dove stava
          div.forEach(([sg, q], j) => {
            const p = posti[j];
            S.cadono.push({ sg, x: p.x, y: p.y - p.bh * .5, vx: (j % 2 ? 1 : -1) * g.T * (.1 + j * .05), t0: SIM + .15, giro: (Math.random() - .5) * 5 });
            const persi = -q;
            for (let k = 0; k < Math.min(persi, 8); k++) S.schegge.push({ x: p.x, y: p.y - p.bh * .8, vx: (Math.random() - .5) * g.T * 3, vy: -g.T * (1 + Math.random() * 1.5), t0: SIM });
            if (persi) S.scritte.push({ txt: "-" + persi, col: "#ff6b60", p: ((x, y) => () => ({ x, y }))(p.x, p.y - p.bh * 1.1), t0: SIM, dur: 1.8, px: .17 });
            contatore(sg, "sacco", -persi, "#ff6b60", persi ? "-" + persi : null); S.tenuti.delete(sg); fatto(sg);
          });
          annuncia(t_("dis"), NP(c.v) + " · " + t_("persi"), 2800, "rosso"); S.sveglio = SIM;
          document.querySelectorAll(".gioc").forEach((el) => { if (div.some(([s]) => +el.dataset.sg === s)) { el.classList.remove("acceso", "perso"); void el.offsetWidth; el.classList.add("perso"); } });
        });
        log('<b style="color:#ff8a80">' + t_("dis") + " " + NP(c.v) + "</b> · " + div.map(([s, q]) => nomeCol(s) + " " + (-q ? "-" + -q : "0")).join(" · "));
      }
    } else if (c.t === "forziere") {
      dopo(1.3, () => { suona("reliquia"); annuncia(t_("rel") + " ★" + c.v, t_("relsub"), 2200, "oro"); });
      log('<b style="color:#ffd27a">' + t_("rel") + " ★" + c.v + "</b>");
    }
    return;
  }
  if (e.k === "uscite") {
    if (!anima) return;
    const su = e.risali, tess = e.tessere || {};
    su.forEach((sg) => { attendi(sg, 1); S.tenuti.add(sg); storia(sg, t_("inCassa") + " +" + (e.cassa[sg] || 0) + (e.forzieri[sg] ? " (★" + e.forzieri[sg] + ")" : "")); });
    // la sospensione: «Chi risale?» … poi tutte le lampade scattano insieme
    $("chi-risale").textContent = t_("chi"); $("chi-risale").classList.add("su"); suona("battito", 1.2);
    dopo(.55, () => {
      $("chi-risale").classList.remove("su"); suona("lampade"); S.reveal = SIM;
      document.querySelectorAll(".gioc").forEach((el) => { const sg = +el.dataset.sg; if (su.includes(sg)) el.classList.remove("acceso"); });
      if (!su.length) { annuncia(t_("tutti"), "", 1300); return; }
      if (window.RITORNO_NUOVO) { annuncia(su.map(nome).join(", ") + (su.length === 1 ? t_("risale") : t_("risalgono")), "", 1400); su.forEach((sg) => fatto(sg)); return; }   // il ritorno lo anima ritorno.js
      const g = geo(), { gx, gy } = centroGruppo(g);
      su.forEach((sg, j) => {
        const dur = 1.3 + .2 * Math.max(0, S.gruppo);
        const r = { sg, da: S.gruppo, t0: SIM + .25, dur, dx: (j - (su.length - 1) / 2) * .5 }; S.risalgono.push(r); S.tenuti.delete(sg);
        // i resti di ogni tessera: divisi in parti uguali, volano a chi passa
        Object.entries(tess).forEach(([ti, tot]) => {
          const q = tot / su.length, quando = .25 + dur * Math.max(0, (S.gruppo - +ti)) / (S.gruppo + 1);
          for (let k = 0; k < Math.min(q, 4); k++) S.gemme.push({ col: col(sg), da: puntoTessera(+ti, .1), a: () => r.pos || puntoDi(sg)(), t0: SIM + quando + k * .05 + j * .1, dur: .5, arco: .3,
            arriva: k === Math.min(q, 4) - 1 ? () => { suona("gemma", 3); contatore(sg, "sacco", q, col(sg), "+" + q); } : null });
          if (j === 0) dopo(quando, () => { const resto = V && V.strada[+ti] ? V.strada[+ti].resto || 0 : 0; S.scritte.push({ txt: (tot + resto) + " ÷ " + su.length + " = " + q + " " + t_("testa") + (resto ? " · " + t_("restano", resto) : ""), col: "#ffe2a0", p: puntoTessera(+ti, .4), t0: SIM, dur: 1.8, px: .085, fondo: true }); });
        });
        if (e.forzieri[sg]) dopo(.3, () => {   // il momento d'oro: da solo, prende la reliquia
          suona("reliquia"); S.lampo = .7; S.lampoCol = "255,200,90";
          annuncia(t_("solo") + " +" + e.forzieri[sg], nome(sg), 2400, "oro");
          S.gemme.push({ col: "#ffc85a", grande: true, da: puntoTessera(S.gruppo, .1), a: () => r.pos || puntoDi(sg)(), t0: SIM, dur: 1, arco: .8, arriva: () => contatore(sg, "sacco", e.forzieri[sg], "#ffc85a", "★+" + e.forzieri[sg]) });
        });
        // in superficie: il sacchetto si svuota nella cassaforte
        dopo(.25 + dur, () => {
          const s0 = (MOSTRA[sg] || {}).sacco || 0, tot = e.cassa[sg] || 0;
          suona("cassa"); let k = 0; const passi = Math.max(1, Math.min(10, tot));
          const giro = setInterval(() => { k++; contatore(sg, "cassa", k === passi ? tot - Math.floor(tot / passi) * (passi - 1) : Math.floor(tot / passi), "#ffc85a", k === passi ? "+" + tot : null); contatore(sg, "sacco", -Math.min(MOSTRA[sg].sacco, Math.ceil(s0 / passi)), "#fff", null); if (k >= passi) { clearInterval(giro); fatto(sg); suona("cassa"); } }, RM ? 1 : 55);
        });
      });
      const extra = Object.keys(e.forzieri).length ? " · ★" : "";
      annuncia(su.map(nome).join(", ") + (su.length === 1 ? t_("risale") : t_("risalgono")), t_("inCassa") + " " + su.map((s) => "+" + (e.cassa[s] || 0)).join(" / ") + extra, 2000);
    });
    log(su.length ? su.map(nomeCol).join(", ") + " ↑ " + t_("inCassa") + " " + su.map((s) => "+" + (e.cassa[s] || 0)).join(" / ") : t_("tutti"));
    return;
  }
  if (e.k === "riepilogo" && anima) dopo(.9, () => riepilogo(e));
}

// ── la UI ────────────────────────────────────────────────────────────────
const SVG_SACCO = '<svg viewBox="0 0 24 24"><path d="M9 3h6l-1.5 3h-3z" fill="currentColor"/><path d="M8 7h8c3 3 5 6 5 9a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5c0-3 2-6 5-9z" fill="currentColor"/></svg>';
const SVG_CASSA = '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="2" fill="currentColor"/><path d="M3 9a9 6 0 0 1 18 0z" fill="currentColor" opacity=".75"/><rect x="10.5" y="12" width="3" height="4" rx="1" fill="#0b0b12"/></svg>';
function chip(p) {
  const d = document.createElement("div"); d.className = "gioc acceso"; d.dataset.sg = p.sg;
  d.innerHTML = '<div class="foto"><canvas width="96" height="96"></canvas><span class="lampada"></span><span class="lucchetto"><svg viewBox="0 0 24 24" width="9" height="9"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.6"/></svg></span></div>' +
    '<div class="info"><span class="nome"></span><span class="conti"><span class="sacco vuoto">' + SVG_SACCO + '<b>0</b></span><span class="cassa vuoto">' + SVG_CASSA + "<b>0</b></span></span></div><span class=\"piu\"></span>";
  return d;
}
function aggiornaGiocatori() {
  if (!V) return;
  for (const box of [$("giocatori-pc"), $("giocatori-tel")]) {
    if (box.children.length !== V.n) { box.innerHTML = ""; V.giocatori.forEach((p) => box.appendChild(chip(p))); }
    V.giocatori.forEach((p, i) => {
      const el = box.children[i];
      if (!el.dataset.ok && INFO) { el.querySelector("canvas").getContext("2d").drawImage(gettone(p.sg, 96), 0, 0); el.dataset.ok = 1; }
      el.classList.toggle("su", !p.dentro && !S.tenuti.has(p.sg)); el.classList.toggle("io", p.sg === V.io);
      el.classList.toggle("scelto", p.dentro && p.scelto && V.fase === "scelta");
      el.querySelector(".nome").textContent = gl(p.sg) + " " + nome(p.sg) + (p.afk ? " · " + t2_("assente") : "") + (p.offline ? " · off" : ""); el.querySelector(".nome").style.color = TINTE[p.sg % 8];
      const m = MOSTRA[p.sg] || { sacco: p.bottino, cassa: p.cassa };
      el.querySelector(".sacco b").textContent = m.sacco; el.querySelector(".sacco").classList.toggle("vuoto", !m.sacco);
      el.querySelector(".cassa b").textContent = m.cassa; el.querySelector(".cassa").classList.toggle("vuoto", !m.cassa);
    });
  }
}
function aggiornaTesta() {
  const box = $("spedizioni");
  if (box.children.length !== V.D) { box.innerHTML = ""; for (let i = 0; i < V.D; i++) box.insertAdjacentHTML("beforeend", '<span class="sp">' + (i + 1) + "</span>"); }
  [...box.children].forEach((el, i) => { el.classList.toggle("fatta", i < V.discesa); el.classList.toggle("ora", i === V.discesa); });
}
function aggiornaPericoli() {
  const box = $("pericoli");
  if (!box.children.length) PERICOLI.forEach((h) => box.insertAdjacentHTML("beforeend", '<div class="hz" data-h="' + h + '"><div class="ic" style="background:#1d1418 url(pix/segni.png) ' + (PERICOLI.indexOf(h) * 25) + '% 0/500% 100% no-repeat"></div><div class="pips"></div></div>'));
  const visti = PERICOLI.filter((h) => V.visti[h]);
  let av = $("avviso-segni"); if (!av) { av = document.createElement("div"); av.id = "avviso-segni"; $("scena-box").appendChild(av); }
  av.innerHTML = visti.length ? visti.map((h) => "<b>" + NP(h) + "</b>").join(" · ") + (LINGUA === "it" ? " già uscit" + (visti.length > 1 ? "i" : "o") + ": se esce <u>ancora</u>, il drago si sveglia!" : " already out: if it comes out <u>again</u>, the dragon wakes!") : "";
  av.classList.toggle("su", visti.length > 0);
  for (const el of box.children) {
    const h = el.dataset.h, v = V.visti[h] || 0, c = V.composizione[h] || 0;
    el.classList.toggle("visto", v >= 1);
    el.querySelector(".pips").innerHTML = '<i class="' + (v >= 1 ? "uno" : "") + '"></i><i class="due">!</i>';
  }
  const k = V.composizione, h = ['<span class="z">' + t_("tesori") + "</span><b>" + k.perla + "</b>", '<span class="z">' + t_("reliquie") + "</span><b>" + k.forziere + "</b>"];
  for (const p of PERICOLI) h.push('<span class="' + (V.visti[p] ? "h" : "z") + '">' + NP(p) + (V.visti[p] ? " · " + t_("gia") : "") + "</span><b>" + k[p] + "</b>");
  $("mazzo").innerHTML = h.join("");
}
function aggiornaMetro() {
  const r = V.rischio, pc = Math.round(r * 100);
  $("metro-num").textContent = pc + "%"; $("metro-fill").style.width = Math.min(100, r / .4 * 100) + "%";
  $("metro-fill").style.background = r < .1 ? "#56e3ff" : r < .2 ? "#ffc85a" : "#ff5a4e"; $("metro").classList.toggle("alto", r >= .2);
}
function aggiornaAzioni() {
  const me = V.giocatori[V.io] || {}, posso = V.fase === "scelta" && me.dentro && !V.fine && !AUTO;
  $("b-giu").disabled = !posso; $("b-risali").disabled = !posso;
  $("b-giu").classList.toggle("scelto", me.scelta === "giu"); $("b-risali").classList.toggle("scelto", me.scelta === "risali");
  const tutti = V.giocatori.filter((p) => p.dentro).every((p) => p.scelto);
  if (V.fase === "scelta" && (tutti || V.resta < 1.1)) { $("chi-risale").textContent = t_("chi"); $("chi-risale").classList.add("su"); }
  else if (V.fase !== "esito") $("chi-risale").classList.remove("su");
  if (!$("riga-log").innerHTML) $("riga-log").textContent = V.fase === "scelta" && me.dentro ? (me.scelta ? t_("scelto") : t_("scegli")) : "";
  const seg = Object.keys(V.visti).length, sv = S.crollo && SIM - S.crollo.t0 < 3; $("prof").textContent = sv ? t_("sveglio") : seg ? t_("agita") + " " + "●".repeat(seg) : t_("dorme"); $("prof").className = sv ? "sveglio" : seg ? "agitato" : "";
}
function orologio() {
  if (!V) return;
  const giro = $("a-giro"), num = $("a-num");
  if (V.fase === "scelta" && !V.fine) {
    const resta = Math.max(0, V.resta - (performance.now() - snapT) / 1000), tot = (INFO && INFO.scelta_s) || 5;
    giro.style.strokeDashoffset = 144.5 * (1 - resta / tot); giro.style.stroke = resta < 1.5 ? "#ff5a4e" : "#f4f2fb"; num.textContent = Math.ceil(resta);
  } else { giro.style.strokeDashoffset = 144.5; num.textContent = "·"; }
}
function riga(sg, destra, extra) {
  const r = document.createElement("div"); r.className = "riga";
  const c = tela(68, 68); c.getContext("2d").drawImage(gettone(sg, 68), 0, 0); r.appendChild(c);
  r.insertAdjacentHTML("beforeend", '<span class="nm">' + nome(sg) + "</span>" + (extra || "") + destra);
  return r;
}
function riepilogo(e) {
  const s = $("scheda"), prima = S.inizioCassa || [];
  s.innerHTML = "<h2>" + t_("fineSp") + " " + (e.d + 1) + "</h2><p>" + (e.crollo ? t_("crollata") : t_("tutteSu")) + "</p>";
  const ord = e.cassa.map((c, sg) => ({ sg, c, d: c - (prima[sg] || 0) })).sort((a, b) => b.c - a.c);
  ord.forEach((o, i) => { const r = riga(o.sg, '<span class="v" data-v="' + o.c + '">' + (o.c - o.d) + "</span>", '<span class="piu2">' + (o.d ? "+" + o.d : "") + "</span>"); r.style.animationDelay = i * .07 + "s"; s.appendChild(r); });
  $("velo").hidden = false;
  // la cassaforte conta in su
  s.querySelectorAll(".v").forEach((el) => { const fino = +el.dataset.v; let v = +el.textContent; const passo = Math.max(1, Math.ceil((fino - v) / 12)); const k = setInterval(() => { v = Math.min(fino, v + passo); el.textContent = v; if (v >= fino) clearInterval(k); }, RM ? 1 : 45); });
  setTimeout(() => { if (!V || !V.fine) $("velo").hidden = true; }, 2900);
}
function finale(msg) {
  const ex = msg.extra, pr = msg.premi, s = $("scheda");
  const premio = (sg) => { if (!pr) return ""; const c = pr.premi[INFO.seggi[sg].uid]; return c ? (c / 100).toFixed(2).replace(".", LINGUA === "it" ? "," : ".") + " €" : ""; };
  const ordine = ex.gruppi.flat(), io = ex.gruppi[0].includes(V.io);
  s.innerHTML = "<h2>" + (io ? t_("vinto") : t_("finita")) + "</h2><p>" + (ex.gruppi[0].length > 1 ? t_("pari") + " " : "") + (pr ? t_("monte") + " " + (pr.montepremi / 100).toFixed(2) + " €" : t_("allen")) + "</p>";
  const pod = document.createElement("div"); pod.className = "podio";
  [1, 0, 2].forEach((k, j) => {
    const sg = ordine[k]; if (sg === undefined) return;
    const d = document.createElement("div"); d.className = "p" + (k === 0 ? " primo" : ""); d.style.animationDelay = (j === 1 ? .1 : .35 + j * .1) + "s";
    const c = tela(120, 120); c.getContext("2d").drawImage(gettone(sg, 120), 0, 0); d.appendChild(c);
    d.insertAdjacentHTML("beforeend", '<span class="nmp">' + nome(sg) + '</span><span class="pr">' + premio(sg) + '</span><div class="base" style="height:' + [64, 46, 34][k] + 'px">' + ex.cassa[sg] + "</div>");
    pod.appendChild(d);
  });
  s.appendChild(pod);
  ordine.slice(3).forEach((sg, i) => s.appendChild(riga(sg, '<span class="v">' + ex.cassa[sg] + "</span>")));
  s.insertAdjacentHTML("beforeend", "<code>seme " + ex.seme + "<br>firma " + ex.firma + '</code><button class="btn giu" onclick="location.reload()">' + t_("rigioca") + "</button>");
  $("velo").hidden = false;
}
// ── PC: tastiera, mouse, suggerimenti, storia, regole ─────────────────────
const STORIA = {};
function storia(sg, txt) { (STORIA[sg] = STORIA[sg] || []).unshift((LINGUA === "it" ? "Sp. " : "Exp. ") + ((V ? V.discesa : 0) + 1) + " · " + txt); }
const tip = $("tip");
function mostraTip(html, x, y) { tip.innerHTML = html; tip.hidden = false; const r = tip.getBoundingClientRect(); tip.style.left = Math.min(innerWidth - r.width - 8, x + 14) + "px"; tip.style.top = Math.min(innerHeight - r.height - 8, y + 14) + "px"; }
function nascondiTip() { tip.hidden = true; }
const IT_EN = (it, en) => (LINGUA === "it" ? it : en);
$("pericoli").addEventListener("mousemove", (ev) => {
  const el = ev.target.closest(".hz"); if (!el || !V) return nascondiTip();
  const h = el.dataset.h, v = V.visti[h] || 0, c = V.composizione[h] || 0;
  mostraTip("<b>" + NP(h) + "</b><br>" + (v ? '<b style="color:#ff8a80">' + IT_EN("uscito 1 volta: se esce ancora, il drago si sveglia!", "out once: if it comes out again, the dragon wakes!") + "</b>" : IT_EN("non ancora uscito in questa spedizione: da solo non fa niente", "not out yet this expedition: alone it does nothing")) + '<br><span style="color:#9a96ad">' + IT_EN("ne restano " + c + " nel mazzo", c + " left in the deck") + "</span><br>" + IT_EN("rischio che il drago si svegli alla prossima carta: ", "chance the next card wakes the dragon: ") + "<b>" + Math.round(V.rischio * 100) + "%</b>", ev.clientX, ev.clientY);
});
$("pericoli").addEventListener("mouseleave", nascondiTip);
$("metro").addEventListener("mousemove", (ev) => {
  if (!V) return;
  const cattive = PERICOLI.filter((h) => V.visti[h]).reduce((a, h) => a + (V.composizione[h] || 0), 0), tot = Object.values(V.composizione).reduce((a, b) => a + b, 0);
  mostraTip("<b>" + (V.rischio * 100).toFixed(1) + "%</b><br>" + IT_EN("carte che causano il disastro: ", "cards that cause a disaster: ") + cattive + " / " + tot, ev.clientX, ev.clientY);
});
$("metro").addEventListener("mouseleave", nascondiTip);
function tipGiocatore(ev) {
  const el = ev.target.closest(".gioc"); if (!el || !V) return nascondiTip();
  const sg = +el.dataset.sg, p = V.giocatori[sg], m = MOSTRA[sg] || {};
  mostraTip("<b>" + nome(sg) + "</b><br>" + IT_EN("porta (a rischio): ", "carrying (at risk): ") + (m.sacco || 0) + "<br>" + IT_EN("in cassaforte (al sicuro): ", "banked (safe): ") + (m.cassa || 0) +
    (p.forzieri ? "<br>★ " + p.forzieri : "") + "<br>" + (p.dentro ? IT_EN("lampada accesa: ancora giù", "lamp on: still down") : IT_EN("in superficie", "at the surface")) +
    '<br><span style="color:#9a96ad">' + IT_EN("clic: la sua storia", "click: history") + "</span>", ev.clientX, ev.clientY);
}
for (const box of [$("giocatori-pc"), $("giocatori-tel")]) {
  box.addEventListener("mousemove", tipGiocatore); box.addEventListener("mouseleave", nascondiTip);
  box.addEventListener("click", (ev) => { const el = ev.target.closest(".gioc"); if (!el) return; nascondiTip(); apriStoria(+el.dataset.sg); });
}
function apriStoria(sg) {
  const s = $("scheda"), l = STORIA[sg] || [];
  s.innerHTML = "<h2>" + nome(sg) + "</h2><p>" + IT_EN("Cosa è successo in questa partita", "What happened this game") + "</p>";
  s.appendChild(riga(sg, '<span class="v">' + ((MOSTRA[sg] || {}).cassa || 0) + "</span>"));
  s.insertAdjacentHTML("beforeend", '<div class="storia">' + (l.length ? l.map((x) => "<div>" + x + "</div>").join("") : "<div>-</div>") + '</div><button class="btn risali" id="b-chiudi">' + IT_EN("Chiudi (Esc)", "Close (Esc)") + "</button>");
  $("velo").hidden = false; $("velo").dataset.chiudibile = 1; $("b-chiudi").onclick = chiudiVelo;
}
function apriRegole() {
  const s = $("scheda");
  const it = ["5 spedizioni. In ognuna il gruppo scende lungo il sentiero: ogni passo gira una carta.",
    "<b>Perle</b>: si dividono in parti uguali fra chi è ancora giù. Il <b>resto</b> resta sulla tessera.",
    "<b>Pericolo</b>: il primo di un tipo è un avviso. Il <b>secondo uguale</b> è il disastro: chi è giù perde le perle che porta. Una copia di quel pericolo esce dal gioco.",
    "Prima di ogni carta tutti scelgono in segreto: <b>Resta giù</b> (↓ / S) o <b>Risali</b> (↑ / W). Le scelte si girano insieme.",
    "Chi risale mette in <b>cassaforte</b> le perle che porta (al sicuro per sempre) e divide con chi risale insieme i resti di ogni tessera.",
    "<b>Reliquie</b> (★5 ★5 ★5 ★10 ★10): le prende solo chi risale <b>da solo</b>.",
    "Vince chi ha più perle in cassaforte dopo 5 spedizioni (pari: più reliquie).",
    "Tasti: ↓ S D resta · ↑ W R risali · H o ? regole · Esc chiude · rotella: scorri il sentiero (Ctrl: zoom) · clic su un giocatore: la sua storia."];
  const en = ["5 expeditions. Each step down the path reveals a card.",
    "<b>Pearls</b> are split equally among divers still down. The <b>remainder</b> stays on the tile.",
    "<b>Hazard</b>: the first of a kind is a warning. A <b>second of the same kind</b> is a disaster: everyone still down loses the pearls they carry. One copy of that hazard leaves the game.",
    "Before each card everyone secretly chooses: <b>Stay down</b> (↓ / S) or <b>Rise</b> (↑ / W). Choices are revealed together.",
    "Risers bank the pearls they carry (safe forever) and split the leftovers on every tile with whoever rises with them.",
    "<b>Relics</b> (★5 ★5 ★5 ★10 ★10) go only to a diver who rises <b>alone</b>.",
    "Most banked pearls after 5 expeditions wins (tie: most relics).",
    "Keys: ↓ S D stay · ↑ W R rise · H or ? rules · Esc closes · wheel: scroll the path (Ctrl: zoom) · click a player: history."];
  s.innerHTML = "<h2>" + IT_EN("Come si gioca", "How to play") + '</h2><ol class="regole">' + (LINGUA === "it" ? it : en).map((x) => "<li>" + x + "</li>").join("") +
    '</ol><button class="btn risali" id="b-chiudi">' + IT_EN("Chiudi (Esc)", "Close (Esc)") + "</button>";
  $("velo").hidden = false; $("velo").dataset.chiudibile = 1; $("b-chiudi").onclick = chiudiVelo;
}
function chiudiVelo() { if ($("velo").dataset.chiudibile) { $("velo").hidden = true; delete $("velo").dataset.chiudibile; } }
$("velo").addEventListener("click", (ev) => { if (ev.target.id === "velo") chiudiVelo(); });
$("b-regole").onclick = apriRegole;
function premi(b) { b.style.transform = "scale(.95)"; setTimeout(() => (b.style.transform = ""), 120); }
addEventListener("keydown", (ev) => {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const k = ev.key.toLowerCase();
  if (k === "escape") { chiudiVelo(); nascondiTip(); return; }
  if (k === "h" || k === "?") { apriRegole(); ev.preventDefault(); return; }
  if (!$("velo").hidden) return;
  if (k === "arrowdown" || k === "s" || k === "d") { if (!$("b-giu").disabled) { manda("giu"); premi($("b-giu")); } ev.preventDefault(); }
  if (k === "arrowup" || k === "w" || k === "r") { if (!$("b-risali").disabled) { manda("risali"); premi($("b-risali")); } ev.preventDefault(); }
});
// rotella: scorre lungo il sentiero; Ctrl + rotella: zoom
cv.addEventListener("wheel", (ev) => {
  ev.preventDefault(); const g = geo();
  if (ev.ctrlKey) S.zoom = Math.max(.7, Math.min(1.5, (S.zoom || 1) * (ev.deltaY > 0 ? .92 : 1.08)));
  else { S.camOff = Math.max(-(S.gruppo + 2) * g.passo, Math.min(g.passo * 1.5, (S.camOff || 0) + ev.deltaY * (devicePixelRatio || 1))); S.rotella = performance.now(); }
}, { passive: false });
// passando sulle tessere: cosa c'e' sopra
cv.addEventListener("mousemove", (ev) => {
  if (!V) return;
  const r = cv.getBoundingClientRect(), d = cv.width / r.width, g = geo(), Z = S.zoom || 1;
  const x = ((ev.clientX - r.left) * d - g.W / 2) / Z + g.W / 2, y = ((ev.clientY - r.top) * d - g.H / 2) / Z + g.H / 2 + S.cam;
  for (let i = 0; i < V.strada.length; i++) {
    const p = posT(i, g); if (Math.hypot(x - p.x, (y - p.y) * 1.6) > g.T * .5) continue;
    const c = V.strada[i], righe = [IT_EN("Tessera ", "Tile ") + (i + 1) + ": <b>" + (c.t === "perla" ? c.v + " " + t_("perle") : c.t === "pericolo" ? c.v : t_("rel") + " ★" + c.v) + "</b>"];
    if (c.resto) righe.push(IT_EN("resti sulla tessera: ", "leftovers on the tile: ") + "<b>" + c.resto + "</b>");
    if (c.t === "forziere") righe.push(c.preso != null ? IT_EN("presa da ", "taken by ") + nome(c.preso) : IT_EN("aspetta chi risale da solo", "waiting for a lone riser"));
    if (c.t === "pericolo") righe.push(IT_EN("pericolo: un altro " + c.v + " è il disastro", "hazard: another " + c.v + " is a disaster"));
    return mostraTip(righe.join("<br>"), ev.clientX, ev.clientY);
  }
  nascondiTip();
});
cv.addEventListener("mouseleave", nascondiTip);

// ── SUPER POLISH (16/11 notte): tavolo, fasi, tutorial guidato, simboli dei seggi, suono, statistiche, verifica del seme ──
const GLIFI = ["●", "▲", "■", "◆", "★", "✚", "⬟", "⬢"];          // il seggio si riconosce anche senza colori
const gl = (sg) => GLIFI[sg % 8];
const TXT2 = {
  it: { tavolo: "Al tavolo", parte: (n) => "Si parte tra " + n + " s", modo: (s) => (s ? "Partita a soldi" : "Allenamento gratis"),
    r1: "Scendete insieme lungo il sentiero: ogni passo scopre una carta.", r2: "Prima di ogni carta, in segreto: <b>Avanti</b> o <b>Torna su</b>.",
    r3: "Due segni uguali svegliano il drago: chi è sul sentiero perde l'oro che porta.", capito: "Ho capito",
    f_scelta: "Scegli in segreto", f_svela: "Si scopre la carta…", f_esito: "Si rivelano le scelte", f_riepilogo: "Fine spedizione", f_discesa: "Si entra nella grotta", f_intro: "Al tavolo",
    t1: "Ora scegli in segreto: <b>Avanti</b> per scendere e prendere altro oro, <b>Torna su</b> per metterlo al sicuro nel forziere.",
    t2: "L'oro si divide in parti uguali fra chi è sul sentiero. <b>Il resto resta sulla tessera</b>: lo prende chi torna su.",
    t3: "Un segno da solo non fa niente. Se <b>lo stesso segno esce DUE volte</b>, il drago si sveglia e chi è ancora dentro perde l'oro.",
    t4: "Chi torna su mette l'oro nel <b>forziere</b> (al sicuro per sempre) e si divide i resti delle tessere.",
    t5: "Le <b>reliquie</b> le prende solo chi torna su <b>da solo</b>.",
    t6: "Il drago si è svegliato! L'oro portato è perso; quello nel forziere resta tuo.",
    tuttiSu: "Tutti tornano su", tuttiSuSub: "la spedizione finisce: nessuno sveglia il drago", finito: "Il sentiero è finito", finitoSub: "tutti tornano al campo salvi", auto: "scelta automatica",
    colpo: "Colpo più grosso", sfortuna: "Più sfortunato", reliquie2: "Reliquie", verifica: "Verifica il seme", verOk: "Il seme corrisponde alla firma pubblicata all'inizio: partita non truccabile.", verNo: "Firma diversa!", rivincita: "Rivincita", assente: "assente" },
  en: { tavolo: "At the table", parte: (n) => "Starting in " + n + " s", modo: (s) => (s ? "Real-money game" : "Free practice"),
    r1: "Go down the path together: every step reveals a card.", r2: "Before each card, in secret: <b>Go on</b> or <b>Go back</b>.",
    r3: "Two identical signs wake the dragon: everyone on the path loses the gold they carry.", capito: "Got it",
    f_scelta: "Choose in secret", f_svela: "Revealing the card…", f_esito: "Choices revealed", f_riepilogo: "End of expedition", f_discesa: "Entering the cave", f_intro: "At the table",
    t1: "Choose in secret: <b>Go on</b> to go deeper for more gold, <b>Go back</b> to put it safe in the chest.",
    t2: "Gold is split equally among thieves on the path. <b>The remainder stays on the tile</b>: whoever goes back takes it.",
    t3: "One sign alone does nothing. If <b>the same sign comes out TWICE</b>, the dragon wakes and everyone still inside loses their gold.",
    t4: "Going back puts your gold in the <b>chest</b> (safe forever) and splits the leftovers on the tiles.",
    t5: "<b>Relics</b> go only to a thief who goes back <b>alone</b>.",
    t6: "The dragon woke up! Carried gold is lost; gold in your chest stays yours.",
    tuttiSu: "Everyone goes back", tuttiSuSub: "the expedition ends: nobody wakes the dragon", finito: "The path is over", finitoSub: "everyone returns safely to camp", auto: "automatic choice",
    colpo: "Biggest haul", sfortuna: "Unluckiest", reliquie2: "Relics", verifica: "Verify the seed", verOk: "The seed matches the hash published at the start: the game can't be rigged.", verNo: "Hash mismatch!", rivincita: "Rematch", assente: "away" },
};
const t2_ = (k, ...a) => { const v = TXT2[LINGUA][k]; return typeof v === "function" ? v(...a) : v; };

// statistiche per la schermata finale
const STAT = {};
const st = (sg) => (STAT[sg] = STAT[sg] || { preso: 0, perso: 0, crolli: 0, tornate: 0, maxPortato: 0, reliquie: 0 });

// tutorial guidato: la prima spedizione, una volta sola (o ?tutorial=1)
let TUT = false; try { TUT = Q.get("tutorial") === "1" || (!AUTO && !localStorage.getItem("drago_tut")); } catch (e) { TUT = Q.get("tutorial") === "1"; }
const TUT_FATTI = new Set();
function coach(k) {
  if (!TUT || TUT_FATTI.has(k) || (V && V.discesa > 0)) return; TUT_FATTI.add(k);
  let b = $("coach"); if (!b) { b = document.createElement("div"); b.id = "coach"; document.getElementById("app").appendChild(b); }
  b.innerHTML = '<div class="c-testo">' + t2_(k) + '</div><button class="c-ok">' + t2_("capito") + "</button>";
  b.classList.remove("su"); void b.offsetWidth; b.classList.add("su");
  b.querySelector(".c-ok").onclick = () => b.classList.remove("su");
  clearTimeout(coach.t); coach.t = setTimeout(() => b.classList.remove("su"), 7000);
}
function polishEvento(e, anima) {
  if (!anima) return;
  if (e.k === "scelta_aperta") coach("t1");
  if (e.k === "carta") {
    const c = e.carta;
    Object.entries(e.div).forEach(([s, q]) => { if (q > 0) st(+s).preso += q; else if (q < 0 || e.crollo) { st(+s).perso += -q; st(+s).crolli++; } });
    if (c.t === "perla") dopo(2.6, () => coach("t2"));
    if (c.t === "pericolo" && !e.crollo) dopo(2.2, () => coach("t3"));
    if (c.t === "pericolo" && e.crollo) dopo(3, () => coach("t6"));
    if (c.t === "forziere") dopo(2.4, () => coach("t5"));
  }
  if (e.k === "uscite") {
    e.risali.forEach((sg) => { st(sg).tornate++; if (e.forzieri[sg]) st(sg).reliquie++; });
    if (e.risali.length) dopo(2.2, () => coach("t4"));
    if (e.auto && e.auto.length) log(e.auto.map(nomeCol).join(", ") + " · " + t2_("auto"));
    const tutti = e.giu.length === 0 && e.risali.length > 1;
    if (tutti) dopo(1.2, () => annuncia(t2_("tuttiSu"), t2_("tuttiSuSub"), 2200, "oro"));
  }
  if (e.k === "riepilogo") {
    if (e.salvati && Object.keys(e.salvati).length) annuncia(t2_("finito"), t2_("finitoSub"), 2200, "oro");
    if (TUT && e.d === 0) { try { localStorage.setItem("drago_tut", "1"); } catch (x) {} }
  }
}
// il tavolo (durante l'intro) e la pillola della fase
function aggiornaPolish() {
  if (!V) return;
  for (const p of V.giocatori) st(p.sg).maxPortato = Math.max(st(p.sg).maxPortato, p.bottino);
  const fp = $("fase-pill");
  if (fp) { const k = "f_" + (V.fine ? "riepilogo" : V.fase); fp.textContent = TXT2[LINGUA][k] || ""; fp.dataset.fase = V.fase; }
  // UNA riga di fase (la targa): cosa succede adesso, e durante la scelta la regola in una frase
  const pr = $("prof");
  if (pr) {
    const me = V.giocatori[V.io] || {}, it = LINGUA === "it";
    let riga = "";
    if (V.fine) riga = it ? "Partita finita" : "Game over";
    else if (V.fase === "scelta") riga = me.dentro ? (me.scelta ? (it ? "Scelto. Aspetta gli altri" : "Chosen. Waiting for the others") : (it ? "Scegli: AVANTI o TORNA SU" : "Choose: GO ON or GO BACK")) : (it ? "Sei al campo: guarda" : "You're at camp: watch");
    else if (V.fase === "svela" || V.fase === "discesa") riga = it ? "Si scopre la carta" : "Revealing the card";
    else if (V.fase === "esito") riga = it ? "Si rivelano le scelte" : "Choices revealed";
    else if (V.fase === "riepilogo") riga = it ? "Fine spedizione" : "End of expedition";
    else if (V.fase === "intro") riga = it ? "Al tavolo" : "At the table";
    const regola = it ? "2 segni uguali = il drago si sveglia" : "2 identical signs = the dragon wakes";
    pr.innerHTML = "<b>" + riga + "</b><small>" + regola + "</small>";
    pr.className = "riga-fase";
  }
  if (V.fase === "intro" && !V.fine) {
    const s = $("scheda");
    if (!s.dataset.tavolo) {
      s.dataset.tavolo = 1;
      s.innerHTML = '<img class="tav-key" src="pix/titolo.png" alt=""><h2>' + t2_("tavolo") + '</h2><p id="tav-sub"></p><div class="tav-gioc"></div><ul class="tav-regole"><li>' + t2_("r1") + "</li><li>" + t2_("r2") + "</li><li>" + t2_("r3") + "</li></ul>";
      const box = s.querySelector(".tav-gioc");
      V.giocatori.forEach((p, i) => { const d = document.createElement("div"); d.className = "tav-p"; d.style.animationDelay = i * .08 + "s"; const c = tela(84, 84); c.getContext("2d").drawImage(gettone(p.sg, 84), 0, 0); d.appendChild(c); d.insertAdjacentHTML("beforeend", "<span style=\"color:" + TINTE[p.sg % 8] + "\">" + gl(p.sg) + " " + nome(p.sg) + "</span>"); box.appendChild(d); });
      $("velo").hidden = false;
    }
    $("tav-sub").textContent = t2_("modo", INFO && INFO.a_soldi) + " · " + t2_("parte", Math.max(1, Math.ceil(V.resta)));
  } else if ($("scheda").dataset.tavolo) { delete $("scheda").dataset.tavolo; $("velo").hidden = true; }
}
// statistiche, verifica del seme e rivincita nella schermata finale
async function sha256hex(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
function aggiungiFinale(msg) {
  const s = $("scheda"), ex = msg.extra, ids = Object.keys(STAT).map(Number);
  if (ids.length) {
    const colpo = ids.reduce((a, b) => (st(b).maxPortato > st(a).maxPortato ? b : a), ids[0]);
    const sfort = ids.reduce((a, b) => (st(b).perso > st(a).perso ? b : a), ids[0]);
    const rel = ids.filter((x) => st(x).reliquie);
    let h = '<div class="stat">';
    h += "<div><span>" + t2_("colpo") + "</span><b>" + gl(colpo) + " " + nome(colpo) + " · " + st(colpo).maxPortato + "</b></div>";
    if (st(sfort).perso) h += "<div><span>" + t2_("sfortuna") + "</span><b>" + gl(sfort) + " " + nome(sfort) + " · -" + st(sfort).perso + "</b></div>";
    if (rel.length) h += "<div><span>" + t2_("reliquie2") + "</span><b>" + rel.map((x) => gl(x) + " " + nome(x) + " ★" + st(x).reliquie).join(", ") + "</b></div>";
    h += "</div>";
    const code = s.querySelector("code"); code.insertAdjacentHTML("beforebegin", h);
  }
  const b = s.querySelector(".btn"); if (b) b.textContent = t2_("rivincita");
  s.querySelector("code").insertAdjacentHTML("afterend", '<button class="btn risali verifica">' + t2_("verifica") + '</button><div class="ver-esito"></div>');
  s.querySelector(".verifica").onclick = async () => { const h = await sha256hex(ex.seme); s.querySelector(".ver-esito").innerHTML = h === ex.firma ? '<span class="ok">✓ ' + t2_("verOk") + "</span>" : '<span class="no">✗ ' + t2_("verNo") + "</span>"; };
}
const finaleBase = finale;
finale = (msg) => { finaleBase(msg); try { aggiungiFinale(msg); } catch (e) { console.warn(e); } };

// ── suono: bus principale, ambiente della grotta, respiro del drago, musica di sottofondo ──
const MIX = { master: null, amb: null, resp: null, respLfo: null, musica: null };
function mix() {
  const c = SUONO.ctx; if (!c || MIX.master) return MIX;
  MIX.master = c.createGain(); MIX.master.gain.value = .9; MIX.master.connect(c.destination);
  // ambiente: rumore marrone filtrato + gocce
  const n = rumore(c, 4); n.loop = true; const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 220; MIX.amb = c.createGain(); MIX.amb.gain.value = .05; n.connect(f); f.connect(MIX.amb); MIX.amb.connect(MIX.master); n.start();
  // respiro del drago: rumore a banda stretta modulato lentamente
  const r = rumore(c, 4); r.loop = true; const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 260; bp.Q.value = 1.2;
  MIX.resp = c.createGain(); MIX.resp.gain.value = 0; const lfo = c.createOscillator(); lfo.frequency.value = .18; const lg = c.createGain(); lg.gain.value = .05;
  lfo.connect(lg); lg.connect(MIX.resp.gain); r.connect(bp); bp.connect(MIX.resp); MIX.resp.connect(MIX.master); r.start(); lfo.start(); MIX.respLfo = { lfo, lg };
  // musica: accordi lunghi e morbidi (la-, fa, do, sol)
  MIX.musica = c.createGain(); MIX.musica.gain.value = .022; MIX.musica.connect(MIX.master);
  const acc = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 196, 261.6], [196, 246.9, 293.7]]; let k = 0;
  const suonaAcc = () => { if (!SUONO.ctx) return; const t0 = c.currentTime; for (const fr of acc[k % 4]) { const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = fr; const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + 1.2); g.gain.linearRampToValueAtTime(0, t0 + 4.2); o.connect(g); g.connect(MIX.musica); o.start(t0); o.stop(t0 + 4.3); } k++; };
  suonaAcc(); setInterval(suonaAcc, 4000);
  setInterval(() => { if (Math.random() < .5 && SUONO.on) { const t0 = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(1800 + Math.random() * 900, t0); o.frequency.exponentialRampToValueAtTime(700, t0 + .12); g.gain.setValueAtTime(.025, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + .2); o.connect(g); g.connect(MIX.amb); o.start(t0); o.stop(t0 + .22); } }, 2300);
  return MIX;
}
function respiro() {   // il respiro cresce col rischio e coi segni gia' visti
  if (!MIX.resp || !V || !SUONO.ctx) return; const seg = Object.keys(V.visti).length, r = V.rischio || 0, t0 = SUONO.ctx.currentTime;
  MIX.respLfo.lfo.frequency.setTargetAtTime(.16 + seg * .05 + r * .5, t0, .5); MIX.respLfo.lg.gain.setTargetAtTime(.03 + seg * .02 + r * .12, t0, .5);
  MIX.musica.gain.setTargetAtTime(V.fase === "scelta" ? .016 : .022, t0, .4);
}
setInterval(respiro, 500);

function applica(s) {
  const nuovi = s.feed || []; V = s; snapT = performance.now();
  for (const e of nuovi) evento(e, pronto && !RM ? true : pronto);
  if (!pronto) { for (const p of V.giocatori) MOSTRA[p.sg] = { sacco: p.bottino, cassa: p.cassa }; pronto = true; }
  aggiornaGiocatori(); aggiornaTesta(); aggiornaPericoli(); aggiornaMetro(); aggiornaAzioni(); sincronizza(); aggiornaPolish();
}
function manda(a) { ac(); if (ws && ws.readyState === 1) ws.send(JSON.stringify({ a })); }
$("b-giu").onclick = () => manda("giu"); $("b-risali").onclick = () => manda("risali");
$("b-audio").onclick = () => { SUONO.on = !SUONO.on; if (SUONO.ctx) SUONO.on ? SUONO.ctx.resume() : SUONO.ctx.suspend(); else { ac(); mix(); } $("b-audio").style.opacity = SUONO.on ? 1 : .4; };
$("b-lingua").onclick = () => { LINGUA = LINGUA === "it" ? "en" : "it"; traduci(); if (INFO) testata(); };
function testata() {
  $("firma").textContent = INFO.firma;
  $("sotto").textContent = (INFO.a_soldi ? t_("soldi") : t_("allen")) + " · " + INFO.n + " " + t_("gioc");
  $("p-piatto").textContent = INFO.a_soldi ? t_("piatto") + " " + (INFO.B * INFO.n / 100).toFixed(2) + " €" : t_("gratis");
}
async function via() {
  traduci();
  await caricaTutto(); preparaMare(); ridimensiona(); requestAnimationFrame(disegna);
  ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws" + location.search);
  ws.onmessage = async (m) => {
    const d = JSON.parse(m.data);
    if (d.t === "info") {
      // FOTO_VERE_1711 (regola del proprietario): gli umani con la LORO foto Telegram/Discord (info.foto, dal ponte:
      // profiles[uid].photo_url dello start), i bot e chi non ha foto col colore del seggio. CORS: getImageData in pixel.js.
      FOTO = await Promise.all((d.info.foto || []).slice(0, 8).map((u) => (u ? caricaFoto(u) : null)));
      INFO = d.info; SPR.clear(); fotoRinfresca(); testata();
      for (const s of CODA.splice(0)) applica(s);
    } else if (d.t === "snap") { if (INFO) applica(d.s); else CODA.push(d.s); }
    else if (d.t === "fine") setTimeout(() => finale(d), 2200);
  };
  ws.onclose = () => { $("riga-log").textContent = "—"; };
}
addEventListener("load", via);   // dopo pixel.js, che sostituisce il disegno
