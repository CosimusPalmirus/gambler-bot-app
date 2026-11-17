// NON SVEGLIARE IL DRAGO - modalita' AVVENTURA (17/11). Si carica per ultima e si accende solo con V.variante === "avventura".
// UOVO del drago: chi lo prende (da solo) lo porta fuori per +12, ma finche' e' dentro OGNI segno sveglia il drago.
// BIVIO: la scelta dopo ha tre strade (SINISTRA in alto, DESTRA in basso, TORNA SU); ogni via gira la sua carta,
//        l'oro di una via si divide solo fra chi l'ha presa; poi le vie si riuniscono.
// BOTTEGA fra le spedizioni: 6 s per comprare UN oggetto con l'oro del forziere (TORCIA, SCUDO, NINNA), vale una spedizione.
"use strict";
const AVV = () => V && V.variante === "avventura";
const AV_IC = { UOVO: 0, BIVIO: 1, TORCIA: 2, SCUDO: 3, NINNA: 4, uovo_piccolo: 5 };
const AVT = {
  it: { uovoBreve: "chi lo porta: OGNI segno sveglia il drago", uovoRegBreve: "lo ottiene solo chi lo PRENDE da solo",
    bivioBreve: "al prossimo passo ogni via ha il suo oro", vieBreve: "SINISTRA o DESTRA, oppure torna su",
    uovo: "UOVO DEL DRAGO", uovoSub: "vale 12 se lo porti fuori. Ma finché è dentro, OGNI segno sveglia il drago",
    prendi: "PRENDI", lascia: "LASCIA", uovoReg: "Prendilo solo se sei l'UNICO a prenderlo. Poi torna su in fretta!",
    preso: (n) => n + " prende l'uovo!", presoSub: "finché è dentro, OGNI segno sveglia il drago",
    conteso: "Litigano: l'uovo rotola nel buio", lasciato: "Nessuno tocca l'uovo",
    salvo: "UOVO IN SALVO", perUovo: "Il drago sente il suo uovo!", perUovoSub: "basta un segno: si sveglia",
    uovoPerso: "l'uovo torna al drago",
    bivio: "BIVIO", bivioSub: "prossimo passo: SINISTRA o DESTRA. L'oro di una via è solo di chi la prende",
    sx: "SINISTRA", dx: "DESTRA", sxC: "SX", dxC: "DX", vieReg: "Scegli una via (in segreto) o torna su. Meno siete, più oro a testa.",
    vie: "Le vie", riuniti: "Le vie si riuniscono", via: (r) => "via di " + (r === "sx" ? "SINISTRA" : "DESTRA"),
    bottega: "BOTTEGA", botSub: "Un oggetto, pagato con l'oro del FORZIERE. Vale per la prossima spedizione.",
    tuoForziere: "Il tuo forziere", niente: "NIENTE", scelto: "Scelto: puoi ancora cambiare", comprano: "Alla bottega",
    nessunoCompra: "nessuno compra niente",
    TORCIA: "TORCIA", SCUDO: "SCUDO", NINNA: "NINNA NANNA",
    TORCIAr: "Una volta: guardi DI NASCOSTO la prossima carta", SCUDOr: "Se il drago si sveglia, salvi METÀ di quello che porti",
    NINNAr: "Il primo risveglio NON avviene (vale per tutti quelli dentro)",
    usaTorcia: "USA LA TORCIA", torciaVede: "TORCIA: la prossima è", ninnaSub: (n) => n + " canta la ninna nanna: il drago si riaddormenta",
    scudoSalva: (n, q) => n + ": lo scudo salva " + q, f_bottega: "Bottega", f_bottega_fine: "Bottega",
    rigaBottega: "BOTTEGA: compra o passa", rigaBivio: "Scegli: SINISTRA, DESTRA o TORNA SU", regolaUovo: "UOVO dentro: OGNI segno sveglia il drago",
    avvisoUovo: (n) => n + " porta l'UOVO: <u>qualsiasi</u> segno sveglia il drago!", modo: "Avventura" },
  en: { uovoBreve: "while carried inside, ANY sign wakes it", uovoRegBreve: "only a LONE taker gets it",
    bivioBreve: "next step: each path has its own gold", vieBreve: "LEFT or RIGHT, or go back",
    uovo: "DRAGON EGG", uovoSub: "worth 12 if you carry it out. But while it's inside, ANY sign wakes the dragon",
    prendi: "TAKE", lascia: "LEAVE", uovoReg: "You get it only if you're the ONLY one taking it. Then hurry back!",
    preso: (n) => n + " takes the egg!", presoSub: "while it's inside, ANY sign wakes the dragon",
    conteso: "They fight over it: the egg rolls into the dark", lasciato: "Nobody touches the egg",
    salvo: "EGG SAVED", perUovo: "The dragon smells its egg!", perUovoSub: "one sign is enough: it wakes",
    uovoPerso: "the egg goes back to the dragon",
    bivio: "FORK", bivioSub: "next step: LEFT or RIGHT. Gold on a path goes only to those who take it",
    sx: "LEFT", dx: "RIGHT", sxC: "L", dxC: "R", vieReg: "Pick a path (in secret) or go back. Fewer of you, more gold each.",
    vie: "Paths", riuniti: "The paths join again", via: (r) => (r === "sx" ? "LEFT" : "RIGHT") + " path",
    bottega: "SHOP", botSub: "One item, paid with gold from your CHEST. It lasts for the next expedition.",
    tuoForziere: "Your chest", niente: "NOTHING", scelto: "Chosen: you can still change", comprano: "At the shop",
    nessunoCompra: "nobody buys anything",
    TORCIA: "TORCH", SCUDO: "SHIELD", NINNA: "LULLABY",
    TORCIAr: "Once: SECRETLY look at the next card", SCUDOr: "If the dragon wakes, you keep HALF of what you carry",
    NINNAr: "The first wake-up does NOT happen (for everyone inside)",
    usaTorcia: "USE THE TORCH", torciaVede: "TORCH: next card is", ninnaSub: (n) => n + " sings a lullaby: the dragon falls asleep again",
    scudoSalva: (n, q) => n + ": the shield saves " + q, f_bottega: "Shop", f_bottega_fine: "Shop",
    rigaBottega: "SHOP: buy or pass", rigaBivio: "Choose: LEFT, RIGHT or GO BACK", regolaUovo: "EGG inside: ANY sign wakes the dragon",
    avvisoUovo: (n) => n + " carries the EGG: <u>any</u> sign wakes the dragon!", modo: "Adventure" },
};
const av = (k, ...a) => { const v = AVT[LINGUA][k]; return typeof v === "function" ? v(...a) : v; };
TXT2.it.f_bottega = AVT.it.f_bottega; TXT2.en.f_bottega = AVT.en.f_bottega; TXT2.it.f_bottega_fine = AVT.it.f_bottega; TXT2.en.f_bottega_fine = AVT.en.f_bottega;
const OGGETTI_AV = ["TORCIA", "SCUDO", "NINNA"];
const LANE = 16;          // le due vie stanno 32 px d'arte una dall'altra: i gruppi non si coprono

