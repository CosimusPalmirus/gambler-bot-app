# I TRE FILE DI TON CONNECT — cosa sono, e come si caricano

*Preparati il 07/08/2026. Vanno su GitHub Pages **PRIMA** di `index.html`.*

| file | cos'e' | da dove viene |
|---|---|---|
| `tonconnect-ui.min.js` | il codice del bottone "connetti il wallet" | **compilato qui**, vedi sotto |
| `tonconnect-manifest.json` | chi siamo, per il wallet | scritto a mano |
| `gb-icon-180.png` | l'icona che il wallet mostra | dal logo `gb-logo.webp` |

---

## Perche' il bundle e' COMPILATO e non scaricato

`TON_RESTA.md` §2.3 diceva "scarica il bundle `@tonconnect/ui`". Misurato il
07/08: **quel bundle non esiste**. Il pacchetto npm spedisce solo CJS
(`lib/index.cjs`) ed ESM (`lib/index.mjs`), e l'ESM ha **import esterni**:

    @tonconnect/sdk · classnames · deepmerge · ua-parser-js

Un `<script src>` non li risolve. Non c'e' build UMD nemmeno nella 2.x.
E i "bundle" dei CDN non sono autonomi: `esm.sh?bundle` restituisce un guscio
che re-importa altre URL, e `jsdelivr/+esm` riferisce ancora i quattro
moduli. Quindi: o si compila, o si carica codice da un CDN a ogni apertura.

**Non si carica da un CDN.** Questa pagina muove soldi: un CDN compromesso
sarebbe codice arbitrario dentro la sessione del giocatore, con il wallet
collegato. Il file lo ospitiamo noi.

## Come e' stato compilato (riproducibile)

```bash
npm install @tonconnect/ui@3.0.2 esbuild
echo 'export * from "@tonconnect/ui";' > entry.mjs
npx esbuild entry.mjs --bundle --format=iife --global-name=TON_CONNECT_UI \
    --target=es2019 --minify --legal-comments=none \
    --define:process.env.NODE_ENV='"production"' \
    --outfile=tonconnect-ui.min.js
```

- `@tonconnect/ui@3.0.2`, licenza **Apache-2.0**
  npm integrity: `sha512-bAOVfN3p/x40Bx7VcvAmH0DvGKwN9qNnkYUqkhUVckHOdwgfdtEMAQaE3w4Dabguse4VoXDzdmf/1rSl56wEgQ==`
- esbuild **0.28.1**, target **es2019**, formato **iife**
- **SHA-256 del file prodotto:**
  `6d7571626cdd114e4ef1121cbf854e599ab2be1589b741b91378758bcd8a17ad`
  (462.857 byte — ricontrollalo dopo l'upload: `sha256sum` sul file scaricato
  da Pages deve dare lo stesso numero)

## Cosa e' stato verificato

- `node --check` passa: **un errore di parse qui spegnerebbe lo script**;
- **zero** `import(` dinamici, `importScripts`, o `<script>` iniettati: il
  file non scarica altro codice a runtime;
- le uniche URL esterne che contiene sono **dati**, non codice — la lista dei
  wallet (`config.ton.org/wallets-v2.json`). Il browser la chiamera' quando
  il giocatore apre il selettore dei wallet;
- in un **browser vero** (non headless-a-scatola-chiusa): il globale
  `TON_CONNECT_UI` esiste, `TonConnectUI` e' un costruttore, si istanzia col
  **nostro** manifest, espone `connectWallet()` e `sendTransaction()`, e
  parte `connected === false`.

## Come si carica, e la regola che non si viola

1. Carica **prima** questi tre file sul repo Pages.
2. Verifica che rispondano 200 (soprattutto il manifest: oggi e' 404).
3. **Solo dopo** carica `index.html`, e poi bumpa il `?v=`.

> **Il bundle va in un blocco `<script src>` SUO, mai dentro il blocco
> grande.** E' es2019 contro un file scritto in ES5, e **un errore di parse
> dentro il blocco grande spegne TUTTI i giochi**, non solo il bottone.

## Quello che il manifest NON dice

`ton_proof` lega al **dominio**, non alla persona. Il dominio e'
`cosimuspalmirus.github.io`, **condiviso con ogni altro repo di
quell'account**. Quindi una prova valida dimostra "questo wallet ha firmato
per quel dominio", non "questo wallet e' di quel giocatore":
**l'attribuzione per mittente non e' mai un accredito automatico.**
