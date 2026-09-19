/* gcr/istruzioni.js — COME SI GIOCA A GAMBLER CITY (19/09/2026)
   UNA SOLA FONTE per il pannello della lobby del turf (index.html, gcrtOpen). Si scarica solo quando
   si apre il pannello; le mini clip (gcr/clip/*.mp4, 400x400, senza audio, 2-4 s in loop) partono solo
   quando la loro riga entra nel riquadro. Ogni riga e' stata controllata sul motore che gira sul server
   (turfwar_rt.py 68a3c211, turfwar_rt_server.py): se cambia una regola, si cambia QUI.
   NON c'e' il cecchinaggio nuovo (cecchino3): non e' online.
   ⚠️ Solo virgolette doppie per le stringhe; l'apostrofo nei testi e' quello tipografico (’).
   Riga: ic icona · clip (facoltativa: gcr/clip/<clip>.mp4 + .jpg) · it/en: t titolo · d testo. */
var GCR_ISTR = {
  v: "1909a",
  schede: [
    { k: "partita", it: "📜 LA PARTITA", en: "📜 THE GAME", righe: [
      { ic: "🎯",
        it: { t: "LO SCOPO", d: "Da 2 a 10 gangster sulla stessa città: vince l’ultimo in piedi. Si parte con 3 ❤️ (al massimo 5)." },
        en: { t: "THE GOAL", d: "2 to 10 gangsters in the same city: the last one standing wins. You start with 3 ❤️ (5 at most)." } },
      { ic: "🕹️",
        it: { t: "I COMANDI", d: "Levetta sinistra: ti muovi. Levetta destra: miri, e con un’arma da fuoco il colpo parte da solo mentre miri. Senza arma da fuoco colpisci da vicino: pugni, coltello o mazza. Gli oggetti sono i tasti accanto alla levetta destra: granata e molotov si trascinano per mirare il lancio e si lasciano per lanciare." },
        en: { t: "CONTROLS", d: "Left stick: move. Right stick: aim, and with a gun the shot fires by itself while you aim. Without a gun you hit up close: fists, knife or bat. Items are the buttons next to the right stick: drag a grenade or molotov to aim the throw, release to throw." } },
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
        it: { t: "GLI EVENTI", d: "Undici sorprese, annunciate qualche secondo prima: airdrop (una cassa d’oro cade sulla X), retata (una pattuglia spazza una via: nasconditi), blackout, taglia, rifornimento, bombardamento, adrenalina, corsa all’oro, terremoto, elicottero, convoglio." },
        en: { t: "EVENTS", d: "Eleven surprises, announced a few seconds ahead: airdrop (a gold crate lands on the X), raid (a patrol sweeps a street: hide), blackout, bounty, resupply, shelling, adrenaline, gold rush, earthquake, helicopter, convoy." } },
      { ic: "🏚️",
        it: { t: "COVI E STANZE", d: "Fermo in un covo sei invisibile e la retata non ti prende. Dentro un palazzo vedi solo la tua stanza e quello che c’è davanti alla porta; da fuori ti vede solo chi sta davanti alla porta." },
        en: { t: "DENS AND ROOMS", d: "Standing still in a den you are invisible and raids miss you. Inside a building you only see your room and what is in front of the door; from outside, only someone standing in front of the door sees you." } }
    ] },
    { k: "citta", it: "🏙️ LA CITTÀ", en: "🏙️ THE CITY", righe: [
      { ic: "🎮",
        it: { t: "IN 3D", d: "La città si gioca in 3D. Se il telefono non ce la fa, il gioco passa da solo al 2D: le regole restano le stesse." },
        en: { t: "IN 3D", d: "The city is played in 3D. If your phone cannot keep up, the game switches to 2D by itself: the rules stay the same." } },
      { ic: "🚗", clip: "auto",
        it: { t: "LE AUTO", d: "Avvicinati e tocca il tasto 🚗 SALI. Al volante la levetta sinistra dice dove andare, il pomello destro tenuto premuto è il freno a mano (per le derapate) e un tocco è il clacson. L’auto ha inerzia, sbanda e si rovina: vetri, gomme, fumo. Quando prende fuoco hai 4 secondi per scendere prima del botto, che toglie 1 ❤️ a chi è vicino. Chi viene investito forte perde 2 ❤️. Dall’auto non si spara." },
        en: { t: "CARS", d: "Walk up to it and tap the 🚗 button. At the wheel the left stick says where to go, holding the right knob is the handbrake (for drifts) and a tap is the horn. The car has momentum, slides and gets damaged: glass, tyres, smoke. When it catches fire you have 4 seconds to get out before it blows, taking 1 ❤️ from anyone close. Getting hit hard by a car costs 2 ❤️. You cannot shoot from a car." } },
      { ic: "🤸", clip: "capriola",
        it: { t: "SCENDERE IN CORSA", d: "Tocca il tasto 🚗 SCENDI mentre l’auto corre: fai una capriola nella direzione della corsa e l’auto va avanti da sola. Quasi a tutta velocità la capriola costa 1 ❤️." },
        en: { t: "BAILING OUT", d: "Tap the 🚗 button again while the car is moving: you roll out in the direction you were going and the car keeps rolling on its own. At near top speed the roll costs 1 ❤️." } },
      { ic: "🏢", clip: "tetto",
        it: { t: "TETTI E PARAPETTO", d: "Sul tetto si sale solo dalla scala dentro il palazzo: fermati mezzo secondo sulla scala. Dal tetto vedi più lontano, ma anche gli altri vedono te da più lontano. Dal bordo non si cade: si scende solo dalla scala. Fermo al parapetto per 0,6 s, senza mirare, ti abbassi: i colpi che salgono dalla strada muoiono sul muretto, ma da giù vedi solo 7 celle. Col fucile tieni la mira mezzo secondo e il colpo toglie 2 ❤️, ma il bagliore del mirino ti fa vedere." },
        en: { t: "ROOFS AND PARAPET", d: "You get onto a roof only by the stairs inside the building: stand still on the stairs for half a second. From a roof you see further, but others also see you from further away. You cannot fall off the edge: the only way down is the stairs. Stand still at the parapet for 0.6 s without aiming and you duck: shots coming up from the street die on the wall, but ducked you only see 7 cells. With the rifle, hold your aim for half a second and the shot takes 2 ❤️, but the scope glint gives you away." } },
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
        it: { t: "ALLENATI E LOBBY", d: "🤖 ALLENATI è gratis contro i bot: nessun soldo in gioco. Con 📣 CREA LOBBY inviti il tuo gruppo alla stessa partita." },
        en: { t: "TRAINING AND LOBBIES", d: "🤖 TRAIN is free against bots: no money at stake. With 📣 CREATE LOBBY you invite your group into the same match." } },
      { ic: "🏅",
        it: { t: "TORNEI", d: "Nei tornei si entra col biglietto e non si paga il piatto: chi vince il match passa al turno dopo, e gli altri possono guardarlo." },
        en: { t: "TOURNAMENTS", d: "In tournaments you play with a ticket and there is no pot: the match winner goes through to the next round, and others can watch it." } }
    ] }
  ]
};
if (typeof window !== "undefined") window.GCR_ISTR = GCR_ISTR;
