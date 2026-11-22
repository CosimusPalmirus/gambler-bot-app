// GAMBLER BRAWL — mappe.
// Ogni mappa è scritta solo per METÀ (righe in alto + riga centrale): l'altra metà
// si ottiene ruotando di 180°, così le due squadre hanno esattamente lo stesso campo.
// Legenda: '.' pavimento  '#' muro (slot / colonna neon)  'B' cespuglio (palme in vaso)
//          'C' cassa di fiches (si rompe)  'T' acqua (blocca il passo; i colpi ci passano sopra)
// Regola unica: ciò che è ALTO (muri, casse) ferma tutto; ciò che è PIATTO (acqua) ferma solo il passo;
// i cespugli non fermano niente.
//          'G' miniera delle gemme  '2' nascita squadra rossa (in basso diventa '1', blu)
//          'S' nascita SOPRAVVIVENZA
(function (root) {
  'use strict';
  var DEF = [
    {
      // corsia centrale aperta, due corsie laterali coi cespugli, poche coperture a coppie
      id: 'slot', nome_it: 'Sala Slot', nome_en: 'Slot Hall', modi: ['gemme'], tema: 0,
      meta: [
        'BB...............BB',
        'B.....2..2..2.....B',
        '...................',
        '...##.........##...',
        '...................',
        'BB.....C...C.....BB',
        'BB...............BB',
        '......#.....#......',
        '......#.....#......',
        '..TT.....B.....TT..',
        '..TT....BBB....TT..',
        '...................',
        'BB...##.....##...BB',
        'BB.......G.......BB'
      ]
    },
    {
      // fontane (acqua: non si passa, ma ci si spara sopra) e corridoi larghi
      id: 'tavoli', nome_it: 'Le Fontane', nome_en: 'The Fountains', modi: ['gemme'], tema: 1,
      meta: [
        'TT.......#.......TT',
        'T.....2..2..2.....T',
        '...................',
        'BBB.....###.....BBB',
        'BBB.............BBB',
        '...................',
        '....C.........C....',
        '..##.....T.....##..',
        '..##....TTT....##..',
        '...................',
        'BB......BBB......BB',
        'BB.......B.......BB',
        '.....#.......#.....',
        '...C.....G.....C...'
      ]
    },
    {
      id: 'vicolo', nome_it: 'Vicolo Neon', nome_en: 'Neon Alley', modi: ['duello'], tema: 2,
      meta: [
        'BBB....#....BBB',
        'BB.....2.....BB',
        '...C.......C...',
        '..##...B...##..',
        '......BBB......',
        '.T...........T.',
        '.T...##.##...T.',
        '......C.C......',
        'BB...........BB',
        'BB....#.#....BB'
      ]
    },
    {
      id: 'roulette', nome_it: 'Sala Roulette', nome_en: 'Roulette Room', modi: ['duello'], tema: 1,
      meta: [
        '...B...#...B...',
        '..BB...2...BB..',
        '...............',
        '.##.........##.',
        '...TT.....TT...',
        'B..C.......C..B',
        'BB....#.#....BB',
        '...............',
        '..##.BBBBB.##..',
        'C.....#.#.....C'
      ]
    },
    {
      id: 'caveau', nome_it: 'Il Caveau', nome_en: 'The Vault', modi: ['sopravvivenza'], tema: 3,
      meta: [
        'BB.........S.........BB',
        'B.....................B',
        '..S...C.........C...S..',
        '....###.........###....',
        '....#....BBBBB....#....',
        'BB.......BBBBB.......BB',
        'BB...TT.........TT...BB',
        '.....TT...CCC...TT.....',
        '..........#.#..........',
        '..##.....BB.BB.....##..',
        '..#......B...B......#..',
        'BB....C....#....C....BB'
      ]
    },
    {
      // 23/11 CANYON DEL JACKPOT: la mappa grande della sopravvivenza (6 giocatori, 31x35 contro 23x23 del Caveau).
      // Le 6 nascite stanno sui vertici di un esagono: 14 caselle dal centro e 14 dalle vicine, ognuna con lo stesso
      // campo (2 casse ai lati, salvia dietro, costone di roccia a V davanti). Fra due vicine una zona contesa
      // (2 casse nella salvia), al centro la piazza del pozzo con 4 casse. Oasi negli angoli (nessuna cassa: zona morta).
      // Simmetrica a specchio sui due assi. Costruita da strumenti/mappa_canyon_2311.js. Gas proprio (più lento, danno che cresce).
      id: 'canyon', nome_it: 'Canyon del Jackpot', nome_en: 'Jackpot Canyon', modi: ['sopravvivenza'], tema: 4,
      gas: { t0: 30, dur: 145, fin: 3, d0: 330, d1: 900, piu: 120 },   // parte a 30 s, chiusa a 175 s (zona finale 6x6 attorno al pozzo)
      meta: [
        'TTTTB..#......BBB......#..BTTTT',
        'TTTTB..#...##.....##...#..BTTTT',
        'TTTB......BB.......BB......BTTT',
        'TTB.......B....S....B.......BTT',
        'BB..........C.....C..........BB',
        '.....B...B...........B...B.....',
        '....B.B.BBB.#.....#.BBB.B.B....',
        '##......B.CB.#...#.BC.B......##',
        '.....C...C...#####...C...C.....',
        '.......#.B...........B.#.......',
        '...S....#...B.....B...#....S...',
        '........#..BB.....BB..#........',
        '........#..BBB...BBB..#........',
        '#.C....#...##.....##...#....C.#',
        '#...###....#.......#....###...#',
        '.B..........BB.C.BB..........B.',
        'B..BCB...................BCB..B',
        'BBBB....BBB..C.T.C..BBB....BBBB'
      ]
    }
  ];

  var COD = { '.': 0, '#': 1, 'B': 2, 'C': 3, 'T': 4, 'G': 0, '1': 0, '2': 0, 'S': 0 };

  function rovescia(s) { return s.split('').reverse().join(''); }

  // Ricostruisce la mappa intera e la converte in griglia numerica.
  function costruisci(d) {
    var meta = d.meta, n = meta.length - 1, w = meta[0].length, righe = [], i;
    for (i = 0; i <= n; i++) {
      if (meta[i].length !== w) throw new Error('mappa ' + d.id + ': riga ' + i + ' lunga ' + meta[i].length);
      righe.push(meta[i]);
    }
    if (rovescia(meta[n]) !== meta[n]) throw new Error('mappa ' + d.id + ': riga centrale non simmetrica');
    for (i = n - 1; i >= 0; i--) righe.push(rovescia(meta[i]).replace(/2/g, '1'));
    var h = righe.length, g = new Array(w * h), sp = [[], []], ffa = [], gem = null, r, c, ch;
    for (r = 0; r < h; r++) for (c = 0; c < w; c++) {
      ch = righe[r][c];
      if (!(ch in COD)) throw new Error('mappa ' + d.id + ': simbolo ' + ch);
      g[r * w + c] = COD[ch];
      if (ch === '1') sp[0].push({ x: c + 0.5, y: r + 0.5 });
      if (ch === '2') sp[1].push({ x: c + 0.5, y: r + 0.5 });
      if (ch === 'S') ffa.push({ x: c + 0.5, y: r + 0.5 });
      if (ch === 'G') gem = { x: c + 0.5, y: r + 0.5 };
    }
    // nascite della squadra blu: stesso ordine (da sinistra) della rossa ruotata
    sp[0].sort(function (a, b) { return b.x - a.x; });
    return { id: d.id, nome_it: d.nome_it, nome_en: d.nome_en, modi: d.modi, tema: d.tema, w: w, h: h, g: g, sp: sp, ffa: ffa, gem: gem, righe: righe, gas: d.gas || null };   // 23/11: gas proprio della mappa (sopravvivenza)
  }

  var MAPPE = {};
  for (var k = 0; k < DEF.length; k++) MAPPE[DEF[k].id] = costruisci(DEF[k]);
  // ?mappa=<id> nella pagina forza quella mappa (se va bene per il modo): serve alle foto e alle prove
  var FORZA = null;
  try { FORZA = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('mappa') : null; } catch (e) { FORZA = null; }
  MAPPE.perModo = function (modo) {
    var out = [];
    if (FORZA && MAPPE[FORZA] && MAPPE[FORZA].modi && MAPPE[FORZA].modi.indexOf(modo) >= 0) return [MAPPE[FORZA]];
    for (var j = 0; j < DEF.length; j++) if (DEF[j].modi.indexOf(modo) >= 0) out.push(MAPPE[DEF[j].id]);
    return out;
  };
  root.MAPPE = MAPPE;
  if (typeof module !== 'undefined') module.exports = MAPPE;
})(typeof window !== 'undefined' ? window : globalThis);