// ── stile ──
(function () {
  const st = document.createElement("style");
  st.textContent =
    ".av-ic{display:inline-block;width:32px;height:32px;background:url(pix/avventura.png) 0 0/600% 100% no-repeat;image-rendering:pixelated;flex:none}" +
    ".av-ic.s{width:16px;height:16px}" +
    ".gioc .foto{position:relative}.gioc .av-b{position:absolute;right:-6px;bottom:-6px;display:flex;gap:1px;pointer-events:none}" +
    ".gioc .av-b .av-ic{width:16px;height:16px;filter:drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000)}" +
    "#pannello-av{background:#1d1418;box-shadow:0 0 0 2px #ffc85a;padding:8px;display:flex;flex-direction:column;gap:6px}" +
    // in avventura i pannelli stanno SOPRA (non spingono la scena): niente salti quando compaiono e spariscono
    "body.avv #azioni{position:relative}body.avv #pannello-av,body.avv #pannello-sp{position:absolute;left:0;right:0;bottom:calc(100% + 6px);z-index:6;box-shadow:0 0 0 2px #ffc85a,0 8px 24px rgba(0,0,0,.7)}" +
    "body.avv #pannello-av[hidden],body.avv #pannello-sp[hidden]{display:none}" +
    "#pannello-av .sp-b{height:48px;flex-direction:row;gap:8px;font-size:13px}" +
    "#pannello-av .lato{font-size:15px}#pannello-av .sp-b[data-a=faro]{height:34px;font-size:11px}" +
    "#bottega{position:fixed;inset:0;display:grid;place-items:center;z-index:12;background:rgba(0,0,0,.55)}" +
    "#bottega[hidden]{display:none}" +
    "#bottega .bt-card{width:min(92vw,390px);background:#1d1418;box-shadow:0 0 0 2px #ffc85a,0 0 0 4px #120c10,0 12px 40px rgba(0,0,0,.7);padding:14px;display:flex;flex-direction:column;gap:8px;animation:sale .35s var(--molla)}" +
    "#bottega h2{margin:0;font-family:Silkscreen,var(--font);font-size:20px;color:#ffd27a;display:flex;align-items:center;gap:8px}" +
    "#bottega h2 b{margin-left:auto;color:#fff;font-size:22px}" +
    "#bottega .bt-sub{font-size:12px;color:#d8d4ea;line-height:1.35}" +
    "#bottega .bt-oro{font-family:Silkscreen,var(--font);font-size:13px;color:#ffd27a}" +
    "#bottega .bt-o{display:flex;align-items:center;gap:10px;min-height:56px;border:0;background:#2a2028;color:#f4f2fb;text-align:left;padding:6px 10px;box-shadow:inset 0 -3px 0 #120c10,0 0 0 2px #4a3630;font:inherit}" +
    "#bottega .bt-o .nm{font-family:Silkscreen,var(--font);font-size:14px;display:block}" +
    "#bottega .bt-o .ef{font-size:11.5px;color:#cfc9e2;display:block;line-height:1.3}" +
    "#bottega .bt-o .pr{margin-left:auto;font-family:Silkscreen,var(--font);font-size:16px;color:#ffd27a;white-space:nowrap}" +
    "#bottega .bt-o[disabled]{opacity:.38}" +
    "#bottega .bt-o.scelto{background:#3a3010;box-shadow:inset 0 -3px 0 #120c10,0 0 0 3px #ffc85a}" +
    "#bottega .bt-o.niente{min-height:40px;justify-content:center;font-family:Silkscreen,var(--font)}" +
    "#bottega .bt-es{display:flex;flex-direction:column;gap:3px;font-size:13px}" +
    "#bottega .bt-es div{display:flex;align-items:center;gap:6px}";
  document.head.appendChild(st);
})();
function avIc(k, piccola) { return '<span class="av-ic' + (piccola ? " s" : "") + '" style="background-position:' + AV_IC[k] * 20 + '% 0"></span>'; }

