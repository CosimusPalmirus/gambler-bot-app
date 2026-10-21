// Prova degli OGGETTI AI nel CHROME VERO (GPU, headless false, porta casuale): per ogni scena gioca la mossa con input scritti
// (copione), una volta coi disegni vecchi (?oggetti=vecchi) e una coi nuovi, e salva fotogrammi + GIF.
//   node smash_1410/oggetti_ai/strumenti/prova.mjs [scena ...]      -> smash_look_1710/foto/oggetti_ai/<scena>_{prima,dopo}_NNN.png + <scena>.gif
// Scene: torretta, ruota, mina, cordone, barile
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = require('C:/Users/Utente/Desktop/gambler_bot/node_modules/playwright');
const QUI = path.dirname(fileURLToPath(import.meta.url));
const RADICE = path.resolve(QUI, '..', '..', '..'), FOTO = path.join(RADICE, 'smash_look_1710', 'foto', 'oggetti_ai');
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const p = path.join(RADICE, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(RADICE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TIPI[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(p).pipe(r); });
await new Promise(res => srv.listen(0, '127.0.0.1', res));
fs.mkdirSync(FOTO, { recursive: true });
// ogni scena: chi attacca, chi subisce, dove sta la vittima (in H davanti), copione dell'attaccante e della vittima (t = passo dal via),
// quanti passi, ogni quanti passi una foto
const B = { ATT: 1, SPE: 2 };
const SCENE = {
  torretta: { f: 'bot', v: 'boxer', vx: 4.5, passi: 330, ogni: 3, a: t => t < 3 ? [0, -100, 'SPE'] : null, b: () => null },
  ruota: { f: 'bot', v: 'boxer', vx: 3.2, passi: 70, ogni: 1, a: t => t < 3 ? [100, 0, 'SPE'] : null, b: () => null },
  mina: { f: 'don', v: 'boxer', vx: 2.6, passi: 230, ogni: 3, a: t => (t < 3 || (t >= 200 && t < 203)) ? [0, -100, 'SPE'] : null, b: () => null },
  cordone: { f: 'buttafuori', v: 'boxer', vx: 3.2, passi: 270, ogni: 3, a: t => t < 3 ? [0, -100, 'SPE'] : null, b: t => t > 40 && t < 110 ? [-100, 0, ''] : null },
  shuriken: { f: 'ninja', v: 'boxer', vx: 5, passi: 60, ogni: 1, a: t => (t % 8) < 3 && t < 40 ? [0, 0, 'SPE'] : null, b: () => null },
  carta: { f: 'croupier', v: 'boxer', vx: 5, passi: 60, ogni: 1, a: t => (t % 10) < 3 && t < 40 ? [0, 0, 'SPE'] : null, b: () => null },
  pallottole: { f: 'don', v: 'boxer', vx: 5, passi: 60, ogni: 1, a: t => t < 50 ? [0, 0, 'SPE'] : null, b: () => null },
  moneta: { f: 'bot', v: 'boxer', vx: 5, passi: 70, ogni: 1, a: t => (t < 3 || (t >= 30 && t < 33)) ? [0, 0, 'SPE'] : null, b: () => null },
  sfera: { f: 'veggente', v: 'boxer', vx: 5, passi: 70, ogni: 1, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  tarocco: { f: 'veggente', v: 'boxer', vx: 4, passi: 50, ogni: 1, a: t => t < 3 ? [100, 0, 'SPE'] : null, b: () => null },
  mortaio: { f: 'pirata', v: 'boxer', vx: 4, passi: 90, ogni: 1, a: t => t < 30 ? [0, 0, 'SPE'] : null, b: () => null },
  lancia: { f: 'agamennone', v: 'boxer', vx: 6, passi: 100, ogni: 2, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  pilastro: { f: 'veggente', v: 'boxer', vx: 3, passi: 80, ogni: 1, a: t => t < 3 ? [0, -100, 'SPE'] : null, b: () => null },
  rampino: { f: 'pirata', v: 'boxer', vx: 4, passi: 50, ogni: 1, a: t => t < 3 ? [100, 0, 'SPE'] : null, b: () => null },
  tronco: { f: 'ninja', v: 'boxer', vx: 0.9, passi: 70, ogni: 1, a: t => t < 3 ? [0, -100, 'SPE'] : null, b: t => t >= 2 && t < 30 ? [(t % 6) < 3 ? -100 : 0, 0, (t % 6) < 3 ? 'ATT' : ''] : null },
  ulti_bot: { f: 'bot', v: 'boxer', vx: 4, ulti: 1, passi: 260, ogni: 4, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  ulti_croupier: { f: 'croupier', v: 'boxer', vx: 4, ulti: 1, passi: 220, ogni: 4, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  ulti_pirata: { f: 'pirata', v: 'boxer', vx: 4, ulti: 1, passi: 260, ogni: 4, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  ulti_agamennone: { f: 'agamennone', v: 'boxer', vx: 4, ulti: 1, passi: 200, ogni: 4, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  ulti_don: { f: 'don', v: 'boxer', vx: 4, ulti: 1, passi: 260, ogni: 4, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  imp_boxer: { f: 'boxer', v: 'lupo', vx: 2, passi: 50, ogni: 1, a: t => t < 3 ? [100, 0, 'SPE'] : null, b: () => null },
  imp_lupo: { f: 'lupo', v: 'boxer', vx: 1.4, passi: 50, ogni: 1, a: t => t < 3 ? [100, 0, 'SPE'] : null, b: () => null },
  imp_samurai: { f: 'samurai', v: 'boxer', vx: 2.2, passi: 50, ogni: 1, a: t => t < 3 ? [100, 0, 'SPE'] : null, b: () => null },
  imp_ninja: { f: 'ninja', v: 'boxer', vx: 3, passi: 50, ogni: 1, a: t => (t % 8) < 3 && t < 30 ? [0, 0, 'SPE'] : null, b: () => null },
  imp_croupier: { f: 'croupier', v: 'boxer', vx: 3, passi: 50, ogni: 1, a: t => (t % 10) < 3 && t < 30 ? [0, 0, 'SPE'] : null, b: () => null },
  imp_agamennone: { f: 'agamennone', v: 'boxer', vx: 3.5, passi: 50, ogni: 1, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  imp_bot: { f: 'bot', v: 'boxer', vx: 3, passi: 50, ogni: 1, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  imp_don: { f: 'don', v: 'boxer', vx: 3, passi: 50, ogni: 1, a: t => t < 46 ? [0, 0, 'SPE'] : null, b: () => null },
  imp_buttafuori: { f: 'buttafuori', v: 'boxer', vx: 1.2, passi: 50, ogni: 1, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  imp_pirata: { f: 'pirata', v: 'boxer', vx: 2.5, passi: 70, ogni: 1, a: t => t < 3 ? [0, -100, 'SPE'] : null, b: () => null },
  imp_sumo: { f: 'sumo', v: 'boxer', vx: 1.8, passi: 50, ogni: 1, a: t => t < 3 ? [100, 0, 'SPE'] : null, b: () => null },
  imp_veggente: { f: 'veggente', v: 'boxer', vx: 3, passi: 50, ogni: 1, a: t => t < 3 ? [0, 0, 'SPE'] : null, b: () => null },
  barile: { f: 'pirata', v: 'boxer', vx: 3.5, passi: 120, ogni: 2, a: t => t < 3 ? [0, -100, 'SPE'] : null, b: () => null },
};
const quali = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENE);
const br = await pw.chromium.launch({ channel: 'chrome', headless: false, args: ['--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await br.newContext({ viewport: { width: 1280, height: 720 } });
const pg = await ctx.newPage(); const errori = [];
pg.on('pageerror', e => errori.push('PAGEERROR ' + e.message));
pg.on('response', r => { if (r.status() >= 400) errori.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '')); });
const esiti = {};
for (const nome of quali) {
  const sc = SCENE[nome];
  for (const modo of (process.env.MODI || 'prima,dopo').split(',')) {
    const url = `http://127.0.0.1:${srv.address().port}/smash_look_1710/gioco/index.html?f=${sc.f}&contro=${sc.v}&n=2&arena=tetto&fiche=0&voci=0&musica=0${modo.startsWith('prima') ? (process.env.PRIMA || '&oggetti=vecchi') : ''}`;
    await pg.goto(url); await pg.waitForTimeout(2500);
    await pg.evaluate(async ({ f, v }) => { const W = window.__smash; W.manuale = true; W.conf.f = f; W.conf.contro = [v]; W.conf.n = 2; W.conf.arena = 'tetto'; W.conf.fiche = false; W.conf.oggetti = false; const r0 = Math.random; Math.random = () => .4321; try { await W.avvia(); } finally { Math.random = r0; } await window.GBR.load([f, v]); }, { f: sc.f, v: sc.v });
    await pg.waitForTimeout(600);
    const info = await pg.evaluate(({ vx, a, b, ulti }) => {
      const W = window.__smash, S = W.S, GS = window.GS;
      for (let k = 0; k < 400 && S.via > 0; k++) W.avanza(1);
      W.copione = () => GS.P0; W.avanza(110);
      const A = S.L[0], V = S.L[1], H = GS.D(A).H;
      A.dir = 1; V.x = A.x + H * vx; V.dir = -1; if (ulti) A.ulti = 290;
      const fa = new Function('return ' + a)(), fb = new Function('return ' + b)(), t0 = S.t;
      const pk = r => r ? GS.pack(r[0], r[1], r[2] === 'SPE' ? GS.B.SPE : r[2] === 'ATT' ? GS.B.ATT : 0) : GS.P0;
      W.copione = (S2, i) => i === 0 ? pk(fa(S2.t - t0)) : pk(fb(S2.t - t0));
      return { H, ax: A.x, vxx: V.x };
    }, { vx: sc.vx, a: sc.a.toString(), b: sc.b.toString(), ulti: sc.ulti || 0 });
    const n = sc.passi;
    for (let t = 0; t < n; t++) {
      const colpi = await pg.evaluate(() => { window.__smash.avanza(1); const GS = window.GS; let n = 0; for (let q = 0; q < GS.nev(); q++) if (GS.EV[q].t === 'colpo' || GS.EV[q].t === 'colpoKO') n++; return n; });
      if (colpi) (info.colpi = info.colpi || []).push(t);
      if (t % sc.ogni === 0) await pg.screenshot({ path: path.join(FOTO, `${nome}_${modo}_${String(t).padStart(3, '0')}.png`) });
    }
    info.hash = await pg.evaluate(() => window.GS.hash(window.__smash.S));
    esiti[nome + '_' + modo] = info;
  }
}
for (const k in esiti) if (esiti[k].colpi) console.log('colpi', k, esiti[k].colpi.join(','));
const confronto = {}, MM = (process.env.MODI || 'prima,dopo').split(','); for (const n of quali) confronto[n] = esiti[n + '_' + MM[0]].hash === esiti[n + '_' + MM[1]].hash ? 'stato identico con e senza oggetti AI' : 'STATO DIVERSO';
console.log(JSON.stringify({ confronto, errori }, null, 1));
await br.close(); srv.close();
