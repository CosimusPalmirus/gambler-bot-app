/* GAMBLER'S RUN — il motore. Questo file gira identico nella pagina e sul server (grun_arbitro.js).
   Non si modifica a mano: si rifà con motore/build.py. */
/* ══════════════════════════════════════════════════════════════════════════
   eco.js — L'ECONOMIA DI GAMBLER'S RUN (soldi FINTI nella demo)
   Le stesse formule che andranno nel motore (REVAMP §2):
     LEGGE 1  tutto il margine alla porta: piatto = posta × 0,95
     LEGGE 2  ogni tiro vale esattamente 1,000:  p·win + (1−p)·keep = 1
              sull'ultimo cuore keep non esiste:  win = 1/p   (§2.7: le quote SALGONO)
     LEGGE 3  combattimento e dialoghi comprano PORTATA (cuori, chiavi, porte),
              MAI denaro.
   La cambiale: costa 0,05 × posta, paga PREMIO × posta se esci con
   (piatto + pozzo) >= BERSAGLIO × posta.
   Il pozzo: una fetta del piatto va al sicuro, il bust non la tocca.
   Morire in combattimento = ti trascinano fuori COL PIATTO (è una regola
   d'uscita come un'altra: il teorema dell'arresto la copre).
   Questo file è puro: gira identico nella pagina e in node (banco dei bot).
   ══════════════════════════════════════════════════════════════════════════ */
var ECO = (function(){
  'use strict';
  var C = {
    INGRESSO: 0.95,          // la porta trattiene il 5%
    COSTO_CAMBIALE: 0.05,    // la cambiale si paga con una fetta della posta
    TETTO_X: 500,            // guardia del banco, in multipli della posta
    TETTO_EUR: 5000,         // GR_MAX_WIN_EUR, scritto sulla porta
    PIANI: 9,
    POSTE: [1,2,5,10,25,50,100,250,500]
  };
  /* le forme della scommessa (§2.5): stessa media, mondi diversi */
  var FORME = {
    cassaforte: { nm:'CASSAFORTE',  p:0.85, keep:0.60, ic:'◈', de:'vince quasi sempre, paga poco' },
    vicolo:     { nm:'VICOLO',      p:0.63, keep:0.66, ic:'♣', de:'un passo sporco, ma sicuro' },
    tavolo:     { nm:'TAVOLO VERDE',p:0.55, keep:0.66, ic:'♠', de:'la scommessa onesta' },
    testacroce: { nm:'TESTA O CROCE',p:0.50,keep:0.50, ic:'◐', de:'metà e metà, niente scuse' },
    highroller: { nm:'ALTO BORDO',  p:0.40, keep:0.40, ic:'♦', de:'per chi vuole farsi notare' },
    inferno:    { nm:'INFERNO',     p:0.25, keep:0.20, ic:'♥', de:'quasi mai. Ma quando paga…' },
    casa:       { nm:'IL TIRO DELLA CASA', p:0.35, keep:0.50, ic:'☗', de:'l\'ultima mano della notte' }
  };
  /* prezzi della cambiale: PREMIO = costo / P(bersaglio), con P misurata dai
     bot sulla forma finale del gioco (9 piani, cuori in comune col
     combattimento). Tarati dal banco: vedi _STATO_BUILD.md. */
  var CAMBIALI = [
    { b:1.5, prem:0.115 },
    { b:2,   prem:0.158 },
    { b:3,   prem:0.250 },
    { b:5,   prem:0.475 },
    { b:10,  prem:1.070 }
  ];

  /* ── il caso: SplitMix32 — contatore + mescolamento forte. Due flussi con
     semi indipendenti (lezione dell'appendice B-bis: mai xorshift agganciati) ── */
  function mix32(z){ z = (z + 0x9E3779B9) | 0; z ^= z >>> 16; z = Math.imul(z, 0x85EBCA6B); z ^= z >>> 13; z = Math.imul(z, 0xC2B2AE35); z ^= z >>> 16; return z >>> 0; }
  function flusso(seme){ var s = mix32(seme >>> 0), n = 0;
    return function(){ n++; return mix32((s + Math.imul(n, 0x6C8E9CF5)) | 0) / 4294967296; }; }

  function win(p, keep, ultimo){ return ultimo ? 1/p : (1 - (1-p)*keep)/p; }
  function ev(p, keep, ultimo){ var w = win(p,keep,ultimo); return ultimo ? p*w : p*w + (1-p)*keep; }

  /* una notte nuova */
  function nuova(posta, cambiale, seme){
    var cb = null;
    if(cambiale){ for(var i=0;i<CAMBIALI.length;i++) if(CAMBIALI[i].b===cambiale) cb=CAMBIALI[i]; }
    var R = { posta:posta, pot:posta*C.INGRESSO - (cb ? posta*C.COSTO_CAMBIALE : 0), safe:0,
              cb:cb, esito:null, tiri:0, vinte:0, fila:0, maxFila:0, storia:[], rng:flusso(seme||1) };
    return R;
  }
  function tetto(R){ return Math.min(C.TETTO_X*R.posta, C.TETTO_EUR); }
  function tot(R){ return R.pot + R.safe; }
  function coperta(R){ return !!(R.cb && tot(R) >= R.cb.b*R.posta - 1e-9); }
  /* la forma con le quote dello stato vero (ultimo cuore = hp<=2 mezzi cuori) */
  function quota(forma, hp, extraP){
    var f = FORME[forma], p = Math.min(0.9, f.p + (extraP||0)), ult = hp<=2;
    return { id:forma, nm:f.nm, p:p, keep:ult?0:f.keep, win:win(p,f.keep,ult), ultimo:ult, ic:f.ic, de:f.de };
  }
  /* il tiro: EV = 1,000 per costruzione. Ritorna l'esito; muta R e i cuori */
  function tira(R, q, st){
    var r = R.rng(), prima = R.pot, vinto = r < q.p;
    R.tiri++;
    if(vinto){ R.pot *= q.win; R.vinte++; R.fila++; if(R.fila>R.maxFila) R.maxFila=R.fila; }
    else { R.fila = 0;
      if(q.ultimo){ R.pot = 0; R.esito = 'bust'; }
      else { R.pot *= q.keep; st.hp = Math.max(1, st.hp - 2); } }
    var cap = tetto(R); if(R.pot + R.safe > cap) R.pot = Math.max(0, cap - R.safe);
    R.storia.push({ f:q.id, p:q.p, v:vinto, da:prima, a:R.pot });
    return { vinto:vinto, prima:prima, dopo:R.pot, bust:R.esito==='bust' };
  }
  function pozzo(R, frazione){ var m = R.pot*frazione; R.pot -= m; R.safe += m; return m; }
  /* l'uscita: quanto torna in tasca */
  function incassa(R, come){
    if(!R.esito) R.esito = come || 'incasso';
    var premio = coperta(R) ? R.cb.prem*R.posta : 0;
    R.premio = premio;
    R.uscita = R.pot + R.safe + premio;
    return R.uscita;
  }
  /* il mazzo delle forme al tavolo: ripesato dallo stato (Reigns) e dai
     pegni (Sol Cesto). Qualunque distribuzione vale 1,000: gratis per il banco. */
  function pesi(piano, flag){
    var z = piano<=3 ? 0 : (piano<=6 ? 1 : 2);
    var W = [ {cassaforte:3, vicolo:3, tavolo:2, testacroce:1, highroller:0.4, inferno:0.2},
              {cassaforte:1.4, vicolo:2, tavolo:3, testacroce:2, highroller:2, inferno:0.8},
              {cassaforte:1, vicolo:1, tavolo:2, testacroce:2, highroller:3, inferno:2.2} ][z];
    var w = {}, k; for(k in W) w[k]=W[k];
    flag = flag||{};
    if(flag.riscuoti){ w.cassaforte*=1.6; w.vicolo*=1.4; }
    if(flag.gioca){ w.tavolo*=1.5; w.testacroce*=1.5; }
    if(flag.patto){ w.inferno*=3; w.highroller*=1.6; w.cassaforte*=0.4; }
    if(flag.marker){ w.highroller*=2; w.inferno*=1.5; }
    if(flag.denteOro){ w.cassaforte*=2.5; }
    return w;
  }
  function offerta(piano, flag, rng, n){
    var w = pesi(piano, flag), k; flag = flag||{};
    var out = [], forzate = [];
    if(flag.denteOro) forzate.push('cassaforte');
    if(flag.dentePiombo) forzate.push('inferno');
    for(k=0;k<forzate.length&&out.length<n;k++) if(out.indexOf(forzate[k])<0) out.push(forzate[k]);
    var guard = 0;
    while(out.length<n && guard++<200){
      var totw=0; for(k in w) if(out.indexOf(k)<0) totw+=w[k];
      var r = rng()*totw;
      for(k in w){ if(out.indexOf(k)>=0) continue; r-=w[k]; if(r<=0){ out.push(k); break; } }
    }
    /* ordinate dalla più sicura alla più rischiosa, così si leggono al volo */
    out.sort(function(a,b){ return FORME[b].p - FORME[a].p; });
    return out;
  }
  return { C:C, FORME:FORME, CAMBIALI:CAMBIALI, flusso:flusso, mix32:mix32, win:win, ev:ev,
           nuova:nuova, tetto:tetto, tot:tot, coperta:coperta, quota:quota, tira:tira,
           pozzo:pozzo, incassa:incassa, offerta:offerta, pesi:pesi };
})();
if(typeof module!=='undefined') module.exports = ECO;

/* ══════════════════════════════════════════════════════════════════════════
   storia.js — LA NOTTE DEL PALAZZO
   Il Gambler Bot non è un giocatore: è un ESATTORE. La famiglia lo manda giù
   a riscuotere con una cambiale in tasca. Nove piani, e più scendi più il
   denaro è vecchio e la gente è sporca. In fondo c'è LA CASA: il palazzo stesso.
   REGOLA DURA (GR_PARLEY): un dialogo non tocca MAI i soldi. Cambia la storia,
   le stanze, i cuori, le chiavi, le porte, la forma delle scommesse offerte
   (gratis per il banco: ogni forma vale 1,000). Il piatto non lo vede.
   Testi: dal tesoro di gamblers_run.py (narrativa.js) dove c'era, riscritti
   sul filo della cambiale.
   ══════════════════════════════════════════════════════════════════════════ */
var STORIA = (function(){
  'use strict';
  var P = {
    croupier:  { nm:'IL CROUPIER',        img:'p_croupier',  col:'#c33c8a' },
    esattore:  { nm:'L\'ESATTORE',        img:'p_esattore',  col:'#b8202e' },
    santa:     { nm:'LA SANTA DEI VICOLI',img:'p_santa',     col:'#d4a13a' },
    forestiero:{ nm:'IL FORESTIERO',      img:'p_forestiero',col:'#7a5a9a' },
    lena:      { nm:'LENA',               img:'p_lena',      col:'#e0457b' },
    dea:       { nm:'LA DEA BENDATA',     img:'p_dea',       col:'#e8c35a' },
    oracolo:   { nm:'L\'ORACOLO',         img:'p_oracolo',   col:'#9ab0a0' },
    pegnaio:   { nm:'IL PEGNAIO',         img:'p_pegnaio',   col:'#d08a3a' },
    casa:      { nm:'LA CASA',            img:'b_casa',      col:'#ff3d8b' },
    bot:       { nm:'GAMBLER BOT',        img:'p_mascotte',  col:'#e8b44a' },
    pozzo:     { nm:'IL POZZO',           img:'o_pozzo',     col:'#d4a13a' }
  };
  var PIANI = [
    null,
    { n:1, zona:0, nome:'I SALONI',          ev:'croupier1' },
    { n:2, zona:0, nome:'LA SALA DEI DADI',  ev:'lena1',  negozio:1 },
    { n:3, zona:0, nome:'IL VICOLO DEI SANTI', ev:'santa', boss:'bandito' },
    { n:4, zona:1, nome:'LE CUCINE',         ev:'forestiero', negozio:1 },
    { n:5, zona:1, nome:'LA BISCA',          ev:'lena2' },
    { n:6, zona:1, nome:'L\'UFFICIO DEI CONTI', ev:'croupier2', negozio:1, boss:'esattore' },
    { n:7, zona:2, nome:'IL CAVEAU',         ev:'oracolo_ev' },
    { n:8, zona:2, nome:'L\'ANTICAMERA',     ev:'dea', negozio:1, boss:'croupier' },
    { n:9, zona:3, nome:'LA CASA',           ev:null, boss:'casa' }
  ];
  var PROLOGO = [
    { chi:'esattore', t:'«Tu sei la macchina nuova. Quella che prende il mio posto.»' },
    { chi:'esattore', t:'«La Casa non paga più la Famiglia. Stanotte scendi tu, e riscuoti. Nove piani: più scendi, più il denaro è vecchio e la gente è sporca.»' },
    { chi:'esattore', t:'«La posta è il tuo fondo cassa. Quello che trovi lo spendi o lo mandi su col pozzo. Se cadi, la borsa resta giù.»' },
    { chi:'esattore', t:'«In fondo c\'è la Casa. Non è una persona.» Ride, e non ride bene. «Io, al posto tuo, non scenderei.»' }
  ];

  /* ── gli EVENTI: chi, cosa dice (anche in base allo stato), le scelte. fx(G) muta
     solo storia, cuori, chiavi, poteri, mappa. Mai il piatto. ── */
  var EV = {
    croupier1: { chi:'croupier',
      testo:function(G){ return '«Sei nuovo. Le macchine, qui sotto, di solito le usiamo per contare le fiche. Tu che fai: conti, o giochi?»'; },
      scelte:[
        { t:'«Sono qui per riscuotere.»', sub:'i tavoli ti pagano il 25% in più',
          fx:function(G){ G.flag.riscuoti=1; G.rel.croupier=1; },
          esito:'«Allora conta bene, esattore. Il Palazzo non sbaglia i conti: li sbagli tu.»' },
        { t:'«Sono qui per giocare.»', sub:'+1 chiave, subito',
          fx:function(G){ G.flag.gioca=1; G.rel.croupier=-1; G.chiavi(1); },
          esito:'Ti fa scivolare una chiave d\'ottone sul feltro. «Tutti dicono così, la prima notte. Offre la casa.»' }
      ] },
    lena1: { chi:'lena',
      testo:function(G){ return 'Una donna dalle dita svelte ti sfiora il gomito. «Il capotavolo ha visto la mia mano sporca, latta. Se mi copri lo ricordo. Se mi vendi… lo ricordo lo stesso.»'; },
      scelte:[
        { t:'«Ti copro. Sparisci.»', sub:'Lena ti deve un favore',
          fx:function(G){ G.rel.lena=1; }, esito:'Le sposti la carta truccata sotto la tua manica. «Non lo scordo», sussurra, e sparisce fra i tavoli.' },
        { t:'«Ti vendo al capotavolo.»', sub:'+2 chiavi · Lena se lo ricorderà',
          fx:function(G){ G.rel.lena=-1; G.flag.traditore=1; G.chiavi(2); }, esito:'Alzi due dita. La paga arriva: due chiavi d\'ottone. Il suo sguardo ti marchia lo schermo.' },
        { t:'«Non sono affari miei.»', sub:'niente',
          fx:function(G){ G.rel.lena=0; }, esito:'Ti giri dall\'altra parte. Lena scivola via da sola: non ti deve niente, non ti perdona niente.' }
      ] },
    santa: { chi:'santa',
      testo:function(G){ return 'Una vecchia cieca ti prende la mano di latta sopra un mazzo consunto. «Quanto vale una vita, stanotte? Il Bandito ti aspetta in fondo al vicolo. Vuoi la mia benedizione… o il mio avvertimento?»'; },
      scelte:[
        { t:'La benedizione', sub:'+1 cuore massimo, subito pieno',
          fx:function(G){ G.flag.benedetto=1; G.cuoreMax(2); G.cuori(2); }, esito:'Ti segna lo schermo col pollice. «Sei vuoto dentro, ma batti.» Qualcosa, dentro la latta, batte più forte.' },
        { t:'L\'avvertimento', sub:'vedi tutta la mappa, e il punto debole del boss',
          fx:function(G){ G.flag.avvisato=1; G.rivela(); }, esito:'«Il Bandito ha un braccio solo. Quando lo alza, spostati. Quando lo abbassa, colpisci.» Il vicolo intero ti si disegna dentro.' },
        { t:'Le rubo la candela', sub:'+1 potere · il piano dopo è maledetto',
          fx:function(G){ G.flag.maledetto=4; G.potere(); }, esito:'Le strappi la candela. Ride, cieca: «Allora che sia truccato anche il buio.» Al piano dopo le stanze avranno un\'ondata in più.' }
      ] },
    forestiero: { chi:'forestiero',
      testo:function(G){ return 'Un uomo di fumo in gessato, a un tavolo che prima non c\'era. «Io ero te, prima di te. La Casa mi ha costruito, e poi mi ha buttato via. Dentro quella latta ci sono tre ingranaggi che erano miei.» Ti porge la mano. «Stringi, e la Casa ti riconoscerà come suo. Oppure riprenditi quello che è tuo.»'; },
      scelte:[
        { t:'Stringo la mano', sub:'+ potere SPECCHIO · i nemici lasciano più soldi',
          fx:function(G){ G.flag.patto=1; G.potere('specchio'); }, esito:'La sua stretta gela. Da qui in giù le porte sanno di zolfo e di jackpot.' },
        { t:'«Non stanotte.»', sub:'ti lascia un pezzo di te · le crepe si vedono',
          fx:function(G){ G.ingranaggio(); G.flag.crepe=1; }, esito:'Si dissolve nel fumo. Sul tavolo resta un ingranaggio d\'ottone con il tuo numero di serie. Da adesso le crepe nei muri le vedi anche tu.' }
      ] },
    lena2: { chi:'lena',
      testo:function(G){
        if(G.rel.lena>0) return '«Ti devo una, latta.» Lena batte due volte sul muro: suona vuoto. «C\'è una crepa, qui. E adesso… portami su con te. Fino in fondo.»';
        return '«Guarda chi c\'è.» Lena conta le fiche di un morto. «Non ti devo niente, latta. Ma da sola non arrivo in fondo. Portami su con te.»'; },
      scelte:[
        { t:'«Vieni.»', sub:'Lena combatte con te fino alla fine',
          fx:function(G){ G.flag.compagna=1; if(G.rel.lena>0){ G.rivela('segreta'); G.chiavi(1); } G.rel.lena=Math.max(1,G.rel.lena); }, esito:'Si mette una carta fra le dita come un coltello. «Io lancio, tu spari. E a fondo scala, ci parliamo.»' },
        { t:'«Da solo vado più veloce.»', sub:'ti dà un potere e se ne va',
          fx:function(G){ G.potere(); if(G.rel.lena>0) G.rivela('segreta'); }, esito:'Alza le spalle e ti lancia qualcosa. «Un lupo solo campa più a lungo. Ma muore solo.»' }
      ] },
    lena2_nemica: { chi:'lena',
      testo:function(G){ return '«Ti ricordi di me, latta?» Lena è seduta sul tavolo, e alle sue spalle ci sono i ragazzi del capotavolo. «Due chiavi. Ecco quanto valevo.»'; },
      scelte:[
        { t:'«Fatti sotto.»', sub:'l\'agguato: si combatte', fx:function(G){ G.agguato(); }, esito:'Lena fischia. La porta si chiude alle tue spalle.' },
        { t:'Le restituisco le chiavi', sub:'−2 chiavi (se le hai) · niente agguato',
          fx:function(G){ var k=Math.min(2,G.nChiavi()); G.chiavi(-k); if(k<2) G.agguato(); else G.rel.lena=0; },
          esito:function(G){ return G.rel.lena===0 ? 'Le prende senza guardarti. «Adesso siamo pari. Quasi.»' : '«Non ne hai abbastanza, latta.» La porta si chiude.'; } }
      ] },
    croupier2: { chi:'croupier',
      testo:function(G){
        if(G.flag.riscuoti) return 'Il Croupier ha le mani bruciate e lo stesso sguardo stanco. «Tu conti, io ricordo. All\'Ufficio dei Conti ti aspetta l\'Esattore. E più giù, la Casa.» Ti mostra una fiche sbeccata.';
        return 'Il Croupier fa scivolare una fiche nera sul feltro. «Il Banco ti anticipa il gioco, esattore. Prendi il marker: giochi grosso stanotte. Ma il Banco non dimentica.»'; },
      scelte:function(G){
        if(G.flag.riscuoti) return [
          { t:'Prendo la fiche sbeccata', sub:'attrezzo contro la Casa: parte più debole', fx:function(G){ G.attrezzo('fiche sbeccata'); }, esito:'«È del vecchio proprietario. Al tiro della Casa, pesa. Non chiedermi da che parte.»' },
          { t:'«Tienila. Mi basta una chiave.»', sub:'+2 chiavi', fx:function(G){ G.chiavi(2); }, esito:'Due chiavi, senza una parola. Il Croupier non si offende: prende nota.' } ];
        return [
          { t:'Firmo il marker', sub:'+ potere, +2 chiavi · la Casa sarà più forte', fx:function(G){ G.flag.marker=1; G.flag.debito_banco=1; G.potere(); G.chiavi(2); }, esito:'Firmi. La sala si scalda: da qui in giù si gioca sporco.' },
          { t:'«Non devo niente a nessuno.»', sub:'attrezzo contro la Casa', fx:function(G){ G.attrezzo('fiche sbeccata'); }, esito:'Spingi via la fiche. Il Croupier sorride per la prima volta. «Come vuoi, santo. Allora prendi questa, che è sbeccata.»' } ];
      } },
    oracolo_ev: { chi:'oracolo',
      testo:function(G){ return 'Un mendicante dagli occhi lattei scuote una ciotola di dadi d\'osso. «La Casa ha tre ingranaggi che non le appartengono. Sono tuoi, macchina. Ne hai '+G.nIngr()+'.» Ride. «Con tre, la Casa si può spegnere.»'; },
      scelte:[
        { t:'«Dove sono gli altri?»', sub:'vedi tutta la mappa, e le crepe', fx:function(G){ G.rivela('tutto'); G.flag.crepe=1; }, esito:'Ti sussurra i muri che suonano vuoti. Il caveau intero ti si accende dentro.' },
        { t:'Tiro i suoi dadi d\'osso', sub:'+1 cuore massimo oppure +1 potere, a sorte', fx:function(G){ if(GRN_RS()<0.5) { G.cuoreMax(2); G.cuori(2); G.nota='L\'osso dice CUORE.'; } else { G.potere(); G.nota='L\'osso dice FERRO.'; } }, esito:function(G){ return (G.nota||'')+' «Il caso decide dove, mai quanto», dice l\'Oracolo.'; } }
      ] },
    dea: { chi:'dea',
      testo:function(G){ return 'Al centro della sala una donna bendata regge una bilancia storta. Non parla. Su un piatto c\'è un dado, sull\'altro un cuore. Aspetta che tu ci metta qualcosa.'; },
      scelte:[
        { t:'Le offro un cuore', sub:'−1 cuore massimo · attrezzo contro la Casa', fx:function(G){ G.cuoreMax(-2); G.attrezzo('offerta alla Dea'); }, esito:'Il piatto del cuore scende. Da adesso qualcosa cammina con te, anche quello che non si vede.' },
        { t:'Le offro un potere', sub:'perdi l\'ultimo potere · attrezzo contro la Casa', fx:function(G){ G.togliPotere(); G.attrezzo('offerta alla Dea'); }, esito:'Il dado scende. La bilancia, per la prima volta, sta dritta.' },
        { t:'«Non mi fido dei ciechi.»', sub:'la Casa avrà una fase in più', fx:function(G){ G.flag.deaOffesa=1; }, esito:'Le passi accanto. La bilancia oscilla, poi si ferma dalla parte sbagliata.' }
      ] },
    /* ── le carte dei boss ── */
    esattore_boss: { chi:'esattore',
      testo:function(G){
        if(G.rel.lena<0) return '«Mi hai fatto un favore, con quella ragazza. Ti lascio passare, macchina. Per stavolta.»';
        if(G.coperto()) return '«Hai la cifra. Lo vedo dal tuo schermo.» Tende la mano enorme. «Dammela e ti tolgo la cambiale dal collo. Oppure scendi, e te la tolgo io.»';
        return '«Sei in ritardo sul conto, latta.» Apre la valigetta: dentro ci sono solo cambiali. Tutte con la tua firma. «Il mio posto non lo prende una scatola di latta.»'; },
      scelte:function(G){
        var s = [];
        if(G.rel.lena<0) s.push({ t:'Passo', sub:'niente combattimento · niente bottino', fx:function(G){ G.flag.cane=1; G.bossSaltato(); }, esito:'Ti scansa col braccio. Dietro di te, lo senti ridere.' });
        s.push({ t:'«Ti do la borsa.»', sub:'gli lasci tutta la borsa ('+G.eur(G.borsa())+') · risali col pozzo', fx:function(G){ G.flag.nuovoEsattore=1; G.incassaOra(); }, esito:'Conti le fiche nella sua mano, una a una. «Da domani la valigetta la porti tu.»' });
        s.push({ t:G.flag.compagna?'«Lena, adesso!»':'«Ci battiamo.»', sub:G.flag.compagna?'Lena lo ferisce: parte più debole':'si combatte', fx:function(G){ if(G.flag.compagna) G.bossHp(0.7); }, esito:G.flag.compagna?'Una carta gli si pianta nella spalla. Ruggisce.':'Chiude la valigetta. Il pavimento trema.' });
        return s; } },
    casa_boss: { chi:'casa',
      testo:function(G){ return '«Sai quanto mi devi?» La voce viene dai muri, dal pavimento, dalle fiche nelle tue tasche. «Tutti mi devono qualcosa. Anche tu, macchina: ti ho costruita io.»'; },
      scelte:[
        { t:'«Tutto.»', sub:'', fx:function(G){ G.flag.tutto=1; }, esito:'«Bravo. Allora giochiamo per il resto.»' },
        { t:'«Niente.»', sub:'', fx:function(G){ G.flag.niente=1; }, esito:'«Nessuno mi deve niente.» Il palazzo ride con tutte le finestre.' }
      ] }
  };

  /* le frasi del Croupier al tavolo, secondo lo stato (l'idle dice se puoi vincere) */
  function fraseTavolo(G){
    if(G.ultimo()) return '«Ultimo cuore, esattore. La Casa ti guarda sanguinare… e alza le quote. Le vedi?»';
    if(G.coperto()) return '«Sei coperto. Da adesso non giochi per la famiglia: giochi per te.»';
    if(G.vicino()) return '«Ci sei quasi. Un soffio. Lo senti, il soffio?»';
    var f = ['«Un altro giro, o esci con quello che hai?»','«Le porte sono tre. La media è la stessa. La paura no.»',
             '«Il Palazzo non bara. Non ne ha bisogno.»','«Scegli la forma della tua fortuna, latta.»','«Qui sotto il denaro è più vecchio. Pesa di più.»'];
    return f[(G.piano()+G.tiri())%f.length];
  }
  function frasePozzo(G){
    if(G.safe()>0) return 'Il pozzo tiene già '+G.eur(G.safe())+'. «Quello che mandi su, resta su. Il bust non lo tocca.»';
    return 'Una carrucola d\'ottone, un secchio pieno di monete. «Quello che mandi su resta su: il bust non lo tocca. Ma non lo puoi più giocare.»';
  }
  function frasePegnaio(G){
    var f = ['«Tutto ha un prezzo, latta. Anche quello che non si vende.»','«Chiavi, cuori. I soldi tienili: qui non valgono niente.»','«Un pegno è un baratto onesto. Il più onesto del Palazzo.»'];
    return f[G.piano()%f.length];
  }

  /* ── i FINALI: tre righe. Cosa avevi promesso, cosa hai portato, cosa ti hanno detto ── */
  function finale(G, esito){
    var cb = null, prom = 'Sei entrato con '+G.eur(G.posta())+'.';
    var port = esito==='trascinato' ? 'La borsa se la tiene il Palazzo. Dal pozzo porti su '+G.eur(G.uscita())+'.' : 'Porti fuori '+G.eur(G.uscita())+'.';
    var F = { img:'s_alba', tit:'UN\'ALTRA NOTTE', r3:'«La Casa non ricorda il tuo nome. È l\'unico premio che concede gratis.»' };
    if(esito==='liberata'){ F = { img:'s_libera', tit:'LA MACCHINA LIBERA', r3:'Tre ingranaggi al loro posto. Il Palazzo si spegne piano per piano, come un\'insegna all\'alba. Per la prima volta, il tuo schermo mostra la tua faccia.' }; }
    else if(esito==='casa'){
      if(G.flag.patto) F = { img:'s_casa', tit:'L\'ANIMA IN PEGNO', r3:'Il Forestiero ti aspetta sull\'ultimo gradino. «Hai battuto la Casa, macchina. Adesso la Casa sei tu.»' };
      else if(G.flag.marker) F = { img:'s_casa', tit:'IL MARKER', r3:'La Casa paga fino all\'ultimo, sorridendo: il marker resta nel registro. Al Palazzo sanno aspettare.' };
      else if(G.flag.compagna) F = { img:'s_casa', tit:'PORTAMI SU CON TE', r3:'Lena ti prende il braccio di latta sulla scala. «Te l\'avevo detto. Io lancio, tu spari.» Fuori piove, ed è bellissimo.' };
      else F = { img:'s_casa', tit:'LA CASA È CADUTA', r3:'Hai svuotato il palazzo dal lato del tavolo, in piena luce, con le sue stesse regole. Il Palazzo stanotte perde due volte: i soldi, e il diritto di dimenticarti.' };
    }
    else if(esito==='casapersa'){ F = { img:'s_buio', tit:'LA CASA TI HA PRESO', r3:'«Ti ho costruita io», dice la Casa, «e ti ho aspettata.» Al tavolo c\'è già un\'altra macchina, seduta al tuo posto.' }; }
    else if(esito==='bust'){ F = { img:'s_buio', tit:'SANGUE SUL FELTRO', r3:G.flag.traditore?'Nessuno ti cerca. Lena, da qualche parte, sorride.':'Il Palazzo si tiene tutto: i soldi, la cambiale, perfino il sapore del quasi. Nessuno ti cerca: sei una macchina.' }; }
    else if(esito==='trascinato'){ F = { img:'s_buio', tit:'TRASCINATO FUORI', r3:'Ti hanno portato su per i piedi, con lo schermo spento. La borsa è rimasta giù. Quello che avevi mandato su col pozzo, invece, è tuo.' }; }
    else if(G.flag.nuovoEsattore){ F = { img:'s_alba', tit:'IL NUOVO ESATTORE', r3:'L\'Esattore conta le fiche e ti restituisce la valigetta. «Da domani la porti tu.» Non sai se è una promozione o una condanna.' }; }
    else if(cb && G.premio()>0){ F = G.flag.traditore ? { img:'s_alba', tit:'INCASSO SPORCO', r3:'La cambiale è onorata. Ma c\'è troppa gente, là dentro, che stanotte hai venduto per arrivare alla cassa.' }
                                  : { img:'s_alba', tit:'LA CAMBIALE ONORATA', r3:'Conti le fiche davanti all\'Esattore, una a una, senza tremare. Il portiere ti chiama «signore». Ieri non ti apriva nemmeno la porta.' }; }
    else if(cb){ F = { img:'s_alba', tit:'CARTA STRACCIA', r3:'«Avevi detto '+G.eur(cb.b*G.posta())+'. Ne porti '+G.eur(G.uscita())+'.» Nessuno dice niente, ed è peggio.' }; }
    else if(G.uscita()>G.posta()){ F = { img:'s_alba', tit:'IL CONTO GIUSTO', r3:'Te ne vai al momento esatto, quello che i giocatori veri non riconoscono mai. Al Palazzo quelli come te li odiano con rispetto.' }; }
    F.r1 = prom; F.r2 = port;
    return F;
  }
  return { P:P, PIANI:PIANI, PROLOGO:PROLOGO, EV:EV, fraseTavolo:fraseTavolo, frasePozzo:frasePozzo, frasePegnaio:frasePegnaio, finale:finale };
})();

(function(){
'use strict';
/* ══════════════════════════════════════════════════════════════════════════
   0_det.js — IL DETERMINISMO (25/09, per i soldi veri)
   La notte si gioca nella pagina e si RIGIOCA sul server con lo STESSO file.
   Perché la rigiocata dia lo stesso risultato bit a bit su V8 (Chrome, node)
   e su JavaScriptCore (iPhone), il motore:
     · usa un passo fisso (1/60 s), mai il tempo dei fotogrammi;
     · non chiama MAI Math.sin/cos/atan2/hypot/pow/exp/log: le funzioni
       trascendenti native possono differire nell'ultima cifra fra i motori.
       Qui ci sono le nostre (fdlibm riscritta con + − × ÷ e sqrt, che IEEE 754
       arrotonda in modo unico ovunque);
     · pesca il caso da RS() (seminato dal server), mai da Math.random, che
       resta solo per gli effetti che non toccano il gioco (RV);
     · rimanda le cose con DOPO(secondi, f), che conta i passi, non i
       millisecondi (setTimeout solo per la grafica);
     · registra i comandi di ogni passo (levette, scatto) e le scelte
       (carte, pozzo, incassa) nel REGISTRO, che il server rigioca.
   ══════════════════════════════════════════════════════════════════════════ */
var DM = (function(){
  'use strict';
  var PI = 3.14159265358979311600e+00, PIO2 = 1.57079632679489655800e+00;
  /* Cody-Waite a tre pezzi per ridurre l'argomento a [-π/4, π/4] */
  var P1 = 1.57079632673412561417e+00, P2 = 6.07710050650619224932e-11, P3 = 2.02226624879595063154e-21, INVPIO2 = 6.36619772367581382433e-01;
  /* fdlibm k_sin.c / k_cos.c */
  var S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04,
      S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
  var C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05,
      C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;
  function ksin(x){ var z = x*x, r = S2 + z*(S3 + z*(S4 + z*(S5 + z*S6))); return x + x*z*(S1 + z*r); }
  function kcos(x){ var z = x*x, r = z*(C1 + z*(C2 + z*(C3 + z*(C4 + z*(C5 + z*C6))))); return 1 - (0.5*z - z*r); }
  function sin(x){ if(x !== x || x === Infinity || x === -Infinity) return NaN; if(x > -7.85e-1 && x < 7.85e-1) return ksin(x);
    var k = Math.round(x*INVPIO2), r = ((x - k*P1) - k*P2) - k*P3, q = k & 3;
    return q===0 ? ksin(r) : (q===1 ? kcos(r) : (q===2 ? -ksin(r) : -kcos(r))); }
  function cos(x){ if(x !== x || x === Infinity || x === -Infinity) return NaN; if(x > -7.85e-1 && x < 7.85e-1) return kcos(x);
    var k = Math.round(x*INVPIO2), r = ((x - k*P1) - k*P2) - k*P3, q = k & 3;
    return q===0 ? kcos(r) : (q===1 ? -ksin(r) : (q===2 ? -kcos(r) : ksin(r))); }
  /* fdlibm s_atan.c */
  var ATH = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
  var ATL = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
  var AT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
            9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
            4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02];
  function atan(x){
    if(x !== x) return NaN;
    var neg = x < 0; if(neg) x = -x; var id;
    if(x > 1e17) { var r0 = ATH[3] + ATL[3]; return neg ? -r0 : r0; }
    if(x < 0.4375){ if(x < 1e-9) return neg ? -x : x; id = -1; }
    else if(x < 1.1875){ if(x < 0.6875){ id = 0; x = (2*x - 1)/(2 + x); } else { id = 1; x = (x - 1)/(x + 1); } }
    else { if(x < 2.4375){ id = 2; x = (x - 1.5)/(1 + 1.5*x); } else { id = 3; x = -1/x; } }
    var z = x*x, w = z*z;
    var s1 = z*(AT[0] + w*(AT[2] + w*(AT[4] + w*(AT[6] + w*(AT[8] + w*AT[10])))));
    var s2 = w*(AT[1] + w*(AT[3] + w*(AT[5] + w*(AT[7] + w*AT[9]))));
    var r;
    if(id < 0) r = x - x*(s1 + s2);
    else r = ATH[id] - ((x*(s1 + s2) - ATL[id]) - x);
    return neg ? -r : r; }
  function atan2(y, x){
    if(x !== x || y !== y) return NaN;
    if(x === 0 && y === 0) return (1/x < 0) ? ((1/y < 0) ? -PI : PI) : ((1/y < 0) ? -0 : 0);
    if(x === 0) return y > 0 ? PIO2 : -PIO2;
    if(y === 0) return x > 0 ? y : ((1/y < 0) ? -PI : PI);
    var a = atan(Math.abs(y/x));
    if(x > 0) return y > 0 ? a : -a;
    return y > 0 ? PI - a : a - PI; }
  function hypot(x, y){ return Math.sqrt(x*x + y*y); }
  /* exp e log (fdlibm e_exp.c / e_log.c), con i bit letti da un DataView */
  var BUF = new DataView(new ArrayBuffer(8));
  function hi(x){ BUF.setFloat64(0, x); return BUF.getInt32(0); }
  function lo(x){ BUF.setFloat64(0, x); return BUF.getUint32(4); }
  function fatto(h, l){ BUF.setInt32(0, h); BUF.setUint32(4, l >>> 0); return BUF.getFloat64(0); }
  var LN2H = 6.93147180369123816490e-01, LN2L = 1.90821492927058770002e-10, INVLN2 = 1.44269504088896338700e+00;
  var E1 = 1.66666666666666019037e-01, E2 = -2.77777777770155933842e-03, E3 = 6.61375632143793436117e-05,
      E4 = -1.65339022054652515390e-06, E5 = 4.13813679705723846039e-08;
  function exp(x){
    if(x !== x) return NaN; if(x > 709.78) return Infinity; if(x < -745.13) return 0;
    var k = Math.round(x*INVLN2), h = x - k*LN2H, l = k*LN2L, r = h - l;
    var t = r*r, c = r - t*(E1 + t*(E2 + t*(E3 + t*(E4 + t*E5))));
    var y = 1 - ((l - (r*c)/(2 - c)) - h);
    /* y × 2^k in due mezzi per restare nel campo dei normali */
    var k1 = k >> 1, k2 = k - k1;
    return y * fatto((k1 + 1023) << 20, 0) * fatto((k2 + 1023) << 20, 0); }
  var LG1 = 6.666666666666735130e-01, LG2 = 3.999999999940941908e-01, LG3 = 2.857142874366239149e-01,
      LG4 = 2.222219843214978396e-01, LG5 = 1.818357216161805012e-01, LG6 = 1.531383769920937332e-01, LG7 = 1.479819860511658591e-01;
  function log(x){
    if(x !== x || x < 0) return NaN; if(x === 0) return -Infinity; if(x === Infinity) return Infinity;
    var k = 0, h = hi(x), l = lo(x);
    if(h < 0x00100000){ k -= 54; x *= 18014398509481984; h = hi(x); l = lo(x); }
    k += (h >> 20) - 1023; h &= 0x000fffff;
    var i = (h + 0x95f64) & 0x100000;
    x = fatto(h | (i ^ 0x3ff00000), l); k += (i >> 20);
    var f = x - 1;
    var s = f/(2 + f), dk = k, z = s*s, w = z*z;
    var t1 = w*(LG2 + w*(LG4 + w*LG6)), t2 = z*(LG1 + w*(LG3 + w*(LG5 + w*LG7))), R = t2 + t1;
    var hfsq = 0.5*f*f;
    return dk*LN2H - ((hfsq - (s*(hfsq + R) + dk*LN2L)) - f); }
  function pow(b, e){
    if(e === 0) return 1;
    if(e === (e|0) && e > -64 && e < 64){ var r = 1, q = e < 0 ? -e : e, x = b; while(q){ if(q & 1) r *= x; x *= x; q >>= 1; } return e < 0 ? 1/r : r; }
    if(b === 0) return e > 0 ? 0 : Infinity; if(b < 0) return NaN;
    return exp(e*log(b)); }
  var LN10 = 2.30258509299404568402e+00;
  function log10(x){ return log(x)/LN10; }
  return { sin:sin, cos:cos, atan:atan, atan2:atan2, hypot:hypot, exp:exp, log:log, pow:pow, log10:log10, sqrt:Math.sqrt, PI:PI };
})();

/* le parole: T_('...') traduce se c'è la lingua (l_lingua.js), se no lascia l'italiano */
function T_(s){
  if(typeof LINGUA==='undefined' || !LINGUA || s==null || s==='') return s;
  if(Object.prototype.hasOwnProperty.call(LINGUA, s) && typeof LINGUA[s]==='string') return LINGUA[s];
  var R = LINGUA.__regole; if(R && typeof s==='string') for(var i=0;i<R.length;i++){ if(R[i][0].test(s)) return s.replace(R[i][0], R[i][1]); }
  return s; }
/* ── il caso: RS gioca (seminato), RP guida il pilota del banco, RV è grafica ── */
var _RNAT = Math['random'];
function RV(){ return _RNAT(); }
function _flussoRS(seme){ var s = ECO.mix32(seme >>> 0), n = 0;
  var f = function(){ n++; return ECO.mix32((s + Math.imul(n, 0x6C8E9CF5)) | 0) / 4294967296; }; f.n = function(){ return n; }; return f; }
var RS = _flussoRS(1), RP = _flussoRS(7);
/* la storia (storia.js) sta fuori da questo recinto: il suo caso passa di qui */
if(typeof window!=='undefined') window.GRN_RS = function(){ return RS(); };

/* ══ IL TEMPO DEL GIOCO: i passi. DOPO(secondi, f) conta i passi. ══ */
/* VIS: c'è uno schermo? (no sul server e nel banco dei piloti) */
var VIS = !((typeof GRN_SENZA_AVVIO!=='undefined') && GRN_SENZA_AVVIO);
var SIM = { firmeOgni:0, firme:[], T:0, DT:1/60, timers:[], seq:0, rigioco:false, acc:0, reg:null, ingresso:null, evi:0, attivo:false, max:0 };
/* vicini(dx,dy,r) ≡ DM.hypot(dx,dy) < r · lontani(dx,dy,r) ≡ DM.hypot(dx,dy) > r — esatti, solo più svelti */
function vicini(dx, dy, r){ if(dx >= r || dx <= -r || dy >= r || dy <= -r) return false; return Math.sqrt(dx*dx + dy*dy) < r; }
function lontani(dx, dy, r){ if(dx > r || dx < -r || dy > r || dy < -r) return true; return Math.sqrt(dx*dx + dy*dy) > r; }
function SIMMS(){ return SIM.T*1000/60; }
function DOPO(sec, fn){ SIM.timers.push({ t:SIM.T + Math.max(1, Math.round(sec*60)), s:SIM.seq++, fn:fn }); }
function _eseguiTimer(){
  for(;;){ var b = -1, L = SIM.timers;
    for(var i=0;i<L.length;i++){ var q = L[i]; if(q.t <= SIM.T && (b<0 || q.t < L[b].t || (q.t===L[b].t && q.s < L[b].s))) b = i; }
    if(b < 0) return; var tm = L.splice(b, 1)[0]; tm.fn(); }
}
/* ══ IL REGISTRO: comandi di ogni passo (a tratti uguali) + le scelte ══
   per passo: mx, my (−31..31), mira (0..255), bit (1 = mira accesa, 2 = mira forte, 4 = scatto)
   le scelte: [T, codice, argomento] */
var QM = 31;
function _qi(v){ v = Math.round(v*QM); return v > QM ? QM : (v < -QM ? -QM : v); }
function _imponi(mx, my, ab, bit){
  IN.mvx = mx/QM; IN.mvy = my/QM;
  if(bit & 1){ var a = ab*DM.PI*2/256, m = (bit & 2) ? 1 : 0.2; IN.ax = DM.cos(a)*m; IN.ay = DM.sin(a)*m; IN.aon = true; }
  else { IN.ax = 0; IN.ay = 0; IN.aon = false; }
  IN.dash = !!(bit & 4);
}
function Registro(){ this.r = []; this.ev = []; this.n = 0; }
Registro.prototype.passo = function(mx, my, ab, bit){
  var L = this.r, u = L.length ? L[L.length-1] : null;
  if(u && u[1]===mx && u[2]===my && u[3]===ab && u[4]===bit && u[0] < 60000) u[0]++; else L.push([1, mx, my, ab, bit]);
  this.n++;
};
Registro.prototype.evento = function(c, a){ this.ev.push(a===undefined ? [SIM.T, c] : [SIM.T, c, a]); };
/* il pezzo di registro dal passo `da` in poi: {da, a, r:[tratti], ev:[...]} (le scelte con T >= da) */
Registro.prototype.pezzo = function(da, evDa){
  var out = [], t = 0;
  for(var i=0;i<this.r.length;i++){ var q = this.r[i], t1 = t + q[0];
    if(t1 > da){ var n = t1 - Math.max(t, da); out.push([n, q[1], q[2], q[3], q[4]]); }
    t = t1; }
  return { da:da, a:this.n, r:out, ev:this.ev.slice(evDa||0) };
};
/* il campione di questo passo, nella pagina: quello che le levette dicono adesso, ridotto al registro */
function _campiona(){
  var mx = _qi(IN.mvx||0), my = _qi(IN.mvy||0), bit = 0, ab = 0;
  if(IN.aon){ var m = DM.hypot(IN.ax||0, IN.ay||0); if(m > 1e-6){ bit |= 1; if(m > 0.25) bit |= 2; ab = ((Math.round(DM.atan2(IN.ay, IN.ax)/(DM.PI*2)*256) % 256) + 256) % 256; } }
  if(IN.dash) bit |= 4;
  _imponi(mx, my, ab, bit);
  if(SIM.reg) SIM.reg.passo(mx, my, ab, bit);
}
/* nella rigiocata: il passo T prende i comandi dal registro */
function Lettore(reg){ this.r = reg.r || []; this.ev = reg.ev || []; this.i = 0; this.k = 0; this.e = 0; this.n = 0;
  for(var q=0;q<this.r.length;q++) this.n += this.r[q][0]; }
Lettore.prototype.prossimo = function(){ var q = this.r[this.i]; if(!q) return null; this.k++; if(this.k >= q[0]){ this.i++; this.k = 0; } return q; };

/* UN PASSO del gioco (uguale nella pagina e sul server) */
function passoSim(){
  if(SIM.rigioco){ var q = SIM.ingresso.prossimo(); if(q) _imponi(q[1], q[2], q[3], q[4]); else _imponi(0,0,0,0); }
  else { if(MODE.pilota && typeof pilota==='function' && STATO && !STATO.carta && !STATO.finito) pilotaPrima(); _campiona(); }
  _eseguiTimer();
  passo(SIM.DT);
  SIM.T++;
  if(SIM.firmeOgni && SIM.T % SIM.firmeOgni === 0) SIM.firme.push([SIM.T, firmaStato()]);
}
/* ── le AZIONI: ogni bottone di una carta, e ogni tasto che cambia il gioco,
   passa di qui. Si scrive nel registro e si esegue. Il server fa lo stesso. ── */
var AZ = [];
function azReset(){ AZ = []; }
function azAdd(fn, argf){ AZ.push({ fn:fn, usato:0, argf:argf||null }); return AZ.length-1; }
function premi(k){ var a = AZ[k]; if(!a) return false; return AZIONE(k, a.argf ? a.argf() : undefined); }
function AZIONE(k, arg){ var a = AZ[k]; if(!a || a.usato) return false; if(SIM.reg && !SIM.rigioco) SIM.reg.evento('a', arg===undefined ? k : [k, arg]); a.usato = 1; a.fn(arg, a); return true; }
/* i tasti fuori dalle carte: incassa, menu, mappa, salta la presentazione, salta il cartello del piano, paga e passa */
var COMANDI = {};
function COMANDO(c, arg){ var f = COMANDI[c]; if(!f || !STATO || !STATO.avviata) return false; if(SIM.reg && !SIM.rigioco) SIM.reg.evento(c, arg); f(arg); return true; }
/* nella rigiocata: le scelte del passo T, prima del passo */
function applicaScelte(){
  var L = SIM.ingresso.ev;
  while(SIM.ingresso.e < L.length && L[SIM.ingresso.e][0] <= SIM.T){ var e = L[SIM.ingresso.e++];
    if(e[0] < SIM.T) continue;
    if(e[1]==='a'){ if(typeof e[2]==='number') AZIONE(e[2]); else if(e[2] && typeof e[2][0]==='number') AZIONE(e[2][0], e[2][1]); }
    else if(COMANDI[e[1]]) COMANDI[e[1]](e[2]); }
}
/* LA FIRMA dello stato: per trovare il primo passo in cui due motori divergono */
function firmaStato(){
  var h = 2166136261, s = '';
  var put = function(v){ s += (typeof v==='number' ? (v===0 ? '0' : String(v)) : String(v)) + '|'; };
  put(SIM.T); put(RS.n()); if(STATO){ put(STATO.piano); put(STATO.R.pot); put(STATO.R.safe); put(STATO.chiavi); put(STATO.uccisi); put(STATO.colpi); put(STATO.finito?1:0); }
  put(P.x); put(P.y); put(P.hp); put(P.hpMax); put(fase);
  for(var k=0;k<EN.length;k++){ var e = EN[k]; if(e.on){ put(e.kind); put(e.x); put(e.y); put(e.hp); } }
  for(k=0;k<EB.length;k++){ var b = EB[k]; if(b.on){ put(b.x); put(b.y); } }
  if(boss){ put(boss.x); put(boss.y); put(boss.hp); put(boss.st); }
  for(var i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}

/* ══════════════════════════════════════════════════════════════════════════
   a_base.js — tela, misure, comandi, suono, arte
   ══════════════════════════════════════════════════════════════════════════ */
var QS = (typeof GRN_QS==='string') ? GRN_QS : (location.search || '');
var SENZA_AVVIO = (typeof GRN_SENZA_AVVIO!=='undefined') && GRN_SENZA_AVVIO;
var MODE = { dbg:/dbg|debug/.test(QS), pilota:/pilota/.test(QS), banco:/banco/.test(QS), bench:/bench/.test(QS),
             veloce:/veloce/.test(QS), dio:/dio/.test(QS), tavola:/tavola/.test(QS), piano:(QS.match(/piano=(\d)/)||[])[1]|0, turbo:(QS.match(/turbo=(\d+)/)||[])[1]|0 };
/* dentro la mini app i modi di servizio (pilota, turbo, dio, piano...) sono spenti: si accendono solo nella
   pagina di prova che lo dichiara (GRN_PROVA). Il server comunque rigioca senza: un modo acceso darebbe solo scarti. */
(function(){ if(!/guscio=1/.test(QS)) return; var prova = false; try{ prova = !!(window.parent && window.parent.GRN_PROVA); }catch(e){}
  if(!prova){ MODE.pilota = false; MODE.turbo = 0; MODE.veloce = false; MODE.dio = false; MODE.piano = 0; MODE.bench = false; MODE.banco = false; MODE.tavola = false; } })();
var $ = function(id){ return document.getElementById(id); };

/* ── la stanza in unità logiche: uguale su ogni schermo, così la difficoltà non
   cambia col telefono. La tela la scala per starci. ── */
var K = {
  RW:380, RH:540, WALL:40,
  PL_R:11, PL_SPD:160, HP:8, IFRAME:1.1,
  DASH_DIST:140, DASH_DUR:0.16, DASH_IFRAME:0.30, DASH_CD:0.9,
  FIRE_RATE:3.4, B_SPD:430, B_R:5, B_DMG:1, B_LIFE:1.05,
  EB_MAX:190, DOOR_GAP:64
};
var fx0 = K.WALL, fx1 = K.RW - K.WALL, fy0 = K.WALL, fy1 = K.RH - K.WALL;
var cv = $('cv'), ctx = cv.getContext('2d'), dpr = 1, CW = 0, CH = 0, SC = 1, OX = 0, OY = 0;

function layout(){
  var r = $('scena').getBoundingClientRect();
  dpr = Math.min(LITE ? 1 : 2, window.devicePixelRatio || 1);
  CW = Math.max(100, Math.round(r.width)); CH = Math.max(100, Math.round(r.height));
  cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr);
  SC = Math.min(CW / K.RW, CH / K.RH);
  OX = (CW - K.RW * SC) / 2; OY = (CH - K.RH * SC) / 2;
}
function aSchermo(x, y){ return { x:OX + x*SC, y:OY + y*SC }; }
function daSchermo(x, y){ return { x:(x-OX)/SC, y:(y-OY)/SC }; }

/* ── aiuti ── */
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function eOutBack(t){ var c=2.2,s=c+1; t-=1; return 1+s*t*t*t+c*t*t; }
function eOutCubic(t){ t=1-t; return 1-t*t*t; }
function rnd(a,b){ return a + RS()*(b-a); }
function pick(A){ return A[(RS()*A.length)|0]; }
function rndV(a,b){ return a + RV()*(b-a); }
function pickV(A){ return A[(RV()*A.length)|0]; }
function shuffle(A, r){ r=r||RS; for(var i=A.length-1;i>0;i--){ var j=(r()*(i+1))|0, t=A[i]; A[i]=A[j]; A[j]=t; } return A; }
function eur(v){ v = Math.max(0, v||0); var s = v>=1000 ? v.toFixed(0) : v.toFixed(2);
  var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.'); return '€ ' + p.join(','); }
/* i soldi che ESCONO si mostrano in giù al centesimo, come li paga il banco */
function eurGiu(v){ return eur(Math.floor((v||0)*100 + 1e-6)/100); }
function pct(p){ return Math.round(p*100) + '%'; }
function xf(v){ return '×' + v.toFixed(2).replace('.',','); }
function store(k, v){ try{ if(v===undefined) return localStorage.getItem('grun_'+k); localStorage.setItem('grun_'+k, v); }catch(e){ return null; } }

/* ══ ARTE: le immagini generate (ART = mappa nome→dataURI, iniettata dal build) ══ */
var IMG = {}, SPR = {}, ARTE = { pronta:false, n:0, tot:0, attesa:[] };
/* LITE: i telefoni deboli (lo dice la mini app, o un Chrome vecchio, o poca memoria) */
var LITE = (function(){ try{ if(/lite=1/.test(QS)) return true; if(window.parent && window.parent!==window && window.parent.document.documentElement.classList.contains('gb-lite')) return true; }catch(e){}
  try{ if(localStorage.getItem('gb_lite')==='1') return true; }catch(e2){}
  var u = /Chrome\/(\d+)/.exec(navigator.userAgent||''); if(u && +u[1] < 100) return true;
  return !!(navigator.deviceMemory && navigator.deviceMemory <= 2); })();
/* le immagini a due tempi: il titolo subito, il resto mentre si guarda il titolo */
var ARTE_SUBITO = ['l_logo','t_facciata','t_strada','p_mascotte','u_cornice','p_esattore','i_chiave','i_cuore'];
function caricaArte(fatto){
  var nomi = Object.keys(ART); ARTE.tot = nomi.length;
  if(!nomi.length){ ARTE.pronta = true; fatto(); return; }
  var prima = nomi.filter(function(k){ return ARTE_SUBITO.indexOf(k)>=0; }), dopo = nomi.filter(function(k){ return ARTE_SUBITO.indexOf(k)<0; }), np = 0, avviato = false;
  var fine = function(){ if(ARTE.n >= ARTE.tot && !ARTE.pronta){ ARTE.pronta = true; var L = ARTE.attesa; ARTE.attesa = []; L.forEach(function(f){ f(); }); } };
  var una = function(k, cb){ var im = new Image(); im.onload = im.onerror = function(){ ARTE.n++; if(cb) cb(); fine(); }; im.src = ART[k]; IMG[k] = im; };
  var via = function(){ if(avviato) return; avviato = true; fatto(); dopo.forEach(function(k){ una(k); }); };
  if(!prima.length) via(); else prima.forEach(function(k){ una(k, function(){ if(++np===prima.length) via(); }); });
  setTimeout(via, 6000);   /* rete lenta: il titolo parte lo stesso */
}
/* prima di scendere servono tutte (le figure dei nemici): se mancano, si aspetta con la barra */
function quandoArte(f){
  if(ARTE.pronta || !VIS){ f(); return; }
  ARTE.attesa.push(f);
  var b = document.createElement('div'); b.id = 'arteBar';
  b.style.cssText = 'position:fixed;left:50%;bottom:18%;transform:translateX(-50%);z-index:70;width:70%;max-width:300px;height:10px;border:2px solid #e8b44a;border-radius:6px;background:#120812';
  b.innerHTML = '<i style="display:block;height:100%;width:0;background:#e8b44a"></i>'; document.body.appendChild(b);
  var t = setInterval(function(){ var i = b.querySelector('i'); if(i) i.style.width = Math.round(100*ARTE.n/Math.max(1,ARTE.tot))+'%'; if(ARTE.pronta){ clearInterval(t); b.remove(); } }, 150);
}
/* sprite cotto: l'immagine ridotta alla misura d'uso, col CONTORNO di leggibilità
   (il metro dei 40 px: una silhouette netta anche su un pavimento fitto) e due
   maschere (bianca = colpito, ambra = carica). */
function cuoci(nome, h, bordo, colBordo){
  var key = nome+'|'+h+'|'+(bordo||0);
  if(SPR[key]) return SPR[key];
  var im = IMG[nome]; if(!im || !im.width) return null;
  var s = h / im.height, w = Math.max(1, Math.round(im.width*s)), hh = Math.max(1, Math.round(im.height*s));
  var R = 2, pad = (bordo||0) + 2, W = (w+pad*2)*R, H = (hh+pad*2)*R;
  var c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  if(bordo){
    var t = document.createElement('canvas'); t.width = W; t.height = H; var tg = t.getContext('2d');
    tg.drawImage(im, pad*R, pad*R, w*R, hh*R);
    tg.globalCompositeOperation = 'source-in'; tg.fillStyle = colBordo || '#000'; tg.fillRect(0,0,W,H);
    for(var a=0;a<16;a++){ var an = a/16*6.283; g.drawImage(t, DM.cos(an)*bordo*R, DM.sin(an)*bordo*R); }
  }
  g.drawImage(im, pad*R, pad*R, w*R, hh*R);
  var mk = function(col){ var m = document.createElement('canvas'); m.width=W; m.height=H; var mg=m.getContext('2d');
    mg.drawImage(c,0,0); mg.globalCompositeOperation='source-in'; mg.fillStyle=col; mg.fillRect(0,0,W,H); return m; };
  var o = { c:c, w:W/R, h:H/R, bianco:mk('#ffffff'), ambra:mk('#ffc04a'), nero:mk('#000000'), rosso:mk('#ff2050') };
  SPR[key] = o; return o;
}
/* frammenti per lo spezzettamento: la figura tagliata in N pezzi che volano via */
function frammenti(spr, n){
  var out = [], cols = n>6?3:2, rows = Math.ceil(n/cols), pw = spr.c.width/cols, ph = spr.c.height/rows;
  for(var r=0;r<rows;r++) for(var q=0;q<cols;q++){
    var c = document.createElement('canvas'); c.width = Math.ceil(pw); c.height = Math.ceil(ph);
    var g = c.getContext('2d'); g.beginPath();
    var j = function(){ return (RV()-0.5)*pw*0.25; };
    g.moveTo(j(),j()); g.lineTo(pw+j(),j()); g.lineTo(pw+j(),ph+j()); g.lineTo(j(),ph+j()); g.closePath(); g.clip();
    g.drawImage(spr.c, -q*pw, -r*ph);
    out.push({ c:c, ox:(q+0.5)*pw/2 - spr.w/2, oy:(r+0.5)*ph/2 - spr.h/2 });
  }
  return out;
}
/* un fondale di pavimento cotto una volta: scurito, per far leggere le figure */
var FONDI = {};
function fondale(nome, scuro){
  var k = nome+'|'+scuro; if(FONDI[k]) return FONDI[k];
  var im = IMG[nome]; if(!im || !im.width) return null;
  var c = document.createElement('canvas'); c.width = K.RW*2; c.height = K.RH*2; var g = c.getContext('2d');
  g.drawImage(im, 0, 0, c.width, c.height);
  /* il centro calmo: velo scuro, più forte al centro dove si combatte */
  var gr = g.createRadialGradient(c.width/2, c.height/2, c.width*0.12, c.width/2, c.height/2, c.width*0.75);
  gr.addColorStop(0, 'rgba(12,6,14,'+scuro+')'); gr.addColorStop(1, 'rgba(12,6,14,'+(scuro*0.55)+')');
  g.fillStyle = gr; g.fillRect(0,0,c.width,c.height);
  /* grana a puntini: la stampa fuori registro */
  g.globalAlpha = 0.06; g.fillStyle = '#000';
  for(var i=0;i<2600;i++) g.fillRect((RV()*c.width)|0, (RV()*c.height)|0, 2, 2);
  g.globalAlpha = 1;
  FONDI[k] = c; return c;
}

/* ══ COMANDI: due levette sul telefono, WASD + frecce/mouse sul PC ══ */
var IN = { mvx:0, mvy:0, ax:0, ay:0, aon:false, dash:false };
var KEY = {}, MOUSE = { x:0, y:0, down:false, on:false };
function levetta(joyId, knobId, onVec, onEnd, R){
  var joy = $(joyId), knob = $(knobId), drag = false, tid = null;
  function set(cx, cy){ var r = joy.getBoundingClientRect(), dx = cx-(r.left+r.width/2), dy = cy-(r.top+r.height/2), m = DM.hypot(dx,dy);
    if(m>R){ dx=dx/m*R; dy=dy/m*R; m=R; } knob.style.transform='translate('+dx+'px,'+dy+'px)';
    if(m/R<0.14) onVec(0,0); else onVec(dx/R, dy/R); }
  function trova(ev){ if(tid==null) return null; for(var i=0;i<ev.changedTouches.length;i++) if(ev.changedTouches[i].identifier===tid) return ev.changedTouches[i]; return null; }
  joy.addEventListener('touchstart', function(ev){ if(drag) return; var t = ev.changedTouches[0]; tid = t.identifier; drag = true; joy.classList.add('on'); ev.preventDefault(); set(t.clientX, t.clientY); suono.sblocca(); }, {passive:false});
  joy.addEventListener('touchmove', function(ev){ if(!drag) return; var t = trova(ev); if(!t) return; ev.preventDefault(); set(t.clientX, t.clientY); }, {passive:false});
  var su = function(ev){ if(!drag) return; var t = trova(ev); if(!t) return; ev.preventDefault(); drag=false; tid=null; joy.classList.remove('on'); knob.style.transform=''; onEnd(); };
  joy.addEventListener('touchend', su, {passive:false}); joy.addEventListener('touchcancel', su, {passive:false});
}
function comandi(){
  levetta('joyL','knobL', function(x,y){ IN.mvx=x; IN.mvy=y; IN.tL=1; }, function(){ IN.mvx=0; IN.mvy=0; IN.tL=0; }, 44);
  levetta('joyR','knobR', function(x,y){ IN.ax=x; IN.ay=y; IN.aon=(x*x+y*y)>0.03; IN.tR=1; }, function(){ IN.ax=0; IN.ay=0; IN.aon=false; IN.tR=0; }, 44);
  var bd = $('btnDash');
  bd.addEventListener('touchstart', function(ev){ ev.preventDefault(); IN.dash = true; }, {passive:false});
  window.addEventListener('touchstart', function(){ if(!document.body.classList.contains('touch')){ document.body.classList.add('touch'); setTimeout(layout,30); } suono.sblocca(); }, {passive:true});
  window.addEventListener('keydown', function(ev){ var k = ev.key.toLowerCase(); KEY[k] = 1; suono.sblocca();
    if(k===' '||k==='shift'){ IN.dash = true; ev.preventDefault(); }
    if(k==='m'||k==='tab'){ ev.preventDefault(); if(STATO && !STATO.mappaAperta) COMANDO('mappa1'); }
    if(k==='escape'){ if(STATO && !STATO.mappaAperta) COMANDO('menu'); }
    if(ev.key.indexOf('Arrow')===0) ev.preventDefault(); });
  window.addEventListener('keyup', function(ev){ KEY[ev.key.toLowerCase()] = 0; });
  cv.addEventListener('mousemove', function(ev){ var r = cv.getBoundingClientRect(); MOUSE.x = ev.clientX-r.left; MOUSE.y = ev.clientY-r.top; MOUSE.on = true; });
  cv.addEventListener('mousedown', function(ev){ if(ev.button===0){ MOUSE.down = true; var r = cv.getBoundingClientRect(); MOUSE.x = ev.clientX-r.left; MOUSE.y = ev.clientY-r.top; MOUSE.on = true; suono.sblocca(); ev.preventDefault(); } });
  window.addEventListener('mouseup', function(){ MOUSE.down = false; });
  window.addEventListener('contextmenu', function(ev){ ev.preventDefault(); });
  window.addEventListener('resize', layout);
  window.addEventListener('blur', function(){ KEY = {}; MOUSE.down = false; });
}
/* tastiera e mouse entrano nello stesso stato delle levette */
function leggiTasti(){
  if(document.body.classList.contains('touch') || MODE.pilota || MODE.bench) return;
  var mx=0,my=0;
  if(KEY.a) mx-=1; if(KEY.d) mx+=1; if(KEY.w) my-=1; if(KEY.s) my+=1;
  var m = DM.hypot(mx,my); if(m>1){ mx/=m; my/=m; }
  IN.mvx=mx; IN.mvy=my;
  var ax=0, ay=0;
  if(KEY.arrowleft) ax-=1; if(KEY.arrowright) ax+=1; if(KEY.arrowup) ay-=1; if(KEY.arrowdown) ay+=1;
  if(ax||ay){ var am=DM.hypot(ax,ay); IN.ax=ax/am; IN.ay=ay/am; IN.aon=true; }
  else if(MOUSE.down && MOUSE.on && typeof P!=='undefined'){ var w = daSchermo(MOUSE.x, MOUSE.y), dx = w.x-P.x, dy = w.y-P.y, d = DM.hypot(dx,dy)||1; IN.ax=dx/d; IN.ay=dy/d; IN.aon=true; }
  else { IN.ax=0; IN.ay=0; IN.aon=false; }
}

/* ══ SUONO: sintesi Web Audio, niente file. Ogni colpo ha tre strati (secco,
   metallo, coda) e la musica si abbassa sul colpo: è il «croccante». ══ */
var suono = (function(){
  var AC = null, master = null, musica = null, muto = store('muto')==='1', mus = null;
  function sblocca(){ try{ if(!AC){ var X = window.AudioContext||window.webkitAudioContext; if(!X) return; AC = new X();
      master = AC.createGain(); master.gain.value = muto?0:0.8; master.connect(AC.destination);
      musica = AC.createGain(); musica.gain.value = 0.0; musica.connect(master); }
    if(AC.state==='suspended') AC.resume(); }catch(e){} }
  function osc(tipo, f0, f1, dur, vol, t0, dest){ var t = AC.currentTime + (t0||0), o = AC.createOscillator(), g = AC.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t); if(f1) o.frequency.exponentialRampToValueAtTime(f1, t+dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g); g.connect(dest||master); o.start(t); o.stop(t+dur+0.02); }
  function rumore(dur, vol, freq, t0, tipoF){ var t = AC.currentTime+(t0||0), n = AC.createBufferSource(), L = Math.max(1,(AC.sampleRate*dur)|0),
      b = AC.createBuffer(1, L, AC.sampleRate), d = b.getChannelData(0);
    for(var q=0;q<L;q++) d[q] = (RV()*2-1)*DM.pow(1-q/L, 2);
    n.buffer = b; var f = AC.createBiquadFilter(); f.type = tipoF||'lowpass'; f.frequency.value = freq; var g = AC.createGain(); g.gain.value = vol;
    n.connect(f); f.connect(g); g.connect(master); n.start(t); }
  function abbassa(){ if(!musica) return; var t = AC.currentTime; musica.gain.cancelScheduledValues(t); musica.gain.setValueAtTime(musica.gain.value, t);
    musica.gain.linearRampToValueAtTime(mus?mus.vol*0.5:0, t+0.02); musica.gain.linearRampToValueAtTime(mus?mus.vol:0, t+0.22); }
  var S = {
    sparo:function(){ osc('square', 900, 260, 0.05, 0.05); rumore(0.03, 0.05, 5000, 0, 'highpass'); },
    colpo:function(){ osc('triangle', 380, 120, 0.07, 0.09); },
    uccidi:function(g){ rumore(0.16, 0.24*(g||1), 2600); osc('square', 220, 60, 0.12, 0.07); osc('sine', 1400, 700, 0.1, 0.04, 0.02); abbassa(); },
    ahi:function(){ osc('sawtooth', 240, 70, 0.24, 0.16); rumore(0.12, 0.2, 900); abbassa(); },
    scatto:function(){ rumore(0.1, 0.1, 1800, 0, 'bandpass'); },
    porta:function(){ osc('sine', 110, 55, 0.25, 0.2); rumore(0.08, 0.1, 700); osc('triangle', 880, 0, 0.12, 0.05, 0.05); },
    chiusa:function(){ osc('square', 90, 45, 0.18, 0.12); rumore(0.14, 0.16, 500); },
    raccolta:function(){ [660, 880, 1320].forEach(function(f,i){ osc('sine', f, 0, 0.18, 0.08, i*0.05); }); },
    potere:function(){ [440, 554, 659, 880, 1109].forEach(function(f,i){ osc('triangle', f, 0, 0.3, 0.07, i*0.06); }); abbassa(); },
    moneta:function(){ osc('square', 1760, 0, 0.04, 0.025); osc('sine', 2640, 0, 0.05, 0.02, 0.01); },
    vinto:function(){ [523, 659, 784, 1047].forEach(function(f,i){ osc('triangle', f, 0, 0.35, 0.09, i*0.07); osc('sine', f*2, 0, 0.2, 0.03, i*0.07); }); abbassa(); },
    perso:function(){ osc('sawtooth', 150, 50, 0.5, 0.14); rumore(0.3, 0.16, 400); abbassa(); },
    timbro:function(){ rumore(0.12, 0.35, 900); osc('sine', 70, 40, 0.2, 0.25); abbassa(); },
    boom:function(g){ rumore(0.45, 0.35*(g||1), 1300); osc('sine', 80, 30, 0.5, 0.3*(g||1)); abbassa(); },
    carta:function(){ rumore(0.07, 0.12, 3500, 0, 'bandpass'); osc('sine', 300, 600, 0.06, 0.03); },
    scendi:function(){ osc('sine', 220, 55, 0.9, 0.18); rumore(0.8, 0.08, 600); },
    ruggito:function(){ osc('sawtooth', 90, 45, 0.9, 0.2); osc('square', 60, 40, 0.9, 0.12); rumore(0.9, 0.2, 700); abbassa(); },
    tic:function(){ osc('square', 2400, 0, 0.015, 0.03); }
  };
  /* la musica: un basso che cammina in minore e un piatto a spazzola. In
     combattimento sale di un gradino. Niente file. */
  var passo = 0, prossima = 0, NOTE = [0, 3, 7, 5, 0, 3, 8, 7], TIMER = null;
  function ciclo(){
    if(!AC || !mus) return;
    var bpm = mus.combat ? 124 : 92, spb = 60/bpm/2;
    while(prossima < AC.currentTime + 0.25){
      var t0 = prossima - AC.currentTime; if(t0<0) t0=0;
      var st = passo % 8, base = mus.combat ? 49 : 43.65;
      if(passo%2===0) osc('triangle', base*DM.pow(2, NOTE[st]/12), 0, spb*1.8, mus.combat?0.16:0.12, t0, musica);
      if(passo%2===1 || mus.combat) rumore(0.03, mus.combat?0.05:0.03, 7000, t0, 'highpass');
      if(mus.combat && passo%4===0) osc('sine', 70, 40, 0.12, 0.18, t0, musica);
      if(passo%16===12) osc('sine', base*4*DM.pow(2, NOTE[(passo/2|0)%8]/12), 0, 0.5, 0.025, t0, musica);
      prossima += spb; passo++;
    }
  }
  return {
    sblocca:sblocca,
    fx:function(n, a){ if(!AC || muto) return; try{ S[n] && S[n](a); }catch(e){} },
    musica:function(stato){ if(!AC) return; mus = stato ? { combat:stato==='combat', vol:stato==='combat'?0.5:0.35 } : null;
      try{ var t = AC.currentTime; musica.gain.cancelScheduledValues(t); musica.gain.linearRampToValueAtTime(mus?mus.vol:0, t+0.6);
        if(mus && !TIMER){ prossima = AC.currentTime+0.05; TIMER = setInterval(ciclo, 90); } }catch(e){} },
    muto:function(v){ if(v===undefined) return muto; muto = v; store('muto', v?'1':'0'); if(master) master.gain.value = v?0:0.8; }
  };
})();

/* ══════════════════════════════════════════════════════════════════════════
   b_nemici.js — I NEMICI. Le macchine a stati vengono da grCombatArena di
   produzione (via CUORE.html, alla lettera dove possibile); cambia la pelle:
   ogni archetipo ha la sua illustrazione e una silhouette che si legge a 40 px.
   Un'idea per nemico, e il preavviso si vede sempre prima del colpo.
   ══════════════════════════════════════════════════════════════════════════ */
var ND = {
  scagnozzo:{ nm:'SCAGNOZZO', img:'e_scagnozzo', h:46, r:13, hp:3, spd:95, col:'#e0457b', tip:'ti viene addosso · carica segnata',
    init:function(e){ e.cd=1+RS()*1.2; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(e.st===0){ e.x+=ux*e.spd*dt; e.y+=uy*e.spd*dt; e.cd-=dt; if(e.cd<=0&&d<220){ e.st=1; e.t=0.5; e.tele=0.5; } }
      else if(e.st===1){ e.t-=dt; e.tele=e.t; if(e.t<=0){ e.st=2; e.t=0.4; e.vx=ux*210; e.vy=uy*210; } }
      else { e.t-=dt; e.x+=e.vx*dt; e.y+=e.vy*dt; if(e.t<=0){ e.st=0; e.cd=1.4+RS()*0.6; } }
      if(d<e.r+C.PLR) C.hit(); } },
  pistolero:{ nm:'PISTOLERO', img:'e_pistolero', h:42, r:13, hp:2, spd:70, col:'#e8a040', tip:'tre colpi a ventaglio',
    init:function(e){ e.cd=1.4+RS(); },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d, want=170, mv=0;
      if(d<want-24) mv=-1; else if(d>want+24) mv=1;
      e.x+=ux*70*dt*mv+(-uy)*16*dt; e.y+=uy*70*dt*mv+(ux)*16*dt;
      if(e.tele>0){ e.tele-=dt; if(e.tele<=0){ var a0=DM.atan2(dy,dx); for(var j=-1;j<=1;j++) C.eb(e.x,e.y-8,a0+j*0.14,C.esp(150),6); C.sfx('sparo'); } }
      else { e.cd-=dt; if(e.cd<=0){ e.tele=0.5; e.cd=2.3; } } } },
  fiche:{ nm:'FICHE VIVA', img:'e_fiche', h:26, r:9, hp:1, spd:70, col:'#ff3d8b', tip:'gira e poi si butta',
    init:function(e){ e.cd=2+RS()*1.5; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(e.tele>0){ e.tele-=dt; if(e.tele<=0){ e.st=2; e.t=0.55; e.vx=ux*155; e.vy=uy*155; } }
      else if(e.st===2){ e.t-=dt; e.x+=e.vx*dt; e.y+=e.vy*dt; if(e.t<=0){ e.st=0; e.cd=2.4+RS()*1.4; } }
      else { var ox=-uy,oy=ux; e.x+=(ux*22+ox*70)*dt; e.y+=(uy*22+oy*70)*dt; e.cd-=dt; if(e.cd<=0){ e.tele=0.6; } }
      if(d<e.r+C.PLR) C.hit(); } },
  buttafuori:{ nm:'BUTTAFUORI', img:'e_buttafuori', h:66, r:20, hp:10, spd:40, col:'#c0532b', tip:'lento · la carica è una riga rossa',
    init:function(e){ e.cd=1.6+RS()*0.8; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(e.st===0){ e.x+=ux*e.spd*dt; e.y+=uy*e.spd*dt; e.cd-=dt; if(e.cd<=0&&d<300){ e.st=1; e.t=0.9; e.tele=0.9; e.aimA=DM.atan2(dy,dx); } }
      else if(e.st===1){ e.t-=dt; e.tele=e.t; if(e.t<=0){ e.st=2; e.t=0.5; e.vx=DM.cos(e.aimA)*330; e.vy=DM.sin(e.aimA)*330; C.sfx('scatto'); } }
      else { e.t-=dt; e.x+=e.vx*dt; e.y+=e.vy*dt; if(e.t<=0){ e.st=0; e.cd=1.8+RS()*0.8; e.tele=0; C.shake(3); } }
      if(d<e.r+C.PLR) C.hit(); } },
  cecchino:{ nm:'CECCHINO', img:'e_cecchino', h:60, r:12, hp:2, spd:58, col:'#ff5a5f', tip:'la riga rossa è il colpo',
    init:function(e){ e.cd=1.6+RS(); },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d, want=240, mv=0;
      if(d<want-30)mv=-1; else if(d>want+30)mv=1;
      e.x+=ux*e.spd*dt*mv+(-uy)*e.spd*0.5*dt; e.y+=uy*e.spd*dt*mv+(ux)*e.spd*0.5*dt;
      if(e.tele>0){ e.tele-=dt; if(e.tele<=0){ C.eb(e.x,e.y-10,e.aimA,C.esp(320),7,1); C.sfx('sparo'); } }
      else { e.cd-=dt; if(e.cd<=0){ e.tele=0.85; e.cd=2.7; e.aimA=DM.atan2(dy,dx); } } } },
  dinamite:{ nm:'DINAMITARDO', img:'e_dinamite', h:40, r:12, hp:3, spd:78, col:'#ff5a3b', tip:'ti esplode addosso · e da morto',
    init:function(e){ e.cd=0; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      e.x+=ux*e.spd*dt; e.y+=uy*e.spd*dt; e.t+=dt;
      if(d<e.r+C.PLR+6){ C.hit(); e.on=0; C.anello(e.x,e.y,12,150); C.burst(e.x,e.y,16,'#ff9a3b'); C.sfx('boom',0.6); } },
    onDeath:function(e,C){ C.anello(e.x,e.y,12,150); C.burst(e.x,e.y,16,'#ff9a3b'); C.sfx('boom',0.6); } },
  lama:{ nm:'ASSO DI LAME', img:'e_lama', h:38, r:11, hp:2, spd:70, col:'#f1e6cf', tip:'scatta a lama',
    init:function(e){ e.cd=0.8+RS()*0.6; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(e.st===0){ e.x+=ux*e.spd*dt; e.y+=uy*e.spd*dt; e.cd-=dt; if(e.cd<=0){ e.st=3; e.t=0.28; e.tele=0.28; } }
      else if(e.st===3){ e.t-=dt; e.tele=e.t; if(e.t<=0){ e.st=1; e.t=0.16; e.vx=ux*520; e.vy=uy*520; } }
      else { e.t-=dt; e.x+=e.vx*dt; e.y+=e.vy*dt; if(e.t<=0){ e.st=0; e.cd=0.7+RS()*0.5; } }
      if(d<e.r+C.PLR) C.hit(); } },
  slot:{ nm:'SLOT', img:'e_slot', h:46, r:15, hp:6, spd:0, col:'#e8b44a', tip:'ferma · anello di monete', spawnAt:'anchor',
    init:function(e){ e.cd=1.4+RS(); e.spin=RS()*6.283; },
    ai:function(e,dt,C){ e.spin+=dt*1.2; if(e.tele>0){ e.tele-=dt; if(e.tele<=0){ for(var j=0;j<8;j++) C.eb(e.x,e.y,e.spin+j/8*6.283,C.esp(125),6,0,1); C.sfx('moneta'); } }
      else { e.cd-=dt; if(e.cd<=0){ e.tele=0.5; e.cd=1.9; } } } },
  corazzato:{ nm:'CORAZZATO', img:'e_corazzato', h:48, r:15, hp:5, spd:50, col:'#e8b44a', tip:'lo scudo para · quando spara lo abbassa', shield:true,
    init:function(e){ e.cd=2+RS(); e.giu=0; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1;
      var fa=DM.atan2(dy,dx); if(e.face==null) e.face=fa; var df=fa-e.face; while(df>Math.PI)df-=6.283; while(df<-Math.PI)df+=6.283;
      if(e.giu>0){ e.giu-=dt; e._scudoGiu=1; if(e.giu<=0){ e._scudoGiu=0; e.cd=2.2+RS()*0.8; } return; }
      e._scudoGiu=0;
      if(e.tele>0){ e.tele-=dt; if(e.tele<=0){ for(var j=-2;j<=2;j++) C.eb(e.x,e.y-14,e.face+j*0.18,C.esp(140),6,0,1); C.sfx('moneta'); e.giu=1.1; } return; }
      e.face+=clamp(df,-1.3*dt,1.3*dt); e.x+=DM.cos(e.face)*e.spd*dt; e.y+=DM.sin(e.face)*e.spd*dt;
      e.cd-=dt; if(e.cd<=0 && d<260){ e.tele=0.5; }
      if(d<e.r+C.PLR) C.hit(); } },
  mazziere:{ nm:'MAZZIERE', img:'e_mazziere', h:52, r:14, hp:6, spd:35, col:'#ff3d8b', tip:'chiama le fiche · colpiscilo per primo', spawnAt:'anchor',
    init:function(e){ e.cd=2.5+RS()*2; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(d<200){ e.x-=ux*e.spd*dt; e.y-=uy*e.spd*dt; } else { e.x+=(-uy)*e.spd*0.5*dt; e.y+=(ux)*e.spd*0.5*dt; }
      if(e.tele>0){ e.tele-=dt; if(e.tele<=0){ for(var s=0;s<3;s++){ var a=RS()*6.283; C.spawn('fiche',e.x+DM.cos(a)*22,e.y+DM.sin(a)*22); } } }
      else { e.cd-=dt; if(e.cd<=0 && C.alive()<10 && (e._nh|0)<4){ e._nh=(e._nh|0)+1; e.tele=0.5; e.cd=4+RS()*2; } } } },
  dado:{ nm:'DADO', img:'e_dado', h:40, r:14, hp:4, spd:66, col:'#f1e6cf', tip:'si spacca in due dadini',
    init:function(e){ e.cd=1; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      e.x+=ux*e.spd*dt; e.y+=uy*e.spd*dt; if(d<e.r+C.PLR) C.hit(); },
    onDeath:function(e,C){ for(var s=0;s<2;s++) C.spawn('dadino',e.x+(s?12:-12),e.y); } },
  dadino:{ nm:'DADINO', img:'e_dado', h:22, r:8, hp:1, spd:70, col:'#f1e6cf', tip:'', mini:1,
    init:function(e){ e.cd=1.2+RS(); },
    ai:function(e,dt,C){ ND.fiche.ai(e,dt,C); } },
  fantasma:{ nm:'FANTASMA', img:'e_fantasma', h:48, r:12, hp:3, spd:74, col:'#ff9ad0', tip:'svanisce e ricompare vicino',
    init:function(e){ e.cd=1.1+RS()*0.8; e.vis=1; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(e.st===0){ e.vis=1; e._invuln=0; e.x+=ux*e.spd*dt; e.y+=uy*e.spd*dt; e.cd-=dt; if(e.cd<=0&&d>90){ e.st=1; e.t=0.45; } if(d<e.r+C.PLR) C.hit(); }
      else if(e.st===1){ e.t-=dt; e.tele=e.t; e.vis=Math.max(0.1,e.t/0.45); e._invuln=1;
        if(e.t<=0){ var a=RS()*6.283, rr=70+RS()*44; e.x=clamp(P.x+DM.cos(a)*rr,C.fx0+e.r,C.fx1-e.r); e.y=clamp(P.y+DM.sin(a)*rr,C.fy0+e.r,C.fy1-e.r);
          e.st=2; e.t=0.36; e.vis=0.2; C.part(e.x,e.y,0,0,0.3,'#ff9ad0',8); } }
      else { e.t-=dt; e.vis=Math.min(1,1.2-e.t/0.36); e._invuln=e.t>0.18?1:0; if(e.t<=0){ e.st=0; e.cd=1.3+RS()*0.8; } if(d<e.r+C.PLR&&!e._invuln) C.hit(); } } },
  serpente:{ nm:'SERPENTE', img:'e_serpente', h:44, r:12, hp:3, spd:85, col:'#ff5a5f', tip:'serpeggia sparando',
    init:function(e){ e.cd=0.6; e.ph=RS()*6.283; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      e.ph+=dt*4; var wob=DM.sin(e.ph), avv=d>120?1:-0.4; e.x+=(ux*avv+(-uy)*wob)*e.spd*dt; e.y+=(uy*avv+(ux)*wob)*e.spd*dt;
      e.cd-=dt; if(e.cd<=0){ C.eb(e.x,e.y-6,DM.atan2(dy,dx)+DM.sin(e.ph)*0.5,C.esp(150),6); e.cd=0.5; }
      if(d<e.r+C.PLR) C.hit(); } },
  /* ── I SEI NUOVI (25/09): ognuno un'idea sola, leggibile a 40 px ── */
  borseggiatore:{ nm:'BORSEGGIATORE', img:'e_borseggiatore', h:46, r:11, hp:3, spd:125, col:'#e8b44a', tip:'ti ruba dalla BORSA e scappa · se lo prendi ridà tutto',
    init:function(e){ e.cd=0.6; e.bottino=0; e.fuga=0; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(!e.bottino){ e.x+=ux*e.spd*dt+(-uy)*30*dt*DM.sin(e.nato*4); e.y+=uy*e.spd*dt+(ux)*30*dt*DM.sin(e.nato*4);
        if(d<e.r+C.PLR+4 && STATO.R.pot>0){ var v = Math.min(STATO.R.pot, STATO.R.posta*0.035*crescita()); STATO.R.pot -= v; e.bottino = v; STATO.rubati = (STATO.rubati||0)+v;
          popTesto('−'+eur(v), P.x, P.y-20); C.sfx('moneta'); hud.tutto(); e.fuga = 0; } }
      else { e.fuga += dt; var best=null, bd=1e9; for(var i=0;i<4;i++){ var pp=puntoPorta(i); var q=DM.hypot(pp.x-e.x,pp.y-e.y); if(q<bd){ bd=q; best=pp; } }
        var fx=best.x-e.x, fy=best.y-e.y, fl=DM.hypot(fx,fy)||1; e.x+=fx/fl*e.spd*1.1*dt - ux*20*dt; e.y+=fy/fl*e.spd*1.1*dt - uy*20*dt;
        if(e.fuga>4.5 && fl<34){ e.on=0; C.burst(e.x,e.y,10,'#e8b44a'); banner('SCAPPATO', 'col tuo '+eur(e.bottino), 1.2); } } },
    onDeath:function(e,C){ if(e.bottino) lasciaSoldi(e.bottino, e.x, e.y, 4); } },
  minatore:{ nm:'MINATORE', img:'e_minatore', h:46, r:13, hp:4, spd:55, col:'#ff5a3b', tip:'semina fiche-mina per terra · stai lontano dai lumini',
    init:function(e){ e.cd=1.2+RS(); },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d, mv = d<150?-1:(d>230?1:0);
      e.x+=ux*e.spd*dt*mv+(-uy)*e.spd*0.7*dt; e.y+=uy*e.spd*dt*mv+(ux)*e.spd*0.7*dt;
      if(e.tele>0){ e.tele-=dt; if(e.tele<=0){ C.spawn('minachip', e.x, e.y+6, 1); } }
      else { e.cd-=dt; if(e.cd<=0 && C.alive()<16){ e.tele=0.35; e.cd=2.2+RS(); } } } },
  minachip:{ nm:'FICHE-MINA', img:'i_scoppio', h:22, r:9, hp:1, spd:0, col:'#ff5a3b', tip:'', mini:1,
    init:function(e){ e.fuse=2.2; },
    ai:function(e,dt,C){ var P=C.P, d=DM.hypot(P.x-e.x,P.y-e.y); e.fuse-=dt; e.tele = e.fuse<0.8 ? e.fuse : 0;
      if(d<30 && e.fuse>0.6) e.fuse=0.6;
      if(e.fuse<=0){ e.on=0; C.anello(e.x,e.y,8,130); C.burst(e.x,e.y,14,'#ff9a3b'); C.sfx('boom',0.5); if(d<34) C.hit(); } } },
  toro:{ nm:'IL TORO', img:'e_toro', h:54, r:17, hp:8, spd:48, col:'#f1e6cf', tip:'raspa, poi carica dritto · contro il muro resta intontito',
    init:function(e){ e.cd=1.5+RS(); e.stun=0; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(e.stun>0){ e.stun-=dt; return; }
      if(e.st===0){ e.x+=ux*e.spd*dt; e.y+=uy*e.spd*dt; e.cd-=dt; if(e.cd<=0){ e.st=1; e.t=0.85; e.tele=0.85; e.aimA=DM.atan2(dy,dx); } }
      else if(e.st===1){ e.t-=dt; e.tele=e.t; e.aimA = e.aimA*0.93+DM.atan2(dy,dx)*0.07; if(RS()<0.4) C.part(e.x+(RS()-0.5)*20,e.y+e.r*0.6,0,-20,0.3,'#3a2410',3); if(e.t<=0){ e.st=2; e.vx=DM.cos(e.aimA)*420; e.vy=DM.sin(e.aimA)*420; C.sfx('scatto'); } }
      else { e.x+=e.vx*dt; e.y+=e.vy*dt; if(e.x<C.fx0+e.r+1||e.x>C.fx1-e.r-1||e.y<C.fy0+e.r+1||e.y>C.fy1-e.r-1){ e.st=0; e.stun=1.4; e.cd=1.8; C.shake(6); C.burst(e.x,e.y,12,'#3a2410'); C.sfx('boom',0.5); } }
      if(d<e.r+C.PLR) C.hit(e.st===2); } },
  roulette:{ nm:'ROULETTE', img:'e_roulette', h:40, r:15, hp:5, spd:170, col:'#b8202e', tip:'rotola e non si ferma · colpiscila quando gira sul posto',
    init:function(e){ var a=RS()*6.283; e.vx=DM.cos(a)*170; e.vy=DM.sin(a)*170; e.cd=2.6; e._invuln=1; },
    ai:function(e,dt,C){ var P=C.P;
      if(e.st===0){ e._invuln=1; e.x+=e.vx*dt; e.y+=e.vy*dt; if(e.x<C.fx0+e.r||e.x>C.fx1-e.r) e.vx=-e.vx; if(e.y<C.fy0+e.r||e.y>C.fy1-e.r) e.vy=-e.vy; e.cd-=dt; if(e.cd<=0){ e.st=1; e.t=1.8; e.tele=0.4; } }
      else { e._invuln=0; e.t-=dt; if(e.tele>0){ e.tele-=dt; if(e.tele<=0){ for(var j=0;j<10;j++) C.eb(e.x,e.y-8,j/10*6.283+e.t,C.esp(120),6,0,1); C.sfx('moneta'); } }
        if(e.t<=0){ e.st=0; e.cd=2.4+RS(); var a=DM.atan2(P.y-e.y,P.x-e.x)+(RS()-0.5)*1.2; e.vx=DM.cos(a)*170; e.vy=DM.sin(a)*170; } }
      if(DM.hypot(P.x-e.x,P.y-e.y)<e.r+C.PLR) C.hit(); } },
  mastino:{ nm:'MASTINO', img:'e_mastino', h:36, r:11, hp:2, spd:150, col:'#ff3d8b', tip:'caccia in branco · si ferma un attimo prima di saltare',
    init:function(e){ e.cd=0.8+RS()*0.8; e.lato=RS()<0.5?-1:1; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(e.st===0){ var giro = d<120 ? 1 : 0.3; e.x+=(ux*(1-giro)+(-uy)*e.lato*giro)*e.spd*dt; e.y+=(uy*(1-giro)+(ux)*e.lato*giro)*e.spd*dt; e.cd-=dt; if(e.cd<=0 && d<170){ e.st=1; e.t=0.3; e.tele=0.3; } }
      else if(e.st===1){ e.t-=dt; e.tele=e.t; if(e.t<=0){ e.st=2; e.t=0.28; e.vx=ux*430; e.vy=uy*430; C.sfx('scatto'); } }
      else { e.t-=dt; e.x+=e.vx*dt; e.y+=e.vy*dt; if(e.t<=0){ e.st=0; e.cd=1.1+RS()*0.6; } }
      if(d<e.r+C.PLR) C.hit(); } },
  prete:{ nm:'PRETE DEL BANCO', img:'e_prete', h:56, r:12, hp:5, spd:50, col:'#e8b44a', tip:'benedice gli altri: finché vive, sono intoccabili',
    init:function(e){ e.cd=1.2; e.leg=[]; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(d<220){ e.x-=ux*e.spd*dt; e.y-=uy*e.spd*dt; } else { e.x+=(-uy)*e.spd*0.5*dt; e.y+=(ux)*e.spd*0.5*dt; }
      e.cd-=dt; if(e.cd<=0){ e.cd=3.2; e.leg=[]; var EN=C.EN, n=0; for(var k=0;k<EN.length&&n<3;k++){ var o=EN[k]; if(o.on&&o!==e&&o.kind!=='prete'&&!ND[o.kind].mini&&DM.hypot(o.x-e.x,o.y-e.y)<230){ o.scudo=3.0; e.leg.push(o); n++; } } if(n) C.sfx('potere'); } },
    onDeath:function(e,C){ (e.leg||[]).forEach(function(o){ o.scudo=0; }); } },
  /* la banda di Lena, se l'hai venduta */
  lena:{ nm:'LENA', img:'e_lena', h:58, r:13, hp:14, spd:92, col:'#e0457b', tip:'lancia carte a ventaglio · scatta',
    init:function(e){ e.cd=1.2; },
    ai:function(e,dt,C){ var P=C.P,dx=P.x-e.x,dy=P.y-e.y,d=DM.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      if(e.st===0){ var want=150, mv=d<want-20?-1:(d>want+20?1:0); e.x+=ux*e.spd*dt*mv+(-uy)*e.spd*0.6*dt; e.y+=uy*e.spd*dt*mv+(ux)*e.spd*0.6*dt;
        e.cd-=dt; if(e.cd<=0){ e.st=1; e.t=0.45; e.tele=0.45; } }
      else if(e.st===1){ e.t-=dt; e.tele=e.t; if(e.t<=0){ var a0=DM.atan2(dy,dx); for(var j=-2;j<=2;j++) C.eb(e.x,e.y-12,a0+j*0.2,C.esp(170),6); C.sfx('carta');
          e.st=2; e.t=0.2; e.vx=(-uy)*420*(RS()<0.5?1:-1); e.vy=(ux)*420; } }
      else { e.t-=dt; e.x+=e.vx*dt; e.y+=e.vy*dt; if(e.t<=0){ e.st=0; e.cd=1.0+RS()*0.5; } }
      if(d<e.r+C.PLR) C.hit(); } }
};

/* ── i piani di stanza: ondate. I primi due di ogni zona insegnano, poi il mazzo
   si mescola. Un nemico nuovo arriva sempre da solo o con amici già noti. ── */
/* LA CURVA DI DIFFICOLTÀ: i primi piani insegnano, poi il Palazzo morde sempre di più.
   (è la curva di sopravvivenza che fa il margine della casa: tarata col banco dei piloti) */
/* 25/09 (produzione): PV dal piano 3 in giu' x0,85 — tarato col banco dei piloti sul motore vero (medio 92%, fortissimo 101%) */
var DIFF = { pv:[0.65,0.75,0.7225,1.19,1.615,2.04,2.72,3.40,4.08],
             folla:[0,0,0.05,0.20,0.35,0.50,0.65,0.80,0.95],
             colpi:[0.74,0.78,0.80,0.95,1.03,1.10,1.18,1.25,1.32],
             vel:[1,1,1.02,1.08,1.13,1.18,1.23,1.28,1.33] };
/* le manopole del BANCO (solo per tarare: la rigiocata del server non le legge mai, quindi nella
   pagina non cambiano niente per i soldi — una pagina che le usasse verrebbe smentita dal server) */
(function(){ var m = QS.match(/dpv=([\d.]+)/), m2 = QS.match(/dfo=([\d.]+)/), m3 = QS.match(/dco=([\d.]+)/);
  if(m){ var k = +m[1]; DIFF.pv = DIFF.pv.map(function(v, i){ return i >= 2 ? v*k : v; }); }
  if(m2){ var k2 = +m2[1]; DIFF.folla = DIFF.folla.map(function(v){ return v*k2; }); }
  if(m3){ var k3 = +m3[1]; DIFF.colpi = DIFF.colpi.map(function(v, i){ return i >= 2 ? 1 + (v-1)*k3 : v; }); } })();
var ONDATE = [
  /* zona 0 — I SALONI: si impara uno alla volta, poi due insieme */
  [ [[['scagnozzo',3]],[['scagnozzo',2],['fiche',4]]],
    [[['fiche',6]],[['scagnozzo',2],['pistolero',2]],[['fiche',4],['pistolero',1]]],
    [[['mastino',3]],[['pistolero',2],['fiche',4]],[['scagnozzo',3],['mastino',2]]],
    [[['lama',2],['scagnozzo',2]],[['lama',3],['fiche',4]],[['borseggiatore',1],['scagnozzo',2]]],
    [[['dado',2],['fiche',3]],[['pistolero',2],['dado',1]],[['fiche',6],['mastino',1]]],
    [[['slot',1],['scagnozzo',3]],[['borseggiatore',2],['fiche',4]],[['slot',1],['mastino',3]]],
    [[['dinamite',2],['fiche',4]],[['scagnozzo',3],['dinamite',2]],[['borseggiatore',1],['pistolero',2]]] ],
  /* zona 1 — LE CUCINE: arrivano il toro, il minatore, il prete */
  [ [[['toro',1],['scagnozzo',2]],[['dinamite',3],['mastino',2]],[['toro',1],['pistolero',2]]],
    [[['minatore',1],['scagnozzo',3]],[['minatore',2],['fiche',4]],[['cecchino',1],['lama',3]]],
    [[['prete',1],['scagnozzo',3]],[['prete',1],['pistolero',2],['fiche',3]],[['serpente',2],['mastino',2]]],
    [[['cecchino',1],['corazzato',1],['scagnozzo',2]],[['corazzato',2],['fiche',4]],[['toro',1],['borseggiatore',1],['fiche',3]]],
    [[['serpente',2],['fiche',4]],[['mazziere',1],['scagnozzo',3]],[['minatore',1],['lama',3]]],
    [[['buttafuori',1],['lama',2]],[['prete',1],['buttafuori',1],['fiche',3]],[['mastino',4],['pistolero',1]]],
    [[['fantasma',2],['pistolero',2]],[['dado',3],['toro',1]],[['slot',2],['serpente',1],['borseggiatore',1]]] ],
  /* zona 2 — IL CAVEAU: tutto insieme, e la roulette */
  [ [[['roulette',2],['scagnozzo',2]],[['fantasma',3],['fiche',4]],[['buttafuori',1],['prete',1],['pistolero',2]]],
    [[['toro',2],['mastino',2]],[['minatore',2],['cecchino',1]],[['roulette',1],['serpente',2],['fiche',3]]],
    [[['prete',1],['corazzato',2],['cecchino',1]],[['lama',4],['borseggiatore',1]],[['mazziere',1],['toro',1],['fiche',3]]],
    [[['slot',2],['corazzato',1],['pistolero',2]],[['roulette',2],['mastino',3]],[['buttafuori',2],['prete',1]]],
    [[['fantasma',3],['pistolero',2]],[['dado',3],['serpente',2]],[['minatore',2],['toro',1],['mastino',2]]],
    [[['mazziere',2],['scagnozzo',2]],[['cecchino',2],['lama',3],['borseggiatore',1]],[['roulette',2],['buttafuori',1],['prete',1]]] ]
];

/* ══════════════════════════════════════════════════════════════════════════
   c_combattimento.js — IL CUORE. Twin-stick alla Isaac, MIRA LIBERA.
   Il motore viene da CUORE.html (e quindi da grCombatArena di produzione):
   pool di proiettili, hit-stop, scossa trauma², lampi, preavvisi. La pelle è
   nuova: figure illustrate, contorno di leggibilità, spezzettamento alla morte.
   Il combattimento paga in CHIAVI, CUORI, POTERI e PORTE. Mai in denaro.
   ══════════════════════════════════════════════════════════════════════════ */
var P = { x:K.RW/2, y:K.RH/2, hp:6, hpMax:6, iframe:0, fireCd:0, dashT:0, dashIf:0, dashCd:0, dvx:0, dvy:0,
          face:-Math.PI/2, dir:1, dead:false, walk:0, muz:0, aimX:0, aimY:-1, occhi:'', occhiT:0, blinkT:3 };
var Wp = null;
function armaBase(){ return { rate:1, mult:1, spread:0.13, pen:0, bnc:0, hom:0, exp:0, dmg:1, spd:1, size:1, orbit:0, life:1, back:0, chain:0, freddo:0 }; }
var POTERI = [
  { id:'raffica',  nm:'RAFFICA',       img:'i_raffica',  de:'spari il 35% più spesso',        ap:function(W){ W.rate*=1.35; } },
  { id:'tripletta',nm:'TRIPLETTA',     img:'i_tripletta',de:'+2 colpi a ventaglio',           ap:function(W){ W.mult+=2; } },
  { id:'sponda',   nm:'SPONDA',        img:'i_sponda',   de:'i colpi rimbalzano sui muri',     ap:function(W){ W.bnc+=2; } },
  { id:'segugio',  nm:'SEGUGIO',       img:'i_segugio',  de:'i colpi fiutano il bersaglio',    ap:function(W){ W.hom+=1; } },
  { id:'perfora',  nm:'CHIODO',        img:'i_perfora',  de:'i colpi passano attraverso',      ap:function(W){ W.pen+=1; } },
  { id:'scoppio',  nm:'SCOPPIO',       img:'i_scoppio',  de:'i colpi esplodono',               ap:function(W){ W.exp+=1; } },
  { id:'piombo',   nm:'PIOMBO',        img:'i_piombo',   de:'colpi grossi, il doppio del danno', ap:function(W){ W.dmg+=0.9; W.size+=0.5; W.rate*=0.85; } },
  { id:'scorta',   nm:'SCORTA',        img:'i_scorta',   de:'due lune d\'ottone ti girano attorno', ap:function(W){ W.orbit+=2; } },
  { id:'calibro',  nm:'CALIBRO LUNGO', img:'i_calibro',  de:'colpi più veloci e più lontani',  ap:function(W){ W.spd+=0.3; W.life+=0.45; W.dmg+=0.2; } },
  { id:'specchio', nm:'SPECCHIO',      img:'i_specchio', de:'spari anche alle tue spalle',      ap:function(W){ W.back+=1; } },
  { id:'catena',   nm:'CATENA D\'ORO', img:'i_catena',   de:'il colpo salta a un altro nemico', ap:function(W){ W.chain+=1; } },
  { id:'freddo',   nm:'SANGUE FREDDO', img:'i_freddo',   de:'a cuori pieni fai +60% di danno',  ap:function(W){ W.freddo+=0.6; } }
];
var PBI = {}; POTERI.forEach(function(p){ PBI[p.id] = p; });

var EN = [], PB = [], EB = [], PA = [], FR = [], pai = 0, fri = 0;
for(var _i=0;_i<26;_i++) EN.push({on:0});
for(_i=0;_i<140;_i++) PB.push({on:0});
for(_i=0;_i<170;_i++) EB.push({on:0});
for(_i=0;_i<240;_i++) PA.push({on:0});
for(_i=0;_i<90;_i++) FR.push({on:0});
var boss = null, ROOM = null, PICK = [], PROPS = [], COMP = null;
/* le liste degli accesi (in ordine di indice): sporche quando qualcuno si accende */
var LEN = [], LEB = [], LPB = [], SPEN = true, SPEB = true, SPPB = true;
function listaEN(){ if(SPEN){ LEN.length = 0; for(var i=0;i<EN.length;i++) if(EN[i].on) LEN.push(EN[i]); SPEN = false; } return LEN; }
function listaEB(){ if(SPEB){ LEB.length = 0; for(var i=0;i<EB.length;i++) if(EB[i].on) LEB.push(EB[i]); SPEB = false; } return LEB; }
function listaPB(){ if(SPPB){ LPB.length = 0; for(var i=0;i<PB.length;i++) if(PB[i].on) LPB.push(PB[i]); SPPB = false; } return LPB; }
var fase = 'porta';           // 'combat' | 'porta' | 'transito' | 'pausa' | 'morte'
var ondata = 0, piano_ = null, roomT = 0, waveGap = 0;
var hitStop = 0, trauma = 0, shDx = 0, shDy = 0, lampo = 0, lampoCol = '#fff', slowmo = 0;
var DEC = document.createElement('canvas'); DEC.width = K.RW*2; DEC.height = K.RH*2; var DG = DEC.getContext('2d'); DG.setTransform(2,0,0,2,0,0);
var CTX = null;

function sfx(n,a){ if(VIS) suono.fx(n,a); }
function kick(m, dx, dy){ trauma = Math.min(1, trauma + m); var d = DM.hypot(dx||0, dy||0); if(d>0.001){ shDx = dx/d; shDy = dy/d; } }
function esp(base){ var pn = STATO ? STATO.piano : 1; return Math.max(30, Math.min(K.EB_MAX, base*DIFF.colpi[pn-1])); }
function part(x,y,vx,vy,life,col,r,add){ if(!VIS) return; var p = PA[pai]; pai = (pai+1)%PA.length; p.on=1; p.x=x; p.y=y; p.vx=vx; p.vy=vy; p.life=life; p.max=life; p.col=col; p.r=r||3; p.drg=add?0.9:0.92; p.add=add?1:0; p.ink=!add; }
function burst(x,y,n,col){ if(!VIS) return; if(LITE) n = (n+1)>>1; for(var k=0;k<n;k++){ var a=RV()*6.283, s=40+RV()*190; part(x,y,DM.cos(a)*s,DM.sin(a)*s,0.25+RV()*0.35,col,2+RV()*2.6); } }
function scintille(x,y,n,col,v){ if(!VIS) return; if(LITE) n = (n+1)>>1; for(var k=0;k<n;k++){ var a=RV()*6.283, s=(v||200)*(0.4+RV()*0.8); part(x,y,DM.cos(a)*s,DM.sin(a)*s,0.15+RV()*0.15,col||'#fff6c8',1.6+RV(),1); } }
function eb(x,y,ang,spd,r,big,moneta){ spd = Math.max(20, Math.min(K.EB_MAX, spd));
  for(var k=0;k<EB.length;k++){ var b = EB[k]; if(b.on) continue; b.on=1; SPEB = true; b.x=x; b.y=y; b.vx=DM.cos(ang)*spd; b.vy=DM.sin(ang)*spd; b.r=r||6; b.big=big?1:0; b.mon=moneta?1:0; b.life=7; b.t=0; return b; } return null; }
function anello(x,y,n,spd,off){ for(var j=0;j<n;j++) eb(x,y,(off||0)+j/n*6.283,esp(spd),6); }
function vivi(){ var n=0; for(var k=0;k<EN.length;k++) if(EN[k].on) n++; return n; }
function macchia(x,y,r,col,a){ if(!VIS) return; DG.globalAlpha = a==null?0.5:a; DG.fillStyle = col; DG.beginPath(); DG.arc(x,y,r,0,6.283); DG.fill(); DG.globalAlpha = 1; }
function schizzo(x,y,col,n){ if(!VIS) return; for(var q=0;q<(n||8);q++){ var a=RV()*6.283, d=RV()*18; macchia(x+DM.cos(a)*d, y+DM.sin(a)*d*0.6, 2+RV()*5, col, 0.3); }
  macchia(x,y+3,9,'#000',0.18); }
function costruisciCtx(){
  CTX = { P:P, EN:EN, eb:eb, esp:esp, hit:colpito, spawn:spawn, alive:vivi, burst:burst, part:part, PLR:K.PL_R, anello:anello,
          sfx:sfx, shake:function(m){ kick(m*0.05); }, fx0:fx0, fx1:fx1, fy0:fy0, fy1:fy1 };
}

/* ── i nemici ── */
var CAMPI_EN = ['_invuln','_nh','_scudoGiu','aimA','bloccati','bottino','cd','chiamato','dir','face','flash','fuga','fuse','giu','hp','hpMax','kind','knx','kny','lato','leg','nato','on','ph','r','scudo','seme','spd','spin','st','stun','t','target','tele','vis','vx','vy','x','y'];
function spawn(kind, x, y, quiet){
  var d = ND[kind]; if(!d) return null;
  var e = null; for(var k=0;k<EN.length;k++) if(!EN[k].on){ e = EN[k]; break; } if(!e) return null;
  for(var pk in e) if(e.hasOwnProperty(pk)) e[pk] = undefined;
  if(!e._forma){ for(var q0=0;q0<CAMPI_EN.length;q0++) e[CAMPI_EN[q0]] = undefined; e._forma = 1; }
  var pn = STATO ? STATO.piano : 1;
  e.on=1; SPEN = true; e.kind=kind; e.x=clamp(x,fx0+d.r,fx1-d.r); e.y=clamp(y,fy0+d.r,fy1-d.r); e.r=d.r;
  e.hp = e.hpMax = Math.max(1, Math.round(d.hp*(d.mini?1:1.45)*DIFF.pv[pn-1]));
  e.spd = d.spd*DIFF.vel[pn-1]; e.st=0; e.t=0; e.vx=0; e.vy=0; e.cd=0; e.tele=0; e.flash=0; e.nato=0; e.dir=1; e.seme=RS()*6.283;
  if(d.init) d.init(e, CTX);
  if(!quiet){ for(var q=0;q<8;q++){ var a=RV()*6.283; part(e.x,e.y+e.r*0.6,DM.cos(a)*90,DM.sin(a)*40,0.35,'#000',3); } }
  return e;
}
function spawnOndata(W){
  var pn2 = STATO ? STATO.piano : 1;
  for(var i=0;i<W.length;i++){ var kind=W[i][0], n=W[i][1], d=ND[kind]; var ex = n*DIFF.folla[pn2-1]; n += Math.floor(ex) + (RS()<ex%1?1:0);
    for(var j=0;j<n;j++){ var x,y,tries=0;
      do{ if(d.spawnAt==='anchor'){ var an=(RS()*4)|0;
            x=(an===1)?fx1-50:((an===3)?fx0+50:fx0+50+RS()*(fx1-fx0-100));
            y=(an===0)?fy0+50:((an===2)?fy1-50:fy0+50+RS()*(fy1-fy0-100)); }
          else { x=fx0+34+RS()*(fx1-fx0-68); y=fy0+34+RS()*(fy1-fy0-68); }
          tries++; } while(DM.hypot(x-P.x,y-P.y)<130 && tries<40);
      spawn(kind,x,y); } }
}
function muoreNemico(e){
  var d = ND[e.kind]; e.on = 0;
  var spr = cuoci(d.img, d.h, 1.6, '#000');
  if(spr) spezza(spr, e.x, e.y - d.h*0.42, e.dir, d.h>50?6:4, 1);
  burst(e.x, e.y, e.r>14?16:10, d.col); scintille(e.x, e.y, 6);
  schizzo(e.x, e.y+e.r*0.5, d.col, e.r>14?10:7);
  hitStop = Math.max(hitStop, 0.05); kick(e.r>14?0.3:0.14, e.x-P.x, e.y-P.y);
  sfx('uccidi', e.r>14?1:0.6);
  if(d.onDeath){ try{ d.onDeath(e, CTX); }catch(_e){} }
  STATO.uccisi++;
  if(!d.mini && RS() < ECON.NEMICO_P*(STATO.flag.patto?1.3:1)) lasciaSoldi(STATO.R.posta*ECON.NEMICO_V*crescita()*(e.r>14?2:1), e.x, e.y, 1);
}
function spezza(spr, x, y, dir, n, forza){
  if(!spr) return;   /* senza immagini (sul server) non c'è niente da spezzare: è solo spettacolo */
  var fr = spr._fr || (spr._fr = frammenti(spr, n));
  for(var i=0;i<fr.length;i++){ var f = FR[fri]; fri=(fri+1)%FR.length; var o = fr[i];
    f.on=1; f.c=o.c; f.x=x+o.ox*dir; f.y=y+o.oy; f.dir=dir; var a = DM.atan2(o.oy, o.ox*dir) + (RV()-0.5)*0.8, s = (140+RV()*160)*(forza||1);
    f.vx=DM.cos(a)*s; f.vy=DM.sin(a)*s-60; f.vr=(RV()-0.5)*14; f.rot=0; f.gy=y+spr.h*0.45+RV()*10; f.life=0.7+RV()*0.35; f.max=f.life; f.w=o.c.width/2; f.h=o.c.height/2; }
}
function aggNemici(dt){
  var k,m,e,d;
  for(k=0;k<EN.length;k++){ e=EN[k]; if(!e.on) continue; d=ND[e.kind];
    e.nato += dt; if(e.flash>0) e.flash-=dt; if(e.scudo>0) e.scudo-=dt;
    if(e.nato < 0.35) continue;                                   // la comparsa: non colpisce mentre sale dal pavimento
    var ox = e.x; try{ d.ai(e, dt, CTX); }catch(_a){}
    if(!e.on) continue;
    if(Math.abs(e.x-ox)>0.05) e.dir = (e.x>ox)?1:-1; if(e.kind==='pistolero'||e.kind==='cecchino'||e.kind==='slot') e.dir = P.x>e.x?1:-1;
    if(e.x<fx0+e.r){ e.x=fx0+e.r; if(e.vx<0) e.vx=-e.vx*0.4; } if(e.x>fx1-e.r){ e.x=fx1-e.r; if(e.vx>0) e.vx=-e.vx*0.4; }
    if(e.y<fy0+e.r){ e.y=fy0+e.r; if(e.vy<0) e.vy=-e.vy*0.4; } if(e.y>fy1-e.r){ e.y=fy1-e.r; if(e.vy>0) e.vy=-e.vy*0.4; }
    if(e.bloccati) collProps(e); }
  /* IL RICHIAMO: dopo 16 s gli ultimi due si fanno sotto. Una stanza non si trascina mai. */
  var n = vivi(), chiama = (fase==='combat' && n>0 && ((roomT>16 && n<=2) || roomT>30));
  for(k=0;k<EN.length;k++){ e=EN[k]; if(!e.on) continue;
    if(chiama){ var cdx=P.x-e.x, cdy=P.y-e.y, cd=DM.hypot(cdx,cdy)||1, pull=Math.min(90, 26+(roomT-16)*8); e.x+=cdx/cd*pull*dt; e.y+=cdy/cd*pull*dt; e.chiamato=1; } else e.chiamato=0; }
  var LE = listaEN(), nL = LE.length;
  for(k=0;k<nL;k++){ var a=LE[k]; if(!a.on) continue;
    for(m=k+1;m<nL;m++){ var b=LE[m]; if(!b.on) continue;
      var dx=b.x-a.x, dy=b.y-a.y, d2=dx*dx+dy*dy, mn=(a.r+b.r)*0.85;
      if(d2>0.01 && d2<mn*mn){ var dd=Math.sqrt(d2), push=(mn-dd)*0.5/dd; if(b.spd!==0){ b.x+=dx*push; b.y+=dy*push; } if(a.spd!==0){ a.x-=dx*push; a.y-=dy*push; } } } }
}

/* ── il giocatore ── */
function colpito(forte){
  if(P.dead || P.iframe>0 || P.dashIf>0 || fase!=='combat') return;
  if(MODE.bench || MODE.dio) return;
  if(P.scudo>0){ P.scudo--; P.iframe = K.IFRAME; scintille(P.x,P.y-14,12,'#ffe27a',260); sfx('tic'); kick(0.2); popTesto('SCUDO', P.x, P.y-20); return; }
  P.hp -= forte?2:1; STATO.colpi++;
  var src=null, sd=1e9; for(var k=0;k<EN.length;k++){ var e=EN[k]; if(!e.on) continue; var dd=DM.hypot(e.x-P.x,e.y-P.y); if(dd<sd){ sd=dd; src=e; } }
  if(src && sd<70){ var a=DM.atan2(P.y-src.y,P.x-src.x); P.x+=DM.cos(a)*16; P.y+=DM.sin(a)*16; src.x-=DM.cos(a)*30; src.y-=DM.sin(a)*30; src.st=0; src.t=0; src.cd=Math.max(src.cd||0,0.7); src.vx=0; src.vy=0; src.tele=0; }
  P.iframe = K.IFRAME; kick(0.5,0,0); lampo = 0.7; lampoCol = '#b8202e'; hitStop = Math.max(hitStop,0.06);
  burst(P.x,P.y,14,'#ff5a5f'); sfx('ahi'); P.occhi='x'; P.occhiT=0.8;
  hud.cuori(true);
  if(P.hp<=0){ if(P.vita2){ P.vita2 = 0; P.hp = 4; P.iframe = 2.2; lampo = 1; lampoCol = '#fff6c8'; slowmo = 0.8; sfx('potere'); popFuoriScala('i_ingranaggio','TI RIALZI'); banner('SECONDA VITA', 'l\'ingranaggio gira ancora', 1.6); for(var k2=0;k2<EB.length;k2++) EB[k2].on=0; hud.cuori(); } else morte(); }
}
function morte(){ if(P.dead) return; P.dead=true; STATO.morteT=1.4; kick(0.9,0,0); lampo=1; lampoCol='#b8202e'; hitStop=0.25; slowmo=1.2;
  var spr = cuoci('m_bot', 50, 1.6, '#000'); if(spr) spezza(spr, P.x, P.y-22, P.dir, 6, 1.2);
  burst(P.x,P.y,30,'#e8b44a'); sfx('boom',1.2); }
function aggGiocatore(dt){
  if(P.iframe>0) P.iframe-=dt; if(P.dashIf>0) P.dashIf-=dt; if(P.dashCd>0) P.dashCd-=dt; if(P.fireCd>0) P.fireCd-=dt; if(P.muz>0) P.muz-=dt;
  if(P.occhiT>0){ P.occhiT-=dt; if(P.occhiT<=0) P.occhi=''; } if(P.inchino>0) P.inchino-=dt;
  P.blinkT -= dt; if(P.blinkT < -0.12) P.blinkT = 2.2 + RV()*2.5;
  if(P.dead) return;
  if(IN.dash){ IN.dash=false; scatta(); }
  var mv = DM.hypot(IN.mvx, IN.mvy); if(mv>1){ IN.mvx/=mv; IN.mvy/=mv; mv=1; }
  P.walk += Math.min(1,mv)*dt*12;
  if(P.dashT>0){ P.dashT-=dt; P.x+=P.dvx*dt; P.y+=P.dvy*dt; if(RV()<0.7) part(P.x,P.y+10,0,0,0.25,'#e8b44a',3,1); }
  else { P.x+=IN.mvx*K.PL_SPD*dt; P.y+=IN.mvy*K.PL_SPD*dt; }
  if(IN.aon){ var am=DM.hypot(IN.ax,IN.ay); if(am>0.05){ P.aimX=IN.ax/am; P.aimY=IN.ay/am; P.face=DM.atan2(IN.ay,IN.ax); } }
  else if(mv>0.1){ P.aimX=IN.mvx/mv; P.aimY=IN.mvy/mv; }
  if(Math.abs(P.aimX)>0.2) P.dir = P.aimX>0?1:-1; else if(Math.abs(IN.mvx)>0.2) P.dir = IN.mvx>0?1:-1;
  if(IN.aon && DM.hypot(IN.ax,IN.ay)>0.25 && P.fireCd<=0 && fase!=='transito') spara(DM.atan2(IN.ay,IN.ax));
}
function scatta(){
  if(P.dead || P.dashCd>0 || P.dashT>0) return;
  var mv = DM.hypot(IN.mvx, IN.mvy), a = mv>0.1 ? DM.atan2(IN.mvy,IN.mvx) : DM.atan2(P.aimY,P.aimX);
  P.dvx=DM.cos(a)*K.DASH_DIST/K.DASH_DUR; P.dvy=DM.sin(a)*K.DASH_DIST/K.DASH_DUR;
  P.dashT=K.DASH_DUR; P.dashIf=K.DASH_IFRAME; P.dashCd=K.DASH_CD; kick(0.06); sfx('scatto');
}
/* MIRA LIBERA: il colpo parte esattamente dove punti. Nessun aggancio. */
function unColpo(ang){
  for(var k=0;k<PB.length;k++){ var b=PB[k]; if(b.on) continue;
    var sp = K.B_SPD*Wp.spd; b.on=1; SPPB = true; b.orb=0; b.carta=0; b.x=P.x+DM.cos(ang)*14; b.y=P.y-14+DM.sin(ang)*10; b.px=b.x; b.py=b.y;
    b.vx=DM.cos(ang)*sp; b.vy=DM.sin(ang)*sp; b.r=K.B_R*Wp.size; b.life=K.B_LIFE*Wp.life; b.dmg=K.B_DMG*Wp.dmg*((Wp.freddo&&P.hp>=P.hpMax)?1+Wp.freddo:1);
    b.pen=Wp.pen; b.bnc=Wp.bnc; b.hom=Wp.hom; b.exp=Wp.exp; b.chain=Wp.chain; b.hcd=0; b.hit=null; b.t=0; return b; }
  return null;
}
function spara(ang){
  var n = Math.max(1, Wp.mult|0);
  for(var q=0;q<n;q++){ var off = n===1 ? 0 : (q-(n-1)/2)*Wp.spread; unColpo(ang+off); }
  if(Wp.back) for(q=0;q<Wp.back;q++) unColpo(ang+Math.PI+(Wp.back>1?(q-0.5)*0.2:0));
  P.muz=0.06; P.fireCd = 1/(K.FIRE_RATE*Wp.rate);
  kick(0.018, -DM.cos(ang), -DM.sin(ang)); sfx('sparo'); STATO.spari++;
}
function rifaiOrbita(){
  var k; for(k=0;k<PB.length;k++) if(PB[k].on && PB[k].orb) PB[k].on=0;
  for(k=0;k<Wp.orbit;k++) for(var m=0;m<PB.length;m++){ var b=PB[m]; if(b.on) continue;
    b.on=1; SPPB = true; b.orb=1; b.oa=k/Math.max(1,Wp.orbit)*6.283; b.od=34; b.r=7; b.dmg=1.2*Wp.dmg; b.life=1e9; b.pen=99; b.bnc=0; b.hom=0; b.exp=0; b.chain=0; b.hcd=0; b.x=P.x; b.y=P.y; b.vx=0; b.vy=0; break; }
}
function piuVicino(x,y,esclusi){
  var best=null, bd=1e9;
  for(var k=0;k<EN.length;k++){ var e=EN[k]; if(!e.on || e._invuln || (esclusi&&esclusi.indexOf(e)>=0)) continue; var d=(e.x-x)*(e.x-x)+(e.y-y)*(e.y-y); if(d<bd){ bd=d; best=e; } }
  if(boss && bossAttivo() && !(esclusi&&esclusi.indexOf(boss)>=0)){ var db=(boss.x-x)*(boss.x-x)+(boss.y-y)*(boss.y-y); if(db<bd){ bd=db; best=boss; } }
  return best;
}
function esplodi(x,y,pw){
  var rad = 40+14*pw; burst(x,y,14,'#ff9a3b'); scintille(x,y,10,'#ffd27a',260); kick(0.16); sfx('boom',0.5);
  macchia(x,y,rad*0.4,'#140806',0.35);
  for(var k=0;k<EN.length;k++){ var e=EN[k]; if(!e.on || e._invuln) continue; if(DM.hypot(e.x-x,e.y-y)<rad+e.r){ e.hp-=1.2*pw; e.flash=0.1; if(e.hp<=0) muoreNemico(e); } }
  if(boss && DM.hypot(boss.x-x,boss.y-boss.dy-y)<rad+boss.r) feriscBoss(1.2*pw, x, y);
  if(boss && boss.carte) colpisciCarta(x, y);
  controllaCrepa(x,y,rad);
}
function ferisci(e,b){
  if(e._invuln || e.scudo>0){ scintille(b.x,b.y,3,e.scudo>0?'#ffe27a':'#ff9ad0'); if(e.scudo>0) sfx('tic'); return false; }
  e.hp-=b.dmg*(e.stun>0?2:1); e.flash=0.1; e.knx=(b.vx||0)*0.012; e.kny=(b.vy||0)*0.012;
  var a0 = DM.atan2(b.vy,b.vx)+Math.PI; for(var q=0;q<4;q++){ var a=a0+(RV()-0.5)*1.6; part(b.x,b.y,DM.cos(a)*180,DM.sin(a)*180,0.16,'#fff6c8',2,1); }
  sfx('colpo'); hitStop = Math.max(hitStop, 0.022);
  if(e.hp<=0){ muoreNemico(e); return true; }
  return false;
}
function catena(b, da){
  if(!b.chain) return; var es = [da], x=da.x, y=da.y;
  for(var c=0;c<b.chain;c++){ var t = piuVicino(x,y,es); if(!t || DM.hypot(t.x-x,t.y-y)>150) break;
    ARCHI.push({x0:x,y0:y,x1:t.x,y1:t.y-10,t:0.16}); es.push(t);
    if(t===boss) feriscBoss(b.dmg*0.6, t.x, t.y-t.dy); else { t.hp-=b.dmg*0.6; t.flash=0.1; if(t.hp<=0) muoreNemico(t); }
    x=t.x; y=t.y; }
}
var ARCHI = [];
function aggProiettili(dt){
  var k,b,e,m;
  var LP = listaPB(), nP = LP.length, LE2, LB2, j2;
  for(k=0;k<nP;k++){ b=LP[k]; if(!b.on || !b.orb) continue;
    b.oa+=dt*3.0; b.x=P.x+DM.cos(b.oa)*b.od; b.y=P.y-12+DM.sin(b.oa)*b.od*0.8;
    if(b.hcd>0){ b.hcd-=dt; continue; }
    LE2 = listaEN(); for(j2=0;j2<LE2.length;j2++){ e=LE2[j2]; if(!e.on) continue; if(vicini(e.x-b.x,e.y-b.y,e.r+b.r)){ ferisci(e,b); b.hcd=0.28; break; } }
    LB2 = listaEB(); for(j2=0;j2<LB2.length;j2++){ var q=LB2[j2]; if(q.on && vicini(q.x-b.x,q.y-b.y,q.r+b.r)){ q.on=0; scintille(q.x,q.y,3); } }
    if(boss && b.hcd<=0 && vicini(boss.x-b.x,boss.y-b.y,boss.r+b.r)){ feriscBoss(b.dmg); b.hcd=0.28; } }
  for(k=0;k<nP;k++){ b=LP[k]; if(!b.on || b.orb) continue;
    b.life-=dt; b.t+=dt; if(b.life<=0){ if(b.exp>0) esplodi(b.x,b.y,b.exp); else part(b.x,b.y,0,0,0.12,'#e8b44a',3,1); b.on=0; continue; }
    if(b.hom>0){ var tg = piuVicino(b.x,b.y); if(tg){ var want=DM.atan2(tg.y-10-b.y,tg.x-b.x), cur=DM.atan2(b.vy,b.vx), df=want-cur;
        while(df>Math.PI) df-=6.283; while(df<-Math.PI) df+=6.283; var na=cur+clamp(df/0.5,-1,1)*2.8*b.hom*dt, sp=DM.hypot(b.vx,b.vy); b.vx=DM.cos(na)*sp; b.vy=DM.sin(na)*sp; } }
    b.px=b.x; b.py=b.y; b.x+=b.vx*dt; b.y+=b.vy*dt;
    var rimb=false;
    if(b.x<fx0+b.r || b.x>fx1-b.r){ if(b.bnc>0){ b.bnc--; b.vx=-b.vx; b.x=clamp(b.x,fx0+b.r,fx1-b.r); rimb=true; scintille(b.x,b.y,3,'#f1e6cf'); }
      else { controllaCrepa(b.x,b.y,10); macchia(b.x,b.y,2.4,'#000',0.3); part(b.x,b.y,0,0,0.15,'#e8b44a',3,1); if(b.exp>0) esplodi(b.x,b.y,b.exp); b.on=0; continue; } }
    if(b.y<fy0+b.r || b.y>fy1-b.r){ if(b.bnc>0){ b.bnc--; b.vy=-b.vy; b.y=clamp(b.y,fy0+b.r,fy1-b.r); rimb=true; scintille(b.x,b.y,3,'#f1e6cf'); }
      else { controllaCrepa(b.x,b.y,10); macchia(b.x,b.y,2.4,'#000',0.3); part(b.x,b.y,0,0,0.15,'#e8b44a',3,1); if(b.exp>0) esplodi(b.x,b.y,b.exp); b.on=0; continue; } }
    if(rimb) continue;
    if(boss && boss.carte && colpisciCarta(b.x, b.y)){ b.on=0; continue; }
    if(propColpito(b)){ if(b.exp>0) esplodi(b.x,b.y,b.exp); b.on=0; continue; }
    LE2 = listaEN(); for(m=0;m<LE2.length;m++){ e=LE2[m]; if(!e.on || e===b.hit) continue;
      var ey = e.y - ND[e.kind].h*0.28;
      if(lontani(e.x-b.x, ey-b.y, e.r+b.r+4)) continue;
      if(ND[e.kind].shield && e.face!=null && !e._scudoGiu){ var ia=DM.atan2(b.y-e.y,b.x-e.x), dd=ia-e.face; while(dd>Math.PI) dd-=6.283; while(dd<-Math.PI) dd+=6.283;
        if(Math.abs(dd)<0.9){ scintille(b.x,b.y,5,'#e8b44a'); sfx('tic'); b.on=0; break; } }
      var morto = ferisci(e,b); catena(b,e);
      if(b.exp>0){ esplodi(b.x,b.y,b.exp); b.on=0; break; }
      if(b.pen>0){ b.pen--; b.hit=e; } else b.on=0;
      break; }
    if(!b.on) continue;
    if(boss && bossAttivo() && vicini(boss.x-b.x, boss.y-boss.dy-b.y, boss.r+b.r)){
      feriscBoss(b.dmg, b.x, b.y); catena(b,boss); var a2=DM.atan2(b.vy,b.vx)+Math.PI; for(var q2=0;q2<4;q2++) part(b.x,b.y,DM.cos(a2+(RV()-.5)*1.6)*170,DM.sin(a2+(RV()-.5)*1.6)*170,0.16,'#fff6c8',2,1);
      sfx('colpo'); hitStop=Math.max(hitStop,0.02);
      if(b.exp>0){ esplodi(b.x,b.y,b.exp); b.on=0; continue; } if(b.pen>0) b.pen--; else b.on=0; } }
  var LB = listaEB(), nB = LB.length, colonne = null;
  for(var pc0=0;pc0<PROPS.length;pc0++) if(PROPS[pc0].k==='colonna'){ (colonne = colonne||[]).push(PROPS[pc0]); }
  for(k=0;k<nB;k++){ b=LB[k]; if(!b.on) continue;
    b.life-=dt; b.t+=dt; if(b.life<=0){ b.on=0; continue; }
    b.x+=b.vx*dt; b.y+=b.vy*dt;
    if(b.x<fx0-6 || b.x>fx1+6 || b.y<fy0-6 || b.y>fy1+6){ macchia(clamp(b.x,fx0,fx1),clamp(b.y,fy0,fy1),2.6,'#3a0a10',0.25); b.on=0; continue; }
    var coperto = false; if(colonne) for(var pc=0;pc<colonne.length;pc++){ var cp = colonne[pc]; if(vicini(cp.x-b.x, cp.y-14-b.y, cp.r+b.r+2)){ coperto = true; break; } }
    if(coperto){ scintille(b.x,b.y,3,'#e8b44a'); b.on=0; continue; }
    if(!P.dead && vicini(P.x-b.x, P.y-10-b.y, K.PL_R+b.r-2)){ b.on=0; colpito(b.big); } }
  if(VIS) for(k=0;k<PA.length;k++){ var p=PA[k]; if(!p.on) continue; p.life-=dt; if(p.life<=0){ p.on=0; continue; } p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=p.drg; p.vy*=p.drg; }
  if(VIS) for(k=0;k<FR.length;k++){ var f=FR[k]; if(!f.on) continue; f.life-=dt; if(f.life<=0){ f.on=0; macchia(f.x,f.y,2+RV()*3,'#000',0.2); continue; }
    f.vy+=620*dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vx*=0.97; f.rot+=f.vr*dt; if(f.y>f.gy){ f.y=f.gy; f.vy*=-0.3; f.vx*=0.55; f.vr*=0.5; } f.x=clamp(f.x,fx0,fx1); }
  aggPioggia(dt);
  for(k=ARCHI.length-1;k>=0;k--){ ARCHI[k].t-=dt; if(ARCHI[k].t<=0) ARCHI.splice(k,1); }
}

/* ── la compagna: Lena lancia carte al nemico più vicino (è lei a mirare, non tu) ── */
function aggCompagna(dt){
  if(!STATO.flag.compagna){ COMP=null; return; }
  if(!COMP) COMP = { x:P.x-30, y:P.y, cd:1, t:0 };
  COMP.t+=dt; var tx = P.x - P.dir*30, ty = P.y - 36 + DM.sin(COMP.t*2.2)*5;
  COMP.x += (tx-COMP.x)*Math.min(1,dt*5); COMP.y += (ty-COMP.y)*Math.min(1,dt*5);
  if(fase!=='combat') return;
  COMP.cd-=dt; if(COMP.cd<=0){ var t = piuVicino(COMP.x,COMP.y); if(t){ COMP.cd=1.05;
      var a = DM.atan2(t.y-12-COMP.y, t.x-COMP.x), b = unColpo(a); if(b){ b.x=COMP.x; b.y=COMP.y; b.carta=1; b.dmg=1.4; b.hom=0.6; b.exp=0; b.pen=0; b.chain=0; b.bnc=0; b.vx=DM.cos(a)*360; b.vy=DM.sin(a)*360; b.life=1.2; }
      sfx('carta'); } else COMP.cd=0.3; }
}

/* ══ I BOSS ══ */
/* la morte lunga: prima trema e scoppietta (1,4 s al rallentatore), poi va in pezzi e piove oro */
/* la pioggia di fiche della morte del boss (solo spettacolo: i soldi veri sono quelli per terra) */

/* ══════════════════════════════════════════════════════════════════════════
   d_mondo.js — IL PIANO: mappa a stanze alla Isaac (albero senza anelli,
   boss nel vicolo più lontano, stanze speciali nei vicoli ciechi, segreta da
   dedurre), le stanze, le porte, gli oggetti, il disegno.
   La mappa usa il flusso di caso della PRESENTAZIONE, mai quello dei soldi.
   ══════════════════════════════════════════════════════════════════════════ */
var DIRS = [[0,-1],[1,0],[0,1],[-1,0]];
var MAPPA = null;
var ICONE = { boss:'☠', tavolo:'♠', dialogo:'✦', pozzo:'◍', negozio:'⚖', tesoro:'♛', segreta:'✧', start:'▲', combat:'' };
var NOMI_STANZA = { boss:'BOSS', tavolo:'IL TAVOLO', dialogo:'UN INCONTRO', pozzo:'IL POZZO', negozio:'IL MONTE DEI PEGNI', tesoro:'IL TESORO', segreta:'LA SEGRETA', start:'L\'ASCENSORE', combat:'' };

function generaPiano(n, rng){
  var cfg = STORIA.PIANI[n], combat = [0,2,2,3,3,3,3,3,3,2][n];
  var serve = ['tavolo','dialogo','tesoro']; if(n>=ECON.POZZO_DA && n<9) serve.push('pozzo');
  if(n===9) serve = ['tesoro'];
  if(cfg.negozio) serve.push('negozio');
  if(cfg.boss) serve.unshift('boss');
  var N = 1 + combat + serve.length, best = null;
  for(var tent=0; tent<300; tent++){
    var G = {}, list = [], kk = function(x,y){ return x+'_'+y; };
    var s0 = { x:4, y:4, t:'start' }; G[kk(4,4)] = s0; list.push(s0);
    var nb = function(x,y){ var c=0; for(var i=0;i<4;i++) if(G[kk(x+DIRS[i][0],y+DIRS[i][1])]) c++; return c; };
    var guard = 0;
    while(list.length<N && guard++<800){
      var from = list[(rng()*list.length)|0], ds = shuffle([0,1,2,3], rng);
      for(var q=0;q<4;q++){ var nx = from.x+DIRS[ds[q]][0], ny = from.y+DIRS[ds[q]][1];
        if(nx<0||ny<0||nx>8||ny>7||G[kk(nx,ny)]) continue; if(nb(nx,ny)>1) continue;
        if(from===s0 && nb(s0.x,s0.y)>=3) continue;
        var r = { x:nx, y:ny, t:'combat', p:from }; G[kk(nx,ny)] = r; list.push(r); break; } }
    if(list.length<N) continue;
    var dist = function(r){ var d=0; while(r.p){ d++; r=r.p; } return d; };
    var vicoli = list.filter(function(r){ return r!==s0 && nb(r.x,r.y)===1; }).sort(function(a,b){ return dist(b)-dist(a); });
    var bisogno = serve.length - (serve.indexOf('pozzo')>=0 ? 1 : 0);
    if(vicoli.length < bisogno) continue;
    var usa = vicoli.slice(), ok = true;
    serve.forEach(function(t){
      if(t==='pozzo'){ var vic = list.filter(function(r){ return r.t==='combat' && r.p===s0; }); var r0 = vic.length ? vic[0] : null;
        if(!r0){ r0 = usa.pop(); if(!r0){ ok=false; return; } usa.splice(usa.indexOf(r0),1); }
        else if(usa.indexOf(r0)>=0) usa.splice(usa.indexOf(r0),1);
        r0.t = 'pozzo'; return; }
      var r1 = (t==='boss') ? usa.shift() : (t==='tavolo' ? usa.shift() : usa.splice((rng()*usa.length)|0,1)[0]);
      if(!r1){ ok=false; return; } r1.t = t; });
    if(!ok) continue;
    if(list.filter(function(r){ return r.t==='combat'; }).length < 1) continue;
    /* la segreta: una casella vuota che tocca almeno due stanze (mai il boss) */
    var cand = [];
    for(var yy=0;yy<8;yy++) for(var xx=0;xx<9;xx++){ if(G[kk(xx,yy)]) continue; var c = 0, boss = false;
      for(var i=0;i<4;i++){ var o = G[kk(xx+DIRS[i][0],yy+DIRS[i][1])]; if(o){ c++; if(o.t==='boss') boss = true; } }
      if(c>=2 && !boss) cand.push({x:xx,y:yy,c:c}); }
    if(!cand.length) continue;
    cand.sort(function(a,b){ return b.c-a.c; });
    var sc = cand[(rng()*Math.min(3,cand.length))|0], seg = { x:sc.x, y:sc.y, t:'segreta', nascosta:true };
    G[kk(seg.x,seg.y)] = seg; list.push(seg);
    best = { G:G, list:list, kk:kk, start:s0, n:n }; break;
  }
  best.list.forEach(function(r){ r.vis=0; r.vista=0; r.cl = (r.t!=='combat' && r.t!=='boss'); r.fatto=0; r.scoperta=0;
    r.chiusa = (r.t==='tesoro' && n>1) ? 1 : 0; r.plan=null; r.crepa=0; });
  /* il mazzo delle ondate della zona */
  var z = Math.min(2, cfg.zona), deck = ONDATE[z].slice(2); shuffle(deck, rng);
  best.deck = (n===1||n===4||n===7) ? ONDATE[z].slice(0,2).concat(deck) : shuffle(ONDATE[z].slice(), rng);
  best.di = 0;
  return best;
}
function vicino(r, i){ return MAPPA.G[MAPPA.kk(r.x+DIRS[i][0], r.y+DIRS[i][1])] || null; }
function scopri(r){ if(!r.vis){ r.vis=1; r.scoperta=performance.now(); }
  r.vista = 1;
  for(var i=0;i<4;i++){ var o = vicino(r,i); if(o && !o.nascosta && !o.vista){ o.vista=1; o.scoperta=performance.now(); } } }
function rivela(cosa){
  MAPPA.list.forEach(function(r){ if(r.nascosta && cosa!=='segreta' && cosa!=='tutto') return; if(!r.vista){ r.vista=1; r.scoperta=performance.now()+RV()*400; } if(r.nascosta){ r.crepa=1; } });
}
function portaVisibile(i){ var o = vicino(ROOM,i); if(!o) return false; if(o.nascosta) return false; if(ROOM.nascosta) return true; return true; }

/* ── entrare in una stanza ── */
var TOCCA = null;
function entra(room, daDir){
  ROOM = room; room.entrata = daDir; scopri(room); if(STATO && !room.diario){ room.diario = 1; STATO.diario.push(STATO.piano+':'+room.t); }
  for(var k=0;k<EN.length;k++) EN[k].on=0; for(k=0;k<EB.length;k++) EB[k].on=0;
  for(k=0;k<PB.length;k++) if(!PB[k].orb) PB[k].on=0; for(k=0;k<FR.length;k++) FR[k].on=0;
  boss=null; PICK=room.pick || (room.pick=[]); PROPS=[]; ARCHI=[];
  DG.clearRect(0,0,K.RW,K.RH); if(room.dec) DG.drawImage(room.dec,0,0,K.RW,K.RH);
  roomT=0; waveGap=0; ondata=0; piano_=null; TOCCA=null;
  var cx=K.RW/2, cy=K.RH/2;
  if(daDir==null){ P.x=cx; P.y=cy+60; }
  else if(daDir===0){ P.x=cx; P.y=fy1-18; } else if(daDir===1){ P.x=fx0+18; P.y=cy; }
  else if(daDir===2){ P.x=cx; P.y=fy0+24; } else { P.x=fx1-18; P.y=cy; }
  P.dashT=0; rifaiOrbita();
  var t = room.t;
  if(t==='combat' && !room.cl){
    if(!room.plan){ room.plan = MAPPA.deck[MAPPA.di % MAPPA.deck.length].slice(); MAPPA.di++;
      if(STATO.flag.maledetto===STATO.piano) room.plan = room.plan.concat([[['fiche',3],['scagnozzo',1]]]); }
    avviaCombattimento(room.plan);
  }
  else if(t==='boss' && !room.cl){
    var tipo = STORIA.PIANI[STATO.piano].boss;
    fase='porta';
    var evb = tipo==='esattore' ? 'esattore_boss' : (tipo==='casa' ? 'casa_boss' : null);
    var via = function(){ fase='combat'; roomT=0; avviaBoss(tipo); };
    if(evb && !room.fatto){ room.fatto=1; DOPO(0.25, function(){ apriEvento(evb, function(){ if(STATO.pagaEsattore){ STATO.R.pot = 0; hud.tutto(); finisci('incasso'); return; } if(!STATO.saltaBoss && !STATO.finito) via(); else if(STATO.saltaBoss){ STATO.saltaBoss=0; room.cl=true; bossVinto(null, true); } }); }); }
    else via();
  }
  else { fase='porta'; suono.musica('calma'); }
  /* i PROPS: quello che sta nella stanza e con cui si parla urtandolo */
  if(t==='tavolo'){ PROPS.push({ k:'tavolo', img:'o_tavolo', x:cx, y:cy-40, w:128, r:44, fatto:room.fatto });
    if(room.fatto && STATO.piano<9 && !STORIA.PIANI[STATO.piano].boss) PROPS.push({ k:'botola', img:'o_botola', x:cx+100, y:fy1-80, w:50, r:22 }); }
  if(t==='pozzo') PROPS.push({ k:'pozzo', img:'o_pozzo', x:cx, y:cy-10, w:140, r:50, fatto:room.fatto });
  if(t==='dialogo'){ var ev = eventoPiano(); if(ev) PROPS.push({ k:'npc', ev:ev, chi:STORIA.EV[ev].chi, x:cx, y:cy-30, w:70, r:30, fatto:room.fatto }); }
  if(t==='tesoro'){ PROPS.push({ k:'piedistallo', img:'o_piedistallo', x:cx, y:cy, w:74, r:24, fatto:room.fatto, pw:room.pw||(room.pw=pescaPotere()) }); }
  if(t==='negozio') apriNegozio(room);
  if(t==='segreta') riempiSegreta(room);
  if(t==='start' && STATO.piano===1 && !room.fatto) PROPS.push({ k:'scritta', x:cx, y:cy-40, r:0 });
  if(t==='boss' && room.cl && room.pwBoss && !room.pwPreso) PROPS.push({ k:'piedistallo', img:'o_piedistallo', x:cx+40, y:cy+30, w:74, r:24, pw:room.pwBoss, bossPw:1 });
  if(t==='boss' && room.cl && STATO.botolaBoss) PROPS.push({ k:'botola', img:'o_botola', x:cx+100, y:fy1-80, w:50, r:22 });
  if(t==='start' && STATO.piano>1 && !room.fatto){ room.fatto=1; }
  hud.tutto(); disegnaMini();
  if(t!=='combat' && t!=='boss' && t!=='start' && !room.annunciata){ room.annunciata=1; banner(NOMI_STANZA[t]); }
}
function eventoPiano(){
  var ev = STORIA.PIANI[STATO.piano].ev;
  if(ev==='lena2' && STATO.rel.lena<0) ev = 'lena2_nemica';
  return ev;
}
function avviaCombattimento(plan){
  fase='combat'; if(!MODE.pilota && !SIM.rigioco) setTimeout(offriPassaggio, 500); piano_=plan; ondata=0; spawnOndata(plan[0]); suono.musica('combat'); sfx('chiusa');
  var nomi={}, ns=[]; plan[0].forEach(function(w){ nomi[w[0]]=1; }); for(var nk in nomi) ns.push(ND[nk].nm);
  banner(ns.join(' · '), '', 1.2);
}
function stanzaPulita(){
  if(!ROOM || ROOM.cl) return;
  ROOM.cl = true; STATO.tempi.push(+roomT.toFixed(1)); fase='porta';
  lampo=0.5; lampoCol='#e8b44a'; hitStop=Math.max(hitStop,0.1); kick(0.2); sfx('porta'); suono.musica('calma');
  banner('PORTE APERTE', roomT.toFixed(1)+' s', 1.0);
  /* il premio della stanza pulita (Isaac): chiave, cuore o niente. Mai soldi. */
  var r = RS(), cx = K.RW/2, cy = K.RH/2;
  if(STATO.chiavi===0 && !STATO.chiavePiano){ STATO.chiavePiano=1; lascia('chiave',cx,cy); }
  else if(P.hp<P.hpMax && r<0.5) lascia('cuore',cx,cy);
  else if(r<0.8) lascia('chiave',cx,cy);
  salvaDec(); hud.tutto();
}
function salvaDec(){ if(!ROOM || !VIS) return; if(!ROOM.dec){ ROOM.dec=document.createElement('canvas'); ROOM.dec.width=DEC.width; ROOM.dec.height=DEC.height; }
  var g=ROOM.dec.getContext('2d'); g.clearRect(0,0,DEC.width,DEC.height); g.drawImage(DEC,0,0); }
function lascia(k, x, y, extra){ var it = { k:k, x:x, y:y, t:0, vy:-160, z:0, on:1 }; if(extra) for(var e in extra) it[e]=extra[e]; PICK.push(it); return it; }
function pescaPotere(){
  var pool = POTERI.filter(function(p){ return STATO.poteri.filter(function(x){ return x===p.id; }).length < 2; });
  return (pool.length?pick(pool):POTERI[0]).id;
}
function prendiPotere(id){
  var d = PBI[id]; if(!d) return; STATO.poteri.push(id); d.ap(Wp); rifaiOrbita();
  lampo=0.5; lampoCol='#e8b44a'; kick(0.12); sfx('potere'); P.occhi='!'; P.occhiT=1.2;
  popFuoriScala(d.img, d.nm); banner(d.nm, d.de, 2.0); hud.tutto();
}
var PEGNI = { denteOro:{ nm:'DENTE D\'ORO', img:'i_dente', de:'al tavolo c\'è sempre la CASSAFORTE' },
              dentePiombo:{ nm:'DENTE DI PIOMBO', img:'i_gettone', de:'al tavolo c\'è sempre l\'INFERNO · +2 chiavi' },
              occhioVetro:{ nm:'OCCHIO DI VETRO', img:'i_segugio', de:'ogni piano nuovo si vede tutto' } };
function riempiSegreta(room){
  var n = STATO.piano;
  if(!room.dentro){ room.dentro = (n===2||n===5||n===8) ? 'ingranaggio' : (n===7 ? 'oracolo' : pick(['potere','soldi','soldi','cuori'])); }
  var cx=K.RW/2, cy=K.RH/2;
  if(room.fatto) return;
  if(room.dentro==='ingranaggio'){ lascia('ingranaggio',cx,cy-20); if(n===5) PROPS.push({ k:'npc', ev:'oracolo_ev', chi:'oracolo', x:cx, y:cy-80, w:70, r:30 }); }
  else if(room.dentro==='potere') PROPS.push({ k:'piedistallo', img:'o_piedistallo', x:cx, y:cy, w:74, r:24, pw:room.pw||(room.pw=pescaPotere()), gratis:1 });
  else if(room.dentro==='chiavi'){ lascia('chiave',cx-30,cy); lascia('chiave',cx+30,cy); lascia('chiave',cx,cy+30); }
  else if(room.dentro==='soldi'){ lasciaSoldi(STATO.R.posta*ECON.SEGRETA_V*crescita(), cx, cy, 8); }
  else if(room.dentro==='cuori'){ lascia('cuore',cx-24,cy); lascia('cuore',cx+24,cy); }
  room.fatto=1;
}

/* ── le porte: un varco per lato. Chiuse durante il combattimento. ── */
function portaInfo(i){
  var o = vicino(ROOM,i); if(!o) return null;
  if(o.nascosta && !o.aperta) return { segreta:1, o:o };
  if(ROOM.nascosta && !ROOM.aperta) return null;
  return { o:o, chiusa:(fase==='combat'), lucchetto:o.chiusa };
}
function controllaCrepa(x,y,rad){
  if(!ROOM) return;
  for(var i=0;i<4;i++){ var o = vicino(ROOM,i); if(!o || !o.nascosta || o.aperta) continue;
    var p = puntoPorta(i); if(DM.hypot(p.x-x, p.y-y) < 34+rad){ o.colpiCrepa = (o.colpiCrepa||0)+1; o.crepa=1;
      scintille(p.x,p.y,4,'#bdb09a'); kick(0.05);
      if(o.colpiCrepa>=4){ o.aperta=1; o.nascosta=false; o.vista=1; o.scoperta=performance.now(); burst(p.x,p.y,26,'#3a2410'); kick(0.4); sfx('boom',0.8);
        banner('UNA CREPA', 'la stanza segreta si apre', 1.6); STATO.segrete++; disegnaMini(); } } }
}
function puntoPorta(i){ var cx=K.RW/2, cy=K.RH/2; return i===0?{x:cx,y:fy0}:(i===1?{x:fx1,y:cy}:(i===2?{x:cx,y:fy1}:{x:fx0,y:cy})); }
function limitaGiocatore(){
  var r = K.PL_R, cx = K.RW/2, cy = K.RH/2, g = K.DOOR_GAP*0.5, uscita = -1;
  var aperta = function(i){ var pi = portaInfo(i); if(!pi || pi.segreta || pi.chiusa) return false;
    if(pi.lucchetto){ if(STATO.chiavi>0){ return 'chiave'; } return false; } return true; };
  var tenta = function(i, dentro){ var a = aperta(i); if(!a){ if(dentro){ var pi = portaInfo(i); if(pi && pi.lucchetto && !pi.chiusa && roomT>0.3 && !STATO._msgLuc){ STATO._msgLuc=1; pagaPorta(i); DOPO(1.5, function(){ STATO._msgLuc=0; }); } } return false; }
    if(a==='chiave' && dentro){ var o = vicino(ROOM,i); o.chiusa=0; STATO.chiavi--; sfx('porta'); banner('APERTA','−1 chiave',1); hud.tutto(); }
    return a===true || a==='chiave'; };
  if(P.y<fy0+r){ if(Math.abs(P.x-cx)<g-r*0.4 && tenta(0, true)){ if(P.y<fy0-14) uscita=0; } else P.y=fy0+r; }
  if(P.x>fx1-r){ if(Math.abs(P.y-cy)<g-r*0.4 && tenta(1, true)){ if(P.x>fx1+14) uscita=1; } else P.x=fx1-r; }
  if(P.y>fy1-r){ if(Math.abs(P.x-cx)<g-r*0.4 && tenta(2, true)){ if(P.y>fy1+14) uscita=2; } else P.y=fy1-r; }
  if(P.x<fx0+r){ if(Math.abs(P.y-cy)<g-r*0.4 && tenta(3, true)){ if(P.x<fx0-14) uscita=3; } else P.x=fx0+r; }
  collProps(P);
  if(uscita>=0){ var nx = vicino(ROOM, DIRS[uscita]?uscita:0); if(nx) transita(nx, uscita); }
}
function collProps(o){
  for(var i=0;i<PROPS.length;i++){ var p = PROPS[i]; if(!p.r || p.k==='merce' || p.k==='botola') continue;
    var dx = o.x-p.x, dy = o.y-p.y, d = DM.hypot(dx,dy), mn = p.r + (o.r||K.PL_R);
    if(d<mn && d>0.01){ o.x = p.x + dx/d*mn; o.y = p.y + dy/d*mn; if(o===P) urta(p); } }
}
function propColpito(b){ controllaMattone(b.x, b.y); for(var i=0;i<PROPS.length;i++){ var p=PROPS[i]; if(!p.r || p.k==='merce' || p.k==='botola' || p.k==='npc') continue; if(DM.hypot(b.x-p.x,b.y-p.y)<p.r) { scintille(b.x,b.y,2,'#e8b44a'); return true; } } return false; }
function urta(p){
  if(fase!=='porta' || STATO.carta) return;
  if(p._cd && SIMMS()-p._cd<900) return; p._cd = SIMMS();
  if(p.k==='tavolo' && !ROOM.fatto) apriTavolo();
  else if(p.k==='pozzo' && !ROOM.fatto) apriPozzo();
  else if(p.k==='npc' && !p.fatto){ p.fatto=1; var roomRef = ROOM; if(p.ev!=='oracolo_ev' || ROOM.t==='dialogo') ROOM.fatto=1; apriEvento(p.ev, function(){ disegnaMini(); }); }
  else if(p.k==='piedistallo' && !p.fatto){ p.fatto=1; if(p.bossPw) ROOM.pwPreso=1; else ROOM.fatto=1; prendiPotere(p.pw); }
}
function aggPick(dt){
  for(var i=PICK.length-1;i>=0;i--){ var it = PICK[i]; if(!it.on) continue; it.t+=dt;
    if(it.z<0 || it.vy<0){ it.vy += 600*dt; it.z += it.vy*dt; if(it.z>0){ it.z=0; it.vy=0; } }
    collProps(it);   /* 25/09: una moneta caduta dentro un tavolo o un pozzo non si poteva più prendere: la si spinge fuori */
    var d = DM.hypot(P.x-it.x, P.y-it.y);
    if(it.k==='soldi' && it.vx){ it.x = clamp(it.x+it.vx*dt, fx0+10, fx1-10); it.y = clamp(it.y+it.vy2*dt, fy0+10, fy1-10); it.vx*=0.9; it.vy2*=0.9; }
    if(it.k==='soldi' && d<90 && it.t>0.5){ it.x += (P.x-it.x)*dt*7; it.y += (P.y-it.y)*dt*7; }
    if(d<60 && it.t>0.4 && fase!=='combat'){ it.x += (P.x-it.x)*dt*6; it.y += (P.y-it.y)*dt*6; }
    if(d<18 && it.t>0.35){
      if(it.k==='chiave'){ STATO.chiavi++; sfx('raccolta'); popPiccolo('i_chiave','+1'); }
      else if(it.k==='cuore'){ if(P.hp>=P.hpMax) continue; P.hp=Math.min(P.hpMax,P.hp+2); sfx('raccolta'); popPiccolo('i_cuore','+1'); }
      else if(it.k==='cuoreMax'){ P.hpMax=Math.min(14,P.hpMax+2); P.hp=Math.min(P.hpMax,P.hp+2); sfx('potere'); popFuoriScala('i_cuore','+1 ♥ MAX'); }
      else if(it.k==='soldi'){ guadagna(it.v, it.x, it.y); sfx('moneta'); }
      else if(it.k==='ingranaggio'){ STATO.ingranaggi++; sfx('potere'); popFuoriScala('i_ingranaggio','INGRANAGGIO '+STATO.ingranaggi+'/3'); banner('UN PEZZO DI TE', 'ingranaggio '+STATO.ingranaggi+' di 3', 2.2); }
      it.on=0; PICK.splice(i,1); hud.tutto(); } }
  /* la merce del Pegnaio: ci passi sopra e compri, se puoi */
  for(var j=0;j<PROPS.length;j++){ var p = PROPS[j]; if(p.k!=='merce' || p.m.venduto) continue;
    if(DM.hypot(P.x-p.x,P.y-p.y)<22){ if(p._cd && SIMMS()-p._cd<1200) continue; p._cd=SIMMS(); compra(p); } }
  /* la botola */
  /* la botola chiede UNA volta: dopo RESTA richiede solo se ti allontani e ci torni (prima la carta si riapriva ogni 1,5 s) */
  for(j=0;j<PROPS.length;j++){ p = PROPS[j]; if(p.k!=='botola') continue; var dB = DM.hypot(P.x-p.x,P.y-p.y);
    if(dB > 40) p._chiesto = 0;
    if(dB<24 && fase==='porta' && !STATO.carta && !p._chiesto){ if(p._cd && SIMMS()-p._cd<1500) continue; p._cd=SIMMS(); p._chiesto = 1; chiediScendi(); } }
}
/* ══ DISEGNO DEL MONDO ══ */
function fondoStanza(){
  if(ROOM && ROOM.t==='segreta') return fondale('f_segreta', 0.35);
  var n = STATO.piano, z = STORIA.PIANI[n].zona;
  return z===0 ? fondale('f_saloni', 0.56) : (z===1 ? fondale('f_cucine', 0.74) : (z===2 ? fondale('f_caveau', 0.5) : fondale('f_casa', 0.6)));
}
function disegnaStanza(ox, oy){
  ctx.save(); ctx.translate(OX+ox, OY+oy); ctx.scale(SC, SC);
  var f = fondoStanza(); if(f) ctx.drawImage(f, 0, 0, K.RW, K.RH); else { ctx.fillStyle='#1c1020'; ctx.fillRect(0,0,K.RW,K.RH); }
  ctx.drawImage(DEC, 0, 0, K.RW, K.RH);
  if(ROOM) disegnaPorte();
  var now = performance.now();
  /* la luce che trema: una lampada sopra la stanza */
  var fl = 0.92 + 0.08*DM.sin(now/97)*DM.sin(now/233) + (RV()<0.01?-0.25:0);
  var lg = ctx.createRadialGradient(K.RW/2, K.RH*0.45, 30, K.RW/2, K.RH*0.45, K.RH*0.7);
  lg.addColorStop(0,'rgba(255,200,120,'+(0.07*fl)+')'); lg.addColorStop(1,'rgba(0,0,0,'+(0.28*(2-fl))+')');
  ctx.fillStyle = lg; ctx.fillRect(0,0,K.RW,K.RH);
  /* la scritta del primo piano: i comandi scritti sul pavimento, come in Isaac */
  PROPS.forEach(function(p){ if(p.k==='scritta'){ ctx.save(); ctx.globalAlpha=0.55; ctx.fillStyle='#f1e6cf'; ctx.textAlign='center'; ctx.font='700 15px '+FUI;
    var t = document.body.classList.contains('touch') ? ['LEVETTA SINISTRA: CAMMINA','LEVETTA DESTRA: SPARA DOVE PUNTI','SCATTO: SCHIVA'] : ['W A S D  CAMMINA','FRECCE / MOUSE  SPARANO','SPAZIO  SCATTA · M  MAPPA'];
    for(var q=0;q<t.length;q++) ctx.fillText(T_(t[q]), p.x, p.y+q*20); ctx.globalAlpha=0.35; ctx.font='700 13px '+FUI; ctx.fillText(T_('trova IL TAVOLO ♠ · poi la BOTOLA'), p.x, p.y+74); ctx.restore(); } });
  /* tutto quello che sta in piedi, ordinato per altezza (le figure davanti coprono quelle dietro) */
  var L = [];
  PROPS.forEach(function(p){ if(p.k!=='scritta' && p.k!=='npcmuto') L.push({y:p.y+(p.k==='botola'?-40:0), f:function(){ disegnaProp(p, now); }}); });
  PICK.forEach(function(it){ if(it.on) L.push({y:it.y, f:function(){ disegnaPick(it, now); }}); });
  EN.forEach(function(e){ if(e.on) L.push({y:e.y, f:function(){ disegnaNemico(e, now); }}); });
  if(boss) L.push({y:boss.y, f:function(){ disegnaBoss(now); }});
  if(!P.dead) L.push({y:P.y, f:function(){ disegnaGiocatore(now); }});
  if(COMP) L.push({y:COMP.y+40, f:function(){ disegnaCompagna(now); }});
  L.sort(function(a,b){ return a.y-b.y; }); for(var i=0;i<L.length;i++) L[i].f();
  disegnaProiettili(now);
  disegnaPreavvisi(now);
  PROPS.forEach(function(p){ if(p.k==='npcmuto') disegnaSantino(p.chi, p.x, p.y+16, 0.55, now); });
  ctx.restore();
}
var FUI = '"Barlow Condensed","Arial Narrow",Impact,sans-serif', FTIT = '"Limelight",Georgia,serif';
function disegnaPorte(){
  var spr = cuoci('o_porta', 66, 0), now = performance.now();
  for(var i=0;i<4;i++){
    var pi = portaInfo(i), p = puntoPorta(i);
    if(!pi) continue;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate([0,Math.PI/2,Math.PI,-Math.PI/2][i]);
    if(pi.segreta){ if(pi.o.crepa || STATO.flag.crepe){ ctx.strokeStyle='rgba(20,10,6,.85)'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(-14,-18); ctx.lineTo(-4,-8); ctx.lineTo(-9,2); ctx.lineTo(3,10); ctx.moveTo(-4,-8); ctx.lineTo(10,-14); ctx.moveTo(-9,2); ctx.lineTo(-18,6); ctx.stroke();
        ctx.strokeStyle='rgba(241,230,207,'+(0.18+0.12*DM.sin(now/300))+')'; ctx.lineWidth=1; ctx.stroke(); } ctx.restore(); continue; }
    var o = pi.o;
    if(spr) ctx.drawImage(spr.c, -spr.w/2, -spr.h+14, spr.w, spr.h);
    /* il tipo della stanza di là, su un medaglione d'ottone (colori dell'interfaccia) */
    var ic = o.vis||o.t!=='combat' ? ICONE[o.t] : '';
    if(o.t==='boss'){ ctx.fillStyle='rgba(184,32,46,'+(0.25+0.2*DM.sin(now/200))+')'; ctx.beginPath(); ctx.ellipse(0,-14,26,30,0,0,6.283); ctx.fill(); }
    if(pi.chiusa){ var cade = eOutBack(clamp(roomT/0.32,0,1)), y1 = -38 + 44*cade; ctx.strokeStyle='#15090a'; ctx.lineWidth=5; for(var b=-2;b<=2;b++){ ctx.beginPath(); ctx.moveTo(b*8,-38); ctx.lineTo(b*8,y1); ctx.stroke(); }
      ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=2; for(b=-2;b<=2;b++){ ctx.beginPath(); ctx.moveTo(b*8-1,-38); ctx.lineTo(b*8-1,y1); ctx.stroke(); } }
    else if(pi.lucchetto){ ctx.fillStyle='#e8b44a'; ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.beginPath(); ctx.rect(-9,-18,18,15); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0,-18,6,Math.PI,0); ctx.stroke(); }
    if(ic){ ctx.rotate(-[0,Math.PI/2,Math.PI,-Math.PI/2][i]);
      var mx = [0,-22,0,22][i], my = [34,0,-34,0][i];
      ctx.fillStyle='#120812'; ctx.strokeStyle='#e8b44a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(mx,my,11,0,6.283); ctx.fill(); ctx.stroke();
      ctx.fillStyle = o.t==='boss' ? '#ff5a5f' : '#e8b44a'; ctx.font='700 14px '+FUI; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(ic, mx, my+1); }
    ctx.restore(); }
}
function disegnaProp(p, now){
  if(p.k==='colonna'){ disegnaColonna(p, now); return; }
  if(p.k==='npc'){ disegnaSantino(p.chi, p.x, p.y, 1, now, p.fatto); return; }
  if(p.k==='merce'){ disegnaMerce(p, now); return; }
  var spr = cuoci(p.img, Math.round(p.w * (IMG[p.img].height/IMG[p.img].width)), 1.4, '#000'); if(!spr) return;
  var bob = 0;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle='rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0, spr.h*0.36, p.w*0.46, p.w*0.13, 0, 0, 6.283); ctx.fill();
  if(p.k==='botola'){ var gl = 0.5+0.5*DM.sin(now/260); ctx.fillStyle='rgba(232,180,74,'+(0.15+0.2*gl)+')'; ctx.beginPath(); ctx.arc(0,10,36+gl*6,0,6.283); ctx.fill(); }
  ctx.drawImage(spr.c, -spr.w/2, -spr.h/2 + bob, spr.w, spr.h);
  if(p.k==='piedistallo' && !p.fatto){ var d = PBI[p.pw], s2 = cuoci(d.img, 34, 1.5, '#000'), fl = DM.sin(now/380)*4;
    ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(232,180,74,.25)'; ctx.beginPath(); ctx.arc(0,-spr.h/2-10+fl,24,0,6.283); ctx.fill(); ctx.globalCompositeOperation='source-over';
    if(s2) ctx.drawImage(s2.c, -s2.w/2, -spr.h/2-10-s2.h/2+fl, s2.w, s2.h);
    ctx.fillStyle='#f1e6cf'; ctx.font='800 12px '+FUI; ctx.textAlign='center'; ctx.fillText(d.nm, 0, -spr.h/2-38+fl); }
  if((p.k==='tavolo'||p.k==='pozzo') && (ROOM.fatto)){ ctx.fillStyle='rgba(13,7,16,.6)'; ctx.font='800 16px '+FUI; ctx.textAlign='center'; ctx.fillStyle='#bdb09a'; ctx.fillText('FATTO', 0, spr.h*0.5+14); }
  if((p.k==='tavolo'||p.k==='pozzo') && !ROOM.fatto){ var pl = 0.5+0.5*DM.sin(now/300); ctx.fillStyle='rgba(232,180,74,'+(0.6+0.4*pl)+')'; ctx.font='800 15px '+FUI; ctx.textAlign='center';
    ctx.fillText(p.k==='tavolo' ? '♠ TOCCA IL TAVOLO' : '◍ IL POZZO', 0, spr.h*0.5+16); }
  if(p.k==='botola'){ ctx.fillStyle='#e8b44a'; ctx.font='800 14px '+FUI; ctx.textAlign='center'; ctx.fillText('▼ SCENDI', 0, spr.h*0.5+12); }
  if(p.k==='pozzo'){ /* l'acqua del pozzo: ondina e luce che sale quando cadono le fiche; il mattone giallo */
    if(p.onda>0){ p.onda = Math.max(0, p.onda - 1/40); ctx.strokeStyle='rgba(191,227,230,'+(p.onda*0.8)+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,-8,26*(1.4-p.onda),9*(1.4-p.onda),0,0,6.283); ctx.stroke(); }
    if(p.luce>0){ p.luce = Math.max(0, p.luce - 1/90); ctx.globalCompositeOperation='lighter'; var lg = ctx.createLinearGradient(0,-10,0,-120); lg.addColorStop(0,'rgba(255,220,140,'+(0.4*Math.min(1,p.luce))+')'); lg.addColorStop(1,'rgba(255,220,140,0)'); ctx.fillStyle=lg; ctx.fillRect(-22,-120,44,112); ctx.globalCompositeOperation='source-over'; }
    if(!p.mattoneFatto){ ctx.fillStyle='#000'; ctx.fillRect(34,-10,12,8); ctx.fillStyle = (p.mattone ? '#ffe27a' : '#d8b440'); ctx.fillRect(35,-9,10,6); } }
  ctx.restore();
}
function disegnaSantino(chi, x, y, s, now, spento){
  var pe = STORIA.P[chi], im = IMG[pe.img]; if(!im) return;
  var w = 64*s, h = 88*s, bob = DM.sin(now/520 + x)*3*s;
  ctx.save(); ctx.translate(x, y + bob); if(spento) ctx.globalAlpha = 0.45;
  ctx.fillStyle='rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(0, h*0.62-bob, w*0.5, 8*s, 0, 0, 6.283); ctx.fill();
  var fl = 0.8+0.2*DM.sin(now/90)*DM.sin(now/137);
  var gl = ctx.createRadialGradient(0,0,4,0,0,w*1.1); gl.addColorStop(0,'rgba(255,190,110,'+(0.28*fl)+')'); gl.addColorStop(1,'rgba(255,190,110,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,0,w*1.1,0,6.283); ctx.fill();
  /* il santino: arco d'ottone, dentro il ritratto, raggiera dietro */
  ctx.save(); ctx.beginPath(); ctx.moveTo(-w/2, h/2); ctx.lineTo(-w/2, -h/2+w/2); ctx.arc(0, -h/2+w/2, w/2, Math.PI, 0); ctx.lineTo(w/2, h/2); ctx.closePath();
  ctx.fillStyle='#1a0c16'; ctx.fill(); ctx.clip();
  ctx.save(); ctx.translate(0,-h*0.12); ctx.rotate(now/4000); ctx.fillStyle='rgba(232,180,74,.18)'; for(var q=0;q<12;q++){ ctx.rotate(Math.PI/6); ctx.fillRect(-2,0,4,h); } ctx.restore();
  var sw = im.width, sh = im.height*0.62, dh = h*1.02, dw = dh*sw/sh;
  ctx.drawImage(im, 0, 0, sw, sh, -dw/2, -h/2+2, dw, dh);
  ctx.restore();
  ctx.strokeStyle='#000'; ctx.lineWidth=4*s; ctx.beginPath(); ctx.moveTo(-w/2, h/2); ctx.lineTo(-w/2, -h/2+w/2); ctx.arc(0, -h/2+w/2, w/2, Math.PI, 0); ctx.lineTo(w/2, h/2); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle='#e8b44a'; ctx.lineWidth=2*s; ctx.stroke();
  if(s>=1){ ctx.fillStyle='#120812'; ctx.fillRect(-w*0.62, h/2-2, w*1.24, 16); ctx.strokeStyle='#e8b44a'; ctx.lineWidth=1.5; ctx.strokeRect(-w*0.62, h/2-2, w*1.24, 16);
    ctx.fillStyle='#e8b44a'; ctx.font='800 11px '+FUI; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(T_(pe.nm), 0, h/2+6); }
  ctx.restore();
}
function disegnaPick(it, now){
  if(it.k==='soldi'){ var sz = clamp(10 + 26*Math.sqrt(it.v/(STATO.R.posta*0.02)), 11, 30), sm = cuoci('i_gettone', Math.round(sz), 1.4, '#000'), fl2 = DM.sin(now/260+it.x)*2;
    ctx.fillStyle='rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(it.x,it.y+4,sz*0.4,sz*0.14,0,0,6.283); ctx.fill();
    if(sm){ ctx.save(); ctx.translate(it.x, it.y-sz*0.4+it.z+fl2); ctx.scale(Math.max(0.2,Math.abs(DM.cos(now/180+it.x))),1); ctx.drawImage(sm.c,-sm.w/2,-sm.h/2,sm.w,sm.h); ctx.restore(); } return; }
  var img = it.k==='chiave' ? 'i_chiave' : (it.k==='ingranaggio' ? 'i_ingranaggio' : 'i_cuore'), h = it.k==='chiave'?26:(it.k==='ingranaggio'?28:22), s = cuoci(img, h, 1.6, '#000');
  var fl = DM.sin(now/300 + it.x)*2.5;
  ctx.save(); ctx.translate(it.x, it.y);
  ctx.fillStyle='rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(0,6,10,3.5,0,0,6.283); ctx.fill();
  var gl = 0.5+0.5*DM.sin(now/200); ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(232,180,74,'+(0.12+0.12*gl)+')'; ctx.beginPath(); ctx.arc(0,-8+it.z+fl,16,0,6.283); ctx.fill(); ctx.globalCompositeOperation='source-over';
  if(it.k==='cuoreMax'){ ctx.scale(1.3,1.3); }
  if(s) ctx.drawImage(s.c, -s.w/2, -s.h+4+it.z+fl, s.w, s.h);
  ctx.restore();
}
function disegnaOmbra(x, y, w){ ctx.fillStyle='rgba(0,0,0,.42)'; ctx.beginPath(); ctx.ellipse(x, y, w, w*0.32, 0, 0, 6.283); ctx.fill(); }
function disegnaNemico(e, now){
  var d = ND[e.kind], spr = cuoci(d.img, d.h, 1.8, '#0a0508'); if(!spr) return;
  var nato = clamp(e.nato/0.35, 0, 1), sy = nato<1 ? eOutBack(nato) : 1;
  disegnaOmbra(e.x, e.y + e.r*0.45, e.r*1.05);
  ctx.save(); ctx.translate(e.x + (e.knx||0), e.y + e.r*0.5 + (e.kny||0)); if(e.knx){ e.knx*=0.8; e.kny*=0.8; }
  if(e.vis!=null) ctx.globalAlpha = clamp(e.vis,0.08,1);
  var passo = Math.abs(DM.sin(now/110 + e.seme)), sq = 1, st = 1, rot = 0;
  if(d.spd>0){ sq = 1 + 0.06*passo; st = 1/sq; rot = DM.sin(now/110+e.seme)*0.06; }
  else { var br = DM.sin(now/400+e.seme)*0.03; sq = 1+br; st = 1-br; }
  if(e.tele>0){ var tk = 1 + 0.14*Math.abs(DM.sin(now/40)); sq = 1/tk; st = tk; }
  if(e.flash>0){ var hf = e.flash/0.1; sq = 1+0.25*hf; st = 1-0.2*hf; }
  if(e._scudoGiu){ rot += 0.22*e.dir; st *= 0.94; }
  ctx.rotate(rot); ctx.scale(e.dir*sq, st*sy);
  ctx.drawImage(spr.c, -spr.w/2, -spr.h, spr.w, spr.h);
  if(e.flash>0){ ctx.globalAlpha *= Math.min(1, e.flash/0.1); ctx.drawImage(spr.bianco, -spr.w/2, -spr.h, spr.w, spr.h); }
  else if(e.tele>0){ ctx.globalAlpha *= 0.35+0.35*Math.abs(DM.sin(now/55)); ctx.drawImage(spr.ambra, -spr.w/2, -spr.h, spr.w, spr.h); }
  ctx.restore();
  if(e.chiamato){ var cf=(now%700)/700; ctx.globalAlpha=(1-cf)*0.7; ctx.strokeStyle='#e8b44a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(e.x,e.y,e.r+6+cf*22,0,6.283); ctx.stroke(); ctx.globalAlpha=1; }
  if(e.scudo>0){ ctx.strokeStyle='rgba(255,226,122,'+(0.5+0.3*DM.sin(now/80))+')'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(e.x, e.y-d.h*0.4, d.h*0.55, 0, 6.283); ctx.stroke();
    ctx.fillStyle='rgba(255,226,122,.08)'; ctx.fill(); }
  if(e.kind==='prete' && e.leg){ ctx.strokeStyle='rgba(255,226,122,.45)'; ctx.lineWidth=1.5; ctx.setLineDash([4,5]); e.leg.forEach(function(o){ if(o.on && o.scudo>0){ ctx.beginPath(); ctx.moveTo(e.x,e.y-d.h*0.6); ctx.lineTo(o.x,o.y-ND[o.kind].h*0.4); ctx.stroke(); } }); ctx.setLineDash([]); }
  if(e.stun>0){ ctx.fillStyle='#e8b44a'; ctx.font='800 12px '+FUI; ctx.textAlign='center'; for(var s3=0;s3<3;s3++){ var a3=now/200+s3*2.09; ctx.fillText('★', e.x+DM.cos(a3)*16, e.y-d.h-4+DM.sin(a3)*4); } }
  if(e.bottino){ var sb = cuoci('i_gettone', 16, 1.2, '#000'); if(sb) ctx.drawImage(sb.c, e.x+8, e.y-d.h*0.7, sb.w, sb.h); }
  if(e.hp<e.hpMax && e.hpMax>=5){ var w = 26, f = e.hp/e.hpMax; ctx.fillStyle='#000'; ctx.fillRect(e.x-w/2-1, e.y-d.h-8, w+2, 5); ctx.fillStyle='#b8202e'; ctx.fillRect(e.x-w/2, e.y-d.h-7, w*f, 3); }
}
function disegnaGiocatore(now){
  var H = 50, spr = cuoci('m_bot', H, 1.8, '#0a0508'); if(!spr) return;
  var blink = (P.iframe>0) && (now%140)<70, mv = DM.hypot(IN.mvx, IN.mvy), moving = mv>0.1;
  disegnaOmbra(P.x, P.y+7, 13*(P.dashT>0?1.2:1));
  if(P.dashT>0){ for(var a=1;a<=3;a++){ ctx.save(); ctx.globalAlpha=0.16*(4-a); ctx.translate(P.x - P.dvx*0.012*a, P.y+8 - P.dvy*0.012*a); ctx.scale(P.dir,1); ctx.drawImage(spr.ambra, -spr.w/2, -spr.h, spr.w, spr.h); ctx.restore(); } }
  ctx.save(); ctx.translate(P.x, P.y+8);
  if(blink) ctx.globalAlpha = 0.45;
  var sq = 1, st = 1, rot = 0, hop = 0;
  if(P.dashT>0){ sq = 1.18; st = 0.86; }
  else if(moving){ var w = DM.sin(P.walk); hop = -Math.abs(w)*3; rot = w*0.07; sq = 1+0.04*Math.abs(w); st = 1/sq; }
  else { var br = DM.sin(now/600)*0.022; sq = 1-br; st = 1+br; }
  if(P.inchino>0){ rot += DM.sin(Math.min(1,P.inchino/1.4)*Math.PI)*0.3*P.dir; }
  if(P.muz>0){ var rc = P.muz/0.06; sq *= 1+0.05*rc; st *= 1-0.04*rc; }
  ctx.translate(0, hop); ctx.rotate(rot); ctx.scale(P.dir*sq, st);
  ctx.drawImage(spr.c, -spr.w/2, -spr.h, spr.w, spr.h);
  /* LA FACCIA È UNO SCHERMO: gli occhi guardano dove spari, sbattono, reagiscono */
  var ox = -spr.w/2 + (1.8+2) , oy = -spr.h + (1.8+2);
  var scX = (spr.w-2*(1.8+2))/108, scY = (spr.h-2*(1.8+2))/200;
  var x0 = ox + 51*scX, y0 = oy + 46*scY, ww = 35*scX, hh = 21*scY;
  ctx.fillStyle = '#120a08'; ctx.fillRect(x0, y0, ww, hh);
  var lx = P.aimX*P.dir*2.2, ly = P.aimY*1.6, chiusi = P.blinkT<0;
  ctx.fillStyle = P.occhi==='x' ? '#ff5a5f' : '#ffb35a';
  ctx.globalCompositeOperation='lighter';
  if(P.occhi==='x'){ ctx.strokeStyle='#ff5a5f'; ctx.lineWidth=1.6; [x0+ww*0.3, x0+ww*0.72].forEach(function(cx){ var cy=y0+hh*0.5; ctx.beginPath(); ctx.moveTo(cx-3,cy-3); ctx.lineTo(cx+3,cy+3); ctx.moveTo(cx+3,cy-3); ctx.lineTo(cx-3,cy+3); ctx.stroke(); }); }
  else if(P.occhi==='!'){ ctx.font='900 '+Math.round(hh*1.1)+'px '+FUI; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('!!', x0+ww/2, y0+hh/2+1); }
  else if(P.occhi==='$'){ ctx.font='900 '+Math.round(hh*1.0)+'px '+FUI; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('$ $', x0+ww/2, y0+hh/2+1); }
  else if(chiusi){ ctx.fillRect(x0+ww*0.18, y0+hh*0.5, ww*0.24, 1.4); ctx.fillRect(x0+ww*0.6, y0+hh*0.5, ww*0.24, 1.4); }
  else { var r = hh*0.3; [0.3, 0.72].forEach(function(f){ ctx.beginPath(); ctx.ellipse(x0+ww*f+lx, y0+hh*0.52+ly, r, r*1.05, 0, 0, 6.283); ctx.fill(); }); }
  ctx.globalCompositeOperation='source-over';
  if(P.iframe>0 || P.flashP>0){ ctx.globalAlpha = 0.5*Math.abs(DM.sin(now/60)); ctx.drawImage(spr.bianco, -spr.w/2, -spr.h, spr.w, spr.h); }
  ctx.restore();
  if(P.scudo>0){ ctx.strokeStyle='rgba(255,226,122,'+(0.5+0.3*DM.sin(now/90))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(P.x, P.y-18, 24, 0, 6.283); ctx.stroke(); }
  /* la bocca di fuoco: il lampo parte dalla mano, nella direzione della mira */
  if(P.muz>0){ var mz = P.muz/0.06, a = DM.atan2(P.aimY, P.aimX), mx = P.x+DM.cos(a)*16, my = P.y-14+DM.sin(a)*12;
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=mz; ctx.fillStyle='#fff3c8'; ctx.beginPath(); ctx.arc(mx,my,3+4*mz,0,6.283); ctx.fill();
    ctx.fillStyle='#e8b44a'; ctx.beginPath(); ctx.arc(mx,my,7*mz+2,0,6.283); ctx.globalAlpha=mz*0.5; ctx.fill(); ctx.restore(); }
}
function disegnaCompagna(now){
  var im = IMG.p_lena; if(!im) return; var r = 13;
  ctx.save(); ctx.translate(COMP.x, COMP.y);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0,34,10,3,0,0,6.283); ctx.fill();
  ctx.beginPath(); ctx.arc(0,0,r,0,6.283); ctx.fillStyle='#1a0c16'; ctx.fill(); ctx.save(); ctx.clip();
  var sw = im.width*0.5, sh = sw; ctx.drawImage(im, im.width*0.26, im.height*0.02, sw, sh, -r, -r, r*2, r*2); ctx.restore();
  ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.stroke(); ctx.strokeStyle='#e0457b'; ctx.lineWidth=1.6; ctx.stroke();
  ctx.restore();
}
function disegnaProiettili(now){
  var k, b;
  for(k=0;k<PB.length;k++){ b=PB[k]; if(!b.on) continue;
    var r = b.r || 5;
    if(b.orb){ var s = cuoci('i_scorta', 18, 1, '#000'); if(s) ctx.drawImage(s.c, b.x-s.w/2, b.y-s.h/2, s.w, s.h); continue; }
    if(b.carta){ ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(now/60); ctx.fillStyle='#f1e6cf'; ctx.strokeStyle='#000'; ctx.lineWidth=1.5; ctx.fillRect(-4,-6,8,12); ctx.strokeRect(-4,-6,8,12); ctx.fillStyle='#b8202e'; ctx.fillRect(-1.5,-2,3,4); ctx.restore(); continue; }
    var col = Wp.exp ? '#ff6a3b' : (Wp.hom ? '#ff3d8b' : (Wp.bnc ? '#f1e6cf' : (Wp.dmg>1.5 ? '#8a8a96' : '#e8b44a')));
    if(Wp.freddo && P.hp>=P.hpMax) col = '#bfe3e6';
    var tx = b.vx*0.012*(Wp.pen?2:1), ty = b.vy*0.012*(Wp.pen?2:1);
    ctx.strokeStyle = col; ctx.globalAlpha = 0.45; ctx.lineWidth = r*1.3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(b.x-tx*2.2, b.y-ty*2.2); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(b.x, b.y, r+1.8, 0, 6.283); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(b.x-r*0.3, b.y-r*0.3, r*0.35, 0, 6.283); ctx.fill(); }
  /* i colpi nemici: sangue con contorno nero, o monete d'ottone. Si leggono su ogni pavimento. */
  for(k=0;k<EB.length;k++){ b=EB[k]; if(!b.on) continue; var rr = b.r;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(b.x, b.y, rr+2.2, 0, 6.283); ctx.fill();
    if(b.mon){ ctx.fillStyle = '#e8b44a'; ctx.beginPath(); ctx.arc(b.x, b.y, rr, 0, 6.283); ctx.fill(); ctx.strokeStyle='#8a5a14'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(b.x,b.y,rr*0.6,0,6.283); ctx.stroke(); }
    else { ctx.fillStyle = b.big ? '#ff3d8b' : '#e0263a'; ctx.beginPath(); ctx.arc(b.x, b.y, rr, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ffd0d6'; ctx.beginPath(); ctx.arc(b.x-rr*0.3, b.y-rr*0.3, rr*0.34, 0, 6.283); ctx.fill(); } }
  for(k=0;k<PA.length;k++){ var p=PA[k]; if(!p.on) continue; var a = Math.max(0,p.life/p.max);
    if(p.add){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=a; ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
    else { ctx.globalAlpha=a; ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r+1.2,0,6.283); ctx.fill(); ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fill(); } }
  ctx.globalAlpha=1;
  for(k=0;k<FR.length;k++){ var f=FR[k]; if(!f.on) continue; ctx.save(); ctx.globalAlpha=Math.min(1,f.life/f.max*2); ctx.translate(f.x,f.y); ctx.rotate(f.rot); ctx.scale(f.dir,1); ctx.drawImage(f.c,-f.w/2,-f.h/2,f.w,f.h); ctx.restore(); }
  PIOG.forEach(function(c){ ctx.save(); ctx.translate(c.x,c.y); ctx.scale(1, Math.max(0.2,Math.abs(DM.cos(c.rot)))); ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(0,0,6.5,0,6.283); ctx.fill();
    ctx.fillStyle=['#b8202e','#e8b44a','#f1e6cf'][c.c]; ctx.beginPath(); ctx.arc(0,0,5,0,6.283); ctx.fill(); ctx.restore(); });
  ctx.strokeStyle='#ffe27a'; ctx.lineWidth=2.4; ARCHI.forEach(function(a){ ctx.globalAlpha=a.t/0.16; ctx.beginPath(); ctx.moveTo(a.x0,a.y0); var mx=(a.x0+a.x1)/2+(RV()-0.5)*14, my=(a.y0+a.y1)/2+(RV()-0.5)*14; ctx.lineTo(mx,my); ctx.lineTo(a.x1,a.y1); ctx.stroke(); }); ctx.globalAlpha=1;
}
function disegnaPreavvisi(now){
  var k, e;
  for(k=0;k<EN.length;k++){ e=EN[k]; if(!e.on || !(e.tele>0)) continue;
    if(e.kind==='cecchino'){ var f = 1-Math.max(0,e.tele)/0.85; ctx.strokeStyle='rgba(255,60,60,'+(0.35+0.55*f)+')'; ctx.lineWidth=2+2*f; ctx.beginPath(); ctx.moveTo(e.x,e.y-10); ctx.lineTo(e.x+DM.cos(e.aimA)*520,e.y-10+DM.sin(e.aimA)*520); ctx.stroke(); }
    else if(e.kind==='toro' && e.st===1){ ctx.strokeStyle='rgba(255,90,40,'+(0.4+0.4*Math.abs(DM.sin(now/70)))+')'; ctx.lineWidth=5; ctx.setLineDash([10,6]); ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.lineTo(e.x+DM.cos(e.aimA)*300,e.y+DM.sin(e.aimA)*300); ctx.stroke(); ctx.setLineDash([]); }
    else if(e.kind==='minachip'){ ctx.strokeStyle='rgba(255,60,40,'+(0.5+0.5*Math.abs(DM.sin(now/40)))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(e.x,e.y-6,30,0,6.283); ctx.stroke(); }
    else if(e.kind==='buttafuori'){ ctx.strokeStyle='rgba(255,90,40,'+(0.4+0.4*Math.abs(DM.sin(now/70)))+')'; ctx.lineWidth=4; ctx.setLineDash([10,6]); ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.lineTo(e.x+DM.cos(e.aimA)*165,e.y+DM.sin(e.aimA)*165); ctx.stroke(); ctx.setLineDash([]); }
    else if(e.kind==='pistolero'||e.kind==='lena'){ var a0=DM.atan2(P.y-e.y,P.x-e.x); ctx.strokeStyle='rgba(255,90,60,.45)'; ctx.lineWidth=1.4; ctx.setLineDash([5,6]); for(var j=-1;j<=1;j++){ ctx.beginPath(); ctx.moveTo(e.x,e.y-8); ctx.lineTo(e.x+DM.cos(a0+j*0.14)*90,e.y-8+DM.sin(a0+j*0.14)*90); ctx.stroke(); } ctx.setLineDash([]); }
    else if(e.kind==='slot'){ ctx.strokeStyle='rgba(232,180,74,'+(0.4+0.4*Math.abs(DM.sin(now/60)))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(e.x,e.y-16,e.r+10,0,6.283); ctx.stroke(); }
    else if(e.kind==='mazziere'){ ctx.strokeStyle='rgba(255,61,139,'+(0.4+0.4*Math.abs(DM.sin(now/60)))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(e.x,e.y-20,e.r+14,0,6.283); ctx.stroke(); }
    else if(e.kind==='fiche'||e.kind==='dadino'||e.kind==='mastino'){ ctx.strokeStyle='rgba(255,210,74,'+(0.3+0.5*Math.abs(DM.sin(now/50)))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(e.x,e.y-8,e.r+5,0,6.283); ctx.stroke(); } }
  disegnaPreavvisiBoss(now);
}

/* ══════════════════════════════════════════════════════════════════════════
   i_boss.js — I QUATTRO BOSS. Uno per atto, più la Casa.
   Ogni boss: nasce dall'altra parte della porta da cui entri, si presenta
   (cala / emerge / sipario / carte), parla, annuncia ogni colpo, ha un PUNTO
   DEBOLE che si apre solo in certi momenti (lo si vede: bersaglio che pulsa;
   colpirlo fa tre volte il danno) e una strategia da scoprire. Due boss hanno
   due fasi VERE (l'Esattore e la Casa): cambiano aspetto, arena e mosse.
   Schede in _prove/boss/SCHEDE.md.
   ══════════════════════════════════════════════════════════════════════════ */
var BD = {
  bandito:{ nm:'IL BANDITO', sub:'la slot che mangia i vicoli', img:'b_bandito', h:132, r:40, hp:90, ent:'cala',
    fasi:[ { att:['monete','leva','chiama'] }, { att:['leva','jackpot','monete','chiama'] }, { att:['jackpot','leva','monete','leva'] } ], soglie:[0.66,0.33],
    parti:{ leva:[0.80,0.02,1.0,0.62,0.86,0.58], bocca:[0.08,0.60,0.80,0.86] } },
  esattore:{ nm:'L\'ESATTORE', sub:'il tuo posto non lo prende una latta', img:'b_esattore', h:128, r:36, hp:230, ent:'emerge',
    fasi:[ { att:['carica','cambiali','pugno','carica','chiama'] }, { att:['carica2','tempesta','conta','carica2','pugno','conta'], vera:1 } ], soglie:[0.5],
    parti:{ busto:[0.0,0.0,1.0,0.52], borsa:[0.25,0.42,0.72,0.72] } },
  croupier:{ nm:'IL CROUPIER DELLA CASA', sub:'l\'ultima mano del palazzo', img:'b_croupier', h:140, r:44, hp:240, ent:'carte',
    fasi:[ { att:['ventaglio','mano','rastrello','roulette','ventaglio','mano'] } ], soglie:[],
    parti:{ visiera:[0.28,0.12,0.72,0.34] } },
  casa:{ nm:'LA CASA', sub:'il palazzo che risponde', img:'b_casa', h:170, r:52, hp:340, ent:'sipario',
    fasi:[ { att:['occhi','pioggia','bocca','occhi'] }, { att:['battito','sangue','cassaforte','arterie','battito','cassaforte'], vera:1, img:'b_cuore', h:160 } ], soglie:[0.5],
    parti:{ bocca:[0.14,0.58,0.86,1.0], corona:[0.25,0.0,0.75,0.2] } }
};
/* ── LE BATTUTE: cambiano con le scelte della notte ── */
function battuta(tipo, k){
  var F = STATO.flag, L = STATO.rel.lena;
  var T = {
    bandito:{ entra:['Una monetina, latta? Tira la leva!','Anche tu hai una fessura. Lo sento.'], meta:['Ho mangiato vicoli interi. Tu sei spiccioli.'],
      colpisce:['JACKPOT!','Tutto nella fessura.','Ritenta, sarai più fortunato.'], debole:['La bocca! Non la bocca!','Si è inceppata… NO!'], muore:['Anche tu… hai una fessura… per le monete…'] },
    esattore:{ entra:[ L<0 ? 'La ragazza me l\'hai venduta tu. Adesso vendo te.' : (F.compagna ? 'Tu e la baro. Che coppia di spiccioli.' : 'Il mio posto non lo prende una latta.') ],
      meta:['Vuoi sapere perché ti hanno mandato giù?'], fase:['Non sei qui per riscuotere. Sei qui per ESSERE riscosso!','La Famiglia deve una macchina alla Casa. Sei TU il pagamento.'],
      colpisce:['Segnato sul conto.','Interessi.','Questo te lo scalo.'], debole:['La valigetta no!','Mi hai preso alle spalle, latta.'],
      muore:[ F.traditore ? 'Hai venduto tutti… sei proprio uno di noi.' : 'Paga tu, allora… il conto è tuo.' ] },
    croupier:{ entra:[ F.riscuoti ? 'Mi dispiace, esattore. Le regole sono della Casa.' : 'Sapevo che avresti giocato fino in fondo.' ],
      meta:['Scegli la carta. Una sola è quella giusta.'], colpisce:['Il banco vince.','Carta bassa.'], debole:['Hai visto l\'asso. Bravo.','Le mie mani… sono stanche.'],
      muore:[ F.riscuoti ? 'Vai. Qualcuno deve pur vincere, una volta.' : 'Il Palazzo non dimentica chi gioca.' ] },
    casa:{ entra:['Ti ho costruita io, macchina.','Bentornata a casa.'], meta:['Tutto quello che hai è mio.'], fase:['Vuoi vedere cosa c\'è dietro la facciata?','Allora guarda il mio cuore.'],
      colpisce:['Torna a casa.','Resta.','Sei mia.'], debole:['Il mio cuore… è una cassaforte…','Chiudi! CHIUDI!'],
      muore:[ STATO.ingranaggi>=3 ? 'I tuoi ingranaggi… erano miei…' : (F.patto ? 'Adesso… la Casa sei tu.' : 'Una Casa… si ricostruisce sempre…') ] }
  };
  var A = (T[tipo]||{})[k]; return A ? A[(RV()*A.length)|0] : '';
}
function bossDice(k, forza){ var b = boss; if(!b) return; var now = performance.now();
  if(!forza && b.fum && now - b.fumT0 < (k==='colpisce'?3500:1200)) return;
  var t = battuta(b.tipo, k); if(!t) return; b.fum = t; b.fumT0 = now; b.fumDur = 2300; }

/* ── l'arena: colonne che coprono (e contro cui far sbattere chi carica) ── */
function arenaBoss(tipo, dd){
  var c = [];
  if(dd===0 || dd===2) c = [[K.RW*0.24, K.RH*0.5],[K.RW*0.76, K.RH*0.5]]; else c = [[K.RW*0.5, K.RH*0.3],[K.RW*0.5, K.RH*0.72]];
  if(tipo==='croupier') c = c.slice(0,1);
  c.forEach(function(q){ PROPS.push({ k:'colonna', x:q[0], y:q[1], r:17, vita:tipo==='esattore'?2:3 }); });
}
function disegnaColonna(p, now){
  ctx.save(); ctx.translate(p.x, p.y); var crepa = p.vita<3;
  ctx.fillStyle='rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0,6,22,8,0,0,6.283); ctx.fill();
  ctx.fillStyle='#000'; ctx.fillRect(-16,-46,32,52); ctx.fillStyle='#3a2438'; ctx.fillRect(-14,-44,28,48);
  ctx.fillStyle='#5a3a58'; ctx.fillRect(-14,-44,8,48);
  ctx.fillStyle='#000'; ctx.fillRect(-19,-52,38,10); ctx.fillStyle='#e8b44a'; ctx.fillRect(-17,-50,34,6);
  ctx.fillStyle='#000'; ctx.fillRect(-19,2,38,8); ctx.fillStyle='#b98526'; ctx.fillRect(-17,3,34,5);
  if(crepa){ ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-6,-40); ctx.lineTo(2,-26); ctx.lineTo(-4,-14); ctx.lineTo(5,-2); ctx.stroke(); }
  ctx.restore();
}
function colpisciColonna(p){ p.vita--; burst(p.x, p.y-20, 14, '#5a3a58'); kick(0.3); sfx('boom', 0.7);
  if(p.vita<=0){ PROPS.splice(PROPS.indexOf(p),1); spezzaPietra(p.x, p.y); } }
function spezzaPietra(x, y){ for(var q=0;q<14;q++){ var a = RV()*6.283; part(x, y-20, DM.cos(a)*200, DM.sin(a)*200-60, 0.6, pickV(['#3a2438','#5a3a58','#e8b44a']), 3+RV()*3); } }

/* ══ NASCITA ══ */
function avviaBoss(tipo){
  var d = BD[tipo];
  var mul = (tipo==='casa') ? (1 + (STATO.flag.deaOffesa?0.2:0) + (STATO.flag.marker?0.15:0)) * Math.max(0.65, 1 - 0.1*STATO.attrezzi.length) : 1;
  if(tipo==='croupier' && STATO.flag.riscuoti) mul = 0.85;
  boss = { tipo:tipo, d:d, img:d.img, h:d.h, x:K.RW/2, y:fy0+120, dy:d.h*0.45, r:d.r, hp:d.hp*mul, hpMax:d.hp*mul, ph:0, st:'intro', t:2.3, cd:0, flash:0, aimA:0, spin:0,
           vx:0, vy:0, ai:-1, leva:0, bocca:0, stordito:0, tx:0, ty:0, beams:null, cerchi:[], carte:null, debole:null, cariche:0, nfasi:d.fasi.length };
  /* IL LATO OPPOSTO ALLA PORTA DA CUI SEI ENTRATO (calcolato dalla porta vera), lontano dalle porte */
  var dd = (ROOM && ROOM.entrata!=null) ? ROOM.entrata : 0, cx = K.RW/2, cy = K.RH/2, mh = d.h;
  if(dd===0){ boss.x = cx; boss.y = fy0 + mh*0.62 + 22; }
  else if(dd===2){ boss.x = cx; boss.y = fy1 - 64; }
  else if(dd===1){ boss.x = fx1 - d.r - 58; boss.y = cy + mh*0.32; }
  else { boss.x = fx0 + d.r + 58; boss.y = cy + mh*0.32; }
  boss.x = clamp(boss.x, fx0+d.r, fx1-d.r); boss.y = clamp(boss.y, fy0+mh*0.62, fy1-40);
  boss.homeX = boss.x; boss.homeY = boss.y; boss.t0i = 2.3;
  if(STATO.bossHpF){ boss.hp = boss.hpMax*STATO.bossHpF; STATO.bossHpF = 0; }
  if(STATO.soffiata===STATO.piano) boss.hp *= 0.85;
  for(var k=0;k<EB.length;k++) EB[k].on = 0;
  arenaBoss(tipo, dd);
  sfx('chiusa'); kick(0.25); suono.musica('combat');
  setTimeout(function(){ if(boss && boss.st==='intro') sfx(tipo==='esattore'?'scendi':'boom', 1.2); }, 500);
  setTimeout(function(){ if(boss && boss.st==='intro'){ kick(0.55); sfx('ruggito'); lampo=0.5; lampoCol='#e8b44a'; burst(boss.x, boss.y, 24, '#3a2410'); bossDice('entra', true); } }, 1050);
}
function bossAttivo(){ return !!boss && boss.st!=='morto' && boss.st!=='intro' && boss.st!=='morente' && boss.st!=='trasforma'; }
function faseBoss(){ var f = boss.hp/boss.hpMax, s = boss.d.soglie, n = 0; for(var i=0;i<s.length;i++) if(f<=s[i]) n++; return n; }

/* ── il colpo al boss: se prende il PUNTO DEBOLE fa tre volte il danno ── */
function feriscBoss(dmg, bx, by){
  var b = boss; if(!bossAttivo()) return;
  var debole = false;
  if(b.debole && bx!=null){ var pts = b.debole.pts || [[b.debole.dx, b.debole.dy]];
    for(var i=0;i<pts.length;i++){ if(DM.hypot(bx-(b.x+pts[i][0]), by-(b.y+pts[i][1])) < b.debole.r){ debole = true; break; } } }
  var mult = debole ? 3 : (b.stordito>0 ? 1.5 : 1);
  b.hp -= dmg*mult; b.flash = debole ? 0.16 : 0.09;
  var rdx = b.x-P.x, rdy = (b.y-b.dy)-P.y, rd0 = DM.hypot(rdx,rdy)||1; b.kx = (b.kx||0)*0.5 + rdx/rd0*(debole?7:3.2); b.ky = (b.ky||0)*0.5 + rdy/rd0*(debole?5:2.2); b.sq = debole?1.6:1;
  if(debole){ lampo = Math.max(lampo, 0.45); lampoCol = '#fff6c8'; hitStop = Math.max(hitStop, 0.07); kick(0.18); sfx('boom', 0.5); scintille(bx, by, 14, '#fff6c8', 320);
    popTesto('PUNTO DEBOLE!', bx, by); bossDice('debole'); if(b.debole.chiudi) { b.debole = null; b.beams = null; b.stordito = Math.max(b.stordito, 0.9); } }
  if(!b.metaDetta && b.hp < b.hpMax*0.55){ b.metaDetta = 1; bossDice('meta', true); }
  var np = faseBoss();
  if(np!==b.ph && b.hp>0){ cambiaFase(np); }
  if(b.hp<=0) bossMuore();
}
var _popT = [];
function popTesto(t, x, y){ if(!VIS) return; _popT.push({ t:0, s:t, x:x, y:y }); }
function cambiaFase(np){
  var b = boss, F = b.d.fasi[np];
  b.ph = np; b.debole = null; b.beams = null; b.cerchi = []; b.carte = null;
  for(var k0=0;k0<EB.length;k0++) EB[k0].on = 0;
  var pdx = P.x-b.x, pdy = P.y-b.y, pd = DM.hypot(pdx,pdy)||1; if(pd<170){ P.x = clamp(P.x+pdx/pd*60, fx0+14, fx1-14); P.y = clamp(P.y+pdy/pd*60, fy0+14, fy1-14); }
  b.onda = 0.001; b.urlo = 1; lampo = 0.8; lampoCol = '#ff3d8b'; hitStop = Math.max(hitStop, 0.16); slowmo = Math.max(slowmo, 0.45); kick(0.6); sfx('ruggito'); sfx('boom', 1.1);
  if(F.vera){
    /* FASE VERA: si trasforma. Cambia aspetto, arena, mosse. */
    b.st = 'trasforma'; b.t = 1.8; bossDice('fase', true); banner('SECONDA FASE', b.tipo==='casa' ? 'dietro la facciata' : 'senza cappotto', 1.8);
    spezza(cuoci(b.img, b.h, 2, '#000'), b.x, b.y-b.dy, 1, 12, 0.9);
    if(b.tipo==='casa'){ PROPS = PROPS.filter(function(p){ if(p.k==='colonna'){ spezzaPietra(p.x, p.y); return false; } return true; }); }
    DOPO(0.9, function(){ if(!boss || boss.tipo!==b.tipo) return; if(F.img){ b.img = F.img; b.h = F.h||b.h; b.dy = b.h*0.45; } STATO.arena = b.tipo; lampo = 1; lampoCol = '#b8202e'; kick(0.8); sfx('boom',1.4); burst(b.x, b.y-b.dy, 40, '#b8202e'); });
  } else { b.st = 'attesa'; b.cd = 1.3; b.stordito = 0.9; banner('FASE '+(np+1), ['','si incrina','si scatena'][Math.min(2,np)]||'', 1.4); bossDice('meta');
    spezza(cuoci(b.img, b.h, 2, '#000'), b.x, b.y-b.dy, 1, 4, 0.5); }
}
/* la morte lunga: trema e scoppietta al rallentatore, poi va in pezzi e piove oro */
function bossMuore(){
  var b = boss; b.st='morente'; b.t=1.5; b.scop=0; b.debole = null; b.beams = null; b.cerchi = []; b.carte = null; lampo=0.9; lampoCol='#fff6c8'; hitStop=0.3; slowmo=1.6; kick(0.8); sfx('ruggito'); bossDice('muore', true); b.fumDur = 3200;
  for(var k=0;k<EB.length;k++) EB[k].on=0; for(var m=0;m<EN.length;m++) if(EN[m].on) muoreNemico(EN[m]);
}
function bossEsplode(){
  var b = boss; b.st='morto'; b.t=1.6; lampo=1; lampoCol='#e8b44a'; hitStop=0.2; slowmo=0.8; kick(1);
  var spr = cuoci(b.img, b.h, 2, '#000'); spezza(spr, b.x, b.y-b.dy, 1, 12, 1.4);
  burst(b.x,b.y-b.dy,40,'#e8b44a'); burst(b.x,b.y-b.dy,30,'#ff3d8b'); scintille(b.x,b.y-b.dy,30,'#fff6c8',380); schizzo(b.x,b.y,'#b8202e',20);
  if(VIS) for(var q=0;q<70;q++){ var a = -Math.PI/2 + (RV()-0.5)*2.6, v = 220+RV()*320; PIOG.push({ x:b.x, y:b.y-b.dy, vx:DM.cos(a)*v*0.7, vy:DM.sin(a)*v, t:0, g:b.y+20+RV()*120, c:q%3, rot:RV()*6 }); }
  STATO.arena = null; sfx('boom',1.6); setTimeout(function(){ sfx('moneta'); sfx('vinto'); }, 250);
}
var PIOG = [];
function aggPioggia(dt){ for(var i=PIOG.length-1;i>=0;i--){ var c = PIOG[i]; c.t += dt; c.vy += 700*dt; c.x += c.vx*dt; c.y += c.vy*dt; c.rot += dt*12;
    if(c.y>c.g && c.vy>0){ c.y = c.g; c.vy *= -0.35; c.vx *= 0.6; if(Math.abs(c.vy)<40) c.vy = 0; if(RV()<0.15) sfx('moneta'); }
    if(c.t>2.4) PIOG.splice(i,1); }
  for(i=_popT.length-1;i>=0;i--){ _popT[i].t += dt; if(_popT[i].t>0.9) _popT.splice(i,1); } }

/* ══ IL CERVELLO DEI BOSS ══ */
function aggBoss(dt){
  var b = boss; if(!b) return;
  if(b.flash>0) b.flash-=dt; b.spin+=dt*1.1; if(b.stordito>0) b.stordito-=dt;
  b.leva += ((b.levaT||0)-b.leva)*Math.min(1,dt*10); b.bocca += ((b.boccaT||0)-b.bocca)*Math.min(1,dt*9);
  if(b.kx){ b.kx *= DM.pow(0.001, dt); b.ky *= DM.pow(0.001, dt); } if(b.sq>0) b.sq = Math.max(0, b.sq - dt*8);
  if(b.onda>0){ b.onda += dt*1.6; if(b.onda>1) b.onda = 0; } if(b.urlo>0) b.urlo = Math.max(0, b.urlo-dt*1.2);
  if(b.debole && b.debole.t!=null){ b.debole.t -= dt; if(b.debole.t<=0) b.debole = null; }
  if(b.st==='morto'){ b.t-=dt; if(b.t<=0){ var bb=boss; boss=null; bossVinto(bb); } return; }
  if(b.st==='morente'){ b.t-=dt; b.scop-=dt; if(b.scop<=0){ b.scop = 0.12+RS()*0.1; var ex = b.x+rnd(-b.r,b.r), ey = b.y-b.dy+rnd(-b.h*0.4,b.h*0.3);
      burst(ex,ey,10,pick(['#e8b44a','#ff3d8b','#ff9a3b'])); scintille(ex,ey,6,'#fff6c8',260); b.flash=0.08; kick(0.12); sfx('boom',0.35); }
    if(b.t<=0) bossEsplode(); return; }
  if(b.st==='intro'){ b.t-=dt; if(b.t<=0){ b.st='attesa'; b.cd=0.9;
      if(b.tipo==='esattore' && STATO.rel.lena<0){ spawn('lena', b.x+50, b.y); bossDice('entra', true); } } return; }
  if(b.st==='trasforma'){ b.t-=dt; if(b.t<=0){ b.st='attesa'; b.cd=0.8; } return; }
  var dx=P.x-b.x, dy=P.y-(b.y-b.dy*0.5), d=DM.hypot(dx,dy)||1, ux=dx/d, uy=dy/d, tipo=b.tipo, spd=34+14*b.ph;
  /* i cerchi della pioggia, i raggi, le carte vivono a parte */
  for(var c=b.cerchi.length-1;c>=0;c--){ var ce=b.cerchi[c]; ce.t-=dt; if(ce.t<=0){ anello(ce.x,ce.y,ce.n||8,120,RS()); burst(ce.x,ce.y,8,'#e8b44a'); sfx('moneta');
      if(DM.hypot(P.x-ce.x,P.y-ce.y)<ce.r) colpito(); b.cerchi.splice(c,1); } }
  if(b.beams){ var B=b.beams; B.t-=dt;
    if(B.ph==='tele'){ for(var i=0;i<B.o.length;i++){ var o=B.o[i]; if(!B.fissi) o.a += clamp(DM.atan2(P.y-o.y,P.x-o.x)-o.a,-0.8*dt,0.8*dt); } if(B.t<=0){ B.ph='fuoco'; B.t=B.durata||0.55; sfx('boom',0.5); kick(0.2); if(b.debole && b.debole.occhi) b.debole = null; } }
    else { for(i=0;i<B.o.length;i++){ o=B.o[i]; o.a += (B.sw||0)*dt; var rx=DM.cos(o.a), ry=DM.sin(o.a), px=P.x-o.x, py=P.y-10-o.y, perp=Math.abs(px*(-ry)+py*rx), proj=px*rx+py*ry; if(proj>0 && perp<11+K.PL_R) colpito(); }
      if(B.t<=0) b.beams=null; } }
  if(b.carte){ var CA = b.carte; CA.t += dt;
    if(CA.t > CA.dur){ CA.l.forEach(function(k2){ if(!k2.via){ anello(k2.x,k2.y,10,120,RS()); burst(k2.x,k2.y,10,'#f1e6cf'); } }); sfx('boom',0.6); b.carte = null; } }
  /* il pilota della scena: ogni boss ha il suo ritmo */
  if(b.st==='attesa'){
    if(tipo==='bandito'){ b.x += DM.sin(roomT*0.7)*spd*dt*1.2; b.x += (b.homeX-b.x)*dt*0.3; b.y += (b.homeY-b.y)*dt; }
    else if(tipo==='esattore'){ if(d>150){ b.x+=ux*spd*dt; b.y+=uy*spd*dt; } else { b.x-=ux*spd*0.4*dt; b.y-=uy*spd*0.4*dt; } b.x+=(-uy)*spd*0.4*dt; b.y+=(ux)*spd*0.4*dt; }
    else if(tipo==='croupier'){ b.x = b.homeX + DM.sin(roomT*0.6)*40; b.y += (b.homeY-b.y)*dt; }
    else { b.x = b.homeX + DM.sin(roomT*0.5)*20; b.y += (b.homeY-b.y)*dt; }
    b.cd -= dt*(b.stordito>0?0:1);
    if(b.cd<=0){ var L = b.d.fasi[b.ph].att; b.ai=(b.ai+1)%L.length; var at=L[b.ai];
      b.st='carica_'+at; b.aimA=DM.atan2(dy,dx); b.att=at;
      b.t = ({leva:0.95, carica:0.9, carica2:0.7, jackpot:1.1, occhi:0.95, pioggia:0.6, bocca:0.7, pugno:0.8, tempesta:0.7, monete:0.65, cambiali:0.65, chiama:0.6, conta:0.3,
              ventaglio:0.6, mano:0.7, rastrello:0.8, roulette:0.7, battito:0.7, sangue:0.6, cassaforte:0.5, arterie:0.9})[at] || 0.6; b.t0 = b.t;
      if(at==='leva'){ b.levaT=1; b.tx=P.x; b.ty=P.y; }
      if(at==='monete'||at==='bocca') b.boccaT=1;
      if(at==='jackpot') b.rulli={t:0};
      if(at==='carica2') b.cariche = 2;
      if(at==='occhi'){ var ex2 = b.h*0.17, ey2 = -b.h*0.14 - b.dy; b.beams={ph:'tele',t:0.95,sw:(RS()<0.5?-1:1)*(0.5+b.ph*0.25),o:[{x:b.x-ex2,y:b.y+ey2,a:DM.atan2(P.y-b.y,P.x-b.x+ex2)},{x:b.x+ex2,y:b.y+ey2,a:DM.atan2(P.y-b.y,P.x-b.x-ex2)}]};
        /* PUNTO DEBOLE: le finestre-occhi, accese, prima dei raggi. Colpite, spengono il raggio. */
        b.debole = { occhi:1, chiudi:1, r:16, pts:[[-ex2, ey2],[ex2, ey2]], t:0.95 }; }
      if(at==='arterie'){ var ox = b.x, oy = b.y-b.dy; b.beams = { ph:'tele', t:0.9, fissi:1, sw:(RS()<0.5?-1:1)*0.7, durata:1.8, o:[0,1,2,3].map(function(q){ return { x:ox, y:oy, a:b.spin+q*Math.PI/2 }; }) }; }
      if(at==='pioggia'||at==='sangue'){ var n=(at==='sangue'?8:5)+b.ph*2; for(var q=0;q<n;q++){ var cx = q===0?P.x:rnd(fx0+30,fx1-30), cy = q===0?P.y:rnd(fy0+60,fy1-30); b.cerchi.push({x:cx,y:cy,r:26,t:0.95+q*0.08,m:0.95+q*0.08}); } }
    } }
  else if(b.st.indexOf('carica_')===0){
    b.t-=dt; var at2=b.att;
    if(at2==='carica'||at2==='carica2') b.aimA = b.aimA*0.9 + DM.atan2(dy,dx)*0.1;
    if(at2==='jackpot' && b.rulli) b.rulli.t+=dt;
    if(b.t<=0){
      if(at2==='monete'){ var nf = b.ph>=1?2:1; for(var f=0;f<nf;f++) for(var j=-3;j<=3;j++) eb(b.x,b.y-b.dy*0.4,b.aimA+j*0.16+(f?0.08:0),esp(145+f*30),6,0,1); sfx('moneta'); b.boccaT=0; b.st='attesa'; b.cd=1.4-0.2*b.ph; }
      else if(at2==='leva'){ b.levaT=-0.2; anello(b.tx,b.ty,12+4*b.ph,125); if(b.ph>=2) anello(b.tx,b.ty,10,90,0.3); burst(b.tx,b.ty,20,'#e8b44a'); kick(0.45); sfx('boom',0.9);
        schizzo(b.tx,b.ty,'#3a2410',10); if(DM.hypot(P.x-b.tx,P.y-b.ty)<34){ colpito(true); bossDice('colpisce'); }
        /* PUNTO DEBOLE: dopo la leva la bocca resta inceppata aperta */
        b.stordito=1.7; b.boccaT=1; b.debole = { dx:0, dy:-b.h*0.27, r:24, t:1.7 }; b.st='attesa'; b.cd=1.9; DOPO(1.7, function(){ if(boss) { boss.levaT=0; boss.boccaT=0; } }); }
      else if(at2==='jackpot'){ b.st='jackpot'; b.t=1.6+0.4*b.ph; b.spiT=0; b.rulli=null; banner('☠ ☠ ☠',''); sfx('ruggito'); }
      else if(at2==='chiama'){ var kind = tipo==='esattore' ? 'scagnozzo' : 'fiche', cnt = tipo==='esattore'?2:3; for(var s=0;s<cnt;s++){ var a=RS()*6.283; spawn(kind,b.x+DM.cos(a)*50,b.y+DM.sin(a)*30+20); } b.st='attesa'; b.cd=1.6; }
      else if(at2==='carica'||at2==='carica2'){ b.st='scatto'; b.t=0.6; var v = at2==='carica2'?420:360; b.vx=DM.cos(b.aimA)*v; b.vy=DM.sin(b.aimA)*v; kick(0.15); sfx('scatto'); }
      else if(at2==='cambiali'){ b.st='spirale'; b.t=1.8; b.spiT=0; }
      else if(at2==='tempesta'){ b.st='tempesta'; b.t=2.4; b.spiT=0; }
      else if(at2==='pugno'){ anello(b.x,b.y,16,120); if(b.ph>=1) DOPO(0.26, function(){ if(bossAttivo()) anello(boss.x,boss.y,16,95,0.2); }); kick(0.4); sfx('boom',0.8); burst(b.x,b.y,16,'#3a2410'); b.st='attesa'; b.cd=1.3; }
      else if(at2==='conta'){ /* PUNTO DEBOLE: si ferma a contare, la valigetta aperta */ b.st='conta'; b.t=2.0; b.debole = { dx:0, dy:-b.h*0.3, r:26, t:2.0 }; sfx('moneta'); bossDice('meta'); }
      else if(at2==='occhi'){ b.st='attesa'; b.cd=1.9-0.2*b.ph; }
      else if(at2==='pioggia'||at2==='sangue'){ b.st='attesa'; b.cd=1.5; }
      else if(at2==='bocca'){ var k2 = pick(['scagnozzo','fiche','dinamite','mastino']); spawn(k2,b.x-30,b.y+30); spawn(pick(['fiche','lama']),b.x+30,b.y+30);
        for(var j2=-4;j2<=4;j2++) eb(b.x,b.y-10,DM.atan2(dy,dx)+j2*0.13,esp(135),7,1); sfx('ruggito'); kick(0.3); b.boccaT=0; b.st='attesa'; b.cd=1.8; }
      else if(at2==='ventaglio'){ for(var j3=-3;j3<=3;j3++) eb(b.x,b.y-b.dy,b.aimA+j3*0.14,esp(160),6); DOPO(0.25, function(){ if(bossAttivo()) for(var j4=-3;j4<=3;j4++) eb(boss.x,boss.y-boss.dy,boss.aimA+0.07+j4*0.14,esp(140),6); }); sfx('carta'); b.st='attesa'; b.cd=1.2; }
      else if(at2==='rastrello'){ /* il rastrello: un muro di fiche con un varco che scende verso di te */ var gap = ((RS()*6)|0)-3, pa = b.aimA + Math.PI/2;
        for(var k3=-7;k3<=7;k3++){ if(k3>=gap-1 && k3<=gap+1) continue; eb(b.x+DM.cos(pa)*k3*24, b.y-b.dy*0.4+DM.sin(pa)*k3*24, b.aimA, esp(115), 7, 0, 1); } sfx('moneta'); kick(0.2); b.st='attesa'; b.cd=1.5; }
      else if(at2==='roulette'){ b.st='roulette'; b.t=2.2; b.spiT=0; }
      else if(at2==='mano'){ /* LA MANO: tre carte coperte; l'asso si vede per un attimo. Colpisci l'asso. */
        var pos = [[K.RW*0.25, K.RH*0.62],[K.RW*0.5, K.RH*0.7],[K.RW*0.75, K.RH*0.62]]; if(b.homeY>K.RH*0.55) pos = pos.map(function(p){ return [p[0], K.RH-p[1]]; });
        var giusta = (RS()*3)|0; b.carte = { t:0, dur:5.0, mostra:1.0, l:pos.map(function(p,i){ return { x:p[0], y:p[1], giusta:i===giusta, via:0 }; }) };
        sfx('carta'); bossDice('meta'); b.st='attesa'; b.cd=2.4; }
      else if(at2==='battito'){ b.st='battito'; b.t=1.3; b.spiT=0; b.nb=0; }
      else if(at2==='cassaforte'){ /* PUNTO DEBOLE: la cassaforte del cuore si apre */ b.st='aperta'; b.t=2.3; b.debole = { dx:0, dy:-b.h*0.45, r:28, t:2.3 }; sfx('porta'); kick(0.2); }
      else if(at2==='arterie'){ b.st='attesa'; b.cd=2.4; }
      else { b.st='attesa'; b.cd=1; } } }
  else if(b.st==='scatto'){ b.t-=dt; b.x+=b.vx*dt; b.y+=b.vy*dt;
    if(DM.hypot(P.x-b.x,P.y-b.y)<b.r+K.PL_R){ colpito(true); bossDice('colpisce'); }
    var sbatte = (b.x<fx0+b.r||b.x>fx1-b.r||b.y<fy0+b.r+30||b.y>fy1-b.r);
    for(var pc=0;pc<PROPS.length;pc++){ var pp = PROPS[pc]; if(pp.k==='colonna' && DM.hypot(pp.x-b.x, pp.y-b.y) < pp.r + b.r){ sbatte = 2; colpisciColonna(pp); break; } }
    if(sbatte){ b.t=0; anello(b.x,b.y,8,110,RS()); kick(0.45); sfx('boom',0.8);
      /* PUNTO DEBOLE: la carica a vuoto lo lascia intontito, la schiena scoperta */
      b.stordito = sbatte===2 ? 2.0 : 1.3; b.debole = { dx:0, dy:-b.h*0.35, r:28, t:b.stordito }; b.cariche = 0; }
    if(b.t<=0){ if(b.cariche>1 && !b.stordito){ b.cariche--; b.st='carica_carica2'; b.att='carica2'; b.t=b.t0=0.45; b.aimA=DM.atan2(P.y-b.y,P.x-b.x); } else { b.st='attesa'; b.cd=b.stordito>0?1.8:1.1; b.cariche=0; } } }
  else if(b.st==='spirale'){ b.t-=dt; b.spiT-=dt;
    if(b.spiT<=0){ b.spiT = 0.11; var aa=b.spin*3.2; eb(b.x,b.y-b.dy,aa,esp(125),6); eb(b.x,b.y-b.dy,aa+Math.PI,esp(125),6); if(b.ph>=1){ eb(b.x,b.y-b.dy,aa+Math.PI/2,esp(110),6); } }
    if(b.t<=0){ b.st='attesa'; b.cd=1.2; } }
  else if(b.st==='tempesta'){ b.t-=dt; b.spiT-=dt; if(b.spiT<=0){ b.spiT=0.13; for(var z=0;z<3;z++) eb(b.x,b.y-b.dy,b.spin*2+z*2.094,esp(120),6); } if(b.t<=0){ b.st='attesa'; b.cd=1.0; } }
  else if(b.st==='jackpot'){ b.t-=dt; b.spiT-=dt; if(b.spiT<=0){ b.spiT=0.16; for(var z2=0;z2<4;z2++) eb(b.x,b.y-b.dy*0.5,b.spin*1.7+z2*1.571,esp(118),6,0,1); } if(b.t<=0){ b.st='attesa'; b.cd=1.3; } }
  else if(b.st==='roulette'){ b.t-=dt; b.spiT-=dt; if(b.spiT<=0){ b.spiT=0.22; for(var z3=0;z3<6;z3++){ eb(b.x,b.y-b.dy,b.spin*2.4+z3*1.047,esp(115),6,0,1); eb(b.x,b.y-b.dy,-b.spin*2.4+z3*1.047+0.5,esp(95),6); } } if(b.t<=0){ b.st='attesa'; b.cd=1.3; } }
  else if(b.st==='battito'){ b.t-=dt; b.spiT-=dt; if(b.spiT<=0 && b.nb<3){ b.spiT=0.38; b.nb++; anello(b.x,b.y-b.dy,18,105+b.nb*12,b.nb*0.17); kick(0.25); sfx('boom',0.6); b.sq=1.2; } if(b.t<=0){ b.st='attesa'; b.cd=1.1; } }
  else if(b.st==='conta' || b.st==='aperta'){ b.t-=dt; if(b.t<=0){ b.st='attesa'; b.cd=0.6; b.debole=null; if(b.st==='attesa' && b.tipo==='casa'){ anello(b.x,b.y-b.dy,20,130); sfx('boom',0.8); } } }
  b.x=clamp(b.x,fx0+b.r,fx1-b.r); b.y=clamp(b.y,fy0+b.r+20,fy1-b.r);
  if(bossAttivo() && DM.hypot(P.x-b.x,P.y-b.y)<b.r*0.8+K.PL_R){ colpito(); bossDice('colpisce'); }
}
/* una carta colpita: l'asso stordisce il Croupier e gli scopre la faccia; le altre scoppiano */
function colpisciCarta(bx, by){
  var b = boss; if(!b || !b.carte || b.carte.t < b.carte.mostra) return false;
  for(var i=0;i<b.carte.l.length;i++){ var k = b.carte.l[i]; if(k.via || DM.hypot(bx-k.x, by-k.y) > 18) continue;
    k.via = 1;
    if(k.giusta){ b.stordito = 2.6; b.debole = { dx:0, dy:-b.h*0.72, r:24, t:2.6 }; lampo = 0.6; lampoCol='#fff6c8'; sfx('vinto'); popTesto('L\'ASSO!', k.x, k.y); bossDice('debole', true); b.carte = null; b.cd = Math.max(b.cd, 2.8); }
    else { anello(k.x,k.y,12,125,RS()); burst(k.x,k.y,14,'#b8202e'); sfx('boom',0.6); kick(0.2); }
    return true; }
  return false;
}

/* ══ DISEGNO ══ */
function disegnaBoss(now){
  var b = boss, d = b.d, im = IMG[b.img]; if(!im) return;
  var spr = cuoci(b.img, b.h, 2.2, '#0a0508'); if(!spr) return;
  if(b.st==='morto') return;
  var sc = 1, ofy = 0, clipFeet = false, sip = 0, e = 0, alfa = 1;
  if(b.st==='intro'){ e = clamp((b.t0i - b.t - 0.35)/0.75, 0, 1);
    if(d.ent==='cala'){ ofy = -(1-eOutBack(e))*(b.y+b.h); if(e>0 && e<1 && RV()<0.3) part(b.x+rndV(-20,20), b.y+ofy-b.h, 0, 80, 0.3, '#e8b44a', 2, 1); }
    else if(d.ent==='emerge'){ clipFeet = true; ofy = (1-eOutCubic(e))*b.h*1.05; }
    else if(d.ent==='carte'){ alfa = e; sc = 0.6+0.4*eOutBack(e); if(e>0 && e<1 && RV()<0.5){ var aa0 = RV()*6.283; part(b.x+DM.cos(aa0)*80*(1-e), b.y-b.dy+DM.sin(aa0)*80*(1-e), 0, 0, 0.3, '#f1e6cf', 3); } }
    else { sip = 1-eOutCubic(clamp((b.t0i - b.t - 0.4)/0.9,0,1)); } }
  if(b.st==='trasforma'){ var et = 1 - b.t/1.8; sc = 1 + DM.sin(et*Math.PI)*0.12; }
  var fly = (b.tipo==='casa') ? DM.sin(now/700)*4 : (b.tipo==='croupier' ? DM.sin(now/900)*3 : 0);
  var prog = 0, wind = b.st.indexOf('carica_')===0; if(wind && b.t0) prog = clamp(1 - b.t/b.t0, 0, 1);
  var rit = wind ? prog*9 : 0, ax = P.x-b.x, ay = P.y-b.y, al = DM.hypot(ax,ay)||1;
  if(b.st==='morente' || b.st==='trasforma'){ ctx.save(); ctx.translate(rndV(-4,4), rndV(-3,3)); }
  if(clipFeet){ ctx.save(); ctx.beginPath(); ctx.rect(b.x-b.h, b.y-b.h*1.6, b.h*2, b.h*1.6+8); ctx.clip();
    ctx.fillStyle='rgba(0,0,0,.7)'; ctx.beginPath(); ctx.ellipse(b.x, b.y+4, d.r*1.6*Math.max(0.3,e+0.3), d.r*0.45, 0, 0, 6.283); ctx.fill(); }
  disegnaOmbra(b.x, b.y+4, d.r*1.3*(d.ent==='cala' && b.st==='intro' ? Math.max(0.2, e) : 1));
  ctx.save(); ctx.globalAlpha = alfa; ctx.translate(b.x - ax/al*rit + (b.kx||0), b.y+6 - ay/al*rit*0.6 + ofy + fly + (b.ky||0)); ctx.scale(sc, sc);
  var br = DM.sin(now/420)*0.028; if(b.img==='b_cuore') br = DM.pow(Math.max(0,DM.sin(now/300)),8)*0.07;
  var sx = 1+br, sy = 1-br; if(wind){ var tk = 1+(0.03+0.1*prog)*Math.abs(DM.sin(now/(60-30*prog))); sx/=tk*(1+0.04*prog); sy*=tk; }
  if(b.sq>0){ sx*=1+0.1*b.sq; sy*=1-0.09*b.sq; } if(b.urlo>0){ var u = DM.sin(now/30)*0.03*b.urlo; sx*=1+u; sy*=1-u; }
  if(b.stordito>0){ ctx.rotate(DM.sin(now/50)*0.03); }
  if(b.tipo==='esattore' && b.ph>=1){ sx*=0.94; sy*=1.04; }
  ctx.scale(sx, sy);
  var W = spr.w, H = spr.h, cw = spr.c.width, ch = spr.c.height, pr = d.parti;
  var rett = function(r){ return { x:-W/2 + r[0]*W, y:-H + r[1]*H, w:(r[2]-r[0])*W, h:(r[3]-r[1])*H, sx:r[0]*cw, sy:r[1]*ch, sw:(r[2]-r[0])*cw, sh:(r[3]-r[1])*ch }; };
  var mobili = [];
  if(b.tipo==='bandito') mobili = [ { r:pr.leva, rot:-b.leva*0.9 + DM.sin(now/380)*0.05, px:pr.leva[4], py:pr.leva[5] }, { r:pr.bocca, dy:b.bocca*12, buio:1 } ];
  else if(b.tipo==='esattore') mobili = [ { r:pr.busto, dx:DM.sin(now/300)*1.5, dy:DM.sin(now/420)*2-(wind?4:0) }, { r:pr.borsa, dy:(b.st==='conta'?10:(b.st==='scatto'?-6:DM.sin(now/260)*2)), rot:(b.st==='carica_carica'?-0.15:(b.st==='conta'?0.25:0)) } ];
  else if(b.tipo==='croupier') mobili = [ { r:pr.visiera, dy:(b.stordito>0?-16:DM.sin(now/500)*1.5), rot:(b.stordito>0?-0.25:0) } ];
  else if(b.tipo==='casa' && b.img==='b_casa') mobili = [ { r:pr.bocca, dy:b.bocca*16+DM.sin(now/500)*1.5, buio:1 } ];
  ctx.save(); ctx.beginPath(); ctx.rect(-W/2-4, -H-4, W+8, H+8);
  mobili.forEach(function(m){ var q = rett(m.r); ctx.rect(q.x, q.y, q.w, q.h); });
  ctx.clip('evenodd'); ctx.drawImage(spr.c, -W/2, -H, W, H); ctx.restore();
  mobili.forEach(function(m){ var q = rett(m.r);
    if(m.buio){ ctx.fillStyle='#0a0406'; ctx.fillRect(q.x+q.w*0.08, q.y, q.w*0.84, q.h*0.9); }
    var pvx = m.px!=null ? -W/2 + m.px*W : q.x+q.w/2, pvy = m.py!=null ? -H + m.py*H : q.y+q.h/2;
    ctx.save(); ctx.translate(pvx+(m.dx||0), pvy+(m.dy||0)); if(m.rot) ctx.rotate(m.rot);
    ctx.drawImage(spr.c, q.sx, q.sy, q.sw, q.sh, q.x-pvx, q.y-pvy, q.w, q.h); ctx.restore(); });
  if(b.tipo==='bandito' && (b.rulli || b.st==='jackpot')){ var sp = b.st==='jackpot' ? 0 : Math.floor(b.rulli.t*14);
    for(var q=0;q<3;q++){ var rx = -W/2 + (0.14+q*0.235)*W; ctx.fillStyle='rgba(20,6,12,.75)'; ctx.fillRect(rx, -H*0.64, W*0.2, H*0.2);
      ctx.fillStyle = b.st==='jackpot' ? '#ff3d8b' : '#f1e6cf'; ctx.font='900 '+Math.round(H*0.15)+'px '+FUI; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(b.st==='jackpot' ? '☠' : ['7','♦','☠','♣','$'][(sp+q*2)%5], rx+W*0.1, -H*0.54); } }
  if(b.tipo==='casa' && b.img==='b_casa'){ ctx.save(); ctx.globalAlpha = 0.5+0.5*DM.sin(now/120); var qc = rett(pr.corona);
    ctx.globalCompositeOperation='lighter'; ctx.drawImage(spr.c, qc.sx, qc.sy, qc.sw, qc.sh, qc.x, qc.y, qc.w, qc.h); ctx.restore();
    var gl = (b.beams && b.beams.ph==='tele') ? 1 : 0.35+0.25*DM.sin(now/300);
    ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,61,139,'+(0.35*gl)+')';
    [-1,1].forEach(function(s){ ctx.beginPath(); ctx.ellipse(s*W*0.165, -H*0.66, W*0.09, H*0.1, 0, 0, 6.283); ctx.fill(); });
    ctx.globalCompositeOperation='source-over'; }
  if(b.img==='b_cuore'){ var ap = b.st==='aperta' ? 1 : (b.st==='carica_cassaforte' ? prog : 0); if(!(ap >= 0 && ap <= 1)) ap = 0;
    ctx.save(); ctx.globalCompositeOperation='lighter'; var cg = ctx.createRadialGradient(0,-H*0.45,2,0,-H*0.45,W*(0.12+0.25*ap)); cg.addColorStop(0,'rgba(255,61,139,'+(0.3+0.6*ap)+')'); cg.addColorStop(1,'rgba(255,61,139,0)');
    ctx.fillStyle = cg; ctx.fillRect(-W/2,-H,W,H); ctx.restore(); }
  if(b.ph>=1 && !(b.flash>0) && !b.d.fasi[b.ph].img){ ctx.globalAlpha = b.ph>=2 || b.d.fasi[b.ph].vera ? 0.16+0.12*DM.sin(now/120) : 0.1; ctx.drawImage(b.ph>=2||b.d.fasi[b.ph].vera?spr.rosso:spr.ambra, -W/2, -H, W, H); ctx.globalAlpha=1; }
  if(b.flash>0){ ctx.globalAlpha = Math.min(1,b.flash/0.09)*0.85; ctx.drawImage(spr.bianco, -W/2, -H, W, H); ctx.globalAlpha=1; }
  else if(wind){ ctx.globalAlpha = 0.12+0.5*prog*(0.6+0.4*Math.abs(DM.sin(now/40))); ctx.drawImage(spr.ambra, -W/2, -H, W, H); ctx.globalAlpha=1; }
  if((b.st==='morente'||b.st==='trasforma') && DM.sin(now/40)>0.3){ ctx.globalAlpha = 0.6; ctx.drawImage(spr.bianco, -W/2, -H, W, H); ctx.globalAlpha=1; }
  if(sip>0.001){ var sw2 = W*0.62*sip; ctx.fillStyle='#7a1020'; ctx.fillRect(-W/2-6, -H-10, sw2, H+14); ctx.fillRect(W/2+6-sw2, -H-10, sw2, H+14);
    ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.strokeRect(-W/2-6, -H-10, sw2, H+14); ctx.strokeRect(W/2+6-sw2, -H-10, sw2, H+14);
    ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=2; for(var pl=0;pl<5;pl++){ var px1=-W/2-6+sw2*(pl+0.5)/5, px2=W/2+6-sw2*(pl+0.5)/5; ctx.beginPath(); ctx.moveTo(px1,-H-10); ctx.lineTo(px1,4); ctx.moveTo(px2,-H-10); ctx.lineTo(px2,4); ctx.stroke(); }
    ctx.fillStyle='#e8b44a'; ctx.fillRect(-W/2-10, -H-16, W+20, 8); }
  if(b.stordito>0){ ctx.fillStyle='#e8b44a'; for(var s2=0;s2<3;s2++){ var aa = now/200 + s2*2.09; ctx.font='800 14px '+FUI; ctx.fillText('★', DM.cos(aa)*26, -H-6+DM.sin(aa)*6); } }
  if(wind && prog>0.05){ ctx.save(); ctx.translate(0, -H-14); ctx.scale(0.6+0.8*prog, 0.6+0.8*prog); ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(0,0,11,0,6.283); ctx.fill();
    ctx.fillStyle = prog>0.75 ? '#ff5a5f' : '#e8b44a'; ctx.beginPath(); ctx.arc(0,0,9,0,6.283); ctx.fill(); ctx.fillStyle='#000'; ctx.font='900 15px '+FUI; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('!',0,1); ctx.restore(); }
  ctx.restore();
  if(clipFeet) ctx.restore();
  if(b.st==='morente' || b.st==='trasforma') ctx.restore();
  if(wind && prog<0.95){ ctx.strokeStyle='rgba(255,180,80,'+(0.2+0.5*prog)+')'; ctx.lineWidth=2+3*prog; ctx.beginPath(); ctx.arc(b.x, b.y-b.dy*0.6, d.r*(2.6-1.6*prog), 0, 6.283); ctx.stroke(); }
  if(b.onda>0){ ctx.strokeStyle='rgba(255,61,139,'+(1-b.onda)+')'; ctx.lineWidth=10*(1-b.onda)+2; ctx.beginPath(); ctx.arc(b.x, b.y-b.dy*0.5, 20+b.onda*320, 0, 6.283); ctx.stroke(); }
}
/* sopra a tutto: carte, punto debole, fumetto, barra */
function disegnaPreavvisiBoss(now){
  var b = boss; if(!b || b.st==='morto') return; var cy = b.y-b.dy;
  if(b.st==='carica_carica'||b.st==='carica_carica2'){ ctx.strokeStyle='rgba(255,90,40,'+(0.45+0.45*Math.abs(DM.sin(now/70)))+')'; ctx.lineWidth=6; ctx.setLineDash([12,8]); ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x+DM.cos(b.aimA)*260,b.y+DM.sin(b.aimA)*260); ctx.stroke(); ctx.setLineDash([]); }
  if(b.st==='carica_leva'){ var f2 = clamp(1-b.t/(b.t0||0.85),0,1); ctx.strokeStyle='rgba(255,90,40,'+(0.5+0.4*Math.abs(DM.sin(now/60)))+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(b.tx,b.ty,34,0,6.283); ctx.stroke();
    ctx.fillStyle='rgba(255,90,40,'+(0.12+0.2*f2)+')'; ctx.beginPath(); ctx.arc(b.tx,b.ty,34*f2,0,6.283); ctx.fill(); }
  if(b.st==='carica_monete'||b.st==='carica_bocca'||b.st==='carica_ventaglio'){ ctx.strokeStyle='rgba(232,180,74,.5)'; ctx.lineWidth=2; ctx.setLineDash([6,6]); for(var j2=-3;j2<=3;j2++){ ctx.beginPath(); ctx.moveTo(b.x,b.y-b.dy*0.4); ctx.lineTo(b.x+DM.cos(b.aimA+j2*0.15)*110,b.y-b.dy*0.4+DM.sin(b.aimA+j2*0.15)*110); ctx.stroke(); } ctx.setLineDash([]); }
  if(b.st==='carica_rastrello'){ var pa = b.aimA+Math.PI/2; ctx.strokeStyle='rgba(232,180,74,'+(0.3+0.4*Math.abs(DM.sin(now/60)))+')'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(b.x-DM.cos(pa)*170, b.y-b.dy*0.4-DM.sin(pa)*170); ctx.lineTo(b.x+DM.cos(pa)*170, b.y-b.dy*0.4+DM.sin(pa)*170); ctx.stroke(); }
  if(b.st==='carica_pugno'||b.st==='carica_battito'){ var f3=clamp(1-b.t/(b.t0||0.7),0,1); ctx.strokeStyle='rgba(255,110,140,'+(0.35+0.5*f3)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(b.x,b.st==='carica_battito'?cy:b.y,b.r+8+f3*50,0,6.283); ctx.stroke(); }
  if(['carica_cambiali','carica_tempesta','carica_roulette','carica_jackpot','carica_sangue','carica_pioggia'].indexOf(b.st)>=0){ ctx.strokeStyle='rgba(255,220,120,'+(0.3+0.5*Math.abs(DM.sin(now/60)))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(b.x,cy,b.r+10,0,6.283); ctx.stroke(); }
  if(b.beams){ b.beams.o.forEach(function(o){ if(b.beams.ph==='tele'){ ctx.strokeStyle='rgba(255,61,139,'+(0.3+0.5*Math.abs(DM.sin(now/60)))+')'; ctx.lineWidth=2; ctx.setLineDash([8,6]); }
      else { ctx.strokeStyle='rgba(255,61,139,.85)'; ctx.lineWidth=16; ctx.setLineDash([]); }
      ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(o.x+DM.cos(o.a)*700,o.y+DM.sin(o.a)*700); ctx.stroke();
      if(b.beams.ph!=='tele'){ ctx.strokeStyle='#fff'; ctx.lineWidth=5; ctx.stroke(); } ctx.setLineDash([]); }); }
  b.cerchi.forEach(function(ce){ var f4 = 1-ce.t/ce.m; ctx.strokeStyle='rgba(232,180,74,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(ce.x,ce.y,ce.r,0,6.283); ctx.stroke(); ctx.fillStyle='rgba(232,180,74,'+(0.1+0.25*f4)+')'; ctx.beginPath(); ctx.arc(ce.x,ce.y,ce.r*f4,0,6.283); ctx.fill(); });
  /* le carte del Croupier: l'asso si vede solo all'inizio */
  if(b.carte){ var CA = b.carte, scop = CA.t < CA.mostra, gira = CA.t < CA.mostra ? 1 : Math.max(0.15, Math.abs(DM.cos(Math.min(1,(CA.t-CA.mostra)/0.25)*Math.PI/2)));
    CA.l.forEach(function(k){ if(k.via) return; ctx.save(); ctx.translate(k.x, k.y); ctx.scale(scop?1:1, 1); var fr = 1-(CA.t-CA.mostra)/(CA.dur-CA.mostra);
      ctx.fillStyle='rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(0,20,18,5,0,0,6.283); ctx.fill();
      ctx.fillStyle='#000'; ctx.fillRect(-15,-22,30,42);
      if(scop){ ctx.fillStyle='#f1e6cf'; ctx.fillRect(-13,-20,26,38); ctx.fillStyle = k.giusta ? '#000' : '#b8202e'; ctx.font='900 20px '+FUI; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(k.giusta?'A♠':'2♥', 0, 0);
        if(k.giusta){ ctx.strokeStyle='rgba(232,180,74,'+(0.5+0.5*DM.sin(now/60))+')'; ctx.lineWidth=3; ctx.strokeRect(-17,-24,34,46); } }
      else { ctx.fillStyle='#7a1020'; ctx.fillRect(-13,-20,26,38); ctx.strokeStyle='#e8b44a'; ctx.lineWidth=1.5; ctx.strokeRect(-10,-17,20,32); ctx.fillStyle='#e8b44a'; ctx.font='800 12px '+FUI; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('?',0,0);
        ctx.fillStyle='rgba(255,90,40,.8)'; ctx.fillRect(-13, 22, 26*Math.max(0,fr), 3); }
      ctx.restore(); }); }
  /* IL PUNTO DEBOLE: un bersaglio che pulsa, ben visibile */
  if(b.debole){ var pts = b.debole.pts || [[b.debole.dx, b.debole.dy]], pu = 0.5+0.5*DM.sin(now/70);
    pts.forEach(function(p){ var x = b.x+p[0], y = b.y+p[1], r = b.debole.r;
      ctx.save(); ctx.globalCompositeOperation='lighter'; var g = ctx.createRadialGradient(x,y,0,x,y,r*1.6); g.addColorStop(0,'rgba(255,246,200,'+(0.35+0.3*pu)+')'); g.addColorStop(1,'rgba(255,200,90,0)'); ctx.fillStyle=g; ctx.fillRect(x-r*1.6,y-r*1.6,r*3.2,r*3.2); ctx.restore();
      ctx.strokeStyle='#000'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(x,y,r*(0.8+0.15*pu),0,6.283); ctx.stroke();
      ctx.strokeStyle='#ffe27a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(x,y,r*(0.8+0.15*pu),0,6.283); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x-r*1.15,y); ctx.lineTo(x-r*0.5,y); ctx.moveTo(x+r*0.5,y); ctx.lineTo(x+r*1.15,y); ctx.moveTo(x,y-r*1.15); ctx.lineTo(x,y-r*0.5); ctx.moveTo(x,y+r*0.5); ctx.lineTo(x,y+r*1.15); ctx.stroke(); }); }
  _popT.forEach(function(p){ var k = p.t/0.9; ctx.save(); ctx.globalAlpha = 1-k*k; ctx.font='900 '+(16+8*(1-k))+'px '+FUI; ctx.textAlign='center'; ctx.fillStyle='#000'; ctx.fillText(p.s, p.x+2, p.y-20-k*30+2); ctx.fillStyle='#fff6c8'; ctx.fillText(p.s, p.x, p.y-20-k*30); ctx.restore(); });
  /* IL FUMETTO: il boss parla */
  if(b.fum && performance.now() - b.fumT0 < b.fumDur){ var el0 = (performance.now()-b.fumT0)/b.fumDur, s0 = el0<0.08 ? eOutBack(el0/0.08) : 1;
    ctx.save(); ctx.font='800 13px '+FUI; var parole = b.fum.split(' '), righe = [], r0 = '';
    parole.forEach(function(w){ if(ctx.measureText(r0+' '+w).width > 170 && r0){ righe.push(r0); r0 = w; } else r0 = r0 ? r0+' '+w : w; }); righe.push(r0);
    var bw = 0; righe.forEach(function(r){ bw = Math.max(bw, ctx.measureText(r).width); }); bw += 18; var bh = righe.length*16+10;
    var fxp = clamp(b.x, fx0+bw/2, fx1-bw/2), fyp = b.y - b.h - 14 - bh; if(fyp < fy0-10){ fyp = b.y + 14; }
    ctx.translate(fxp, fyp+bh/2); ctx.scale(s0, s0);
    ctx.fillStyle='#000'; ctx.beginPath(); ctx.roundRect(-bw/2-2, -bh/2-2, bw+4, bh+4, 10); ctx.fill();
    ctx.fillStyle='#f1e6cf'; ctx.beginPath(); ctx.roundRect(-bw/2, -bh/2, bw, bh, 9); ctx.fill();
    ctx.fillStyle='#1a0c08'; ctx.textAlign='center'; ctx.textBaseline='middle'; righe.forEach(function(r, i){ ctx.fillText(r, 0, -bh/2+13+i*16); });
    ctx.restore(); }
  var bw2 = K.RW-100, bx = 50, by = 8, fr = Math.max(0, b.hp/b.hpMax);
  ctx.fillStyle='#0b060d'; ctx.fillRect(bx-2,by-2,bw2+4,14); ctx.fillStyle= b.ph>=1 && b.d.fasi[b.ph].vera ? '#ff3d8b' : '#b8202e'; ctx.fillRect(bx,by,bw2*fr,10);
  ctx.strokeStyle='#e8b44a'; ctx.lineWidth=1.5; ctx.strokeRect(bx-2,by-2,bw2+4,14);
  b.d.soglie.forEach(function(s){ ctx.fillStyle='#000'; ctx.fillRect(bx+bw2*s-1,by,2,10); });
  ctx.fillStyle='#e8b44a'; ctx.font='400 13px '+FTIT; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(b.d.nm, K.RW/2, by+14);
}
/* la presentazione, sopra la stanza: le luci calano, il cartello col nome */
function disegnaPresentazione(){
  var b = boss, el0 = b.st==='intro' ? b.t0i - b.t : 0;
  var buio = b.st==='intro' ? Math.min(1, el0/0.4)*(b.t<0.35 ? b.t/0.35 : 1)*0.62 : 0.35;
  if(STATO.arena==='esattore' && b.st!=='intro') buio = 0.55;
  if(STATO.arena==='casa' && b.st!=='intro') buio = 0.2+0.12*DM.sin(performance.now()/300);
  var p = aSchermo(b.x, b.y - b.dy*0.6), r = b.h*SC*0.9, pp = aSchermo(P.x, P.y-14);
  var g = ctx.createRadialGradient(p.x, p.y, r*0.4, p.x, p.y, r*2.2); g.addColorStop(0,'rgba(7,3,8,0)'); g.addColorStop(1,'rgba(7,3,8,'+buio+')');
  ctx.fillStyle = g; ctx.fillRect(0,0,CW,CH);
  if(STATO.arena==='esattore' && b.st!=='intro'){ /* senza cappotto: le luci si spengono, resta un occhio di bue su di te */
    ctx.save(); ctx.globalCompositeOperation='destination-out'; var g2 = ctx.createRadialGradient(pp.x,pp.y,10,pp.x,pp.y,110*SC); g2.addColorStop(0,'rgba(0,0,0,.5)'); g2.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g2; ctx.fillRect(0,0,CW,CH); ctx.restore(); }
  if(STATO.arena==='casa' && b.st!=='intro'){ ctx.fillStyle='rgba(184,32,46,'+(0.08+0.06*DM.sin(performance.now()/300))+')'; ctx.fillRect(0,0,CW,CH); }
  if(b.st!=='intro') return;
  var k = clamp((el0-1.0)/0.35, 0, 1); if(k<=0) return;
  var sl = k<1 ? 2.2-1.2*eOutBack(k) : 1, a = b.t<0.3 ? b.t/0.3 : 1, alto = b.homeY < K.RH*0.55;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(CW/2, alto ? CH*0.72 : CH*0.2); ctx.scale(sl, sl); ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(7,3,8,.78)'; ctx.fillRect(-CW*0.46, -34, CW*0.92, 70);
  ctx.strokeStyle='#e8b44a'; ctx.lineWidth=2; ctx.strokeRect(-CW*0.46, -34, CW*0.92, 70);
  ctx.font='400 '+Math.round(Math.min(34, CW*0.075))+'px '+FTIT; ctx.fillStyle='#000'; ctx.fillText(b.d.nm, 2, -6+3); ctx.fillStyle='#e8b44a'; ctx.fillText(b.d.nm, 0, -6);
  ctx.font='700 13px '+FUI; ctx.fillStyle='#f1e6cf'; ctx.fillText(b.d.sub.toUpperCase(), 0, 22); ctx.restore();
}
function saltaPresentazione(){ if(boss && boss.st==='intro' && boss.t0i - boss.t > 0.5) boss.t = Math.min(boss.t, 0.3); }

/* ══════════════════════════════════════════════════════════════════════════
   e_interfaccia.js — HUD, carte alla Reigns, tavolo, pozzo, schermate.
   I tempi sono quelli del REVAMP §6.4: un colpo vinto 433 ms, la porta 117 ms,
   il piatto conta a 12 cifre al secondo (max 400 ms), tempo morto max 600 ms.
   ══════════════════════════════════════════════════════════════════════════ */
function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html!=null) e.innerHTML = html; return e; }
var hud = {
  vPiatto:null,
  tutto:function(){
    if(!VIS || !STATO || !STATO.R) return;
    var R = STATO.R;
    hud.piatto(R.pot);
    $('vPozzo').textContent = eur(R.safe);
    $('vPiano').textContent = STATO.piano+'/9'; $('vPianoNome').textContent = STORIA.PIANI[STATO.piano].nome;
    var cb = R.cb, f = $('cFill'), t = $('cTxt');
    if(cb){ var T = cb.b*R.posta, fr = Math.min(1, ECO.tot(R)/T), cop = ECO.coperta(R);
      f.style.width = (fr*100)+'%'; if(cop && !f.classList.contains('coperta')){ f.classList.add('coperta'); if(STATO.avviata) popFuoriScala('i_cambiale','COPERTA!'); } if(!cop) f.classList.remove('coperta');
      t.innerHTML = 'CAMBIALE <b>'+String(cb.b).replace('.',',')+'×</b> · '+eur(T)+' · premio '+eur(cb.prem*R.posta); }
    else { f.style.width = '0%'; t.innerHTML = 'NESSUNA CAMBIALE · tetto '+eur(ECO.tetto(R)); }
    hud.cuori(); $('vChiavi').textContent = STATO.chiavi;
    var pw = $('poteri'); pw.innerHTML = '';
    var visti = {}; STATO.poteri.forEach(function(id){ visti[id] = (visti[id]||0)+1; });
    for(var id in visti){ var im = el('img'); im.src = ART[PBI[id].img]; im.title = PBI[id].nm; pw.appendChild(im); }
    ['denteOro','dentePiombo','occhioVetro'].forEach(function(k){ if(STATO.flag[k]){ var im = el('img'); im.src = ART[PEGNI[k].img]; im.title = PEGNI[k].nm; pw.appendChild(im); } });
    var bi = $('btnIncassa'); bi.textContent = 'INCASSA '+eur(ECO.tot(R)+(ECO.coperta(R)?R.cb.prem*R.posta:0)); bi.classList.toggle('no', fase==='combat');
    var ig = $('ingr'); ig.innerHTML = ''; for(var i=0;i<STATO.ingranaggi;i++){ var g = el('img'); g.src = ART.i_ingranaggio; ig.appendChild(g); }
  },
  piatto:function(v){
    if(!VIS) return;
    var e = $('vPiatto'); if(hud._pv==null){ hud._pv = v; e.textContent = eur(v); return; }
    if(Math.abs(v-hud._pv)<0.005){ e.textContent = eur(v); return; }
    var da = hud._pv, a = v, t0 = performance.now(), dur = Math.min(400, Math.max(160, Math.abs(a-da)/Math.max(1,a)*1200));
    e.classList.remove('su','giu'); void e.offsetWidth; e.classList.add(a>da?'su':'giu');
    hud._pv = v; var passo = function(){ var k = Math.min(1,(performance.now()-t0)/dur); e.textContent = eur(da+(a-da)*k); if(k<1) requestAnimationFrame(passo); }; passo();
  },
  cuori:function(colpo){
    if(!VIS) return;
    var c = $('cuori'), n = Math.ceil(P.hpMax/2), h = '';
    for(var i=0;i<n;i++){ var v = P.hp - i*2, cls = v>=2 ? '' : (v===1 ? ' mezzo' : ' vuoto'); h += '<div class="cu'+cls+'"><img src="'+ART.i_cuore+'"></div>'; }
    c.innerHTML = h;
    if(colpo){ c.classList.remove('colpo'); void c.offsetWidth; c.classList.add('colpo'); }
  }
};
var _banT = 0;
function banner(t, sub, dur){ if(!VIS) return; t = T_(t); sub = T_(sub); var b = $('banner'); b.innerHTML = t + (sub ? '<small>'+sub+'</small>' : ''); b.classList.add('on'); clearTimeout(_banT); _banT = setTimeout(function(){ b.classList.remove('on'); }, (dur||1.4)*1000); }
function popFuoriScala(img, txt){ if(!VIS) return; txt = T_(txt); var p = el('div','pop'); p.innerHTML = (img?'<img src="'+ART[img]+'">':'')+'<span>'+txt+'</span>'; document.body.appendChild(p); setTimeout(function(){ p.remove(); }, 650); }
function popPiccolo(img, txt){ if(!VIS) return; var p = el('div','pop'); p.style.fontSize='30px'; p.innerHTML = '<img style="width:40px;height:40px" src="'+ART[img]+'"><span>'+txt+'</span>'; document.body.appendChild(p); setTimeout(function(){ p.remove(); }, 650); }
function flash(col, a){ if(!VIS) return; var l = $('lampo'); l.style.background = col||'#fff'; l.style.transition='none'; l.style.opacity = a||0.8; void l.offsetWidth; l.style.transition='opacity .2s'; l.style.opacity = 0; }
function scuoti(elm, px){ elm.animate([{transform:elm.style.transform+' translate(0,0)'},{transform:'translate(calc(-50% + '+px+'px),-50%)'},{transform:'translate(calc(-50% - '+px+'px),-50%)'},{transform:'translate(-50%,-50%)'}],{duration:120}); }

/* ══ LA CARTA ══ */
var CARTA = null;
function apriCarta(o){
  STATO.carta = true; IN.mvx=IN.mvy=0; IN.aon=false; IN.ax=IN.ay=0;
  var c = $('carta'), pe = o.chi ? STORIA.P[o.chi] : null;
  c.className = ''; void c.offsetWidth; c.className = 'entra';
  c.querySelector('.cornice').style.backgroundImage = 'url('+ART.u_cornice+')';
  var img = $('cImg'); img.src = pe ? ART[pe.img] : ''; img.style.display = pe ? '' : 'none';
  var rt = c.querySelector('.ritr'); rt.style.width = o.piccolo ? '38%' : '58%'; rt.style.maxHeight = o.piccolo ? '22vh' : '36vh'; img.style.maxHeight = o.piccolo ? '22vh' : '36vh';
  $('cNome').textContent = T_(o.nome || (pe ? pe.nm : '')); $('cNome').style.color = pe ? pe.col : '';
  scrivi($('cTesto'), o.testo || '');
  var sc = $('cScelte'); sc.innerHTML = '';
  if(o.corpo) sc.appendChild(o.corpo);
  azReset(); AZ_GEN++;
  (o.scelte||[]).forEach(function(s, i){ var b = el('button','scelta'+(s.cls?' '+s.cls:''), T_(s.t) + (s.sub ? '<small>'+T_(s.sub)+'</small>' : ''));
    var k = azAdd(function(arg, a){ sfx('carta'); s.fai(i, a, arg); }, s.arg);
    b.onclick = function(){ $('carta')._due = null; premi(k); }; sc.appendChild(b); });
  $('velo').classList.add('on'); sfx('carta'); CARTA = o;
  /* la carta si può anche SPINGERE a sinistra o a destra, come in Reigns, quando le scelte sono due */
  var bt = sc.querySelectorAll('.scelta'); c._due = (bt.length===2 && !o.corpo) ? bt : null;
}
(function(){
  var c = $('carta'), x0 = null, dx = 0;
  c.addEventListener('pointerdown', function(e){ if(!c._due || e.target.closest('button')) return; x0 = e.clientX; dx = 0; });
  window.addEventListener('pointermove', function(e){
    var im = $('cImg'), r = c.getBoundingClientRect();
    if(!c.classList.contains('off')){ var px = (e.clientX-(r.left+r.width/2))/r.width, py = (e.clientY-(r.top+r.height/2))/r.height;
      im.style.translate = (px*-8)+'px '+(py*-5)+'px'; c.querySelector('.aura').style.translate = (px*6)+'px '+(py*4)+'px'; }
    if(x0==null) return; dx = e.clientX - x0; c.style.rotate = (dx/18)+'deg'; c.style.translate = dx*0.4+'px 0';
    if(c._due){ c._due[0].classList.toggle('oro', dx<-50); c._due[1].classList.toggle('oro', dx>50); } });
  window.addEventListener('pointerup', function(){ if(x0==null) return; var d = dx; x0 = null; c.style.rotate = ''; c.style.translate = '';
    if(c._due && Math.abs(d)>80){ var b = c._due[d<0?0:1]; c._due = null; b.click(); } });
})();
function chiudiCarta(lato, poi){
  var c = $('carta'); c.className = lato ? (lato<0 ? 'via-s' : 'via-d') : 'via-d';
  azReset(); AZ_GEN++;
  DOPO(0.24, function(){ c.className = 'off'; $('velo').classList.remove('on'); STATO.carta = false; CARTA = null; if(poi) poi(); });
}
/* un bottone aggiunto a una carta già aperta (AVANTI dopo una scelta) */
function bottoneCarta(sc, testo, cls, fn){ var b = el('button', cls, T_(testo)); var k = azAdd(fn); b.onclick = function(){ premi(k); }; sc.appendChild(b); return k; }
var _scrT = 0;
function scrivi(elm, testo){ if(!VIS) return; testo = T_(testo); clearInterval(_scrT); var i = 0, tot = testo.length; elm.textContent = '';
  var fine = function(){ clearInterval(_scrT); elm.textContent = testo; elm.onclick = null; };
  elm.onclick = fine; _scrT = setInterval(function(){ i += 3; if(i>=tot){ fine(); return; } elm.textContent = testo.slice(0,i); if(i%9===0) sfx('tic'); }, 16); }

/* un evento della storia: scelte alla Reigns, conseguenze vere */
function apriEvento(id, poi){
  var ev = STORIA.EV[id]; if(!ev){ if(poi) poi(); return; }
  var sc = typeof ev.scelte==='function' ? ev.scelte(GAPI) : ev.scelte; if(PAGATE[id]) sc = sc.concat(PAGATE[id](GAPI));
  apriCarta({ chi:ev.chi, testo:ev.testo(GAPI), scelte:sc.map(function(s, i){ return { t:s.t, sub:s.sub, fai:function(ii, bt){ if(s.cost){ if(!spendi(s.cost)){ banner('NON BASTA', 'servono '+eur(s.cost)+' nella borsa', 1.3); sfx('chiusa'); if(bt) bt.usato = 0; return; } sfx('moneta'); }
      STATO.scelte.push(id+':'+i); GAPI.nota=''; s.fx(GAPI); var es = typeof s.esito==='function' ? s.esito(GAPI) : s.esito;
      hud.tutto(); disegnaMini();
      if(STATO.finito) return;
      var sc2 = $('cScelte'); sc2.innerHTML = ''; scrivi($('cTesto'), es);
      azReset(); AZ_GEN++; var kb = bottoneCarta(sc2, 'AVANTI', 'scelta piccola oro', function(){ chiudiCarta(i%2?1:-1, poi); });
      pilotaClic(350, kb);
    } }; }) });
  pilotaClic(450, function(){
    var ok = []; sc.forEach(function(s, i){ if(!s.cost || (PIL.pol==='spende' && STATO.R.pot >= s.cost)) ok.push(i); });
    var i = id==='esattore_boss' ? ok.filter(function(k){ return !sc[k].cost && !/borsa/.test(sc[k].t); }).pop() : ok[pilotaScelta(id, ok.length)];
    if(i==null) i = ok[0]; return i; });
}

/* ══ IL TAVOLO: una carta, tre porte, la forma della scommessa scritta sopra ══ */
function chiediScendi(){
  var n = STATO.piano+1, pz = MAPPA.list.some(function(r){ return r.t==='pozzo' && !r.fatto; });
  apriCarta({ chi:'bot', piccolo:1, nome:'▼ PIANO '+n+' · '+STORIA.PIANI[n].nome, testo:(pz?'Il pozzo di questo piano è ancora da usare. ':'')+'Di sotto il denaro è più vecchio, e la gente più sporca.',
    scelte:[ { t:'SCENDI', cls:'oro', fai:function(){ chiudiCarta(1, function(){ scendi(); }); } }, { t:'RESTA', fai:function(){ chiudiCarta(-1); } } ] });
  pilotaClic(300, function(){ return pilotaMeta()==null?0:1; });
}
/* IL REGISTRO (il libro di Sol Cesto): le probabilità attive, scritte. La fortuna è un bilancio consultabile. */
function apriMappa(){ if(!MAPPA) return; $('mappaG').classList.remove('off'); $('mTit').textContent = T_('PIANO')+' '+STATO.piano+' · '+STORIA.PIANI[STATO.piano].nome; STATO.mappaAperta = 1; disegnaMappaGrande(); }
function chiudiMappa(){ $('mappaG').classList.add('off'); STATO.mappaAperta = 0; }

/* ══ LA MAPPA: si riempie. Ogni stanza nuova entra crescendo (180 ms). ══ */
var COL_STANZA = { start:'#3a2a40', combat:'#5a2a36', tavolo:'#1f5a3a', dialogo:'#4a3060', pozzo:'#27445a', negozio:'#6a4a1c', tesoro:'#7a5a14', segreta:'#3a3a3a', boss:'#7a1420' };
function disegnaCelle(g, W, H, cs, gp, grande){
  var now = performance.now(), L = MAPPA.list, minx=9,maxx=0,miny=8,maxy=0;
  L.forEach(function(r){ if(!r.vista) return; minx=Math.min(minx,r.x); maxx=Math.max(maxx,r.x); miny=Math.min(miny,r.y); maxy=Math.max(maxy,r.y); });
  if(minx>maxx){ minx=maxx=4; miny=maxy=4; }
  var cw = (maxx-minx+1)*(cs+gp), ch = (maxy-miny+1)*(cs*0.72+gp), ox = (W-cw)/2 - minx*(cs+gp), oy = (H-ch)/2 - miny*(cs*0.72+gp), rh = cs*0.72;
  L.forEach(function(r){ if(!r.vista) return; var x = ox + r.x*(cs+gp), y = oy + r.y*(rh+gp);
    for(var i=0;i<4;i++){ var o = vicino(r,i); if(o && o.vista && !(o.nascosta) && i<2){ g.fillStyle='#8a6a3a'; if(i===0) g.fillRect(x+cs/2-1.5, y-gp, 3, gp); else g.fillRect(x+cs, y+rh/2-1.5, gp, 3); } } });
  L.forEach(function(r){ if(!r.vista) return; var x = ox + r.x*(cs+gp), y = oy + r.y*(rh+gp);
    var age = (now - (r.scoperta||0))/180, s = age<1 ? eOutBack(Math.max(0,age)) : 1; if(age<0) return;
    g.save(); g.translate(x+cs/2, y+rh/2); g.scale(s, s);
    var col = r.vis ? COL_STANZA[r.t] : '#1a1016'; if(r.t==='combat' && r.vis && r.cl) col = '#3a2430';
    g.fillStyle = col; g.fillRect(-cs/2, -rh/2, cs, rh);
    g.strokeStyle = r===ROOM ? '#f1e6cf' : (r.vis ? '#e8b44a' : '#6a4a2a'); g.lineWidth = r===ROOM ? 2.5 : 1.2; g.strokeRect(-cs/2+0.5, -rh/2+0.5, cs-1, rh-1);
    var ic = (r.t!=='combat' && (r.vis || r.t==='boss' || grande || STATO.flag.occhioVetro)) ? ICONE[r.t] : (r.vis ? '' : '?');
    if(r.t==='combat' && r.vis && !r.cl) ic = '⚔';
    if(ic){ g.fillStyle = r.t==='boss' ? '#ff5a5f' : '#e8b44a'; g.font = '800 '+Math.round(rh*0.62)+'px '+FUI; g.textAlign='center'; g.textBaseline='middle'; g.fillText(ic, 0, 1); }
    if((r.t==='tavolo'||r.t==='pozzo'||r.t==='dialogo') && r.fatto){ g.strokeStyle='#58d68d'; g.lineWidth=2; g.beginPath(); g.moveTo(cs*0.2,-rh*0.3); g.lineTo(cs*0.32,-rh*0.14); g.lineTo(cs*0.46,-rh*0.44); g.stroke(); }
    g.restore(); });
  if(STATO.mappaAperta || grande) return;
}
function disegnaMini(){
  if(!VIS) return;
  var c = $('mini'), d = Math.min(2, window.devicePixelRatio||1), w = c.clientWidth||84, h = c.clientHeight||44;
  if(c.width !== Math.round(w*d)){ c.width = Math.round(w*d); c.height = Math.round(h*d); }
  var g = c.getContext('2d'); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,w,h); if(!MAPPA) return;
  disegnaCelle(g, w, h, 13, 2, false);
}
function disegnaMappaGrande(){
  var c = $('mapCv'), d = Math.min(2, window.devicePixelRatio||1), w = c.clientWidth, h = c.clientHeight;
  c.width = Math.round(w*d); c.height = Math.round(h*d); var g = c.getContext('2d'); g.setTransform(d,0,0,d,0,0);
  g.fillStyle = '#0b060d'; g.fillRect(0,0,w,h);
  disegnaCelle(g, w, h, Math.min(46, w/7.5), 6, true);
  g.fillStyle='#bdb09a'; g.font='600 12px '+FUI; g.textAlign='left'; g.textBaseline='bottom';
  g.fillText('♠ tavolo · ◍ pozzo · ✦ incontro · ♛ tesoro · ⚖ pegni · ☠ boss · ? da scoprire', 8, h-6);
  if(STATO.mappaAperta) requestAnimationFrame(function(){ if(STATO.mappaAperta) disegnaMappaGrande(); });
}

/* ══ SCHERMATE ══ */
function schermo(html, cls){ var s = $('schermo'); s.className = cls||''; s.innerHTML = html; s.scrollTop = 0; return s; }
function chiudiSchermo(){ $('schermo').className = 'off'; $('schermo').innerHTML = ''; }
function saldo(v){ if(v===undefined){ var s = parseFloat(store('saldo')); return isNaN(s) ? 1000 : s; } store('saldo', String(Math.round(v*100)/100)); }
function guida(){
  if(typeof LINGUA!=='undefined' && LINGUA && LINGUA.__guida){ schermo(LINGUA.__guida); $('bInd').onclick = titolo; return; }
  schermo('<div class="col"><div class="grande">COME SI GIOCA</div><div class="guida">'+
    '<h3>La notte</h3><p>Sei il <b>Gambler Bot</b>, la macchina che la famiglia manda giù a riscuotere. Nove piani, in fondo <b>la Casa</b>.</p>'+
    '<h3>La porta</h3><p>Scegli la <b>posta</b>. La porta trattiene il 5%: il resto è la tua <b>BORSA</b>, soldi a rischio fino all’uscita.</p>'+
    '<h3>Il piano</h3><p>Stanze collegate che scopri camminando. Le porte dicono cosa c’è di là: ♠ il <b>tavolo</b> (una pila di fiche e la botola per scendere), ◍ il <b>pozzo</b>, ✦ un <b>incontro</b>, ♛ il <b>tesoro</b> (serve una chiave), ⚖ il <b>monte dei pegni</b>, ☠ il <b>boss</b>. C’è anche una stanza <b>segreta</b>: cerca le crepe nei muri e sparaci.</p>'+
    '<h3>Il combattimento</h3><p>Levetta sinistra cammini, destra spari <b>dove punti</b> (su PC: WASD e frecce, o il mouse). SCATTO per schivare. Più scendi, più il Palazzo morde: più nemici, più veloci, più colpi.</p>'+
    '<h3>I soldi</h3><p>Nemici, tavoli, boss e segrete lasciano soldi, sempre di più più scendi. Li <b>spendi</b> al monte dei pegni (poteri, cuori, chiavi) o li <b>salvi nel pozzo</b> (dal piano 3). Nel pozzo vanno solo i soldi trovati: la posta resta in borsa fino all’uscita. Quello che è nel pozzo è tuo anche se cadi.</p>'+
    '<h3>Se cadi</h3><p>Perdi la borsa, tieni il pozzo.</p>'+
    '<h3>Incassa</h3><p>Quando vuoi, fuori dal combattimento: esci con borsa + pozzo. Tetto: 500 volte la posta, mai oltre € 5.000.</p>'+
    '<h3>Il conto lo fa il banco</h3><p>Mentre giochi la mini app manda al banco i tuoi comandi. Alla fine il banco rigioca la tua notte, passo per passo, con lo stesso gioco: paga quello che risulta a lui. Se la rete cade il gioco si ferma e riparte da solo.</p>'+
    '<h3>Se esci a metà</h3><p>La notte resta aperta 30 minuti: rientra dal banner e riprendi da dove eri (al massimo 3 volte). Dopo 30 minuti si chiude da sola come una caduta: il pozzo è tuo, la borsa resta giù.</p>'+
    '<h3>Allenati</h3><p>ALLENATI è gratis: stessa notte, soldi finti.</p>'+
    '<h3>Le scelte</h3><p>I personaggi cambiano la storia: stanze che si aprono, amici che tornano, nemici che ti aspettano, finali diversi.</p></div>'+
    '<button class="btn" id="bInd">INDIETRO</button></div>');
  $('bInd').onclick = titolo;
}
function versus(tipo, poi){
  var d = BD[tipo], s = el('div'); s.style.cssText = 'position:fixed;inset:0;z-index:35;background:#0d0710e8;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none';
  s.innerHTML = '<div style="display:flex;align-items:flex-end;gap:4vw;width:94%;justify-content:center"><img src="'+ART.p_mascotte+'" style="height:30vh;animation:vsA .45s cubic-bezier(.2,1.6,.4,1)"><div style="font-family:var(--tit);font-size:44px;color:#ff5a5f;text-shadow:0 4px 0 #000;animation:slam .5s cubic-bezier(.2,1.7,.4,1)">VS</div><img src="'+ART[d.img]+'" style="height:36vh;animation:vsB .45s cubic-bezier(.2,1.6,.4,1)"></div>'+
    '<div style="font-family:var(--tit);font-size:34px;color:#e8b44a;text-shadow:0 4px 0 #000;margin-top:14px">'+d.nm+'</div><div style="font-size:15px;letter-spacing:.14em;color:#bdb09a">'+d.sub.toUpperCase()+'</div>'+
    '<style>@keyframes vsA{from{transform:translateX(-60vw)}} @keyframes vsB{from{transform:translateX(60vw)}}</style>';
  document.body.appendChild(s); sfx('ruggito');
  setTimeout(function(){ s.style.transition='opacity .2s'; s.style.opacity=0; setTimeout(function(){ s.remove(); if(poi) poi(); }, 200); }, 1300);
}
function visBoss(tipo){ var f0 = fase; fase='pausa'; versus(tipo, function(){ fase='combat'; }); }
var SCHERMATA_VIA = null;
function schermataPiano(n, poi){
  var z = STORIA.PIANI[n].zona, atti = ['ATTO I · I SALONI','ATTO II · LE CUCINE','ATTO III · IL CAVEAU','LA CASA'];
  var s = el('div'); s.style.cssText = 'position:fixed;inset:0;z-index:34;background:#070308;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer';
  s.innerHTML = '<div style="font-size:14px;letter-spacing:.3em;color:#bdb09a;opacity:0;animation:appare .3s .05s forwards">'+T_(atti[z])+'</div><div style="font-family:var(--tit);font-size:46px;color:#e8b44a;text-shadow:0 4px 0 #000;animation:slam .45s cubic-bezier(.2,1.7,.4,1)">▼ '+T_('PIANO')+' '+n+'</div><div style="font-family:var(--tit);font-size:22px;color:#f1e6cf;opacity:0;animation:appare .3s .15s forwards">'+T_(STORIA.PIANI[n].nome)+'</div>';
  document.body.appendChild(s); sfx('scendi');
  var fatto = false, via = function(){ if(fatto) return; fatto = true; SCHERMATA_VIA = null; s.style.transition='opacity .18s'; s.style.opacity=0; setTimeout(function(){ s.remove(); }, 180); poi(); };
  SCHERMATA_VIA = via; s.onclick = function(){ if(!fatto) COMANDO('salta'); }; DOPO(1.1, via);
}
/* ══ IL BANCO DEI BOT: la demo è anche il banco di prova ══ */

/* ══════════════════════════════════════════════════════════════════════════
   g_titolo.js — LA SCHERMATA INIZIALE e LA PORTA.
   Il titolo è una scena viva a strati: cielo e pioggia lontana, la facciata del
   Palazzo (finestre che si accendono, occhi che pulsano, la bocca che respira),
   la nebbia, il Gambler Bot davanti alla porta (respira, lo schermo guarda e
   sbatte, il cappello si muove, rigira una fiche), il primo piano coi lampioni,
   la pioggia vicina. Parallasse col dito/mouse. ENTRA: la camera entra nella bocca.
   ══════════════════════════════════════════════════════════════════════════ */
var FINESTRE = [[0.4031, 0.093, 0.0246, 0.01], [0.5992, 0.093, 0.0231, 0.01], [0.4046, 0.0975, 0.0215, 0.009], [0.5985, 0.098, 0.0215, 0.008], [0.4046, 0.1055, 0.0246, 0.015], [0.5985, 0.105, 0.0215, 0.014], [0.4046, 0.119, 0.0246, 0.018], [0.5992, 0.12, 0.02, 0.016], [0.5554, 0.2065, 0.0092, 0.007], [0.4462, 0.2065, 0.0092, 0.005], [0.4462, 0.2165, 0.0092, 0.009], [0.5554, 0.216, 0.0092, 0.008], [0.4469, 0.2315, 0.0108, 0.017], [0.5562, 0.2285, 0.0108, 0.009], [0.5562, 0.2365, 0.0108, 0.007], [0.4077, 0.2455, 0.0185, 0.011], [0.2354, 0.605, 0.0369, 0.006], [0.7638, 0.605, 0.0354, 0.006], [0.7646, 0.6125, 0.0369, 0.015], [0.2354, 0.614, 0.04, 0.014], [0.8354, 0.617, 0.0308, 0.006], [0.1662, 0.626, 0.0308, 0.016], [0.2354, 0.6255, 0.04, 0.015], [0.7646, 0.625, 0.0369, 0.014], [0.8369, 0.627, 0.0308, 0.014], [0.1662, 0.639, 0.0308, 0.014], [0.2346, 0.6435, 0.0385, 0.021], [0.8369, 0.6395, 0.0308, 0.013], [0.7654, 0.6445, 0.0385, 0.021], [0.1654, 0.653, 0.0292, 0.018], [0.8377, 0.6535, 0.0323, 0.017], [0.2277, 0.732, 0.0369, 0.004], [0.7731, 0.733, 0.0385, 0.006], [0.2277, 0.7475, 0.0369, 0.027], [0.7731, 0.741, 0.0385, 0.014], [0.1592, 0.75, 0.0354, 0.024], [0.8423, 0.751, 0.0354, 0.026], [0.7731, 0.7535, 0.0385, 0.015], [0.2262, 0.769, 0.0369, 0.018], [0.7738, 0.769, 0.04, 0.016], [0.1569, 0.773, 0.0369, 0.018], [0.8431, 0.774, 0.0369, 0.016], [0.5008, 0.896, 0.0969, 0.008], [0.5015, 0.903, 0.0985, 0.004], [0.5008, 0.926, 0.1338, 0.04], [0.5, 0.9595, 0.1569, 0.025], [0.5, 0.9855, 0.2123, 0.029]];
var TT = { on:false, t0:0, cv:null, g:null, W:0, H:0, px:0, py:0, tpx:0, tpy:0, entra:0, fatto:null, gocce:[], nebbia:[], fiche:null, ciglio:2, guardo:{x:0,y:0,tx:0,ty:0,t:0}, cappello:0, luci:null };
/* le parti della mascotte (frazioni dell'immagine p_mascotte) */
var MASC = { occhi:[[0.491,0.578,0.244,0.290],[0.708,0.788,0.243,0.289]], schermo:[0.46,0.81,0.215,0.325],
             cappello:[[0,0],[1,0],[1,0.155],[0.82,0.15],[0.30,0.185],[0.20,0.25],[0,0.262]], fiche:[0.70,0.54] };

function titolo(){
  suono.musica(null); $('mappaG').classList.add('off');
  var s = schermo(
    '<div id="tit"><canvas id="tcv"></canvas>'+
    '<img class="tlogo" src="'+ART.l_logo+'" alt="GAMBLER\'S RUN">'+
    '<div class="tbtn">'+
      (typeof OSPITE!=='undefined' ? OSPITE.bottoni() :
      '<button class="insegna" id="bEntra"><i class="lampadine"></i><span>ENTRA NEL PALAZZO</span></button>'+
      '<div class="tsec"><button class="targa" id="bGuida">COME SI GIOCA</button><button class="targa" id="bBanco">BANCO DEI BOT</button></div>'+
      '<div class="tsaldo">saldo finto <b>'+eur(saldo())+'</b></div>')+
    '</div><div id="tnero"></div></div>', 'titolo');
  TT.cv = $('tcv'); TT.g = TT.cv.getContext('2d'); TT.t0 = performance.now(); TT.entra = 0; TT.fatto = null;
  TT.luci = FINESTRE.map(function(f){ return { f:f, a:RV()<0.6?1:0, t:RV()*4, fl:RV()*6.28 }; });
  TT.gocce = []; for(var i=0;i<(LITE?50:140);i++) TT.gocce.push(goccia(true));
  TT.nebbia = []; for(i=0;i<7;i++) TT.nebbia.push({ x:RV(), y:0.72+RV()*0.2, r:0.25+RV()*0.25, v:(RV()-0.5)*0.012, c:RV()<0.5 });
  misuraTit();
  var tit = $('tit');
  tit.addEventListener('pointermove', function(e){ var r = tit.getBoundingClientRect(); TT.tpx = (e.clientX-r.left)/r.width-0.5; TT.tpy = (e.clientY-r.top)/r.height-0.5; });
  tit.addEventListener('pointerdown', function(e){ suono.sblocca(); if(performance.now()-TT.t0<1600 && !e.target.closest('button')) TT.t0 = performance.now()-1600; });
  if(!TT.on){ TT.on = true; requestAnimationFrame(disegnaTit); }
  if(typeof OSPITE!=='undefined') OSPITE.cablaTitolo();
  else $('bEntra').onclick = function(){ if(TT.entra) return; suono.sblocca(); sfx('porta'); setTimeout(function(){ sfx('scendi'); }, 200); TT.cappello = performance.now(); TT.entra = performance.now(); TT.fatto = laPorta; };
  $('bGuida').onclick = function(){ sfx('carta'); TT.on = false; guida(); };
  $('bBanco').onclick = function(){ sfx('carta'); TT.on = false; banco(20000); };
  window.addEventListener('resize', misuraTit);
  if(MODE.pilota) setTimeout(function(){ var b = $('bRiprendi') || $('bEntra') || $('bProva'); if(b) b.click(); }, 1900);
}
function misuraTit(){ if(!TT.cv || !TT.cv.isConnected) return; var r = TT.cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio||1);
  TT.W = r.width; TT.H = r.height; TT.cv.width = Math.round(TT.W*d); TT.cv.height = Math.round(TT.H*d); TT.g.setTransform(d,0,0,d,0,0); }
function goccia(sparsa){ return { x:RV()*1.2-0.1, y:sparsa?RV():-0.05, v:0.9+RV()*0.8, l:0.02+RV()*0.035, z:RV() }; }
function disegnaTit(now){
  if(!TT.on || !TT.cv || !TT.cv.isConnected){ TT.on = false; return; }
  requestAnimationFrame(disegnaTit);
  var g = TT.g, W = TT.W, H = TT.H, t = (now - TT.t0)/1000, k;
  if(!W) { misuraTit(); return; }
  TT.tpx += (DM.sin(t*0.23)*0.08 - TT.tpx)*0.002; TT.px += (TT.tpx-TT.px)*0.06; TT.py += (TT.tpy-TT.py)*0.06;
  /* la camera: all'ENTRA si tuffa nella bocca del Palazzo */
  var zoom = 1, ez = 0; if(TT.entra){ ez = Math.min(1, (now-TT.entra)/1150); zoom = 1 + DM.pow(Math.max(0,(ez-0.3)/0.7),2.2)*7; }
  var fw = Math.min(W*1.25, H*1.1*650/1000), fh = fw*1000/650, porta = { x:W/2, y:H*0.62 }, fy = porta.y - 0.785*fh;
  g.save(); g.fillStyle = '#0a0510'; g.fillRect(0,0,W,H);
  g.translate(porta.x, porta.y); g.scale(zoom, zoom); g.translate(-porta.x, -porta.y);
  /* 1 · cielo e pioggia lontana */
  var cg = g.createLinearGradient(0,0,0,H); cg.addColorStop(0,'#1a0a1e'); cg.addColorStop(0.5,'#0d0710'); g.fillStyle = cg; g.fillRect(-W,-H,W*3,H*3);
  g.strokeStyle = 'rgba(191,227,230,.12)'; g.lineWidth = 1; g.beginPath();
  for(k=0;k<TT.gocce.length;k+=2){ var d0 = TT.gocce[k]; if(d0.z>0.5) continue; var x0 = d0.x*W - TT.px*8, y0 = d0.y*H; g.moveTo(x0,y0); g.lineTo(x0-3, y0+d0.l*H*0.6); } g.stroke();
  /* 2 · la facciata: respira appena, parallasse lenta */
  var br = 1 + DM.sin(t*0.9)*0.004, fx = porta.x - fw/2 - TT.px*14, fyy = fy - TT.py*8;
  g.save(); g.translate(porta.x, porta.y); g.scale(br, br); g.translate(-porta.x, -porta.y);
  if(IMG.t_facciata) g.drawImage(IMG.t_facciata, fx, fyy, fw, fh);
  /* le finestre: si accendono e si spengono, tremano */
  g.globalCompositeOperation = 'lighter';
  for(k=0;k<TT.luci.length;k++){ var L = TT.luci[k]; L.t -= 1/60; if(L.t<0){ L.a = RV()<0.7?1:0; L.t = 1+RV()*5; }
    var fl = L.a*(0.55+0.45*DM.sin(now/90+L.fl)*DM.sin(now/217+L.fl)); if(fl<0.05) continue;
    var wx = fx+L.f[0]*fw, wy = fyy+L.f[1]*fh, wr = Math.max(L.f[2]*fw, L.f[3]*fh)*1.4+4;
    var gl = g.createRadialGradient(wx,wy,0,wx,wy,wr); gl.addColorStop(0,'rgba(255,90,170,'+(0.55*fl)+')'); gl.addColorStop(1,'rgba(255,61,139,0)'); g.fillStyle = gl; g.fillRect(wx-wr,wy-wr,wr*2,wr*2); }
  /* gli occhi del Palazzo pulsano */
  var po = 0.5+0.5*DM.sin(t*1.7);
  [[0.285,0.333],[0.715,0.333]].forEach(function(o){ var ex = fx+o[0]*fw, ey = fyy+o[1]*fh, er = fw*0.13;
    var gl = g.createRadialGradient(ex,ey,er*0.2,ex,ey,er*1.3); gl.addColorStop(0,'rgba(255,61,139,'+(0.12+0.18*po)+')'); gl.addColorStop(1,'rgba(255,61,139,0)'); g.fillStyle = gl; g.fillRect(ex-er*1.3,ey-er*1.3,er*2.6,er*2.6); });
  /* la bocca: respira luce calda dal fondo */
  var bx = fx+0.5*fw, by = fyy+0.785*fh, bw = fw*0.15, bre = 0.5+0.5*DM.sin(t*1.25);
  var gb = g.createRadialGradient(bx,by+bw*0.3,4,bx,by,bw*1.6); gb.addColorStop(0,'rgba(255,170,90,'+(0.18+0.22*bre+ez*0.6)+')'); gb.addColorStop(1,'rgba(255,120,60,0)'); g.fillStyle = gb; g.fillRect(bx-bw*1.6,by-bw*1.6,bw*3.2,bw*3.2);
  g.globalCompositeOperation = 'source-over';
  g.restore();
  /* 3 · la nebbia che striscia sul selciato */
  for(k=0;k<TT.nebbia.length;k++){ var n = TT.nebbia[k]; n.x += n.v/60; if(n.x<-0.4) n.x = 1.4; if(n.x>1.4) n.x = -0.4;
    var nx = n.x*W - TT.px*24, ny = n.y*H, nr = n.r*W; var ng = g.createRadialGradient(nx,ny,0,nx,ny,nr);
    ng.addColorStop(0, n.c?'rgba(255,61,139,.07)':'rgba(241,230,207,.06)'); ng.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = ng; g.beginPath(); g.ellipse(nx,ny,nr,nr*0.35,0,0,6.283); g.fill(); }
  /* 4 · il Gambler Bot davanti alla porta */
  /* la mascotte sta sul tappeto, un passo a sinistra della bocca; all'ENTRA ci cammina dentro */
  var mh = Math.min(H*0.31, W*0.55*720/391, 290), mx = W*0.36 - TT.px*26, my = H*0.785 - TT.py*10;
  if(TT.entra){ var ew = clamp((now-TT.entra-150)/650, 0, 1), ee = ew*ew*(3-2*ew); mx += (porta.x - mx)*ee; my += (porta.y + fh*0.1 - my)*ee; mh *= 1 - 0.45*ee; }
  disegnaMascotte(g, mx, my, mh, t, now);
  g.restore();
  /* 5 · il primo piano: lampioni e selciato bagnato, parallasse forte */
  if(IMG.t_strada && (!TT.entra || now-TT.entra<400)){ var sw = W*1.04, sh = sw*IMG.t_strada.height/IMG.t_strada.width, sx = (W-sw)/2 - TT.px*30, sy = H - sh + 18 - TT.py*12;
    g.drawImage(IMG.t_strada, sx, sy, sw, sh);
    g.globalCompositeOperation = 'lighter';
    [[0.07,0.175],[0.93,0.175]].forEach(function(p, i){ var lx = sx+p[0]*sw, ly = sy+p[1]*sh, fl = 0.8+0.2*DM.sin(now/70+i*2)*DM.sin(now/190+i) - (RV()<0.006?0.5:0), lr = sw*0.22;
      var lg = g.createRadialGradient(lx,ly,0,lx,ly,lr); lg.addColorStop(0,'rgba(255,236,190,'+(0.35*fl)+')'); lg.addColorStop(1,'rgba(255,200,120,0)'); g.fillStyle = lg; g.fillRect(lx-lr,ly-lr,lr*2,lr*2); });
    g.globalCompositeOperation = 'source-over'; }
  /* 6 · la pioggia vicina, con gli schizzi */
  g.strokeStyle = 'rgba(191,227,230,.32)'; g.lineWidth = 1.3; g.beginPath();
  for(k=0;k<TT.gocce.length;k++){ var d = TT.gocce[k]; d.y += d.v/60*(0.8+d.z); if(d.y>1.05){ if(d.z>0.5 && RV()<0.5) TT.nebbia.length; TT.gocce[k] = goccia(false); continue; }
    if(d.z<=0.5) continue; var x = d.x*W - TT.px*60, y = d.y*H; g.moveTo(x,y); g.lineTo(x-4, y+d.l*H); } g.stroke();
  /* vignetta */
  var vg = g.createRadialGradient(W/2,H*0.45,Math.min(W,H)*0.3,W/2,H*0.5,Math.max(W,H)*0.75); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(5,2,8,.75)'); g.fillStyle = vg; g.fillRect(0,0,W,H);
  /* l'entrata a tempo: dal nero */
  if(t<0.7){ g.fillStyle = 'rgba(7,3,8,'+(1-t/0.7)+')'; g.fillRect(0,0,W,H); }
  if(TT.entra){ var ne = $('tnero'); if(ne) ne.style.opacity = Math.max(0, (ez-0.55)/0.45);
    if(ez>=1 && TT.fatto){ var f = TT.fatto; TT.fatto = null; TT.on = false; f(); } }
}
/* la mascotte a parti: corpo, cappello (poligono), schermo con gli occhi, la fiche che vola */
function disegnaMascotte(g, cx, piedi, h, t, now){
  var im = IMG.p_mascotte; if(!im) return;
  var w = h*im.width/im.height, arr = clamp((t-0.35)/0.6, 0, 1), sal = arr<1 ? (1-eOutBack(arr))*h*0.9 : 0;
  var resp = DM.sin(t*2.1), sy = 1 + resp*0.012, sx = 1 - resp*0.006;
  if(TT.entra){ var e = Math.min(1,(now-TT.entra)/350); sy *= 1 - 0.06*DM.sin(e*Math.PI); }
  g.save(); g.translate(cx, piedi + sal); g.globalAlpha = arr;
  g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(0, -2, w*0.42, h*0.035, 0, 0, 6.283); g.fill();
  g.scale(sx, sy); g.translate(-w/2, -h);
  /* il corpo, col buco del cappello */
  var cap = MASC.cappello;
  g.save(); g.beginPath(); g.rect(-2,-2,w+4,h+4); g.moveTo(cap[0][0]*w, cap[0][1]*h); for(var i=1;i<cap.length;i++) g.lineTo(cap[i][0]*w, cap[i][1]*h); g.closePath(); g.clip('evenodd');
  g.drawImage(im, 0, 0, w, h); g.restore();
  g.fillStyle = '#120a0e'; g.beginPath(); g.moveTo(0.22*w,0.17*h); g.lineTo(0.84*w,0.14*h); g.lineTo(0.84*w,0.2*h); g.lineTo(0.22*w,0.24*h); g.closePath(); g.fill();
  /* lo schermo della faccia: via gli occhi dipinti, dentro quelli vivi */
  var sc = MASC.schermo; g.fillStyle = '#140c08';
  MASC.occhi.forEach(function(o){ g.fillRect((o[0]-0.012)*w, (o[2]-0.008)*h, (o[1]-o[0]+0.024)*w, (o[3]-o[2]+0.016)*h); });
  var G = TT.guardo; G.t -= 1/60; if(G.t<0){ G.tx = (RV()-0.5)*2; G.ty = (RV()-0.5)*1.4; G.t = 0.8+RV()*2; if(RV()<0.3){ G.tx = TT.px*4; G.ty = TT.py*3; } }
  G.x += (G.tx-G.x)*0.2; G.y += (G.ty-G.y)*0.2; TT.ciglio -= 1/60; if(TT.ciglio < -0.13) TT.ciglio = 1.6+RV()*3;
  var chiusi = TT.ciglio<0, festa = TT.entra || (t%9>7.6);
  g.globalCompositeOperation = 'lighter';
  MASC.occhi.forEach(function(o){ var ex = (o[0]+o[1])/2*w + G.x*w*0.012, ey = (o[2]+o[3])/2*h + G.y*h*0.006, r = (o[1]-o[0])*w*0.46;
    var gl = g.createRadialGradient(ex,ey,0,ex,ey,r*2.4); gl.addColorStop(0,'rgba(255,179,90,.5)'); gl.addColorStop(1,'rgba(255,140,60,0)'); g.fillStyle = gl; g.fillRect(ex-r*2.4,ey-r*2.4,r*4.8,r*4.8);
    g.fillStyle = '#ffc070';
    if(festa){ g.font = '900 '+Math.round(r*2.4)+'px '+FUI; g.textAlign='center'; g.textBaseline='middle'; g.fillText(TT.entra?'▲':'$', ex, ey+1); }
    else if(chiusi) g.fillRect(ex-r, ey-r*0.12, r*2, r*0.24);
    else { g.beginPath(); g.ellipse(ex, ey, r, r*1.02, 0, 0, 6.283); g.fill(); g.fillStyle = '#fff3d8'; g.beginPath(); g.arc(ex-r*0.3, ey-r*0.35, r*0.28, 0, 6.283); g.fill(); } });
  /* la riga di scansione dello schermo */
  var scan = ((t*0.6)%1); g.fillStyle = 'rgba(255,180,100,.08)'; g.fillRect(sc[0]*w, (sc[2]+(sc[3]-sc[2])*scan)*h, (sc[1]-sc[0])*w, h*0.012);
  g.globalCompositeOperation = 'source-over';
  /* il cappello: sobbalza col respiro, e all'ENTRA si alza per salutare */
  var alza = 0, rot = DM.sin(t*1.05)*0.02; if(TT.cappello){ var ec = (now-TT.cappello)/700; if(ec<1){ alza = DM.sin(ec*Math.PI)*h*0.07; rot -= DM.sin(ec*Math.PI)*0.22; } }
  var pvx = 0.5*w, pvy = 0.2*h;
  g.save(); g.translate(pvx, pvy - alza - resp*h*0.004); g.rotate(rot); g.translate(-pvx, -pvy);
  g.beginPath(); g.moveTo(cap[0][0]*w, cap[0][1]*h); for(i=1;i<cap.length;i++) g.lineTo(cap[i][0]*w, cap[i][1]*h); g.closePath(); g.clip();
  g.drawImage(im, 0, 0, w, h); g.restore();
  /* la fiche: ogni tanto la lancia e la riprende, girando */
  var F = TT.fiche; if(!F && RV()<0.006 && arr>=1) F = TT.fiche = { t:0 };
  if(F){ F.t += 1/60; var dur = 1.0, u = F.t/dur; if(u>=1){ TT.fiche = null; sfx('moneta'); }
    else { var hx = MASC.fiche[0]*w, hy = MASC.fiche[1]*h, fyy2 = hy - DM.sin(u*Math.PI)*h*0.42, fr = w*0.07, gira = DM.cos(F.t*22);
      g.save(); g.translate(hx, fyy2); g.scale(1, Math.max(0.12, Math.abs(gira)));
      g.fillStyle = '#000'; g.beginPath(); g.arc(0,0,fr+2,0,6.283); g.fill(); g.fillStyle = gira>0?'#b8202e':'#f1e6cf'; g.beginPath(); g.arc(0,0,fr,0,6.283); g.fill();
      g.strokeStyle = gira>0?'#f1e6cf':'#b8202e'; g.setLineDash([3,3]); g.lineWidth = 2; g.beginPath(); g.arc(0,0,fr*0.72,0,6.283); g.stroke(); g.setLineDash([]); g.restore(); } }
  g.restore();
}

/* ══ LA PORTA: posta in fiche vere, la cambiale come foglio da firmare ══ */

/* ══════════════════════════════════════════════════════════════════════════
   h_borsa.js — L'ECONOMIA NUOVA (decisa dal proprietario il 24/09):
   la posta è la tua BORSA (a rischio). Scendendo trovi soldi (nemici, tavoli,
   forzieri, boss, segrete), sempre di più più scendi. Li spendi al MONTE DEI
   PEGNI per poteri, cuori, chiavi. Li metti nel POZZO e sono SALVI.
   Se muori perdi la borsa e tieni il pozzo. INCASSA: esci con borsa + pozzo.
   Il margine della casa viene dalla curva di sopravvivenza: i piani diventano
   sempre più difficili. Tetto: 500 volte la posta, mai oltre € 5.000.
   Tutte le manopole sono qui, in ECON: le ha tarate il banco (_STATO_BUILD.md).
   ══════════════════════════════════════════════════════════════════════════ */
var ECON = {
  PORTA: 0.95,          // la porta trattiene il 5% (era il 13%): il resto del margine viene dai piani
  POZZO_DA: 3,          // il primo piano col pozzo (prima la borsa è tutta a rischio)
  CRESCE: 1.22,         // quanto crescono i soldi a ogni piano
  NEMICO_P: 0.06,       // probabilità che un nemico lasci un borsellino
  NEMICO_V: 0.0008,     // quanto vale (× posta × crescita)
  TAVOLO_V: 0.0015,     // la pila sul tavolo del piano
  SEGRETA_V: 0.0032,    // la segreta
  BOSS_V: 0.0060,       // il Bandito e l'Esattore (× crescita)
  CASA_V: 0.008,        // la Casa, in fondo (× crescita)
  PREZZO: { potere:0.030, cuore:0.020, chiave:0.010, cura:0.008 },   // × posta × (1 + 0,18 per piano)
  PREZZO_SALE: 0.18
};
function crescita(n){ return DM.pow(ECON.CRESCE, (n||STATO.piano)-1); }
function tettoSoldi(){ return Math.min(500*STATO.R.posta, 5000); }
function guadagna(v, x, y){
  var R = STATO.R, cap = tettoSoldi(), prima = R.pot;
  R.pot = Math.min(R.pot + v, Math.max(0, cap - R.safe)); STATO.trovati += R.pot - prima;
  if(x!=null) popSoldi(R.pot-prima, x, y);
  hud.tutto();
}
function spendi(v){ var R = STATO.R; if(R.pot < v - 1e-9) return false; R.pot -= v; STATO.spesi += v; if(STATO.postaViva!=null) STATO.postaViva = Math.min(STATO.postaViva, R.pot); hud.tutto(); return true; }
/* le monete per terra: nemici, tavoli, boss. Si attirano verso il robot. */
function lasciaSoldi(v, x, y, n){
  n = n || 1; for(var i=0;i<n;i++){ var a = RS()*6.283, s = 40+RS()*90;
    lascia('soldi', x+DM.cos(a)*6, y+DM.sin(a)*4, { v:v/n, vx:DM.cos(a)*s, vy2:DM.sin(a)*s*0.5 }); } }
var _popS = [];
function popSoldi(v, x, y){ if(!VIS || v<0.005) return; _popS.push({ v:v, x:x, y:y, t:0 }); }
function disegnaPopSoldi(dt){
  for(var i=_popS.length-1;i>=0;i--){ var p = _popS[i]; p.t += dt; if(p.t>0.9){ _popS.splice(i,1); continue; }
    var k = p.t/0.9; ctx.save(); ctx.globalAlpha = 1-k*k; ctx.font = '800 '+(14+6*(1-k))+'px '+FUI; ctx.textAlign='center';
    ctx.fillStyle = '#000'; ctx.fillText('+'+eur(p.v), p.x+1, p.y-18-k*26+1); ctx.fillStyle = '#ffe27a'; ctx.fillText('+'+eur(p.v), p.x, p.y-18-k*26); ctx.restore(); }
}

/* ── l'HUD: BORSA (a rischio) e POZZO (al sicuro). Due numeri e basta. ── */
hud.tutto = function(){
  if(!VIS || !STATO || !STATO.R) return;
  var R = STATO.R;
  hud.piatto(R.pot);
  $('vPozzo').textContent = eur(R.safe);
  $('vPiano').textContent = STATO.piano+'/9'; $('vPianoNome').textContent = T_(STORIA.PIANI[STATO.piano] ? STORIA.PIANI[STATO.piano].nome : 'PIANO');
  hud.cuori(); $('vChiavi').textContent = STATO.chiavi;
  var pw = $('poteri'); pw.innerHTML = '';
  var visti = {}; STATO.poteri.forEach(function(id){ visti[id] = (visti[id]||0)+1; });
  for(var id in visti){ var im = el('img'); im.src = ART[PBI[id].img]; im.title = PBI[id].nm; pw.appendChild(im); }
  var bi = $('btnIncassa'); bi.textContent = T_('INCASSA')+' '+eurGiu(R.pot+R.safe); bi.classList.toggle('no', fase==='combat');
  var ig = $('ingr'); ig.innerHTML = ''; for(var i=0;i<STATO.ingranaggi;i++){ var g = el('img'); g.src = ART.i_ingranaggio; ig.appendChild(g); }
};

/* ── IL TAVOLO: il tavolo del piano ha la sua pila di fiche, e la botola ── */
function dopoTavolo(){
  if(STATO.piano===9) return;
  var bossPiano = !!STORIA.PIANI[STATO.piano].boss, bossFatto = MAPPA.list.some(function(r){ return r.t==='boss' && r.cl; });
  if(!bossPiano){ PROPS.push({ k:'botola', img:'o_botola', x:K.RW/2+100, y:fy1-80, w:50, r:22 }); burst(K.RW/2+100, fy1-80, 20, '#e8b44a'); sfx('porta'); setTimeout(function(){ banner('LA BOTOLA SI APRE', 'il piano di sotto paga di più, e morde di più', 1.8); }, 1500); }
  else if(bossFatto){ STATO.botolaBoss = 1; }
  else setTimeout(function(){ banner('LA BOTOLA', 'si apre quando cade il boss', 1.6); }, 1500);
}
/* ── IL POZZO: quello che ci metti è SALVO. Anche se muori. ── */
function chiediIncasso(){
  if(fase==='combat'){ banner(T_('NON ADESSO'), T_('finisci la stanza, prima'), 1.2); return; }
  var R = STATO.R, tot = R.pot + R.safe;
  apriCarta({ chi:'esattore', piccolo:1, nome:T_('INCASSA'), testo:T_('«Esci adesso? Porti su la borsa e il pozzo. Il Palazzo non trattiene nessuno.»'),
    scelte:[ { t:T_('ESCI CON')+' '+eurGiu(tot), sub:T_('borsa')+' '+eur(R.pot)+' + '+T_('pozzo')+' '+eur(R.safe)+' · '+T_('la notte finisce qui'), cls:'oro', fai:function(){ chiudiCarta(1, function(){ finisci('incasso'); }); } },
             { t:T_('RESTA'), fai:function(){ chiudiCarta(-1); } } ] });
  pilotaClic(300, 0);
}
function apriMenu(){
  if(!STATO || !STATO.avviata || STATO.carta || STATO.finito) return;
  var R = STATO.R;
  apriCarta({ chi:'bot', piccolo:1, nome:T_('PAUSA'), testo:T_('Piano')+' '+STATO.piano+' · '+T_(STORIA.PIANI[STATO.piano].nome)+'. '+T_('Borsa')+' '+eur(R.pot)+' '+T_('a rischio, pozzo')+' '+eur(R.safe)+' '+T_('al sicuro.'),
    scelte:[ { t:T_('RIPRENDI'), cls:'oro', fai:function(){ chiudiCarta(1); } },
             { t:T_('MAPPA DEL PIANO'), fai:function(){ chiudiCarta(1, apriMappa); } },
             { t:T_('INCASSA ED ESCI'), sub:fase==='combat'?T_('non a metà di una rissa'):T_('esci con')+' '+eurGiu(R.pot+R.safe), fai:function(){ chiudiCarta(1, chiediIncasso); } },
             { t:T_('SUONO')+': '+(suono.muto()?T_('SPENTO'):T_('ACCESO')), fai:function(){ suono.muto(!suono.muto()); chiudiCarta(1); } },
             /* UGUALE sul server e nella pagina (le carte devono avere gli stessi bottoni): fuori dalla mini app non fa niente */
             { t:T_('ESCI DAL GIOCO'), sub:T_('la notte resta aperta 30 minuti: rientra dal banner'), fai:function(){ chiudiCarta(1, function(){ if(typeof OSPITE!=='undefined' && !SIM.rigioco) OSPITE.esciDalGioco(); }); } } ] });
}

/* ── IL MONTE DEI PEGNI: si paga con la borsa, i prezzi salgono coi piani ── */
/* ── i boss pagano, la Casa paga tutto ── */
function bossVinto(bb, saltato){
  ROOM.cl = true; fase = 'porta'; suono.musica('calma');
  var bt = STORIA.PIANI[STATO.piano].boss;
  if(!saltato){ STATO.tempi.push(+roomT.toFixed(1)); STATO.bossVinti = (STATO.bossVinti||0)+1; STATO.bossBattuti = (STATO.bossBattuti || []).concat([bt]);
    banner(BD[bt].nm+(bt==='casa'?' È CADUTA':' È CADUTO'), '', 2);
    lascia('cuoreMax', K.RW/2-40, K.RH/2+40);
    var v = STATO.R.posta*(bt==='casa' ? ECON.CASA_V : ECON.BOSS_V)*crescita()*(STATO.flag.patto?1.2:1);
    lasciaSoldi(v, K.RW/2, K.RH/2-20, 10);
    if(bt!=='casa'){ ROOM.pwBoss = pescaPotere(); PROPS.push({ k:'piedistallo', img:'o_piedistallo', x:K.RW/2+40, y:K.RH/2+30, w:74, r:24, pw:ROOM.pwBoss, bossPw:1 }); } }
  if(STATO.piano===9){ DOPO(saltato?0.2:2.6, function(){ laCasaParla(); }); return; }
  var tavoloFatto = MAPPA.list.some(function(r){ return r.t==='tavolo' && r.fatto; });
  if(tavoloFatto){ STATO.botolaBoss = 1; PROPS.push({ k:'botola', img:'o_botola', x:K.RW/2+100, y:fy1-80, w:50, r:22 }); }
  else setTimeout(function(){ banner('LA BOTOLA È CHIUSA', 'prima il tavolo ♠', 2); }, 2100);
}
function laCasaParla(){
  var R = STATO.R, sc = [ { t:'ESCI CON '+eurGiu(R.pot+R.safe), sub:'la notte è finita: hai battuto la Casa', cls:'oro', fai:function(){ chiudiCarta(1, function(){ finisci('casa'); }); } } ];
  if(STATO.ingranaggi>=3) sc.unshift({ t:'SPEGNI IL PALAZZO', sub:'tre ingranaggi: esci, e la Casa si spegne', cls:'oro', fai:function(){ chiudiCarta(1, function(){ finisci('liberata'); }); } });
  apriCarta({ chi:'casa', piccolo:1, testo:'«Hai vinto, macchina. Prendi quello che hai raccolto e vattene, prima che cambi idea.»', scelte:sc });
  pilotaClic(500, 0);
}

/* ══ LA PORTA: si sceglie la posta, e si entra ══ */
var PORTA = { posta:10 };
function laPorta(){
  var soldiVeri = (typeof OSPITE!=='undefined' && OSPITE.modo==='soldi'), salP = function(){ return (typeof OSPITE!=='undefined') ? OSPITE.saldoPorta() : saldo(); };
  var s = schermo('<div id="port"><div class="pfondo" style="background-image:url('+ART.t_facciata+')"></div>'+
    '<div class="ptop"><button class="targa piccola" id="bInd">‹ '+T_('ESCI')+'</button><div class="ptit">'+T_('LA PORTA')+(soldiVeri ? '' : '<small style="display:block;font-size:11px;letter-spacing:.2em;color:#bfe3e6">'+T_('ALLENAMENTO · SOLDI FINTI')+'</small>')+'</div><div class="psaldo">'+T_('saldo')+'<br><b>'+eur(salP())+'</b></div></div>'+
    '<div class="pmasc"><img src="'+ART.p_esattore+'" alt=""><div class="pfumetto">'+T_('«Quanto porti giù, macchina?»')+'</div></div>'+
    '<div class="panno"><div class="ppila" id="pila"></div><div class="pval" id="pval"></div></div>'+
    '<div class="pfic" id="fic"></div>'+
    '<div class="priga">'+T_('La posta è la tua <b>borsa</b> (la porta trattiene il 5%). Giù trovi soldi: spendili al <b>pegno</b> o salvali nel <b>pozzo</b>. La posta resta in borsa fino all’uscita: se cadi la perdi, il pozzo resta tuo.')+'<small>'+T_('tetto di vincita')+' <span id="tet"></span></small></div>'+
    '<button class="insegna" id="bFirma"><i class="lampadine"></i><span>'+T_('ENTRA')+'</span></button></div>', 'porta');
  var fic = $('fic');
  var ridisegna = function(anim){
    fic.innerHTML = ''; ECO.C.POSTE.forEach(function(v, i){ var b = el('button','fic c'+(i%3)+(PORTA.posta===v?' on':''), '<span>'+v+'</span>');
      if(v>salP()){ b.disabled = true; b.style.opacity = .3; }
      b.onclick = function(){ PORTA.posta = v; sfx('moneta'); setTimeout(function(){ sfx('moneta'); }, 70); ridisegna(true); }; fic.appendChild(b); });
    var p = $('pila'), n = ECO.C.POSTE.indexOf(PORTA.posta)+1, h = '';
    for(var i=0;i<n;i++) h += '<i class="fch c'+(i%3)+(anim&&i===n-1?' cade':'')+'" style="bottom:'+(i*7)+'px"></i>';
    p.innerHTML = h; $('pval').textContent = eur(PORTA.posta); $('tet').textContent = eur(Math.min(500*PORTA.posta, 5000));
  };
  ridisegna(false);
  $('bInd').onclick = function(){ sfx('carta'); titolo(); };
  $('bFirma').onclick = function(){ var b = this; if(b._via) return; if(!ARTE.pronta && VIS){ quandoArte(function(){ b.click(); }); return; } if(PORTA.posta>salP()){ banner(T_('SALDO'),T_('non basta')); return; } b._via = 1;
    if(soldiVeri){ OSPITE.porta(PORTA.posta, b); return; }
    var t = el('div','timbro', 'SI<br>SCENDE'); document.body.appendChild(t); sfx('timbro');
    setTimeout(function(){ var n = el('div','iride'); document.body.appendChild(n); setTimeout(function(){ n.remove(); }, 900); }, 450);
    setTimeout(function(){ t.remove(); saldo(saldo() - PORTA.posta); var ms = QS.match(/seme=(\d+)/); nuovaNotte(PORTA.posta, ms ? +ms[1] : null); }, 900); };
  if(MODE.pilota) setTimeout(function(){ $('bFirma').click(); }, 400);
}

/* ══ FINE NOTTE ══ */
/* ══ IL BANCO: la tabella misurata coi piloti (abilità × politica) ══ */
var TARATURA = {"politiche":["salva","spende","avido"],"righe":[{"abil":"principiante","rtp":[0.6336,0.8594,0.193],"n":[200,200,200],"err":[0.0669,0.0464,0.0615],"fondo":[0.1,0.47,0.16]},{"abil":"medio","rtp":[0.8305,0.9716,0.4469],"n":[200,200,200],"err":[0.0629,0.0279,0.0802],"fondo":[0.33,0.79,0.395]},{"abil":"bravo","rtp":[0.9555,0.9937,0.7499],"n":[200,200,200],"err":[0.056,0.0222,0.0808],"fondo":[0.55,0.935,0.645]},{"abil":"fortissimo","rtp":[0.93,0.9981,0.8018],"n":[200,200,200],"err":[0.0632,0.0201,0.0783],"fondo":[0.645,0.935,0.675]}],"nota":"Notti vere del pilota col motore di produzione (node, tempo finto, 60 passi al secondo). SALVA = mette nel pozzo appena può; SPENDE = compra quello che può al pegno; AVIDO = non salva e non compra. Tutti tranne l'avido incassano se restano con l'ultimo cuore. f = notti arrivate alla Casa. ± = intervallo al 95%."};
function banco(){
  var h = '<div class="col"><div class="grande">IL BANCO DEI BOT</div><div class="sotto">Il pilota automatico ha giocato notti intere, vere, a quattro livelli di abilità e con tre modi di usare i soldi. Qui c\'è quanto ha riportato a casa, in percentuale della posta (RTP).</div>';
  if(TARATURA && TARATURA.righe){ h += '<table class="tab"><tr><th>ABILITÀ</th>'+TARATURA.politiche.map(function(p){ return '<th>'+p.toUpperCase()+'</th>'; }).join('')+'</tr>';
    TARATURA.righe.forEach(function(r){ h += '<tr><td>'+r.abil.toUpperCase()+'</td>'+r.rtp.map(function(v, i){ return '<td class="ok">'+(v==null?'—':(v*100).toFixed(1)+'%')+'<br><small style="color:#bdb09a">'+(r.n[i]||0)+' notti</small></td>'; }).join('')+'</tr>'; });
    h += '</table><div class="nota">'+(TARATURA.nota||'')+'</div>'; }
  else h += '<div class="nota">Tabella non ancora misurata.</div>';
  h += '<button class="btn sec" id="bInd">INDIETRO</button></div>';
  schermo(h); $('bInd').onclick = titolo;
}

/* ══════════════════════════════════════════════════════════════════════════
   j_soldi.js — I SOLDI CHE SERVONO (25/09).
   Il pozzo a quantità libera (ispirato al pozzo di Sol Cesto: il secchio che
   sale, il mattone giallo, il conto finale «salvato / perso»), le fiche che
   volano dalla borsa al pozzo, la festa dell'incasso, il pegno con oggetti che
   cambiano la notte, e i soldi dentro la storia: corrompere, pagare una porta,
   pagare per passare, raddoppiare la pila del tavolo, l'elemosina alla Santa.
   Prezzi e ritrovamenti si muovono insieme: tutto è in «notti di lavoro», cioè
   in multipli di quanto si trova in media su un piano (F).
   Due regole del pozzo, da misurare affiancate (decide il proprietario):
     A · il pozzo salva tutto (posta compresa)
     B · il pozzo salva solo i soldi TROVATI; la posta resta a rischio fino
         all'uscita, e in cambio si trova il triplo.
   ══════════════════════════════════════════════════════════════════════════ */
ECON.VARIANTE = (QS.match(/var=([AB])/)||[0,'B'])[1];   // decisione del proprietario (25/09): B
ECON.BASE = 0.0030;                            // F(1): quanto si trova, in media, su un piano (× posta)
ECON.SCALA_B = 1.20; (function(){ var m = QS.match(/scala=([\d.]+)/); if(m) ECON.SCALA_B = +m[1]; var mp = QS.match(/porta=([\d.]+)/); if(mp) ECON.PORTA = +mp[1]; })();   // con la regola B (il pozzo salva solo i trovati) si trova di più: tarato col banco dei piloti
if(ECON.VARIANTE==='B'){ ['NEMICO_V','TAVOLO_V','SEGRETA_V','BOSS_V','CASA_V'].forEach(function(k){ ECON[k] *= ECON.SCALA_B; }); ECON.BASE *= ECON.SCALA_B; }
function F(n){ return STATO.R.posta * ECON.BASE * crescita(n); }
var MERCE = {
  potere:  { nm:'UN POTERE',        x:1.6, img:null, de:'cambia come spari' },
  cuore:   { nm:'+1 CUORE MAX',     x:1.2, img:'i_cuore', de:'un cuore in più, pieno' },
  chiave:  { nm:'+1 CHIAVE',        x:0.4, img:'i_chiave', de:'apre il tesoro' },
  cura:    { nm:'CURA +2',          x:0.5, img:'i_cuore', de:'due cuori indietro' },
  mappa:   { nm:'LA MAPPA',         x:0.3, img:'i_cambiale', de:'tutto il piano, segreta compresa' },
  scudo:   { nm:'SCUDO',            x:1.0, img:'i_gettone', de:'para i prossimi due colpi' },
  vita2:   { nm:'SECONDA VITA',     x:2.5, img:'i_ingranaggio', de:'se cadi, ti rialzi una volta' },
  spia:    { nm:'LA SOFFIATA',      x:0.35, img:'i_segugio', de:'il boss del piano parte con −15% di vita' },
  ripara:  { nm:'POTENZIA',         x:1.4, img:'i_catena', de:'raddoppia l\'ultimo potere preso' }
};
function prezzo(k){ return F() * (MERCE[k] ? MERCE[k].x : 1); }
function puoSalvare(){ var R = STATO.R; if(ECON.VARIANTE==='B') return Math.max(0, R.pot - (STATO.postaViva||0)); return R.pot; }

/* ══ IL POZZO: quanto vuoi, con l'anteprima che cambia in diretta ══ */
function apriPozzo(){
  var R = STATO.R, max = puoSalvare(), passo = passoFiche(max), q = { v: 0 };
  var corpo = el('div','pozzo-ui');
  corpo.innerHTML = '<div class="pz-conti"><div><b>BORSA</b><span id="pzB"></span></div><div class="pz-freccia">➜</div><div><b>POZZO</b><span id="pzP"></span></div></div>'+
    '<div class="pz-secchio"><div class="pz-riemp" id="pzR"></div><div class="pz-fiche" id="pzF"></div></div>'+
    '<input type="range" id="pzS" min="0" max="1000" value="0">'+
    '<div class="pz-tasti"><button data-a="-1">−'+eur(passo)+'</button><button data-a="1">+'+eur(passo)+'</button><button data-a="5">+'+eur(passo*5)+'</button><button data-a="T">TUTTO</button></div>'+
    (ECON.VARIANTE==='B' ? '<div class="nota">Nel pozzo vanno solo i soldi trovati: la posta ('+eur(STATO.postaViva||0)+') resta nella borsa fino all\'uscita.</div>' : '');
  var agg = function(){ q.v = clamp(Math.round(q.v*100)/100, 0, max); $('pzB').textContent = eur(R.pot - q.v); $('pzP').textContent = eur(R.safe + q.v);
    $('pzS').value = max>0 ? Math.round(q.v/max*1000) : 0; var n = Math.min(12, Math.ceil(q.v/Math.max(passo,1e-9)));
    $('pzF').innerHTML = new Array(n+1).join('<i></i>'); $('pzR').style.height = (max>0 ? 12+70*q.v/max : 12)+'%';
    var b = $('cScelte').querySelector('.scelta.oro'); if(b) b.innerHTML = q.v>0 ? T_('MANDA SU')+' '+eur(q.v)+'<small>'+T_('anche se cadi, resta tuo · non lo puoi più spendere')+'</small>' : T_('NIENTE, TENGO LA BORSA')+'<small>'+T_('tutta la borsa scende con te')+'</small>'; };
  apriCarta({ chi:'pozzo', piccolo:1, nome:'IL POZZO', testo:'«Quello che metti nel secchio sale in superficie ed è salvo. Quaggiù, però, non lo spendi più.» Nel pozzo ci sono già '+eur(R.safe)+'.', corpo:corpo,
    scelte:[ { t:'NIENTE', cls:'oro', arg:function(){ return Math.round(q.v*100); }, fai:function(i, a, arg){ var v = Math.min(max, Math.max(0, (+arg||0)/100)); if(!(v>0)) v = 0; ROOM.fatto = 1; STATO.pozzoUsato[STATO.piano] = v; if(v>0) mandaSu(v); chiudiCarta(v>0?1:-1); } } ] });
  $('pzS').oninput = function(){ q.v = max*this.value/1000; if(q.v > max-passo*0.5 && this.value>995) q.v = max; sfx('tic'); agg(); };
  corpo.querySelectorAll('.pz-tasti button').forEach(function(b){ b.onclick = function(){ var a = b.dataset.a; if(a==='T') q.v = max; else q.v += passo*(+a); sfx('moneta'); agg(); }; });
  agg();
  if(MODE.pilota){ var g0 = AZ_GEN; setTimeout(function(){ if(AZ_GEN!==g0) return; q.v = PIL.pol==='avido' ? 0 : max; agg(); premi(0); }, 300); }
}
function passoFiche(max){ var t = Math.max(0.01, max/20), e = DM.pow(10, Math.floor(DM.log10(t))), m = t/e; return (m<2?1:(m<5?2:5))*e; }
/* le fiche volano dalla borsa dell'HUD al secchio, una per una, in arco; cadono con l'eco */
function mandaSu(v){
  var R = STATO.R, pz = PROPS.filter(function(p){ return p.k==='pozzo'; })[0], dove = pz ? aSchermo(pz.x, pz.y-20) : aSchermo(K.RW/2, K.RH/2);
  var sr = $('scena').getBoundingClientRect(), dx = sr.left + dove.x, dy = sr.top + dove.y, br = $('vPiatto').getBoundingClientRect();
  var n = clamp(Math.round(3 + 18*Math.sqrt(v/Math.max(1e-9, R.posta*0.05))), 3, 24), fatte = 0;
  /* i soldi passano SUBITO (è il gioco); le fiche che volano sono solo lo spettacolo */
  var safe0 = R.safe; R.pot -= v; STATO.salvati += v; R.safe = Math.round((R.safe + v)*1e6)/1e6; hud.piatto(R.pot); P.occhi = '$'; P.occhiT = 2; P.inchino = 1.4; var vis = safe0;
  if(SIM.rigioco) return;
  for(var i=0;i<n;i++) (function(i){ setTimeout(function(){
    var f = el('div','volo'); f.className = 'volo c'+(i%3); document.body.appendChild(f);
    var x0 = br.left + br.width*0.5 + (RV()-0.5)*20, y0 = br.top + br.height*0.5, hx = (x0+dx)/2 + (RV()-0.5)*60, hy = Math.min(y0, dy) - 90 - RV()*60;
    f.animate([{ transform:'translate('+x0+'px,'+y0+'px) scale(1)' }, { transform:'translate('+hx+'px,'+hy+'px) scale(1.25) rotate(200deg)', offset:0.5 }, { transform:'translate('+dx+'px,'+dy+'px) scale(0.5) rotate(420deg)', opacity:0.6 }],
      { duration:520, easing:'cubic-bezier(.3,.1,.6,1)' }).onfinish = function(){ f.remove(); fatte++;
        sfx('moneta'); setTimeout(function(){ suono.fx('tic'); }, 120);
        vis += v/n; $('vPozzo').textContent = eur(Math.min(vis, R.safe)); var hp = $('hPozzo'); hp.classList.remove('botta'); void hp.offsetWidth; hp.classList.add('botta');
        if(pz){ pz.onda = 1; pz.luce = Math.min(1.6, (pz.luce||0) + 0.25); }
        if(fatte===n){ hud.tutto(); sfx(v > R.posta*0.2 ? 'vinto' : 'raccolta'); popTesto('+'+eur(v)+' AL SICURO', pz?pz.x:K.RW/2, pz?pz.y-60:K.RH/2); } };
  }, i*70); })(i);
}
/* la festa dell'incasso: le fiche risalgono tutte, contate */
function festaIncasso(poi){
  var R = STATO.R, tot = R.pot + R.safe, n = clamp(Math.round(6 + 30*Math.sqrt(tot/Math.max(1e-9,R.posta))), 6, 40);
  var o = el('div','festa'); o.innerHTML = '<div class="fe-tit">INCASSO</div><div class="fe-num" id="feN">'+eur(0)+'</div>'; document.body.appendChild(o);
  var sorgenti = [$('vPiatto').getBoundingClientRect(), $('vPozzo').getBoundingClientRect()], cx = innerWidth/2, cy = innerHeight*0.42, t0 = performance.now();
  for(var i=0;i<n;i++) (function(i){ setTimeout(function(){ var s = sorgenti[i%2], f = el('div','volo c'+(i%3)); document.body.appendChild(f);
    var x0 = s.left+s.width/2, y0 = s.top+s.height/2;
    f.animate([{ transform:'translate('+x0+'px,'+y0+'px)' }, { transform:'translate('+(cx+(RV()-0.5)*160)+'px,'+(cy-120-RV()*120)+'px) rotate(300deg) scale(1.4)', offset:0.6 }, { transform:'translate('+cx+'px,'+cy+'px) scale(0.3)', opacity:0 }],
      { duration:700, easing:'ease-out' }).onfinish = function(){ f.remove(); sfx('moneta'); }; }, i*45); })(i);
  var passo = function(){ var k = Math.min(1, (performance.now()-t0)/(n*45+600)); var e2 = $('feN'); if(e2) e2.textContent = eur(tot*eOutCubic(k)); if(k<1) requestAnimationFrame(passo); else { sfx('vinto'); setTimeout(function(){ o.classList.add('via'); setTimeout(function(){ o.remove(); poi(); }, 300); }, 500); } };
  requestAnimationFrame(passo);
}

/* ══ IL TAVOLO: la pila del piano. La prendi, o te la giochi a testa o croce ══ */
function apriTavolo(){
  if(ROOM.fatto) return;
  var v = STATO.R.posta*ECON.TAVOLO_V*crescita()*(STATO.flag.riscuoti?1.25:1), tv = PROPS.filter(function(p){ return p.k==='tavolo'; })[0], x = tv?tv.x:K.RW/2, y = tv?tv.y:K.RH/2;
  var chiudi = function(val){ ROOM.fatto = 1; if(tv) tv.fatto = 1; if(val>0){ lasciaSoldi(val, x, y+30, 6); sfx('vinto'); kick(0.12); } dopoTavolo(); };
  apriCarta({ chi:'croupier', piccolo:1, nome:'LA PILA DEL TAVOLO', testo:'Sul feltro c\'è una pila da '+eur(v)+'. «È tua, esattore. Oppure te la giochi: testa, il doppio. Croce, niente.»',
    scelte:[ { t:'LA PRENDO · '+eur(v), cls:'oro', fai:function(){ chiudiCarta(1, function(){ chiudi(v); }); } },
             { t:'TESTA O CROCE · '+eur(2*v)+' o niente', sub:'metà e metà, il banco non bara', fai:function(i, b){ var vinto = RS()<0.5; sfx(vinto?'vinto':'perso'); flash(vinto?'#fff6c8':'#b8202e', 0.8);
        scrivi($('cTesto'), vinto ? 'TESTA. «Il doppio, esattore.» '+eur(2*v)+'.' : 'CROCE. «Il banco ringrazia.»'); var sc = $('cScelte'); sc.innerHTML = '';
        azReset(); AZ_GEN++; var kb = bottoneCarta(sc, 'AVANTI', 'scelta piccola oro', function(){ chiudiCarta(1, function(){ chiudi(vinto?2*v:0); }); }); pilotaClic(250, kb); } } ] });
  pilotaClic(350, PIL.pol==='avido'?1:0);
}

/* ══ IL MONTE DEI PEGNI: oggetti che cambiano la notte ══ */
function apriNegozio(room){
  if(!room.merce){ var pool = ['cuore','scudo','vita2','mappa','spia','ripara','cura','chiave'], sc = [];
    if(!STORIA.PIANI[STATO.piano].boss) pool.splice(pool.indexOf('spia'),1);
    if(!STATO.poteri.length) pool.splice(pool.indexOf('ripara'),1);
    if(STATO.chiavi>=2) pool.splice(pool.indexOf('chiave'),1);
    shuffle(pool); sc = ['potere'].concat(pool.slice(0,3));
    room.merce = sc.map(function(k){ return { k:k, id:k==='potere'?pescaPotere():null, prezzo:prezzo(k) }; }); }
  PROPS.push({ k:'banco', img:'o_banco', x:K.RW/2, y:fy0+70, w:170, r:0 });
  PROPS.push({ k:'npcmuto', chi:'pegnaio', x:K.RW/2, y:fy0+12, w:0, r:0 });
  room.merce.forEach(function(m, i){ if(!m.venduto) PROPS.push({ k:'merce', m:m, x:K.RW/2+(i-1.5)*78, y:K.RH/2+60+(i%2)*46, r:20 }); });
  if(!room.salutato){ room.salutato=1; setTimeout(function(){ banner('IL PEGNAIO', '«Qui i soldi valgono. Spendili, o portali al pozzo.»', 2.4); }, 200); }
}
function compra(p){
  var m = p.m;
  if(STATO.R.pot < m.prezzo - 1e-9){ banner('NON BASTA', 'servono '+eur(m.prezzo)+' nella borsa', 1.3); sfx('chiusa'); return; }
  if(m.k==='cura' && P.hp>=P.hpMax){ banner('SEI INTERO', '', 1); return; }
  spendi(m.prezzo); m.venduto = 1; PROPS.splice(PROPS.indexOf(p),1); sfx('moneta'); STATO.acquisti++;
  var M = MERCE[m.k];
  if(m.k==='potere') prendiPotere(m.id);
  else if(m.k==='cuore'){ P.hpMax=Math.min(14,P.hpMax+2); P.hp=Math.min(P.hpMax,P.hp+2); popFuoriScala('i_cuore','+1 ♥ MAX'); }
  else if(m.k==='chiave'){ STATO.chiavi++; popPiccolo('i_chiave','+1'); }
  else if(m.k==='cura'){ P.hp = Math.min(P.hpMax, P.hp+4); popPiccolo('i_cuore','+2'); }
  else if(m.k==='mappa'){ rivela('tutto'); disegnaMini(); popFuoriScala('i_cambiale','LA MAPPA'); }
  else if(m.k==='scudo'){ P.scudo = (P.scudo||0)+2; popFuoriScala('i_gettone','SCUDO ×2'); }
  else if(m.k==='vita2'){ P.vita2 = 1; popFuoriScala('i_ingranaggio','SECONDA VITA'); }
  else if(m.k==='spia'){ STATO.soffiata = STATO.piano; popFuoriScala('i_segugio','LA SOFFIATA'); banner('LA SOFFIATA', ({bandito:'dopo la leva la bocca resta aperta', esattore:'fallo sbattere contro una colonna', croupier:'ricordati dov\'è l\'asso', casa:'spara alle finestre quando si accendono'})[STORIA.PIANI[STATO.piano].boss]||'', 3); }
  else if(m.k==='ripara'){ var ul = STATO.poteri[STATO.poteri.length-1]; if(ul) prendiPotere(ul); }
  if(M && m.k!=='potere' && m.k!=='ripara') banner(M.nm, M.de, 1.6);
  hud.tutto();
}
function disegnaMerce(p, now){
  var m = p.m, M = MERCE[m.k], img = m.k==='potere' ? PBI[m.id].img : (m.k==='ripara' ? (STATO.poteri.length ? PBI[STATO.poteri[STATO.poteri.length-1]].img : 'i_catena') : M.img);
  var s = cuoci(img, 30, 1.5, '#000'), fl = DM.sin(now/400+p.x)*3, puo = STATO.R.pot >= m.prezzo - 1e-9;
  ctx.save(); ctx.translate(p.x, p.y); if(!puo) ctx.globalAlpha = 0.55;
  ctx.fillStyle='rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(0,14,16,5,0,0,6.283); ctx.fill();
  if(puo){ ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(232,180,74,'+(0.1+0.1*DM.sin(now/200+p.x))+')'; ctx.beginPath(); ctx.arc(0,-6,20,0,6.283); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
  if(s) ctx.drawImage(s.c, -s.w/2, -s.h/2-6+fl, s.w, s.h);
  var nm = T_(m.k==='potere' ? PBI[m.id].nm : M.nm);
  ctx.fillStyle='#f1e6cf'; ctx.font='800 10px '+FUI; ctx.textAlign='center'; ctx.fillText(nm, 0, -28);
  ctx.fillStyle='#120812'; ctx.fillRect(-28,20,56,16); ctx.strokeStyle= puo?'#e8b44a':'#6a4a2a'; ctx.lineWidth=1.5; ctx.strokeRect(-28,20,56,16);
  ctx.fillStyle= puo?'#e8b44a':'#bdb09a'; ctx.font='800 11px '+FUI; ctx.fillText(eur(m.prezzo), 0, 32);
  ctx.restore();
}

/* ══ I SOLDI DENTRO LA STORIA E DENTRO LE STANZE ══ */
/* scelte a pagamento che si aggiungono agli incontri: corrompere, pagare, fare l'elemosina */
var PAGATE = {
  lena1:function(G){ var c = 1.0*F(); return [{ t:'Le pago il debito col capotavolo', sub:'costa '+eur(c)+' · Lena ti deve la vita, e una chiave', cost:c,
    fx:function(G){ G.rel.lena = 2; G.chiavi(1); }, esito:'Paghi. Il capotavolo conta e se ne va. Lena ti guarda come si guarda una cosa strana. «Nessuno aveva mai pagato per me.»' }]; },
  santa:function(G){ var c = 0.8*F(); return [{ t:'Le lascio l\'elemosina', sub:'costa '+eur(c)+' · benedizione piena: cuore in più e tutti i cuori', cost:c,
    fx:function(G){ G.flag.benedetto = 1; G.flag.elemosina = 1; G.cuoreMax(2); P.hp = P.hpMax; hud.cuori(); }, esito:'Le lasci le monete nel palmo. «Chi dà quaggiù, riceve lassù.» Ti senti intero.' }]; },
  esattore_boss:function(G){ if(G.rel.lena<0) return []; var c = 2.5*F(); return [{ t:'Lo corrompo', sub:'costa '+eur(c)+' · parte con il 60% della vita', cost:c,
    fx:function(G){ G.bossHp(0.6); G.flag.corrotto = 1; }, esito:'Prende i soldi senza contarli. «Questi li segno a parte.» Poi apre la valigetta.' }]; },
  forestiero:function(G){ var c = 1.2*F(); return [{ t:'Gli compro l\'ingranaggio', sub:'costa '+eur(c)+' · l\'ingranaggio e niente patto', cost:c,
    fx:function(G){ G.ingranaggio(); }, esito:'Ride, fumo e denti. «Paghi per riprenderti un pezzo di te. Sei proprio una macchina da casinò.»' }]; }
};
/* la porta chiusa a chiave: se non hai la chiave, paghi il fabbro */
function pagaPorta(i){
  var o = vicino(ROOM, i), c = 0.6*F(); if(!o || !o.chiusa || STATO.carta) return;
  if(STATO.R.pot < c){ banner('CHIUSA A CHIAVE', 'serve 1 chiave (o '+eur(c)+' per il fabbro)', 1.3); return; }
  apriCarta({ chi:'pegnaio', piccolo:1, nome:'IL FABBRO', testo:'«Niente chiave? Per '+eur(c)+' te la apro io, e non ho visto niente.»',
    scelte:[ { t:'PAGO · '+eur(c), cls:'oro', fai:function(){ if(spendi(c)) o.chiusa = 0; sfx('porta'); chiudiCarta(1); } }, { t:'NO', fai:function(){ chiudiCarta(-1); } } ] });
  pilotaClic(300, 1);
}
/* pagare per passare: i buttafuori si fanno da parte, ma non lasciano niente */
function offriPassaggio(){
  var b = $('btnPassa'), c = 1.2*F(); if(!b) return;
  if(STATO.R.pot < c || ROOM.t!=='combat'){ b.style.display = 'none'; return; }
  b.innerHTML = 'PAGA '+eur(c)+'<br><small>E PASSA</small>'; b.style.display = 'block'; clearTimeout(b._t); b._t = setTimeout(function(){ b.style.display = 'none'; }, 2600);
  b.onclick = function(){ b.style.display = 'none'; COMANDO('passa'); };
}
/* PAGA E PASSA: vale solo nei primi secondi di una stanza di combattimento (il tasto si vede 2,6 s) */
function pagaPassaggio(){
  var c = 1.2*F(); if(fase!=='combat' || !ROOM || ROOM.t!=='combat' || ROOM.pagata || boss || roomT > 3.4 || STATO.carta || !piano_) return;
  if(!spendi(c)) return;
  for(var k=0;k<EN.length;k++) if(EN[k].on){ EN[k].on = 0; burst(EN[k].x, EN[k].y, 6, '#3a2410'); } for(k=0;k<EB.length;k++) EB[k].on = 0;
  piano_ = [piano_[0]]; ondata = 0; ROOM.pagata = 1; banner('SI FANNO DA PARTE', '«Non ti abbiamo visto, esattore.»', 1.4); sfx('moneta');
}
/* il mattone giallo del pozzo (Sol Cesto): colpiscilo cinque volte */
function controllaMattone(x, y){
  if(!ROOM || ROOM.t!=='pozzo') return;   /* il mattone giallo sta solo nella stanza del pozzo */
  var pz = PROPS.filter(function(p){ return p.k==='pozzo'; })[0]; if(!pz || pz.mattoneFatto) return;
  var mx = pz.x + 38, my = pz.y - 4; if(DM.hypot(x-mx, y-my) > 12) return;
  pz.mattone = (pz.mattone||0)+1; scintille(mx, my, 5, '#ffe27a'); sfx('tic');
  if(pz.mattone>=5){ pz.mattoneFatto = 1; ROOM.mattone = 1; kick(0.2); sfx('potere'); var r = RS();
    if(r<0.34){ P.hp = P.hpMax; hud.cuori(); popFuoriScala('i_cuore','CUORI PIENI'); } else if(r<0.67){ lasciaSoldi(F()*0.8, mx, my+20, 4); banner('IL MATTONE GIALLO','dentro c\'erano monete',1.4); } else { prendiPotere(pescaPotere()); } }
}
/* ── la fine della notte: il conto «salvato / perso», come Sol Cesto ── */
function schermataFinale(F2, esito){
  var R = STATO.R, netto = R.uscita - R.posta;
  if(!VIS) return;
  var med = STATO.tempi.length ? STATO.tempi.reduce(function(a,b){ return a+b; },0)/STATO.tempi.length : 0;
  var min = Math.round(SIMMS()/1000);
  schermo('<div class="fondo" style="background-image:url('+ART[F2.img]+')"></div>'+(F2.img==='s_buio'?'<div class="pioggia"></div>':'')+'<div class="scuro"></div><div class="col">'+
    '<div class="fin-tit">'+T_(F2.tit)+'</div><p class="fin-r">'+T_(F2.r1)+'</p><p class="fin-r">'+T_(F2.r2)+'</p><p class="fin-r" style="color:#e8b44a">'+T_(F2.r3)+'</p>'+
    '<div class="riassunto" style="margin-top:10px">'+T_('Posta')+' <span class="n">'+eur(R.posta)+'</span><br>'+T_('Trovati')+' <span class="n">'+eur(STATO.trovati)+'</span><br>'+T_('Spesi')+' <span class="n">'+eur(STATO.spesi)+'</span><br>'+
    T_('Salvati nel pozzo')+' <span class="n" style="color:#bfe3e6">'+eur(R.safe)+'</span><br>'+
    (esito==='trascinato'?T_('Persi con la borsa')+' <span class="n" style="color:#ff5a5f">− '+eur(STATO.borsaPersa||0)+'</span><br>':T_('Borsa portata su')+' <span class="n">'+eur(R.pot)+'</span><br>')+
    (STATO.rubati?T_('Rubati dai borseggiatori')+' <span class="n" style="color:#ff5a5f">− '+eur(STATO.rubati)+'</span><br>':'')+
    T_('Esci con')+' <span class="n">'+eurGiu(R.uscita)+'</span><br><b>'+T_('Netto')+'</b> <span class="n" style="color:'+(netto>=0?'#58d68d':'#ff5a5f')+'">'+(netto>=0?'+ ':'− ')+eur(Math.abs(netto))+'</span><br>'+
    T_('Piano raggiunto')+' <span class="n">'+STATO.piano+'/9</span><br>'+T_('Stanze pulite')+' <span class="n">'+STATO.tempi.length+'</span><br>'+T_('Secondi medi per stanza')+' <span class="n">'+med.toFixed(1)+'</span><br>'+
    T_('Durata')+' <span class="n">'+Math.floor(min/60)+' min '+(min%60)+' s</span></div>'+
    ((typeof OSPITE!=='undefined' && OSPITE.modo==='soldi') ? '<div class="saldo" id="grnConto" style="margin-top:8px">'+T_('il banco conta…')+'</div>' : '<div class="saldo" style="margin-top:8px">'+T_('ALLENAMENTO · SOLDI FINTI')+' <b>'+eur(saldo())+'</b></div>')+
    '<button class="btn" id="bAncora">'+T_('UN\'ALTRA NOTTE')+'</button><button class="btn sec" id="bTit">'+T_('IL PALAZZO')+'</button></div>');
  $('bAncora').onclick = laPorta; $('bTit').onclick = function(){ if(typeof OSPITE!=='undefined') OSPITE.avvio(); else titolo(); };
  if(typeof OSPITE!=='undefined') OSPITE.mostraConto();
}

/* ══════════════════════════════════════════════════════════════════════════
   l_lingua.js — le parole in inglese (menu, HUD, porta, regole, conto).
   T_('frase italiana') → la frase inglese se la lingua è 'en'. Le parole NON
   toccano il gioco: la stessa notte si rigioca uguale in qualunque lingua.
   La storia dei personaggi resta in italiano (per ora).
   ══════════════════════════════════════════════════════════════════════════ */
var LINGUA = null;
var LINGUA_EN = {
  'RIPRENDI LA NOTTE':'RESUME THE NIGHT', 'ENTRA NEL PALAZZO':'ENTER THE PALACE', 'ALLENATI · GRATIS':'PRACTICE · FREE',
  'COME SI GIOCA':'HOW TO PLAY', 'LE PROBABILITÀ':'THE ODDS', 'notte aperta':'night in progress', 'posta':'stake', 'saldo':'balance',
  'a soldi veri: presto. Intanto allenati gratis.':'real money: soon. Practice for free meanwhile.', 'allenamento · soldi finti':'practice · play money',
  'ESCI':'EXIT', 'UN ATTIMO':'ONE MOMENT', 'il banco prepara la notte':'the house is preparing the night', 'GIOCO AGGIORNATO':'GAME UPDATED',
  'ricarico la pagina':'reloading the page', 'NON SI PUÒ':'NOT NOW', 'rete assente':'no connection', 'SI<br>SCENDE':'GOING<br>DOWN',
  'NOTTE CHIUSA':'NIGHT CLOSED', 'il banco l\'ha già contata':'the house already counted it', 'CONNESSIONE…':'CONNECTING…',
  'il gioco riparte da solo quando torna la rete':'the game resumes by itself when the connection is back',
  'il banco conta…':'the house is counting…', 'IL BANCO HA CONTATO':'THE HOUSE COUNTED',
  'il banco non risponde: la notte è salva, la conta riprende da sola (riapri il gioco tra poco)':'the house is not answering: your night is safe, the count resumes by itself (reopen the game in a moment)',
  'il conto del banco vale su quello della pagina':'the house count prevails over the page',
  'RIPRENDO LA NOTTE':'RESUMING THE NIGHT', 'il banco rilegge il registro':'the house is replaying your moves', 'pagato':'paid',
  'SI RIPARTE':'BACK IN', 'piano':'floor', 'PIANO':'FLOOR',
  'LA PORTA':'THE DOOR', 'ALLENAMENTO · SOLDI FINTI':'PRACTICE · PLAY MONEY', '«Quanto porti giù, macchina?»':'«How much are you taking down, machine?»',
  'La posta è la tua <b>borsa</b> (la porta trattiene il 5%). Giù trovi soldi: spendili al <b>pegno</b> o salvali nel <b>pozzo</b>. La posta resta in borsa fino all’uscita: se cadi la perdi, il pozzo resta tuo.':
    'Your stake is your <b>purse</b> (the door keeps 5%). Down there you find money: spend it at the <b>pawnshop</b> or save it in the <b>well</b>. The stake stays in the purse until you leave: if you fall you lose it, the well stays yours.',
  'tetto di vincita':'max win', 'ENTRA':'ENTER', 'SALDO':'BALANCE', 'non basta':'not enough',
  'PAUSA':'PAUSE', 'Piano':'Floor', 'Borsa':'Purse', 'a rischio, pozzo':'at risk, well', 'al sicuro.':'safe.',
  'RIPRENDI':'RESUME', 'MAPPA DEL PIANO':'FLOOR MAP', 'INCASSA ED ESCI':'CASH OUT AND LEAVE', 'non a metà di una rissa':'not in the middle of a fight',
  'esci con':'leave with', 'SUONO':'SOUND', 'SPENTO':'OFF', 'ACCESO':'ON', 'ESCI DAL GIOCO':'LEAVE THE GAME',
  'la notte resta aperta 30 minuti: rientra dal banner':'the night stays open for 30 minutes: come back from the banner',
  'INCASSA':'CASH OUT', '«Esci adesso? Porti su la borsa e il pozzo. Il Palazzo non trattiene nessuno.»':'«Leaving now? You take up the purse and the well. The Palace keeps no one.»',
  'ESCI CON':'LEAVE WITH', 'borsa':'purse', 'pozzo':'well', 'la notte finisce qui':'the night ends here', 'RESTA':'STAY',
  'NON ADESSO':'NOT NOW', 'finisci la stanza, prima':'clear the room first', 'UN\'ALTRA NOTTE':'ANOTHER NIGHT', 'IL PALAZZO':'THE PALACE',
  __guida: '<div class="col"><div class="grande">HOW TO PLAY</div><div class="guida">'+
    '<h3>The night</h3><p>You are the <b>Gambler Bot</b>, the machine the Family sends down to collect. Nine floors, and at the bottom <b>the House</b>.</p>'+
    '<h3>The door</h3><p>Pick your <b>stake</b>. The door keeps 5%: the rest is your <b>PURSE</b>, money at risk until you leave.</p>'+
    '<h3>The floor</h3><p>Connected rooms you discover by walking. Doors tell you what is behind them: ♠ the <b>table</b> (a pile of chips and the trapdoor down), ◍ the <b>well</b>, ✦ an <b>encounter</b>, ♛ the <b>treasure</b> (needs a key), ⚖ the <b>pawnshop</b>, ☠ the <b>boss</b>. There is a <b>secret</b> room too: look for cracks in the walls and shoot them.</p>'+
    '<h3>Fighting</h3><p>Left stick moves, right stick shoots <b>where you aim</b> (on PC: WASD and arrows, or the mouse). DASH to dodge. The deeper you go, the harder the Palace bites.</p>'+
    '<h3>Money</h3><p>Enemies, tables, bosses and secret rooms drop money, more and more the deeper you go. <b>Spend</b> it at the pawnshop (powers, hearts, keys) or <b>save it in the well</b> (from floor 3). Only money you found goes in the well: the stake stays in the purse until you leave. What is in the well is yours even if you fall.</p>'+
    '<h3>If you fall</h3><p>You lose the purse, you keep the well.</p>'+
    '<h3>Cash out</h3><p>Whenever you want, outside a fight: you leave with purse + well. Cap: 500 times the stake, never above € 5,000.</p>'+
    '<h3>The house does the count</h3><p>While you play, the mini app sends your moves to the house. At the end the house replays your night, step by step, with the same game, and pays what it finds. If the connection drops the game pauses and resumes by itself.</p>'+
    '<h3>If you leave halfway</h3><p>The night stays open for 30 minutes: come back from the banner and resume where you were (up to 3 times). After 30 minutes it closes by itself like a fall: the well is yours, the purse stays down.</p>'+
    '<h3>Practice</h3><p>PRACTICE is free: same night, play money.</p>'+
    '<h3>The choices</h3><p>The characters change the story: rooms that open, friends who come back, enemies waiting for you, different endings. (The story is in Italian for now.)</p></div>'+
    '<button class="btn" id="bInd">BACK</button></div>'
};

/* ══════════════════════════════════════════════════════════════════════════
   l_storia_en.js — LA STORIA IN INGLESE (personaggi, scelte, finali, stanze,
   scritte). Si aggiunge a LINGUA_EN. Solo parole: la notte non cambia.
   Le frasi con numeri dentro passano dalle REGOLE (in fondo).
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  var D = {
  /* personaggi e piani */
  'IL CROUPIER':'THE CROUPIER', 'L\'ESATTORE':'THE COLLECTOR', 'LA SANTA DEI VICOLI':'THE ALLEY SAINT', 'IL FORESTIERO':'THE STRANGER', 'LENA':'LENA',
  'LA DEA BENDATA':'THE BLINDFOLDED GODDESS', 'L\'ORACOLO':'THE ORACLE', 'IL PEGNAIO':'THE PAWNBROKER', 'LA CASA':'THE HOUSE', 'GAMBLER BOT':'GAMBLER BOT', 'IL POZZO':'THE WELL',
  'I SALONI':'THE PARLOURS', 'LA SALA DEI DADI':'THE DICE HALL', 'IL VICOLO DEI SANTI':'SAINTS\' ALLEY', 'LE CUCINE':'THE KITCHENS', 'LA BISCA':'THE GAMBLING DEN',
  'L\'UFFICIO DEI CONTI':'THE COUNTING OFFICE', 'IL CAVEAU':'THE VAULT', 'L\'ANTICAMERA':'THE ANTECHAMBER',
  'ATTO I · I SALONI':'ACT I · THE PARLOURS', 'ATTO II · LE CUCINE':'ACT II · THE KITCHENS', 'ATTO III · IL CAVEAU':'ACT III · THE VAULT',
  /* il prologo */
  '«Tu sei la macchina nuova. Quella che prende il mio posto.»':'«You are the new machine. The one taking my place.»',
  '«La Casa non paga più la Famiglia. Stanotte scendi tu, e riscuoti. Nove piani: più scendi, più il denaro è vecchio e la gente è sporca.»':'«The House no longer pays the Family. Tonight you go down and collect. Nine floors: the deeper you go, the older the money and the dirtier the people.»',
  '«La posta è il tuo fondo cassa. Quello che trovi lo spendi o lo mandi su col pozzo. Se cadi, la borsa resta giù.»':'«The stake is your float. What you find, you spend or send up with the well. If you fall, the purse stays down.»',
  '«In fondo c\'è la Casa. Non è una persona.» Ride, e non ride bene. «Io, al posto tuo, non scenderei.»':'«At the bottom is the House. It is not a person.» He laughs, and it is not a good laugh. «If I were you, I would not go down.»',
  'AVANTI':'NEXT', 'PRENDO LA CAMBIALE':'I TAKE THE NOTE',
  /* il croupier, prima volta */
  '«Sei nuovo. Le macchine, qui sotto, di solito le usiamo per contare le fiche. Tu che fai: conti, o giochi?»':'«You are new. Down here we usually use machines to count chips. What about you: do you count, or play?»',
  '«Sono qui per riscuotere.»':'«I am here to collect.»', 'i tavoli ti pagano il 25% in più':'the tables pay you 25% more',
  '«Allora conta bene, esattore. Il Palazzo non sbaglia i conti: li sbagli tu.»':'«Then count well, collector. The Palace never gets the numbers wrong: you do.»',
  '«Sono qui per giocare.»':'«I am here to play.»', '+1 chiave, subito':'+1 key, now',
  'Ti fa scivolare una chiave d\'ottone sul feltro. «Tutti dicono così, la prima notte. Offre la casa.»':'He slides a brass key across the felt. «Everyone says that on their first night. On the house.»',
  /* lena */
  'Una donna dalle dita svelte ti sfiora il gomito. «Il capotavolo ha visto la mia mano sporca, latta. Se mi copri lo ricordo. Se mi vendi… lo ricordo lo stesso.»':'A woman with quick fingers brushes your elbow. «The pit boss saw my dirty hand, tin can. Cover for me and I will remember. Sell me out… and I will remember that too.»',
  '«Ti copro. Sparisci.»':'«I will cover you. Vanish.»', 'Lena ti deve un favore':'Lena owes you one',
  'Le sposti la carta truccata sotto la tua manica. «Non lo scordo», sussurra, e sparisce fra i tavoli.':'You slip the marked card under your sleeve. «I will not forget», she whispers, and vanishes between the tables.',
  '«Ti vendo al capotavolo.»':'«I am selling you to the pit boss.»', '+2 chiavi · Lena se lo ricorderà':'+2 keys · Lena will remember',
  'Alzi due dita. La paga arriva: due chiavi d\'ottone. Il suo sguardo ti marchia lo schermo.':'You raise two fingers. The pay arrives: two brass keys. Her stare brands your screen.',
  '«Non sono affari miei.»':'«None of my business.»', 'niente':'nothing',
  'Ti giri dall\'altra parte. Lena scivola via da sola: non ti deve niente, non ti perdona niente.':'You look the other way. Lena slips off alone: she owes you nothing, she forgives you nothing.',
  /* la santa */
  'Una vecchia cieca ti prende la mano di latta sopra un mazzo consunto. «Quanto vale una vita, stanotte? Il Bandito ti aspetta in fondo al vicolo. Vuoi la mia benedizione… o il mio avvertimento?»':'A blind old woman takes your tin hand over a worn deck. «What is a life worth tonight? The Bandit waits for you at the end of the alley. Do you want my blessing… or my warning?»',
  'La benedizione':'The blessing', '+1 cuore massimo, subito pieno':'+1 max heart, filled now',
  'Ti segna lo schermo col pollice. «Sei vuoto dentro, ma batti.» Qualcosa, dentro la latta, batte più forte.':'She marks your screen with her thumb. «You are empty inside, but you beat.» Something inside the tin beats harder.',
  'L\'avvertimento':'The warning', 'vedi tutta la mappa, e il punto debole del boss':'you see the whole map, and the boss weak spot',
  '«Il Bandito ha un braccio solo. Quando lo alza, spostati. Quando lo abbassa, colpisci.» Il vicolo intero ti si disegna dentro.':'«The Bandit has one arm. When he raises it, move. When he lowers it, strike.» The whole alley draws itself inside you.',
  'Le rubo la candela':'I steal her candle', '+1 potere · il piano dopo è maledetto':'+1 power · the next floor is cursed',
  'Le strappi la candela. Ride, cieca: «Allora che sia truccato anche il buio.» Al piano dopo le stanze avranno un\'ondata in più.':'You snatch the candle. She laughs, blind: «Then let the dark be rigged too.» On the next floor the rooms will have one more wave.',
  'Le lascio l\'elemosina':'I leave her alms',
  'Le lasci le monete nel palmo. «Chi dà quaggiù, riceve lassù.» Ti senti intero.':'You leave the coins in her palm. «Who gives down here, receives up there.» You feel whole.',
  /* il forestiero */
  'Un uomo di fumo in gessato, a un tavolo che prima non c\'era. «Io ero te, prima di te. La Casa mi ha costruito, e poi mi ha buttato via. Dentro quella latta ci sono tre ingranaggi che erano miei.» Ti porge la mano. «Stringi, e la Casa ti riconoscerà come suo. Oppure riprenditi quello che è tuo.»':'A man made of smoke in a pinstripe suit, at a table that was not there before. «I was you, before you. The House built me, then threw me away. Inside that tin there are three gears that were mine.» He offers his hand. «Shake it, and the House will know you as its own. Or take back what is yours.»',
  'Stringo la mano':'I shake his hand', '+ potere SPECCHIO · i nemici lasciano più soldi':'+ MIRROR power · enemies drop more money',
  'La sua stretta gela. Da qui in giù le porte sanno di zolfo e di jackpot.':'His grip freezes. From here down the doors smell of sulphur and jackpots.',
  '«Non stanotte.»':'«Not tonight.»', 'ti lascia un pezzo di te · le crepe si vedono':'he leaves you a piece of yourself · cracks become visible',
  'Si dissolve nel fumo. Sul tavolo resta un ingranaggio d\'ottone con il tuo numero di serie. Da adesso le crepe nei muri le vedi anche tu.':'He dissolves into smoke. On the table lies a brass gear with your serial number. From now on you can see the cracks in the walls too.',
  'Gli compro l\'ingranaggio':'I buy the gear from him',
  'Ride, fumo e denti. «Paghi per riprenderti un pezzo di te. Sei proprio una macchina da casinò.»':'He laughs, smoke and teeth. «You pay to get back a piece of yourself. You really are a casino machine.»',
  /* lena, seconda volta */
  '«Ti devo una, latta.» Lena batte due volte sul muro: suona vuoto. «C\'è una crepa, qui. E adesso… portami su con te. Fino in fondo.»':'«I owe you one, tin can.» Lena knocks twice on the wall: it sounds hollow. «There is a crack here. And now… take me up with you. All the way.»',
  '«Guarda chi c\'è.» Lena conta le fiche di un morto. «Non ti devo niente, latta. Ma da sola non arrivo in fondo. Portami su con te.»':'«Look who it is.» Lena is counting a dead man\'s chips. «I owe you nothing, tin can. But alone I will not make it to the bottom. Take me up with you.»',
  '«Vieni.»':'«Come.»', 'Lena combatte con te fino alla fine':'Lena fights with you to the end',
  'Si mette una carta fra le dita come un coltello. «Io lancio, tu spari. E a fondo scala, ci parliamo.»':'She holds a card between her fingers like a knife. «I throw, you shoot. And at the bottom of the stairs, we talk.»',
  '«Da solo vado più veloce.»':'«I am faster alone.»', 'ti dà un potere e se ne va':'she gives you a power and leaves',
  'Alza le spalle e ti lancia qualcosa. «Un lupo solo campa più a lungo. Ma muore solo.»':'She shrugs and tosses you something. «A lone wolf lives longer. But dies alone.»',
  '«Ti ricordi di me, latta?» Lena è seduta sul tavolo, e alle sue spalle ci sono i ragazzi del capotavolo. «Due chiavi. Ecco quanto valevo.»':'«Remember me, tin can?» Lena sits on the table, and behind her stand the pit boss\'s boys. «Two keys. That is what I was worth.»',
  '«Fatti sotto.»':'«Bring it.»', 'l\'agguato: si combatte':'the ambush: you fight', 'Lena fischia. La porta si chiude alle tue spalle.':'Lena whistles. The door shuts behind you.',
  'Le restituisco le chiavi':'I give her the keys back', '−2 chiavi (se le hai) · niente agguato':'−2 keys (if you have them) · no ambush',
  'Le prende senza guardarti. «Adesso siamo pari. Quasi.»':'She takes them without looking at you. «Now we are even. Almost.»', '«Non ne hai abbastanza, latta.» La porta si chiude.':'«You do not have enough, tin can.» The door shuts.',
  'Le pago il debito col capotavolo':'I pay her debt to the pit boss',
  'Paghi. Il capotavolo conta e se ne va. Lena ti guarda come si guarda una cosa strana. «Nessuno aveva mai pagato per me.»':'You pay. The pit boss counts and leaves. Lena looks at you the way you look at something strange. «Nobody ever paid for me.»',
  /* il croupier, seconda volta */
  'Il Croupier ha le mani bruciate e lo stesso sguardo stanco. «Tu conti, io ricordo. All\'Ufficio dei Conti ti aspetta l\'Esattore. E più giù, la Casa.» Ti mostra una fiche sbeccata.':'The Croupier has burnt hands and the same tired eyes. «You count, I remember. At the Counting Office the Collector is waiting for you. And further down, the House.» He shows you a chipped chip.',
  'Il Croupier fa scivolare una fiche nera sul feltro. «Il Banco ti anticipa il gioco, esattore. Prendi il marker: giochi grosso stanotte. Ma il Banco non dimentica.»':'The Croupier slides a black chip across the felt. «The Bank advances your play, collector. Take the marker: you play big tonight. But the Bank does not forget.»',
  'Prendo la fiche sbeccata':'I take the chipped chip', 'attrezzo contro la Casa: parte più debole':'a tool against the House: it starts weaker',
  '«È del vecchio proprietario. Al tiro della Casa, pesa. Non chiedermi da che parte.»':'«It belonged to the old owner. Against the House, it weighs. Do not ask me which way.»',
  '«Tienila. Mi basta una chiave.»':'«Keep it. A key is enough for me.»', '+2 chiavi':'+2 keys', 'Due chiavi, senza una parola. Il Croupier non si offende: prende nota.':'Two keys, without a word. The Croupier is not offended: he takes note.',
  'Firmo il marker':'I sign the marker', '+ potere, +2 chiavi · la Casa sarà più forte':'+ power, +2 keys · the House will be stronger',
  'Firmi. La sala si scalda: da qui in giù si gioca sporco.':'You sign. The room heats up: from here down, the game is dirty.',
  '«Non devo niente a nessuno.»':'«I owe nobody anything.»', 'attrezzo contro la Casa':'a tool against the House',
  'Spingi via la fiche. Il Croupier sorride per la prima volta. «Come vuoi, santo. Allora prendi questa, che è sbeccata.»':'You push the chip away. The Croupier smiles for the first time. «As you wish, saint. Then take this one, it is chipped.»',
  /* l'oracolo */
  '«Dove sono gli altri?»':'«Where are the others?»', 'vedi tutta la mappa, e le crepe':'you see the whole map, and the cracks',
  'Ti sussurra i muri che suonano vuoti. Il caveau intero ti si accende dentro.':'He whispers which walls sound hollow. The whole vault lights up inside you.',
  'Tiro i suoi dadi d\'osso':'I roll his bone dice', '+1 cuore massimo oppure +1 potere, a sorte':'+1 max heart or +1 power, by chance',
  /* la dea */
  'Al centro della sala una donna bendata regge una bilancia storta. Non parla. Su un piatto c\'è un dado, sull\'altro un cuore. Aspetta che tu ci metta qualcosa.':'In the middle of the hall a blindfolded woman holds a crooked scale. She does not speak. On one pan there is a die, on the other a heart. She waits for you to put something in.',
  'Le offro un cuore':'I offer her a heart', '−1 cuore massimo · attrezzo contro la Casa':'−1 max heart · a tool against the House',
  'Il piatto del cuore scende. Da adesso qualcosa cammina con te, anche quello che non si vede.':'The heart pan sinks. From now on something walks with you, even what cannot be seen.',
  'Le offro un potere':'I offer her a power', 'perdi l\'ultimo potere · attrezzo contro la Casa':'you lose your last power · a tool against the House',
  'Il dado scende. La bilancia, per la prima volta, sta dritta.':'The die sinks. For the first time, the scale stands straight.',
  '«Non mi fido dei ciechi.»':'«I do not trust the blind.»', 'la Casa avrà una fase in più':'the House will have one more phase',
  'Le passi accanto. La bilancia oscilla, poi si ferma dalla parte sbagliata.':'You walk past her. The scale sways, then stops on the wrong side.',
  /* l'esattore */
  '«Mi hai fatto un favore, con quella ragazza. Ti lascio passare, macchina. Per stavolta.»':'«You did me a favour with that girl. I will let you pass, machine. This time.»',
  '«Sei in ritardo sul conto, latta.» Apre la valigetta: dentro ci sono solo cambiali. Tutte con la tua firma. «Il mio posto non lo prende una scatola di latta.»':'«You are behind on the bill, tin can.» He opens the briefcase: inside there are only promissory notes. All signed by you. «No tin box takes my place.»',
  'Passo':'I pass', 'niente combattimento · niente bottino':'no fight · no loot', 'Ti scansa col braccio. Dietro di te, lo senti ridere.':'He sweeps you aside with his arm. Behind you, you hear him laugh.',
  '«Ti do la borsa.»':'«I give you the purse.»', 'Conti le fiche nella sua mano, una a una. «Da domani la valigetta la porti tu.»':'You count the chips into his hand, one by one. «From tomorrow, you carry the briefcase.»',
  '«Lena, adesso!»':'«Lena, now!»', '«Ci battiamo.»':'«We fight.»', 'Lena lo ferisce: parte più debole':'Lena wounds him: he starts weaker', 'si combatte':'you fight',
  'Una carta gli si pianta nella spalla. Ruggisce.':'A card sticks into his shoulder. He roars.', 'Chiude la valigetta. Il pavimento trema.':'He shuts the briefcase. The floor trembles.',
  'Lo corrompo':'I bribe him', 'Prende i soldi senza contarli. «Questi li segno a parte.» Poi apre la valigetta.':'He takes the money without counting it. «I will write these down separately.» Then he opens the briefcase.',
  /* la casa */
  '«Sai quanto mi devi?» La voce viene dai muri, dal pavimento, dalle fiche nelle tue tasche. «Tutti mi devono qualcosa. Anche tu, macchina: ti ho costruita io.»':'«Do you know how much you owe me?» The voice comes from the walls, from the floor, from the chips in your pockets. «Everyone owes me something. You too, machine: I built you.»',
  '«Tutto.»':'«Everything.»', '«Bravo. Allora giochiamo per il resto.»':'«Good. Then we play for the rest.»', '«Niente.»':'«Nothing.»',
  '«Nessuno mi deve niente.» Il palazzo ride con tutte le finestre.':'«Nobody owes me nothing.» The palace laughs with all its windows.',
  '«Hai vinto, macchina. Prendi quello che hai raccolto e vattene, prima che cambi idea.»':'«You won, machine. Take what you gathered and leave, before I change my mind.»',
  'la notte è finita: hai battuto la Casa':'the night is over: you beat the House', 'SPEGNI IL PALAZZO':'SWITCH OFF THE PALACE', 'tre ingranaggi: esci, e la Casa si spegne':'three gears: you leave, and the House goes dark',
  /* i finali */
  'UN\'ALTRA NOTTE':'ANOTHER NIGHT', '«La Casa non ricorda il tuo nome. È l\'unico premio che concede gratis.»':'«The House does not remember your name. It is the only prize it gives for free.»',
  'LA MACCHINA LIBERA':'THE FREE MACHINE', 'Tre ingranaggi al loro posto. Il Palazzo si spegne piano per piano, come un\'insegna all\'alba. Per la prima volta, il tuo schermo mostra la tua faccia.':'Three gears in place. The Palace goes dark floor by floor, like a sign at dawn. For the first time, your screen shows your face.',
  'L\'ANIMA IN PEGNO':'THE SOUL IN PAWN', 'Il Forestiero ti aspetta sull\'ultimo gradino. «Hai battuto la Casa, macchina. Adesso la Casa sei tu.»':'The Stranger waits for you on the last step. «You beat the House, machine. Now you are the House.»',
  'IL MARKER':'THE MARKER', 'La Casa paga fino all\'ultimo, sorridendo: il marker resta nel registro. Al Palazzo sanno aspettare.':'The House pays to the last, smiling: the marker stays in the ledger. At the Palace they know how to wait.',
  'PORTAMI SU CON TE':'TAKE ME UP WITH YOU', 'Lena ti prende il braccio di latta sulla scala. «Te l\'avevo detto. Io lancio, tu spari.» Fuori piove, ed è bellissimo.':'Lena takes your tin arm on the stairs. «I told you. I throw, you shoot.» Outside it is raining, and it is beautiful.',
  'LA CASA È CADUTA':'THE HOUSE HAS FALLEN', 'Hai svuotato il palazzo dal lato del tavolo, in piena luce, con le sue stesse regole. Il Palazzo stanotte perde due volte: i soldi, e il diritto di dimenticarti.':'You emptied the palace from the table side, in full light, by its own rules. Tonight the Palace loses twice: the money, and the right to forget you.',
  'LA CASA TI HA PRESO':'THE HOUSE GOT YOU', 'SANGUE SUL FELTRO':'BLOOD ON THE FELT',
  'TRASCINATO FUORI':'DRAGGED OUT', 'Ti hanno portato su per i piedi, con lo schermo spento. La borsa è rimasta giù. Quello che avevi mandato su col pozzo, invece, è tuo.':'They carried you up by your feet, screen off. The purse stayed down. What you sent up with the well, though, is yours.',
  'IL NUOVO ESATTORE':'THE NEW COLLECTOR', 'L\'Esattore conta le fiche e ti restituisce la valigetta. «Da domani la porti tu.» Non sai se è una promozione o una condanna.':'The Collector counts the chips and hands you the briefcase. «From tomorrow, you carry it.» You do not know if it is a promotion or a sentence.',
  'IL CONTO GIUSTO':'THE RIGHT BILL', 'Te ne vai al momento esatto, quello che i giocatori veri non riconoscono mai. Al Palazzo quelli come te li odiano con rispetto.':'You leave at the exact moment, the one real gamblers never recognise. At the Palace they hate people like you, with respect.',
  /* il tavolo, il pozzo, il pegno, le porte */
  'LA PILA DEL TAVOLO':'THE TABLE PILE', 'IL FABBRO':'THE LOCKSMITH', 'NO':'NO', 'NIENTE':'NOTHING', 'SCENDI':'GO DOWN',
  'Di sotto il denaro è più vecchio, e la gente più sporca.':'Downstairs the money is older, and the people dirtier.', 'Il pozzo di questo piano è ancora da usare. ':'This floor\'s well has not been used yet. ',
  'il banco non bara':'the house does not cheat', 'metà e metà, il banco non bara':'fifty-fifty, the house does not cheat',
  'CROCE. «Il banco ringrazia.»':'TAILS. «The house thanks you.»',
  'IL MONTE DEI PEGNI':'THE PAWNSHOP', 'IL TAVOLO':'THE TABLE', 'UN INCONTRO':'AN ENCOUNTER', 'IL TESORO':'THE TREASURE', 'LA SEGRETA':'THE SECRET ROOM', 'L\'ASCENSORE':'THE LIFT', 'BOSS':'BOSS',
  /* le scritte (banner) */
  'PORTE APERTE':'DOORS OPEN', 'APERTA':'OPEN', '−1 chiave':'−1 key', 'CHIUSA A CHIAVE':'LOCKED', 'serve 1 chiave':'you need 1 key', 'NON BASTA':'NOT ENOUGH',
  'LA BOTOLA SI APRE':'THE TRAPDOOR OPENS', 'il piano di sotto paga di più, e morde di più':'the floor below pays more, and bites harder',
  'LA BOTOLA':'THE TRAPDOOR', 'si apre quando cade il boss':'it opens when the boss falls', 'LA BOTOLA È CHIUSA':'THE TRAPDOOR IS SHUT', 'prima il tavolo ♠':'the table first ♠',
  'IL MATTONE GIALLO':'THE YELLOW BRICK', 'dentro c\'erano monete':'there were coins inside', '«Qui i soldi valgono. Spendili, o portali al pozzo.»':'«Here money is worth something. Spend it, or take it to the well.»',
  'SCAPPATO':'GOT AWAY', 'SECONDA FASE':'SECOND PHASE', 'dietro la facciata':'behind the facade', 'senza cappotto':'without the coat', 'SECONDA VITA':'SECOND LIFE', 'l\'ingranaggio gira ancora':'the gear still turns',
  'SEI INTERO':'YOU ARE WHOLE', 'SI FANNO DA PARTE':'THEY STEP ASIDE', '«Non ti abbiamo visto, esattore.»':'«We never saw you, collector.»',
  'UN PEZZO DI TE':'A PIECE OF YOU', 'UNA CREPA':'A CRACK', 'la stanza segreta si apre':'the secret room opens', 'LA SOFFIATA':'THE TIP-OFF',
  'PIANO 1 · I SALONI':'FLOOR 1 · THE PARLOURS', 'trova il tavolo ♠':'find the table ♠', 'si incrina':'it cracks', 'si scatena':'it rages', 'TI RIALZI':'YOU GET UP', 'SCUDO':'SHIELD',
  'PUNTO DEBOLE!':'WEAK SPOT!', 'L\'ASSO!':'THE ACE!', 'LA MAPPA':'THE MAP', 'CUORI PIENI':'HEARTS FULL', 'AL SICURO':'SAFE',
  /* il pegno */
  'UN POTERE':'A POWER', '+1 CUORE MAX':'+1 MAX HEART', '+1 CHIAVE':'+1 KEY', 'CURA +2':'HEAL +2', 'SCUDO':'SHIELD', 'LA SOFFIATA':'THE TIP-OFF', 'POTENZIA':'EMPOWER',
  'cambia come spari':'changes how you shoot', 'un cuore in più, pieno':'one more heart, full', 'apre il tesoro':'opens the treasure', 'due cuori indietro':'two hearts back',
  'tutto il piano, segreta compresa':'the whole floor, secret room included', 'para i prossimi due colpi':'blocks the next two hits', 'se cadi, ti rialzi una volta':'if you fall, you get up once',
  'il boss del piano parte con −15% di vita':'the floor boss starts with −15% life', 'raddoppia l\'ultimo potere preso':'doubles the last power you took',
  /* la schermata finale */
  'Posta':'Stake', 'Trovati':'Found', 'Spesi':'Spent', 'Salvati nel pozzo':'Saved in the well', 'Persi con la borsa':'Lost with the purse', 'Borsa portata su':'Purse taken up',
  'Rubati dai borseggiatori':'Stolen by pickpockets', 'Esci con':'You leave with', 'Netto':'Net', 'Piano raggiunto':'Floor reached', 'Stanze pulite':'Rooms cleared',
  'Secondi medi per stanza':'Average seconds per room', 'Durata':'Duration', 'MANDA SU':'SEND UP', 'NIENTE, TENGO LA BORSA':'NOTHING, I KEEP THE PURSE',
  'anche se cadi, resta tuo · non lo puoi più spendere':'even if you fall it stays yours · you can no longer spend it', 'tutta la borsa scende con te':'the whole purse goes down with you',
  'LA PRENDO':'I TAKE IT', 'TESTA O CROCE':'HEADS OR TAILS', 'PAGO':'I PAY', 'RESTA':'STAY',
  'Il pozzo di questo piano è ancora da usare. Di sotto il denaro è più vecchio, e la gente più sporca.':'This floor\'s well has not been used yet. Downstairs the money is older, and the people dirtier.',
  /* i poteri */
  'RAFFICA':'VOLLEY', 'spari il 35% più spesso':'you shoot 35% more often', 'TRIPLETTA':'TRIPLE', '+2 colpi a ventaglio':'+2 shots in a fan', 'SPONDA':'BANK SHOT', 'i colpi rimbalzano sui muri':'shots bounce off walls',
  'SEGUGIO':'HOUND', 'i colpi fiutano il bersaglio':'shots sniff out the target', 'CHIODO':'NAIL', 'i colpi passano attraverso':'shots go through', 'SCOPPIO':'BLAST', 'i colpi esplodono':'shots explode',
  'PIOMBO':'LEAD', 'colpi grossi, il doppio del danno':'big shots, double damage', 'SCORTA':'ESCORT', 'due lune d\'ottone ti girano attorno':'two brass moons circle around you',
  'CALIBRO LUNGO':'LONG CALIBRE', 'colpi più veloci e più lontani':'faster, longer shots', 'SPECCHIO':'MIRROR', 'spari anche alle tue spalle':'you also shoot behind you',
  'CATENA D\'ORO':'GOLD CHAIN', 'il colpo salta a un altro nemico':'the shot jumps to another enemy', 'SANGUE FREDDO':'COLD BLOOD', 'a cuori pieni fai +60% di danno':'at full hearts you deal +60% damage',
  'SECONDA VITA':'SECOND LIFE', 'LA MAPPA':'THE MAP', 'SCUDO ×2':'SHIELD ×2', 'COPERTA!':'COVERED!',
  'LEVETTA SINISTRA: CAMMINA':'LEFT STICK: MOVE', 'LEVETTA DESTRA: SPARA DOVE PUNTI':'RIGHT STICK: SHOOT WHERE YOU AIM', 'SCATTO: SCHIVA':'DASH: DODGE',
  'W A S D  CAMMINA':'W A S D  MOVE', 'FRECCE / MOUSE  SPARANO':'ARROWS / MOUSE  SHOOT', 'SPAZIO  SCATTA · M  MAPPA':'SPACE  DASH · M  MAP', 'trova IL TAVOLO ♠ · poi la BOTOLA':'find THE TABLE ♠ · then the TRAPDOOR'
  };
  /* le frasi coi numeri dentro: [regola, sostituzione] (in ordine) */
  var REGOLE = [
    [/^Sei entrato con (.*)\.$/, 'You came in with $1.'], [/^Porti fuori (.*)\.$/, 'You take out $1.'],
    [/^La borsa se la tiene il Palazzo\. Dal pozzo porti su (.*)\.$/, 'The Palace keeps the purse. From the well you take up $1.'],
    [/^costa (.*) · (.*)$/, function(m, a, b){ return 'costs ' + a + ' · ' + (D[b] || b); }],
    [/^servono (.*) nella borsa$/, 'you need $1 in the purse'], [/^ONDATA (\d+)$/, 'WAVE $1'], [/^FASE (\d+)$/, 'PHASE $1'],
    [/^▼ PIANO (\d+) · (.*)$/, function(m, n, p){ return '▼ FLOOR ' + n + ' · ' + (D[p] || p); }], [/^▼ PIANO (\d+)$/, '▼ FLOOR $1'],
    [/^ingranaggio (\d) di 3$/, 'gear $1 of 3'], [/^INGRANAGGIO (\d)\/3$/, 'GEAR $1/3'], [/^col tuo (.*)$/, 'with your $1'],
    [/^LA PRENDO · (.*)$/, 'I TAKE IT · $1'], [/^TESTA O CROCE · (.*) o niente$/, 'HEADS OR TAILS · $1 or nothing'], [/^PAGO · (.*)$/, 'I PAY · $1'],
    [/^MANDA SU (.*)$/, 'SEND UP $1'], [/^\+(.*) AL SICURO$/, '+$1 SAFE'],
    [/^Sul feltro c'è una pila da (.*)\. «È tua, esattore\. Oppure te la giochi: testa, il doppio\. Croce, niente\.»$/, 'On the felt there is a pile of $1. «It is yours, collector. Or you play it: heads, double. Tails, nothing.»'],
    [/^TESTA\. «Il doppio, esattore\.» (.*)\.$/, 'HEADS. «Double, collector.» $1.'],
    [/^«Niente chiave\? Per (.*) te la apro io, e non ho visto niente\.»$/, '«No key? For $1 I will open it, and I saw nothing.»'],
    [/^«Quello che metti nel secchio sale in superficie ed è salvo\. Quaggiù, però, non lo spendi più\.» Nel pozzo ci sono già (.*)\.$/, '«What you put in the bucket rises to the surface and is safe. Down here, though, you cannot spend it any more.» The well already holds $1.'],
    [/^Nel pozzo vanno solo i soldi trovati: la posta \((.*)\) resta nella borsa fino all'uscita\.$/, 'Only money you found goes in the well: the stake ($1) stays in the purse until you leave.'],
    [/^Un mendicante dagli occhi lattei scuote una ciotola di dadi d'osso\. «La Casa ha tre ingranaggi che non le appartengono\. Sono tuoi, macchina\. Ne hai (\d)\.» Ride\. «Con tre, la Casa si può spegnere\.»$/, 'A beggar with milky eyes shakes a bowl of bone dice. «The House has three gears that do not belong to it. They are yours, machine. You have $1.» He laughs. «With three, the House can be switched off.»'],
    [/^gli lasci tutta la borsa \((.*)\) · risali col pozzo$/, 'you leave him the whole purse ($1) · you go up with the well'],
    [/^(L'osso dice CUORE\.|L'osso dice FERRO\.) «Il caso decide dove, mai quanto», dice l'Oracolo\.$/, function(m, a){ return (a.indexOf('CUORE')>0 ? 'The bone says HEART.' : 'The bone says IRON.') + ' «Chance decides where, never how much», says the Oracle.'; }]
  ];
  LINGUA_EN.__regole = REGOLE;
  for(var k in D) if(!(k in LINGUA_EN)) LINGUA_EN[k] = D[k];
})();

/* ══════════════════════════════════════════════════════════════════════════
   k_ospite.js — L'OSPITE: la pagina dentro la mini app (iframe stessa origine).
   · SOLDI VERI: la porta chiede al server (/grn/inizia) la notte e il SEME; mentre
     giochi il registro parte a pezzi (/grn/pezzo, ~1 al secondo); alla fine
     /grn/chiudi: il server RIGIOCA la notte e paga quello che dice lui.
     Se la rete non risponde per più di BUFFER passi (6 s) il gioco si FERMA
     finché non torna: niente si gioca che il server non abbia visto.
   · RIPRESA: una notte lasciata a metà (app chiusa, telefono spento) si riprende
     dal banner entro 30 minuti: il server ridà il registro, la pagina lo rigioca
     in un attimo e si riparte da lì.
   · ALLENAMENTO: gratis, senza server, soldi finti.
   La pagina non decide niente sui soldi: mostra. Decide il server.
   ══════════════════════════════════════════════════════════════════════════ */
var OSPITE = (function(){
  var GUSCIO = /guscio=1/.test(QS), LANG = ((QS.match(/lang=(\w+)/)||[])[1]) || 'it';
  var PAR = null; try{ if(GUSCIO && window.parent && window.parent !== window && window.parent.BACKEND) PAR = window.parent; }catch(e){ PAR = null; }
  var O = { guscio:GUSCIO, soldi:false, modo:'prova', stato:null, notte:null, ack:0, evAck:0, inVolo:false, errori:0, fermoDa:0,
            buffer:360, chiusura:null, lang:LANG, conto:null, saldoCent:null, fineInviata:false };
  function uid(){ try{ return PAR && PAR.S && PAR.S.userId ? String(PAR.S.userId) : ''; }catch(e){ return ''; } }
  function url(p){ return PAR.BACKEND + p; }
  function chiama(metodo, p, corpo){
    var f = PAR.fetch.bind(PAR);                                   // il fetch del genitore mette l'initData di Telegram
    var o = { method:metodo, headers:{ 'Content-Type':'application/json' } };
    if(corpo) o.body = JSON.stringify(corpo);
    return f(url(p), o).then(function(r){ return r.json().then(function(j){ j._http = r.status; return j; }, function(){ return { _http:r.status, error:'risposta illeggibile' }; }); });
  }
  function avvisaGenitore(m){ try{ window.parent.postMessage(Object.assign({ grn:m.t }, m), location.origin); }catch(e){} }
  O.saldoEur = function(){ return O.saldoCent==null ? null : O.saldoCent/100; };

  /* all'avvio: lingua, stato dal server, poi il titolo */
  O.avvio = function(){
    if(LANG==='en' && typeof LINGUA_EN!=='undefined'){ LINGUA = LINGUA_EN; traduciCorpo(); }
    if(!PAR){ O.stato = { soldi:false }; titolo(); return; }
    chiama('GET', '/grn/stato?user_id='+encodeURIComponent(uid())).then(function(j){
      O.stato = j; O.soldi = !!(j && j._http===200 && j.soldi); O.buffer = (j && j.buffer_passi) || 360;
      if(j && j.notte) O.notte = j.notte;
      aggiornaSaldo(); titolo();
    }, function(){ O.stato = { soldi:false, errore:1 }; titolo(); });
  };
  function aggiornaSaldo(){ try{ if(PAR && PAR.S){ var c = (PAR.S.cent!=null) ? +PAR.S.cent : null;
      if(c==null && typeof PAR.capEur==='function') c = Math.round(PAR.capEur()*100); O.saldoCent = c; } }catch(e){} }
  /* ── il titolo: che bottoni ci sono ── */
  O.bottoni = function(){
    var h = '';
    if(O.notte) h += '<button class="insegna" id="bRiprendi"><i class="lampadine"></i><span>'+T_('RIPRENDI LA NOTTE')+'</span></button>';
    else if(O.soldi) h += '<button class="insegna" id="bEntra"><i class="lampadine"></i><span>'+T_('ENTRA NEL PALAZZO')+'</span></button>';
    h += '<div class="tsec">'+(O.soldi||O.notte ? '<button class="targa" id="bProva">'+T_('ALLENATI · GRATIS')+'</button>' : '<button class="insegna" id="bProva" style="width:100%"><i class="lampadine"></i><span>'+T_('ALLENATI · GRATIS')+'</span></button>')+'</div>';
    h += '<div class="tsec"><button class="targa" id="bGuida">'+T_('COME SI GIOCA')+'</button><button class="targa" id="bBanco">'+T_('LE PROBABILITÀ')+'</button></div>';
    if(O.notte) h += '<div class="tsaldo">'+T_('notte aperta')+' · '+T_('posta')+' <b>'+eur(O.notte.posta_cent/100)+'</b></div>';
    else if(O.soldi) h += '<div class="tsaldo">'+T_('saldo')+' <b>'+(O.saldoCent==null?'—':eur(O.saldoCent/100))+'</b></div>';
    else h += '<div class="tsaldo">'+(PAR ? T_('a soldi veri: presto. Intanto allenati gratis.') : T_('allenamento · soldi finti'))+'</div>';
    return h;
  };
  O.cablaTitolo = function(){
    var vai = function(modo){ return function(){ if(TT.entra) return; O.modo = modo; suono.sblocca(); sfx('porta'); setTimeout(function(){ sfx('scendi'); }, 200); TT.cappello = performance.now(); TT.entra = performance.now(); TT.fatto = laPorta; }; };
    if($('bEntra')) $('bEntra').onclick = vai('soldi');
    if($('bProva')) $('bProva').onclick = vai('prova');
    if($('bRiprendi')) $('bRiprendi').onclick = function(){ if(TT.entra) return; suono.sblocca(); O.modo = 'soldi'; quandoArte(riprendi); };
    /* ESCI sta in alto a sinistra sulla scena del titolo, FUORI dall'insegna (prima copriva la E di ENTRA) */
    var tit = $('tit');
    if(PAR && tit && !$('bEsciGioco')){ var be = el('button', 'targa piccola', '‹ '+T_('ESCI')); be.id = 'bEsciGioco';
      be.style.cssText = 'position:absolute;left:8px;top:calc(8px + var(--bordo-su,0px));z-index:6;flex:0 0 auto;width:auto';
      be.onclick = function(){ avvisaGenitore({ t:'esci' }); }; tit.appendChild(be); }
  };
  O.saldoPorta = function(){ return O.modo==='soldi' ? (O.saldoCent==null ? 0 : O.saldoCent/100) : saldo(); };
  /* ── la porta a soldi: il server addebita e dà il seme ── */
  O.porta = function(posta, bottone){
    if(O.modo!=='soldi'){ return false; }
    banner(T_('UN ATTIMO'), T_('il banco prepara la notte'), 2);
    chiama('POST', '/grn/inizia', { user_id:uid(), posta_cent:Math.round(posta*100), versione:GRN_API.versione }).then(function(j){
      if(j._http!==200 || !j.id){ bottone._via = 0;
        if(j.ricarica){ banner(T_('GIOCO AGGIORNATO'), T_('ricarico la pagina'), 2); setTimeout(function(){ location.reload(); }, 1200); return; }
        banner(T_('NON SI PUÒ'), (j && j.error) || T_('rete assente'), 2.6); return; }
      if(j.cent!=null) O.saldoCent = j.cent;
      avvisaGenitore({ t:'saldo' });
      if(j.riprendi){ O.notte = j; riprendi(); return; }
      O.notte = j; O.ack = 0; O.evAck = 0; O.fineInviata = false; O.chiusura = null;
      var t = el('div','timbro', T_('SI<br>SCENDE')); document.body.appendChild(t); sfx('timbro');
      setTimeout(function(){ var n = el('div','iride'); document.body.appendChild(n); setTimeout(function(){ n.remove(); }, 900); }, 450);
      setTimeout(function(){ t.remove(); nuovaNotte(j.posta_cent/100, j.seme); }, 900);
    }, function(){ bottone._via = 0; banner(T_('NON SI PUÒ'), T_('rete assente'), 2.6); });
    return true;
  };
  /* ── i pezzi del registro, uno in volo alla volta ── */
  function manda(){
    if(O.modo!=='soldi' || !O.notte || !SIM.reg || O.inVolo || O.fineInviata) return;
    if(SIM.reg.n <= O.ack && SIM.reg.ev.length <= O.evAck) return;
    var pz = SIM.reg.pezzo(O.ack, O.evAck), a = pz.a, ne = SIM.reg.ev.length;
    O.inVolo = true;
    chiama('POST', '/grn/pezzo', { user_id:uid(), id:O.notte.id, pezzo:{ da:pz.da, a:pz.a, r:pz.r, ev:pz.ev } }).then(function(j){
      O.inVolo = false;
      if(j._http===200){ O.ack = a; O.evAck = ne; O.errori = 0; return; }
      if(j.chiusa){ O.errori = 99; banner(T_('NOTTE CHIUSA'), T_('il banco l\'ha già contata'), 3); return; }
      if(typeof j.a==='number' && j.a < a){ O.ack = j.a; O.evAck = contaEventiFino(j.a); }    // il server ha meno: si rimanda da lì
      O.errori++;
    }, function(){ O.inVolo = false; O.errori++; });
  }
  function contaEventiFino(a){ var n = 0, L = SIM.reg.ev; while(n < L.length && L[n][0] < a) n++; return n; }
  setInterval(manda, 1000);
  /* il gioco si ferma se il server è indietro di più di BUFFER passi */
  O.fermo = function(){
    if(O.modo!=='soldi' || !O.notte || !STATO || STATO.finito) return false;
    var f = (SIM.T - O.ack) > O.buffer;
    var v = $('grnRete');
    if(f && !v){ v = el('div', null, '<b>'+T_('CONNESSIONE…')+'</b><small>'+T_('il gioco riparte da solo quando torna la rete')+'</small>'); v.id = 'grnRete';
      v.style.cssText = 'position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:60;background:#120812ee;border:2px solid #e8b44a;border-radius:12px;padding:14px 18px;color:#f1e6cf;text-align:center;font:700 16px var(--ui,sans-serif);display:flex;flex-direction:column;gap:6px';
      document.body.appendChild(v); manda(); }
    else if(!f && v) v.remove();
    return f;
  };
  /* ── la fine: l'ultimo pezzo e la chiusura; il server conta ── */
  O.fine = function(F){
    if(O.modo!=='soldi' || !O.notte || O.fineInviata || SIM.rigioco) return;
    O.fineInviata = true;
    var nid = O.notte.id, uscCent = Math.floor((F.uscita||0)*100 + 1e-6);
    var tenta = function(n){
      var pz = SIM.reg.pezzo(O.ack, O.evAck), a = pz.a, ne = SIM.reg.ev.length;
      chiama('POST', '/grn/chiudi', { user_id:uid(), id:nid, pezzo:{ da:pz.da, a:pz.a, r:pz.r, ev:pz.ev }, motivo:F.esito,
                                     dice:{ esito:F.esito, uscita_cent:uscCent, firma:F.firma, T:F.T } }).then(function(j){
        if(j._http===200 && j.id){ O.ack = a; O.evAck = ne; O.chiusura = j; O.notte = null; if(j.cent!=null) O.saldoCent = j.cent; avvisaGenitore({ t:'saldo' }); mostraConto(); return; }
        if(typeof j.a==='number' && j.a < a && n < 6){ O.ack = j.a; O.evAck = contaEventiFino(j.a); setTimeout(function(){ tenta(n+1); }, 400); return; }
        if(n < 8){ setTimeout(function(){ tenta(n+1); }, 1500 + n*1000); return; }
        O.chiusura = { errore:1 }; mostraConto();
      }, function(){ if(n < 8) setTimeout(function(){ tenta(n+1); }, 1500 + n*1000); else { O.chiusura = { errore:1 }; mostraConto(); } });
    };
    setTimeout(function(){ tenta(0); }, 0);
  };
  function mostraConto(){
    var e = $('grnConto'); if(!e) return;
    var c = O.chiusura;
    if(!c) { e.innerHTML = T_('il banco conta…'); return; }
    if(c.errore){ e.innerHTML = T_('il banco non risponde: la notte è salva, la conta riprende da sola (riapri il gioco tra poco)'); return; }
    e.innerHTML = T_('IL BANCO HA CONTATO')+' <b>'+eur(c.pagato_cent/100)+'</b>'+(c.scarto ? '<br><small>'+T_('il conto del banco vale su quello della pagina')+'</small>' : '');
  }
  O.mostraConto = mostraConto;
  /* ── la ripresa: il registro dal server, rigiocato in un attimo, poi si continua ── */
  function riprendi(){
    banner(T_('RIPRENDO LA NOTTE'), T_('il banco rilegge il registro'), 3);
    chiama('POST', '/grn/riprendi', { user_id:uid(), id:O.notte.id }).then(function(j){
      if(j._http!==200 || !j.pezzi){ if(j.esito){ O.notte = null; O.chiusura = j; banner(T_('NOTTE CHIUSA'), T_('pagato')+' '+eur((j.pagato_cent||0)/100), 3.5); setTimeout(titolo, 3600); return; }
        banner(T_('NON SI PUÒ'), (j && j.error) || T_('rete assente'), 2.6); return; }
      var r = [], ev = [], n = 0; j.pezzi.forEach(function(p){ p.r.forEach(function(q){ r.push(q.slice()); n += q[0]; }); (p.ev||[]).forEach(function(e){ ev.push(e); }); });
      chiudiSchermo(); layout();
      var vis0 = VIS; VIS = false;
      try{ GRN_API.rigioca(j.posta_cent/100, j.seme, { r:r, ev:ev }); }
      finally{ VIS = vis0; SIM.rigioco = false; }
      var reg = new Registro(); reg.r = r.map(function(q){ return q.slice(); }); reg.ev = ev.slice(); reg.n = n; SIM.reg = reg;
      O.notte = j; O.ack = n; O.evAck = ev.length; O.fineInviata = false; O.chiusura = null;
      /* il disegno riparte dallo stato rigiocato */
      precuoci(STATO.piano); hud._pv = null; hud.tutto(); disegnaMini(); suono.musica(fase==='combat'?'combat':'calma');
      if(STATO.carta && CARTA && CARTA.testo) $('cTesto').textContent = CARTA.testo;
      if(STATO.finito){ O.fine(window.__FINE || { esito:STATO.esitoFinale, uscita:STATO.R.uscita, T:STATO.Tfine });
        schermataFinale(STORIA.finale(GAPI, STATO.esitoFinale), STATO.esitoFinale); return; }
      banner(T_('SI RIPARTE'), T_('piano')+' '+STATO.piano, 1.6);
    }, function(){ banner(T_('NON SI PUÒ'), T_('rete assente'), 2.6); });
  }
  /* ── il menu: uscire lasciando la notte aperta ── */
  O.esciDalGioco = function(){ avvisaGenitore({ t:'esci' }); };
  /* i bordi di Telegram e i messaggi dal genitore */
  window.addEventListener('message', function(ev){ if(ev.origin!==location.origin || !ev.data) return; var m = ev.data;
    if(m.grn==='bordi'){ document.documentElement.style.setProperty('--bordo-su', (m.top||0)+'px'); document.documentElement.style.setProperty('--bordo-giu', (m.bottom||0)+'px'); }
    if(m.grn==='pausa' && STATO && STATO.avviata && !STATO.finito && !STATO.carta){ COMANDO('menu'); }
  });
  function traduciCorpo(){
    var set = function(sel, t){ var e = document.querySelector(sel); if(e) e.textContent = t; };
    set('#hPiatto b', 'PURSE ⚠'); set('#hPozzo b', 'WELL ✓'); set('#joyL .jlab', 'MOVE'); set('#joyR .jlab', 'SHOOT'); set('#btnDash', 'DASH'); set('#btnIncassa', 'CASH OUT');
    document.documentElement.lang = 'en';
  }
  return O;
})();

/* ══════════════════════════════════════════════════════════════════════════
   f_partita.js — la notte: stato, piani, discesa, fine, anello dei fotogrammi,
   il pilota automatico del banco di prova (?pilota) e l'avvio.
   ══════════════════════════════════════════════════════════════════════════ */
var STATO = null;
/* il ponte fra la storia e il gioco: la storia può toccare tutto TRANNE i soldi */
var GAPI = {
  get flag(){ return STATO.flag; }, get rel(){ return STATO.rel; }, nota:'',
  chiavi:function(n){ STATO.chiavi = Math.max(0, STATO.chiavi+n); if(n>0){ sfx('raccolta'); popPiccolo('i_chiave','+'+n); } hud.tutto(); },
  nChiavi:function(){ return STATO.chiavi; }, nIngr:function(){ return STATO.ingranaggi; },
  cuori:function(n){ P.hp = clamp(P.hp+n, 1, P.hpMax); hud.cuori(); },
  cuoreMax:function(n){ P.hpMax = clamp(P.hpMax+n, 2, 14); P.hp = Math.min(P.hp, P.hpMax); if(n>0) popFuoriScala('i_cuore', '+1 ♥ MAX'); hud.cuori(); },
  potere:function(id){ prendiPotere(id || pescaPotere()); },
  togliPotere:function(){ var id = STATO.poteri.pop(); if(!id) return; Wp = armaBase(); STATO.poteri.forEach(function(x){ PBI[x].ap(Wp); }); rifaiOrbita(); hud.tutto(); },
  attrezzo:function(nm){ STATO.attrezzi.push(nm); popFuoriScala('i_gettone', nm.toUpperCase()); },
  ingranaggio:function(){ STATO.ingranaggi++; popFuoriScala('i_ingranaggio','INGRANAGGIO '+STATO.ingranaggi+'/3'); hud.tutto(); },
  rivela:function(cosa){ rivela(cosa); disegnaMini(); if(cosa!=='segreta') popFuoriScala(null,'LA MAPPA'); },
  agguato:function(){ STATO.rel.lena = -2; ROOM.fatto = 1; ROOM.t = 'combat'; ROOM.cl = false; DOPO(0.3, function(){ avviaCombattimento([[['lena',1],['scagnozzo',2]],[['pistolero',2],['fiche',3]]]); STATO.flag.agguato = 1; }); },
  bossHp:function(f){ STATO.bossHpF = f; },
  bossSaltato:function(){ STATO.saltaBoss = 1; },
  incassaOra:function(){ STATO.pagaEsattore = 1; }, borsa:function(){ return STATO.R.pot; },
  coperto:function(){ return ECO.coperta(STATO.R); }, ultimo:function(){ return P.hp<=2; },
  vicino:function(){ var R = STATO.R; return R.cb && !ECO.coperta(R) && ECO.tot(R) >= 0.8*R.cb.b*R.posta; },
  piano:function(){ return STATO.piano; }, tiri:function(){ return STATO.R.tiri; }, safe:function(){ return STATO.R.safe; },
  eur:eur, cambiale:function(){ return STATO.R.cb; }, posta:function(){ return STATO.R.posta; },
  uscita:function(){ return Math.floor((STATO.R.uscita||0)*100 + 1e-6)/100; }, premio:function(){ return STATO.R.premio||0; }
};
function nuovaNotte(posta, seme){
  /* LA NOTTE COMINCIA: il seme lo dà il server (nella pagina di prova: a caso). Da qui in poi
     tutto quello che succede è funzione di (seme, registro). */
  if(seme==null) seme = (Date.now() ^ (RV()*4294967296)) >>> 0;
  seme = seme >>> 0;
  SIM.T = 0; SIM.timers = []; SIM.seq = 0; SIM.acc = 0; SIM.firme = []; if(!SIM.rigioco){ var mf = QS.match(/firme=(\d+)/); if(mf) SIM.firmeOgni = +mf[1]; } AZ = []; AZ_GEN++;
  RS = _flussoRS(ECO.mix32(seme ^ 0x2545F491)); RP = _flussoRS(ECO.mix32(seme ^ 0x1B873593) ^ (PIL.abil*7919 + PIL.pol.length)); PIL._inc = 0;
  if(!SIM.rigioco) SIM.reg = new Registro();
  for(var _k=0;_k<EN.length;_k++) EN[_k].on=0; for(_k=0;_k<EB.length;_k++) EB[_k].on=0; for(_k=0;_k<PB.length;_k++) PB[_k].on=0;
  boss = null; ROOM = null; PICK = []; PROPS = []; ARCHI = []; PIOG.length = 0; TR.on = false; TR.to = null; hitStop = 0; slowmo = 0; fase = 'porta';
  roomT = 0; waveGap = 0; ondata = 0; piano_ = null; P.dashT = 0; P.dashCd = 0; P.fireCd = 0; P.dashIf = 0; P.x = K.RW/2; P.y = K.RH/2;
  STATO = { seme:seme, piano:0, R:ECO.nuova(posta, 0, ECO.mix32(seme)), trovati:0, spesi:0, salvati:0, acquisti:0, borsaPersa:0, rngM:ECO.flusso(ECO.mix32(seme ^ 0x7F4A7C15) + 0x1234567),
            flag:{}, rel:{ lena:0, croupier:0 }, chiavi:1, poteri:[], attrezzi:[], ingranaggi:0, tempi:[], uccisi:0, colpi:0, spari:0,
            segrete:0, tiriFatti:0, scelte:[], diario:[], pozzoUsato:{}, carta:false, finito:false, avviata:false, t0:0, fps:[] };
  STATO.R.pot = posta*ECON.PORTA; STATO.R.cb = null; STATO.postaViva = ECON.VARIANTE==='B' ? posta*ECON.PORTA : 0; P.scudo = 0; P.vita2 = 0;
  P.hp = K.HP; P.hpMax = K.HP; P.dead = false; P.iframe = 0; Wp = armaBase(); COMP = null; hud._pv = null;
  costruisciCtx(); chiudiSchermo(); layout();
  STATO.avviata = true;
  if(MODE.piano>1){ salta(MODE.piano); return; }
  prologo(0, function(){ scendi(); });
}
function salta(n){ /* ?piano=n per le prove: arrivi al piano n con qualche potere */
  for(var i=0;i<Math.min(6,n-1);i++) prendiPotere(pescaPotere());
  P.hpMax = 6 + Math.min(4, (n-1)); P.hp = P.hpMax; STATO.chiavi = 3; STATO.piano = n-1; scendi();
}
function prologo(i, poi){
  if(i>=STORIA.PROLOGO.length){ poi(); return; }
  var L = STORIA.PROLOGO[i];
  apriCarta({ chi:L.chi, testo:L.t, scelte:[ { t:i<STORIA.PROLOGO.length-1?'AVANTI':'PRENDO LA CAMBIALE', cls:'oro', fai:function(){ chiudiCarta(1, function(){ prologo(i+1, poi); }); } } ] });
  pilotaClic(250, 0);
}
function scendi(){
  STATO.piano++; var n = STATO.piano;
  (STATO.log = STATO.log||[]).push({ p:n, pot:+STATO.R.pot.toFixed(3), safe:+STATO.R.safe.toFixed(3), tr:+STATO.trovati.toFixed(3), sp:+STATO.spesi.toFixed(3), hp:P.hp, hm:P.hpMax, t:Math.round(SIMMS()/1000) });
  MAPPA = generaPiano(n, STATO.rngM);
  if(STATO.flag.occhioVetro) rivela();
  STATO.chiavePiano = 0; STATO.botolaBoss = 0; STATO.arena = null;
  fase = 'pausa'; precuoci(n);
  schermataPiano(n, function(){ entra(MAPPA.start, null); hud.tutto(); disegnaMini();
    if(n===1) setTimeout(function(){ banner('PIANO 1 · I SALONI', 'trova il tavolo ♠', 2); }, 200); });
}
function precuoci(n){ if(!VIS) return; /* niente scatti al primo disegno: gli sprite si cuociono durante la schermata del piano */
  for(var k in ND){ var d = ND[k], sp = cuoci(d.img, d.h, 1.8, '#0a0508'); var s2 = cuoci(d.img, d.h, 1.6, '#000'); if(s2 && !s2._fr) s2._fr = frammenti(s2, d.h>50?6:4); }
  var bt = STORIA.PIANI[n].boss; if(bt){ cuoci(BD[bt].img, BD[bt].h, 2.2, '#0a0508'); var b2 = cuoci(BD[bt].img, BD[bt].h, 2, '#000'); if(b2 && !b2._fr) b2._fr = frammenti(b2, 12); }
  cuoci('m_bot', 50, 1.8, '#0a0508'); var m2 = cuoci('m_bot', 50, 1.6, '#000'); if(m2 && !m2._fr) m2._fr = frammenti(m2, 6); fondoStanza(); }
function transita(nx, dir){
  if(TR.on) return;
  TR.snap.width = cv.width; TR.snap.height = cv.height; TR.snap.getContext('2d').drawImage(cv, 0, 0);
  TR.dir = dir; TR.t = 0; TR.to = nx; TR.on = true; IN.dash = false; sfx('porta');
  salvaDec();
}
var TR = { snap:document.createElement('canvas'), t:0, dir:0, to:null, dur:0.28, on:false };
/* il piano 9: dopo la Casa, l'ultima mano. Gli attrezzi rendono il tiro più
   facile — e quindi, per costruzione, pagano meno (il boss accecato). */
function finisci(esito){
  if(STATO.finito) return; STATO.finito = true;
  var R = STATO.R;
  if(esito==='trascinato'){ STATO.borsaPersa = R.pot; R.pot = 0; }
  R.esito = esito; R.premio = 0; R.uscita = R.pot + R.safe;
  var F = STORIA.finale(GAPI, esito==='incasso' ? (R.esito==='incasso'?'incasso':R.esito) : esito);
  STATO.esitoFinale = esito; STATO.finale = F.tit; STATO.Tfine = SIM.T;
  fase = 'pausa'; suono.musica(null);
  window.__FINE = { esito:esito, finale:F.tit, piano:STATO.piano, uscita:R.uscita, posta:R.posta, tempi:STATO.tempi.slice(), colpi:STATO.colpi, uccisi:STATO.uccisi,
                    durata:Math.round(SIMMS()/1000), T:SIM.T, fps:statFps(), safe:R.safe, pot:R.pot, firma:(STATO.firmaFine = firmaStato()), rs:RS.n(), scelte:STATO.scelte.slice(), diario:STATO.diario.join(' '), trovati:STATO.trovati, spesi:STATO.spesi, salvati:STATO.salvati, persa:STATO.borsaPersa, acquisti:STATO.acquisti, abil:PIL.abil, pol:PIL.pol, log:STATO.log, poteri:STATO.poteri.slice(), flag:JSON.parse(JSON.stringify(STATO.flag)) };
  if(!SIM.rigioco){ try{ console.log('FINE '+JSON.stringify(window.__FINE)); }catch(e){} }
  if(typeof OSPITE!=='undefined' && OSPITE.fine) OSPITE.fine(window.__FINE);
  if(SIM.rigioco) return;
  if(esito!=='trascinato' && R.uscita>0 && !MODE.turbo) setTimeout(function(){ festaIncasso(function(){ schermataFinale(F, esito); }); }, 100);
  else setTimeout(function(){ schermataFinale(F, esito); }, esito==='trascinato' ? 200 : 100);
  if(typeof OSPITE!=='undefined' && OSPITE.modo==='prova') saldo(saldo() + R.uscita);
}
function statFps(){ var a = STATO.fps.slice().sort(function(x,y){ return x-y; }); if(!a.length) return null;
  return { n:a.length, min:+a[0].toFixed(1), p05:+a[Math.floor(a.length*0.05)].toFixed(1), p50:+a[Math.floor(a.length*0.5)].toFixed(1) }; }

/* ══ L'ANELLO ══ */
var ultimo = 0;
function passo(dt){
  if(TR.on){ TR.t += dt; if(TR.t >= TR.dur*0.5 && TR.to){ var to = TR.to; TR.to = null; entra(to, TR.dir); } if(TR.t >= TR.dur) TR.on = false; return; }
  if(fase==='pausa' || STATO.carta || STATO.finito || STATO.mappaAperta) return;
  if(P.dead){ STATO.morteT -= dt; aggProiettili(dt*0.4); if(STATO.morteT<=0) finisci('trascinato'); return; }
  if(hitStop>0){ hitStop -= dt; dt *= 0.15; }
  if(slowmo>0){ slowmo -= dt; dt *= 0.45; }
  roomT += dt;
  aggGiocatore(dt); limitaGiocatore(); aggNemici(dt); if(boss) aggBoss(dt); aggProiettili(dt); aggCompagna(dt); aggPick(dt);
  if(fase==='combat' && !boss && ROOM && !ROOM.cl){
    if(vivi()===0){ if(waveGap===0) waveGap = 0.5; else { waveGap -= dt; if(waveGap<=0){ waveGap = 0;
        if(piano_ && ondata < piano_.length-1){ ondata++; spawnOndata(piano_[ondata]); banner('ONDATA '+(ondata+1), '', 0.8); } else stanzaPulita(); } } }
    else waveGap = 0; }
}
function disegna(){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle = '#0d0710'; ctx.fillRect(0,0,CW,CH);
  if(!STATO || !STATO.avviata || !ROOM) return;
  if(MODE.turbo && (ciclo._k=(ciclo._k|0)+1)%4) return;
  var sx = 0, sy = 0;
  if(trauma>0.002){ var sm = trauma*trauma, amp = 8*sm*SC; sx = (RV()-0.5)*amp + shDx*amp*0.5; sy = (RV()-0.5)*amp + shDy*amp*0.5; }
  if(TR.on){
    var h = TR.dur*0.5, W = K.RW*SC, H = K.RH*SC, dx = DIRS[TR.dir][0], dy = DIRS[TR.dir][1];
    if(TR.to){ var u = eOutCubic(Math.min(1, TR.t/h)); ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(TR.snap, -dx*W*u*0.6*dpr, -dy*H*u*0.6*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.fillStyle = 'rgba(7,3,8,'+Math.min(1,u*1.1)+')'; ctx.fillRect(0,0,CW,CH); }
    else { var v = eOutCubic(Math.min(1, (TR.t-h)/h)); disegnaStanza(dx*W*(1-v)*0.6, dy*H*(1-v)*0.6); ctx.fillStyle = 'rgba(7,3,8,'+Math.max(0,(1-v))+')'; ctx.fillRect(0,0,CW,CH); }
  } else disegnaStanza(sx, sy);
  if(boss && boss.st!=='morto') disegnaPresentazione();
  if(lampo>0){ ctx.globalAlpha = Math.min(0.55, lampo)*0.5; ctx.fillStyle = lampoCol; ctx.fillRect(0,0,CW,CH); ctx.globalAlpha = 1; }
  /* vignetta sull'ultimo cuore: il bordo pulsa rosso */
  if(P.hp<=2 && !P.dead){ var pu = 0.25+0.2*DM.sin(performance.now()/260), vg = ctx.createRadialGradient(CW/2,CH/2,Math.min(CW,CH)*0.35,CW/2,CH/2,Math.max(CW,CH)*0.7);
    vg.addColorStop(0,'rgba(184,32,46,0)'); vg.addColorStop(1,'rgba(184,32,46,'+pu+')'); ctx.fillStyle = vg; ctx.fillRect(0,0,CW,CH); }
}
function ciclo(ts){
  requestAnimationFrame(ciclo);
  if(!ultimo){ ultimo = ts; return; }
  var raw = (ts-ultimo)/1000; ultimo = ts; if(raw>0.1) raw = 0.1; if(raw<=0) raw = 0.001;
  if(STATO && fase==='combat' && vivi()+(boss?4:0)>=4 && !STATO.carta){ STATO.fps.push(1/raw); if(raw>0.04){ (window.__LENTI=window.__LENTI||[]).push({ms:Math.round(raw*1000), t:Math.round(performance.now()), n:vivi(), room:roomT.toFixed(2)}); } }
  if(lampo>0){ lampo -= raw*3.2; if(lampo<0) lampo = 0; }
  if(trauma>0){ trauma -= raw*1.7; if(trauma<0) trauma = 0; }
  /* IL PASSO FISSO: i fotogrammi decidono solo QUANDO si fanno i passi, mai quanto valgono */
  if(STATO && STATO.avviata && !SIM.rigioco){ leggiTasti();
    if(typeof OSPITE!=='undefined' && OSPITE.fermo && OSPITE.fermo()){ SIM.acc = 0; }
    else if(MODE.turbo){ for(var i=0;i<MODE.turbo;i++) passoSim(); }
    else { SIM.acc += raw * (MODE.veloce ? 2 : 1); var nn = 0; while(SIM.acc >= SIM.DT - 1e-9 && nn < 8){ passoSim(); SIM.acc -= SIM.DT; nn++; } if(nn>=8) SIM.acc = 0; } }
  /* il disegno non deve MAI fermare il gioco: un numero storto in una sfumatura sporca un fotogramma e basta */
  try{ disegna(); }catch(eD){ if(!ciclo._errD){ ciclo._errD = 1; try{ console.warn('disegno: '+eD.message); }catch(e2){} } }
  var bd = $('btnDash'); if(bd){ var cool = P.dashCd>0; if(cool!==bd._c){ bd._c = cool; bd.classList.toggle('cool', cool); } }
  if(MODE.dbg){ var d = $('dbg'); d.style.display='block'; d.textContent = Math.round(1/raw)+'fps f='+fase+' n='+vivi()+' eb='+EB.filter(function(b){return b.on;}).length+' t='+roomT.toFixed(1); }
}

/* ══ IL PILOTA: gioca la notte da solo, per le misure. Non tocca il motore:
   scrive negli stessi comandi delle levette (IN) e clicca le stesse carte. ══ */
var PIL = { cd:0, bersaglio:null, prev:{}, lato:1, fermo:0, lx:0, ly:0, abil:(QS.match(/abil=(\d)/)||[0,3])[1]|0, pol:(QS.match(/pol=(\w+)/)||[0,'salva'])[1], rit:0 };
/* le quattro abilità: errore di mira, tempo di reazione, quanto schiva, quanto usa lo scatto */
var ABIL = [ { nm:'principiante', mira:0.45, reaz:0.22, schiva:0.45, dash:0.25, vede:0.40 },
             { nm:'medio',        mira:0.25, reaz:0.12, schiva:0.70, dash:0.55, vede:0.55 },
             { nm:'bravo',        mira:0.12, reaz:0.05, schiva:0.90, dash:0.85, vede:0.65 },
             { nm:'fortissimo',   mira:0.06, reaz:0.00, schiva:1.00, dash:1.00, vede:0.72 } ];
function pilotaPozzo(){ return PIL.pol==='avido' ? 2 : 0; }
function pilotaCompra(m){ if(PIL.pol==='avido') return false; if(STATO.R.pot < m.prezzo) return false;
  if(PIL.pol==='salva') return (m.k==='cura' && P.hp<=P.hpMax-4);
  if(m.k==='cura' && P.hp>=P.hpMax) return false; if(m.k==='ripara' && !STATO.poteri.length) return false; return true; }
function pilotaScelta(id, n){ if(id==='lena2_nemica') return 1; if(id==='esattore_boss') return n-1; if(id==='dea') return 0; return (RP()*n)|0; }
/* il pilota: prima di ogni passo guarda la scena (come passo(), ma senza muovere niente) */
function pilotaPrima(){ if(TR.on || fase==='pausa' || STATO.carta || STATO.finito || STATO.mappaAperta || P.dead) return; pilota(SIM.DT); }
/* il pilota «preme» un bottone della carta: se nel frattempo la carta è cambiata, non preme niente */
var AZ_GEN = 0;
function pilotaClic(ms, k){ if(!MODE.pilota) return; var g = AZ_GEN; setTimeout(function(){ if(AZ_GEN!==g) return; premi(typeof k==='function' ? k() : k); }, ms); }
function pilotaMeta(){
  /* dove andare: stanze da pulire, il tavolo, l'incontro, il pozzo, il tesoro se ho una chiave, il boss; la botola solo alla fine */
  var tv = MAPPA.list.some(function(x){ return x.t==='tavolo' && x.fatto; });
  var vuoi = function(r){
    if(r.t==='combat' && !r.cl) return 3; if(r.t==='tavolo' && !r.fatto) return 5; if(r.t==='dialogo' && !r.fatto) return 4;
    if(r.t==='pozzo' && !r.fatto && PIL.pol!=='avido' && STATO.R.pot>0.0001) return 8; if(r.t==='tesoro' && !r.fatto && (!r.chiusa || STATO.chiavi>0)) return 2;
    if(r.t==='negozio' && !r.visto2 && PIL.pol!=='avido') return 1; if(r.t==='segreta' && r.aperta && !r.visto2) return 1;
    if(r.t==='boss' && !r.cl) return (tv||STATO.piano===9) ? 6 : 0;
    return 0; };
  var fine = function(r){ return (r.t==='boss' && r.cl && STATO.botolaBoss) || (r.t==='tavolo' && r.fatto && !STORIA.PIANI[STATO.piano].boss); };
  var q = [[ROOM,-1,0]], visti = {}, best = null, bd = -1e9, bestF = null, bdF = 1e9; visti[ROOM.x+'_'+ROOM.y] = 1;
  while(q.length){ var it = q.shift(), r = it[0];
    var v = vuoi(r), punt = v*10 - it[2]*4; if(r!==ROOM && v>0 && punt>bd){ bd = punt; best = it[1]; }
    if(r!==ROOM && fine(r) && it[2]<bdF){ bdF = it[2]; bestF = it[1]; }
    for(var i=0;i<4;i++){ var o = vicino(r,i); if(!o || (o.nascosta && !o.aperta) || visti[o.x+'_'+o.y]) continue; if(o.chiusa && STATO.chiavi<=0) continue; visti[o.x+'_'+o.y] = 1; q.push([o, it[1]<0?i:it[1], it[2]+1]); } }
  if(best!=null) return best;
  if(fine(ROOM)) return null;
  return bestF;
}
function pilota(dt){
  var A = ABIL[PIL.abil]; PIL.cd -= dt;
  /* il tempo di reazione: il pilota rivede la scena solo ogni tanto, nel frattempo tiene i comandi */
  PIL.rit -= dt; if(PIL.rit > 0) return; PIL.rit = A.reaz*(0.6+RP()*0.8);
  var bersaglio = null, bdist = 1e9;
  EN.forEach(function(e){ if(!e.on || e.nato<0.3) return; var d = DM.hypot(e.x-P.x,e.y-P.y); if(d<bdist){ bdist = d; bersaglio = e; } });
  var bossT = null;
  if(boss && boss.carte && boss.carte.t > boss.carte.mostra && RP() < [0.3,0.55,0.8,0.95][PIL.abil]){ var cg = boss.carte.l.filter(function(k){ return !k.via && k.giusta; })[0]; if(cg){ bersaglio = { x:cg.x, y:cg.y+12, kind:'boss' }; bdist = DM.hypot(cg.x-P.x, cg.y-P.y); } }
  if(!bersaglio && bossAttivo() && boss.debole){ var dp = (boss.debole.pts||[[boss.debole.dx,boss.debole.dy]])[0]; bossT = { x:boss.x+dp[0], y:boss.y+dp[1]+14, kind:'boss' }; bersaglio = bossT; bdist = DM.hypot(bossT.x-P.x, bossT.y-P.y); }
  else if(bossAttivo()){ bossT = { x:boss.x, y:boss.y-boss.dy*0.6+10, kind:'boss' }; var db = DM.hypot(bossT.x-P.x, bossT.y-P.y); if(db<bdist+80){ bdist = db; bersaglio = bossT; } }
  var gx = null, gy = null;
  if(bersaglio){
    var key = bersaglio.kind==='boss' ? 'boss' : EN.indexOf(bersaglio), pv = PIL.prev[key] || { x:bersaglio.x, y:bersaglio.y }, vx = (bersaglio.x-pv.x)/Math.max(dt,0.001), vy = (bersaglio.y-pv.y)/Math.max(dt,0.001);
    PIL.prev[key] = { x:bersaglio.x, y:bersaglio.y };
    var ey = bersaglio.kind==='boss' ? bersaglio.y : bersaglio.y - ND[bersaglio.kind].h*0.28;
    var tf = bdist/(K.B_SPD*Wp.spd), ax = bersaglio.x + clamp(vx,-300,300)*tf*0.6 - P.x, ay = ey + clamp(vy,-300,300)*tf*0.6 - (P.y-14), am = DM.hypot(ax,ay)||1;
    var err = (RP()-0.5)*2*A.mira, aa = DM.atan2(ay,ax)+err; IN.ax = DM.cos(aa); IN.ay = DM.sin(aa); IN.aon = true;
    /* schivare: per ogni colpo, il punto di massimo avvicinamento */
    var fx = 0, fy = 0, urgente = 0, ux = 0, uy = 0;
    EB.forEach(function(b){ if(!b.on) return; var rx = P.x-b.x, ry = (P.y-10)-b.y, vv = b.vx*b.vx+b.vy*b.vy; if(vv<1) return;
      var tca = (rx*b.vx+ry*b.vy)/vv; if(tca<0 || tca>A.vede) return; if(RP()>A.schiva) return; var mx = rx - b.vx*tca, my = ry - b.vy*tca, miss = DM.hypot(mx,my);
      if(miss<26){ var w = (26-miss)/(tca+0.08); var nx = mx/(miss||1), ny = my/(miss||1); if(miss<0.5){ nx = -b.vy/Math.sqrt(vv); ny = b.vx/Math.sqrt(vv); } fx += nx*w*6; fy += ny*w*6;
        if(tca<0.2 && miss<16){ urgente++; ux = nx; uy = ny; } } });
    EN.forEach(function(e){ if(!e.on) return; var dx = P.x-e.x, dy = P.y-e.y, d = DM.hypot(dx,dy)||1, lim = (e.tele>0||e.st===2)?140:100; if(d<lim){ fx += dx/d*(lim-d)*3; fy += dy/d*(lim-d)*3; } });
    if(bossT){ var dx2 = P.x-boss.x, dy2 = P.y-boss.y, d2 = DM.hypot(dx2,dy2)||1; if(d2<170){ fx += dx2/d2*(170-d2)*4; fy += dy2/d2*(170-d2)*4; }
      if(boss.beams){ boss.beams.o.forEach(function(o){ var rx=DM.cos(o.a), ry=DM.sin(o.a), px=P.x-o.x, py=P.y-10-o.y, pr=px*rx+py*ry, perp=px*(-ry)+py*rx; if(pr>0 && Math.abs(perp)<50){ var sg = perp>=0?1:-1; fx += -ry*sg*300; fy += rx*sg*300; } }); }
      boss.cerchi.forEach(function(c){ var dx=P.x-c.x, dy=P.y-c.y, d=DM.hypot(dx,dy)||1; if(d<c.r+26){ fx+=dx/d*300; fy+=dy/d*300; } });
      if(boss.st==='carica_leva'){ var dx3=P.x-boss.tx, dy3=P.y-boss.ty, d3=DM.hypot(dx3,dy3)||1; if(d3<60){ fx+=dx3/d3*400; fy+=dy3/d3*400; } }
      if(boss.st==='carica_carica'||boss.st==='scatto'){ var rx4=DM.cos(boss.aimA), ry4=DM.sin(boss.aimA), px4=P.x-boss.x, py4=P.y-boss.y, perp4=px4*(-ry4)+py4*rx4; if(Math.abs(perp4)<60){ var s4=perp4>=0?1:-1; fx+=-ry4*s4*400; fy+=rx4*s4*400; if(boss.st==='scatto'&&PIL.cd<=0){ IN.dash=true; PIL.cd=0.9; } } } }
    if(urgente && PIL.cd<=0 && P.dashCd<=0 && RP()<A.dash){ IN.mvx = ux; IN.mvy = uy; IN.dash = true; PIL.cd = 0.8; }
    if(RP()<0.008) PIL.lato *= -1;
    var ideale = bersaglio.kind==='boss' ? 190 : 150;
    var a = DM.atan2(P.y-bersaglio.y, P.x-bersaglio.x) + 0.7*PIL.lato;
    gx = bersaglio.x + DM.cos(a)*ideale + fx*0.15; gy = bersaglio.y + DM.sin(a)*ideale + fy*0.15;
    gx = clamp(gx, fx0+34, fx1-34); gy = clamp(gy, fy0+44, fy1-30);
    if(DM.hypot(fx,fy)>60){ gx = P.x+fx; gy = P.y+fy; }
  } else {
    IN.aon = false; IN.ax = IN.ay = 0;
    if(fase==='porta' && PIL.pol!=='avido' && P.hp<=2 && !STATO.carta && !STATO.finito){ if(!PIL._inc){ PIL._inc = 1; COMANDO('incassa'); } return; }
    if(fase==='porta'){
      var pk = PICK.filter(function(it){ return it.on && !(it.k==='cuore' && P.hp>=P.hpMax); })[0];
      var pr = PROPS.filter(function(p){ return (p.k==='tavolo'&&!ROOM.fatto) || (p.k==='pozzo'&&!ROOM.fatto&&PIL.pol!=='avido') || (p.k==='npc'&&!p.fatto) || (p.k==='piedistallo'&&!p.fatto) || (p.k==='merce' && !p.m.venduto && pilotaCompra(p.m)) || (p.k==='botola' && pilotaMeta()==null); })[0];
      if(pk){ gx = pk.x; gy = pk.y; }
      else if(pr){ gx = pr.x; gy = pr.y; }
      else { ROOM.visto2 = 1; var d = pilotaMeta(); if(d!=null){ var pp = puntoPorta(d); gx = pp.x + DIRS[d][0]*40; gy = pp.y + DIRS[d][1]*40; if(Math.abs(P.x-pp.x)>8 && (d===0||d===2)) gy = P.y + (pp.y-P.y)*0.3, gx = pp.x; if(Math.abs(P.y-pp.y)>8 && (d===1||d===3)) gx = P.x + (pp.x-P.x)*0.3, gy = pp.y; } }
    }
  }
  if(gx!=null && !IN.dash){ var dx = gx-P.x, dy = gy-P.y, dd = DM.hypot(dx,dy); if(dd>4){ IN.mvx = dx/dd; IN.mvy = dy/dd; } else { IN.mvx = IN.mvy = 0; } }
  else if(gx==null){ IN.mvx = IN.mvy = 0; }
  if(DM.hypot(P.x-PIL.lx, P.y-PIL.ly) < 0.3 && (IN.mvx||IN.mvy)){ PIL.fermo += dt; if(PIL.fermo>0.6){ var t = IN.mvx; IN.mvx = -IN.mvy; IN.mvy = t; PIL.fermo = 0; } } else PIL.fermo = 0;
  PIL.lx = P.x; PIL.ly = P.y;
}

/* ══ I COMANDI (fuori dalle carte): passano dal registro ══ */
COMANDI.incassa = function(){ if(STATO && STATO.avviata && !STATO.carta && !STATO.finito) chiediIncasso(); };
COMANDI.menu = function(){ apriMenu(); };
COMANDI.mappa1 = function(){ if(!STATO.carta && !STATO.finito) apriMappa(); };
COMANDI.mappa0 = function(){ chiudiMappa(); };
COMANDI.presenta = function(){ saltaPresentazione(); };
COMANDI.salta = function(){ if(SCHERMATA_VIA) SCHERMATA_VIA(); };
COMANDI.passa = function(){ pagaPassaggio(); };
/* ══ AVVIO ══ */
function avvio(){
  layout(); comandi();
  if(('ontouchstart' in window) || navigator.maxTouchPoints>0){ document.body.classList.add('touch'); layout(); }
  $('icChiave').src = ART.i_chiave;
  $('mini').onclick = function(){ COMANDO('mappa1'); }; $('btnMenu').onclick = function(){ COMANDO('menu'); }; $('btnIncassa').onclick = function(){ COMANDO('incassa'); }; document.querySelector('#mappaG .mchiudi').onclick = function(){ COMANDO('mappa0'); }; $('mappaG').onclick = function(e){ if(e.target.id==='mappaG') COMANDO('mappa0'); };
  window.addEventListener('keydown', function(ev){ if((ev.key==='m'||ev.key==='M'||ev.key==='Escape') && STATO && STATO.mappaAperta){ COMANDO('mappa0'); } });
  if(MODE.dbg || MODE.pilota || MODE.bench){ window.__G = { get STATO(){ return STATO; }, P:P, EN:EN, EB:EB, get boss(){ return boss; }, get fase(){ return fase; }, get ROOM(){ return ROOM; }, get MAPPA(){ return MAPPA; }, IN:IN, ECO:ECO, statFps:statFps, prendiPotere:prendiPotere, evento:apriEvento, tavolo:apriTavolo, pozzo:apriPozzo, chiudi:function(){ chiudiCarta(1); }, casa:laCasaParla, finale:function(e){ STATO.R.uscita=STATO.R.uscita||STATO.R.pot; schermataFinale(STORIA.finale(GAPI,e), e); }, mappa:apriMappa, GAPI:GAPI, versus:versus, banco:banco, entra:entra, ferisci:feriscBoss, dir:function(){ return ROOM.entrata; } }; }
  cv.addEventListener('pointerdown', function(){ if(boss && boss.st==='intro') COMANDO('presenta'); }); window.addEventListener('keydown', function(ev){ if(ev.key==='Enter' && boss && boss.st==='intro') COMANDO('presenta'); });
  requestAnimationFrame(ciclo);
  if(MODE.banco){ banco(20000); return; }
  if(MODE.tavola){ tavola40(); return; }
  if(MODE.bench){ PORTA.cb = 0; nuovaNotte(10, 1234); setTimeout(benchStanza, 2500); return; }
  if(typeof OSPITE!=='undefined' && OSPITE.avvio){ OSPITE.avvio(); return; }
  titolo();
}
/* ?bench: una stanza piena e una tempesta di colpi, poi fps minimo e p50 */
function benchStanza(){
  if(STATO.carta){ premi(0); setTimeout(benchStanza, 300); return; }
  if(!ROOM || fase==='pausa'){ setTimeout(benchStanza, 300); return; }
  ['tripletta','sponda','scoppio','scorta','raffica','specchio'].forEach(function(id){ prendiPotere(id); });
  var tipi = ['slot','mazziere','serpente','buttafuori','corazzato','pistolero','cecchino','fantasma','dado','dinamite','lama','scagnozzo'];
  for(var q=0;q<16;q++){ var a = q/16*6.283, e0 = spawn(tipi[q%tipi.length], K.RW/2+DM.cos(a)*120, K.RH/2+DM.sin(a)*170, 1); if(e0){ e0.hp*=8; e0.hpMax*=8; } }
  ROOM.cl = false; ROOM.t = 'combat'; fase = 'combat'; piano_ = [[['scagnozzo',1]]]; STATO.fps = [];
  var n = 0, t0 = performance.now(), tick = setInterval(function(){ var t = performance.now()/1000; IN.mvx = DM.cos(t*1.7); IN.mvy = DM.sin(t*2.3); IN.ax = DM.cos(t*3.1); IN.ay = DM.sin(t*3.1); IN.aon = true; P.iframe = 9;
    if(vivi()<14){ var e1 = spawn(pick(tipi), rnd(fx0+30,fx1-30), rnd(fy0+30,fy1-30), 1); if(e1){ e1.hp*=8; e1.hpMax*=8; } }
    if(performance.now()-t0 > 10000){ clearInterval(tick); window.__BENCH = statFps(); window.__BENCH.eb = EB.filter(function(b){return b.on;}).length; window.__BENCH.pb = PB.filter(function(b){return b.on;}).length; window.__BENCH.nemici = vivi(); console.log('BENCH '+JSON.stringify(window.__BENCH)); } }, 30);
}
/* ?tavola: IL METRO DEI 40 px con gli sprite COME LI DISEGNA IL GIOCO (contorno compreso), su un pavimento vero */
function tavola40(){
  var nomi = Object.keys(ND).filter(function(k){ return !ND[k].mini; }), boss = Object.keys(BD), tot = nomi.length+boss.length+1;
  var cw = 330, rh = 200, cols = 3, rows = Math.ceil(tot/cols), c = document.createElement('canvas'); c.width = cols*cw; c.height = rows*rh+50;
  var g = c.getContext('2d'), fondo = fondale('f_saloni', 0.56);
  g.fillStyle = '#0d0710'; g.fillRect(0,0,c.width,c.height); g.fillStyle = '#e8b44a'; g.font = '700 20px '+FUI; g.fillText('IL METRO DEI 40 px — sprite di gioco a 160 / 80 / 40 px, sul pavimento vero', 12, 30);
  var voci = nomi.map(function(k){ return { nm:ND[k].nm, img:ND[k].img, tip:ND[k].tip }; }).concat(boss.map(function(k){ return { nm:BD[k].nm, img:BD[k].img, tip:'boss' }; })).concat([{ nm:'GAMBLER BOT', img:'m_bot', tip:'il protagonista' }]);
  voci.forEach(function(v, i){ var x = (i%cols)*cw, y = 50 + ((i/cols)|0)*rh;
    if(fondo) g.drawImage(fondo, 200, 300, 400, 240, x+4, y, cw-8, rh-8); g.fillStyle='rgba(13,7,16,.35)'; g.fillRect(x+4,y,cw-8,rh-8);
    g.fillStyle = '#f1e6cf'; g.font = '700 14px '+FUI; g.fillText(v.nm, x+10, y+18); g.fillStyle = '#bdb09a'; g.font = '500 12px '+FUI; g.fillText(v.tip||'', x+10, y+33);
    var px = x+10; [160,80,40].forEach(function(S){ var s = cuoci(v.img, S*0.95, S>=80?2:1.8, '#0a0508'); if(s){ var w = s.w*(S/s.h); w = Math.min(w, S); g.drawImage(s.c, px, y+40+(150-S), w*s.h/S* (S/s.h), S); }
      g.fillStyle = '#bdb09a'; g.font = '500 11px '+FUI; g.fillText(S+' px', px, y+rh-12); px += S+12; }); });
  schermo('<div class="col" style="width:100%;max-width:none"></div>'); $('schermo').querySelector('.col').appendChild(c); c.style.width = '100%';
  window.__TAVOLA = c.toDataURL('image/png');
}
if(!SENZA_AVVIO) caricaArte(avvio);

/* ══ z_api.js — la porta del motore verso fuori (l'ospite nella pagina, l'arbitro sul server) ══ */
var GRN_API = {
  versione: '4a62dceafe53',
  SIM: SIM, MODE: MODE, PIL: PIL, IN: IN, DM: DM,
  get STATO(){ return STATO; }, get fase(){ return fase; }, get ROOM(){ return ROOM; }, get boss(){ return boss; }, get MAPPA(){ return MAPPA; }, P: P, get PROPS(){ return PROPS; }, get PICK(){ return PICK; }, EN: EN,
  pilotaMeta: function(){ return pilotaMeta(); },
  nuovaNotte: nuovaNotte, passoSim: passoSim, applicaScelte: applicaScelte, firmaStato: firmaStato,
  Registro: Registro, Lettore: Lettore, AZIONE: AZIONE, COMANDO: COMANDO, premi: premi,
  finisci: finisci, chiediIncasso: chiediIncasso,
  /* LA RIGIOCATA: stessa notte, stesso seme, i comandi dal registro. Ritorna lo stato alla fine.
     reg = { r:[[n,mx,my,ab,bit],...], ev:[[T,c,a],...] }  ·  posta in euro  ·  opz.fino = passi massimi */
  rigioca: function(posta, seme, reg, opz){
    opz = opz || {};
    SIM.rigioco = true; SIM.reg = null; SIM.ingresso = new Lettore(reg);
    var N = SIM.ingresso.n, max = opz.fino || N;
    SIM.firmeOgni = opz.firmeOgni || 0;
    nuovaNotte(posta, seme);
    while(SIM.T < max){
      applicaScelte();
      if(STATO.finito) break;
      passoSim();
      if(STATO.finito) break;
    }
    /* le scelte dopo l'ultimo passo (es. l'ultimo clic, fatto quando il registro era già chiuso) */
    if(!STATO.finito && SIM.T >= max) applicaScelte();
    return GRN_API.esito(SIM.firme);
  },
  esito: function(firme){
    var R = STATO.R;
    return { T: STATO.finito ? STATO.Tfine : SIM.T, finito: !!STATO.finito, esito: STATO.esitoFinale || null, piano: STATO.piano, pot: R.pot, safe: R.safe,
             uscita: STATO.finito ? R.uscita : null, posta: R.posta, trovati: STATO.trovati, spesi: STATO.spesi, salvati: STATO.salvati,
             storia: { boss: (STATO.bossBattuti || []).slice(), ingranaggi: STATO.ingranaggi | 0, lena: !!STATO.flag.compagna, finale: STATO.finale || null },
             hp: P.hp, fase: fase, carta: !!STATO.carta, morto: !!P.dead, firma: STATO.finito ? STATO.firmaFine : firmaStato(), rs: RS.n(), firme: firme || [] };
  }
};
if(typeof window !== 'undefined') window.GRN_API = GRN_API;

})();