// ── immagini e carte ──
const caricaPrimaAvv = caricaTutto;
caricaTutto = async function () { await caricaPrimaAvv(); PIX.img.avventura = await carica("pix/avventura.png"); };
const cartaPixPrimaAvv = cartaPix;
cartaPix = function (c) {
  if (c.t !== "uovo" && c.t !== "bivio") return cartaPixPrimaAvv(c);
  const k = "carta|av|" + c.t; if (PIX.cache.has(k)) return PIX.cache.get(k);
  const P = PIX.meta.pal, w = 26, h = 34, cv2 = tela(w, h), x = cv2.getContext("2d");
  x.fillStyle = "rgb(" + P.notte + ")"; x.fillRect(1, 0, w - 2, h); x.fillRect(0, 1, w, h - 2);
  x.fillStyle = "rgb(" + (c.t === "uovo" ? P.d3 : P.t1) + ")"; x.fillRect(2, 1, w - 4, 1); x.fillRect(2, h - 2, w - 4, 1); x.fillRect(1, 2, 1, h - 4); x.fillRect(w - 2, 2, 1, h - 4);
  x.fillStyle = "rgb(" + (c.t === "uovo" ? P.d0 : P.g1) + ")"; x.fillRect(2, 2, w - 4, h - 4);
  if (PIX.img.avventura) x.drawImage(PIX.img.avventura, AV_IC[c.t === "uovo" ? "UOVO" : "BIVIO"] * 16, 0, 16, 16, 5, 11, 16, 16);
  if (c.t === "uovo") pixTesto(x, "12", 3, 3, P.o3, 1, true, "l");
  PIX.cache.set(k, cv2); return cv2;
};

// ── il sentiero con le due vie: colonne e corsie ──
function colonne() {
  const s = (V && V.strada) || [], col = [], lane = [];
  let c = -1, biv = -1;
  for (let i = 0; i < s.length; i++) {
    const r = s[i].ramo;
    if (r && biv >= 0) { col.push(biv + 1); lane.push(r === "sx" ? -1 : 1); c = biv + 1; continue; }
    c += 1; col.push(c); lane.push(0);
    biv = s[i].t === "bivio" ? c : -1;
  }
  return { col, lane, ultima: c };
}
function colF(i, C) {
  if (i < 0) return i;
  const n = C.col.length, k = (j) => (j < n ? C.col[j] : C.ultima + (j - n + 1)), l = (j) => (j < n ? C.lane[j] : 0);
  const a = Math.floor(i), q = i - a;
  return { c: k(a) + (k(a + 1) - k(a)) * q, l: l(a) + (l(a + 1) - l(a)) * q };
}
const posTPrimaAvv = posT;
posT = function (i, g) {
  if (!AVV()) return posTPrimaAvv(i, g);
  const C = colonne(), L = lay(g), v = S.vistaI == null ? S.gruppo : S.vistaI;
  if (i === V.strada.length && V.strada.length && V.strada[i - 1].t === "bivio") return { x: -999, y: -999 };   // al bivio la tessera dopo sono le due vie
  const a = i < 0 ? { c: i, l: 0 } : colF(i, C), b = v < 0 ? { c: v, l: 0 } : colF(v, C);
  return { x: Math.round(L.XG + (a.c - b.c) * L.STEP), y: Math.round(L.FL - 6 + (a.c - b.c) * L.DROP + a.l * LANE) };
};
// i ladri: chi ha preso una via sta sulla sua ultima tessera (o al bivio, gia' spostato verso la sua via)
const posBotPrimaAvv = posBot;
function lati() { return AVV() && V.giocatori.some((p) => p.ramo && (p.dentro || S.tenuti.has(p.sg))); }
function posBotVero(sg, g, gx, gy) {
  const p = V.giocatori[sg];
  if (!p || !p.ramo || !lati()) return posBotPrimaAvv(sg, g, gx, gy);
  const s = V.strada; let j = -1, biv = -1;
  for (let i = s.length - 1; i >= 0; i--) { if (j < 0 && s[i].ramo === p.ramo) j = i; if (s[i].t === "bivio") { biv = i; break; } }
  const base = j >= 0 && j <= S.gruppo ? posT(j, g) : (() => { const q = posT(Math.max(0, biv), g); return { x: q.x + 6, y: q.y + (p.ramo === "sx" ? -1 : 1) * LANE }; })();
  const gr = nelGruppo().filter((x) => V.giocatori[x].ramo === p.ramo), k = gr.length, jj = Math.max(0, gr.indexOf(sg));
  const rig = k > 4 ? 2 : 1, per = Math.ceil(k / rig), r = Math.floor(jj / per), c = jj % per, nr = r === rig - 1 ? k - per * (rig - 1) : per;
  return { x: Math.round(base.x + (c - (nr - 1) / 2) * 17 + (rig === 2 ? (r ? 4 : -4) : 0)), y: Math.round(base.y + 6 + (rig === 2 ? (r ? 4 : -5) : 0)), bh: 30, riga: r, righe: rig };
}
S.liscio = {};
posBot = function (sg, g, gx, gy) {
  const v = posBotVero(sg, g, gx, gy);
  if (!AVV() || RM) return v;
  const l = S.liscio[sg];
  if (!l || !S.liscioOn) return v;
  return Object.assign({}, v, { x: Math.round(l.x), y: Math.round(l.y) });
};
// prima di ogni fotogramma: le posizioni scivolano verso la meta (il gruppo si divide e si riunisce camminando)
function aggiornaLiscio() {
  const on = AVV() && V.strada.some((c) => c.t === "bivio");
  S.liscioOn = on;
  if (!on) { S.liscio = {}; return; }
  const g = geo(), { gx, gy } = centroGruppo(g);
  for (const sg of nelGruppo()) {
    const m = posBotVero(sg, g, gx, gy), l = S.liscio[sg];
    if (!l) S.liscio[sg] = { x: m.x, y: m.y };
    else { l.x += (m.x - l.x) * .14; l.y += (m.y - l.y) * .14; if (Math.abs(m.x - l.x) < .5 && Math.abs(m.y - l.y) < .5) { l.x = m.x; l.y = m.y; } }
  }
}
// ordine di disegno: prima la via in alto, poi il resto, poi la via in basso
const nelGruppoPrimaAvv = nelGruppo;
nelGruppo = function () {
  const g = nelGruppoPrimaAvv();
  if (!lati()) return g;
  const o = (sg) => { const r = V.giocatori[sg].ramo; return r === "sx" ? 0 : r === "dx" ? 2 : 1; };
  return g.slice().sort((a, b) => o(a) - o(b) || a - b);
};

