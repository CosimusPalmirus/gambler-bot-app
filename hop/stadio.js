/* HOP CLASH «lo show» v3 - client 3D (three.js r128).  stadio.html[?n=2..5&avvia=1&auto=1&guarda=1&livello=facile&seme=N&pg=zip&lang=en&rm=1&cb=1&muto=1]
   v3: stati ben visibili (scudo a campo di forza esagonale che si crepa e va in frantumi, ghiaccio, stelline, molla sotto i piedi,
   bomba patata col timer, specchio, bersaglio, fumo e scintille a un cuore, corona al primo), meccaniche nuove (patata, trampolino,
   calamita, specchio, jackpot, voto del pubblico, ultima spiaggia), entrata in scena, reazioni al pericolo, emote, podio finale.
   Super polish: lobby con scelta del personaggio, tutorial, IT/EN, musica e ambiente del pubblico con mixer e muto, sigle del
   presentatore, statistiche e rivincita, colori per daltonici, movimento ridotto. */
(function () {
'use strict';
const Q = new URLSearchParams(location.search);
const GUARDA0 = Q.get('guarda') === '1', AUTO = Q.get('auto') === '1';
const $ = id => document.getElementById(id);
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
function leggi(k, d) { try { const v = localStorage.getItem('hc_' + k); return v == null ? d : v; } catch (e) { return d; } }
function scrivi(k, v) { try { localStorage.setItem('hc_' + k, v); } catch (e) {} }
const OPZ = {lang: Q.get('lang') || leggi('lang', 'it'), muto: (Q.get('muto') || leggi('muto', '0')) === '1', rm: (Q.get('rm') || leggi('rm', '0')) === '1',
  cb: (Q.get('cb') || leggi('cb', '0')) === '1', n: +(Q.get('n') || leggi('n', 5)), liv: Q.get('livello') || leggi('liv', 'forte'), pg: Q.get('pg') || leggi('pg', 'zip'),
  tut: Q.get('tut') === '1' || leggi('tut', '0') !== '1'};
if (Q.get('tut') === '0') OPZ.tut = false;
document.body.classList.toggle('rm', OPZ.rm);
const COLN = ['#b3a6ff', '#ff9a52', '#58d6a8', '#ff6f7d', '#59b6ff', '#f2d64b'], COLCB = ['#CC79A7', '#E69F00', '#009E73', '#F0E442', '#56B4E9', '#D55E00'];   // 17/11 mappa: 6° colore per la sesta rana
let COL = OPZ.cb ? COLCB : COLN;

/* ---------------- testi IT/EN (passata «pro» 17/11: lo stagno di HOP CLASH, niente parole da casinò) ---------------- */
const TX = {
 it: {sot: 'Rane in rissa nello stagno: tutti scelgono in segreto la ninfea e saltano <b>insieme</b>. Prendi i poteri, schiva i getti, butta gli altri in acqua. Vince l\'ultimo all\'asciutto.',
  conc: 'Giocatori', bot: 'Avversari', opz: 'Opzioni', come: 'Come si gioca', gioca: 'Gioca', guarda: 'Guarda una partita', altre: 'Altre prove', pronto: 'Pronto',
  scegli: 'Tocca una ninfea accesa', fatto: 'Scelto: puoi ancora cambiare', bloccato: 'Sei nella melma: questo turno non salti', guardi: 'Stai guardando', fermo: 'Nessuna scelta: resti fermo',
  pronta: 'pronta', tra: n => `tra ${n}`, arr: 'IN ARRIVO', com: 'COMANDI', lobby: 'Menu', rivincita: 'Rivincita', vinto: 'Hai vinto!', vince: n => `Vince ${n}`, pari: 'Pareggio',
  regole: 'Legenda', gadget: 'I poteri', ok: 'Ok', tu: 'Tu', turno: n => `Turno ${n}`, via: 'Si salta!', crolla: 'Le ninfee affondano!',
  stat: (d, k, g) => [d ? `${d} ${d === 1 ? 'colpo' : 'colpi'} a segno` : '', k ? `${k} KO` : '', g ? `${g} ${g === 1 ? 'potere' : 'poteri'}` : ''].filter(Boolean).join(' · '), voto: 'Lo stagno ha votato', prossimo: 'dal prossimo turno', ultima: 'Un cuore solo: salti più lontano',
  ev: {scivoloso: 'Ninfee viscide: si scivola di una casella', raddoppio: 'Colpi doppi', nebbia: 'Nebbia: non si vede cosa arriva'},
  tasti: ['<kbd>clic</kbd>scegli', '<kbd>&larr;&uarr;&rarr;&darr;</kbd><kbd>WASD</kbd>sposta la scelta', '<kbd>1-9</kbd>direzione (Maiusc: 2)', '<kbd>Invio</kbd><kbd>Spazio</kbd>pronto', '<kbd>E</kbd>abilità <kbd>H</kbd>legenda', '<kbd>Tab</kbd>un avversario', '<kbd>rotella</kbd>zoom <kbd>tasto destro</kbd>ruota', '<kbd>M</kbd>audio'],
  tut: ['Tocca una <b>ninfea accesa</b>: è dove salterai. Tutti saltano nello stesso momento.', 'Le ninfee coi <b>simboli</b> hanno un potere: scatta quando ci atterri. Tieni premuto per leggerlo (o tocca <b>?</b>).', 'Le file nuove arrivano dall\'alto e la corrente <b>scorre</b>: chi finisce oltre la cascata cade e perde un cuore.'],
  opzioni: ['Italiano', 'Daltonici', 'Meno movimento'], liv: {facile: 'Facili', forte: 'Forti'},
  fase: {scegli: 'Scegli dove saltare', aspetta: 'Aspetta gli altri', guardi: 'Stai guardando', salto: 'Salto', scontri: 'Scontri', gadget: 'Poteri', effetti: 'Effetti', scorre: 'La corrente scorre', crollo: 'Le ninfee affondano', ko: 'KO'},
  rosso: 'le ninfee rosse affondano a fine turno', lez: 'Lezione', prova: 'Prova tu', bravo: 'BRAVO!', riprova: 'Quasi! Riproviamo', lezFine: 'Lezione finita!', lezFineSot: 'Ora una partita vera contro avversari facili.',
  lezione: 'Lezione (2 min)', passaQui: 'passa qui', passaInfo: 'Atterra accanto a un altro per attaccarglielo',
  passa: (a, b) => `${a} attacca il cardo a ${b} (non può ${a.includes(">Tu<") ? "ridartelo" : "ridarglielo"})`, legT: ['Poteri', 'Stati', 'Pericoli'],
  pericoli: [['rosse', 'Ninfea rossa', 'affonda a fine turno: chi ci sta sopra cade in acqua e perde un cuore'], ['rosse2', 'Rossa a strisce chiare', 'affonda alla fine del turno dopo'],
    ['buco', 'Gorgo', 'lasciato da chi è andato KO: lì non si atterra più'], ['bordo', 'Cascata', 'la corrente scorre: la fila sul bordo della cascata cade a ogni turno'],
    ['scontro', 'Scontro', 'due sulla stessa ninfea: rimbalzano, -1 a testa'], ['spinta', 'Spinta', 'atterri su chi è rimasto fermo: lo spingi via di una casella'],
    ['voto', 'Voto dello stagno', 'ogni 4 turni una regola cambia per un turno (annunciata prima)']]},
 en: {sot: 'A pond brawl: everyone secretly picks a lily pad and jumps <b>at once</b>. Grab powers, dodge the jets, knock the others into the water. Last one dry wins.',
  conc: 'Players', bot: 'Opponents', opz: 'Options', come: 'How to play', gioca: 'Play', guarda: 'Watch a match', altre: 'Other prototypes', pronto: 'Ready',
  scegli: 'Tap a lit lily pad', fatto: 'Picked: you can still change', bloccato: 'Stuck in the mud: no jump this turn', guardi: 'Spectating', fermo: 'No pick: you stay put',
  pronta: 'ready', tra: n => `in ${n}`, arr: 'INCOMING', com: 'CONTROLS', lobby: 'Menu', rivincita: 'Rematch', vinto: 'You win!', vince: n => `${n} wins`, pari: 'Draw',
  regole: 'Legend', gadget: 'Powers', ok: 'Ok', tu: 'You', turno: n => `Turn ${n}`, via: 'Hop to it!', crolla: 'The lily pads sink!',
  stat: (d, k, g) => [d ? `${d} ${d === 1 ? 'hit' : 'hits'} landed` : '', k ? `${k} KO` : '', g ? `${g} ${g === 1 ? 'power' : 'powers'}` : ''].filter(Boolean).join(' · '), voto: 'The pond voted', prossimo: 'from next turn', ultima: 'One heart left: longer jumps',
  ev: {scivoloso: 'Slimy pads: you slide one more tile', raddoppio: 'Double hits', nebbia: 'Fog: incoming tiles hidden'},
  tasti: ['<kbd>click</kbd>pick', '<kbd>&larr;&uarr;&rarr;&darr;</kbd><kbd>WASD</kbd>move pick', '<kbd>1-9</kbd>direction (Shift: 2)', '<kbd>Enter</kbd><kbd>Space</kbd>ready', '<kbd>E</kbd>ability <kbd>H</kbd>legend', '<kbd>Tab</kbd>an opponent', '<kbd>wheel</kbd>zoom <kbd>right drag</kbd>rotate', '<kbd>M</kbd>audio'],
  tut: ['Tap a <b>lit lily pad</b>: that is where you jump. Everyone jumps at the same moment.', 'Pads with <b>symbols</b> hold a power: it fires when you land. Press and hold to read it (or tap <b>?</b>).', 'New rows come from the top and the current <b>flows</b>: go over the waterfall and you lose a heart.'],
  opzioni: ['English', 'Colour-blind', 'Reduced motion'], liv: {facile: 'Easy', forte: 'Strong'},
  fase: {scegli: 'Pick where to jump', aspetta: 'Waiting for the others', guardi: 'Spectating', salto: 'Jump', scontri: 'Clashes', gadget: 'Powers', effetti: 'Effects', scorre: 'The current flows', crollo: 'Pads sinking', ko: 'KO'},
  rosso: 'red pads sink at the end of the turn', lez: 'Lesson', prova: 'Your turn', bravo: 'NICE!', riprova: 'Almost! Try again', lezFine: 'Lesson complete!', lezFineSot: 'Now a real match against easy opponents.',
  lezione: 'Lesson (2 min)', passaQui: 'pass here', passaInfo: 'Land next to someone to stick it on them',
  passa: (a, b) => `${a} sticks the burr on ${b} (no passing back)`, legT: ['Powers', 'Statuses', 'Hazards'],
  pericoli: [['rosse', 'Red pad', 'sinks at the end of the turn: anyone on it falls in and loses a heart'], ['rosse2', 'Light red stripes', 'sinks at the end of next turn'],
    ['buco', 'Whirlpool', 'left by a KO: nobody can land there any more'], ['bordo', 'Waterfall', 'the current flows: the row on the waterfall edge drops every turn'],
    ['scontro', 'Clash', 'two on the same pad bounce back, -1 each'], ['spinta', 'Shove', 'land on someone who stayed put and you push them one tile'],
    ['voto', 'Pond vote', 'every 4 turns a rule changes for one turn (announced first)']]}};
const L = () => TX[OPZ.lang] || TX.it;
// la lezione: un concetto per turno
const LEZ = {
 it: {salta: ['Saltare', 'Le ninfee <b>accese</b> sono quelle che raggiungi (fino a 2 caselle). Toccane una e premi <b>Pronto</b>. Tutti saltano nello stesso momento.'],
  gadget: ['I poteri', 'Le ninfee coi <b>simboli</b> hanno un potere: scatta quando ci atterri. Salta sul <b>getto</b> indicato: colpisce tutta la fila e Bruno perde un cuore.'],
  spinta: ['Spingere', 'Se atterri sulla ninfea di chi è rimasto <b>fermo</b>, lo spingi via. Chi finisce in acqua perde un cuore. Salta su Bruno!'],
  scontro: ['Stessa ninfea', 'Se due scelgono la <b>stessa ninfea</b> si scontrano a mezz’aria: <b>rimbalzano indietro</b> e perdono un cuore a testa. Prova: salta sulla ninfea indicata, Bruno farà lo stesso.'],
  stati: ['Gli stati', 'Sei nella <b>melma</b>: questo turno non salti. Hai la <b>conchiglia</b>: para un colpo. Premi Pronto e guarda.'],
  patata: ['Il cardo', 'Hai il <b>cardo</b> attaccato: il numero dice fra quanti turni scoppia. Atterra su una ninfea <b>arancione</b>, accanto a Bruno, per attaccarglielo. Lui non può ridartelo.'],
  rosse: ['Le ninfee affondano', 'Le ninfee <b>rosse</b> affondano a fine turno e tu sei sopra una di loro: salta via! Il <b>gorgo</b> scuro è dove è caduto qualcuno andato KO: lì non si atterra.'],
  vinci: ['Vincere', 'Vince l\'ultimo rimasto all\'asciutto. Bruno ha <b>un cuore solo</b>: colpiscilo col getto!']},
 en: {salta: ['Jumping', '<b>Lit</b> lily pads are the ones you can reach (up to 2 tiles). Tap one and press <b>Ready</b>. Everyone jumps at the same moment.'],
  gadget: ['Powers', 'Pads with <b>symbols</b> hold a power: it fires when you land. Jump on the <b>jet</b>: it hits the whole row and Bruno loses a heart.'],
  spinta: ['Shoving', 'Land on the pad of someone who <b>stayed put</b> and you push them away. Into the water and they lose a heart. Jump on Bruno!'],
  scontro: ['Same pad', 'If two pick the <b>same pad</b> they crash in mid-air: <b>both bounce back</b> and lose a heart each. Try it: jump on the marked pad, Bruno will do the same.'],
  stati: ['Statuses', 'You are in the <b>mud</b>: no jump this turn. You have the <b>shell</b>: it blocks one hit. Press Ready and watch.'],
  patata: ['The burr', 'A <b>burr</b> is stuck on you: the number says in how many turns it pops. Land on an <b>orange</b> pad next to Bruno to stick it on him. He cannot pass it back.'],
  rosse: ['Pads sink', '<b>Red</b> pads sink at the end of the turn and you are on one: jump away! The dark <b>whirlpool</b> is where a KO\'d player fell: nobody lands there.'],
  vinci: ['Winning', 'Last one dry wins. Bruno has <b>one heart</b> left: hit him with the jet!']}};
let LEZIONE = false;
// i poteri: nome, cosa fa; colore di famiglia (caldo = attacco, blu/viola = controllo, verde/rosa = aiuto, arancio = rischio, oro = perla)
const GN = {
 it: {riga: ['Getto', 'spruzza lungo la fila delle frecce (-1)'], colonna: ['Getto', 'spruzza lungo la fila delle frecce (-1)'], croce: ['Doppio getto', 'spruzza nelle due direzioni (-1)'],
  bomba: ['Vescia', 'scoppia attorno a te (-2)'], gelo: ['Melma', 'chi ti sta attorno resta impantanato un turno'], onda: ['Ondata', 'spinge via di 2 tutti quelli attorno a te (fuori = in acqua, -1)'],
  corrente: ['Corrente', 'spinge via di 2 tutti quelli sulla tua fila, nelle due direzioni (fuori = in acqua, -1)'], fauci: ['Fauci', 'TRAPPOLA: ninfea carnivora, chi ci finisce (atterrando o spinto) viene morso (-1). Spingi gli avversari nelle trappole!'], pantano: ['Pantano', 'TRAPPOLA: ninfea marcia, chi ci finisce (atterrando o spinto) il turno dopo non salta'],
  loto: ['Loto', '+1 cuore'], scudo: ['Conchiglia', 'para il prossimo colpo'], molla: ['Lucciole', 'il prossimo salto arriva a 3'],
  patata: ['Cardo', 'si attacca a chi lo prende: dopo 2 turni scoppia (-2). Passalo atterrando accanto a un altro: non può ridartelo e il conto non riparte'], trampolino: ['Balzo lunare', 'rimbalzi avanti di altre 2 caselle'],
  calamita: ['Risucchio', 'chi è a 2 caselle viene tirato di 1 verso di te'], specchio: ['Bolla specchio', 'il prossimo colpo torna a chi l\'ha tirato'], jackpot: ['Perla', '+1 cuore e conchiglia, ma per 2 turni sei il bersaglio (+1 a ogni colpo)']},
 en: {riga: ['Jet', 'sprays along the arrows (-1)'], colonna: ['Jet', 'sprays along the arrows (-1)'], croce: ['Cross jet', 'sprays both ways (-1)'],
  bomba: ['Puffball', 'bursts around you (-2)'], gelo: ['Mud', 'everyone around you is stuck for a turn'], onda: ['Wave', 'shoves everyone around you 2 tiles away (off the pads = in the water, -1)'],
  corrente: ['Current', 'shoves everyone on your row 2 tiles away, both directions (off the pads = in the water, -1)'], fauci: ['Snapper', 'TRAP: a carnivorous pad, whoever ends up on it (landing or shoved) gets bitten (-1). Shove your opponents into traps!'], pantano: ['Bog', 'TRAP: a rotten pad, whoever ends up on it (landing or shoved) cannot jump next turn'],
  loto: ['Lotus', '+1 heart'], scudo: ['Shell', 'blocks the next hit'], molla: ['Fireflies', 'next jump reaches 3'],
  patata: ['Burr', 'sticks to whoever grabs it: pops after 2 turns (-2). Land next to someone to pass it: no passing back, the count keeps running'], trampolino: ['Moon leap', 'bounce 2 more tiles forward'],
  calamita: ['Whirlpool', 'pulls everyone 2 tiles away one tile toward you'], specchio: ['Mirror bubble', 'the next hit bounces back to the thrower'], jackpot: ['Pearl', '+1 heart and a shell, but for 2 turns you are the target (+1 per hit)']}};
const TC = {riga: '#ff5a3c', colonna: '#ff5a3c', croce: '#ff3d7a', bomba: '#c25bff', gelo: '#8a6a3a', onda: '#3d8bff', loto: '#ff6fa8', scudo: '#ffb38a', molla: '#d6f24a',
  patata: '#ff8a1e', trampolino: '#7fd6ff', calamita: '#6a5cff', specchio: '#bfefff', jackpot: '#ffd23f', corrente: '#1f7bff', fauci: '#c4102c', pantano: '#6b4a1e'};
const T = new Proxy({}, {get: (o, t) => GN[OPZ.lang] && GN[OPZ.lang][t] ? [GN[OPZ.lang][t][0], GN[OPZ.lang][t][1], TC[t]] : undefined, has: (o, t) => !!TC[t]});
// ogni potere: la sua icona dipinta (assets_bayou/ic) e la forma della targa sotto, che dice DOVE colpisce
const ICONA = {riga: 'getto', colonna: 'getto', croce: 'cerbottana', bomba: 'vescia', gelo: 'melma', onda: 'corrente', loto: 'loto', scudo: 'conchiglia', molla: 'lucciole',
  patata: 'cardo', trampolino: 'luna', calamita: 'risucchio', specchio: 'bolla', jackpot: 'perla', onda: null, corrente: null, fauci: null, pantano: 'marcia'};
const FAMIGLIA = {riga: 'att', colonna: 'att', croce: 'att', bomba: 'att', gelo: 'ctl', onda: 'ctl', calamita: 'ctl', loto: 'aiu', scudo: 'aiu', molla: 'aiu', trampolino: 'aiu', specchio: 'aiu', patata: 'ris', jackpot: 'oro', corrente: 'ctl', fauci: 'trap', pantano: 'trap'};
const DISCO = t => [TC[t], TC[t]];
const ROSSO = '#ff2d45', ARANCIO = '#ff9a2e', BLU = '#3d8bff';
const LEGENDA = ['fauci', 'pantano', 'onda', 'corrente', 'riga', 'croce', 'bomba', 'gelo', 'calamita', 'loto', 'scudo', 'molla', 'specchio', 'trampolino', 'patata', 'jackpot'];
const PGS = ['tonfo', 'zip', 'axa', 'camu', 'grumo', 'luma'];
const PGN = {tonfo: 'Tonfo', zip: 'Zip', axa: 'Axa', camu: 'Camu', grumo: 'Grumo', luma: 'Luma'};
const AB = {
 it: {panciata: ['Panciata', 'dopo il salto spinge via di 2 chi ti sta attorno (-1)'], superbalzo: ['Superbalzo', 'salti fino a 4 e atterrando spingi via di 1 chi ti sta attorno'], bolla: ['Bolla', 'per un turno i colpi non ti feriscono (le cadute sì)'],
  lingua: ['Lingua', 'tira a te il più vicino in linea (-1)'], nube: ['Nube', 'avveleni chi ti sta attorno'], lampo: ['Lanterna', 'abbagli e blocchi un turno chi ti sta attorno (-1)']},
 en: {panciata: ['Belly flop', 'after the jump shoves everyone around you by 2 (-1)'], superbalzo: ['Super hop', 'jump up to 4 and the landing shoves everyone around you 1 tile'], bolla: ['Bubble', 'hits cannot hurt you this turn (falls still do)'],
  lingua: ['Tongue', 'pulls the nearest in line to you (-1)'], nube: ['Cloud', 'poisons everyone around you'], lampo: ['Lantern', 'dazzles and freezes everyone around you for a turn (-1)']}};
const ABPG = {tonfo: 'panciata', zip: 'superbalzo', axa: 'bolla', camu: 'lingua', grumo: 'nube', luma: 'lampo'};
const ab = k => (AB[OPZ.lang] || AB.it)[k];

/* ---------------- AUDIO: mixer a bus, effetti sintetizzati a strati, musica a livelli, pubblico, sigle ----------------
   Tutto generato qui col Web Audio (niente file, niente audio di terzi).
   Catena: voci -> bus (effetti / interfaccia / sigle / musica / pubblico) -> master -> compressore -> limitatore -> uscita.
   Riverbero da stadio in mandata (risposta all'impulso sintetica). Massimo 12 voci di effetti insieme, 3 per lo stesso suono. */
let AC = null, MIX = null, RUMORE = null;
const VOCI = [], VOCI_K = {}, MUSV = .2;
function ac() {
  if (AC) return AC;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  const a = AC, m = a.createGain(), comp = a.createDynamicsCompressor(), lim = a.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = .004; comp.release.value = .22;
  lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .001; lim.release.value = .09;
  m.gain.value = OPZ.muto ? 0 : .8; m.connect(comp); comp.connect(lim); lim.connect(a.destination);
  const bus = v => { const g = a.createGain(); g.gain.value = v; g.connect(m); return g; };
  const sfx = bus(.8), ui = bus(.55), sig = bus(.5), mus = bus(MUSV), fol = bus(0), tifo = bus(.9);
  // la musica passa da un filtro: si chiude mentre si sceglie (attesa) e si apre nella rivelazione
  const musF = a.createBiquadFilter(); musF.type = 'lowpass'; musF.frequency.value = 16000; musF.Q.value = .9; mus.disconnect(); mus.connect(musF); musF.connect(m);
  // riverbero: rumore stereo che decade in 1,5 s, filtrato (stadio coperto). Si prepara poco dopo (non blocca il primo fotogramma).
  const rv = a.createConvolver(), rvOut = a.createGain(); rvOut.gain.value = .5; rv.connect(rvOut); rvOut.connect(m);
  const manda = (src, v) => { const g = a.createGain(); g.gain.value = v; src.connect(g); g.connect(rv); };
  manda(sfx, .22); manda(sig, .3); manda(mus, .12); manda(fol, .4); manda(tifo, .5);
  setTimeout(() => { try { const L = Math.floor(a.sampleRate * 1.5), ir = a.createBuffer(2, L, a.sampleRate), k = Math.pow(.001, 1 / L);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0, e = 1; for (let i = 0; i < L; i++) { lp += ((Math.random() * 2 - 1) - lp) * .35; d[i] = lp * e; e *= k; } }
    rv.buffer = ir; } catch (e) {} }, 1200);
  // rumore bianco condiviso (2 s): nessun buffer nuovo a ogni colpo
  RUMORE = a.createBuffer(1, a.sampleRate * 2, a.sampleRate); { const d = RUMORE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  MIX = {m, sfx, ui, sig, mus, musF, fol, tifo, rv, comp, lim};
  // ambiente del pubblico: due fasce di rumore (brusio basso + voci) con un'onda lenta
  { const amb = a.createGain(); amb.gain.value = .5; amb.connect(m); MIX.amb = amb;
    const s0 = a.createBufferSource(), lp = a.createBiquadFilter(), hp = a.createBiquadFilter(), gc = a.createGain(); s0.buffer = RUMORE; s0.loop = true; s0.playbackRate.value = .6; lp.type = 'lowpass'; lp.frequency.value = 900; hp.type = 'highpass'; hp.frequency.value = 120; gc.gain.value = .16; s0.connect(lp); lp.connect(hp); hp.connect(gc); gc.connect(amb); s0.start();
    const gr = a.createOscillator(), gg = a.createGain(), am = a.createOscillator(), amg = a.createGain(); gr.frequency.value = 4400; am.type = 'square'; am.frequency.value = 22; amg.gain.value = .006; gg.gain.value = .006; am.connect(amg); amg.connect(gg.gain); gr.connect(gg); gg.connect(amb); gr.start(); am.start();
    setInterval(() => { if (!AC || OPZ.muto || Math.random() < .35) return; const t = AC.currentTime + Math.random(); const g0 = MIX.sfx; MIX.sfx = MIX.amb; try { RICETTE.gracida(t, .35 + Math.random() * .3, .7 + Math.random() * .5); } catch (e) {} MIX.sfx = g0; }, 1700); }
  for (const [f, q, v] of [[420, .7, .45], [1300, 1.1, .2]]) { const s = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
    s.buffer = RUMORE; s.loop = true; s.playbackRate.value = .5 + Math.random() * .1; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; g.gain.value = v;
    lfo.frequency.value = .13 + Math.random() * .1; lg.gain.value = v * .3; lfo.connect(lg); lg.connect(g.gain); s.connect(bp); bp.connect(g); g.connect(fol); s.start(); lfo.start(); }
  avviaMusica(); return AC;
}
function mixUscita(o) { return MIX ? MIX.sfx : o; }
// limitatore di voci: false se il suono va saltato
function voce(k, dur) {
  const n = AC.currentTime; for (let i = VOCI.length - 1; i >= 0; i--) if (VOCI[i].f < n) { VOCI_K[VOCI[i].k]--; VOCI.splice(i, 1); }
  if (VOCI.length >= 12 || (VOCI_K[k] || 0) >= 3) return false;
  VOCI.push({k, f: n + dur}); VOCI_K[k] = (VOCI_K[k] || 0) + 1; return true;
}
// mattoni: un tono con inviluppo di altezza e volume, e uno «sbuffo» di rumore filtrato
function tono(t0, o) {
  const a = AC, os = a.createOscillator(), g = a.createGain(), d = o.dur, v = o.vol;
  os.type = o.tipo || 'sine'; os.frequency.setValueAtTime(o.f0, t0); if (o.f1 && o.f1 !== o.f0) os.frequency.exponentialRampToValueAtTime(o.f1, t0 + (o.glide || d));
  if (o.vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(os.frequency); l.start(t0); l.stop(t0 + d + .05); }
  let out = os; if (o.lp) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t0); if (o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1, t0 + d); f.Q.value = o.q || .8; os.connect(f); out = f; }
  out.connect(g); g.connect(o.bus || MIX.sfx);
  const at = o.att || .004; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + at); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  os.start(t0); os.stop(t0 + d + .03);
}
function sbuffo(t0, o) {
  const a = AC, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), d = o.dur;
  s.buffer = RUMORE; s.playbackRate.value = o.rate || 1; f.type = o.filtro || 'bandpass'; f.frequency.setValueAtTime(o.f0, t0); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + d); f.Q.value = o.q || .7;
  s.connect(f); f.connect(g); g.connect(o.bus || MIX.sfx);
  const at = o.att || .003; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(o.vol, t0 + at); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  s.start(t0, Math.random() * Math.max(0, 1.95 - d * (o.rate || 1))); s.stop(t0 + d + .03);
}
// ricette: r = piccola variazione di altezza a ogni colpo, perche' lo stesso suono non sembri una mitragliatrice
const RICETTE = {
  salto: (n, v, r) => { tono(n, {f0: 260 * r, f1: 820 * r, dur: .16, vol: .32 * v, glide: .12}); tono(n, {f0: 520 * r, f1: 1500 * r, dur: .1, vol: .07 * v, tipo: 'triangle'}); sbuffo(n, {dur: .14, vol: .08 * v, filtro: 'highpass', f0: 1800, f1: 5000}); },
  atterra: (n, v, r) => { tono(n, {f0: 170 * r, f1: 48, dur: .26, vol: .6 * v, glide: .1}); sbuffo(n, {dur: .07, vol: .3 * v, filtro: 'lowpass', f0: 2600, f1: 500}); tono(n + .01, {f0: 95 * r, dur: .18, vol: .2 * v, tipo: 'triangle'}); },
  passo: (n, v, r) => { tono(n, {f0: 150 * r, f1: 60, dur: .12, vol: .42 * v}); sbuffo(n, {dur: .05, vol: .14 * v, filtro: 'lowpass', f0: 1800}); },
  tonfo: (n, v, r) => { tono(n, {f0: 140 * r, f1: 38, dur: .45, vol: .9 * v, glide: .2}); sbuffo(n, {dur: .3, vol: .4 * v, filtro: 'lowpass', f0: 1500, f1: 200}); tono(n, {f0: 70, dur: .4, vol: .3 * v, tipo: 'triangle'}); },
  rimbalzo: (n, v, r) => { tono(n, {f0: 220 * r, f1: 640 * r, dur: .2, vol: .2 * v, tipo: 'square', lp: 1600, vib: [26, 30]}); tono(n, {f0: 110 * r, f1: 320 * r, dur: .18, vol: .25 * v}); },
  boing: (n, v, r) => { tono(n, {f0: 170 * r, f1: 660 * r, dur: .38, vol: .3 * v, vib: [22, 45], glide: .25}); tono(n, {f0: 340 * r, f1: 1320 * r, dur: .25, vol: .05 * v, tipo: 'triangle'}); },
  carica: (n, v, r) => { tono(n, {f0: 180 * r, f1: 900 * r, dur: .4, vol: .14 * v, tipo: 'sawtooth', lp: 500, lp1: 4000}); [0, 4, 7, 12].forEach((s, k) => tono(n + .05 + k * .05, {f0: 880 * r * Math.pow(2, s / 12), dur: .22, vol: .07 * v, tipo: 'triangle'})); },
  zap: (n, v, r) => { tono(n, {f0: 2100 * r, f1: 140, dur: .32, vol: .13 * v, tipo: 'sawtooth', lp: 5000, lp1: 800}); tono(n, {f0: 1050 * r, f1: 90, dur: .3, vol: .12 * v, tipo: 'square', lp: 2500}); sbuffo(n, {dur: .2, vol: .1 * v, filtro: 'highpass', f0: 4000}); },
  bomba: (n, v, r) => { tono(n, {f0: 120 * r, f1: 28, dur: .9, vol: .9 * v, glide: .5}); sbuffo(n, {dur: 1.1, vol: .65 * v, filtro: 'lowpass', f0: 3200, f1: 160, att: .002}); sbuffo(n + .02, {dur: .5, vol: .18 * v, filtro: 'highpass', f0: 2500, rate: .6}); for (let k = 0; k < 5; k++) sbuffo(n + .15 + Math.random() * .5, {dur: .04, vol: .1 * v, f0: 1500 + Math.random() * 3000, q: 3}); },
  tic: (n, v, r) => { tono(n, {f0: 1250 * r, dur: .045, vol: .22 * v, bus: MIX.ui}); tono(n, {f0: 2500 * r, dur: .025, vol: .07 * v, tipo: 'triangle', bus: MIX.ui}); },
  gelo: (n, v, r) => { [2600, 3300, 3950, 4700].forEach((f, k) => tono(n + k * .045, {f0: f * r, dur: .35, vol: .07 * v, tipo: 'sine'})); sbuffo(n, {dur: .5, vol: .12 * v, filtro: 'highpass', f0: 5500, f1: 9000}); tono(n, {f0: 300, f1: 150, dur: .3, vol: .1 * v, tipo: 'triangle'}); },
  frantuma: (n, v, r) => { sbuffo(n, {dur: .4, vol: .32 * v, filtro: 'highpass', f0: 2800, f1: 6000}); for (let k = 0; k < 7; k++) tono(n + Math.random() * .2, {f0: 2800 + Math.random() * 3800, dur: .12 + Math.random() * .15, vol: .05 * v, tipo: 'triangle'}); },
  onda: (n, v, r) => { sbuffo(n, {dur: .7, vol: .4 * v, f0: 280, f1: 1600, q: 1.2, att: .08}); tono(n, {f0: 90 * r, f1: 45, dur: .6, vol: .35 * v}); },
  cura: (n, v, r) => { [0, 4, 7, 12].forEach((s, k) => { tono(n + k * .06, {f0: 660 * r * Math.pow(2, s / 12), dur: .4, vol: .1 * v, tipo: 'triangle'}); tono(n + k * .06, {f0: 1320 * r * Math.pow(2, s / 12), dur: .25, vol: .03 * v}); }); },
  ko: (n, v, r) => { tono(n, {f0: 600 * r, f1: 60, dur: 1.1, vol: .2 * v, tipo: 'sawtooth', lp: 3000, lp1: 300, glide: .9}); tono(n, {f0: 90, f1: 30, dur: 1.0, vol: .8 * v, glide: .6}); sbuffo(n, {dur: 1.2, vol: .45 * v, filtro: 'lowpass', f0: 2500, f1: 150}); tono(n + .05, {f0: 1600, f1: 300, dur: .8, vol: .06 * v}); },
  cade: (n, v, r) => { tono(n, {f0: 1500 * r, f1: 180, dur: .95, vol: .14 * v, vib: [7, 18]}); sbuffo(n, {dur: .9, vol: .1 * v, f0: 2500, f1: 400, q: 2, att: .2}); },
  crollo: (n, v, r) => { sbuffo(n, {dur: 1.2, vol: .55 * v, filtro: 'lowpass', f0: 700, f1: 90, att: .02}); tono(n, {f0: 60 * r, f1: 30, dur: 1.0, vol: .55 * v}); for (let k = 0; k < 8; k++) { const t = n + .05 + Math.random() * .8; sbuffo(t, {dur: .06, vol: .14 * v, filtro: 'bandpass', f0: 600 + Math.random() * 1800, q: 2}); } },
  magnete: (n, v, r) => { tono(n, {f0: 80 * r, f1: 170 * r, dur: .6, vol: .16 * v, tipo: 'sawtooth', lp: 900, vib: [14, 12]}); tono(n, {f0: 160 * r, f1: 340 * r, dur: .55, vol: .08 * v, tipo: 'square', lp: 1200}); },
  specchio: (n, v, r) => { tono(n, {f0: 1500 * r, f1: 2600 * r, dur: .3, vol: .1 * v, tipo: 'triangle'}); tono(n + .06, {f0: 3200 * r, dur: .4, vol: .06 * v}); sbuffo(n, {dur: .3, vol: .07 * v, filtro: 'highpass', f0: 6000}); },
  sibilo: (n, v, r) => { tono(n, {f0: 320 * r, f1: 1900 * r, dur: .32, vol: .1 * v}); sbuffo(n, {dur: .35, vol: .16 * v, f0: 600, f1: 5000, q: 1.5, att: .05}); },
  miccia: (n, v, r) => { sbuffo(n, {dur: .6, vol: .1 * v, filtro: 'highpass', f0: 4500, att: .02}); for (let k = 0; k < 6; k++) sbuffo(n + Math.random() * .5, {dur: .02, vol: .12 * v, f0: 3000 + Math.random() * 3000, q: 4}); },
  // acqua (passata «pro»): rumore filtrato che si chiude + bollicine che salgono; plop di goccia; getto d'acqua; gracidio a impulsi
  morso: (n, v, r) => { for (const t of [0, .07]) { sbuffo(n + t, {dur: .05, vol: .5 * v, f0: 2600 * r, q: 2.5}); tono(n + t, {f0: 900 * r, f1: 300, dur: .06, vol: .25 * v, tipo: 'square', lp: 3000}); } tono(n + .08, {f0: 130 * r, f1: 50, dur: .3, vol: .7 * v, glide: .15}); },
  splash: (n, v, r) => { tono(n, {f0: 120 * r, f1: 45, dur: .22, vol: .45 * v, glide: .12}); sbuffo(n, {dur: .6, vol: .55 * v, filtro: 'lowpass', f0: 6000, f1: 380, att: .003}); sbuffo(n + .01, {dur: .32, vol: .22 * v, filtro: 'highpass', f0: 2600, f1: 7000});
    for (let k = 0; k < 7; k++) { const t = n + .06 + Math.random() * .45, f = 380 + Math.random() * 600; tono(t, {f0: f * r, f1: f * 2.4 * r, dur: .05 + Math.random() * .04, vol: (.05 + Math.random() * .04) * v}); } },
  plop: (n, v, r) => { tono(n, {f0: 950 * r, f1: 240, dur: .1, vol: .22 * v, glide: .07}); sbuffo(n, {dur: .07, vol: .1 * v, f0: 1400, q: 1.6}); tono(n + .02, {f0: 520 * r, f1: 900 * r, dur: .05, vol: .05 * v}); },
  getto: (n, v, r) => { sbuffo(n, {dur: .55, vol: .38 * v, f0: 700, f1: 2600, q: .9, att: .03}); sbuffo(n, {dur: .45, vol: .2 * v, filtro: 'highpass', f0: 3200, f1: 6500, att: .02}); tono(n, {f0: 200 * r, f1: 110, dur: .3, vol: .14 * v, tipo: 'triangle'}); },
  gracida: (n, v, r) => { const f = (120 + Math.random() * 90) * r; for (let k = 0; k < 7; k++) tono(n + k * .028, {f0: f * (1 + k * .015), dur: .026, vol: .1 * v, tipo: 'sawtooth', lp: 1300 + Math.random() * 500, att: .002});
    for (let k = 0; k < 5; k++) tono(n + .26 + k * .03, {f0: f * 1.12, dur: .028, vol: .08 * v, tipo: 'sawtooth', lp: 1500, att: .002}); },
  scudoRotto: (n, v, r) => { tono(n, {f0: 2300 * r, f1: 380, dur: .4, vol: .1 * v, tipo: 'square', lp: 4000}); sbuffo(n, {dur: .45, vol: .28 * v, filtro: 'highpass', f0: 2500, f1: 7000}); tono(n, {f0: 140, f1: 70, dur: .25, vol: .3 * v}); }
};
const GUAD = {splash: 1.3, gracida: 1.2, carica: 2, sibilo: 2.2, cade: 1.6, cura: 1.5, specchio: 1.4, miccia: 1.3, scudoRotto: .7};
const DUR_RIC = {morso: .4, splash: .7, plop: .12, getto: .55, gracida: .5, bomba: 1.1, ko: 1.2, crollo: 1.2, cade: 1, onda: .7, boing: .4, magnete: .6, frantuma: .4, gelo: .5, cura: .5, miccia: .6, scudoRotto: .45, tonfo: .45, carica: .45};
function suono(k, vol) {
  if (OPZ.muto) return;
  try { const a = ac(); if (!RICETTE[k] || !voce(k, DUR_RIC[k] || .3)) return; RICETTE[k](a.currentTime + .005, (vol || 1) * (GUAD[k] || 1), 1 + (Math.random() - .5) * .08); } catch (e) {}
}
function rumore(dur, vol, freq, giu) {
  if (OPZ.muto) return;
  try { const a = ac(); if (!voce('rumore', dur)) return; sbuffo(a.currentTime, {dur, vol: vol * 1.4, f0: freq, f1: giu ? freq * .35 : null, q: .6, att: .01}); } catch (e) {}
}
// il "presentatore": sigle brevi con un timbro da ottoni sintetici (due seghe stonate + filtro) e un colpo di timpano
// SIGLE (stinger) dello stagno: marimba + banjo + rane-tamburo + un colpo di cassa d'acqua; la musica si abbassa sotto (duck)
function sigla(tipo) {
  if (OPZ.muto) return;
  try {
    const a = ac(), n = a.currentTime + .01, B = MIX.sig;
    const S = {turno: [[69, 0], [72, .09], [76, .18]], rivela: [[64, 0], [67, .06], [72, .12], [76, .18, .35]],
      ko: [[76, 0], [72, .12], [67, .24], [57, .36, .8]], combo: [[72, 0], [76, .07], [79, .14], [84, .21, .5]],
      vince: [[69, 0], [72, .12], [76, .24], [81, .36], [79, .5], [81, .62, 1.1], [84, .62, 1.1]], sconfitta: [[64, 0], [62, .22], [60, .44], [57, .66, 1.2]],
      voto: [[76, 0], [72, .1], [76, .2], [79, .3]], crollo: [[64, 0], [60, .16], [57, .32, .7]]}[tipo] || [[72, 0]];
    duck(tipo === 'vince' || tipo === 'sconfitta' ? 2.2 : 1.1);
    for (const [m, t, d] of S) { const f = 440 * Math.pow(2, (m - 69) / 12), dur = d || .3;
      marimba(n + t, f, .14, B); pizzico(n + t + .004, f / 2, dur, .1, B, 2800); if (dur > .4) tono(n + t, {f0: f, dur, vol: .05, tipo: 'triangle', vib: [5, 4], att: .02, bus: B}); }
    // fondo: colpo d'acqua profondo (cassa) e schizzo
    tono(n, {f0: 95, f1: 55, dur: .4, vol: .32, glide: .25, bus: B}); sbuffo(n, {dur: .3, vol: .07, filtro: 'lowpass', f0: 3000, f1: 400, bus: B});
    if (tipo === 'vince' || tipo === 'combo') { for (let k = 0; k < (tipo === 'vince' ? 6 : 3); k++) ranaTamburo(n + .3 + k * .1, 150 + k * 25, .08, B); }
    if (tipo === 'ko') tono(n + .36, {f0: 55, f1: 35, dur: .8, vol: .35, bus: B});
    if (tipo === 'sconfitta') tono(n + .66, {f0: hzM(57), f1: hzM(52), dur: 1.1, vol: .06, tipo: 'sawtooth', lp: 1200, vib: [5, 8], glide: 1, bus: B});
  } catch (e) {}
}
// VOCI DELLE RANE: ogni personaggio ha il suo gracidio (altezza, impulsi, filtro) e il suo peso all'atterraggio
const VOCE_PG = {tonfo: {f: 92, n: 9, lp: 900, peso: 1.15}, grumo: {f: 66, n: 11, lp: 650, peso: 1.35}, zip: {f: 330, n: 4, lp: 2800, peso: .55},
  axa: {f: 250, n: 5, lp: 1600, peso: .7}, camu: {f: 175, n: 6, lp: 1500, peso: .8}, luma: {f: 140, n: 7, lp: 1200, peso: .85}};
function voceRana(pg, vol) {
  if (OPZ.muto || !AC || !voce('voce_' + pg, .4)) return; const v = VOCE_PG[pg] || VOCE_PG.tonfo, n = AC.currentTime + .005, r = .94 + Math.random() * .12;
  for (let k = 0; k < v.n; k++) tono(n + k * .026, {f0: v.f * r * (1 + k * .012), dur: .024, vol: .12 * (vol || 1), tipo: 'sawtooth', lp: v.lp, att: .002});
  tono(n, {f0: v.f * r * .5, dur: v.n * .026, vol: .06 * (vol || 1), att: .01});
}
function tonfoPeso(pg, vol) {   // atterraggio: piu' pesante per Grumo e Tonfo, leggero per Zip
  if (OPZ.muto || !AC) return; const w = (VOCE_PG[pg] || {}).peso || 1, n = AC.currentTime + .005;
  tono(n, {f0: 150 / w, f1: 45 / w, dur: .15 + .15 * w, vol: (.25 + .3 * w) * (vol || 1), glide: .1}); sbuffo(n, {dur: .05 + .05 * w, vol: .12 * w * (vol || 1), filtro: 'lowpass', f0: 2000 / w});
}
// battito del cuore quando ti resta un cuore solo
let BATTITO = 0;
function battito() { if (OPZ.muto || !AC) return; try { const n = AC.currentTime; for (const [t, f, v] of [[0, 64, .5], [.17, 54, .38]]) { tono(n + t, {f0: f, f1: 32, dur: .2, vol: v, glide: .15}); sbuffo(n + t, {dur: .05, vol: .06, filtro: 'lowpass', f0: 400}); } } catch (e) {} }
// MUSICA DELLO STAGNO (passata «pro», 17/11 sera): tema notturno del bayou, tutto sintetizzato, a strati che seguono il gioco.
// Strumenti: contrabbasso pizzicato (sinusoide + armonica, attacco morbido), marimba/kalimba (sinusoidi brevi con la quarta armonica),
// banjo (corda pizzicata: rumore filtrato che risuona, Karplus semplice con un ritardo), spazzole e maracas di semi (rumore),
// «rane-tamburo» (gracidio corto intonato) e un lamento di slide (dente di sega filtrato con glissando).
// Stati: MENU (calmo: basso, marimba sola), SCEGLI (tensione: filtro chiuso, tic-tac di legnetto, basso a note ribattute),
// RIVELA (pieno: banjo, spazzole, rane), DUELLO/FINALE (piu' veloce, rullo di rane, slide). Stinger a parte (sigla).
const SCALA_M = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79];       // la minore pentatonica (A C D E G), due ottave
const GIRO_M = [[45, 0], [41, 3], [43, 5], [40, 4]];           // basso: La, Fa, Sol, Mi (con la radice dell'arpeggio)
// la melodia: 4 battute da 8 crome, indici in SCALA_M (-1 = pausa); due varianti che si alternano
const MELO = [[[4, -1, 5, 4, 2, -1, 1, 2], [0, -1, 1, 2, -1, 4, 2, -1], [3, -1, 4, 3, 1, -1, 2, 1], [0, -1, -1, 2, 1, -1, 0, -1]],
  [[7, -1, 6, 5, 4, -1, 5, 6], [5, -1, 4, 2, -1, 1, 2, -1], [4, -1, 5, 4, 3, -1, 1, 2], [1, -1, 0, -1, 2, -1, -1, -1]]];
let MUS_T = 0, TEMPO = 98, PASSO_MUS = 0;
const hzM = m => 440 * Math.pow(2, (m - 69) / 12);
function pizzico(t, f, d, v, bus, lp) {   // corda pizzicata (banjo/contrabbasso): rumore breve dentro un filtro risonante + sinusoide
  tono(t, {f0: f, dur: d, vol: v, tipo: 'triangle', lp: lp || 2200, att: .003, bus});
  sbuffo(t, {dur: .05, vol: v * .5, f0: f * 2, q: 12, bus});
}
function marimba(t, f, v, bus) { tono(t, {f0: f, dur: .42, vol: v, att: .002, bus}); tono(t, {f0: f * 4, dur: .09, vol: v * .28, att: .001, bus}); tono(t, {f0: f * 10, dur: .03, vol: v * .08, att: .001, bus}); }
function ranaTamburo(t, f, v, bus) { for (let k = 0; k < 3; k++) tono(t + k * .022, {f0: f * (1 - k * .03), dur: .03, vol: v, tipo: 'sawtooth', lp: 900, att: .002, bus}); }
function avviaMusica() {
  const a = AC, B = () => MIX.mus;
  MUS_T = a.currentTime + .1; PASSO_MUS = 0;
  setInterval(() => {
    if (!MIX) return;
    while (MUS_T < a.currentTime + .5) {
      const sedic = 60 / TEMPO / 4, s = PASSO_MUS % 16, bar = Math.floor(PASSO_MUS / 16) % 4, giro = Math.floor(PASSO_MUS / 64) % 2, t = MUS_T;
      const [basso, rad] = GIRO_M[bar], liv = Math.min(1, CHEER), duello = TEMPO > 120, menu = FASE === 'menu' || FASE === 'fine', scegli = FASE === 'scegli', pieno = !menu && !scegli;
      // contrabbasso: radice sul 1 e sul 3, passaggio sul 4 «e»; mentre si sceglie note ribattute (tensione)
      if (s === 0 || s === 8) pizzico(t, hzM(basso), sedic * 5, .34, B(), 700);
      if (s === 14 && !menu) pizzico(t, hzM(basso + 7), sedic * 2, .2, B(), 700);
      if (scegli && s % 4 === 2) pizzico(t, hzM(basso), sedic * 1.5, .14, B(), 600);
      // spazzole e semi: dal pieno in su; nel duello doppie
      if (pieno || duello) { if (s % 4 === 2) sbuffo(t, {dur: .09, vol: .07 + .04 * liv, filtro: 'bandpass', f0: 3200, q: .8, bus: B()}); if (s % 2 === 1) sbuffo(t, {dur: .03, vol: .035 + .02 * liv, filtro: 'highpass', f0: 7000, bus: B()}); }
      if (s === 4 || s === 12) { if (!menu) { sbuffo(t, {dur: .12, vol: .1 + .05 * liv, f0: 1500, q: 1, bus: B()}); tono(t, {f0: 190, f1: 140, dur: .07, vol: .08, tipo: 'triangle', bus: B()}); } }
      if (scegli && s % 4 === 0) tono(t, {f0: 1700, dur: .03, vol: .05, att: .001, bus: B()});          // legnetto: tic-tac della scelta
      // melodia: marimba sempre (piano nel menu), banjo che la raddoppia nel pieno
      if (s % 2 === 0) { const nota = MELO[giro][bar][s / 2]; if (nota >= 0) { const f = hzM(SCALA_M[nota] + 12); marimba(t, f, menu ? .07 : scegli ? .05 : .09, B()); if (pieno) pizzico(t + .005, f, .25, .05 + .03 * liv, B(), 3500); } }
      // accordo di fondo (pad morbido): sul primo di ogni battuta
      if (s === 0) for (const k of [0, 3, 7]) tono(t, {f0: hzM(basso + 12 + k + (k === 3 ? 0 : 0)), dur: sedic * 15, vol: menu ? .025 : .03, tipo: 'triangle', lp: 900, lp1: 400, att: .3, bus: B()});
      // rane-tamburo nel pieno, rullo nel duello/finale
      if (pieno && (s === 6 || s === 15)) ranaTamburo(t, 140 + (s === 15 ? 30 : 0), .05 + .03 * liv, B());
      if (duello && s >= 12) ranaTamburo(t, 160 + s * 6, .05, B());
      // lamento di slide alla fine del giro, solo nel duello/finale
      if (duello && s === 0 && bar === 3) tono(t, {f0: hzM(76), f1: hzM(81), dur: sedic * 12, vol: .045, tipo: 'sawtooth', lp: 1800, vib: [5.5, 6], glide: sedic * 3, att: .08, bus: B()});
      MUS_T += sedic; PASSO_MUS++;
    }
  }, 120);
}
// il pubblico: applausi fatti di tanti piccoli battiti di mani, «ooh» con una formante che scende
function pubblico(forza, ola, uuh) {
  CHEER = Math.min(1.4, CHEER + forza); if (ola && !OPZ.rm) OLA = performance.now() / 1000;
  if (OPZ.muto) return;
  try { const a = ac(), n = a.currentTime;
    if (uuh) { if (!voce('folla', 1.5)) return; sbuffo(n, {dur: 1.5, vol: .5, f0: 520, f1: 260, q: 4, att: .25, bus: MIX.tifo, rate: .7}); sbuffo(n, {dur: 1.4, vol: .3, f0: 900, f1: 500, q: 3, att: .25, bus: MIX.tifo, rate: .7}); return; }
    if (!voce('folla', 1 + forza)) return;
    const mani = Math.round(8 + 18 * Math.min(1, forza)); for (let k = 0; k < mani; k++) sbuffo(n + Math.random() * (.6 + forza), {dur: .035, vol: .06 + .08 * Math.random(), f0: 1100 + Math.random() * 1400, q: 1.4, bus: MIX.tifo});
    { const g0 = MIX.sfx; MIX.sfx = MIX.tifo; const rane = Math.round(3 + 9 * Math.min(1, forza)); for (let k = 0; k < rane; k++) RICETTE.gracida(n + Math.random() * (.5 + forza * .8), .5 + Math.random() * .5, .8 + Math.random() * .7); MIX.sfx = g0; }
    sbuffo(n, {dur: 1 + forza, vol: .2 + .25 * Math.min(1, forza), f0: 800, f1: 1100, q: 1.2, att: .15, bus: MIX.tifo});
  } catch (e) {}
}
function duck(s) { if (!MIX || OPZ.muto) return; const g = MIX.mus.gain, n = AC.currentTime; g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(MUSV * .3, n + .08); g.linearRampToValueAtTime(MUSV, n + (s || 1.2)); }
function vibra(ms, forte) { if (OPZ.rm) return; try { const tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.HapticFeedback; if (tg) tg.impactOccurred(forte ? 'heavy' : 'medium'); else if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) {} }
function muto(v) { OPZ.muto = v; scrivi('muto', v ? '1' : '0'); if (MIX) MIX.m.gain.value = v ? 0 : .8; $('muto').style.opacity = v ? .4 : 1; }
/* ---------------- simboli ---------------- */
function tela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function freccia(g, x1, y1, x2, y2, w) {
  g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1), h = w * 2;
  g.beginPath(); g.moveTo(x2 + Math.cos(a) * h * .6, y2 + Math.sin(a) * h * .6); g.lineTo(x2 + Math.cos(a + 2.5) * h, y2 + Math.sin(a + 2.5) * h); g.lineTo(x2 + Math.cos(a - 2.5) * h, y2 + Math.sin(a - 2.5) * h); g.fill();
}
function glifo(g, t, x, y, r, col) {
  const w = r * .17, k = r * .7, cc = col || (t === 'jackpot' ? '#7a4a00' : '#fff'); g.fillStyle = cc; g.strokeStyle = cc; g.lineJoin = 'round'; g.lineCap = 'round';
  const fr = (a, b, c, d) => freccia(g, a, b, c, d, w);
  if (t === 'riga') { fr(x - k * .15, y, x - k, y); fr(x + k * .15, y, x + k, y); }
  else if (t === 'colonna') { fr(x, y - k * .15, x, y - k); fr(x, y + k * .15, x, y + k); }
  else if (t === 'croce') { fr(x, y, x - k, y); fr(x, y, x + k, y); fr(x, y, x, y - k); fr(x, y, x, y + k); }
  else if (t === 'bomba') { g.beginPath(); for (let i = 0; i < 16; i++) { const rr = (i % 2 ? .4 : .95) * k, a = i * Math.PI / 8; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  else if (t === 'gelo') { g.lineWidth = w * .75; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(a) * k, y - Math.sin(a) * k); g.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); g.stroke(); } }
  else if (t === 'onda') { g.lineWidth = w * .7; for (const rr of [.35, .65, .95]) { g.beginPath(); g.arc(x, y, k * rr, -.9, .9); g.stroke(); g.beginPath(); g.arc(x, y, k * rr, Math.PI - .9, Math.PI + .9); g.stroke(); } }
  else if (t === 'loto') { g.beginPath(); g.moveTo(x, y + k * .8); g.bezierCurveTo(x - k * 1.25, y - k * .1, x - k * .65, y - k * 1.05, x, y - k * .45); g.bezierCurveTo(x + k * .65, y - k * 1.05, x + k * 1.25, y - k * .1, x, y + k * .8); g.fill(); }
  else if (t === 'scudo') { g.beginPath(); g.moveTo(x, y - k); g.lineTo(x + k * .8, y - k * .65); g.quadraticCurveTo(x + k * .8, y + k * .55, x, y + k); g.quadraticCurveTo(x - k * .8, y + k * .55, x - k * .8, y - k * .65); g.closePath(); g.fill(); }
  else if (t === 'molla') { g.lineWidth = w * .75; g.beginPath(); for (let i = 0; i <= 6; i++) g.lineTo(x + (i % 2 ? k * .55 : -k * .55), y + k * .8 - i * k * .27); g.stroke(); }
  else if (t === 'patata') { g.beginPath(); g.arc(x - k * .1, y + k * .15, k * .62, 0, 6.28); g.fill(); g.lineWidth = w * .6; g.beginPath(); g.moveTo(x + k * .25, y - k * .35); g.quadraticCurveTo(x + k * .6, y - k * .9, x + k * .85, y - k * .7); g.stroke(); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(x + k * .9, y - k * .72, k * .17, 0, 6.28); g.fill(); }
  else if (t === 'trampolino') { g.lineWidth = w * .75; g.beginPath(); g.moveTo(x - k, y + k * .55); g.quadraticCurveTo(x, y + k * .95, x + k, y + k * .55); g.stroke(); fr(x, y + k * .3, x, y - k * .95); }
  else if (t === 'calamita') { g.lineWidth = w * 1.3; g.lineCap = 'butt'; g.beginPath(); g.arc(x, y - k * .1, k * .58, Math.PI, 0, true); g.stroke(); g.fillRect(x - k * .58 - w * .65, y - k * .1, w * 1.3, k * .7); g.fillRect(x + k * .58 - w * .65, y - k * .1, w * 1.3, k * .7); }
  else if (t === 'specchio') { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g.lineTo(x + Math.cos(a) * k * .85, y + Math.sin(a) * k * .85); } g.closePath(); g.globalAlpha *= .85; g.fill(); g.globalAlpha /= .85; g.strokeStyle = '#7a8ab0'; g.lineWidth = w * .5; g.beginPath(); g.moveTo(x - k * .35, y + k * .2); g.lineTo(x + k * .1, y - k * .45); g.stroke(); }
  else if (t === 'jackpot') { g.beginPath(); for (let i = 0; i < 10; i++) { const rr = (i % 2 ? .42 : .98) * k, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
}
// targa del potere: forma e colore dicono DOVE colpisce (linea, croce, 3x3, attorno, 5x5) e la famiglia; sopra l'icona dipinta
const IMGIC = {};
function targa(g, t, x, y, r) {
  const c = TC[t]; g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  const giro = (n, r1, r2, ruota) => { g.beginPath(); for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * 6.2832 + (ruota || 0), rr = k % 2 ? r2 : r1; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
  const capsula = (w, h) => { const rr = Math.min(w, h) / 2; g.beginPath(); g.moveTo(x - w / 2 + rr, y - h / 2); g.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, rr); g.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, rr); g.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, rr); g.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, rr); g.closePath(); };
  if (t === 'riga') capsula(r * 2, r * 1.2);
  else if (t === 'colonna') capsula(r * 1.2, r * 2);
  else if (t === 'croce') { const a = r, b = r * .42; g.beginPath(); g.moveTo(x - b, y - a); g.lineTo(x + b, y - a); g.lineTo(x + b, y - b); g.lineTo(x + a, y - b); g.lineTo(x + a, y + b); g.lineTo(x + b, y + b); g.lineTo(x + b, y + a); g.lineTo(x - b, y + a); g.lineTo(x - b, y + b); g.lineTo(x - a, y + b); g.lineTo(x - a, y - b); g.lineTo(x - b, y - b); g.closePath(); }
  else if (t === 'bomba') giro(8, r, r * .7, Math.PI / 8);
  else if (t === 'patata') giro(12, r, r * .8);
  else if (t === 'fauci') giro(11, r, r * .72, .1);
  else if (t === 'corrente') capsula(r * 2, r * 1.2);
  else if (t === 'pantano') { g.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * 6.2832, rr = r * (.86 + .12 * Math.sin(a * 4 + 1) + .05 * Math.sin(a * 9)); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
  else if (t === 'jackpot') giro(3, r, r, Math.PI / 6);
  else if (t === 'gelo') { g.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * 6.2832, rr = r * (.88 + .1 * Math.sin(a * 5) + .04 * Math.sin(a * 11)); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
  else { g.beginPath(); g.arc(x, y, r * .94, 0, 6.2832); }
  const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r * 1.1); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.18, c); gr.addColorStop(1, c);
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = r * .18; g.shadowOffsetY = r * .05; g.fillStyle = gr; g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = Math.max(1.5, r * .09); g.strokeStyle = 'rgba(255,255,255,.95)'; g.stroke();
  g.lineWidth = Math.max(1, r * .035); g.strokeStyle = 'rgba(10,20,20,.55)'; g.stroke();
  // segni dell'area: frecce bianche per i getti, anelli per ondata e risucchio
  g.fillStyle = '#fff'; g.strokeStyle = '#fff';
  const punta = (px, py, a) => { const h = r * .26; g.beginPath(); g.moveTo(px + Math.cos(a) * h, py + Math.sin(a) * h); g.lineTo(px + Math.cos(a + 2.4) * h * .8, py + Math.sin(a + 2.4) * h * .8); g.lineTo(px + Math.cos(a - 2.4) * h * .8, py + Math.sin(a - 2.4) * h * .8); g.closePath(); g.fill(); };
  if (t === 'riga') { punta(x - r * .78, y, Math.PI); punta(x + r * .78, y, 0); }
  if (t === 'colonna') { punta(x, y - r * .78, -Math.PI / 2); punta(x, y + r * .78, Math.PI / 2); }
  if (t === 'croce') { punta(x - r * .78, y, Math.PI); punta(x + r * .78, y, 0); punta(x, y - r * .78, -Math.PI / 2); punta(x, y + r * .78, Math.PI / 2); }
  if (t === 'onda') { for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832; punta(x + Math.cos(a) * r * .78, y + Math.sin(a) * r * .78, a); } }
  if (t === 'corrente') { for (const sx of [-1, 1]) for (const k of [.45, .78]) punta(x + sx * r * k, y, sx > 0 ? 0 : Math.PI); }
  if (t === 'fauci' || t === 'pantano') { g.lineWidth = Math.max(2, r * .1); g.setLineDash([r * .18, r * .14]); g.strokeStyle = 'rgba(255,214,60,.95)'; g.beginPath(); g.arc(x, y, r * .62, 0, 6.2832); g.stroke(); g.setLineDash([]); }
  if (t === 'calamita') { g.lineWidth = r * .07; g.beginPath(); for (let k = 0; k <= 60; k++) { const a = k / 60 * 6.2832 * 1.6, rr = r * (.85 - k / 60 * .35); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); }
  g.restore();
}
function simbolo(g, t, x, y, r, alpha) {
  if (!TC[t]) return; g.save(); g.globalAlpha = alpha == null ? 1 : alpha;
  targa(g, t, x, y, r);
  const im = IMGIC[ICONA[t]], lungo = t === 'riga' || t === 'colonna' || t === 'croce', s = r * (lungo ? 1.15 : 1.5);
  if (im) { g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = r * .14; g.shadowOffsetY = r * .04; g.drawImage(im, x - s / 2, y - s / 2, s, s); }
  else if (t === 'fauci') {   // le fauci: due file di denti bianchi che si chiudono
    g.fillStyle = '#2a0008'; g.beginPath(); g.ellipse(x, y, r * .5, r * .3, 0, 0, 6.2832); g.fill(); g.fillStyle = '#fff';
    for (let k = 0; k < 5; k++) { const tx = x - r * .4 + k * r * .2; g.beginPath(); g.moveTo(tx - r * .08, y - r * .28); g.lineTo(tx + r * .08, y - r * .28); g.lineTo(tx, y - r * .02); g.fill(); g.beginPath(); g.moveTo(tx - r * .08 + r * .1, y + r * .28); g.lineTo(tx + r * .08 + r * .1, y + r * .28); g.lineTo(tx + r * .1, y + r * .02); g.fill(); } }
  else if (t === 'onda' || t === 'corrente') { g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = r * .1; g.lineCap = 'round';
    for (const k of [-.18, .12]) { g.beginPath(); for (let a = 0; a <= 20; a++) { const u = a / 20; g.lineTo(x - r * .45 + u * r * .9, y + k * r + Math.sin(u * 6.2832) * r * .1); } g.stroke(); } }
  else glifo(g, t, x, y, r * .8, '#fff');
  g.restore();
}
const TEXDISCO = {};
function discoTex(t) {
  if (TEXDISCO[t]) return TEXDISCO[t];
  const c = tela(256, 256), g = c.getContext('2d'); g.shadowColor = TC[t]; g.shadowBlur = 20; simbolo(g, t, 128, 128, 100);
  const x = new THREE.CanvasTexture(c); x.encoding = THREE.sRGBEncoding; x.anisotropy = 8; TEXDISCO[t] = x; return x;
}
const FT = '"Inter Tight", "Inter", sans-serif', FBODY = '"Inter", sans-serif';
function testoTex(txt, col, w, h, size) {
  const K = 2, c = tela((w || 256) * K, (h || 64) * K), g = c.getContext('2d'); g.scale(K, K);
  let fs = size || 40; g.font = `800 ${fs}px ${FT}`;
  const max = (w || 256) * .92; while (g.measureText(txt).width > max && fs > 10) { fs -= 2; g.font = `800 ${fs}px ${FT}`; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const x0 = (w || 256) / 2, y0 = (h || 64) / 2 + fs * .04;
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = fs * .18; g.shadowOffsetY = fs * .04;
  g.lineWidth = fs * .16; g.strokeStyle = 'rgba(8,6,20,.82)'; g.strokeText(txt, x0, y0);
  g.shadowColor = 'transparent'; g.fillStyle = col || '#fff'; g.fillText(txt, x0, y0);
  const x = new THREE.CanvasTexture(c); x.encoding = THREE.sRGBEncoding; x.anisotropy = 4; return x;
}
const TEX_ESAGONI = (() => { const c = tela(256, 256), g = c.getContext('2d'); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3;
  const r = 18; for (let y = 0; y < 300; y += r * 1.5) for (let x = 0; x < 300; x += r * Math.sqrt(3)) { const ox = x + ((y / (r * 1.5)) % 2 ? r * .87 : 0); g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g.lineTo(ox + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t; })();
const TEX_CREPE = (() => { const c = tela(256, 256), g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 4;
  for (let k = 0; k < 7; k++) { g.beginPath(); let x = 128, y = 128; g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += Math.cos(k + s * .4) * 22 + (Math.random() - .5) * 18; y += Math.sin(k * 1.7 + s * .3) * 22 + (Math.random() - .5) * 18; g.lineTo(x, y); } g.stroke(); }
  return new THREE.CanvasTexture(c); })();

/* ---------------- scena ---------------- */
const scena = new THREE.Scene();
const NEBBIA0 = .016; scena.fog = new THREE.FogExp2(0x0a0618, NEBBIA0);
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(1.75, devicePixelRatio || 1)); renderer.outputEncoding = THREE.sRGBEncoding; renderer.setClearColor(0, 0);
document.body.insertBefore(renderer.domElement, document.body.children[1]);
renderer.domElement.style.cssText = 'position:fixed;inset:0;display:block';
const cam = new THREE.PerspectiveCamera(38, 1, .1, 300);
scena.add(new THREE.HemisphereLight(0xcfeeff, 0x0b2a22, .85));
const sole = new THREE.DirectionalLight(0xe6f4ff, .75); sole.position.set(-6, 14, 6); scena.add(sole);
const FARI = [];
for (const [c, x] of [[0x5fe0c0, -9], [0x7fc8ff, 9], [0xffc46a, 0]]) { const s = new THREE.SpotLight(c, 1.4, 60, .35, .5, 1); s.position.set(x, 18, -6); scena.add(s); scena.add(s.target); FARI.push(s); }
const lampoLuce = new THREE.PointLight(0xffffff, 0, 18, 2); scena.add(lampoLuce);
const P = 1.4;
let W = 6, H = 6, ROT = false;
const mondo = new THREE.Group(); scena.add(mondo);
// l'asse che va in profondita' e' un po' piu' largo (PZ): con la camera inclinata la griglia sullo schermo resta quadrata e il campo e' piu' alto
// sul telefono le file sono «corsie» separate da un filo d'acqua: il campo occupa l'altezza dello schermo
let PZ = P * 1.12;
const pos = (x, y) => ROT ? new THREE.Vector3((y - (H - 1) / 2) * P, 0, -(x - (W - 1) / 2) * PZ) : new THREE.Vector3((x - (W - 1) / 2) * P, 0, (y - (H - 1) / 2) * PZ);
const vuoto = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshBasicMaterial({color: 0x05020c, transparent: true, opacity: .85}));
vuoto.rotation.x = -Math.PI / 2; vuoto.position.y = -7; scena.add(vuoto);
const bordoVuoto = new THREE.Mesh(new THREE.TorusGeometry(7.4, .06, 8, 96), new THREE.MeshBasicMaterial({color: 0x3fe0e0}));
bordoVuoto.rotation.x = Math.PI / 2; bordoVuoto.position.y = -1.2; scena.add(bordoVuoto);
// luci che corrono attorno al palco
// (una sola chiamata di disegno invece di 64: InstancedMesh con un colore per lucina)
const NCAT = 64, CATENA_I = new THREE.InstancedMesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({color: 0xffffff}), NCAT), CATENA = [CATENA_I];
CATENA_I.frustumCulled = false; for (let k = 0; k < NCAT; k++) CATENA_I.setColorAt(k, new THREE.Color(0xffffff)); scena.add(CATENA_I);
function posCatena() { const a = pos(-0.6, -0.6), b = pos(W - .4, H - .4); const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), z0 = Math.min(a.z, b.z), z1 = Math.max(a.z, b.z);
  const per = 2 * (x1 - x0 + z1 - z0), M = new THREE.Matrix4(); for (let k = 0; k < NCAT; k++) { let d = k / NCAT * per; let x, z;
    if (d < x1 - x0) { x = x0 + d; z = z0; } else if ((d -= x1 - x0) < z1 - z0) { x = x1; z = z0 + d; } else if ((d -= z1 - z0) < x1 - x0) { x = x1 - d; z = z1; } else { d -= x1 - x0; x = x0; z = z1 - d; }
    CATENA_I.setMatrixAt(k, M.makeTranslation(x, -.25, z)); } CATENA_I.instanceMatrix.needsUpdate = true; }
// pubblico
let CHEER = .1, OLA = -99;
// pubblico: corpo + testa in una geometria sola (prima erano cilindri), sempre una chiamata di disegno
const NP = 760, folla = new THREE.InstancedMesh(unisciGeo([new THREE.CylinderGeometry(.11, .16, .44, 6).translate(0, -.03, 0), new THREE.SphereGeometry(.105, 6, 4).translate(0, .3, 0)]), new THREE.MeshLambertMaterial(), NP);
const FB = [], tmp = new THREE.Object3D(), colTmp = new THREE.Color();
const palette = [0xb06bff, 0x3fe0e0, 0xffcf6a, 0xff6f7d, 0x9aa3ab, 0x58d6a8, 0x59b6ff, 0xffffff];
for (let i = 0; i < NP; i++) {
  const fila = i % 7, a = Math.PI * 2 * Math.random(), r = 11 + fila * .7;
  FB.push({x: Math.cos(a) * r, z: Math.sin(a) * r * .8, y: -1.4 + fila * .45, f: 2 + Math.random() * 3, ph: Math.random() * 6, a});
  colTmp.set(palette[i % palette.length]).multiplyScalar(.07 + Math.random() * .09); folla.setColorAt(i, colTmp);
}
scena.add(folla);
const schermi = [];
for (const x of [-9, 9]) {
  const c = tela(1024, 512), t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({map: t, transparent: true, opacity: .9}));
  m.position.set(x, 4.5, -12); m.lookAt(0, 3, 4); scena.add(m); schermi.push({c, t});
}
function schermo(t1, t2, col) {
  for (const s of schermi) { const g = s.c.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); g.fillStyle = '#0b0718'; g.fillRect(0, 0, 512, 256); g.strokeStyle = col || '#b06bff'; g.lineWidth = 6; g.strokeRect(8, 8, 496, 240);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col || '#fff';
    let f = 84; g.font = `italic 900 ${f}px ${FT}`; while (g.measureText(t1).width > 450 && f > 30) { f -= 4; g.font = `italic 900 ${f}px ${FT}`; }
    g.fillText(t1, 256, t2 ? 108 : 132);
    if (t2) { let f2 = 34; g.font = `600 ${f2}px ${FBODY}`; while (g.measureText(t2).width > 450 && f2 > 16) { f2 -= 2; g.font = `600 ${f2}px ${FBODY}`; } g.fillStyle = '#cfd6dc'; g.fillText(t2, 256, 190); } s.t.needsUpdate = true; }
}
schermo('HOP CLASH', '');

/* ---------------- AMBIENTE: gorgo nel vuoto, anello dell'arena, fasci di luce, pulviscolo, luci del pubblico ---------------- */
const AMB = new THREE.Group(); scena.add(AMB);
// il gorgo nel vuoto: due dischi a spirale che girano in versi opposti (chi cade ci finisce dentro)
function texGorgo(bracci, cols, giri) {
  const c = tela(512, 512), g = c.getContext('2d'); g.translate(256, 256);
  const r0 = g.createRadialGradient(0, 0, 0, 0, 0, 256); r0.addColorStop(0, 'rgba(255,255,255,.5)'); r0.addColorStop(.12, 'rgba(180,120,255,.25)'); r0.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r0; g.fillRect(-256, -256, 512, 512);
  g.lineCap = 'round';
  for (let b = 0; b < bracci; b++) for (let k = 0; k < 140; k++) { const t = k / 140, a = b / bracci * 6.283 + t * giri * 6.283, r = 10 + t * 240;
    g.strokeStyle = cols[b % cols.length]; g.globalAlpha = Math.sin(t * Math.PI) * .45; g.lineWidth = 1.5 + t * 8; g.beginPath(); g.arc(0, 0, r, a, a + .07); g.stroke(); }
  g.globalAlpha = 1; return new THREE.CanvasTexture(c);
}
const gorgo = new THREE.Mesh(new THREE.CircleGeometry(15, 64), new THREE.MeshBasicMaterial({map: texGorgo(5, ['#8b5cff', '#3fe0e0', '#b06bff'], 1.3), transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending, fog: false}));
gorgo.rotation.x = -Math.PI / 2; gorgo.position.y = -6.9; AMB.add(gorgo);
const gorgo2 = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshBasicMaterial({map: texGorgo(3, ['#ff6fd8', '#59b6ff'], .8), transparent: true, opacity: .2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false}));
gorgo2.rotation.x = -Math.PI / 2; gorgo2.position.y = -6.6; AMB.add(gorgo2);
// anello dell'arena attorno al vuoto: tacche LED e un cerchio sottile, piu' due comete di luce che girano
function texAnello(cometa) {
  const R = cometa ? 256 : 512, c = tela(R * 2, R * 2), g = c.getContext('2d'); g.translate(R, R); const K = R / 9.2;
  if (cometa) { for (let k = 0; k < 2; k++) for (let j = 0; j < 60; j++) { const a = k * Math.PI + j * .012; g.strokeStyle = `rgba(255,255,255,${Math.pow(j / 60, 2)})`; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 7.62 * K, a, a + .014); g.stroke(); } }
  else {
    for (let k = 0; k < 120; k++) { const a = k / 120 * 6.283; g.strokeStyle = `hsl(${185 + 90 * (.5 + .5 * Math.sin(a * 2))},90%,${k % 5 ? 55 : 75}%)`; g.globalAlpha = k % 5 ? .55 : .95; g.lineWidth = k % 5 ? 4 : 7;
      g.beginPath(); g.moveTo(Math.cos(a) * 7.8 * K, Math.sin(a) * 7.8 * K); g.lineTo(Math.cos(a) * (k % 5 ? 8.15 : 8.35) * K, Math.sin(a) * (k % 5 ? 8.15 : 8.35) * K); g.stroke(); }
    g.globalAlpha = .7; g.strokeStyle = '#b06bff'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 8.75 * K, 0, 6.283); g.stroke();
    g.globalAlpha = .35; g.setLineDash([6, 14]); g.strokeStyle = '#3fe0e0'; g.beginPath(); g.arc(0, 0, 9.0 * K, 0, 6.283); g.stroke(); g.setLineDash([]);
    const gr = g.createRadialGradient(0, 0, 7.3 * K, 0, 0, 7.75 * K); gr.addColorStop(0, 'rgba(63,224,224,0)'); gr.addColorStop(.5, 'rgba(63,224,224,.28)'); gr.addColorStop(1, 'rgba(63,224,224,0)'); g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 7.75 * K, 0, 6.283); g.arc(0, 0, 7.3 * K, 0, 6.283, true); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
const GEO_ANELLO = new THREE.RingGeometry(7.2, 9.2, 128, 1).rotateX(-Math.PI / 2);
const anelloArena = new THREE.Mesh(GEO_ANELLO, new THREE.MeshBasicMaterial({map: texAnello(false), transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending}));
anelloArena.position.y = -1.22; AMB.add(anelloArena);
const comete = new THREE.Mesh(GEO_ANELLO, new THREE.MeshBasicMaterial({map: texAnello(true), color: 0x9ff6ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
comete.position.y = -1.21; AMB.add(comete);
// fasci di luce volumetrici dai fari del tetto (dietro al palco, non passano sopra ai concorrenti)
const VS_FASCIO = 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
const FS_FASCIO = 'uniform vec3 c; uniform float a; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN, vV)), 1.8); gl_FragColor = vec4(c, a * f * vY * (1.2 - vY * .4)); }';
const GEO_CONO = new THREE.ConeGeometry(3.2, 24, 28, 1, true).translate(0, -12, 0);
const FASCI = [[-13, 15, -11, 0xb06bff, 0], [-5.5, 16, -15, 0x3fe0e0, 1.7], [5.5, 16, -15, 0xffcf6a, 3.1], [13, 15, -11, 0x3fe0e0, 4.4], [0, 17, -18, 0xff6fd8, 5.6]].map(([x, y, z, col, ph]) => {
  const m = new THREE.Mesh(GEO_CONO, new THREE.ShaderMaterial({uniforms: {c: {value: new THREE.Color(col)}, a: {value: .1}}, vertexShader: VS_FASCIO, fragmentShader: FS_FASCIO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}));
  m.position.set(x, y, z); m.userData.ph = ph; AMB.add(m); return m; });
// pulviscolo luminoso nell'aria e luci dei telefoni nel pubblico: un solo shader a punti che brillano
const VS_PUNTI = 'uniform float t; uniform float px; attribute float ph; attribute vec3 colore; varying float vA; varying vec3 vC; void main(){ vec3 p = position; p.y += sin(t * .5 + ph * 6.28) * .35; vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = (1.6 + 2.6 * fract(ph * 7.31)) * px * (22. / -mv.z); vA = .25 + .75 * pow(.5 + .5 * sin(t * (1.2 + ph * 2.5) + ph * 40.), 4.); vC = colore; gl_Position = projectionMatrix * mv; }';
const FS_PUNTI = 'uniform float forza; varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .05, d); gl_FragColor = vec4(vC, a * vA * forza); }';
const U_PUNTI = {t: {value: 0}, px: {value: 1}};
function punti(lista, forza) {
  const g = new THREE.BufferGeometry(), n = lista.length, Pp = new Float32Array(n * 3), C = new Float32Array(n * 3), F = new Float32Array(n), c = new THREE.Color();
  lista.forEach(([x, y, z, col], k) => { Pp.set([x, y, z], k * 3); c.set(col); C.set([c.r, c.g, c.b], k * 3); F[k] = Math.random(); });
  g.setAttribute('position', new THREE.BufferAttribute(Pp, 3)); g.setAttribute('colore', new THREE.BufferAttribute(C, 3)); g.setAttribute('ph', new THREE.BufferAttribute(F, 1));
  const m = new THREE.Points(g, new THREE.ShaderMaterial({uniforms: {t: U_PUNTI.t, px: U_PUNTI.px, forza: {value: forza}}, vertexShader: VS_PUNTI, fragmentShader: FS_PUNTI, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  m.frustumCulled = false; AMB.add(m); return m;
}
const COL_PULV = [0xffe7a8, 0x9ff6ff, 0xd9c6ff, 0xffffff, 0xff9fe0];
const pulviscolo = punti(Array.from({length: 240}, (_, k) => { const a = Math.random() * 6.283, r = 8 + Math.random() * 10; return [Math.cos(a) * r, -1.5 + Math.random() * 10, Math.sin(a) * r * .85, COL_PULV[k % 5]]; }), .75);
const lucette = punti(FB.filter((b, k) => k % 4 === 0).map((b, k) => [b.x, b.y + .55, b.z, [0xffffff, 0x9ff6ff, 0xffd27a, 0xff9fe0][k % 4]]), 1.1);
let GORGO_LAMPO = 0; const QUAL = {n: 0, t: 0, liv: 0};
function animaAmbiente(dt, tt) {
  GORGO_LAMPO = Math.max(0, GORGO_LAMPO - dt * 1.2); lucette.material.uniforms.forza.value = .7 + .5 * CHEER;
  U_PUNTI.t.value = tt; U_PUNTI.px.value = renderer.getPixelRatio();
  gorgo.rotation.z = tt * .12; gorgo2.rotation.z = -tt * .2; gorgo.material.opacity = .2 + .05 * Math.sin(tt * .8) + .5 * GORGO_LAMPO; gorgo2.material.opacity = .2 + .45 * GORGO_LAMPO; gorgo2.scale.setScalar(1 + .25 * GORGO_LAMPO);
  anelloArena.rotation.y = tt * .03; comete.rotation.y = -tt * (.5 + CHEER * .5);
  pulviscolo.rotation.y = tt * .015; animaStagno(dt, tt);
  for (const m of FASCI) { const p = m.userData.ph; m.rotation.z = Math.sin(tt * .23 + p) * .32; m.rotation.x = .25 + Math.sin(tt * .17 + p * 1.3) * .2; m.material.uniforms.a.value = (.1 + .06 * CHEER) * (EVENTO === 'nebbia' ? 1.6 : 1); }
  // sfondo dipinto: un filo di parallasse con la telecamera e un respiro lentissimo
  const sx = Math.round(Math.sin(tt * .05) * 10 - VISTA.yaw * 70 - (TIT ? TIT.yaw * 260 : 0));   // splash 17/11: nel titolo il quadro segue la camera if (sx !== animaAmbiente.q) { animaAmbiente.q = sx; const f = $('fondo'); if (f) f.style.transform = `translate3d(${sx}px,0,0) scale(1.08)`; }
  // qualita' automatica: se il telefono fatica (media < 40 fps per 4 s) si abbassa la risoluzione e si spengono fasci e pulviscolo
  QUAL.n++; QUAL.t += dt; if (QUAL.t > 4) { const f = QUAL.n / QUAL.t; QUAL.n = 0; QUAL.t = 0; if (f < 40 && QUAL.liv < 2 && document.visibilityState === 'visible') { QUAL.liv++; renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() - .35)); renderer.setSize(innerWidth, innerHeight); if (QUAL.liv === 2) { for (const m of FASCI) m.visible = false; pulviscolo.visible = false; lucciole.visible = false; nebbiolina.visible = false; } } }
}

/* ---------------- STAGNO (passata «pro» 17/11): acqua viva, cascata sul bordo che cade, lucciole, canne, ninfee di contorno ----------------
   Lo stadio al neon resta nel codice ma spento: il mondo e' il bayou di CONCEPT.md. L'acqua e' semitrasparente e sfuma nel quadro dipinto. */
for (const m of [vuoto, bordoVuoto, CATENA_I, folla, gorgo, gorgo2, anelloArena, comete, lucette, ...FASCI]) m.visible = false;
scena.children.filter(c => c.isMesh && c.geometry && c.geometry.type === 'PlaneGeometry' && c.geometry.parameters.width === 6 && c.geometry.parameters.height === 3).forEach(m => { m.visible = false; });   // i due maxischermi
scena.fog.color.set(0x07211f);
const STAGNO = {e: new THREE.Vector2(0, 4), d: new THREE.Vector2(0, 1), largo: 9};
const VS_ACQUA = 'varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }';
const FS_ACQUA = `uniform float t; uniform vec2 e; uniform vec2 d; uniform vec2 c; uniform float R; uniform float lampo; varying vec2 vW;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1.)), f.x), f.y); }
  void main(){
    vec2 dn = normalize(d), tg = vec2(-dn.y, dn.x);
    float s = dot(vW - e, dn);                      // > 0: oltre il ciglio della cascata
    float a1 = dot(vW, tg), a2 = dot(vW, dn);
    float flusso = n2(vec2(a1 * .9, a2 * .45 - t * .5)) * .6 + n2(vec2(a1 * 1.7, a2 * .8 - t * .9)) * .4;
    float onde = sin(a1 * 2.3 + n2(vW * .7 + t * .2) * 5.) * .5 + .5;
    float riga = smoothstep(.62, .9, flusso) * (.4 + .6 * onde);
    vec3 base = mix(vec3(.02, .13, .13), vec3(.03, .24, .22), flusso);
    float luce = pow(n2(vW * 2.1 + vec2(t * .2, -t * .5)), 14.) * 2.;      // puntini bioluminescenti
    vec3 col = base + vec3(.25, .85, .75) * riga * .1 + vec3(.5, 1., .85) * luce * .35 + vec3(.4, .9, 1.) * lampo * .25;
    col += vec3(.45, .95, .9) * smoothstep(-.9, 0., s) * (.25 + .25 * n2(vec2(a1 * 6., t * 4.)));   // schiuma sul ciglio
    float dist = length(vW - c);
    float alfa = (1. - smoothstep(R * .55, R, dist)) * .86 * (1. - smoothstep(-.05, .1, s));
    gl_FragColor = vec4(col, alfa);
  }`;
const acqua = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({uniforms: {t: {value: 0}, e: {value: STAGNO.e}, d: {value: STAGNO.d}, c: {value: new THREE.Vector2()}, R: {value: 11}, lampo: {value: 0}},
  vertexShader: VS_ACQUA, fragmentShader: FS_ACQUA, transparent: true, depthWrite: false}));
acqua.position.y = -.08; acqua.renderOrder = -2; scena.add(acqua);
// la cascata: una tenda d'acqua verticale lungo il ciglio, con strisce che scendono e schiuma in cima
const FS_CASCATA = `uniform float t; uniform vec2 dim; uniform float hq; varying vec2 vU;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1.)), f.x), f.y); }
  float fbm(vec2 p){ float a = .5, s = 0.; for (int k = 0; k < 4; k++) { s += a * n2(p); p = p * 2.03 + vec2(17.1, 9.3); a *= .5; } return s; }
  void main(){
    vec2 p = vec2(vU.x * dim.x, (1. - vU.y) * dim.y);                 // coordinate vere: x lungo il ciglio, y quanto e' gia' caduta
    float w = fbm(vec2(p.x * .55, p.y * .22 - t * .35));               // deformazione lenta delle strisce
    float s1 = fbm(vec2(p.x * 2.1 + w * 1.6, p.y * .42 - t * 2.1));
    float s2 = hq > .5 ? fbm(vec2(p.x * 5.3 - w * 1.2, p.y * .95 - t * 3.3)) : .5;
    float strie = smoothstep(.48, .86, s1 * .62 + s2 * .48);
    float lip = 1. - smoothstep(0., .8, p.y);
    vec3 col = mix(vec3(.03, .17, .18), vec3(.16, .52, .52), smoothstep(.25, .85, s1));
    col = mix(col, vec3(.85, 1., .96), clamp(strie * .7 + lip * .65, 0., 1.));
    col *= mix(1.15, .5, smoothstep(0., dim.y * .85, p.y));              // chiara al ciglio, scura mentre cade
    col += vec3(.35, .95, .85) * pow(s2, 7.) * .9 * hq;                    // luccichio
    float a = (.55 + .4 * strie + .3 * lip) * smoothstep(0., .3, vU.y) * smoothstep(0., .06, vU.x) * (1. - smoothstep(.94, 1., vU.x));
    gl_FragColor = vec4(col, min(1., a)); }`;
const cascata = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, -.5, 0), new THREE.ShaderMaterial({uniforms: {t: {value: 0}, dim: {value: new THREE.Vector2(16, 5)}, hq: {value: 1}}, vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: FS_CASCATA, transparent: true, depthWrite: false, side: THREE.DoubleSide}));
cascata.renderOrder = -1; scena.add(cascata);
// schiuma sul ciglio: una fascia bianca orizzontale che ribolle (si vede bene dall'alto)
const schiuma = new THREE.Mesh(new THREE.PlaneGeometry(1, .9).rotateX(-Math.PI / 2).translate(0, 0, .2), new THREE.ShaderMaterial({uniforms: {t: cascata.material.uniforms.t, dim: cascata.material.uniforms.dim}, transparent: true, depthWrite: false,
  vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform float t; uniform vec2 dim; varying vec2 vU;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1.)), f.x), f.y); }
  float fbm(vec2 p){ float a = .5, s = 0.; for (int k = 0; k < 4; k++) { s += a * n2(p); p = p * 2.03 + vec2(17.1, 9.3); a *= .5; } return s; }
    void main(){ vec2 p = vec2(vU.x * dim.x, vU.y * .9);
      float b = fbm(vec2(p.x * 3.2, p.y * 6. + t * 2.6)) * .65 + fbm(vec2(p.x * 7.5 - t * .8, p.y * 12. + t * 4.)) * .45;
      float bordo = .5 + .35 * fbm(vec2(p.x * 1.4, t * .6));               // il bordo della schiuma ondeggia
      float a = smoothstep(.42, .72, b) * (1. - smoothstep(bordo * .9, bordo * .9 + .25, abs(vU.y - .45) * 2.)) * smoothstep(0., .05, vU.x) * (1. - smoothstep(.95, 1., vU.x));
      gl_FragColor = vec4(vec3(.9, 1., .97), a * .9); }`}));
schiuma.renderOrder = 0; scena.add(schiuma);
// nebbiolina in fondo alla cascata e lucciole sopra lo stagno (stesso shader a punti dello stadio)
const COL_LUCC = [0xf6ff8a, 0xd8ff6a, 0xfff2a0, 0x9fffd8];
const lucciole = punti(Array.from({length: 110}, (_, k) => { const a = Math.random() * 6.283, r = 3 + Math.random() * 8; return [Math.cos(a) * r, .6 + Math.random() * 3.6, Math.sin(a) * r, COL_LUCC[k % 4]]; }), 1.15);
const nebbiolina = punti(Array.from({length: 140}, () => [(Math.random() - .5) * 13, -.4 - Math.random() * 2.2, (Math.random() - .5) * 2.5, 0xe6fff8]), 1.3);
pulviscolo.visible = false;
// ninfee di contorno e canne: due InstancedMesh (2 chiamate di disegno in tutto)
const GEO_FOGLIA = (() => { const s = new THREE.Shape(); s.absarc(0, 0, .5, .35, 6.283 - .05, false); s.lineTo(0, 0); const g = new THREE.ShapeGeometry(s, 24); g.rotateX(-Math.PI / 2); return g; })();
const contorno = new THREE.InstancedMesh(GEO_FOGLIA, new THREE.MeshLambertMaterial({color: 0x1e5232, emissive: 0x06180c}), 34); contorno.renderOrder = -1; scena.add(contorno);
const canne = new THREE.InstancedMesh(unisciGeo([new THREE.CylinderGeometry(.025, .035, 2.2, 5).translate(0, 1.1, 0), new THREE.CylinderGeometry(.075, .075, .42, 8).translate(0, 2.0, 0)]), new THREE.MeshLambertMaterial({color: 0x3a5a2a, emissive: 0x0a1608}), 40); scena.add(canne);
function posStagno() {
  // il ciglio sta mezza casella oltre la colonna 0 (quella che cade); la corrente va verso la cascata
  const a = pos(-0.62, 0).add(mondo.position), b = pos(0, 0).sub(pos(1, 0)).normalize(), centro = pos((W - 1) / 2 + .8, (H - 1) / 2).add(mondo.position);
  STAGNO.e.set(a.x, a.z); STAGNO.d.set(b.x, b.z); acqua.material.uniforms.c.value.set(centro.x, centro.z);
  const lato = new THREE.Vector3(-b.z, 0, b.x), largo = (Math.max(W, H) + 6) * P;
  cascata.position.set(a.x, -.06, a.z); cascata.scale.set(largo, 5, 1); cascata.material.uniforms.dim.value.set(largo, 5); cascata.lookAt(a.x + b.x, -.06, a.z + b.z); cascata.rotateX(-.75);
  schiuma.position.set(a.x - b.x * .05, .0, a.z - b.z * .05); schiuma.scale.set(largo, 1, 1); schiuma.lookAt(a.x + b.x, .0, a.z + b.z);
  nebbiolina.position.set(a.x + b.x * .6, 0, a.z + b.z * .6); nebbiolina.rotation.y = Math.atan2(lato.x, lato.z) + Math.PI / 2;
  lucciole.position.set(centro.x, 0, centro.z);
  let r = 13; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  const M = new THREE.Matrix4(), Qr = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3(), lx = (H / 2 + .9) * P, lz = (W / 2 + 2.2) * P;
  for (let k = 0; k < 34; k++) { const sx = k % 2 ? 1 : -1, u = rnd(); const loc = ROT ? new THREE.Vector3(sx * (lx + rnd() * 2.2), 0, (u - .5) * 2 * lz) : new THREE.Vector3((u - .5) * 2 * lz, 0, sx * (lx + rnd() * 2.2));
    V.copy(centro).add(loc); V.y = -.05; if (V.clone().sub(a).dot(b) > -.2) V.y = -9; Qr.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6.28); S.setScalar((.5 + rnd() * .5) * (ROT ? 1 : .7)); contorno.setMatrixAt(k, M.compose(V, Qr, S)); }
  contorno.instanceMatrix.needsUpdate = true;
  for (let k = 0; k < 40; k++) { const sx = k % 2 ? 1 : -1, u = rnd(); const loc = ROT ? new THREE.Vector3(sx * (lx + 1.2 + rnd() * 3), 0, (u - .5) * 2.2 * lz) : new THREE.Vector3((u - .5) * 2.2 * lz, 0, sx * (lx + 1.2 + rnd() * 3));
    V.copy(centro).add(loc); V.y = -.1; if (V.clone().sub(a).dot(b) > -.4) V.y = -12; Qr.setFromEuler(new THREE.Euler((rnd() - .5) * .25, rnd() * 6, (rnd() - .5) * .25)); S.setScalar(.6 + rnd() * .6); canne.setMatrixAt(k, M.compose(V, Qr, S)); }
  canne.instanceMatrix.needsUpdate = true;
}
function animaStagno(dt, tt) {
  acqua.material.uniforms.t.value = tt; cascata.material.uniforms.t.value = tt; cascata.material.uniforms.hq.value = QUAL.liv >= 1 ? 0 : 1;
  if (!OPZ.rm && QUAL.liv < 2 && FASE !== 'menu' && Math.random() < dt * 7) { const v = cascata.localToWorld(new THREE.Vector3(Math.random() - .5, -.1 - Math.random() * .15, 0)); particelle(v, 1 + (Math.random() * 2 | 0), 0xe6fff8, .9, .8, {su: .7, r: .1 + Math.random() * .12, g: 1.5, fumo: Math.random() < .5, cresce: .8}); } acqua.material.uniforms.lampo.value = GORGO_LAMPO;
  lucciole.material.uniforms.forza.value = 1 + .5 * CHEER; lucciole.rotation.y = Math.sin(tt * .05) * .3;
}

/* ---------------- piattaforme ---------------- */
function geoPiattaforma(l, r, h) {
  const s = new THREE.Shape(), a = l / 2;
  s.moveTo(-a + r, -a); s.lineTo(a - r, -a); s.quadraticCurveTo(a, -a, a, -a + r); s.lineTo(a, a - r); s.quadraticCurveTo(a, a, a - r, a); s.lineTo(-a + r, a); s.quadraticCurveTo(-a, a, -a, a - r); s.lineTo(-a, -a + r); s.quadraticCurveTo(-a, -a, -a + r, -a);
  const g = new THREE.ExtrudeGeometry(s, {depth: h, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 2, curveSegments: 6});
  g.rotateX(Math.PI / 2); return g;
}
// mappa «più figa»: ogni piattaforma è la testa di un pilastro che scende nel vuoto (una sola geometria, nessuna chiamata in più);
// le UV mandano la faccia di sopra nella metà alta della texture (pannello con scanalatura luminosa) e i fianchi nella metà bassa
// (bordo chiaro, striscia LED, pilastro che sfuma nel buio). La texture moltiplica il colore e l'emissivo, quindi le tinte di prima restano.
function unisciGeo(gs) {
  const pz = gs.map(g => g.index ? g.toNonIndexed() : g), n = pz.reduce((a, g) => a + g.attributes.position.count, 0);
  const Pp = new Float32Array(n * 3), Nn = new Float32Array(n * 3); let o = 0;
  for (const g of pz) { Pp.set(g.attributes.position.array, o * 3); Nn.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(Pp, 3)); r.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); return r;
}
const PIL_FONDO = .5;
// NINFEA: un disco con la tacca, spesso e smussato, che galleggia (una geometria sola). UV: sopra = meta' alta della texture, bordo = meta' bassa.
function geoPilastro() {
  const R = .64, tacca = .3, s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(Math.cos(tacca / 2) * R * .18, Math.sin(tacca / 2) * R * .18);
  s.absarc(0, 0, R, tacca / 2, 6.2832 - tacca / 2, false); s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, {depth: .1, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 3, curveSegments: 40});
  g.rotateX(Math.PI / 2); g.rotateY(-Math.PI / 2 - .5); g.translate(0, .01, 0);
  const Pa = g.attributes.position, Na = g.attributes.normal, uv = new Float32Array(Pa.count * 2);
  for (let k = 0; k < Pa.count; k++) { const x = Pa.getX(k), y = Pa.getY(k), z = Pa.getZ(k);
    if (Na.getY(k) > .55 && y > .0) { uv[k * 2] = x / 1.42 + .5; uv[k * 2 + 1] = .505 + .49 * (z / 1.42 + .5); }
    else { const t = Math.min(1, Math.max(0, (.06 - y) / (.2))); uv[k * 2] = .5; uv[k * 2 + 1] = .495 - .49 * t; } }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
const rigaFianco = y => Math.round(Math.min(1, Math.max(0, (.1 - y) / .2)) * .98 * 256);
function texPiastra(emis) {
  const c = tela(256, 512), g = c.getContext('2d');
  // faccia di sopra (righe 0..255): foglia con le venature dal centro e un bordo chiaro che brilla appena (bioluminescenza)
  g.fillStyle = emis ? '#101010' : '#9fc9a2'; g.fillRect(0, 0, 256, 256);
  const cx = 128, cy = 128, R = .64 / 1.42 * 256;
  const gr = g.createRadialGradient(cx - 20, cy - 24, 6, cx, cy, R); gr.addColorStop(0, emis ? '#202020' : '#e8f6dc'); gr.addColorStop(.7, emis ? '#141414' : '#b9dcb0'); gr.addColorStop(1, emis ? '#3a3a3a' : '#8fbf8c');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R + 4, 0, 6.29); g.fill();
  g.strokeStyle = emis ? 'rgba(255,255,255,.18)' : 'rgba(40,80,40,.28)'; g.lineWidth = 2.2;
  for (let k = 0; k < 13; k++) { const a = k / 13 * 6.283 + .2; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a + .25) * R * .5, cy + Math.sin(a + .25) * R * .5, cx + Math.cos(a) * R * .95, cy + Math.sin(a) * R * .95); g.stroke(); }
  if (!emis) { g.fillStyle = 'rgba(255,255,255,.07)'; for (let k = 0; k < 30; k++) { g.beginPath(); g.arc(cx + (Math.random() - .5) * R * 1.6, cy + (Math.random() - .5) * R * 1.6, 2 + Math.random() * 5, 0, 6.3); g.fill(); } }
  g.lineWidth = emis ? 7 : 5; g.strokeStyle = emis ? '#ffffff' : '#d9f2cf'; g.beginPath(); g.arc(cx, cy, R - 3, 0, 6.29); g.stroke();
  // bordo (righe 256..511): orlo chiaro in alto, poi verde scuro che va nell'acqua
  const gs = g.createLinearGradient(0, 256, 0, 512);
  if (emis) { gs.addColorStop(0, '#ffffff'); gs.addColorStop(.15, '#5a5a5a'); gs.addColorStop(.5, '#101010'); gs.addColorStop(1, '#000'); }
  else { gs.addColorStop(0, '#e6f6d8'); gs.addColorStop(.2, '#7fb27a'); gs.addColorStop(.7, '#2c5a32'); gs.addColorStop(1, '#0d2414'); }
  g.fillStyle = gs; g.fillRect(0, 256, 256, 256);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
const TEX_PIASTRA = texPiastra(false), TEX_PIASTRA_E = texPiastra(true);
// fascio di luce sulle caselle con un gadget: si vede da lontano cosa c'è da prendere
const TEX_FASCIO = (() => { const c = tela(8, 128), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.55, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); return new THREE.CanvasTexture(c); })();
const GEO_FASCIO = new THREE.CylinderGeometry(.36, .44, .9, 20, 1, true).translate(0, .45, 0);
const GEO_DISCO_TOP = new THREE.CircleGeometry(.62, 40).rotateX(-Math.PI / 2);
// il gorgo che resta dove qualcuno e' andato KO
const TEX_GORGO_BUCO = (() => { const c = tela(128, 128), g = c.getContext('2d'); g.translate(64, 64); const r0 = g.createRadialGradient(0, 0, 2, 0, 0, 64); r0.addColorStop(0, '#000'); r0.addColorStop(.7, '#03201c'); r0.addColorStop(1, 'rgba(10,60,50,0)'); g.fillStyle = r0; g.fillRect(-64, -64, 128, 128);
  g.strokeStyle = 'rgba(120,255,220,.55)'; g.lineWidth = 2.5; for (let b = 0; b < 4; b++) { g.beginPath(); for (let k = 0; k < 40; k++) { const t = k / 40, a = b * 1.57 + t * 5, r = 6 + t * 54; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); } return new THREE.CanvasTexture(c); })();
const GEO_PIATTA = geoPilastro(), GEO_TOP = new THREE.PlaneGeometry(1.3, 1.3).rotateX(-Math.PI / 2);
const GEO_CORNICE = new THREE.RingGeometry(.62, .74, 48, 1).rotateX(-Math.PI / 2);
const CELLE = [], ARRIVO = [];
const TEX_STRISCE = (() => { const c = tela(128, 128), g = c.getContext('2d'); g.fillStyle = 'rgba(150,0,22,.55)'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(255,36,60,1)'; g.lineWidth = 11; for (let k = -128; k < 256; k += 34) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 128, 128); g.stroke(); }
  g.strokeStyle = 'rgba(30,0,4,.85)'; g.lineWidth = 3; for (const [a, b] of [[[64, 64], [20, 30]], [[64, 64], [110, 40]], [[64, 64], [90, 118]], [[64, 64], [12, 96]]]) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo((a[0] + b[0]) / 2 + 6, (a[1] + b[1]) / 2 - 5); g.lineTo(b[0], b[1]); g.stroke(); }
  g.strokeStyle = 'rgba(255,120,130,.95)'; g.lineWidth = 5; g.strokeRect(3, 3, 122, 122);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; })();
const TEX_BADGE = {};
function badgeTex(txt, col) {
  const k = txt + col; if (TEX_BADGE[k]) return TEX_BADGE[k];
  const c = tela(128, 128), g = c.getContext('2d'); g.fillStyle = col; g.beginPath(); g.arc(64, 64, 54, 0, 6.28); g.fill(); g.lineWidth = 8; g.strokeStyle = '#fff'; g.stroke();
  g.fillStyle = '#fff'; g.font = `900 66px ${FT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64, 68);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; TEX_BADGE[k] = t; return t;
}
let SCORSI = 0;
// livello di pericolo di una piattaforma: 1 = cade alla fine di questo turno, 2 = alla fine del prossimo
function pericoloLiv(x, y) {
  const P = ST && ST.pericolo; if (!P || LEZIONE && ST.lezione && ST.lezione.id !== 'rosse') return 0;
  const b1 = Math.max(0, P.bordo - SCORSI);
  if (x < b1) return 1;
  if (P.riga != null && y === P.riga) return 1;
  if (FASE === 'scegli' && (P.celle || []).some(c => c[0] === x && c[1] === y)) return 1;
  if (x < b1 + P.bordo_poi) return 2;
  if (P.riga_poi != null && y === P.riga_poi) return 2;
  return 0;
}
function nuovaCella(grande) {
  const g = new THREE.Group(), corpo = new THREE.Group(); g.add(corpo);
  const mat = new THREE.MeshStandardMaterial({color: 0x4f9a55, emissive: 0x0a2a20, roughness: .55, metalness: 0, transparent: true, map: TEX_PIASTRA, emissiveMap: TEX_PIASTRA_E});
  const base = new THREE.Mesh(GEO_PIATTA, mat); corpo.add(base);
  const fascio = new THREE.Mesh(GEO_FASCIO, new THREE.MeshBasicMaterial({map: TEX_FASCIO, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}));
  fascio.position.y = .08; fascio.visible = false; corpo.add(fascio);
  const top = new THREE.Mesh(GEO_TOP, new THREE.MeshBasicMaterial({transparent: true, depthWrite: false})); top.position.y = .09; corpo.add(top);
  const cor = new THREE.Mesh(GEO_CORNICE, new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0, depthWrite: false})); cor.position.y = .1; corpo.add(cor);
  const area = new THREE.Mesh(new THREE.CircleGeometry(.7, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xff3b4a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending}));
  area.position.y = .12; corpo.add(area);
  const peri = new THREE.Mesh(GEO_DISCO_TOP, new THREE.MeshBasicMaterial({map: TEX_STRISCE, transparent: true, opacity: 0, depthWrite: false})); peri.position.y = .115; corpo.add(peri);
  const badge = new THREE.Sprite(new THREE.SpriteMaterial({transparent: true, depthWrite: false})); badge.scale.set(.5, .5, 1); badge.position.y = .62; badge.visible = false; corpo.add(badge);
  const buco = new THREE.Group(); buco.visible = false; g.add(buco);
  const bn = new THREE.Mesh(new THREE.CircleGeometry(.62, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: TEX_GORGO_BUCO, color: 0xffffff, transparent: true, opacity: .95, depthWrite: false})); bn.position.y = -.05; buco.add(bn);
  const br = new THREE.Mesh(new THREE.RingGeometry(.6, .7, 40, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0x3fe0c0, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending})); br.position.y = -.03; buco.add(br);
  g.userData = {corpo, mat, base, fascio, top, cor, area, peri, badge, buco, br, t: null, bob: Math.random() * 6, dip: 0, trema: 0, carica: 0, liv: 0, alza: 0};
  if (!grande) g.scale.setScalar(.62);
  mondo.add(g); return g;
}
function costruisci() {
  for (const r of CELLE) for (const c of r) mondo.remove(c); for (const c of ARRIVO) mondo.remove(c);
  CELLE.length = 0; ARRIVO.length = 0;
  for (let x = 0; x < W; x++) { const col = []; for (let y = 0; y < H; y++) { const c = nuovaCella(true); c.userData.x = x; c.userData.y = y; col.push(c); } CELLE.push(col); }
  for (let j = 0; j < 2; j++) for (let y = 0; y < H; y++) { const c = nuovaCella(false); c.userData.j = j; c.userData.y = y; ARRIVO.push(c); }
}
function tinta(c, t, scuro, luce, liv) {
  const u = c.userData; u.t = t; const g = TC[t]; u.liv = liv || 0;
  const buco = t === 'buco'; u.buco.visible = buco; u.base.visible = !buco; u.peri.visible = !buco; u.cor.visible = !buco;
  if (buco) { u.top.visible = false; u.badge.visible = false; u.fascio.visible = false; u.alza = 0; return; }
  const colT = g ? new THREE.Color(g) : new THREE.Color(0x3fe0b0);
  u.mat.color.set(scuro ? 0x3c7a45 : (t === 'jackpot' ? 0xb8962a : (EVENTO === 'scivoloso' ? 0x4f9a86 : (luce ? 0x86d47e : 0x4f9a55))));
  u.mat.emissive.copy(colT).multiplyScalar((scuro ? .02 : (t === 'jackpot' ? .6 : g ? .22 : (luce ? .2 : .08))) + u.carica);
  u.fascio.visible = !!g && !scuro && c.scale.x > .9; if (u.fascio.visible) u.fascio.material.color.copy(colT);
  u.mat.metalness = 0; u.mat.roughness = EVENTO === 'scivoloso' ? .2 : .55;
  u.top.material.map = g ? discoTex(t) : null; u.top.visible = !!g; u.top.material.opacity = 1; u.top.material.needsUpdate = true;
  u.cor.material.color.set(0xffffff); u.cor.material.opacity = luce ? .9 : 0; u.alza = luce ? .06 : 0;
  if (scuro) { u.mat.color.set(0x3c7a45); u.top.material.opacity = .9; }
  u.peri.material.opacity = u.liv === 1 ? .8 : u.liv === 2 ? .38 : 0;
  if (u.liv === 1) { u.mat.color.set(0x8a3a2a); u.mat.emissive.set(0xff2d45).multiplyScalar(.35); }
  else if (u.liv === 2) u.mat.emissive.lerp(new THREE.Color(0xff2d45), .08);
}
function aggiornaCampo() {
  if (!ST) return;
  const r0 = ST.righe ? ST.righe[0] : 0, r1 = ST.righe ? ST.righe[1] : H - 1;
  const lista = FASE === 'scegli' ? (ABON && MOSSE_AB.length ? MOSSE_AB : MOSSE) : [];
  const lit = new Set(lista.map(m => m[0] + ',' + m[1]));
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
    const c = CELLE[x][y], viva = y >= r0 && y <= r1;
    c.visible = viva; c.position.copy(pos(x, y)); c.userData.corpo.rotation.set(0, 0, 0); c.rotation.y = ROT ? Math.PI / 2 : 0;
    tinta(c, ST.campo[x][y], FASE === 'scegli' && lit.size && !lit.has(x + ',' + y), lit.has(x + ',' + y), pericoloLiv(x, y));
    c.userData.badge.visible = false; c.userData.passa = false;
  }
  for (const q of ST.p) if (q.vivo && CELLE[q.x] && CELLE[q.x][q.y]) CELLE[q.x][q.y].userData.fascio.visible = false;
  // un solo «!» per ogni linea che crolla (al centro), «2» per quella del turno dopo
  const r0v = ST.righe ? ST.righe[0] : 0, r1v = ST.righe ? ST.righe[1] : H - 1, ym = Math.round((r0v + r1v) / 2), P = ST.pericolo;
  const segna = (x, y, liv) => { const c = CELLE[x] && CELLE[x][y]; if (!c || !c.visible || c.userData.t === 'buco') return; c.userData.badge.material.map = liv === 1 ? badgeTex('!', ROSSO) : badgeTex('2', '#c2414f'); c.userData.badge.material.needsUpdate = true; c.userData.badge.visible = true; };
  if (P && !(LEZIONE && ST.lezione && ST.lezione.id !== 'rosse')) {
    const b1 = Math.max(0, P.bordo - SCORSI); if (b1 > 0) segna(0, ym, 1); else segna(0, ym, 2);
    if (P.riga != null) segna(W - 1, P.riga, 1); if (P.riga_poi != null && FASE === 'scegli') segna(W - 1, P.riga_poi, 2);
  }
  // bomba patata in mano: le caselle accanto agli altri (non a chi te l'ha data) diventano arancioni
  if (FASE === 'scegli' && IO >= 0 && ST.p[IO].patata > 0 && ST.p[IO].vivo) {
    const io = ST.p[IO], raggiungibili = new Set(lista.map(m => m[0] + ',' + m[1]));
    ST.p.forEach((q, j) => { if (j === IO || !q.vivo || j === io.patata_da || q.patata) return;
      for (let d = -1; d <= 1; d++) for (let e = -1; e <= 1; e++) { const x = q.x + d, y = q.y + e; if ((d || e) && raggiungibili.has(x + ',' + y)) { const c = CELLE[x][y]; c.userData.passa = true; c.userData.mat.color.set(0x5a3008); c.userData.mat.emissive.set(ARANCIO).multiplyScalar(.45); c.userData.cor.material.color.set(ARANCIO); c.userData.cor.material.opacity = 1; } } });
  } else for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (!AREE_ON.includes(CELLE[x][y])) CELLE[x][y].userData.area.material.opacity = 0;
  evidenziaLezione();
  // le file in arrivo: a grandezza quasi piena, sulla «corrente» (fascia con le frecce che scendono verso il campo)
  for (const c of ARRIVO) { const j = c.userData.j, y = c.userData.y; c.position.copy(pos(W + .02 + j * .98, y)); c.position.y = -.04; c.rotation.y = ROT ? Math.PI / 2 : 0; c.scale.setScalar(j ? .68 : .8);
    c.visible = !!ST.arrivo; tinta(c, ST.arrivo ? ST.arrivo[j][y] : 'vuota', false, null); c.userData.mat.opacity = j ? .62 : 1; c.userData.top.material.opacity = j ? .75 : 1; c.userData.mat.color.set(j ? 0x2f6f74 : 0x3f8f8a); c.userData.fascio.visible = false; c.userData.arrivoJ = j; }
  corrente.visible = !!ST.arrivo && FASE !== 'fine'; corrente.position.copy(pos(W + .5, (H - 1) / 2)); corrente.position.y = -.05; corrente.rotation.y = ROT ? 0 : -Math.PI / 2; corrente.scale.set(H * 1.4 + .3, 1, 1.95 * PZ);   // (qui P e' il pericolo, non il passo)
  posCatena(); posStagno();
}
// la fascia della corrente sotto le file in arrivo: frecce che scorrono verso il campo, bordo luminoso
const corrente = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({uniforms: {t: {value: 0}, n: {value: 6}}, transparent: true, depthWrite: false,
  vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform float t; uniform float n; varying vec2 vU;
    void main(){ float cx = fract(vU.x * n) - .5; float ch = fract(vU.y * 3.2 - abs(cx) * 1.3 + t * 1.1);
      float riga = smoothstep(0., .06, ch) * (1. - smoothstep(.1, .2, ch)) * (1. - smoothstep(.3, .5, abs(cx)));
      float bordo = 1. - smoothstep(0., .08, min(min(vU.x, 1. - vU.x) * 3., min(vU.y, 1. - vU.y)));
      float a = .08 + .62 * riga + .3 * bordo; a *= (1. - smoothstep(.75, 1., vU.y)) * .9 + .1;
      gl_FragColor = vec4(mix(vec3(.25, .95, .85), vec3(.85, 1., .95), riga), a); }`}));
corrente.renderOrder = -1; corrente.visible = false; mondo.add(corrente);
const etiArrivo = new THREE.Sprite(new THREE.SpriteMaterial({transparent: true, depthTest: false}));
function etichettaArrivo() { etiArrivo.material.map = testoTex((OPZ.lang === 'en' ? 'INCOMING' : 'IN ARRIVO') + (ROT ? ' ▼' : ' ◀'), '#bffff0', 512, 96, 46); etiArrivo.material.needsUpdate = true; corrente.material.uniforms.n.value = H; }
etiArrivo.scale.set(3.8, .71, 1); etiArrivo.renderOrder = 15; mondo.add(etiArrivo);
function dip(x, y, forza, eco) { const c = CELLE[x] && CELLE[x][y]; if (!c) return; c.userData.dip = Math.max(c.userData.dip, forza || .18); if (!eco) c.userData.trema = .25; c.userData.flash = Math.max(c.userData.flash || 0, (forza || .18) * 3.5);
  if (!eco && (forza || .18) >= .2 && !OPZ.rm) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) setTimeout(() => dip(x + dx, y + dy, .06, true), 70); }

/* ---------------- BOT costruiti in codice ---------------- */
const IMGAV = {};
function carica(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }
function facciaTex(i) {
  const c = tela(256, 256), g = c.getContext('2d'), f = IMGAV[i];
  g.fillStyle = '#140f26'; g.fillRect(0, 0, 256, 256);
  if (f) { const s = Math.max(256 / f.width, 256 / f.height) * 1.08; g.drawImage(f, (256 - f.width * s) / 2, 128 - f.height * s * .47, f.width * s, f.height * s); }
  const l = g.createRadialGradient(95, 60, 2, 110, 80, 150); l.addColorStop(0, 'rgba(255,255,255,.4)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, 256, 140);
  const x = new THREE.CanvasTexture(c); x.encoding = THREE.sRGBEncoding; return x;
}
const GEO = {
  corpo: new THREE.SphereGeometry(.5, 28, 20), visiera: new THREE.TorusGeometry(.3, .05, 10, 32), faccia: new THREE.CircleGeometry(.29, 32),
  cilindro: new THREE.CylinderGeometry(.19, .21, .34, 20), tesa: new THREE.CylinderGeometry(.33, .33, .04, 24), fascia: new THREE.CylinderGeometry(.215, .215, .07, 20),
  braccio: new THREE.CylinderGeometry(.075, .085, .34, 10), mano: new THREE.SphereGeometry(.1, 12, 10), piede: new THREE.SphereGeometry(.14, 14, 10),
  stella: new THREE.OctahedronGeometry(.07, 0), spira: new THREE.TorusGeometry(.32, .035, 6, 24), bomba: new THREE.SphereGeometry(.2, 16, 12),
  esagono: new THREE.CircleGeometry(.28, 6), punta: new THREE.ConeGeometry(.05, .14, 5), coccio: new THREE.TetrahedronGeometry(.12, 0)};
const RANE = [];
// ---- modello del bot ----
const MODELLO = (Q.get('modello') || leggi('modello', 'B')).toUpperCase();
const PROF = {      // profilo del corpo a fagiolo (raggio, altezza), girato attorno all'asse
  A: [[0, .03], [.3, .05], [.5, .16], [.58, .4], [.57, .72], [.5, 1.0], [.36, 1.2], [.16, 1.3], [0, 1.32]],
  B: [[0, .03], [.3, .05], [.5, .16], [.58, .4], [.57, .72], [.5, 1.0], [.36, 1.2], [.16, 1.3], [0, 1.32]],
  C: [[0, .03], [.28, .05], [.46, .16], [.53, .42], [.53, .84], [.47, 1.14], [.33, 1.36], [.14, 1.46], [0, 1.48]]};
const GEO_MOD = {};
const FORME = {
  // Superbalzo: alto e sottile, su una grande molla
  zip:   {prof: [[0, 0], [.22, .02], [.3, .12], [.32, .4], [.32, .86], [.28, 1.04], [.16, 1.15], [0, 1.18]], alzo: .55, base: 'molla', braccia: 'pinne', capo: .8, oblo: .82, acc: '#36d16a', emblema: .3},
  // Bolla: una palla che galleggia su un getto, dentro una grande bolla di vetro
  axa:   {palla: .56, alzo: .3, base: 'getto', braccia: 'nessuna', capo: .68, oblo: .95, acc: '#5ad1ff', emblema: .25, cupola: true, sqMin: .74},
  // Schianto: basso e larghissimo, su cingoli, pugni enormi
  tonfo: {prof: [[0, 0], [.46, .02], [.58, .18], [.6, .55], [.55, .95], [.38, 1.16], [0, 1.22]], alzo: .22, base: 'cingoli', braccia: 'pugni', capo: .78, oblo: .9, acc: '#ff7a1a', emblema: .3, largo: 1.36, sqMin: .76},
  // Rampino: testa tonda su un collo lungo, corpo piccolo su tre gambe, coda arrotolata alta
  camu:  {prof: [[0, 0], [.2, .02], [.3, .12], [.32, .35], [.26, .55], [0, .62]], alzo: .38, base: 'treppiede', braccia: 'pinne', collo: .42, testaR: .38, oblo: .92, acc: '#ff6f9a', emblema: .3, coda: true},
  // Gas: un barile tozzo, tre scarichi corti sulla schiena (sotto le spalle), piedi piatti
  grumo: {prof: [[0, 0], [.5, .02], [.58, .08], [.6, .5], [.6, .82], [.5, .9], [0, .92]], alzo: .1, base: 'piedi', braccia: 'pinne', capo: .58, oblo: .92, acc: '#9be37a', emblema: .25, tubi: true, sqMin: .8, spalle: .4},
  // Flash: a punta in giu' (larga in alto), su una ruota sola, fulmini sulla ruota puntati a terra
  luma:  {prof: [[0, 0], [.12, .02], [.32, .3], [.52, .7], [.55, .92], [.4, 1.06], [0, 1.1]], alzo: .42, base: 'ruota', braccia: 'ali', capo: .74, oblo: .92, acc: '#ffd23f', emblema: .45, lati: 6, largo: 1.35}};
function geoCorpo(m) {
  if (GEO_MOD['c' + m]) return GEO_MOD['c' + m];
  const curva = new THREE.SplineCurve(PROF[m].map(([r, y]) => new THREE.Vector2(r, y)));
  const g = new THREE.LatheGeometry(curva.getPoints(48), 48); g.computeVertexNormals(); GEO_MOD['c' + m] = g; return g;
}
function rettArrot(w, h, r) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
// pannello curvo (lo schermo segue la pancia del bot)
function pianoCurvo(w, h, curva) { const g = new THREE.PlaneGeometry(w, h, 24, 8), P = g.attributes.position; for (let k = 0; k < P.count; k++) { const x = P.getX(k); P.setZ(k, -x * x * curva); } g.computeVertexNormals(); return g; }
// la foto dentro lo schermo: tagliata senza stirarla, ombra interna ai bordi
function schermoTex(i, w, h, tondo) {
  const W0 = 512, H0 = Math.round(512 * h / w), c = tela(W0, H0), g = c.getContext('2d'), f = IMGAV[i];
  g.fillStyle = '#0d0a1c'; g.fillRect(0, 0, W0, H0);
  if (f) { const sc = Math.max(W0 / f.width, H0 / f.height) * 1.05; g.drawImage(f, (W0 - f.width * sc) / 2, H0 * .5 - f.height * sc * .46, f.width * sc, f.height * sc); }
  const ombra = tondo ? g.createRadialGradient(W0 / 2, H0 / 2, Math.min(W0, H0) * .3, W0 / 2, H0 / 2, Math.min(W0, H0) * .52) : null;
  if (tondo) { ombra.addColorStop(0, 'rgba(0,0,0,0)'); ombra.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = ombra; g.fillRect(0, 0, W0, H0); }
  else { for (const [x0, y0, x1, y1] of [[0, 0, 0, 40], [0, H0, 0, H0 - 40], [0, 0, 40, 0], [W0, 0, W0 - 40, 0]]) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(0,0,0,.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W0, H0); } }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
}
// riflesso del vetro
const TEX_VETRO = (() => { const c = tela(256, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(.35, 'rgba(255,255,255,.08)'); gr.addColorStop(.36, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(70, 52, 34, 12, -.5, 0, 6.28); g.fill(); return new THREE.CanvasTexture(c); })();
const TEX_OMBRA = (() => { const c = tela(128, 128), g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 6, 64, 64, 62); r.addColorStop(0, 'rgba(0,0,0,.6)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
function nuovoRobot(i, pgArg) {   // il robot dello stadio (prima della passata «pro»): resta solo per i controlli di cappello/oblò
  const m = MODELLO in PROF ? MODELLO : 'A', col = new THREE.Color(COL[i]), alto = m === 'C' ? 1.12 : 1;
  const matC = new THREE.MeshPhysicalMaterial({color: col, roughness: .38, metalness: 0, clearcoat: 1, clearcoatRoughness: .12, emissive: col.clone().multiplyScalar(.05)});
  const matScuro = new THREE.MeshPhysicalMaterial({color: 0x241a40, roughness: .45, clearcoat: .6, clearcoatRoughness: .3});
  const matCornice = new THREE.MeshPhysicalMaterial({color: 0x15102a, roughness: .25, metalness: .3, clearcoat: 1, clearcoatRoughness: .1});
  const matOro = new THREE.MeshStandardMaterial({color: 0xd8b56a, roughness: .25, metalness: .8, emissive: 0x3a2a00});
  const root = new THREE.Group(), taglia = new THREE.Group(), anca = new THREE.Group(), busto = new THREE.Group(); root.add(taglia); taglia.add(anca); anca.add(busto);
  const pgB = pgArg || (ST && ST.p && ST.p[i] ? ST.p[i].pg : OPZ.pg), F = FORME[pgB] || FORME.zip, ex = {limB: F.limB || 1.9, sqMin: F.sqMin || .62};
  const accento = new THREE.Color(F.acc), matAcc = new THREE.MeshPhysicalMaterial({color: accento, emissive: accento, emissiveIntensity: .25, roughness: .3, clearcoat: 1});
  const su = new THREE.Group(); su.position.y = F.alzo; busto.add(su); ex.su = su;
  // CORPO
  let raggioA, top;
  if (F.palla) { const R = F.palla; const corpo = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), matC); corpo.position.y = R; su.add(corpo); top = 2 * R; raggioA = y => Math.sqrt(Math.max(0, R * R - (y - R) * (y - R))); }
  else { const curva = new THREE.SplineCurve(F.prof.map(([r, y]) => new THREE.Vector2(r, y)));
    const gC = GEO_MOD['s' + pgB] || (GEO_MOD['s' + pgB] = new THREE.LatheGeometry(curva.getPoints(48), F.lati || 48));
    const corpo = new THREE.Mesh(gC, matC); if (F.lati) corpo.rotation.y = Math.PI / F.lati; su.add(corpo); top = F.prof[F.prof.length - 1][1];
    raggioA = y => { const P = F.prof; for (let k = 1; k < P.length; k++) if (P[k][1] >= y) { const t = (y - P[k - 1][1]) / (P[k][1] - P[k - 1][1]); return P[k - 1][0] + (P[k][0] - P[k - 1][0]) * t; } return 0; }; }
  // bordo e stemma del colore del potere
  const yBordo = Math.min(top * .45, F.emblema + .25); const bordo = new THREE.Mesh(new THREE.TorusGeometry(raggioA(yBordo) + .01, .03, 8, 64), matAcc); bordo.rotation.x = Math.PI / 2; bordo.position.y = yBordo; su.add(bordo);
  { const c = tela(96, 96), g = c.getContext('2d'); iconaAbil(g, ABPG[pgB], true); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; g.strokeStyle = F.acc; g.lineWidth = 8; g.beginPath(); g.arc(48, 48, 44, 0, 6.28); g.stroke();
    const em = new THREE.Mesh(new THREE.CircleGeometry(.13, 32), new THREE.MeshBasicMaterial({map: t, transparent: true})); em.position.set(0, F.emblema, raggioA(F.emblema) + .012); su.add(em); }
  // TESTA: la testa e' il corpo (cupola), oppure una palla separata su un collo (Rampino)
  let yCapo = F.capo, zViso, rTesta = 0;
  if (F.collo) { const collo = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, F.collo, 16), matC); collo.position.y = top + F.collo / 2 - .04; su.add(collo);
    rTesta = F.testaR; yCapo = top + F.collo + rTesta - .1; const teste = new THREE.Mesh(new THREE.SphereGeometry(rTesta, 36, 24), matC); teste.position.y = yCapo; su.add(teste);
    zViso = rTesta + .02; top = yCapo + rTesta; }
  else zViso = raggioA(yCapo) + (F.lati ? .06 : .035);
  const capo = new THREE.Group(); capo.position.set(0, yCapo, 0); su.add(capo);
  const rOblo = (m === 'B' ? .3 : m === 'C' ? .28 : .27) * (F.oblo || 1), tubo = m === 'A' ? .06 : .045, scH = F.cappello || 1;
  let yViso = .02, yCap = top - yCapo - .05; const bordoSu = () => yViso + rOblo + .03 + tubo, serve = .07;
  if (yCap - bordoSu() < serve) { const giu = Math.min(.1, serve - (yCap - bordoSu())); yViso -= giu; }
  if (yCap - bordoSu() < serve) yCap = bordoSu() + serve;
  const viso = new THREE.Group(); viso.position.set(0, yViso, zViso); capo.add(viso);
  let fotoMat;
  {
    const R0 = rOblo;
    const matAnello = m === 'B' ? matOro : m === 'C' ? new THREE.MeshPhysicalMaterial({color: col, roughness: .3, clearcoat: 1, clearcoatRoughness: .1}) : matCornice;
    const anello = new THREE.Mesh(new THREE.TorusGeometry(R0 + .03, tubo, 16, 56), matAnello); viso.add(anello);
    if (m === 'C') { const dentro = new THREE.Mesh(new THREE.TorusGeometry(R0 + .003, .02, 10, 56), matCornice); dentro.position.z = -.01; viso.add(dentro); }
    if (m === 'B') { const viti = new THREE.Group(); for (let k = 0; k < 8; k++) { const v = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), matCornice); const a2 = k / 8 * 6.283 + .39; v.position.set(Math.cos(a2) * (R0 + .03), Math.sin(a2) * (R0 + .03), .04); viti.add(v); } viso.add(viti); }
    const incavo = new THREE.Mesh(new THREE.CylinderGeometry(R0 + .005, R0 + .005, .08, 48, 1, true), new THREE.MeshBasicMaterial({color: 0x07050f, side: THREE.BackSide})); incavo.rotation.x = Math.PI / 2; incavo.position.z = -.05; viso.add(incavo);
    const fondo = new THREE.Mesh(new THREE.CircleGeometry(R0, 56), fotoMat = new THREE.MeshBasicMaterial({map: schermoTex(i, 1, 1, true)})); fondo.position.z = -.012; viso.add(fondo);
    const vetro = new THREE.Mesh(new THREE.SphereGeometry(R0 / Math.sin(.6), 40, 10, 0, Math.PI * 2, 0, .6), new THREE.MeshBasicMaterial({map: TEX_VETRO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    vetro.rotation.x = Math.PI / 2; vetro.position.z = -(R0 / Math.sin(.6)) * Math.cos(.6) - .01; viso.add(vetro);
  }
  // CAPPELLO (figlio della testa: se la testa si inclina, il cappello la segue)
  const testa = new THREE.Group(); testa.position.set(.06, yCap, -.04); capo.add(testa);
  const cil = new THREE.Mesh(new THREE.CylinderGeometry(.19 * scH, .22 * scH, .34 * scH, 28), matScuro); cil.position.y = .21 * scH; testa.add(cil);
  const tesa = new THREE.Mesh(new THREE.CylinderGeometry(.36 * scH, .36 * scH, .035, 32), matScuro); tesa.position.y = .03; testa.add(tesa);
  const bordoT = new THREE.Mesh(new THREE.TorusGeometry(.36 * scH, .022, 8, 40), matScuro); bordoT.rotation.x = Math.PI / 2; bordoT.position.y = .035; testa.add(bordoT);
  const fascia = new THREE.Mesh(new THREE.CylinderGeometry(.225 * scH, .225 * scH, .08, 28), new THREE.MeshPhysicalMaterial({color: col, emissive: col, emissiveIntensity: .3, clearcoat: 1})); fascia.position.y = .1; testa.add(fascia);
  const corona = new THREE.Group(); corona.position.y = .44 * scH; corona.visible = false; testa.add(corona);
  const anelloC = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .08, 16, 1, true), matOro); corona.add(anelloC);
  for (let k = 0; k < 6; k++) { const p = new THREE.Mesh(GEO.punta, matOro); const a = k / 6 * 6.28; p.position.set(Math.cos(a) * .16, .1, Math.sin(a) * .16); corona.add(p); }
  testa.rotation.z = -.22;
  // BRACCIA
  const braccia = [], ySp = F.spalle || (F.collo ? top * .0 + .4 : Math.min(top * .6, yCapo - .05));
  for (const sx of [-1, 1]) {
    const spalla = new THREE.Group(); su.add(spalla); braccia.push(spalla); spalla.rotation.z = sx * .35;
    if (F.braccia === 'nessuna') { spalla.position.set(sx * .3, ySp, 0); continue; }
    if (F.braccia === 'pugni') { spalla.position.set(sx * (raggioA(.4) - .02), .42, 0); const av = new THREE.Mesh(GEO.corpo, matC); av.scale.set(.2, .34, .22); av.position.y = -.16; spalla.add(av);
      const pugno = new THREE.Mesh(new THREE.SphereGeometry(.25, 24, 16), matAcc); pugno.position.y = -.42; pugno.scale.set(1, .9, 1.05); spalla.add(pugno); (ex.pugni = ex.pugni || []).push(pugno); continue; }
    if (F.braccia === 'ali') { spalla.position.set(sx * .3, .5, 0); spalla.rotation.z = 0;
      // i fulmini stanno sulla forcella della ruota e puntano a terra: niente accanto alla testa o al cappello
      const fulmine = new THREE.Shape(); fulmine.moveTo(0, 0); fulmine.lineTo(.55, .45); fulmine.lineTo(.3, .48); fulmine.lineTo(.75, 1.0); fulmine.lineTo(.12, .52); fulmine.lineTo(.36, .48); fulmine.lineTo(0, 0);
      matAcc.side = THREE.DoubleSide;
      const g = new THREE.Group(); g.position.set(sx * .12, .66, 0); g.userData.sx = sx; anca.add(g);
      const ala = new THREE.Mesh(new THREE.ExtrudeGeometry(fulmine, {depth: .05, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 1}), matAcc); ala.scale.set(sx * .66, -.66, .66); ala.rotation.y = sx * .2; g.add(ala); ex.ali = (ex.ali || []).concat(g);
      continue; }
    spalla.position.set(sx * (raggioA(ySp) - .02), ySp, 0); const pinna = new THREE.Mesh(GEO.corpo, matC); pinna.scale.set(.17, .38, .22); pinna.position.y = -.17; spalla.add(pinna);
  }
  if (F.braccia === 'ali') ex.matF = matAcc;    // niente antenna: sulla testa solo oblo' e cappello
  // BASE
  const piedi = [];
  if (F.base === 'molla') { const pts = []; for (let k = 0; k <= 80; k++) { const t = k / 80; pts.push(new THREE.Vector3(Math.cos(t * 6.283 * 5) * .26, t * F.alzo, Math.sin(t * 6.283 * 5) * .26)); }
    const molla = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, .045, 8), matAcc); anca.add(molla); ex.molla = molla;
    const piatto = new THREE.Mesh(new THREE.CylinderGeometry(.34, .38, .07, 32), matScuro); piatto.position.y = .035; anca.add(piatto); }
  else if (F.base === 'getto') { const ugello = new THREE.Mesh(new THREE.CylinderGeometry(.18, .12, .16, 24), matScuro); ugello.position.y = F.alzo + .02; anca.add(ugello);
    const fiamma = new THREE.Mesh(new THREE.ConeGeometry(.15, .5, 20, 1, true), new THREE.MeshBasicMaterial({color: 0x7fe0ff, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide})); fiamma.rotation.x = Math.PI; fiamma.position.y = F.alzo - .24; anca.add(fiamma); ex.fiamma = fiamma; }
  else if (F.base === 'cingoli') { for (const sx of [-1, 1]) { const cg = new THREE.Group(); cg.position.set(sx * .5, .14, 0); anca.add(cg);
      const banda = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .95, 16), matScuro); banda.rotation.x = Math.PI / 2; cg.add(banda);
      for (const z of [-.33, 0, .33]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .27, 16), matAcc); r.rotation.z = Math.PI / 2; r.position.z = z; cg.add(r); } } }
  else if (F.base === 'treppiede') { for (let k = 0; k < 3; k++) { const an = k / 3 * 6.283 + .5, g = new THREE.Group(); g.rotation.y = an; anca.add(g);
      const gamba = new THREE.Mesh(new THREE.CylinderGeometry(.035, .03, .62, 8), matScuro); gamba.position.set(0, .22, .26); gamba.rotation.x = .75; g.add(gamba);
      const pie = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), matAcc); pie.position.set(0, .04, .48); g.add(pie); } }
  else if (F.base === 'ruota') { const ruota = new THREE.Mesh(new THREE.TorusGeometry(.24, .09, 14, 32), matScuro); ruota.position.y = .3; anca.add(ruota); ex.ruota = ruota;
    const mozzo = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .22, 16), matAcc); mozzo.rotation.z = Math.PI / 2; mozzo.position.y = .3; anca.add(mozzo);
    const forca = new THREE.Mesh(new THREE.BoxGeometry(.06, .3, .06), matScuro); forca.position.set(0, .45, 0); anca.add(forca); }
  else for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.22, .24, .1, 24), matAcc); p.scale.z = 1.4; p.position.set(sx * .3, .06, .08); anca.add(p); piedi.push(p); }
  // OGGETTI GRANDI che raccontano il potere
  if (F.cupola) { const cup = new THREE.Mesh(new THREE.SphereGeometry(.82, 36, 24), new THREE.MeshPhysicalMaterial({color: 0xcff4ff, transparent: true, opacity: .2, roughness: .05, clearcoat: 1, depthWrite: false}));
    cup.position.y = F.palla; su.add(cup); ex.cupola = cup;    // la bolla di vetro si vede solo mentre usa il potere
    const yA = F.palla * .36, rA = Math.sqrt(F.palla * F.palla - (yA - F.palla) ** 2) + .12;   // anello in vita, sotto la faccia
    const anelloB = new THREE.Mesh(new THREE.TorusGeometry(rA, .04, 10, 64), matAcc); anelloB.rotation.x = Math.PI / 2; anelloB.position.y = yA; su.add(anelloB); }
  if (F.coda) { const pts = []; for (let k = 0; k <= 50; k++) { const t = k / 50, r = .42 * (1 - t * .7), a2 = t * 6.283 * 1.25; pts.push(new THREE.Vector3(0, .15 + t * .45 + Math.sin(a2) * r * .5, -.3 - Math.cos(a2) * r * .5 - t * .25)); }   // coda bassa, arrotolata dietro: non arriva alla testa
    const coda = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 70, .085, 12), matAcc); su.add(coda); ex.coda = coda;
    const lingua = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1, 10), new THREE.MeshStandardMaterial({color: 0xff6f9a, roughness: .4})); lingua.rotation.x = Math.PI / 2; lingua.position.set(0, .42, raggioA(.42) + .1); lingua.scale.y = .01; su.add(lingua); ex.lingua = lingua; }   // la lingua esce dal petto, non dalla testa
  if (F.tubi) { ex.tubi = [];
    // scarichi corti sulla schiena, sotto la linea delle spalle, aperti all'indietro e di lato: il gas esce da li'
    for (const [x, h, a, rx] of [[-.46, .32, 1.35, -.25], [0, .32, 0, -1.4], [.46, .32, -1.35, -.25]]) { const g = new THREE.Group(); g.position.set(x, .12, -raggioA(.3) * (x ? .45 : 1) + .08); g.rotation.set(rx, 0, a); su.add(g);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, h, 16), matAcc); t.position.y = h / 2; g.add(t);
      const bocca = new THREE.Mesh(new THREE.TorusGeometry(.105, .028, 8, 20), matCornice); bocca.rotation.x = Math.PI / 2; bocca.position.y = h; g.add(bocca); ex.tubi.push(bocca); } }
  // per il controllo «niente vicino al cappello»: il corpo vero (fusto, testa su collo, bordo, stemma) non e' un oggetto aggiunto
  for (const c of su.children) if (c.isMesh && (c.material === matC || c.geometry.type === 'CircleGeometry' || (c.material === matAcc && c.geometry.type === 'TorusGeometry' && c.position.y === yBordo))) c.userData.corpo = true;
  // TAGLIA: l'ingombro di ogni sagoma sta dentro la sua piattaforma (il gioco e' identico per tutti)
  { taglia.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(taglia), dim = bb.getSize(new THREE.Vector3()), largo = Math.max(dim.x, dim.z), alto = dim.y;
    const maxL = F.largo || 1.2, maxH = 2.05, k = Math.min(1, maxL / largo, maxH / alto); taglia.scale.setScalar(k); ex.taglia = {largo: +(largo * k).toFixed(2), alto: +(alto * k).toFixed(2)}; }
  // ombra morbida a terra
  const om = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: TEX_OMBRA, transparent: true, depthWrite: false})); om.position.y = .11; root.add(om);
  const an = new THREE.Mesh(new THREE.TorusGeometry(.62, .05, 8, 48), new THREE.MeshBasicMaterial({color: COL[i]})); an.rotation.x = Math.PI / 2; an.position.y = .14; root.add(an);
  const vis = null, faccia = null;
  let freccia = null;
  if (i === IO) { const b = new THREE.Mesh(new THREE.TorusGeometry(.76, .06, 8, 48), new THREE.MeshBasicMaterial({color: 0xffffff})); b.rotation.x = Math.PI / 2; b.position.y = .14; root.add(b);
    freccia = new THREE.Mesh(new THREE.ConeGeometry(.2, .38, 4), new THREE.MeshBasicMaterial({color: 0xffffff})); freccia.rotation.x = Math.PI; freccia.position.y = 3.15; root.add(freccia); }
  const stati = new THREE.Sprite(new THREE.SpriteMaterial({transparent: true, depthTest: false})); stati.scale.set(1.6, .4, 1); stati.position.y = 2.6; stati.visible = false; root.add(stati);
  const nome = new THREE.Sprite(new THREE.SpriteMaterial({map: testoTex(nm(i), COL[i], 256, 64, 38), transparent: true, depthTest: false})); nome.scale.set(1.56, .39, 1); nome.position.y = 2.2; root.add(nome);
  // STATI
  const scudo = new THREE.Mesh(new THREE.SphereGeometry(.98, 28, 18), new THREE.MeshBasicMaterial({color: 0xffd76a, map: TEX_ESAGONI, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}));
  scudo.position.y = .8; scudo.visible = false; root.add(scudo);
  const crepe = new THREE.Mesh(new THREE.SphereGeometry(1.0, 20, 14), new THREE.MeshBasicMaterial({map: TEX_CREPE, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending}));
  crepe.position.y = .8; root.add(crepe);
  const bolla = new THREE.Mesh(new THREE.SphereGeometry(.95, 20, 14), new THREE.MeshBasicMaterial({color: 0xbfefff, transparent: true, opacity: .16, depthWrite: false})); bolla.position.y = .8; bolla.visible = false; root.add(bolla);
  const ghiaccio = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 1.1), new THREE.MeshStandardMaterial({color: 0xbfe8ff, transparent: true, opacity: 0, roughness: .1, metalness: .1, emissive: 0x2a6aa0, emissiveIntensity: .3, depthWrite: false})); ghiaccio.position.y = .8; root.add(ghiaccio);
  const stelle = new THREE.Group(); stelle.position.y = 1.7; stelle.visible = false; root.add(stelle);
  for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(GEO.stella, new THREE.MeshBasicMaterial({color: 0xffe066})); s.position.set(Math.cos(k * 1.57) * .38, 0, Math.sin(k * 1.57) * .38); stelle.add(s); }
  const molla = new THREE.Group(); molla.visible = false; root.add(molla);
  for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(GEO.spira, new THREE.MeshBasicMaterial({color: 0x36d16a, transparent: true, opacity: .9, blending: THREE.AdditiveBlending})); m.rotation.x = Math.PI / 2; m.position.y = .05 + k * .07; molla.add(m); }
  const bomba = new THREE.Group(); bomba.position.y = 1.95; bomba.visible = false; root.add(bomba);
  const bm = new THREE.Mesh(GEO.bomba, new THREE.MeshStandardMaterial({color: 0x222222, roughness: .3, metalness: .4})); bomba.add(bm);
  const miccia = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({color: 0xffd23f})); miccia.position.set(.1, .22, 0); bomba.add(miccia);
  const timer = new THREE.Sprite(new THREE.SpriteMaterial({transparent: true, depthTest: false})); timer.scale.set(.5, .5, 1); timer.position.y = .45; bomba.add(timer);
  const specchio = new THREE.Mesh(GEO.esagono, new THREE.MeshStandardMaterial({color: 0xe8eeff, metalness: 1, roughness: .05, emissive: 0x5060a0, emissiveIntensity: .3, side: THREE.DoubleSide})); specchio.visible = false; root.add(specchio);
  const mirino = new THREE.Group(); mirino.visible = false; root.add(mirino);
  const mr = new THREE.Mesh(new THREE.RingGeometry(.62, .72, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xff2a2a, transparent: true, opacity: .9, depthWrite: false})); mr.position.y = .16; mirino.add(mr);
  for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(.06, .3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xff2a2a})); const a = k * Math.PI / 2; t.position.set(Math.cos(a) * .82, .16, Math.sin(a) * .82); t.rotation.y = -a; mirino.add(t); }
  const cono = new THREE.Mesh(new THREE.ConeGeometry(.9, 5, 20, 1, true), new THREE.MeshBasicMaterial({color: 0xff5050, transparent: true, opacity: .1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide})); cono.position.y = 2.6; mirino.add(cono);
  mondo.add(root);
  const o = {i, pg: pgB, ex, viso, capo, rOblo, tubo, scH, testaY: testa.position.y, root, anca, busto, testa, braccia, piedi, om, an, nome, freccia, statiS: stati, statiK: '', bollaOn: false, scudo, crepe, bolla, ghiaccio, stelle, molla, bomba, timer, miccia, specchio, mirino, corona, matC,
    x: 0, y: 0, alt: 0, a: 1, ko: false, stato: 'idle', sq: 1, spin: 0, tiltX: 0, tiltZ: 0, kx: 0, kz: 0, guardo: Math.random() * 9, braccioSu: 0, sbraccia: 0, capogiro: 0, gelo: false, flash: 0, festa: 0, sfotto: 0, bordo: false, paura: 0,
    emote: null, emoteT: 0, triste: 0, fumoT: 0, timerV: -1,
    // ogni personaggio ha il suo modo di stare fermo
    stile: {f: 2.6 + i * .35, amp: .02 + (i % 3) * .012, dondola: .04 + (i % 2) * .05}};
  RANE.push(o); return o;
}
function animaForma(o, dt, tt) {
  const e = o.ex, ferma = o.stato === 'idle' && !o.ko, k = o.usa > 0 ? (o.usa -= dt, 1) : 0;
  if (e.molla) { const c = k ? .45 : ferma ? .85 + .15 * Math.abs(Math.sin(tt * 3.2 + o.i)) : (o.stato === 'carica' ? .55 : 1.15); e.molla.scale.y = c; e.su.position.y = FORME.zip.alzo * c; }
  if (e.fiamma) { e.fiamma.scale.set(1, .7 + .3 * Math.sin(tt * 18 + o.i) + (k ? 1 : 0), 1); if (ferma) e.su.position.y = FORME.axa.alzo + Math.sin(tt * 2.2 + o.i) * .05; }
  if (e.cupola) { e.cupola.visible = !!(k || o.bollaOn) && !o.ko; e.cupola.material.opacity = .22 + .06 * Math.sin(tt * 2 + o.i) + (k ? .25 : 0); }
  if (e.pugni) for (const [j, p] of e.pugni.entries()) p.scale.setScalar(1 + (ferma ? .07 * Math.max(0, Math.sin(tt * 4 + j * 3.14)) : 0) + (k ? .35 : 0));
  if (e.coda) { e.coda.rotation.y = Math.sin(tt * 1.3 + o.i) * .25; e.lingua.scale.y = k ? 1.4 : Math.max(.01, e.lingua.scale.y * .8); }
  if (e.tubi && Math.random() < dt * (k ? 24 : 1.5) && !OPZ.rm) for (const t of e.tubi) { const v = new THREE.Vector3(); t.getWorldPosition(v); particelle(v, 1, 0x9be37a, .5, .9, {fumo: true, r: .25, g: -1, cresce: 1}); }
  if (e.ali) for (const al of e.ali) al.rotation.z = al.userData.sx * ((k ? -.3 : 0) + Math.sin(tt * 3 + o.i) * .05);   // nell'abilita' i fulmini si aprono verso terra
  if (e.matF) e.matF.emissiveIntensity = k ? 1.4 : .25 + .15 * Math.sin(tt * 3);
  if (e.ruota) e.ruota.rotation.x += dt * (o.stato === 'volo' ? 14 : ferma ? .8 : 3);
}
function usaPoteRobot(o) { o.usa = .9; }
function animaRobot(o, dt, tt) {
  const v = o.podio ? o.podio.clone().sub(mondo.position) : pos(o.x, o.y), q = o.podio ? null : ST && ST.p[o.i];
  o.root.position.set(v.x + o.kx, o.alt + (o.podio ? o.podio.y : 0), v.z + o.kz);
  const dx = cam.position.x - (v.x + mondo.position.x), dz = cam.position.z - (v.z + mondo.position.z);
  o.guardo += dt * .6; const sguardo = Math.sin(o.guardo + o.i * 2) * .35 + Math.sin(o.guardo * .37 + o.i) * .2;
  // la faccia (visiera con la foto) guarda SEMPRE la camera, con un leggero 3/4; nel salto il corpo puo' girarsi verso la direzione e poi torna frontale
  const versoCam = Math.atan2(dx, dz) + .18 * (o.i % 2 ? 1 : -1) * (CAMT === 'primo' ? 0 : 1);
  const voluto = o.stato === 'volo' && o.direzione != null ? o.direzione : versoCam + (o.stato === 'idle' ? sguardo * .15 : 0);
  let dy = ((voluto - (o.yaw == null ? voluto : o.yaw)) % 6.2832 + 9.4248) % 6.2832 - 3.1416;
  o.yaw = (o.yaw == null ? voluto : o.yaw + dy * Math.min(1, dt * (o.stato === 'volo' ? 8 : 6)));
  o.root.rotation.y = o.yaw + o.spin;
  // lo schermo si inclina verso l'alto quanto basta per guardare la camera (alta, di 3/4)
  { const vy = cam.position.y - (o.root.position.y + mondo.position.y + 1), vh = Math.hypot(dx, dz); o.capo.rotation.x = -Math.max(0, Math.min(.75, Math.atan2(vy, vh) * .62)); }
  const st = o.stile, resp = o.stato === 'idle' ? Math.sin(tt * st.f + o.i) * st.amp * 1.5 : 0;
  { const sq = Math.max(o.ex.sqMin, o.sq);   // le sagome larghe si schiacciano meno: gli oggetti non arrivano accanto al cappello
    o.anca.scale.set(1 / Math.sqrt(sq), sq + resp - o.triste * .08, 1 / Math.sqrt(sq)); }
  o.anca.rotation.set(o.tiltX + o.triste * .35, 0, o.tiltZ + (o.stato === 'idle' ? Math.sin(tt * st.f * .5 + o.i) * st.dondola : 0));
  const sb = o.sbraccia, fs = o.festa, pa = o.paura;
  o.braccia.forEach((b, k) => {
    const s = k ? 1 : -1;
    b.rotation.z = s * (.35 + o.braccioSu * 2.2 + fs * (2.4 + Math.sin(tt * 14 + k) * .4) + pa * 2.0 - o.triste * .25) + (sb ? Math.sin(tt * 22 + k * 3) * 1.2 * sb : 0) + (o.stato === 'idle' ? Math.sin(tt * 2 + k) * .06 : 0);
    b.rotation.x = sb ? Math.cos(tt * 18 + k) * .8 * sb : pa ? -.9 * pa : 0;
  });
  if (pa) { o.anca.position.x = Math.sin(tt * 40) * .03 * pa; o.anca.scale.y *= 1 - .12 * pa; } else o.anca.position.x = 0;
  if (o.sfotto > 0) { o.sfotto -= dt; o.braccia[1].rotation.z = 2.6 + Math.sin(tt * 16) * .5; o.anca.rotation.z += Math.sin(tt * 10) * .08; }
  // emote fra un turno e l'altro
  if (o.emote) { o.emoteT += dt; const k = o.emoteT;
    if (o.emote === 'saluta') { o.braccia[0].rotation.z = -2.5 + Math.sin(k * 14) * .5; }
    else if (o.emote === 'giro') { o.spin = Math.min(1, k / .6) * 6.283; }
    else if (o.emote === 'salto') { o.alt = Math.max(0, Math.sin(Math.min(1, k / .5) * Math.PI) * .6); }
    else if (o.emote === 'cappello') { o.testa.position.y = o.testaY + Math.sin(Math.min(1, k / .6) * Math.PI) * .4; o.testa.rotation.z = -.15 + Math.sin(Math.min(1, k / .6) * Math.PI) * .6; }
    if (k > .7) { o.emote = null; o.spin = 0; o.alt = 0; } }
  { const L0 = o.ex.limB; o.braccia.forEach(b => { b.rotation.z = Math.max(-L0, Math.min(L0, b.rotation.z)); }); }   // le braccia non salgono mai accanto al cappello
  o.piedi.forEach(p => { p.position.y = .06 + (o.stato === 'volo' ? .12 : 0); p.rotation.x = o.stato === 'volo' ? -.5 : 0; });
  if (!o.emote || o.emote !== 'cappello') o.testa.position.y = o.testaY + Math.max(0, (o.sq - 1)) * .4 + (fs ? Math.abs(Math.sin(tt * 10)) * .25 : 0);
  o.stelle.visible = (o.capogiro > 0 || o.gelo) && !o.ko; if (o.stelle.visible) { o.capogiro = Math.max(0, o.capogiro - dt); o.stelle.rotation.y += dt * 8; if (o.capogiro) o.anca.rotation.z += Math.sin(tt * 9) * .12; }
  if (o.bordo && o.stato === 'idle' && !o.ko) { o.anca.rotation.z += Math.sin(tt * 5 + o.i) * .12; o.braccia.forEach((b, k) => { b.rotation.z += Math.sin(tt * 9 + k * 3) * .9; }); }
  o.ghiaccio.material.opacity += ((o.gelo && !o.ko ? .55 : 0) - o.ghiaccio.material.opacity) * Math.min(1, dt * 8);
  // scudo: campo di forza esagonale che pulsa
  const sc = q && q.scudo && !o.ko && q.vivo; o.scudo.visible = !!sc;
  if (sc) { o.scudo.material.opacity = .28 + .14 * Math.sin(tt * 4 + o.i); o.scudo.rotation.y += dt * .6; TEX_ESAGONI.offset.y = tt * .05; }
  o.crepe.material.opacity = Math.max(0, o.crepe.material.opacity - dt * 1.2);
  o.bolla.visible = !!(o.bollaOn && !o.ko);
  if (o.freccia) { o.freccia.position.y = 3.05 + Math.abs(Math.sin(tt * 3.5)) * .22; o.freccia.rotation.y += dt * 2; o.freccia.visible = !o.ko && FASE !== 'fine'; }
  if (q) { const k = statiDi(q, o.i).filter(s => s[1] != null).map(s => s.join(':')).join('|'); if (k !== o.statiK) { o.statiK = k; o.statiS.visible = !!k; if (k) { o.statiS.material.map = statiTex(statiDi(q, o.i).filter(s => s[1] != null)); o.statiS.material.needsUpdate = true; } } }
  o.statiS.visible = !!o.statiK && !o.ko && FASE !== 'fine';
  o.molla.visible = !!(q && q.molla && !o.ko); if (o.molla.visible) o.molla.children.forEach((m, k) => { m.material.opacity = .5 + .5 * Math.abs(Math.sin(tt * 5 + k)); m.position.y = .05 + k * (.07 + .03 * Math.sin(tt * 6)); });
  o.bomba.visible = !!(q && q.patata && !o.ko); if (o.bomba.visible) { if (o.timerV !== q.patata) { o.timerV = q.patata; o.timer.material.map = testoTex(String(q.patata), q.patata <= 1 ? '#ff4d4d' : '#ffd23f', 128, 128, 90); o.timer.material.needsUpdate = true; }
    o.bomba.rotation.z = Math.sin(tt * 6) * .2; o.miccia.scale.setScalar(.8 + Math.random() * .6); if (Math.random() < dt * 8 && !OPZ.rm) particelle(o.root.position.clone().add(mondo.position).add(new THREE.Vector3(.1, 2.2, 0)), 1, 0xffd23f, 1, .3, {r: .12}); }
  o.specchio.visible = !!(q && q.specchio && !o.ko); if (o.specchio.visible) { const a = tt * 1.6 + o.i; o.specchio.position.set(Math.cos(a) * .8, 1 + Math.sin(tt * 2) * .1, Math.sin(a) * .8); o.specchio.lookAt(o.root.position.clone().add(new THREE.Vector3(0, 1, 0))); }
  o.mirino.visible = !!(q && q.bersaglio && !o.ko); if (o.mirino.visible) o.mirino.rotation.y += dt * 1.5;
  o.corona.visible = !!(ST && ST.capo && ST.capo.includes(o.i) && !o.ko);
  // a un cuore: fumo e scintille
  if (q && q.vivo && q.hp === 1 && !o.ko && !OPZ.rm) { o.fumoT -= dt; if (o.fumoT <= 0) { o.fumoT = .25; const v2 = o.root.position.clone().add(mondo.position).add(new THREE.Vector3(0, 1.3, 0)); particelle(v2, 1, 0x666070, .4, 1.2, {fumo: true, r: .45, g: -1, cresce: 1}); if (Math.random() < .4) particelle(v2, 3, 0xffb040, 1.5, .3, {r: .08}); } }
  if (o.flash > 0) { o.flash -= dt; o.matC.emissive.setRGB(1, .2, .2).multiplyScalar(Math.floor(o.flash * 20) % 2 ? .9 : .1); } else o.matC.emissive.set(COL[o.i]).multiplyScalar(.05);
  o.root.visible = o.a > .02; o.root.scale.setScalar(Math.max(.01, o.a)); o.om.material.opacity = o.ko ? 0 : 1;
  animaForma(o, dt, tt);
  o.an.visible = o.om.visible = !o.ko && o.alt < 1.5 && o.alt > -.5; o.om.scale.setScalar(Math.max(.4, 1 - Math.max(0, o.alt) * .25)); o.om.position.y = .11 - o.alt;
  o.nome.material.opacity = o.ko ? 0 : 1;
}

/* ---------------- PERSONAGGI DELLO STAGNO (passata «pro» 17/11) ----------------
   I sei personaggi di CONCEPT.md (Tonfo, Zip, Axa, Camu, Grumo, Luma) con le loro 6 pose dipinte (assets_bayou/pg, arte gia' pagata il 16/11).
   Ogni personaggio e' una «carta» in piedi sulla ninfea: guarda la camera ma resta inclinata un po' all'indietro, ha il contorno del colore
   del giocatore, luce di bordo dell'acqua, ombra di contatto, anello a terra. Le pose (pronto, salto, scontro, colpito, vittoria) si
   alternano con schiacciamento e allungamento; il giro su se stesso e' un giro «di carta». La foto del profilo e' l'oblò che galleggia
   sopra la testa (mai sul corpo); sulla testa non si aggiunge niente. */
const POSE = ['idle', 'ready', 'jump', 'clash', 'hit', 'win'];
let META = null; const TEXPG = {};
const ALTO_PG = 1.78, TAGLIA_PG = {tonfo: 1.05, grumo: 1.05, zip: 1, axa: .95, camu: 1, luma: .98};
async function conLimite(lavori, n) { let k = 0; await Promise.all(Array.from({length: n}, async () => { while (k < lavori.length) await lavori[k++](); })); }
async function caricaBayou() {
  try { META = await (await fetch('assets_bayou/meta.json?v=' + VER)).json(); } catch (e) { console.warn('meta bayou', e); return; }
  // al massimo 6 richieste insieme (il server di prova e i telefoni lenti non reggono 50 file in parallelo)
  const ld = new THREE.TextureLoader(), lav = [];
  for (const pg of PGS) { TEXPG[pg] = {}; for (const s of POSE) lav.push(() => new Promise(r => ld.load(`assets_bayou/pg/${pg}_${s}.webp`, t => { t.anisotropy = 4; t.generateMipmaps = true; TEXPG[pg][s] = t; r(); }, undefined, () => r()))); }
  for (const k of Object.keys(META.ic)) lav.push(() => carica(`assets_bayou/ic/${k}.webp`).then(im => { if (im) IMGIC[k] = im; }));
  await conLimite(lav, 6);
  for (const k in TEXDISCO) delete TEXDISCO[k];
}
const VS_PG = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
const FS_PG = `uniform sampler2D map; uniform vec3 col; uniform vec3 rim; uniform vec3 emis; uniform vec3 tinta; uniform float flip; uniform float op; uniform vec2 px; uniform float sat; uniform float spesso; varying vec2 vUv;
  void main(){
    vec2 uv = vec2(flip > .5 ? 1. - vUv.x : vUv.x, vUv.y);
    vec4 c = texture2D(map, uv);
    float o1 = 0., o2 = 0.;
    for (int k = 0; k < 12; k++) { float a = float(k) * .5236; vec2 d = vec2(cos(a), sin(a)) * px;
      o1 = max(o1, texture2D(map, uv + d * 2.5).a); o2 = max(o2, texture2D(map, uv + d * spesso).a); }
    float lx = flip > .5 ? 1. : -1.;
    float bordo = clamp(c.a - texture2D(map, uv + vec2(lx, 1.2) * px * 5.).a, 0., 1.);
    float g = dot(c.rgb, vec3(.299, .587, .114));
    vec3 rgb = mix(vec3(g), c.rgb, sat) * tinta;
    rgb *= mix(vec3(.74, .88, .86), vec3(1.), smoothstep(.02, .45, vUv.y));
    rgb += rim * bordo * .6 + emis;
    float scuro = smoothstep(.15, .6, o1), colore = smoothstep(.15, .6, o2);
    float aO = max(scuro, colore);
    vec3 cO = mix(col, vec3(.03, .09, .08), scuro * .85);
    float a = c.a + (1. - c.a) * aO;
    vec3 outc = (rgb * c.a + cO * (a - c.a)) / max(a, .001);
    if (a * op < .02) discard;
    gl_FragColor = vec4(outc, a * op);
  }`;
const GEO_CARTA = new THREE.PlaneGeometry(1, 1);
// l'oblò con la foto: cerchio col colore del giocatore e una punta verso la testa (tu: anello bianco e «TU»)
function badgeFoto(i) {
  const c = tela(256, 300), g = c.getContext('2d'), f = IMGAV[i], io = i === IO, col = COL[i];
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(128, 132, 112, 0, 6.29); g.fill();
  g.fillStyle = io ? '#ffffff' : col; g.beginPath(); g.arc(128, 124, 112, 0, 6.29); g.moveTo(96, 222); g.lineTo(128, 290); g.lineTo(160, 222); g.fill();
  if (io) { g.fillStyle = col; g.beginPath(); g.arc(128, 124, 98, 0, 6.29); g.fill(); }
  g.save(); g.beginPath(); g.arc(128, 124, io ? 84 : 92, 0, 6.29); g.clip(); g.fillStyle = '#0d2a26'; g.fillRect(0, 0, 256, 256);
  if (f) { const s = Math.max(200 / f.width, 200 / f.height) * 1.02; g.drawImage(f, 128 - f.width * s / 2, 124 - f.height * s * .5, f.width * s, f.height * s); }
  const l = g.createLinearGradient(0, 30, 0, 220); l.addColorStop(0, 'rgba(255,255,255,.22)'); l.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, 256, 256); g.restore();
  if (io) { g.font = `800 50px ${FT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const tx = L().tu.toUpperCase(), w = g.measureText(tx).width + 34;
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect ? g.roundRect(128 - w / 2, 2, w, 54, 27) : g.rect(128 - w / 2, 2, w, 54); g.fill(); g.fillStyle = '#0b1a18'; g.fillText(tx, 128, 31); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
const TEX_GOCCIA = (() => { const c = tela(64, 64), g = c.getContext('2d'); g.fillStyle = '#e8fffb'; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(54, 36, 32, 58); g.quadraticCurveTo(10, 36, 32, 4); g.fill(); return new THREE.CanvasTexture(c); })();
function nuovoBot(i, pgArg) {
  const pgB = pgArg || (ST && ST.p && ST.p[i] ? ST.p[i].pg : OPZ.pg), col = new THREE.Color(COL[i]), k = TAGLIA_PG[pgB] || 1;
  const root = new THREE.Group(), taglia = new THREE.Group(), anca = new THREE.Group(); root.add(taglia); taglia.add(anca);
  const mat = new THREE.ShaderMaterial({uniforms: {map: {value: null}, col: {value: col}, rim: {value: new THREE.Color(0x9ff6e6)}, emis: {value: new THREE.Color(0)}, tinta: {value: new THREE.Color(1, 1, 1)},
    flip: {value: 0}, op: {value: 1}, px: {value: new THREE.Vector2(1 / 400, 1 / 448)}, sat: {value: 1}, spesso: {value: 9}}, vertexShader: VS_PG, fragmentShader: FS_PG, transparent: true, depthWrite: false, side: THREE.DoubleSide});
  const carta = new THREE.Mesh(GEO_CARTA, mat); anca.add(carta);
  const m0 = META && META.pg[pgB] ? META.pg[pgB].idle : {w: 340, h: 448, fx: .5, fy: .04, top: .96};
  const topY = (m0.top - m0.fy) * ALTO_PG * k;
  // ombra di contatto e anello a terra (colore del giocatore)
  const om = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: TEX_OMBRA, transparent: true, depthWrite: false, opacity: .9})); om.position.y = .03; om.renderOrder = 1; root.add(om);
  const an = new THREE.Mesh(new THREE.RingGeometry(.5, .62, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: COL[i], transparent: true, opacity: .95, depthWrite: false})); an.position.y = .04; an.renderOrder = 1; root.add(an);
  if (i === IO) { const b = new THREE.Mesh(new THREE.RingGeometry(.63, .69, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, depthWrite: false})); b.position.y = .04; root.add(b); }
  const badge = new THREE.Sprite(new THREE.SpriteMaterial({map: badgeFoto(i), transparent: true, depthTest: false, depthWrite: false})); { const bs = i === IO ? .8 : .66; badge.scale.set(bs, bs * 300 / 256, 1); } badge.position.y = topY + .5; badge.renderOrder = 20; root.add(badge);
  const stati = new THREE.Sprite(new THREE.SpriteMaterial({transparent: true, depthTest: false})); stati.scale.set(1.3, .32, 1); stati.position.y = topY + 1.02; stati.visible = false; stati.renderOrder = 21; root.add(stati);
  const nome = new THREE.Sprite(new THREE.SpriteMaterial({map: testoTex(nm(i), COL[i], 256, 64, 38), transparent: true, depthTest: false})); nome.scale.set(1.3, .32, 1); nome.position.y = topY + 1.0; nome.visible = false; root.add(nome);
  // STATI (stessi oggetti di prima, misurati sull'altezza del personaggio)
  const cy = topY * .48, rr = Math.max(.9, topY * .55);
  const scudo = new THREE.Mesh(new THREE.SphereGeometry(rr, 28, 18), new THREE.MeshBasicMaterial({color: 0xffc9a0, map: TEX_ESAGONI, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}));
  scudo.position.y = cy; scudo.visible = false; root.add(scudo);
  const crepe = new THREE.Mesh(new THREE.SphereGeometry(rr * 1.02, 20, 14), new THREE.MeshBasicMaterial({map: TEX_CREPE, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending})); crepe.position.y = cy; root.add(crepe);
  const bolla = new THREE.Mesh(new THREE.SphereGeometry(rr * .98, 24, 16), new THREE.MeshPhysicalMaterial({color: 0xcff6ff, transparent: true, opacity: .22, roughness: .05, clearcoat: 1, depthWrite: false})); bolla.position.y = cy; bolla.visible = false; root.add(bolla);
  const ghiaccio = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .1), new THREE.MeshBasicMaterial({transparent: true, opacity: 0})); ghiaccio.visible = false; root.add(ghiaccio);
  const melma = new THREE.Mesh(new THREE.CircleGeometry(.7, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: null, color: 0x5a4220, transparent: true, opacity: 0, depthWrite: false})); melma.position.y = .05; root.add(melma);
  const stelle = new THREE.Group(); stelle.position.y = topY + .05; stelle.visible = false; root.add(stelle);
  for (let s = 0; s < 4; s++) { const st = new THREE.Mesh(GEO.stella, new THREE.MeshBasicMaterial({color: 0xffe066})); st.position.set(Math.cos(s * 1.57) * .42, 0, Math.sin(s * 1.57) * .42); stelle.add(st); }
  const molla = new THREE.Group(); molla.visible = false; root.add(molla);
  for (let s = 0; s < 3; s++) { const mm = new THREE.Mesh(GEO.spira, new THREE.MeshBasicMaterial({color: 0xd6f24a, transparent: true, opacity: .9, blending: THREE.AdditiveBlending})); mm.rotation.x = Math.PI / 2; mm.position.y = .05 + s * .07; molla.add(mm); }
  const bomba = new THREE.Group(); bomba.position.set(.55, topY * .7, 0); bomba.visible = false; root.add(bomba);
  const bm = new THREE.Sprite(new THREE.SpriteMaterial({map: IMGIC.cardo ? new THREE.CanvasTexture((() => { const c = tela(128, 128); c.getContext('2d').drawImage(IMGIC.cardo, 0, 0, 128, 128); return c; })()) : null, color: 0xffffff, transparent: true, depthTest: false})); bm.scale.set(.55, .55, 1); bm.renderOrder = 19; bomba.add(bm);
  const miccia = new THREE.Object3D(); bomba.add(miccia);
  const timer = new THREE.Sprite(new THREE.SpriteMaterial({transparent: true, depthTest: false})); timer.scale.set(.42, .42, 1); timer.position.set(.22, .22, 0); timer.renderOrder = 22; bomba.add(timer);
  const specchio = new THREE.Mesh(GEO.esagono, new THREE.MeshStandardMaterial({color: 0xe8fbff, metalness: .6, roughness: .1, emissive: 0x3a7a8a, emissiveIntensity: .4, transparent: true, opacity: .8, side: THREE.DoubleSide})); specchio.visible = false; root.add(specchio);
  const mirino = new THREE.Group(); mirino.visible = false; root.add(mirino);
  const mr = new THREE.Mesh(new THREE.RingGeometry(.66, .76, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xff2a2a, transparent: true, opacity: .9, depthWrite: false})); mr.position.y = .06; mirino.add(mr);
  for (let s = 0; s < 4; s++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(.06, .3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xff2a2a})); const a = s * Math.PI / 2; t.position.set(Math.cos(a) * .86, .06, Math.sin(a) * .86); t.rotation.y = -a; mirino.add(t); }
  mondo.add(root);
  const dummy = () => new THREE.Group();
  const o = {i, pg: pgB, k, ex: {sqMin: .62, limB: 2, taglia: {largo: +(ALTO_PG * k * m0.w / m0.h).toFixed(2), alto: +topY.toFixed(2)}}, carta, mat, topY, badge, posa: null, posaF: null, posaT: 0, verso: 0, pop: 0, inAcqua: false,
    viso: dummy(), capo: dummy(), testa: dummy(), rOblo: .3, tubo: .05, scH: 1, testaY: 0, root, anca, busto: taglia, braccia: [], piedi: [], om, an, nome, freccia: null, statiS: stati, statiK: '', bollaOn: false,
    scudo, crepe, bolla, ghiaccio, melma, stelle, molla, bomba, timer, miccia, specchio, mirino, corona: {visible: false}, matC: {emissive: new THREE.Color(0)},
    x: 0, y: 0, alt: 0, a: 1, ko: false, stato: 'idle', sq: 1, spin: 0, tiltX: 0, tiltZ: 0, kx: 0, kz: 0, guardo: Math.random() * 9, braccioSu: 0, sbraccia: 0, capogiro: 0, gelo: false, flash: 0, festa: 0, sfotto: 0, bordo: false, paura: 0,
    emote: null, emoteT: 0, triste: 0, fumoT: 0, timerV: -1, usa: 0,
    stile: {f: 2.4 + i * .3, dondola: .05 + (i % 2) * .04}};
  setPosa(o, 'idle'); if (GLBS[pgB]) vestiGLB(o);
  RANE.push(o); return o;
}
function setPosa(o, p) {
  const t = TEXPG[o.pg] && TEXPG[o.pg][p]; if (!t || !META) return;
  if (o.posa !== p) { if (o.posa) o.pop = .1; o.posa = p; }
  const m = META.pg[o.pg][p], h = ALTO_PG * o.k, w = h * m.w / m.h;
  o.mat.uniforms.map.value = t; o.mat.uniforms.px.value.set(1 / m.w, 1 / m.h); o.carta.scale.set(w, h, 1);
  o.carta.position.set((o.verso ? m.fx - .5 : .5 - m.fx) * w, (.5 - m.fy) * h, 0);
}
function usaPotere(o) { o.usa = .9; o.posaF = 'clash'; o.posaT = .55; const v = o.root.position.clone().add(mondo.position); v.y = .12; if (!OPZ.rm) anello(v, new THREE.Color(COL[o.i]).getHex(), 1.8, .45, .12); }
// l'acqua: spruzzo grande (caduta) o piccolo (atterraggio)
function spruzzo(v, forza) {
  const f = forza || 1, w = v.clone(); w.y = .02;
  anello(w, 0xbff6ea, 1.3 + f * 1.4, .55, .08); setTimeout(() => anello(w, 0x7fe6d0, 1 + f, .6, .06), 140);
  particelle(w.clone().add(new THREE.Vector3(0, .1, 0)), Math.round(10 + 22 * f), 0xdffff8, 1.2 + 2.4 * f, .7 + .3 * f, {su: 1.6 + 2 * f, r: .12 + .06 * f, g: 9});
  if (f > .7) particelle(w.clone().add(new THREE.Vector3(0, .2, 0)), 8, 0xcffff4, .8, 1.1, {fumo: true, r: .5, g: -.3, cresce: 1.2});
}
function animaBot(o, dt, tt) {
  const v = o.podio ? o.podio.clone().sub(mondo.position) : pos(o.x, o.y), q = o.podio ? null : ST && ST.p && ST.p[o.i];
  const festaSu = o.festa > 0 && o.stato !== 'volo' ? Math.abs(Math.sin(tt * 7 + o.i)) * .32 * Math.min(1, o.festa) : 0;
  const versoCentro = !o.podio && ROT ? (o.glb ? 0 : o.y <= 0 ? .2 : o.y >= H - 1 ? -.2 : 0) : 0;
  o.root.position.set(v.x + o.kx + versoCentro, o.alt + (o.podio ? o.podio.y : 0) + .06 + festaSu, v.z + o.kz);
  const wx = v.x + mondo.position.x, wz = v.z + mondo.position.z, dx = cam.position.x - wx, dz = cam.position.z - wz;
  o.root.rotation.y = Math.atan2(dx, dz);
  const elev = Math.atan2(cam.position.y - (o.root.position.y + 1), Math.hypot(dx, dz));
  // la posa giusta per il momento
  if (o.posaT > 0) o.posaT -= dt; if (o.usa > 0) o.usa -= dt;
  if (o.sfotto > 0) o.sfotto -= dt;
  let p = 'idle';
  if (o.ko && o.alt < -.1) p = 'hit';
  else if (o.posaF && o.posaT > 0) p = o.posaF;
  else if (o.festa > 0 || (o.podio && !o.triste)) p = 'win';
  else if (o.triste) p = 'hit';
  else if (o.stato === 'colpito' || o.flash > 0) p = 'hit';
  else if (o.stato === 'volo') p = o.sbraccia ? 'hit' : (o.scontro ? 'clash' : 'jump');
  else if (o.stato === 'carica' || o.stato === 'atterra' || o.paura > 0 || o.gelo) p = 'ready';
  else if (o.capogiro > .6) p = 'hit';
  else if (o.sfotto > 0 || (o.emote === 'saluta' || o.emote === 'cappello')) p = 'win';
  // verso: guarda dove salta (le pose dipinte guardano a destra)
  if (o.direzione != null && o.stato === 'volo') { const e = cam.matrixWorld.elements, s = Math.sin(o.direzione) * e[0] + Math.cos(o.direzione) * e[2]; if (Math.abs(s) > .2) o.verso = s < 0 ? 1 : 0; }
  o.mat.uniforms.flip.value = o.verso; setPosa(o, p);
  o.pop = Math.max(0, o.pop - dt * .9);
  // schiacciamento e allungamento, respiro, giro «di carta»
  const resp = o.stato === 'idle' && !o.ko ? Math.sin(tt * o.stile.f + o.i) * .028 : 0;
  o.jv = (o.jv || 0) + (-170 * (o.jz || 0) - 10 * (o.jv || 0)) * dt; o.jz = (o.jz || 0) + o.jv * dt; if (OPZ.rm) o.jz = 0;
  const sq = Math.max(.5, o.sq + resp - o.triste * .06 + o.jz), tremo = o.paura ? Math.sin(tt * 47) * .03 * o.paura : 0;
  const giroCarta = o.glb ? 1 : Math.cos(o.spin), pp = 1 + o.pop * (OPZ.rm ? 0 : 1);   // splash2 17/11: il «giro di carta» schiacciava i modelli 3D fino a farli piatti (la rotazione strana di Tonfo)
  o.anca.scale.set(giroCarta / Math.sqrt(sq) * pp, sq * pp, 1);
  o.anca.rotation.set(-elev * .7 + o.tiltX * .35, 0, o.tiltZ * .8 + tremo + (o.stato === 'idle' && !o.podio ? Math.sin(tt * o.stile.f * .5 + o.i) * o.stile.dondola : 0) + (o.capogiro > 0 ? Math.sin(tt * 9) * .1 : 0) + (o.bordo && o.stato === 'idle' && !o.ko ? Math.sin(tt * 6 + o.i) * .1 : 0));
  // emote fra un turno e l'altro
  if (o.emote) { o.emoteT += dt; const k = o.emoteT;
    if (o.emote === 'giro') o.spin = Math.min(1, k / .6) * 6.283;
    else if (o.emote === 'salto') { o.alt = Math.max(0, Math.sin(Math.min(1, k / .5) * Math.PI) * .55); o.sq = 1 + Math.sin(Math.min(1, k / .5) * Math.PI) * .12; }
    if (k > .8) { o.emote = null; o.spin = 0; o.alt = 0; o.sq = 1; } }
  // luce e colore: lampo rosso quando colpito, melma marrone, grigio per chi ha perso
  const u = o.mat.uniforms;
  if (o.flash > 0) { o.flash -= dt; u.emis.value.setRGB(1, .15, .1).multiplyScalar(Math.floor(o.flash * 20) % 2 ? .55 : .05); } else u.emis.value.copy(o.matC.emissive).multiplyScalar(.6);
  if (o.usa > 0) u.emis.value.add(new THREE.Color(COL[o.i]).multiplyScalar(.35 * Math.sin(Math.min(1, o.usa / .9) * Math.PI)));
  u.tinta.value.setRGB(1, 1, 1); if (o.gelo && !o.ko) u.tinta.value.setRGB(.82, .68, .5);
  u.sat.value = o.triste ? .45 : 1;
  // in acqua: spruzzo quando entra, poi sparisce sotto la superficie
  if (o.alt < -.12 && !o.inAcqua) { o.inAcqua = true; const w = o.root.position.clone().add(mondo.position); w.y = 0; spruzzo(w, o.ko ? 1.2 : 1); suono('splash', o.ko ? 1 : .8); }
  if (o.alt >= 0) o.inAcqua = false;
  u.op.value = Math.max(0, Math.min(1, 1 + (o.alt + .1) / 1.1));
  // stati
  o.stelle.visible = (o.capogiro > 0 || o.gelo) && !o.ko; if (o.stelle.visible) { o.capogiro = Math.max(0, o.capogiro - dt); o.stelle.rotation.y += dt * 8; }
  o.melma.material.opacity += ((o.gelo && !o.ko ? .7 : 0) - o.melma.material.opacity) * Math.min(1, dt * 8); o.melma.visible = o.melma.material.opacity > .02;
  const sc = q && q.scudo && !o.ko && q.vivo; o.scudo.visible = !!sc;
  if (sc) { o.scudo.material.opacity = .22 + .12 * Math.sin(tt * 4 + o.i); o.scudo.rotation.y += dt * .6; TEX_ESAGONI.offset.y = tt * .05; }
  o.crepe.material.opacity = Math.max(0, o.crepe.material.opacity - dt * 1.2);
  o.bolla.visible = !!(o.bollaOn && !o.ko);
  if (q) { const k = statiDi(q, o.i).filter(s => s[1] != null).map(s => s.join(':')).join('|'); if (k !== o.statiK) { o.statiK = k; if (k) { o.statiS.material.map = statiTex(statiDi(q, o.i).filter(s => s[1] != null)); o.statiS.material.needsUpdate = true; } } }
  o.statiS.visible = !!o.statiK && !o.ko && FASE !== 'fine' && FASE !== 'rivela';
  o.badge.visible = !o.ko && o.a > .5; { const hb = (o.topY + (o.glb ? (o.podio || ANTE ? .6 : .34) : .42)) * o.sq, th = -o.anca.rotation.x; o.badge.position.set(0, hb * Math.cos(th) + .06, -hb * Math.sin(th)); }
  o.molla.visible = !!(q && q.molla && !o.ko); if (o.molla.visible) o.molla.children.forEach((m, k) => { m.material.opacity = .5 + .5 * Math.abs(Math.sin(tt * 5 + k)); m.position.y = .05 + k * (.07 + .03 * Math.sin(tt * 6)); });
  o.bomba.visible = !!(q && q.patata && !o.ko); if (o.bomba.visible) { if (o.timerV !== q.patata) { o.timerV = q.patata; o.timer.material.map = badgeTex(String(q.patata), q.patata <= 1 ? ROSSO : '#e0701a'); o.timer.material.needsUpdate = true; }
    o.bomba.rotation.z = Math.sin(tt * 6) * .15; o.bomba.position.y = o.topY * .72 + Math.sin(tt * 3) * .05; }
  o.specchio.visible = !!(q && q.specchio && !o.ko); if (o.specchio.visible) { const a = tt * 1.6 + o.i; o.specchio.position.set(Math.cos(a) * .8, o.topY * .5 + Math.sin(tt * 2) * .1, Math.sin(a) * .8); o.specchio.lookAt(o.root.position.clone().add(new THREE.Vector3(0, 1, 0))); }
  o.mirino.visible = !!(q && q.bersaglio && !o.ko); if (o.mirino.visible) o.mirino.rotation.y += dt * 1.5;
  // a un cuore: gocce di sudore
  if (q && q.vivo && q.hp === 1 && !o.ko && !OPZ.rm) { o.fumoT -= dt; if (o.fumoT <= 0) { o.fumoT = .35; const v2 = o.root.position.clone().add(mondo.position).add(new THREE.Vector3((Math.random() - .5) * .5, o.topY * .9, 0)); particelle(v2, 2, 0x9fe8ff, .9, .7, {r: .09, su: .8, g: 5}); } }
  o.root.visible = o.a > .02; o.root.scale.setScalar(Math.max(.01, o.a));
  o.an.visible = o.om.visible = !o.ko && o.alt < 1.8 && o.alt > -.1; o.om.scale.setScalar(Math.max(.35, 1 - Math.max(0, o.alt) * .3) * o.k); o.om.position.y = .03 - o.alt; o.an.position.y = .04 - o.alt;
  o.om.material.opacity = .9 * Math.max(.3, 1 - Math.max(0, o.alt) * .35);
  if (o.glb) { posaGLB(o, p); animaGLB(o, dt); }
}

/* ---------------- PERSONAGGI 3D (GLB con scheletro) ----------------
   Se esiste assets_bayou/glb/manifest.json, i personaggi elencati diventano modelli 3D animati al posto della carta dipinta.
   manifest: {"<pg>": {"file": "zip.glb", "alto": 1.7, "clip": {"idle": "...", "ready": "...", "jump": "...", "land": "...", "clash": "...", "hit": "...", "fall": "...", "win": "...", "lose": "..."}}}
   Le clip mancanti ripiegano su quelle vicine (land -> ready -> idle, fall -> hit, lose -> idle). Sopra le clip restano schiacciamento,
   allungamento e rollio procedurali; il contorno del colore del giocatore e' uno «scafo rovesciato» che segue lo scheletro.
   Prova senza modelli veri: ?glbprova=1 usa il modello di prova assets_bayou/glb/_prova.glb per tutti. */
const GLBS = {};
async function caricaGLB() {
  if (!THREE.GLTFLoader) return;
  let man = null;
  try { const r = await fetch((Q.get('glbprova') === '1' ? 'assets_bayou/glb/manifest_prova.json' : 'assets_bayou/glb/manifest.json') + '?v=' + VER, {cache: 'no-store'}); if (r.ok) man = await r.json(); } catch (e) {}
  if (!man) return;
  const ld = new THREE.GLTFLoader(), file = {}; if (window.MeshoptDecoder) ld.setMeshoptDecoder(window.MeshoptDecoder);
  const prendi = f => file[f] || (file[f] = new Promise(res => ld.load('assets_bayou/glb/' + f + '?v=' + VER, res, undefined, e => { console.warn('glb', f, e && e.message); res(null); })));
  // correzioni anti-compenetrazione (mani fuori dalla testa): tracce di braccio e avambraccio rifatte con IK, una volta, offline
  // (varianti/client/_compenetrazioni.html + strumenti/pro/compenetrazioni.js); qui si sostituiscono soltanto le tracce
  let correz = {}; try { const r = await fetch('assets_bayou/glb/correzioni.json?v=' + VER, {cache: 'no-store'}); if (r.ok) correz = await r.json(); } catch (e) {}
  const corretti = new Set();
  const correggiClip = (pg, g) => { if (corretti.has(g) || !correz[pg]) return; corretti.add(g);
    for (const c of g.animations) { const k = correz[pg][c.name]; if (!k) continue; const fps = k._fps || 30;
      for (const [nome, vals] of Object.entries(k)) { if (nome === '_fps') continue; const n = vals.length / 4, times = new Float32Array(n); for (let f = 0; f < n; f++) times[f] = Math.min(c.duration, f / fps);
        const nuova = new THREE.QuaternionKeyframeTrack(nome, times, Float32Array.from(vals)); const j = c.tracks.findIndex(t => t.name === nome); if (j >= 0) c.tracks[j] = nuova; else c.tracks.push(nuova); } } };
  const ancaDi = sc => { let a = null; sc.traverse(n => { if (!a && n.isBone && /Hips$/.test(n.name)) a = n.position.clone(); }); return a; };
  await Promise.all(PGS.map(async pg => {
    const m = man[pg] || man['*']; if (!m) return;
    const g = await prendi(m.file); if (!g) return; correggiClip(pg, g);
    // le clip possono venire da un altro file con lo stesso scheletro (es. «clipDa»: "tonfo.glb"): si condividono per nome d'osso
    const gc = m.clipDa ? await prendi(m.clipDa) : g; if (!gc) return;
    // misura vera: per le mesh con scheletro i vertici si posano con le ossa (la bounding box della geometria puo' essere in altre unita')
    g.scene.updateMatrixWorld(true); const bb = new THREE.Box3(), v = new THREE.Vector3();
    g.scene.traverse(n => { if (!n.isMesh) return; const P = n.geometry.attributes.position, passo = Math.max(1, Math.floor(P.count / 1500));
      for (let k = 0; k < P.count; k += passo) { if (n.isSkinnedMesh) { n.boneTransform(k, v); v.applyMatrix4(n.matrixWorld); } else v.fromBufferAttribute(P, k).applyMatrix4(n.matrixWorld); bb.expandByPoint(v); } });
    const dim = bb.getSize(new THREE.Vector3()); let rawH = 0; g.scene.traverse(n => { if (n.isMesh) { n.geometry.computeBoundingBox(); rawH = Math.max(rawH, n.geometry.boundingBox.max.y - n.geometry.boundingBox.min.y, n.geometry.boundingBox.max.z - n.geometry.boundingBox.min.z); } });
    // clip (copie, mai gli originali condivisi): via le tracce delle dita, anca ferma in orizzontale (niente deriva);
    // se le clip vengono da un altro modello, l'altezza dell'anca si riporta in scala (anca a riposo di questo / di quello)
    // clip (copie, mai gli originali condivisi): via le dita e le ossa che questo scheletro non ha, anca ferma in orizzontale;
    // se una clip viene da un altro modello: rotazioni come «differenza dal riposo» rimesse sul riposo di questo scheletro, anca in scala
    const a0 = ancaDi(g.scene), ossa = new Set(); g.scene.traverse(n => ossa.add(n.name));
    const riposo = sc => { const r = {}; sc.traverse(n => { if (n.isBone) r[n.name] = n.quaternion.clone(); }); return r; }, riposoT = riposo(g.scene), cacheS = new Map();
    const prepara = (c0, src) => { const c = c0.clone(); c.tracks = c.tracks.filter(t => !/Hand(Index|Middle|Pinky|Ring|Thumb)/.test(t.name) && ossa.has(t.name.split('.')[0]));
      let sY = 1;
      if (src !== g) { if (!cacheS.has(src)) cacheS.set(src, riposo(src.scene)); const riposoS = cacheS.get(src), aD = ancaDi(src.scene); sY = a0 && aD && aD.y ? a0.y / aD.y : 1;
        for (const t of c.tracks) { if (!/\.quaternion$/.test(t.name)) continue; const nome = t.name.split('.')[0], rs = riposoS[nome], rt = riposoT[nome]; if (!rs || !rt) continue;
          const inv = rs.clone().invert(), q = new THREE.Quaternion(), w = t.values = t.values.slice();
          for (let k = 0; k < w.length; k += 4) { q.fromArray(w, k).multiply(inv).multiply(rt); q.toArray(w, k); } } }
      for (const t of c.tracks) if (/Hips\.position$/.test(t.name)) { const w = t.values = t.values.slice(); for (let k = 0; k < w.length; k += 3) { w[k] = a0 ? a0.x : w[0]; w[k + 1] *= sY; w[k + 2] = a0 ? a0.z : w[2]; } }
      return c; };
    const FPS = 24, clips = gc.animations.map(c0 => prepara(c0, gc));
    const trovaIn = (lista, n) => lista.find(c => c.name === n) || lista.find(c => c.name.toLowerCase().includes(String(n).toLowerCase())), nomi = {};
    // ogni voce del manifest: "nome" | {nome, da, a} | {file: "tonfo.glb", nome, da?, a?} (una clip presa da un altro file, es. un idle rotto)
    for (const [k, sp] of Object.entries(m.clip || {})) {
      let base = null;
      if (sp && typeof sp === 'object' && sp.file) { const gx = await prendi(sp.file); const c0 = gx && trovaIn(gx.animations, sp.nome); if (c0) { base = prepara(c0, gx); base.name = '_src_' + k; clips.push(base); } }
      else base = trovaIn(clips, sp && typeof sp === 'object' ? sp.nome : sp);
      if (!base) continue;
      if (sp && typeof sp === 'object' && sp.da != null) { const sub = THREE.AnimationUtils.subclip(base, '_' + k, Math.round(sp.da * FPS), Math.round(sp.a * FPS), FPS); clips.push(sub); nomi[k] = sub.name; }
      else nomi[k] = base.name; }
    // centrato sulla ninfea dall'anca (osso a riposo), non dalla scatola: lanterna e code allargano la scatola da una parte
    let hw = null; g.scene.traverse(n => { if (!hw && n.isBone && /Hips$/.test(n.name)) hw = n.getWorldPosition(new THREE.Vector3()); });
    GLBS[pg] = {scene: g.scene, clips, nomi, dur: m.dur || {}, m, raw: rawH / Math.max(.001, dim.y), k: (m.alto || 1.7) / Math.max(.001, dim.y), dimW: Math.max(.001, dim.x), dimH: Math.max(.001, dim.y), y0: -bb.min.y, cx: -(hw ? hw.x : (bb.min.x + bb.max.x) / 2), cz: -(hw ? hw.z : (bb.min.z + bb.max.z) / 2)};
  }));
  // misura per sagoma, non per altezza: ognuno occupa sullo schermo circa la stessa area (larghezza x altezza) di Tonfo,
  // cosi' Zip, alto e magro, non sembra un gigante. ?sagoma_k=1.05 regola il riferimento.
  const rif = GLBS.tonfo || Object.values(GLBS)[0]; if (rif) { const hT = 1.75 * +(Q.get('sagoma_k') || 1.05), A = (rif.dimW / rif.dimH) * hT * hT;
    for (const [pg, G] of Object.entries(GLBS)) { const f = +(Q.get('scala_' + pg) || MISURA_PG[pg] || 1); G.k = Math.sqrt(A / (G.dimW * G.dimH)) * f; G.altoEff = G.dimH * G.k; } }
}
// misura a occhio sopra la regola della sagoma (tarata sul telefono, camera del gioco): i rospi grossi sono i piu' grossi, Zip il piu' piccolo
const MISURA_PG = {tonfo: 1.125, grumo: 1.05, camu: .8, luma: .85, axa: .82, zip: .72};
// VARIANTI DI COLORE: se piu' giocatori hanno lo stesso personaggio, il secondo, il terzo... hanno la pelle di un altro colore
// (si sposta la tinta dei pixel colorati; quelli quasi grigi o bianchi - occhi, denti, dettagli - restano). Ordine dei posti = uguale per tutti.
const VARIANTI_PG = {tonfo: [[-.11, 1.05, 1.05], [.27, .9, 1], [.45, .85, 1]], zip: [[-.28, .75, .95], [.42, .85, 1], [.15, .75, 1]], axa: [[.47, .9, 1.05], [-.17, 1, 1], [.15, 1.1, 1.05]],
  camu: [[.5, .85, 1], [.33, .75, .95], [.6, .75, 1]], grumo: [[.22, 1, 1], [-.1, 1.2, .95], [.5, .9, 1]], luma: [[.6, 1.1, 1.1], [.33, 1, 1.05], [.12, 1.1, 1.1]]};
function variante(i, pg) { if (Q.get('var') != null && ANTE) return +Q.get('var'); if (!ST || !ST.p) return 0; let n = 0; for (let j = 0; j < i; j++) if (ST.p[j] && ST.p[j].pg === pg) n++; return n; }
function ricolora(m, v) {
  if (!v || m.userData.ricolorato) return; m.userData.ricolorato = true; m.userData.var = {value: new THREE.Vector3(v[0], v[1], v[2])};
  m.onBeforeCompile = sh => { sh.uniforms.uVar = m.userData.var;
    sh.fragmentShader = 'uniform vec3 uVar;\nvec3 hsvDa(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-10)),d/(q.x+1e-10),q.x);}\nvec3 rgbDa(vec3 c){vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}\n' + sh.fragmentShader;
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      { vec3 h = hsvDa(diffuseColor.rgb); float mask = smoothstep(.16, .32, h.y) * smoothstep(.06, .16, h.z);
        vec3 h2 = vec3(fract(h.x + uVar.x), clamp(h.y * uVar.y, 0., 1.), clamp(h.z * uVar.z, 0., 1.)); diffuseColor.rgb = mix(diffuseColor.rgb, rgbDa(h2), mask); }`); };
  m.customProgramCacheKey = () => 'ricolora';   // un solo programma per tutte le varianti (cambia solo l'uniform)
  m.needsUpdate = true;
}
const VER = '20261117pro9';
const RIPIEGO = {land: ['land', 'ready', 'idle'], ready: ['ready', 'idle'], jump: ['jump', 'idle'], clash: ['clash', 'hit', 'idle'], hit: ['hit', 'idle'], fall: ['fall', 'hit', 'idle'], win: ['win', 'idle'], lose: ['lose', 'idle'], idle: ['idle']};
const GIRO_CLIP = {idle: true, jump: true, fall: true, win: true, lose: true};
function contornoMat(col, spess) {
  const m = new THREE.MeshBasicMaterial({color: col, side: THREE.BackSide, skinning: true});
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${spess.toFixed(5)};`); };
  return m;
}
function vestiGLB(o) {
  const G = GLBS[o.pg]; if (!G || !THREE.SkeletonUtils) return false;
  const sc = THREE.SkeletonUtils.clone(G.scene), cont = new THREE.Group(); cont.add(sc);
  o.k = 1; const k = G.k; sc.scale.setScalar(k); sc.position.set(G.cx * k, G.y0 * k, G.cz * k);   // i modelli 3D hanno gia' la loro misura (per sagoma)
  const mats = [], scafi = [];
  const mesh = []; sc.traverse(n => { if (n.isMesh) mesh.push(n); });
  for (const n of mesh) { n.frustumCulled = false;
    n.material = n.material.clone(); if (n.isSkinnedMesh) n.material.skinning = true; mats.push(n.material);
    if (n.material.emissive) n.userData.em0 = n.material.emissive.clone();
    // contorno: copia della mesh con la faccia di dietro, gonfiata lungo la normale (segue lo scheletro)
    const sp = .03 / k * G.raw * (k / (G.k * o.k)), sca = n.isSkinnedMesh ? new THREE.SkinnedMesh(n.geometry, contornoMat(COL[o.i], sp)) : new THREE.Mesh(n.geometry, contornoMat(COL[o.i], sp));
    if (n.isSkinnedMesh) sca.bind(n.skeleton, n.bindMatrix); sca.frustumCulled = false; if (Q.get('noscafo') !== '1') { n.parent.add(sca); sca.position.copy(n.position); sca.quaternion.copy(n.quaternion); sca.scale.copy(n.scale); scafi.push(sca); } }
  const mixer = new THREE.AnimationMixer(sc), az = {};
  for (const nome of Object.keys(RIPIEGO)) { const cand = RIPIEGO[nome].map(x => G.nomi[x]).filter(Boolean); const c = cand.map(n => THREE.AnimationClip.findByName(G.clips, n)).find(Boolean); if (!c) continue;
    const a = mixer.clipAction(c); if (!GIRO_CLIP[nome]) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    { const sp = G.m && G.m.clip && G.m.clip[nome]; if (sp && sp.pingpong) a.setLoop(THREE.LoopPingPong, Infinity); }   /* splash2 17/11: un pezzo di clip che va avanti e indietro (l'idle di Grumo senza le mani in testa) */ if (G.dur[nome]) a.setDuration(G.dur[nome]); az[nome] = a; }
  o.anca.add(cont); o.carta.visible = false;
  let testa = null, anca = null; sc.traverse(n => { if (!testa && n.isBone && /Head$/.test(n.name)) testa = n; if (!anca && n.isBone && /Hips$/.test(n.name)) anca = n; });
  o.variante = variante(o.i, o.pg); const vv = o.variante ? (VARIANTI_PG[o.pg] || [])[(o.variante - 1) % 3] : null; if (vv) for (const m of mats) if (m.map) ricolora(m, vv);
  o.glb = {sc, cont, mixer, az, mats, scafi, ora: null, yaw: null, testa, anca, durate: G.dur}; o.idleV = .86 + Math.random() * .28; o.testaYaw = 0;
  o.topY = (G.altoEff || G.m.alto || 1.7) * o.k * .86;
  if (az.idle) { az.idle.play(); o.glb.ora = 'idle'; }
  return true;
}
// quanto dura la dissolvenza fra una clip e l'altra: veloce verso i colpi e il salto, morbida verso il riposo e la festa
const DISSOLVE = {'idle>ready': .08, 'ready>jump': .05, 'jump>land': .04, 'land>idle': .3, 'ready>idle': .22, 'jump>idle': .16, 'hit>idle': .25, 'clash>idle': .25, '*>hit': .05, '*>clash': .07, '*>win': .3, '*>fall': .12, '*>lose': .4};
const V_A = new THREE.Vector3(), V_B = new THREE.Vector3(), V_C = new THREE.Vector3(), Q_A = new THREE.Quaternion(), Q_B = new THREE.Quaternion(), Q_C = new THREE.Quaternion(), Q_D = new THREE.Quaternion();
function posaGLB(o, p) {
  const g = o.glb; let nome = p === 'ready' && o.stato === 'atterra' ? 'land' : p;
  if (o.ko && o.alt < -.1) nome = 'hit'; if (o.triste && o.podio) nome = 'lose';   // affonda annaspando in piedi: la clip «caduta» e' sdraiata
  const a = g.az[nome] || g.az[(RIPIEGO[nome] || ['idle']).find(x => g.az[x])] || g.az.idle; if (!a) return;
  const att = g.ora && g.az[g.ora]; if (att === a) return;
  const da = g.ora || 'idle', a2 = Object.keys(g.az).find(k => g.az[k] === a), sf = DISSOLVE[da + '>' + a2] != null ? DISSOLVE[da + '>' + a2] : (DISSOLVE['*>' + a2] != null ? DISSOLVE['*>' + a2] : .18);
  a.reset(); a.enabled = true; a.setEffectiveWeight(1);
  if (a2 === 'idle') { a.timeScale = o.idleV || 1; a.time = Math.random() * a.getClip().duration; } else a.timeScale = 1;
  if (g.durate && g.durate[a2]) a.setDuration(g.durate[a2]);
  a.play(); if (att) att.crossFadeTo(a, sf, false);
  g.ora = a2;
}
function animaGLB(o, dt, verso) {
  const g = o.glb;
  // il modello guarda dove salta; da fermo guarda verso la camera, di tre quarti
  const dx = cam.position.x - (o.root.position.x + mondo.position.x), dz = cam.position.z - (o.root.position.z + mondo.position.z);
  const voluto = o.stato === 'volo' && o.direzione != null ? o.direzione : Math.atan2(dx, dz) + (o.i % 2 ? .35 : -.35);
  if (g.yaw == null) g.yaw = voluto; let d = ((voluto - g.yaw) % 6.2832 + 9.4248) % 6.2832 - 3.1416; g.yaw += d * Math.min(1, dt * 9);
  o.root.rotation.y = g.yaw;   // splash2 17/11: niente giro «a trottola» (o.spin) sui modelli 3D: inclinati verso la camera, girando sembravano ribaltarsi (Tonfo). La carta dipinta lo usa ancora
  // vista dall'alto: il modello si inclina un poco verso la camera (come fa la carta), cosi' si vede la faccia e non la testa
  const el = Math.atan2(cam.position.y - (o.root.position.y + mondo.position.y + 1), Math.hypot(dx, dz)); o.anca.rotation.x = -el * .38 + o.tiltX * .5; o.anca.scale.z = o.anca.scale.x = Math.abs(o.anca.scale.x);
  g.mixer.update(dt);
  { const lim = .45; o.anca.rotation.x = Math.max(-lim, Math.min(lim, o.anca.rotation.x)); o.anca.rotation.z = Math.max(-lim, Math.min(lim, o.anca.rotation.z)); }
  if (g.anca && g.testa) {   // il corpo resta dritto: se la clip lo inclina oltre 26° dall'asse del corpo, si raddrizza l'anca (sfumato, niente scatti)
    g.sc.updateMatrixWorld(true); const A = g.anca.getWorldPosition(V_A), Hd = g.testa.getWorldPosition(V_B).sub(A).normalize(), up = V_C.set(0, 1, 0).applyQuaternion(g.cont.getWorldQuaternion(Q_A));
    const ang = Hd.angleTo(up), lim = .45;
    if (ang > lim) { const qc = Q_B.setFromUnitVectors(Hd, up), parz = Q_C.identity().slerp(qc, Math.min(1, (ang - lim) / ang + .05));
      const qp = g.anca.parent.getWorldQuaternion(Q_D), qpi = qp.clone().invert(); g.anca.quaternion.premultiply(qpi.multiply(parz).multiply(qp)); g.raddrizza = (g.raddrizza || 0) + 1; } }
  if (g.testa) { let voluto = 0; const t = o.guardaP;
    if (t && o.stato !== 'volo' && !o.ko && (FASE === 'scegli' || FASE === 'menu')) { const w = new THREE.Vector3(); o.root.getWorldPosition(w); voluto = Math.atan2(t.x - w.x, t.z - w.z) - o.root.rotation.y; voluto = ((voluto % 6.2832) + 9.4248) % 6.2832 - 3.1416; voluto = Math.max(-.75, Math.min(.75, voluto)); }
    o.testaYaw += (voluto - o.testaYaw) * Math.min(1, dt * 6);
    if (Math.abs(o.testaYaw) > .005) { const qP = new THREE.Quaternion(); g.testa.parent.getWorldQuaternion(qP); const ax = new THREE.Vector3(0, 1, 0).applyQuaternion(qP.invert()).normalize(); g.testa.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(ax, o.testaYaw)); } }
  const u = o.mat.uniforms, op = u.op.value, fl = u.emis.value, tin = u.tinta.value;
  for (const m of g.mats) { if (m.emissive) m.emissive.copy(fl); if (m.color && !m.userData.c0) m.userData.c0 = m.color.clone(); if (m.userData.c0) m.color.copy(m.userData.c0).multiply(tin);
    const tr = op < .99; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = op; }
  for (const s of g.scafi) { s.visible = op > .6 && !o.triste; }
}

/* ---------------- effetti ---------------- */
const TEX_PUNTO = (() => { const c = tela(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 1, 32, 32, 31); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const TEX_FUMO = (() => { const c = tela(64, 64), g = c.getContext('2d'); for (let k = 0; k < 6; k++) { const r = g.createRadialGradient(20 + k * 5, 26 + (k % 2) * 10, 1, 20 + k * 5, 26 + (k % 2) * 10, 20); r.addColorStop(0, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); } return new THREE.CanvasTexture(c); })();
const PART = [];
const CONDIVISE = new Set();
function via(o) { scena.remove(o); o.traverse(m => { if (m.geometry && !CONDIVISE.has(m.geometry)) m.geometry.dispose(); if (m.material) m.material.dispose(); }); }
function particelle(v, n, col, vel, vita, opz) {
  opz = opz || {}; n = Math.ceil(n * .7); if (OPZ.rm) n = Math.ceil(n / 3);
  for (let k = 0; k < n; k++) {
    if (PART.length > 700) break;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: opz.fumo ? TEX_FUMO : TEX_PUNTO, color: col, transparent: true, depthWrite: false, blending: opz.normale || opz.fumo ? THREE.NormalBlending : THREE.AdditiveBlending}));
    const sc = (opz.r || .22) * (.5 + Math.random()); s.scale.set(sc, sc, 1); s.position.copy(v); scena.add(s);
    const a = Math.random() * 6.28, sp = (.3 + Math.random()) * vel;
    PART.push({s, v: new THREE.Vector3(Math.cos(a) * sp, (opz.su == null ? 1 : opz.su) * vel * (.6 + Math.random()), Math.sin(a) * sp), t: 0, vita: vita * (.6 + Math.random() * .8), g: opz.g == null ? 9 : opz.g, cresce: opz.cresce || 0, sc0: sc});
  }
}
const DEBRIS_GEO = new THREE.BoxGeometry(.13, .13, .13); CONDIVISE.add(DEBRIS_GEO);
function detriti(v, n, col, forza, geo) {
  if (OPZ.rm) n = Math.ceil(n / 3);
  for (let k = 0; k < n; k++) { const m = new THREE.Mesh(geo || DEBRIS_GEO, new THREE.MeshStandardMaterial({color: col, emissive: col, emissiveIntensity: .3, transparent: true})); m.position.copy(v); scena.add(m);
    const a = Math.random() * 6.28, sp = (2 + Math.random() * 4) * (forza || 1); PART.push({s: m, v: new THREE.Vector3(Math.cos(a) * sp, 3 + Math.random() * 5, Math.sin(a) * sp), t: 0, vita: 1.4, g: 14, mesh: true, rv: Math.random() * 10}); }
}
const CORIANDOLI_GEO = new THREE.PlaneGeometry(.12, .07);
function coriandoli(n, da) {
  if (OPZ.rm) n = Math.ceil(n / 4);
  for (let k = 0; k < n; k++) { const m = new THREE.Mesh(CORIANDOLI_GEO, new THREE.MeshBasicMaterial({color: palette[k % palette.length], side: THREE.DoubleSide}));
    if (da) { m.position.copy(da); scena.add(m); PART.push({s: m, v: new THREE.Vector3(-Math.sign(da.x) * (2 + Math.random() * 4), 6 + Math.random() * 5, (Math.random() - .5) * 4), t: 0, vita: 3, g: 6, mesh: true, rv: 4 + Math.random() * 8}); continue; }
    m.position.set((Math.random() - .5) * 12, 7 + Math.random() * 3, (Math.random() - .5) * 9); scena.add(m);
    PART.push({s: m, v: new THREE.Vector3((Math.random() - .5) * 2, -1 - Math.random(), (Math.random() - .5) * 2), t: 0, vita: 3.2, g: .4, mesh: true, rv: 4 + Math.random() * 8}); }
}
function anello(v, col, rmax, dur, spesso) {
  const m = new THREE.Mesh(new THREE.RingGeometry(.4, .4 + (spesso || .15), 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}));
  m.position.copy(v); m.position.y = .22; scena.add(m);
  return tw(dur || .5, k => { m.scale.setScalar(1 + k * rmax); m.material.opacity = 1 - k; }, eo).then(() => via(m));
}
function raggioSweep(o, a, b, col) {
  const centro = o.clone(); centro.y = .78; const pezzi = [];
  for (const fine of [a, b]) {
    const d = fine.clone().sub(o); d.y = 0; const Ln = d.length(); if (Ln < .1) continue;
    const g = new THREE.Group(); g.position.copy(centro); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    const m1 = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, 1, 12, 1, true), new THREE.MeshBasicMaterial({color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    const m2 = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1, 8), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, depthWrite: false}));
    const cal = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1), new THREE.MeshBasicMaterial({color: col, transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}));
    for (const m of [m1, m2, cal]) { m.position.y = .5; g.add(m); }
    g.scale.y = .01; scena.add(g); pezzi.push({g, Ln, m1, m2, cal});
  }
  lampoLuce.color.set(col); lampoLuce.position.copy(centro); lampoLuce.intensity = 7;
  return tw(.18, k => { for (const p of pezzi) p.g.scale.y = p.Ln * k; }, eo)
    .then(() => tw(.38, k => { const e = 1 - k; for (const p of pezzi) { p.m1.scale.set(1 + k * 1.6, 1, 1 + k * 1.6); p.m1.material.opacity = e * .9; p.m2.material.opacity = e; p.cal.rotation.y = Math.sin(k * 40) * .4; p.cal.scale.x = 1 + Math.sin(k * 30) * .3; p.cal.material.opacity = .14 * e; } lampoLuce.intensity = 7 * e; }))
    .then(() => { for (const p of pezzi) via(p.g); });
}
function palla(v, col, rmax, dur) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(.5, 20, 14), new THREE.MeshBasicMaterial({color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  m.position.copy(v); scena.add(m); return tw(dur, k => { m.scale.setScalar(.2 + rmax * eo(k)); m.material.opacity = 1 - k * k; }).then(() => via(m));
}
const BRUC = [];
function bruciatura(x, y) { const m = new THREE.Mesh(new THREE.CircleGeometry(.42, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0x150a05, transparent: true, opacity: .55, depthWrite: false})); m.position.copy(pos(x, y)); m.position.y = .13; mondo.add(m); BRUC.push({m, t: 0}); }
// MELMA (ex ghiaccio): uno schizzo di fango marrone e la pozza sotto i piedi (o.melma, nel personaggio); finisce con gocce che saltano via
function cristalli(o) {
  const v = o.root.position.clone().add(mondo.position); v.y = .3; o.cristalli = true;
  particelle(v, 18, 0x6b4a22, 2.2, .7, {su: 1.4, r: .16, g: 7}); particelle(v, 8, 0x8a6a3a, 1, .9, {fumo: true, r: .4, g: -.2, cresce: .8}); suono('splash', .5);
  return attendi(.3);
}
function frantuma(o) {
  if (!o.cristalli) return; o.cristalli = null; suono('plop');
  const v = o.root.position.clone().add(mondo.position); v.y = .3; particelle(v, 14, 0x7a5a2e, 2.5, .5, {su: 1.6, r: .12, g: 8});
}
function rompiScudo(o) {
  // lo scudo si crepa e va in frantumi in cocci dorati
  // una copia a parte fa l'animazione: la bolla vera segue SOLO lo stato (niente scudi che restano)
  suono('scudoRotto'); o.crepe.material.opacity = 1;
  const v = o.root.position.clone().add(mondo.position); v.y = .9;
  const c = new THREE.Mesh(o.scudo.geometry, o.scudo.material.clone()); c.position.copy(v); c.material.opacity = .7; scena.add(c); o.scudo.visible = false;
  if (ST && ST.p[o.i]) ST.p[o.i].scudo = 0;
  fumetto(o, `<b>${SC('scudo')[0]}</b> · ${OPZ.lang === 'en' ? 'used up' : 'consumato'}`, COLSTATO.scudo);
  tw(.22, k => { c.scale.setScalar(1 + k * .3); c.material.opacity = .7 * (1 - k); }).then(() => { scena.remove(c); c.material.dispose(); detriti(v, 14, 0xffd76a, .9, GEO.coccio); particelle(v, 18, 0xffe9a0, 3, .5, {r: .2}); });
}
function getto(v) {
  const g = new THREE.Group(); g.position.copy(v); g.position.y = .5; scena.add(g);
  const coni = [];
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28, c = new THREE.Mesh(new THREE.ConeGeometry(.35, 1.1, 14, 1, true), new THREE.MeshBasicMaterial({color: 0xbfe8ff, transparent: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending}));
    c.rotation.z = Math.PI / 2; const h = new THREE.Group(); h.rotation.y = -a; h.add(c); g.add(h); coni.push(c); }
  particelle(v.clone().add(new THREE.Vector3(0, .2, 0)), 30, 0xc8b8a0, 2.5, .7, {fumo: true, r: .5, su: .3, g: 1});
  return tw(.45, k => { for (const c of coni) { c.position.x = .3 + k * 1.3; c.scale.set(1, 1 + k, 1 + k); c.material.opacity = .5 * (1 - k); } }, eo).then(() => via(g));
}
function campoMagnetico(v) {
  // anelli che si stringono verso il centro (calamita)
  const pr = [];
  for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.RingGeometry(.4, .52, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xff5470, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}));
    m.position.copy(v); m.position.y = .25; scena.add(m); pr.push(sleep(k * .1).then(() => tw(.45, t => { m.scale.setScalar(6 - t * 5.3); m.material.opacity = t < .8 ? .9 : (1 - t) * 4.5; }, eo)).then(() => via(m))); }
  return Promise.all(pr);
}

/* ---------------- STATI: si spiegano da soli ---------------- */
const STATI = {
 it: {scudo: ['Conchiglia', 'para il prossimo colpo', n => '1 colpo'], gelo: ['Impantanato', 'questo turno non può saltare', n => n === 1 ? '1 turno' : n + ' turni'],
  molla: ['Lucciole', 'il prossimo salto arriva a 3 caselle', n => n === 1 ? '1 salto' : n + ' salti'], patata: ['Cardo', 'scoppia su chi ce l\'ha (-2): passalo atterrando accanto a un altro', n => n === 1 ? 'scoppia ora' : 'tra ' + n + ' turni'],
  specchio: ['Bolla specchio', 'il prossimo colpo torna a chi l\'ha tirato', n => '1 colpo'], bersaglio: ['Bersaglio', 'ogni colpo gli fa +1 danno', n => n === 1 ? '1 turno' : n + ' turni'],
  ultima: ['Un cuore solo', 'salta una casella più lontano', null], bolla: ['Bolla', 'in questo turno i colpi non lo feriscono (le cadute sì)', null], capo: ['Corona', 'è in testa: ha più cuori di tutti', null],
  tu: ['Freccia bianca', 'sei tu', null], fumo: ['Gocce e sudore', 'gli resta un cuore solo', null]},
 en: {scudo: ['Shell', 'blocks the next hit', n => '1 hit'], gelo: ['Stuck', 'cannot jump this turn', n => n === 1 ? '1 turn' : n + ' turns'],
  molla: ['Fireflies', 'next jump reaches 3 tiles', n => n === 1 ? '1 jump' : n + ' jumps'], patata: ['Burr', 'pops on the holder (-2): land next to someone to pass it', n => n === 1 ? 'pops now' : 'in ' + n + ' turns'],
  specchio: ['Mirror bubble', 'the next hit bounces back to the thrower', n => '1 hit'], bersaglio: ['Target', 'every hit deals +1', n => n === 1 ? '1 turn' : n + ' turns'],
  ultima: ['One heart left', 'jumps one tile further', null], bolla: ['Bubble', 'hits cannot hurt them this turn (falls still do)', null], capo: ['Crown', 'in the lead: most hearts', null],
  tu: ['White arrow', 'that is you', null], fumo: ['Sweat drops', 'one heart left', null]}};
const SC = k => (STATI[OPZ.lang] || STATI.it)[k];
const COLSTATO = {scudo: '#ffb38a', gelo: '#c49a5a', molla: '#d6f24a', patata: '#ff8a1e', specchio: '#bfefff', bersaglio: '#ff6a6a', ultima: '#ffd23f', bolla: '#bfefff', capo: '#ffd23f'};
function statiDi(q, i) {
  const o = []; if (!q || !q.vivo) return o;
  if (q.scudo) o.push(['scudo', 1]); if (q.gelo) o.push(['gelo', q.gelo]); if (q.molla) o.push(['molla', q.molla]); if (q.patata) o.push(['patata', q.patata]);
  if (q.specchio) o.push(['specchio', 1]); if (q.bersaglio) o.push(['bersaglio', q.bersaglio]); if (q.hp === 1) o.push(['ultima', null]);
  if (ST && ST.capo && ST.capo.includes(i)) o.push(['capo', null]);
  return o;
}
function iconaStato(g, k, x, y, r) {
  const mappa = {scudo: 'scudo', gelo: 'gelo', molla: 'molla', patata: 'patata', specchio: 'specchio'};
  g.save(); g.fillStyle = COLSTATO[k] || '#fff'; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill();
  const imS = mappa[k] && IMGIC[ICONA[mappa[k]]]; if (imS) { const s2 = r * 1.7; g.drawImage(imS, x - s2 / 2, y - s2 / 2, s2, s2); } else if (mappa[k]) glifo(g, mappa[k], x, y, r * .8, '#1a1420');
  else if (k === 'bersaglio') { g.strokeStyle = '#1a1420'; g.lineWidth = r * .18; g.beginPath(); g.arc(x, y, r * .55, 0, 6.28); g.stroke(); g.beginPath(); g.arc(x, y, r * .15, 0, 6.28); g.fillStyle = '#1a1420'; g.fill(); }
  else if (k === 'ultima') { g.fillStyle = '#1a1420'; g.beginPath(); g.moveTo(x, y + r * .55); g.bezierCurveTo(x - r * .9, y - r * .1, x - r * .45, y - r * .75, x, y - r * .3); g.bezierCurveTo(x + r * .45, y - r * .75, x + r * .9, y - r * .1, x, y + r * .55); g.fill(); }
  else if (k === 'capo') { g.fillStyle = '#1a1420'; g.beginPath(); g.moveTo(x - r * .6, y + r * .4); g.lineTo(x - r * .65, y - r * .35); g.lineTo(x - r * .25, y); g.lineTo(x, y - r * .5); g.lineTo(x + r * .25, y); g.lineTo(x + r * .65, y - r * .35); g.lineTo(x + r * .6, y + r * .4); g.closePath(); g.fill(); }
  g.restore();
}
// fila di icone con le cariche (es. scudo 1, molla 2) sopra la testa
function statiTex(lista) {
  const c = tela(640, 160), g = c.getContext('2d'), w = 150, x0 = 320 - lista.length * w / 2;
  lista.forEach(([k, n], j) => { const x = x0 + j * w + w / 2; g.fillStyle = 'rgba(12,10,22,.82)'; g.beginPath(); g.roundRect ? g.roundRect(x - 68, 30, 136, 100, 50) : g.rect(x - 68, 30, 136, 100); g.fill();
    iconaStato(g, k, x - 26, 80, 34); g.fillStyle = '#fff'; g.font = `800 58px ${FT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), x + 34, 83); });
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
// fumetto sopra un bot: spiega lo stato appena preso
const FUMI = [];
function fumetto(o, html, col) { if (o.i !== IO && FASE === 'rivela') return; annuncio(`${o.i === IO ? '' : NM(o.i) + ': '}${html.replace(/<br>/g, ' · ')}`, {pri: 1, dur: 2.2}); }
function posFumi(dt) {
  for (const f of FUMI) f.y = 0;
  for (let k = FUMI.length - 1; k >= 0; k--) { const f = FUMI[k]; f.t += dt; const v = f.o.root.position.clone().add(mondo.position); v.y += 3.1; const p = v.project(cam);
    const w = f.d.offsetWidth; f.d.style.left = Math.max(isPC() ? 250 : 8, Math.min(innerWidth - w - (isPC() ? 262 : 8), (p.x + 1) / 2 * innerWidth - w / 2)) + 'px'; const soffitto = Math.max(...['fase', 'evento'].map(k => $(k)).filter(e => e.classList.contains('on')).map(e => e.getBoundingClientRect().bottom), isPC() ? 8 : $('top').getBoundingClientRect().bottom) + 6;
    let top = Math.max(soffitto, (1 - p.y) / 2 * innerHeight - f.d.offsetHeight);
    const bb = banner.getBoundingClientRect(); if (+banner.style.opacity > .1 && bb.right > 0) top = Math.max(top, bb.bottom + 6);
    const L0 = parseFloat(f.d.style.left), W0 = f.d.offsetWidth, H0 = f.d.offsetHeight;
    for (const g of FUMI) { if (g === f || !g.y) continue; if (L0 < g.x + g.w && L0 + W0 > g.x && top < g.y + g.h && top + H0 > g.y) top = g.y + g.h + 4; }
    f.x = L0; f.w = W0; f.h = H0; f.y = top; f.d.style.top = top + 'px';
    f.d.style.opacity = f.t < .15 ? f.t / .15 : Math.max(0, Math.min(1, (f.vita - f.t) / .3));
    if (f.t > f.vita) { f.d.remove(); FUMI.splice(k, 1); } }
}
const spiegaStato = (k, n) => { const s = SC(k); return `<b>${s[0]}</b>${s[2] && n != null ? ' · ' + s[2](n) : ''}<br>${s[1]}`; };
function testoTipBot(i) {
  const q = ST.p[i], righe = statiDi(q, i).map(([k, n]) => `<div class="tr"><span class="pt" style="background:${COLSTATO[k]}"></span>${spiegaStato(k, n)}</div>`);
  if (i === IO) righe.unshift(`<div class="tr">${SC('tu')[0]}: ${SC('tu')[1]}</div>`);
  return `<b>${nm(i)}</b> · ${Math.max(0, q.hp)}/4 ♥` + (righe.length ? righe.join('') : `<div class="tr">${OPZ.lang === 'en' ? 'no status' : 'nessuno stato'}</div>`);
}
function testoTipCella(x, y) {
  const t = ST.campo[x][y], liv = pericoloLiv(x, y), out = [];
  if (t === 'buco') out.push(`<b>${L().pericoli[2][1]}</b>${L().pericoli[2][2]}`);
  else if (T[t]) out.push(`<b>${T[t][0]}</b>${T[t][1]}`);
  if (liv === 1) out.push(`<b style="color:${ROSSO}">${L().pericoli[0][1]}</b>${L().pericoli[0][2]}`);
  if (liv === 2) out.push(`<b style="color:#ff8a96">${L().pericoli[1][1]}</b>${L().pericoli[1][2]}`);
  if (CELLE[x][y].userData.passa) out.push(`<b style="color:${ARANCIO}">${L().passaQui}</b>${L().passaInfo}`);
  return out.join('<div class="sep"></div>');
}
function mostraTip(html, x, y, dur) {
  const tip = $('tip'); if (!html) { tip.classList.remove('on'); return; }
  tip.innerHTML = html; tip.classList.add('on');
  const w = tip.offsetWidth, h = tip.offsetHeight; tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x + 14)) + 'px'; tip.style.top = Math.max(8, Math.min(innerHeight - h - 8, y + 14)) + 'px';
  clearTimeout(mostraTip.t); if (dur) mostraTip.t = setTimeout(() => tip.classList.remove('on'), dur * 1000);
}
function botDa(ev) {
  mouse.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, cam);
  const vivi = RANE.filter(o => !o.ko && o.root.visible); const hit = ray.intersectObjects(vivi.map(o => o.busto), true)[0];
  if (!hit) return -1; let ob = hit.object; while (ob && !vivi.some(o => o.busto === ob)) ob = ob.parent; const o = vivi.find(o => o.busto === ob); return o ? o.i : -1;
}

/* ---------------- FASI: una riga sola dice cosa succede ---------------- */
let PASSI = [], PASSO = -1;
function fase(testo, extra) { statoMsg(testo + (extra ? `<small>${extra}</small>` : '')); }
function passi(lista) { PASSI = lista; PASSO = -1; }
async function passoFase(k) {
  const j = PASSI.indexOf(k); if (j < 0 || j === PASSO) return; PASSO = j;
  if (j > 0) await attendi(.28);
}
function posizionaPill() {
  const f = $('fase'), e = $('evento');
  if (isPC()) { f.style.top = '14px'; e.style.top = (14 + f.offsetHeight + 6) + 'px'; return; }
  const b = $('top').getBoundingClientRect().bottom; f.style.top = (b + 6) + 'px'; e.style.top = (b + 6 + f.offsetHeight + 5) + 'px';
}

/* ---------------- LEZIONE ---------------- */
const SEGNI_LEZ = [];
function evidenziaLezione() {
  for (const m of SEGNI_LEZ) mondo.remove(m); SEGNI_LEZ.length = 0;
  if (!LEZIONE || !ST || !ST.lezione || FASE !== 'scegli') return;
  for (const [x, y] of ST.lezione.evid || []) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(.62, .07, 8, 40), new THREE.MeshBasicMaterial({color: 0xffd23f})); a.rotation.x = Math.PI / 2; a.position.copy(pos(x, y)); a.position.y = .3; a.userData.anello = true;
    const f = new THREE.Mesh(new THREE.ConeGeometry(.24, .5, 4), new THREE.MeshBasicMaterial({color: 0xffd23f})); f.rotation.x = Math.PI; f.position.copy(pos(x, y)); f.position.y = 1.4; f.userData.freccia = true;
    mondo.add(a); mondo.add(f); SEGNI_LEZ.push(a, f);
  }
}
function cartaLezione() {
  const c = $('lezc'); if (!LEZIONE || !ST || !ST.lezione) { c.classList.add('nasc'); return; }
  const z = ST.lezione, t = (LEZ[OPZ.lang] || LEZ.it)[z.id];
  c.innerHTML = `<div class="lt"><span>${L().lez} ${z.k}/${z.n}</span><b>${t[0]}</b>${z.ripeti ? `<em>${L().riprova}</em>` : `<em class="pv">${z.id === 'stati' ? (OPZ.lang === 'en' ? 'Watch' : 'Guarda') : L().prova}</em>`}</div><div class="lx">${t[1]}</div>` +
    `<div class="lp">${Array.from({length: z.n}, (_, k) => `<i class="${k < z.k - 1 ? 'ok' : k === z.k - 1 ? 'on' : ''}"></i>`).join('')}</div>`;
  c.classList.remove('nasc'); adatta();
}

/* ---------------- tempo, telecamera ---------------- */
const TW = [];
let SCALA = 1, FERMO = 0, ACC = 1, SCOSSA = 0;
function tw(d, f, e) { return new Promise(r => TW.push({t: 0, d: Math.max(.001, d), f, e: e || (x => x), r})); }
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, ebk = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
const attendi = s => tw(s, () => {});
function rallenta(a, durIn, tenuta, durOut) { if (OPZ.rm) return attendi(tenuta * .5); const s0 = SCALA; return tw(durIn, k => { SCALA = s0 + (a - s0) * eio(k); }).then(() => attendi(tenuta * a)).then(() => tw(durOut * a, k => { SCALA = a + (1 - a) * eio(k); })); }
function scossa(a) { if (!OPZ.rm) SCOSSA = Math.max(SCOSSA, a); }
function fermo(s) { if (!OPZ.rm) FERMO = Math.max(FERMO, s); }
const VISTA = {dist: 1, yaw: 0};
let CAMV = {p: new THREE.Vector3(0, 14, 11), l: new THREE.Vector3(0, 0, .6)}, CAMT = null, FIT = {d: 16, l: new THREE.Vector3()};
const isPC = () => matchMedia('(min-aspect-ratio: 6/5) and (min-width: 860px)').matches;
function areaLibera() {
  const w = innerWidth, h = innerHeight;
  if (isPC()) return {x0: 236, x1: w - 262, y0: 78, y1: h - 92};
  // mobile 18/11: il fondo libero arriva fino alla barra dei comandi VERA (piu' alta, sopra la barra di casa), non a 74 px fissi
  const bb = $('bot'), sb = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sa-bottom')) || 0, lz = $('lezc');
  const giu = bb && bb.offsetHeight > 20 ? h - bb.offsetTop + 6 : (w < h ? 148 : 84) + sb;   // barra non ancora a schermo: la sua misura tipica
  if (bb && bb.offsetHeight > 20) document.documentElement.style.setProperty('--bar-h', bb.offsetHeight + 'px');
  return {x0: 2, x1: w - 2, y0: $('top').getBoundingClientRect().bottom + 2, y1: h - (LEZIONE ? (lz.offsetHeight > 40 ? lz.offsetHeight + giu + 22 : (w < 380 ? 330 : 270) + giu - 74) : giu)};
}
function adatta() {
  ROT = !isPC() && innerHeight >= innerWidth * .9; PZ = P * (ROT ? 1.48 : 1.1);   // 17/11 mappa: telefono in orizzontale = campo non ruotato (prima restava in verticale e minuscolo)
  const A = areaLibera(), ang = ROT ? ANG_TEL : ANG_PC;
  const pts = []; for (const x of [ROT ? -1.0 : -0.8, W + 1.5]) for (const y of [ROT ? -.95 : -.78, ROT ? H - .05 : H - .22]) pts.push(pos(x, y));   // sul telefono un margine di mezza casella: i personaggi del bordo restano dentro
  const l = pts.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(.25);
  cam.clearViewOffset(); let lo = 4, hi = 80;
  for (let k = 0; k < 26; k++) { const d = (lo + hi) / 2; cam.position.set(l.x, Math.sin(ang) * d, l.z + Math.cos(ang) * d); cam.lookAt(l); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let a = 1e9, b = -1e9, c = 1e9, e = -1e9; for (const v of pts) { const p = v.clone().project(cam); a = Math.min(a, p.x); b = Math.max(b, p.x); c = Math.min(c, p.y); e = Math.max(e, p.y); }
    if ((b - a) / 2 * innerWidth > A.x1 - A.x0 || (e - c) / 2 * innerHeight > A.y1 - A.y0) lo = d; else hi = d; }
  FIT = {d: hi * .97, l}; cam.setViewOffset(innerWidth, innerHeight, innerWidth / 2 - (A.x0 + A.x1) / 2, innerHeight / 2 - (A.y0 + A.y1) / 2, innerWidth, innerHeight);
}
const ANG_TEL = 1.12, ANG_PC = .98;
function camBase() { const ang = ROT ? ANG_TEL : ANG_PC, d = FIT.d * VISTA.dist, l = FIT.l; return {p: new THREE.Vector3(l.x + Math.sin(VISTA.yaw) * Math.cos(ang) * d, Math.sin(ang) * d, l.z + Math.cos(VISTA.yaw) * Math.cos(ang) * d), l}; }
function primoPiano(x, y, dist, dur) {
  if (OPZ.rm) return attendi(dur || .3);
  const t = pos(x, y).add(mondo.position), b = camBase(), dir = b.p.clone().sub(b.l).normalize();
  const dest = {p: t.clone().add(dir.multiplyScalar(dist || 10)).add(new THREE.Vector3(.6, .4, 0)), l: t.clone().add(new THREE.Vector3(0, .9, 0))};
  const p0 = CAMV.p.clone(), l0 = CAMV.l.clone(); CAMT = 'primo';
  return tw(Math.max(.5, dur || .5), k => { CAMV.p.lerpVectors(p0, dest.p, k); CAMV.l.lerpVectors(l0, dest.l, k); }, eio);
}
function tornaVista(dur) { const b = camBase(), p0 = CAMV.p.clone(), l0 = CAMV.l.clone(); return tw(Math.max(.6, dur || .6), k => { CAMV.p.lerpVectors(p0, b.p, k); CAMV.l.lerpVectors(l0, b.l, k); }, eio).then(() => { CAMT = null; }); }
function layout() {
  const prima = ROT;
  renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.fov = isPC() ? 36 : 40; cam.updateProjectionMatrix(); adatta();
  if (prima !== ROT && ST) { etichettaArrivo(); aggiornaCampo(); }
  $('fondo').style.backgroundImage = `url(assets_bayou/${innerWidth > innerHeight ? 'fondo_pc' : 'fondo_tel'}.jpg)`;
  if (!CAMT) { const b = camBase(); CAMV.p.copy(b.p); CAMV.l.copy(b.l); }
}
addEventListener('resize', layout);
// mobile 18/11: la barra dei comandi e la fila delle foto cambiano altezza (bordi di Telegram che arrivano dopo, testo su 2 righe, 6 posti): si rifa' il quadro
// (e i bordi --sa-* li mette il ponte quando arrivano: spostano la barra senza cambiarle misura, quindi si guarda la posizione)
setInterval(() => { try { const k = $('bot').offsetTop + ',' + $('bot').offsetHeight + ',' + $('top').getBoundingClientRect().bottom; if (k !== adatta.k) { adatta.k = k; if (!ANTE && !TIT && cam.view && cam.view.enabled) adatta(); } } catch (e) {} }, 400);

/* ---------------- loop ---------------- */
let prec = performance.now();
function frame() {
  const now = performance.now(), dtr = Math.min(.05, (now - prec) / 1000); prec = now;
  let dt = dtr * SCALA * ACC; if (FERMO > 0) { FERMO -= dtr; dt = 0; }
  for (let k = TW.length - 1; k >= 0; k--) { const a = TW[k]; a.t += dt; const x = Math.min(1, a.t / a.d); a.f(a.e(x)); if (x >= 1) { TW.splice(k, 1); a.r(); } }
  const tt = now / 1000;
  if (SPAR && FASE !== 'fine' && !OPZ.rm && Math.floor(tt * 1.25) !== SPAR.k) { SPAR.k = Math.floor(tt * 1.25);   // UNICO_1711
    for (const i of SPAR.chi) { const o = RANE[i]; if (o && !o.ko && o.a > .5) { const v = o.root.position.clone().add(mondo.position); v.y = .12; anello(v, 0xffd23f, 1.5, .7, .1); } } }
  for (let k = PART.length - 1; k >= 0; k--) {
    const p = PART[k]; p.t += dt; p.v.y -= p.g * dt; p.s.position.addScaledVector(p.v, dt);
    if (p.mesh) { p.s.rotation.x += p.rv * dt; p.s.rotation.y += p.rv * dt * .7; if (p.t > p.vita - .4) p.s.material.opacity = Math.max(0, (p.vita - p.t) / .4); } else { p.s.material.opacity = Math.max(0, 1 - p.t / p.vita); if (p.cresce) p.s.scale.setScalar(p.sc0 * (1 + p.t * p.cresce)); }
    if (p.t > p.vita) { scena.remove(p.s); p.s.material.dispose(); PART.splice(k, 1); }
  }
  for (let k = BRUC.length - 1; k >= 0; k--) { const b = BRUC[k]; b.t += dtr; b.m.material.opacity = .55 * Math.max(0, 1 - b.t / 3); if (b.t > 3) { mondo.remove(b.m); BRUC.splice(k, 1); } }
  CHEER = Math.max(.1, CHEER - dtr * .4); const fronte = (tt - OLA) * 4.5;
  if (MIX) { MIX.fol.gain.value = OPZ.muto ? 0 : .03 + CHEER * .08; if (FASE !== frame.fm) { frame.fm = FASE; MIX.musF.frequency.setTargetAtTime(FASE === 'scegli' ? 1500 : 16000, AC.currentTime, FASE === 'scegli' ? .6 : .15); } }
  if (folla.visible) for (let i = 0; i < NP; i++) { const b = FB[i]; let d = ((b.a - fronte) % 6.28 + 6.28) % 6.28; d = Math.min(d, 6.28 - d); const ola = fronte < 9 ? Math.exp(-d * d * 6) * .9 : 0;
    tmp.position.set(b.x, b.y + Math.abs(Math.sin(tt * b.f + b.ph)) * .32 * CHEER + ola, b.z); tmp.rotation.set(0, Math.atan2(-b.x, -b.z), 0); tmp.updateMatrix(); folla.setMatrixAt(i, tmp.matrix); }
  if (folla.visible) folla.instanceMatrix.needsUpdate = true;
  FARI.forEach((s, k) => { s.target.position.set(Math.sin(tt * .13 + k * 2) * 3, 0, Math.cos(tt * .1 + k) * 2.5); s.intensity = .35 + .25 * CHEER; });
  if (CATENA_I.visible) for (let k = 0; k < NCAT; k++) { const f = (k - tt * 18) % 8; colTmp.setHSL(((k / NCAT) + tt * .05) % 1, .8, f > -1.2 && f < 0 ? .75 : .25); CATENA_I.setColorAt(k, colTmp); } CATENA_I.instanceColor.needsUpdate = true;
  animaAmbiente(dtr, tt);
  for (const r of CELLE) for (const c of r) { const u = c.userData;
    u.dip *= Math.pow(.02, dtr); u.trema = Math.max(0, u.trema - dtr);
    u.corpo.position.y = Math.sin(tt * 1.2 + u.bob) * .05 - u.dip + u.alza - (u.sale || 0);
    if (u.flash > 0) { u.flash = Math.max(0, u.flash - dtr * 2.5); u.mat.emissiveIntensity = 1 + u.flash * 3; } else if (u.mat.emissiveIntensity !== 1) u.mat.emissiveIntensity = 1; u.corpo.position.x = u.trema ? (Math.random() - .5) * u.trema * .2 : 0;
    if (u.liv === 1 && u.base.visible) { const k = .5 + .5 * Math.sin(tt * 5); u.peri.material.opacity = .55 + .35 * k; u.mat.emissive.setRGB(.45 + .45 * k, 0, .03); if (!OPZ.rm) u.corpo.position.x += Math.sin(tt * 37 + u.bob) * .012; }
    if (u.badge.visible) u.badge.position.y = .62 + Math.abs(Math.sin(tt * 3 + u.bob)) * .12;
    if (u.fascio.visible) { const k = .5 + .5 * Math.sin(tt * 2.2 + u.bob * 3); u.fascio.material.opacity = .22 + .16 * k; u.fascio.scale.set(1, .85 + .25 * k, 1); u.top.position.y = .09 + .025 * k; }
    if (u.passa) u.mat.emissive.set(ARANCIO).multiplyScalar(.3 + .3 * Math.abs(Math.sin(tt * 4)));
    if (u.buco.visible) { u.br.material.opacity = .45 + .3 * Math.sin(tt * 2 + u.bob); u.buco.children[0].rotation.y = -tt * 1.8; }
    if (u.t === 'jackpot') { u.top.rotation.y = tt * 1.5; if (Math.random() < dtr * 4 && !OPZ.rm) particelle(c.position.clone().add(mondo.position).add(new THREE.Vector3(0, .3, 0)), 1, 0xffe080, .8, .8, {r: .15, g: -1}); }
    if (u.pulsa && u.area.material.opacity > 0) u.area.material.opacity = .35 + .3 * Math.abs(Math.sin(tt * 8)); }
  for (const o of RANE) animaBot(o, dt, tt);
  if (ANTE) cam.clearViewOffset(); else if (cam.view && !cam.view.enabled) adatta();
  etiArrivo.position.copy(ROT ? pos(W + 1.42, (H - 1) / 2) : pos(W + .5, -.95)); etiArrivo.position.y = .5; corrente.material.uniforms.t.value = tt;
  for (const c of ARRIVO) if (c.visible && c.userData.arrivoJ === 0 && c.userData.t && TC[c.userData.t]) { c.userData.cor.material.color.set(0x9ffff0); c.userData.cor.material.opacity = FASE === 'scegli' ? .45 + .4 * Math.sin(tt * 4) : .3; } etiArrivo.visible = !!(ST && ST.arrivo) && FASE !== 'fine';
  if (CAMT === 'menu' && !ANTE) CAMT = null;
  if (!CAMT) { const b = camBase(), kc = 1 - Math.exp(-dtr * 5); CAMV.p.lerp(b.p, kc); CAMV.l.lerp(b.l, kc); }
  for (const m of SEGNI_LEZ) { if (m.userData.freccia) { m.position.y = 1.4 + Math.abs(Math.sin(tt * 3.5)) * .3; m.rotation.y += dtr * 2; } else m.scale.setScalar(1 + .08 * Math.sin(tt * 5)); }
  posFumi(dtr); tickMsg(); animaAnteprima(dt, tt); animaTitolo(dt, tt);
  if (TRACCIA) { const T0 = window.__traccia = window.__traccia || []; if (T0.length < 400000) for (const o of RANE) { const g = o.glb; if (!g || !g.anca || !g.testa || !o.root.visible) continue;
    const a = g.anca.getWorldPosition(new THREE.Vector3()), h = g.testa.getWorldPosition(new THREE.Vector3()).sub(a); const ang = Math.acos(Math.max(-1, Math.min(1, h.y / Math.max(1e-6, h.length())))) * 57.3;
    T0.push([+(tt.toFixed(2)), o.pg, Math.round(ang), FASE, o.stato, g.ora, o.ko ? 1 : 0, +o.alt.toFixed(2)]); } }
  if (FASE === 'scegli' && IO >= 0 && ST && ST.p[IO].vivo && ST.p[IO].hp === 1) { BATTITO -= dtr; if (BATTITO <= 0) { BATTITO = .85; battito(); vignetta(.35); } } if ((tt * 3 | 0) !== frame.pp) { frame.pp = tt * 3 | 0; posizionaPill(); }
  cam.position.copy(CAMV.p); if (SCOSSA > 0) { cam.position.x += (Math.random() - .5) * SCOSSA; cam.position.y += (Math.random() - .5) * SCOSSA; SCOSSA = Math.max(0, SCOSSA - dtr * 1.6); }
  cam.lookAt(CAMV.l);
  scena.fog.density += ((EVENTO === 'nebbia' ? .034 : NEBBIA0) - scena.fog.density) * Math.min(1, dtr * 2);
  disegnaHover();
  renderer.render(scena, cam);
  for (let k = FLOAT.length - 1; k >= 0; k--) posFloat(FLOAT[k], dtr);
  if (FASE === 'scegli' && !OPZ.rm && Math.random() < dtr * .5) { const liberi = RANE.filter(o => !o.ko && !o.emote && o.stato === 'idle' && o.i !== IO); if (liberi.length) { const o = liberi[Math.floor(Math.random() * liberi.length)]; o.emote = ['saluta', 'saluta', 'salto', 'cappello'][Math.floor(Math.random() * 4)]; /* splash2 17/11: tolto 'giro' */ o.emoteT = 0; } }
  requestAnimationFrame(frame);
}

/* ---------------- testi, banner, lampi ---------------- */
const FLOAT = [];
function vola(o, s, c, big) {
  const d = document.createElement('div'); d.textContent = s; d.style.cssText = `position:fixed;font:italic 900 ${big ? 34 : 24}px/1 var(--x-tit);letter-spacing:-.02em;white-space:nowrap;color:${c};text-shadow:0 2px 0 rgba(0,0,0,.35),0 4px 14px rgba(0,0,0,.55);pointer-events:none;transform:translate(-50%,-50%) scale(1.4);transition:transform .25s cubic-bezier(.2,1.6,.4,1);z-index:4`;
  document.body.appendChild(d); requestAnimationFrame(() => { d.style.transform = 'translate(-50%,-50%) scale(1)'; }); FLOAT.push({d, o, t: 0});
}
function posFloat(f, dt) {
  f.t += dt; const v = f.o.root.position.clone().add(mondo.position); v.y += 2.3 + f.t * 1.2; const p = v.project(cam);
  f.d.style.left = Math.max(f.d.offsetWidth / 2 + 6, Math.min(innerWidth - f.d.offsetWidth / 2 - 6, (p.x + 1) / 2 * innerWidth)) + 'px'; f.d.style.top = ((1 - p.y) / 2 * innerHeight) + 'px'; f.d.style.opacity = Math.max(0, 1 - f.t / 1.1);
  if (f.t > 1.1) { f.d.remove(); FLOAT.splice(FLOAT.indexOf(f), 1); }
}
let BOOMT = 0;
const k0 = e => getComputedStyle(e).display !== 'none' && +getComputedStyle(e).opacity > .2 && !(isPC() && e.id === 'top');
function boom(t, sub, col) { BOOMT = performance.now(); duck(1.1); for (const f of FUMI) { f.t = f.vita; f.d.style.display = 'none'; } const b = $('boom'); b.innerHTML = t + (sub ? `<small>${sub}</small>` : ''); b.style.color = col || '#fff'; b.classList.remove('vai'); void b.offsetWidth; b.classList.add('vai'); }
// «Tu cade» -> «Tu cadi», «You falls» -> «You fall»: il verbo concorda quando il soggetto sei tu
const VERBI = {affonda: 'affondi', resta: 'resti', sinks: 'sink', è: 'sei', cade: 'cadi', atterra: 'atterri', scivola: 'scivoli', prende: 'prendi', rimbalza: 'rimbalzi', passa: 'passi', manda: 'mandi', spinge: 'spingi', rimanda: 'rimandi',
  is: 'are', lands: 'land', slips: 'slip', bounces: 'bounce', passes: 'pass', knocks: 'knock', falls: 'fall', grabs: 'grab', picks: 'pick', reflects: 'reflect'};
const concorda = h => typeof h === 'string' ? h.replace(/\b(Tu|You)(<\/span>)? (\S+?)(?=[ !,.]|$)/g, (m, t, sp, v) => `${t}${sp || ''} ${VERBI[v] || v}`) : h;
// MESSAGGI (passata «pro»): un posto solo, un messaggio alla volta. Mentre scegli e' la riga dentro la barra (#hint);
// durante la rivelazione e' la pillola in basso (#cap). Coda con priorita': 3 = annunci (voto, testa a testa, affondano),
// 2 = cronaca della rivelazione, 1 = spiegazioni. Un messaggio resta almeno 0,9 s; mentre c'e' la scritta grande (#boom) aspetta.
const MSG = {base: '', ev: '', coda: [], ora: null, fino: 0, min: 0};
function statoMsg(h) { MSG.base = concorda(h || ''); mostraMsg(); }
function annuncio(h, o) {
  o = o || {}; h = concorda(h); if (!h) return; const pri = o.pri || 1;
  if (MSG.ora && MSG.ora.h === h || MSG.coda.some(m => m.h === h)) return;
  if (pri <= 1 && MSG.coda.length >= 1) return;
  if (pri === 2) MSG.coda = MSG.coda.filter(m => m.pri !== 2);      // la cronaca vecchia non serve piu'
  MSG.coda.push({h, pri, dur: o.dur || 2.4, big: !!o.big, bg: o.bg}); MSG.coda.sort((a, b) => b.pri - a.pri);
  tickMsg();
}
function pulisciMsg() { MSG.coda = MSG.coda.filter(m => m.pri >= 3); if (MSG.ora && MSG.ora.pri < 3) MSG.ora = null; mostraMsg(); }
const boomAttivo = () => performance.now() - BOOMT < 1050;
function tickMsg() {
  const now = performance.now();
  if (MSG.ora && (now > MSG.fino || (MSG.coda.length && now > MSG.min && MSG.coda[0].pri >= MSG.ora.pri - 1))) { MSG.ora = null; mostraMsg(); }
  if (!MSG.ora && MSG.coda.length && !boomAttivo()) { MSG.ora = MSG.coda.shift(); MSG.fino = now + MSG.ora.dur * 1000; MSG.min = now + 900; mostraMsg(); }
  const c = $('cap'); if (boomAttivo() && c.classList.contains('on')) c.classList.remove('on'); else if (!boomAttivo() && !c.classList.contains('on') && MSG.ora && $('bot').classList.contains('via')) mostraMsg();
}
function mostraMsg() {
  const m = MSG.ora, c = $('cap'), hi = $('hint'), inBar = !$('bot').classList.contains('via'), base = MSG.base + (MSG.ev ? `<small>${MSG.ev}</small>` : '');
  if (inBar) { hi.innerHTML = m ? (m.big ? `<span class="ann" style="--k:${m.bg && m.bg.startsWith('#') ? m.bg : '#7fffe0'}">${m.h}</span>` : m.h) : base; c.classList.remove('on'); return; }
  hi.innerHTML = base;
  if (!m || boomAttivo()) { c.classList.remove('on'); return; }
  c.innerHTML = m.h; c.classList.toggle('big', m.big); c.style.background = m.big && m.bg ? m.bg : ''; c.style.bottom = ''; c.classList.add('on');
}
function cap(h) { if (!h) { pulisciMsg(); return; } annuncio(h, {pri: 2, dur: 2.6}); }
const banner = document.createElement('div');
banner.style.cssText = 'position:fixed;left:0;top:27%;padding:10px 26px 10px 18px;font:italic 800 clamp(18px,5.6vw,24px)/1.2 var(--x-tit);letter-spacing:-.01em;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.25);background:linear-gradient(90deg,#8b5cff,#ff4f8b);border-radius:0 16px 16px 0;transform:translateX(-110%);transition:transform .35s cubic-bezier(.2,1.2,.4,1),opacity .3s;opacity:0;z-index:5;pointer-events:none;box-shadow:0 8px 30px rgba(0,0,0,.4);max-width:92vw';
document.body.appendChild(banner);
function bannerVia(txt, col, dur) { annuncio(txt, {pri: 3, dur: Math.max(1.6, dur || 1.6), big: true, bg: col || 'linear-gradient(90deg,#0d6b5a,#14a383)'}); }
const vigDiv = document.createElement('div'); vigDiv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2;opacity:0;transition:opacity .5s;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 55%,rgba(170,0,20,.55))'; document.body.appendChild(vigDiv);
function vignetta(a) { if (OPZ.rm) a = Math.min(a, .2); vigDiv.style.transition = 'none'; vigDiv.style.opacity = a; requestAnimationFrame(() => { vigDiv.style.transition = 'opacity .7s'; vigDiv.style.opacity = 0; }); }
const bande = [0, 1].map(k => { const d = document.createElement('div'); d.style.cssText = `position:fixed;left:0;right:0;${k ? 'bottom' : 'top'}:0;height:0;background:#000;z-index:3;transition:height .35s cubic-bezier(.2,.8,.3,1);pointer-events:none`; document.body.appendChild(d); return d; });
function cinema(su) { if (OPZ.rm) return; for (const b of bande) b.style.height = su ? '9vh' : '0'; }
const lampoDiv = document.createElement('div'); lampoDiv.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:3'; document.body.appendChild(lampoDiv);
function lampo(col, a) { if (OPZ.rm) a = Math.min(a || .6, .15); lampoDiv.style.transition = 'none'; lampoDiv.style.background = col || '#fff'; lampoDiv.style.opacity = a || .6; requestAnimationFrame(() => { lampoDiv.style.transition = 'opacity .4s'; lampoDiv.style.opacity = 0; }); }

/* ---------------- stato, HUD ---------------- */
let ST = null, IO = -1, NOMI = [], FASE = 'menu', MOSSE = [], MOSSE_AB = [], INFO = null, MIA = null, ABON = false, SCAD = 0, SRV = 0, DUR = 6, EVENTO = null, GUARDA = GUARDA0, NGIOC = OPZ.n;
const STAT = {};
// i bot si chiamano come il loro personaggio («Zip», «Grumo»), non «Bot 3»
const nm = i => i === IO ? L().tu : (/^Bot \d+$/.test(NOMI[i] || '') && ST && ST.p && ST.p[i] && PGN[ST.p[i].pg]) ? PGN[ST.p[i].pg] : NOMI[i];
const NM = i => `<span style="color:${COL[i]}">${nm(i)}</span>`;
const elenco = a => a.map(NM).join(', ');
const avatarURL = i => (typeof window.__hopFoto === 'function' && window.__hopFoto(i)) || `assets_bot/avatar_${i % 5}.webp`;   // HOP_RT_1711: la foto vera del seggio (ponte); il 6o bot riusa un avatar   // 17/11 mappa: le foto sono 5, la sesta rana riusa la prima (manca una sesta foto)
const SVG_CUORE = '<path d="M12 21s-7.5-4.6-9.6-9.1C.9 8.6 3 5 6.6 5c2.1 0 3.6 1.2 5.4 3.2C13.8 6.2 15.3 5 17.4 5 21 5 23.1 8.6 21.6 11.9 19.5 16.4 12 21 12 21z"/>';
const cuore = v => `<svg viewBox="0 0 24 24" class="${v ? 'v' : ''}">${SVG_CUORE}</svg>`;
function chip() {
  $('top').innerHTML = ST.p.map((q, i) => `<div class="chip ${i === IO ? 'io' : ''}" id="ch${i}" style="--c:${COL[i]}"><svg class="re" viewBox="0 0 30 24"><path d="M2 20 0 5l8 6 7-10 7 10 8-6-2 15z"/></svg><div class="av" style="background-image:url(${avatarURL(i)})"></div><div><div class="nmc">${nm(i)}</div><div class="cu" id="cu${i}"></div><div class="st" id="cs${i}"></div></div><div class="ok"><svg viewBox="0 0 10 10"><path d="M1.5 5.2 4 7.6 8.6 2.6"/></svg></div></div>`).join('');
  hud();
}
function hud() { setTimeout(posizionaPill, 0);
  ST.p.forEach((q, i) => {
    const c = $('ch' + i); if (!c) return; c.classList.toggle('fuori', !q.vivo); c.classList.toggle('capo', !!(ST.capo && ST.capo.includes(i)));
    const hp = Math.max(0, q.hp); $('cu' + i).innerHTML = cuore(0).repeat(hp) + cuore(1).repeat(Math.max(0, 4 - hp));
    const tag = (on, txt, col) => on && q.vivo ? `<b style="--b:${col}">${txt}</b>` : '';
    const en = OPZ.lang === 'en';
    $('cs' + i).innerHTML = statiDi(q, i).filter(([k]) => k !== 'capo').map(([k, n]) => tag(1, SC(k)[0] + (SC(k)[2] && n != null ? ' · ' + SC(k)[2](n) : ''), COLSTATO[k])).join('');
  });
}
$('top').addEventListener('click', ev => { const c = ev.target.closest('.chip'); if (!c || !ST) return; const i = +c.id.slice(2); const r = c.getBoundingClientRect(); mostraTip(testoTipBot(i), r.left, r.bottom - 6, 3.5); });
function cuorePerso(i) {
  const c = $('ch' + i); if (!c) return; c.classList.remove('colpito'); void c.offsetWidth; c.classList.add('colpito');
  const r = c.getBoundingClientRect(), h = document.createElement('div'); h.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="#ff5a6e">${SVG_CUORE}</svg>`;
  h.style.cssText = `position:fixed;left:${r.left + 40}px;top:${r.top + 6}px;z-index:6;pointer-events:none;transition:transform .7s cubic-bezier(.2,.8,.3,1),opacity .7s`;
  document.body.appendChild(h); requestAnimationFrame(() => { h.style.transform = `translate(${(Math.random() - .5) * 60}px,-50px) rotate(${(Math.random() - .5) * 90}deg) scale(1.6)`; h.style.opacity = 0; }); setTimeout(() => h.remove(), 800);
}
function legenda(dove, scheda) {
  const el = $(dove); el.innerHTML = '';
  const riga = (disegna, tit, txt) => { const d = document.createElement('div'); const c = tela(68, 68); c.style.cssText = 'width:34px;height:34px;flex:none'; disegna(c.getContext('2d')); d.appendChild(c); const s = document.createElement('span'); s.innerHTML = `<b>${tit}</b>${txt}`; d.appendChild(s); el.appendChild(d); };
  if (scheda === 1) { for (const k of ['scudo', 'gelo', 'molla', 'patata', 'specchio', 'bersaglio', 'ultima', 'capo']) riga(g => iconaStato(g, k, 34, 34, 30), SC(k)[0], SC(k)[1]);
    riga(g => { g.fillStyle = '#bfefff'; g.globalAlpha = .5; g.beginPath(); g.arc(34, 34, 30, 0, 6.28); g.fill(); }, SC('bolla')[0], SC('bolla')[1]);
    riga(g => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(14, 18); g.lineTo(54, 18); g.lineTo(34, 54); g.fill(); }, SC('tu')[0], SC('tu')[1]);
    riga(g => { g.fillStyle = '#2fbf6a'; g.beginPath(); g.arc(34, 34, 22, 0, 6.28); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(23, 35); g.lineTo(31, 43); g.lineTo(46, 26); g.stroke(); }, OPZ.lang === 'en' ? 'Green tick' : 'Spunta verde', OPZ.lang === 'en' ? 'that player has already picked' : 'quel giocatore ha già scelto');
    riga(g => { g.fillStyle = '#777'; for (let k = 0; k < 5; k++) { g.globalAlpha = .5; g.beginPath(); g.arc(22 + k * 6, 40 - k * 5, 12, 0, 6.28); g.fill(); } g.globalAlpha = 1; g.fillStyle = '#ffb040'; g.fillRect(40, 20, 5, 5); }, SC('fumo')[0], SC('fumo')[1]); return; }
  if (scheda === 2) { const dis = {rosse: g => { g.fillStyle = '#4a0a14'; g.fillRect(6, 6, 56, 56); g.strokeStyle = ROSSO; g.lineWidth = 6; for (let k = -56; k < 112; k += 18) { g.beginPath(); g.moveTo(6 + k, 6); g.lineTo(62 + k, 62); g.stroke(); } g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(6, 6, 56, 56); },
      rosse2: g => { g.fillStyle = '#2a1a22'; g.fillRect(6, 6, 56, 56); g.globalAlpha = .45; g.strokeStyle = ROSSO; g.lineWidth = 6; for (let k = -56; k < 112; k += 18) { g.beginPath(); g.moveTo(6 + k, 6); g.lineTo(62 + k, 62); g.stroke(); } },
      buco: g => { g.fillStyle = '#020106'; g.fillRect(8, 8, 52, 52); g.strokeStyle = '#ff5a2a'; g.lineWidth = 5; g.strokeRect(8, 8, 52, 52); },
      bordo: g => { g.fillStyle = '#2a3048'; for (let y = 0; y < 3; y++) g.fillRect(26, 6 + y * 20, 16, 16); g.fillStyle = ROSSO; for (let y = 0; y < 3; y++) g.fillRect(6, 6 + y * 20, 16, 16); },
      scontro: g => { g.fillStyle = '#b3a6ff'; g.beginPath(); g.arc(20, 34, 12, 0, 6.28); g.fill(); g.fillStyle = '#ff9a52'; g.beginPath(); g.arc(48, 34, 12, 0, 6.28); g.fill(); g.fillStyle = '#ffd23f'; g.font = '900 22px sans-serif'; g.fillText('!', 30, 20); },
      spinta: g => { g.fillStyle = '#b3a6ff'; g.beginPath(); g.arc(18, 34, 11, 0, 6.28); g.fill(); g.fillStyle = '#ff9a52'; g.beginPath(); g.arc(50, 34, 11, 0, 6.28); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 34); g.lineTo(40, 34); g.stroke(); },
      voto: g => { g.fillStyle = BLU; g.beginPath(); g.arc(34, 34, 28, 0, 6.28); g.fill(); g.fillStyle = '#fff'; g.font = '900 30px sans-serif'; g.textAlign = 'center'; g.fillText('?', 34, 45); }};
    for (const [k, tit, txt] of L().pericoli) riga(dis[k], tit, txt); return; }
  for (const k of LEGENDA) { const d = document.createElement('div'); const c = tela(68, 68); c.style.cssText = 'width:34px;height:34px;flex:none'; simbolo(c.getContext('2d'), k, 34, 34, 30); d.appendChild(c); const s = document.createElement('span'); s.innerHTML = `<b>${T[k][0]}</b>${T[k][1]}`; d.appendChild(s); el.appendChild(d); }
}
function pannelloArrivo() {
  const el = $('arr'); if (!el || !ST) return; el.innerHTML = '';
  if (!ST.arrivo) { el.innerHTML = `<span style="font:400 12px var(--x-body);color:#9aa3ab">${OPZ.lang === 'en' ? 'Fog: hidden' : 'Nebbia: nascosto'}</span>`; return; }
  ST.arrivo.forEach((col, j) => { const c = document.createElement('div'); c.className = 'c' + (j ? ' lont' : '');
    for (const t of col) { const k = tela(60, 60); const g = k.getContext('2d'); g.fillStyle = 'rgba(80,90,130,.35)'; g.beginPath(); g.arc(30, 30, 28, 0, 6.28); g.fill(); if (TC[t]) simbolo(g, t, 30, 30, 22); k.title = T[t] ? T[t][0] + ': ' + T[t][1] : ''; c.appendChild(k); }
    el.appendChild(c); });
}
function mostraEvento() { const L0 = L(); MSG.ev = LEZIONE || FASE === 'fine' || !ST ? '' : ST.evento ? `${OPZ.lang === 'en' ? 'Pond vote' : 'Voto dello stagno'}: ${L0.ev[ST.evento]}` : ST.evento_prossimo ? `${L0.prossimo[0].toUpperCase() + L0.prossimo.slice(1)}: ${L0.ev[ST.evento_prossimo]}` : ''; mostraMsg(); }

/* ---------------- scelta e comandi ---------------- */
let timer = null, HOVER = null, KEYC = null, FOCUS = null, AVVISO_FERMO = false;
function inizio(e) {
  TEMPI.push({resta: +(e.scade + SRV - performance.now() / 1000).toFixed(2), durata: e.durata});
  FASE = 'scegli'; MIA = null; ABON = false; KEYC = null; AVVISO_FERMO = false; DUR = e.durata || 6; SCAD = e.scade + SRV; cap(null);
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('scelto'));
  const vivo = IO >= 0 && ST.p[IO].vivo, L0 = L();
  $('bot').classList.toggle('via', !vivo); $('esci').classList.toggle('on', IO >= 0 && !vivo && !LEZIONE);
  const rossi = CELLE.flat().some(c => c.visible && pericoloLiv(c.userData.x, c.userData.y) === 1);
  fase(`${L0.turno(e.turno || ST.turno)} · ${vivo ? (ST.p[IO].gelo ? L0.bloccato : L0.fase.scegli) : L0.fase.guardi}`, rossi && (e.turno || ST.turno) <= 6 ? L0.rosso : '');
  cartaLezione();
  if (vivo && ST.p[IO].patata > 0) setTimeout(() => fumetto(RANE[IO], `<b>${SC('patata')[0]} · ${SC('patata')[2](ST.p[IO].patata)}</b><br>${L0.passaInfo}`, ARANCIO), 400);
  schermo(L0.turno(e.turno || ST.turno), ST.evento ? L0.ev[ST.evento].split(':')[0] : (ST.turno >= (ST.stringe || 8) ? (OPZ.lang === 'en' ? 'the pads are sinking' : 'le ninfee affondano') : ''));
  bottoni(); aggiornaCampo(); mostraEvento(); $('b-abil').style.display = LEZIONE ? 'none' : '';
  for (const o of RANE) o.bordo = o.x === 0 && !o.ko;
  // sguardo mentre si sceglie: gli altri guardano un potere vicino (o un avversario); tu guardi la ninfea che scegli
  for (const o of RANE) { o.guardaP = null; if (o.ko || o.i === IO) continue; const cand = [];
    for (let x = Math.max(0, o.x - 2); x <= Math.min(W - 1, o.x + 2); x++) for (let y = Math.max(0, o.y - 2); y <= Math.min(H - 1, o.y + 2); y++) if ((x !== o.x || y !== o.y) && TC[ST.campo[x][y]]) cand.push([x, y]);
    const altri = RANE.filter(r => r !== o && !r.ko); const t = cand.length ? cand[Math.floor(Math.random() * cand.length)] : altri.length ? [altri[0].x, altri[0].y] : null;
    if (t) o.guardaP = pos(t[0], t[1]).add(mondo.position); }
  if (vivo && ST.p[IO].hp === 1 && !inizio.ultima) { inizio.ultima = true; bannerVia(L0.ultima, 'linear-gradient(90deg,#ff7a1a,#ffcf3a)', 1.6); }
  clearInterval(timer);
  timer = setInterval(() => { const r = Math.max(0, SCAD - performance.now() / 1000); $('sec').textContent = Math.ceil(r); $('arco').style.strokeDashoffset = 119.4 * (1 - r / DUR); $('arco').style.stroke = r < 2 ? '#ff4d5e' : '#fff';
    if (r < 2 && r > 0 && !MIA && vivo && !AVVISO_FERMO) { AVVISO_FERMO = true; suono('tic'); statoMsg(L0.fermo); }
    if (r <= 0) clearInterval(timer); }, 100);
  tutorial(e.turno || ST.turno);
}
function bottoni() { const b = $('b-abil'); if (!INFO) { b.disabled = true; return; } b.innerHTML = `<canvas width="56" height="56" class="ia"></canvas><span><small style="margin:0;font-size:11.5px">${INFO.puo ? L().pronta : L().tra(INFO.cd)}</small></span>`;
  iconaAbil(b.querySelector('canvas').getContext('2d'), INFO.abil, ABON); b.title = ab(INFO.abil)[1];
  if (INFO.puo && !bottoni.detto && !LEZIONE && IO >= 0) { bottoni.detto = true; annuncio(`<b>${ab(INFO.abil)[0]}</b>: ${ab(INFO.abil)[1]}`, {pri: 1, dur: 3.5}); } b.disabled = !INFO.puo; b.classList.toggle('on', ABON); $('b-pronto').textContent = L().pronto; }
const SEGNO = new THREE.Mesh(new THREE.TorusGeometry(.42, .08, 8, 40), new THREE.MeshBasicMaterial({color: 0xffffff})); SEGNO.rotation.x = Math.PI / 2; SEGNO.visible = false; mondo.add(SEGNO);
function scegli(x, y) {
  const lista = ABON && MOSSE_AB.length ? MOSSE_AB : MOSSE;
  if (!lista.some(m => m[0] === x && m[1] === y)) return;
  MIA = [x, y]; suono('tic'); vibra(10); chiudiTut(); if (RANE[IO]) RANE[IO].guardaP = pos(x, y).add(mondo.position); if (CELLE[x] && CELLE[x][y]) CELLE[x][y].userData.flash = .9;
  SEGNO.position.copy(pos(x, y)); SEGNO.position.y = .25; SEGNO.material.color.set(COL[IO]); SEGNO.visible = true; SEGNO.scale.setScalar(1.6); tw(.2, k => SEGNO.scale.setScalar(1.6 - .6 * ebk(k)));
  Rete.az({act: 'salta', ax: x, ay: y, power: ABON ? 1 : 0});
  fase(L().fatto);
  const io = RANE[IO]; if (io) { io.braccioSu = .3; setTimeout(() => { io.braccioSu = 0; }, 250); }
}
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
function cellaDa(ev) {
  mouse.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, cam);
  const hit = ray.intersectObjects(CELLE.flat().filter(c => c.visible).map(c => c.userData.corpo.children[0]), false)[0];
  return hit ? [hit.object.parent.parent.userData.x, hit.object.parent.parent.userData.y] : null;
}
let PAN = null;
renderer.domElement.addEventListener('contextmenu', ev => ev.preventDefault());
renderer.domElement.addEventListener('pointerdown', ev => {
  ac();
  if (ev.pointerType === 'mouse' && ev.button === 2) { PAN = [ev.clientX, VISTA.yaw]; return; }
  const c = cellaDa(ev), b = botDa(ev);
  if (ev.pointerType === 'mouse') { if (b >= 0 && !(FASE === 'scegli' && c && (ABON && MOSSE_AB.length ? MOSSE_AB : MOSSE).some(m => m[0] === c[0] && m[1] === c[1]))) { mostraTip(testoTipBot(b), ev.clientX, ev.clientY, 3); return; }
    if (FASE === 'scegli' && IO >= 0 && c) { scegli(c[0], c[1]); KEYC = c; } return; }
  PREMI = {c, b, x: ev.clientX, y: ev.clientY, lungo: false};
  PREMI.timer = setTimeout(() => { if (!PREMI) return; PREMI.lungo = true; vibra(8); mostraTip(PREMI.b >= 0 ? testoTipBot(PREMI.b) : PREMI.c ? testoTipCella(PREMI.c[0], PREMI.c[1]) : '', PREMI.x, PREMI.y - 90); }, 420);
});
let PREMI = null;
addEventListener('pointerup', () => { PAN = null;
  if (PREMI) { clearTimeout(PREMI.timer); if (PREMI.lungo) setTimeout(() => mostraTip(''), 1600); else if (FASE === 'scegli' && IO >= 0 && PREMI.c) { scegli(PREMI.c[0], PREMI.c[1]); KEYC = PREMI.c; } else if (PREMI.b >= 0) mostraTip(testoTipBot(PREMI.b), PREMI.x, PREMI.y - 90, 2.5); PREMI = null; } });
addEventListener('pointermove', ev => { if (PREMI && Math.hypot(ev.clientX - PREMI.x, ev.clientY - PREMI.y) > 14) { clearTimeout(PREMI.timer); PREMI = null; } });
renderer.domElement.addEventListener('pointermove', ev => {
  if (PAN) { VISTA.yaw = Math.max(-.8, Math.min(.8, PAN[1] - (ev.clientX - PAN[0]) * .005)); return; }
  if (ev.pointerType !== 'mouse') return;
  HOVER = cellaDa(ev); if (!ST) return;
  const b = botDa(ev); if (b >= 0) { mostraTip(testoTipBot(b), ev.clientX, ev.clientY); return; }
  const h = HOVER ? testoTipCella(HOVER[0], HOVER[1]) : ''; mostraTip(h, ev.clientX, ev.clientY);
});
renderer.domElement.addEventListener('wheel', ev => { ev.preventDefault(); VISTA.dist = Math.max(.6, Math.min(1.5, VISTA.dist * Math.exp(ev.deltaY * .001))); }, {passive: false});
function areaLocale(t, x, y) {
  const C = [], dentro = (a, b) => a >= 0 && b >= 0 && a < W && b < H;
  if (t === 'riga' || t === 'croce' || t === 'corrente') for (let a = 0; a < W; a++) if (a !== x) C.push([a, y]);
  if (t === 'colonna' || t === 'croce') for (let b = 0; b < H; b++) if (b !== y) C.push([x, b]);
  if (['bomba', 'gelo', 'onda'].includes(t)) for (let d = -1; d <= 1; d++) for (let e = -1; e <= 1; e++) if (d || e) C.push([x + d, y + e]);
  if (t === 'calamita') for (let d = -2; d <= 2; d++) for (let e = -2; e <= 2; e++) if (Math.max(Math.abs(d), Math.abs(e)) === 2) C.push([x + d, y + e]);   // 17/11: solo l'anello a 2, come il motore
  return C.filter(([a, b]) => dentro(a, b));
}
let AREE_ON = [];
function mostraAree(celle, col, pulsa) { for (const [x, y] of celle) { const a = CELLE[x] && CELLE[x][y]; if (!a) continue; a.userData.area.material.color.set(col); a.userData.area.material.opacity = .42; a.userData.pulsa = pulsa; AREE_ON.push(a); } }
function spegniAree() { for (const a of AREE_ON) { a.userData.area.material.opacity = 0; a.userData.pulsa = false; } AREE_ON = []; }
let ULTIMO_HOVER = '';
function disegnaHover() {
  if (FASE !== 'scegli') return;
  const lista = ABON && MOSSE_AB.length ? MOSSE_AB : MOSSE;
  const h = [HOVER, KEYC].find(z => z && lista.some(m => m[0] === z[0] && m[1] === z[1]));
  let fx = h ? h.join(',') : ''; if (FOCUS && FOCUS.fino > performance.now()) fx += '|f' + FOCUS.i;
  if (fx === ULTIMO_HOVER) return; ULTIMO_HOVER = fx; spegniAree();
  if (h) { const t = ST.campo[h[0]][h[1]]; if (T[t]) mostraAree(areaLocale(t, h[0], h[1]), TC[t], false); }
  if (FOCUS && FOCUS.fino > performance.now()) { const q = ST.p[FOCUS.i]; const c = []; for (let d = -2; d <= 2; d++) for (let e = -2; e <= 2; e++) if (q.x + d >= 0 && q.y + e >= 0 && q.x + d < W && q.y + e < H) c.push([q.x + d, q.y + e]); mostraAree(c, COL[FOCUS.i], false); }
}
const DIRT = {Digit7: [-1, -1], Digit8: [0, -1], Digit9: [1, -1], Digit4: [-1, 0], Digit5: [0, 0], Digit6: [1, 0], Digit1: [-1, 1], Digit2: [0, 1], Digit3: [1, 1]};
addEventListener('keydown', ev => {
  const k = ev.key, code = ev.code.replace('Numpad', 'Digit');
  if (k === 'm' || k === 'M') { muto(!OPZ.muto); return; }
  if (k === 'h' || k === 'H' || k === '?') { apriLegenda(); return; }
  if (k === 'Escape') { $('legenda').classList.add('nasc'); VISTA.dist = 1; VISTA.yaw = 0; return; }
  if (k === 'Tab') { ev.preventDefault(); if (!ST) return; const vivi = ST.p.map((q, i) => i).filter(i => i !== IO && ST.p[i].vivo); if (!vivi.length) return; const j = FOCUS ? (vivi.indexOf(FOCUS.i) + 1) % vivi.length : 0; FOCUS = {i: vivi[j], fino: performance.now() + 2500}; setTimeout(() => { ULTIMO_HOVER = '?'; }, 2600); return; }
  if (FASE !== 'scegli' || IO < 0 || !ST.p[IO].vivo) return;
  if (k === 'Enter' || k === ' ') { ev.preventDefault(); $('b-pronto').onclick(); return; }
  if (k === 'e' || k === 'E' || k === 'q' || k === 'Q') { $('b-abil').onclick(); return; }
  const me = [ST.p[IO].x, ST.p[IO].y];
  if (DIRT[code]) { const [d, e] = DIRT[code], n = ev.shiftKey ? 2 : 1; KEYC = [me[0] + d * n, me[1] + e * n]; scegli(KEYC[0], KEYC[1]); return; }
  const dirs = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1], A: [-1, 0], D: [1, 0], W: [0, -1], S: [0, 1]};
  if (dirs[k]) { ev.preventDefault(); const lista = ABON && MOSSE_AB.length ? MOSSE_AB : MOSSE, [d, e] = dirs[k]; let c = KEYC || MIA || me;
    for (let n = 0; n < 5; n++) { c = [c[0] + d, c[1] + e]; if (lista.some(m => m[0] === c[0] && m[1] === c[1])) { KEYC = c; scegli(c[0], c[1]); return; } } }
});
$('b-abil').onclick = () => { if (!INFO || !INFO.puo) return; ABON = !ABON; bottoni(); aggiornaCampo(); if (MIA) scegli(MIA[0], MIA[1]); };
$('b-pronto').onclick = () => { Rete.az({act: 'pronto'}); const io = RANE[IO]; if (io) io.sfotto = .5; suono('tic'); };
function apriLegenda(scheda) { if (!$('titolo').classList.contains('nasc') || !$('carica').classList.contains('via')) return;   // mai sopra il titolo o il caricamento
  $('g-t').textContent = L().regole; $('g-sot').innerHTML = `<div class="seg" id="g-tab">${L().legT.map((t, k) => `<b data-k="${k}" class="${k === (scheda || 0) ? 'sel' : ''}">${t}</b>`).join('')}</div>`;
  document.querySelectorAll('#g-tab b').forEach(b => b.onclick = () => apriLegenda(+b.dataset.k)); legenda('leg2', scheda || 0); $('g-ok').textContent = L().ok; $('legenda').classList.remove('nasc'); }
$('aiuto').onclick = apriLegenda;
$('g-ok').onclick = () => $('legenda').classList.add('nasc');
$('muto').onclick = () => { ac(); muto(!OPZ.muto); };
function auto() {
  if (FASE !== 'scegli' || !MOSSE.length || MIA) return;
  const pesa = m => { const t = ST.campo[m[0]][m[1]], lz = LEZIONE && ST.lezione && (ST.lezione.evid || []).some(z => z[0] === m[0] && z[1] === m[1]); return (lz ? 20 : 0) + (CELLE[m[0]][m[1]].userData.passa ? 6 : 0) + (TC[t] ? (FAMIGLIA[t] === 'trap' ? (Q.get('auto_trappole') === '1' ? 30 : -8) : t === 'patata' ? -2 : 3) : 0) - 6 * (pericoloLiv(m[0], m[1]) === 1) + Math.random() * 2.5; };
  const m = MOSSE.slice().sort((a, b) => pesa(b) - pesa(a))[0];
  if (INFO && INFO.puo && Math.random() < .35) { ABON = true; bottoni(); }
  scegli(m[0], m[1]); setTimeout(() => Rete.az({act: 'pronto'}), 300);
}
// tutorial: 3 turni guidati alla prima partita
function tutorial(turno) {
  chiudiTut(); if (true) { if (turno > 3 && OPZ.tut) { OPZ.tut = false; scrivi('tut', '1'); } return; }
  const t = $('tut'); t.innerHTML = L().tut[turno - 1] + ` <button class="btn g" style="display:block;margin-top:9px;padding:6px 12px;font-size:12.5px" id="tut-ok">${L().ok}</button>`;
  t.style.left = '50%'; t.style.transform = 'translateX(-50%)'; t.style.bottom = (isPC() ? 100 : 92) + 'px'; t.style.top = 'auto'; t.classList.remove('nasc');
  $('tut-ok').onclick = chiudiTut;
}
function chiudiTut() { $('tut').classList.add('nasc'); }

/* ---------------- animazioni dei bot ---------------- */
async function salto(o, a, fr) {
  const x0 = o.x, y0 = o.y, x1 = x0 + (a[0] - x0) * fr, y1 = y0 + (a[1] - y0) * fr;
  const d = Math.hypot(x1 - x0, y1 - y0); o.emote = null; o.paura = 0;
  o.stato = 'carica'; await tw(.2, k => { o.sq = 1 - .32 * eo(k); o.braccioSu = -.5 * k; o.tiltX = .3 * k; });
  o.stato = 'volo'; suono('salto', .6); dip(Math.round(x0), Math.round(y0), .12); if (Math.random() < .3) voceRana(o.pg, .6);
  const hmax = 1.2 + d * .5, giri = 0, s0 = o.spin;
  if (d > .1) { const a0 = pos(x0, y0), a1 = pos(x1, y1); o.direzione = Math.atan2(a1.x - a0.x, a1.z - a0.z); }
  // sospensione in cima: la quota sale veloce, resta su un attimo, scende veloce; in avanti avanza morbido
  await tw(.56, k => { const h = k * k * (3 - 2 * k); o.x = x0 + (x1 - x0) * h; o.y = y0 + (y1 - y0) * h; o.alt = hmax * (1 - Math.pow(Math.abs(2 * k - 1), 2.4));
    o.sq = k < .2 ? .72 + 2.2 * k : k > .85 ? 1.12 - (k - .85) * 1.4 : 1.12 - .1 * Math.sin((k - .2) / .65 * Math.PI); o.braccioSu = k < .5 ? 1 : 1 - (k - .5) * 1.6; o.tiltX = -.35 * Math.sin(k * Math.PI); o.spin = s0 + giri * 6.283 * eio(k); });
  o.alt = 0; o.spin = s0;
}
function atterra(o) {
  o.direzione = null; o.stato = 'atterra'; o.braccioSu = 0; o.tiltX = 0; o.jv = (o.jv || 0) - 2.4;
  tw(.32, k => { o.sq = .62 + .38 * ebk(k); }).then(() => { if (o.stato === 'atterra') o.stato = 'idle'; });
  const v = pos(o.x, o.y).add(mondo.position); v.y = .3; dip(o.x, o.y, .22); tonfoPeso(o.pg);
  particelle(v, 10, 0xd8fff4, 1.4, .45, {su: 1.1, r: .1, g: 6}); anello(v, 0xbff6ea, 1.5, .45); suono('plop', .7);
}
// «POW» da fumetto: stella bianca e oro con linee di velocita', niente raggi e niente lampi
const TEX_POW = (() => { const c = tela(512, 512), g = c.getContext('2d'); g.translate(256, 256);
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; for (let k = 0; k < 28; k++) { const a = k / 28 * 6.283, r1 = 170 + (k % 3) * 18; g.beginPath(); g.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); g.lineTo(Math.cos(a) * 250, Math.sin(a) * 250); g.stroke(); }
  const stella = (r1, r2, n, col) => { g.beginPath(); for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * 6.283, r = k % 2 ? r2 : r1 * (.85 + (k % 4) * .06); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = col; g.fill(); };
  stella(175, 105, 12, '#ffffff'); stella(150, 92, 12, '#ffd23f'); g.lineWidth = 8; g.strokeStyle = '#1a1420'; g.stroke();
  g.font = `italic 900 92px ${FT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = '#1a1420'; g.strokeText('POW!', 0, 6); g.fillStyle = '#ff6a2a'; g.fillText('POW!', 0, 6);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
function pow(v) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: TEX_POW, transparent: true, depthTest: false})); sp.position.copy(v); sp.position.y += .2; scena.add(sp);
  tw(.6, k => { const sc0 = k < .25 ? 2.6 * ebk(k / .25) : 2.6; sp.scale.set(sc0, sc0, 1); sp.material.rotation = (k - .5) * .15; sp.material.opacity = k < .7 ? 1 : (1 - k) / .3; }).then(() => via(sp));
}
function polvere(v) {
  v.y = .2; particelle(v, 22, 0xb8a58a, 2.2, .9, {fumo: true, r: .55, su: .25, g: .5, cresce: 1.2});
  const m = new THREE.Mesh(new THREE.RingGeometry(.3, .55, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xcdbb9a, transparent: true, depthWrite: false})); m.position.copy(v); scena.add(m);
  tw(.6, k => { m.scale.setScalar(1 + k * 2.2); m.material.opacity = .7 * (1 - k); }, eo).then(() => via(m));
}
function stelline(v) {
  const g = new THREE.Group(); g.position.copy(v); scena.add(g);
  for (let k = 0; k < 5; k++) { const st = new THREE.Mesh(GEO.stella, new THREE.MeshBasicMaterial({color: 0xffe066, transparent: true})); st.scale.setScalar(1.6); g.add(st); }
  tw(1.0, k => { g.children.forEach((st, j) => { const a = k * 9 + j * 1.256; st.position.set(Math.cos(a) * (.5 + k * .3), .2 + Math.sin(k * 3 + j) * .1, Math.sin(a) * (.5 + k * .3)); }); g.children.forEach(st => st.material.opacity = 1 - k); }).then(() => via(g));
}
// prima dei salti: le frecce di TUTTI i bersagli compaiono insieme (colore del giocatore), con l'anello sulla ninfea d'arrivo
async function frecceBersaglio(s, chi) {
  if (!chi.length) return;
  const gruppi = [];
  for (const i of chi) {
    const a = pos(s.da[i][0], s.da[i][1]), b = pos(s.a[i][0], s.a[i][1]); a.y = .35; b.y = .2;
    const mid = a.clone().lerp(b, .5); mid.y = 1.1 + a.distanceTo(b) * .22;
    const curva = new THREE.QuadraticBezierCurve3(a, mid, b), g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({color: COL[i], transparent: true, depthWrite: false, depthTest: false});
    const pts = []; for (let k = 0; k <= 20; k++) pts.push(curva.getPoint(k / 20 * .8));
    const tubo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .06, 6), mat); tubo.renderOrder = 12; g.add(tubo);
    const p1 = curva.getPoint(.8), p2 = curva.getPoint(.97), punta = new THREE.Mesh(new THREE.ConeGeometry(.17, .38, 10), mat); punta.position.copy(p1.clone().lerp(p2, .5));
    punta.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize()); punta.renderOrder = 12; g.add(punta);
    const anel = new THREE.Mesh(new THREE.RingGeometry(.5, .64, 40).rotateX(-Math.PI / 2), mat); anel.position.copy(b); anel.position.y = .1; anel.renderOrder = 12; g.add(anel);
    g.scale.setScalar(.01); mondo.add(g); gruppi.push({g, mat, b: g.position.clone()});
  }
  suono('sibilo', .5);
  await tw(.18, k => { for (const z of gruppi) z.g.scale.setScalar(Math.max(.01, ebk(k))); });
  await attendi(.42);
  tw(.3, k => { for (const z of gruppi) z.mat.opacity = 1 - k; }).then(() => { for (const z of gruppi) { mondo.remove(z.g); z.g.traverse(m => { if (m.geometry) m.geometry.dispose(); }); z.mat.dispose(); } });
}
async function avvisoScontri(sc, s) {
  const lbl = [];
  for (const e of sc) {
    const c = CELLE[e.x] && CELLE[e.x][e.y]; if (c) { c.userData.area.material.color.set(ROSSO); c.userData.area.material.opacity = .6; c.userData.pulsa = true; AREE_ON.push(c); c.userData.badge.material.map = badgeTex('!', ROSSO); c.userData.badge.material.needsUpdate = true; c.userData.badge.visible = true; }
    const dest = pos(e.x, e.y).add(mondo.position);
    for (const i of e.chi) { const o = RANE[i]; if (!o) continue; o.paura = .6; const da = pos(s.da[i][0], s.da[i][1]).add(mondo.position);
      for (let n = 1; n <= 5; n++) { const pt = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true})); pt.position.lerpVectors(da, dest, n / 6); pt.position.y = .35 + Math.sin(n / 6 * Math.PI) * .5; scena.add(pt);
        tw(.75, k => { pt.material.opacity = Math.max(0, Math.sin((k * 3 - n * .3) * Math.PI)); }).then(() => via(pt)); } }
    // niente etichetta di testo: bastano anello rosso, «!» e le scie che convergono (la scritta arriva con lo scontro)
  }
  suono('tic'); suono('tic', .8); await attendi(.4);
  for (const d of lbl) d.remove(); for (const e of sc) { const c = CELLE[e.x] && CELLE[e.x][e.y]; if (c) c.userData.badge.visible = false; }
  spegniAree(); for (const i of sc.flatMap(e => e.chi)) RANE[i].paura = 0;
}
// salto verso la casella contesa: ci si incontra a mezz'aria SOPRA la casella (gli altri arrivano dagli altri lati)
async function saltoScontro(e, s) {
  const n = e.chi.length;
  await Promise.all(e.chi.map(async (i, k) => {
    const o = RANE[i], x0 = o.x, y0 = o.y, dx = e.x - x0, dy = e.y - y0, L0 = Math.hypot(dx, dy) || 1;
    const stop = .3 / L0;     // si fermano a 0,3 caselle dal centro, ognuno dal suo lato
    o.direzione = Math.atan2(pos(e.x, e.y).x - pos(x0, y0).x, pos(e.x, e.y).z - pos(x0, y0).z);
    o.stato = 'carica'; await tw(.2, k2 => { o.sq = 1 - .32 * eo(k2); o.braccioSu = -.5 * k2; });
    o.stato = 'volo'; suono('salto', .6);
    await tw(.5, k2 => { const f = k2 * (1 - stop); o.x = x0 + dx * f; o.y = y0 + dy * f; o.alt = Math.sin(k2 * Math.PI * .5) * 1.5; o.sq = 1.1; o.braccioSu = 1; }, eo);
  }));
}
// sbalzato indietro: arco ben visibile verso la casella di partenza, atterraggio barcollante
async function sbalzato(o, a) {
  const x0 = o.x, y0 = o.y, a0 = o.alt; o.stato = 'volo'; o.sbraccia = 1;
  { const P0 = pos(x0, y0), P1 = pos(a[0], a[1]); o.direzione = Math.atan2(P0.x - P1.x, P0.z - P1.z); }   // vola all'indietro, guardando l'avversario
  o.posaF = 'hit'; o.posaT = .9;
  await tw(.6, k => { o.x = x0 + (a[0] - x0) * k; o.y = y0 + (a[1] - y0) * k; o.alt = a0 * (1 - k) + Math.sin(k * Math.PI) * 1.4; o.tiltX = .9 * Math.sin(k * Math.PI); o.tiltZ = Math.sin(k * 14) * .2; o.spin = 0; }, eo);
  { const v = pos(a[0], a[1]).add(mondo.position); v.y = .05; if (!OPZ.rm) { particelle(v, 10, 0xd8fff4, 1.6, .45, {su: 1.2, r: .1, g: 7}); anello(v, 0xbff6ea, 1.2, .35); } }
  o.alt = 0; o.spin = 0; o.tiltX = 0; o.sbraccia = 0; o.direzione = null; atterra(o); o.capogiro = 1.4; dip(a[0], a[1], .3);
  tw(.5, k => { o.tiltZ = Math.sin(k * Math.PI * 3) * .35 * (1 - k); }).then(() => { o.tiltZ = 0; });
}
function lampeggiaVuota(x, y) {
  const c = CELLE[x] && CELLE[x][y]; if (!c) return;
  tw(1.2, k => { const on = Math.floor(k * 6) % 2 === 0; c.userData.mat.emissive.set(on ? 0xff2d45 : 0x000000).multiplyScalar(on ? .55 : 0); }).then(() => tinta(c, c.userData.t, false, false, c.userData.liv));
}
async function torna(o, a) {
  o.stato = 'volo'; suono('rimbalzo'); const x0 = o.x, y0 = o.y;
  await tw(.32, k => { o.x = x0 + (a[0] - x0) * k; o.y = y0 + (a[1] - y0) * k; o.alt = Math.sin(k * Math.PI) * .9; o.tiltZ = Math.sin(k * Math.PI) * .7; o.spin = k * 3.14; }, eo);
  o.alt = 0; o.tiltZ = 0; o.spin = 0; atterra(o); o.capogiro = .9;
}
// SPINTO: colpo (schiacciato), sbalzo a saltelli (uno per casella) col corpo all'indietro e i piedi che annaspano, schizzo a ogni ninfea toccata,
// barcollata all'arrivo; se finisce in acqua, fuori o su una trappola: un attimo di «uh-oh» sul bordo, braccia a mulinello
async function scivola(o, a, d, opz) {
  (window.__momenti = window.__momenti || []).push(['spinta', performance.now()]); const vic = Q.get('vicino') === '1' && !CAMT; if (vic) primoPiano((o.x + a[0]) / 2, (o.y + a[1]) / 2, 8, .25);
  opz = opz || {}; const x0 = o.x, y0 = o.y, n = Math.max(1, Math.round(Math.max(Math.abs(a[0] - x0), Math.abs(a[1] - y0)))), rm = OPZ.rm;
  const A0 = pos(x0, y0), A1 = pos(a[0], a[1]); o.direzione = Math.atan2(A0.x - A1.x, A0.z - A1.z);   // guarda chi lo ha spinto: vola all'indietro
  o.stato = 'colpito'; o.posaF = 'hit'; o.posaT = (d || .3) * n + .6; o.jv = (o.jv || 0) - 2.6; o.flash = .15;
  if (!rm) { fermo(.04); await attendi(.06); }
  const dur = Math.max(.22, (d || .3)) * (.75 + .25 * n), trapF = !opz.bordo && ST && ST.campo[a[0]] && FAMIGLIA[ST.campo[a[0]][a[1]]] === 'trap';
  let ultimo = 0; o.sbraccia = .7; suono('splash', .35);
  await tw(dur, k => { const h = eo(k); o.x = x0 + (a[0] - x0) * h; o.y = y0 + (a[1] - y0) * h;
    const f = k * n, salto = f - Math.floor(f); o.alt = rm ? 0 : Math.abs(Math.sin(salto * Math.PI)) * (.32 - .08 * Math.floor(f)); o.tiltX = .55 * (1 - k * .5); o.tiltZ = Math.sin(k * 30) * .12;
    const tocco = Math.floor(f + .5); if (tocco > ultimo && tocco <= n) { ultimo = tocco; const v = pos(o.x, o.y).add(mondo.position); v.y = .05;
      if (!rm) { particelle(v, 8, 0xd8fff4, 1.5, .4, {su: 1, r: .09, g: 7}); anello(v, 0xbff6ea, .9, .3); } suono('plop', .5); dip(Math.round(o.x), Math.round(o.y), .14); } });
  o.alt = 0; o.sbraccia = 0;
  if (opz.bordo || trapF) {   // uh-oh: in bilico sul bordo, braccia a mulinello, poi giu'
    o.paura = 1; o.sbraccia = 1.4; vola(o, OPZ.lang === 'en' ? 'UH-OH' : 'OH NO', '#ffe38a');
    await tw(rm ? .1 : .38, k => { o.tiltX = .5 + Math.sin(k * 20) * .25; o.tiltZ = Math.sin(k * 26) * .3; }); o.paura = 0; o.sbraccia = 0; }
  else { atterra(o); tw(.42, k => { o.tiltX = .55 * (1 - k) * Math.cos(k * 9); o.tiltZ = Math.sin(k * Math.PI * 3) * .3 * (1 - k); }).then(() => { o.tiltX = 0; o.tiltZ = 0; }); o.capogiro = .8; }
  o.direzione = null; o.tiltZ = opz.bordo || trapF ? o.tiltZ : 0; o.spin = 0; if (vic) await tornaVista(.35);
}
function ferita(i, n, da) {
  const o = RANE[i], q = ST.p[i]; q.hp -= n; hud(); cuorePerso(i); if (n > 1) setTimeout(() => cuorePerso(i), 120);
  if (da != null) { STAT[da] = STAT[da] || {d: 0, k: 0, g: 0}; STAT[da].d += n; }
  o.flash = .4; o.capogiro = 1.2; vola(o, '-' + n, '#ff4d5e', n > 1); voceRana(o.pg, 1.1);
  const v = o.root.position.clone().add(mondo.position); v.y = 1.4; particelle(v, 4 + n * 3, 0xff5a6e, 2.5, .8, {su: 1.4, r: .3, normale: true});
  let ax = (Math.random() - .5) * .3, az = .2; if (da != null && RANE[da]) { const a1 = pos(o.x, o.y), b1 = pos(RANE[da].x, RANE[da].y); ax = Math.sign(a1.x - b1.x) * .45; az = Math.sign(a1.z - b1.z) * .45; }
  o.stato = 'colpito'; o.jv = (o.jv || 0) - 1.6 - .6 * n;
  tw(.45, k => { const e = Math.sin(k * Math.PI); o.kx = ax * e; o.kz = az * e; o.tiltZ = -ax * 1.2 * e; o.tiltX = az * .8 * e; o.spin = k * 6.283 * (n > 1 ? 1 : .5); o.sq = 1 - .2 * e; }, eo).then(() => { o.spin = 0; o.tiltX = o.tiltZ = 0; o.stato = 'idle'; });
  if (i === IO) vibra(n > 1 ? 120 : 60, n > 1);
  if (q.vivo && q.hp === 1) hud();
}
function raccoglie(o, t) {
  // il bot afferra il gadget: il disco sale dalle mani, gira, sparisce
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), new THREE.MeshBasicMaterial({map: discoTex(t), transparent: true, depthWrite: false, side: THREE.DoubleSide}));
  m.position.copy(o.root.position).add(mondo.position); m.position.y += .6; scena.add(m); o.braccioSu = 1;
  STAT[o.i] = STAT[o.i] || {d: 0, k: 0, g: 0}; STAT[o.i].g++;
  return tw(.55, k => { m.position.y = o.root.position.y + .6 + k * 1.6; m.rotation.y = k * 8; m.lookAt(cam.position); m.material.opacity = k < .7 ? 1 : (1 - k) / .3; m.scale.setScalar(.6 + k * .6); }, eo).then(() => { scena.remove(m); o.braccioSu = 0; });
}

/* ---------------- ENTRATA IN SCENA ---------------- */
async function entrata() {
  FASE = 'entrata'; pubblico(.8, true); sigla('turno'); bannerVia(L().via, null, 1.6);
  if (!OPZ.rm) { suono('sibilo', .7); for (const r of CELLE) for (const c of r) { const u = c.userData, rit = (u.x + u.y) * .03; u.sale = 5; tw(rit + .42, k => { const q = Math.max(0, (k * (rit + .42) - rit) / .42); u.sale = 5 * (1 - ebk(Math.min(1, q))); }).then(() => { u.sale = 0; }); } await attendi(.3); }
  const giri = RANE.map((o, k) => sleep(k * .28 * (OPZ.rm ? .2 : 1)).then(async () => {
    const x = o.x, y = o.y; o.a = 1; o.alt = 9; o.spin = 6.28;
    await tw(.45, t => { o.alt = 9 * (1 - t * t); o.spin = 6.28 * (1 - t); });
    o.alt = 0; o.spin = 0; atterra(o); scossa(.08); o.festa = 1; setTimeout(() => { o.festa = 0; }, 500);
    vola(o, nm(o.i), COL[o.i]);
  }));
  await Promise.all(giri);
}

/* ---------------- RIVELAZIONE ---------------- */
const TEMPI = [];
async function rivela(evs, stato) { const t0r = performance.now();
  FASE = 'rivela'; clearInterval(timer); $('bot').classList.add('via'); cap(null); SEGNO.visible = false; spegniAree(); ULTIMO_HOVER = '?'; chiudiTut();
  ACC = CODA.some(e => e.k === 'turno') ? 1.6 : 1;
  aggiornaCampo(); for (const o of RANE) { o.bordo = false; o.emote = null; }
  $('lezc').classList.add('nasc'); mostraTip(''); HAKO = evs.some(e => e.k === 'ko');
  const rv = evs.find(e => e.k === 'rivela'); if (rv) for (const [i, sc] of Object.entries(rv.scelte)) { const o = RANE[+i]; if (o && sc[2]) { usaPotere(o); if (ST.p[+i].pg === 'axa') o.bollaOn = true; } }
  const s = evs.find(e => e.k === 'salti');
  { const cat = e => ['spara', 'mina', 'minacce'].includes(e.k) ? 'gadget' : ['loto', 'scudo', 'molla', 'specchio', 'patata', 'jackpot', 'trampolino', 'passa', 'spintone', 'scivola', 'patata_boom', 'trappola'].includes(e.k) ? 'effetti' : e.k === 'scorre' ? 'scorre' : e.k === 'stringe' ? 'crollo' : e.k === 'ko' ? 'ko' : null;
    const L1 = ['salto']; if (evs.some(e => e.k === 'scontro') || (s.rimbalzo || []).length) L1.push('scontri');
    for (const e of evs) { const c = cat(e); if (c && !L1.includes(c) && c !== 'ko') L1.push(c); } if (evs.some(e => e.k === 'ko')) L1.push('ko'); passi(L1); }
  passoFase('salto');
  const chi = Object.keys(s.a).map(Number).filter(i => s.a[i][0] !== s.da[i][0] || s.a[i][1] !== s.da[i][1]);
  const rimb = new Set(s.rimbalzo || []);
  schermo(OPZ.lang === 'en' ? 'JUMP!' : 'SALTO!', null, '#ffcf6a');
  const seq = evs.filter(e => !['rivela', 'salti'].includes(e.k));
  const sc = seq.filter(e => e.k === 'scontro');
  const inScontro = new Set(sc.flatMap(e => e.chi));
  // 1. avviso: frecce che convergono sulla stessa casella, «!» rosso e «STESSA CASELLA»
  await frecceBersaglio(s, chi); if (chi.length) sigla('rivela');
  if (sc.length) await avvisoScontri(sc, s);
  const pr = Promise.all(chi.filter(i => RANE[i]).map(i => inScontro.has(i) ? null : salto(RANE[i], s.a[i], rimb.has(i) ? .55 : 1)).concat(sc.map(e => saltoScontro(e, s))));
  setTimeout(() => rallenta(.35, .12, .25, .25), 360 / ACC);
  await pr;
  if (chi.length) { fermo(.06); scossa(.1 + .04 * chi.length); suono('atterra'); vibra(25); pubblico(.25); for (const i of chi) if (!rimb.has(i)) atterra(RANE[i]); }
  if (sc.length || rimb.size) {
    await passoFase('scontri');
    // 2. impatto a mezz'aria sopra la casella
    if (sc.length) {
      const e0 = sc[0], v0 = pos(e0.x, e0.y).add(mondo.position); v0.y = 1.5;
      primoPiano(e0.x, e0.y, Q.get('vicino') === '1' ? 8 : 16, .35); fermo(.14); suono('tonfo'); suono('boing'); rumore(1.2, .15, 500, true); scossa(.45); vibra(90, true);
      (window.__momenti = window.__momenti || []).push(['scontro', performance.now()]);
      for (const e of sc) { for (const i of e.chi) { const o = RANE[i]; o.jv = (o.jv || 0) - 3.2; o.flash = .12; o.posaF = 'clash'; o.posaT = .35; }
        const v = pos(e.x, e.y).add(mondo.position); v.y = .05; if (!OPZ.rm) { spruzzo(v, .7); anello(v.clone().setY(1.4), 0xffe38a, 2.2, .35, .14); } }
      for (const e of sc) { const v = pos(e.x, e.y).add(mondo.position); v.y = 1.5; pow(v); polvere(pos(e.x, e.y).add(mondo.position)); stelline(v); }
      boom(OPZ.lang === 'en' ? 'CLASH!' : 'SCONTRO!', OPZ.lang === 'en' ? 'same tile' : 'stessa casella', '#ffd23f'); pubblico(.6, true);
      await rallenta(.3, .05, .4, .2);
    } else { boom(OPZ.lang === 'en' ? 'BOUNCE!' : 'RIMBALZO!', null, '#ffd23f'); suono('rimbalzo'); scossa(.25); fermo(.08); lampo('#fff6c0', .35); }
    const en = OPZ.lang === 'en';
    cap(sc.map(e => { const tu = e.chi.includes(IO), nomi = e.chi.map(NM), lista = nomi.length > 1 ? nomi.slice(0, -1).join(', ') + (en ? ' and ' : ' e ') + nomi[nomi.length - 1] : nomi[0];
      return en ? `${lista} on the same tile: bounced back, -1 each` : `${lista} sullo stesso posto: ${tu ? 'rimbalzate' : 'rimbalzano'} indietro, -1 a testa`; }).join('<br>') || `${elenco([...rimb])}`);
    // 3. tutti indietro, verso la casella da cui sono partiti; la casella contesa resta vuota e lampeggia
    for (const e of sc) lampeggiaVuota(e.x, e.y);
    const danni = seq.filter(e => e.k === 'danno' && e.perche === 'scontro');
    await Promise.all([...rimb].map(i => inScontro.has(i) ? sbalzato(RANE[i], s.da[i]).then(() => { for (const d of danni.filter(d => d.sg === i)) ferita(d.sg, d.n, null); }) : torna(RANE[i], s.da[i])));
    for (const d of danni.filter(d => !inScontro.has(d.sg))) ferita(d.sg, d.n, null);
    if (sc.length) await tornaVista(.5);
    await attendi(.3);
  }
  const fatti = new Set(seq.filter(e => e.k === 'danno' && e.perche === 'scontro'));
  const ko = seq.filter(e => e.k === 'ko');
  let k = 0;
  while (k < seq.length) {
    const e = seq[k];
    if (fatti.has(e) || e.k === 'scontro' || e.k === 'buco' || e.k === 'lezione_esito' || e.k === 'spareggio' || e.k === 'sorteggio') { k++; continue; }   // UNICO_1711: dopo i KO
    { const c = ['spara', 'mina', 'minacce'].includes(e.k) ? 'gadget' : ['loto', 'scudo', 'molla', 'specchio', 'patata', 'jackpot', 'trampolino', 'passa', 'spintone', 'scivola', 'patata_boom', 'trappola'].includes(e.k) ? 'effetti' : e.k === 'scorre' ? 'scorre' : e.k === 'stringe' ? 'crollo' : null; if (c) await passoFase(c); }
    if (e.k === 'spintone' || e.k === 'scivola') { const blocco = [seq[k++]]; while (k < seq.length && ((seq[k].k === 'cade' && ['spinta', 'scivolo'].includes(seq[k].perche)) || (seq[k].k === 'danno' && ['spinta', 'scivolo'].includes(seq[k].perche)))) blocco.push(seq[k++]); await (e.k === 'spintone' ? spintone(blocco) : scivolata(blocco)); continue; }
    if (e.k === 'minacce' || e.k === 'mina' || e.k === 'spara') {
      const blocco = []; while (k < seq.length && ['minacce', 'mina', 'spara', 'danno', 'parato', 'gelato', 'spinto', 'cade', 'copia_vuota', 'riflesso'].includes(seq[k].k) && !(seq[k].k === 'cade' && seq[k].perche !== 'spinta') && !(seq[k].k === 'danno' && ['bordo', 'patata', 'riva'].includes(seq[k].perche))) blocco.push(seq[k++]);
      await gadget(blocco); continue;
    }
    if (e.k === 'patata_boom') { const blocco = [seq[k++]]; while (k < seq.length && (seq[k].k === 'danno' || seq[k].k === 'parato') && seq[k].perche !== 'bordo') blocco.push(seq[k++]); await patataBoom(blocco); continue; }
    k++; await passo(e);
  }
  if (ko.length) { await passoFase('ko'); await koMomento(ko, seq.filter(e => e.k === 'buco')); }
  for (const e of seq) { if (e.k === 'spareggio') await spareggioScena(e); else if (e.k === 'sorteggio') await sorteggioScena(e); }   // UNICO_1711
  const es = evs.find(e => e.k === 'lezione_esito');
  if (es) { if (es.ok) { boom(L().bravo, null, '#ffd23f'); suono('cura'); sigla('combo'); coriandoli(40); } else boom(L().riprova.toUpperCase(), null, '#ff9a2e'); await attendi(1.0); }
  cap(null); spegniAree();
  applica(stato); TEMPI.push({rivela: +((performance.now() - t0r) / 1000).toFixed(2), acc: ACC, ko: evs.filter(e => e.k === 'ko').length, gadget: evs.some(e => e.k === 'spara')}); ACC = 1;
}
async function spintone(b) {
  const e = b[0], j = RANE[e.su];
  boom(OPZ.lang === 'en' ? 'SHOVE!' : 'SPINTONE!', null, '#ffb020'); suono('onda'); scossa(.25); fermo(.07); pubblico(.3);
  cap(OPZ.lang === 'en' ? `${NM(e.sg)} lands on ${NM(e.su)} and ${e.fuori ? 'knocks them into the water!' : 'shoves them away'}` : `${NM(e.sg)} atterra su ${NM(e.su)} e lo ${e.fuori ? 'butta in acqua!' : 'spinge via'}`);
  j.stato = 'colpito'; j.capogiro = 1; RANE[e.sg].sfotto = .6;
  await scivola(j, e.a, .3, {bordo: e.fuori});
  for (const x of b.slice(1)) { if (x.k === 'cade') await caduta(x); else ferita(x.sg, x.n, x.da); }
}
async function scivolata(b) {
  const e = b[0], o = RANE[e.sg];
  cap(OPZ.lang === 'en' ? `${NM(e.sg)} slips!` : `${NM(e.sg)} scivola!`); o.sbraccia = .8;
  await scivola(o, e.a, .3); o.sbraccia = 0;
  for (const x of b.slice(1)) { if (x.k === 'cade') await caduta(x); else ferita(x.sg, x.n, x.da); }
}
const NOMEARMA = t => (T[t] ? T[t][0] : ab(t) ? ab(t)[0] : t).toLowerCase();
const LASER = '#8ff3ff';   // il getto d'acqua
const COLA = t => ['riga', 'colonna', 'croce', 'diagonali'].includes(t) ? LASER : TC[t] || {panciata: '#2f9bff', nube: '#43c443', lampo: '#e6eeff', lingua: '#ff7aa8'}[t] || '#ff5050';
async function gadget(blocco) {
  const min = blocco.find(e => e.k === 'minacce'), mine = blocco.filter(e => e.k === 'mina'), spari = blocco.filter(e => e.k === 'spara');
  for (const m of mine) mostraAree(m.celle, '#ff2020', true);
  if (min) for (const a of min.aree) if (a.t !== 'mina') mostraAree(a.celle, COLA(a.t), true);
  // reazione al pericolo: chi sta nelle aree si spaventa
  const inPericolo = new Set(); if (min) for (const a of min.aree) for (const [x, y] of a.celle) for (const o of RANE) if (!o.ko && o.x === x && o.y === y && o.i !== a.sg) inPericolo.add(o);
  for (const o of inPericolo) o.paura = 1;
  const en = OPZ.lang === 'en', frasi = [];
  const suChi = a => a.map(i => i === IO ? `<span style="color:${COL[i]}">${en ? 'you' : 'di te'}</span>` : NM(i)).join(', ');
  for (const e of spari) frasi.push(`${NM(e.sg)}: ${NOMEARMA(e.t)}` + (e.presi.length ? (en ? ` on ${suChi(e.presi)}` : ` su ${suChi(e.presi)}`) : (en ? ', miss' : ' a vuoto')));
  cap(frasi.slice(0, 3).join('<br>') + (frasi.length > 3 ? `<br>+${frasi.length - 3}` : ''));
  schermo(OPZ.lang === 'en' ? 'POWERS!' : 'POTERI!', null, '#ff6a6a'); suono('carica');
  const cariche = spari.map(e => CELLE[e.x] && CELLE[e.x][e.y]).filter(Boolean);
  await Promise.all([tw(.42, k => { for (const c of cariche) { c.userData.carica = k * 1.2; tinta(c, c.userData.t, false, false); c.userData.trema = .2; } }),
    ...spari.filter(e => TC[e.t]).map(e => raccoglie(RANE[e.sg], e.t))]);
  for (const c of cariche) { c.userData.carica = 0; tinta(c, c.userData.t, false, false); }
  for (const o of inPericolo) o.paura = 0;
  spegniAree();
  const tot = blocco.filter(e => e.k === 'danno').reduce((a, e) => a + e.n, 0);
  const combo = spari.filter(e => e.presi.length >= 2 && !['onda', 'gelo', 'lingua', 'calamita'].includes(e.t)).sort((a, b) => b.presi.length - a.presi.length)[0];
  if (combo && !HAKO) { primoPiano(combo.x, combo.y, 14, .5); rallenta(.4, .1, .3, .3); }
  const lu = [];
  for (const m of mine) lu.push(esplosione(m.x, m.y, 1.3));
  for (const e of spari) lu.push(effetto(e));
  if (tot) { fermo(.06 + .03 * Math.min(4, tot)); scossa(.25 + .08 * Math.min(5, tot)); pubblico(.2 + .1 * tot); }
  if (combo) { boom(`COMBO ×${combo.presi.length}`, `${nm(combo.sg)}: ${NOMEARMA(combo.t)}`, COL[combo.sg]); coriandoli(45); lampo('#ffffff', .25); pubblico(.6, true); sigla('combo'); MIGLIORE = {n: combo.presi.length, testo: `${nm(combo.sg)}: ${NOMEARMA(combo.t)} ×${combo.presi.length}`}; momento(3 + combo.presi.length, 'combo', `${OPZ.lang === 'en' ? 'Combo' : 'Combo'} ×${combo.presi.length}: ${nm(combo.sg)} (${NOMEARMA(combo.t)})`); }
  await attendi(.16);
  for (const e of blocco) {
    if (e.k === 'danno') ferita(e.sg, e.n, e.da);
    else if (e.k === 'parato') { const o = RANE[e.sg]; vola(o, e.con === 'bolla' ? (en ? 'BUBBLE' : 'BOLLA') : (en ? 'BLOCKED' : 'PARATO'), '#ffe38a'); if (e.con === 'scudo') { rompiScudo(o); ST.p[e.sg].scudo = 0; hud(); } }
    else if (e.k === 'gelato') { const o = RANE[e.sg]; o.gelo = true; lu.push(cristalli(o)); fumetto(o, spiegaStato('gelo', 1), COLSTATO.gelo); }
    else if (e.k === 'riflesso') { const o = RANE[e.sg], j = RANE[e.su]; suono('specchio'); momento(3, 'specchio', `${nm(e.sg)} ${en ? 'reflects onto' : 'rimanda il colpo a'} ${nm(e.su)}`); boom(en ? 'BOUNCE BACK!' : 'RIMANDATO!', `${nm(e.sg)} → ${nm(e.su)}`, '#d6def0'); ST.p[e.sg].specchio = 0; hud();
      lu.push(raggioSweep(o.root.position.clone().add(mondo.position), o.root.position.clone().add(mondo.position), j.root.position.clone().add(mondo.position), new THREE.Color('#e8eeff'))); }
  }
  const sp = blocco.filter(e => e.k === 'spinto');
  if (sp.length) await Promise.all(sp.map(e => scivola(RANE[e.sg], e.a, .28, {bordo: e.fuori})));
  for (const e of blocco.filter(e => e.k === 'cade')) await caduta(e);
  await Promise.all(lu);
  if (combo && !HAKO) await tornaVista(.3);
}
async function esplosione(x, y, forza) {
  const v = pos(x, y).add(mondo.position); v.y = .6; suono('bomba'); vibra(80, true); lampo('#e6c8ff', .3);
  mostraAree([[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([d, e]) => [x + d, y + e]), '#c25bff', false);
  lampoLuce.color.set(0xd29bff); lampoLuce.position.copy(v); lampoLuce.intensity = 12;
  palla(v, 0xd6a8ff, 3.4 * forza, .45); palla(v, 0x8a3ad8, 2.4 * forza, .6);
  particelle(v, 30, 0xe8d0ff, 6 * forza, .6, {r: .5});
  particelle(v.clone().add(new THREE.Vector3(0, .4, 0)), 16, 0x9a7ab8, 1.2, 1.6, {fumo: true, r: .9, su: .8, g: -.6, cresce: 1.4});
  detriti(v, 14, 0x4a3a5a, forza);
  anello(v, 0xe6c8ff, 4.5, .55, .2); anello(v, 0xb070ff, 2.6, .4);
  for (let d = -1; d <= 1; d++) for (let e = -1; e <= 1; e++) dip(x + d, y + e, .25);
  await tw(.5, k => { lampoLuce.intensity = 12 * (1 - k); }); spegniAree();
}
function lampeggiaCelle(celle, col) {
  const cc = new THREE.Color(col), lista = celle.map(([a, b]) => CELLE[a] && CELLE[a][b]).filter(c => c && c.visible && c.userData.base.visible);
  for (const c of lista) { c.userData.dip = .12; }
  return tw(.55, k => { for (const c of lista) c.userData.mat.emissive.copy(cc).multiplyScalar(1.4 * (1 - k)); }).then(() => { for (const c of lista) tinta(c, c.userData.t, false, false, c.userData.liv); });
}
function scintilleColpiti(e) {
  const laser = ['riga', 'colonna', 'croce', 'diagonali'].includes(e.t);
  for (const j of e.presi || []) { const o = RANE[j]; if (!o) continue; const v = o.root.position.clone().add(mondo.position); v.y = 1;
    if (laser) { scossaElettrica(o); particelle(v, 12, 0x9ff0ff, 3, .3, {r: .1}); }
    else { particelle(v, 16, 0xffffff, 4, .35, {r: .16}); anello(v.clone().setY(.25), new THREE.Color(COLA(e.t)).getHex(), 1.6, .35, .1); } }
}
// il colpito dal laser sfrigola: fulmini a zigzag attorno e corpo che lampeggia azzurro
function scossaElettrica(o) {
  const v = o.root.position.clone().add(mondo.position), linee = [];
  for (let k = 0; k < 4; k++) { const pts = []; let x = (Math.random() - .5) * .8, y = .3, z = (Math.random() - .5) * .8;
    for (let n = 0; n < 7; n++) { pts.push(new THREE.Vector3(v.x + x, y, v.z + z)); x += (Math.random() - .5) * .35; y += .22; z += (Math.random() - .5) * .35; }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color: 0xbff6ff, transparent: true})); scena.add(l); linee.push(l); }
  suono('plop', .8);
  tw(.45, k => { const on = Math.floor(k * 10) % 2 === 0; for (const l of linee) l.material.opacity = on ? 1 - k * .6 : 0; o.matC.emissive.set(on ? 0x3fd8ff : 0x000000).multiplyScalar(on ? .8 : 0); })
    .then(() => { for (const l of linee) via(l); o.matC.emissive.set(COL[o.i]).multiplyScalar(.05); });
}
async function effetto(e) {
  const t = e.t, x = e.x, y = e.y, c = new THREE.Color(COLA(t)), o = pos(x, y).add(mondo.position);
  if (e.celle && e.celle.length) lampeggiaCelle(e.celle, COLA(t)); setTimeout(() => scintilleColpiti(e), 200);
  const bruc = () => e.celle.forEach(([a, b]) => bruciatura(a, b));
  const Lz = async (x1, y1, x2, y2) => {
    const A = pos(x1, y1).add(mondo.position), B = pos(x2, y2).add(mondo.position); A.y = B.y = .78;
    // 1. linea di carica: sottile, tremolante, mentre il sibilo sale
    suono('sibilo'); const g = new THREE.BufferGeometry().setFromPoints([A, B]); const linea = new THREE.Line(g, new THREE.LineBasicMaterial({color: LASER, transparent: true, opacity: .2})); scena.add(linea);
    await tw(.3, k => { linea.material.opacity = .2 + .6 * k * (Math.random() > .3 ? 1 : .3); }); via(linea);
    // 2. il raggio vero e proprio
    suono('getto'); return raggioSweep(o, A, B, c); };
  if (['riga', 'colonna', 'croce', 'diagonali'].includes(t)) { lampo(COLA(t), .14); scossa(.18); }
  if (t === 'riga') { await Lz(-0.6, y, W - .4, y); bruc(); }
  else if (t === 'colonna') { await Lz(x, -0.6, x, H - .4); bruc(); }
  else if (t === 'croce') { await Promise.all([Lz(-0.6, y, W - .4, y), Lz(x, -0.6, x, H - .4)]); bruc(); }
  else if (t === 'diagonali') { await Promise.all([Lz(x - 6, y - 6, x + 6, y + 6), Lz(x - 6, y + 6, x + 6, y - 6)]); bruc(); }
  else if (t === 'bomba') { scossa(.5); await esplosione(x, y, 1.2); }
  else if (t === 'gelo' || t === 'lampo') { suono('gelo'); mostraAree(e.celle, t === 'gelo' ? '#7fd0ff' : '#ffffff', false); if (t === 'lampo') lampo('#ffffff', .6); anello(o, 0xbfe8ff, 3, .5); particelle(o.clone().add(new THREE.Vector3(0, .5, 0)), 30, 0xe6f8ff, 3, .8, {g: 2}); await attendi(.45); spegniAree(); }
  else if (t === 'onda' || t === 'panciata' || t === 'superbalzo') { suono('onda'); suono('splash', .6); getto(o); anello(o, 0xffffff, 3.2, .45); anello(o, 0x7fd6ff, 2.2, .35, .15); scossa(.3); await attendi(.45); }
  else if (t === 'corrente') { suono('onda'); suono('getto', .8); const A = pos(-0.6, y).add(mondo.position), B = pos(W - .4, y).add(mondo.position); A.y = B.y = .45; lampo('#9fd8ff', .12); scossa(.25);
    await raggioSweep(o, A, B, new THREE.Color('#5fb8ff')); for (const [a, b] of e.celle || []) { const v = pos(a, b).add(mondo.position); v.y = .1; particelle(v, 5, 0xd8fff4, 1.6, .5, {su: 1.2, r: .1, g: 7}); } }
  else if (t === 'calamita') { suono('magnete'); await Promise.all([campoMagnetico(o), ...(e.presi || []).map(j => raggioSweep(o, o, RANE[j].root.position.clone().add(mondo.position), new THREE.Color('#ff7a8a')))]); }
  else if (t === 'veleno' || t === 'nube') { mostraAree(e.celle, '#43c443', false); particelle(o.clone().add(new THREE.Vector3(0, .3, 0)), 24, 0x7be35a, 1.6, 1.2, {fumo: true, r: .7, g: -1, cresce: 1}); await attendi(.5); spegniAree(); }
  else if (t === 'lingua') { if (e.presi.length) { const j = RANE[e.presi[0]]; suono('rimbalzo'); await raggioSweep(o, o, pos(j.x, j.y).add(mondo.position), new THREE.Color('#ff7aa8')); } }
  else await attendi(.3);
}
async function caduta(e) {
  const o = RANE[e.sg]; o.stato = 'volo'; o.sbraccia = 1; suono('cade');
  await tw(.55, k => { o.alt = -k * k * 6; o.tiltZ = k * 2; o.spin = k * 4; });
  o.sbraccia = 0; o.x = e.x; o.y = e.y; o.tiltZ = 0; o.spin = 0; o.alt = 7;
  await tw(.32, k => { o.alt = 7 * (1 - k * k); }); o.alt = 0; atterra(o); o.capogiro = 1;
}
async function patataBoom(b) {
  const e = b[0], o = RANE[e.sg], en = OPZ.lang === 'en';
  momento(3, 'patata', `${en ? 'The burr pops on' : 'Il cardo scoppia addosso a'} ${nm(e.sg)}`); boom(en ? 'POP!' : 'SCOPPIA!', nm(e.sg), '#ff8a3a'); cap(en ? `The burr pops on ${NM(e.sg)}!` : `Il cardo scoppia addosso a ${NM(e.sg)}!`);
  o.paura = 1; await attendi(.25); o.paura = 0; ST.p[e.sg].patata = 0;
  await esplosione(e.x, e.y, 1.1);
  for (const x of b.slice(1)) { if (x.k === 'danno') ferita(x.sg, x.n, x.da); else if (x.k === 'parato') { vola(RANE[x.sg], en ? 'BLOCKED' : 'PARATO', '#ffe38a'); if (x.con === 'scudo') rompiScudo(RANE[x.sg]); } }
  hud();
}
async function passo(e) {
  const o = e.sg != null ? RANE[e.sg] : null, en = OPZ.lang === 'en';
  switch (e.k) {
    case 'loto': { const q = ST.p[e.sg]; if (q.hp === 1) { vola(o, OPZ.lang === 'en' ? 'SAVED!' : 'SALVO!', '#ffd23f', true); pubblico(.6, true); } if (q.hp < 4) q.hp++; hud(); await raccoglie(o, 'loto'); vola(o, '+1', '#ff8fb1'); suono('cura'); const v = o.root.position.clone().add(mondo.position); v.y = 1; particelle(v, 16, 0xff9fc4, 1.5, .9, {g: -2}); o.festa = 1; setTimeout(() => { o.festa = 0; }, 600); cap(`${NM(e.sg)}: ${T.loto[0]}, +1`); break; }
    case 'scudo': fumetto(o, spiegaStato('scudo', 1), COLSTATO.scudo); await raccoglie(o, 'scudo'); ST.p[e.sg].scudo = 1; hud(); suono('cura'); o.scudo.visible = true; o.scudo.scale.setScalar(.2); tw(.35, k => o.scudo.scale.setScalar(.2 + .8 * ebk(k))); cap(en ? `${NM(e.sg)} grabs the shell` : `${NM(e.sg)} prende la conchiglia`); await attendi(.25); break;
    case 'molla': fumetto(o, spiegaStato('molla', 2), COLSTATO.molla); await raccoglie(o, 'molla'); ST.p[e.sg].molla = 2; hud(); suono('boing'); await tw(.35, k => { o.alt = Math.sin(k * Math.PI) * .9; o.sq = 1 + Math.sin(k * Math.PI * 2) * .2; }); o.alt = 0; cap(`${NM(e.sg)}: ${T.molla[1]}`); break;
    case 'specchio': fumetto(o, spiegaStato('specchio', 1), COLSTATO.specchio); await raccoglie(o, 'specchio'); ST.p[e.sg].specchio = 1; hud(); suono('specchio'); cap(`${NM(e.sg)}: ${T.specchio[1]}`); break;
    case 'patata': fumetto(o, spiegaStato('patata', e.timer - 1 || 1) + '<br>' + L().passaInfo, ARANCIO); await raccoglie(o, 'patata'); ST.p[e.sg].patata = e.timer; hud(); suono('miccia'); o.paura = 1; setTimeout(() => { o.paura = 0; }, 500); cap(en ? `${NM(e.sg)} grabs the BURR: pass it by landing next to someone!` : `${NM(e.sg)} prende il CARDO: passalo atterrando accanto a qualcuno!`); await attendi(.2); break;
    case 'passa': {
      const j = RANE[e.a]; cap(L().passa(NM(e.sg), NM(e.a))); suono('boing'); o.braccioSu = 1;
      const b = new THREE.Mesh(GEO.bomba, new THREE.MeshStandardMaterial({color: 0x222222})); scena.add(b);
      const A = o.root.position.clone().add(mondo.position).add(new THREE.Vector3(0, 1.9, 0)), B = j.root.position.clone().add(mondo.position).add(new THREE.Vector3(0, 1.9, 0));
      ST.p[e.a].patata = ST.p[e.sg].patata; ST.p[e.sg].patata = 0; o.bomba.visible = false;
      await tw(.6, k => { b.position.lerpVectors(A, B, k); b.position.y += Math.sin(k * Math.PI) * 1.6; b.rotation.z = k * 9; }, eio); scena.remove(b); o.braccioSu = 0; j.paura = 1; setTimeout(() => { j.paura = 0; }, 600); hud();
      fumetto(j, `<b>${SC('patata')[0]}</b> · ${OPZ.lang === 'en' ? 'cannot pass back to' : 'non può ridarlo a'} ${nm(e.sg)}`, ARANCIO); await attendi(.5); break;
    }
    case 'trampolino': {
      cap(en ? `${NM(e.sg)}: moon leap, 2 more tiles!` : `${NM(e.sg)}: balzo lunare, altre 2 caselle!`); suono('boing'); dip(e.da[0], e.da[1], .35);
      const x0 = o.x, y0 = o.y; await tw(.45, k => { o.x = x0 + (e.a[0] - x0) * k; o.y = y0 + (e.a[1] - y0) * k; o.alt = Math.sin(k * Math.PI) * 2.4; o.spin = k * 6.283; o.braccioSu = 1; }, eio);
      o.alt = 0; o.spin = 0; o.braccioSu = 0; atterra(o); break;
    }
    case 'jackpot': {
      const q = ST.p[e.sg]; q.hp = Math.min(4, q.hp + 1); q.scudo = 1; q.bersaglio = 3; hud(); fumetto(o, spiegaStato('bersaglio', 2) + '<br>' + spiegaStato('scudo', 1), '#ffcf3a');
      momento(3, 'jackpot', `${nm(e.sg)}: ${T.jackpot[0]}`); boom(en ? 'PEARL!' : 'PERLA!', en ? `${nm(e.sg)} is now the target` : `ora ${nm(e.sg)} è il bersaglio`, '#ffcf3a'); sigla('combo'); coriandoli(60); pubblico(.8, true);
      const v = o.root.position.clone().add(mondo.position); v.y = 1; particelle(v, 40, 0xffd76a, 3, 1, {r: .3}); await raccoglie(o, 'jackpot'); o.festa = 1; setTimeout(() => { o.festa = 0; }, 900);
      cap(T.jackpot[1]); await attendi(.4); break;
    }
    case 'danno': ferita(e.sg, e.n, e.da); await attendi(.3); break;
    case 'trappola': {
      const v = o.root.position.clone().add(mondo.position); v.y = .2; window.__trappola = (window.__trappola || 0) + 1;
      if (e.t === 'fauci') { boom(en ? 'CHOMP!' : 'MORSO!', nm(e.sg), '#ff4d5e'); suono('morso'); scossa(.45); fermo(.08); lampo('#ff2d45', .3); vibra(80, true);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: discoTex('fauci'), transparent: true, depthTest: false})); sp.position.copy(v); sp.position.y += .6; sp.renderOrder = 25; scena.add(sp);
        await tw(.45, k => { const s = .4 + 1.6 * ebk(Math.min(1, k * 2)); sp.scale.set(s, s * (k > .5 ? 1 - (k - .5) * 1.6 : 1), 1); sp.material.opacity = k < .7 ? 1 : (1 - k) / .3; }); via(sp);
        particelle(v, 14, 0x3a8a3a, 2.4, .6, {su: 1.4, r: .14, g: 7}); cap(e.da != null ? (en ? `${NM(e.da)} shoves ${NM(e.sg)} into the snapper: bitten, -1` : `${NM(e.da)} spinge ${NM(e.sg)} nelle fauci: morso, -1`) : (en ? `${NM(e.sg)} lands on a snapper: bitten, -1` : `${NM(e.sg)} atterra sulle fauci: morso, -1`)); }
      else { suono('splash', .8); particelle(v, 22, 0x5a3e1a, 2.2, .8, {su: 1.6, r: .16, g: 6}); anello(v, 0x8a6a3a, 1.6, .5); o.gelo = true; o.jv = (o.jv || 0) - 2;
        cap(en ? `${NM(e.sg)} sinks into the bog: stuck next turn` : (e.sg === IO ? `${NM(e.sg)} affondi nel pantano: il turno dopo resti fermo` : `${NM(e.sg)} affonda nel pantano: il turno dopo resta fermo`)); await attendi(.35); }
      if (e.da != null && e.da !== e.sg) { momento(3, 'combo', `${nm(e.da)} ${en ? 'shoves' : 'spinge'} ${nm(e.sg)} ${en ? 'into the' : 'nella trappola:'} ${T[e.t][0]}`); STAT[e.da] = STAT[e.da] || {d: 0, k: 0, g: 0}; if (e.t === 'fauci') STAT[e.da].d++; }
      else momento(2, 'patata', `${nm(e.sg)}: ${T[e.t][0]}`); break; }
    case 'gelato': { o.gelo = true; await cristalli(o); break; }
    case 'finale': {   // annunciato un turno prima: da qui lo stagno si stringe fino a 2 file, e dopo 3 turni la cascata morde tutti
      DUELLO = true; TEMPO = 140; sigla('crollo'); pubblico(1, true); scossa(.3); lampo('#7fffe0', .25); GORGO_LAMPO = 1;
      boom(en ? 'FINALE!' : 'FINALE!', en ? `in ${e.morde - e.turno + 1} turns the waterfall bites everyone` : `tra ${e.morde - e.turno + 1} turni la cascata morde tutti`, '#7fffe0');
      bannerVia(en ? 'The finale: the pond shrinks to 2 rows' : 'Il finale: lo stagno si stringe a 2 file', 'linear-gradient(90deg,#0b6b8a,#2fc9a6)', 2.4); await attendi(1.0); break; }
    case 'cascata_finale': {
      suono('crollo'); suono('splash'); scossa(.45); lampo('#9fd8ff', .3); vibra(80, true);
      boom(en ? 'THE WATERFALL BITES' : 'LA CASCATA MORDE', '-1 ' + (en ? 'to everyone' : 'a tutti'), '#9fd8ff');
      for (const j of e.presi || []) { const r = RANE[j]; if (!r) continue; const v = r.root.position.clone().add(mondo.position); v.y = .05; spruzzo(v, .6); }
      await attendi(.5); break; }
    case 'parato': vola(o, en ? 'BLOCKED' : 'PARATO', '#ffe38a'); if (e.con === 'scudo') { rompiScudo(o); ST.p[e.sg].scudo = 0; hud(); } break;
    case 'scorre': {
      const P0 = mondo.position.clone(), dirS = pos(0, 0).sub(pos(1, 0)), col0 = CELLE[0].filter(c => c.visible);
      for (const c of col0) { c.userData.trema = .4; const v = c.position.clone().add(mondo.position); detriti(v, 2, 0x4a1020, .4); }
      await tw(.55, k => { mondo.position.copy(P0).addScaledVector(dirS, eio(k)); for (const c of col0) { c.position.y = -Math.pow(Math.max(0, k - .1), 2) * 9; c.userData.corpo.rotation.z = k * .7; } }); mondo.position.copy(P0);
      SCORSI++;
      for (let x = 0; x < W - 1; x++) ST.campo[x] = ST.campo[x + 1]; ST.campo[W - 1] = e.nuova; if (ST.arrivo) ST.arrivo = [ST.arrivo[1], ST.arrivo[1]];
      ST.mine = (ST.mine || []).map(m => [m[0] - 1, m[1], m[2]]).filter(m => m[0] >= 0);
      for (const r of RANE) r.x -= 1; aggiornaCampo(); break;
    }
    case 'cade': cap(e.perche === 'riva' ? (en ? `${NM(e.sg)}: the pad sinks under them, -1` : `${NM(e.sg)}: la ninfea affonda sotto i piedi, -1`) : (en ? `${NM(e.sg)} goes over the waterfall, -1` : `${NM(e.sg)} cade nella cascata, -1`)); await caduta(e); break;
    case 'stringe': {
      bannerVia(L().crolla, 'linear-gradient(90deg,#b0122c,#ff2d45)'); schermo(OPZ.lang === 'en' ? 'SINKING!' : 'AFFONDANO!', '', '#ff6a6a'); pubblico(.5, true); suono('crollo'); sigla('crollo');
      const fila = []; for (let x = 0; x < W; x++) fila.push(CELLE[x][e.riga]);
      await tw(.35, k => { for (const c of fila) { c.userData.trema = .6; c.userData.corpo.rotation.z = Math.sin(k * 40) * .05; } });
      for (const c of fila) { const v = c.position.clone().add(mondo.position); detriti(v, 5, 0x2a3048, .6); particelle(v, 6, 0x9aa3ab, 1.2, .8, {fumo: true, r: .6, g: -.3}); }
      await tw(.8, k => { fila.forEach((c, j) => { const t = Math.max(0, k * 1.5 - j * .08); c.position.y = -t * t * 7; c.userData.corpo.rotation.z = t * (.6 + (j % 3) * .2); c.userData.corpo.rotation.x = t * .4 * (j % 2 ? 1 : -1); }); });
      if (!ST.righe) ST.righe = [0, H - 1]; if (e.riga === ST.righe[0]) ST.righe[0]++; else ST.righe[1]--; if (ST.pericolo) ST.pericolo.riga = null;
      aggiornaCampo(); break;
    }
    case 'voto': {
      sigla('voto'); pubblico(.6, true);
      bannerVia(`${L().voto}: ${L().ev[e.nome].split(':')[0]} <span style="display:block;font:500 13px var(--x-body);font-style:normal;opacity:.85">${L().prossimo}</span>`, 'linear-gradient(90deg,#ff4f8b,#ffcf3a)', 2.2);
      schermo(OPZ.lang === 'en' ? 'VOTE' : 'VOTO', L().ev[e.nome].split(':')[0], '#ffcf3a'); await attendi(.6); break;
    }
    default: break;
  }
}
let MIGLIORE = null, HAKO = false, MOMENTI = [], DUELLO = false;
// UNICO_1711: VINCITORE UNICO. Lo SPAREGGIO (pari al primo posto: i pari tornano in campo con 1 cuore, al piu' 3 round)
// e il SORTEGGIO (ancora pari dopo 3 round, fuori torneo). SPAR = la vista `spareggio` {n, chi, fine, max} o null.
let SPAR = null;
function sparCss() {
  let st = document.getElementById('spar-css'); if (!st) { st = document.createElement('style'); st.id = 'spar-css'; document.head.appendChild(st); }
  if (!SPAR || !ST || !ST.p) { st.textContent = ''; return; }
  const si = SPAR.chi.map(i => `#ch${i} .av`).join(','), no = ST.p.map((q, i) => i).filter(i => !SPAR.chi.includes(i)).map(i => `#ch${i}`).join(',');
  st.textContent = (si ? `${si}{box-shadow:0 0 0 3px #ffd23f,0 0 16px #ffd23f!important}` : '') + (no ? `${no}{opacity:.42;filter:grayscale(1)}` : '');
}
function sparAggiorna(sp, annuncia) {
  const prima = SPAR; SPAR = sp && sp.chi && sp.chi.length ? {n: sp.n, chi: sp.chi.slice(), max: sp.max, fine: sp.fine, k: -1} : null; sparCss();
  if (SPAR && annuncia && (!prima || prima.n !== SPAR.n)) { const en = OPZ.lang === 'en';
    bannerVia(`${en ? 'TIEBREAK' : 'SPAREGGIO'} ${SPAR.n}/${SPAR.max}: ${SPAR.chi.map(i => NM(i)).join(' · ')}`, 'linear-gradient(90deg,#b8860b,#ffd23f)', 2.6); }
}
async function spareggioScena(e) {
  const en = OPZ.lang === 'en';
  sigla('voto'); pubblico(1.1, true); lampo('#ffd23f', .3); scossa(.25); vibra(120, true);
  boom(en ? 'TIEBREAK!' : 'SPAREGGIO!', `${en ? 'round' : 'round'} ${e.n}/${e.max} · ${e.chi.map(i => nm(i)).join(' · ')}`, '#ffd23f');
  cap(en ? `Tied for first: ${e.chi.map(i => NM(i)).join(' and ')} play it out with ${e.hp} heart` : `Pari al primo posto: ${e.chi.map(i => NM(i)).join(' e ')} se la giocano con ${e.hp} cuore`);
  momento(5, 'combo', `${en ? 'Tiebreak' : 'Spareggio'} ${e.n}: ${e.chi.map(i => nm(i)).join(' · ')}`);
  // gli altri restano fuori: si spengono
  for (const o of RANE) if (!e.chi.includes(o.i) && !o.ko) { o.ko = true; if (ST.p[o.i]) ST.p[o.i].vivo = false; tw(.6, k => { o.a = 1 - k; }); }
  await attendi(.5);
  // i pari tornano in campo (anche chi era andato KO): cadono dall'alto sulla loro ninfea
  await Promise.all(e.chi.map(async (i, j) => { const o = RANE[i], p = (e.pos || {})[String(i)]; if (!o) return;
    await attendi(j * .18); if (p) { o.x = p[0]; o.y = p[1]; } o.ko = false; o.spin = 0; o.tiltX = o.tiltZ = 0; o.sq = 1; o.stato = 'volo';
    if (ST.p[i]) { ST.p[i].vivo = true; ST.p[i].hp = e.hp; ST.p[i].x = o.x; ST.p[i].y = o.y; }
    o.alt = 7; o.a = 1; await tw(.4, k => { o.alt = 7 * (1 - k * k); }); o.alt = 0; o.stato = 'idle'; atterra(o);
    const v = o.root.position.clone().add(mondo.position); v.y = .15; anello(v, 0xffd23f, 2.2, .6); }));
  hud(); aggiornaCampo(); sparAggiorna({n: e.n, chi: e.chi, max: e.max, fine: null}, false);
  bannerVia(`${en ? 'TIEBREAK' : 'SPAREGGIO'} ${e.n}/${e.max}: ${en ? 'up to' : 'al massimo'} ${e.turni} ${en ? 'turns' : 'turni'}`, 'linear-gradient(90deg,#b8860b,#ffd23f)', 2.4);
  await attendi(.8);
}
async function sorteggioScena(e) {
  const en = OPZ.lang === 'en';
  sigla('combo'); lampo('#ffffff', .3); pubblico(1, true);
  boom(en ? 'DRAW' : 'SORTEGGIO', en ? `${nm(e.vince)} wins` : `vince ${nm(e.vince)}`, '#ffd23f');
  cap(en ? `Still tied after the tiebreaks: the seed draws ${NM(e.vince)}` : `Ancora pari dopo gli spareggi: il seme sorteggia ${NM(e.vince)}`);
  momento(5, 'combo', `${en ? 'Draw' : 'Sorteggio'}: ${nm(e.vince)}`);
  await attendi(1.4);
}
function momento(peso, icona, testo) { testo = concorda(testo); MOMENTI.push({peso, icona, testo, turno: ST ? ST.turno : 0}); }
async function koMomento(ko, buchi) {
  cinema(true); vignetta(.6); setTimeout(() => cinema(false), 2600);
  const rimonta = ko.map(e => e.da).filter(d => d != null && ST.p[d] && ST.p[d].vivo && ST.p[d].hp === 1)[0];
  suono('ko'); vibra(200, true); pubblico(1.2, true, true); lampo('#ff4d5e', .35); sigla('ko');
  const o0 = RANE[ko[0].sg]; primoPiano(o0.x, o0.y, 15, .55); rallenta(.35, .12, .7, .3);
  const titolo = ko.length >= 3 ? (OPZ.lang === 'en' ? 'TRIPLE KO!' : 'TRIPLO KO!') : ko.length === 2 ? (OPZ.lang === 'en' ? 'DOUBLE KO!' : 'DOPPIO KO!') : 'KO!';
  const autori = [...new Set(ko.map(e => e.da).filter(d => d != null))];
  for (const e of ko) momento(e.da != null ? 4 : 2, 'ko', e.da != null ? `${nm(e.da)} ${OPZ.lang === 'en' ? 'knocks out' : 'manda KO'} ${nm(e.sg)}` : `${nm(e.sg)} ${OPZ.lang === 'en' ? 'falls out' : 'cade fuori'}`);
  duck(1.6);
  for (const a of autori) { STAT[a] = STAT[a] || {d: 0, k: 0, g: 0}; STAT[a].k += ko.filter(e => e.da === a).length; }
  boom(titolo, ko.map(e => nm(e.sg)).join(' · ') + (autori.length === 1 ? (OPZ.lang === 'en' ? ` by ${nm(autori[0])}` : ` da ${nm(autori[0])}`) : ''), '#ff4d5e');
  schermo(titolo, ko.map(e => nm(e.sg)).join(' · '), '#ff4d5e'); coriandoli(50);
  cap(ko.map(e => `${NM(e.sg)} ${OPZ.lang === 'en' ? 'is out!' : 'è fuori!'}`).join(' '));
  for (const r of RANE) if (!r.ko && !ko.some(e => e.sg === r.i)) {
    const vicino = ko.some(e => { const v = RANE[e.sg]; return v && Math.max(Math.abs(v.x - r.x), Math.abs(v.y - r.y)) <= 2; });
    if (vicino) { r.posaF = 'hit'; r.posaT = .5; r.jv = (r.jv || 0) - 1.8; r.guardaP = RANE[ko[0].sg].root.getWorldPosition(new THREE.Vector3()); setTimeout(() => { r.festa = 1; }, 550); setTimeout(() => { r.festa = 0; }, 1700); }
    else { r.festa = 1; setTimeout(() => { r.festa = 0; }, 1200); } }
  coriandoli(0);
  for (const a of autori) if (RANE[a]) RANE[a].sfotto = 1.4;
  await Promise.all(ko.map(async e => {
    const o = RANE[e.sg]; o.ko = true; ST.p[e.sg].vivo = false; hud();
    const bu = (buchi || []).find(b => b.sg === e.sg), c = bu && CELLE[bu.x] && CELLE[bu.x][bu.y];
    // la piattaforma trema e si crepa, poi cade insieme al concorrente
    o.paura = 1; if (c) { c.userData.trema = .9; c.userData.peri.material.opacity = .9; c.userData.mat.emissive.set(0xff2d45).multiplyScalar(.5); }
    await attendi(.35); o.paura = 0; o.sbraccia = 1.4;
    if (c) { const v = c.position.clone().add(mondo.position); detriti(v, 8, 0x2f6a3a, .6); spruzzo(v, .8); suono('splash', .9); }
    setTimeout(() => { GORGO_LAMPO = 1; }, 700);
    await tw(.85, k => { o.alt = -k * k * 9; o.tiltZ = k * 3; o.spin = k * 8; o.a = 1 - Math.max(0, k - .75) / .25;
      if (c) { c.position.y = -k * k * 9; c.userData.corpo.rotation.z = k * 1.2; c.userData.corpo.rotation.x = k * .5; } });
    if (bu) { ST.campo[bu.x][bu.y] = 'buco'; if (c) { c.position.y = 0; c.userData.corpo.rotation.set(0, 0, 0); } aggiornaCampo(); if (c) anello(c.position.clone().add(mondo.position), 0xff5a2a, 1.2, .5); }
  }));
  if (rimonta != null) { await attendi(.2); boom(OPZ.lang === 'en' ? 'COMEBACK!' : 'RIMONTA!', `${nm(rimonta)} · 1 ♥`, '#ffd23f'); sigla('combo'); pubblico(1, true); momento(5, 'combo', `${OPZ.lang === 'en' ? 'Comeback' : 'Rimonta'}: ${nm(rimonta)}`); await attendi(.9); }
  const vivi = ST.p.filter(q => q.vivo).length;
  if (vivi === 2 && !DUELLO) { DUELLO = true; TEMPO = 132; await attendi(.3); const [a, b] = ST.p.map((q, i) => i).filter(i => ST.p[i].vivo);
    bannerVia(`${OPZ.lang === 'en' ? 'Head to head' : 'Testa a testa'}: ${NM(a)} · ${NM(b)}`, 'linear-gradient(90deg,#c98a14,#ffd23f)', 2.2); sigla('voto'); schermo(OPZ.lang === 'en' ? 'FINAL DUEL' : 'DUELLO FINALE', `${nm(a)} · ${nm(b)}`, '#ffd23f'); }
  await tornaVista(.4); await attendi(.1);
}
function applica(s) {
  const prima = RANE.map(o => o.gelo), primaQ = ST ? ST.p.map(q => Object.assign({}, q)) : [];
  SCORSI = 0; for (const o of RANE) o.bollaOn = false;
  ST = Object.assign(ST || {}, s); EVENTO = ST.evento; pannelloArrivo();
  ST.p.forEach((q, i) => { const o = RANE[i]; if (!o) return; o.x = q.x; o.y = q.y; o.alt = 0; o.kx = o.kz = 0; o.spin = 0; o.tiltX = o.tiltZ = 0; o.sq = 1; o.a = q.vivo ? 1 : 0; o.ko = !q.vivo; o.sbraccia = 0; o.paura = 0;
    o.gelo = !!q.gelo; if (prima[i] && !o.gelo) frantuma(o); if (!o.gelo && o.cristalli) frantuma(o); o.stato = 'idle'; });
  ST.p.forEach((q, i) => { const a = primaQ[i], o = RANE[i]; if (!a || !o || !q.vivo) return;
    if (a.molla > q.molla && !OPZ.rm) { const v = o.root.position.clone().add(mondo.position); v.y = .2; anello(v, 0x5be08a, 1.2, .4); }
    if (a.specchio && !q.specchio) detriti(o.root.position.clone().add(mondo.position).add(new THREE.Vector3(0, 1, 0)), 6, 0xd6def0, .5, GEO.coccio); });
  hud(); aggiornaCampo(); mostraEvento(); sparAggiorna(ST.spareggio, false);   // UNICO_1711
}
async function avvia(v) {
  ST = v; IO = v.io != null ? v.io : -1; NOMI = v.nomi; W = v.W; H = v.H; EVENTO = v.evento; LEZIONE = !!v.lezione; SCORSI = 0; for (const k in STAT) delete STAT[k]; MIGLIORE = null; MOMENTI = []; DUELLO = false; TEMPO = 104; inizio.ultima = false;
  for (const o of RANE) mondo.remove(o.root); RANE.length = 0; CAMT = null; for (const m of CATENA) m.visible = false;
  for (const p of PODIO) scena.remove(p); PODIO.length = 0;
  costruisci();
  SPAR = null; sparAggiorna(v.spareggio, true);   // UNICO_1711: il rientro durante uno spareggio
  v.p.forEach((q, i) => { const o = nuovoBot(i); o.x = q.x; o.y = q.y; o.a = 0; });
  document.body.classList.remove('menu'); chip(); layout(); etichettaArrivo(); pannelloArrivo(); aggiornaCampo();
  velo(false);
  await entrata();
  if (v.fase === 'scegli' && v.m) { MOSSE = v.m; MOSSE_AB = v.m_ab || []; INFO = v; inizio({scade: v.t + v.resta, durata: v.resta, turno: v.turno}); }
}
function fineLezione() {
  FASE = 'fine'; $('bot').classList.add('via'); $('lezc').classList.add('nasc'); $('fase').classList.remove('on'); scrivi('lez', '1');
  boom(L().lezFine.toUpperCase(), null, '#ffd23f'); coriandoli(80); sigla('vince'); pubblico(1, true);
  $('f-vinc').innerHTML = `<img src="assets_bayou/pg/${(ST && ST.p[IO] && ST.p[IO].pg) || OPZ.pg}_win.webp" alt=""><div class="tt"><div class="logo">${L().lezFine}</div></div>`; $('f-sot').innerHTML = L().lezFineSot; $('cl').innerHTML = '';
  $('f-lobby').textContent = L().lobby; $('f-ok').textContent = L().gioca; $('f-ok').dataset.dopoLez = '1';
  setTimeout(() => $('fine').classList.remove('nasc'), 1800);
}
/* ---------------- COME SI GIOCA: una schermata illustrata ---------------- */
const COME = {
 it: ['Come si gioca', [['Tutti saltano insieme', 'Ognuno sceglie in segreto una ninfea accesa (fino a 2 caselle). Poi saltano tutti nello stesso momento.'],
  ['Poteri e trappole', 'Atterri su una ninfea col simbolo e scatta: la targa dice dove (linea, croce, attorno). Le targhe rosse coi bordi gialli sono TRAPPOLE: fauci (-1) e pantano (fermo un turno). Evitale e spingi gli avversari nelle trappole.'],
  ['Scontri e spinte', 'In due sulla stessa ninfea: rimbalzate, -1 a testa. Su chi è rimasto fermo: lo spingi via.'],
  ['Stati', 'Conchiglia, lucciole, melma, bolla specchio, cardo: le icone sopra la testa dicono quanti colpi o turni restano.'],
  ['Rosso = affonda', 'La corrente porta tutto verso la cascata: le ninfee rosse affondano a fine turno. Chi va KO lascia un gorgo.'],
  ['Vince l\'ultimo', '4 cuori a testa. Chi cade in acqua perde un cuore. Resta all\'asciutto per ultimo e vinci.']]],
 en: ['How to play', [['Everyone jumps at once', 'Each player secretly picks a lit lily pad (up to 2 tiles). Then everyone jumps at the same moment.'],
  ['Powers and traps', 'Land on a pad with a symbol and it fires: the plate shows where (line, cross, around). Red plates with yellow rims are TRAPS: snapper (-1) and bog (stuck a turn). Avoid them and shove your opponents into them.'],
  ['Clashes and shoves', 'Two on the same pad bounce back, -1 each. Land on someone who stayed put and you push them.'],
  ['Statuses', 'Shell, fireflies, mud, mirror bubble, burr: the icons over the head show how many hits or turns are left.'],
  ['Red = sinks', 'The current carries everything to the waterfall: red pads sink at the end of the turn. A KO leaves a whirlpool.'],
  ['Last one standing', '4 hearts each. Fall in the water and lose one. Be the last one dry to win.']]]};
function disegnaRegola(g, k) {
  const W0 = 240, H0 = 120, cx = (c, r) => [24 + c * 38, 22 + r * 38];
  g.clearRect(0, 0, W0, H0);
  const tile = (c, r, col, bordo) => { const [x, y] = cx(c, r); g.fillStyle = col || '#262c40'; g.beginPath(); g.roundRect ? g.roundRect(x - 15, y - 15, 30, 30, 6) : g.rect(x - 15, y - 15, 30, 30); g.fill(); if (bordo) { g.lineWidth = 2.5; g.strokeStyle = bordo; g.stroke(); } };
  const bot = (c, r, col, dx, dy) => { const [x, y] = cx(c, r); g.fillStyle = col; g.beginPath(); g.arc(x + (dx || 0), y - 4 + (dy || 0), 10, 0, 6.28); g.fill(); g.fillStyle = '#2a1f4a'; g.fillRect(x - 6 + (dx || 0), y - 20 + (dy || 0), 12, 8); };
  const arco = (a, b, col) => { const [x1, y1] = cx(...a), [x2, y2] = cx(...b); g.strokeStyle = col || '#fff'; g.setLineDash([4, 4]); g.lineWidth = 2.5; g.beginPath(); g.moveTo(x1, y1 - 10); g.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - 34, x2, y2 - 12); g.stroke(); g.setLineDash([]); };
  const disco = (c, r, t) => { const [x, y] = cx(c, r); simbolo(g, t, x, y, 12); };
  for (let c = 0; c < 6; c++) for (let r = 0; r < 3; r++) tile(c, r);
  if (k === 0) { tile(2, 0, '#3a4a78', '#fff'); tile(4, 2, '#3a4a78', '#fff'); bot(0, 1, '#b3a6ff'); bot(5, 1, '#ff9a52'); arco([0, 1], [2, 0]); arco([5, 1], [4, 2]); }
  if (k === 1) { disco(1, 1, 'riga'); const [, y] = cx(0, 1); g.strokeStyle = '#ff2d45'; g.lineWidth = 6; g.globalAlpha = .8; g.beginPath(); g.moveTo(10, y); g.lineTo(230, y); g.stroke(); g.globalAlpha = 1; bot(1, 1, '#b3a6ff'); bot(4, 1, '#ff9a52'); disco(3, 0, 'bomba'); disco(5, 2, 'scudo'); }
  if (k === 2) { bot(1, 1, '#b3a6ff', -6); bot(1, 1, '#ff9a52', 6); g.fillStyle = '#ffd23f'; g.font = `900 18px ${FT}`; g.fillText('-1', 32, 20); bot(4, 1, '#58d6a8'); arco([3, 2], [4, 1], '#ffd23f'); g.strokeStyle = '#fff'; g.lineWidth = 3; const [x, y] = cx(4, 1); g.beginPath(); g.moveTo(x + 14, y); g.lineTo(x + 30, y); g.stroke(); }
  if (k === 3) { bot(1, 1, '#b3a6ff'); const [x, y] = cx(1, 1); g.strokeStyle = '#ffd76a'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y - 6, 17, 0, 6.28); g.stroke(); iconaStato(g, 'scudo', x + 26, y - 26, 9);
    bot(4, 1, '#ff9a52'); const [x2, y2] = cx(4, 1); iconaStato(g, 'patata', x2 + 22, y2 - 26, 9); g.fillStyle = '#fff'; g.font = `800 13px ${FT}`; g.fillText('2', x2 + 34, y2 - 21); }
  if (k === 4) { for (let r = 0; r < 3; r++) { const [x, y] = cx(0, r); g.fillStyle = '#4a0a14'; g.fillRect(x - 15, y - 15, 30, 30); g.strokeStyle = '#ff2d45'; g.lineWidth = 3; for (let d = -30; d < 30; d += 10) { g.beginPath(); g.moveTo(x - 15 + Math.max(0, d), y - 15 + Math.max(0, -d)); g.lineTo(x + 15 + Math.min(0, d), y + 15 + Math.min(0, -d)); g.stroke(); } }
    const [x, y] = cx(3, 1); g.fillStyle = '#020106'; g.fillRect(x - 15, y - 15, 30, 30); g.strokeStyle = '#ff5a2a'; g.lineWidth = 3; g.strokeRect(x - 15, y - 15, 30, 30); bot(5, 0, '#58d6a8'); g.fillStyle = '#ff2d45'; g.font = `900 16px ${FT}`; g.fillText('!', 20, 14); }
  if (k === 5) { bot(2, 1, '#ffd23f'); const [x, y] = cx(2, 1); iconaStato(g, 'capo', x, y - 30, 10); for (let h = 0; h < 4; h++) { g.fillStyle = '#ff5a6e'; g.beginPath(); const hx = 120 + h * 22, hy = 58; g.moveTo(hx, hy + 8); g.bezierCurveTo(hx - 12, hy - 1, hx - 6, hy - 11, hx, hy - 4); g.bezierCurveTo(hx + 6, hy - 11, hx + 12, hy - 1, hx, hy + 8); g.fill(); } }
}
function apriCome() {
  const C = COME[OPZ.lang] || COME.it; $('c-t').textContent = C[0];
  $('c-r').innerHTML = C[1].map(([t, x], k) => `<div><canvas width="480" height="240" data-k="${k}"></canvas><b>${t}</b>${x}</div>`).join('');
  document.querySelectorAll('#c-r canvas').forEach(c => { const g = c.getContext('2d'); g.scale(2, 2); disegnaRegola(g, +c.dataset.k); });
  $('c-leg').textContent = OPZ.lang === 'en' ? 'All symbols' : 'Tutti i simboli'; $('c-lez').textContent = L().lezione; $('c-ok').textContent = L().ok;
  $('come').classList.remove('nasc');
}
$('c-ok').onclick = () => $('come').classList.add('nasc');
$('c-leg').onclick = () => { $('come').classList.add('nasc'); apriLegenda(0); };
$('c-lez').onclick = () => { $('come').classList.add('nasc'); ac(); GUARDA = false; Rete.nuova(true); };
/* ---------------- cerimonia finale ---------------- */
const PODIO = [];
async function cerimonia(cl) {
  const ordine = [].concat(...cl).slice(0, 3), posX = [0, -1.6, 1.6];
  const posto = {}; let pp = 0; for (const g of cl) { for (const i of g) posto[i] = pp; pp += g.length; }
  const alt = ordine.map(i => [1.6, 1.1, .7][Math.min(2, posto[i])]);
  const centro = new THREE.Vector3(FIT.l.x, 0, FIT.l.z);
  for (const r of CELLE) for (const c of r) tw(.4, t => { c.position.y = -t * t * 8; }).then(() => { c.visible = false; }); for (const c of ARRIVO) c.visible = false; etiArrivo.visible = false; corrente.visible = false; for (const m of CATENA) m.visible = false;
  for (let k = 0; k < ordine.length; k++) {
    const pk = Math.min(2, posto[ordine[k]]);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.78, .9, alt[k], 28), new THREE.MeshStandardMaterial({color: [0x8a6a3a, 0x6f6a5a, 0x7a5232][pk], roughness: .85, metalness: 0, emissive: [0x3a2a00, 0x141a14, 0x2a1408][pk]}));
    const cima = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, .06, 28), new THREE.MeshStandardMaterial({color: [0xffd23f, 0xd8e4e0, 0xe0965a][pk], emissive: [0x6a5000, 0x2a3430, 0x4a2008][pk], roughness: .4})); cima.position.y = alt[k] / 2; m.add(cima);
    m.position.set(centro.x + posX[k], -3, centro.z); scena.add(m); PODIO.push(m);
    const nt = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), new THREE.MeshBasicMaterial({map: badgeTex(String(pk + 1), ['#e0a000', '#8a9aa0', '#b0602a'][pk]), transparent: true})); nt.position.set(0, 0, .91); m.add(nt);
    tw(.5, t => { m.position.y = -3 + (3 + alt[k] / 2) * eo(t); });
  }
  await attendi(.55);
  ordine.forEach((i, k) => { const o = RANE[i], primo = posto[i] === 0; o.ko = false; o.a = 1; o.kx = o.kz = 0; o.alt = 0; o.stato = 'idle'; o.gelo = false; o.capogiro = 0;
    o.podio = new THREE.Vector3(centro.x + posX[k], alt[k], centro.z); o.festa = primo ? 1 : 0; o.triste = primo ? 0 : .6; o.sbraccia = 0; o.spin = 0; o.tiltZ = 0; });
  const vincitore = RANE[ordine[0]], pari = cl[0].length > 1;
  // trofeo
  const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector2(.08 + Math.sin(t * Math.PI) * .22 + (t > .85 ? .1 : 0), t * .55)); }
  // il premio dello stagno: la perla d'oro dentro il fiore di loto
  const coppa = new THREE.Group(); coppa.position.set(centro.x, alt[0] + 2.55, centro.z); scena.add(coppa); PODIO.push(coppa);
  { const perla = new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 16), new THREE.MeshStandardMaterial({color: 0xfff0c8, emissive: 0x8a6a20, roughness: .15, metalness: .3})); perla.position.y = .16; coppa.add(perla);
    for (let k = 0; k < 8; k++) { const pe = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8), new THREE.MeshStandardMaterial({color: k % 2 ? 0xff8fc0 : 0xffb6d8, emissive: 0x3a0a20, roughness: .5})); const a = k / 8 * 6.283; pe.scale.set(.45, .9, .3); pe.position.set(Math.cos(a) * .2, .1, Math.sin(a) * .2); pe.rotation.set(Math.sin(a) * .7, 0, -Math.cos(a) * .7); coppa.add(pe); } }
  coppa.visible = !pari; tw(3, t => { coppa.rotation.y = t * 12; });
  for (const r of RANE) if (!ordine.includes(r.i)) r.a = 0;
  CAMT = 'primo'; const p0 = CAMV.p.clone(), l0 = CAMV.l.clone(), dl = new THREE.Vector3(centro.x, ROT ? .7 : 1.9, centro.z), dp = dl.clone().add(ROT ? new THREE.Vector3(0, 3.6, 16) : new THREE.Vector3(0, 2.6, 12.5));   // sul telefono il podio sta nella meta' alta (sotto c'e' la scheda)
  tw(.8, k => { CAMV.p.lerpVectors(p0, dp, k); CAMV.l.lerpVectors(l0, dl, k); }, eio);
  // cannoni di coriandoli dai lati
  coriandoli(90, new THREE.Vector3(-7, 0, centro.z)); coriandoli(90, new THREE.Vector3(7, 0, centro.z)); coriandoli(120); pubblico(1.4, true); if (IO < 0 || ordine[0] === IO) sigla('vince');
  return vincitore;
}
// FINE PARTITA (passata «pro»): il vincitore grande in posa di vittoria sul podio, solo i numeri che contano, rivincita col conto alla rovescia
let RIVINCITA_T = null;
function fermaRivincita() { clearInterval(RIVINCITA_T); RIVINCITA_T = null; }
function fine(e) {
  FASE = 'fine'; $('esci').classList.remove('on'); $('bot').classList.add('via'); cap(null); MSG.ev = '';
  const cl = e.classifica || [], en = OPZ.lang === 'en', primo = cl[0] || [], pari = primo.length > 1, v0 = primo[0];
  const numeri = i => { const s = STAT[i] || {d: 0, k: 0, g: 0}; return L().stat(s.d, s.k, s.g); };
  const pgv = v0 != null && ST && ST.p[v0] ? ST.p[v0].pg : null;
  const titolo = pari ? `${L().pari}` : v0 === IO ? L().vinto : L().vince(nm(v0));
  $('f-vinc').innerHTML = (pgv && !GLBS[pgv] ? `<img src="assets_bayou/pg/${pgv}_win.webp" alt="">` : '') +
    `<div class="tt"><div class="logo">${titolo}</div><div class="chi">${pari ? primo.map(nm).join(en ? ' and ' : ' e ') : [nm(v0) !== PGN[pgv] ? PGN[pgv] : '', pgv ? ab(ABPG[pgv])[0] : ''].filter(Boolean).join(' · ')}</div>` +
    (!pari && numeri(v0) ? `<div class="num">${numeri(v0)}</div>` : '') + '</div>';
  // classifica dal secondo in giu': posto, foto, nome e solo i numeri non a zero
  let p = 1, h = '', rit = 0;
  for (const g of cl) { for (const i of g) { if (p > 1 || pari) h += `<li class="${p === 1 ? 'primo' : ''}" style="animation-delay:${rit}s"><span class="p">${p}</span><span class="av" style="background-image:url(${avatarURL(i)});box-shadow:0 0 0 2px ${COL[i]}"></span><span>${nm(i)}</span><span class="s">${numeri(i)}</span></li>`; rit += .1; } p += g.length; }
  $('cl').innerHTML = h;
  const mom = MOMENTI.slice().sort((a, b) => b.peso - a.peso || a.turno - b.turno).slice(0, 3).sort((a, b) => a.turno - b.turno);
  const ICO = {combo: '#ffd23f', ko: '#ff2d45', jackpot: '#ffd23f', patata: '#ff9a2e', specchio: '#bfefff'};
  $('f-sot').innerHTML = mom.length ? `<div class="mom"><h5>${en ? 'Highlights' : 'Momenti'}</h5>${mom.map(m => `<div><i style="background:${ICO[m.icona] || '#7fffe0'}"></i><span>${en ? 'T' : 'T'}${m.turno}</span>${m.testo}</div>`).join('')}</div>` : '';
  if (!pari) boom(en ? 'VICTORY!' : 'VITTORIA!', nm(v0), COL[v0]); else boom(L().pari.toUpperCase(), primo.map(nm).join(' · '));
  if (IO >= 0 && !primo.includes(IO)) setTimeout(() => sigla('sconfitta'), 900); if (pgv) setTimeout(() => voceRana(pgv, 1.2), 1400);
  if (cl.length) cerimonia(cl);
  $('f-lobby').textContent = L().lobby;
  // rivincita automatica dopo 10 s (Menu la ferma); nella lezione e da spettatore niente conto
  fermaRivincita(); let n = 10; const auto = !LEZIONE && !AUTO;   // nelle prove automatiche niente rivincita da sola
  const scrivi = () => { $('f-ok').innerHTML = L().rivincita + (auto ? `<span class="cd">${n}</span>` : ''); };
  scrivi();
  setTimeout(() => { $('fine').classList.remove('nasc'); if (auto && FASE === 'fine') RIVINCITA_T = setInterval(() => { n--; scrivi(); if (n <= 0) { fermaRivincita(); if (FASE === 'fine' && !$('fine').classList.contains('nasc')) $('f-ok').onclick(); } }, 1000); }, 2400);
}

/* ---------------- regia e rete ---------------- */
const CODA = [];
async function regia() {
  for (;;) {
    if (!CODA.length) { await sleep(.03); continue; }
    const e = CODA.shift();
    try {
      if (e.k === 'turno') { inizio(e); if (e.turno > 1) sigla('turno'); }
      else if (e.k === 'mosse') { MOSSE = e.m; MOSSE_AB = e.m_ab || []; INFO = e; bottoni(); aggiornaCampo(); if (AUTO) setTimeout(auto, 700 + Math.random() * 900); }
      else if (e.k === 'scelta') MIA = [e.x, e.y];
      else if (e.k === 'ha_scelto') { const c = $('ch' + e.sg); if (c) c.classList.add('scelto'); }
      else if (e.k === 'blocco') { const evs = []; for (;;) { if (!CODA.length) { await sleep(.03); continue; } const x = CODA.shift(); if (x.k === 'stato') { const g = setTimeout(() => { if (FASE === 'rivela') { console.warn('rivelazione lenta: accelero'); ACC = 6; SCALA = 1; FERMO = 0; } }, 16000); try { await rivela(evs, x); } finally { clearTimeout(g); ACC = 1; } break; } evs.push(x); } }
      else if (e.k === 'partita_finita') { if (LEZIONE) fineLezione(); else fine(e); }
    } catch (err) { console.error(err); }
  }
}
const Rete = {
  since: 0, on: false, primo: true, errori: 0,
  async poll() {
    for (;;) {
      if (this.on) {
        try {
          const s = await (await fetch('/api/s?since=' + this.since, {cache: 'no-store'})).json(); this.errori = 0;
          if (!s.nessuna) {
            SRV = performance.now() / 1000 - s.t; const f = s.feed || []; delete s.feed;
            if (this.primo) { this.primo = false; if (f.length) this.since = f[f.length - 1].s; await avvia(s); }
            else for (const e of f) { CODA.push(e); this.since = e.s; }
          }
        } catch (e) { if (++this.errori === 20) cap(OPZ.lang === 'en' ? 'Connection lost: retrying…' : 'Connessione persa: riprovo…'); }
      }
      await sleep(.1);
    }
  },
  async az(o) { try { await fetch('/api/azione', {method: 'POST', body: JSON.stringify(o)}); } catch (e) {} },
  async nuova(lez) {
    await velo(true);
    LEZIONE = !!lez; CODA.length = 0; togliAnteprima(); this.since = 0; this.primo = true; this.on = false; $('fine').classList.add('nasc'); $('lobby').classList.add('nasc');
    COL = OPZ.cb ? COLCB : COLN;
    await fetch('/api/nuova', {method: 'POST', body: JSON.stringify({pgs: Q.get('pgs') || undefined, v: 1, n: NGIOC, guarda: GUARDA ? 1 : 0, livello: OPZ.liv, pg: OPZ.pg, lezione: lez ? 1 : 0, scegli_s: OPZ.liv === 'facile' ? 9 : 6, seme: Q.get('seme') ? +Q.get('seme') : undefined})});
    this.on = true;
  }
};

/* ---------------- TRANSIZIONI, TITOLO, ANTEPRIMA ---------------- */
function velo(su) { const v = $('velo'); return new Promise(r => { v.classList.toggle('on', su); setTimeout(r, OPZ.rm ? 30 : 320); }); }
let ANTE = null;
function anteprima() {
  togliAnteprima(); IO = 0; NOMI = ['Tu']; ST = null;
  const o = nuovoBot(0, OPZ.pg); RANE.length = 0; o.x = 0; o.y = 0; o.a = 1;
  const ped = new THREE.Group();
  const cil = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, .3, 48), new THREE.MeshStandardMaterial({color: 0x4f9a55, roughness: .6, metalness: 0, emissive: 0x0a2a18}));
  const bordo = new THREE.Mesh(new THREE.TorusGeometry(1.16, .045, 8, 64), new THREE.MeshBasicMaterial({color: 0x7fffe0})); bordo.rotation.x = Math.PI / 2; bordo.position.y = .15;
  ped.add(cil); ped.add(bordo); ped.position.y = -.26; scena.add(ped);
  mondo.position.set(0, 0, 0); o.root.position.set(0, 0, 0); mondo.add(o.root);
  ANTE = {o, ped, t: 0, demo: 0};
  if (Q.get('fila') === '1') {    // tutte e sei le sagome, per il foglio di confronto
    const QPG = Q.get('varianti') ? [0, 1, 2, 3].map(() => Q.get('varianti')) : PGS;
    if (Q.get('varianti')) ST = {p: QPG.map(pg => ({pg}))};
    ped.visible = false; mondo.remove(o.root); NOMI = QPG.map(pg => ab(ABPG[pg])[0]); IO = -1; ANTE.fila = QPG.map((pg, k) => { const b = nuovoBot(k % 5, pg); RANE.length = 0; b.a = 1; b.x = b.y = 0; mondo.add(b.root);
      b.nome.material.map = testoTex(ab(ABPG[pg])[0], COL[k % 5], 256, 64, 38); b.nome.material.needsUpdate = true;
      b.podio = Q.get('riga') === '1' ? new THREE.Vector3((k - 2.5) * 1.95, 0, 0) : new THREE.Vector3((k % 3 - 1) * 2.4, 0, k < 3 ? -1.9 : 1.5); return b; });
  }
}
function togliAnteprima() { if (!ANTE) return; mondo.remove(ANTE.o.root); for (const b of ANTE.fila || []) mondo.remove(b.root); scena.remove(ANTE.ped); ANTE = null; }
function animaAnteprima(dt, tt) {
  if (!ANTE) return; const o = ANTE.o; ANTE.t += dt;
  if (ANTE.fila && Q.get('sagoma') === '1' && !ANTE.nero) {   // prova delle sagome: tutto nero su bianco, senza colori ne' facce
    ANTE.nero = true; AMB.visible = false; const nero = new THREE.MeshBasicMaterial({color: 0x000000}); scena.overrideMaterial = nero; renderer.setClearColor(0xffffff, 1); $('fondo').style.display = 'none';
    for (const c of scena.children) if (c !== mondo) c.visible = false; for (const c of mondo.children) c.visible = ANTE.fila.some(b => b.root === c);
    for (const b of ANTE.fila) b.root.traverse(m => { if (m.isSprite || m === b.om || m === b.an) m.visible = false; }); }
  if (ANTE.fila) { for (const b of ANTE.fila) { b.stato = 'idle'; animaBot(b, dt, tt); if (ANTE.nero) { for (const x of [b.nome, b.om, b.an, b.scudo, b.crepe, b.bolla, b.ghiaccio, b.stelle, b.mirino, b.molla, b.bomba, b.specchio, b.statiS]) x.visible = false; } } if (ANTE.t % 3 < dt * 1.5 && !ANTE.fermo) for (const b of ANTE.fila) usaPotere(b); CAMT = 'menu'; if (Q.get('riga') === '1') { for (const b of ANTE.fila) b.badge.visible = false; CAMV.l.set(0, Q.get('alto') === '1' ? .4 : .95, 0); CAMV.p.set(0, Q.get('alto') === '1' ? 11.2 : 2.1, Q.get('alto') === '1' ? 5.4 : 11.5); } else { CAMV.l.set(0, .7, 0); CAMV.p.set(0, Q.get('alto') === '1' ? 12.5 : 4.4, Q.get('alto') === '1' ? 10.5 : 13.5); } return; }
  // piedistallo girevole: il bot gira piano su se stesso e ogni tanto mostra l'abilita'
  o.podio = new THREE.Vector3(0, 0, 0); o.spin = 0; o.stato = 'idle'; animaBot(o, dt, tt);
  const fase0 = ANTE.t % 6.5, giro = fase0 < 2.4 ? eio(fase0 / 2.4) * 6.2832 : 0;
  o.root.rotation.y = Math.atan2(cam.position.x, cam.position.z) + giro;
  if (ANTE.t - ANTE.demo > 3.2) { ANTE.demo = ANTE.t; const ab0 = ABPG[OPZ.pg]; usaPotere(o);
    if (ab0 === 'superbalzo') tw(.7, k => { o.alt = Math.sin(k * Math.PI) * 1.6; });
    else if (ab0 === 'bolla') { o.bollaOn = true; setTimeout(() => { if (ANTE) ANTE.o.bollaOn = false; }, 1400); }
    else if (ab0 === 'panciata') tw(.6, k => { o.alt = Math.sin(k * Math.PI) * .9; o.sq = 1 - .3 * Math.sin(k * Math.PI); }).then(() => { if (ANTE) anello(new THREE.Vector3(0, .1, 0), 0x2f9bff, 2.5, .5); });
    else if (ab0 === 'lampo') { lampoLuce.position.set(0, 1.5, 0); lampoLuce.color.set(0xffffff); lampoLuce.intensity = 6; tw(.5, k => { lampoLuce.intensity = 6 * (1 - k); }); }
    else if (ab0 === 'nube') particelle(new THREE.Vector3(0, .6, 0), 16, 0x7be35a, 1.4, 1.1, {fumo: true, r: .6, g: -1, cresce: 1});
    else { o.emote = 'saluta'; o.emoteT = 0; } }
  const isP = isPC(); CAMT = 'menu';
  CAMV.l.set(isP ? 1.6 : 0, isP ? 1.2 : -2.9, 0); CAMV.p.set(isP ? 1.6 : 0, isP ? 2.6 : 2.2, isP ? 9.2 : 17);
}
// icona di ogni abilita' (la faccia del bot e' la stessa per tutti: il personaggio e' l'abilita')
function iconaAbil(g, a, sel) {
  const gr = g.createRadialGradient(36, 30, 4, 48, 48, 46); gr.addColorStop(0, sel ? '#a99cff' : '#3a3f5c'); gr.addColorStop(1, sel ? '#5b46d6' : '#1d2133');
  g.fillStyle = gr; g.beginPath(); g.arc(48, 48, 44, 0, 6.28); g.fill();
  const m = {panciata: 'onda', superbalzo: 'trampolino', bolla: 'scudo', lingua: 'calamita', lampo: 'gelo'}[a];
  if (m) glifo(g, m, 48, 48, 34);
  else { g.fillStyle = '#fff'; for (const [x, y, r] of [[36, 52, 13], [52, 44, 16], [64, 54, 12], [48, 58, 12]]) { g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill(); } }
}
/* ---------------- TITOLO (splash 17/11): il logo grande sopra lo stagno vivo; le sei rane 3D escono dall'acqua, stanno sulle ninfee
   e ogni tanto saltano su quelle libere (le altre le guardano). Al tocco: le rane si tuffano, la camera va sul protagonista, poi la lobby. ---------------- */
let TIT = null;
const TIT_NINFEE = [[0, 2], [-2.75, 1], [2.75, 1], [-1.75, -1.05], [1.8, -1], [.05, -3.9], [-3.25, -2.7], [3.25, -2.65]];   // splash2: piu' larghe, la fila dietro sta nei varchi (Grumo copriva Tonfo)
const titVerso = (A, B) => { const c = Math.atan2(cam.position.x - A.x, cam.position.z - A.z), s = Math.atan2(B.x - A.x, B.z - A.z), d = ((s - c) % 6.2832 + 9.4248) % 6.2832 - 3.1416; return c + Math.max(-1, Math.min(1, d)); };   // guarda verso il salto ma mai di spalle alla camera: niente mezzo giro al decollo e all'atterraggio   // 0 = il protagonista, davanti; le ultime due restano libere per i salti
const titInv = (X, Z) => ROT ? [-Z / PZ + (W - 1) / 2, X / P + (H - 1) / 2] : [X / P + (W - 1) / 2, Z / PZ + (H - 1) / 2];   // l'inverso di pos(): animaBot vuole x,y di griglia
function titoloQuadro() {
  const w = innerWidth, h = innerHeight, oriz = w > h * 1.15, basso = oriz && h < 560, q = basso ? 'basso' : oriz ? 'oriz' : 'vert';
  $('titolo').dataset.q = q; TIT.w = w; TIT.h = h;
  const box = q === 'basso' ? {x0: w * .48, x1: w * .99, y0: h * .1, y1: h * .96} : q === 'oriz' ? {x0: w * .14, x1: w * .86, y0: h * .43, y1: h * .8} : {x0: w * .04, x1: w * .96, y0: h * .42, y1: h * .83};
  const bw = box.x1 - box.x0, bh = box.y1 - box.y0; TIT.sx = q === 'vert' ? .84 : Math.max(1, Math.min(1.7, bw / bh / 1.15)); TIT.el = q === 'vert' ? .45 : .43;   /* splash2: un po' piu' dall'alto, cosi' la fila dietro spunta sopra quella davanti */   // dritto: gruppo piu' stretto, rane piu' grandi
  for (const n of TIT.nin) n.c.position.set(n.x * TIT.sx, 0, n.z);
  const pts = []; for (const n of TIT.nin.slice(0, 6)) for (const [dx, y] of [[-1.05, 0], [1.05, 0], [0, 2.3]]) pts.push(new THREE.Vector3(n.x * TIT.sx + dx, y, n.z));
  TIT.L = new THREE.Vector3(0, .85, 0); cam.clearViewOffset();
  const metti = d => { cam.position.set(0, TIT.L.y + Math.sin(TIT.el) * d, Math.cos(TIT.el) * d); cam.lookAt(TIT.L); cam.updateMatrixWorld(); };
  const misura = () => { let a = 1e9, b = -1e9, c = 1e9, e = -1e9; for (const v of pts) { const p = v.clone().project(cam); a = Math.min(a, p.x); b = Math.max(b, p.x); c = Math.min(c, p.y); e = Math.max(e, p.y); } return {x0: (a + 1) / 2 * w, x1: (b + 1) / 2 * w, y0: (1 - e) / 2 * h, y1: (1 - c) / 2 * h}; };
  let lo = 4, hi = 80; for (let k = 0; k < 24; k++) { const d = (lo + hi) / 2; metti(d); const m = misura(); if (m.x1 - m.x0 > bw || m.y1 - m.y0 > bh) lo = d; else hi = d; }
  TIT.d = hi; metti(hi); const m = misura(); TIT.ox = (m.x0 + m.x1) / 2 - (box.x0 + box.x1) / 2; TIT.oy = (m.y0 + m.y1) / 2 - (box.y0 + box.y1) / 2;
}
function titolo() {
  const t = $('titolo'); t.classList.remove('nasc', 'esce');
  const en = OPZ.lang === 'en', pc = matchMedia('(hover:hover) and (pointer:fine)').matches;
  $('t-sot').textContent = en ? 'Pond brawl' : 'Rane in rissa';
  $('t-gioca').textContent = en ? (pc ? 'Click to play' : 'Tap to play') : (pc ? 'Clicca per giocare' : 'Tocca per giocare');
  try { titolo3D(); } catch (e) { console.warn('titolo3D', e); togliTitolo(); }
  t.onclick = () => titoloEsci();
  t.onpointermove = e => { if (TIT) { TIT.mx = e.clientX / innerWidth * 2 - 1; TIT.my = e.clientY / innerHeight * 2 - 1; } };
  titolo.tasto = e => { if ((e.key === 'Enter' || e.key === ' ') && !t.classList.contains('nasc')) { e.preventDefault(); titoloEsci(); } }; addEventListener('keydown', titolo.tasto);
}
function titolo3D() {
  togliAnteprima(); for (const o of RANE) mondo.remove(o.root); RANE.length = 0;
  for (const r of CELLE) for (const c of r) c.visible = false; for (const c of ARRIVO) c.visible = false; corrente.visible = false; etiArrivo.visible = false; for (const m of CATENA) m.visible = false;
  mondo.position.set(0, 0, 0); IO = -1; ST = null; NOMI = PGS.map(p => PGN[p]);
  // lo stagno si dispone attorno alla griglia; all'uscita torna esattamente com'era (la lobby non deve cambiare)
  const foto = {o: [cascata, schiuma, nebbiolina, lucciole].map(m => [m, m.position.clone(), m.quaternion.clone(), m.scale.clone()]), im: [contorno, canne].map(m => [m, m.instanceMatrix.array.slice()]), v: [STAGNO.e, STAGNO.d, acqua.material.uniforms.c.value, cascata.material.uniforms.dim.value].map(v => [v, v.clone()])};
  posStagno();
  TIT = {t: 0, prossimo: 2.6, emote: 1.2, mx: 0, my: 0, px: 0, py: 0, yaw: 0, zoom: 0, esce: false, foto, nascosti: [cascata, schiuma, nebbiolina, canne].filter(m => m.visible)};
  for (const m of TIT.nascosti) m.visible = false;   // la cascata sta sul bordo della griglia: nel quadro del titolo sarebbe una striscia a meta' schermo
  TIT.nin = TIT_NINFEE.map(([x, z]) => { const c = nuovaCella(true); tinta(c, null, false, false, 0); return {c, x, z, chi: null}; });
  const ordine = [OPZ.pg, ...['axa', 'luma', 'camu', 'zip', 'grumo', 'tonfo'].filter(p => p !== OPZ.pg && PGS.includes(p))];   // le piccole davanti ai lati, le grosse dietro
  TIT.rane = ordine.map((pg, k) => { const o = nuovoBot(k % 5, pg); RANE.pop(); o.ninfea = k; TIT.nin[k].chi = o; o.vola = null; return o; });
  titoloQuadro();
  // entrata: escono dall'acqua uno dopo l'altro e atterrano sulla loro ninfea (il protagonista per ultimo)
  TIT.rane.forEach((o, k) => { const n = TIT.nin[o.ninfea], B = n.c.position.clone(), fuori = B.clone().setY(0).normalize().multiplyScalar(1.3); if (!fuori.lengthSq()) fuori.set(0, 0, 1.3);
    if (OPZ.rm) return; o.a = 0; o.inAcqua = true; o.vola = B.clone().add(fuori); o.alt = -1.2;
    setTimeout(async () => { if (!TIT || TIT.esce) return; const A = o.vola.clone(); o.a = 1; o.stato = 'volo'; o.direzione = titVerso(A, B); spruzzo(A, .55);
      await tw(.62, x => { o.vola.lerpVectors(A, B, x * x * (3 - 2 * x)); o.alt = -1.2 + 1.2 * x + 2.3 * Math.sin(x * Math.PI); o.sq = x < .25 ? .8 + x : 1.08; o.tiltX = -.3 * Math.sin(x * Math.PI); });
      if (TIT && !TIT.esce) titAtterra(o); }, 250 + (k ? (6 - k) : 6.6) * 150); });
}
function titAtterra(o) {
  const n = TIT.nin[o.ninfea]; o.vola = null; o.alt = 0; o.tiltX = 0; o.direzione = null; o.stato = 'atterra'; o.jv = (o.jv || 0) - 2.4; n.c.userData.dip = .24;
  tw(.32, k => { o.sq = .62 + .38 * ebk(k); }).then(() => { if (o.stato === 'atterra') o.stato = 'idle'; });
  const v = n.c.position.clone(); v.y = .25; particelle(v, 10, 0xd8fff4, 1.4, .45, {su: 1.1, r: .1, g: 6}); v.y = .06; anello(v, 0xbff6ea, 1.7, .5);
}
async function titSalta(o, k1) {
  const n0 = TIT.nin[o.ninfea], n1 = TIT.nin[k1]; n1.chi = o; n0.chi = null; o.ninfea = k1; o.emote = null; o.da = TIT.nin.indexOf(n0); (TIT.log = TIT.log || []).push([+TIT.t.toFixed(2), o.pg, TIT.nin.indexOf(n0), k1]);
  const A = n0.c.position.clone(), B = n1.c.position.clone(), hm = 1.1 + A.distanceTo(B) * .22;
  o.vola = A.clone();   // splash2 17/11: la ninfea cambia subito, quindi la rana va tenuta sulla vecchia anche mentre si accuccia (prima saltava gia' sulla nuova per 0,2 s e poi tornava indietro)
  o.stato = 'carica'; await tw(.2, k => { o.sq = 1 - .3 * eo(k); o.tiltX = .3 * k; }); if (!TIT || TIT.esce) return;
  o.stato = 'volo'; o.direzione = titVerso(A, B); n0.c.userData.dip = .12;
  for (const r of TIT.rane) if (r !== o && Math.random() < .8) r.guardaP = o.root.position;   // le altre seguono il salto con la testa
  await tw(.58, k => { o.vola.lerpVectors(A, B, k * k * (3 - 2 * k)); o.alt = hm * (1 - Math.pow(Math.abs(2 * k - 1), 2.4)); o.sq = k < .2 ? .72 + 2.2 * k : k > .85 ? 1.12 - (k - .85) * 1.4 : 1.12 - .1 * Math.sin((k - .2) / .65 * Math.PI); o.tiltX = -.35 * Math.sin(k * Math.PI); });
  if (!TIT || TIT.esce) return; titAtterra(o); if (Math.random() < .35) setTimeout(() => { if (TIT && o.stato === 'idle') { o.festa = 1; setTimeout(() => { o.festa = 0; }, 1100); } }, 350);
  setTimeout(() => { if (TIT) for (const r of TIT.rane) if (r.guardaP === o.root.position) r.guardaP = null; }, 900);
}
async function titTuffo(o, k) {   // all'uscita: giu' in acqua, verso fuori
  const A = TIT.nin[o.ninfea].c.position.clone(), fuori = A.clone().setY(0).normalize(), B = A.clone().add(fuori.multiplyScalar(1.5)); o.emote = null;
  o.stato = 'volo'; o.direzione = titVerso(A, B); o.vola = A.clone(); TIT.nin[o.ninfea].c.userData.dip = .15;
  await tw(.55 + k * .03, x => { if (o.vola) o.vola.lerpVectors(A, B, x); o.alt = 1.1 * Math.sin(x * Math.PI * .8) - 2.2 * x * x; o.tiltX = .5 * x; });
  o.a = 0;
}
async function titoloEsci() {
  const t = $('titolo'); if (t.classList.contains('esce')) return; t.classList.add('esce'); removeEventListener('keydown', titolo.tasto);
  ac(); suono('salto'); sigla('turno');
  if (TIT && !OPZ.rm) { TIT.esce = true; const eroe = TIT.rane[0]; eroe.festa = 1.2; eroe.vola = null; eroe.alt = 0;
    TIT.rane.slice(1).forEach((o, k) => setTimeout(() => { if (TIT && o.a > .5) titTuffo(o, k); }, 40 + k * 75));
    await tw(.7, k => { if (TIT) TIT.zoom = eio(k); }); }
  await velo(true); togliTitolo(); t.classList.add('nasc'); t.classList.remove('esce'); lobby(); velo(false);
}
function togliTitolo() {
  if (!TIT) return; for (const o of TIT.rane || []) mondo.remove(o.root); for (const n of TIT.nin || []) mondo.remove(n.c);
  for (const m of TIT.nascosti) m.visible = true;
  const f = TIT.foto; for (const [m, p, q, s] of f.o) { m.position.copy(p); m.quaternion.copy(q); m.scale.copy(s); } for (const [m, a] of f.im) { m.instanceMatrix.array.set(a); m.instanceMatrix.needsUpdate = true; } for (const [v, c] of f.v) v.copy(c);
  TIT = null; CAMT = null; cam.clearViewOffset();
}
function animaTitolo(dt, tt) {
  if (!TIT || !TIT.rane) return; TIT.t += dt; CAMT = 'titolo';
  if (TIT.w !== innerWidth || TIT.h !== innerHeight) titoloQuadro();
  // salti sulle ninfee libere e qualche saluto
  if (!TIT.esce && !OPZ.rm) {
    TIT.prossimo -= dt; if (TIT.prossimo <= 0) { TIT.prossimo = 1.5 + Math.random() * 1.3;
      const liberi = TIT.rane.filter(o => o.stato === 'idle' && !o.vola && o.a > .5 && o !== TIT.ultimo);
      const o = liberi[Math.floor(Math.random() * liberi.length)];
      if (o) { const n0 = TIT.nin[o.ninfea], vuote = TIT.nin.map((n, k) => [n, k]).filter(([n]) => !n.chi).map(([n, k]) => [k, n.c.position.distanceTo(n0.c.position)]).filter(([, d]) => d < 4.6).sort((a, b) => a[1] - b[1]);
        if (vuote.length) { TIT.ultimo = o; titSalta(o, vuote[Math.random() < .7 ? 0 : vuote.length - 1][0]); } } }
    TIT.emote -= dt; if (TIT.emote <= 0) { TIT.emote = 2.2 + Math.random() * 2; const f = TIT.rane.filter(o => o.stato === 'idle' && !o.emote && !o.vola); const o = f[Math.floor(Math.random() * f.length)]; if (o) { o.emote = ['saluta', 'salto', 'saluta'][Math.floor(Math.random() * 3)]; /* splash2: niente 'giro' */ o.emoteT = 0; } } }
  // ninfee che galleggiano
  for (const n of TIT.nin) { const u = n.c.userData; u.dip *= Math.pow(.02, dt); n.y = Math.sin(tt * 1.2 + u.bob) * .05 - u.dip; u.corpo.position.y = n.y; }
  for (const o of TIT.rane) {
    const n = TIT.nin[o.ninfea], P0 = o.vola || n.c.position, xy = titInv(P0.x, P0.z); o.x = xy[0]; o.y = xy[1];
    animaBot(o, dt, tt); o.badge.visible = false; o.an.visible = false; o.statiS.visible = false;
    if (!o.vola) o.root.position.y += n.y; else if (o.stato === 'carica' && o.da != null) o.root.position.y += TIT.nin[o.da].y;   // accucciata: segue ancora la ninfea da cui parte
    if (Q.get('traccia_tit') === '1' && (TIT.traccia = TIT.traccia || []).length < 60000) TIT.traccia.push([+TIT.t.toFixed(3), o.pg, +o.root.position.x.toFixed(3), +o.root.position.y.toFixed(3), +o.root.position.z.toFixed(3), +(o.root.rotation.y * 57.3).toFixed(1), o.stato, o.glb ? o.glb.ora : '']);
  }
  // camera: un respiro lento, un filo di parallasse col puntatore; all'uscita si avvicina al protagonista
  const k = 1 - Math.exp(-dt * 3); TIT.px += (TIT.mx - TIT.px) * k; TIT.py += (TIT.my - TIT.py) * k;
  TIT.yaw = OPZ.rm ? 0 : Math.sin(TIT.t * .16) * .07 + TIT.px * .07;
  const z = TIT.zoom, eroe = TIT.rane[0].root.position, L = TIT.L.clone().lerp(new THREE.Vector3(eroe.x, 1.05, eroe.z), z), d = TIT.d * (1 - .5 * z), el = TIT.el + (OPZ.rm ? 0 : TIT.py * .03) - .08 * z;
  CAMV.l.copy(L); CAMV.p.set(L.x + Math.sin(TIT.yaw) * Math.cos(el) * d, L.y + Math.sin(el) * d, L.z + Math.cos(TIT.yaw) * Math.cos(el) * d);
  cam.setViewOffset(innerWidth, innerHeight, TIT.ox * (1 - z), TIT.oy * (1 - z), innerWidth, innerHeight);
}

/* ---------------- LOBBY ---------------- */
function lobby() {
  const L0 = L();
  $('l-sot').innerHTML = L0.sot; $('l-n').textContent = L0.conc; $('l-liv').textContent = L0.bot; $('l-opz').textContent = L0.opz;
  $('b-lez').textContent = L0.lezione; $('b-lez').classList.toggle('g', leggi('lez', '0') === '1'); $('b-gioca').classList.toggle('g', leggi('lez', '0') !== '1');
  $('esci').textContent = OPZ.lang === 'en' ? 'Leave' : 'Esci'; $('b-come').textContent = L0.come; $('b-gioca').textContent = L0.gioca; $('b-guarda').textContent = L0.guarda; $('b-var').textContent = L0.altre;
  $('t-arr').textContent = L0.arr; $('t-com').textContent = L0.com; $('tasti').innerHTML = L0.tasti.map(x => `<div>${x}</div>`).join('');
  $('l-pg').innerHTML = PGS.map((p, k) => `<div class="pgc ${p === OPZ.pg ? 'sel' : ''}" data-p="${p}" style="--c:${COL[k % 5]}"><img class="im" src="assets_bayou/ritratti/${p}_${p === OPZ.pg ? 'win' : 'idle'}.webp" onerror="this.onerror=null;this.src='assets_bayou/pg/${p}_${p === OPZ.pg ? 'win' : 'idle'}.webp'" alt=""><div class="n">${PGN[p]}</div><div class="ab">${ab(ABPG[p])[0]}</div><div class="a">${ab(ABPG[p])[1]}</div></div>`).join('');
  $('s-n').innerHTML = [2, 3, 4, 5, 6].map(n => `<b class="${n === NGIOC ? 'sel' : ''}" data-n="${n}">${n}</b>`).join('');
  $('s-liv').innerHTML = ['facile', 'forte'].map(k => `<b class="${k === OPZ.liv ? 'sel' : ''}" data-l="${k}">${L0.liv[k]}</b>`).join('');
  $('s-opz').innerHTML = [['lang', OPZ.lang === 'en' ? 'EN' : 'IT'], ['cb', L0.opzioni[1]], ['rm', L0.opzioni[2]]].map(([k, l]) => `<b class="${k === 'lang' || OPZ[k] ? 'sel' : ''}" data-o="${k}">${l}</b>`).join('');
  document.querySelectorAll('.pgc canvas').forEach(c => iconaAbil(c.getContext('2d'), c.dataset.ab, c.closest('.pgc').classList.contains('sel')));
  document.querySelectorAll('.pgc').forEach(d => d.onclick = () => { OPZ.pg = d.dataset.p; scrivi('pg', OPZ.pg); suono('tic'); lobby(); });
  document.querySelectorAll('#s-n b').forEach(d => d.onclick = () => { NGIOC = +d.dataset.n; scrivi('n', NGIOC); lobby(); });
  document.querySelectorAll('#s-liv b').forEach(d => d.onclick = () => { OPZ.liv = d.dataset.l; scrivi('liv', OPZ.liv); lobby(); });
  document.querySelectorAll('#s-opz b').forEach(d => d.onclick = () => { const k = d.dataset.o;
    if (k === 'lang') { OPZ.lang = OPZ.lang === 'en' ? 'it' : 'en'; scrivi('lang', OPZ.lang); document.documentElement.lang = OPZ.lang; }
    else { OPZ[k] = !OPZ[k]; scrivi(k, OPZ[k] ? '1' : '0'); if (k === 'rm') document.body.classList.toggle('rm', OPZ.rm); if (k === 'cb') COL = OPZ.cb ? COLCB : COLN; }
    lobby(); });
  $('lobby').classList.remove('nasc'); document.body.classList.add('menu');
  if (!ANTE && FASE !== 'scegli' && FASE !== 'rivela') { for (const o of RANE) mondo.remove(o.root); RANE.length = 0; for (const r of CELLE) for (const c of r) c.visible = false; for (const c of ARRIVO) c.visible = false; corrente.visible = false; etiArrivo.visible = false; for (const m of CATENA) m.visible = false; for (const p of PODIO) scena.remove(p); PODIO.length = 0; anteprima(); }
  else if (ANTE) { mondo.remove(ANTE.o.root); const o = ANTE.o; scena.remove(ANTE.ped); ANTE = null; anteprima(); }
}
$('b-gioca').onclick = () => { ac(); GUARDA = false; suono('tic'); Rete.nuova(); };
$('b-guarda').onclick = () => { ac(); GUARDA = true; Rete.nuova(); };
$('b-come').onclick = () => { apriCome(); };
$('esci').onclick = () => { $('esci').classList.remove('on'); $('f-lobby').onclick(); };
$('b-lez').onclick = () => { ac(); GUARDA = false; suono('tic'); Rete.nuova(true); };
$('f-ok').onclick = () => { fermaRivincita(); for (const p of PODIO) scena.remove(p); PODIO.length = 0; if ($('f-ok').dataset.dopoLez) { delete $('f-ok').dataset.dopoLez; OPZ.liv = 'facile'; scrivi('liv', 'facile'); NGIOC = 3; } Rete.nuova(); };
$('f-lobby').onclick = async () => { fermaRivincita(); await velo(true); $('fine').classList.add('nasc'); for (const p of PODIO) scena.remove(p); PODIO.length = 0; FASE = 'menu'; Rete.on = false; lobby(); velo(false); };
muto(OPZ.muto);
(async () => {
  const font = ['800 40px "Inter Tight"', 'italic 900 40px "Inter Tight"', 'italic 800 40px "Inter Tight"', '600 30px "Inter"', '400 14px "Inter"', '500 14px "Inter"'];
  await Promise.race([Promise.all(font.map(f => document.fonts.load(f))), sleep(2.5)]).catch(() => {});
  await Promise.all([0, 1, 2, 3, 4, 5].map(i => carica(avatarURL(i)).then(im => { IMGAV[i] = im; })));
  await caricaBayou(); await caricaGLB();
  layout();
  // riscaldamento sotto la schermata di caricamento: shader e texture nuovi (piastre, fasci, gorgo) compilati e caricati adesso,
  // non al primo turno (prima davano uno scatto di ~200 ms all'entrata in scena)
  try { const prova = nuovaCella(true); tinta(prova, 'bomba', false, true, 1); prova.userData.fascio.visible = true; const bps = PGS.map((pg, k) => { const o = nuovoBot(k % 5, pg); RANE.pop(); o.root.traverse(x => { x.visible = true; }); o.root.position.x = k * 2 - 5; return o; }); const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: TEX_PUNTO, transparent: true, depthWrite: false})); mondo.add(sp); cam.position.set(0, 14, 11); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); renderer.compile(scena, cam); renderer.render(scena, cam); mondo.remove(prova); for (const o of bps) mondo.remove(o.root); mondo.remove(sp); } catch (e) { console.warn('riscaldamento', e); }
  requestAnimationFrame(frame); regia(); Rete.poll(); $('carica').classList.add('via');
  if (Q.get('avvia') === '1' || Q.get('titolo') === '0') lobby(); else titolo();
  if (Q.get('avvia') === '1') setTimeout(() => { GUARDA = GUARDA0; Rete.nuova(Q.get('lezione') === '1'); }, +(Q.get('regole_s') || 0) * 1000);
})();
function sovrapposizioni() {
  const vis = el => { if (!el) return null; const cs = getComputedStyle(el); if (cs.display === 'none' || +cs.opacity < .2 || el.closest('.nasc') || el.classList.contains('via')) return null;
    let r = el.getBoundingClientRect(); if (el.id === 'boom' || el === banner) { const rg = document.createRange(); rg.selectNodeContents(el); r = rg.getBoundingClientRect(); }
    if (r.width < 2 || r.height < 2 || r.right <= 0 || r.left >= innerWidth || r.bottom <= 0 || r.top >= innerHeight) return null; return r; };
  const E = {top: $('top'), fase: $('fase'), evento: $('evento'), cap: $('cap'), bot: $('bot'), boom: $('boom'), banner, lez: $('lezc'), aiuto: $('aiuto'), muto: $('muto'), tip: $('tip')};
  for (const f of FUMI) E['fumetto' + f.o.i] = f.d;
  const R0 = {}; for (const k in E) { const r = vis(E[k]); if (r) R0[k] = r; }
  const out = [], ks = Object.keys(R0), inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  for (let a = 0; a < ks.length; a++) for (let b = a + 1; b < ks.length; b++) { if (ks[a] === 'tip' || ks[b] === 'tip') continue; const A = inter(R0[ks[a]], R0[ks[b]]); if (A > 40) out.push(ks[a] + '/' + ks[b]); }
  for (const o of RANE) { if (o.ko || !o.root.visible || FASE === 'fine' || o.alt < -.3) continue; const v = o.root.position.clone().add(mondo.position); v.y += 1.2; const p = v.project(cam); const x = (p.x + 1) / 2 * innerWidth, y = (1 - p.y) / 2 * innerHeight;
    for (const k of ['top', 'fase', 'bot', 'lez', 'evento']) { const r = R0[k]; if (r && x > r.left && x < r.right && y > r.top && y < r.bottom) out.push('bot' + o.i + '/' + k); } }
  return out;
}
// CONTROLLO: il cappello non deve mai entrare nell'oblò né coprire la foto (6 sagome x pose estreme x due camere)
function controllaCappelli() {
  const pose = [['ferma', o => {}], ['schiacciato', o => { o.anca.scale.set(1.27, .62, 1.27); }], ['allungato', o => { o.anca.scale.set(.88, 1.3, .88); }],
    ['salto inclinato', o => { o.anca.rotation.x = -.35; }], ['KO che rotola', o => { o.anca.rotation.z = 2; }], ['cappello sollevato', o => { o.testa.position.y = o.testaY + .4; }],
    ['CONTROLLO: cappello davanti alla foto', o => { o.testa.position.set(0, o.viso.position.y + .05, o.viso.position.z + .12); }]];
  const camere = [['camera di scelta', 1.05, 13], ['primo piano', .35, 5]];
  const out = [], v = new THREE.Vector3(), w = new THREE.Vector3(), rc = new THREE.Raycaster(), salva = [IO, NOMI.slice()], cam2 = new THREE.PerspectiveCamera(40, 1, .05, 100);
  for (const pg of PGS) for (const [nomePosa, f] of pose) for (const [nomeCam, el, d] of camere) {
    const o = nuovoRobot(0, pg); RANE.pop(); scena.add(o.root); o.root.position.set(0, 0, 0);
    cam2.position.set(0, 1 + Math.sin(el) * d, Math.cos(el) * d); cam2.lookAt(0, 1, 0); cam2.updateMatrixWorld();
    o.capo.rotation.x = -Math.max(0, Math.min(.75, el * .62)); f(o); o.root.updateMatrixWorld(true);
    // 1) vertici del cappello dentro il volume dell'oblò
    let dentro = 0; o.testa.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position;
      for (let k = 0; k < P.count; k += 3) { v.fromBufferAttribute(P, k); m.localToWorld(v); o.viso.worldToLocal(v); if (Math.hypot(v.x, v.y) < o.rOblo + .03 + o.tubo && v.z > -.1 && v.z < .12) dentro++; } });
    // 2) la foto vista dalla camera: quanti punti sono coperti dal cappello
    const cappello = []; o.testa.traverse(m => { if (m.isMesh) cappello.push(m); });
    let coperti = 0, tot = 0;
    for (let r = 0; r <= 3; r++) for (let a = 0; a < (r ? 10 : 1); a++) { tot++; const rr = o.rOblo * .9 * r / 3, an = a / 10 * 6.283;
      v.set(Math.cos(an) * rr, Math.sin(an) * rr, -.012); o.viso.localToWorld(v); w.copy(v).sub(cam2.position); const dist = w.length(); rc.set(cam2.position, w.normalize());
      const h = rc.intersectObjects(cappello, false)[0]; if (h && h.distance < dist - .005) coperti++; }
    out.push({pg, posa: nomePosa, camera: nomeCam, dentro, coperti: Math.round(100 * coperti / tot)}); scena.remove(o.root);
  }
  [IO, NOMI] = salva; return out;
}
// CONTROLLO: niente oggetti del personaggio vicino al cappello (testa = oblo' + cappello e basta).
// 1) nello spazio: nessun vertice di un oggetto dentro il volume del cappello allargato di «margine»
// 2) sullo schermo: nessun vertice di un oggetto dentro il rettangolo del cappello (allargato) visto dalla camera di scelta e dal primo piano
let RT_V = null; const MAT_V = {h: new THREE.MeshBasicMaterial({color: 0x00ff00}), p: new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide}), k: new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide})};
function controllaVicini(margine = .1) {
  const braccia = a => o => o.braccia.forEach((b, k) => { b.rotation.z = (k ? 1 : -1) * Math.min(a, o.ex.limB); });
  const pose = [['ferma', o => {}], ['schiacciato', o => { const s = o.ex.sqMin; o.anca.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s)); }], ['allungato', o => { o.anca.scale.set(.88, 1.3, .88); }],
    ['salto inclinato', o => { o.anca.rotation.x = -.35; braccia(2.55)(o); }], ['KO che rotola', o => { o.anca.rotation.z = 2; }], ['festa (braccia al cielo)', braccia(3.1)],
    ['paura (braccia avanti)', o => { o.braccia.forEach(b => { b.rotation.x = -.9; b.rotation.z *= 2; }); }], ['abilita', o => { o.usa = .5; animaForma(o, .016, 1); if (o.ex.cupola) o.ex.cupola.visible = false; }],
    ['CONTROLLO: oggetto messo sul cappello', null]];
  const camere = [['camera di scelta', 1.05, 13], ['primo piano', .35, 5]];
  const out = [], v = new THREE.Vector3(), salva = [IO, NOMI.slice()], cam2 = new THREE.PerspectiveCamera(40, 390 / 844, .05, 100);
  for (const pg of PGS) for (const [nomePosa, f] of pose) for (const [nomeCam, el, d] of camere) {
    const o = nuovoRobot(0, pg); RANE.pop(); scena.add(o.root); o.root.position.set(0, 0, 0); if (o.ex.cupola) o.ex.cupola.visible = false;
    cam2.position.set(0, 1 + Math.sin(el) * d, Math.cos(el) * d); cam2.lookAt(0, 1, 0); cam2.updateMatrixWorld();
    o.capo.rotation.x = -Math.max(0, Math.min(.75, el * .62));
    let finto = null; if (f) f(o); else { finto = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .1)); finto.position.set(.3, .3, 0); o.testa.add(finto); }
    o.root.updateMatrixWorld(true);
    // volume del cappello nello spazio della testa (senza corona)
    const hb = new THREE.Box3(); o.testa.traverse(m => { if (!m.isMesh || m === finto) return; let p = m.parent; while (p && p !== o.testa) { if (p === o.corona) return; p = p.parent; }
      const P = m.geometry.attributes.position; for (let k = 0; k < P.count; k++) { v.fromBufferAttribute(P, k); m.localToWorld(v); o.testa.worldToLocal(v); hb.expandByPoint(v); } });
    const hbM = hb.clone().expandByScalar(margine);
    // gli oggetti: tutto quello che non e' corpo, testa o cappello (e non gli stati, che stanno fuori da «taglia»)
    const props = []; o.root.children[0].traverse(m => { if (!m.isMesh || !m.visible || m.userData.corpo) return; let p = m, sotto = false, vis = true; while (p) { if (p === o.capo) sotto = true; if (!p.visible) vis = false; p = p.parent; } if (vis && (!sotto || m === finto)) props.push(m); });
    let vicini = 0; const chi = new Set();
    for (const m of props) { const P = m.geometry.attributes.position;
      for (let k = 0; k < P.count; k++) { v.fromBufferAttribute(P, k); m.localToWorld(v); o.testa.worldToLocal(v); if (hbM.containsPoint(v)) { vicini++; chi.add(m.geometry.type); } } }
    // sullo schermo, con le parti nascoste davvero nascoste: cappello verde, oggetti rossi, tutto il resto nero (copre)
    scena.remove(o.root); const sc2 = new THREE.Scene(); sc2.add(o.root);
    const inCapp = m => { let p = m; while (p) { if (p === o.testa) return m !== finto; p = p.parent; } return false; };
    for (const c of o.root.children) if (c !== o.root.children[0]) c.visible = false;   // stati e anelli (invisibili o trasparenti a opacita' 0) fuori dalla prova
    o.root.traverse(m => { if (m.isSprite) m.visible = false; if (!m.isMesh) return; if (m.material.transparent && m.material.opacity < .05) m.visible = false; m.material = inCapp(m) ? MAT_V.h : props.includes(m) ? MAT_V.p : MAT_V.k; });
    const W2 = 180, H2 = Math.round(180 * 844 / 390); RT_V = RT_V || new THREE.WebGLRenderTarget(W2, H2); const px = new Uint8Array(W2 * H2 * 4), cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
    renderer.setRenderTarget(RT_V); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(sc2, cam2); renderer.readRenderTargetPixels(RT_V, 0, 0, W2, H2, px); renderer.setRenderTarget(null); renderer.setClearColor(cc, ca);
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, nV = 0, nR = 0; for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const q = (y * W2 + x) * 4; if (px[q] > 200 && px[q + 1] < 60) nR++; if (px[q + 1] > 200 && px[q] < 60) { nV++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
    if (window.__VDBG && window.__VDBG.includes(pg + '/' + nomePosa + '/' + nomeCam)) { const c = tela(W2, H2), g = c.getContext('2d'), id = g.createImageData(W2, H2); for (let y = 0; y < H2; y++) id.data.set(px.subarray((H2 - 1 - y) * W2 * 4, (H2 - y) * W2 * 4), y * W2 * 4); g.putImageData(id, 0, 0); (window.__VIMG = window.__VIMG || []).push(c.toDataURL()); }
    // zona proibita: il rettangolo del cappello allargato di un quarto ai lati e sopra (sotto c'e' la faccia)
    let schermo = 0; if (x1 >= 0) { const mx = (x1 - x0) * .25 + 2, my = (y1 - y0) * .25 + 2;
      for (let y = Math.max(0, y0); y < Math.min(H2, y1 + my); y++) for (let x = Math.max(0, Math.floor(x0 - mx)); x < Math.min(W2, x1 + mx); x++) { const q = (y * W2 + x) * 4; if (px[q] > 200 && px[q + 1] < 60) schermo++; } }
    if (schermo) chi.add('pixel rossi');
    out.push({pg, posa: nomePosa, camera: nomeCam, oggetti: props.length, vicini, schermo, pxCappello: nV, pxOggetti: nR, chi: [...chi]});
  }
  [IO, NOMI] = salva; return out;
}
// HOP_RT_1711 (innesto del pacchetto, costruisci_pagina.py): l aggancio per il ponte del server vero
window.__HOP_RT = {avatar: (i, im) => { if (im) IMGAV[i] = im; }, nuova: () => Rete.nuova(),
  stato: () => ({FASE, IO, MOSSE, MIA, turno: ST && ST.turno, nomi: NOMI, p: ST && ST.p}),
  schermo: (x, y) => { const c = CELLE[x] && CELLE[x][y]; if (!c || !c.visible) return null; const v = new THREE.Vector3(); c.getWorldPosition(v); v.y += .12; v.project(cam); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }};
window.HCV = {get FASE() { return FASE; }, glb: pg => GLBS[pg], titolo: () => TIT && {log: TIT.log || [], traccia: TIT.traccia || [], d: TIT.d, ox: TIT.ox, oy: TIT.oy, sx: TIT.sx, q: $('titolo').dataset.q, rane: TIT.rane.length, cam: cam.position.toArray().map(x => +x.toFixed(2)), view: !!(cam.view && cam.view.enabled)},
  misura: () => RANE.filter(o => o.glb && o.root.visible).map(o => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; const v = new THREE.Vector3();
    o.glb.sc.updateMatrixWorld(true); o.glb.sc.traverse(n => { if (!n.isSkinnedMesh) return; const P = n.geometry.attributes.position, passo = Math.max(1, Math.floor(P.count / 1200));
      for (let k = 0; k < P.count; k += passo) { n.boneTransform(k, v); v.applyMatrix4(n.matrixWorld); v.project(cam); const X = (v.x + 1) / 2 * innerWidth, Y = (1 - v.y) / 2 * innerHeight; a = Math.min(a, X); b = Math.max(b, X); c = Math.min(c, Y); d = Math.max(d, Y); } });
    return {pg: o.pg, larg: Math.round(b - a), alto: Math.round(d - c), area: Math.round((b - a) * (d - c))}; }),
  // prova delle animazioni (pagina con ?fila=1&riga=1): tutti fanno la stessa sequenza, sfasati di poco
  dimostra: async () => { if (!ANTE || !ANTE.fila) return 'niente fila'; ANTE.fermo = true;
    const uno = async (o, k) => { await attendi(k * .07); const p0 = o.podio.clone(), w = p0.clone(); w.y = .05;
      await attendi(1.2);
      o.stato = 'carica'; await tw(.22, t => { o.sq = 1 - .3 * eo(t); });
      o.stato = 'volo'; o.direzione = null; suono('salto', .4);
      await tw(.6, t => { o.alt = 1.6 * (1 - Math.pow(Math.abs(2 * t - 1), 2.4)); o.sq = t < .2 ? .72 + 2.2 * t : t > .85 ? 1.12 - (t - .85) * 1.4 : 1.12; });
      o.alt = 0; o.stato = 'atterra'; o.jv = (o.jv || 0) - 2.4; anello(w, 0xbff6ea, 1.5, .45); particelle(w, 10, 0xd8fff4, 1.4, .45, {su: 1.1, r: .1, g: 6});
      tw(.32, t => { o.sq = .62 + .38 * ebk(t); }).then(() => { o.stato = 'idle'; }); await attendi(1.0);
      o.flash = .4; o.stato = 'colpito'; o.jv -= 2.2; await attendi(.6); o.stato = 'idle'; await attendi(.6);
      o.posaF = 'clash'; o.posaT = .7; await attendi(1.2);
      o.festa = 1; await attendi(1.8); o.festa = 0; await attendi(.4);
      o.ko = true; o.stato = 'volo'; await tw(.9, t => { o.alt = -t * t * 2.2; }); await attendi(.4); o.ko = false; o.alt = 0; o.stato = 'idle'; };
    await Promise.all(ANTE.fila.map((o, k) => uno(o, k))); return 'fatto'; },
  // solo per le foto di controllo: sposta a vista un personaggio su una casella (lo stato vero non cambia)
  metti: (i, x, y) => { const o = RANE[i]; if (!o) return false; o.x = x; o.y = y; return [o.pg, x, y]; }, pgs: () => RANE.map(o => o.pg),
  // controllo dei modelli 3D (pagina con ?fila=1): ferma tutti i personaggi della fila su una clip a una frazione della sua durata
  posa: (nome, fr) => { if (!ANTE || !ANTE.fila) return 'niente fila'; ANTE.fermo = true; const out = []; for (const b of ANTE.fila) { b.posaF = nome; b.posaT = 1e9; const g = b.glb; if (!g) { out.push(b.pg + ':carta'); continue; }
    const a = g.az[nome]; if (!a) { out.push(b.pg + ':manca ' + nome); continue; } g.mixer.stopAllAction(); a.reset(); a.play(); a.time = (fr == null ? .5 : fr) * a.getClip().duration; a.paused = true; g.ora = nome; g.mixer.update(0); out.push(b.pg + ':ok'); } return out.join(' '); },
  // quanto schermo occupa il campo (ninfee del campo + file in arrivo, bordo esterno delle ninfee)
  campoSchermo: () => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; const r = .46; for (let x = 0; x <= W + 1; x++) for (let y = 0; y < H; y++) for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r]]) { const v = pos(x + dx * (x >= W ? .8 : 1), y + dy).add(mondo.position); v.y = .06; const p = v.project(cam); const X = (p.x + 1) / 2 * innerWidth, Y = (1 - p.y) / 2 * innerHeight; a = Math.min(a, X); b = Math.max(b, X); c = Math.min(c, Y); d = Math.max(d, Y); }
    a = Math.max(0, a); b = Math.min(innerWidth, b); return {alto: +((d - c) / innerHeight).toFixed(3), largo: +((b - a) / innerWidth).toFixed(3), area: +(((d - c) * (b - a)) / (innerWidth * innerHeight)).toFixed(3), y0: Math.round(c), y1: Math.round(d)}; },
  dbg: () => ({corr: corrente.visible, p: corrente.position.toArray(), s: corrente.scale.toArray(), mondo: corrente.parent === mondo}), programmi: () => renderer.info.programs.map(p => p.name + ' | ' + p.cacheKey), audio: {suono, sigla, pubblico, rumore, ac, voce: voceRana, peso: tonfoPeso, stato: (f, tempo) => { FASE = f; TEMPO = tempo || 98; CHEER = f === 'rivela' ? 1 : .2; }, mix: () => MIX, ricette: () => Object.keys(RICETTE), voci: () => VOCI.length}, controllaCappelli, controllaVicini, taglie: () => PGS.map(pg => { const o = nuovoRobot(0, pg); RANE.pop(); return [pg, o.ex.taglia]; }), tempi: () => TEMPI, sovrapposizioni, scudi: () => RANE.filter(o => o.scudo.visible && !(ST.p[o.i] || {}).scudo).map(o => [o.i, FASE, !!o.scudo.userData.rompe, o.ko]), mosse: () => MOSSE, mia: () => MIA, io: () => IO >= 0 && ST ? [ST.p[IO].x, ST.p[IO].y] : null,
  mosseArmate: () => MOSSE.filter(m => { const t = ST.campo[m[0]][m[1]]; return TC[t] && !(m[0] === ST.p[IO].x && m[1] === ST.p[IO].y); }), vista: () => VISTA, mem: () => ({geo: renderer.info.memory.geometries, tex: renderer.info.memory.textures, prog: renderer.info.programs.length, calls: renderer.info.render.calls, part: PART.length, tw: TW.length, scena: scena.children.length, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : 0}),
  schermoDi: (x, y) => { const v = pos(x, y).add(mondo.position); v.y = .2; const p = v.project(cam); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; }, fps: () => FPS};
const TRACCIA = Q.get('traccia') === '1';
let FPS = 0; (function contaFps() { let n = 0, t0 = performance.now(); (function g() { n++; const t = performance.now(); if (t - t0 > 1000) { FPS = Math.round(n * 1000 / (t - t0)); n = 0; t0 = t; } requestAnimationFrame(g); })(); })();
})();
