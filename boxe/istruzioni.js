/* boxe/istruzioni.js — COME SI GIOCA A BOXE (20/09/2026, IL PESO).
   UNA SOLA FONTE per il pannello della lobby (index.html, bxiOpen). Si scarica solo quando si apre
   il pannello; le mini clip (boxe/clip/*.mp4, 400x400, senza audio, 3-4,5 s in loop) partono solo
   quando la loro riga entra nel riquadro. Ogni numero e' letto dal motore ONLINE _boxe_motore.mjs
   (md5 51785689, impronta 48b95881) e dal client _boxe_rt.html (9be9c576): se cambia la taratura,
   si cambia QUI. Scritto da banco/fai_testi.py — non si tocca a mano.
   ⚠️ Solo virgolette doppie nelle stringhe; l'apostrofo nei testi e' quello tipografico. */
var BX_ISTR = {
 "v": "2009a",
 "schede": [
  {
   "k": "partita",
   "it": "📜 LA PARTITA",
   "en": "📜 THE FIGHT",
   "righe": [
    {
     "ic": "🥊",
     "it": {
      "t": "UNO CONTRO UNO",
      "d": "Un incontro solo, senza riprese. Chi manda giù l’altro TRE volte ha vinto. Se non ci arriva nessuno, ai 5 minuti suona la campana e si decide alla lavagna."
     },
     "en": {
      "t": "ONE ON ONE",
      "d": "A single fight, no rounds. Put the other one down THREE times and you win. If nobody gets there, the bell goes at 5 minutes and the scorecard decides."
     }
    },
    {
     "ic": "💫",
     "it": {
      "t": "NON C’È UNA BARRA DI VITA",
      "d": "Si cade per SQUILIBRIO, non per danno. I colpi ti spostano il peso: quando ti colpiscono forte barcolli, e se non ritrovi i piedi vai giù. Come si ritrovano sta nella scheda IL PESO, ed è la cosa più importante di tutto il gioco."
     },
     "en": {
      "t": "THERE IS NO HEALTH BAR",
      "d": "You go down off BALANCE, not off damage. Punches shift your weight: a hard one makes you stagger, and if you do not find your feet again you go down. How you find them is in THE WEIGHT tab, and it is the most important thing in the whole game."
     }
    },
    {
     "ic": "⏱",
     "it": {
      "t": "IL CONTO",
      "d": "Dopo ogni atterramento tornate tutti e due al centro del ring, l’arbitro conta fino a 3 e la campana fa ripartire l’incontro. Il fermo dura 3,50 s in tutto. Chi si rialza riparte con almeno 45 di fiato."
     },
     "en": {
      "t": "THE COUNT",
      "d": "After every knockdown you both go back to the middle of the ring, the referee counts to 3 and the bell restarts the fight. The stop lasts 3.50 s in all. Whoever gets up restarts with at least 45 breath."
     }
    },
    {
     "ic": "🪙",
     "it": {
      "t": "AI 5 MINUTI, LA LAVAGNA",
      "d": "Vince chi è caduto MENO volte. Se siete pari si guarda in quest’ordine: lo squilibrio CONSEGNATO (quanto hai spostato lui in tutto l’incontro), poi il FIATO che ti resta. Se è pari anche quello decide la MONETA, ed è scritto qui apposta."
     },
     "en": {
      "t": "AT 5 MINUTES, THE SCORECARD",
      "d": "The one who went down FEWER times wins. If you are level it is checked in this order: the imbalance you DELIVERED (how much you shifted them over the whole fight), then the BREATH you have left. If that is level too, a COIN decides, and it is written here on purpose."
     }
    },
    {
     "ic": "💰",
     "it": {
      "t": "LA POSTA",
      "d": "Il vincitore si prende il 95% del piatto, il 5% va alla casa. Se nessuno accetta la sfida la posta torna indietro. Chi lascia il ring e non torna perde per abbandono dopo due minuti."
     },
     "en": {
      "t": "THE STAKE",
      "d": "The winner takes 95% of the pot, 5% goes to the house. If nobody accepts the challenge your stake comes back. Leave the ring and stay away and you lose by walkout after two minutes."
     }
    },
    {
     "ic": "🏆",
     "it": {
      "t": "ANCHE NEI TORNEI",
      "d": "La BOXE è fra i giochi dei tornei a eliminazione: stesse regole, stesso motore, un incontro per turno."
     },
     "en": {
      "t": "IN TOURNAMENTS TOO",
      "d": "BOXING is one of the knockout-tournament games: same rules, same engine, one fight per round."
     }
    }
   ]
  },
  {
   "k": "comandi",
   "it": "🕹️ I COMANDI",
   "en": "🕹️ CONTROLS",
   "righe": [
    {
     "ic": "🕹️",
     "it": {
      "t": "LO STICK SINISTRO: IL CORPO",
      "d": "Il cerchio in basso a sinistra sposta il pugile. Camminare non fa mai cadere. Se lo lasci stare sei PIANTATO: i piedi si allargano e un colpo preso da fermo ti sposta quasi la metà. Stare fermi non è vigliaccheria, è la posizione più solida che c’è."
     },
     "en": {
      "t": "LEFT STICK: THE BODY",
      "d": "The circle at the bottom left moves the boxer. Walking never makes you fall. Leave it alone and you are PLANTED: your feet widen and a punch taken standing still shifts you by almost half as much. Standing still is not cowardice, it is the most solid stance there is."
     }
    },
    {
     "ic": "👆",
     "clip": "colpi",
     "it": {
      "t": "IL TASTO COLPO: TIENI E MOLLA",
      "d": "Il colpo parte quando MOLLI, e quanto hai tenuto sceglie quale: tocco secco (fino a 0,20 s) = JAB · tenuto (fino a 0,60 s) = DIRETTO · oltre = MONTANTE. Mentre carichi, l’anello attorno al tasto si riempie e la targhetta dice già il nome del colpo che uscirà."
     },
     "en": {
      "t": "THE PUNCH BUTTON: HOLD AND LET GO",
      "d": "The punch leaves when you LET GO, and how long you held decides which: a tap (up to 0.20 s) = JAB · held (up to 0.60 s) = STRAIGHT · longer = UPPERCUT. While you charge, the ring around the button fills and the label already tells you which punch is coming."
     }
    },
    {
     "ic": "🎯",
     "it": {
      "t": "LA MIRA È AUTOMATICA, LA DISTANZA NO",
      "d": "Premendo COLPO il pugile si gira da solo verso l’avversario entro due passi e mezzo. La distanza però la scegli tu, e i tre colpi non arrivano uguale: il JAB è il più lungo, il DIRETTO arriva più corto, il MONTANTE è il più corto di tutti — il colpo più forte va tirato da vicino."
     },
     "en": {
      "t": "AIMING IS AUTOMATIC, RANGE IS NOT",
      "d": "Press PUNCH and the boxer turns towards your opponent by himself, within two and a half paces. The range is your choice though, and the three punches do not reach the same: the JAB is the longest, the STRAIGHT is shorter, the UPPERCUT is the shortest of all — the hardest punch has to be thrown from close in."
     }
    },
    {
     "ic": "🛡️",
     "clip": "guardia",
     "it": {
      "t": "LA GUARDIA SI TIENE PREMUTA",
      "d": "La capsula a destra: dito giù = sei coperto, dito su = non c’è nessuna guardia. Non è un interruttore, e la metà che si dimentica è la seconda — chi impara solo a premere scopre di essere scoperto incassando."
     },
     "en": {
      "t": "THE GUARD IS HELD DOWN",
      "d": "The capsule on the right: finger down = you are covered, finger up = there is no guard at all. It is not a switch, and the half everyone forgets is the second one — learn only to press and you find out you are open by getting hit."
     }
    },
    {
     "ic": "↕️",
     "it": {
      "t": "LE TRE ALTEZZE",
      "d": "Senza mollare la capsula, trascina il dito in su o in giù: ALTA, MEDIA, BASSA. Un gesto corto sposta di una tacca, uno lungo di due, così da bassa ad alta si passa senza staccare il dito."
     },
     "en": {
      "t": "THE THREE HEIGHTS",
      "d": "Without letting the capsule go, drag your finger up or down: HIGH, BODY, LOW. A short move shifts one notch, a long one shifts two, so you can go from low to high without lifting your finger."
     }
    }
   ]
  },
  {
   "k": "peso",
   "it": "⚖️ IL PESO",
   "en": "⚖️ THE WEIGHT",
   "righe": [
    {
     "ic": "💫",
     "clip": "peso",
     "it": {
      "t": "QUANDO BARCOLLI, GUARDA I PIEDI",
      "d": "Un colpo forte ti fa BARCOLLARE. Sotto i piedi compare un PIATTO, e sopra il piatto c’è il tuo peso: una PALLA DI LUCE che il colpo ha buttato di lato. Finché la palla sta sul piatto sei in piedi."
     },
     "en": {
      "t": "WHEN YOU STAGGER, LOOK AT YOUR FEET",
      "d": "A hard punch makes you STAGGER. A PLATE appears under your feet, and on the plate sits your weight: a BALL OF LIGHT the punch has thrown off to one side. As long as the ball is on the plate you are still standing."
     }
    },
    {
     "ic": "👉",
     "it": {
      "t": "LA PALLA VA DOVE SPINGI",
      "d": "Con lo stick sinistro spingila verso il CERCHIO D’ORO in mezzo al piatto. Guarda la palla, non l’avversario: spingere dalla parte sbagliata è l’unico modo sicuro di finire giù."
     },
     "en": {
      "t": "THE BALL GOES WHERE YOU PUSH",
      "d": "Use the left stick to push it towards the GOLDEN CIRCLE in the middle of the plate. Watch the ball, not your opponent: pushing the wrong way is the one sure way to end up on the floor."
     }
    },
    {
     "ic": "✋",
     "it": {
      "t": "DENTRO IL CERCHIO, MOLLA",
      "d": "Quando la palla è dentro il cerchio d’oro MOLLA lo stick e lasciala ferma: l’arco d’oro si riempie in un quarto di secondo (0,25 s), si sente un TUM e sei di nuovo in piedi. Se sei stato veloce compare PULITO! con la serie."
     },
     "en": {
      "t": "INSIDE THE CIRCLE, LET GO",
      "d": "Once the ball is inside the golden circle LET GO of the stick and leave it still: the golden arc fills in a quarter of a second (0.25 s), you hear a THUD and you are back on your feet. Quick enough and CLEAN! comes up with your streak."
     }
    },
    {
     "ic": "🦵",
     "clip": "ginocchio",
     "it": {
      "t": "SE LA PALLA ESCE DAL PIATTO: IN GINOCCHIO",
      "d": "Non cadi subito: cedi su un ginocchio, ed è la seconda possibilità. Il peso si ferma un attimo, un ANELLO ROSSO si svuota e dice quanto tempo ti resta (1,60 s). Riporta la palla nel cerchio, molla, e leggi DAL GINOCCHIO! CHE CUORE! Se esce di nuovo, o se l’anello finisce, vai giù."
     },
     "en": {
      "t": "IF THE BALL LEAVES THE PLATE: ON ONE KNEE",
      "d": "You do not fall straight away: you drop to one knee, and that is your second chance. The weight stops for a moment, a RED RING drains and tells you how long is left (1.60 s). Bring the ball back into the circle, let go, and read UP FROM THE KNEE! WHAT HEART! If it leaves again, or the ring runs out, you go down."
     }
    },
    {
     "ic": "〰️",
     "clip": "corde",
     "it": {
      "t": "ALLE CORDE LA PALLA RIMBALZA",
      "d": "Con i piedi sulle corde, il bordo del piatto da quella parte diventa una corda viva: la palla ci sbatte, TWANG, e torna dentro. Mentre barcolli non si cade più «fuori» da soli. Non è un rifugio: il tempo scorre lo stesso."
     },
     "en": {
      "t": "ON THE ROPES THE BALL BOUNCES",
      "d": "With your feet on the ropes, the edge of the plate on that side turns into a live rope: the ball hits it, TWANG, and comes back in. While you stagger you can no longer fall «out» by yourself. It is not a shelter: the clock runs all the same."
     }
    },
    {
     "ic": "🦿",
     "it": {
      "t": "BARCOLLI DI FILA = GAMBE MOLLI",
      "d": "Ogni barcollo lascia una gamba molle, e con le gambe molli ritrovare i piedi chiede di tenere la palla ferma più a lungo: 0,25 s da fresco, poi 0,38 · 0,50 · 0,63 s a una, due, tre gambe. Anche il ginocchio ti lascia meno margine. Una gamba si smaltisce ogni 9 secondi passati in piedi."
     },
     "en": {
      "t": "STAGGER AFTER STAGGER = WOBBLY LEGS",
      "d": "Every stagger leaves your legs a little weaker, and with wobbly legs finding your feet asks you to hold the ball still for longer: 0.25 s when you are fresh, then 0.38 · 0.50 · 0.63 s at one, two, three notches. The knee gives you less room too. One notch wears off every 9 seconds spent on your feet."
     }
    },
    {
     "ic": "⏳",
     "it": {
      "t": "CHI NON MOLLA MAI NON SI SALVA",
      "d": "Tenere lo stick a fondo non ti pianta: l’arco d’oro si riempie solo con lo stick mollato, e una spinta decisa lo azzera. Dopo 3,20 s di barcollo il tempo finisce: vai in ginocchio e compare HAI TENUTO TROPPO: MOLLA!"
     },
     "en": {
      "t": "HOLD ON FOREVER AND YOU NEVER RECOVER",
      "d": "Holding the stick down does not plant you: the golden arc only fills with the stick released, and a firm push empties it. After 3.20 s of staggering the time is up: you drop to one knee and HELD TOO LONG: LET GO! comes up."
     }
    }
   ]
  },
  {
   "k": "colpire",
   "it": "🥊 COLPIRE E DIFENDERE",
   "en": "🥊 HITTING AND DEFENDING",
   "righe": [
    {
     "ic": "🛡️",
     "it": {
      "t": "LA QUOTA GIUSTA",
      "d": "Le tre altezze della guardia sono le stesse dei tre colpi: ALTA contro il JAB, MEDIA contro il DIRETTO, BASSA contro il MONTANTE. La guardia deve stare ferma alla sua quota tre decimi di secondo (0,30 s) prima di contare."
     },
     "en": {
      "t": "THE RIGHT HEIGHT",
      "d": "The three guard heights are the same as the three punches: HIGH against the JAB, BODY against the STRAIGHT, LOW against the UPPERCUT. The guard has to sit still at its height for three tenths of a second (0.30 s) before it counts."
     }
    },
    {
     "ic": "⚡",
     "it": {
      "t": "LA PARATA RIMANDA INDIETRO",
      "d": "Quota azzeccata su un jab o un diretto = PARATA: passa solo il 39% del colpo, e chi l’ha tirato rincula e resta stordito per un terzo di secondo. È la tua finestra per il contrattacco, ed è il motivo per cui la guardia non è una cosa passiva."
     },
     "en": {
      "t": "A PARRY SENDS IT BACK",
      "d": "The right height against a jab or a straight = PARRY: only 39% of the punch gets through, and whoever threw it recoils and is stunned for a third of a second. That is your window for a counter, and it is why the guard is not a passive thing."
     }
    },
    {
     "ic": "⬆️",
     "it": {
      "t": "IL MONTANTE NON SI PARA MAI",
      "d": "Contro il montante la guardia giusta è solo una difesa: toglie il 22,5% e non rimanda indietro niente. Sbagliare di una tacca toglie poco (15%), di due non toglie niente. Chi para un montante ha già guadagnato tutto quello che c’era da guadagnare."
     },
     "en": {
      "t": "THE UPPERCUT IS NEVER PARRIED",
      "d": "Against the uppercut the right guard is only a defence: it takes 22.5% off and sends nothing back. Being one notch off takes little (15%), two notches takes nothing. Blocking an uppercut has already earned you everything there was to earn."
     }
    },
    {
     "ic": "🔄",
     "it": {
      "t": "LA GUARDIA COPRE VERSO DI LUI",
      "d": "Non la si orienta col dito: copre da sola dalla parte dell’avversario. Il pugno però viaggia sulla linea di quando è partito, quindi girargli intorno MENTRE carica gli apre la copertura: la guardia si buca coi piedi, non col dito. Oltre una cinquantina di gradi di scarto non copre più niente (51°)."
     },
     "en": {
      "t": "THE GUARD COVERS TOWARDS HIM",
      "d": "You do not aim it with your finger: it covers your opponent’s side by itself. The punch, though, travels along the line it was launched on, so circling him WHILE he charges opens his cover: a guard is beaten with the feet, not the finger. Past about fifty degrees off it covers nothing at all (51°)."
     }
    },
    {
     "ic": "🔗",
     "it": {
      "t": "LA CATENA DI JAB",
      "d": "Ogni jab che va a segno dopo un altro pesa di più, e la catena cresce fino al settimo. Un colpo pesante a segno la rompe: la catena premia la sequenza, non il singolo colpo grosso infilato in mezzo."
     },
     "en": {
      "t": "THE JAB CHAIN",
      "d": "Every jab that lands after another one counts for more, and the chain keeps growing up to the seventh. A heavy punch landing breaks it: the chain rewards the sequence, not one big shot slipped in the middle."
     }
    },
    {
     "ic": "↪️",
     "it": {
      "t": "DI LATO FA PIÙ MALE",
      "d": "Un colpo che arriva di fianco sposta molto più di uno in linea, perché in quella direzione i piedi sono stretti. Girargli intorno non è estetica: è il modo di far valere di più lo stesso pugno."
     },
     "en": {
      "t": "FROM THE SIDE IT HURTS MORE",
      "d": "A punch arriving from the side shifts you far more than one straight on, because your feet are narrow in that direction. Circling him is not for show: it is how the same punch comes to count for more."
     }
    },
    {
     "ic": "💨",
     "it": {
      "t": "IL FIATO",
      "d": "Ogni colpo costa fiato: 11 il jab, 24 il diretto, 30 il montante. Il fiato torna da solo, e torna più in fretta da fermi che camminando. A fiato corto i colpi pesanti non escono più — e ai 5 minuti il fiato che ti resta è il terzo criterio del verdetto."
     },
     "en": {
      "t": "BREATH",
      "d": "Every punch costs breath: 11 for the jab, 24 for the straight, 30 for the uppercut. Breath comes back by itself, and it comes back faster standing still than walking. Short of breath, the heavy punches stop coming out — and at 5 minutes the breath you have left is the third tie-breaker."
     }
    },
    {
     "ic": "🚧",
     "it": {
      "t": "FUORI DAL RING È UN ATTERRAMENTO",
      "d": "Se i piedi finiscono oltre il grembiule conta come una caduta, esattamente come andare giù. Le corde tengono chi barcolla, ma spinto dall’avversario puoi ancora uscire: al bordo non si combatte gratis."
     },
     "en": {
      "t": "OUT OF THE RING IS A KNOCKDOWN",
      "d": "If your feet end up past the apron it counts as a fall, exactly like going down. The ropes hold whoever is staggering, but pushed by your opponent you can still go over: fighting on the edge is never free."
     }
    }
   ]
  }
 ],
 "ui": {
  "it": {
   "hd": "🥊 BOXE — COME SI GIOCA",
   "chiudi": "✖ CHIUDI",
   "avanti": "▶️ ",
   "capito": "▶️ HO CAPITO",
   "attesa": "Carico la guida…",
   "rotto": "La guida non si è caricata. Controlla la connessione e riprova."
  },
  "en": {
   "hd": "🥊 BOXING — HOW TO PLAY",
   "chiudi": "✖ CLOSE",
   "avanti": "▶️ ",
   "capito": "▶️ GOT IT",
   "attesa": "Loading the guide…",
   "rotto": "The guide did not load. Check your connection and try again."
  }
 }
};
