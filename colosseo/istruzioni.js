/* colosseo/istruzioni.js — COME SI COMBATTE NEL COLOSSEO (20/09/2026)
   UNA SOLA FONTE per il pannello del Colosseo (index.html, coltOpen). Si scarica solo quando si apre il
   pannello; le mini clip (colosseo/clip/*.mp4, 400x400, senza audio, 3-4,5 s in loop) partono solo quando la
   loro riga entra nel riquadro. Ogni numero e' stato letto sul motore VERO che gira sul VPS
   (gladiator_rt.py f50eeea5): se cambia una regola, si cambia QUI, con fai_testi.py.
   ⚠️ Solo virgolette doppie per le stringhe; l'apostrofo nei testi e' quello tipografico (’).
   Riga: ic icona · clip (facoltativa: colosseo/clip/<clip>.mp4 + .webm + .jpg) · it/en: t titolo · d testo. */
var COL_ISTR = {
  v: "2009a",
  ui: {"it": {"hd": "🏛️ COLOSSEO — COME SI COMBATTE", "chiudi": "✖ CHIUDI", "capito": "▶️ HO CAPITO", "carica": "Carico la guida…", "rotto": "La guida non si è caricata. Controlla la connessione e riprova."}, "en": {"hd": "🏛️ COLOSSEUM — HOW TO FIGHT", "chiudi": "✖ CLOSE", "capito": "▶️ GOT IT", "carica": "Loading the guide…", "rotto": "The guide did not load. Check your connection and try again."}},
  schede: [
    { k: "combattere", it: "⚔️ COMBATTERE", en: "⚔️ FIGHTING", righe: [
      { ic: "🕹️", clip: "comandi", it: { t: "DUE LEVETTE, DUE MESTIERI", d: "Sinistra: ti muovi. Destra: punti la spada, e IL COLPO PARTE QUANDO LASCI. Poi tre tasti: 🛡️ SCUDO (si tiene premuto), 💨 SCH e 🔱 SPEC." },
        en: { t: "TWO STICKS, TWO JOBS", d: "Left: you move. Right: you point the sword, and THE BLOW LEAVES WHEN YOU LET GO. Then three buttons: 🛡️ SHIELD (hold it down), 💨 DODGE and 🔱 SPECIAL." } },
      { ic: "⚔️", clip: "fendente", it: { t: "IL FENDENTE HA TRE TEMPI", d: "Carica 0,32 s, colpo 0,10, recupero 0,25. Nella carica ti leggono, nel recupero sei scoperto. La direzione si sceglie prima: a colpo partito non ti giri più." },
        en: { t: "THE SWING HAS THREE BEATS", d: "Wind-up 0.32 s, strike 0.10, recovery 0.25. In the wind-up they read you, in the recovery you are open. Pick your direction first: once it starts, no turning." } },
      { ic: "🛡️", clip: "scudo", it: { t: "LO SCUDO COPRE SOLO DAVANTI", d: "Alzato ferma i colpi frontali, ma cammini al 45%. Di lato e alle spalle non copre: nella clip il primo colpo muore sullo scudo, il secondo arriva di fianco." },
        en: { t: "THE SHIELD COVERS THE FRONT ONLY", d: "Held up it stops frontal blows, but you walk at 45%. From the side or behind it covers nothing: in the clip the first blow dies on it, the second comes from the flank." } },
      { ic: "✋", clip: "parata", it: { t: "LA PARATA E IL CONTRATTACCO", d: "Dura 0,22 s e comincia quando ALZI lo scudo. Se ci prendi dentro il colpo, l’altro resta stordito 1,4 s: colpo gratis. Fra due parate c’è mezzo secondo." },
        en: { t: "THE PARRY AND THE COUNTER", d: "It lasts 0.22 s and starts when you RAISE the shield. Catch the blow inside it and he is stunned for 1.4 s: a free hit. Half a second between two parries." } },
      { ic: "🎭", clip: "finta", it: { t: "LA FINTA", d: "Tocca lo scudo entro 0,12 s dal fendente: il colpo si annulla e passi in guardia. Chi ti legge para a vuoto, e il colpo vero lo dai dopo." },
        en: { t: "THE FEINT", d: "Touch the shield within 0.12 s of a swing: it is cancelled into a guard. Whoever reads you parries thin air, and the real blow comes after." } },
      { ic: "🔱", clip: "speciale", it: { t: "LO SPECIALE SFONDA LA GUARDIA", d: "L’unica mossa che passa scudo e parata: due cuori, e ti lancia in avanti. Carica 0,55 s, visibile da lontano, ricarica 4,5 s: la più lenta del gioco." },
        en: { t: "THE SPECIAL BREAKS THE GUARD", d: "The one move that goes through shield and parry: two hearts, and it throws you forward. Charge 0.55 s, visible from afar, cooldown 4.5 s — the slowest there is." } },
      { ic: "💨", clip: "schivata", it: { t: "LA SCHIVATA BATTE TUTTO", d: "Uno scatto di due celle con 0,30 s di invulnerabilità: non ti prende niente, nemmeno lo speciale. Si ricarica in 1,6 s." },
        en: { t: "THE DODGE BEATS EVERYTHING", d: "A two-cell dash with 0.30 s of invulnerability: nothing touches you, not even the special. It recharges in 1.6 s." } },
      { ic: "⚖️", it: { t: "IL TRIANGOLO", d: "L’attacco perde con la parata. Parata e riccio perdono con lo speciale. Lo speciale perde con la schivata. Nessuna mossa vince sempre." },
        en: { t: "THE TRIANGLE", d: "Attack loses to parry. Parry and turtling lose to the special. The special loses to the dodge. No move wins every time." } },
      { ic: "❤️", it: { t: "QUATTRO CUORI, POI FUORI", d: "Quattro cuori, e ogni colpo ne toglie almeno uno. Appena colpito hai 0,6 s di invulnerabilità: una raffica sola non ti cancella." },
        en: { t: "FOUR HEARTS, THEN YOU ARE OUT", d: "Four hearts, and every blow takes at least one. Once hit you get 0.6 s of invulnerability: a single flurry cannot wipe you out." } }
    ] },
    { k: "armi", it: "🗡️ LE ARMI", en: "🗡️ WEAPONS", righe: [
      { ic: "⚔️", clip: "fendente", it: { t: "IL GLADIO — SEMPRE CON TE", d: "La spada di serie: un cuore di danno, una cella e mezza di portata, 0,67 s fra un colpo e l’altro. È l’unico colpo che si può parare." },
        en: { t: "THE GLADIUS — ALWAYS WITH YOU", d: "The standard sword: one heart of damage, a cell and a half of reach, 0.67 s between blows. It is the only blow that can be parried." } },
      { ic: "🛡️", clip: "scudo", it: { t: "LO SCUDO — DIFESA E CONTRO", d: "Tenuto alzato rallenta al 45%; alzato a tempo stordisce. Finestra 0,22 s, stordimento 1,4 s, pausa fra due parate 0,50 s." },
        en: { t: "THE SHIELD — DEFENCE AND COUNTER", d: "Held up it slows you to 45%; raised on time it stuns. Window 0.22 s, stun 1.4 s, pause between parries 0.50 s." } },
      { ic: "🔱", clip: "speciale", it: { t: "L’AFFONDO SPECIALE — IMPARABILE", d: "Due cuori, quasi quattro celle con lo slancio, e passa scudo e parata. Carica 0,55 s, ricarica 4,5 s: usalo quando l’altro è impegnato." },
        en: { t: "THE SPECIAL LUNGE — UNBLOCKABLE", d: "Two hearts, almost four cells with the lunge, and it goes through shield and parry. Charge 0.55 s, cooldown 4.5 s: use it when he is busy." } },
      { ic: "🗡️", clip: "pilum", it: { t: "IL PILUM — LA LANCIA DELLA FOLLA", d: "La folla getta una lancia sulla sabbia e la raccoglie chi passa più vicino. Da lì la levetta non colpisce: LANCIA. Un secondo di carica, due cuori, venti celle al secondo." },
        en: { t: "THE PILUM — THE CROWD’S SPEAR", d: "The crowd hurls a spear onto the sand and whoever walks closest picks it up. From then the stick does not swing: it THROWS. One second of charge, two hearts, twenty cells a second." } },
      { ic: "✋", clip: "pilum_parata", it: { t: "LA LANCIA SI PUÒ PARARE", d: "Lo scudo tenuto alzato non la ferma: serve una parata A TEMPO, rivolta verso la lancia. Se ci riesci la lancia cade ai tuoi piedi ed è tua." },
        en: { t: "THE SPEAR CAN BE PARRIED", d: "A shield merely held up does not stop it: you need a TIMED parry, facing the spear. Manage it and it drops at your feet and it is yours." } },
      { ic: "🎪", it: { t: "QUANDO ARRIVA LA LANCIA", d: "La prima fra il sedicesimo e il ventiquattresimo secondo, poi un’altra ogni volta che la vecchia esce. A terra sparisce dopo 12 s; in mano parte da sola dopo 8." },
        en: { t: "WHEN THE SPEAR COMES", d: "The first between the sixteenth and the twenty-fourth second, then another every time the old one leaves. On the sand it fades after 12 s; in hand it flies off after 8." } },
      { ic: "🎨", it: { t: "LE LAME DELL’EDITOR SONO SOLO ASPETTO", d: "Sica, Hasta, Gladio massiccio: cambiano il disegno e basta. Portata, danno e tempi sono identici per tutti. Qui si vince col tempismo." },
        en: { t: "THE EDITOR’S BLADES ARE LOOKS ONLY", d: "Sica, Hasta, heavy Gladius: they change the drawing and nothing else. Reach, damage and timings are identical for everyone. Timing wins here." } }
    ] },
    { k: "arena", it: "🏟️ L’ARENA", en: "🏟️ THE ARENA", righe: [
      { ic: "🏛️", clip: "colonna", it: { t: "LE COLONNE SONO RIPARO", d: "Fermano i corpi e fermano le lance: rompi la linea di tiro e rifiata. Ma se ci sbatti contro mentre voli, resti stordito un istante." },
        en: { t: "THE COLUMNS ARE COVER", d: "They stop bodies and they stop spears: break the line of fire and catch your breath. But smash into one while flying and you are stunned for a moment." } },
      { ic: "⭕", clip: "cerchio", it: { t: "IL CERCHIO SI STRINGE", d: "Trenta secondi e l’arena è tutta tua. Poi il bordo si chiude e non si ferma più: a tre minuti dal via al centro resta un fazzoletto di sabbia." },
        en: { t: "THE CIRCLE CLOSES IN", d: "Thirty seconds and the arena is all yours. Then the rim closes in and never stops: three minutes from the start, a handkerchief of sand is all that is left." } },
      { ic: "🔥", clip: "lava", it: { t: "FUORI DAL CERCHIO C’È LA LAVA", d: "Restare fuori non è una tattica: un cuore ogni 0,8 secondi finché non rientri. Il bordo si vede sulla sabbia e nell’indicatore in alto." },
        en: { t: "OUTSIDE THE CIRCLE THERE IS LAVA", d: "Staying outside is not a tactic: one heart every 0.8 seconds until you step back in. The rim shows on the sand and in the indicator on top." } },
      { ic: "💀", it: { t: "MORTE IMPROVVISA", d: "Oltre i tre minuti e un quarto l’arena smette di aspettare: tutti perdono un cuore ogni tre secondi, anche al centro. Nascondersi non serve." },
        en: { t: "SUDDEN DEATH", d: "Past three and a quarter minutes the arena stops waiting: everyone loses a heart every three seconds, even in the middle. Hiding gets you nowhere." } },
      { ic: "👥", clip: "mischia", it: { t: "IN DUE O IN OTTO", d: "Da 2 a 8, e l’arena cambia con voi: in due sette celle e mezza con tre colonne, in otto tredici e mezza con cinque. In mischia conviene far consumare gli altri." },
        en: { t: "TWO OR EIGHT", d: "From 2 to 8, and the arena changes with you: for two, seven and a half cells and three columns; for eight, thirteen and a half and five. In a brawl, let them wear each other down." } },
      { ic: "🏆", clip: "vittoria", it: { t: "VINCE L’ULTIMO IN PIEDI", d: "Niente punti e niente tempo scaduto: si resta in piedi. Quando cade il penultimo, la partita è tua." },
        en: { t: "THE LAST ONE STANDING WINS", d: "No points and no final whistle: you stay standing. When the second-to-last falls, the match is yours." } }
    ] },
    { k: "comandi", it: "📱 COMANDI E SOLDI", en: "📱 CONTROLS AND MONEY", righe: [
      { ic: "📱", clip: "comandi", it: { t: "I COMANDI DEL TELEFONO", d: "In basso a sinistra la levetta che ti muove, a destra quella della spada. Sopra: 🔱 SPEC, 🛡️ SCUDO (si tiene premuto) e 💨 SCH. Gli anelli sono le ricariche." },
        en: { t: "THE PHONE CONTROLS", d: "Bottom left the stick that moves you, bottom right the sword one. Above: 🔱 SPEC, 🛡️ SHIELD (hold it down) and 💨 DODGE. The rings are the cooldowns." } },
      { ic: "🖥️", it: { t: "DA PC SI GIOCA COL MOUSE", d: "Sul computer i comandi sono gli stessi: trascini le levette col mouse e tieni premuto SCUDO. Nel Colosseo la tastiera non fa niente." },
        en: { t: "ON A PC YOU PLAY WITH THE MOUSE", d: "On a computer the controls are the same: drag the sticks with the mouse and hold the SHIELD button. In the Colosseum the keyboard does nothing." } },
      { ic: "🔄", clip: "orizzontale", it: { t: "TELEFONO IN ORIZZONTALE", d: "Gira il telefono e l’arena si allarga senza fermare la partita: levetta a sinistra, tasti a destra, cuori in alto. Stesso pezzo di arena: nessun vantaggio." },
        en: { t: "PHONE IN LANDSCAPE", d: "Turn your phone and the arena widens without stopping the match: stick left, buttons right, hearts on top. Same piece of arena: no advantage." } },
      { ic: "🤖", clip: "allenati", it: { t: "ALLENATI COI BOT, GRATIS", d: "Il tasto 🤖 ALLENATI apre una partita contro i bot: niente posta, niente premio. E i bot combattono davvero: parano, schivano, prendono la lancia." },
        en: { t: "TRAIN AGAINST THE BOTS, FREE", d: "The 🤖 TRAIN button opens a match against bots: no stake, no prize. And the bots really fight: they parry, they dodge, they grab the spear." } },
      { ic: "💰", it: { t: "LA POSTA", d: "Buy-in da 1 a 50 euro, uguale per tutti. Si parte con almeno due gladiatori; se resti solo, la posta ti torna indietro." },
        en: { t: "THE STAKE", d: "Buy-in from 1 to 50 euro, the same for everyone. A match starts with at least two gladiators; if you end up alone, your stake comes back." } },
      { ic: "🏆", it: { t: "IL PIATTO", d: "L’ultimo in piedi prende il 92% del piatto, l’8% va alla casa. Non ci sono premi per i piazzati." },
        en: { t: "THE POT", d: "The last one standing takes 92% of the pot, 8% goes to the house. There are no prizes for runners-up." } },
      { ic: "📣", it: { t: "LOBBY E TORNEI", d: "Con 📣 CREA LOBBY inviti il tuo gruppo nella stessa arena. Nei tornei si entra col biglietto: chi vince passa al turno dopo, gli altri guardano." },
        en: { t: "LOBBIES AND TOURNAMENTS", d: "With 📣 CREATE LOBBY you invite your group into the same arena. In tournaments you enter with a ticket: the winner goes through, the others watch." } }
    ] }
  ]
};
if (typeof window !== "undefined") window.COL_ISTR = COL_ISTR;
