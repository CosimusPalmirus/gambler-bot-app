/* gcr/istruzioni.js — COME SI GIOCA A GAMBLER CITY ROYALE (v2, 19/09/2026: la FUSIONE)
   UNA SOLA FONTE per il pannello della lobby del turf (index.html, gcrtOpen). Si scarica solo quando
   si apre il pannello; le mini clip (gcr/clip/*.mp4, 400x400, senza audio, 2-4 s in loop) partono solo
   quando la loro riga entra nel riquadro. Ogni riga e' stata controllata sul motore che gira sul server
   (v2: turfwar_rt.py 93d5b4c7 della fusione, turfwar_rt_server.py 365f2f10): se cambia una regola, si cambia QUI.
   v2: cecchino al rilascio col fiato, scale col tasto ▲/▼, airdrop e partenze sui tetti, bot tattici, avvio in 3D,
   nomi sopra la testa, PC con mouse e WASD. Le clip nuove sono girate sul server 365f2f10 col motore della fusione.
   ⚠️ Solo virgolette doppie per le stringhe; l'apostrofo nei testi e' quello tipografico (’).
   Riga: ic icona · clip (facoltativa: gcr/clip/<clip>.mp4 + .jpg) · it/en: t titolo · d testo. */
var GCR_ISTR = {
  v: "1909b",
  schede: [
    { k: "partita", it: "📜 LA PARTITA", en: "📜 THE GAME", righe: [
      { ic: "🎯",
        it: { t: "LO SCOPO", d: "Da 2 a 10 gangster sulla stessa città: vince l’ultimo in piedi. Si parte con 3 ❤️ (al massimo 5). Sopra la testa di ognuno ci sono il nome e il livello." },
        en: { t: "THE GOAL", d: "2 to 10 gangsters in the same city: the last one standing wins. You start with 3 ❤️ (5 at most). Everyone’s name and level float above their head." } },
      { ic: "🪂", clip: "paracadute",
        it: { t: "LA PARTENZA", d: "Si scende in città col paracadute. Nelle partite da 4 giocatori in su circa uno su tre atterra sul tetto di un palazzo, gli altri in strada: al VIA! si parte." },
        en: { t: "THE DROP", d: "You drop into the city by parachute. In matches of 4 or more players about one in three lands on a rooftop, the others in the street: go on GO!" } },
      { ic: "🕹️",
        it: { t: "I COMANDI", d: "Levetta sinistra: ti muovi. Levetta destra: miri, e con le armi da fuoco il colpo parte da solo mentre miri; col fucile invece tieni e poi lasci (vedi LA CITTÀ). Senza arma da fuoco colpisci da vicino: pugni, coltello o mazza. Gli oggetti sono i tasti accanto alla levetta destra: granata e molotov si trascinano per mirare il lancio e si lasciano per lanciare. Su PC: WASD o frecce per muoverti, tieni premuto il mouse sulla città per mirare e lascia per sparare, E per il tasto della scala." },
        en: { t: "CONTROLS", d: "Left stick: move. Right stick: aim, and with guns the shot fires by itself while you aim; with the rifle you hold and then release instead (see THE CITY). Without a gun you hit up close: fists, knife or bat. Items are the buttons next to the right stick: drag a grenade or molotov to aim the throw, release to throw. On a PC: WASD or arrows to move, hold the mouse on the city to aim and release to shoot, E for the stairs button." } },
      { ic: "📦", clip: "cassa",
        it: { t: "CASSE E ARMI", d: "Cammina su una cassa per prendere quello che c’è dentro. Se hai già un’arma compare il tasto SCAMBIA: la nuova va in mano e la tua resta nella cassa per chi passa. Armi: pistola, SMG, Uzi, doppietta, mitragliatrice, magnum, fucile, lanciarazzi. Oggetti: medikit, giubbotto, granata, molotov, fumogeno, trappola, soffiata (vedi tutti per 4 s). Le casse d’oro hanno la roba migliore." },
        en: { t: "CRATES AND GUNS", d: "Walk onto a crate to take what is inside. If you already hold a gun, the SWAP button appears: the new one goes in your hands and yours stays in the crate for whoever comes next. Guns: pistol, SMG, Uzi, shotgun, machine gun, magnum, rifle, rocket launcher. Items: medkit, vest, grenade, molotov, smoke, trap, tip-off (see everyone for 4 s). Gold crates hold the best loot." } },
      { ic: "⬆️",
        it: { t: "SALI DI LIVELLO", d: "Ogni uccisione dà 3 XP, ogni cassa 1 (quella d’oro 2). A ogni livello guadagni 1 ❤️ e un po’ di velocità." },
        en: { t: "LEVEL UP", d: "Every kill gives 3 XP, every crate 1 (a gold one 2). Each level gives you 1 ❤️ and a bit of speed." } },
      { ic: "☢️", clip: "zona",
        it: { t: "LA ZONA", d: "Dopo 25-60 secondi (più la città è grande, più tardi) un anello rosso si stringe verso il centro, uno ogni 10-13 secondi circa. Dentro il rosso perdi cuori, e i palazzi che tocca prendono fuoco. Quando la zona è al minimo brucia tutta la città, finché ne resta uno solo." },
        en: { t: "THE ZONE", d: "After 25-60 seconds (the bigger the city, the later) a red ring closes in toward the centre, one step every 10-13 seconds or so. Inside the red you lose hearts, and the buildings it touches catch fire. When the zone is at its smallest the whole city burns, until only one is left." } },
      { ic: "🚁",
        it: { t: "GLI EVENTI", d: "Undici sorprese, annunciate qualche secondo prima: airdrop (una cassa d’oro cade sulla X; una volta su tre su un tetto), retata (una pattuglia spazza una via: nasconditi), blackout, taglia, rifornimento, bombardamento, adrenalina, corsa all’oro, terremoto, elicottero, convoglio." },
        en: { t: "EVENTS", d: "Eleven surprises, announced a few seconds ahead: airdrop (a gold crate lands on the X; one time in three on a rooftop), raid (a patrol sweeps a street: hide), blackout, bounty, resupply, shelling, adrenaline, gold rush, earthquake, helicopter, convoy." } },
      { ic: "🎁", clip: "airdrop",
        it: { t: "AIRDROP SUL TETTO", d: "Quando l’airdrop cade su un tetto il cartello dice «🚁 AIRDROP SUL TETTO»: la X compare sul tetto e la cassa d’oro scende col paracadute. Per prenderla si sale dalla scala di quel palazzo." },
        en: { t: "ROOFTOP AIRDROP", d: "When the airdrop falls on a roof the sign says «🚁 AIRDROP ON A ROOF»: the X appears on the roof and the gold crate comes down by parachute. To grab it, climb the stairs of that building." } },
      { ic: "🏚️",
        it: { t: "COVI E STANZE", d: "Fermo in un covo sei invisibile e la retata non ti prende. Dentro un palazzo vedi solo la tua stanza e quello che c’è davanti alla porta; da fuori ti vede solo chi sta davanti alla porta." },
        en: { t: "DENS AND ROOMS", d: "Standing still in a den you are invisible and raids miss you. Inside a building you only see your room and what is in front of the door; from outside, only someone standing in front of the door sees you." } }
    ] },
    { k: "citta", it: "🏙️ LA CITTÀ", en: "🏙️ THE CITY", righe: [
      { ic: "🎮",
        it: { t: "IN 3D", d: "La partita parte subito in 3D. Se il telefono non ce la fa, il gioco passa da solo al 2D: le regole restano le stesse." },
        en: { t: "IN 3D", d: "The match starts straight away in 3D. If your phone cannot keep up, the game switches to 2D by itself: the rules stay the same." } },
      { ic: "🚗", clip: "auto",
        it: { t: "LE AUTO", d: "Avvicinati e tocca il tasto 🚗 SALI. Al volante la levetta sinistra dice dove andare, il pomello destro tenuto premuto è il freno a mano (per le derapate) e un tocco è il clacson. L’auto ha inerzia, sbanda e si rovina: vetri, gomme, fumo. Quando prende fuoco hai 4 secondi per scendere prima del botto, che toglie 1 ❤️ a chi è vicino. Chi viene investito forte perde 2 ❤️. Dall’auto non si spara." },
        en: { t: "CARS", d: "Walk up to it and tap the 🚗 button. At the wheel the left stick says where to go, holding the right knob is the handbrake (for drifts) and a tap is the horn. The car has momentum, slides and gets damaged: glass, tyres, smoke. When it catches fire you have 4 seconds to get out before it blows, taking 1 ❤️ from anyone close. Getting hit hard by a car costs 2 ❤️. You cannot shoot from a car." } },
      { ic: "🤸", clip: "capriola",
        it: { t: "SCENDERE IN CORSA", d: "Tocca il tasto 🚗 SCENDI mentre l’auto corre: fai una capriola nella direzione della corsa e l’auto va avanti da sola. Quasi a tutta velocità la capriola costa 1 ❤️." },
        en: { t: "BAILING OUT", d: "Tap the 🚗 button again while the car is moving: you roll out in the direction you were going and the car keeps rolling on its own. At near top speed the roll costs 1 ❤️." } },
      { ic: "🪜", clip: "scala",
        it: { t: "SALIRE SUL TETTO", d: "Si sale solo dalla scala dentro il palazzo: le scale sono segnate. Quando sei accanto a una scala il tasto a destra diventa ▲ TETTO (o ▼ GIÙ, o il piano del casinò): toccalo e ci vai da solo, poi mezzo secondo fermo e sei su. Su PC è il tasto E; la levetta lo annulla. Dal bordo non si cade: si scende solo dalla scala." },
        en: { t: "GETTING ON A ROOF", d: "You climb only by the stairs inside the building: stairs are marked. When you stand next to a staircase the button on the right becomes ▲ ROOF (or ▼ DOWN, or a casino floor): tap it and you walk there by yourself, then half a second still and you are up. On a PC it is E; the stick cancels it. You cannot fall off the edge: the only way down is the stairs." } },
      { ic: "🧱", clip: "parapetto",
        it: { t: "IL PARAPETTO", d: "Dal tetto vedi più lontano, ma anche gli altri vedono te. Fermo al parapetto per 0,6 s, senza mirare, ti abbassi (in 0,25 s se un fucile ti sta puntando): i colpi che arrivano dal lato del muretto, dalla strada o da un altro tetto, muoiono sul muretto. Da dietro o dallo stesso tetto il muretto non ti copre. Da giù vedi solo 7 celle, e per sparare devi rialzarti." },
        en: { t: "THE PARAPET", d: "From a roof you see further, but others see you too. Stand still at the parapet for 0.6 s without aiming and you duck (in 0.25 s if a rifle is aiming at you): shots coming from the wall side, from the street or from another roof, die on the wall. From behind or from the same roof the wall does not cover you. Ducked you only see 7 cells, and you must stand up to shoot." } },
      { ic: "🎯", clip: "cecchino",
        it: { t: "IL FUCILE", d: "Col fucile tieni la levetta di mira: la mira si stringe e dopo mezzo secondo il mirino diventa rosso e dice «LASCIA ▸ FUOCO». Il colpo parte quando LASCI: se lasci prima non parte niente. A carica piena hai 2,5 s di fiato (l’anello che si svuota), poi la canna trema («TREMA! LASCIA ORA»): il colpo va dove vedi il puntino. Il colpo pieno toglie 2 ❤️; fra un colpo e l’altro l’otturatore vuole 1,6 s. Dal tetto il fucile arriva a 10 celle." },
        en: { t: "THE RIFLE", d: "With the rifle hold the aim stick: your aim tightens and after half a second the reticle turns red and says «RELEASE ▸ FIRE». The shot fires when you LET GO: release early and nothing fires. At full charge you have 2.5 s of breath (the ring that empties), then the barrel shakes («SHAKING! RELEASE NOW»): the shot goes where you see the dot. A full shot takes 2 ❤️; the bolt needs 1.6 s between shots. From a roof the rifle reaches 10 cells." } },
      { ic: "⚔️", clip: "duello",
        it: { t: "DUELLO FRA TETTI", d: "Da un tetto all’altro ci si spara davvero. Chi è nel mirino di un fucile vede il bagliore e il laser, il bordo dello schermo pulsa di rosso dalla parte del tiratore e compare «⚠ SEI NEL MIRINO»: abbassati dietro il muretto o spostati. I bot col fucile salgono sui tetti (al massimo 20 s, poi scendono) e rispondono." },
        en: { t: "ROOFTOP DUELS", d: "You can really shoot from one roof to another. Whoever is in a rifle’s scope sees the glint and the laser, the screen edge pulses red on the shooter’s side and «⚠ YOU’RE IN THE SCOPE» appears: duck behind the wall or move. Bots with a rifle climb onto roofs (20 s at most, then they come down) and shoot back." } },
      { ic: "🎰", clip: "casino",
        it: { t: "IL CASINÒ E IL CAVEAU", d: "Nelle città da 5 giocatori in su c’è il casinò al centro: 3 piani più il tetto, collegati dalle scale, e dentro vedi tutto il piano. Poco prima della prima zona (circa 33 s, 45 s nelle città grandi) al piano 2, nell’ufficio del boss, si apre il CAVEAU: una cassa d’oro con un’arma rara (fucile, lanciarazzi, mitragliatrice o magnum) e un giubbotto o un medikit." },
        en: { t: "THE CASINO AND THE VAULT", d: "In cities of 5 or more players the casino stands in the centre: 3 floors plus the roof, linked by stairs, and inside you see the whole floor. Just before the first zone (about 33 s, 45 s in big cities) the VAULT opens on floor 2, in the boss’s office: a gold crate with a rare gun (rifle, rocket launcher, machine gun or magnum) plus a vest or a medkit." } },
      { ic: "🧱", clip: "crollo",
        it: { t: "STRUTTURE CHE CROLLANO", d: "Granate, razzi, esplosioni e molotov rovinano coperture e muri a stadi, e si vede; i proiettili quasi niente. Tre varchi nei muri e il palazzo crolla in macerie. Un palazzo in fiamme mura le porte dopo 5 secondi e crolla dopo 8: esci in tempo. Il casinò non si rompe." },
        en: { t: "STRUCTURES THAT COLLAPSE", d: "Grenades, rockets, explosions and molotovs wear down cover and walls in visible stages; bullets do almost nothing. Three breaches in the walls and the building collapses into rubble. A burning building seals its doors after 5 seconds and comes down after 8: get out in time. The casino never breaks." } }
    ] },
    { k: "guarda", it: "👁 GUARDARE", en: "👁 WATCHING", righe: [
      { ic: "👁",
        it: { t: "DA SPETTATORE O DA ELIMINATO", d: "Se ti eliminano puoi restare a guardare (👁️ GUARDA); nei tornei si può guardare una partita dal tabellone. In basso c’è la barra: ◀ ▶ passano da un giocatore all’altro, col nome e i cuori; se muore chi segui si passa da soli al prossimo." },
        en: { t: "AS A SPECTATOR OR WHEN OUT", d: "If you are knocked out you can stay and watch (👁️); in tournaments you can watch a match from the bracket. The bar at the bottom: ◀ ▶ switch between players, with name and hearts; if the one you follow dies you move on to the next by yourself." } },
      { ic: "🗺",
        it: { t: "VISTA LIBERA", d: "Trascina col dito per girare la mappa, pizzica per lo zoom, tocca la minimappa per andare in un punto; 🎯 torna a seguire. Su PC: ← → cambiano giocatore, WASD sposta la vista, rotella o + − per lo zoom, F per tornare a seguire. Chi gioca ancora non ha questi comandi." },
        en: { t: "FREE VIEW", d: "Drag with your finger to move around the map, pinch to zoom, tap the minimap to jump to a spot; 🎯 goes back to following. On a PC: ← → switch player, WASD moves the view, wheel or + − to zoom, F to follow again. Players still in the game do not get these controls." } },
      { ic: "📱",
        it: { t: "TELEFONO IN ORIZZONTALE", d: "Gira il telefono: la partita si allarga senza fermarsi. Il tasto ⟲ in alto chiede lo schermo intero e tiene l’orizzontale; se la rotazione del telefono è bloccata, NON GIRA? RUOTA LO SCHERMO. In orizzontale vedi lo stesso pezzo di città del verticale, girato: nessun vantaggio." },
        en: { t: "PHONE IN LANDSCAPE", d: "Turn your phone: the match widens without stopping. The ⟲ button at the top asks for full screen and holds landscape; if your phone’s rotation is locked, use WON’T TURN? ROTATE THE SCREEN. In landscape you see the same piece of city as in portrait, turned: no advantage." } }
    ] },
    { k: "soldi", it: "💰 SOLDI", en: "💰 MONEY", righe: [
      { ic: "💰",
        it: { t: "LA POSTA", d: "Scegli il buy-in (da €1 a €50): tutti al tavolo mettono la stessa posta. Si parte con almeno 2 giocatori; se resti solo, la posta ti torna indietro." },
        en: { t: "THE STAKE", d: "Pick the buy-in (€1 to €50): everyone at the table puts in the same stake. A match starts with at least 2 players; if you end up alone, your stake comes back." } },
      { ic: "🏆",
        it: { t: "IL PIATTO", d: "L’ultimo in piedi prende il 92% del piatto; l’8% va alla casa. Non ci sono premi per i piazzati." },
        en: { t: "THE POT", d: "The last one standing takes 92% of the pot; 8% goes to the house. There are no prizes for runners-up." } },
      { ic: "🤖",
        it: { t: "ALLENATI E LOBBY", d: "🤖 ALLENATI è gratis contro i bot: nessun soldo in gioco. I bot hanno quattro caratteri (aggressivo, prudente, cecchino, saccheggiatore): si coprono, cambiano posto, raccolgono e salgono sui tetti. Con 📣 CREA LOBBY inviti il tuo gruppo alla stessa partita." },
        en: { t: "TRAINING AND LOBBIES", d: "🤖 TRAIN is free against bots: no money at stake. Bots have four characters (aggressive, careful, sniper, looter): they take cover, change position, loot and climb onto roofs. With 📣 CREATE LOBBY you invite your group into the same match." } },
      { ic: "🏅",
        it: { t: "TORNEI", d: "Nei tornei si entra col biglietto e non si paga il piatto: chi vince il match passa al turno dopo, e gli altri possono guardarlo." },
        en: { t: "TOURNAMENTS", d: "In tournaments you play with a ticket and there is no pot: the match winner goes through to the next round, and others can watch it." } }
    ] }
  ]
};
if (typeof window !== "undefined") window.GCR_ISTR = GCR_ISTR;
