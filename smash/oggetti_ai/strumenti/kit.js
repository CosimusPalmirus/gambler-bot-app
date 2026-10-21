const GS = require('../../motore.js');
const ids = ['boxer','lupo','samurai','ninja','croupier','agamennone','bot','don','buttafuori','pirata','sumo','veggente'];
for (const id of ids) {
  const L = GS.L.lista.find(l => l.id === id); if (!L) { console.log(id, 'MANCA'); continue; }
  const d = L; const out = [];
  const M = d.mosse || d.m || d;
  for (const k of ['nspec','sspec','uspec','dspec','ulti','fsmash','dsmash','usmash','jab','ftilt','nair','fair','bair','dair','uair','dash','dtilt','utilt','presa','fthrow']) {
    const m = (GS.mossaDi ? GS.mossaDi(d, k) : null) || M[k]; if (!m) continue;
    const pj = (m.proj || []).map(p => (p.forma||p.fo) + (p.beh ? '/' + p.beh : '') + ' r=' + p.r + ' life=' + p.life);
    let src = ''; for (const f of ['script','suColpo','suColpito']) if (m[f]) { const s = m[f].toString(); const fos = [...s.matchAll(/fo:\s*'([a-z_0-9]+)'/g)].map(x=>x[1]); if (fos.length) src += ' ' + f + ':' + [...new Set(fos)].join(','); }
    if (pj.length || src || k.endsWith('spec')) out.push(`  ${k} ${m.nome||''} [${m.mec||''}] fx=${m.fx||''} ${pj.join(' | ')}${src}`);
  }
  console.log(id + ' (' + (L.nome||'') + ')'); console.log(out.join('\n'));
}