// ── disegni in scena: le vie fantasma al bivio, le etichette delle vie, l'uovo in braccio ──
function scenaAvv(g, t) {
  if (!AVV() || !PIX.meta || !PIX.img.avventura) return;
  const P = PIX.meta.pal, s = V.strada, n = s.length, A = PIX.img.avventura;
  cx.save(); cx.beginPath(); cx.rect(0, PIX.hudB || 0, g.W, Math.max(0, (PIX.zonaTop || g.H) + 40 - (PIX.hudB || 0))); cx.clip();
  // il BIVIO: finche' si sceglie, davanti al gruppo una «Y» con le due vie (SX in alto, DX in basso) e il cartello;
  // poi, a gruppi divisi, ogni via ha la sua etichetta a sinistra del suo gruppetto
  let biv = -1; for (let i = n - 1; i >= 0; i--) { if (s[i].t === "bivio") { biv = i; break; } if (!s[i].ramo) break; }
  if (biv >= 0) {
    const pb = posT(biv, g), gr = nelGruppo(), cam = 0;
    const lato = (r) => (r === "sx" ? -1 : 1), colL = (r) => (r === "sx" ? P.o3 : P.cie);
    const divisi = gr.some((sg) => V.giocatori[sg].ramo);
    if (biv === n - 1 && !divisi && !S.crollo) {
      let xr = pb.x + 12; const gg = geo(), { gx, gy } = centroGruppo(gg);
      for (const sg of gr) xr = Math.max(xr, posBot(sg, gg, gx, gy).x + 11);
      const y0 = pb.y - 2, lun = 16, puls = Math.floor(t * 3) % 2;
      for (const r of ["sx", "dx"]) {
        for (let k = 0; k <= lun; k++) { const yy = Math.round(y0 + lato(r) * LANE * k / lun); pxc(cx, P.nero, xr + k, yy, 2, 3); pxc(cx, k % 4 < 2 || puls ? colL(r) : P.g3, xr + k, yy + 1, 2, 1); }
        pixTesto(cx, av(r + "C"), xr + lun + 4, Math.round(y0 + lato(r) * LANE - 3), colL(r), 1, true, "l");
      }
      cx.drawImage(A, AV_IC.BIVIO * 16, 0, 16, 16, xr - 6, y0 - 34, 16, 16);
    } else if (divisi) {
      const gg = geo(), { gx, gy } = centroGruppo(gg);
      for (const r of ["sx", "dx"]) {
        const mem = gr.filter((sg) => V.giocatori[sg].ramo === r); if (!mem.length) continue;
        const ps = mem.map((sg) => posBot(sg, gg, gx, gy)), x = Math.min(...ps.map((q) => q.x)) - 11, y = Math.max(...ps.map((q) => q.y)) - 10;
        pixTesto(cx, av(r + "C"), x - 2, y, colL(r), 1, true, "r");
      }
    }
  }
  // l'uovo in braccio a chi lo porta, con un alone rosso che pulsa
  for (const p of V.giocatori) {
    if (!p.uovo || !p.dentro || !nelGruppo().includes(p.sg)) continue;
    const q = puntoDi(p.sg)(), pul = .3 + .2 * Math.sin(t * 6);
    cx.globalCompositeOperation = "lighter"; cx.globalAlpha = pul; cx.drawImage(pozza(10, P.d3), Math.round(q.x + 6 - 10), Math.round(q.y + 6 - 10)); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
    cx.drawImage(A, AV_IC.uovo_piccolo * 16, 0, 16, 16, Math.round(q.x - 2), Math.round(q.y - 2), 16, 16);
  }
  cx.restore();
}
const disegnaPrimaAvv = disegna;
disegna = function () {
  if (V && PIX.meta) { try { aggiornaLiscio(); } catch (e) { console.warn(e); } }
  disegnaPrimaAvv();
  if (V && PIX.meta) { try { scenaAvv(geo(), SIM); } catch (e) { console.warn(e); } }
};

