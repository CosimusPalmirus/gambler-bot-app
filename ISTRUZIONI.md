1. PRIMA carica la cartella `gembrawl/` (CARICA_A_LOTTI) e controlla con `bash rilascia_gembrawl.sh --pagine`.
2. POI carica su `gambler-bot-app`, alla radice, i 3 file di questa cartella: `index.html` (sostituisce quello di prima), `gbx_bn_gembrawl.webp`, `gbx_pv_gembrawl.webp` (md5 in `MD5.txt`, index `c5510fa7`).
3. Fatto: in home (gruppo Arena) e nell'Arena (primo banner, Novità, Tempo reale) c'è GEM BRAWL «NUOVO · Gratis contro i bot»; il tocco apre il gioco, si torna con il tasto Indietro di Telegram.
4. Poi `bash rilascia_gembrawl.sh --bot`: ora il bot porta anche la mini app a `?v=20261123a`, e lo script si ferma se su Pages l'index non è ancora `c5510fa7`. Bot senza mini app nuova: `SENZA_MINIAPP=1 bash rilascia_gembrawl.sh --bot`.
5. Per tornare indietro: ricarica `live/index_LIVE_12cef89f_INDIETRO.html` come `index.html` (le due immagini possono restare).
