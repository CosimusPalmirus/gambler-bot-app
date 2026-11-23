// GAMBLER BRAWL — flusso delle schermate, comandi, ciclo, eventi → sensazioni, interfaccia in partita.
// Il motore gira a passo fisso (30/s); il disegno interpola. Nessuna mira automatica: il colpo va
// dove punta il dito (o, col tocco breve, dove guarda l'eroe).
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  var LANG = Q.get('lang') === 'en' ? 'en' : 'it';
  var AUTO = Q.get('auto') === '1', PERF = Q.get('perf') === '1', STRESS = Q.get('stress') === '1';
  var FEEL = Q.get('feel') !== '0', FEEL_STOP = FEEL && Q.get('feelstop') !== '0';   // FEEL 21/11: ?feel=0 = tutto come prima; ?feelstop=0 = hit-stop senza tetto
  var M = window.Motore, E = window.EROI, D = window.Disegno, S = window.Suoni;
  var DT = M.DT;

  // ---------------- testi ----------------
  var TX = {
    it: {
      gioca: 'Gioca', home_sotto: 'Contro i bot · nessuna puntata', modalita: 'Modalità', bot_liv: 'Bravura dei bot', scegli: "Scegli l'eroe",
      caso: 'A caso', combatti: 'Combatti!', ancora: 'Ancora', cambia: 'Cambia eroe', home: 'Home', pausa: 'Pausa', riprendi: 'Riprendi', esci: 'Esci dalla partita',
      facile: 'Facile', medio: 'Medio', difficile: 'Difficile',
      m_gemme: 'Arraffa gemme', m_gemme_d: 'Le gemme escono dal centro. La squadra che ne tiene 10 o più per 15 secondi vince. Se vai KO le perdi tutte.',
      m_duello: 'Duello', m_duello_d: 'Uno contro uno. Chi arriva per primo a 3 KO vince. A tempo scaduto in parità: supplementari, il prossimo KO decide.',
      m_sopr: 'Sopravvivenza', m_sopr_d: 'Sei in sei, ognuno per sé, nessuna rinascita. Il gas stringe l’arena: resta in piedi per ultimo.',
      doppio: 'DOPPIO KO!', triplo: 'TRIPLO KO!', inarrestabile: 'INARRESTABILE!',
      gadget: 'Gadget', vita: 'Vita', danno: 'Danno', gittata: 'Gittata', velocita: 'Velocità', attacco: 'Attacco', super: 'Super',
      tu: 'TU', vittoria: 'Vittoria!', sconfitta: 'Sconfitta', pareggio: 'Pareggio', posto: '° posto',
      mot_gemme: 'Gemme tenute fino alla fine del conto', mot_tempo_gemme: 'Tempo scaduto: più gemme', mot_supp_ko: 'Supplementari: KO decisivo', mot_supp_vita: 'Supplementari: più vita rimasta',
      mot_ko: '3 KO', mot_tempo_ko: 'Tempo scaduto: più KO', mot_ultimo: 'Ultimo in piedi', mot_tempo_vita: 'Tempo scaduto: più vita',
      ko: 'KO', morti: 'Morti', danni: 'Danni', gemme: 'Gemme', cure: 'Cure', eroe: 'Eroe',
      sup_pronta: 'SUPER PRONTA!', sei_ko: 'SEI KO', rinasci: 'Rinasci tra', supplementari: 'SUPPLEMENTARI', supp_sub: 'Il prossimo KO vince',
      blu_vince: 'BLU VINCE TRA', rossi_vincono: 'ROSSI VINCONO TRA', conto_stop: 'CONTO FERMATO',
      tua_vince: 'LA TUA SQUADRA STA VINCENDO!', nem_vince: 'LA SQUADRA NEMICA STA VINCENDO!', tua_vince_sub: 'Tenete le gemme per 15 secondi', nem_vince_sub: 'Mettete KO chi porta le gemme!', vincete_tra: 'VINCETE TRA', perdete_tra: 'I NEMICI VINCONO TRA', conto_sotto: 'Meno di 10 gemme', conto_pari: 'Gemme pari', conto_salvi: 'Li avete fermati!', conto_perso: 'Avete perso il vantaggio', gemme_perse: 'GEMME PERSE!', bersaglio: 'BERSAGLIO', vivi: 'VIVI', gas: 'GAS!', gas_avviso: 'IL GAS ARRIVA!', gas_avviso_sub: 'Tra 5 secondi si stringe verso il centro', gas_via: 'IL GAS SI STRINGE!', gas_via_sub: 'Resta dentro la zona sicura', gas_forte: 'GAS PIÙ FORTE!', gas_forte_sub: 'Fa sempre più male: vai verso il centro', gas_finale: 'ZONA FINALE!', gas_finale_sub: 'Il gas è al massimo',
      regola_gemme: 'Prendi 10 gemme e tienile 15 secondi', regola_duello: 'Primo a 3 KO', regola_sopr: 'Ultimo in piedi vince', tocca: 'tocca per iniziare',
      ruolo: 'Ruolo', tocca_gioca: 'Tocca per giocare', eroi: 'Eroi', lobby: 'Lobby', opzioni: 'Opzioni', effetti: 'Effetti', musica: 'Musica', vibrazione: 'Vibrazione',
      lingua: 'Lingua', chiudi: 'Chiudi', scegli_btn: 'Scegli', in_arrivo: 'IN ARRIVO', kit_arrivo: 'Abilità in arrivo col modello nuovo.', scelto: 'Scelto',
      modalita_c: 'Modi', giocatore: 'GIOCATORE', f_tutti: 'Tutti', f_distanza: 'Distanza', f_mischia: 'Mischia', fiche: 'fiches', rango: 'Rango', livello: 'Livello', liv_su: 'LIVELLO SU!', ultimo_minuto: 'ULTIMO MINUTO!', dieci: 'ULTIMI 10 SECONDI', bot: 'bot', tutti: 'TUTTI CONTRO TUTTI', vs_tu: 'TU', mvp: 'MVP', brawl: 'BRAWL!', game: 'GAME!',
      comandi_nota: 'Telefono: levetta a sinistra, mira e spara a destra. PC: WASD + mouse, E super, Q gadget, Esc pausa. Gamepad: levette, RT spara, Y/LT super, LB gadget.'
    },
    en: {
      gioca: 'Play', home_sotto: 'Versus bots · no stakes', modalita: 'Game mode', bot_liv: 'Bot skill', scegli: 'Choose your champion',
      caso: 'Random', combatti: 'Fight!', ancora: 'Again', cambia: 'Change hero', home: 'Home', pausa: 'Paused', riprendi: 'Resume', esci: 'Quit match',
      facile: 'Easy', medio: 'Medium', difficile: 'Hard',
      m_gemme: 'Gem Rush', m_gemme_d: 'Gems spawn in the middle. Hold 10 or more for 15 seconds to win. Get knocked out and you drop them all.',
      m_duello: 'Duel', m_duello_d: 'One on one. First to 3 KOs wins. Tied at the buzzer: overtime, next KO decides.',
      m_sopr: 'Survival', m_sopr_d: 'Six players, every one for themselves, no respawns. The gas closes in on the arena: be the last one standing.',
      doppio: 'DOUBLE KO!', triplo: 'TRIPLE KO!', inarrestabile: 'UNSTOPPABLE!',
      gadget: 'Gadget', vita: 'Health', danno: 'Damage', gittata: 'Range', velocita: 'Speed', attacco: 'Attack', super: 'Super',
      tu: 'YOU', vittoria: 'Victory!', sconfitta: 'Defeat', pareggio: 'Draw', posto: ' place',
      mot_gemme: 'Held the gems through the countdown', mot_tempo_gemme: 'Time up: more gems', mot_supp_ko: 'Overtime: decisive KO', mot_supp_vita: 'Overtime: more health left',
      mot_ko: '3 KOs', mot_tempo_ko: 'Time up: more KOs', mot_ultimo: 'Last one standing', mot_tempo_vita: 'Time up: more health',
      ko: 'KO', morti: 'Deaths', danni: 'Damage', gemme: 'Gems', cure: 'Heals', eroe: 'Hero',
      sup_pronta: 'SUPER READY!', sei_ko: 'KNOCKED OUT', rinasci: 'Respawn in', supplementari: 'OVERTIME', supp_sub: 'Next KO wins',
      blu_vince: 'BLUE WINS IN', rossi_vincono: 'RED WINS IN', conto_stop: 'COUNTDOWN STOPPED',
      tua_vince: 'YOUR TEAM IS WINNING!', nem_vince: 'THE ENEMY TEAM IS WINNING!', tua_vince_sub: 'Hold the gems for 15 seconds', nem_vince_sub: 'Knock out the gem carrier!', vincete_tra: 'YOU WIN IN', perdete_tra: 'ENEMIES WIN IN', conto_sotto: 'Under 10 gems', conto_pari: 'Gems tied', conto_salvi: 'You stopped them!', conto_perso: 'You lost the lead', gemme_perse: 'GEMS DROPPED!', bersaglio: 'TARGET', vivi: 'ALIVE', gas: 'GAS!', gas_avviso: 'THE GAS IS COMING!', gas_avviso_sub: 'In 5 seconds it closes in on the centre', gas_via: 'THE GAS IS CLOSING IN!', gas_via_sub: 'Stay inside the safe zone', gas_forte: 'STRONGER GAS!', gas_forte_sub: 'It hurts more and more: head for the centre', gas_finale: 'FINAL ZONE!', gas_finale_sub: 'The gas is at full strength',
      regola_gemme: 'Grab 10 gems and hold them for 15 seconds', regola_duello: 'First to 3 KOs', regola_sopr: 'Last one standing wins', tocca: 'tap to start',
      ruolo: 'Role', tocca_gioca: 'Tap to play', eroi: 'Champions', lobby: 'Lobby', opzioni: 'Options', effetti: 'Sound FX', musica: 'Music', vibrazione: 'Vibration',
      lingua: 'Language', chiudi: 'Close', scegli_btn: 'Select', in_arrivo: 'COMING SOON', kit_arrivo: 'Abilities arrive with the new model.', scelto: 'Selected',
      modalita_c: 'Modes', giocatore: 'PLAYER', f_tutti: 'All', f_distanza: 'Ranged', f_mischia: 'Melee', fiche: 'chips', rango: 'Rank', livello: 'Level', liv_su: 'LEVEL UP!', ultimo_minuto: 'LAST MINUTE!', dieci: 'LAST 10 SECONDS', bot: 'bots', tutti: 'EVERY ONE FOR THEMSELVES', vs_tu: 'YOU', mvp: 'MVP', brawl: 'BRAWL!', game: 'GAME!',
      comandi_nota: 'Phone: left stick to move, aim and shoot on the right. PC: WASD + mouse, E super, Q gadget, Esc pause. Gamepad: sticks, RT shoots, Y/LT super, LB gadget.'
    }
  };
  function T(k) { return (TX[LANG] && TX[LANG][k]) || TX.it[k] || k; }
  document.documentElement.lang = LANG;
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = T(el.getAttribute('data-t')); });

  var $ = function (id) { return document.getElementById(id); };
  var GBRx = window.GBR;
  // il cast del lancio: nomi e colori dai testi di Smash (ui/cast.js), poi quello che sa il 3D, poi l'id
  var CU = window.CAST_UI || { ORDINE: [], E: {} };
  var INFO = {};
  function info(id) {
    if (INFO[id]) return INFO[id];
    var c = CU.E[id], g = (GBRx && GBRx.get && GBRx.get(id)) || null;
    INFO[id] = c ? { nome_en: c.nome_en, nome: c.nome, colore: c.col, colore2: c.col2, motto_it: c.motto_it, motto_en: c.motto_en, sopra_it: c.sopra_it, sopra_en: c.sopra_en, ruolo: c.ruolo, taglia: 1 }
      : (g ? { nome: g.nome, colore: g.colore, colore2: g.colore2, motto_it: g.motto_it, motto_en: g.motto_en, taglia: g.taglia || 1 } : { nome: id, colore: '#ffffff', colore2: '#888888', motto_it: '', motto_en: '', taglia: 1 });
    return INFO[id];
  }
  function nome(id) { var c = info(id); return (LANG === 'en' && c.nome_en) || c.nome || id; }
  function nomeCorto(id) { var n = nome(id); if (id === 'bot') return 'BOT'; if (n.length <= 10) return n; var p = n.split(' '); return p[0].length <= 3 && p[1] ? p[1] : p[0]; }
  function motto(id) { var c = info(id); return (LANG === 'en' ? c.motto_en : c.motto_it) || ''; }
  // chi si mostra (i 6 del lancio) e chi si può già giocare (quelli che il motore conosce)
  var MOSTRATI = (E.MOSTRATI && E.MOSTRATI.length ? E.MOSTRATI : CU.ORDINE).slice();
  if (!MOSTRATI.length) MOSTRATI = E.ORDINE.slice();
  var GIOCABILI = MOSTRATI.filter(function (id) { return !!E[id]; });
  var POOL = GIOCABILI.length >= 2 ? GIOCABILI : E.ORDINE;
  function giocabile(id) { return !!E[id]; }

  // immagini degli eroi FUORI PARTITA (17/11, regola del proprietario: i modelli 3D di gioco non si vedono MAI nei menu, solo in partita).
  // Niente ritratti/* (render dei modelli 3D) e niente GBR.vivo fuori partita. Al loro posto:
  //  - vetrina (home, scheda, MVP): le clip Seedance (ui/clip_alfa.js, menu_video/<id>/v2/final/) per chi le ha, se no l'arte 2D approvata;
  //  - icone/carte: ui/icone/<id>.webp se c'è, se no l'arte 2D approvata menu_video/arte2d/<id>.webp;
  //  - chi non ha ancora arte 2D approvata (pizzaiolo, dj, veggente): i segnaposto 2D di Smash (ui/segnaposto/), mai un render 3D.
  // In partita (HUD: faccine) resta il busto del modello 3D, caricato solo alla prima faccina.
  // 21/11 VETRINE: arte 2D e icone rifatte dal 1o fotogramma dell'idle delle clip approvate (v3, Pistolero v2): menu_video/vetrine_da_clip.py
  // 22/11 SERIE UNIFORME: stessa finestra per tutti (stessa scala, piedi e asse: menu_video/_comune/inquadratura_2211.json)
  var ARTE2D = { samurai: [470, 540], pistolero: [470, 540], lupo: [470, 540], croupier: [470, 540], arciere: [470, 540], agamennone: [470, 540], buttafuori: [470, 540], pizzaiolo: [470, 540], dj: [470, 540], veggente: [470, 540], bot: [470, 540], dama: [470, 540], asso: [470, 540], regina: [470, 540], fante: [470, 540] };
  var ICONE = { samurai: 1, pistolero: 1, lupo: 1, croupier: 1, arciere: 1, agamennone: 1, buttafuori: 1, pizzaiolo: 1, dj: 1, veggente: 1, bot: 1, dama: 1, asso: 1, regina: 1, fante: 1 };   // ui/icone/<id>.webp
  var VVETR = '?v=vs2211';   // cache di icone e arte 2D (22/11 serie uniforme)
  var VVETR_CARTE = { dama: '?v=vc2311d', asso: '?v=vc2311d', regina: '?v=vc2311d', fante: '?v=vc2311d' };   // 23/11: icone e arte dei 4 eroi carte rifatte dalle clip lobby (vc2311c: ♣ a 3 foglie, scontorno)
  var CA = window.ClipAlfa || { ha: function () { return false; } };
  var ASSET = {};
  function asset(id) {
    if (ASSET[id]) return ASSET[id];
    var ar = ARTE2D[id], a = ASSET[id] = { id: id, vetr: null, hud: null, pronto: null,
      arte: ar ? 'menu_video/arte2d/' + id + '.webp' + (VVETR_CARTE[id] || VVETR) : 'ui/segnaposto/' + id + '.webp', aw: ar ? ar[0] : 1, ah: ar ? ar[1] : 1 };
    a.busto = ICONE[id] ? 'ui/icone/' + id + '.webp' + (VVETR_CARTE[id] || VVETR) : a.arte;
    // senza arte 2D approvata: la striscia dei segnaposto di Smash (2D) se c'è
    a.pronto = (ar || !CU.E[id] ? Promise.resolve(null) : fetch('ui/segnaposto/' + id + '_vetrina.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { return null; }))
      .then(function (j) {
        if (j) { var f = j.f || [[0, j.w / 2, j.h]]; a.vetr = { url: 'ui/segnaposto/' + id + '_vetrina.webp', w: j.w, h: j.h, n: f.length, dur: j.durata || f.length / 10, piede: Math.max(0, (j.h - f[0][2]) / j.h), px: 0.5 - f[0][1] / j.w }; }
        return a;
      });
    return a;
  }
  // busto del modello 3D: SOLO in partita (faccine dell'HUD), si carica alla prima richiesta
  function hudImg(id) { var a = asset(id); if (!a.hud) { a.hud = new Image(); a.hud.src = 'ritratti/' + id + '.webp'; } return a.hud; }
  MOSTRATI.forEach(asset);
  // mette l'eroe nella vetrina: clip Seedance (con l'alfa) se ci sono, se no la striscia 2D, se no l'arte 2D ferma
  function vetrina(el, id, entra) {
    var a = asset(id);
    el.dataset.id = id;
    if (el._clip) { el._clip.ferma(); el._clip = null; }
    a.pronto.then(function () {
      if (el.dataset.id !== id) return;
      var v = a.vetr;
      // (con la lobby video ?lobbyv=1 la home è coperta: lì niente clip sotto, basta l'arte ferma)
      if (CA.ha(id) && !(el.id === 'h-vetrina' && Q.get('lobbyv') === '1')) {
        // 720x960 (3:4), piedi a 902/960 come la posa neutra ref/N_idle_720x960.png
        el.style.setProperty('--w', 3); el.style.setProperty('--h', 4); el.style.setProperty('--n', 1); el.style.setProperty('--piede', (58 / 960).toFixed(3)); el.style.setProperty('--px', 0);
        el.innerHTML = '';
        el._clip = CA.monta(el, id, { intro: !!entra });
      } else if (v) {
        el.style.setProperty('--w', v.w); el.style.setProperty('--h', v.h); el.style.setProperty('--n', v.n); el.style.setProperty('--dur', v.dur + 's'); el.style.setProperty('--piede', v.piede.toFixed(3)); el.style.setProperty('--px', v.px.toFixed(3));
        el.innerHTML = '<div class="striscia" style="background-image:url(\'' + v.url + '\')"></div>';
      } else {
        el.style.setProperty('--w', a.aw); el.style.setProperty('--h', a.ah); el.style.setProperty('--n', 1); el.style.setProperty('--piede', 0); el.style.setProperty('--px', 0);
        el.innerHTML = '<div class="striscia" style="background-image:url(\'' + a.arte + '\');animation:none"></div>';
      }
      if (entra) { el.classList.remove('entra'); void el.offsetWidth; el.classList.add('entra'); }
    });
  }

  // ---------------- errori visibili (per il banco) ----------------
  var B = window.__brawl = { fase: 'menu', partite: 0, errori: [], st: null, roster: GBRx && GBRx.tre ? '3d' : (GBRx && !GBRx.stub ? 'vero' : 'ripiego'), esiti: [] };
  window.addEventListener('error', function (e) { B.errori.push(String(e.message)); var el = $('errore'); el.style.display = 'block'; el.textContent = 'ERRORE: ' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno; });

  try { if (window.Telegram && Telegram.WebApp) { Telegram.WebApp.ready(); Telegram.WebApp.expand(); if (Telegram.WebApp.disableVerticalSwipes) Telegram.WebApp.disableVerticalSwipes(); } } catch (e) { }

  // ---------------- dimensioni e aree sicure ----------------
  var W = 0, H = 0, DPR = 1, SA = { t: 0, b: 0, l: 0, r: 0 };
  // risoluzione adattiva: se il telefono non tiene i 48 fps, si scende di nitidezza (2 > 1,5 > 1,25 > 1)
  var QDPR = +Q.get('dpr') || 0, RISOL = { max: Math.min(screen.width || 9999, screen.height || 9999) < 600 && Q.get('cam') !== 'vecchia' ? 1.5 : 2, somma: 0, n: 0, gradini: [2, 1.5, 1.25, 1] };
  function controllaRisoluzione(dt) {
    if (QDPR || B.fase !== 'partita') return;
    if (dt > 0.1) return;   // MOBILE 23/11: i fotogrammi lunghi della transizione (shader, texture) non decidono la risoluzione
    RISOL.somma += dt; RISOL.n++;
    if (RISOL.n < 60) return;
    var media = RISOL.somma / RISOL.n; RISOL.somma = 0; RISOL.n = 0;
    if (media > 1 / 48) {
      // molto lento: si salta subito a 1; altrimenti un gradino alla volta
      var att = Math.min(RISOL.max, window.devicePixelRatio || 1);
      var prossimo = media > 1 / 30 ? (att > 1.01 ? 1 : 0) : RISOL.gradini.filter(function (g) { return g < att - 0.01; })[0];
      if (prossimo) { RISOL.max = prossimo; B.risoluzione = prossimo; misura(); }
    }
  }
  var cv = $('cv');
  if (window.R3) R3.init($('gl'));
  D.init(cv);
  if (Q.get('salta')) { D.salta = {}; Q.get('salta').split(',').forEach(function (k) { D.salta[k] = 1; }); }
  D.suonoPasso = function () { S.passo(); };
  function misura() {
    W = window.innerWidth; H = window.innerHeight; DPR = Math.min(QDPR || 2, RISOL.max, window.devicePixelRatio || 1);
    var cs = getComputedStyle($('sa'));
    SA.t = parseFloat(cs.paddingTop) || 0; SA.b = parseFloat(cs.paddingBottom) || 0; SA.l = parseFloat(cs.paddingLeft) || 0; SA.r = parseFloat(cs.paddingRight) || 0;
    try { var tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.contentSafeAreaInset; if (tg) { SA.t += tg.top || 0; SA.b += tg.bottom || 0; } } catch (e) { }
    D.ridimensiona(W, H, DPR);
    // giro 8b: la misura CSS del canvas 3D si fissa qui in px CSS. Senza, il canvas WebGL (setSize(..., false) non tocca lo stile)
    // prende come misura il suo buffer (W×dpr) quando il foglio di stile non lo vincola: con dpr 2 si vedeva solo un quarto della scena.
    var gl = $('gl'); if (gl) { gl.style.width = W + 'px'; gl.style.height = H + 'px'; }
    layout();
  }
  window.addEventListener('resize', misura);

  // posizioni dei comandi (px CSS)
  var UI = { pausa: { x: 0, y: 0, r: 22 }, sup: { x: 0, y: 0, r: 36 }, gad: { x: 0, y: 0, r: 25 }, att: { x: 0, y: 0 }, mov: { x: 0, y: 0 }, R: 56 };
  function layout() {
    var land = W > H;
    UI.R = land ? 58 : 54;
    UI.pausa.x = SA.l + 30; UI.pausa.y = SA.t + 30;
    UI.att.x = W - SA.r - (land ? 100 : 82); UI.att.y = H - SA.b - (land ? 105 : 150);
    UI.sup.x = W - SA.r - (land ? 150 : 182); UI.sup.y = H - SA.b - (land ? 218 : 70);
    UI.gad.x = W - SA.r - (land ? 56 : 168); UI.gad.y = H - SA.b - (land ? 222 : 160);
    UI.mov.x = SA.l + (land ? 110 : 90); UI.mov.y = H - SA.b - (land ? 105 : 150);
  }

  // ---------------- stato dell'applicazione ----------------
  var APP = { modo: Q.get('modo') || 'gemme', liv: +(Q.get('liv') || 1), eroe: Q.get('eroe') || GIOCABILI[0] || 'bot', schermo: '', st: null, pausa: false, vista: '' };
  try {
    var salvato = localStorage.getItem('gb_eroe'); if (salvato && GIOCABILI.indexOf(salvato) >= 0 && !Q.get('eroe')) APP.eroe = salvato;
    var sm = localStorage.getItem('gb_modo'); if (sm && !Q.get('modo')) APP.modo = sm;
    var sl = +localStorage.getItem('gb_liv'); if (sl >= 1 && sl <= 3 && !Q.get('liv')) APP.liv = sl;
  } catch (e) { }
  if (!E[APP.eroe]) APP.eroe = POOL[0];
  if (['gemme', 'duello', 'sopravvivenza'].indexOf(APP.modo) < 0 && APP.modo !== 'tutti') APP.modo = 'gemme';
  if (APP.modo === 'tutti') APP.modo = 'gemme';
  function salva(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  // ---------------- trofei e livello (giro 6): come in Brawl Stars, salvati sul telefono ----------------
  // Trofei per eroe: vittoria +8, pareggio 0, sconfitta -4 (sopravvivenza per posto); mai sotto 0. Rango = 1 + trofei/20 (max 30).
  // Livello del giocatore: punti esperienza a ogni partita (20 + 10 se vinci + 2 a KO + 1 a gemma), servono 100 + 25×(livello-1).
  var PROG = { xp: 0, liv: 1, trofei: {} };
  try { var pj = JSON.parse(localStorage.getItem('gb_prog') || 'null'); if (pj && pj.trofei) PROG = pj; } catch (e) { }
  function salvaProg() { if (!AUTO) salva('gb_prog', JSON.stringify(PROG)); }
  function xpServe(l) { return 100 + 25 * (l - 1); }
  function trofeiDi(id) { return PROG.trofei[id] || 0; }
  function trofeiTot() { var s = 0; for (var k in PROG.trofei) s += PROG.trofei[k]; return s; }
  function rango(t) { return Math.min(30, 1 + Math.floor(t / 20)); }
  function aggiornaProfilo() {
    $('h-liv').textContent = PROG.liv; $('h-trofei').textContent = trofeiTot();
    $('h-xp').style.width = Math.min(100, PROG.xp / xpServe(PROG.liv) * 100) + '%';
    $('h-xp-t').textContent = PROG.xp + '/' + xpServe(PROG.liv);
    $('h-trofei-eroe').textContent = trofeiDi(APP.eroe);
  }
  var RIDOTTO = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // logo: C (esplosione POW), scelto dal proprietario il 30/10; A e B restano provabili con ?logo=A / ?logo=B
  var LOGO = /^[ABC]$/.test(Q.get('logo') || '') ? Q.get('logo') : 'C';
  Array.prototype.forEach.call(document.querySelectorAll('.logo-img'), function (im) { im.src = 'ui/logo_' + LOGO + '.webp?v=gem2211b'; });

  // ---------------- schermate e sipario ----------------
  function mostra(id, dir) {
    APP.schermo = id;
    // clip Seedance delle vetrine: si fermano (video e WebGL liberati) appena si lascia la loro schermata
    [['h-vetrina', 's-home'], ['e-vetrina', 's-scheda'], ['f-vetrina', 's-fine']].forEach(function (p) { var el = $(p[0]); if (p[1] !== id && el && el._clip) { el._clip.ferma(); el._clip = null; el.dataset.id = ''; } });
    document.body.classList.toggle('da-sx', dir < 0);
    Array.prototype.forEach.call(document.querySelectorAll('.schermo'), function (s) { s.classList.toggle('on', s.id === id); });
    var sc = id && $(id);
    if (id === 's-home') aggiornaLobby();
    if (id === 's-eroi') costruisciGriglia();
    if (id === 's-scheda') aggiornaScheda(APP.vista || APP.eroe, true);
    if (id === 's-modi') costruisciModi();
    if (sc && sc.dataset.musica) S.musicaFile(sc.dataset.musica);
    if (S.schermo) S.schermo(id);   /* audio 22/11: benvenuto dell'annunciatore */
    NAV.reset();
  }
  var SIP = { el: $('sip'), n: 0, occupato: false };
  // copre lo schermo con le tre bande, cambia sotto, poi scopre (avanti da sinistra, indietro da destra)
  function sipario(fn, dir) {
    var d = SIP.el, n = ++SIP.n;
    d.className = 'su ' + (RIDOTTO ? 'piano' : dir < 0 ? 'sx' : 'dx');
    void d.offsetWidth; d.classList.add('copre');
    S.sipario(dir);
    setTimeout(function () {
      if (n !== SIP.n) return;
      fn();
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        if (n !== SIP.n) return;
        d.classList.remove('copre'); d.classList.add('scopre');
        setTimeout(function () { if (n === SIP.n) d.className = ''; }, 520);
      }); });
    }, 330);
  }
  function vai(id, dir) { sipario(function () { mostra(id, dir); }, dir || 1); }
  // tocco soddisfacente: il tasto si schiaccia e lampeggia dal punto toccato, poi l'azione
  function premi(el, e, fn, ritardo) {
    if (SIP.occupato) return; SIP.occupato = true;
    S.sblocca(); S.conferma();
    el.classList.remove('premuto'); void el.offsetWidth; el.classList.add('premuto');
    var r = el.getBoundingClientRect(), px = e && e.clientX ? e.clientX : r.left + r.width / 2, py = e && e.clientY ? e.clientY : r.top + r.height / 2;
    el.style.setProperty('--lx', ((px - r.left) / r.width * 100).toFixed(0) + '%'); el.style.setProperty('--ly', ((py - r.top) / r.height * 100).toFixed(0) + '%');
    setTimeout(function () { el.classList.remove('premuto'); }, 300);
    setTimeout(function () { SIP.occupato = false; fn(); }, ritardo === undefined ? 90 : ritardo);
  }
  function tasto(id, fn, ritardo) { var el = $(id); el.onclick = function (e) { premi(el, e, fn, ritardo); }; }
  Array.prototype.forEach.call(document.querySelectorAll('[data-va]'), function (b) { b.onclick = function () { S.sblocca(); S.indietro(); vai(b.getAttribute('data-va'), -1); }; });

  // ---------------- titolo ----------------
  $('s-titolo').onclick = function () {
    if (APP.schermo !== 's-titolo' || SIP.occupato) return;
    S.sblocca(); S.avvio();
    var b = $('t-tocca'); b.classList.add('premuto');
    vai('s-home', 1);
  };

  // ---------------- lobby ----------------
  var COLRUOLO = { tank: '#ff9f1c', tiratore: '#1ad7ff', lanciatore: '#b44dff', assassino: '#ff2bd6', supporto: '#3bff8b', controllo: '#ffd23b' };
  var ROLE_TX = { tank: { it: 'Tank', en: 'Tank' }, tiratore: { it: 'Tiratore', en: 'Sharpshooter' }, lanciatore: { it: 'Lanciatore', en: 'Thrower' }, assassino: { it: 'Assassino', en: 'Assassin' }, supporto: { it: 'Supporto', en: 'Support' }, controllo: { it: 'Controllo', en: 'Controller' } };
  function ruoloDi(id) { return (E[id] && E[id].ruolo) || info(id).ruolo || 'tiratore'; }
  function ruoloTx(r) { return ((E.RUOLI && E.RUOLI[r]) || ROLE_TX[r] || { it: r, en: r })[LANG]; }
  function badgeRuolo(el, id) { var r = ruoloDi(id); el.textContent = ruoloTx(r); el.style.setProperty('--kr', COLRUOLO[r] || '#888'); }
  var MODI = [
    { id: 'gemme', tag: '3v3', n: 'm_gemme', d: 'm_gemme_d', arte: 'ui/modo_gemme.webp?v=c2211', k: '#b44dff',
      ico: '<svg class="m-ico" viewBox="0 0 24 24"><path d="M7 3h10l4 6-9 12L3 9l4-6Zm-1.2 6h12.4M9 3l3 6 3-6M12 9v12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' },
    { id: 'duello', tag: '1v1', n: 'm_duello', d: 'm_duello_d', arte: 'ui/modo_duello.webp?v=c2211', k: '#ff6a12',
      ico: '<svg class="m-ico" viewBox="0 0 24 24"><path d="M4 20 14 10m-2-6 8 8-3 1-6-6 1-3ZM20 20 10 10m2-6-8 8 3 1 6-6-1-3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' },
    { id: 'sopravvivenza', tag: '×6', n: 'm_sopr', d: 'm_sopr_d', arte: 'ui/modo_sopr.webp?v=c2211', k: '#3bff8b',
      ico: '<svg class="m-ico" viewBox="0 0 24 24"><path d="M12 3c-4.4 0-8 3.2-8 7.4 0 2.4 1.2 4.2 3 5.4V19h2.5v2h5v-2H17v-3.2c1.8-1.2 3-3 3-5.4C20 6.2 16.4 3 12 3Zm-3 10.5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Zm6 0a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z" fill="currentColor"/></svg>' }
  ];
  function modoDi(id) { return MODI.filter(function (m) { return m.id === id; })[0] || MODI[0]; }
  var LIV = [['facile', '#3bff8b'], ['medio', '#ffd23b'], ['difficile', '#ff4d5e']];
  // classi (giro 8): colore della cornice e icona; distanza = tiratori e lanciatori, mischia = gli altri
  var CLASSE = {
    tiratore: { col: '#3fa8ff', dist: 1, ico: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" stroke="currentColor" stroke-width="2.6"/></svg>' },
    lanciatore: { col: '#b44dff', dist: 1, ico: '<svg viewBox="0 0 24 24"><path d="M3 19C6 8 14 4 21 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-dasharray="3 3"/><circle cx="19" cy="7" r="3.6" fill="currentColor"/></svg>' },
    assassino: { col: '#ff4d6a', dist: 0, ico: '<svg viewBox="0 0 24 24"><path d="M4 20 15 9l2-6 4 4-6 2L4 20Z" fill="currentColor"/><path d="M3 21l3-3" stroke="currentColor" stroke-width="2.6"/></svg>' },
    tank: { col: '#ff9f1c', dist: 0, ico: '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" fill="currentColor"/></svg>' },
    controllo: { col: '#2fd46a', dist: 0, ico: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 3v9l6 4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>' },
    supporto: { col: '#3bff8b', dist: 0, ico: '<svg viewBox="0 0 24 24"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" fill="currentColor"/></svg>' }
  };
  var NOME_GIOC = T('giocatore');
  // 23/11: nome del giocatore da Telegram: dalla pagina stessa, dalla mini app che la contiene (iframe, stessa origine), dai dati nell'indirizzo, o da ?nome=
  (function () {
    function daTg(w) { try { var u = w && w.Telegram && w.Telegram.WebApp && w.Telegram.WebApp.initDataUnsafe && w.Telegram.WebApp.initDataUnsafe.user; return u && u.first_name; } catch (e) { return null; } }
    function daHash(h) { try { var m = /tgWebAppData=([^&]+)/.exec(h || ''); if (!m) return null; var d = new URLSearchParams(decodeURIComponent(m[1])); var u = JSON.parse(d.get('user') || 'null'); return u && u.first_name; } catch (e) { return null; } }
    var n = Q.get('nome') || daTg(window) || daHash(location.hash);
    if (!n) { try { if (window.parent && window.parent !== window) n = daTg(window.parent) || daHash(window.parent.location.hash); } catch (e) { } }
    if (n) NOME_GIOC = String(n).toUpperCase().slice(0, 14);
  })();
  // polvere d'oro e scintille che salgono nella lobby (solo CSS, 18 puntini)
  function polvere() {
    var b = $('h-polvere'); if (b.childNodes.length) return;
    var col = ['#ffe27a', '#ff7ef0', '#7ee8ff', '#ffffff'];
    for (var i = 0; i < 18; i++) { var e = document.createElement('i'); e.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;--s:' + (2 + Math.random() * 4).toFixed(1) + 'px;--d:' + (6 + Math.random() * 7).toFixed(1) + 's;--r:-' + (Math.random() * 12).toFixed(1) + 's;--x:' + ((Math.random() - 0.5) * 80).toFixed(0) + 'px;--c:' + col[i % 4]; b.appendChild(e); }
  }
  function aggiornaLobby() {
    aggiornaProfilo();
    var id = APP.eroe, c = info(id), m = modoDi(APP.modo);
    $('h-nome').textContent = nome(id);
    badgeRuolo($('h-ruolo'), id);
    $('s-home').style.setProperty('--kh', c.colore);
    vetrina($('h-vetrina'), id, true);
    asset(id).pronto.then(function (a) { $('h-eroi-img').src = a.busto; });
    var kc = CLASSE[ruoloDi(id)] || CLASSE.tiratore; $('h-cl').innerHTML = kc.ico; $('h-cl').style.setProperty('--kc', kc.col);
    $('h-fiche').textContent = PROG.fiche || 0;
    $('h-nome-gioc').textContent = NOME_GIOC;
    polvere();
    $('h-modo-img').src = m.arte; $('h-modo-nome').textContent = T(m.n); $('h-modo-tag').textContent = m.tag;
    $('h-modi').style.setProperty('--k', m.k);
    $('h-gioca-sub').textContent = T(m.n) + ' · ' + T('bot') + ' ' + T(LIV[APP.liv - 1][0]).toLowerCase();
    palco();
  }
  // l'eroe sta sulla pedana dipinta nello sfondo: si calcola dove cade la pedana con lo sfondo «a tutta pagina»
  var PEDANA = { v: { iw: 1080, ih: 1935, fx: 0.5, fy: 0.755, hw: 0.375 }, o: { iw: 1920, ih: 1072, fx: 0.683, fy: 0.684, hw: 0.227 } };
  function palco() {
    if (APP.schermo !== 's-home') return;
    var land = W > H, p = land ? PEDANA.o : PEDANA.v, sf = document.querySelector('.lob-sfondo');
    var s = Math.max(W / p.iw, H / p.ih), dw, dh, ox, oy;
    if (!land) {
      // in verticale la pedana deve stare sopra ai tasti: se serve lo sfondo si ingrandisce (e si taglia ai lati)
      var tasti = $('h-gioca').getBoundingClientRect().top || (H - 130);
      var voluto = tasti - 18;
      dh = Math.max(p.ih * s, (H - voluto) / (1 - p.fy)); dw = dh * p.iw / p.ih;
      ox = (W - dw) / 2; oy = H - dh;
    } else { dw = p.iw * s; dh = p.ih * s; ox = (W - dw) / 2; oy = (H - dh) / 2; }
    sf.style.backgroundImage = 'url(ui/lobby_' + (land ? 'o' : 'v') + '.webp)';
    sf.style.backgroundSize = dw.toFixed(1) + 'px ' + dh.toFixed(1) + 'px';
    sf.style.backgroundPosition = ox.toFixed(1) + 'px ' + oy.toFixed(1) + 'px';
    var fx = ox + p.fx * dw, fy = oy + p.fy * dh, ph = p.hw * dw;
    var logo = document.querySelector('.lob-logo').getBoundingClientRect();
    var cima = land ? SA.t + 54 : Math.max(logo.bottom, SA.t + 60) + 34;
    var hh = Math.max(120, Math.min(ph * 2.6, fy - cima));   // la cornice la decide GBR.vivo (EROI, 31/10)
    var el = $('h-eroe');
    el.style.left = (fx - hh * 0.62) + 'px'; el.style.width = (hh * 1.24) + 'px'; el.style.height = hh + 'px';
    el.style.top = (fy - hh) + 'px';   // 17/11: niente 3D in diretta nei menu (regola del proprietario), la vetrina poggia i piedi sulla pedana
    var sh = $('s-home'); sh.style.setProperty('--px', fx + 'px'); sh.style.setProperty('--py', fy + 'px'); sh.style.setProperty('--pw', (ph * 2.1) + 'px');
    var tg = $('h-targa'); tg.style.left = fx + 'px'; tg.style.top = Math.max(cima - 18, fy - hh * 0.86 - 22) + 'px';
  }
  tasto('h-gioca', function () { preparaPartita(); }, 60);
  tasto('h-eroi', function () { vai('s-eroi', 1); });
  // toccare l'eroe in lobby: esulta (clip «vittoria» del modello 3D), come in Brawl Stars; poi torna a respirare
  var ESULTA = { t: 0 };
  function esulta(el, id, poi) {
    // 17/11: niente più clip «vittoria» del modello 3D: chi ha le clip Seedance fa un'azione (dopo quella in corso)
    if (el._clip) { el._clip.azione(); if (poi) poi(); return; }
    if (poi) poi();   // senza clip: niente esultanza (la vecchia striscia «vittoria» era un render del modello 3D)
  }
  // col 3D in diretta l'eroe si gira col dito
  (function () {
    var el = $('h-eroe'), x0 = 0, g0 = 0;
    el.addEventListener('pointerdown', function (e) { x0 = e.clientX; g0 = ESULTA.giro || 0; ESULTA.trascina = true; ESULTA.mosso = false; });
    window.addEventListener('pointermove', function (e) { if (!ESULTA.trascina) return; var d = e.clientX - x0; if (Math.abs(d) > 8) ESULTA.mosso = true; ESULTA.giro = g0 + d * 0.012; });
    window.addEventListener('pointerup', function () { ESULTA.trascina = false; });
  })();
  $('h-eroe').onclick = function () { if (ESULTA.mosso) { ESULTA.mosso = false; return; } S.sblocca(); S.carta(); ESULTA.vivoT = performance.now() + 2400; var el = $('h-vetrina'); el.classList.remove('salta'); void el.offsetWidth; el.classList.add('salta'); esulta(el, APP.eroe); };
  tasto('h-modi', function () { vai('s-modi', 1); });
  tasto('h-modi2', function () { vai('s-modi', 1); });
  tasto('h-profilo', function () { vai('s-eroi', 1); });
  tasto('h-opz', function () { foglio('opzioni', true); }, 40);

  // ---------------- modalità ----------------
  function costruisciModi() {
    var l = $('m-lista'); l.innerHTML = '';
    MODI.forEach(function (m, i) {
      var d = document.createElement('button');
      d.className = 'modo' + (APP.modo === m.id ? ' sel' : ''); d.setAttribute('data-nav', ''); d.style.setProperty('--k', m.k);
      d.style.animationDelay = (i * 0.06) + 's';
      d.innerHTML = '<span class="m-arte" style="background-image:url(\'' + m.arte + '\')"></span><span class="m-velo"></span><span class="m-tag">' + m.tag + '</span>' +
        '<span class="m-testo"><h3>' + m.ico + T(m.n) + '</h3><p>' + T(m.d) + '</p></span>';
      d.onclick = function (e) { premi(d, e, function () { APP.modo = m.id; salva('gb_modo', m.id); costruisciModi(); vai('s-home', -1); }); };
      l.appendChild(d);
    });
    var lv = $('m-liv'); lv.innerHTML = '';
    LIV.forEach(function (k, i) {
      var b = document.createElement('button');
      b.className = 't3 corto' + (APP.liv === i + 1 ? ' sel' : ''); b.setAttribute('data-nav', ''); b.style.setProperty('--k', k[1]);
      b.innerHTML = '<span class="luce"></span><span>' + T(k[0]) + '</span>';
      b.onclick = function () { S.sblocca(); S.passa(); APP.liv = i + 1; salva('gb_liv', String(i + 1)); Array.prototype.forEach.call(lv.children, function (c, j) { c.classList.toggle('sel', j === i); }); };
      lv.appendChild(b);
    });
    NAV.reset();
  }

  // ---------------- eroi e scheda ----------------
  function statEroe(id) {
    var d = E[id], k = d.k || 1;
    return { vita: Math.round(d.vita * k * M.VITA_G), danno: Math.round((d.pieno || d.att.pieno || 0) * k), gitt: d.gitt || d.att.gitt || 0, vel: d.vel };
  }
  // galleria (giro 8): cornice del colore della classe, icona della classe, trofei, «scelto» col riflesso; tocco = apre la scheda
  var FILTRO = 'tutti';
  function costruisciGriglia() {
    var g = $('griglia'); g.innerHTML = '';
    $('e-conta').textContent = GIOCABILI.length + '/' + MOSTRATI.length;
    var fb = $('e-filtri'); fb.innerHTML = '';
    [['tutti', '#b44dff'], ['distanza', '#3fa8ff'], ['mischia', '#ff4d6a']].forEach(function (f) {
      var b = document.createElement('button'); b.className = FILTRO === f[0] ? 'sel' : ''; b.setAttribute('data-nav', ''); b.style.setProperty('--k', f[1]); b.textContent = T('f_' + f[0]);
      b.onclick = function () { S.passa(); FILTRO = f[0]; costruisciGriglia(); };
      fb.appendChild(b);
    });
    MOSTRATI.forEach(function (id, i) {
      var kc = CLASSE[ruoloDi(id)] || CLASSE.tiratore;
      if (FILTRO === 'distanza' && !kc.dist || FILTRO === 'mischia' && kc.dist) return;
      var c = document.createElement('button'), ok = giocabile(id);
      c.className = 'carta' + (id === APP.eroe ? ' sel' : '') + (ok ? '' : ' chiusa'); c.dataset.id = id; c.setAttribute('data-nav', '');
      c.dataset.arrivo = T('in_arrivo');
      c.style.setProperty('--kh', info(id).colore); c.style.setProperty('--kc', kc.col);
      c.style.animationDelay = (i * 0.035) + 's';
      var img = document.createElement('img'); img.alt = nome(id); img.draggable = false;
      asset(id).pronto.then(function (a) { img.src = a.busto; });
      c.innerHTML = '<span class="c-classe">' + kc.ico + '</span><span class="c-trofei"><img src="ui/ico_trofeo.webp" alt=""><b>' + trofeiDi(id) + '</b></span>';
      c.insertBefore(img, c.firstChild);
      var nm = document.createElement('span'); nm.className = 'c-nome'; nm.textContent = nomeCorto(id); c.appendChild(nm);
      if (id === APP.eroe) { var sc = document.createElement('span'); sc.className = 'c-scelto'; sc.textContent = T('scelto').toUpperCase(); c.appendChild(sc); }
      c.onclick = function (e) { S.sblocca(); S.carta(); APP.vista = id; vai('s-scheda', 1); };
      g.appendChild(c);
    });
    NAV.reset();
  }
  var ICO = {
    att: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="currentColor" stroke-width="2.4"/></svg>',
    sup: '<svg viewBox="0 0 24 24"><path d="M14 1 4 14h7l-2 9 10-13h-7l2-9Z" fill="currentColor"/></svg>',
    gad: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };
  function aggiornaScheda(id, entra) {
    APP.vista = id;
    var d = E[id], c = info(id), ok = !!d;
    if (ok && window.R3 && R3.carica) R3.carica(id);   // il modello vero si scarica mentre si guarda la scheda
    $('scheda').style.setProperty('--kh', c.colore);
    $('s-scheda').classList.remove('vivo');   // 17/11: il modello 3D in diretta non si vede piu' nella scheda (solo in partita)
    vetrina($('e-vetrina'), id, entra);
    $('d-nome').textContent = nome(id);
    badgeRuolo($('d-ruolo'), id);
    $('d-sopra').textContent = (LANG === 'en' ? c.sopra_en : c.sopra_it) || '';
    $('d-motto').textContent = motto(id) ? '«' + motto(id) + '»' : '';
    var tr0 = trofeiDi(id);
    $('d-rango').innerHTML = '<img src="ui/ico_trofeo.webp" alt="" style="width:22px;height:22px"><span>' + tr0 + '</span><span>· ' + T('rango') + ' ' + rango(tr0) + '</span><span class="r-barra"><i style="width:' + (rango(tr0) >= 30 ? 100 : (tr0 % 20) * 5) + '%"></i></span>';
    if (ok) {
      var s = statEroe(id);
      var riga = function (lab, v, max, txt, col) { return '<div class="stat">' + lab + '<i><b style="width:' + Math.max(4, Math.min(100, Math.round(v / max * 100))) + '%;--kb:' + col + '"></b></i><span>' + txt + '</span></div>'; };
      $('d-stat').innerHTML = riga(T('vita'), s.vita, 10000, s.vita, '#3bff8b') + riga(T('danno'), s.danno, 2400, s.danno, '#ff6a12') + riga(T('gittata'), s.gitt, 10.5, s.gitt.toFixed(1), '#1ad7ff') + riga(T('velocita'), s.vel - 1.9, 1.1, s.vel.toFixed(2), '#ffd23b');
      var ab = function (k, col, tit, o, extra) { return '<div class="abil" style="--ka:' + col + '"><span class="a-ico">' + ICO[k] + '</span><div><b><small>' + tit.toUpperCase() + (extra || '') + '</small>' + (LANG === 'en' ? o.nome_en : o.nome_it) + '</b><p>' + (LANG === 'en' ? o.desc_en : o.desc_it) + '</p></div></div>'; };
      $('d-kit').innerHTML = ab('att', '#ff9f1c', T('attacco'), d.att) + ab('sup', '#ffd23b', T('super'), d.sup) + ab('gad', '#3bff8b', T('gadget'), d.gad, ' ×' + (d.gad.usi || 3));
      if (window.ABILITA) ABILITA.mostra($('d-kit'), id, LANG);   // 21/11: sezione ABILITÀ con i mini video (ui/abilita.js)
    } else {
      $('d-stat').innerHTML = '';
      $('d-kit').innerHTML = '<div class="sc-arrivo">' + T('in_arrivo') + '</div><div class="sc-sopra">' + T('kit_arrivo') + '</div>';
    }
    var b = $('e-gioca');
    b.classList.toggle('spento', !ok);
    b.querySelector('.g-l').textContent = ok && id === APP.eroe ? T('scegli_btn') : (ok ? T('scegli_btn') : T('in_arrivo'));
  }
  // frecce della scheda: eroe precedente / successivo
  function scorriScheda(d) { var i = MOSTRATI.indexOf(APP.vista); APP.vista = MOSTRATI[(i + d + MOSTRATI.length) % MOSTRATI.length]; S.passa(); aggiornaScheda(APP.vista, true); }
  $('d-prec').onclick = function () { scorriScheda(-1); };
  $('d-succ').onclick = function () { scorriScheda(1); };
  $('e-gioca').onclick = function (e) {
    var id = APP.vista;
    if (!giocabile(id)) { S.vuoto(); return; }
    premi($('e-gioca'), e, function () { APP.eroe = id; salva('gb_eroe', id); if (S.sceltaEroe) S.sceltaEroe(id); vai('s-home', -1); });
  };
  // i modelli 3D veri arrivano dopo: si rifanno i ritratti quando ci sono
  B.modelliPronti = true;

  // ---------------- opzioni e fogli ----------------
  var VIB = true; try { VIB = localStorage.getItem('gb_vib') !== '0'; } catch (e) { }
  function vibra(ms) { if (VIB && !AUTO && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } }
  var FOGLIO = '';
  function foglio(id, on) {
    if (on) { FOGLIO = id; interruttori(); $(id).classList.add('on'); }
    else { $(id).classList.remove('on'); if (FOGLIO === id) FOGLIO = ''; }
    NAV.reset();
  }
  function interruttori() {
    ['o-sfx', 'p-sfx'].forEach(function (i) { $(i).classList.toggle('on', !!S.on); });
    ['o-mus', 'p-mus'].forEach(function (i) { $(i).classList.toggle('on', !!S.musica); });
    ['o-vib', 'p-vib'].forEach(function (i) { $(i).classList.toggle('on', VIB !== false); });
    $('o-lang-v').textContent = LANG === 'en' ? 'ENGLISH' : 'ITALIANO';
  }
  ['o-sfx', 'p-sfx'].forEach(function (i) { $(i).onclick = function () { S.sblocca(); S.imposta(!S.on, S.musica); interruttori(); S.passa(); }; });
  ['o-mus', 'p-mus'].forEach(function (i) { $(i).onclick = function () { S.sblocca(); S.imposta(S.on, !S.musica); interruttori(); S.passa(); }; });
  ['o-vib', 'p-vib'].forEach(function (i) { $(i).onclick = function () { VIB = !VIB; salva('gb_vib', VIB ? '1' : '0'); interruttori(); S.passa(); if (VIB) vibra(30); }; });
  $('o-lang').onclick = function () { Q.set('lang', LANG === 'en' ? 'it' : 'en'); Q.set('notit', '1'); location.search = Q.toString(); };
  $('o-chiudi').onclick = function () { S.indietro(); foglio('opzioni', false); };
  $('opzioni').onclick = function (e) { if (e.target === $('opzioni')) { S.indietro(); foglio('opzioni', false); } };
  interruttori();

  // ---------------- partita: preparazione e versus ----------------
  var P = null; // partita corrente
  // ?seme=N rende ripetibile la partita (squadre, mappa e motore): serve alle misure
  var QSEME = +Q.get('seme') || 0, rsq = QSEME;
  function caso() { if (!QSEME) return Math.random(); rsq = (rsq * 1103515245 + 12345) & 0x7fffffff; return rsq / 0x80000000; }
  // pesca n eroi diversi da `escludi`; se il cast giocabile è corto si ricomincia (come in Brawl Stars, lo stesso eroe può stare nelle due squadre)
  function pesca(lista, escludi, n) {
    var a = lista.filter(function (x) { return escludi.indexOf(x) < 0; }), o = [];
    if (!a.length) a = lista.slice();
    var mazzo = a.slice();
    for (var i = 0; i < n; i++) { if (!mazzo.length) mazzo = lista.slice(); o.push(mazzo.splice(Math.floor(caso() * mazzo.length), 1)[0]); }
    return o;
  }
  // il lavoro pesante (motore, mappa, cotture, modelli) si fa sotto il sipario chiuso: niente scatti nelle animazioni
  // aggancio per la lobby video (?lobbyv=1, lobby_video.js): eroe + 2 alleati + 3 nemici -> stessa partita 3D di sempre
  window.__brawlLobby = {
    giocabili: function () { return POOL.slice(); },
    eroe: function () { return APP.eroe; },
    // modo: 'gemme' (3v3: 2 alleati + 3 nemici), 'duello' (1 nemico), 'sopravvivenza' (5 avversari, ognuno per sé)
    avvia: function (eroe, alleati, nemici, modo) {
      if (!E[eroe]) return false;
      modo = ['gemme', 'duello', 'sopravvivenza'].indexOf(modo) >= 0 ? modo : 'gemme';
      APP.eroe = eroe; salva('gb_eroe', eroe); APP.modo = modo;
      var na = modo === 'gemme' ? 2 : 0, nn = modo === 'gemme' ? 3 : modo === 'duello' ? 1 : 5;
      APP.preset = { alleati: alleati.filter(function (id) { return !!E[id]; }).slice(0, na), nemici: nemici.filter(function (id) { return !!E[id]; }).slice(0, nn) };
      if (APP.preset.alleati.length !== na || APP.preset.nemici.length !== nn) APP.preset = null;
      S.sblocca(); preparaPartita(); return true;
    }
  };
  function preparaPartita() {
    if (B.fase === 'carica') return;
    B.fase = 'carica';
    if (AUTO || APP.schermo === '') costruisciPartita(); else sipario(costruisciPartita, 1);
  }
  function costruisciPartita() {
    var modo = APP.modo, mappe = MAPPE.perModo(modo), mappa = mappe[Math.floor(caso() * mappe.length)];
    var me = APP.eroe, giocatori = [{ eroe: me, squadra: 0, bot: AUTO ? 3 : 0 }], altri;
    var pre = APP.preset; APP.preset = null;   // lobby video (lobby_video.js): squadre già scelte nel matchmaking
    if (pre && modo !== 'sopravvivenza') {
      pre.alleati.forEach(function (id) { giocatori.push({ eroe: id, squadra: 0, bot: APP.liv }); });
      pre.nemici.forEach(function (id) { giocatori.push({ eroe: id, squadra: 1, bot: APP.liv }); });
    } else if (pre) {
      pre.nemici.forEach(function (id, j) { giocatori.push({ eroe: id, squadra: j + 1, bot: APP.liv }); });
    } else if (modo === 'gemme') {
      altri = pesca(POOL, [me], 5);
      giocatori.push({ eroe: altri[0], squadra: 0, bot: APP.liv }, { eroe: altri[1], squadra: 0, bot: APP.liv });
      for (var i = 2; i < 5; i++) giocatori.push({ eroe: altri[i], squadra: 1, bot: APP.liv });
    } else if (modo === 'duello') {
      giocatori.push({ eroe: pesca(POOL, [me], 1)[0], squadra: 1, bot: APP.liv });
    } else {
      altri = pesca(POOL, [me], 5);
      for (var j = 0; j < 5; j++) giocatori.push({ eroe: altri[j], squadra: j + 1, bot: APP.liv });
    }
    // SPETTATORE 23/11: ?replay= rigioca una partita registrata (stessa mappa, stessi eroi, stesso seme: replay.js)
    var RPd = window.SPETT && SPETT.prendiReplay ? SPETT.prendiReplay() : null, RPc = null;
    if (RPd) { RPc = REPLAY.configura(RPd, MAPPE); modo = APP.modo = RPc.modo; mappa = RPc.mappa; giocatori = RPc.giocatori; sopr = modo === 'sopravvivenza'; }
    var seme = RPc ? RPc.seme : QSEME ? QSEME + B.partite : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    var st = M.crea({ mappa: mappa, modo: modo, giocatori: giocatori, seme: seme });
    // i modelli si scaricano durante il versus, ma si montano sotto il sipario dell'avvio (niente scatto sul VS)
    var modelli = window.R3 ? R3.precarica(st.eroi.map(function (h) { return h.id; })) : null;
    IA.prepara(st, seme);
    P = { modelli: modelli, st: st, seme: seme, acc: 0, freeze: 0, finito: 0, lento: 0, banner: [], feed: [], vignetta: 0, passoT: 0, ultimoConto: -1, superBtnPulse: 0, superVuoto: 0, tFine: 0, conto: 0, contoN: 0 };
    // SPETTATORE 23/11: ogni partita si registra (seme + input del giocatore: base dei replay e degli spettatori esterni)
    if (window.REPLAY) { if (RPd) P.rep = REPLAY.lettore(RPd); else P.rec = REPLAY.registratore({ mappa: mappa, modo: modo, giocatori: giocatori, seme: seme, auto: AUTO, quando: Date.now() }); }
    APP.st = B.st = st;
    D.prepara(st, 0);
    st.eroi.forEach(function (h) { asset(h.id); });
    // versus: le due squadre a confronto
    var blu = $('c-blu'), ros = $('c-rossi'), sopr = modo === 'sopravvivenza';
    blu.innerHTML = ''; ros.innerHTML = '';
    $('s-carica').classList.toggle('vs-sopr', sopr);
    st.eroi.forEach(function (h, k) {
      var f = document.createElement('div'); f.className = 'vs-carta' + (k === 0 ? ' io' : '');
      f.dataset.tu = T('vs_tu');
      f.style.setProperty('--kh', info(h.id).colore);
      var dentro = (sopr ? k === 0 : h.sq === st.eroi[0].sq);
      f.style.animationDelay = (0.18 + (dentro ? k : k - (sopr ? 1 : 3)) * 0.08) + 's';
      var fig = document.createElement('div'); fig.className = 'vc-fig';
      var img = document.createElement('img'); img.alt = ''; img.draggable = false;
      asset(h.id).pronto.then(function (a) { img.src = a.busto; });
      fig.appendChild(img);
      var cap = document.createElement('div'); cap.className = 'vc-nome'; cap.textContent = nomeCorto(h.id);
      f.appendChild(fig); f.appendChild(cap);
      (dentro ? blu : ros).appendChild(f);
    });
    $('c-modo').textContent = sopr ? T('tutti') : T(modoDi(modo).n);
    $('c-mappa').textContent = (LANG === 'en' ? mappa.nome_en : mappa.nome_it) + ' · ' + modoDi(modo).tag;
    $('c-regola').textContent = T(modo === 'gemme' ? 'regola_gemme' : modo === 'duello' ? 'regola_duello' : 'regola_sopr');
    B.fase = 'carica';
    var t0 = 0;
    var entra = function () {
      mostra('s-carica'); S.musicaFile(null); t0 = performance.now(); if (S.annunciaModo) S.annunciaModo(sopr ? 'tutti' : modo);   /* audio 22/11 */
      var sc = $('s-carica'); sc.classList.remove('scossa'); void sc.offsetWidth; sc.classList.add('scossa');
      S.vsEntra(); setTimeout(function () { if (APP.schermo === 's-carica') { S.vsColpo(); vibra(25); } }, AUTO ? 0 : 430);
    };
    entra();
    var via = function () { if (APP.schermo !== 's-carica' || B.fase !== 'carica') return; B.fase = 'via'; if (AUTO) avvia(); else sipario(avvia, 1); };
    $('s-carica').onclick = function () { if (performance.now() - t0 > 600) via(); };
    setTimeout(via, AUTO ? 600 : 2900);
  }
  function avvia() {
    mostra('');
    B.fase = 'partita';
    P.t0 = performance.now();
    S.musicaFile(APP.modo === 'duello' ? 'duello' : 'partita'); if (S.impostaEroe) S.impostaEroe(APP.eroe);   /* audio 21/11: voci dell'eroe */
    S.musicaVia(false);
    P.intro = AUTO ? 0.3 : 1.5;
    P.conto = AUTO ? 0 : CONTO.durata; P.contoN = 0;
    if (window.R3) R3.intro(P.intro);
    if (P.modelli) P.modelli.then(function () { R3.aggiornaModelli(); });
    var nomeModo = T(modoDi(APP.modo).n).toUpperCase();
    banner(nomeModo, T(APP.modo === 'gemme' ? 'regola_gemme' : APP.modo === 'duello' ? 'regola_duello' : 'regola_sopr'), '#ffd23b', 1.35, 1);
    var fatto = false; try { fatto = localStorage.getItem('gb_tutorial') === '1'; } catch (e) { }
    P.tut = !P.rep && ((!fatto && !AUTO && !Q.get('notut')) || Q.get('tutorial') === '1') ? { passo: 0, t: 0, x0: P.st.eroi[0].x, y0: P.st.eroi[0].y, spari: 0 } : null;
    if (P.tut) P.rec = null;   // SPETTATORE 23/11: il tutorial ferma i bot e regala la super: quella partita non si può rigiocare
    if (window.SPETT) SPETT.inizia(P);
  }
  // conto alla rovescia dopo il volo d'apertura: 3, 2, 1 (0,62 s l'uno) e BRAWL! — il motore parte con BRAWL!
  var CONTO = { passo: 0.62, durata: 0.62 * 3 };
  function contoPasso(dt) {
    var prima = P.conto;
    P.conto -= dt;
    var n = Math.ceil(P.conto / CONTO.passo);
    var nPrima = Math.ceil(prima / CONTO.passo);
    if (prima >= CONTO.durata - 1e-6 || n !== nPrima) { if (n >= 1 && n <= 3) { S.conto(n); P.contoT = 0; } }
    if (P.conto <= 0) { P.conto = 0; P.brawlT = 0.001; S.brawl(); D.scuoti(0.25); vibra(30); }
  }

  // ---------------- mini tutorial (3 passi, saltabile) ----------------
  var TUT = {
    it: [['MUOVITI', 'Trascina il pollice nella metà sinistra', 'WASD o frecce'], ['MIRA E SPARA', 'Trascina a destra e rilascia. Tocco breve: spara dritto', 'Mouse per mirare, clic per sparare'], ['SUPER!', 'È carica: tocca il tasto giallo (o trascinalo per mirare)', 'Tasto destro o E']],
    en: [['MOVE', 'Drag your thumb on the left half', 'WASD or arrows'], ['AIM AND SHOOT', 'Drag on the right and release. Quick tap: shoot straight', 'Mouse to aim, click to shoot'], ['SUPER!', 'It is charged: tap the yellow button (or drag it to aim)', 'Right click or E']]
  };
  var SALTA = { x: 0, y: 0, w: 92, h: 34 };
  function aggiornaTutorial(dt) {
    var t = P.tut, st = P.st, me = st.eroi[0];
    if (!t) return;
    t.t += dt;
    t.cammino = (t.cammino || 0) + Math.hypot(me.x - me.ox, me.y - me.oy);   // strada fatta, non distanza dalla base
    if (t.passo === 0 && t.cammino > 1.2) { t.passo = 1; t.t = 0; S.superPronta(); }
    else if (t.passo === 1 && me.tAtt > 0 && st.t - me.tAtt < 2) { t.spari = (t.spari || 0); if (me.tAtt !== t.ultimo) { t.ultimo = me.tAtt; t.spari++; } if (t.spari >= 2) { t.passo = 2; t.t = 0; me.sup = 1; me.supPronta = true; S.superPronta(); } }
    else if (t.passo === 2 && me.tSup > 0 && st.t - me.tSup < 3) { finisciTutorial(); }
  }
  function finisciTutorial() {
    P.tut = null;
    try { localStorage.setItem('gb_tutorial', '1'); } catch (e) { }
    banner(LANG === 'en' ? 'FIGHT!' : 'VIA!', '', '#5cff8a', 1.2, 1.3);
  }
  function disegnaTutorial(g, k) {
    var t = P.tut;
    if (!t) return;
    var testi = TUT[LANG] || TUT.it, q = testi[t.passo], y = H * (H > W ? 0.6 : 0.55);
    var bw = Math.min(W - 40, 420);
    disegnaPannello(g, W / 2 - bw / 2, y - 44, bw, 88, '#ffd23b', 14);
    TXT(g, (t.passo + 1) + '/3 · ' + q[0], W / 2, y - 18, 20 * k, '#ffffff', '#ffd23b', true);
    var qq = IN.desktop ? q[2] : q[1];
    TXT(g, qq, W / 2, y + 16, Math.min(13 * k, (bw - 24) / Math.max(10, qq.length * 0.6)), '#ffffff');
    // pallino che pulsa sul comando giusto
    var pul = 0.5 + 0.5 * Math.sin(D.tempo * 8), cx = t.passo === 0 ? UI.mov.x : t.passo === 1 ? UI.att.x : UI.sup.x, cy = t.passo === 0 ? UI.mov.y : t.passo === 1 ? UI.att.y : UI.sup.y;
    if (!IN.desktop) { g.strokeStyle = '#ffd23f'; g.lineWidth = 4; g.globalAlpha = pul; g.beginPath(); g.arc(cx, cy, 50 + pul * 12, 0, 6.283); g.stroke(); g.globalAlpha = 1; }
    SALTA.x = W - SA.r - SALTA.w - 10; SALTA.y = SA.t + 70;
    disegnaPannello(g, SALTA.x, SALTA.y, SALTA.w, SALTA.h, '#ffffff', 9);
    TXT(g, LANG === 'en' ? 'SKIP ›' : 'SALTA ›', SALTA.x + SALTA.w / 2 + 3, SALTA.y + SALTA.h / 2, 13, '#ffffff');
  }

  // ---------------- banner e cronaca dei KO (pool fisso) ----------------
  var BANNER = [], FEED = [], NATI = 0;
  for (var bi = 0; bi < 4; bi++) { BANNER.push({ on: 0, t: 0, dur: 1, testo: '', sub: '', col: '#fff', sc: 1, nato: 0, y: 0 }); FEED.push({ on: 0, t: 0, a: '', b: '', ca: '#fff', cb: '#fff', ida: null, idb: null, serie: 0 }); }
  function colGas(st) { return st && st.M && st.M.tema === 4 ? '#e07bff' : '#3bff8b'; }   // 23/11: il gas del Canyon è viola
  function banner(testo, sub, col, dur, sc) {
    var b = BANNER[0];
    for (var i = 0; i < BANNER.length; i++) if (!BANNER[i].on) { b = BANNER[i]; break; }
    for (i = 0; i < BANNER.length; i++) if (BANNER[i].on && BANNER[i].testo === testo) b = BANNER[i];
    if (!b.on) b.y = H > W ? H * 0.22 : H * 0.3;
    b.on = 1; b.t = 0; b.dur = dur || 1.4; b.testo = testo; b.sub = sub || ''; b.col = col || '#fff'; b.sc = sc || 1; b.nato = ++NATI; b.y0 = 0;
    return b;
  }
  // GEMME 22/11: gli avvisi del conto stanno SOTTO il conto grande (su telefono in orizzontale lo coprivano)
  function sottoConto(b) { var k = scala(); b.y0 = Math.max(H > W ? H * 0.22 : H * 0.3, SA.t + 8 + (42 + 160) * k); b.y = Math.max(b.y, b.y0); }
  function cronaca(a, b, ca, cb, ida, idb, serie) {
    var f = FEED[0], vecchio = 1e9;
    for (var i = 0; i < FEED.length; i++) { if (!FEED[i].on) { f = FEED[i]; break; } if (FEED[i].t < vecchio) { vecchio = FEED[i].t; f = FEED[i]; } }
    f.on = 1; f.t = performance.now(); f.a = a; f.b = b; f.ca = ca; f.cb = cb; f.ida = ida || null; f.idb = idb || null; f.serie = serie ? 1 : 0;
  }

  // ---------------- comandi ----------------
  var IN = {
    tasti: {}, desktop: false,
    mov: { id: -1, bx: 0, by: 0, x: 0, y: 0 },
    mira: { id: -1, bx: 0, by: 0, x: 0, y: 0, uscito: false, sup: false, t0: 0 },
    mouse: { x: 0, y: 0, dentro: false, sx: false, dx: false },
    bufAtt: 0, ax: 0, ay: 0, bufSup: 0, sx: 0, sy: 0, bufGad: 0, gx: 0, gy: 0, eTenuto: false, qTenuto: false
  };
  var DEAD_MIRA = 0.22;
  // misure del feel: tempi fra l'input e il primo fotogramma che lo mostra (?misura=1)
  var MIS = B.misure = { mov: [], sparo: [], rot: [], movT: 0, movX: 0, movY: 0, sparoT: 0, sparoAtt: 0, sparoMov: 0, rotT: 0, rotA: 0 };
  function misuraFotogramma() {
    if (!P || !window.R3 || !R3.eroi[0]) return;
    var e = R3.eroi[0], h = P.st.eroi[0], ora = performance.now();
    if (MIS.movT && (Math.abs(e.x - MIS.movX) > 0.005 || Math.abs(e.y - MIS.movY) > 0.005)) { MIS.mov.push(ora - MIS.movT); MIS.movT = 0; }
    if (MIS.sparoT && (h.tAtt !== MIS.sparoAtt || e.movT !== MIS.sparoMov)) { MIS.sparo.push(ora - MIS.sparoT); MIS.sparoT = 0; }
    if (MIS.rotT) { var voluto = Math.atan2(Math.cos(MIS.rotA), Math.sin(MIS.rotA)), d = voluto - e.rot; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; if (Math.abs(d) < 0.26) { MIS.rot.push(ora - MIS.rotT); MIS.rotT = 0; } }
  }
  function inPartita() { return P && B.fase === 'partita' && !APP.pausa; }
  function vicino(x, y, c, r) { var dx = x - c.x, dy = y - c.y; return dx * dx + dy * dy <= r * r; }

  cv.addEventListener('pointerdown', function (e) {
    S.sblocca();
    if (!inPartita()) return;
    e.preventDefault();
    var x = e.clientX, y = e.clientY;
    if (vicino(x, y, UI.pausa, UI.pausa.r + 12)) { pausa(true); return; }
    if (P.tut && x >= SALTA.x && x <= SALTA.x + SALTA.w && y >= SALTA.y && y <= SALTA.y + SALTA.h) { finisciTutorial(); return; }
    if (e.pointerType === 'mouse') {
      IN.desktop = true;
      IN.mouse.x = x; IN.mouse.y = y; IN.mouse.dentro = true;
      if (e.button === 2) { IN.mouse.dx = true; } else { IN.mouse.sx = true; spara(vettoreMouse(false), false); }
      return;
    }
    IN.desktop = false;
    try { cv.setPointerCapture(e.pointerId); } catch (er) { }
    if (IN.mira.id < 0 && vicino(x, y, UI.gad, UI.gad.r + 10)) {
      IN.mira.id = e.pointerId; IN.mira.bx = UI.gad.x; IN.mira.by = UI.gad.y; IN.mira.x = x; IN.mira.y = y; IN.mira.uscito = false; IN.mira.sup = 'gad'; IN.mira.t0 = performance.now();
      return;
    }
    if (IN.mira.id < 0 && vicino(x, y, UI.sup, UI.sup.r + 16)) {
      IN.mira.id = e.pointerId; IN.mira.bx = UI.sup.x; IN.mira.by = UI.sup.y; IN.mira.x = x; IN.mira.y = y; IN.mira.uscito = false; IN.mira.sup = true; IN.mira.t0 = performance.now();
      return;
    }
    if (x < W * 0.5) {
      if (IN.mov.id < 0) { IN.mov.id = e.pointerId; IN.mov.bx = x; IN.mov.by = y; IN.mov.x = x; IN.mov.y = y; if (window.R3 && R3.eroi[0]) { MIS.movT = 0; MIS.movArm = 1; } }
    } else if (IN.mira.id < 0) {
      IN.mira.id = e.pointerId; IN.mira.bx = x; IN.mira.by = y; IN.mira.x = x; IN.mira.y = y; IN.mira.uscito = false; IN.mira.sup = false; IN.mira.t0 = performance.now();
    }
  }, { passive: false });
  cv.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') { IN.mouse.x = e.clientX; IN.mouse.y = e.clientY; IN.mouse.dentro = true; return; }
    if (e.pointerId === IN.mov.id) {
      IN.mov.x = e.clientX; IN.mov.y = e.clientY;
      if (MIS.movArm && Math.hypot(IN.mov.x - IN.mov.bx, IN.mov.y - IN.mov.by) > UI.R * 0.2 && window.R3 && R3.eroi[0]) { MIS.movArm = 0; MIS.movT = performance.now(); MIS.movX = R3.eroi[0].x; MIS.movY = R3.eroi[0].y; }
      // la base segue il dito se si allontana troppo
      var dx = IN.mov.x - IN.mov.bx, dy = IN.mov.y - IN.mov.by, d = Math.sqrt(dx * dx + dy * dy), lim = UI.R * 1.25;
      if (d > lim) { IN.mov.bx += dx / d * (d - lim); IN.mov.by += dy / d * (d - lim); }
    }
    if (e.pointerId === IN.mira.id) {
      IN.mira.x = e.clientX; IN.mira.y = e.clientY;
      var v = vettoreMira();
      if (v.l > DEAD_MIRA && !IN.mira.uscito && window.R3) { MIS.rotT = performance.now(); MIS.rotA = Math.atan2(v.y, v.x); }
      if (v.l > DEAD_MIRA) IN.mira.uscito = true;
    }
  });
  function rilascia(e) {
    if (e.pointerType === 'mouse') {
      if (e.button === 2) { if (IN.mouse.dx) { IN.mouse.dx = false; spara(vettoreMouse(true), true); } }
      else IN.mouse.sx = false;
      return;
    }
    if (e.pointerId === IN.mov.id) IN.mov.id = -1;
    if (e.pointerId === IN.mira.id) {
      var v = vettoreMira(), m = IN.mira;
      m.id = -1;
      if (!inPartita()) return;
      if (!m.sup && P.st.eroi[0].ammo >= 1 && window.R3 && R3.eroi[0]) { MIS.sparoT = performance.now(); MIS.sparoAtt = P.st.eroi[0].tAtt; MIS.sparoMov = R3.eroi[0].movT; }
      if (!m.uscito) spara(!m.sup && AUTOMIRA ? miraAssistita() : { x: 0, y: 0 }, m.sup);           // tocco breve: dove guarda l'eroe (o, se accesa, verso il nemico visibile più vicino a tiro)
      else if (v.l > DEAD_MIRA) spara({ x: v.x, y: v.y }, m.sup); // trascina e rilascia
      // altrimenti: riportato al centro = annullato
    }
  }
  cv.addEventListener('pointerup', rilascia);
  cv.addEventListener('pointercancel', function (e) { if (e.pointerId === IN.mov.id) IN.mov.id = -1; if (e.pointerId === IN.mira.id) IN.mira.id = -1; });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  cv.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') IN.mouse.dentro = false; });
  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    IN.tasti[k] = true;
    if (inPartita()) IN.desktop = true;
    if ((k === 'e' || k === ' ') && !IN.eTenuto && inPartita()) { IN.eTenuto = true; }
    if (k === 'q' && inPartita() && !IN.qTenuto) { IN.qTenuto = true; }
    if (k === 'escape' && P && B.fase === 'partita') pausa(!APP.pausa);
    if (k === ' ' || k.indexOf('arrow') === 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) {
    var k = e.key.toLowerCase();
    IN.tasti[k] = false;
    if ((k === 'e' || k === ' ') && IN.eTenuto) { IN.eTenuto = false; if (inPartita()) spara(vettoreMouse(true), true); }
    if (k === 'q' && IN.qTenuto) { IN.qTenuto = false; if (inPartita()) spara(vettoreMouse('gad'), 'gad'); }
  });

  // [fable gioco 17/11] MIRA ASSISTITA sul tocco breve (convenzione del genere): il nemico VISIBILE più vicino dentro la gittata e senza muri in mezzo.
  // Di norma SPENTA (regola della casa: niente mira automatica). Si accende con ?automira=1 o localStorage gb_automira=1.
  var AUTOMIRA = Q.get('automira') === '1' || (Q.get('automira') !== '0' && (function () { try { return localStorage.getItem('gb_automira') === '1'; } catch (e) { return false; } })());
  function miraAssistita() {
    var st = P.st, h = st.eroi[0], a = h.d.att, g = (a.gitt || 4) * 1.05, best = null, bd = 1e9;
    for (var i = 1; i < st.eroi.length; i++) {
      var e = st.eroi[i];
      if (!e.vivo || e.sq === h.sq || !M.visibile(st, e, h.sq)) continue;
      var dx = e.x - h.x, dy = e.y - h.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > g || d >= bd) continue;
      if (!(a.mira && a.mira.forma === 'arco') && !M.lineaLibera(st, h.x, h.y, e.x, e.y)) continue;
      bd = d; best = e;
    }
    if (!best) return { x: 0, y: 0 };
    var f = Math.max(0.08, Math.min(1, bd / (a.gitt || 4))), l = bd || 1;
    return { x: (best.x - h.x) / l * f, y: (best.y - h.y) / l * f, mondo: true };
  }
  var _vm = { x: 0, y: 0, l: 0 };
  function vettoreMira() {
    var m = IN.mira, x = (m.x - m.bx) / UI.R, y = (m.y - m.by) / UI.R, l = Math.sqrt(x * x + y * y);
    if (l > 1) { x /= l; y /= l; l = 1; }
    _vm.x = x; _vm.y = y; _vm.l = l; return _vm;
  }
  // col mouse: direzione dal mio eroe al puntatore, lunghezza = distanza / gittata
  // ---- schermo → mondo (giro 7): la camera può girare (ARENE: i rossi la vedono capovolta). Le levette e la mira
  // si leggono sullo schermo; qui si portano nel mondo con la proiezione vera attorno al mio eroe, tenendo la lunghezza.
  var BASE = { a: 1, b: 0, c: 0, d: 1 };
  var _q0 = { x: 0, y: 0 }, _q1 = { x: 0, y: 0 }, _q2 = { x: 0, y: 0 };
  function aggiornaBase(st) {
    if (!window.R3 || !R3.cam || !R3.proietta) return;
    var h = st.eroi[0];
    R3.proietta(h.x, h.y, 0, _q0); R3.proietta(h.x + 1, h.y, 0, _q1); R3.proietta(h.x, h.y + 1, 0, _q2);
    var ex = _q1.x - _q0.x, ey = _q1.y - _q0.y, fx = _q2.x - _q0.x, fy = _q2.y - _q0.y, det = ex * fy - fx * ey;
    if (!isFinite(det) || Math.abs(det) < 1e-6) return;
    // inversa di [ex fx; ey fy]: schermo (sx,sy) → mondo (wx,wy)
    BASE.a = fy / det; BASE.b = -fx / det; BASE.c = -ey / det; BASE.d = ex / det;
  }
  B.base = BASE;
  function mondo(x, y) {
    if (x === 0 && y === 0) return { x: 0, y: 0 };
    var wx = BASE.a * x + BASE.b * y, wy = BASE.c * x + BASE.d * y, l = Math.hypot(x, y), lw = Math.hypot(wx, wy) || 1;
    return { x: wx / lw * l, y: wy / lw * l };
  }
  function vMondo(v) { return v.mondo ? v : mondo(v.x, v.y); }
  function vettoreMouse(sup) {
    var st = P.st, h = st.eroi[0], v = D.eroiV[0];
    var px = D.px2(v.x, v.y), py = D.py2() - D.S * 0.4;
    var o = sup === 'gad' ? h.d.gad : sup ? h.d.sup : h.d.att, g = o.gitt || o.dist || o.raggio || 4;
    var x = (IN.mouse.x - px) / (g * D.S), y = (IN.mouse.y - py) / (g * D.S), l = Math.sqrt(x * x + y * y);
    if (l > 1) { x /= l; y /= l; }
    if (l < 0.06) return { x: Math.cos(h.aim) * 0.07, y: Math.sin(h.aim) * 0.07, mondo: true };
    return { x: x, y: y };
  }
  function spara(v, sup) {
    var st = P.st, h = st.eroi[0];
    v = vMondo(v);
    if (!h.vivo) return;
    if (sup === 'gad') {
      if (h.gadUsi <= 0 || h.gadCd > 0) { S.vuoto(); P.gadVuoto = 0.3; return; }
      IN.bufGad = st.t + 6; IN.gx = v.x; IN.gy = v.y;
    } else if (sup) {
      if (h.sup < 1) { S.vuoto(); P.superVuoto = 0.3; return; }
      IN.bufSup = st.t + 6; IN.sx = v.x; IN.sy = v.y;
    } else {
      if (h.ammo < 1) { S.vuoto(); D._ammoRosso = D.tempo + 0.25; }
      else if (h.cd <= 0 && h.seqN === 0 && h.stun <= 0 && h.prepT <= 0 && h.dashD <= 0 && window.R3) {
        // risposta nello stesso fotogramma del rilascio; il motore spara al passo dopo e non la ripete
        var aP = Math.hypot(v.x, v.y) > 0.05 ? Math.atan2(v.y, v.x) : h.aim;
        if ({ slot: 1, tamburo: 1, tridente: 1, shuriken_ombra: 1, palla_rotolante: 1, carta_servita: 1 }[h.d.att.tipo]) R3.vampata(0, aP, 0xffe9a8);
        else if (FEEL && R3.feelVampata) R3.feelVampata(0, aP);   // FEEL 21/11: lampo nello stesso fotogramma del rilascio per TUTTI i tiratori (prima solo 6 tipi)
        S.sparo(h.d.att.stile, true); D.calcio(Math.cos(aP), Math.sin(aP), 3); P.previsto = performance.now();
      }
      IN.bufAtt = st.t + 6; IN.ax = v.x; IN.ay = v.y; // memoria del colpo: parte appena può
    }
  }

  // la levetta si legge anche fra un passo e l'altro: la previsione del disegno usa l'input di QUESTO fotogramma
  function scriviInputMovimento(st) {
    var inp = st.inp[0], mx = 0, my = 0;
    if (IN.mov.id >= 0) { var x = (IN.mov.x - IN.mov.bx) / UI.R, y = (IN.mov.y - IN.mov.by) / UI.R, l = Math.sqrt(x * x + y * y); if (l > 0.14) { var s = Math.min(1, (l - 0.14) / 0.72) / l; mx = x * s; my = y * s; } }
    var t = IN.tasti;
    if (t.a || t.arrowleft) mx -= 1; if (t.d || t.arrowright) mx += 1; if (t.w || t.arrowup) my -= 1; if (t.s || t.arrowdown) my += 1;
    if (IN.pad.on && (IN.pad.mx || IN.pad.my)) { mx += IN.pad.mx; my += IN.pad.my; }
    var wm = mondo(mx, my); inp.mx = wm.x; inp.my = wm.y;
  }
  function scriviInput(st) {
    var inp = st.inp[0], h = st.eroi[0];
    if (AUTO) { IA.pensa(st, 0); return; }
    var mx = 0, my = 0;
    if (IN.mov.id >= 0) {
      var x = (IN.mov.x - IN.mov.bx) / UI.R, y = (IN.mov.y - IN.mov.by) / UI.R, l = Math.sqrt(x * x + y * y);
      // zona morta radiale riscalata
      if (l > 0.14) { var s = Math.min(1, (l - 0.14) / 0.72) / l; mx = x * s; my = y * s; }
    }
    var t = IN.tasti;
    if (t.a || t.arrowleft) mx -= 1; if (t.d || t.arrowright) mx += 1;
    if (t.w || t.arrowup) my -= 1; if (t.s || t.arrowdown) my += 1;
    if (IN.pad.on && (IN.pad.mx || IN.pad.my)) { mx += IN.pad.mx; my += IN.pad.my; }
    var wm = mondo(mx, my); inp.mx = wm.x; inp.my = wm.y;
    if (IN.pad.on && IN.pad.fuoco && h.ammo >= 1 && h.cd <= 0) { var vp = vMondo(vettorePad(false)); IN.bufAtt = st.t + 2; IN.ax = vp.x; IN.ay = vp.y; }
    if (IN.desktop && IN.mouse.sx && h.ammo >= 1 && h.cd <= 0) { var vm = vMondo(vettoreMouse(false)); IN.bufAtt = st.t + 2; IN.ax = vm.x; IN.ay = vm.y; }
    inp.att = 0; inp.sup = 0; inp.gad = 0;
    if (IN.bufGad > st.t) { inp.gad = 1; inp.gx = IN.gx; inp.gy = IN.gy; }
    else if (IN.bufSup > st.t) { inp.sup = 1; inp.sx = IN.sx; inp.sy = IN.sy; }
    else if (IN.bufAtt > st.t) { inp.att = 1; inp.ax = IN.ax; inp.ay = IN.ay; }
  }

  // forma della mira per il disegno
  var MIRA = { forma: '', ang: 0, gitt: 0, larg: 0, ango: 0, area: 0, dist: 0, rimb: 0, multi: 0, col: '#fff', alpha: 0.5, passaMuri: false };
  // forma della mira per ognuna delle 30 abilità (sup: false = attacco, true = super, 'gad' = gadget)
  function formaMira(h, sup, vx, vy, forte) {
    var d = h.d, o = sup === 'gad' ? (h.cavT > 0 && d.gad.balzo ? d.gad.balzo : d.gad) : sup ? d.sup : d.att, l = Math.sqrt(vx * vx + vy * vy), m = MIRA;   // 23/11: da Cavaliere la mira del gadget è il punto d'arrivo del balzo
    m.ang = l > 0.05 ? Math.atan2(vy, vx) : h.aim;
    var frac = l > 0.05 ? Math.min(1, l) : 0.75;
    m.multi = 0; m.rimb = 0; m.passaMuri = false; m.ango = 0; m.larg = 0.3; m.area = 0;
    m.col = sup === 'gad' ? '#2fe07a' : sup ? '#ffc21a' : (h.ammo < 1 ? '#ff6b6b' : '#3fb3ff');
    m.alpha = forte ? 0.8 : 0.5;
    m.gitt = o.gitt || o.dist || o.raggio || 1.5;
    m.esito = '';
    if (o.mira) { var q = o.mira; m.forma = q.forma; if (q.larg) m.larg = q.larg; if (q.ango) m.ango = q.ango; if (q.area) m.area = q.area; if (q.gitt) m.gitt = q.gitt; if (q.passaMuri || o.tipo === 'freccia_oro') m.passaMuri = true; m.dist = q.dist != null ? q.dist : frac * m.gitt; }
    else switch (o.tipo) {
      // attacchi
      case 'slot': m.forma = 'cono'; m.ango = 32; break;
      case 'tamburo': m.forma = 'cono'; m.ango = 14; break;
      case 'affondo': m.forma = 'linea'; m.larg = o.largo * 2; break;
      case 'tridente': case 'shuriken_ombra': m.forma = 'linea'; m.larg = (o.rp || 0.15) * 2 + 0.1; break;
      case 'palla_rotolante': m.forma = 'linea'; m.larg = o.rp * 2; break;
      case 'azzannata': m.forma = 'linea'; m.larg = 0.9; m.gitt = o.lunge + o.gitt; break;
      case 'doppio_artiglio': m.forma = 'cono'; m.ango = o.ango; break;
      case 'dado': case 'pila_crollo': case 'seme_rovo': m.forma = 'arco'; m.area = o.area; m.dist = frac * o.gitt; break;
      // super
      case 'slot_torretta': m.forma = 'punto'; m.gitt = 2.5; m.area = 0.5; m.dist = Math.min(2.5, frac * 2.5); break;
      case 'famiglia': case 'falange': case 'fortezza': case 'trasformazione': case 'immersione': m.forma = 'cerchio'; m.gitt = o.raggio || 1.2; break;
      case 'rete': m.forma = 'linea'; m.larg = o.rp * 2; break;
      case 'fumogeno': case 'maledizione': m.forma = 'punto'; m.area = o.area; m.dist = frac * m.gitt; break;
      case 'bordata': m.forma = 'punto'; m.area = o.area; m.dist = m.gitt; m.multi = o.n; break;
      // gadget
      case 'carica_oplita': m.forma = 'linea'; m.larg = 0.9; m.gitt = o.dist; break;
      case 'ululato': m.forma = 'cerchio'; m.gitt = o.raggio; break;
      case 'calderone': m.forma = 'punto'; m.area = o.area; m.dist = l > 0.05 ? frac * m.gitt : 0; break;
      case 'barile': m.forma = 'arco'; m.area = o.area; m.dist = frac * m.gitt; break;
      case 'pila': m.forma = 'punto'; m.gitt = 1.3; m.area = 0.5; m.dist = 1.3; break;
      default: m.forma = 'cerchio'; m.gitt = 1;
    }
    esitoMira(h, m, sup);
    B.miraDbg = { tipo: o.tipo, forma: m.forma, gitt: +m.gitt.toFixed(2), larg: +m.larg.toFixed(2), ango: m.ango, area: m.area, dist: +(m.dist || 0).toFixed(2) };
    return m;
  }
  // cosa colpirà? rosso = un nemico visibile, grigio = si ferma su un muro prima, colore normale = vuoto
  function esitoMira(h, m, sup) {
    var st = P.st, c = Math.cos(m.ang), s = Math.sin(m.ang), muro = m.gitt, i, e;
    if ((m.forma === 'linea' || m.forma === 'cono') && !m.passaMuri) {
      for (var L = 0.3; L < m.gitt; L += 0.1) if (M.bloccaColpo(st, Math.floor(h.x + c * L), Math.floor(h.y + s * L))) { muro = L; break; }
    }
    var colpisce = false;
    for (i = 0; i < st.eroi.length && !colpisce; i++) {
      e = st.eroi[i];
      if (!e.vivo || e.sq === h.sq || !M.visibile(st, e, h.sq)) continue;
      var dx = e.x - h.x, dy = e.y - h.y, pr = dx * c + dy * s, perp = Math.abs(dx * s - dy * c), dd = Math.hypot(dx, dy);
      if (m.forma === 'linea') colpisce = pr > 0 && pr < muro + 0.3 && perp < m.larg / 2 + M.R;
      else if (m.forma === 'cono') { var da = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - m.ang), Math.cos(Math.atan2(dy, dx) - m.ang))); colpisce = dd < Math.min(muro, m.gitt) + M.R && da < Math.max(6, m.ango) * Math.PI / 360 + 0.15; }
      else if (m.forma === 'cerchio') colpisce = dd < m.gitt + M.R;
      else { var tx = h.x + c * m.dist, ty = h.y + s * m.dist; colpisce = Math.hypot(e.x - tx, e.y - ty) < Math.max(0.5, m.area) + M.R * 0.6; }
    }
    if (colpisce) { m.col = sup === true ? '#ff7a2e' : '#ff4d5e'; m.esito = 'nemico'; }
    else if ((m.forma === 'linea' || m.forma === 'cono') && muro < m.gitt * 0.95) { m.col = '#6c7286'; m.esito = 'muro'; }
  }

  function pausa(on) {
    if (!P) return;
    APP.pausa = on;
    foglio('pausa', on);
    IN.mov.id = -1; IN.mira.id = -1;
    S.musicaPausa(on);
    if (on) S.indietro(); else S.passa();
  }
  $('p-riprendi').onclick = function (e) { premi($('p-riprendi'), e, function () { pausa(false); }, 60); };
  $('p-esci').onclick = function () { S.indietro(); pausa(false); P = null; B.fase = 'menu'; vai('s-home', -1); };

  // ---------------- eventi del motore → sensazioni ----------------
  var COL = D.COL;
  var SERIE = {};
  // gemme che volano verso il contatore
  var VOLI = []; for (var vi = 0; vi < 12; vi++) VOLI.push({ on: 0, x: 0, y: 0, t: 0, nostra: true });
  function volaGemma(x, y, nostra) {
    if (P.st.modo !== 'gemme' || !window.R3) return;
    var q = { x: 0, y: 0 }; R3.proietta(x, y, 0.4, q);
    for (var i = 0; i < VOLI.length; i++) if (!VOLI[i].on) { var g = VOLI[i]; g.on = 1; g.x = q.x; g.y = q.y; g.t = 0; g.nostra = nostra; return; }
  }
  function R3col(id) { return window.R3 ? R3.colore(id) : '#ffffff'; }
  function colSquadra(st, h) { return h.i === 0 ? COL.io : (h.sq === st.eroi[0].sq ? COL.blu : COL.rosso); }
  function suSchermo(x, y) { var X = D.wx(x), Y = D.wy(y); return X > -60 && X < W + 60 && Y > -60 && Y < H + 60; }

  function gestisciEventi(st) {
    var me = st.eroi[0];
    for (var n = 0; n < st.nev; n++) {
      var e = st.ev[n], h, v;
      switch (e.tipo) {
        case 'sparo': {
          h = st.eroi[e.a]; v = D.eroiV[e.a];
          v.rinculo = 1;
          var c = Math.cos(e.b), s = Math.sin(e.b), sti = h.d.att.stile, mio = e.a === 0;
          var visto = M.visibile(st, h, me.sq);
          var adist = { slot: 1, tamburo: 1, tridente: 1, shuriken_ombra: 1, palla_rotolante: 1, carta_servita: 1 };
          var pilota = window.R3 && R3.vfxPilota && R3.vfxPilota(h.id);   // 21/11: pilota VFX (Bot, Pistolero): niente lampi e scintille 2D, li fa vfx_ai.js
          if (visto && adist[h.d.att.tipo] && !pilota) {
            D.lampo(h.x + c * 0.55, h.y + s * 0.55, 0.32, info(h.id).colore2);
            D.scintille(h.x + c * 0.55, h.y + s * 0.55, e.b, 3, '#ffe9a8', 6);
            if (sti === 'proiettile' || sti === 'gettone') D.bossolo(h.x, h.y, e.b);
          }
          var giaFatto = mio && e.c === 0 && P.previsto && performance.now() - P.previsto < 220;
          if ((visto || mio) && !giaFatto) S.sparo(sti, mio);
          if (mio && !giaFatto) { D.calcio(c, s, 2.5); }
          if (mio && h.d.att.danno >= 1200) D.scuoti(0.12);
          if (giaFatto) P.previsto = 0;
          break;
        }
        case 'fendente': {
          h = st.eroi[e.a];
          v = D.eroiV[e.a]; v.fend = -(v.fend || 1);
          if (h.d.att.tipo === 'azzannata') D.effetto('fauci', e.x, e.y, e.b, e.c, 0, 0, 0.25, '#ffffff');
          else D.effetto('fendente', e.x, e.y, e.b, e.c, e.d, v.fend, 0.2, R3col(h.id));
          if (suSchermo(e.x, e.y)) S.sparo(h.d.att.stile, e.a === 0);
          break;
        }
        case 'affondo': D.effetto('lancia', e.x, e.y, e.b, e.c, 0, 0, 0.22, '#fff6c8'); break;
        case 'prep': if (window.R3) R3.runa(e.a, e.c); if (e.a === 0 || suSchermo(e.x, e.y)) S.carica(e.b === 1, e.c); break;
        case 'gadget': if (e.a === 0) { S.tasto(); var gadNome = st.eroi[e.a].d.gad; if (st.eroi[e.a].cavT > 0 && gadNome.balzo && gadNome.balzo.nome_it) gadNome = gadNome.balzo;   /* 23/11: da Cavaliere il gadget è il Balzo del Cavaliere */ banner((LANG === 'en' ? gadNome.nome_en : gadNome.nome_it).toUpperCase(), '', '#5cff8a', 0.8, 0.7); } break;
        case 'slot': {
          var SIMB = ['🍒', '🔔', 'BAR', '7'], s0 = e.b & 3, s1 = (e.b >> 2) & 3, s2 = (e.b >> 4) & 3;
          D.numero(e.x, e.y - 0.4, SIMB[s0] + ' ' + SIMB[s1] + ' ' + SIMB[s2], '#ffd23f', 0);
          if (s0 === 3 && s1 === 3 && s2 === 3) { if (suSchermo(e.x, e.y)) { if (S.jackpot) S.jackpot(); else S.superPronta(); D.scuoti(0.2); } if (e.a === 0) banner('JACKPOT!', '7 7 7', '#ffd23f', 1, 1); }
          break;
        }
        case 'dado': {
          var FACCE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'], CF = ['', '#cccccc', '#cccccc', '#9ad8ff', '#ffb36b', '#ff4d5e', '#ffd23f'];
          D.numero(e.x, e.y, FACCE[e.c], CF[e.c], 1);
          D.anello(e.x, e.y, e.a, CF[e.c], 0.4); D.fumo(e.x, e.y, 6, '#d9c7ff', 0.4); D.scintille(e.x, e.y, 0, 8, '#ffe9a8', 7);
          if (suSchermo(e.x, e.y)) { S.esplo(e.c >= 5); D.scuoti(e.c >= 5 ? 0.35 : 0.15); }
          break;
        }
        case 'ombra': D.fumo(e.x, e.y, 8, '#3a2f52', 0.45); D.fumo(e.b, e.c, 8, '#ff2e88', 0.35); if (suSchermo(e.x, e.y)) S.sparo('shuriken', e.a === 0); break;
        case 'tuffo': D.anello(e.x, e.y, 1.4, '#7fd8ff', 0.5); D.fumo(e.x, e.y, 10, '#bfefff', 0.45); if (suSchermo(e.x, e.y)) S.esplo(false); break;
        case 'riemerge': D.anello(e.x, e.y, e.b, '#7fd8ff', 0.5); D.anello(e.x, e.y, e.b * 0.6, '#ffffff', 0.4); D.fumo(e.x, e.y, 16, '#bfefff', 0.55); D.scintille(e.x, e.y, -1.57, 14, '#bfefff', 9); if (suSchermo(e.x, e.y)) { D.scuoti(0.5); S.esplo(true); } if (e.a === 0) P.freeze = Math.max(P.freeze, 0.07); break;
        case 'esecuzione': D.numero(e.x, e.y - 0.6, '×2', '#ff2e4d', 1); break;
        case 'scudoAssorbe': D.scintille(e.x, e.y, -1.57, 4, '#ffb36b', 5); break;
        case 'parato': D.scintille(e.x, e.y, e.b + Math.PI, 8, '#ffe9a8', 8); D.lampo(e.x, e.y, 0.4, '#fff'); if (suSchermo(e.x, e.y)) { if (e.c === 1 && S.nuovo) S.fx('paratoScudo', e, e.a === 0); else S.muro(); } break;   /* audio 22/11: scudo di Agamennone */
        case 'muretto': D.fiches(e.x, e.y, 10, 0.7); D.anello(e.x, e.y, 0.8, '#ffd23f', 0.3); if (suSchermo(e.x, e.y)) S.cassa(); break;
        case 'sostituzione': D.fumo(e.x, e.y, 14, '#c8c8d8', 0.55); if (suSchermo(e.x, e.y)) S.sparo('carta', e.a === 0); break;
        case 'scagnozzo': D.fumo(e.x, e.y, 6, '#ffffff', 0.35); D.anello(e.x, e.y, 0.8, '#ffc93a', 0.35); break;
        case 'barile': D.fumo(e.x, e.y, 3, '#c9a27a', 0.25); break;
        case 'pilaPosata': D.fiches(e.x, e.y, 4, 0.4); break;
        case 'raggio': D.effetto('raggio', e.x, e.y, e.b, e.c, 0, 0, 0.22, info(st.eroi[e.a].id).colore); D.lampo(e.x + Math.cos(e.b) * e.c, e.y + Math.sin(e.b) * e.c, 0.3, '#fff'); break;
        case 'onda': {
          h = st.eroi[e.a];
          D.effetto('onda', e.x, e.y, e.b, 0, 0, 0, e.c ? 0.5 : 0.3, e.c ? '#ffd23f' : info(h.id).colore);
          if (e.c) { D.anello(e.x, e.y, e.b * 1.1, '#fff', 0.5); D.fumo(e.x, e.y, 10, '#d9c7ff', 0.4); if (suSchermo(e.x, e.y)) { D.scuoti(0.45); S.esplo(true); } }
          break;
        }
        case 'colpo': {
          var pesante = e.b >= 1000 || (e.d & 1);
          var src = e.c >= 0 ? st.eroi[e.c] : null;
          if (e.a === -2) { numeroColpo(e, src, me, false); break; }
          h = st.eroi[e.a]; v = D.eroiV[e.a];
          v.flash = D.tempo;
          var ang = src ? Math.atan2(h.y - src.y, h.x - src.x) : -Math.PI / 2;
          var spin = pesante ? 1 : 0.55;
          v.shx += Math.cos(ang) * spin; v.shy += Math.sin(ang) * spin;
          if (e.a === 0 && src) { v.dirCol = ang + Math.PI; v.tDir = D.tempo; }
          if (window.R3) R3.colpito(e.a, ang, pesante ? 1 : 0.5);
          if ((M.visibile(st, h, me.sq) || e.a === 0) && !(src && window.R3 && R3.vfxPilota && R3.vfxPilota(src.id))) {
            D.scintille(h.x, h.y, ang, pesante ? 9 : 5, pesante ? '#fff3b0' : '#ffffff', pesante ? 9 : 6);
            if (pesante) D.lampo(h.x, h.y, 0.45, '#fff');
          }
          numeroColpo(e, src, me, pesante);
          if (e.a === 0) {
            P.vignetta = Math.min(0.75, P.vignetta + 0.25 + e.b / h.vmax);
            D.scuoti(Math.min(0.5, 0.12 + e.b / h.vmax * 1.2));
            S.colpo(pesante, true, e.b, src && src.id);
            fermoColpo(pesante ? 0.05 : 0.02); if (pesante) vibra(45);   // hit-stop anche sui colpi leggeri (GAMEPLAY 31/10)
          } else if (e.c === 0) {
            S.colpo(pesante, false, e.b, src && src.id);
            fermoColpo(pesante ? 0.045 : 0.03); if (pesante) { D.scuoti(0.16); vibra(20); }
          } else if (suSchermo(h.x, h.y) && (e.b >= 600)) S.colpo(false, false, e.b, src && src.id);
          break;
        }
        case 'cura':
          if (e.b >= 60 && (M.visibile(st, st.eroi[e.a], me.sq))) { D.numero(e.x, e.y, '+' + e.b, '#5cff8a', e.a === 0 ? 1 : 0); for (var k = 0; k < 3; k++) D.particella(7, e.x + (Math.random() - 0.5) * 0.6, e.y, 0.5, 0, 0, 1.5, 0.6, 0.2, '#5cff8a'); }
          if (e.a === 0 && e.b >= 300) S.cura();
          break;
        case 'ko': {
          h = st.eroi[e.a];
          var killer = e.b >= 0 ? st.eroi[e.b] : null;
          D.fiches(h.x, h.y, 26, 1.3); D.fumo(h.x, h.y, 10, '#fff', 0.45); D.anello(h.x, h.y, 2.2, colSquadra(st, h), 0.5); D.lampo(h.x, h.y, 0.9, '#fff');
          if (suSchermo(h.x, h.y)) { D.scuoti(0.5); S.ko(e.a === 0 || e.b === 0, e.b === 0 && e.a !== 0, e.a === 0); }
          if (suSchermo(h.x, h.y)) P.lento = Math.max(P.lento || 0, 0.2);
          if (killer) D.numero(h.x, h.y - 0.3, (killer.i === 0 ? T('tu') : nome(killer.id)) + ' KO!', colSquadra(st, killer), 1);
          if (killer && killer !== h) {
            // serie di KO: un altro entro 4 s
            var ser = SERIE[killer.i] || (SERIE[killer.i] = { n: 0, t: -99 });
            ser.n = st.t - ser.t < 120 ? ser.n + 1 : 1; ser.t = st.t;
            if (ser.n >= 2) { var nomeS = ser.n === 2 ? T('doppio') : ser.n === 3 ? T('triplo') : T('inarrestabile'); if (killer.i === 0) { banner(nomeS, '', COL.oro, 1.4, 1.4); S.serie(ser.n); } else cronaca(nome(killer.id), nomeS, colSquadra(st, killer), '#ffd23f', killer.id, null, 1); }
          }
          if (e.b === 0 && e.a !== 0) { P.freeze = Math.max(P.freeze, 0.11); P.lento = 0.3; D.zoomPugno(0.05); banner('KO!', nome(h.id).toUpperCase(), COL.io, 1.1, 1.3); vibra(60); }
          if (e.a === 0) { if (window.R3 && killer && killer !== h) { R3.segui = killer.i; P.seguiT = 2.6; } vibra([40, 40, 80]); P.freeze = Math.max(P.freeze, 0.14); banner(T('sei_ko'), killer ? nome(killer.id).toUpperCase() : '', COL.rosso, 1.5, 1.1); D.effetto('lampoSchermo', 0, 0, 0.35, 0, 0, 0, 0.3, '#ff2244'); }
          cronaca(killer ? (killer.i === 0 ? T('tu') : nome(killer.id)) : '☠', h.i === 0 ? T('tu') : nome(h.id), killer ? colSquadra(st, killer) : '#aaa', colSquadra(st, h), killer ? killer.id : null, h.id);
          break;
        }
        case 'cassacolpo': {
          var cc = Math.floor(e.x), rr = Math.floor(e.y);
          D.colpoCassa[rr * st.w + cc] = D.tempo;
          D.particella(1, e.x + (Math.random() - 0.5) * 0.5, e.y, 0.6, (Math.random() - 0.5) * 3, (Math.random() - 0.2) * 2, 3, 0.5, 0.07, '#a8743c');
          break;
        }
        case 'cassa':
          D.fiches(e.x, e.y, 14, 1); D.fumo(e.x, e.y, 6, '#c9a27a', 0.4);
          for (var w = 0; w < 6; w++) D.particella(1, e.x, e.y, 0.5, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5, 4 + Math.random() * 3, 0.8, 0.08, '#7a4a22');
          if (suSchermo(e.x, e.y)) { S.cassa(); D.scuoti(0.15); }
          break;
        case 'esplo': {
          var grande = e.c > 0 || e.a > 1.5;
          D.anello(e.x, e.y, e.a, '#fff', 0.3); D.anello(e.x, e.y, e.a * 1.15, info(st.eroi[e.b].id).colore, 0.45);
          D.lampo(e.x, e.y, e.a * 0.6, '#fff4c2'); D.fumo(e.x, e.y, grande ? 12 : 7, '#cfc3e6', 0.45);
          D.scintille(e.x, e.y, 0, 10, '#ffd23f', 8); D.scintille(e.x, e.y, Math.PI, 10, '#ff9f1c', 8);
          if (e.c === 2) D.effetto('colonna', e.x, e.y, 0, 0, 0, 0, 0.35, '#7fd8ff');
          if (suSchermo(e.x, e.y)) { S.esplo(grande); D.scuoti(grande ? 0.4 : 0.2); }
          break;
        }
        case 'muro':
          var pilM = window.R3 && R3.vfxPilota && st.eroi[e.a] && R3.vfxPilota(st.eroi[e.a].id);   // 21/11: col pilota VFX il colpo sul muro lo fa vfx_ai.js
          if (window.R3 && suSchermo(e.x, e.y) && !pilM) R3.impattoMuro(e.x, e.y, e.b + Math.PI);
          if (suSchermo(e.x, e.y)) { if (!pilM) { D.scintille(e.x, e.y, e.a + Math.PI, 3, '#ffffff', 4); D.fumo(e.x, e.y, 1, '#bbb', 0.18); } if (e.a === 0) S.muro(); }
          break;
        case 'svanito': D.fumo(e.x, e.y, 1, '#ddd', 0.15); break;
        case 'rimbalzo': D.scintille(e.x, e.y, 0, 4, '#ffffff', 5); if (suSchermo(e.x, e.y)) S.muro(); break;
        case 'superpronta':
          if (e.a === 0) { S.superPronta(); banner(T('sup_pronta'), '', COL.oro, 1.1, 0.8); P.superBtnPulse = 1; }
          break;
        case 'super': {
          h = st.eroi[e.a]; v = D.eroiV[e.a]; v.supT = D.tempo;
          // l'anello e il lampo generici li fa ora fx_eroi.js nel colore dell'eroe
          if (e.a === 0) {
            D.zoomPugno(0.09); D.scuoti(0.3); S.superGrido(h.d.ruolo === 'tank', h.cavT > 0 && h.id === 'fante' ? 'cavaliere' : h.id, true); P.freeze = Math.max(P.freeze, 0.07);   // 22/11 notte: da Cavaliere parla con la voce cupa
            var supNome = h.cavT > 0 && h.d.sup.cav && h.d.sup.cav.nome_it ? h.d.sup.cav : h.d.sup;   /* 23/11: da Cavaliere la super è la Carica del Cavaliere */ banner((LANG === 'en' ? supNome.nome_en : supNome.nome_it).toUpperCase() + '!', '', COL.oro, 0.85, 0.85);
          } else if (suSchermo(h.x, h.y)) { S.superGrido(h.d.ruolo === 'tank', h.cavT > 0 && h.id === 'fante' ? 'cavaliere' : h.id, false); D.scuoti(0.12); }
          break;
        }
        case 'atterra':
          D.anello(e.x, e.y, e.b, '#fff', 0.45); D.anello(e.x, e.y, e.b * 0.6, info(st.eroi[e.a].id).colore, 0.35);
          D.fumo(e.x, e.y, 14, '#d8cbb0', 0.5); D.fiches(e.x, e.y, 8, 1);
          if (suSchermo(e.x, e.y)) { D.scuoti(0.5); S.esplo(true); if (e.a === 0) P.freeze = Math.max(P.freeze, 0.07); }
          break;
        case 'impatto': { var trv = st.eroi[e.a], cavI = trv && trv.id === 'fante' && trv.cavT > 0 && trv.dashTipo === 'oplita';   // 23/11: chi viene travolto dal Cavaliere ha il suo suono (fan_travolto)
          D.lampo(e.x, e.y, 0.6, '#fff'); D.scintille(e.x, e.y, 0, 12, '#fff3b0', 9); if (suSchermo(e.x, e.y)) { D.scuoti(0.35); if (cavI) S.fx('travolto', e, e.a === 0); else S.colpo(true, false); } if (e.a === 0) P.freeze = Math.max(P.freeze, 0.06); break; }
        case 'aggancio': D.anello(e.x, e.y, 0.9, '#c9a227', 0.3); if (suSchermo(e.x, e.y)) S.colpo(true, e.a === 0); break;
        case 'rete': D.anello(e.x, e.y, 0.8, '#e8d5a3', 0.4); break;
        case 'scudo': D.anello(e.x, e.y, e.b, COL.oro, 0.6); D.anello(e.x, e.y, e.b * 0.6, '#fff', 0.4); break;
        case 'serenata': D.anello(e.x, e.y, e.b, '#5cff8a', 0.6); for (var q = 0; q < 10; q++) { var aa = q / 10 * 6.28; D.particella(7, e.x + Math.cos(aa) * e.b * 0.7, e.y + Math.sin(aa) * e.b * 0.5, 0.3, 0, 0, 1.4, 0.8, 0.25, '#5cff8a'); } break;
        case 'zona': if (e.d === 1) break;   // 22/11 vfxcarte: d=1 = pioggia di cuori della Regina (zona Z_MALE): niente anello/fumo viola da maledizione, il bordo 3D rosa lo fa vfx_carte.js
          D.anello(e.x, e.y, e.a, e.c === 1 ? '#5cff8a' : '#a24bff', 0.4); D.fumo(e.x, e.y, 5, e.c === 1 ? '#bfffd0' : '#d7a6ff', 0.4); break;
        case 'mira_orbitale': if (suSchermo(e.x, e.y)) S.tic(true); break;
        case 'mina': D.fumo(e.x, e.y, 3, '#c9a27a', 0.25); break;
        case 'torretta': D.anello(e.x, e.y, 1, COL.oro, 0.35); D.fumo(e.x, e.y, 5, '#fff', 0.3); if (suSchermo(e.x, e.y)) { if (S.torretta) S.torretta(); else S.cassa(); } break;
        case 'torrettaKo': D.fiches(e.x, e.y, 10, 1); D.fumo(e.x, e.y, 6, '#ddd', 0.35); break;
        case 'sparoTorretta': if (suSchermo(e.x, e.y)) { D.lampo(e.x + Math.cos(e.b) * 0.4, e.y - 0.2 + Math.sin(e.b) * 0.4, 0.22, '#fff'); S.sparo('torretta', false); } break;
        case 'gemmaNata': for (var gq = 0; gq < 6; gq++) D.particella(7, e.x, e.y, 0.4, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, 1.5, 0.6, 0.22, '#e3b5ff'); break;
        case 'gemmaPresa': {
          for (var gp = 0; gp < 7; gp++) D.particella(7, e.x, e.y, 0.5, (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2, 2.5, 0.5, 0.2, '#e3b5ff');
          h = st.eroi[e.a];
          if (h.sq === me.sq) S.gemma(h.gem);
          if (h.sq === me.sq || e.a === 0) volaGemma(e.x, e.y, h.sq === me.sq);
          if (e.a === 0) D.numero(e.x, e.y - 0.3, '+1', '#e3b5ff', 1);
          break;
        }
        // GEMME 22/11: avvisi chiari (chi sta vincendo, perché il conto si è fermato) — contoVia a=squadra b=durata c=chi contava prima
        case 'contoVia':
          // avviso piccolo sotto i contatori (prima: banner grande al centro, sul telefono in orizzontale copriva l'eroe)
          P.avvisoG = { t: 0, dur: 2.6, a: e.a === me.sq ? T('tua_vince') : T('nem_vince'), b: e.a === me.sq ? T('tua_vince_sub') : T('nem_vince_sub'), col: e.a === me.sq ? COL.blu : COL.rosso }; if (S.gemme) S.gemme(e.a === me.sq);
          S.musicaVia(true); P.contoNato = 1; if (S.contoVia) S.contoVia(e.a === me.sq);
          break;
        case 'contoStop': P.avvisoG = { t: 0, dur: 2.2, a: T('conto_stop'), b: (e.c >= 0 && e.c !== me.sq ? T('conto_salvi') + ' · ' : '') + T(e.b === 1 ? 'conto_pari' : 'conto_sotto'), col: '#ffffff' }; S.musicaVia(false); if (S.contoStop) S.contoStop(); break;
        case 'gemmeCadute': {
          // GEMME 22/11: a=chi è caduto b=quante c=chi l'ha messo KO d=squadra del caduto — corona di scintille e «-N»
          var nGc = Math.min(14, 4 + e.b * 2);
          for (var gc = 0; gc < nGc; gc++) { var aGc = gc / nGc * 6.283; D.particella(7, e.x, e.y, 0.5, Math.cos(aGc) * 3, Math.sin(aGc) * 2.2, 1.2, 0.55, 0.22, '#e3b5ff'); }
          D.anello(e.x, e.y, 0.9 + 0.28 * Math.sqrt(e.b), '#d77bff', 0.45);
          if (suSchermo(e.x, e.y) || e.a === 0) D.numero(e.x, e.y - 0.4, '-' + e.b, '#e3b5ff', e.b >= 5 ? 1 : 0);
          if (e.a === 0 && e.b >= 2) banner(T('gemme_perse'), '-' + e.b, '#d77bff', 1.3, 0.7);
          if (S.gemmeCadute && (suSchermo(e.x, e.y) || e.a === 0 || e.d === me.sq)) S.gemmeCadute(e.b, e.d === me.sq, suSchermo(e.x, e.y) || e.a === 0);
          break;
        }
        case 'contoTic': if (S.contoTic) S.contoTic(e.b, e.a === me.sq); else S.tic(e.b <= 5); if (e.b % 2 === 0) S.sirena(e.a === me.sq); P.contoPop = 1; break;
        case 'supplementari': banner(T('supplementari'), T('supp_sub'), COL.oro, 2.4, 1.1); if (S.supplementari) S.supplementari(); S.musicaVia(true); break;
        // 23/11 avvisi del gas (sopravvivenza): prima che parta, quando parte, quando si fa più forte, zona finale. Colore = gas della mappa
        case 'gasAvviso': banner(T('gas_avviso'), T('gas_avviso_sub'), colGas(st), 2.2, 1.05); if (S.sirena) S.sirena(false); break;
        case 'gasVia': banner(T('gas_via'), T('gas_via_sub'), colGas(st), 1.8, 1); break;
        case 'gasForte': banner(T('gas_forte'), T('gas_forte_sub'), colGas(st), 1.8, 1); if (S.sirena) S.sirena(false); break;
        case 'gasFinale': banner(T('gas_finale'), T('gas_finale_sub'), colGas(st), 2, 1.1); if (S.sirena) S.sirena(true); break;
        case 'nascita': D.anello(e.x, e.y, 1.3, colSquadra(st, st.eroi[e.a]), 0.5); D.fumo(e.x, e.y, 6, '#fff', 0.35); break;
        case 'fineScatto': D.fumo(e.x, e.y, 4, '#d8cbb0', 0.3); break;
        // abilità nuove (giro GAMEPLAY 30/10): gli effetti li disegna src3d/fx_eroi.js, qui solo suono e vibrazione
        case 'lampoVia': case 'tagliato': case 'treSette': case 'parata': case 'riflesso': case 'mano': case 'scala': case 'rastrello': case 'trascinato':
        case 'cartaPosata': case 'manata': case 'manoFerma': case 'presa': case 'scaraventa': case 'atterraLancio': case 'cordone': case 'rimbalzoCordone':
        case 'lunaPiena': case 'balzo': case 'atterraLupo': case 'artiglio': case 'affondoLancia':
        case 'tamburoColpo': case 'rimbalzoColpo': case 'ricercato': case 'frecciaOro': case 'capriola': case 'frecciaCapriola':
        case 'lanciaVia': case 'lanciaPiantata': case 'giroLancia': case 'agguato': case 'cuboNato':
        case 'pala': case 'pizzaGigante': case 'pizzeScudo': case 'pizzaPara': case 'ondaBassi': case 'dropOnda': case 'cassaPosata': case 'raggioCristallo': case 'cecchinoMira':
        case 'scudoSu': case 'scudoGiu':
        case 'stoccata': case 'puntaAsso': case 'assoVia': case 'marcato': case 'assoScatto': case 'trafitto': case 'ritirata': case 'cuoreVia': case 'cuoreCura': case 'grazia':   // 22/11 carte
        case 'affondoRombo': case 'romboRosso': case 'romboScoppia': case 'scattoRombo': case 'pioggiaQuadri': case 'corazza': case 'corazzaEsplode': case 'mazzata': case 'caricaCavaliere': case 'spallata': case 'boomerang': case 'cuoreCade': case 'balzoCav': case 'schiantoCav':   // 23/11 balzo del Cavaliere
        case 'sigillo': case 'taroccoVia': case 'scambio': case 'protetto': case 'parataVia': case 'tagliaVia': case 'portiere': {
          var mioFx = e.a === 0;
          if (mioFx || suSchermo(e.x, e.y)) S.fx(e.tipo === 'boomerang' && st.eroi[e.a] && st.eroi[e.a].id === 'regina' ? 'cuoreTorna' : e.tipo, e, mioFx);   // 22/11 notte: il cuore della Regina che torna ha il suo suono
          if (e.tipo === 'atterraLancio' && e.b === 1 && suSchermo(e.x, e.y)) D.scuoti(0.3);
          if (e.tipo === 'parata' && e.a === 0) vibra(20);
          if ((e.tipo === 'corazzaEsplode' || e.tipo === 'trafitto' || e.tipo === 'caricaCavaliere') && suSchermo(e.x, e.y)) D.scuoti(e.tipo === 'caricaCavaliere' ? 0.15 : 0.3);   // 22/11 carte
          if (e.tipo === 'corazza' && e.a === 0) { vibra(35); D.scuoti(0.2); }
          if (e.tipo === 'schiantoCav' && suSchermo(e.x, e.y)) { D.scuoti(e.a === 0 ? 0.28 : 0.18); if (e.a === 0) vibra(30); }   // 23/11 schianto del Cavaliere: piccola scossa
          break;
        }
        case 'cuboPreso': { var chi = st.eroi[e.a]; if (e.a === 0 || suSchermo(e.x, e.y)) S.fx('cuboPreso', e, e.a === 0); if (e.a === 0) { P.popCubo = 1; D.numero(e.x, e.y - 0.3, '+10%', '#3bff8b', 1); vibra(15); } break; }
        case 'pizzaGira': case 'pizzaAtterra': case 'colonnaCristallo': case 'cassaPulsa': case 'cartaArmata': { var own = e.tipo === 'cassaPulsa' || e.tipo === 'cartaArmata' ? e.a : e.b; if (own === 0 || suSchermo(e.x, e.y)) S.fx(e.tipo, e, own === 0); if (e.tipo === 'pizzaAtterra' && own === 0) D.scuoti(0.08); break; }
        case 'sette': case 'cartaScoppia': if (e.b === 0 || suSchermo(e.x, e.y)) S.fx(e.tipo, e, e.b === 0); if (e.tipo === 'sette' && e.c >= 3 && suSchermo(e.x, e.y)) D.scuoti(0.25); break;
        // DAMA 22/11: gli effetti li disegna src3d/vfx_dama.js; qui suono, scossa e vibrazione. Proprietaria: b (scoppio, giardino, fiore), a (siepe), c (puntura)
        case 'rovoScoppia': case 'giardino': case 'fioreScatta': case 'siepe': case 'siepePunge': case 'siepeRotta': {
          var ownD = (e.tipo === 'siepe' || e.tipo === 'siepeRotta') ? e.a : e.tipo === 'siepePunge' ? e.c : e.b;
          var mioD = ownD === 0 || ((e.tipo === 'fioreScatta' || e.tipo === 'siepePunge') && e.a === 0);
          if (mioD || suSchermo(e.x, e.y)) S.fx(e.tipo, e, mioD);
          if (e.tipo === 'fioreScatta' && mioD) { D.scuoti(0.16); vibra(e.a === 0 ? 50 : 20); }
          if (e.tipo === 'rovoScoppia' && ownD === 0) D.scuoti(0.05);
          if (e.tipo === 'giardino' && ownD === 0) D.scuoti(0.12);
          break;
        }
      }
    }
  }
  // FEEL 21/11: tetto all'hit-stop dei colpi normali. Prima ogni colpo fermava TUTTO (anche il mio movimento) 20-50 ms:
  // sotto una raffica (7 colpi del tamburo, ventagli, torrette) i fermi si incatenavano e il gioco balbettava.
  // Ora un fermo ogni 0,16 s al massimo; KO, super e atterraggi restano come prima.
  function fermoColpo(d) {
    if (FEEL_STOP) { var ora = performance.now(); if (ora - (P.ultFermo || -9999) < 160) return; P.ultFermo = ora; }
    P.freeze = Math.max(P.freeze, d);
  }
  function numeroColpo(e, src, me, pesante) {
    var col, big = 0;
    if (e.a === 0) { col = '#ff5a6a'; big = 1; }
    else if (e.c === 0) { col = pesante ? '#ffd23f' : '#ffffff'; big = 1; }
    else if (src && src.sq === me.sq) col = '#cfe8ff';
    else col = '#ffb0b8';
    if (e.a !== 0 && e.c !== 0 && e.a >= 0 && !M.visibile(P.st, P.st.eroi[e.a], me.sq)) return;
    D.numero(e.x, e.y, e.b, col, big, e.a, e.c);
  }

  // ---------------- interfaccia in partita (sul canvas) ----------------
  // Stesso linguaggio dei menu: Russo One, cromo col neon, pannelli di vetro scuro con bordo cromato.
  // Tutto quello che non cambia a ogni fotogramma si cuoce una volta in un canvas e poi si copia (telefono a 60 fps).
  function scala() { return Math.max(0.8, Math.min(1.35, Math.min(W, H) / 390)); }
  function testo(g, s, x, y, px, col, bordo, al) { D.testo(g, s, x, y, px, col, bordo, al); }
  function mmss(t) { t = Math.ceil(t); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * DPR)); c.height = Math.max(1, Math.ceil(h * DPR)); c._w = w; c._h = h; var q = c.getContext('2d'); q.scale(DPR, DPR); return c; }
  var FONT = 'GBRusso';
  var CUOCO = {}, CUOCOn = 0;
  function svuotaCuoco() { CUOCO = {}; CUOCOn = 0; }
  if (document.fonts && document.fonts.load) document.fonts.load('400 32px ' + FONT).then(svuotaCuoco, function () { });
  // scritta Russo One inclinata: contorno scuro, riempimento pieno o cromato, alone neon facoltativo
  function cotto(s, px, col, neon, cromo) {
    px = Math.round(px);
    var k = s + '|' + px + '|' + col + '|' + (neon || '') + '|' + (cromo ? 1 : 0) + '|' + DPR, c = CUOCO[k];
    if (c) return c;
    if (CUOCOn > 260) svuotaCuoco();
    var f = '400 ' + px + 'px ' + FONT + ', "Arial Black", system-ui, sans-serif', mg = D.ctx;
    mg.font = f;
    var w = Math.ceil(mg.measureText(s).width + px * (neon ? 1.0 : 0.5) + 10), h = Math.ceil(px * (neon ? 1.9 : 1.45) + 6);
    c = mk(w, h);
    var q = c.getContext('2d');
    q.font = f; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineJoin = 'round';
    q.translate(w / 2, h / 2); q.transform(1, 0, -0.14, 1, 0, 0);
    if (neon) { q.save(); q.shadowColor = neon; q.shadowBlur = px * 0.32; q.strokeStyle = neon; q.lineWidth = px * 0.14; q.strokeText(s, 0, 0); q.strokeText(s, 0, 0); q.restore(); }
    q.strokeStyle = '#12081f'; q.lineWidth = Math.max(3, px * (neon ? 0.11 : 0.17)); q.strokeText(s, 0, px * 0.04); q.strokeText(s, 0, 0);
    if (cromo) {
      var gr = q.createLinearGradient(0, -px * 0.45, 0, px * 0.45);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.42, '#e6ecf8'); gr.addColorStop(0.5, '#8a93ad'); gr.addColorStop(0.62, '#d5dcee'); gr.addColorStop(1, '#ffffff');
      q.fillStyle = gr;
    } else q.fillStyle = col;
    q.fillText(s, 0, 0);
    if (cromo && col && col !== '#fff' && col !== '#ffffff') { q.globalCompositeOperation = 'source-atop'; q.globalAlpha = 0.35; q.fillStyle = col; q.fillText(s, 0, 0); }
    CUOCO[k] = c; CUOCOn++;
    return c;
  }
  function TXT(g, s, x, y, px, col, neon, cromo, al, sc) {
    var c = cotto(s, px, col, neon, cromo), w = c._w * (sc || 1), h = c._h * (sc || 1);
    var ox = al === 'left' ? px * (neon ? 0.5 : 0.25) + 5 : al === 'right' ? w - px * (neon ? 0.5 : 0.25) - 5 : w / 2;
    if (al === 'left' || al === 'right') ox = al === 'left' ? ox * (sc || 1) : ox;
    g.drawImage(c, x - ox, y - h / 2, w, h);
    return c._w * (sc || 1);
  }
  // pannello di vetro inclinato con bordo cromato (cotto per misura e colore)
  function pannello(w, h, col, r) {
    var k = 'p|' + Math.round(w) + '|' + Math.round(h) + '|' + col + '|' + DPR, c = CUOCO[k];
    if (c) return c;
    var m = 6, sk = h * 0.18; c = mk(w + m * 2 + sk, h + m * 2);
    var q = c.getContext('2d'); q.translate(m, m);
    var forma = function (ins) { var rr = Math.max(2, (r || 10) - ins); q.beginPath(); q.moveTo(sk + rr + ins, ins); q.lineTo(w + sk - rr - ins, ins); q.quadraticCurveTo(w + sk - ins, ins, w + sk - ins - rr * 0.3, ins + rr); q.lineTo(w - ins - rr * 0.2, h - ins - rr); q.quadraticCurveTo(w - ins - rr * 0.5, h - ins, w - ins - rr * 1.2, h - ins); q.lineTo(rr + ins, h - ins); q.quadraticCurveTo(ins, h - ins, ins + rr * 0.3, h - ins - rr); q.lineTo(sk + ins + rr * 0.2, ins + rr); q.quadraticCurveTo(sk + ins + rr * 0.5, ins, sk + rr + ins, ins); q.closePath(); };
    q.save(); q.shadowColor = col; q.shadowBlur = 10; forma(0); q.fillStyle = col; q.globalAlpha = 0.55; q.fill(); q.restore();
    var cr = q.createLinearGradient(0, 0, 0, h); cr.addColorStop(0, '#ffffff'); cr.addColorStop(0.24, '#b8c2d6'); cr.addColorStop(0.5, '#4f566a'); cr.addColorStop(0.64, '#f2f5ff'); cr.addColorStop(1, '#858da2');
    forma(0); q.fillStyle = cr; q.fill();
    var gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(46,22,82,0.96)'); gr.addColorStop(1, 'rgba(10,5,22,0.96)');
    forma(2.2); q.fillStyle = gr; q.fill();
    var in2 = q.createLinearGradient(0, 0, w, 0); in2.addColorStop(0, col); in2.addColorStop(1, 'rgba(0,0,0,0)');
    q.globalAlpha = 0.28; forma(2.2); q.fillStyle = in2; q.fill(); q.globalAlpha = 1;
    q.fillStyle = 'rgba(255,255,255,0.12)'; q.fillRect(sk + 8, 3.5, w - 16, 1.5);
    c._m = m; c._sk = sk;
    CUOCO[k] = c; CUOCOn++;
    return c;
  }
  function disegnaPannello(g, x, y, w, h, col, r) { var c = pannello(w, h, col, r); g.drawImage(c, x - c._m - c._sk / 2, y - c._m, c._w, c._h); }
  // faccine rotonde degli eroi (dal busto), con l'anello del colore della squadra
  function faccina(id, d, anello) {
    var k = 'f|' + id + '|' + Math.round(d) + '|' + anello + '|' + DPR, c = CUOCO[k];
    if (c) return c;
    var im = hudImg(id);
    if (CUOCO[k + '|p'] && !(im && im.complete && im.naturalWidth > 0)) return CUOCO[k + '|p'];   // MOBILE 23/11: ritratto non ancora arrivato (o mancante): il segnaposto si cuoce UNA volta, non a ogni fotogramma   // HUD in partita: busto del modello 3D (permesso solo in partita)
    c = mk(d + 4, d + 4);
    var q = c.getContext('2d'), r = d / 2, cx = r + 2;
    var gr = q.createRadialGradient(cx, cx + r * 0.4, 0, cx, cx, r); gr.addColorStop(0, info(id).colore); gr.addColorStop(1, '#170d26');
    q.beginPath(); q.arc(cx, cx, r, 0, 6.283); q.fillStyle = gr; q.fill();
    var ok = im && im.complete && im.naturalWidth > 0;
    if (ok) { q.save(); q.beginPath(); q.arc(cx, cx, r - 1, 0, 6.283); q.clip(); var s = d * 1.5; q.drawImage(im, cx - s / 2, cx - r * 0.82, s, s); q.restore(); }
    else { q.fillStyle = '#fff'; q.font = '400 ' + Math.round(d * 0.5) + 'px ' + FONT; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(nome(id).charAt(0), cx, cx + 1); }
    q.lineWidth = Math.max(2, d * 0.09); q.strokeStyle = anello; q.beginPath(); q.arc(cx, cx, r - q.lineWidth / 2 + 0.5, 0, 6.283); q.stroke();
    if (ok) { CUOCO[k] = c; CUOCOn++; } else CUOCO[k + '|p'] = c;
    return c;
  }
  // levette e tasti cotti: base di vetro, anello cromato, alone del loro colore
  function tastoTondo(r, col, pieno, stato) {
    var k = 't|' + Math.round(r) + '|' + col + '|' + (pieno ? 1 : 0) + '|' + (stato || '') + '|' + DPR, c = CUOCO[k];
    if (c) return c;
    var m = 14; c = mk(r * 2 + m * 2, r * 2 + m * 2);
    var q = c.getContext('2d'), cx = r + m;
    if (pieno) { q.save(); q.shadowColor = col; q.shadowBlur = 16; q.beginPath(); q.arc(cx, cx, r, 0, 6.283); q.fillStyle = col; q.fill(); q.restore(); }
    var cr = q.createLinearGradient(0, cx - r, 0, cx + r); cr.addColorStop(0, '#ffffff'); cr.addColorStop(0.3, '#aab3c8'); cr.addColorStop(0.52, '#4a5064'); cr.addColorStop(0.68, '#eef1fa'); cr.addColorStop(1, '#7c8499');
    q.beginPath(); q.arc(cx, cx, r, 0, 6.283); q.fillStyle = cr; q.fill();
    var gr = q.createRadialGradient(cx, cx - r * 0.35, r * 0.1, cx, cx, r);
    if (pieno) { gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, col); gr.addColorStop(1, stato === 'scuro' ? '#3a1d00' : col); }
    else { gr.addColorStop(0, 'rgba(60,30,100,0.92)'); gr.addColorStop(1, 'rgba(12,6,26,0.92)'); }
    q.beginPath(); q.arc(cx, cx, r - 2.5, 0, 6.283); q.fillStyle = gr; q.fill();
    if (!pieno) { q.strokeStyle = col; q.globalAlpha = 0.65; q.lineWidth = 2; q.beginPath(); q.arc(cx, cx, r - 4, 0, 6.283); q.stroke(); q.globalAlpha = 1; }
    q.fillStyle = 'rgba(255,255,255,0.22)'; q.beginPath(); q.ellipse(cx, cx - r * 0.5, r * 0.55, r * 0.22, 0, 0, 6.283); q.fill();
    c._r = r; c._m = m;
    CUOCO[k] = c; CUOCOn++;
    return c;
  }
  function disegnaTondo(g, x, y, r, col, pieno, stato, a) { var c = tastoTondo(r, col, pieno, stato); if (a !== undefined) g.globalAlpha = a; g.drawImage(c, x - r - c._m, y - r - c._m, c._w, c._h); g.globalAlpha = 1; }

  var easeOutBack = function (t) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  var COLCONTO = ['#3bff8b', '#ffd23b', '#ff3b4e'];
  // 3-2-1-BRAWL! e GAME!: numeri cromati col neon, entrano con un colpo; BRAWL! enorme con un lampo
  function disegnaConto(g, dt) {
    var fsN = Math.min(W * 0.3, H * 0.34), cx = W / 2, cy = H * (H > W ? 0.42 : 0.45);
    if (P.conto > 0) {
      var n = Math.ceil(P.conto / CONTO.passo), q = 1 - (P.conto - (n - 1) * CONTO.passo) / CONTO.passo;
      var tin = Math.min(1, q / 0.22), sc = 1.9 - 0.9 * easeOutBack(tin), a = q > 0.8 ? Math.max(0, 1 - (q - 0.8) / 0.2) : 1;
      var sx = q < 0.25 ? (Math.random() - 0.5) * fsN * 0.05 * (1 - q / 0.25) : 0;
      g.globalAlpha = a * 0.35; g.fillStyle = '#0b0614'; g.fillRect(0, 0, W, H); g.globalAlpha = a;
      TXT(g, String(n), cx + sx, cy, fsN, '#ffffff', COLCONTO[n - 1], true, null, sc * 0.75);
      g.globalAlpha = 1;
    } else if (P.brawlT > 0) {
      P.brawlT += dt;
      var t = P.brawlT, fsB = Math.min(W * 0.2, H * 0.27);
      if (t > 0.9) { P.brawlT = 0; return; }
      var scB = t < 0.12 ? 1.8 - 0.8 * easeOutBack(t / 0.12) : 1 + (t - 0.12) * 0.05, aB = t > 0.65 ? Math.max(0, 1 - (t - 0.65) / 0.25) : 1;
      var lampo = Math.max(0, 1 - t / 0.12);
      if (lampo > 0) { g.globalAlpha = lampo * 0.4; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); }
      g.globalAlpha = aB;
      var sxB = t < 0.2 ? (Math.random() - 0.5) * fsB * 0.06 : 0;
      TXT(g, T('brawl'), cx + sxB, cy, fsB, '#ffffff', '#ff2bd6', true, null, scB * 0.85);
      g.globalAlpha = 1;
    }
    if (P.gameT > 0) {
      P.gameT += dt;
      var tg = P.gameT, fsG = Math.min(W * 0.2, H * 0.25), scG = tg < 0.14 ? 1.7 - 0.7 * easeOutBack(tg / 0.14) : 1;
      if (tg < 0.12) { g.globalAlpha = (1 - tg / 0.12) * 0.3; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); }
      g.globalAlpha = 1;
      TXT(g, T('game'), cx, cy, fsG, '#ffffff', '#1ad7ff', true, null, scG * 0.85);
      var vinto = P.st.fine && P.st.fine.vinc === P.st.eroi[0].sq, par = P.st.fine && P.st.fine.vinc < 0;
      if (tg > 0.45) TXT(g, (par ? T('pareggio') : vinto ? T('vittoria') : T('sconfitta')).toUpperCase(), cx, cy + fsG * 0.85, fsG * 0.38, '#ffffff', par ? '#ffffff' : vinto ? '#ffd23b' : '#ff4d5e', true, null, Math.min(1, (tg - 0.45) * 6));
    }
  }

  function disegnaHUD(dt) {
    var g = D.ctx, st = P.st, me = st.eroi[0], k = scala(), HUDC = Math.min(W, H) < 600 && Q.get('cam') !== 'vecchia', top = SA.t + (HUDC ? 4 : 8);   // MOBILE 23/11: barra in alto compatta sul telefono (render3d.js zonaUtile la conosce)
    var cx = W / 2;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    D.vignettaRossa(P.vignetta);
    P.vignetta = Math.max(0, P.vignetta - dt * 1.6);
    // vita bassa: battito ai bordi
    if (me.vivo && me.vita / me.vmax < 0.3) D.vignettaRossa(0.18 + 0.12 * Math.sin(D.tempo * 7));
    if (st.modo === 'gemme' && st.conto.sq >= 0) {
      var vel = 3 + (15 - st.conto.t) * 0.5, inten = 0.12 + 0.12 * Math.max(0, Math.sin(D.tempo * vel));
      g.globalAlpha = inten; g.fillStyle = st.conto.sq === me.sq ? '#3fb3ff' : '#ff4d5e';
      g.fillRect(0, 0, W, 6 * k); g.fillRect(0, H - 6 * k, W, 6 * k); g.fillRect(0, 0, 6 * k, H); g.fillRect(W - 6 * k, 0, 6 * k, H); g.globalAlpha = 1;
    }
    var tr = M.tempoRimasto(st), ph = Math.round((HUDC ? 38 : 42) * k), tw = Math.round(70 * k);
    var tempoTxt = mmss(tr), tempoCol = st.supp ? COL.oro : (tr <= 60 ? '#ff6b7a' : '#ffffff');
    // ultimo minuto e ultimi 10 secondi: banner, suono, tic a ogni secondo
    if (!st.supp && !AUTO && P.conto <= 0) {
      if (tr <= 60 && tr > 50 && !P.um) { P.um = 1; banner(T('ultimo_minuto'), '', '#ff4d5e', 1.6, 1.1); S.ultimoMinuto(); }
      var sec = Math.ceil(tr);
      if (tr <= 10 && tr > 0 && sec !== P.ultSec) { P.ultSec = sec; S.dieci(sec); P.tempoPop = 1; }
    }
    P.tempoPop = Math.max(0, (P.tempoPop || 0) - dt * 2.5);
    if (st.modo === 'gemme') {
      var mia = st.gemSq[me.sq], loro = st.gemSq[1 - me.sq], pw = Math.round(96 * k), gap = tw / 2 + 6 * k;
      disegnaPannello(g, cx - gap - pw, top, pw, ph, '#3fb3ff', 10);
      disegnaPannello(g, cx + gap, top, pw, ph, '#ff4d5e', 10);
      disegnaPannello(g, cx - tw / 2, top + 4 * k, tw, ph - 8 * k, st.supp ? '#ffd23b' : '#ffffff', 9);
      var gs = 30 * k;
      g.drawImage(D.spr.gemma, cx - gap - pw + 6 * k, top + ph / 2 - gs / 2, gs, gs);
      g.drawImage(D.spr.gemma, cx + gap + pw - gs - 2 * k, top + ph / 2 - gs / 2, gs, gs);
      P.popGem = Math.max(0, (P.popGem || 0) - dt * 4);
      TXT(g, String(mia), cx - gap - pw * 0.38, top + ph / 2, 26 * k, COL.blu, null, true, null, 1 + 0.35 * P.popGem);
      TXT(g, String(loro), cx + gap + pw * 0.4, top + ph / 2, 26 * k, COL.rosso, null, true);
      TXT(g, tempoTxt, cx, top + ph / 2, 17 * k, tempoCol, tr <= 10 && !st.supp ? '#ff4d5e' : null, false, null, 1 + 0.3 * (P.tempoPop || 0));
      // gemme in volo verso il contatore
      for (var vq = 0; vq < VOLI.length; vq++) {
        var vg = VOLI[vq]; if (!vg.on) continue;
        vg.t += dt * 2.2; if (vg.t >= 1) { vg.on = 0; if (vg.nostra) P.popGem = 1; continue; }
        var tx = vg.nostra ? cx - gap - pw + 22 * k : cx + gap + pw - 18 * k, ty = top + ph / 2, ee = vg.t * vg.t;
        var gx = vg.x + (tx - vg.x) * ee, gy = vg.y + (ty - vg.y) * ee - Math.sin(vg.t * Math.PI) * 60 * k;
        g.drawImage(D.spr.gemma, gx - 11 * k, gy - 11 * k, 22 * k, 22 * k);
      }
      // GEMME 22/11: tacca «verso 10» sotto ogni contatore (si capisce quanto manca alla soglia)
      var SOGLIA = M.GEMME_VITTORIA || 10, bwG = pw - 16 * k, bhG = 4 * k, byG = top + ph - 2 * k;
      for (var sqG = 0; sqG < 2; sqG++) {
        var nG = sqG === 0 ? mia : loro, xG = sqG === 0 ? cx - gap - pw + 8 * k : cx + gap + 8 * k, fG = Math.min(1, nG / SOGLIA);
        g.fillStyle = 'rgba(8,4,16,0.85)'; g.fillRect(xG - 1, byG - 1, bwG + 2, bhG + 2);
        g.fillStyle = nG >= SOGLIA ? (Math.sin(D.tempo * 10) > 0 ? '#ffffff' : (sqG === 0 ? COL.blu : COL.rosso)) : (sqG === 0 ? COL.blu : COL.rosso);
        g.fillRect(xG, byG, bwG * fG, bhG);
      }
      // GEMME 22/11: conto alla rovescia GRANDE al centro, del colore della squadra che sta vincendo, con barra che si svuota
      if (st.conto.sq >= 0) {
        var nostro = st.conto.sq === me.sq, num = Math.ceil(st.conto.t), TOT = st.conto.T || M.CONTO_GEMME || 15, colC = nostro ? COL.blu : COL.rosso;
        var pop = 1 + Math.max(0, (st.conto.t % 1) - 0.75) * 1.6;
        P.contoNato = Math.max(0, (P.contoNato || 0) - dt * 2.5);
        var entra = 1 + 0.6 * P.contoNato * P.contoNato;
        if (!P.avvisoG) TXT(g, nostro ? T('vincete_tra') : T('perdete_tra'), cx, top + ph + 40 * k, 14 * k, '#ffffff', colC, false);   // sotto gli indicatori dei compagni al bordo
        P.contoPop = Math.max(0, (P.contoPop || 0) - dt * 3);
        TXT(g, String(num), cx, top + ph + 84 * k, 62 * k, '#ffffff', colC, true, null, (pop + 0.3 * P.contoPop) * (num <= 5 ? 1.18 : 1) * entra);
        var bwC = 150 * k, bhC = 8 * k, bxC = cx - bwC / 2, byC = top + ph + 122 * k;
        g.fillStyle = 'rgba(8,4,16,0.85)'; g.beginPath(); g.roundRect ? g.roundRect(bxC - 2, byC - 2, bwC + 4, bhC + 4, bhC) : g.rect(bxC - 2, byC - 2, bwC + 4, bhC + 4); g.fill();
        g.fillStyle = colC; g.fillRect(bxC, byC, bwC * Math.max(0, st.conto.t / TOT), bhC);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(bxC, byC, bwC * Math.max(0, st.conto.t / TOT), bhC * 0.4);
      }
      // GEMME 22/11: avviso del conto (sta vincendo / conto fermato) in una pillola sotto i contatori, al posto di «VINCETE TRA»:
      // prima il titolo, poi la frase di sotto. Piccolo e in alto: non copre mai l'eroe (né in verticale, né in orizzontale, né su PC)
      if (P.avvisoG) {
        var av = P.avvisoG; av.t += dt;
        if (av.t >= av.dur) P.avvisoG = null;
        else {
          var due = av.t > av.dur * 0.5, sAv = due ? av.b : av.a, pxA = (due ? 11 : 13) * k, yA = top + ph + 40 * k;
          var wA = Math.min(W - 24, sAv.length * pxA * 0.62 + 26 * k), hA = pxA * 1.9, inA = Math.min(1, av.t / 0.12), esA = av.t > av.dur - 0.2 ? (av.dur - av.t) / 0.2 : 1;
          g.globalAlpha = 0.9 * esA; g.fillStyle = 'rgba(8,4,16,0.88)'; g.beginPath(); g.roundRect ? g.roundRect(cx - wA / 2, yA - hA / 2, wA, hA, hA / 2) : g.rect(cx - wA / 2, yA - hA / 2, wA, hA); g.fill();
          g.strokeStyle = av.col; g.lineWidth = 1.5; g.stroke(); g.globalAlpha = esA;
          TXT(g, sAv, cx, yA, Math.min(pxA, (W - 50) / Math.max(6, sAv.length * 0.62)), '#ffffff', due ? null : av.col, false, null, 0.7 + 0.3 * inA);
          g.globalAlpha = 1;
        }
      }
    } else if (st.modo === 'duello') {
      var pw2 = Math.round(100 * k), gap2 = tw / 2 + 6 * k, nem = st.eroi[1], fd = ph - 10 * k;
      disegnaPannello(g, cx - gap2 - pw2, top, pw2, ph, '#3fb3ff', 10);
      disegnaPannello(g, cx + gap2, top, pw2, ph, '#ff4d5e', 10);
      disegnaPannello(g, cx - tw / 2, top + 4 * k, tw, ph - 8 * k, st.supp ? '#ffd23b' : '#ffffff', 9);
      g.drawImage(faccina(me.id, fd, COL.blu), cx - gap2 - pw2 + 4 * k, top + 3 * k, fd + 4, fd + 4);
      if (nem) g.drawImage(faccina(nem.id, fd, COL.rosso), cx + gap2 + pw2 - fd - 6 * k, top + 3 * k, fd + 4, fd + 4);
      for (var i = 0; i < 3; i++) {
        stella(g, cx - gap2 - 16 * k - i * 19 * k, top + ph / 2, 8 * k, i < st.punti[me.sq] ? COL.blu : '#3a2f52');
        stella(g, cx + gap2 + 16 * k + i * 19 * k, top + ph / 2, 8 * k, i < st.punti[1 - me.sq] ? COL.rosso : '#3a2f52');
      }
      TXT(g, tempoTxt, cx, top + ph / 2, 17 * k, tempoCol, tr <= 10 && !st.supp ? '#ff4d5e' : null, false, null, 1 + 0.3 * (P.tempoPop || 0));
    } else {
      var vivi = 0; for (var j = 0; j < st.eroi.length; j++) if (st.eroi[j].vivo) vivi++;
      var pw3 = Math.round(84 * k);
      disegnaPannello(g, cx - pw3 - 4 * k, top, pw3, ph, '#3bff8b', 10);
      disegnaPannello(g, cx + 4 * k, top + 4 * k, tw, ph - 8 * k, '#ffffff', 9);
      teschio(g, cx - pw3 + 14 * k, top + ph / 2, 10 * k);
      TXT(g, String(vivi), cx - pw3 * 0.38, top + ph / 2 - 6 * k, 22 * k, '#ffffff', null, true);
      TXT(g, T('vivi'), cx - pw3 * 0.38, top + ph / 2 + 12 * k, 9 * k, '#3bff8b');
      TXT(g, mmss(tr), cx + 4 * k + tw / 2, top + ph / 2, 17 * k, tempoCol, tr <= 10 ? '#ff4d5e' : null, false, null, 1 + 0.3 * (P.tempoPop || 0));
      // cubi di potenziamento (h.pot: +10% danni e vita ciascuno)
      var xc = cx + 12 * k + tw, pwc = Math.round(70 * k), pot = me.pot || 0;
      disegnaPannello(g, xc, top, pwc, ph, '#3bff8b', 10);
      cubo(g, xc + 18 * k, top + ph / 2, 10 * k);
      P.popCubo = Math.max(0, (P.popCubo || 0) - dt * 3);
      TXT(g, String(pot), xc + pwc * 0.62, top + ph / 2 - 5 * k, 22 * k, '#ffffff', P.popCubo > 0 ? '#3bff8b' : null, true, null, 1 + 0.4 * P.popCubo);
      TXT(g, '+' + pot * 10 + '%', xc + pwc * 0.62, top + ph / 2 + 12 * k, 9 * k, '#3bff8b');
      if (M.fuoriGas(st, me) && me.vivo) TXT(g, T('gas'), W / 2, top + ph + 34 * k, 26 * k, '#ffffff', colGas(st), true, null, 1 + 0.1 * Math.sin(D.tempo * 12));
    }
    // pausa: quadretto di vetro cromato
    var pz = UI.pausa;
    disegnaPannello(g, pz.x - 19, pz.y - 19, 36, 38, '#ff2bd6', 9);
    g.fillStyle = '#fff'; g.fillRect(pz.x - 6, pz.y - 8, 4.5, 16); g.fillRect(pz.x + 2.5, pz.y - 8, 4.5, 16);
    // cronaca dei KO: faccina di chi colpisce ✖ faccina di chi cade (in alto a destra)
    var adesso = performance.now(), fy = top + ph + (st.modo === 'gemme' && st.conto.sq >= 0 ? 136 : 16) * k + 12 * k, fdd = Math.round(24 * k);
    for (var f = 0; f < FEED.length; f++) {
      var fe = FEED[f];
      if (!fe.on) continue;
      var et = (adesso - fe.t) / 1000;
      if (et > 3.5) { fe.on = 0; continue; }
      var ent = Math.min(1, et / 0.18);
      g.globalAlpha = et > 3 ? (3.5 - et) * 2 : ent;
      var xr = W - SA.r - 10 + (1 - ent) * 40, wpill = fdd * 2 + 30 * k;
      g.fillStyle = 'rgba(10,5,20,0.72)'; g.beginPath(); if (g.roundRect) g.roundRect(xr - wpill, fy - fdd / 2 - 3, wpill, fdd + 6, (fdd + 6) / 2); else g.rect(xr - wpill, fy - fdd / 2 - 3, wpill, fdd + 6); g.fill();
      if (fe.ida) g.drawImage(faccina(fe.ida, fdd, fe.ca), xr - wpill + 2, fy - fdd / 2 - 2, fdd + 4, fdd + 4);
      else teschio(g, xr - wpill + 2 + fdd / 2 + 2, fy, fdd * 0.36);
      TXT(g, fe.serie ? '★' : '✖', xr - wpill / 2, fy, 12 * k, fe.serie ? '#ffd23b' : '#ffffff');
      if (fe.idb) g.drawImage(faccina(fe.idb, fdd, fe.cb), xr - fdd - 4, fy - fdd / 2 - 2, fdd + 4, fdd + 4);
      else if (fe.b) TXT(g, fe.b, xr - fdd / 2 - 2, fy, 10 * k, fe.cb, null, false, 'right');
      g.globalAlpha = 1;
      fy += fdd + 10;
    }
    // banner: il più recente al centro, i precedenti salgono e sbiadiscono (mai uno sopra l'altro)
    for (var b = 0; b < BANNER.length; b++) {
      var bn = BANNER[b];
      if (!bn.on) continue;
      bn.t += dt;
      if (bn.t > bn.dur) { bn.on = 0; continue; }
      var piuNuovi = 0;
      for (var b2 = 0; b2 < BANNER.length; b2++) if (b2 !== b && BANNER[b2].on && BANNER[b2].nato > bn.nato) piuNuovi++;
      if (piuNuovi > 1) { bn.on = 0; continue; }
      var p = bn.t / bn.dur, sc = p < 0.12 ? 0.5 + p / 0.12 * 0.7 : (p < 0.22 ? 1.2 - (p - 0.12) * 2 : 1);
      if (piuNuovi) sc *= 0.7;
      g.globalAlpha = (p > 0.8 ? (1 - p) / 0.2 : 1) * (piuNuovi ? 0.6 : 1);
      var by0 = bn.y0 || (H > W ? H * 0.22 : H * 0.3);
      bn.y += ((by0 - piuNuovi * 46 * k) - bn.y) * Math.min(1, dt * 14);
      // la scritta entra sempre nello schermo
      var px = Math.min(28 * k * bn.sc, (W - 40) / Math.max(4, bn.testo.length * 0.74));
      TXT(g, bn.testo, W / 2, bn.y, px, '#ffffff', bn.col, true, null, sc);
      if (bn.sub) TXT(g, bn.sub, W / 2, bn.y + px * 1.05, Math.min(15 * k, (W - 24) / Math.max(4, bn.sub.length * 0.66)), '#ffffff');
      g.globalAlpha = 1;
    }
    // rinascita
    if (!me.vivo && me.rt > 0 && !(window.SPETT && SPETT.attivo)) {   // SPETTATORE 23/11: guardando, il conto sta nella barra in alto
      disegnaPannello(g, W / 2 - 90 * k, H * 0.5 - 30 * k, 180 * k, 60 * k, '#ff4d5e', 12);
      TXT(g, T('rinasci'), W / 2, H * 0.5 - 12 * k, 12 * k, '#ffffff');
      TXT(g, String(Math.ceil(me.rt)), W / 2, H * 0.5 + 10 * k, 26 * k, '#ffffff', '#ff4d5e', true);
    }
    disegnaIndicatori(g, st, me, k, top + ph + 10 * k);   // [fable gioco] chi è fuori schermo + «TU» sul mio eroe
    // comandi
    if (!(window.SPETT && SPETT.senzaComandi)) disegnaComandi(g, st, me, k);   // SPETTATORE 23/11: eliminato o replay: niente levette
    disegnaConto(g, dt);
  }
  // [fable gioco 17/11] indicatori al bordo: compagni, nemici VISIBILI e miniera delle gemme quando sono fuori schermo
  // (in verticale la vista non copre tutta l'arena). Faccina + punta verso di loro + gemme in tasca. Niente per chi è nascosto.
  function disegnaIndicatori(g, st, me, k, yAlto) {
    if (!D.eroiV || !D.eroiV[0] || P.intro > 0) return;
    var v0 = D.eroiV[0], ox = D.px2(v0.x, v0.y), oy = D.py2() - 14 * k, m = 20 * k, x0 = m, x1 = W - m, y0 = yAlto + m * 0.4, y1 = H - m - SA.b;
    function punta(tx, ty, disegna) {
      if (tx >= x0 - m && tx <= x1 + m && ty >= y0 - m && ty <= y1 + m) return false;
      var dx = tx - ox, dy = ty - oy, f = 1e9;
      if (dx > 0) f = Math.min(f, (x1 - ox) / dx); else if (dx < 0) f = Math.min(f, (x0 - ox) / dx);
      if (dy > 0) f = Math.min(f, (y1 - oy) / dy); else if (dy < 0) f = Math.min(f, (y0 - oy) / dy);
      if (!(f > 0) || f > 1) return false;
      disegna(ox + dx * f, oy + dy * f, Math.atan2(dy, dx), Math.sqrt(dx * dx + dy * dy));
      return true;
    }
    function freccia(x, y, a, r, col) {
      g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(r + 9 * k, 0); g.lineTo(r + 1 * k, -6 * k); g.lineTo(r + 1 * k, 6 * k); g.closePath();
      g.fillStyle = col; g.fill(); g.lineWidth = 1.5 * k; g.strokeStyle = '#170d26'; g.stroke(); g.restore();
    }
    for (var i = 1; i < st.eroi.length; i++) {
      var h = st.eroi[i], v = D.eroiV[i];
      if (!h.vivo || !v) continue;
      var amico = h.sq === me.sq;
      if (!amico && !M.visibile(st, h, me.sq)) continue;
      var tx = D.px2(v.x, v.y), ty = D.py2() - 14 * k;
      (function (h, amico) {
        punta(tx, ty, function (x, y, a, dist) {
          var col = amico ? COL.blu : COL.rosso, d = Math.round((amico ? 24 : 27) * k), fc = faccina(h.id, d, col);
          g.globalAlpha = amico ? 0.85 : 1;
          freccia(x, y, a, d / 2, col);
          g.drawImage(fc, x - d / 2 - 2, y - d / 2 - 2, d + 4, d + 4);
          if (h.gem > 0) { var gs = 13 * k; g.drawImage(D.spr.gemma, x + d * 0.18, y + d * 0.12, gs, gs); TXT(g, String(h.gem), x + d * 0.18 + gs * 1.1, y + d * 0.12 + gs / 2, 10 * k, '#ffffff'); }
          g.globalAlpha = 1;
        });
      })(h, amico);
    }
    if (st.modo === 'gemme' && st.M.gem && me.vivo) {
      var gx = D.px2(st.M.gem.x, st.M.gem.y), gy = D.py2();
      punta(gx, gy, function (x, y, a) { var gs = 22 * k; g.globalAlpha = 0.9; freccia(x, y, a, gs / 2, '#c76bff'); g.drawImage(D.spr.gemma, x - gs / 2, y - gs / 2, gs, gs); g.globalAlpha = 1; });
    }
    // «TU» sopra il mio eroe: all'inizio e a ogni rinascita (il mio eroe si trova subito)
    if (me.vivo && !AUTO) {
      var eta = (st.t - me.tSpawn) / 30, durTu = me.tSpawn === 0 ? 4.5 : 2.2;
      if (eta < durTu) {
        var al = eta > durTu - 0.4 ? (durTu - eta) / 0.4 : 1, sal = Math.abs(Math.sin(D.tempo * 5.5)) * 7 * k, X = D.px2(v0.x, v0.y), Y = D.py2() - 74 * k - sal;
        g.globalAlpha = al;
        g.beginPath(); g.moveTo(X, Y + 16 * k); g.lineTo(X - 10 * k, Y + 3 * k); g.lineTo(X + 10 * k, Y + 3 * k); g.closePath();
        g.fillStyle = COL.io; g.fill(); g.lineWidth = 2 * k; g.strokeStyle = '#170d26'; g.stroke();
        TXT(g, T('tu').toUpperCase(), X, Y - 8 * k, 15 * k, '#ffffff', COL.io, true);
        g.globalAlpha = 1;
      }
    }
  }
  function stella(g, x, y, r, col) {
    g.fillStyle = col; g.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill(); g.strokeStyle = '#12081f'; g.lineWidth = 2; g.stroke();
  }
  function cubo(g, x, y, r) {   // cubetto verde in prospettiva
    var h = r * 0.58;
    g.lineJoin = 'round'; g.strokeStyle = '#0b2a14'; g.lineWidth = 2;
    g.fillStyle = '#7dffa8'; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y - r + h); g.lineTo(x, y - r + h * 2); g.lineTo(x - r, y - r + h); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#2fd46a'; g.beginPath(); g.moveTo(x - r, y - r + h); g.lineTo(x, y - r + h * 2); g.lineTo(x, y + r); g.lineTo(x - r, y + r - h); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#1b9a4a'; g.beginPath(); g.moveTo(x + r, y - r + h); g.lineTo(x, y - r + h * 2); g.lineTo(x, y + r); g.lineTo(x + r, y + r - h); g.closePath(); g.fill(); g.stroke();
  }
  function teschio(g, x, y, r) {
    g.fillStyle = '#f4ecff'; g.beginPath(); g.arc(x, y - r * 0.15, r, Math.PI * 0.85, Math.PI * 2.15); g.lineTo(x + r * 0.5, y + r * 0.95); g.lineTo(x - r * 0.5, y + r * 0.95); g.closePath(); g.fill();
    g.fillStyle = '#12081f'; g.beginPath(); g.arc(x - r * 0.4, y - r * 0.05, r * 0.26, 0, 6.283); g.arc(x + r * 0.4, y - r * 0.05, r * 0.26, 0, 6.283); g.fill();
  }
  function disegnaComandi(g, st, me, k) {
    if (AUTO) return;
    IDme = me.id;
    var R = UI.R;
    if (!IN.desktop) {
      // levetta del movimento (giro 6): base di vetro con 4 frecce, arco luminoso nella direzione, pomello lucido
      var on = IN.mov.id >= 0, mx = on ? IN.mov.bx : UI.mov.x, my = on ? IN.mov.by : UI.mov.y;
      var kx = on ? IN.mov.x : mx, ky = on ? IN.mov.y : my, ddx = kx - mx, ddy = ky - my, dd = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dd > R) { kx = mx + ddx / dd * R; ky = my + ddy / dd * R; }
      levetta(g, mx, my, kx, ky, R, '#1ad7ff', on, dd / R, 'mov');
      // levetta di attacco: stessa base, pomello arancio col mirino, tacche delle munizioni attorno
      var aSup = IN.mira.id >= 0 && IN.mira.sup, aAtt = IN.mira.id >= 0 && !IN.mira.sup;
      var ax = aAtt ? IN.mira.bx : UI.att.x, ay = aAtt ? IN.mira.by : UI.att.y, akx = ax, aky = ay, al = 0;
      if (aAtt) { var v = vettoreMira(); akx = ax + v.x * R; aky = ay + v.y * R; al = v.l; }
      levetta(g, ax, ay, akx, aky, R, me.ammo >= 1 ? '#ff9f1c' : '#7a4a18', aAtt, al, 'att');
      tacche(g, UI.att.x, UI.att.y, R + 9, me.ammo, 3, '#ffb04a');
      if (aSup === true) { var vs = vettoreMira(); disegnaTastoSuper(g, me, k, UI.sup.x + vs.x * R * 0.6, UI.sup.y + vs.y * R * 0.6, true); }
      else disegnaTastoSuper(g, me, k, UI.sup.x, UI.sup.y, false);
      if (aSup === 'gad') { var vg = vettoreMira(); disegnaTastoGadget(g, me, UI.gad.x + vg.x * R * 0.5, UI.gad.y + vg.y * R * 0.5); }
      else disegnaTastoGadget(g, me, UI.gad.x, UI.gad.y);
    } else {
      var pad = IN.tipo === 'pad';
      disegnaTastoSuper(g, me, k, W - SA.r - 60, H - SA.b - 64, false);
      disegnaTastoGadget(g, me, W - SA.r - 134, H - SA.b - 50);
      TXT(g, pad ? 'LB' : 'Q', W - SA.r - 134, H - SA.b - 16, 12, '#ffffff');
      TXT(g, pad ? 'Y' : 'E', W - SA.r - 60, H - SA.b - 18, 12, '#ffffff');
    }
  }
  // ---------------- tasti del giro 6 ----------------
  // base delle levette, cotta una volta: disco di vetro scuro, anello cromato sottile, 4 frecce (movimento) o mirino (attacco)
  function baseLevetta(R, col, tipo) {
    var k = 'lv|' + Math.round(R) + '|' + col + '|' + tipo + '|' + DPR, c = CUOCO[k];
    if (c) return c;
    var m = 10; c = mk(R * 2 + m * 2, R * 2 + m * 2);
    var q = c.getContext('2d'), cx = R + m;
    var gr = q.createRadialGradient(cx, cx, R * 0.2, cx, cx, R);
    gr.addColorStop(0, 'rgba(20,10,40,0.35)'); gr.addColorStop(0.75, 'rgba(14,7,30,0.55)'); gr.addColorStop(1, 'rgba(8,4,18,0.75)');
    q.beginPath(); q.arc(cx, cx, R, 0, 6.283); q.fillStyle = gr; q.fill();
    q.lineWidth = 2.5; q.strokeStyle = 'rgba(255,255,255,0.55)'; q.beginPath(); q.arc(cx, cx, R - 1.5, 0, 6.283); q.stroke();
    q.lineWidth = 1.5; q.strokeStyle = col; q.globalAlpha = 0.5; q.beginPath(); q.arc(cx, cx, R - 6, 0, 6.283); q.stroke(); q.globalAlpha = 1;
    q.fillStyle = 'rgba(255,255,255,0.5)';
    if (tipo === 'mov') for (var i = 0; i < 4; i++) { q.save(); q.translate(cx, cx); q.rotate(i * Math.PI / 2); q.beginPath(); q.moveTo(0, -R + 9); q.lineTo(7, -R + 17); q.lineTo(-7, -R + 17); q.closePath(); q.fill(); q.restore(); }
    else { q.strokeStyle = 'rgba(255,255,255,0.35)'; q.lineWidth = 2; for (var j = 0; j < 4; j++) { var a = j * Math.PI / 2; q.beginPath(); q.moveTo(cx + Math.cos(a) * (R - 16), cx + Math.sin(a) * (R - 16)); q.lineTo(cx + Math.cos(a) * (R - 8), cx + Math.sin(a) * (R - 8)); q.stroke(); } }
    c._m = m; CUOCO[k] = c; CUOCOn++;
    return c;
  }
  function levetta(g, bx, by, kx, ky, R, col, on, forza, tipo) {
    var c = baseLevetta(R, col, tipo);
    g.globalAlpha = on ? 1 : 0.62; g.drawImage(c, bx - R - c._m, by - R - c._m, c._w, c._h);
    if (on && forza > 0.12) {   // arco luminoso dalla parte in cui si spinge
      var a = Math.atan2(ky - by, kx - bx);
      g.save(); g.shadowColor = col; g.shadowBlur = 12; g.strokeStyle = col; g.lineWidth = 5; g.lineCap = 'round'; g.globalAlpha = 0.5 + 0.5 * Math.min(1, forza);
      g.beginPath(); g.arc(bx, by, R - 2, a - 0.55, a + 0.55); g.stroke(); g.restore();
    }
    g.globalAlpha = on ? 1 : 0.8;
    disegnaTondo(g, kx, ky, R * 0.46, col, true, '', on ? 1 : 0.85);
    if (tipo === 'att') { var icA = icoAb(IDme, 'attacco'); if (icA) { var dA = R * 0.84; g.drawImage(icA, kx - dA / 2, ky - dA / 2, dA, dA); } else { g.strokeStyle = 'rgba(58,20,0,0.75)'; g.lineWidth = 2.2; g.beginPath(); g.arc(kx, ky, R * 0.17, 0, 6.283); g.moveTo(kx - R * 0.3, ky); g.lineTo(kx - R * 0.08, ky); g.moveTo(kx + R * 0.08, ky); g.lineTo(kx + R * 0.3, ky); g.moveTo(kx, ky - R * 0.3); g.lineTo(kx, ky - R * 0.08); g.moveTo(kx, ky + R * 0.08); g.lineTo(kx, ky + R * 0.3); g.stroke(); } }
    g.globalAlpha = 1;
  }
  // tacche ad arco attorno a un tasto (munizioni): piene = accese, quella che si ricarica cresce
  function tacche(g, x, y, r, val, n, col) {
    var ar = 1.62 / n, a0 = -Math.PI / 2 - 0.81 - 0.0;
    g.lineCap = 'round';
    for (var a = 0; a < n; a++) {
      var pf = Math.min(1, Math.max(0, val - a)), s = a0 + a * ar + 0.05, e2 = s + ar - 0.1;
      g.strokeStyle = 'rgba(8,4,18,0.8)'; g.lineWidth = 8; g.beginPath(); g.arc(x, y, r, s, e2); g.stroke();
      if (pf > 0) { g.strokeStyle = pf >= 1 ? col : 'rgba(255,176,74,0.55)'; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r, s, s + (e2 - s) * pf); g.stroke(); }
    }
    g.lineCap = 'butt';
  }
  // tasto della super: si riempie come un liquido d'oro con l'onda; pronta = raggi che girano, riflesso che passa, battito
  // 17/11 icone delle abilita' per eroe: ui/icone/abilita/<eroe>_<attacco|super|gadget>.webp. L'elenco dei file che esistono sta in
  // ui/icone/abilita/elenco.json (cosi' non partono richieste a vuoto); se un'icona non c'e' resta il tasto disegnato dal codice.
  var ICO_AB = {}, ICO_AB_ELENCO = null, IDme = '';
  try { fetch('ui/icone/abilita/elenco.json').then(function (r) { return r.ok ? r.json() : []; }).then(function (l) { ICO_AB_ELENCO = l || []; }).catch(function () { ICO_AB_ELENCO = []; }); } catch (e0) { ICO_AB_ELENCO = []; }
  function icoAb(id, tipo) {
    var k = id + '_' + tipo, r = ICO_AB[k];
    if (!id || !ICO_AB_ELENCO || ICO_AB_ELENCO.indexOf(k) < 0) return null;
    if (r === undefined) { r = ICO_AB[k] = { im: null }; var im = new Image(); im.onload = function () { r.im = im; }; im.src = 'ui/icone/abilita/' + k + '.webp'; }
    return r.im;
  }
  function disegnaTastoSuper(g, me, k, x, y, attivo) {
    var r = UI.sup.r, pronta = me.sup >= 1, dv = P.superVuoto, T0 = D.tempo;
    if (dv > 0) { x += Math.sin(T0 * 70) * 4 * dv / 0.3; P.superVuoto = Math.max(0, dv - 1 / 60); }
    if (pronta) {
      g.save(); g.translate(x, y); g.rotate(T0 * 0.9); g.globalAlpha = 0.55 + 0.2 * Math.sin(T0 * 6);
      g.fillStyle = '#ffd23b';
      for (var i = 0; i < 10; i++) { g.rotate(Math.PI / 5); g.beginPath(); g.moveTo(-4, r * 0.9); g.lineTo(4, r * 0.9); g.lineTo(0, r * 1.55); g.closePath(); g.fill(); }
      g.restore(); g.globalAlpha = 1;
    }
    var pul = pronta ? 1 + 0.06 * Math.sin(T0 * 9) : 1, rr = r * pul;
    disegnaTondo(g, x, y, rr, '#ffd23b', false, '', 1);
    // liquido
    var liv = Math.max(0, Math.min(1, P.supVis === undefined ? me.sup : (P.supVis += (me.sup - P.supVis) * 0.18))) ;
    if (P.supVis === undefined) P.supVis = me.sup;
    if (liv > 0.005) {
      g.save(); g.beginPath(); g.arc(x, y, rr - 3.5, 0, 6.283); g.clip();
      var top = y + rr - liv * (rr * 2), onda = pronta ? 0 : 3;
      var gr = g.createLinearGradient(0, top, 0, y + rr); gr.addColorStop(0, '#fff2a8'); gr.addColorStop(0.3, '#ffd23b'); gr.addColorStop(1, '#ff8a00');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - rr, y + rr);
      for (var s = 0; s <= 12; s++) { var xx = x - rr + s * rr / 6; g.lineTo(xx, top + Math.sin(T0 * 5 + s * 0.9) * onda); }
      g.lineTo(x + rr, y + rr); g.closePath(); g.fill();
      if (pronta) { var sw = ((T0 * 0.8) % 1.6) - 0.3; g.globalAlpha = 0.55; g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x - rr + sw * rr * 2, y - rr); g.lineTo(x - rr + sw * rr * 2 + 10, y - rr); g.lineTo(x - rr + sw * rr * 2 - 8, y + rr); g.lineTo(x - rr + sw * rr * 2 - 18, y + rr); g.closePath(); g.fill(); g.globalAlpha = 1; }
      g.restore();
    }
    g.lineWidth = 3; g.strokeStyle = pronta ? '#ffffff' : 'rgba(255,210,59,0.85)'; g.beginPath(); g.arc(x, y, rr - 1.5, 0, 6.283); g.stroke();
    if (P.anelloLampo > 0 && !pronta) { g.globalAlpha = P.anelloLampo; g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r * (1 + 0.25 * (1 - P.anelloLampo)), 0, 6.283); g.stroke(); g.globalAlpha = 1; P.anelloLampo = Math.max(0, P.anelloLampo - 1 / 25); }
    if (pronta && P.superBtnPulse > 0) { g.globalAlpha = P.superBtnPulse; g.strokeStyle = '#ffd23b'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r * (1 + (1 - P.superBtnPulse) * 0.9), 0, 6.283); g.stroke(); g.globalAlpha = 1; P.superBtnPulse = Math.max(0, P.superBtnPulse - 1 / 50); if (P.superBtnPulse === 0 && pronta) P.superBtnPulse = 0.999; }
    // icona: teschio-fulmine
    var icS = icoAb(me.id, 'super');
    if (icS) { var dS = rr * 1.5; g.drawImage(icS, x - dS / 2, y - dS / 2, dS, dS); }
    else {
      g.fillStyle = pronta || liv > 0.55 ? '#3a1d00' : '#ffd23b'; g.strokeStyle = '#12081f'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x + 4, y - 15); g.lineTo(x - 8, y + 2); g.lineTo(x - 1, y + 2); g.lineTo(x - 5, y + 15); g.lineTo(x + 8, y - 3); g.lineTo(x + 1, y - 3); g.closePath(); g.stroke(); g.fill();
    }
    if (!pronta) TXT(g, Math.floor(me.sup * 100) + '%', x, y + rr + 10, 10, '#ffd23b');
    else TXT(g, 'SUPER', x, y + rr + 11, 11, '#ffffff', '#ffd23b', true);
  }
  // tasto del gadget: pieno e verde quando c'è, spicchio che si ricarica, pallini degli usi
  function disegnaTastoGadget(g, me, x, y) {
    var r = UI.gad.r, ok = me.gadUsi > 0 && me.gadCd <= 0;
    if (P.gadVuoto > 0) { x += Math.sin(D.tempo * 70) * 4 * P.gadVuoto / 0.3; P.gadVuoto = Math.max(0, P.gadVuoto - 1 / 60); }
    if (ok) { g.save(); g.globalAlpha = 0.35 + 0.15 * Math.sin(D.tempo * 5); g.shadowColor = '#3bff8b'; g.shadowBlur = 16; g.fillStyle = '#3bff8b'; g.beginPath(); g.arc(x, y, r + 2, 0, 6.283); g.fill(); g.restore(); }
    disegnaTondo(g, x, y, r, '#3bff8b', ok, '', me.gadUsi > 0 ? 1 : 0.5);
    if (me.gadCd > 0 && me.gadUsi > 0) { g.fillStyle = 'rgba(92,255,138,0.45)'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + 6.283 * (1 - me.gadCd / 4)); g.closePath(); g.fill(); }
    var icG = icoAb(me.id, 'gadget');
    if (icG) { var dG = r * 1.5; g.globalAlpha = me.gadUsi > 0 ? 1 : 0.55; g.drawImage(icG, x - dG / 2, y - dG / 2, dG, dG); g.globalAlpha = 1; }
    else {
      g.strokeStyle = ok ? '#0b3a1d' : '#5cff8a'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r * 0.36, 0, 6.283); g.stroke();
      for (var i = 0; i < 6; i++) { var a = i * 1.047 + D.tempo * (ok ? 0.6 : 0); g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.36, y + Math.sin(a) * r * 0.36); g.lineTo(x + Math.cos(a) * r * 0.58, y + Math.sin(a) * r * 0.58); g.stroke(); }
    }
    for (var u = 0; u < 3; u++) { g.fillStyle = u < me.gadUsi ? '#5cff8a' : '#3a2f52'; g.strokeStyle = '#12081f'; g.lineWidth = 1.5; g.beginPath(); g.arc(x - 9 + u * 9, y + r + 8, 3.6, 0, 6.283); g.fill(); g.stroke(); }
  }

  // ---------------- fine partita ----------------
  function punteggio(h, st) { return h.dan / 100 + h.ko * 12 + h.gemTot * 6 + h.cure / 120 - h.morti * 3; }
  function chiudiPartita() {
    var st = P.st, f = st.fine, me = st.eroi[0], esito, col, vinto;
    if (st.modo === 'sopravvivenza') {
      var pos = st.ordine.length - st.ordine.lastIndexOf(me.sq);
      if (st.ordine.indexOf(me.sq) < 0) pos = 1;
      esito = pos === 1 ? T('vittoria') : (LANG === 'en' ? pos + (pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th') + T('posto') : pos + T('posto'));
      col = pos === 1 ? COL.oro : (pos <= 3 ? COL.blu : COL.rosso); vinto = pos === 1;
    } else {
      esito = f.vinc < 0 ? T('pareggio') : (f.vinc === me.sq ? T('vittoria') : T('sconfitta'));
      col = f.vinc < 0 ? '#ffffff' : (f.vinc === me.sq ? COL.oro : COL.rosso); vinto = f.vinc === me.sq;
    }
    var sf = $('s-fine');
    sf.style.setProperty('--kf', col);
    $('f-esito').textContent = esito;
    $('f-motivo').textContent = T('mot_' + f.motivo);
    // MVP: il migliore della squadra vincente
    var cand = st.eroi.filter(function (h) { return f.vinc < 0 || h.sq === f.vinc; });
    if (!cand.length) cand = st.eroi;
    var mvp = cand.slice().sort(function (a, b) { return punteggio(b, st) - punteggio(a, st); })[0];
    vetrina($('f-vetrina'), mvp.id, true);
    // 17/11: niente striscia «vittoria» del modello 3D (ritratti/*_vittoria): l'MVP entra con la sua clip Seedance o l'arte 2D
    if (S.mvp) S.mvp(mvp.i === 0);
    $('f-mvp-nome').textContent = (mvp.i === 0 ? T('tu') + ' · ' : '') + nome(mvp.id);
    $('f-mvp-dati').textContent = mvp.ko + ' KO · ' + Math.round(mvp.dan) + ' ' + T('danni').toLowerCase() + (st.modo === 'gemme' ? ' · ' + mvp.gemTot + ' ' + T('gemme').toLowerCase() : '');
    // le squadre: una riga per squadra (in sopravvivenza tutti in fila per arrivo)
    var box = $('f-squadre'); box.innerHTML = '';
    var file = st.modo === 'sopravvivenza' ? [st.eroi.slice()] : [st.eroi.filter(function (h) { return h.sq === me.sq; }), st.eroi.filter(function (h) { return h.sq !== me.sq; })];
    var nn = 0;
    file.forEach(function (fila, fi) {
      var r = document.createElement('div'); r.className = 'fs-riga';
      fila.sort(function (a, b) { return punteggio(b, st) - punteggio(a, st); }).forEach(function (h) {
        var c = document.createElement('div'); c.className = 'fs-g' + (h.i === 0 ? ' io' : '');
        c.style.setProperty('--kh', info(h.id).colore); c.style.setProperty('--ks', st.modo === 'sopravvivenza' ? (h.i === 0 ? COL.blu : COL.rosso) : (fi === 0 ? COL.blu : COL.rosso));
        c.style.animationDelay = (0.25 + nn++ * 0.05) + 's';
        var im = document.createElement('img'); im.alt = ''; asset(h.id).pronto.then(function (a) { im.src = a.busto; });
        var tx = document.createElement('div');
        tx.innerHTML = (h.i === 0 ? T('tu') : nomeCorto(h.id)) + '<em>' + h.ko + ' KO · ' + (Math.round(h.dan / 100) / 10) + 'k' + (st.modo === 'gemme' ? ' · ' + h.gemTot + '◆' : '') + '</em>';
        c.appendChild(im); c.appendChild(tx);
        if (h === mvp) { var s = document.createElement('span'); s.className = 'fs-mvp'; s.textContent = '★'; c.appendChild(s); }
        r.appendChild(c);
      });
      box.appendChild(r);
    });
    S.fine(vinto, st.modo !== 'sopravvivenza' && f.vinc < 0);
    // trofei e punti esperienza della partita
    var dT = st.modo === 'sopravvivenza' ? [10, 7, 4, 1, -2, -4][Math.min(5, (typeof pos === 'number' ? pos : 6) - 1)] : (f.vinc < 0 ? 0 : vinto ? 8 : -4);
    var t0 = trofeiDi(me.id); dT = Math.max(-t0, dT);
    var dX = 20 + (vinto ? 10 : 0) + me.ko * 2 + (me.gemTot || 0), dF = (vinto ? 20 : (f.vinc < 0 ? 12 : 8)) + me.ko * 2;
    var NOPROG = AUTO || !!P.rep;   // SPETTATORE 23/11: guardare un replay o una diretta non dà trofei, fiche né esperienza
    if (!NOPROG) PROG.fiche = (PROG.fiche || 0) + dF;
    $('f-xp-t').dataset.fiche = '+' + dF;
    var livPrima = PROG.liv, xpPrima = PROG.xp;
    if (!NOPROG) { PROG.trofei[me.id] = t0 + dT; PROG.xp += dX; while (PROG.xp >= xpServe(PROG.liv)) { PROG.xp -= xpServe(PROG.liv); PROG.liv++; } salvaProg(); }
    premi_(dT, t0 + dT, livPrima, xpPrima, dX, me.id);
    B.fase = 'fine'; B.partite++; B.esiti.push({ modo: st.modo, eroe: me.id, esito: esito, motivo: f.motivo, t: +(st.t / 30).toFixed(1) });
    var dopo = function () { mostra('s-fine'); S.musicaFile(vinto ? 'vittoria' : null); };
    if (AUTO) dopo(); else sipario(dopo, 1);
    if (AUTO) setTimeout(function () { if (B.fase === 'fine') { APP.eroe = POOL[Math.floor(Math.random() * POOL.length)]; if (Q.get('modo') === 'tutti') APP.modo = ['gemme', 'duello', 'sopravvivenza'][B.partite % 3]; preparaPartita(); } }, 1500);
  }
  // conta dei trofei e barra dell'esperienza che si riempie (con «LIVELLO SU!»)
  function premi_(dT, tNuovi, livPrima, xpPrima, dX, id) {
    var bT = $('f-trofei'), bX = $('f-xp'), st0 = performance.now();
    bT.classList.toggle('meno', dT < 0);
    $('f-trofei-eroe').textContent = nomeCorto(id) + ' ' + tNuovi;
    $('f-liv').textContent = livPrima; $('f-liv').classList.remove('liv-su');
    bX.style.transition = 'none'; bX.style.width = Math.min(100, xpPrima / xpServe(livPrima) * 100) + '%';
    $('f-xp-t').textContent = '+' + dX + ' XP · ' + ($('f-xp-t').dataset.fiche || '') + ' ' + T('fiche');
    var liv = livPrima, xp = xpPrima, resto = dX;
    function passo() {
      var p = Math.min(1, (performance.now() - st0 - 500) / 700);
      if (p >= 0) bT.textContent = (dT >= 0 ? '+' : '') + Math.round(dT * Math.max(0, p));
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
    setTimeout(function riempi() {
      bX.style.transition = '';
      var serve = xpServe(liv), qui = Math.min(resto, serve - xp);
      xp += qui; resto -= qui;
      bX.style.width = Math.min(100, xp / serve * 100) + '%';
      if (xp >= serve) setTimeout(function () {
        liv++; xp = 0; $('f-liv').textContent = liv; $('f-liv').classList.remove('liv-su'); void $('f-liv').offsetWidth; $('f-liv').classList.add('liv-su');
        S.livello(); bX.style.transition = 'none'; bX.style.width = '0%'; void bX.offsetWidth;
        $('f-xp-t').textContent = T('liv_su');
        if (resto > 0) setTimeout(riempi, 120);
      }, 950);
    }, 900);
    if (dT > 0) setTimeout(function () { S.trofei(); }, 600);
  }
  tasto('f-ancora', function () { preparaPartita(); }, 60);
  tasto('f-eroe', function () { P = null; B.fase = 'menu'; vai('s-eroi', 1); });
  tasto('f-home', function () { P = null; B.fase = 'menu'; vai('s-home', -1); });

  // ---------------- prova di carico (?stress=1): 150 colpi + 300 particelle sempre in aria ----------------
  function stress(st) {
    var vivi = 0, i;
    for (i = 0; i < st.pr.length; i++) if (st.pr[i].vivo) vivi++;
    for (i = 0; i < st.pr.length && vivi < 150; i++) {
      var p = st.pr[i];
      if (p.vivo) continue;
      var a = Math.random() * 6.283, h = st.eroi[(Math.random() * st.eroi.length) | 0];
      p.vivo = 1; p.k = 0; p.ow = h.i; p.sq = h.sq; p.eroe = h.id; p.x = p.ox = h.x; p.y = p.oy = h.y; p.vx = Math.cos(a) * 12; p.vy = Math.sin(a) * 12; p.ang = a;
      p.rest = 30; p.r = 0.15; p.dan = 0; p.pierce = 1; p.rimb = 50; p.mask = -1; p.fl = 0; p.sti = ['proiettile', 'carta', 'bilia', 'nota', 'shuriken'][i % 5]; p.t = 0; p.slF = 0; p.stun = 0; p.spin = 0; p.vamp = 0; p.rompe = 0;
      vivi++;
    }
    var np = 0;
    for (i = 0; i < D.pa.length; i++) if (D.pa[i].on) np++;
    while (np < 300) { var x = st.eroi[0].x + (Math.random() - 0.5) * 10, y = st.eroi[0].y + (Math.random() - 0.5) * 14; D.fiches(x, y, 4, 1); D.scintille(x, y, Math.random() * 6, 4, '#ffd23f', 6); np += 8; }
  }

  // ---------------- menu con tastiera e gamepad: fuoco che si sposta nella direzione, A/Invio conferma, B/Esc indietro ----------------
  var NAV = {
    el: null,
    box: function () { return FOGLIO ? $(FOGLIO) : (APP.schermo ? $(APP.schermo) : null); },
    lista: function () {
      var b = NAV.box(); if (!b) return [];
      return Array.prototype.filter.call(b.querySelectorAll('[data-nav]'), function (e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < H; });
    },
    metti: function (e) { if (NAV.el) NAV.el.classList.remove('fuoco'); NAV.el = e; if (e) { e.classList.add('fuoco'); if (e.scrollIntoView) try { e.scrollIntoView({ block: 'nearest' }); } catch (er) { } } },
    primo: function () {
      var l = NAV.lista(); if (!l.length) { NAV.metti(null); return; }
      NAV.metti(l.filter(function (e) { return e.classList.contains('sel'); })[0] || l.filter(function (e) { return e.classList.contains('gioca'); })[0] || l[0]);
    },
    reset: function () { if (NAV.el) NAV.el.classList.remove('fuoco'); NAV.el = null; if (document.body.classList.contains('tasti')) setTimeout(NAV.primo, 40); },
    muovi: function (dx, dy) {
      document.body.classList.add('tasti');
      var l = NAV.lista(); if (!l.length) return;
      if (!NAV.el || l.indexOf(NAV.el) < 0) { NAV.primo(); return; }
      var r0 = NAV.el.getBoundingClientRect(), x0 = r0.left + r0.width / 2, y0 = r0.top + r0.height / 2, best = null, bs = 1e9;
      l.forEach(function (e) {
        if (e === NAV.el) return;
        var r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, ax = x - x0, ay = y - y0;
        var lungo = ax * dx + ay * dy, largo = Math.abs(ax * dy - ay * dx);
        if (lungo < 6) return;
        var s = lungo + largo * 2.2;
        if (s < bs) { bs = s; best = e; }
      });
      if (best) { NAV.metti(best); S.passa(); }
    },
    attiva: function () { document.body.classList.add('tasti'); if (!NAV.el) { NAV.primo(); if (APP.schermo !== 's-titolo') return; } if (APP.schermo === 's-titolo' && !FOGLIO) { $('s-titolo').onclick(); return; } if (NAV.el) NAV.el.click(); },
    indietro: function () {
      if (FOGLIO === 'pausa') { pausa(false); return; }
      if (FOGLIO) { S.indietro(); foglio(FOGLIO, false); return; }
      var sc = APP.schermo && $(APP.schermo), dove = sc && sc.dataset.indietro;
      if (APP.schermo === 's-carica') { $('s-carica').onclick(); return; }
      if (dove) { S.indietro(); if (APP.schermo === 's-fine') { P = null; B.fase = 'menu'; } vai(dove, -1); }
    }
  };
  function nelMenu() { return !!FOGLIO || !(P && (B.fase === 'partita' || B.fase === 'finale')); }
  window.addEventListener('keydown', function (e) {
    if (!nelMenu()) return;
    var k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') NAV.muovi(-1, 0);
    else if (k === 'arrowright' || k === 'd') NAV.muovi(1, 0);
    else if (k === 'arrowup' || k === 'w') NAV.muovi(0, -1);
    else if (k === 'arrowdown' || k === 's') NAV.muovi(0, 1);
    else if (k === 'enter' || k === ' ') NAV.attiva();
    else if ((k === 'escape' || k === 'backspace') && FOGLIO !== 'pausa') NAV.indietro();
    else return;
    e.preventDefault();
  });
  window.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button === 0) { document.body.classList.remove('tasti'); if (NAV.el) NAV.el.classList.remove('fuoco'); NAV.el = null; } IN.tipo = e.pointerType === 'mouse' ? 'mouse' : 'tocco'; }, true);
  window.addEventListener('resize', palco);
  // ogni tasto si schiaccia sotto il dito e rimbalza quando lo lasci (giro 8)
  var PREMUTO = null;
  window.addEventListener('pointerdown', function (e) { var b = e.target.closest && e.target.closest('button'); if (!b || b.id === 'h-eroe' || !nelMenu()) return; PREMUTO = b; b.classList.remove('rimbalza'); b.classList.add('giu'); }, true);
  window.addEventListener('pointerup', function () { var b = PREMUTO; PREMUTO = null; if (!b) return; b.classList.remove('giu'); void b.offsetWidth; b.classList.add('rimbalza'); setTimeout(function () { b.classList.remove('rimbalza'); }, 340); }, true);
  window.addEventListener('pointercancel', function () { if (PREMUTO) PREMUTO.classList.remove('giu'); PREMUTO = null; }, true);

  // ---------------- gamepad: menu e partita ----------------
  IN.pad = { on: false, mx: 0, my: 0, rx: 0, ry: 0, rl: 0, fuoco: false, supT: false };
  var PAD = { prec: [], rip: 0, dir: '' };
  function zona(x, y, dz) { var l = Math.hypot(x, y); if (l < dz) return [0, 0, 0]; var s = Math.min(1, (l - dz) / (1 - dz)) / l; return [x * s, y * s, Math.min(1, (l - dz) / (1 - dz))]; }
  function vettorePad(sup) { var p = IN.pad; return p.rl > 0.25 ? { x: p.rx, y: p.ry } : { x: 0, y: 0 }; }
  function leggiPad(dt) {
    var gs = navigator.getGamepads ? navigator.getGamepads() : null, gp = null;
    if (gs) for (var i = 0; i < gs.length; i++) if (gs[i] && gs[i].connected) { gp = gs[i]; break; }
    if (!gp) { IN.pad.on = false; return; }
    var bt = gp.buttons, ax = gp.axes, pr = function (n) { return !!(bt[n] && (bt[n].pressed || bt[n].value > 0.45)); };
    var giu = function (n) { return pr(n) && !PAD.prec[n]; };
    var attivo = false;
    for (var b = 0; b < bt.length; b++) if (pr(b)) attivo = true;
    var L = zona(ax[0] || 0, ax[1] || 0, 0.2), Rr = zona(ax[2] || 0, ax[3] || 0, 0.22);
    if (L[2] > 0 || Rr[2] > 0) attivo = true;
    if (attivo && IN.tipo !== 'pad') { IN.tipo = 'pad'; }
    if (nelMenu()) {
      // direzione: croce o levetta, con ripetizione
      var dx = (pr(15) ? 1 : 0) - (pr(14) ? 1 : 0) + (Math.abs(L[0]) > 0.5 ? Math.sign(L[0]) : 0), dy = (pr(13) ? 1 : 0) - (pr(12) ? 1 : 0) + (Math.abs(L[1]) > 0.5 ? Math.sign(L[1]) : 0);
      if (Math.abs(dx) >= Math.abs(dy)) dy = 0; else dx = 0;
      var d = dx || dy ? dx + ',' + dy : '';
      if (d && d !== PAD.dir) { NAV.muovi(Math.sign(dx), Math.sign(dy)); PAD.rip = 0.38; }
      else if (d) { PAD.rip -= dt; if (PAD.rip <= 0) { NAV.muovi(Math.sign(dx), Math.sign(dy)); PAD.rip = 0.14; } }
      PAD.dir = d;
      if (giu(0)) { S.sblocca(); NAV.attiva(); }
      if (giu(1)) NAV.indietro();
      if (giu(9) && FOGLIO === 'pausa') pausa(false);
      IN.pad.on = false;
    } else {
      var p = IN.pad;
      p.on = attivo || p.on;
      if (p.on) IN.desktop = true;
      p.mx = L[0]; p.my = L[1];
      p.rl = Rr[2]; if (Rr[2] > 0) { var rl = Math.hypot(Rr[0], Rr[1]) || 1; p.rx = Rr[0] / rl * Rr[2]; p.ry = Rr[1] / rl * Rr[2]; }
      p.supT = pr(3) || pr(6) || pr(5);
      p.fuoco = pr(7) || pr(0);
      if (inPartita()) {
        if (giu(7) || giu(0)) spara(vettorePad(false), false);
        if (giu(3) || giu(6) || giu(5)) spara(vettorePad(true), true);
        if (giu(4) || giu(2)) spara(vettorePad('gad'), 'gad');
      }
      if (giu(9)) pausa(!APP.pausa);
    }
    for (var c = 0; c < bt.length; c++) PAD.prec[c] = pr(c);
  }

  // ---------------- ciclo ----------------
  var MENU3D = false;   // 17/11 regola del proprietario: i modelli 3D di gioco MAI nei menu (GBR.vivo spento in home e scheda)
  var ultimo = performance.now(), perfAcc = { n: 0, ms: 0, max: 0, t0: performance.now(), fps: 0, msm: 0, maxm: 0 };
  function ciclo(ora) {
    requestAnimationFrame(ciclo);
    var dt = Math.min(0.1, (ora - ultimo) / 1000); ultimo = ora;
    var t0 = performance.now();
    leggiPad(dt);
    // scheda: l'eroe 3D di lato, che si gira piano (una sola vista 3D alla volta)
    if (MENU3D && APP.schermo === 's-scheda' && GBRx && GBRx.vivo) {
      var ce = $('e-vivo'), we = Math.round(ce.clientWidth * Math.min(DPR, 2)), he = Math.round(ce.clientHeight * Math.min(DPR, 2));
      if (we > 0 && (ce.width !== we || ce.height !== he)) { ce.width = we; ce.height = he; }
      if (we > 0) try { GBRx.vivo(ce, APP.vista, 'idle', ora / 1000, 0.5 + Math.sin(ora / 1800) * 0.6); } catch (e) { }
    }
    // lobby col 3D in diretta, se il 3D lo offre (GBR.vivo, parte EROI); se no restano le strisce cotte
    if (MENU3D && APP.schermo === 's-home' && GBRx && GBRx.vivo) {
      var cvv = $('h-vivo'), box = $('h-eroe');
      if (!cvv) { cvv = document.createElement('canvas'); cvv.id = 'h-vivo'; cvv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; box.appendChild(cvv); $('h-vetrina').style.visibility = 'hidden'; }
      var wv = Math.round(box.clientWidth * DPR), hv = Math.round(box.clientHeight * DPR);
      if (cvv.width !== wv || cvv.height !== hv) { cvv.width = wv; cvv.height = hv; }
      if (!ESULTA.trascina) ESULTA.giro = (ESULTA.giro || 0) * 0.96;   // lasciato andare: torna piano di fronte
      try { GBRx.vivo(cvv, APP.eroe, ESULTA.vivoT > ora ? 'win' : 'idle', ora / 1000, 0.3 + Math.sin(ora / 2600) * 0.25 + (ESULTA.giro || 0)); } catch (e) { }
    }
    if (P && (B.fase === 'partita' || B.fase === 'finale')) { passoPartita(dt); controllaRisoluzione(dt); }
    if (PERF) {
      var ms = performance.now() - t0;
      perfAcc.n++; perfAcc.ms += ms; perfAcc.max = Math.max(perfAcc.max, ms);
      if (ora - perfAcc.t0 >= 1000) {
        perfAcc.fps = perfAcc.n * 1000 / (ora - perfAcc.t0); perfAcc.msm = perfAcc.ms / perfAcc.n; perfAcc.maxm = perfAcc.max;
        var np = 0, pp = 0, i;
        for (i = 0; i < D.pa.length; i++) if (D.pa[i].on) np++;
        if (P) for (i = 0; i < P.st.pr.length; i++) if (P.st.pr[i].vivo) pp++;
        $('perf').textContent = 'fps ' + perfAcc.fps.toFixed(0) + '\nms ' + perfAcc.msm.toFixed(2) + ' (max ' + perfAcc.maxm.toFixed(1) + ')\nproj ' + pp + ' part ' + np + '\nroster ' + B.roster + ' dpr ' + DPR + (window.R3 && R3.pronto ? '\ndraw ' + R3.info().calls + ' tri ' + R3.info().tris : '');
        B.perf = { calls: window.R3 && R3.pronto ? R3.info().calls : 0, tris: window.R3 && R3.pronto ? R3.info().tris : 0, dpr: DPR, fps: perfAcc.fps, ms: perfAcc.msm, max: perfAcc.maxm, proj: pp, part: np };
        perfAcc.n = 0; perfAcc.ms = 0; perfAcc.max = 0; perfAcc.t0 = ora;
      }
    }
  }
  if (PERF) $('perf').style.display = 'block';

  function passoPartita(dt) {
    var st = P.st;
    aggiornaBase(st);
    var dtv = dt;
    if (!APP.pausa) {
      if (P.intro > 0) { P.intro -= dt; }
      else if (P.conto > 0) { contoPasso(dt); }
      else if (P.freeze > 0) { P.freeze -= dt; dtv = dt * 0.08; }
      else {
        var lento = B.fase === 'finale' ? 0.3 : (P.lento > 0 ? 0.4 : 1);
        if (P.lento > 0) P.lento -= dt;
        P.acc += dt * lento; dtv = dt * lento;
        var n = 0;
        while (P.acc >= DT && n < 4 && !st.fine) {
          if (P.rep && !P.rep.puo()) { P.acc = 0; break; }   // SPETTATORE 23/11: diretta in attesa dei pezzi / registrazione finita
          if (P.rep) P.rep.input(st, IA); else scriviInput(st);   // SPETTATORE 23/11: nel replay l'input viene dalla registrazione
          if (P.tut) { for (var ib = 1; ib < st.eroi.length; ib++) { var ii = st.inp[ib]; ii.mx = ii.my = 0; ii.att = ii.sup = ii.gad = 0; } aggiornaTutorial(DT); }
          else for (var i = 1; i < st.eroi.length; i++) IA.pensa(st, i);
          if (P.rec) P.rec.passo(st);
          M.passo(st);
          if (P.rec) P.rec.dopo(st); if (P.rep) P.rep.dopo(st);
          if (st.eroi[0].tAtt === st.t) IN.bufAtt = 0;
          // una tacca nuova: clic e lampo sulla barra
          var tacche = Math.floor(st.eroi[0].ammo);
          if (tacche > P.tacche && st.eroi[0].vivo && !AUTO) { S.ricarica(); D._ammoLampo = D.tempo; }
          P.tacche = tacche;
          if (st.eroi[0].tSup === st.t || st.eroi[0].prepT > 0 && st.eroi[0].prepCosa === 1) IN.bufSup = 0;
          if (st.eroi[0].prepT > 0 && st.eroi[0].prepCosa === 2 || st.eroi[0].tGad === st.t) IN.bufGad = 0;
          gestisciEventi(st);
          if (STRESS) stress(st);
          P.acc -= DT; n++;
        }
        if (n >= 4) P.acc = 0;
        if (P.salta && !st.fine) saltaAllaFine(st);   // SPETTATORE 23/11: «Salta» da eliminato
        if (st.fine && B.fase === 'partita') {
          if (window.SPETT) SPETT.fine(P, st);
          B.fase = 'finale'; P.tFine = 0;
          var vinto = st.modo === 'sopravvivenza' ? st.fine.vinc === st.eroi[0].sq : st.fine.vinc === st.eroi[0].sq;
          P.gameT = 0.001; S.game(vinto); S.musicaFile(null);
          D.zoomPugno(0.08);
        }
      }
      if (B.fase === 'finale') { P.tFine += dt; if (P.tFine > 1.7) { chiudiPartita(); return; } }
    } else dtv = 0;
    B.tutorial = P.tut ? P.tut.passo : -1;
    if (P.seguiT > 0) { P.seguiT -= dt; if (P.seguiT <= 0 || st.eroi[0].vivo) { P.seguiT = 0; if (window.R3) R3.segui = null; } }
    if (window.SPETT) SPETT.passo(st, dt, P);   // SPETTATORE 23/11: da KO / eliminato / replay la camera segue un altro eroe
    var quarto = Math.floor(st.eroi[0].sup * 4 + 1e-6);
    if (P.quarto !== undefined && quarto > P.quarto && quarto < 4 && !AUTO) { S.caricaNota(quarto - 1); P.anelloLampo = 1; }
    P.quarto = quarto;
    var alpha = Math.min(1, P.acc / DT);
    // camera: guarda un po' verso dove miri
    var me = st.eroi[0], gx = 0, gy = 0, mira = null;
    if (!AUTO && me.vivo) {
      if (IN.mira.id >= 0 && IN.mira.uscito) {
        var v = vMondo(vettoreMira()), sup = IN.mira.sup;
        mira = formaMira(me, sup, v.x, v.y, true);
        gx = v.x * 2.2; gy = v.y * 2.2;
        D.miraAng = mira.ang;
      } else if (IN.pad.on && IN.pad.rl > 0.25) {
        var supP = IN.pad.supT ? true : false;
        var vpm = mondo(IN.pad.rx, IN.pad.ry);
        mira = formaMira(me, supP, vpm.x, vpm.y, true);
        gx = vpm.x * 2; gy = vpm.y * 2;
      } else if (IN.desktop && IN.mouse.dentro && !IN.pad.on) {
        var sup2 = IN.qTenuto ? 'gad' : (IN.mouse.dx || IN.eTenuto), vm = vMondo(vettoreMouse(sup2));
        mira = formaMira(me, sup2, vm.x, vm.y, IN.mouse.sx || sup2);
        gx = vm.x * 1.6; gy = vm.y * 1.6;
      }
    }
    if (window.R3 && !AUTO) { var hp0 = st.eroi[0], ip = st.inp[0], vl = hp0.d.vel * (hp0.slowT > 0 ? 1 - hp0.slowF : 1) * (hp0.trasT > 0 ? hp0.d.sup.vel || 1 : 1) * (hp0.freT > 0 ? 1.35 : 1) * (hp0.cavT > 0 && hp0.d.corazza ? hp0.d.corazza.vel / hp0.d.vel : 1), il = Math.hypot(ip.mx, ip.my) || 1, kk = il > 1 ? 1 / il : 1; var ac = 1; R3.prev = hp0.stun > 0 || hp0.radiceT > 0 || hp0.prepT > 0 || hp0.pauraT > 0 ? null : { vx: hp0.vx + (ip.mx * kk * vl - hp0.vx) * ac, vy: hp0.vy + (ip.my * kk * vl - hp0.vy) * ac }; }
    if (window.R3 && !AUTO && !P.rep) { scriviInputMovimento(st); }
    D.miraOn = !!mira && (IN.mira.id >= 0 || IN.mouse.sx || IN.mouse.dx || IN.eTenuto || (IN.desktop && IN.mouse.dentro) || (IN.pad.on && IN.pad.rl > 0.25));
    if (mira) D.miraAng = mira.ang;
    D.aggiornaCamera(dt, gx, gy, !!mira);
    D.frame(alpha, dtv, mira);
    if (!(D.salta && D.salta.hud)) { disegnaHUD(dt); disegnaTutorial(D.ctx, scala()); }
    misuraFotogramma();
  }

  // ---------------- via ----------------
  misura();
  B.ui = { mostra: mostra, vai: vai, foglio: foglio, scheda: aggiornaScheda };
  if (AUTO) { mostra(''); B.auto = true; setTimeout(function () { preparaPartita(); }, 300); }
  else if (Q.get('schermo') && $(Q.get('schermo'))) mostra(Q.get('schermo'));
  else mostra(Q.get('notit') ? 's-home' : 's-titolo');
  requestAnimationFrame(ciclo);
  // SPETTATORE 23/11: il resto della partita senza disegno né suoni, 450 passi (15 s di gioco) per fotogramma
  function saltaAllaFine(st) {
    var oss = st.osserva; st.osserva = null;
    for (var n = 0; n < 450 && !st.fine; n++) {
      if (P.rep && !P.rep.puo()) break;   // diretta: ci si ferma un secondo dietro al giocatore (= «mettersi in pari»)
      if (P.rep) P.rep.input(st, IA); else scriviInput(st);
      for (var i = 1; i < st.eroi.length; i++) IA.pensa(st, i);
      if (P.rec) P.rec.passo(st);
      M.passo(st);
      if (P.rec) P.rec.dopo(st); if (P.rep) P.rep.dopo(st);
      if (st.t > 30 * 900) st.fine = { vinc: -1, motivo: 'tempo_vita' };   // rete di sicurezza: mai un ciclo senza fine
    }
    st.osserva = oss; P.acc = 0;
    if (P.rep && P.rep.diretta && !st.fine && !P.rep.puo()) P.salta = false;   // diretta: in pari, si torna a guardare dal vivo
  }
  // SPETTATORE 23/11: ponte per spettatore.js (nomi, colori, uscita) — legge, non tocca il motore
  B.ponteSpett = {
    P: function () { return P; }, lang: function () { return LANG; }, nome: nome, nomeCorto: nomeCorto, colore: function (id) { return info(id).colore; }, busto: function (id) { return asset(id).busto; },
    salta: function () { if (P && !P.st.fine) P.salta = true; },
    esci: function () { if (APP.pausa) pausa(false); P = null; B.fase = 'menu'; if (window.R3) R3.segui = null; vai('s-home', -1); }
  };
  B.avvia = function (modo, eroe) { APP.modo = modo || APP.modo; APP.eroe = eroe || APP.eroe; preparaPartita(); };
})();
