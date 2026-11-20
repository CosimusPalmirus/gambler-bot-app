/* TUTORIAL_2011 — NON SVEGLIARE IL DRAGO: il TUTORIAL giocabile, tutto in pagina (abisso.html?modo=tutorial, mai con ?rt=1).
   Niente server, niente posta, niente classifica, niente rete: la "WebSocket" della pagina e' finta e RIPRODUCE una
   partita registrata col MOTORE VERO (abisso_rt.py 2.2.0, variante avventura, 3 ladri, 2 spedizioni, carte a copione,
   bot a copione: strumenti/registra_abisso_tutorial.py). A ogni scelta la riproduzione si FERMA (il tempo sta fermo) e
   riparte solo quando il giocatore tocca il tasto giusto del passo; i passi «da leggere» ripartono con «Avanti».
   Il guscio dell index (stessa origine, solo dentro un iframe) riceve {sm:'tut2011', g:'abisso', ev, fai}:
     ev 'pronto' (pagina pronta) · 'esci' (Salta tutorial / Esci) · 'fine' con fai 'gioca' | 'allena'.
   GIU dal guscio (facoltativo): {sm:'tut2011_io', nome, foto} = il tuo nome e la tua foto veri.
   window.__TUT2011 = {g, passo, tot, finito, rete, ...} per le prove. File generato: NON modificare a mano
   (sorgente: tutorial_2011/strumenti/abisso_tutorial_motore.js + lavoro/abisso_registrazione.json). */
