// NON SVEGLIARE IL DRAGO - L'UOVO D'ORO (18/11, richiesta del proprietario: «molto VISIBILE e DORATO; chi ci arriva lo
// prende e SCAPPA; vale tanto, ma devi rischiare tanto»). Si carica DOPO suoni.js e si accende solo in AVVENTURA.
// Regole (motore abisso_rt 2.1.0, UOVO_ORO / NIDO): UN uovo per partita, nel NIDO dopo `V.nido.a` carte girate. Da li', a ogni
// scelta, un quarto tasto: RUBA L'UOVO = torni su con l'uovo; in piu' nello stesso istante lo portate INSIEME e ve lo dividete.
// Mentre scappate l'OCCHIO DEL DRAGO pesca una carta a caso dal mazzo (senza toglierla): un SEGNO qualsiasi = vi vede, perdete
// uovo E sacco (l'uovo torna nel nido). Se no: sacco + quota dell'uovo in cassaforte. Chi scappa non raccoglie avanzi ne' reliquie.
// Vista: V.nido = {a, oro, stato: "nido"|"rubato", chi, prove, aperto, occhio}. Evento: "uscite".fuga = {ladri, occhio, vista,
// presi, sacchi, cassa, quota, resto, oro, nido}. Scena: nido + uovo che luccica (visibile da lontano, freccia al bordo),
// la presa, l'occhio che si spalanca, la corsa verso l'uscita, poi la cassaforte (momento d'oro) o la vampata (perdono tutto).
// Suoni: window.SUONI.suona (suoni.js, file di abisso_suoni_1711) con riserva sintetizzata. Per la scheda pre-partita:
// window.abVariante() e window.abVarianteNome(v) (la variante del TAVOLO, dal motore: V.variante).
"use strict";
(function () {
  if (typeof V === "undefined" && typeof evento !== "function") return;
  const UV = "20261118u";   // (la versione di pix/uovo.png: invariata)
  // 20/11 (il proprietario): l'uovo SOLO ALLA FINE del percorso. Il nido e' la FINE del sentiero (motore 2.2: V.nido.a passi,
  // V.prof = passi fatti, V.fondo_sentiero): li' AVANTI non c'e' piu', si sceglie RUBA L'UOVO o TORNA SU.
  const UT = {
    it: { uovo: "UOVO D'ORO", nido: "NIDO", alNido: (n) => n <= 0 ? "sei al nido!" : "nido fra " + n + (n === 1 ? " carta" : " carte"),
      ruba: "RUBA L'UOVO", rubaSub: (o, p) => "+" + o + " · occhio " + p + "%", rubaReg: (o, p) => "Torni su con l'uovo (+" + o + ", diviso fra chi lo ruba ora). Ma l'occhio del drago: se vede un segno (" + p + "%) perdi uovo E sacco.",
      chip: (o) => "UOVO D'ORO +" + o, chipNido: (n) => "in fondo al sentiero · fra " + n + (n === 1 ? " passo" : " passi"), chipApri: (p) => "RUBALO! occhio " + p + "%",
      fondo: "FINE DEL SENTIERO", fondoSub: (p) => "RUBA L'UOVO o TORNA SU · occhio " + p + "%",
      chipRubato: (n) => "rubato da " + n, prende: (n) => n + " AFFERRA L'UOVO!", prendono: (n) => n + " AFFERRANO L'UOVO!",
      occhio: "L'OCCHIO DEL DRAGO SI APRE", occhioSub: (p) => "se vede un segno: addio uovo e sacco (" + p + "%)",
      vede: "TI VEDE!", nonVede: "NON VI VEDE", salvo: "UOVO D'ORO IN SALVO!", salvoSub: (s) => s,
      presi: "IL DRAGO VI HA VISTI!", presiSub: (s, k) => s + (k > 1 ? ": perdono" : ": perde") + " l'uovo e il sacco", torna: "l'uovo torna nel nido",
      tutti: "chi scappa con l'uovo", diviso: (k, q, r) => "diviso in " + k + ": +" + q + " a testa" + (r ? " · " + r + " resta sul nido" : ""),
      storiaOk: (q) => "UOVO D'ORO +" + q, storiaKo: (b) => "UOVO: visto dal drago, -" + b,
      regola: (o, a) => "<b>Uovo d'oro</b> (+" + o + "): sta nel <b>nido</b>, in <b>fondo al sentiero</b> (dopo " + a + " passi: lo vedi luccicare in fondo). Lì il sentiero finisce: niente AVANTI, o <b>RUBI L'UOVO</b> (torni su con lui) o <b>TORNI SU</b>. Se lo rubate in più nello stesso momento ve lo dividete. Mentre scappate <b>l'occhio del drago</b> pesca una carta del mazzo: se è un <b>segno qualsiasi</b> vi vede e perdete uovo e sacco (l'uovo torna nel nido). Chi scappa con l'uovo non raccoglie avanzi né reliquie. Uno solo per partita.",
      classica: "Classica", avventura: "Avventura" },
    en: { uovo: "GOLDEN EGG", nido: "NEST", alNido: (n) => n <= 0 ? "you're at the nest!" : "nest in " + n + (n === 1 ? " card" : " cards"),
      ruba: "STEAL THE EGG", rubaSub: (o, p) => "+" + o + " · eye " + p + "%", rubaReg: (o, p) => "You go back up with the egg (+" + o + ", split among whoever steals it now). But the dragon's eye: if it sees a sign (" + p + "%) you lose the egg AND your sack.",
      chip: (o) => "GOLDEN EGG +" + o, chipNido: (n) => "at the end of the path · " + n + (n === 1 ? " step" : " steps"), chipApri: (p) => "STEAL IT! eye " + p + "%",
      fondo: "END OF THE PATH", fondoSub: (p) => "STEAL THE EGG or GO BACK · eye " + p + "%",
      chipRubato: (n) => "stolen by " + n, prende: (n) => n + " GRABS THE EGG!", prendono: (n) => n + " GRAB THE EGG!",
      occhio: "THE DRAGON'S EYE OPENS", occhioSub: (p) => "if it sees a sign: bye egg and sack (" + p + "%)",
      vede: "IT SEES YOU!", nonVede: "IT DOESN'T SEE YOU", salvo: "GOLDEN EGG SAFE!", salvoSub: (s) => s,
      presi: "THE DRAGON SAW YOU!", presiSub: (s, k) => s + (k > 1 ? ": they lose" : ": loses") + " the egg and the sack", torna: "the egg goes back to the nest",
      tutti: "egg thieves", diviso: (k, q, r) => "split " + k + " ways: +" + q + " each" + (r ? " · " + r + " stays on the nest" : ""),
      storiaOk: (q) => "GOLDEN EGG +" + q, storiaKo: (b) => "EGG: seen by the dragon, -" + b,
      regola: (o, a) => "<b>Golden egg</b> (+" + o + "): it sits in the <b>nest</b> at the <b>end of the path</b> (after " + a + " steps: you see it shine at the far end). There the path ends: no GO ON, either <b>STEAL THE EGG</b> (you go back with it) or <b>GO BACK</b>. Steal it together and you split it. As you run, <b>the dragon's eye</b> draws a card from the deck: if it's <b>any sign</b> it sees you and you lose egg and sack (the egg goes back to the nest). Egg thieves pick up no leftovers or relics. One per game.",
      classica: "Classic", avventura: "Adventure" } };
  const ut = (k, ...a) => { const v = UT[LINGUA === "en" ? "en" : "it"][k]; return typeof v === "function" ? v(...a) : v; };
  const AVV_ = () => typeof V !== "undefined" && V && V.variante === "avventura" && V.nido;
  window.abVariante = () => (typeof V !== "undefined" && V && V.variante) || null;
  window.abVarianteNome = (v) => ut(v === "avventura" ? "avventura" : "classica");
  const SU = (id, o, riserva) => { try { if (window.SUONI && SUONO.on && ac() && (mix(), window.SUONI.suona(id, o))) return; } catch (e) { } try { if (riserva) riserva(); } catch (e) { } };
  const pc = (x) => Math.round((x || 0) * 100);
  const FUGA = { R: null };
  window.FUGA_UOVO = FUGA;

  // ── stile: il tasto, il cartellino in alto, il distintivo della variante ──
  (function () {
    const st = document.createElement("style");
    st.textContent =
      "#b-uovo{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:46px;margin:0 0 6px;border:0;font:inherit;font-family:Silkscreen,var(--font);font-size:15px;color:#2a1600;" +
      "background:linear-gradient(180deg,#ffe468,#eeb22c 55%,#be7c1c);box-shadow:inset 0 -3px 0 #7e4a14,0 0 0 2px #120c10,0 0 18px rgba(255,200,80,.55);animation:uovo-pulsa 1.1s ease-in-out infinite;cursor:pointer}" +
      "#b-uovo small{font-size:11px;color:#5a3200;font-family:inherit}#b-uovo[hidden]{display:none}#b-uovo.scelto{box-shadow:inset 0 -3px 0 #7e4a14,0 0 0 3px #fff,0 0 26px rgba(255,220,120,.9)}" +
      "#b-uovo .uo-ic{width:14px;height:24px;background:url(pix/uovo.png?v=" + UV + ") -72px 0/192px 24px no-repeat;image-rendering:pixelated;flex:none}" +
      "#uovo-reg{font-size:11.5px;line-height:1.3;color:#ffe2a0;margin:-2px 0 6px;text-align:center}#uovo-reg[hidden]{display:none}" +
      "@keyframes uovo-pulsa{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}" +
      "#uovo-chip{position:absolute;right:6px;top:calc(var(--hudB,40px) + 4px);z-index:4;display:flex;align-items:center;gap:6px;padding:3px 8px 3px 4px;background:rgba(18,12,16,.82);" +
      "box-shadow:0 0 0 2px #ffc85a,0 0 14px rgba(255,200,80,.45);font-family:Silkscreen,var(--font);font-size:11px;color:#ffe27a;pointer-events:none;line-height:1.15}" +
      "#uovo-chip i{width:11px;height:18px;background:url(pix/uovo.png?v=" + UV + ") -54px 0/144px 18px no-repeat;image-rendering:pixelated;flex:none}" +
      "#uovo-chip small{display:block;font-size:9.5px;color:#f4e6c8}#uovo-chip.aperto{animation:uovo-pulsa .7s infinite;box-shadow:0 0 0 2px #fff,0 0 20px rgba(255,220,120,.9)}#uovo-chip.via{opacity:.6;box-shadow:0 0 0 1px #806030}" +
      "#uovo-chip[hidden]{display:none}" +
      ".ab-var{display:inline-block;margin-left:6px;padding:1px 6px;font-size:10px;font-family:Silkscreen,var(--font);color:#1a0d00;background:#ffc85a;vertical-align:middle;letter-spacing:.03em}" +
      ".ab-var.cl{background:#8fb7d8}";
    document.head.appendChild(st);
  })();
  const $u = (id) => document.getElementById(id);

  // ── immagini ──
  const caricaPrimaUovo = caricaTutto;
  caricaTutto = async function () { await caricaPrimaUovo(); PIX.img.uovo = await carica("pix/uovo.png?v=" + UV); };
  if (PIX && PIX.meta && !PIX.img.uovo) carica("pix/uovo.png?v=" + UV).then((i) => { PIX.img.uovo = i; });

  // ── il nido nella scena ──
  // 20/11: il nido e' in FONDO: subito dopo l'ultima colonna del sentiero (la colonna V.nido.a); la fuga parte da li'
  // (mezza colonna piu' in la': il nido non sta addosso al gruppo che ci arriva)
  const NIDO_D = .5, NIDO_I = () => V.strada.length + NIDO_D;
  function puntoNido(g) { const p = typeof posColonna === "function" ? posColonna((V.nido.a || 10) + NIDO_D, 0, g) : posT(V.strada.length, g); return { x: p.x, y: p.y + 6 }; }
  function uovoNelNido() {
    if (!AVV_()) return false;
    const R = FUGA.R;
    if (R) { const tt = SIM - R.t0; if (tt < .55) return true; return R.presi && tt > 3.75; }
    return V.nido.stato === "nido";
  }
  function disegnaUovo(x, y, t, grande, glow) {   // (x, y) = punto d'appoggio, in basso al centro
    const A = PIX.img.uovo; if (!A) return;
    if (glow) {
      const pul = .45 + .25 * Math.sin(t * 3.2) + (glow > 1 ? .25 : 0), r = grande ? 34 : 20;
      cx.globalCompositeOperation = "lighter"; cx.globalAlpha = Math.max(0, Math.min(1, pul));
      cx.drawImage(bagliore("255,196,80", .75), Math.round(x - r), Math.round(y - (grande ? 12 : 7) - r), r * 2, r * 2);
      cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
    }
    if (grande) { const fr = RM ? 0 : [0, 0, 0, 1, 2, 0][Math.floor(t * 5) % 6]; cx.drawImage(A, fr * 24, 0, 24, 24, Math.round(x - 12), Math.round(y - 23), 24, 24); }
    else cx.drawImage(A, 72, 0, 14, 24, Math.round(x - 7), Math.round(y - 20), 14, 24);
  }
  function scintille(x, y, t, n, raggio) {
    const A = PIX.img.uovo; if (!A || RM) return;
    for (let k = 0; k < n; k++) {
      const f = (t * .9 + k * .37) % 1; if (f > .5) continue;
      const a = k * 2.399 + Math.floor(t * .9 + k * .37) * 1.7, rr = raggio * (.55 + .45 * ((k * 7) % 5) / 4);
      cx.drawImage(A, f < .25 ? 120 : 128, 0, 8, 24, Math.round(x + Math.cos(a) * rr - 4), Math.round(y - 12 + Math.sin(a) * rr * .7 - 12), 8, 24);
    }
  }
  function disegnaNido(g, t) {
    const A = PIX.img.uovo, P = PIX.meta.pal; if (!A) return;
    const q = puntoNido(g), dentroVista = q.x < g.W - 10 && q.x > -20;
    if (dentroVista) {
      cx.drawImage(A, 86, 0, 34, 24, Math.round(q.x - 17), Math.round(q.y - 22), 34, 24);
      if (uovoNelNido()) {
        const ap = V.nido.aperto && V.fase === "scelta";
        disegnaUovo(q.x, q.y - 4, t, true, ap ? 2 : 1);
        scintille(q.x, q.y - 6, t, ap ? 6 : 4, 16);
        if (!V.fondo_sentiero) pixTesto(cx, "+" + V.nido.oro, q.x, q.y - 40, P.o3, 1, true, "c");
      }
    } else if (q.x >= g.W - 10 && uovoNelNido()) {
      // fuori schermo a destra (in fondo al sentiero): un faro al bordo, cosi' l'uovo si vede dalla prima carta
      const x = g.W - 12, y = Math.max((PIX.hudB || 0) + 30, Math.min(q.y - 6, (PIX.zonaTop || g.H) - 6)), b = RM ? 0 : Math.round(Math.sin(t * 4) * 2);
      disegnaUovo(x - 2 + b, y, t, false, 1);
      pixTesto(cx, "+" + V.nido.oro, x - 4, y - 32, P.o3, 1, true, "c");
      pixTesto(cx, ">", x + 6 + b, y - 12, P.o3, 1, true, "c");
    }
  }

  // ── la fuga: presa, occhio, corsa; poi cassaforte o vampata ──
  function posLadro(R, j, tt) {
    const g = geo(), n = R.ladri.length, dx = (j - (n - 1) / 2) * 11, ni = NIDO_I();
    let pos;
    if (tt < .55) pos = lerp(R.da, ni, ease(tt / .55));
    else if (tt < 2.05) pos = ni;
    else if (R.presi) pos = lerp(ni, ni - 1.2, ease((tt - 2.05) / .55));
    else pos = lerp(ni, -1, ease((tt - 2.05) / 1.35));
    const i0 = Math.floor(pos), qq = pos - i0, a = posT(i0, g), b = posT(i0 + 1, g);
    return { x: Math.round(lerp(a.x, b.x, qq) + dx), y: Math.round(lerp(a.y, b.y, qq) + 6) };
  }
  function disegnaFuga(g, t) {
    const R = FUGA.R; if (!R || !PIX.meta) return;
    const tt = SIM - R.t0, P = PIX.meta.pal, n = R.ladri.length;
    if (tt > R.fine) { FUGA.R = null; return; }
    const ps = R.ladri.map((sg, j) => posLadro(R, j, tt));
    R.ladri.forEach((sg, j) => {
      const p = ps[j];
      let fr;
      if (tt < .55) fr = "walk" + (Math.floor(tt * 9 + j) % 4);
      else if (tt < 2.05) fr = tt < 1.3 ? "festa0" : "idle" + (Math.floor(tt * 3) % 2);
      else if (R.presi && tt > 2.6) fr = "idle0";
      else fr = "back" + (Math.floor(tt * 12 + j) % 4);
      const via = R.presi ? Math.max(0, Math.min(1, (tt - 3.9) / .5)) : Math.max(0, Math.min(1, (tt - 3.45) / .3));
      cx.globalAlpha = 1 - via;
      if (window.CAM_ZERO && /^back/.test(fr)) { cx.save(); cx.translate(p.x, p.y); cx.scale(-1, 1); cx.drawImage(botPixBase(sg, "walk" + fr.slice(4)), -10, -30); cx.restore(); }
      else cx.drawImage(botPixBase(sg, fr), p.x - 10, p.y - 30);
      if (R.presi && tt > 2.75) {                     // bruciacchiati: fuliggine sopra lo sprite
        cx.globalAlpha = (1 - via) * Math.min(.6, (tt - 2.75) * 1.5); cx.fillStyle = "rgb(" + P.nero + ")";
        for (let yy = 0; yy < 28; yy += 2) for (let xx = ((yy / 2) % 2); xx < 16; xx += 2) cx.fillRect(p.x - 8 + xx, p.y - 30 + yy, 1, 1);
      }
      cx.globalAlpha = 1;
    });
    // l'uovo in braccio: sopra le teste, al centro se lo portano in piu' (lo tengono INSIEME)
    const portato = tt >= .55 && (R.presi ? tt < 2.85 : tt < 3.5);
    if (portato) {
      const mx = ps.reduce((a, p) => a + p.x, 0) / n, my = Math.min(...ps.map((p) => p.y)), su = tt < 1.3 ? ease((tt - .55) / .4) : 1;
      const yy = my - 30 - 8 * su + (RM ? 0 : Math.abs(Math.sin(tt * 12)) * (tt > 2.05 ? 2 : 0));
      if (n > 1) { cx.fillStyle = "rgb(" + P.t1 + ")"; cx.fillRect(Math.round(Math.min(...ps.map((p) => p.x))), Math.round(yy + 1), Math.round(Math.max(...ps.map((p) => p.x)) - Math.min(...ps.map((p) => p.x))), 1); }
      disegnaUovo(mx, yy + 4, t, true, 2);
      scintille(mx, yy, t, 3, 12);
      if (tt > 2.05 && !R.presi && !RM) for (let k = 1; k <= 3; k++) { cx.globalAlpha = .35 / k; disegnaUovo(mx + k * 7, yy + 4, t, false, 0); cx.globalAlpha = 1; }   // la scia
    }
    // il ritorno dell'uovo al nido (visti): vola in arco
    if (R.presi && tt >= 2.85 && tt < 3.75) {
      const k = ease((tt - 2.85) / .9), a = ps[0], b = puntoNido(g), x = lerp(a.x, b.x, k), y = lerp(a.y - 34, b.y - 4, k) - Math.sin(k * Math.PI) * 26;
      disegnaUovo(x, y, t, false, 1);
    }
    // la vampata sui ladri visti
    if (R.presi && tt > 2.5 && tt < 3.4) {
      const k = (tt - 2.5) / .9, x0 = g.W + 4, tgt = ps[ps.length - 1], lun = (x0 - tgt.x + 20) * Math.min(1, k * 2.2);
      for (let yy = -10; yy <= 10; yy += 2) {
        const w = lun * (1 - Math.abs(yy) / 14), cc = Math.abs(yy) < 3 ? P.f3 : Math.abs(yy) < 7 ? P.f2 : P.f1;
        cx.globalAlpha = (1 - Math.max(0, k - .7) / .3) * (.75 + .25 * Math.sin(tt * 40 + yy));
        cx.fillStyle = "rgb(" + cc + ")"; cx.fillRect(Math.round(x0 - w), Math.round(tgt.y - 16 + yy), Math.round(w), 2);
      }
      cx.globalAlpha = 1;
    }
  }
  // l'occhio del drago e la carta che pesca: sopra tutto (coordinate di schermo)
  function disegnaOcchio(g, t) {
    const R = FUGA.R; if (!R || !PIX.img.uovo) return;
    const tt = SIM - R.t0; if (tt < 1.15 || tt > 3.3) return;
    const A = PIX.img.uovo, P = PIX.meta.pal, ap = tt < 1.45 ? 0 : 1, sc = 2, w = 28 * sc, h = 24 * sc;
    const x = Math.round(g.W - w - 8), y = Math.round((PIX.hudB || 0) + 26);
    const alfa = Math.min(1, (tt - 1.15) / .2) * (1 - Math.max(0, (tt - 3.0) / .3));
    cx.globalAlpha = alfa;
    cx.globalCompositeOperation = "lighter"; cx.drawImage(bagliore(R.presi && tt > 2.05 ? "255,70,40" : "255,170,60", .6), x - 20, y - 14, w + 40, h + 28); cx.globalCompositeOperation = "source-over";
    cx.imageSmoothingEnabled = false; cx.drawImage(A, 136 + ap * 28, 0, 28, 24, x, y, w, h);
    // la pupilla guarda i ladri
    if (tt > 1.45 && R.ladri.length) { const p = posLadro(R, 0, tt), dx = Math.max(-6, Math.min(4, (p.x - (x + w / 2)) / 30)); cx.fillStyle = "rgb(" + P.nero + ")"; cx.fillRect(Math.round(x + w / 2 - 2 + dx), y + 10, 4, h - 20); }
    if (tt > 2.05 && R.vista) {                       // la carta pescata dall'occhio
      const c = cartaPix(R.vista); cx.drawImage(c, x - 34, y + 6);
      pixTesto(cx, R.presi ? ut("vede") : ut("nonVede"), x + w / 2 - 14, y + h + 4, R.presi ? P.f2 : P.o3, 1, true, "c");
    }
    cx.globalAlpha = 1;
  }

  function avviaFuga(e) {
    const f = e.fuga, R = { ladri: f.ladri.slice(), presi: !!f.presi, vista: f.vista, t0: SIM + .05, da: S.gruppo, fine: 4.6, f };
    FUGA.R = R;
    const nomi = R.ladri.map(nome).join(", "), k = R.ladri.length;
    R.ladri.forEach((sg) => { attendi(sg, 1); });
    const s0 = dopo;
    s0(.6, () => {
      SU("uovo", { riv: .3 }, () => suonoAvv && suonoAvv("uovo")); dopo(.15, () => SU("reliquia", null, () => suona("reliquia")));
      S.lampo = .45; S.lampoCol = "255,200,90";
      annuncia(k === 1 ? ut("prende", nomi) : ut("prendono", nomi), k > 1 ? ut("diviso", k, f.oro / k | 0, f.oro % k) : "+" + f.oro, 1500, "oro");
    });
    s0(1.2, () => { SU("ringhio", { vol: .9, riv: .5 }); dopo(.25, () => SU("orecchio", { vol: .9 }, () => suonoDrago && suonoDrago("orecchio"))); });
    s0(1.5, () => annuncia(ut("occhio"), ut("occhioSub", pc(f.occhio)), 1300, "rosso"));
    if (!R.presi) {
      s0(2.1, () => { SU("risalita", { vol: .9 }); for (let i = 0; i < 6; i++) dopo(i * .2, () => suona("passo")); });
      s0(3.5, () => {
        SU("reliquia", null, () => suona("reliquia")); dopo(.2, () => SU("evviva", { vol: .9 })); S.lampo = .9; S.lampoCol = "255,210,110"; S.scossa = Math.max(S.scossa || 0, 3);
        const righe = R.ladri.map((sg) => nome(sg) + " +" + ((f.cassa || {})[sg] || 0)).join(" · ");
        annuncia(ut("salvo"), righe + (f.resto ? " · " + ut("diviso", k, f.quota, f.resto) : ""), 2600, "oro");
        R.ladri.forEach((sg, j) => {
          const tot = (f.cassa || {})[sg] || 0, b = (f.sacchi || {})[sg] || 0;
          S.gemme.push({ col: "#ffc85a", grande: true, da: () => { const p = posLadro(R, j, SIM - R.t0); return { x: p.x, y: p.y - 40 }; }, a: () => { const p = posLadro(R, j, SIM - R.t0); return { x: p.x, y: p.y - 20 }; }, t0: SIM + j * .1, dur: .5, arco: .5,
            arriva: () => { SU("cassa", { vol: .9 }, () => suona("cassa")); contatore(sg, "sacco", -b, "#fff", null); contatore(sg, "cassa", tot, "#ffc85a", "+" + tot); } });
          storia(sg, ut("storiaOk", f.quota));
        });
      });
    } else {
      s0(2.1, () => { for (let i = 0; i < 3; i++) dopo(i * .15, () => suona("passo")); });
      s0(2.45, () => {
        try { if (window.SUONI) window.SUONI.ducka(-14, 2.4); } catch (x) { }
        SU("ruggito", { riv: .6 }, () => suonoRuggito && suonoRuggito()); dopo(.15, () => SU("fuoco", { riv: .5 }, () => suonoDrago && suonoDrago("fuoco")));
        S.lampo = .8; S.lampoCol = "255,80,50"; S.scossa = Math.max(S.scossa || 0, 6);
      });
      s0(2.9, () => {
        SU("bruciati");
        annuncia(ut("presi"), ut("presiSub", nomi, k), 2400, "rosso");
        R.ladri.forEach((sg) => { const b = (f.sacchi || {})[sg] || 0; if (b) contatore(sg, "sacco", -b, "#ff6b60", "-" + b); storia(sg, ut("storiaKo", b)); });
      });
      s0(3.8, () => log(ut("torna")));
    }
    s0(R.fine, () => { R.ladri.forEach((sg) => fatto(sg)); });
    log('<b style="color:#ffd27a">' + ut("uovo") + "</b> · " + R.ladri.map(nomeCol).join(", ") + " · " + (R.presi ? '<b style="color:#ff8a80">' + ut("presi") + "</b>" : ut("salvo") + " " + R.ladri.map((s) => "+" + ((f.cassa || {})[s] || 0)).join(" / ")));
  }

  // chi scappa con l'uovo non e' piu' nel gruppo (lo disegniamo noi)
  const nelGruppoPrimaUovo = nelGruppo;
  nelGruppo = function () { const gr = nelGruppoPrimaUovo(); const R = FUGA.R; return R ? gr.filter((sg) => !R.ladri.includes(sg)) : gr; };

  const disegnaPrimaUovo = disegna;
  disegna = function () {
    disegnaPrimaUovo();
    if (!AVV_() || !PIX.meta) return;
    try {
      const g = geo(), t = SIM, cam = Math.round(S.cam || 0);
      cx.save(); cx.beginPath(); cx.rect(0, PIX.hudB || 0, g.W, Math.max(0, (PIX.zonaTop || g.H) + 40 - (PIX.hudB || 0))); cx.clip(); cx.translate(0, -cam);
      disegnaNido(g, t); disegnaFuga(g, t);
      cx.restore();
      disegnaOcchio(g, t);
    } catch (e) { console.warn(e); }
  };

  // ── eventi ──
  const eventoPrimaUovo = evento;
  evento = function (e, anima) {
    eventoPrimaUovo(e, anima);
    if (e.k === "discesa") FUGA.R = null;
    if (!anima || !AVV_()) return;
    if (e.k === "carta" && e.nido) {
      dopo(1.3, () => { SU("uovo", { vol: .8, riv: .4 }); annuncia(ut("fondo") + " · " + ut("uovo") + " +" + V.nido.oro, ut("fondoSub", pc(V.nido.occhio)), 2400, "oro"); S.lampo = .3; S.lampoCol = "255,210,110"; });
      log('<b style="color:#ffd27a">' + ut("nido") + "!</b> · " + ut("rubaReg", V.nido.oro, pc(V.nido.occhio)));
    }
    if (e.k === "uscite" && e.fuga) avviaFuga(e);
  };

  // ── interfaccia: il tasto RUBA, il cartellino, la variante ──
  function tasto() {
    let b = $u("b-uovo"); if (b) return b;
    const box = $u("azioni"); if (!box) return null;
    box.insertAdjacentHTML("afterbegin", '<div id="uovo-reg" hidden></div><button id="b-uovo" hidden><span class="uo-ic"></span><span class="uo-t"></span><small></small></button>');
    b = $u("b-uovo");
    b.onclick = () => { if (AUTO || b.disabled) return; manda("uovo"); b.classList.add("scelto"); };
    return b;
  }
  function chip() {
    let c = $u("uovo-chip"); if (c) return c;
    const box = $u("scena-box"); if (!box) return null;
    box.insertAdjacentHTML("beforeend", '<div id="uovo-chip" hidden><i></i><span><b></b><small></small></span></div>');
    return $u("uovo-chip");
  }
  function varianteTesta() {
    const so = $u("sotto"); if (!so || !V || !V.variante) return;
    const k = V.variante === "avventura" ? "avventura" : "classica";
    let el = so.parentNode.querySelector(".ab-var");
    if (!el) { el = document.createElement("span"); el.className = "ab-var"; so.parentNode.appendChild(el); }
    if (el.dataset.k !== k + LINGUA) { el.dataset.k = k + LINGUA; el.textContent = ut(k).toUpperCase(); el.classList.toggle("cl", k !== "avventura"); }
  }
  const aggiornaAzioniPrimaUovo = aggiornaAzioni;
  aggiornaAzioni = function () {
    aggiornaAzioniPrimaUovo();
    try {
      if (!V) return;
      varianteTesta();
      const b = tasto(), r = $u("uovo-reg"), c = chip();
      if (!AVV_()) { if (b) b.hidden = true; if (r) r.hidden = true; if (c) c.hidden = true; return; }
      const me = V.giocatori[V.io] || {}, nd = V.nido, p = pc(nd.occhio);
      const puoi = nd.aperto && V.fase === "scelta" && me.dentro && !V.fine;
      if (b) {
        b.hidden = !puoi; b.disabled = !puoi || AUTO;
        if (puoi) {
          const n = V.giocatori.filter((x) => x.dentro).length;
          b.querySelector(".uo-t").textContent = ut("ruba"); b.querySelector("small").textContent = ut("rubaSub", nd.oro, p);
          b.classList.toggle("scelto", me.scelta === "uovo");
          if (r) { r.hidden = false; r.textContent = ut("rubaReg", nd.oro, p) + (n > 1 ? "" : ""); }
        } else if (r) r.hidden = true;
      }
      // 20/11: in fondo al sentiero AVANTI non c'e': restano RUBA L'UOVO (se c'e') e TORNA SU
      const gi = $u("b-giu");
      if (gi && V.fondo_sentiero && V.fase === "scelta") { gi.style.visibility = "hidden"; gi.disabled = true; }
      if (c) {
        const sentiero = V.prof != null ? V.prof : (V.strada ? V.strada.length : 0), manca = Math.max(0, nd.a - sentiero);
        c.hidden = V.fase === "intro" && !V.strada.length && V.discesa < 0;
        c.classList.toggle("aperto", !!nd.aperto && V.fase === "scelta");
        c.classList.toggle("via", nd.stato !== "nido");
        const hb = PIX && PIX.hudB ? PIX.hudB / ((cv.width || 1) / (cv.getBoundingClientRect().width || 1)) : 40;
        c.style.setProperty("--hudB", Math.round(hb) + "px");
        c.querySelector("b").textContent = ut("chip", nd.oro);
        c.querySelector("small").textContent = nd.stato !== "nido" ? ut("chipRubato", (nd.chi || []).map(nome).join(", ")) : nd.aperto && V.fase === "scelta" ? ut("chipApri", p) : nd.aperto ? ut("nido") : ut("chipNido", manca);
      }
    } catch (x) { console.warn(x); }
  };
  addEventListener("keydown", (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || !AVV_()) return;
    const k = ev.key.toLowerCase(), b = $u("b-uovo");
    if ((k === "u" || k === "e") && b && !b.hidden && !b.disabled) { b.click(); ev.preventDefault(); ev.stopImmediatePropagation(); }
  }, true);

  // la schermata pre-partita (intro.js): la riga dell'uovo dice l'UOVO D'ORO di oggi, con l'uovo d'oro come icona
  try {
    if (typeof IN_T !== "undefined") {
      const riga = { it: "Uovo d'oro nel nido, in fondo al sentiero: vale 30. Rubalo e scappa, ma se l'occhio del drago vede un segno perdi uovo e sacco",
        en: "Golden egg in the nest at the end of the path: worth 30. Steal it and run, but if the dragon's eye sees a sign you lose egg and sack" };
      for (const L of ["it", "en"]) { const r = IN_T[L] && IN_T[L].avv && IN_T[L].avv.find((x) => x[0] === "UOVO"); if (r) r[1] = riga[L]; }
      // 20/11: il bivio dura 3 passi, la bottega e' di tutti
      const riga2 = { it: { BIVIO: "Bivio: sinistra o destra per 3 passi. L'oro di una via è solo di chi la prende", TORCIA: "Bottega fra le spedizioni: ognuno compra torcia, scudo o ninna nanna col suo forziere" },
        en: { BIVIO: "Fork: left or right for 3 steps. A path's gold goes only to those who take it", TORCIA: "Shop between expeditions: everyone buys a torch, shield or lullaby from their chest" } };
      for (const L of ["it", "en"]) for (const k of ["BIVIO", "TORCIA"]) { const r = IN_T[L] && IN_T[L].avv && IN_T[L].avv.find((x) => x[0] === k); if (r) r[1] = riga2[L][k]; }
      const st = document.createElement("style");
      st.textContent = ".in-avv h4 + .in-a .in-ic{background:url(pix/uovo.png?v=" + UV + ") 0 0/800% 100% no-repeat !important}";
      document.head.appendChild(st);
    }
  } catch (e) { }

  // ── PRONTO (18/11): chi chiude la schermata pre-partita (intro.js: tocco / Invio / Spazio / Esc) lo dice al server;
  //    quando sono pronti tutti gli umani l'intro finisce subito (motore: mossa `pronto`, TW_RT_ABISSO_INTRO_S di serie 11 s).
  //    Mandato UNA volta, crudo (senza il suono del tasto di manda()). Vale in tutte e due le varianti.
  let prontoMandato = false;
  const mandaPronto = () => {
    if (prontoMandato || AUTO || typeof V === "undefined" || !V || V.fase !== "intro" || V.io < 0) return;
    prontoMandato = true;
    try { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ a: "pronto" })); } catch (e) { prontoMandato = false; }
  };
  if (typeof introChiudi === "function") {
    const introChiudiPrimaUovo = introChiudi;
    introChiudi = function (tocco) { if (tocco) mandaPronto(); return introChiudiPrimaUovo(tocco); };
  }

  // la scheda delle regole: la riga dell'uovo d'oro al posto di quella dell'uovo di ieri
  const apriRegolePrimaUovo = apriRegole;
  apriRegole = function () {
    apriRegolePrimaUovo();
    try {
      if (!AVV_()) return;
      const box = document.querySelector("#scheda .regole-px"); if (!box) return;
      const righe = [...box.querySelectorAll(".r-px")], vec = righe.find((x) => /uovo|egg/i.test(x.textContent) && !/oro|golden/i.test(x.textContent));
      const html = '<div class="r-px"><div class="r-ic"><span style="display:inline-block;width:24px;height:24px;background:url(pix/uovo.png?v=' + UV + ') 0 0/192px 24px no-repeat;image-rendering:pixelated"></span></div><div class="r-tx">' + ut("regola", V.nido.oro, V.nido.a) + "</div></div>";
      if (vec) vec.outerHTML = html; else box.insertAdjacentHTML("beforeend", html);
    } catch (x) { console.warn(x); }
  };
  const bR = $u("b-regole"); if (bR) bR.onclick = apriRegole;
  // la fine: la variante sotto il titolo
  const finalePrimaUovo = finale;
  finale = function (msg) {
    finalePrimaUovo(msg);
    try {
      if (!V || !V.variante) return;
      const h = document.querySelector("#scheda h2"); if (!h || h.querySelector(".ab-var")) return;
      const k = V.variante === "avventura" ? "avventura" : "classica";
      h.insertAdjacentHTML("beforeend", '<span class="ab-var' + (k === "avventura" ? "" : " cl") + '">' + ut(k).toUpperCase() + "</span>");
      if (k === "avventura" && V.nido && V.nido.stato === "rubato") h.insertAdjacentHTML("afterend", '<p style="color:#ffd27a;margin:2px 0 6px">' + ut("chip", V.nido.oro) + " · " + ut("chipRubato", (V.nido.chi || []).map(nome).join(", ")) + "</p>");
    } catch (x) { console.warn(x); }
  };
})();
