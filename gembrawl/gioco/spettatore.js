// GEM BRAWL — spettatore in partita + replay (23/11).
//  • da KO in attesa di rinascita: la camera segue un altro eroe (alleati prima, poi tutti), «Stai guardando: X» + conto della rinascita
//  • in sopravvivenza da eliminato: scegli «Guarda» o «Esci»; guardando c'è «Salta» (il resto della partita in un attimo → fine)
//  • cambio eroe: ← → / Q E / Tab, dorsali LB RB del pad, swipe orizzontale o i due pulsanti sul telefono
//  • ogni partita si registra (replay.js): l'ultima resta in localStorage «gb_replay_ultima»
//  • ?replay=ultima oppure ?replay=<file.json> rigioca la partita identica e alla fine la confronta (window.__brawl.replayVerifica)
// Si aggancia a gioco.js con SPETT.inizia / SPETT.passo / SPETT.fine / SPETT.prendiReplay e il ponte window.__brawl.ponteSpett.
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  var TXT = {
    it: { guardi: 'Stai guardando', rinasci: 'Rinasci tra', elim: 'ELIMINATO', posto: '° posto', guarda: 'Guarda', esci: 'Esci', salta: 'Salta',
      replay: 'REPLAY', diretta: 'IN DIRETTA', tu: 'tu', fineReg: 'Fine della registrazione', ok: 'Replay identico', no: 'Replay diverso', prec: 'Eroe precedente', succ: 'Eroe successivo',
      ancora: 'La partita continua senza di te', nessuno: 'Nessuno da guardare' },
    en: { guardi: 'Watching', rinasci: 'Respawn in', elim: 'ELIMINATED', posto: '', guarda: 'Watch', esci: 'Leave', salta: 'Skip',
      replay: 'REPLAY', diretta: 'LIVE', tu: 'you', fineReg: 'End of recording', ok: 'Replay identical', no: 'Replay differs', prec: 'Previous hero', succ: 'Next hero',
      ancora: 'The match goes on without you', nessuno: 'Nobody to watch' }
  };
  function ordinale(n, en) { return en ? n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th') + ' place' : n + '° posto'; }
  function APP_PAUSA() { var f = document.getElementById('pausa'); return !!(f && f.classList.contains('on')); }
  function ponte() { return window.__brawl && window.__brawl.ponteSpett; }
  function L() { var p = ponte(); return TXT[p && p.lang() === 'en' ? 'en' : 'it']; }

  // ---------------- interfaccia (DOM sopra la tela) ----------------
  var el = {}, costruita = false;
  function crea(tag, cls, padre, testo) { var e = document.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; if (padre) padre.appendChild(e); return e; }
  function costruisci() {
    if (costruita) return; costruita = true;
    var bar = el.bar = crea('div', 'sp-barra', document.body); bar.id = 'sp-barra'; bar.hidden = true;
    el.prec = crea('button', 'sp-freccia sp-sx', bar); el.prec.type = 'button'; el.prec.innerHTML = '<i></i>';
    var mezzo = crea('div', 'sp-mezzo', bar);
    el.faccia = crea('span', 'sp-faccia', mezzo);
    var tx = crea('div', 'sp-testi', mezzo);
    el.eti = crea('small', 'sp-eti', tx);
    el.nome = crea('b', 'sp-nome', tx);
    el.conto = crea('div', 'sp-conto', mezzo);
    el.succ = crea('button', 'sp-freccia sp-dx', bar); el.succ.type = 'button'; el.succ.innerHTML = '<i></i>';
    el.azioni = crea('div', 'sp-azioni', document.body); el.azioni.hidden = true;
    el.salta = crea('button', 't3 corto sp-salta', el.azioni); el.salta.type = 'button'; el.salta.style.setProperty('--k', '#ffd23b');
    crea('span', 'luce', el.salta); el.saltaT = crea('span', '', el.salta);
    el.esciB = crea('button', 't3 corto sp-esci', el.azioni); el.esciB.type = 'button'; el.esciB.style.setProperty('--k', '#ff4d5e');
    crea('span', 'luce', el.esciB); el.esciBT = crea('span', '', el.esciB);
    el.tag = crea('div', 'sp-tag', document.body); el.tag.hidden = true;
    // scelta da eliminato (sopravvivenza)
    var sc = el.scelta = crea('div', 'sp-scelta', document.body); sc.hidden = true;
    var box = crea('div', 'sp-box', sc);
    el.sTit = crea('h2', 'cromo sp-tit', box);
    el.sPos = crea('p', 'sp-pos', box);
    el.sSub = crea('p', 'sp-sub', box);
    var riga = crea('div', 'sp-riga', box);
    el.sGuarda = crea('button', 't3 corto', riga); el.sGuarda.type = 'button'; el.sGuarda.style.setProperty('--k', '#1ad7ff'); crea('span', 'luce', el.sGuarda); el.sGuardaT = crea('span', '', el.sGuarda);
    el.sEsci = crea('button', 't3 corto', riga); el.sEsci.type = 'button'; el.sEsci.style.setProperty('--k', '#ff4d5e'); crea('span', 'luce', el.sEsci); el.sEsciT = crea('span', '', el.sEsci);
    // tocchi: si ferma qui (niente levette sotto ai pulsanti)
    [bar, el.azioni, sc].forEach(function (n) { ['pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach(function (ev) { n.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); }); });
    el.prec.onclick = function () { cambia(-1); };
    el.succ.onclick = function () { cambia(1); };
    el.salta.onclick = function () { salta(); };
    el.esciB.onclick = function () { esci(); };
    el.sGuarda.onclick = function () { S.scelta = 'guarda'; el.scelta.hidden = true; suono('tasto'); };
    el.sEsci.onclick = function () { esci(true); };
  }
  function suono(n) { try { if (window.Suoni && Suoni[n]) Suoni[n](); } catch (e) { } }

  // ---------------- stato ----------------
  var S = { on: false, modo: '', bersaglio: -1, elim: false, scelta: '', killT: 0, pos: 0, visto: 0, padPrec: [false, false], verif: null };
  var SPETT = window.SPETT = {
    attivo: false, senzaComandi: false, daRigiocare: null,
    prendiReplay: function () { var d = SPETT.daRigiocare; SPETT.daRigiocare = null; return d; },
    inizia: function (P) {
      costruisci();
      S.on = false; S.bersaglio = -1; S.elim = false; S.scelta = ''; S.verif = null; S.killT = 0; S.allPassato = false;
      el.scelta.hidden = true; el.bar.hidden = true; el.azioni.hidden = true; el.tag.hidden = true;
      SPETT.attivo = SPETT.senzaComandi = false;
      S.visto = performance.now();   // il controllo «partita sparita» non deve scattare prima del primo fotogramma
      if (P && P.rep) { S.on = true; S.modo = 'replay'; S.bersaglio = 0; }
      if (P && P.rec) P.rec.intest.versioni = versioni();   // la partita si rigioca uguale solo con gli stessi motore/IA/eroi/mappe
      if (P && P.rec && TRASMETTI) DIR.trasmetti(P);
      if (P && P.rep && P.rep.dati.diretta) DIR.aggancia(P);
    },
    versioni: versioni,
    passo: passo, fine: fine, cambia: cambia, salta: salta,
    stato: function () { return { on: S.on, modo: S.modo, bersaglio: S.bersaglio, elim: S.elim, scelta: S.scelta, nome: el.nome ? el.nome.textContent : '', conto: el.conto ? el.conto.textContent : '', barra: el.bar ? !el.bar.hidden : false, sceltaVis: el.scelta ? !el.scelta.hidden : false }; },
    // scarica l'ultima registrazione come file .json (per i replay da file e per le prove)
    scarica: function () {
      var d = window.__brawl && window.__brawl.replayUltima; if (!d) return false;
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' }));
      a.download = 'gembrawl_replay_' + (d.quando || Date.now()) + '.json'; document.body.appendChild(a); a.click(); a.remove(); return true;
    }
  };

  // chi si può guardare: vivi, prima gli alleati (in ordine), poi tutti gli altri. Nel replay anche il giocatore 0.
  function lista(st) {
    var me = st.eroi[0], al = [], al2 = [];
    for (var i = 0; i < st.eroi.length; i++) {
      var h = st.eroi[i]; if (!h.vivo) continue;
      if (i === 0) { if (S.modo === 'replay') al.unshift(0); continue; }
      if (st.modo !== 'sopravvivenza' && h.sq === me.sq) al.push(i); else al2.push(i);
    }
    return al.concat(al2);
  }
  function cambia(d) {
    var P = ponte() && ponte().P(); if (!P || !SPETT.attivo) return;
    var l = lista(P.st); if (!l.length) return;
    var k = l.indexOf(S.bersaglio);
    S.bersaglio = l[((k < 0 ? (d > 0 ? -1 : 0) : k) + d + l.length) % l.length];
    S.killT = 0; suono('tasto');
    if (el.nome) { el.bar.classList.remove('sp-cambio'); void el.bar.offsetWidth; el.bar.classList.add('sp-cambio'); }
  }
  function salta() { var p = ponte(); if (p) { p.salta(); suono('tasto'); } }
  function esci(fineSubito) {
    var p = ponte(), P = p && p.P();
    nascondi();
    if (!P) return;
    // in sopravvivenza da eliminato il posto è già deciso: si va ai risultati (il resto si gioca in un attimo)
    if (S.elim && !P.rep && fineSubito) { S.scelta = 'esci'; p.salta(); return; }
    p.esci();
  }
  function nascondi() {
    SPETT.attivo = SPETT.senzaComandi = false;
    if (!costruita) return;
    el.bar.hidden = true; el.azioni.hidden = true; el.scelta.hidden = true; el.tag.hidden = true;
    if (window.R3) R3.segui = null;
  }

  function passo(st, dt, P) {
    S.visto = performance.now();
    var me = st.eroi[0], B = window.__brawl;
    if (B.fase === 'finale' || st.fine) { if (S.on || SPETT.attivo) { el.bar.hidden = true; el.azioni.hidden = true; el.scelta.hidden = true; } return; }
    if (P.rep) { if (!S.on) { S.on = true; S.modo = 'replay'; if (S.bersaglio < 0) S.bersaglio = 0; } }
    else {
      if (me.vivo) { if (S.on) { S.on = false; nascondi(); } return; }
      if (!S.on) {
        // appena caduto: si guarda chi mi ha messo KO (la killcam di gioco.js), poi il primo alleato
        S.on = true; S.modo = me.rt < 0 ? 'elim' : 'ko'; S.elim = me.rt < 0; S.scelta = ''; S.allPassato = false;
        S.bersaglio = window.R3 && R3.segui != null ? R3.segui : -1; S.killT = P.seguiT || 0;
        if (S.elim) {
          var vivi = 0; for (var i = 0; i < st.eroi.length; i++) if (st.eroi[i].vivo) vivi++;
          S.pos = vivi + 1;
          S.sceltaT = 1.1;   // la scelta compare dopo un attimo: prima si vede il KO
        }
      }
    }
    SPETT.attivo = true; SPETT.senzaComandi = true;
    var l = lista(st);
    if (S.killT > 0) S.killT -= dt;
    // bersaglio morto o nessuno: il prossimo della lista (alleati prima)
    if (S.bersaglio < 0 || !st.eroi[S.bersaglio] || !st.eroi[S.bersaglio].vivo || (S.killT <= 0 && S.bersaglio >= 0 && l.indexOf(S.bersaglio) < 0)) S.bersaglio = l.length ? l[0] : -1;
    // dopo la killcam, se c'è un alleato vivo si passa a lui (solo la prima volta)
    if (S.killT <= 0 && S.modo === 'ko' && !S.allPassato) { S.allPassato = true; for (var a = 0; a < l.length; a++) if (st.eroi[l[a]].sq === me.sq && st.modo !== 'sopravvivenza') { S.bersaglio = l[a]; break; } }
    if (window.R3) R3.segui = S.bersaglio >= 0 ? S.bersaglio : null;
    // diretta: chi è indietro (arrivato tardi, volo d'apertura, scheda in pausa) si rimette in pari
    if (P.rep && P.rep.diretta) {
      var dietro = P.rep.pronti() - P.rep.riserva;
      if (dietro > 150) ponte().salta();                       // oltre 5 s: in pari subito, senza disegno
      else if (dietro > 8 && !APP_PAUSA()) P.acc += dt * 0.5;  // poco dietro: si va 1,5 volte più veloci finché si torna a ~1 s
    }
    leggiPad();
    disegna(st, me, P, dt);
  }

  function disegna(st, me, P, dt) {
    var t = L(), p = ponte(), en = p.lang() === 'en';
    // scelta da eliminato
    if (S.elim && !S.scelta && !P.rep) {
      S.sceltaT -= dt;
      if (S.sceltaT <= 0 && el.scelta.hidden) {
        el.scelta.hidden = false;
        el.sTit.textContent = t.elim; el.sPos.textContent = ordinale(S.pos, en); el.sSub.textContent = t.ancora;
        el.sGuardaT.textContent = t.guarda; el.sEsciT.textContent = t.esci;
      }
    }
    var h = S.bersaglio >= 0 ? st.eroi[S.bersaglio] : null;
    el.bar.hidden = false;
    var dir = !!(P.rep && P.rep.diretta);
    el.eti.textContent = (S.modo === 'replay' ? (dir ? t.diretta : t.replay) + ' · ' : '') + t.guardi;
    var stretto = innerWidth < 480 && S.modo === 'ko' && me.rt > 0;   // telefono in verticale col conto accanto: nome corto (FANTE, non FANTE DI QU…)
    var nm = h ? (stretto ? p.nomeCorto(h.id) : p.nome(h.id)) + (h.i === 0 ? ' (' + t.tu + ')' : '') : t.nessuno;
    if (el.nome.textContent !== nm) el.nome.textContent = nm;
    var amico = h && (S.modo === 'replay' ? h.i === 0 || (st.modo !== 'sopravvivenza' && h.sq === me.sq) : (st.modo !== 'sopravvivenza' && h.sq === me.sq));
    el.bar.style.setProperty('--kh', h ? p.colore(h.id) : '#888');
    el.bar.style.setProperty('--ks', amico ? '#3fb3ff' : '#ff4d5e');
    if (h && el.faccia.dataset.id !== h.id) { el.faccia.dataset.id = h.id; el.faccia.style.backgroundImage = 'url("' + (p.busto ? p.busto(h.id) : 'ui/icone/' + h.id + '.webp') + '")'; }
    // conto della rinascita
    if (S.modo === 'ko' && me.rt > 0) { var c = String(Math.ceil(me.rt)); el.conto.hidden = false; if (el.conto.textContent !== c) { el.conto.textContent = c; el.conto.classList.remove('batti'); void el.conto.offsetWidth; el.conto.classList.add('batti'); } el.conto.title = t.rinasci; el.conto.dataset.eti = t.rinasci; }
    else el.conto.hidden = true;
    el.prec.title = t.prec; el.succ.title = t.succ; el.prec.setAttribute('aria-label', t.prec); el.succ.setAttribute('aria-label', t.succ);
    // azioni: Salta (eliminato o replay) ed Esci (replay)
    var vediSalta = (S.elim && S.scelta === 'guarda') || (S.modo === 'replay' && !dir), vediEsci = S.modo === 'replay' || (S.elim && S.scelta === 'guarda');
    el.azioni.hidden = !(vediSalta || vediEsci);
    el.salta.hidden = !vediSalta; el.esciB.hidden = !vediEsci;
    el.saltaT.textContent = t.salta; el.esciBT.textContent = t.esci;
    // fine della registrazione senza fine partita (replay interrotto)
    if (P.rep && P.rep.finito() && !st.fine && (!P.rep.diretta || P.rep.chiuso)) {
      el.tag.hidden = false; el.tag.textContent = t.fineReg;
      // la registrazione è finita ma la partita no: file del gioco cambiati (o registrazione interrotta). Lo si dice, non si resta muti.
      var B = window.__brawl;
      if (!B.replayVerifica) { var va = P.rep.dati.versioni, vo = versioni(); B.replayVerifica = { uguale: false, diff: [P.rep.dati.esito && P.rep.dati.esito.vinc !== null ? 'la registrazione è finita ma la partita no' : 'registrazione interrotta'], deragliato: P.rep.deragliato, esito: null, atteso: P.rep.dati.esito, avviso: va && JSON.stringify(va) !== JSON.stringify(vo) ? 'versioni diverse: registrata ' + JSON.stringify(va) + ', ora ' + JSON.stringify(vo) : '' }; console.log('[replay] DIVERSO — ' + B.replayVerifica.diff[0] + ' (deragliato al passo ' + P.rep.deragliato + ') ' + B.replayVerifica.avviso); }
    }
  }

  // tasti: ← → / Q E / Tab (solo guardando; da vivo le frecce muovono l'eroe come sempre)
  addEventListener('keydown', function (e) {
    if (!SPETT.attivo || e.repeat) return;
    var k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'q') { cambia(-1); e.preventDefault(); }
    else if (k === 'arrowright' || k === 'e' || k === 'tab') { cambia(e.shiftKey && k === 'tab' ? -1 : 1); e.preventDefault(); }
  }, true);
  // swipe orizzontale sullo schermo (telefono)
  var sw = null;
  addEventListener('pointerdown', function (e) { if (SPETT.attivo && e.pointerType !== 'mouse') sw = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; }, { capture: true, passive: true });
  addEventListener('pointerup', function (e) {
    if (!sw || e.pointerId !== sw.id) return;
    var dx = e.clientX - sw.x, dy = e.clientY - sw.y, dtm = performance.now() - sw.t; sw = null;
    if (SPETT.attivo && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && dtm < 600) cambia(dx < 0 ? 1 : -1);
  }, { capture: true, passive: true });
  // le versioni (?v=) dei file che decidono la partita: un replay con file diversi può uscire diverso, e lo diciamo
  function versioni() {
    var o = {}, sc = document.scripts;
    for (var i = 0; i < sc.length; i++) { var m = /(?:^|\/)(motore|ia|eroi|mappe|taratura|replay)\.js(?:\?v=([^&#]*))?/.exec(sc[i].getAttribute('src') || ''); if (m) o[m[1]] = m[2] || '-'; }
    return o;
  }
  // pad: LB / RB
  function leggiPad() {
    var g = navigator.getGamepads ? navigator.getGamepads() : null, p = null;
    if (g) for (var i = 0; i < g.length; i++) if (g[i] && g[i].connected) { p = g[i]; break; }
    if (!p) return;
    var lb = !!(p.buttons[4] && p.buttons[4].pressed), rb = !!(p.buttons[5] && p.buttons[5].pressed);
    if (lb && !S.padPrec[0]) cambia(-1); if (rb && !S.padPrec[1]) cambia(1);
    S.padPrec[0] = lb; S.padPrec[1] = rb;
  }
  // uscita dalla partita da altre strade (pausa → esci): la barra non resta appesa
  setInterval(function () { if ((SPETT.attivo || S.on) && performance.now() - S.visto > 400) { S.on = false; nascondi(); } }, 250);

  // ---------------- fine partita: salva la registrazione / verifica il replay ----------------
  function fine(P, st) {
    var B = window.__brawl;
    if (P.rec) {
      if (DIR.tx && DIR.tx.P === P) DIR.pezzo();   // l'ultimo pezzo PRIMA di chiudere
      var d = P.rec.chiudi(st);
      if (DIR.tx && DIR.tx.P === P) DIR.fine(d.esito);
      B.replayUltima = d;
      try { localStorage.setItem('gb_replay_ultima', JSON.stringify(d)); } catch (e) { }
    }
    if (P.rep) {
      var esito = { vinc: st.fine.vinc, motivo: st.fine.motivo, t: st.t, ordine: (st.ordine || []).slice(), ko: P.rep.ko };
      var diff = REPLAY.confronta(P.rep.dati.esito, esito);
      B.replayVerifica = { uguale: !diff.length && P.rep.deragliato < 0, diff: diff, deragliato: P.rep.deragliato, esito: esito, atteso: P.rep.dati.esito };
      var va = P.rep.dati.versioni, vo = versioni(); if (va && JSON.stringify(va) !== JSON.stringify(vo)) B.replayVerifica.avviso = 'versioni diverse: registrata ' + JSON.stringify(va) + ', ora ' + JSON.stringify(vo);
      console.log('[replay] ' + (B.replayVerifica.uguale ? 'identico' : 'DIVERSO') + ' — vincitore ' + esito.vinc + ', KO ' + esito.ko.length, diff.join('; '));
      var t = L(); el.tag.hidden = false; el.tag.classList.toggle('no', !B.replayVerifica.uguale);
      el.tag.textContent = B.replayVerifica.uguale ? t.ok : t.no;
      setTimeout(function () { el.tag.hidden = true; }, 3500);
    }
  }

  // ---------------- DIRETTA (base degli spettatori esterni, 23/11) ----------------
  // ?trasmetti=locale : ogni 100 ms il pezzo nuovo della partita (input del giocatore + impronte) esce sul canale
  // ?guarda=locale    : un'altra scheda dello stesso browser la guarda in diretta, ~1 s indietro; chi arriva tardi chiede tutto e si rimette in pari
  // Sul VPS il canale diventerà il WebSocket di turfwar-rt (vedi PIANO_SPETTATORI_ESTERNI.md): gli stessi messaggi
  //   via {id, intest} · pezzo {id, p} · fine {id, esito} · chiedi {} → tutto {id, intest, pezzi, esito}
  var TRASMETTI = Q.get('trasmetti'), GUARDA = Q.get('guarda');
  function canale() {
    if (DIR.c) return DIR.c;
    var bc = null; try { bc = new BroadcastChannel('gembrawl_diretta'); } catch (e) { return null; }
    DIR.c = { manda: function (o) { try { bc.postMessage(o); } catch (e) { } }, su: function (fn) { bc.onmessage = function (e) { fn(e.data); }; } };
    return DIR.c;
  }
  var DIR = SPETT.diretta = {
    c: null, tx: null, rx: null,
    // giocatore
    trasmetti: function (P) {
      var c = canale(); if (!c) return;
      if (DIR.tx && DIR.tx.timer) clearInterval(DIR.tx.timer);
      var tx = DIR.tx = { P: P, id: (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).slice(-8), intest: JSON.parse(JSON.stringify(P.rec.intest)), pezzi: [], esito: null };
      c.manda({ tipo: 'via', id: tx.id, intest: tx.intest });
      tx.timer = setInterval(function () {
        var p = ponte(); if (!p || p.P() !== P) { clearInterval(tx.timer); if (!tx.esito) c.manda({ tipo: 'fine', id: tx.id, esito: null }); return; }
        DIR.pezzo();
      }, 100);
      c.su(function (m) { if (m && m.tipo === 'chiedi' && DIR.tx) c.manda({ tipo: 'tutto', id: DIR.tx.id, intest: DIR.tx.intest, pezzi: DIR.tx.pezzi, esito: DIR.tx.esito }); });
    },
    pezzo: function () { var tx = DIR.tx; if (!tx || !tx.P.rec || tx.esito) return; var p = tx.P.rec.pacchetto(); if (!p.n) return; tx.pezzi.push(p); DIR.c.manda({ tipo: 'pezzo', id: tx.id, p: p }); },
    fine: function (esito) { var tx = DIR.tx; if (!tx) return; tx.esito = esito; clearInterval(tx.timer); DIR.c.manda({ tipo: 'fine', id: tx.id, esito: esito }); },
    // spettatore
    guarda: function () {
      var c = canale(); if (!c) return;
      var rx = DIR.rx = { id: null, coda: [], prossimo: 0, esito: null, rep: null, misure: [] };
      var prendi = function (p) {
        if (p.da < rx.prossimo) return;   // già avuto (tutto + pezzo doppio)
        if (p.da > rx.prossimo) { console.warn('[diretta] buco nei pezzi', rx.prossimo, p.da); return; }
        rx.prossimo += p.n;
        if (rx.rep) rx.rep.aggiungi(p); else rx.coda.push(p);
      };
      var parti = function (id, intest, pezzi, esito) {
        rx.id = id; var d = JSON.parse(JSON.stringify(intest)); d.inp = []; d.n = 0; d.diretta = true;
        (pezzi || []).forEach(prendi); if (esito) rx.esito = esito;
        SPETT.daRigiocare = d;
        var prova = function () { var B = window.__brawl; if (!B || !B.avvia) return setTimeout(prova, 100); B.avvia(d.modo, d.giocatori[0].eroe); };
        prova();
      };
      c.su(function (m) {
        if (!m || !m.tipo) return;
        if (!rx.id && (m.tipo === 'tutto' || m.tipo === 'via')) return parti(m.id, m.intest, m.pezzi, m.esito);
        if (m.id !== rx.id) return;
        if (m.tipo === 'pezzo') { prendi(m.p); rx.ultimo = performance.now(); }
        else if (m.tipo === 'tutto') (m.pezzi || []).forEach(prendi);
        else if (m.tipo === 'fine') { rx.esito = m.esito || { vinc: null, motivo: 'interrotta', ko: [], ordine: [] }; if (rx.rep) rx.rep.chiudi(rx.esito); }
      });
      var chiedi = setInterval(function () { if (rx.id) clearInterval(chiedi); else c.manda({ tipo: 'chiedi' }); }, 700);
      c.manda({ tipo: 'chiedi' });
    },
    aggancia: function (P) {
      var rx = DIR.rx; if (!rx) return;
      rx.rep = P.rep; P.rep.diretta = true; P.rep.riserva = 30;
      rx.coda.forEach(function (p) { P.rep.aggiungi(p); }); rx.coda = [];
      if (rx.esito) P.rep.chiudi(rx.esito);
    },
    // per le prove: quanti passi indietro rispetto all'ultimo pezzo ricevuto
    ritardo: function () { var rx = DIR.rx; return rx && rx.rep ? rx.rep.pronti() : -1; }
  };
  if (GUARDA === 'locale') DIR.guarda();

  // ---------------- ?replay= ----------------
  var RQ = Q.get('replay');
  if (RQ) {
    var parti = function (d) {
      if (!d || !d.inp) { console.warn('[replay] dati mancanti'); return; }
      SPETT.daRigiocare = d;
      var prova = function () {
        var B = window.__brawl;
        if (!B || !B.avvia || !window.REPLAY) return setTimeout(prova, 100);
        B.avvia(d.modo, d.giocatori[0].eroe);
      };
      setTimeout(prova, 300);
    };
    if (RQ === 'ultima') { var s = null; try { s = localStorage.getItem('gb_replay_ultima'); } catch (e) { } parti(s ? JSON.parse(s) : null); }
    else fetch(RQ).then(function (r) { return r.json(); }).then(parti).catch(function (e) { console.warn('[replay] non caricato', e); });
  }
})();