(function () {
  "use strict";
  var Q = new URLSearchParams(location.search);
  if (Q.get("modo") !== "tutorial" || Q.get("rt") === "1") return;
  var DATI = null;
  // i dati (la partita registrata) stanno in tutorial_dati.js: si scaricano SOLO qui, in modalita' tutorial
  (function () { var sc = document.createElement("script"); sc.src = "tutorial_dati.js?v=20113d95ce52"; sc.async = false;
    sc.onload = function () { DATI = window.__TUT2011_DATI || null; if (DATI) preparaDati(); };
    sc.onerror = function () { ST.errDati = 1; };
    (document.head || document.documentElement).appendChild(sc); })();
  var ORIG = location.origin, IFR = window.parent !== window;
  var ST = window.__TUT2011 = { g: "abisso", passo: 0, tot: 0, finito: false, rete: 0, bloccate: [], mosse: [], sbagli: 0, id: "", ver: "201171aee1b5" };
  try { document.documentElement.classList.add("tut2011"); } catch (e) { }
  function su(o) { if (!IFR) return; try { o.sm = "tut2011"; o.g = "abisso"; window.parent.postMessage(o, ORIG); } catch (e) { } }

  // ── la rete: solo i file della pagina (stessa origine, GET). Tutto il resto si blocca e si conta ─────────────────
  function locale(u) { try { var x = new URL(String(u), location.href); return x.origin === ORIG && !/\/(api|ws|duel|foto)\b/.test(x.pathname); } catch (e) { return false; } }
  function blocca(cosa, u) { ST.rete++; ST.bloccate.push(cosa + " " + String(u).slice(0, 120)); }
  var f0 = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (u, o) {
    var url = typeof u === "string" ? u : (u && u.url) || "", m = ((o && o.method) || (u && u.method) || "GET").toUpperCase();
    if (m === "GET" && locale(url) && f0) return f0(u, o);
    blocca("fetch", url); return Promise.reject(new TypeError("tutorial: niente rete"));
  };
  try {
    var xo = XMLHttpRequest.prototype.open, xs = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u) { this.__tutNo = !(String(m).toUpperCase() === "GET" && locale(u)); if (this.__tutNo) blocca("xhr", u); return xo.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function () { if (this.__tutNo) { try { this.abort(); } catch (e) { } return; } return xs.apply(this, arguments); };
  } catch (e) { }
  try { if (navigator.sendBeacon) navigator.sendBeacon = function (u) { blocca("beacon", u); return false; }; } catch (e) { }

  // ── i testi dei passi ─────────────────────────────────────────────────────────────────────────────────────────
  var T = {
    it: {
      avanti: "Avanti", salta: "Salta tutorial", passo: "Passo", tasto: { giu: "AVANTI", risali: "TORNA SU", sx: "SINISTRA", compra: "NINNA NANNA", uovo: "RUBA L'UOVO", pronto: "lo schermo" },
      sbaglio: function (t) { return "Per questo passo tocca " + t + "."; }, nonOra: "Aspetta: la carta si sta girando.",
      p: {
        s_intro: ["Benvenuto nella grotta", "Tre ladri scendono insieme nel sentiero del drago: tu, Bruno e Cleo. È un allenamento guidato. Tocca lo schermo per entrare."],
        s_avanti1: ["Avanti o torna su", "Ogni passo scopre una carta. 7 monete divise fra voi 3: 2 a testa, 1 resta sulla tessera. Sotto AVANTI leggi «{r}»: nessun segno del drago è ancora uscito. Tocca AVANTI."],
        s_avanti2: ["Il sacco", "Le monete nel sacco non sono ancora tue: lo diventano quando torni su. Finché non esce un segno non rischi niente. Ancora AVANTI."],
        i_segno: ["Un segno del drago", "È uscita la CODA. Un segno da solo non fa niente. Ma se esce DI NUOVO lo stesso segno, il drago si sveglia e chi è sul sentiero perde tutto il sacco."],
        s_torna: ["Quanto rischi", "Sotto AVANTI ora leggi «{r}»: il tuo sacco e la probabilità esatta che la prossima carta svegli il drago. Metti l'oro al sicuro: tocca TORNA SU."],
        i_risveglio: ["Il drago si è svegliato", "Cleo è rimasta ed è uscita la seconda CODA: ha perso tutto il sacco. Tu e Bruno eravate già tornati su: il vostro oro è nel forziere, salvo per sempre."],
        s_bottega: ["La bottega", "Fra una spedizione e l'altra ognuno compra con l'oro del forziere un oggetto: resta tuo finché non lo usi, uno alla volta. TORCIA: sbirci la prossima carta. SCUDO: al risveglio tieni metà sacco. NINNA NANNA: il primo risveglio non avviene. Compra la NINNA NANNA."],
        s_avanti3: ["L'uovo d'oro", "Seconda spedizione. In fondo al sentiero, dopo 10 passi, c'è il nido con l'UOVO D'ORO: vale 30. Tocca AVANTI."],
        s_bivio: ["Il bivio", "Per 3 passi le vie restano divise: ogni via gira la sua carta e l'oro si divide solo fra chi la prende. Il drago però è uno solo. Scegli SINISTRA."],
        s_vie1: ["Le vie", "Tu e Cleo a sinistra, Bruno a destra. A ogni passo si gira una carta per ogni via. AVANTI."],
        i_segnoVia: ["Un segno sull'altra via", "A destra è uscito uno SBADIGLIO. Vale per tutti: se ne esce un altro, su qualsiasi via, il drago si sveglia per tutti quelli dentro."],
        s_vie2: ["Due carte, più rischio", "Sulle vie si girano due carte, quindi il rischio sale: guardalo sotto AVANTI ({r}). Ma tu hai la NINNA NANNA. AVANTI."],
        s_vie3: ["Le vie si riuniscono", "Ultimo passo diviso, poi si torna su un sentiero solo. AVANTI."],
        i_ninna: ["La ninna nanna", "Secondo SBADIGLIO: il drago stava per svegliarsi, ma la tua NINNA NANNA lo ha riaddormentato. Vale una volta sola, e salva tutti quelli dentro."],
        s_dopoNinna: ["Verso il nido", "Il segno resta sul sentiero: un altro SBADIGLIO adesso sveglierebbe il drago. Sotto AVANTI: «{r}». AVANTI."],
        s_nido1: ["Quasi in fondo", "Il nido si vede in fondo al sentiero. Chi vuole torna su prima: tu prosegui. AVANTI."],
        s_nido2: ["Cleo è tornata su", "Cleo si è presa il suo sacco e gli avanzi delle tessere. Tu e Bruno andate avanti. AVANTI."],
        s_nido3: ["Un passo dal nido", "Ancora una carta e il sentiero finisce. AVANTI."],
        s_uovo: ["Il nido", "Qui il sentiero finisce: niente AVANTI, solo RUBA L'UOVO o TORNA SU. Scappando, l'occhio del drago guarda una carta del mazzo: se è un segno ti vede e perdi uovo e sacco (la probabilità è sul tasto). Prova: RUBA L'UOVO."],
        fine: ["Hai finito il tutorial", "L'occhio non ha visto segni: uovo e sacco sono nel tuo forziere. Ricorda: AVANTI per più oro, TORNA SU per metterlo al sicuro, due segni uguali svegliano il drago. Nelle partite vere ci sono 5 spedizioni e vince chi ha più oro nel forziere."]
      },
      gioca: "Gioca ora", allena: "Allenati coi bot", rivedi: "Rivedi il tutorial", gratis: "Tutorial"
    },
    en: {
      avanti: "Next", salta: "Skip tutorial", passo: "Step", tasto: { giu: "GO ON", risali: "GO BACK", sx: "LEFT", compra: "LULLABY", uovo: "STEAL THE EGG", pronto: "the screen" },
      sbaglio: function (t) { return "For this step tap " + t + "."; }, nonOra: "Wait: the card is being revealed.",
      p: {
        s_intro: ["Welcome to the cave", "Three thieves go down the dragon's path together: you, Bruno and Cleo. This is guided practice. Tap the screen to go in."],
        s_avanti1: ["Go on or go back", "Every step reveals a card. 7 coins split among the 3 of you: 2 each, 1 stays on the tile. Under GO ON you read «{r}»: no dragon sign has come out yet. Tap GO ON."],
        s_avanti2: ["Your sack", "The coins in your sack aren't yours yet: they are once you go back. Until a sign comes out you risk nothing. GO ON again."],
        i_segno: ["A dragon sign", "The TAIL came out. One sign alone does nothing. But if the SAME sign comes out AGAIN, the dragon wakes and everyone on the path loses their whole sack."],
        s_torna: ["What you risk", "Under GO ON you now read «{r}»: your sack and the exact chance that the next card wakes the dragon. Put your gold safe: tap GO BACK."],
        i_risveglio: ["The dragon woke up", "Cleo stayed and the second TAIL came out: she lost her whole sack. You and Bruno had already gone back: your gold is in the chest, safe forever."],
        s_bottega: ["The shop", "Between expeditions everyone buys an item with the gold in their chest: it stays yours until you use it, one at a time. TORCH: peek at the next card. SHIELD: on a wake-up you keep half your sack. LULLABY: the first wake-up doesn't happen. Buy the LULLABY."],
        s_avanti3: ["The golden egg", "Second expedition. At the end of the path, after 10 steps, there's the nest with the GOLDEN EGG: worth 30. Tap GO ON."],
        s_bivio: ["The fork", "For 3 steps the paths stay split: each path turns its own card and its gold is split only among those on it. But there's only one dragon. Pick LEFT."],
        s_vie1: ["The paths", "You and Cleo on the left, Bruno on the right. Each step turns one card per path. GO ON."],
        i_segnoVia: ["A sign on the other path", "A YAWN came out on the right. It counts for everyone: if another one comes out, on any path, the dragon wakes for everyone inside."],
        s_vie2: ["Two cards, more risk", "On the paths two cards are turned, so the risk goes up: see it under GO ON ({r}). But you have the LULLABY. GO ON."],
        s_vie3: ["The paths join", "Last split step, then it's one path again. GO ON."],
        i_ninna: ["The lullaby", "Second YAWN: the dragon was waking up, but your LULLABY put it back to sleep. It works once, and saves everyone inside."],
        s_dopoNinna: ["Towards the nest", "The sign stays on the path: another YAWN now would wake the dragon. Under GO ON: «{r}». GO ON."],
        s_nido1: ["Almost there", "The nest is at the end of the path. Whoever wants can go back earlier: you keep going. GO ON."],
        s_nido2: ["Cleo went back", "Cleo took her sack and the leftovers on the tiles. You and Bruno go on. GO ON."],
        s_nido3: ["One step from the nest", "One more card and the path ends. GO ON."],
        s_uovo: ["The nest", "The path ends here: no GO ON, only STEAL THE EGG or GO BACK. While you run, the dragon's eye looks at one card of the deck: if it's a sign it sees you and you lose egg and sack (the chance is on the button). Try it: STEAL THE EGG."],
        fine: ["Tutorial complete", "The eye saw no sign: egg and sack are in your chest. Remember: GO ON for more gold, GO BACK to keep it safe, two identical signs wake the dragon. Real games have 5 expeditions and whoever has the most gold in the chest wins."]
      },
      gioca: "Play now", allena: "Practice with bots", rivedi: "Replay the tutorial", gratis: "Tutorial"
    }
  };
  function LG() { try { return (typeof LINGUA !== "undefined" && LINGUA === "en") ? "en" : "it"; } catch (e) { return "it"; } }
  function tx() { return T[LG()]; }
  var BERSAGLI = {
    s_intro: "#intro .in-via", s_avanti1: "#b-giu", s_avanti2: "#b-giu", i_segno: "#pericoli", s_torna: "#b-risali",
    i_risveglio: "", s_bottega: '#bottega .bt-o[data-x="3"]', s_avanti3: "#b-giu", s_bivio: '.sp-b.lato[data-a="sx"]',
    s_vie1: "#b-giu", i_segnoVia: "#pericoli", s_vie2: "#b-giu", s_vie3: "#b-giu", i_ninna: "", s_dopoNinna: "#b-giu",
    s_nido1: "#b-giu", s_nido2: "#b-giu", s_nido3: "#b-giu", s_uovo: "#b-uovo", fine: ""
  };

  // ── io: nome e foto veri (dal guscio), con un limite di attesa ────────────────────────────────────────────────
  var IO = { nome: "", foto: "" }, ioArrivato = !IFR;
  function fotoOk(u) { u = String(u || ""); return (/^https:\/\/[^\s"'<>\\]{4,600}$/.test(u) || /^\/[^\s"'<>\\]{2,600}$/.test(u) || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(u)) ? u : ""; }
  window.addEventListener("message", function (ev) {
    if (ev.origin !== ORIG || ev.source !== window.parent) return;
    var d = ev.data; if (!d || typeof d !== "object" || d.sm !== "tut2011_io") return;
    IO.nome = String(d.nome || "").replace(/[\u0000-\u001f<>&"]/g, "").trim().slice(0, 16); IO.foto = fotoOk(d.foto); ioArrivato = true;
  });

  // ── la riproduzione ──────────────────────────────────────────────────────────────────────────────────────────
  var FR = [], PAUSE = {}, S = {}, i = 0, pausa = null, coda = [], vivo = null, giro = null, finito = false, botResta = 0;
  function preparaDati() { FR = DATI.frames; PAUSE = {}; DATI.pause.forEach(function (p) { (PAUSE[p.i] = PAUSE[p.i] || []).push(p); }); ST.tot = DATI.pause.length + 1; }
  function clona(x) { return JSON.parse(JSON.stringify(x)); }
  function nomeIo() { return IO.nome || (LG() === "en" ? "You" : "Tu"); }
  function snapFuori(feed) {
    var s = clona(S); s.feed = feed ? clona(feed) : [];
    if (s.giocatori && s.giocatori[0]) s.giocatori[0].nome = nomeIo();
    s.feed.forEach(function (e) { if (e && e.k === "via" && Array.isArray(e.nomi)) e.nomi[0] = nomeIo(); });
    return s;
  }
  function giu(o) { if (!vivo || vivo.readyState !== 1 || !vivo.onmessage) return; try { vivo.onmessage({ data: JSON.stringify(o) }); } catch (e) { console.error(e); } }
  function applicaFr(fr) { var k; for (k in fr.c) S[k] = clona(fr.c[k]); (fr.x || []).forEach(function (k2) { delete S[k2]; }); }
  function tic() {
    if (finito) return;
    if (pausa) {
      giu({ t: "snap", s: snapFuori(null) });          // stesso fotogramma: il tempo della pagina resta fermo
      if (pausa.id === "s_bottega") { try { if (typeof BOT !== "undefined" && BOT) BOT.fine = performance.now() + botResta; } catch (e) { } }
      return;
    }
    if (i >= FR.length) { fine(); return; }
    var fr = FR[i]; applicaFr(fr); giu({ t: "snap", s: snapFuori(fr.f) });
    var p = PAUSE[i]; i++;
    if (p) { coda = p.slice(); prossima(); }
  }
  function prossima() {
    pausa = coda.shift() || null;
    if (!pausa) { ST.attende = ""; mostra(null); return; }
    ST.passo++; ST.id = pausa.id; ST.attende = pausa.a || "avanti";
    if (pausa.id === "s_bottega") { try { botResta = Math.max(1500, (BOT.fine || 0) - performance.now()); } catch (e) { botResta = 9000; } }
    mostra(pausa.id);
  }
  function sblocca() { if (!pausa) return; pausa = null; ST.attende = ""; if (coda.length) prossima(); else mostra(null); }
  function mossa(o) {
    if (!o || typeof o.a !== "string") return;
    ST.mosse.push(o.a + (o.ax != null ? ":" + o.ax : ""));
    if (pausa && pausa.a && o.a === pausa.a && (pausa.ax == null || Number(o.ax) === pausa.ax)) { sblocca(); return; }
    if (o.a === "pronto") return;                    // la schermata d'apertura si chiude anche da sola
    ST.sbagli++;
    giu({ t: "no", a: o.a });
    var att = pausa && pausa.a ? (tx().tasto[pausa.a] || pausa.a) : "";
    suggerisci(att ? tx().sbaglio(att) : tx().nonOra);
  }
  function FintaWS(url) {
    var me = this; this.url = String(url); this.readyState = 0; this.binaryType = "blob"; this.bufferedAmount = 0; this.extensions = ""; this.protocol = "";
    this.onopen = this.onmessage = this.onclose = this.onerror = null; vivo = this;
    var t0 = performance.now();
    var parti = function () {
      if (vivo !== me) return;
      if (!DATI || (!ioArrivato && performance.now() - t0 < 900)) { setTimeout(parti, 60); return; }
      me.readyState = 1;
      try { if (me.onopen) me.onopen({ type: "open" }); } catch (e) { }
      var info = clona(DATI.info); info.nomi[0] = nomeIo(); info.foto = [IO.foto || null, null, null];
      giu({ t: "info", info: info });
      clearInterval(giro); giro = setInterval(tic, 200); tic();
    };
    su({ ev: "pronto" });                           // il guscio puo' rispondere con tut2011_io (nome e foto veri)
    setTimeout(parti, 0);
  }
  FintaWS.CONNECTING = 0; FintaWS.OPEN = 1; FintaWS.CLOSING = 2; FintaWS.CLOSED = 3;
  FintaWS.prototype.send = function (raw) { if (this.readyState !== 1) return; var o; try { o = JSON.parse(raw); } catch (e) { return; } mossa(o); };
  FintaWS.prototype.close = function () { this.readyState = 3; };
  FintaWS.prototype.addEventListener = function () { }; FintaWS.prototype.removeEventListener = function () { };
  var WS0 = window.WebSocket;
  window.WebSocket = function (u) { if (vivo) { blocca("ws", u); } return new FintaWS(u); };
  window.WebSocket.CONNECTING = 0; window.WebSocket.OPEN = 1; window.WebSocket.CLOSING = 2; window.WebSocket.CLOSED = 3;
  void WS0;

  // ── il riquadro guida: testo, freccia, anello sul comando, Avanti, Salta tutorial ───────────────────────────────
  var css = document.createElement("style");
  css.id = "tut2011-css";
  css.textContent =
    "#tut-box{position:fixed;z-index:2147483600;left:12px;width:min(372px,calc(100vw - 24px));box-sizing:border-box;padding:12px 13px 11px;background:#1d0e03f2;color:#fff3dc;" +
    "border:3px solid #ffd27a;box-shadow:4px 4px 0 #000,0 0 0 1px #000 inset;font:500 14px/1.38 system-ui,-apple-system,Segoe UI,sans-serif;transition:top .25s,bottom .25s,left .25s,opacity .2s;opacity:0;pointer-events:auto}" +
    "#tut-box.su{opacity:1}#tut-box[hidden]{display:none}" +
    "#tut-box .tb-h{display:flex;align-items:baseline;gap:8px;margin:0 0 5px}" +
    "#tut-box .tb-h b{font:700 13px Silkscreen,monospace;color:#ffd27a;letter-spacing:.02em;text-transform:uppercase}" +
    "#tut-box .tb-h small{margin-left:auto;font:700 10px Silkscreen,monospace;color:#c9a46a;white-space:nowrap}" +
    "#tut-box .tb-t{margin:0}#tut-box .tb-t q{quotes:none;color:#ffe2a0;font-weight:700}" +
    "#tut-box .tb-s{margin:6px 0 0;color:#ffb3a8;font-weight:700;min-height:0}#tut-box .tb-s:empty{display:none}" +
    "#tut-box .tb-b{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:9px;flex-wrap:wrap}" +
    "#tut-box button{font:700 12px Silkscreen,monospace;border:2px solid #000;box-shadow:2px 2px 0 #000;cursor:pointer;padding:8px 12px;min-height:38px}" +
    "#tut-box .tb-salta{background:transparent;border-color:transparent;box-shadow:none;color:#c9a46a;padding:8px 4px;margin-right:auto;text-decoration:underline}" +
    "#tut-box .tb-av{background:#ffd27a;color:#2a1200}#tut-box .tb-av[hidden]{display:none}" +
    "#tut-box .tb-g{background:#ffd27a;color:#2a1200}#tut-box .tb-a{background:#3a2410;color:#ffe2a0;border-color:#000}" +
    "#tut-box.fine{top:50%!important;bottom:auto!important;left:50%!important;transform:translate(-50%,-50%);width:min(400px,calc(100vw - 28px))}" +
    "#tut-box.fine .tb-b{flex-direction:column;align-items:stretch}#tut-box.fine .tb-b button{width:100%}" +
    "#tut-box.scuoti{animation:tutScuoti .32s}@keyframes tutScuoti{25%{margin-left:-6px}75%{margin-left:6px}}" +
    "#tut-anello{position:fixed;z-index:2147483590;pointer-events:none;border:3px solid #ffd27a;box-shadow:0 0 0 3px #000,0 0 22px 4px rgba(255,210,122,.75);animation:tutPulsa 1.1s ease-in-out infinite}" +
    "#tut-anello[hidden],#tut-freccia[hidden]{display:none}@keyframes tutPulsa{50%{box-shadow:0 0 0 3px #000,0 0 34px 10px rgba(255,210,122,.95)}}" +
    "#tut-freccia{position:fixed;z-index:2147483595;pointer-events:none;width:0;height:0;border-left:13px solid transparent;border-right:13px solid transparent;filter:drop-shadow(2px 2px 0 #000)}" +
    "#tut-freccia.giu{border-top:16px solid #ffd27a;animation:tutGiu .8s ease-in-out infinite}#tut-freccia.su{border-bottom:16px solid #ffd27a;animation:tutSu .8s ease-in-out infinite}" +
    "@keyframes tutGiu{50%{transform:translateY(5px)}}@keyframes tutSu{50%{transform:translateY(-5px)}}" +
    "#tut-velo{position:fixed;inset:0;z-index:2147483500;background:rgba(0,0,0,.55)}#tut-velo[hidden]{display:none}" +
    "html.tut2011 #coach{display:none!important}";
  (document.head || document.documentElement).appendChild(css);
  var box, anello, freccia, velo, corrente = null, lgVista = "", sugg = "", suggT = 0;
  function costruisci() {
    if (box) return;
    box = document.createElement("div"); box.id = "tut-box"; box.hidden = true; box.setAttribute("role", "dialog"); box.setAttribute("aria-live", "polite");
    anello = document.createElement("div"); anello.id = "tut-anello"; anello.hidden = true;
    freccia = document.createElement("div"); freccia.id = "tut-freccia"; freccia.hidden = true;
    velo = document.createElement("div"); velo.id = "tut-velo"; velo.hidden = true;
    document.body.appendChild(velo); document.body.appendChild(anello); document.body.appendChild(freccia); document.body.appendChild(box);
    box.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return; e.preventDefault(); e.stopPropagation();
      if (b.classList.contains("tb-av")) { if (pausa && !pausa.a) sblocca(); return; }
      if (b.classList.contains("tb-salta")) { esci(); return; }
      if (b.dataset.f === "gioca" || b.dataset.f === "allena") { ST.scelta = b.dataset.f; if (IFR) su({ ev: "fine", fai: b.dataset.f }); else location.href = "../index.html"; return; }
      if (b.dataset.f === "rivedi") { location.reload(); }
    });
    requestAnimationFrame(segui);
  }
  function rischioTesto() { var el = document.getElementById("rischio-ant"); return el && !el.hidden ? el.textContent.trim() : ""; }
  function disegna() {
    var t = tx(), k = corrente, h;
    if (!k) { box.hidden = true; box.classList.remove("su"); return; }
    var p = t.p[k] || ["", ""];
    var testo = esc(p[1]).replace("{r}", "<q>" + esc(rischioTesto() || (LG() === "en" ? "no risk" : "nessun rischio")) + "</q>");
    if (k === "fine") {
      h = '<div class="tb-h"><b>' + esc(p[0]) + "</b><small>" + esc(t.gratis) + '</small></div><p class="tb-t">' + testo + "</p>" +
        '<div class="tb-b"><button type="button" class="tb-g" data-f="gioca">' + esc(t.gioca) + '</button><button type="button" class="tb-a" data-f="allena">' + esc(t.allena) +
        '</button><button type="button" class="tb-salta" data-f="rivedi" style="margin:0 auto">' + esc(t.rivedi) + "</button></div>";
    } else {
      h = '<div class="tb-h"><b>' + esc(p[0]) + "</b><small>" + esc(t.passo) + " " + ST.passo + "/" + ST.tot + '</small></div><p class="tb-t">' + testo + '</p><p class="tb-s">' + esc(sugg) + "</p>" +
        '<div class="tb-b"><button type="button" class="tb-salta">' + esc(t.salta) + '</button><button type="button" class="tb-av"' + (pausa && !pausa.a ? "" : " hidden") + ">" + esc(t.avanti) + "</button></div>";
    }
    box.innerHTML = h; box.classList.toggle("fine", k === "fine"); box.hidden = false;
    requestAnimationFrame(function () { box.classList.add("su"); });
    lgVista = LG() + "|" + k + "|" + rischioTesto();
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mostra(k) { costruisci(); corrente = k; sugg = ""; disegna(); posiziona(); }
  function suggerisci(s) { sugg = s; suggT = performance.now(); if (corrente) { disegna(); box.classList.remove("scuoti"); void box.offsetWidth; box.classList.add("scuoti"); } }
  function bersaglio() {
    var sel = corrente && BERSAGLI[corrente]; if (!sel) return null;
    var el = document.querySelector(sel); if (!el) return null;
    var r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || el.hidden) return null;
    var cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") return null;
    return r;
  }
  function posiziona() {
    if (!box || box.hidden) { if (anello) { anello.hidden = true; freccia.hidden = true; } return; }
    var vw = innerWidth, vh = innerHeight, r = corrente === "fine" ? null : bersaglio(), bw = box.offsetWidth, bh = box.offsetHeight;
    var sat = 8 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sa-top")) || 0);
    velo.hidden = corrente !== "fine";
    if (corrente === "fine") { anello.hidden = freccia.hidden = true; return; }
    var az = document.getElementById("azioni"), azTop = az ? az.getBoundingClientRect().top : vh;
    if (!(azTop > vh * .4)) azTop = vh;
    // la zona «alta»: sotto il cartello degli annunci (#annuncio, che non si copre), sopra i ladri e i tasti
    var alta = Math.max(sat + 44, vh * .18), an = document.getElementById("annuncio");
    if (an) { var ra = an.getBoundingClientRect(); if (ra.height > 4 && ra.bottom < vh * .5 && getComputedStyle(an).display !== "none") alta = Math.max(alta, ra.bottom + 10); }
    alta = Math.max(sat, Math.min(alta, azTop - 8 - bh));
    if (!r) {
      anello.hidden = freccia.hidden = true;
      box.style.left = Math.round((vw - bw) / 2) + "px"; box.style.top = Math.round(alta) + "px"; box.style.bottom = "auto"; return;
    }
    anello.hidden = false; var m = 5;
    anello.style.left = (r.left - m) + "px"; anello.style.top = (r.top - m) + "px"; anello.style.width = (r.width + 2 * m - 6) + "px"; anello.style.height = (r.height + 2 * m - 6) + "px";
    var cx = r.left + r.width / 2, sopra = r.top + r.height / 2 > vh * .5, gap = 26;
    var left = Math.max(10, Math.min(vw - bw - 10, cx - bw / 2));
    var top = sopra ? r.top - m - gap - bh : Math.max(r.bottom + m + gap, alta);
    if (top < sat) top = sat; if (top + bh > vh - 6) top = Math.max(sat, vh - 6 - bh);
    box.style.left = Math.round(left) + "px"; box.style.top = Math.round(top) + "px"; box.style.bottom = "auto";
    // la freccia attaccata al comando, dalla parte del riquadro
    var fy = sopra ? r.top - m - 19 : r.bottom + m + 3, ok = sopra ? (fy >= top + bh) : (fy + 16 <= top);
    freccia.hidden = !ok; freccia.className = sopra ? "giu" : "su";
    freccia.style.left = Math.round(Math.max(6, Math.min(vw - 32, cx - 13))) + "px"; freccia.style.top = Math.round(fy) + "px";
  }
  function segui() {
    if (box && corrente && (LG() + "|" + corrente + "|" + rischioTesto()) !== lgVista && !(sugg && performance.now() - suggT < 2500)) disegna();
    if (sugg && performance.now() - suggT > 4000 && corrente) { sugg = ""; disegna(); }
    posiziona(); requestAnimationFrame(segui);
  }
  function fine() {
    if (finito) return; finito = true; clearInterval(giro); pausa = null;
    ST.finito = true; ST.passo = ST.tot; ST.id = "fine";
    mostra("fine");
  }
  function esci() { ST.uscito = true; if (IFR) su({ ev: "esci" }); else fine(); }
  // la pagina vuole tornare al menu (Esc / tasti della pagina): per il tutorial e' «esci»
  window.addEventListener("abisso", function (e) { var m = e && e.detail; if (m && m.t === "menu") esci(); });
  // i vecchi consigli della prima partita (abisso.js: TUT) non servono qui, e non si scrive drago_tut
  window.addEventListener("load", function () { try { TUT = false; } catch (e) { } }, { once: true });
  window.addEventListener("error", function (e) { ST.errori = (ST.errori || 0) + 1; ST.ultimoErrore = String(e && e.message || "").slice(0, 200); });
})();