// ── suoni ──
function suonoAvv(tipo) {
  const c = ac(); if (!c) return; mix(); const t = c.currentTime, g = c.createGain(); g.connect(MIX.master || c.destination);
  const nota = (f, t0, d, v, tp) => { const o = c.createOscillator(), gg = c.createGain(); o.type = tp || "triangle"; o.frequency.value = f; o.connect(gg); gg.connect(g); gg.gain.setValueAtTime(.001, t + t0); gg.gain.exponentialRampToValueAtTime(v, t + t0 + .02); gg.gain.exponentialRampToValueAtTime(.001, t + t0 + d); o.start(t + t0); o.stop(t + t0 + d + .05); };
  g.gain.value = 1;
  if (tipo === "uovo") { nota(330, 0, .5, .12, "sine"); nota(311, .18, .7, .1, "sine"); nota(196, .4, 1, .1, "sawtooth"); }
  else if (tipo === "bivio") { nota(392, 0, .25, .1); nota(523, .12, .25, .1); nota(392, .24, .25, .08); }
  else if (tipo === "bottega") { for (let k = 0; k < 4; k++) nota(988 + k * 120, k * .06, .2, .07, "square"); }
  else if (tipo === "compra") { nota(1318, 0, .12, .1, "square"); nota(1760, .07, .2, .1, "square"); }
  else if (tipo === "ninna") { [523, 440, 392, 330].forEach((f, k) => nota(f, k * .28, .5, .1, "sine")); }
  else if (tipo === "scudo") { nota(220, 0, .15, .2, "square"); nota(880, .02, .4, .1, "triangle"); }
  else if (tipo === "torcia") { const n = rumore(c, .4), f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; n.connect(f); f.connect(g); g.gain.setValueAtTime(.2, t); g.gain.exponentialRampToValueAtTime(.001, t + .4); n.start(t); }
}

// ── pannello sopra i tasti: UOVO (prendi/lascia), BIVIO (sinistra/destra), TORCIA ──
function pannelloAv() {
  let p = $("pannello-av"); if (p) return p;
  p = document.createElement("div"); p.id = "pannello-av"; p.hidden = true; $("azioni").prepend(p); return p;
}
function mandaAv(a, ax) { ac(); if (ws && ws.readyState === 1) ws.send(JSON.stringify(ax === undefined ? { a } : { a, ax })); }
const apriPannelloPrimaAvv = apriPannello;
apriPannello = function (e) {
  if (e.tipo !== "UOVO") return apriPannelloPrimaAvv(e);
  const p = pannello(), io = V.io;
  if (!e.chi.includes(io)) { p.hidden = true; return; }
  p.innerHTML = '<div class="sp-tit">' + avIc("UOVO") + av("uovo") + '<b id="sp-t">5</b></div><div class="sp-reg">' + av("uovoReg") + "</div>" +
    '<div class="sp-bt"><button class="sp-b rosso" data-a="uovo" data-x="1">' + av("prendi") + ' <small>+12</small></button><button class="sp-b" data-a="uovo" data-x="0">' + av("lascia") + "</button></div>";
  p.hidden = false;      // anche in automatico (video): si vede cosa si sceglie
  p.querySelectorAll(".sp-b").forEach((b) => (b.onclick = () => { if (AUTO) return; mandaAv(b.dataset.a, +b.dataset.x); p.querySelectorAll(".sp-b").forEach((x) => x.classList.toggle("scelto", x === b)); }));
  const fine = performance.now() + (e.fino || 5) * 1000;
  clearInterval(apriPannello.k); apriPannello.k = setInterval(() => { const r = Math.max(0, Math.ceil((fine - performance.now()) / 1000)); const el = $("sp-t"); if (el) el.textContent = r; if (!r) clearInterval(apriPannello.k); }, 200);
};
function aggiornaPannelloAv() {
  const p = pannelloAv(), me = V.giocatori[V.io] || {};
  const bivio = AVV() && V.bivio && V.fase === "scelta" && me.dentro && !V.fine;
  const torcia = AVV() && V.puo_faro && V.fase === "scelta" && !V.fine && !AUTO;   // in automatico la usa il bot da solo
  const chiave = (bivio ? "b" + (me.scelta || "") : "") + (torcia ? "t" : "") + LINGUA;
  if (!bivio && !torcia) { if (!p.hidden) { p.hidden = true; p.dataset.k = ""; } $("b-giu").style.visibility = ""; return; }
  $("b-giu").style.visibility = bivio ? "hidden" : "";
  if (bivio && !AUTO) { $("b-giu").disabled = true; }
  if (p.dataset.k === chiave) return; p.dataset.k = chiave;
  let h = "";
  if (bivio) h += '<div class="sp-tit">' + avIc("BIVIO") + av("bivio") + '</div><div class="sp-reg">' + av("vieReg") + '</div><div class="sp-bt">' +
    '<button class="sp-b lato" data-a="sx" style="--c:#ffd27a">⬈ ' + av("sx") + '</button><button class="sp-b lato" data-a="dx" style="--c:#59b6ff">⬊ ' + av("dx") + "</button></div>";
  if (torcia) h += '<div class="sp-bt"><button class="sp-b" data-a="faro" style="--c:#ff9a52">' + avIc("TORCIA", 1) + " " + av("usaTorcia") + "</button></div>";
  p.innerHTML = h; p.hidden = false;
  p.querySelectorAll(".sp-b").forEach((b) => { if (b.dataset.a === me.scelta) b.classList.add("scelto"); b.onclick = () => { if (AUTO) return; mandaAv(b.dataset.a); if (b.dataset.a !== "faro") p.querySelectorAll(".lato").forEach((x) => x.classList.toggle("scelto", x === b)); }; });
}
// tasti: al bivio ← A = sinistra, → E = destra; T = torcia
addEventListener("keydown", (ev) => {
  if (!AVV() || ev.ctrlKey || ev.metaKey || ev.altKey || !$("velo").hidden) return;
  const k = ev.key.toLowerCase(), me = V.giocatori[V.io] || {};
  if (V.fase === "scelta" && V.bivio && me.dentro) {
    if (k === "arrowleft" || k === "a") { mandaAv("sx"); ev.preventDefault(); ev.stopImmediatePropagation(); }
    else if (k === "arrowright" || k === "e" || k === "d") { mandaAv("dx"); ev.preventDefault(); ev.stopImmediatePropagation(); }
    else if (k === "arrowdown" || k === "s") { ev.preventDefault(); ev.stopImmediatePropagation(); }
  }
  if (k === "t" && V.puo_faro) { mandaAv("faro"); ev.preventDefault(); }
}, true);

