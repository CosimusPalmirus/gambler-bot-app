// elenco.js: tutti i proiettili/oggetti (P.fo) che ciascuno dei 12 può creare, mossa per mossa (proj[] e copioni E.proj)
const GS = require('../../motore.js');
const ids = ['boxer','lupo','samurai','ninja','croupier','agamennone','bot','don','buttafuori','pirata','sumo','veggente'];
const fos = (f) => f ? [...new Set([...f.toString().matchAll(/fo:\s*'([a-z_0-9]+)'/g)].map(x => x[1]))] : [];
for (const id of ids) {
  const d = GS.L.lista.find(l => l.id === id); const out = [];
  for (const k in d.mosse) { const m = d.mosse[k]; if (!m) continue;
    const a = (m.proj || []).map(p => p.forma || p.fo); const b = [...fos(m.script), ...fos(m.suColpo), ...fos(m.suColpito)];
    const tutti = [...new Set([...a, ...b])]; if (tutti.length) out.push(k + '(' + (m.nome || '') + '): ' + tutti.join(','));
  }
  const u = GS.UL && GS.UL.perId && GS.UL.perId[id]; if (u) { const s = JSON.stringify(Object.keys(u)); out.push('ULTI ' + (u.nome || '') + ': ' + [...new Set([...fos(u.script), ...fos(u.passo), ...fos(u.colpo), ...(u.proj||[]).map(p=>p.forma)])].join(',') + ' ' + s); }
  console.log(id + ': ' + out.join(' | '));
}
