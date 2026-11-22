// GAMBLER BRAWL — il cast del lancio per l'interfaccia (30/10, area UI). Nomi, motti, colori e racconti dai testi di
// GAMBLER SMASH (roster_1410/roster.js, smash_1410/personaggi_testi.js). Il ruolo vale solo finché eroi.js non ne dà uno suo.
// L'ordine è quello degli 8 del lancio (dal 30/10 sera anche Pistolero e Arciere) (PIANO.md). Gli eroi che il motore non ha ancora si mostrano come «in arrivo».
(function (root) {
  'use strict';
  root.CAST_UI = {
 "ORDINE": [
  "samurai",
  "bot",
  "croupier",
  "buttafuori",
  "agamennone",
  "lupo",
  "pistolero",
  "arciere",
  "dama",
  "asso",
  "regina",
  "fante"
 ],
 "E": {
  "samurai": {
   "nome": "SAMURAI JACKPOT",
   "motto_it": "Tre sette. Un colpo.",
   "motto_en": "Triple seven. One strike.",
   "col": "#ffcf33",
   "col2": "#d6312b",
   "ruolo": "assassino",
   "sopra_it": "Lo spadaccino che ha giocato la sua anima a dadi",
   "sopra_en": "The swordsman who rolled dice for his soul",
   "lore_it": "Ha perso il suo signore, la sua casa e la sua spada in una sola notte di dadi. La spada l’ha ripresa con un colpo solo, e da allora porta la zucca dei dadi alla cintura per ricordarsi il prezzo. Non parla, non bluffa: estrae, taglia, rinfodera. Il conto lo fa la lama.",
   "lore_en": "He lost his lord, his home and his sword in a single night of dice. He won the sword back with one cut, and since then he carries the dice gourd at his belt to remember the price. He does not talk, he does not bluff: draw, cut, sheathe. The blade keeps the score."
  },
  "bot": {
   "nome": "GAMBLER BOT",
   "motto_it": "Punto tutto. Su di me.",
   "motto_en": "All in. On me.",
   "col": "#ff3b5c",
   "col2": "#2fc77a",
   "ruolo": "tiratore",
   "sopra_it": "La slot machine che ha imparato a combattere",
   "sopra_en": "The slot machine that learned to fight",
   "lore_it": "Era la slot più vecchia del casinò, quella in fondo che nessuno guardava più. Una notte un fulmine ha colpito l’insegna e lei si è alzata in piedi, con i rulli che giravano ancora. Adesso punta tutto su se stessa, spara fiche e gettoni, e ogni tanto fa jackpot.",
   "lore_en": "It was the oldest slot in the casino, the one at the back nobody looked at anymore. One night lightning struck the sign and it stood up, reels still spinning. Now it bets everything on itself, shoots chips and coins, and every now and then it hits the jackpot."
  },
  "croupier": {
   "nome": "CROUPIER",
   "motto_it": "Rien ne va plus.",
   "motto_en": "No more bets.",
   "col": "#2fc77a",
   "col2": "#d6312b",
   "ruolo": "controllo",
   "sopra_it": "Il banco vince sempre",
   "sopra_en": "The house always wins",
   "lore_it": "Trent’anni dietro il tavolo verde e non ha mai sbagliato un conto. Conosce ogni mazzo a memoria e sa sempre quale carta sta per uscire: per questo nessuno vuole giocare contro di lui, e per questo sale sul palco con il rastrello in mano. Quando dice «rien ne va plus», non si torna indietro.",
   "lore_en": "Thirty years behind the green table and he has never miscounted. He knows every deck by heart and always knows which card comes next: that is why nobody wants to play against him, and why he steps on stage with the rake in hand. When he says “rien ne va plus”, there is no going back."
  },
  "buttafuori": {
   "nome": "BUTTAFUORI",
   "motto_it": "Non sei in lista.",
   "motto_en": "You are not on the list.",
   "col": "#7a8cff",
   "col2": "#1b1b22",
   "ruolo": "tank",
   "sopra_it": "Non sei in lista",
   "sopra_en": "You are not on the list",
   "lore_it": "Sta alla porta del privé da quando il casinò ha aperto. Abito nero, occhiali scuri, auricolare: non ha mai dovuto alzare le mani due volte con la stessa persona. Sul palco fa lo stesso lavoro di sempre: decide chi resta e chi esce. E di solito esci tu.",
   "lore_en": "He has stood at the door of the VIP room since the casino opened. Black suit, dark glasses, earpiece: he has never had to lay hands on the same person twice. On stage he does the same job as always: he decides who stays and who leaves. And usually you leave."
  },
  "agamennone": {
   "nome": "AGAMENNONE",
   "motto_it": "Re dei re, re del tavolo.",
   "motto_en": "King of kings, king of the table.",
   "col": "#e3ad40",
   "col2": "#c0262d",
   "ruolo": "lanciatore",
   "sopra_it": "Re dei re, re del tavolo",
   "sopra_en": "King of kings, king of the table",
   "lore_it": "Ha conquistato il tavolo VIP come si conquista una città: con lo scudo davanti e la lancia pronta. Non gioca per vincere una mano, gioca per prendersi tutto il casinò, una fiche alla volta. I suoi uomini lo seguono in falange, e quando alza la lancia il tavolo è già suo.",
   "lore_en": "He took the VIP table the way you take a city: shield in front, spear ready. He does not play to win a hand, he plays to take the whole casino, one chip at a time. His men follow him in phalanx, and when he raises the spear the table is already his."
  },
  "lupo": {
   "nome": "LUPO MANNARO",
   "motto_it": "Stanotte la luna è mia.",
   "motto_en": "Tonight the moon is mine.",
   "col": "#b48cff",
   "col2": "#d6312b",
   "ruolo": "assassino",
   "sopra_it": "Il croupier che non doveva vedere la luna",
   "sopra_en": "The dealer who should never see the moon",
   "lore_it": "Di giorno distribuiva carte al tavolo del blackjack, con il gilet rosso stirato. Una notte di luna piena il casinò rimase aperto fino all’alba, e lui non tornò mai più dietro al tavolo. Adesso caccia fra le slot, e chi lo sente ululare sa che la partita è già finita.",
   "lore_en": "By day he dealt cards at the blackjack table in a pressed red vest. One full-moon night the casino stayed open until dawn, and he never went back behind the table. Now he hunts between the slots, and whoever hears him howl knows the game is already over."
  },
  "pistolero": {
   "nome": "PISTOLERO",
   "nome_en": "GUNSLINGER",
   "motto_it": "Mezzogiorno. Estrai.",
   "motto_en": "High noon. Draw.",
   "col": "#fbbf24",
   "col2": "#8a5a2c",
   "ruolo": "tiratore",
   "sopra_it": "Il più veloce a estrarre di tutto il saloon",
   "sopra_en": "The fastest draw in the whole saloon",
   "lore_it": "Sei colpi nel tamburo e il sesto è sempre d'oro. Gioca a poker con la pistola sul tavolo e il cappello calato sugli occhi: quando suona mezzogiorno, ha già vinto la mano.",
   "lore_en": "Six rounds in the cylinder and the sixth is always gold. He plays poker with the gun on the table and the hat over his eyes: when noon strikes, he has already won the hand."
  },
  "arciere": {
   "nome": "ARCIERE",
   "nome_en": "ARCHER",
   "motto_it": "Un colpo, una fiche.",
   "motto_en": "One arrow, one chip.",
   "col": "#2fbf71",
   "col2": "#ffd23b",
   "ruolo": "tiratore",
   "sopra_it": "Un colpo, una fiche",
   "sopra_en": "One shot, one chip",
   "lore_it": "Al tiro a segno del luna park non ha mai mancato un bersaglio, finché il padrone non l’ha cacciato perché vinceva troppo. Adesso tira frecce con la punta a fiche dalla galleria del casinò.",
   "lore_en": "At the fair’s shooting gallery he never missed a target, until the owner threw him out for winning too much. Now he shoots chip-tipped arrows from the casino balcony."
  },
  "pizzaiolo": {
   "nome": "PIZZAIOLO",
   "nome_en": "PIZZA CHEF",
   "motto_it": "Una margherita… in faccia!",
   "motto_en": "One margherita… to the face!",
   "col": "#ff5a36",
   "col2": "#ffd166",
   "ruolo": "lanciatore",
   "sopra_it": "Sforna pizze che volano sopra i muri",
   "sopra_en": "Bakes pizzas that fly over walls",
   "lore_it": "Il forno del casinò non chiude mai e lui nemmeno: chi perde al tavolo si prende una pizza bollente, al volo.",
   "lore_en": "The casino oven never closes and neither does he: whoever loses at the table gets a hot pizza, airmail."
  },
  "dj": {
   "nome": "DJ BASSO",
   "nome_en": "DJ BASS",
   "motto_it": "Alza il volume, abbassa la puntata.",
   "motto_en": "Pump the volume, drop the bet.",
   "col": "#2ee6ff",
   "col2": "#ff3df2",
   "ruolo": "tiratore",
   "sopra_it": "Alza il volume, abbassa la puntata",
   "sopra_en": "Turn the volume up, the stakes down",
   "lore_it": "Suona nel club sotto il casinò fino all’alba. Con il basso giusto fa tremare i bicchieri, le slot e anche gli avversari.",
   "lore_en": "He plays the club under the casino until dawn. With the right bass he shakes glasses, slot machines and opponents too."
  },
  "veggente": {
   "nome": "LA VEGGENTE",
   "nome_en": "THE SEER",
   "motto_it": "Ho già visto come finisce.",
   "motto_en": "I've seen how this ends.",
   "col": "#c86bff",
   "col2": "#ffd23b",
   "ruolo": "tiratore",
   "sopra_it": "Ho già visto come finisce",
   "sopra_en": "I have already seen how it ends",
   "lore_it": "Legge le carte nella tenda in fondo al casinò e non sbaglia mai una previsione: le previsioni le rende vere lei.",
   "lore_en": "She reads cards in the tent at the back of the casino and never gets a prophecy wrong: she makes them come true."
  },
  "dama": {
   "nome": "DAMA DI FIORI",
   "nome_en": "QUEEN OF CLUBS",
   "motto_it": "Ogni seme ha le sue spine.",
   "motto_en": "Every seed has its thorns.",
   "col": "#3fbf4f",
   "col2": "#ffd23b",
   "ruolo": "lanciatore",
   "sopra_it": "Ogni seme ha le sue spine",
   "sopra_en": "Every seed has its thorns",
   "lore_it": "Cura il giardino segreto dietro al casinò: chi ci entra senza invito resta impigliato nei rovi.",
   "lore_en": "She tends the secret garden behind the casino: whoever walks in uninvited gets caught in the brambles."
  },
  "asso": {
   "nome": "ASSO DI PICCHE",
   "nome_en": "ACE OF SPADES",
   "motto_it": "Un colpo. Quello giusto.",
   "motto_en": "One strike. The right one.",
   "col": "#cfd6e6",
   "col2": "#2a2440",
   "ruolo": "assassino",
   "sopra_it": "Un colpo. Quello giusto",
   "sopra_en": "One strike. The right one",
   "lore_it": "Il duellista del tavolo alto: non bluffa mai, aspetta solo la carta giusta. Quando la cala, la partita è finita.",
   "lore_en": "The duelist of the high table: he never bluffs, he just waits for the right card. When he plays it, the game is over."
  },
  "regina": {
   "nome": "REGINA DI CUORI",
   "nome_en": "QUEEN OF HEARTS",
   "motto_it": "Il mio cuore è per la squadra.",
   "motto_en": "My heart belongs to the team.",
   "col": "#ff4d7a",
   "col2": "#ffd23b",
   "ruolo": "supporto",
   "sopra_it": "Il mio cuore è per la squadra",
   "sopra_en": "My heart belongs to the team",
   "lore_it": "Regna sulla sala dei cuori: ai suoi cura le ferite, agli altri spezza il cuore.",
   "lore_en": "She rules the hall of hearts: she mends her own side's wounds and breaks everyone else's heart."
  },
  "fante": {
   "nome": "FANTE DI QUADRI",
   "nome_en": "JACK OF DIAMONDS",
   "motto_it": "Oggi fante, domani cavaliere.",
   "motto_en": "A jack today, a knight tomorrow.",
   "col": "#ff3348",
   "col2": "#ffd23b",
   "ruolo": "assassino",
   "sopra_it": "Oggi fante, domani cavaliere",
   "sopra_en": "A jack today, a knight tomorrow",
   "lore_it": "Il paggio più svelto del casinò: colpo dopo colpo si guadagna la corazza e diventa il Cavaliere di Quadri.",
   "lore_en": "The quickest page in the casino: hit after hit he earns his armor and becomes the Knight of Diamonds."
  }
 }
};
})(window);