// ── la BOTTEGA ──
const BOT = { fine: 0, k: null };
function bottegaEl() { let b = $("bottega"); if (!b) { b = document.createElement("div"); b.id = "bottega"; b.hidden = true; document.getElementById("app").appendChild(b); } return b; }
function apriBottega(e) {
  const b = bottegaEl(), io = V.io, oro = e.cassa[io] || 0, P = e.prezzi;
  $("velo").hidden = true;
  let h = '<div class="bt-card"><h2>' + avIc("TORCIA") + av("bottega") + '<b id="bt-t">' + Math.ceil(e.fino) + '</b></h2><div class="bt-sub">' + av("botSub") + '</div><div class="bt-oro">' + av("tuoForziere") + ": " + oro + "</div>";
  OGGETTI_AV.forEach((x, i) => {
    h += '<button class="bt-o" data-x="' + (i + 1) + '"' + (oro < P[x] ? " disabled" : "") + ">" + avIc(x) + '<span><span class="nm">' + av(x) + '</span><span class="ef">' + av(x + "r") + '</span></span><span class="pr">-' + P[x] + "</span></button>";
  });
  h += '<button class="bt-o niente" data-x="0">' + av("niente") + '</button><div class="bt-es"></div></div>';
  b.innerHTML = h; b.hidden = false; suonoAvv("bottega");
  b.querySelectorAll(".bt-o").forEach((el) => (el.onclick = () => {
    if (AUTO || el.disabled) return; mandaAv("compra", +el.dataset.x); suonoAvv("compra");
    b.querySelectorAll(".bt-o").forEach((y) => y.classList.toggle("scelto", y === el));
  }));
  BOT.fine = performance.now() + e.fino * 1000;
  clearInterval(BOT.k); BOT.k = setInterval(() => { const r = Math.max(0, Math.ceil((BOT.fine - performance.now()) / 1000)), el = $("bt-t"); if (el) el.textContent = r; if (!r) clearInterval(BOT.k); }, 200);
  log("<b style=\"color:#ffd27a\">" + av("bottega") + "</b> · " + av("botSub"));
}
function esitoBottega(e) {
  const b = bottegaEl(), acq = Object.entries(e.acquisti).map(([s, x]) => [+s, x]);
  clearInterval(BOT.k); const t = $("bt-t"); if (t) t.textContent = "✓";
  const mio = acq.find(([s]) => s === V.io);
  b.querySelectorAll(".bt-o").forEach((el) => { el.disabled = true; el.classList.toggle("scelto", mio ? +el.dataset.x === OGGETTI_AV.indexOf(mio[1]) + 1 : +el.dataset.x === 0); });
  const es = b.querySelector(".bt-es");
  if (es) es.innerHTML = "<b>" + av("comprano") + "</b>" + (acq.length ? acq.map(([s, x]) => "<div>" + avIc(x, 1) + nomeCol(s) + " · " + av(x) + "</div>").join("") : "<div>" + av("nessunoCompra") + "</div>");
  if (acq.length) suonoAvv("compra");
  acq.forEach(([s, x]) => { storia(s, av("bottega") + ": " + av(x)); contatore(s, "cassa", -V.prezzi[x], "#ff9a52", "-" + V.prezzi[x]); });
  log(av("comprano") + ": " + (acq.length ? acq.map(([s, x]) => nomeCol(s) + " " + av(x)).join(" · ") : av("nessunoCompra")));
  setTimeout(() => { b.hidden = true; }, 1500);
}

