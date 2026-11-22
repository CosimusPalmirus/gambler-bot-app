var MG={modo:{},tier:{},lobby:{},lobbyAt:{},lobbyBusy:{},parte:0};
function mgEn(){return window.GB_LANG==="en";}
function mgL(it,en){return mgEn()?en:it;}
function mgEsc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function mgEur(v){v=Math.round((Number(v)||0)*100)/100;var s=(Math.round(v)===v)?String(v):v.toFixed(2);return mgEn()?"€"+s:s.replace(".",",")+" €";}
function mgSaldo(){try{return (typeof capEur==="function")?(Number(capEur())||0):0;}catch(e){return 0;}}
function mgMem(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){}return null;}
function mgFasce(){return (typeof TWR_TIERS!=="undefined"&&TWR_TIERS.length)?TWR_TIERS:[["0.5"],["1"],["2"],["5"],["10"],["20"],["50"]];}
function mgFont(){
  if(document.getElementById("mg-font"))return;
  try{var l=document.createElement("link");l.id="mg-font";l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=Creepster&family=Bowlby+One+SC&family=Bungee&family=Cinzel:wght@800&family=Special+Elite&family=Lilita+One&display=swap";document.head.appendChild(l);}catch(e){}
}
function mgCall(n){try{if(typeof window[n]==="function")return window[n]();}catch(e){}return "";}
var MG_GIOCHI={
  deadmoney:{nome:"DEAD MONEY",font:"Creepster",col:"#e2364a",col2:"#d9a63c",fondo:"#06100c",hero:"ml/i_cf9d00ad69.webp",posti:[3,8],bot:5,
    tag:["Il quiz all’ultima fiche","The quiz to the last chip"],
    pills:[["💀","3-8 giocatori","3-8 players"],["❓","9 domande","9 questions"],["🚪","1 porta","1 door"]],
    feat:[["RISPONDI","ANSWER","Giusta: +1000 fiche. Sbagliata: Sala del Debito.","Right: +1000 chips. Wrong: the Debt Room."],
          ["SOPRAVVIVI","SURVIVE","28 sale, minigiochi sul telefono. Chi perde muore.","28 rooms, minigames on your phone. Losers die."],
          ["INFESTA","HAUNT","Da morto continui: malocchio, scommesse, sale.","Dead, you keep playing: evil eye, bets, rooms."],
          ["SCAPPA","ESCAPE","La Fuga: chi esce dalla porta prende il piatto.","The Escape: whoever gets out takes the pot."]],
    vince:["Chi scappa prende il piatto","Whoever escapes takes the pot"],
    nota:["Regole della casa: Raddoppio · Mazzetta · Totomorto · Dead Money · Malocchio · Taglia · Becchino (20% da 6 giocatori)","House rules: Double · Bribe · Death Pool · Dead Money · Evil Eye · Bounty · Gravedigger (20% with 6+ players)"],
    ritmo:"rtd"},
  kaiju:{nome:"KAIJU BATTLE",font:"Bungee",col:"#ff6b3d",col2:"#ffd23d",fondo:"#120714",hero:"ml/i_e0f681f63a.webp",posti:[2,5],bot:3,
    tag:["Picchia chi sta in città","Smash whoever holds the city"],
    pills:[["🦖","2-5 mostri","2-5 monsters"],["🎲","6 dadi","6 dice"],["⭐","20 stelle","20 stars"]],
    feat:[["I DADI","THE DICE","Sei dadi, tre lanci: stelle, energia, cuori, artigli.","Six dice, three rolls: stars, energy, hearts, claws."],
          ["LA CITTÀ","THE CITY","Chi la tiene colpisce tutti, ma non si cura.","Whoever holds it hits everyone, but can’t heal."],
          ["I POTERI","POWERS","Con l’energia compri carte che cambiano la partita.","Spend energy on cards that change the game."],
          ["IL RE","THE KING","20 stelle o l’ultimo mostro in piedi.","20 stars or the last monster standing."]],
    vince:["L’ultimo mostro prende tutto","The last monster takes it all"],
    extra:function(){return mgCall("kjrtLobbyBtn");},
    prima:function(){if(typeof kjrtPrecarica==="function"&&typeof KJRT!=="undefined"&&KJRT.loads===0){try{kjrtPrecarica();}catch(e){}}},
    ritmo:"rtd"},
  lastcall:{nome:"LAST CALL",font:"Bowlby One SC",col:"#f3d28a",col2:"#ffb020",fondo:"#0a0805",hero:"ml/i_cebb834cef.webp",posti:[2,7],bot:3,
    tag:["Peschi finché non ti becca il buttafuori","Draw until the bouncer gets you"],
    pills:[["🍸","2-7 al bancone","2-7 at the bar"],["💀","1 buttafuori in meno","bouncers: players − 1"],["💶","la mazzetta","the bribe"]],
    feat:[["IL TURNO","THE TURN","Giochi quante carte vuoi, poi peschi.","Play as many cards as you like, then draw."],
          ["IL BUTTAFUORI","THE BOUNCER","Chi lo pesca esce. L’ultimo seduto vince.","Draw him and you’re out. Last one seated wins."],
          ["LA MAZZETTA","THE BRIBE","L’unica che lo ferma: lo rimetti nel mazzo dove vuoi.","The only stop: put him back wherever you like."],
          ["IL NON VALE","THE NOPE","Cancella la mossa di un altro, anche fuori turno.","Cancel someone’s move, even off-turn."]],
    vince:["L’ultimo seduto prende tutto","The last one seated takes it all"],
    extra:function(){return mgCall("lctBtn");},
    prima:function(){if(typeof lcrtPrecarica==="function"&&typeof LCRT!=="undefined"&&LCRT.loads===0){try{lcrtPrecarica();}catch(e){}}},
    ritmo:"rtd"},
  lupus:{nome:"LUPUS",font:"Cinzel",col:"#a5b4fc",col2:"#818cf8",fondo:"#080a1a",hero:"ml/i_09cd7d9b3a.webp",posti:[5,10],bot:7,soloLobby:true,
    tag:["Di notte il lupo sbrana, di giorno il villaggio vota","At night the wolf strikes, by day the village votes"],
    pills:[["🐺","5-10 al tavolo","5-10 at the table"],["🌙","notte e giorno","night and day"],["🔨","l’asta dei lupi","the wolf auction"]],
    feat:[["DI NOTTE","AT NIGHT","I lupi scelgono una porta, la lanterna scruta.","Wolves pick a door, the lantern peeks."],
          ["DI GIORNO","BY DAY","Si accusa, ci si difende, il villaggio vota.","Accuse, defend, the village votes."],
          ["I RUOLI","ROLES","Lupi, lanterna, guardiano, gambler e speciali.","Wolves, lantern, guardian, gamblers and specials."],
          ["L’ASTA","THE AUCTION","A soldi il posto da lupo si compra all’asta.","For money the wolf seat goes to auction."]],
    vince:["Branco, villaggio o sciacallo","Pack, village or jackal"],
    extra:function(){return mgCall("lupTutBtn");},
    prima:function(){if(typeof luprtPrecarica==="function"&&typeof LUPRT!=="undefined"&&LUPRT.loads===0){try{luprtPrecarica();}catch(e){}}},
    ritmo:"rtd"},
  scalata:{nome:"DEAD PEAK",font:"Bungee",col:"#facc15",col2:"#38bdf8",fondo:"#060b14",hero:"ml/i_a6b9db457c.webp",posti:[2,10],bot:5,
    tag:["Scala la montagna della morte","Climb the mountain of death"],
    pills:[["🗼","2-10 scalatori","2-10 climbers"],["🪤","trappole","traps"],["🚪","la porta in cima","the door at the top"]],
    feat:[["SCALA","CLIMB","Corri, salta e aggrappati verso la cima.","Run, jump and grab your way to the top."],
          ["LE TRAPPOLE","TRAPS","Seghe, tronchi chiodati, massi: chi cade ricomincia.","Saws, spiked logs, boulders: fall and restart."],
          ["GLI OGGETTI","ITEMS","12 oggetti per fregare gli altri.","12 items to mess with the others."],
          ["LA CIMA","THE SUMMIT","Il primo alla porta prende il piatto.","First to the door takes the pot."]],
    vince:["Il primo in cima prende tutto","First to the top takes it all"],
    extra:function(){return '<button class="action-btn" style="width:100%;margin:8px 0 2px;background:linear-gradient(135deg,#101c2c,#0a1420);border:1px solid rgba(56,189,248,.5);color:#7dd3fc;" onclick="deadpeakEditor()">🎨 '+mgL("IL TUO SCALATORE","YOUR CLIMBER")+'</button>'+mgCall("sclTutBtn");},
    prima:function(){if(typeof dprtPrecarica==="function"&&typeof DPRT!=="undefined"&&DPRT.loads===0){try{dprtPrecarica();}catch(e){}}
      try{if(typeof deadpeakLookSync==="function")deadpeakLookSync();}catch(e){}
      try{if(typeof dpkSync==="function"&&typeof dpkRiHello==="function")dpkSync(dpkRiHello);}catch(e){}},
    ritmo:"rtd"},
  glad:{nome:"COLOSSEO",font:"Cinzel",col:"#f5d27a",col2:"#ff7a1a",fondo:"#140a04",hero:"ml/i_0ebfceb99a.webp",posti:[2,8],bot:3,
    tag:["Ave! L’ultimo in piedi prende il piatto","Ave! The last one standing takes the pot"],
    pills:[["🏛️","2-8 gladiatori","2-8 gladiators"],["⚔️","spada e scudo","sword and shield"],["🔥","l’arena si stringe","the arena shrinks"]],
    feat:[["ATTACCO","ATTACK","Fendente ad arco: lo battono parata e schivata.","Arc slash: beaten by parry and dodge."],
          ["PARRY","PARRY","Alza lo scudo a tempo e stordisci.","Raise the shield on time and stun."],
          ["SPECIALE","SPECIAL","L’affondo che sfonda la guardia.","The thrust that breaks the guard."],
          ["L’ARENA","THE ARENA","Sabbia e lava ai bordi: niente melina.","Sand and lava at the edges: no stalling."]],
    vince:["L’ultimo vivo prende il 92% del piatto","The last one alive takes 92% of the pot"],
    extra:function(){return mgCall("gltBtn")+'<button class="twr-editbtn" onclick="gladOpenEditor()">⚔️ '+mgL("IL TUO GLADIATORE","YOUR GLADIATOR")+' <span>'+mgL("personalizza aspetto","customize")+'</span></button>';},
    ritmo:"gld"},
  race:{nome:"STREET RACE",font:"Bungee",col:"#f87171",col2:"#fbbf24",fondo:"#0b0710",hero:"ml/i_1226222ad6.webp",posti:[2,10],bot:5,
    tag:["Derapa, carica il turbo, taglia per primo il traguardo","Drift, charge the boost, cross the line first"],
    pills:[["🏁","2-10 piloti","2-10 drivers"],["🔁","3 giri","3 laps"],["🗺️","piste sempre nuove","new tracks every race"]],
    feat:[["PUNTA E VAI","POINT AND GO","Lo stick indica dove andare: il gas è automatico.","The stick points where to go: throttle is automatic."],
          ["DERAPA","DRIFT","Più la tieni, più turbo: MINI, MEGA, SUPER al rilascio.","Hold it longer for more boost: MINI, MEGA, SUPER on release."],
          ["BOOST E RAMPE","BOOSTS AND RAMPS","I pad ti spingono, la rampa presa dritta ti fa volare.","Pads push you, a ramp taken straight sends you flying."],
          ["IL PODIO","THE PODIUM","Da 6 piloti si pagano i primi tre: 60/25/7%.","With 6+ drivers the top three get paid: 60/25/7%."]],
    vince:["Il primo prende il 92% · podio da 6 piloti","The winner takes 92% · podium with 6+ drivers"],
    nota:["Piatto meno l’8% alla casa · sotto i 6 piloti vince solo il primo · rimborso se resti solo","Pot minus 8% to the house · under 6 drivers only the winner is paid · refund if you’re left alone"],
    regole:[["🕹️","PUNTA E VAI","POINT AND GO","lo stick indica DOVE andare: il gas è automatico","the stick points WHERE to go: the throttle is automatic"],
            ["🔥","DERAPA E VINCI","DRIFT TO WIN","più la tieni, più turbo: MINI → MEGA → SUPER al rilascio","the longer you hold it, the more boost: MINI → MEGA → SUPER on release"],
            ["⚡","BOOST PADS","BOOST PADS","prendili sulla traiettoria","grab them on your racing line"],
            ["🛫","RAMPE","RAMPS","il trapezio bianco lancia in volo chi lo prende dritto e veloce: in aria non si sterza e in atterraggio si perde aderenza · di traverso non lancia","the white trapezoid launches whoever hits it straight and fast: no steering in the air and you lose grip on landing · sideways it won’t launch"],
            ["🏆","IL PODIO","THE PODIUM","3 giri su piste sempre diverse · con 6+ piloti 60/25/7% del piatto ai primi 3, sotto i 6 il 92% al primo","3 laps on always-new tracks · with 6+ drivers 60/25/7% of the pot to the top 3, under 6 the winner gets 92%"]],
    extra:function(){return '<button class="action-btn" style="width:100%;margin:8px 0 2px;background:linear-gradient(135deg,#1f2937,#111827);border:1px solid rgba(248,113,113,.5);color:#fca5a5;" onclick="rcCarEditor()">🎨 '+mgL("LA TUA AUTO","YOUR CAR")+'</button>'+mgRegoleBtn("race");},
    ritmo:"rtd"},
  calcio:{nome:"DERBY",font:"Bungee",col:"#4ade80",col2:"#facc15",fondo:"#050d09",hero:"ml/i_3f3814c1bb.webp",posti:[4,8],bot:1,
    allena:["1 contro 1 con un bot, e i portieri bot","1 vs 1 against a bot, with bot goalkeepers"],
    tag:["Calcio a squadre: il team vincente si divide il piatto","Team football: the winning team splits the pot"],
    pills:[["⚽","da 1v1 a 4v4","1v1 to 4v4"],["⏱️","3 minuti","3 minutes"],["🧱","la palla non esce mai","the ball never goes out"]],
    feat:[["PASSA","PASS","Direzione dallo stick, aim-assist leggero sul compagno.","Aim with the stick, light aim-assist on your teammate."],
          ["TIRA","SHOOT","Tieni premuto: l’anello sul tasto è la potenza.","Hold it: the ring on the button is the power."],
          ["SPECIALE","SPECIAL","Cross con la palla, scivolata senza.","Cross with the ball, slide tackle without."],
          ["LA SQUADRA","THE TEAM","Chi vince si divide il 92% del piatto.","The winners split 92% of the pot."]],
    vince:["La squadra vincente si divide il 92%","The winning team splits 92%"],
    notaSoldi:["Squadre da 1v1 a 4v4 · parte anche in 2 coi portieri bot · rimborso se il conteggio resta dispari","Teams from 1v1 to 4v4 · it starts even with 2, with bot goalkeepers · refund if the count stays odd"],
    nota:["Piatto meno l’8% alla casa, in parti uguali fra i vincitori · sponde vive, 3 minuti","Pot minus 8% to the house, split equally among the winners · live walls, 3 minutes"],
    regole:[["🎯","PASSA","PASS","direzione dallo stick · aim-assist leggero sul compagno","direction from the stick · light aim-assist on your teammate"],
            ["⚽","TIRA","SHOOT","tieni premuto: l’anello sul tasto è la potenza · il cerchio ai piedi è la portata, verde = parte","hold it: the ring on the button is the power · the circle at your feet is the reach, green = it goes"],
            ["🎯","SE NON PARTE","IF IT DOESN’T GO","resta armato per un attimo e parte appena la palla rientra · a 1,5 secondi parte da solo","it stays armed for a moment and fires as soon as the ball comes back · after 1.5 seconds it fires by itself"],
            ["⭐","SPECIALE","SPECIAL","CROSS con palla · SCIVOLATA senza · SCAMBIA portiere nei kickoff","CROSS with the ball · SLIDE without · SWAP goalkeeper at kickoff"],
            ["🏆","LE SQUADRE","THE TEAMS","da 1v1 a 4v4, 3 minuti · la palla non esce mai · il team vincente si divide il 92% del piatto","from 1v1 to 4v4, 3 minutes · the ball never goes out · the winning team splits 92% of the pot"]],
    extra:function(){var h='<button class="action-btn" style="width:100%;margin:8px 0 2px;background:linear-gradient(135deg,#14261b,#0d1a12);border:1px solid rgba(74,222,128,.5);color:#86efac;" onclick="derbyEditor()">🎨 '+mgL("IL TUO CALCIATORE","YOUR PLAYER")+'</button>';
      try{if(typeof derbyHdBtn==="function")h+=derbyHdBtn();}catch(e){}
      return h+mgRegoleBtn("calcio");},
    prima:function(){try{if(typeof derbyLookSync==="function")derbyLookSync();}catch(e){}},
    ritmo:"rtd"},
  uno:{nome:"UNO NO MERCY",breve:["NO MERCY","NO MERCY"],font:"Bungee",col:"#ef4444",col2:"#facc15",fondo:"#0a0608",hero:"ml/i_e26a55abdd.webp",posti:[2,10],bot:3,lobGiochi:["uno","unoc"],
    tag:["Senza pietà: +6, +10 e a 25 carte sei fuori","No mercy: +6, +10 and at 25 cards you’re out"],
    pills:[["🎴","2-10 al tavolo","2-10 at the table"],["💀","25 carte = fuori","25 cards = out"],["➕","si impila","stacking"]],
    feat:[["TOCCA UNA CARTA","TAP A CARD","Si accendono solo quelle giocabili.","Only playable cards light up."],
          ["25 E SEI FUORI","25 AND YOU’RE OUT","A 25 carte in mano sei eliminato.","At 25 cards in hand you’re knocked out."],
          ["IMPILA","STACK","+2 e +4 fra loro, ai neri solo coi neri.","+2 and +4 stack, black only on black."],
          ["UNO! DA SOLO","AUTO UNO!","A una carta l’annuncio parte da solo.","At one card the call goes off by itself."]],
    vince:["Chi finisce le carte prende il 92%","First to empty their hand takes 92%"],
    nota:["Piatto meno l’8% alla casa · vince uno solo, niente podio · rimborso se resti solo","Pot minus 8% to the house · one winner, no podium · refund if you’re left alone"],
    regole:[["🎴","TOCCA UNA CARTA","TAP A CARD","si accendono solo quelle giocabili · le nere aprono la ruota dei colori","only playable cards light up · black cards open the colour wheel"],
            ["💀","25 CARTE E SEI FUORI","25 CARDS AND YOU’RE OUT","il contatore accanto a ogni faccia si scalda avvicinandosi al limite","the counter next to each face heats up as it nears the limit"],
            ["➕","IMPILA LE PESCATE","STACK THE DRAWS","+2 e +4 di colore fra loro · ai neri rispondi solo con neri, o mangi tutto","coloured +2 and +4 stack together · answer black cards only with black ones, or you draw it all"],
            ["📣","UNO! È AUTOMATICO","UNO! IS AUTOMATIC","a una carta l’annuncio parte da solo: nessuno può punirti per non averlo detto","at one card the call goes off by itself: nobody can punish you for not saying it"],
            ["💰","IL PREMIO","THE PRIZE","vince uno solo: chi finisce le carte prende il piatto meno l’8% alla casa","one winner: whoever empties their hand takes the pot minus 8% to the house"]],
    extra:function(){return mgMazzi()+mgRegoleBtn("uno");},
    ritmo:"rtd"},
  unoc:{nome:"UNO",breve:["CLASSICO","CLASSIC"],font:"Bungee",col:"#f97316",col2:"#38bdf8",fondo:"#0a0608",hero:"ml/i_e26a55abdd.webp",posti:[2,10],bot:3,lobGiochi:["uno","unoc"],
    tag:["L’UNO di sempre: nessuno viene eliminato","Classic UNO: nobody gets knocked out"],
    pills:[["🎴","2-10 al tavolo","2-10 at the table"],["➕","c’è anche il +1","there’s a +1 too"],["📣","UNO! automatico","auto UNO!"]],
    feat:[["TOCCA UNA CARTA","TAP A CARD","Si accendono solo quelle giocabili.","Only playable cards light up."],
          ["IMPILA","STACK","Stesso colore o valore: chi non risponde pesca tutto.","Same colour or value: whoever can’t answer draws it all."],
          ["IL +1","THE +1","Carta di casa: il Jolly +4 nero resta da quattro.","House card: the black Wild +4 stays at four."],
          ["UNO! DA SOLO","AUTO UNO!","A una carta l’annuncio parte da solo.","At one card the call goes off by itself."]],
    vince:["Chi finisce le carte prende il 92%","First to empty their hand takes 92%"],
    nota:["Piatto meno l’8% alla casa · vince uno solo, niente podio · rimborso se resti solo","Pot minus 8% to the house · one winner, no podium · refund if you’re left alone"],
    regole:[["🎴","TOCCA UNA CARTA","TAP A CARD","si accendono solo quelle giocabili · le nere aprono la ruota dei colori","only playable cards light up · black cards open the colour wheel"],
            ["➕","LE PESCATE SI IMPILANO","DRAWS STACK","stesso colore o stesso valore · chi non risponde pesca tutta la somma","same colour or same value · whoever can’t answer draws the whole sum"],
            ["➕","C’È ANCHE IL +1","THERE’S A +1 TOO","carta di casa: non sta nell’UNO da scatola — il Jolly +4 nero resta da quattro","house card, not in the boxed game — the black Wild +4 stays at four"],
            ["📣","UNO! È AUTOMATICO","UNO! IS AUTOMATIC","a una carta l’annuncio parte da solo: nessuno può punirti per non averlo detto","at one card the call goes off by itself: nobody can punish you for not saying it"],
            ["💰","IL PREMIO","THE PRIZE","nessuno viene eliminato e non c’è limite di carte · chi finisce le carte prende il piatto meno l’8% alla casa","nobody is knocked out and there’s no card limit · whoever empties their hand takes the pot minus 8% to the house"]],
    extra:function(){return mgMazzi()+mgRegoleBtn("unoc");},
    ritmo:"rtd"},
  cucu:{nome:"CUCU’",nomeEn:"CUCKOO",font:"Bungee",col:"#93c5fd",col2:"#fde047",fondo:"#070a14",hero:"ml/i_b991436888.webp",posti:[2,10],bot:5,
    tag:["Una carta a testa: la tieni o la passi al vicino","One card each: keep it or pass it on"],
    pills:[["🐦","2-10 al tavolo","2-10 at the table"],["🎴","una carta","one card"],["❤️","3 vite","3 lives"]],
    feat:[["UNA CARTA","ONE CARD","Coperta: asso il più basso, re il più alto.","Face down: ace is lowest, king is highest."],
          ["TENGO O CAMBIO","KEEP OR SWAP","Se cambi, scambi col vicino: non può rifiutare.","Swap with your neighbour: they can’t refuse."],
          ["CUCU’!","CUCKOO!","Chi ha il re lo grida e lo scambio salta.","Whoever holds the king calls it and the swap is off."],
          ["TRE VITE","THREE LIVES","La carta più bassa perde una vita.","The lowest card loses a life."]],
    vince:["Chi resta in piedi prende il 92%","The last one standing takes 92%"],
    nota:["Piatto meno l’8% alla casa · a pari merito le vite le perdono tutti · rimborso se resti solo","Pot minus 8% to the house · on a tie everyone loses a life · refund if you’re left alone"],
    extra:function(){return mgCall("cucuTutBtn");},
    ritmo:"rtd"},
  uomonero:{nome:"UOMO NERO",nomeEn:"BOGEYMAN",font:"Special Elite",col:"#e4e4e7",col2:"#f59e0b",fondo:"#0a0a0c",hero:"ml/i_cd0def121c.webp",posti:[3,8],bot:4,
    tag:["Scarti le coppie: chi resta con l’Uomo Nero ha perso","Discard the pairs: whoever is left with the Bogeyman loses"],
    pills:[["🃏","3-8 al tavolo","3-8 at the table"],["🂠","41 carte","41 cards"],["👤","una senza coppia","one without a pair"]],
    feat:[["LE COPPIE","PAIRS","Due carte con lo stesso numero se ne vanno.","Two cards with the same number are thrown away."],
          ["ALLA CIECA","BLIND DRAW","Peschi dal vicino: vedi solo i dorsi.","You draw from your neighbour: backs only."],
          ["ESCI PRIMA","GET OUT FIRST","Chi finisce le carte è salvo: prima esci, meglio è.","Run out of cards and you’re safe: the sooner the better."],
          ["L’UOMO NERO","THE BOGEYMAN","Chi lo tiene alla fine perde. Non si pareggia.","Whoever holds him at the end loses. No draws."]],
    vince:["Premi a scala: 60/40 in tre, 50/30/20 da quattro","Tiered prizes: 60/40 with three, 50/30/20 with four+"],
    nota:["Le fette si prendono sul piatto meno l’8% alla casa · chi resta con l’Uomo Nero non prende niente","The cuts come from the pot minus 8% to the house · whoever is left with the Bogeyman gets nothing"],
    extra:function(){return mgCall("unrTutBtn");},
    ritmo:"rtd"},
  burraco:{nome:"BURRACO",font:"Cinzel",col:"#34d399",col2:"#fbbf24",fondo:"#04100b",hero:"ml/i_40515e675b.webp",posti:[2,4],bot:3,
    tag:["Scale e tris fino al burraco: si vince a 1000 punti","Runs and sets up to the burraco: first to 1000 wins"],
    pills:[["🂡","2-4 al tavolo","2-4 at the table"],["🎯","1000 punti","1000 points"],["👥","in 4 a coppie","pairs with 4"]],
    feat:[["IL TURNO","THE TURN","Peschi o prendi il monte, cali, scarti.","Draw or take the pile, meld, discard."],
          ["SI CALA","MELDS","Tris o scale dello stesso seme, da 3 carte.","Sets or same-suit runs, 3 cards or more."],
          ["IL BURRACO","THE BURRACO","7 carte: senza un burraco non chiudi.","7 cards: no burraco, no closing."],
          ["IL POZZETTO","THE POZZETTO","Finisci le carte, prendi il pozzetto, poi chiudi.","Empty your hand, take the pozzetto, then close."]],
    vince:["Chi arriva a 1000 prende il 92% (la coppia lo divide)","First to 1000 takes 92% (a pair splits it)"],
    nota:["In due uno contro uno · in quattro due coppie · in tre si comincia da soli · 240 secondi senza mosse e sei fuori: la posta resta alla casa","Two: one on one · four: two pairs · three: everyone starts alone · 240 seconds without a move and you’re out: the stake stays with the house"],
    extra:function(){return mgCall("burTutBtn");},
    ritmo:"rtd"},
  settemezzo:{nome:"SETTE E MEZZO",nomeEn:"SEVEN AND A HALF",font:"Cinzel",col:"#ff9900",col2:"#ffd36b",fondo:"#0c0805",hero:"ml/i_417a5b62df.webp",posti:[2,6],bot:3,
    tag:["Carta o sto? Senza banco, il piatto va a uno solo","Hit or stand? No dealer, one player takes the pot"],
    pills:[["👑","2-6 al tavolo","2-6 at the table"],["🃏","carte napoletane","Neapolitan cards"],["🎴","la matta","the wild king"]],
    feat:[["LE CARTE","THE CARDS","Dall’asso al 7 il loro numero, le figure mezzo punto.","Ace to 7 count their number, face cards half a point."],
          ["CARTA O STO","HIT OR STAND","Una coperta che vedi solo tu: oltre 7½ sballi.","One hidden card only you see: over 7½ you bust."],
          ["LA MANO","THE HAND","Vince il punto più alto, a pari il 7½ reale.","Highest score wins, on a tie the royal 7½."],
          ["LA PARTITA","THE MATCH","Mano vinta 2 punti, divisa 1: vince chi è avanti.","Hand won 2 points, split 1: whoever leads wins."]],
    vince:["Chi vince prende il 95%","The winner takes 95%"],
    nota:["Piatto meno il 5% alla casa · in 2 chi esce perde subito, da 3 in su il suo posto lo gioca un bot","Pot minus 5% to the house · with 2 whoever leaves loses at once, from 3 up a bot plays their seat"],
    regole:[["🃏","LE CARTE","THE CARDS","dall’asso al 7 valgono il loro numero, le figure mezzo punto · la matta è il re di denari: vale quello che ti serve","ace to 7 are worth their number, face cards half a point · the wild card is the king of coins: it’s worth whatever you need"],
            ["👆","IL TURNO","THE TURN","hai una carta coperta che vedi solo tu: chiedi CARTA (scoperta) o di’ STO · oltre 7½ sballi","you have one hidden card only you can see: ask for a CARD (face up) or STAND · over 7½ you bust"],
            ["🏅","CHI VINCE LA MANO","WHO WINS THE HAND","il punto più alto · a pari punto il sette e mezzo reale (un 7 e una figura), poi chi ha meno carte","the highest score · on a tie the royal seven and a half (a 7 and a face card), then fewer cards"],
            ["🔢","LA PARTITA","THE MATCH","mano vinta 2 punti, mano divisa 1 a testa: vince chi è avanti alla fine delle mani · in testa pari si gioca una mano secca","hand won 2 points, split hand 1 each: whoever leads after the last hand wins · a tie at the top plays one sudden-death hand"],
            ["💰","IL PREMIO","THE PRIZE","tutto al vincitore, 5% alla casa","everything to the winner, 5% to the house"]],
    extra:function(){return mgRegoleBtn("settemezzo");},
    prima:function(){if(typeof smrtPrecarica==="function"&&typeof SMRT!=="undefined"&&SMRT.loads===0){try{smrtPrecarica();}catch(e){}}},
    ritmo:"rtd"},
  tappo:{nome:"BISCA",font:"Bungee",col:"#6eb250",col2:"#facc15",fondo:"#070b06",hero:"ml/i_5811ae7088.webp",posti:[2,7],bot:3,
    tag:["Quattro uguali, poi la mano sul mazzo","Four of a kind, then slap the deck"],
    pills:[["✋","2-7 al tavolo","2-7 at the table"],["🔄","passa una carta","pass a card"],["❤️","le vite","lives"]],
    feat:[["IL GIRO","THE ROUND","Tutti insieme passate una carta a sinistra: 6 secondi.","Everyone passes a card to the left: 6 seconds."],
          ["LA MANO","THE SLAP","Quattro uguali? Tocca il mazzo: l’ultimo perde una vita.","Four of a kind? Slap the deck: the last one loses a life."],
          ["A VUOTO","FALSE SLAP","Tocchi senza quartetto: la vita la perdi tu.","Slap without four of a kind: you lose the life."],
          ["LE VITE","LIVES","Chi le finisce è fuori: l’ultimo prende tutto.","Run out and you’re out: the last one takes it all."]],
    vince:["L’ultimo in gioco prende il 95%","The last one in takes 95%"],
    nota:["Piatto meno il 5% alla casa · conta il riflesso: il server toglie la tua rete dal tuo tempo","Pot minus 5% to the house · reflexes count: the server takes your network lag off your time"],
    regole:[["🃏","LE CARTE","THE CARDS","quattro carte a testa, e tanti quartetti quanti sono i giocatori: le tue le vedi solo tu","four cards each, and as many sets of four as there are players: only you see yours"],
            ["🔄","IL GIRO","THE ROUND","tutti insieme passate una carta al vicino di sinistra: hai 6 secondi","all together you pass one card to the neighbour on your left: you have 6 seconds"],
            ["✋","LA MANO","THE SLAP","hai quattro carte uguali? tocca il mazzo al centro: da quel momento devono toccarlo tutti, e l’ultimo perde una vita","four of a kind? slap the deck in the middle: from then on everyone has to, and the last one loses a life"],
            ["🙈","A VUOTO","FALSE SLAP","se tocchi il mazzo senza quattro carte uguali la vita la perdi tu","slap the deck without four of a kind and you lose the life"],
            ["❤️","LE VITE","LIVES","chi le finisce è fuori · l’ultimo che resta prende tutto il piatto, 5% alla casa","run out and you’re out · the last one left takes the whole pot, 5% to the house"]],
    extra:function(){return mgRegoleBtn("tappo");},
    prima:function(){if(typeof tprtPrecarica==="function"&&typeof TPRT!=="undefined"&&TPRT.loads===0){try{tprtPrecarica();}catch(e){}}},
    ritmo:"rtd"},
  sbanca:{nome:"SBANCA!",nomeEn:"BREAK THE BANK",font:"Bungee",col:"#b06cff",col2:"#f5c84c",fondo:"#0d0716",hero:"ml/i_1b8861426a.webp",
    tag:["Artiglieria a turni del casinò: il terreno si sbriciola dove colpisci","Turn-based casino artillery: the ground crumbles where you hit"],
    pills:[["💥","2-4 squadre","2-4 teams"],["🌬️","il vento conta","wind matters"],["🌊","acqua che sale","rising water"]],
    feat:[["MIRA","AIM","Trascini dal personaggio: direzione e potenza.","Drag from your character: direction and power."],
          ["IL VENTO","THE WIND","Sempre visibile, cambia a ogni turno.","Always shown, it changes every turn."],
          ["IL TERRENO","THE GROUND","Ogni colpo scava: i pezzi staccati cadono.","Every hit digs: loose chunks fall."],
          ["L’ACQUA","THE WATER","Chi ci cade è fuori, e in morte improvvisa sale.","Fall in and you are out; in sudden death it rises."]],
    vince:["L’ultima squadra in piedi prende il 95%","The last team standing takes 95%"],
    nota:["Piatto meno il 5% alla casa · armi uguali per tutti, mappe speculari · a tempo scaduto vince chi ha più vita","Pot minus 5% to the house · same weapons for all, mirrored maps · at time up the most health wins"],
    regole:[["🎯","IL TURNO","THE TURN","30 secondi: cammini, scegli l’arma, trascini per mirare (direzione e potenza) e spari","30 seconds: walk, pick a weapon, drag to aim (direction and power) and fire"],
            ["🌬️","IL VENTO","THE WIND","cambia a ogni turno ed è sempre visibile: spinge i colpi leggeri","changes every turn and is always shown: it pushes the light shots"],
            ["💣","LE ARMI","THE WEAPONS","le stesse per tutti; le più forti si sbloccano a giri fissi · gli scrigni sono uguali per tutti","the same for everyone; the strongest unlock at fixed rounds · the crates are the same for all"],
            ["🌊","L’ACQUA","THE WATER","chi ci cade è fuori · in morte improvvisa l’acqua sale a ogni turno","fall in and you are out · in sudden death the water rises every turn"],
            ["💰","IL PREMIO","THE PRIZE","vince l’ultima squadra in piedi (a tempo scaduto chi ha più vita): piatto al vincitore, 5% alla casa","the last team standing wins (at time up the most health): pot to the winner, 5% to the house"]],
    extra:function(){return mgRegoleBtn("sbanca");},
    prima:function(){if(typeof sbrtPrecarica==="function"&&typeof SBRT!=="undefined"&&SBRT.loads===0){try{RTD.game="sbanca";sbrtPrecarica();}catch(e){}}},
    ritmo:"rtd"},
  abisso:{nome:"NON SVEGLIARE IL DRAGO",nomeEn:"DON’T WAKE THE DRAGON",font:"Bungee",col:"#ffb347",col2:"#ff5a36",fondo:"#0b0812",hero:"ml/i_d3a8a9632c.webp",
    tag:["Diamant nella tana del drago: avanti o torni su con l’oro?","Diamant in the dragon’s lair: go on or head back with the gold?"],
    pills:[["🐉","2-8 ladri","2-8 thieves"],["🤫","scelte segrete","secret choices"],["⏱️","5 minuti","5 minutes"]],
    feat:[["IN SEGRETO","IN SECRET","Tutti scelgono insieme: avanti o torna su.","Everyone chooses at once: go on or head back."],
          ["L’ORO","THE GOLD","Si divide fra chi va avanti; gli avanzi restano sul sentiero.","Shared by those going on; leftovers stay on the path."],
          ["IL FORZIERE","THE CHEST","Chi torna su mette l’oro al sicuro.","Heading back puts your gold in the chest."],
          ["IL DRAGO","THE DRAGON","Al secondo segno uguale si sveglia.","At the second matching sign it wakes."]],
    vince:["Più oro nel forziere dopo 5 spedizioni","Most gold in the chest after 5 expeditions"],
    nota:["Tutto il piatto al primo · 5% alla casa · a pari oro spareggio fra i pari · seme verificabile a fine partita","The whole pot to the first · 5% to the house · equal gold means a tiebreak · verifiable seed at the end"],
    regole:[["🃏","LA CARTA","THE CARD","a ogni passo si gira una carta: oro da dividere fra chi va avanti, o un segno del drago","each step turns a card: gold shared by those going on, or a sign of the dragon"],
            ["🤫","LA SCELTA","THE CHOICE","5 secondi: AVANTI o TORNA SU, in segreto · le scelte si girano tutte insieme","5 seconds: GO ON or HEAD BACK, in secret · all choices are revealed together"],
            ["🏕️","TORNA SU","HEAD BACK","chi torna su mette l’oro nel forziere e divide gli avanzi · la reliquia va a chi torna su da solo","heading back banks your gold and splits the leftovers · the relic goes to whoever heads back alone"],
            ["🐉","IL RISVEGLIO","THE WAKE-UP","al secondo segno uguale il drago si sveglia: chi è sul sentiero perde l’oro che porta","at the second matching sign the dragon wakes: whoever is on the path loses the gold they carry"],
            ["💰","IL PREMIO","THE PRIZE","5 spedizioni, vince chi ha più oro nel forziere · a pari oro spedizioni di spareggio fra i pari · tutto il piatto al primo, 5% alla casa","5 expeditions, the most gold in the chest wins · equal gold means tiebreak expeditions among the tied · the whole pot to the first, 5% to the house"]],
    extra:function(){return mgRegoleBtn("abisso");},
    prima:function(){if(typeof abrtPrecarica==="function"&&typeof ABRT!=="undefined"&&ABRT.loads===0){try{RTD.game="abisso";abrtPrecarica();}catch(e){}}},
    ritmo:"rtd"},
  hop:{nome:"HOP CLASH",font:"Lilita One",col:"#3fe0b0",col2:"#ffb02e",fondo:"#04201d",hero:"hop/hero_hop.webp",logo:"hop/logo_main_512.webp",posti:[2,6],bot:4,
    tag:["Tutti scelgono in segreto, poi si salta insieme","Everyone picks in secret, then all jump at once"],
    pills:[["🐸","2-6 nello stagno","2-6 in the pond"],["🪷","6 personaggi","6 characters"],["🌊","la cascata","the waterfall"]],
    feat:[["IN SEGRETO","IN SECRET","Tocchi la ninfea dove vuoi saltare: nessuno la vede.","Tap the lily pad you want: nobody sees it."],
          ["TUTTI INSIEME","ALL AT ONCE","Si salta nello stesso istante: sulla stessa ninfea si rimbalza.","Everyone jumps at the same time: same pad means you bounce."],
          ["I POTERI","THE POWERS","Getti, vesce, ondate, conchiglie: le ninfee coi simboli scattano.","Jets, puffballs, waves, shells: pads with symbols fire."],
          ["LA CASCATA","THE WATERFALL","La corrente porta verso la cascata: chi cade perde un cuore.","The current flows to the waterfall: fall in and lose a heart."]],
    vince:["L’ultima rana in piedi prende il 95% del piatto","The last frog standing takes 95% of the pot"],
    nota:["Scegli la tua rana a inizio partita · tutto al vincitore, 5% alla casa · pari al primo posto: spareggio · nessun dado: conta dove salti","Pick your frog at the start · winner takes all, 5% to the house · tied for first: tiebreak · no dice: where you jump is what counts"],
    regole:[["🪷","IL SALTO","THE JUMP","qualche secondo per scegliere una ninfea accesa (fino a 2 caselle), poi PRONTO · saltano tutti nello stesso istante","a few seconds to pick a lit lily pad (up to 2 tiles), then READY · everyone jumps at the same instant"],
            ["✨","POTERI E TRAPPOLE","POWERS AND TRAPS","le ninfee coi simboli scattano quando ci atterri: getti, vesce, ondate, loto, conchiglie · fauci e pantano sono trappole: spingici gli altri","pads with symbols fire when you land: jets, puffballs, waves, lotus, shells · snapper and bog are traps: shove the others in"],
            ["💥","SCONTRI E SPINTE","CLASHES AND SHOVES","in due sulla stessa ninfea si rimbalza, -1 a testa · su chi è rimasto fermo lo spingi via: in acqua perde un cuore","two on the same pad bounce back, -1 each · land on someone who stayed put and you shove them: in the water they lose a heart"],
            ["🌊","LA CASCATA","THE WATERFALL","la corrente porta tutto verso la cascata: le ninfee rosse affondano · più avanti lo stagno si stringe e nel finale la cascata morde tutti","the current carries everything to the waterfall: red pads sink · later the pond shrinks and in the finale the waterfall bites everyone"],
            ["🏆","IL PREMIO","THE PRIZE","4 cuori a testa, vince l’ultima rana in piedi: tutto al vincitore, 5% alla casa · pari al primo posto = spareggio","4 hearts each, the last frog standing wins: winner takes all, 5% to the house · tied for first = tiebreak"]],
    extra:function(){return '<button class="action-btn" style="width:100%;margin:8px 0 2px;background:linear-gradient(135deg,#0b2a24,#04201d);border:1px solid #3fe0b088;color:#3fe0b0;" onclick="mgHopCast()">🐸 '+mgL("I PERSONAGGI","THE CHARACTERS")+' <span>'+mgL("6 rane, un potere a testa","6 frogs, one power each")+'</span></button>'+mgRegoleBtn("hop");},
    prima:function(){if(typeof hprtPrecarica==="function"&&typeof HPRT!=="undefined"&&HPRT.loads===0){try{RTD.game="hop";hprtPrecarica();}catch(e){}}},
    soloLobby:false,
    ritmo:"rtd"},
  turf:{nome:"GAMBLER CITY ROYALE",font:"Bungee",col:"#22d3ee",col2:"#fbbf24",fondo:"#06080f",hero:"ml/i_c56a5394fd.webp",posti:[2,10],bot:4,
    tag:["Battle royale in città: l’ultimo in piedi prende il piatto","City battle royale: the last one standing takes the pot"],
    pills:[["👥","2-10 gambler","2-10 gamblers"],["🔫","8 armi","8 guns"],["🔥","la zona brucia","the zone burns"]],
    feat:[["DOPPIO JOYSTICK","TWIN STICKS","Il sinistro ti muove, il destro mira e spara.","Left stick moves, right stick aims and shoots."],
          ["L’ARSENALE","THE ARSENAL","Pugni, coltello, mazza, e 8 armi dalle casse.","Fists, knife, bat, and 8 guns from the crates."],
          ["AUTO E COVI","CARS AND HIDEOUTS","Guidi con la fisica, nel covo sei invisibile.","Drive with real physics, in a hideout you’re invisible."],
          ["EVENTI LIVE","LIVE EVENTS","Airdrop, retate, blackout, taglie, terremoti.","Airdrops, raids, blackouts, bounties, earthquakes."]],
    vince:["L’ultimo in piedi prende il 92%","The last one standing takes 92%"],
    nota:["Lobby per taglia · piatto meno l’8% alla casa · tetti, casinò e caveau del boss · sali di livello con kill e casse","Lobbies by stake · pot minus 8% to the house · rooftops, casino and the boss vault · level up with kills and crates"],
    extra:function(){return mgCall("gcrtBtn")+'<button class="twr-editbtn" onclick="twrOpenEditor()">🎩 '+mgL("IL TUO MAFIOSO","YOUR MOBSTER")+' <span>'+mgL("personalizza aspetto","customize")+'</span></button>';},
    ritmo:"twr"}
};
function mgModi(c){
  var q=[{k:"allena",i:"🤖",t:mgL("ALLENATI","PRACTICE"),s:mgAllenaTxt(c),tag:mgL("GRATIS","FREE")},
         {k:"gratis",i:"🎟",t:mgL("GRATIS","FREE"),s:mgL("Persone vere, niente soldi","Real people, no money"),tag:"LOBBY"}];
  if(!c.soloLobby)q.push({k:"soldi",i:"💰",t:mgL("A SOLDI","FOR MONEY"),s:mgL(c.vince[0],c.vince[1]),tag:mgEur(0.5)+" – "+mgEur(50)});
  q.push({k:"amici",i:"👥",t:c.soloLobby?mgL("A SOLDI CON IL GRUPPO","FOR MONEY WITH THE GROUP"):mgL("CON AMICI","WITH FRIENDS"),s:mgL("La tua lobby nel gruppo","Your lobby in the group"),tag:c.posti[0]+"-"+c.posti[1]+" "+mgL("POSTI","SEATS")});
  return q;
}
function mgTier(g){var c=MG_GIOCHI[g];if(c&&c.ritmo==="twr")return (typeof TWR!=="undefined"&&TWR.tier||"1");return (c&&c.ritmo==="gld")?(typeof GLD!=="undefined"&&GLD.tier||"1"):(typeof RTD!=="undefined"&&RTD.tier||"1");}
function mgScelta(el,g){
  var c=MG_GIOCHI[g];if(!c||!el)return false;
  try{
    if(g==="deadmoney"){try{if(typeof DMRT!=="undefined"&&DMRT.aperto&&RTD.ui!=="match"&&typeof rtdChiudiDeadmoneyRT==="function")rtdChiudiDeadmoneyRT(true);}catch(e){}}
    if(c.prima)c.prima();
    mgFont();
    var mm=MG.modo[g]||mgMem("mg_modo_"+g),modi=mgModi(c);
    if(!modi.some(function(q){return q.k===mm;}))mm="allena";
    MG.modo[g]=mm;
    var h='<div class="mg-sc" id="mg-sc" data-g="'+g+'" style="--mg1:'+c.col+';--mg2:'+c.col2+';--mgf:'+c.fondo+';--mgfont:\''+c.font+'\'">';
    h+='<section class="mg-hero mg-in" style="--i:0"><div class="mg-bg" style="background-image:url(\''+c.hero+'\')"></div><div class="mg-fog"></div>'
      +'<div class="mg-ht">'+(c.logo?'<img class="mg-logoimg" src="'+c.logo+'" alt="" decoding="async" onerror="this.remove()">':'')+'<div class="mg-titolo'+(c.logo?' mg-tsost':'')+'">'+mgEsc((c.nomeEn&&mgEn())?c.nomeEn:c.nome)+'</div><div class="mg-tag">'+mgEsc(mgL(c.tag[0],c.tag[1]))+'</div>'
      +'<div class="mg-pills">'+c.pills.map(function(p){return '<span>'+p[0]+' '+mgEsc(mgL(p[1],p[2]))+'</span>';}).join("")+'</div></div></section>';
    h+='<div class="mg-feat mg-in" style="--i:1">'+c.feat.map(function(f){return '<div><b>'+mgEsc(mgL(f[0],f[1]))+'</b>'+mgEsc(mgL(f[2],f[3]))+'</div>';}).join("")+'</div>';
    var ex=c.extra?c.extra():""; if(typeof tut2011Btn==="function")ex+=tut2011Btn(g); if(ex)h+='<div class="mg-extra mg-in" style="--i:2">'+ex+'</div>';
    h+='<div class="mg-lbl mg-in" style="--i:3">'+mgL("COME VUOI GIOCARE?","HOW DO YOU WANT TO PLAY?")+'</div><div class="mg-modi" id="mg-modi">';
    modi.forEach(function(q,i){
      h+='<button type="button" class="mg-modo mg-in m-'+q.k+(mm===q.k?' sel':'')+'" style="--i:'+(4+i)+'" data-m="'+q.k+'" onclick="mgSceltaModo(\''+g+'\',\''+q.k+'\')">'
        +'<span class="mg-mi">'+q.i+'</span><span class="mg-mt">'+q.t+'</span><span class="mg-ms">'+q.s+'</span><span class="mg-mtag">'+q.tag+'</span></button>';
    });
    h+='</div><div class="mg-pan mg-in" style="--i:8" id="mg-pan">'+mgPannello(g)+'</div>';
    if(c.nota)h+='<div class="mg-cas mg-in" style="--i:9">'+mgEsc(mgL(c.nota[0],c.nota[1]))+'</div>';
    h+='</div>';
    try{document.querySelectorAll("#mg-sc").forEach(function(x){if(el.contains(x))return;x.removeAttribute("id");x.querySelectorAll("[id]").forEach(function(y){if(/^mg-/.test(y.id))y.removeAttribute("id");});});}catch(e){}
    el.innerHTML=h;
    if(typeof loadBalance==="function"){try{var pr=loadBalance();if(pr&&pr.then)pr.then(function(){mgRiepilogo(g);});}catch(e){}}
    mgLobbyCarica(g,false);
    return true;
  }catch(e){try{console.warn("mgScelta",e);}catch(_e){}return false;}
}
function mgSceltaModo(g,k){
  MG.modo[g]=k;mgMem("mg_modo_"+g,k);
  try{tg.HapticFeedback&&tg.HapticFeedback.selectionChanged();}catch(e){}
  document.querySelectorAll("#mg-modi .mg-modo").forEach(function(b){b.classList.toggle("sel",b.getAttribute("data-m")===k);});
  var p=document.getElementById("mg-pan");
  if(p){p.innerHTML=mgPannello(g);p.classList.remove("cambia");void p.offsetWidth;p.classList.add("cambia");
    try{var r=p.getBoundingClientRect();if(r.top>window.innerHeight-140)p.scrollIntoView({behavior:"smooth",block:"nearest"});}catch(e){}}
  if(k==="gratis"||k==="amici")mgLobbyCarica(g,false);
}
function mgPannello(g){
  var c=MG_GIOCHI[g],k=MG.modo[g],h="";
  if(k==="soldi"){
    var t=mgTier(g);
    h+='<div class="mg-pk">'+mgL("LA POSTA","STAKE")+'</div><div class="mg-fiches">';
    mgFasce().forEach(function(f,i){var v=parseFloat(f[0]);h+='<button type="button" class="mg-fiche f'+i+(f[0]===t?' sel':'')+'" data-t="'+f[0]+'" onclick="mgPosta(\''+g+'\',\''+f[0]+'\')"><span>'+(v<1?(mgEn()?"0.50":"0,50"):v)+'</span></button>';});
    h+='</div><div class="mg-riep" id="mg-riep"></div><button type="button" class="mg-cta rosso" id="mg-cta" onclick="mgGioca(\''+g+'\')"></button>'
      +'<div class="mg-nota">'+(c.notaSoldi?mgL(c.notaSoldi[0],c.notaSoldi[1]):mgL("Si parte con almeno "+c.posti[0]+" persone, fino a "+c.posti[1]+" · se il tavolo non si riempie la posta torna indietro","Starts with at least "+c.posti[0]+" people, up to "+c.posti[1]+" · if the table doesn’t fill the stake comes back"))+'</div>';
    setTimeout(function(){mgRiepilogo(g);},0);return h;
  }
  if(k==="allena")return '<div class="mg-pt">'+mgAllenaTxt(c)+'</div><div class="mg-pd">'+mgL("Le stesse regole, nessuna posta e nessun premio: è per prendere la mano.","Same rules, no stake and no prize: it’s to get the hang of it.")+'</div>'
    +'<button type="button" class="mg-cta verde" onclick="mgAllena(\''+g+'\')">🤖 <span>'+mgL("ALLENATI ORA","PRACTICE NOW")+'</span></button>';
  if(k==="gratis")return '<div class="mg-pt">'+mgL("Gratis, con persone vere","Free, with real people")+'</div><div class="mg-pd">'+mgL("Entra in una lobby gratis aperta o aprila tu e chiama il gruppo.","Join an open free lobby or open yours and call the group.")+'</div>'
    +'<div class="mg-lob" id="mg-lob">'+mgLobbyHTML(g,true)+'</div><button type="button" class="mg-cta oro" onclick="mgCreaLobby(\''+g+'\',true)">🎟 <span>'+mgL("APRI UNA LOBBY GRATIS","OPEN A FREE LOBBY")+'</span></button>';
  if(k==="amici")return '<div class="mg-pt">'+mgL("La tua lobby","Your lobby")+'</div><div class="mg-pd">'+(c.soloLobby?mgL("A soldi si gioca solo dalla lobby: scegli posti e posta, e il gruppo dove annunciarla.","For money it’s lobby only: pick seats and stake, and the group to announce it in."):mgL("Scegli i posti, gratis o a soldi, e il gruppo dove annunciarla.","Pick the seats, free or for money, and the group to announce it in."))+'</div>'
    +'<div class="mg-lob" id="mg-lob">'+mgLobbyHTML(g,false)+'</div><button type="button" class="mg-cta viola" onclick="mgCreaLobby(\''+g+'\',false)">👥 <span>'+mgL("CREA LA LOBBY","CREATE THE LOBBY")+'</span></button>';
  return h;
}
function mgRiepilogo(g){
  var r=document.getElementById("mg-riep"),b=document.getElementById("mg-cta");if(!r||!b)return;
  var c=MG_GIOCHI[g],posta=parseFloat(mgTier(g))||1,piatto=posta*c.posti[1],saldo=mgSaldo(),basta=saldo>=posta-1e-9;
  r.innerHTML='<div><span>'+mgL("Posta","Stake")+' <b>'+mgEur(posta)+'</b></span> · <span>'+mgL("piatto fino a","pot up to")+' <b>'+mgEur(piatto)+'</b></span></div>'
    +'<div class="mg-sal'+(basta?'':' no')+'">'+mgL("Saldo ","Balance ")+mgEur(saldo)+'</div>';
  b.classList.toggle("spento",!basta);
  b.innerHTML=basta?('⚡ <span>'+mgL("GIOCA A ","PLAY FOR ")+mgEur(posta)+'</span>'):('<span>'+mgL("SALDO INSUFFICIENTE","BALANCE TOO LOW")+'</span>');
}
function mgPosta(g,t){
  if(MG_GIOCHI[g].ritmo==="gld"){if(typeof GLD!=="undefined")GLD.tier=t;}else if(MG_GIOCHI[g].ritmo==="twr"){if(typeof TWR!=="undefined")TWR.tier=t;}else if(typeof RTD!=="undefined")RTD.tier=t;
  try{tg.HapticFeedback&&tg.HapticFeedback.selectionChanged();}catch(e){}
  document.querySelectorAll(".mg-fiche").forEach(function(b){b.classList.toggle("sel",b.getAttribute("data-t")===t);});
  mgRiepilogo(g);
}
function mgGioca(g){
  var posta=parseFloat(mgTier(g))||1;
  if(mgSaldo()<posta-1e-9){toast(mgL("Saldo insufficiente per questa posta","Balance too low for this stake"),"err",2400);return;}
  if(MG.parte)return;MG.parte=1;setTimeout(function(){MG.parte=0;},1500);
  if(MG_GIOCHI[g].ritmo==="gld"){gldJoin();return;}
  if(MG_GIOCHI[g].ritmo==="twr"){twrJoin();return;}
  if(g==="deadmoney"&&typeof DMRT!=="undefined")DMRT.ultimo={modo:"soldi",tier:mgTier(g),daCoda:true};
  rtdJoin();
}
function mgAllena(g){
  if(MG.parte)return;MG.parte=1;setTimeout(function(){MG.parte=0;},1500);
  if(g==="deadmoney"&&typeof DMRT!=="undefined")DMRT.ultimo={modo:"allena"};
  if(MG_GIOCHI[g].ritmo==="gld"){gldPractice();return;}
  if(MG_GIOCHI[g].ritmo==="twr"){twrPractice();return;}
  practiceStart(g);
}
function mgCreaLobby(g,gratis){
  if(g==="deadmoney"&&typeof DMRT!=="undefined")DMRT.ultimo={modo:gratis?"gratis":"amici"};
  lobOpenCreate(g,mgDa(g));
  try{if(gratis){LOB.gratis=true;}else{LOB.gratis=false;LOB.eur=parseFloat(mgTier(g))||1;}if(typeof lobRenderCrea==="function"&&CUR==="lobby")lobRenderCrea();}catch(e){}
}
function mgLobbyCarica(g,forza){
  if(typeof S==="undefined"||!S.userId||MG.lobbyBusy[g])return;
  if(!forza&&MG.lobby[g]&&Date.now()-(MG.lobbyAt[g]||0)<15000)return;
  MG.lobbyBusy[g]=1;
  fetch(BACKEND+"/lobby/list?user_id="+encodeURIComponent(S.userId))
    .then(function(r){return r.json();}).then(function(d){
      MG.lobbyBusy[g]=0;MG.lobbyAt[g]=Date.now();
      MG.lobby[g]=((d&&d.lobbies)||[]).filter(function(c){var lg=MG_GIOCHI[g]&&MG_GIOCHI[g].lobGiochi;return c&&(lg?lg.indexOf(c.game)>=0:c.game===g);});
      var b=document.getElementById("mg-lob");if(b&&document.querySelector('#mg-sc[data-g="'+g+'"]'))b.innerHTML=mgLobbyHTML(g,MG.modo[g]==="gratis");
    }).catch(function(){MG.lobbyBusy[g]=0;});
}
function mgLobbyHTML(g,soloGratis){
  if(!MG.lobby[g])return '<div class="mg-lv">'+mgL("Cerco le lobby aperte…","Looking for open lobbies…")+'</div>';
  var L=MG.lobby[g].filter(function(c){return !soloGratis||c.gratis;});
  if(!L.length)return '<div class="mg-lv">'+(soloGratis?mgL("Nessuna lobby gratis aperta adesso: aprila tu.","No free lobby open right now: open one."):mgL("Nessuna lobby aperta adesso.","No open lobby right now."))+'</div>';
  var h="";
  for(var i=0;i<L.length&&i<4;i++){var c=L[i];
    h+='<button type="button" class="mg-lr" onclick="mgEntraLobby(\''+g+'\',\''+mgEsc(c.lid)+'\','+(c.gratis?1:0)+')"><span class="n">'+mgEsc(c.creator_name||mgL("un giocatore","a player"))+((c.game!==g&&MG_GIOCHI[c.game])?' · '+mgEsc(MG_GIOCHI[c.game].breve?mgL(MG_GIOCHI[c.game].breve[0],MG_GIOCHI[c.game].breve[1]):MG_GIOCHI[c.game].nome):'')+'</span>'
      +'<span class="p'+(c.gratis?' free':'')+'">'+(c.gratis?mgL("GRATIS","FREE"):mgEur(c.stake_eur))+'</span><span class="s">'+(Number(c.seduti)||0)+'/'+(Number(c.posti)||2)+'</span><span class="e">'+mgL("ENTRA","JOIN")+'</span></button>';}
  return h;
}
function mgEntraLobby(g,lid,gratis){
  if(g==="deadmoney"&&typeof DMRT!=="undefined")DMRT.ultimo={modo:gratis?"gratis":"amici"};
  LOB.from=mgDa(g);lobOpen(lid,false);
}
function mgDa(g){var r=MG_GIOCHI[g]&&MG_GIOCHI[g].ritmo;return r==="gld"?"glad":(r==="twr"?"turf":"arc");}
function mgAllenaTxt(c){return c.allena?mgL(c.allena[0],c.allena[1]):mgL("Tu contro "+c.bot+" bot","You vs "+c.bot+" bots");}
function mgRegoleBtn(g){
  var c=MG_GIOCHI[g];if(!c||!c.regole)return "";
  return '<button class="action-btn" style="width:100%;margin:8px 0 2px;background:linear-gradient(135deg,#17130f,#0b0907);border:1px solid '+c.col+'88;color:'+c.col+';" onclick="mgRegole(\''+g+'\')">📖 '+mgL("COME SI GIOCA","HOW TO PLAY")+'</button>';
}
function mgHopCast(){
  if(typeof rtdOv!=="function")return;
  var P=[["tonfo","Tonfo","Panciata","Belly flop","dopo il salto spinge via di 2 chi ti sta attorno (-1)","after the jump shoves everyone around you by 2 (-1)"],
         ["zip","Zip","Superbalzo","Super hop","salta fino a 4 e atterrando spinge via chi gli sta attorno","jumps up to 4 and the landing shoves everyone around"],
         ["axa","Axa","Bolla","Bubble","per un turno i colpi non la feriscono (le cadute sì)","hits can’t hurt her for a turn (falls still do)"],
         ["camu","Camu","Lingua","Tongue","tira a sé il primo che vede in dritto o in diagonale, da 2 a 4 caselle (-1)","pulls in the first one it sees in a straight or diagonal line, 2 to 4 tiles away (-1)"],
         ["grumo","Grumo","Nube","Cloud","avvelena chi gli sta attorno","poisons everyone around him"],
         ["luma","Luma","Lanterna","Lantern","abbaglia e blocca un turno chi le sta attorno (-1)","dazzles and freezes everyone around her for a turn (-1)"]];
  var h='<div class="dpt-hd" style="color:#3fe0b0">🐸 HOP CLASH — '+mgL("I PERSONAGGI","THE CHARACTERS")+'</div>'
    +'<div class="mg-vetrina" style="--mg1:#3fe0b0;--mg2:#ffb02e;--mgf:#04201d;--mgfont:&quot;Lilita One&quot;">'
    +P.map(function(p){return '<div><img src="hop/ritratti/'+p[0]+'_intero.webp?v=20261120" alt="" decoding="async"><b>'+p[1]+'</b><span>'+mgEsc(mgL(p[2],p[3]))+'</span><i>'+mgEsc(mgL(p[4],p[5]))+'</i></div>';}).join("")+'</div>'
    +'<div class="tw-ov-btns"><button class="action-btn gold" onclick="rtdOvClose()">✔ '+mgL("OK","OK")+'</button></div>';
  try{tg.HapticFeedback&&tg.HapticFeedback.selectionChanged();}catch(e){}
  rtdOv(h,true);
}
function mgRegole(g){
  var c=MG_GIOCHI[g];if(!c||!c.regole||typeof rtdOv!=="function")return;
  var nome=(c.nomeEn&&mgEn())?c.nomeEn:c.nome;
  var h='<div class="dpt-hd" style="color:'+c.col+'">📖 '+mgEsc(nome)+' — '+mgL("COME SI GIOCA","HOW TO PLAY")+'</div><div class="tw-rules mg-regole">';
  c.regole.forEach(function(r){h+=twrRule(r[0],mgEsc(mgL(r[1],r[2])),mgEsc(mgL(r[3],r[4])));});
  h+='</div><div class="tw-ov-btns"><button class="action-btn gold" onclick="rtdOvClose()">✔ '+mgL("HO CAPITO","GOT IT")+'</button></div>';
  try{tg.HapticFeedback&&tg.HapticFeedback.selectionChanged();}catch(e){}
  rtdOv(h,true);
}
function mgMazzi(){
  var g=(typeof RTD!=="undefined")?RTD.game:"uno";
  return '<div class="mg-lbl">'+mgL("QUALE MAZZO?","WHICH DECK?")+'</div><div class="mg-mazzi">'
    +'<button type="button" class="mg-modo'+(g==="unoc"?' sel':'')+'" onclick="mgMazzo(\'unoc\')"><span class="mg-mt">🎴 '+mgL("CLASSICO","CLASSIC")+'</span><span class="mg-ms">'+mgL("L’UNO di sempre · nessuno viene eliminato","Classic UNO · nobody gets knocked out")+'</span></button>'
    +'<button type="button" class="mg-modo'+(g==="uno"?' sel':'')+'" onclick="mgMazzo(\'uno\')"><span class="mg-mt">💀 NO MERCY</span><span class="mg-ms">'+mgL("+6, +10, Scarta Tutto · a 25 carte sei FUORI","+6, +10, Discard All · at 25 cards you’re OUT")+'</span></button></div>';
}
function mgMazzo(k){
  if(typeof RTD==="undefined"||RTD.game===k)return;
  try{tg.HapticFeedback&&tg.HapticFeedback.selectionChanged();}catch(e){}
  var y=0;try{y=(document.scrollingElement||document.documentElement).scrollTop;}catch(e){}
  RTD.game=k;window.RTD_GAME=k;rtdShowLobby();
  try{(document.scrollingElement||document.documentElement).scrollTop=y;}catch(e){}
}
