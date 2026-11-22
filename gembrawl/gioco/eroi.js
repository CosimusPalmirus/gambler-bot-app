// GAMBLER BRAWL — i 24 eroi: ognuno con ATTACCO, SUPER e GADGET di meccanica UNICA
// (nessun "tipo" si ripete fra due eroi: lo controlla `node banco.js unici`, che fallisce se succede).
// Unità: caselle, secondi, punti vita. k = taratura per modo (taratura.js).
// Campi di disegno: stile = glifo del proiettile/effetto, mov = movimento del corpo, suono = timbro.
// sup.prep / gad.prep = preparazione visibile (runa a terra) prima che parta.
(function (root) {
  'use strict';
  var E = {
    bot: { ruolo: 'supporto', vita: 3300, vel: 2.5,
      att: { tipo: 'slot', danno: 400, inter: 0.06, gitt: 8, pv: 20, rp: 0.2, /* 22/11 vfxcarte: era inter 0.11, pv 17, rp 0.17: la raffica durava 0,22 s e solo 1 gettone su 3 andava a segno (Bot al 3% in duello) */ ric: 1.2, pieno: 900, stile: 'gettone', mov: 'leva', suono: 'slot',
        nome_it: 'Tiro a slot', nome_en: 'Slot Spin', desc_it: 'Gira i rulli e spara tre gettoni in fila: con la coppia o il tris fanno più male, col 777 tutti e tre diventano jackpot potenziati che perforano.', desc_en: 'Spins the reels and fires three tokens in a row: a pair or triple hits harder, and on 777 all three become powered piercing jackpots.' },
      sup: { tipo: 'slot_torretta', carica: 4, prep: 0.3, vita: 2200, danno: 260, gitt: 7, cad: 0.45, dur: 12, pv: 15, stile: 'gettone', mov: 'schiaccia',
        nome_it: 'Slot sentinella', nome_en: 'Sentry Slot', desc_it: 'Piazza una slot che spara gettoni.', desc_en: 'Drops a slot machine that shoots tokens.' },
      gad: { tipo: 'truccato', usi: 3, prep: 0.15, mov: 'salto_posto', nome_it: 'Rulli truccati', nome_en: 'Rigged Reels', desc_it: 'Il prossimo tiro è 777.', desc_en: 'Next spin is 777.' } },

    don: { ruolo: 'tiratore', vita: 3000, vel: 2.5,
      att: { tipo: 'tamburo', danno: 230, n: 7, inter: 0.06, gitt: 8.5, pv: 19, rp: 0.13, ric: 1.7, pieno: 1610, stile: 'proiettile', mov: 'rinculo', suono: 'mitra',
        nome_it: 'Tamburo', nome_en: 'Drum Mag', desc_it: 'Sette colpi che si allargano man mano; l\'ultimo spinge.', desc_en: 'Seven shots that spread wider; the last one pushes.' },
      sup: { tipo: 'famiglia', carica: 3, prep: 0.35, vita: 1600, danno: 220, gitt: 7, cad: 0.45, dur: 7, pv: 18, mov: 'inclina',
        nome_it: 'La Famiglia', nome_en: 'The Family', desc_it: 'Due scagnozzi lo seguono ai fianchi e sparano per lui.', desc_en: 'Two goons flank him and shoot for him.' },
      gad: { tipo: 'ricarica', usi: 3, prep: 0.15, mov: 'avvita', nome_it: 'Caricatore nuovo', nome_en: 'Fresh Mag', desc_it: 'Munizioni subito piene.', desc_en: 'Instantly refills ammo.' } },

    agamennone: { ruolo: 'lanciatore', vita: 3800, vel: 2.45,
      att: { tipo: 'lancia_scagliata', danno: 1000, gitt: 6.2, pv: 15, rp: 0.2, ric: 1.6, cd: 0.4, resta: 3.5, giro: 1.8, danGiro: 120, pieno: 1000, stile: 'lancia', mov: 'lancio_alto', suono: 'lancia', mira: { forma: 'linea', larg: 0.45 },
        nome_it: 'Lancia scagliata', nome_en: 'Thrown Spear', desc_it: 'Scaglia la lancia (pesante: la mano del buttafuori non la ferma): dove si ferma resta piantata a terra. Passaci sopra per riprenderla subito (una tacca in più e un giro di lancia attorno a te), se no torna da sola con la ricarica.', desc_en: 'Hurls the spear (heavy: the Bouncer’s palm cannot stop it): wherever it stops, it stays planted. Walk over it to grab it back at once (one more ammo bar and a spear spin around you), or it comes back with the reload.' },
      sup: (typeof location !== 'undefined' && /[?&]aga=falange(&|$)/.test(location.search)) ? { tipo: 'falange', carica: 4, prep: 0.3, raggio: 4, f: 0.35, dur: 3.5, mov: 'schiaccia',
        nome_it: 'Falange', nome_en: 'Phalanx', desc_it: 'Lui e gli alleati vicini prendono il 35% di danni in meno; lui non si sposta più.', desc_en: 'He and nearby allies take 35% less damage; he can\'t be knocked back.' }
        : { tipo: 'carica_scudo', carica: 4, prep: 0.15, dist: 6, v: 13, danno: 800, spinta: 1.4, stun: 0.5, mov: 'scatto', mira: { forma: 'linea', larg: 1.0, gitt: 6 },   // 22/11 richiesta del proprietario; ?aga=falange = super di prima
          nome_it: 'Carica di bronzo', nome_en: 'Bronze Charge', desc_it: 'Carica in avanti dietro lo scudo: travolge e stordisce chi incontra, para i colpi da davanti e se passa sulla sua lancia la riprende al volo con il giro.', desc_en: 'Charges forward behind his shield: knocks down and stuns anyone in the way, blocks shots from the front, and grabs his spear on the way with a spin.' },
      gad: (typeof location !== 'undefined' && /[?&]aga=carica(&|$)/.test(location.search))
        ? { tipo: 'carica_oplita', usi: 3, prep: 0.12, dist: 3, mov: 'scatto', nome_it: 'Carica dell\'oplita', nome_en: 'Hoplite Charge', desc_it: 'Scatto dietro lo scudo: i colpi da davanti si fermano.', desc_en: 'Shield dash: shots from the front are blocked.' }
        : { tipo: 'muro_scudo', usi: 3, prep: 0.1, dur: 3, ango: 140, lento: 0.5, mov: 'schiaccia', mira: { forma: 'cono', ango: 140, gitt: 1.6 },   // 22/11 richiesta del proprietario; ?aga=carica = gadget di prima
            nome_it: 'Muro di scudo', nome_en: 'Shield Wall', desc_it: 'Alza lo scudo verso una direzione per 3 secondi: para tutti gli attacchi che arrivano da lì. Intanto si muove piano e non attacca.', desc_en: 'Raises his shield in one direction for 3 seconds, blocking every attack from that side. Meanwhile he moves slowly and can\'t attack.' } },

    gladiatrice: { ruolo: 'assassino', vita: 3600, vel: 2.65,
      att: { tipo: 'tridente', danno: 950, gitt: 7.5, pv: 15, rp: 0.2, ric: 1.6, pieno: 950, stile: 'tridente', mov: 'lancio_alto', suono: 'tridente',
        nome_it: 'Tridente', nome_en: 'Trident', desc_it: 'Perfora e tira a sé il primo colpito.', desc_en: 'Pierces and pulls the first one hit toward her.' },
      sup: { tipo: 'rete', carica: 3, prep: 0.2, danno: 500, gitt: 8, pv: 14, rp: 0.5, stun: 1.0, sl: 0.6, slT: 2.5, stile: 'rete', mov: 'giravolta',
        nome_it: 'Rete', nome_en: 'Net', desc_it: 'Immobilizza e poi rallenta forte.', desc_en: 'Roots, then slows hard.' },
      gad: { tipo: 'pollice_verso', usi: 3, prep: 0.15, dur: 5, mov: 'salto_posto', nome_it: 'Pollice verso', nome_en: 'Thumbs Down', desc_it: 'Per 5 s fa danno doppio a chi è sotto il 35%.', desc_en: 'For 5 s, double damage on enemies under 35%.' } },

    pinna: { ruolo: 'tank', vita: 6000, vel: 2.5,
      att: { tipo: 'azzannata', danno: 1300, gitt: 1.8, lunge: 1.3, ango: 70, ric: 1.4, cd: 0.45, pieno: 1300, stile: 'fauci', mov: 'scatto', suono: 'morso',
        nome_it: 'Azzannata', nome_en: 'Lunge Bite', desc_it: 'Balza in avanti e chiude le fauci.', desc_en: 'Lunges forward and snaps its jaws.' },
      sup: { tipo: 'immersione', carica: 3, prep: 0.2, dur: 2.5, area: 1.8, danno: 1400, mov: 'tuffo',
        nome_it: 'Dagli abissi', nome_en: 'From the Deep', desc_it: 'Si immerge (intoccabile), nuota veloce e riemerge mordendo.', desc_en: 'Dives (untouchable), swims fast and bursts out biting.' },
      gad: { tipo: 'frenesia', usi: 3, prep: 0.1, dur: 3, mov: 'inclina', nome_it: 'Fiuto del sangue', nome_en: 'Blood Scent', desc_it: '+35% velocità e vede i feriti anche nei cespugli.', desc_en: '+35% speed and sees wounded enemies even in bushes.' } },

    lupo: { ruolo: 'assassino', vita: 3950, vel: 3.1, agguato: 1.25,
      att: { tipo: 'doppio_artiglio', danno: 420, gitt: 2.3, ango: 90, ric: 0.9, cd: 0.32, sangue: 150, pieno: 840, stile: 'artigli', mov: 'giravolta', suono: 'artigli',
        nome_it: 'Doppio artiglio', nome_en: 'Double Claw', desc_it: 'Combo di zampate: destra, sinistra e una doppia zampata dall\'alto. Fanno sanguinare.', desc_en: 'Claw combo: right, left, then a double overhead swipe. Causes bleeding.' },
      sup: { tipo: 'trasformazione', carica: 4, prep: 0.45, dur: 7, vel: 1.25, dmg: 1.3, vamp: 0.35, ulula: 3.5, paura: 0.6, mov: 'tremante', mira: { forma: 'cerchio', gitt: 3.5 },
        nome_it: 'Luna piena', nome_en: 'Full Moon', desc_it: 'Ulula alla luna (chi è vicino scappa) e si trasforma: più grosso, veloce, feroce, si cura colpendo.', desc_en: 'Howls at the moon (nearby foes flee) and transforms: bigger, faster, fiercer, heals on hit.' },
      gad: { tipo: 'balzo_predatore', usi: 3, prep: 0.12, gitt: 5.2, T: 0.42, area: 1.3, danno: 650, mov: 'balzo', mira: { forma: 'arco', area: 1.3 },
        nome_it: 'Balzo predatore', nome_en: 'Predator Pounce', desc_it: 'Balza dove miri, anche sopra i muri, e atterra artigliando chi c\'è sotto.', desc_en: 'Leaps where you aim, even over walls, and lands clawing whoever is below.' } },

    samurai: { ruolo: 'assassino', vita: 4300, vel: 2.8, agguato: 1.25,
      att: { tipo: 'taglio_lampo', danno: 800, fodero: 0.5, carT: 1.2, gitt: 3.2, largo: 0.5, vdash: 17, ric: 1.5, cd: 0.5, pieno: 1000, stile: 'katana', mov: 'scatto', suono: 'katana', mira: { forma: 'linea', larg: 1.0 },
        nome_it: 'Taglio lampo', nome_en: 'Flash Cut', desc_it: 'Attraversa in un lampo e taglia tutti quelli sulla strada. Più tiene la spada nel fodero, più il taglio fa male (fino a +50%).', desc_en: 'Dashes through in a flash, cutting everyone on the way. The longer the blade stays sheathed, the harder it cuts (up to +50%).' },
      sup: { tipo: 'tre_sette', carica: 3, prep: 0.25, gitt: 7, area: 1.6, T: 0.8, t1: 0.45, passo: 0.32, danno: 650, ultimo: 1250, stun: 0.6, mov: 'salto_posto', mira: { forma: 'punto', area: 1.6 },
        nome_it: 'Tre fendenti 777', nome_en: '777 Triple Slash', desc_it: 'Tre sette si accendono a terra e tre fendenti giganti cadono lì uno dopo l\'altro; il terzo è il più forte e stordisce.', desc_en: 'Three sevens light up on the ground and three giant slashes fall there one after another; the third is the strongest and stuns.' },
      gad: { tipo: 'parata', usi: 3, prep: 0.034, dur: 0.75, danno: 1100, gitt: 3.2, mov: 'salto_posto', mira: { forma: 'cerchio', gitt: 0.9 },
        nome_it: 'Parata', nome_en: 'Parry', desc_it: 'Per tre quarti di secondo para: rimanda i proiettili dritti a chi li ha tirati e risponde con un fendente forte a chi lo colpisce da vicino.', desc_en: 'Parries for three quarters of a second: sends projectiles straight back at the shooter and answers close hits with a strong slash.' } },

    croupier: { ruolo: 'controllo', vita: 3400, vel: 2.55,
      att: { tipo: 'carta_servita', danno: 700, gitt: 9, pv: 20, rp: 0.17, ric: 1.25, mano: 3, scala: 1.25, ventaglio: 22, pieno: 700, stile: 'carta', mov: 'rinculo', suono: 'carta', mira: { forma: 'linea', larg: 0.45 },
        nome_it: 'Carta servita', nome_en: 'Dealt Card', desc_it: 'Una carta dritta e veloce. Ogni carta a segno va nella tua mano (3 al massimo), una a vuoto si brucia. Con tre carte in mano cali la SCALA: tre carte a ventaglio che perforano.', desc_en: 'A fast straight card. Every card that hits goes into your hand (3 max), a miss burns one. With three in hand you lay down a STRAIGHT: three piercing cards in a fan.' },
      sup: { tipo: 'rastrello', carica: 3.5, prep: 0.3, gitt: 7, largo: 0.75, danno: 700, tira: 1.25, stun: 0.35, mov: 'affondo', mira: { forma: 'linea', larg: 1.5 },
        nome_it: 'Rien ne va plus', nome_en: 'Rien ne va plus', desc_it: 'Un rastrello gigante spazza la linea e trascina TUTTI quelli che prende davanti al banco.', desc_en: 'A giant rake sweeps the line and drags EVERYONE it catches right in front of the dealer.' },
      gad: { tipo: 'carta_coperta', usi: 3, prep: 0.15, gitt: 4, arma: 0.6, scatta: 0.85, area: 1.5, danno: 800, sl: 0.3, slT: 1.6, dur: 12, mov: 'lancio_alto', mira: { forma: 'punto', area: 1.5 },
        nome_it: 'Carta coperta', nome_en: 'Face-down Card', desc_it: 'Fa scivolare una carta coperta a terra: dopo un attimo si arma e scoppia sotto chi la calpesta. Una sola in campo.', desc_en: 'Slides a face-down card along the floor: it arms after a moment and blows under whoever steps on it. One at a time.' } },

    buttafuori: { ruolo: 'tank', vita: 5200, vel: 2.85, agguato: 1.25, impavido: 1, portiere: { cd: 1.5, spinta: 0.45, danno: 0 },
      passiva_it: 'Alla porta: chi lo colpisce da vicino in mischia viene respinto con una spinta. Non ha paura di niente.', passiva_en: 'At the door: whoever hits him up close in melee gets shoved back. Fears nothing.',
      att: { tipo: 'manata', danno: 900, gitt: 2.5, ango: 80, spinta: 0.7, alt: 0.12, ric: 1.5, cd: 0.45, pieno: 1000, stile: 'mano', mov: 'affondo', suono: 'schiaffo', mira: { forma: 'cono', ango: 80 },
        nome_it: 'Manata', nome_en: 'Big Palm', desc_it: 'La mano gigante aperta colpisce davanti, respinge e SPEGNE i proiettili che arrivano in quel momento. Non ha paura di niente: l\'ululato non lo fa scappare.', desc_en: 'The giant open hand hits in front, pushes back and STOPS the shots coming in at that moment. Fears nothing: the howl does not make him run.' },
      sup: { tipo: 'fuori_dal_locale', carica: 3, prep: 0.3, dist: 4, vdash: 11, danno: 250, lancio: 5, muro: 350, stun: 0.6, mov: 'scatto', mira: { forma: 'linea', larg: 0.9 },
        nome_it: 'Fuori dal locale!', nome_en: 'Out of the Club!', desc_it: 'Scatta e afferra il primo che trova, poi lo scaraventa lontano dove miri. Contro un muro fa molto più male.', desc_en: 'Dashes and grabs the first one he finds, then hurls him far where you aim. Into a wall it hurts a lot more.' },
      gad: { tipo: 'cordone', usi: 3, prep: 0.15, gitt: 1.4, lungo: 1.4, dur: 3.5, mov: 'schiaccia', mira: { forma: 'punto', area: 0.5, dist: 1.4 },
        nome_it: 'Cordone di velluto', nome_en: 'Velvet Rope', desc_it: 'Pianta un cordone davanti: i nemici ci rimbalzano contro, lui ci passa.', desc_en: 'Plants a rope in front: enemies bounce off it, he walks through.' } },

    ninja: { ruolo: 'assassino', vita: 3000, vel: 2.9,
      att: { tipo: 'shuriken_ombra', danno: 750, gitt: 6.5, pv: 21, rp: 0.16, ric: 1.4, pieno: 750, stile: 'shuriken', mov: 'giravolta', suono: 'shuriken',
        nome_it: 'Shuriken d\'ombra', nome_en: 'Shadow Star', desc_it: 'Se colpisce, il ninja ricompare dietro il bersaglio.', desc_en: 'On hit, the ninja reappears behind the target.' },
      sup: { tipo: 'fumogeno', carica: 3, prep: 0.2, gitt: 5, area: 2.6, dur: 5, sl: 0.35, mov: 'balzo',
        nome_it: 'Fumogeno', nome_en: 'Smoke Bomb', desc_it: 'Nube: gli alleati dentro spariscono, i nemici rallentano.', desc_en: 'Cloud: allies inside vanish, enemies slow down.' },
      gad: { tipo: 'sostituzione', usi: 3, prep: 0.05, dur: 3, invis: 1.2, mov: 'avvita', nome_it: 'Sostituzione', nome_en: 'Substitution', desc_it: 'Lascia un tronco-esca e sparisce per un attimo.', desc_en: 'Leaves a decoy log and vanishes for a moment.' } },

    strega: { ruolo: 'lanciatore', vita: 2800, vel: 2.5,
      att: { tipo: 'dado', danno: 900, gitt: 7, area: 1.4, T: 0.5, ric: 1.6, pieno: 900, stile: 'dado', mov: 'lancio_alto', suono: 'dado',
        nome_it: 'Dado del destino', nome_en: 'Die of Fate', desc_it: 'La faccia decide: 1-2 poco, 3 rallenta, 4 spinge, 5 tanto, 6 esplode due volte.', desc_en: 'The face decides: 1-2 little, 3 slows, 4 pushes, 5 big, 6 explodes twice.' },
      sup: { tipo: 'maledizione', carica: 3, prep: 0.35, gitt: 7.5, area: 2.4, dps: 700, dur: 3.5, sl: 0.4, T: 0.7, mov: 'tremante',
        nome_it: 'Tiro mancino', nome_en: 'Snake Eyes', desc_it: 'Zona maledetta che rallenta e brucia.', desc_en: 'Cursed zone that slows and burns.' },
      gad: { tipo: 'calderone', usi: 3, prep: 0.15, gitt: 3, area: 1.6, hps: 500, dur: 3, mov: 'schiaccia', nome_it: 'Calderone', nome_en: 'Cauldron', desc_it: 'Pentolone che cura chi ci sta vicino.', desc_en: 'A pot that heals whoever stands near it.' } },

    golem: { ruolo: 'tank', vita: 7000, vel: 2.25,
      att: { tipo: 'pila_crollo', danno: 1300, gitt: 6, area: 1.6, T: 0.6, ritardo: 0.45, ric: 1.7, pieno: 1300, stile: 'pila', mov: 'lancio_alto', suono: 'fiches',
        nome_it: 'Pila che crolla', nome_en: 'Toppling Stack', desc_it: 'Lancia una pila di fiches che crolla poco dopo sull\'area.', desc_en: 'Throws a chip stack that topples on the area a moment later.' },
      sup: { tipo: 'fortezza', carica: 3, prep: 0.35, dur: 6, scudo: 0.45, raggio: 2.6, sl: 0.35, mov: 'schiaccia',
        nome_it: 'Fortezza', nome_en: 'Fortress', desc_it: 'Scudo enorme per 6 s e chi gli sta vicino rallenta.', desc_en: 'Huge shield for 6 s; nearby enemies slow down.' },
      gad: { tipo: 'pila', usi: 3, prep: 0.15, mov: 'schiaccia', nome_it: 'Muretto di fiches', nome_en: 'Chip Wall', desc_it: 'Piazza un blocco di fiches davanti a sé.', desc_en: 'Places a chip block in front of him.' } },

    pirata: { ruolo: 'lanciatore', vita: 3300, vel: 2.45,
      att: { tipo: 'palla_rotolante', danno: 900, gitt: 7, pv: 12, rp: 0.35, ric: 1.8, spinta: 1.2, pieno: 900, stile: 'palla', mov: 'rinculo', suono: 'cannone',
        nome_it: 'Palla rotolante', nome_en: 'Rolling Shot', desc_it: 'Rotola, rallenta, travolge e spinge tutti quelli che incontra.', desc_en: 'Rolls, slows, plows through and pushes everyone it meets.' },
      sup: { tipo: 'bordata', carica: 3, prep: 0.35, n: 4, gitt: 9, danno: 1100, area: 1.3, T: 0.7, mov: 'rinculo',
        nome_it: 'Bordata', nome_en: 'Broadside', desc_it: 'Quattro palle di cannone in fila dal galeone.', desc_en: 'Four cannonballs in a row from the galleon.' },
      gad: { tipo: 'barile', usi: 3, prep: 0.12, gitt: 5, area: 1.8, danno: 1200, dur: 4, T: 0.45, mov: 'lancio_basso', nome_it: 'Barile di polvere', nome_en: 'Powder Keg', desc_it: 'Un barile che salta se colpito (o dopo 4 s).', desc_en: 'A keg that blows when shot (or after 4 s).' } },

  };

  // ---- i due tiratori del giro 2 (30/10): dai kit di Smash, adattati alla vista dall'alto
  E.pistolero = { ruolo: 'tiratore', vita: 3100, vel: 2.6,
    att: { tipo: 'colpo_rimbalzo', danno: 600, oro: 1.8, gitt: 9.5, pv: 21, rp: 0.2, ric: 0.95, cd: 0.3, pieno: 600, stile: 'pallottola', mov: 'rinculo', suono: 'revolver', mira: { forma: 'linea', larg: 0.3 },
      nome_it: 'Sei colpi', nome_en: 'Six-Shooter', desc_it: 'Colpo veloce che rimbalza una volta sui muri. Il sesto colpo del tamburo è la pallottola d\'oro: perfora e fa quasi il doppio.', desc_en: 'A fast shot that bounces once off walls. The sixth shot in the cylinder is the golden bullet: it pierces and hits almost twice as hard.' },
    sup: { tipo: 'ventaglio_oro', carica: 3, prep: 0.15, n: 6, inter: 0.05, ango: 50, gitt: 7.5, pv: 22, rp: 0.18, danno: 520, rinculo: 6, mov: 'rinculo_forte', mira: { forma: 'cono', ango: 50 },
      nome_it: 'Ventaglio d\'oro', nome_en: 'Golden Fan', desc_it: 'Svuota il tamburo a raffica: sei pallottole d\'oro a ventaglio che perforano e rimbalzano, e il rinculo lo fa scivolare indietro.', desc_en: 'Fans the hammer: six golden bullets in a spread that pierce and bounce, and the recoil slides him back.' },
    gad: { tipo: 'taglia', usi: 3, prep: 0.12, gitt: 7, pv: 14, rp: 0.3, danno: 150, dur: 6, extra: 1.25, mov: 'lancio_alto', mira: { forma: 'linea', larg: 0.6 },
      nome_it: 'Taglia', nome_en: 'Bounty', desc_it: 'Lancia un manifesto WANTED: chi lo prende è RICERCATO per 6 s, si vede anche nei cespugli e prende il 25% in più dai tuoi colpi.', desc_en: 'Throws a WANTED poster: whoever it hits is WANTED for 6 s, visible even in bushes, and takes 25% more from your shots.' } };

  E.arciere = { ruolo: 'tiratore', vita: 3000, vel: 2.5,
    att: { tipo: 'freccia_lunga', danno: 1200, vicino: 0.75, gitt: 10, pv: 17, rp: 0.14, ric: 1.7, cd: 0.45, pieno: 1200, stile: 'freccia', mov: 'lancio_alto', suono: 'arco', mira: { forma: 'linea', larg: 0.3 },
      nome_it: 'Freccia tesa', nome_en: 'Drawn Arrow', desc_it: 'Freccia lunghissima: più vola, più fa male (tre quarti a bruciapelo, colpo pieno in fondo).', desc_en: 'A very long arrow: the farther it flies, the harder it hits (three quarters point-blank, full damage at the far end).' },
    sup: { tipo: 'freccia_oro', carica: 3, prep: 0.35, gitt: 13, pv: 26, rp: 0.3, danno: 1300, mov: 'lancio_alto', mira: { forma: 'linea', larg: 0.7 },
      nome_it: 'Freccia d\'oro', nome_en: 'Golden Arrow', desc_it: 'Una freccia d\'oro gigante attraversa tutto, anche i muri: trapassa chiunque e lo spinge via.', desc_en: 'A giant golden arrow goes through everything, walls included: it pierces everyone and knocks them back.' },
    gad: { tipo: 'capriola', usi: 3, prep: 0.05, dist: 2.6, T: 0.32, forza: 1, mov: 'avvita', mira: { forma: 'linea', larg: 0.3, gitt: 10 },
      nome_it: 'Capriola', nome_en: 'Backflip', desc_it: 'Capriola all\'indietro, lontano da dove miri, e a mezz\'aria una freccia piena verso la mira.', desc_en: 'Backflips away from where you aim, and in mid-air fires a full-power arrow at the aim.' } };

  // ---- i tre tiratori del giro 4 (01/11): volti scelti da EROI dal cast di Smash, kit adattati alla vista dall'alto
  // 22/11: DAMA DI FIORI (carte). Kit definitivo di CARTE_PROPOSTA.md: seme di rovo, Giardino trappola (fiori nascosti), Siepe; passiva Pollice verde (rovi doppi nei cespugli).
  E.dama = { ruolo: 'lanciatore', vita: 3000, vel: 2.45,
    att: { tipo: 'seme_rovo', danno: 650, gitt: 7, area: 1.2, T: 0.6, rovo: { dur: 2.5, dps: 300, sl: 0.3 }, ric: 1.6, cd: 0.4, pieno: 650, stile: 'seme', mov: 'lancio_alto', suono: 'dado', mira: { forma: 'arco', area: 1.2 },
      nome_it: 'Seme di rovo', nome_en: 'Bramble Seed', desc_it: 'Lancia un seme ad arco, anche sopra i muri: dove cade esplode e nasce un cespuglio di rovi che punge e rallenta per 2,5 secondi.', desc_en: 'Lobs a seed, even over walls: it bursts where it lands and grows a bramble patch that stings and slows for 2.5 seconds.' },
    sup: { tipo: 'giardino_trappola', carica: 3.5, prep: 0.35, gitt: 7, raggio: 2.8, area: 2.8, n: 6, arma: 0.6, nasconde: 1, dur: 10, danno: 700, stun: 0.8, scatta: 0.5, T: 0.55, stile: 'giardino', mov: 'lancio_alto', mira: { forma: 'punto', area: 2.8 },
      nome_it: 'Giardino trappola', nome_en: 'Trap Garden', desc_it: 'Semina 6 fiori nell\'area (anche oltre i muri). Dopo 1 secondo i nemici non li vedono più; per 10 s chi ne calpesta uno resta preso dalle radici e prende 700 danni.', desc_en: 'Sows 6 flowers in the area (even over walls). After 1 second enemies can no longer see them; for 10 s whoever steps on one gets caught by roots and takes 700 damage.' },
    gad: { tipo: 'siepe', usi: 3, prep: 0.15, dist: 1.3, gitt: 1.3, lungo: 3, vita: 1500, dur: 5, danno: 200, mov: 'schiaccia', mira: { forma: 'siepe', dist: 1.3, larg: 3 },
      nome_it: 'Siepe', nome_en: 'Hedge', desc_it: 'Fa crescere davanti a sé una siepe di rovi lunga 3 caselle (1500 di vita, 5 s): i nemici non passano e si pungono (200). I suoi semi la scavalcano.', desc_en: 'Grows a 3-tile bramble hedge in front of her (1500 health, 5 s): enemies can\'t pass and get pricked (200). Her seeds fly over it.' },
    passiva_nome_it: 'Pollice verde', passiva_nome_en: 'Green Thumb', pollice: 2,
    passiva_it: 'I rovi che cadono dentro un cespuglio della mappa durano il doppio.', passiva_en: 'Brambles that land inside a map bush last twice as long.' };

  // 22/11 notte: ASSO DI PICCHE, REGINA DI CUORI, FANTE DI QUADRI (carte), prima versione giocabile (CARTE_PROPOSTA.md + decisione del proprietario sul Fante).
  // Quello che e' provvisorio e' scritto in AVANZAMENTO_integrazione_carte.md.
  E.asso = { ruolo: 'assassino', vita: 3200, vel: 2.75, duello: { raggio: 3, f: 1.2 },
    passiva_it: 'Duello: contro un nemico senza alleati entro 3 caselle fa il 20% in più.', passiva_en: 'Duel: deals 20% more to an enemy with no allies within 3 tiles.',
    att: { tipo: 'stoccata', danno: 1150, gitt: 3.4, larg: 0.35, passo: 0.45, punta: 1.45, ric: 1.8, cd: 0.5, pieno: 1150, stile: 'katana', mov: 'affondo', suono: 'katana', mira: { forma: 'linea', larg: 0.7 },
      nome_it: 'Stoccata', nome_en: 'Thrust', desc_it: 'Un affondo di stocco dritto e sottile, con un passo avanti. Se il nemico è in fondo alla lama è un ASSO: colpo di punta che fa quasi il 50% in più.', desc_en: 'A thin straight rapier thrust with a step forward. If the enemy is at the tip of the blade it is an ACE: a point hit that deals almost 50% more.' },
    sup: { tipo: 'asso_manica', carica: 4, prep: 0.2, gitt: 9, pv: 20, rp: 0.22, danno: 300, marca: 4, dist: 10, v: 18, colpo: 1500, esegui: 0.3, mov: 'lancio_alto', mira: { forma: 'linea', larg: 0.45 },
      nome_it: 'Asso nella manica', nome_en: 'Ace up the Sleeve', desc_it: 'Lancia un asso: chi lo prende resta marcato 4 s. Premi di nuovo la super e l\'Asso scatta fino a lui e lo trafigge (doppio se è sotto il 30%).', desc_en: 'Throws an ace: whoever it hits is marked for 4 s. Press super again and the Ace dashes to them and runs them through (double under 30% health).' },
    gad: { tipo: 'ritirata', usi: 3, prep: 0.05, dist: 2.4, T: 0.25, mov: 'avvita', mira: { forma: 'linea', larg: 0.3, gitt: 2.4 },
      nome_it: 'Ritirata del duellista', nome_en: 'Duelist\'s Retreat', desc_it: 'Salto all\'indietro, lontano da dove miri, e una tacca dell\'attacco subito pronta.', desc_en: 'Leaps back, away from where you aim, and instantly reloads one attack bar.' } };

  E.regina = { ruolo: 'supporto', vita: 3200, vel: 2.5, cuoreRegale: 0.25,
    passiva_it: 'Cuore regale: si cura di un quarto di quanto cura gli altri.', passiva_en: 'Royal heart: heals herself for a quarter of what she heals others.',
    att: { tipo: 'cuore_viandante', danno: 560, cura: 480, gitt: 8, pv: 12, rp: 0.4, ric: 1.4, cd: 0.4, pieno: 560, stile: 'cuore', mov: 'lancio_alto', suono: 'cristallo', mira: { forma: 'linea', larg: 0.8 },
      nome_it: 'Cuore in volo', nome_en: 'Wandering Heart', desc_it: 'Un cuore grande e lento che attraversa tutti: fa male ai nemici e cura gli alleati che tocca.', desc_en: 'A big slow heart that passes through everyone: it hurts enemies and heals the allies it touches.' },
    sup: { tipo: 'pioggia_cuori', carica: 3.5, prep: 0.3, gitt: 7, raggio: 3, dur: 4, ogni: 0.25, area: 1.0, danno: 200, cura: 240, mov: 'tremante', mira: { forma: 'punto', area: 3 },
      nome_it: 'Pioggia di cuori', nome_en: 'Rain of Hearts', desc_it: 'Per 4 secondi piovono cuori su una grande area: feriscono i nemici e curano gli alleati sotto.', desc_en: 'For 4 seconds hearts rain on a large area: they hurt enemies and heal allies underneath.' },
    gad: { tipo: 'grazia_reale', usi: 3, prep: 0.1, mov: 'salto_posto', mira: { forma: 'cerchio', gitt: 1 },
      nome_it: 'Grazia reale', nome_en: 'Royal Grace', desc_it: 'Il prossimo cuore, a fine corsa, torna indietro verso di lei e colpisce o cura una seconda volta.', desc_en: 'Her next heart flies back to her at the end of its path, hitting or healing a second time.' } };

  E.fante = { ruolo: 'assassino', vita: 2800, vel: 3.0, agguato: 1.25,
    corazza: { colpi: 10, dur: 15, scudo: 3500, vel: 2.3, mazzata: { danno: 1100, gitt: 2.2, ango: 100, spinta: 0.7, ric: 1.3 }, esplode: { danno: 500, area: 1.8 } },
    passiva_it: 'Corazza di Quadri: dopo 10 colpi a segno diventa il CAVALIERE per 15 s (corazza che assorbe 3500, niente spinte né stordimenti, attacco Mazzata). Alla fine la corazza esplode.', passiva_en: 'Diamond Armor: after 10 hits he becomes the KNIGHT for 15 s (armor that absorbs 3500, no knockback or stun, Mace Blow attack). At the end the armor explodes.',
    att: { tipo: 'doppio_rombo', danno: 420, gitt: 2.6, ango: 40, secondo: 0.14, rombo: 3, ric: 0.85, cd: 0.3, pieno: 840, stile: 'katana', mov: 'affondo', suono: 'katana', mira: { forma: 'cono', ango: 40 },
      nome_it: 'Doppio rombo', nome_en: 'Double Diamond', desc_it: 'Due affondi rapidi di scettro. Se tutti e due prendono lo stesso nemico gli lascia sopra un rombo rosso per 3 s. Da Cavaliere diventa la Mazzata: un colpo largo che spinge.', desc_en: 'Two quick scepter thrusts. If both hit the same enemy they leave a red diamond on them for 3 s. As the Knight it becomes the Mace Blow: a wide hit that pushes.' },
    sup: { tipo: 'pioggia_quadri', carica: 3.5, prep: 0.2, n: 5, ango: 44, gitt: 7, pv: 14, rp: 0.24, danno: 450, mov: 'giravolta', mira: { forma: 'cono', ango: 44 },
      cav: { dist: 4, v: 13, danno: 700, spinta: 1.3, stun: 0.5, nome_it: 'Carica del Cavaliere', nome_en: 'Knight Charge' },   // 23/11: nome suo (effetto, clip e suono suoi; meccanica oplita del motore)
      nome_it: 'Pioggia di quadri', nome_en: 'Diamond Storm', desc_it: 'Cinque rombi taglienti a ventaglio che tornano indietro come boomerang. Da Cavaliere è la Carica del Cavaliere: corsa dietro lo scudo che travolge e stordisce.', desc_en: 'Five sharp diamonds in a fan that fly back like boomerangs. As the Knight it is the Knight\'s Charge: a shield rush that knocks down and stuns.' },
    gad: { tipo: 'scatto_rombo', usi: 3, prep: 0.05, dist: 3, T: 0.22, scoppio: 600, mov: 'scatto', mira: { forma: 'linea', larg: 0.8, gitt: 3 }, balzo: { gitt: 5, T: 0.55, prep: 0.15, area: 1.4, danno: 900, spinta: 1.8, stun: 0.3, mira: { forma: 'arco', area: 1.4, gitt: 5 }, nome_it: 'Balzo del Cavaliere', nome_en: "Knight's Leap",   /* 23/11 (proprietario): prima era la Spallata */
        desc_it: "Salta dove miri, anche oltre muri e casse, e piomba giù di peso: danno e spinta forte a chi sta vicino al punto d'arrivo, con un breve stordimento. In aria non si può colpire.", desc_en: "Leaps where you aim, even over walls and crates, and slams down: damage and a strong knockback to everyone near the landing spot, with a short stun. Can't be hit in the air." },
      nome_it: 'Scatto a rombo', nome_en: 'Diamond Dash', desc_it: 'Scatto dove miri: se passa su un nemico col rombo rosso, il rombo scoppia. Da Cavaliere è un balzo oltre i muri che piomba giù con uno schianto: danno, spinta e breve stordimento.', desc_en: 'Dashes where you aim: passing over an enemy with the red diamond makes it burst. As the Knight it is a leap over walls that slams down: damage, knockback and a short stun.' } };

  E.pizzaiolo = { ruolo: 'lanciatore', vita: 3300, vel: 2.5,
    att: { tipo: 'pizza_rotante', danno: 1000, tick: 0.5, giro: 0.35, gitt: 7, area: 1.3, T: 0.75, Tmin: 0.2, vicinoT: 3.5, pala: { gitt: 2.4, ango: 130, danno: 850, spinta: 1.4, stun: 0.45, salto: 2.2, T: 0.28 }, sl: 0, slT: 0, ric: 1.6, cd: 0.4, pieno: 1100, stile: 'pizza', mov: 'lancio_alto', suono: 'pizza', mira: { forma: 'arco', area: 1.5 },
      nome_it: 'Pizza al volo', nome_en: 'Flying Pizza', desc_it: 'Lancia una pizza a parabola, anche sopra i muri (da vicino arriva prima): atterra, gira sul posto e colpisce due volte chi c\'è sotto. Se un nemico gli sta addosso, invece della pizza usa la PALA: lo ribalta indietro e lui fa un saltello all\'indietro.', desc_en: 'Lobs a pizza, even over walls (faster up close): it lands, spins in place and hits whoever is under it twice. With an enemy right on him, he swings the PEEL instead: it flips them back and he hops away.' },
    sup: { tipo: 'pizza_gigante', carica: 3, prep: 0.3, gitt: 9, pv: 9, rp: 0.7, danno: 1100, mov: 'schiaccia', mira: { forma: 'linea', larg: 1.4 },
      nome_it: 'Pizza gigante', nome_en: 'Giant Pizza', desc_it: 'Una pizza gigante rotola dritta: travolge e spinge tutti quelli che incontra e sfonda le casse.', desc_en: 'A giant pizza rolls straight ahead: it runs over and pushes everyone it meets and smashes crates.' },
    gad: { tipo: 'pizze_scudo', usi: 3, prep: 0.1, dur: 3, raggio: 1.1, giri: 5, danno: 300, mov: 'giravolta', mira: { forma: 'cerchio', gitt: 1.1 },
      nome_it: 'Pizze in giro', nome_en: 'Orbiting Pizzas', desc_it: 'Per 3 s tre pizze gli girano attorno: distruggono i proiettili nemici che toccano e colpiscono chi è vicino.', desc_en: 'For 3 s three pizzas orbit him: they destroy enemy shots they touch and hit anyone close.' } };

  E.dj = { ruolo: 'tiratore', vita: 3400, vel: 2.6,
    att: { tipo: 'onda_bassi', danno: 760, gitt: 5.2, ango: 48, pieno_entro: 1.0, lontano: 0.6, battito: 15, tempo: 1.3, fuori: 0.55, ric: 1.4, cd: 0.4, pieno: 800, stile: 'onda', mov: 'rinculo', suono: 'bassi', mira: { forma: 'cono', ango: 48 },
      nome_it: 'Onda dei bassi', nome_en: 'Bass Drop Wave', desc_it: 'Un\'onda a cono che prende tutti quelli davanti, più forte da vicino. Spara A TEMPO (sul battito, ogni mezzo secondo): l\'onda è più larga e fa il 30% in più; fuori tempo fa poco più della metà.', desc_en: 'A cone wave that hits everyone in front, stronger up close. Fire ON THE BEAT (every half second): the wave is wider and deals 30% more; off the beat it deals just over half.' },
    sup: { tipo: 'drop', carica: 3, prep: 0.2, raggio: 3.4, danno: 380, drop: 1.6, passo: 0.5, mov: 'schiaccia', mira: { forma: 'cerchio', gitt: 3.4 },
      nome_it: 'Il drop', nome_en: 'The Drop', desc_it: 'Tre onde d\'urto tutto intorno, a tempo di musica; la terza è il DROP: fa più male e spinge lontano.', desc_en: 'Three shockwaves all around, on the beat; the third is the DROP: it hits harder and knocks far back.' },
    gad: { tipo: 'cassa_bassi', usi: 3, prep: 0.15, gitt: 5, vita: 1400, dur: 5, ogni: 0.5, area: 1.9, danno: 160, mov: 'lancio_basso', mira: { forma: 'punto', area: 1.9 },
      nome_it: 'Cassa', nome_en: 'Speaker', desc_it: 'Posa una cassa che pulsa a ogni battito per 5 s e colpisce chi le sta intorno. Una sola in campo; si può distruggere.', desc_en: 'Drops a speaker that pulses on every beat for 5 s, hitting anyone around it. One at a time; it can be destroyed.' } };

  E.veggente = { ruolo: 'tiratore', vita: 2700, vel: 2.45,
    att: { tipo: 'raggio_cristallo', danno: 1350, gitt: 10.5, largo: 0.16, carica: 0.22, ric: 2.0, cd: 0.6, pieno: 1350, stile: 'cristallo', mov: 'lancio_alto', suono: 'cristallo', mira: { forma: 'linea', larg: 0.28 },
      nome_it: 'Raggio di cristallo', nome_en: 'Crystal Beam', desc_it: 'Un attimo di mira (la linea si vede) e poi un raggio istantaneo lunghissimo e sottile, che colpisce il PRIMO che trova. Lento a ricaricare.', desc_en: 'A short aim (the line is visible), then an instant, very long and thin beam that hits the FIRST target it meets. Slow to reload.' },
    sup: { tipo: 'sigilli', carica: 3, prep: 0.3, gitt: 9, area: 1.1, T: 0.8, danno: 1000, mov: 'tremante', mira: { forma: 'cerchio', gitt: 9 },
      nome_it: 'Sigilli del destino', nome_en: 'Seals of Fate', desc_it: 'Un sigillo sotto ogni nemico che vede entro 9 caselle; dopo un attimo lì escono colonne di cristallo. Chi si sposta in tempo le evita.', desc_en: 'A seal under every enemy she sees within 9 tiles; a moment later crystal pillars burst there. Move in time to dodge them.' },
    gad: { tipo: 'tarocco', usi: 3, prep: 0.1, gitt: 7, pv: 16, rp: 0.3, danno: 150, mov: 'lancio_alto', mira: { forma: 'linea', larg: 0.6 },
      nome_it: 'Tarocco', nome_en: 'Tarot Swap', desc_it: 'Lancia un tarocco: se colpisce, lei e il nemico si scambiano di posto.', desc_en: 'Throws a tarot card: if it hits, she and the enemy swap places.' } };

  var RUOLI = {
    tank: { it: 'Tank', en: 'Tank' }, tiratore: { it: 'Tiratore', en: 'Sharpshooter' },
    lanciatore: { it: 'Lanciatore', en: 'Thrower' }, assassino: { it: 'Assassino', en: 'Assassin' },
    supporto: { it: 'Supporto', en: 'Support' }, controllo: { it: 'Controllo', en: 'Controller' }
  };

  // TUTTI = quelli che il motore sa giocare; MOSTRATI = i 6 del lancio (gli unici in menu e fra i bot).
  // ORDINE resta il nome che usano menu e banchi: è uguale a MOSTRATI.
  var TUTTI = ['samurai', 'bot', 'croupier', 'buttafuori', 'agamennone', 'lupo', 'pistolero', 'arciere', 'pizzaiolo', 'dj', 'veggente', 'dama', 'asso', 'regina', 'fante', 'don', 'ninja', 'pirata', 'gladiatrice', 'pinna', 'strega', 'golem'];
  // 8 a distanza (bot, croupier, pistolero, arciere, agamennone, pizzaiolo, dj, veggente) e 3 da mischia (samurai, buttafuori, lupo)
  var MOSTRATI = ['samurai', 'bot', 'croupier', 'buttafuori', 'agamennone', 'lupo', 'pistolero', 'arciere', 'pizzaiolo', 'dj', 'veggente', 'dama', 'asso', 'regina', 'fante'];
  var ORDINE = MOSTRATI;
  var TARA = root.TARATURA_BRAWL || {};
  for (var i = 0; i < TUTTI.length; i++) {
    var id = TUTTI[i], d = E[id];
    d.id = id;
    d.k = TARA.duello && TARA.gemme ? ((TARA.duello[id] || 1) + (TARA.gemme[id] || 1)) / 2 : 1;
    if (!d.att.cd) d.att.cd = 0.4;
    d.pieno = d.att.pieno;
    d.gitt = d.att.gitt || d.att.raggio;
  }
  E.ORDINE = ORDINE; E.MOSTRATI = MOSTRATI; E.TUTTI = TUTTI;
  E.RUOLI = RUOLI;
  root.EROI = E;
  if (typeof module !== 'undefined') module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