// ── gli eventi ──
const eventoPrimaAvv = evento;
evento = function (e, anima) {
  eventoPrimaAvv(e, anima);
  if (!anima || !AVV()) return;
  const P = PIX.meta ? PIX.meta.pal : null;
  if (e.k === "carta") {
    const c = e.carta, i = e.prof - 1;
    if (e.ramo) log("<b>" + av("via", e.ramo) + "</b>");
    if (e.riuniti) { dopo(.3, () => annuncia(av("riuniti"), "", 1300)); log(av("riuniti")); }
    if (c.t === "uovo") {
      dopo(1.2, () => { suonoAvv("uovo"); annuncia(av("uovo") + " +12", av("uovoBreve"), 2400, "rosso"); });
      log('<b style="color:#ff8a80">' + av("uovo") + "</b> · " + av("uovoSub"));
    }
    if (c.t === "bivio") {
      dopo(1.2, () => { suonoAvv("bivio"); annuncia(av("bivio"), e.vuota ? (LINGUA === "it" ? "sei solo: nessuna scelta" : "you're alone: no choice") : av("bivioBreve"), 2400, "oro"); });
      log('<b style="color:#ffd27a">' + av("bivio") + "</b> · " + av("bivioSub"));
    }
    if (c.t === "pericolo" && e.per_uovo != null && e.crollo) { dopo(.9, () => annuncia(av("perUovo"), av("perUovoSub"), 1500, "rosso")); log('<b style="color:#ff8a80">' + av("perUovo") + "</b> · " + nomeCol(e.per_uovo)); }
    if (e.uovo_perso != null) log(nomeCol(e.uovo_perso) + " · " + av("uovoPerso"));
    if (e.ninna != null) {
      dopo(1.6, () => { suonoAvv("ninna"); annuncia(av("NINNA") + "!", av("ninnaSub", nome(e.ninna)), 2600, "oro"); S.lampo = .4; S.lampoCol = "180,160,255"; for (let k = 0; k < 4; k++) S.scritte.push({ txt: "Z", col: "#b3a6ff", p: ((kk) => () => { const q = puntoDi(e.ninna)(); return { x: q.x + kk * 6, y: q.y - 18 - kk * 5 }; })(k), t0: SIM + k * .25, dur: 1.6, px: .14 }); });
      log('<b style="color:#b3a6ff">' + av("NINNA") + "</b> · " + av("ninnaSub", nomeCol(e.ninna)));
    }
    if (e.scudo) {
      Object.entries(e.scudo).forEach(([s, q]) => {
        const sg = +s; if (!q) return;
        attendi(sg, 1);
        dopo(1.2 + TW.colpo + 1.5, () => { suonoAvv("scudo"); contatore(sg, "sacco", -q, "#59b6ff", null); contatore(sg, "cassa", q, "#59b6ff", "+" + q); fatto(sg); annuncia(av("SCUDO"), av("scudoSalva", nome(sg), q), 1800, "oro"); });
        log(avIc("SCUDO", 1) + " " + av("scudoSalva", nomeCol(sg), q));
      });
    }
  }
  if (e.k === "speciale_aperta" && e.tipo === "UOVO") { annuncia(av("uovo"), av("uovoRegBreve"), 2200, "rosso"); }
  if (e.k === "speciale_esito" && e.tipo === "UOVO") {
    pannello().hidden = true;
    // sopra la testa solo chi PRENDE (a scacchiera se sono in due): le scritte non si accavallano
    Object.entries(e.scelte).filter(([, x]) => x).forEach(([s], j) => S.scritte.push({ txt: av("prendi"), col: "#ff6b60", p: ((jj) => () => { const q = puntoDi(+s)(); return { x: q.x, y: q.y - 6 - (jj % 2) * 9 }; })(j), t0: SIM, dur: 1.6, px: .14 }));
    if (e.esito === "preso") {
      const sg = e.chi; S.hop[sg] = SIM + .5;
      dopo(.5, () => { suonoAvv("uovo"); annuncia(av("preso", nome(sg)), av("presoSub"), 2400, "rosso"); S.lampo = .35; S.lampoCol = "255,80,70"; });
      storia(sg, av("uovo"));
    } else dopo(.5, () => annuncia(av(e.esito), "", 1600, e.esito === "conteso" ? "rosso" : ""));
    log(Object.entries(e.scelte).map(([s, x]) => nomeCol(+s) + " " + (x ? av("prendi") : av("lascia"))).join(" · ") + " → " + (e.esito === "preso" ? av("preso", nomeCol(e.chi)) : av(e.esito)));
  }
  if (e.k === "scelta_aperta" && e.bivio) annuncia(av("bivio"), av("vieBreve"), 2000, "oro");
  if (e.k === "uscite") {
    if (e.rami) {
      const r = Object.entries(e.rami).map(([s, x]) => [+s, x]);
      const sx = r.filter(([, x]) => x === "sx").map(([s]) => s), dx = r.filter(([, x]) => x === "dx").map(([s]) => s);
      dopo(.7, () => annuncia(av("vie"), av("sx") + ": " + (sx.map(nome).join(", ") || "-") + " · " + av("dx") + ": " + (dx.map(nome).join(", ") || "-"), 2200, "oro"));
      log(av("sx") + ": " + (sx.map(nomeCol).join(", ") || "-") + " · " + av("dx") + ": " + (dx.map(nomeCol).join(", ") || "-"));
    }
    if (e.uova) Object.entries(e.uova).forEach(([s, q]) => { dopo(1.2, () => { suonoAvv("uovo"); annuncia(av("salvo") + " +" + q, nome(+s), 2000, "oro"); }); storia(+s, av("salvo") + " +" + q); log(nomeCol(+s) + " · " + av("salvo") + " +" + q); });
  }
  if (e.k === "faro") {
    const c = e.carta, txt = c.t === "pericolo" ? NP(c.v) : c.t === "perla" ? c.v + " " + t_("perle") : c.t === "uovo" ? av("uovo") : c.t === "bivio" ? av("bivio") : t_("rel") + " " + c.v;
    suonoAvv("torcia"); annuncia(av("torciaVede"), txt, 2600, c.t === "pericolo" ? "rosso" : "oro"); log(avIc("TORCIA", 1) + " " + av("torciaVede") + " <b>" + txt + "</b>");
  }
  if (e.k === "bottega_aperta") apriBottega(e);
  if (e.k === "bottega_esito") esitoBottega(e);
};

