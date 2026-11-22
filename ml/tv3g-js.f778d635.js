(function () {
  'use strict';
  if (!window.TV3 || !TV3._int || window.TV3G_OFF) return;
  try { if (localStorage.getItem('gb_tv3g') === '0') return; } catch (e) { }
  var I = TV3._int, L = I.L, esc = I.esc, tondo = I.tondo, clamp = I.clamp, eoc = I.eoc, eio = I.eio, rnd = I.rnd, cache = I.cache;
  function O(id, idx, rarity, name, name_en, desc, desc_en, c) { return { id: id, idx: idx, rarity: rarity, name: name, name_en: name_en, desc: desc, desc_en: desc_en, c: c || {} }; }
  var NUOVI = {
    sn: [O('tv_snake_pitone', 1, 'rare', 'PITONE', 'PYTHON', 'Pelle dorata a macchie scure: il serpente vero della giungla.', 'Golden skin with dark blotches: the real jungle snake.', { base: '#a16207', macchie: '#3f2a0c' }),
         O('tv_snake_corallo', 2, 'epic', 'CORALLO', 'CORAL', 'Anelli rossi, neri e gialli: chi lo vede si scansa.', 'Red, black and yellow rings: whoever sees it steps aside.', { anelli: ['#dc2626', '#111111', '#facc15'] })],
    pg: [O('tv_racchetta_plasma', 1, 'rare', 'RACCHETTA PLASMA', 'PLASMA PADDLE', 'Bordo viola al plasma e una scia che segue ogni scatto.', 'A violet plasma rim and a trail that follows every dash.', { bordo: '#a855f7', scia: '#e879f9' }),
         O('tv_racchetta_oro', 2, 'epic', "RACCHETTA D'ORO", 'GOLDEN PADDLE', 'Oro pieno e scia di luce calda: per chi chiude a zero.', 'Solid gold with a warm light trail: for clean-sheet winners.', { bordo: '#d4af37', scia: '#fde68a' })],
    sh: [O('tv_disco_giada', 1, 'rare', 'DISCO DI GIADA', 'JADE DISC', 'Giada verde col bordo di ghiaccio: scivola senza un rumore.', 'Green jade with an icy rim: it slides without a sound.', { disco: '#059669', bordo: '#d1fae5' })],
    bk: [O('tv_pallone_street', 1, 'rare', 'PALLONE STREET', 'STREET BALL', 'Cuoio arancio coi graffiti azzurri del campetto.', 'Orange leather with the court’s blue graffiti.', { cuoio: '#ea580c', cuciture: '#111111', graffiti: '#22d3ee' })],
    su: [O('tv_mawashi_oro', 1, 'rare', "MAWASHI D'ORO", 'GOLDEN MAWASHI', 'La cintura dei campioni del dohyo, oro lucido.', 'The belt of dohyo champions, polished gold.', { cintura: '#d4af37' })],
    tk: [O('tv_mimetica_deserto', 1, 'rare', 'MIMETICA DESERTO', 'DESERT CAMO', 'Sabbia, ocra e terra bruciata sullo scafo.', 'Sand, ochre and burnt earth on the hull.', { macchie: ['#c2a878', '#8a6f45', '#5c4a2e'] })],
    ar: [O('tv_freccia_fuoco', 1, 'epic', 'FRECCIA DI FUOCO', 'FIRE ARROW', 'Asta scura e una scia di fuoco fino al bersaglio.', 'A dark shaft and a trail of fire all the way to the target.', { asta: '#3f2a0c', scia: '#f97316' })],
    al: [O('tv_bomba_oro', 1, 'rare', 'BOMBA DORATA', 'GOLDEN BOMB', 'Candelotti d’oro e una miccia che sputa scintille.', 'Golden sticks and a fuse spitting sparks.', { corpo: '#d4af37', miccia: '#f97316' })],
    gb: [O('tv_puntina_oro', 1, 'rare', "PUNTINA D'ORO", 'GOLDEN PIN', 'La tua risposta sulla mappa, con la testa d’oro.', 'Your answer on the map, with a golden head.', { testa: '#d4af37', ago: '#e5e7eb' }),
         O('tv_bandierina', 2, 'epic', 'BANDIERINA', 'LITTLE FLAG', 'Una bandierina rossa piantata dove hai scommesso.', 'A red flag planted where you placed your bet.', { asta: '#e5e7eb', telo: '#dc2626' })],
    dm: [O('tv_cornice_ossa', 1, 'rare', "CORNICE D'OSSA", 'BONE FRAME', 'Il tuo ritratto in una cornice d’ossa ingiallite.', 'Your portrait in a frame of yellowed bones.', { cornice: '#e7e2d3', ombra: '#3f3a2e' }),
         O('tv_cornice_spettro', 2, 'epic', 'CORNICE SPETTRALE', 'SPECTRAL FRAME', 'Una cornice di luce fredda che non smette di tremare.', 'A frame of cold light that never stops flickering.', { cornice: '#a5f3fc', bagliore: '#67e8f9' })],
    lp: [O('tv_medaglione_argento', 1, 'epic', "MEDAGLIONE D'ARGENTO", 'SILVER MEDALLION', 'Argento e smalto notte attorno al tuo ruolo.', 'Silver and night enamel around your role.', { metallo: '#cbd5e1', smalto: '#1e293b' })],
    pz: [O('tv_pezzi_marmo', 1, 'rare', 'MARMO E ONICE', 'MARBLE & ONYX', 'Pezzi di marmo venato e onice nero.', 'Veined marble and black onyx pieces.', { chiari: '#f1efe9', scuri: '#141414', venature: '#9a9a9a' }),
         O('tv_pezzi_oro', 2, 'epic', 'ORO E ARGENTO', 'GOLD & SILVER', 'Argento lucido contro oro pieno.', 'Polished silver against solid gold.', { chiari: '#e5e7eb', scuri: '#d4af37' })],
    kj: [O('tv_kaiju_lava', 1, 'rare', 'PELLE LAVICA', 'LAVA SKIN', 'Roccia scura spaccata dalla lava che pulsa.', 'Dark rock split by pulsing lava.', { tinta: '#3b0d0d', crepe: '#ff5a1f' }),
         O('tv_kaiju_cromo', 2, 'epic', 'PELLE CROMATA', 'CHROME SKIN', 'Cromo a specchio: la città si riflette su di te.', 'Mirror chrome: the city reflects on you.', { tinta: '#c9ced6', riflesso: '#ffffff' })],
    sx: [O('tv_smash_scia_oro', 1, 'rare', "SCIA D'ORO", 'GOLDEN TRAIL', 'Chi butti fuori vola via in una scia d’oro.', 'Whoever you knock out flies off in a golden trail.', { scia: '#ffd54a' }),
         O('tv_smash_neon', 2, 'epic', 'ESPLOSIONE NEON', 'NEON BURST', 'Il KO esplode in un anello ciano e viola.', 'The KO bursts into a cyan and violet ring.', { scoppio: '#22d3ee', anello: '#a855f7' })],
    hc: [O('tv_rana_cilindro', 1, 'rare', 'CILINDRO', 'TOP HAT', 'Un cilindro nero col nastro rosso: la rana elegante.', 'A black top hat with a red band: the dapper frog.', { cappello: '#111111', nastro: '#b91c1c' }),
         O('tv_rana_corona', 2, 'epic', 'CORONA', 'CROWN', 'Oro e una gemma blu: il re dello stagno.', 'Gold and a blue gem: king of the pond.', { oro: '#d4af37', gemma: '#2563eb' }),
         O('tv_rana_casco', 3, 'rare', 'CASCO', 'HELMET', 'Casco d’acciaio e visiera azzurra.', 'Steel helmet with a blue visor.', { casco: '#9ca3af', visiera: '#38bdf8' })],
    ab: [O('tv_lanterna_oro', 1, 'rare', "LANTERNA D'ORO", 'GOLDEN LANTERN', 'Telaio d’oro e luce calda nel buio dell’abisso.', 'A golden frame and warm light in the dark of the abyss.', { telaio: '#d4af37', luce: '#ffd27a' }),
         O('tv_lanterna_drago', 2, 'epic', 'LANTERNA DEL DRAGO', 'DRAGON LANTERN', 'Bronzo verde e fuoco di drago, che non si spegne.', 'Green bronze and dragon fire that never goes out.', { telaio: '#14532d', luce: '#4ade80' })],
    sb: [O('tv_sbanca_monete', 1, 'rare', 'SCIA DI MONETE', 'COIN TRAIL', 'Ogni colpo lascia dietro di sé una pioggia d’oro.', 'Every shot leaves a shower of gold behind it.', { scia: '#facc15' }),
         O('tv_sbanca_fiamme', 2, 'epic', 'SCIA DI FIAMME', 'FLAME TRAIL', 'Il colpo vola dentro una coda di fuoco.', 'The shot flies inside a tail of fire.', { scia: '#f97316', nucleo: '#fde047' })],
    bx: [O('tv_guantoni_campione', 1, 'epic', 'GUANTONI DEL CAMPIONE', "CHAMPION'S GLOVES", 'Rosso cuoio e polsini d’oro.', 'Red leather and golden cuffs.', { guanto: '#b91c1c', polsino: '#d4af37' })],
    bs: [O('tv_flotta_nera', 1, 'epic', 'FLOTTA NERA', 'BLACK FLEET', 'Scafi neri con la linea d’oro.', 'Black hulls with a gold line.', { scafo: '#111827', linea: '#d4af37' })],
    rv: [O('tv_revolver_inciso', 1, 'epic', 'REVOLVER INCISO', 'ENGRAVED REVOLVER', 'Canna d’acciaio incisa d’oro e calcio di noce.', 'A gold-engraved steel barrel and a walnut grip.', { canna: '#9ca3af', incisioni: '#d4af37', calcio: '#5b3518' })],
    mo: [O('tv_guanto_velluto', 1, 'rare', 'GUANTO DI VELLUTO', 'VELVET GLOVE', 'Velluto viola: sasso, carta o forbici, con stile.', 'Purple velvet: rock, paper or scissors, with style.', { guanto: '#6b21a8' })]
  };
  var IN_PIU = { dd: O('tv_dadi_cristallo', 3, 'epic', 'DADI DI CRISTALLO', 'CRYSTAL DICE', 'Cristallo trasparente coi punti blu notte.', 'Clear crystal with midnight-blue pips.', { corpo: '#cfe9ff', punti: '#1e3a8a', alfa: 0.55 }),
    gp: O('tv_pallina_fuoco', 3, 'epic', 'PALLINA DI FUOCO', 'FIRE BALL', 'Brucia sul green e lascia una scia di fiamma.', 'It burns on the green and leaves a trail of flame.', { base: '#ff6a00', scia: '#ffd000' }) };
  var STOCK = {
    sn: ['Serpente di serie', 'Stock snake', 'Il serpente nel tuo colore.', 'The snake in your colour.'],
    pg: ['Racchetta di serie', 'Stock paddle', 'La racchetta al neon del tuo colore.', 'The neon paddle in your colour.'],
    sh: ['Disco di serie', 'Stock disc', 'Il disco del tuo colore.', 'The disc in your colour.'],
    bk: ['Pallone di serie', 'Stock ball', 'Il pallone arancio di sempre.', 'The usual orange ball.'],
    su: ['Mawashi di serie', 'Stock mawashi', 'La cintura nel tuo colore.', 'The belt in your colour.'],
    tk: ['Carro di serie', 'Stock tank', 'Lo scafo nel tuo colore.', 'The hull in your colour.'],
    ar: ['Freccia di serie', 'Stock arrow', 'Legno chiaro e impennaggio rosso.', 'Light wood and red fletching.'],
    al: ['Bomba di serie', 'Stock bomb', 'I candelotti rossi.', 'The red sticks.'],
    gb: ['Puntina di serie', 'Stock pin', 'La puntina del tuo colore.', 'The pin in your colour.'],
    dm: ['Ritratto di serie', 'Stock portrait', 'Il ritratto senza cornice.', 'The portrait with no frame.'],
    lp: ['Medaglione di serie', 'Stock medallion', 'Il medaglione di bronzo.', 'The bronze medallion.'],
    pz: ['Pezzi di serie', 'Stock pieces', 'Legno chiaro e legno scuro.', 'Light and dark wood.'],
    kj: ['Pelle di serie', 'Stock skin', 'Il mostro coi suoi colori.', 'The monster in its own colours.'],
    sx: ['KO di serie', 'Stock KO', 'Il lampo bianco del KO.', 'The white KO flash.'],
    hc: ['Rana di serie', 'Stock frog', 'La rana senza niente in testa.', 'The frog, bare-headed.'],
    ab: ['Lanterna di serie', 'Stock lantern', 'La lanterna di ferro.', 'The iron lantern.'],
    sb: ['Colpo di serie', 'Stock shot', 'Il colpo senza scia.', 'The shot with no trail.'],
    bx: ['Guantoni di serie', 'Stock gloves', 'I guantoni del tuo colore.', 'Gloves in your colour.'],
    bs: ['Flotta di serie', 'Stock fleet', 'Gli scafi grigi.', 'The grey hulls.'],
    rv: ['Revolver di serie', 'Stock revolver', 'Il revolver brunito.', 'The blued revolver.'],
    mo: ['Mano di serie', 'Stock hand', 'La mano di sempre.', 'The usual hand.']
  };
  var SLOT_NOMI = { sn: ['Pelle del serpente', 'Snake skin'], pg: ['Racchetta', 'Paddle'], sh: ['Disco', 'Disc'], bk: ['Pallone', 'Ball'], su: ['Mawashi', 'Mawashi'],
    tk: ['Mimetica', 'Camo'], ar: ['Freccia', 'Arrow'], al: ['Bomba', 'Bomb'], gb: ['Puntina', 'Pin'], dm: ['Cornice del ritratto', 'Portrait frame'], lp: ['Medaglione', 'Medallion'],
    pz: ['Pezzi', 'Pieces'], kj: ['Pelle del mostro', 'Monster skin'], sx: ['Effetto KO', 'KO effect'], hc: ['Cappello della rana', 'Frog hat'], ab: ['Lanterna', 'Lantern'],
    sb: ['Scia del colpo', 'Shot trail'], bx: ['Guantoni', 'Gloves'], bs: ['Flotta', 'Fleet'], rv: ['Revolver', 'Revolver'], mo: ['Guanto', 'Glove'] };
  var GIOCHI = [
    { k: 'dadi', it: 'Dadi', en: 'Dice', img: 'gbx_pv_dice.webp', slot: ['dd'] },
    { k: 'carte', it: 'Carte 1v1', en: 'Cards 1v1', img: 'gbx_pv_bj1v1.webp', slot: ['db'] },
    { k: 'golf', it: 'Golf', en: 'Golf', img: 'gbx_pv_golf.webp', slot: ['gp'] },
    { k: 'pool', it: 'Biliardo', en: 'Pool', img: 'gbx_pv_pool8.webp', slot: ['st'] },
    { k: 'snake', it: 'Snake', en: 'Snake', img: 'gbx_pv_snake.webp', slot: ['sn'], gioco: true },
    { k: 'pong', it: 'Pong', en: 'Pong', img: 'gbx_pv_pong.webp', slot: ['pg'], gioco: true },
    { k: 'shove', it: 'Shove', en: 'Shove', img: 'gbx_pv_shove.webp', slot: ['sh'], gioco: true },
    { k: 'basket', it: 'Basket', en: 'Basket', img: 'gbx_pv_basket.webp', slot: ['bk'], gioco: true },
    { k: 'sumo', it: 'Sumo', en: 'Sumo', img: 'gbx_pv_sumo.webp', slot: ['su'], gioco: true },
    { k: 'tank', it: 'Tank', en: 'Tank', img: 'gbx_pv_tank.webp', slot: ['tk'], gioco: true },
    { k: 'archery', it: 'Arco', en: 'Archery', img: 'gbx_pv_archery.webp', slot: ['ar'], gioco: true },
    { k: 'alley', it: 'Vicoli', en: 'Alleys', img: 'gbx_pv_alley.webp', slot: ['al'] },
    { k: 'dama', it: 'Scacchi e dama', en: 'Chess & checkers', img: 'gbx_pv_chess.webp', slot: ['pz'] },
    { k: 'geo', it: 'Geo Bet', en: 'Geo Bet', img: 'gbx_pv_geo.webp', slot: ['gb'] },
    { k: 'kaiju', it: 'Kaiju', en: 'Kaiju', img: 'gbx_pv_kaiju.webp', slot: ['kj'] },
    { k: 'hop', it: 'Hop Clash', en: 'Hop Clash', img: 'gbx_pv_hop.webp', slot: ['hc'] },
    { k: 'sbanca', it: 'Sbanca', en: 'Sbanca', img: 'gbx_pv_sbanca.webp', slot: ['sb'] },
    { k: 'smash', it: 'Smash', en: 'Smash', img: 'gbx_pv_smash.webp', slot: ['sx'] },
    { k: 'deadmoney', it: 'Dead Money', en: 'Dead Money', img: 'gbx_pv_deadmoney.webp', slot: ['dm'] },
    { k: 'abisso', it: 'Drago', en: 'Dragon', img: 'gbx_pv_abisso.webp', slot: ['ab'] },
    { k: 'lupus', it: 'Lupus', en: 'Lupus', img: 'gbx_pv_lupus.webp', slot: ['lp'] },
    { k: 'boxe', it: 'Boxe', en: 'Boxing', img: 'gbx_pv_boxe.webp', slot: ['bx'] },
    { k: 'bs', it: 'Battaglia navale', en: 'Battleship', img: 'gbx_pv_bs.webp', slot: ['bs'] },
    { k: 'draw', it: 'Quick Draw e Roulette', en: 'Quick Draw & Roulette', img: 'gbx_pv_draw.webp', slot: ['rv'] },
    { k: 'rps', it: 'Morra', en: 'Rock paper scissors', img: 'gbx_pv_rps.webp', slot: ['mo'] }
  ];
  var DOVE = {
    sn: [[['gbx_pv_snake.webp', 'Snake', 'Snake']], ['La pelle del tuo serpente: la vede anche l’avversario.', 'Your snake’s skin: your opponent sees it too.']],
    pg: [[['gbx_pv_pong.webp', 'Pong', 'Pong']], ['La tua racchetta in partita.', 'Your paddle in the match.']],
    sh: [[['gbx_pv_shove.webp', 'Shove', 'Shove']], ['I tuoi dischi sulla pista.', 'Your discs on the lane.']],
    bk: [[['gbx_pv_basket.webp', 'Basket', 'Basket']], ['Il pallone quando tiri tu.', 'The ball when you shoot.']],
    su: [[['gbx_pv_sumo.webp', 'Sumo', 'Sumo']], ['La cintura del tuo lottatore.', 'Your wrestler’s belt.']],
    tk: [[['gbx_pv_tank.webp', 'Tank', 'Tank']], ['Lo scafo del tuo carro.', 'Your tank’s hull.']],
    ar: [[['gbx_pv_archery.webp', 'Arco', 'Archery']], ['La freccia in volo, quando tiri tu.', 'The arrow in flight, when you shoot.']],
    al: [[['gbx_pv_alley.webp', 'Vicoli', 'Alleys']], ['Le tue bombe nei vicoli.', 'Your bombs in the alleys.']],
    gb: [[['gbx_pv_geo.webp', 'Geo Bet', 'Geo Bet']], ['La tua risposta sulla mappa.', 'Your answer on the map.']],
    dm: [[['gbx_pv_deadmoney.webp', 'Dead Money', 'Dead Money']], ['Il tuo ritratto in sala.', 'Your portrait in the room.']],
    lp: [[['gbx_pv_lupus.webp', 'Lupus', 'Lupus']], ['Il medaglione col tuo ruolo.', 'The medallion with your role.']],
    pz: [[['gbx_pv_chess.webp', 'Scacchi', 'Chess'], ['gbx_pv_dama.webp', 'Dama', 'Checkers']], ['I tuoi pezzi sulla scacchiera.', 'Your pieces on the board.']],
    kj: [[['gbx_pv_kaiju.webp', 'Kaiju', 'Kaiju']], ['La pelle del tuo mostro.', 'Your monster’s skin.']],
    sx: [[['gbx_pv_smash.webp', 'Smash', 'Smash']], ['Quando butti fuori qualcuno.', 'When you knock someone out.']],
    hc: [[['gbx_pv_hop.webp', 'Hop Clash', 'Hop Clash']], ['In testa alla tua rana.', 'On your frog’s head.']],
    ab: [[['gbx_pv_abisso.webp', 'Drago', 'Dragon']], ['La tua lanterna nell’abisso.', 'Your lantern in the abyss.']],
    sb: [[['gbx_pv_sbanca.webp', 'Sbanca', 'Sbanca']], ['La scia dei tuoi colpi.', 'The trail of your shots.']],
    bx: [[['gbx_pv_boxe.webp', 'Boxe', 'Boxing']], ['I guantoni del tuo pugile.', 'Your boxer’s gloves.']],
    bs: [[['gbx_pv_bs.webp', 'Battaglia navale', 'Battleship']], ['Le tue navi.', 'Your ships.']],
    rv: [[['gbx_pv_draw.webp', 'Quick Draw', 'Quick Draw'], ['gbx_pv_rr.webp', 'Roulette Russa', 'Russian Roulette']], ['Il tuo revolver.', 'Your revolver.']],
    mo: [[['gbx_pv_rps.webp', 'Morra', 'RPS']], ['La tua mano.', 'Your hand.']]
  };
  var NEL_GIOCO = { sn: 1, pg: 1, sh: 1, bk: 1, su: 1, tk: 1, ar: 1, dd: 1, db: 1, gp: 1, st: 1 };
  window.TV3G = { NUOVI: NUOVI, IN_PIU: IN_PIU, GIOCHI: GIOCHI, NEL_GIOCO: NEL_GIOCO };
  Object.keys(NUOVI).forEach(function (sl) {
    try { TVL_DEF[sl] = 0; TVL_MAX[sl] = NUOVI[sl].length; } catch (e) { }
    NUOVI[sl].forEach(function (o) { if (!TVL_SKIN.some(function (x) { return x.id === o.id; })) TVL_SKIN.push({ id: o.id, slot: sl, idx: o.idx, rarity: o.rarity, name: o.name, name_en: o.name_en, desc: o.desc, desc_en: o.desc_en, c: o.c }); });
    I.SLOT_NOME[sl] = SLOT_NOMI[sl];
    I.DI_SERIE[sl] = { it: STOCK[sl][0], en: STOCK[sl][1], d: [STOCK[sl][2], STOCK[sl][3]] };
    I.DOVE[sl] = { giochi: DOVE[sl][0], nota: DOVE[sl][1] };
    I.SLOT_IC[sl] = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>';
  });
  Object.keys(IN_PIU).forEach(function (sl) {
    var o = IN_PIU[sl];
    try { TVL_MAX[sl] = Math.max(TVL_MAX[sl] | 0, o.idx); } catch (e) { }
    if (!TVL_SKIN.some(function (x) { return x.id === o.id; })) TVL_SKIN.push({ id: o.id, slot: sl, idx: o.idx, rarity: o.rarity, name: o.name, name_en: o.name_en, desc: o.desc, desc_en: o.desc_en, c: o.c });
  });
  I.DOVE.dd.giochi = I.DOVE.dd.giochi.concat([['gbx_pv_backg.webp', 'Backgammon', 'Backgammon']]);
  I.DSTY[3] = { c: ['rgba(214,236,255,.92)', 'rgba(150,190,235,.55)'], lato: 'rgba(90,130,190,.55)', pip: ['#1e3a8a', '#3b5bb8'], pip1: null, bordo: 'rgba(255,255,255,.85)', luce: .9, met: 0 };
  I.PALL[3] = { g: ['#fff2a8', '#ff6a00', '#7a1a00'], scia: [255, 208, 0], a: 2.4, w: 1.6, glow: 'rgba(255,120,0,.85)', banda: '#38bdf8' };
  function sk(sl, idx) { if (!idx) return null; var l = NUOVI[sl] || []; for (var i = 0; i < l.length; i++) if (l[i].idx === idx) return l[i]; return null; }
  function fondo(x, W, H, k, a, b) {
    x.drawImage(cache('fondo|' + a + b + '|' + (W * k | 0) + 'x' + (H * k | 0), W * k | 0, H * k | 0, function (c, w, h) {
      var g = c.createRadialGradient(w * .5, h * .42, h * .05, w * .5, h * .5, Math.max(w, h) * .75); g.addColorStop(0, a); g.addColorStop(1, b);
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      var r = rnd(5); for (var i = 0; i < Math.min(2500, w * h / 140); i++) { c.fillStyle = 'rgba(255,255,255,' + r() * .04 + ')'; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
    }), 0, 0, W, H);
  }
  function griglia(x, W, H, n, col) { x.strokeStyle = col; x.lineWidth = 1; for (var i = 1; i < n; i++) { x.beginPath(); x.moveTo(W * i / n, 0); x.lineTo(W * i / n, H); x.stroke(); x.beginPath(); x.moveTo(0, H * i / n); x.lineTo(W, H * i / n); x.stroke(); } }
  function luccica(x, cx, cy, R, t, col) {
    for (var i = 0; i < 6; i++) { var a = t * 1.3 + i * 1.047, rr = R * (1.05 + .15 * Math.sin(t * 3 + i)), s = R * .07 * (.5 + .5 * Math.sin(t * 5 + i * 2));
      x.fillStyle = col; x.globalAlpha = .7; x.beginPath(); x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr - s * 2); x.lineTo(cx + Math.cos(a) * rr + s * .5, cy + Math.sin(a) * rr);
      x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr + s * 2); x.lineTo(cx + Math.cos(a) * rr - s * .5, cy + Math.sin(a) * rr); x.closePath(); x.fill(); x.globalAlpha = 1; }
  }
  function colSerpente(idx, i, base) { var s = sk('sn', idx); if (!s) return base; if (s.c.anelli) { var a = s.c.anelli; return a[[0, 1, 2, 1][i % 4]]; } return (i % 3 === 1) ? s.c.macchie : s.c.base; }
  function scenaSnake(x, W, H, t, idx) {
    x.fillStyle = '#05080f'; x.fillRect(0, 0, W, H);
    var c = Math.min(W, H) / (W < 200 ? 6 : 8);
    for (var gy = 0; gy * c < H; gy++) for (var gx = 0; gx * c < W; gx++) { x.fillStyle = (gx + gy) % 2 ? '#0b101c' : '#0d1220'; x.fillRect(gx * c, gy * c, c, c); }
    var n = 11, base = '#38bdf8';
    for (var i = n - 1; i >= 0; i--) {
      var u = t * 1.6 - i * .32, px = W * .5 + Math.cos(u * .7) * W * .32, py = H * .5 + Math.sin(u * 1.4) * H * .26, pad = c * .08 + c * .05 * (i / n);
      x.fillStyle = colSerpente(idx, i, base); x.globalAlpha = .55 + .45 * (1 - i / n);
      if (i === 0) { x.shadowColor = x.fillStyle; x.shadowBlur = 12; }
      tondo(x, px - c / 2 + pad, py - c / 2 + pad, c - pad * 2, c - pad * 2, c * .3); x.fill(); x.shadowBlur = 0; x.globalAlpha = 1;
      var sp = sk('sn', idx); if (sp && sp.c.macchie && i % 3 === 1) { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.arc(px, py, c * .14, 0, 6.2832); x.fill(); }
      if (i === 0) { var d = Math.atan2(Math.cos(u * 1.4) * 1.4 * H * .26, -Math.sin(u * .7) * .7 * W * .32); x.fillStyle = '#fff';
        for (var e = -1; e <= 1; e += 2) { x.beginPath(); x.arc(px + Math.cos(d) * c * .14 - Math.sin(d) * c * .15 * e, py + Math.sin(d) * c * .14 + Math.cos(d) * c * .15 * e, c * .09, 0, 6.2832); x.fill(); } }
    }
  }
  function racchetta(x, cx, cy, pw, ph, idx, base, now, scia) {
    var s = sk('pg', idx);
    if (!s) { x.shadowColor = base; x.shadowBlur = 16; x.fillStyle = base; x.fillRect(cx - pw / 2, cy - ph / 2, pw, ph); x.shadowBlur = 0; return; }
    if (scia) { for (var i = 1; i <= 5; i++) { x.globalAlpha = .22 * (1 - i / 6); x.fillStyle = s.c.scia; x.fillRect(cx - pw / 2 - scia * i * 4, cy - ph / 2, pw, ph); } x.globalAlpha = 1; }
    var g = x.createLinearGradient(0, cy - ph, 0, cy + ph); g.addColorStop(0, '#ffffff'); g.addColorStop(.45, s.c.scia); g.addColorStop(1, s.c.bordo);
    x.shadowColor = s.c.bordo; x.shadowBlur = 20; x.fillStyle = g; tondo(x, cx - pw / 2, cy - ph / 2, pw, ph, ph / 2); x.fill(); x.shadowBlur = 0;
    x.strokeStyle = s.c.bordo; x.lineWidth = Math.max(1.5, ph * .25); tondo(x, cx - pw / 2, cy - ph / 2, pw, ph, ph / 2); x.stroke();
    var lp = ((now * .8) % 1.6) - .3; if (lp > 0 && lp < 1) { x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(cx - pw / 2 + pw * lp - 3, cy - ph / 2 + 1, 6, ph - 2); }
  }
  function scenaPong(x, W, H, t, idx) {
    fondo(x, W, H, 1, '#141432', '#05050f');
    x.setLineDash([6, 6]); x.strokeStyle = 'rgba(168,85,247,.35)'; x.beginPath(); x.moveTo(0, H * .45); x.lineTo(W, H * .45); x.stroke(); x.setLineDash([]);
    var per = 1.6, f = (t % per) / per, bx = W * (.2 + .6 * Math.abs(((t * .45) % 2) - 1)), by = H * (.12 + .7 * (1 - Math.abs(f * 2 - 1)));
    var px = W * .5 + Math.sin(t * 1.7) * W * .28, v = Math.cos(t * 1.7);
    x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 12; x.beginPath(); x.arc(bx, by, Math.max(3, H * .03), 0, 6.2832); x.fill(); x.shadowBlur = 0;
    racchetta(x, px, H * .86, W * (W < 200 ? .42 : .26), Math.max(5, H * .045), idx, '#38bdf8', t, v);
  }
  function disco(x, cx, cy, R, idx, base) {
    var s = sk('sh', idx), col = s ? s.c.disco : base, rim = s ? s.c.bordo : 'rgba(255,255,255,.35)';
    x.shadowColor = col; x.shadowBlur = 12;
    var g = x.createRadialGradient(cx - R * .3, cy - R * .35, R * .1, cx, cy, R); g.addColorStop(0, '#ffffffbb'); g.addColorStop(.3, col); g.addColorStop(1, s ? '#022c1f' : '#0a0f18');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 6.2832); x.fill(); x.shadowBlur = 0;
    x.strokeStyle = rim; x.lineWidth = Math.max(1.5, R * (s ? .14 : .08)); x.beginPath(); x.arc(cx, cy, R * (s ? .86 : .62), 0, 6.2832); x.stroke();
    if (s) { x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = R * .05; for (var i = 0; i < 3; i++) { x.beginPath(); x.arc(cx + R * .1 * i, cy - R * .05 * i, R * (.3 + .12 * i), .4 + i, 1.6 + i); x.stroke(); } }
  }
  function scenaShove(x, W, H, t, idx) {
    x.fillStyle = '#0b0e17'; x.fillRect(0, 0, W, H);
    var B = [['rgba(255,215,0,.20)', '5x'], ['rgba(192,132,252,.16)', '3x'], ['rgba(56,189,248,.12)', '2x'], ['rgba(255,255,255,.05)', '1x']];
    for (var i = 0; i < 4; i++) { x.fillStyle = B[i][0]; x.fillRect(0, H * i * .2, W, H * .2); x.fillStyle = 'rgba(255,255,255,.45)'; x.font = '700 ' + (H * .07) + 'px system-ui'; x.fillText(B[i][1], 6, H * (i * .2 + .12)); }
    var u = clamp((t % 3.2) / 1.6, 0, 1), y = H * (.95 - .85 * eoc(u)), R = Math.min(W, H) * (W < 200 ? .16 : .1);
    disco(x, W * .52 + Math.sin(u * 3) * W * .03, y, R, idx, '#38bdf8');
  }
  function pallone(x, cx, cy, R, idx, rot) {
    var s = sk('bk', idx), cu = s ? s.c.cuoio : '#e8762a', cc = s ? s.c.cuciture : '#7a3a12';
    var g = x.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R); g.addColorStop(0, s ? '#ffb37a' : '#f6a26a'); g.addColorStop(.5, cu); g.addColorStop(1, s ? '#7c2d12' : '#9a4a1a');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 6.2832); x.fill();
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 6.2832); x.clip(); x.translate(cx, cy); x.rotate(rot || 0);
    x.strokeStyle = cc; x.lineWidth = Math.max(1, R * .09);
    x.beginPath(); x.moveTo(-R, 0); x.lineTo(R, 0); x.stroke(); x.beginPath(); x.moveTo(0, -R); x.lineTo(0, R); x.stroke();
    x.beginPath(); x.arc(-R * 1.25, 0, R * .9, -1, 1); x.stroke(); x.beginPath(); x.arc(R * 1.25, 0, R * .9, Math.PI - 1, Math.PI + 1); x.stroke();
    if (s && s.c.graffiti) { x.strokeStyle = s.c.graffiti; x.lineWidth = R * .14; x.lineCap = 'round'; x.beginPath(); x.moveTo(-R * .6, R * .35); x.quadraticCurveTo(-R * .2, -R * .2, R * .15, R * .3); x.quadraticCurveTo(R * .4, R * .6, R * .6, -R * .1); x.stroke();
      x.fillStyle = s.c.graffiti; x.beginPath(); x.arc(-R * .35, -R * .5, R * .1, 0, 6.2832); x.fill(); }
    x.restore();
  }
  function scenaBasket(x, W, H, t, idx) {
    fondo(x, W, H, 1, '#2a1d12', '#0c0805');
    var hx = W * .76, hy = H * .36;
    x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(hx - W * .02, hy - H * .3, W * .16, H * .26); x.strokeStyle = '#ef4444'; x.lineWidth = 2; x.strokeRect(hx + W * .02, hy - H * .2, W * .07, H * .1);
    var u = (t % 2.4) / 1.4, R = Math.min(W, H) * (W < 200 ? .13 : .085);
    var bx = W * .18 + (hx + W * .055 - W * .18) * clamp(u, 0, 1), by = H * .8 - Math.sin(clamp(u, 0, 1) * Math.PI) * H * .62 + (u > 1 ? (u - 1) * H * .9 : 0);
    pallone(x, bx, Math.min(by, H * 1.2), R, idx, t * 6);
    x.strokeStyle = '#f97316'; x.lineWidth = 3; x.beginPath(); x.ellipse(hx + W * .055, hy, W * .06, H * .02, 0, 0, 6.2832); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1; for (var i = 0; i < 5; i++) { x.beginPath(); x.moveTo(hx + W * (.0 + i * .028), hy); x.lineTo(hx + W * (.02 + i * .018), hy + H * .12); x.stroke(); }
  }
  function scenaSumo(x, W, H, t, idx) {
    fondo(x, W, H, 1, '#d9c38f', '#6d5a35');
    var cx = W / 2, cy = H / 2, rr = Math.min(W, H) * .42;
    x.strokeStyle = '#f5ecd2'; x.lineWidth = Math.max(3, rr * .06); x.beginPath(); x.arc(cx, cy, rr, 0, 6.2832); x.stroke();
    var s = sk('su', idx), col = s ? s.c.cintura : '#38bdf8', rad = rr * .42, fa = t * .8, sq = 1 + Math.sin(t * 4) * .04;
    x.save(); x.translate(cx, cy); x.rotate(fa); x.scale(sq, 2 - sq);
    var g = x.createRadialGradient(-rad * .2, -rad * .3, rad * .2, 0, 0, rad); g.addColorStop(0, '#f6c9a0'); g.addColorStop(1, '#b97a4a');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, rad, 0, 6.2832); x.fill();
    x.fillStyle = col; if (s) { var gg = x.createLinearGradient(-rad, 0, rad, 0); gg.addColorStop(0, '#7a5600'); gg.addColorStop(.5, '#fff3b0'); gg.addColorStop(1, '#8a6400'); x.fillStyle = gg; }
    x.shadowColor = col; x.shadowBlur = 10; tondo(x, -rad * .55, -rad * .92, rad * .62, rad * 1.84, rad * .2); x.fill(); x.shadowBlur = 0;
    x.fillStyle = col; x.beginPath(); x.arc(-rad * .72, 0, rad * .22, 0, 6.2832); x.fill();
    x.fillStyle = '#e8b48a'; x.beginPath(); x.arc(rad * .58, 0, rad * .42, 0, 6.2832); x.fill(); x.fillStyle = '#1b1b1b'; x.beginPath(); x.arc(rad * .45, 0, rad * .16, 0, 6.2832); x.fill();
    x.restore();
    if (s) luccica(x, cx, cy, rad * 1.3, t, '#fff3b0');
  }
  function mimetica(x, L, Wd, idx) {
    var s = sk('tk', idx); if (!s) return;
    x.save(); tondo(x, -L * .44, -Wd * .30, L * .88, Wd * .60, 3); x.clip();
    var m = s.c.macchie, r = rnd(17);
    x.fillStyle = m[0]; x.fillRect(-L / 2, -Wd / 2, L, Wd);
    for (var i = 0; i < 9; i++) { x.fillStyle = m[1 + (i % 2)]; x.beginPath(); x.ellipse(-L * .44 + r() * L * .88, -Wd * .3 + r() * Wd * .6, L * (.08 + r() * .08), Wd * (.06 + r() * .06), r() * 3, 0, 6.2832); x.fill(); }
    var g = x.createLinearGradient(0, -Wd / 2, 0, Wd / 2); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = g; x.fillRect(-L / 2, -Wd / 2, L, Wd);
    x.restore();
  }
  function scenaTank(x, W, H, t, idx) {
    fondo(x, W, H, 1, '#2b3320', '#0c0f08'); griglia(x, W, H, 6, 'rgba(255,255,255,.04)');
    var cell = Math.min(W, H) * (W < 200 ? .7 : .48), cx = W / 2 + Math.cos(t * .6) * W * .12, cy = H / 2 + Math.sin(t * .6) * H * .1, ang = t * .6 + Math.PI / 2, ta = Math.sin(t * .9) * 1.2;
    x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.ellipse(cx + 2, cy + 3, cell * .42, cell * .32, 0, 0, 6.2832); x.fill();
    x.save(); x.translate(cx, cy); x.save(); x.rotate(ang);
    var L = cell * .82, Wd = cell * .62; x.fillStyle = '#0b0e15'; x.fillRect(-L / 2, -Wd / 2, L, Wd * .26); x.fillRect(-L / 2, Wd / 2 - Wd * .26, L, Wd * .26);
    var g = x.createLinearGradient(0, -Wd / 2, 0, Wd / 2); g.addColorStop(0, '#22d3ee'); g.addColorStop(1, '#0e141f'); x.fillStyle = g; tondo(x, -L * .44, -Wd * .30, L * .88, Wd * .60, 3); x.fill();
    mimetica(x, L, Wd, idx); x.restore();
    x.rotate(ang + ta); x.fillStyle = idx ? '#5c4a2e' : '#155e75'; x.beginPath(); x.arc(0, 0, cell * .18, 0, 6.2832); x.fill(); x.fillRect(0, -cell * .05, cell * .48, cell * .1);
    x.restore();
  }
  function scenaArco(x, W, H, t, idx) {
    fondo(x, W, H, 1, '#1d3b2a', '#08130c');
    var tx = W * .82, ty = H * .5, tr = Math.min(W, H) * .3, cols = ['#fff', '#111', '#38bdf8', '#ef4444', '#facc15'];
    for (var i = 0; i < 5; i++) { x.fillStyle = cols[i]; x.beginPath(); x.ellipse(tx, ty, tr * (1 - i * .18) * .45, tr * (1 - i * .18), 0, 0, 6.2832); x.fill(); }
    var u = clamp((t % 2.2) / 1.1, 0, 1), s = sk('ar', idx), fx = W * .08 + (tx - W * .1) * u, fy = ty + Math.sin(u * Math.PI) * -H * .18, fa = Math.atan2(Math.cos(u * Math.PI) * -H * .18 * Math.PI, tx - W * .18);
    if (s && u < 1) { x.save(); x.globalCompositeOperation = 'lighter'; for (var k = 1; k <= 10; k++) { var uu = Math.max(0, u - k * .02), qx = W * .08 + (tx - W * .1) * uu, qy = ty + Math.sin(uu * Math.PI) * -H * .18;
      x.fillStyle = 'rgba(249,115,22,' + (.5 * (1 - k / 11)) + ')'; x.beginPath(); x.arc(qx, qy, (W < 200 ? 4 : 6) * (1 - k / 12), 0, 6.2832); x.fill(); } x.restore(); }
    x.save(); x.translate(fx, fy); x.rotate(fa); var ln = W * (W < 200 ? .3 : .18);
    x.strokeStyle = s ? s.c.asta : '#d9c9a0'; x.lineWidth = W < 200 ? 3 : 3.5; x.beginPath(); x.moveTo(-ln, 0); x.lineTo(ln * .55, 0); x.stroke();
    x.fillStyle = s ? '#fde68a' : '#c9d4e8'; x.beginPath(); x.moveTo(ln * .55 + 8, 0); x.lineTo(ln * .55, -5); x.lineTo(ln * .55, 5); x.closePath(); x.fill();
    x.fillStyle = s ? '#f97316' : '#ef4444'; x.beginPath(); x.moveTo(-ln, 0); x.lineTo(-ln - 8, -5); x.lineTo(-ln + 4, -1); x.closePath(); x.fill(); x.beginPath(); x.moveTo(-ln, 0); x.lineTo(-ln - 8, 5); x.lineTo(-ln + 4, 1); x.closePath(); x.fill();
    x.restore();
  }
  var DIS = {
    al: function (x, R, o, t) { var c = o ? o.c.corpo : '#c0392b';
      for (var s2 = -1; s2 <= 1; s2++) { var g = x.createLinearGradient(s2 * R * .3 - R * .14, 0, s2 * R * .3 + R * .14, 0); g.addColorStop(0, o ? '#7a5600' : '#7b1f16'); g.addColorStop(.5, o ? '#fff3b0' : c); g.addColorStop(1, o ? '#8a6400' : '#7b1f16'); x.fillStyle = g; tondo(x, s2 * R * .3 - R * .14, -R * .5, R * .28, R, R * .08); x.fill(); }
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-R * .46, -R * .1, R * .92, R * .16);
      x.strokeStyle = '#c9a86a'; x.lineWidth = R * .06; x.beginPath(); x.moveTo(0, -R * .5); x.quadraticCurveTo(R * .2, -R * .8, R * .34, -R * .7); x.stroke();
      var sp = o ? o.c.miccia : '#facc15'; for (var i = 0; i < 6; i++) { var a = t * 9 + i, d = R * (.05 + .12 * ((t * 7 + i) % 1)); x.fillStyle = sp; x.beginPath(); x.arc(R * .34 + Math.cos(a) * d, -R * .7 + Math.sin(a) * d, R * .03, 0, 6.2832); x.fill(); } },
    gb: function (x, R, o, t) {
      x.fillStyle = '#1d4ed8'; x.globalAlpha = .25; x.beginPath(); x.ellipse(0, R * .75, R * 1.1, R * .3, 0, 0, 6.2832); x.fill(); x.globalAlpha = 1;
      if (o && o.idx === 2) { x.strokeStyle = o.c.asta; x.lineWidth = R * .07; x.beginPath(); x.moveTo(0, R * .75); x.lineTo(0, -R * .8); x.stroke();
        var f = Math.sin(t * 5) * R * .06; x.fillStyle = o.c.telo; x.beginPath(); x.moveTo(0, -R * .8); x.quadraticCurveTo(R * .35, -R * .85 + f, R * .7, -R * .62 + f); x.quadraticCurveTo(R * .35, -R * .45 - f, 0, -R * .35); x.closePath(); x.fill(); return; }
      x.strokeStyle = o ? o.c.ago : '#cbd5e1'; x.lineWidth = R * .06; x.beginPath(); x.moveTo(0, R * .75); x.lineTo(0, -R * .1); x.stroke();
      var g = x.createRadialGradient(-R * .12, -R * .45, R * .05, 0, -R * .3, R * .35); g.addColorStop(0, '#fff'); g.addColorStop(.4, o ? o.c.testa : '#38bdf8'); g.addColorStop(1, o ? '#6b4e00' : '#0c4a6e');
      x.fillStyle = g; x.beginPath(); x.arc(0, -R * .3, R * .34, 0, 6.2832); x.fill(); },
    dm: function (x, R, o, t) { var w = R * 1.2, h = R * 1.5; x.fillStyle = '#1f1a16'; x.fillRect(-w / 2, -h / 2, w, h);
      x.fillStyle = '#6b7280'; x.beginPath(); x.arc(0, -h * .1, w * .22, 0, 6.2832); x.fill(); x.beginPath(); x.ellipse(0, h * .32, w * .34, h * .22, 0, Math.PI, 0); x.fill();
      if (!o) { x.strokeStyle = '#5b4a3a'; x.lineWidth = R * .05; x.strokeRect(-w / 2, -h / 2, w, h); return; }
      x.save(); if (o.c.bagliore) { x.shadowColor = o.c.bagliore; x.shadowBlur = 16 + 8 * Math.sin(t * 9); x.globalAlpha = .75 + .25 * Math.sin(t * 13); }
      x.strokeStyle = o.c.cornice; x.lineWidth = R * .14; x.strokeRect(-w / 2, -h / 2, w, h); x.restore();
      if (o.c.ombra) { x.fillStyle = o.c.cornice; for (var i = 0; i < 4; i++) { var cx = (i % 2 ? 1 : -1) * w / 2, cy = (i < 2 ? -1 : 1) * h / 2; x.beginPath(); x.arc(cx, cy, R * .13, 0, 6.2832); x.fill(); x.fillStyle = o.c.ombra; x.beginPath(); x.arc(cx, cy, R * .05, 0, 6.2832); x.fill(); x.fillStyle = o.c.cornice; } } },
    lp: function (x, R, o, t) { var m = o ? o.c.metallo : '#b45309', e = o ? o.c.smalto : '#3b2a14';
      var g = x.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#fff'); g.addColorStop(.4, m); g.addColorStop(1, o ? '#64748b' : '#78350f');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, R * .8, 0, 6.2832); x.fill(); x.fillStyle = e; x.beginPath(); x.arc(0, 0, R * .6, 0, 6.2832); x.fill();
      x.fillStyle = m; x.font = '700 ' + R * .6 + 'px Georgia,serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('☾', 0, R * .04); },
    pz: function (x, R, o, t) { var ch = o ? o.c.chiari : '#e8d3a7', sc = o ? o.c.scuri : '#5a3417';
      function pezzo(px, col, re) { var g = x.createLinearGradient(px - R * .3, 0, px + R * .3, 0); g.addColorStop(0, col); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, col); x.fillStyle = g; x.globalAlpha = 1;
        x.beginPath(); x.moveTo(px - R * .32, R * .7); x.lineTo(px + R * .32, R * .7); x.lineTo(px + R * .18, R * .5); x.lineTo(px + R * .12, -R * (re ? .2 : 0)); x.lineTo(px - R * .12, -R * (re ? .2 : 0)); x.lineTo(px - R * .18, R * .5); x.closePath(); x.fill();
        x.beginPath(); x.arc(px, -R * (re ? .35 : .12), R * (re ? .2 : .2), 0, 6.2832); x.fill(); x.fillStyle = col; x.globalAlpha = .5; x.fill(); x.globalAlpha = 1;
        if (re) { x.fillRect(px - R * .03, -R * .78, R * .06, R * .26); x.fillRect(px - R * .11, -R * .7, R * .22, R * .06); }
        if (o && o.c.venature) { x.strokeStyle = o.c.venature; x.lineWidth = R * .02; x.beginPath(); x.moveTo(px - R * .2, R * .6); x.quadraticCurveTo(px, R * .1, px + R * .1, -R * .1); x.stroke(); } }
      pezzo(-R * .4, ch, true); pezzo(R * .45, sc, false); },
    kj: function (x, R, o, t) { var tn = o ? o.c.tinta : '#4d7c0f';
      var g = x.createRadialGradient(-R * .2, -R * .3, R * .1, 0, 0, R); g.addColorStop(0, o && o.c.riflesso ? '#ffffff' : '#84cc16'); g.addColorStop(.5, tn); g.addColorStop(1, '#0b0b0b');
      x.fillStyle = g; x.beginPath(); x.ellipse(0, R * .2, R * .62, R * .7, 0, 0, 6.2832); x.fill(); x.beginPath(); x.arc(0, -R * .5, R * .38, 0, 6.2832); x.fill();
      for (var i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(i * R * .15 - R * .07, -R * .85 + Math.abs(i) * R * .05); x.lineTo(i * R * .15, -R * 1.05 + Math.abs(i) * R * .08); x.lineTo(i * R * .15 + R * .07, -R * .85 + Math.abs(i) * R * .05); x.fill(); }
      x.fillStyle = '#fde047'; x.beginPath(); x.arc(-R * .13, -R * .55, R * .06, 0, 6.2832); x.arc(R * .13, -R * .55, R * .06, 0, 6.2832); x.fill();
      if (o && o.c.crepe) { x.strokeStyle = o.c.crepe; x.shadowColor = o.c.crepe; x.shadowBlur = 8 + 6 * Math.sin(t * 4); x.lineWidth = R * .05; x.beginPath(); x.moveTo(-R * .4, -R * .1); x.lineTo(-R * .1, R * .2); x.lineTo(-R * .25, R * .5); x.moveTo(R * .3, -R * .2); x.lineTo(R * .1, R * .15); x.lineTo(R * .35, R * .45); x.stroke(); x.shadowBlur = 0; }
      if (o && o.c.riflesso) { x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.ellipse(-R * .25, -R * .05, R * .08, R * .3, -.3, 0, 6.2832); x.fill(); } },
    sx: function (x, R, o, t) { var u = (t % 1.4) / 1.4;
      x.fillStyle = '#6b7280'; x.beginPath(); x.arc(R * (-.6 + u * 1.6), -R * (.2 + u * .5), R * .16, 0, 6.2832); x.fill();
      if (!o) { x.fillStyle = 'rgba(255,255,255,' + (1 - u) + ')'; x.beginPath(); x.arc(R * .5, -R * .4, R * (.2 + u * .6), 0, 6.2832); x.fill(); return; }
      if (o.c.scia) { x.save(); x.globalCompositeOperation = 'lighter'; for (var k = 0; k < 10; k++) { var uu = Math.max(0, u - k * .03); x.fillStyle = o.c.scia; x.globalAlpha = .5 * (1 - k / 10); x.beginPath(); x.arc(R * (-.6 + uu * 1.6), -R * (.2 + uu * .5), R * .16 * (1 - k / 14), 0, 6.2832); x.fill(); } x.restore(); }
      if (o.c.scoppio) { x.strokeStyle = o.c.scoppio; x.lineWidth = R * .08; x.globalAlpha = 1 - u; x.beginPath(); x.arc(R * .3, -R * .3, R * (.2 + u * .9), 0, 6.2832); x.stroke(); x.strokeStyle = o.c.anello; x.beginPath(); x.arc(R * .3, -R * .3, R * (.1 + u * .6), 0, 6.2832); x.stroke(); x.globalAlpha = 1; } },
    hc: function (x, R, o, t) { var b = Math.abs(Math.sin(t * 3)) * R * .12;
      x.fillStyle = '#16a34a'; x.beginPath(); x.ellipse(0, R * .35 - b, R * .7, R * .45, 0, 0, 6.2832); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(-R * .28, -R * .08 - b, R * .18, 0, 6.2832); x.arc(R * .28, -R * .08 - b, R * .18, 0, 6.2832); x.fill();
      x.fillStyle = '#111'; x.beginPath(); x.arc(-R * .28, -R * .06 - b, R * .08, 0, 6.2832); x.arc(R * .28, -R * .06 - b, R * .08, 0, 6.2832); x.fill();
      if (!o) return; var y0 = -R * .25 - b;
      if (o.idx === 1) { x.fillStyle = o.c.cappello; x.fillRect(-R * .42, y0 - R * .05, R * .84, R * .1); x.fillRect(-R * .26, y0 - R * .6, R * .52, R * .56); x.fillStyle = o.c.nastro; x.fillRect(-R * .26, y0 - R * .16, R * .52, R * .1); }
      else if (o.idx === 2) { x.fillStyle = o.c.oro; x.beginPath(); x.moveTo(-R * .34, y0); for (var i = 0; i <= 4; i++) x.lineTo(-R * .34 + i * R * .17, y0 - (i % 2 ? R * .22 : R * .45)); x.lineTo(R * .34, y0); x.closePath(); x.fill(); x.fillStyle = o.c.gemma; x.beginPath(); x.arc(0, y0 - R * .14, R * .07, 0, 6.2832); x.fill(); }
      else { x.fillStyle = o.c.casco; x.beginPath(); x.arc(0, y0, R * .4, Math.PI, 0); x.fill(); x.fillStyle = o.c.visiera; x.globalAlpha = .8; x.fillRect(-R * .4, y0 - R * .05, R * .8, R * .1); x.globalAlpha = 1; } },
    ab: function (x, R, o, t) { var tl = o ? o.c.telaio : '#4b5563', lu = o ? o.c.luce : '#fbbf24', f = .75 + .25 * Math.sin(t * 7) * Math.sin(t * 3);
      var gl = x.createRadialGradient(0, R * .1, 0, 0, R * .1, R * 1.1); gl.addColorStop(0, lu); gl.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = .45 * f; x.fillStyle = gl; x.fillRect(-R * 1.2, -R, R * 2.4, R * 2.2); x.globalAlpha = 1;
      x.strokeStyle = tl; x.lineWidth = R * .07; x.beginPath(); x.arc(0, -R * .72, R * .14, 0, 6.2832); x.stroke();
      x.fillStyle = tl; x.fillRect(-R * .32, -R * .6, R * .64, R * .1); x.fillRect(-R * .32, R * .55, R * .64, R * .12);
      x.fillStyle = lu; x.globalAlpha = f; x.beginPath(); x.moveTo(0, R * .4); x.quadraticCurveTo(-R * .16, R * .1, 0, -R * .2); x.quadraticCurveTo(R * .16, R * .1, 0, R * .4); x.fill(); x.globalAlpha = 1;
      x.strokeStyle = tl; x.lineWidth = R * .05; for (var i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(i * R * .3, -R * .5); x.lineTo(i * R * .3, R * .55); x.stroke(); } },
    sb: function (x, R, o, t) { var u = (t % 1.2) / 1.2, px = R * (-1 + u * 2), py = -R * Math.sin(u * Math.PI) * .7 + R * .3;
      if (o) { x.save(); x.globalCompositeOperation = 'lighter'; for (var k = 1; k <= 12; k++) { var uu = Math.max(0, u - k * .025), qx = R * (-1 + uu * 2), qy = -R * Math.sin(uu * Math.PI) * .7 + R * .3;
        x.fillStyle = k % 2 && o.c.nucleo ? o.c.nucleo : o.c.scia; x.globalAlpha = .6 * (1 - k / 13); x.beginPath(); if (o.idx === 1) x.ellipse(qx, qy + k * R * .02, R * .08, R * .05, k, 0, 6.2832); else x.arc(qx, qy, R * .14 * (1 - k / 15), 0, 6.2832); x.fill(); } x.restore(); }
      x.fillStyle = '#1f2937'; x.beginPath(); x.arc(px, py, R * .13, 0, 6.2832); x.fill(); x.strokeStyle = '#9ca3af'; x.lineWidth = R * .03; x.stroke(); },
    bx: function (x, R, o, t) { var gc = o ? o.c.guanto : '#2563eb', pc = o ? o.c.polsino : '#e5e7eb';
      [-1, 1].forEach(function (sd) { x.save(); x.translate(sd * R * .35, Math.sin(t * 4 + sd) * R * .05); x.rotate(sd * .2);
        var g = x.createRadialGradient(-R * .1, -R * .15, R * .05, 0, 0, R * .4); g.addColorStop(0, '#fff'); g.addColorStop(.35, gc); g.addColorStop(1, '#300'); x.fillStyle = g;
        x.beginPath(); x.ellipse(0, -R * .05, R * .3, R * .36, 0, 0, 6.2832); x.fill(); x.fillStyle = pc; x.fillRect(-R * .22, R * .26, R * .44, R * .2); x.restore(); }); },
    bs: function (x, R, o, t) { var sc = o ? o.c.scafo : '#6b7280'; x.translate(0, Math.sin(t * 2) * R * .04);
      x.fillStyle = '#1e3a8a'; x.globalAlpha = .4; x.fillRect(-R * 1.2, R * .3, R * 2.4, R * .3); x.globalAlpha = 1;
      x.fillStyle = sc; x.beginPath(); x.moveTo(-R, R * .1); x.lineTo(R, R * .1); x.lineTo(R * .8, R * .4); x.lineTo(-R * .85, R * .4); x.closePath(); x.fill();
      x.fillRect(-R * .4, -R * .15, R * .7, R * .25); x.fillRect(-R * .1, -R * .4, R * .22, R * .25);
      if (o) { x.fillStyle = o.c.linea; x.fillRect(-R * .95, R * .16, R * 1.88, R * .04); } },
    rv: function (x, R, o, t) { var cn = o ? o.c.canna : '#374151', ca = o ? o.c.calcio : '#3f2a1d';
      var g = x.createLinearGradient(0, -R * .2, 0, R * .1); g.addColorStop(0, '#fff'); g.addColorStop(.4, cn); g.addColorStop(1, '#111'); x.fillStyle = g;
      x.fillRect(-R * .2, -R * .22, R * 1.05, R * .16); x.beginPath(); x.arc(-R * .15, -R * .05, R * .25, 0, 6.2832); x.fill();
      x.fillStyle = ca; x.beginPath(); x.moveTo(-R * .35, -R * .05); x.lineTo(-R * .1, R * .05); x.lineTo(-R * .35, R * .65); x.lineTo(-R * .7, R * .55); x.closePath(); x.fill();
      if (o) { x.strokeStyle = o.c.incisioni; x.lineWidth = R * .02; x.beginPath(); for (var u = 0; u < 1; u += .05) x.lineTo(-R * .05 + u * R * .85, -R * .14 + Math.sin(u * 30) * R * .03); x.stroke(); x.beginPath(); x.arc(-R * .15, -R * .05, R * .15, 0, 6.2832); x.stroke(); } },
    mo: function (x, R, o, t) { var gc = o ? o.c.guanto : '#f2c29b'; x.rotate(Math.sin(t * 3) * .15);
      var g = x.createRadialGradient(-R * .1, -R * .2, R * .05, 0, 0, R * .6); g.addColorStop(0, o ? '#c084fc' : '#ffe2c8'); g.addColorStop(1, o ? '#3b0764' : '#c98a5a'); x.fillStyle = o ? g : gc;
      tondo(x, -R * .35, -R * .25, R * .7, R * .6, R * .2); x.fill(); for (var i = 0; i < 4; i++) { tondo(x, -R * .35 + i * R * .18, -R * .5, R * .15, R * .32, R * .07); x.fill(); }
      tondo(x, -R * .55, -R * .05, R * .25, R * .14, R * .06); x.fill(); if (o) { x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(-R * .35, R * .25, R * .7, R * .08); } }
  };
  var FONDI = { al: ['#3a2a1c', '#0f0a06'], gb: ['#0c2a4a', '#040b16'], dm: ['#2a2420', '#0a0806'], lp: ['#1e1b3a', '#07060f'], pz: ['#3b2a18', '#0f0a05'], kj: ['#3a1d1d', '#0a0505'],
    sx: ['#2a1640', '#08040f'], hc: ['#0d3b2e', '#03110c'], ab: ['#0b1a1f', '#020607'], sb: ['#3a1f14', '#0b0604'], bx: ['#3a1414', '#0b0404'], bs: ['#0c2340', '#030a14'], rv: ['#3a2a14', '#0b0804'], mo: ['#2a1840', '#0a0612'] };
  function scenaOggetto(sl) {
    return function (x, W, H, t, idx, seed, k) {
      var f = FONDI[sl]; fondo(x, W, H, k, f[0], f[1]);
      var R = Math.min(W, H) * (W < 200 ? .36 : .3), cx = W / 2, cy = H * .52 + Math.sin(t * 1.6) * H * .02, o = sk(sl, idx);
      x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(cx, H * .9, R * .9, R * .14, 0, 0, 6.2832); x.fill();
      x.save(); x.translate(cx, cy); try { DIS[sl](x, R, o, t); } catch (e) { } x.restore();
      if (o) luccica(x, cx, cy, R * 1.25, t, o.rarity === 'epic' ? '#d8b4fe' : '#bfdbfe');
      var lp = ((t * .4) % 1.8) - .4; if (lp > 0 && lp < 1) { var g = x.createLinearGradient(W * lp - W * .15, 0, W * lp + W * .15, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    };
  }
  var SC = I.SCENE;
  SC.sn = [scenaSnake, 6.3, 1.2]; SC.pg = [scenaPong, 4.8, .9]; SC.sh = [scenaShove, 3.2, 1.7]; SC.bk = [scenaBasket, 2.4, .7]; SC.su = [scenaSumo, 6.3, .5];
  SC.tk = [scenaTank, 10.4, 1]; SC.ar = [scenaArco, 2.2, .7];
  Object.keys(DIS).forEach(function (sl) { SC[sl] = [scenaOggetto(sl), 6, 1.1]; });
  function giocoSel() { var g = TV3.gioco; if (!g) { try { g = localStorage.getItem('gb_tv3_g'); } catch (e) { } } return GIOCHI.some(function (x) { return x.k === g; }) ? g : 'dadi'; }
  function contaGioco(G, lk, pos) {
    var tot = 0, miei = 0, pronti = 0;
    G.slot.forEach(function (sl) { TVL_SKIN.forEach(function (s) { if (s.slot !== sl) return; tot++; if (pos.indexOf(s.id) >= 0) miei++; var q = I.questDi(s.id); if (q && q.fatta && !q.presa) pronti++; }); });
    return { tot: tot, miei: miei, pronti: pronti };
  }
  TV3.slotsDaMostrare = function () { var g = giocoSel(); for (var i = 0; i < GIOCHI.length; i++) if (GIOCHI[i].k === g) return GIOCHI[i].slot; return ['dd']; };
  TV3.barraGiochi = function (lk, pos) {
    var g = giocoSel(), h = '<div class="tv3g-bar" role="tablist" aria-label="' + esc(L('Giochi', 'Games')) + '">';
    GIOCHI.forEach(function (G) {
      var c = contaGioco(G, lk, pos);
      h += '<button class="tv3g-chip' + (G.k === g ? ' on' : '') + '" role="tab" aria-selected="' + (G.k === g) + '" data-g="' + G.k + '" onclick="TV3.sceltaGioco(\'' + G.k + '\')">'
        + '<img src="' + G.img + '" alt="" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'"><span>' + esc(L(G.it, G.en)) + '</span>'
        + '<em>' + c.miei + '/' + c.tot + '</em>' + (c.pronti ? '<i class="pt" aria-label="' + esc(L('da riscuotere', 'to claim')) + '"></i>' : '') + '</button>';
    });
    h += '</div>';
    var G0 = GIOCHI.filter(function (x) { return x.k === g; })[0];
    if (G0 && !G0.gioco && NUOVI[G0.slot[0]]) h += '<p class="tv3g-nota">' + L('In arrivo nel gioco col prossimo aggiornamento di ' + G0.it + ': intanto lo vedi qui.', 'Coming to ' + G0.en + ' with its next update: you can preview it here.') + '</p>';
    return h;
  };
  TV3.sceltaGioco = function (k) {
    TV3.gioco = k; try { localStorage.setItem('gb_tv3_g', k); } catch (e) { }
    TV3.firma = ''; var host = document.getElementById('cos-cards'); if (host) window.tvlCards(host);
    setTimeout(function () { var b = document.querySelector('.tv3g-chip.on'); if (b && b.scrollIntoView) try { b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (e) { } }, 30);
  };
  try { var tb = document.getElementById('cst-tavolo'); if (tb) tb.textContent = L('Tavolo e giochi', 'Table & games'); } catch (e) { }
  var CSS = ''
    + '#challenges .tv3g-bar{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -2px;padding:2px 2px 4px;scroll-snap-type:x proximity}#challenges .tv3g-bar::-webkit-scrollbar{display:none}'
    + '#challenges .tv3g-chip{all:unset;box-sizing:border-box;flex:none;display:flex;align-items:center;gap:8px;height:44px;padding:0 12px 0 5px;border-radius:22px;cursor:pointer;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 .5px rgba(255,255,255,.12);position:relative;scroll-snap-align:start;-webkit-tap-highlight-color:transparent;transition:background .2s,scale .15s}'
    + '#challenges .tv3g-chip:active{scale:.96}#challenges .tv3g-chip.on{background:#fff}#challenges .tv3g-chip:focus-visible{box-shadow:inset 0 0 0 2px #8b83f0}'
    + '#challenges .tv3g-chip img{width:34px;height:34px;border-radius:17px;object-fit:cover;background:#1c1c1e;display:block}'
    + '#challenges .tv3g-chip span{font:600 14px var(--x-body,system-ui);color:#fff;white-space:nowrap}#challenges .tv3g-chip.on span{color:#000}'
    + '#challenges .tv3g-chip em{font:500 12px var(--x-body,system-ui);font-style:normal;color:#8e8e93;font-variant-numeric:tabular-nums}#challenges .tv3g-chip.on em{color:#636366}'
    + '#challenges .tv3g-chip .pt{position:absolute;top:4px;right:6px;width:8px;height:8px;border-radius:50%;background:#8b83f0;box-shadow:0 0 0 2px #1c1c1e}'
    + '#challenges .tv3g-nota{margin:-8px 4px 0;font:400 12.5px/1.4 var(--x-body,system-ui);color:#8e8e93}';
  try { var st = document.createElement('style'); st.id = 'tv3g-css'; st.textContent = CSS; document.head.appendChild(st); } catch (e) { }
  function tv3Sk(sl, uid, me) {
    try {
      var mx = (TVL_MAX && TVL_MAX[sl]) | 0, v;
      var io = me != null ? me : (window.RTD && RTD.myId);
      if (uid != null && io != null && String(uid) === String(io)) v = tvlLook()[sl] | 0;
      else { var pr = ((window.RTD && RTD.profiles) || {})[uid] || ((window.TKD && TKD.profiles) || {})[uid] || {}; v = ((pr.tvl || {})[sl]) | 0; }
      return (v >= 1 && v <= mx) ? v : 0;
    } catch (e) { return 0; }
  }
  window.tv3Sk = tv3Sk;
  window.tv3SnakeCol = function (uid, i, col) { var v = tv3Sk('sn', uid); return v ? colSerpente(v, i, col) : col; };
  window.tv3Racchetta = function (ctx, uid, cx, py, pw, col, now) {
    var v = tv3Sk('pg', uid); if (!v) return false;
    var a = window.__tv3pg || (window.__tv3pg = {}), p = a[uid], dx = p != null ? cx - p : 0; a[uid] = cx;
    ctx.save(); racchetta(ctx, cx, py, pw, 8, v, col, now / 1000, clamp(dx / 4, -3, 3)); ctx.restore(); return true;
  };
  window.tv3SnwChip = function (uid, j, c) {
    var v = tv3Sk('sn', uid); if (!v) return null;
    var col = colSerpente(v, j, '#38bdf8'), spot = !!(sk('sn', v).c.macchie && j % 3 === 1);
    return cache('snw|' + col + '|' + spot + '|' + Math.round(c * 10), Math.ceil(c * 1.1), Math.ceil(c * 1.1), function (x, s) {
      var r = s / 2 - 1; x.translate(s / 2, s / 2);
      var g = x.createRadialGradient(-r * .3, -r * .35, r * .05, 0, 0, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.3, col); g.addColorStop(1, '#000000');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = Math.max(1, r * .1);
      for (var i = 0; i < 3; i++) { x.beginPath(); x.arc(0, r * (.15 + i * .25), r * .55, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
      if (spot) { x.fillStyle = sk('sn', v).c.macchie; x.beginPath(); x.ellipse(0, 0, r * .45, r * .32, .4, 0, 6.283); x.fill(); }
    });
  };
  window.tv3VisDisco = function (raw, seat, rx, ry, dp) {
    var u = Object.keys((raw && raw.left) || {})[seat], v = u != null ? tv3Sk('sh', u) : 0; if (!v || typeof visSpriteDisco !== 'function') return null;
    var c = sk('sh', v).c, base = visSpriteDisco(c.disco, rx, ry, dp), pad = Math.ceil(rx * .7);
    return cache('visdisco|' + v + '|' + Math.round(rx) + '|' + Math.round(ry), base.width, base.height, function (x, W, H) {
      x.drawImage(base, 0, 0); var cx = W / 2, cy = pad + ry;
      x.strokeStyle = c.bordo; x.lineWidth = Math.max(1.5, rx * .08); x.beginPath(); x.ellipse(cx, cy, rx * .82, ry * .82, 0, 0, 6.2832); x.stroke();
      x.strokeStyle = 'rgba(209,250,229,.35)'; x.lineWidth = Math.max(1, rx * .03); for (var i = 0; i < 3; i++) { x.beginPath(); x.ellipse(cx + rx * .05 * i, cy, rx * (.3 + .1 * i), ry * (.3 + .1 * i), 0, .5 + i, 1.7 + i); x.stroke(); }
    });
  };
  window.tv3Disco = function (raw, seat) { var u = Object.keys((raw && raw.left) || {})[seat]; var v = u != null ? tv3Sk('sh', u) : 0; return v ? sk('sh', v).c : null; };
  window.tv3DiscoDisegna = function (ctx, px, py, R, raw, seat, col) { var u = Object.keys((raw && raw.left) || {})[seat]; var v = u != null ? tv3Sk('sh', u) : 0; if (!v) return false; ctx.save(); disco(ctx, px, py, R, v, col); ctx.restore(); return true; };
  window.tv3Pallone = function (ctx, bx, by, R, uid, rot) { var v = tv3Sk('bk', uid); if (!v) return false; ctx.save(); pallone(ctx, bx, by, R, v, rot); ctx.restore(); return true; };
  window.tv3Mawashi = function (uid) { var v = tv3Sk('su', uid); return v ? sk('su', v).c.cintura : null; };
  window.tv3Freccia = function (raw) { var v = raw && raw.turn != null ? tv3Sk('ar', raw.turn) : 0; return v ? sk('ar', v).c : null; };
  window.tv3Mimetica = function (ctx, uid, L, Wd, me) { var v = tv3Sk('tk', uid, me); if (!v) return; mimetica(ctx, L, Wd, v); };
})();
