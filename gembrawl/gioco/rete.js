// GEM BRAWL — F1 rete (23/11): IL CLIENT DI RETE. Niente DOM: lo stesso file gira nella pagina e nel banco (node).
// Server autoritativo (gembrawl_rt.py + gembrawl_diretta.mjs). Qui:
//   · CODA, SCELTA (alla cieca, 25 s), CARICA, VIA, FINE: una macchina a stati; la pagina ascolta con cli.on.*;
//   · due specchi del server (rete_codec.js): stA si aggiorna appena arriva un pacchetto (serve alla previsione),
//     st (quello che la pagina disegna) avanza col «tempo di riproduzione», un po' dietro: buffer adattivo al jitter;
//   · GLI ALTRI EROI: interpolati fra due passi confermati (il disegno fa gia' ox -> x con alpha);
//   · IL PROPRIO EROE: previsto in locale con Motore.muoviLibero (gli stessi conti del server) a partire dall'ultimo stato
//     confermato + gli input non ancora usati dal server; la correzione si scioglie in ~100 ms (mai un salto);
//   · input: uno ogni passo (30/s), numerato; un tasto parte UNA volta (il server lo tiene valido 6 passi);
//   · effetti e suoni: dagli eventi dei passi CONFERMATI, quando il passo viene riprodotto (una volta sola, mai persi);
//   · misura gb-perf: RTT, correzioni, fermi, «quanto si sente» e «quanto si vede».
(function (root) {
  'use strict';
  var DT = 1 / 30, DT_MS = 1000 / 30;
  var TIMER_PREV = ['stun', 'radiceT', 'slowT', 'trasT', 'freT', 'immT', 'prepT', 'muroT', 'pauraT', 'cavT'];
  var SOVRA = ['x', 'y', 'ox', 'oy', 'vx', 'vy', 'aim', 'fac', 'mosso'];

  function mediana(a) { if (!a.length) return null; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }
  function perc(a, p) { if (!a.length) return null; var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.min(b.length - 1, Math.floor(b.length * p))]; }
  function tondo(v) { return v == null ? null : Math.round(v * 10) / 10; }

  function cliente(o) {
    var L = o.lib || root, M = L.Motore, C = L.GBCodec, EROI = L.EROI, MAPPE = L.MAPPE, IA = L.IA;
    var ora = o.ora || function () { return (typeof performance !== 'undefined' ? performance.now() : Date.now()); };
    var WS = o.WS || root.WebSocket;
    var cli = {
      fase: 'menu', uid: o.uid, nome: o.nome || o.uid, url: o.url, io: -1, sq: 0, rid: null, modo: null, cfg: null,
      st: null, stA: null, dec: null, decA: null, info: null, sel: null, esito: null, chiuso: false, spettatore: false,
      on: {}, perf: null, firma: null, pausa: false, mappa: null,
      // GBT2311 (tornei + spettatori): tour = {ticket, tid} se si gioca un match di torneo; guardaRid = la stanza guardata da
      // spettatore esterno; elimGuarda = eliminato in sopravvivenza che guarda il resto (strada spettatore del server)
      tour: null, tourEsito: null, guardaRid: null, guardi: null, elimGuarda: false, spNuova: false
    };
    var ws = null, tent = 0, tent0 = 0, coda = [], fA = 0, pt = 0, giocando = false, inizioT = 0;
    var seq = 0, nonUsati = [], accIn = 0, S = null, predX = 0, predY = 0, predX0 = 0, predY0 = 0, offX = 0, offY = 0, haPred = false;
    var attesaFoto = false, salvati = {}, inp = { mx: 0, my: 0, att: 0, ax: 0, ay: 0, sup: 0, sx: 0, sy: 0, gad: 0, gx: 0, gy: 0 }, tmpInp = {};
    var arrivi = [], base = 0, jit = 0, ultimoArrivo = 0, pingT = 0, tAtt0 = -99, tSup0 = -99, premuti = [];
    var stalloDa = -1, estr = [], ESTRAP_MAX = 0.25;
    cli.estrap = 0;
    function nuovaPerf() {
      return { buchi: 0, bucoMax: 0, rtt: [], corr: 0, corrMax: 0, corrSum: 0, corrP: 0, corrPSum: 0, corrPMax: 0, fermi: 0, fermoMax: 0, fermoTot: 0, vedo: [], conferma: [], colpo: [], buf: [],
        pacchetti: 0, byte: 0, passi: 0, div: 0, hmOk: 0, rientri: 0, inputs: 0, t0: ora() };
    }
    cli.perf = nuovaPerf();
    if (M && EROI && MAPPE) cli.firma = M.firma(EROI, root.TARATURA_BRAWL || L.TARATURA_BRAWL, MAPPE, IA ? IA.VER : '');

    function emetti(n, a, b) { var f = cli.on[n]; if (f) try { f(a, b); } catch (e) { if (o.log) o.log('errore in on.' + n + ': ' + (e && e.stack || e)); } }
    function manda(obj) { if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(obj)); } catch (e) { } } }
    function gb(obj) { obj.t = 'gb'; manda(obj); }
    cli.manda = manda;

    // ---------------- connessione (con rientro automatico) ----------------
    cli.connetti = function () {
      cli.chiuso = false;
      ws = new WS(cli.url);
      ws.onopen = function () {
        tent0 = tent; tent = 0;
        // DIALETTI (24/11): 'rt' = il server RT vero (turfwar-rt: hello con l'initData di Telegram, join/leave/abbandona/
        // rientra/watch, start); 'locale' = il server di prova del banco (ciao/coda/esci/guarda). I messaggi del tavolo
        // (t:"gb") sono gli stessi nei due.
        if (RT) {
          var idt = ''; try { idt = (o.initData && o.initData()) || (root.Telegram && root.Telegram.WebApp && root.Telegram.WebApp.initData) || ''; } catch (e) { }
          manda({ t: 'hello', user_id: String(cli.uid || ''), init_data: idt, profile: { name: cli.nome || '' } });
        } else manda({ t: 'ciao', uid: cli.uid, nome: cli.nome });
        emetti('connesso');
      };
      ws.onmessage = function (ev) { var d = ev.data; if (typeof d !== 'string') return; cli.perf.byte += d.length; var m; try { m = JSON.parse(d); } catch (e) { return; } gestisci(m); };
      ws.onclose = function () {
        ws = null; emetti('staccato');
        if (cli.chiuso) return;
        if (cli.fase === 'scelta' || cli.fase === 'carica' || cli.fase === 'gioco' || cli.fase === 'coda' || cli.fase === 'guarda') { tent++; setTimeout(cli.connetti, Math.min(3000, 400 * tent)); }
      };
      ws.onerror = function () { };
    };
    cli.chiudi = function () { cli.chiuso = true; if (ws) try { ws.close(); } catch (e) { } };
    cli.stacca = function () { if (ws) try { ws.close(); } catch (e) { } };   // banco: stacco della rete (si riattacca da solo)
    var RT = o.dialetto === 'rt';
    cli.dialetto = RT ? 'rt' : 'locale';
    cli.coda = function (modo) { cli.fase = 'coda'; cli.modo = modo; cli.esito = null; cli.tour = null; cli.spettatore = false; cli.elimGuarda = false; cli.guardaRid = null; manda(RT ? { t: 'join', game: 'gembrawl', tier: 'gratis', modo: modo } : { t: 'coda', modo: modo }); };
    cli.esciCoda = function () { cli.fase = 'menu'; manda(RT ? { t: 'leave' } : { t: 'esci_coda' }); };
    cli.scegli = function (eroe, ok) { gb({ o: 'sc', e: eroe, ok: ok ? 1 : 0 }); };
    cli.pronto = function () { gb({ o: 'ok' }); };
    cli.esci = function () {
      if (cli.spettatore && !cli.elimGuarda) { cli.smetti(); return; }   // GBT2311: lo spettatore esterno esce dalla visione (unwatch), non abbandona niente
      manda(RT ? { t: 'abbandona' } : { t: 'esci' }); cli.fase = 'menu'; giocando = false;
    };
    cli.guarda = function (rid) {
      cli.spettatore = true; cli.fase = 'guarda'; cli.elimGuarda = false; cli.io = -1;
      cli.guardaRid = rid || null; cli.spNuova = true; attesaFoto = true; cli.esito = null;   // GBT2311: a ogni `watch` lo specchio si rifa' da zero (anche cambio stanza)
      manda(RT ? { t: 'watch', rid: rid || '' } : { t: 'guarda', rid: rid || null });
    };
    // ---- GBT2311: TORNEI, SPETTATORI, LISTA IN DIRETTA, ELIMINATO CHE GUARDA ----
    // match di torneo: col biglietto della mini app; dopo una rete saltata si rimanda lo stesso `join_ticket` (hello_ok)
    cli.torneo = function (ticket, tid) {
      cli.tour = { ticket: String(ticket || ''), tid: tid ? String(tid) : '' }; cli.tourEsito = null;
      cli.fase = 'coda'; cli.modo = 'duello'; cli.esito = null; cli.spettatore = false; cli.elimGuarda = false;
      manda({ t: 'join_ticket', ticket: cli.tour.ticket, game: 'gembrawl' });
    };
    // lo spettatore smette di guardare: il server non manda piu' niente (risponde `left`)
    cli.smetti = function () {
      if (cli.guardaRid !== null || cli.fase === 'guarda') manda(RT ? { t: 'unwatch' } : { t: 'esci' });
      cli.spettatore = false; cli.elimGuarda = false; cli.guardaRid = null; cli.fase = 'menu'; giocando = false; attesaFoto = false;
    };
    // la lista IN DIRETTA (il server la aggiorna al piu' una volta al secondo); risposta in cli.on.dirette(rooms)
    cli.dirette = function () { manda({ t: 'watch_list', game: 'gembrawl' }); };
    // eliminato in sopravvivenza: il resto della partita come spettatore (gok) o un rifiuto (gno)
    cli.guardaElim = function () { gb({ o: 'guarda' }); };
    cli.connessa = function () { return !!(ws && ws.readyState === 1); };
    // lo spettatore vede tutto: nessuna nebbia di squadra. Il server gli manda gia' tutta l'arena (codificatore viewer -1);
    // qui si accendono i bit di TUTTE le squadre in st.vis, cosi' Motore.visibile (disegno, render3d, effetti, suoni) e' vero
    // per ogni eroe, qualunque sia l'eroe seguito. Il motore non gira nella pagina online (solo il codec scrive st.vis).
    function visTutti(st) { if (st && st.vis) for (var k = 0; k < st.vis.length; k++) st.vis[k] = 0xFF; }
    cli.visTutti = function () { if (cli.spettatore) visTutti(cli.st); };
    cli.sfondo = function () { gb({ o: 'bg' }); };
    cli.mandaPerf = function () { gb({ o: 'perf', d: cli.riassunto() }); };

    // ---------------- messaggi ----------------
    cli.ultimi = [];   // gli ultimi messaggi ricevuti (tipo/operazione), per la diagnosi
    function gestisci(m) {
      if (m.t !== 's' && m.o !== 's' && m.o !== 'pp') { cli.ultimi.push((m.t || '') + (m.o ? ':' + m.o : '') + (m.msg ? '=' + String(m.msg).slice(0, 40) : '')); if (cli.ultimi.length > 30) cli.ultimi.shift(); }
      if (m.t === 'ciao') { cli.info = m; emetti('ciao', m); return; }
      // ---- dialetto RT ----
      if (m.t === 'hello_ok') {
        cli.info = m; if (m.uid) cli.uid = String(m.uid);
        // eravamo in partita (rete saltata): il RT rimanda da solo `start` alla socket nuova; se no lo si chiede
        if (cli.fase === 'scelta' || cli.fase === 'carica' || cli.fase === 'gioco' || (cli.fase === 'guarda' && cli.elimGuarda)) manda({ t: 'rientra' });
        else if (cli.fase === 'coda' && cli.tour) manda({ t: 'join_ticket', ticket: cli.tour.ticket, game: 'gembrawl' });   // GBT2311: torneo = di nuovo il biglietto, MAI la coda gratis
        else if (cli.fase === 'coda' && cli.modo && tent0) manda({ t: 'join', game: 'gembrawl', tier: 'gratis', modo: cli.modo });   // di nuovo in coda dopo uno scalzo
        else if (cli.fase === 'guarda' && cli.guardaRid && tent0) { cli.spNuova = true; attesaFoto = true; manda({ t: 'watch', rid: cli.guardaRid }); }   // GBT2311: spettatore dopo una rete saltata
        tent0 = 0;
        emetti('ciao', m); return;
      }
      if (m.t === 'lobby') {
        if (m.game && m.game !== 'gembrawl') return;
        if (m.tour || cli.tour) { emetti('torneoAttesa', { n: m.players | 0, cap: m.cap | 0, fra: m.starts_in, mid: m.mid, players: m.players }); return; }   // GBT2311: attesa dell'avversario
        emetti('coda', { modo: cli.modo, n: m.players | 0, pos: 0, attesa: m.waited || 0, max: m.max_wait || 0 }); return;
      }
      if (m.t === 'start') {
        if (m.game && m.game !== 'gembrawl') return;
        var seg = (m.map && m.map.seggi) || [], mio = -1;
        for (var si = 0; si < seg.length; si++) if (String(seg[si].uid) === String(m.you)) mio = seg[si].sg;
        if (cli.fase === 'scelta' || cli.fase === 'carica' || cli.fase === 'gioco' || (cli.fase === 'guarda' && cli.elimGuarda)) {   // la stessa stanza dopo un rientro
          cli.io = mio; cli.perf.rientri++; attesaFoto = cli.fase === 'gioco' || cli.fase === 'guarda'; gb({ o: 'rs' }); return;
        }
        if (m.tour) cli.tourMid = m.mid;   // GBT2311
        cli.rid = (m.map && m.map.rid) || m.rid || null; cli.io = mio; cli.modo = (m.map && m.map.modo) || cli.modo; cli.fase = 'scelta'; cli.esito = null;
        gb({ o: 'ver', v: cli.firma }); emetti('partita', { mio: mio, modo: cli.modo, rid: cli.rid, tour: !!m.tour });
        // GBT2311: pagina ricaricata a partita gia' in corso (il RT rimanda `start`): si chiede subito dove siamo (rs)
        if (m.map && m.map.fase === 'gioco') { attesaFoto = true; gb({ o: 'rs' }); }
        return;
      }
      if (m.t === 'guardi') {   // GBT2311: lo spettatore e' dentro (la foto arriva quando la partita e' in gioco)
        cli.rid = m.rid; cli.guardaRid = m.rid; cli.guardi = m; if (m.modo) cli.modo = m.modo;
        cli.spettatore = true; cli.fase = 'guarda'; cli.spNuova = true; attesaFoto = true;
        emetti('guardi', m); return;
      }
      if (m.t === 'left') { emetti('smesso', m); return; }
      if (m.t === 'watch_list') { if (m.game === 'gembrawl') { cli.ultimaLista = m.rooms || []; emetti('dirette', cli.ultimaLista); } return; }
      if (m.t === 'err') {
        emetti('errore', m);
        if (m.msg === 'auth failed') { cli.chiuso = true; cli.fase = 'menu'; emetti('no', { perche: 'auth' }); return; }   // fuori da Telegram: niente rete
        // GBT2311: biglietto del torneo scaduto / non valido
        if (cli.tour && cli.fase === 'coda') { cli.fase = 'menu'; emetti('torneoNo', { perche: m.msg || 'errore', code: m.code }); return; }
        // GBT2311: la stanza da guardare non c'e' piu' (finita, non trovata, piena, sei impegnato altrove)
        if (cli.fase === 'guarda' && !cli.elimGuarda && (m.code || /match non trovato|gem brawl/i.test(m.msg || ''))) {
          cli.spettatore = false; cli.guardaRid = null; cli.fase = 'menu'; giocando = false; emetti('guardaNo', { code: m.code || 'trovata', msg: m.msg }); return;
        }
        if (cli.fase === 'coda') { cli.fase = 'menu'; emetti('no', { perche: m.msg || 'errore' }); }
        return;
      }
      // un'altra socket dello stesso utente (nella mini app: la sonda del RT) ha preso il posto di questa: il RT chiude la
      // nostra; ci si ricollega da soli (onclose) e si riprende coda o stanza. Mai arrendersi qui.
      if (m.t === 'kick') { cli.perf.kick = (cli.perf.kick | 0) + 1; emetti('kick', m); return; }
      if (m.t === 'over' && (m.tour || cli.tour)) {   // GBT2311: esito del match di torneo (anche bye / walkover)
        cli.tourEsito = m; if (m.walkover) { cli.fase = 'menu'; giocando = false; }
        emetti('torneoFine', m); return;
      }
      if (m.t === 'over' || m.t === 'snap' || m.t === 'presence') return;
      if (m.t === 'coda') { emetti('coda', m); return; }
      if (m.t === 'partita') { cli.rid = m.rid; cli.io = m.mio; cli.modo = m.modo; cli.fase = 'scelta'; cli.esito = null; gb({ o: 'ver', v: cli.firma }); emetti('partita', m); return; }
      if (m.t === 'stanza') { cli.rid = m.rid; cli.io = m.mio; cli.modo = m.modo; cli.perf.rientri++; attesaFoto = true; gb({ o: 'rs' }); return; }
      if (m.t === 'esce') { emetti('esce', m); return; }
      if (m.t === 'guardi') { emetti('guardi', m); return; }
      if (m.t === 'uscito') { emetti('uscito', m); return; }
      if (m.t !== 'gb') { emetti('altro', m); return; }
      switch (m.o) {
        case 's': if (!attesaFoto && cli.decA) arrivo(m); return;   // senza specchio (pagina appena ricaricata) si aspetta la foto
        case 'pp': { var r = ora() - m.c; if (r >= 0 && r < 10000) { cli.perf.rtt.push(r); if (cli.perf.rtt.length > 600) cli.perf.rtt.splice(0, 300); cli.rtt = r; } return; }
        case 'sel': cli.sel = m; if (cli.fase !== 'scelta') cli.fase = 'scelta'; emetti('sel', m); return;
        case 'car': prepara(m); return;
        case 'via': via(m.tra || 0); return;
        case 'foto': caricaFoto(m.foto); return;
        case 'sfoto':
          // GBT2311: stanza nuova (o di nuovo dopo un `watch`): specchio da zero; l'eliminato che guarda tiene la sua partita
          if (cli.spNuova || !cli.st) { cli.spNuova = false; giocando = false; if (!cli.elimGuarda) cli.io = -1; cli.fase = 'guarda'; prepara({ cfg: m.cfg, mio: cli.elimGuarda ? cli.io : -1 }); }
          cli.spettatore = true; caricaFoto(m.foto); visTutti(cli.st); if (!giocando) via(0); emetti('sfoto', m); return;
        case 'gok': cli.spettatore = true; cli.elimGuarda = true; cli.fase = 'guarda'; attesaFoto = true; emetti('gok', m); return;   // GBT2311
        case 'gno': emetti('gno', m); return;   // GBT2311
        case 'rs': rientro(m); return;
        case 'pz': cli.pausa = !!m.on; if (!m.on) azzeraJitter(); emetti('pausa', m); return;
        case 'afk': emetti('afk', m); return;
        case 'fine': cli.esito = m; if (cli.spettatore && !cli.elimGuarda) cli.fase = 'fine'; emetti('fine', m); return;   // GBT2311: lo spettatore a fine partita non si riattacca piu' (niente «watch» su una stanza chiusa)
        case 'no': cli.annullata = m.perche; emetti('no', m); return;
        case 'fuori': cli.fuori = m.perche; cli.fase = 'menu'; giocando = false; emetti('fuori', m); return;
      }
    }

    function prepara(m) {
      var cfg = m.cfg;
      cli.cfg = cfg; cli.mappa = MAPPE[cfg.mappa];
      if (m.mio !== undefined && m.mio >= 0) cli.io = m.mio;
      if (m.nomi) cli.nomi = m.nomi;
      var gioc = cfg.giocatori.map(function (g) { return { eroe: g.eroe, squadra: g.squadra, bot: g.bot | 0, nome: g.nome || '' }; });
      var crea = function () { return M.crea({ mappa: cli.mappa, modo: cfg.modo, giocatori: gioc, seme: 0, eroi: EROI }); };
      cli.st = crea(); cli.stA = crea();
      cli.sq = cli.io >= 0 ? cli.st.eroi[cli.io].sq : 0;
      cli.dec = C.decodificatore(cli.st, cli.sq); cli.decA = C.decodificatore(cli.stA, cli.sq);
      coda.length = 0; fA = 0; pt = 0; nonUsati.length = 0; haPred = false; offX = offY = 0; S = null; premuti.length = 0;
      tAtt0 = tSup0 = -99;
      if (cli.fase !== 'guarda') cli.fase = 'carica';
      emetti('car', cli);
    }
    function via(tra) {
      cli.fase = cli.spettatore ? 'guarda' : 'gioco'; giocando = true; inizioT = ora() + (tra || 0);
      azzeraJitter(); stalloDa = -1;
      emetti('via', tra || 0);
    }
    function rientro(m) {
      // GBT2311: eliminato che guardava (sopravvivenza): di nuovo la strada spettatore (la foto arriva con `sfoto`)
      if (m.fase === 'guarda') { if (m.mio !== undefined) cli.io = m.mio; cli.spettatore = true; cli.elimGuarda = true; cli.fase = 'guarda'; attesaFoto = true; emetti('gok', { rientro: true }); return; }
      // la pagina e' stata ricaricata o la rete e' saltata: si riprende da dove dice il server
      if (m.car && (!cli.st || !cli.cfg)) prepara(m.car);
      if (m.fase === 'scelta' && m.sel) { cli.fase = 'scelta'; cli.sel = m.sel; emetti('sel', m.sel); }
      if (m.fase === 'gioco') { attesaFoto = true; if (!giocando) via(0); }
      else attesaFoto = false;
    }
    function caricaFoto(F) {
      attesaFoto = false;
      cli.decA.carica(F); cli.dec.carica(F);
      coda.length = 0; fA = F.f; pt = F.f; nonUsati.length = 0; haPred = false; S = null;
      azzeraJitter();
    }

    // ---------------- arrivo di un passo ----------------
    function azzeraJitter() { arrivi.length = 0; base = 0; jit = DT_MS; }
    function arrivo(pk) {
      var t = ora();
      cli.perf.pacchetti++;
      if (pk.f !== cli.decA.f + 1 && cli.decA.f !== 0) { if (o.log) o.log('buco nei passi: ' + cli.decA.f + ' -> ' + pk.f); }
      cli.decA.applica(pk);
      coda.push(pk);
      // jitter: offset d'arrivo rispetto al passo; base = il piu' veloce degli ultimi 3 s, jit = 95° percentile del ritardo
      var off = t - pk.f * DT_MS;
      arrivi.push(off); if (arrivi.length > 90) arrivi.shift();
      var mn = Infinity; for (var i = 0; i < arrivi.length; i++) if (arrivi[i] < mn) mn = arrivi[i];
      base = mn;
      // 90° percentile: i rari buchi lunghi di TCP (pacchetto ritrasmesso) non allargano il ritardo di tutti: li copre l'inerzia
      if (arrivi.length >= 4) { var lat = arrivi.map(function (x) { return x - mn; }); jit = perc(lat, 0.9); } else jit = DT_MS;
      ultimoArrivo = t;
      // input usati dal server: fuori dalla lista; quanto ci ha messo (si sente il colpo dopo almeno questo)
      var a = pk.a | 0;
      while (nonUsati.length && nonUsati[0].s <= a) { var u = nonUsati.shift(); cli.perf.conferma.push(t - u.t); if (cli.perf.conferma.length > 2000) cli.perf.conferma.splice(0, 1000); }
      if (cli.io >= 0 && !cli.spettatore) riconcilia();
    }

    // ---------------- previsione del proprio eroe ----------------
    function copiaEroe(h) { var c = {}; for (var k in h) { var v = h[k]; if (v === null || typeof v !== 'object' || k === 'd') c[k] = v; } return c; }
    function libero(h) { return h.vivo && !(h.tirT > 0) && !(h.salT > 0) && !(h.dashD > 0); }
    function passoPrev(h, c, tt) {
      for (var i = 0; i < TIMER_PREV.length; i++) { var f = TIMER_PREV[i]; if (h[f] > 0) h[f] -= DT; }
      if (!libero(h)) return;
      M.decodificaInput(c, tmpInp);
      var t0 = cli.stA.t; cli.stA.t = tt;
      M.muoviLibero(cli.stA, h, tmpInp, true);
      cli.stA.t = t0;
    }
    function riconcilia() {
      var hA = cli.stA.eroi[cli.io];
      var nS = copiaEroe(hA), pura = libero(hA) && S && libero(S) && !(hA.prepT > 0) && !(hA.seqN > 0) && !(hA.stun > 0) && !(hA.slowT > 0) && !hA.kx && !hA.ky && cli.stA.t - hA.tCol > 15;
      for (var i = 0; i < nonUsati.length; i++) { if ((nonUsati[i].c >>> 14) & 3) pura = false; passoPrev(nS, nonUsati[i].c, cli.stA.t + 1 + i); }
      if (haPred && S && S.vivo && hA.vivo) {
        var dx = predX - nS.x, dy = predY - nS.y, d = Math.sqrt(dx * dx + dy * dy);
        // scivolata dolce; un salto lungo (rinascita, scambio di posto, scatto lungo) si fa subito, senza strisciare
        if (d > 1.5) { offX = 0; offY = 0; } else if (d > 1e-6) { offX += dx; offY += dy; }
        if (d > 0.03) {
          cli.perf.corr++; cli.perf.corrSum += d; if (d > cli.perf.corrMax) cli.perf.corrMax = d;
          // «pura» = solo movimento (niente tasti in volo, scatti, salti, preparazioni, colpi presi o spinte): l'errore vero della previsione
          if (pura) { cli.perf.corrP++; cli.perf.corrPSum += d; if (d > cli.perf.corrPMax) cli.perf.corrPMax = d; }
        }
        // la differenza fra il passo locale prima e dopo resta la stessa: si sposta anche il punto di partenza
        predX0 -= dx; predY0 -= dy;
      } else { predX0 = nS.x; predY0 = nS.y; }
      S = nS; predX = S.x; predY = S.y; haPred = true;
    }
    function tickInput(t) {
      var src = o.leggiInput ? o.leggiInput(cli) : inp;
      var c = M.codificaInput(src || inp) >>> 0;
      seq++;
      gb({ o: 'i', n: seq, d: [c] });
      cli.perf.inputs++;
      nonUsati.push({ s: seq, c: c, t: t });
      if (nonUsati.length > 90) nonUsati.shift();
      var az = (c >>> 14) & 3;
      if (az === 1 || az === 2) { premuti.push({ az: az, t: t, s: seq }); if (premuti.length > 40) premuti.shift(); }
      if (S) { predX0 = S.x; predY0 = S.y; passoPrev(S, c, cli.stA.t + nonUsati.length); predX = S.x; predY = S.y; }
    }

    // ---------------- il ciclo della pagina (o del banco): un fotogramma ----------------
    // onPasso(st) per ogni passo confermato riprodotto (eventi: suoni ed effetti). Restituisce alpha per il disegno.
    cli.avanza = function (dt, onPasso) {
      var t = ora();
      if (!giocando || !cli.st) return 0;
      if (t - pingT > 1000 && !cli.spettatore) { pingT = t; gb({ o: 'p', c: t }); }
      // input a 30/s (anche durante il conto alla rovescia: il server li usa dal suo passo 1)
      if (!cli.spettatore && cli.fase === 'gioco' && !attesaFoto && t >= inizioT - 150) {
        accIn += dt;
        if (accIn > 0.2) accIn = 0.2;
        while (accIn >= DT) { accIn -= DT; tickInput(t); }
      }
      // tempo di riproduzione: dietro al passo piu' nuovo di (jitter + margine)
      if (!coda.length && fA === 0) return 0;
      // il passo da mostrare e' fra floor(pt) e floor(pt)+1: serve gia' arrivato floor(pt)+1, quindi un passo in meno
      var bersaglio = (t - base - jit - 6) / DT_MS - 1;
      pt += dt * 30;
      var dif = bersaglio - pt;
      if (dif > 8 || dif < -8) pt = bersaglio; else pt += dif * Math.min(1, dt * 2.5);
      var ultimo = coda.length ? coda[coda.length - 1].f : fA;
      var tetto = ultimo - 1 + 0.999;
      cli.estrap = 0;
      if (pt > tetto) {
        // il passo che servirebbe non e' ancora arrivato (un pacchetto ritrasmesso da TCP ferma la fila): gli altri eroi e i
        // proiettili proseguono per inerzia fino a 250 ms (solo nel disegno, cli.sovrapponi); oltre, si vede un fermo.
        if (stalloDa < 0) stalloDa = t;
        pt = tetto;
        if (!cli.pausa && cli.st && !cli.st.fine) cli.estrap = Math.min(ESTRAP_MAX, (t - stalloDa) / 1000);
      } else if (stalloDa >= 0) {
        var dur = t - stalloDa; stalloDa = -1;
        if (!cli.pausa && dur > 40 && cli.st && !cli.st.fine) {
          cli.perf.buchi++; if (dur > cli.perf.bucoMax) cli.perf.bucoMax = dur;
          var vis = dur - ESTRAP_MAX * 1000;   // fermo VISIBILE = la parte del buco oltre l'inerzia
          if (vis > 0) { cli.perf.fermi++; cli.perf.fermoTot += vis; if (vis > cli.perf.fermoMax) cli.perf.fermoMax = vis; }
        }
      }
      if (pt < fA - 1) pt = fA - 1;
      var vuoi = Math.floor(pt) + 1, n = 0;
      while (coda.length && coda[0].f <= vuoi && n < 12) {
        var pk = coda.shift();
        cli.dec.applica(pk);
        fA = pk.f; n++; cli.perf.passi++;
        if (pk.ts) { var vd = Date.now() - pk.ts; if (vd > -1000 && vd < 10000) { cli.perf.vedo.push(vd); if (cli.perf.vedo.length > 3000) cli.perf.vedo.splice(0, 1500); } }
        misuraColpo(t, pk.a | 0);
        if (cli.spettatore) visTutti(cli.st);   // GBT2311: vista neutra dello spettatore (prima degli effetti e dei suoni)
        if (onPasso) onPasso(cli.st);
      }
      if (n) { cli.perf.buf.push(jit); if (cli.perf.buf.length > 3000) cli.perf.buf.splice(0, 1500); }
      cli.perf.div = cli.dec.div + cli.decA.div; cli.perf.hmOk = cli.dec.hmOk;
      // la correzione del proprio eroe si scioglie in ~100 ms
      var k = Math.exp(-dt / 0.1); offX *= k; offY *= k;
      if (Math.abs(offX) < 1e-4) offX = 0; if (Math.abs(offY) < 1e-4) offY = 0;
      var al = pt - Math.floor(pt);
      return al < 0 ? 0 : al > 1 ? 1 : al;
    };
    // «colpo confermato»: dal dito (l'ultima pressione che il server aveva gia' usato in quel passo) allo sparo sullo schermo
    // fine partita / banco: riproduce subito tutto quello che e' arrivato (niente piu' attesa del jitter)
    cli.svuota = function (onPasso) { while (coda.length) { var pk = coda.shift(); cli.dec.applica(pk); fA = pk.f; cli.perf.passi++; if (cli.spettatore) visTutti(cli.st); if (onPasso) onPasso(cli.st); } cli.perf.div = cli.dec.div + cli.decA.div; cli.perf.hmOk = cli.dec.hmOk; };
    function misuraColpo(t, ack) {
      if (cli.io < 0) return;
      var h = cli.st.eroi[cli.io];
      if (h.tAtt !== tAtt0) { if (h.tAtt === cli.st.t) prendi(1, t, ack); tAtt0 = h.tAtt; }
      if (h.tSup !== tSup0) { if (h.tSup === cli.st.t) prendi(2, t, ack); tSup0 = h.tSup; }
    }
    function prendi(az, t, ack) {
      var best = -1;
      for (var i = 0; i < premuti.length; i++) if (premuti[i].az === az && premuti[i].s <= ack) best = i;
      if (best < 0) return;
      var d = t - premuti[best].t;
      premuti.splice(0, best + 1);
      if (d >= 0 && d < 2000) { cli.perf.colpo.push(d); if (cli.perf.colpo.length > 1000) cli.perf.colpo.splice(0, 500); }
    }

    // ---------------- il proprio eroe nel disegno: previsto + correzione che si scioglie ----------------
    cli.sovrapponi = function () {
      var fatto = estrapola();
      if (cli.io < 0 || !haPred || !cli.st || cli.spettatore) return fatto;
      var h = cli.st.eroi[cli.io];
      if (!h.vivo || !S || !S.vivo) return fatto;
      for (var i = 0; i < SOVRA.length; i++) salvati[SOVRA[i]] = h[SOVRA[i]];
      var a = Math.min(1, accIn / DT), x = predX0 + (predX - predX0) * a + offX, y = predY0 + (predY - predY0) * a + offY;
      h.x = h.ox = x; h.y = h.oy = y; h.vx = S.vx; h.vy = S.vy; h.aim = S.aim; h.fac = S.fac; h.mosso = S.mosso;
      return true;
    };
    // durante un buco nei passi: gli altri (e i proiettili dritti) proseguono con la loro velocita', mai dentro un muro
    function estrapola() {
      estr.length = 0;
      var s = cli.estrap, st = cli.st;
      if (!(s > 0) || !st) return false;
      for (var k = 0; k < st.eroi.length; k++) {
        if (k === cli.io && !cli.spettatore) continue;
        var h = st.eroi[k];
        if (!h.vivo || !st.vis[k] || h.salT > 0 || h.tirT > 0) continue;
        var nx = h.x + (h.vx + h.kx) * s, ny = h.y + (h.vy + h.ky) * s;
        if (M.bloccaPasso(st, Math.floor(nx), Math.floor(ny))) continue;
        estr.push(h, h.x, h.y, h.ox, h.oy); h.x = h.ox = nx; h.y = h.oy = ny;
      }
      for (var i = 0; i < st.pr.length; i++) {
        var p = st.pr[i];
        if (!p.vivo || p.k !== 0) continue;
        estr.push(p, p.x, p.y, p.ox, p.oy); p.x = p.ox = p.x + p.vx * s; p.y = p.oy = p.y + p.vy * s;
      }
      return estr.length > 0;
    }
    cli.ripristina = function () {
      for (var e = estr.length - 5; e >= 0; e -= 5) { var o = estr[e]; o.x = estr[e + 1]; o.y = estr[e + 2]; o.ox = estr[e + 3]; o.oy = estr[e + 4]; }
      estr.length = 0;
      if (cli.io < 0 || !cli.st) return;
      var h = cli.st.eroi[cli.io];
      if (salvati.x === undefined) return;
      for (var i = 0; i < SOVRA.length; i++) h[SOVRA[i]] = salvati[SOVRA[i]];
      salvati.x = undefined;
    };
    cli.posPrevista = function () { return haPred ? { x: predX + offX, y: predY + offY, off: Math.sqrt(offX * offX + offY * offY) } : null; };
    cli.input = inp;
    cli.statoArrivo = function () { return cli.stA; };

    cli.riassunto = function () {
      var p = cli.perf, sec = Math.max(1, (ora() - p.t0) / 1000);
      return {
        rtt_med: tondo(mediana(p.rtt)), rtt_p95: tondo(perc(p.rtt, 0.95)), corr: p.corr, corr_med: p.corr ? tondo(p.corrSum / p.corr * 100) / 100 : 0,
        buchi: p.buchi, buco_max: Math.round(p.bucoMax), corr_max: Math.round(p.corrMax * 1000) / 1000, corr_mov: p.corrP, corr_mov_med: p.corrP ? Math.round(p.corrPSum / p.corrP * 1000) / 1000 : 0, corr_mov_max: Math.round(p.corrPMax * 1000) / 1000, fermi: p.fermi, fermo_max: Math.round(p.fermoMax), fermo_tot: Math.round(p.fermoTot),
        vedo_med: tondo(mediana(p.vedo)), vedo_p95: tondo(perc(p.vedo, 0.95)), conferma_med: tondo(mediana(p.conferma)), conferma_p95: tondo(perc(p.conferma, 0.95)),
        colpo_med: tondo(mediana(p.colpo)), colpo_p10: tondo(perc(p.colpo, 0.1)), colpo_p95: tondo(perc(p.colpo, 0.95)), colpi: p.colpo.length, buf_med: tondo(mediana(p.buf)),
        pacchetti: p.pacchetti, passi: p.passi, kbs: Math.round(p.byte / sec / 102.4) / 10, div: p.div, hm: p.hmOk, rientri: p.rientri, inputs: p.inputs
      };
    };
    return cli;
  }

  var Rete = { cliente: cliente, DT: DT };
  root.ReteGB = Rete;
  if (typeof module !== 'undefined') module.exports = Rete;
})(typeof window !== 'undefined' ? window : globalThis);