// ── interfaccia: oggetto e uovo sui gettoni, pannello, riga di fase, avviso, mazzo, regole ──
const aggiornaGiocatoriPrimaAvv = aggiornaGiocatori;
aggiornaGiocatori = function () {
  aggiornaGiocatoriPrimaAvv();
  if (!V || !AVV()) return;
  document.querySelectorAll(".gioc").forEach((el) => {
    const p = V.giocatori[+el.dataset.sg]; if (!p) return;
    const k = (p.uovo ? "U" : "") + (p.ogg || ""); if (el.dataset.av === k) return; el.dataset.av = k;
    let b = el.querySelector(".av-b"); if (!b) { b = document.createElement("span"); b.className = "av-b"; el.querySelector(".foto").appendChild(b); }
    b.innerHTML = (p.uovo ? avIc("uovo_piccolo", 1) : "") + (p.ogg ? avIc(p.ogg, 1) : "");
  });
  if (V.fase === "bottega" && V.bottega) document.querySelectorAll(".gioc").forEach((el) => el.classList.toggle("scelto", V.bottega.scelto.includes(+el.dataset.sg)));
};
const aggiornaAzioniPrimaAvv = aggiornaAzioni;
aggiornaAzioni = function () {
  aggiornaAzioniPrimaAvv();
  try {
    if (!V) return;
    document.body.classList.toggle("avv", AVV());
    aggiornaPannelloAv();
    // l'uovo: la propria scelta (anche quella automatica) si accende sul pannello
    if (V.pend && V.pend.tipo === "UOVO" && V.pend.mia != null) document.querySelectorAll('#pannello-sp .sp-b[data-a="uovo"]').forEach((b) => b.classList.toggle("scelto", +b.dataset.x === V.pend.mia));
  } catch (e) { console.warn(e); }
};
const aggiornaPolishPrimaAvv = aggiornaPolish;
aggiornaPolish = function () {
  aggiornaPolishPrimaAvv();
  if (!V || !AVV() || V.fine) return;
  const pr = $("prof"), me = V.giocatori[V.io] || {};
  if (!pr) return;
  const uovo = V.giocatori.some((p) => p.uovo && p.dentro);
  let riga = null;
  if (V.fase === "bottega" || V.fase === "bottega_fine") riga = av("rigaBottega");
  else if (V.fase === "scelta" && V.bivio && me.dentro && !me.scelta) riga = av("rigaBivio");
  if (riga || uovo) pr.innerHTML = "<b>" + (riga || pr.querySelector("b").textContent) + "</b><small>" + (uovo ? av("regolaUovo") : (LINGUA === "it" ? "2 segni uguali = il drago si sveglia" : "2 identical signs = the dragon wakes")) + "</small>";
  if (V.fase === "intro" && $("tav-sub") && !/·.*·/.test($("tav-sub").textContent)) $("tav-sub").textContent += " · " + av("modo");
};
const aggiornaPericoliPrimaAvv = aggiornaPericoli;
aggiornaPericoli = function () {
  aggiornaPericoliPrimaAvv();
  if (!AVV()) return;
  const k = V.composizione, h = [];
  if (k.uovo) h.push('<span class="z">' + av("uovo") + "</span><b>" + k.uovo + "</b>");
  if (k.bivio) h.push('<span class="z">' + av("bivio") + "</span><b>" + k.bivio + "</b>");
  if (h.length) $("mazzo").insertAdjacentHTML("beforeend", h.join(""));
  const ch = V.giocatori.find((p) => p.uovo && p.dentro), avv = $("avviso-segni");
  if (ch && avv) { avv.innerHTML = av("avvisoUovo", nome(ch.sg)); avv.classList.add("su"); }
};
const apriRegolePrimaAvv = apriRegole;
apriRegole = function () {
  apriRegolePrimaAvv();
  if (!AVV()) return;
  const it = LINGUA === "it", box = document.querySelector("#scheda .regole-px"); if (!box) return;
  const pz = V.prezzi || { TORCIA: 1, SCUDO: 2, NINNA: 5 };
  const righe = it ? [
    [avIc("UOVO"), "<b>Uovo del drago</b> (+12): tutti scelgono in segreto PRENDI o LASCIA; lo ottiene solo se lo prende <b>uno solo</b>. Finché chi lo porta è dentro, <b>ogni</b> segno sveglia il drago. Torna su per incassarlo."],
    [avIc("BIVIO"), "<b>Bivio</b>: al passo dopo scegli in segreto <b>SINISTRA</b> o <b>DESTRA</b> (o torna su). Ogni via scopre la sua carta: l'oro si divide solo fra chi l'ha presa. Il drago è uno: un segno vale per tutti. Poi le vie si riuniscono."],
    [avIc("TORCIA") + avIc("SCUDO") + avIc("NINNA"), "<b>Bottega</b> fra le spedizioni (6 s): compra un oggetto con l'oro del forziere, vale una spedizione. <b>Torcia</b> -" + pz.TORCIA + ": vedi di nascosto la prossima carta. <b>Scudo</b> -" + pz.SCUDO + ": al risveglio salvi metà. <b>Ninna nanna</b> -" + pz.NINNA + ": il primo risveglio non avviene, per tutti."],
  ] : [
    [avIc("UOVO"), "<b>Dragon egg</b> (+12): everyone secretly picks TAKE or LEAVE; you get it only if you're the <b>only</b> one taking it. While its carrier is inside, <b>any</b> sign wakes the dragon. Go back to cash it in."],
    [avIc("BIVIO"), "<b>Fork</b>: on the next step pick <b>LEFT</b> or <b>RIGHT</b> in secret (or go back). Each path reveals its own card: its gold is split only among those who took it. One dragon: a sign counts for everyone. Then the paths join again."],
    [avIc("TORCIA") + avIc("SCUDO") + avIc("NINNA"), "<b>Shop</b> between expeditions (6 s): buy one item with chest gold, it lasts one expedition. <b>Torch</b> -" + pz.TORCIA + ": secretly see the next card. <b>Shield</b> -" + pz.SCUDO + ": keep half on a wake-up. <b>Lullaby</b> -" + pz.NINNA + ": the first wake-up doesn't happen, for everyone."],
  ];
  box.insertAdjacentHTML("beforeend", righe.map(([i, t]) => '<div class="r-px"><div class="r-ic">' + i + '</div><div class="r-tx">' + t + "</div></div>").join(""));
};
$("b-regole").onclick = apriRegole;
